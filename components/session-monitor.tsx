"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { AlertCircle, Clock, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"

interface SessionMonitorProps {
  children: React.ReactNode
}

export function SessionMonitor({ children }: SessionMonitorProps) {
  const [sessionExpired, setSessionExpired] = useState(false)
  const [showWarning, setShowWarning] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const router = useRouter()
  const { toast } = useToast()
  const { clearAuth, logout } = useAuth()

  // Check if we're on an auth page where session monitoring should be disabled
  const isAuthPage = typeof window !== 'undefined' && 
    (window.location.pathname === '/login' || 
     window.location.pathname === '/register' ||
     window.location.pathname.startsWith('/auth/'))

  useEffect(() => {
    // Don't monitor session on auth pages
    if (isAuthPage) {
      return
    }
    let warningTimer: NodeJS.Timeout
    let expirationTimer: NodeJS.Timeout
    let countdownTimer: NodeJS.Timeout

    const checkSession = async () => {
      // 如果已经过期，不再检查
      if (sessionExpired) return
      
      try {
        const response = await fetch("/api/v1/auth/me", {
          method: "GET",
          credentials: "include",
        })

        if (!response.ok) {
          if (response.status === 401) {
            setSessionExpired(true)
            clearAuth() // 清除认证状态
            return
          }
        }

        // 会话有效，设置警告和过期定时器
        // 假设会话在24小时后过期，在23小时50分钟时显示警告
        const warningTime = 23 * 60 * 60 * 1000 + 50 * 60 * 1000 // 23小时50分钟
        const expirationTime = 24 * 60 * 60 * 1000 // 24小时

        warningTimer = setTimeout(() => {
          setShowWarning(true)
          setTimeLeft(10 * 60) // 10分钟倒计时
          
          // 开始倒计时
          countdownTimer = setInterval(() => {
            setTimeLeft(prev => {
              if (prev <= 1) {
                setSessionExpired(true)
                clearAuth() // 清除认证状态
                return 0
              }
              return prev - 1
            })
          }, 1000)

          toast({
            title: "会话即将过期",
            description: "您的登录会话将在10分钟后过期，请及时保存工作",
            variant: "destructive",
          })
        }, warningTime)

        expirationTimer = setTimeout(() => {
          setSessionExpired(true)
          clearAuth() // 清除认证状态
        }, expirationTime)

      } catch (error) {
        console.error("检查会话状态失败:", error)
        setSessionExpired(true)
        clearAuth() // 清除认证状态
      }
    }

    checkSession()

    // 定期检查会话状态（每5分钟）
    const sessionCheckInterval = setInterval(() => {
      if (!sessionExpired) {
        checkSession()
      }
    }, 5 * 60 * 1000)

    return () => {
      clearTimeout(warningTimer)
      clearTimeout(expirationTimer)
      clearInterval(countdownTimer)
      clearInterval(sessionCheckInterval)
    }
  }, [toast, isAuthPage])

  const handleExtendSession = async () => {
    try {
      const response = await fetch("/api/v1/auth/me", {
        method: "GET",
        credentials: "include",
      })

      if (response.ok) {
        setShowWarning(false)
        setTimeLeft(0)
        toast({
          title: "会话已延长",
          description: "您的登录会话已成功延长",
        })
      } else {
        setSessionExpired(true)
      }
    } catch (error) {
      console.error("延长会话失败:", error)
      setSessionExpired(true)
    }
  }

  const handleLogin = () => {
    // 清除所有定时器
    setSessionExpired(false)
    setShowWarning(false)
    setTimeLeft(0)
    
    // 使用logout函数来正确处理登出和重定向
    logout()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  // 会话过期页面 (但不在认证页面显示)
  if (sessionExpired && !isAuthPage) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardContent className="py-8 space-y-4">
            <div className="flex items-center justify-center">
              <AlertCircle className="h-12 w-12 text-amber-500" />
            </div>
            
            <div className="text-center space-y-2">
              <h2 className="text-xl font-semibold">会话已过期</h2>
              <p className="text-muted-foreground">
                为了您的账户安全，您的登录会话已过期。请重新登录以继续使用。
              </p>
            </div>
            
            <Button onClick={handleLogin} className="w-full">
              重新登录
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      {children}
      
      {/* 会话过期警告 */}
      {showWarning && (
        <div className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)]">
          <Alert variant="destructive" className="shadow-lg border-amber-200 bg-amber-50">
            <Clock className="h-4 w-4" />
            <AlertDescription className="space-y-3">
              <div>
                <p className="font-medium">会话即将过期</p>
                <p className="text-sm">
                  剩余时间: {formatTime(timeLeft)}
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleExtendSession}
                  className="flex-1"
                >
                  <RefreshCw className="h-3 w-3 mr-1" />
                  延长会话
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowWarning(false)}
                >
                  忽略
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )}
    </>
  )
}