# Xinsd 苍蝇饭馆 - 智能菜谱生成应用项目文档

## 📋 项目概述

Xinsd 苍蝇饭馆是一个基于 Next.js 和 SQLite 的现代化食材管理和智能菜谱生成应用。用户可以浏览和管理食材，将食材添加到菜篮子，然后基于选择的食材和个人要求生成个性化菜谱，并配有AI生成的精美菜品图片。

### 核心价值
- **智能化菜谱生成** - 基于用户选择的食材和烹饪要求，使用AI生成个性化菜谱
- **可视化体验** - 为菜谱中的菜品自动生成精美图片，提升用户体验
- **简单易用** - 直观的界面设计，流畅的用户交互
- **完整的生命周期管理** - 从食材选择到菜谱生成的完整流程

## 🎯 项目需求

### 功能需求

#### 1. 食材管理
- **浏览食材** - 按分类浏览各种食材
- **搜索功能** - 根据名称和描述搜索食材
- **分类管理** - 创建、编辑、删除食材分类
- **食材管理** - 添加、编辑、删除食材信息
- **图片上传** - 支持食材和分类图片上传

#### 2. 菜篮子功能
- **添加食材** - 将食材添加到菜篮子
- **管理菜篮子** - 查看、移除菜篮子中的食材
- **数量统计** - 显示菜篮子中的食材数量

#### 3. 菜谱生成
- **智能生成** - 基于菜篮子食材生成菜谱
- **个性化要求** - 支持设置菜品数量、辣度、忌口等
- **AI配图** - 自动为菜品生成精美图片
- **Markdown渲染** - 美观的菜谱展示

#### 4. 图片管理
- **智能分类存储** - 临时图片和正式图片分开管理
- **生命周期管理** - 从生成到清理的完整流程
- **自动清理** - 定时清理无用图片，节省存储空间

### 非功能需求

#### 1. 性能要求
- **响应时间** - 页面加载时间 < 3秒
- **图片生成** - 单张图片生成时间 < 30秒
- **并发处理** - 支持多用户同时使用

#### 2. 用户体验
- **响应式设计** - 适配移动端、平板、桌面端
- **直观界面** - 简洁明了的用户界面
- **流畅交互** - 平滑的动画和过渡效果

#### 3. 可靠性
- **错误处理** - 完善的错误处理和用户提示
- **数据一致性** - 确保数据库和文件系统的一致性
- **容错机制** - 单个功能失败不影响整体使用

## 🛠️ 技术架构

### 前端技术栈
- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: Radix UI + shadcn/ui
- **状态管理**: React Context
- **图标**: Lucide React
- **Markdown渲染**: ReactMarkdown

### 后端技术栈
- **API**: Next.js API Routes
- **数据库**: SQLite + better-sqlite3
- **文件存储**: 本地文件系统
- **AI服务**: 阿里云千问AI (图片生成)

### 开发工具
- **包管理**: npm
- **代码检查**: ESLint + TypeScript
- **样式处理**: PostCSS + Tailwind CSS
- **部署**: Vercel (推荐)

## 📊 数据库设计

### 数据库文件
- **位置**: `data/fresh_market.db`
- **类型**: SQLite 本地数据库
- **特点**: 免安装、高性能、易备份

### 表结构设计

#### 1. categories (分类表)
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
  code TEXT UNIQUE NOT NULL,               -- 分类代码 (vegetables, meat, etc.)
  name TEXT NOT NULL,                      -- 分类名称
  image TEXT DEFAULT '/abstract-categories.png', -- 分类图片
  sort_order INTEGER DEFAULT 0,           -- 排序顺序
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### 2. menu_items (食材表)
```sql
CREATE TABLE menu_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
  name TEXT NOT NULL,                      -- 食材名称
  description TEXT,                        -- 食材描述
  category_id INTEGER NOT NULL,           -- 分类ID (外键)
  image TEXT DEFAULT '/placeholder.svg',   -- 食材图片
  status INTEGER DEFAULT 1,               -- 状态 (1:启用, 0:禁用)
  sort_order INTEGER DEFAULT 0,           -- 排序顺序
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories (id) ON DELETE CASCADE
)
```

