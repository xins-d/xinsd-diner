import type React from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="absolute inset-0 bg-white/20 backdrop-blur-sm"></div>
      <div className="relative z-10">
        {children}
      </div>
    </div>
  )
}

export const metadata = {
  title: "认证 - Xinsd 苍蝇饭馆",
  description: "用户认证页面",
}