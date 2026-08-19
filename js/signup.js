const SIGNUP_EMAIL = window.PS_CONFIG?.SIGNUP_EMAIL || 'support@peerscholars.com';

const rolePickerCard = document.getElementById('role-picker-card');
const rolePicker = document.querySelector('.signup-role-picker');
const form = document.getElementById('signup-form');
const roleInput = document.getElementById('role-input');
const familyFields = document.getElementById('family-fields');
const tutorFields = document.getElementById('tutor-fields');
const backBtn = document.getElementById('signup-back');
const signupIntro = document.getElementById('signup-intro');
const signupFastNote = document.getElementById('signup-fast-note');
const submitBtn = document.getElementById('signup-submit');
const successOverlay = document.getElementById('signup-success');
const gradesSelectAll = document.getElementById('grades-select-all');

function clearForm() {
  form.reset();
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = false;
  });
  form.querySelectorAll('.subject-other-input').forEach((el) => {
    el.hidden = true;
    el.value = '';
  });
  PSAvailability.resetPickers(form);
  form.querySelectorAll('[data-avail-select-all]').forEach((el) => {
    el.checked = false;
  });
}

function showRolePicker() {
  rolePickerCard.hidden = false;
  form.hidden = true;
  successOverlay.hidden = true;
  familyFields.hidden = true;
  tutorFields.hidden = true;
  roleInput.value = '';
  rolePicker?.querySelectorAll('.signup-role-btn').forEach((btn) => {
    btn.classList.remove('is-selected');
  });
  if (signupIntro) {
    signupIntro.textContent =
      "Choose whether you're a family looking for a tutor, or a high school student who wants to tutor.";
  }
}

function showForm(role) {
  clearForm();
  roleInput.value = role;
  rolePickerCard.hidden = true;
  form.hidden = false;
  successOverlay.hidden = true;
  familyFields.hidden = role !== 'family';
  tutorFields.hidden = role !== 'tutor';

  if (submitBtn) {
    submitBtn.textContent = role === 'family' ? 'Submit — Find a Tutor' : 'Submit Application';
  }

  if (signupIntro) {
    signupIntro.textContent =
      role === 'family'
        ? 'About 1 minute — tell us the basics and we’ll handle the rest.'
        : 'About 1 minute — apply now. We’ll follow up about verification.';
  }

  if (signupFastNote) {
    signupFastNote.textContent =
      role === 'family'
        ? 'Only the essentials — we’ll reach out to match your child with a tutor.'
        : 'Only the essentials — we’ll email your parent/guardian and follow up with you.';
  }
}

function bindOtherToggle(checkboxId, inputId) {
  form.querySelector(`#${checkboxId}`)?.addEventListener('change', (e) => {
    const el = document.getElementById(inputId);
    if (el) {
      el.hidden = !e.target.checked;
      if (!e.target.checked) el.value = '';
    }
  });
}

function initGradesSelectAll() {
  const gradeBoxes = [...form.querySelectorAll('input[name="grades-can-teach"]')];
  gradesSelectAll?.addEventListener('change', () => {
    gradeBoxes.forEach((cb) => {
      cb.checked = gradesSelectAll.checked;
    });
  });
  gradeBoxes.forEach((cb) => {
    cb.addEventListener('change', () => {
      if (!gradesSelectAll) return;
      gradesSelectAll.checked = gradeBoxes.length > 0 && gradeBoxes.every((g) => g.checked);
    });
  });
}

function initSignupUI() {
  const familySubjects = document.getElementById('family-subjects-grid');
  const tutorSubjects = document.getElementById('tutor-subjects-grid');
  const familyAvail = document.getElementById('family-availability');
  const tutorAvail = document.getElementById('tutor-availability');

  if (familySubjects) familySubjects.innerHTML = PSSubjects.renderCheckboxGrid('subjects-needed', 'family');
  if (tutorSubjects) tutorSubjects.innerHTML = PSSubjects.renderCheckboxGrid('subjects-teach', 'tutor');
  if (familyAvail) familyAvail.innerHTML = PSAvailability.renderDayTimePicker('availability-days', 'family-availability');
  if (tutorAvail) tutorAvail.innerHTML = PSAvailability.renderDayTimePicker('tutor-availability-days', 'tutor-availability');

  PSAvailability.initDayTimePickers(form);
  bindOtherToggle('family-subject-other-cb', 'family-subject-other');
  bindOtherToggle('tutor-subject-other-cb', 'tutor-subject-other');
  initGradesSelectAll();
}