#### 3. recipes (菜谱表)
```sql
CREATE TABLE recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
  content TEXT NOT NULL,                   -- 菜谱内容 (Markdown格式)
  cart_items TEXT,                         -- 菜篮子食材 (JSON格式)
  requirements TEXT,                       -- 烹饪要求 (JSON格式)
  dish_count INTEGER,                      -- 菜品数量
  soup_count INTEGER,                      -- 汤品数量
  spice_level TEXT,                        -- 辣度等级
  restrictions TEXT,                       -- 忌口信息
  other_requirements TEXT,                 -- 其他要求
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

#### 4. images (图片管理表)
```sql
CREATE TABLE images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,    -- 自增主键
  filename TEXT NOT NULL,                  -- 文件名
  filepath TEXT NOT NULL,                  -- 文件路径
  url TEXT UNIQUE NOT NULL,                -- 访问URL
  type TEXT CHECK (type IN ('recipe', 'temp', 'user')), -- 图片类型
  recipe_id INTEGER,                       -- 关联菜谱ID
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  used BOOLEAN DEFAULT FALSE,              -- 是否已使用
  FOREIGN KEY (recipe_id) REFERENCES recipes (id) ON DELETE CASCADE
)
```

### 索引设计
```sql
-- 性能优化索引
CREATE INDEX idx_menu_items_category ON menu_items(category_id);
CREATE INDEX idx_menu_items_status ON menu_items(status);
CREATE INDEX idx_menu_items_name ON menu_items(name);
CREATE INDEX idx_categories_code ON categories(code);
CREATE INDEX idx_images_type ON images(type);
CREATE INDEX idx_images_recipe_id ON images(recipe_id);
CREATE INDEX idx_images_used ON images(used);
CREATE INDEX idx_images_created_at ON images(created_at);
```

## 🔌 API 接口文档

### 基础信息
- **Base URL**: `/api/v1`
- **Content-Type**: `application/json`
- **响应格式**: 统一的JSON响应格式

### 响应格式标准
```typescript
interface ApiResponse<T> {
  code: number;        // 状态码 (200: 成功, 400+: 错误)
  message: string;     // 响应消息
  data?: T;           // 响应数据
  error?: {           // 错误信息 (仅错误时)
    type: string;
    field?: string;
  };
}
```

### 1. 分类管理 API

#### GET /api/v1/categories
获取所有分类列表

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": [
    {
      "id": "vegetables",
      "dbId": 1,
      "name": "蔬菜区",
      "image": "/category-vegetables.jpg"
    }
  ]
}
```

#### POST /api/v1/categories/add
创建新分类

**请求体**:
```json
{
  "name": "水果区",
  "image": "/category-fruits.jpg"
}
```

#### POST /api/v1/categories/delete
删除分类

**请求体**:
```json
{
  "id": "vegetables"
}
```

### 2. 食材管理 API

#### GET /api/v1/menu/items
获取食材列表

**查询参数**:
- `category`: 分类筛选
- `search`: 搜索关键词
- `page`: 页码 (默认1)
- `limit`: 每页数量 (默认12)

