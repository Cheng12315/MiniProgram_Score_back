#!/usr/bin/env node

const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertInitialData() {
  try {
    console.log('\n========== 插入初始数据 ==========\n');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'score_management',
      multipleStatements: true,
      charset: 'utf8mb4'
    });

    // 清空现有数据
    console.log('清空现有数据...');
    await connection.query('DELETE FROM classes;');
    await connection.query('DELETE FROM semesters;');
    await connection.query('DELETE FROM teachers;');

    // 插入班级
    console.log('插入班级数据...');
    const classes = [
      '8年级1班',
      '8年级2班',
      '242班',
      '243班'
    ];
    
    for (const className of classes) {
      await connection.query('INSERT INTO classes (class_name) VALUES (?)', [className]);
      console.log(`  ✓ 插入班级: ${className}`);
    }

    // 插入学期
    console.log('插入学期数据...');
    const semesters = [
      { name: '2024春', start: '2024-02-20', end: '2024-07-05', active: true },
      { name: '2024秋', start: '2024-09-01', end: '2025-01-20', active: false },
      { name: '2025春', start: '2025-02-20', end: '2025-07-05', active: false }
    ];
    
    for (const sem of semesters) {
      await connection.query(
        'INSERT INTO semesters (semester_name, start_date, end_date, is_active) VALUES (?, ?, ?, ?)',
        [sem.name, sem.start, sem.end, sem.active ? 1 : 0]
      );
      console.log(`  ✓ 插入学期: ${sem.name} (活跃: ${sem.active})`);
    }

    // 验证
    console.log('\n========== 验证数据 ==========\n');
    
    const [classes_result] = await connection.query('SELECT id, class_name FROM classes;');
    console.log('班级列表:');
    classes_result.forEach(c => {
      console.log(`  ${c.id}. ${c.class_name}`);
    });

    const [semesters_result] = await connection.query('SELECT id, semester_name, is_active FROM semesters;');
    console.log('\n学期列表:');
    semesters_result.forEach(s => {
      console.log(`  ${s.id}. ${s.semester_name} (${s.is_active ? '活跃' : '非活跃'})`);
    });

    const [teachers_result] = await connection.query('SELECT COUNT(*) as count FROM teachers;');
    console.log(`\n班主任: ${teachers_result[0].count} 个`);

    console.log('\n========== 完成！ ==========\n');

    await connection.end();
  } catch (err) {
    console.error('错误:', err.message);
    process.exit(1);
  }
}

insertInitialData();
