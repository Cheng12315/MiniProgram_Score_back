@echo off
REM 德育积分管理系统数据库初始化脚本

echo 正在初始化数据库...
mysql -u root -p123456 < database.sql

echo.
echo 初始化完成！检查数据库...
mysql -u root -p123456 -e "USE score_management; SHOW TABLES;"

echo.
echo 数据库初始化成功！
pause
