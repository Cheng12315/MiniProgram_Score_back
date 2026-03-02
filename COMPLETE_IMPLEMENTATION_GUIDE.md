# 完整实施指南：导入调试 + 学期分数重置

## 第一部分：导入失败排查

### 问题：导入返回"导入失败，请检查文件格式"

你已经按照提示执行，但仍然收到错误，这说明需要更深入的调试。我已经更新了后端代码，添加了详细的日志输出。

### 快速修复步骤

#### 步骤 1：重启后端服务

```bash
# 停止当前服务（按 Ctrl+C）
# 然后重新启动
npm run dev
```

#### 步骤 2：准备测试 Excel 文件

创建一个最小化的 Excel 文件进行测试：

| 姓名 | 学号 | 班级 | 性别 |
|------|------|------|------|
| 测试一 | 001 | 8年级1班 | 男 |
| 测试二 | 002 | 8年级1班 | 女 |

**重要**：
- 确保班级名与数据库中的班级完全一致
- 性别只能是：`男`, `女`, `其他` 或 `M`, `F`, `Other`
- 学号必须是数字或字母，不能有特殊字符
- 文件必须以 `.xlsx` 格式保存（不是 `.xls` 或其他格式）

#### 步骤 3：在 Apifox 中上传文件

1. 新建请求：`POST /api/admin/students/import`（或 `/api/teacher/students/import`）
2. 在 `Body` 标签中选择 `form-data`
3. 添加字段：
   - **Key**: `file`
   - **Type**: 选择 `File`
   - **Value**: 选择你的 Excel 文件
4. 添加 token（Bearer token）
5. 点击 `Send` 发送请求

#### 步骤 4：查看后端日志

你应该在后端终端看到类似的输出：

**成功情况**：
```
上传的文件: 1706800000000-students.xlsx 大小: 1024 类型: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
读取的行数: 2
第一行数据: { '姓名': '测试一', '学号': '001', '班级': '8年级1班', '性别': '男' }
```

**失败情况 1（文件格式错误）**：
```
上传的文件: 1706800000000-students.xlsx 大小: 1024 类型: ...
读取 Excel 文件失败: Error: File is not a valid Excel file
```
→ **解决**：文件不是有效的 xlsx 格式，重新用 Microsoft Excel 保存

**失败情况 2（没有数据行）**：
```
上传的文件: 1706800000000-students.xlsx 大小: 512 类型: ...
读取的行数: 0
读取的列名: { 'A1': { t: 's', v: '姓名' }, ... }
```
→ **解决**：Excel 文件没有实际数据，只有表头。请确保有数据行。

**失败情况 3（班级不存在）**：
```
上传的文件: 1706800000000-students.xlsx 大小: 1024 类型: ...
读取的行数: 2
第一行数据: { '姓名': '测试一', '学号': '001', '班级': '高一1班', '性别': '男' }
...（导入过程中）
```
→ **查看 Apifox 返回**：会显示 `第1行: 班级"高一1班"不存在`
→ **解决**：在 Apifox 中调用"获取班级列表"，确认班级名称，调整 Excel

---

### 诊断检查清单

使用此清单快速找出问题：

| 检查项 | 方法 | 预期结果 |
|--------|------|----------|
| 后端运行 | 在 Apifox 中调用"管理员登录" | `code: 0` |
| 班级存在 | 在 Apifox 中调用"获取班级列表" | 能看到班级列表 |
| Excel 格式 | 用 Microsoft Excel 打开 | 能正常打开 |
| Excel 数据 | 检查是否有表头之外的数据行 | 至少 1 行数据 |
| 班级名匹配 | 对比 Excel 和数据库中的班级名 | 完全相同 |
| 性别格式 | 检查 Excel 中的性别值 | 只有 `男`, `女`, `其他` 或 `M`, `F`, `Other` |
| 学号格式 | 检查 Excel 中的学号 | 字母数字，无特殊字符 |

---

### 常见错误的具体解决方案

#### 错误 1：班级不存在
```json
{
  "code": 0,
  "message": "导入完成",
  "data": {
    "errors": ["第2行: 班级\"高一1班\"不存在"]
  }
}
```

**原因**：Excel 中的班级名与数据库不符  
**解决**：
1. 在 Apifox 调用"获取班级列表"，记下准确的班级名
2. 修改 Excel，使班级名完全相同
3. 重新导入

#### 错误 2：性别格式不对
```json
{
  "code": 0,
  "message": "导入完成",
  "data": {
    "errors": ["第2行: 性别值不合法，只支持: 男, 女, 其他, M, F, Other"]
  }
}
```

**原因**：性别使用了不支持的格式  
**解决**：
- 只使用：`男`, `女`, `其他` 或 `M`, `F`, `Other`
- 不要使用：`男性`, `female`, `1`, `0` 等

#### 错误 3：学号重复但不想覆盖
```json
{
  "code": 0,
  "message": "导入完成",
  "data": {
    "successCount": {
      "added": 0,
      "updated": 1
    }
  }
}
```

**说明**：系统设计为学号重复时会覆盖，这是预期行为  
**如果要避免**：导入前先检查学号是否已存在

---

## 第二部分：学期总分重置实施

### 核心概念

每个学期的学生总分从 100 开始，彼此独立。

**示例**：
```
2024春学期：
- 张三：100 → 加 5 分 → 105 分

2024秋学期（新学期）：
- 张三：100（重新开始！）→ 加 3 分 → 103 分
```

### 实施步骤

#### 步骤 1：更新数据库

