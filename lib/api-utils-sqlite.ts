import { NextRequest, NextResponse } from 'next/server'
import { testConnection, type User } from './database-sqlite'
import { ApiResponse, createErrorResponse, handleDatabaseError } from './api-types'
import { requireAuth, requireAdmin, createUnauthorizedResponse, createForbiddenResponse } from './auth'

// 统一的API响应处理
export function createApiResponse<T>(data: ApiResponse<T>, status?: number): NextResponse {
  return NextResponse.json(data, { status: status || data.code })
}

// 数据库连接检查中间件（SQLite版本）
export async function withDatabaseConnection<T>(
  handler: () => Promise<ApiResponse<T>>
): Promise<NextResponse> {
  try {
    // 检查数据库连接（SQLite通常不需要连接检查，但保持一致性）
    const isConnected = await testConnection()
    if (!isConnected) {
      return createApiResponse(
        createErrorResponse('数据库连接失败', 500),
        500
      )
    }
    
    const result = await handler()
    return createApiResponse(result)
  } catch (error: any) {
    console.error('API Error:', error)
    
    // 处理SQLite错误
    if (error.code && (error.code.startsWith('SQLITE_') || error.code.includes('CONSTRAINT'))) {
      const dbError = handleDatabaseError(error)
      return createApiResponse(dbError, dbError.code)
    }
    
    // 处理自定义错误
    if (error.message) {
      const customError = handleDatabaseError(error)
      return createApiResponse(customError, customError.code)
    }
    
    // 默认服务器错误
    return createApiResponse(
      createErrorResponse('服务器内部错误', 500),
      500
    )
  }
}

// 请求体解析工具
export async function parseRequestBody(request: Request): Promise<any> {
  try {
    return await request.json()
  } catch (error) {
    throw new Error('请求体格式错误')
  }
}

// 表单数据解析工具
export async function parseFormData(request: Request): Promise<FormData> {
  try {
    return await request.formData()
  } catch (error) {
    throw new Error('表单数据格式错误')
  }
}

// CORS处理
export function setCorsHeaders(response: NextResponse): NextResponse {
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

// OPTIONS请求处理
export function handleOptions(): NextResponse {
  const response = new NextResponse(null, { status: 200 })
  return setCorsHeaders(response)
}

// 带认证的数据库连接中间件
export async function withAuthenticatedDatabaseConnection<T>(
  handler: (user: User) => Promise<ApiResponse<T>>,
  requireAdminRole: boolean = false
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    try {
      // 检查数据库连接
      const isConnected = await testConnection()
      if (!isConnected) {
        return createApiResponse(
          createErrorResponse('数据库连接失败', 500),
          500
        )
      }
      
      // 验证用户认证
      const user = requireAdminRole 
        ? await requireAdmin(request)
        : await requireAuth(request)
      
      if (!user) {
        return requireAdminRole
          ? createForbiddenResponse('需要管理员权限')
          : createUnauthorizedResponse('请先登录')
      }
      
      const result = await handler(user)
      return createApiResponse(result)
    } catch (error: any) {
      console.error('API Error:', error)
      
      // 处理SQLite错误
      if (error.code && (error.code.startsWith('SQLITE_') || error.code.includes('CONSTRAINT'))) {
        const dbError = handleDatabaseError(error)
        return createApiResponse(dbError, dbError.code)
      }
      
      // 处理自定义错误
      if (error.message) {
        const customError = handleDatabaseError(error)
        return createApiResponse(customError, customError.code)
      }
      
      // 默认服务器错误
      return createApiResponse(
        createErrorResponse('服务器内部错误', 500),
        500
      )
    }
  }
}

// 简化的认证API包装器
export function withAuth<T>(
  handler: (request: NextRequest, user: User) => Promise<ApiResponse<T>>,
  requireAdminRole: boolean = false
) {
  return withAuthenticatedDatabaseConnection(
    async (user: User) => {
      // 这里需要从某处获取request，但由于架构限制，我们需要重新设计
      // 暂时返回一个占位符
      throw new Error('需要重新设计认证包装器')
    },
    requireAdminRole
  )
}