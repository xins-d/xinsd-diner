"use client"

import Image from "next/image"
import { useState } from "react"
import { ImageIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { getSafeImageUrl, getPlaceholderByType, isPlaceholderImage } from "@/lib/image-utils"

interface OptimizedImageProps {
  src?: string | null
  alt: string
  width?: number
  height?: number
  fill?: boolean
  className?: string
  aspectRatio?: "square" | "4/3" | "16/9" | "auto"
  showPlaceholder?: boolean
  placeholderIcon?: React.ReactNode
  imageType?: "item" | "category" | "recipe" | "user" | "default"
  onError?: () => void
  onLoad?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  aspectRatio = "auto",
  showPlaceholder = true,
  placeholderIcon,
  imageType = "default",
  onError,
  onLoad,
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleError = () => {
    setImageError(true)
    setImageLoaded(false)
    onError?.()
  }

  const handleLoad = () => {
    setImageLoaded(true)
    setImageError(false)
    onLoad?.()
  }

  const getAspectRatioClass = () => {
    switch (aspectRatio) {
      case "square":
        return "aspect-square"
      case "4/3":
        return "aspect-[4/3]"
      case "16/9":
        return "aspect-video"
      default:
        return ""
    }
  }

  // 获取安全的图片URL
  const safeImageUrl = getSafeImageUrl(src, getPlaceholderByType(imageType))
  const isPlaceholder = isPlaceholderImage(safeImageUrl)
  
  // 如果没有图片源或图片加载失败，显示占位符
  const shouldShowPlaceholder = (!src || imageError) && showPlaceholder

  if (shouldShowPlaceholder) {
    return (
      <div
        className={cn(
          "bg-muted flex items-center justify-center text-muted-foreground",
          getAspectRatioClass(),
          className
        )}
        style={
          !fill && width && height
            ? { width: `${width}px`, height: `${height}px` }
            : undefined
        }
      >
        <div className="flex flex-col items-center justify-center p-4 text-center">
          {placeholderIcon || <ImageIcon className="h-8 w-8 mb-2" />}
          <span className="text-xs text-muted-foreground">
            {imageError ? "图片加载失败" : "暂无图片"}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("relative overflow-hidden", getAspectRatioClass())}>
      {/* 加载状态 */}
      {!imageLoaded && !imageError && (
        <div
          className={cn(
            "absolute inset-0 bg-muted flex items-center justify-center",
            className
          )}
        >
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mb-2"></div>
            <span className="text-xs text-muted-foreground">加载中...</span>
          </div>
        </div>
      )}

      <Image
        src={safeImageUrl}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        className={cn(
          "transition-opacity duration-300",
          imageLoaded ? "opacity-100" : "opacity-0",
          className
        )}
        onError={handleError}
        onLoad={handleLoad}
        unoptimized
      />
    </div>
  )
}