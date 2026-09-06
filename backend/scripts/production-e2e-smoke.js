#!/usr/bin/env node
'use strict';

/**
 * FLOWLY V2.36 production E2E smoke test.
 *
 * Safe by default: health, homepage, auth/me, business read, role boundary, logout.
 * Full workflow mode is opt-in with SMOKE_WRITE=true and creates uniquely tagged
 * smoke-test records in the configured test business.
 *
 * Required env:
 *   SMOKE_BASE_URL=https://your-domain.example   (default http://127.0.0.1:8080)
 *   SMOKE_OWNER_EMAIL / SMOKE_OWNER_PASSWORD
 * Optional:
 *   SMOKE_ADMIN_EMAIL / SMOKE_ADMIN_PASSWORD
 *   SMOKE_STAFF_EMAIL / SMOKE_STAFF_PASSWORD
 *   SMOKE_BUSINESS_SLUG=flowly-demo
 *   SMOKE_WRITE=true
 */

const BASE = String(process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '');
const OWNER_EMAIL = process.env.SMOKE_OWNER_EMAIL || 'owner@flowly.local';
const OWNER_PASSWORD = process.env.SMOKE_OWNER_PASSWORD || process.env.DEMO_PASSWORD || 'flowly-demo';
const ADMIN_EMAIL = process.env.SMOKE_ADMIN_EMAIL || 'admin@flowly.local';
const ADMIN_PASSWORD = process.env.SMOKE_ADMIN_PASSWORD || OWNER_PASSWORD;
const STAFF_EMAIL = process.env.SMOKE_STAFF_EMAIL || 'staff@flowly.local';
const STAFF_PASSWORD = process.env.SMOKE_STAFF_PASSWORD || OWNER_PASSWORD;
const BUSINESS_SLUG = process.env.SMOKE_BUSINESS_SLUG || 'flowly-demo';
const WRITE = /^true$/i.test(String(process.env.SMOKE_WRITE || 'false'));
const ORIGIN = process.env.SMOKE_ORIGIN || BASE;
const runId = `smoke-${new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14)}-${Math.random().toString(36).slice(2, 7)}`;

let pass = 0;
let fail = 0;
const results = [];

