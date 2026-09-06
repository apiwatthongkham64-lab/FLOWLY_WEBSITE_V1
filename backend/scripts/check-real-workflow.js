const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const required=[
'migrations/004_flowly_real_workflow.sql','src/repositories/bookingRepository.js','src/repositories/taskRepository.js','src/repositories/activityRepository.js','src/services/workflowService.js','src/controllers/bookingController.js','src/controllers/taskController.js','src/controllers/activityController.js','src/controllers/workflowController.js','src/routes/booking.routes.js','src/routes/task.routes.js','src/routes/activity.routes.js','src/routes/workflow.routes.js','docs/REAL_WORKFLOW_V229.md'];
let ok=0;for(const f of required){if(fs.existsSync(path.join(root,f)))ok++;else console.error('MISSING',f)}
const routes=fs.readFileSync(path.join(root,'src/routes/index.js'),'utf8');for(const p of ['/bookings','/tasks','/activity','/workflows']){if(!routes.includes(p))console.error('ROUTE MISSING',p);else ok++;}
const authz=fs.readFileSync(path.join(root,'src/authz.js'),'utf8');for(const p of ['bookings:read','tasks:read','activity:read','workflows:write']){if(!authz.includes(p))console.error('PERMISSION MISSING',p);else ok++;}
console.log(`FLOWLY V2.29 real workflow check: ${ok}/22`);if(ok!==22)process.exit(1);
