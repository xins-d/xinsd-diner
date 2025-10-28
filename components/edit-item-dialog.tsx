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
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sparkles, Loader2, Crop } from "lucide-react"
import { useMenu } from "@/contexts/menu-context"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import type { MenuItem } from "@/lib/types"
import { ImageCropper } from "./image-cropper"

interface EditItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: MenuItem
}

export function EditItemDialog({ open, onOpenChange, item }: EditItemDialogProps) {
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [originalImageUrl, setOriginalImageUrl] = useState("")
  const [cropperOpen, setCropperOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  const { updateMenuItem, categories } = useMenu()
  const { toast } = useToast()

  // 当对话框打开时，填充表单数据
  useEffect(() => {
    if (open && item) {
      setName(item.name)
      setDescription(item.description)
      setCategory(item.category)
      setImagePreview(item.image)
      setImageFile(null)
    }
  }, [open, item])

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
    const croppedFile = new File([croppedImageBlob], 'cropped-image.jpg', {
      type: 'image/jpeg',
    })
    
    setImageFile(croppedFile)
    
    // 创建预览URL
    const previewUrl = URL.createObjectURL(croppedImageBlob)
    setImagePreview(previewUrl)
    
    setCropperOpen(false)
  }

  const handleAiGenerate = async () => {
    if (!name || !category) {
      toast({
        title: "请先填写商品名称和分类",
        description: "AI生图需要商品名称和分类信息",
        variant: "destructive",
      })
      return
    }

    setAiGenerating(true)

    try {
      // 获取分类名称
      const categoryName = categories.find(cat => cat.id === category)?.name || category

      // 调用AI生图API
      const result = await apiClient.generateImage({
        itemName: name.trim(),
        category: categoryName
      })

      // 设置生成的图片URL为原始图片，打开裁剪对话框
      setOriginalImageUrl(result.imageUrl)
      setCropperOpen(true)

      toast({
        title: "AI生图成功",
        description: "请调整裁剪区域后确认使用",
      })

    } catch (error) {
      console.error('AI生图失败:', error)
      toast({
        title: "AI生图失败",
        description: error instanceof Error ? error.message : "请稍后重试",
        variant: "destructive",
      })
    } finally {
      setAiGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name || !description || !category) {
      toast({
        title: "请填写所有必填项",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      let imageUrl = item.image

      // 如果有新的图片文件，先上传图片
      if (imageFile) {
        setUploading(true)
        try {
          const uploadResult = await apiClient.uploadImage(imageFile, 'item')
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

      // 更新商品
      const success = await updateMenuItem(item.id, {
        name: name.trim(),
        description: description.trim(),
        category,
        image: imageUrl,
      })

      if (success) {
        onOpenChange(false)
      }
    } catch (error) {
      // 错误已在Context中处理
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>编辑商品</DialogTitle>
          <DialogDescription>修改商品信息</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">商品名称 *</Label>
            <Input 
              id="edit-name" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="输入商品名称"
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">商品描述 *</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="输入商品描述"
              rows={3}
              disabled={submitting}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-category">商品分类 *</Label>
            <Select value={category} onValueChange={setCategory} disabled={submitting}>
              <SelectTrigger>
                <SelectValue placeholder="选择分类" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>商品图片</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="edit-image"
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
              <Button 
                type="button" 
                variant="outline" 
                className="gap-2 bg-transparent"
                onClick={handleAiGenerate}
                disabled={submitting || aiGenerating || !name || !category}
              >
                {aiGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI生图
              </Button>
            </div>
            {uploading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                正在上传图片...
              </div>
            )}
            {aiGenerating && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                AI正在生成图片，请稍候...
              </div>
            )}
            {imagePreview && (
              <div className="mt-2 relative w-full rounded-lg overflow-hidden border">
                <div className="aspect-[4/3] w-full">
                  <img src={imagePreview || "/placeholder.svg"} alt="商品预览" className="w-full h-full object-cover" />
                </div>
                <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  4:3 比例
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
                '更新商品'
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
        title="裁剪商品图片"
      />
    </Dialog>
  )
}