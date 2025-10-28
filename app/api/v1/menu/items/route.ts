import { NextRequest } from 'next/server'
import { queries } from '@/lib/database-sqlite'
import { withDatabaseConnection } from '@/lib/api-utils-sqlite'
import { createSuccessResponse, validatePaginationParams } from '@/lib/api-types'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// GET /api/v1/menu/items - 获取商品列表
export async function GET(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  return withDatabaseConnection(async () => {
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') || undefined
    const categoryId = searchParams.get('categoryId') || undefined
    const search = searchParams.get('search') || undefined
    const { page, limit } = validatePaginationParams(searchParams)

    const result = await queries.getMenuItems({
      category,
      categoryId,
      search,
      page,
      limit
    })

    return createSuccessResponse(result)
  })
}