import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { createSuccessResponse, createErrorResponse, validateImageFile } from '@/lib/api-types'
import { createApiResponse } from '@/lib/api-utils-sqlite'
import { getImagePaths, getImageUrlPaths } from '@/lib/config'
import { requireAuth, createUnauthorizedResponse } from '@/lib/auth'

// POST /api/v1/upload/image - 上传图片
export async function POST(request: NextRequest) {
  // 验证用户认证
  const user = await requireAuth(request)
  if (!user) {
    return createUnauthorizedResponse('请先登录')
  }
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string

    if (!file) {
      return createApiResponse(createErrorResponse('请选择要上传的文件', 400), 400)
    }

    if (!type || !['item', 'category'].includes(type)) {
      return createApiResponse(createErrorResponse('文件类型参数无效', 400), 400)
    }

    // 验证文件
    const fileError = validateImageFile(file)
    if (fileError) {
      return createApiResponse(createErrorResponse(fileError, 400), 400)
    }

    // 生成文件名
    const timestamp = Date.now()
    const extension = file.type.split('/')[1]
    const filename = `${type}-${timestamp}.${extension}`
    
    // 获取配置路径
    const paths = getImagePaths()
    const urlPaths = getImageUrlPaths()
    
    // 确定上传目录
    const uploadDir = type === 'item' ? paths.itemDir : paths.categoryDir
    await mkdir(uploadDir, { recursive: true })
    
    // 保存文件
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const filepath = join(uploadDir, filename)
    await writeFile(filepath, buffer)
    
    // 生成URL
    const url = type === 'item' 
      ? `${urlPaths.itemUrl}/${filename}`
      : `${urlPaths.categoryUrl}/${filename}`

    return createApiResponse(createSuccessResponse({
      url,
      filename,
      size: file.size,
      type: file.type
    }, '图片上传成功'))
  } catch (error) {
    console.error('File upload error:', error)
    return createApiResponse(createErrorResponse('文件上传失败', 500), 500)
  }
}