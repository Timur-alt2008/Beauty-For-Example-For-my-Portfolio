// Home page.

import { $, $$, esc, on } from '../lib/dom.js';
import { SALON, STATS, REVIEWS, FAQ, DAY_NAMES } from '../data/site.js';
import { CATEGORIES, SERVICES, RITUALS, servicesIn, fromPrice, serviceById } from '../data/services.js';
import { TEAM, memberById } from '../data/team.js';
import { img, photo } from '../data/images.js';
import { icon, splitWords, observeReveal, openModal, field, validate, setBusy, toast } from '../components/ui.js';
import { nextAvailable, openStatus, sendMessage } from '../services/api.js';
import { money, duration, relativeDay, hm } from '../lib/format.js';
import { bookLink, teamCard, faqList } from './common.js';

function hero() {
  const next = nextAvailable({ cat: 'skin' }) || nextAvailable({ cat: 'hair' });
  const m = next && memberById(next.memberId);
  const s = next && serviceById(next.serviceId);
  return `<section class="hero">
    <div class="hero__text">
      <p class="eyebrow" data-reveal>${SALON.tagline} — ${SALON.city}</p>
      <h1 class="hero__title display" aria-label="Quiet luxury, done with care.">
        <span class="line">${splitWords('Quiet luxury,')}</span>
        <span class="line line--indent"><em>${splitWords('done with care.')}</em></span>
      </h1>
      <p class="hero__lead" data-reveal style="--d:450ms">A small salon where every appointment starts with a conversation. Precise cuts, honest skin care and long, unhurried rituals — booked in under a minute.</p>
      <div class="hero__actions" data-reveal style="--d:550ms">
        <a class="btn btn--dark" href="#/book">Book a visit ${icon('arrow', 18)}</a>
        <a class="btn btn--line" href="#/services">Services & prices</a>
      </div>
      ${next ? `<a class="next-slot" data-reveal style="--d:700ms" href="${bookLink({ service: next.serviceId, member: next.memberId, date: next.iso, time: next.time })}">
        <span class="next-slot__pulse" aria-hidden="true"></span>
        <span class="next-slot__txt"><small>Next free appointment</small><b>${relativeDay(next.iso)}, ${next.time}</b> · ${esc(s.name)} with ${esc(m.name.split(' ')[0])}</span>
        ${icon('arrow', 18)}
      </a>` : ''}
    </div>
    <div class="hero__media">
      <figure class="hero__main reveal-mask">${img('hero', { w: 1100, ratio: 0.8, eager: true, sizes: '(max-width: 900px) 100vw, 55vw', cls: 'kenburns' })}</figure>
      <figure class="hero__small reveal-mask" data-parallax="-0.12" style="--d:400ms">${img('candles', { w: 420, ratio: 0.75, eager: true, sizes: '220px' })}</figure>
      <div class="hero__badge" data-parallax="0.08" aria-hidden="true">
        <svg viewBox="0 0 120 120" class="spin"><defs><path id="circ" d="M60 60m-44 0a44 44 0 1188 0a44 44 0 11-88 0"/></defs><text><textPath href="#circ">Hair · Skin · Hands · Body · Since 2014 · </textPath></text></svg>
        <span>✦</span>
      </div>
    </div>
  </section>`;
}

function infoStrip() {
  const h = SALON.hours[new Date().getDay()];
  return `<section class="info-strip container" aria-label="Visit information">
    <div class="info-strip__cell" data-reveal="stagger">${icon('pin')}<div><small>Address</small><a href="#visit">${esc(SALON.address)}</a></div></div>
    <div class="info-strip__cell" data-reveal="stagger">${icon('clock')}<div><small>Today${h ? ` · ${hm(h[0] * 60)}–${hm(h[1] * 60)}` : ''}</small><span data-open-status>${openStatus().text}</span></div></div>
    <div class="info-strip__cell" data-reveal="stagger">${icon('phone')}<div><small>Call or text</small><a href="${SALON.phoneHref}">${SALON.phone}</a></div></div>
    <a class="info-strip__cell info-strip__cell--cta" href="#/book" data-reveal="stagger">${icon('calendar')}<div><small>Online booking</small><span>Choose a time ${icon('arrow', 16)}</span></div></a>
  </section>`;
}

function marquee() {
  const words = ['Precision cuts', 'Lived-in colour', 'Signature facials', 'Hot stone rituals', 'Structured manicures', 'Brows & lashes'];
  const row = words.map((w) => `<span>${w}</span><i aria-hidden="true">✦</i>`).join('');
  return `<div class="marquee" aria-hidden="true"><div class="marquee__track"><div>${row}</div><div>${row}</div></div></div>`;
}

