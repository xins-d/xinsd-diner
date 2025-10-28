"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AuthLoading } from "@/components/auth-loading"
import { Loader2, AlertCircle } from "lucide-react"

interface User {
  id: number
  email: string
  name: string
  role: 'user' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

interface ProtectedRouteProps {
  children: React.ReactNode
  requireAdmin?: boolean
  fallback?: React.ReactNode
  loadingComponent?: React.ReactNode
}

export function ProtectedRoute({ 
  children, 
  requireAdmin = false, 
  fallback,
  loadingComponent 
}: ProtectedRouteProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          // 未认证，重定向到登录页
          router.push("/login")
          return
        }
        throw new Error("认证检查失败")
      }

      const data = await response.json()
      const userData = data.data.user

      // 检查管理员权限
      if (requireAdmin && userData.role !== 'admin') {
        setError("您没有访问此页面的权限")
        setLoading(false)
        return
      }

      // 检查用户是否被禁用
      if (!userData.isActive) {
        setError("您的账户已被禁用")
        setLoading(false)
        return
      }

      setUser(userData)
    } catch (error) {
      console.error("认证检查错误:", error)
      setError("认证检查失败，请稍后重试")
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    setLoading(true)
    checkAuth()
  }

  const handleLogin = () => {
    router.push("/login")
  }

  // 加载中状态
  if (loading) {
    if (loadingComponent) {
      return <>{loadingComponent}</>
    }

    return <AuthLoading message="正在验证身份..." />
  }

  // 错误状态
  if (error) {
    if (fallback) {
      return <>{fallback}</>
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-red-500" />
            </div>
            
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
            
            <div className="flex flex-col space-y-2">
              <Button onClick={handleRetry} variant="outline" className="w-full">
                重试
              </Button>
              <Button onClick={handleLogin} className="w-full">
                返回登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 认证成功，渲染子组件
  if (user) {
    return <>{children}</>
  }

  // 默认情况（不应该到达这里）
  return null
}

// 高阶组件版本
export function withProtectedRoute<P extends object>(
  Component: React.ComponentType<P>,
  options: { requireAdmin?: boolean } = {}
) {
  return function ProtectedComponent(props: P) {
    return (
      <ProtectedRoute requireAdmin={options.requireAdmin}>
        <Component {...props} />
      </ProtectedRoute>
    )
  }
}

// Hook版本
export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/v1/auth/me", {
        method: "GET",
        credentials: "include",
      })

      if (!response.ok) {
        if (response.status === 401) {
          setUser(null)
          setError("未登录")
          return
        }
        throw new Error("认证检查失败")
      }

      const data = await response.json()
      setUser(data.data.user)
      setError(null)
    } catch (error) {
      console.error("认证检查错误:", error)
      setError("认证检查失败")
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("登出错误:", error)
    } finally {
      setUser(null)
      window.location.href = "/login"
    }
  }

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    checkAuth,
    logout,
  }
}