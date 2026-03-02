# 班主任积分操作测试指南

## API 端点明细

### 1. 添加积分（创建新的积分记录）

**请求方法**：`POST`  
**URL**：`http://localhost:3000/api/teacher/score-records`  
**认证**：需要班主任 Token

**请求体（JSON）**：
```json
{
  "studentId": 1,
  "semesterId": 2,
  "scoreChange": 5,
  "reason": "表现良好"
}
```

**字段说明**：
- `studentId` (必需) - 学生 ID
- `semesterId` (必需) - 学期 ID
- `scoreChange` (必需) - 分数变动，正数为加分，负数为扣分
- `reason` (必需) - 操作理由

**预期成功响应**：
```json
{
  "code": 0,
  "message": "积分操作成功",
  "data": {
    "recordId": 123,
    "newScore": 105,
    "semesterScore": 105
  }
}
```

**预期失败响应示例**：
```json
{
  "code": -1,
  "message": "缺少必需字段",
  "data": null
}
```

---

### 2. 查询积分记录（获取列表）

**请求方法**：`GET`  
**URL**：`http://localhost:3000/api/teacher/score-records`  
**认证**：需要班主任 Token

**查询参数**（可选）：
- `page` - 页码（默认 1）
- `pageSize` - 每页数量（默认 10）
- `studentId` - 按学生 ID 筛选
- `semesterId` - 按学期 ID 筛选

**示例 URL**：
```
http://localhost:3000/api/teacher/score-records
http://localhost:3000/api/teacher/score-records?semesterId=2
http://localhost:3000/api/teacher/score-records?studentId=1&semesterId=2
```

**预期成功响应**：
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 1,
        "student_id": 1,
        "reason": "表现良好",
        "score_change": "5.00",
        "created_at": "2026-02-28T16:01:01.000Z",
        "student_name": "张三",
        "student_number": "2022001",
        "semester_name": "2024春"
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

---

### 3. 撤销积分记录（删除指定的积分记录）

**请求方法**：`DELETE`  
**URL**：`http://localhost:3000/api/teacher/score-records/:id`  
**认证**：需要班主任 Token

**URL 参数**：
- `id` - 要撤销的积分记录 ID

**示例 URL**：
```
http://localhost:3000/api/teacher/score-records/123
```

**请求体**：无（DELETE 请求通常不需要 body）

**预期成功响应**：
```json
{
  "code": 0,
  "message": "记录已撤销",
  "data": null
}
```

---

## Apifox 中的测试步骤

### 准备工作

1. 确保已登录班主任账户
2. 获取班主任 Token：
   ```
   POST http://localhost:3000/api/auth/login
   Body: {
     "username": "teacher1",
     "password": "teacher123"
   }
   ```
   记下返回的 `token`

3. 在 Apifox 中设置 Token：
   - 点击请求的 `Auth` 标签
   - 选择 `Bearer Token`
   - 粘贴得到的 token

### 测试步骤

#### Step 1: 查询班级学生
```
GET http://localhost:3000/api/teacher/students?semesterId=2
```
记下一个学生的 ID（例如 1）

#### Step 2: 添加积分
```
POST http://localhost:3000/api/teacher/score-records
Body (JSON):
{
  "studentId": 1,
  "semesterId": 2,
  "scoreChange": 5,
  "reason": "表现良好"
}
```

**验证**：
- [ ] 返回 `code: 0`
- [ ] 返回 `message: "积分操作成功"`
- [ ] 返回 `recordId` 字段（记下这个 ID，用于后续撤销）
- [ ] 返回 `semesterScore: 105`（如果初始分数是 100）

#### Step 3: 查询积分记录
```
GET http://localhost:3000/api/teacher/score-records?semesterId=2
```

**验证**：
- [ ] 返回包含新添加的积分记录
- [ ] `score_change` 显示 5.00
- [ ] `student_name` 显示正确的学生名字

