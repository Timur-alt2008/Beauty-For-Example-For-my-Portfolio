// Header, full-screen menu, footer and the mobile "Book" bar.

import { $, $$, esc, on } from '../lib/dom.js';
import { SALON, DAY_NAMES } from '../data/site.js';
import { CATEGORIES } from '../data/services.js';
import { photo, img } from '../data/images.js';
import { icon, trapFocus, toast, setBusy } from './ui.js';
import { openStatus, subscribe, bookings, isPast } from '../services/api.js';
import { hm } from '../lib/format.js';
import { navigate } from '../router.js';

const MENU = [
  { href: '#/', label: 'Home', photo: 'hero' },
  { href: '#/services', label: 'Services & prices', photo: 'facial' },
  { href: '#/team', label: 'Specialists', photo: 'curl' },
  { href: '#/book', label: 'Book a visit', photo: 'candles' },
  { href: '#/gift-cards', label: 'Gift cards', photo: 'products' },
  { href: '#/visits', label: 'My visits', photo: 'interior2' },
];

export function logo(cls = '') {
  return `<a class="logo ${cls}" href="#/" aria-label="${SALON.name} — home">
    <span class="logo__mark" aria-hidden="true"><svg viewBox="0 0 40 40" width="30" height="30"><circle cx="20" cy="20" r="18.5" fill="none" stroke="currentColor" stroke-width="1"/><path d="M14 28V12h7.2c3.3 0 5.3 1.7 5.3 4.2 0 1.8-1 3-2.6 3.5 2 .5 3.3 1.9 3.3 4 0 2.8-2.2 4.3-5.7 4.3z M17 18.8h3.8c1.8 0 2.8-.8 2.8-2.2s-1-2.1-2.8-2.1H17z M17 25.6h4.3c2 0 3.1-.8 3.1-2.3s-1.1-2.3-3.1-2.3H17z" fill="currentColor" fill-rule="evenodd"/></svg></span>
    <span class="logo__word">Beauty <i>Example</i></span>
  </a>`;
}

function announcement() {
  const items = [
    `First visit? Use <b>${SALON.firstVisit.code}</b> for ${SALON.firstVisit.percent}% off`,
    'Free patch tests, always',
    'Digital gift cards delivered in minutes',
    'Free cancellation up to 24 hours before',
  ];
  const row = items.map((t) => `<span>${t}</span><i aria-hidden="true">✦</i>`).join('');
  return `<div class="announce" role="region" aria-label="Announcements">
    <div class="announce__track"><div class="announce__row">${row}</div><div class="announce__row" aria-hidden="true">${row}</div></div>
  </div>`;
}

function headerMarkup() {
  return `${announcement()}
  <header class="header" id="header">
    <div class="header__inner">
      <button class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="overlayMenu">
        <span class="menu-btn__lines" aria-hidden="true"><i></i><i></i></span><span class="menu-btn__label">Menu</span>
      </button>
      <nav class="header__links" aria-label="Main">
        <a href="#/services" data-nav="/services">Services</a>
        <a href="#/team" data-nav="/team">Specialists</a>
        <a href="#/gift-cards" data-nav="/gift-cards">Gift cards</a>
      </nav>
      ${logo('header__logo')}
      <div class="header__right">
        <a class="header__visits" href="#/visits" data-nav="/visits">${icon('calendar', 18)}<span>My visits</span><b class="badge" id="visitsBadge" hidden></b></a>
        <a class="btn btn--small btn--dark header__book" href="#/book">Book now</a>
      </div>
    </div>
  </header>
  <div class="overlay-menu" id="overlayMenu" aria-hidden="true" aria-label="Site menu" role="dialog" aria-modal="true">
    <div class="overlay-menu__media" aria-hidden="true">
      ${MENU.map((m, i) => `<div class="overlay-menu__img ${i === 0 ? 'is-active' : ''}" data-img="${i}" style="background-image:url('${photo(m.photo, 1000)}')"></div>`).join('')}
    </div>
    <div class="overlay-menu__body">
      <ol class="overlay-menu__list">
        ${MENU.map((m, i) => `<li><a href="${m.href}" data-idx="${i}"><span class="num">0${i + 1}</span><span class="txt">${m.label}</span></a></li>`).join('')}
      </ol>
      <div class="overlay-menu__foot">
        <div><span class="eyebrow">Visit</span><p>${esc(SALON.address)}<br><span data-open-status></span></p></div>
        <div><span class="eyebrow">Call or text</span><p><a href="${SALON.phoneHref}">${SALON.phone}</a><br><a href="mailto:${SALON.email}">${SALON.email}</a></p></div>
      </div>
    </div>
  </div>`;
}

