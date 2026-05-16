/* ---- CUSTOM CURSOR ---- */
const cursor = document.getElementById('cursor');
const cursorRing = document.getElementById('cursorRing');
let mx = 0, my = 0, rx = 0, ry = 0;
document.addEventListener('mousemove', e => {
  mx = e.clientX; my = e.clientY;
  cursor.style.left = mx + 'px';
  cursor.style.top = my + 'px';
});
setInterval(() => {
  rx += (mx - rx) * 0.15;
  ry += (my - ry) * 0.15;
  cursorRing.style.left = rx + 'px';
  cursorRing.style.top = ry + 'px';
}, 16);
document.querySelectorAll('a,button,.flavour-card,.menu-tab,.review-card').forEach(el => {
  el.addEventListener('mouseenter', () => {
    cursor.style.width = '20px';
    cursor.style.height = '20px';
    cursorRing.style.width = '50px';
    cursorRing.style.height = '50px';
  });
  el.addEventListener('mouseleave', () => {
    cursor.style.width = '12px';
    cursor.style.height = '12px';
    cursorRing.style.width = '36px';
    cursorRing.style.height = '36px';
  });
});

/* ---- SMOKE CANVAS ---- */
const canvas = document.getElementById('smokeCanvas');
const ctx = canvas.getContext('2d');
let W, H;
function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
resize();
window.addEventListener('resize', resize);

class Particle {
  constructor() { this.reset(); }
  reset() {
    this.x = Math.random() * W;
    this.y = H + 20;
    this.vx = (Math.random() - 0.5) * 0.4;
    this.vy = -(Math.random() * 0.6 + 0.2);
    this.life = 0;
    this.maxLife = 200 + Math.random() * 300;
    this.r = 30 + Math.random() * 60;
  }
  update() {
    this.x += this.vx + Math.sin(this.life * 0.02) * 0.3;
    this.y += this.vy;
    this.life++;
    if (this.life > this.maxLife) this.reset();
  }
  draw() {
    const prog = this.life / this.maxLife;
    const alpha = Math.sin(prog * Math.PI) * 0.08;
    const grad = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.r * (1 + prog));
    grad.addColorStop(0, `rgba(201,168,76,${alpha})`);
    grad.addColorStop(1, 'rgba(201,168,76,0)');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r * (1 + prog), 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }
}
const particles = Array.from({ length: 30 }, () => new Particle());
function animSmoke() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => { p.update(); p.draw(); });
  requestAnimationFrame(animSmoke);
}
animSmoke();

/* ---- SCROLL REVEAL ---- */
const reveals = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      e.target.style.transitionDelay = (i * 0.08) + 's';
      e.target.classList.add('visible');
    }
  });
}, { threshold: 0.12 });
reveals.forEach(el => observer.observe(el));

/* ---- MENU TABS ---- */
function switchTab(name) {
  document.querySelectorAll('.menu-items').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.menu-tab').forEach(el => el.classList.remove('active'));
  document.getElementById('tab-' + name).classList.add('active');
  event.target.classList.add('active');
}

/* ---- RESERVATION MODAL ---- */
function openModal(e) {
  if (e) e.preventDefault();
  const modal = document.getElementById('reservationModal');
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('res-date').setAttribute('min', today);
}

