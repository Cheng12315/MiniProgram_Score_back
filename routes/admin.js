const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const pool = require('../config/database');
const { authAdmin } = require('../middleware/auth');
const { successResponse, errorResponse, paginationResponse } = require('../utils/response');
const { validateUsername, validatePassword, validateStudentNumber, validateGender } = require('../utils/validation');

const router = express.Router();

// 创建上传目录
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.xlsx', '.xls', '.csv'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('只支持Excel文件'), false);
    }
  }
});

// ==================== 班主任管理 ====================

// 获取班主任列表
router.get('/teachers', authAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, search = '' } = req.query;

    const connection = await pool.getConnection();

    let countQuery = 'SELECT COUNT(*) as count FROM teachers';
    let dataQuery = `SELECT t.id, t.username, t.real_name, t.class_id, t.created_at, c.class_name 
                    FROM teachers t
                    LEFT JOIN classes c ON t.class_id = c.id`;
    
    const params = [];

    if (search) {
      const searchTerm = `%${search}%`;
      countQuery += ' WHERE username LIKE ? OR real_name LIKE ?';
      dataQuery += ' WHERE t.username LIKE ? OR t.real_name LIKE ?';
      params.push(searchTerm, searchTerm);
    }

    const [countRows] = await connection.query(countQuery, params);
    const total = countRows[0].count;

    const offset = (page - 1) * pageSize;
    dataQuery += ' ORDER BY t.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));

    const [teachers] = await connection.query(dataQuery, params);
    connection.release();

    res.json(paginationResponse(teachers, total, page, pageSize));
  } catch (err) {
    console.error('获取班主任列表错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 创建班主任账号
router.post('/teachers', authAdmin, async (req, res) => {
  try {
    const { username, password, realName, classId } = req.body;

    // 验证输入
    const usernameValidation = validateUsername(username);
    if (!usernameValidation.valid) {
      return res.status(400).json(errorResponse(usernameValidation.error, -1));
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.valid) {
      return res.status(400).json(errorResponse(passwordValidation.error, -1));
    }

    if (!classId) {
      return res.status(400).json(errorResponse('班级ID不能为空', -1));
    }

    const connection = await pool.getConnection();

    // 检查用户名是否已存在
    const [existing] = await connection.query(
      'SELECT id FROM teachers WHERE username = ?',
      [username]
    );

    if (existing.length > 0) {
      connection.release();
      return res.status(409).json(errorResponse('用户名已存在', -1));
    }

    // 检查班级是否存在
    const [classRows] = await connection.query(
      'SELECT id FROM classes WHERE id = ?',
      [classId]
    );

    if (classRows.length === 0) {
      connection.release();
      return res.status(404).json(errorResponse('班级不存在', -1));
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建班主任
    const [result] = await connection.query(
      'INSERT INTO teachers (username, password, real_name, class_id) VALUES (?, ?, ?, ?)',
      [username, hashedPassword, realName, classId]
    );

    // 记录操作日志
    await connection.query(
      'INSERT INTO operation_logs (admin_id, teacher_id, operation_type, operation_details) VALUES (?, ?, ?, ?)',
      [req.user.id, result.insertId, 'create_teacher', JSON.stringify({ username, classId })]
    );

    connection.release();

    res.json(successResponse(
      { id: result.insertId, username, classId },
      '班主任账号创建成功'
    ));
  } catch (err) {
    console.error('创建班主任错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 删除班主任账号
router.delete('/teachers/:id', authAdmin, async (req, res) => {
  try {
    const teacherId = req.params.id;

    const connection = await pool.getConnection();

    // 检查班主任是否存在
    const [existing] = await connection.query(
      'SELECT username FROM teachers WHERE id = ?',
      [teacherId]
    );

    if (existing.length === 0) {
      connection.release();
      return res.status(404).json(errorResponse('班主任不存在', -1));
    }

    await connection.beginTransaction();

    try {
      // 先记录操作日志（teacher_id 外键要求教师仍存在）
      await connection.query(
        'INSERT INTO operation_logs (admin_id, teacher_id, operation_type) VALUES (?, ?, ?)',
        [req.user.id, teacherId, 'delete_teacher']
      );

      // 再删除班主任
      await connection.query(
        'DELETE FROM teachers WHERE id = ?',
        [teacherId]
      );

      await connection.commit();
      connection.release();

      res.json(successResponse(null, '班主任账号已删除'));
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('删除班主任错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// ==================== 学生管理 ====================

// 获取所有学生列表
router.get('/students', authAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, classId, search = '' } = req.query;

    const connection = await pool.getConnection();

    let countQuery = 'SELECT COUNT(*) as count FROM students';
    let dataQuery = `SELECT s.id, s.name, s.student_number, s.gender, s.current_score, 
                    c.class_name, s.created_at
                    FROM students s
                    LEFT JOIN classes c ON s.class_id = c.id`;
    
    const params = [];

    if (classId) {
      countQuery += ' WHERE class_id = ?';
      dataQuery += ' WHERE s.class_id = ?';
      params.push(classId);
    }

    if (search) {
      const searchTerm = `%${search}%`;
      const whereClause = classId ? ' AND ' : ' WHERE ';
      countQuery += whereClause + '(name LIKE ? OR student_number LIKE ?)';
      dataQuery += whereClause + '(s.name LIKE ? OR s.student_number LIKE ?)';
      params.push(searchTerm, searchTerm);
    }

    const [countRows] = await connection.query(countQuery, params);
    const total = countRows[0].count;

    const offset = (page - 1) * pageSize;
    dataQuery += ' ORDER BY s.created_at DESC, s.id DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));

    const [students] = await connection.query(dataQuery, params);
    connection.release();

    res.json(paginationResponse(students, total, page, pageSize));
  } catch (err) {
    console.error('获取学生列表错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 批量删除选中的学生
router.post('/students/batch-delete', authAdmin, async (req, res) => {
  let connection;

  try {
    const { studentIds } = req.body;

    if (!Array.isArray(studentIds) || studentIds.length === 0) {
      return res.status(400).json(errorResponse('请选择要删除的学生', -1));
    }

    const uniqueStudentIds = [...new Set(
      studentIds
        .map(id => parseInt(id, 10))
        .filter(id => Number.isInteger(id) && id > 0)
    )];

    if (uniqueStudentIds.length === 0) {
      return res.status(400).json(errorResponse('学生ID无效', -1));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const placeholders = uniqueStudentIds.map(() => '?').join(',');

    const [students] = await connection.query(
      `SELECT id, name, student_number, class_id
       FROM students
       WHERE id IN (${placeholders})`,
      uniqueStudentIds
    );

    if (students.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('未找到要删除的学生', -1));
    }

    const existingStudentIds = students.map(s => s.id);
    const deletePlaceholders = existingStudentIds.map(() => '?').join(',');

    // 先删积分记录
    await connection.query(
      `DELETE FROM score_records WHERE student_id IN (${deletePlaceholders})`,
      existingStudentIds
    );

    // 再删学期汇总
    await connection.query(
      `DELETE FROM student_semester_scores WHERE student_id IN (${deletePlaceholders})`,
      existingStudentIds
    );

    // 最后删学生
    const [deleteResult] = await connection.query(
      `DELETE FROM students WHERE id IN (${deletePlaceholders})`,
      existingStudentIds
    );

    // 记录操作日志
    await connection.query(
      'INSERT INTO operation_logs (admin_id, operation_type, operation_details) VALUES (?, ?, ?)',
      [
        req.user.id,
        'batch_delete_students',
        JSON.stringify({
          deletedCount: deleteResult.affectedRows,
          studentIds: existingStudentIds,
          studentNumbers: students.map(s => s.student_number)
        })
      ]
    );

    await connection.commit();

    res.json(successResponse({
      deletedCount: deleteResult.affectedRows
    }, `已删除 ${deleteResult.affectedRows} 名学生及其相关积分记录`));
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }
    console.error('批量删除学生错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  } finally {
    if (connection) connection.release();
  }
});

// 按选中班级批量删除学生
router.post('/students/batch-delete-by-classes', authAdmin, async (req, res) => {
  let connection;

  try {
    const { classIds } = req.body;

    if (!Array.isArray(classIds) || classIds.length === 0) {
      return res.status(400).json(errorResponse('请选择要删除的班级', -1));
    }

    const uniqueClassIds = [...new Set(
      classIds
        .map(id => parseInt(id, 10))
        .filter(id => Number.isInteger(id) && id > 0)
    )];

    if (uniqueClassIds.length === 0) {
      return res.status(400).json(errorResponse('班级ID无效', -1));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const classPlaceholders = uniqueClassIds.map(() => '?').join(',');

    // 查询班级信息
    const [classRows] = await connection.query(
      `SELECT id, class_name
       FROM classes
       WHERE id IN (${classPlaceholders})`,
      uniqueClassIds
    );

    if (classRows.length === 0) {
      await connection.rollback();
      return res.status(404).json(errorResponse('未找到选中的班级', -1));
    }

    // 查询这些班级下的班主任
    const [teachers] = await connection.query(
      `SELECT id, username, class_id
       FROM teachers
       WHERE class_id IN (${classPlaceholders})`,
      uniqueClassIds
    );

    // 查询这些班级下的学生
    const [students] = await connection.query(
      `SELECT id, student_number, class_id
       FROM students
       WHERE class_id IN (${classPlaceholders})`,
      uniqueClassIds
    );

    const studentIds = students.map(s => s.id);
    const teacherIds = teachers.map(t => t.id);

    // 1. 删除学生相关数据
    if (studentIds.length > 0) {
      const studentPlaceholders = studentIds.map(() => '?').join(',');

      await connection.query(
        `DELETE FROM score_records WHERE student_id IN (${studentPlaceholders})`,
        studentIds
      );

      await connection.query(
        `DELETE FROM student_semester_scores WHERE student_id IN (${studentPlaceholders})`,
        studentIds
      );

      await connection.query(
        `DELETE FROM students WHERE id IN (${studentPlaceholders})`,
        studentIds
      );
    }

    // 2. 删除班主任前，先把操作日志里的 teacher_id 置空（避免外键/历史引用问题）
    if (teacherIds.length > 0) {
      const teacherPlaceholders = teacherIds.map(() => '?').join(',');

      try {
        await connection.query(
          `UPDATE operation_logs
           SET teacher_id = NULL
           WHERE teacher_id IN (${teacherPlaceholders})`,
          teacherIds
        );
      } catch (e) {
        console.warn('批量删除班主任时，operation_logs.teacher_id 置空失败，继续尝试删除班主任:', e.message);
      }

      await connection.query(
        `DELETE FROM teachers WHERE id IN (${teacherPlaceholders})`,
        teacherIds
      );
    }

    // 3. 最后删除班级
    await connection.query(
      `DELETE FROM classes WHERE id IN (${classPlaceholders})`,
      uniqueClassIds
    );

    // 4. 记录操作日志
    await connection.query(
      'INSERT INTO operation_logs (admin_id, operation_type, operation_details) VALUES (?, ?, ?)',
      [
        req.user.id,
        'batch_delete_classes_with_students_and_teachers',
        JSON.stringify({
          classIds: classRows.map(c => c.id),
          classNames: classRows.map(c => c.class_name),
          deletedStudentCount: students.length,
          deletedTeacherCount: teachers.length,
          deletedClassCount: classRows.length
        })
      ]
    );

    await connection.commit();

    res.json(successResponse({
      deletedStudentCount: students.length,
      deletedTeacherCount: teachers.length,
      deletedClassCount: classRows.length
    }, `已删除 ${classRows.length} 个班级、${teachers.length} 个班主任账号、${students.length} 名学生及其相关积分记录`));
  } catch (err) {
    if (connection) {
      try { await connection.rollback(); } catch (e) {}
    }
    console.error('按班级批量删除学生/班主任/班级错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  } finally {
    if (connection) connection.release();
  }
});

// 导入学生数据（管理员导入全局）
router.post('/students/import', authAdmin, upload.single('file'), async (req, res) => {
  const connection = await pool.getConnection();
  
  try {
    if (!req.file) {
      return res.status(400).json(errorResponse('未上传文件', -1));
    }

    const filePath = req.file.path;
    
    // 调试：输出文件信息
    console.log('上传的文件:', req.file.filename, '大小:', req.file.size, '类型:', req.file.mimetype);

    // 读取 Excel 文件
    let workbook;
    try {
      workbook = xlsx.readFile(filePath);
    } catch (readErr) {
      console.error('读取 Excel 文件失败:', readErr);
      fs.unlink(filePath, (err) => { if (err) console.error('删除文件失败:', err); });
      return res.status(400).json(errorResponse('文件格式错误，请上传有效的 Excel 文件', -1));
    }

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      console.error('Excel 文件没有工作表');
      fs.unlink(filePath, (err) => { if (err) console.error('删除文件失败:', err); });
      return res.status(400).json(errorResponse('Excel 文件没有工作表，请检查文件', -1));
    }

    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    console.log('读取的行数:', data.length);
    if (data.length === 0) {
      console.log('读取的列名:', Object.keys(sheet));
    } else {
      console.log('第一行数据:', data[0]);
    }

    const errors = [];
    const successCount = { added: 0, updated: 0 };

    await connection.beginTransaction();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // 灵活处理列名（支持中文或英文）
      const name = row['姓名'] || row['name'] || row['Name'];
      const studentNumber = row['学号'] || row['student_number'] || row['Student Number'];
      const className = row['班级'] || row['class'] || row['Class'];
      const gender = row['性别'] || row['gender'] || row['Gender'];

      // 验证必需字段
      if (!name || !studentNumber || !className || !gender) {
        errors.push(`第${i + 2}行: 缺少必需字段（需要：姓名、学号、班级、性别）`);
        continue;
      }

      // 验证学号
      const studentNumberValidation = validateStudentNumber(studentNumber);
      if (!studentNumberValidation.valid) {
        errors.push(`第${i + 2}行: ${studentNumberValidation.error}`);
        continue;
      }

      // 验证性别
      const genderValidation = validateGender(gender);
      if (!genderValidation.valid) {
        errors.push(`第${i + 2}行: ${genderValidation.error}`);
        continue;
      }

      // 规范化字段
      const cleanName = String(name).trim();
      const cleanStudentNumber = String(studentNumber).trim();
      const cleanClassName = String(className).trim();
      const cleanGender = String(gender).trim();

      // 获取班级ID
      const [classRows] = await connection.query(
        'SELECT id FROM classes WHERE class_name = ?',
        [cleanClassName]
      );

      if (classRows.length === 0) {
        errors.push(`第${i + 2}行: 班级"${cleanClassName}"不存在`);
        continue;
      }

      const classId = classRows[0].id;

      // 检查学号是否已存在
      const [existing] = await connection.query(
        'SELECT id FROM students WHERE student_number = ?',
        [cleanStudentNumber]
      );

      if (existing.length > 0) {
        // 覆盖更新现有学生
        await connection.query(
          'UPDATE students SET name = ?, class_id = ?, gender = ? WHERE student_number = ?',
          [cleanName, classId, cleanGender, cleanStudentNumber]
        );
        successCount.updated++;
      } else {
        // 添加新学生
        await connection.query(
          'INSERT INTO students (name, student_number, class_id, gender, current_score) VALUES (?, ?, ?, ?, ?)',
          [cleanName, cleanStudentNumber, classId, cleanGender, 100]
        );
        successCount.added++;
      }
    }

    await connection.commit();
    connection.release();

    // 清除上传的文件
    fs.unlink(filePath, (err) => {
      if (err) console.error('删除文件失败:', err);
    });

    // 记录操作日志
    const logConnection = await pool.getConnection();
    await logConnection.query(
      'INSERT INTO operation_logs (admin_id, operation_type, operation_details) VALUES (?, ?, ?)',
      [req.user.id, 'import_students', JSON.stringify(successCount)]
    );
    logConnection.release();

    res.json(successResponse({
      successCount,
      errors,
      hasErrors: errors.length > 0
    }, '导入完成'));
  } catch (err) {
    await connection.rollback();
    connection.release();
    console.error('导入学生数据错误:', err);

    // 清除上传的文件
    if (req.file) {
      fs.unlink(req.file.path, (err) => {
        if (err) console.error('删除文件失败:', err);
      });
    }

    res.status(500).json(errorResponse('导入失败，请检查文件格式', -1));
  }
});

// ==================== 积分记录管理 ====================

// 获取所有积分记录
router.get('/score-records', authAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, classId, studentId, semesterId, search = '' } = req.query;

    const connection = await pool.getConnection();

    let countQuery = 'SELECT COUNT(*) as count FROM score_records sr JOIN students s ON sr.student_id = s.id';
    let dataQuery = `SELECT sr.id, sr.student_id, sr.reason, sr.score_change, sr.created_at,
                    s.name as student_name, s.student_number,
                    c.class_name, sem.semester_name, COALESCE(t.real_name, '已删除') as teacher_name
                    FROM score_records sr
                    JOIN students s ON sr.student_id = s.id
                    JOIN classes c ON s.class_id = c.id
                    JOIN semesters sem ON sr.semester_id = sem.id
                    LEFT JOIN teachers t ON sr.teacher_id = t.id`;
    
    const params = [];
    let hasWhere = false;

    if (classId) {
      const whereClause = hasWhere ? ' AND ' : ' WHERE ';
      countQuery += whereClause + 'sr.class_id = ?';
      dataQuery += whereClause + 'sr.class_id = ?';
      params.push(classId);
      hasWhere = true;
    }

    if (studentId) {
      const whereClause = hasWhere ? ' AND ' : ' WHERE ';
      countQuery += whereClause + 'sr.student_id = ?';
      dataQuery += whereClause + 'sr.student_id = ?';
      params.push(studentId);
      hasWhere = true;
    }

    if (semesterId) {
      const whereClause = hasWhere ? ' AND ' : ' WHERE ';
      countQuery += whereClause + 'sr.semester_id = ?';
      dataQuery += whereClause + 'sr.semester_id = ?';
      params.push(semesterId);
      hasWhere = true;
    }

    if (search) {
      const searchTerm = `%${search}%`;
      const whereClause = hasWhere ? ' AND ' : ' WHERE ';
      countQuery += whereClause + '(s.name LIKE ? OR s.student_number LIKE ?)';
      dataQuery += whereClause + '(s.name LIKE ? OR s.student_number LIKE ?)';
      params.push(searchTerm, searchTerm);
      hasWhere = true;
    }

    const [countRows] = await connection.query(countQuery, params);
    const total = countRows[0].count;

    const offset = (page - 1) * pageSize;
    dataQuery += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));

    const [records] = await connection.query(dataQuery, params);
    connection.release();

    res.json(paginationResponse(records, total, page, pageSize));
  } catch (err) {
    console.error('获取积分记录错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// ==================== 学期管理 ====================

// 获取学期列表
router.get('/semesters', authAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [semesters] = await connection.query(
      'SELECT id, semester_name, start_date, end_date, is_active FROM semesters ORDER BY is_active DESC, id DESC'
    );
    connection.release();

    res.json(successResponse(semesters));
  } catch (err) {
    console.error('获取学期列表错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 新增学期
router.post('/semesters', authAdmin, async (req, res) => {
  let connection;
  try {
    const { semesterName, startDate, endDate } = req.body;

    if (!semesterName || !startDate || !endDate) {
      return res.status(400).json(errorResponse('学期名称、开始日期、结束日期不能为空', -1));
    }

    connection = await pool.getConnection();
    await connection.beginTransaction();

    const [existing] = await connection.query(
      'SELECT id FROM semesters WHERE semester_name = ?',
      [semesterName.trim()]
    );

    if (existing.length > 0) {
      await connection.rollback();
      connection.release();
      return res.status(409).json(errorResponse('学期名称已存在', -1));
    }

    const [rows] = await connection.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 AS nextSortOrder FROM semesters'
    );

    const nextSortOrder = rows[0].nextSortOrder;

    const [result] = await connection.query(
      'INSERT INTO semesters (semester_name, sort_order, start_date, end_date) VALUES (?, ?, ?, ?)',
      [semesterName.trim(), nextSortOrder, startDate, endDate]
    );

    await connection.commit();
    connection.release();

    res.json(successResponse({
      id: result.insertId,
      sortOrder: nextSortOrder
    }, '学期创建成功'));
  } catch (err) {
    if (connection) {
      try {
        await connection.rollback();
        connection.release();
      } catch (e) {}
    }
    console.error('新增学期错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});
// 激活学期
router.patch('/semesters/:id/activate', authAdmin, async (req, res) => {
  try {
    const semesterId = req.params.id;
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    try {
      await connection.query('UPDATE semesters SET is_active = FALSE');
      await connection.query('UPDATE semesters SET is_active = TRUE WHERE id = ?', [semesterId]);
      await connection.commit();
      connection.release();
      res.json(successResponse(null, '学期已激活'));
    } catch (e) {
      await connection.rollback();
      connection.release();
      throw e;
    }
  } catch (err) {
    console.error('激活学期错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// ==================== 班级管理 ====================

// 获取班级列表
router.get('/classes', authAdmin, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [classes] = await connection.query(
      'SELECT id, class_name, created_at FROM classes ORDER BY created_at DESC'
    );
    connection.release();

    res.json(successResponse(classes));
  } catch (err) {
    console.error('获取班级列表错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 批量新增班级（前缀可选；有前缀时：前缀+补零号+班，如 2026+01～05 → 202601班～202605班；无前缀时：直接起始～结束号，如 663～730）
router.post('/classes/batch', authAdmin, async (req, res) => {
  try {
    const { prefix, start, end } = req.body;
    const p = String(prefix || '').trim();
    const startStr = String(start ?? '').trim();
    const endStr = String(end ?? '').trim();
    const s = parseInt(startStr, 10);
    const e = parseInt(endStr, 10);
    if (isNaN(s) || isNaN(e)) return res.status(400).json(errorResponse('起始号、结束号必须为有效数字', -1));
    if (s > e) return res.status(400).json(errorResponse('起始号不能大于结束号', -1));
    if (e - s > 50) return res.status(400).json(errorResponse('单次最多添加50个班级', -1));
    const padLen = Math.max(startStr.length, endStr.length, 1);
    const connection = await pool.getConnection();
    const created = [];
    for (let i = s; i <= e; i++) {
      const numPart = String(i).padStart(padLen, '0');
      const className = p ? `${p}${numPart}班` : `${numPart}班`;
      const [existing] = await connection.query('SELECT id FROM classes WHERE class_name = ?', [className]);
      if (existing.length > 0) continue;
      const [result] = await connection.query('INSERT INTO classes (class_name) VALUES (?)', [className]);
      created.push({ id: result.insertId, class_name: className });
    }
    connection.release();
    res.json(successResponse(created, `成功创建 ${created.length} 个班级`));
  } catch (err) {
    console.error('批量新增班级错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 新增班级
router.post('/classes', authAdmin, async (req, res) => {
  try {
    const { className } = req.body;
    if (!className || !String(className).trim()) {
      return res.status(400).json(errorResponse('班级名称不能为空', -1));
    }
    const connection = await pool.getConnection();
    const [existing] = await connection.query(
      'SELECT id FROM classes WHERE class_name = ?',
      [String(className).trim()]
    );
    if (existing.length > 0) {
      connection.release();
      return res.status(409).json(errorResponse('班级名称已存在', -1));
    }
    const [result] = await connection.query(
      'INSERT INTO classes (class_name) VALUES (?)',
      [String(className).trim()]
    );
    connection.release();
    res.json(successResponse({ id: result.insertId }, '班级创建成功'));
  } catch (err) {
    console.error('新增班级错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 删除班级
router.delete('/classes/:id', authAdmin, async (req, res) => {
  try {
    const classId = req.params.id;
    const connection = await pool.getConnection();
    const [teachers] = await connection.query('SELECT id FROM teachers WHERE class_id = ?', [classId]);
    const [students] = await connection.query('SELECT id FROM students WHERE class_id = ?', [classId]);
    if (teachers.length > 0 || students.length > 0) {
      connection.release();
      return res.status(400).json(errorResponse('该班级下存在班主任或学生，无法删除', -1));
    }
    await connection.query('DELETE FROM classes WHERE id = ?', [classId]);
    connection.release();
    res.json(successResponse(null, '班级已删除'));
  } catch (err) {
    console.error('删除班级错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// ==================== 操作日志 ====================

router.get('/operation-logs', authAdmin, async (req, res) => {
  try {
    const { page = 1, pageSize = 15, operationType = '' } = req.query;
    const connection = await pool.getConnection();
    let countQuery = 'SELECT COUNT(*) as count FROM operation_logs';
    let dataQuery = `SELECT ol.id, ol.operation_type, ol.operation_details, ol.created_at, a.real_name as admin_name
                     FROM operation_logs ol
                     LEFT JOIN admins a ON ol.admin_id = a.id`;
    const params = [];
    if (operationType) {
      countQuery += ' WHERE operation_type = ?';
      dataQuery += ' WHERE ol.operation_type = ?';
      params.push(operationType);
    }
    const [countRows] = await connection.query(countQuery, params);
    const total = countRows[0].count;
    const offset = (page - 1) * pageSize;
    dataQuery += ' ORDER BY ol.created_at DESC LIMIT ? OFFSET ?';
    params.push(parseInt(pageSize), parseInt(offset));
    const [logs] = await connection.query(dataQuery, params);
    connection.release();
    res.json(paginationResponse(logs, total, page, pageSize));
  } catch (err) {
    console.error('获取操作日志错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// ==================== 数据导出 ====================

// 导出所有学生数据（Excel）
router.get('/export/students', authAdmin, async (req, res) => {
  try {
    const { classId, semesterId, search } = req.query;

    const connection = await pool.getConnection();

    let query, params;

    if (semesterId) {
      // 按学期导出：从 student_semester_scores 表获取该学期的分数
      query = `SELECT s.name, s.student_number, s.gender, c.class_name,
                      COALESCE(sss.total_score, 100) as current_score
               FROM students s
               LEFT JOIN classes c ON s.class_id = c.id
               LEFT JOIN student_semester_scores sss ON s.id = sss.student_id AND sss.semester_id = ?`;
      params = [semesterId];

      if (classId) {
        query += ' WHERE s.class_id = ?';
        params.push(classId);
      }
    } else {
      // 不按学期导出：使用 current_score（跨学期的累计总分）
      query = `SELECT s.name, s.student_number, s.gender, c.class_name, s.current_score
               FROM students s
               LEFT JOIN classes c ON s.class_id = c.id`;
      params = [];

      if (classId) {
        query += ' WHERE s.class_id = ?';
        params.push(classId);
      }
    }

    // 支持按学生名称或学号搜索
    if (search) {
      const searchTerm = `%${search}%`;
      const whereClause = params.length > 0 ? ' AND ' : ' WHERE ';
      query += whereClause + '(s.name LIKE ? OR s.student_number LIKE ?)';
      params.push(searchTerm, searchTerm);
    }

    const [students] = await connection.query(query, params);
    connection.release();

    // 如果搜索结果为空，返回404
    if (search && students.length === 0) {
      return res.status(404).json(errorResponse('未找到匹配的学生', -1));
    }

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(students.map(s => ({
      姓名: s.name,
      学号: s.student_number,
      性别: s.gender,
      班级: s.class_name,
      得分: Math.round(s.current_score)
    })));

    xlsx.utils.book_append_sheet(workbook, worksheet, '学生信息');

    const filename = `学生得分_${Date.now()}.xlsx`;
    const filepath = path.join(uploadDir, filename);
    xlsx.writeFile(workbook, filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error('下载错误:', err);
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('删除文件错误:', unlinkErr);
      });
    });
  } catch (err) {
    console.error('导出学生数据错误:', err);
    res.status(500).json(errorResponse('导出失败', -1));
  }
});

// 导出所有积分记录（Excel）
router.get('/export/records', authAdmin, async (req, res) => {
  try {
    const { classId, studentId, semesterId, search } = req.query;

    const connection = await pool.getConnection();

    let query = `SELECT s.name as 学生姓名, s.student_number as 学号, 
                 c.class_name as 班级, sr.reason as 变动原因, 
                 sr.score_change as 变动分值, sr.created_at as 操作时间,
                 COALESCE(t.real_name, '已删除') as 操作人
                 FROM score_records sr
                 JOIN students s ON sr.student_id = s.id
                 JOIN classes c ON s.class_id = c.id
                 LEFT JOIN teachers t ON sr.teacher_id = t.id`;
    
    const params = [];
    let hasWhere = false;

    if (classId) {
      query += ' WHERE sr.class_id = ?';
      params.push(classId);
      hasWhere = true;
    }

    if (studentId) {
      const whereClause = hasWhere ? ' AND ' : ' WHERE ';
      query += whereClause + 'sr.student_id = ?';
      params.push(studentId);
      hasWhere = true;
    }

    // 支持按学生名称或学号搜索
    if (search) {
      const searchTerm = `%${search}%`;
      const whereClause = hasWhere ? ' AND ' : ' WHERE ';
      query += whereClause + '(s.name LIKE ? OR s.student_number LIKE ?)';
      params.push(searchTerm, searchTerm);
      hasWhere = true;
    }

    if (semesterId) {
      const whereClause = hasWhere ? ' AND ' : ' WHERE ';
      query += whereClause + 'sr.semester_id = ?';
      params.push(semesterId);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [records] = await connection.query(query, params);
    connection.release();

    // 如果搜索结果为空，返回404
    if (search && records.length === 0) {
      return res.status(404).json(errorResponse('未找到匹配的数据', -1));
    }

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(records);
    xlsx.utils.book_append_sheet(workbook, worksheet, '积分记录');

    const filename = `积分记录_${Date.now()}.xlsx`;
    const filepath = path.join(uploadDir, filename);
    xlsx.writeFile(workbook, filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error('下载错误:', err);
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('删除文件错误:', unlinkErr);
      });
    });
  } catch (err) {
    console.error('导出积分记录错误:', err);
    res.status(500).json(errorResponse('导出失败', -1));
  }
});

module.exports = router;
