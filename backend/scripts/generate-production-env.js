const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function arg(name, fallback = '') {
  const prefix = `--${name}=`;
  const item = process.argv.find((v) => v.startsWith(prefix));
  return item ? item.slice(prefix.length).trim() : fallback;
}

const root = path.resolve(__dirname, '../..');
const output = path.join(root, '.env.production');
const force = process.argv.includes('--force');
const domainRaw = arg('domain');
const domain = domainRaw ? domainRaw.replace(/^https?:\/\//i, '').replace(/\/$/, '') : 'your-domain.example';
const origin = `https://${domain}`;

if (fs.existsSync(output) && !force) {
  console.error('Refusing to overwrite existing .env.production. Re-run with --force only if you intend to replace it.');
  process.exit(2);
}

function secret(bytes = 32) {
  return crypto.randomBytes(bytes).toString('base64url');
}

const dbPassword = secret(30);
const jwtSecret = secret(48);
const databaseUrl = `postgresql://flowly:${dbPassword}@db:5432/flowly`;
const content = `# FLOWLY V2.34 production environment\n# Generated locally. DO NOT COMMIT OR SHARE THIS FILE.\nAPP_ORIGIN=${origin}\nWEB_PORT=8080\nPOSTGRES_DB=flowly\nPOSTGRES_USER=flowly\nPOSTGRES_PASSWORD=${dbPassword}\nDATABASE_URL=${databaseUrl}\n\nNODE_ENV=production\nPORT=8787\nAPI_PREFIX=/api/v1\nFRONTEND_ORIGIN=${origin}\nTRUST_PROXY=true\nAUTH_MODE=database\nJWT_SECRET=${jwtSecret}\nJWT_EXPIRES_IN=8h\nJWT_ISSUER=flowly-api\nJWT_AUDIENCE=flowly-web\nCOOKIE_NAME=flowly_session\nDB_SSL=false\nDB_POOL_MAX=10\nDB_IDLE_TIMEOUT_MS=30000\nDB_CONNECTION_TIMEOUT_MS=5000\nJSON_LIMIT=256kb\nGLOBAL_RATE_LIMIT_MAX=180\nLOGIN_RATE_LIMIT_MAX=10\nPUBLIC_REQUEST_RATE_LIMIT_MAX=20\nBACKUP_DIR=./backups\nBACKUP_RETENTION_DAYS=14\n`;
fs.writeFileSync(output, content, { mode: 0o600 });
console.log(`Created ${output}`);
if (!domainRaw) console.log('ACTION REQUIRED: replace your-domain.example with the real domain before deployment.');
console.log('Secrets were generated with cryptographically secure random bytes and were not printed to the console.');
