-- 删除班主任时保留积分记录：将 teacher_id 外键从 ON DELETE CASCADE 改为 ON DELETE SET NULL
-- 执行前请备份数据。执行后，已删除班主任的积分记录中操作人显示为「已删除」
-- 运行方式：mysql -u用户 -p 数据库名 < migrations/alter_score_records_keep_on_teacher_delete.sql

-- 1. 查找并删除 teacher_id 的外键约束
SET @fk_name = NULL;
SELECT CONSTRAINT_NAME INTO @fk_name FROM information_schema.KEY_COLUMN_USAGE 
WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'score_records' 
AND COLUMN_NAME = 'teacher_id' AND REFERENCED_TABLE_NAME = 'teachers' LIMIT 1;

SET @drop_sql = CONCAT('ALTER TABLE score_records DROP FOREIGN KEY `', COALESCE(@fk_name, 'score_records_ibfk_2'), '`');
PREPARE stmt FROM @drop_sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 2. 允许 teacher_id 为空
ALTER TABLE score_records MODIFY teacher_id INT NULL COMMENT '操作班主任ID（删除后置空，记录保留）';

-- 3. 重新添加外键，删除班主任时 SET NULL 而非 CASCADE
ALTER TABLE score_records 
  ADD CONSTRAINT fk_score_records_teacher 
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL;
