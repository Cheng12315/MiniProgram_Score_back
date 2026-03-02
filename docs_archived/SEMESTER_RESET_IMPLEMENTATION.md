# 学期总分重置实现指南

## 核心变更说明

为了支持"学生的总分在新学期开始时会从 100 重新开始"的需求，我们进行了以下核心变更：

### 1. 数据库变更

#### 新增表：`student_semester_scores`
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

**作用**：每个学生在每个学期有一条记录，存储该学期的总分。新学期时自动初始化为 100 分。

#### 保留的表：`students.current_score`
- 该字段保留用于兼容性和快速查询
- 存储学生的跨学期累计总分（历史最高分或最后一次操作的分数）
- 积分操作时同时更新该字段和 `student_semester_scores` 中的分数

---

### 2. API 逻辑变更

#### A. 添加积分 API (`POST /api/teacher/scores`)

**变更前**：
- 只更新 `students.current_score`

**变更后**：
```
1. 检查 student_semester_scores 表中是否有该学期的记录
2. 如果没有，则创建新记录，初始分数为 100 + 积分变动
3. 如果有，则直接更新该学期的分数
4. 同时更新 students.current_score（用于兼容性）
5. 在 score_records 表中插入操作记录
```

**返回值**：
```json
{
  "code": 0,
  "message": "积分操作成功",
  "data": {
    "recordId": 123,
    "newScore": 102,
    "semesterScore": 102
  }
}
```

#### B. 获取班级学生列表 (`GET /api/teacher/students`)

**新增参数**：
- `semesterId`（可选）- 按学期查询时，返回该学期的分数

**变更逻辑**：
```
- 如果指定 semesterId：
  SELECT ... 
  LEFT JOIN student_semester_scores 
  WHERE semester_id = ?
  
- 如果不指定 semesterId：
  使用 students.current_score（跨学期累计分数）
```

**示例请求**：
```
GET /api/teacher/students?semesterId=2&page=1&pageSize=10
```

**返回示例**：
```json
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [
      {
        "id": 1,
        "name": "张三",
        "student_number": "001",
        "gender": "M",
        "current_score": 98.50,
        "semester_score": 102.00,  // 该学期的分数
        "created_at": "2024-01-01T..."
      }
    ],
    "pagination": {...}
  }
}
```

#### C. 撤销积分记录 (`DELETE /api/teacher/score-records/:id`)

**变更逻辑**：
```
1. 获取要撤销的记录（包含 student_id, score_change, semester_id）
2. 计算反向分数：reverseScore = -score_change
3. 更新 student_semester_scores 中对应学期的分数
4. 同时更新 students.current_score（用于兼容性）
5. 删除 score_records 中的记录
```

#### D. 导出学生总分 (`GET /api/teacher/export/scores` 或 `/api/admin/export/students`)

**新增参数**：
- `semesterId`（可选）- 按学期导出

**变更逻辑**：
```
- 如果指定 semesterId：
  导出该学期的分数（从 student_semester_scores 表获取）
  
- 如果不指定 semesterId：
  导出 current_score（跨学期累计分数）
```

**示例请求**：
```
# 导出 2024 春学期的分数
GET /api/teacher/export/scores?semesterId=2

# 导出全部累计分数
GET /api/teacher/export/scores
```

---

### 3. 实施步骤

#### 步骤 1：更新数据库架构

1. 在 MySQL 中运行新的 `database.sql`：
```bash
mysql -u root -p score_management < database.sql
```

2. 验证新表已创建：
```sql
mysql> DESC student_semester_scores;
```

#### 步骤 2：初始化历史数据

运行迁移脚本为所有现有学生和学期初始化分数：
```bash
node migrate_semester_scores.js
```

**输出示例**：
```
开始迁移数据...
找到 10 个学生和 3 个学期
迁移完成！插入 30 条记录，跳过 0 条重复记录
```

#### 步骤 3：重启后端服务

```bash
npm run dev
```

#### 步骤 4：测试 API（使用 Apifox）

##### 测试 4.1：添加积分
```
POST /api/teacher/scores
{
  "studentId": 1,
  "semesterId": 2,
  "scoreChange": 5,
  "reason": "表现良好"
}

预期返回：
{
  "code": 0,
  "data": {
    "recordId": 123,
    "newScore": 105,
    "semesterScore": 105
  }
}
```

##### 测试 4.2：按学期查询学生

