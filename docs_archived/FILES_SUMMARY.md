# 后端项目文件总结

## 📁 项目根目录结构

```
D:\ScoreManagement_back\
├── server.js                      ← 应用启动入口
├── package.json                   ← 项目依赖配置
├── .env                           ← 本地开发环境变量
├── .env.example                   ← 环境变量示例（参考）
├── .gitignore                     ← Git 忽略规则
├── database.sql                   ← 数据库初始化脚本
│
├── config/                        ← 配置文件目录
│   └── database.js               ← MySQL 连接池配置
│
├── middleware/                    ← 中间件目录
│   └── auth.js                   ← JWT 认证中间件
│
├── routes/                        ← 路由目录
│   ├── auth.js                   ← 登录接口（班主任、管理员）
│   ├── teacher.js                ← 班主任 API 接口
│   └── admin.js                  ← 管理员 API 接口
│
├── utils/                         ← 工具函数目录
│   ├── validation.js             ← 数据验证工具
│   └── response.js               ← 统一响应格式工具
│
├── uploads/                       ← 文件上传目录（自动创建）
│
└── 📚 文档目录
    ├── README.md                 ← 完整项目文档
    ├── SETUP.md                  ← 部署和配置指南
    ├── QUICK_START.md            ← 快速开始指南
    ├── DEVELOPMENT_SUMMARY.md    ← 开发总结
    ├── PROJECT_CHECKLIST.md      ← 项目完成清单
    └── FILES_SUMMARY.md          ← 本文件
```

---

## 📄 核心文件详解

### 🚀 应用入口

#### `server.js`
- **作用**：Express 应用的主入口
- **功能**：
  - 初始化 Express 应用
  - 配置安全中间件（helmet, cors）
  - 配置日志中间件（morgan）
  - 挂载所有路由（auth, admin, teacher）
  - 配置错误处理
- **大小**：约 50 行
- **启动命令**：`npm run dev` 或 `npm start`

---

### ⚙️ 配置文件

#### `package.json`
- **作用**：项目元信息和依赖管理
- **包含的依赖**：
  - `express` - Web 框架
  - `mysql2` - MySQL 驱动
  - `jsonwebtoken` - JWT 认证
  - `bcryptjs` - 密码加密
  - `cors` - 跨域处理
  - `multer` - 文件上传
  - `xlsx` - Excel 文件处理
  - `morgan` - HTTP 日志
  - `helmet` - 安全中间件
  - `express-validator` - 数据验证
- **开发依赖**：
  - `nodemon` - 自动重启
  - `jest` - 测试框架

#### `config/database.js`
- **作用**：MySQL 数据库连接池配置
- **功能**：
  - 创建连接池
  - 自动连接测试
  - 支持连接复用
  - 错误日志
- **大小**：约 25 行

#### `.env` 和 `.env.example`
- **作用**：环境变量配置
- **包含项**：
  - 数据库连接信息（host, user, password, port）
  - 服务器配置（port, NODE_ENV）
  - JWT 配置（secret, expiration）
  - 文件上传配置（目录, 大小限制）

---

### 🔐 认证和授权

#### `middleware/auth.js`
- **作用**：JWT 认证中间件
- **导出函数**：
  - `authAdmin` - 验证管理员权限
  - `authTeacher` - 验证班主任权限
  - `authUser` - 验证任何用户
- **功能**：
  - 验证 token 是否存在
  - 验证 token 签名有效性
  - 验证用户角色
  - 提取用户信息到 req.user
- **大小**：约 60 行

#### `routes/auth.js`
- **作用**：认证相关接口
- **导出接口**：
  - `POST /api/auth/teacher/login` - 班主任登录
  - `POST /api/auth/admin/login` - 管理员登录
- **功能**：
  - 用户名密码验证
  - 数据库查询
  - 密码比对（bcrypt）
  - 生成 JWT token
- **大小**：约 150 行

---

### 👨‍🏫 班主任 API

#### `routes/teacher.js`
- **作用**：班主任功能接口
- **导出接口数**：9 个
- **主要功能模块**：

##### 学生管理
```
GET    /api/teacher/students               查询学生列表
GET    /api/teacher/students/:id           查询学生详情
POST   /api/teacher/students/import        导入学生（Excel）
```

