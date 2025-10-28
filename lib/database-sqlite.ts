import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// 数据库文件路径
const DB_DIR = join(process.cwd(), 'data')
const DB_PATH = join(DB_DIR, 'fresh_market.db')

// 服务端数据库实例
let serverDb: Database.Database | null = null

// 客户端安全的数据库占位符
const clientPlaceholder = {
  prepare: () => ({ get: () => null, all: () => [], run: () => ({ changes: 0 }) }),
  exec: () => {},
  pragma: () => {},
  transaction: () => () => {}
} as any

// 获取数据库实例
export function getDatabase(): Database.Database {
  if (typeof window !== 'undefined') {
    // 客户端返回安全的占位符，避免错误
    return clientPlaceholder
  }
  
  if (!serverDb) {
    try {
      // 确保数据目录存在
      if (!existsSync(DB_DIR)) {
        mkdirSync(DB_DIR, { recursive: true })
      }
      
      serverDb = new Database(DB_PATH)
      serverDb.pragma('foreign_keys = ON')
      console.log('✅ SQLite数据库连接成功')
    } catch (error) {
      console.error('❌ SQLite数据库连接失败:', error)
      // 返回安全的占位符，避免应用崩溃
      return clientPlaceholder
    }
  }
  
  return serverDb
}

// 数据库连接测试
export async function testConnection(): Promise<boolean> {
  try {
    if (typeof window !== 'undefined') {
      console.log('⚠️ 浏览器环境，跳过数据库连接测试')
      return true // 浏览器环境返回 true，避免触发错误
    }
    
    const database = getDatabase()
    
    // 检查是否是占位符（连接失败的情况）
    if (database === clientPlaceholder) {
      console.error('❌ 数据库连接不可用')
      return false
    }
    
    // 测试查询
    const result = database.prepare('SELECT 1 as test').get()
    if ((result as any)?.test === 1) {
      console.log('✅ SQLite数据库连接成功')
      
      // 检查表是否存在并显示统计信息
      try {
        const categoryCount = database.prepare('SELECT COUNT(*) as count FROM categories').get() as any
        const itemCount = database.prepare('SELECT COUNT(*) as count FROM menu_items').get() as any
        console.log(`📊 分类数量: ${categoryCount.count}`)
        console.log(`📦 商品数量: ${itemCount.count}`)
      } catch (error) {
        console.log('💡 数据库表尚未初始化')
      }
      
      return true
    }
    return false
  } catch (error) {
    console.error('❌ SQLite数据库连接失败:', (error as Error).message)
    return false
  }
}