function intro() {
  return `<section class="intro container">
    <p class="eyebrow" data-reveal>The house</p>
    <p class="intro__statement display" data-reveal>We keep the room quiet, the chairs few and the schedule generous — so <em>your</em> appointment never feels like the next one in line.</p>
    <div class="intro__grid">
      <figure class="intro__img reveal-mask" data-parallax="0.06">${img('interior2', { w: 800, ratio: 0.8 })}</figure>
      <div class="intro__text" data-reveal>
        <p>Beauty Example opened in a former bookbinder’s workshop in Old Town. Six senior specialists, five treatment rooms and one rule: we only book what we can do properly.</p>
        <p>Every visit starts with a short consultation, ends with a written aftercare card, and is priced up front — no surprise extras at the desk.</p>
        <a class="link-arrow" href="#/team">Meet the specialists ${icon('arrow', 18)}</a>
      </div>
    </div>
    <dl class="stats">
      ${STATS.map((s) => `<div data-reveal="stagger"><dt>${s.label}</dt><dd data-count="${s.value}" data-decimals="${s.decimals || 0}" data-suffix="${s.suffix}">0</dd></div>`).join('')}
    </dl>
  </section>`;
}

function explorer() {
  return `<section class="explorer" id="services">
    <div class="container">
      <div class="section-head">
        <p class="eyebrow" data-reveal>Services</p>
        <h2 class="display" data-reveal>Five disciplines, <em>one standard.</em></h2>
      </div>
      <div class="explorer__grid">
        <div class="explorer__tabs" role="tablist" aria-label="Service categories">
          ${CATEGORIES.map((c, i) => `<button class="explorer__tab ${i === 0 ? 'is-active' : ''}" role="tab" id="tab-${c.id}" aria-selected="${i === 0}" aria-controls="panel-${c.id}" data-cat="${c.id}">
            <span class="num">0${i + 1}</span><span class="name">${c.name}</span><span class="from">from ${money(fromPrice(c.id))}</span>
            <span class="bar" aria-hidden="true"></span>
          </button>`).join('')}
        </div>
        <div class="explorer__stage">
          ${CATEGORIES.map((c, i) => `<div class="explorer__panel ${i === 0 ? 'is-active' : ''}" role="tabpanel" id="panel-${c.id}" aria-labelledby="tab-${c.id}" ${i ? 'hidden' : ''}>
            <figure class="explorer__img">${img(c.photo, { w: 900, ratio: 1.15, sizes: '(max-width: 900px) 100vw, 45vw' })}</figure>
            <div class="explorer__copy">
              <p class="explorer__lead">${c.lead}</p>
              <ul class="mini-menu">
                ${servicesIn(c.id).filter((s) => s.price > 0).slice(0, 4).map((s) => `<li><a href="#/book?service=${s.id}"><span>${s.name}</span><i></i><span>${duration(s.duration)} · ${money(s.price)}</span></a></li>`).join('')}
              </ul>
              <p class="explorer__note">${icon('sparkle', 16)} ${c.note}</p>
              <a class="link-arrow" href="#/services?cat=${c.id}">All ${c.name.toLowerCase()} services ${icon('arrow', 18)}</a>
            </div>
          </div>`).join('')}
        </div>
      </div>
    </div>
  </section>`;
}

function rituals() {
  return `<section class="rituals">
    <div class="container rituals__head">
      <div>
        <p class="eyebrow" data-reveal>Signature rituals</p>
        <h2 class="display" data-reveal>Worth <em>the whole afternoon.</em></h2>
      </div>
      <div class="rituals__nav">
        <button class="icon-btn" data-scroll="-1" aria-label="Previous">${icon('back')}</button>
        <button class="icon-btn" data-scroll="1" aria-label="Next">${icon('arrow')}</button>
      </div>
    </div>
    <div class="rituals__track" tabindex="0" aria-label="Signature rituals, scroll horizontally">
      ${RITUALS.map((r, i) => {
        const s = serviceById(r.id);
        return `<article class="ritual" data-reveal="stagger">
          <figure>${img(r.photo, { w: 640, ratio: 0.78, sizes: '(max-width: 700px) 80vw, 30vw' })}</figure>
          <div class="ritual__body">
            <span class="ritual__kicker">${r.kicker}</span>
            <h3>${s.name}</h3>
            <p>${s.desc}</p>
            <div class="ritual__foot"><span>${money(s.price)}</span><a class="link-arrow" href="#/book?service=${s.id}">Book ${icon('arrow', 16)}</a></div>
          </div>
          <span class="ritual__num" aria-hidden="true">0${i + 1}</span>
        </article>`;
      }).join('')}
    </div>
    <div class="container"><div class="progress" aria-hidden="true"><i id="ritualProgress"></i></div></div>
  </section>`;
}

