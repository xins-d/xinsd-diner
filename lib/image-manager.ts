import { unlink } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { getImagePaths, getImageUrlPaths } from './config'

// 图片类型定义
export interface ImageRecord {
  id?: number
  filename: string
  filepath: string
  url: string
  type: 'recipe' | 'temp' | 'user'
  recipe_id?: number
  created_at: string
  used: boolean
}

// 图片管理类
export class ImageManager {
  private static instance: ImageManager
  private uploadsDir: string
  private tempDir: string
  private recipeDir: string

  constructor() {
    const paths = getImagePaths()
    this.uploadsDir = paths.uploadsDir
    this.tempDir = paths.tempDir
    this.recipeDir = paths.recipeDir
  }

  static getInstance(): ImageManager {
    if (!ImageManager.instance) {
      ImageManager.instance = new ImageManager()
    }
    return ImageManager.instance
  }

  // 保存临时图片（AI生成的图片）
  async saveTempImage(imageBuffer: Buffer, originalFilename: string): Promise<string> {
    const timestamp = Date.now()
    const extension = originalFilename.split('.').pop() || 'png'
    const filename = `temp-${timestamp}.${extension}`
    const filepath = join(this.tempDir, filename)
    const urlPaths = getImageUrlPaths()
    const url = `${urlPaths.tempUrl}/${filename}`

    // 确保目录存在
    await this.ensureDirectoryExists(this.tempDir)

    // 保存文件
    await this.writeFile(filepath, imageBuffer)

    // 记录到数据库
    await this.recordImage({
      filename,
      filepath,
      url,
      type: 'temp',
      created_at: new Date().toISOString(),
      used: false
    })

    console.log(`临时图片已保存: ${url}`)
    return url
  }

  // 将临时图片转为菜谱图片
  async moveToRecipe(tempUrl: string, recipeId: number): Promise<string> {
    const tempFilename = tempUrl.split('/').pop()
    if (!tempFilename) {
      throw new Error('无效的临时图片URL')
    }

    const tempFilepath = join(this.tempDir, tempFilename)
    
    // 检查临时文件是否存在
    if (!existsSync(tempFilepath)) {
      throw new Error('临时图片文件不存在')
    }

    // 生成新的文件名
    const timestamp = Date.now()
    const extension = tempFilename.split('.').pop()
    const newFilename = `recipe-${recipeId}-${timestamp}.${extension}`
    const newFilepath = join(this.recipeDir, newFilename)
    const urlPaths = getImageUrlPaths()
    const newUrl = `${urlPaths.recipeUrl}/${newFilename}`

    // 确保目录存在
    await this.ensureDirectoryExists(this.recipeDir)

    // 移动文件
    await this.moveFile(tempFilepath, newFilepath)

    // 更新数据库记录
    await this.updateImageRecord(tempUrl, {
      filename: newFilename,
      filepath: newFilepath,
      url: newUrl,
      type: 'recipe',
      recipe_id: recipeId,
      used: true
    })

    console.log(`图片已移动到菜谱目录: ${tempUrl} -> ${newUrl}`)
    return newUrl
  }

  // 删除图片
  async deleteImage(url: string): Promise<void> {
    const filename = url.split('/').pop()
    if (!filename) return

    // 确定文件路径
    const paths = getImagePaths()
    let filepath: string
    if (url.includes(`/${getImageUrlPaths().tempUrl.split('/').pop()}/`)) {
      filepath = join(paths.tempDir, filename)
    } else if (url.includes(`/${getImageUrlPaths().recipeUrl.split('/').pop()}/`)) {
      filepath = join(paths.recipeDir, filename)
    } else {
      // 兼容旧的路径格式
      filepath = join(paths.itemDir, filename)
    }

    try {
      // 删除文件
      if (existsSync(filepath)) {
        await unlink(filepath)
        console.log(`图片文件已删除: ${filepath}`)
      }

      // 从数据库中删除记录
      await this.deleteImageRecord(url)
    } catch (error) {
      console.error(`删除图片失败: ${url}`, error)
    }
  }

  // 清理未使用的临时图片
  async cleanupTempImages(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)
    let cleanedCount = 0

    try {
      // 获取未使用的临时图片
      const unusedImages = await this.getUnusedTempImages(cutoffTime)

      for (const image of unusedImages) {
        await this.deleteImage(image.url)
        cleanedCount++
      }

      console.log(`清理了 ${cleanedCount} 个未使用的临时图片`)
    } catch (error) {
      console.error('清理临时图片失败:', error)
    }

