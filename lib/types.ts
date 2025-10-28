export interface MenuItem {
  id: number  // 改为数字类型，匹配数据库
  name: string
  category: string
  image: string
  description: string
}

export interface CartItem extends MenuItem {}

export interface Category {
  id: string  // 分类代码（用于前端识别）
  dbId?: number  // 数据库自增ID
  name: string
  image: string
}

// API相关类型
export interface ApiResponse<T = any> {
  code: number
  message: string
  data?: T
  error?: {
    type: string
    field?: string
  }
}

export interface ApiError {
  code: number
  message: string
  error?: {
    type: string
    field?: string
  }
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
  cart_items: CartItem[]
  requirements: {
    dish_count?: number
    soup_count?: number
    spice_level?: string
    restrictions?: string
    other_requirements?: string
  }
}

export interface RecipeResponse {
  recipe_content: string
  generated_at: string
  recipe_id?: number
}

export interface UploadResponse {
  url: string
  filename: string
  size: number
  type: string
}