function validateFamily() {
  if (!form.querySelector('#parent-match-flex')?.checked) {
    return 'Please confirm you understand how PeerScholars matching works.';
  }
  if (!form.querySelector('#parent-consent')?.checked) {
    return 'Please confirm the agreement checkbox to continue.';
  }
  const subjects = PSSubjects.collectFromForm(form, 'subjects-needed', 'family-subject-other');
  if (!subjects.labels.length) return 'Please select at least one subject.';
  return PSAvailability.validateForm(form, 'availability-days');
}

function validateTutor() {
  const subjects = PSSubjects.collectFromForm(form, 'subjects-teach', 'tutor-subject-other');
  if (!subjects.labels.length) return 'Please select at least one subject you can teach.';
  const grades = [...form.querySelectorAll('input[name="grades-can-teach"]:checked')];
  if (!grades.length) return 'Please select at least one grade (or use Select all grades).';
  const availError = PSAvailability.validateForm(form, 'tutor-availability-days');
  if (availError) return availError;
  if (!form.querySelector('#tutor-consent')?.checked) {
    return 'Please confirm the agreement checkbox to continue.';
  }
  const parentEmail = form.querySelector('#parent-guardian-email')?.value.trim();
  if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return 'Please enter a valid parent/guardian email address.';
  }
  return null;
}

function showSignupSuccess(role) {
  form.hidden = true;
  rolePickerCard.hidden = true;
  successOverlay.hidden = false;

  const messageEl = document.getElementById('signup-success-message');
  if (messageEl) {
    messageEl.textContent =
      role === 'family'
        ? 'Your registration has been submitted successfully. Our PeerScholars team will review your information and contact you soon to help match your child with a tutor.'
        : 'Your tutor application has been submitted successfully. Our PeerScholars team will review your information and get back to you soon with next steps.';
  }

  if (signupIntro) {
    signupIntro.textContent = 'Thank you — your submission is complete.';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });

  let secondsLeft = 10;
  const countdownEl = document.getElementById('signup-success-countdown');
  if (countdownEl) countdownEl.textContent = String(secondsLeft);

  const countdownTimer = setInterval(() => {
    secondsLeft -= 1;
    if (countdownEl) countdownEl.textContent = String(Math.max(secondsLeft, 0));
    if (secondsLeft <= 0) clearInterval(countdownTimer);
  }, 1000);

  setTimeout(() => {
    clearInterval(countdownTimer);
    window.location.href = 'index.html';
  }, 10000);
}

