# Xinsd 苍蝇饭馆 - 智能菜谱生成应用

[![GitHub stars](https://img.shields.io/github/stars/duxs-code/xinsd-diner?style=flat-square)](https://github.com/duxs-code/xinsd-diner/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/duxs-code/xinsd-diner?style=flat-square)](https://github.com/duxs-code/xinsd-diner/network)
[![GitHub issues](https://img.shields.io/github/issues/duxs-code/xinsd-diner?style=flat-square)](https://github.com/duxs-code/xinsd-diner/issues)
[![License](https://img.shields.io/github/license/duxs-code/xinsd-diner?style=flat-square)](https://github.com/duxs-code/xinsd-diner/blob/main/LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)

一个基于 Next.js 和 SQLite 的现代化食材管理和智能菜谱生成应用。用户可以浏览食材、添加到菜篮子，然后基于选择的食材和个人要求生成个性化菜谱，并配有 AI 生成的精美菜品图片。

> 🚀 **最新更新 v2.0**: 新增完整的用户认证系统和用户管理功能！

## 📝 更新日志

### v2.1.0 (2025-10-23) - 重大Bug修复和功能增强

**� 关键Bug*修复**
- ✅ **修复数据库连接失败问题**: 解决浏览器环境下的数据库访问错误，消除误导性的"数据库连接失败"消息
- ✅ **修复会话过期跳转问题**: 完善SessionMonitor组件，确保会话过期后正确跳转到登录页面
- ✅ **修复菜谱图片生成问题**: 
  - 改进菜品名称提取算法，提高识别准确性
  - 修复内部API调用的认证传递问题
  - 解决图片生成失败导致菜谱无图的问题

**✨ 功能增强**
- ✅ **智能菜品名称提取**: 增强从菜谱内容中提取菜品名称的算法，支持多种格式
- ✅ **完善认证系统**: 
  - 改进认证状态管理，支持浏览器和服务端环境
  - 优化登录/登出流程，提供更好的用户体验
  - 增强会话管理和过期处理
- ✅ **图片管理优化**: 
  - 实现临时图片到永久图片的自动转换
  - 优化图片存储路径和URL管理
  - 增加图片生成失败的重试机制

**🧪 测试改进**
- ✅ **新增测试脚本**: 
  - `test-image-generation.js` - 图片生成功能测试
  - `test-login-redirect.js` - 登录跳转功能测试
  - `test-google-mcp.js` - 完整功能集成测试
- ✅ **Chrome DevTools MCP集成**: 支持浏览器自动化测试
- ✅ **API测试覆盖**: 完整的API端点功能验证

**🔧 技术改进**
- ✅ **数据库层优化**: 添加安全的数据库访问模式和错误处理
- ✅ **认证中间件增强**: 改进API认证和权限检查
- ✅ **错误处理完善**: 区分认证错误和系统错误，提供准确的用户反馈
- ✅ **日志系统改进**: 增加详细的调试日志，便于问题排查
- ✅ **图片展示优化**: 统一图片占位符处理，优化图片加载体验

### v2.0.0 (2025-10-22) - 用户认证系统

**🔐 新增功能**
- ✅ 完整的用户认证系统（注册、登录、登出）
- ✅ 基于用户名的安全登录机制
- ✅ 会话管理和自动过期清理
- ✅ 管理员用户管理界面
- ✅ 基于角色的权限控制 (RBAC)
- ✅ 密码安全存储和修改功能
- ✅ 路由和 API 保护中间件
- ✅ 个人资料管理页面

**🔧 技术改进**
- ✅ SQLite 数据库结构优化
- ✅ 统一的错误处理和响应格式
- ✅ 自动化的数据库初始化
- ✅ 会话和图片的定时清理任务
- ✅ 完整的 TypeScript 类型定义

**🛡️ 安全增强**
- ✅ bcrypt 密码加密存储
- ✅ HTTP-Only Cookie 会话管理
- ✅ SQL 注入防护
- ✅ 输入验证和清理
- ✅ CORS 和安全头配置

### v1.0.0 (2025-10-15) - 基础功能

- ✅ 食材管理和分类系统
- ✅ AI 菜谱生成功能
- ✅ 图片管理和自动清理
- ✅ 响应式 UI 设计

## ✨ 核心功能

- 🔐 **用户认证系统** - 完整的用户注册、登录、权限管理功能
- 👥 **用户管理** - 管理员可管理用户账号、角色和权限
- 🛍️ **食材管理** - 浏览、搜索、添加、删除食材，支持分类管理
- 🛒 **菜篮子功能** - 智能菜篮子，支持食材添加和管理
- 🍳 **智能菜谱生成** - 基于 AI 的个性化菜谱生成，支持多种烹饪要求
- 🖼️ **AI 配图功能** - 自动为菜品生成精美图片，智能占位符处理，提升视觉体验
- 📱 **响应式设计** - 完美适配移动端、平板和桌面端
- 🧹 **智能图片管理** - 自动清理无用图片，统一占位符处理，优化存储空间和用户体验

## 🌟 项目特色

- **🔐 企业级安全**: 完整的用户认证和权限管理系统，支持会话管理和密码安全
- **🤖 双AI驱动**: 结合Google Gemini和阿里云千问AI，提供文本生成和图像生成的完整解决方案
- **🎨 现代化UI**: 基于shadcn/ui组件库，提供优雅的用户界面和流畅的交互体验
- **⚡ 高性能**: SQLite数据库 + Next.js 15，确保快速响应和优秀的用户体验
- **🔧 开发友好**: 完整的TypeScript支持，严格的代码规范，丰富的开发工具
- **📦 一键部署**: 支持Vercel等平台的零配置部署

## 🛠️ 技术栈

- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes, SQLite + better-sqlite3
- **AI 服务**: 阿里云千问 AI (图片生成), Google Gemini (菜谱生成)
- **UI 组件**: Radix UI, shadcn/ui
- **状态管理**: React Context
- **图标**: Lucide React
- **Markdown 渲染**: ReactMarkdown

## 📋 系统要求

- Node.js 18.0+
- npm 或 yarn 或 pnpm
- 2GB+ 可用磁盘空间 (用于图片存储)
- 稳定的互联网连接 (AI 服务调用)

## 🚀 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd xinsd-diner
```

### 2. 安装依赖

```bash
npm install
# 或者
pnpm install
```

### 3. 初始化数据库

```bash
npm run init:db
```

### 4. 配置环境变量

如需使用 AI 功能，需要配置 API 密钥：

```bash
cp .env.example .env.local
# 然后编辑 .env.local 文件，填入真实的API密钥
```

**环境变量配置：**

```env
# AI服务配置 (必需)
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
GOOGLE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# 图片存储配置 (可选，有默认值)
UPLOAD_BASE_PATH=uploads
TEMP_IMAGES_PATH=temp
RECIPE_IMAGES_PATH=recipes
ITEM_IMAGES_PATH=items
CATEGORY_IMAGES_PATH=categories

# 应用配置
NODE_ENV=development
```

**详细的 API 密钥获取指南：** 📖 [API 密钥获取指南](./docs/API_KEYS_GUIDE.md)

### 5. 验证配置

```bash
npm run validate:config
```

### 6. 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

### 7. 默认管理员账号

首次启动时，系统会自动创建默认管理员账号：

- **用户名**: `admin`
- **密码**: `admin`
- **角色**: 管理员

> ⚠️ **安全提醒**: 首次登录后请立即修改默认密码！

## 🧪 测试

### 自动化测试脚本

项目包含多个测试脚本，用于验证各项功能：

```bash
# 基础功能测试
npm run validate:config          # 验证环境配置
npm run test:db                  # 数据库连接测试
node scripts/test-db-connection.js  # 直接测试数据库

# AI服务测试
npm run test:gemini              # 测试Google Gemini API
npm run test:qwen                # 测试千问AI生图API
node scripts/test-image-generation.js  # 图片生成功能测试

# 认证系统测试
npm run test:auth                # 认证系统测试
npm run test:api-protection      # API保护测试
node scripts/test-login-redirect.js    # 登录跳转功能测试

# 完整功能测试
node scripts/test-google-mcp.js  # 完整功能集成测试
npm run test:integration         # 集成测试
npm run test:all                 # 运行所有测试

# 维护工具
npm run cleanup:images           # 清理无用图片
node scripts/test-image-optimization.js  # 图片优化功能测试
```

### 浏览器自动化测试

项目支持Chrome DevTools MCP进行浏览器自动化测试：

```bash
# 启动开发服务器
npm run dev

# 在另一个终端运行浏览器测试
node scripts/test-google-mcp.js
```

### 测试覆盖范围

- ✅ **数据库连接**: 验证SQLite数据库连接和基本操作
- ✅ **用户认证**: 测试登录、登出、会话管理功能
- ✅ **API端点**: 验证所有API接口的功能和权限
- ✅ **图片生成**: 测试AI图片生成和管理功能
- ✅ **菜谱生成**: 验证完整的菜谱生成流程
- ✅ **错误处理**: 测试各种错误情况的处理
- ✅ **浏览器交互**: 模拟真实用户操作流程
- ✅ **图片优化**: 测试占位符处理和图片加载功能

## 📁 项目结构

```
xinsd-diner/
├── app/                    # Next.js App Router
│   ├── (auth)/            # 认证页面组
│   │   ├── login/         # 登录页面
│   │   └── register/      # 注册页面
│   ├── admin/             # 管理员页面
│   │   └── users/         # 用户管理页面
│   ├── profile/           # 个人资料页面
│   ├── api/v1/            # API路由
│   │   ├── auth/          # 认证API
│   │   ├── admin/         # 管理员API
│   │   ├── categories/    # 分类管理API
│   │   ├── menu/          # 食材管理API
│   │   ├── recipes/       # 菜谱生成API
│   │   ├── ai/            # AI图片生成API
│   │   └── images/        # 图片管理API
│   ├── checkout/          # 菜谱生成页面
│   └── page.tsx           # 主页面
├── components/            # React组件
│   ├── ui/               # 基础UI组件 (shadcn/ui)
│   ├── auth/             # 认证相关组件
│   ├── admin/            # 管理员组件
│   ├── add-item-dialog.tsx        # 添加食材对话框
│   ├── add-category-dialog.tsx    # 添加分类对话框
│   ├── menu-item-card.tsx         # 食材卡片
│   ├── navigation.tsx             # 导航组件
│   ├── optimized-image.tsx        # 优化图片组件
│   └── category-selector.tsx      # 分类选择器
├── contexts/             # React Context
│   ├── auth-context.tsx  # 认证上下文
│   ├── cart-context.tsx  # 购物车上下文
│   └── menu-context.tsx  # 菜单上下文
├── lib/                  # 工具库和配置
│   ├── database-sqlite.ts # SQLite数据库
│   ├── auth.ts           # 认证工具
│   ├── session.ts        # 会话管理
│   ├── password.ts       # 密码工具
│   ├── image-manager.ts  # 图片管理系统
│   ├── image-utils.ts    # 图片工具函数
│   └── startup-init.ts   # 启动初始化
├── scripts/              # 脚本文件
├── data/                 # 数据库文件
├── public/uploads/       # 图片存储
│   ├── temp/            # 临时图片
│   ├── recipes/         # 菜谱图片
│   ├── items/           # 食材图片
│   └── categories/      # 分类图片
├── middleware.ts         # Next.js 中间件
└── styles/               # 样式文件
```

## 🔧 主要功能

### 用户认证系统

- **用户注册** - 支持用户名、邮箱注册，密码强度验证
- **用户登录** - 基于用户名的安全登录，支持"记住我"功能
- **会话管理** - 安全的会话令牌管理，自动过期清理
- **权限控制** - 基于角色的访问控制（用户/管理员）
- **密码安全** - bcrypt 加密存储，支持密码修改
- **路由保护** - 所有页面和 API 都需要认证访问

### 用户管理

- **用户列表** - 管理员可查看所有用户信息
- **用户操作** - 创建、编辑、删除用户账号
- **角色管理** - 分配和修改用户角色权限
- **状态管理** - 启用/禁用用户账号
- **搜索筛选** - 按姓名、邮箱、角色等条件筛选用户

### 食材管理

- **浏览食材** - 选择分类查看不同类型的食材
- **搜索功能** - 使用搜索框快速找到需要的食材
- **分类管理** - 创建、编辑、删除食材分类
- **食材管理** - 添加、编辑、删除食材信息
- **图片上传** - 支持食材和分类图片上传

### 智能菜谱生成

- **智能生成** - 基于菜篮子食材生成菜谱
- **个性化要求** - 支持设置菜品数量、辣度、忌口等
- **AI 配图** - 自动为菜品生成精美图片
- **Markdown 渲染** - 美观的菜谱展示

### 图片管理系统

- **智能分类存储** - 临时图片和正式图片分开管理
- **生命周期管理** - 从生成到清理的完整流程
- **自动清理** - 定时清理无用图片，节省存储空间

## 🎯 使用指南

### 1. 用户认证

- **首次访问**: 系统会自动跳转到登录页面
- **管理员登录**: 使用默认账号 `admin/admin` 登录
- **用户注册**: 点击注册链接创建新用户账号
- **密码修改**: 登录后在个人资料页面修改密码
- **会话管理**: 支持"记住我"功能，自动保持登录状态

### 2. 用户管理（管理员）

- **用户列表**: 在管理员面板查看所有用户
- **创建用户**: 添加新用户账号并分配角色
- **编辑用户**: 修改用户信息、角色和状态
- **搜索筛选**: 按条件快速找到特定用户
- **权限控制**: 管理用户的访问权限

### 3. 食材管理

- **浏览食材**: 选择分类查看不同类型的食材
- **搜索功能**: 使用搜索框快速找到需要的食材
- **添加食材**: 点击"+"按钮添加新食材，支持图片上传
- **管理操作**: 长按食材进入选择模式，支持批量删除

### 4. 菜谱生成

- **选择食材**: 点击食材卡片添加到菜篮子
- **设置要求**: 在结算页面设置菜品数量、辣度、忌口等
- **生成菜谱**: 点击生成按钮，AI 将创建个性化菜谱和配图
- **查看结果**: 浏览生成的菜谱内容和精美图片

### 5. 图片功能

- **自动生图**: 菜谱生成时自动为菜品创建图片
- **图片管理**: 系统自动管理图片存储和清理
- **手动上传**: 支持手动上传食材和分类图片

## 🎨 AI 功能详解

### Google Gemini API - 菜谱生成

- **智能内容生成**: 根据食材和要求生成详细菜谱
- **个性化定制**: 支持菜品数量、辣度、忌口、特殊要求等
- **Markdown 格式**: 生成结构化的菜谱内容，便于展示

### 千问 AI API - 图片生成

- **自动配图**: 为菜谱中的菜品自动生成精美图片
- **智能识别**: 自动提取菜谱中的菜品名称并生成对应图片
- **高清质量**: 1472x1140 高清分辨率图片
- **智能提示词**: 根据菜品名称自动构建生图提示

### 图片管理流程

1. **图片生成**: AI 生成图片保存到临时目录
2. **菜品提取**: 智能解析菜谱内容，提取菜品名称
3. **内容整合**: 将图片插入到菜谱的对应位置
4. **存储管理**: 图片从临时目录移动到永久存储
5. **自动清理**: 定期清理无用图片

## 📊 数据库设计

### SQLite 数据库结构

#### users (用户表)

- `id` - 自增主键
- `username` - 用户名 (唯一)
- `email` - 邮箱地址 (唯一)
- `password_hash` - 密码哈希 (bcrypt)
- `name` - 用户姓名
- `role` - 用户角色 (user, admin)
- `is_active` - 账号状态 (1:启用, 0:禁用)
- `created_at` - 创建时间
- `updated_at` - 更新时间
- `last_login_at` - 最后登录时间

#### user_sessions (用户会话表)

- `id` - 会话 ID (UUID)
- `user_id` - 用户 ID (外键)
- `expires_at` - 过期时间
- `created_at` - 创建时间

#### categories (分类表)

- `id` - 自增主键
- `code` - 分类代码 (vegetables, meat, etc.)
- `name` - 分类名称
- `image` - 分类图片
- `sort_order` - 排序顺序

#### menu_items (食材表)

- `id` - 自增主键
- `name` - 食材名称
- `description` - 食材描述
- `category_id` - 分类 ID (外键)
- `image` - 食材图片
- `status` - 状态 (1:启用, 0:禁用)

#### recipes (菜谱表)

- `id` - 自增主键
- `content` - 菜谱内容 (Markdown 格式)
- `cart_items` - 菜篮子食材 (JSON 格式)
- `requirements` - 烹饪要求 (JSON 格式)
- `created_at` - 创建时间

#### images (图片管理表)

- `id` - 自增主键
- `filename` - 文件名
- `filepath` - 文件路径
- `url` - 访问 URL
- `type` - 图片类型 (recipe, temp, user)
- `recipe_id` - 关联菜谱 ID

## 🚀 部署

### 快速部署（5分钟）

查看 [快速部署指南](./docs/DEPLOYMENT_QUICK_START.md) 了解快速上手指南。

### 服务器部署

详细的服务器部署说明请查看 [完整部署指南](./docs/DEPLOYMENT.md)，包括：

- ✅ PM2 进程管理器配置
- ✅ systemd 系统服务配置
- ✅ Nginx 反向代理配置
- ✅ Docker 容器化部署
- ✅ SSL/HTTPS 配置
- ✅ 监控和维护

### 生产环境

```bash
# 构建应用
npm run build

# 启动生产服务器（直接运行）
npm start

# 或使用 PM2（推荐）
npm run pm2:start
```

### 推荐部署方式

- **自建服务器 + PM2** - 完全控制，适合中小型项目（推荐）
- **自建服务器 + systemd** - 系统级服务管理
- **Docker 容器** - 隔离环境，易于扩展
- **Vercel** - 零配置部署（注意：需要 API 路由支持）

### 环境变量配置

生产环境需要配置以下环境变量：

- `QWEN_API_KEY` - 千问 AI API 密钥
- `GOOGLE_GEMINI_API_KEY` - Google Gemini API 密钥
- `NODE_ENV=production`

详细配置说明请查看 [部署指南](./docs/DEPLOYMENT.md#环境变量详解)

## 🔍 故障排除

### 常见问题及解决方案

#### 🔐 认证相关问题

**Q: 显示"数据库连接失败"消息**
A: 这通常是认证问题，不是真正的数据库连接失败。请检查：
- 用户登录状态是否正常
- 会话是否已过期
- 如果是新安装，请运行 `npm run init:db` 初始化数据库

**Q: 会话过期后无法跳转到登录页面**
A: 这个问题已在v2.1.0中修复。如果仍有问题：
- 清除浏览器缓存和Cookie
- 重新启动开发服务器
- 检查浏览器控制台是否有JavaScript错误

#### 🖼️ 图片生成问题

**Q: 菜谱生成时没有图片**
A: 请检查以下配置：
- 确保 `QWEN_API_KEY` 和 `GOOGLE_GEMINI_API_KEY` 已正确设置
- 运行 `node scripts/test-image-generation.js` 测试图片生成功能
- 检查网络连接是否稳定
- 验证API密钥是否有效且有足够余额

**Q: 图片无法显示**
A: 检查以下项目：
- `public/uploads/` 目录权限：`chmod 755 public/uploads/`
- 图片文件是否存在于正确路径
- 运行 `npm run cleanup:images` 清理无效图片

#### 🗄️ 数据库问题

```bash
# 重新初始化数据库
npm run init:db

# 测试数据库连接
npm run test:db
node scripts/test-db-connection.js

# 检查数据库文件权限
ls -la data/fresh_market.db
```

#### 🔧 API 问题

```bash
# 测试API功能
npm run test:api
node scripts/test-google-mcp.js

# 检查环境变量配置
cat .env.local

# 验证配置完整性
npm run validate:config
```

### 错误代码说明

#### 认证错误
- **401 Unauthorized**: 用户未登录或会话已过期
- **403 Forbidden**: 用户权限不足，需要管理员权限
- **422 Unprocessable Entity**: 输入数据验证失败

#### API错误
- **429 Too Many Requests**: API调用频率过高，请降低调用频率
- **500 Internal Server Error**: 服务器内部错误，检查日志
- **503 Service Unavailable**: AI服务暂时不可用

#### 图片相关错误
- **图片生成失败**: 检查网络连接和API密钥
- **图片上传失败**: 检查文件大小和格式
- **图片显示异常**: 检查文件路径和权限

### 调试工具

#### 开发环境调试
```bash
# 启动开发服务器（带详细日志）
npm run dev

# 查看浏览器控制台
# 打开开发者工具 -> Console 标签

# 检查网络请求
# 打开开发者工具 -> Network 标签
```

#### 日志分析
- 检查浏览器控制台的错误信息
- 查看服务器终端的错误日志
- 使用测试脚本验证具体功能

#### 性能监控
```bash
# 检查数据库性能
node scripts/diagnose-db.js

# 监控图片存储使用情况
du -sh public/uploads/

# 检查临时文件清理
ls -la public/uploads/temp/
```

## 🔒 安全性

### 认证安全

- **密码加密**: 使用 bcrypt 进行密码哈希存储，盐值轮数 ≥ 12
- **会话管理**: HTTP-Only Cookie，防止 XSS 攻击
- **会话过期**: 自动清理过期会话，支持短期和长期会话
- **路由保护**: 所有页面和 API 都需要认证访问

### 数据安全

- **SQL 注入防护**: 使用预编译语句防止 SQL 注入
- **输入验证**: 严格的用户输入验证和清理
- **权限控制**: 基于角色的访问控制 (RBAC)
- **外键约束**: 数据库级别的数据完整性保护

### 网络安全

- **HTTPS**: 生产环境强制使用 HTTPS
- **CORS 配置**: 限制跨域请求
- **安全头**: 配置安全相关的 HTTP 头
- **中间件保护**: Next.js 中间件进行请求拦截和验证

## 📈 性能优化

### 图片优化

- 图片懒加载
- 自动压缩和优化
- CDN 集成 (未来)

### 数据库优化

- 索引优化
- 定期 VACUUM 操作
- 查询优化
- 会话自动清理

### API 优化

- 请求频率限制
- 错误重试机制
- 并发控制
- 认证缓存优化

## 🔮 未来规划

### 短期优化 (1-3 个月)

- [ ] 图片压缩和优化
- [ ] 菜谱收藏功能
- [ ] 用户评分系统
- [ ] 制作分享功能
- [ ] 双因素认证 (2FA)
- [ ] 密码重置功能
- [ ] 菜品营养信息显示
- [ ] 移动端适配优化

### 中期扩展 (3-6 个月)

- [ ] 个性化推荐系统
- [ ] 营养分析功能
- [ ] 社交功能 (评论、分享)
- [ ] 移动端 APP
- [ ] OAuth 第三方登录
- [ ] 用户行为分析
- [ ] 多语言支持
- [ ] 菜谱导出功能

### 长期愿景 (6 个月+)

- [ ] 多 AI 模型支持
- [ ] 商业化功能
- [ ] 国际化支持
- [ ] 企业版功能
- [ ] 单点登录 (SSO)
- [ ] 高级权限管理
- [ ] 智能购物清单
- [ ] 食材库存管理

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 开发规范

- 使用 TypeScript 进行开发
- 遵循 ESLint 代码规范
- 提交前运行测试
- 编写清晰的提交信息

### 项目维护

- 定期更新依赖
- 监控性能指标
- 备份重要数据
- 关注安全更新

## 📞 技术支持

### 获取帮助

- **文档**: 查看项目 README 和 API 文档
- **问题反馈**: 提交 GitHub Issue
- **开发讨论**: 参与项目讨论区

## 📄 许可证

MIT License

---

**🎉 享受智能菜谱生成的完整体验！**

**更多详细信息请查看：**

- 📖 [API 密钥获取指南](./docs/API_KEYS_GUIDE.md)
- 📚 [完整项目文档](./docs/PROJECT_DOCUMENTATION.md)
