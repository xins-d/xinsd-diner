"use client"

import { UserManagement } from "@/components/admin/user-management"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/navigation"

export default function AdminUsersPage() {
  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-background">
        <Navigation title="用户管理" />
        
        <div className="container mx-auto py-6 sm:py-8">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">用户管理</h1>
            <p className="text-muted-foreground mt-2">管理系统用户账户和权限</p>
          </div>
          
          <UserManagement />
        </div>
      </div>
    </ProtectedRoute>
  )
}