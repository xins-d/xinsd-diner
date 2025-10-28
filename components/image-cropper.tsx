"use client"

import { useState, useRef, useCallback } from "react"
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import "react-image-crop/dist/ReactCrop.css"

interface ImageCropperProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  imageUrl: string
  onCropComplete: (croppedImageBlob: Blob) => void
  aspectRatio?: number
  title?: string
}

// 商品卡片的宽高比 4:3
const CARD_ASPECT_RATIO = 4 / 3

export function ImageCropper({
  open,
  onOpenChange,
  imageUrl,
  onCropComplete,
  aspectRatio = CARD_ASPECT_RATIO,
  title = "裁剪图片"
}: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [isProcessing, setIsProcessing] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 图片加载完成后设置初始裁剪区域
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height, naturalWidth, naturalHeight } = e.currentTarget
    
    console.log('图片信息:', {
      显示尺寸: { width, height },
      实际尺寸: { naturalWidth, naturalHeight },
      缩放比例: { x: naturalWidth / width, y: naturalHeight / height }
    })
    
    // 创建居中的裁剪区域，保持指定的宽高比
    const crop = centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 80, // 初始宽度为图片的80%
        },
        aspectRatio,
        width,
        height,
      ),
      width,
      height,
    )
    
    setCrop(crop)
  }, [aspectRatio])

  // 生成裁剪后的图片
  const generateCroppedImage = useCallback(async () => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) {
      return
    }

    setIsProcessing(true)

    try {
      const image = imgRef.current
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        throw new Error('无法获取canvas上下文')
      }

      // 获取图片的实际尺寸和显示尺寸
      const naturalWidth = image.naturalWidth
      const naturalHeight = image.naturalHeight
      const displayWidth = image.width
      const displayHeight = image.height

      // 计算缩放比例
      const scaleX = naturalWidth / displayWidth
      const scaleY = naturalHeight / displayHeight

      console.log('裁剪信息:', {
        原始图片尺寸: { naturalWidth, naturalHeight },
        显示尺寸: { displayWidth, displayHeight },
        缩放比例: { scaleX, scaleY },
        显示裁剪区域: completedCrop,
      })

      // 将显示坐标转换为实际图片坐标
      const actualCrop = {
        x: Math.round(completedCrop.x * scaleX),
        y: Math.round(completedCrop.y * scaleY),
        width: Math.round(completedCrop.width * scaleX),
        height: Math.round(completedCrop.height * scaleY),
      }

      console.log('实际裁剪区域:', actualCrop)

      // 确保裁剪区域不超出图片边界
      actualCrop.x = Math.max(0, Math.min(actualCrop.x, naturalWidth - actualCrop.width))
      actualCrop.y = Math.max(0, Math.min(actualCrop.y, naturalHeight - actualCrop.height))
      actualCrop.width = Math.min(actualCrop.width, naturalWidth - actualCrop.x)
      actualCrop.height = Math.min(actualCrop.height, naturalHeight - actualCrop.y)

      // 设置canvas尺寸为裁剪区域的实际尺寸
      canvas.width = actualCrop.width
      canvas.height = actualCrop.height

      // 清除canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制裁剪后的图片（使用实际坐标）
      ctx.drawImage(
        image,
        actualCrop.x,
        actualCrop.y,
        actualCrop.width,
        actualCrop.height,
        0,
        0,
        actualCrop.width,
        actualCrop.height,
      )

      // 将canvas转换为Blob
      canvas.toBlob((blob) => {
        if (blob) {
          onCropComplete(blob)
          onOpenChange(false)
        }
      }, 'image/jpeg', 0.9)
    } catch (error) {
      console.error('裁剪图片失败:', error)
    } finally {
      setIsProcessing(false)
    }
  }, [completedCrop, onCropComplete, onOpenChange])

  const handleCancel = () => {
    setCrop(undefined)
    setCompletedCrop(undefined)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col items-center space-y-4 overflow-auto">
          <div className="relative max-w-full max-h-[60vh] flex items-center justify-center">
            <ReactCrop
              crop={crop}
              onChange={(_, percentCrop) => setCrop(percentCrop)}
              onComplete={(c) => setCompletedCrop(c)}
              aspect={aspectRatio}
              minWidth={50}
              minHeight={50 / aspectRatio}
            >
              <img
                ref={imgRef}
                src={imageUrl}
                alt="待裁剪的图片"
                onLoad={onImageLoad}
                style={{
                  maxWidth: '100%',
                  maxHeight: '60vh',
                  height: 'auto',
                  width: 'auto',
                }}
              />
            </ReactCrop>
          </div>
          
          <div className="text-sm text-muted-foreground text-center">
            <p>拖拽调整裁剪区域，保持 {aspectRatio.toFixed(2)}:1 的比例</p>
            <p>裁剪后的图片将适合商品卡片的显示框</p>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isProcessing}>
            取消
          </Button>
          <Button 
            onClick={generateCroppedImage} 
            disabled={!completedCrop || isProcessing}
          >
            {isProcessing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isProcessing ? '处理中...' : '确认裁剪'}
          </Button>
        </DialogFooter>

        {/* 隐藏的canvas用于生成裁剪后的图片 */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </DialogContent>
    </Dialog>
  )
}