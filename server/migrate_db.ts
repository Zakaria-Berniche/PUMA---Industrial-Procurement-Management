import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('puma_database.sqlite');
const db = new Database(dbPath);

console.log('🔄 Début de la migration de la base de données vers le modèle Hybride...');

const addColumnSafe = (table: string, column: string, type: string) => {
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${type}`);
    console.log(`✅ Added column ${column} to ${table}`);
  } catch (err: any) {
    if (!err.message.includes('duplicate column name')) {
      console.error(`Error adding ${column} to ${table}:`, err.message);
    }
  }
};

// Add columns to Users
['name TEXT', 'department TEXT', 'siteId TEXT'].forEach(col => {
  const [colName, colType] = col.split(' ');
  addColumnSafe('users', colName, colType);
});

// Add columns to Sites
['name TEXT', 'type TEXT', 'managerId TEXT'].forEach(col => {
  const [colName, colType] = col.split(' ');
  addColumnSafe('sites', colName, colType);
});

// Add columns to Tasks
['title TEXT', 'department TEXT', 'priority TEXT', 'type TEXT', 'healthStatus TEXT', 'riskLevel TEXT', 'startDate TEXT', 'dueDate TEXT', 'createdAt TEXT'].forEach(col => {
  const [colName, colType] = col.split(' ');
  addColumnSafe('tasks', colName, colType);
});

// 1. Users
console.log('Migrating users...');
const users = db.prepare('SELECT id, data FROM users').all();
for (const u of users) {
  const data = JSON.parse(u.data);
  db.prepare(`
    UPDATE users 
    SET name = ?, email = ?, role = ?, siteId = ?, department = ? 
    WHERE id = ?
  `).run(data.name || '', data.email || '', data.role || '', data.siteId || null, data.department || '', u.id);
}

// 2. Sites
console.log('Migrating sites...');
const sites = db.prepare('SELECT id, data FROM sites').all();
for (const s of sites) {
  const data = JSON.parse(s.data);
  db.prepare(`
    UPDATE sites 
    SET name = ?, type = ?, managerId = ? 
    WHERE id = ?
  `).run(data.name || '', data.type || '', data.managerId || '', s.id);
}

// 3. Tasks
console.log('Migrating tasks...');
const tasks = db.prepare('SELECT id, data FROM tasks').all();
for (const t of tasks) {
  const data = JSON.parse(t.data);
  db.prepare(`
    UPDATE tasks 
    SET title = ?, siteId = ?, department = ?, assigneeId = ?, priority = ?, status = ?, type = ?, healthStatus = ?, riskLevel = ?, startDate = ?, dueDate = ?, createdAt = ?
    WHERE id = ?
  `).run(
    data.title || '', 
    data.siteId || '', 
    data.department || '', 
    data.assigneeId || '', 
    data.priority || '', 
    data.status || '', 
    data.type || '', 
    data.healthStatus || '', 
    data.riskLevel || '', 
    data.startDate || '', 
    data.dueDate || '', 
    data.createdAt || '', 
    t.id
  );
}

console.log('✅ Migration terminée avec succès !');
