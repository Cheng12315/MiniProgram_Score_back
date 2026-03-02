# ✅ 最终 API 完整测试清单

## 📌 当前状态

### ✅ 已完成的基础测试
- [x] 管理员登录
- [x] 获取班级列表
- [x] 获取学期列表
- [x] 创建班主任账号
- [x] 获取班主任列表
- [x] 班主任登录
- [x] 班主任获取学生列表

### ⏳ 准备就绪的高级测试
- [x] 示例学生已插入（5个）
- ⏳ 积分操作测试
- ⏳ 数据导出测试

---

## 📌 可用的 Tokens 和 IDs

### 管理员账号
```
用户名: admin
密码: admin123
Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MjI5MTg5MSwiZXhwIjoxNzcyODk2NjkxfQ.H46inA-4yEATtuBn3bTS1-Vz5lqW8R1smy_oOQikZiU
```

### 班主任账号 (teacher1)
```
用户名: teacher1
密码: teacher123
Token: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZWFjaGVyMSIsInJvbGUiOiJ0ZWFjaGVyIiwiY2xhc3NJZCI6NSwiaWF0IjoxNzcyMjkzNDAyLCJleHAiOjE3NzI4OTgyMDJ9.QOsJI38uscxf8HoQ09xAS28f8EuUgeS0M67UOMrPyg4
班级: 8年级1班 (ID: 5)
```

### 班级 IDs
```
ID 5 = 8年级1班
ID 6 = 8年级2班
ID 7 = 242班
ID 8 = 243班
```

### 学期 IDs
```
ID 4 = 2024春（活跃）
ID 5 = 2024秋
ID 6 = 2025春
```

### 学生 IDs（已插入）
```
ID 1 = 张三 (2022001)
ID 2 = 李四 (2022002)
ID 3 = 王五 (2022003)
ID 4 = 赵六 (2022004)
ID 5 = 孙七 (2022005)
```

---

## 🧪 高级 API 测试

### 测试 1️⃣：管理员获取所有学生

```
请求方法: GET
URL: http://localhost:3000/api/admin/students?page=1&pageSize=10
Header: Authorization: Bearer <管理员token>
```

**预期**: 返回 5 个学生

**检查**: [ ] 通过

---

### 测试 2️⃣：班主任添加积分记录（+2分）

```
请求方法: POST
URL: http://localhost:3000/api/teacher/score-records
Header: Authorization: Bearer <班主任token>

Body (JSON):
{
  "studentId": 1,
  "semesterId": 4,
  "scoreChange": 2,
  "reason": "遵守纪律"
}
```

**预期**: 
- 返回成功消息
- `newScore` 为 102

**检查**: [ ] 通过

**记录 Record ID**:1

---

### 测试 3️⃣：班主任添加积分记录（-1分）

```
请求方法: POST
URL: http://localhost:3000/api/teacher/score-records
Header: Authorization: Bearer <班主任token>

Body (JSON):
{
  "studentId": 1,
  "semesterId": 4,
  "scoreChange": -1,
  "reason": "迟到"
}
```

**预期**:
- 返回成功消息
- `newScore` 为 101

**检查**: [ ] 通过

**记录 Record ID**:2

---

### 测试 4️⃣：班主任查询积分记录

```
请求方法: GET
URL: http://localhost:3000/api/teacher/score-records?page=1&pageSize=10
Header: Authorization: Bearer <班主任token>
```

**预期**:
- 返回 2 条记录
- 包含"+2分"和"-1分"的两条操作

**检查**: [ ] 通过

---

### 测试 5️⃣：班主任撤销积分记录

```
请求方法: DELETE
URL: http://localhost:3000/api/teacher/score-records/2
Header: Authorization: Bearer <班主任token>

（注意：2是测试3️⃣中返回的Record ID）
```

**预期**:
- 返回成功消息
- 记录被删除

**检查**: [ ] 通过

---

### 测试 6️⃣：验证撤销结果

```
请求方法: GET
URL: http://localhost:3000/api/teacher/score-records?page=1&pageSize=10
Header: Authorization: Bearer <班主任token>
```

**预期**:
- 只返回 1 条记录
- 应该是 ID=1 的"+2分"记录

**检查**: [ ] 通过

---

### 测试 7️⃣：班主任导出学生总分

```
请求方法: GET
URL: http://localhost:3000/api/teacher/export/scores
Header: Authorization: Bearer <班主任token>
```

