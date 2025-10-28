import { NextRequest } from 'next/server'
import { withDatabaseConnection, parseRequestBody } from '@/lib/api-utils-sqlite'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { queries } from '@/lib/database-sqlite'
import { imageManager } from '@/lib/image-manager'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// 谷歌Gemini API响应接口
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
      role?: string
    }
    finishReason?: string
    index?: number
  }>
  usageMetadata?: {
    promptTokenCount?: number
    candidatesTokenCount?: number
    totalTokenCount?: number
  }
  modelVersion?: string
  responseId?: string
}

// 从菜谱内容中提取菜品名称
function extractDishNames(recipeContent: string): string[] {
  const dishNames: string[] = []
  
  console.log('开始提取菜品名称，菜谱内容预览:', recipeContent.substring(0, 500))
  
  // 匹配Markdown标题格式的菜品名称
  const titleMatches = recipeContent.match(/^#{2,3}\s*(.+?)$/gm)
  if (titleMatches) {
    console.log('找到的标题:', titleMatches)
    titleMatches.forEach(match => {
      let cleanName = match
        .replace(/^#{2,3}\s*/, '') // 移除 ## 或 ###
        .replace(/^\d+\.?\s*/, '') // 移除数字编号
        .trim()
      
      console.log('处理标题:', match, '-> 清理后:', cleanName)
      
      // 先应用模式匹配，提取真正的菜品名称
      const patterns = [
        /^[一二三四五六七八九十、]+[、，,]?\s*(.+)/, // 匹配 "一、菜品名称"
        /^菜品[一二三四五六七八九十]*[、：:]\s*(.+)/, // 匹配 "菜品一：菜品名称"
        /^主菜[一二三四五六七八九十]*[、：:]\s*(.+)/, // 匹配 "主菜一：菜品名称"
        /^汤品[、：:]\s*(.+)/, // 匹配 "汤品：菜品名称"
        /^(.+?)[（(].*[）)]$/, // 提取括号前的内容
        /^菜品名称[：:]?\s*(.+)/, // 匹配 "菜品名称：西红柿炒鸡蛋"
        /^菜名[：:]?\s*(.+)/, // 匹配 "菜名：西红柿炒鸡蛋"
      ]
      
      for (const pattern of patterns) {
        const patternMatch = cleanName.match(pattern)
        if (patternMatch) {
          cleanName = patternMatch[1].trim()
          console.log('模式匹配成功:', pattern, '-> 结果:', cleanName)
          break
        }
      }
      
      // 最后清理特殊字符
      cleanName = cleanName
        .replace(/[*_`【】\[\]()（）:：]/g, '') // 移除特殊字符
        .replace(/\s*\([^)]*\)\s*$/, '') // 移除末尾的括号内容
        .trim()
      
      // 过滤掉非菜品名称的标题
      const excludePatterns = [
        /^(菜单|菜谱|做法|步骤|材料|食材|准备|说明|注意|提示|概览|总览|介绍|制作|烹饪|方法|特点|营养|功效|适宜|禁忌|小贴士|温馨提示|所需食材|制作步骤|烹饪技巧).*$/,
        /^[a-zA-Z\s]+$/, // 纯英文
        /^[\d\s]+$/, // 纯数字
        /^.{1,2}$/, // 太短的名称
        /^.{20,}$/, // 太长的名称
      ]
      
      const isValidDishName = !excludePatterns.some(pattern => pattern.test(cleanName))
      
      console.log('菜品名称验证:', cleanName, '是否有效:', isValidDishName)
      
      if (cleanName && isValidDishName && cleanName.length >= 3 && cleanName.length <= 20) {
        dishNames.push(cleanName)
      }
    })
  }
  
  // 如果没有找到标题格式，尝试匹配其他格式
  if (dishNames.length === 0) {
    console.log('未找到标题格式，尝试匹配粗体文本')
    const boldMatches = recipeContent.match(/\*\*([^*]+)\*\*/g)
    if (boldMatches) {
      console.log('找到的粗体文本:', boldMatches)
      boldMatches.forEach(match => {
        const cleanName = match
          .replace(/\*\*/g, '')
          .replace(/^\d+\.?\s*/, '')
          .trim()
        
        // 应用相同的过滤逻辑
        const excludePatterns = [
          /^(菜单|菜谱|做法|步骤|材料|食材|准备|说明|注意|提示|概览|总览|介绍|制作|烹饪|方法|特点|营养|功效|适宜|禁忌|小贴士|温馨提示|所需食材|制作步骤|烹饪技巧).*$/,
          /^[a-zA-Z\s]+$/,
          /^[\d\s]+$/,
          /^.{1,2}$/,
          /^.{20,}$/,
        ]
        
        const isValidDishName = !excludePatterns.some(pattern => pattern.test(cleanName))
        
        if (cleanName && isValidDishName && cleanName.length >= 3 && cleanName.length <= 20) {
          dishNames.push(cleanName)
        }
      })
    }
  }
  
  // 去重并限制数量
  const uniqueDishNames = [...new Set(dishNames)].slice(0, 3) // 最多3道菜，确保质量
  console.log('提取到的菜品名称:', uniqueDishNames)
  
  return uniqueDishNames
}

// 为所有菜品生成图片
async function generateDishImages(dishNames: string[], baseUrl: string, cookieHeader?: string): Promise<{ [key: string]: string }> {
  const dishImages: { [key: string]: string } = {}
  
  // 为所有菜品生成图片，但限制数量避免API调用过多
  const maxImages = Math.min(dishNames.length, 3) // 最多生成3张图片
  
  for (let i = 0; i < maxImages; i++) {
    const dishName = dishNames[i]
    let success = false
    let retryCount = 0
    const maxRetries = 2
    
    while (!success && retryCount < maxRetries) {
      try {
        console.log(`开始为菜品"${dishName}"生成图片... (尝试 ${retryCount + 1}/${maxRetries})`)
        
        const response = await fetch(`${baseUrl}/api/v1/ai/generate-image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(cookieHeader && { 'Cookie': cookieHeader })
          },
          body: JSON.stringify({
            itemName: dishName,
            category: '菜品'
          })
        })
        
        if (response.ok) {
          const data = await response.json()
          if (data.code === 200 && data.data?.imageUrl) {
            // 验证图片URL是否可访问
            try {
              let imageUrlToVerify = data.data.imageUrl
              
              // 如果是相对路径，转换为完整URL
              if (imageUrlToVerify.startsWith('/')) {
                imageUrlToVerify = `${baseUrl}${imageUrlToVerify}`
              }
              
              const imageResponse = await fetch(imageUrlToVerify, { method: 'HEAD' })
              if (imageResponse.ok) {
                dishImages[dishName] = data.data.imageUrl
                console.log(`菜品"${dishName}"图片生成成功:`, data.data.imageUrl)
                success = true
              } else {
                console.error(`菜品"${dishName}"图片URL无法访问:`, imageResponse.status)
                retryCount++
              }
            } catch (urlError) {
              console.error(`菜品"${dishName}"图片URL验证失败:`, urlError)
              // 如果是URL验证失败，但图片已经保存成功，我们仍然认为是成功的
              if (data.data.imageUrl) {
                console.log(`跳过URL验证，直接使用图片:`, data.data.imageUrl)
                dishImages[dishName] = data.data.imageUrl
                success = true
              } else {
                retryCount++
              }
            }
          } else {
            console.error(`菜品"${dishName}"图片生成失败:`, data.message)
            retryCount++
          }
        } else {
          console.error(`菜品"${dishName}"图片生成请求失败:`, response.status)
          retryCount++
        }
      } catch (error) {
        console.error(`菜品"${dishName}"图片生成异常:`, error)
        retryCount++
      }
      
      // 如果失败且还有重试机会，等待后重试
      if (!success && retryCount < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000))
      }
    }
    
    // 添加延迟避免API调用过于频繁
    if (i < maxImages - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500))
    }
  }
  
  console.log(`图片生成完成，成功生成 ${Object.keys(dishImages).length} 张图片`)
  return dishImages
}

