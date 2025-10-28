"use client"

import type React from "react"
import { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { MenuItem, Category, AddMenuItemRequest, AddCategoryRequest } from "@/lib/types"
import { apiClient, ApiError } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { menuItems as staticMenuItems, categories as staticCategories } from "@/lib/menu-data"

interface MenuContextType {
  menuItems: MenuItem[]
  categories: Category[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  } | null
  currentCategoryId: string | null
  currentSearchQuery: string | null
  addMenuItem: (item: AddMenuItemRequest) => Promise<boolean>
  addCategory: (category: AddCategoryRequest) => Promise<void>
  deleteMenuItems: (ids: number[]) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  updateMenuItem: (id: number, item: AddMenuItemRequest) => Promise<boolean>
  updateCategory: (id: string, category: AddCategoryRequest) => Promise<void>
  loadMenuItems: (categoryId?: string, search?: string, page?: number, limit?: number) => Promise<void>
  refreshCategories: () => Promise<void>
}

const MenuContext = createContext<MenuContextType | undefined>(undefined)

export function MenuProvider({ children }: { children: React.ReactNode }) {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [useStaticData, setUseStaticData] = useState(false)
  const [pagination, setPagination] = useState<{
    page: number
    limit: number
    total: number
    total_pages: number
  } | null>(null)
  const [currentCategoryId, setCurrentCategoryId] = useState<string | null>(null)
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string | null>(null)
  const { toast } = useToast()
  const { isAuthenticated, loading: authLoading } = useAuth()

  // 加载分类数据
  const refreshCategories = useCallback(async () => {
    try {
      const data = await apiClient.getCategories()
      setCategories(data)
      setError(null)
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : '加载分类失败'
      console.error('Failed to load categories:', error)
      throw error
    }
  }, [])

  // 加载商品数据（支持分页和筛选）
  const loadMenuItems = useCallback(async (categoryId?: string, search?: string, page: number = 1, limit: number = 20) => {
    try {
      setLoading(true)
      // 保存当前的查询参数
      setCurrentCategoryId(categoryId || null)
      setCurrentSearchQuery(search || null)
      
      const data = await apiClient.getMenuItems({ categoryId, search, page, limit })
      setMenuItems(data.items)
      setPagination(data.pagination)
      setError(null)
    } catch (error) {
      const errorMessage = error instanceof ApiError ? error.message : '加载商品失败'
      console.error('Failed to load menu items:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  // 刷新商品数据（保持当前分页状态和查询条件）
  const refreshMenuItems = useCallback(async () => {
    if (pagination) {
      await loadMenuItems(currentCategoryId || undefined, currentSearchQuery || undefined, pagination.page, pagination.limit)
    } else {
      await loadMenuItems(currentCategoryId || undefined, currentSearchQuery || undefined)
    }
  }, [loadMenuItems, pagination, currentCategoryId, currentSearchQuery])

  // 初始化数据加载（只在用户已登录时执行）
  useEffect(() => {
    // 等待认证状态确定
    if (authLoading) {
      return
    }
    
    // 如果用户未登录，使用静态数据
    if (!isAuthenticated) {
      setUseStaticData(true)
      setCategories(staticCategories)
      // 转换静态数据的ID格式
      const convertedItems = staticMenuItems.map(item => ({
        ...item,
        id: parseInt(String(item.id).replace(/\D/g, '')) || Math.floor(Math.random() * 1000)
      }))
      setMenuItems(convertedItems)
      setPagination({
        page: 1,
        limit: 20,
        total: convertedItems.length,
        total_pages: Math.ceil(convertedItems.length / 20)
      })
      setError(null)
      setLoading(false)
      return
    }
    
    // 用户已登录，尝试加载真实数据
    const loadInitialData = async () => {
      setLoading(true)
      setError(null)
      
      try {
        // 先尝试加载分类数据
        await refreshCategories()
        // 不在这里加载商品数据，等待分类选择后再加载
        setUseStaticData(false)
      } catch (error) {
        console.error('Failed to load initial data, falling back to static data:', error)
        
        // 检查是否是认证错误（401）
        const isAuthError = error instanceof ApiError && error.status === 401
        
        if (!isAuthError) {
          // 只有在非认证错误时才显示数据库连接失败的消息
          toast({
            title: "数据库连接失败",
            description: "已切换到演示模式，数据不会保存",
            variant: "destructive",
          })
        }
        
        // 回退到静态数据
        setUseStaticData(true)
        setCategories(staticCategories)
        // 转换静态数据的ID格式
        const convertedItems = staticMenuItems.map(item => ({
          ...item,
          id: parseInt(String(item.id).replace(/\D/g, '')) || Math.floor(Math.random() * 1000)
        }))
        setMenuItems(convertedItems)
        setPagination({
          page: 1,
          limit: 20,
          total: convertedItems.length,
          total_pages: Math.ceil(convertedItems.length / 20)
        })
        setError(null)
      } finally {
        setLoading(false)
      }
    }

    loadInitialData()
  }, [isAuthenticated, authLoading])

  // 添加商品
  const addMenuItem = useCallback(
    async (item: AddMenuItemRequest): Promise<boolean> => {
      if (useStaticData) {
        // 静态数据模式
        const isDuplicate = menuItems.some((existingItem) => existingItem.name.toLowerCase() === item.name.toLowerCase())
        if (isDuplicate) {
          toast({
            title: "商品名称已存在",
            description: "请使用不同的商品名称",
            variant: "destructive",
          })
          return false
        }

        const newItem: MenuItem = {
          ...item,
          id: Date.now(),
          image: item.image || '/placeholder.svg',
        }
        setMenuItems((prev) => [...prev, newItem])
        toast({
          title: "商品添加成功（静态模式）",
        })
        return true
      }

      try {
        const newItem = await apiClient.addMenuItem(item)
        // 添加商品后刷新商品列表以获取最新数据
        await refreshMenuItems()
        toast({
          title: "商品添加成功",
        })
        return true
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : '添加商品失败'
        toast({
          title: "添加失败",
          description: errorMessage,
          variant: "destructive",
        })
        return false
      }
    },
    [toast, useStaticData, menuItems, refreshMenuItems],
  )

  // 更新商品
  const updateMenuItem = useCallback(
    async (id: number, item: AddMenuItemRequest): Promise<boolean> => {
      if (useStaticData) {
        // 静态数据模式
        const isDuplicate = menuItems.some((existingItem) => 
          existingItem.id !== id && existingItem.name.toLowerCase() === item.name.toLowerCase()
        )
        if (isDuplicate) {
          toast({
            title: "商品名称已存在",
            description: "请使用不同的商品名称",
            variant: "destructive",
          })
          return false
        }

        setMenuItems((prev) => prev.map(existingItem => 
          existingItem.id === id ? { ...existingItem, ...item } : existingItem
        ))
        toast({
          title: "商品更新成功（静态模式）",
        })
        return true
      }

      try {
        await apiClient.updateMenuItem(id, item)
        await refreshMenuItems()
        toast({
          title: "商品更新成功",
        })
        return true
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : '更新商品失败'
        toast({
          title: "更新失败",
          description: errorMessage,
          variant: "destructive",
        })
        return false
      }
    },
    [toast, useStaticData, menuItems, refreshMenuItems],
  )

  // 添加分类
  const addCategory = useCallback(
    async (category: AddCategoryRequest): Promise<void> => {
      if (useStaticData) {
        // 静态数据模式
        const newCategory: Category = {
          ...category,
          id: `cat-${Date.now()}`,
          image: category.image || '/abstract-categories.png',
        }
        setCategories((prev) => [...prev, newCategory])
        toast({
          title: "分类添加成功（静态模式）",
        })
        return
      }

      try {
        const newCategory = await apiClient.addCategory(category)
        // 添加分类后刷新分类列表
        await refreshCategories()
        toast({
          title: "分类添加成功",
        })
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : '添加分类失败'
        toast({
          title: "添加失败",
          description: errorMessage,
          variant: "destructive",
        })
        throw error
      }
    },
    [toast, useStaticData, refreshCategories],
  )

  // 更新分类
  const updateCategory = useCallback(
    async (id: string, category: AddCategoryRequest): Promise<void> => {
      if (useStaticData) {
        // 静态数据模式
        setCategories((prev) => prev.map(existingCategory => 
          existingCategory.id === id ? { ...existingCategory, ...category } : existingCategory
        ))
        toast({
          title: "分类更新成功（静态模式）",
        })
        return
      }

      try {
        await apiClient.updateCategory(id, category)
        await refreshCategories()
        toast({
          title: "分类更新成功",
        })
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : '更新分类失败'
        toast({
          title: "更新失败",
          description: errorMessage,
          variant: "destructive",
        })
        throw error
      }
    },
    [toast, useStaticData, refreshCategories],
  )

  // 删除商品
  const deleteMenuItems = useCallback(
    async (ids: number[]): Promise<void> => {
      if (useStaticData) {
        // 静态数据模式
        setMenuItems((prev) => prev.filter((item) => !ids.includes(item.id)))
        toast({
          title: "商品删除成功（静态模式）",
        })
        return
      }

      try {
        await apiClient.deleteMenuItems(ids)
        // 删除商品后刷新商品列表
        await refreshMenuItems()
        toast({
          title: "商品删除成功",
        })
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : '删除商品失败'
        toast({
          title: "删除失败",
          description: errorMessage,
          variant: "destructive",
        })
        throw error
      }
    },
    [toast, useStaticData, refreshMenuItems],
  )

  // 删除分类
  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      if (useStaticData) {
        // 静态数据模式
        setCategories((prev) => prev.filter((cat) => cat.id !== id))
        setMenuItems((prev) => prev.filter((item) => item.category !== id))
        toast({
          title: "分类删除成功（静态模式）",
        })
        return
      }

      try {
        const result = await apiClient.deleteCategory(id)
        // 删除分类后刷新分类和商品列表
        await Promise.all([refreshCategories(), refreshMenuItems()])
        toast({
          title: "分类删除成功",
          description: `已删除 ${result.deleted_items_count} 个商品`,
        })
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : '删除分类失败'
        toast({
          title: "删除失败",
          description: errorMessage,
          variant: "destructive",
        })
        throw error
      }
    },
    [toast, useStaticData, refreshCategories, refreshMenuItems],
  )

  return (
    <MenuContext.Provider
      value={{
        menuItems,
        categories,
        loading,
        error,
        pagination,
        currentCategoryId,
        currentSearchQuery,
        addMenuItem,
        addCategory,
        deleteMenuItems,
        deleteCategory,
        updateMenuItem,
        updateCategory,
        loadMenuItems,
        refreshCategories,
      }}
    >
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const context = useContext(MenuContext)
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider")
  }
  return context
}