**预期**:
- 浏览器自动下载 Excel 文件
- 文件名：`学生总分_<时间戳>.xlsx`
- Excel 内容包含：
  - 列：姓名、学号、班级、性别、得分
  - 数据：5个学生，其中张三的得分应该是 102（初始100+2）

**验证步骤**:
1. [ ] 文件成功下载
2. [ ] 打开 Excel 文件
3. [ ] 验证数据正确（特别是张三的分数 102）

---

### 测试 8️⃣：班主任导出积分记录

```
请求方法: GET
URL: http://localhost:3000/api/teacher/export/records
Header: Authorization: Bearer <班主任token>
```

**预期**:
- 浏览器自动下载 Excel 文件
- 文件名：`积分记录_<时间戳>.xlsx`
- Excel 内容包含：
  - 列：学生姓名、学号、班级、变动原因、变动分值、操作时间
  - 数据：1条记录（ID=1，"遵守纪律"，"+2"）

**验证步骤**:
1. [ ] 文件成功下载
2. [ ] 打开 Excel 文件
3. [ ] 验证只有 1 条记录
4. [ ] 验证内容正确（张三，+2分，遵守纪律）

---

### 测试 9️⃣（可选）：管理员导入学生数据

需要准备一个 Excel 文件，内容示例：

```
姓名,学号,班级,性别
李白,2022101,8年级1班,M
杜甫,2022102,8年级1班,F
```

```
请求方法: POST
URL: http://localhost:3000/api/admin/students/import
Header: Authorization: Bearer <管理员token>

Body: 
  - 选择 form-data
  - 添加文件字段 "file"
  - 选择你的 Excel 文件
```

**预期**:
- 返回成功消息
- 显示导入数量

**检查**: [ ] 通过（可选）

---

## 📋 完整的测试清单

按照以下顺序进行测试：

1. [ ] 测试 1️⃣ 管理员获取所有学生
2. [ ] 测试 2️⃣ 添加积分记录（+2分）
3. [ ] 测试 3️⃣ 添加积分记录（-1分）
4. [ ] 测试 4️⃣ 查询积分记录
5. [ ] 测试 5️⃣ 撤销积分记录
6. [ ] 测试 6️⃣ 验证撤销结果
7. [ ] 测试 7️⃣ 导出学生总分
8. [ ] 测试 8️⃣ 导出积分记录
9. [ ] 测试 9️⃣ 导入学生数据（可选）

---

## 🎯 测试完成后

✅ 所有 API 接口都已测试通过

### 下一步工作

1. **修改小程序前端代码**
   - 连接后端 API
   - 实现登录功能
   - 实现学生管理、积分操作等功能

2. **开发管理后台**
   - 使用 React 或 Vue 开发管理员界面

3. **本地集成测试**
   - 小程序与后端联调

4. **部署上线**
   - 云服务器部署
   - 微信小程序发布

---

## 💡 常见问题

### Q: 为什么导出的文件是中文名称？
A: Excel 文件支持中文名称，这样更便于识别

### Q: 能否修改导出的 Excel 格式？
A: 目前已经包含必要的列（姓名、学号、班级、性别、得分等），如需更改列名，修改 `routes/teacher.js` 中的导出逻辑

### Q: 积分能否为 0？
A: 可以，但通常不会这样操作。系统设计初始分数为 100，支持正数（加分）和负数（扣分）

### Q: 如何处理多个班级？
A: 班主任 token 中包含 `classId`，系统会自动只显示该班级的数据

---

## 📊 测试结果记录

| 测试项 | 状态 | 备注 |
|--------|------|------|
| 管理员登录 | ✅ | 已完成 |
| 获取班级列表 | ✅ | 已完成 |
| 获取学期列表 | ✅ | 已完成 |
| 创建班主任 | ✅ | 已完成 |
| 班主任登录 | ✅ | 已完成 |
| 管理员获取学生 | [ ] | 待测 |
| 添加积分记录 | [ ] | 待测 |
| 查询积分记录 | [ ] | 待测 |
| 撤销积分记录 | [ ] | 待测 |
| 导出总分 | [ ] | 待测 |
| 导出记录 | [ ] | 待测 |
| 导入学生 | [ ] | 可选 |

---

**祝测试顺利！** 🚀

所有测试通过后，你就可以开始修改小程序前端代码对接后端了！
