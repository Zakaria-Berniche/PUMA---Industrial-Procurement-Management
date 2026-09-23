import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET!;

// Fixture: admin user for RBAC tests
const ADMIN_USER_ID = 'test_rbac_admin_001';
const ADMIN_EMAIL = 'rbac.admin@puma.com';
const ADMIN_HASH = bcrypt.hashSync('admin_pass_2026', 10);

// Fixture: collaborator user (non-admin) for RBAC tests
const COLLAB_USER_ID = 'test_rbac_collab_001';
const COLLAB_EMAIL = 'rbac.collab@puma.com';
const COLLAB_HASH = bcrypt.hashSync('collab_pass_2026', 10);

// User ID to be created/deleted in RBAC tests (admin-only)
const TARGET_USER_ID = 'test_rbac_target_user';

let adminToken: string;
let collabToken: string;

beforeAll(() => {
  // Insert admin fixture
  const adminData = { id: ADMIN_USER_ID, name: 'RBAC Admin', email: ADMIN_EMAIL, role: 'Admin', department: 'IT', password_hash: ADMIN_HASH };
  db.prepare('INSERT OR IGNORE INTO users (id, name, email, role, department, password_hash, data) VALUES (?,?,?,?,?,?,?)')
    .run(ADMIN_USER_ID, adminData.name, adminData.email, adminData.role, adminData.department, ADMIN_HASH, JSON.stringify(adminData));
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(ADMIN_HASH, ADMIN_USER_ID);

  // Insert collaborator fixture
  const collabData = { id: COLLAB_USER_ID, name: 'RBAC Collab', email: COLLAB_EMAIL, role: 'Collaborateur', department: 'Achat', password_hash: COLLAB_HASH };
  db.prepare('INSERT OR IGNORE INTO users (id, name, email, role, department, password_hash, data) VALUES (?,?,?,?,?,?,?)')
    .run(COLLAB_USER_ID, collabData.name, collabData.email, collabData.role, collabData.department, COLLAB_HASH, JSON.stringify(collabData));
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(COLLAB_HASH, COLLAB_USER_ID);

  // Generate tokens directly (bypass HTTP)
  adminToken = jwt.sign({ id: ADMIN_USER_ID, email: ADMIN_EMAIL, role: 'Admin' }, JWT_SECRET, { expiresIn: '1h' });
  collabToken = jwt.sign({ id: COLLAB_USER_ID, email: COLLAB_EMAIL, role: 'Collaborateur' }, JWT_SECRET, { expiresIn: '1h' });
});

afterAll(() => {
  // Cleanup all test users
  db.prepare('DELETE FROM users WHERE id IN (?, ?, ?)').run(ADMIN_USER_ID, COLLAB_USER_ID, TARGET_USER_ID);
});

describe('RBAC — POST /api/users (Création utilisateur)', () => {
  const newUserPayload = {
    id: TARGET_USER_ID,
    name: 'Nouvel Utilisateur Test',
    email: 'newuser.rbac@puma.com',
    role: 'Collaborateur',
    department: 'Test'
  };

  it('retourne 401 Unauthorized si aucun token n\'est fourni', async () => {
    const res = await request(app)
      .post('/api/users')
      .send(newUserPayload)
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  it('retourne 403 Forbidden si un Collaborateur tente de créer un utilisateur', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${collabToken}`)
      .send(newUserPayload)
      .expect('Content-Type', /json/)
      .expect(403);

    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Accès refusé');
  });

  it('retourne 201 Created si un Admin crée un utilisateur', async () => {
    // Cleanup potential leftovers first
    db.prepare('DELETE FROM users WHERE id = ?').run(TARGET_USER_ID);

    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(newUserPayload)
      .expect('Content-Type', /json/)
      .expect(201);

    expect(res.body).toHaveProperty('id', TARGET_USER_ID);
    expect(res.body).toHaveProperty('email', newUserPayload.email);
  });
});

describe('RBAC — DELETE /api/users/:id (Suppression utilisateur)', () => {
  it('retourne 403 Forbidden si un Collaborateur tente de supprimer un utilisateur', async () => {
    const res = await request(app)
      .delete(`/api/users/${TARGET_USER_ID}`)
      .set('Authorization', `Bearer ${collabToken}`)
      .expect('Content-Type', /json/)
      .expect(403);

    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Accès refusé');
  });

  it('retourne 204 No Content si un Admin supprime un utilisateur', async () => {
    // Make sure the target user exists
    const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(TARGET_USER_ID);
    if (!existing) {
      const d = { id: TARGET_USER_ID, name: 'Target', email: 'del@puma.com', role: 'Collaborateur', department: 'Test' };
      db.prepare('INSERT OR IGNORE INTO users (id, name, email, role, department, password_hash, data) VALUES (?,?,?,?,?,?,?)')
        .run(TARGET_USER_ID, d.name, d.email, d.role, d.department, '', JSON.stringify(d));
    }

    await request(app)
      .delete(`/api/users/${TARGET_USER_ID}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(204);
  });
});

describe('RBAC — POST /api/tasks (Création tâche)', () => {
  it('retourne 403 Forbidden si un Collaborateur tente de créer une tâche', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${collabToken}`)
      .send({ id: 'task_test_001', siteId: 'site_1', assigneeId: COLLAB_USER_ID, status: 'Nouveau', title: 'Test Task' })
      .expect('Content-Type', /json/)
      .expect(403);

    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Accès refusé');
  });
});
