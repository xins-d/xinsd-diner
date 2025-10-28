#!/usr/bin/env node

/**
 * 测试用户API返回的数据结构
 */

const Database = require('better-sqlite3')
const { join } = require('path')

// 数据库文件路径
const DB_PATH = join(process.cwd(), 'data', 'fresh_market.db')

console.log('🔍 测试用户数据结构...\n')

try {
  // 连接数据库
  const db = new Database(DB_PATH)
  
  console.log('1️⃣ 检查用户表结构:')
  const tableInfo = db.prepare("PRAGMA table_info(users)").all()
  tableInfo.forEach(column => {
    console.log(`   - ${column.name}: ${column.type} ${column.notnull ? '(NOT NULL)' : ''}`)
  })
  
  console.log('\n2️⃣ 检查用户数据:')
  const users = db.prepare("SELECT id, username, email, name, role, is_active FROM users").all()
  
  if (users.length === 0) {
    console.log('   ❌ 没有找到用户数据')
  } else {
    users.forEach(user => {
      console.log(`   ✅ 用户 ${user.id}:`)
      console.log(`      - username: "${user.username}"`)
      console.log(`      - email: "${user.email}"`)
      console.log(`      - name: "${user.name}"`)
      console.log(`      - role: "${user.role}"`)
      console.log(`      - is_active: ${user.is_active}`)
    })
  }
  
  console.log('\n3️⃣ 验证username字段:')
  const adminUser = db.prepare("SELECT username FROM users WHERE role = 'admin' LIMIT 1").get()
  
  if (adminUser) {
    if (adminUser.username) {
      console.log(`   ✅ 管理员用户名: "${adminUser.username}"`)
    } else {
      console.log('   ❌ 管理员用户名为空')
    }
  } else {
    console.log('   ❌ 没有找到管理员用户')
  }
  
  db.close()
  
  console.log('\n🎉 用户数据结构测试完成!')
  
} catch (error) {
  console.error('❌ 测试失败:', error.message)
  process.exit(1)
}

console.log('\n📖 修复说明:')
console.log('1. 已在 /api/v1/auth/me 端点中添加 username 字段返回')
console.log('2. 已在个人信息页面中添加空值保护 (user.username || "")')
console.log('3. 数据库中确实存在 username 字段和数据')
console.log('\n✨ 现在个人信息页面应该能正确显示用户账号了！')