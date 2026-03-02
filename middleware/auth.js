const jwt = require('jsonwebtoken');

// 验证管理员token
const authAdmin = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '缺少认证token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: '权限不足，需要管理员权限' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: '无效的token' });
  }
};

// 验证班主任token
const authTeacher = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '缺少认证token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== 'teacher') {
      return res.status(403).json({ error: '权限不足，需要班主任权限' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: '无效的token' });
  }
};

// 验证任何用户（可以是管理员或班主任）
const authUser = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '缺少认证token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: '无效的token' });
  }
};

module.exports = { authAdmin, authTeacher, authUser };
