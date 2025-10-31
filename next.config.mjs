/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // 移除 output: 'export' 以支持 API 路由
  // output: 'export', // 静态导出模式不支持 API 路由，已注释
  trailingSlash: true,
  // 生产环境使用 standalone 模式以优化部署
  output: process.env.NODE_ENV === 'production' ? 'standalone' : undefined,
}

export default nextConfig
