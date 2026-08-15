document.addEventListener('DOMContentLoaded', () => {
  const user = PSAuth.requireRole(['admin']);
  if (!user) return;

  const tab = new URLSearchParams(window.location.search).get('tab') || 'applications';
  const root = document.getElementById('dashboard-root');
  const nav = document.getElementById('admin-nav');
  const state = PSStore.getState();

  const tabs = [
    ['applications', 'Applications'],
    ['verification', 'Verification'],
    ['matching', 'Matching'],
    ['sessions', 'Sessions'],
    ['safety', 'Safety'],
    ['payments', 'Payments'],
  ];

  nav.innerHTML = tabs
    .map(
      ([id, label]) =>
        `<li><a href="admin-dashboard.html?tab=${id}" class="${tab === id ? 'active' : ''}">${label}</a></li>`
    )
    .join('');

  switch (tab) {
    case 'verification':
      root.innerHTML = renderVerification(state);
      bindVerification(state);
      break;
    case 'matching':
      root.innerHTML = renderMatching(state);
      bindMatching(state);
      break;
    case 'sessions':
      root.innerHTML = renderSessions(state);
      bindSessions(state);
      break;
    case 'safety':
      root.innerHTML = renderSafety(state);
      bindSafety(state);
      break;
    case 'payments':
      root.innerHTML = renderPayments(state);
      break;
    default:
      root.innerHTML = renderApplications(state);
  }
});

function renderApplications(state) {
  const parents = state.users.filter((u) => u.role === 'parent');
  const tutors = state.tutorProfiles;
  return `
    <div class="dash-panel"><h2>Parent applications (${parents.length})</h2>
      <table class="data-table"><thead><tr><th>Name</th><th>Email</th><th>City</th><th>Students</th></tr></thead>
      <tbody>${parents.map((p) => {
        const kids = state.students.filter((s) => s.parentUserId === p.id);
        return `<tr><td>${PSUtils.esc(p.firstName)} ${PSUtils.esc(p.lastName)}</td><td>${PSUtils.esc(p.email)}</td><td>${PSUtils.esc(p.city)}, ${PSUtils.esc(p.state)}</td><td>${kids.map((k) => PSUtils.esc(k.firstName)).join(', ') || '—'}</td></tr>`;
      }).join('')}</tbody></table>
    </div>
    <div class="dash-panel"><h2>Tutor applications (${tutors.length})</h2>
      <table class="data-table"><thead><tr><th>Name</th><th>School</th><th>Stage</th><th>Verified</th><th></th></tr></thead>
      <tbody>${tutors.map((t) => `<tr>
        <td>${PSUtils.esc(t.firstName)} ${PSUtils.esc(t.lastName)}</td>
        <td>${PSUtils.esc(t.school)}</td>
        <td>${PSUtils.esc(PSUtils.tutorVerificationStage(t))}</td>
        <td>${t.verified ? PSUtils.badge('Verified ✓', 'green') : PSUtils.badge('Pending', 'blue')}</td>
        <td><a href="admin-dashboard.html?tab=verification&tutor=${t.id}">Review</a></td>
      </tr>`).join('')}</tbody></table>
    </div>`;
}

