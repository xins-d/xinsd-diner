import { NextRequest, NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse } from '@/lib/api-types'
import { imageManager } from '@/lib/image-manager'
import { queries } from '@/lib/database-sqlite'

// 图片替换请求接口
interface ReplaceImageRequest {
  recipeId: number
  oldImageUrl: string
  newImageUrl: string
}

// POST /api/v1/images/replace - 替换菜谱中的图片
export async function POST(request: NextRequest) {
  try {
    const body: ReplaceImageRequest = await request.json()
    const { recipeId, oldImageUrl, newImageUrl } = body

    if (!recipeId || !oldImageUrl || !newImageUrl) {
      return NextResponse.json(
        createErrorResponse('参数不完整', 400),
        { status: 400 }
      )
    }

    // 获取菜谱内容
    const recipe = await queries.getRecipe(recipeId)
    if (!recipe) {
      return NextResponse.json(
        createErrorResponse('菜谱不存在', 404),
        { status: 404 }
      )
    }

    // 将新的临时图片移动到菜谱目录
    const finalImageUrl = await imageManager.moveToRecipe(newImageUrl, recipeId)

    // 更新菜谱内容中的图片URL
    const updatedContent = recipe.content.replace(oldImageUrl, finalImageUrl)
    await queries.updateRecipeContent(recipeId, updatedContent)

    // 删除旧图片
    await imageManager.deleteImage(oldImageUrl)

    return NextResponse.json(
      createSuccessResponse({
        recipeId,
        oldImageUrl,
        newImageUrl: finalImageUrl,
        updatedAt: new Date().toISOString()
      }, '图片替换成功')
    )

  } catch (error) {
    console.error('图片替换失败:', error)
    return NextResponse.json(
      createErrorResponse('图片替换失败', 500),
      { status: 500 }
    )
  }
}