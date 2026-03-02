# 核心变更总结

## 概述
解决了两个关键问题：
1. **导入失败调试**：添加详细日志输出
2. **学期总分重置**：实现新学期从 100 开始的功能

---

## 变更详情

### 1. 导入功能增强

#### 修改文件
- `routes/admin.js` - 第 247-290 行
- `routes/teacher.js` - 第 102-139 行

#### 变更内容
添加了详细的调试日志：
```javascript
// 输出文件信息
console.log('上传的文件:', req.file.filename, '大小:', req.file.size, '类型:', req.file.mimetype);

// 读取 Excel 文件
let workbook;
try {
  workbook = xlsx.readFile(filePath);
} catch (readErr) {
  console.error('读取 Excel 文件失败:', readErr);
  // 返回详细的错误信息
  return res.status(400).json(errorResponse('文件格式错误，请上传有效的 Excel 文件', -1));
}

// 验证工作表
if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
  console.error('Excel 文件没有工作表');
  return res.status(400).json(errorResponse('Excel 文件没有工作表，请检查文件', -1));
}

// 输出读取结果
console.log('读取的行数:', data.length);
if (data.length === 0) {
  console.log('读取的列名:', Object.keys(sheet));
} else {
  console.log('第一行数据:', data[0]);
}
```

#### 益处
- 快速定位导入失败的原因
- 支持调试 Excel 文件格式、内容、列名等问题

---

### 2. 学期总分重置实现

#### 新建文件
1. **`database.sql`** 
   - 新增 `student_semester_scores` 表

2. **`migrate_semester_scores.js`**
   - 为现有学生和学期初始化分数数据

#### 修改的数据库表

**新表：`student_semester_scores`**
```sql
CREATE TABLE student_semester_scores (
  id INT PRIMARY KEY AUTO_INCREMENT,
  student_id INT NOT NULL,
  semester_id INT NOT NULL,
  total_score DECIMAL(10, 2) DEFAULT 100.00,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_semester (student_id, semester_id),
  INDEX idx_student_id (student_id),
  INDEX idx_semester_id (semester_id)
);
```

**保留表：`students`**
- 保留 `current_score` 字段用于兼容性和跨学期查询

---

### 3. API 逻辑更新

#### A. 添加积分 - POST `/api/teacher/scores`

**修改文件**：`routes/teacher.js` 第 258-297 行

**变更前**：
```javascript
const newScore = parseFloat(student.current_score) + parseFloat(scoreChange);
await connection.query(
  'UPDATE students SET current_score = ? WHERE id = ?',
  [newScore, studentId]
);
```

**变更后**：
```javascript
// 获取当前学期的分数
const [semesterScores] = await connection.query(
  'SELECT total_score FROM student_semester_scores WHERE student_id = ? AND semester_id = ?',
  [studentId, semesterId]
);

let newScore;
if (semesterScores.length === 0) {
  // 该学期第一次操作，初始化为100
  await connection.query(
    'INSERT INTO student_semester_scores (student_id, semester_id, total_score) VALUES (?, ?, ?)',
    [studentId, semesterId, 100 + scoreChange_num]
  );
  newScore = 100 + scoreChange_num;
} else {
  // 更新该学期的分数
  newScore = parseFloat(semesterScores[0].total_score) + scoreChange_num;
  await connection.query(
    'UPDATE student_semester_scores SET total_score = ? WHERE student_id = ? AND semester_id = ?',
    [newScore, studentId, semesterId]
  );
}

// 同时更新 current_score（用于兼容性）
const newCurrentScore = parseFloat(student.current_score) + scoreChange_num;
await connection.query(
  'UPDATE students SET current_score = ? WHERE id = ?',
  [newCurrentScore, studentId]
);
```

#### B. 获取班级学生列表 - GET `/api/teacher/students`

**修改文件**：`routes/teacher.js` 第 40-99 行

**变更**：新增 `semesterId` 参数支持
```javascript
if (semesterId) {
  // 从 student_semester_scores 获取该学期分数
  dataQuery += `, COALESCE(sss.total_score, 100) as semester_score
               FROM students s
               LEFT JOIN student_semester_scores sss ON s.id = sss.student_id AND sss.semester_id = ?
               WHERE s.class_id = ?`;
} else {
  // 使用 current_score
  dataQuery += ` FROM students WHERE class_id = ?`;
}
```

#### C. 撤销积分记录 - DELETE `/api/teacher/score-records/:id`

