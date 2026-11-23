// MLF1 Learn — main app (router + views)
import { api, store } from './api.js';
import { renderDoc, md, highlightCode, escapeHtml } from './render.js';
import { mountBlocks, usesPython } from './blocks.js';
import { py } from './py.js';

const app = document.getElementById('app');
let course = null;
let flat = []; // [{...item, unit, unitIndex, index}]
const settings = {
  get free() { return localStorage.getItem('mlf1.free') === '1'; },
  set free(v) { localStorage.setItem('mlf1.free', v ? '1' : '0'); },
};

// ------------------------------------------------------------------ utils
const $ = (sel, root = document) => root.querySelector(sel);
function toast(msg, cls = '') {
  const t = document.createElement('div'); t.className = `toast ${cls}`; t.innerHTML = msg;
  $('#toast-root').appendChild(t); setTimeout(() => t.remove(), 3200);
}
async function fetchText(url) {
  const r = await fetch(url, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`Could not load ${url} (${r.status})`);
  return r.text();
}
const TYPE_LABEL = { lesson: 'Lesson', exam: 'Exam', project: 'Project' };
const TYPE_ICON = { lesson: '📘', exam: '🎯', project: '🛠️' };

// ------------------------------------------------------------------ progression logic
function isRequired(item) { return !item.optional; }
function itemDone(item) { return store.isDone(item.id); }
function unitDone(unit) { return unit.items.filter(isRequired).every(itemDone); }
function isUnlocked(item) {
  if (settings.free) return true;
  const u = course.units[item.unitIndex];
  for (let i = 0; i < item.index; i++) { const prev = u.items[i]; if (isRequired(prev) && !itemDone(prev)) return false; }
  if (item.unitIndex > 0 && !unitDone(course.units[item.unitIndex - 1])) {
    // allow first unit item if previous unit done; units after an unfinished unit are locked
    return false;
  }
  return true;
}
function itemState(item) {
  if (itemDone(item)) return 'done';
  const p = store.get(item.id);
  if (p && (p.status === 'attempted' || p.status === 'started')) return 'partial';
  // partially done exercises
  if (store.items && Object.keys(store.items).some((k) => k.startsWith(`ex:${item.id}:`) || k.startsWith(`quiz:${item.id}:`))) return 'partial';
  return 'todo';
}
function nextUp() {
  return flat.find((it) => isRequired(it) && !itemDone(it) && isUnlocked(it)) || flat.find((it) => !itemDone(it) && isUnlocked(it));
}
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
  el.innerHTML = `<div class="bar"><i style="width:${p}%"></i></div><span>${p}%</span>`;
}

// ------------------------------------------------------------------ views
function viewLogin(mode = 'login', signupAllowed = true) {
  app.innerHTML = `<div class="auth card">
    <h1>${mode === 'login' ? 'Welcome back 👋' : 'Create your account'}</h1>
    <p>${mode === 'login' ? 'Log in to continue your MLF1 learning path. Your progress is saved on this server.' : 'Your progress (lessons, exercises, exam scores, code) is stored on this server so you can continue on any device.'}</p>
    <form id="auth-form">
      <label class="field">Username <input name="username" autocomplete="username" required minlength="3"></label>
      <label class="field">Password <input name="password" type="password" autocomplete="${mode === 'login' ? 'current-password' : 'new-password'}" required minlength="${mode === 'login' ? 1 : 8}"></label>
      <div class="err" id="auth-err"></div>
      <button class="btn primary big" style="width:100%;justify-content:center">${mode === 'login' ? 'Log in' : 'Create account'}</button>
    </form>
    ${signupAllowed ? `<div class="switch">${mode === 'login' ? 'No account yet? <a data-sw>Create one</a>' : 'Already have an account? <a data-sw>Log in</a>'}</div>` : ''}
  </div>`;
  const sw = $('[data-sw]', app);
  if (sw) sw.onclick = () => viewLogin(mode === 'login' ? 'register' : 'login', signupAllowed);
  $('#auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    try {
      const fn = mode === 'login' ? api.login : api.register;
      const { user } = await fn(fd.get('username').trim(), fd.get('password'));
      store.user = user;
      await store.load();
      if (!location.hash || location.hash === '#/login') location.hash = '#/';
      else route();
    } catch (err) { $('#auth-err').textContent = err.message; }
  };
}

