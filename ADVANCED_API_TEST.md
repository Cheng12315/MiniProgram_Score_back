# 高级 API 接口测试指南

## 📌 可用的 Tokens

### 管理员 Token
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJhZG1pbiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3MjI5MTg5MSwiZXhwIjoxNzcyODk2NjkxfQ.H46inA-4yEATtuBn3bTS1-Vz5lqW8R1smy_oOQikZiU
```

### 班主任 Token (teacher1)
```
Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJ0ZWFjaGVyMSIsInJvbGUiOiJ0ZWFjaGVyIiwiY2xhc3NJZCI6NSwiaWF0IjoxNzcyMjkzNDAyLCJleHAiOjE3NzI4OTgyMDJ9.QOsJI38uscxf8HoQ09xAS28f8EuUgeS0M67UOMrPyg4
```

---

## 第一阶段：导入学生数据

在进行积分操作之前，需要先有学生数据。我们可以通过两种方式：

### 方式 A：手动在数据库中插入学生数据（推荐快速测试）

使用 `insert_students.js` 脚本，在执行下面的命令之前先创建脚本。

### 方式 B：使用 Excel 导入（真实场景）

稍后我们会创建 Excel 文件进行测试。

---

## 测试 1️⃣：管理员获取所有学生

**目的**：检查是否有学生数据，如果没有则需要先导入

### 请求
```
方法: GET
URL: http://localhost:3000/api/admin/students?page=1&pageSize=10
Header: Authorization: Bearer <管理员token>
```

### 预期响应（如果没有学生）
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

### 预期响应（如果有学生）
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "张三",
        "student_number": "2022001",
        "gender": "男",
        "current_score": 100,
        "class_name": "8年级1班",
        "created_at": "..."
      },
      ...
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "pageSize": 10,
      "totalPages": 1
    }
  }
}
```

**状态**: [ ] 通过

---

## 准备：导入学生数据

为了测试积分操作，我们需要先导入一些学生数据。

### 创建示例学生

建议运行 Node.js 脚本来创建示例学生数据：

```javascript
// insert_sample_students.js
const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertStudents() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const students = [
    { name: '张三', student_number: '2022001', class_id: 5, gender: '男' },
    { name: '李四', student_number: '2022002', class_id: 5, gender: '女' },
    { name: '王五', student_number: '2022003', class_id: 5, gender: '男' },
    { name: '赵六', student_number: '2022004', class_id: 5, gender: '女' },
    { name: '孙七', student_number: '2022005', class_id: 5, gender: '男' }
  ];

  for (const student of students) {
    await connection.query(
      'INSERT INTO students (name, student_number, class_id, gender, current_score) VALUES (?, ?, ?, ?, ?)',
      [student.name, student.student_number, student.class_id, student.gender, 100]
    );
  }

  console.log('✓ 5个示例学生已创建');
  await connection.end();
}

insertStudents();
```

运行命令：
```bash
node insert_sample_students.js
```

**或者直接在 MySQL 中执行**：
```sql
USE score_management;
INSERT INTO students (name, student_number, class_id, gender, current_score) VALUES
('张三', '2022001', 5, '男', 100),
('李四', '2022002', 5, '女', 100),
('王五', '2022003', 5, '男', 100),
('赵六', '2022004', 5, '女', 100),
('孙七', '2022005', 5, '男', 100);
```

---

## 测试 2️⃣：班主任获取班级学生列表

### 请求
```
方法: GET
URL: http://localhost:3000/api/teacher/students?page=1&pageSize=10
Header: Authorization: Bearer <班主任token>
```

### 预期响应
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "张三",
        "student_number": "2022001",
        "gender": "男",
        "current_score": 100,
        "created_at": "..."
      },
      ...（共5个学生）
    ],
    "pagination": {
      "total": 5,
      "page": 1,
      "pageSize": 10,
      "totalPages": 1
    }
  }
}
```

**状态**: [ ] 通过

---

## 测试 3️⃣：添加积分记录

**重要**: 创建积分记录时需要以下参数：
- `studentId`: 学生 ID（从上面的列表中获取，例如 1）
- `semesterId`: 学期 ID（从之前的测试中获取，例如 4）
- `scoreChange`: 分数变化（正数为加分，负数为扣分）
- `reason`: 操作原因

### 请求
```
方法: POST
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

### 预期响应
```json
{
  "code": 0,
  "message": "积分操作成功",
  "data": {
    "recordId": 1,
    "newScore": 102
  }
}
```

**说明**：
- 原始分数是 100
- 加上 2 分
- 新分数变为 102

**状态**: [ ] 通过

---

## 测试 4️⃣：再添加一条反向记录（用于后续测试撤销）

### 请求
```
方法: POST
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

### 预期响应
```json
{
  "code": 0,
  "message": "积分操作成功",
  "data": {
    "recordId": 2,
    "newScore": 101
  }
}
```

**状态**: [ ] 通过

---

## 测试 5️⃣：查询积分记录

### 请求
```
方法: GET
URL: http://localhost:3000/api/teacher/score-records?page=1&pageSize=10
Header: Authorization: Bearer <班主任token>
```

### 预期响应
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 2,
        "student_id": 1,
        "student_name": "张三",
        "student_number": "2022001",
        "reason": "迟到",
        "score_change": -1,
        "created_at": "..."
      },
      {
        "id": 1,
        "student_id": 1,
        "student_name": "张三",
        "student_number": "2022001",
        "reason": "遵守纪律",
        "score_change": 2,
        "created_at": "..."
      }
    ],
    "pagination": {
      "total": 2,
      "page": 1,
      "pageSize": 10,
      "totalPages": 1
    }
  }
}
```

