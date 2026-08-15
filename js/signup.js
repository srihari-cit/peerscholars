const SIGNUP_EMAIL = window.PS_CONFIG?.SIGNUP_EMAIL || 'support@peerscholars.com';

const rolePickerCard = document.getElementById('role-picker-card');
const rolePicker = document.querySelector('.signup-role-picker');
const form = document.getElementById('signup-form');
const roleInput = document.getElementById('role-input');
const familyFields = document.getElementById('family-fields');
const tutorFields = document.getElementById('tutor-fields');
const backBtn = document.getElementById('signup-back');
const signupIntro = document.getElementById('signup-intro');
const submitBtn = document.getElementById('signup-submit');

function setRequired(container, selectors, required) {
  selectors.forEach((selector) => {
    const el = container.querySelector(selector);
    if (el) el.required = required;
  });
}

function clearForm() {
  form.reset();
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = false;
  });
}

function collectCheckboxValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)]
    .map((input) => input.value)
    .join(', ');
}

function showRolePicker() {
  rolePickerCard.hidden = false;
  form.hidden = true;
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
  familyFields.hidden = role !== 'family';
  tutorFields.hidden = role !== 'tutor';

  if (submitBtn) {
    submitBtn.textContent =
      role === 'family' ? 'Create Account — Find a Tutor' : 'Submit Tutor Application';
  }

  if (signupIntro) {
    signupIntro.textContent =
      role === 'family'
        ? 'Create your parent account and tell us about your K–8 student. Tutoring is $12.99/hour.'
        : 'Apply to become a verified PeerScholars tutor. Tutors earn $9/hour for completed sessions.';
  }
}

function validateFamily() {
  if (!form.querySelector('#parent-consent')?.checked) {
    return 'Please confirm parent/guardian consent.';
  }
  const days = collectCheckboxValues('availability-days');
  if (!days) return 'Please select at least one availability day.';
  return null;
}

function validateTutor() {
  const grades = collectCheckboxValues('grades-can-teach');
  if (!grades) return 'Please select at least one grade level you can tutor.';
  if (!form.querySelector('#tutor-parent-consent')?.checked) {
    return 'Parent/guardian consent is required for minor tutors.';
  }
  if (!form.querySelector('#code-of-conduct-read')?.checked) {
    return 'Please confirm you have read the Tutor Code of Conduct.';
  }
  const file = form.querySelector('#school-doc')?.files?.[0];
  if (!file) return 'Please upload a school-issued enrollment document.';
  if (file.size > 5 * 1024 * 1024) return 'School document must be under 5 MB.';
  return null;
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
    return;
  }

  errorNote.hidden = true;
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creating account...';

  const fd = new FormData(form);

  try {
    if (role === 'family') {
      await submitFamily(fd);
    } else {
      await submitTutor(fd);
    }
  } catch (err) {
    errorNote.textContent = err.message || 'Something went wrong. Please try again.';
    errorNote.hidden = false;
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
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
    lastName: fd.get('parent-last-name'),
    phone: fd.get('phone'),
    city: fd.get('city'),
    state: fd.get('state'),
    relationship: fd.get('relationship'),
    consent: true,
  });

  if (user.error) throw new Error(user.error);

  const student = PSStore.createStudent(user.id, {
    firstName: fd.get('child-first-name'),
    grade: fd.get('child-grade'),
    school: fd.get('child-school') || '',
    subjects: fd.get('subjects-needed'),
    topics: fd.get('topics-needed') || '',
    availability: collectCheckboxValues('availability-days') + (fd.get('availability-notes') ? ` — ${fd.get('availability-notes')}` : ''),
    mode: fd.get('session-mode'),
    learningPrefs: fd.get('learning-prefs') || '',
    interests: fd.get('interests'),
    notes: fd.get('tutoring-notes') || '',
  });

  PSStore.createTutoringRequest({
    studentId: student.id,
    parentUserId: user.id,
    subjects: student.subjects,
    grade: student.grade,
    mode: student.mode,
    city: fd.get('city'),
    interests: student.interests,
    availability: student.availability,
    status: 'pending',
  });

  await PSUtils.notifySupport('New PeerScholars Parent Sign Up', Object.fromEntries(fd));

  window.location.href = 'parent-dashboard.html?welcome=1';
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

  const file = form.querySelector('#school-doc').files[0];
  const fileData = await PSUtils.readFileAsDataURL(file);

  const profile = PSStore.createTutorProfile(user.id, {
    firstName: fd.get('tutor-first-name'),
    lastName: fd.get('tutor-last-name'),
    age: Number(fd.get('age')),
    grade: fd.get('tutor-grade'),
    school: fd.get('school'),
    city: fd.get('city'),
    state: fd.get('state'),
    parentName: fd.get('parent-guardian-name'),
    parentEmail: fd.get('parent-guardian-email'),
    subjects: fd.get('subjects-teach'),
    gradesCanTeach: [...form.querySelectorAll('input[name="grades-can-teach"]:checked')].map(
      (c) => c.value
    ),
    availability:
      collectCheckboxValues('tutor-availability-days') +
      (fd.get('availability-details') ? ` — ${fd.get('availability-details')}` : ''),
    mode: fd.get('session-mode'),
    bio: fd.get('bio'),
    interests: fd.get('interests'),
    whyTutor: fd.get('why-tutor'),
    experience: fd.get('experience'),
    parentConsent: true,
    schoolDocName: file.name,
    schoolDocData: fileData,
    schoolDocStatus: 'Submitted',
    schoolDocSubmittedAt: PSStore.now(),
  });

  const pv = PSStore.createParentVerification(
    profile.id,
    fd.get('parent-guardian-email'),
    fd.get('parent-guardian-name')
  );

  const verifyUrl = `${window.location.origin}${window.location.pathname.replace('signup.html', '')}parent-verify.html?token=${pv.token}`;

  await PSUtils.notifySupport('New PeerScholars Tutor Application', {
    ...Object.fromEntries(fd),
    school_document: file.name,
    parent_verification_link: verifyUrl,
    note: 'School document stored securely in admin dashboard only.',
  });

  await PSUtils.notifySupport(
    `PeerScholars: Parent verification needed for ${fd.get('tutor-first-name')} ${fd.get('tutor-last-name')}`,
    {
      _cc: fd.get('parent-guardian-email'),
      message: `Hello ${fd.get('parent-guardian-name')},

Your student has applied to tutor through PeerScholars. Please confirm you approve by visiting:

${verifyUrl}

Thank you,
PeerScholars`,
    }
  );

  window.location.href = 'tutor-dashboard.html?welcome=1';
}

rolePicker?.addEventListener('click', (e) => {
  const btn = e.target.closest('.signup-role-btn');
  if (!btn) return;
  showForm(btn.dataset.role);
});

backBtn?.addEventListener('click', showRolePicker);

if (form) {
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