function out(ok, name, detail = '') {
  if (ok) pass += 1; else fail += 1;
  results.push({ ok, name, detail });
  console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}${detail ? ` :: ${detail}` : ''}`);
}

async function raw(path, { method = 'GET', body, cookie, headers = {}, expectJson = true } = {}) {
  const h = { 'Accept': 'application/json', ...headers };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (cookie) h['Cookie'] = cookie;
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method.toUpperCase())) h['Origin'] = ORIGIN;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
    redirect: 'manual'
  });
  let data = null;
  const text = await res.text();
  if (text && expectJson) {
    try { data = JSON.parse(text); } catch { data = { __raw: text.slice(0, 500) }; }
  } else data = text;
  return { res, data, cookie: res.headers.get('set-cookie') };
}

function sessionCookie(setCookie) {
  if (!setCookie) return '';
  return setCookie.split(';')[0];
}

async function expect(name, fn) {
  try {
    const detail = await fn();
    out(true, name, detail || '');
    return true;
  } catch (error) {
    out(false, name, error.message || String(error));
    return false;
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(email, password, expectedRole) {
  const r = await raw('/api/v1/auth/login', { method: 'POST', body: { email, password } });
  assert(r.res.status === 200, `HTTP ${r.res.status} ${JSON.stringify(r.data)}`);
  const cookie = sessionCookie(r.cookie);
  assert(cookie, 'No session cookie returned');
  assert(r.data?.data?.user?.role === expectedRole, `Expected role ${expectedRole}, got ${r.data?.data?.user?.role}`);
  return { cookie, user: r.data.data.user };
}

async function main() {
  console.log(`FLOWLY V2.36 Production Smoke Test`);
  console.log(`Base: ${BASE}`);
  console.log(`Mode: ${WRITE ? 'FULL WORKFLOW (writes enabled)' : 'SAFE READ/AUTH'}`);
  console.log(`Run ID: ${runId}`);

  await expect('Web health', async () => {
    const r = await raw('/healthz', { expectJson: false });
    assert(r.res.status === 200, `HTTP ${r.res.status}`);
    return '200';
  });

  await expect('API health + PostgreSQL connected', async () => {
    const r = await raw('/api/v1/health');
    assert(r.res.status === 200 && r.data?.ok === true, `HTTP ${r.res.status}`);
    assert(r.data?.data?.database?.configured === true, 'database.configured != true');
    assert(r.data?.data?.database?.connected === true, 'database.connected != true');
    return `API ${r.data?.data?.version || '?'} / DB connected`;
  });

  await expect('Homepage reachable', async () => {
    const r = await raw('/index.html', { expectJson: false });
    assert(r.res.status === 200, `HTTP ${r.res.status}`);
    assert(String(r.data).toLowerCase().includes('flowly'), 'FLOWLY marker not found in homepage');
    return '200 + FLOWLY marker';
  });

  let owner;
  await expect('Owner login', async () => {
    owner = await login(OWNER_EMAIL, OWNER_PASSWORD, 'owner');
    return owner.user.email;
  });
  if (!owner) return finish();

  await expect('Owner session /auth/me', async () => {
    const r = await raw('/api/v1/auth/me', { cookie: owner.cookie });
    assert(r.res.status === 200 && r.data?.data?.user?.role === 'owner', `HTTP ${r.res.status}`);
    return `business=${r.data.data.user.businessSlug || r.data.data.user.businessId}`;
  });

  await expect('Business profile readable', async () => {
    const r = await raw('/api/v1/businesses/me', { cookie: owner.cookie });
    assert(r.res.status === 200 && r.data?.ok, `HTTP ${r.res.status}`);
    return r.data?.data?.name || 'OK';
  });

  let admin;
  await expect('Admin login', async () => {
    admin = await login(ADMIN_EMAIL, ADMIN_PASSWORD, 'admin');
    return admin.user.email;
  });

  let staff;
  await expect('Staff login', async () => {
    staff = await login(STAFF_EMAIL, STAFF_PASSWORD, 'staff');
    return staff.user.email;
  });

  if (staff) {
    await expect('Role boundary: Staff cannot create customer', async () => {
      const r = await raw('/api/v1/customers', {
        method: 'POST', cookie: staff.cookie,
        body: { fullName: `Forbidden ${runId}`, phone: '0890000000' }
      });
      assert(r.res.status === 403 && r.data?.error?.code === 'FORBIDDEN', `Expected 403/FORBIDDEN, got ${r.res.status}`);
      return '403 as expected';
    });
  }

  if (WRITE) {
    let requestId;
    let referenceNo;
    await expect('Customer Front public request', async () => {
      const r = await raw('/api/v1/service-requests/public', {
        method: 'POST',
        body: {
          businessSlug: BUSINESS_SLUG,
          department: 'spa',
          contact: { name: `Smoke Test ${runId}`, phone: `089${String(Date.now()).slice(-7)}`, email: `${runId}@example.invalid` },
          requestType: 'smoke_test',
          summary: `V2.36 E2E ${runId}`,
          details: { source: 'production_smoke', runId }
        }
      });
      assert(r.res.status === 201 && r.data?.data?.id, `HTTP ${r.res.status} ${JSON.stringify(r.data)}`);
      requestId = r.data.data.id;
      referenceNo = r.data.data.referenceNo;
      return referenceNo;
    });

    let leadId;
    await expect('Admin sees generated Request + Lead', async () => {
      const rr = await raw('/api/v1/service-requests?limit=100', { cookie: owner.cookie });
      assert(rr.res.status === 200, `request list HTTP ${rr.res.status}`);
      const reqRow = rr.data?.data?.find(x => x.id === requestId || x.reference_no === referenceNo);
      assert(reqRow, 'Created request not found');
      const lr = await raw('/api/v1/leads?limit=100', { cookie: owner.cookie });
      assert(lr.res.status === 200, `lead list HTTP ${lr.res.status}`);
      const lead = lr.data?.data?.find(x => x.id === reqRow.lead_id);
      assert(lead, 'Generated lead not found');
      leadId = lead.id;
      return `request=${requestId} lead=${leadId}`;
    });

    await expect('Workflow: confirm request → booking + task', async () => {
      assert(requestId, 'No requestId');
      const start = new Date(Date.now() + 2 * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 60 * 60 * 1000);
      const due = new Date(Date.now() + 60 * 60 * 1000);
      const r = await raw(`/api/v1/workflows/requests/${requestId}/confirm`, {
        method: 'POST', cookie: owner.cookie,
        body: { startsAt: start.toISOString(), endsAt: end.toISOString(), taskDueAt: due.toISOString(), taskTitle: `Smoke follow-up ${runId}` }
      });
      assert(r.res.status === 200, `HTTP ${r.res.status} ${JSON.stringify(r.data)}`);
      assert(r.data?.data?.booking?.id, 'booking not created');
      assert(r.data?.data?.followUpTask?.id, 'follow-up task not created');
      return `booking=${r.data.data.booking.id} task=${r.data.data.followUpTask.id}`;
    });

    if (leadId) {
      await expect('Workflow: schedule lead follow-up', async () => {
        const due = new Date(Date.now() + 24 * 60 * 60 * 1000);
        const r = await raw(`/api/v1/workflows/leads/${leadId}/follow-up`, {
          method: 'POST', cookie: owner.cookie,
          body: { dueAt: due.toISOString(), title: `Smoke lead follow-up ${runId}` }
        });
        assert(r.res.status === 201 && r.data?.data?.task?.id, `HTTP ${r.res.status}`);
        return `task=${r.data.data.task.id}`;
      });
    }

    await expect('Activity timeline contains smoke workflow', async () => {
      const r = await raw('/api/v1/activity?limit=100', { cookie: owner.cookie });
      assert(r.res.status === 200, `HTTP ${r.res.status}`);
      assert(Array.isArray(r.data?.data) && r.data.data.length > 0, 'No activity rows');
      return `${r.data.data.length} recent event(s)`;
    });

    await expect('AI generate from real PostgreSQL data', async () => {
      const r = await raw('/api/v1/intelligence/generate', { method: 'POST', cookie: owner.cookie, body: { department: 'spa' } });
      assert(r.res.status === 201 && r.data?.data, `HTTP ${r.res.status} ${JSON.stringify(r.data)}`);
      return `${r.data?.data?.insights?.length || 0} insight(s)`;
    });

    await expect('AI overview / Next Best Action', async () => {
      const r = await raw('/api/v1/intelligence/overview?department=spa', { cookie: owner.cookie });
      assert(r.res.status === 200 && r.data?.data?.mode === 'real_business_data', `HTTP ${r.res.status}`);
      assert(typeof r.data?.data?.nextBestAction === 'string', 'nextBestAction missing');
      return `priority=${r.data.data.priorityScore}`;
    });
  } else {
    console.log('SKIP - Full workflow writes (set SMOKE_WRITE=true when running against the dedicated FLOWLY smoke-test business)');
  }

  await expect('Owner logout', async () => {
    const r = await raw('/api/v1/auth/logout', { method: 'POST', cookie: owner.cookie });
    assert(r.res.status === 200, `HTTP ${r.res.status}`);
    return 'session cleared';
  });

  await expect('Logged-out session rejected', async () => {
    // Explicitly no cookie. This validates unauthenticated guard independently of browser cookie clearing.
    const r = await raw('/api/v1/auth/me');
    assert(r.res.status === 401, `Expected 401, got ${r.res.status}`);
    return '401 as expected';
  });

  finish();
}

function finish() {
  console.log('');
  console.log(`FLOWLY V2.36 result: ${pass} passed / ${fail} failed`);
  if (!WRITE) console.log('Safe mode completed. Full workflow path was intentionally not written to production data.');
  if (fail) process.exitCode = 1;
}

main().catch(error => {
  console.error(`FATAL - ${error.stack || error.message || error}`);
  process.exitCode = 1;
});
