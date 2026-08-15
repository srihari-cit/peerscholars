document.addEventListener('DOMContentLoaded', () => {
  const user = PSAuth.requireRole(['parent']);
  if (!user) return;

  const root = document.getElementById('dashboard-root');
  const welcome = new URLSearchParams(window.location.search).get('welcome');
  renderParentDashboard(user, root, welcome);
});

function renderParentDashboard(user, root, welcome) {
  const state = PSStore.getState();
  const students = PSStore.getStudentsByParent(user.id);
  const student = students[0];
  let request = state.tutoringRequests.find((r) => r.parentUserId === user.id);
  const matches = state.matches.filter((m) => m.parentUserId === user.id);
  const sessions = state.sessions.filter((s) => s.parentUserId === user.id);
  const reports = state.sessionReports;

  let html = welcome
    ? '<div class="alert alert-success">Welcome! Complete payment below to start matching with verified tutors.</div>'
    : '';

  if (!student || !request) {
    root.innerHTML = html + '<p class="field-hint">No student profile found. <a href="signup.html?role=family">Sign up</a></p>';
    return;
  }

  // Payment gate
  if (request.paymentStatus !== 'paid') {
    html += `
      <div class="dash-panel">
        <h2>Complete payment to start matching</h2>
        <p>Before we find a tutor, please pay for your first tutoring session.</p>
        <p><strong>$${PS_CONFIG.PARENT_RATE}/hour</strong> · Online via Google Meet</p>
        <p class="field-hint">Student: ${PSUtils.esc(student.firstName)} · Grade ${PSUtils.esc(student.grade)} · ${PSUtils.esc(student.subjects)}</p>
        <button class="btn btn-primary" id="pay-first-session">Pay $${PS_CONFIG.PARENT_RATE} — Start Matching</button>
        <p class="field-hint" style="margin-top:0.75rem;">Launch mode: this simulates payment. Real payment processing will be added later.</p>
      </div>`;
    root.innerHTML = html + renderStudentPanel(student) + renderSessions(sessions, reports, state);
    document.getElementById('pay-first-session')?.addEventListener('click', () => {
      PSStore.confirmFirstPayment(request.id);
      location.reload();
    });
    return;
  }

  // Post-payment matching
  if (request.matchStatus === 'Ready for Matching') {
    PSStore.runMatchingForRequest(request.id);
    request = PSStore.getState().tutoringRequests.find((r) => r.id === request.id);
  }

  if (['Matches Found', 'Parent Reviewing', 'Tutor Approval Pending', 'Match Confirmed'].includes(request.matchStatus)) {
    html += '<div class="alert alert-success">Payment confirmed! We\'re finding the best PeerScholars tutor for you.</div>';
  }

  const pendingSchedule = matches.find((m) => m.matchStatus === 'Match Confirmed');
  if (pendingSchedule) {
    html += renderSchedulePanel(pendingSchedule, request, student, state);
  } else if (request.matchStatus === 'Tutor Approval Pending') {
    const pending = matches.find((m) => m.matchStatus === 'Tutor Approval Pending');
    html += `<div class="alert alert-info">You selected ${PSUtils.esc(state.tutorProfiles.find((t) => t.id === pending?.tutorProfileId)?.firstName || 'your tutor')}. Waiting for the tutor to accept your request.</div>`;
  } else if (request.matchStatus === 'Session Scheduled') {
    const scheduled = sessions.find((s) => s.status === 'Scheduled');
    if (scheduled) html += renderSessionConfirmation(scheduled, state);
  } else if (request.matchStatus === 'No Match Available') {
    html += renderNoMatchPanel(request);
  } else {
    html += renderMatchResults(request, student, matches, state);
  }

  html += renderStudentPanel(student);
  html += renderSessions(sessions, reports, state);
  html += '<div class="dash-panel"><a href="report-concern.html" class="btn btn-secondary">Report a Concern</a></div>';

  root.innerHTML = html;
  bindMatchEvents(request, student, state);
}

function renderStudentPanel(student) {
  return `<div class="dash-panel"><h2>Your student</h2>
    <p><strong>${PSUtils.esc(student.firstName)}</strong> · Grade ${PSUtils.esc(student.grade)} · ${PSUtils.esc(student.subjects)}</p>
    <p class="field-hint">Interests: ${PSUtils.esc(student.interests || '—')}</p>
    <p class="field-hint">Available: ${PSUtils.esc(student.availability || '—')}</p>
    <p class="field-hint">Format: Online (Google Meet)</p></div>`;
}

