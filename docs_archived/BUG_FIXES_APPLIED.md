# 两个 Bug 修复说明

## Bug 1：班主任积分操作返回"服务器错误"

### 问题
班主任执行以下操作时返回 500 服务器错误：
- 获取班级学生列表
- 积分操作
- 撤销积分记录

### 原因
获取学生列表的代码中，当指定 `semesterId` 参数时，SQL 查询参数处理有问题，导致 SQL 执行错误。

### 修复内容

**修改文件**：`routes/teacher.js` 第 40-99 行

**修复前的问题**：
- 参数数组在条件分支中处理不一致
- 当指定 `semesterId` 时，`countQuery` 的参数和 `dataQuery` 的参数混淆
- 导致 SQL 执行时参数绑定失败

**修复后**：
```javascript
// 改为统一管理参数数组
let countParams = [classId];
let dataParams = [];

if (semesterId) {
  dataParams = [parseInt(semesterId), classId];
} else {
  dataParams = [classId];
}

// 处理搜索参数
if (search) {
  countParams.push(searchTerm, searchTerm);
  dataParams.push(searchTerm, searchTerm);
}

// 执行查询时分别使用对应的参数数组
const [countRows] = await connection.query(countQuery, countParams);
const [students] = await connection.query(dataQuery, dataParams);
```

### 验证修复

重启后端后，以下操作应该正常：
1. `GET /api/teacher/students` - 返回学生列表
2. `GET /api/teacher/students?semesterId=2` - 返回指定学期的学生列表
3. `POST /api/teacher/scores` - 添加积分
4. `DELETE /api/teacher/score-records/:id` - 撤销积分

---

## Bug 2：班主任导入应该验证班级一致性

### 问题
班主任导入数据时，没有检查 Excel 中的班级是否与班主任所带班级一致。
- 班主任所带班级：`8年级1班`
- 上传的 Excel 全是：`242班`
- **结果**：没有报错，没有导入（这是错的，应该报错）

### 原因
班主任导入的代码直接使用班主任的 `classId` 插入所有学生，而不验证 Excel 中的班级信息是否与班主任的班级匹配。

### 修复内容

**修改文件**：`routes/teacher.js` 第 158-220 行

**修复前**：
```javascript
// 直接读取 Excel 数据，不验证班级
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const className = row['班级'] || row['class'] || row['Class'];
  
  // 不检查 className 是否与班主任班级一致
  // 直接使用 classId（班主任的班级 ID）插入
  await connection.query(
    'INSERT INTO students (name, student_number, class_id, gender, current_score) VALUES (?, ?, ?, ?, ?)',
    [cleanName, cleanStudentNumber, classId, cleanGender, 100]
  );
}
```

**修复后**：
```javascript
// 第一步：验证所有班级是否都与班主任班级一致
for (let i = 0; i < data.length; i++) {
  const row = data[i];
  const className = row['班级'] || row['class'] || row['Class'];
  const cleanClassName = String(className).trim();

  if (cleanClassName !== teacherClassName) {
    // 任何班级不匹配，立即拒绝整个导入
    await connection.rollback();
    connection.release();
    return res.status(400).json(errorResponse(
      `第${i + 2}行: 班级"${cleanClassName}"与你所带班级"${teacherClassName}"不匹配，班主任只能导入自己所带班级的学生`,
      -1
    ));
  }
}

// 第二步：所有班级验证通过，才开始导入
await connection.beginTransaction();
for (let i = 0; i < data.length; i++) {
  // ... 导入逻辑
}
```

### 修复的行为

现在班主任导入时：

**场景 1**：所有学生都属于班主任的班级
```
✅ 导入成功
```

**场景 2**：有任何学生不属于班主任的班级
```
❌ 返回错误：
{
  "code": -1,
  "message": "第2行: 班级\"242班\"与你所带班级\"8年级1班\"不匹配，班主任只能导入自己所带班级的学生"
}

整个导入被拒绝，不导入任何数据
```

### 验证修复

1. 创建一个与班主任班级不一致的 Excel 文件
2. 班主任上传该文件
3. 应该收到错误信息，指出具体行和班级不匹配的原因
4. 数据库中的学生数据不应该有任何改变

---

## 其他改进

### 3. 路由名称统一

**修改**：`POST /api/teacher/score-records` → `POST /api/teacher/scores`

这样与文档保持一致：
- 添加积分：`POST /api/teacher/scores`
- 查询积分记录：`GET /api/teacher/score-records`
- 撤销积分：`DELETE /api/teacher/score-records/:id`

---

## 立即应用修复

### 1. 重启后端服务

```bash
# 按 Ctrl+C 停止当前服务

# 重新启动
npm run dev
```

### 2. 验证修复

#### 测试班主任学生列表
```
GET http://localhost:3000/api/teacher/students
GET http://localhost:3000/api/teacher/students?semesterId=2
```

预期：返回成功，而不是 500 错误

#### 测试班主任导入
创建一个班级为 `242班` 的 Excel 文件（假设班主任所带班级是 `8年级1班`），上传时应该报错。

预期返回：
```json
{
  "code": -1,
  "message": "第2行: 班级\"242班\"与你所带班级\"8年级1班\"不匹配..."
}
```

#### 测试班主任积分操作
```
POST http://localhost:3000/api/teacher/scores
Body: {
  "studentId": 1,
  "semesterId": 2,
  "scoreChange": 5,
  "reason": "test"
}
```

预期：返回成功，包含 `semesterScore` 字段

#### 测试撤销积分
```
DELETE http://localhost:3000/api/teacher/score-records/123
```

预期：返回成功

---

## 修复总结

| Bug | 原因 | 修复 | 影响范围 |
|-----|------|------|---------|
| 班主任操作返回 500 | SQL 参数处理混乱 | 统一参数数组管理 | 班主任学生列表、积分操作 |
| 班主任导入无班级验证 | 没有检查班级匹配 | 添加班级一致性验证 | 班主任数据导入安全性 |
| 路由名称不统一 | 命名约定不一致 | 改为 `/scores` | 文档一致性 |

---

## 测试检查清单

修复后应该验证以下功能：

- [ ] 班主任获取学生列表（不指定学期）
- [ ] 班主任获取学生列表（指定学期）
- [ ] 班主任添加积分（返回 semesterScore）
- [ ] 班主任撤销积分
- [ ] 班主任导入自己班级的学生（成功）
- [ ] 班主任导入其他班级的学生（失败，报错）
- [ ] 班主任导出学生总分

所有操作都不应该返回"服务器错误"。

