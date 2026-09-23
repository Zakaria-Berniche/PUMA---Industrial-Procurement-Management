import Database from 'better-sqlite3';
import path from 'path';

const dbPath = path.resolve('puma_database.sqlite');
const db = new Database(dbPath);

const adminData = {
  id: 'user_admin_001',
  name: 'Admin Puma',
  email: 'admin@puma.com',
  role: 'Admin',
  department: 'Direction',
  position: 'Directeur des Achats',
  themePreference: 'dark'
};

db.prepare("INSERT OR IGNORE INTO users (id, email, role, data) VALUES (?, ?, ?, ?)")
  .run(adminData.id, adminData.email, adminData.role, JSON.stringify(adminData));

console.log('✅ Base de données seedée avec l\'utilisateur admin@puma.com / password123');
