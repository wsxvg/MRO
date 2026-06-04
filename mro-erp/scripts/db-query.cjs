#!/usr/bin/env node
// Usage: node scripts/db-query.js "SELECT ..."
const { Client } = require('pg');

const client = new Client({
  host: 'db.gzvymxcojrljkprkgoap.supabase.co',
  port: 5432,
  user: 'postgres',
  password: 'Wan1314520.@',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = process.argv[2];
if (!sql) {
  console.error('Usage: node scripts/db-query.js "SQL"');
  process.exit(1);
}

client.connect()
  .then(() => client.query(sql))
  .then(res => {
    if (res.rows && res.rows.length > 0) {
      console.log(JSON.stringify(res.rows, null, 2));
    } else {
      console.log('OK', res.command, res.rowCount !== undefined ? `(${res.rowCount} rows)` : '');
    }
    client.end();
  })
  .catch(e => {
    console.error('ERROR:', e.message);
    client.end();
    process.exit(1);
  });
