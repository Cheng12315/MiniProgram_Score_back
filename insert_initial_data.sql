USE score_management;

-- ============================================
-- 插入初始数据
-- ============================================

-- 1. 清空现有数据（如果需要重新初始化）
-- DELETE FROM classes;
-- DELETE FROM semesters;
-- DELETE FROM teachers;

-- 2. 插入班级数据
INSERT INTO classes (class_name) VALUES
('8年级1班'),
('8年级2班'),
('242班'),
('243班');

-- 3. 插入学期数据
INSERT INTO semesters (semester_name, start_date, end_date, is_active) VALUES
('2024春', '2024-02-20', '2024-07-05', TRUE),
('2024秋', '2024-09-01', '2025-01-20', FALSE),
('2025春', '2025-02-20', '2025-07-05', FALSE);

-- 4. 验证插入结果
SELECT '===== 班级列表 =====' as '';
SELECT id, class_name FROM classes;

SELECT '===== 学期列表 =====' as '';
SELECT id, semester_name, is_active FROM semesters;

SELECT '===== 班主任列表（初始为空） =====' as '';
SELECT COUNT(*) as 'Teachers Count' FROM teachers;
