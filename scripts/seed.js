const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbFile = path.join(__dirname, '..', 'db', 'blog.db');
const seedFile = path.join(__dirname, '..', 'db', 'seed.sql');

async function seed() {
  const db = await open({ filename: dbFile, driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON;');
  const sql = fs.readFileSync(seedFile, 'utf8');
  await db.exec(sql);
  await db.close();
  console.log('Seed data applied.');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
