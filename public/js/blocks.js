// Interactive blocks: exercises, runnable code cells, quizzes, callouts, reveals, viz.
/* global CodeMirror */
import { md, mdInline, sections, escapeHtml, highlightCode } from './render.js';
import { py, explainError } from './py.js';
import { store, saveDebounced } from './api.js';
import { VIZ } from './viz.js';
import { icon } from './icons.js';

const h = (tag, attrs = {}, html = '') => {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') el.className = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) el.setAttribute(k, v === true ? '' : v);
  }
  if (html) el.innerHTML = html;
  return el;
};

function makeEditor(parent, code, onRun) {
  const wrap = h('div', { class: 'editor-wrap' });
  parent.appendChild(wrap);
  const cm = CodeMirror(wrap, {
    value: code,
    mode: 'python',
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    matchBrackets: true,
    viewportMargin: Infinity,
    extraKeys: {
      Tab: (c) => (c.somethingSelected() ? c.indentSelection('add') : c.replaceSelection('    ', 'end')),
      'Shift-Tab': (c) => c.indentSelection('subtract'),
      'Ctrl-Enter': () => onRun(),
      'Cmd-Enter': () => onRun(),
      'Shift-Enter': () => onRun(),
      'Ctrl-/': (c) => toggleComment(c),
    },
  });
  setTimeout(() => cm.refresh(), 0);
  return cm;
}

