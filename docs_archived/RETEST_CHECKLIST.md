# ✅ 重新测试检查清单

## 📌 你现在拥有的 Token

```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MjI5MTg5MSwiZXhwIjoxNzcyODk2NjkxfQ.H46inA-4yEATtuBn3bTS1-Vz5lqW8R1smy_oOQikZiU
```

直接复制粘贴到 Apifox 的 Header 中：
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MjI5MTg5MSwiZXhwIjoxNzcyODk2NjkxfQ.H46inA-4yEATtuBn3bTS1-Vz5lqW8R1smy_oOQikZiU
```

---

## 🧪 按顺序进行以下测试

### 测试 1：获取班级列表 ⭐
```
方法: GET
URL: http://localhost:3000/api/admin/classes
Header: Authorization: Bearer <上面的token>
```

**预期结果**:
```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {"id": 5, "class_name": "8年级1班"},
    {"id": 6, "class_name": "8年级2班"},
    {"id": 7, "class_name": "242班"},
    {"id": 8, "class_name": "243班"}
  ]
}
```

**状态**: [ ] 通过

---

### 测试 2：获取学期列表 ⭐
```
方法: GET
URL: http://localhost:3000/api/admin/semesters
Header: Authorization: Bearer <上面的token>
```

**预期结果**:
```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {"id": 4, "semester_name": "2024春", "is_active": true},
    {"id": 5, "semester_name": "2024秋", "is_active": false},
    {"id": 6, "semester_name": "2025春", "is_active": false}
  ]
}
```

**状态**: [ ] 通过

---

### 测试 3：创建班主任账号 ⭐⭐
```
方法: POST
URL: http://localhost:3000/api/admin/teachers
Header: Authorization: Bearer <上面的token>
Body (JSON):
{
  "username": "teacher1",
  "password": "teacher123",
  "realName": "张老师",
  "classId": 5
}
```

**预期结果**:
```json
{
  "code": 0,
  "message": "班主任账号创建成功",
  "data": {
    "id": 1,
    "username": "teacher1",
    "classId": 5
  }
}
```

**状态**: [ ] 通过

**重要**: 保存返回的班主任 ID（应该是 1）

---

### 测试 4：获取班主任列表
```
方法: GET
URL: http://localhost:3000/api/admin/teachers
Header: Authorization: Bearer <上面的token>
```

**预期结果**:
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 1,
        "username": "teacher1",
        "real_name": "张老师",
        "class_name": "8年级1班",
        "created_at": "..."
      }
    ],
    "pagination": {
      "total": 1,
      "page": 1,
      "pageSize": 10,
      "totalPages": 1
    }
  }
}
```

**状态**: [ ] 通过

---

### 测试 5：班主任登录 ⭐⭐
```
方法: POST
URL: http://localhost:3000/api/auth/teacher/login
Body (JSON):
{
  "username": "teacher1",
  "password": "teacher123"
}
```

**预期结果**:
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
      "classId": 5
    }
  }
}
```

**状态**: [ ] 通过

**重要**: 保存这个班主任的 token 供后续测试使用

---

### 测试 6：班主任获取班级学生列表
```
方法: GET
URL: http://localhost:3000/api/teacher/students?page=1&pageSize=10
Header: Authorization: Bearer <班主任token>
```

**预期结果**:
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [],
    "pagination": {
      "total": 0,
      "page": 1,
      "pageSize": 10,
      "totalPages": 0
    }
  }
}
```

**说明**: 当前没有学生数据（需要导入）

**状态**: [ ] 通过

---

### 测试 7：班主任获取学期列表
```
方法: GET
URL: http://localhost:3000/api/teacher/semesters
Header: Authorization: Bearer <班主任token>
```

**预期结果**:
```json
{
  "code": 0,
  "message": "成功",
  "data": [
    {"id": 4, "semester_name": "2024春", "is_active": true},
    {"id": 5, "semester_name": "2024秋", "is_active": false},
    {"id": 6, "semester_name": "2025春", "is_active": false}
  ]
}
```

**状态**: [ ] 通过

---

## 📊 测试结果总结

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 管理员登录 | ✅ 已通过 | 已获得 token |
| 获取班级列表 | [ ] | 应该有4个班级 |
| 获取学期列表 | [ ] | 应该有3个学期 |
| 创建班主任 | [ ] | 测试权限和关联 |
| 获取班主任列表 | [ ] | 验证创建结果 |
| 班主任登录 | [ ] | 获得班主任 token |
| 班主任获取学生列表 | [ ] | 应该是空的（无数据） |
| 班主任获取学期列表 | [ ] | 应该有3个学期 |

---

## 🎯 所有测试都通过后

1. ✅ 后端 API 系统完全可用
2. ✅ 权限隔离工作正常
3. ✅ 数据关联正确
4. ⏳ 下一步：修改小程序前端代码进行对接

---

## 💡 提示

- 如果任何测试失败，告诉我具体的错误信息
- 检查 URL、方法、Header 是否正确
- 确认使用的是正确的 token（管理员 vs 班主任）
- 查看后端控制台是否有错误日志

---

**现在开始测试吧！** 🚀
