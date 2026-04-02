const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbFile = path.join(__dirname, '..', 'db', 'blog.db');
let dbPromise;

async function getDb() {
  if (!dbPromise) {
    fs.mkdirSync(path.dirname(dbFile), { recursive: true });
    dbPromise = open({ filename: dbFile, driver: sqlite3.Database }).then(
      async (db) => {
        await db.exec('PRAGMA foreign_keys = ON;');
        return db;
      },
    );
  }
  return dbPromise;
}

module.exports = { getDb };