function viewDashboard() {
  const c = counts();
  const nu = nextUp();
  const pct = overallPct();
  const updates = (course.updates || []).slice(0, 3);
  let html = `<div class="dash">
    <div class="hero">
      <div class="hero-main card">
        <div class="crumbs">BTI1041 · Machine Learning Foundations 1</div>
        <h1>Hi ${escapeHtml(store.user.username)}, let's learn ML step by step.</h1>
        <p>Every unit follows the course weeks: short explanations, interactive graphics, Python exercises that run in your browser, a small exam to unlock the next unit, and hands-on projects.</p>
        ${nu ? `<a class="btn primary big" href="#/learn/${nu.id}">${pct ? 'Continue' : 'Start'}: ${escapeHtml(nu.title)} →</a>` : '<span class="pill done">🎉 Everything completed!</span>'}
      </div>
      <div class="hero-side card">
        <div><div style="display:flex;justify-content:space-between;font-size:14px;margin-bottom:6px"><b>Overall progress</b><span>${pct}%</span></div><div class="bar"><i style="width:${pct}%"></i></div></div>
        <div class="stat-row">
          <div class="stat"><b>${c.lesson[0]}/${c.lesson[1]}</b><span>lessons</span></div>
          <div class="stat"><b>${c.exam[0]}/${c.exam[1]}</b><span>exams passed</span></div>
          <div class="stat"><b>${c.project[0]}/${c.project[1]}</b><span>projects</span></div>
        </div>
        ${updates.length ? `<div class="continue-box"><strong>What's new</strong><br>${updates.map((u) => `<span style="font-size:13px">• <b>${escapeHtml(u.date)}</b> — ${escapeHtml(u.text)}</span>`).join('<br>')}</div>` : ''}
      </div>
    </div>
    <div class="legend"><span class="pill lesson">📘 Lesson</span><span class="pill exam">🎯 Exam (unlocks next unit)</span><span class="pill project">🛠️ Project (optional, highly recommended)</span>${settings.free ? '<span class="pill">🔓 Free navigation is on</span>' : '<span>Items unlock in order. Turn on free navigation in ⚙ settings to jump ahead.</span>'}</div>`;
  course.units.forEach((u, ui) => {
    const req = u.items.filter(isRequired); const done = req.filter(itemDone).length;
    const locked = !isUnlocked(u.items[0]);
    const isCurrent = nu && nu.unitIndex === ui;
    const cls = ['unit', 'card', unitDone(u) ? 'done' : '', locked ? 'locked' : '', isCurrent ? 'open' : ''].join(' ');
    html += `<section class="${cls}" data-unit="${ui}">
      <div class="unit-head">
        <div class="unit-num">${unitDone(u) ? '✓' : locked ? '🔒' : ui}</div>
        <div class="unit-title"><h2>${escapeHtml(u.title)}</h2><p>${escapeHtml(u.summary || '')}</p></div>
        <div class="unit-meta">${u.weeks ? `<span class="pill week">${escapeHtml(u.weeks)}</span>` : ''}<div class="bar ${done === req.length ? 'ok' : ''}"><i style="width:${req.length ? (100 * done) / req.length : 0}%"></i></div><span>${done}/${req.length} done</span></div>
        <span class="chev">▶</span>
      </div>
      <div class="unit-items">${u.items.map((it) => itemRow(flat.find((f) => f.id === it.id))).join('')}</div>
    </section>`;
  });
  html += '</div>';
  app.innerHTML = html;
  app.querySelectorAll('.unit-head').forEach((hd) => { hd.onclick = () => hd.parentElement.classList.toggle('open'); });
}

function itemRow(it) {
  const st = itemState(it); const lock = !isUnlocked(it);
  const p = store.get(it.id);
  const score = it.type === 'exam' && p?.best_score != null ? `<span class="score ${itemDone(it) ? '' : 'fail'}">best ${Math.round(p.best_score)}%</span>` : '';
  const icon = st === 'done' ? '✓' : lock ? '🔒' : TYPE_ICON[it.type];
  return `<a class="item-row ${st} ${lock ? 'locked' : ''}" href="#/learn/${it.id}">
    <span class="ic">${icon}</span>
    <span class="t">${escapeHtml(it.title)} ${it.optional ? '<span class="pill">optional</span>' : ''}</span>
    <span class="pill ${it.type}">${TYPE_LABEL[it.type]}</span>${score}
    <span class="mins">${it.minutes ? `${it.minutes} min` : ''}</span></a>`;
}

function sidebarHtml(current) {
  return course.units.map((u, ui) => {
    const open = ui === current.unitIndex;
    return `<div class="side-unit ${open ? 'open current' : ''}"><button data-su="${ui}">${unitDone(u) ? '✅' : `<span style="opacity:.6">${ui}</span>`} ${escapeHtml(u.title)}</button>
      <div class="side-items">${u.items.map((raw) => {
        const it = flat.find((f) => f.id === raw.id); const st = itemState(it);
        return `<a class="side-item ${st} ${it.id === current.id ? 'active' : ''} ${isUnlocked(it) ? '' : 'locked'}" href="#/learn/${it.id}"><span class="dot"></span>${TYPE_ICON[it.type]} ${escapeHtml(it.title)}</a>`;
      }).join('')}</div></div>`;
  }).join('');
}

let pageCleanup = [];
async function viewItem(id) {
  const item = flat.find((f) => f.id === id);
  if (!item) { app.innerHTML = '<div class="locked-page card"><div class="big">🤔</div><h2>Page not found</h2><a class="btn" href="#/">Back to roadmap</a></div>'; return; }
  const unit = course.units[item.unitIndex];
  app.innerHTML = `<div class="learn"><aside class="sidebar">${sidebarHtml(item)}</aside><div class="content-wrap"><article class="content" id="content"><div class="loading-screen">Loading…</div></article></div></div>`;
  app.querySelectorAll('[data-su]').forEach((b) => { b.onclick = () => b.parentElement.classList.toggle('open'); });
  const content = $('#content');
  if (!isUnlocked(item)) {
    const nu = nextUp();
    content.innerHTML = `<div class="locked-page card"><div class="big">🔒</div><h2>This ${TYPE_LABEL[item.type].toLowerCase()} is still locked</h2><p>Finish the previous steps first — the path is built so that every step relies on the one before.</p>${nu ? `<a class="btn primary" href="#/learn/${nu.id}">Go to next step: ${escapeHtml(nu.title)}</a>` : ''}<p style="margin-top:16px;font-size:14px"><a href="#" id="unlock-all">Or turn on free navigation</a> (you can switch it off again in ⚙).</p></div>`;
    $('#unlock-all').onclick = (e) => { e.preventDefault(); settings.free = true; route(); };
    return;
  }
  let src;
  try { src = await fetchText(`/content/${item.file}`); } catch (e) { content.innerHTML = `<div class="callout warn">${escapeHtml(e.message)}</div>`; return; }
  const { html, blocks } = renderDoc(src);
  const meta = `<div class="crumbs"><a href="#/">Roadmap</a> › <span>Unit ${item.unitIndex} · ${escapeHtml(unit.title)}</span></div>
    <h1 class="page-title">${escapeHtml(item.title)}</h1>
    <div class="page-meta"><span class="pill ${item.type}">${TYPE_ICON[item.type]} ${TYPE_LABEL[item.type]}</span>${unit.weeks ? `<span class="pill week">${escapeHtml(unit.weeks)}</span>` : ''}${item.minutes ? `<span class="pill">⏱ ~${item.minutes} min</span>` : ''}${item.source ? `<span class="pill" title="Matching course material">📎 ${escapeHtml(item.source)}</span>` : ''}</div>`;
  const hasPy = usesPython(blocks);
  content.innerHTML = `${meta}${hasPy ? kernelBarHtml() : ''}<div class="prose" id="prose">${html}</div><div id="page-end"></div>`;
  const prose = $('#prose');
  highlightCode(prose);
  pageCleanup.forEach((fn) => fn()); pageCleanup = [];

  // requirements tracking
  const reqs = new Map();
  let anon = 0;
  const refreshComplete = () => renderCompleteBox(item, reqs);
  const exam = examController(item, () => refreshComplete());
  const ctx = {
    itemId: item.id,
    ns: item.id,
    mode: item.type === 'exam' ? 'exam' : 'lesson',
    nextAnon: () => `b${++anon}`,
    require(key, title) { reqs.set(key, { title, done: false }); return { done: () => { const r = reqs.get(key); if (r && !r.done) { r.done = true; refreshComplete(); } } }; },
    exam,
  };
  mountBlocks(prose, blocks, ctx);
  if (hasPy) setupKernelBar(item, blocks);
  if (item.type === 'exam') exam.renderControls();
  else refreshComplete();
  renderPager(item);
  window.scrollTo(0, 0);
}

function kernelBarHtml() {
  return `<div class="kernel-bar" id="kernel-bar" data-state="${py.state}"><span class="kernel-dot"></span><span class="ktext"><b>Python kernel</b> · <span id="ktext">${escapeHtml(py.statusText)}</span></span>
    <button class="btn small ghost" id="k-restart" title="Clear all variables of this page (like Kernel → Restart in Jupyter)">⟲ Restart kernel</button>
    <button class="btn small ghost" id="k-stop" title="Force-stop Python (e.g. infinite loop). Python will reload.">■ Stop</button></div>`;
}
function setupKernelBar(item, blocks) {
  const bar = $('#kernel-bar'); const txt = $('#ktext');
  const off = py.onStatus((state, text) => { if (!bar.isConnected) return; bar.dataset.state = state; txt.textContent = text; });
  pageCleanup.push(off);
  $('#k-restart').onclick = async () => { await py.resetNamespace(item.id); toast('Kernel restarted — all variables of this page were cleared.'); };
  $('#k-stop').onclick = () => { py.kill(); toast('Python stopped. It will restart when you run code.'); };
  // warm up Python + packages used on this page while the learner reads
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
    <div class="txt">${isDone ? `✓ You completed this ${TYPE_LABEL[item.type].toLowerCase()}.` : all.length ? `Activities completed: <b>${done}/${all.length}</b>${ready ? ' — great, you can mark this as complete.' : ''}<div class="checklist">${all.map((r) => `${r.done ? '✅' : '⬜'} ${escapeHtml(r.title)}`).join(' &nbsp; ')}</div>` : 'Read everything carefully, then mark this as complete.'}</div>
    ${isDone ? '' : `<button class="btn ${ready ? 'ok' : ''}" id="mark-done" ${ready ? '' : ''}>${ready ? '✓ Mark as complete' : 'Mark complete anyway'}</button>`}
  </div>`;
  const b = $('#mark-done');
  if (b) b.onclick = async () => {
    if (!ready && !confirm('Some activities are not finished yet. Mark as complete anyway?')) return;
    await store.save(item.id, { status: 'done' });
    toast(`✓ “${escapeHtml(item.title)}” completed`, 'ok');
    renderCompleteBox(item, reqs); renderPager(item);
    $('.sidebar').innerHTML = sidebarHtml(item);
  };
}