// 初始化数据库表结构
export function initializeDatabase(): void {
  if (typeof window !== 'undefined') {
    return // 客户端不执行数据库初始化
  }
  
  console.log('🔧 初始化SQLite数据库表结构...')
  const database = getDatabase()
  
  // 创建分类表
  database.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      image TEXT DEFAULT '/abstract-categories.png',
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建商品表
  database.exec(`
    CREATE TABLE IF NOT EXISTS menu_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      category_id INTEGER NOT NULL,
      image TEXT DEFAULT '/placeholder.svg',
      status INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
    )
  `)

  // 创建菜谱表
  database.exec(`
    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      content TEXT NOT NULL,
      cart_items TEXT,
      requirements TEXT,
      dish_count INTEGER,
      soup_count INTEGER,
      spice_level TEXT,
      restrictions TEXT,
      other_requirements TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 创建图片管理表
  database.exec(`
    CREATE TABLE IF NOT EXISTS images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      filepath TEXT NOT NULL,
      url TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('recipe', 'temp', 'user')),
      recipe_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used BOOLEAN DEFAULT FALSE,
      FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
    )
  `)

  // 创建用户表（遵循现有表结构模式）
  database.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    )
  `)

  // 检查是否需要添加username字段（用于已存在的数据库）
  try {
    database.prepare('SELECT username FROM users LIMIT 1').get()
  } catch (error) {
    // username字段不存在，需要添加
    console.log('🔧 添加username字段到现有用户表...')
    database.exec('ALTER TABLE users ADD COLUMN username TEXT')
    
    // 为现有用户生成username（基于email前缀）
    const existingUsers = database.prepare('SELECT id, email FROM users WHERE username IS NULL').all() as any[]
    const updateStmt = database.prepare('UPDATE users SET username = ? WHERE id = ?')
    
    for (const user of existingUsers) {
      const username = user.email.split('@')[0] + '_' + user.id
      updateStmt.run(username, user.id)
    }
    
    // 添加唯一约束
    try {
      database.exec('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username ON users(username)')
    } catch (error) {
      console.log('用户名索引已存在')
    }
  }

  // 创建用户会话表
  database.exec(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at DATETIME NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `)

  // 创建索引
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category_id);
    CREATE INDEX IF NOT EXISTS idx_menu_items_status ON menu_items(status);
    CREATE INDEX IF NOT EXISTS idx_menu_items_name ON menu_items(name);
    CREATE INDEX IF NOT EXISTS idx_categories_code ON categories(code);
    CREATE INDEX IF NOT EXISTS idx_images_type ON images(type);
    CREATE INDEX IF NOT EXISTS idx_images_recipe_id ON images(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_images_used ON images(used);
    CREATE INDEX IF NOT EXISTS idx_images_created_at ON images(created_at);
    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
    CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
  `)

  console.log('✅ 数据库表结构初始化完成')
}

