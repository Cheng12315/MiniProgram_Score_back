# 快速修复指南（5 分钟上手）

## 问题 1：导入失败

### 你遇到的错误
```json
{
  "code": -1,
  "message": "导入失败，请检查文件格式",
  "data": null
}
```

### 快速修复（3 步）

#### 1️⃣ 重启后端
```bash
# 在后端终端按 Ctrl+C
# 然后运行
npm run dev
```

#### 2️⃣ 创建最小化 Excel 进行测试
创建包含以下内容的 Excel 文件 (`test.xlsx`)：

```
姓名      学号    班级        性别
测试一    001    8年级1班    男
```

保存为 `.xlsx` 格式（**很重要！**）

#### 3️⃣ 在 Apifox 中上传

- URL: `POST http://localhost:3000/api/admin/students/import`
- Body: `form-data` → `file` (Type: File) → 选择 `test.xlsx`
- 添加 Admin Token
- 点击 Send

### 查看后端日志

你应该看到类似的输出：
```
上传的文件: 1706800000000-test.xlsx 大小: 1024 类型: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
读取的行数: 1
第一行数据: { '姓名': '测试一', '学号': '001', '班级': '8年级1班', '性别': '男' }
```

#### ✅ 成功迹象
- Apifox 返回 `导入完成`
- 后端显示 `读取的行数: 1`
- 后端显示第一行数据

#### ❌ 失败迹象及解决

| 日志输出 | 原因 | 解决 |
|---------|------|------|
| `读取 Excel 文件失败` | 文件不是 xlsx | 用 Excel 重新保存为 xlsx |
| `读取的行数: 0` | 没有数据行 | Excel 要有表头下面的数据 |
| `班级不存在` | 班级名不匹配 | 在 Apifox 调用"获取班级列表"，用正确的班级名 |

---

## 问题 2：学期总分重置

### 需求说明
> 学生的总分在新学期开始时会从 100 重新开始，而不是在上个学期总分基础上变化。

### 快速实施（5 步）

#### 1️⃣ 更新数据库
```bash
mysql -u root -p123456 score_management < database.sql
```

#### 2️⃣ 运行迁移脚本
```bash
node migrate_semester_scores.js
```

应该看到：
```
开始迁移数据...
找到 X 个学生和 Y 个学期
迁移完成！插入 X*Y 条记录，跳过 0 条重复记录
```

#### 3️⃣ 重启后端
```bash
npm run dev
```

#### 4️⃣ 测试添加积分

在 Apifox 中：
```
POST http://localhost:3000/api/teacher/scores

Body (JSON):
{
  "studentId": 1,
  "semesterId": 2,
  "scoreChange": 5,
  "reason": "表现良好"
}
```

预期返回：
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

#### 5️⃣ 测试按学期查询

```
GET http://localhost:3000/api/teacher/students?semesterId=2
```

应该看到：
```json
{
  "items": [
    {
      "id": 1,
      "name": "张三",
      "semester_score": 105,
      ...
    }
  ]
}
```

### ✅ 验证成功

- [ ] 后端显示迁移成功日志
- [ ] 添加积分返回 `semesterScore` 字段
- [ ] 按学期查询返回 `semester_score`
- [ ] 不同学期的分数不同

---

## 快速检查清单

在执行上面的步骤前，检查：

- [ ] 后端服务正在运行（`npm run dev`）
- [ ] MySQL 服务正在运行（`mysql -u root -p123456 -e "SELECT 1;"`）
- [ ] 数据库存在（`mysql -u root -p123456 -e "USE score_management; SHOW TABLES;"`）
- [ ] 班级数据已插入（`mysql -u root -p123456 -e "SELECT * FROM score_management.classes;"`）

---

## 遇到问题？

### 导入仍然失败？

1. **确保班级存在**
   ```bash
   mysql -u root -p123456 -e "SELECT class_name FROM score_management.classes;"
   ```

2. **确保 Excel 格式正确**
   - 打开 Excel → 另存为 → 选择 Excel 97-2003 或 Excel 2007-365
   - 确保是 `.xlsx` 或 `.xls`

3. **查看后端日志找线索**
   - 后端终端中的具体错误信息是关键

### 迁移脚本报错？

1. **确保新表已创建**
   ```bash
   mysql -u root -p123456 -e "DESC score_management.student_semester_scores;"
   ```

2. **检查数据库连接**
   ```bash
   # 修改 .env 文件确保数据库配置正确
   cat .env
   ```

3. **重新运行脚本**
   ```bash
   node migrate_semester_scores.js
   ```

### API 返回错误？

1. **检查 token 是否有效**
   - 在 Apifox 中重新登录获取新 token

2. **检查参数是否正确**
   - `studentId` 必须存在
   - `semesterId` 必须存在
   - 学生必须属于班主任的班级（teacher）

3. **查看后端日志**
   - 错误信息会显示在 `npm run dev` 的终端中

---

## 下一步

完成上面的快速修复后：

1. **导入完整数据**
   - 使用你的完整 Excel 文件进行导入
   - 查看日志中的错误信息并逐行修正

2. **测试完整流程**
   - 查看学生列表
   - 添加积分
   - 撤销操作
   - 导出数据

3. **前端集成**
   - 修改前端代码支持 `semesterId` 参数
   - 在学生列表页面添加学期选择

---

## 文档导航

- **详细导入调试**：`IMPORT_DEBUG_AND_SEMESTER_RESET.md`
- **学期实现细节**：`SEMESTER_RESET_IMPLEMENTATION.md`
- **完整实施流程**：`COMPLETE_IMPLEMENTATION_GUIDE.md`
- **所有变更总结**：`CHANGES_SUMMARY.md`