**重要**: 记下 record ID（本例中是 2），用于下一步的撤销测试

**状态**: [ ] 通过

---

## 测试 6️⃣：撤销积分记录

使用上面查询到的记录 ID（例如 ID=2）

### 请求
```
方法: DELETE
URL: http://localhost:3000/api/teacher/score-records/2
Header: Authorization: Bearer <班主任token>
```

### 预期响应
```json
{
  "code": 0,
  "message": "记录已撤销",
  "data": null
}
```

**说明**：
- ID=2 的记录被删除
- 学生分数从 101 回到 102（因为 -1 的操作被撤销了）

**状态**: [ ] 通过

---

## 测试 7️⃣：验证撤销结果

再次查询积分记录，应该只看到 1 条记录

### 请求
```
方法: GET
URL: http://localhost:3000/api/teacher/score-records?page=1&pageSize=10
Header: Authorization: Bearer <班主任token>
```

### 预期响应
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 1,
        "student_id": 1,
        "student_name": "张三",
        "student_number": "2022001",
        "reason": "遵守纪律",
        "score_change": 2,
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

## 测试 8️⃣：导出学生总分

### 请求
```
方法: GET
URL: http://localhost:3000/api/teacher/export/scores
Header: Authorization: Bearer <班主任token>

# 可选参数：
# ?studentId=1  - 只导出特定学生
# ?semesterId=4 - 按学期导出（可选）
```

### 预期响应
- 浏览器会下载一个 Excel 文件
- 文件名：`学生总分_<时间戳>.xlsx`
- 文件内容包含列：姓名、学号、班级、性别、得分

**验证方法**：
1. 检查是否成功下载
2. 打开 Excel 文件
3. 验证数据是否正确

**状态**: [ ] 通过

---

## 测试 9️⃣：导出积分记录

### 请求
```
方法: GET
URL: http://localhost:3000/api/teacher/export/records
Header: Authorization: Bearer <班主任token>

# 可选参数：
# ?studentId=1  - 只导出特定学生的记录
# ?semesterId=4 - 按学期导出
```

### 预期响应
- 浏览器会下载一个 Excel 文件
- 文件名：`积分记录_<时间戳>.xlsx`
- 文件内容包含：学生姓名、学号、班级、变动原因、变动分值、操作时间

**验证方法**：
1. 检查是否成功下载
2. 打开 Excel 文件
3. 验证数据是否正确（应该包含 ID=1 的记录："张三"，"+2分"，"遵守纪律"）

**状态**: [ ] 通过

---

## 测试 🔟：管理员导入学生数据

这个比较复杂，需要上传 Excel 文件。我们稍后提供详细说明。

### 简单版本（使用 curl 命令行）

首先创建一个 Excel 文件或 CSV 文件，内容如下：

```
姓名,学号,班级,性别
李白,2022006,8年级1班,男
杜甫,2022007,8年级1班,女
```

然后使用 curl 上传：
```bash
curl -X POST http://localhost:3000/api/admin/students/import \
  -H "Authorization: Bearer <管理员token>" \
  -F "file=@students.xlsx"
```

### 在 Apifox 中上传文件

1. 点击 **Body** 标签
2. 选择 **form-data**
3. 添加字段：
   - 名称：`file`
   - 类型：**File**
   - 选择你的 Excel 文件

4. 点击 **Send**

### 预期响应
```json
{
  "code": 0,
  "message": "导入完成",
  "data": {
    "successCount": {
      "added": 2,
      "updated": 0
    },
    "errors": [],
    "hasErrors": false
  }
}
```

**状态**: [ ] 通过（需要先准备 Excel 文件）

---

## 📋 完整的测试顺序

建议按以下顺序进行测试：

1. [ ] 准备：在数据库中创建示例学生（5条数据）
2. [ ] 测试 1️⃣ 管理员获取所有学生
3. [ ] 测试 2️⃣ 班主任获取班级学生
4. [ ] 测试 3️⃣ 添加积分记录（+2分）
5. [ ] 测试 4️⃣ 添加积分记录（-1分）
6. [ ] 测试 5️⃣ 查询积分记录（应该有 2 条）
7. [ ] 测试 6️⃣ 撤销积分记录（删除 ID=2）
8. [ ] 测试 7️⃣ 验证撤销结果（应该只有 1 条）
9. [ ] 测试 8️⃣ 导出学生总分（下载 Excel）
10. [ ] 测试 9️⃣ 导出积分记录（下载 Excel）
11. [ ] 测试 🔟 管理员导入学生（需要 Excel 文件）

---

## 💡 关键提示

### 学生 ID
从 "获取班级学生列表" 的响应中获取：查看 `items` 数组中的 `id` 字段

### 学期 ID
已知的学期 ID：
- ID 4 = 2024春
- ID 5 = 2024秋
- ID 6 = 2025春

### 积分变动
- 正数：加分（例如 +2）
- 负数：扣分（例如 -1）

### 检查学生分数更新
在添加/撤销积分后，查询积分记录会显示 `newScore`，或者重新获取学生列表查看 `current_score`

---

## 🚀 现在开始测试！

按照上面的顺序进行测试，对于每个测试：
1. 在 Apifox 中创建请求
2. 填入正确的参数
3. 点击 Send
4. 检查响应是否符合预期
5. 在检查清单中打勾

祝测试顺利！
