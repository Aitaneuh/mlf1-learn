// API + progress store
async function req(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : {},
    body: body ? JSON.stringify(body) : undefined,
    credentials: 'same-origin',
  });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) throw Object.assign(new Error(data.error || `HTTP ${res.status}`), { status: res.status });
  return data;
}

export const api = {
  me: () => req('GET', '/api/me'),
  config: () => req('GET', '/api/config'),
  login: (username, password) => req('POST', '/api/login', { username, password }),
  register: (username, password) => req('POST', '/api/register', { username, password }),
  logout: () => req('POST', '/api/logout'),
  progress: () => req('GET', '/api/progress'),
  save: (id, patch) => req('PUT', `/api/progress/${encodeURIComponent(id)}`, patch),
  reset: () => req('DELETE', '/api/progress'),
};

// ---- progress store (in memory, synced to server) ----
const listeners = new Set();
export const store = {
  user: null,
  items: {}, // id -> {status, score, best_score, attempts, data}
  onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  emit() { listeners.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); },
  get(id) { return this.items[id] || null; },
  isDone(id) { return this.items[id]?.status === 'done'; },
  async load() {
    const { progress } = await api.progress();
    this.items = {};
    for (const row of progress) this.items[row.item_id] = row;
    this.emit();
  },
  async save(id, patch) {
    // optimistic local update
    const prev = this.items[id] || {};
    const merged = { ...prev, ...patch, data: { ...(prev.data || {}), ...(patch.data || {}) } };
    if (prev.status === 'done' && patch.status && patch.status !== 'done') merged.status = 'done';
    if (typeof patch.score === 'number') merged.best_score = Math.max(patch.score, prev.best_score ?? -Infinity);
    this.items[id] = merged;
    this.emit();
    try {
      const { item } = await api.save(id, patch);
      this.items[id] = item;
    } catch (e) {
      console.warn('save failed', id, e);
      if (e.status === 401) location.hash = '#/login';
    }
  },
};

// debounced saver for code drafts
const timers = new Map();
export function saveDebounced(id, patch, ms = 1200) {
  clearTimeout(timers.get(id));
  timers.set(id, setTimeout(() => { timers.delete(id); store.save(id, patch); }, ms));
}
