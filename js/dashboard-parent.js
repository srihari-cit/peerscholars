document.addEventListener('DOMContentLoaded', () => {
  const user = PSAuth.requireRole(['parent']);
  if (!user) return;

  const state = PSStore.getState();
  const students = PSStore.getStudentsByParent(user.id);
  const student = students[0];
  const requests = state.tutoringRequests.filter((r) => r.parentUserId === user.id);
  const matches = state.matches.filter((m) => m.parentUserId === user.id);
  const sessions = state.sessions.filter((s) => s.parentUserId === user.id);
  const reports = state.sessionReports;

  const welcome = new URLSearchParams(window.location.search).get('welcome');
  const root = document.getElementById('dashboard-root');

  function renderSuggestedTutors() {
    const request = requests.find((r) => r.status === 'pending') || requests[0];
    if (!request) return '<p class="field-hint">No active tutoring request.</p>';

    const existingMatchTutorIds = matches.map((m) => m.tutorProfileId);
    const suggestions = PSMatching.findMatches(request, PSStore.getVerifiedTutors(), 5);

    if (!suggestions.length) {
      return `<p class="field-hint">We're reviewing your request. An admin will suggest verified tutors soon.</p>`;
    }

    return `<div class="tutor-card-grid">${suggestions
      .map(({ tutor, score }) => {
        const already = matches.find((m) => m.tutorProfileId === tutor.id);
        const pub = PSStore.getTutorPublicProfile(tutor);
        const badge = pub.verified ? '<span class="verified-badge">Verified Tutor ✓</span>' : '';
        return `<article class="tutor-card">
          <h3>${PSUtils.esc(pub.firstName)} ${badge}</h3>
          <p class="tutor-card-meta">
            Grade ${PSUtils.esc(pub.grade)} · ${PSUtils.esc(pub.school)}<br>
            Subjects: ${PSUtils.esc(pub.subjects)}<br>
            ${PSUtils.esc(pub.bio || '')}<br>
            Interests: ${PSUtils.esc(pub.interests || '—')}
          </p>
          ${
            already?.status === 'approved'
              ? '<p class="alert-success" style="margin:0.75rem 0 0;padding:0.5rem;">You approved this tutor.</p>'
              : `<button class="btn btn-primary btn-small" data-select-tutor="${tutor.id}" data-request="${request.id}">Select &amp; Approve Tutor</button>`
          }
        </article>`;
      })
      .join('')}</div>`;
  }

  function renderSessions() {
    if (!sessions.length) return '<p class="field-hint">No sessions scheduled yet.</p>';
    return `<table class="data-table"><thead><tr><th>Date</th><th>Subject</th><th>Mode</th><th>Status</th><th>Details</th></tr></thead><tbody>
      ${sessions
        .map((s) => {
          const tutor = state.tutorProfiles.find((t) => t.id === s.tutorProfileId);
          const report = reports.find((r) => r.sessionId === s.id);
          let details = '';
          if (s.mode === 'Online' && s.status !== 'Cancelled') {
            details = `<a href="${PSUtils.esc(s.meetingLink)}" target="_blank" rel="noopener">Google Meet link</a>`;
          } else if (s.mode === 'In-person') {
            details = PSUtils.esc(s.location || 'Approved public location');
          }
          if (report) {
            details += `<br><small>Report: ${PSUtils.esc(report.topic)}</small>`;
          }
          return `<tr>
            <td>${PSUtils.formatDate(s.date)} ${PSUtils.formatTime(s.startTime)}</td>
            <td>${PSUtils.esc(s.subject)}</td>
            <td>${PSUtils.esc(s.mode)}</td>
            <td>${PSUtils.badge(s.status, s.status === 'Completed' ? 'green' : 'blue')}</td>
            <td>${details}</td>
          </tr>`;
        })
        .join('')}
    </tbody></table>`;
  }

  root.innerHTML = `
    ${welcome ? '<div class="alert alert-success">Welcome! Your account is ready. We\'ll help you find a verified tutor.</div>' : ''}
    <div class="dash-stats-row">
      <div class="dash-stat"><div class="num">${sessions.filter((s) => s.status === 'Scheduled').length}</div><div class="lbl">Upcoming sessions</div></div>
      <div class="dash-stat"><div class="num">${sessions.filter((s) => s.status === 'Completed').length}</div><div class="lbl">Completed</div></div>
      <div class="dash-stat"><div class="num">$${PS_CONFIG.PARENT_RATE}</div><div class="lbl">Rate per hour</div></div>
      <div class="dash-stat"><div class="num">${matches.filter((m) => m.status === 'approved').length}</div><div class="lbl">Approved tutors</div></div>
    </div>

    <div class="dash-panel">
      <h2>Your student</h2>
      ${
        student
          ? `<p><strong>${PSUtils.esc(student.firstName)}</strong> · Grade ${PSUtils.esc(student.grade)} · ${PSUtils.esc(student.subjects)}</p>
             <p class="field-hint">${PSUtils.esc(student.notes || '')}</p>`
          : '<p class="field-hint">No student profile yet.</p>'
      }
    </div>

    <div class="dash-panel" id="matched-tutors">
      <h2>Matched tutors — parent approval required</h2>
      <p class="field-hint">Review tutor profiles below. Only you can approve a tutor for your child.</p>
      ${renderSuggestedTutors()}
    </div>

    <div class="dash-panel">
      <h2>Upcoming &amp; past sessions</h2>
      ${renderSessions()}
    </div>

    <div class="dash-panel">
      <h2>Session reports &amp; progress</h2>
      ${
        reports.filter((r) => sessions.some((s) => s.id === r.sessionId))
          .map(
            (r) => `<div style="margin-bottom:0.75rem;padding-bottom:0.75rem;border-bottom:1px solid var(--gray-100);">
              <strong>${PSUtils.esc(r.subject)} — ${PSUtils.esc(r.topic)}</strong>
              <p class="field-hint">Understood: ${PSUtils.esc(r.understood)}</p>
              <p class="field-hint">Needs practice: ${PSUtils.esc(r.practice)}</p>
            </div>`
          )
          .join('') || '<p class="field-hint">Reports appear here after completed sessions.</p>'
      }
    </div>

    <div class="dash-panel">
      <a href="report-concern.html" class="btn btn-secondary">Report a Concern</a>
    </div>
  `;

  root.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-select-tutor]');
    if (!btn) return;
    const tutorProfileId = btn.dataset.selectTutor;
    const requestId = btn.dataset.request;
    const studentId = student?.id;
    if (!studentId) return;

    let match = matches.find((m) => m.tutorProfileId === tutorProfileId);
    if (!match) {
      match = PSStore.createMatch(requestId, tutorProfileId, studentId, user.id);
    }
    PSStore.approveMatch(match.id);
    location.reload();
  });
});
