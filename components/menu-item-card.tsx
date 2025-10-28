"use client"

import type { MenuItem } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Check, Edit } from "lucide-react"
import { useCart } from "@/contexts/cart-context"
import { OptimizedImage } from "./optimized-image"
import { cn } from "@/lib/utils"
import { useEffect, useRef, useState } from "react"
import { EditItemDialog } from "./edit-item-dialog"

interface MenuItemCardProps {
  item: MenuItem
  isSelectionMode?: boolean
  isSelected?: boolean
  onSelect?: (id: number) => void
  onLongPress?: (id: number) => void
}

export function MenuItemCard({
  item,
  isSelectionMode = false,
  isSelected = false,
  onSelect,
  onLongPress,
}: MenuItemCardProps) {
  const { addToCart, cart } = useCart()
  const isInCart = cart.some((cartItem) => cartItem.id === item.id)
  const [editDialogOpen, setEditDialogOpen] = useState(false)

  const longPressTimer = useRef<NodeJS.Timeout>()
  const isLongPress = useRef(false)

  const handleTouchStart = () => {
    isLongPress.current = false
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true
      onLongPress?.(item.id)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
    }
  }

  const handleClick = () => {
    if (isSelectionMode && onSelect) {
      onSelect(item.id)
    }
  }

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current)
      }
    }
  }, [])

  return (
    <>
      <Card
        className={cn(
          "overflow-hidden hover:shadow-lg transition-all duration-300 group cursor-pointer",
          isSelectionMode && "ring-2 ring-red-200",
          isSelected && "ring-2 ring-red-500 shadow-lg",
        )}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onClick={handleClick}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-secondary">
          <OptimizedImage
            src={item.image}
            alt={item.name}
            fill
            aspectRatio="4/3"
            imageType="item"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {isSelectionMode && (
            <div
              className={cn(
                "absolute top-2 left-2 w-5 h-5 sm:w-6 sm:h-6 rounded-full border-2 flex items-center justify-center transition-all",
                isSelected ? "bg-red-500 border-red-500" : "bg-white/80 border-gray-300",
              )}
            >
              {isSelected && <Check className="h-3 w-3 sm:h-4 sm:w-4 text-white" />}
            </div>
          )}
          {isInCart && !isSelectionMode && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1.5">
              <Check className="h-3 w-3 sm:h-4 sm:w-4" />
            </div>
          )}
          {!isSelectionMode && (
            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="secondary"
                className="h-6 w-6 p-0 rounded-full"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditDialogOpen(true)
                }}
              >
                <Edit className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
        <CardContent className="p-2 sm:p-2.5">
          <div className="space-y-1.5">
            <div className="min-h-[2.5rem] sm:min-h-[3rem]">
              <h3 className="font-semibold text-sm sm:text-base text-foreground mb-0.5 line-clamp-1">{item.name}</h3>
              {item.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 leading-snug">{item.description}</p>
              )}
            </div>
            {!isSelectionMode && (
              <Button
                onClick={(e) => {
                  e.stopPropagation()
                  if (!isLongPress.current) {
                    addToCart(item)
                  }
                }}
                size="sm"
                disabled={isInCart}
                className="w-full rounded-lg h-7 sm:h-8 gap-1.5 bg-primary hover:bg-primary/90 disabled:opacity-50"
              >
                {isInCart ? (
                  <>
                    <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">已添加</span>
                  </>
                ) : (
                  <>
                    <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="text-xs sm:text-sm">添加</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      <EditItemDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={item}
      />
    </>
  )
}
