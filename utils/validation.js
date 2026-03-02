// 验证用户名
const validateUsername = (username) => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: '用户名不能为空' };
  }
  if (username.length < 4 || username.length > 50) {
    return { valid: false, error: '用户名长度应为4-50个字符' };
  }
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return { valid: false, error: '用户名只能包含字母、数字和下划线' };
  }
  return { valid: true };
};

// 验证密码
const validatePassword = (password) => {
  if (!password || password.length === 0) {
    return { valid: false, error: '密码不能为空' };
  }
  if (password.length < 6 || password.length > 100) {
    return { valid: false, error: '密码长度应为6-100个字符' };
  }
  return { valid: true };
};

// 验证学号
const validateStudentNumber = (studentNumber) => {
  // 将学号转换为字符串（Excel中可能是数字）
  const studentNumberStr = String(studentNumber).trim();
  if (!studentNumberStr || studentNumberStr.length === 0) {
    return { valid: false, error: '学号不能为空' };
  }
  return { valid: true };
};

// 验证分值
const validateScore = (score) => {
  const num = parseFloat(score);
  if (isNaN(num)) {
    return { valid: false, error: '分值必须是数字' };
  }
  return { valid: true };
};

// 验证性别
const validateGender = (gender) => {
  const genderStr = String(gender).trim();
  const validGenders = ['男', '女', '其他', 'M', 'F', 'Other'];
  if (!validGenders.includes(genderStr)) {
    return { valid: false, error: `性别值不合法，只支持: 男, 女, 其他, M, F, Other` };
  }
  return { valid: true };
};

module.exports = {
  validateUsername,
  validatePassword,
  validateStudentNumber,
  validateScore,
  validateGender
};
