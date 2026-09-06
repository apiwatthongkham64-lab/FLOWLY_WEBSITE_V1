const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const checks=[];function ok(name,cond){checks.push([name,!!cond]);}
const auth=fs.readFileSync(path.join(root,'src/middleware/auth.js'),'utf8');
const authz=fs.readFileSync(path.join(root,'src/authz.js'),'utf8');
const demo=fs.readFileSync(path.join(root,'src/data/demoUsers.js'),'utf8');
ok('owner role',authz.includes('owner:'));ok('admin role',authz.includes('admin:'));ok('staff role',authz.includes('staff:'));ok('permission middleware',auth.includes('requirePermission'));ok('staff demo user',demo.includes('staff@flowly.demo'));
for(const f of ['business.routes.js','customer.routes.js','lead.routes.js','serviceRequest.routes.js','intelligence.routes.js']){const s=fs.readFileSync(path.join(root,'src/routes',f),'utf8');ok(`${f} guarded`,s.includes('requirePermission'))}
checks.forEach(([n,v])=>console.log(`${v?'PASS':'FAIL'} ${n}`));if(checks.some(x=>!x[1]))process.exit(1);console.log(`Auth/Roles ${checks.length}/${checks.length}`);
