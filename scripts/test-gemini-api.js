#!/usr/bin/env node

/**
 * 测试Google Gemini API调用
 */

require('dotenv').config({ path: '.env.local' })

async function testGeminiAPI() {
  console.log('🧪 测试Google Gemini API...\n')

  const apiKey = process.env.GOOGLE_GEMINI_API_KEY
  
  if (!apiKey) {
    console.error('❌ GOOGLE_GEMINI_API_KEY 环境变量未设置')
    return
  }

  console.log('🔑 API密钥已配置')
  console.log(`   密钥前缀: ${apiKey.substring(0, 10)}...`)

  // 测试简单的API调用
  const testPrompt = '请生成一个简单的西红柿炒鸡蛋菜谱'

  try {
    console.log('\n📡 发送测试请求...')
    console.log(`   提示词: ${testPrompt}`)

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'x-goog-api-key': apiKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: testPrompt
              }
            ]
          }
        ]
      })
    })

    console.log(`\n📊 响应状态: ${response.status} ${response.statusText}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ API调用失败:')
      console.error(`   状态码: ${response.status}`)
      console.error(`   错误信息: ${errorText}`)
      
      // 提供解决建议
      if (response.status === 400) {
        console.log('\n💡 解决建议:')
        console.log('   - 检查请求格式是否正确')
        console.log('   - 确认模型名称是否有效')
        console.log('   - 验证请求参数')
      } else if (response.status === 401) {
        console.log('\n💡 解决建议:')
        console.log('   - 检查API密钥是否正确')
        console.log('   - 确认API密钥是否已激活')
      } else if (response.status === 403) {
        console.log('\n💡 解决建议:')
        console.log('   - 检查API密钥权限')
        console.log('   - 确认是否启用了Gemini API服务')
      }
      return
    }

    const data = await response.json()
    console.log('\n✅ API调用成功!')
    
    // 提取生成的文本
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text
    
    if (generatedText) {
      console.log('\n📝 生成的内容:')
      console.log(generatedText.substring(0, 200) + (generatedText.length > 200 ? '...' : ''))
    } else {
      console.log('\n⚠️  响应中没有生成的文本')
      console.log('   完整响应:', JSON.stringify(data, null, 2))
    }

    // 显示使用统计
    if (data.usageMetadata) {
      console.log('\n📊 使用统计:')
      console.log(`   输入Token: ${data.usageMetadata.promptTokenCount || 0}`)
      console.log(`   输出Token: ${data.usageMetadata.candidatesTokenCount || 0}`)
      console.log(`   总Token: ${data.usageMetadata.totalTokenCount || 0}`)
    }

  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message)
    console.log('\n💡 可能的原因:')
    console.log('   - 网络连接问题')
    console.log('   - API服务暂时不可用')
    console.log('   - 请求超时')
  }
}

// 运行测试
testGeminiAPI()