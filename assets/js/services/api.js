// Demo API. Every page talks to data only through these functions, which are
// async and return server-shaped objects — swap the bodies for fetch() calls
// to a real booking backend and nothing else has to change.

import { store } from '../store.js';
import { rng } from '../lib/rand.js';
import { isoDate, parseISO, today, addDays, toMin, hm } from '../lib/format.js';
import { sleep } from '../lib/dom.js';
import { SALON } from '../data/site.js';
import { SERVICES, serviceById } from '../data/services.js';
import { TEAM, memberById, teamFor } from '../data/team.js';

const STEP = 15;          // slot grid in minutes
const LEAD = 60;          // earliest booking: one hour from now
export const HORIZON = 42; // days ahead you can book

/* ---------------- Opening hours ---------------- */

export function hoursOn(iso) {
  return SALON.hours[parseISO(iso).getDay()];
}

export function openStatus(now = new Date()) {
  const h = SALON.hours[now.getDay()];
  const mins = now.getHours() * 60 + now.getMinutes();
  if (h && mins >= h[0] * 60 && mins < h[1] * 60) {
    return { open: true, text: `Open now · until ${hm(h[1] * 60)}` };
  }
  for (let i = 0; i < 8; i++) {
    const d = addDays(today(), i);
    const hh = SALON.hours[d.getDay()];
    if (!hh) continue;
    if (i === 0 && mins >= hh[0] * 60) continue;
    const when = i === 0 ? 'today' : i === 1 ? 'tomorrow' : d.toLocaleDateString('en-GB', { weekday: 'long' });
    return { open: false, text: `Closed · opens ${when} at ${hm(hh[0] * 60)}` };
  }
  return { open: false, text: 'Closed' };
}

/* ---------------- Availability ---------------- */

/** Busy blocks of a specialist on a day: demo "other guests" + bookings made on this device. */
function busyBlocks(memberId, iso) {
  const h = hoursOn(iso);
  if (!h) return [];
  const random = rng(`${memberId}|${iso}`);
  const blocks = [];
  const count = 3 + Math.floor(random() * 4);
  for (let i = 0; i < count; i++) {
    const start = h[0] * 60 + Math.floor(random() * ((h[1] - h[0]) * 60 / 30)) * 30;
    const len = [30, 45, 60, 90, 120][Math.floor(random() * 5)];
    blocks.push([start, start + len]);
  }
  bookings().filter((b) => b.status === 'confirmed' && b.memberId === memberId && b.date === iso)
    .forEach((b) => blocks.push([toMin(b.time), toMin(b.time) + b.duration]));
  return blocks;
}

export function works(member, iso) {
  return !!hoursOn(iso) && !member.off.includes(parseISO(iso).getDay());
}

/** Free start times (minutes) for one specialist, one day and a total duration. */
export function freeStarts(memberId, iso, minutes) {
  const member = memberById(memberId);
  if (!member || !works(member, iso)) return [];
  const [open, close] = hoursOn(iso).map((x) => x * 60);
  const busy = busyBlocks(memberId, iso);
  const isToday = iso === isoDate(new Date());
  const now = new Date();
  const earliest = isToday ? now.getHours() * 60 + now.getMinutes() + LEAD : 0;
  const out = [];
  for (let t = open; t + minutes <= close; t += STEP) {
    if (t < earliest) continue;
    if (busy.some(([a, b]) => t < b && t + minutes > a)) continue;
    out.push(t);
  }
  return out;
}

/** Slots for a day: [{ time: '10:15', members: ['ava', …] }]. memberId 'any' merges everyone qualified. */
export function slotsFor({ serviceId, memberId = 'any', iso, minutes }) {
  const service = serviceById(serviceId);
  const pool = memberId === 'any' ? teamFor(service.cat) : [memberById(memberId)].filter(Boolean);
  const map = new Map();
  pool.forEach((m) => freeStarts(m.id, iso, minutes).forEach((t) => {
    if (!map.has(t)) map.set(t, []);
    map.get(t).push(m.id);
  }));
  return [...map.entries()].sort((a, b) => a[0] - b[0]).map(([t, members]) => ({ time: hm(t), members }));
}

