import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/v1/auth/me - 获取当前用户信息
export async function GET(request: NextRequest) {
  try {
    // 验证用户认证
    const user = await requireAuth(request)
    
    if (!user) {
      return createUnauthorizedResponse('请先登录')
    }
    
    // 返回用户信息（不包含敏感信息）
    return NextResponse.json(
      {
        code: 200,
        message: '获取用户信息成功',
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt
          }
        }
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('获取用户信息API错误:', error)
    
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