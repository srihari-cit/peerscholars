/** Auth helpers and route guards */
window.PSAuth = {
  requireRole(roles, redirectTo = 'login.html') {
    const user = PSStore.getCurrentUser();
    if (!user || !roles.includes(user.role)) {
      window.location.href = redirectTo;
      return null;
    }
    return user;
  },

  redirectIfLoggedIn() {
    const user = PSStore.getCurrentUser();
    if (!user) return;
    const map = {
      parent: 'parent-dashboard.html',
      tutor: 'tutor-dashboard.html',
      admin: 'admin-dashboard.html',
    };
    if (map[user.role]) window.location.href = map[user.role];
  },

  dashboardUrl(role) {
    return (
      { parent: 'parent-dashboard.html', tutor: 'tutor-dashboard.html', admin: 'admin-dashboard.html' }[
        role
      ] || 'index.html'
    );
  },

  updateNav() {
    const user = PSStore.getCurrentUser();
    document.querySelectorAll('[data-auth="guest"]').forEach((el) => {
      el.hidden = !!user;
    });
    document.querySelectorAll('[data-auth="user"]').forEach((el) => {
      el.hidden = !user;
    });
    const label = document.querySelector('[data-auth-user-label]');
    if (label && user) {
      label.textContent = user.firstName || user.email;
    }
    const dashLink = document.querySelector('[data-auth-dashboard]');
    if (dashLink && user) {
      dashLink.href = this.dashboardUrl(user.role);
      dashLink.textContent =
        user.role === 'admin'
          ? 'Admin'
          : user.role === 'tutor'
            ? 'Tutor Dashboard'
            : 'Parent Dashboard';
    }
  },

  logout() {
    PSStore.logout();
    window.location.href = 'index.html';
  },
};

document.addEventListener('DOMContentLoaded', () => {
  PSAuth.updateNav();
  document.querySelector('[data-logout]')?.addEventListener('click', (e) => {
    e.preventDefault();
    PSAuth.logout();
  });
});
