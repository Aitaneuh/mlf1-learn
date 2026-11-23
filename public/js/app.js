// mlf1/learn — main app (router + views)
import { api, store } from './api.js';
import { renderDoc, md, highlightCode, escapeHtml } from './render.js';
import { mountBlocks, usesPython } from './blocks.js';
import { py } from './py.js';
import { icon, LOGO } from './icons.js';

const app = document.getElementById('app');
let course = null;
let flat = [];
const settings = {
  get free() { return localStorage.getItem('mlf1.free') === '1'; },
  set free(v) { localStorage.setItem('mlf1.free', v ? '1' : '0'); },
};

const $ = (sel, root = document) => root.querySelector(sel);
const pad = (n) => String(n).padStart(2, '0');
function toast(msg, ico = 'check') {
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = `${icon(ico)}<span>${msg}</span>`;
  $('#toast-root').appendChild(t); setTimeout(() => t.remove(), 3000);
}
async function fetchText(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`);
  return r.text();
}
const TYPE_LABEL = { lesson: 'Lesson', exam: 'Exam', project: 'Project' };

// ------------------------------------------------------------------ progression
const isRequired = (it) => !it.optional;
const itemDone = (it) => store.isDone(it.id);
const unitDone = (u) => u.items.filter(isRequired).every(itemDone);
function isUnlocked(item) {
  if (settings.free) return true;
  const u = course.units[item.unitIndex];
  for (let i = 0; i < item.index; i++) { const prev = u.items[i]; if (isRequired(prev) && !itemDone(prev)) return false; }
  return !(item.unitIndex > 0 && !unitDone(course.units[item.unitIndex - 1]));
}
function itemState(item) {
  if (itemDone(item)) return 'done';
  const p = store.get(item.id);
  if (p && (p.status === 'attempted' || p.status === 'started')) return 'partial';
  if (Object.keys(store.items || {}).some((k) => k.startsWith(`ex:${item.id}:`) || k.startsWith(`quiz:${item.id}:`))) return 'partial';
  return 'todo';
}
const nextUp = () => flat.find((it) => isRequired(it) && !itemDone(it) && isUnlocked(it)) || flat.find((it) => !itemDone(it) && isUnlocked(it));
function counts() {
  const c = { lesson: [0, 0], exam: [0, 0], project: [0, 0] };
  flat.forEach((it) => { c[it.type][1]++; if (itemDone(it)) c[it.type][0]++; });
  return c;
}
function overallPct() {
  const req = flat.filter(isRequired); if (!req.length) return 0;
  return Math.round((100 * req.filter(itemDone).length) / req.length);
}
function updateTopProgress() {
  const el = $('#overall-progress');
  if (!course || !store.user) { el.innerHTML = ''; return; }
  const p = overallPct();
  el.innerHTML = `<div class="track" aria-hidden="true"><i style="width:${p}%"></i></div><span>${p}%</span>`;
  el.title = `Overall progress: ${p}%`;
}
function itemNumber(item) {
  const u = course.units[item.unitIndex];
  const sameType = u.items.filter((x) => x.type === item.type);
  return sameType.length > 1 ? sameType.findIndex((x) => x.id === item.id) + 1 : null;
}

// ------------------------------------------------------------------ auth
const LOSS_ART = `<svg viewBox="0 0 460 300" fill="none" aria-hidden="true">
  <g stroke="var(--rule-strong)" stroke-width="1"><line x1="40" y1="260" x2="440" y2="260"/><line x1="40" y1="20" x2="40" y2="260"/></g>
  <path d="M50 30 C 120 210, 190 248, 240 248 S 360 210, 430 30" stroke="var(--ink)" stroke-width="1.6"/>
  <g fill="var(--ink)"><circle cx="70" cy="86" r="4" opacity=".25"/><circle cx="96" cy="146" r="4" opacity=".35"/><circle cx="126" cy="190" r="4" opacity=".5"/><circle cx="160" cy="222" r="4" opacity=".65"/><circle cx="196" cy="240" r="4" opacity=".8"/></g>
  <circle cx="240" cy="248" r="6" fill="var(--accent)"/>
  <g stroke="var(--ink-3)" stroke-width="1" stroke-dasharray="3 4"><path d="M70 86 L96 146 L126 190 L160 222 L196 240 L240 248"/></g>
  <line x1="240" y1="256" x2="240" y2="264" stroke="var(--ink-3)"/><text x="240" y="280" text-anchor="middle" fill="var(--ink-2)" font-family="IBM Plex Mono, monospace" font-size="12">w*</text>
  <text x="440" y="280" text-anchor="end" fill="var(--ink-3)" font-family="IBM Plex Mono, monospace" font-size="11">parameter w →</text>
  <text x="48" y="16" fill="var(--ink-3)" font-family="IBM Plex Mono, monospace" font-size="11">loss</text>
</svg>`;

function viewLogin(mode = 'login', signupAllowed = true) {
  const isLogin = mode === 'login';
  app.innerHTML = `<div class="auth-wrap">
    <div class="auth-art">${LOSS_ART}<p class="cap">w ← w − η · ∂L/∂w<br>Every model in this course learns by taking small steps downhill on a loss curve. So will you.</p></div>
    <div class="auth">
      <span class="label">BTI1041 · Machine Learning Foundations 1</span>
      <h1>${isLogin ? 'Log in' : 'Create an account'}</h1>
      <p class="lead">${isLogin ? 'Pick up where you left off.' : 'Your lessons, exam scores and code are saved on this server, so you can continue on any device.'}</p>
      <form id="auth-form" novalidate>
        <label class="field">Username <input name="username" autocomplete="username" required minlength="3"></label>
        <label class="field">Password <input name="password" type="password" autocomplete="${isLogin ? 'current-password' : 'new-password'}" required minlength="${isLogin ? 1 : 8}">${isLogin ? '' : '<small style="font-weight:400;color:var(--ink-3)">At least 8 characters.</small>'}</label>
        <div class="err" id="auth-err" role="alert"></div>
        <button class="btn primary big" style="width:100%;justify-content:center" type="submit">${isLogin ? 'Log in' : 'Create account'}</button>
      </form>
      ${signupAllowed ? `<div class="switch">${isLogin ? 'No account yet?' : 'Already registered?'} <button type="button" data-sw>${isLogin ? 'Create one' : 'Log in'}</button></div>` : ''}
    </div></div>`;
  const sw = $('[data-sw]', app);
  if (sw) sw.onclick = () => viewLogin(isLogin ? 'register' : 'login', signupAllowed);
  $('#auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    const btn = e.target.querySelector('button[type=submit]'); btn.disabled = true;
    try {
      const { user } = await (isLogin ? api.login : api.register)(fd.get('username').trim(), fd.get('password'));
      store.user = user;
      await store.load();
      if (!location.hash || location.hash === '#/login') location.hash = '#/'; else route();
    } catch (err) { $('#auth-err').textContent = err.message; btn.disabled = false; }
  };
}

// ------------------------------------------------------------------ home
function viewDashboard() {
  const c = counts();
  const nu = nextUp();
  const updates = (course.updates || []).slice(0, 2);
  const nuUnit = nu ? course.units[nu.unitIndex] : null;
  let html = `<div class="home">
    <header class="home-head">
      <div>
        <span class="label">BTI1041 · Machine Learning Foundations 1</span>
        <h1>Machine learning, one step at a time.</h1>
        <p>Each unit follows a course week: a short explanation, an interactive plot, a few questions, Python you run in the browser, and a small exam before the next unit.</p>
      </div>
      <div class="home-stats" aria-label="Progress">
        <div><div class="v">${c.lesson[0]}<small>/${c.lesson[1]}</small></div><div class="k">lessons</div></div>
        <div><div class="v">${c.exam[0]}<small>/${c.exam[1]}</small></div><div class="k">exams</div></div>
        <div><div class="v">${c.project[0]}<small>/${c.project[1]}</small></div><div class="k">projects</div></div>
      </div>
    </header>
    ${nu ? `<a class="next-up" href="#/learn/${nu.id}">
        <span class="nu-ico">${icon('play')}</span>
        <span><span class="label">${overallPct() ? 'Continue' : 'Start'} · Unit ${pad(nu.unitIndex)} · ${escapeHtml(TYPE_LABEL[nu.type])}</span><div class="nu-title">${escapeHtml(nu.title)}</div><span style="font-size:13.5px;color:var(--ink-3)">${escapeHtml(nuUnit.title)}${nu.minutes ? ` · ~${nu.minutes} min` : ''}</span></span>
        <span class="nu-arrow">${icon('arrowR')}</span></a>` : '<p class="label" style="margin-top:28px;color:var(--ok)">All units completed.</p>'}
    ${updates.length ? `<div class="updates"><span class="label">Changelog</span>${updates.map((u) => `<span><span class="mono" style="color:var(--ink-3)">${escapeHtml(u.date)}</span> — ${escapeHtml(u.text)}</span>`).join('')}</div>` : ''}
    <div class="roadmap-head"><h2>Roadmap</h2><span class="hint">${settings.free ? 'Free navigation is on.' : 'Items unlock in order — <a href="#" id="open-settings">turn on free navigation</a> to jump ahead.'}</span></div>`;
  course.units.forEach((u, ui) => {
    const req = u.items.filter(isRequired); const done = req.filter(itemDone).length;
    const locked = !isUnlocked(u.items[0]);
    const current = nu && nu.unitIndex === ui;
    const ticks = u.items.map((raw) => { const it = flat.find((f) => f.id === raw.id); return `<i class="${it.type} ${itemState(it)} ${it.optional ? 'optional' : ''}" title="${escapeHtml(it.title)}"></i>`; }).join('');
    html += `<section class="unit ${unitDone(u) ? 'done' : ''} ${locked ? 'locked' : ''} ${current ? 'current open' : ''}">
      <button class="unit-head" aria-expanded="${current ? 'true' : 'false'}">
        <span class="unit-idx">${pad(ui)}</span>
        <span class="unit-title"><h3>${escapeHtml(u.title)}</h3><p>${escapeHtml(u.summary || '')}</p></span>
        <span class="unit-meta"><span class="label">${escapeHtml(u.weeks || '')} · ${done}/${req.length}</span><span class="ticks" aria-hidden="true">${ticks}</span></span>
        <span class="chev">${icon('chevron')}</span>
      </button>
      <div class="unit-items">${u.items.map((it) => itemRow(flat.find((f) => f.id === it.id))).join('')}</div>
    </section>`;
  });
  html += '</div>';
  app.innerHTML = html;
  app.querySelectorAll('.unit-head').forEach((hd) => { hd.onclick = () => { const s = hd.parentElement; s.classList.toggle('open'); hd.setAttribute('aria-expanded', s.classList.contains('open')); }; });
  const os = $('#open-settings'); if (os) os.onclick = (e) => { e.preventDefault(); openSettings(); };
}

function itemRow(it) {
  const st = itemState(it); const lock = !isUnlocked(it);
  const p = store.get(it.id);
  let meta = it.minutes ? `${it.minutes} min` : '';
  let metaCls = '';
  if (it.type === 'exam' && p?.best_score != null) { meta = `${Math.round(p.best_score)}%`; metaCls = itemDone(it) ? 'pass' : 'fail'; }
  const ico = st === 'done' ? icon('check') : lock ? icon('lock') : icon(it.type);
  return `<a class="item-row ${st} ${lock ? 'locked' : ''}" href="#/learn/${it.id}">
    <span class="st" aria-label="${st === 'done' ? 'completed' : lock ? 'locked' : TYPE_LABEL[it.type]}">${ico}</span>
    <span>${escapeHtml(it.title)}${it.optional ? '<span class="opt">optional</span>' : ''}</span>
    <span class="ty ${it.type}">${TYPE_LABEL[it.type]}</span>
    <span class="meta ${metaCls}">${meta}</span></a>`;
}

// ------------------------------------------------------------------ sidebar
function sidebarHtml(current) {
  return `<nav aria-label="Course">${course.units.map((u, ui) => {
    const open = ui === current.unitIndex;
    return `<div class="side-unit ${open ? 'open current' : ''} ${unitDone(u) ? 'done' : ''}"><button data-su="${ui}" aria-expanded="${open}"><span class="n">${pad(ui)}</span><span>${escapeHtml(u.title)}</span></button>
      <div class="side-items">${u.items.map((raw) => {
        const it = flat.find((f) => f.id === raw.id);
        return `<a class="side-item ${itemState(it)} ${it.id === current.id ? 'active' : ''} ${isUnlocked(it) ? '' : 'locked'}" href="#/learn/${it.id}" ${it.id === current.id ? 'aria-current="page"' : ''}><span class="dot"></span><span>${it.type !== 'lesson' ? `<span class="k">${TYPE_LABEL[it.type]}</span>` : ''}${escapeHtml(it.title.replace(/^Project \d+ · /, ''))}</span></a>`;
      }).join('')}</div></div>`;
  }).join('')}</nav>`;
}
function bindSidebar() {
  app.querySelectorAll('[data-su]').forEach((b) => { b.onclick = () => { b.parentElement.classList.toggle('open'); b.setAttribute('aria-expanded', b.parentElement.classList.contains('open')); }; });
}

// ------------------------------------------------------------------ item page
let pageCleanup = [];
async function viewItem(id) {
  const item = flat.find((f) => f.id === id);
  if (!item) { app.innerHTML = `<div class="page"><span class="label">404</span><h1>Page not found</h1><a class="btn" href="#/">${icon('arrowL')} Roadmap</a></div>`; return; }
  const unit = course.units[item.unitIndex];
  app.innerHTML = `<div class="learn"><aside class="sidebar">${sidebarHtml(item)}</aside><div class="content-wrap"><article class="content" id="content"><div class="loading-screen">loading…</div></article></div></div>`;
  bindSidebar();
  const content = $('#content');
  if (!isUnlocked(item)) {
    const nu = nextUp();
    content.innerHTML = `<div class="locked-page"><div class="lock">${icon('lock')}</div><span class="label">Unit ${pad(item.unitIndex)} · ${TYPE_LABEL[item.type]}</span><h2>${escapeHtml(item.title)} is locked</h2><p>Each step builds on the previous one. Finish the earlier steps first, or turn on free navigation.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px">${nu ? `<a class="btn primary" href="#/learn/${nu.id}">Go to: ${escapeHtml(nu.title)} ${icon('arrowR')}</a>` : ''}<button class="btn ghost" id="unlock-all">Turn on free navigation</button></div></div>`;
    $('#unlock-all').onclick = () => { settings.free = true; route(); };
    return;
  }
  let src;
  try { src = await fetchText(`/content/${item.file}`); } catch (e) { content.innerHTML = `<div class="callout warn"><p>${escapeHtml(e.message)}</p></div>`; return; }
  const { html, blocks } = renderDoc(src);
  const n = itemNumber(item);
  const title = item.title.replace(/^Project \d+ · /, '');
  const typeIcon = { lesson: 'lesson', exam: 'exam', project: 'project' }[item.type];
  const meta = `<div class="crumbs"><a href="#/">Roadmap</a><span class="s">/</span><span>Unit ${pad(item.unitIndex)} — ${escapeHtml(unit.title)}</span></div>
    <h1 class="page-title">${escapeHtml(title)}</h1>
    <div class="page-meta"><span class="type-${item.type}">${icon(typeIcon)} ${TYPE_LABEL[item.type]}${n ? ` ${n}` : ''}${item.optional ? ' · optional' : ''}</span>${unit.weeks ? `<span>${escapeHtml(unit.weeks)}</span>` : ''}${item.minutes ? `<span>${icon('clock')} ~${item.minutes} min</span>` : ''}${item.source ? `<span title="Matching course material">${icon('file')} ${escapeHtml(item.source)}</span>` : ''}</div>`;
  const hasPy = usesPython(blocks);
  content.innerHTML = `${meta}${hasPy ? kernelBarHtml() : ''}<div class="prose" id="prose">${html}</div><div id="page-end"></div>`;
  const prose = $('#prose');
  highlightCode(prose);
  pageCleanup.forEach((fn) => fn()); pageCleanup = [];

  const reqs = new Map();
  let anon = 0;
  const counters = { exercise: 0 };
  const refreshComplete = () => renderCompleteBox(item, reqs);
  const exam = examController(item, () => refreshComplete());
  const ctx = {
    itemId: item.id, ns: item.id,
    mode: item.type === 'exam' ? 'exam' : 'lesson',
    project: item.type === 'project',
    nextAnon: () => `b${++anon}`,
    nextNumber: (k) => (counters[k] = (counters[k] || 0) + 1),
    require(key, title) { reqs.set(key, { title, done: false }); return { done: () => { const r = reqs.get(key); if (r && !r.done) { r.done = true; refreshComplete(); } } }; },
    exam,
  };
  mountBlocks(prose, blocks, ctx);
  if (hasPy) setupKernelBar(item, blocks);
  if (item.type === 'exam') exam.renderControls(); else refreshComplete();
  renderPager(item);
  window.scrollTo(0, 0);
}

