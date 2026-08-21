/** Shared UI helpers */
window.PSUtils = {
  esc(str) {
    const d = document.createElement('div');
    d.textContent = str ?? '';
    return d.innerHTML;
  },

  formatDate(dateStr) {
    if (!dateStr) return '—';
    try {
      return new Date(`${dateStr}T12:00:00`).toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  },

  formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  },

  badge(text, type = 'blue') {
    return `<span class="badge badge-${type}">${this.esc(text)}</span>`;
  },

  readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  async notifySupport(subject, data) {
    const email = window.PS_CONFIG?.SIGNUP_EMAIL || 'support@peerscholars.com';
    try {
      await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: subject,
          _captcha: 'false',
          _template: 'table',
          ...data,
        }),
      });
    } catch {
      /* non-blocking for launch mode */
    }
  },

  buildParentVerificationEmail({ parentFirstName, tutorFirstName, verifyUrl }) {
    return `Hello ${parentFirstName},

We're reaching out because your child, ${tutorFirstName}, has applied to become a tutor with PeerScholars.

As part of our tutor verification process, we ask a parent or guardian to confirm that they are aware of the application and approve their student's participation.

If the information provided by ${tutorFirstName} is correct and you are comfortable with them participating as a PeerScholars tutor, please confirm their application here:

${verifyUrl}

Your confirmation helps us maintain a safe, trusted, and supportive tutoring community for both younger students and high-school tutors.

If you did not expect this application or have any questions, please contact PeerScholars at support@peerscholars.com before approving it.

Thank you for supporting ${tutorFirstName} and helping them make a positive impact through PeerScholars.

Warmly,

The PeerScholars Team`;
  },

  async sendParentVerificationEmail({ parentEmail, parentFirstName, tutorFirstName, verifyUrl }) {
    const subject = `Please Confirm ${tutorFirstName}'s PeerScholars Tutor Application`;
    const message = this.buildParentVerificationEmail({ parentFirstName, tutorFirstName, verifyUrl });
    const email = window.PS_CONFIG?.SIGNUP_EMAIL || 'support@peerscholars.com';
    try {
      await fetch(`https://formsubmit.co/ajax/${email}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          _subject: subject,
          _captcha: 'false',
          _template: 'box',
          _cc: parentEmail,
          parent_first_name: parentFirstName,
          tutor_first_name: tutorFirstName,
          confirm_link: verifyUrl,
          message,
        }),
      });
    } catch {
      /* non-blocking */
    }
  },

  verifiedTutorBadge() {
    return '<span class="verified-badge">✓ PeerScholars Verified Tutor</span>';
  },

  sessionConfirmNote(session) {
    if (!session) return '';
    if (session.paymentStatus === 'paid') return 'Payment recorded — tutor receives $9 for this session.';
    if (session.status === 'Disputed' || session.paymentStatus === 'disputed') {
      return 'This session is under review. No payment until PeerScholars resolves it.';
    }
    if (session.parentConfirmed && session.tutorConfirmed) return 'Both confirmed — payment is being processed.';
    if (session.parentConfirmed) return 'You confirmed · waiting for tutor to confirm.';
    if (session.tutorConfirmed) return 'Tutor confirmed · waiting for parent to confirm.';
    return 'After the session, both parent and tutor must confirm before payment is released.';
  },

  sessionCanConfirm(session, role) {
    if (!session || session.paymentStatus === 'paid' || session.status === 'Disputed') return false;
    if (role === 'parent') return !session.parentConfirmed;
    if (role === 'tutor') return !session.tutorConfirmed;
    return false;
  },

  tutorVerificationStage(tutor) {
    if (tutor.verified) return 'Verified';
    if (tutor.adminDecision === 'Verified' && !tutor.codeOfConductAccepted) return 'Code of Conduct';
    if (tutor.applicationSubmittedAt) return 'Admin Review';
    return 'Application Submitted';
  },

  CODE_OF_CONDUCT: `PeerScholars Tutor Code of Conduct

By accepting, you agree to:

1. Treat students respectfully at all times.
2. Arrive on time for every session.
3. Only tutor approved subjects and grade levels.
4. Never request unnecessary personal information from a younger student.
5. Never ask a student to keep communication secret from their parent/guardian.
6. Do not communicate with younger students through private personal social-media accounts.
7. Do not exchange personal phone numbers unless explicitly authorized through PeerScholars.
8. All tutoring sessions are online via Google Meet.
9. Report safety concerns immediately to PeerScholars.
10. Do not engage in inappropriate conversations or behavior.
11. Do not record tutoring sessions without required permission.
12. Maintain professional boundaries.
13. Do not share student information with others.`,
};
