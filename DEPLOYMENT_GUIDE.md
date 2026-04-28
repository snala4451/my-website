# 部署指南 - 使用 Vercel 代理解决 API 问题

## 🎯 问题解决方案

之前 GitHub Pages 上 API 返回空响应的问题已通过 **Vercel 代理** 解决。

### 原因
- GitHub Pages 是纯静态托管，无法处理 CORS 问题
- 原始 API 可能对 GitHub Pages 域名有限制
- 直接跨域请求被阻止

### 解决方案
- 创建 Vercel 无服务器函数作为代理
- 所有 API 请求通过代理转发
- 代理服务器处理 CORS 和请求转发

---

## 📋 部署步骤

### 第一步：准备代码
✅ 已完成以下更改：
- 创建 `api/proxy.js` - Vercel 代理函数
- 更新 `vercel.json` - 配置 API 路由
- 更新 `script.js` - 使用代理 URL `/api/proxy`

### 第二步：部署到 Vercel

#### 方式 A：使用 GitHub 连接（推荐）
1. 访问 https://vercel.com
2. 点击 "New Project"
3. 选择你的 GitHub 仓库 `my-website`
4. 点击 "Import"
5. 保持默认设置，点击 "Deploy"
6. 等待部署完成

#### 方式 B：使用 Vercel CLI
```bash
# 安装 Vercel CLI
npm install -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel --prod
```

#### 方式 C：手动上传
1. 访问 https://vercel.com/new
2. 选择 "Other" 或 "Clone Template"
3. 上传项目文件
4. 点击 "Deploy"

### 第三步：验证部署

部署完成后，你会获得一个 Vercel URL，例如：
```
https://my-website-abc123.vercel.app
```

**测试 API 代理：**
```javascript
// 在浏览器控制台测试
fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        key: 'puM4bNPd7nBIFcRXBUgvfutGzE',
        url: 'https://www.douyin.com/video/1234567890'
    })
})
.then(r => r.json())
.then(data => console.log('✅ 代理工作正常:', data))
.catch(e => console.error('❌ 代理失败:', e))
```

---

## 🔄 更新 GitHub Pages 指向

如果你想保持使用 GitHub Pages，但通过 Vercel 代理：

### 选项 1：更新 DNS（推荐）
1. 在你的域名注册商处
2. 将 DNS 指向 Vercel
3. 按照 Vercel 的指示配置

### 选项 2：保持 GitHub Pages，使用 Vercel 作为 API 代理
1. GitHub Pages 继续托管静态文件
2. 修改 `script.js` 中的 API URL：
```javascript
// 改为完整的 Vercel URL
let apiUrl = 'https://your-vercel-domain.vercel.app/api/proxy';
```

### 选项 3：完全迁移到 Vercel
1. 在 Vercel 上部署整个项目
2. 获得更好的性能和功能支持
3. 不再需要 GitHub Pages

---

## 📊 代理工作原理

```
用户浏览器
    ↓
GitHub Pages / Vercel 前端
    ↓
/api/proxy 端点 (Vercel 函数)
    ↓
https://api.wxshares.com/api/qsy/plus (原始 API)
    ↓
返回数据给用户
```

### 代理的优势
- ✅ 绕过 CORS 限制
- ✅ 隐藏真实 API 端点
- ✅ 可以添加请求日志和监控
- ✅ 可以实现速率限制和缓存
- ✅ 更安全（API 密钥不暴露给客户端）

---

## 🔧 代理函数说明

### 文件位置
`api/proxy.js`

### 功能
1. **接收请求** - 从前端接收 POST 请求
2. **验证参数** - 检查 `key` 和 `url` 参数
3. **转发请求** - 将请求转发到原始 API
4. **处理响应** - 获取 API 响应并返回
5. **CORS 处理** - 自动添加 CORS 头

### 请求格式
```json
POST /api/proxy
Content-Type: application/json

{
    "key": "puM4bNPd7nBIFcRXBUgvfutGzE",
    "url": "https://www.douyin.com/video/1234567890"
}
```

### 响应格式
```json
{
    "code": 200,
    "data": {
        "title": "视频标题",
        "url": "https://...",
        "pics": [...]
    }
}
```

---

## 🚀 快速测试

### 本地测试（如果有 Node.js）
```bash
# 安装 Vercel CLI
npm install -g vercel

# 本地运行
vercel dev

# 访问 http://localhost:3000
```

### 线上测试
1. 部署到 Vercel
2. 打开你的 Vercel URL
3. 尝试解析一个抖音或小红书链接
4. 检查浏览器控制台是否有错误

---

## 🐛 故障排除

### 问题：代理返回 500 错误
**原因：** 原始 API 不可用或请求格式错误
**解决：** 检查 API 密钥和 URL 格式

### 问题：代理返回空响应
**原因：** 原始 API 返回空数据
**解决：** 检查 URL 是否有效，或尝试其他链接

### 问题：CORS 错误仍然存在
**原因：** 代理函数未正确部署
**解决：** 重新部署或检查 `vercel.json` 配置

### 问题：部署失败
**原因：** 文件结构或配置错误
**解决：** 检查 `api/proxy.js` 和 `vercel.json` 是否正确

---

## 📈 监控和日志

### 查看 Vercel 日志
1. 访问 https://vercel.com/dashboard
2. 选择你的项目
3. 点击 "Deployments"
4. 选择最新的部署
5. 查看 "Logs" 标签页

### 调试代理
在浏览器控制台运行：
```javascript
// 启用调试
window.DEBUG = true

// 运行诊断
window.runDiagnostics()

// 查看请求日志
console.log('检查 Network 标签页中的 /api/proxy 请求')
```

---

## ✅ 验证清单

部署前检查：
- [ ] `api/proxy.js` 文件已创建
- [ ] `vercel.json` 已更新
- [ ] `script.js` 中的 API URL 已改为 `/api/proxy`
- [ ] 所有文件已保存

部署后检查：
- [ ] Vercel 部署成功
- [ ] 可以访问 Vercel URL
- [ ] API 代理可以正常工作
- [ ] 浏览器控制台无错误
- [ ] 可以成功解析抖音/小红书链接

---

## 🎉 完成！

现在你的应用应该可以在 Vercel 上正常工作了。

### 下一步
1. **测试所有功能** - 确保一切正常
2. **配置自定义域名**（可选）- 在 Vercel 中配置
3. **设置环境变量**（可选）- 如果需要隐藏 API 密钥
4. **启用 CDN 缓存**（可选）- 提高性能

### 有问题？
- 查看 Vercel 文档：https://vercel.com/docs
- 检查浏览器控制台错误
- 查看 Vercel 部署日志
- 运行诊断工具：`window.runDiagnostics()`

