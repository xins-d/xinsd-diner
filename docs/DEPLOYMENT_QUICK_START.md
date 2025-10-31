# 快速部署指南

## 🚀 5分钟快速部署

### 1. 安装依赖和初始化

```bash
# 克隆项目（如果还没有）
cd /path/to/xinsd-diner

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入 API 密钥

# 初始化数据库
npm run init:db
```

### 2. 构建应用

```bash
npm run build
```

### 3. 启动应用（选择一种方式）

#### 方式 A：直接启动（测试用）

```bash
npm start
```

#### 方式 B：使用 PM2（推荐生产环境）

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
npm run pm2:start

# 查看状态
pm2 status

# 查看日志
npm run pm2:logs
```

#### 方式 C：使用 systemd（Linux 系统服务）

```bash
# 创建服务文件 /etc/systemd/system/xinsd-diner.service
# （参考 DEPLOYMENT.md 中的完整配置）

sudo systemctl start xinsd-diner
sudo systemctl enable xinsd-diner
```

### 4. 配置反向代理（可选但推荐）

#### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📝 环境变量快速配置

创建 `.env.local` 文件：

```env
QWEN_API_KEY=你的千问API密钥
GOOGLE_GEMINI_API_KEY=你的GeminiAPI密钥
NODE_ENV=production
PORT=3000
```

## ✅ 验证部署

```bash
# 访问应用
curl http://localhost:3000

# 或浏览器访问
# http://your-server-ip:3000
```

## 🔧 常用命令

```bash
# PM2 管理
npm run pm2:start      # 启动
npm run pm2:stop       # 停止
npm run pm2:restart    # 重启
npm run pm2:logs       # 查看日志

# 维护
npm run cleanup:images # 清理无用图片
npm run test:db        # 测试数据库
npm run validate:config # 验证配置
```

## 🆘 遇到问题？

1. **检查日志**: `npm run pm2:logs` 或 `pm2 logs xinsd-diner`
2. **验证配置**: `npm run validate:config`
3. **测试数据库**: `npm run test:db`
4. **查看详细文档**: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 完整文档

- **详细部署指南**: [DEPLOYMENT.md](./DEPLOYMENT.md)
- **项目文档**: [README.md](./README.md)
- **API密钥获取**: [API_KEYS_GUIDE.md](./API_KEYS_GUIDE.md)

---

**默认管理员账号：**
- 用户名: `admin`
- 密码: `admin`
- ⚠️ **首次登录后请立即修改密码！**
