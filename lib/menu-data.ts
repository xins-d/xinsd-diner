import type { MenuItem, Category } from "./types"

export const menuItems: MenuItem[] = [
  // 蔬菜区
  {
    id: "veg-1",
    name: "有机生菜",
    category: "vegetables",
    image: "/fresh-organic-lettuce.png",
    description: "新鲜有机生菜，清脆爽口",
  },
  {
    id: "veg-2",
    name: "西兰花",
    category: "vegetables",
    image: "/fresh-broccoli.png",
    description: "营养丰富的西兰花",
  },
  {
    id: "veg-3",
    name: "胡萝卜",
    category: "vegetables",
    image: "/fresh-carrots.png",
    description: "甜脆可口的胡萝卜",
  },
  {
    id: "veg-4",
    name: "番茄",
    category: "vegetables",
    image: "/fresh-tomatoes.png",
    description: "鲜红多汁的番茄",
  },
  {
    id: "veg-5",
    name: "菠菜",
    category: "vegetables",
    image: "/fresh-spinach.png",
    description: "富含铁质的新鲜菠菜",
  },
  {
    id: "veg-6",
    name: "青椒",
    category: "vegetables",
    image: "/fresh-green-peppers.jpg",
    description: "清脆的青椒",
  },

  // 水产区
  {
    id: "sea-1",
    name: "三文鱼",
    category: "seafood",
    image: "/fresh-salmon-fillet.jpg",
    description: "挪威进口三文鱼",
  },
  {
    id: "sea-2",
    name: "大虾",
    category: "seafood",
    image: "/fresh-prawns.jpg",
    description: "新鲜大虾，肉质鲜美",
  },
  {
    id: "sea-3",
    name: "鲈鱼",
    category: "seafood",
    image: "/fresh-sea-bass.jpg",
    description: "活鲜鲈鱼",
  },
  {
    id: "sea-4",
    name: "扇贝",
    category: "seafood",
    image: "/fresh-scallops.jpg",
    description: "肥美的扇贝",
  },
  {
    id: "sea-5",
    name: "螃蟹",
    category: "seafood",
    image: "/fresh-crab.jpg",
    description: "鲜活大闸蟹",
  },
  {
    id: "sea-6",
    name: "鱿鱼",
    category: "seafood",
    image: "/fresh-squid.jpg",
    description: "新鲜鱿鱼",
  },

  // 肉类区
  {
    id: "meat-1",
    name: "牛排",
    category: "meat",
    image: "/premium-beef-steak.jpg",
    description: "澳洲进口牛排",
  },
  {
    id: "meat-2",
    name: "猪肉",
    category: "meat",
    image: "/fresh-pork.jpg",
    description: "优质五花肉",
  },
  {
    id: "meat-3",
    name: "鸡胸肉",
    category: "meat",
    image: "/fresh-chicken-breast.jpg",
    description: "低脂健康鸡胸肉",
  },
  {
    id: "meat-4",
    name: "羊肉",
    category: "meat",
    image: "/fresh-lamb.jpg",
    description: "内蒙古羊肉",
  },
  {
    id: "meat-5",
    name: "排骨",
    category: "meat",
    image: "/fresh-pork-ribs.jpg",
    description: "新鲜猪排骨",
  },
  {
    id: "meat-6",
    name: "鸭肉",
    category: "meat",
    image: "/fresh-duck.jpg",
    description: "农家散养鸭",
  },
]

export const categories: Category[] = [
  { id: "vegetables", name: "蔬菜区", image: "/category-vegetables.jpg" },
  { id: "seafood", name: "水产区", image: "/category-seafood.jpg" },
  { id: "meat", name: "肉类区", image: "/category-meat.jpg" },
]
