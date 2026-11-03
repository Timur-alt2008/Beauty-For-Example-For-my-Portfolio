// Services & prices: interactive price list with filters and a "visit plan".

import { $, $$, esc, on, debounce } from '../lib/dom.js';
import { CATEGORIES, SERVICES, categoryById, serviceById } from '../data/services.js';
import { teamFor } from '../data/team.js';
import { img } from '../data/images.js';
import { icon, observeReveal, toast } from '../components/ui.js';
import { money, duration } from '../lib/format.js';
import { replaceQuery } from '../router.js';
import { store } from '../store.js';
import { pageHead, bookLink } from './common.js';

const LENGTHS = [
  { id: '', label: 'Any length' },
  { id: 'short', label: 'Under 45 min', test: (d) => d < 45 },
  { id: 'mid', label: '45–90 min', test: (d) => d >= 45 && d <= 90 },
  { id: 'long', label: 'Over 90 min', test: (d) => d > 90 },
];

const plan = {
  get: () => store.get('plan', []),
  toggle(id) {
    const list = plan.get();
    return store.set('plan', list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);
  },
  clear: () => store.set('plan', []),
};

function row(s) {
  const inPlan = plan.get().includes(s.id);
  const people = teamFor(s.cat).map((m) => m.name.split(' ')[0]).join(', ');
  return `<li class="price-row ${inPlan ? 'is-in-plan' : ''}" data-id="${s.id}">
    <button class="price-row__head" aria-expanded="false" aria-controls="d-${s.id}">
      <span class="price-row__name">${esc(s.name)}${(s.tags || []).map((t) => `<em class="pill pill--${t}">${t}</em>`).join('')}</span>
      <span class="price-row__dots" aria-hidden="true"></span>
      <span class="price-row__meta">${duration(s.duration)}</span>
      <span class="price-row__price">${money(s.price)}</span>
      <span class="price-row__chev" aria-hidden="true">${icon('plus', 18)}</span>
    </button>
    <div class="price-row__detail" id="d-${s.id}">
      <div class="price-row__detail-inner">
        <p>${esc(s.desc)}</p>
        <p class="price-row__who">${icon('user', 15)} With ${esc(people)}</p>
        <div class="price-row__actions">
          <a class="btn btn--small btn--dark" href="${bookLink({ service: s.id })}">Book this</a>
          <button class="btn btn--small btn--line" data-plan="${s.id}" aria-pressed="${inPlan}">${inPlan ? `${icon('check', 16)} In your plan` : `${icon('plus', 16)} Add to visit plan`}</button>
        </div>
      </div>
    </div>
  </li>`;
}

