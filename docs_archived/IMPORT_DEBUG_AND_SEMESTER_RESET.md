# 导入文件格式调试与学期总分重置说明

## 问题 1：导入失败调试

### 问题现象
导入 Excel 文件时返回：
```json
{
    "code": -1,
    "message": "导入失败，请检查文件格式",
    "data": null
}
```

### 原因分析
后端代码已经支持灵活的列名（中文/英文），但导入失败可能的原因包括：

1. **Excel 文件格式不正确**（不是真正的 xlsx 文件）
2. **Excel 文件没有数据行**（只有表头或空文件）
3. **Excel 文件结构异常**（多个工作表、编码问题）
4. **上传的文件没有正确传递**
5. **班级名称不匹配**（Excel 中的班级名与数据库不一致）

### 解决方案

我已经更新了后端代码，添加了详细的调试日志。现在当导入失败时，你可以：

1. **重启后端服务**
   ```bash
   npm run dev
   ```

2. **尝试导入时查看后端终端输出**
   你会看到类似的日志：
   ```
   上传的文件: students.xlsx 大小: 5248 类型: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
   读取的行数: 5
   第一行数据: { '姓名': '张三', '学号': '001', '班级': '8年级1班', '性别': '男' }
   ```

3. **根据日志进行排查**

   - **如果日志显示 "读取的行数: 0"**
     → Excel 文件没有数据，请检查是否有实际数据行（表头不算）
   
   - **如果看到"文件格式错误"错误**
     → 文件不是有效的 xlsx 格式，请重新保存或用 Microsoft Excel 打开并保存一次
   
   - **如果能看到第一行数据，但导入失败**
     → 很可能是班级名称不匹配，检查：
       - Excel 中的班级名（如 "8年级1班"）
       - 数据库中的班级名 → 在 Apifox 中调用"获取班级列表"查看
     
     - 或者性别字段有问题：
       - Excel 中应该使用：`男`, `女`, `其他` 或 `M`, `F`, `Other`
       - 不要用其他格式如 `male`, `Male`, `男性` 等

### Excel 文件模板要求

确保你的 Excel 文件：

| 姓名 | 学号 | 班级 | 性别 |
|------|------|------|------|
| 张三 | 001  | 8年级1班 | 男   |
| 李四 | 002  | 8年级1班 | 女   |
| 王五 | 003  | 8年级2班 | 其他 |

**说明**：
- 列名支持：中文列名（`姓名`, `学号`, `班级`, `性别`）或英文列名（`name`, `student_number`, `class`, `gender`）
- 性别支持：`男`, `女`, `其他` 或 `M`, `F`, `Other`
- 班级名必须与数据库中的班级完全一致
- 学号必须唯一（已存在则覆盖）
- 所有字段都是必需的

---

## 问题 2：学期总分重置

### 新功能说明

**需求**：学生的总分在新学期开始时会从 100 重新开始，而不是在上个学期总分基础上变化。

### 实现方式

#### 数据库变更

添加了新表 `student_semester_scores`：
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

**说明**：
- 每个学生在每个学期都有一条分数记录
- 新学期时自动初始化为 100 分
- 当进行积分操作时，只更新当前学期对应的分数

#### 迁移步骤

1. **更新数据库**
   
   在 MySQL 中执行 `database.sql`（包含新表创建）：
   ```bash
   mysql -u root -p score_management < database.sql
   ```

2. **运行迁移脚本**
   
   为现有的学生和学期初始化分数记录：
   ```bash
   node migrate_semester_scores.js
   ```

   输出示例：
   ```
   开始迁移数据...
   找到 10 个学生和 3 个学期
   迁移完成！插入 30 条记录，跳过 0 条重复记录
   ```

### 后续 API 修改

后续需要修改以下 API 的逻辑：

1. **学生列表接口** (`GET /api/teacher/students` 或 `GET /api/admin/students`)
   - 需要指定 `semesterId` 参数
   - 返回该学期学生的分数（从 `student_semester_scores` 表获取）

2. **添加积分接口** (`POST /api/teacher/scores`)
   - 插入 `score_records` 记录后
   - 更新对应学期的 `student_semester_scores.total_score`

3. **获取积分记录接口** (`GET /api/teacher/score-records`)
   - 支持按学期过滤
   - 返回该学期的积分操作记录

4. **导出学生总分接口** (`GET /api/admin/export/students` 或 `GET /api/teacher/export/students`)
   - 导出时需要指定学期
   - 导出的是该学期的分数

5. **撤销积分接口** (`POST /api/teacher/scores/undo`)
   - 撤销时需要指定要撤销的积分记录 ID
   - 重新计算该学期的 `student_semester_scores.total_score`

---

## 后续步骤

1. **立即执行**：
   - 更新数据库架构（运行新的 `database.sql`）
   - 运行迁移脚本（`node migrate_semester_scores.js`）

2. **重新尝试导入**：
   - 使用调试日志定位导入失败的具体原因
   - 根据错误提示调整 Excel 文件

3. **更新 API 代码**（下一步）：
   - 修改所有涉及学生分数的 API
   - 确保使用新的 `student_semester_scores` 表

---

## 快速诊断检查表

| 检查项 | 方法 |
|--------|------|
| 后端是否运行 | 在 Apifox 中调用"管理员登录" |
| 班级是否存在 | 在 Apifox 中调用"获取班级列表" |
| 数据库表是否创建 | `mysql > SHOW TABLES;` |
| 新表是否存在 | `mysql > DESC student_semester_scores;` |
| 学期数据 | `mysql > SELECT * FROM semesters;` |

---

## 需要帮助？

如果导入仍然失败：

1. **查看后端控制台输出**，找出具体错误信息
2. **检查 Apifox 中的请求**：
   - 确保使用 `form-data` 格式
   - `file` 字段的 `Type` 设置为 `File`
   - 选择的 token 是否正确（admin token）
3. **提供以下信息给我**：
   - 后端控制台输出中关于文件的日志
   - Excel 文件的列名和前两行数据
   - 当前数据库中的班级列表