/** First free slot for a specialist (or anyone) within the next week. */
export function nextAvailable({ memberId, serviceId, cat } = {}) {
  const member = memberId ? memberById(memberId) : null;
  const svc = serviceId ? serviceById(serviceId)
    : SERVICES.find((s) => s.cat === (cat || member?.cats[0] || 'hair') && s.price > 0);
  for (let i = 0; i < 8; i++) {
    const iso = isoDate(addDays(today(), i));
    const slots = slotsFor({ serviceId: svc.id, memberId: memberId || 'any', iso, minutes: svc.duration });
    if (slots.length) return { iso, time: slots[0].time, memberId: slots[0].members[0], serviceId: svc.id };
  }
  return null;
}

/** Number of free starts per day (for the calendar heat-dots). */
export function dayLoad({ serviceId, memberId, minutes, iso }) {
  return slotsFor({ serviceId, memberId, iso, minutes }).length;
}

/* ---------------- Bookings ---------------- */

export const bookings = () => store.get('bookings', []);

export function quote({ serviceId, addons = [], promo = '' }) {
  const items = [serviceById(serviceId), ...addons.map(serviceById)].filter(Boolean);
  const minutes = items.reduce((s, x) => s + x.duration, 0);
  const subtotal = items.reduce((s, x) => s + x.price, 0);
  const code = promo.trim().toUpperCase();
  let discount = 0;
  let promoError = '';
  if (code) {
    if (code !== SALON.firstVisit.code) promoError = 'This code is not valid.';
    else if (bookings().some((b) => b.status === 'confirmed')) promoError = 'This code is for a first visit only.';
    else discount = Math.round(subtotal * SALON.firstVisit.percent / 100);
  }
  return { items, minutes, subtotal, discount, total: subtotal - discount, promo: discount ? code : '', promoError };
}

export async function createBooking(data) {
  await sleep(700);
  const q = quote(data);
  const free = slotsFor({ serviceId: data.serviceId, memberId: data.memberId, iso: data.date, minutes: q.minutes })
    .find((s) => s.time === data.time);
  if (!free) throw new Error('Sorry — that time was just taken. Please choose another one.');
  const memberId = data.memberId === 'any' ? free.members[0] : data.memberId;
  const booking = {
    id: 'BE-' + Math.random().toString(36).slice(2, 7).toUpperCase(),
    serviceId: data.serviceId,
    addons: data.addons || [],
    memberId,
    date: data.date,
    time: data.time,
    duration: q.minutes,
    total: q.total,
    discount: q.discount,
    promo: q.promo,
    guest: { name: data.name, phone: data.phone, email: data.email, notes: data.notes || '' },
    reminder: data.reminder,
    status: 'confirmed',
    createdAt: new Date().toISOString(),
  };
  store.update('bookings', (list) => [...list, booking], []);
  return booking;
}

export async function cancelBooking(id) {
  await sleep(400);
  store.update('bookings', (list) => list.map((b) => (b.id === id ? { ...b, status: 'cancelled' } : b)), []);
}

export function isPast(b) {
  const end = parseISO(b.date);
  end.setMinutes(toMin(b.time) + b.duration);
  return end < new Date();
}

/** Free cancellation until 24 h before the start. */
export function canCancelFree(b) {
  const start = parseISO(b.date);
  start.setMinutes(toMin(b.time));
  return start - new Date() > 24 * 3600 * 1000;
}

/* ---------------- Gift cards, newsletter, messages ---------------- */

export async function buyGiftCard(card) {
  await sleep(800);
  const code = 'GIFT-' + Math.random().toString(36).slice(2, 6).toUpperCase() + '-' + Math.random().toString(36).slice(2, 6).toUpperCase();
  const saved = { ...card, code, test: true, createdAt: new Date().toISOString() };
  store.update('giftcards', (l) => [...l, saved], []);
  return saved;
}

export async function subscribe(email) {
  await sleep(500);
  store.update('newsletter', (l) => [...new Set([...l, email.toLowerCase()])], []);
  return true;
}

export async function sendMessage(msg) {
  await sleep(600);
  store.update('messages', (l) => [...l, { ...msg, at: new Date().toISOString() }], []);
  return true;
}

export { HORIZON as BOOKING_HORIZON, TEAM };
