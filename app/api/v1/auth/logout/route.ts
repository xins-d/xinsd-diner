import { NextRequest, NextResponse } from 'next/server'
import { getSessionIdFromRequest, logoutUser, clearSessionCookie } from '@/lib/auth'

// POST /api/v1/auth/logout - 用户登出
export async function POST(request: NextRequest) {
  try {
    // 获取会话ID
    const sessionId = getSessionIdFromRequest(request)
    
    if (sessionId) {
      // 销毁会话
      await logoutUser(sessionId)
    }
    
    // 创建响应并清除Cookie
    const response = NextResponse.json(
      {
        code: 200,
        message: '登出成功'
      },
      { status: 200 }
    )
    
    // 清除会话Cookie
    clearSessionCookie(response)
    
    return response
  } catch (error) {
    console.error('登出API错误:', error)
    
    // 即使出错也要清除Cookie
    const response = NextResponse.json(
      {
        code: 200,
        message: '登出成功'
      },
      { status: 200 }
    )
    
    clearSessionCookie(response)
    return response
  }
}