import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('puma_database.sqlite');
const db = new Database(dbPath);

console.log('Database status:');
console.log('Users count:', db.prepare('SELECT count(*) as count FROM users').get().count);
console.log('Sites count:', db.prepare('SELECT count(*) as count FROM sites').get().count);
console.log('Tasks count:', db.prepare('SELECT count(*) as count FROM tasks').get().count);
console.log('Settings count:', db.prepare('SELECT count(*) as count FROM settings').get().count);

const users = db.prepare('SELECT id, role, email FROM users').all();
console.log('Users:', users);
const settings = db.prepare('SELECT id FROM settings').all();
console.log('Settings:', settings.map(s => s.id));
