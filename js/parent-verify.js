document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('verify-root');
  if (!root) return;

  root.innerHTML = `
    <div class="dash-panel">
      <div class="alert alert-success">
        <h2 style="margin:0 0 0.5rem;font-size:1.15rem;">Parent confirmation is no longer required</h2>
        <p style="margin:0;">Tutor signup no longer asks for parent or guardian information. PeerScholars reviews tutor applications directly.</p>
      </div>
      <p style="margin-top:1rem;"><a href="index.html" class="btn btn-primary">Return to Home</a></p>
    </div>`;
});
