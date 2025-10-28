import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth'
import { queries } from '@/lib/database-sqlite'
import { verifyPassword, hashPassword, validatePasswordStrength } from '@/lib/password'

// POST /api/v1/auth/change-password - 修改密码
export async function POST(request: NextRequest) {
  try {
    // 验证用户认证
    const user = await requireAuth(request)
    if (!user) {
      return NextResponse.json(
        {
          code: 401,
          message: '请先登录',
          error: {
            type: 'UNAUTHORIZED'
          }
        },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body
    
    // 验证必填字段
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        {
          code: 400,
          message: '当前密码和新密码不能为空',
          error: {
            type: 'MISSING_FIELDS'
          }
        },
        { status: 400 }
      )
    }

    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(newPassword)
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        {
          code: 400,
          message: passwordValidation.message || '新密码强度不足',
          error: {
            type: 'WEAK_PASSWORD'
          }
        },
        { status: 400 }
      )
    }

    // 验证当前密码
    const currentPasswordHash = queries.getUserPasswordHash(user.username)
    if (!currentPasswordHash) {
      return NextResponse.json(
        {
          code: 500,
          message: '无法验证当前密码',
          error: {
            type: 'INTERNAL_ERROR'
          }
        },
        { status: 500 }
      )
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, currentPasswordHash)
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        {
          code: 400,
          message: '当前密码不正确',
          error: {
            type: 'INVALID_PASSWORD'
          }
        },
        { status: 400 }
      )
    }

    // 检查新密码是否与当前密码相同
    const isSamePassword = await verifyPassword(newPassword, currentPasswordHash)
    if (isSamePassword) {
      return NextResponse.json(
        {
          code: 400,
          message: '新密码不能与当前密码相同',
          error: {
            type: 'SAME_PASSWORD'
          }
        },
        { status: 400 }
      )
    }

    // 哈希新密码
    const newPasswordHash = await hashPassword(newPassword)

    // 更新密码
    const { db } = await import('@/lib/database-sqlite')
    const updateStmt = db.prepare('UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
    updateStmt.run(newPasswordHash, user.id)

    return NextResponse.json(
      {
        code: 200,
        message: '密码修改成功'
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('修改密码API错误:', error)
    
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