function kernelBarHtml() {
  return `<div class="kernel-bar" id="kernel-bar" data-state="${py.state}" role="status"><span class="kernel-dot" aria-hidden="true"></span><span class="ktext"><b>python</b> — <span id="ktext">${escapeHtml(py.statusText)}</span></span>
    <button class="btn small ghost" id="k-restart" title="Clear all variables of this page (Kernel → Restart)">${icon('reset')} restart</button>
    <button class="btn small ghost" id="k-stop" title="Force-stop Python (e.g. an endless loop)">${icon('stop')} stop</button></div>`;
}
function setupKernelBar(item, blocks) {
  const bar = $('#kernel-bar'); const txt = $('#ktext');
  const off = py.onStatus((state, text) => { if (!bar.isConnected) return; bar.dataset.state = state; txt.textContent = text.toLowerCase(); });
  pageCleanup.push(off);
  $('#k-restart').onclick = async () => { await py.resetNamespace(item.id); toast('Kernel restarted — variables cleared', 'reset'); };
  $('#k-stop').onclick = () => { py.kill(); toast('Python stopped', 'stop'); };
  const code = blocks.filter((b) => b.type === 'exercise' || b.type === 'code').map((b) => b.body).join('\n');
  py.preload(code).catch(() => {});
}

function renderCompleteBox(item, reqs) {
  if (item.type === 'exam') return;
  const end = $('#page-end'); if (!end) return;
  const all = [...reqs.values()]; const done = all.filter((r) => r.done).length;
  const isDone = itemDone(item);
  const ready = done === all.length;
  end.innerHTML = `<div class="complete-box ${isDone ? 'done' : ''}">
    <div class="txt">${isDone ? `${icon('check')} Completed` : all.length ? `<span class="label">Activities ${done}/${all.length}</span><div class="checklist">${all.map((r) => `<span class="${r.done ? 'is-done' : ''}">${icon(r.done ? 'check' : 'target')}${escapeHtml(r.title)}</span>`).join('')}</div>` : 'Read it through, then mark it complete.'}</div>
    ${isDone ? '' : `<button class="btn ${ready ? 'primary' : 'ghost'}" id="mark-done">${ready ? `${icon('check')} Mark complete` : 'Mark complete anyway'}</button>`}
  </div>`;
  const b = $('#mark-done');
  if (b) b.onclick = async () => {
    if (!ready && !confirm('Some activities are not finished yet. Mark as complete anyway?')) return;
    await store.save(item.id, { status: 'done' });
    toast('Completed');
    renderCompleteBox(item, reqs); renderPager(item);
    $('.sidebar').innerHTML = sidebarHtml(item); bindSidebar();
  };
}

