"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/components/auth/protected-route"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  LogOut, 
  Settings, 
  Shield, 
  ChevronDown,
  Menu,
  X
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavigationProps {
  title?: string
  showUserMenu?: boolean
  className?: string
}

export function Navigation({ 
  title = "Xinsd 苍蝇饭馆", 
  showUserMenu = true,
  className 
}: NavigationProps) {
  const { user, logout, isAdmin } = useAuth()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("登出失败:", error)
    }
  }

  const handleAdminPanel = () => {
    router.push("/admin/users")
  }

  const handleProfile = () => {
    router.push("/profile")
  }

  const getUserInitials = (name: string) => {
    return name
      .split(" ")
      .map(word => word.charAt(0))
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <header className={cn("sticky top-0 z-30 bg-card border-b shadow-sm", className)}>
      <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
        <div className="flex items-center justify-between">
          {/* 标题 */}
          <div className="flex items-center gap-3">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">
              {title}
            </h1>
          </div>

          {/* 用户菜单 */}
          {showUserMenu && user && (
            <div className="flex items-center gap-2 sm:gap-3">
              {/* 桌面端用户菜单 */}
              <div className="hidden sm:flex items-center gap-2">
                {isAdmin && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    <Shield className="h-3 w-3 mr-1" />
                    管理员
                  </Badge>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2 h-auto p-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs font-medium">
                          {getUserInitials(user.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:flex flex-col items-start">
                        <span className="text-sm font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    <DropdownMenuItem onClick={handleProfile} className="cursor-pointer">
                      <User className="mr-2 h-4 w-4" />
                      个人资料
                    </DropdownMenuItem>
                    
                    {isAdmin && (
                      <DropdownMenuItem onClick={handleAdminPanel} className="cursor-pointer">
                        <Shield className="mr-2 h-4 w-4" />
                        用户管理
                      </DropdownMenuItem>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* 移动端用户菜单 */}
              <div className="sm:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="relative"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" />
                  ) : (
                    <Menu className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* 移动端下拉菜单 */}
        {isMobileMenuOpen && showUserMenu && user && (
          <div className="sm:hidden mt-4 pt-4 border-t">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-sm font-medium">
                  {getUserInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">{user.name}</p>
                  {isAdmin && (
                    <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200 text-xs">
                      <Shield className="h-3 w-3 mr-1" />
                      管理员
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Button
                variant="ghost"
                onClick={handleProfile}
                className="w-full justify-start gap-2 h-auto py-2"
              >
                <User className="h-4 w-4" />
                个人资料
              </Button>
              
              {isAdmin && (
                <Button
                  variant="ghost"
                  onClick={handleAdminPanel}
                  className="w-full justify-start gap-2 h-auto py-2"
                >
                  <Shield className="h-4 w-4" />
                  用户管理
                </Button>
              )}
              
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start gap-2 h-auto py-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                退出登录
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}