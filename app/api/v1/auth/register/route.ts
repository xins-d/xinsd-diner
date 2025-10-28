import { NextRequest, NextResponse } from 'next/server'
import { registerUser, type RegisterData } from '@/lib/auth'

// POST /api/v1/auth/register - 用户注册
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { username, email, password, confirmPassword, name } = body as RegisterData & { confirmPassword: string }
    
    // 验证必填字段
    if (!username || !email || !password || !confirmPassword || !name) {
      return NextResponse.json(
        {
          code: 400,
          message: '所有字段都不能为空',
          error: {
            type: 'MISSING_FIELDS'
          }
        },
        { status: 400 }
      )
    }
    
    // 验证密码确认
    if (password !== confirmPassword) {
      return NextResponse.json(
        {
          code: 400,
          message: '两次输入的密码不一致',
          error: {
            type: 'PASSWORD_MISMATCH',
            field: 'confirmPassword'
          }
        },
        { status: 400 }
      )
    }
    
    // 验证姓名长度
    if (name.trim().length < 2) {
      return NextResponse.json(
        {
          code: 400,
          message: '姓名至少需要2个字符',
          error: {
            type: 'INVALID_NAME',
            field: 'name'
          }
        },
        { status: 400 }
      )
    }
    
    // 调用注册函数
    const result = await registerUser({
      username: username.trim(),
      email: email.trim().toLowerCase(),
      password,
      name: name.trim()
    })
    
    if (!result.success) {
      const statusCode = result.error?.type === 'DUPLICATE_EMAIL' ? 409 : 400
      
      return NextResponse.json(
        {
          code: statusCode,
          message: result.error?.message || '注册失败',
          error: {
            type: result.error?.type || 'REGISTRATION_FAILED',
            field: result.error?.field
          }
        },
        { status: statusCode }
      )
    }
    
    // 注册成功，返回用户信息（不包含敏感信息）
    return NextResponse.json(
      {
        code: 201,
        message: '注册成功',
        data: {
          user: {
            id: result.user!.id,
            email: result.user!.email,
            name: result.user!.name,
            role: result.user!.role,
            createdAt: result.user!.createdAt
          }
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('注册API错误:', error)
    
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