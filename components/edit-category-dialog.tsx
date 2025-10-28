"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2, Crop } from "lucide-react"
import { useMenu } from "@/contexts/menu-context"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { Category } from "@/lib/types"
import { ImageCropper } from "./image-cropper"

interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category
}

export function EditCategoryDialog({ open, onOpenChange, category }: EditCategoryDialogProps) {
  const [name, setName] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [originalImageUrl, setOriginalImageUrl] = useState("")
  const [cropperOpen, setCropperOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const { updateCategory } = useMenu()
  const { toast } = useToast()

  // 当对话框打开时，填充表单数据
  useEffect(() => {
    if (open && category) {
      setName(category.name)
      setImagePreview(category.image)
      setImageFile(null)
    }
  }, [open, category])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const imageUrl = reader.result as string
        setOriginalImageUrl(imageUrl)
        setCropperOpen(true)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = (croppedImageBlob: Blob) => {
    // 将裁剪后的Blob转换为File对象
    const croppedFile = new File([croppedImageBlob], 'cropped-category.jpg', {
      type: 'image/jpeg',
    })
    
    setImageFile(croppedFile)
    
    // 创建预览URL
    const previewUrl = URL.createObjectURL(croppedImageBlob)
    setImagePreview(previewUrl)
    
    setCropperOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name) {
      toast({
        title: "请填写分类名称",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      let imageUrl = category.image

      // 如果有新的图片文件，先上传图片
      if (imageFile) {
        setUploading(true)
        try {
          const uploadResult = await apiClient.uploadImage(imageFile, 'category')
          imageUrl = uploadResult.url
        } catch (error) {
          console.error('Image upload failed:', error)
          toast({
            title: "图片上传失败",
            description: "将使用原有图片",
            variant: "destructive",
          })
        } finally {
          setUploading(false)
        }
      }

      // 更新分类
      await updateCategory(category.id, {
        name: name.trim(),
        image: imageUrl,
      })

      onOpenChange(false)
    } catch (error) {
      // 错误已在Context中处理
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>编辑分类</DialogTitle>
          <DialogDescription>修改分类信息</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-category-name">分类名称 *</Label>
            <Input
              id="edit-category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：水果区"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label>分类图片</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="edit-category-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="cursor-pointer"
                  disabled={submitting}
                />
              </div>
              {imagePreview && (
                <Button 
                  type="button" 
                  variant="outline" 
                  className="gap-2 bg-transparent"
                  onClick={() => {
                    if (originalImageUrl) {
                      setCropperOpen(true)
                    } else {
                      // 如果没有原始图片URL，使用当前预览图片
                      setOriginalImageUrl(imagePreview)
                      setCropperOpen(true)
                    }
                  }}
                  disabled={submitting}
                >
                  <Crop className="h-4 w-4" />
                  重新裁剪
                </Button>
              )}
              <Button type="button" variant="outline" className="gap-2 bg-transparent" disabled>
                <Sparkles className="h-4 w-4" />
                AI生成
              </Button>
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在上传图片...
              </div>
            )}
            {imagePreview && (
              <div className="mt-2 relative w-full rounded-lg overflow-hidden border">
                <div className="aspect-square w-full">
                  <img src={imagePreview || "/placeholder.svg"} alt="分类预览" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  1:1 比例
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploading ? '上传中...' : '更新中...'}
                </>
              ) : (
                '更新分类'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* 图片裁剪对话框 */}
      <ImageCropper
        open={cropperOpen}
        onOpenChange={setCropperOpen}
        imageUrl={originalImageUrl}
        onCropComplete={handleCropComplete}
        aspectRatio={1} // 分类图片使用1:1比例
        title="裁剪分类图片"
      />
    </Dialog>
  )
}