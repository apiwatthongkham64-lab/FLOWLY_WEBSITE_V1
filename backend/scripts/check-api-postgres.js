const fs=require('fs');const path=require('path');const root=path.resolve(__dirname,'..');
const required=['src/repositories/userRepository.js','src/repositories/businessRepository.js','src/repositories/customerRepository.js','src/repositories/leadRepository.js','src/repositories/serviceRequestRepository.js','src/controllers/customerController.js','src/controllers/leadController.js','src/controllers/serviceRequestController.js','src/routes/customer.routes.js','src/routes/lead.routes.js','src/routes/serviceRequest.routes.js','scripts/seed-demo.js'];
let ok=0;for(const f of required){if(fs.existsSync(path.join(root,f)))ok++;else console.error('MISSING',f)}
const routes=fs.readFileSync(path.join(root,'src/routes/index.js'),'utf8');for(const p of ['/customers','/leads','/service-requests']){if(!routes.includes(p))throw new Error(`Route missing ${p}`)}
console.log(`FLOWLY V2.27 API/PostgreSQL check: ${ok}/${required.length} files present`);if(ok!==required.length)process.exit(1);