function renderPager(item) {
  let pager = $('#pager');
  if (!pager) { pager = document.createElement('nav'); pager.id = 'pager'; pager.className = 'page-footer'; pager.setAttribute('aria-label', 'Previous and next'); $('#content').appendChild(pager); }
  const i = flat.indexOf(item); const prev = flat[i - 1]; const next = flat[i + 1];
  pager.innerHTML = `${prev ? `<a class="pager-link" href="#/learn/${prev.id}"><span class="label">${icon('arrowL')} Previous</span><span class="t">${escapeHtml(prev.title)}</span></a>` : ''}
    ${next ? `<a class="pager-link next" href="#/learn/${next.id}"><span class="label">${isUnlocked(next) ? '' : icon('lock')}Next ${icon('arrowR')}</span><span class="t">${escapeHtml(next.title)}</span></a>` : `<a class="pager-link next" href="#/"><span class="label">Done ${icon('arrowR')}</span><span class="t">Back to the roadmap</span></a>`}`;
}

// ------------------------------------------------------------------ exams
function examController(item, onDone) {
  const qs = [];
  const pass = item.pass || 70;
  return {
    register(st) { qs.push(st); },
    renderControls() {
      const end = $('#page-end');
      const p = store.get(item.id);
      const best = p?.best_score;
      const top = document.createElement('div');
      top.className = `exam-banner ${best == null ? 'info' : best >= pass ? 'pass' : 'fail'}`;
      top.innerHTML = best == null
        ? `<span class="score">${qs.length}</span><h3>questions · pass mark ${pass}%</h3><p>Corrections appear after you submit. Retake as often as you like — the best score counts.</p>`
        : `<span class="score">${Math.round(best)}%</span><h3>${best >= pass ? 'Passed' : 'Not passed yet'} · best score</h3><p>${best >= pass ? 'The next unit is unlocked. Retake any time to refresh.' : `You need ${pass}%. Revisit the lessons, then try again.`} Attempts: ${p.attempts || 0}.</p>`;
      $('#prose').prepend(top);
      end.innerHTML = `<div class="complete-box"><div class="txt" id="exam-count"></div><button class="btn primary big" id="exam-submit">Submit answers</button></div>`;
      const upd = () => { const a = qs.filter((q) => q.answered()).length; const c = $('#exam-count'); if (c) c.innerHTML = `<span class="label">Answered ${a}/${qs.length}</span>`; };
      qs.forEach((q) => { q.el.addEventListener('input', upd); q.el.addEventListener('change', upd); });
      upd();
      $('#exam-submit').onclick = async () => {
        const unanswered = qs.filter((q) => !q.answered()).length;
        if (unanswered && !confirm(`${unanswered} question(s) are unanswered and will count as wrong. Submit anyway?`)) return;
        let correct = 0;
        qs.forEach((q) => {
          const ok = q.answered() && q.grade();
          if (ok) correct++;
          if (!ok && q.markMissed) q.markMissed();
          q.lock();
          const fb = document.createElement('div');
          fb.className = 'q-explain';
          fb.innerHTML = `<p class="q-feedback ${ok ? 'ok' : 'bad'}">${ok ? 'correct' : 'wrong'}${!ok && q.reveal() ? ` — ${q.reveal()}` : ''}</p>${md(q.q.explain)}`;
          q.el.appendChild(fb); highlightCode(fb);
        });
        const score = (100 * correct) / qs.length;
        const passed = score >= pass;
        await store.save(item.id, { status: passed ? 'done' : 'attempted', score, attempt: true });
        end.innerHTML = `<div class="exam-banner ${passed ? 'pass' : 'fail'}"><span class="score">${Math.round(score)}%</span><h3>${passed ? 'Passed' : 'Not passed yet'} — ${correct} of ${qs.length} correct</h3><p>${passed ? 'The next unit is unlocked.' : `You need ${pass}%. Read the explanations above, revisit the lessons, then retake.`}</p></div>
          <button class="btn" id="retake">${icon('reset')} Retake with new order</button>`;
        $('#retake').onclick = () => viewItem(item.id);
        renderPager(item);
        $('.sidebar').innerHTML = sidebarHtml(item); bindSidebar();
        end.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'center' });
        updateTopProgress();
        onDone();
      };
    },
  };
}

