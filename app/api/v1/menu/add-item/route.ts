import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection, parseRequestBody } from '@/lib/api-utils-sqlite'
import { createResponse, createErrorResponse, validateRequired } from '@/lib/api-types'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// POST /api/v1/menu/add-item - 添加新商品
export async function POST(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  return withDatabaseConnection(async () => {
    const body = await parseRequestBody(request)
    const { name, description, category, image } = body

    // 验证必填字段
    const validationError = validateRequired(body, ['name', 'description', 'category'])
    if (validationError) {
      return createErrorResponse(validationError, 400)
    }

    // 验证字段长度
    if (name.length > 200) {
      return createErrorResponse('商品名称长度不能超过200个字符', 400)
    }

    const newItem = await queries.addMenuItem({
      name: name.trim(),
      description: description.trim(),
      category,
      image
    })

    return createResponse(201, '商品创建成功', newItem)
  })
}