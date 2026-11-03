// My visits, photo credits and 404.

import { $, esc, on } from '../lib/dom.js';
import { serviceById } from '../data/services.js';
import { memberById } from '../data/team.js';
import { PHOTOS } from '../data/images.js';
import { icon, openModal, closeModal, toast, observeReveal, setBusy } from '../components/ui.js';
import { bookings, cancelBooking, isPast, canCancelFree } from '../services/api.js';
import { money, niceDate, relativeDay, toMin, hm } from '../lib/format.js';
import { store } from '../store.js';
import { pageHead, bookLink } from './common.js';
import { downloadIcs } from './book.js';

function visitCard(b) {
  const s = serviceById(b.serviceId);
  const m = memberById(b.memberId);
  const past = isPast(b);
  const status = b.status === 'cancelled' ? 'Cancelled' : past ? 'Completed' : relativeDay(b.date);
  return `<article class="visit-card ${b.status === 'cancelled' ? 'is-cancelled' : ''}" data-reveal="stagger">
    <div class="visit-card__date"><b>${niceDate(b.date, { day: 'numeric' })}</b><span>${niceDate(b.date, { month: 'short' })}</span></div>
    <div class="visit-card__main">
      <p class="eyebrow">${status} · ${b.id}</p>
      <h3>${esc(s.name)}${b.addons.length ? ` <small>+ ${b.addons.map((a) => esc(serviceById(a).name)).join(', ')}</small>` : ''}</h3>
      <p>${b.time}–${hm(toMin(b.time) + b.duration)} · with ${esc(m.name)} · ${money(b.total)}</p>
    </div>
    <div class="visit-card__actions">
      ${b.status === 'confirmed' && !past ? `<button class="btn btn--small btn--line" data-ics="${b.id}">${icon('calendar', 16)} Calendar</button><button class="btn btn--small btn--ghost" data-cancel="${b.id}">Cancel</button>` : ''}
      ${past || b.status === 'cancelled' ? `<a class="btn btn--small btn--dark" href="${bookLink({ service: b.serviceId, member: b.memberId })}">Book again</a>` : ''}
    </div>
  </article>`;
}

export async function renderVisits() {
  const main = $('#main');
  const paint = () => {
    const all = bookings().slice().sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    const upcoming = all.filter((b) => b.status === 'confirmed' && !isPast(b));
    const history = all.filter((b) => !(b.status === 'confirmed' && !isPast(b))).reverse();
    const cards = store.get('giftcards', []);
    main.innerHTML = pageHead({ eyebrow: 'My visits', title: 'Your <em>appointments.</em>', lead: 'Bookings made in this browser. Change or cancel free of charge until 24 hours before.' })
      + `<section class="container visits">
        ${upcoming.length ? `<h2 class="visits__h">Upcoming</h2>${upcoming.map(visitCard).join('')}` : `<div class="empty"><p class="display">Nothing booked <em>yet.</em></p><a class="btn btn--dark" href="#/book">Book a visit ${icon('arrow', 18)}</a></div>`}
        ${history.length ? `<h2 class="visits__h">History</h2>${history.map(visitCard).join('')}` : ''}
        ${cards.length ? `<h2 class="visits__h">Gift cards you created</h2><ul class="gift-list">${cards.map((c) => `<li><b>${c.code}</b><span>${money(c.value)} for ${esc(c.to)}</span><span class="muted">test mode</span></li>`).join('')}</ul>` : ''}
      </section>`;
    observeReveal(main);
  };
  on(main, 'click', '[data-ics]', (_, b) => downloadIcs(bookings().find((x) => x.id === b.dataset.ics)));
  on(main, 'click', '[data-cancel]', (_, btn) => {
    const b = bookings().find((x) => x.id === btn.dataset.cancel);
    const free = canCancelFree(b);
    const m = openModal(`<div class="dialog">
      <p class="eyebrow">Cancel ${b.id}</p>
      <h2 class="display">Cancel <em>${esc(serviceById(b.serviceId).name)}?</em></h2>
      <p>${free ? 'This is free — you are more than 24 hours ahead.' : `It is less than 24 hours before your visit, so a 50% fee (${money(Math.round(b.total / 2))}) would apply. In this demo nothing is charged.`}</p>
      <div class="confirm__actions"><button class="btn btn--dark" data-yes>Yes, cancel</button><button class="btn btn--line" data-close>Keep it</button></div>
    </div>`, { label: 'Cancel booking' });
    $('[data-yes]', m.panel).addEventListener('click', async (e) => {
      setBusy(e.currentTarget, true, 'Cancelling…');
      await cancelBooking(b.id);
      closeModal();
      dispatchEvent(new Event('bookings:changed'));
      toast('Your booking was cancelled.');
      paint();
    });
  });
  paint();
}

export async function renderCredits() {
  const main = $('#main');
  main.innerHTML = pageHead({ eyebrow: 'Photo credits', title: 'Thank you, <em>photographers.</em>', lead: 'All photos are from Unsplash and used under the free Unsplash License. None were taken from the salon websites studied for this project.' })
    + `<section class="container credits"><ul>${Object.values(PHOTOS).map((p) => `<li><span>${esc(p.alt)}</span><a href="https://unsplash.com/photos/${p.page}" target="_blank" rel="noopener">Photo by ${esc(p.by)} on Unsplash</a></li>`).join('')}</ul></section>`;
}

export async function renderNotFound() {
  $('#main').innerHTML = `<section class="notfound container">
    <p class="eyebrow">404</p>
    <h1 class="display">This page took <em>a day off.</em></h1>
    <p>The link may be old, or the page has moved.</p>
    <div class="confirm__actions"><a class="btn btn--dark" href="#/">Home</a><a class="btn btn--line" href="#/services">Services & prices</a></div>
  </section>`;
}
