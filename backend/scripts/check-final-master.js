const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const backendRoot = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;
const results = [];
function check(name, condition, detail='') {
  if (condition) { passed++; results.push(`PASS ${name}${detail ? ` — ${detail}` : ''}`); }
  else { failed++; results.push(`FAIL ${name}${detail ? ` — ${detail}` : ''}`); }
}
function exists(rel) { return fs.existsSync(path.join(projectRoot, rel)); }
function read(rel) { return fs.readFileSync(path.join(projectRoot, rel), 'utf8'); }

const htmlFiles = fs.readdirSync(projectRoot).filter(f => f.endsWith('.html'));
check('28 top-level HTML pages present', htmlFiles.length === 28, `${htmlFiles.length}/28`);
check('7 customer-front demos present', htmlFiles.filter(f=>/-customer-demo\.html$/.test(f)).length === 7);
check('7 admin showroom demos present', htmlFiles.filter(f=>/-admin-demo\.html$/.test(f)).length === 7);

const coreFiles = [
  'index.html','login.html','dashboard.html','customers.html','booking.html',
  'assets/js/api-client.js','assets/js/auth-client.js','assets/js/protected-admin.js',
  'assets/js/demo-forms.js','assets/js/admin-unified.js','assets/js/intelligence-layer.js',
  'docker-compose.yml','.env.production.example','deploy/nginx/default.conf',
  'backend/src/app.js','backend/src/server.js','backend/package.json'
];
check('Core frontend/backend/deployment files present', coreFiles.every(exists));

const migrations = fs.readdirSync(path.join(backendRoot,'migrations')).filter(f=>/^\d{3}_.*\.sql$/.test(f)).sort();
check('6 ordered SQL migrations present', migrations.length === 6, migrations.join(', '));

const pkg = JSON.parse(fs.readFileSync(path.join(backendRoot,'package.json'),'utf8'));
check('Release version synchronized', pkg.version === '2.33.0' && read('backend/src/app.js').includes("version: '2.33.0'") && read('backend/src/routes/health.routes.js').includes("version: '2.33.0'"));
check('Master QA npm script registered', pkg.scripts && pkg.scripts['check:master'] === 'node scripts/check-final-master.js');

const compose = read('docker-compose.yml');
check('Production stack has db/api/web', /\n\s*db:/.test(compose) && /\n\s*api:/.test(compose) && /\n\s*web:/.test(compose));
check('PostgreSQL not published to host', !/\n\s*ports:\s*\n\s*-\s*["']?5432:5432/.test(compose));
check('Health checks configured', (compose.match(/healthcheck:/g)||[]).length >= 3);

const env = read('.env.production.example');
check('Production secrets remain placeholders', /JWT_SECRET=REPLACE_/.test(env) && /DATABASE_URL=.*REPLACE_/.test(env) && /POSTGRES_PASSWORD=REPLACE_/.test(env));
check('Production frontend origin is HTTPS template', /FRONTEND_ORIGIN=https:\/\//.test(env));

const authRoutes = read('backend/src/routes/auth.routes.js');
check('Auth login/me/logout routes present', ['/login','/me','/logout'].every(x=>authRoutes.includes(x)));
const serviceRoutes = read('backend/src/routes/serviceRequest.routes.js');
check('Public request rate limiting + validation present', serviceRoutes.includes('publicLimiter') && serviceRoutes.includes('validatePublicRequest'));
const app = read('backend/src/app.js');
check('Security middleware enabled', ['helmet','cors','rateLimit','sanitizeInput','csrfGuard','requestLogger'].every(x=>app.includes(x)));

const intelligence = read('backend/src/routes/intelligence.routes.js');
check('AI insight lifecycle endpoints present', ['/overview','/insights','/generate','/status'].every(x=>intelligence.includes(x)));
const workflow = read('backend/src/routes/workflow.routes.js');
check('Workflow confirm + follow-up actions present', workflow.includes('/requests/:id/confirm') && workflow.includes('/leads/:id/follow-up'));

const publicHtml = htmlFiles.map(f=>read(f)).join('\n');
check('Customer front API integration retained', publicHtml.includes('demo-forms.js'));
check('Protected admin guard retained', ['dashboard.html','customers.html','booking.html'].every(f=>read(f).includes('protected-admin.js')));

results.forEach(x=>console.log(x));
console.log(`Final Master structural QA: ${passed}/${passed+failed}`);
if (failed) process.exit(1);
