// Application state: localStorage when available, memory otherwise
// (so the site keeps working in private browsing). Keys are prefixed.

const PREFIX = 'beauty-example:';
const memory = new Map();
const listeners = new Map();

function readRaw(key) {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    return raw === null ? undefined : JSON.parse(raw);
  } catch (e) {
    return undefined;
  }
}

function writeRaw(key, value) {
  try {
    if (value === undefined) localStorage.removeItem(PREFIX + key);
    else localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch (e) { /* storage unavailable — memory only */ }
}

export const store = {
  get(key, fallback) {
    if (!memory.has(key)) {
      const v = readRaw(key);
      if (v !== undefined) memory.set(key, v);
    }
    const value = memory.get(key);
    return value === undefined ? fallback : value;
  },
  set(key, value) {
    if (value === undefined) memory.delete(key);
    else memory.set(key, value);
    writeRaw(key, value);
    listeners.get(key)?.forEach((fn) => { try { fn(value); } catch (e) { console.error(e); } });
    return value;
  },
  update(key, fn, fallback) { return this.set(key, fn(this.get(key, fallback))); },
  subscribe(key, fn) {
    if (!listeners.has(key)) listeners.set(key, new Set());
    listeners.get(key).add(fn);
    return () => listeners.get(key)?.delete(fn);
  },
};

try {
  window.addEventListener('storage', (e) => {
    if (!e.key || !e.key.startsWith(PREFIX)) return;
    const key = e.key.slice(PREFIX.length);
    memory.delete(key);
    listeners.get(key)?.forEach((fn) => fn(store.get(key)));
  });
} catch (e) { /* noop */ }
