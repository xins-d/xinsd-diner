import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection, parseRequestBody } from '@/lib/api-utils-sqlite'
import { createSuccessResponse, createErrorResponse, validateRequired } from '@/lib/api-types'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// POST /api/v1/categories/update - 更新分类
export async function POST(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  return withDatabaseConnection(async () => {
    const body = await parseRequestBody(request)
    const { id, name, image } = body

    // 验证必填字段
    const validationError = validateRequired(body, ['id', 'name'])
    if (validationError) {
      return createErrorResponse(validationError, 400)
    }

    // 验证字段长度
    if (name.length > 100) {
      return createErrorResponse('分类名称长度不能超过100个字符', 400)
    }

    const updatedCategory = await queries.updateCategory(id, {
      name: name.trim(),
      image
    })

    return createSuccessResponse(updatedCategory, '分类更新成功')
  })
}