#### Step 4: 撤销积分
```
DELETE http://localhost:3000/api/teacher/score-records/{recordId}
```
其中 `{recordId}` 是 Step 2 中返回的 ID

**验证**：
- [ ] 返回 `code: 0`
- [ ] 返回 `message: "记录已撤销"`

#### Step 5: 再次查询积分记录
```
GET http://localhost:3000/api/teacher/score-records?semesterId=2
```

**验证**：
- [ ] 之前添加的记录不再出现

---

## 常见问题排查

### Q: 返回"缺少必需字段"

**原因**：某个必需字段没有提供或为空

**检查**：
- `studentId` - 必须是数字
- `semesterId` - 必须是数字
- `scoreChange` - 必须是数字（可以是负数）
- `reason` - 必须是非空字符串

**示例正确请求**：
```json
{
  "studentId": 1,
  "semesterId": 2,
  "scoreChange": 5,
  "reason": "遵守纪律"
}
```

### Q: 返回"学生不存在或无权访问"

**原因**：
1. `studentId` 不存在
2. 学生不属于班主任的班级

**检查**：
- 调用 `GET /api/teacher/students` 确认学生 ID
- 确认学生属于班主任的班级

### Q: 返回"服务器错误"

**原因**：后端代码异常

**解决**：
1. 查看后端终端日志，找出具体错误
2. 检查 `student_semester_scores` 表是否存在
3. 检查 `score_records` 表是否存在

### Q: 查询时返回为空

**原因**：
1. 没有积分记录
2. 指定的 `semesterId` 或 `studentId` 不正确

**解决**：
- 先不指定参数查询所有记录：`GET /api/teacher/score-records`
- 确认是否有数据

---

## 完整测试流程示例

### 创建测试数据

1. **登录班主任**
   ```
   POST http://localhost:3000/api/auth/login
   {
     "username": "teacher1",
     "password": "teacher123"
   }
   ```
   复制 token

2. **获取班级学生**
   ```
   GET http://localhost:3000/api/teacher/students
   ```
   假设返回学生 ID = 5, 学期 ID = 2

3. **添加多条积分记录**
   ```
   POST http://localhost:3000/api/teacher/score-records
   {
     "studentId": 5,
     "semesterId": 2,
     "scoreChange": 3,
     "reason": "助人为乐"
   }
   ```

4. **再添加一条**
   ```
   POST http://localhost:3000/api/teacher/score-records
   {
     "studentId": 5,
     "semesterId": 2,
     "scoreChange": -1,
     "reason": "迟到"
   }
   ```

### 验证数据

5. **查询该学期该学生的所有积分**
   ```
   GET http://localhost:3000/api/teacher/score-records?studentId=5&semesterId=2
   ```
   预期：返回 2 条记录，分别是 +3 和 -1

6. **查询学生的分数**
   ```
   GET http://localhost:3000/api/teacher/students?semesterId=2
   ```
   预期：该学生的 `semester_score` 应该是 100 + 3 - 1 = 102

### 撤销记录

7. **撤销第一条记录**
   ```
   DELETE http://localhost:3000/api/teacher/score-records/{第一条的ID}
   ```

8. **再次查询学生分数**
   ```
   GET http://localhost:3000/api/teacher/students?semesterId=2
   ```
   预期：该学生的 `semester_score` 应该是 100 - 1 = 99

---

## 注意事项

1. **Token 有效期**：Token 可能会过期，需要重新登录
2. **学期与学生**：确保学期和学生都存在
3. **班级隔离**：班主任只能操作自己班级的学生
4. **分数变动**：可以是正数或负数
5. **理由字段**：必须填写，用于记录操作原因

---

## 调试技巧

1. **启用详细日志**：在后端终端查看错误信息
2. **使用 Apifox 的测试功能**：可以自动化测试这些 API
3. **检查数据库**：如果返回异常，直接查询数据库验证数据是否正确保存
4. **逐步测试**：从简单的查询开始，再测试添加和删除

