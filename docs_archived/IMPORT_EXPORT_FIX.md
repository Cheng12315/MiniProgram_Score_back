# 导入/导出功能修复指南

## 🔧 已修复的问题

### 问题 1：导入失败 - 后端现已修复

**原问题**：后端严格要求 Excel 列名为中文（`姓名`、`学号`、`班级`、`性别`）

**修复**：后端现已更新，支持以下列名形式：
- **中文列名**：`姓名`、`学号`、`班级`、`性别` ✓
- **英文列名**：`name`、`student_number`、`class`、`gender` ✓
- **英文大写**：`Name`、`Student Number`、`Class`、`Gender` ✓

**后端代码更改**：
- 文件：`routes/admin.js` 和 `routes/teacher.js`
- 更改内容：添加灵活的列名识别逻辑

---

## 📋 导入文件的正确格式

### ✅ 方式 1：使用中文列名（推荐）

创建 Excel 文件，第一行为列名：

```
姓名      学号        班级          性别
李白      2022006     8年级1班      M
杜甫      2022007     8年级1班      F
```

### ✅ 方式 2：使用英文列名

```
name              student_number    class           gender
Li Bai            2022006          8年级1班        M
Du Fu             2022007          8年级1班        F
```

### ✅ 方式 3：使用混合列名

```
姓名        student_number    班级          Gender
白居易      2022006          8年级1班      M
李贺        2022007          8年级1班      F
```

---

## 🧪 在 Apifox 中上传文件的完整步骤

### 第一步：创建 Excel 文件

创建一个 Excel 文件（例如 `students_import.xlsx`）：

| 姓名 | 学号 | 班级 | 性别 |
|------|------|------|------|
| 李白 | 2022006 | 8年级1班 | M |
| 杜甫 | 2022007 | 8年级1班 | F |

**保存为**：`students_import.xlsx`

### 第二步：打开 Apifox

### 第三步：创建 POST 请求

```
方法: POST
URL: http://localhost:3000/api/admin/students/import
```

### 第四步：添加认证 Header

```
Header 标签：
Key: Authorization
Value: Bearer <管理员token>
```

### 第五步：配置 Body（关键！）

**✅ 正确方式**：

1. 点击 **Body** 标签
2. 选择 **form-data** 选项（单选框勾选）
3. 添加一行：
   ```
   Key:    file
   Type:   File      ← 关键！必须选择 File
   Value:  [点击选择文件] → 选择 students_import.xlsx
   ```

4. **点击 Send 发送请求**

### 第六步：查看响应

**成功响应**：
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

---

## 📍 可选参数的使用位置

### 问题 2：可选参数写在哪里

**答**：可选参数放在 **URL 后面**，使用 `?` 开头，多个参数用 `&` 连接

### 示例

#### 导出学生总分（管理员）

```
基础 URL: http://localhost:3000/api/admin/export/students

添加参数：
http://localhost:3000/api/admin/export/students?classId=5
http://localhost:3000/api/admin/export/students?classId=5&semesterId=4
```

#### 导出积分记录（班主任）

```
基础 URL: http://localhost:3000/api/teacher/export/records

添加参数：
http://localhost:3000/api/teacher/export/records?studentId=1
http://localhost:3000/api/teacher/export/records?studentId=1&semesterId=4
```

#### 导出积分记录（管理员）

```
基础 URL: http://localhost:3000/api/admin/export/records

添加参数：
http://localhost:3000/api/admin/export/records?classId=5
http://localhost:3000/api/admin/export/records?classId=5&studentId=1
http://localhost:3000/api/admin/export/records?classId=5&studentId=1&semesterId=4
```

### 在 Apifox 中添加参数的两种方式

#### 方式 A：直接在 URL 中写（简单）

```
URL 输入框中：
http://localhost:3000/api/admin/export/students?classId=5&semesterId=4
```

#### 方式 B：使用 Params 标签（推荐）

1. 点击 **Params** 标签
2. 添加参数行：
   ```
   Key:     classId
   Value:   5
   
   Key:     semesterId
   Value:   4
   ```