// 将图片插入到菜谱内容中
function insertImagesIntoRecipe(recipeContent: string, dishImages: { [key: string]: string }): string {
  let updatedContent = recipeContent
  
  console.log('开始插入图片，菜品图片映射:', dishImages)
  
  // 为每个菜品插入图片
  Object.entries(dishImages).forEach(([dishName, imageUrl]) => {
    console.log(`尝试为菜品"${dishName}"插入图片: ${imageUrl}`)
    
    // 转义特殊字符用于正则表达式
    const escapedDishName = dishName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    // 尝试多种匹配模式
    let inserted = false
    
    // 1. 匹配 ## 或 ### 开头的标题（包含菜品名称）
    const titleRegex = new RegExp(`(^#{2,3}\\s*.*?${escapedDishName}.*?)$`, 'gm')
    const titleMatches = updatedContent.match(titleRegex)
    
    if (titleMatches && titleMatches.length > 0) {
      console.log(`找到标题匹配: ${titleMatches[0]}`)
      updatedContent = updatedContent.replace(titleRegex, (match) => {
        if (!updatedContent.includes(`![${dishName}](${imageUrl})`)) {
          console.log(`在标题后插入图片: ${match}`)
          inserted = true
          return `${match}\n\n![${dishName}](${imageUrl})\n`
        }
        return match
      })
    }
    
    // 2. 如果没有找到标题，尝试在菜谱开头插入
    if (!inserted && !updatedContent.includes(`![${dishName}](${imageUrl})`)) {
      console.log(`未找到匹配标题，在菜谱开头插入图片`)
      // 在第一个 ## 标题后插入
      const firstHeaderRegex = /^(#{1,2}\s*.+?)$/m
      const firstHeaderMatch = updatedContent.match(firstHeaderRegex)
      
      if (firstHeaderMatch) {
        updatedContent = updatedContent.replace(firstHeaderRegex, (match) => {
          return `${match}\n\n![${dishName}](${imageUrl})\n`
        })
        inserted = true
      } else {
        // 如果没有找到标题，在内容开头插入
        updatedContent = `![${dishName}](${imageUrl})\n\n${updatedContent}`
        inserted = true
      }
    }
    
    console.log(`菜品"${dishName}"图片插入${inserted ? '成功' : '失败'}`)
  })
  
  console.log('图片插入完成，检查结果:', updatedContent.includes('!['))
  
  return updatedContent
}

// 使用谷歌Gemini API生成菜谱
async function generateRecipeWithGemini(cart_items: any[], requirements: any): Promise<string> {
  const ingredientNames = cart_items.map(item => item.name).join('、')
  
  // 构建提示词
  let prompt = `需要你根据以下食物生成一个符合要求的菜单，菜单包含菜品名称、菜品做法，可适当添加其他部分辅助用料，如：葱姜蒜、鸡蛋等。最终以markdown的格式返回。`
  
  prompt += `菜品：${ingredientNames}`
  
  // 添加要求
  const requirementParts = []
  if (requirements?.dish_count || requirements?.soup_count) {
    const dishCount = requirements.dish_count || 0
    const soupCount = requirements.soup_count || 0
    if (dishCount > 0 && soupCount > 0) {
      requirementParts.push(`${dishCount}菜${soupCount}汤`)
    } else if (dishCount > 0) {
      requirementParts.push(`${dishCount}道菜`)
    } else if (soupCount > 0) {
      requirementParts.push(`${soupCount}道汤`)
    }
  }
  
  if (requirements?.spice_level) {
    requirementParts.push(`辣度：${requirements.spice_level}`)
  }
  
  if (requirements?.restrictions) {
    requirementParts.push(`忌口：${requirements.restrictions}`)
  }
  
  if (requirements?.other_requirements) {
    requirementParts.push(`其他要求：${requirements.other_requirements}`)
  }
  
  if (requirementParts.length > 0) {
    prompt += `，要求：${requirementParts.join('，')}`
  }
  
  console.log('发送给Gemini的提示词:', prompt)
  
  // 调用谷歌Gemini API
  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY
  if (!geminiApiKey) {
    throw new Error('Google Gemini API密钥未配置')
  }

  const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
    method: 'POST',
    headers: {
      'x-goog-api-key': geminiApiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            {
              text: prompt
            }
          ]
        }
      ]
    })
  })
  
  if (!geminiResponse.ok) {
    const errorText = await geminiResponse.text()
    console.error('Gemini API调用失败:', {
      status: geminiResponse.status,
      statusText: geminiResponse.statusText,
      error: errorText
    })
    
    // 根据错误状态码提供更具体的错误信息
    if (geminiResponse.status === 400) {
      throw new Error('请求参数错误，请检查API密钥或请求格式')
    } else if (geminiResponse.status === 401) {
      throw new Error('API密钥无效，请检查GOOGLE_GEMINI_API_KEY配置')
    } else if (geminiResponse.status === 403) {
      throw new Error('API访问被拒绝，请检查API密钥权限')
    } else if (geminiResponse.status === 429) {
      throw new Error('API调用频率超限，请稍后重试')
    } else {
      throw new Error(`菜谱生成服务暂时不可用 (${geminiResponse.status})`)
    }
  }
  
  const geminiData: GeminiResponse = await geminiResponse.json()
  
  // 提取生成的文本
  const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text
  
  if (!generatedText) {
    console.error('Gemini API响应中没有生成的文本:', geminiData)
    throw new Error('菜谱生成失败，请重试')
  }
  
  console.log('Gemini API使用统计:', geminiData.usageMetadata)
  
  return generatedText
}



