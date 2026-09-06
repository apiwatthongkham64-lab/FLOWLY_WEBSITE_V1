const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const checks = [];
function ok(name, condition) { checks.push({ name, condition: !!condition }); }
function has(file, needle) { const p = path.join(root, file); return fs.existsSync(p) && fs.readFileSync(p, 'utf8').includes(needle); }

ok('docker-compose.yml exists', fs.existsSync(path.join(root, 'docker-compose.yml')));
ok('production env template exists', fs.existsSync(path.join(root, '.env.production.example')));
ok('first live shell deploy script exists', fs.existsSync(path.join(root, 'deploy/first-live-deploy.sh')));
ok('first live PowerShell deploy script exists', fs.existsSync(path.join(root, 'deploy/first-live-deploy.ps1')));
ok('smoke test shell exists', fs.existsSync(path.join(root, 'deploy/smoke-test.sh')));
ok('smoke test PowerShell exists', fs.existsSync(path.join(root, 'deploy/smoke-test.ps1')));
ok('status shell exists', fs.existsSync(path.join(root, 'deploy/status.sh')));
ok('status PowerShell exists', fs.existsSync(path.join(root, 'deploy/status.ps1')));
ok('rollback shell exists', fs.existsSync(path.join(root, 'deploy/rollback.sh')));
ok('rollback PowerShell exists', fs.existsSync(path.join(root, 'deploy/rollback.ps1')));
ok('compose has db health dependency', has('docker-compose.yml', 'condition: service_healthy'));
ok('compose persists postgres data', has('docker-compose.yml', 'flowly_pgdata:/var/lib/postgresql/data'));
ok('compose does not publish postgres port', !/\n\s*ports:\s*\n\s*-\s*["\']?5432/.test(fs.readFileSync(path.join(root,'docker-compose.yml'),'utf8')));
ok('web proxies /api to api service', has('deploy/nginx/default.conf', 'proxy_pass http://api:8787'));
ok('deploy runs migrations', has('deploy/first-live-deploy.sh', 'scripts/migrate.js') && has('deploy/first-live-deploy.ps1', 'scripts/migrate.js'));
ok('deploy performs smoke test', has('deploy/first-live-deploy.sh', 'smoke-test.sh') && has('deploy/first-live-deploy.ps1', 'smoke-test.ps1'));
ok('rollback does not destroy volumes', !has('deploy/rollback.sh', 'down -v') && !has('deploy/rollback.ps1', 'down -v'));
ok('release version is 2.35.0', require('../package.json').version === '2.35.0');

for (const c of checks) console.log(`${c.condition ? 'PASS' : 'FAIL'} - ${c.name}`);
const failed = checks.filter(c => !c.condition);
console.log(`\nFirst live deployment checks: ${checks.length - failed.length}/${checks.length} passed`);
if (failed.length) process.exit(1);
