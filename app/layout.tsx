import type React from "react"
import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import { MenuProvider } from "@/contexts/menu-context"
import { CartProvider } from "@/contexts/cart-context"
import { SessionMonitor } from "@/components/session-monitor"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

export const metadata: Metadata = {
  title: "Xinsd 苍蝇饭馆 - 想吃什么点什么",
  description: "在线选择新鲜蔬菜、水产、肉类等优质食材，自动化生成当日菜谱",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable} antialiased`}>
        <AuthProvider>
          <MenuProvider>
            <CartProvider>
              <SessionMonitor>
                <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
                <Toaster />
              </SessionMonitor>
            </CartProvider>
          </MenuProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
