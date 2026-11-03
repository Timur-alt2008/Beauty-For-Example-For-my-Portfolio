// Formatting and date helpers (local time, no time-zone surprises).

export const money = (n) => (n === 0 ? 'Free' : `$${Number(n).toLocaleString('en-US', { maximumFractionDigits: 0 })}`);

export function duration(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (!h) return `${m} min`;
  return m ? `${h} h ${m} min` : `${h} h`;
}

const pad = (n) => String(n).padStart(2, '0');

/** Date → 'YYYY-MM-DD' in local time. */
export const isoDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM-DD' → Date at local midnight. */
export function parseISO(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const today = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; };

/** Minutes since midnight → '14:30'. */
export const hm = (min) => `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
export const toMin = (s) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };

export function niceDate(iso, opts = { weekday: 'short', day: 'numeric', month: 'short' }) {
  return parseISO(iso).toLocaleDateString('en-GB', opts);
}

export function relativeDay(iso) {
  const diff = Math.round((parseISO(iso) - today()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  return niceDate(iso, { weekday: 'long' });
}

export const plural = (n, one, many = one + 's') => `${n} ${n === 1 ? one : many}`;
