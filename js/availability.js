/** Availability parsing, overlap detection, and signup pickers */
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
  DAY_KEYS: {
    Mon: 'monday',
    Tue: 'tuesday',
    Wed: 'wednesday',
    Thu: 'thursday',
    Fri: 'friday',
    Sat: 'saturday',
    Sun: 'sunday',
  },
  TIME_MIN: 7 * 60,
  TIME_MAX: 21 * 60,
  TIME_STEP: 30,
  DEFAULT_START: '13:00',
  DEFAULT_END: '15:00',

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

  eachTimeSlot(callback) {
    for (let mins = this.TIME_MIN; mins <= this.TIME_MAX; mins += this.TIME_STEP) {
      callback(mins, this.minutesToTime(mins), this.formatMinutes(mins));
    }
  },

  buildStartOptions(selected = this.DEFAULT_START) {
    let html = '';
    this.eachTimeSlot((mins, value, label) => {
      if (mins >= this.TIME_MAX) return;
      html += `<option value="${value}"${value === selected ? ' selected' : ''}>${label}</option>`;
    });
    return html;
  },

  buildEndOptions(startValue, selected = this.DEFAULT_END) {
    const startMin = this.toMinutes(startValue || this.DEFAULT_START);
    let html = '';
    let hasSelected = false;
    this.eachTimeSlot((mins, value, label) => {
      if (mins <= startMin) return;
      const isSelected = value === selected;
      if (isSelected) hasSelected = true;
      html += `<option value="${value}"${isSelected ? ' selected' : ''}>${label}</option>`;
    });
    if (!html) {
      const fallback = this.minutesToTime(Math.min(startMin + this.TIME_STEP, this.TIME_MAX));
      html = `<option value="${fallback}" selected>${this.formatMinutes(this.toMinutes(fallback))}</option>`;
    } else if (!hasSelected) {
      html = html.replace('<option ', '<option selected ', 1);
    }
    return html;
  },

  parseSlots(source) {
    if (source?.availabilityMap && typeof source.availabilityMap === 'object') {
      return this.mapToSlots(source.availabilityMap);
    }
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
      if (!text.includes(day) && !text.includes(this.DAY_LABELS[day])) return;
      slots.push({ day, start: 16 * 60, end: 19 * 60 });
    });
    return slots.filter((s) => s.end > s.start);
  },

  slotsToMap(slots) {
    const map = {};
    (slots || []).forEach(({ day, startTime, endTime, start, end }) => {
      const key = this.DAY_KEYS[day] || String(day || '').toLowerCase();
      if (!key) return;
      if (!map[key]) map[key] = [];
      map[key].push({
        start: startTime || this.minutesToTime(start),
        end: endTime || this.minutesToTime(end),
      });
    });
    return map;
  },

  mapToSlots(map) {
    const slots = [];
    Object.entries(map || {}).forEach(([key, ranges]) => {
      const day =
        Object.entries(this.DAY_KEYS).find(([, v]) => v === key)?.[0] ||
        key.slice(0, 3).replace(/^./, (c) => c.toUpperCase());
      (ranges || []).forEach((range) => {
        const startTime = range.start || range.startTime;
        const endTime = range.end || range.endTime;
        if (!startTime || !endTime) return;
        if (this.toMinutes(endTime) > this.toMinutes(startTime)) {
          slots.push({ day, startTime, endTime });
        }
      });
    });
    return slots;
  },

  minutesToTime(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
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

  getSlotValues(row) {
    const startEl = row.querySelector('[data-slot-start]');
    const endEl = row.querySelector('[data-slot-end]');
    return {
      startTime: startEl?.value?.trim() || '',
      endTime: endEl?.value?.trim() || '',
    };
  },

  syncEndSelect(row) {
    const startEl = row.querySelector('[data-slot-start]');
    const endEl = row.querySelector('[data-slot-end]');
    if (!startEl || !endEl) return;
    const prevEnd = endEl.value;
    endEl.innerHTML = this.buildEndOptions(startEl.value, prevEnd);
  },

  setSlotDefaults(row, start = this.DEFAULT_START, end = this.DEFAULT_END) {
    const startEl = row.querySelector('[data-slot-start]');
    const endEl = row.querySelector('[data-slot-end]');
    if (startEl) startEl.innerHTML = this.buildStartOptions(start);
    if (endEl) endEl.innerHTML = this.buildEndOptions(start, end);
    row.classList.remove('avail-invalid');
  },

  slotRowHtml(day, startVal = this.DEFAULT_START, endVal = this.DEFAULT_END) {
    const dayLabel = this.DAY_LABELS[day] || day;
    return `<div class="availability-slot-row">
      <select data-slot-start aria-label="Start time for ${dayLabel}">${this.buildStartOptions(startVal)}</select>
      <span class="availability-sep" aria-hidden="true">–</span>
      <select data-slot-end aria-label="End time for ${dayLabel}">${this.buildEndOptions(startVal, endVal)}</select>
      <button type="button" class="avail-remove" hidden aria-label="Remove time range">×</button>
    </div>`;
  },

  addSlotRow(panel) {
    const dayRow = panel.closest('.availability-day-row');
    const day = dayRow?.querySelector('[data-avail-day]')?.value || 'Mon';
    const addBtn = panel.querySelector('.avail-add-slot');
    const wrapper = document.createElement('div');
    wrapper.innerHTML = this.slotRowHtml(day);
    const row = wrapper.firstElementChild;
    panel.insertBefore(row, addBtn);
    this.syncRemoveButtons(panel);
  },

  syncRemoveButtons(panel) {
    const rows = panel.querySelectorAll('.availability-slot-row');
    rows.forEach((row) => {
      const btn = row.querySelector('.avail-remove');
      if (btn) btn.hidden = rows.length <= 1;
    });
  },

  collectFromForm(form, dayCheckboxName) {
    const slots = [];
    form.querySelectorAll(`input[name="${dayCheckboxName}"]:checked`).forEach((cb) => {
      const panel = cb.closest('.availability-day-row')?.querySelector('.availability-slots-panel');
      panel?.querySelectorAll('.availability-slot-row').forEach((row) => {
        const { startTime, endTime } = this.getSlotValues(row);
        if (!startTime || !endTime) return;
        if (this.toMinutes(endTime) > this.toMinutes(startTime)) {
          slots.push({ day: cb.value, startTime, endTime });
        }
      });
    });
    return slots;
  },

  validateForm(form, dayCheckboxName) {
    let invalid = false;
    form.querySelectorAll(`input[name="${dayCheckboxName}"]:checked`).forEach((cb) => {
      const panel = cb.closest('.availability-day-row')?.querySelector('.availability-slots-panel');
      panel?.querySelectorAll('.availability-slot-row').forEach((row) => {
        const { startTime, endTime } = this.getSlotValues(row);
        const bad =
          startTime &&
          endTime &&
          this.toMinutes(endTime) <= this.toMinutes(startTime);
        row.classList.toggle('avail-invalid', bad);
        if (bad) invalid = true;
      });
    });
    if (invalid) return 'End time must be later than start time for each availability range.';
    const slots = this.collectFromForm(form, dayCheckboxName);
    if (!slots.length) return 'Please select at least one day with a valid time range.';
    return null;
  },

  resetPickers(form) {
    form.querySelectorAll('.availability-day-row').forEach((row) => {
      const cb = row.querySelector('[data-avail-day]');
      const panel = row.querySelector('.availability-slots-panel');
      if (cb) cb.checked = false;
      if (!panel) return;
      panel.hidden = true;
      panel.querySelectorAll('.availability-slot-row').forEach((slotRow, index) => {
        if (index > 0) slotRow.remove();
      });
      const first = panel.querySelector('.availability-slot-row');
      if (first) this.setSlotDefaults(first);
    });
  },

  renderDayTimePicker(checkboxName, id) {
    return `<div class="availability-schedule" id="${id}">${this.DAYS.map(
      (day) => `<div class="availability-day-row">
        <label class="availability-day-toggle">
          <input type="checkbox" name="${checkboxName}" value="${day}" data-avail-day>
          <span class="avail-day-short">${day}</span>
          <span class="avail-day-full">${this.DAY_LABELS[day]}</span>
        </label>
        <div class="availability-slots-panel" hidden>
          ${this.slotRowHtml(day)}
          <button type="button" class="avail-add-slot">+ Add time</button>
        </div>
      </div>`
    ).join('')}</div>`;
  },

  initDayTimePickers(root = document) {
    root.querySelectorAll('.availability-schedule').forEach((schedule) => {
      schedule.addEventListener('click', (e) => {
        const addBtn = e.target.closest('.avail-add-slot');
        if (addBtn) {
          e.preventDefault();
          const panel = addBtn.closest('.availability-slots-panel');
          if (panel) this.addSlotRow(panel);
          return;
        }
        const removeBtn = e.target.closest('.avail-remove');
        if (removeBtn) {
          e.preventDefault();
          const row = removeBtn.closest('.availability-slot-row');
          const panel = row?.closest('.availability-slots-panel');
          row?.remove();
          if (panel) this.syncRemoveButtons(panel);
        }
      });

      schedule.addEventListener('change', (e) => {
        if (e.target.matches('[data-slot-start]')) {
          this.syncEndSelect(e.target.closest('.availability-slot-row'));
        }
      });

      schedule.querySelectorAll('[data-avail-day]').forEach((cb) => {
        const sync = () => {
          const row = cb.closest('.availability-day-row');
          const panel = row?.querySelector('.availability-slots-panel');
          if (!panel) return;
          panel.hidden = !cb.checked;
          if (cb.checked && !panel.querySelector('.availability-slot-row')) {
            panel.insertAdjacentHTML('afterbegin', this.slotRowHtml(cb.value));
            this.syncRemoveButtons(panel);
          }
        };
        cb.addEventListener('change', sync);
        sync();
      });
    });

    root.querySelectorAll('[data-avail-select-all]').forEach((selectAll) => {
      this.bindSelectAllDays(selectAll);
    });
  },

  bindSelectAllDays(selectAllCheckbox) {
    const scheduleId = selectAllCheckbox.dataset.availSelectAll;
    const schedule = document.getElementById(scheduleId);
    if (!schedule) return;

    const dayBoxes = [...schedule.querySelectorAll('[data-avail-day]')];
    const syncSelectAll = () => {
      selectAllCheckbox.checked = dayBoxes.length > 0 && dayBoxes.every((d) => d.checked);
    };

    selectAllCheckbox.addEventListener('change', () => {
      dayBoxes.forEach((cb) => {
        if (cb.checked !== selectAllCheckbox.checked) {
          cb.checked = selectAllCheckbox.checked;
          cb.dispatchEvent(new Event('change', { bubbles: true }));
        }
      });
    });

    dayBoxes.forEach((cb) => {
      cb.addEventListener('change', syncSelectAll);
    });
  },
};
