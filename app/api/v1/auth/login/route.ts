import { NextRequest, NextResponse } from 'next/server'
import { loginUser, setSessionCookie, type LoginCredentials } from '@/lib/auth'

// POST /api/v1/auth/login - 用户登录
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, password, rememberMe = false } = body as LoginCredentials
    
    // 验证必填字段
    if (!username || !password) {
      return NextResponse.json(
        {
          code: 400,
          message: '用户名和密码不能为空',
          error: {
            type: 'MISSING_FIELDS'
          }
        },
        { status: 400 }
      )
    }
    
    // 调用登录函数
    const result = await loginUser({
      username: username.trim(),
      password,
      rememberMe
    })
    
    if (!result.success) {
      const statusCode = result.error?.type === 'USER_INACTIVE' ? 403 : 401
      
      return NextResponse.json(
        {
          code: statusCode,
          message: result.error?.message || '登录失败',
          error: {
            type: result.error?.type || 'LOGIN_FAILED',
            field: result.error?.field
          }
        },
        { status: statusCode }
      )
    }
    
    // 登录成功，创建响应并设置会话Cookie
    const response = NextResponse.json(
      {
        code: 200,
        message: '登录成功',
        data: {
          user: {
            id: result.user!.id,
            username: result.user!.username,
            email: result.user!.email,
            name: result.user!.name,
            role: result.user!.role,
            lastLoginAt: result.user!.lastLoginAt
          }
        }
      },
      { status: 200 }
    )
    
    // 设置会话Cookie
    if (result.sessionId) {
      setSessionCookie(response, result.sessionId, rememberMe)
    }
    
    return response
  } catch (error) {
    console.error('登录API错误:', error)
    
    return NextResponse.json(
      {
        code: 500,
        message: '服务器内部错误',
        error: {
          type: 'INTERNAL_ERROR'
        }
      },
      { status: 500 }
    )
  }
}