3. Apifox 会自动拼接到 URL

---

## 📊 关于管理员导出学生总分的 semesterId 参数

### 问题 3：管理员导出学生总分是否需要 semesterId 参数

**答**：技术上支持，但功能上无用。解释如下：

#### 学生总分的特点
- **学生的 `current_score` 字段存储的是当前总分**，不分学期
- 这个总分是跨学期累计的（不会因为学期而变化）

#### 与积分记录的区别
- **积分记录** (`score_records`表) **与学期相关**
  - 可以按学期筛选积分操作
  - 用于查看特定学期内发生了什么积分变动

- **学生总分** (`students`表的`current_score`) **与学期无关**
  - 是学生的当前总分，不会按学期分割
  - 导出时按 `classId` 筛选就够了

#### 推荐用法

```
导出学生总分：
http://localhost:3000/api/admin/export/students?classId=5

导出积分操作记录（可按学期筛选）：
http://localhost:3000/api/admin/export/records?classId=5&semesterId=4
```

#### 后端说明

虽然 API 接受 `semesterId` 参数，但实际上会被忽略，因为学生总分与学期无关。

---

## ✅ 完整的剩余测试列表

根据修复后的代码，现在重新测试这些接口：

### 测试 1：管理员导入学生数据 ✅

```
URL: POST http://localhost:3000/api/admin/students/import
Header: Authorization: Bearer <管理员token>
Body: form-data，Key=file，Type=File，选择你的 Excel 文件
```

**预期**：导入成功

### 测试 2：班主任导入学生数据 ✅

```
URL: POST http://localhost:3000/api/teacher/students/import
Header: Authorization: Bearer <班主任token>
Body: form-data，Key=file，Type=File，选择你的 Excel 文件
```

**预期**：导入成功

### 测试 3：管理员导出学生总分

```
URL: GET http://localhost:3000/api/admin/export/students?classId=5
Header: Authorization: Bearer <管理员token>
```

**预期**：返回 Excel 文件内容（XML 格式）

### 测试 4：管理员导出积分记录

```
URL: GET http://localhost:3000/api/admin/export/records?classId=5&semesterId=4
Header: Authorization: Bearer <管理员token>
```

**预期**：返回包含积分记录的 Excel 内容

### 测试 5：班主任导出学生总分

```
URL: GET http://localhost:3000/api/teacher/export/scores
Header: Authorization: Bearer <班主任token>
```

**预期**：返回 Excel 文件内容

### 测试 6：班主任导出积分记录

```
URL: GET http://localhost:3000/api/teacher/export/records
Header: Authorization: Bearer <班主任token>
```

**预期**：返回包含积分记录的 Excel 内容

---

## 🎯 立即尝试

### 立即行动

现在后端已修复，请重新尝试导入文件，使用以下步骤：

1. ✅ 创建 Excel 文件（中文列名最简单）
2. ✅ 在 Apifox 中配置 POST 请求
3. ✅ **Body 选择 form-data**（这是之前失败的原因！）
4. ✅ **Key=file，Type=File**（两个都很关键）
5. ✅ 选择你的 Excel 文件并点击 Send

**这次应该会成功！** ✅

---

## 💡 故障排除

### 如果还是失败

检查以下几点：

1. **Body 类型是否正确？**
   - ✓ form-data （正确）
   - ✗ raw （错误）
   - ✗ x-www-form-urlencoded （错误）

2. **文件字段配置是否正确？**
   - Key: `file` （准确拼写）
   - Type: `File` （不是 Text！）
   - Value: 实际选择的文件

3. **Header 是否正确？**
   - Authorization: `Bearer <token>`

4. **Excel 文件是否有正确的列名？**
   - 支持：`姓名`, `学号`, `班级`, `性别`
   - 或：`name`, `student_number`, `class`, `gender`

5. **Token 是否有效？**
   - 从登录响应中复制
   - 不要遗漏 `Bearer ` 前缀

---

**祝测试顺利！** 🚀
