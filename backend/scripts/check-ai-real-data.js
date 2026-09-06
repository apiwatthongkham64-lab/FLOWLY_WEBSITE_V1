const fs=require('fs');const path=require('path');
const root=path.resolve(__dirname,'..');
const checks=[
 ['migration 005', 'migrations/005_flowly_ai_real_data.sql', /source_key/],
 ['intelligence repository','src/repositories/intelligenceRepository.js',/snapshot/],
 ['real data service','src/services/intelligenceService.js',/real_business_data/],
 ['lead scoring','src/services/intelligenceService.js',/buildLeadInsights/],
 ['task risk','src/services/intelligenceService.js',/buildTaskInsights/],
 ['request followup','src/services/intelligenceService.js',/buildRequestInsights/],
 ['booking workload','src/services/intelligenceService.js',/buildBookingInsights/],
 ['customer memory','src/services/intelligenceService.js',/buildMemorySignal/],
 ['generate endpoint','src/routes/intelligence.routes.js',/\/generate/],
 ['insight status endpoint','src/routes/intelligence.routes.js',/insights\/:id\/status/],
 ['approval guardrail','src/services/intelligenceService.js',/requiresApproval:true/],
 ['tenant scope','src/repositories/intelligenceRepository.js',/business_id=\$1/]
];
let pass=0;for(const [name,file,re] of checks){const full=path.join(root,file);const ok=fs.existsSync(full)&&re.test(fs.readFileSync(full,'utf8'));console.log(`${ok?'PASS':'FAIL'} ${name}`);if(ok)pass++;}
console.log(`AI real-data checks: ${pass}/${checks.length}`);process.exit(pass===checks.length?0:1);
