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
          availability: 'Mon, Wed after 4pm',
          mode: 'Online',
          learningPrefs: 'Visual examples, short breaks',
          interests: 'Soccer, drawing',
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
          age: 16,
          grade: '11th',
          school: 'Bellevue High School',
          city: 'Bellevue',
          state: 'WA',
          parentName: 'Pat Lee',
          parentEmail: 'parent.lee@email.com',
          subjects: 'Math, Science',
          gradesCanTeach: ['3rd', '4th', '5th', '6th'],
          availability: 'Mon–Thu after 3:30pm',
          mode: 'Both',
          bio: 'Honor roll student who loves helping younger kids with math.',
          interests: 'Basketball, coding',
          whyTutor: 'I enjoy explaining concepts in simple ways.',
          experience: 'Helped classmates and younger siblings with homework.',
          parentConsent: true,
          applicationSubmittedAt: now(),
          parentVerificationStatus: 'Confirmed',
          parentVerifiedAt: now(),
          schoolDocStatus: 'Approved',
          schoolDocName: 'demo_schedule.pdf',
          schoolDocData: null,
          interviewStatus: 'Passed',
          interviewNotes: 'Strong communicator. Explained fractions clearly.',
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
          interests: 'Soccer, drawing',
          availability: 'Mon, Wed after 4pm',
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
          status: 'approved',
          parentApprovedAt: now(),
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
    if (!user || user.password !== password) return null;
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
      password,
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
      parentVerificationStatus: 'Pending',
      schoolDocStatus: 'Not submitted',
      schoolDocName: '',
      schoolDocData: null,
      interviewStatus: 'Not scheduled',
      interviewNotes: '',
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
      createdAt: now(),
      ...data,
    };
    write((s) => s.tutoringRequests.push(request));
    return request;
  }

  function createParentVerification(tutorProfileId, parentEmail, parentName) {
    const token = uid('pv');
    const record = {
      id: uid('parentverify'),
      tutorProfileId,
      token,
      parentEmail: parentEmail.trim().toLowerCase(),
      parentName,
      status: 'Pending',
      createdAt: now(),
    };
    write((s) => {
      s.parentVerifications.push(record);
      const tutor = s.tutorProfiles.find((t) => t.id === tutorProfileId);
      if (tutor) {
        tutor.parentVerificationStatus = 'Pending';
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
        tutor.parentVerificationStatus = 'Confirmed';
        tutor.parentVerifiedAt = now();
      }
      result = record;
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

  function recomputeTutorVerified(tutor) {
    return (
      tutor.applicationSubmittedAt &&
      tutor.parentVerificationStatus === 'Confirmed' &&
      tutor.schoolDocStatus === 'Approved' &&
      tutor.interviewStatus === 'Passed' &&
      tutor.finalReviewStatus === 'Approved' &&
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

  function createMatch(requestId, tutorProfileId, studentId, parentUserId) {
    const match = {
      id: uid('match'),
      requestId,
      tutorProfileId,
      studentId,
      parentUserId,
      status: 'suggested',
      createdAt: now(),
    };
    write((s) => {
      s.matches.push(match);
      const req = s.tutoringRequests.find((r) => r.id === requestId);
      if (req) req.status = 'matched';
    });
    return match;
  }

  function approveMatch(matchId) {
    write((s) => {
      const match = s.matches.find((m) => m.id === matchId);
      if (!match) return;
      match.status = 'approved';
      match.parentApprovedAt = now();
    });
  }

  function createSession(data) {
    const session = { id: uid('session'), status: 'Scheduled', createdAt: now(), ...data };
    write((s) => s.sessions.push(session));
    return session;
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
      const session = s.sessions.find((x) => x.id === data.sessionId);
      if (session) session.status = 'Completed';
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
      s.payments.push({
        id: uid('pay'),
        sessionId,
        parentAmount: cfg.PARENT_RATE || 12.99,
        tutorAmount: cfg.TUTOR_RATE || 9,
        platformAmount: cfg.PLATFORM_RATE || 3.99,
        status: 'Recorded',
        createdAt: now(),
      });
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
      availability: tutor.availability,
      mode: tutor.mode,
      bio: tutor.bio,
      interests: tutor.interests,
      verified: tutor.verified,
    };
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
    createSessionReport,
    createSafetyReport,
    updateSafetyReport,
    recordPayment,
    resetDemoData,
    getTutorPublicProfile,
    recomputeTutorVerified,
    seedDemoState,
  };
})();
