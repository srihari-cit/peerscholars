document.addEventListener('DOMContentLoaded', () => {
  const token = new URLSearchParams(window.location.search).get('token');
  const root = document.getElementById('verify-root');

  if (!token) {
    root.innerHTML = '<div class="alert alert-error">Invalid verification link.</div>';
    return;
  }

  const record = PSStore.getState().parentVerifications.find((p) => p.token === token);
  if (!record) {
    root.innerHTML = '<div class="alert alert-error">This verification link is invalid or expired.</div>';
    return;
  }

  if (record.status === 'Confirmed') {
    root.innerHTML = '<div class="alert alert-success">Thank you — parent/guardian verification is already complete.</div>';
    return;
  }

  root.innerHTML = `
    <div class="dash-panel">
      <h2>Parent / Guardian Verification</h2>
      <p>Hello ${PSUtils.esc(record.parentName || 'Parent/Guardian')},</p>
      <p>Please confirm that you are the parent or guardian of this student and approve their application to tutor through PeerScholars.</p>
      <form id="parent-confirm-form">
        <label style="display:flex;gap:0.5rem;margin:1rem 0;font-size:0.9rem;">
          <input type="checkbox" required>
          I confirm that I am the parent/guardian of this student and approve their application to tutor through PeerScholars.
        </label>
        <button type="submit" class="btn btn-primary">Confirm approval</button>
      </form>
    </div>`;

  document.getElementById('parent-confirm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    PSStore.confirmParentVerification(token);
    root.innerHTML = '<div class="alert alert-success">Thank you! Parent/guardian verification is complete. The tutor application will continue to the next review step.</div>';
  });
});
