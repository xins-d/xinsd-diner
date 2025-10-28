"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { UserPlus, Search, RefreshCw, Users, UserCheck, UserX } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { UserList } from "./user-list"
import { UserForm } from "./user-form"

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

interface UsersResponse {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

interface UserFilters {
  search: string
  role: string
  isActive: string
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0
  })
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: "all",
    isActive: "all"
  })
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const { toast } = useToast()

  // 加载用户列表
  const loadUsers = async (page: number = 1) => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.search) {
        params.append('search', filters.search)
      }
      if (filters.role && filters.role !== 'all') {
        params.append('role', filters.role)
      }
      if (filters.isActive && filters.isActive !== 'all') {
        params.append('isActive', filters.isActive)
      }

      const response = await fetch(`/api/v1/admin/users?${params}`, {
        method: 'GET',
        credentials: 'include'
      })

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('权限不足，需要管理员权限')
        }
        throw new Error('加载用户列表失败')
      }

      const data = await response.json()
      const result: UsersResponse = data.data

      setUsers(result.users)
      setPagination(result.pagination)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '加载用户列表失败'
      setError(errorMessage)
      toast({
        title: "加载失败",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    loadUsers()
  }, [])

  // 搜索和筛选
  const handleSearch = () => {
    setPagination(prev => ({ ...prev, page: 1 }))
    loadUsers(1)
  }

  // 重置筛选
  const handleReset = () => {
    setFilters({
      search: "",
      role: "all",
      isActive: "all"
    })
    setPagination(prev => ({ ...prev, page: 1 }))
    // 延迟加载以确保状态更新
    setTimeout(() => loadUsers(1), 100)
  }

  // 创建用户成功回调
  const handleUserCreated = () => {
    setShowCreateForm(false)
    loadUsers(pagination.page)
    toast({
      title: "创建成功",
      description: "用户账户创建成功",
    })
  }

  // 更新用户成功回调
  const handleUserUpdated = () => {
    setEditingUser(null)
    loadUsers(pagination.page)
    toast({
      title: "更新成功",
      description: "用户信息更新成功",
    })
  }

  // 删除用户
  const handleDeleteUser = async (userId: number) => {
    if (!confirm('确定要删除这个用户吗？此操作不可撤销。')) {
      return
    }

    try {
      const response = await fetch(`/api/v1/admin/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || '删除用户失败')
      }

      toast({
        title: "删除成功",
        description: "用户已被删除",
      })

      // 重新加载用户列表
      loadUsers(pagination.page)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '删除用户失败'
      toast({
        title: "删除失败",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  // 统计信息
  const stats = {
    total: pagination.total,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    admins: users.filter(u => u.role === 'admin').length
  }

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总用户数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">活跃用户</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">禁用用户</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.inactive}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">管理员</CardTitle>
            <Badge variant="secondary">{stats.admins}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.admins}</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card>
        <CardHeader>
          <CardTitle>搜索和筛选</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="搜索用户姓名或邮箱..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            
            <Select
              value={filters.role}
              onValueChange={(value) => setFilters(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="角色" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部角色</SelectItem>
                <SelectItem value="user">普通用户</SelectItem>
                <SelectItem value="admin">管理员</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={filters.isActive}
              onValueChange={(value) => setFilters(prev => ({ ...prev, isActive: value }))}
            >
              <SelectTrigger className="w-full md:w-32">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="true">活跃</SelectItem>
                <SelectItem value="false">禁用</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex gap-2">
              <Button onClick={handleSearch} disabled={loading}>
                <Search className="h-4 w-4 mr-2" />
                搜索
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={loading}>
                <RefreshCw className="h-4 w-4 mr-2" />
                重置
              </Button>
              <Button onClick={() => setShowCreateForm(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                添加用户
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 错误提示 */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* 用户列表 */}
      <UserList
        users={users}
        loading={loading}
        pagination={pagination}
        onPageChange={loadUsers}
        onEditUser={setEditingUser}
        onDeleteUser={handleDeleteUser}
      />

      {/* 创建用户表单 */}
      {showCreateForm && (
        <UserForm
          onSuccess={handleUserCreated}
          onCancel={() => setShowCreateForm(false)}
        />
      )}

      {/* 编辑用户表单 */}
      {editingUser && (
        <UserForm
          user={editingUser}
          onSuccess={handleUserUpdated}
          onCancel={() => setEditingUser(null)}
        />
      )}
    </div>
  )
}