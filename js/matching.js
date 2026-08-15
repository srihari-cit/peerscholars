/** Simple matching by subject, grade, availability, mode, city, interests */
window.PSMatching = {
  scoreTutor(request, tutor) {
    if (!tutor.verified || tutor.suspended) return -1;

    let score = 0;
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

    if (reqSubjects.some((s) => tutorSubjects.some((t) => t.includes(s) || s.includes(t)))) {
      score += 40;
    }

    const reqGrade = String(request.grade || '').toLowerCase();
    const grades = (tutor.gradesCanTeach || []).map((g) => g.toLowerCase());
    if (grades.includes(reqGrade) || grades.some((g) => reqGrade.includes(g))) {
      score += 30;
    }

    const reqMode = String(request.mode || '').toLowerCase();
    const tutorMode = String(tutor.mode || '').toLowerCase();
    if (reqMode === tutorMode || tutorMode === 'both') score += 15;

    if (
      request.city &&
      tutor.city &&
      request.city.toLowerCase() === tutor.city.toLowerCase()
    ) {
      score += 10;
    }

    const reqInterests = String(request.interests || '')
      .toLowerCase()
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const tutorInterests = String(tutor.interests || '')
      .toLowerCase()
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const shared = reqInterests.filter((i) =>
      tutorInterests.some((t) => t.includes(i) || i.includes(t))
    );
    score += Math.min(shared.length * 3, 15);

    return score;
  },

  findMatches(request, tutors, limit = 5) {
    return tutors
      .map((tutor) => ({ tutor, score: this.scoreTutor(request, tutor) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  },
};
