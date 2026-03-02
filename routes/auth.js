const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { successResponse, errorResponse } = require('../utils/response');
const { validateUsername, validatePassword } = require('../utils/validation');

const router = express.Router();

// 班主任登录
router.post('/teacher/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json(errorResponse(usernameValidation.error, -1));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json(errorResponse(passwordValidation.error, -1));
    }

    // 查询班主任
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, username, password, real_name, class_id FROM teachers WHERE username = ?',
      [username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json(errorResponse('用户名或密码错误', -1));
    }

    const teacher = rows[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, teacher.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('用户名或密码错误', -1));
    }

    // 生成token
    const token = jwt.sign(
      {
        id: teacher.id,
        username: teacher.username,
        role: 'teacher',
        classId: teacher.class_id
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json(successResponse({
      token,
      user: {
        id: teacher.id,
        username: teacher.username,
        realName: teacher.real_name,
        classId: teacher.class_id
      }
    }, '登录成功'));
  } catch (err) {
    console.error('班主任登录错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 管理员登录
router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // 验证输入
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json(errorResponse(usernameValidation.error, -1));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json(errorResponse(passwordValidation.error, -1));
    }

    // 查询管理员
    const connection = await pool.getConnection();
    const [rows] = await connection.query(
      'SELECT id, username, password, real_name FROM admins WHERE username = ?',
      [username]
    );
    connection.release();

    if (rows.length === 0) {
      return res.status(401).json(errorResponse('用户名或密码错误', -1));
    }

    const admin = rows[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      return res.status(401).json(errorResponse('用户名或密码错误', -1));
    }

    // 生成token
    const token = jwt.sign(
      {
        id: admin.id,
        username: admin.username,
        role: 'admin'
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json(successResponse({
      token,
      user: {
        id: admin.id,
        username: admin.username,
        realName: admin.real_name
      }
    }, '登录成功'));
  } catch (err) {
    console.error('管理员登录错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

module.exports = router;
