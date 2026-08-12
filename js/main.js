// Mobile nav
document.querySelectorAll('.nav-toggle').forEach((toggle) => {
  const nav = toggle.closest('.nav');
  const links = nav?.querySelector('.nav-center');
  if (!links) return;

  toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
  });

  links.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      links.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  });
});

// Highlight active nav link
const current = window.location.pathname.split('/').pop() || 'index.html';
const hash = window.location.hash;
document.querySelectorAll('.nav-center a').forEach((link) => {
  const href = link.getAttribute('href') || '';
  const [hrefPath, hrefHash] = href.split('#');
  const hrefFile = hrefPath.split('/').pop() || 'index.html';

  if (hash && hrefHash && hash === `#${hrefHash}` && (hrefFile === current || (current === '' && hrefFile === 'index.html'))) {
    link.classList.add('active');
  } else if (!hash && hrefFile === current && !href.includes('#')) {
    link.classList.add('active');
  }
});

// Form submissions
document.querySelectorAll('form[data-demo-form]').forEach((form) => {
  const note = form.querySelector('.form-note');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (note) {
      note.hidden = false;
      note.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    form.reset();
  });
});