export async function renderServices({ query, scope }) {
  const main = $('#main');
  const state = { cat: query.cat || '', q: query.q || '', len: query.len || '' };

  main.innerHTML = pageHead({
    eyebrow: 'Services & prices',
    title: 'The menu, <em>priced up front.</em>',
    lead: 'Every price includes consultation, aftercare advice and a written card with what we used. Tap a service to see the details.',
  }) + `<section class="menu container">
    <div class="menu__bar" id="menuBar">
      <div class="chips" role="tablist" aria-label="Category">
        <button class="chip" role="tab" data-cat="">All</button>
        ${CATEGORIES.map((c) => `<button class="chip" role="tab" data-cat="${c.id}">${c.name}</button>`).join('')}
      </div>
      <div class="menu__tools">
        <label class="search">${icon('sparkle', 16)}<input type="search" id="menuSearch" placeholder="Search treatments" value="${esc(state.q)}" aria-label="Search treatments"></label>
        <select id="menuLen" aria-label="Filter by length">${LENGTHS.map((l) => `<option value="${l.id}" ${l.id === state.len ? 'selected' : ''}>${l.label}</option>`).join('')}</select>
      </div>
    </div>
    <div id="menuList" class="menu__list" aria-live="polite"></div>
  </section>
  <div class="plan-bar" id="planBar" hidden></div>`;

  const list = $('#menuList', main);

  const paint = () => {
    $$('.chip', main).forEach((c) => {
      const on = c.dataset.cat === state.cat;
      c.classList.toggle('is-active', on);
      c.setAttribute('aria-selected', String(on));
    });
    const len = LENGTHS.find((l) => l.id === state.len);
    const q = state.q.trim().toLowerCase();
    const cats = state.cat ? [categoryById(state.cat)] : CATEGORIES;
    let total = 0;
    const blocks = cats.map((c) => {
      const items = SERVICES.filter((s) => s.cat === c.id)
        .filter((s) => !len?.test || len.test(s.duration))
        .filter((s) => !q || `${s.name} ${s.desc}`.toLowerCase().includes(q));
      total += items.length;
      if (!items.length) return '';
      return `<article class="menu-cat" data-reveal>
        <div class="menu-cat__side">
          <figure class="menu-cat__img">${img(c.photo, { w: 600, ratio: 0.85, sizes: '(max-width: 900px) 100vw, 30vw' })}</figure>
          <h2 class="display">${c.name}</h2>
          <p>${c.lead}</p>
          <p class="menu-cat__note">${icon('sparkle', 14)} ${c.note}</p>
        </div>
        <ul class="price-list">${items.map(row).join('')}</ul>
      </article>`;
    }).join('');
    list.innerHTML = total ? blocks : `<div class="empty"><p class="display">Nothing matches <em>“${esc(state.q)}”.</em></p><button class="btn btn--line" data-reset>Clear filters</button></div>`;
    observeReveal(list);
    replaceQuery(state);
  };

  const paintPlan = () => {
    const ids = plan.get();
    const bar = $('#planBar', main);
    if (!ids.length) { bar.hidden = true; return; }
    const items = ids.map(serviceById).filter(Boolean);
    const mins = items.reduce((a, s) => a + s.duration, 0);
    const price = items.reduce((a, s) => a + s.price, 0);
    const mixed = new Set(items.map((s) => s.cat)).size > 1;
    const first = items[0];
    const sameCat = items.filter((s) => s.cat === first.cat).slice(1).map((s) => s.id);
    bar.hidden = false;
    bar.innerHTML = `<div class="plan-bar__inner container">
      <div class="plan-bar__info"><b>Your visit plan</b><span>${items.length} ${items.length === 1 ? 'service' : 'services'} · ${duration(mins)} · ${money(price)}</span>
        ${mixed ? `<small>Different disciplines are booked as separate appointments — we’ll start with ${esc(categoryById(first.cat).name.toLowerCase())}.</small>` : ''}</div>
      <div class="plan-bar__actions">
        <button class="btn btn--small btn--ghost-light" data-clear-plan>Clear</button>
        <a class="btn btn--small btn--light" href="${bookLink({ service: first.id, addons: sameCat.join(',') })}">Book ${mixed ? 'first part' : 'this plan'} ${icon('arrow', 16)}</a>
      </div>
    </div>`;
  };

  on(main, 'click', '.chip', (_, b) => { state.cat = b.dataset.cat; paint(); });
  on(main, 'click', '[data-reset]', () => { state.q = ''; state.len = ''; state.cat = ''; $('#menuSearch', main).value = ''; $('#menuLen', main).value = ''; paint(); });
  scope.on($('#menuSearch', main), 'input', debounce((e) => { state.q = e.target.value; paint(); }, 160));
  scope.on($('#menuLen', main), 'change', (e) => { state.len = e.target.value; paint(); });

  on(main, 'click', '.price-row__head', (_, b) => {
    const rowEl = b.closest('.price-row');
    const open = !rowEl.classList.contains('is-open');
    rowEl.classList.toggle('is-open', open);
    b.setAttribute('aria-expanded', String(open));
  });
  on(main, 'click', '[data-plan]', (_, b) => {
    const ids = plan.toggle(b.dataset.plan);
    const inPlan = ids.includes(b.dataset.plan);
    b.closest('.price-row').classList.toggle('is-in-plan', inPlan);
    b.setAttribute('aria-pressed', String(inPlan));
    b.innerHTML = inPlan ? `${icon('check', 16)} In your plan` : `${icon('plus', 16)} Add to visit plan`;
    paintPlan();
    if (inPlan) toast(`${serviceById(b.dataset.plan).name} added to your plan`);
  });
  on(main, 'click', '[data-clear-plan]', () => {
    plan.clear();
    $$('.price-row.is-in-plan', main).forEach((r) => r.classList.remove('is-in-plan'));
    paint();
    paintPlan();
  });

  paint();
  paintPlan();
  observeReveal(main);
  if (state.cat) setTimeout(() => $('#menuBar', main)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 300);
}
