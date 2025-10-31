# 服务器部署指南

本指南详细说明如何在服务器上部署和运行 Xinsd 苍蝇饭馆 Next.js 应用。

## 📋 前置要求

### 系统要求

- **操作系统**: Linux (Ubuntu 20.04+, CentOS 7+, Debian 10+) 或 macOS
- **Node.js**: 18.0+ (推荐使用 LTS 版本)
- **npm**: 9.0+ 或 pnpm 或 yarn
- **内存**: 至少 2GB RAM
- **磁盘空间**: 至少 5GB 可用空间（用于数据库和图片存储）
- **网络**: 稳定的互联网连接（用于 AI 服务调用）

### 必需软件

```bash
# 安装 Node.js (使用 nvm 推荐)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 18
nvm use 18

# 验证安装
node -v  # 应显示 v18.x.x
npm -v   # 应显示 9.x.x 或更高
```

## 🚀 部署步骤

### 1. 克隆项目

```bash
# 克隆项目到服务器
git clone <repository-url> /var/www/xinsd-diner
cd /var/www/xinsd-diner

# 或使用您偏好的目录
cd ~/projects/xinsd-diner
```

### 2. 安装依赖

```bash
# 使用 npm
npm install --production

# 或使用 pnpm (更快)
npm install -g pnpm
pnpm install --production
```

### 3. 配置环境变量

```bash
# 复制环境变量模板
cp .env.example .env.local

# 编辑环境变量文件
nano .env.local  # 或使用 vi/vim
```

**必需配置的环境变量：**

```env
# AI服务配置 (必需)
QWEN_API_KEY=sk-你的千问API密钥
GOOGLE_GEMINI_API_KEY=AIzaSy你的GeminiAPI密钥

# 应用配置
NODE_ENV=production

# 服务器配置 (可选)
PORT=3000
HOSTNAME=0.0.0.0
```

> 📖 **API 密钥获取指南**: 详细步骤请查看 [API_KEYS_GUIDE.md](./API_KEYS_GUIDE.md)

### 4. 初始化数据库

```bash
# 初始化数据库（创建表结构和默认管理员账号）
npm run init:db

# 验证数据库
npm run test:db
```

**默认管理员账号：**
- 用户名: `admin`
- 密码: `admin`
- ⚠️ **首次登录后请立即修改密码！**

### 5. 验证配置

```bash
# 验证环境变量配置
npm run validate:config
```

### 6. 构建应用

```bash
# 构建生产版本
npm run build
```

构建完成后，会生成 `.next` 目录（standalone 模式下会生成 `.next/standalone`）。

### 7. 设置文件权限

```bash
# 确保数据库文件可写
chmod 644 data/fresh_market.db
chmod 755 data/

# 确保上传目录可写
chmod -R 755 public/uploads/
mkdir -p public/uploads/{temp,recipes,items,categories}
chmod -R 755 public/uploads/
```

## 🎯 运行方式

### 方式一：直接运行（开发/测试）

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

这种方式适合测试，但不适合生产环境（进程会在终端关闭时停止）。

### 方式二：使用 PM2（推荐）

PM2 是一个强大的 Node.js 进程管理器，支持自动重启、日志管理、集群模式等。

#### 安装 PM2

```bash
npm install -g pm2
```

#### 创建 PM2 配置文件

项目已包含 `ecosystem.config.js` 配置文件。

#### 启动应用

```bash
# 使用 PM2 启动
pm2 start ecosystem.config.js

# 或使用 npm 脚本
npm run pm2:start

# 查看状态
pm2 status

# 查看日志
pm2 logs xinsd-diner

# 查看详细信息
pm2 describe xinsd-diner
```

#### PM2 常用命令

```bash
# 启动应用
pm2 start ecosystem.config.js

# 停止应用
pm2 stop xinsd-diner

# 重启应用
pm2 restart xinsd-diner

# 删除应用
pm2 delete xinsd-diner

# 查看日志
pm2 logs xinsd-diner --lines 100

# 查看监控面板
pm2 monit

# 保存当前进程列表（开机自启）
pm2 save

# 生成系统启动脚本（Ubuntu/Debian）
pm2 startup systemd

# 生成系统启动脚本（CentOS）
pm2 startup
```

