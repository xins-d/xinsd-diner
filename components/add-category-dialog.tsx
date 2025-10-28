"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderPlus, Sparkles, Loader2, Crop } from "lucide-react"
import { useMenu } from "@/contexts/menu-context"
import { useToast } from "@/hooks/use-toast"
import { apiClient } from "@/lib/api-client"
import { ImageCropper } from "./image-cropper"

export function AddCategoryDialog() {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState("")
  const [originalImageUrl, setOriginalImageUrl] = useState("")
  const [cropperOpen, setCropperOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [aiGenerating, setAiGenerating] = useState(false)

  const { addCategory } = useMenu()
  const { toast } = useToast()

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

  const handleAiGenerate = async () => {
    if (!name) {
      toast({
        title: "请先填写分类名称",
        description: "AI生图需要分类名称信息",
        variant: "destructive",
      })
      return
    }

    setAiGenerating(true)

    try {
      // 调用AI生图API，为分类生成图标
      const result = await apiClient.generateImage({
        itemName: `${name.trim()}分类图标`,
        category: "图标设计"
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

    if (!name) {
      toast({
        title: "请填写分类名称",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      let imageUrl = "/abstract-categories.png"

      // 如果有图片文件，先上传图片
      if (imageFile) {
        setUploading(true)
        try {
          const uploadResult = await apiClient.uploadImage(imageFile, 'category')
          imageUrl = uploadResult.url
        } catch (error) {
          console.error('Image upload failed:', error)
          toast({
            title: "图片上传失败",
            description: "将使用默认图片",
            variant: "destructive",
          })
        } finally {
          setUploading(false)
        }
      }

      // 添加分类
      await addCategory({
        name: name.trim(),
        image: imageUrl,
      })

      setOpen(false)
      setName("")
      setImageFile(null)
      setImagePreview("")
      setOriginalImageUrl("")
    } catch (error) {
      // 错误已在Context中处理
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2 bg-transparent">
          <FolderPlus className="h-4 w-4" />
          添加分类
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加新分类</DialogTitle>
          <DialogDescription>创建一个新的商品分类</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-name">分类名称 *</Label>
            <Input
              id="category-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：水果区"
            />
          </div>

          <div className="space-y-2">
            <Label>分类图片</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  id="category-image"
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
                  onClick={() => setCropperOpen(true)}
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
                disabled={submitting || aiGenerating || !name}
              >
                {aiGenerating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                AI生成
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
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              取消
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {uploading ? '上传中...' : '添加中...'}
                </>
              ) : (
                '添加分类'
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
