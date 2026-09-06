const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '../..');
const required = [
  'docker-compose.yml','.dockerignore','.env.production.example','deploy/nginx/default.conf','deploy/web.Dockerfile','backend/Dockerfile','backend/.dockerignore','backend/scripts/migrate.js','DEPLOYMENT_V232.md','DEPLOYMENT_CHECKLIST_V232.md'
];
let ok=0;
for (const rel of required) {
  const exists=fs.existsSync(path.join(root,rel));
  console.log(`${exists?'PASS':'FAIL'} ${rel}`); if(exists) ok++;
}
const compose=fs.readFileSync(path.join(root,'docker-compose.yml'),'utf8');
for (const token of ['db:','api:','web:','healthcheck:','DATABASE_URL: ${DATABASE_URL:?']) {
  const pass=compose.includes(token); console.log(`${pass?'PASS':'FAIL'} compose:${token}`); if(pass) ok++;
}
const webDocker=fs.readFileSync(path.join(root,'deploy/web.Dockerfile'),'utf8');
const safeWeb=!webDocker.includes('COPY . ') && webDocker.includes('COPY *.html') && webDocker.includes('COPY assets');
console.log(`${safeWeb?'PASS':'FAIL'} frontend image excludes project secrets/backend`); if(safeWeb) ok++;
console.log(`Deployment checks ${ok}/${required.length+6}`);
process.exit(ok===required.length+6?0:1);
