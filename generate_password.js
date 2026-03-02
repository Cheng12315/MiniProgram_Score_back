#!/usr/bin/env node

/**
 * 生成 bcrypt 加密密码
 * 用法: node generate_password.js
 */

const bcrypt = require('bcryptjs');

async function generatePassword() {
  const password = 'admin123';
  
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    
    console.log('\n========== 密码生成完成 ==========');
    console.log('\n原始密码: admin123');
    console.log('\n加密后的密码 (bcrypt):');
    console.log(hashedPassword);
    console.log('\n复制上面的加密密码，用于 SQL INSERT 语句\n');
    
    // 验证
    const isValid = await bcrypt.compare(password, hashedPassword);
    console.log('验证结果:', isValid ? '✓ 正确' : '✗ 错误');
    console.log('\n==================================\n');
    
  } catch (err) {
    console.error('生成失败:', err);
  }
}

generatePassword();
