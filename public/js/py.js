// Main-thread manager for the Python worker ("the kernel").
class PyRuntime {
  constructor() {
    this.worker = null;
    this.ready = null;
    this.pending = new Map();
    this.nextId = 1;
    this.state = 'off'; // off | loading | ready | busy | error
    this.statusText = 'Not started — it starts automatically when you run code.';
    this.listeners = new Set();
    this.execCount = 0;
  }
  onStatus(fn) { this.listeners.add(fn); fn(this.state, this.statusText); return () => this.listeners.delete(fn); }
  setStatus(state, text) {
    this.state = state; this.statusText = text;
    this.listeners.forEach((fn) => fn(state, text));
  }
  start() {
    if (this.ready) return this.ready;
    this.worker = new Worker('/js/pyworker.js');
    this.worker.onmessage = (e) => {
      const msg = e.data;
      if (msg.type === 'status') {
        if (msg.text === 'ready') this.setStatus('ready', 'Python is ready.');
        else if (msg.text === 'busy') this.setStatus('busy', 'Running…');
        else this.setStatus('loading', msg.text);
        return;
      }
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      msg.ok ? p.resolve(msg.result) : p.reject(new Error(msg.error));
    };
    this.worker.onerror = (e) => {
      this.setStatus('error', 'Python failed to load. Check your internet connection and reload the page.');
      console.error(e);
    };
    this.setStatus('loading', 'Starting Python…');
    this.ready = this._call('init', { base: location.origin }).catch((e) => {
      this.setStatus('error', `Python failed to start: ${e.message}`);
      this.ready = null;
      throw e;
    });
    return this.ready;
  }
  _call(cmd, payload) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, cmd, payload });
    });
  }
  async run(code, ns, opts = {}) {
    await this.start();
    const res = await this._call('run', { code, ns, ...opts });
    if (opts.mode !== 'setup' && opts.mode !== 'check') res.execCount = ++this.execCount;
    return res;
  }
  async preload(code) {
    await this.start();
    return this._call('preload', { code });
  }
  async resetNamespace(ns) {
    if (!this.ready) return;
    await this.ready;
    await this._call('reset', { ns });
    this.execCount = 0;
  }
  /** Hard stop: kill the worker (e.g. infinite loop). All state is lost. */
  kill() {
    if (this.worker) this.worker.terminate();
    this.pending.forEach((p) => p.reject(new Error('Kernel was stopped.')));
    this.pending.clear();
    this.worker = null; this.ready = null; this.execCount = 0;
    this.setStatus('off', 'Kernel stopped. It restarts when you run code again.');
  }
  get busy() { return this.state === 'busy' || this.state === 'loading'; }
}

export const py = new PyRuntime();

// Friendly explanations for common Python errors
export function explainError(err) {
  const n = err.ename, v = err.evalue || '';
  const name = (v.match(/name '([^']+)'/) || [])[1];
  switch (n) {
    case 'NameError':
      return `Python does not know a variable or function called <code>${name || '?'}</code>. Check the spelling, and make sure the line that defines it ran <b>before</b> this line (in a notebook: was that cell run?).`;
    case 'SyntaxError':
      return 'The code is not valid Python. Look at the line shown: missing <code>:</code> after <code>if/for/def</code>, unclosed brackets or quotes, or a stray character are the usual suspects.';
    case 'IndentationError':
    case 'TabError':
      return 'The indentation (spaces at the start of lines) is inconsistent. Code inside <code>for</code>, <code>if</code> and <code>def</code> blocks must be indented by the same amount (4 spaces).';
    case 'TypeError':
      return 'An operation got the wrong kind of value, e.g. adding a string to a number, calling something that is not a function, or passing the wrong number of arguments.';
    case 'KeyError':
      return `The key/column ${v} does not exist. For a DataFrame, print <code>df.columns</code> to see the exact column names (spelling, capitals, spaces!).`;
    case 'IndexError':
      return 'You asked for a position that does not exist (e.g. item 5 of a list with 3 items). Remember Python counts from 0.';
    case 'AttributeError':
      return 'The object does not have that attribute/method. Check the spelling, and check what type the object actually is with <code>type(x)</code>.';
    case 'FileNotFoundError':
      return 'The file path is wrong relative to the current working directory. Data files on this site live in <code>data/</code>, e.g. <code>data/iris.data</code>.';
    case 'ValueError':
      return 'The value has the right type but an unsuitable content (e.g. shapes that do not match, or converting "abc" to a number).';
    case 'ZeroDivisionError':
      return 'You divided by zero. Check the denominator, e.g. an empty list has length 0.';
    case 'ModuleNotFoundError':
      return 'That package is not available in the in-browser Python. numpy, pandas, matplotlib, scipy and scikit-learn are available.';
    case 'AssertionError':
      return 'An <code>assert</code> check failed: a condition the code expected to be true was false.';
    default:
      return '';
  }
}
