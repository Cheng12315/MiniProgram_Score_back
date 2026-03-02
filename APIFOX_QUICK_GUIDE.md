# Apifox 快速参考 - 5分钟快速上手

## 📌 最简单的 3 步测试

### 第一步：新建项目
1. 打开 Apifox
2. 点击 **"新建项目"** 或 **"+ 新建"**
3. 输入名称：`德育积分管理系统`
4. 点击 **"创建"**

---

### 第二步：创建第一个请求（测试服务器）

**新建请求**：
- 右键左侧栏 → **"新建请求"** （或点击 **"+"**）
- 请求名称：`健康检查`

**配置**：
```
方法: GET
URL: http://localhost:3000/health
```

**发送**：
- 点击 **"Send"** (蓝色按钮，左下方)

**看到这个响应 = 成功** ✅
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

---

### 第三步：创建登录请求（获取 Token）

**新建请求**：
- 请求名称：`管理员登录`

**配置**：
```
方法: POST
URL: http://localhost:3000/api/auth/admin/login
```

**添加 Body**：
1. 点击 **"Body"** 标签
2. 选择 **"raw"** → **"JSON"**
3. 复制粘贴这个：

```json
{
  "username": "admin",
  "password": "admin123"
}
```

**发送**：点击 **"Send"**

**看到这个响应 = 成功** ✅
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc...",
    "user": {...}
  }
}
```

**⭐ 重要**：复制 `token` 值！后面要用！

---

## 🔑 在其他请求中使用 Token

### 添加认证 Header

1. 点击 **"Header"** 标签
2. 点击 **"+ 添加"**
3. 填入：

```
Header 名：Authorization
Header 值：Bearer [粘贴你的token]
```

**例如**：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTcwODkwNTM0MiwiZXhwIjoxNzA5NTEwMTQyfQ.ABC123...
```

**之后就可以测试需要认证的接口了！** ✅

---

## 📋 快速测试清单（按顺序）

### 基础接口（5分钟）
```
1. GET /health
   → 看到 status: ok

2. POST /api/auth/admin/login
   Body: {"username":"admin","password":"admin123"}
   → 获取 token

3. GET /api/admin/classes
   Header: Authorization: Bearer <token>
   → 看到班级列表
```

### 管理员接口（10分钟）
```
4. POST /api/admin/teachers
   Body: {
     "username": "teacher1",
     "password": "teacher123",
     "realName": "张老师",
     "classId": 1
   }
   → 创建班主任

5. GET /api/admin/teachers
   → 看到班主任列表

6. GET /api/admin/semesters
   → 看到学期列表
```

### 班主任接口（10分钟）
```
7. POST /api/auth/teacher/login
   Body: {"username":"teacher1","password":"teacher123"}
   → 获取 teacher_token

8. GET /api/teacher/students?page=1&pageSize=10
   Header: Authorization: Bearer <teacher_token>
   → 看到学生列表

9. GET /api/teacher/semesters
   Header: Authorization: Bearer <teacher_token>
   → 看到学期列表
```

### 积分操作（10分钟）
```
10. POST /api/teacher/score-records
    Header: Authorization: Bearer <teacher_token>
    Body: {
      "studentId": 1,
      "semesterId": 1,
      "scoreChange": 2,
      "reason": "遵守纪律"
    }
    → 添加积分记录

11. GET /api/teacher/score-records
    Header: Authorization: Bearer <teacher_token>
    → 看到积分记录
```

---

## 🎯 常见问题速查

| 问题 | 解决方案 |
|------|--------|
| **Connection refused** | 检查后端是否运行 (`npm run dev`) |
| **缺少认证token** | 在 Header 中添加 `Authorization: Bearer <token>` |
| **无效的token** | 重新登录获取新 token |
| **404 Not Found** | 检查 URL 是否正确 |
| **Request Timeout** | 检查网络连接或后端是否响应缓慢 |

---

## 💾 保存你的工作

✅ Apifox 会自动保存所有请求  
✅ 下次打开时会自动加载  
✅ 你可以为常用请求 "加入收藏"

---

## 🚀 现在就开始！

**按照上面的 "快速测试清单" 逐一测试，所有都成功 = 后端完全正常！** 🎉

---

## 📖 需要更多帮助？

查看详细教程：`APIFOX_TUTORIAL.md`

有问题告诉我！✨
