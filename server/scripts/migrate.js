import fs from 'fs';
import path from 'path';
import url from 'url';
import pool from '../src/config/db.js';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

async function run() {
  const schemaPath = path.join(__dirname, '..', 'sql', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = sql.split(/;\s*\n/).filter(s => s.trim());
  const conn = await pool.getConnection();
  try {
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('Migration completed');
  } finally {
    conn.release();
    process.exit(0);
  }
}

run().catch(err => { console.error(err); process.exit(1); });