**修改文件**：`routes/teacher.js` 第 402-451 行

**变更**：获取 `semester_id` 后，更新对应学期的分数
```javascript
const record = records[0];
const reverseScore = -parseFloat(record.score_change);

// 更新该学期的学生分数
await connection.query(
  'UPDATE student_semester_scores SET total_score = total_score + ? WHERE student_id = ? AND semester_id = ?',
  [reverseScore, record.student_id, record.semester_id]
);

// 同时更新 current_score
await connection.query(
  'UPDATE students SET current_score = current_score + ? WHERE id = ?',
  [reverseScore, record.student_id]
);
```

#### D. 导出学生总分 - GET `/api/teacher/export/scores`

**修改文件**：`routes/teacher.js` 第 477-530 行

**变更**：支持按 `semesterId` 导出不同学期的分数

```javascript
if (semesterId) {
  // 按学期导出
  query = `SELECT s.name, s.student_number, s.gender, c.class_name,
                  COALESCE(sss.total_score, 100) as current_score
           FROM students s
           JOIN classes c ON s.class_id = c.id
           LEFT JOIN student_semester_scores sss ON s.id = sss.student_id AND sss.semester_id = ?
           WHERE s.class_id = ?`;
  params = [semesterId, classId];
} else {
  // 导出 current_score
  query = `SELECT ...`;
}
```

#### E. 管理员导出学生总分 - GET `/api/admin/export/students`

**修改文件**：`routes/admin.js` 第 501-552 行

**变更**：同上，支持按学期导出

---

### 4. 新增文件说明

#### `IMPORT_DEBUG_AND_SEMESTER_RESET.md`
- 导入失败的问题分析
- 学期总分重置的实现说明
- 快速诊断检查表

#### `SEMESTER_RESET_IMPLEMENTATION.md`
- 详细的实现步骤
- API 逻辑变更说明
- 与前端的交互指南
- 常见问题解答

#### `COMPLETE_IMPLEMENTATION_GUIDE.md`
- 综合的实施指南
- 导入问题的详细排查步骤
- 学期重置的完整测试流程

#### `migrate_semester_scores.js`
- 数据迁移脚本
- 为现有学生和学期初始化分数

---

## 实施清单

执行以下步骤完成所有变更：

### Phase 1：准备（5 分钟）
- [ ] 备份现有数据库
- [ ] 准备新的 `database.sql`
- [ ] 准备 `migrate_semester_scores.js` 脚本

### Phase 2：数据库更新（10 分钟）
- [ ] 执行新的 `database.sql`
  ```bash
  mysql -u root -p123456 score_management < database.sql
  ```
- [ ] 验证新表已创建
  ```bash
  mysql -u root -p123456 -e "DESC score_management.student_semester_scores;"
  ```

### Phase 3：数据迁移（5 分钟）
- [ ] 运行迁移脚本
  ```bash
  node migrate_semester_scores.js
  ```
- [ ] 验证迁移结果
  ```bash
  mysql -u root -p123456 -e "SELECT COUNT(*) FROM score_management.student_semester_scores;"
  ```

### Phase 4：代码更新（已完成）
- [x] 更新 `routes/teacher.js`
- [x] 更新 `routes/admin.js`
- [x] 添加调试日志

### Phase 5：测试（15 分钟）
- [ ] 重启后端服务
  ```bash
  npm run dev
  ```
- [ ] 测试导入功能（查看日志输出）
- [ ] 测试添加积分（验证 semesterScore）
- [ ] 测试按学期查询
- [ ] 测试撤销操作
- [ ] 测试导出功能

---

## 向后兼容性

所有 API 变更都是向后兼容的：

- **可选参数**：`semesterId` 是可选的，不提供时使用 `current_score`
- **新字段**：`semester_score` 是新增字段，旧客户端会忽略它
- **现有数据**：`current_score` 仍然保留和更新，历史数据不受影响

---

## 性能考虑

- `student_semester_scores` 表有两个索引：`student_id` 和 `semester_id`
- 添加了 `UNIQUE KEY unique_student_semester` 确保每学期每学生只有一条记录
- 查询都包含了必要的索引，性能不会受影响

---

## 后续工作

1. **前端集成**
   - 在学生列表页面添加学期选择器
   - 在积分操作时自动获取当前学期
   - 在导出时添加学期选择

2. **管理功能**
   - 创建学期 API
   - 学期管理界面

3. **报表功能**
   - 学期对比报表
   - 学生成长记录追踪

