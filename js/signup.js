const SIGNUP_EMAIL = 'support@peerscholars.com';
const VERIFY_STORAGE_KEY = 'peerscholars_tutor_verify';
const VERIFY_TTL_MS = 15 * 60 * 1000;
const BSD_EMAIL_PATTERN = /@bsd405\.org$/i;

// Optional EmailJS setup — add keys here after creating a free EmailJS account.
const EMAILJS_PUBLIC_KEY = '';
const EMAILJS_SERVICE_ID = '';
const EMAILJS_TEMPLATE_ID = '';

const rolePickerCard = document.getElementById('role-picker-card');
const rolePicker = document.querySelector('.signup-role-picker');
const form = document.getElementById('signup-form');
const roleInput = document.getElementById('role-input');
const familyFields = document.getElementById('family-fields');
const tutorFields = document.getElementById('tutor-fields');
const backBtn = document.getElementById('signup-back');
const signupIntro = document.getElementById('signup-intro');
const submitBtn = document.getElementById('signup-submit');

const schoolEmailInput = document.getElementById('school-email');
const sendCodeBtn = document.getElementById('send-code-btn');
const codeSentNote = document.getElementById('code-sent-note');
const confirmationCodeInput = document.getElementById('confirmation-code');
const verifyCodeBtn = document.getElementById('verify-code-btn');
const verifySuccess = document.getElementById('verify-success');
const verifyError = document.getElementById('verify-error');
const verifyPanel = document.querySelector('.tutor-verify-panel');

let tutorEmailVerified = false;

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
  '#school-email',
  '#tutor-phone',
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

function isValidSchoolEmail(email) {
  return BSD_EMAIL_PATTERN.test(String(email || '').trim());
}

function generateVerificationCode() {
  return String(Math.floor(10000 + Math.random() * 90000));
}

function saveVerification(email, code) {
  sessionStorage.setItem(
    VERIFY_STORAGE_KEY,
    JSON.stringify({
      email: email.trim().toLowerCase(),
      code,
      expires: Date.now() + VERIFY_TTL_MS,
    })
  );
}

