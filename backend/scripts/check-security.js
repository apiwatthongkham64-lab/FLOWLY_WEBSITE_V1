const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const checks=[];
function check(name,condition){checks.push([name,Boolean(condition)]);}
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8');}
check('security migration exists',fs.existsSync(path.join(root,'migrations/006_flowly_security_audit.sql')));
check('rate limiter exists',fs.existsSync(path.join(root,'src/middleware/rateLimit.js')));
check('input sanitizer exists',fs.existsSync(path.join(root,'src/middleware/validate.js')));
check('csrf origin guard exists',fs.existsSync(path.join(root,'src/middleware/csrfGuard.js')));
check('structured logger exists',fs.existsSync(path.join(root,'src/utils/logger.js')));
check('security audit repository exists',fs.existsSync(path.join(root,'src/repositories/securityAuditRepository.js')));
check('backup script exists',fs.existsSync(path.join(root,'scripts/backup-db.js')));
check('restore requires confirmation',read('scripts/restore-db.js').includes("CONFIRM_RESTORE!=='YES'"));
check('production requires database auth',read('src/config/env.js').includes("AUTH_MODE must be database in production"));
check('production requires HTTPS frontend',read('src/config/env.js').includes("FRONTEND_ORIGIN must use HTTPS in production"));
check('JWT issuer/audience enforced',read('src/middleware/auth.js').includes('issuer: env.jwtIssuer')&&read('src/services/authService.js').includes('audience: env.jwtAudience'));
check('production hides 500 details',read('src/middleware/errorHandler.js').includes("message = 'Internal server error'"));
check('public request rate limit configured',read('src/routes/serviceRequest.routes.js').includes('publicLimiter'));
check('login rate limit configured',read('src/routes/auth.routes.js').includes('loginLimiter'));
check('mutation audit middleware in use',read('src/routes/customer.routes.js').includes('auditMutation'));
let failed=checks.filter(x=>!x[1]);
for(const [name,ok] of checks)console.log(`${ok?'PASS':'FAIL'} ${name}`);
console.log(`Security checks: ${checks.length-failed.length}/${checks.length}`);
if(failed.length)process.exit(1);
