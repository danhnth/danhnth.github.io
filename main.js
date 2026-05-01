// main.js — Portfolio animations & interactions
// Based on SimpleFolio pattern (ScrollReveal + VanillaTilt)

document.addEventListener('DOMContentLoaded', () => {
  // ── ScrollReveal ──────────────────────────────────────────
  if (typeof ScrollReveal !== 'undefined') {
    const sr = ScrollReveal({
      origin: 'bottom',
      distance: '30px',
      duration: 700,
      delay: 200,
      easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      reset: false,
    });

    // Hero elements
    sr.reveal('.hero-pre',   { origin: 'left', delay: 100 });
    sr.reveal('.hero-title', { origin: 'left', delay: 250 });
    sr.reveal('.hero-cta',   { origin: 'left', delay: 450 });

    // About section
    sr.reveal('#about .section-title',      { delay: 100 });
    sr.reveal('.about-wrapper__image',      { origin: 'left',  delay: 200 });
    sr.reveal('.about-wrapper__info',       { origin: 'right', delay: 300 });

    // Projects
    sr.reveal('#projects .section-title',  { delay: 100 });
    sr.reveal('.project-wrapper__text',    { origin: 'left',  delay: 200, interval: 150 });
    sr.reveal('.project-wrapper__image',   { origin: 'right', delay: 300, interval: 150 });

    // Certifications
    sr.reveal('#certifications .section-title', { delay: 100 });
    sr.reveal('.cert-card',                     { delay: 200, interval: 120 });

    // Contact
    sr.reveal('#contact .section-title',   { delay: 100 });
    sr.reveal('.contact-wrapper',          { delay: 250 });

    // Footer socials
    sr.reveal('.social-links a', { delay: 100, interval: 80, origin: 'bottom' });
  }

  // ── VanillaTilt ───────────────────────────────────────────
  if (typeof VanillaTilt !== 'undefined') {
    VanillaTilt.init(document.querySelectorAll('.js-tilt'), {
      max: 4,
      glare: true,
      'max-glare': 0.4,
      speed: 400,
    });
  }

  // ── Typed terminal effect in hero-pre ─────────────────────
  const heroPre = document.querySelector('.hero-pre');
  if (heroPre) {
    const commands = ['> whoami', '> ls -la skills/', '> cat about.md', '> whoami'];
    let cmdIndex = 0;
    let charIndex = 0;
    let typing = true;

    function typeLoop() {
      const current = commands[cmdIndex];
      if (typing) {
        if (charIndex <= current.length) {
          heroPre.textContent = current.slice(0, charIndex);
          charIndex++;
          setTimeout(typeLoop, 90);
        } else {
          typing = false;
          // Pause at end
          if (cmdIndex < commands.length - 1) {
            setTimeout(typeLoop, 1400);
          }
          // Last command: just stays
        }
      } else {
        if (charIndex > 0) {
          heroPre.textContent = current.slice(0, charIndex - 1);
          charIndex--;
          setTimeout(typeLoop, 45);
        } else {
          typing = true;
          cmdIndex = (cmdIndex + 1) % (commands.length - 1);
          setTimeout(typeLoop, 200);
        }
      }
    }

    // Start after a short delay
    setTimeout(typeLoop, 800);
  }

  // ── Smooth active nav highlight (if nav added later) ──────
  const sections = document.querySelectorAll('section[id]');
  const observerOptions = { rootMargin: '-40% 0px -40% 0px' };
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const active = document.querySelector(`.nav-link[href="#${entry.target.id}"]`);
        if (active) active.classList.add('active');
      }
    });
  }, observerOptions);
  sections.forEach(s => observer.observe(s));
});
