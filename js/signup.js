const SIGNUP_EMAIL = 'support@peerscholars.com';
const form = document.getElementById('signup-form');

if (form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  let errorNote = form.querySelector('.form-error');

  if (!errorNote) {
    errorNote = document.createElement('p');
    errorNote.className = 'form-error';
    errorNote.hidden = true;
    errorNote.style.cssText = 'font-size:0.875rem;color:#c0392b;margin-top:0.75rem;text-align:center;';
    submitBtn.insertAdjacentElement('afterend', errorNote);
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (form.querySelector('[name="_honey"]')?.value) return;

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';
    errorNote.hidden = true;

    const data = Object.fromEntries(new FormData(form));
    delete data._honey;

    try {
      const response = await fetch(`https://formsubmit.co/ajax/${SIGNUP_EMAIL}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: 'New PeerScholars Sign Up',
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
      errorNote.textContent = 'Something went wrong. Please try again or email support@peerscholars.com directly.';
      errorNote.hidden = false;
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
}
