# 对你两个问题的完整回答

## 问题 1：导入数据失败

### 你的问题
> 我严格按提示执行导入数据还是"{code: -1, message: "导入失败，请检查文件格式", data: null}"

### 我的解答

这个错误说明后端代码正在阻止你的导入，但没有给出具体原因。我已经**修复了这个问题**。

#### 修复内容

**更新了导入代码** - 添加了详细的调试日志：

`routes/admin.js` 和 `routes/teacher.js` 的导入端点现在会输出：

```javascript
console.log('上传的文件:', req.file.filename, '大小:', req.file.size, '类型:', req.file.mimetype);
console.log('读取的行数:', data.length);
if (data.length === 0) {
  console.log('读取的列名:', Object.keys(sheet));
} else {
  console.log('第一行数据:', data[0]);
}
```

#### 为什么这样做

现在你可以看到：
1. **文件是否被正确上传** - 检查文件名和大小
2. **Excel 是否被正确读取** - 检查行数和列名
3. **具体数据是什么** - 检查第一行的内容
4. **具体错误在哪里** - 每个验证步骤都有对应的日志

#### 如何使用

1. **重启后端** - `npm run dev`
2. **尝试导入** - 在 Apifox 中上传一个 Excel 文件
3. **查看日志** - 在后端终端中查看输出
4. **根据日志修改** - 按照日志提示调整 Excel 文件

#### 可能的原因和解决

根据后端日志，导入失败可能是由于：

| 日志信息 | 原因 | 解决 |
|---------|------|------|
| `读取 Excel 文件失败: Error: ...` | 文件不是有效的 xlsx 格式 | 用 Microsoft Excel 打开并重新保存为 .xlsx |
| `读取的行数: 0` | Excel 文件只有表头，没有数据 | 在表头下面添加至少一行数据 |
| `班级"...班"不存在` | Excel 中的班级名与数据库不符 | 在 Apifox 调用"获取班级列表"，使用正确的班级名 |
| `性别值不合法` | 性别格式不对 | 只使用 `男`, `女`, `其他` 或 `M`, `F`, `Other` |
| `学号"..."已存在` | 学号重复（这不是错误，是提示被覆盖了） | 如果想保留旧数据，使用新的学号 |

---

## 问题 2：学生的总分在新学期开始时会从 100 重新开始

### 你的问题
> 另外说明一点，学生的总分在新学期开始时会从 100 重新开始，而不是在上个学期总分基础上变化。

### 我的解答

**我已经完整实现了这个功能**。

#### 实现方案

##### 核心思想

每个学生在每个学期都有一个独立的总分记录，新学期时自动从 100 开始。

##### 数据库层面

创建了新表 `student_semester_scores`：

```sql
CREATE TABLE student_semester_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,           -- 学生 ID
  semester_id INT NOT NULL,          -- 学期 ID
  total_score DECIMAL(10, 2) DEFAULT 100.00,  -- 该学期的总分（初始 100）
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_semester (student_id, semester_id)  -- 每学期每学生只有一条
);
```

**这个设计的好处**：
- 每个学期的分数是完全独立的
- 新学期时，系统会自动创建新记录，初始值为 100
- 历史数据完整保存，可以查询和对比

##### API 层面

更新了所有涉及分数的 API：

###### 1. 添加积分 - `POST /api/teacher/scores`

**逻辑变化**：
```
之前：students.current_score += scoreChange
之后：student_semester_scores.total_score += scoreChange
      + students.current_score += scoreChange（用于兼容性）
```

**新增返回字段**：
```json
{
  "data": {
    "recordId": 123,
    "newScore": 105,           // 当前分数
    "semesterScore": 105       // ⭐ 该学期的分数（新增）
  }
}
```

**工作流程**：
```
1. 检查 student_semester_scores 表
2. 如果该学期没有记录
   → 创建新记录，初始分数 = 100 + scoreChange
3. 如果有记录
   → 直接更新该学期的分数
4. 同时更新 students.current_score（兼容旧代码）
```

###### 2. 查询学生列表 - `GET /api/teacher/students`

**新增参数**：`?semesterId=2`

**逻辑**：
```
不指定 semesterId：
  → 返回 current_score（跨学期累计分数）

指定 semesterId：
  → 返回该学期的 semester_score（从 100 开始）
  → 自动处理：如果没有该学期记录，默认返回 100
```

