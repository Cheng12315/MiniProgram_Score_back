# Apifox 测试 API 详细教程

## 📚 目录
1. [Apifox 界面介绍](#apifox-界面介绍)
2. [快速开始](#快速开始)
3. [第一个请求：健康检查](#第一个请求健康检查)
4. [第二个请求：管理员登录](#第二个请求管理员登录)
5. [第三个请求：获取班级列表](#第三个请求获取班级列表)
6. [完整的测试流程](#完整的测试流程)
7. [常见问题](#常见问题)

---

## Apifox 界面介绍

当你打开 Apifox 时，你会看到：

```
┌─────────────────────────────────────────────────────────────┐
│  Apifox                                [最小化] [最大化] [关闭]│
├─────────────────────────────────────────────────────────────┤
│ 文件(F) 编辑(E) 视图(V) 工具(T)                               │
├─────┬───────────────────────────────────────────────────────┤
│     │                                                       │
│ 左  │                   请求编辑区域                        │
│ 侧  │                                                       │
│ 栏  │  ┌─────────────────────────────────────────┐         │
│     │  │ [GET/POST/...] http://localhost:3000   │         │
│     │  └─────────────────────────────────────────┘         │
│     │                                                       │
│     │  [Params] [Body] [Header] [Auth] [Tests]            │
│     │                                                       │
│     │  [Send 按钮]                                          │
│     │                                                       │
│ ├── │                                                       │
│ │   │  📍 响应结果区域                                      │
│ │   │  Status: 200 OK                                     │
│ │   │  {                                                  │
│ │   │    "status": "ok",                                 │
│ │   │    "timestamp": "2024-02-28T..."                   │
│ │   │  }                                                  │
│ │   │                                                       │
└─────┴───────────────────────────────────────────────────────┘
```

---

## 快速开始

### 第一步：打开 Apifox
双击 Apifox 图标或在开始菜单找到 Apifox

### 第二步：创建项目
1. 点击 **"新建项目"** 或 **"+ 新建"**
2. 输入项目名称，例如：`德育积分管理系统`
3. 点击 **"创建"** 或 **"确定"**

### 第三步：创建分类（可选，但推荐）
在左侧栏创建分类来组织请求：
- 点击项目名称旁的 **"+"** 按钮
- 或右键选择 **"新建分类"**
- 创建以下分类：
  - 📂 认证 (Auth)
  - 📂 管理员 (Admin)
  - 📂 班主任 (Teacher)

---

## 第一个请求：健康检查

### ✅ 测试服务器是否在线

**步骤 1**：点击左侧栏中的 **"认证"** 分类（或直接在根目录）

**步骤 2**：右键选择 **"新建请求"** 或点击 **"+"** 按钮

**步骤 3**：你会看到一个新请求窗口，配置如下：

```
请求名称：健康检查
请求方法：GET (下拉菜单选择)
请求 URL：http://localhost:3000/health
```

**具体操作**：

```
┌─────────────────────────────────────────┐
│ 请求名称: [健康检查 ___________]        │
├─────────────────────────────────────────┤
│ 方法: [GET ▼]                           │
│ URL:  [http://localhost:3000/health    ]│
│                                         │
│                                         │
│ [Params] [Body] [Header] [Auth]        │
│                                         │
│ [Send] (蓝色按钮)                       │
└─────────────────────────────────────────┘
```

**步骤 4**：点击左下方的 **"Send"** (蓝色按钮)

**步骤 5**：在右侧看到响应：

```
Status: 200 OK

{
  "status": "ok",
  "timestamp": "2024-02-28T13:05:42.123Z"
}
```

**✅ 成功！** 如果看到这个，说明服务器正常运行！

---

## 第二个请求：管理员登录

### 🔑 获取登录 Token

**步骤 1**：在左侧栏创建新请求，命名为 **"管理员登录"**

**步骤 2**：配置请求

```
请求名称: 管理员登录
请求方法: POST
URL: http://localhost:3000/api/auth/admin/login
```

**步骤 3**：添加请求 Body

- 点击 **"Body"** 标签
- 选择 **"raw"** 或 **"JSON"**
- 复制粘贴以下内容：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

在 Apifox 中：
```
┌─────────────────────────────────────────┐
│ Body 标签                               │
├─────────────────────────────────────────┤
│ [form-data] [x-www-form-urlencoded]     │
│ [raw ✓]                                 │
│                                         │
│ JSON (选中)                              │
│                                         │
│ {                                       │
│   "username": "admin",                  │
│   "password": "admin123"                │
│ }                                       │
└─────────────────────────────────────────┘
```

**步骤 4**：点击 **"Send"**

**步骤 5**：查看响应

```
Status: 200 OK

{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "系统管理员"
    }
  }
}
```

**🎯 重要**：复制 `token` 值，你需要在后续请求中使用它

```
token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## 第三个请求：获取班级列表

### 📚 使用 Token 进行认证请求

**步骤 1**：创建新请求，命名为 **"获取班级列表"**

**步骤 2**：配置请求

```
请求名称: 获取班级列表
请求方法: GET
URL: http://localhost:3000/api/admin/classes
```

**步骤 3**：添加 Authorization Header

- 点击 **"Header"** 标签
- 点击 **"+ 添加"** 或 **"Add"**
- 填写：

```
Header 名: Authorization
Header 值: Bearer <你从登录响应中复制的 token>
```

**例如**：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

在 Apifox 中：
```
┌─────────────────────────────────────────┐
│ Header 标签                             │
├─────────────────────────────────────────┤
│ [+ 添加]                                │
│                                         │
│ Header 名          │ Header 值          │
│ ─────────────────────────────────────── │
│ Content-Type       │ application/json   │
│ Authorization      │ Bearer eyJhbGc...  │
│                                         │
└─────────────────────────────────────────┘
```

**步骤 4**：点击 **"Send"**

**步骤 5**：查看响应

```
Status: 200 OK

{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "class_name": "8年级1班",
      "created_at": "2024-02-28T..."
    },
    {
      "id": 2,
      "class_name": "8年级2班",
      "created_at": "2024-02-28T..."
    },
    ...
  ]
}
```

**✅ 成功！** 你的后端和认证系统都正常工作！

---

## 完整的测试流程

### 📋 推荐的测试顺序

#### **阶段 1：基础验证**（5 分钟）
1. ✅ `GET /health` - 健康检查
2. ✅ `POST /api/auth/admin/login` - 管理员登录 (保存 token)
3. ✅ `GET /api/admin/classes` - 获取班级列表

#### **阶段 2：管理员功能**（15 分钟）
4. ✅ `POST /api/admin/teachers` - 创建班主任
5. ✅ `GET /api/admin/teachers` - 获取班主任列表
6. ✅ `GET /api/admin/students` - 获取所有学生
7. ✅ `GET /api/admin/semesters` - 获取学期列表

#### **阶段 3：班主任功能**（15 分钟）
8. ✅ 用新创建的班主任账号登录
9. ✅ `GET /api/teacher/students` - 获取班级学生
10. ✅ `GET /api/teacher/semesters` - 获取学期列表

#### **阶段 4：积分操作**（10 分钟）
11. ✅ `POST /api/teacher/score-records` - 添加积分
12. ✅ `GET /api/teacher/score-records` - 查询积分记录
13. ✅ `DELETE /api/teacher/score-records/:id` - 撤销积分

#### **阶段 5：数据导入导出**（10 分钟）
14. ✅ `POST /api/admin/students/import` - 导入学生
15. ✅ `GET /api/teacher/export/scores` - 导出学生总分
16. ✅ `GET /api/teacher/export/records` - 导出积分记录

---

## 快速参考：复制粘贴模板

### 模板 1：创建班主任
```
请求方法: POST
URL: http://localhost:3000/api/admin/teachers
Header: Authorization: Bearer <token>

Body (JSON):
{
  "username": "teacher1",
  "password": "teacher123",
  "realName": "张老师",
  "classId": 1
}
```

### 模板 2：班主任登录
```
请求方法: POST
URL: http://localhost:3000/api/auth/teacher/login

Body (JSON):
{
  "username": "teacher1",
  "password": "teacher123"
}
```

### 模板 3：获取班级学生
```
请求方法: GET
URL: http://localhost:3000/api/teacher/students?page=1&pageSize=10
Header: Authorization: Bearer <teacher_token>
```

### 模板 4：添加积分记录
```
请求方法: POST
URL: http://localhost:3000/api/teacher/score-records
Header: Authorization: Bearer <teacher_token>

Body (JSON):
{
  "studentId": 1,
  "semesterId": 1,
  "scoreChange": 2,
  "reason": "遵守纪律"
}
```

---

## 常见问题

### Q1: 发送请求时显示 "Connection refused"
**A**: 确认后端服务器还在运行：
- 检查是否有 `npm run dev` 的终端窗口
- 如果没有，重新运行 `npm run dev`

### Q2: 显示 "缺少认证token"
**A**: 在 Header 中添加 Authorization：
- 点击 "Header" 标签
- 添加 `Authorization: Bearer <token>`

### Q3: 显示 "无效的token"
**A**: 
- Token 已过期，需要重新登录获取新的
- 复制粘贴时是否包含引号？应该不包含引号
- 确保在登录请求的响应中找到了 token

### Q4: POST 请求显示 "Data too long"
**A**: 某个字段超过了数据库限制，检查输入数据长度

### Q5: 如何测试需要 URL 参数的请求？
**A**: 
- 在 URL 中直接写，例如：`http://localhost:3000/api/teacher/students?page=1&pageSize=10`
- 或点击 "Params" 标签添加参数

### Q6: 如何上传文件（导入 Excel）？
**A**:
- 点击 "Body" 标签
- 选择 "form-data"
- 添加一个字段，类型选择 "File"
- 点击选择文件

---

## 💡 Apifox 快速技巧

### 💾 保存请求
- 你所有的请求都会自动保存
- 下次启动 Apifox 时会自动加载

### 🔖 收藏常用请求
- 右键请求，选择 "加入收藏"
- 这样下次快速找到

### 📊 查看请求历史
- 左侧栏可以看到最近的请求
- 方便快速重新测试

### 🌓 主题切换
- 设置 → 显示 → 主题（深色/浅色）

### ⚡ 快捷键
- `Ctrl + L` - 聚焦 URL 栏
- `Ctrl + Enter` - 发送请求
- `Ctrl + S` - 保存请求

---

## 📝 完整的测试检查清单

请按照以下顺序测试，并打勾确认：

- [ ] ✅ GET /health - 健康检查 (200 OK)
- [ ] ✅ POST /api/auth/admin/login - 管理员登录 (获取 token)
- [ ] ✅ GET /api/admin/classes - 获取班级列表 (至少 4 个班级)
- [ ] ✅ POST /api/admin/teachers - 创建班主任 (用 classId=1)
- [ ] ✅ GET /api/admin/teachers - 获取班主任列表 (至少 1 个)
- [ ] ✅ POST /api/auth/teacher/login - 班主任登录 (获取 teacher_token)
- [ ] ✅ GET /api/teacher/students - 班主任获取学生 (使用 teacher_token)
- [ ] ✅ GET /api/admin/semesters - 获取学期列表 (至少 3 个学期)
- [ ] ✅ POST /api/teacher/score-records - 添加积分记录
- [ ] ✅ GET /api/teacher/score-records - 查看积分记录

**所有测试都通过后，说明后端系统完全正常！** ✅

---

## 🚀 接下来

当所有 API 都测试通过后：

1. 记下所有可用的接口和响应格式
2. 开始修改小程序前端代码
3. 参考 `NEXT_STEPS.md` 中的前端修改指南

---

**祝你使用 Apifox 测试 API 顺利！** 🎉

有任何问题，查看本文档或告诉我！
