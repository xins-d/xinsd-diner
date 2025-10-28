import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection, parseRequestBody } from '@/lib/api-utils-sqlite'
import { createSuccessResponse, createErrorResponse, validateRequired } from '@/lib/api-types'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// POST /api/v1/menu/update-item - 更新商品
export async function POST(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  return withDatabaseConnection(async () => {
    const body = await parseRequestBody(request)
    const { id, name, description, category, image } = body

    // 验证必填字段
    const validationError = validateRequired(body, ['id', 'name', 'description', 'category'])
    if (validationError) {
      return createErrorResponse(validationError, 400)
    }

    // 验证ID格式
    const itemId = parseInt(id)
    if (isNaN(itemId)) {
      return createErrorResponse('商品ID格式错误', 400)
    }

    // 验证字段长度
    if (name.length > 200) {
      return createErrorResponse('商品名称长度不能超过200个字符', 400)
    }

    const updatedItem = await queries.updateMenuItem(itemId, {
      name: name.trim(),
      description: description.trim(),
      category,
      image
    })

    return createSuccessResponse(updatedItem, '商品更新成功')
  })
}