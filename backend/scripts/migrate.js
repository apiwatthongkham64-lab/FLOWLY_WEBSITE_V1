const fs = require('fs/promises');
const path = require('path');
const { Pool } = require('pg');
require('dotenv').config({ path: process.env.ENV_FILE || path.resolve(__dirname, '../../.env.production') });

async function main() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false });
  const dir = path.resolve(__dirname, '../migrations');
  const files = (await fs.readdir(dir)).filter(f => /^\d+.*\.sql$/.test(f)).sort();
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`);
    const applied = new Set((await client.query('SELECT filename FROM schema_migrations')).rows.map(r => r.filename));
    for (const file of files) {
      if (applied.has(file)) { console.log(`skip ${file}`); continue; }
      const sql = await fs.readFile(path.join(dir, file), 'utf8');
      console.log(`apply ${file}`);
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(filename) VALUES($1)', [file]);
        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      }
    }
    console.log('migrations complete');
  } finally {
    client.release();
    await pool.end();
  }
}
main().catch(err => { console.error(err); process.exit(1); });
