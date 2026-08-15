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

  tutorVerificationStage(tutor) {
    if (tutor.verified) return 'Verified';
    if (tutor.finalReviewStatus === 'Approved') return 'Final Admin Review';
    if (tutor.interviewStatus === 'Passed') return 'Final Admin Review';
    if (['Scheduled', 'Completed', 'Passed', 'Needs follow-up', 'Failed'].includes(tutor.interviewStatus))
      return 'PeerScholars Interview';
    if (['Submitted', 'Under review', 'Approved', 'Rejected', 'Needs another document'].includes(tutor.schoolDocStatus))
      return 'School Enrollment Verification';
    if (tutor.parentVerificationStatus === 'Confirmed') return 'School Enrollment Verification';
    if (tutor.applicationSubmittedAt) return 'Parent/Guardian Verification';
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
8. Do not meet students at private residences.
9. In-person tutoring must happen only at approved public locations.
10. Report safety concerns immediately to PeerScholars.
11. Do not engage in inappropriate conversations or behavior.
12. Do not record tutoring sessions without required permission.
13. Maintain professional boundaries.
14. Do not share student information with others.`,
};
