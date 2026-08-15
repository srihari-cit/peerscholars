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

  const tutor = PSStore.getTutorById(record.tutorProfileId);
  if (!tutor) {
    root.innerHTML = '<div class="alert alert-error">We could not find this tutor application.</div>';
    return;
  }

  const parentFirstName = record.parentFirstName || record.parentName?.split(' ')[0] || 'there';
  const parentDisplayName =
    tutor.parentName ||
    [tutor.parentFirstName, tutor.parentLastName].filter(Boolean).join(' ') ||
    record.parentName;

  if (record.status === 'Confirmed' || PSStore.isParentVerified(tutor)) {
    root.innerHTML = `
      <div class="dash-panel">
        <div class="alert alert-success">
          <h2 style="margin:0 0 0.5rem;font-size:1.15rem;">Thank you! Your confirmation has been received.</h2>
          <p style="margin:0;">PeerScholars will review the application and verification information before the tutor is approved.</p>
        </div>
      </div>`;
    return;
  }

  root.innerHTML = `
    <div class="dash-panel">
      <p class="eyebrow" style="margin:0 0 0.5rem;">PeerScholars Tutor Verification</p>
      <h1 style="margin:0 0 0.75rem;font-size:1.35rem;">Confirm Your Student's Tutor Application</h1>
      <p>Hello ${PSUtils.esc(parentFirstName)},</p>
      <p>Thank you for helping us verify ${PSUtils.esc(tutor.firstName)}'s PeerScholars application.</p>
      <p>Please review the information below and confirm that you are their parent or guardian and approve their application to become a PeerScholars tutor.</p>

      <div class="verify-info-card">
        <p><strong>Student name:</strong> ${PSUtils.esc(tutor.firstName)} ${PSUtils.esc(tutor.lastName)}</p>
        <p><strong>School:</strong> ${PSUtils.esc(tutor.school)}</p>
        <p><strong>Grade:</strong> ${PSUtils.esc(tutor.grade)}</p>
        <p><strong>Parent/Guardian:</strong> ${PSUtils.esc(parentDisplayName)}</p>
      </div>

      <form id="parent-confirm-form">
        <label class="verify-checkbox">
          <input type="checkbox" required>
          <span>I confirm that I am the parent or legal guardian of this student, that I am aware of their PeerScholars tutor application, and that I approve their participation as a PeerScholars tutor.</span>
        </label>
        <button type="submit" class="btn btn-primary btn-full">Confirm Tutor Application</button>
      </form>
    </div>`;

  document.getElementById('parent-confirm-form').addEventListener('submit', (e) => {
    e.preventDefault();
    PSStore.confirmParentVerification(token);
    root.innerHTML = `
      <div class="dash-panel">
        <div class="alert alert-success">
          <h2 style="margin:0 0 0.5rem;font-size:1.15rem;">Thank you! Your confirmation has been received.</h2>
          <p style="margin:0;">PeerScholars will review the application and verification information before the tutor is approved.</p>
        </div>
      </div>`;
  });
});