const TONES = [
  { id: 'honey', name: 'Honey', filter: 'sepia(.35) saturate(1.35) hue-rotate(-8deg) brightness(1.08)', swatch: '#c79a5b' },
  { id: 'copper', name: 'Copper', filter: 'sepia(.55) saturate(1.9) hue-rotate(-22deg) brightness(1.02)', swatch: '#b0623a' },
  { id: 'ash', name: 'Cool ash', filter: 'saturate(.35) hue-rotate(160deg) brightness(1.08) contrast(1.05)', swatch: '#a7a49c' },
  { id: 'espresso', name: 'Espresso', filter: 'sepia(.25) saturate(1.1) brightness(.72) contrast(1.12)', swatch: '#4a3226' },
];

function toneStudio() {
  return `<section class="tone container" id="tone">
    <div class="tone__copy">
      <p class="eyebrow" data-reveal>Tone studio</p>
      <h2 class="display" data-reveal>Try a direction <em>before the chair.</em></h2>
      <p data-reveal>Drag the handle to compare and pick a tone family. It helps you show your colourist what you mean by “warmer” or “cooler”.</p>
      <div class="tone__swatches" role="radiogroup" aria-label="Tone family" data-reveal>
        ${TONES.map((t, i) => `<button role="radio" aria-checked="${i === 0}" class="swatch ${i === 0 ? 'is-active' : ''}" data-tone="${t.id}" style="--sw:${t.swatch}"><i></i>${t.name}</button>`).join('')}
      </div>
      <p class="tone__disclaimer">${icon('sparkle', 14)} Simulated with a colour filter on a stock photo — not a client result. Your consultation decides what is right for your hair.</p>
      <a class="link-arrow" href="#/book?service=h-gloss" data-reveal>Book a gloss & tone consultation ${icon('arrow', 18)}</a>
    </div>
    <div class="compare" id="compare" style="--pos:50%" data-reveal>
      <div class="compare__img compare__img--after" id="compareAfter" style="filter:${TONES[0].filter}">${img('curl', { w: 1000, ratio: 1.25, sizes: '(max-width: 900px) 100vw, 50vw', altText: '' })}</div>
      <div class="compare__img compare__img--before">${img('curl', { w: 1000, ratio: 1.25, sizes: '(max-width: 900px) 100vw, 50vw' })}</div>
      <span class="compare__tag compare__tag--l">Now</span><span class="compare__tag compare__tag--r" id="toneTag">${TONES[0].name}</span>
      <div class="compare__handle" aria-hidden="true"><span>${icon('drag', 18)}</span></div>
      <input class="compare__range" type="range" min="0" max="100" value="50" aria-label="Compare current colour with the selected tone">
    </div>
  </section>`;
}

function team() {
  return `<section class="team-preview">
    <div class="container">
      <div class="section-head section-head--split">
        <div>
          <p class="eyebrow" data-reveal>Specialists</p>
          <h2 class="display" data-reveal>Choose <em>your person.</em></h2>
        </div>
        <a class="link-arrow" href="#/team" data-reveal>All specialists ${icon('arrow', 18)}</a>
      </div>
      <div class="team-grid team-grid--four">${TEAM.slice(0, 4).map((m) => teamCard(m)).join('')}</div>
    </div>
  </section>`;
}

const GALLERY = ['interior3', 'makeup', 'nails2', 'bottle', 'massage', 'products', 'brushes'];

function gallery() {
  return `<section class="gallery container">
    <div class="section-head">
      <p class="eyebrow" data-reveal>Inside the salon</p>
      <h2 class="display" data-reveal>Low light, <em>soft linen,</em> good hands.</h2>
    </div>
    <div class="gallery__grid">
      ${GALLERY.map((k, i) => `<button class="gallery__item g${i}" data-gallery="${i}" aria-label="Open photo ${i + 1} of ${GALLERY.length}" data-reveal="stagger">${img(k, { w: 700, sizes: '(max-width: 700px) 50vw, 33vw' })}</button>`).join('')}
    </div>
  </section>`;
}

