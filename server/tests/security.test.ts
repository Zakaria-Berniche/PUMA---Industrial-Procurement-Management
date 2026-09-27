import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../index.js';
import db from '../db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const JWT_SECRET = process.env.JWT_SECRET!;

const USER_ALICE_ID = 'test_sec_alice_001';
const USER_BOB_ID = 'test_sec_bob_002';
const USER_ADMIN_ID = 'test_sec_admin_003';

let aliceToken: string;
let adminToken: string;

beforeAll(() => {
  const hash = bcrypt.hashSync('sec_pass_2026', 10);

  // User Alice (Collaborateur)
  const alice = { id: USER_ALICE_ID, name: 'Alice Sec', email: 'alice.sec@puma.com', role: 'Collaborateur', department: 'Logistique', password_hash: hash };
  db.prepare('INSERT OR IGNORE INTO users (id, name, email, role, department, password_hash, data) VALUES (?,?,?,?,?,?,?)')
    .run(USER_ALICE_ID, alice.name, alice.email, alice.role, alice.department, hash, JSON.stringify(alice));
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, USER_ALICE_ID);

  // User Bob (Collaborateur)
  const bob = { id: USER_BOB_ID, name: 'Bob Sec', email: 'bob.sec@puma.com', role: 'Collaborateur', department: 'Production', password_hash: hash };
  db.prepare('INSERT OR IGNORE INTO users (id, name, email, role, department, password_hash, data) VALUES (?,?,?,?,?,?,?)')
    .run(USER_BOB_ID, bob.name, bob.email, bob.role, bob.department, hash, JSON.stringify(bob));
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, USER_BOB_ID);

  // User Admin
  const admin = { id: USER_ADMIN_ID, name: 'Admin Sec', email: 'admin.sec@puma.com', role: 'Admin', department: 'Direction', password_hash: hash };
  db.prepare('INSERT OR IGNORE INTO users (id, name, email, role, department, password_hash, data) VALUES (?,?,?,?,?,?,?)')
    .run(USER_ADMIN_ID, admin.name, admin.email, admin.role, admin.department, hash, JSON.stringify(admin));
  db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, USER_ADMIN_ID);

  aliceToken = jwt.sign({ id: USER_ALICE_ID, email: alice.email, role: alice.role }, JWT_SECRET, { expiresIn: '1h' });
  adminToken = jwt.sign({ id: USER_ADMIN_ID, email: admin.email, role: admin.role }, JWT_SECRET, { expiresIn: '1h' });
});

afterAll(() => {
  db.prepare('DELETE FROM users WHERE id IN (?, ?, ?)').run(USER_ALICE_ID, USER_BOB_ID, USER_ADMIN_ID);
  db.prepare('DELETE FROM procurement_campaigns WHERE id = ?').run('campaign_rate_test');
});

describe('1. SQLite Concurrency & WAL Configuration', () => {
  it('est configuré en journal_mode = WAL', () => {
    const journalMode = db.pragma('journal_mode', { simple: true });
    expect(journalMode).toBe('wal');
  });

  it('est configuré en synchronous = 1 (NORMAL)', () => {
    const synchronous = db.pragma('synchronous', { simple: true });
    // SQLite: 0 = OFF, 1 = NORMAL, 2 = FULL, 3 = EXTRA
    expect(synchronous).toBe(1);
  });
});

describe('2. Security Headers (Helmet)', () => {
  it('renvoie les en-têtes de sécurité standard nosniff et frameguard', async () => {
    const res = await request(app).get('/api/health');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBe('SAMEORIGIN');
    expect(res.headers['referrer-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toBeDefined();
    expect(res.headers['content-security-policy']).toContain('tile.openstreetmap.org');
  });
});

describe('3. Rate Limiting Headers', () => {
  it('fournit les en-têtes RateLimit sur /api/login', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'unknown@puma.com', password: 'test' });

    expect(res.headers['ratelimit-limit']).toBeDefined();
    expect(res.headers['ratelimit-remaining']).toBeDefined();
  });

  it('fournit les en-têtes RateLimit sur /api/send_email', async () => {
    const res = await request(app)
      .post('/api/send_email')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ userId: USER_ALICE_ID, supplierId: 's1', body: 'Test' });

    expect(res.headers['ratelimit-limit']).toBeDefined();
  });

  it('fournit les en-têtes RateLimit sur /api/procurement_campaigns', async () => {
    const res = await request(app)
      .post('/api/procurement_campaigns')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: 'campaign_rate_test', title: 'Test' });

    expect(res.headers['ratelimit-limit']).toBeDefined();
  });
});

