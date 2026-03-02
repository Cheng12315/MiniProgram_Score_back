@echo off
chcp 65001 >nul
REM 插入初始数据到数据库

echo 正在插入初始数据...

mysql -u root -p123456 -e "USE score_management; INSERT INTO classes (class_name) VALUES ('8Year1'), ('8Year2'), ('Class242'), ('Class243');"

mysql -u root -p123456 -e "USE score_management; INSERT INTO semesters (semester_name, start_date, end_date, is_active) VALUES ('2024Spring', '2024-02-20', '2024-07-05', TRUE), ('2024Fall', '2024-09-01', '2025-01-20', FALSE), ('2025Spring', '2025-02-20', '2025-07-05', FALSE);"

echo.
echo 验证数据是否插入成功...
mysql -u root -p123456 -e "USE score_management; SELECT COUNT(*) as ClassCount FROM classes; SELECT COUNT(*) as SemesterCount FROM semesters;"

echo.
echo 完成！
pause
