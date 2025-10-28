/**
 * 应用配置管理
 */

// 图片存储配置
export const IMAGE_CONFIG = {
  // 基础上传路径 (相对于public目录)
  UPLOAD_BASE_PATH: process.env.UPLOAD_BASE_PATH || 'uploads',
  
  // 各类型图片子目录
  TEMP_IMAGES_PATH: process.env.TEMP_IMAGES_PATH || 'temp',
  RECIPE_IMAGES_PATH: process.env.RECIPE_IMAGES_PATH || 'recipes',
  ITEM_IMAGES_PATH: process.env.ITEM_IMAGES_PATH || 'items',
  CATEGORY_IMAGES_PATH: process.env.CATEGORY_IMAGES_PATH || 'categories',
}

// API配置
export const API_CONFIG = {
  QWEN_API_KEY: process.env.QWEN_API_KEY,
  GOOGLE_GEMINI_API_KEY: process.env.GOOGLE_GEMINI_API_KEY,
}

// 获取完整的图片存储路径
export function getImagePaths() {
  const publicDir = process.cwd() + '/public'
  const uploadsDir = `${publicDir}/${IMAGE_CONFIG.UPLOAD_BASE_PATH}`
  
  return {
    publicDir,
    uploadsDir,
    tempDir: `${uploadsDir}/${IMAGE_CONFIG.TEMP_IMAGES_PATH}`,
    recipeDir: `${uploadsDir}/${IMAGE_CONFIG.RECIPE_IMAGES_PATH}`,
    itemDir: `${uploadsDir}/${IMAGE_CONFIG.ITEM_IMAGES_PATH}`,
    categoryDir: `${uploadsDir}/${IMAGE_CONFIG.CATEGORY_IMAGES_PATH}`,
  }
}

// 获取图片URL路径
export function getImageUrlPaths() {
  const baseUrl = `/${IMAGE_CONFIG.UPLOAD_BASE_PATH}`
  
  return {
    baseUrl,
    tempUrl: `${baseUrl}/${IMAGE_CONFIG.TEMP_IMAGES_PATH}`,
    recipeUrl: `${baseUrl}/${IMAGE_CONFIG.RECIPE_IMAGES_PATH}`,
    itemUrl: `${baseUrl}/${IMAGE_CONFIG.ITEM_IMAGES_PATH}`,
    categoryUrl: `${baseUrl}/${IMAGE_CONFIG.CATEGORY_IMAGES_PATH}`,
  }
}

// 验证必要的环境变量
export function validateConfig() {
  const errors: string[] = []
  
  if (!API_CONFIG.QWEN_API_KEY) {
    errors.push('QWEN_API_KEY 环境变量未设置')
  }
  
  if (!API_CONFIG.GOOGLE_GEMINI_API_KEY) {
    errors.push('GOOGLE_GEMINI_API_KEY 环境变量未设置')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}