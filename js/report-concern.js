document.addEventListener('DOMContentLoaded', () => {
  const user = PSStore.getCurrentUser();
  const form = document.getElementById('report-form');
  const success = document.getElementById('report-success');

  if (!user) {
    document.getElementById('report-login-note').hidden = false;
  }

  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    PSStore.createSafetyReport({
      reporterId: user?.id || 'anonymous',
      reporterRole: user?.role || fd.get('reporter-role') || 'Guest',
      reporterEmail: user?.email || fd.get('email'),
      type: fd.get('type'),
      description: fd.get('description'),
    });
    PSUtils.notifySupport('PeerScholars Safety Report', Object.fromEntries(fd));
    form.hidden = true;
    success.hidden = false;
  });
});
