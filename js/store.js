/**
 * PeerScholars data store — localStorage for launch mode.
 * Optional Supabase migration path: replace methods with API calls.
 */
(function () {
  const STORAGE_KEY = 'peerscholars_app_v1';
  const SESSION_KEY = 'peerscholars_session';

  function uid(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
  }

  function now() {
    return new Date().toISOString();
  }

  function emptyState() {
    return {
      users: [],
      students: [],
      tutorProfiles: [],
      tutoringRequests: [],
      matches: [],
      sessions: [],
      sessionReports: [],
      safetyReports: [],
      parentVerifications: [],
      payments: [],
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function save(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getState() {
    let state = load();
    if (!state) {
      state = seedDemoState();
      save(state);
    }
    return state;
  }

  function seedDemoState() {
    const adminId = 'user_admin_demo';
    const parentId = 'user_parent_demo';
    const tutorId = 'user_tutor_demo';
    const studentId = 'student_demo_1';
    const tutorProfileId = 'tutor_profile_demo';
    const requestId = 'request_demo_1';
    const matchId = 'match_demo_1';
    const sessionId = 'session_demo_1';
    const completedSessionId = 'session_demo_2';

    return {
      users: [
        {
          id: adminId,
          email: 'admin@peerscholars.com',
          password: 'admin123',
          role: 'admin',
          firstName: 'PeerScholars',
          lastName: 'Admin',
          createdAt: now(),
        },
        {
          id: parentId,
          email: 'parent@demo.com',
          password: 'demo123',
          role: 'parent',
          firstName: 'Maria',
          lastName: 'Chen',
          phone: '(425) 555-0101',
          city: 'Bellevue',
          state: 'WA',
          relationship: 'Parent',
          consent: true,
          createdAt: now(),
        },
        {
          id: tutorId,
          email: 'tutor@demo.com',
          password: 'demo123',
          role: 'tutor',
          firstName: 'Jordan',
          lastName: 'Lee',
          createdAt: now(),
        },
      ],
      students: [
        {
          id: studentId,
          parentUserId: parentId,
          firstName: 'Emma',
          grade: '5th',
          school: 'Somerset Elementary',
          subjects: 'Math',
          topics: 'Fractions, word problems',
          interestTags: ['soccer', 'science', 'gaming'],
          availabilitySlots: [
            { day: 'Tue', startTime: '17:00', endTime: '19:00' },
            { day: 'Wed', startTime: '17:00', endTime: '19:00' },
          ],
          availability: 'Tue, Wed 5:00–7:00 PM',
          mode: 'Online',
          learningPrefs: 'Visual examples, short breaks',
          interests: 'Soccer, Science, Gaming',
          notes: 'Needs encouragement with word problems.',
          createdAt: now(),
        },
      ],
      tutorProfiles: [
        {
          id: tutorProfileId,
          userId: tutorId,
          firstName: 'Jordan',
          lastName: 'Lee',
          grade: '11th',
          school: 'Bellevue High School',
          city: 'Bellevue',
          state: 'WA',
          subjects: 'Math, Science',
          gradesCanTeach: ['3rd', '4th', '5th', '6th'],
          weeklyCapacity: 4,
          activeStudentCount: 1,
          interestTags: ['soccer', 'coding', 'science'],
          availabilitySlots: [
            { day: 'Tue', startTime: '17:00', endTime: '19:00' },
            { day: 'Sat', startTime: '10:00', endTime: '13:00' },
          ],
          availability: 'Tue 5:00–7:00 PM, Sat 10:00 AM–1:00 PM',
          mode: 'Online',
          bio: 'Honor roll student who loves helping younger kids with math.',
          interests: 'Soccer, Coding, Science',
          whyTutor: 'I enjoy explaining concepts in simple ways.',
          experience: 'Helped classmates and younger siblings with homework.',
          applicationSubmittedAt: now(),
          applicationStatus: 'Application Submitted',
          adminDecision: 'Verified',
          finalReviewStatus: 'Approved',
          codeOfConductAccepted: true,
          codeOfConductAcceptedAt: now(),
          verified: true,
          suspended: false,
          createdAt: now(),
        },
      ],
      tutoringRequests: [
        {
          id: requestId,
          studentId,
          parentUserId: parentId,
          subjects: 'Math',
          grade: '5th',
          mode: 'Online',
          city: 'Bellevue',
          interests: 'Soccer, Science, Gaming',
          interestTags: ['soccer', 'science', 'gaming'],
          availabilitySlots: [
            { day: 'Tue', startTime: '17:00', endTime: '19:00' },
            { day: 'Wed', startTime: '17:00', endTime: '19:00' },
          ],
          availability: 'Tue, Wed 5:00–7:00 PM',
          paymentStatus: 'paid',
          paymentConfirmedAt: now(),
          matchStatus: 'Session Scheduled',
          status: 'matched',
          createdAt: now(),
        },
      ],
      matches: [
        {
          id: matchId,
          requestId,
          tutorProfileId,
          studentId,
          parentUserId: parentId,
          status: 'Session Scheduled',
          matchStatus: 'Session Scheduled',
          matchScore: 92,
          matchPercent: 92,
          sharedInterests: ['soccer', 'coding', 'science'],
          parentApprovedAt: now(),
          tutorAcceptedAt: now(),
          createdAt: now(),
        },
      ],
      sessions: [
        {
          id: sessionId,
          matchId,
          studentId,
          tutorProfileId,
          parentUserId: parentId,
          subject: 'Math',
          date: '2026-08-20',
          startTime: '16:00',
          durationMinutes: 60,
          mode: 'Online',
          meetingLink: 'https://meet.google.com/demo-peerscholars-session',
          location: '',
          status: 'Scheduled',
          parentConfirmed: false,
          tutorConfirmed: false,
          parentConfirmedAt: null,
          tutorConfirmedAt: null,
          paymentStatus: 'pending',
          createdAt: now(),
        },
        {
          id: completedSessionId,
          matchId,
          studentId,
          tutorProfileId,
          parentUserId: parentId,
          subject: 'Math',
          date: '2026-08-10',
          startTime: '16:00',
          durationMinutes: 60,
          mode: 'Online',
          meetingLink: 'https://meet.google.com/demo-peerscholars-past',
          location: '',
          status: 'Completed',
          parentConfirmed: true,
          tutorConfirmed: true,
          parentConfirmedAt: now(),
          tutorConfirmedAt: now(),
          paymentStatus: 'paid',
          createdAt: now(),
        },
      ],
      sessionReports: [
        {
          id: 'report_demo_1',
          sessionId: completedSessionId,
          tutorProfileId,
          subject: 'Math',
          topic: 'Fractions and word problems',
          understood: 'Adding fractions with like denominators',
          practice: 'Word problems with unlike denominators',
          notes: 'Emma stayed focused. Recommend one more practice session.',
          durationMinutes: 60,
          createdAt: now(),
        },
      ],
      safetyReports: [],
      parentVerifications: [],
      payments: [
        {
          id: 'pay_demo_1',
          sessionId: completedSessionId,
          parentAmount: 12.99,
          tutorAmount: 9.0,
          platformAmount: 3.99,
          status: 'Recorded',
          createdAt: now(),
        },
      ],
    };
  }

  function write(mutator) {
    const state = getState();
    mutator(state);
    save(state);
    return state;
  }

  function findUserByEmail(email) {
    return getState().users.find(
      (u) => u.email.toLowerCase() === String(email || '').trim().toLowerCase()
    );
  }

  function getCurrentUser() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const { userId } = JSON.parse(raw);
      return getState().users.find((u) => u.id === userId) || null;
    } catch {
      return null;
    }
  }

  function setSession(userId) {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({ userId, at: now() }));
  }

  function clearSession() {
    sessionStorage.removeItem(SESSION_KEY);
  }

  function login(email, password) {
    const user = findUserByEmail(email);
    if (!user) return { error: 'No account found for this email. Please sign up first.' };
    if (user.password) {
      if (!password || user.password !== password) {
        return { error: 'Invalid email or password.' };
      }
    }
    if (user.suspended) return { error: 'This account is suspended.' };
    setSession(user.id);
    return user;
  }

  function logout() {
    clearSession();
  }

  function createUser({ email, password, role, ...profile }) {
    if (findUserByEmail(email)) return { error: 'An account with this email already exists.' };
    const user = {
      id: uid('user'),
      email: email.trim().toLowerCase(),
      password: password || '',
      role,
      createdAt: now(),
      ...profile,
    };
    write((s) => s.users.push(user));
    setSession(user.id);
    return user;
  }

  function createStudent(parentUserId, data) {
    const student = { id: uid('student'), parentUserId, createdAt: now(), ...data };
    write((s) => s.students.push(student));
    return student;
  }

  function createTutorProfile(userId, data) {
    const profile = {
      id: uid('tutor'),
      userId,
      applicationSubmittedAt: now(),
      applicationStatus: 'Application Submitted',
      interviewStatus: 'Not scheduled',
      interviewNotes: '',
      adminDecision: 'Pending',
      finalReviewStatus: 'Pending',
      codeOfConductAccepted: false,
      verified: false,
      suspended: false,
      createdAt: now(),
      ...data,
    };
    write((s) => s.tutorProfiles.push(profile));
    return profile;
  }

  function createTutoringRequest(data) {
    const request = {
      id: uid('request'),
      status: 'pending',
      paymentStatus: 'unpaid',
      matchStatus: 'Waiting for Payment',
      mode: 'Online',
      createdAt: now(),
      ...data,
    };
    write((s) => s.tutoringRequests.push(request));
    return request;
  }

  function createParentVerification(tutorProfileId, parentEmail, parentName, parentFirstName) {
    const token = uid('pv');
    const record = {
      id: uid('parentverify'),
      tutorProfileId,
      token,
      parentEmail: parentEmail.trim().toLowerCase(),
      parentName,
      parentFirstName: parentFirstName || parentName?.split(' ')[0] || '',
      status: 'Pending',
      createdAt: now(),
    };
    write((s) => {
      s.parentVerifications.push(record);
      const tutor = s.tutorProfiles.find((t) => t.id === tutorProfileId);
      if (tutor) {
        tutor.parentVerificationStatus = 'Parent Verification Pending';
        tutor.applicationStatus = 'Parent Verification Pending';
        tutor.parentVerificationToken = token;
      }
    });
    return record;
  }

  function confirmParentVerification(token) {
    let result = null;
    write((s) => {
      const record = s.parentVerifications.find((p) => p.token === token);
      if (!record) return;
      record.status = 'Confirmed';
      record.confirmedAt = now();
      const tutor = s.tutorProfiles.find((t) => t.id === record.tutorProfileId);
      if (tutor) {
        tutor.parentVerificationStatus = 'Parent Verified';
        tutor.applicationStatus = 'Parent Verified';
        tutor.parentVerifiedAt = now();
      }
      result = { record, tutor };
    });
    return result;
  }

  function uploadSchoolDoc(tutorProfileId, fileName, fileData) {
    write((s) => {
      const tutor = s.tutorProfiles.find((t) => t.id === tutorProfileId);
      if (!tutor) return;
      tutor.schoolDocName = fileName;
      tutor.schoolDocData = fileData;
      tutor.schoolDocStatus = 'Submitted';
      tutor.schoolDocSubmittedAt = now();
    });
  }

  function updateTutorProfile(tutorProfileId, updates) {
    write((s) => {
      const idx = s.tutorProfiles.findIndex((t) => t.id === tutorProfileId);
      if (idx >= 0) s.tutorProfiles[idx] = { ...s.tutorProfiles[idx], ...updates };
    });
  }

  function isParentVerified(tutor) {
    // Legacy helper — parent verification is no longer required for signup.
    return true;
  }

  function recomputeTutorVerified(tutor) {
    return (
      !!tutor.applicationSubmittedAt &&
      tutor.adminDecision === 'Verified' &&
      tutor.codeOfConductAccepted &&
      !tutor.suspended
    );
  }

  function acceptCodeOfConduct(tutorProfileId) {
    write((s) => {
      const tutor = s.tutorProfiles.find((t) => t.id === tutorProfileId);
      if (!tutor) return;
      tutor.codeOfConductAccepted = true;
      tutor.codeOfConductAcceptedAt = now();
      tutor.verified = recomputeTutorVerified(tutor);
    });
  }

  function adminUpdateTutor(tutorProfileId, updates) {
    write((s) => {
      const idx = s.tutorProfiles.findIndex((t) => t.id === tutorProfileId);
      if (idx < 0) return;
      s.tutorProfiles[idx] = { ...s.tutorProfiles[idx], ...updates };
      s.tutorProfiles[idx].verified = recomputeTutorVerified(s.tutorProfiles[idx]);
    });
  }

  function suspendTutor(tutorProfileId, suspended = true) {
    adminUpdateTutor(tutorProfileId, { suspended, verified: false });
  }

  function getTutorByUserId(userId) {
    return getState().tutorProfiles.find((t) => t.userId === userId);
  }

  function getStudentsByParent(parentUserId) {
    return getState().students.filter((s) => s.parentUserId === parentUserId);
  }

  function getVerifiedTutors() {
    return getState().tutorProfiles.filter((t) => t.verified && !t.suspended);
  }

  function updateTutoringRequest(requestId, updates) {
    write((s) => {
      const idx = s.tutoringRequests.findIndex((r) => r.id === requestId);
      if (idx >= 0) s.tutoringRequests[idx] = { ...s.tutoringRequests[idx], ...updates };
    });
  }

  function confirmFirstPayment(requestId) {
    write((s) => {
      const req = s.tutoringRequests.find((r) => r.id === requestId);
      if (!req) return;
      req.paymentStatus = 'paid';
      req.paymentConfirmedAt = now();
      req.matchStatus = 'Ready for Matching';
    });
    runMatchingForRequest(requestId);
  }

  function runMatchingForRequest(requestId) {
    const state = getState();
    const req = state.tutoringRequests.find((r) => r.id === requestId);
    if (!req || req.paymentStatus !== 'paid') return [];
    const student = state.students.find((s) => s.id === req.studentId);
    const results = PSMatching.findMatches(req, getVerifiedTutors(), student, 3);
    write((s) => {
      const r = s.tutoringRequests.find((x) => x.id === requestId);
      if (!r) return;
      r.matchStatus = results.length ? 'Matches Found' : 'No Match Available';
      r.recommendedTutorIds = results.map((x) => x.tutor.id);
    });
    return results;
  }

  function createMatch(requestId, tutorProfileId, studentId, parentUserId, matchMeta = {}) {
    const match = {
      id: uid('match'),
      requestId,
      tutorProfileId,
      studentId,
      parentUserId,
      status: 'Parent Reviewing',
      matchStatus: 'Parent Reviewing',
      createdAt: now(),
      ...matchMeta,
    };
    write((s) => {
      s.matches.push(match);
    });
    return match;
  }

  function parentSelectTutor(requestId, tutorProfileId, matchMeta) {
    const state = getState();
    const req = state.tutoringRequests.find((r) => r.id === requestId);
    if (!req) return null;
    let match = state.matches.find(
      (m) => m.requestId === requestId && m.tutorProfileId === tutorProfileId
    );
    if (!match) {
      match = createMatch(requestId, tutorProfileId, req.studentId, req.parentUserId, matchMeta);
    }
    write((s) => {
      const m = s.matches.find((x) => x.id === match.id);
      if (m) {
        Object.assign(m, matchMeta, {
          status: 'Tutor Approval Pending',
          matchStatus: 'Tutor Approval Pending',
          parentSelectedAt: now(),
        });
      }
      const r = s.tutoringRequests.find((x) => x.id === requestId);
      if (r) r.matchStatus = 'Tutor Approval Pending';
    });
    return match;
  }

  function tutorAcceptMatch(matchId) {
    write((s) => {
      const match = s.matches.find((m) => m.id === matchId);
      if (!match) return;
      match.status = 'Match Confirmed';
      match.matchStatus = 'Match Confirmed';
      match.tutorAcceptedAt = now();
      const req = s.tutoringRequests.find((r) => r.id === match.requestId);
      if (req) req.matchStatus = 'Match Confirmed';
      const tutor = s.tutorProfiles.find((t) => t.id === match.tutorProfileId);
      if (tutor) tutor.activeStudentCount = (tutor.activeStudentCount || 0) + 1;
    });
  }

function tutorDeclineMatch(matchId) {
  let requestId = null;
  write((s) => {
    const match = s.matches.find((m) => m.id === matchId);
    if (!match) return;
    match.status = 'Match Declined';
    match.matchStatus = 'Match Declined';
    match.declinedAt = now();
    requestId = match.requestId;
    const req = s.tutoringRequests.find((r) => r.id === match.requestId);
    if (req) req.matchStatus = 'Matches Found';
  });
  if (requestId) runMatchingForRequest(requestId);
}

  function scheduleMatchSession(matchId, { date, startTime, subject, meetingLink }) {
    let session = null;
    write((s) => {
      const match = s.matches.find((m) => m.id === matchId);
      if (!match) return;
      session = {
        id: uid('session'),
        matchId: match.id,
        studentId: match.studentId,
        tutorProfileId: match.tutorProfileId,
        parentUserId: match.parentUserId,
        subject: subject || 'Tutoring',
        date,
        startTime,
        durationMinutes: 60,
        mode: 'Online',
        meetingLink: meetingLink || 'https://meet.google.com/peerscholars-session',
        location: '',
        status: 'Scheduled',
        parentConfirmed: false,
        tutorConfirmed: false,
        parentConfirmedAt: null,
        tutorConfirmedAt: null,
        paymentStatus: 'pending',
        createdAt: now(),
      };
      s.sessions.push(session);
      match.status = 'Session Scheduled';
      match.matchStatus = 'Session Scheduled';
      match.scheduledSessionId = session.id;
      const req = s.tutoringRequests.find((r) => r.id === match.requestId);
      if (req) req.matchStatus = 'Session Scheduled';
    });
    return session;
  }

  function approveMatch(matchId) {
    write((s) => {
      const match = s.matches.find((m) => m.id === matchId);
      if (!match) return;
      match.status = 'Tutor Approval Pending';
      match.matchStatus = 'Tutor Approval Pending';
      match.parentApprovedAt = now();
    });
  }

  function getPendingMatchesForTutor(tutorProfileId) {
    return getState().matches.filter(
      (m) =>
        m.tutorProfileId === tutorProfileId &&
        (m.matchStatus === 'Tutor Approval Pending' || m.status === 'Tutor Approval Pending')
    );
  }

  function collectInterestTags(form, checkboxName, otherFieldName) {
    const tags = [...form.querySelectorAll(`input[name="${checkboxName}"]:checked`)]
      .map((c) => c.value)
      .filter((v) => v !== 'other');
    const other = form.querySelector(`[name="${otherFieldName}"]`)?.value?.trim();
    if (other) tags.push(other);
    return tags;
  }

  function createSession(data) {
    const session = {
      id: uid('session'),
      status: 'Scheduled',
      parentConfirmed: false,
      tutorConfirmed: false,
      parentConfirmedAt: null,
      tutorConfirmedAt: null,
      paymentStatus: 'pending',
      createdAt: now(),
      ...data,
    };
    write((s) => s.sessions.push(session));
    return session;
  }

  function finalizeSessionIfReady(s, session) {
    if (!session || session.paymentStatus === 'paid' || session.paymentStatus === 'disputed') return;
    if (session.parentConfirmed && session.tutorConfirmed) {
      session.status = 'Completed';
      session.paymentStatus = 'paid';
      if (!s.payments.some((p) => p.sessionId === session.id)) {
        const cfg = window.PS_CONFIG || {};
        s.payments.push({
          id: uid('pay'),
          sessionId: session.id,
          parentAmount: cfg.PARENT_RATE || 12.99,
          tutorAmount: cfg.TUTOR_RATE || 9,
          platformAmount: cfg.PLATFORM_RATE || 3.99,
          status: 'Recorded',
          note: 'Both parent and tutor confirmed session',
          createdAt: now(),
        });
      }
    } else if (session.parentConfirmed || session.tutorConfirmed) {
      session.status = 'Awaiting Confirmation';
    }
  }

  function parentConfirmSession(sessionId) {
    write((s) => {
      const session = s.sessions.find((x) => x.id === sessionId);
      if (!session || session.paymentStatus === 'paid' || session.status === 'Disputed') return;
      session.parentConfirmed = true;
      session.parentConfirmedAt = now();
      finalizeSessionIfReady(s, session);
    });
  }

  function tutorConfirmSession(sessionId) {
    write((s) => {
      const session = s.sessions.find((x) => x.id === sessionId);
      if (!session || session.paymentStatus === 'paid' || session.status === 'Disputed') return;
      session.tutorConfirmed = true;
      session.tutorConfirmedAt = now();
      finalizeSessionIfReady(s, session);
    });
  }

  function disputeSession(sessionId, role) {
    write((s) => {
      const session = s.sessions.find((x) => x.id === sessionId);
      if (!session || session.paymentStatus === 'paid') return;
      session.paymentStatus = 'disputed';
      session.status = 'Disputed';
      session.disputedBy = role;
      session.disputedAt = now();
    });
  }

  function updateSession(sessionId, updates) {
    write((s) => {
      const idx = s.sessions.findIndex((x) => x.id === sessionId);
      if (idx >= 0) s.sessions[idx] = { ...s.sessions[idx], ...updates };
    });
  }

  function createSessionReport(data) {
    const report = { id: uid('report'), createdAt: now(), ...data };
    write((s) => {
      s.sessionReports.push(report);
    });
    return report;
  }

  function createSafetyReport(data) {
    const report = {
      id: uid('safety'),
      status: 'New',
      createdAt: now(),
      ...data,
    };
    write((s) => s.safetyReports.push(report));
    return report;
  }

  function updateSafetyReport(reportId, updates) {
    write((s) => {
      const idx = s.safetyReports.findIndex((r) => r.id === reportId);
      if (idx >= 0) s.safetyReports[idx] = { ...s.safetyReports[idx], ...updates };
    });
  }

  function recordPayment(sessionId) {
    const cfg = window.PS_CONFIG || {};
    write((s) => {
      if (s.payments.some((p) => p.sessionId === sessionId)) return;
      const session = s.sessions.find((x) => x.id === sessionId);
      s.payments.push({
        id: uid('pay'),
        sessionId,
        parentAmount: cfg.PARENT_RATE || 12.99,
        tutorAmount: cfg.TUTOR_RATE || 9,
        platformAmount: cfg.PLATFORM_RATE || 3.99,
        status: 'Recorded',
        note: session?.parentConfirmed && session?.tutorConfirmed ? 'Both confirmed' : 'Admin release',
        createdAt: now(),
      });
      if (session) {
        session.paymentStatus = 'paid';
        session.status = 'Completed';
      }
    });
  }

  function resetDemoData() {
    localStorage.removeItem(STORAGE_KEY);
    clearSession();
    return getState();
  }

  function getTutorPublicProfile(tutor) {
    if (!tutor) return null;
    return {
      id: tutor.id,
      firstName: tutor.firstName,
      grade: tutor.grade,
      school: tutor.school,
      city: tutor.city,
      state: tutor.state,
      subjects: tutor.subjects,
      gradesCanTeach: tutor.gradesCanTeach,
      availability: tutor.availabilitySlots?.length
        ? PSAvailability.formatSlotsList(PSAvailability.parseSlots(tutor), 2)
        : tutor.availability,
      mode: 'Online',
      bio: tutor.bio,
      interests: tutor.interests,
      verified: tutor.verified,
    };
  }

  function getTutorById(tutorProfileId) {
    return getState().tutorProfiles.find((t) => t.id === tutorProfileId);
  }

  window.PSStore = {
    getState,
    save,
    write,
    uid,
    now,
    findUserByEmail,
    getCurrentUser,
    setSession,
    clearSession,
    login,
    logout,
    createUser,
    createStudent,
    createTutorProfile,
    createTutoringRequest,
    updateTutoringRequest,
    confirmFirstPayment,
    runMatchingForRequest,
    parentSelectTutor,
    tutorAcceptMatch,
    tutorDeclineMatch,
    scheduleMatchSession,
    getPendingMatchesForTutor,
    createParentVerification,
    confirmParentVerification,
    uploadSchoolDoc,
    updateTutorProfile,
    acceptCodeOfConduct,
    adminUpdateTutor,
    suspendTutor,
    getTutorByUserId,
    getStudentsByParent,
    getVerifiedTutors,
    createMatch,
    approveMatch,
    createSession,
    updateSession,
    parentConfirmSession,
    tutorConfirmSession,
    disputeSession,
    createSessionReport,
    createSafetyReport,
    updateSafetyReport,
    recordPayment,
    resetDemoData,
    getTutorPublicProfile,
    getTutorById,
    isParentVerified,
    recomputeTutorVerified,
    seedDemoState,
  };
})();