### 方式三：使用 systemd（Linux 系统服务）

创建 systemd 服务文件，实现开机自启和自动重启。

#### 创建服务文件

```bash
sudo nano /etc/systemd/system/xinsd-diner.service
```

#### 服务文件内容

```ini
[Unit]
Description=Xinsd Diner Next.js Application
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/xinsd-diner
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/node .next/standalone/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=xinsd-diner

# 安全设置
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

**根据实际情况修改：**
- `User`: 运行服务的用户（建议使用专用用户，不要使用 root）
- `WorkingDirectory`: 项目路径
- `ExecStart`: Node.js 可执行文件路径和启动文件

#### 启动服务

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启动服务
sudo systemctl start xinsd-diner

# 设置开机自启
sudo systemctl enable xinsd-diner

# 查看状态
sudo systemctl status xinsd-diner

# 查看日志
sudo journalctl -u xinsd-diner -f
```

### 方式四：使用 Docker（容器化部署）

#### 创建 Dockerfile

```dockerfile
FROM node:18-alpine AS base

# 安装依赖
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# 构建应用
FROM base AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# 运行
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

EXPOSE 3000

CMD ["node", "server.js"]
```

#### 构建和运行

```bash
# 构建镜像
docker build -t xinsd-diner .

# 运行容器
docker run -d \
  --name xinsd-diner \
  -p 3000:3000 \
  --env-file .env.local \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/public/uploads:/app/public/uploads \
  xinsd-diner

# 查看日志
docker logs -f xinsd-diner
```

## 🌐 反向代理配置

### 使用 Nginx（推荐）

#### 安装 Nginx

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# CentOS/RHEL
sudo yum install nginx
```

#### 创建 Nginx 配置

```bash
sudo nano /etc/nginx/sites-available/xinsd-diner
```

#### Nginx 配置内容

```nginx
server {
    listen 80;
    server_name your-domain.com;  # 替换为您的域名或 IP

    # 日志
    access_log /var/log/nginx/xinsd-diner-access.log;
    error_log /var/log/nginx/xinsd-diner-error.log;

    # 上传文件大小限制
    client_max_body_size 10M;

    # 反向代理到 Next.js 应用
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件缓存
    location /_next/static {
        proxy_pass http://localhost:3000;
        proxy_cache_valid 200 60m;
        add_header Cache-Control "public, immutable";
    }
}
```

#### 启用配置

```bash
# 创建符号链接
sudo ln -s /etc/nginx/sites-available/xinsd-diner /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

#### 配置 HTTPS（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install certbot python3-certbot-nginx

# 获取 SSL 证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo certbot renew --dry-run
```

### 使用 Caddy（简单配置 HTTPS）

```caddyfile
your-domain.com {
    reverse_proxy localhost:3000
}
```

## 🔧 环境变量详解

### 必需配置

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `QWEN_API_KEY` | 阿里云千问 AI API 密钥 | `sk-xxx...` |
| `GOOGLE_GEMINI_API_KEY` | Google Gemini API 密钥 | `AIzaSyxxx...` |
| `NODE_ENV` | 运行环境 | `production` |

### 可选配置

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `PORT` | 应用端口 | `3000` |
| `HOSTNAME` | 监听地址 | `0.0.0.0` |
| `UPLOAD_BASE_PATH` | 上传基础路径 | `uploads` |
| `TEMP_IMAGES_PATH` | 临时图片路径 | `temp` |
| `RECIPE_IMAGES_PATH` | 菜谱图片路径 | `recipes` |
| `ITEM_IMAGES_PATH` | 食材图片路径 | `items` |
| `CATEGORY_IMAGES_PATH` | 分类图片路径 | `categories` |

## 📊 监控和维护

### 查看应用日志

#### PM2

```bash
# 实时日志
pm2 logs xinsd-diner

# 最近 100 行
pm2 logs xinsd-diner --lines 100

# 错误日志
pm2 logs xinsd-diner --err
```

#### systemd

```bash
# 实时日志
sudo journalctl -u xinsd-diner -f

