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
        : 'Apply to become a PeerScholars tutor. Upload your school ID and photo, then we\'ll email your parent/guardian to confirm.';
  }
}

function collectInterestTags(checkboxName, otherInputId) {
  const tags = [...form.querySelectorAll(`input[name="${checkboxName}"]:checked`)]
    .map((c) => c.value)
    .filter((v) => v !== 'other');
  const other = document.getElementById(otherInputId)?.value?.trim();
  if (other) tags.push(other);
  return tags;
}

function interestsToText(tags) {
  return tags.map((id) => PSInterests.labelFor(id)).join(', ');
}

function initSignupUI() {
  const familyInterests = document.getElementById('family-interests-grid');
  const tutorInterests = document.getElementById('tutor-interests-grid');
  const familyAvail = document.getElementById('family-availability');
  const tutorAvail = document.getElementById('tutor-availability');

  if (familyInterests) familyInterests.innerHTML = PSInterests.renderCheckboxGrid('interest-tags', 'family');
  if (tutorInterests) tutorInterests.innerHTML = PSInterests.renderCheckboxGrid('tutor-interest-tags', 'tutor');
  if (familyAvail) familyAvail.innerHTML = PSAvailability.renderDayTimePicker('availability-days', 'family-avail', 'family-availability');
  if (tutorAvail) tutorAvail.innerHTML = PSAvailability.renderDayTimePicker('tutor-availability-days', 'tutor-avail', 'tutor-availability');

  PSAvailability.initDayTimePickers(form);

  form.querySelector('#family-interest-other-cb')?.addEventListener('change', (e) => {
    const el = document.getElementById('family-interest-other');
    if (el) el.hidden = !e.target.checked;
  });
  form.querySelector('#tutor-interest-other-cb')?.addEventListener('change', (e) => {
    const el = document.getElementById('tutor-interest-other');
    if (el) el.hidden = !e.target.checked;
  });
}

function validateFamily() {
  if (!form.querySelector('#parent-consent')?.checked) {
    return 'Please confirm parent/guardian consent.';
  }
  const tags = collectInterestTags('interest-tags', 'family-interest-other');
  if (!tags.length) return 'Please select at least one interest.';
  const slots = PSAvailability.collectFromForm(form, 'availability-days', 'family-avail');
  if (!slots.length) return 'Please select at least one day and time you are available.';
  return null;
}

