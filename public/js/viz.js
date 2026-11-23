// Interactive visualisations. Each entry: fn(el, attrs, body).
// Pure SVG + vanilla JS, no dependencies.

// ---------------------------------------------------------------- helpers
const fmt = (v, d = 2) => (Number.isFinite(v) ? Number(v).toFixed(d) : '∞');
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function rng(seed = 1) { return () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(r) { let u = 0, v = 0; while (u === 0) u = r(); while (v === 0) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
const C = (i) => `var(--c${(i % 6) + 1})`;

function niceTicks(a, b, n = 6) {
  const span = b - a; if (span <= 0) return [a];
  const step0 = span / n; const mag = 10 ** Math.floor(Math.log10(step0));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => span / s <= n) || mag * 10;
  const out = []; for (let v = Math.ceil(a / step) * step; v <= b + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

function frame({ w = 640, h = 340, m = { l: 54, r: 18, t: 14, b: 42 }, x, y }) {
  const sx = (v) => m.l + ((v - x[0]) / (x[1] - x[0])) * (w - m.l - m.r);
  const sy = (v) => h - m.b - ((v - y[0]) / (y[1] - y[0])) * (h - m.t - m.b);
  const ix = (px) => x[0] + ((px - m.l) / (w - m.l - m.r)) * (x[1] - x[0]);
  const iy = (py) => y[0] + ((h - m.b - py) / (h - m.t - m.b)) * (y[1] - y[0]);
  const axes = (xl = '', yl = '', o = {}) => {
    let s = '';
    const xt = o.xt || niceTicks(x[0], x[1], o.nx || 7), yt = o.yt || niceTicks(y[0], y[1], o.ny || 5);
    for (const t of xt) s += `<line class="grid" x1="${sx(t)}" x2="${sx(t)}" y1="${m.t}" y2="${h - m.b}"/><text x="${sx(t)}" y="${h - m.b + 16}" text-anchor="middle">${o.fx ? o.fx(t) : t}</text>`;
    for (const t of yt) s += `<line class="grid" x1="${m.l}" x2="${w - m.r}" y1="${sy(t)}" y2="${sy(t)}"/><text x="${m.l - 7}" y="${sy(t) + 4}" text-anchor="end">${o.fy ? o.fy(t) : t}</text>`;
    s += `<line class="axis" x1="${m.l}" x2="${w - m.r}" y1="${h - m.b}" y2="${h - m.b}"/><line class="axis" x1="${m.l}" x2="${m.l}" y1="${m.t}" y2="${h - m.b}"/>`;
    if (xl) s += `<text x="${(m.l + w - m.r) / 2}" y="${h - 6}" text-anchor="middle" style="font-weight:600">${xl}</text>`;
    if (yl) s += `<text transform="translate(14 ${(m.t + h - m.b) / 2}) rotate(-90)" text-anchor="middle" style="font-weight:600">${yl}</text>`;
    return s;
  };
  return { w, h, m, sx, sy, ix, iy, axes, x, y };
}
const svgOpen = (f, extra = '') => `<svg viewBox="0 0 ${f.w} ${f.h}" ${extra}>`;

function el(html) { const d = document.createElement('div'); d.innerHTML = html.trim(); return d.firstElementChild; }
function controls(root, html) { const c = el(`<div class="viz-controls">${html}</div>`); root.appendChild(c); return c; }
function slider(id, label, min, max, step, val) {
  return `<label>${label} <input type="range" data-k="${id}" min="${min}" max="${max}" step="${step}" value="${val}"><output data-o="${id}">${val}</output></label>`;
}
function bindSliders(root, state, onChange, fmts = {}) {
  root.querySelectorAll('input[type=range][data-k]').forEach((inp) => {
    const k = inp.dataset.k; const out = root.querySelector(`output[data-o="${k}"]`);
    const upd = () => { state[k] = Number(inp.value); if (out) out.textContent = fmts[k] ? fmts[k](state[k]) : inp.value; onChange(k); };
    inp.addEventListener('input', upd);
    state[k] = Number(inp.value); if (out) out.textContent = fmts[k] ? fmts[k](state[k]) : inp.value;
  });
}
function readout(items) { return `<div class="viz-readout">${items.map(([k, v]) => `<div class="ro">${k}<b>${v}</b></div>`).join('')}</div>`; }
function svgPoint(evt, svg) { const pt = svg.createSVGPoint(); pt.x = evt.clientX; pt.y = evt.clientY; return pt.matrixTransform(svg.getScreenCTM().inverse()); }

export const VIZ = {};

// ================================================================ kernel (simulated notebook)
VIZ.kernel = (root, attrs) => {
  const presets = {
    state: [
      { src: 'x = 10', run: (m) => { m.x = 10; } },
      { src: 'x = x + 1', run: (m) => { need(m, 'x'); m.x += 1; } },
      { src: 'print(x)', run: (m) => { need(m, 'x'); return String(m.x); } },
    ],
    order: [
      { src: 'price = 100', run: (m) => { m.price = 100; } },
      { src: 'final_price = price * discount\nprint(f"Final price: CHF {final_price:.2f}")', run: (m) => { need(m, 'price'); need(m, 'discount'); m.final_price = m.price * m.discount; return `Final price: CHF ${m.final_price.toFixed(2)}`; } },
      { src: 'discount = 0.80', run: (m) => { m.discount = 0.8; } },
    ],
    secret: [
      { src: 'secret_number = 42', run: (m) => { m.secret_number = 42; }, deletable: true },
      { src: 'print(secret_number)', run: (m) => { need(m, 'secret_number'); return String(m.secret_number); } },
    ],
  };
  function need(m, k) { if (!(k in m)) throw new Error(`NameError: name '${k}' is not defined`); }
  const cells = (presets[attrs.preset] || presets.state).map((c) => ({ ...c, count: null, out: '', err: false, deleted: false }));
  let mem = {}; let counter = 0; let changed = null;
  const wrap = el('<div class="simnb"><div class="cells"></div><div><div class="simmem"></div><div class="viz-controls" style="margin-top:10px"></div></div></div>');
  root.appendChild(wrap);
  const cellsEl = wrap.querySelector('.cells'), memEl = wrap.querySelector('.simmem'), ctl = wrap.querySelector('.viz-controls');
  ctl.innerHTML = '<button class="btn small" data-a="restart">⟲ Restart kernel</button><button class="btn small primary" data-a="runall">⏩ Restart &amp; Run All</button>';
  function runCell(c) {
    counter++; c.count = counter;
    const before = JSON.stringify(mem);
    try { const o = c.run(mem); c.out = o ?? ''; c.err = false; } catch (e) { c.out = e.message; c.err = true; }
    changed = before !== JSON.stringify(mem) ? Object.keys(mem) : null;
    return !c.err;
  }
  function draw() {
    cellsEl.innerHTML = '';
    cells.forEach((c, i) => {
      if (c.deleted) return;
      const row = el(`<div class="simcell"><div class="prompt">[${c.count ?? ' '}]:</div><div class="src"></div><button class="btn small" title="Run this cell">▶</button></div>`);
      const src = row.querySelector('.src'); src.textContent = c.src;
      if (c.out) { const o = document.createElement('span'); o.className = `simout${c.err ? ' err' : ''}`; o.textContent = c.out; src.appendChild(o); }
      row.querySelector('button').onclick = () => { runCell(c); draw(); };
      if (c.deletable) { const d = el('<button class="btn small ghost" title="Delete this cell">🗑</button>'); d.onclick = () => { c.deleted = true; draw(); }; row.appendChild(d); }
      cellsEl.appendChild(row);
    });
    const keys = Object.keys(mem);
    memEl.innerHTML = `<h4>🧠 Kernel memory (variables)</h4>${keys.length ? keys.map((k) => `<div class="var${changed && changed.includes(k) ? ' flash' : ''}"><span>${k}</span><span>${typeof mem[k] === 'number' ? +mem[k].toFixed(4) : mem[k]}</span></div>`).join('') : '<div style="color:var(--text-faint)">(empty)</div>'}<h4 style="margin-top:10px">Execution counter: ${counter}</h4>`;
    changed = null;
  }
  ctl.querySelector('[data-a=restart]').onclick = () => { mem = {}; counter = 0; cells.forEach((c) => { c.count = null; c.out = ''; c.err = false; }); draw(); };
  ctl.querySelector('[data-a=runall]').onclick = () => {
    mem = {}; counter = 0; cells.forEach((c) => { c.count = null; c.out = ''; c.err = false; });
    for (const c of cells) { if (c.deleted) continue; if (!runCell(c)) break; }
    draw();
  };
  draw();
};
VIZ.kernel.title = 'A simulated notebook: cells vs. kernel memory';

// ================================================================ linreg
VIZ.linreg = (root) => {
  const data = [[45, 1250], [52, 1380], [60, 1450], [65, 1550], [70, 1720], [80, 1900], [88, 1980], [95, 2150], [105, 2350], [115, 2500]];
  const st = { w: 15, b: 500, show: 1 };
  const c = controls(root, `${slider('w', 'weight <i>w</i> (CHF per m²)', 0, 35, 0.5, st.w)}${slider('b', 'intercept <i>b</i> (CHF)', -400, 1600, 10, st.b)}<label><input type="checkbox" data-r checked> show errors</label><button class="btn small" data-best>Find best fit</button>`);
  const box = el('<div></div>'); root.appendChild(box);
  const f = frame({ x: [30, 125], y: [0, 3200] });
  function draw() {
    const pred = data.map(([x]) => st.w * x + st.b);
    const err = data.map(([, y], i) => y - pred[i]);
    const mse = err.reduce((s, e) => s + e * e, 0) / err.length;
    const mae = err.reduce((s, e) => s + Math.abs(e), 0) / err.length;
    const me = -err.reduce((s, e) => s + e, 0) / err.length;
    let s = svgOpen(f) + f.axes('Living area (m²)', 'Monthly rent (CHF)');
    if (st.show) data.forEach(([x, y], i) => { s += `<line x1="${f.sx(x)}" x2="${f.sx(x)}" y1="${f.sy(y)}" y2="${f.sy(pred[i])}" style="stroke:var(--bad);stroke-width:2;stroke-dasharray:4 3"/>`; });
    s += `<line x1="${f.sx(30)}" y1="${f.sy(st.w * 30 + st.b)}" x2="${f.sx(125)}" y2="${f.sy(st.w * 125 + st.b)}" style="stroke:var(--primary);stroke-width:3"/>`;
    data.forEach(([x, y]) => { s += `<circle cx="${f.sx(x)}" cy="${f.sy(y)}" r="6" style="fill:var(--c2);stroke:var(--bg-elev);stroke-width:2"/>`; });
    s += `<text x="${f.sx(32)}" y="${f.sy(3000)}" style="font-size:14px;font-weight:600;fill:var(--primary)">ŷ = ${st.w}·x + ${st.b}</text></svg>`;
    box.innerHTML = s + readout([['MSE (CHF²)', Math.round(mse).toLocaleString('en')], ['RMSE (CHF)', fmt(Math.sqrt(mse), 1)], ['MAE (CHF)', fmt(mae, 1)], ['ME (bias, CHF)', fmt(me, 1)], ['Prediction for 70 m²', `CHF ${Math.round(st.w * 70 + st.b)}`]]);
  }
  bindSliders(c, st, draw);
  c.querySelector('[data-r]').onchange = (e) => { st.show = e.target.checked; draw(); };
  c.querySelector('[data-best]').onclick = () => {
    const n = data.length, mx = data.reduce((s, d) => s + d[0], 0) / n, my = data.reduce((s, d) => s + d[1], 0) / n;
    const w = data.reduce((s, [x, y]) => s + (x - mx) * (y - my), 0) / data.reduce((s, [x]) => s + (x - mx) ** 2, 0);
    st.w = Math.round(w * 2) / 2; st.b = Math.round((my - st.w * mx) / 10) * 10;
    c.querySelector('[data-k=w]').value = st.w; c.querySelector('[data-k=b]').value = st.b;
    c.querySelector('[data-o=w]').textContent = st.w; c.querySelector('[data-o=b]').textContent = st.b; draw();
  };
  draw();
};
VIZ.linreg.title = 'Fit a line by hand: watch the errors and the loss';

// ================================================================ gd1d
VIZ.gd1d = (root, attrs) => {
  const presets = {
    fuel: { xs: [13.593, 5.35, 8.247], ys: [99.641, 44.522, 65.802], w0: 6, lrs: [0.0001, 0.001, 0.003, 0.008, 0.0105, 0.012], lr: 0.003, range: [4, 11], xl: 'w (litres per 100 km)', yl: 'Training MSE (L²)' },
    slide: { xs: [3], ys: [9], w0: 2, lrs: [0.01, 0.05, 0.1, 0.11, 0.15], lr: 0.05, range: [0, 6], xl: 'w', yl: 'Squared error' },
  };
  const P = presets[attrs.preset] || presets.fuel;
  const loss = (w) => P.xs.reduce((s, x, i) => s + (P.ys[i] - w * x) ** 2, 0) / P.xs.length;
  const grad = (w) => P.xs.reduce((s, x, i) => s + 2 * x * (w * x - P.ys[i]), 0) / P.xs.length;
  const st = { w0: P.w0, lr: P.lr };
  let path = [P.w0];
  const c = controls(root, `${slider('w0', 'start w', P.range[0], P.range[1], 0.1, P.w0)}<label>learning rate <select data-lr>${P.lrs.map((l) => `<option ${l === P.lr ? 'selected' : ''}>${l}</option>`).join('')}</select></label><button class="btn small primary" data-s>Step</button><button class="btn small" data-r10>10 steps</button><button class="btn small ghost" data-reset>Reset</button>`);
  const box = el('<div></div>'); root.appendChild(box);
  const ws = []; for (let i = 0; i <= 200; i++) ws.push(P.range[0] + (i / 200) * (P.range[1] - P.range[0]));
  const lmax = Math.max(...ws.map(loss));
  const f = frame({ x: P.range, y: [0, lmax * 1.05] });
  function draw() {
    let s = svgOpen(f) + f.axes(P.xl, P.yl);
    s += `<polyline fill="none" style="stroke:var(--primary);stroke-width:3" points="${ws.map((w) => `${f.sx(w)},${f.sy(loss(w))}`).join(' ')}"/>`;
    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1], b = path[i];
      const ya = f.sy(Math.min(loss(a), lmax * 1.05)), yb = f.sy(Math.min(loss(b), lmax * 1.05));
      s += `<line x1="${f.sx(clamp(a, ...P.range))}" y1="${ya}" x2="${f.sx(clamp(b, ...P.range))}" y2="${yb}" style="stroke:var(--c2);stroke-width:1.5;stroke-dasharray:3 3"/>`;
    }
    path.forEach((w, i) => {
      const inR = w >= P.range[0] && w <= P.range[1] && loss(w) <= lmax * 1.05;
      if (inR) s += `<circle cx="${f.sx(w)}" cy="${f.sy(loss(w))}" r="${i === path.length - 1 ? 7 : 4.5}" style="fill:${i === path.length - 1 ? 'var(--c2)' : 'var(--c4)'};stroke:var(--bg-elev);stroke-width:1.5"/>`;
    });
    const cur = path[path.length - 1];
    if (Number.isFinite(cur) && cur >= P.range[0] && cur <= P.range[1] && loss(cur) <= lmax) {
      const g = grad(cur), L = loss(cur), dx = (P.range[1] - P.range[0]) * 0.12;
      s += `<line x1="${f.sx(cur - dx)}" y1="${f.sy(L - g * dx)}" x2="${f.sx(cur + dx)}" y2="${f.sy(L + g * dx)}" style="stroke:var(--c3);stroke-width:2"/>`;
    }
    s += '</svg>';
    const last = path.slice(-6).map((w, i, arr) => `<tr><td>${path.length - arr.length + i}</td><td>${fmt(w, 4)}</td><td>${fmt(grad(w), 3)}</td><td>${fmt(loss(w), 3)}</td></tr>`).join('');
    const diverged = !Number.isFinite(cur) || Math.abs(cur) > 1e6 || loss(cur) > lmax * 50;
    box.innerHTML = s + readout([['current w', fmt(cur, 4)], ['slope dL/dw', fmt(grad(cur), 3)], ['loss', fmt(loss(cur), 3)], ['update = −lr × slope', fmt(-st.lr * grad(cur), 4)]])
      + `<div class="viz-note">${diverged ? '💥 <b>Diverging!</b> The learning rate is so large that each step overshoots the minimum by more than it corrects. ' : ''}Green line = the slope (derivative) at the current point. Negative slope → w increases; positive slope → w decreases.</div>`
      + `<table class="cm-table" style="margin-top:8px"><tr><th>step</th><th>w</th><th>slope</th><th>loss</th></tr>${last}</table>`;
  }
  const step = (n) => { for (let i = 0; i < n; i++) { const w = path[path.length - 1]; if (!Number.isFinite(w) || Math.abs(w) > 1e9) break; path.push(w - st.lr * grad(w)); } draw(); };
  bindSliders(c, st, () => { path = [st.w0]; draw(); });
  c.querySelector('[data-lr]').onchange = (e) => { st.lr = Number(e.target.value); path = [st.w0]; draw(); };
  c.querySelector('[data-s]').onclick = () => step(1);
  c.querySelector('[data-r10]').onclick = () => step(10);
  c.querySelector('[data-reset]').onclick = () => { path = [st.w0]; draw(); };
  draw();
};
VIZ.gd1d.title = 'Gradient descent on a loss curve';

// ================================================================ gd2d
VIZ.gd2d = (root) => {
  const sets = {
    balanced: { X: [[1, 0], [0, 1], [1, 1]], y: [2, 3, 5], lr: 0.3 },
    narrow: { X: [[1, 0], [0, 3], [1, 3]], y: [2, 9, 11], lr: 0.1 },
  };
  let D = sets.balanced;
  const loss = (w1, w2) => D.X.reduce((s, [a, b], i) => s + (D.y[i] - (a * w1 + b * w2)) ** 2, 0) / D.X.length;
  const grad = (w1, w2) => {
    let g1 = 0, g2 = 0;
    D.X.forEach(([a, b], i) => { const e = a * w1 + b * w2 - D.y[i]; g1 += 2 * a * e; g2 += 2 * b * e; });
    return [g1 / D.X.length, g2 / D.X.length];
  };
  const st = { lr: D.lr, method: 'gd' };
  let start = [-1, -0.5]; let path = [start];
  const c = controls(root, `<label>data <select data-d><option value="balanced">features on similar scales</option><option value="narrow">one feature 3× larger (narrow valley)</option></select></label>${slider('lr', 'learning rate', 0.01, 0.6, 0.01, st.lr)}<label>method <select data-m><option value="gd">gradient descent (both weights at once)</option><option value="cd">coordinate descent (one weight at a time)</option></select></label><button class="btn small primary" data-s>Step</button><button class="btn small" data-r>Run 25</button><button class="btn small ghost" data-x>Reset</button>`);
  const box = el('<div></div>'); root.appendChild(box);
  const f = frame({ w: 640, h: 420, x: [-1.5, 5], y: [-1.5, 5.5] });
  let bg = '';
  function background() {
    const n = 60, levels = [0.05, 0.2, 0.5, 1, 2, 4, 7, 11, 16, 24, 35];
    let s = '';
    const cw = (f.w - f.m.l - f.m.r) / n, ch = (f.h - f.m.t - f.m.b) / n;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      const w1 = f.x[0] + ((i + 0.5) / n) * (f.x[1] - f.x[0]), w2 = f.y[0] + ((j + 0.5) / n) * (f.y[1] - f.y[0]);
      const L = loss(w1, w2); const lvl = levels.findIndex((t) => L < t); const k = lvl < 0 ? levels.length : lvl;
      const op = 0.85 - (k / levels.length) * 0.8;
      s += `<rect x="${f.m.l + i * cw}" y="${f.h - f.m.b - (j + 1) * ch}" width="${cw + 0.5}" height="${ch + 0.5}" style="fill:var(--primary);opacity:${op.toFixed(2)}"/>`;
    }
    bg = s;
  }
  function draw() {
    let s = svgOpen(f, 'style="cursor:crosshair"') + bg + f.axes('w₁', 'w₂');
    s += `<polyline fill="none" style="stroke:var(--c2);stroke-width:2.5" points="${path.map(([a, b]) => `${f.sx(clamp(a, -10, 10))},${f.sy(clamp(b, -10, 10))}`).join(' ')}"/>`;
    path.forEach(([a, b], i) => { s += `<circle cx="${f.sx(clamp(a, -10, 10))}" cy="${f.sy(clamp(b, -10, 10))}" r="${i === path.length - 1 ? 6 : 3}" style="fill:var(--c2)"/>`; });
    s += `<circle cx="${f.sx(2)}" cy="${f.sy(3)}" r="7" style="fill:var(--c3);stroke:#fff;stroke-width:2"/><text x="${f.sx(2) + 10}" y="${f.sy(3) - 8}" style="fill:var(--text);font-weight:700">minimum (2, 3)</text></svg>`;
    const [a, b] = path[path.length - 1];
    box.innerHTML = s + readout([['w₁', fmt(a, 3)], ['w₂', fmt(b, 3)], ['loss', fmt(loss(a, b), 4)], ['steps', path.length - 1]]) + '<div class="viz-note">Darker = lower loss (the bottom of the bowl). <b>Click anywhere</b> on the chart to choose a new starting point.</div>';
    box.querySelector('svg').onclick = (e) => { const p = svgPoint(e, e.currentTarget); start = [f.ix(p.x), f.iy(p.y)]; path = [start]; draw(); };
  }
  let coord = 0;
  function step(n) {
    for (let k = 0; k < n; k++) {
      const [a, b] = path[path.length - 1]; if (Math.abs(a) > 1e6) break;
      const [g1, g2] = grad(a, b);
      if (st.method === 'gd') path.push([a - st.lr * g1, b - st.lr * g2]);
      else { path.push(coord === 0 ? [a - st.lr * g1, b] : [a, b - st.lr * g2]); coord = 1 - coord; }
    }
    draw();
  }
  bindSliders(c, st, () => { path = [start]; draw(); });
  c.querySelector('[data-d]').onchange = (e) => { D = sets[e.target.value]; background(); path = [start]; draw(); };
  c.querySelector('[data-m]').onchange = (e) => { st.method = e.target.value; coord = 0; path = [start]; draw(); };
  c.querySelector('[data-s]').onclick = () => step(1);
  c.querySelector('[data-r]').onclick = () => step(25);
  c.querySelector('[data-x]').onclick = () => { path = [start]; coord = 0; draw(); };
  background(); draw();
};
VIZ.gd2d.title = 'Two weights: gradient descent on a contour map';