// ------------------------------------------------------------------ glossary & cheat sheet
async function viewGlossary() {
  let terms = [];
  try { terms = JSON.parse(await fetchText('/content/glossary.json')); } catch { /* ignore */ }
  terms.sort((a, b) => a.term.localeCompare(b.term));
  app.innerHTML = `<div class="page"><span class="label">Reference</span><h1>Glossary</h1><p class="lead">Every key term of the course in plain words, with a link to the lesson that explains it.</p>
    <div class="search-box">${icon('search')}<input type="search" placeholder="Search terms — epoch, recall, kernel…" aria-label="Search the glossary"></div><div class="gl-count" id="gl-count"></div><div id="gl-list"></div></div>`;
  const list = $('#gl-list');
  const draw = (q) => {
    const f = q.toLowerCase().trim();
    const hits = terms.filter((t) => !f || t.term.toLowerCase().includes(f) || (t.def || '').toLowerCase().includes(f) || (t.aka || '').toLowerCase().includes(f));
    $('#gl-count').textContent = `${hits.length} term${hits.length === 1 ? '' : 's'}`;
    list.innerHTML = hits.map((t) => `<div class="gl-term"><h3>${escapeHtml(t.term)}${t.aka ? `<span class="aka">${escapeHtml(t.aka)}</span>` : ''}${t.week ? `<span class="label wk">${escapeHtml(t.week)}</span>` : ''}</h3><div class="def">${md(t.def)}${t.see ? `<div class="see"><a href="#/learn/${t.see}">${escapeHtml(flat.find((x) => x.id === t.see)?.title || 'Lesson')} →</a></div>` : ''}</div></div>`).join('') || '<p>No match.</p>';
  };
  $('.search-box input', app).oninput = (e) => draw(e.target.value);
  draw('');
}
async function viewCheatsheet() {
  const src = await fetchText('/content/cheatsheet.md');
  const { html } = renderDoc(src.replace(/^# .*\n/, ''));
  app.innerHTML = `<div class="page"><span class="label">Reference</span><h1>Cheat sheet</h1><p class="lead">The code and formulas you need for the course, on one page.</p><div class="prose">${html}</div></div>`;
  highlightCode(app);
}

// ------------------------------------------------------------------ settings
function openSettings() {
  const root = $('#modal-root');
  const prevFocus = document.activeElement;
  root.innerHTML = `<div class="modal-back"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="set-title">
    <h2 id="set-title">Settings</h2>
    <div class="row"><div>Free navigation<small>Open any lesson without finishing the previous ones.</small></div><label class="switch-toggle"><input type="checkbox" id="set-free" ${settings.free ? 'checked' : ''} aria-label="Free navigation"><span></span></label></div>
    <div class="row"><div>Dark theme</div><label class="switch-toggle"><input type="checkbox" id="set-dark" ${document.documentElement.dataset.theme === 'dark' ? 'checked' : ''} aria-label="Dark theme"><span></span></label></div>
    <div class="row"><div>Signed in as <b>${escapeHtml(store.user?.username || '')}</b></div><button class="btn small" id="set-logout">${icon('logout')} Log out</button></div>
    <div class="row"><div>Reset progress<small>Deletes completed lessons, scores and saved code. Cannot be undone.</small></div><button class="btn small" id="set-reset" style="color:var(--bad)">Reset</button></div>
    <div class="actions"><button class="btn primary" id="set-close">Done</button></div>
  </div></div>`;
  const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey); prevFocus?.focus?.(); };
  const onKey = (e) => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('.modal-back', root).onclick = (e) => { if (e.target.classList.contains('modal-back')) close(); };
  $('#set-close').onclick = close;
  $('#set-close').focus();
  $('#set-free').onchange = (e) => { settings.free = e.target.checked; route(); };
  $('#set-dark').onchange = (e) => setTheme(e.target.checked ? 'dark' : 'light');
  $('#set-logout').onclick = async () => { await api.logout(); store.user = null; store.items = {}; close(); location.hash = '#/login'; route(); };
  $('#set-reset').onclick = async () => {
    if (!confirm('Really delete ALL your progress?')) return;
    await api.reset(); await store.load(); close(); toast('Progress reset', 'reset'); route();
  };
}
function setTheme(t) {
  document.documentElement.dataset.theme = t;
  localStorage.setItem('mlf1.theme', t);
  $('#theme-btn').innerHTML = icon(t === 'dark' ? 'sun' : 'moon');
}