function validateTutor() {
  const grades = collectCheckboxValues('grades-can-teach');
  if (!grades) return 'Please select at least one grade level you can tutor.';
  if (!form.querySelector('#weekly-capacity')?.value) return 'Please select your weekly student capacity.';
  const tags = collectInterestTags('tutor-interest-tags', 'tutor-interest-other');
  if (!tags.length) return 'Please select at least one interest.';
  const slots = PSAvailability.collectFromForm(form, 'tutor-availability-days', 'tutor-avail');
  if (!slots.length) return 'Please select at least one day and time you are available to tutor.';
  if (!form.querySelector('#code-of-conduct-read')?.checked) {
    return 'Please confirm you have read the Tutor Code of Conduct.';
  }
  const schoolId = form.querySelector('#school-id')?.files?.[0];
  const tutorPhoto = form.querySelector('#tutor-photo')?.files?.[0];
  if (!schoolId) return 'Please upload a clear photo of your school ID.';
  if (!tutorPhoto) return 'Please upload a clear photo of yourself.';
  if (schoolId.size > 5 * 1024 * 1024) return 'School ID photo must be under 5 MB.';
  if (tutorPhoto.size > 5 * 1024 * 1024) return 'Your photo must be under 5 MB.';
  const parentEmail = form.querySelector('#parent-guardian-email')?.value.trim();
  if (!parentEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentEmail)) {
    return 'Please enter a valid parent/guardian email address.';
  }
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

  const interestTags = collectInterestTags('interest-tags', 'family-interest-other');
  const availabilitySlots = PSAvailability.collectFromForm(form, 'availability-days', 'family-avail');
  const availabilityText = availabilitySlots.map((s) => PSAvailability.formatSlot({ day: s.day, start: PSAvailability.toMinutes(s.startTime), end: PSAvailability.toMinutes(s.endTime) })).join('; ');

  const student = PSStore.createStudent(user.id, {
    firstName: fd.get('child-first-name'),
    grade: fd.get('child-grade'),
    school: fd.get('child-school') || '',
    subjects: fd.get('subjects-needed'),
    topics: fd.get('topics-needed') || '',
    availability: availabilityText,
    availabilitySlots,
    mode: 'Online',
    learningPrefs: fd.get('learning-prefs') || '',
    interests: interestsToText(interestTags),
    interestTags,
    notes: fd.get('tutoring-notes') || '',
  });

  PSStore.createTutoringRequest({
    studentId: student.id,
    parentUserId: user.id,
    subjects: student.subjects,
    grade: student.grade,
    mode: 'Online',
    city: fd.get('city'),
    interests: student.interests,
    interestTags,
    availability: availabilityText,
    availabilitySlots,
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

  const schoolIdFile = form.querySelector('#school-id').files[0];
  const tutorPhotoFile = form.querySelector('#tutor-photo').files[0];
  const schoolIdData = await PSUtils.readFileAsDataURL(schoolIdFile);
  const tutorPhotoData = await PSUtils.readFileAsDataURL(tutorPhotoFile);

  const parentFirstName = fd.get('parent-first-name');
  const parentLastName = fd.get('parent-last-name');
  const parentEmail = fd.get('parent-guardian-email');
  const parentPhone = fd.get('parent-guardian-phone');
  const tutorFirstName = fd.get('tutor-first-name');

  const tutorInterestTags = collectInterestTags('tutor-interest-tags', 'tutor-interest-other');
  const tutorAvailabilitySlots = PSAvailability.collectFromForm(form, 'tutor-availability-days', 'tutor-avail');
  const tutorAvailabilityText = tutorAvailabilitySlots.map((s) => PSAvailability.formatSlot({ day: s.day, start: PSAvailability.toMinutes(s.startTime), end: PSAvailability.toMinutes(s.endTime) })).join('; ');

  const profile = PSStore.createTutorProfile(user.id, {
    firstName: tutorFirstName,
    lastName: fd.get('tutor-last-name'),
    age: Number(fd.get('age')),
    grade: fd.get('tutor-grade'),
    school: fd.get('school'),
    city: fd.get('city'),
    state: fd.get('state'),
    parentFirstName,
    parentLastName,
    parentName: `${parentFirstName} ${parentLastName}`.trim(),
    parentEmail,
    parentPhone,
    subjects: fd.get('subjects-teach'),
    gradesCanTeach: [...form.querySelectorAll('input[name="grades-can-teach"]:checked')].map(
      (c) => c.value
    ),
    weeklyCapacity: Number(fd.get('weekly-capacity')) || 1,
    activeStudentCount: 0,
    availability: tutorAvailabilityText,
    availabilitySlots: tutorAvailabilitySlots,
    mode: 'Online',
    bio: fd.get('bio'),
    interests: interestsToText(tutorInterestTags),
    interestTags: tutorInterestTags,
    whyTutor: fd.get('why-tutor'),
    experience: fd.get('experience'),
    schoolIdUploaded: true,
    schoolIdName: schoolIdFile.name,
    schoolIdData,
    tutorPhotoUploaded: true,
    tutorPhotoName: tutorPhotoFile.name,
    tutorPhotoData,
    schoolDocStatus: 'Submitted',
    applicationStatus: 'Parent Verification Pending',
    parentVerificationStatus: 'Parent Verification Pending',
    adminDecision: 'Pending',
  });

  const pv = PSStore.createParentVerification(
    profile.id,
    parentEmail,
    `${parentFirstName} ${parentLastName}`.trim(),
    parentFirstName
  );

  const basePath = window.location.pathname.replace(/[^/]*$/, '');
  const verifyUrl = `${window.location.origin}${basePath}parent-verify.html?token=${pv.token}`;

  await PSUtils.notifySupport('New PeerScholars Tutor Application', {
    tutor_name: `${tutorFirstName} ${fd.get('tutor-last-name')}`,
    school: fd.get('school'),
    grade: fd.get('tutor-grade'),
    parent_name: `${parentFirstName} ${parentLastName}`,
    parent_email: parentEmail,
    parent_phone: parentPhone,
    school_id_uploaded: 'Yes',
    tutor_photo_uploaded: 'Yes',
    status: 'Parent Verification Pending',
    parent_verification_link: verifyUrl,
    note: 'School ID and verification photo stored securely — admin dashboard only.',
  });

  await PSUtils.sendParentVerificationEmail({
    parentEmail,
    parentFirstName,
    tutorFirstName,
    verifyUrl,
  });

  window.location.href = 'tutor-dashboard.html?welcome=1';
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
