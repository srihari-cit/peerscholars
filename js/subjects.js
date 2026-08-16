/** Standardized subject options for signup and matching */
window.PSSubjects = {
  LIST: [
    { id: 'math', label: 'Math' },
    { id: 'english', label: 'English' },
    { id: 'reading', label: 'Reading' },
    { id: 'writing', label: 'Writing' },
    { id: 'science', label: 'Science' },
    { id: 'social_studies', label: 'Social Studies' },
    { id: 'history', label: 'History' },
    { id: 'geography', label: 'Geography' },
    { id: 'computer_science', label: 'Coding / CS' },
    { id: 'homework_help', label: 'Homework Help' },
    { id: 'study_skills', label: 'Study Skills' },
    { id: 'test_prep', label: 'Test Prep' },
    { id: 'other', label: 'Other' },
  ],

  labelFor(id) {
    const item = this.LIST.find((s) => s.id === id);
    return item ? item.label : String(id || '').replace(/_/g, ' ');
  },

  collectFromForm(form, checkboxName, otherInputId) {
    const ids = [...form.querySelectorAll(`input[name="${checkboxName}"]:checked`)]
      .map((c) => c.value)
      .filter((v) => v !== 'other');
    const other = document.getElementById(otherInputId)?.value?.trim();
    const labels = ids.map((id) => this.labelFor(id));
    if (other) labels.push(other);
    return { ids, labels, text: labels.join(', ') };
  },

  renderCheckboxGrid(name, prefix) {
    return `<div class="subject-checkbox-grid">${this.LIST.filter((s) => s.id !== 'other')
      .map(
        (s) =>
          `<label class="subject-checkbox"><input type="checkbox" name="${name}" value="${s.id}"> ${s.label}</label>`
      )
      .join('')}
    <label class="subject-checkbox subject-other"><input type="checkbox" name="${name}" value="other" id="${prefix}-subject-other-cb"> Other</label>
    </div>
    <input type="text" id="${prefix}-subject-other" class="subject-other-input" placeholder="Please specify" hidden>`;
  },
};
