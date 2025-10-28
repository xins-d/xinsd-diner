#!/usr/bin/env node

/**
 * 验证应用配置脚本
 */

require('dotenv').config({ path: '.env.local' })

const fs = require('fs')
const path = require('path')

function validateConfig() {
  console.log('🔧 验证应用配置...\n')

  // 检查环境变量文件
  const envLocalPath = path.join(process.cwd(), '.env.local')
  const envExamplePath = path.join(process.cwd(), '.env.example')

  console.log('📁 环境变量文件检查:')
  console.log(`   .env.example: ${fs.existsSync(envExamplePath) ? '✅ 存在' : '❌ 不存在'}`)
  console.log(`   .env.local: ${fs.existsSync(envLocalPath) ? '✅ 存在' : '⚠️  不存在 (可选)'}`)

  // 检查必要的环境变量
  console.log('\n🔑 API密钥配置:')
  const qwenApiKey = process.env.QWEN_API_KEY
  const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY

  // 检查API密钥有效性
  const isValidQwenKey = qwenApiKey && !qwenApiKey.startsWith('your_') && qwenApiKey !== 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' && qwenApiKey.startsWith('sk-')
  const isValidGeminiKey = geminiApiKey && !geminiApiKey.startsWith('your_') && geminiApiKey !== 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx' && geminiApiKey.startsWith('AIzaSy')

  console.log(`   QWEN_API_KEY: ${isValidQwenKey ? '✅ 已配置' : qwenApiKey ? '⚠️  配置无效 (请填入真实密钥)' : '⚠️  未配置 (AI生图功能将不可用)'}`)
  console.log(`   GOOGLE_GEMINI_API_KEY: ${isValidGeminiKey ? '✅ 已配置' : geminiApiKey ? '⚠️  配置无效 (请填入真实密钥)' : '⚠️  未配置 (菜谱生成功能将不可用)'}`)

  // 检查图片存储配置
  console.log('\n📂 图片存储配置:')
  const uploadBasePath = process.env.UPLOAD_BASE_PATH || 'uploads'
  const tempImagesPath = process.env.TEMP_IMAGES_PATH || 'temp'
  const recipeImagesPath = process.env.RECIPE_IMAGES_PATH || 'recipes'
  const itemImagesPath = process.env.ITEM_IMAGES_PATH || 'items'
  const categoryImagesPath = process.env.CATEGORY_IMAGES_PATH || 'categories'

  console.log(`   UPLOAD_BASE_PATH: ${uploadBasePath} ${process.env.UPLOAD_BASE_PATH ? '(自定义)' : '(默认)'}`)
  console.log(`   TEMP_IMAGES_PATH: ${tempImagesPath} ${process.env.TEMP_IMAGES_PATH ? '(自定义)' : '(默认)'}`)
  console.log(`   RECIPE_IMAGES_PATH: ${recipeImagesPath} ${process.env.RECIPE_IMAGES_PATH ? '(自定义)' : '(默认)'}`)
  console.log(`   ITEM_IMAGES_PATH: ${itemImagesPath} ${process.env.ITEM_IMAGES_PATH ? '(自定义)' : '(默认)'}`)
  console.log(`   CATEGORY_IMAGES_PATH: ${categoryImagesPath} ${process.env.CATEGORY_IMAGES_PATH ? '(自定义)' : '(默认)'}`)

  // 检查图片目录
  console.log('\n📁 图片目录检查:')
  const publicDir = path.join(process.cwd(), 'public')
  const uploadsDir = path.join(publicDir, uploadBasePath)
  const tempDir = path.join(uploadsDir, tempImagesPath)
  const recipeDir = path.join(uploadsDir, recipeImagesPath)
  const itemDir = path.join(uploadsDir, itemImagesPath)
  const categoryDir = path.join(uploadsDir, categoryImagesPath)

  const directories = [
    { name: 'public', path: publicDir },
    { name: 'uploads', path: uploadsDir },
    { name: 'temp', path: tempDir },
    { name: 'recipes', path: recipeDir },
    { name: 'items', path: itemDir },
    { name: 'categories', path: categoryDir }
  ]

  directories.forEach(dir => {
    const exists = fs.existsSync(dir.path)
    console.log(`   ${dir.name}目录: ${exists ? '✅ 存在' : '❌ 不存在'}`)
    
    if (!exists && dir.name !== 'public') {
      try {
        fs.mkdirSync(dir.path, { recursive: true })
        console.log(`     ✅ 已自动创建目录: ${dir.path}`)
      } catch (error) {
        console.log(`     ❌ 创建目录失败: ${error.message}`)
      }
    }
  })

  // 检查数据库
  console.log('\n💾 数据库检查:')
  const dataDir = path.join(process.cwd(), 'data')
  const dbPath = path.join(dataDir, 'fresh_market.db')

  console.log(`   data目录: ${fs.existsSync(dataDir) ? '✅ 存在' : '❌ 不存在'}`)
  console.log(`   数据库文件: ${fs.existsSync(dbPath) ? '✅ 存在' : '⚠️  不存在 (运行 npm run init:db 初始化)'}`)

  // 总结
  console.log('\n📋 配置总结:')
  const hasApiKeys = isValidQwenKey && isValidGeminiKey
  const hasDatabase = fs.existsSync(dbPath)
  const hasDirectories = fs.existsSync(uploadsDir)

  if (hasApiKeys && hasDatabase && hasDirectories) {
    console.log('✅ 应用配置完整，所有功能可用')
  } else {
    console.log('⚠️  应用配置不完整，部分功能可能不可用:')
    if (!hasApiKeys) {
      console.log('   - AI功能需要配置有效的API密钥')
      console.log('   - 请参考 API_KEYS_GUIDE.md 获取API密钥')
    }
    if (!hasDatabase) {
      console.log('   - 数据库需要初始化 (npm run init:db)')
    }
    if (!hasDirectories) {
      console.log('   - 图片目录需要创建')
    }
  }

  console.log('\n💡 如需完整配置，请参考 .env.example 文件')
}

// 运行验证
validateConfig()