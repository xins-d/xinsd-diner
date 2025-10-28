#!/usr/bin/env node

/**
 * 图片优化功能测试脚本
 * 测试图片占位符和错误处理功能
 */

console.log('🖼️ 测试图片优化功能...\n')

// 模拟图片工具函数进行测试
function getSafeImageUrl(imageUrl, fallback = "/placeholder.svg") {
  if (!imageUrl || imageUrl.trim() === "") {
    return fallback
  }

  if (imageUrl === fallback) {
    return imageUrl
  }

  try {
    if (imageUrl.startsWith("/") || imageUrl.startsWith("./") || imageUrl.startsWith("../")) {
      return imageUrl
    }
    new URL(imageUrl)
    return imageUrl
  } catch {
    return fallback
  }
}

function getPlaceholderByType(type = "default") {
  const placeholders = {
    item: "/placeholder.svg",
    category: "/placeholder.svg", 
    recipe: "/placeholder.svg",
    user: "/placeholder-user.jpg",
    default: "/placeholder.svg"
  }
  return placeholders[type] || placeholders.default
}

function isPlaceholderImage(imageUrl) {
  if (!imageUrl) return true
  
  const placeholderPaths = [
    "/placeholder.svg",
    "/placeholder.jpg", 
    "/placeholder.png",
    "/placeholder-user.jpg",
    "/placeholder-logo.svg",
    "/placeholder-logo.png"
  ]
  
  return placeholderPaths.some(path => imageUrl.includes(path))
}

// 测试 getSafeImageUrl 函数
console.log('1️⃣ 测试 getSafeImageUrl 函数:')

const testCases = [
  { input: null, expected: '/placeholder.svg', description: 'null 输入' },
  { input: '', expected: '/placeholder.svg', description: '空字符串输入' },
  { input: '   ', expected: '/placeholder.svg', description: '空白字符串输入' },
  { input: '/uploads/test.jpg', expected: '/uploads/test.jpg', description: '有效的相对路径' },
  { input: 'https://example.com/image.jpg', expected: 'https://example.com/image.jpg', description: '有效的绝对URL' },
  { input: 'invalid-url', expected: '/placeholder.svg', description: '无效的URL格式' },
  { input: '/placeholder.svg', expected: '/placeholder.svg', description: '已经是占位符' }
]

testCases.forEach(({ input, expected, description }) => {
  const result = getSafeImageUrl(input)
  const status = result === expected ? '✅' : '❌'
  console.log(`   ${status} ${description}: "${input}" -> "${result}"`)
})

console.log('\n2️⃣ 测试 getPlaceholderByType 函数:')

const placeholderTypes = ['item', 'category', 'recipe', 'user', 'default']
placeholderTypes.forEach(type => {
  const placeholder = getPlaceholderByType(type)
  console.log(`   ✅ ${type}: ${placeholder}`)
})

console.log('\n3️⃣ 测试 isPlaceholderImage 函数:')

const placeholderTestCases = [
  { input: null, expected: true, description: 'null 输入' },
  { input: '', expected: true, description: '空字符串' },
  { input: '/placeholder.svg', expected: true, description: '标准占位符' },
  { input: '/placeholder-user.jpg', expected: true, description: '用户占位符' },
  { input: '/uploads/real-image.jpg', expected: false, description: '真实图片' },
  { input: 'https://example.com/image.jpg', expected: false, description: '外部图片' }
]

placeholderTestCases.forEach(({ input, expected, description }) => {
  const result = isPlaceholderImage(input)
  const status = result === expected ? '✅' : '❌'
  console.log(`   ${status} ${description}: "${input}" -> ${result}`)
})

console.log('\n🎉 图片优化功能测试完成!')

// 输出使用示例
console.log('\n📖 使用示例:')
console.log(`
// 在组件中使用 OptimizedImage
import { OptimizedImage } from "@/components/optimized-image"

<OptimizedImage
  src={item.image}
  alt={item.name}
  fill
  aspectRatio="4/3"
  imageType="item"
  className="object-cover"
/>

// 在普通 img 标签中使用工具函数
import { getSafeImageUrl } from "@/lib/image-utils"

<img 
  src={getSafeImageUrl(item.image)} 
  alt={item.name} 
  className="w-full h-full object-cover" 
/>
`)

console.log('✨ 优化功能特性:')
console.log('   • 自动占位符处理')
console.log('   • 图片加载状态显示')
console.log('   • 错误处理和重试')
console.log('   • 响应式图片支持')
console.log('   • 类型化占位符')
console.log('   • 统一的图片工具函数')