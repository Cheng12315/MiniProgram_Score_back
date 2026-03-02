const express = require('express');
const multer = require('multer');
const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const { authTeacher } = require('../middleware/auth');
const { successResponse, errorResponse, paginationResponse } = require('../utils/response');
const { validateStudentNumber, validateGender } = require('../utils/validation');

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

// 获取班级学生列表（支持按学期查询）
router.get('/students', authTeacher, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { page = 1, pageSize = 10, search = '', semesterId } = req.query;
    const classId = req.user.classId;

    let countQuery = 'SELECT COUNT(*) as count FROM students WHERE class_id = ?';
    let dataQuery;
    let countParams = [classId];
    let dataParams = [];

    if (semesterId) {
      // 如果指定了学期，从 student_semester_scores 表获取该学期的分数
      dataQuery = `SELECT s.id, s.name, s.student_number, s.gender, s.current_score, s.created_at,
                          c.class_name, COALESCE(sss.total_score, 100) as semester_score
                   FROM students s
                   LEFT JOIN classes c ON s.class_id = c.id
                   LEFT JOIN student_semester_scores sss ON s.id = sss.student_id AND sss.semester_id = ?
                   WHERE s.class_id = ?`;
      dataParams = [parseInt(semesterId), classId];
    } else {
      // 不指定学期时，返回 current_score
      dataQuery = `SELECT s.id, s.name, s.student_number, s.gender, s.current_score, s.created_at, c.class_name
                   FROM students s
                   LEFT JOIN classes c ON s.class_id = c.id
                   WHERE s.class_id = ?`;
      dataParams = [classId];
    }

    // 如果提供了搜索条件，添加过滤
    if (search) {
      const searchTerm = `%${search}%`;
      countQuery += ' AND (name LIKE ? OR student_number LIKE ?)';
      dataQuery += ' AND (s.name LIKE ? OR s.student_number LIKE ?)';
      countParams.push(searchTerm, searchTerm);
      dataParams.push(searchTerm, searchTerm);
    }

    const [countRows] = await connection.query(countQuery, countParams);
    const total = countRows[0].count;

    const offset = (page - 1) * pageSize;
    dataQuery += ' ORDER BY s.created_at DESC LIMIT ? OFFSET ?';
    dataParams.push(parseInt(pageSize), parseInt(offset));

    const [students] = await connection.query(dataQuery, dataParams);
    connection.release();

    return res.json(paginationResponse(students, total, page, pageSize));
  } catch (err) {
    connection.release();
    console.error('获取学生列表错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 获取学生详情
router.get('/students/:id', authTeacher, async (req, res) => {
  try {
    const studentId = req.params.id;
    const classId = req.user.classId;
    const semesterId = req.query.semesterId;

    const connection = await pool.getConnection();
    
    let query, params;
    
    if (semesterId) {
      // 返回学期分数
      query = `SELECT s.id, s.name, s.student_number, s.gender, s.current_score, 
                      c.class_name, COALESCE(sss.total_score, 100) as semester_score,
                      s.created_at, s.updated_at
               FROM students s
               LEFT JOIN classes c ON s.class_id = c.id
               LEFT JOIN student_semester_scores sss ON s.id = sss.student_id AND sss.semester_id = ?
               WHERE s.id = ? AND s.class_id = ?`;
      params = [semesterId, studentId, classId];
    } else {
      // 返回当前分数
      query = `SELECT s.id, s.name, s.student_number, s.gender, s.current_score, 
                      c.class_name, s.created_at, s.updated_at
               FROM students s
               LEFT JOIN classes c ON s.class_id = c.id
               WHERE s.id = ? AND s.class_id = ?`;
      params = [studentId, classId];
    }
    
    const [rows] = await connection.query(query, params);
    connection.release();

    if (rows.length === 0) {
      return res.status(404).json(errorResponse('学生不存在或无权访问', -1));
    }

    res.json(successResponse(rows[0]));
  } catch (err) {
    console.error('获取学生详情错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 导入学生数据（班主任导入本班学生）
router.post('/students/import', authTeacher, upload.single('file'), async (req, res) => {
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

    const classId = req.user.classId;
    const errors = [];
    const successCount = { added: 0, updated: 0 };

    // 获取班主任的班级信息
    const [classRows] = await connection.query(
      'SELECT class_name FROM classes WHERE id = ?',
      [classId]
    );

    if (classRows.length === 0) {
      connection.release();
      fs.unlink(filePath, (err) => { if (err) console.error('删除文件失败:', err); });
      return res.status(400).json(errorResponse('班级不存在', -1));
    }

    const teacherClassName = classRows[0].class_name;

    // 第一步：验证 Excel 中的所有班级是否都与班主任的班级一致
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const className = row['班级'] || row['class'] || row['Class'];
      const cleanClassName = String(className).trim();

      // 如果班级与班主任所带班级不一致，拒绝整个导入
      if (cleanClassName !== teacherClassName) {
        await connection.rollback();
        connection.release();
        fs.unlink(filePath, (err) => { if (err) console.error('删除文件失败:', err); });
        return res.status(400).json({
          code: -1,
          message: '班级不符',
          details: `第${i + 2}行: 班级"${cleanClassName}"与你所带班级"${teacherClassName}"不匹配`
        });
      }
    }

    // 第二步：所有班级验证通过，开始导入
    await connection.beginTransaction();

    for (let i = 0; i < data.length; i++) {
      const row = data[i];

      // 灵活处理列名（支持中文或英文）
      const name = row['姓名'] || row['name'] || row['Name'];
      const studentNumber = row['学号'] || row['student_number'] || row['Student Number'];
      const gender = row['性别'] || row['gender'] || row['Gender'];

      // 验证必需字段
      if (!name || !studentNumber || !gender) {
        errors.push(`第${i + 2}行: 缺少必需字段（需要：姓名、学号、性别）`);
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
      const cleanGender = String(gender).trim();

      // 检查学号是否已存在
      const [existing] = await connection.query(
        'SELECT id FROM students WHERE student_number = ?',
        [cleanStudentNumber]
      );

      if (existing.length > 0) {
        // 更新现有学生
        await connection.query(
          'UPDATE students SET name = ?, gender = ? WHERE student_number = ?',
          [cleanName, cleanGender, cleanStudentNumber]
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

// 添加积分记录
router.post('/score-records', authTeacher, async (req, res) => {
  try {
    const { studentId, semesterId, scoreChange, reason } = req.body;
    const teacherId = req.user.id;
    const classId = req.user.classId;

    // 验证必需字段
    if (!studentId || !semesterId || scoreChange === undefined || !reason) {
      return res.status(400).json(errorResponse('缺少必需字段', -1));
    }

    const connection = await pool.getConnection();

    // 检查学生是否属于该班级
    const [studentRows] = await connection.query(
      'SELECT id, current_score FROM students WHERE id = ? AND class_id = ?',
      [studentId, classId]
    );

    if (studentRows.length === 0) {
      connection.release();
      return res.status(404).json(errorResponse('学生不存在或无权访问', -1));
    }

    const student = studentRows[0];
    const scoreChange_num = parseFloat(scoreChange);

    await connection.beginTransaction();

    try {
      // 获取当前学期的分数
      const [semesterScores] = await connection.query(
        'SELECT total_score FROM student_semester_scores WHERE student_id = ? AND semester_id = ?',
        [studentId, semesterId]
      );

      let newScore;
      if (semesterScores.length === 0) {
        // 该学期第一次操作，初始化为100
        await connection.query(
          'INSERT INTO student_semester_scores (student_id, semester_id, total_score) VALUES (?, ?, ?)',
          [studentId, semesterId, 100 + scoreChange_num]
        );
        newScore = 100 + scoreChange_num;
      } else {
        // 更新该学期的分数
        newScore = parseFloat(semesterScores[0].total_score) + scoreChange_num;
        await connection.query(
          'UPDATE student_semester_scores SET total_score = ? WHERE student_id = ? AND semester_id = ?',
          [newScore, studentId, semesterId]
        );
      }

      // 添加记录
      const [result] = await connection.query(
        `INSERT INTO score_records 
         (student_id, teacher_id, class_id, semester_id, score_change, reason) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [studentId, teacherId, classId, semesterId, scoreChange_num, reason]
      );

      // 同时更新 students 表的 current_score（用于兼容性和快速查询）
      const newCurrentScore = parseFloat(student.current_score) + scoreChange_num;
      await connection.query(
        'UPDATE students SET current_score = ? WHERE id = ?',
        [newCurrentScore, studentId]
      );

      await connection.commit();
      connection.release();

      res.json(successResponse(
        {
          recordId: result.insertId,
          newScore,
          semesterScore: newScore
        },
        '积分操作成功'
      ));
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('添加积分记录错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 获取积分记录
router.get('/score-records', authTeacher, async (req, res) => {
  try {
    const { page = 1, pageSize = 10, studentId, semesterId } = req.query;
    const classId = req.user.classId;

    const connection = await pool.getConnection();

    let countQuery = 'SELECT COUNT(*) as count FROM score_records WHERE class_id = ?';
    let dataQuery = `SELECT sr.id, sr.student_id, sr.reason, sr.score_change, sr.created_at,
                    s.name as student_name, s.student_number,
                    sem.semester_name
                    FROM score_records sr
                    JOIN students s ON sr.student_id = s.id
                    JOIN semesters sem ON sr.semester_id = sem.id
                    WHERE sr.class_id = ?`;
    
    const params = [classId];

    if (studentId) {
      countQuery += ' AND student_id = ?';
      dataQuery += ' AND sr.student_id = ?';
      params.push(studentId);
    }

    if (semesterId) {
      countQuery += ' AND semester_id = ?';
      dataQuery += ' AND sr.semester_id = ?';
      params.push(semesterId);
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

// 撤销积分记录
router.delete('/score-records/:id', authTeacher, async (req, res) => {
  try {
    const recordId = req.params.id;
    const classId = req.user.classId;

    const connection = await pool.getConnection();

    // 获取记录详情
    const [records] = await connection.query(
      'SELECT student_id, score_change, semester_id FROM score_records WHERE id = ? AND class_id = ?',
      [recordId, classId]
    );

    if (records.length === 0) {
      connection.release();
      return res.status(404).json(errorResponse('记录不存在或无权删除', -1));
    }

    const record = records[0];
    const reverseScore = -parseFloat(record.score_change);

    await connection.beginTransaction();

    try {
      // 删除记录
      await connection.query(
        'DELETE FROM score_records WHERE id = ?',
        [recordId]
      );

      // 更新该学期的学生分数
      await connection.query(
        'UPDATE student_semester_scores SET total_score = total_score + ? WHERE student_id = ? AND semester_id = ?',
        [reverseScore, record.student_id, record.semester_id]
      );

      // 同时更新 students 表的 current_score（用于兼容性）
      await connection.query(
        'UPDATE students SET current_score = current_score + ? WHERE id = ?',
        [reverseScore, record.student_id]
      );

      await connection.commit();
      connection.release();

      res.json(successResponse(null, '记录已撤销'));
    } catch (err) {
      await connection.rollback();
      connection.release();
      throw err;
    }
  } catch (err) {
    console.error('撤销积分记录错误:', err);
    res.status(500).json(errorResponse('服务器错误', -1));
  }
});

// 导出学生总分（Excel）
router.get('/export/scores', authTeacher, async (req, res) => {
  try {
    const { semesterId, studentId, studentName } = req.query;
    const classId = req.user.classId;

    const connection = await pool.getConnection();

    let query, params = [classId];

    if (semesterId) {
      // 按学期导出：从 student_semester_scores 表获取该学期的分数
      query = `SELECT s.name, s.student_number, s.gender, c.class_name,
                      COALESCE(sss.total_score, 100) as current_score
               FROM students s
               JOIN classes c ON s.class_id = c.id
               LEFT JOIN student_semester_scores sss ON s.id = sss.student_id AND sss.semester_id = ?
               WHERE s.class_id = ?`;
      params = [semesterId, classId];
    } else {
      // 不按学期导出：使用 current_score
      query = `SELECT s.name, s.student_number, s.gender, c.class_name, s.current_score
               FROM students s
               JOIN classes c ON s.class_id = c.id
               WHERE s.class_id = ?`;
    }

    // 支持按学生 ID 或学生名称过滤
    if (studentId) {
      query += ' AND s.id = ?';
      params.push(studentId);
    } else if (studentName) {
      query += ' AND s.name = ?';
      params.push(studentName);
    }

    const [students] = await connection.query(query, params);
    connection.release();

    // 创建Excel工作簿
    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.json_to_sheet(students.map(s => ({
      姓名: s.name,
      学号: s.student_number,
      性别: s.gender,
      班级: s.class_name,
      得分: s.current_score
    })));

    xlsx.utils.book_append_sheet(workbook, worksheet, '学生总分');

    // 生成文件
    const filename = `学生总分_${Date.now()}.xlsx`;
    const filepath = path.join(uploadDir, filename);
    xlsx.writeFile(workbook, filepath);

    res.download(filepath, filename, (err) => {
      if (err) console.error('下载错误:', err);
      fs.unlink(filepath, (unlinkErr) => {
        if (unlinkErr) console.error('删除文件错误:', unlinkErr);
      });
    });
  } catch (err) {
    console.error('导出学生总分错误:', err);
    res.status(500).json(errorResponse('导出失败', -1));
  }
});

// 导出积分记录（Excel）
router.get('/export/records', authTeacher, async (req, res) => {
  try {
    const { semesterId, studentId, studentName } = req.query;
    const classId = req.user.classId;

    const connection = await pool.getConnection();

    let query = `SELECT s.name as 学生姓名, s.student_number as 学号, 
                 c.class_name as 班级, sr.reason as 变动原因, 
                 sr.score_change as 变动分值, sr.created_at as 操作时间
                 FROM score_records sr
                 JOIN students s ON sr.student_id = s.id
                 JOIN classes c ON s.class_id = c.id
                 WHERE sr.class_id = ?`;
    const params = [classId];

    // 支持按学生 ID 或学生名称过滤
    if (studentId) {
      query += ' AND sr.student_id = ?';
      params.push(studentId);
    } else if (studentName) {
      query += ' AND s.name = ?';
      params.push(studentName);
    }

    if (semesterId) {
      query += ' AND sr.semester_id = ?';
      params.push(semesterId);
    }

    query += ' ORDER BY sr.created_at DESC';

    const [records] = await connection.query(query, params);
    connection.release();

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

// 获取班主任的班级信息
router.get('/classes', authTeacher, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const classId = req.user.classId;

    const [classes] = await connection.query(
      'SELECT id, class_name FROM classes WHERE id = ?',
      [classId]
    );
    connection.release();

    res.json(successResponse(classes || []));
  } catch (err) {
    console.error('获取班级信息错误:', err);
    res.status(500).json(errorResponse('获取班级信息失败', -1));
  }
});

// 获取学期列表（已激活的学期排在最前，作为小程序默认选择）
router.get('/semesters', authTeacher, async (req, res) => {
  try {
    const connection = await pool.getConnection();
    const [semesters] = await connection.query(
      'SELECT id, semester_name, start_date, end_date, is_active FROM semesters ORDER BY is_active DESC, COALESCE(sort_order, 999) ASC, id ASC'
    );
    connection.release();

    res.json(successResponse(semesters || []));
  } catch (err) {
    console.error('获取学期列表错误:', err);
    res.status(500).json(errorResponse('获取学期列表失败', -1));
  }
});

module.exports = router;