function renderVerification(state) {
  const params = new URLSearchParams(window.location.search);
  const tutorId = params.get('tutor');
  const tutor = state.tutorProfiles.find((t) => t.id === tutorId) || state.tutorProfiles[0];

  if (!tutor) return '<p class="field-hint">No tutor applications yet.</p>';

  return `
    <div class="dash-panel">
      <h2>Verify: ${PSUtils.esc(tutor.firstName)} ${PSUtils.esc(tutor.lastName)}</h2>
      <p>Grade ${PSUtils.esc(tutor.grade)} · ${PSUtils.esc(tutor.school)} · ${PSUtils.esc(tutor.city)}, ${PSUtils.esc(tutor.state)}</p>
      <p class="field-hint">Parent: ${PSUtils.esc(tutor.parentName)} (${PSUtils.esc(tutor.parentEmail)}) — <strong>${PSUtils.esc(tutor.parentVerificationStatus)}</strong></p>
    </div>

    <div class="dash-panel">
      <h3>School enrollment document</h3>
      <p>Status: <strong>${PSUtils.esc(tutor.schoolDocStatus)}</strong> ${tutor.schoolDocName ? `· ${PSUtils.esc(tutor.schoolDocName)}` : ''}</p>
      ${tutor.schoolDocData ? `<p><a href="${tutor.schoolDocData}" download="${PSUtils.esc(tutor.schoolDocName)}" class="btn btn-small btn-secondary">Download document (admin only)</a></p>` : '<p class="field-hint">No document uploaded.</p>'}
      <div class="btn-row" style="margin-top:0.75rem;">
        <button class="btn btn-small btn-primary" data-school-status="Under review">Mark under review</button>
        <button class="btn btn-small btn-green" data-school-status="Approved">Approve document</button>
        <button class="btn btn-small btn-secondary" data-school-status="Needs another document">Request new document</button>
        <button class="btn btn-small" style="background:#fdeeee;color:#9b2c2c;" data-school-status="Rejected">Reject</button>
      </div>
    </div>

    <div class="dash-panel">
      <h3>PeerScholars interview</h3>
      <div class="form-row"><label>Status</label>
        <select id="interview-status">
          ${['Not scheduled', 'Scheduled', 'Completed', 'Passed', 'Needs follow-up', 'Failed'].map((s) => `<option ${tutor.interviewStatus === s ? 'selected' : ''}>${s}</option>`).join('')}
        </select>
      </div>
      <div class="form-row"><label>Admin notes</label><textarea id="interview-notes" rows="4">${PSUtils.esc(tutor.interviewNotes || '')}</textarea></div>
      <p class="field-hint">Suggested questions: school, grade, subjects, why tutor, explain a concept, handling confusion, unknown answers, inappropriate behavior, missing parent, in-person safety.</p>
      <button class="btn btn-primary btn-small" id="save-interview">Save interview</button>
    </div>

    <div class="dash-panel">
      <h3>Final admin review</h3>
      <div class="btn-row">
        <button class="btn btn-green" data-final="Approved">Approve tutor</button>
        <button class="btn btn-secondary" data-final="Rejected">Reject</button>
        <button class="btn btn-secondary" data-suspend="true">Suspend tutor</button>
        <button class="btn btn-secondary" data-suspend="false">Reactivate tutor</button>
      </div>
      <p class="field-hint" style="margin-top:0.75rem;">Tutor becomes verified only when parent confirmed, school doc approved, interview passed, code of conduct accepted, and final review approved.</p>
    </div>

    <input type="hidden" id="current-tutor-id" value="${tutor.id}">
  `;
}

function bindVerification(state) {
  const tutorId = document.getElementById('current-tutor-id')?.value;
  if (!tutorId) return;

  document.querySelectorAll('[data-school-status]').forEach((btn) => {
    btn.addEventListener('click', () => {
      PSStore.adminUpdateTutor(tutorId, { schoolDocStatus: btn.dataset.schoolStatus });
      location.reload();
    });
  });

  document.getElementById('save-interview')?.addEventListener('click', () => {
    PSStore.adminUpdateTutor(tutorId, {
      interviewStatus: document.getElementById('interview-status').value,
      interviewNotes: document.getElementById('interview-notes').value,
    });
    location.reload();
  });

  document.querySelectorAll('[data-final]').forEach((btn) => {
    btn.addEventListener('click', () => {
      PSStore.adminUpdateTutor(tutorId, { finalReviewStatus: btn.dataset.final });
      location.reload();
    });
  });

  document.querySelectorAll('[data-suspend]').forEach((btn) => {
    btn.addEventListener('click', () => {
      PSStore.suspendTutor(tutorId, btn.dataset.suspend === 'true');
      location.reload();
    });
  });
}

