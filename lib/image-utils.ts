/**
 * 图片工具函数
 */

/**
 * 获取安全的图片URL，如果图片为空或无效则返回占位符
 * @param imageUrl 原始图片URL
 * @param fallback 备用占位符路径，默认为 /placeholder.svg
 * @returns 安全的图片URL
 */
export function getSafeImageUrl(imageUrl?: string | null, fallback: string = "/placeholder.svg"): string {
  // 如果没有图片URL或为空字符串，返回占位符
  if (!imageUrl || imageUrl.trim() === "") {
    return fallback
  }

  // 如果已经是占位符，直接返回
  if (imageUrl === fallback) {
    return imageUrl
  }

  // 检查是否是有效的URL格式
  try {
    // 如果是相对路径，直接返回
    if (imageUrl.startsWith("/") || imageUrl.startsWith("./") || imageUrl.startsWith("../")) {
      return imageUrl
    }

    // 如果是完整URL，验证格式
    new URL(imageUrl)
    return imageUrl
  } catch {
    // URL格式无效，返回占位符
    return fallback
  }
}

/**
 * 根据图片类型获取对应的占位符
 * @param type 图片类型
 * @returns 占位符路径
 */
export function getPlaceholderByType(type: "item" | "category" | "recipe" | "user" | "default" = "default"): string {
  const placeholders = {
    item: "/placeholder.svg",
    category: "/placeholder.svg", 
    recipe: "/placeholder.svg",
    user: "/placeholder-user.jpg",
    default: "/placeholder.svg"
  }

  return placeholders[type] || placeholders.default
}

/**
 * 检查图片URL是否为占位符
 * @param imageUrl 图片URL
 * @returns 是否为占位符
 */
export function isPlaceholderImage(imageUrl?: string | null): boolean {
  if (!imageUrl) return true
  
  const placeholderPaths = [
    "/placeholder.svg",
    "/placeholder.jpg", 
    "/placeholder.png",
    "/placeholder-user.jpg",
    "/placeholder-logo.svg",
    "/placeholder-logo.png"
  ]
  
  return placeholderPaths.some(path => imageUrl.includes(path))
}

/**
 * 为图片URL添加错误处理参数
 * @param imageUrl 原始图片URL
 * @returns 带错误处理的图片URL
 */
export function addImageErrorHandling(imageUrl: string): string {
  if (isPlaceholderImage(imageUrl)) {
    return imageUrl
  }

  // 如果是外部URL，可以添加一些错误处理参数
  if (imageUrl.startsWith("http")) {
    // 这里可以添加图片服务的错误处理参数
    // 例如：添加默认图片参数等
    return imageUrl
  }

  return imageUrl
}

/**
 * 生成响应式图片srcSet
 * @param baseUrl 基础图片URL
 * @param sizes 尺寸数组
 * @returns srcSet字符串
 */
export function generateSrcSet(baseUrl: string, sizes: number[] = [320, 640, 1024, 1280]): string {
  if (isPlaceholderImage(baseUrl)) {
    return baseUrl
  }

  // 如果是本地图片或占位符，直接返回
  if (baseUrl.startsWith("/")) {
    return baseUrl
  }

  // 为外部图片生成不同尺寸的srcSet
  // 这里可以根据实际的图片服务来调整
  return sizes
    .map(size => `${baseUrl}?w=${size} ${size}w`)
    .join(", ")
}