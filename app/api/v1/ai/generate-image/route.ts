import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { imageManager } from '@/lib/image-manager'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// AI生图请求接口
interface GenerateImageRequest {
  itemName: string
  category: string
}

// 千问API响应接口
interface QwenResponse {
  output?: {
    choices?: Array<{
      finish_reason?: string
      message?: {
        role?: string
        content?: Array<{
          image?: string
        }>
      }
    }>
    task_metric?: {
      TOTAL?: number
      FAILED?: number
      SUCCEEDED?: number
    }
  }
  usage?: {
    width?: number
    height?: number
    image_count?: number
  }
  request_id?: string
  code?: string
  message?: string
}

// POST /api/v1/ai/generate-image - AI生成图片
export async function POST(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  try {
    const body: GenerateImageRequest = await request.json()
    const { itemName, category } = body

    if (!itemName || !category) {
      return NextResponse.json(
        createErrorResponse('商品名称和分类不能为空', 400),
        { status: 400 }
      )
    }

    // 构建提示词
    let prompt = ''
    
    if (category === '菜谱总览') {
      // 为菜谱总览生成特殊的提示词
      prompt = `生成一张精美的中式菜谱总览图片，展示${itemName}，包含多道菜品摆盘在餐桌上的俯视图，色彩丰富，食物新鲜诱人，专业美食摄影风格，高清画质`
    } else if (category === '菜品') {
      // 为单个菜品生成更精确的提示词
      const cleanDishName = itemName.replace(/[^\u4e00-\u9fa5a-zA-Z]/g, '').trim()
      prompt = `请生成一张${cleanDishName}的高清美食图片。要求：1.展示完整的${cleanDishName}成品菜肴；2.菜品摆盘精美，色彩鲜艳；3.使用白色或浅色餐具；4.简洁干净的背景；5.专业美食摄影风格；6.菜品特征明显，易于识别为${cleanDishName}；7.光线充足，画质清晰。请确保生成的图片确实是${cleanDishName}这道菜。`
    } else {
      // 默认提示词
      prompt = `帮我生成一张类别是${itemName}的${category}的图片`
    }

    // 调用千问API
    const qwenApiKey = process.env.QWEN_API_KEY
    if (!qwenApiKey) {
      return NextResponse.json(
        createErrorResponse('千问AI API密钥未配置', 500),
        { status: 500 }
      )
    }

    const qwenResponse = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${qwenApiKey}`
      },
      body: JSON.stringify({
        model: "qwen-image-plus",
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  text: prompt
                }
              ]
            }
          ]
        },
        parameters: {
          negative_prompt: "",
          prompt_extend: true,
          watermark: true,
          size: "1472*1140"
        }
      })
    })

    if (!qwenResponse.ok) {
      const errorText = await qwenResponse.text()
      console.error('千问API调用失败:', {
        status: qwenResponse.status,
        statusText: qwenResponse.statusText,
        error: errorText
      })
      
      // 根据错误状态码提供更具体的错误信息
      if (qwenResponse.status === 400) {
        return NextResponse.json(
          createErrorResponse('请求参数错误，请检查API密钥或请求格式', 400),
          { status: 400 }
        )
      } else if (qwenResponse.status === 401) {
        return NextResponse.json(
          createErrorResponse('API密钥无效，请检查QWEN_API_KEY配置', 401),
          { status: 401 }
        )
      } else if (qwenResponse.status === 403) {
        return NextResponse.json(
          createErrorResponse('API访问被拒绝，请检查API密钥权限', 403),
          { status: 403 }
        )
      } else if (qwenResponse.status === 429) {
        return NextResponse.json(
          createErrorResponse('API调用频率超限，请稍后重试', 429),
          { status: 429 }
        )
      } else {
        return NextResponse.json(
          createErrorResponse(`AI生图服务暂时不可用 (${qwenResponse.status})`, 500),
          { status: 500 }
        )
      }
    }

    const qwenData: QwenResponse = await qwenResponse.json()

    // 检查响应是否成功
    if (qwenData.code && qwenData.code !== '200') {
      console.error('千问API返回错误:', qwenData.code, qwenData.message)
      return NextResponse.json(
        createErrorResponse(qwenData.message || 'AI生图失败', 500),
        { status: 500 }
      )
    }

    // 提取图片URL
    const imageUrl = qwenData.output?.choices?.[0]?.message?.content?.[0]?.image

    if (!imageUrl) {
      console.error('千问API响应中没有图片URL:', qwenData)
      return NextResponse.json(
        createErrorResponse('生成的图片URL无效', 500),
        { status: 500 }
      )
    }

    // 下载图片
    console.log('开始下载AI生成的图片:', imageUrl)
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      console.error('下载AI生成的图片失败:', imageResponse.status, imageResponse.statusText)
      return NextResponse.json(
        createErrorResponse('下载生成的图片失败', 500),
        { status: 500 }
      )
    }

    // 获取图片数据并保存为临时图片
    const imageBuffer = await imageResponse.arrayBuffer()
    const buffer = Buffer.from(imageBuffer)
    
    // 使用图片管理器保存临时图片
    const tempImageUrl = await imageManager.saveTempImage(buffer, 'ai-generated-image.png')

    return NextResponse.json(
      createSuccessResponse({
        imageUrl: tempImageUrl,
        originalUrl: imageUrl,
        prompt,
        generatedAt: new Date().toISOString(),
        usage: qwenData.usage,
        isTemporary: true
      })
    )

  } catch (error) {
    console.error('AI生图API错误:', error)
    return NextResponse.json(
      createErrorResponse('服务器内部错误', 500),
      { status: 500 }
    )
  }
}