async function handleSubmit(e) {
  e.preventDefault();
  if (form.querySelector('[name="_honey"]')?.value) return;

  const role = roleInput.value;
  const error = role === 'family' ? validateFamily() : validateTutor();
  const errorNote = form.querySelector('.form-error');

  if (error) {
    errorNote.textContent = error;
    errorNote.hidden = false;
    errorNote.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  errorNote.hidden = true;
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Submitting…';

  const fd = new FormData(form);

  try {
    if (role === 'family') {
      await submitFamily(fd);
    } else {
      await submitTutor(fd);
    }
    showSignupSuccess(role);
  } catch (err) {
    errorNote.textContent = err.message || 'Something went wrong. Please try again.';
    errorNote.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

function buildAvailabilityPayload(formEl, dayCheckboxName) {
  const availabilitySlots = PSAvailability.collectFromForm(formEl, dayCheckboxName);
  const availabilityMap = PSAvailability.slotsToMap(availabilitySlots);
  const availabilityText = availabilitySlots
    .map((s) =>
      PSAvailability.formatSlot({
        day: s.day,
        start: PSAvailability.toMinutes(s.startTime),
        end: PSAvailability.toMinutes(s.endTime),
      })
    )
    .join('; ');
  return { availabilitySlots, availabilityMap, availabilityText };
}

async function submitFamily(fd) {
  const email = fd.get('email');
  const password = fd.get('password');
  if (!email || !password || password.length < 6) {
    throw new Error('Please enter a valid email and password (6+ characters).');
  }

  const user = PSStore.createUser({
    email,
    password,
    role: 'parent',
    firstName: fd.get('parent-first-name'),
    lastName: '',
    phone: fd.get('phone'),
    city: fd.get('city'),
    state: '',
    relationship: 'Parent',
    consent: true,
  });

  if (user.error) throw new Error(user.error);

  const subjects = PSSubjects.collectFromForm(form, 'subjects-needed', 'family-subject-other');
  const { availabilitySlots, availabilityMap, availabilityText } = buildAvailabilityPayload(
    form,
    'availability-days'
  );

  const student = PSStore.createStudent(user.id, {
    firstName: fd.get('child-first-name'),
    grade: fd.get('child-grade'),
    school: '',
    subjects: subjects.text,
    subjectTags: subjects.ids,
    topics: '',
    availability: availabilityText,
    availabilitySlots,
    availabilityMap,
    mode: 'Online',
    learningPrefs: '',
    interests: '',
    interestTags: [],
    notes: '',
    matchFlexConsent: true,
  });

  PSStore.createTutoringRequest({
    studentId: student.id,
    parentUserId: user.id,
    subjects: student.subjects,
    grade: student.grade,
    mode: 'Online',
    city: fd.get('city'),
    interests: '',
    interestTags: [],
    availability: availabilityText,
    availabilitySlots,
    availabilityMap,
  });

  await PSUtils.notifySupport('New PeerScholars Parent Sign Up', {
    parent_name: fd.get('parent-first-name'),
    email: fd.get('email'),
    phone: fd.get('phone'),
    city: fd.get('city'),
    child_name: fd.get('child-first-name'),
    child_grade: fd.get('child-grade'),
    subjects: subjects.text,
    availability: availabilityText,
  });
}

async function submitTutor(fd) {
  const email = fd.get('tutor-email');
  const password = fd.get('tutor-password');
  if (!email || !password || password.length < 6) {
    throw new Error('Please enter a valid email and password (6+ characters).');
  }

  const user = PSStore.createUser({
    email,
    password,
    role: 'tutor',
    firstName: fd.get('tutor-first-name'),
    lastName: fd.get('tutor-last-name'),
  });

  if (user.error) throw new Error(user.error);

  const parentEmail = fd.get('parent-guardian-email');
  const tutorFirstName = fd.get('tutor-first-name');
  const tutorLastName = fd.get('tutor-last-name');

  const subjects = PSSubjects.collectFromForm(form, 'subjects-teach', 'tutor-subject-other');
  const { availabilitySlots, availabilityMap, availabilityText } = buildAvailabilityPayload(
    form,
    'tutor-availability-days'
  );

  const profile = PSStore.createTutorProfile(user.id, {
    firstName: tutorFirstName,
    lastName: tutorLastName,
    grade: fd.get('tutor-grade'),
    school: fd.get('school'),
    city: fd.get('city'),
    state: '',
    parentFirstName: '',
    parentLastName: '',
    parentName: 'Parent/Guardian',
    parentEmail,
    parentPhone: '',
    subjects: subjects.text,
    subjectTags: subjects.ids,
    gradesCanTeach: [...form.querySelectorAll('input[name="grades-can-teach"]:checked')].map(
      (c) => c.value
    ),
    weeklyCapacity: Number(fd.get('weekly-capacity')) || 3,
    activeStudentCount: 0,
    availability: availabilityText,
    availabilitySlots,
    availabilityMap,
    mode: 'Online',
    bio: '',
    interests: '',
    interestTags: [],
    whyTutor: '',
    experience: '',
    schoolIdUploaded: false,
    tutorPhotoUploaded: false,
    schoolDocStatus: 'Not submitted',
    applicationStatus: 'Application Submitted',
    parentVerificationStatus: 'Pending',
    adminDecision: 'Pending',
  });

  const pv = PSStore.createParentVerification(profile.id, parentEmail, 'Parent/Guardian', '');

  const basePath = window.location.pathname.replace(/[^/]*$/, '');
  const verifyUrl = `${window.location.origin}${basePath}parent-verify.html?token=${pv.token}`;

  await PSUtils.notifySupport('New PeerScholars Tutor Application', {
    tutor_name: `${tutorFirstName} ${tutorLastName}`,
    school: fd.get('school'),
    grade: fd.get('tutor-grade'),
    city: fd.get('city'),
    subjects: subjects.text,
    grades: profile.gradesCanTeach.join(', '),
    availability: availabilityText,
    parent_email: parentEmail,
    status: 'Application Submitted — follow up for verification',
    parent_verification_link: verifyUrl,
    note: 'Fast signup — collect school ID and photo manually if needed.',
  });

  await PSUtils.sendParentVerificationEmail({
    parentEmail,
    parentFirstName: 'there',
    tutorFirstName,
    verifyUrl,
  });
}

rolePicker?.addEventListener('click', (e) => {
  const btn = e.target.closest('.signup-role-btn');
  if (!btn) return;
  showForm(btn.dataset.role);
});

backBtn?.addEventListener('click', showRolePicker);

if (form) {
  initSignupUI();
  let errorNote = form.querySelector('.form-error');
  if (!errorNote && submitBtn) {
    errorNote = document.createElement('p');
    errorNote.className = 'form-error';
    errorNote.hidden = true;
    errorNote.style.cssText =
      'font-size:0.875rem;color:#c0392b;margin-top:0.75rem;text-align:center;';
    submitBtn.insertAdjacentElement('afterend', errorNote);
  }
  form.addEventListener('submit', handleSubmit);

  const params = new URLSearchParams(window.location.search);
  const presetRole = params.get('role');
  if (presetRole === 'family' || presetRole === 'tutor') showForm(presetRole);
}
