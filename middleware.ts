import { NextRequest, NextResponse } from 'next/server'
import { validateRequestSession } from '@/lib/auth'

// 需要认证的API路径
const protectedApiPaths = [
  '/api/v1/menu',
  '/api/v1/categories',
  '/api/v1/recipes',
  '/api/v1/ai',
  '/api/v1/upload',
  '/api/v1/admin'
]

// 需要管理员权限的API路径
const adminApiPaths = [
  '/api/v1/admin'
]

// 不需要认证的API路径
const publicApiPaths = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/logout'
]

// 需要认证的页面路径
const protectedPagePaths = [
  '/',
  '/checkout',
  '/admin'
]

// 认证相关页面路径
const authPagePaths = [
  '/login',
  '/register'
]

/**
 * 检查路径是否匹配
 */
function matchesPath(pathname: string, paths: string[]): boolean {
  return paths.some(path => pathname.startsWith(path))
}

/**
 * 创建重定向响应
 */
function createRedirectResponse(url: string, request: NextRequest): NextResponse {
  const redirectUrl = new URL(url, request.url)
  return NextResponse.redirect(redirectUrl)
}

/**
 * 创建未授权API响应
 */
function createUnauthorizedApiResponse(message: string = '未授权访问'): NextResponse {
  return NextResponse.json(
    {
      code: 401,
      message,
      error: {
        type: 'UNAUTHORIZED'
      }
    },
    { status: 401 }
  )
}

/**
 * 创建禁止访问API响应
 */
function createForbiddenApiResponse(message: string = '权限不足'): NextResponse {
  return NextResponse.json(
    {
      code: 403,
      message,
      error: {
        type: 'FORBIDDEN'
      }
    },
    { status: 403 }
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // 跳过静态资源和Next.js内部路径
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next()
  }

  // 获取会话ID
  const sessionId = request.cookies.get('session_id')?.value

  // 处理API路由
  if (pathname.startsWith('/api/')) {
    // 公开API路径，直接通过
    if (matchesPath(pathname, publicApiPaths)) {
      return NextResponse.next()
    }

    // 需要认证的API路径
    if (matchesPath(pathname, protectedApiPaths)) {
      if (!sessionId) {
        return createUnauthorizedApiResponse('请先登录')
      }

      // 在请求头中添加会话ID，让API路由进行详细验证
      const requestHeaders = new Headers(request.headers)
      requestHeaders.set('x-session-id', sessionId)

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      })
    }

    // 其他API路径直接通过
    return NextResponse.next()
  }

  // 处理页面路由
  const hasSession = !!sessionId

  // 认证页面处理
  if (matchesPath(pathname, authPagePaths)) {
    // 如果有会话，重定向到主页（具体验证在页面中进行）
    if (hasSession) {
      return createRedirectResponse('/', request)
    }
    return NextResponse.next()
  }

  // 受保护页面处理
  if (matchesPath(pathname, protectedPagePaths)) {
    // 如果没有会话，重定向到登录页
    if (!hasSession) {
      const loginUrl = new URL('/login', request.url)
      // 保存原始URL，登录后可以重定向回来
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return NextResponse.next()
  }

  // 其他页面直接通过
  return NextResponse.next()
}

// 配置中间件匹配的路径
export const config = {
  matcher: [
    /*
     * 匹配所有路径除了:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}