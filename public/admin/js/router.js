/**
 * 路由管理模块
 */

const ROUTER = {
  currentRoute: 'dashboard',
  routes: {
    dashboard: 'renderDashboard',
    teachers: 'renderTeachers',
    students: 'renderStudents',
    semesters: 'renderSemesters',
    classes: 'renderClasses',
    scores: 'renderScores',
    logs: 'renderLogs'
  },

  // 处理路由
  handleRoute() {
    const hash = window.location.hash.replace('#/', '').split('?')[0] || 'dashboard';
    const funcName = this.routes[hash] || this.routes['dashboard'];
    
    if (window[funcName] && typeof window[funcName] === 'function') {
      try {
        // 更新活跃导航项
        document.querySelectorAll('.nav-item').forEach(item => {
          const route = item.getAttribute('data-route');
          if (route === hash) {
            item.classList.add('active');
          } else {
            item.classList.remove('active');
          }
        });
        
        this.currentRoute = hash;
        window[funcName]();
      } catch (err) {
        console.error(`渲染页面 ${hash} 失败:`, err);
        document.getElementById('page-content').innerHTML = `<div class="error-message">页面加载失败: ${err.message}</div>`;
      }
    }
  },

  // 初始化路由
  init() {
    // 点击导航项时处理路由
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const route = item.getAttribute('data-route');
        window.location.hash = `#/${route}`;
      });
    });

    // 监听 hash 变化
    window.addEventListener('hashchange', () => {
      this.handleRoute();
    });

    // 初始加载
    this.handleRoute();
  }
};

// 当 DOM 加载完成且 app.js 已加载时初始化路由
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    ROUTER.init();
  }, 100);
});
