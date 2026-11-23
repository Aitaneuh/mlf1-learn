// Validate all course content:
//  - every file referenced in course.json exists
//  - quizzes parse (each question has a correct answer)
//  - every exercise: setup + solution + check passes in real Pyodide; starter must NOT pass the check
//  - every runnable code cell runs without error
//
// Usage:  npm i --no-save pyodide@0.29.4   (once)
//         node scripts/validate-content.mjs [itemIdFilter]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT = path.join(ROOT, 'content');
const DATA = path.join(ROOT, 'public', 'data');
const filter = process.argv[2] || '';
const pyodidePath = process.env.PYODIDE_PATH || 'pyodide';
const { loadPyodide } = await import(pyodidePath);

const course = JSON.parse(fs.readFileSync(path.join(CONTENT, 'course.json'), 'utf8'));
const runner = fs.readFileSync(path.join(ROOT, 'public', 'js', 'pyworker.js'), 'utf8').match(/const RUNNER = String\.raw`([\s\S]*?)`;/)[1];

function blocksOf(src) {
  const lines = src.replace(/\r\n/g, '\n').split('\n');
  const out = []; let inFence = false;
  for (let i = 0; i < lines.length; i++) {
    if (/^```/.test(lines[i])) inFence = !inFence;
    const m = !inFence && /^:::([a-z][\w-]*)\s*(.*)$/.exec(lines[i]);
    if (!m) continue;
    const body = []; i++;
    while (i < lines.length && !/^:::\s*$/.test(lines[i])) { body.push(lines[i]); i++; }
    const attrs = {}; (m[2].match(/([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g) || []).forEach((kv) => { const [k, ...v] = kv.split('='); attrs[k] = v.join('=').replace(/^["']|["']$/g, ''); });
    out.push({ type: m[1], attrs, body: body.join('\n') });
  }
  return out;
}
function sections(body) {
  const acc = { _: [] }; let cur = '_';
  for (const line of body.split('\n')) {
    const m = /^---\s*([a-z_]+)\s*$/.exec(line);
    if (m) { cur = m[1]; if (acc[cur]) { let k = 2; while (acc[`${cur}${k}`]) k++; cur = `${cur}${k}`; } acc[cur] = []; } else acc[cur].push(line);
  }
  const o = {}; for (const [k, v] of Object.entries(acc)) o[k] = v.join('\n').replace(/^\n+|\s+$/g, ''); return o;
}

const py = await loadPyodide();
py.FS.mkdirTree('/home/pyodide/data');
py.FS.mkdirTree('/home/pyodide/bfh-datasets');
py.FS.symlink('/home/pyodide/data', '/home/pyodide/bfh-datasets/bti1041-mlf1');
py.FS.chdir('/home/pyodide');
await py.runPythonAsync(runner);
const run = py.globals.get('_run');
const written = new Set();
async function exec(code, ns, mode, captured = '') {
  await py.loadPackagesFromImports(code, { messageCallback: () => {} });
  for (const m of code.matchAll(/(?:data|bti1041-mlf1)\/([A-Za-z0-9_\-]+\.[A-Za-z0-9.]+)/g)) {
    if (written.has(m[1])) continue;
    const p = path.join(DATA, m[1]);
    if (fs.existsSync(p)) { py.FS.writeFile(`/home/pyodide/data/${m[1]}`, fs.readFileSync(p)); written.add(m[1]); }
  }
  return JSON.parse(run(code, ns, mode, captured));
}

let errors = 0, exercises = 0, cells = 0, quizzes = 0;
const fail = (where, msg) => { errors++; console.log(`  ✗ ${where}: ${msg}`); };

const files = [];
for (const u of course.units) for (const it of u.items) files.push(it);
files.push({ id: 'cheatsheet', file: 'cheatsheet.md' });
for (const it of files) {
  if (filter && !it.id.includes(filter)) continue;
  const fp = path.join(CONTENT, it.file);
  if (!fs.existsSync(fp)) { fail(it.id, `missing file ${it.file}`); continue; }
  console.log(`• ${it.id}`);
  const src = fs.readFileSync(fp, 'utf8');
  const ns = `v:${it.id}`;
  for (const b of blocksOf(src)) {
    if (b.type === 'quiz') {
      quizzes++;
      const qs = b.body.split('\n').filter((l) => /^\?\s/.test(l)).length;
      const blocks = b.body.split(/\n(?=\?\s)/).filter((x) => /^\?\s/.test(x.trimStart()));
      blocks.forEach((qb, i) => { if (!/^\+\s|^=\s*\S/m.test(qb)) fail(`${it.id} quiz`, `question ${i + 1} has no correct answer: ${qb.split('\n')[0].slice(0, 60)}`); });
      if (!qs) fail(`${it.id} quiz`, 'no questions');
    }
    if (b.type === 'code') {
      cells++;
      const s = sections(b.body); const code = s.code ?? s._;
      if (s.setup) await exec(s.setup, ns, 'setup');
      const r = await exec(code, ns, 'cell');
      if (!r.ok && !b.attrs.fails) fail(`${it.id} code`, `${r.error.ename}: ${r.error.evalue} :: ${code.split('\n')[0]}`);
    }
    if (b.type === 'exercise') {
      exercises++;
      const s = sections(b.body); const id = b.attrs.id || '?';
      if (!s.solution) { fail(`${it.id}/${id}`, 'no solution'); continue; }
      if (s.setup) { const r0 = await exec(s.setup, ns, 'setup'); if (!r0.ok) { fail(`${it.id}/${id}`, `setup error ${r0.error.ename}: ${r0.error.evalue}`); continue; } }
      if (s.check && s.starter != null && !b.attrs.nostartercheck) {
        const tmp = `${ns}:starter:${id}`;
        // run starter in a copy namespace: setup + previous state not available, so just run setup in tmp
        if (s.setup) await exec(s.setup, tmp, 'setup');
        const rs = await exec(s.starter, tmp, 'cell');
        if (rs.ok) { const cs = await exec(s.check, tmp, 'check', rs.stdout); if (cs.ok) fail(`${it.id}/${id}`, 'starter code already passes the check'); }
        py.globals.get('_reset')(tmp);
      }
      const r = await exec(s.solution, ns, 'cell');
      if (!r.ok) { fail(`${it.id}/${id}`, `solution error ${r.error.ename}: ${r.error.evalue} ${JSON.stringify(r.error.trace)}`); continue; }
      if (s.check) {
        const c = await exec(s.check, ns, 'check', r.stdout);
        if (!c.ok) fail(`${it.id}/${id}`, `check failed on solution: ${c.error.ename}: ${c.error.evalue}`);
      }
    }
  }
}
console.log(`\n${exercises} exercises, ${cells} code cells, ${quizzes} quizzes checked — ${errors ? `${errors} PROBLEM(S)` : 'all good ✓'}`);
process.exit(errors ? 1 : 0);
