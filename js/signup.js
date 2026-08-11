const SIGNUP_EMAIL = 'support@peerscholars.com';

const rolePickerCard = document.getElementById('role-picker-card');
const rolePicker = document.querySelector('.signup-role-picker');
const form = document.getElementById('signup-form');
const roleInput = document.getElementById('role-input');
const familyFields = document.getElementById('family-fields');
const tutorFields = document.getElementById('tutor-fields');
const backBtn = document.getElementById('signup-back');
const signupIntro = document.getElementById('signup-intro');
const submitBtn = document.getElementById('signup-submit');

const familyRequired = [
  '#parent-first-name',
  '#parent-last-name',
  '#family-phone',
  '#family-email',
  '#child-first-name',
  '#child-last-name',
  '#subjects-needed',
  '#interests',
];

const tutorRequired = [
  '#tutor-first-name',
  '#tutor-last-name',
  '#tutor-phone',
  '#tutor-email',
  '#school',
  '#age',
  '#tutor-grade',
  '#subjects-teach',
  '#days-per-week',
  '#kids-per-week',
];

function setRequired(selectors, required) {
  selectors.forEach((selector) => {
    const el = form.querySelector(selector);
    if (el) el.required = required;
  });
}

function clearForm() {
  form.reset();
  form.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
    cb.checked = false;
  });
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

  setRequired(familyRequired, role === 'family');
  setRequired(tutorRequired, role === 'tutor');

  if (signupIntro) {
    signupIntro.textContent =
      role === 'family'
        ? 'Tell us about your family and what kind of tutoring help you need.'
        : 'Tell us about yourself and your tutoring availability.';
  }

  if (submitBtn) {
    submitBtn.textContent = role === 'family' ? 'Submit — Find a Tutor' : 'Submit — Apply to Tutor';
  }
}

function collectCheckboxValues(name) {
  return [...form.querySelectorAll(`input[name="${name}"]:checked`)]
    .map((input) => input.value)
    .join(', ');
}

function validateCheckboxes(role) {
  if (role === 'family') {
    const days = collectCheckboxValues('reach-days');
    if (!days) {
      return 'Please select at least one day we can reach you.';
    }
  }

  if (role === 'tutor') {
    const grades = collectCheckboxValues('grades-can-teach');
    if (!grades) {
      return 'Please select at least one grade level you can teach.';
    }
  }

  return null;
}

function buildPayload() {
  const role = roleInput.value;
  const data = Object.fromEntries(new FormData(form));
  delete data._honey;

  if (role === 'family') {
    data['reach-days'] = collectCheckboxValues('reach-days');
    delete data['grades-can-teach'];
    delete data['tutor-first-name'];
    delete data['tutor-last-name'];
    delete data.school;
    delete data.age;
    delete data['tutor-grade'];
    delete data['subjects-teach'];
    delete data['days-per-week'];
    delete data['kids-per-week'];
  } else {
    data['grades-can-teach'] = collectCheckboxValues('grades-can-teach');
    delete data['reach-days'];
    delete data['parent-first-name'];
    delete data['parent-last-name'];
    delete data['child-first-name'];
    delete data['child-last-name'];
    delete data['subjects-needed'];
    delete data.interests;
  }

  return {
    role,
    data,
    subject:
      role === 'family'
        ? 'New PeerScholars Family Sign Up'
        : 'New PeerScholars Tutor Sign Up',
  };
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

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (form.querySelector('[name="_honey"]')?.value) return;

    const checkboxError = validateCheckboxes(roleInput.value);
    if (checkboxError) {
      errorNote.textContent = checkboxError;
      errorNote.hidden = false;
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    errorNote.hidden = true;

    const { data, subject } = buildPayload();

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${SIGNUP_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: subject,
          _captcha: 'false',
          _template: 'table',
          ...data,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        window.location.href = 'signup-success.html';
        return;
      }

      throw new Error(result.message || 'Submit failed');
    } catch {
      errorNote.textContent =
        'Something went wrong. Please try again or email support@peerscholars.com directly.';
      errorNote.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });

  const params = new URLSearchParams(window.location.search);
  const presetRole = params.get('role');
  if (presetRole === 'family' || presetRole === 'tutor') {
    showForm(presetRole);
  }
}
