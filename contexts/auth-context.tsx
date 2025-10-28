"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

// 用户类型定义
export interface User {
  id: number
  username: string
  email: string
  name: string
  role: 'user' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

// 登录数据类型
export interface LoginData {
  username: string
  password: string
  rememberMe?: boolean
}

// 注册数据类型
export interface RegisterData {
  username: string
  email: string
  password: string
  confirmPassword: string
  name: string
}

// 认证上下文类型
interface AuthContextType {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (data: LoginData) => Promise<boolean>
  register: (data: RegisterData) => Promise<boolean>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
  refreshUser: () => Promise<void>
  clearAuth: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

interface AuthProviderProps {
  children: React.ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [shouldCheckAuth, setShouldCheckAuth] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  // 检查认证状态
  const checkAuth = useCallback(async () => {
    if (!shouldCheckAuth) return
    
    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.data.user)
        setShouldCheckAuth(true) // 确保后续可以继续检查
      } else {
        setUser(null)
        if (response.status === 401) {
          setShouldCheckAuth(false) // 停止继续检查
        }
      }
    } catch (error) {
      console.error("认证检查失败:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [shouldCheckAuth])

  // 刷新用户信息
  const refreshUser = useCallback(async () => {
    if (!user) return
    
    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.data.user)
      }
    } catch (error) {
      console.error("刷新用户信息失败:", error)
    }
  }, [user])

  // 用户登录
  const login = useCallback(async (data: LoginData): Promise<boolean> => {
    try {
      const response = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        setUser(result.data.user)
        setShouldCheckAuth(true) // 重新启用认证检查
        toast({
          title: "登录成功",
          description: `欢迎回来，${result.data.user.name}！`,
        })
        return true
      } else {
        toast({
          title: "登录失败",
          description: result.message || "登录失败，请检查您的凭据",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("登录错误:", error)
      toast({
        title: "登录失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }, [toast])

  // 用户注册
  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    try {
      const response = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast({
          title: "注册成功",
          description: "账户创建成功，请登录您的账户",
        })
        return true
      } else {
        toast({
          title: "注册失败",
          description: result.message || "注册失败，请稍后重试",
          variant: "destructive",
        })
        return false
      }
    } catch (error) {
      console.error("注册错误:", error)
      toast({
        title: "注册失败",
        description: "网络错误，请稍后重试",
        variant: "destructive",
      })
      return false
    }
  }, [toast])

  // 清除认证状态
  const clearAuth = useCallback(() => {
    setUser(null)
    setShouldCheckAuth(false)
    setLoading(false)
  }, [])

  // 用户登出
  const logout = useCallback(async () => {
    try {
      await fetch("/api/v1/auth/logout", {
        method: "POST",
        credentials: "include",
      })
    } catch (error) {
      console.error("登出错误:", error)
    } finally {
      clearAuth()
      toast({
        title: "已登出",
        description: "您已成功登出",
      })
      router.push("/login")
      router.refresh()
    }
  }, [router, toast, clearAuth])

  // 初始化时检查认证状态
  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  // 计算派生状态
  const isAuthenticated = !!user
  const isAdmin = user?.role === 'admin'

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    login,
    register,
    logout,
    checkAuth,
    refreshUser,
    clearAuth,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// 使用认证上下文的Hook
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

// 认证状态Hook（不抛出错误版本）
export function useAuthState() {
  const context = useContext(AuthContext)
  return context || {
    user: null,
    loading: false,
    isAuthenticated: false,
    isAdmin: false,
    login: async () => false,
    register: async () => false,
    logout: async () => {},
    checkAuth: async () => {},
    refreshUser: async () => {},
    clearAuth: () => {},
  }
}

// 需要认证的Hook
export function useRequireAuth(redirectTo: string = "/login") {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push(redirectTo)
    }
  }, [user, loading, router, redirectTo])

  return { user, loading }
}

// 需要管理员权限的Hook
export function useRequireAdmin(redirectTo: string = "/") {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login")
      } else if (!isAdmin) {
        router.push(redirectTo)
      }
    }
  }, [user, loading, isAdmin, router, redirectTo])

  return { user, loading, isAdmin }
}