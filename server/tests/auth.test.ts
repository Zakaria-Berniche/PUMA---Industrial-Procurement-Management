import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import db from '../db.js';
import bcrypt from 'bcryptjs';

// Fixture: a test user inserted before auth tests
const TEST_USER_ID = 'test_auth_user_001';
const TEST_EMAIL = 'auth.test@puma.com';
const TEST_PASSWORD = 'testpass_auth_2026';
const TEST_HASH = bcrypt.hashSync(TEST_PASSWORD, 10);

beforeAll(() => {
  // Insert test user
  const existing = db.prepare('SELECT id FROM users WHERE id = ?').get(TEST_USER_ID);
  if (!existing) {
    const userData = {
      id: TEST_USER_ID,
      name: 'Auth Test User',
      email: TEST_EMAIL,
      role: 'Collaborateur',
      department: 'IT',
      password_hash: TEST_HASH
    };
    db.prepare(
      'INSERT OR IGNORE INTO users (id, name, email, role, department, password_hash, data) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(
      TEST_USER_ID,
      userData.name,
      userData.email,
      userData.role,
      userData.department,
      TEST_HASH,
      JSON.stringify(userData)
    );
  } else {
    // Ensure password hash is set on existing row
    db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(TEST_HASH, TEST_USER_ID);
    const row = db.prepare('SELECT data FROM users WHERE id = ?').get(TEST_USER_ID) as any;
    if (row) {
      const d = JSON.parse(row.data);
      d.password_hash = TEST_HASH;
      db.prepare('UPDATE users SET data = ? WHERE id = ?').run(JSON.stringify(d), TEST_USER_ID);
    }
  }
});

afterAll(() => {
  // Cleanup test user
  db.prepare('DELETE FROM users WHERE id = ?').run(TEST_USER_ID);
});

describe('POST /api/login — Authentication', () => {
  it('retourne 200 OK et un token JWT avec des identifiants valides', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: TEST_EMAIL, password: TEST_PASSWORD })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('token');
    expect(typeof res.body.token).toBe('string');
    expect(res.body.token.length).toBeGreaterThan(10);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe(TEST_EMAIL);
  });

  it('retourne 401 Unauthorized avec un mauvais mot de passe', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: TEST_EMAIL, password: 'wrong_password_xyz' })
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Identifiants invalides');
  });

  it('retourne 401 Unauthorized avec un email inexistant', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'nobody@puma.com', password: 'somepassword' })
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  it('retourne 401 si le corps de la requête est vide', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({})
      .expect('Content-Type', /json/)
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });
});
