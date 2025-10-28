import { randomBytes } from 'crypto'
import { queries, type User, type UserSession } from './database-sqlite'

// 会话配置
export const SESSION_CONFIG = {
  // 短期会话：24小时
  shortTerm: 24 * 60 * 60 * 1000,
  // 长期会话（记住我）：30天
  longTerm: 30 * 24 * 60 * 60 * 1000,
  // 会话清理间隔：1小时
  cleanupInterval: 60 * 60 * 1000,
  // 会话ID长度
  sessionIdLength: 32,
} as const

// 会话验证结果
export interface SessionValidationResult {
  isValid: boolean
  user?: User
  session?: UserSession
  error?: string
}

/**
 * 生成安全的会话ID
 * @returns 会话ID字符串
 */
export function generateSessionId(): string {
  return randomBytes(SESSION_CONFIG.sessionIdLength).toString('hex')
}

/**
 * 创建用户会话
 * @param userId 用户ID
 * @param rememberMe 是否为长期会话
 * @returns 会话ID
 */
export async function createSession(userId: number, rememberMe: boolean = false): Promise<string> {
  const sessionId = generateSessionId()
  const duration = rememberMe ? SESSION_CONFIG.longTerm : SESSION_CONFIG.shortTerm
  const expiresAt = new Date(Date.now() + duration)
  
  try {
    // 创建会话记录
    queries.createSession(userId, sessionId, expiresAt)
    
    // 更新用户最后登录时间
    queries.updateUserLastLogin(userId)
    
    return sessionId
  } catch (error) {
    throw new Error('会话创建失败')
  }
}

/**
 * 验证会话
 * @param sessionId 会话ID
 * @returns 验证结果
 */
export async function validateSession(sessionId: string): Promise<SessionValidationResult> {
  if (!sessionId) {
    return {
      isValid: false,
      error: '会话ID不能为空'
    }
  }
  
  try {
    // 获取会话信息
    const session = queries.getSession(sessionId)
    
    if (!session) {
      return {
        isValid: false,
        error: '会话不存在或已过期'
      }
    }
    
    // 检查会话是否过期
    const now = new Date()
    const expiresAt = new Date(session.expiresAt)
    
    if (now > expiresAt) {
      // 删除过期会话
      queries.deleteSession(sessionId)
      return {
        isValid: false,
        error: '会话已过期'
      }
    }
    
    // 获取用户信息
    const user = queries.getUserById(session.userId)
    
    if (!user) {
      // 用户不存在，删除会话
      queries.deleteSession(sessionId)
      return {
        isValid: false,
        error: '用户不存在'
      }
    }
    
    // 检查用户是否被禁用
    if (!user.isActive) {
      // 删除被禁用用户的会话
      queries.deleteUserSessions(user.id)
      return {
        isValid: false,
        error: '用户账户已被禁用'
      }
    }
    
    return {
      isValid: true,
      user,
      session
    }
  } catch (error) {
    return {
      isValid: false,
      error: '会话验证失败'
    }
  }
}

/**
 * 销毁会话
 * @param sessionId 会话ID
 */
export async function destroySession(sessionId: string): Promise<void> {
  if (!sessionId) {
    return
  }
  
  try {
    queries.deleteSession(sessionId)
  } catch (error) {
    // 静默处理删除错误
    console.error('删除会话失败:', error)
  }
}

/**
 * 销毁用户的所有会话
 * @param userId 用户ID
 */
export async function destroyUserSessions(userId: number): Promise<void> {
  try {
    queries.deleteUserSessions(userId)
  } catch (error) {
    console.error('删除用户会话失败:', error)
  }
}

/**
 * 刷新会话（延长过期时间）
 * @param sessionId 会话ID
 * @param rememberMe 是否为长期会话
 * @returns 新的会话ID
 */
export async function refreshSession(sessionId: string, rememberMe: boolean = false): Promise<string | null> {
  const validation = await validateSession(sessionId)
  
  if (!validation.isValid || !validation.user) {
    return null
  }
  
  // 删除旧会话
  await destroySession(sessionId)
  
  // 创建新会话
  return await createSession(validation.user.id, rememberMe)
}

/**
 * 清理过期会话
 * @returns 清理的会话数量
 */
export async function cleanupExpiredSessions(): Promise<number> {
  try {
    const deletedCount = queries.cleanupExpiredSessions()
    if (deletedCount > 0) {
      console.log(`🧹 清理了 ${deletedCount} 个过期会话`)
    }
    return deletedCount
  } catch (error) {
    console.error('清理过期会话失败:', error)
    return 0
  }
}

/**
 * 获取会话剩余时间（毫秒）
 * @param sessionId 会话ID
 * @returns 剩余时间，如果会话无效返回0
 */
export async function getSessionRemainingTime(sessionId: string): Promise<number> {
  const validation = await validateSession(sessionId)
  
  if (!validation.isValid || !validation.session) {
    return 0
  }
  
  const now = new Date()
  const expiresAt = new Date(validation.session.expiresAt)
  const remaining = expiresAt.getTime() - now.getTime()
  
  return Math.max(0, remaining)
}

/**
 * 检查会话是否即将过期（1小时内）
 * @param sessionId 会话ID
 * @returns 是否即将过期
 */
export async function isSessionExpiringSoon(sessionId: string): Promise<boolean> {
  const remainingTime = await getSessionRemainingTime(sessionId)
  const oneHour = 60 * 60 * 1000
  
  return remainingTime > 0 && remainingTime < oneHour
}

/**
 * 启动会话清理定时器
 */
export function startSessionCleanupTimer(): NodeJS.Timeout {
  const timer = setInterval(async () => {
    await cleanupExpiredSessions()
  }, SESSION_CONFIG.cleanupInterval)
  
  console.log('🕐 会话清理定时器已启动')
  return timer
}

/**
 * 停止会话清理定时器
 */
export function stopSessionCleanupTimer(timer: NodeJS.Timeout): void {
  clearInterval(timer)
  console.log('⏹️ 会话清理定时器已停止')
}

// 会话统计信息
export interface SessionStats {
  totalSessions: number
  activeSessions: number
  expiredSessions: number
}

/**
 * 获取会话统计信息
 * @returns 会话统计
 */
export async function getSessionStats(): Promise<SessionStats> {
  try {
    // 这里需要添加统计查询，暂时返回模拟数据
    // 在实际实现中，应该在database-sqlite.ts中添加相应的查询函数
    return {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0
    }
  } catch (error) {
    console.error('获取会话统计失败:', error)
    return {
      totalSessions: 0,
      activeSessions: 0,
      expiredSessions: 0
    }
  }
}

// 在服务端启动时自动开始清理定时器
let cleanupTimer: NodeJS.Timeout | null = null

if (typeof window === 'undefined') {
  // 只在服务端运行
  cleanupTimer = startSessionCleanupTimer()
  
  // 进程退出时清理定时器
  process.on('SIGINT', () => {
    if (cleanupTimer) {
      stopSessionCleanupTimer(cleanupTimer)
    }
  })
  
  process.on('SIGTERM', () => {
    if (cleanupTimer) {
      stopSessionCleanupTimer(cleanupTimer)
    }
  })
}