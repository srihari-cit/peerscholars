/** Standardized interests and normalization for matching */
window.PSInterests = {
  TAGS: [
    { id: 'soccer', label: '⚽ Soccer' },
    { id: 'basketball', label: '🏀 Basketball' },
    { id: 'robotics', label: '🤖 Robotics' },
    { id: 'coding', label: '💻 Coding' },
    { id: 'art', label: '🎨 Art' },
    { id: 'music', label: '🎹 Music' },
    { id: 'reading', label: '📚 Reading' },
    { id: 'chess', label: '♟ Chess' },
    { id: 'lego', label: '🧱 LEGO' },
    { id: 'science', label: '🔬 Science' },
    { id: 'space', label: '🚀 Space' },
    { id: 'gaming', label: '🎮 Gaming' },
    { id: 'writing', label: '✍️ Writing' },
    { id: 'dance', label: '💃 Dance' },
    { id: 'cooking', label: '🍳 Cooking' },
    { id: 'animals', label: '🐾 Animals' },
    { id: 'technology', label: '📱 Technology' },
    { id: 'movies', label: '🎬 Movies' },
  ],

  ALIASES: {
    soccer: ['soccer', 'football', 'football/soccer', 'futbol'],
    basketball: ['basketball', 'hoops'],
    robotics: ['robotics', 'robots', 'robot'],
    coding: ['coding', 'programming', 'code', 'computer science', 'cs'],
    art: ['art', 'drawing', 'painting', 'sketch'],
    music: ['music', 'piano', 'guitar', 'singing'],
    reading: ['reading', 'books', 'literature'],
    chess: ['chess'],
    lego: ['lego', 'legos', 'building'],
    science: ['science', 'biology', 'chemistry', 'physics'],
    space: ['space', 'astronomy', 'planets', 'nasa'],
    gaming: ['gaming', 'video games', 'videogames', 'minecraft', 'roblox', 'games'],
    writing: ['writing', 'creative writing'],
    dance: ['dance', 'dancing'],
    cooking: ['cooking', 'baking', 'food'],
    animals: ['animals', 'pets', 'dogs', 'cats'],
    technology: ['technology', 'tech', 'computers'],
    movies: ['movies', 'film', 'films'],
  },

  normalizeToken(str) {
    return String(str || '')
      .toLowerCase()
      .trim()
      .replace(/[^\w\s/+]/g, ' ')
      .replace(/\s+/g, ' ');
  },

  resolveInterestId(token) {
    const norm = this.normalizeToken(token);
    if (!norm) return null;
    for (const [id, aliases] of Object.entries(this.ALIASES)) {
      if (aliases.some((a) => norm === a || norm.includes(a) || a.includes(norm))) return id;
    }
    if (this.TAGS.some((t) => t.id === norm.replace(/\s/g, ''))) return norm.replace(/\s/g, '');
    return null;
  },

  parseInterests(source) {
    const tags = Array.isArray(source?.interestTags) ? source.interestTags : [];
    const fromText = String(source?.interests || '')
      .split(/[,;/]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const raw = [...tags, ...fromText];
    const ids = new Set();
    raw.forEach((item) => {
      const id = this.resolveInterestId(item) || this.resolveInterestId(item.replace(/^[^\w]+/, ''));
      if (id) ids.add(id);
      else if (item.length > 1) ids.add(this.normalizeToken(item).replace(/\s+/g, '_'));
    });
    return [...ids];
  },

  labelFor(id) {
    const tag = this.TAGS.find((t) => t.id === id);
    return tag ? tag.label.replace(/^[^\w]+\s*/, '') : id.replace(/_/g, ' ');
  },

  shared(studentSource, tutorSource) {
    const a = new Set(this.parseInterests(studentSource));
    const b = new Set(this.parseInterests(tutorSource));
    return [...a].filter((id) => b.has(id));
  },

  renderCheckboxGrid(name, prefix = 'interest') {
    return `<div class="interest-tag-grid">${this.TAGS.map(
      (t) =>
        `<label class="interest-tag"><input type="checkbox" name="${name}" value="${t.id}"> ${t.label}</label>`
    ).join('')}
    <label class="interest-tag interest-other"><input type="checkbox" name="${name}" value="other" id="${prefix}-interest-other-cb"> Other</label>
    </div>
    <input type="text" name="${name}-other" id="${prefix}-interest-other" class="interest-other-input" placeholder="Other interests (optional)" hidden>`;
  },
};
