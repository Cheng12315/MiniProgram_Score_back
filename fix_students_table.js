#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixTable() {
  try {
    console.log('\n重新创建 students 表...\n');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'score_management'
    });

    // 禁用外键约束
    await connection.query('SET FOREIGN_KEY_CHECKS = 0');

    // 删除表
    await connection.query('DROP TABLE IF EXISTS students');

    // 重新创建表
    await connection.query(`
      CREATE TABLE students (
        id INT PRIMARY KEY AUTO_INCREMENT,
        name VARCHAR(50) NOT NULL,
        student_number VARCHAR(50) NOT NULL UNIQUE,
        class_id INT NOT NULL,
        gender VARCHAR(10) DEFAULT 'M',
        current_score DECIMAL(10, 2) DEFAULT 100.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        UNIQUE KEY unique_student_number (student_number),
        INDEX idx_class_id (class_id),
        INDEX idx_name (name)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // 重新启用外键约束
    await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✓ students 表已重新创建\n');

    await connection.end();
  } catch (err) {
    console.error('错误:', err.message);
    process.exit(1);
  }
}

fixTable();