function renderMatchResults(request, student, matches, state) {
  const declinedIds = matches.filter((m) => m.matchStatus === 'Match Declined').map((m) => m.tutorProfileId);
  const results = PSMatching.findMatches(request, PSStore.getVerifiedTutors(), student, 3)
    .filter((r) => !declinedIds.includes(r.tutor.id));

  if (!results.length) return renderNoMatchPanel(request);

  return `<div class="dash-panel" id="match-results">
    <h2>We found some great matches!</h2>
    <p class="field-hint">Great! We're finding a tutor who fits your child's learning needs and interests. Review up to 3 recommended tutors — you choose who is best.</p>
    <div class="match-card-grid">${results.map((r) => renderMatchCard(r, request)).join('')}</div>
  </div>
  <div id="tutor-detail-panel" hidden></div>`;
}

function renderMatchCard(result, request) {
  const t = result.tutor;
  const grades = (t.gradesCanTeach || []).join(', ');
  const shared = result.sharedInterestLabels.join(' · ') || '—';
  return `<article class="match-card" data-tutor-id="${t.id}">
    <div class="match-card-head">
      <h3>${PSUtils.esc(t.firstName)} <span class="match-grade">Grade ${PSUtils.esc(t.grade)}</span></h3>
      ${PSUtils.verifiedTutorBadge()}
    </div>
    <p class="match-school">${PSUtils.esc(t.school)}</p>
    <p class="match-subjects">${PSUtils.esc(t.subjects)} · Grades ${PSUtils.esc(grades)}</p>
    <p class="match-score">⭐ ${result.matchPercent}% Match</p>
    <p class="match-shared">💡 ${result.sharedInterests.length} shared interest${result.sharedInterests.length !== 1 ? 's' : ''}: ${PSUtils.esc(shared)}</p>
    <p class="match-avail">🕒 ${PSUtils.esc(result.availabilityDisplay.join(', ') || t.availability)}</p>
    <p class="match-format">Online · Google Meet</p>
    <p class="match-why">${PSUtils.esc(result.explanation)}</p>
    <div class="btn-row">
      <button class="btn btn-secondary btn-small" data-view-tutor="${t.id}" data-request="${request.id}">View Tutor</button>
      <button class="btn btn-primary btn-small" data-select-tutor="${t.id}" data-request="${request.id}">Select This Tutor</button>
    </div>
  </article>`;
}

function renderNoMatchPanel(request) {
  return `<div class="dash-panel">
    <h2>We couldn't find a perfect match yet.</h2>
    <p>We're looking for a tutor who matches your child's subject, grade, interests, and availability.</p>
    <div class="btn-row">
      <button class="btn btn-secondary btn-small" data-expand-availability>Expand Availability</button>
      <button class="btn btn-secondary btn-small" onclick="location.href='mailto:support@peerscholars.com'">Ask PeerScholars to Help</button>
    </div>
  </div>`;
}

