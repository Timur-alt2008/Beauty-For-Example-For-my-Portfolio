// Specialists page: filter by discipline, profile with a 7-day availability strip.

import { $, $$, esc, on } from '../lib/dom.js';
import { TEAM, memberById } from '../data/team.js';
import { CATEGORIES, SERVICES } from '../data/services.js';
import { img } from '../data/images.js';
import { icon, observeReveal, openModal } from '../components/ui.js';
import { slotsFor, works } from '../services/api.js';
import { isoDate, addDays, today, niceDate } from '../lib/format.js';
import { replaceQuery } from '../router.js';
import { pageHead, teamCard, bookLink } from './common.js';

function weekStrip(m) {
  const svc = SERVICES.find((s) => s.cat === m.cats[0] && s.price > 0);
  return `<ol class="week">${Array.from({ length: 7 }, (_, i) => {
    const iso = isoDate(addDays(today(), i));
    const slots = works(m, iso) ? slotsFor({ serviceId: svc.id, memberId: m.id, iso, minutes: svc.duration }) : [];
    const label = niceDate(iso, { weekday: 'short', day: 'numeric' });
    return `<li>${slots.length
      ? `<a href="${bookLink({ member: m.id, service: svc.id, date: iso })}"><span>${label}</span><b>${slots.length}</b><small>free</small></a>`
      : `<span class="is-off"><span>${label}</span><b>—</b><small>${works(m, iso) ? 'full' : 'off'}</small></span>`}</li>`;
  }).join('')}</ol>`;
}

function profile(m) {
  openModal(`<div class="profile">
    <figure class="profile__photo">${img(m.photo, { w: 700, ratio: 0.8, sizes: '(max-width: 700px) 100vw, 40vw', altText: `Portrait used for ${m.name} (stock photo)` })}</figure>
    <div class="profile__body">
      <p class="eyebrow">${esc(m.level)} · ${m.years} years</p>
      <h2 class="display">${esc(m.name)}</h2>
      <p class="member__role">${esc(m.role)}</p>
      <p>${esc(m.bio)}</p>
      <ul class="tags">${m.specialties.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <p class="eyebrow">Availability this week</p>
      ${weekStrip(m)}
      <a class="btn btn--dark" href="${bookLink({ member: m.id, cat: m.cats[0] })}">Book with ${esc(m.name.split(' ')[0])} ${icon('arrow', 18)}</a>
    </div>
  </div>`, { label: m.name, variant: 'drawer', onClose: () => replaceQuery({}) });
}

export async function renderTeam({ query }) {
  const main = $('#main');
  let cat = query.cat || '';
  main.innerHTML = pageHead({
    eyebrow: 'Specialists',
    title: 'Six people, <em>each a specialist.</em>',
    lead: 'Book with someone you already love, or let us match you with whoever is free first. Every profile shows real-time openings for the week.',
  }) + `<section class="container team-page">
    <div class="chips" role="tablist" aria-label="Discipline">
      <button class="chip" data-cat="">Everyone</button>
      ${CATEGORIES.map((c) => `<button class="chip" data-cat="${c.id}">${c.name}</button>`).join('')}
    </div>
    <div class="team-grid" id="teamGrid"></div>
    <p class="fineprint">Portraits are stock photos from Unsplash used for a fictional team.</p>
  </section>`;

  const paint = () => {
    $$('.chip', main).forEach((c) => { c.classList.toggle('is-active', c.dataset.cat === cat); c.setAttribute('aria-selected', String(c.dataset.cat === cat)); });
    const list = TEAM.filter((m) => !cat || m.cats.includes(cat));
    $('#teamGrid', main).innerHTML = list.map((m) => teamCard(m, { detailed: true }).replace('</h3>', `</h3><button class="link-arrow member__more" data-profile="${m.id}">Availability ${icon('arrow', 16)}</button>`)).join('');
    observeReveal(main);
  };
  on(main, 'click', '.chip', (_, b) => { cat = b.dataset.cat; replaceQuery({ cat }); paint(); });
  on(main, 'click', '[data-profile]', (_, b) => { replaceQuery({ cat, m: b.dataset.profile }); profile(memberById(b.dataset.profile)); });
  paint();
  if (query.m && memberById(query.m)) profile(memberById(query.m));
}
