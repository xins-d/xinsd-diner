import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { validateSession, type SessionValidationResult } from './session'
import { queries, type User } from './database-sqlite'
import { hashPassword, verifyPassword, validatePasswordStrength } from './password'

// 认证配置
export const AUTH_CONFIG = {
  sessionCookieName: 'session_id',
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  },
} as const

// 认证错误类型
export enum AuthErrorType {
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  USER_NOT_FOUND = 'USER_NOT_FOUND',
  USER_INACTIVE = 'USER_INACTIVE',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  UNAUTHORIZED = 'UNAUTHORIZED',
  DUPLICATE_EMAIL = 'DUPLICATE_EMAIL',
  WEAK_PASSWORD = 'WEAK_PASSWORD',
  INVALID_EMAIL = 'INVALID_EMAIL',
  MISSING_FIELDS = 'MISSING_FIELDS',
}

export interface AuthError {
  type: AuthErrorType
  message: string
  field?: string
}

export interface LoginCredentials {
  username: string
  password: string
  rememberMe?: boolean
}

export interface RegisterData {
  username: string
  email: string
  password: string
  name: string
}

export interface AuthResult {
  success: boolean
  user?: User
  sessionId?: string
  error?: AuthError
}

/**
 * 验证邮箱格式
 * @param email 邮箱地址
 * @returns 是否有效
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证用户名格式
 * @param username 用户名
 * @returns 是否有效
 */
