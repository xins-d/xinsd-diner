#!/usr/bin/env node

/**
 * 测试数据库连接
 */

async function testDbConnection() {
  console.log('🔍 测试数据库连接...\n')

  try {
    // 测试登录 API
    console.log('1️⃣ 测试登录 API...')
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

    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      console.log('✅ 登录 API 正常')
      console.log(`   用户: ${loginData.data.user.name}`)
      
      // 获取 session cookie
      const cookies = loginResponse.headers.get('set-cookie')
      console.log(`   会话: ${cookies ? '已创建' : '未创建'}`)
      
    } else {
      const errorData = await loginResponse.json()
      console.log('❌ 登录 API 失败:', errorData.message)
    }

    // 测试分类 API
    console.log('\n2️⃣ 测试分类 API...')
    const categoriesResponse = await fetch('http://localhost:3001/api/v1/categories')
    
    if (categoriesResponse.ok) {
      const categoriesData = await categoriesResponse.json()
      console.log('✅ 分类 API 正常')
      console.log(`   分类数量: ${categoriesData.data.categories.length}`)
    } else {
      console.log('❌ 分类 API 失败:', categoriesResponse.status)
    }

    console.log('\n🎉 数据库连接测试完成!')

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message)
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 请确保应用正在运行: npm run dev')
    }
  }
}

// 运行测试
if (require.main === module) {
  testDbConnection()
}

module.exports = { testDbConnection }