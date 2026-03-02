/**
 * 迁移脚本：删除班主任时保留积分记录
 * 将 score_records.teacher_id 外键从 ON DELETE CASCADE 改为 ON DELETE SET NULL
 * 运行：node migrate_score_records_keep_on_teacher_delete.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'score_management',
    multipleStatements: true
  });

  try {
    console.log('开始迁移：删除班主任时保留积分记录...');

    // 1. 查找 teacher_id 的外键约束名
    const [[dbRow]] = await connection.query('SELECT DATABASE() as db');
    const dbName = dbRow?.db || process.env.DB_NAME || 'score_management';
    const [rows] = await connection.query(
      `SELECT CONSTRAINT_NAME as name FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'score_records' 
       AND COLUMN_NAME = 'teacher_id' AND REFERENCED_TABLE_NAME = 'teachers' LIMIT 1`,
      [dbName]
    );

    const fkName = rows[0]?.name || 'score_records_ibfk_2';
    console.log('外键约束名:', fkName);

    // 2. 删除旧外键
    try {
      await connection.query(`ALTER TABLE score_records DROP FOREIGN KEY \`${fkName}\``);
      console.log('已删除旧外键');
    } catch (e) {
      if (e.code === 'ER_CANT_DROP_FIELD_OR_KEY') {
        console.log('外键可能已删除，继续...');
      } else {
        throw e;
      }
    }

    // 3. 修改 teacher_id 允许 NULL
    await connection.query(
      `ALTER TABLE score_records MODIFY teacher_id INT NULL COMMENT '操作班主任ID（删除后置空，记录保留）'`
    );
    console.log('已修改 teacher_id 为可空');

    // 4. 若新约束已存在则先删除（防止重复执行报错）
    try {
      await connection.query('ALTER TABLE score_records DROP FOREIGN KEY fk_score_records_teacher');
    } catch (_) {}

    // 5. 添加新外键 ON DELETE SET NULL
    await connection.query(
      `ALTER TABLE score_records ADD CONSTRAINT fk_score_records_teacher 
       FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL`
    );
    console.log('已添加新外键（ON DELETE SET NULL）');

    console.log('迁移完成！删除班主任后，其积分记录将保留，操作人显示为「已删除」。');
  } catch (err) {
    console.error('迁移失败:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

run();
