#!/usr/bin/env node

const bcrypt = require('bcryptjs');

async function testPassword() {
  try {
    console.log('\n=== 测试密码和生成新哈希 ===\n');
    
    // 原始密码
    const password = 'admin123';
    
    // 生成新的哈希值
    const newHash = await bcrypt.hash(password, 10);
    
    console.log('原始密码: admin123');
    console.log('\n新生成的哈希值:');
    console.log(newHash);
    
    // 测试旧哈希值
    const oldHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86AGR0Ifxm6';
    const oldHashValid = await bcrypt.compare(password, oldHash);
    
    console.log('\n验证旧哈希值: ' + (oldHashValid ? '✓ 正确' : '✗ 错误'));
    
    // 测试新哈希值
    const newHashValid = await bcrypt.compare(password, newHash);
    console.log('验证新哈希值: ' + (newHashValid ? '✓ 正确' : '✗ 错误'));
    
    console.log('\n=======================\n');
    
    if (!oldHashValid) {
      console.log('⚠️  警告：旧哈希值不匹配！');
      console.log('请使用以下新哈希值更新数据库：\n');
      console.log('UPDATE admins SET password = \'' + newHash + '\' WHERE username = \'admin\';');
    }
    
  } catch (err) {
    console.error('错误:', err);
  }
}

testPassword();
