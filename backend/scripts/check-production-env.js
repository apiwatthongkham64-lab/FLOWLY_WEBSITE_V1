const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const root = path.resolve(__dirname, '../..');
const file = path.join(root, '.env.production');
if (!fs.existsSync(file)) {
  console.error('FAIL: .env.production does not exist. Run npm run prod:env:generate -- --domain=yourdomain.com');
  process.exit(1);
}

const env = {};
for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
  const s = line.trim();
  if (!s || s.startsWith('#')) continue;
  const i = s.indexOf('=');
  if (i > 0) env[s.slice(0, i)] = s.slice(i + 1);
}

const checks = [];
function ok(name, condition, detail = '') { checks.push({ name, condition: !!condition, detail }); }
function httpsUrl(v) { try { return new URL(v).protocol === 'https:'; } catch { return false; } }

ok('NODE_ENV=production', env.NODE_ENV === 'production');
ok('AUTH_MODE=database', env.AUTH_MODE === 'database');
ok('APP_ORIGIN uses HTTPS', httpsUrl(env.APP_ORIGIN));
ok('FRONTEND_ORIGIN uses HTTPS', httpsUrl(env.FRONTEND_ORIGIN));
ok('Origins match', env.APP_ORIGIN === env.FRONTEND_ORIGIN);
ok('No placeholder domain', !/your-domain\.example|example\.com/i.test(env.APP_ORIGIN || ''));
ok('JWT secret >= 32 chars', (env.JWT_SECRET || '').length >= 32);
ok('JWT secret is not example', !/REPLACE|change-me|dev-only/i.test(env.JWT_SECRET || ''));
ok('Postgres password >= 24 chars', (env.POSTGRES_PASSWORD || '').length >= 24);
ok('Database URL is postgres', /^postgres(?:ql)?:\/\//i.test(env.DATABASE_URL || ''));
ok('Database URL targets db service', /@db:5432\//.test(env.DATABASE_URL || ''));
ok('TRUST_PROXY=true', env.TRUST_PROXY === 'true');
ok('Cookie name present', !!env.COOKIE_NAME);
ok('Backup retention positive', Number(env.BACKUP_RETENTION_DAYS) > 0);
ok('Rate limits positive', ['GLOBAL_RATE_LIMIT_MAX','LOGIN_RATE_LIMIT_MAX','PUBLIC_REQUEST_RATE_LIMIT_MAX'].every(k => Number(env[k]) > 0));

for (const c of checks) console.log(`${c.condition ? 'PASS' : 'FAIL'} - ${c.name}${c.detail ? `: ${c.detail}` : ''}`);
const failed = checks.filter(c => !c.condition);
console.log(`\nProduction env checks: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
