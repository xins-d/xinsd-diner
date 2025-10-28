#!/usr/bin/env node

/**
 * 图片清理脚本
 * 可以手动运行或在服务启动时自动运行
 */

const fs = require('fs')
const path = require('path')
const Database = require('better-sqlite3')

// 图片清理功能
class ImageCleaner {
  constructor() {
    // 读取环境变量配置
    const uploadBasePath = process.env.UPLOAD_BASE_PATH || 'uploads'
    const tempImagesPath = process.env.TEMP_IMAGES_PATH || 'temp'
    const recipeImagesPath = process.env.RECIPE_IMAGES_PATH || 'recipes'
    
    this.uploadsDir = path.join(process.cwd(), 'public', uploadBasePath)
    this.tempDir = path.join(this.uploadsDir, tempImagesPath)
    this.recipeDir = path.join(this.uploadsDir, recipeImagesPath)
    this.dbPath = path.join(process.cwd(), 'data', 'fresh_market.db')
  }

  // 确保目录存在
  ensureDirectoryExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }
  }

  // 删除文件
  deleteFile(filepath) {
    try {
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath)
        console.log(`删除文件: ${filepath}`)
        return true
      }
    } catch (error) {
      console.error(`删除文件失败: ${filepath}`, error.message)
    }
    return false
  }

  // 清理临时图片
  async cleanupTempImages(olderThanHours = 24) {
    console.log(`🧹 清理超过 ${olderThanHours} 小时的临时图片...`)
    
    let cleanedCount = 0
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000)

    try {
      this.ensureDirectoryExists(this.tempDir)
      
      const files = fs.readdirSync(this.tempDir)
      
      for (const file of files) {
        const filepath = path.join(this.tempDir, file)
        const stats = fs.statSync(filepath)
        
        if (stats.mtime < cutoffTime) {
          if (this.deleteFile(filepath)) {
            cleanedCount++
          }
        }
      }

      // 清理数据库中的临时图片记录
      if (fs.existsSync(this.dbPath)) {
        const db = new Database(this.dbPath)
        try {
          const stmt = db.prepare(`
            DELETE FROM images 
            WHERE type = 'temp' 
              AND created_at < ?
          `)
          const result = stmt.run(cutoffTime.toISOString())
          console.log(`清理数据库中的临时图片记录: ${result.changes} 条`)
        } catch (error) {
          console.error('清理数据库记录失败:', error.message)
        } finally {
          db.close()
        }
      }

    } catch (error) {
      console.error('清理临时图片失败:', error.message)
    }

    console.log(`✅ 清理了 ${cleanedCount} 个临时图片文件`)
    return cleanedCount
  }

  // 清理所有菜谱图片
  async cleanupAllRecipeImages() {
    console.log('🧹 清理所有菜谱图片...')
    
    let cleanedCount = 0

    try {
      this.ensureDirectoryExists(this.recipeDir)
      
      const files = fs.readdirSync(this.recipeDir)
      
      for (const file of files) {
        const filepath = path.join(this.recipeDir, file)
        if (this.deleteFile(filepath)) {
          cleanedCount++
        }
      }

      // 清理数据库中的菜谱图片记录
      if (fs.existsSync(this.dbPath)) {
        const db = new Database(this.dbPath)
        try {
          const stmt = db.prepare("DELETE FROM images WHERE type = 'recipe'")
          const result = stmt.run()
          console.log(`清理数据库中的菜谱图片记录: ${result.changes} 条`)
        } catch (error) {
          console.error('清理数据库记录失败:', error.message)
        } finally {
          db.close()
        }
      }

    } catch (error) {
      console.error('清理菜谱图片失败:', error.message)
    }

    console.log(`✅ 清理了 ${cleanedCount} 个菜谱图片文件`)
    return cleanedCount
  }

  // 完整清理
  async fullCleanup() {
    console.log('🧹 开始完整图片清理...')
    
    const recipeCount = await this.cleanupAllRecipeImages()
    const tempCount = await this.cleanupTempImages(24)
    
    console.log(`✅ 完整清理完成: 菜谱图片 ${recipeCount} 个, 临时图片 ${tempCount} 个`)
    
    return { recipeCount, tempCount }
  }

  // 显示统计信息
  showStats() {
    console.log('\n📊 图片存储统计:')
    
    try {
      // 文件系统统计
      const tempFiles = fs.existsSync(this.tempDir) ? fs.readdirSync(this.tempDir).length : 0
      const recipeFiles = fs.existsSync(this.recipeDir) ? fs.readdirSync(this.recipeDir).length : 0
      
      console.log(`   临时图片文件: ${tempFiles} 个`)
      console.log(`   菜谱图片文件: ${recipeFiles} 个`)

      // 数据库统计
      if (fs.existsSync(this.dbPath)) {
        const db = new Database(this.dbPath)
        try {
          const totalImages = db.prepare('SELECT COUNT(*) as count FROM images').get()
          const tempImages = db.prepare("SELECT COUNT(*) as count FROM images WHERE type = 'temp'").get()
          const recipeImages = db.prepare("SELECT COUNT(*) as count FROM images WHERE type = 'recipe'").get()
          
          console.log(`   数据库图片记录: ${totalImages.count} 条`)
          console.log(`   临时图片记录: ${tempImages.count} 条`)
          console.log(`   菜谱图片记录: ${recipeImages.count} 条`)
        } catch (error) {
          console.error('读取数据库统计失败:', error.message)
        } finally {
          db.close()
        }
      } else {
        console.log('   数据库文件不存在')
      }
    } catch (error) {
      console.error('获取统计信息失败:', error.message)
    }
  }
}

async function runCleanup() {
  console.log('🧹 开始图片清理...')
  
  try {
    const cleaner = new ImageCleaner()
    
    // 显示清理前统计
    console.log('清理前:')
    cleaner.showStats()
    
    // 执行清理
    await cleaner.fullCleanup()
    
    // 显示清理后统计
    console.log('\n清理后:')
    cleaner.showStats()
    
    console.log('\n✅ 图片清理完成')
  } catch (error) {
    console.error('❌ 图片清理失败:', error)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runCleanup()
}

module.exports = { runCleanup, ImageCleaner }