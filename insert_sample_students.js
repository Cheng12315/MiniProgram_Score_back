#!/usr/bin/env node

/**
 * 插入示例学生数据用于测试
 * 运行: node insert_sample_students.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function insertStudents() {
  try {
    console.log('\n========== 插入示例学生数据 ==========\n');

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'score_management',
      charset: 'utf8mb4'
    });

    // 示例学生数据（都属于班级 ID 5 = 8年级1班）
    const students = [
      { name: '张三', student_number: '2022001', class_id: 5, gender: 'M' },
      { name: '李四', student_number: '2022002', class_id: 5, gender: 'F' },
      { name: '王五', student_number: '2022003', class_id: 5, gender: 'M' },
      { name: '赵六', student_number: '2022004', class_id: 5, gender: 'F' },
      { name: '孙七', student_number: '2022005', class_id: 5, gender: 'M' }
    ];

    let count = 0;

    for (const student of students) {
      try {
        await connection.query(
          'INSERT INTO students (name, student_number, class_id, gender, current_score) VALUES (?, ?, ?, ?, ?)',
          [student.name, student.student_number, student.class_id, student.gender, 100]
        );
        console.log(`✓ 已插入学生: ${student.name} (学号: ${student.student_number})`);
        count++;
      } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
          console.log(`⚠ 学生已存在: ${student.name} (学号: ${student.student_number})`);
        } else {
          throw err;
        }
      }
    }

    // 验证
    console.log('\n========== 验证数据 ==========\n');

    const [result] = await connection.query(
      'SELECT id, name, student_number, gender, current_score FROM students WHERE class_id = 5 ORDER BY id'
    );

    console.log('8年级1班的学生列表:');
    result.forEach(student => {
      console.log(`  ID: ${student.id}, ${student.name} (${student.student_number}), 性别: ${student.gender}, 当前分数: ${student.current_score}`);
    });

    console.log(`\n总计: ${result.length} 个学生`);

    console.log('\n========== 完成！ ==========\n');

    await connection.end();
  } catch (err) {
    console.error('错误:', err.message);
    process.exit(1);
  }
}

insertStudents();
