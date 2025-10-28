"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCart } from "@/contexts/cart-context"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ShoppingCart, X, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

export function FloatingCart() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const { cart, totalItems, removeFromCart, clearCart } = useCart()

  const handleCheckout = () => {
    setIsOpen(false)
    router.push("/checkout")
  }

  return (
    <>
      {/* 悬浮菜篮子按钮 */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 h-14 w-14 sm:h-16 sm:w-16 rounded-full shadow-lg bg-primary hover:bg-primary/90 z-40"
        size="icon"
      >
        <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6" />
        {totalItems > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-accent text-accent-foreground text-[10px] sm:text-xs font-bold flex items-center justify-center">
            {totalItems}
          </span>
        )}
      </Button>

      {/* 菜篮子侧边栏 */}
      <div
        className={cn(
          "fixed inset-0 bg-black/50 z-50 transition-opacity duration-300",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => setIsOpen(false)}
      />

      <Card
        className={cn(
          "fixed top-0 right-0 h-full w-full sm:w-[400px] md:w-[450px] z-50 transition-transform duration-300 rounded-none sm:rounded-l-xl flex flex-col",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* 头部 */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b bg-card">
          <div className="flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            <h2 className="text-lg sm:text-xl font-bold text-foreground">菜篮子</h2>
            <span className="text-xs sm:text-sm text-muted-foreground">({totalItems})</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="rounded-full h-8 w-8 sm:h-10 sm:w-10"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        {/* 菜篮子内容 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <ShoppingCart className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground/30 mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-muted-foreground">菜篮子是空的</p>
              <p className="text-xs sm:text-sm text-muted-foreground mt-2">快去选购新鲜食材吧！</p>
            </div>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {cart.map((item) => (
                <Card key={item.id} className="p-2.5 sm:p-3">
                  <div className="flex gap-2.5 sm:gap-3">
                    <div className="relative h-16 w-16 sm:h-20 sm:w-20 rounded-md overflow-hidden bg-secondary flex-shrink-0">
                      <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between mb-1.5 sm:mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-sm sm:text-base text-foreground truncate pr-2">
                            {item.name}
                          </h3>
                          <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 mt-1">
                            {item.description}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromCart(item.id)}
                          className="h-6 w-6 sm:h-7 sm:w-7 flex-shrink-0"
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 底部结算 */}
        {cart.length > 0 && (
          <div className="border-t p-3 sm:p-4 bg-card space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between text-sm sm:text-base">
              <span className="text-muted-foreground">已选商品</span>
              <span className="font-semibold text-foreground">{totalItems} 种</span>
            </div>
            <Button
              className="w-full h-11 sm:h-12 text-sm sm:text-base bg-primary hover:bg-primary/90"
              onClick={handleCheckout}
            >
              去结算
            </Button>
            <Button
              variant="outline"
              className="w-full h-10 sm:h-11 text-sm sm:text-base bg-transparent"
              onClick={clearCart}
            >
              清空菜篮子
            </Button>
          </div>
        )}
      </Card>
    </>
  )
}
