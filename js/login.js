document.addEventListener('DOMContentLoaded', () => {
  PSAuth.redirectIfLoggedIn();

  const form = document.getElementById('login-form');
  const errorEl = document.getElementById('login-error');

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const result = PSStore.login(fd.get('email'), fd.get('password'));
    if (!result || result.error) {
      errorEl.textContent = result?.error || 'Invalid email or password.';
      errorEl.hidden = false;
      return;
    }
    window.location.href = PSAuth.dashboardUrl(result.role);
  });
});