function renderPager(item) {
  let pager = $('#pager');
  if (!pager) { pager = document.createElement('div'); pager.id = 'pager'; pager.className = 'page-footer'; $('#content').appendChild(pager); }
  const i = flat.indexOf(item); const prev = flat[i - 1]; const next = flat[i + 1];
  pager.innerHTML = `${prev ? `<a class="btn ghost" href="#/learn/${prev.id}">← ${escapeHtml(prev.title)}</a>` : ''}<span class="spacer"></span>${next ? `<a class="btn ${itemDone(item) ? 'primary' : ''}" href="#/learn/${next.id}">${isUnlocked(next) ? '' : '🔒 '}${escapeHtml(next.title)} →</a>` : '<a class="btn" href="#/">Back to roadmap</a>'}`;
}

// ------------------------------------------------------------------ exam controller
function examController(item, onDone) {
  const qs = [];
  const pass = item.pass || 70;
  return {
    register(st) { qs.push(st); },
    renderControls() {
      const end = $('#page-end');
      const p = store.get(item.id);
      const top = document.createElement('div');
      const best = p?.best_score;
      top.className = `exam-banner ${best == null ? 'info' : best >= pass ? 'pass' : 'fail'}`;
      top.innerHTML = best == null
        ? `<h3>🎯 ${qs.length} questions · pass mark ${pass}%</h3><p>Answer everything, then submit at the bottom. You only see the corrections after submitting. You can retake the exam as often as you like — the best score counts.</p>`
        : `<h3>${best >= pass ? '✅ Passed' : '❌ Not passed yet'} — best score ${Math.round(best)}%</h3><p>${best >= pass ? 'The next unit is unlocked. Retake it any time to refresh your memory.' : `You need ${pass}%. Review the lessons for the questions you missed and try again.`} (attempts: ${p.attempts || 0})</p>`;
      $('#prose').prepend(top);
      end.innerHTML = '<div class="complete-box"><div class="txt" id="exam-count"></div><button class="btn primary big" id="exam-submit">Submit exam</button></div>';
      const upd = () => { const a = qs.filter((q) => q.answered()).length; const c = $('#exam-count'); if (c) c.innerHTML = `Answered <b>${a}/${qs.length}</b> questions.`; };
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
          fb.innerHTML = `<p class="q-feedback ${ok ? 'ok' : 'bad'}">${ok ? '✓ Correct' : '✗ Wrong'}${!ok && q.reveal() ? ` — ${q.reveal()}` : ''}</p>${md(q.q.explain)}`;
          q.el.appendChild(fb); highlightCode(fb);
        });
        const score = (100 * correct) / qs.length;
        const passed = score >= pass;
        await store.save(item.id, { status: passed ? 'done' : 'attempted', score, attempt: true });
        const res = document.createElement('div');
        res.className = `exam-banner ${passed ? 'pass' : 'fail'}`;
        res.innerHTML = `<h3>${passed ? '🎉 Passed!' : '😕 Not passed yet'} — ${correct}/${qs.length} correct (${Math.round(score)}%)</h3><p>${passed ? 'Well done — the next unit is now unlocked.' : `You need ${pass}%. Scroll up to read the explanations, revisit the lessons, then retake.`}</p>`;
        end.innerHTML = '';
        end.appendChild(res);
        const again = document.createElement('div');
        again.className = 'page-footer';
        again.innerHTML = '<button class="btn" id="retake">↺ Retake exam (new order)</button><span class="spacer"></span>';
        end.appendChild(again);
        $('#retake').onclick = () => viewItem(item.id);
        renderPager(item);
        $('.sidebar').innerHTML = sidebarHtml(item);
        res.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
  app.innerHTML = `<div class="glossary"><h1>Glossary</h1><p style="color:var(--text-soft)">Every important term of the course in plain words. Lost in a lecture? Search here first.</p><input class="search" placeholder="Search ${terms.length} terms… (e.g. epoch, recall, kernel)" autofocus><div id="gl-list"></div></div>`;
  const list = $('#gl-list');
  const draw = (q) => {
    const f = q.toLowerCase();
    list.innerHTML = terms.filter((t) => !f || t.term.toLowerCase().includes(f) || (t.def || '').toLowerCase().includes(f) || (t.aka || '').toLowerCase().includes(f))
      .map((t) => `<div class="gl-term card"><h3>${escapeHtml(t.term)} ${t.aka ? `<span class="pill">${escapeHtml(t.aka)}</span>` : ''} ${t.week ? `<span class="pill week">${escapeHtml(t.week)}</span>` : ''}</h3><div>${md(t.def)}</div>${t.see ? `<div class="see">→ <a href="#/learn/${t.see}">${escapeHtml(flat.find((x) => x.id === t.see)?.title || 'lesson')}</a></div>` : ''}</div>`).join('') || '<p>No match.</p>';
  };
  $('.search', app).oninput = (e) => draw(e.target.value);
  draw('');
}

