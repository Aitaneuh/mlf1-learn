// MLF1 Learn — tiny zero-dependency server.
// Serves the static site + content, and a small JSON API for accounts and progress.
// Storage: SQLite via Node's built-in `node:sqlite` (Node >= 22.13).

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const PUBLIC_DIR = path.join(ROOT, 'public');
const CONTENT_DIR = path.join(ROOT, 'content');
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, 'data'));
const PORT = Number(process.env.PORT || 3000);
const ALLOW_SIGNUP = (process.env.ALLOW_SIGNUP || 'true').toLowerCase() !== 'false';
const COOKIE_SECURE = (process.env.COOKIE_SECURE || 'false').toLowerCase() === 'true';
const SESSION_DAYS = Number(process.env.SESSION_DAYS || 60);

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new DatabaseSync(path.join(DATA_DIR, 'mlf1.db'));
db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA foreign_keys = ON;
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE COLLATE NOCASE,
    pass_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    created_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token_hash TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS progress (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL,
    status TEXT,
    score REAL,
    best_score REAL,
    attempts INTEGER NOT NULL DEFAULT 0,
    data TEXT,
    updated_at INTEGER NOT NULL,
    PRIMARY KEY (user_id, item_id)
  );
`);

const q = {
  userCount: db.prepare('SELECT COUNT(*) AS n FROM users'),
  userByName: db.prepare('SELECT * FROM users WHERE username = ?'),
  insertUser: db.prepare('INSERT INTO users (username, pass_hash, salt, created_at) VALUES (?, ?, ?, ?)'),
  insertSession: db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)'),
  sessionUser: db.prepare(`SELECT u.id, u.username FROM sessions s JOIN users u ON u.id = s.user_id
                           WHERE s.token_hash = ? AND s.expires_at > ?`),
  deleteSession: db.prepare('DELETE FROM sessions WHERE token_hash = ?'),
  purgeSessions: db.prepare('DELETE FROM sessions WHERE expires_at <= ?'),
  allProgress: db.prepare('SELECT item_id, status, score, best_score, attempts, data, updated_at FROM progress WHERE user_id = ?'),
  getProgress: db.prepare('SELECT * FROM progress WHERE user_id = ? AND item_id = ?'),
  upsertProgress: db.prepare(`INSERT INTO progress (user_id, item_id, status, score, best_score, attempts, data, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, item_id) DO UPDATE SET status=excluded.status, score=excluded.score,
        best_score=excluded.best_score, attempts=excluded.attempts, data=excluded.data, updated_at=excluded.updated_at`),
  resetProgress: db.prepare('DELETE FROM progress WHERE user_id = ?'),
};

// ---------- helpers ----------
const hashPassword = (password, salt) => crypto.scryptSync(password, salt, 64).toString('hex');
const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const now = () => Date.now();

function send(res, status, body, headers = {}) {
  const isObj = typeof body === 'object' && !(body instanceof Buffer);
  const payload = isObj ? JSON.stringify(body) : body;
  res.writeHead(status, {
    'Content-Type': isObj ? 'application/json; charset=utf-8' : 'text/plain; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers,
  });
  res.end(payload);
}

function parseCookies(req) {
  const out = {};
  (req.headers.cookie || '').split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  });
  return out;
}

function sessionCookie(token, maxAgeSec) {
  return `mlf1_session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${COOKIE_SECURE ? '; Secure' : ''}`;
}

function readJson(req, limit = 1_000_000) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > limit) { reject(Object.assign(new Error('Payload too large'), { status: 413 })); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8'))); }
      catch { reject(Object.assign(new Error('Invalid JSON'), { status: 400 })); }
    });
    req.on('error', reject);
  });
}

function currentUser(req) {
  const token = parseCookies(req).mlf1_session;
  if (!token) return null;
  return q.sessionUser.get(sha256(token), now()) || null;
}

function createSession(res, userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const maxAge = SESSION_DAYS * 24 * 3600;
  q.insertSession.run(sha256(token), userId, now() + maxAge * 1000);
  res.setHeader('Set-Cookie', sessionCookie(token, maxAge));
}

// naive in-memory rate limit for auth endpoints
const attempts = new Map();
function rateLimited(req) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || '?';
  const t = now();
  const rec = attempts.get(ip) || { n: 0, reset: t + 10 * 60_000 };
  if (t > rec.reset) { rec.n = 0; rec.reset = t + 10 * 60_000; }
  rec.n += 1;
  attempts.set(ip, rec);
  return rec.n > 30;
}

const USERNAME_RE = /^[a-zA-Z0-9_.-]{3,32}$/;

// ---------- API ----------
async function handleApi(req, res, url) {
  const route = `${req.method} ${url.pathname}`;

  if (route === 'GET /api/health') return send(res, 200, { ok: true });

  if (route === 'GET /api/config') {
    const users = q.userCount.get().n;
    return send(res, 200, { signupAllowed: ALLOW_SIGNUP || users === 0 });
  }

  if (route === 'POST /api/register') {
    if (rateLimited(req)) return send(res, 429, { error: 'Too many attempts, try again later.' });
    const { username = '', password = '' } = await readJson(req);
    if (!(ALLOW_SIGNUP || q.userCount.get().n === 0)) return send(res, 403, { error: 'Sign-up is disabled on this server.' });
    if (!USERNAME_RE.test(username)) return send(res, 400, { error: 'Username: 3–32 characters (letters, digits, _ . -).' });
    if (typeof password !== 'string' || password.length < 8) return send(res, 400, { error: 'Password must be at least 8 characters.' });
    if (q.userByName.get(username)) return send(res, 409, { error: 'This username is taken.' });
    const salt = crypto.randomBytes(16).toString('hex');
    const info = q.insertUser.run(username, hashPassword(password, salt), salt, now());
    createSession(res, Number(info.lastInsertRowid));
    return send(res, 201, { user: { username } });
  }

  if (route === 'POST /api/login') {
    if (rateLimited(req)) return send(res, 429, { error: 'Too many attempts, try again later.' });
    const { username = '', password = '' } = await readJson(req);
    const user = q.userByName.get(String(username));
    const ok = user && crypto.timingSafeEqual(Buffer.from(hashPassword(String(password), user.salt), 'hex'), Buffer.from(user.pass_hash, 'hex'));
    if (!ok) return send(res, 401, { error: 'Wrong username or password.' });
    q.purgeSessions.run(now());
    createSession(res, user.id);
    return send(res, 200, { user: { username: user.username } });
  }

  if (route === 'POST /api/logout') {
    const token = parseCookies(req).mlf1_session;
    if (token) q.deleteSession.run(sha256(token));
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return send(res, 200, { ok: true });
  }

  const user = currentUser(req);
  if (route === 'GET /api/me') return send(res, 200, { user: user ? { username: user.username } : null });
  if (!user) return send(res, 401, { error: 'Not logged in.' });

  if (route === 'GET /api/progress') {
    const rows = q.allProgress.all(user.id).map((r) => ({ ...r, data: r.data ? JSON.parse(r.data) : null }));
    return send(res, 200, { progress: rows });
  }

  if (route === 'DELETE /api/progress') {
    q.resetProgress.run(user.id);
    return send(res, 200, { ok: true });
  }

  const m = url.pathname.match(/^\/api\/progress\/([^/]{1,200})$/);
  let itemId = null;
  if (m) { try { itemId = decodeURIComponent(m[1]); } catch { itemId = null; } }
  if (itemId && /^[A-Za-z0-9_.:\-]{1,120}$/.test(itemId) && req.method === 'PUT') {
    const body = await readJson(req);
    const prev = q.getProgress.get(user.id, itemId);
    const prevData = prev?.data ? JSON.parse(prev.data) : {};
    const status = body.status ?? prev?.status ?? null;
    const score = typeof body.score === 'number' ? body.score : (prev?.score ?? null);
    const best = typeof body.score === 'number' ? Math.max(body.score, prev?.best_score ?? -Infinity) : (prev?.best_score ?? null);
    const tries = (prev?.attempts ?? 0) + (body.attempt ? 1 : 0);
    // never downgrade a completed status
    const finalStatus = prev?.status === 'done' && status !== 'done' && !body.force ? 'done' : status;
    const data = body.data && typeof body.data === 'object' ? { ...prevData, ...body.data } : prevData;
    const dataStr = JSON.stringify(data);
    if (dataStr.length > 400_000) return send(res, 413, { error: 'Data too large.' });
    q.upsertProgress.run(user.id, itemId, finalStatus, score, best, tries, dataStr, now());
    return send(res, 200, { ok: true, item: { item_id: itemId, status: finalStatus, score, best_score: best, attempts: tries, data } });
  }

  return send(res, 404, { error: 'Unknown API route.' });
}

// ---------- static files ----------
const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.webp': 'image/webp',
  '.csv': 'text/csv; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.data': 'text/plain; charset=utf-8',
  '.tra': 'text/plain; charset=utf-8', '.gz': 'application/gzip', '.npz': 'application/octet-stream', '.npy': 'application/octet-stream',
  '.woff2': 'font/woff2',
};

function serveFile(res, filePath, req) {
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) return send(res, 404, 'Not found');
    const ext = path.extname(filePath).toLowerCase();
    const etag = `"${st.size.toString(16)}-${st.mtimeMs.toString(16)}"`;
    // Always revalidate so weekly content updates show up immediately.
    const headers = {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
      ETag: etag,
      'X-Content-Type-Options': 'nosniff',
    };
    if (req.headers['if-none-match'] === etag) { res.writeHead(304, headers); return res.end(); }
    res.writeHead(200, { ...headers, 'Content-Length': st.size });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(filePath).pipe(res);
  });
}

function safeJoin(base, rel) {
  const p = path.normalize(path.join(base, rel));
  return p.startsWith(base + path.sep) || p === base ? p : null;
}

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname.startsWith('/api/')) return await handleApi(req, res, url);
    if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, 405, 'Method not allowed');

    let pathname = decodeURIComponent(url.pathname);
    if (pathname.startsWith('/content/')) {
      const p = safeJoin(CONTENT_DIR, pathname.slice('/content/'.length));
      return p ? serveFile(res, p, req) : send(res, 400, 'Bad path');
    }
    if (pathname === '/') pathname = '/index.html';
    const p = safeJoin(PUBLIC_DIR, pathname.slice(1));
    if (!p) return send(res, 400, 'Bad path');
    fs.stat(p, (err, st) => {
      if (!err && st.isFile()) return serveFile(res, p, req);
      serveFile(res, path.join(PUBLIC_DIR, 'index.html'), req); // SPA fallback
    });
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) send(res, status, { error: status === 500 ? 'Server error' : e.message });
  }
});

server.listen(PORT, () => {
  console.log(`MLF1 Learn listening on :${PORT}  (data: ${DATA_DIR}, signup: ${ALLOW_SIGNUP ? 'open' : 'closed'})`);
});

const shutdown = () => { server.close(() => { db.close(); process.exit(0); }); setTimeout(() => process.exit(0), 3000); };
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
