"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"

import { ArrowLeft, Sparkles, Loader2, RefreshCw, Share2, ImageIcon, ChefHat } from "lucide-react"
import { OptimizedImage } from "@/components/optimized-image"
import ReactMarkdown from "react-markdown"
import { apiClient, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import "./recipe-styles.css"

function CheckoutPageContent() {
  const router = useRouter()
  const { cart } = useCart()
  const { toast } = useToast()
  const [dishCount, setDishCount] = useState("")
  const [soupCount, setSoupCount] = useState("")
  const [restrictions, setRestrictions] = useState("")
  const [spiceLevel, setSpiceLevel] = useState("")
  const [otherRequirements, setOtherRequirements] = useState("")
  const [generateImages, setGenerateImages] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedRecipes, setGeneratedRecipes] = useState("")

  const [imagesGenerated, setImagesGenerated] = useState(0)

  const generateRecipe = async () => {
    if (cart.length === 0) {
      toast({
        title: "菜篮子为空",
        description: "请先添加商品到菜篮子",
        variant: "destructive",
      })
      return
    }

    setIsGenerating(true)

    try {
      const requirements = {
        dish_count: dishCount ? parseInt(dishCount) : undefined,
        soup_count: soupCount ? parseInt(soupCount) : undefined,
        spice_level: spiceLevel || undefined,
        restrictions: restrictions.trim() || undefined,
        other_requirements: otherRequirements.trim() || undefined,
      }

      const result = await apiClient.generateRecipe({
        cart_items: cart,
        requirements,
        generate_images: generateImages,
      })

      setGeneratedRecipes(result.recipe_content)
      setImagesGenerated(result.images_generated || 0)
      
      // 调试信息：检查菜谱内容中的图片
      const imageMatches = result.recipe_content.match(/!\[([^\]]*)\]\(([^)]+)\)/g)
      console.log('菜谱中的图片数量:', imageMatches ? imageMatches.length : 0)
      if (imageMatches) {
        console.log('检测到的图片:', imageMatches)
      }
      console.log('API返回的dish_images:', result.dish_images)
      
      const successMessage = generateImages && result.images_generated 
        ? `菜谱生成成功，为 ${result.images_generated} 道菜生成了图片`
        : "菜谱生成成功"
      
      toast({
        title: "菜谱生成成功",
        description: successMessage,
      })
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : '菜谱生成失败'
      toast({
        title: "生成失败",
        description: errorMessage,
        variant: "destructive",
      })
      console.error('Recipe generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleGenerate = generateRecipe

  const handleRegenerate = async () => {
    await generateRecipe()
  }

  const handleShareToWechat = () => {
    if (!generatedRecipes) {
      toast({
        title: "没有可分享的菜谱",
        description: "请先生成菜谱",
        variant: "destructive",
      })
      return
    }

    // 创建分享内容
    const shareTitle = "我的专属菜谱"
    const shareContent = `${shareTitle}\n\n${generatedRecipes}`
    
    // 检查是否在微信环境中
    const isWechat = /micromessenger/i.test(navigator.userAgent)
    
    if (isWechat) {
      // 在微信中，复制内容到剪贴板
      navigator.clipboard.writeText(shareContent).then(() => {
        toast({
          title: "菜谱已复制",
          description: "内容已复制到剪贴板，可以粘贴分享给朋友",
        })
      }).catch(() => {
        // 如果复制失败，显示分享内容
        alert(`菜谱内容：\n\n${shareContent}`)
      })
    } else {
      // 在其他环境中，使用Web Share API或复制到剪贴板
      if (navigator.share) {
        navigator.share({
          title: shareTitle,
          text: shareContent,
        }).catch((error) => {
          console.log('分享失败:', error)
          // 回退到复制剪贴板
          fallbackCopyToClipboard(shareContent)
        })
      } else {
        // 回退到复制剪贴板
        fallbackCopyToClipboard(shareContent)
      }
    }
  }

  const fallbackCopyToClipboard = (content: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(content).then(() => {
        toast({
          title: "菜谱已复制",
          description: "内容已复制到剪贴板，可以分享给朋友",
        })
      }).catch(() => {
        // 最后的回退方案
        const textArea = document.createElement('textarea')
        textArea.value = content
        document.body.appendChild(textArea)
        textArea.select()
        try {
          document.execCommand('copy')
          toast({
            title: "菜谱已复制",
            description: "内容已复制到剪贴板，可以分享给朋友",
          })
        } catch (err) {
          toast({
            title: "复制失败",
            description: "请手动复制菜谱内容",
            variant: "destructive",
          })
        }
        document.body.removeChild(textArea)
      })
    } else {
      toast({
        title: "不支持自动复制",
        description: "请手动复制菜谱内容分享",
        variant: "destructive",
      })
    }
  }

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-6 sm:p-8 text-center max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">菜篮子是空的</h2>
          <p className="text-muted-foreground mb-6">请先选择食材再进行结算</p>
          <Button onClick={() => router.push("/")} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            返回选购
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation title="菜谱生成" />
      
      {/* 返回按钮 */}
      <div className="container mx-auto px-3 sm:px-4 py-2">
        <Button variant="ghost" onClick={() => router.push("/")} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          返回食材选择
        </Button>
      </div>

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8">
        <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
          {/* 左侧：选择的食材和要求 */}
          <div className="space-y-4 sm:space-y-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">已选食材</h2>
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.id} className="flex gap-3 items-center">
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      <OptimizedImage 
                        src={item.image} 
                        alt={item.name} 
                        fill 
                        aspectRatio="square"
                        imageType="item"
                        className="object-cover" 
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base truncate">{item.name}</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground truncate">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-bold mb-4">做菜要求</h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="dish-count">几道菜</Label>
                    <Input
                      id="dish-count"
                      type="number"
                      placeholder="例如: 3"
                      value={dishCount}
                      onChange={(e) => setDishCount(e.target.value)}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="soup-count">几道汤</Label>
                    <Input
                      id="soup-count"
                      type="number"
                      placeholder="例如: 1"
                      value={soupCount}
                      onChange={(e) => setSoupCount(e.target.value)}
                      min="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="spice-level">辣度</Label>
                  <Select value={spiceLevel} onValueChange={setSpiceLevel}>
                    <SelectTrigger id="spice-level">
                      <SelectValue placeholder="选择辣度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="不辣">不辣</SelectItem>
                      <SelectItem value="微辣">微辣</SelectItem>
                      <SelectItem value="中辣">中辣</SelectItem>
                      <SelectItem value="特辣">特辣</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="restrictions">忌口</Label>
                  <Input
                    id="restrictions"
                    placeholder="例如: 海鲜过敏、不吃香菜"
                    value={restrictions}
                    onChange={(e) => setRestrictions(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="other">其他要求</Label>
                  <Textarea
                    id="other"
                    placeholder="例如: 少油少盐、适合老人小孩"
                    value={otherRequirements}
                    onChange={(e) => setOtherRequirements(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-1">
                    <Label htmlFor="generate-images" className="text-sm font-medium">
                      AI生成菜品图片
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      为菜谱中的每道菜自动生成精美图片
                    </p>
                  </div>
                  <Switch
                    id="generate-images"
                    checked={generateImages}
                    onCheckedChange={setGenerateImages}
                  />
                </div>

                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full gap-2 h-11 sm:h-12 text-sm sm:text-base"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                      {generateImages ? "生成菜谱和图片中..." : "生成菜谱中..."}
                    </>
                  ) : (
                    <>
                      {generateImages ? (
                        <ImageIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                      ) : (
                        <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
                      )}
                      {generateImages ? "生成菜谱和图片" : "生成菜谱"}
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>

          {/* 右侧：生成的菜谱 */}
          <div className="lg:sticky lg:top-24 lg:self-start">
            {/* 菜谱卡片 */}
            <Card className="p-4 sm:p-6 min-h-[400px]">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                  <ChefHat className="h-5 w-5 text-primary" />
                  我的菜谱
                </h2>
                {generatedRecipes ? (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleRegenerate}
                      disabled={isGenerating}
                      className="gap-2"
                    >
                      {isGenerating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4" />
                      )}
                      重新生成
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleShareToWechat}
                      className="gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      分享
                    </Button>
                  </div>
                ) : (
                  <Badge variant="outline" className="text-xs">
                    等待生成
                  </Badge>
                )}
              </div>
              
              {generatedRecipes ? (
                <div className="space-y-6">


                  {/* 菜谱标签 */}
                  <div className="flex flex-wrap gap-3">
                    {spiceLevel && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 border-orange-200 px-3 py-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-shadow duration-200">
                        🌶️ {spiceLevel}
                      </Badge>
                    )}
                    {restrictions && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-red-100 to-pink-100 text-red-700 border-red-200 px-3 py-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-shadow duration-200">
                        🚫 {restrictions}
                      </Badge>
                    )}
                    {generateImages && imagesGenerated > 0 && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-blue-100 to-purple-100 text-blue-700 border-blue-200 px-3 py-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-shadow duration-200">
                        🖼️ AI配图
                      </Badge>
                    )}
                    {otherRequirements && (
                      <Badge variant="secondary" className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-700 border-green-200 px-3 py-1.5 text-sm font-medium shadow-sm hover:shadow-md transition-shadow duration-200">
                        ✨ {otherRequirements.length > 10 ? otherRequirements.substring(0, 10) + '...' : otherRequirements}
                      </Badge>
                    )}
                  </div>

                  {/* 菜谱内容 */}
                  <div className="recipe-content bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <ReactMarkdown
                    components={{
                      h1: ({ children }) => (
                        <h1 className="text-3xl font-bold mb-6 pb-3 border-b-2 border-blue-500 flex items-center gap-3 text-gray-800">
                          <span className="inline-flex items-center justify-center w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full">
                            <ChefHat className="h-4 w-4 text-white" />
                          </span>
                          {children}
                        </h1>
                      ),
                      h2: ({ children }) => (
                        <h2 className="text-xl font-semibold text-gray-800 pb-2 border-b border-gray-200 flex items-center gap-2 mt-8 mb-4">
                          <ChefHat className="h-5 w-5 text-blue-500" />
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-lg font-medium text-gray-700 mt-6 mb-3 flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          {children}
                        </h3>
                      ),
                      img: ({ src, alt }) => {
                        console.log('ReactMarkdown img component:', { src, alt })
                        const [imageLoaded, setImageLoaded] = useState(false)
                        const [imageError, setImageError] = useState(false)
                        
                        return (
                          <div className="recipe-dish-image my-8 group">
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 via-white to-purple-50 shadow-xl border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02]">
                              {/* 装饰性边框 */}
                              <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-pink-400/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                              
                              <div className="relative p-2">
                                {/* 加载状态 */}
                                {!imageLoaded && !imageError && (
                                  <div className="w-full h-72 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                      <span className="text-sm text-gray-500">加载图片中...</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* 错误状态 */}
                                {imageError && (
                                  <div className="w-full h-72 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                      <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                                      <span className="text-sm text-gray-500 block">图片加载失败</span>
                                      <span className="text-xs text-gray-400 block mt-1">请检查网络连接</span>
                                    </div>
                                  </div>
                                )}
                                
                                {/* 实际图片 */}
                                <img
                                  src={src || "/placeholder.svg"}
                                  alt={alt || "菜品图片"}
                                  className={`w-full h-72 object-cover rounded-xl transition-all duration-500 group-hover:scale-105 ${
                                    imageLoaded ? 'opacity-100' : 'opacity-0 absolute'
                                  }`}
                                  onError={(e) => {
                                    console.error('图片加载失败:', src)
                                    setImageError(true)
                                    setImageLoaded(false)
                                  }}
                                  onLoad={() => {
                                    console.log('图片加载成功:', src)
                                    setImageLoaded(true)
                                    setImageError(false)
                                  }}
                                />
                              </div>
                              
                              {/* 图片标题和AI标识 */}
                              {imageLoaded && alt && (
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-6 rounded-b-2xl">
                                  <div className="flex items-center justify-center gap-2">
                                    <ImageIcon className="h-4 w-4 text-white/80" />
                                    <p className="text-white font-medium text-center text-sm tracking-wide">
                                      {alt}
                                    </p>
                                  </div>
                                </div>
                              )}
                              
                              {/* AI标识 */}
                              {imageLoaded && (
                                <div className="absolute top-4 right-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white px-3 py-1 rounded-full text-xs font-medium shadow-lg flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  AI生成
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      },
                      ul: ({ children }) => (
                        <ul className="space-y-2 my-4 pl-4">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="space-y-2 my-4 pl-4">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="flex items-start gap-2 text-gray-700 leading-relaxed">
                          <div className="w-1.5 h-1.5 bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span>{children}</span>
                        </li>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 leading-relaxed text-gray-700">
                          {children}
                        </p>
                      ),
                      strong: ({ children }) => (
                        <strong className="font-semibold text-blue-600">
                          {children}
                        </strong>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-blue-400 pl-4 py-2 my-4 text-gray-600 italic">
                          {children}
                        </blockquote>
                      ),
                      code: ({ children }) => (
                        <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md font-mono text-sm border">
                          {children}
                        </code>
                      ),
                      pre: ({ children }) => (
                        <div className="my-6">
                          <pre className="bg-gray-900 text-gray-100 rounded-xl p-6 overflow-x-auto shadow-lg border">
                            {children}
                          </pre>
                        </div>
                      ),
                      hr: () => (
                        <hr className="my-6 border-gray-200" />
                      ),
                      table: ({ children }) => (
                        <div className="my-4 overflow-x-auto">
                          <table className="w-full border-collapse border border-gray-200">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-gray-50">
                          {children}
                        </thead>
                      ),
                      th: ({ children }) => (
                        <th className="px-4 py-2 text-left font-medium border border-gray-200">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="px-4 py-2 border border-gray-200">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {generatedRecipes}
                  </ReactMarkdown>
                </div>
              </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">准备生成您的专属菜谱</h3>
                  <p className="text-sm text-muted-foreground mb-1">填写做菜要求后，点击生成菜谱按钮</p>
                  <p className="text-xs text-muted-foreground">AI将为您生成详细的菜谱和做法</p>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute>
      <CheckoutPageContent />
    </ProtectedRoute>
  )
}