function renderMatching(state) {
  const pending = state.tutoringRequests.filter((r) => r.status === 'pending');
  return `
    <div class="dash-panel"><h2>Student requests</h2>
      ${pending.length ? pending.map((r) => {
        const student = state.students.find((s) => s.id === r.studentId);
        const parent = state.users.find((u) => u.id === r.parentUserId);
        const suggestions = PSMatching.findMatches(r, PSStore.getVerifiedTutors(), 3);
        return `<div style="margin-bottom:1.25rem;padding-bottom:1rem;border-bottom:1px solid var(--gray-100);">
          <strong>${PSUtils.esc(student?.firstName || 'Student')}</strong> · Grade ${PSUtils.esc(r.grade)} · ${PSUtils.esc(r.subjects)}
          <p class="field-hint">Parent: ${PSUtils.esc(parent?.firstName || '')} · ${PSUtils.esc(r.mode)} · ${PSUtils.esc(r.city || '')}</p>
          <p>Suggested tutors:</p>
          <ul>${suggestions.map(({ tutor, score }) => `<li>${PSUtils.esc(tutor.firstName)} ${PSUtils.esc(tutor.lastName)} (score ${score}) <button class="btn btn-small btn-primary" data-create-match data-request="${r.id}" data-tutor="${tutor.id}" data-student="${r.studentId}" data-parent="${r.parentUserId}">Create match</button></li>`).join('') || '<li>No verified tutors match yet.</li>'}</ul>
        </div>`;
      }).join('') : '<p class="field-hint">No pending requests.</p>'}
    </div>
    <div class="dash-panel"><h2>Current matches</h2>
      <table class="data-table"><thead><tr><th>Student</th><th>Tutor</th><th>Status</th></tr></thead>
      <tbody>${state.matches.map((m) => {
        const student = state.students.find((s) => s.id === m.studentId);
        const tutor = state.tutorProfiles.find((t) => t.id === m.tutorProfileId);
        return `<tr><td>${PSUtils.esc(student?.firstName || '—')}</td><td>${PSUtils.esc(tutor?.firstName || '—')}</td><td>${PSUtils.badge(m.status, m.status === 'approved' ? 'green' : 'blue')}</td></tr>`;
      }).join('')}</tbody></table>
    </div>`;
}

function bindMatching(state) {
  document.querySelectorAll('[data-create-match]').forEach((btn) => {
    btn.addEventListener('click', () => {
      PSStore.createMatch(btn.dataset.request, btn.dataset.tutor, btn.dataset.student, btn.dataset.parent);
      location.reload();
    });
  });
}

function renderSessions(state) {
  return `
    <div class="dash-panel">
      <h2>Schedule a session</h2>
      <form id="schedule-form" class="inline-form">
        <div class="form-row"><label>Approved match</label>
          <select name="matchId" required>${state.matches.filter((m) => m.status === 'approved').map((m) => {
            const student = state.students.find((s) => s.id === m.studentId);
            const tutor = state.tutorProfiles.find((t) => t.id === m.tutorProfileId);
            return `<option value="${m.id}">${PSUtils.esc(student?.firstName)} + ${PSUtils.esc(tutor?.firstName)}</option>`;
          }).join('')}</select>
        </div>
        <div class="form-row"><label>Subject</label><input name="subject" required></div>
        <div class="form-row half"><div class="form-row" style="margin:0"><label>Date</label><input type="date" name="date" required></div>
        <div class="form-row" style="margin:0"><label>Start time</label><input type="time" name="startTime" required></div></div>
        <div class="form-row"><label>Duration (minutes)</label><input type="number" name="durationMinutes" value="60" min="30" max="180"></div>
        <div class="form-row"><label>Mode</label><select name="mode"><option>Online</option><option>In-person</option></select></div>
        <div class="form-row"><label>Google Meet link (online)</label><input name="meetingLink" placeholder="https://meet.google.com/..."></div>
        <div class="form-row"><label>Approved public location (in-person)</label>
          <select name="location">${PS_CONFIG.APPROVED_IN_PERSON_LOCATIONS.map((l) => `<option>${PSUtils.esc(l)}</option>`).join('')}</select>
        </div>
        <button type="submit" class="btn btn-primary">Schedule session</button>
      </form>
    </div>
    <div class="dash-panel"><h2>All sessions</h2>
      <table class="data-table"><thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Actions</th></tr></thead>
      <tbody>${state.sessions.map((s) => `<tr>
        <td>${PSUtils.formatDate(s.date)}</td><td>${PSUtils.esc(s.subject)}</td><td>${PSUtils.esc(s.status)}</td>
        <td><select data-session-status="${s.id}">${PS_CONFIG.SESSION_STATUSES.map((st) => `<option ${s.status === st ? 'selected' : ''}>${st}</option>`).join('')}</select></td>
      </tr>`).join('')}</tbody></table>
    </div>`;
}

