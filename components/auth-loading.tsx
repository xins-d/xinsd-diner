"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Loader2 } from "lucide-react"

interface AuthLoadingProps {
  message?: string
  showSkeleton?: boolean
}

export function AuthLoading({ 
  message = "正在验证身份...", 
  showSkeleton = false 
}: AuthLoadingProps) {
  if (showSkeleton) {
    return (
      <div className="min-h-screen bg-background">
        {/* 导航栏骨架 */}
        <div className="sticky top-0 z-30 bg-card border-b shadow-sm">
          <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          </div>
        </div>

        {/* 内容骨架 */}
        <div className="container mx-auto px-3 sm:px-4 py-6">
          <div className="space-y-4">
            <Skeleton className="h-12 w-full" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-32 w-full mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-3/4" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="relative">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <div className="absolute inset-0 rounded-full border-2 border-primary/20"></div>
          </div>
          
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold">身份验证中</h3>
            <p className="text-sm text-muted-foreground">{message}</p>
          </div>
          
          {/* 进度指示器 */}
          <div className="w-full max-w-xs">
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full animate-pulse"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}