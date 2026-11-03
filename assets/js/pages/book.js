// Online booking: service → specialist → date & time → details → confirmation.

import { $, $$, esc, on } from '../lib/dom.js';
import { CATEGORIES, SERVICES, serviceById, categoryById, servicesIn } from '../data/services.js';
import { memberById, teamFor } from '../data/team.js';
import { SALON } from '../data/site.js';
import { img, photo } from '../data/images.js';
import { icon, field, validate, setBusy, toast, observeReveal } from '../components/ui.js';
import { slotsFor, quote, createBooking, nextAvailable, works, hoursOn, BOOKING_HORIZON } from '../services/api.js';
import { money, duration, isoDate, parseISO, addDays, today, niceDate, relativeDay, toMin, hm } from '../lib/format.js';
import { replaceQuery } from '../router.js';
import { store } from '../store.js';

const STEPS = ['Service', 'Specialist', 'Date & time', 'Your details'];

export function icsFor(b) {
  const s = serviceById(b.serviceId);
  const d = parseISO(b.date);
  const start = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, toMin(b.time));
  const end = new Date(start.getTime() + b.duration * 60000);
  const f = (x) => x.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Beauty Example//Booking//EN', 'BEGIN:VEVENT',
    `UID:${b.id}@beauty-example.test`, `DTSTAMP:${f(new Date())}`, `DTSTART:${f(start)}`, `DTEND:${f(end)}`,
    `SUMMARY:${s.name} — Beauty Example`, `LOCATION:${SALON.address}`,
    `DESCRIPTION:Booking ${b.id} with ${memberById(b.memberId)?.name || 'our team'}. Free changes until 24 hours before.`,
    'END:VEVENT', 'END:VCALENDAR'].join('\r\n');
}

