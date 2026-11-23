// Markdown rendering with math (KaTeX) and custom ::: blocks.
/* global marked, katex, CodeMirror */

let configured = false;
function configure() {
  if (configured) return;
  configured = true;
  const tex = (s, display) => {
    try { return katex.renderToString(s, { displayMode: display, throwOnError: false, strict: 'ignore' }); }
    catch { return s; }
  };
  marked.use({
    gfm: true,
    extensions: [
      {
        name: 'mathBlock', level: 'block',
        start(src) { const i = src.indexOf('$$'); return i < 0 ? undefined : i; },
        tokenizer(src) {
          const m = /^\$\$([\s\S]+?)\$\$[ \t]*(?:\n|$)/.exec(src);
          if (m) return { type: 'mathBlock', raw: m[0], text: m[1].trim() };
        },
        renderer(t) { return `<div class="math-block">${tex(t.text, true)}</div>`; },
      },
      {
        name: 'mathInline', level: 'inline',
        start(src) { const i = src.indexOf('$'); return i < 0 ? undefined : i; },
        tokenizer(src) {
          const m = /^\$((?:\\\$|[^$\n])+?)\$/.exec(src);
          if (m) return { type: 'mathInline', raw: m[0], text: m[1] };
        },
        renderer(t) { return tex(t.text, false); },
      },
    ],
  });
}

export function md(src) { configure(); return marked.parse(src || ''); }
export function mdInline(src) { configure(); return marked.parseInline(src || ''); }

export function parseAttrs(s) {
  const attrs = {};
  const re = /([\w-]+)=(?:"([^"]*)"|'([^']*)'|(\S+))/g;
  let m;
  while ((m = re.exec(s || ''))) attrs[m[1]] = m[2] ?? m[3] ?? m[4];
  // bare words become flags
  (s || '').replace(re, '').trim().split(/\s+/).filter(Boolean).forEach((w) => { attrs[w] = true; });
  return attrs;
}

/** Split body of a block into `--- name` sections. */
export function sections(body) {
  const out = {};
  let cur = '_';
  const lines = body.split('\n');
  const acc = { _: [] };
  for (const line of lines) {
    const m = /^---\s*([a-z_]+)\s*$/.exec(line);
    if (m) {
      cur = m[1];
      // allow repeated sections (e.g. several hints)
      if (acc[cur]) { let k = 2; while (acc[`${cur}${k}`]) k++; cur = `${cur}${k}`; }
      acc[cur] = [];
    } else acc[cur].push(line);
  }
  for (const [k, v] of Object.entries(acc)) out[k] = v.join('\n').replace(/^\n+|\s+$/g, '');
  return out;
}

/** Extract ::: blocks, render remaining markdown. */
export function renderDoc(src) {
  const lines = (src || '').replace(/\r\n/g, '\n').split('\n');
  const out = [];
  const blocks = [];
  let i = 0;
  let inFence = false;
  while (i < lines.length) {
    const line = lines[i];
    if (/^```/.test(line)) inFence = !inFence;
    const m = !inFence && /^:::([a-z][\w-]*)\s*(.*)$/.exec(line);
    if (m) {
      const body = [];
      i++;
      while (i < lines.length && !/^:::\s*$/.test(lines[i])) { body.push(lines[i]); i++; }
      i++; // skip closing
      blocks.push({ type: m[1], attrs: parseAttrs(m[2]), body: body.join('\n') });
      out.push('', `<div class="blk-slot" data-i="${blocks.length - 1}"></div>`, '');
      continue;
    }
    out.push(line);
    i++;
  }
  return { html: md(out.join('\n')), blocks };
}

export function highlightCode(root) {
  if (!window.CodeMirror || !CodeMirror.runMode) return;
  root.querySelectorAll('pre > code').forEach((el) => {
    if (el.dataset.hl) return;
    const cls = el.className || '';
    if (/language-(text|plaintext|output|console)/.test(cls)) return;
    if (!/language-python|language-py/.test(cls) && cls) return;
    const text = el.textContent;
    el.textContent = '';
    CodeMirror.runMode(text, 'python', el);
    el.dataset.hl = '1';
  });
}

export function slug(s) {
  return s.toLowerCase().replace(/<[^>]+>/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