**响应示例**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "有机生菜",
        "category": "vegetables",
        "image": "/fresh-organic-lettuce.png",
        "description": "新鲜有机生菜，清脆爽口"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 18,
      "total_pages": 2
    }
  }
}
```

#### GET /api/v1/menu/item
获取单个食材详情

**查询参数**:
- `id`: 食材ID

#### POST /api/v1/menu/add-item
添加新食材

**请求体**:
```json
{
  "name": "有机西兰花",
  "description": "新鲜有机西兰花",
  "category": "vegetables",
  "image": "/fresh-broccoli.png"
}
```

#### POST /api/v1/menu/delete-items
删除食材

**请求体**:
```json
{
  "ids": [1, 2, 13]
}
```

### 3. 菜谱生成 API

#### POST /api/v1/recipes/generate
生成菜谱

**请求体**:
```json
{
  "cart_items": [
    {
      "id": 1,
      "name": "有机生菜",
      "description": "新鲜有机生菜，清脆爽口",
      "image": "/fresh-organic-lettuce.png"
    }
  ],
  "requirements": {
    "dish_count": 3,
    "soup_count": 1,
    "spice_level": "微辣",
    "restrictions": "海鲜过敏",
    "other_requirements": "少油少盐"
  },
  "generate_images": true
}
```

**响应示例**:
```json
{
  "code": 200,
  "message": "菜谱生成成功",
  "data": {
    "recipe_content": "# 菜谱内容...",
    "dish_images": {
      "清炒生菜": "/uploads/recipes/recipe-1-123456.png"
    },
    "images_generated": 1,
    "recipe_id": 1,
    "generated_at": "2024-01-15T10:30:00Z"
  }
}
```

### 4. 图片管理 API

#### POST /api/v1/upload/image
上传图片

**请求**: `multipart/form-data`
- `file`: 图片文件
- `type`: 图片类型 (`item` 或 `category`)

#### POST /api/v1/ai/generate-image
AI生成图片

**请求体**:
```json
{
  "itemName": "西红柿炒鸡蛋",
  "category": "菜品"
}
```

#### POST /api/v1/images/replace
替换图片

**请求体**:
```json
{
  "recipeId": 123,
  "oldImageUrl": "/uploads/recipes/old-image.png",
  "newImageUrl": "/uploads/temp/new-image.png"
}
```

### 5. 管理员 API

#### POST /api/v1/admin/cleanup-images
清理图片

**请求体**:
```json
{
  "cleanupType": "all",
  "olderThanHours": 24
}
```

## 🎨 前端功能实现

### 页面结构
```
app/
├── page.tsx                    # 主页 - 食材浏览
├── checkout/
│   └── page.tsx               # 结算页 - 菜谱生成
├── api/                       # API路由
└── globals.css                # 全局样式
```

### 组件架构
```
components/
├── ui/                        # 基础UI组件 (shadcn/ui)
├── add-item-dialog.tsx        # 添加食材对话框
├── add-category-dialog.tsx    # 添加分类对话框
├── menu-item-card.tsx         # 食材卡片
└── category-selector.tsx      # 分类选择器
```

### 状态管理
```typescript
// 菜单上下文
interface MenuContextType {
  categories: Category[];
  menuItems: MenuItem[];
  selectedCategory: string;
  searchQuery: string;
  // ...其他状态和方法
}

