// Pieces shared by several pages.

import { esc } from '../lib/dom.js';
import { img } from '../data/images.js';
import { icon } from '../components/ui.js';
import { nextAvailable } from '../services/api.js';
import { relativeDay } from '../lib/format.js';

export function bookLink(params = {}) {
  const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v));
  const s = qs.toString();
  return `#/book${s ? `?${s}` : ''}`;
}

export function teamCard(m, { detailed = false } = {}) {
  const next = nextAvailable({ memberId: m.id });
  return `<article class="member" data-reveal="stagger">
    <figure class="member__photo">${img(m.photo, { w: 600, ratio: 0.78, sizes: '(max-width: 700px) 50vw, 25vw' , altText: `Portrait used for ${m.name} (stock photo)` })}
      <span class="member__level">${m.level}</span>
    </figure>
    <div class="member__body">
      <h3>${esc(m.name)}</h3>
      <p class="member__role">${esc(m.role)}</p>
      ${detailed ? `<p class="member__bio">${esc(m.bio)}</p>` : ''}
      <ul class="tags">${m.specialties.map((s) => `<li>${esc(s)}</li>`).join('')}</ul>
      <p class="member__next">${icon('clock', 15)} ${next ? `Next free: <b>${relativeDay(next.iso)}, ${next.time}</b>` : 'Fully booked this week'}</p>
      <div class="member__actions">
        <a class="btn btn--small btn--dark" href="${bookLink({ member: m.id, cat: m.cats[0] })}">Book with ${esc(m.name.split(' ')[0])}</a>
        ${detailed ? '' : `<a class="link-arrow" href="#/team?m=${m.id}">Profile ${icon('arrow', 16)}</a>`}
      </div>
    </div>
  </article>`;
}

export function faqList(items) {
  return `<div class="faq__list">${items.map((f, i) => `<details class="faq__item" data-reveal="stagger" ${i === 0 ? 'open' : ''}>
    <summary><span>${esc(f.q)}</span><i class="faq__icon" aria-hidden="true"></i></summary>
    <div class="faq__answer"><p>${esc(f.a)}</p></div>
  </details>`).join('')}</div>`;
}

export function pageHead({ eyebrow, title, lead = '', photoKey }) {
  return `<header class="page-head ${photoKey ? 'page-head--photo' : ''}">
    <div class="container page-head__inner">
      <p class="eyebrow" data-reveal>${eyebrow}</p>
      <h1 class="display" data-reveal>${title}</h1>
      ${lead ? `<p class="page-head__lead" data-reveal>${lead}</p>` : ''}
    </div>
    ${photoKey ? `<figure class="page-head__img reveal-mask">${img(photoKey, { w: 1600, ratio: 2.6, eager: true, sizes: '100vw' })}</figure>` : ''}
  </header>`;
}