// ------------------------------------------------------------------ router
async function route() {
  const hash = location.hash || '#/';
  document.querySelectorAll('[data-nav]').forEach((a) => { a.classList.remove('active'); a.removeAttribute('aria-current'); });
  const nav = (k) => { const a = $(`[data-nav=${k}]`); a.classList.add('active'); a.setAttribute('aria-current', 'page'); };
  $('#settings-btn').style.visibility = store.user ? 'visible' : 'hidden';
  if (!store.user) {
    let cfg = { signupAllowed: true };
    try { cfg = await api.config(); } catch { /* ignore */ }
    viewLogin(cfg.signupAllowed && hash === '#/register' ? 'register' : 'login', cfg.signupAllowed);
    updateTopProgress();
    return;
  }
  updateTopProgress();
  let m;
  if ((m = /^#\/learn\/(.+)$/.exec(hash))) return viewItem(decodeURIComponent(m[1]));
  if (hash === '#/glossary') { nav('glossary'); return viewGlossary(); }
  if (hash === '#/cheatsheet') { nav('cheatsheet'); return viewCheatsheet(); }
  nav('home');
  return viewDashboard();
}

async function boot() {
  $('#brand-logo').innerHTML = LOGO;
  $('#theme-btn').innerHTML = icon(document.documentElement.dataset.theme === 'dark' ? 'sun' : 'moon');
  $('#settings-btn').innerHTML = icon('settings');
  $('#theme-btn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  $('#settings-btn').onclick = () => { if (store.user) openSettings(); };
  try { course = JSON.parse(await fetchText('/content/course.json')); }
  catch (e) { app.innerHTML = `<div class="page"><h1>Could not load the course</h1><p>${escapeHtml(e.message)}</p></div>`; return; }
  flat = [];
  course.units.forEach((u, ui) => u.items.forEach((it, i) => flat.push({ ...it, unitIndex: ui, index: i })));
  store.onChange(updateTopProgress);
  try { const { user } = await api.me(); store.user = user; if (user) await store.load(); } catch (e) { console.warn(e); }
  window.addEventListener('hashchange', route);
  route();
}
boot();