// 菜篮子上下文
interface CartContextType {
  cartItems: MenuItem[];
  addToCart: (item: MenuItem) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  // ...其他方法
}
```

### 核心功能实现

#### 1. 食材浏览
- **分类筛选** - 横向滚动的分类选择器
- **搜索功能** - 实时搜索食材名称和描述
- **分页加载** - 支持大量食材的分页显示
- **响应式网格** - 自适应的食材卡片布局

#### 2. 菜篮子管理
- **添加食材** - 点击食材卡片添加到菜篮子
- **菜篮子浮标** - 显示菜篮子数量的浮动按钮
- **菜篮子页面** - 查看和管理已选食材

#### 3. 菜谱生成
- **要求设置** - 菜品数量、辣度、忌口等个性化设置
- **AI生图开关** - 用户可选择是否生成图片
- **实时状态** - 显示菜谱和图片生成进度
- **Markdown渲染** - 美观的菜谱内容展示

#### 4. 图片展示
- **自适应显示** - 图片按比例缩放，不裁剪
- **加载状态** - 图片生成时的加载动画
- **错误处理** - 图片加载失败时的占位图

## 🖼️ 图片管理系统

### 存储架构
```
public/uploads/
├── temp/                      # 临时图片 (AI刚生成)
├── recipes/                   # 菜谱图片 (已使用)
├── items/                     # 食材图片
└── categories/                # 分类图片
```

### 生命周期管理

#### 1. 图片生成流程
```
AI生成图片 → 保存为临时图片 → 菜谱使用时转为正式图片 → 定时清理
```

#### 2. 清理策略
- **启动时清理** - 清理所有菜谱图片 (会话级数据)
- **定时清理** - 每小时清理24小时前的临时图片
- **手动清理** - 提供管理员清理接口

#### 3. 数据库追踪
- **完整记录** - 每张图片的文件路径、URL、类型、使用状态
- **关联管理** - 图片与菜谱的关联关系
- **状态同步** - 文件系统与数据库状态保持一致

### AI图片生成

#### 技术实现
- **AI服务** - 阿里云千问AI生图服务
- **图片质量** - 1472x1140高清分辨率
- **智能提示词** - 根据菜品名称自动构建生图提示
- **本地存储** - 自动下载并保存到本地服务器

#### 性能优化
- **并发控制** - 限制同时生成的图片数量
- **错误容错** - 单个图片生成失败不影响整体
- **批量处理** - 分批生成避免API限流

## 📱 用户界面设计

### 设计原则
- **简洁明了** - 清晰的信息层次和导航结构
- **一致性** - 统一的设计语言和交互模式
- **响应式** - 适配各种屏幕尺寸和设备
- **可访问性** - 良好的对比度和键盘导航支持

### 主要页面

#### 1. 主页 (食材浏览)
- **顶部导航** - 应用标题和菜篮子按钮
- **分类选择器** - 横向滚动的分类标签
- **搜索栏** - 实时搜索功能
- **食材网格** - 响应式的食材卡片布局
- **浮动按钮** - 添加分类和食材的快捷操作

#### 2. 结算页 (菜谱生成)
- **左侧面板** - 已选食材和烹饪要求设置
- **右侧面板** - 菜谱展示区域
- **生成按钮** - 触发菜谱和图片生成
- **状态提示** - 实时显示生成进度

### 交互设计

#### 1. 食材管理
- **点击添加** - 点击食材卡片添加到菜篮子
- **长按选择** - 长按进入多选模式进行批量操作
- **拖拽排序** - 支持拖拽调整食材顺序 (未来功能)

#### 2. 视觉反馈
- **悬停效果** - 卡片悬停时的轻微放大
- **加载动画** - 旋转的加载指示器
- **状态变化** - 按钮状态的视觉反馈
- **过渡动画** - 平滑的页面和组件过渡

## 🧪 测试与验证

### 测试脚本
```bash
# 数据库测试
npm run test:db              # 测试数据库连接和基本操作
npm run init:db              # 初始化数据库结构和数据

# API测试
npm run test:api             # 测试所有API接口功能

# 图片管理测试
npm run cleanup:images       # 手动执行图片清理
npm run test:image-mgmt      # 测试图片管理流程

# 集成测试
npm run test:integration     # 端到端集成测试
npm run test:all            # 运行所有测试
```

### 测试覆盖

#### 1. 单元测试
- **数据库操作** - CRUD操作的正确性
- **API接口** - 请求响应的准确性
- **图片管理** - 生命周期管理的完整性

#### 2. 集成测试
- **完整流程** - 从食材选择到菜谱生成的端到端测试
- **错误处理** - 各种异常情况的处理验证
- **性能测试** - 响应时间和并发处理能力

#### 3. 用户体验测试
- **界面响应** - 各种设备和屏幕尺寸的适配
- **交互流畅性** - 动画和过渡效果的自然度
- **错误提示** - 用户友好的错误信息和指导

## 🚀 部署与运维

### 开发环境
```bash
# 安装依赖
npm install

# 初始化数据库
npm run init:db

# 启动开发服务器
npm run dev
```

### 生产环境

#### 1. 构建部署
```bash
# 构建应用
npm run build

# 启动生产服务器
npm start
```

#### 2. 环境配置
```env
# .env.local
# AI服务配置
QWEN_API_KEY=your_qwen_api_key
GOOGLE_GEMINI_API_KEY=your_google_gemini_api_key

