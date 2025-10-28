import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection } from '@/lib/api-utils-sqlite'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/v1/menu/item - 获取单个商品详情
export async function GET(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  return withDatabaseConnection(async () => {
    const searchParams = request.nextUrl.searchParams
    const idParam = searchParams.get('id')

    if (!idParam) {
      return createErrorResponse('商品ID不能为空', 400)
    }

    const id = parseInt(idParam)
    if (isNaN(id)) {
      return createErrorResponse('商品ID格式错误', 400)
    }

    const item = await queries.getMenuItem(id)
    
    if (!item) {
      return createErrorResponse('商品不存在', 404)
    }

    return createSuccessResponse(item)
  })
}