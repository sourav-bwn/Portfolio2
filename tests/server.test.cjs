// Behavioral tests for server.js with an in-memory Supabase stub injected via
// the require cache, so no real database or network is needed.
const test = require('node:test');
const assert = require('node:assert');
const path = require('path');

const SUPABASE_PATH = path.resolve(__dirname, '..', 'supabase.js');
const SERVER_PATH = path.resolve(__dirname, '..', 'server.js');

function makeStub() {
  const tables = {};           // table -> array of row objects
  const uploads = [];          // recorded storage uploads
  let nextId = 1;

  function rows(table) { return (tables[table] = tables[table] || []); }

  function query(table, state = {}) {
    const api = {
      select(fields) { state.select = true; return api; },
      order() { return api; },
      eq(col, val) { state.filters = state.filters || []; state.filters.push([col, val]); return api; },
      insert(payload) { state.op = 'insert'; state.payload = payload; return api; },
      update(payload) { state.op = 'update'; state.payload = payload; return api; },
      delete() { state.op = 'delete'; return api; },
      upsert(payload) { state.op = 'upsert'; state.payload = payload; return api; },
      single() { state.single = true; return api; },
      maybeSingle() { state.maybe = true; return api; },
      then(resolve) { resolve(execute(table, state)); },
    };
    return api;
  }

  function applyFilters(list, filters) {
    return (filters || []).reduce((acc, [c, v]) => acc.filter(r => r[c] === v), list);
  }

  function execute(table, state) {
    const list = rows(table);
    if (state.op === 'insert') {
      const row = { id: nextId++, ...state.payload };
      list.push(row);
      return { data: state.single || state.maybe ? row : [row], error: null };
    }
    if (state.op === 'update') {
      const targets = applyFilters(list, state.filters);
      // Reject NaN the way Postgres rejects NaN for an integer column
      for (const v of Object.values(state.payload || {})) {
        if (typeof v === 'number' && Number.isNaN(v)) {
          return { data: null, error: { message: 'invalid input syntax for type integer: "NaN"' } };
        }
      }
      if (!targets.length) return { data: null, error: { message: '0 rows' } };
      Object.assign(targets[0], state.payload);
      return { data: state.single || state.maybe ? targets[0] : targets, error: null };
    }
    if (state.op === 'delete') {
      const targets = applyFilters(list, state.filters);
      tables[table] = list.filter(r => !targets.includes(r));
      return { data: null, error: null };
    }
    if (state.op === 'upsert') {
      const found = list.find(r => r.username === state.payload.username);
      if (found) Object.assign(found, state.payload);
      else list.push({ id: nextId++, ...state.payload });
      return { data: null, error: null };
    }
    const filtered = applyFilters(list, state.filters);
    if (state.single || state.maybe) {
      return { data: filtered[0] || null, error: null };
    }
    return { data: filtered, error: null };
  }

  return {
    tables,
    uploads,
    client: {
      from: (table) => query(table),
      storage: {
        from: () => ({
          upload: (name, buf, opts) => { uploads.push({ name, opts }); return Promise.resolve({ data: {}, error: null }); },
          getPublicUrl: (name) => ({ data: { publicUrl: 'https://storage.test/' + name } }),
        }),
      },
    },
  };
}

// Fresh server instance with controlled env and stubbed supabase module.
async function startServer(env = {}) {
  env = { VERCEL: '1', ...env }; // VERCEL=1 keeps server.js from binding its dev listener on import
  delete require.cache[SERVER_PATH];
  delete require.cache[SUPABASE_PATH];
  const stub = makeStub();
  require.cache[SUPABASE_PATH] = { id: SUPABASE_PATH, filename: SUPABASE_PATH, loaded: true, exports: { supabase: stub.client, supabaseAnon: stub.client, BUCKET_NAME: 'certificates' } };

  const saved = {};
  for (const k of ['VERCEL', 'NODE_ENV', 'JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD']) {
    saved[k] = process.env[k];
    if (k in env) process.env[k] = env[k]; else delete process.env[k];
  }
  const app = require(SERVER_PATH);
  const server = await new Promise((res) => { const s = app.listen(0, () => res(s)); });
  const base = 'http://127.0.0.1:' + server.address().port;
  return {
    stub, base,
    async close() {
      if (server.closeAllConnections) server.closeAllConnections();
      server.close();
      for (const k of Object.keys(saved)) {
        if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k];
      }
    },
  };
}

const post = (base, url, body, headers = {}) =>
  fetch(base + url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });

