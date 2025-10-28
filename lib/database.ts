import mysql from 'mysql2/promise'

// 数据库连接配置
interface DatabaseConfig {
  host: string
  port: number
  user: string
  password: string
  database: string
  charset: string
  timezone: string
  acquireTimeout: number
  timeout: number
  reconnect: boolean
  connectionLimit: number
  queueLimit: number
}

const dbConfig: DatabaseConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'fresh_market',
  charset: 'utf8mb4',
  timezone: '+08:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  connectionLimit: 10,
  queueLimit: 0,
}

// 创建连接池
const pool = mysql.createPool(dbConfig)

// 数据库连接测试
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection()
    console.log('✅ 数据库连接成功')
    
    // 测试查询
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM categories')
    const categoryCount = (rows as any[])[0].count
    console.log(`📊 分类数量: ${categoryCount}`)
    
    const [itemRows] = await connection.execute('SELECT COUNT(*) as count FROM menu_items')
    const itemCount = (itemRows as any[])[0].count
    console.log(`📦 商品数量: ${itemCount}`)
    
    connection.release()
    return true
  } catch (error) {
    console.error('❌ 数据库连接失败:', (error as Error).message)
    console.log('💡 提示: 应用将使用静态数据模式')
    return false
  }
}

// 执行SQL文件的函数
export async function executeSqlFile(sqlContent: string): Promise<void> {
  const connection = await pool.getConnection()
  try {
    // 分割SQL语句
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
    
    for (const statement of statements) {
      if (statement.trim()) {
        await connection.execute(statement)
      }
    }
    
    console.log('✅ SQL文件执行成功')
  } catch (error) {
    console.error('❌ SQL文件执行失败:', (error as Error).message)
    throw error
  } finally {
    connection.release()
  }
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

// 常用查询函数
export const queries = {
  // 获取所有分类
  async getCategories(): Promise<Category[]> {
    const [rows] = await pool.execute(
      'SELECT id, code, name, image FROM categories ORDER BY id ASC'
    )
    return (rows as any[]).map(row => ({
      id: row.code,  // 前端使用code作为ID
      dbId: row.id,  // 数据库自增ID
      name: row.name,
      image: row.image
    }))
  },

  // 获取商品列表（支持分页和搜索）
  async getMenuItems(params: GetMenuItemsParams): Promise<MenuItemsResult> {
    const { category, categoryId, search, page = 1, limit = 20 } = params
    
    // 确保分页参数是数字
    const pageNum = parseInt(page.toString())
    const limitNum = parseInt(limit.toString())
    
    let sql = `
      SELECT mi.id, mi.name, mi.description, c.code as category, mi.image
      FROM menu_items mi 
      LEFT JOIN categories c ON mi.category_id = c.id
      WHERE 1=1
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
    
    const [countRows] = await pool.execute(countSql, queryParams)
    const total = (countRows as any[])[0].total
    
    // 分页 - 使用字符串拼接而不是参数绑定，因为MySQL对LIMIT/OFFSET的参数绑定有限制
    const offset = (pageNum - 1) * limitNum
    sql += ` LIMIT ${limitNum} OFFSET ${offset}`
    
    const [rows] = await pool.execute(sql, queryParams)
    
    return {
      items: rows as MenuItem[],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        total_pages: Math.ceil(total / limitNum)
      }
    }
  },

  // 获取单个商品
  async getMenuItem(id: number): Promise<MenuItem | null> {
    const [rows] = await pool.execute(
      `SELECT mi.id, mi.name, mi.description, c.code as category, mi.image 
       FROM menu_items mi 
       LEFT JOIN categories c ON mi.category_id = c.id
       WHERE mi.id = ?`,
      [id]
    )
    const items = rows as MenuItem[]
    return items.length > 0 ? items[0] : null
  },

  // 添加商品
  async addMenuItem(data: AddMenuItemData): Promise<MenuItem> {
    const { name, description, category, image } = data
    
    // 检查商品名称是否重复
    const [existingRows] = await pool.execute(
      'SELECT id FROM menu_items WHERE name = ?',
      [name]
    )
    
    if ((existingRows as any[]).length > 0) {
      throw new Error('商品名称已存在')
    }
    
    // 获取分类ID
    const [catRows] = await pool.execute(
      'SELECT id FROM categories WHERE code = ?',
      [category]
    )
    
    if ((catRows as any[]).length === 0) {
      throw new Error('分类不存在')
    }
    
    const categoryId = (catRows as any[])[0].id

    const [result] = await pool.execute(
      'INSERT INTO menu_items (name, description, category_id, image) VALUES (?, ?, ?, ?)',
      [name, description, categoryId, image || '/placeholder.svg']
    )
    
    const insertResult = result as mysql.ResultSetHeader
    return { 
      id: insertResult.insertId, 
      name, 
      description, 
      category, 
      image: image || '/placeholder.svg'
    }
  },

  // 删除商品（物理删除）
  async deleteMenuItems(ids: number[]): Promise<DeleteResult> {
    if (!Array.isArray(ids) || ids.length === 0) {
      return { deleted_count: 0, deleted_ids: [] }
    }
    
    const placeholders = ids.map(() => '?').join(',')
    const [result] = await pool.execute(
      `DELETE FROM menu_items WHERE id IN (${placeholders})`,
      ids
    )
    
    const deleteResult = result as mysql.ResultSetHeader
    return {
      deleted_count: deleteResult.affectedRows,
      deleted_ids: ids
    }
  },

  // 添加分类
  async addCategory(data: AddCategoryData): Promise<Category> {
    const { name, image } = data
    
    // 生成分类代码
    const code = `cat-${Date.now()}`
    
    const [result] = await pool.execute(
      'INSERT INTO categories (code, name, image) VALUES (?, ?, ?)',
      [code, name, image || '/abstract-categories.png']
    )
    
    return { 
      id: code,
      name, 
      image: image || '/abstract-categories.png'
    }
  },

  // 删除分类
  async deleteCategory(categoryCode: string): Promise<{ deleted_category: string; deleted_items_count: number }> {
    const connection = await pool.getConnection()
    try {
      await connection.beginTransaction()
      
      // 获取分类的数据库ID
      const [catRows] = await connection.execute(
        'SELECT id FROM categories WHERE code = ?',
        [categoryCode]
      )
      
      if ((catRows as any[]).length === 0) {
        throw new Error('分类不存在')
      }
      
      const categoryId = (catRows as any[])[0].id
      
      // 统计要删除的商品数量
      const [itemRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM menu_items WHERE category_id = ?',
        [categoryId]
      )
      const deletedItemsCount = (itemRows as any[])[0].count
      
      // 删除分类下的商品（物理删除）
      await connection.execute(
        'DELETE FROM menu_items WHERE category_id = ?',
        [categoryId]
      )
      
      // 删除分类
      await connection.execute('DELETE FROM categories WHERE id = ?', [categoryId])
      
      await connection.commit()
      
      return {
        deleted_category: categoryCode,
        deleted_items_count: deletedItemsCount
      }
    } catch (error) {
      await connection.rollback()
      throw error
    } finally {
      connection.release()
    }
  },

  // 更新商品
  async updateMenuItem(id: number, data: AddMenuItemData): Promise<MenuItem> {
    const { name, description, category, image } = data
    
    // 检查商品是否存在
    const existingItem = await this.getMenuItem(id)
    if (!existingItem) {
      throw new Error('商品不存在')
    }
    
    // 检查商品名称是否重复（排除当前商品）
    const [existingRows] = await pool.execute(
      'SELECT id FROM menu_items WHERE name = ? AND id != ?',
      [name, id]
    )
    
    if ((existingRows as any[]).length > 0) {
      throw new Error('商品名称已存在')
    }
    
    // 获取分类ID
    const [catRows] = await pool.execute(
      'SELECT id FROM categories WHERE code = ?',
      [category]
    )
    
    if ((catRows as any[]).length === 0) {
      throw new Error('分类不存在')
    }
    
    const categoryId = (catRows as any[])[0].id

    await pool.execute(
      'UPDATE menu_items SET name = ?, description = ?, category_id = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, description, categoryId, image || existingItem.image, id]
    )
    
    return { 
      id, 
      name, 
      description, 
      category, 
      image: image || existingItem.image
    }
  },

  // 更新分类
  async updateCategory(categoryCode: string, data: AddCategoryData): Promise<Category> {
    const { name, image } = data
    
    // 检查分类是否存在
    const [existingRows] = await pool.execute(
      'SELECT id, image FROM categories WHERE code = ?',
      [categoryCode]
    )
    
    if ((existingRows as any[]).length === 0) {
      throw new Error('分类不存在')
    }
    
    const existingCategory = (existingRows as any[])[0]

    await pool.execute(
      'UPDATE categories SET name = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE code = ?',
      [name, image || existingCategory.image, categoryCode]
    )
    
    return { 
      id: categoryCode,
      name, 
      image: image || existingCategory.image
    }
  },

  // 保存菜谱
  async saveRecipe(data: {
    cart_items: any[]
    requirements: any
    recipe_content: string
  }): Promise<{ recipe_id: number }> {
    const { cart_items, requirements, recipe_content } = data
    
    const [result] = await pool.execute(
      `INSERT INTO recipes (content, cart_items, requirements, dish_count, soup_count, spice_level, restrictions, other_requirements) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        recipe_content,
        JSON.stringify(cart_items),
        JSON.stringify(requirements),
        requirements.dish_count || null,
        requirements.soup_count || null,
        requirements.spice_level || null,
        requirements.restrictions || null,
        requirements.other_requirements || null
      ]
    )
    
    const insertResult = result as mysql.ResultSetHeader
    return { recipe_id: insertResult.insertId }
  }
}

export { pool }
export default pool