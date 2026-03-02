# 下一步行动清单

## 🎯 当前状态
- ✅ 后端代码：完成 100%
- ✅ 数据库：初始化完成
- ✅ API 服务：正在运行（端口 3000）
- ⏳ API 测试：待进行
- ⏳ 前端修改：待进行
- ⏳ 管理后台：待开发

---

## 第二阶段（当前）：API 本地测试 ⏳

### 🧪 需要完成的测试

参考 `API_TEST_GUIDE.md` 文件，使用 Postman 或 curl 测试：

#### 必测接口（优先级高）
- [ ] ✅ 健康检查 `GET /health`
- [ ] ✅ 管理员登录 `POST /api/auth/admin/login`
- [ ] ✅ 班主任登录 `POST /api/auth/teacher/login`
- [ ] ✅ 获取班级列表 `GET /api/admin/classes`
- [ ] ✅ 获取学期列表 `GET /api/admin/semesters`
- [ ] ✅ 创建班主任 `POST /api/admin/teachers`
- [ ] ✅ 获取班主任列表 `GET /api/admin/teachers`
- [ ] ✅ 获取班级学生列表 `GET /api/teacher/students`

#### 其他接口（优先级中）
- [ ] 删除班主任 `DELETE /api/admin/teachers/:id`
- [ ] 导入学生数据 `POST /api/admin/students/import`
- [ ] 获取所有学生 `GET /api/admin/students`
- [ ] 添加积分记录 `POST /api/teacher/score-records`
- [ ] 获取积分记录 `GET /api/teacher/score-records`
- [ ] 撤销积分记录 `DELETE /api/teacher/score-records/:id`
- [ ] 导出学生总分 `GET /api/teacher/export/scores`
- [ ] 导出积分记录 `GET /api/teacher/export/records`

**预计时间**：2-3 小时

---

## 第三阶段：修改小程序前端代码

### 📱 需要修改的文件

在 `D:\minipro_ScoreManagement` 中：

#### 1. 配置 API 基础地址
- [ ] 创建/修改 API 配置文件（如 `utils/api.js` 或类似）
- [ ] 配置 API 服务器地址为 `http://localhost:3000` (开发)
- [ ] 为生产环境配置真实的服务器地址

#### 2. 修改登录页面 (`pages/login/login.js`)
```javascript
// 原来：模拟登录
// 修改为：调用后端 /api/auth/teacher/login 接口

onLogin() {
  const { username, password } = this.data;
  
  wx.request({
    url: `${API_BASE_URL}/api/auth/teacher/login`,
    method: 'POST',
    data: { username, password },
    success: (res) => {
      if (res.data.code === 0) {
        const { token, user } = res.data.data;
        
        // 保存 token 和用户信息到本地存储
        wx.setStorageSync('token', token);
        wx.setStorageSync('userInfo', user);
        
        // 跳转到学生列表页
        wx.navigateTo({
          url: '/pages/students-list/students-list'
        });
      } else {
        wx.showToast({
          title: res.data.message || '登录失败',
          icon: 'none'
        });
      }
    },
    fail: () => {
      wx.showToast({
        title: '网络错误',
        icon: 'none'
      });
    }
  });
}
```

#### 3. 修改学生列表页 (`pages/students-list/students-list.js`)
- [ ] 从后端 API 获取学生列表
- [ ] 支持分页和搜索
- [ ] 显示学生的当前总分
- [ ] 删除硬编码的测试数据

#### 4. 修改积分操作页 (`pages/score-action/score-action.js`)
- [ ] 调用后端 API 添加积分记录
- [ ] 显示操作结果
- [ ] 返回时自动刷新列表

#### 5. 修改积分记录页 (`pages/score-record/score-record.js`)
- [ ] 从后端 API 获取积分记录
- [ ] 支持学期筛选
- [ ] **新增**：撤销功能（调用 DELETE 接口）
- [ ] 显示操作人和操作时间

#### 6. 修改数据导出页 (`pages/data-export/data-export.js`)
- [ ] **修改为两个按钮**（而不是一个）
  - 按钮1：导出总分（调用 `GET /api/teacher/export/scores`）
  - 按钮2：导出记录（调用 `GET /api/teacher/export/records`）
- [ ] 支持学期选择
- [ ] 支持学生选择（仅在导出记录时）
- [ ] 下载 Excel 文件

