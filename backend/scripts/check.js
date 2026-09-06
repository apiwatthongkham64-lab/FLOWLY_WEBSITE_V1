const fs = require('fs');
const path = require('path');
const required = [
  'src/server.js','src/app.js','src/config/env.js','src/config/db.js',
  'src/routes/index.js','src/routes/health.routes.js','src/routes/auth.routes.js',
  'src/routes/business.routes.js','src/routes/intelligence.routes.js',
  '.env.example','package.json'
];
const missing = required.filter((p) => !fs.existsSync(path.resolve(__dirname, '..', p)));
if (missing.length) {
  console.error('Missing backend foundation files:', missing);
  process.exit(1);
}
console.log(`FLOWLY backend foundation check passed (${required.length}/${required.length}).`);
