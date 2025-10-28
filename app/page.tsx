"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import { MenuItemCard } from "@/components/menu-item-card"
import { FloatingCart } from "@/components/floating-cart"
import { AddItemDialog } from "@/components/add-item-dialog"
import { AddCategoryDialog } from "@/components/add-category-dialog"
import { EditCategoryDialog } from "@/components/edit-category-dialog"
import { ConfirmDeleteDialog } from "@/components/confirm-delete-dialog"
import { ProtectedRoute } from "@/components/auth/protected-route"
import { Navigation } from "@/components/navigation"
import { useMenu } from "@/contexts/menu-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Search, ChevronLeft, ChevronRight, Trash2, X } from "lucide-react"
import { PaginationSettings } from "@/components/pagination-settings"

const DEFAULT_ITEMS_PER_PAGE = 20

function HomePage() {
  const { menuItems, categories, deleteMenuItems, deleteCategory, loading, error, pagination, loadMenuItems } = useMenu()
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)

  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedItems, setSelectedItems] = useState<number[]>([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteType, setDeleteType] = useState<"items" | "category">("items")
  const [categoryToDelete, setCategoryToDelete] = useState<string>("")
  const [editCategoryDialogOpen, setEditCategoryDialogOpen] = useState(false)
  const [categoryToEdit, setCategoryToEdit] = useState<string>("")

  const categoryLongPressTimer = useRef<NodeJS.Timeout>()
  const isCategoryLongPress = useRef(false)

  // 使用API分页，不需要前端过滤
  const paginatedItems = menuItems

  const handleCategoryChange = async (categoryId: string) => {
    setSelectedCategory(categoryId)
    setSearchQuery("")
    setCurrentPage(1)
    await loadMenuItems(categoryId, "", 1, itemsPerPage)
  }

  // 当分类加载完成后，设置默认分类并加载商品
  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      const firstCategoryId = categories[0].id
      setSelectedCategory(firstCategoryId)
      // 加载第一个分类的商品
      loadMenuItems(firstCategoryId, "", 1, itemsPerPage)
    }
  }, [categories, selectedCategory, loadMenuItems])

  const handleSearchChange = async (value: string) => {
    setSearchQuery(value)
    setCurrentPage(1)
    await loadMenuItems(selectedCategory, value, 1, itemsPerPage)
  }

  const handleItemsPerPageChange = async (newLimit: number) => {
    setItemsPerPage(newLimit)
    setCurrentPage(1)
    await loadMenuItems(selectedCategory, searchQuery, 1, newLimit)
  }

  const handleItemLongPress = (itemId: number) => {
    setIsSelectionMode(true)
    setSelectedItems([itemId])
  }

  const handleItemSelect = (itemId: number) => {
    setSelectedItems((prev) => (prev.includes(itemId) ? prev.filter((id) => id !== itemId) : [...prev, itemId]))
  }

  const handleCancelSelection = () => {
    setIsSelectionMode(false)
    setSelectedItems([])
  }

  const handleDeleteItems = () => {
    setDeleteType("items")
    setDeleteDialogOpen(true)
  }

  const confirmDeleteItems = async () => {
    try {
      await deleteMenuItems(selectedItems)
      handleCancelSelection()
      setDeleteDialogOpen(false)
    } catch (error) {
      // 错误已在Context中处理
    }
  }

  const handleCategoryTouchStart = (categoryId: string) => {
    isCategoryLongPress.current = false
    categoryLongPressTimer.current = setTimeout(() => {
      isCategoryLongPress.current = true
      // 显示分类操作菜单（这里简化为直接编辑）
      setCategoryToEdit(categoryId)
      setEditCategoryDialogOpen(true)
    }, 500)
  }

  const handleCategoryDoubleClick = (categoryId: string) => {
    setCategoryToEdit(categoryId)
    setEditCategoryDialogOpen(true)
  }

  const handleCategoryTouchEnd = () => {
    if (categoryLongPressTimer.current) {
      clearTimeout(categoryLongPressTimer.current)
    }
  }

  const confirmDeleteCategory = async () => {
    try {
      await deleteCategory(categoryToDelete)
      setDeleteDialogOpen(false)
      setCategoryToDelete("")
      // 如果删除的是当前选中的分类，切换到第一个分类
      if (categoryToDelete === selectedCategory && categories.length > 1) {
        const remainingCategories = categories.filter((c) => c.id !== categoryToDelete)
        if (remainingCategories.length > 0) {
          setSelectedCategory(remainingCategories[0].id)
        }
      }
    } catch (error) {
      // 错误已在Context中处理
    }
  }

  useEffect(() => {
    return () => {
      if (categoryLongPressTimer.current) {
        clearTimeout(categoryLongPressTimer.current)
      }
    }
  }, [])

  const deleteDialogTitle = deleteType === "items" ? "确认删除商品" : "确认删除分类"

  const deleteDialogDescription =
    deleteType === "items"
      ? `确定要删除选中的 ${selectedItems.length} 个商品吗？此操作无法撤销。`
      : `确定要删除"${categories.find((c) => c.id === categoryToDelete)?.name}"分类吗？该分类下的所有商品也将被删除，此操作无法撤销。`

  return (
    <div className="min-h-screen bg-background">
      {/* 导航栏 */}
      <Navigation />
      
      {/* 操作栏和分类导航 */}
      <div className="sticky top-[73px] sm:top-[81px] z-20 bg-card border-b shadow-sm">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">食材管理</span>
            </div>
            {isSelectionMode ? (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteItems}
                  disabled={selectedItems.length === 0}
                  className="gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>删除 ({selectedItems.length})</span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelSelection} className="gap-1.5 bg-transparent">
                  <X className="h-4 w-4" />
                  <span>取消</span>
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <AddCategoryDialog />
                <AddItemDialog />
              </div>
            )}
          </div>

          {/* 分类导航 */}
          <nav className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-3 sm:mx-0 px-3 sm:px-0">
            {categories.map((category) => (
              <Button
                key={category.id}
                onClick={() => {
                  if (!isCategoryLongPress.current) {
                    handleCategoryChange(category.id)
                  }
                }}
                onDoubleClick={() => handleCategoryDoubleClick(category.id)}
                onTouchStart={() => handleCategoryTouchStart(category.id)}
                onTouchEnd={handleCategoryTouchEnd}
                onMouseDown={() => handleCategoryTouchStart(category.id)}
                onMouseUp={handleCategoryTouchEnd}
                onMouseLeave={handleCategoryTouchEnd}
                variant={selectedCategory === category.id ? "default" : "outline"}
                className={cn(
                  "flex-shrink-0 gap-1.5 sm:gap-2 transition-all text-sm sm:text-base h-9 sm:h-10 px-3 sm:px-4",
                  selectedCategory === category.id && "bg-primary text-primary-foreground",
                )}
              >
                <span>{category.name}</span>
              </Button>
            ))}
          </nav>
        </div>
      </div>

      {/* 主要内容 */}
      <main className="container mx-auto px-3 sm:px-4 py-3 sm:py-4 md:py-6">
        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">加载中...</p>
            </div>
          </div>
        )}

        {/* 错误状态 */}
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} variant="outline">
              重新加载
            </Button>
          </div>
        )}

        {/* 正常内容 */}
        {!loading && !error && (
          <>
        {!isSelectionMode && selectedCategory && (
          <div className="mb-3 sm:mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-foreground mb-0.5">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </h2>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  共 {pagination?.total || 0} 种商品
                  {searchQuery && ` · 搜索结果`}
                </p>
              </div>

              <div className="relative w-full sm:w-64 md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="搜索商品名称或描述..."
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-9 h-9 sm:h-10"
                />
              </div>
            </div>
          </div>
        )}

        {isSelectionMode && (
          <div className="mb-3 sm:mb-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <p className="text-sm text-foreground">长按商品进入选择模式，点击商品进行多选，选择完成后点击删除按钮</p>
          </div>
        )}

        {/* 商品网格 */}
        {!selectedCategory ? (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground text-sm sm:text-base">请选择一个分类查看商品</p>
          </div>
        ) : paginatedItems.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 pb-6">
            {paginatedItems.map((item) => (
              <MenuItemCard
                key={item.id}
                item={item}
                isSelectionMode={isSelectionMode}
                isSelected={selectedItems.includes(item.id)}
                onSelect={handleItemSelect}
                onLongPress={handleItemLongPress}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16">
            <p className="text-muted-foreground text-sm sm:text-base">
              {searchQuery ? '没有找到相关商品' : '该分类下暂无商品'}
            </p>
          </div>
        )}

        {pagination && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 sm:mt-6 pb-20 sm:pb-24">
            {/* 分页设置 */}
            <div className="flex items-center gap-2">
              <PaginationSettings
                currentLimit={itemsPerPage}
                onLimitChange={handleItemsPerPageChange}
              />
              <span className="text-xs sm:text-sm text-muted-foreground">
                共 {pagination.total} 个商品
              </span>
            </div>

            {/* 分页控件 */}
            {pagination.total_pages > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const newPage = Math.max(1, currentPage - 1)
                    setCurrentPage(newPage)
                    await loadMenuItems(selectedCategory, searchQuery, newPage, itemsPerPage)
                  }}
                  disabled={currentPage === 1}
                  className="h-8 sm:h-9 px-2 sm:px-3"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">上一页</span>
                </Button>

                <div className="flex items-center gap-1 sm:gap-2">
                  {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => {
                    // 在移动端只显示当前页和相邻页
                    const showOnMobile = Math.abs(page - currentPage) <= 1
                    const showOnDesktop = page === 1 || page === pagination.total_pages || Math.abs(page - currentPage) <= 2

                    if (!showOnDesktop) return null

                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={async () => {
                          setCurrentPage(page)
                          await loadMenuItems(selectedCategory, searchQuery, page, itemsPerPage)
                        }}
                        className={cn("h-8 sm:h-9 w-8 sm:w-9 p-0", !showOnMobile && "hidden sm:inline-flex")}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const newPage = Math.min(pagination.total_pages, currentPage + 1)
                    setCurrentPage(newPage)
                    await loadMenuItems(selectedCategory, searchQuery, newPage, itemsPerPage)
                  }}
                  disabled={currentPage === pagination.total_pages}
                  className="h-8 sm:h-9 px-2 sm:px-3"
                >
                  <span className="hidden sm:inline mr-1">下一页</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )}
          </>
        )}
      </main>

      {/* 悬浮菜篮子 */}
      <FloatingCart />

      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={deleteType === "items" ? confirmDeleteItems : confirmDeleteCategory}
        title={deleteDialogTitle}
        description={deleteDialogDescription}
      />

      <EditCategoryDialog
        open={editCategoryDialogOpen}
        onOpenChange={setEditCategoryDialogOpen}
        category={categories.find(c => c.id === categoryToEdit) || categories[0]}
      />
    </div>
  )
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomePage />
    </ProtectedRoute>
  )
}
