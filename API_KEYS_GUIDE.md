# API密钥获取指南

本应用需要两个AI服务的API密钥才能正常工作。以下是获取这些密钥的详细步骤。

## 🔑 Google Gemini API密钥

### 1. 访问Google AI Studio
打开浏览器访问：https://aistudio.google.com/app/apikey

### 2. 登录Google账号
使用你的Google账号登录

### 3. 创建API密钥
- 点击 "Create API Key" 按钮
- 选择一个Google Cloud项目（如果没有会自动创建）
- 复制生成的API密钥

### 4. 配置密钥
将密钥添加到 `.env.local` 文件：
```env
GOOGLE_GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. 验证配置
运行测试命令验证：
```bash
npm run test:gemini
```

## 🎨 千问AI API密钥

### 1. 访问阿里云DashScope
打开浏览器访问：https://dashscope.console.aliyun.com/

### 2. 登录阿里云账号
使用你的阿里云账号登录

### 3. 开通服务
- 在控制台中找到"通义千问"服务
- 开通API调用服务
- 可能需要实名认证和充值

### 4. 获取API密钥
- 在控制台中找到API密钥管理
- 创建新的API密钥
- 复制生成的密钥

### 5. 配置密钥
将密钥添加到 `.env.local` 文件：
```env
QWEN_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 6. 验证配置
运行配置验证：
```bash
npm run validate:config
```

## 💰 费用说明

### Google Gemini API
- 有免费额度，适合开发和测试
- 超出免费额度后按使用量计费
- 详细价格：https://ai.google.dev/pricing

### 千问AI API
- 需要充值使用
- 按调用次数或Token数量计费
- 图片生成相对较贵，建议控制使用频率

## 🔒 安全注意事项

### 1. 保护API密钥
- **不要**将API密钥提交到代码仓库
- **不要**在前端代码中暴露API密钥
- **不要**在公开场合分享API密钥

### 2. 环境变量配置
- 将密钥放在 `.env.local` 文件中
- 确保 `.env.local` 在 `.gitignore` 中
- 生产环境使用环境变量或密钥管理服务

### 3. 权限控制
- 定期轮换API密钥
- 设置API调用限制
- 监控API使用情况

## 🛠️ 故障排除

### Google Gemini API问题

#### 错误：API key not valid
**解决方案：**
1. 检查API密钥是否正确复制
2. 确认API密钥是否已激活
3. 验证Google Cloud项目是否正确

#### 错误：403 Forbidden
**解决方案：**
1. 检查API是否已启用
2. 确认账号权限
3. 检查配额限制

### 千问AI API问题

#### 错误：401 Unauthorized
**解决方案：**
1. 检查API密钥格式
2. 确认账号余额
3. 验证服务是否已开通

#### 错误：429 Too Many Requests
**解决方案：**
1. 降低调用频率
2. 检查并发限制
3. 考虑升级服务套餐

## 📞 获取帮助

如果遇到问题，可以：

1. **查看官方文档**
   - Google Gemini: https://ai.google.dev/docs
   - 千问AI: https://help.aliyun.com/zh/dashscope/

2. **检查服务状态**
   - Google AI: https://status.cloud.google.com/
   - 阿里云: https://status.aliyun.com/

3. **联系技术支持**
   - 通过各自平台的技术支持渠道

## 🧪 测试命令

配置完成后，使用以下命令测试：

```bash
# 验证整体配置
npm run validate:config

# 测试Google Gemini API
npm run test:gemini

# 测试完整的菜谱生成流程
npm run test:api
```

---

**重要提醒：请妥善保管你的API密钥，不要泄露给他人！**