function toggleComment(cm) {
  const from = cm.getCursor('from').line, to = cm.getCursor('to').line;
  const lines = [];
  for (let i = from; i <= to; i++) lines.push(cm.getLine(i));
  const allCommented = lines.every((l) => /^\s*#/.test(l) || !l.trim());
  cm.operation(() => {
    for (let i = from; i <= to; i++) {
      const l = cm.getLine(i);
      if (!l.trim()) continue;
      const nl = allCommented ? l.replace(/^(\s*)# ?/, '$1') : l.replace(/^(\s*)/, '$1# ');
      cm.replaceRange(nl, { line: i, ch: 0 }, { line: i, ch: l.length });
    }
  });
}

export function renderOutputs(container, res, { showError = true } = {}) {
  container.innerHTML = '';
  for (const o of res.outputs || []) {
    if (o.type === 'stdout' || o.type === 'result') container.appendChild(h('div', { class: `out ${o.type}` }, escapeHtml(o.text)));
    else if (o.type === 'stderr') container.appendChild(h('div', { class: 'out stderr' }, escapeHtml(o.text)));
    else if (o.type === 'html') container.appendChild(h('div', { class: 'out html' }, o.html));
    else if (o.type === 'image') {
      const d = h('div', { class: 'out img' });
      d.appendChild(h('img', { src: `data:image/png;base64,${o.png}`, alt: 'plot' }));
      container.appendChild(d);
    }
  }
  if (showError && res.error) container.appendChild(errorBox(res.error));
}

function errorBox(err, lineOffsetLabel = '') {
  const tr = (err.trace || []).map((t) => `line ${t.lineno}${lineOffsetLabel}: ${escapeHtml(t.line.trim())}`).join('\n');
  const ex = explainError(err);
  return h('div', { class: 'error-box' },
    `<span class="ename">${escapeHtml(err.ename)}</span>: ${escapeHtml(err.evalue)}`
    + (tr ? `<pre>${tr}</pre>` : '')
    + (ex ? `<div class="explain">${icon('info')}<span>${ex}</span></div>` : ''));
}

// checker messages: plain text, `code` spans only (no markdown emphasis on * or _)
function plainMsg(t) {
  return escapeHtml(t).replace(/`([^`]+)`/g, '<code>$1</code>');
}

// ------------------------------------------------------------------ exercise
function mountExercise(slot, block, ctx) {
  const s = sections(block.body);
  const exId = `ex:${ctx.itemId}:${block.attrs.id || ctx.nextAnon()}`;
  const hasCheck = !!s.check;
  const hints = Object.keys(s).filter((k) => /^hint\d*$/.test(k)).map((k) => s[k]);
  const saved = store.get(exId);
  const starter = s.starter ?? '';
  let code = saved?.data?.code ?? starter;
  let hintsShown = 0;
  let failures = 0;
  const req = ctx.require(exId, block.attrs.title || 'Exercise');

  const box = h('div', { class: 'blk-box exercise', id: block.attrs.id ? `ex-${block.attrs.id}` : null });
  const head = h('div', { class: 'blk-head' },
    `<span class="badge ex">${block.attrs.kind === 'project' || ctx.project ? 'Step' : 'Exercise'} ${String(ctx.nextNumber ? ctx.nextNumber('exercise') : '').padStart(2, '0')}</span><span class="blk-title">${mdInline(block.attrs.title || '')}</span><span class="blk-status"></span>`);
  const body = h('div', { class: 'blk-body' });
  box.append(head, body);
  if (s.task || s._) {
    const task = h('div', { class: 'task' }, md(s.task || s._));
    body.appendChild(task);
    highlightCode(task);
  }
  let cm;
  const run = () => doRun(false);
  cm = makeEditor(body, code, run);
  cm.on('change', () => {
    code = cm.getValue();
    saveDebounced(exId, { data: { code } });
  });

  const actions = h('div', { class: 'code-actions' });
  const runBtn = h('button', { class: 'btn', title: 'Run (Shift+Enter)' }, `${icon('play')} Run`);
  const checkBtn = hasCheck ? h('button', { class: 'btn primary' }, `${icon('check')} Check`) : null;
  const hintBtn = hints.length ? h('button', { class: 'btn ghost' }, `${icon('hint')} Hint <span class="kbd-hint">${hints.length}</span>`) : null;
  const solBtn = s.solution ? h('button', { class: 'btn ghost' }, `${icon('eye')} Solution`) : null;
  const resetBtn = h('button', { class: 'btn ghost small', title: 'Restore the starter code', 'aria-label': 'Reset code' }, `${icon('reset')} Reset`);
  actions.append(runBtn);
  if (checkBtn) actions.append(checkBtn);
  if (hintBtn) actions.append(hintBtn);
  if (solBtn) actions.append(solBtn);
  actions.append(h('span', { class: 'spacer' }), h('span', { class: 'kbd-hint' }, 'Shift+Enter to run'), resetBtn);
  body.appendChild(actions);
  const outputs = h('div', { class: 'outputs' });
  const feedback = h('div');
  const extra = h('div');
  body.append(outputs, feedback, extra);

  const setDone = (d) => {
    head.querySelector('.blk-status').className = `blk-status ${d ? 'ok' : ''}`;
    head.querySelector('.blk-status').innerHTML = d ? `${icon('check')} done` : '';
  };
  setDone(store.isDone(exId));
  if (store.isDone(exId)) req.done();

  async function doRun(check) {
    if (py.busy && py.state === 'busy') return;
    runBtn.disabled = true; if (checkBtn) checkBtn.disabled = true;
    feedback.innerHTML = '';
    outputs.innerHTML = '<div class="out" style="color:var(--ink-3)">running…</div>';
    const scan = `${s.setup || ''}\n${s.check || ''}`;
    try {
      if (s.setup) {
        const r0 = await py.run(s.setup, ctx.ns, { mode: 'setup', scan });
        if (!r0.ok) { renderOutputs(outputs, r0); feedback.innerHTML = '<div class="feedback bad"><b>Setup failed.</b> This is a problem with the exercise, not your code — try “Restart kernel”.</div>'; return; }
      }
      const res = await py.run(cm.getValue(), ctx.ns, { mode: 'cell', scan });
      renderOutputs(outputs, res);
      if (!res.ok) {
        if (check) { failures++; feedback.innerHTML = '<div class="feedback bad"><b>Your code raised an error</b> — fix it first, then check again.</div>'; }
        return;
      }
      if (!hasCheck) {
        if (!store.isDone(exId)) { store.save(exId, { status: 'done', data: { code: cm.getValue() } }); setDone(true); req.done(); }
        return;
      }
      if (!check) return;
      const cr = await py.run(s.check, ctx.ns, { mode: 'check', captured: res.stdout || '' });
      if (cr.ok) {
        feedback.innerHTML = `<div class="feedback ok">${icon('check')}<span>Correct. ${s.success ? mdInline(s.success) : ''}</span></div>`;
        store.save(exId, { status: 'done', data: { code: cm.getValue() }, attempt: true });
        setDone(true); req.done();
      } else {
        failures++;
        const msg = cr.error?.ename === 'AssertionError' && cr.error.evalue
          ? plainMsg(cr.error.evalue)
          : `The checker hit <code>${escapeHtml(cr.error?.ename || 'an error')}: ${escapeHtml(cr.error?.evalue || '')}</code> — usually a variable is missing or has the wrong type.`;
        feedback.innerHTML = `<div class="feedback bad"><b>Not yet.</b> ${msg}${failures >= 2 && hints.length && hintsShown < hints.length ? ' <i>Stuck? Try a hint.</i>' : ''}</div>`;
        store.save(exId, { status: 'started', data: { code: cm.getValue() }, attempt: true });
      }
    } catch (e) {
      outputs.innerHTML = '';
      feedback.innerHTML = `<div class="feedback bad"><b>Kernel problem:</b> ${escapeHtml(e.message)}</div>`;
    } finally {
      runBtn.disabled = false; if (checkBtn) checkBtn.disabled = false;
    }
  }

  runBtn.onclick = () => doRun(false);
  if (checkBtn) checkBtn.onclick = () => doRun(true);
  if (hintBtn) hintBtn.onclick = () => {
    if (hintsShown >= hints.length) return;
    const hb = h('div', { class: 'hint-box' }, `<div class="h-title">Hint ${hintsShown + 1}/${hints.length}</div>${md(hints[hintsShown])}`);
    highlightCode(hb);
    extra.appendChild(hb);
    hintsShown++;
    hintBtn.innerHTML = hintsShown < hints.length ? `${icon('hint')} Next hint <span class="kbd-hint">${hints.length - hintsShown}</span>` : `${icon('hint')} No more hints`;
    if (hintsShown >= hints.length) hintBtn.disabled = true;
  };
  if (solBtn) solBtn.onclick = () => {
    if (!store.isDone(exId) && failures < 1 && !confirm('Try it yourself first? Click OK to reveal the solution anyway.')) return;
    if (extra.querySelector('.solution-box')) return;
    const sb = h('div', { class: 'solution-box' }, '<div class="h-title">One possible solution</div>');
    const pre = h('pre'); const c = h('code', { class: 'language-python' }); c.textContent = s.solution; pre.appendChild(c);
    sb.appendChild(pre);
    const use = h('button', { class: 'btn small' }, 'Copy into editor');
    use.onclick = () => cm.setValue(s.solution);
    sb.appendChild(use);
    if (s.explanation) sb.appendChild(h('div', { class: 'q-explain' }, md(s.explanation)));
    extra.appendChild(sb);
    highlightCode(sb);
  };
  resetBtn.onclick = () => { if (confirm('Replace your code with the starter code?')) cm.setValue(starter); };

  slot.replaceWith(box);
  setTimeout(() => cm.refresh(), 50);
}

// ------------------------------------------------------------------ runnable code cell
function mountCode(slot, block, ctx) {
  const s = sections(block.body);
  const src = s.code ?? s._ ?? '';
  const box = h('div', { class: 'blk-box codecell' });
  const head = h('div', { class: 'blk-head' }, `<span class="badge code">Run</span><span class="blk-title">${mdInline(block.attrs.title || 'Run this code — then change it and run again')}</span><span class="blk-status mono"></span>`);
  const body = h('div', { class: 'blk-body' });
  box.append(head, body);
  if (s.task) body.appendChild(h('div', { class: 'task' }, md(s.task)));
  let cm;
  const outputs = h('div', { class: 'outputs' });
  const runIt = async () => {
    btn.disabled = true;
    outputs.innerHTML = '<div class="out" style="color:var(--ink-3)">running…</div>';
    try {
      if (s.setup) await py.run(s.setup, ctx.ns, { mode: 'setup' });
      const res = await py.run(cm.getValue(), ctx.ns, { mode: 'cell' });
      renderOutputs(outputs, res);
      head.querySelector('.blk-status').textContent = `[${res.execCount}]`;
    } catch (e) {
      outputs.innerHTML = `<div class="feedback bad">${escapeHtml(e.message)}</div>`;
    } finally { btn.disabled = false; }
  };
  cm = makeEditor(body, src, runIt);
  const actions = h('div', { class: 'code-actions' });
  const btn = h('button', { class: 'btn' }, `${icon('play')} Run`);
  btn.onclick = runIt;
  const reset = h('button', { class: 'btn ghost small', 'aria-label': 'Restore original code' }, `${icon('reset')} Original`);
  reset.onclick = () => cm.setValue(src);
  actions.append(btn, h('span', { class: 'spacer' }), h('span', { class: 'kbd-hint' }, 'Shift+Enter to run'), reset);
  body.append(actions, outputs);
  slot.replaceWith(box);
  setTimeout(() => cm.refresh(), 50);
}

// ------------------------------------------------------------------ quiz
export function parseQuiz(body) {
  const qs = [];
  let q = null, zone = 'q';
  for (const raw of body.split('\n')) {
    const line = raw.replace(/\s+$/, '');
    if (/^\?\s/.test(line)) { q = { text: line.slice(2), opts: [], explain: '', answer: null }; qs.push(q); zone = 'q'; continue; }
    if (!q) continue;
    let m;
    if ((m = /^([+-])\s(.*)$/.exec(line))) { q.opts.push({ text: m[2], correct: m[1] === '+' }); zone = 'o'; continue; }
    if ((m = /^=\s*(\S+)(?:\s+(?:tol=|±)(\S+))?/.exec(line))) { q.answer = parseNum(m[1]); q.tol = m[2] ? Number(m[2]) : null; q.answerText = m[1]; zone = 'a'; continue; }
    if (/^>\s?/.test(line)) { q.explain += `${line.replace(/^>\s?/, '')}\n`; zone = 'e'; continue; }
    if (zone === 'q') q.text += `\n${line}`;
    else if (zone === 'o' && line.trim()) q.opts[q.opts.length - 1].text += ` ${line.trim()}`;
    else if (zone === 'e') q.explain += `${line}\n`;
  }
  for (const x of qs) x.kind = x.answer != null ? 'num' : (x.opts.filter((o) => o.correct).length > 1 ? 'multi' : 'single');
  return qs;
}

function parseNum(s) {
  if (s == null) return NaN;
  let t = String(s).trim().replace(/\s/g, '').replace(',', '.').replace(/[’']/g, '');
  let pct = false;
  if (t.endsWith('%')) { pct = true; t = t.slice(0, -1); }
  let v;
  const fr = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(t);
  if (fr) v = Number(fr[1]) / Number(fr[2]);
  else v = Number(t);
  return pct ? v / 100 : v;
}

function numCorrect(q, input) {
  const raw = String(input).trim();
  let v = parseNum(raw);
  if (Number.isNaN(v)) return false;
  const tol = q.tol ?? Math.max(Math.abs(q.answer) * 0.01, 0.005);
  if (Math.abs(v - q.answer) <= tol) return true;
  // accept percent written as number (e.g. 80 for 0.8) only if user typed %
  if (/%$/.test(raw)) return false;
  return false;
}

function shuffle(a) { const b = [...a]; for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; }

function renderQuestion(q, idx, { exam }) {
  const wrap = h('div', { class: 'q' });
  wrap.appendChild(h('div', { class: 'q-text' }, `<span class="q-num">Q${idx + 1}.</span>${md(q.text).replace(/^<p>/, '<span>').replace(/<\/p>\n?$/, '</span>')}`));
  highlightCode(wrap);
  const name = `q${Math.random().toString(36).slice(2)}`;
  const opts = exam ? shuffle(q.opts) : q.opts;
  const state = { get: null, el: wrap, q };
  if (q.kind === 'num') {
    const row = h('div', { class: 'q-num-input' });
    const inp = h('input', { type: 'text', inputmode: 'decimal', placeholder: 'Your answer' });
    row.appendChild(inp);
    wrap.appendChild(row);
    state.get = () => inp.value;
    state.input = inp;
    state.grade = () => {
      const ok = numCorrect(q, inp.value);
      inp.classList.toggle('correct', ok); inp.classList.toggle('wrong', !ok);
      return ok;
    };
    state.clear = () => inp.classList.remove('correct', 'wrong');
    state.answered = () => inp.value.trim() !== '';
    state.lock = () => { inp.disabled = true; };
    state.reveal = () => `Correct answer: <b>${escapeHtml(q.answerText)}</b>`;
  } else {
    const box = h('div', { class: 'q-opts' });
    const inputs = [];
    opts.forEach((o) => {
      const lab = h('label', { class: 'q-opt' });
      const inp = h('input', { type: q.kind === 'multi' ? 'checkbox' : 'radio', name });
      inp._opt = o;
      lab.appendChild(inp);
      lab.appendChild(h('span', {}, mdInline(o.text)));
      inp.addEventListener('change', () => {
        inputs.forEach((i) => i.parentElement.classList.toggle('selected', i.checked));
        state.onChange?.();
      });
      inputs.push(inp);
      box.appendChild(lab);
    });
    if (q.kind === 'multi') wrap.appendChild(h('div', { class: 'kbd-hint' }, 'Select all that apply.'));
    wrap.appendChild(box);
    state.grade = () => {
      let ok = true;
      inputs.forEach((i) => {
        const lab = i.parentElement;
        lab.classList.remove('correct', 'wrong', 'missed');
        if (i.checked && i._opt.correct) lab.classList.add('correct');
        else if (i.checked && !i._opt.correct) { lab.classList.add('wrong'); ok = false; }
        else if (!i.checked && i._opt.correct) { ok = false; if (exam) lab.classList.add('missed'); }
      });
      return ok;
    };
    state.clear = () => inputs.forEach((i) => i.parentElement.classList.remove('correct', 'wrong', 'missed'));
    state.answered = () => inputs.some((i) => i.checked);
    state.lock = () => inputs.forEach((i) => { i.disabled = true; });
    state.reveal = () => '';
    state.markMissed = () => inputs.forEach((i) => { if (!i.checked && i._opt.correct) i.parentElement.classList.add('missed'); });
  }
  return state;
}

function mountQuiz(slot, block, ctx) {
  const qs = parseQuiz(block.body);
  const exam = ctx.mode === 'exam';
  const box = h('div', { class: 'blk-box quiz' });
  const quizId = `quiz:${ctx.itemId}:${block.attrs.id || ctx.nextAnon()}`;
  const title = block.attrs.title || (exam ? 'Questions' : 'Check your understanding');
  const head = h('div', { class: 'blk-head' }, `<span class="badge quiz">${exam ? 'Exam' : 'Quiz'}</span><span class="blk-title">${escapeHtml(title)}</span><span class="blk-status"></span>`);
  const body = h('div', { class: 'blk-body' });
  box.append(head, body);
  const states = qs.map((q, i) => renderQuestion(q, (block.attrs.start ? Number(block.attrs.start) - 1 : 0) + i, { exam }));
  states.forEach((st) => body.appendChild(st.el));

  if (exam) {
    states.forEach((st) => ctx.exam.register(st));
    slot.replaceWith(box);
    return;
  }

  const req = ctx.require(quizId, title);
  const solved = new Set();
  const finish = () => {
    if (solved.size === qs.length) {
      head.querySelector('.blk-status').className = 'blk-status ok';
      head.querySelector('.blk-status').innerHTML = `${icon('check')} all correct`;
      if (!store.isDone(quizId)) store.save(quizId, { status: 'done' });
      req.done();
    } else {
      head.querySelector('.blk-status').textContent = `${solved.size}/${qs.length}`;
    }
  };
  states.forEach((st, i) => {
    const actions = h('div', { class: 'q-actions' });
    const btn = h('button', { class: 'btn small primary' }, 'Check');
    const fb = h('span', { class: 'q-feedback' });
    actions.append(btn, fb);
    const exp = h('div');
    st.el.append(actions, exp);
    let tries = 0;
    btn.onclick = () => {
      if (!st.answered()) { fb.className = 'q-feedback bad'; fb.textContent = 'Pick an answer first.'; return; }
      tries++;
      const ok = st.grade();
      fb.className = `q-feedback ${ok ? 'ok' : 'bad'}`;
      fb.innerHTML = ok ? 'correct' : (tries >= 2 ? 'not quite — see the explanation' : 'not quite — try again');
      if (ok || tries >= 2) {
        const extraTxt = !ok && st.reveal() ? `<p>${st.reveal()}</p>` : '';
        if (!ok && st.markMissed) st.markMissed();
        if (st.q.explain.trim() || extraTxt) { exp.innerHTML = `<div class="q-explain">${extraTxt}${md(st.q.explain)}</div>`; highlightCode(exp); }
      }
      if (ok) { solved.add(i); finish(); }
    };
    st.onChange = () => { st.clear(); fb.textContent = ''; };
  });
  if (store.isDone(quizId)) {
    head.querySelector('.blk-status').className = 'blk-status ok';
    head.querySelector('.blk-status').innerHTML = `${icon('check')} done`;
    req.done();
  } else finish();
  slot.replaceWith(box);
}

// ------------------------------------------------------------------ callouts, reveal, viz
const CALLOUTS = { note: ['info', 'Note'], tip: ['hint', 'Tip'], warn: ['alert', 'Watch out'], key: ['key', 'Key idea'], exam: ['target', 'Exam focus'] };

function mountCallout(slot, block) {
  const el = h('div', { class: `callout ${block.type}` }, `<div class="callout-title">${icon(CALLOUTS[block.type][0])}${escapeHtml(block.attrs.title || CALLOUTS[block.type][1])}</div>${md(block.body)}`);
  highlightCode(el);
  slot.replaceWith(el);
}

function mountReveal(slot, block) {
  const el = h('details', { class: 'reveal' }, `<summary>${escapeHtml(block.attrs.title || 'Show answer')}</summary>${md(block.body)}`);
  highlightCode(el);
  slot.replaceWith(el);
}

function mountViz(slot, block) {
  const name = block.attrs.name;
  const fn = VIZ[name];
  const box = h('div', { class: 'blk-box' });
  const head = h('div', { class: 'blk-head' }, `<span class="badge viz">Interactive</span><span class="blk-title">${escapeHtml(block.attrs.title || (fn && fn.title) || name)}</span>`);
  const body = h('div', { class: 'viz' });
  box.append(head, body);
  slot.replaceWith(box);
  if (!fn) { body.textContent = `Unknown visualisation: ${name}`; return; }
  try { fn(body, block.attrs, block.body); }
  catch (e) { console.error(e); body.textContent = `Visualisation error: ${e.message}`; }
  if (block.body && fn.caption !== false && block.body.trim() && !fn.usesBody) body.appendChild(h('div', { class: 'viz-note' }, md(block.body)));
}

export function mountBlocks(root, blocks, ctx) {
  root.querySelectorAll('.blk-slot').forEach((slot) => {
    const block = blocks[Number(slot.dataset.i)];
    switch (block.type) {
      case 'exercise': return mountExercise(slot, block, ctx);
      case 'code': return mountCode(slot, block, ctx);
      case 'quiz': return mountQuiz(slot, block, ctx);
      case 'viz': return mountViz(slot, block, ctx);
      case 'reveal': return mountReveal(slot, block);
      default:
        if (CALLOUTS[block.type]) return mountCallout(slot, block);
        slot.replaceWith(h('div', { class: 'callout warn' }, `Unknown block type: ${escapeHtml(block.type)}`));
    }
  });
}

export function usesPython(blocks) {
  return blocks.some((b) => b.type === 'exercise' || b.type === 'code');
}
