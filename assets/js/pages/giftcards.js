// Gift card builder with a live preview.

import { $, $$, esc, on } from '../lib/dom.js';
import { SERVICES, serviceById } from '../data/services.js';
import { icon, field, validate, setBusy, toast, observeReveal } from '../components/ui.js';
import { buyGiftCard } from '../services/api.js';
import { money, isoDate, addDays, today, niceDate } from '../lib/format.js';
import { pageHead } from './common.js';
import { refresh } from '../router.js';

const AMOUNTS = [50, 100, 150, 250];
const DESIGNS = [
  { id: 'ivory', name: 'Ivory' },
  { id: 'espresso', name: 'Espresso' },
  { id: 'rose', name: 'Rosewood' },
];

export async function renderGiftCards() {
  const main = $('#main');
  const st = { mode: 'amount', amount: 150, custom: '', service: 's-signature', design: 'espresso', to: '', from: '', message: '', when: 'now', date: isoDate(addDays(today(), 1)) };

  main.innerHTML = pageHead({
    eyebrow: 'Gift cards',
    title: 'Give an hour <em>of quiet.</em>',
    lead: 'Choose an amount or a specific treatment, write a note and pick a design. Delivered by email — now or on the day you choose. Valid for 12 months.',
  }) + `<section class="gift container">
    <div class="gift__preview" aria-live="polite"><div class="gcard" id="gcard"></div><p class="fineprint">Preview updates as you type.</p></div>
    <form class="gift__form" id="giftForm" novalidate>
      <fieldset>
        <legend class="eyebrow">1 · What to give</legend>
        <div class="seg" role="radiogroup" aria-label="Gift type">
          <button type="button" role="radio" data-mode="amount">An amount</button>
          <button type="button" role="radio" data-mode="service">A treatment</button>
        </div>
        <div id="giftValue"></div>
      </fieldset>
      <fieldset>
        <legend class="eyebrow">2 · Design</legend>
        <div class="designs">${DESIGNS.map((d) => `<button type="button" class="design design--${d.id}" data-design="${d.id}" aria-pressed="false"><i></i>${d.name}</button>`).join('')}</div>
      </fieldset>
      <fieldset>
        <legend class="eyebrow">3 · Personal note</legend>
        <div class="form-row">${field({ name: 'to', label: 'To', required: true, placeholder: 'Their name' })}${field({ name: 'from', label: 'From', required: true, placeholder: 'Your name' })}</div>
        <label class="field"><span class="field__label">Message <em>optional</em></span><textarea name="message" rows="3" maxlength="160" placeholder="Happy birthday — book something slow."></textarea><span class="field__hint"><span id="msgCount">0</span>/160</span></label>
      </fieldset>
      <fieldset>
        <legend class="eyebrow">4 · Delivery</legend>
        ${field({ name: 'email', label: 'Recipient’s email', type: 'email', required: true, autocomplete: 'off' })}
        <div class="seg" role="radiogroup" aria-label="When to send">
          <button type="button" role="radio" data-when="now">Send now</button>
          <button type="button" role="radio" data-when="later">Choose a date</button>
        </div>
        <label class="field" id="dateField" hidden><span class="field__label">Delivery date</span><input type="date" name="date" min="${isoDate(addDays(today(), 1))}" max="${isoDate(addDays(today(), 365))}" value="${st.date}"></label>
      </fieldset>
      <div class="gift__total"><span>Total</span><b id="giftTotal"></b></div>
      <button class="btn btn--dark btn--wide" type="submit">Buy gift card (test mode) ${icon('gift', 18)}</button>
      <p class="fineprint">Demo: no payment is taken and no email is sent.</p>
    </form>
  </section>`;

  const form = $('#giftForm', main);
  const value = () => (st.mode === 'service' ? serviceById(st.service).price : Number(st.custom) || st.amount);

  const paintValue = () => {
    $('#giftValue', main).innerHTML = st.mode === 'amount'
      ? `<div class="amounts">${AMOUNTS.map((a) => `<button type="button" class="amount ${!st.custom && st.amount === a ? 'is-active' : ''}" data-amount="${a}">${money(a)}</button>`).join('')}
         <label class="amount amount--custom ${st.custom ? 'is-active' : ''}"><span>$</span><input type="number" min="25" max="1000" step="5" placeholder="Other" value="${esc(st.custom)}" aria-label="Custom amount, 25 to 1000 dollars" id="customAmt"></label></div>`
      : `<label class="field"><span class="field__label">Treatment</span><select id="giftService">${SERVICES.filter((s) => s.price >= 40).map((s) => `<option value="${s.id}" ${s.id === st.service ? 'selected' : ''}>${esc(s.name)} — ${money(s.price)}</option>`).join('')}</select></label>`;
  };

  const paintCard = () => {
    const what = st.mode === 'service' ? esc(serviceById(st.service).name) : 'Gift card';
    $('#gcard', main).className = `gcard gcard--${st.design}`;
    $('#gcard', main).innerHTML = `<div class="gcard__top"><span class="gcard__brand">Beauty <i>Example</i></span><span class="gcard__value">${money(value())}</span></div>
      <div class="gcard__mid"><span class="gcard__what">${what}</span>${st.message ? `<p class="gcard__msg">“${esc(st.message)}”</p>` : ''}</div>
      <div class="gcard__bottom"><span>For <b>${esc(st.to) || '—'}</b></span><span>From <b>${esc(st.from) || '—'}</b></span></div>
      <svg class="gcard__orn" viewBox="0 0 200 200" aria-hidden="true"><circle cx="100" cy="100" r="90"/><circle cx="100" cy="100" r="70"/><path d="M100 10v180M10 100h180"/></svg>`;
    $('#giftTotal', main).textContent = money(value());
    $$('[data-mode]', main).forEach((b) => { b.classList.toggle('is-active', b.dataset.mode === st.mode); b.setAttribute('aria-checked', String(b.dataset.mode === st.mode)); });
    $$('[data-design]', main).forEach((b) => { b.classList.toggle('is-active', b.dataset.design === st.design); b.setAttribute('aria-pressed', String(b.dataset.design === st.design)); });
    $$('[data-when]', main).forEach((b) => { b.classList.toggle('is-active', b.dataset.when === st.when); b.setAttribute('aria-checked', String(b.dataset.when === st.when)); });
    $('#dateField', main).hidden = st.when !== 'later';
  };

  on(main, 'click', '[data-mode]', (_, b) => { st.mode = b.dataset.mode; paintValue(); paintCard(); });
  on(main, 'click', '[data-amount]', (_, b) => { st.amount = Number(b.dataset.amount); st.custom = ''; paintValue(); paintCard(); });
  on(main, 'input', '#customAmt', (e) => { st.custom = e.target.value; $$('.amount', main).forEach((x) => x.classList.toggle('is-active', x.classList.contains('amount--custom') ? !!st.custom : !st.custom && Number(x.dataset.amount) === st.amount)); paintCard(); });
  on(main, 'change', '#giftService', (e) => { st.service = e.target.value; paintCard(); });
  on(main, 'click', '[data-design]', (_, b) => { st.design = b.dataset.design; paintCard(); });
  on(main, 'click', '[data-when]', (_, b) => { st.when = b.dataset.when; paintCard(); });
  form.addEventListener('input', (e) => {
    if (['to', 'from', 'message'].includes(e.target.name)) {
      st[e.target.name] = e.target.value;
      if (e.target.name === 'message') $('#msgCount', main).textContent = e.target.value.length;
      paintCard();
    }
    if (e.target.name === 'date') st.date = e.target.value;
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (st.mode === 'amount' && st.custom && (Number(st.custom) < 25 || Number(st.custom) > 1000)) {
      toast('Custom amounts can be from $25 to $1,000.', { tone: 'error' });
      $('#customAmt', main).focus();
      return;
    }
    if (!validate(form, ['to', 'from', 'email'])) return;
    const btn = $('button[type=submit]', form);
    setBusy(btn, true, 'Processing…');
    const card = await buyGiftCard({ value: value(), mode: st.mode, service: st.mode === 'service' ? st.service : null, design: st.design, to: st.to, from: st.from, message: st.message, email: form.elements.email.value.trim(), sendOn: st.when === 'now' ? isoDate(today()) : st.date });
    setBusy(btn, false);
    form.closest('.gift').innerHTML = `<div class="gift__done">
      <div class="gcard gcard--${card.design}">${$('#gcard', main).innerHTML}<div class="gcard__code">${card.code}</div></div>
      <div>
        <p class="eyebrow">Gift card ready · test mode</p>
        <h2 class="display">A lovely thing <em>to give.</em></h2>
        <p>${card.sendOn === isoDate(today()) ? `It would be emailed to <b>${esc(card.email)}</b> right away.` : `It would be emailed to <b>${esc(card.email)}</b> on ${niceDate(card.sendOn, { weekday: 'long', day: 'numeric', month: 'long' })}.`} The code works for 12 months, for any service or product.</p>
        <div class="confirm__actions"><button class="btn btn--dark" onclick="window.print()">Print it instead</button><a class="btn btn--line" href="#/gift-cards" data-again>Create another</a></div>
      </div>
    </div>`;
    on(main, 'click', '[data-again]', (ev) => { ev.preventDefault(); refresh(); });
    scrollTo({ top: 0, behavior: 'smooth' });
  });

  paintValue();
  paintCard();
  observeReveal(main);
}
