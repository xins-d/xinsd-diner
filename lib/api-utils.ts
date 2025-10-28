import { NextResponse } from 'next/server'
import { testConnection } from './database'
import { ApiResponse, createErrorResponse, handleDatabaseError } from './api-types'

// 统一的API响应处理
export function createApiResponse<T>(data: ApiResponse<T>, status?: number): NextResponse {
  return NextResponse.json(data, { status: status || data.code })
}

// 数据库连接检查中间件
export async function withDatabaseConnection<T>(
  handler: () => Promise<ApiResponse<T>>
): Promise<NextResponse> {
  try {
    // 检查数据库连接
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
    
    // 处理数据库错误
    if (error.code && error.code.startsWith('ER_')) {
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