/** Availability parsing and overlap detection */
window.PSAvailability = {
  DAYS: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
  DAY_LABELS: {
    Mon: 'Monday',
    Tue: 'Tuesday',
    Wed: 'Wednesday',
    Thu: 'Thursday',
    Fri: 'Friday',
    Sat: 'Saturday',
    Sun: 'Sunday',
  },

  toMinutes(timeStr) {
    if (!timeStr) return 0;
    const [h, m] = String(timeStr).split(':').map(Number);
    return h * 60 + (m || 0);
  },

  formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    const d = new Date();
    d.setHours(h, m, 0);
    return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  },

  parseSlots(source) {
    if (Array.isArray(source?.availabilitySlots) && source.availabilitySlots.length) {
      return source.availabilitySlots.map((s) => ({
        day: s.day,
        start: this.toMinutes(s.startTime || s.start),
        end: this.toMinutes(s.endTime || s.end),
      }));
    }
    const text = String(source?.availability || '');
    const slots = [];
    this.DAYS.forEach((day) => {
      if (!text.includes(day)) return;
      slots.push({ day, start: 16 * 60, end: 19 * 60 });
    });
    return slots.filter((s) => s.end > s.start);
  },

  overlap(studentSlots, tutorSlots) {
    const overlaps = [];
    studentSlots.forEach((s) => {
      tutorSlots.forEach((t) => {
        if (s.day !== t.day) return;
        const start = Math.max(s.start, t.start);
        const end = Math.min(s.end, t.end);
        if (end - start >= 60) overlaps.push({ day: s.day, start, end });
      });
    });
    return overlaps;
  },

  formatSlot(slot) {
    const day = this.DAY_LABELS[slot.day] || slot.day;
    return `${day} ${this.formatMinutes(slot.start)}–${this.formatMinutes(slot.end)}`;
  },

  formatSlotsList(slots, limit = 3) {
    return slots.slice(0, limit).map((s) => this.formatSlot(s)).join('<br>');
  },

  collectFromForm(form, dayCheckboxName, prefix) {
    const slots = [];
    form.querySelectorAll(`input[name="${dayCheckboxName}"]:checked`).forEach((cb) => {
      const day = cb.value;
      const startEl = form.querySelector(`[name="${prefix}-${day}-start"]`);
      const endEl = form.querySelector(`[name="${prefix}-${day}-end"]`);
      const startTime = startEl?.value || '16:00';
      const endTime = endEl?.value || '18:00';
      if (PSAvailability.toMinutes(endTime) > PSAvailability.toMinutes(startTime)) {
        slots.push({ day, startTime, endTime });
      }
    });
    return slots;
  },

  renderDayTimePicker(checkboxName, prefix, id) {
    return `<div class="availability-schedule" id="${id}">${this.DAYS.map(
      (day) => `<div class="availability-day-row">
        <label class="availability-day-label"><input type="checkbox" name="${checkboxName}" value="${day}" data-avail-day="${prefix}"> ${this.DAY_LABELS[day]}</label>
        <div class="availability-times" hidden>
          <input type="time" name="${prefix}-${day}-start" value="16:00">
          <span class="availability-sep">to</span>
          <input type="time" name="${prefix}-${day}-end" value="18:00">
        </div>
      </div>`
    ).join('')}</div>`;
  },

  initDayTimePickers(root = document) {
    root.querySelectorAll('[data-avail-day]').forEach((cb) => {
      const row = cb.closest('.availability-day-row');
      const times = row?.querySelector('.availability-times');
      const sync = () => {
        if (times) times.hidden = !cb.checked;
      };
      cb.addEventListener('change', sync);
      sync();
    });
  },
};
