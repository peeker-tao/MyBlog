const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbFile = path.join(__dirname, '..', 'db', 'blog.db');
const migrationsDir = path.join(__dirname, '..', 'db', 'migrations');

async function ensureDbDir() {
  const dir = path.dirname(dbFile);
  fs.mkdirSync(dir, { recursive: true });
}

async function migrate() {
  await ensureDbDir();
  const db = await open({ filename: dbFile, driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON;');
  await db.exec(
    'CREATE TABLE IF NOT EXISTS migrations (id INTEGER PRIMARY KEY, filename TEXT UNIQUE, applied_at TEXT DEFAULT CURRENT_TIMESTAMP)',
  );

  const applied = await db.all('SELECT filename FROM migrations');
  const appliedSet = new Set(applied.map((row) => row.filename));

  const files = fs
    .readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (appliedSet.has(file)) {
      continue;
    }
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await db.exec(sql);
    await db.run('INSERT INTO migrations (filename) VALUES (?)', file);
    console.log(`Applied ${file}`);
  }

  await db.close();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
