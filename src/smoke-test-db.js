import Database from 'better-sqlite3';

const db = new Database(':memory:');
db.exec('CREATE TABLE t (k TEXT)');
db.prepare('INSERT INTO t VALUES (?)').run('hello');
const row = db.prepare('SELECT k FROM t').get();
console.log('SQLite OK:', row);