    return cleanedCount
  }

  // 清理菜谱图片（当菜谱被删除时）
  async cleanupRecipeImages(recipeId: number): Promise<number> {
    let cleanedCount = 0

    try {
      const recipeImages = await this.getRecipeImages(recipeId)

      for (const image of recipeImages) {
        await this.deleteImage(image.url)
        cleanedCount++
      }

      console.log(`清理了菜谱 ${recipeId} 的 ${cleanedCount} 个图片`)
    } catch (error) {
      console.error(`清理菜谱 ${recipeId} 图片失败:`, error)
    }

    return cleanedCount
  }

  // 启动时清理所有菜谱图片
  async cleanupAllRecipeImages(): Promise<number> {
    let cleanedCount = 0

    try {
      // 获取所有菜谱图片
      const allRecipeImages = await this.getAllRecipeImages()

      for (const image of allRecipeImages) {
        await this.deleteImage(image.url)
        cleanedCount++
      }

      console.log(`启动清理: 删除了 ${cleanedCount} 个菜谱图片`)
    } catch (error) {
      console.error('启动清理菜谱图片失败:', error)
    }

    return cleanedCount
  }

  // 私有方法：确保目录存在
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    const { mkdir } = await import('fs/promises')
    try {
      await mkdir(dirPath, { recursive: true })
    } catch (error) {
      // 目录可能已存在，忽略错误
    }
  }

  // 私有方法：写入文件
  private async writeFile(filepath: string, buffer: Buffer): Promise<void> {
    const { writeFile } = await import('fs/promises')
    await writeFile(filepath, buffer)
  }

  // 私有方法：移动文件
  private async moveFile(from: string, to: string): Promise<void> {
    const { copyFile, unlink } = await import('fs/promises')
    await copyFile(from, to)
    await unlink(from)
  }

  // 私有方法：记录图片到数据库
  private async recordImage(image: Omit<ImageRecord, 'id'>): Promise<void> {
    const { db } = await import('./database-sqlite')
    
    const stmt = db.prepare(`
      INSERT INTO images (filename, filepath, url, type, recipe_id, created_at, used)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `)
    
    stmt.run(
      image.filename,
      image.filepath,
      image.url,
      image.type,
      image.recipe_id || null,
      image.created_at,
      image.used ? 1 : 0
    )
  }

  // 私有方法：更新图片记录
  private async updateImageRecord(oldUrl: string, updates: Partial<ImageRecord>): Promise<void> {
    const { db } = await import('./database-sqlite')
    
    const setParts: string[] = []
    const values: any[] = []
    
    if (updates.filename) {
      setParts.push('filename = ?')
      values.push(updates.filename)
    }
    if (updates.filepath) {
      setParts.push('filepath = ?')
      values.push(updates.filepath)
    }
    if (updates.url) {
      setParts.push('url = ?')
      values.push(updates.url)
    }
    if (updates.type) {
      setParts.push('type = ?')
      values.push(updates.type)
    }
    if (updates.recipe_id !== undefined) {
      setParts.push('recipe_id = ?')
      values.push(updates.recipe_id)
    }
    if (updates.used !== undefined) {
      setParts.push('used = ?')
      values.push(updates.used ? 1 : 0)
    }
    
    if (setParts.length > 0) {
      values.push(oldUrl)
      const stmt = db.prepare(`UPDATE images SET ${setParts.join(', ')} WHERE url = ?`)
      stmt.run(...values)
    }
  }

  // 私有方法：删除图片记录
  private async deleteImageRecord(url: string): Promise<void> {
    const { db } = await import('./database-sqlite')
    const stmt = db.prepare('DELETE FROM images WHERE url = ?')
    stmt.run(url)
  }

  // 私有方法：获取未使用的临时图片
  private async getUnusedTempImages(cutoffTime: Date): Promise<ImageRecord[]> {
    const { db } = await import('./database-sqlite')
    
    const stmt = db.prepare(`
      SELECT * FROM images 
      WHERE type = 'temp' 
        AND used = 0 
        AND created_at < ?
      ORDER BY created_at ASC
    `)
    
    const rows = stmt.all(cutoffTime.toISOString()) as any[]
    return rows.map(row => ({
      ...row,
      used: Boolean(row.used)
    }))
  }

  // 私有方法：获取菜谱图片
  private async getRecipeImages(recipeId: number): Promise<ImageRecord[]> {
    const { db } = await import('./database-sqlite')
    
    const stmt = db.prepare(`
      SELECT * FROM images 
      WHERE type = 'recipe' AND recipe_id = ?
      ORDER BY created_at ASC
    `)
    
    const rows = stmt.all(recipeId) as any[]
    return rows.map(row => ({
      ...row,
      used: Boolean(row.used)
    }))
  }

  // 私有方法：获取所有菜谱图片
  private async getAllRecipeImages(): Promise<ImageRecord[]> {
    const { db } = await import('./database-sqlite')
    
    const stmt = db.prepare(`
      SELECT * FROM images 
      WHERE type = 'recipe'
      ORDER BY created_at ASC
    `)
    
    const rows = stmt.all() as any[]
    return rows.map(row => ({
      ...row,
      used: Boolean(row.used)
    }))
  }
}

// 导出单例实例
export const imageManager = ImageManager.getInstance()

// 启动时清理函数
export async function initializeImageCleanup(): Promise<void> {
  console.log('🧹 开始启动时图片清理...')
  
  try {
    // 清理所有菜谱图片
    const recipeImagesCount = await imageManager.cleanupAllRecipeImages()
    
    // 清理超过24小时的临时图片
    const tempImagesCount = await imageManager.cleanupTempImages(24)
    
    console.log(`✅ 启动清理完成: 菜谱图片 ${recipeImagesCount} 个, 临时图片 ${tempImagesCount} 个`)
  } catch (error) {
    console.error('❌ 启动清理失败:', error)
  }
}