describe('4. Contrôle d\'Accès Email (/api/send_email)', () => {
  it('refuse l\'accès (401) si la requête est non authentifiée', async () => {
    const res = await request(app)
      .post('/api/send_email')
      .send({
        userId: USER_ALICE_ID,
        supplierId: 'sup_test_1',
        body: 'Demande de devis'
      })
      .expect(401);

    expect(res.body).toHaveProperty('error');
  });

  it('interdit (403) l\'usurpation si Alice tente d\'envoyer un email avec l\'identifiant de Bob', async () => {
    const res = await request(app)
      .post('/api/send_email')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        userId: USER_BOB_ID,
        supplierId: 'sup_test_1',
        body: 'Email forgé au nom de Bob'
      })
      .expect(403);

    expect(res.body.error).toContain('Accès refusé');
  });

  it('autorise le contrôle d\'accès si Alice envoie un email avec son propre identifiant', async () => {
    const res = await request(app)
      .post('/api/send_email')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({
        userId: USER_ALICE_ID,
        supplierId: 'sup_test_1',
        body: 'Demande de devis légitime'
      });

    // Le contrôle d'accès passe (pas de 403), la réponse échoue sur la configuration SMTP manquante (400)
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Messagerie non configurée');
  });

  it('autorise un Admin à envoyer un email au nom d\'un autre utilisateur (délégation / administration)', async () => {
    const res = await request(app)
      .post('/api/send_email')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        userId: USER_BOB_ID,
        supplierId: 'sup_test_1',
        body: 'Email envoyé par l\'administrateur'
      });

    // L'Admin n'est pas bloqué par le contrôle d'accès (pas de 403), la requête passe à la vérification SMTP
    expect(res.status).not.toBe(403);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Messagerie non configurée');
  });
});

describe('5. Confidentialité des Mots de Passe & Hashs Bcrypt', () => {
  it('GET /api/users ne doit JAMAIS exposer password_hash aux utilisateurs', async () => {
    const res = await request(app)
      .get('/api/users')
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    for (const u of res.body) {
      expect(u).not.toHaveProperty('password_hash');
      expect(u).not.toHaveProperty('passwordHash');
    }
  });

  it('POST /api/login ne doit pas inclure password_hash dans la réponse', async () => {
    const res = await request(app)
      .post('/api/login')
      .send({ email: 'alice.sec@puma.com', password: 'sec_pass_2026' })
      .expect(200);

    expect(res.body.user).not.toHaveProperty('password_hash');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });
});

describe('6. Persistance des Matrices Comparatives (/api/comparison_matrices)', () => {
  const testMatrixId = 'matrix_test_sec_001';

  afterAll(() => {
    db.prepare('DELETE FROM comparison_matrices WHERE id = ?').run(testMatrixId);
  });

  it('permet de créer et lire une matrice comparative sans perte', async () => {
    const matrixPayload = {
      id: testMatrixId,
      name: 'Matrice Test Audit',
      suppliers: ['Fournisseur A', 'Fournisseur B'],
      scores: { 'Fournisseur A': 85 }
    };

    const postRes = await request(app)
      .post('/api/comparison_matrices')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send(matrixPayload)
      .expect(201);

    expect(postRes.body.id).toBe(testMatrixId);

    const getRes = await request(app)
      .get(`/api/comparison_matrices/${testMatrixId}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .expect(200);

    expect(getRes.body.name).toBe('Matrice Test Audit');
  });
});

describe('7. Robustesse SQL : Rafraîchissement Campagnes IA', () => {
  const campId = 'camp_refresh_test_sql';

  beforeAll(() => {
    // Insérer une campagne et un supplier avec champ data
    db.prepare('INSERT OR IGNORE INTO procurement_campaigns (id, status, data) VALUES (?, ?, ?)')
      .run(campId, 'completed', JSON.stringify({ id: campId, title: 'Campagne Test Refresh' }));

    db.prepare('INSERT OR IGNORE INTO procurement_suppliers (id, name, campaign_id, data) VALUES (?, ?, ?, ?)')
      .run('supp_refresh_1', 'Supplier Old', campId, JSON.stringify({ id: 'supp_refresh_1', campaignId: campId, name: 'Supplier Old' }));
  });

  afterAll(() => {
    db.prepare('DELETE FROM procurement_campaigns WHERE id = ?').run(campId);
    db.prepare('DELETE FROM procurement_suppliers WHERE campaign_id = ?').run(campId);
  });

  it('POST /api/procurement_campaigns/:id/refresh supprime les anciens suppliers sans erreur SQL', async () => {
    const res = await request(app)
      .post(`/api/procurement_campaigns/${campId}/refresh`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('message');
    expect(res.body.message).toBe('Sourcing relancé');

    // Vérifier que le supplier a été nettoyé
    const remaining = db.prepare('SELECT count(*) as c FROM procurement_suppliers WHERE campaign_id = ?').get(campId) as any;
    expect(remaining.c).toBe(0);
  });
});

describe('8. Sécurisation RBAC des Paramètres Système (/api/settings)', () => {
  it('interdit (403) la modification des paramètres par un Collaborateur', async () => {
    const res = await request(app)
      .put('/api/settings/global_rules')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ id: 'global_rules', urgentModeSlaHours: 99 })
      .expect(403);

    expect(res.body.error).toBe('Accès refusé');
  });

  it('autorise la modification des paramètres par un Administrateur', async () => {
    const res = await request(app)
      .put('/api/settings/global_rules')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ id: 'global_rules', urgentModeSlaHours: 4 })
      .expect(200);

    expect(res.body.urgentModeSlaHours).toBe(4);
  });
});

