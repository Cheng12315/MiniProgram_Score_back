/**
 * 迁移脚本：为所有现有学生初始化学期分数
 * 根据现有学生和学期，在 student_semester_scores 表中创建记录
 * 每个学期每个学生的初始分数都是 100
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrateData() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'score_management'
  });

  try {
    console.log('开始迁移数据...');

    // 获取所有学生和学期的组合
    const [students] = await connection.query('SELECT id FROM students');
    const [semesters] = await connection.query('SELECT id FROM semesters');

    if (students.length === 0 || semesters.length === 0) {
      console.log('没有学生或学期数据，跳过迁移');
      return;
    }

    console.log(`找到 ${students.length} 个学生和 ${semesters.length} 个学期`);

    // 为每个学生的每个学期插入初始分数记录
    let insertCount = 0;
    let skipCount = 0;

    for (const student of students) {
      for (const semester of semesters) {
        try {
          await connection.query(
            'INSERT IGNORE INTO student_semester_scores (student_id, semester_id, total_score) VALUES (?, ?, 100)',
            [student.id, semester.id]
          );
          insertCount++;
        } catch (err) {
          if (err.code === 'ER_DUP_ENTRY') {
            skipCount++;
          } else {
            console.error(`插入失败 - 学生 ${student.id}, 学期 ${semester.id}:`, err.message);
          }
        }
      }
    }

    console.log(`迁移完成！插入 ${insertCount} 条记录，跳过 ${skipCount} 条重复记录`);

  } catch (err) {
    console.error('迁移数据错误:', err);
  } finally {
    await connection.end();
  }
}

migrateData();
