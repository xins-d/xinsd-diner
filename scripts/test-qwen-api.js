#!/usr/bin/env node

/**
 * 测试千问AI生图API调用
 */

require('dotenv').config({ path: '.env.local' })

async function testQwenAPI() {
  console.log('🧪 测试千问AI生图API...\n')

  const apiKey = process.env.QWEN_API_KEY
  
  if (!apiKey) {
    console.error('❌ QWEN_API_KEY 环境变量未设置')
    return
  }

  console.log('🔑 API密钥已配置')
  console.log(`   密钥前缀: ${apiKey.substring(0, 10)}...`)

  // 测试简单的API调用
  const testPrompt = '生成一张精美的西红柿炒鸡蛋菜品图片，展示完成的菜品摆盘，色彩鲜艳，食物新鲜诱人，专业美食摄影风格，白色餐具，简洁背景，高清画质'

  try {
    console.log('\n📡 发送测试请求...')
    console.log(`   提示词: ${testPrompt}`)

    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/multimodal-generation/generation', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "qwen-image-plus",
        input: {
          messages: [
            {
              role: "user",
              content: [
                {
                  text: testPrompt
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
        console.log('   - 确认是否启用了千问AI服务')
        console.log('   - 检查账户余额')
      }
      return
    }

    const data = await response.json()
    console.log('\n✅ API调用成功!')
    
    // 提取生成的图片URL
    const imageUrl = data.output?.choices?.[0]?.message?.content?.[0]?.image
    
    if (imageUrl) {
      console.log('\n🖼️ 生成的图片:')
      console.log(`   图片URL: ${imageUrl}`)
      
      // 测试图片下载
      try {
        const imageResponse = await fetch(imageUrl)
        if (imageResponse.ok) {
          console.log(`   图片大小: ${imageResponse.headers.get('content-length') || '未知'} bytes`)
          console.log(`   图片类型: ${imageResponse.headers.get('content-type') || '未知'}`)
        } else {
          console.log(`   ⚠️ 图片下载失败: ${imageResponse.status}`)
        }
      } catch (downloadError) {
        console.log(`   ⚠️ 图片下载测试失败: ${downloadError.message}`)
      }
    } else {
      console.log('\n⚠️ 响应中没有生成的图片URL')
      console.log('   完整响应:', JSON.stringify(data, null, 2))
    }

    // 显示使用统计
    if (data.usage) {
      console.log('\n📊 使用统计:')
      console.log(`   图片宽度: ${data.usage.width || 0}`)
      console.log(`   图片高度: ${data.usage.height || 0}`)
      console.log(`   图片数量: ${data.usage.image_count || 0}`)
    }

    // 显示任务统计
    if (data.output?.task_metric) {
      console.log('\n📈 任务统计:')
      console.log(`   总数: ${data.output.task_metric.TOTAL || 0}`)
      console.log(`   成功: ${data.output.task_metric.SUCCEEDED || 0}`)
      console.log(`   失败: ${data.output.task_metric.FAILED || 0}`)
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
testQwenAPI()