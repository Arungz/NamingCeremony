// Main JS for Naming Ceremony (updated - no inputs, single preset name)
// - Robust, simplified: uses a single preset name and auto localization
// - No UI inputs; name is set via DEFAULT_NAME or window.__ceremonyName

/* Utilities */
const qs = (sel, root = document) => root ? root.querySelector(sel) : null;
const qsa = (sel, root = document) => root ? Array.from(root.querySelectorAll(sel)) : [];

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Localization data */
const i18n = {
  en: { timerTitle: 'The Journey Unfolds In', days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds', clickHint: 'Click to Enter', revealSubtitle: 'Welcome To The World' },
  es: { timerTitle: 'El viaje comienza en', days: 'Días', hours: 'Horas', minutes: 'Minutos', seconds: 'Segundos', clickHint: 'Toca para entrar', revealSubtitle: 'Bienvenido al mundo' },
  fr: { timerTitle: 'Le voyage commence dans', days: 'Jours', hours: 'Heures', minutes: 'Minutes', seconds: 'Secondes', clickHint: 'Cliquez pour entrer', revealSubtitle: 'Bienvenue au monde' }
};

function detectLang() {
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'en';
  const code = String(nav).split('-')[0];
  return i18n[code] ? code : 'en';
}

/* Element references (may be null if removed) */
const elements = {
  letterN: qs('#letter-N'),
  sealWrapper: qs('#seal-wrapper'),
  gateLeft: qs('#gate-left'),
  gateRight: qs('#gate-right'),
  introContainer: qs('#intro-container'),
  timerScreen: qs('#timer-screen'),
  countdownScreen: qs('#countdown-screen'),
  revealScreen: qs('#reveal-screen'),
  babyNameContainer: qs('#baby-name'),
  clickHint: qs('#click-hint'),
  timerTitle: qs('#timer-title'),
  labelDays: qs('#label-days'),
  labelHours: qs('#label-hours'),
  labelMins: qs('#label-mins'),
  labelSecs: qs('#label-secs')
};

/* Apply language texts */
function applyLang(code) {
  const lang = i18n[code] || i18n.en;
  if (elements.timerTitle) elements.timerTitle.textContent = lang.timerTitle;
  if (elements.labelDays) elements.labelDays.textContent = lang.days;
  if (elements.labelHours) elements.labelHours.textContent = lang.hours;
  if (elements.labelMins) elements.labelMins.textContent = lang.minutes;
  if (elements.labelSecs) elements.labelSecs.textContent = lang.seconds;
  if (elements.clickHint) elements.clickHint.textContent = lang.clickHint;
  const subtitle = qs('#reveal-subtitle');
  if (subtitle) subtitle.textContent = lang.revealSubtitle;
}

/* Name rendering */
function sanitizeName(raw) {
  if (!raw) return '';
  return String(raw).trim().replace(/\s+/g, ' ');
}

function renderName(nameStr) {
  const container = elements.babyNameContainer;
  if (!container) return;
  container.innerHTML = '';
  const final = (nameStr && nameStr.length > 0) ? nameStr : 'ARYAN';
  // Simple grapheme-safe split for most names (note: complex emoji may need a grapheme splitter lib)
  for (const ch of Array.from(final)) {
    const span = document.createElement('div');
    span.className = 'letter gold-shimmer';
    span.textContent = ch;
    span.setAttribute('aria-hidden', 'true');
    container.appendChild(span);
  }
}

/* Timers */
let countdownInterval = null;
let finalTimer = null;
let eventDate = window.__ceremonyEventDate || (function(){ const d = new Date(); d.setSeconds(d.getSeconds() + 10); return d; })();

function safeSetText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function startTimer() {
  if (countdownInterval) clearInterval(countdownInterval);
  function updateOnce() {
    const now = Date.now();
    const dist = eventDate.getTime() - now;
    if (dist <= 0) {
      clearInterval(countdownInterval);
      if (elements.timerScreen) elements.timerScreen.style.opacity = '0';
      setTimeout(() => {
        if (elements.timerScreen) elements.timerScreen.style.display = 'none';
        startFinalCountdown();
      }, 600);
      return;
    }
    const days = Math.floor(dist / (1000 * 60 * 60 * 24));
    const hours = Math.floor((dist % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((dist % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((dist % (1000 * 60)) / 1000);
    safeSetText('days', days < 10 ? '0' + days : String(days));
    safeSetText('hours', hours < 10 ? '0' + hours : String(hours));
    safeSetText('mins', minutes < 10 ? '0' + minutes : String(minutes));
    safeSetText('secs', seconds < 10 ? '0' + seconds : String(seconds));
  }
  updateOnce();
  countdownInterval = setInterval(updateOnce, 1000);
}

function startFinalCountdown() {
  if (elements.countdownScreen) elements.countdownScreen.style.display = 'block';
  if (elements.countdownScreen) elements.countdownScreen.textContent = '5';
  let count = 5;
  finalTimer = setInterval(() => {
    count--;
    if (elements.countdownScreen) elements.countdownScreen.textContent = String(Math.max(0, count));
    if (count < 0) {
      clearInterval(finalTimer);
      if (elements.countdownScreen) elements.countdownScreen.style.display = 'none';
      triggerGrandReveal();
    }
  }, 1000);
}

/* Entrance & reveal */
function triggerEntrance() {
  if (!elements.letterN) return;
  if (elements.letterN.getAttribute('data-activated') === 'true') return;
  elements.letterN.setAttribute('data-activated', 'true');
  elements.letterN.setAttribute('aria-pressed', 'true');
  if (!reducedMotion && elements.sealWrapper) {
    elements.sealWrapper.style.transform = 'scale(4)';
    elements.sealWrapper.style.opacity = '0';
    elements.sealWrapper.style.filter = 'blur(8px)';
  } else if (elements.sealWrapper) {
    elements.sealWrapper.style.opacity = '0';
  }
  setTimeout(() => { elements.gateLeft?.classList.add('open-left'); elements.gateRight?.classList.add('open-right'); }, 300);
  setTimeout(() => {
    elements.introContainer && (elements.introContainer.style.display = 'none');
    elements.timerScreen && (elements.timerScreen.style.display = 'block');
    setTimeout(() => elements.timerScreen && (elements.timerScreen.style.opacity = '1'), 40);
    startTimer();
  }, 900);
}

function triggerGrandReveal() {
  elements.revealScreen && (elements.revealScreen.style.display = 'block');
  elements.revealScreen && elements.revealScreen.setAttribute('aria-hidden', 'false');
  elements.babyNameContainer && elements.babyNameContainer.setAttribute('aria-hidden', 'false');
  const letters = qsa('.letter', elements.babyNameContainer);
  letters.forEach((letter, idx) => {
    setTimeout(() => { letter.classList.add('show'); letter.setAttribute('aria-hidden', 'false'); }, idx * (reducedMotion ? 60 : 320));
  });
  const delay = (letters.length * (reducedMotion ? 60 : 320)) + 120;
  setTimeout(() => { fireMajesticShowers(); }, delay);
}

/* Confetti */
function fireMajesticShowers() {
  if (reducedMotion) return;
  if (typeof confetti !== 'function') return;
  const duration = 12 * 1000;
  const animationEnd = Date.now() + duration;
  const defaults = { startVelocity: 55, spread: 360, ticks: 120, zIndex: 100 };
  function randomInRange(min, max) { return Math.random() * (max - min) + min; }
  const interval = setInterval(function () {
    const timeLeft = animationEnd - Date.now();
    if (timeLeft <= 0) return clearInterval(interval);
    const particleCount = Math.floor(80 * (timeLeft / duration));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.0, 0.2), y: Math.random() - 0.2 }, colors: ['#bf953f', '#fcf6ba', '#ffffff'], disableForReducedMotion: true }));
    confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.8, 1.0), y: Math.random() - 0.2 }, colors: ['#bf953f', '#fcf6ba', '#ffffff'], disableForReducedMotion: true }));
  }, 200);
}

/* Wire events and initialize */
(function init() {
  // Localization
  const lang = detectLang();
  applyLang(lang);
  // Preset name (no inputs) - override with window.__ceremonyName if provided
  const DEFAULT_NAME = (typeof window.__ceremonyName === 'string' && window.__ceremonyName.trim().length > 0) ? sanitizeName(window.__ceremonyName) : 'ARYAN';
  renderName(DEFAULT_NAME);

  // Wire activation
  elements.letterN?.addEventListener('click', triggerEntrance, { passive: true });
  elements.letterN?.addEventListener('keydown', (ev) => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); triggerEntrance(); } }, { passive: false });

  // Service worker registration (deferred to load event)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => console.warn('SW registration failed:', err));
    });
  }

  // Expose for debugging
  window.__ceremony = { triggerEntrance, triggerGrandReveal, startTimer, startFinalCountdown };
})();