function reviews() {
  return `<section class="reviews">
    <div class="container reviews__inner">
      <p class="eyebrow">Guest notes <span class="muted">· demo reviews</span></p>
      <div class="reviews__stars" aria-label="Average rating 4.9 out of 5">${icon('star', 16)}${icon('star', 16)}${icon('star', 16)}${icon('star', 16)}${icon('star', 16)} <span>4.9 average</span></div>
      <div class="reviews__stage" aria-live="polite">
        ${REVIEWS.map((r, i) => `<figure class="review ${i === 0 ? 'is-active' : ''}" ${i ? 'aria-hidden="true"' : ''}>
          <blockquote class="display">“${esc(r.quote)}”</blockquote>
          <figcaption><b>${esc(r.name)}</b> · ${esc(r.service)}</figcaption>
        </figure>`).join('')}
      </div>
      <div class="reviews__dots" role="tablist" aria-label="Choose review">
        ${REVIEWS.map((r, i) => `<button role="tab" aria-selected="${i === 0}" aria-label="Review ${i + 1}" data-review="${i}" class="${i === 0 ? 'is-active' : ''}"><i></i></button>`).join('')}
      </div>
    </div>
  </section>`;
}

function offers() {
  return `<section class="offers container">
    <a class="offer offer--gift" href="#/gift-cards" data-reveal="stagger">
      <div class="offer__card" aria-hidden="true"><span>Gift card</span><b>$150</b><i>Beauty <em>Example</em></i></div>
      <div><p class="eyebrow">Gift cards</p><h3 class="display">Give an hour <em>of quiet.</em></h3><p>Designed by you, delivered by email — instantly or on the day you choose.</p><span class="link-arrow">Create a gift card ${icon('arrow', 18)}</span></div>
    </a>
    <a class="offer offer--first" href="#/book" data-reveal="stagger">
      <figure>${img('bottle', { w: 600, ratio: 1.3, sizes: '(max-width: 900px) 100vw, 30vw' })}</figure>
      <div><p class="eyebrow">First visit</p><h3 class="display">${SALON.firstVisit.percent}% off <em>your first visit.</em></h3><p>Use code <b>${SALON.firstVisit.code}</b> at the last step of booking. Any service, any specialist.</p><span class="link-arrow">Book your first visit ${icon('arrow', 18)}</span></div>
    </a>
  </section>`;
}

function visit() {
  const rows = [1, 2, 3, 4, 5, 6, 0].map((d) => {
    const h = SALON.hours[d];
    return `<li class="${d === new Date().getDay() ? 'is-today' : ''}"><span>${DAY_NAMES[d]}</span><span>${h ? `${hm(h[0] * 60)} – ${hm(h[1] * 60)}` : 'Closed'}</span></li>`;
  }).join('');
  return `<section class="visit container" id="visit">
    <div class="visit__map" data-reveal>
      ${mapSvg()}
      <div class="visit__address"><b>${esc(SALON.address)}</b><span data-open-status></span></div>
    </div>
    <div class="visit__info">
      <p class="eyebrow" data-reveal>Visit</p>
      <h2 class="display" data-reveal>Find <em>the green door.</em></h2>
      <p data-reveal>Two minutes from Mill Lane car park, step-free from the street. Tea is on when you arrive.</p>
      <ul class="hours" data-reveal>${rows}</ul>
      <form class="contact-form" id="contactForm" novalidate data-reveal>
        <p class="eyebrow">Ask us anything</p>
        <div class="form-row">${field({ name: 'name', label: 'Name', required: true, autocomplete: 'name' })}${field({ name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email' })}</div>
        ${field({ name: 'message', label: 'Message', rows: 3, required: true, placeholder: 'A question about a treatment, a group booking…' })}
        <button class="btn btn--dark" type="submit">Send message</button>
      </form>
    </div>
  </section>`;
}

