/* Python runtime inside a Web Worker (Pyodide). Classic worker script. */
const PYODIDE_VERSION = '0.29.4';
importScripts(`https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/pyodide.js`);

const RUNNER = String.raw`
import sys, io, ast, json, base64, traceback, os, warnings
os.environ['MPLBACKEND'] = 'Agg'
warnings.filterwarnings('ignore', message='.*non-interactive.*')
warnings.filterwarnings('ignore', message='.*FigureCanvasAgg.*')
warnings.filterwarnings('ignore', category=DeprecationWarning)

_NS = {}
MAX_TEXT = 30000

def _ns(key):
    d = _NS.get(key)
    if d is None:
        d = {'__name__': '__main__', '__builtins__': __builtins__}
        _NS[key] = d
    return d

def _reset(key):
    _NS.pop(key, None)
    plt = sys.modules.get('matplotlib.pyplot')
    if plt is not None:
        plt.close('all')

class _Stream(io.TextIOBase):
    def __init__(self, outs, kind):
        self.outs, self.kind = outs, kind
    def write(self, s):
        if not s:
            return 0
        if self.outs and self.outs[-1].get('type') == self.kind:
            self.outs[-1]['text'] += s
        else:
            self.outs.append({'type': self.kind, 'text': s})
        return len(s)
    def flush(self):
        pass

def _rich(v, outs):
    try:
        mod = type(v).__module__ or ''
        if mod.startswith('matplotlib'):
            return
        h = None
        if hasattr(v, '_repr_html_'):
            try:
                h = v._repr_html_()
            except Exception:
                h = None
        if h:
            outs.append({'type': 'html', 'html': h})
            return
        r = repr(v)
    except Exception as e:
        r = '<repr failed: %s>' % e
    if len(r) > MAX_TEXT:
        r = r[:MAX_TEXT] + '\n... (output truncated)'
    outs.append({'type': 'result', 'text': r})

def _figs(outs):
    plt = sys.modules.get('matplotlib.pyplot')
    if plt is None:
        return
    for n in plt.get_fignums():
        fig = plt.figure(n)
        buf = io.BytesIO()
        fig.savefig(buf, format='png', dpi=96, bbox_inches='tight')
        outs.append({'type': 'image', 'png': base64.b64encode(buf.getvalue()).decode()})
    plt.close('all')

def _trace(e, fname):
    lines = []
    for fr in traceback.extract_tb(e.__traceback__):
        if fr.filename == fname:
            lines.append({'lineno': fr.lineno, 'line': fr.line or ''})
    return lines

def _run(code, key, mode='cell', captured=''):
    ns = _ns(key)
    outs = []
    def display(*objs):
        for o in objs:
            _rich(o, outs)
    ns['display'] = display
    fname = '<check>' if mode == 'check' else '<cell>'
    if mode == 'check':
        ns['__stdout__'] = captured
    old = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = _Stream(outs, 'stdout'), _Stream(outs, 'stderr')
    err = None
    try:
        tree = ast.parse(code, fname, 'exec')
        last = None
        if mode == 'cell' and tree.body and isinstance(tree.body[-1], ast.Expr):
            last = ast.Expression(tree.body.pop().value)
        exec(compile(tree, fname, 'exec'), ns)
        if last is not None:
            v = eval(compile(last, fname, 'eval'), ns)
            if v is not None:
                _rich(v, outs)
    except SyntaxError as e:
        err = {'ename': type(e).__name__, 'evalue': str(e.msg), 'trace': [{'lineno': e.lineno or 0, 'line': (e.text or '').rstrip()}]}
    except BaseException as e:
        err = {'ename': type(e).__name__, 'evalue': str(e), 'trace': _trace(e, fname)}
    finally:
        sys.stdout, sys.stderr = old
    try:
        _figs(outs)
    except Exception:
        pass
    for o in outs:
        if o['type'] in ('stdout', 'stderr') and len(o['text']) > MAX_TEXT:
            o['text'] = o['text'][:MAX_TEXT] + '\n... (output truncated)'
    stdout = ''.join(o['text'] for o in outs if o['type'] == 'stdout')
    if mode == 'setup':
        outs = [o for o in outs if o['type'] in ('stderr',)]
    return json.dumps({'ok': err is None, 'outputs': outs, 'error': err, 'stdout': stdout})
`;

let pyodide = null;
let base = '';
let queue = Promise.resolve();
const fetched = new Set();

function status(text) { postMessage({ type: 'status', text }); }

async function init(payload) {
  base = payload.base;
  status('Downloading Python (first time can take ~10–20 s)…');
  pyodide = await loadPyodide({ indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/` });
  pyodide.FS.mkdirTree('/home/pyodide/data');
  pyodide.FS.mkdirTree('/home/pyodide/bfh-datasets');
  try { pyodide.FS.symlink('/home/pyodide/data', '/home/pyodide/bfh-datasets/bti1041-mlf1'); } catch (e) { /* exists */ }
  pyodide.FS.chdir('/home/pyodide');
  await pyodide.runPythonAsync(RUNNER);
  status('ready');
  return { version: pyodide.version };
}

async function ensurePackages(code) {
  await pyodide.loadPackagesFromImports(code, {
    messageCallback: (m) => { if (/^Loading/.test(m)) status(m.replace(/, /g, ', ').slice(0, 140)); },
    errorCallback: () => {},
  });
}

async function ensureFiles(code) {
  const re = /(?:data|bti1041-mlf1)\/([A-Za-z0-9_\-]+\.[A-Za-z0-9.]+)/g;
  const names = new Set();
  let m;
  while ((m = re.exec(code))) names.add(m[1]);
  for (const name of names) {
    if (fetched.has(name)) continue;
    status(`Fetching data file ${name}…`);
    const res = await fetch(`${base}/data/${name}`);
    if (!res.ok) continue; // let Python raise FileNotFoundError naturally
    const buf = new Uint8Array(await res.arrayBuffer());
    pyodide.FS.writeFile(`/home/pyodide/data/${name}`, buf);
    fetched.add(name);
  }
}

async function run({ code, ns, mode = 'cell', captured = '', scan = '' }) {
  const all = `${scan}\n${code}`;
  await ensurePackages(all);
  await ensureFiles(all);
  status('busy');
  const fn = pyodide.globals.get('_run');
  try {
    return JSON.parse(fn(code, ns, mode, captured));
  } finally {
    fn.destroy();
  }
}

async function handle(msg) {
  const { id, cmd, payload } = msg;
  try {
    let result = null;
    if (cmd === 'init') result = await init(payload);
    else if (cmd === 'run') result = await run(payload);
    else if (cmd === 'reset') {
      const fn = pyodide.globals.get('_reset'); fn(payload.ns); fn.destroy();
    } else if (cmd === 'preload') {
      await ensurePackages(payload.code || '');
    }
    postMessage({ id, ok: true, result });
  } catch (err) {
    postMessage({ id, ok: false, error: String(err && err.message ? err.message : err) });
  } finally {
    if (pyodide) status('ready');
  }
}

self.onmessage = (e) => { queue = queue.then(() => handle(e.data)); };