// ================================================================ sigmoid + log loss
VIZ.sigmoid = (root) => {
  const st = { z: 1.4, t: 0.5 };
  const c = controls(root, `${slider('z', 'score z = w·x + b', -8, 8, 0.1, st.z)}${slider('t', 'decision threshold', 0.05, 0.95, 0.05, st.t)}`);
  const box = el('<div class="viz-grid2"></div>'); root.appendChild(box);
  const sig = (z) => 1 / (1 + Math.exp(-z));
  const f1 = frame({ w: 420, h: 300, x: [-8, 8], y: [0, 1] });
  const f2 = frame({ w: 420, h: 300, x: [0, 1], y: [0, 5] });
  function draw() {
    const p = sig(st.z);
    let a = svgOpen(f1) + f1.axes('score z', 'p = P(class 1)', { yt: [0, 0.25, 0.5, 0.75, 1] });
    a += `<line x1="${f1.sx(-8)}" x2="${f1.sx(8)}" y1="${f1.sy(st.t)}" y2="${f1.sy(st.t)}" style="stroke:var(--c4);stroke-dasharray:5 4;stroke-width:1.5"/>`;
    const pts = []; for (let z = -8; z <= 8.001; z += 0.1) pts.push(`${f1.sx(z)},${f1.sy(sig(z))}`);
    a += `<polyline fill="none" style="stroke:var(--primary);stroke-width:3" points="${pts.join(' ')}"/>`;
    a += `<line x1="${f1.sx(st.z)}" x2="${f1.sx(st.z)}" y1="${f1.sy(0)}" y2="${f1.sy(p)}" style="stroke:var(--c2);stroke-dasharray:3 3"/><circle cx="${f1.sx(st.z)}" cy="${f1.sy(p)}" r="7" style="fill:var(--c2)"/>`;
    a += `<text x="${f1.sx(-7.6)}" y="${f1.sy(st.t) - 6}" style="fill:var(--c4)">threshold ${st.t}</text></svg>`;
    let b = svgOpen(f2) + f2.axes('p = P(class 1) predicted', 'log loss', { yt: [0, 1, 2, 3, 4, 5] });
    const c1 = [], c0 = [];
    for (let q = 0.005; q <= 0.995; q += 0.005) { c1.push(`${f2.sx(q)},${f2.sy(Math.min(5, -Math.log(q)))}`); c0.push(`${f2.sx(q)},${f2.sy(Math.min(5, -Math.log(1 - q)))}`); }
    b += `<polyline fill="none" style="stroke:var(--c3);stroke-width:3" points="${c1.join(' ')}"/><polyline fill="none" style="stroke:var(--c4);stroke-width:3" points="${c0.join(' ')}"/>`;
    b += `<circle cx="${f2.sx(p)}" cy="${f2.sy(Math.min(5, -Math.log(p)))}" r="6" style="fill:var(--c3)"/><circle cx="${f2.sx(p)}" cy="${f2.sy(Math.min(5, -Math.log(1 - p)))}" r="6" style="fill:var(--c4)"/>`;
    b += `<text x="${f2.sx(0.05)}" y="${f2.sy(4.6)}" style="fill:var(--c3);font-weight:600">if true y = 1: −log(p)</text><text x="${f2.sx(0.5)}" y="${f2.sy(4.6)}" style="fill:var(--c4);font-weight:600">if true y = 0: −log(1−p)</text></svg>`;
    box.innerHTML = `<div>${a}</div><div>${b}</div>`;
    box.nextElementSibling?.remove();
    box.insertAdjacentHTML('afterend', readout([['p = σ(z)', fmt(p, 3)], ['P(class 0) = 1 − p', fmt(1 - p, 3)], ['prediction', p >= st.t ? 'class 1' : 'class 0'], ['loss if truth is 1', fmt(-Math.log(p), 3)], ['loss if truth is 0', fmt(-Math.log(1 - p), 3)]]));
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.sigmoid.title = 'Sigmoid: from a score to a probability (and its log loss)';

// ================================================================ softmax
VIZ.softmax = (root) => {
  const names = ['setosa', 'versicolor', 'virginica'];
  const st = { z0: 2, z1: 1, z2: 0 };
  const c = controls(root, names.map((n, i) => slider(`z${i}`, `score z (${n})`, -4, 6, 0.1, st[`z${i}`])).join(''));
  const box = el('<div></div>'); root.appendChild(box);
  function draw() {
    const z = [st.z0, st.z1, st.z2]; const e = z.map(Math.exp); const S = e.reduce((a, b) => a + b, 0); const p = e.map((v) => v / S);
    const best = p.indexOf(Math.max(...p));
    const f = frame({ w: 640, h: 230, m: { l: 100, r: 70, t: 10, b: 30 }, x: [0, 1], y: [0, 3] });
    let s = svgOpen(f) + f.axes('probability', '', { yt: [], xt: [0, 0.25, 0.5, 0.75, 1] });
    p.forEach((v, i) => {
      const y0 = f.sy(3 - i - 0.2), y1 = f.sy(3 - i - 0.8);
      s += `<rect x="${f.sx(0)}" y="${y0}" width="${f.sx(v) - f.sx(0)}" height="${y1 - y0}" rx="4" style="fill:${C(i)};opacity:${i === best ? 1 : 0.55}"/>`;
      s += `<text x="${f.m.l - 8}" y="${(y0 + y1) / 2 + 4}" text-anchor="end" style="font-weight:${i === best ? 700 : 400};fill:var(--text)">${names[i]}</text><text x="${f.sx(v) + 6}" y="${(y0 + y1) / 2 + 4}" style="fill:var(--text)">${fmt(v, 3)}</text>`;
    });
    s += `<line x1="${f.sx(0.5)}" x2="${f.sx(0.5)}" y1="${f.m.t}" y2="${f.h - f.m.b}" style="stroke:var(--text-faint);stroke-dasharray:4 4"/></svg>`;
    box.innerHTML = s + `<table class="cm-table" style="margin-top:6px"><tr><th>class</th><th>score z</th><th>exp(z)</th><th>exp(z) / ${fmt(S, 3)}</th></tr>${names.map((n, i) => `<tr><td>${n}</td><td>${fmt(z[i], 1)}</td><td>${fmt(e[i], 3)}</td><td><b>${fmt(p[i], 3)}</b></td></tr>`).join('')}</table>`
      + `<div class="viz-note">Prediction: <b>${names[best]}</b> (largest probability${p[best] < 0.5 ? ' — even though it is below 0.5!' : ''}). The probabilities always sum to 1. Adding the same number to all three scores changes nothing — try it.</div>`;
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.softmax.title = 'Softmax: three scores become three probabilities';

// ================================================================ bayes (frequency grid)
VIZ.bayes = (root, attrs) => {
  const st = { prior: Number(attrs.prior || 1), sens: Number(attrs.sens || 90), fpr: Number(attrs.fpr || 9) };
  const c = controls(root, `${slider('prior', 'prior: % of people sick', 0.5, 50, 0.5, st.prior)}${slider('sens', 'P(positive | sick) %', 50, 100, 1, st.sens)}${slider('fpr', 'P(positive | healthy) %', 0, 30, 0.5, st.fpr)}`);
  const box = el('<div></div>'); root.appendChild(box);
  function draw() {
    const N = 1000, sick = Math.round(N * st.prior / 100), tp = Math.round(sick * st.sens / 100), fn = sick - tp;
    const healthy = N - sick, fp = Math.round(healthy * st.fpr / 100), tn = healthy - fp;
    const cols = 50, r = 5.2, gap = 12.6;
    const kinds = [...Array(tp).fill('tp'), ...Array(fn).fill('fn'), ...Array(fp).fill('fp'), ...Array(tn).fill('tn')];
    const col = { tp: 'var(--c4)', fn: 'var(--c2)', fp: 'var(--c5)', tn: 'var(--border)' };
    let s = `<svg viewBox="0 0 ${cols * gap + 10} ${Math.ceil(N / cols) * gap + 10}">`;
    kinds.forEach((k, i) => { s += `<circle cx="${(i % cols) * gap + 10}" cy="${Math.floor(i / cols) * gap + 10}" r="${r}" style="fill:${col[k]}"/>`; });
    s += '</svg>';
    const post = tp + fp ? tp / (tp + fp) : 0;
    box.innerHTML = s + `<div class="viz-readout"><div class="ro"><span style="color:var(--c4)">●</span> sick &amp; positive<b>${tp}</b></div><div class="ro"><span style="color:var(--c2)">●</span> sick &amp; negative<b>${fn}</b></div><div class="ro"><span style="color:var(--c5)">●</span> healthy &amp; positive<b>${fp}</b></div><div class="ro">healthy &amp; negative<b>${tn}</b></div><div class="ro" style="background:var(--primary-soft)">P(sick | positive) = ${tp} / (${tp} + ${fp})<b>${fmt(100 * post, 1)} %</b></div></div>`
      + '<div class="viz-note">1000 people. Among everyone who tests <b>positive</b> (pink + blue dots), what fraction is actually sick? With a rare disease, false alarms from the huge healthy group can outnumber the true positives — that is Bayes\' theorem in action.</div>';
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.bayes.title = 'Bayes with 1000 people: how likely is "sick" after a positive test?';

// ================================================================ gaussian naive bayes (1 feature)
VIZ.gaussnb = (root) => {
  const st = { m0: 4, s0: 1.6, m1: 8, s1: 1.6, p1: 0.5, x: 5 };
  const c = controls(root, `${slider('m0', 'mean (digit 5)', 0, 12, 0.1, st.m0)}${slider('s0', 'std (digit 5)', 0.5, 4, 0.1, st.s0)}${slider('m1', 'mean (digit 9)', 0, 12, 0.1, st.m1)}${slider('s1', 'std (digit 9)', 0.5, 4, 0.1, st.s1)}${slider('p1', 'prior P(9)', 0.05, 0.95, 0.05, st.p1)}${slider('x', 'new value x', 0, 12, 0.1, st.x)}`);
  const box = el('<div></div>'); root.appendChild(box);
  const pdf = (x, m, s) => Math.exp(-0.5 * ((x - m) / s) ** 2) / (s * Math.sqrt(2 * Math.PI));
  function draw() {
    const f = frame({ x: [0, 12], y: [0, 0.45] });
    let s = svgOpen(f) + f.axes('feature value (e.g. first x-coordinate)', 'density');
    const a = [], b = [];
    for (let x = 0; x <= 12; x += 0.05) { a.push(`${f.sx(x)},${f.sy(pdf(x, st.m0, st.s0))}`); b.push(`${f.sx(x)},${f.sy(pdf(x, st.m1, st.s1))}`); }
    s += `<polyline fill="none" style="stroke:var(--c1);stroke-width:3" points="${a.join(' ')}"/><polyline fill="none" style="stroke:var(--c2);stroke-width:3" points="${b.join(' ')}"/>`;
    const h0 = pdf(st.x, st.m0, st.s0), h1 = pdf(st.x, st.m1, st.s1);
    s += `<line x1="${f.sx(st.x)}" x2="${f.sx(st.x)}" y1="${f.sy(0)}" y2="${f.m.t}" style="stroke:var(--text-soft);stroke-dasharray:4 4"/>`;
    s += `<circle cx="${f.sx(st.x)}" cy="${f.sy(h0)}" r="6" style="fill:var(--c1)"/><circle cx="${f.sx(st.x)}" cy="${f.sy(h1)}" r="6" style="fill:var(--c2)"/>`;
    s += `<text x="${f.sx(st.m0)}" y="${f.sy(pdf(st.m0, st.m0, st.s0)) - 8}" text-anchor="middle" style="fill:var(--c1);font-weight:700">digit 5</text><text x="${f.sx(st.m1)}" y="${f.sy(pdf(st.m1, st.m1, st.s1)) - 8}" text-anchor="middle" style="fill:var(--c2);font-weight:700">digit 9</text></svg>`;
    const j0 = (1 - st.p1) * h0, j1 = st.p1 * h1, Z = j0 + j1;
    box.innerHTML = s + readout([['height for 5', fmt(h0, 4)], ['height for 9', fmt(h1, 4)], ['score 5 = P(5)·height', fmt(j0, 4)], ['score 9 = P(9)·height', fmt(j1, 4)], ['P(5 | x)', fmt(j0 / Z, 3)], ['P(9 | x)', fmt(j1 / Z, 3)]]);
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.gaussnb.title = 'Gaussian Naive Bayes with one feature';

// ================================================================ threshold explorer
VIZ.threshold = (root, attrs) => {
  const r = rng(7); const pos = [], neg = [];
  const npos = Number(attrs.npos || 40), nneg = Number(attrs.nneg || 160);
  for (let i = 0; i < npos; i++) pos.push(clamp(0.68 + 0.16 * gauss(r), 0.01, 0.99));
  for (let i = 0; i < nneg; i++) neg.push(clamp(0.32 + 0.16 * gauss(r), 0.01, 0.99));
  const jit = [...pos, ...neg].map(() => r());
  const st = { t: 0.5 };
  const c = controls(root, slider('t', 'threshold (predict positive if score ≥ threshold)', 0.02, 0.98, 0.01, st.t));
  const box = el('<div></div>'); root.appendChild(box);
  const f = frame({ w: 640, h: 200, m: { l: 20, r: 20, t: 10, b: 34 }, x: [0, 1], y: [0, 2] });
  function draw() {
    const tp = pos.filter((s) => s >= st.t).length, fn = npos - tp, fp = neg.filter((s) => s >= st.t).length, tn = nneg - fp;
    const P = tp + fp ? tp / (tp + fp) : 0, R = tp / npos, F = P + R ? (2 * P * R) / (P + R) : 0, A = (tp + tn) / (npos + nneg);
    let s = svgOpen(f) + f.axes('model score (estimated probability of "positive")', '', { yt: [] });
    s += `<rect x="${f.sx(st.t)}" y="${f.m.t}" width="${f.sx(1) - f.sx(st.t)}" height="${f.h - f.m.t - f.m.b}" style="fill:var(--primary);opacity:.08"/>`;
    neg.forEach((v, i) => { s += `<circle cx="${f.sx(v)}" cy="${f.sy(0.15 + 0.7 * jit[npos + i])}" r="4" style="fill:var(--c5);opacity:.75"/>`; });
    pos.forEach((v, i) => { s += `<circle cx="${f.sx(v)}" cy="${f.sy(1.15 + 0.7 * jit[i])}" r="4" style="fill:var(--c4);opacity:.85"/>`; });
    s += `<line x1="${f.sx(st.t)}" x2="${f.sx(st.t)}" y1="${f.m.t}" y2="${f.h - f.m.b}" style="stroke:var(--text);stroke-width:2"/>`;
    s += `<text x="${f.sx(0.01)}" y="${f.sy(1.9)}" style="fill:var(--c4);font-weight:700">actual positives (${npos})</text><text x="${f.sx(0.01)}" y="${f.sy(0.95)}" style="fill:var(--c5);font-weight:700">actual negatives (${nneg})</text></svg>`;
    box.innerHTML = s + `<div class="viz-grid2" style="margin-top:8px;align-items:center"><table class="cm-table"><tr><th></th><th>predicted +</th><th>predicted −</th></tr><tr><th>actual +</th><td class="tp">TP = ${tp}</td><td class="fn">FN = ${fn}</td></tr><tr><th>actual −</th><td class="fp">FP = ${fp}</td><td class="tn">TN = ${tn}</td></tr></table>`
      + `<div>${readout([['precision TP/(TP+FP)', fmt(P, 3)], ['recall TP/(TP+FN)', fmt(R, 3)], ['F1', fmt(F, 3)], ['accuracy', fmt(A, 3)]])}</div></div>`
      + '<div class="viz-note">Move the threshold left → you catch more positives (recall ↑) but raise more false alarms (precision ↓). Move it right → the opposite. The model did not change — only the decision rule.</div>';
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.threshold.title = 'Same model, different threshold';

// ================================================================ k-means
VIZ.kmeans = (root) => {
  let seed = 3; let pts = [], cents = [], assign = [], phase = 'init', iter = 0;
  const st = { k: 3 };
  const c = controls(root, `${slider('k', 'K (number of clusters)', 2, 6, 1, st.k)}<button class="btn small" data-new>New data</button><button class="btn small" data-init>1 · Initialise</button><button class="btn small" data-assign>2 · Assign</button><button class="btn small" data-update>3 · Update</button><button class="btn small primary" data-run>Run to convergence</button>`);
  const box = el('<div></div>'); root.appendChild(box);
  const f = frame({ w: 640, h: 400, m: { l: 20, r: 20, t: 14, b: 20 }, x: [0, 10], y: [0, 10] });
  function newData() {
    const r = rng(seed++); pts = [];
    const centers = [[2.5, 7], [7.5, 7.5], [5, 2.5], [8, 3]].slice(0, 3 + Math.floor(r() * 2));
    centers.forEach(([cx, cy]) => { for (let i = 0; i < 28; i++) pts.push([clamp(cx + 1.1 * gauss(r), 0.2, 9.8), clamp(cy + 1.1 * gauss(r), 0.2, 9.8)]); });
    cents = []; assign = pts.map(() => -1); phase = 'init'; iter = 0;
  }
  const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  function init() { const r = rng(seed * 13 + st.k); const idx = new Set(); while (idx.size < st.k) idx.add(Math.floor(r() * pts.length)); cents = [...idx].map((i) => [...pts[i]]); assign = pts.map(() => -1); phase = 'assign'; iter = 0; }
  function doAssign() { if (!cents.length) init(); let ch = 0; assign = pts.map((p, i) => { let b = 0; cents.forEach((cc, j) => { if (d2(p, cc) < d2(p, cents[b])) b = j; }); if (b !== assign[i]) ch++; return b; }); phase = 'update'; return ch; }
  function doUpdate() { cents = cents.map((cc, j) => { const mine = pts.filter((_, i) => assign[i] === j); return mine.length ? [mine.reduce((s, p) => s + p[0], 0) / mine.length, mine.reduce((s, p) => s + p[1], 0) / mine.length] : cc; }); phase = 'assign'; iter++; }
  const inertia = () => pts.reduce((s, p, i) => s + (assign[i] >= 0 ? d2(p, cents[assign[i]]) : 0), 0);
  function draw() {
    let s = svgOpen(f) + `<rect x="${f.m.l}" y="${f.m.t}" width="${f.w - f.m.l - f.m.r}" height="${f.h - f.m.t - f.m.b}" style="fill:none;stroke:var(--border)"/>`;
    pts.forEach((p, i) => { if (assign[i] >= 0) s += `<line x1="${f.sx(p[0])}" y1="${f.sy(p[1])}" x2="${f.sx(cents[assign[i]][0])}" y2="${f.sy(cents[assign[i]][1])}" style="stroke:${C(assign[i])};opacity:.18"/>`; });
    pts.forEach((p, i) => { s += `<circle cx="${f.sx(p[0])}" cy="${f.sy(p[1])}" r="5" style="fill:${assign[i] >= 0 ? C(assign[i]) : 'var(--text-faint)'};opacity:.85"/>`; });
    cents.forEach((cc, j) => { const x = f.sx(cc[0]), y = f.sy(cc[1]); s += `<path d="M${x - 9} ${y - 9} L${x + 9} ${y + 9} M${x + 9} ${y - 9} L${x - 9} ${y + 9}" style="stroke:var(--bg-elev);stroke-width:7"/><path d="M${x - 9} ${y - 9} L${x + 9} ${y + 9} M${x + 9} ${y - 9} L${x - 9} ${y + 9}" style="stroke:${C(j)};stroke-width:4"/>`; });
    s += '</svg>';
    const next = { init: 'Click “Initialise” to place K random centroids (✕).', assign: 'Next: <b>Assign</b> — every point joins its nearest centroid.', update: 'Next: <b>Update</b> — every centroid moves to the mean of its points.' }[phase];
    box.innerHTML = s + readout([['iterations', iter], ['inertia (sum of squared distances)', cents.length && assign[0] >= 0 ? fmt(inertia(), 1) : '—']]) + `<div class="viz-note">${next} Colours are cluster IDs — the algorithm never saw any labels.</div>`;
  }
  bindSliders(c, st, () => { cents = []; assign = pts.map(() => -1); phase = 'init'; iter = 0; draw(); });
  c.querySelector('[data-new]').onclick = () => { newData(); draw(); };
  c.querySelector('[data-init]').onclick = () => { init(); draw(); };
  c.querySelector('[data-assign]').onclick = () => { doAssign(); draw(); };
  c.querySelector('[data-update]').onclick = () => { if (assign[0] < 0) doAssign(); doUpdate(); draw(); };
  c.querySelector('[data-run]').onclick = () => { if (!cents.length) init(); for (let i = 0; i < 50; i++) { const ch = doAssign(); if (ch === 0 && i > 0) break; doUpdate(); } doAssign(); draw(); };
  newData(); draw();
};
VIZ.kmeans.title = 'K-means step by step';

// ================================================================ KNN
VIZ.knn = (root) => {
  const r = rng(11); const pts = [];
  for (let i = 0; i < 34; i++) pts.push([clamp(3.4 + 1.5 * gauss(r), 0.2, 9.8), clamp(4 + 1.6 * gauss(r), 0.2, 9.8), 0]);
  for (let i = 0; i < 34; i++) pts.push([clamp(6.4 + 1.5 * gauss(r), 0.2, 9.8), clamp(6 + 1.6 * gauss(r), 0.2, 9.8), 1]);
  const st = { k: 5, regions: 0 }; let q = [5, 5.2];
  const c = controls(root, `${slider('k', 'K (neighbours who vote)', 1, 25, 1, st.k)}<label><input type="checkbox" data-reg> show decision regions</label>`);
  const box = el('<div></div>'); root.appendChild(box);
  const f = frame({ w: 640, h: 420, m: { l: 20, r: 20, t: 14, b: 20 }, x: [0, 10], y: [0, 10] });
  const names = ['class A', 'class B'];
  const vote = (p, k) => { const d = pts.map((t) => [(t[0] - p[0]) ** 2 + (t[1] - p[1]) ** 2, t]).sort((a, b) => a[0] - b[0]).slice(0, k); const v = [0, 0]; d.forEach(([, t]) => v[t[2]]++); return { d, v, cls: v[1] > v[0] ? 1 : v[0] > v[1] ? 0 : d[0][1][2] }; };
  function draw() {
    let s = svgOpen(f, 'style="cursor:crosshair"');
    if (st.regions) {
      const n = 48, cw = (f.w - f.m.l - f.m.r) / n, ch = (f.h - f.m.t - f.m.b) / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const p = [(i + 0.5) / n * 10, (j + 0.5) / n * 10]; const cl = vote(p, st.k).cls; s += `<rect x="${f.m.l + i * cw}" y="${f.h - f.m.b - (j + 1) * ch}" width="${cw + 0.5}" height="${ch + 0.5}" style="fill:${cl ? 'var(--c2)' : 'var(--c1)'};opacity:.14"/>`; }
    }
    s += `<rect x="${f.m.l}" y="${f.m.t}" width="${f.w - f.m.l - f.m.r}" height="${f.h - f.m.t - f.m.b}" style="fill:none;stroke:var(--border)"/>`;
    const { d, v, cls } = vote(q, st.k);
    const rad = Math.sqrt(d[d.length - 1][0]);
    s += `<ellipse cx="${f.sx(q[0])}" cy="${f.sy(q[1])}" rx="${f.sx(rad) - f.sx(0)}" ry="${f.sy(0) - f.sy(rad)}" style="fill:none;stroke:var(--text-soft);stroke-dasharray:5 4"/>`;
    d.forEach(([, t]) => { s += `<line x1="${f.sx(q[0])}" y1="${f.sy(q[1])}" x2="${f.sx(t[0])}" y2="${f.sy(t[1])}" style="stroke:var(--text-soft);opacity:.6"/>`; });
    pts.forEach((t) => { s += t[2] ? `<rect x="${f.sx(t[0]) - 5}" y="${f.sy(t[1]) - 5}" width="10" height="10" style="fill:var(--c2)"/>` : `<circle cx="${f.sx(t[0])}" cy="${f.sy(t[1])}" r="5.5" style="fill:var(--c1)"/>`; });
    s += `<circle cx="${f.sx(q[0])}" cy="${f.sy(q[1])}" r="9" style="fill:${cls ? 'var(--c2)' : 'var(--c1)'};stroke:var(--text);stroke-width:3"/><text x="${f.sx(q[0]) + 13}" y="${f.sy(q[1]) - 10}" style="fill:var(--text);font-weight:700">?</text></svg>`;
    box.innerHTML = s + readout([['votes for A ●', v[0]], ['votes for B ■', v[1]], ['prediction', names[cls]]]) + '<div class="viz-note"><b>Click anywhere</b> to move the query point. KNN has no training loop: it stores the labelled points and, at prediction time, lets the K nearest ones vote. Turn on decision regions and compare K = 1 (jagged, sensitive to single points) with K = 25 (smooth).</div>';
    box.querySelector('svg').onclick = (e) => { const p = svgPoint(e, e.currentTarget); q = [clamp(f.ix(p.x), 0, 10), clamp(f.iy(p.y), 0, 10)]; draw(); };
  }
  bindSliders(c, st, draw);
  c.querySelector('[data-reg]').onchange = (e) => { st.regions = e.target.checked; draw(); };
  draw();
};
VIZ.knn.title = 'K-nearest neighbours: local voting';

// ================================================================ overfitting (polynomial degree)
VIZ.overfit = (root) => {
  const r = rng(5); const truth = (x) => Math.sin(2.6 * x) * 0.8 + 0.3 * x;
  const tr = []; for (let i = 0; i < 12; i++) { const x = -1 + (2 * (i + 0.5)) / 12 + 0.05 * gauss(r); tr.push([x, truth(x) + 0.22 * gauss(r)]); }
  const va = []; for (let i = 0; i < 40; i++) { const x = -1 + 2 * r(); va.push([x, truth(x) + 0.22 * gauss(r)]); }
  function fit(deg) {
    const n = deg + 1; const A = Array.from({ length: n }, () => Array(n + 1).fill(0));
    tr.forEach(([x, y]) => { for (let i = 0; i < n; i++) { for (let j = 0; j < n; j++) A[i][j] += x ** (i + j); A[i][n] += y * x ** i; } });
    for (let i = 0; i < n; i++) A[i][i] += 1e-9;
    for (let i = 0; i < n; i++) { let p = i; for (let k = i + 1; k < n; k++) if (Math.abs(A[k][i]) > Math.abs(A[p][i])) p = k; [A[i], A[p]] = [A[p], A[i]]; for (let k = 0; k < n; k++) { if (k === i) continue; const fct = A[k][i] / A[i][i]; for (let j = i; j <= n; j++) A[k][j] -= fct * A[i][j]; } }
    const w = A.map((row, i) => row[n] / row[i]);
    return (x) => w.reduce((s, wi, i) => s + wi * x ** i, 0);
  }
  const mse = (g, D) => D.reduce((s, [x, y]) => s + (y - g(x)) ** 2, 0) / D.length;
  const curves = []; for (let d = 0; d <= 11; d++) { const g = fit(d); curves.push({ g, tr: mse(g, tr), va: mse(g, va) }); }
  const st = { deg: 1 };
  const c = controls(root, slider('deg', 'model complexity (polynomial degree)', 0, 11, 1, st.deg));
  const box = el('<div class="viz-grid2"></div>'); root.appendChild(box);
  const f1 = frame({ w: 420, h: 300, x: [-1.05, 1.05], y: [-1.8, 1.8] });
  const f2 = frame({ w: 420, h: 300, x: [0, 11], y: [0, 0.5] });
  function draw() {
    const g = curves[st.deg].g;
    let a = svgOpen(f1) + f1.axes('x', 'y', { yt: [-1.5, -1, -0.5, 0, 0.5, 1, 1.5] });
    va.forEach(([x, y]) => { a += `<circle cx="${f1.sx(x)}" cy="${f1.sy(y)}" r="3.5" style="fill:var(--c5);opacity:.45"/>`; });
    tr.forEach(([x, y]) => { a += `<circle cx="${f1.sx(x)}" cy="${f1.sy(y)}" r="5.5" style="fill:var(--c2)"/>`; });
    const pts = []; for (let x = -1.05; x <= 1.05; x += 0.01) pts.push(`${f1.sx(x)},${f1.sy(clamp(g(x), -1.8, 1.8))}`);
    a += `<polyline fill="none" style="stroke:var(--primary);stroke-width:3" points="${pts.join(' ')}"/></svg>`;
    let b = svgOpen(f2) + f2.axes('degree', 'MSE', { xt: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], yt: [0, 0.1, 0.2, 0.3, 0.4, 0.5] });
    b += `<polyline fill="none" style="stroke:var(--c2);stroke-width:3" points="${curves.map((cv, d) => `${f2.sx(d)},${f2.sy(Math.min(cv.tr, 0.5))}`).join(' ')}"/>`;
    b += `<polyline fill="none" style="stroke:var(--c5);stroke-width:3" points="${curves.map((cv, d) => `${f2.sx(d)},${f2.sy(Math.min(cv.va, 0.5))}`).join(' ')}"/>`;
    b += `<line x1="${f2.sx(st.deg)}" x2="${f2.sx(st.deg)}" y1="${f2.m.t}" y2="${f2.h - f2.m.b}" style="stroke:var(--text);stroke-dasharray:4 4"/>`;
    b += `<text x="${f2.sx(6)}" y="${f2.sy(0.46)}" style="fill:var(--c5);font-weight:700">validation</text><text x="${f2.sx(6)}" y="${f2.sy(0.4)}" style="fill:var(--c2);font-weight:700">training</text></svg>`;
    box.innerHTML = `<div>${a}</div><div>${b}</div>`;
    const cv = curves[st.deg];
    const verdict = st.deg <= 1 ? 'Underfitting: too simple to follow the pattern — both errors are high.' : st.deg <= 5 ? 'Good fit: captures the pattern; validation error is near its lowest.' : 'Overfitting: the curve chases the noise in the 12 training points — training error keeps falling, validation error rises.';
    box.nextElementSibling?.remove();
    box.insertAdjacentHTML('afterend', `<div>${readout([['training MSE', fmt(cv.tr, 3)], ['validation MSE', fmt(cv.va, 3)]])}<div class="viz-note"><b>${verdict}</b> Orange dots = training data (the model sees them), faint blue dots = validation data (held out).</div></div>`);
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.overfit.title = 'Underfitting vs. overfitting';

// ================================================================ cross-validation diagram
VIZ.cv = (root) => {
  const st = { k: 3 };
  const c = controls(root, slider('k', 'number of folds k', 2, 10, 1, st.k));
  const box = el('<div></div>'); root.appendChild(box);
  function draw() {
    const W = 640, rowH = 30, H = (st.k + 1) * (rowH + 8) + 40;
    let s = `<svg viewBox="0 0 ${W} ${H}">`;
    const trainW = 480, x0 = 90;
    for (let i = 0; i < st.k; i++) {
      const y = 10 + i * (rowH + 8);
      s += `<text x="${x0 - 10}" y="${y + rowH / 2 + 4}" text-anchor="end">Fit ${i + 1}</text>`;
      for (let j = 0; j < st.k; j++) {
        const w = trainW / st.k; const isVal = i === j;
        s += `<rect x="${x0 + j * w + 1}" y="${y}" width="${w - 2}" height="${rowH}" rx="4" style="fill:${isVal ? 'var(--c2)' : 'var(--c1)'};opacity:${isVal ? 0.95 : 0.55}"/>`;
        s += `<text x="${x0 + j * w + w / 2}" y="${y + rowH / 2 + 4}" text-anchor="middle" style="fill:#fff;font-size:11px;font-weight:600">${isVal ? 'VALIDATE' : 'train'}</text>`;
      }
      s += `<rect x="${x0 + trainW + 8}" y="${y}" width="${W - x0 - trainW - 14}" height="${rowH}" rx="4" style="fill:var(--text-faint);opacity:.35"/>`;
    }
    const y = 10 + st.k * (rowH + 8) + 6;
    s += `<text x="${x0 + trainW / 2}" y="${y + 12}" text-anchor="middle" style="font-weight:600">80 % training data (split into ${st.k} folds)</text><text x="${x0 + trainW + 8 + (W - x0 - trainW - 14) / 2}" y="${y + 12}" text-anchor="middle" style="font-weight:600">test</text>`;
    s += `<text x="${x0 + trainW + 8 + (W - x0 - trainW - 14) / 2}" y="${y + 28}" text-anchor="middle">untouched</text></svg>`;
    box.innerHTML = s + `<div class="viz-note">Each training row is used for validation exactly once. You get ${st.k} validation scores → report their mean (how good) and standard deviation (how stable). The final test set stays outside all folds.</div>`;
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.cv.title = 'k-fold cross-validation inside the training set';

// ================================================================ SUS calculator
VIZ.sus = (root) => {
  const items = ['I think that I would like to use this system frequently.', 'I found the system unnecessarily complex.', 'I thought the system was easy to use.', 'I think that I would need the support of a technical person to be able to use this system.', 'I found the various functions in this system were well integrated.', 'I thought there was too much inconsistency in this system.', 'I would imagine that most people would learn to use this system very quickly.', 'I found the system very cumbersome to use.', 'I felt very confident using the system.', 'I needed to learn a lot of things before I could get going with this system.'];
  const resp = [4, 2, 4, 1, 4, 2, 5, 2, 4, 2];
  const box = el('<div></div>'); root.appendChild(box);
  function draw() {
    const adj = resp.map((v, i) => (i % 2 === 0 ? v - 1 : 5 - v));
    const score = adj.reduce((a, b) => a + b, 0) * 2.5;
    let rows = '';
    items.forEach((t, i) => {
      rows += `<tr><td style="text-align:left">${i + 1}. ${t} <span class="pill ${i % 2 ? 'exam' : 'done'}">${i % 2 ? 'negative' : 'positive'}</span></td><td style="white-space:nowrap">${[1, 2, 3, 4, 5].map((v) => `<label style="margin:0 3px"><input type="radio" name="sus${i}" value="${v}" ${resp[i] === v ? 'checked' : ''} data-i="${i}">${v}</label>`).join('')}</td><td class="mono">${i % 2 === 0 ? `${resp[i]} − 1` : `5 − ${resp[i]}`} = <b>${adj[i]}</b></td></tr>`;
    });
    const W = 640, x = (v) => 20 + (v / 100) * (W - 40);
    const gauge = `<svg viewBox="0 0 ${W} 60"><rect x="20" y="18" width="${W - 40}" height="14" rx="7" style="fill:var(--bg-soft)"/><rect x="20" y="18" width="${x(score) - 20}" height="14" rx="7" style="fill:var(--primary)"/><line x1="${x(68)}" x2="${x(68)}" y1="10" y2="40" style="stroke:var(--c2);stroke-width:2"/><text x="${x(68)}" y="54" text-anchor="middle" style="fill:var(--c2)">68 ≈ average</text><text x="20" y="54">0</text><text x="${W - 20}" y="54" text-anchor="end">100</text></svg>`;
    box.innerHTML = `<div style="overflow-x:auto"><table class="cm-table" style="font-size:13px"><tr><th>statement (1 = strongly disagree … 5 = strongly agree)</th><th>response</th><th>adjusted</th></tr>${rows}</table></div>${gauge}${readout([['sum of adjusted values', adj.reduce((a, b) => a + b, 0)], ['SUS = sum × 2.5', fmt(score, 1)]])}<div class="viz-note">Odd items are positive statements (agreeing is good) → response − 1. Even items are negative statements (agreeing is bad) → 5 − response. A SUS score is <b>not a percentage</b>.</div>`;
    box.querySelectorAll('input[type=radio]').forEach((inp) => { inp.onchange = () => { resp[Number(inp.dataset.i)] = Number(inp.value); draw(); }; });
  }
  draw();
};
VIZ.sus.title = 'System Usability Scale calculator';

// ================================================================ Cohen's kappa
VIZ.kappa = (root) => {
  const st = { a: 20, b: 5, c: 10, d: 15 };
  const c = controls(root, `${slider('a', 'both say YES', 0, 50, 1, st.a)}${slider('b', 'A: YES, B: NO', 0, 50, 1, st.b)}${slider('c', 'A: NO, B: YES', 0, 50, 1, st.c)}${slider('d', 'both say NO', 0, 50, 1, st.d)}`);
  const box = el('<div></div>'); root.appendChild(box);
  function draw() {
    const { a, b, c: cc, d } = st; const n = a + b + cc + d || 1;
    const po = (a + d) / n; const aYes = (a + b) / n, bYes = (a + cc) / n; const pe = aYes * bYes + (1 - aYes) * (1 - bYes);
    const k = pe === 1 ? 1 : (po - pe) / (1 - pe);
    box.innerHTML = `<div class="viz-grid2" style="align-items:center"><table class="cm-table"><tr><th></th><th>B: YES</th><th>B: NO</th><th>total</th></tr><tr><th>A: YES</th><td class="tp">${a}</td><td class="fp">${b}</td><td>${a + b}</td></tr><tr><th>A: NO</th><td class="fn">${cc}</td><td class="tn">${d}</td><td>${cc + d}</td></tr><tr><th>total</th><td>${a + cc}</td><td>${b + d}</td><td>${n}</td></tr></table>`
      + `<div>${readout([['observed agreement pₒ', fmt(po, 3)], ['chance agreement pₑ', fmt(pe, 3)], ['κ = (pₒ − pₑ)/(1 − pₑ)', fmt(k, 3)]])}</div></div>`
      + `<div class="viz-note">pₑ = P(A yes)·P(B yes) + P(A no)·P(B no) = ${fmt(aYes, 2)}·${fmt(bYes, 2)} + ${fmt(1 - aYes, 2)}·${fmt(1 - bYes, 2)}. Kappa corrects raw agreement for the agreement you would get by luck. κ = 1 perfect, κ ≈ 0 chance level, κ &lt; 0 worse than chance.</div>`;
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.kappa.title = "Cohen's kappa: agreement beyond chance";

// ================================================================ train/test split picture
VIZ.split = (root) => {
  const st = { test: 20 };
  const c = controls(root, slider('test', 'test size %', 10, 50, 5, st.test));
  const box = el('<div></div>'); root.appendChild(box);
  const r = rng(2); const rows = Array.from({ length: 60 }, (_, i) => ({ cls: Math.floor(i / 20), u: r() }));
  function draw() {
    const W = 640; let s = `<svg viewBox="0 0 ${W} 120">`;
    const nTest = Math.round(60 * st.test / 100);
    // stratified: take nTest/3 per class with smallest u
    const test = new Set();
    [0, 1, 2].forEach((k) => rows.map((rw, i) => [rw, i]).filter(([rw]) => rw.cls === k).sort((x, y) => x[0].u - y[0].u).slice(0, Math.round(nTest / 3)).forEach(([, i]) => test.add(i)));
    rows.forEach((rw, i) => { const x = 20 + i * 10; s += `<rect x="${x}" y="${test.has(i) ? 70 : 20}" width="8" height="30" rx="2" style="fill:${C(rw.cls)}"/>`; });
    s += '<text x="20" y="14">training rows (the model learns from these)</text><text x="20" y="116">test rows (hidden until the very end)</text></svg>';
    box.innerHTML = s + `<div class="viz-note">Iris is stored <b>sorted by species</b> (colours). A stratified, shuffled split takes the same share of every class into the test set: ${Math.round(nTest / 3)} of each here. Without shuffling, “the last 20 %” would be one single species!</div>`;
  }
  bindSliders(c, st, draw);
  draw();
};
VIZ.split.title = 'A stratified train/test split';
