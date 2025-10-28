// API响应基础类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  error?: {
    type: string
    field?: string
  }
}

// 错误类型枚举
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  DUPLICATE_NAME = 'DUPLICATE_NAME',
  NOT_FOUND = 'NOT_FOUND',
  DATABASE_ERROR = 'DATABASE_ERROR',
  FILE_ERROR = 'FILE_ERROR'
}

// 自定义API错误类
export class ApiError extends Error {
  public code: number
  public type?: string
  public field?: string

  constructor(message: string, code: number = 500, type?: string, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.type = type
    this.field = field
  }
}

// 成功响应构造器
export function createSuccessResponse<T>(data: T, message: string = 'success'): ApiResponse<T> {
  return {
    code: 200,
    message,
    data
  }
}

// 创建响应构造器
export function createResponse<T>(code: number, message: string, data?: T): ApiResponse<T> {
  return {
    code,
    message,
    data
  }
}

// 错误响应构造器
export function createErrorResponse(
  message: string, 
  code: number = 500, 
  type?: string, 
  field?: string
): ApiResponse {
  return {
    code,
    message,
    error: type ? { type, field } : undefined
  }
}

// 数据库错误处理
export function handleDatabaseError(error: any): ApiResponse {
  console.error('Database error:', error)
  
  if (error.code === 'ER_DUP_ENTRY') {
    return createErrorResponse('数据已存在', 409, ErrorType.DUPLICATE_NAME)
  }
  
  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return createErrorResponse('关联数据不存在', 400, ErrorType.VALIDATION_ERROR)
  }
  
  if (error.message === '商品名称已存在') {
    return createErrorResponse('商品名称已存在', 409, ErrorType.DUPLICATE_NAME, 'name')
  }
  
  if (error.message === '分类不存在') {
    return createErrorResponse('分类不存在', 404, ErrorType.NOT_FOUND, 'category')
  }
  
  return createErrorResponse('数据库操作失败', 500, ErrorType.DATABASE_ERROR)
}

// 请求验证工具
export function validateRequired(data: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
      return `${field} 不能为空`
    }
  }
  return null
}

// 文件验证工具
export function validateImageFile(file: File): string | null {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  const maxSize = 5 * 1024 * 1024 // 5MB
  
  if (!allowedTypes.includes(file.type)) {
    return '不支持的文件类型，请上传 JPEG、PNG 或 WebP 格式的图片'
  }
  
  if (file.size > maxSize) {
    return '文件大小超过限制，请上传小于 5MB 的图片'
  }
  
  return null
}

// 分页参数验证
export function validatePaginationParams(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '12')))
  
  return { page, limit }
}