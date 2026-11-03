// Shared UI: icons, toasts, modal, reveal-on-scroll, count-up, form helpers.

import { $, $$, esc, prefersReducedMotion } from '../lib/dom.js';

const P = {
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
  pin: '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0113 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  phone: '<path d="M6.6 3.5h2.6l1.5 4-2 1.3a11 11 0 006.5 6.5l1.3-2 4 1.5v2.6a2 2 0 01-2.2 2A16.5 16.5 0 014.6 5.7a2 2 0 012-2.2z"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20c1.4-3.6 4.2-5.4 7.5-5.4s6.1 1.8 7.5 5.4"/>',
  gift: '<rect x="3.5" y="9" width="17" height="11" rx="1.5"/><path d="M3.5 13h17M12 9v11M12 9c-1.5-3.5-5.5-4-5.5-1.5S10 9 12 9zm0 0c1.5-3.5 5.5-4 5.5-1.5S14 9 12 9z"/>',
  star: '<path d="M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M18 6l-2.5 2.5M8.5 15.5L6 18"/>',
  insta: '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".6"/>',
  mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
  drag: '<path d="M9 7l-5 5 5 5M15 7l5 5-5 5"/>',
};

export function icon(name, size = 20, cls = '') {
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[name] || ''}</svg>`;
}

/* ---------------- Toast ---------------- */

export function toast(message, { tone = 'info', timeout = 3800 } = {}) {
  let host = $('#toasts');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toasts';
    host.className = 'toasts';
    host.setAttribute('role', 'status');
    host.setAttribute('aria-live', 'polite');
    document.body.append(host);
  }
  const el = document.createElement('div');
  el.className = `toast toast--${tone}`;
  el.innerHTML = `${icon(tone === 'error' ? 'close' : 'check', 18)}<span>${esc(message)}</span>`;
  host.append(el);
  requestAnimationFrame(() => el.classList.add('is-in'));
  setTimeout(() => { el.classList.remove('is-in'); setTimeout(() => el.remove(), 400); }, timeout);
}

/* ---------------- Modal / drawer ---------------- */

let lastFocus = null;

export function openModal(markup, { label = 'Dialog', variant = 'center', onClose } = {}) {
  closeModal();
  lastFocus = document.activeElement;
  const wrap = document.createElement('div');
  wrap.className = `modal modal--${variant}`;
  wrap.innerHTML = `<div class="modal__backdrop" data-close></div>
    <div class="modal__panel" role="dialog" aria-modal="true" aria-label="${esc(label)}" tabindex="-1">
      <button class="modal__close icon-btn" data-close aria-label="Close">${icon('close')}</button>
      ${markup}
    </div>`;
  document.body.append(wrap);
  document.documentElement.classList.add('is-locked');
  const panel = $('.modal__panel', wrap);
  const close = () => { closeModal(); onClose?.(); };
  wrap.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) close(); });
  wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') trapFocus(e, panel);
  });
  requestAnimationFrame(() => { wrap.classList.add('is-open'); panel.focus(); });
  return { el: wrap, panel, close };
}

export function closeModal() {
  $$('.modal').forEach((m) => {
    m.classList.remove('is-open');
    setTimeout(() => m.remove(), 350);
  });
  document.documentElement.classList.remove('is-locked');
  if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  lastFocus = null;
}

export function trapFocus(e, root) {
  const items = $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', root)
    .filter((x) => x.offsetParent !== null);
  if (!items.length) return;
  const first = items[0];
  const last = items[items.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
}

/* ---------------- Reveal & count-up ---------------- */

let io;
export function observeReveal(root = document) {
  const items = $$('[data-reveal]:not(.is-visible), .reveal-mask:not(.is-visible)', root);
  if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }
  io ||= new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const t = entry.target;
      // Clip-path masks are invisible to IntersectionObserver, so their parent is watched instead.
      (t.__masks || []).forEach((m) => m.classList.add('is-visible'));
      if (t.matches('[data-reveal]')) {
        t.classList.add('is-visible');
        if (t.matches('[data-count]')) countUp(t);
        $$('[data-count]', t).forEach(countUp);
      }
      io.unobserve(t);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  items.forEach((el, i) => {
    if (el.classList.contains('reveal-mask')) {
      const parent = el.parentElement;
      (parent.__masks ||= []).push(el);
      io.observe(parent);
      return;
    }
    if (!el.style.getPropertyValue('--d') && el.dataset.reveal === 'stagger') el.style.setProperty('--d', `${(i % 6) * 70}ms`);
    io.observe(el);
  });
}

export function countUp(el) {
  if (el.dataset.counted) return;
  el.dataset.counted = '1';
  const target = parseFloat(el.dataset.count);
  const decimals = Number(el.dataset.decimals || 0);
  const suffix = el.dataset.suffix || '';
  if (prefersReducedMotion()) { el.textContent = target.toFixed(decimals) + suffix; return; }
  const start = performance.now();
  const dur = 1400;
  const tick = (now) => {
    const p = Math.min(1, (now - start) / dur);
    const eased = 1 - Math.pow(1 - p, 4);
    el.textContent = (target * eased).toFixed(decimals) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

/** Splits a heading into masked lines/words for the rise-in animation. */
export function splitWords(text) {
  return text.split(' ').map((w, i) => `<span class="w"><span style="--i:${i}">${w}</span></span>`).join(' ');
}

/* ---------------- Forms ---------------- */

export function field({ name, label, type = 'text', value = '', required = false, placeholder = '', autocomplete = '', hint = '', rows, inputmode, pattern }) {
  const id = `f-${name}-${Math.random().toString(36).slice(2, 6)}`;
  const common = `id="${id}" name="${name}" ${required ? 'required' : ''} ${placeholder ? `placeholder="${esc(placeholder)}"` : ''} ${autocomplete ? `autocomplete="${autocomplete}"` : ''} ${inputmode ? `inputmode="${inputmode}"` : ''} ${pattern ? `pattern="${pattern}"` : ''} aria-describedby="${id}-err"`;
  const control = rows
    ? `<textarea ${common} rows="${rows}">${esc(value)}</textarea>`
    : `<input type="${type}" ${common} value="${esc(value)}">`;
  return `<label class="field" for="${id}">
    <span class="field__label">${esc(label)}${required ? '' : ' <em>optional</em>'}</span>
    ${control}
    ${hint ? `<span class="field__hint">${esc(hint)}</span>` : ''}
    <span class="field__error" id="${id}-err"></span>
  </label>`;
}

const RULES = {
  name: (v) => (v.trim().length < 2 ? 'Please enter your name.' : ''),
  email: (v) => (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? 'Please enter a valid email.' : ''),
  phone: (v) => (v.replace(/\D/g, '').length < 7 ? 'Please enter a phone number we can text.' : ''),
};

/** Validates fields by name; shows messages; returns true when valid. */
export function validate(form, names) {
  let firstBad = null;
  names.forEach((n) => {
    const input = form.elements[n];
    if (!input) return;
    const rule = RULES[n.replace(/^(to|from)_?/, '')] || RULES[n];
    const required = input.required;
    let msg = '';
    if (required && !input.value.trim()) msg = 'This field is required.';
    else if (input.value.trim() && rule) msg = rule(input.value);
    const box = input.closest('.field');
    box?.classList.toggle('is-invalid', !!msg);
    input.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const err = box?.querySelector('.field__error');
    if (err) err.textContent = msg;
    if (msg && !firstBad) firstBad = input;
  });
  firstBad?.focus();
  return !firstBad;
}

export function setBusy(button, busy, label = 'Please wait…') {
  if (!button) return;
  if (busy) {
    button.dataset.label = button.innerHTML;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span>${label}`;
    button.disabled = true;
  } else {
    button.innerHTML = button.dataset.label || button.innerHTML;
    button.disabled = false;
  }
}
