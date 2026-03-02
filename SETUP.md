# 德育积分管理系统 - 部署配置指南

## 第一步：安装 Node.js 和 MySQL

### Windows系统

#### 安装 Node.js
1. 访问 https://nodejs.org/ 下载 LTS 版本
2. 运行安装程序，选择默认安装路径
3. 验证安装：
   ```bash
   node --version
   npm --version
   ```

#### 安装 MySQL
1. 访问 https://dev.mysql.com/downloads/mysql/ 下载社区版
2. 选择 Windows 版本，下载 MSI 安装程序
3. 运行安装程序，按照向导完成安装
4. 在配置阶段：
   - 选择 "Standalone MySQL Server / Classic MySQL Server"
   - 端口设置为 3306
   - MySQL Root Password 设置为你的密码（123456）
5. 完成安装

验证 MySQL 安装：
```bash
mysql --version
```

## 第二步：项目初始化

### 1. 进入项目目录
```bash
cd D:\ScoreManagement_back
```

### 2. 安装项目依赖
```bash
npm install
```

这会根据 `package.json` 安装所有必需的包。

### 3. 初始化数据库

#### 方式一：命令行方式（推荐）

```bash
# 打开 PowerShell 并进入项目目录
cd D:\ScoreManagement_back

# 使用 MySQL 命令行执行脚本
mysql -u root -p < database.sql
```

提示输入密码时，输入你在安装 MySQL 时设置的 Root 密码。

#### 方式二：MySQL Workbench 方式

1. 打开 MySQL Workbench
2. 连接到本地 MySQL 服务器
3. File → Open SQL Script → 选择 `database.sql`
4. 点击执行按钮（闪电图标）
5. 等待执行完成

#### 验证数据库初始化

```bash
mysql -u root -p -e "USE score_management; SHOW TABLES;"
```

你应该能看到以下表：
- admins
- classes
- operation_logs
- score_records
- semesters
- students
- teachers

### 4. 配置环境变量

编辑 `.env` 文件，根据你的 MySQL 配置修改：

```env
DB_HOST=localhost          # MySQL 服务器地址
DB_USER=root              # MySQL 用户名
DB_PASSWORD=你的密码       # MySQL 密码
DB_NAME=score_management   # 数据库名称
DB_PORT=3306              # MySQL 端口

PORT=3000                 # Node.js 服务器端口
NODE_ENV=development      # 环境

JWT_SECRET=score_management_dev_secret_key_2024  # JWT 密钥
JWT_EXPIRE=7d             # Token 过期时间

UPLOAD_DIR=uploads        # 上传文件目录
MAX_FILE_SIZE=5242880     # 最大上传文件大小（5MB）
```

## 第三步：启动服务器

### 开发模式（推荐）

```bash
npm run dev
```

你会看到类似的输出：
```
✓ MySQL 数据库连接成功
服务器启动成功，监听端口 3000
环境: development
```

### 生产模式

```bash
npm start
```

## 第四步：测试 API

### 使用 Postman 或 curl 测试

#### 测试数据库连接
```bash
curl http://localhost:3000/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-02-28T10:30:00.000Z"
}
```

#### 测试管理员登录
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

**注意**：初始默认密码是 `admin123`，**必须在部署到生产环境前修改**。

### 修改默认管理员密码

1. 使用 Node.js 生成新的 bcrypt 哈希密码：

```bash
node
# 进入 Node.js REPL
const bcrypt = require('bcryptjs');
bcrypt.hash('你的新密码', 10).then(hash => console.log(hash));
# 复制输出的哈希值
```

2. 更新数据库：

```bash
mysql -u root -p
USE score_management;
UPDATE admins SET password='粘贴哈希值' WHERE username='admin';
EXIT;
```

## 常见问题排查

### 问题 1：MySQL 连接失败

**错误信息**：`✗ MySQL 数据库连接失败: connect ECONNREFUSED 127.0.0.1:3306`

**解决方案**：
1. 检查 MySQL 服务是否运行
2. 确认 `.env` 中的数据库凭证正确
3. 检查 MySQL 是否监听 3306 端口

```bash
# Windows: 检查 MySQL 服务状态
wmic service where name="MySQL80" get state
```

### 问题 2：端口 3000 已被占用

**错误信息**：`listen EADDRINUSE: address already in use :::3000`

**解决方案**：

方法A：更改端口（在 `.env` 中修改 `PORT`）

方法B：关闭占用该端口的程序
```bash
# Windows: 查找占用 3000 端口的进程
netstat -ano | findstr :3000

# 结束该进程（替换 PID）
taskkill /PID <PID> /F
```

### 问题 3：文件上传失败

检查上传目录权限：
```bash
# 创建 uploads 目录（如果不存在）
mkdir uploads
```

### 问题 4：JWT 认证失败

**错误**：`无效的token` 或 `缺少认证token`

**解决方案**：
1. 确保在请求头中包含 token：
   ```
   Authorization: Bearer <your_token>
   ```
2. 检查 token 是否过期
3. 重新登录获取新 token

## 使用 PM2 进行生产部署

### 安装 PM2
```bash
npm install -g pm2
```

### 启动应用
```bash
pm2 start server.js --name "score-management"
```

### 查看日志
```bash
pm2 logs score-management
```

### 重启应用
```bash
pm2 restart score-management
```

### 开机自启
```bash
pm2 startup
pm2 save
```

## 数据库备份和恢复

### 备份数据库
```bash
mysqldump -u root -p score_management > backup_score_management.sql
```

### 恢复数据库
```bash
mysql -u root -p score_management < backup_score_management.sql
```

## 部署到云服务器

### 推荐方案：阿里云或腾讯云 + 宝塔面板

1. **购买云服务器**（推荐配置：2核4G）
2. **安装宝塔面板**
3. **在宝塔中**：
   - 安装 Node.js 14+
   - 安装 MySQL 8.0
   - 新建网站，设置为 Node.js 应用
   - 上传项目代码
   - 配置 SSL 证书（HTTPS）
   - 设置反向代理

### 环境变量配置

在云服务器上，修改 `.env`：

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=你的强密码
DB_NAME=score_management
DB_PORT=3306

PORT=3000
NODE_ENV=production

JWT_SECRET=生成一个长且随机的密钥
JWT_EXPIRE=7d

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

### Nginx 反向代理配置

```nginx
server {
  listen 80;
  server_name your-domain.com;
  
  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
  }
}
```

## 监控和日志

### 查看应用日志
```bash
# 开发环境
npm run dev

# 查看 Morgan 日志（HTTP 请求日志）会在控制台输出
```

### 错误排查

1. 检查 MySQL 服务状态
2. 查看 Node.js 进程是否运行
3. 检查防火墙是否阻止端口
4. 查看 `.env` 配置是否正确

## 下一步

后端服务器启动成功后，接下来需要：

1. 开发管理后台前端（React/Vue）
2. 修改小程序前端配置，连接后端 API
3. 进行本地集成测试
4. 部署到云服务器

祝你的项目顺利上线！
