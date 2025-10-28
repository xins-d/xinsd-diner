"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Settings } from "lucide-react"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface PaginationSettingsProps {
  currentLimit: number
  onLimitChange: (limit: number) => void
}

const PAGE_SIZE_OPTIONS = [
  { value: 10, label: "10 个/页" },
  { value: 20, label: "20 个/页" },
  { value: 30, label: "30 个/页" },
  { value: 50, label: "50 个/页" },
]

export function PaginationSettings({ currentLimit, onLimitChange }: PaginationSettingsProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 sm:h-9 px-2 sm:px-3 gap-1.5"
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">{currentLimit}/页</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-3">
          <h4 className="font-medium text-sm">分页设置</h4>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">每页显示数量</label>
            <Select
              value={currentLimit.toString()}
              onValueChange={(value) => {
                const newLimit = parseInt(value)
                onLimitChange(newLimit)
                setOpen(false)
              }}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value.toString()}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}