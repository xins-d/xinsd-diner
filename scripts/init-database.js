#!/usr/bin/env node

/**
 * 初始化SQLite数据库脚本
 */

const Database = require('better-sqlite3')
const { join } = require('path')
const { existsSync, mkdirSync } = require('fs')

// 数据库文件路径
const DB_DIR = join(process.cwd(), 'data')
const DB_PATH = join(DB_DIR, 'fresh_market.db')

// 确保数据目录存在
if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true })
}

// 创建数据库连接
const db = new Database(DB_PATH)

// 启用外键约束
db.pragma('foreign_keys = ON')

console.log('🔧 初始化SQLite数据库表结构...')

// 创建分类表
db.exec(`
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
db.exec(`
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
db.exec(`
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
db.exec(`
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

// 创建用户表
db.exec(`
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

// 创建用户会话表
db.exec(`
  CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
  )
`)

// 创建索引
db.exec(`
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

// 检查是否已有数据
const categoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
if (categoryCount.count > 0) {
  console.log('💡 数据库已有数据，跳过初始化')
  db.close()
  return
}

console.log('🌱 初始化默认数据...')

// 插入默认分类
const insertCategory = db.prepare(`
  INSERT INTO categories (code, name, image, sort_order) 
  VALUES (?, ?, ?, ?)
`)

const categories = [
  { code: 'vegetables', name: '蔬菜', image: '', sort_order: 1 },
  { code: 'meat', name: '肉类', image: '', sort_order: 2 },
  { code: 'seafood', name: '海鲜', image: '', sort_order: 3 },
  { code: 'fruits', name: '水果', image: '', sort_order: 4 },
  { code: 'dairy', name: '乳制品', image: '', sort_order: 5 },
  { code: 'grains', name: '谷物', image: '', sort_order: 6 }
]

const categoryTransaction = db.transaction((categories) => {
  for (const category of categories) {
    insertCategory.run(category.code, category.name, category.image, category.sort_order)
  }
})

categoryTransaction(categories)

// 获取分类ID映射
const categoryMap = new Map()
const allCategories = db.prepare('SELECT id, code FROM categories').all()
allCategories.forEach(cat => categoryMap.set(cat.code, cat.id))

// 插入默认商品
const insertItem = db.prepare(`
  INSERT INTO menu_items (name, description, category_id, image, sort_order) 
  VALUES (?, ?, ?, ?, ?)
`)

const items = [
  // 蔬菜
  { name: '生菜', description: '新鲜脆嫩的生菜', category: 'vegetables', image: '', sort_order: 1 },
  { name: '西红柿', description: '红润饱满的西红柿', category: 'vegetables', image: '', sort_order: 2 },
  { name: '黄瓜', description: '清脆爽口的黄瓜', category: 'vegetables', image: '', sort_order: 3 },
  { name: '胡萝卜', description: '营养丰富的胡萝卜', category: 'vegetables', image: '', sort_order: 4 },
  { name: '白菜', description: '鲜嫩的大白菜', category: 'vegetables', image: '', sort_order: 5 },
  { name: '菠菜', description: '绿叶营养的菠菜', category: 'vegetables', image: '', sort_order: 6 },
  
  // 肉类
  { name: '猪肉', description: '新鲜的猪肉', category: 'meat', image: '', sort_order: 1 },
  { name: '牛肉', description: '优质的牛肉', category: 'meat', image: '', sort_order: 2 },
  { name: '鸡肉', description: '嫩滑的鸡肉', category: 'meat', image: '', sort_order: 3 },
  { name: '羊肉', description: '鲜美的羊肉', category: 'meat', image: '', sort_order: 4 },
  
  // 海鲜
  { name: '鲈鱼', description: '新鲜的鲈鱼', category: 'seafood', image: '', sort_order: 1 },
  { name: '虾', description: '活蹦乱跳的虾', category: 'seafood', image: '', sort_order: 2 },
  { name: '螃蟹', description: '肥美的螃蟹', category: 'seafood', image: '', sort_order: 3 },
  { name: '带鱼', description: '新鲜的带鱼', category: 'seafood', image: '', sort_order: 4 },
  
  // 水果
  { name: '苹果', description: '脆甜的苹果', category: 'fruits', image: '', sort_order: 1 },
  { name: '香蕉', description: '香甜的香蕉', category: 'fruits', image: '', sort_order: 2 },
  { name: '橙子', description: '酸甜的橙子', category: 'fruits', image: '', sort_order: 3 },
  { name: '葡萄', description: '晶莹的葡萄', category: 'fruits', image: '', sort_order: 4 }
]

const itemTransaction = db.transaction((items) => {
  for (const item of items) {
    const categoryId = categoryMap.get(item.category)
    if (categoryId) {
      insertItem.run(item.name, item.description, categoryId, item.image, item.sort_order)
    }
  }
})

itemTransaction(items)

// 创建默认管理员用户
const bcrypt = require('bcryptjs')
const saltRounds = 12
const adminPasswordHash = bcrypt.hashSync('admin', saltRounds)

const insertUser = db.prepare(`
  INSERT INTO users (username, email, password_hash, name, role) 
  VALUES (?, ?, ?, ?, ?)
`)

insertUser.run('admin', 'admin@xinsd.com', adminPasswordHash, '系统管理员', 'admin')

console.log('✅ 默认数据初始化完成')
console.log('👤 默认管理员账号: admin / admin')

// 显示统计信息
const finalCategoryCount = db.prepare('SELECT COUNT(*) as count FROM categories').get()
const finalItemCount = db.prepare('SELECT COUNT(*) as count FROM menu_items').get()

console.log(`📊 初始化完成: ${finalCategoryCount.count} 个分类, ${finalItemCount.count} 个商品`)
console.log('💡 可以运行 npm run test:db 来验证数据库状态')

db.close()