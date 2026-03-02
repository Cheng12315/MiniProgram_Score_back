# ✅ 密码问题已完全解决

## 问题分析

### 🔍 根本原因
之前提供的密码哈希值 **`$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxm6`** 是**错误的**！

测试结果显示这个哈希值与密码 `admin123` 不匹配。

### ✅ 解决方案
已生成新的正确的密码哈希值：
```
$2a$10$sBhLa4hBLQXXVtbAqRNcVODXnrSeTaCcxUpzNPudBq1MzmbtwIvUi
```

这个哈希值已经成功更新到数据库中。

---

## ✅ 现在的状态

### 后端
- ✅ 服务器已启动并连接到 MySQL
- ✅ 监听端口 3000

### 数据库
- ✅ 管理员账户存在：`admin`
- ✅ 密码哈希值已更新为正确的值
- ✅ 密码验证通过

### 登录凭证
```
用户名: admin
密码: admin123
```

---

## 🧪 现在在 Apifox 中测试

### 步骤 1：确保后端正在运行
在浏览器中打开：
```
http://localhost:3000/health
```

应该看到：
```json
{
  "status": "ok",
  "timestamp": "..."
}
```

### 步骤 2：在 Apifox 中创建登录请求

**请求设置**：
```
名称: 管理员登录
方法: POST
URL: http://localhost:3000/api/auth/admin/login
```

**Body（选择 raw JSON）**：
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### 步骤 3：点击 Send 发送请求

**这次应该看到成功响应**：
```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "Admin"
    }
  }
}
```

---

## 🎯 如果还是不行

### 检查清单

- [ ] 确认后端服务正在运行（看终端窗口是否有 "服务器启动成功"）
- [ ] 确认 URL 正确（`http://localhost:3000/api/auth/admin/login`）
- [ ] 确认用户名是 `admin`（全小写）
- [ ] 确认密码是 `admin123`（无空格）
- [ ] 在 MySQL 中验证密码哈希值：
  ```sql
  SELECT password FROM admins WHERE username='admin';
  ```
  应该看到：`$2a$10$sBhLa4hBLQXXVtbAqRNcVODXnrSeTaCcxUpzNPudBq1MzmbtwIvUi`

### 如果密码哈希值不对

运行以下命令更新：
```bash
mysql -u root -p123456 < update_password.sql
```

然后重启后端：
1. 停止 `npm run dev`（按 Ctrl + C）
2. 重新运行 `npm run dev`

---

## 📊 生成密码哈希值的方式

如果你以后需要修改管理员密码，可以：

### 方法 1：使用 test_password.js
```bash
node test_password.js
```

输出中会显示新的哈希值，然后：
```bash
mysql -u root -p123456 -e "USE score_management; UPDATE admins SET password='<新哈希值>' WHERE username='admin';"
```

### 方法 2：在 Node.js 中生成
```javascript
const bcrypt = require('bcryptjs');

bcrypt.hash('新密码', 10).then(hash => {
  console.log(hash);
});
```

### 方法 3：在 MySQL 中直接验证
```sql
-- 验证密码是否正确（在 MySQL 中无法直接做，需要在代码中验证）
SELECT password FROM admins WHERE username='admin';
```

---

## 🎉 现在可以进行下一步了！

登录成功后，你应该：

1. ✅ 获取并保存 `token`
2. ✅ 使用 token 测试其他 API（添加 Header：`Authorization: Bearer <token>`）
3. ✅ 按照 `APIFOX_QUICK_GUIDE.md` 中的测试清单继续

---

## 相关文件

- `test_password.js` - 测试和生成密码哈希的脚本
- `update_password.sql` - 更新密码的 SQL 脚本
- `APIFOX_QUICK_GUIDE.md` - Apifox 快速指南
- `APIFOX_TUTORIAL.md` - 详细教程

---

**祝登录成功！如果还有任何问题，告诉我！** 🚀