# 图片存储配置 (可选)
UPLOAD_BASE_PATH=uploads
TEMP_IMAGES_PATH=temp
RECIPE_IMAGES_PATH=recipes
ITEM_IMAGES_PATH=items
CATEGORY_IMAGES_PATH=categories

# 应用配置
NODE_ENV=production
```

#### 3. 服务器要求
- **Node.js** - 18.0+
- **内存** - 最小512MB，推荐1GB+
- **存储** - 至少2GB可用空间 (用于图片存储)
- **网络** - 稳定的互联网连接 (AI服务调用)

### 监控与维护

#### 1. 日志监控
- **应用日志** - 记录关键操作和错误信息
- **性能监控** - 监控API响应时间和资源使用
- **错误追踪** - 自动收集和分析错误信息

#### 2. 数据备份
```bash
# 备份数据库
cp data/fresh_market.db backup/fresh_market_$(date +%Y%m%d).db

# 备份图片文件
tar -czf backup/uploads_$(date +%Y%m%d).tar.gz public/uploads/
```

#### 3. 定期维护
- **图片清理** - 定期清理无用图片文件
- **数据库优化** - 定期执行VACUUM优化数据库
- **日志轮转** - 定期清理过期日志文件

## 🔧 开发指南

### 代码规范
- **TypeScript** - 严格的类型检查
- **ESLint** - 代码质量检查
- **Prettier** - 代码格式化
- **命名规范** - 使用有意义的变量和函数名

### 项目结构
```
fresh-market/
├── app/                       # Next.js App Router
│   ├── api/v1/               # API路由
│   ├── checkout/             # 结算页面
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页
├── components/               # React组件
│   ├── ui/                   # 基础UI组件
│   └── *.tsx                 # 业务组件
├── contexts/                 # React Context
├── lib/                      # 工具库和配置
├── public/                   # 静态资源
├── scripts/                  # 脚本文件
└── data/                     # 数据库文件
```

### 开发流程
1. **需求分析** - 明确功能需求和技术要求
2. **设计阶段** - API设计、数据库设计、UI设计
3. **开发实现** - 按模块进行开发和测试
4. **集成测试** - 完整流程的端到端测试
5. **部署上线** - 生产环境部署和监控

## 📈 未来规划

### 短期优化 (1-3个月)
- **性能优化** - 图片懒加载、缓存策略优化
- **用户体验** - 更丰富的动画效果、更好的错误提示
- **功能完善** - 菜谱收藏、评分系统、制作分享

### 中期扩展 (3-6个月)
- **个性化推荐** - 基于用户历史的智能推荐
- **营养分析** - 菜谱营养成分分析和建议
- **社交功能** - 用户评论、菜谱分享、制作心得

### 长期愿景 (6 个月+)
- **多端支持** - 移动端APP、小程序版本
- **AI升级** - 更智能的菜谱生成、营养搭配建议
- **商业化** - 食材采购对接、广告系统、会员服务

## 📞 技术支持

### 常见问题

#### 1. 数据库相关
**Q: 数据库连接失败**
A: 检查 `data` 目录权限，运行 `npm run init:db` 重新初始化

**Q: 数据丢失**
A: 从 `backup` 目录恢复数据库文件，或重新运行初始化脚本

#### 2. 图片相关
**Q: 图片生成失败**
A: 检查网络连接和API密钥配置，查看控制台错误信息

**Q: 图片显示异常**
A: 运行 `npm run cleanup:images` 清理图片缓存

#### 3. 性能相关
**Q: 页面加载缓慢**
A: 检查图片大小和数量，考虑启用图片压缩和懒加载

### 联系方式
- **技术文档** - 查看项目README和API文档
- **问题反馈** - 提交GitHub Issue
- **开发讨论** - 参与项目讨论区

## 📄 许可证

本项目采用 MIT 许可证，详见 LICENSE 文件。

---

**项目版本**: v1.0.0  
**文档更新**: 2024年1月  
**维护团队**: Xinsd 苍蝇饭馆开发团队