// 初始化默认数据（仅在首次启动时执行）
export async function initializeDefaultData(): Promise<void> {
  if (typeof window !== 'undefined') {
    return // 客户端不执行数据库操作
  }
  
  console.log('🌱 检查数据库初始化状态...')
  
  const database = getDatabase()
  // 检查是否已有任何数据（分类或用户）
  const categoryCount = database.prepare('SELECT COUNT(*) as count FROM categories').get() as any
  const userCount = database.prepare('SELECT COUNT(*) as count FROM users').get() as any
  
  if (categoryCount.count > 0 || userCount.count > 0) {
    console.log('💡 数据库已初始化，跳过默认数据创建')
    return
  }

  console.log('🚀 首次启动，开始初始化默认数据...')

  // 创建默认管理员用户（仅创建一个 admin 账号）
  try {
    const { hashPassword } = await import('./password')
    
    // 创建唯一的管理员账号：用户名和密码都是 admin
    const adminPasswordHash = await hashPassword('admin')
    const insertAdmin = database.prepare(`
      INSERT INTO users (username, email, password_hash, name, role) 
      VALUES (?, ?, ?, ?, ?)
    `)
    insertAdmin.run('admin', 'admin@xinsd.com', adminPasswordHash, '系统管理员', 'admin')
    console.log('✅ 默认管理员账号创建成功 (用户名: admin, 密码: admin)')
    
  } catch (error) {
    console.error('❌ 创建默认管理员用户失败:', error)
    throw error
  }

  // 插入默认分类
  const insertCategory = database.prepare(`
    INSERT INTO categories (code, name, image, sort_order) 
    VALUES (?, ?, ?, ?)
  `)

  const categories = [
    { code: 'vegetables', name: '蔬菜', image: '/vegetables.jpg', sort_order: 1 },
    { code: 'meat', name: '肉类', image: '/meat.jpg', sort_order: 2 },
    { code: 'seafood', name: '海鲜', image: '/seafood.jpg', sort_order: 3 },
    { code: 'fruits', name: '水果', image: '/fruits.jpg', sort_order: 4 },
    { code: 'dairy', name: '乳制品', image: '/dairy.jpg', sort_order: 5 },
    { code: 'grains', name: '谷物', image: '/grains.jpg', sort_order: 6 }
  ]

  const categoryTransaction = database.transaction((categories) => {
    for (const category of categories) {
      insertCategory.run(category.code, category.name, category.image, category.sort_order)
    }
  })

  categoryTransaction(categories)

  // 获取分类ID映射
  const categoryMap = new Map()
  const allCategories = getDatabase().prepare('SELECT id, code FROM categories').all() as any[]
  allCategories.forEach(cat => categoryMap.set(cat.code, cat.id))

  // 插入默认商品
  const insertItem = getDatabase().prepare(`
    INSERT INTO menu_items (name, description, category_id, image, sort_order) 
    VALUES (?, ?, ?, ?, ?)
  `)

  const items = [
    // 蔬菜
    { name: '生菜', description: '新鲜脆嫩的生菜', category: 'vegetables', image: '/vegetables/lettuce.jpg', sort_order: 1 },
    { name: '西红柿', description: '红润饱满的西红柿', category: 'vegetables', image: '/vegetables/tomato.jpg', sort_order: 2 },
    { name: '黄瓜', description: '清脆爽口的黄瓜', category: 'vegetables', image: '/vegetables/cucumber.jpg', sort_order: 3 },
    { name: '胡萝卜', description: '营养丰富的胡萝卜', category: 'vegetables', image: '/vegetables/carrot.jpg', sort_order: 4 },
    { name: '白菜', description: '鲜嫩的大白菜', category: 'vegetables', image: '/vegetables/cabbage.jpg', sort_order: 5 },
    { name: '菠菜', description: '绿叶营养的菠菜', category: 'vegetables', image: '/vegetables/spinach.jpg', sort_order: 6 },
    
    // 肉类
    { name: '猪肉', description: '新鲜的猪肉', category: 'meat', image: '/meat/pork.jpg', sort_order: 1 },
    { name: '牛肉', description: '优质的牛肉', category: 'meat', image: '/meat/beef.jpg', sort_order: 2 },
    { name: '鸡肉', description: '嫩滑的鸡肉', category: 'meat', image: '/meat/chicken.jpg', sort_order: 3 },
    { name: '羊肉', description: '鲜美的羊肉', category: 'meat', image: '/meat/lamb.jpg', sort_order: 4 },
    
    // 海鲜
    { name: '鲈鱼', description: '新鲜的鲈鱼', category: 'seafood', image: '/seafood/bass.jpg', sort_order: 1 },
    { name: '虾', description: '活蹦乱跳的虾', category: 'seafood', image: '/seafood/shrimp.jpg', sort_order: 2 },
    { name: '螃蟹', description: '肥美的螃蟹', category: 'seafood', image: '/seafood/crab.jpg', sort_order: 3 },
    { name: '带鱼', description: '新鲜的带鱼', category: 'seafood', image: '/seafood/hairtail.jpg', sort_order: 4 },
    
    // 水果
    { name: '苹果', description: '脆甜的苹果', category: 'fruits', image: '/fruits/apple.jpg', sort_order: 1 },
    { name: '香蕉', description: '香甜的香蕉', category: 'fruits', image: '/fruits/banana.jpg', sort_order: 2 },
    { name: '橙子', description: '酸甜的橙子', category: 'fruits', image: '/fruits/orange.jpg', sort_order: 3 },
    { name: '葡萄', description: '晶莹的葡萄', category: 'fruits', image: '/fruits/grape.jpg', sort_order: 4 }
  ]

  const itemTransaction = getDatabase().transaction((items) => {
    for (const item of items) {
      const categoryId = categoryMap.get(item.category)
      if (categoryId) {
        insertItem.run(item.name, item.description, categoryId, item.image, item.sort_order)
      }
    }
  })

  itemTransaction(items)

  console.log('✅ 默认数据初始化完成')
}

// 数据类型定义
export interface MenuItem {
  id: number
  name: string
  description: string
  category: string
  image: string
}

export interface Category {
  id: string
  name: string
  image: string
}