#### 7. 添加网络请求拦截器
- [ ] 在所有请求的 Header 中自动添加 `Authorization: Bearer <token>`
- [ ] 处理 401 (token 过期) 错误，自动跳转到登录页
- [ ] 统一错误处理

**预计时间**：3-4 小时

---

## 第四阶段：开发管理后台

### 🖥️ 管理后台需要的功能

选择技术栈（推荐 React 或 Vue）：

#### 页面和功能
1. **登录页**
   - 管理员登录表单
   - 获取并保存 token

2. **班主任管理页**
   - 显示班主任列表（表格）
   - 创建班主任（表单，选择班级）
   - 删除班主任（确认对话框）
   - 搜索班主任

3. **学生管理页**
   - 显示所有学生（表格）
   - 导入学生 Excel 文件
   - 班级筛选
   - 搜索学生

4. **积分记录页**
   - 显示所有积分记录（表格）
   - 班级/学生/时间筛选
   - 查看操作详情

5. **数据导出页**
   - 导出学生信息（带班级筛选）
   - 导出积分记录（带多维度筛选）

**预计时间**：5-7 天

---

## 第五阶段：集成测试

### 🧪 需要测试的流程

- [ ] 完整的登录-操作-导出流程
- [ ] 多个班主任同时操作
- [ ] 网络中断恢复
- [ ] 大数据量性能测试
- [ ] 权限隔离验证

**预计时间**：2-3 天

---

## 第六阶段：部署上线

### 🚀 上线前准备

- [ ] 修改所有密码（特别是管理员密码）
- [ ] 修改 JWT_SECRET
- [ ] 配置生产环境数据库
- [ ] 启用 HTTPS
- [ ] 配置小程序后端 URL 为生产环境
- [ ] 微信小程序审核和发布

**预计时间**：2-3 天

---

## 📊 整体时间估计

| 阶段 | 内容 | 预计时间 | 状态 |
|------|------|--------|------|
| 1 | 后端框架和 API | - | ✅ 完成 |
| 2 | 本地测试 | 2-3小时 | ⏳ 进行中 |
| 3 | 小程序前端修改 | 3-4小时 | ⏳ 待开始 |
| 4 | 管理后台开发 | 5-7天 | ⏳ 待开始 |
| 5 | 集成测试 | 2-3天 | ⏳ 待开始 |
| 6 | 部署上线 | 2-3天 | ⏳ 待开始 |
| **总计** | | **2-3周** | |

---

## 🎯 立即可以做的事

### 现在（第二阶段）
1. ✅ **启动后端服务**（已完成）
   ```bash
   npm run dev
   ```

2. 📝 **安装 Postman**（如果还没有）
   - 下载：https://www.postman.com/downloads/

3. 🧪 **测试基础 API**
   - 参考 `API_TEST_GUIDE.md`
   - 依次测试登录、获取列表等接口

4. 📋 **确认所有 API 都能正常工作**

---

## 🔑 关键文件和文档

| 文件 | 用途 |
|------|------|
| `API_TEST_GUIDE.md` | API 测试指南 |
| `README.md` | 完整 API 文档 |
| `QUICK_START.md` | 快速开始 |
| `SETUP.md` | 部署和配置 |
| `.env` | 环境变量（已配置） |
| `database.sql` | 数据库脚本 |

---

## 💡 重要提醒

1. **Backend 保持运行**
   - 在开发期间，确保 `npm run dev` 一直在运行
   - 不要关闭终端窗口

2. **Token 管理**
   - 在 Postman 中测试时，记得保存登录返回的 token
   - 在小程序中，记得在 `wx.request` 中添加 token 到 Header

3. **CORS 配置**
   - 已配置跨域支持
   - 小程序可以直接调用后端 API

4. **权限隔离**
   - 班主任只能看自己班级的数据
   - 确保这一点在所有地方都有实现

---

## ❓ 遇到问题？

1. 查看 `SETUP.md` 中的常见问题
2. 查看后端控制台输出中的错误信息
3. 使用 Postman 的 Console 查看请求和响应详情
4. 检查数据库是否有正确的数据

---

**准备好了吗？让我们开始第二阶段的 API 测试吧！** 🚀

建议按照 `API_TEST_GUIDE.md` 中的步骤逐一测试，确保所有 API 都正常工作。

有任何问题，随时告诉我！