function footerMarkup() {
  const hours = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = SALON.hours[d];
    return `<li${d === new Date().getDay() ? ' class="is-today"' : ''}><span>${DAY_NAMES[d]}</span><span>${h ? `${hm(h[0] * 60)} – ${hm(h[1] * 60)}` : 'Closed'}</span></li>`;
  }).join('');
  return `<footer class="footer">
    <div class="footer__cta container">
      <p class="eyebrow">Your next appointment</p>
      <h2 class="display">Take an hour <em>for yourself.</em></h2>
      <a class="btn btn--light" href="#/book">Book a visit ${icon('arrow', 18)}</a>
    </div>
    <div class="footer__grid container">
      <div class="footer__brand">
        ${logo('logo--light')}
        <p>A small, quiet salon for hair, skin, hands and body. Portfolio demo — the salon, people and reviews are fictional.</p>
        <form class="newsletter" id="newsletter" novalidate>
          <label for="nl-email" class="eyebrow">Seasonal notes & openings</label>
          <div class="newsletter__row">
            <input id="nl-email" type="email" name="email" placeholder="Your email" autocomplete="email" required>
            <button class="icon-btn icon-btn--light" aria-label="Subscribe">${icon('arrow')}</button>
          </div>
          <span class="newsletter__msg" aria-live="polite"></span>
        </form>
      </div>
      <div>
        <p class="eyebrow">Services</p>
        <ul class="footer__links">${CATEGORIES.map((c) => `<li><a href="#/services?cat=${c.id}">${c.name}</a></li>`).join('')}</ul>
      </div>
      <div>
        <p class="eyebrow">Opening hours</p>
        <ul class="footer__hours">${hours}</ul>
      </div>
      <div>
        <p class="eyebrow">Find us</p>
        <p class="footer__contact">${icon('pin', 16)} ${esc(SALON.address)}<br>${icon('phone', 16)} <a href="${SALON.phoneHref}">${SALON.phone}</a><br>${icon('mail', 16)} <a href="mailto:${SALON.email}">${SALON.email}</a><br>${icon('insta', 16)} ${SALON.instagram}</p>
      </div>
    </div>
    <div class="footer__bottom container">
      <span>© ${new Date().getFullYear()} ${SALON.name} · Portfolio project</span>
      <span>Photos: <a href="https://unsplash.com/license" target="_blank" rel="noopener">Unsplash License</a> · <a href="#/credits">Photo credits</a></span>
    </div>
  </footer>
  <a class="book-bar" href="#/book" id="bookBar">${icon('calendar', 18)} Book a visit <span data-open-status-short></span></a>`;
}

export function mountShell() {
  $('#app-header').innerHTML = headerMarkup();
  $('#app-footer').innerHTML = footerMarkup();

  const header = $('#header');
  const menu = $('#overlayMenu');
  const btn = $('#menuBtn');

  const setMenu = (open) => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('.menu-btn__label').textContent = open ? 'Close' : 'Menu';
    document.documentElement.classList.toggle('is-menu-open', open);
    if (open) setTimeout(() => $('.overlay-menu__list a', menu)?.focus(), 350);
  };
  btn.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  on(menu, 'click', 'a', () => setMenu(false));
  on(menu, 'mouseover', 'a[data-idx]', (_, a) => {
    $$('.overlay-menu__img', menu).forEach((x) => x.classList.toggle('is-active', x.dataset.img === a.dataset.idx));
  });
  on(menu, 'focusin', 'a[data-idx]', (_, a) => {
    $$('.overlay-menu__img', menu).forEach((x) => x.classList.toggle('is-active', x.dataset.img === a.dataset.idx));
  });
  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('is-open')) return;
    if (e.key === 'Escape') { setMenu(false); btn.focus(); }
    if (e.key === 'Tab') trapFocus(e, document.body.contains(menu) ? header.parentElement : document.body);
  });

  // Header: solid after scrolling, hides on the way down, returns on the way up
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    header.classList.toggle('is-solid', y > 40);
    header.classList.toggle('is-hidden', y > 400 && y > lastY && !menu.classList.contains('is-open'));
    $('#bookBar')?.classList.toggle('is-visible', y > 500);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Open / closed status (updates every minute)
  const paintStatus = () => {
    const s = openStatus();
    $$('[data-open-status]').forEach((el) => { el.innerHTML = `<i class="dot ${s.open ? 'dot--open' : ''}"></i>${s.text}`; });
    $$('[data-open-status-short]').forEach((el) => { el.textContent = s.open ? '· open now' : ''; });
  };
  paintStatus();
  setInterval(paintStatus, 60000);

  // Upcoming visits badge
  const paintBadge = () => {
    const n = bookings().filter((b) => b.status === 'confirmed' && !isPast(b)).length;
    const badge = $('#visitsBadge');
    badge.hidden = !n;
    badge.textContent = n;
  };
  paintBadge();
  addEventListener('bookings:changed', paintBadge);

  // Newsletter
  const form = $('#newsletter');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.elements.email;
    const msg = $('.newsletter__msg', form);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim())) {
      msg.textContent = 'Please enter a valid email.';
      input.focus();
      return;
    }
    const b = $('button', form);
    setBusy(b, true, '');
    await subscribe(input.value);
    setBusy(b, false);
    form.reset();
    msg.textContent = 'Thank you — you are on the list.';
  });
}

/** Highlights the active nav link. */
export function markNav(path) {
  $$('[data-nav]').forEach((a) => a.classList.toggle('is-active', path.startsWith(a.dataset.nav)));
  document.body.dataset.page = path.split('/')[1] || 'home';
}

export { navigate, img };