test('setup endpoint refuses to run without explicit env credentials (no hardcoded defaults)', async () => {
  const { base, stub, close } = await startServer({});
  const res = await post(base, '/api/auth/setup', {});
  assert.strictEqual(res.status, 400, 'setup without ADMIN_USERNAME/ADMIN_PASSWORD must fail');
  assert.strictEqual((stub.tables.admin_users || []).length, 0, 'no default-credential admin may be created');
  await close();
});

test('setup endpoint cannot reset an existing admin password', async () => {
  const { base, stub, close } = await startServer({ ADMIN_USERNAME: 'boss', ADMIN_PASSWORD: 'first-pass' });
  let res = await post(base, '/api/auth/setup', {});
  assert.strictEqual(res.status, 200, 'first-time setup succeeds');
  const hashAfterFirst = stub.tables.admin_users[0].password_hash;

  process.env.ADMIN_PASSWORD = 'second-pass';
  res = await post(base, '/api/auth/setup', {});
  assert.strictEqual(res.status, 409, 'setup must refuse to overwrite an existing admin');
  assert.strictEqual(stub.tables.admin_users[0].password_hash, hashAfterFirst, 'password hash unchanged');
  assert.strictEqual(stub.tables.admin_users.length, 1, 'still exactly one admin');
  await close();
});

test('login does not sign tokens with the public fallback secret in production', async () => {
  // Provision an admin directly, with NO JWT_SECRET set and production env.
  const bcrypt = require('bcryptjs');
  const { base, stub, close } = await startServer({});
  stub.tables.admin_users = [{ id: 1, username: 'boss', password_hash: bcrypt.hashSync('pw', 4) }];

  const res = await post(base, '/api/auth/login', { username: 'boss', password: 'pw' });
  assert.strictEqual(res.status, 500, 'login must fail closed when JWT_SECRET is unset in production');
  const body = await res.json();
  assert.ok(!body.token, 'no token may be issued');
  await close();
});

test('login still works in local dev with the documented fallback secret', async () => {
  const bcrypt = require('bcryptjs');
  const { base, stub, close } = await startServer({ JWT_SECRET: 'dev-secret' });
  stub.tables.admin_users = [{ id: 1, username: 'boss', password_hash: bcrypt.hashSync('pw', 4) }];

  const res = await post(base, '/api/auth/login', { username: 'boss', password: 'pw' });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.token, 'dev login issues a token');
  await close();
});

async function authedContext() {
  const bcrypt = require('bcryptjs');
  const ctx = await startServer({ JWT_SECRET: 'test-secret' });
  ctx.stub.tables.admin_users = [{ id: 1, username: 'boss', password_hash: bcrypt.hashSync('pw', 4) }];
  const res = await post(ctx.base, '/api/auth/login', { username: 'boss', password: 'pw' });
  const { token } = await res.json();
  ctx.auth = { Authorization: 'Bearer ' + token };
  return ctx;
}

test('PUT certificate with empty order_index does not send NaN to the database', async () => {
  const { base, stub, auth, close } = await authedContext();
  stub.tables.certificates = [{ id: '7', title: 'Old', issuer: '', date_earned: '', image_url: '', order_index: 3 }];

  const res = await fetch(base + '/api/admin/certificates/7', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ title: 'New', order_index: '' }),
  });
  assert.strictEqual(res.status, 200, 'update succeeds');
  assert.strictEqual(stub.tables.certificates[0].order_index, 3, 'empty order_index leaves the stored value untouched');
  assert.strictEqual(stub.tables.certificates[0].title, 'New');
  await close();
});

test('PUT certificate with a numeric order_index updates it', async () => {
  const { base, stub, auth, close } = await authedContext();
  stub.tables.certificates = [{ id: '7', title: 'Old', issuer: '', date_earned: '', image_url: '', order_index: 3 }];

  const res = await fetch(base + '/api/admin/certificates/7', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', ...auth },
    body: JSON.stringify({ order_index: '9' }),
  });
  assert.strictEqual(res.status, 200);
  assert.strictEqual(stub.tables.certificates[0].order_index, 9);
  await close();
});

test('stored upload extension comes from the validated mimetype, not the user filename', async () => {
  const { base, stub, auth, close } = await authedContext();
  const form = new FormData();
  form.append('image', new Blob([Buffer.from([0x89, 0x50, 0x4e, 0x47])], { type: 'image/png' }), 'evil.php');
  const res = await fetch(base + '/api/upload', { method: 'POST', headers: auth, body: form });
  assert.strictEqual(res.status, 200);
  const body = await res.json();
  assert.ok(body.image_path.endsWith('.png'), 'stored name uses the mimetype extension, got: ' + body.image_path);
  assert.ok(!body.image_path.includes('evil'), 'user filename is not reused');
  await close();
});
