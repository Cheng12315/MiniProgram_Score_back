# API 测试指南

后端已启动在 `http://localhost:3000`

## 快速测试

### 1. 健康检查 (Health Check)
```bash
curl http://localhost:3000/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-02-28T..."
}
```

---

## 管理员相关测试

### 1. 管理员登录 ⭐
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**重要**：保存返回的 `token`，后续请求都需要在 Header 中添加：
```
Authorization: Bearer <token>
```

预期响应：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "系统管理员"
    }
  }
}
```

### 2. 获取班主任列表
```bash
curl http://localhost:3000/api/admin/teachers \
  -H "Authorization: Bearer <你的token>"
```

### 3. 创建班主任账号
```bash
curl -X POST http://localhost:3000/api/admin/teachers \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <你的token>" \
  -d '{
    "username": "teacher1",
    "password": "teacher123",
    "realName": "张老师",
    "classId": 1
  }'
```

### 4. 获取班级列表
```bash
curl http://localhost:3000/api/admin/classes \
  -H "Authorization: Bearer <你的token>"
```

### 5. 获取学期列表
```bash
curl http://localhost:3000/api/admin/semesters \
  -H "Authorization: Bearer <你的token>"
```

---

## 班主任相关测试

### 1. 班主任登录 ⭐
```bash
curl -X POST http://localhost:3000/api/auth/teacher/login \
  -H "Content-Type: application/json" \
  -d '{"username":"teacher1","password":"teacher123"}'
```

**注意**：先创建班主任账号（见上面的管理员步骤），然后用该账号登录。

预期响应：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "teacher1",
      "realName": "张老师",
      "classId": 1
    }
  }
}
```

### 2. 获取班级学生列表
```bash
curl "http://localhost:3000/api/teacher/students?page=1&pageSize=10" \
  -H "Authorization: Bearer <班主任token>"
```

### 3. 获取学期列表
```bash
curl http://localhost:3000/api/teacher/semesters \
  -H "Authorization: Bearer <班主任token>"
```

### 4. 添加积分记录
```bash
curl -X POST http://localhost:3000/api/teacher/score-records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <班主任token>" \
  -d '{
    "studentId": 1,
    "semesterId": 1,
    "scoreChange": 2,
    "reason": "遵守纪律"
  }'
```

**注意**：需要先导入学生数据或直接添加到数据库。

---

## 使用 Postman 的推荐步骤

1. **创建新请求集合**：命名为 "德育积分管理系统"

2. **创建文件夹**：
   - 认证 (Auth)
   - 管理员 (Admin)
   - 班主任 (Teacher)

3. **在 Auth 文件夹中**：
   - 创建 "管理员登录" 请求
   - 创建 "班主任登录" 请求

4. **保存 Token**：
   - 登录成功后，从响应中复制 `data.token`
   - 在其他请求的 Headers 中添加：`Authorization: Bearer <token>`

5. **按顺序测试**：
   - ✅ 管理员登录
   - ✅ 获取班级列表
   - ✅ 创建班主任
   - ✅ 班主任登录
   - ✅ 获取学生列表
   - ✅ 添加积分记录

---

## 错误处理

### 常见错误

#### 1. `"缺少认证token"`
原因：在 Header 中没有添加 `Authorization: Bearer <token>`

解决：确保每个请求都在 Header 中包含有效的 token

#### 2. `"无效的token"`
原因：Token 格式错误或已过期

解决：重新登录获取新的 token

#### 3. `"权限不足"`
原因：用班主任 token 访问管理员接口，或反之

解决：使用正确角色的 token

#### 4. `"用户名或密码错误"`
原因：登录凭证不正确

解决：确认用户名和密码无误

---

## 数据库初始数据

系统已自动创建以下初始数据：

### 默认管理员
- 用户名：`admin`
- 密码：`admin123`
- **⚠️ 重要**：生产环境必须修改此密码

### 默认班级
- 8年级1班
- 8年级2班
- 242班
- 243班

### 默认学期
- 2024春 (当前活跃)
- 2024秋
- 2025春

---

## 下一步

1. 使用上述 curl 命令或 Postman 测试所有 API
2. 确认数据流正确
3. 修改小程序前端代码，连接后端 API
4. 开发管理后台前端

---

## 需要帮助？

如有任何问题，检查以下文档：
- `README.md` - 完整 API 文档
- `DEVELOPMENT_SUMMARY.md` - 技术细节
- `SETUP.md` - 部署和常见问题

祝测试顺利！🚀
