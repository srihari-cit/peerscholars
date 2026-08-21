document.addEventListener('DOMContentLoaded', () => {
  const user = PSAuth.requireRole(['tutor']);
  if (!user) return;

  const tutor = PSStore.getTutorByUserId(user.id);
  const root = document.getElementById('dashboard-root');
  const welcome = new URLSearchParams(window.location.search).get('welcome');

  if (!tutor) {
    root.innerHTML = '<div class="alert alert-warn">No tutor profile found. Please complete your application.</div>';
    return;
  }

  const state = PSStore.getState();
  const sessions = state.sessions.filter((s) => s.tutorProfileId === tutor.id);
  const reports = state.sessionReports.filter((r) => r.tutorProfileId === tutor.id);
  const payments = state.payments.filter((p) =>
    sessions.some((s) => s.id === p.sessionId && s.status === 'Completed')
  );
  const earnings = payments.reduce((sum, p) => sum + (p.tutorAmount || 0), 0);
  const stage = PSUtils.tutorVerificationStage(tutor);

  const stages = PS_CONFIG.VERIFICATION_STAGES.map((name) => {
    const order = PS_CONFIG.VERIFICATION_STAGES.indexOf(stage);
    const idx = PS_CONFIG.VERIFICATION_STAGES.indexOf(name);
    let cls = 'status-pending';
    if (idx < order) cls = 'status-done';
    if (idx === order) cls = 'status-current';
    if (tutor.verified && name === 'Verified') cls = 'status-done';
    return `<li><span>${PSUtils.esc(name)}</span><span class="${cls}">${idx < order || (tutor.verified && name === 'Verified') ? '✓' : idx === order ? '…' : '—'}</span></li>`;
  }).join('');

  root.innerHTML = `
    ${welcome ? '<div class="alert alert-success">Application submitted! We’ll review it shortly — accept the Code of Conduct below when you’re ready.</div>' : ''}
    ${tutor.suspended ? '<div class="alert alert-error">Your account is suspended. Contact support@peerscholars.com.</div>' : ''}
    ${tutor.verified ? `<div class="alert alert-success">${PSUtils.verifiedTutorBadge()} You can receive matches and teach sessions.</div>` : ''}

    <div class="dash-stats-row">
      <div class="dash-stat"><div class="num">${tutor.verified ? '✓' : '…'}</div><div class="lbl">Verification</div></div>
      <div class="dash-stat"><div class="num">${sessions.filter((s) => s.status === 'Scheduled').length}</div><div class="lbl">Upcoming</div></div>
      <div class="dash-stat"><div class="num">${sessions.filter((s) => s.status === 'Completed').length}</div><div class="lbl">Completed</div></div>
      <div class="dash-stat"><div class="num">$${earnings.toFixed(2)}</div><div class="lbl">Earnings ($9/hr)</div></div>
    </div>

    <div class="dash-panel">
      <h2>Verification progress</h2>
      <p class="field-hint">Current stage: <strong>${PSUtils.esc(stage)}</strong></p>
      <ul class="status-list">${stages}</ul>
      <div style="margin-top:1rem;">
        <p><strong>Admin review:</strong> ${PSUtils.esc(tutor.adminDecision || 'Pending')}</p>
        <p><strong>Code of Conduct:</strong> ${tutor.codeOfConductAccepted ? 'Accepted' : 'Not yet accepted'}</p>
      </div>
    </div>

    ${
      !tutor.codeOfConductAccepted
        ? `<div class="dash-panel" id="conduct-panel">
            <h2>Tutor Code of Conduct</h2>
            <div class="conduct-box">${PSUtils.esc(PSUtils.CODE_OF_CONDUCT)}</div>
            <label style="display:flex;gap:0.5rem;margin:0.75rem 0;font-size:0.875rem;">
              <input type="checkbox" id="accept-conduct"> I accept the PeerScholars Tutor Code of Conduct.
            </label>
            <button class="btn btn-primary" id="accept-conduct-btn">Accept Code of Conduct</button>
          </div>`
        : ''
    }

    <div class="dash-panel">
      <h2>Your profile</h2>
      <p>${PSUtils.esc(tutor.subjects)} · Grades ${PSUtils.esc((tutor.gradesCanTeach || []).join(', '))}</p>
      <p class="field-hint">Capacity: ${tutor.activeStudentCount ?? 0} / ${tutor.weeklyCapacity >= 6 ? '6+' : tutor.weeklyCapacity ?? 4} students this week</p>
      <p class="field-hint">${PSUtils.esc(tutor.bio || '')}</p>
      <p class="field-hint">Available: ${PSUtils.esc(tutor.availability || '—')}</p>
      <p class="field-hint">Format: Online · Google Meet</p>
    </div>

    ${renderTutorMatchRequests(tutor, state)}

    ${renderTutorSessionConfirmPanel(sessions)}

    <div class="dash-panel">
      <h2>Upcoming sessions</h2>
      ${
        sessions.filter((s) => s.status === 'Scheduled').length
          ? sessions
              .filter((s) => s.status === 'Scheduled')
              .map(
                (s) => `<div style="margin-bottom:0.75rem;">
                  <strong>${PSUtils.formatDate(s.date)} · ${PSUtils.esc(s.subject)}</strong>
                  ${s.meetingLink ? `<br><a href="${PSUtils.esc(s.meetingLink)}" target="_blank" rel="noopener">Open Google Meet</a>` : ''}
                </div>`
              )
              .join('')
          : '<p class="field-hint">No upcoming sessions.</p>'
      }
    </div>

    <div class="dash-panel" id="reports-panel">
      <h2>Session reports</h2>
      ${renderReportForm(sessions)}
      ${reports.length ? `<hr style="margin:1rem 0;border:none;border-top:1px solid var(--gray-200);"><h3>Submitted reports</h3>${reports.map((r) => `<p><strong>${PSUtils.esc(r.topic)}</strong> — ${PSUtils.esc(r.understood)}</p>`).join('')}` : ''}
    </div>

    <div class="dash-panel">
      <a href="report-concern.html" class="btn btn-secondary">Report a Concern</a>
    </div>
  `;

  document.getElementById('accept-conduct-btn')?.addEventListener('click', () => {
    if (!document.getElementById('accept-conduct')?.checked) {
      alert('Please check the box to accept the Code of Conduct.');
      return;
    }
    PSStore.acceptCodeOfConduct(tutor.id);
    location.reload();
  });

  root.addEventListener('click', (e) => {
    const acceptBtn = e.target.closest('[data-accept-match]');
    const declineBtn = e.target.closest('[data-decline-match]');
    const confirmBtn = e.target.closest('[data-tutor-confirm-session]');
    const disputeBtn = e.target.closest('[data-tutor-dispute-session]');
    if (acceptBtn) {
      PSStore.tutorAcceptMatch(acceptBtn.dataset.acceptMatch);
      location.reload();
    }
    if (declineBtn) {
      PSStore.tutorDeclineMatch(declineBtn.dataset.declineMatch);
      alert('Match declined. The student will see other recommended tutors.');
      location.reload();
    }
    if (confirmBtn) {
      PSStore.tutorConfirmSession(confirmBtn.dataset.tutorConfirmSession);
      const session = PSStore.getState().sessions.find((s) => s.id === confirmBtn.dataset.tutorConfirmSession);
      alert(
        session?.paymentStatus === 'paid'
          ? 'Both confirmed! Payment recorded — you will receive $9 for this session.'
          : 'Thank you! Waiting for the parent to confirm. You earn $9 after both confirm.'
      );
      location.reload();
    }
    if (disputeBtn) {
      if (!confirm('Report an issue with this session? Payment will be held while PeerScholars reviews.')) return;
      PSStore.disputeSession(disputeBtn.dataset.tutorDisputeSession, 'tutor');
      alert('Issue reported. PeerScholars will follow up.');
      location.reload();
    }
  });
});

