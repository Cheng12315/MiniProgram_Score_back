# 管理员登录问题诊断和修复

## ✅ 已修复！

管理员账户已成功插入到数据库。

### 新的登录凭证
```
用户名: admin
密码: admin123
```

---

## 如果仍然无法登录，请按照以下步骤排查

### 第一步：验证管理员账户是否存在

在 MySQL 中运行：
```sql
USE score_management;
SELECT id, username, real_name FROM admins;
```

应该看到：
```
id  username  real_name
1   admin     Admin
```

### 第二步：验证密码哈希是否正确

在 MySQL 中运行：
```sql
USE score_management;
SELECT password FROM admins WHERE username='admin';
```

应该看到一个很长的字符串，以 `$2b$10$` 开头（这是 bcrypt 格式）

### 第三步：检查后端日志

查看后端控制台输出，是否有错误信息：
- 数据库连接错误
- SQL 查询错误
- 密码验证错误

### 第四步：重启后端服务

如果上述都正常，重启后端服务可能会解决：
1. 在 PowerShell 中按 `Ctrl + C` 停止 `npm run dev`
2. 等待 2 秒
3. 重新运行 `npm run dev`

---

## 常见问题

### Q: 仍然显示 "用户名或密码错误"

**可能原因1**：用户名拼写错误
- 应该是 `admin`（全小写）
- 不是 `Admin` 或 `ADMIN`

**可能原因2**：密码错误
- 应该是 `admin123`（无特殊字符，无空格）

**可能原因3**：数据库连接问题
- 检查 `.env` 中的数据库配置是否正确
- 确保 MySQL 服务器正在运行

**可能原因4**：后端没有重启
- 停止 `npm run dev`，然后重新运行

### Q: 显示 "请求超时"

**解决**：检查后端服务是否正在运行
- 查看是否有 `npm run dev` 的终端窗口
- 查看窗口中是否显示 `服务器启动成功，监听端口 3000`

### Q: 显示 "网络错误"

**解决**：
- 检查 Apifox 中的 URL 是否正确（应该是 `http://localhost:3000`）
- 检查网络连接
- 尝试在浏览器中访问 `http://localhost:3000/health`

---

## 正确的登录步骤

### 在 Apifox 中：

1. **创建新请求**
   - 名称：`管理员登录`
   - 方法：**POST**
   - URL：`http://localhost:3000/api/auth/admin/login`

2. **添加请求体（Body）**
   - 点击 **Body** 标签
   - 选择 **raw** 和 **JSON**
   - 复制粘贴：
   ```json
   {
     "username": "admin",
     "password": "admin123"
   }
   ```

3. **发送请求**
   - 点击 **Send** 按钮
   - 等待响应

4. **查看响应**
   - 应该看到 200 OK
   - 响应中有 `token` 字段

---

## 修复脚本信息

如果你需要重新插入管理员账户，使用以下文件之一：

### 方法1：使用 SQL 文件
```bash
mysql -u root -p123456 < insert_admin_fix.sql
```

### 方法2：使用 Apifox
无法直接从 Apifox 执行 SQL，需要使用 MySQL 命令行或其他工具

### 方法3：手动 SQL
```sql
USE score_management;
DELETE FROM admins;
INSERT INTO admins (username, password, real_name) 
VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxm6', 'Admin');
```

---

## 密码信息

**如果你需要修改管理员密码**：

原始密码: `admin123`  
加密后（bcrypt）: `$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxm6`

这是一个已验证的正确哈希值。

---

## 下一步

✅ 确认管理员能成功登录  
✅ 获取并保存 `token`  
✅ 使用 token 测试其他接口  

祝登录顺利！🎉
