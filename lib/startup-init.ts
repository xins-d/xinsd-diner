// 启动初始化标志
let isInitialized = false

// 启动时初始化函数
export async function initializeOnStartup(): Promise<void> {
  if (isInitialized) {
    return
  }

  console.log('🚀 应用启动初始化...')

  try {
    // 1. 初始化数据库默认数据（仅首次启动）
    const { initializeDefaultData } = await import('./database-sqlite')
    await initializeDefaultData()
    
    // 2. 动态导入图片管理器以避免循环依赖
    const { initializeImageCleanup, imageManager } = await import('./image-manager')
    
    // 初始化图片清理
    await initializeImageCleanup()
    
    // 3. 设置定时清理任务
    // 每小时清理一次临时图片
    setInterval(async () => {
      try {
        await imageManager.cleanupTempImages(1) // 清理1小时前的临时图片
      } catch (error) {
        console.error('定时清理临时图片失败:', error)
      }
    }, 60 * 60 * 1000) // 每小时执行一次
    
    // 每小时清理一次过期会话
    setInterval(async () => {
      try {
        const { queries } = await import('./database-sqlite')
        const cleanedCount = queries.cleanupExpiredSessions()
        if (cleanedCount > 0) {
          console.log(`🧹 清理了 ${cleanedCount} 个过期会话`)
        }
      } catch (error) {
        console.error('定时清理过期会话失败:', error)
      }
    }, 60 * 60 * 1000) // 每小时执行一次

    isInitialized = true
    console.log('✅ 应用启动初始化完成')
  } catch (error) {
    console.error('❌ 应用启动初始化失败:', error)
  }
}

// 在模块加载时自动执行初始化
if (typeof window === 'undefined') {
  // 只在服务端执行，使用 setTimeout 确保在下一个事件循环中执行
  setTimeout(() => {
    initializeOnStartup().catch(error => {
      console.error('启动初始化失败:', error)
    })
  }, 1000) // 延迟1秒执行，确保其他模块已加载
}