function renderTutorSessionConfirmPanel(sessions) {
  const pending = sessions.filter(
    (s) =>
      s.status !== 'Disputed' &&
      s.paymentStatus !== 'paid' &&
      (PSUtils.sessionCanConfirm(s, 'tutor') || s.status === 'Awaiting Confirmation' || s.status === 'Scheduled')
  );
  if (!pending.length) return '';
  return `<div class="dash-panel session-confirm-panel">
    <h2>Confirm completed sessions</h2>
    <p class="field-hint">You earn <strong>$9</strong> only after <strong>you and the parent both</strong> confirm the session happened.</p>
    ${pending
      .map((s) => {
        const canConfirm = PSUtils.sessionCanConfirm(s, 'tutor');
        return `<div class="session-confirm-card">
          <p><strong>${PSUtils.formatDate(s.date)} · ${PSUtils.formatTime(s.startTime)}</strong> · ${PSUtils.esc(s.subject)}</p>
          <p class="field-hint">${PSUtils.sessionConfirmNote(s)}</p>
          <p class="session-confirm-status">
            <span class="${s.parentConfirmed ? 'confirm-yes' : 'confirm-no'}">Parent ${s.parentConfirmed ? '✓' : '…'}</span>
            <span class="${s.tutorConfirmed ? 'confirm-yes' : 'confirm-no'}">Tutor ${s.tutorConfirmed ? '✓' : '…'}</span>
          </p>
          ${
            canConfirm
              ? `<div class="btn-row">
                  <button type="button" class="btn btn-primary btn-small" data-tutor-confirm-session="${s.id}">Yes — session happened</button>
                  <button type="button" class="btn btn-secondary btn-small" data-tutor-dispute-session="${s.id}">Report an issue</button>
                </div>`
              : ''
          }
        </div>`;
      })
      .join('')}
  </div>`;
}

