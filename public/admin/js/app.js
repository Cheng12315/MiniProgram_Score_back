/**
 * 管理后台主应用
 */
(function () {
  const loginPage = document.getElementById('login-page');
  const mainLayout = document.getElementById('main-layout');
  const pageContent = document.getElementById('page-content');
  const sidebarUser = document.getElementById('sidebar-user');

  // 登录页渲染
  window.renderLogin = function () {
    loginPage.classList.remove('hidden');
    mainLayout.classList.add('hidden');
    document.getElementById('login-error').textContent = '';
  };

  // 显示主布局
  function showMainLayout() {
    loginPage.classList.add('hidden');
    mainLayout.classList.remove('hidden');
    const user = AUTH.getUser();
    sidebarUser.textContent = user ? `${user.realName || user.username}` : '';
  }

  // 登录表单
  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('login-btn');
    const errEl = document.getElementById('login-error');

    errEl.textContent = '';
    btn.disabled = true;
    btn.textContent = '登录中...';

    try {
      const data = await AdminAPI.login(username, password);
      if (!data || !data.token) {
        throw new Error('登录响应异常，请重试');
      }
      AUTH.setAuth(data.token, data.user);
      showMainLayout();
      window.location.hash = '#/dashboard';
      ROUTER.handleRoute(); // 立即渲染仪表板（部分环境下 hashchange 可能不触发）
    } catch (err) {
      const msg = err.message || '登录失败';
      errEl.textContent = msg.includes('fetch') || msg.includes('Network') || msg.includes('Failed')
        ? '网络错误，请确认后端已启动（node server.js）'
        : msg;
    } finally {
      btn.disabled = false;
      btn.textContent = '登录';
    }
  });

  // 退出
  document.getElementById('logout-btn').addEventListener('click', () => {
    AUTH.clearAuth();
    window.location.hash = '#/login';
  });

  // 路由初始化后
  window.addEventListener('DOMContentLoaded', () => {
    if (AUTH.isLoggedIn()) {
      showMainLayout();
    }
    ROUTER.init();
  });

  // ==================== 仪表板 ====================
  window.renderDashboard = async function () {
    pageContent.innerHTML = '<div class="loading">加载中...</div>';
    try {
      const [teachersRes, studentsRes, classes, semesters] = await Promise.all([
        AdminAPI.getTeachers(1, 1),
        AdminAPI.getStudents(1, 1),
        AdminAPI.getClasses(),
        AdminAPI.getSemesters()
      ]);

      const teacherTotal = teachersRes?.pagination?.total ?? 0;
      const studentTotal = studentsRes?.pagination?.total ?? 0;
      const classTotal = Array.isArray(classes) ? classes.length : 0;
      const activeSemester = Array.isArray(semesters) ? semesters.find(s => s.is_active) : null;

      let logsHtml = '';
      try {
        const logsData = await AdminAPI.getOperationLogs({ pageSize: 10 });
        const logs = logsData?.items || [];
        logsHtml = logs.length ? `
          <table>
            <thead><tr><th>时间</th><th>操作类型</th><th>详情</th></tr></thead>
            <tbody>
              ${logs.map(l => `
                <tr>
                  <td>${formatDateTime(l.created_at)}</td>
                  <td>${l.operation_type || '-'}</td>
                  <td>${l.operation_details ? (typeof l.operation_details === 'string' ? l.operation_details : JSON.stringify(l.operation_details)) : '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : '<p class="empty-state">暂无操作日志</p>';
      } catch {
        logsHtml = '<p class="empty-state">暂无操作日志</p>';
      }

      pageContent.innerHTML = `
        <h1 class="page-title">仪表板</h1>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-value">${classTotal}</div><div class="stat-label">班级总数</div></div>
          <div class="stat-card"><div class="stat-value">${teacherTotal}</div><div class="stat-label">班主任总数</div></div>
          <div class="stat-card"><div class="stat-value">${studentTotal}</div><div class="stat-label">学生总数</div></div>
          <div class="stat-card"><div class="stat-value">${activeSemester ? activeSemester.semester_name : '-'}</div><div class="stat-label">当前学期</div></div>
        </div>
        <div class="card">
          <h3 style="margin-bottom:1rem">最近操作</h3>
          <div class="table-container">${logsHtml}</div>
        </div>
      `;
    } catch (err) {
      pageContent.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
  };

  // ==================== 班主任管理 ====================
  window.renderTeachers = async function () {
    pageContent.innerHTML = '<div class="loading">加载中...</div>';
    let page = 1;
    const pageSize = 10;
    let search = '';

    async function load() {
      try {
        const res = await AdminAPI.getTeachers(page, pageSize, search);
        const items = res?.items || [];
        const pagination = res?.pagination || { total: 0, totalPages: 0 };

        pageContent.innerHTML = `
          <h1 class="page-title">班主任管理</h1>
          <div class="card">
            <div class="toolbar">
              <div class="form-group">
                <input type="text" id="teacher-search" placeholder="搜索用户名/姓名" value="${escapeHtml(search)}">
              </div>
              <button class="btn btn-primary" id="teacher-search-btn">搜索</button>
              <button class="btn btn-primary" id="teacher-add-btn">新增班主任</button>
            </div>
            <div class="table-container">
              <table>
                <thead><tr><th>ID</th><th>用户名</th><th>真实姓名</th><th>所属班级</th><th>创建时间</th><th>操作</th></tr></thead>
                <tbody>
                  ${items.map(t => `
                    <tr>
                      <td>${t.id}</td>
                      <td>${escapeHtml(t.username)}</td>
                      <td>${escapeHtml(t.real_name)}</td>
                      <td>${escapeHtml(t.class_name || '-')}</td>
                      <td>${formatDateTime(t.created_at)}</td>
                      <td><button class="btn btn-danger btn-sm teacher-delete" data-id="${t.id}">删除</button></td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <span class="pagination-info">共 ${pagination.total} 条</span>
              <div class="pagination-btns">
                <button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>
                <button ${page >= pagination.totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>
              </div>
            </div>
          </div>
        `;

        pageContent.querySelector('#teacher-search-btn').onclick = () => {
          search = pageContent.querySelector('#teacher-search').value.trim();
          page = 1;
          load();
        };
        pageContent.querySelector('#teacher-add-btn').onclick = showAddTeacherModal;
        pageContent.querySelectorAll('.teacher-delete').forEach(btn => {
          btn.onclick = () => deleteTeacher(btn.dataset.id);
        });
        pageContent.querySelectorAll('.pagination-btns button').forEach(btn => {
          if (!btn.disabled) btn.onclick = () => { page = parseInt(btn.dataset.page); load(); };
        });
      } catch (err) {
        pageContent.innerHTML = `<div class="error-message">${err.message}</div>`;
      }
    }

    function showAddTeacherModal() {
      const classes = [];
      AdminAPI.getClasses().then(c => {
        (c || []).forEach(cl => classes.push({ id: cl.id, name: cl.class_name }));
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal">
            <h3>新增班主任</h3>
            <form id="add-teacher-form">
              <div class="form-group"><label>用户名</label><input name="username" required placeholder="3-20位字母数字下划线"></div>
              <div class="form-group"><label>密码</label><input type="text" name="password" required placeholder="至少8位"></div>
              <div class="form-group"><label>真实姓名</label><input name="realName" required placeholder="2-4位汉字"></div>
              <div class="form-group"><label>所属班级</label>
                <select name="classId" required>
                  <option value="">请选择</option>
                  ${classes.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('')}
                </select>
              </div>
              <div class="modal-actions">
                <button type="button" class="btn btn-outline" id="modal-cancel">取消</button>
                <button type="submit" class="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#modal-cancel').onclick = () => modal.remove();
        modal.querySelector('#add-teacher-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          try {
            await AdminAPI.createTeacher({
              username: fd.get('username'),
              password: fd.get('password'),
              realName: fd.get('realName'),
              classId: parseInt(fd.get('classId'))
            });
            modal.remove();
            load();
            alert('创建成功');
          } catch (err) {
            alert(err.message);
          }
        };
      });
    }

    async function deleteTeacher(id) {
      if (!confirm('确定删除该班主任？')) return;
      try {
        await AdminAPI.deleteTeacher(id);
        load();
        alert('删除成功');
      } catch (err) {
        alert(err.message);
      }
    }

    load();
  };

  // ==================== 学生管理 ====================
  window.renderStudents = async function () {
    pageContent.innerHTML = '<div class="loading">加载中...</div>';
  
    let page = 1;
    const pageSize = 10;
    let classId = '';
    let search = '';
    const selectedStudentIds = new Set();
  
    async function load() {
      try {
        const [res, classes] = await Promise.all([
          AdminAPI.getStudents(page, pageSize, classId, search),
          AdminAPI.getClasses()
        ]);
  
        const items = res?.items || [];
        const pagination = res?.pagination || { total: 0, totalPages: 0 };
  
        const currentPageIds = items.map(item => String(item.id));
        const allCurrentPageChecked =
          currentPageIds.length > 0 &&
          currentPageIds.every(id => selectedStudentIds.has(id));
  
        pageContent.innerHTML = `
          <h1 class="page-title">学生管理</h1>
          <div class="card">
            <div class="toolbar">
              <div class="form-group">
                <select id="student-class-filter">
                  <option value="">全部班级</option>
                  ${(classes || []).map(c => `
                    <option value="${c.id}" ${String(c.id) === String(classId) ? 'selected' : ''}>
                      ${escapeHtml(c.class_name)}
                    </option>
                  `).join('')}
                </select>
              </div>
  
              <div class="form-group">
                <input type="text" id="student-search" placeholder="学号/姓名" value="${escapeHtml(search)}">
              </div>
  
              <button class="btn btn-primary btn-auto" id="student-search-btn">搜索</button>
              <button class="btn btn-primary btn-auto" id="student-import-btn">批量导入</button>
            </div>
  
            <div class="toolbar student-actions-bar">
              <button class="btn btn-danger btn-auto" id="delete-selected-students-btn">删除选中学生</button>
              <button class="btn btn-danger btn-auto" id="delete-by-class-btn">按班级批量删除</button>
              <span class="selection-text">已选 <strong id="selected-student-count">${selectedStudentIds.size}</strong> 名学生</span>
            </div>
  
            <div class="table-container">
              <table>
                <thead>
                  <tr>
                    <th class="checkbox-col">
                      <input type="checkbox" id="student-check-all" ${allCurrentPageChecked ? 'checked' : ''}>
                    </th>
                    <th>学号</th>
                    <th>姓名</th>
                    <th>班级</th>
                    <th>性别</th>
                    <th>当前分数</th>
                    <th>创建时间</th>
                  </tr>
                </thead>
                <tbody>
                  ${items.length > 0 ? items.map(s => `
                    <tr>
                      <td class="checkbox-col">
                        <input
                          type="checkbox"
                          class="student-check"
                          data-id="${s.id}"
                          ${selectedStudentIds.has(String(s.id)) ? 'checked' : ''}
                        >
                      </td>
                      <td>${escapeHtml(s.student_number)}</td>
                      <td>${escapeHtml(s.name)}</td>
                      <td>${escapeHtml(s.class_name || '-')}</td>
                      <td>${s.gender || '-'}</td>
                      <td>${Math.round(parseFloat(s.current_score) || 0)}</td>
                      <td>${formatDateTime(s.created_at)}</td>
                    </tr>
                  `).join('') : `
                    <tr>
                      <td colspan="7" class="table-empty">暂无学生数据</td>
                    </tr>
                  `}
                </tbody>
              </table>
            </div>
  
            <div class="pagination">
              <span class="pagination-info">共 ${pagination.total} 条</span>
              <div class="pagination-btns">
                <button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>
                <button ${page >= pagination.totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>
              </div>
            </div>
          </div>
  
          <input type="file" id="import-file-input" accept=".xlsx,.xls,.csv" style="display:none">
        `;
  
        // 筛选班级
        pageContent.querySelector('#student-class-filter').onchange = (e) => {
          classId = e.target.value;
          page = 1;
          selectedStudentIds.clear();
          load();
        };
  
        // 搜索
        pageContent.querySelector('#student-search-btn').onclick = () => {
          search = pageContent.querySelector('#student-search').value.trim();
          page = 1;
          selectedStudentIds.clear();
          load();
        };
  
        // 导入
        pageContent.querySelector('#student-import-btn').onclick = () => {
          pageContent.querySelector('#import-file-input').click();
        };
  
        pageContent.querySelector('#import-file-input').onchange = async (e) => {
          const file = e.target.files[0];
          if (!file) return;
          e.target.value = '';
  
          try {
            const result = await AdminAPI.importStudents(file);
            selectedStudentIds.clear();
            await load();
  
            const added = result.successCount?.added || 0;
            const updated = result.successCount?.updated || 0;
            const errs = result.errors || [];
  
            if (errs.length > 0) {
              const modal = document.createElement('div');
              modal.className = 'modal-overlay';
              modal.innerHTML = `
                <div class="modal" style="max-width:500px">
                  <h3>导入完成（含 ${errs.length} 条错误）</h3>
                  <p>成功：新增 ${added}，更新 ${updated}</p>
                  <p style="color:var(--danger);margin-top:0.5rem">错误详情：</p>
                  <div style="max-height:200px;overflow-y:auto;font-size:12px;background:var(--gray-100);padding:0.5rem;border-radius:4px">
                    ${errs.map(err => `<div style="margin:0.25rem 0">${escapeHtml(err)}</div>`).join('')}
                  </div>
                  <div class="modal-actions" style="margin-top:1rem">
                    <button type="button" class="btn btn-primary btn-auto" id="import-modal-ok">确定</button>
                  </div>
                </div>
              `;
              document.body.appendChild(modal);
              modal.querySelector('#import-modal-ok').onclick = () => modal.remove();
            } else {
              alert(`导入完成：新增 ${added}，更新 ${updated}`);
            }
          } catch (err) {
            alert('导入失败：' + (err.message || '请检查文件格式'));
          }
        };
  
        // 全选当前页
        const checkAllEl = pageContent.querySelector('#student-check-all');
        if (checkAllEl) {
          checkAllEl.onchange = (e) => {
            currentPageIds.forEach(id => {
              if (e.target.checked) {
                selectedStudentIds.add(id);
              } else {
                selectedStudentIds.delete(id);
              }
            });
            updateSelectionDisplay();
          };
        }
  
        // 单个勾选
        pageContent.querySelectorAll('.student-check').forEach(el => {
          el.onchange = (e) => {
            const id = String(e.target.dataset.id);
            if (e.target.checked) {
              selectedStudentIds.add(id);
            } else {
              selectedStudentIds.delete(id);
            }
            updateSelectionDisplay();
          };
        });
  
        // 删除选中学生
        pageContent.querySelector('#delete-selected-students-btn').onclick = async () => {
          const ids = Array.from(selectedStudentIds).map(id => parseInt(id, 10));
  
          if (ids.length === 0) {
            alert('请先勾选要删除的学生');
            return;
          }
  
          const confirmed = confirm(
            `确定删除选中的 ${ids.length} 名学生吗？\n\n删除后，这些学生对应的积分记录和学期总分也会一并删除，且无法恢复。`
          );
  
          if (!confirmed) return;
  
          try {
            const result = await AdminAPI.deleteStudents(ids);
            selectedStudentIds.clear();
  
            if (page > 1 && items.length === ids.length) {
              page = page - 1;
            }
  
            await load();
            alert(result?.message || `删除成功，共删除 ${result?.deletedCount || ids.length} 名学生`);
          } catch (err) {
            alert(err.message || '删除失败');
          }
        };
  
        // 按班级批量删除学生
        pageContent.querySelector('#delete-by-class-btn').onclick = () => {
          showDeleteByClassesModal(classes || []);
        };
  
        // 分页
        pageContent.querySelectorAll('.pagination-btns button').forEach(btn => {
          if (!btn.disabled) {
            btn.onclick = async () => {
              page = parseInt(btn.dataset.page, 10);
              await load();
            };
          }
        });
  
        function updateSelectionDisplay() {
          const countEl = pageContent.querySelector('#selected-student-count');
          if (countEl) countEl.textContent = selectedStudentIds.size;
  
          const currentCheckboxes = pageContent.querySelectorAll('.student-check');
          const currentIds = Array.from(currentCheckboxes).map(el => String(el.dataset.id));
          const checkAll = pageContent.querySelector('#student-check-all');
  
          if (checkAll) {
            checkAll.checked =
              currentIds.length > 0 &&
              currentIds.every(id => selectedStudentIds.has(id));
          }
        }
      } catch (err) {
        pageContent.innerHTML = `<div class="error-message">${err.message}</div>`;
      }
    }
  
    function showDeleteByClassesModal(classes) {
      const modal = document.createElement('div');
      modal.className = 'modal-overlay';
  
      modal.innerHTML = `
        <div class="modal" style="max-width:560px">
          <h3>按班级批量删除</h3>
          <p style="margin:0.5rem 0 1rem;color:var(--gray-700)">
            请选择需要删除的班级。删除后，这些班级下的全部学生、对应班主任账号、积分记录以及班级本身都会一并删除，且无法恢复。
          </p>
  
          <div class="class-checkbox-list">
            ${classes.length > 0 ? classes.map(c => `
              <label class="check-item">
                <input type="checkbox" name="delete-class" value="${c.id}">
                <span>${escapeHtml(c.class_name)}</span>
              </label>
            `).join('') : '<div class="table-empty">暂无班级数据</div>'}
          </div>
  
          <div class="modal-actions equal-width">
            <button type="button" class="btn btn-outline btn-auto" id="delete-class-cancel">取消</button>
            <button type="button" class="btn btn-danger btn-auto" id="delete-class-confirm">删除选中班级学生</button>
          </div>
        </div>
      `;
  
      document.body.appendChild(modal);
  
      modal.querySelector('#delete-class-cancel').onclick = () => modal.remove();
  
      modal.querySelector('#delete-class-confirm').onclick = async () => {
        const checkedEls = Array.from(modal.querySelectorAll('input[name="delete-class"]:checked'));
        const classIds = checkedEls.map(el => parseInt(el.value, 10));
  
        if (classIds.length === 0) {
          alert('请先选择班级');
          return;
        }
  
        const selectedClassNames = classes
          .filter(c => classIds.includes(parseInt(c.id, 10)))
          .map(c => c.class_name);
  
        const confirmed = confirm(
          `确定删除以下班级下的全部学生吗？\n\n${selectedClassNames.join('、')}\n\n删除后，这些班级下的全部学生、对应班主任账号、积分记录以及班级本身都会一并删除，且无法恢复。`
        );
  
        if (!confirmed) return;
  
        try {
          const result = await AdminAPI.deleteStudentsByClasses(classIds);
          selectedStudentIds.clear();
          page = 1;
          modal.remove();
          await load();
          alert(result?.message || `删除成功`);
        } catch (err) {
          alert(err.message || '删除失败');
        }
      };
    }
  
    load();
  };

  // ==================== 学期管理 ====================
  window.renderSemesters = async function () {
    pageContent.innerHTML = '<div class="loading">加载中...</div>';
    try {
      let semesters = await AdminAPI.getSemesters();
      if (!Array.isArray(semesters)) semesters = [];

      pageContent.innerHTML = `
        <h1 class="page-title">学期管理</h1>
        <div class="card">
          <div class="toolbar">
            <button class="btn btn-primary" id="semester-add-btn">新增学期</button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th>学期名称</th><th>开始日期</th><th>结束日期</th><th>状态</th><th>操作</th></tr></thead>
              <tbody>
                ${semesters.map(s => `
                  <tr>
                    <td>${escapeHtml(s.semester_name)}</td>
                    <td>${formatDate(s.start_date)}</td>
                    <td>${formatDate(s.end_date)}</td>
                    <td>${s.is_active ? '<span style="color:var(--success)">已激活</span>' : '未激活'}</td>
                    <td>
                      ${!s.is_active ? `<button class="btn btn-primary btn-sm semester-activate" data-id="${s.id}">激活</button>` : ''}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      pageContent.querySelector('#semester-add-btn').onclick = showAddSemesterModal;
      pageContent.querySelectorAll('.semester-activate').forEach(btn => {
        btn.onclick = () => activateSemester(btn.dataset.id);
      });

      async function showAddSemesterModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal">
            <h3>新增学期</h3>
            <form id="add-semester-form">
              <div class="form-group"><label>学期名称</label><input name="semesterName" required placeholder="如 2025秋"></div>
              <div class="form-group"><label>开始日期</label><input type="date" name="startDate" required></div>
              <div class="form-group"><label>结束日期</label><input type="date" name="endDate" required></div>
              <div class="modal-actions">
                <button type="button" class="btn btn-outline" id="modal-cancel">取消</button>
                <button type="submit" class="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#modal-cancel').onclick = () => modal.remove();
        modal.querySelector('#add-semester-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          try {
            await AdminAPI.createSemester({
              semesterName: fd.get('semesterName'),
              startDate: fd.get('startDate'),
              endDate: fd.get('endDate')
            });
            modal.remove();
            window.renderSemesters();
            alert('创建成功');
          } catch (err) {
            alert(err.message);
          }
        };
      }

      async function activateSemester(id) {
        try {
          await AdminAPI.activateSemester(id);
          window.renderSemesters();
          alert('激活成功');
        } catch (err) {
          alert(err.message);
        }
      }
    } catch (err) {
      pageContent.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
  };

  // ==================== 班级管理 ====================
  window.renderClasses = async function () {
    pageContent.innerHTML = '<div class="loading">加载中...</div>';
    try {
      let classes = await AdminAPI.getClasses();
      if (!Array.isArray(classes)) classes = [];
      const teachers = await AdminAPI.getTeachers(1, 1000);
      const teacherList = teachers?.items || [];
      const classToTeacher = {};
      teacherList.forEach(t => { classToTeacher[t.class_id] = t.real_name; });

      pageContent.innerHTML = `
        <h1 class="page-title">班级管理</h1>
        <div class="card">
          <div class="toolbar">
            <button class="btn btn-primary" id="class-add-btn">新增班级</button>
            <button class="btn btn-primary" id="class-batch-btn">批量添加</button>
          </div>
          <div class="table-container">
            <table>
              <thead><tr><th>班级名称</th><th>班主任</th><th>操作</th></tr></thead>
              <tbody>
                ${classes.map(c => `
                  <tr>
                    <td>${escapeHtml(c.class_name)}</td>
                    <td>${escapeHtml(classToTeacher[c.id] || '-')}</td>
                    <td><button class="btn btn-danger btn-sm class-delete" data-id="${c.id}">删除</button></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      `;

      pageContent.querySelector('#class-add-btn').onclick = showAddClassModal;
      pageContent.querySelector('#class-batch-btn').onclick = showBatchAddClassModal;
      pageContent.querySelectorAll('.class-delete').forEach(btn => {
        btn.onclick = () => deleteClass(btn.dataset.id);
      });

      function showBatchAddClassModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal">
            <h3>批量添加班级</h3>
            <p style="font-size:13px;color:var(--gray-500);margin-bottom:1rem">班级号连续时使用。有前缀：2026+01～05 → 202601班～202605班；无前缀：663～730 → 663班、664班…730班</p>
            <form id="batch-class-form">
              <div class="form-group"><label>前缀</label><input name="prefix" placeholder="可留空"></div>
              <div class="form-group"><label>起始号</label><input type="text" name="start" required placeholder="请输入数字"></div>
              <div class="form-group"><label>结束号</label><input type="text" name="end" required placeholder="结束号必须大于起始号"></div>
              <div class="modal-actions">
                <button type="button" class="btn btn-outline" id="modal-cancel">取消</button>
                <button type="submit" class="btn btn-primary">批量创建</button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#modal-cancel').onclick = () => modal.remove();
        modal.querySelector('#batch-class-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          const prefix = String(fd.get('prefix') || '').trim();
          const start = String(fd.get('start') || '').trim();
          const end = String(fd.get('end') || '').trim();
          const startNum = parseInt(start, 10);
          const endNum = parseInt(end, 10);
          if (isNaN(startNum) || isNaN(endNum)) {
            alert('起始号、结束号必须为有效数字');
            return;
          }
          if (startNum > endNum) {
            alert('起始号不能大于结束号');
            return;
          }
          if (endNum - startNum > 50) {
            alert('单次最多添加50个班级');
            return;
          }
          try {
            const created = await AdminAPI.batchCreateClasses(prefix, start, end);
            modal.remove();
            window.renderClasses();
            alert(`成功创建 ${created.length} 个班级`);
          } catch (err) {
            alert(err.message);
          }
        };
      }

      function showAddClassModal() {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
          <div class="modal">
            <h3>新增班级</h3>
            <form id="add-class-form">
              <div class="form-group"><label>班级名称</label><input name="className" required placeholder="如 8年级1班"></div>
              <div class="modal-actions">
                <button type="button" class="btn btn-outline" id="modal-cancel">取消</button>
                <button type="submit" class="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        `;
        document.body.appendChild(modal);
        modal.querySelector('#modal-cancel').onclick = () => modal.remove();
        modal.querySelector('#add-class-form').onsubmit = async (e) => {
          e.preventDefault();
          const fd = new FormData(e.target);
          try {
            await AdminAPI.createClass({ className: fd.get('className') });
            modal.remove();
            window.renderClasses();
            alert('创建成功');
          } catch (err) {
            alert(err.message);
          }
        };
      }

      async function deleteClass(id) {
        if (!confirm('确定删除该班级？如有班主任或学生将无法删除。')) return;
        try {
          await AdminAPI.deleteClass(id);
          window.renderClasses();
          alert('删除成功');
        } catch (err) {
          alert(err.message);
        }
      }
    } catch (err) {
      pageContent.innerHTML = `<div class="error-message">${err.message}</div>`;
    }
  };

  // ==================== 积分数据 ====================
  window.renderScores = async function () {
    pageContent.innerHTML = '<div class="loading">加载中...</div>';
    let page = 1;
    const pageSize = 15;
    let classId = '';
    let semesterId = '';
    let search = '';

    async function load() {
      try {
        const params = { page, pageSize };
        if (classId) params.classId = classId;
        if (semesterId) params.semesterId = semesterId;
        if (search) params.search = search;

        const res = await AdminAPI.getScoreRecords(params);
        const items = res?.items || [];
        const pagination = res?.pagination || { total: 0, totalPages: 0 };
        const [classes, semesters] = await Promise.all([AdminAPI.getClasses(), AdminAPI.getSemesters()]);

        pageContent.innerHTML = `
          <h1 class="page-title">积分数据</h1>
          <div class="card">
            <div class="toolbar">
              <div class="form-group">
                <select id="score-class-filter">
                  <option value="">全部班级</option>
                  ${(classes || []).map(c => `<option value="${c.id}" ${c.id == classId ? 'selected' : ''}>${escapeHtml(c.class_name)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <select id="score-semester-filter">
                  <option value="">全部学期</option>
                  ${(semesters || []).map(s => `<option value="${s.id}" ${s.id == semesterId ? 'selected' : ''}>${escapeHtml(s.semester_name)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <input type="text" id="score-search" placeholder="学生姓名/学号" value="${escapeHtml(search)}">
              </div>
              <div class="form-group">
                <select id="score-export-type">
                  <option value="records">积分记录</option>
                  <option value="scores">学生总分</option>
                </select>
              </div>
              <button class="btn btn-primary" id="score-search-btn">搜索</button>
              <button class="btn btn-primary" id="score-export-btn">导出Excel</button>
            </div>
            <div class="table-container">
              <table>
                <thead><tr><th>学号</th><th>学生</th><th>班级</th><th>理由</th><th>分值</th><th>时间</th><th>操作人</th></tr></thead>
                <tbody>
                  ${items.map(r => `
                    <tr>
                      <td>${escapeHtml(r.student_number)}</td>
                      <td>${escapeHtml(r.student_name)}</td>
                      <td>${escapeHtml(r.class_name || '-')}</td>
                      <td>${escapeHtml(r.reason || '-')}</td>
                      <td class="${r.score_change >= 0 ? 'positive' : 'negative'}">${r.score_change >= 0 ? '+' : ''}${r.score_change}</td>
                      <td>${formatDateTime(r.created_at)}</td>
                      <td>${escapeHtml(r.teacher_name || '-')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <span class="pagination-info">共 ${pagination.total} 条</span>
              <div class="pagination-btns">
                <button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>
                <button ${page >= pagination.totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>
              </div>
            </div>
          </div>
        `;

        pageContent.querySelector('#score-class-filter').onchange = (e) => { classId = e.target.value; page = 1; load(); };
        pageContent.querySelector('#score-semester-filter').onchange = (e) => { semesterId = e.target.value; page = 1; load(); };
        pageContent.querySelector('#score-search-btn').onclick = () => { search = pageContent.querySelector('#score-search').value.trim(); page = 1; load(); };
        pageContent.querySelector('#score-export-btn').onclick = async () => {
          try {
            const exportType = pageContent.querySelector('#score-export-type').value;
            const searchValue = pageContent.querySelector('#score-search').value.trim();
            const params = {};
            if (classId) params.classId = classId;
            if (semesterId) params.semesterId = semesterId;
            if (searchValue) params.search = searchValue;
            if (exportType === 'scores') {
              await AdminAPI.exportStudents(classId, semesterId, searchValue);
            } else {
              await AdminAPI.exportRecords(params);
            }
            alert('导出成功');
          } catch (err) { alert(err.message); }
        };
        pageContent.querySelectorAll('.pagination-btns button').forEach(btn => {
          if (!btn.disabled) btn.onclick = () => { page = parseInt(btn.dataset.page); load(); };
        });
      } catch (err) {
        pageContent.innerHTML = `<div class="error-message">${err.message}</div>`;
      }
    }

    load();
  };

  // ==================== 操作日志 ====================
  window.renderLogs = async function () {
    pageContent.innerHTML = '<div class="loading">加载中...</div>';
    let page = 1;
    const pageSize = 15;

    async function load() {
      try {
        const res = await AdminAPI.getOperationLogs({ page, pageSize });
        const items = res?.items || [];
        const pagination = res?.pagination || { total: 0, totalPages: 0 };

        pageContent.innerHTML = `
          <h1 class="page-title">操作日志</h1>
          <div class="card">
            <div class="table-container">
              <table>
                <thead><tr><th>时间</th><th>操作类型</th><th>详情</th></tr></thead>
                <tbody>
                  ${items.length ? items.map(l => `
                    <tr>
                      <td>${formatDateTime(l.created_at)}</td>
                      <td>${escapeHtml(l.operation_type || '-')}</td>
                      <td>${l.operation_details ? (typeof l.operation_details === 'string' ? escapeHtml(l.operation_details) : escapeHtml(JSON.stringify(l.operation_details))) : '-'}</td>
                    </tr>
                  `).join('') : '<tr><td colspan="3" class="empty-state">暂无日志</td></tr>'}
                </tbody>
              </table>
            </div>
            <div class="pagination">
              <span class="pagination-info">共 ${pagination.total} 条</span>
              <div class="pagination-btns">
                <button ${page <= 1 ? 'disabled' : ''} data-page="${page - 1}">上一页</button>
                <button ${page >= pagination.totalPages ? 'disabled' : ''} data-page="${page + 1}">下一页</button>
              </div>
            </div>
          </div>
        `;

        pageContent.querySelectorAll('.pagination-btns button').forEach(btn => {
          if (!btn.disabled) btn.onclick = () => { page = parseInt(btn.dataset.page); load(); };
        });
      } catch (err) {
        pageContent.innerHTML = `<div class="error-message">${err.message}</div>`;
      }
    }

    load();
  };
})();
