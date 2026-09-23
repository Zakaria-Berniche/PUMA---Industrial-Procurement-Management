import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

// En production Docker, DB_PATH pointe vers /app/database/puma_database.sqlite
// En développement local, fallback sur le fichier à la racine du projet
const dbPath = process.env.DB_PATH || path.resolve('puma_database.sqlite');
const db = new Database(dbPath);

// Activer les contraintes de clés étrangères et le mode de concurrence WAL
db.pragma('foreign_keys = ON;');
db.pragma('journal_mode = WAL;');
db.pragma('synchronous = NORMAL;');

// Initialization of DB Schema (Tables typées relationnelles)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL,
    department TEXT,
    site_id TEXT,
    created_at TEXT,
    data TEXT NOT NULL
  );
  
  CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    manager_id TEXT,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL,
    priority TEXT,
    site_id TEXT NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
    assignee_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    manager_id TEXT,
    department TEXT,
    type TEXT,
    health_status TEXT,
    risk_level TEXT,
    start_date TEXT,
    due_date TEXT,
    created_at TEXT,
    updated_at TEXT,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS workflow_templates (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS procurement_suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    campaign_id TEXT,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS procurement_campaigns (
    id TEXT PRIMARY KEY,
    status TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS global_suppliers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS task_configurations (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    userId TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS comparison_matrices (
    id TEXT PRIMARY KEY,
    data TEXT NOT NULL
  );
`);

// Routine de Migration Automatique
const migrateSchemaAndData = () => {
  db.pragma('foreign_keys = OFF;');

  // Ajouter colonnes si manquantes dans les bases existantes
  const userCols = (db.pragma('table_info(users)') as any[]).map(c => c.name);
  if (!userCols.includes('password_hash')) {
    try { db.exec('ALTER TABLE users ADD COLUMN password_hash TEXT;'); } catch (_) {}
  }
  if (!userCols.includes('site_id')) {
    try { db.exec('ALTER TABLE users ADD COLUMN site_id TEXT;'); } catch (_) {}
  }
  if (!userCols.includes('created_at')) {
    try { db.exec('ALTER TABLE users ADD COLUMN created_at TEXT;'); } catch (_) {}
  }

  const siteCols = (db.pragma('table_info(sites)') as any[]).map(c => c.name);
  if (!siteCols.includes('manager_id')) {
    try { db.exec('ALTER TABLE sites ADD COLUMN manager_id TEXT;'); } catch (_) {}
  }

  const taskCols = (db.pragma('table_info(tasks)') as any[]).map(c => c.name);
  if (!taskCols.includes('site_id')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN site_id TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('assignee_id')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN assignee_id TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('manager_id')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN manager_id TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('description')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN description TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('health_status')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN health_status TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('risk_level')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN risk_level TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('start_date')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN start_date TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('due_date')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN due_date TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('created_at')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN created_at TEXT;'); } catch (_) {}
  }
  if (!taskCols.includes('updated_at')) {
    try { db.exec('ALTER TABLE tasks ADD COLUMN updated_at TEXT;'); } catch (_) {}
  }

  const procCols = (db.pragma('table_info(procurement_suppliers)') as any[]).map(c => c.name);
  if (!procCols.includes('campaign_id')) {
    try { db.exec('ALTER TABLE procurement_suppliers ADD COLUMN campaign_id TEXT;'); } catch (_) {}
  }

  // Peupler les colonnes typées depuis data JSON si besoin
  try {
    const users = db.prepare('SELECT id, data FROM users').all() as any[];
    for (const u of users) {
      if (u.data) {
        const d = JSON.parse(u.data);
        db.prepare(`
          UPDATE users 
          SET name = COALESCE(NULLIF(name, ''), ?),
              email = COALESCE(NULLIF(email, ''), ?),
              role = COALESCE(NULLIF(role, ''), ?),
              department = COALESCE(NULLIF(department, ''), ?),
              site_id = COALESCE(NULLIF(site_id, ''), ?),
              password_hash = COALESCE(NULLIF(password_hash, ''), ?)
          WHERE id = ?
        `).run(d.name || '', d.email || '', d.role || '', d.department || '', d.siteId || d.site_id || '', d.password_hash || '', u.id);
      }
    }
  } catch (e) {
    console.error('Migration users error:', e);
  }

  try {
    const sites = db.prepare('SELECT id, data FROM sites').all() as any[];
    for (const s of sites) {
      if (s.data) {
        const d = JSON.parse(s.data);
        db.prepare(`
          UPDATE sites 
          SET name = COALESCE(NULLIF(name, ''), ?),
              type = COALESCE(NULLIF(type, ''), ?),
              manager_id = COALESCE(NULLIF(manager_id, ''), ?)
          WHERE id = ?
        `).run(d.name || '', d.type || '', d.managerId || d.manager_id || '', s.id);
      }
    }
  } catch (e) {
    console.error('Migration sites error:', e);
  }

  try {
    const tasks = db.prepare('SELECT id, data FROM tasks').all() as any[];
    for (const t of tasks) {
      if (t.data) {
        const d = JSON.parse(t.data);
        db.prepare(`
          UPDATE tasks 
          SET title = COALESCE(NULLIF(title, ''), ?),
              description = COALESCE(NULLIF(description, ''), ?),
              status = COALESCE(NULLIF(status, ''), ?),
              priority = COALESCE(NULLIF(priority, ''), ?),
              site_id = COALESCE(NULLIF(site_id, ''), ?),
              assignee_id = COALESCE(NULLIF(assignee_id, ''), ?),
              manager_id = COALESCE(NULLIF(manager_id, ''), ?),
              department = COALESCE(NULLIF(department, ''), ?),
              type = COALESCE(NULLIF(type, ''), ?),
              health_status = COALESCE(NULLIF(health_status, ''), ?),
              risk_level = COALESCE(NULLIF(risk_level, ''), ?),
              start_date = COALESCE(NULLIF(start_date, ''), ?),
              due_date = COALESCE(NULLIF(due_date, ''), ?),
              created_at = COALESCE(NULLIF(created_at, ''), ?),
              updated_at = COALESCE(NULLIF(updated_at, ''), ?)
          WHERE id = ?
        `).run(
          d.title || '',
          d.description || '',
          d.status || '',
          d.priority || '',
          d.siteId || d.site_id || '',
          d.assigneeId || d.assignee_id || '',
          d.managerId || d.manager_id || '',
          d.department || '',
          d.type || '',
          d.healthStatus || d.health_status || '',
          d.riskLevel || d.risk_level || '',
          d.startDate || d.start_date || '',
          d.dueDate || d.due_date || '',
          d.createdAt || d.created_at || '',
          d.updatedAt || d.updated_at || '',
          t.id
        );
      }
    }
  } catch (e) {
    console.error('Migration tasks error:', e);
  }

  db.pragma('foreign_keys = ON;');
};

migrateSchemaAndData();

// Index de performance sur les tables relationnelles typées
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_tasks_site_id        ON tasks(site_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status         ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_assignee_id    ON tasks(assignee_id);
  CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
  CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(userId);
  CREATE INDEX IF NOT EXISTS idx_proc_supp_campaign   ON procurement_suppliers(campaign_id);
`);

export default db;


// Seeding Defaults
const seedDefaults = () => {
  const configCount = db.prepare('SELECT count(*) as count FROM task_configurations').get().count;
  if (configCount === 0) {
    console.log('Seeding default task configurations...');
    const defaults = [
      { id: 'tc_1_1', category: 'ANALYSE BESOIN', title: 'Vérifier demande interne', type: 'Analyse', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_1_2', category: 'ANALYSE BESOIN', title: 'Identifier article / service demandé', type: 'Analyse', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_1_3', category: 'ANALYSE BESOIN', title: 'Contrôler spécifications techniques', type: 'Analyse', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_1_4', category: 'ANALYSE BESOIN', title: 'Vérifier quantité nécessaire', type: 'Analyse', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_1_5', category: 'ANALYSE BESOIN', title: 'Vérifier stock existant', type: 'Analyse', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_1_6', category: 'ANALYSE BESOIN', title: 'Analyser historique consommation', type: 'Analyse', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_1_7', category: 'ANALYSE BESOIN', title: 'Valider urgence de la demande', type: 'Analyse', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_1_8', category: 'ANALYSE BESOIN', title: 'Confirmer budget prévisionnel', type: 'Validation', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_1_9', category: 'ANALYSE BESOIN', title: 'Reformuler besoin si incomplet', type: 'Analyse', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_2_1', category: 'CONSULTATION FOURNISSEURS', title: 'Rechercher fournisseurs disponibles', type: 'Consultation', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_2_2', category: 'CONSULTATION FOURNISSEURS', title: 'Sélectionner fournisseurs qualifiés', type: 'Consultation', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_2_3', category: 'CONSULTATION FOURNISSEURS', title: 'Envoyer demande de devis', type: 'Consultation', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_2_4', category: 'CONSULTATION FOURNISSEURS', title: 'Relancer fournisseurs', type: 'Consultation', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_2_5', category: 'CONSULTATION FOURNISSEURS', title: 'Réceptionner devis', type: 'Consultation', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_2_6', category: 'CONSULTATION FOURNISSEURS', title: 'Vérifier conformité devis', type: 'Consultation', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_2_7', category: 'CONSULTATION FOURNISSEURS', title: 'Demander clarification technique', type: 'Consultation', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_2_8', category: 'CONSULTATION FOURNISSEURS', title: 'Mettre à jour base fournisseurs', type: 'Administratif', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_2_9', category: 'CONSULTATION FOURNISSEURS', title: 'Vérifier disponibilité produit', type: 'Consultation', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_3_1', category: 'ANALYSE & COMPARAISON', title: 'Comparer prix fournisseurs', type: 'Analyse', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_3_2', category: 'ANALYSE & COMPARAISON', title: 'Comparer délais de livraison', type: 'Analyse', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_3_3', category: 'ANALYSE & COMPARAISON', title: 'Comparer conditions de paiement', type: 'Analyse', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_3_4', category: 'ANALYSE & COMPARAISON', title: 'Analyser qualité produit', type: 'Analyse', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_3_5', category: 'ANALYSE & COMPARAISON', title: 'Évaluer fiabilité fournisseur', type: 'Analyse', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_3_6', category: 'ANALYSE & COMPARAISON', title: 'Calculer coût total (TCO)', type: 'Analyse', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_3_7', category: 'ANALYSE & COMPARAISON', title: 'Préparer tableau comparatif', type: 'Analyse', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_3_8', category: 'ANALYSE & COMPARAISON', title: 'Identifier meilleure offre', type: 'Analyse', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_3_9', category: 'ANALYSE & COMPARAISON', title: 'Rédiger rapport de comparaison', type: 'Analyse', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_4_1', category: 'NÉGOCIATION', title: 'Contacter fournisseur pour négociation', type: 'Négociation', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_4_2', category: 'NÉGOCIATION', title: 'Demander réduction prix', type: 'Négociation', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_4_3', category: 'NÉGOCIATION', title: 'Négocier délais livraison', type: 'Négociation', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_4_4', category: 'NÉGOCIATION', title: 'Négocier conditions paiement', type: 'Négociation', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_4_5', category: 'NÉGOCIATION', title: 'Valider remises obtenues', type: 'Négociation', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_4_6', category: 'NÉGOCIATION', title: 'Ajuster quantités si nécessaire', type: 'Négociation', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_4_7', category: 'NÉGOCIATION', title: 'Confirmer accord commercial', type: 'Négociation', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_4_8', category: 'NÉGOCIATION', title: 'Formaliser accord par écrit', type: 'Négociation', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_5_1', category: 'VALIDATION', title: 'Préparer dossier achat', type: 'Administratif', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_5_2', category: 'VALIDATION', title: 'Vérifier conformité budget', type: 'Validation', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_5_3', category: 'VALIDATION', title: 'Envoyer demande validation manager', type: 'Validation', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_5_4', category: 'VALIDATION', title: 'Envoyer demande validation direction', type: 'Validation', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_5_5', category: 'VALIDATION', title: 'Attendre approbation', type: 'Validation', defaultSlaHours: 72, defaultMicroSteps: [] },
      { id: 'tc_5_6', category: 'VALIDATION', title: 'Gérer refus ou modification', type: 'Analyse', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_5_7', category: 'VALIDATION', title: 'Mettre à jour statut validation', type: 'Administratif', defaultSlaHours: 2, defaultMicroSteps: [] },
      { id: 'tc_5_8', category: 'VALIDATION', title: 'Archiver validation', type: 'Administratif', defaultSlaHours: 2, defaultMicroSteps: [] },
      { id: 'tc_6_1', category: 'COMMANDE', title: 'Créer bon de commande', type: 'Administratif', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_6_2', category: 'COMMANDE', title: 'Vérifier données commande', type: 'Administratif', defaultSlaHours: 2, defaultMicroSteps: [] },
      { id: 'tc_6_3', category: 'COMMANDE', title: 'Envoyer bon de commande fournisseur', type: 'Administratif', defaultSlaHours: 2, defaultMicroSteps: [] },
      { id: 'tc_6_4', category: 'COMMANDE', title: 'Confirmer réception commande fournisseur', type: 'Administratif', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_6_5', category: 'COMMANDE', title: 'Mettre à jour système ERP', type: 'Administratif', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_6_6', category: 'COMMANDE', title: 'Vérifier délai confirmé', type: 'Administratif', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_6_7', category: 'COMMANDE', title: 'Planifier livraison', type: 'Logistique', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_7_1', category: 'SUIVI LIVRAISON', title: 'Suivre statut livraison', type: 'Logistique', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_7_2', category: 'SUIVI LIVRAISON', title: 'Relancer fournisseur livraison', type: 'Logistique', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_7_3', category: 'SUIVI LIVRAISON', title: 'Vérifier transport', type: 'Logistique', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_7_4', category: 'SUIVI LIVRAISON', title: 'Confirmer date livraison', type: 'Logistique', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_7_5', category: 'SUIVI LIVRAISON', title: 'Gérer retard livraison', type: 'Logistique', defaultSlaHours: 24, defaultMicroSteps: [] },
      { id: 'tc_7_6', category: 'SUIVI LIVRAISON', title: 'Informer responsable', type: 'Administratif', defaultSlaHours: 2, defaultMicroSteps: [] },
      { id: 'tc_7_7', category: 'SUIVI LIVRAISON', title: 'Mettre à jour planning', type: 'Administratif', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_8_1', category: 'RÉCEPTION', title: 'Vérifier livraison reçue', type: 'Contrôle', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_8_2', category: 'RÉCEPTION', title: 'Contrôler quantité livrée', type: 'Contrôle', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_8_3', category: 'RÉCEPTION', title: 'Contrôler qualité produit', type: 'Contrôle', defaultSlaHours: 12, defaultMicroSteps: [] },
      { id: 'tc_8_4', category: 'RÉCEPTION', title: 'Comparer avec bon de commande', type: 'Contrôle', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_8_5', category: 'RÉCEPTION', title: 'Signaler non-conformité', type: 'Contrôle', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_8_6', category: 'RÉCEPTION', title: 'Valider réception', type: 'Contrôle', defaultSlaHours: 2, defaultMicroSteps: [] },
      { id: 'tc_8_7', category: 'RÉCEPTION', title: 'Refuser livraison si problème', type: 'Contrôle', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_9_1', category: 'CLÔTURE', title: 'Valider dossier complet', type: 'Administratif', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_9_2', category: 'CLÔTURE', title: 'Archiver documents', type: 'Administratif', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_9_3', category: 'CLÔTURE', title: 'Clôturer objectif', type: 'Administratif', defaultSlaHours: 2, defaultMicroSteps: [] },
      { id: 'tc_9_4', category: 'CLÔTURE', title: 'Mettre à jour historique fournisseur', type: 'Administratif', defaultSlaHours: 4, defaultMicroSteps: [] },
      { id: 'tc_9_5', category: 'CLÔTURE', title: 'Calculer coût final', type: 'Analyse', defaultSlaHours: 8, defaultMicroSteps: [] },
      { id: 'tc_9_6', category: 'CLÔTURE', title: 'Générer rapport final achat', type: 'Analyse', defaultSlaHours: 12, defaultMicroSteps: [] },
    ];

    const insert = db.prepare('INSERT INTO task_configurations (id, data) VALUES (?, ?)');
    defaults.forEach(config => {
      insert.run(config.id, JSON.stringify(config));
    });
  }

  const templateCount = db.prepare('SELECT count(*) as count FROM workflow_templates').get().count;
  if (templateCount === 0) {
    console.log('Seeding default workflow templates...');
    const templates = [
      {
        id: 'wt_standard',
        name: 'Achat Standard',
        description: 'Processus de base pour les achats courants.',
        type: 'Achat Standard',
        complexity: 'Simple',
        estimatedTotalSlaHours: 350,
        steps: [
          { id: 'wt_std_1', title: 'Analyse du besoin', type: 'Analyse', isValidationRequired: false, slaHours: 24, order: 0 },
          { id: 'wt_std_2', title: 'Consultation fournisseurs', type: 'Consultation', isValidationRequired: false, slaHours: 48, order: 1 },
          { id: 'wt_std_3', title: 'Négociation & Choix', type: 'Négociation', isValidationRequired: true, slaHours: 24, order: 2 },
          { id: 'wt_std_4', title: 'Validation Administrative', type: 'Validation', isValidationRequired: true, slaHours: 12, order: 3 },
          { id: 'wt_std_5', title: 'Commande & Réception', type: 'Logistique', isValidationRequired: false, slaHours: 72, order: 4 }
        ]
      },
      {
        id: 'wt_urgent',
        name: 'Achat Urgent',
        description: 'Besoin critique production / arrêt machine.',
        type: 'Achat Urgent',
        complexity: 'Simple',
        estimatedTotalSlaHours: 72,
        steps: [
          { id: 'wt_urg_1', title: 'Validation Urgence', type: 'Validation', isValidationRequired: true, slaHours: 2, order: 0 },
          { id: 'wt_urg_2', title: 'Consultation Express', type: 'Consultation', isValidationRequired: false, slaHours: 4, order: 1 },
          { id: 'wt_urg_3', title: 'Commande Immédiate', type: 'Administratif', isValidationRequired: false, slaHours: 2, order: 2 },
          { id: 'wt_urg_4', title: 'Suivi & Livraison', type: 'Logistique', isValidationRequired: false, slaHours: 24, order: 3 }
        ]
      },
      {
        id: 'wt_maintenance',
        name: 'Workflow Maintenance',
        description: 'Pièces machines / réparation / atelier.',
        type: 'Achat Maintenance',
        complexity: 'Moyen',
        estimatedTotalSlaHours: 200,
        steps: [
          { id: 'wt_maint_1', title: 'Analyse Panne / Pièce', type: 'Analyse', isValidationRequired: false, slaHours: 8, order: 0 },
          { id: 'wt_maint_2', title: 'Validation Technique', type: 'Validation', isValidationRequired: true, slaHours: 4, order: 1 },
          { id: 'wt_maint_3', title: 'Commande Pièce', type: 'Administratif', isValidationRequired: false, slaHours: 12, order: 2 },
          { id: 'wt_maint_4', title: 'Réparation / Installation', type: 'Contrôle', isValidationRequired: true, slaHours: 24, order: 3 }
        ]
      },
      {
        id: 'wt_it',
        name: 'Workflow Achat IT',
        description: 'PC, serveurs, équipements réseau.',
        type: 'Achat Projet',
        complexity: 'Moyen',
        estimatedTotalSlaHours: 250,
        steps: [
          { id: 'wt_it_1', title: 'Spécifications IT', type: 'Analyse', isValidationRequired: false, slaHours: 24, order: 0 },
          { id: 'wt_it_2', title: 'Validation DSI', type: 'Validation', isValidationRequired: true, slaHours: 24, order: 1 },
          { id: 'wt_it_3', title: 'Configuration & Inventaire', type: 'Contrôle', isValidationRequired: false, slaHours: 48, order: 2 }
        ]
      },
      {
        id: 'wt_capex',
        name: 'Workflow CAPEX',
        description: 'Investissements lourds et projets stratégiques.',
        type: 'Achat Stratégique',
        complexity: 'Complexe',
        estimatedTotalSlaHours: 1200,
        steps: [
          { id: 'wt_capex_1', title: 'Cahier des charges', type: 'Analyse', isValidationRequired: true, slaHours: 120, order: 0 },
          { id: 'wt_capex_2', title: 'Appel d\'offres', type: 'Consultation', isValidationRequired: false, slaHours: 240, order: 1 },
          { id: 'wt_capex_3', title: 'Validation Direction', type: 'Validation', isValidationRequired: true, slaHours: 72, order: 2 },
          { id: 'wt_capex_4', title: 'Signature Contrat', type: 'Administratif', isValidationRequired: true, slaHours: 120, order: 3 }
        ]
      },
      {
        id: 'wt_import',
        name: 'Import / Logistique',
        description: 'Achats internationaux et transit.',
        type: 'Achat Stratégique',
        complexity: 'Complexe',
        estimatedTotalSlaHours: 1500,
        steps: [
          { id: 'wt_imp_1', title: 'Sourcing International', type: 'Consultation', isValidationRequired: false, slaHours: 120, order: 0 },
          { id: 'wt_imp_2', title: 'Douane & Documents', type: 'Logistique', isValidationRequired: true, slaHours: 120, order: 1 },
          { id: 'wt_imp_3', title: 'Transit & Réception', type: 'Logistique', isValidationRequired: false, slaHours: 168, order: 2 }
        ]
      }
    ];

    const insertTemplate = db.prepare('INSERT INTO workflow_templates (id, data) VALUES (?, ?)');
    templates.forEach(t => {
      insertTemplate.run(t.id, JSON.stringify(t));
    });
  }

  const settingsCount = db.prepare('SELECT count(*) as count FROM settings').get().count;
  if (settingsCount === 0) {
    db.prepare('INSERT INTO settings (id, data) VALUES (?, ?)').run('company_info', JSON.stringify({
      name: 'PUMA',
      sector: 'Plateforme de gestion des tâches et tickets pour les services Achat et COMEX.',
      logo: '/logo.png'
    }));

    db.prepare('INSERT INTO settings (id, data) VALUES (?, ?)').run('global_rules', JSON.stringify({
      id: 'global_rules',
      validationThresholdDZD: 500000,
      slaMatrix: {
        Analyse: 24,
        Consultation: 48,
        Validation: 24,
        Négociation: 24,
        Administratif: 24,
        Logistique: 168,
        Contrôle: 24,
        Autre: 24
      },
      urgentModeSlaHours: 4
    }));

    db.prepare('INSERT INTO settings (id, data) VALUES (?, ?)').run('ai_config', JSON.stringify({
      id: 'ai_config',
      model: 'gemini-2.5-flash',
      temperature: 0.1, 
      sourcingPromptTemplate: `Tu es un agent IA expert en "Procurement & Sourcing B2B" de niveau Senior.
Ta mission est de réaliser un sourcing de haute précision pour la demande suivante :
- Catégorie : {{category}}
- Marque : {{brand}}
- Specs : {{specs}}
- Quantité : {{quantity}}
- Marché : {{market}}

### STRATÉGIE ET ATTENDUS :
1. ANALYSE ET ADAPTATION : Tu dois constamment améliorer la qualité de tes recherches. Analyse le niveau de technicité requis et adapte la précision de tes insights.
2. SOURCING RÉEL : Identifie des entreprises existantes, leaders ou spécialistes. Évalue leur fiabilité (0-100) selon des critères industriels.
3. PRÉCISION LOCALE : Pour le marché Algérien, identifie la Wilaya exacte et fournis des coordonnées simulées mais réalistes.
4. TON ET PRÉSENTATION : Adopte un ton professionnel, structuré et stratégique. Tes insights doivent expliquer la valeur ajoutée du fournisseur (ex: SAV local, stock disponible, exclusivité marque).
5. CANAUX DE CONTACT (NORME ALGÉRIE) : Les coordonnées générées doivent être ultra-réalistes. Les téléphones doivent suivre le format strict '+213 (0) XX XX XX XX' (avec l'indicatif régional fixe réel ou mobile pro). Les emails et sites web doivent utiliser des noms de domaines réalistes ou se terminant par '.dz' ou '-dz.com'. La localisation physique doit mentionner le siège ou le dépôt dans une zone industrielle algérienne réelle (ex: Zone Industrielle de Rouiba, Z.I. Hassi Ameur, Zone des Partenaires Hassi Messaoud).

RETOURNE UNIQUEMENT UN TABLEAU JSON VALIDE (format strict) :
[
  {
    "name": "Nom",
    "reliabilityScore": 85,
    "contactStatus": "pending",
    "quoteAmount": 0,
    "insight": "Analyse stratégique courte",
    "emailDraft": "Email pro complet",
    "phone": "+213...",
    "website": "URL",
    "wilaya": "Wilaya",
    "location": { "lat": 0, "lng": 0 },
    "strengths": [],
    "weaknesses": []
  }
]`,
      refreshPromptTemplate: `Fais une recherche web sur l'entreprise "{{name}}" et retourne ses informations de contact à jour au format JSON :
{
  "phone": "numéro de téléphone",
  "website": "url du site",
  "email": "email de contact",
  "description": "brève description",
  "reliabilityScore": 0-100,
  "wilaya": "Wilaya",
  "location": { "lat": 0, "lng": 0 }
}
RETOURNE UNIQUEMENT LE JSON.`
    }));

    db.prepare('INSERT INTO settings (id, data) VALUES (?, ?)').run('report_config', JSON.stringify({
      id: 'report_config',
      primaryColor: '#E10600', 
      secondaryColor: '#000000',
      fontFamily: 'helvetica',
      showHeader: true,
      showFooter: true,
      footerText: 'PUMA - Plateforme de Pilotage Industriel - Document Confidentiel'
    }));
  }

  // Amorçage des utilisateurs et sites si la table users est vide (ex: déploiement neuf Docker)
  const userCount = (db.prepare('SELECT count(*) as count FROM users').get() as any).count;
  if (userCount === 0) {
    console.log('Seeding initial admin user and industrial sites...');
    const adminId = 'user_admin_001';
    const defaultPassword = process.env.INITIAL_ADMIN_PASSWORD || 'PumaAdmin2026!';
    const adminHash = bcrypt.hashSync(defaultPassword, 10);
    const adminUser = {
      id: adminId,
      name: 'Zakaria BERNICHE',
      email: 'zakaria.b@puma.com',
      role: 'Admin',
      department: 'IT',
      position: 'Responsable Systèmes',
      password_hash: adminHash
    };

    db.prepare(`
      INSERT INTO users (id, name, email, role, department, password_hash, data)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(adminUser.id, adminUser.name, adminUser.email, adminUser.role, adminUser.department, adminHash, JSON.stringify(adminUser));

    const defaultSites = [
      { id: 'site_sba', name: 'Usine Grupopuma Sidi Bel Abbes', type: 'Usine', managerId: adminId, location: { lat: 35.19, lng: -0.63 } },
      { id: 'site_cst', name: 'Usine Grupopuma Constantine', type: 'Usine', managerId: adminId, location: { lat: 36.36, lng: 6.61 } },
      { id: 'site_bouira', name: 'Usine Grupopuma Bouira', type: 'Usine', managerId: adminId, location: { lat: 36.37, lng: 3.90 } },
      { id: 'site_carriere', name: 'Carrière Grupopuma Constantine', type: 'Carrière', managerId: adminId, location: { lat: 36.40, lng: 6.55 } },
      { id: 'site_alger', name: 'Showroom Grupopuma Alger', type: 'Showroom', managerId: adminId, location: { lat: 36.75, lng: 3.05 } }
    ];

    const insertSite = db.prepare(`INSERT INTO sites (id, name, type, manager_id, data) VALUES (?, ?, ?, ?, ?)`);
    for (const site of defaultSites) {
      insertSite.run(site.id, site.name, site.type, site.managerId, JSON.stringify(site));
    }
  }
};

seedDefaults();
