/* ============================================================
   animate-ui.js
   Drop-in progressive enhancement for Faiz Syauqi's portfolio.
   No external dependencies.
============================================================ */

'use strict';

/* ──────────────────────────────────────────────────────────────
   FEATURE 1 — Cursor-Tracking Spotlight Cards
   Tracks mouse position relative to each card and updates
   --mouse-x / --mouse-y CSS custom properties.
────────────────────────────────────────────────────────────── */
function initSpotlightCards() {
  const cards = document.querySelectorAll('.card, .skill-card, .project-card');

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.setProperty('--spotlight-opacity', '1');
    });

    card.addEventListener('mousemove', e => {
      const rect   = card.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      card.style.setProperty('--mouse-x', `${mouseX}px`);
      card.style.setProperty('--mouse-y', `${mouseY}px`);
    });

    card.addEventListener('mouseleave', () => {
      card.style.setProperty('--spotlight-opacity', '0');
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   FEATURE 2 — 3D Tilt Effect
   Applies a depth-aware rotateX/Y transform based on cursor
   position within the element. Smooth spring-like reset on leave.
────────────────────────────────────────────────────────────── */
function initTiltEffect() {
  const MAX_TILT    = 12;   // degrees, max rotation
  const SCALE_ON    = 1.03; // scale while hovering

  function applyTilt(el, e, maxTilt, perspective) {
    const rect   = el.getBoundingClientRect();
    const cx     = rect.left + rect.width  / 2;
    const cy     = rect.top  + rect.height / 2;
    const dx     = (e.clientX - cx) / (rect.width  / 2); // -1 to 1
    const dy     = (e.clientY - cy) / (rect.height / 2); // -1 to 1

    const rotY   =  dx * maxTilt;
    const rotX   = -dy * maxTilt;

    el.style.setProperty('--rot-x', `${rotX}deg`);
    el.style.setProperty('--rot-y', `${rotY}deg`);
  }

  function resetTilt(el) {
    el.style.setProperty('--rot-x', '0deg');
    el.style.setProperty('--rot-y', '0deg');
    // Temporarily enable a smooth spring-back
    el.style.transition = 'transform 0.6s cubic-bezier(0.23, 1, 0.32, 1), box-shadow 0.4s ease, border-color 0.4s ease';
    setTimeout(() => {
      el.style.transition = '';
    }, 600);
  }

  // Tilt on project cards
  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove',  e => applyTilt(card, e, MAX_TILT));
    card.addEventListener('mouseleave', () => resetTilt(card));
  });

  // Tilt on the hero avatar (gentler max angle)
  const avatar = document.querySelector('.hero__avatar');
  if (avatar) {
    avatar.addEventListener('mousemove',  e => applyTilt(avatar, e, 8));
    avatar.addEventListener('mouseleave', () => resetTilt(avatar));
  }
}

/* ──────────────────────────────────────────────────────────────
   FEATURE 3 — Magnetic Floating Dock
   Calculates distance from cursor to each nav link and
   translates the link toward the cursor proportionally.
────────────────────────────────────────────────────────────── */
function initMagneticDock() {
  const STRENGTH  = 0.35;  // 0 = no pull, 1 = full pull to cursor
  const REACH     = 90;    // px — max distance that triggers magnetism
  const navLinks  = document.querySelectorAll('.nav a');

  document.addEventListener('mousemove', e => {
    navLinks.forEach(link => {
      const rect = link.getBoundingClientRect();
      const cx   = rect.left + rect.width  / 2;
      const cy   = rect.top  + rect.height / 2;

      const dx   = e.clientX - cx;
      const dy   = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < REACH) {
        // Ease in: pull is stronger when closer
        const pull  = (1 - dist / REACH) * STRENGTH;
        const tx    = dx * pull;
        const ty    = dy * pull;
        link.style.setProperty('--tx', `${tx}px`);
        link.style.setProperty('--ty', `${ty}px`);
      } else {
        link.style.setProperty('--tx', '0px');
        link.style.setProperty('--ty', '0px');
      }
    });
  });

  // Reset all when mouse leaves the window
  document.addEventListener('mouseleave', () => {
    navLinks.forEach(link => {
      link.style.setProperty('--tx', '0px');
      link.style.setProperty('--ty', '0px');
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   FEATURE 5 — Scroll-Driven Timeline
   Only runs on biography.html. Reads the scroll position of
   the .timeline element and maps it to --scroll-progress (0→1).
────────────────────────────────────────────────────────────── */
function initScrollTimeline() {
  const timeline = document.querySelector('.timeline');
  if (!timeline) return; // Not on biography page

  function updateProgress() {
    const rect       = timeline.getBoundingClientRect();
    const viewH      = window.innerHeight;

    // How far through the timeline has the viewport scrolled?
    // 0 = top of timeline just entered viewport bottom
    // 1 = bottom of timeline has left viewport top
    const totalTravel = rect.height + viewH;
    const scrolled    = viewH - rect.top;
    const progress    = Math.max(0, Math.min(1, scrolled / totalTravel));

    timeline.style.setProperty('--scroll-progress', progress.toFixed(4));
  }

  // Use passive scroll for performance
  window.addEventListener('scroll', updateProgress, { passive: true });
  // Also update on resize (viewport height may change)
  window.addEventListener('resize', updateProgress, { passive: true });
  // Initial call
  updateProgress();
}

/* ──────────────────────────────────────────────────────────────
   FEATURE 4 — Native View Transitions
   Intercepts same-origin <a> clicks and wraps navigation
   in document.startViewTransition() when the API is available.
────────────────────────────────────────────────────────────── */
function initViewTransitions() {
  if (!document.startViewTransition) return; // API not supported

  document.addEventListener('click', e => {
    const anchor = e.target.closest('a');
    if (!anchor) return;

    const href = anchor.getAttribute('href');
    if (!href) return;

    // Only intercept same-origin, same-dir relative links (not # or external)
    const isRelative = !href.startsWith('http') && !href.startsWith('#') && !href.startsWith('mailto');
    if (!isRelative) return;

    // Don't intercept if modifier keys are held (open in new tab, etc.)
    if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;

    e.preventDefault();

    document.startViewTransition(() => {
      window.location.href = href;
    });
  });
}

/* ──────────────────────────────────────────────────────────────
   INIT — Run everything after DOM is ready
────────────────────────────────────────────────────────────── */
function init() {
  // Respect reduced-motion preference for interactive effects
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  initSpotlightCards();            // Feature 1 — all pages
  if (!reduceMotion) {
    initTiltEffect();              // Feature 2 — all pages
    initMagneticDock();            // Feature 3 — all pages
  }
  initViewTransitions();           // Feature 4 — all pages
  initScrollTimeline();            // Feature 5 — biography only
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
