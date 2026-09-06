const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const migrationsDir = path.join(root, 'migrations');
const files = [
  '001_flowly_core_schema.sql',
  '002_flowly_indexes_and_updated_at.sql',
  '003_flowly_tenant_guardrails.sql',
  '004_flowly_real_workflow.sql',
  '005_flowly_ai_real_data.sql',
  '006_flowly_security_audit.sql'
];

let ok = true;
for (const file of files) {
  const full = path.join(migrationsDir, file);
  if (!fs.existsSync(full)) {
    console.error(`MISSING: ${file}`);
    ok = false;
    continue;
  }
  const sql = fs.readFileSync(full, 'utf8');
  if (!/BEGIN;/i.test(sql) || !/COMMIT;/i.test(sql)) {
    console.error(`TRANSACTION WRAPPER MISSING: ${file}`);
    ok = false;
  }
}

const core = fs.readFileSync(path.join(migrationsDir, files[0]), 'utf8');
const requiredTables = [
  'users','businesses','business_members','departments','business_departments',
  'customers','leads','service_requests','bookings','projects','tasks',
  'activity_log','customer_memory','ai_insights','automation_rules'
];
for (const table of requiredTables) {
  const re = new RegExp(`CREATE TABLE IF NOT EXISTS\\s+${table}\\b`, 'i');
  if (!re.test(core)) {
    console.error(`TABLE MISSING: ${table}`);
    ok = false;
  }
}

const departmentCodes = [
  'spa_wellness','beauty_salon','clinic_healthcare','hotel_hospitality',
  'food_restaurant','construction_services','professional_business'
];
for (const code of departmentCodes) {
  if (!core.includes(`'${code}'`)) {
    console.error(`DEPARTMENT SEED MISSING: ${code}`);
    ok = false;
  }
}

if (!ok) process.exit(1);
console.log(`FLOWLY database design check passed: ${requiredTables.length} tables, ${departmentCodes.length}/7 departments, ${files.length} migrations.`);