function mapSvg() {
  // Original, hand-drawn style street map (not a map service screenshot).
  return `<svg class="map" viewBox="0 0 600 480" role="img" aria-label="Simplified map of Old Town showing the salon on Alder Row">
    <rect width="600" height="480" fill="var(--map-bg)"/>
    <path d="M-10 330 C120 300 210 360 330 320 S520 250 610 280" stroke="var(--map-river)" stroke-width="34" fill="none" opacity=".55"/>
    <g stroke="var(--map-road)" stroke-width="16" fill="none" stroke-linecap="round">
      <path d="M40 -10 L120 490"/><path d="M-10 120 L610 80"/><path d="M260 -10 L300 490"/><path d="M-10 220 L610 200"/><path d="M450 -10 L520 490"/>
    </g>
    <g stroke="var(--map-road)" stroke-width="7" fill="none" opacity=".8"><path d="M120 150 L260 140"/><path d="M300 150 L460 140"/><path d="M180 220 L200 300"/><path d="M380 210 L400 280"/></g>
    <g fill="var(--map-block)">
      <rect x="140" y="20" width="100" height="70" rx="6"/><rect x="310" y="15" width="120" height="50" rx="6"/><rect x="140" y="240" width="25" height="60" rx="4"/>
      <rect x="320" y="230" width="50" height="45" rx="4"/><rect x="420" y="225" width="70" height="40" rx="4"/><rect x="60" y="380" width="150" height="70" rx="6"/><rect x="330" y="380" width="160" height="70" rx="6"/>
    </g>
    <rect x="445" y="300" width="140" height="60" rx="8" fill="var(--map-park)"/>
    <text x="515" y="335" text-anchor="middle" class="map__label">P · Mill Lane</text>
    <text x="60" y="246" class="map__label">Alder Row</text>
    <text x="40" y="320" class="map__label map__label--river">River Wend</text>
    <g class="map__pin" transform="translate(232 212)"><circle r="26" class="map__pulse"/><circle r="11" fill="var(--accent)"/><circle r="4" fill="var(--ivory)"/></g>
  </svg>`;
}

