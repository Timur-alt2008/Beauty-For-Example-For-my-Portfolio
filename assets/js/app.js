// Entry point: shell, routes, page transitions and scroll effects.

import { $, $$, prefersReducedMotion } from './lib/dom.js';
import { startRouter } from './router.js';
import { mountShell, markNav } from './components/shell.js';
import { closeModal, observeReveal, toast } from './components/ui.js';
import { renderHome } from './pages/home.js';
import { renderServices } from './pages/services.js';
import { renderTeam } from './pages/team.js';
import { renderBook } from './pages/book.js';
import { renderGiftCards } from './pages/giftcards.js';
import { renderVisits, renderCredits, renderNotFound } from './pages/misc.js';

const TITLES = {
  '/': 'Beauty Example — Hair, skin, nails & body salon',
  '/services': 'Services & prices — Beauty Example',
  '/team': 'Specialists — Beauty Example',
  '/book': 'Book a visit — Beauty Example',
  '/gift-cards': 'Gift cards — Beauty Example',
  '/visits': 'My visits — Beauty Example',
  '/credits': 'Photo credits — Beauty Example',
};

const routes = [
  { path: '/', render: renderHome },
  { path: '/services', render: renderServices },
  { path: '/team', render: renderTeam },
  { path: '/book', render: renderBook },
  { path: '/gift-cards', render: renderGiftCards },
  { path: '/visits', render: renderVisits },
  { path: '/credits', render: renderCredits },
  { path: '*', render: renderNotFound },
];

/** A fresh <main> for every page, so no event listeners leak between pages. */
function freshMain() {
  const old = $('#main');
  const main = old.cloneNode(false);
  old.replaceWith(main);
  return main;
}

/* ---------------- Parallax (transform only, rAF-throttled) ---------------- */

let ticking = false;
function parallax() {
  ticking = false;
  const vh = innerHeight;
  $$('[data-parallax]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.bottom < -100 || r.top > vh + 100) return;
    const speed = parseFloat(el.dataset.parallax) || 0;
    const offset = (r.top + r.height / 2 - vh / 2) * speed;
    el.style.setProperty('--py', `${offset.toFixed(1)}px`);
  });
}
function onScroll() {
  if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
}

// Each page starts at the top (reveal animations rely on it), even after a reload.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

mountShell();

startRouter(routes, {
  before({ samePage }) {
    closeModal();
    document.documentElement.classList.remove('is-menu-open');
    const main = freshMain();
    if (!samePage) {
      main.classList.add('is-entering');
      scrollTo(0, 0);
    }
  },
  after({ route }) {
    const path = location.hash.replace(/^#/, '').split('?')[0] || '/';
    document.title = TITLES[route.path] || 'Page not found — Beauty Example';
    markNav(path);
    const main = $('#main');
    requestAnimationFrame(() => main.classList.remove('is-entering'));
    observeReveal(main);
    parallax();
  },
  error(err) {
    console.error(err);
    toast('Something went wrong. Please try again.', { tone: 'error' });
  },
});

if (!prefersReducedMotion()) {
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', onScroll, { passive: true });
}