async function viewCheatsheet() {
  const src = await fetchText('/content/cheatsheet.md');
  const { html } = renderDoc(src);
  app.innerHTML = `<div class="glossary"><div class="prose">${html}</div></div>`;
  highlightCode(app);
}

// ------------------------------------------------------------------ settings modal
function openSettings() {
  const root = $('#modal-root');
  root.innerHTML = `<div class="modal-back"><div class="modal card">
    <h2>Settings</h2>
    <div class="row"><div>Free navigation<small>Open any lesson without completing the previous ones (useful to jump to the current course week).</small></div><label class="switch-toggle"><input type="checkbox" id="set-free" ${settings.free ? 'checked' : ''}><span></span></label></div>
    <div class="row"><div>Dark mode</div><label class="switch-toggle"><input type="checkbox" id="set-dark" ${document.documentElement.dataset.theme === 'dark' ? 'checked' : ''}><span></span></label></div>
    <div class="row"><div>Logged in as <b>${escapeHtml(store.user?.username || '')}</b></div><button class="btn small" id="set-logout">Log out</button></div>
    <div class="row"><div>Reset all progress<small>Deletes completed lessons, exam scores and saved code. Cannot be undone.</small></div><button class="btn small" id="set-reset" style="color:var(--bad)">Reset</button></div>
    <div class="actions"><button class="btn primary" id="set-close">Close</button></div>
  </div></div>`;
  const close = () => { root.innerHTML = ''; };
  $('.modal-back', root).onclick = (e) => { if (e.target.classList.contains('modal-back')) close(); };
  $('#set-close').onclick = close;
  $('#set-free').onchange = (e) => { settings.free = e.target.checked; route(); };
  $('#set-dark').onchange = (e) => setTheme(e.target.checked ? 'dark' : 'light');
  $('#set-logout').onclick = async () => { await api.logout(); store.user = null; store.items = {}; close(); location.hash = '#/login'; route(); };
  $('#set-reset').onclick = async () => {
    if (!confirm('Really delete ALL your progress?')) return;
    await api.reset(); await store.load(); close(); toast('Progress reset.'); route();
  };
}
function setTheme(t) { document.documentElement.dataset.theme = t; localStorage.setItem('mlf1.theme', t); }

