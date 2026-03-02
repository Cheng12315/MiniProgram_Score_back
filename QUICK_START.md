# 快速开始指南

## 三步启动后端服务

### 第一步：初始化数据库
```bash
# 进入项目目录
cd D:\ScoreManagement_back

# 执行 SQL 脚本
mysql -u root -p < database.sql

# 系统会提示输入 MySQL 密码
```

### 第二步：安装依赖
```bash
npm install
```

### 第三步：启动开发服务器
```bash
npm run dev
```

✅ 如果看到这样的输出，说明成功了：
```
✓ MySQL 数据库连接成功
服务器启动成功，监听端口 3000
环境: development
```

---

## 测试默认账户

### 管理员账号
- 用户名：`admin`
- 密码：`admin123`
- **重要**：请立即修改此密码！

### 使用 curl 测试登录
```bash
curl -X POST http://localhost:3000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 常见命令速查

| 命令 | 说明 |
|------|------|
| `npm run dev` | 开发模式（自动重启） |
| `npm start` | 生产模式 |
| `npm test` | 运行测试 |

---

## 修改 MySQL 凭证

编辑 `.env` 文件：
```env
DB_HOST=localhost          # MySQL 服务器地址
DB_USER=root              # MySQL 用户名
DB_PASSWORD=你的密码       # MySQL 密码
DB_NAME=score_management   # 数据库名（不需要改）
DB_PORT=3306              # MySQL 端口（不需要改）
```

---

## 项目结构一览

```
📦 ScoreManagement_back
├── 📄 server.js              ← 应用启动入口
├── 📄 database.sql           ← 数据库初始化
├── 📄 package.json           ← 依赖配置
├── 📄 .env                   ← 环境变量（本地开发）
├── 📁 config/
│   └── database.js           ← 数据库连接
├── 📁 middleware/
│   └── auth.js               ← 权限认证
├── 📁 routes/
│   ├── auth.js               ← 登录接口
│   ├── teacher.js            ← 班主任 API
│   └── admin.js              ← 管理员 API
├── 📁 utils/
│   ├── validation.js         ← 数据验证
│   └── response.js           ← 响应格式
├── 📁 uploads/               ← 文件上传目录
└── 📁 documents/
    ├── README.md             ← 完整文档
    ├── SETUP.md              ← 部署指南
    └── DEVELOPMENT_SUMMARY.md ← 开发总结
```

---

## 核心功能 API 速查

### 班主任接口
| 功能 | 接口 |
|------|------|
| 登录 | `POST /api/auth/teacher/login` |
| 获取学生 | `GET /api/teacher/students` |
| 添加积分 | `POST /api/teacher/score-records` |
| 查看记录 | `GET /api/teacher/score-records` |
| 撤销记录 | `DELETE /api/teacher/score-records/:id` |
| 导出总分 | `GET /api/teacher/export/scores` |
| 导出记录 | `GET /api/teacher/export/records` |

### 管理员接口
| 功能 | 接口 |
|------|------|
| 登录 | `POST /api/auth/admin/login` |
| 创建班主任 | `POST /api/admin/teachers` |
| 删除班主任 | `DELETE /api/admin/teachers/:id` |
| 查看所有学生 | `GET /api/admin/students` |
| 导入学生 | `POST /api/admin/students/import` |
| 查看积分记录 | `GET /api/admin/score-records` |
| 导出学生数据 | `GET /api/admin/export/students` |
| 导出积分记录 | `GET /api/admin/export/records` |

---

## 常见问题快速解决

### Q: "MySQL 数据库连接失败"
**A:** 检查 MySQL 是否运行，修改 `.env` 中的数据库凭证

### Q: "端口 3000 已被占用"
**A:** 修改 `.env` 中的 PORT，或关闭占用该端口的程序

### Q: "找不到 npm 命令"
**A:** Node.js 没有安装或未添加到 PATH，重新安装 Node.js

### Q: "npm install 超时"
**A:** 更换 npm 镜像源：`npm config set registry https://registry.npmmirror.com`

### Q: "上传文件失败"
**A:** 创建 `uploads` 文件夹：`mkdir uploads`

---

## 下一步

1. ✅ 启动后端服务（你在这里）
2. 📝 测试所有 API 接口
3. 🎨 开发管理后台前端
4. 📱 连接小程序前端
5. 🧪 本地集成测试
6. 🚀 部署到云服务器

---

## 需要帮助？

查看详细文档：
- 📖 **完整项目文档**：打开 `README.md`
- 🔧 **部署配置指南**：打开 `SETUP.md`
- 📊 **开发总结**：打开 `DEVELOPMENT_SUMMARY.md`

或直接告诉我问题所在！
