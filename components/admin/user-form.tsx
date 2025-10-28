"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Eye, EyeOff } from "lucide-react"

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

interface UserFormData {
  email: string
  password: string
  name: string
  role: 'user' | 'admin'
  isActive: boolean
}

interface UserFormProps {
  user?: User // 如果提供了user，则为编辑模式
  onSuccess: () => void
  onCancel: () => void
}

export function UserForm({ user, onSuccess, onCancel }: UserFormProps) {
  const isEditing = !!user
  
  const [formData, setFormData] = useState<UserFormData>({
    email: user?.email || "",
    password: "",
    name: user?.name || "",
    role: user?.role || 'user',
    isActive: user?.isActive ?? true
  })
  
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: keyof UserFormData, value: string | boolean) => {
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
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
    
    // 创建模式下密码是必填的
    if (!isEditing) {
      if (!formData.password) {
        errors.password = "请输入密码"
      } else if (formData.password.length < 6) {
        errors.password = "密码至少需要6个字符"
      }
    } else {
      // 编辑模式下，如果输入了密码则验证长度
      if (formData.password && formData.password.length < 6) {
        errors.password = "密码至少需要6个字符"
      }
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
    
    try {
      const url = isEditing 
        ? `/api/v1/admin/users/${user.id}`
        : '/api/v1/admin/users'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      // 构建请求体
      const requestBody: any = {
        email: formData.email.trim().toLowerCase(),
        name: formData.name.trim(),
        role: formData.role,
        isActive: formData.isActive
      }
      
      // 只在创建模式或编辑时输入了密码时才发送密码
      if (!isEditing || formData.password) {
        requestBody.password = formData.password
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        if (data.error?.field) {
          setFieldErrors({ [data.error.field]: data.message })
        } else {
          setError(data.message || `${isEditing ? '更新' : '创建'}用户失败`)
        }
        return
      }
      
      // 成功
      onSuccess()
    } catch (error) {
      console.error(`${isEditing ? '更新' : '创建'}用户错误:`, error)
      setError("网络错误，请稍后重试")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={true} onOpenChange={() => onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '编辑用户' : '创建用户'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? '修改用户信息和权限设置' 
              : '填写用户信息创建新账户'
            }
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">姓名</Label>
              <Input
                id="name"
                type="text"
                placeholder="请输入姓名"
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
              <Label htmlFor="password">
                密码 {isEditing && <span className="text-sm text-muted-foreground">(留空则不修改)</span>}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder={isEditing ? "留空则不修改密码" : "请输入密码"}
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
              {fieldErrors.password && (
                <p className="text-sm text-red-500">{fieldErrors.password}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">用户角色</Label>
              <Select
                value={formData.role}
                onValueChange={(value: 'user' | 'admin') => handleInputChange("role", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择用户角色" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">普通用户</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) => handleInputChange("isActive", checked)}
                disabled={isLoading}
              />
              <Label htmlFor="isActive">
                账户状态 ({formData.isActive ? '活跃' : '禁用'})
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading 
                ? (isEditing ? "更新中..." : "创建中...") 
                : (isEditing ? "更新" : "创建")
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}