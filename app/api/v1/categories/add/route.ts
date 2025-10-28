import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection, parseRequestBody } from '@/lib/api-utils-sqlite'
import { createResponse, createErrorResponse, validateRequired } from '@/lib/api-types'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// POST /api/v1/categories/add - 创建新分类
export async function POST(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  return withDatabaseConnection(async () => {
    const body = await parseRequestBody(request)
    const { name, image } = body

    // 验证必填字段
    const validationError = validateRequired(body, ['name'])
    if (validationError) {
      return createErrorResponse(validationError, 400)
    }

    // 验证字段长度
    if (name.length > 100) {
      return createErrorResponse('分类名称长度不能超过100个字符', 400)
    }

    const newCategory = await queries.addCategory({
      name: name.trim(),
      image
    })

    return createResponse(201, '分类创建成功', newCategory)
  })
}