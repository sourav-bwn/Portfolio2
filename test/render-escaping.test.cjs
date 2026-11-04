// Offline regression tests for HTML-escaping in public/index.html.
// Extracts the real functions from the file and exercises them; no server,
// database or browser needed.
const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'public', 'index.html'), 'utf8');

// Pull a top-level "function name(...) { ... }" out of the file by balancing braces.
function extract(name) {
  const start = html.indexOf('function ' + name + '(');
  if (start === -1) return null;
  const open = html.indexOf('{', start);
  let depth = 0;
  for (let i = open; i < html.length; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) return html.slice(start, i + 1);
    }
  }
  return null;
}

function loadEnv() {
  const src = [extract('esc'), extract('safeColor'), extract('hexToRgb')].filter(Boolean).join('\n');
  return new Function(src + '\nreturn { esc, safeColor, hexToRgb };')();
}

function loadSaiAddMsg(documentStub) {
  const escSrc = extract('esc');
  const fnSrc = extract('saiAddMsg');
  assert.ok(fnSrc, 'saiAddMsg found');
  return new Function('document',
    'function saiScrollDown() {}\n' + escSrc + '\n' + fnSrc + '\nreturn (t) => saiAddMsg(t, "bot");')(documentStub);
}

function domStub(onAssign) {
  const el = () => ({
    set innerHTML(v) { onAssign(v); },
    classList: { add() {}, remove() {} },
    insertBefore() {},
  });
  return { getElementById: el, createElement: el };
}

test('esc escapes markup metacharacters', () => {
  const { esc } = loadEnv();
  assert.strictEqual(esc('<img src=x onerror="pwn">'), '&lt;img src=x onerror=&quot;pwn&quot;&gt;');
});

test('safeColor only passes plain 6-digit hex colors', () => {
  const { safeColor } = loadEnv();
  assert.strictEqual(safeColor('#00D4FF'), '#00D4FF');
  assert.strictEqual(safeColor('#6366f1'), '#6366f1');
  assert.strictEqual(safeColor('red" onmouseover="alert(1)'), '#6366f1');
  assert.strictEqual(safeColor('red;background:url(evil)'), '#6366f1');
  assert.strictEqual(safeColor('url(javascript:x)'), '#6366f1');
  assert.strictEqual(safeColor(undefined), '#6366f1');
  assert.strictEqual(safeColor(''), '#6366f1');
  assert.strictEqual(safeColor('#fff'), '#6366f1');
});

test('saiAddMsg escapes HTML in message text before rendering', () => {
  let captured = null;
  const send = loadSaiAddMsg(domStub(v => { captured = v; }));
  send('<img src=x onerror="alert(1)">');
  assert.ok(captured, 'innerHTML assigned');
  assert.ok(!captured.includes('<img'), 'no raw markup in bubble: ' + captured);
  assert.ok(captured.includes('&lt;img'), 'escaped markup present');
});

test('saiAddMsg keeps newline-to-br conversion after escaping', () => {
  let captured = null;
  const send = loadSaiAddMsg(domStub(v => { captured = v; }));
  send('line1\nline2');
  assert.ok(captured.includes('line1<br>line2'), captured);
});

test('roadmap year is escaped at both render sites', () => {
  const occurrences = html.split('esc(r.year)').length - 1;
  assert.strictEqual(occurrences, 2, 'expected esc(r.year) at both roadmap branches');
  assert.ok(!html.includes("'<span class=\"rm-year\">' + r.year + '</span>'"), 'raw r.year remains');
});

test('accent_color never reaches a style attribute unvalidated', () => {
  assert.ok(!html.includes("--card-accent:' + (c.accent_color || '#6366f1')"), 'raw accent_color remains');
  assert.ok(html.includes('safeColor(c.accent_color)'), 'safeColor validation in use');
});
