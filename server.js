// Updated: student_semester_scores table created
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const adminRoutes = require('./routes/admin');
const teacherRoutes = require('./routes/teacher');
const authRoutes = require('./routes/auth');

const app = express();

// 安全中间件（管理后台需要内联脚本，适当放宽）
app.use(helmet({
  contentSecurityPolicy: false
}));

// CORS配置
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1'],
  credentials: true
}));

// 日志中间件
app.use(morgan('combined'));

// 请求体解析
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// 管理后台静态文件（/admin 及子路径）
app.use('/admin', express.static(path.join(__dirname, 'public', 'admin'), { index: 'index.html' }));

// 路由
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '路由不存在' });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(err.status || 500).json({
    error: err.message || '服务器错误',
    status: err.status || 500
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`服务器启动成功，监听端口 ${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV}`);
});

module.exports = app;