# 最近 100 行
sudo journalctl -u xinsd-diner -n 100

# 错误日志
sudo journalctl -u xinsd-diner -p err
```

### 性能监控

```bash
# PM2 监控面板
pm2 monit

# 系统资源
htop

# 磁盘使用
df -h

# 数据库大小
du -sh data/fresh_market.db
```

### 定期维护任务

```bash
# 清理无用图片（建议每日执行）
npm run cleanup:images

# 备份数据库
cp data/fresh_market.db data/fresh_market.db.backup.$(date +%Y%m%d)

# 更新依赖（谨慎操作）
npm update
npm run build
pm2 restart xinsd-diner
```

### 设置定时任务（cron）

```bash
# 编辑 crontab
crontab -e

# 添加每日图片清理任务（每天凌晨 2 点）
0 2 * * * cd /var/www/xinsd-diner && npm run cleanup:images

# 添加每周数据库备份（每周日凌晨 3 点）
0 3 * * 0 cd /var/www/xinsd-diner && cp data/fresh_market.db data/fresh_market.db.backup.$(date +\%Y\%m\%d)
```

## 🔍 故障排除

### 常见问题

#### 1. 应用无法启动

```bash
# 检查 Node.js 版本
node -v

# 检查端口是否被占用
sudo lsof -i :3000

# 检查日志
pm2 logs xinsd-diner --lines 50
```

#### 2. 数据库连接失败

```bash
# 检查数据库文件权限
ls -la data/fresh_market.db

# 重新初始化数据库
npm run init:db

# 测试数据库连接
npm run test:db
```

#### 3. API 调用失败

```bash
# 验证环境变量
npm run validate:config

# 测试 API 密钥
npm run test:gemini
npm run test:qwen
```

#### 4. 图片无法上传/显示

```bash
# 检查上传目录权限
ls -la public/uploads/

# 修复权限
chmod -R 755 public/uploads/

# 检查磁盘空间
df -h
```

#### 5. 内存不足

```bash
# 查看内存使用
free -h

# 使用 PM2 限制内存
pm2 start ecosystem.config.js --max-memory-restart 500M
```

## 🔒 安全建议

### 1. 防火墙配置

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. 使用专用用户运行

```bash
# 创建专用用户
sudo useradd -r -s /bin/false xinsd-diner

# 修改文件所有者
sudo chown -R xinsd-diner:xinsd-diner /var/www/xinsd-diner
```

### 3. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade

# 更新 Node.js (使用 nvm)
nvm install --lts
nvm use --lts

# 更新项目依赖
npm audit
npm audit fix
```

### 4. 备份策略

- **数据库**: 每日自动备份
- **上传文件**: 定期备份 `public/uploads/` 目录
- **配置文件**: 备份 `.env.local` 和环境配置

## 📈 性能优化

### 1. 启用 Gzip 压缩

在 Nginx 配置中添加：

```nginx
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. 使用 CDN

- 静态资源（图片、CSS、JS）可以使用 CDN
- 上传的图片可以存储到云存储服务

### 3. 数据库优化

```bash
# SQLite 优化（在应用代码中自动执行）
# VACUUM 命令会自动清理数据库
```

### 4. 启用缓存

- 使用 Redis 缓存 API 响应（可选）
- Nginx 反向代理缓存静态资源

## 🎉 完成

部署完成后，访问：

- **本地访问**: http://localhost:3000
- **域名访问**: http://your-domain.com
- **HTTPS**: https://your-domain.com

**默认管理员账号：**
- 用户名: `admin`
- 密码: `admin`
- ⚠️ **首次登录后请立即修改密码！**

## 📚 相关文档

- [README.md](./README.md) - 项目说明
- [API_KEYS_GUIDE.md](./API_KEYS_GUIDE.md) - API 密钥获取指南
- [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md) - 完整项目文档

## 🆘 获取帮助

如遇问题，请：

1. 查看日志文件
2. 运行测试脚本验证功能
3. 查看项目 GitHub Issues
4. 联系技术支持

---

**祝部署顺利！🎉**