##### 积分操作
```
POST   /api/teacher/score-records          添加积分记录
GET    /api/teacher/score-records          查询积分记录
DELETE /api/teacher/score-records/:id      撤销积分记录
```

##### 学期和导出
```
GET    /api/teacher/semesters              查询学期列表
GET    /api/teacher/export/scores          导出学生总分
GET    /api/teacher/export/records         导出积分记录
```

- **特点**：
  - 权限隔离：只能看自己班级的数据
  - 事务处理：确保数据一致性
  - Excel 导入导出
  - 分页和搜索支持
- **大小**：约 450 行

---

### 👨‍💼 管理员 API

#### `routes/admin.js`
- **作用**：管理员功能接口
- **导出接口数**：15 个
- **主要功能模块**：

##### 班主任管理
```
GET    /api/admin/teachers                 查询班主任列表
POST   /api/admin/teachers                 创建班主任账号
DELETE /api/admin/teachers/:id             删除班主任账号
```

##### 学生管理
```
GET    /api/admin/students                 查询所有学生
POST   /api/admin/students/import          导入学生数据（全局）
```

##### 积分记录
```
GET    /api/admin/score-records            查询所有积分记录
```

##### 数据导出
```
GET    /api/admin/export/students          导出学生信息
GET    /api/admin/export/records           导出积分记录
```

##### 辅助接口
```
GET    /api/admin/classes                  查询班级列表
GET    /api/admin/semesters                查询学期列表
```

- **特点**：
  - 全局数据访问权限
  - 账号生命周期管理
  - 事务处理
  - 操作日志记录
- **大小**：约 550 行

---

### 🛠️ 工具函数

#### `utils/validation.js`
- **作用**：数据验证工具集
- **导出函数**：
  - `validateUsername` - 用户名验证
  - `validatePassword` - 密码验证
  - `validateStudentNumber` - 学号验证
  - `validateScore` - 分值验证
  - `validateGender` - 性别验证
- **验证规则**：
  - 用户名：4-50 字符，只允许字母数字下划线
  - 密码：6-100 字符
  - 学号：必填（支持任意长度）
  - 分值：必须是数字
  - 性别：男/女/其他
- **大小**：约 50 行

#### `utils/response.js`
- **作用**：统一的 API 响应格式
- **导出函数**：
  - `successResponse(data, message)` - 成功响应
  - `errorResponse(message, code, data)` - 错误响应
  - `paginationResponse(items, total, page, pageSize)` - 分页响应
- **响应格式**：
  ```json
  {
    "code": 0,
    "message": "提示信息",
    "data": {}
  }
  ```
- **大小**：约 30 行

---

### 🗄️ 数据库相关

#### `database.sql`
- **作用**：数据库初始化脚本
- **包含内容**：
  - 7 张数据表定义
  - 外键约束
  - 索引配置
  - 初始数据插入
- **表结构**：

| 表名 | 用途 | 主要字段 |
|------|------|--------|
| `classes` | 班级 | id, class_name |
| `teachers` | 班主任 | id, username, password, class_id |
| `admins` | 管理员 | id, username, password |
| `semesters` | 学期 | id, semester_name, is_active |
| `students` | 学生 | id, name, student_number, current_score |
| `score_records` | 积分记录 | id, student_id, score_change, reason |
| `operation_logs` | 操作日志 | id, admin_id, operation_type |

- **大小**：约 200 行

---

### 📚 文档文件

#### `README.md`
- **内容**：完整项目文档
- **章节**：
  - 项目简介和技术栈
  - 项目结构说明
  - 快速开始步骤
  - 完整的 API 文档
  - 数据库表说明
  - 响应格式说明
  - 安全注意事项
  - 常见问题解答
  - 部署指南
- **长度**：约 400 行

#### `SETUP.md`
- **内容**：详细的部署和配置指南
- **章节**：
  - 环境要求和安装步骤
  - 项目初始化流程
  - 数据库初始化（多种方式）
  - 环境变量配置
  - 启动服务器
  - API 测试方法
  - 常见问题排查
  - PM2 生产部署
  - 数据库备份恢复
  - 云服务器部署方案
- **长度**：约 350 行

#### `QUICK_START.md`
- **内容**：快速开始指南（精简版）
- **章节**：
  - 三步启动后端
  - 默认账户信息
  - 常用命令速查
  - 项目结构概览
  - API 速查表
  - 常见问题快速解决