// POST /api/v1/recipes/generate - 生成菜谱
export async function POST(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  return withDatabaseConnection(async () => {
    const body = await parseRequestBody(request)
    const { cart_items, requirements, generate_images = true } = body

    if (!cart_items || !Array.isArray(cart_items) || cart_items.length === 0) {
      return createErrorResponse('菜篮子不能为空', 400)
    }

    // 验证菜篮子商品格式
    for (const item of cart_items) {
      if (!item.name) {
        return createErrorResponse('菜篮子商品信息不完整', 400)
      }
    }

    try {
      // 使用谷歌Gemini API生成菜谱
      let recipe_content = await generateRecipeWithGemini(cart_items, requirements || {})
      
      let dish_images: { [key: string]: string } = {}
      
      // 如果启用图片生成
      if (generate_images) {
        try {
          console.log('开始为菜谱生成图片...')
          
          // 提取菜品名称
          const dishNames = extractDishNames(recipe_content)
          
          if (dishNames.length > 0) {
            // 获取基础URL和认证信息
            const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`
            const cookieHeader = request.headers.get('cookie')
            
            // 为菜品生成图片
            dish_images = await generateDishImages(dishNames, baseUrl, cookieHeader || undefined)
            
            // 将图片插入到菜谱中
            if (Object.keys(dish_images).length > 0) {
              recipe_content = insertImagesIntoRecipe(recipe_content, dish_images)
              console.log(`成功为 ${Object.keys(dish_images).length} 道菜生成了图片`)
              console.log('插入图片后的菜谱内容预览:', recipe_content.substring(0, 500))
              
              // 验证图片是否成功插入
              const imageMatches = recipe_content.match(/!\[([^\]]*)\]\(([^)]+)\)/g)
              console.log(`菜谱中检测到的图片数量: ${imageMatches ? imageMatches.length : 0}`)
            }
          }
        } catch (imageError) {
          console.error('图片生成失败，但菜谱生成成功:', imageError)
          // 图片生成失败不影响菜谱生成
        }
      }

      // 保存菜谱到数据库
      const saveResult = await queries.saveRecipe({
        cart_items,
        requirements: requirements || {},
        recipe_content
      })

      // 将临时图片转为菜谱图片
      const finalDishImages: { [key: string]: string } = {}
      for (const [dishName, tempUrl] of Object.entries(dish_images)) {
        try {
          const recipeImageUrl = await imageManager.moveToRecipe(tempUrl, saveResult.recipe_id)
          finalDishImages[dishName] = recipeImageUrl
          
          // 更新菜谱内容中的图片URL - 使用全局替换
          recipe_content = recipe_content.replace(new RegExp(tempUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), recipeImageUrl)
          console.log(`图片URL已更新: ${tempUrl} -> ${recipeImageUrl}`)
        } catch (error) {
          console.error(`移动图片失败: ${tempUrl}`, error)
          // 如果移动失败，保持原URL
          finalDishImages[dishName] = tempUrl
        }
      }

      // 更新菜谱内容（如果图片URL有变化）
      if (Object.keys(finalDishImages).length > 0) {
        await queries.updateRecipeContent(saveResult.recipe_id, recipe_content)
      }

      return createSuccessResponse({
        recipe_content,
        dish_images: finalDishImages,
        generated_at: new Date().toISOString(),
        recipe_id: saveResult.recipe_id,
        images_generated: Object.keys(finalDishImages).length
      }, '菜谱生成成功')
    } catch (error) {
      console.error('菜谱生成失败:', error)
      return createErrorResponse(
        error instanceof Error ? error.message : '菜谱生成失败，请重试',
        500
      )
    }
  })
}