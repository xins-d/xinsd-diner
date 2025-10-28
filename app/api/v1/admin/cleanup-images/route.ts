import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { imageManager, initializeImageCleanup } from '@/lib/image-manager'

// GET /api/v1/admin/cleanup-images - 获取图片统计信息
export async function GET() {
  try {
    // 这里可以添加管理员权限检查
    
    // 获取统计信息（需要实现统计方法）
    const stats = {
      message: '图片清理API可用',
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(
      createSuccessResponse(stats, '获取图片统计成功')
    )
  } catch (error) {
    console.error('获取图片统计失败:', error)
    return NextResponse.json(
      createErrorResponse('获取图片统计失败', 500),
      { status: 500 }
    )
  }
}

// POST /api/v1/admin/cleanup-images - 执行图片清理
export async function POST(request: NextRequest) {
  try {
    // 这里可以添加管理员权限检查
    
    const body = await request.json().catch(() => ({}))
    const { 
      cleanupType = 'all', // 'all', 'temp', 'recipe'
      olderThanHours = 24 
    } = body

    let result: any = {}

    switch (cleanupType) {
      case 'temp':
        // 只清理临时图片
        const tempCount = await imageManager.cleanupTempImages(olderThanHours)
        result = { tempImagesCleanedCount: tempCount }
        break
        
      case 'recipe':
        // 只清理菜谱图片
        const recipeCount = await imageManager.cleanupAllRecipeImages()
        result = { recipeImagesCleanedCount: recipeCount }
        break
        
      case 'all':
      default:
        // 完整清理
        await initializeImageCleanup()
        result = { message: '完整图片清理已执行' }
        break
    }

    return NextResponse.json(
      createSuccessResponse({
        cleanupType,
        olderThanHours,
        result,
        timestamp: new Date().toISOString()
      }, '图片清理执行成功')
    )

  } catch (error) {
    console.error('图片清理执行失败:', error)
    return NextResponse.json(
      createErrorResponse('图片清理执行失败', 500),
      { status: 500 }
    )
  }
}