export async function renderHome({ scope }) {
  const main = $('#main');
  main.innerHTML = hero() + infoStrip() + marquee() + intro() + explorer() + rituals() + toneStudio() + team() + gallery() + reviews() + offers()
    + `<section class="faq container"><div class="section-head"><p class="eyebrow" data-reveal>Before you visit</p><h2 class="display" data-reveal>Good <em>to know.</em></h2></div>${faqList(FAQ)}</section>`
    + visit();

  // Service explorer tabs (click, hover on desktop, arrow keys)
  const tabs = $$('.explorer__tab', main);
  const select = (btn, focus = false) => {
    tabs.forEach((t) => {
      const on = t === btn;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', String(on));
      t.tabIndex = on ? 0 : -1;
      const panel = $(`#panel-${t.dataset.cat}`, main);
      panel.hidden = !on;
      panel.classList.toggle('is-active', on);
    });
    if (focus) btn.focus();
  };
  tabs.forEach((t, i) => { t.tabIndex = i ? -1 : 0; });
  on(main, 'click', '.explorer__tab', (_, b) => select(b));
  if (matchMedia('(hover: hover)').matches) on(main, 'mouseover', '.explorer__tab', (_, b) => { if (!b.classList.contains('is-active')) select(b); });
  on(main, 'keydown', '.explorer__tab', (e, b) => {
    const i = tabs.indexOf(b);
    if (['ArrowDown', 'ArrowRight'].includes(e.key)) { e.preventDefault(); select(tabs[(i + 1) % tabs.length], true); }
    if (['ArrowUp', 'ArrowLeft'].includes(e.key)) { e.preventDefault(); select(tabs[(i - 1 + tabs.length) % tabs.length], true); }
  });

  // Rituals scroller: buttons, drag to scroll, progress bar
  const track = $('.rituals__track', main);
  const bar = $('#ritualProgress', main);
  const paint = () => {
    const max = track.scrollWidth - track.clientWidth;
    bar.style.transform = `scaleX(${max > 0 ? Math.max(0.08, track.scrollLeft / max) : 1})`;
  };
  scope.on(track, 'scroll', paint, { passive: true });
  paint();
  on(main, 'click', '[data-scroll]', (_, b) => {
    const card = $('.ritual', track);
    track.scrollBy({ left: Number(b.dataset.scroll) * (card.offsetWidth + 24), behavior: 'smooth' });
  });
  let drag = null;
  scope.on(track, 'pointerdown', (e) => { if (e.pointerType !== 'mouse') return; drag = { x: e.clientX, left: track.scrollLeft, moved: false }; track.classList.add('is-dragging'); });
  scope.on(window, 'pointermove', (e) => { if (!drag) return; const dx = e.clientX - drag.x; if (Math.abs(dx) > 4) drag.moved = true; track.scrollLeft = drag.left - dx; });
  scope.on(window, 'pointerup', () => { if (!drag) return; track.classList.remove('is-dragging'); const moved = drag.moved; drag = null; if (moved) { const block = (e) => { e.preventDefault(); e.stopPropagation(); }; track.addEventListener('click', block, { capture: true, once: true }); setTimeout(() => track.removeEventListener('click', block, { capture: true }), 50); } });

  // Tone studio compare slider
  const compare = $('#compare', main);
  const range = $('.compare__range', compare);
  const setPos = (v) => compare.style.setProperty('--pos', `${v}%`);
  scope.on(range, 'input', () => setPos(range.value));
  on(main, 'click', '[data-tone]', (_, b) => {
    const t = TONES.find((x) => x.id === b.dataset.tone);
    $$('[data-tone]', main).forEach((x) => { x.classList.toggle('is-active', x === b); x.setAttribute('aria-checked', String(x === b)); });
    $('#compareAfter', main).style.filter = t.filter;
    $('#toneTag', main).textContent = t.name;
    if (Number(range.value) > 80 || Number(range.value) < 20) { range.value = 50; setPos(50); }
  });
  // Gentle hint animation the first time the slider is seen
  const hint = new IntersectionObserver(([e]) => {
    if (!e.isIntersecting) return;
    hint.disconnect();
    compare.classList.add('is-hinting');
    setTimeout(() => compare.classList.remove('is-hinting'), 1800);
  }, { threshold: 0.5 });
  hint.observe(compare);
  scope.add(() => hint.disconnect());

  // Reviews rotator
  const slides = $$('.review', main);
  const dots = $$('[data-review]', main);
  let cur = 0;
  const show = (i) => {
    cur = (i + slides.length) % slides.length;
    slides.forEach((s, k) => { s.classList.toggle('is-active', k === cur); s.setAttribute('aria-hidden', String(k !== cur)); });
    dots.forEach((d, k) => { d.classList.toggle('is-active', k === cur); d.setAttribute('aria-selected', String(k === cur)); });
  };
  on(main, 'click', '[data-review]', (_, b) => { show(Number(b.dataset.review)); });
  let paused = false;
  const stage = $('.reviews', main);
  scope.on(stage, 'mouseenter', () => { paused = true; });
  scope.on(stage, 'mouseleave', () => { paused = false; });
  scope.on(stage, 'focusin', () => { paused = true; });
  scope.on(stage, 'focusout', () => { paused = false; });
  scope.interval(() => { if (!paused && !document.hidden) show(cur + 1); }, 6500);

  // Gallery lightbox
  on(main, 'click', '[data-gallery]', (_, b) => openLightbox(Number(b.dataset.gallery)));

  // Contact form
  const form = $('#contactForm', main);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!validate(form, ['name', 'email', 'message'])) return;
    const btn = $('button[type=submit]', form);
    setBusy(btn, true, 'Sending…');
    await sendMessage({ name: form.elements.name.value, email: form.elements.email.value, message: form.elements.message.value });
    setBusy(btn, false);
    form.reset();
    toast('Thank you — we reply within one working day.');
  });

  observeReveal(main);
  requestAnimationFrame(() => main.querySelector('.hero')?.classList.add('is-in'));
}

function openLightbox(start) {
  let i = start;
  const markup = () => `<figure class="lightbox__fig">
      <img src="${photo(GALLERY[i], 1600)}" alt="">
      <figcaption>${i + 1} / ${GALLERY.length}</figcaption>
    </figure>
    <button class="icon-btn lightbox__prev" data-lb="-1" aria-label="Previous photo">${icon('back')}</button>
    <button class="icon-btn lightbox__next" data-lb="1" aria-label="Next photo">${icon('arrow')}</button>`;
  const m = openModal(`<div class="lightbox">${markup()}</div>`, { label: 'Photo viewer', variant: 'lightbox' });
  const paint = () => {
    $('.lightbox', m.panel).innerHTML = markup();
    const im = $('.lightbox img', m.panel);
    im.alt = document.querySelectorAll('[data-gallery] img')[i]?.alt || '';
  };
  paint();
  m.panel.addEventListener('click', (e) => {
    const b = e.target.closest('[data-lb]');
    if (!b) return;
    i = (i + Number(b.dataset.lb) + GALLERY.length) % GALLERY.length;
    paint();
  });
  m.el.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') { i = (i + 1) % GALLERY.length; paint(); }
    if (e.key === 'ArrowLeft') { i = (i - 1 + GALLERY.length) % GALLERY.length; paint(); }
  });
}