function closeModal() {
  const modal = document.getElementById('reservationModal');
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function closeModalOutside(e) {
  if (e.target === document.getElementById('reservationModal')) {
    closeModal();
  }
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

const reservationForm = document.getElementById('reservationForm');
if (reservationForm) {
  reservationForm.addEventListener('submit', async function(e) {
    const formspreeAction = this.action;
    if (formspreeAction.includes('DEINE_FORMSPREE_ID')) {
      e.preventDefault();
      const successDiv = document.getElementById('formSuccess');
      successDiv.style.display = 'flex';
      successDiv.querySelector('p').textContent = 'Formspree-ID noch nicht eingetragen. Bitte ruf uns direkt an: +49 6142 7987373';
      reservationForm.style.display = 'none';
      return;
    }
    e.preventDefault();
    const data = new FormData(this);
    try {
      const response = await fetch(formspreeAction, {
        method: 'POST',
        body: data,
        headers: { 'Accept': 'application/json' }
      });
      if (response.ok) {
        document.getElementById('formSuccess').style.display = 'flex';
        reservationForm.reset();
        reservationForm.style.display = 'none';
      }
    } catch (err) {
      alert('Fehler. Bitte ruf uns an: +49 6142 7987373');
    }
  });
}

/* ---- CINEMATIC SLIDESHOW ---- */
(function() {
  const slides      = document.querySelectorAll('.slide');
  const dots        = document.querySelectorAll('.slide-dot');
  const thumbs      = document.querySelectorAll('.thumb');
  const progressBar = document.getElementById('slideProgressBar');
  const currentNum  = document.getElementById('slideCurrentNum');
  const totalNum    = document.getElementById('slideTotalNum');
  const btnNext     = document.getElementById('slideNext');
  const btnPrev     = document.getElementById('slidePrev');
  const btnPlay     = document.getElementById('slidePlayPause');
  const iconPause   = document.getElementById('iconPause');
  const iconPlay    = document.getElementById('iconPlay');

  if (!slides.length) return;

  let current   = 0;
  let isPlaying = true;
  const DURATION = 5000; // ms per slide
  let startTime  = null;
  let rafId      = null;
  let touchStartX = 0;

  if (totalNum) totalNum.textContent = slides.length;

  function activateSlide(index) {
    // Mark old slide as leaving for reverse Ken Burns
    slides[current].classList.add('leaving');
    setTimeout(() => slides[current].classList.remove('leaving'), 1200);

    slides[current].classList.remove('active');
    dots[current]?.classList.remove('active');
    thumbs[current]?.classList.remove('active');

    current = (index + slides.length) % slides.length;

    slides[current].classList.add('active');
    dots[current]?.classList.add('active');
    thumbs[current]?.classList.add('active');

    if (currentNum) currentNum.textContent = current + 1;

    // Reset progress
    startTime = performance.now();
  }

  function nextSlide() { activateSlide(current + 1); }
  function prevSlide() { activateSlide(current - 1); }

  window.goToSlide = function(index) {
    activateSlide(index);
    startTime = performance.now();
  };

  // Progress bar animation loop
  function tick(timestamp) {
    if (!isPlaying) { rafId = requestAnimationFrame(tick); return; }
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    const pct = Math.min((elapsed / DURATION) * 100, 100);
    if (progressBar) progressBar.style.width = pct + '%';
    if (elapsed >= DURATION) {
      nextSlide();
    }
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  // Buttons
  btnNext?.addEventListener('click', () => { activateSlide(current + 1); });
  btnPrev?.addEventListener('click', () => { activateSlide(current - 1); });

  // Play / Pause
  btnPlay?.addEventListener('click', () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      startTime = performance.now();
      iconPause.style.display = '';
      iconPlay.style.display  = 'none';
    } else {
      iconPause.style.display = 'none';
      iconPlay.style.display  = '';
    }
  });

  // Keyboard arrows
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') activateSlide(current + 1);
    if (e.key === 'ArrowLeft')  activateSlide(current - 1);
  });

  // Touch / swipe support
  const wrap = document.querySelector('.slideshow-wrap');
  wrap?.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  wrap?.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? nextSlide() : prevSlide();
  });

  // Pause on hover
  wrap?.addEventListener('mouseenter', () => { isPlaying = false; });
  wrap?.addEventListener('mouseleave', () => {
    isPlaying = true;
    startTime = performance.now();
    iconPause.style.display = '';
    iconPlay.style.display  = 'none';
  });

})();

/* ---- MOBILE HAMBURGER MENU ---- */
function toggleMenu() {
  const nav     = document.getElementById('navLinks');
  const burger  = document.getElementById('hamburger');
  nav.classList.toggle('open');
  burger.classList.toggle('open');
}

function closeMenu() {
  document.getElementById('navLinks')?.classList.remove('open');
  document.getElementById('hamburger')?.classList.remove('open');
}

// Close menu when clicking outside
document.addEventListener('click', function(e) {
  const nav    = document.getElementById('navLinks');
  const burger = document.getElementById('hamburger');
  if (nav?.classList.contains('open') &&
      !nav.contains(e.target) &&
      !burger.contains(e.target)) {
    closeMenu();
  }
});