export interface MenuItemsResult {
  items: MenuItem[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface DeleteResult {
  deleted_count: number
  deleted_ids: number[]
}

// 查询参数接口
export interface GetMenuItemsParams {
  category?: string
  categoryId?: string
  search?: string
  page?: number
  limit?: number
}

export interface AddMenuItemData {
  name: string
  description: string
  category: string
  image?: string
}

export interface AddCategoryData {
  name: string
  image?: string
}

// 用户相关类型定义
export interface User {
  id: number
  username: string
  email: string
  name: string
  role: 'user' | 'admin'
  isActive: boolean
  createdAt: string
  updatedAt: string
  lastLoginAt?: string
}

export interface CreateUserData {
  username: string
  email: string
  password: string
  name: string
  role?: 'user' | 'admin'
}

export interface UpdateUserData {
  username?: string
  email?: string
  name?: string
  role?: 'user' | 'admin'
  isActive?: boolean
}

export interface UserSession {
  id: string
  userId: number
  expiresAt: string
  createdAt: string
}

export interface UsersResult {
  users: User[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

export interface GetUsersParams {
  search?: string
  role?: 'user' | 'admin'
  isActive?: boolean
  page?: number
  limit?: number
}

// 安全的数据库查询函数
function safeQuery<T>(queryFn: () => T, fallback: T): T {
  try {
    const database = getDatabase()
    if (database === clientPlaceholder) {
      console.warn('数据库不可用，返回默认值')
      return fallback
    }
    return queryFn()
  } catch (error) {
    console.error('数据库查询失败:', error)
    return fallback
  }
}

// 常用查询函数
export const queries = {
  // 获取所有分类
  getCategories(): Category[] {
    return safeQuery(() => {
      const database = getDatabase()
      const stmt = database.prepare(`
        SELECT id, code, name, image 
        FROM categories 
        ORDER BY sort_order ASC, id ASC
      `)
      const rows = stmt.all() as any[]
      return rows.map(row => ({
        id: row.code,  // 前端使用code作为ID
        dbId: row.id,  // 数据库自增ID
        name: row.name,
        image: row.image
      }))
    }, [])
  },

  // 获取商品列表（支持分页和搜索）
  getMenuItems(params: GetMenuItemsParams): MenuItemsResult {
    return safeQuery(() => {
      const { category, categoryId, search, page = 1, limit = 20 } = params
      
      // 确保分页参数是数字
      const pageNum = parseInt(page.toString())
      const limitNum = parseInt(limit.toString())
      
      let sql = `
        SELECT mi.id, mi.name, mi.description, c.code as category, mi.image
        FROM menu_items mi 
        LEFT JOIN categories c ON mi.category_id = c.id
        WHERE mi.status = 1
      `
      const queryParams: any[] = []

      // 支持通过分类代码查询
      if (category) {
        sql += ' AND c.code = ?'
        queryParams.push(category)
      }

      // 支持通过分类ID查询
      if (categoryId) {
        sql += ' AND c.code = ?'
        queryParams.push(categoryId)
      }

      if (search) {
        sql += ' AND (mi.name LIKE ? OR mi.description LIKE ?)'
        queryParams.push(`%${search}%`, `%${search}%`)
      }

      sql += ' ORDER BY mi.sort_order ASC, mi.created_at DESC'
      
      // 计算总数
      const countSql = sql.replace(
        'SELECT mi.id, mi.name, mi.description, c.code as category, mi.image',
        'SELECT COUNT(*) as total'
      ).replace(/ORDER BY.*$/, '')
      
      const countStmt = getDatabase().prepare(countSql)
      const countResult = countStmt.get(...queryParams) as any
      const total = countResult.total
      
      // 分页
      const offset = (pageNum - 1) * limitNum
      sql += ` LIMIT ? OFFSET ?`
      queryParams.push(limitNum, offset)
      
      const stmt = getDatabase().prepare(sql)
      const rows = stmt.all(...queryParams) as MenuItem[]
      
      return {
        items: rows,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          total_pages: Math.ceil(total / limitNum)
        }
      }
    }, {
      items: [],
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        total_pages: 0
      }
    })
  },

  // 获取单个商品
  getMenuItem(id: number): MenuItem | null {
    const stmt = getDatabase().prepare(`
      SELECT mi.id, mi.name, mi.description, c.code as category, mi.image 
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE mi.id = ?
    `)
    const item = stmt.get(id) as MenuItem | undefined
    return item || null
  },

  // 添加商品
  addMenuItem(data: AddMenuItemData): MenuItem {
    const { name, description, category, image } = data
    
    // 检查商品名称是否重复
    const existingStmt = getDatabase().prepare('SELECT id FROM menu_items WHERE name = ?')
    const existing = existingStmt.get(name)
    
    if (existing) {
      throw new Error('商品名称已存在')
    }
    
    // 获取分类ID
    const categoryStmt = getDatabase().prepare('SELECT id FROM categories WHERE code = ?')
    const categoryRow = categoryStmt.get(category) as any
    
    if (!categoryRow) {
      throw new Error('分类不存在')
    }
    
    const categoryId = categoryRow.id

    const insertStmt = getDatabase().prepare(`
      INSERT INTO menu_items (name, description, category_id, image) 
      VALUES (?, ?, ?, ?)
    `)
    
    const result = insertStmt.run(name, description, categoryId, image || '/placeholder.svg')
    
    return { 
      id: result.lastInsertRowid as number, 
      name, 
      description, 
      category, 
      image: image || '/placeholder.svg'
    }
  },

  // 删除商品（物理删除）
  deleteMenuItems(ids: number[]): DeleteResult {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { deleted_count: 0, deleted_ids: [] }
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const stmt = getDatabase().prepare(`DELETE FROM menu_items WHERE id IN (${placeholders})`)
    
    const result = stmt.run(...ids)
    
    return {
      deleted_count: result.changes,
      deleted_ids: ids
    }
  },

  // 添加分类
  addCategory(data: AddCategoryData): Category {
    const { name, image } = data
    
    // 生成分类代码
    const code = `cat-${Date.now()}`
    
    const stmt = getDatabase().prepare(`
      INSERT INTO categories (code, name, image) 
      VALUES (?, ?, ?)
    `)
    
    stmt.run(code, name, image || '/abstract-categories.png')
    
    return { 
      id: code,
      name, 
      image: image || '/abstract-categories.png'
    }
  },

  // 删除分类
  deleteCategory(categoryCode: string): { deleted_category: string; deleted_items_count: number } {
    // 获取分类的数据库ID
    const categoryStmt = getDatabase().prepare('SELECT id FROM categories WHERE code = ?')
    const categoryRow = categoryStmt.get(categoryCode) as any
    
    if (!categoryRow) {
      throw new Error('分类不存在')
    }
    
    const categoryId = categoryRow.id
    
    // 统计要删除的商品数量
    const countStmt = getDatabase().prepare('SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?')
    const countResult = countStmt.get(categoryId) as any
    const deletedItemsCount = countResult.count
    
    // 使用事务删除
    const deleteTransaction = getDatabase().transaction(() => {
      // 删除分类下的商品（物理删除）
      const deleteItemsStmt = getDatabase().prepare('DELETE FROM menu_items WHERE category_id = ?')
      deleteItemsStmt.run(categoryId)
      
      // 删除分类
      const deleteCategoryStmt = getDatabase().prepare('DELETE FROM categories WHERE id = ?')
      deleteCategoryStmt.run(categoryId)
    })
    
    deleteTransaction()
    
    return {
      deleted_category: categoryCode,
      deleted_items_count: deletedItemsCount
    }
  },

  // 更新商品
  updateMenuItem(id: number, data: AddMenuItemData): MenuItem {
    const { name, description, category, image } = data
    
    // 检查商品是否存在
    const existingItem = this.getMenuItem(id)
    if (!existingItem) {
      throw new Error('商品不存在')
    }
    
    // 检查商品名称是否重复（排除当前商品）
    const duplicateStmt = getDatabase().prepare('SELECT id FROM menu_items WHERE name = ? AND id != ?')
    const duplicate = duplicateStmt.get(name, id)
    
    if (duplicate) {
      throw new Error('商品名称已存在')
    }
    
    // 获取分类ID
    const categoryStmt = getDatabase().prepare('SELECT id FROM categories WHERE code = ?')
    const categoryRow = categoryStmt.get(category) as any
    
    if (!categoryRow) {
      throw new Error('分类不存在')
    }
    
    const categoryId = categoryRow.id

    const updateStmt = getDatabase().prepare(`
      UPDATE menu_items 
      SET name = ?, description = ?, category_id = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE id = ?
    `)
    
    updateStmt.run(name, description, categoryId, image || existingItem.image, id)
    
    return { 
      id, 
      name, 
      description, 
      category, 
      image: image || existingItem.image
    }
  },

  // 更新分类
  updateCategory(categoryCode: string, data: AddCategoryData): Category {
    const { name, image } = data
    
    // 检查分类是否存在
    const existingStmt = getDatabase().prepare('SELECT id, image FROM categories WHERE code = ?')
    const existingCategory = existingStmt.get(categoryCode) as any
    
    if (!existingCategory) {
      throw new Error('分类不存在')
    }

    const updateStmt = getDatabase().prepare(`
      UPDATE categories 
      SET name = ?, image = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE code = ?
    `)
    
    updateStmt.run(name, image || existingCategory.image, categoryCode)
    
    return { 
      id: categoryCode,
      name, 
      image: image || existingCategory.image
    }
  },

  // 保存菜谱
  saveRecipe(data: {
    cart_items: any[]
    requirements: any
    recipe_content: string
  }): { recipe_id: number } {
    const { cart_items, requirements, recipe_content } = data
    
    const stmt = getDatabase().prepare(`
      INSERT INTO recipes (content, cart_items, requirements, dish_count, soup_count, spice_level, restrictions, other_requirements) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(
      recipe_content,
      JSON.stringify(cart_items),
      JSON.stringify(requirements),
      requirements.dish_count || null,
      requirements.soup_count || null,
      requirements.spice_level || null,
      requirements.restrictions || null,
      requirements.other_requirements || null
    )
    
    return { recipe_id: result.lastInsertRowid as number }
  },

  // 更新菜谱内容
  updateRecipeContent(recipeId: number, content: string): void {
    const stmt = getDatabase().prepare('UPDATE recipes SET content = ? WHERE id = ?')
    stmt.run(content, recipeId)
  },

  // 获取菜谱
  getRecipe(recipeId: number): { id: number; content: string } | null {
    const stmt = getDatabase().prepare('SELECT id, content FROM recipes WHERE id = ?')
    const recipe = stmt.get(recipeId) as any
    return recipe || null
  },

  // 删除菜谱
  deleteRecipe(recipeId: number): void {
    const stmt = getDatabase().prepare('DELETE FROM recipes WHERE id = ?')
    stmt.run(recipeId)
  },

  // 用户相关查询函数

  // 根据邮箱获取用户
  getUserByEmail(email: string): User | null {
    return safeQuery(() => {
      const stmt = getDatabase().prepare(`
        SELECT id, username, email, name, role, is_active, 
               created_at, updated_at, last_login_at
        FROM users 
        WHERE email = ?
      `)
      const row = stmt.get(email) as any
      if (!row) return null
      
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        name: row.name,
        role: row.role,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at
      }
    }, null)
  },

  // 根据用户名获取用户
  getUserByUsername(username: string): User | null {
    return safeQuery(() => {
      const stmt = getDatabase().prepare(`
        SELECT id, username, email, name, role, is_active, 
               created_at, updated_at, last_login_at
        FROM users 
        WHERE username = ?
      `)
      const row = stmt.get(username) as any
      if (!row) return null
      
      return {
        id: row.id,
        username: row.username,
        email: row.email,
        name: row.name,
        role: row.role,
        isActive: row.is_active,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        lastLoginAt: row.last_login_at
      }
    }, null)
  },

  // 根据ID获取用户
  getUserById(id: number): User | null {
    const stmt = getDatabase().prepare(`
      SELECT id, username, email, name, role, is_active, 
             created_at, updated_at, last_login_at
      FROM users 
      WHERE id = ?
    `)
    const row = stmt.get(id) as any
    if (!row) return null
    
    return {
      id: row.id,
      username: row.username,
      email: row.email,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at
    }
  },

  // 获取用户密码哈希（仅用于登录验证）- 支持邮箱和用户名
  getUserPasswordHash(identifier: string): string | null {
    return safeQuery(() => {
      const stmt = getDatabase().prepare('SELECT password_hash FROM users WHERE email = ? OR username = ?')
      const row = stmt.get(identifier, identifier) as any
      return row?.password_hash || null
    }, null)
  },

  // 更新用户最后登录时间
  updateUserLastLogin(userId: number): void {
    safeQuery(() => {
      const stmt = getDatabase().prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
      stmt.run(userId)
      return true
    }, false)
  },

  // 创建用户
  createUser(data: { username: string; email: string; name: string; passwordHash: string; role?: 'user' | 'admin' }): User {
    const { username, email, passwordHash, name, role = 'user' } = data
    
    // 检查用户名是否已存在
    const existingUsername = this.getUserByUsername(username)
    if (existingUsername) {
      throw new Error('用户名已被注册')
    }
    
    // 检查邮箱是否已存在
    const existingEmail = this.getUserByEmail(email)
    if (existingEmail) {
      throw new Error('邮箱已被注册')
    }
    
    const stmt = getDatabase().prepare(`
      INSERT INTO users (username, email, password_hash, name, role) 
      VALUES (?, ?, ?, ?, ?)
    `)
    
    const result = stmt.run(username, email, passwordHash, name, role)
    const userId = result.lastInsertRowid as number
    
    return this.getUserById(userId)!
  },

  // 更新用户
  updateUser(id: number, data: UpdateUserData): User {
    const existingUser = this.getUserById(id)
    if (!existingUser) {
      throw new Error('用户不存在')
    }
    
    // 检查用户名是否重复（排除当前用户）
    if (data.username) {
      const duplicateUsernameStmt = getDatabase().prepare('SELECT id FROM users WHERE username = ? AND id != ?')
      const duplicateUsername = duplicateUsernameStmt.get(data.username, id)
      if (duplicateUsername) {
        throw new Error('用户名已被使用')
      }
    }
    
    // 检查邮箱是否重复（排除当前用户）
    if (data.email) {
      const duplicateEmailStmt = getDatabase().prepare('SELECT id FROM users WHERE email = ? AND id != ?')
      const duplicateEmail = duplicateEmailStmt.get(data.email, id)
      if (duplicateEmail) {
        throw new Error('邮箱已被使用')
      }
    }
    
    const updateFields: string[] = []
    const updateValues: any[] = []
    
    if (data.username !== undefined) {
      updateFields.push('username = ?')
      updateValues.push(data.username)
    }
    if (data.email !== undefined) {
      updateFields.push('email = ?')
      updateValues.push(data.email)
    }
    if (data.name !== undefined) {
      updateFields.push('name = ?')
      updateValues.push(data.name)
    }
    if (data.role !== undefined) {
      updateFields.push('role = ?')
      updateValues.push(data.role)
    }
    if (data.isActive !== undefined) {
      updateFields.push('is_active = ?')
      updateValues.push(data.isActive)
    }
    
    if (updateFields.length === 0) {
      return existingUser
    }
    
    updateFields.push('updated_at = CURRENT_TIMESTAMP')
    updateValues.push(id)
    
    const sql = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`
    const stmt = getDatabase().prepare(sql)
    stmt.run(...updateValues)
    
    return this.getUserById(id)!
  },

  // 删除用户
  deleteUser(id: number): void {
    const stmt = getDatabase().prepare('DELETE FROM users WHERE id = ?')
    const result = stmt.run(id)
    
    if (result.changes === 0) {
      throw new Error('用户不存在')
    }
  },

  // 获取用户列表（支持分页和搜索）
  getUsers(params: GetUsersParams): UsersResult {
    const { search, role, isActive, page = 1, limit = 20 } = params
    
    const pageNum = parseInt(page.toString())
    const limitNum = parseInt(limit.toString())
    
    let sql = `
      SELECT id, username, email, name, role, is_active, 
             created_at, updated_at, last_login_at
      FROM users 
      WHERE 1=1
    `
    const queryParams: any[] = []
    
    if (search) {
      sql += ' AND (name LIKE ? OR email LIKE ? OR username LIKE ?)'
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`)
    }
    
    if (role) {
      sql += ' AND role = ?'
      queryParams.push(role)
    }
    
    if (isActive !== undefined) {
      sql += ' AND is_active = ?'
      queryParams.push(isActive)
    }
    
    sql += ' ORDER BY created_at DESC'
    
    // 计算总数
    const countSql = sql.replace(
      'SELECT id, username, email, name, role, is_active, created_at, updated_at, last_login_at',
      'SELECT COUNT(*) as total'
    ).replace(/ORDER BY.*$/, '')
    
    const countStmt = getDatabase().prepare(countSql)
    const countResult = countStmt.get(...queryParams) as any
    const total = countResult.total
    
    // 分页
    const offset = (pageNum - 1) * limitNum
    sql += ` LIMIT ? OFFSET ?`
    queryParams.push(limitNum, offset)
    
    const stmt = getDatabase().prepare(sql)
    const rows = stmt.all(...queryParams) as any[]
    
    const users = rows.map(row => ({
      id: row.id,
      username: row.username,
      email: row.email,
      name: row.name,
      role: row.role,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLoginAt: row.last_login_at
    }))
    
    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    }
  },

  // 更新用户最后登录时间
  updateUserLastLogin(userId: number): void {
    const stmt = getDatabase().prepare('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?')
    stmt.run(userId)
  },

  // 会话相关查询函数

  // 创建会话
  createSession(userId: number, sessionId: string, expiresAt: Date): void {
    const stmt = getDatabase().prepare(`
      INSERT INTO user_sessions (id, user_id, expires_at) 
      VALUES (?, ?, ?)
    `)
    stmt.run(sessionId, userId, expiresAt.toISOString())
  },

  // 获取会话
  getSession(sessionId: string): UserSession | null {
    const stmt = getDatabase().prepare(`
      SELECT id, user_id, expires_at, created_at
      FROM user_sessions 
      WHERE id = ? AND expires_at > CURRENT_TIMESTAMP
    `)
    const row = stmt.get(sessionId) as any
    if (!row) return null
    
    return {
      id: row.id,
      userId: row.user_id,
      expiresAt: row.expires_at,
      createdAt: row.created_at
    }
  },

  // 删除会话
  deleteSession(sessionId: string): void {
    const stmt = getDatabase().prepare('DELETE FROM user_sessions WHERE id = ?')
    stmt.run(sessionId)
  },

  // 删除用户的所有会话
  deleteUserSessions(userId: number): void {
    const stmt = getDatabase().prepare('DELETE FROM user_sessions WHERE user_id = ?')
    stmt.run(userId)
  },

  // 清理过期会话
  cleanupExpiredSessions(): number {
    const stmt = getDatabase().prepare('DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP')
    const result = stmt.run()
    return result.changes
  }
}

// 初始化数据库表结构（仅在服务端执行）
if (typeof window === 'undefined') {
  initializeDatabase()
  
  // 导入启动初始化（仅在服务端，只执行一次）
  import('./startup-init').catch(error => {
    console.error('启动初始化导入失败:', error)
  })
}

// 导出数据库实例（用于向后兼容）
export const db = getDatabase()