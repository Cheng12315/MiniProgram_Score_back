# 德育积分管理系统后端

一个为中学班主任打造的微信小程序后端系统，支持学生德育积分管理、数据导入导出等功能。

## 技术栈

- **框架**: Node.js + Express.js
- **数据库**: MySQL 8.0+
- **认证**: JWT (JSON Web Token)
- **加密**: bcryptjs
- **文件处理**: multer + xlsx

## 项目结构

```
ScoreManagement_back/
├── config/              # 配置文件
│   └── database.js     # 数据库连接配置
├── middleware/          # 中间件
│   └── auth.js         # 认证中间件
├── routes/              # 路由
│   ├── auth.js         # 登录路由
│   ├── admin.js        # 管理员API
│   └── teacher.js      # 班主任API
├── utils/               # 工具函数
│   ├── validation.js   # 数据验证
│   └── response.js     # 统一响应格式
├── uploads/             # 文件上传目录
├── server.js           # 服务器入口
├── package.json        # 项目依赖
├── .env                # 环境变量（本地开发）
├── .env.example        # 环境变量示例
├── database.sql        # 数据库初始化脚本
└── README.md           # 项目文档
```

## 快速开始

### 1. 环境要求

- Node.js 16.0+ 或更高版本
- MySQL 8.0+ 或 MariaDB 10.4+
- npm 或 yarn

### 2. 安装依赖

```bash
npm install
```

### 3. 数据库初始化

#### 方式一：使用MySQL命令行

```bash
mysql -u root -p < database.sql
```

#### 方式二：使用MySQL客户端（如MySQL Workbench）

1. 打开MySQL客户端
2. 创建新查询
3. 打开并执行 `database.sql` 文件

### 4. 配置环境变量

编辑 `.env` 文件，根据你的环境修改数据库配置：

```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=score_management
DB_PORT=3306

PORT=3000
NODE_ENV=development

JWT_SECRET=your_secret_key
JWT_EXPIRE=7d

UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

### 5. 启动服务器

#### 开发模式（自动重启）

```bash
npm run dev
```

#### 生产模式

```bash
npm start
```

服务器将在 `http://localhost:3000` 启动

## API 文档

### 认证接口

#### 班主任登录
```
POST /api/auth/teacher/login
Content-Type: application/json

{
  "username": "teacher_username",
  "password": "password"
}

响应:
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "teacher1",
      "realName": "张老师",
      "classId": 1
    }
  }
}
```

#### 管理员登录
```
POST /api/auth/admin/login
Content-Type: application/json

{
  "username": "admin",
  "password": "password"
}

响应:
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGc...",
    "user": {
      "id": 1,
      "username": "admin",
      "realName": "系统管理员"
    }
  }
}
```

### 班主任API

需要在请求头中添加 `Authorization: Bearer <token>`

#### 获取班级学生列表
```
GET /api/teacher/students?page=1&pageSize=10&search=keyword

响应:
{
  "code": 0,
  "message": "成功",
  "data": {
    "items": [...],
    "pagination": {
      "total": 50,
      "page": 1,
      "pageSize": 10,
      "totalPages": 5
    }
  }
}
```

#### 获取学期列表
```
GET /api/teacher/semesters

响应:
{
  "code": 0,
  "message": "成功",
  "data": [
    {
      "id": 1,
      "semester_name": "2024春",
      "is_active": true
    },
    ...
  ]
}
```

#### 添加积分记录
```
POST /api/teacher/score-records
Content-Type: application/json

{
  "studentId": 1,
  "semesterId": 1,
  "scoreChange": 2,
  "reason": "遵守纪律"
}

响应:
{
  "code": 0,
  "message": "积分操作成功",
  "data": {
    "recordId": 123,
    "newScore": 102
  }
}
```

#### 获取积分记录
```
GET /api/teacher/score-records?page=1&pageSize=10&studentId=1&semesterId=1
```

#### 撤销积分记录
```
DELETE /api/teacher/score-records/:id
```

#### 导入学生数据
```
POST /api/teacher/students/import
Content-Type: multipart/form-data

file: [Excel文件，需要包含：姓名、学号、班级、性别]

响应:
{
  "code": 0,
  "message": "导入完成",
  "data": {
    "successCount": {
      "added": 10,
      "updated": 5
    },
    "errors": [],
    "hasErrors": false
  }
}
```

#### 导出学生总分
```
GET /api/teacher/export/scores?studentId=1&semesterId=1
```

#### 导出积分记录
```
GET /api/teacher/export/records?studentId=1&semesterId=1
```

### 管理员API

需要在请求头中添加 `Authorization: Bearer <token>`

#### 获取班主任列表
```
GET /api/admin/teachers?page=1&pageSize=10&search=keyword
```

#### 创建班主任账号
```
POST /api/admin/teachers
Content-Type: application/json

{
  "username": "teacher1",
  "password": "password123",
  "realName": "张老师",
  "classId": 1
}
```

#### 删除班主任账号
```
DELETE /api/admin/teachers/:id
```

#### 获取所有学生列表
```
GET /api/admin/students?page=1&pageSize=10&classId=1&search=keyword
```

#### 导入学生数据（全局）
```
POST /api/admin/students/import
Content-Type: multipart/form-data

file: [Excel文件]
```

#### 获取所有积分记录
```
GET /api/admin/score-records?page=1&pageSize=10&classId=1&studentId=1&semesterId=1
```

#### 获取班级列表
```
GET /api/admin/classes
```

#### 获取学期列表
```
GET /api/admin/semesters
```

#### 导出学生数据
```
GET /api/admin/export/students?classId=1
```

#### 导出积分记录
```
GET /api/admin/export/records?classId=1&studentId=1&semesterId=1
```

## 数据库表说明

### classes（班级表）
存储所有班级信息

### teachers（班主任表）
存储班主任账户，每个班主任对应一个班级

### admins（管理员表）
存储管理员账户

### semesters（学期表）
存储学期信息

### students（学生表）
存储学生信息，包含当前总分

### score_records（积分操作记录表）
记录所有的积分操作

### operation_logs（操作日志表）
记录管理员的所有操作

## 响应格式说明

### 成功响应
```json
{
  "code": 0,
  "message": "成功提示信息",
  "data": {}
}
```

### 错误响应
```json
{
  "code": -1,
  "message": "错误提示信息",
  "data": null
}
```

## 安全注意事项

1. **密码管理**：所有密码使用bcryptjs加密存储，不得存储明文密码
2. **权限控制**：班主任只能访问自己班级的数据，管理员可以访问全局数据
3. **Token有效期**：默认7天，过期需重新登录
4. **文件上传**：只允许上传Excel文件，有文件大小限制

## 常见问题

### Q: 如何修改初始管理员密码？
A: 使用bcryptjs生成新密码的哈希值，更新admins表中的password字段

### Q: 学生初始分值为100分，如何修改？
A: 修改teacher.js和admin.js中的导入学生部分，将默认的100改为其他值

### Q: 如何添加新的学期？
A: 直接在数据库semesters表中添加新记录

## 部署到生产环境

1. 更新.env中的参数（特别是JWT_SECRET和数据库凭证）
2. 设置NODE_ENV=production
3. 使用PM2或其他进程管理工具运行服务
4. 配置Nginx反向代理
5. 启用HTTPS

## License

MIT

## 联系方式

有问题或建议，请提交Issue或联系开发者。