export function validateUsername(username: string): boolean {
  // 用户名只能包含字母、数字、下划线，长度3-20位
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 从请求中获取会话ID
 * @param request NextRequest对象
 * @returns 会话ID或null
 */
export function getSessionIdFromRequest(request: NextRequest): string | null {
  return request.cookies.get(AUTH_CONFIG.sessionCookieName)?.value || null
}

/**
 * 从服务端cookies中获取会话ID
 * @returns 会话ID或null
 */
export async function getSessionIdFromCookies(): Promise<string | null> {
  try {
    const cookieStore = await cookies()
    return cookieStore.get(AUTH_CONFIG.sessionCookieName)?.value || null
  } catch (error) {
    return null
  }
}

/**
 * 验证请求中的会话（用于中间件）
 * @param request NextRequest对象
 * @returns 会话验证结果
 */
export async function validateRequestSession(request: NextRequest): Promise<SessionValidationResult> {
  const sessionId = getSessionIdFromRequest(request)
  
  if (!sessionId) {
    return {
      isValid: false,
      error: '未找到会话'
    }
  }
  
  // 在中间件中，我们只做基本的会话ID格式验证
  // 详细的数据库验证在API路由中进行
  if (sessionId.length < 10) {
    return {
      isValid: false,
      error: '会话格式无效'
    }
  }
  
  // 在中间件中，我们假设会话有效，让API路由做详细验证
  // 这样可以避免在Edge Runtime中使用Node.js模块
  return {
    isValid: true,
    user: {
      id: 0, // 占位符，实际用户信息在API路由中获取
      email: '',
      name: '',
      role: 'user',
      isActive: true,
      createdAt: '',
      updatedAt: ''
    }
  }
}

/**
 * 验证服务端会话
 * @returns 会话验证结果
 */
export async function validateServerSession(): Promise<SessionValidationResult> {
  const sessionId = await getSessionIdFromCookies()
  
  if (!sessionId) {
    return {
      isValid: false,
      error: '未找到会话'
    }
  }
  
  return await validateSession(sessionId)
}

/**
 * 要求用户认证的中间件
 * @param request NextRequest对象
 * @returns 用户信息或null
 */
export async function requireAuth(request: NextRequest): Promise<User | null> {
  // 首先检查中间件是否已经验证了会话
  const sessionId = request.headers.get('x-session-id') || getSessionIdFromRequest(request)
  
  if (!sessionId) {
    return null
  }
  
  // 进行完整的会话验证（包括数据库查询）
  const validation = await validateSession(sessionId)
  return validation.isValid ? validation.user || null : null
}

/**
 * 要求管理员权限的中间件
 * @param request NextRequest对象
 * @returns 管理员用户信息或null
 */
export async function requireAdmin(request: NextRequest): Promise<User | null> {
  const user = await requireAuth(request)
  return user && user.role === 'admin' ? user : null
}

/**
 * 获取当前认证用户（服务端）
 * @returns 用户信息或null
 */
export async function getCurrentUser(): Promise<User | null> {
  const validation = await validateServerSession()
  return validation.isValid ? validation.user || null : null
}

/**
 * 用户登录
 * @param credentials 登录凭据
 * @returns 认证结果
 */
export async function loginUser(credentials: LoginCredentials): Promise<AuthResult> {
  const { username, password, rememberMe = false } = credentials
  
  // 验证输入
  if (!username || !password) {
    return {
      success: false,
      error: {
        type: AuthErrorType.MISSING_FIELDS,
        message: '用户名和密码不能为空'
      }
    }
  }
  
  try {
    // 获取用户信息（支持用户名和邮箱登录）
    let user = queries.getUserByUsername(username)
    if (!user) {
      // 如果用户名不存在，尝试用邮箱登录
      if (validateEmail(username)) {
        user = queries.getUserByEmail(username)
      }
    }
    
    if (!user) {
      return {
        success: false,
        error: {
          type: AuthErrorType.USER_NOT_FOUND,
          message: '用户不存在'
        }
      }
    }
    
    // 检查用户是否被禁用
    if (!user.isActive) {
      return {
        success: false,
        error: {
          type: AuthErrorType.USER_INACTIVE,
          message: '用户账户已被禁用'
        }
      }
    }
    
    // 验证密码
    const passwordHash = queries.getUserPasswordHash(user.username)
    if (!passwordHash) {
      return {
        success: false,
        error: {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: '用户名或密码错误'
        }
      }
    }
    
    const isPasswordValid = await verifyPassword(password, passwordHash)
    
    if (!isPasswordValid) {
      return {
        success: false,
        error: {
          type: AuthErrorType.INVALID_CREDENTIALS,
          message: '用户名或密码错误'
        }
      }
    }
    
    // 更新最后登录时间
    queries.updateUserLastLogin(user.id)
    
    // 创建会话
    const { createSession } = await import('./session')
    const sessionId = await createSession(user.id, rememberMe)
    
    return {
      success: true,
      user,
      sessionId
    }
  } catch (error) {
    console.error('登录失败:', error)
    return {
      success: false,
      error: {
        type: AuthErrorType.UNAUTHORIZED,
        message: '登录失败，请稍后重试'
      }
    }
  }
}

/**
 * 用户注册
 * @param userData 注册数据
 * @returns 认证结果
 */
export async function registerUser(userData: RegisterData): Promise<AuthResult> {
  const { username, email, password, name } = userData
  
  // 验证输入
  if (!username || !email || !password || !name) {
    return {
      success: false,
      error: {
        type: AuthErrorType.MISSING_FIELDS,
        message: '所有字段都不能为空'
      }
    }
  }
  
  if (!validateUsername(username)) {
    return {
      success: false,
      error: {
        type: AuthErrorType.INVALID_EMAIL,
        message: '用户名格式不正确，只能包含字母、数字、下划线，长度3-20位',
        field: 'username'
      }
    }
  }
  
  if (!validateEmail(email)) {
    return {
      success: false,
      error: {
        type: AuthErrorType.INVALID_EMAIL,
        message: '邮箱格式不正确',
        field: 'email'
      }
    }
  }
  
  // 验证密码强度
  const passwordValidation = validatePasswordStrength(password)
  if (!passwordValidation.isValid) {
    return {
      success: false,
      error: {
        type: AuthErrorType.WEAK_PASSWORD,
        message: passwordValidation.message || '密码强度不足',
        field: 'password'
      }
    }
  }
  
  try {
    // 哈希密码
    const passwordHash = await hashPassword(password)
    
    // 创建用户
    const user = queries.createUser({
      username,
      email,
      name,
      passwordHash
    })
    
    return {
      success: true,
      user
    }
  } catch (error) {
    console.error('注册失败:', error)
    
    if (error instanceof Error) {
      if (error.message === '用户名已被注册') {
        return {
          success: false,
          error: {
            type: AuthErrorType.DUPLICATE_EMAIL,
            message: '该用户名已被注册',
            field: 'username'
          }
        }
      }
      if (error.message === '邮箱已被注册') {
        return {
          success: false,
          error: {
            type: AuthErrorType.DUPLICATE_EMAIL,
            message: '该邮箱已被注册',
            field: 'email'
          }
        }
      }
    }
    
    return {
      success: false,
      error: {
        type: AuthErrorType.UNAUTHORIZED,
        message: '注册失败，请稍后重试'
      }
    }
  }
}

/**
 * 用户登出
 * @param sessionId 会话ID
 */
export async function logoutUser(sessionId: string): Promise<void> {
  if (!sessionId) {
    return
  }
  
  try {
    const { destroySession } = await import('./session')
    await destroySession(sessionId)
  } catch (error) {
    console.error('登出失败:', error)
  }
}

/**
 * 设置会话Cookie
 * @param response NextResponse对象
 * @param sessionId 会话ID
 * @param rememberMe 是否为长期会话
 */
export function setSessionCookie(
  response: NextResponse,
  sessionId: string,
  rememberMe: boolean = false
): void {
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 : 24 * 60 * 60 // 30天或1天（秒）
  
  response.cookies.set(AUTH_CONFIG.sessionCookieName, sessionId, {
    ...AUTH_CONFIG.cookieOptions,
    maxAge,
  })
}

/**
 * 清除会话Cookie
 * @param response NextResponse对象
 */
export function clearSessionCookie(response: NextResponse): void {
  response.cookies.delete(AUTH_CONFIG.sessionCookieName)
}

/**
 * 创建未认证响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function createUnauthorizedResponse(message: string = '未授权访问'): NextResponse {
  return NextResponse.json(
    {
      code: 401,
      message,
      error: {
        type: AuthErrorType.UNAUTHORIZED
      }
    },
    { status: 401 }
  )
}

/**
 * 创建禁止访问响应
 * @param message 错误消息
 * @returns NextResponse
 */
export function createForbiddenResponse(message: string = '权限不足'): NextResponse {
  return NextResponse.json(
    {
      code: 403,
      message,
      error: {
        type: AuthErrorType.UNAUTHORIZED
      }
    },
    { status: 403 }
  )
}

/**
 * API路由认证装饰器
 * @param handler API处理函数
 * @param requireAdminRole 是否需要管理员权限
 * @returns 包装后的处理函数
 */
export function withAuth(
  handler: (request: NextRequest, user: User) => Promise<NextResponse>,
  requireAdminRole: boolean = false
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const user = requireAdminRole 
      ? await requireAdmin(request)
      : await requireAuth(request)
    
    if (!user) {
      return requireAdminRole
        ? createForbiddenResponse('需要管理员权限')
        : createUnauthorizedResponse('请先登录')
    }
    
    return handler(request, user)
  }
}