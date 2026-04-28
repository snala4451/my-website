# 🚀 手动部署指南

由于系统中 Git 不可用，请按照以下步骤手动部署。

---

## 📋 方法 1：使用 GitHub Web 界面（推荐）

### 第 1 步：上传文件到 GitHub

1. 访问你的 GitHub 仓库：https://github.com/snala4451/my-website

2. 点击 "Add file" → "Upload files"

3. 上传以下新增文件：
   ```
   api/proxy.js
   START_HERE.md
   QUICK_REFERENCE.md
   NEXT_STEPS.md
   DEPLOYMENT_GUIDE.md
   SOLUTION_SUMMARY.md
   README_VERCEL_PROXY.md
   FINAL_SUMMARY.md
   README_SOLUTION.md
   CHECKLIST.md
   COMPLETION_REPORT.md
   MANUAL_DEPLOYMENT.md
   ```

4. 上传修改后的文件：
   ```
   vercel.json
   script.js
   ```

5. 点击 "Commit changes"

### 第 2 步：验证上传

1. 刷新 GitHub 仓库页面
2. 检查 `api/proxy.js` 是否存在
3. 检查 `vercel.json` 是否已更新

---

## 📋 方法 2：使用 GitHub Desktop

### 第 1 步：打开 GitHub Desktop

1. 打开 GitHub Desktop 应用
2. 选择你的仓库 `my-website`

### 第 2 步：提交更改

1. 所有新增和修改的文件应该在 "Changes" 标签页中
2. 输入提交信息：`Add Vercel proxy for API - fixes GitHub Pages CORS issue`
3. 点击 "Commit to main"

### 第 3 步：推送到 GitHub

1. 点击 "Push origin"
2. 等待推送完成

---

## 📋 方法 3：使用 VS Code Git 集成

### 第 1 步：打开 VS Code

1. 打开 VS Code
2. 打开你的项目文件夹

### 第 2 步：提交更改

1. 点击左侧 "Source Control" 图标
2. 查看所有更改的文件
3. 输入提交信息：`Add Vercel proxy for API`
4. 点击 "Commit"

### 第 3 步：推送到 GitHub

1. 点击 "..." 菜单
2. 选择 "Push"
3. 等待推送完成

---

## 🔄 第 2 步：部署到 Vercel

### 步骤 1：访问 Vercel

1. 访问 https://vercel.com
2. 使用 GitHub 账号登录

### 步骤 2：创建新项目

1. 点击 "New Project"
2. 选择 "Import Git Repository"
3. 搜索 `my-website` 仓库
4. 点击 "Import"

### 步骤 3：配置项目

1. 保持默认设置
2. 点击 "Deploy"

### 步骤 4：等待部署

1. 部署通常需要 1-2 分钟
2. 部署完成后会显示 Vercel URL
3. 点击 URL 打开你的应用

---

## ✅ 验证部署

### 第 1 步：打开应用

1. 打开 Vercel 提供的 URL
2. 应该看到你的应用

### 第 2 步：测试 API 代理

在浏览器控制台运行：
```javascript
fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
        key: 'puM4bNPd7nBIFcRXBUgvfutGzE',
        url: 'https://www.douyin.com/video/1234567890'
    })
})
.then(r => r.json())
.then(data => {
    if (data.code === 200) {
        console.log('✅ 代理工作正常！');
        console.log('标题:', data.data.title);
    } else {
        console.log('❌ API 返回错误:', data.msg);
    }
})
.catch(e => console.error('❌ 请求失败:', e))
```

### 第 3 步：测试解析功能

1. 复制一个抖音或小红书链接
2. 粘贴到应用中
3. 点击"能量启动"按钮
4. 检查是否成功解析（不是模拟数据）

---

## 🎯 预期结果

### 成功标志
- ✅ 代理返回 200 状态码
- ✅ 代理返回有效的 JSON
- ✅ 可以成功解析链接
- ✅ 显示真实数据（不是模拟数据）
- ✅ 手机可以正常使用

### 失败标志
- ❌ 代理返回错误
- ❌ 仍然显示模拟数据
- ❌ 浏览器控制台有错误

---

## 🔧 故障排除

### 问题 1：GitHub 上传失败

**解决方案：**
1. 检查网络连接
2. 尝试刷新页面
3. 使用 GitHub Desktop 或 VS Code

### 问题 2：Vercel 部署失败

**解决方案：**
1. 检查 `api/proxy.js` 是否存在
2. 检查 `vercel.json` 是否正确
3. 查看 Vercel 部署日志

### 问题 3：代理不工作

**解决方案：**
1. 检查 Network 标签页
2. 查看 `/api/proxy` 请求
3. 检查浏览器控制台错误
4. 运行诊断：`window.runDiagnostics()`

---

## 📞 需要帮助？

1. 查看 `DEPLOYMENT_GUIDE.md` - 详细部署指南
2. 查看 `CHECKLIST.md` - 检查清单
3. 查看 `FINAL_SUMMARY.md` - 完整说明

---

## 🎉 完成！

部署完成后，你的应用应该可以正常工作了。

**祝你部署顺利！** 🚀

