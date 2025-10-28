import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection, parseRequestBody } from '@/lib/api-utils-sqlite'
import { createSuccessResponse, createErrorResponse, validateRequired } from '@/lib/api-types'
import { requireAdmin, createForbiddenResponse, validateEmail } from '@/lib/auth'

interface RouteParams {
  params: {
    id: string
  }
}

// GET /api/v1/admin/users/[id] - 获取用户详情
export async function GET(request: NextRequest, { params }: RouteParams) {
  // 验证管理员权限
  const admin = await requireAdmin(request)
  if (!admin) {
    return createForbiddenResponse('需要管理员权限')
  }

  return withDatabaseConnection(async () => {
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return createErrorResponse('用户ID格式错误', 400)
    }

    const user = queries.getUserById(userId)
    if (!user) {
      return createErrorResponse('用户不存在', 404)
    }

    return createSuccessResponse(user)
  })
}

// PUT /api/v1/admin/users/[id] - 更新用户信息
export async function PUT(request: NextRequest, { params }: RouteParams) {
  // 验证管理员权限
  const admin = await requireAdmin(request)
  if (!admin) {
    return createForbiddenResponse('需要管理员权限')
  }

  return withDatabaseConnection(async () => {
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return createErrorResponse('用户ID格式错误', 400)
    }

    const body = await parseRequestBody(request)
    const { email, name, role, isActive } = body

    // 验证必填字段
    const validationError = validateRequired(body, ['email', 'name'])
    if (validationError) {
      return createErrorResponse(validationError, 400)
    }

    // 验证邮箱格式
    if (email && !validateEmail(email)) {
      return createErrorResponse('邮箱格式不正确', 400, 'INVALID_EMAIL', 'email')
    }

    // 验证角色
    if (role && !['user', 'admin'].includes(role)) {
      return createErrorResponse('用户角色无效', 400, 'INVALID_ROLE', 'role')
    }

    // 验证姓名长度
    if (name && name.trim().length < 2) {
      return createErrorResponse('姓名至少需要2个字符', 400, 'INVALID_NAME', 'name')
    }

    // 防止管理员禁用自己
    if (userId === admin.id && isActive === false) {
      return createErrorResponse('不能禁用自己的账户', 400, 'CANNOT_DISABLE_SELF')
    }

    // 防止管理员降级自己
    if (userId === admin.id && role === 'user') {
      return createErrorResponse('不能降级自己的权限', 400, 'CANNOT_DEMOTE_SELF')
    }

    try {
      const updatedUser = queries.updateUser(userId, {
        email: email?.trim().toLowerCase(),
        name: name?.trim(),
        role,
        isActive
      })

      return createSuccessResponse(updatedUser, '用户信息更新成功')
    } catch (error) {
      if (error instanceof Error) {
        if (error.message === '用户不存在') {
          return createErrorResponse('用户不存在', 404)
        }
        if (error.message === '邮箱已被使用') {
          return createErrorResponse('该邮箱已被其他用户使用', 409, 'DUPLICATE_EMAIL', 'email')
        }
      }
      throw error
    }
  })
}

// DELETE /api/v1/admin/users/[id] - 删除用户
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  // 验证管理员权限
  const admin = await requireAdmin(request)
  if (!admin) {
    return createForbiddenResponse('需要管理员权限')
  }

  return withDatabaseConnection(async () => {
    const userId = parseInt(params.id)
    if (isNaN(userId)) {
      return createErrorResponse('用户ID格式错误', 400)
    }

    // 防止管理员删除自己
    if (userId === admin.id) {
      return createErrorResponse('不能删除自己的账户', 400, 'CANNOT_DELETE_SELF')
    }

    try {
      queries.deleteUser(userId)
      return createSuccessResponse(null, '用户删除成功')
    } catch (error) {
      if (error instanceof Error && error.message === '用户不存在') {
        return createErrorResponse('用户不存在', 404)
      }
      throw error
    }
  })
}