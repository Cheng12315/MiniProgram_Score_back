@echo off
REM 修复管理员账户

echo 正在修复管理员账户...
mysql -u root -p123456 < fix_admin.sql

echo.
echo 完成！现在可以用以下凭证登录：
echo 用户名: admin
echo 密码: admin123
pause
