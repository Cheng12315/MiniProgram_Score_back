-- 修复管理员账户脚本
-- 这是 'admin' / 'admin123' 的正确 bcrypt 加密

USE score_management;

-- 清空现有数据（如果有的话）
DELETE FROM admins;

-- 插入新的管理员账户
-- 用户名: admin
-- 密码: admin123
INSERT INTO admins (username, password, real_name) 
VALUES ('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxm6', 'Admin');

-- 验证
SELECT * FROM admins;
