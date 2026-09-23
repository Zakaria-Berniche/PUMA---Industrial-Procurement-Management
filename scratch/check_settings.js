import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('puma_database.sqlite');
const db = new Database(dbPath);

const settings = db.prepare('SELECT id FROM settings').all();
console.log('Settings IDs:', settings.map(s => s.id));
