/** Peer-student tutor matching — qualification first, then compatibility */
window.PSMatching = {
  gradeToNum(grade) {
    const g = String(grade || '').toLowerCase().trim();
    if (g === 'k' || g === 'kindergarten') return 0;
    const m = g.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : -1;
  },

  tutorTeachesGrade(tutor, studentGrade) {
    const sn = this.gradeToNum(studentGrade);
    if (sn < 0) return false;
    const grades = tutor.gradesCanTeach || [];
    return grades.some((g) => this.gradeToNum(g) === sn);
  },

  subjectMatch(request, tutor) {
    const reqSubjects = String(request.subjects || '')
      .toLowerCase()
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const tutorSubjects = String(tutor.subjects || '')
      .toLowerCase()
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    return reqSubjects.some((s) => tutorSubjects.some((t) => t.includes(s) || s.includes(t)));
  },

  hasCapacity(tutor) {
    const cap = tutor.weeklyCapacity ?? tutor.kidsPerWeek ?? 4;
    const max = cap >= 6 ? 99 : Number(cap) || 1;
    const active = tutor.activeStudentCount ?? 0;
    return active < max;
  },

  passesRequiredFilters(request, tutor, student) {
    if (!tutor.verified || tutor.suspended) return false;
    if (!this.subjectMatch(request, tutor)) return false;
    if (!this.tutorTeachesGrade(tutor, request.grade || student?.grade)) return false;
    if (!this.hasCapacity(tutor)) return false;
    const studentSlots = PSAvailability.parseSlots(student || request);
    const tutorSlots = PSAvailability.parseSlots(tutor);
    if (!PSAvailability.overlap(studentSlots, tutorSlots).length) return false;
    return true;
  },

  scoreTutor(request, tutor, student) {
    if (!this.passesRequiredFilters(request, tutor, student)) return null;

    const studentSlots = PSAvailability.parseSlots(student || request);
    const tutorSlots = PSAvailability.parseSlots(tutor);
    const overlaps = PSAvailability.overlap(studentSlots, tutorSlots);
    const shared = PSInterests.shared(student || request, tutor);

    let availabilityPts = 0;
    if (overlaps.length >= 2) availabilityPts = 30;
    else if (overlaps.length === 1) availabilityPts = 22;
    else availabilityPts = 10;

    const maxInterest = Math.max(PSInterests.parseInterests(student || request).length, 1);
    const interestPts = Math.round((shared.length / maxInterest) * 30);

    const cap = tutor.weeklyCapacity ?? 4;
    const active = tutor.activeStudentCount ?? 0;
    const max = cap >= 6 ? 6 : Number(cap) || 1;
    const capacityPts = Math.round(((max - active) / max) * 15);

    const modePts = 15;
    const locationPts = 10;

    const total = availabilityPts + interestPts + capacityPts + modePts + locationPts;
    const matchPercent = Math.min(100, Math.round((total / 100) * 100));

    let explanation = `Strong match because ${tutor.firstName} teaches your child's grade level`;
    if (shared.length) {
      explanation += `, shares ${shared.length} interest${shared.length > 1 ? 's' : ''} with your child`;
    }
    if (overlaps.length) {
      explanation += `, and has availability that fits your schedule`;
    }
    explanation += '.';

    return {
      tutor,
      score: total,
      matchPercent,
      sharedInterests: shared,
      sharedInterestLabels: shared.map((id) => PSInterests.labelFor(id)),
      overlaps,
      explanation,
      availabilityDisplay: overlaps.slice(0, 2).map((s) => PSAvailability.formatSlot(s)),
    };
  },

  findMatches(request, tutors, student, limit = 3) {
    return tutors
      .map((tutor) => this.scoreTutor(request, tutor, student))
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },

  suggestSessionTimes(overlapSlots, count = 4) {
    const times = [];
    overlapSlots.forEach((slot) => {
      for (let t = slot.start; t + 60 <= slot.end && times.length < count; t += 30) {
        times.push({ day: slot.day, start: t, end: t + 60, label: `${PSAvailability.DAY_LABELS[slot.day]} ${PSAvailability.formatMinutes(t)}` });
      }
    });
    return times.slice(0, count);
  },
};