function renderSchedulePanel(match, request, student, state) {
  const tutor = state.tutorProfiles.find((t) => t.id === match.tutorProfileId);
  const overlaps = PSAvailability.overlap(
    PSAvailability.parseSlots(student),
    PSAvailability.parseSlots(tutor)
  );
  const times = PSMatching.suggestSessionTimes(overlaps, 4);
  const nextTuesday = getNextDayDate('Tue');

  return `<div class="dash-panel" id="schedule-panel">
    <div class="alert alert-success">You selected <strong>${PSUtils.esc(tutor?.firstName)}</strong> as your PeerScholars tutor!</div>
    <h2>Choose a session time</h2>
    <p class="field-hint">Pick an overlapping time for your first online Google Meet session (1 hour).</p>
    <form id="schedule-session-form" class="inline-form">
      <input type="hidden" name="matchId" value="${match.id}">
      <input type="hidden" name="subject" value="${PSUtils.esc(request.subjects)}">
      <div class="form-row"><label>Available times</label>
        <select name="session-slot" required>
          ${times.map((t, i) => `<option value="${i}">${PSUtils.esc(t.label)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row"><label>Date</label><input type="date" name="date" value="${nextTuesday}" required></div>
      <button type="submit" class="btn btn-primary">Schedule Session</button>
    </form>
    <script type="application/json" id="session-slots-data">${JSON.stringify(times)}</script>
  </div>`;
}

function renderSessionConfirmation(session, state) {
  const tutor = state.tutorProfiles.find((t) => t.id === session.tutorProfileId);
  const endMins = PSAvailability.toMinutes(session.startTime) + (session.durationMinutes || 60);
  return `<div class="dash-panel">
    <div class="alert alert-success"><h2 style="margin:0 0 0.35rem;">You're all set!</h2></div>
    <p><strong>Tutor:</strong> ${PSUtils.esc(tutor?.firstName || '—')}</p>
    <p><strong>Subject:</strong> ${PSUtils.esc(session.subject)}</p>
    <p><strong>Date:</strong> ${PSUtils.formatDate(session.date)}</p>
    <p><strong>Time:</strong> ${PSUtils.formatTime(session.startTime)} – ${PSAvailability.formatMinutes(endMins)}</p>
    <p><strong>Format:</strong> Online · Google Meet</p>
    <p><a href="${PSUtils.esc(session.meetingLink)}" class="btn btn-primary btn-small" target="_blank" rel="noopener">Join Session</a></p>
  </div>`;
}

function renderSessions(sessions, reports, state) {
  if (!sessions.length) return '<div class="dash-panel"><h2>Sessions</h2><p class="field-hint">No sessions scheduled yet.</p></div>';
  return `<div class="dash-panel"><h2>Upcoming &amp; past sessions</h2>
    <table class="data-table"><thead><tr><th>Date</th><th>Subject</th><th>Status</th><th>Meeting</th></tr></thead><tbody>
    ${sessions.map((s) => {
      const report = reports.find((r) => r.sessionId === s.id);
      let meet = s.meetingLink ? `<a href="${PSUtils.esc(s.meetingLink)}" target="_blank" rel="noopener">Google Meet</a>` : '—';
      if (report) meet += `<br><small>Report: ${PSUtils.esc(report.topic)}</small>`;
      return `<tr><td>${PSUtils.formatDate(s.date)} ${PSUtils.formatTime(s.startTime)}</td><td>${PSUtils.esc(s.subject)}</td><td>${PSUtils.badge(s.status, s.status === 'Completed' ? 'green' : 'blue')}</td><td>${meet}</td></tr>`;
    }).join('')}
    </tbody></table></div>`;
}

function getNextDayDate(dayAbbr) {
  const map = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  const target = map[dayAbbr] ?? 2;
  const d = new Date();
  d.setDate(d.getDate() + ((target - d.getDay() + 7) % 7 || 7));
  return d.toISOString().slice(0, 10);
}

function bindMatchEvents(request, student, state) {
  document.getElementById('schedule-session-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const slots = JSON.parse(document.getElementById('session-slots-data')?.textContent || '[]');
    const slot = slots[Number(fd.get('session-slot'))] || slots[0];
    const dayMap = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 0 };
    let date = fd.get('date');
    if (slot?.day) {
      const d = new Date(date + 'T12:00:00');
      const want = dayMap[slot.day];
      while (d.getDay() !== want) d.setDate(d.getDate() + 1);
      date = d.toISOString().slice(0, 10);
    }
    const h = Math.floor((slot?.start || 17 * 60) / 60);
    const m = (slot?.start || 17 * 60) % 60;
    const startTime = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    PSStore.scheduleMatchSession(fd.get('matchId'), {
      date,
      startTime,
      subject: fd.get('subject'),
      meetingLink: 'https://meet.google.com/peerscholars-session',
    });
    location.reload();
  });

  document.querySelector('[data-expand-availability]')?.addEventListener('click', () => {
    alert('Contact support@peerscholars.com to update your availability, or add more days/times during a future profile update.');
  });

  document.getElementById('dashboard-root')?.addEventListener('click', (e) => {
    const viewBtn = e.target.closest('[data-view-tutor]');
    if (viewBtn) {
      const tutor = state.tutorProfiles.find((t) => t.id === viewBtn.dataset.viewTutor);
      const panel = document.getElementById('tutor-detail-panel');
      if (panel && tutor) {
        panel.hidden = false;
        panel.innerHTML = `<div class="dash-panel"><h3>${PSUtils.esc(tutor.firstName)} — Tutor Profile</h3>
          <p>Grade ${PSUtils.esc(tutor.grade)} · ${PSUtils.esc(tutor.school)}</p>
          <p>${PSUtils.esc(tutor.bio || '')}</p>
          <p class="field-hint">Subjects: ${PSUtils.esc(tutor.subjects)}</p>
          <p class="field-hint">Teaches grades: ${PSUtils.esc((tutor.gradesCanTeach || []).join(', '))}</p>
          <p class="field-hint">Interests: ${PSUtils.esc(tutor.interests || '—')}</p>
          <button class="btn btn-primary btn-small" data-select-tutor="${tutor.id}" data-request="${viewBtn.dataset.request}">Select This Tutor</button>
        </div>`;
        panel.scrollIntoView({ behavior: 'smooth' });
      }
      return;
    }

    const selectBtn = e.target.closest('[data-select-tutor]');
    if (!selectBtn) return;
    const tutorId = selectBtn.dataset.selectTutor;
    const requestId = selectBtn.dataset.request;
    const result = PSMatching.findMatches(request, PSStore.getVerifiedTutors(), student, 5).find((r) => r.tutor.id === tutorId);
    PSStore.parentSelectTutor(requestId, tutorId, {
      matchScore: result?.score,
      matchPercent: result?.matchPercent,
      sharedInterests: result?.sharedInterests,
      explanation: result?.explanation,
    });
    alert(`You selected ${result?.tutor.firstName || 'this tutor'} as your PeerScholars tutor. We'll notify them to accept your request.`);
    location.reload();
  });
}