- **长度**：约 150 行

#### `DEVELOPMENT_SUMMARY.md`
- **内容**：项目开发总结
- **章节**：
  - 已完成部分详细列表
  - 下一步工作内容
  - 技术细节说明
  - 关键文件说明
  - API 响应示例
  - 重要提醒和安全性
  - 测试清单
  - 获取支持信息
- **长度**：约 300 行

#### `PROJECT_CHECKLIST.md`
- **内容**：完整的项目任务清单
- **分为 6 个阶段**：
  1. 后端框架和 API 实现（✅ 已完成）
  2. 本地数据库配置和测试（⏳ 进行中）
  3. 管理后台前端开发（⏳ 待开始）
  4. 小程序前端与后端对接（⏳ 待开始）
  5. 集成测试和优化（⏳ 待开始）
  6. 部署到生产环境（⏳ 待开始）
- **长度**：约 250 行

#### `FILES_SUMMARY.md`
- **内容**：本文件，所有项目文件的详细说明
- **包含**：文件清单、每个文件的用途和内容

---

## 📊 项目统计

| 项目 | 数量 |
|------|------|
| 核心源代码文件 | 7 个 |
| 总代码行数 | ~2200 行 |
| API 接口数 | 24 个 |
| 数据库表 | 7 张 |
| 文档文件 | 6 个 |
| 文档总行数 | ~1500 行 |

---

## 🔄 文件依赖关系

```
server.js (应用入口)
    ├─ config/database.js (数据库连接)
    ├─ middleware/auth.js (认证中间件)
    └─ routes/
        ├─ auth.js (登录)
        │   ├─ config/database.js
        │   ├─ utils/validation.js
        │   ├─ utils/response.js
        │   └─ bcryptjs
        ├─ teacher.js (班主任 API)
        │   ├─ middleware/auth.js
        │   ├─ config/database.js
        │   ├─ utils/validation.js
        │   ├─ utils/response.js
        │   └─ 第三方库（multer, xlsx）
        └─ admin.js (管理员 API)
            ├─ middleware/auth.js
            ├─ config/database.js
            ├─ utils/validation.js
            ├─ utils/response.js
            └─ 第三方库（multer, xlsx）
```

---

## ⚙️ 第三方库版本

从 `package.json` 指定的版本：

| 库名 | 版本 | 用途 |
|------|------|------|
| express | ^4.18.2 | Web 框架 |
| mysql2 | ^3.6.5 | MySQL 驱动 |
| jsonwebtoken | ^9.1.2 | JWT 认证 |
| bcryptjs | ^2.4.3 | 密码加密 |
| multer | ^1.4.5-lts.1 | 文件上传 |
| xlsx | ^0.18.5 | Excel 处理 |
| cors | ^2.8.5 | 跨域 |
| morgan | ^1.10.0 | 日志 |
| helmet | ^7.1.0 | 安全 |

---

## 📝 使用文件的建议

### 🔧 开发阶段
1. 首先阅读：`QUICK_START.md` - 快速了解如何启动
2. 然后阅读：`SETUP.md` - 理解配置过程
3. 参考：`README.md` - 完整的 API 文档

### 🧪 测试阶段
1. 参考：`PROJECT_CHECKLIST.md` - 确保所有功能都测试了
2. 参考：`DEVELOPMENT_SUMMARY.md` - 了解技术细节

### 🚀 部署阶段
1. 详细阅读：`SETUP.md` 中的部署部分
2. 参考：`README.md` 中的安全注意事项

### 🐛 遇到问题
1. 查看：`SETUP.md` 中的常见问题排查
2. 查看：`README.md` 中的常见问题
3. 查看：`DEVELOPMENT_SUMMARY.md` 中的技术细节

---

## 🎯 下一步行动

### 立即可以做的事：
1. ✅ 阅读 `QUICK_START.md`
2. ✅ 按照步骤初始化数据库
3. ✅ 运行 `npm install && npm run dev`
4. ✅ 使用 Postman 测试 API

### 之后需要做的事：
1. 📝 开发管理后台前端
2. 📱 修改小程序前端代码
3. 🧪 进行集成测试
4. 🚀 部署到云服务器

---

所有文件都已为你准备好，祝你项目顺利！如有任何问题，随时告诉我。
