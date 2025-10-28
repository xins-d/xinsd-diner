#!/bin/bash

# Xinsd 苍蝇饭馆部署脚本

set -e

echo "🚀 开始部署Xinsd 苍蝇饭馆应用..."

# 检查环境变量
if [ ! -f .env.local ]; then
    echo "❌ 缺少 .env.local 文件，请复制 .env.example 并配置"
    exit 1
fi

# 安装依赖
echo "📦 安装依赖..."
npm install

# 检查数据库连接
echo "🗄️  检查数据库连接..."
node scripts/test-database.js

# 构建应用
echo "🔨 构建应用..."
npm run build

# 运行测试
echo "🧪 运行API测试..."
npm run dev &
DEV_PID=$!

# 等待服务启动
sleep 10

# 运行测试
node scripts/test-api.js
node scripts/test-integration.js

# 停止开发服务器
kill $DEV_PID

echo "✅ 部署准备完成！"
echo ""
echo "启动生产服务器："
echo "  npm start"
echo ""
echo "或启动开发服务器："
echo "  npm run dev"