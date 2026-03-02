USE score_management;

-- 清空现有数据
DELETE FROM classes;
DELETE FROM semesters;

-- 插入班级（中文名称）
INSERT INTO classes (class_name) VALUES 
('8年级1班'),
('8年级2班'),
('242班'),
('243班');

-- 插入学期（中文名称）
INSERT INTO semesters (semester_name, start_date, end_date, is_active) VALUES 
('2024春', '2024-02-20', '2024-07-05', 1),
('2024秋', '2024-09-01', '2025-01-20', 0),
('2025春', '2025-02-20', '2025-07-05', 0);

-- 验证
SELECT * FROM classes;
SELECT * FROM semesters;