function bindSessions(state) {
  document.getElementById('schedule-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const match = state.matches.find((m) => m.id === fd.get('matchId'));
    if (!match) return;
    const tutor = state.tutorProfiles.find((t) => t.id === match.tutorProfileId);
    if (!tutor?.verified) {
      alert('Cannot schedule with an unverified tutor.');
      return;
    }
    PSStore.createSession({
      matchId: match.id,
      studentId: match.studentId,
      tutorProfileId: match.tutorProfileId,
      parentUserId: match.parentUserId,
      subject: fd.get('subject'),
      date: fd.get('date'),
      startTime: fd.get('startTime'),
      durationMinutes: Number(fd.get('durationMinutes')) || 60,
      mode: fd.get('mode'),
      meetingLink: fd.get('mode') === 'Online' ? fd.get('meetingLink') : '',
      location: fd.get('mode') === 'In-person' ? fd.get('location') : '',
      status: 'Scheduled',
    });
    location.reload();
  });

  document.querySelectorAll('[data-session-status]').forEach((sel) => {
    sel.addEventListener('change', () => {
      PSStore.updateSession(sel.dataset.sessionStatus, { status: sel.value });
      if (sel.value === 'Completed') PSStore.recordPayment(sel.dataset.sessionStatus);
    });
  });
}

function renderSafety(state) {
  return `
    <div class="dash-panel"><h2>Safety reports</h2>
      ${state.safetyReports.length ? `<table class="data-table"><thead><tr><th>Date</th><th>From</th><th>Type</th><th>Status</th><th></th></tr></thead>
      <tbody>${state.safetyReports.map((r) => `<tr>
        <td>${PSUtils.formatDate(r.createdAt?.slice(0, 10))}</td>
        <td>${PSUtils.esc(r.reporterRole)}</td>
        <td>${PSUtils.esc(r.type)}</td>
        <td><select data-report-status="${r.id}">${PS_CONFIG.REPORT_STATUSES.map((s) => `<option ${r.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td>
        <td>${PSUtils.esc(r.description?.slice(0, 80) || '')}</td>
      </tr>`).join('')}</tbody></table>` : '<p class="field-hint">No reports yet.</p>'}
    </div>`;
}

function bindSafety(state) {
  document.querySelectorAll('[data-report-status]').forEach((sel) => {
    sel.addEventListener('change', () => {
      PSStore.updateSafetyReport(sel.dataset.reportStatus, { status: sel.value });
    });
  });
}

function renderPayments(state) {
  const total = state.payments.reduce((s, p) => s + (p.platformAmount || 0), 0);
  return `
    <div class="dash-panel"><h2>Payments (launch tracking)</h2>
      <p>Parent rate: $${PS_CONFIG.PARENT_RATE}/hr · Tutor pay: $${PS_CONFIG.TUTOR_RATE}/hr · PeerScholars: $${PS_CONFIG.PLATFORM_RATE}/hr before processing</p>
      <p><strong>Platform revenue recorded:</strong> $${total.toFixed(2)}</p>
      <table class="data-table"><thead><tr><th>Session</th><th>Parent</th><th>Tutor</th><th>Platform</th><th>Status</th></tr></thead>
      <tbody>${state.payments.map((p) => `<tr>
        <td>${PSUtils.esc(p.sessionId)}</td>
        <td>$${(p.parentAmount || 0).toFixed(2)}</td>
        <td>$${(p.tutorAmount || 0).toFixed(2)}</td>
        <td>$${(p.platformAmount || 0).toFixed(2)}</td>
        <td>${PSUtils.esc(p.status)}</td>
      </tr>`).join('')}</tbody></table>
    </div>`;
}
