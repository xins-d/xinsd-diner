// API客户端类型定义
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  error?: {
    type: string
    field?: string
  }
}

export interface MenuItem {
  id: number
  name: string
  category: string
  image: string
  description: string
}

export interface Category {
  id: string
  name: string
  image: string
}

export interface MenuItemsResponse {
  items: MenuItem[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface GetMenuItemsParams {
  category?: string
  categoryId?: string
  search?: string
  page?: number
  limit?: number
}

export interface AddMenuItemRequest {
  name: string
  description: string
  category: string
  image?: string
}

export interface AddCategoryRequest {
  name: string
  image?: string
}

export interface DeleteResponse {
  deleted_count: number
  deleted_ids: number[]
}

export interface RecipeGenerateRequest {
  cart_items: MenuItem[]
  requirements: {
    dish_count?: number
    soup_count?: number
    spice_level?: string
    restrictions?: string
    other_requirements?: string
  }
  generate_images?: boolean
}

export interface RecipeResponse {
  recipe_content: string
  generated_at: string
  recipe_id?: number
  dish_images?: { [key: string]: string }
  images_generated?: number
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
}

export interface GenerateImageRequest {
  itemName: string
  category: string
}

export interface GenerateImageResponse {
  imageUrl: string
  originalUrl: string
  prompt: string
  generatedAt: string
  usage?: {
    width?: number
    height?: number
    image_count?: number
  }
}

// 自定义错误类
export class ApiError extends Error {
  public code: number
  public type?: string
  public field?: string

  constructor(message: string, code: number = 500, type?: string, field?: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.type = type
    this.field = field
  }
}

// API客户端类
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl
  }

  // 统一的请求处理
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)
      const data: ApiResponse<T> = await response.json()

      if (!response.ok || data.code >= 400) {
        throw new ApiError(
          data.message || '请求失败',
          data.code || response.status,
          data.error?.type,
          data.error?.field
        )
      }

      return data.data as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      // 网络错误或其他错误
      throw new ApiError(
        error instanceof Error ? error.message : '网络请求失败',
        500
      )
    }
  }

  // GET请求
  private async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const searchParams = new URLSearchParams()
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
    }

    const queryString = searchParams.toString()
    const url = queryString ? `${endpoint}?${queryString}` : endpoint

    return this.request<T>(url, { method: 'GET' })
  }

  // POST请求
  private async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // 文件上传请求
  private async upload<T>(endpoint: string, formData: FormData): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        body: formData,
      })

      const data: ApiResponse<T> = await response.json()

      if (!response.ok || data.code >= 400) {
        throw new ApiError(
          data.message || '上传失败',
          data.code || response.status,
          data.error?.type,
          data.error?.field
        )
      }

      return data.data as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      
      throw new ApiError(
        error instanceof Error ? error.message : '文件上传失败',
        500
      )
    }
  }

  // 商品相关API
  async getMenuItems(params?: GetMenuItemsParams): Promise<MenuItemsResponse> {
    return this.get<MenuItemsResponse>('/menu/items', params)
  }

  async getMenuItem(id: number): Promise<MenuItem> {
    return this.get<MenuItem>('/menu/item', { id })
  }

  async addMenuItem(data: AddMenuItemRequest): Promise<MenuItem> {
    return this.post<MenuItem>('/menu/add-item', data)
  }

  async deleteMenuItems(ids: number[]): Promise<DeleteResponse> {
    return this.post<DeleteResponse>('/menu/delete-items', { ids })
  }

  async updateMenuItem(id: number, data: AddMenuItemRequest): Promise<MenuItem> {
    return this.post<MenuItem>('/menu/update-item', { id, ...data })
  }

  // 分类相关API
  async getCategories(): Promise<Category[]> {
    return this.get<Category[]>('/categories')
  }

  async addCategory(data: AddCategoryRequest): Promise<Category> {
    return this.post<Category>('/categories/add', data)
  }

  async deleteCategory(id: string): Promise<{ deleted_category: string; deleted_items_count: number }> {
    return this.post('/categories/delete', { id })
  }

  async updateCategory(id: string, data: AddCategoryRequest): Promise<Category> {
    return this.post<Category>('/categories/update', { id, ...data })
  }

  // 菜谱生成API
  async generateRecipe(data: RecipeGenerateRequest): Promise<RecipeResponse> {
    return this.post<RecipeResponse>('/recipes/generate', data)
  }

  // 图片上传API
  async uploadImage(file: File, type: 'item' | 'category'): Promise<UploadResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('type', type)

    return this.upload<UploadResponse>('/upload/image', formData)
  }

  // AI生图API
  async generateImage(data: GenerateImageRequest): Promise<GenerateImageResponse> {
    return this.post<GenerateImageResponse>('/ai/generate-image', data)
  }
}

// 创建默认的API客户端实例
export const apiClient = new ApiClient()

// 导出便捷方法
export const {
  getMenuItems,
  getMenuItem,
  addMenuItem,
  deleteMenuItems,
  updateMenuItem,
  getCategories,
  addCategory,
  deleteCategory,
  updateCategory,
  generateRecipe,
  uploadImage,
  generateImage,
} = apiClient