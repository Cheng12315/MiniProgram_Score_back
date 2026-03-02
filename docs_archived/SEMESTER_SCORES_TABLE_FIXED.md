# 学期分数表问题修复

## 问题

班主任的积分操作（添加和撤销）返回"服务器错误"，具体原因是：

```
Table 'score_management.student_semester_scores' doesn't exist
```

## 根本原因

虽然你运行了 `database.sql`，但 `student_semester_scores` 表没有被创建。这可能是因为：
1. `database.sql` 文件中表的定义没有被正确执行
2. 或者 MySQL 的版本或设置问题导致表创建失败

## 修复步骤（已完成）✅

### 1. 创建表
```bash
mysql -u root -p123456 score_management -e "
CREATE TABLE IF NOT EXISTS student_semester_scores (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"
```

### 2. 验证表创建成功
```bash
mysql -u root -p123456 score_management -e "DESC student_semester_scores;"
```

**结果**：表结构正确，包含：
- `id` - 主键
- `student_id` - 学生ID（外键）
- `semester_id` - 学期ID（外键）
- `total_score` - 该学期的总分（默认 100.00）
- `created_at` - 创建时间
- `updated_at` - 更新时间
- 唯一约束：`(student_id, semester_id)` - 确保每个学生每个学期只有一条记录

### 3. 初始化数据
```bash
node migrate_semester_scores.js
```

**结果**：
```
开始迁移数据...
找到 10 个学生和 3 个学期
迁移完成！插入 30 条记录，跳过 0 条重复记录
```

这为所有 10 个学生的所有 3 个学期创建了初始记录，每个记录的 `total_score` 都是 100。

### 4. 验证数据
```bash
mysql -u root -p123456 score_management -e "SELECT COUNT(*) as total_records FROM student_semester_scores;"
```

**结果**：30 条记录（10 个学生 × 3 个学期）

### 5. 重启后端服务

后端服务已经通过 nodemon 自动重启（文件修改触发）。

## 现在可以测试了！✅

重启后，班主任的以下操作应该全部正常工作：

### 1. 添加积分
```
POST http://localhost:3000/api/teacher/score-records
Body: {
  "studentId": 1,
  "semesterId": 2,
  "scoreChange": 5,
  "reason": "表现良好"
}
```

**预期返回**：
```json
{
  "code": 0,
  "message": "积分操作成功",
  "data": {
    "recordId": ...,
    "newScore": 105,
    "semesterScore": 105
  }
}
```

### 2. 撤销积分
```
DELETE http://localhost:3000/api/teacher/score-records/{recordId}
```

**预期返回**：
```json
{
  "code": 0,
  "message": "记录已撤销"
}
```

### 3. 查询积分记录
```
GET http://localhost:3000/api/teacher/score-records?semesterId=2
```

**预期返回**：包含该学期的所有积分记录

---

## 调试信息

### 表结构确认
```
Field           Type          Null  Key  Default              Extra
id              int           NO    PRI  NULL                 auto_increment
student_id      int           NO    MUL  NULL                 
semester_id     int           NO    MUL  NULL                 
total_score     decimal(10,2) YES   -    100.00               
created_at      timestamp     YES   -    CURRENT_TIMESTAMP    DEFAULT_GENERATED
updated_at      timestamp     YES   -    CURRENT_TIMESTAMP    DEFAULT_GENERATED
```

### 初始化数据
- 学生数：10
- 学期数：3
- 初始记录数：30
- 每条记录的初始 `total_score`：100.00

---

## 为什么之前没有这个表？

原因可能是：

1. **`database.sql` 执行不完整**
   - 你可能中断了 SQL 执行
   - 或者某个 SQL 语句出错导致后续语句未执行

2. **数据库重建**
   - 如果你重新创建了数据库，新的表定义可能没有包含

3. **SQL 文件版本**
   - 可能使用的是旧版本的 `database.sql`

---

## 预防措施

为了避免这个问题再次发生：

1. **检查 SQL 执行结果**
   ```bash
   mysql -u root -p123456 score_management -e "SHOW TABLES;"
   ```
   确保所有表都被创建

2. **分步执行 SQL**
   ```bash
   # 先创建表
   mysql -u root -p123456 score_management < database.sql
   
   # 验证表
   mysql -u root -p123456 -e "USE score_management; SHOW TABLES;"
   
   # 初始化数据
   node migrate_semester_scores.js
   ```

3. **备份数据库**
   ```bash
   mysqldump -u root -p123456 score_management > backup_$(date +%Y%m%d_%H%M%S).sql
   ```

---

## 总结

| 步骤 | 操作 | 状态 |
|------|------|------|
| 1 | 创建 `student_semester_scores` 表 | ✅ 完成 |
| 2 | 验证表结构 | ✅ 完成 |
| 3 | 初始化 30 条记录 | ✅ 完成 |
| 4 | 验证数据 | ✅ 完成 |
| 5 | 重启后端 | ✅ 完成 |

现在可以在 Apifox 中测试班主任的积分操作了！

