document.addEventListener('DOMContentLoaded', () => {
  const root = document.getElementById('demo-root');
  root.innerHTML = `
    <div class="alert alert-info">
      <strong>Presentation demo mode.</strong> Use the demo accounts below to walk through the full PeerScholars workflow. Data is stored locally in your browser for this demo.
    </div>

    <div class="dash-panel">
      <h2>Demo accounts</h2>
      <table class="data-table">
        <thead><tr><th>Role</th><th>Email</th><th>Password</th><th>Dashboard</th></tr></thead>
        <tbody>
          <tr><td>Parent</td><td>parent@demo.com</td><td>demo123</td><td><a href="login.html">Log in</a></td></tr>
          <tr><td>Tutor (verified)</td><td>tutor@demo.com</td><td>demo123</td><td><a href="login.html">Log in</a></td></tr>
          <tr><td>Admin</td><td>admin@peerscholars.com</td><td>admin123</td><td><a href="login.html">Log in</a></td></tr>
        </tbody>
      </table>
      <div class="btn-row" style="margin-top:1rem;">
        <button class="btn btn-secondary" id="reset-demo">Reset demo data</button>
      </div>
    </div>

    <div class="dash-panel">
      <h2>Complete workflow (present in this order)</h2>
      <div class="demo-steps">
        <article class="demo-step"><h3>Parent submits tutoring request</h3><p>Log in as parent@demo.com — view student profile and pending match suggestions at $12.99/hour.</p></article>
        <article class="demo-step"><h3>Admin finds compatible tutors</h3><p>Log in as admin — Matching tab — review suggested tutors by subject, grade, availability, and interests.</p></article>
        <article class="demo-step"><h3>Parent views tutor profile &amp; approves</h3><p>Parent dashboard — review tutor bio, grade, school, subjects — select and approve tutor.</p></article>
        <article class="demo-step"><h3>Admin schedules session</h3><p>Admin — Sessions tab — schedule with Google Meet link or approved public location.</p></article>
        <article class="demo-step"><h3>Parent &amp; tutor view meeting link</h3><p>Both dashboards show the private Google Meet link for online sessions.</p></article>
        <article class="demo-step"><h3>Tutor completes session report</h3><p>Log in as tutor@demo.com — submit a short progress report after the session.</p></article>
        <article class="demo-step"><h3>Parent sees report on dashboard</h3><p>Parent dashboard — session reports, attendance, and progress update.</p></article>
        <article class="demo-step"><h3>Tutor verification (new applicants)</h3><p>Admin — Verification tab — review school document, interview notes, parent confirmation, approve verified badge.</p></article>
      </div>
    </div>
  `;

  document.getElementById('reset-demo')?.addEventListener('click', () => {
    if (confirm('Reset all demo data to the default sample workflow?')) {
      PSStore.resetDemoData();
      alert('Demo data reset. Use the demo accounts to log in again.');
      location.reload();
    }
  });
});