export function downloadIcs(b) {
  const blob = new Blob([icsFor(b)], { type: 'text/calendar' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `beauty-example-${b.id}.ics`;
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
}

export async function renderBook({ query, scope }) {
  const main = $('#main');
  const firstService = serviceById(query.service);
  const st = {
    cat: firstService?.cat || (categoryById(query.cat) ? query.cat : (memberById(query.member)?.cats[0] || 'hair')),
    serviceId: firstService?.id || '',
    addons: (query.addons || '').split(',').filter((id) => serviceById(id) && id !== query.service),
    memberId: memberById(query.member) ? query.member : 'any',
    date: query.date || '',
    time: query.time || '',
    month: null,
    promo: '',
    step: 0,
  };
  if (st.memberId !== 'any' && !memberById(st.memberId).cats.includes(st.cat)) st.memberId = 'any';
  if (st.serviceId) st.step = st.memberId !== 'any' || query.date ? 2 : 1;
  const draft = store.get('guest', {});

  main.innerHTML = `<section class="booking container">
    <div class="booking__head">
      <p class="eyebrow">Online booking</p>
      <h1 class="display">Book <em>your visit.</em></h1>
      <ol class="stepper" id="stepper">${STEPS.map((s, i) => `<li data-step-ind="${i}"><span>${i + 1}</span>${s}</li>`).join('')}</ol>
    </div>
    <div class="booking__grid">
      <div class="booking__steps" id="steps"></div>
      <aside class="summary" id="summary" aria-label="Your booking"></aside>
    </div>
  </section>`;

  const stepsEl = $('#steps', main);
  const summaryEl = $('#summary', main);
  const minutes = () => quote(st).minutes;
  const service = () => serviceById(st.serviceId);

  const validTime = () => {
    if (!st.date || !st.time || !st.serviceId) return false;
    return slotsFor({ serviceId: st.serviceId, memberId: st.memberId, iso: st.date, minutes: minutes() }).some((s) => s.time === st.time);
  };
  if (st.time && !validTime()) st.time = '';
  if (st.serviceId && st.date && st.time) st.step = 3;

  /* ---------- Step bodies ---------- */

  const stepService = () => {
    const extras = servicesIn(st.cat).filter((s) => s.id !== st.serviceId && s.duration <= 60 && s.price > 0 && s.price <= 80);
    return `<div class="chips" role="tablist" aria-label="Discipline">${CATEGORIES.map((c) => `<button class="chip ${c.id === st.cat ? 'is-active' : ''}" data-bcat="${c.id}" aria-selected="${c.id === st.cat}">${c.name}</button>`).join('')}</div>
      <div class="options" role="radiogroup" aria-label="Service">
        ${servicesIn(st.cat).map((s) => `<button class="option ${s.id === st.serviceId ? 'is-selected' : ''}" role="radio" aria-checked="${s.id === st.serviceId}" data-service="${s.id}">
          <span class="option__radio" aria-hidden="true"></span>
          <span class="option__main"><b>${esc(s.name)}</b><small>${esc(s.desc)}</small></span>
          <span class="option__side"><b>${money(s.price)}</b><small>${duration(s.duration)}</small></span>
        </button>`).join('')}
      </div>
      ${st.serviceId && extras.length ? `<div class="addons"><p class="eyebrow">Add to the same appointment</p>
        ${extras.map((s) => `<label class="addon"><input type="checkbox" data-addon="${s.id}" ${st.addons.includes(s.id) ? 'checked' : ''}><span class="addon__box" aria-hidden="true">${icon('check', 14)}</span><span>${esc(s.name)}</span><small>+${duration(s.duration)} · +${money(s.price)}</small></label>`).join('')}
      </div>` : ''}
      <div class="step__foot"><button class="btn btn--dark" data-next ${st.serviceId ? '' : 'disabled'}>Continue ${icon('arrow', 18)}</button></div>`;
  };

  const stepMember = () => {
    const people = teamFor(st.cat);
    const anyNext = nextAvailable({ serviceId: st.serviceId });
    return `<div class="options options--people" role="radiogroup" aria-label="Specialist">
        <button class="person ${st.memberId === 'any' ? 'is-selected' : ''}" role="radio" aria-checked="${st.memberId === 'any'}" data-member="any">
          <span class="person__any" aria-hidden="true">${icon('sparkle', 26)}</span>
          <span class="person__main"><b>First available</b><small>${anyNext ? `Earliest: ${relativeDay(anyNext.iso)}, ${anyNext.time}` : 'We’ll match you'}</small></span>
        </button>
        ${people.map((m) => {
          const n = nextAvailable({ memberId: m.id, serviceId: st.serviceId });
          return `<button class="person ${st.memberId === m.id ? 'is-selected' : ''}" role="radio" aria-checked="${st.memberId === m.id}" data-member="${m.id}">
            <span class="person__photo">${img(m.photo, { w: 160, ratio: 1, sizes: '64px', altText: '' })}</span>
            <span class="person__main"><b>${esc(m.name)}</b><small>${esc(m.role)}</small><small class="person__next">${n ? `${icon('clock', 13)} ${relativeDay(n.iso)}, ${n.time}` : 'Fully booked this week'}</small></span>
          </button>`;
        }).join('')}
      </div>
      <div class="step__foot"><button class="btn btn--dark" data-next>Continue ${icon('arrow', 18)}</button></div>`;
  };

  const calendar = () => {
    const first = today();
    const last = addDays(first, BOOKING_HORIZON);
    const base = st.month || (st.date ? parseISO(st.date) : first);
    const y = base.getFullYear();
    const mo = base.getMonth();
    const start = new Date(y, mo, 1);
    const offset = (start.getDay() + 6) % 7; // Monday first
    const daysIn = new Date(y, mo + 1, 0).getDate();
    const cells = [];
    for (let i = 0; i < offset; i++) cells.push('<span></span>');
    for (let d = 1; d <= daysIn; d++) {
      const date = new Date(y, mo, d);
      const iso = isoDate(date);
      let cls = '';
      let label = niceDate(iso, { weekday: 'long', day: 'numeric', month: 'long' });
      let disabled = false;
      let level = 0;
      if (date < first || date > last) { disabled = true; cls = 'is-out'; }
      else if (!hoursOn(iso)) { disabled = true; cls = 'is-closed'; label += ', salon closed'; }
      else if (st.memberId !== 'any' && !works(memberById(st.memberId), iso)) { disabled = true; cls = 'is-closed'; label += ', day off'; }
      else {
        const n = slotsFor({ serviceId: st.serviceId, memberId: st.memberId, iso, minutes: minutes() }).length;
        if (!n) { disabled = true; cls = 'is-full'; label += ', fully booked'; }
        else { level = n > 18 ? 3 : n > 8 ? 2 : 1; label += `, ${n} free times`; }
      }
      cells.push(`<button class="day ${cls} ${iso === st.date ? 'is-selected' : ''} ${iso === isoDate(first) ? 'is-today' : ''}" data-day="${iso}" ${disabled ? 'disabled' : ''} aria-label="${label}" aria-pressed="${iso === st.date}"><span>${d}</span>${level ? `<i class="lvl lvl--${level}" aria-hidden="true"></i>` : ''}</button>`);
    }
    const canPrev = new Date(y, mo, 1) > new Date(first.getFullYear(), first.getMonth(), 1);
    const canNext = new Date(y, mo + 1, 1) <= last;
    return `<div class="cal">
      <div class="cal__head">
        <button class="icon-btn" data-month="-1" ${canPrev ? '' : 'disabled'} aria-label="Previous month">${icon('back', 18)}</button>
        <b>${start.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</b>
        <button class="icon-btn" data-month="1" ${canNext ? '' : 'disabled'} aria-label="Next month">${icon('arrow', 18)}</button>
      </div>
      <div class="cal__dow" aria-hidden="true">${['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => `<span>${d}</span>`).join('')}</div>
      <div class="cal__grid">${cells.join('')}</div>
      <p class="cal__legend"><span><i class="lvl lvl--3"></i>Plenty</span><span><i class="lvl lvl--1"></i>Few left</span><span><i class="x"></i>Full / closed</span></p>
    </div>`;
  };

  const slotsMarkup = () => {
    if (!st.date) return `<div class="slots slots--empty"><p>${icon('calendar', 18)} Pick a day to see free times.</p></div>`;
    const slots = slotsFor({ serviceId: st.serviceId, memberId: st.memberId, iso: st.date, minutes: minutes() });
    const groups = [['Morning', 0, 720], ['Afternoon', 720, 1020], ['Evening', 1020, 1440]];
    return `<div class="slots"><p class="slots__title"><b>${relativeDay(st.date)}</b> · ${niceDate(st.date, { day: 'numeric', month: 'long' })}</p>
      ${groups.map(([name, a, b]) => {
        const g = slots.filter((s) => toMin(s.time) >= a && toMin(s.time) < b);
        if (!g.length) return '';
        return `<div class="slots__group"><span class="slots__label">${name}</span><div class="slots__grid">${g.map((s) => `<button class="slot ${s.time === st.time ? 'is-selected' : ''}" data-time="${s.time}" aria-pressed="${s.time === st.time}">${s.time}</button>`).join('')}</div></div>`;
      }).join('')}
      <p class="slots__end">${icon('clock', 14)} Ends around ${st.time ? hm(toMin(st.time) + minutes()) : '—'} · ${duration(minutes())} in total</p>
    </div>`;
  };

  const stepTime = () => `<div class="when">${calendar()}${slotsMarkup()}</div>
    <div class="step__foot"><button class="btn btn--dark" data-next ${st.time ? '' : 'disabled'}>Continue ${icon('arrow', 18)}</button></div>`;

  const stepDetails = () => `<form id="detailsForm" class="details" novalidate>
      <div class="form-row">${field({ name: 'name', label: 'Full name', required: true, autocomplete: 'name', value: draft.name || '' })}${field({ name: 'phone', label: 'Mobile', type: 'tel', required: true, autocomplete: 'tel', inputmode: 'tel', value: draft.phone || '', hint: 'For the reminder the day before' })}</div>
      ${field({ name: 'email', label: 'Email', type: 'email', required: true, autocomplete: 'email', value: draft.email || '' })}
      ${field({ name: 'notes', label: 'Anything we should know?', rows: 3, placeholder: 'Allergies, hair history, a photo you’ll bring…', value: '' })}
      <fieldset class="reminder"><legend class="field__label">Reminder</legend>
        <label><input type="radio" name="reminder" value="sms" checked> Text message</label>
        <label><input type="radio" name="reminder" value="email"> Email</label>
        <label><input type="radio" name="reminder" value="none"> No reminder</label>
      </fieldset>
      <label class="check"><input type="checkbox" name="policy" required><span class="addon__box" aria-hidden="true">${icon('check', 14)}</span><span>I understand changes are free until 24 hours before; later cancellations are charged at 50%.</span></label>
      <span class="field__error" id="policyErr"></span>
      <div class="step__foot"><button class="btn btn--dark btn--wide" type="submit">Confirm booking ${icon('check', 18)}</button></div>
      <p class="fineprint">Demo site: no payment is taken and no message is sent. Your booking is saved only in this browser.</p>
    </form>`;

  const done = (i) => {
    if (i === 0) return service() ? `${esc(service().name)}${st.addons.length ? ` + ${st.addons.length} add-on${st.addons.length > 1 ? 's' : ''}` : ''}` : '';
    if (i === 1) return st.memberId === 'any' ? 'First available' : esc(memberById(st.memberId).name);
    if (i === 2) return st.time ? `${relativeDay(st.date)}, ${niceDate(st.date, { day: 'numeric', month: 'short' })} · ${st.time}` : '';
    return '';
  };

  const paintSteps = () => {
    const bodies = [stepService, stepMember, stepTime, stepDetails];
    stepsEl.innerHTML = STEPS.map((name, i) => {
      const state = i === st.step ? 'is-current' : i < st.step ? 'is-done' : 'is-locked';
      return `<section class="step ${state}" aria-labelledby="sh-${i}">
        <header class="step__head">
          <span class="step__num">${i < st.step ? icon('check', 16) : i + 1}</span>
          <h2 id="sh-${i}">${name}</h2>
          ${i < st.step ? `<span class="step__value">${done(i)}</span><button class="step__edit" data-goto="${i}" aria-label="Change ${name.toLowerCase()}">Change</button>` : ''}
        </header>
        ${i === st.step ? `<div class="step__body">${bodies[i]()}</div>` : ''}
      </section>`;
    }).join('');
    $$('[data-step-ind]', main).forEach((li) => {
      const i = Number(li.dataset.stepInd);
      li.className = i === st.step ? 'is-current' : i < st.step ? 'is-done' : '';
    });
    if (st.step === 3) wireDetails();
  };

  const paintSummary = () => {
    const q = quote(st);
    const s = service();
    const m = st.memberId === 'any' ? null : memberById(st.memberId);
    summaryEl.innerHTML = `<div class="summary__card">
      <figure class="summary__img">${s ? `<img src="${photo(categoryById(s.cat).photo, 700, 360)}" alt="">` : ''}<figcaption>${s ? categoryById(s.cat).name : 'Your visit'}</figcaption></figure>
      <div class="summary__body">
        <p class="eyebrow">Your visit</p>
        ${s ? `<ul class="summary__items">${q.items.map((x) => `<li><span>${esc(x.name)}</span><span>${money(x.price)}</span></li>`).join('')}</ul>` : '<p class="muted">Choose a service to start.</p>'}
        <dl class="summary__meta">
          <div><dt>${icon('user', 15)} Specialist</dt><dd>${m ? esc(m.name) : 'First available'}</dd></div>
          <div><dt>${icon('calendar', 15)} When</dt><dd>${st.time ? `${niceDate(st.date)} · ${st.time}` : '—'}</dd></div>
          <div><dt>${icon('clock', 15)} Duration</dt><dd>${q.minutes ? duration(q.minutes) : '—'}</dd></div>
        </dl>
        <form class="promo" id="promoForm">
          <label for="promo" class="sr-only">Promo code</label>
          <input id="promo" placeholder="Promo code" value="${esc(st.promo)}" autocomplete="off">
          <button class="btn btn--small btn--line" type="submit">Apply</button>
        </form>
        ${q.promoError ? `<p class="promo__msg is-error">${q.promoError}</p>` : q.discount ? `<p class="promo__msg">${icon('check', 14)} ${q.promo}: −${money(q.discount)}</p>` : `<p class="promo__msg muted">First visit? Try ${SALON.firstVisit.code}.</p>`}
        <div class="summary__total"><span>Total, paid at the salon</span><b>${money(q.total)}</b></div>
      </div>
    </div>`;
  };

  const paint = () => {
    paintSteps();
    paintSummary();
    replaceQuery({ service: st.serviceId, addons: st.addons.join(','), member: st.memberId === 'any' ? '' : st.memberId, date: st.date, time: st.time, cat: st.serviceId ? '' : st.cat });
  };

  const go = (i) => {
    st.step = i;
    paint();
    const cur = $('.step.is-current', stepsEl);
    if (cur && cur.getBoundingClientRect().top < 80) cur.scrollIntoView({ behavior: 'smooth', block: 'start' });
    $('.step.is-current h2', stepsEl)?.setAttribute('tabindex', '-1');
    $('.step.is-current h2', stepsEl)?.focus({ preventScroll: true });
  };

  const revalidate = () => { if (st.time && !validTime()) { st.time = ''; if (st.step > 2) st.step = 2; } };

  on(main, 'click', '[data-bcat]', (_, b) => { st.cat = b.dataset.bcat; st.serviceId = ''; st.addons = []; if (st.memberId !== 'any' && !memberById(st.memberId).cats.includes(st.cat)) st.memberId = 'any'; paint(); });
  on(main, 'click', '[data-service]', (_, b) => { st.serviceId = b.dataset.service; st.addons = st.addons.filter((a) => a !== st.serviceId); revalidate(); paint(); });
  on(main, 'change', '[data-addon]', (_, inp) => {
    st.addons = inp.checked ? [...st.addons, inp.dataset.addon] : st.addons.filter((a) => a !== inp.dataset.addon);
    revalidate();
    paintSummary();
  });
  on(main, 'click', '[data-member]', (_, b) => { st.memberId = b.dataset.member; revalidate(); if (st.date && st.memberId !== 'any' && !works(memberById(st.memberId), st.date)) { st.date = ''; st.time = ''; } paint(); });
  on(main, 'click', '[data-month]', (_, b) => {
    const base = st.month || (st.date ? parseISO(st.date) : today());
    st.month = new Date(base.getFullYear(), base.getMonth() + Number(b.dataset.month), 1);
    paintSteps();
  });
  on(main, 'click', '[data-day]', (_, b) => { st.date = b.dataset.day; st.time = ''; paintSteps(); paintSummary(); $('.slots', stepsEl)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); });
  on(main, 'click', '[data-time]', (_, b) => { st.time = b.dataset.time; paintSteps(); paintSummary(); $('[data-next]', stepsEl)?.focus({ preventScroll: true }); });
  on(main, 'click', '[data-next]', () => {
    if (st.step === 1 && !st.date) {
      // jump the calendar to the first day with space
      const n = nextAvailable({ memberId: st.memberId === 'any' ? undefined : st.memberId, serviceId: st.serviceId });
      if (n) st.month = parseISO(n.iso);
    }
    go(Math.min(3, st.step + 1));
  });
  on(main, 'click', '[data-goto]', (_, b) => go(Number(b.dataset.goto)));
  on(main, 'submit', '#promoForm', (e) => { e.preventDefault(); st.promo = $('#promo', main).value; paintSummary(); const q = quote(st); if (q.discount) toast(`Code applied: −${money(q.discount)}`); });

  function wireDetails() {
    const form = $('#detailsForm', main);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const ok = validate(form, ['name', 'phone', 'email']);
      const policy = form.elements.policy;
      $('#policyErr', main).textContent = policy.checked ? '' : 'Please confirm the cancellation policy.';
      if (!ok) return;
      if (!policy.checked) { policy.focus(); return; }
      const btn = $('button[type=submit]', form);
      setBusy(btn, true, 'Confirming…');
      const guest = { name: form.elements.name.value.trim(), phone: form.elements.phone.value.trim(), email: form.elements.email.value.trim() };
      store.set('guest', guest);
      try {
        const q = quote(st);
        const booking = await createBooking({ ...st, ...guest, notes: form.elements.notes.value.trim(), reminder: form.elements.reminder.value, promo: q.promo });
        dispatchEvent(new Event('bookings:changed'));
        confirmation(booking);
      } catch (err) {
        setBusy(btn, false);
        toast(err.message, { tone: 'error' });
        st.time = '';
        go(2);
      }
    });
  }

  function confirmation(b) {
    const s = serviceById(b.serviceId);
    const m = memberById(b.memberId);
    main.innerHTML = `<section class="confirm container">
      <div class="confirm__mark" aria-hidden="true"><svg viewBox="0 0 80 80"><circle cx="40" cy="40" r="37"/><path d="M24 41l11 11 22-24"/></svg></div>
      <p class="eyebrow">Booking confirmed · ${b.id}</p>
      <h1 class="display">See you <em>${{ Today: 'later today', Tomorrow: 'tomorrow' }[relativeDay(b.date)] || `on ${relativeDay(b.date)}`}</em>, ${esc(b.guest.name.split(' ')[0])}.</h1>
      <div class="confirm__card">
        <div><small>Service</small><b>${esc(s.name)}${b.addons.length ? ` + ${b.addons.map((a) => esc(serviceById(a).name)).join(', ')}` : ''}</b></div>
        <div><small>Specialist</small><b>${esc(m.name)}</b></div>
        <div><small>When</small><b>${niceDate(b.date, { weekday: 'long', day: 'numeric', month: 'long' })} · ${b.time}–${hm(toMin(b.time) + b.duration)}</b></div>
        <div><small>Where</small><b>${esc(SALON.address)}</b></div>
        <div><small>Total</small><b>${money(b.total)}${b.discount ? ` <span class="muted">(−${money(b.discount)})</span>` : ''}</b></div>
      </div>
      <div class="confirm__actions">
        <button class="btn btn--dark" id="icsBtn">${icon('calendar', 18)} Add to calendar</button>
        <a class="btn btn--line" href="#/visits">My visits</a>
        <a class="link-arrow" href="#/">Back to home ${icon('arrow', 16)}</a>
      </div>
      <p class="fineprint">Arrive ten minutes early for tea and a short consultation. Free changes until ${niceDate(isoDate(addDays(parseISO(b.date), -1)), { weekday: 'long' })} at ${b.time}.</p>
    </section>`;
    $('#icsBtn', main).addEventListener('click', () => downloadIcs(b));
    scrollTo({ top: 0 });
  }

  paint();
  observeReveal(main);
}