在 MySQL 中执行：
```bash
mysql -u root -p123456 score_management < database.sql
```

验证新表：
```bash
mysql -u root -p123456 -e "DESC score_management.student_semester_scores;"
```

#### 步骤 2：初始化数据

运行迁移脚本：
```bash
node migrate_semester_scores.js
```

**预期输出**：
```
开始迁移数据...
找到 X 个学生和 Y 个学期
迁移完成！插入 X*Y 条记录，跳过 0 条重复记录
```

#### 步骤 3：重启后端

```bash
# 按 Ctrl+C 停止
# 重新启动
npm run dev
```

#### 步骤 4：测试 API

##### 测试 4.1：添加积分（包括学期参数）

**Apifox 请求**：
```
POST /api/teacher/scores

Body (JSON):
{
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
    "recordId": 123,
    "newScore": 105,
    "semesterScore": 105
  }
}
```

##### 测试 4.2：按学期查询学生分数

**Apifox 请求**：
```
GET /api/teacher/students?semesterId=2&page=1&pageSize=10
```

**预期返回**：
```json
{
  "code": 0,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "张三",
        "student_number": "001",
        "current_score": 98.50,
        "semester_score": 105.00
      }
    ]
  }
}
```

##### 测试 4.3：导出该学期的总分

**Apifox 请求**：
```
GET /api/teacher/export/scores?semesterId=2
```

**预期**：下载 Excel 文件，显示该学期的分数（从 100 开始）

---

## 第三部分：综合测试（推荐流程）

### 完整测试场景

假设你有：
- 班级：`8年级1班`
- 学期：`2024春`、`2024秋`
- 学生：`张三`（学号 001）

### 测试步骤

#### 1. 导入学生数据

```
POST /api/admin/students/import

上传 Excel 文件包含：
- 张三, 001, 8年级1班, 男
```

**验证**：
- Apifox 返回 `导入完成`
- 后端日志显示正确的行数和数据

#### 2. 查看班级学生

```
GET /api/teacher/students?semesterId=1
```

**验证**：
- 能看到张三
- `current_score` 显示 100（初始值）
- `semester_score` 显示 100

#### 3. 在 2024春学期添加积分

```
POST /api/teacher/scores

{
  "studentId": 1,
  "semesterId": 1,
  "scoreChange": 5,
  "reason": "表现良好"
}
```

**验证**：
- 返回 `semesterScore: 105`
- 数据库中 `student_semester_scores` 有对应记录

#### 4. 再次查看学生（同学期）

```
GET /api/teacher/students?semesterId=1
```

**验证**：
- `semester_score` 现在显示 105

#### 5. 查看不同学期

```
GET /api/teacher/students?semesterId=2
```

**验证**：
- `semester_score` 显示 100（新学期重新开始）
- 与第一个学期的 105 不同

#### 6. 导出不同学期的数据

```
# 导出 2024春
GET /api/teacher/export/scores?semesterId=1

# 导出 2024秋
GET /api/teacher/export/scores?semesterId=2
```

**验证**：
- 两个导出的 Excel 文件中张三的分数不同
- 2024春：105
- 2024秋：100

---

## 第四部分：常见问题解答

### Q1：导入还是失败，后端没有日志输出怎么办？

**原因**：可能后端没有重启，还在运行旧代码  
**解决**：
1. 按 `Ctrl+C` 停止服务
2. 运行 `npm run dev` 重新启动
3. 确保看到 `Server running on port 3000` 的输出

### Q2：后端报错"找不到 student_semester_scores 表"

**原因**：数据库没有执行新的 `database.sql`  
**解决**：
1. 在 MySQL 中执行 `database.sql`
2. 运行 `node migrate_semester_scores.js`

### Q3：导入时部分行成功，部分行失败，怎么处理？

**这是预期行为**，系统会返回：
```json
{
  "successCount": {
    "added": 3,
    "updated": 1
  },
  "errors": [
    "第5行: 班级\"未知班级\"不存在",
    "第7行: 学号格式不正确"
  ]
}
```

**处理**：
- 根据错误信息修改 Excel 中的这几行
- 重新导入（成功的行会被覆盖或跳过，不会重复）

### Q4：学期分数和当前分数（current_score）有什么区别？

| 字段 | 位置 | 含义 | 使用场景 |
|------|------|------|----------|
| `semester_score` | student_semester_scores | 该学期的分数 | 本学期操作、导出本学期数据 |
| `current_score` | students | 跨学期累计分数 | 历史统计、不指定学期时的查询 |

### Q5：已有的学生数据如何处理学期分数？

迁移脚本会为所有现有学生的所有学期创建初始分数记录（都是 100）。如果你想恢复历史分数，需要：

```sql
UPDATE student_semester_scores 
SET total_score = (
  SELECT COALESCE(SUM(score_change), 0) + 100
  FROM score_records
  WHERE student_id = student_semester_scores.student_id
    AND semester_id = student_semester_scores.semester_id
)
WHERE 1=1;
```

---

## 总结

**三个核心改动**：

1. **导入调试**：添加了详细日志，查看后端输出确认文件是否正确读取
2. **学期分数**：新增 `student_semester_scores` 表，每个学期分数独立（从 100 开始）
3. **API 兼容**：所有 API 都支持可选的 `semesterId` 参数

**立即行动**：

1. 重启后端服务（`npm run dev`）
2. 尝试导入最小化的 Excel 文件（2-3 行数据）
3. 查看后端日志找出问题
4. 根据此文档的排查清单修改 Excel
5. 更新数据库并运行迁移脚本