```
GET /api/teacher/students?semesterId=2&page=1&pageSize=10

预期返回：
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "张三",
        "current_score": 98.50,
        "semester_score": 105.00
      }
    ]
  }
}
```

##### 测试 4.3：按学期导出总分

```
GET /api/teacher/export/scores?semesterId=2

预期：
- 下载 Excel 文件
- 文件中的"得分"列显示该学期的分数（从 100 开始）
```

##### 测试 4.4：撤销积分

```
DELETE /api/teacher/score-records/123

预期：
{
  "code": 0,
  "message": "记录已撤销"
}
```

---

### 4. 学期管理建议

#### A. 如何创建新学期？

在 Apifox 中调用"创建学期" API（需要实现）或直接在数据库中插入：

```sql
INSERT INTO semesters (semester_name, start_date, end_date, is_active) 
VALUES ('2025秋', '2025-09-01', '2026-01-20', FALSE);
```

#### B. 新学期开始的自动处理

当有学生在新学期首次进行积分操作时：
1. 系统会自动在 `student_semester_scores` 中创建记录
2. 初始分数为 100（不受前一学期影响）
3. 所有后续操作都基于这个 100 分基础进行

**示例流程**：
```
2024春学期：
- 学生最终得分：95 分

2024秋学期（新学期）：
- 首次操作时，系统自动创建记录：total_score = 100
- 如果加 3 分，则 total_score = 103
- 与 2024春 的 95 分完全隔离
```

---

### 5. 与前端的交互说明

#### A. 学生列表页面

前端在获取学生列表时需要传递 `semesterId` 参数：

```javascript
// 前端代码示例
const getStudents = (semesterId) => {
  return wx.request({
    url: `${API_BASE}/api/teacher/students?semesterId=${semesterId}`,
    method: 'GET',
    header: {
      'Authorization': `Bearer ${token}`
    }
  });
};
```

#### B. 导出总分

前端选择学期后进行导出：

```javascript
// 导出指定学期的总分
const exportScores = (semesterId) => {
  // 使用 semesterId 参数
  window.location.href = `${API_BASE}/api/teacher/export/scores?semesterId=${semesterId}&token=${token}`;
};
```

#### C. 积分操作

添加积分时必须传递 `semesterId`：

```javascript
const addScore = (studentId, semesterId, scoreChange, reason) => {
  return wx.request({
    url: `${API_BASE}/api/teacher/scores`,
    method: 'POST',
    data: {
      studentId,
      semesterId,
      scoreChange,
      reason
    }
  });
};
```

---

### 6. 常见问题

#### Q1：如何验证学期分数是否正确初始化？

在 MySQL 中检查：
```sql
SELECT * FROM student_semester_scores 
WHERE student_id = 1;
```

应该看到每个学期都有一条记录。

#### Q2：current_score 和 semester_score 的区别？

- **current_score**：保存在 `students` 表，跨学期的累计分数
- **semester_score**：保存在 `student_semester_scores` 表，该学期的分数

#### Q3：导出时应该导出哪个分数？

- **导出单个学期的数据**：使用 `semesterId` 参数，导出 `semester_score`
- **导出全部历史数据**：不传 `semesterId` 参数，导出 `current_score`

#### Q4：如果忘记为某个学生初始化学期分数怎么办？

系统会自动在该学生首次进行积分操作时创建记录，初始分数为 100。

---

### 7. 测试检查清单

使用此清单验证所有功能正常工作：

- [ ] 数据库新表已创建
- [ ] 迁移脚本运行成功
- [ ] 后端服务重启无误
- [ ] 添加积分时，返回 `semesterScore` 字段
- [ ] 按学期查询学生时，返回 `semester_score`
- [ ] 按学期导出时，分数正确反映该学期的总分
- [ ] 撤销操作时，两个表（students、student_semester_scores）都正确更新
- [ ] 新学期首次操作时，自动初始化为 100 分

---

### 8. 后续完整功能

下一步需要实现的功能：

1. **创建学期 API**（管理员）
   - `POST /api/admin/semesters`

2. **获取学期列表 API**
   - `GET /api/semesters`（已有，但需要验证）

3. **前端学期选择器集成**
   - 在学生列表页面添加学期选择
   - 在积分操作页面确保学期正确传递

---

## 总结

这次变更的核心思想是：
- 每个学期的分数是独立的，从 100 开始
- 跨学期的 `current_score` 用于历史统计
- API 都支持可选的 `semesterId` 参数来灵活处理不同的查询需求

