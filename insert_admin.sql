-- 德育积分管理系统 - 管理员账户插入脚本
-- 如果 admins 表为空，执行此脚本

USE score_management;

-- 首先删除已存在的管理员（可选）
-- DELETE FROM admins;

-- 插入默认管理员账户
-- 用户名: admin
-- 密码: admin123 (bcrypt加密，rounds=10)
INSERT INTO admins (username, password, real_name) VALUES
('admin', '$2b$10$YIjlrVyYvyf2LpZ8vqZy7.VxKQzKVwJKKoZvV8jRzKJKKKKKKKKKK', '系统管理员');

-- 验证插入
SELECT id, username, real_name FROM admins;
