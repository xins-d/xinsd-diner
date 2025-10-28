"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Loader2, Eye, EyeOff, Check, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

interface RegisterFormData {
  username: string
  email: string
  password: string
  confirmPassword: string
  name: string
}

interface PasswordRequirement {
  label: string
  test: (password: string) => boolean
}

const passwordRequirements: PasswordRequirement[] = [
  { label: "至少8个字符", test: (pwd) => pwd.length >= 8 },
  { label: "包含大写字母", test: (pwd) => /[A-Z]/.test(pwd) },
  { label: "包含小写字母", test: (pwd) => /[a-z]/.test(pwd) },
  { label: "包含数字", test: (pwd) => /\d/.test(pwd) },
  { label: "包含特殊字符", test: (pwd) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd) },
]

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [formData, setFormData] = useState<RegisterFormData>({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    name: ""
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const { register } = useAuth()

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // 清除字段错误
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: "" }))
    }
    // 清除全局错误
    if (error) {
      setError(null)
    }
  }

  const getPasswordStrength = (password: string): number => {
    const passedRequirements = passwordRequirements.filter(req => req.test(password)).length
    return (passedRequirements / passwordRequirements.length) * 100
  }

  const getPasswordStrengthLabel = (strength: number): string => {
    if (strength < 40) return "弱"
    if (strength < 80) return "中等"
    return "强"
  }

  const getPasswordStrengthColor = (strength: number): string => {
    if (strength < 40) return "bg-red-500"
    if (strength < 80) return "bg-yellow-500"
    return "bg-green-500"
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.username.trim()) {
      errors.username = "请输入用户名"
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) {
      errors.username = "用户名只能包含字母、数字、下划线，长度3-20位"
    }
    
    if (!formData.name.trim()) {
      errors.name = "请输入姓名"
    } else if (formData.name.trim().length < 2) {
      errors.name = "姓名至少需要2个字符"
    }
    
    if (!formData.email.trim()) {
      errors.email = "请输入邮箱地址"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "请输入有效的邮箱地址"
    }
    
    if (!formData.password) {
      errors.password = "请输入密码"
    } else {
      const failedRequirements = passwordRequirements.filter(req => !req.test(formData.password))
      if (failedRequirements.length > 0) {
        errors.password = `密码不符合要求：${failedRequirements.map(req => req.label).join("，")}`
      }
    }
    
    if (!formData.confirmPassword) {
      errors.confirmPassword = "请确认密码"
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = "两次输入的密码不一致"
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    const success = await register({
      username: formData.username.trim(),
      email: formData.email.trim().toLowerCase(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      name: formData.name.trim()
    })
    
    try {
      if (success) {
        if (onSuccess) {
          onSuccess()
        } else {
          router.push("/login")
        }
      }
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = getPasswordStrength(formData.password)

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">注册</CardTitle>
        <CardDescription className="text-center">
          创建您的账户来访问点菜平台
        </CardDescription>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="username">用户名</Label>
            <Input
              id="username"
              type="text"
              placeholder="请输入用户名（3-20位字母数字下划线）"
              value={formData.username}
              onChange={(e) => handleInputChange("username", e.target.value)}
              disabled={isLoading}
              className={fieldErrors.username ? "border-red-500" : ""}
            />
            {fieldErrors.username && (
              <p className="text-sm text-red-500">{fieldErrors.username}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="name">姓名</Label>
            <Input
              id="name"
              type="text"
              placeholder="请输入您的姓名"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              disabled={isLoading}
              className={fieldErrors.name ? "border-red-500" : ""}
            />
            {fieldErrors.name && (
              <p className="text-sm text-red-500">{fieldErrors.name}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              placeholder="请输入邮箱地址"
              value={formData.email}
              onChange={(e) => handleInputChange("email", e.target.value)}
              disabled={isLoading}
              className={fieldErrors.email ? "border-red-500" : ""}
            />
            {fieldErrors.email && (
              <p className="text-sm text-red-500">{fieldErrors.email}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                disabled={isLoading}
                className={fieldErrors.password ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            
            {formData.password && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>密码强度：</span>
                  <span className={`font-medium ${
                    passwordStrength < 40 ? "text-red-500" :
                    passwordStrength < 80 ? "text-yellow-500" : "text-green-500"
                  }`}>
                    {getPasswordStrengthLabel(passwordStrength)}
                  </span>
                </div>
                <Progress 
                  value={passwordStrength} 
                  className="h-2"
                />
                <div className="space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-xs">
                      {req.test(formData.password) ? (
                        <Check className="h-3 w-3 text-green-500 mr-2" />
                      ) : (
                        <X className="h-3 w-3 text-gray-400 mr-2" />
                      )}
                      <span className={req.test(formData.password) ? "text-green-600" : "text-gray-500"}>
                        {req.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {fieldErrors.password && (
              <p className="text-sm text-red-500">{fieldErrors.password}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">确认密码</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="请再次输入密码"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                disabled={isLoading}
                className={fieldErrors.confirmPassword ? "border-red-500 pr-10" : "pr-10"}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                disabled={isLoading}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            {fieldErrors.confirmPassword && (
              <p className="text-sm text-red-500">{fieldErrors.confirmPassword}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "注册中..." : "注册"}
          </Button>
          
          <div className="text-center text-sm text-muted-foreground">
            已有账户？{" "}
            <Link
              href="/login"
              className="text-primary hover:underline font-medium"
            >
              立即登录
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}