function renderTutorMatchRequests(tutor, state) {
  const pending = PSStore.getPendingMatchesForTutor(tutor.id);
  if (!pending.length) return '';
  return `<div class="dash-panel"><h2>New PeerScholars tutoring requests</h2>
    ${pending.map((m) => {
      const student = state.students.find((s) => s.id === m.studentId);
      const req = state.tutoringRequests.find((r) => r.id === m.requestId);
      const shared = (m.sharedInterests || []).map((id) => PSInterests.labelFor(id)).join(', ') || '—';
      return `<div class="match-request-card" style="margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid var(--gray-100);">
        <p><strong>Grade ${PSUtils.esc(student?.grade || req?.grade)}</strong> · ${PSUtils.esc(req?.subjects || student?.subjects)}</p>
        <p class="field-hint">Preferred schedule: ${PSUtils.esc(student?.availability || req?.availability || '—')}</p>
        <p class="field-hint">Format: Online · Google Meet</p>
        <p class="field-hint">Shared interests: ${PSUtils.esc(shared)}</p>
        <div class="btn-row">
          <button class="btn btn-primary btn-small" data-accept-match="${m.id}">Accept Match</button>
          <button class="btn btn-secondary btn-small" data-decline-match="${m.id}">Decline</button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderReportForm(sessions) {
  const completed = sessions.filter(
    (s) => s.status === 'Completed' || s.status === 'Started'
  );
  const needsReport = completed.filter(
    (s) => !PSStore.getState().sessionReports.some((r) => r.sessionId === s.id)
  );

  if (!needsReport.length) {
    return '<p class="field-hint">Submit a report after each completed session (under 2 minutes).</p>';
  }

  const s = needsReport[0];
  return `<form id="session-report-form" class="inline-form">
    <p>Report for session on ${PSUtils.formatDate(s.date)}</p>
    <input type="hidden" name="sessionId" value="${s.id}">
    <input type="hidden" name="tutorProfileId" value="${s.tutorProfileId}">
    <div class="form-row"><label>Subject</label><input name="subject" value="${PSUtils.esc(s.subject)}" required></div>
    <div class="form-row"><label>Topic covered</label><input name="topic" required></div>
    <div class="form-row"><label>What the student understood</label><textarea name="understood" required rows="2"></textarea></div>
    <div class="form-row"><label>What needs more practice</label><textarea name="practice" required rows="2"></textarea></div>
    <div class="form-row"><label>Optional notes</label><textarea name="notes" rows="2"></textarea></div>
    <div class="form-row"><label>Duration (minutes)</label><input type="number" name="durationMinutes" value="${s.durationMinutes || 60}" min="15" max="180"></div>
    <button type="submit" class="btn btn-primary">Submit Session Report</button>
  </form>`;
}

document.addEventListener('submit', (e) => {
  if (e.target.id !== 'session-report-form') return;
  e.preventDefault();
  const fd = new FormData(e.target);
  PSStore.createSessionReport({
    sessionId: fd.get('sessionId'),
    tutorProfileId: fd.get('tutorProfileId'),
    subject: fd.get('subject'),
    topic: fd.get('topic'),
    understood: fd.get('understood'),
    practice: fd.get('practice'),
    notes: fd.get('notes') || '',
    durationMinutes: Number(fd.get('durationMinutes')) || 60,
  });
  const session = PSStore.getState().sessions.find((s) => s.id === fd.get('sessionId'));
  if (session && PSUtils.sessionCanConfirm(session, 'tutor')) {
    PSStore.tutorConfirmSession(session.id);
  }
  location.reload();
});