/* ---- LEGAL MODAL ---- */
const legalTexts = {
  impressum: `
    <div class="modal-eyebrow">Pflichtangaben</div>
    <h2 class="modal-title">Impressum</h2>
    <div class="legal-text">
      <h4>Angaben gemäß § 5 TMG</h4>
      <p>Two Monkeys Shisha Bar<br>
      Marktstraße 38<br>
      65428 Rüsselsheim am Main<br>
      Deutschland</p>
      <h4>Kontakt</h4>
      <p>Telefon: +49 6142 7987373<br>
      E-Mail: twomonkeysbar@gmail.com</p>
      <h4>Verantwortlich für den Inhalt</h4>
      <p>[Name des Inhabers]<br>
      Marktstraße 38<br>
      65428 Rüsselsheim am Main</p>
      <h4>Haftungsausschluss</h4>
      <p>Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können wir jedoch keine Gewähr übernehmen.</p>
      <p style="color:rgba(201,168,76,0.6);font-size:0.85rem;margin-top:1.5rem;">⚠️ Platzhalter — bitte mit echten Angaben ersetzen.</p>
    </div>
  `,
  datenschutz: `
    <div class="modal-eyebrow">Rechtliches</div>
    <h2 class="modal-title">Datenschutz</h2>
    <div class="legal-text">
      <h4>1. Datenschutz auf einen Blick</h4>
      <p>Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie unsere Website besuchen.</p>
      <h4>2. Welche Daten erfassen wir?</h4>
      <p>Wir erfassen nur die Daten, die Sie uns aktiv mitteilen — zum Beispiel beim Ausfüllen des Reservierungsformulars.</p>
      <h4>3. Wofür nutzen wir Ihre Daten?</h4>
      <p>Ihre Daten werden ausschließlich zur Bearbeitung Ihrer Reservierungsanfrage verwendet und nicht an Dritte weitergegeben.</p>
      <h4>4. Cookies</h4>
      <p>Unsere Website verwendet keine Tracking-Cookies. Es werden nur technisch notwendige Cookies eingesetzt.</p>
      <h4>5. Ihre Rechte</h4>
      <p>Sie haben jederzeit das Recht auf Auskunft, Berichtigung und Löschung Ihrer gespeicherten Daten. Kontakt: twomonkeysbar@gmail.com</p>
      <p style="color:rgba(201,168,76,0.6);font-size:0.85rem;margin-top:1.5rem;">⚠️ Platzhalter — bitte mit echten Angaben ersetzen.</p>
    </div>
  `,
  agb: `
    <div class="modal-eyebrow">Rechtliches</div>
    <h2 class="modal-title">AGB</h2>
    <div class="legal-text">
      <h4>1. Geltungsbereich</h4>
      <p>Diese Allgemeinen Geschäftsbedingungen gelten für alle Leistungen der Two Monkeys Shisha Bar, Marktstraße 38, 65428 Rüsselsheim am Main.</p>
      <h4>2. Reservierungen</h4>
      <p>Reservierungen sind verbindlich. Bei Nichterscheinen ohne vorherige Absage behalten wir uns vor, den Tisch nach 15 Minuten anderweitig zu vergeben.</p>
      <h4>3. Hausordnung</h4>
      <p>Das Mitbringen eigener Speisen und Getränke ist nicht gestattet. Wir behalten uns das Hausrecht vor.</p>
      <h4>4. Mindestalter</h4>
      <p>Der Zutritt ist ab 18 Jahren gestattet. Ein gültiger Lichtbildausweis kann verlangt werden.</p>
      <h4>5. Haftung</h4>
      <p>Für Garderobe und mitgebrachte Gegenstände übernehmen wir keine Haftung.</p>
      <p style="color:rgba(201,168,76,0.6);font-size:0.85rem;margin-top:1.5rem;">⚠️ Platzhalter — bitte mit echten Angaben ersetzen.</p>
    </div>
  `,
  cookies: `
    <div class="modal-eyebrow">Rechtliches</div>
    <h2 class="modal-title">Cookie-Richtlinie</h2>
    <div class="legal-text">
      <h4>Was sind Cookies?</h4>
      <p>Cookies sind kleine Textdateien, die auf Ihrem Gerät gespeichert werden, wenn Sie eine Website besuchen.</p>
      <h4>Welche Cookies verwenden wir?</h4>
      <p>Wir verwenden ausschließlich technisch notwendige Cookies. Es werden keine Tracking- oder Marketing-Cookies eingesetzt.</p>
      <h4>Wie können Sie Cookies kontrollieren?</h4>
      <p>Sie können Cookies in Ihrem Browser jederzeit deaktivieren oder löschen.</p>
      <h4>Kontakt</h4>
      <p>twomonkeysbar@gmail.com</p>
      <p style="color:rgba(201,168,76,0.6);font-size:0.85rem;margin-top:1.5rem;">⚠️ Platzhalter — bitte mit echten Angaben ersetzen.</p>
    </div>
  `
};

function openLegal(type) {
  document.getElementById('legalContent').innerHTML = legalTexts[type];
  document.getElementById('legalModal').classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLegal() {
  document.getElementById('legalModal').classList.remove('active');
  document.body.style.overflow = '';
}

function closeLegalOutside(e) {
  if (e.target === document.getElementById('legalModal')) closeLegal();
}