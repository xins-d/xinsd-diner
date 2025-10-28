import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection, parseRequestBody } from '@/lib/api-utils-sqlite'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// POST /api/v1/menu/delete-items - 删除商品
export async function POST(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  return withDatabaseConnection(async () => {
    const body = await parseRequestBody(request)
    const { ids } = body

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return createErrorResponse('请提供要删除的商品ID列表', 400)
    }

    // 验证ID格式
    const numericIds = ids.map(id => {
      const numId = parseInt(id)
      if (isNaN(numId)) {
        throw new Error('商品ID格式错误')
      }
      return numId
    })

    const result = await queries.deleteMenuItems(numericIds)

    return createSuccessResponse(result, '商品删除成功')
  })
}