// ------------------------------------------------------------------ router
async function route() {
  const hash = location.hash || '#/';
  document.querySelectorAll('[data-nav]').forEach((a) => a.classList.remove('active'));
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
  if (hash === '#/glossary') { $('[data-nav=glossary]').classList.add('active'); return viewGlossary(); }
  if (hash === '#/cheatsheet') { $('[data-nav=cheatsheet]').classList.add('active'); return viewCheatsheet(); }
  $('[data-nav=home]').classList.add('active');
  return viewDashboard();
}

async function boot() {
  $('#theme-btn').onclick = () => setTheme(document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark');
  $('#settings-btn').onclick = () => { if (store.user) openSettings(); };
  try {
    course = JSON.parse(await fetchText('/content/course.json'));
  } catch (e) { app.innerHTML = `<div class="locked-page card"><h2>Could not load the course</h2><p>${escapeHtml(e.message)}</p></div>`; return; }
  flat = [];
  course.units.forEach((u, ui) => u.items.forEach((it, i) => flat.push({ ...it, unitIndex: ui, index: i })));
  store.onChange(updateTopProgress);
  try {
    const { user } = await api.me();
    store.user = user;
    if (user) await store.load();
  } catch (e) { console.warn(e); }
  window.addEventListener('hashchange', route);
  route();
}
boot();
