#!/usr/bin/env node
'use strict';
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const checks = [];
function check(name, ok) { checks.push([name, Boolean(ok)]); console.log(`${ok ? 'PASS' : 'FAIL'} - ${name}`); }
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); }
const pkg = JSON.parse(read('backend/package.json'));
const e2e = read('backend/scripts/production-e2e-smoke.js');
const ps = read('deploy/production-smoke-test.ps1');
const sh = read('deploy/production-smoke-test.sh');
const guide = read('PRODUCTION_SMOKE_TEST_V236.md');
check('Backend version is 2.36.0', pkg.version === '2.36.0');
check('npm smoke:e2e command exists', pkg.scripts?.['smoke:e2e'] === 'node scripts/production-e2e-smoke.js');
check('npm check:smoke command exists', pkg.scripts?.['check:smoke'] === 'node scripts/check-production-smoke.js');
check('E2E checks web health', e2e.includes("'/healthz'"));
check('E2E checks API health and DB connection', e2e.includes('database?.connected === true'));
check('E2E checks owner login/session', e2e.includes('Owner login') && e2e.includes('/api/v1/auth/me'));
check('E2E checks admin and staff roles', e2e.includes('Admin login') && e2e.includes('Staff login'));
check('E2E checks staff permission boundary', e2e.includes('Staff cannot create customer') && e2e.includes("r.res.status === 403"));
check('Full mode tests Customer Front request', e2e.includes('/api/v1/service-requests/public'));
check('Full mode tests Request → Booking + Task', e2e.includes('/workflows/requests/') && e2e.includes('booking not created'));
check('Full mode tests Lead follow-up', e2e.includes('/workflows/leads/'));
check('Full mode tests Activity timeline', e2e.includes('/api/v1/activity?limit=100'));
check('Full mode tests AI real-data generation', e2e.includes('/api/v1/intelligence/generate'));
check('Full mode tests Next Best Action', e2e.includes('/api/v1/intelligence/overview?department=spa'));
check('E2E checks logout/401', e2e.includes('Owner logout') && e2e.includes('Logged-out session rejected'));
check('Writes are opt-in only', e2e.includes("SMOKE_WRITE || 'false'") && e2e.includes('if (WRITE)'));
check('Windows wrapper exists', ps.includes('production-e2e-smoke.js'));
check('Linux/macOS wrapper exists', sh.includes('production-e2e-smoke.js'));
check('Guide distinguishes safe vs full mode', guide.includes('SAFE') && guide.includes('FULL'));
const failed = checks.filter(([, ok]) => !ok);
console.log(`Production Smoke QA: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
