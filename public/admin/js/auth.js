/**
 * 认证管理模块
 */

const AUTH = {
  // 初始化
  init() {
    this.checkAuth();
  },

  // 设置认证信息
  setAuth(token, user) {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('admin_user', JSON.stringify(user));
  },

  // 清除认证信息
  clearAuth() {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    const loginPage = document.getElementById('login-page');
    const mainLayout = document.getElementById('main-layout');
    if (loginPage) loginPage.classList.remove('hidden');
    if (mainLayout) mainLayout.classList.add('hidden');
    const form = document.getElementById('login-form');
    if (form) form.reset();
  },

  // 显示登录页
  showLoginPage() {
    const loginPage = document.getElementById('login-page');
    const mainLayout = document.getElementById('main-layout');
    if (loginPage) loginPage.classList.remove('hidden');
    if (mainLayout) mainLayout.classList.add('hidden');
    const form = document.getElementById('login-form');
    if (form) form.reset();
    const errEl = document.getElementById('login-error');
    if (errEl) errEl.style.display = 'none';
  },

  // 显示已登录
  showLoggedIn(user) {
    const loginPage = document.getElementById('login-page');
    const mainLayout = document.getElementById('main-layout');
    const sidebarUser = document.getElementById('sidebar-user');
    if (loginPage) loginPage.classList.add('hidden');
    if (mainLayout) mainLayout.classList.remove('hidden');
    if (sidebarUser) sidebarUser.textContent = `${user.real_name || user.username}`;
  },

  // 检查认证状态
  checkAuth() {
    const token = localStorage.getItem('admin_token');
    const user = localStorage.getItem('admin_user');

    if (token && user) {
      try {
        this.showLoggedIn(JSON.parse(user));
      } catch (err) {
        this.showLoginPage();
      }
    } else {
      this.showLoginPage();
    }
  },

  // 获取 token
  getToken() {
    return localStorage.getItem('admin_token');
  },

  // 获取用户信息
  getUser() {
    const user = localStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  // 检查是否已登录
  isLoggedIn() {
    return !!localStorage.getItem('admin_token');
  }
};

// 初始化认证
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    AUTH.init();
  });
} else {
  AUTH.init();
}
