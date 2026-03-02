USE score_management;

-- 禁用外键约束
SET FOREIGN_KEY_CHECKS = 0;

-- 删除表
DROP TABLE IF EXISTS students;

-- 重新创建表（gender 改为 VARCHAR）
CREATE TABLE students (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '学生ID',
  name VARCHAR(50) NOT NULL COMMENT '学生姓名',
  student_number VARCHAR(50) NOT NULL UNIQUE COMMENT '学号（唯一）',
  class_id INT NOT NULL COMMENT '班级ID',
  gender VARCHAR(10) DEFAULT 'M' COMMENT '性别（M=男，F=女）',
  current_score DECIMAL(10, 2) DEFAULT 100.00 COMMENT '当前总分（初始值100分）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_number (student_number),
  INDEX idx_class_id (class_id),
  INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生表';

-- 重新启用外键约束
SET FOREIGN_KEY_CHECKS = 1;

-- 验证
SELECT * FROM students;
