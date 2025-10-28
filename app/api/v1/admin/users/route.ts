import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection, parseRequestBody } from '@/lib/api-utils-sqlite'
import { createSuccessResponse, createErrorResponse, validatePaginationParams, validateRequired } from '@/lib/api-types'
import { requireAdmin, createForbiddenResponse, validateEmail } from '@/lib/auth'
import { hashPassword } from '@/lib/password'

// GET /api/v1/admin/users - 获取用户列表
export async function GET(request: NextRequest) {
  // 验证管理员权限
  const admin = await requireAdmin(request)
  if (!admin) {
    return createForbiddenResponse('需要管理员权限')
  }

  return withDatabaseConnection(async () => {
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search') || undefined
    const role = searchParams.get('role') as 'user' | 'admin' | undefined
    const isActiveParam = searchParams.get('isActive')
    const isActive = isActiveParam ? isActiveParam === 'true' : undefined
    const { page, limit } = validatePaginationParams(searchParams)

    const result = await queries.getUsers({
      search,
      role,
      isActive,
      page,
      limit
    })

    return createSuccessResponse(result)
  })
}

// POST /api/v1/admin/users - 创建新用户
export async function POST(request: NextRequest) {
  // 验证管理员权限
  const admin = await requireAdmin(request)
  if (!admin) {
    return createForbiddenResponse('需要管理员权限')
  }

  return withDatabaseConnection(async () => {
    const body = await parseRequestBody(request)
    const { email, password, name, role = 'user' } = body

    // 验证必填字段
    const validationError = validateRequired(body, ['email', 'password', 'name'])
    if (validationError) {
      return createErrorResponse(validationError, 400)
    }

    // 验证邮箱格式
    if (!validateEmail(email)) {
      return createErrorResponse('邮箱格式不正确', 400, 'INVALID_EMAIL', 'email')
    }

    // 验证角色
    if (!['user', 'admin'].includes(role)) {
      return createErrorResponse('用户角色无效', 400, 'INVALID_ROLE', 'role')
    }

    // 验证姓名长度
    if (name.trim().length < 2) {
      return createErrorResponse('姓名至少需要2个字符', 400, 'INVALID_NAME', 'name')
    }

    // 验证密码长度
    if (password.length < 6) {
      return createErrorResponse('密码至少需要6个字符', 400, 'WEAK_PASSWORD', 'password')
    }

    try {
      // 哈希密码
      const passwordHash = await hashPassword(password)

      // 创建用户
      const newUser = queries.createUser({
        email: email.trim().toLowerCase(),
        name: name.trim(),
        passwordHash,
        role
      })

      return createSuccessResponse(newUser, '用户创建成功')
    } catch (error) {
      if (error instanceof Error && error.message === '邮箱已被注册') {
        return createErrorResponse('该邮箱已被注册', 409, 'DUPLICATE_EMAIL', 'email')
      }
      throw error
    }
  })
}