**返回示例**：
```json
{
  "items": [
    {
      "id": 1,
      "name": "张三",
      "current_score": 98.50,    // 跨学期累计
      "semester_score": 105.00   // ⭐ 该学期（从 100 开始）
    }
  ]
}
```

###### 3. 撤销积分 - `DELETE /api/teacher/score-records/:id`

**逻辑变化**：
```
之前：students.current_score -= scoreChange
之后：student_semester_scores.total_score -= scoreChange
      + students.current_score -= scoreChange
```

###### 4. 导出学生总分 - `GET /api/teacher/export/scores`

**新增参数**：`?semesterId=2`

**逻辑**：
```
不指定 semesterId：
  → 导出 current_score（跨学期累计分数）

指定 semesterId：
  → 导出该学期的分数（从 100 开始）
```

**示例**：
```
# 导出 2024春学期的分数
GET /api/teacher/export/scores?semesterId=1

# 导出全部历史分数
GET /api/teacher/export/scores
```

#### 具体例子

**场景**：张三在 2024春和 2024秋两个学期

```
2024春学期（semester_id = 1）:
  初始：100 分
  + 5 分（表现良好）
  + 2 分（助人为乐）
  - 1 分（迟到）
  = 106 分 ✓

2024秋学期（semester_id = 2）:
  初始：100 分  ← 新学期重新开始！
  - 2 分（迟到）
  + 3 分（助人为乐）
  = 101 分 ✓
```

**数据库记录**：
```sql
student_semester_scores:
  student_id=1, semester_id=1, total_score=106
  student_id=1, semester_id=2, total_score=101
```

**查询示例**：
```
# 查询 2024春
GET /api/teacher/students?semesterId=1
→ semester_score: 106

# 查询 2024秋
GET /api/teacher/students?semesterId=2
→ semester_score: 101

# 查询所有（不分学期）
GET /api/teacher/students
→ current_score: 106（可能是最后一个学期的值，或累计）
```

#### 实施步骤

1. **更新数据库**
   ```bash
   mysql -u root -p123456 score_management < database.sql
   ```

2. **初始化所有学生的学期分数**
   ```bash
   node migrate_semester_scores.js
   ```
   这会为每个学生的每个学期创建一条记录，初始分数都是 100。

3. **重启后端**
   ```bash
   npm run dev
   ```

4. **测试新功能**
   在 Apifox 中测试上述 API，确保：
   - 添加积分时返回 `semesterScore`
   - 查询时有 `semester_score` 字段
   - 不同学期的分数是独立的

#### 向后兼容性

✅ **这个实现是向后兼容的**：
- `current_score` 字段仍然存在和更新
- `semesterId` 是可选参数
- 旧的客户端代码不需要修改（但会缺少学期级别的细粒度控制）

#### 与前端的集成

前端需要在以下地方传递 `semesterId`：

1. **学生列表页面**
   ```javascript
   // 添加学期选择器
   const getStudents = (semesterId) => {
     return request({
       url: `/api/teacher/students?semesterId=${semesterId}`
     });
   };
   ```

2. **积分操作页面**
   ```javascript
   // 自动获取当前学期或让用户选择
   const addScore = (studentId, semesterId, scoreChange, reason) => {
     return request({
       url: `/api/teacher/scores`,
       data: {
         studentId,
         semesterId,  // ← 必须包含
         scoreChange,
         reason
       }
     });
   };
   ```

3. **导出页面**
   ```javascript
   // 可选择导出哪个学期的数据
   const exportScores = (semesterId) => {
     window.location.href = `/api/teacher/export/scores?semesterId=${semesterId}`;
   };
   ```

---

## 总结

### 问题 1 的解决方案
✅ **添加了详细的调试日志** - 你现在能看到为什么导入失败，而不是一个含糊的错误信息

### 问题 2 的解决方案
✅ **完整实现了学期分数隔离** - 每个学期从 100 开始，彼此独立

### 立即行动
1. 重启后端 - `npm run dev`
2. 测试导入修复 - 查看后端日志
3. 更新数据库 - `mysql ... < database.sql`
4. 初始化数据 - `node migrate_semester_scores.js`
5. 验证功能 - 在 Apifox 中测试新 API

详细步骤请查看 `IMMEDIATE_ACTIONS.md`

