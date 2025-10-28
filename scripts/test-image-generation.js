#!/usr/bin/env node

/**
 * 测试图片生成功能
 */

async function testImageGeneration() {
  console.log('🖼️ 测试图片生成功能...\n')

  try {
    // 1. 测试登录获取会话
    console.log('1️⃣ 获取认证会话...')
    const loginResponse = await fetch('http://localhost:3001/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin'
      })
    })

    let sessionCookie = null
    if (loginResponse.ok) {
      const cookies = loginResponse.headers.get('set-cookie')
      if (cookies) {
        const sessionMatch = cookies.match(/session_id=([^;]+)/)
        if (sessionMatch) {
          sessionCookie = `session_id=${sessionMatch[1]}`
          console.log('✅ 会话获取成功')
        }
      }
    } else {
      console.log('❌ 登录失败')
      return
    }

    // 2. 测试AI图片生成API
    console.log('\n2️⃣ 测试AI图片生成API...')
    const imageResponse = await fetch('http://localhost:3001/api/v1/ai/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        itemName: '西红柿炒鸡蛋',
        category: '菜品'
      })
    })

    if (imageResponse.ok) {
      const imageData = await imageResponse.json()
      console.log('✅ AI图片生成成功')
      console.log(`   图片URL: ${imageData.data.imageUrl}`)
      console.log(`   是否为临时图片: ${imageData.data.isTemporary}`)
      
      // 验证图片是否可访问
      const imageUrl = imageData.data.imageUrl.startsWith('/') 
        ? `http://localhost:3001${imageData.data.imageUrl}`
        : imageData.data.imageUrl
      
      const imageCheckResponse = await fetch(imageUrl, { method: 'HEAD' })
      if (imageCheckResponse.ok) {
        console.log('✅ 生成的图片可正常访问')
      } else {
        console.log('❌ 生成的图片无法访问:', imageCheckResponse.status)
      }
    } else {
      const errorData = await imageResponse.json()
      console.log('❌ AI图片生成失败:', errorData.message)
    }

    // 3. 测试菜谱生成API
    console.log('\n3️⃣ 测试菜谱生成API...')
    const recipeResponse = await fetch('http://localhost:3001/api/v1/recipes/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': sessionCookie
      },
      body: JSON.stringify({
        cart_items: [
          { id: 1, name: '西红柿', description: '新鲜的西红柿' },
          { id: 2, name: '鸡蛋', description: '新鲜鸡蛋' }
        ],
        requirements: {
          dish_count: 1,
          spice_level: '不辣'
        },
        generate_images: true
      })
    })

    if (recipeResponse.ok) {
      const recipeData = await recipeResponse.json()
      console.log('✅ 菜谱生成成功')
      console.log(`   生成的图片数量: ${recipeData.data.images_generated}`)
      console.log(`   菜谱ID: ${recipeData.data.recipe_id}`)
      
      // 检查菜谱内容中的图片
      const imageMatches = recipeData.data.recipe_content.match(/!\[([^\]]*)\]\(([^)]+)\)/g)
      if (imageMatches) {
        console.log(`   菜谱中包含 ${imageMatches.length} 张图片:`)
        imageMatches.forEach((match, index) => {
          const urlMatch = match.match(/\(([^)]+)\)/)
          if (urlMatch) {
            console.log(`     ${index + 1}. ${urlMatch[1]}`)
          }
        })
        
        // 验证第一张图片是否可访问
        const firstImageMatch = imageMatches[0].match(/\(([^)]+)\)/)
        if (firstImageMatch) {
          const firstImageUrl = firstImageMatch[1].startsWith('/') 
            ? `http://localhost:3001${firstImageMatch[1]}`
            : firstImageMatch[1]
          
          const firstImageCheckResponse = await fetch(firstImageUrl, { method: 'HEAD' })
          if (firstImageCheckResponse.ok) {
            console.log('✅ 菜谱中的图片可正常访问')
          } else {
            console.log('❌ 菜谱中的图片无法访问:', firstImageCheckResponse.status)
          }
        }
      } else {
        console.log('❌ 菜谱中没有检测到图片')
      }
    } else {
      const errorData = await recipeResponse.json()
      console.log('❌ 菜谱生成失败:', errorData.message)
    }

    // 4. 检查环境变量
    console.log('\n4️⃣ 检查环境变量配置...')
    const hasQwenKey = process.env.QWEN_API_KEY ? '✅' : '❌'
    const hasGeminiKey = process.env.GOOGLE_GEMINI_API_KEY ? '✅' : '❌'
    
    console.log(`   Qwen API Key: ${hasQwenKey}`)
    console.log(`   Gemini API Key: ${hasGeminiKey}`)

    console.log('\n🎉 图片生成功能测试完成!')

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 请确保应用正在运行: npm run dev')
    }
  }
}

// 运行测试
if (require.main === module) {
  testImageGeneration()
}

module.exports = { testImageGeneration }