function readVerification() {
  try {
    const raw = sessionStorage.getItem(VERIFY_STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (!data?.email || !data?.code || !data?.expires) return null;
    if (Date.now() > data.expires) {
      sessionStorage.removeItem(VERIFY_STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function resetTutorVerification() {
  tutorEmailVerified = false;
  sessionStorage.removeItem(VERIFY_STORAGE_KEY);
  if (confirmationCodeInput) confirmationCodeInput.value = '';
  if (verifySuccess) verifySuccess.hidden = true;
  if (verifyError) verifyError.hidden = true;
  if (codeSentNote) codeSentNote.hidden = true;
  verifyPanel?.classList.remove('is-verified');
  if (submitBtn && roleInput.value === 'tutor') {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Submit — Apply to Tutor';
  }
}

async function sendVerificationEmail(schoolEmail, code, studentName) {
  const greeting = studentName ? `Hi ${studentName},` : 'Hi,';
  const message = `${greeting}

Your PeerScholars tutor verification code is:

${code}

Enter this code on the sign-up page within 15 minutes.

If you did not request this, you can ignore this email.

— PeerScholars`;

  if (EMAILJS_PUBLIC_KEY && EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && window.emailjs) {
    emailjs.init({ publicKey: EMAILJS_PUBLIC_KEY });
    await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
      to_email: schoolEmail,
      verification_code: code,
      student_name: studentName || 'Tutor applicant',
      message,
    });
    return;
  }

  // Send through our verified support inbox and CC the student's BSD Outlook email.
  // Posting directly to the student address fails because FormSubmit requires each
  // new "owner" email to be activated first.
  const response = await fetch(`https://formsubmit.co/ajax/${SIGNUP_EMAIL}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      _subject: 'Your PeerScholars verification code',
      _captcha: 'false',
      _template: 'box',
      _cc: schoolEmail,
      email: schoolEmail,
      student_name: studentName || 'Tutor applicant',
      school_email: schoolEmail,
      verification_code: code,
      message,
    }),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || 'Could not send verification email');
  }
}

async function handleSendCode() {
  const schoolEmail = schoolEmailInput?.value.trim();
  const firstName = form.querySelector('#tutor-first-name')?.value.trim();

  if (!isValidSchoolEmail(schoolEmail)) {
    verifyError.textContent =
      'Please enter your official Bellevue School District email (must end in @bsd405.org).';
    verifyError.hidden = false;
    verifySuccess.hidden = true;
    return;
  }

  resetTutorVerification();
  tutorEmailVerified = false;

  const code = generateVerificationCode();
  saveVerification(schoolEmail, code);

  sendCodeBtn.disabled = true;
  sendCodeBtn.textContent = 'Sending code...';
  verifyError.hidden = true;

  try {
    await sendVerificationEmail(schoolEmail, code, firstName);
    if (codeSentNote) codeSentNote.hidden = false;
    sendCodeBtn.textContent = 'Resend code';
  } catch {
    sessionStorage.removeItem(VERIFY_STORAGE_KEY);
    verifyError.textContent =
      'We could not send the code. Double-check your @bsd405.org address and try again, or email support@peerscholars.com.';
    verifyError.hidden = false;
    sendCodeBtn.textContent = 'Send 5-digit verification code';
  } finally {
    sendCodeBtn.disabled = false;
  }
}

function handleVerifyCode() {
  const entered = confirmationCodeInput?.value.trim();
  const schoolEmail = schoolEmailInput?.value.trim().toLowerCase();
  const stored = readVerification();

  verifySuccess.hidden = true;
  verifyError.hidden = true;

  if (!entered || entered.length !== 5) {
    verifyError.textContent = 'Please enter the 5-digit code from your email.';
    verifyError.hidden = false;
    return;
  }

  if (!stored || stored.email !== schoolEmail) {
    verifyError.textContent =
      'Please send a verification code to your school email first.';
    verifyError.hidden = false;
    return;
  }

  if (entered !== stored.code) {
    verifyError.textContent = 'Sorry, that code is wrong. Please try again.';
    verifyError.hidden = false;
    tutorEmailVerified = false;
    verifyPanel?.classList.remove('is-verified');
    return;
  }

  tutorEmailVerified = true;
  verifySuccess.hidden = false;
  verifyError.hidden = true;
  verifyPanel?.classList.add('is-verified');
}

function showRolePicker() {
  rolePickerCard.hidden = false;
  form.hidden = true;
  familyFields.hidden = true;
  tutorFields.hidden = true;
  roleInput.value = '';
  resetTutorVerification();
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
  resetTutorVerification();
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
        : 'Verify your Bellevue School District email, then tell us about your tutoring availability.';
  }

  if (submitBtn) {
    submitBtn.textContent = role === 'family' ? 'Submit — Find a Tutor' : 'Submit — Apply to Tutor';
    submitBtn.disabled = false;
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
    if (!isValidSchoolEmail(schoolEmailInput?.value.trim())) {
      return 'Please enter your official @bsd405.org school email.';
    }
    if (!tutorEmailVerified) {
      return 'Please verify your school email with the confirmation code before submitting.';
    }
  }

  return null;
}

function buildPayload() {
  const role = roleInput.value;
  const data = Object.fromEntries(new FormData(form));
  delete data._honey;
  delete data['confirmation-code'];

  if (role === 'family') {
    data['reach-days'] = collectCheckboxValues('reach-days');
    delete data['grades-can-teach'];
    delete data['tutor-first-name'];
    delete data['tutor-last-name'];
    delete data['school-email'];
    delete data.school;
    delete data.age;
    delete data['tutor-grade'];
    delete data['subjects-teach'];
    delete data['days-per-week'];
    delete data['kids-per-week'];
  } else {
    data['grades-can-teach'] = collectCheckboxValues('grades-can-teach');
    data['school-email-verified'] = 'Yes';
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
        : 'New PeerScholars Tutor Sign Up (Verified)',
  };
}

rolePicker?.addEventListener('click', (e) => {
  const btn = e.target.closest('.signup-role-btn');
  if (!btn) return;
  showForm(btn.dataset.role);
});

backBtn?.addEventListener('click', showRolePicker);
sendCodeBtn?.addEventListener('click', handleSendCode);
verifyCodeBtn?.addEventListener('click', handleVerifyCode);

confirmationCodeInput?.addEventListener('input', () => {
  verifyError.hidden = true;
  if (confirmationCodeInput.value.trim().length === 5) {
    handleVerifyCode();
  }
});

schoolEmailInput?.addEventListener('input', () => {
  if (tutorEmailVerified) {
    resetTutorVerification();
  }
});

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
        sessionStorage.removeItem(VERIFY_STORAGE_KEY);
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
