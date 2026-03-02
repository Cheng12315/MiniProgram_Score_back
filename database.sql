-- 德育积分管理系统数据库脚本
-- 创建数据库
CREATE DATABASE IF NOT EXISTS score_management;
USE score_management;

-- 1. 班级表
CREATE TABLE classes (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '班级ID',
  class_name VARCHAR(50) NOT NULL UNIQUE COMMENT '班级名称',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_class_name (class_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班级表';

-- 2. 班主任表
CREATE TABLE teachers (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '班主任ID',
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '登录用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  real_name VARCHAR(50) COMMENT '真实姓名',
  class_id INT NOT NULL COMMENT '所属班级ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  UNIQUE KEY unique_username (username),
  INDEX idx_class_id (class_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='班主任表';

-- 3. 管理员表
CREATE TABLE admins (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '管理员ID',
  username VARCHAR(50) UNIQUE NOT NULL COMMENT '登录用户名',
  password VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  real_name VARCHAR(50) COMMENT '真实姓名',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE KEY unique_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='管理员表';

-- 4. 学期表
CREATE TABLE semesters (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '学期ID',
  semester_name VARCHAR(100) UNIQUE NOT NULL COMMENT '学期名称（如"2024春"）',
  start_date DATE COMMENT '学期开始日期',
  end_date DATE COMMENT '学期结束日期',
  is_active BOOLEAN DEFAULT FALSE COMMENT '是否为当前学期',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_semester_name (semester_name),
  INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学期表';

-- 5. 学生表
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

-- 6. 学生学期分数表（每个学期学生的总分，从100开始）
CREATE TABLE student_semester_scores (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
  student_id INT NOT NULL COMMENT '学生ID',
  semester_id INT NOT NULL COMMENT '学期ID',
  total_score DECIMAL(10, 2) DEFAULT 100.00 COMMENT '该学期的总分（新学期从100开始）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  UNIQUE KEY unique_student_semester (student_id, semester_id),
  INDEX idx_student_id (student_id),
  INDEX idx_semester_id (semester_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='学生学期分数表';

-- 7. 积分操作记录表
CREATE TABLE score_records (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '记录ID',
  student_id INT NOT NULL COMMENT '学生ID',
  teacher_id INT NULL COMMENT '操作班主任ID（删除班主任后置空，记录保留）',
  class_id INT NOT NULL COMMENT '班级ID',
  semester_id INT NOT NULL COMMENT '学期ID',
  score_change DECIMAL(10, 2) NOT NULL COMMENT '分值变动（正数为加分，负数为扣分）',
  reason VARCHAR(255) NOT NULL COMMENT '操作理由',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (semester_id) REFERENCES semesters(id) ON DELETE CASCADE,
  INDEX idx_student_id (student_id),
  INDEX idx_semester_id (semester_id),
  INDEX idx_class_id (class_id),
  INDEX idx_teacher_id (teacher_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='积分操作记录表';

-- 8. 操作日志表（用于跟踪管理员操作）
CREATE TABLE operation_logs (
  id INT PRIMARY KEY AUTO_INCREMENT COMMENT '日志ID',
  admin_id INT COMMENT '操作管理员ID',
  teacher_id INT COMMENT '被操作的班主任ID（如适用）',
  operation_type VARCHAR(50) NOT NULL COMMENT '操作类型（如create_teacher, delete_teacher, import_students等）',
  operation_details TEXT COMMENT '操作详情',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL,
  FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
  INDEX idx_admin_id (admin_id),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='操作日志表';

-- 初始化数据
-- 1. 插入默认学期数据
INSERT INTO semesters (semester_name, start_date, end_date, is_active) VALUES
  ('2024春', '2024-02-20', '2024-07-05', TRUE),
  ('2024秋', '2024-09-01', '2025-01-20', FALSE),
  ('2025春', '2025-02-20', '2025-07-05', FALSE);

-- 2. 插入默认班级数据
INSERT INTO classes (class_name) VALUES
  ('8年级1班'),
  ('8年级2班'),
  ('242班'),
  ('243班');

-- 3. 插入默认管理员（默认密码为admin123，需要在实际部署时修改）
-- 注意：这里密码应该是bcrypt加密后的值，以下是示例，实际应该使用真实的bcrypt值
-- bcrypt加密后的 "admin123" 示例值
INSERT INTO admins (username, password, real_name) VALUES
  ('admin', '$2b$10$YIjlrVyYvyf2LpZ8vqZy7.VxKQzKVwJKKoZvV8jRzKJKKKKKKKKKK', '系统管理员');

COMMIT;
