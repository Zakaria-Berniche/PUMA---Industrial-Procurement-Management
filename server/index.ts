import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db.js';
import { runProcurementCampaign, refreshSupplierInfo, refreshAllSuppliers } from './aiService.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import nodemailer from 'nodemailer';

// ES Module fix for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load variables
dotenv.config({ path: '.env.local' });

const app = express();
const PORT = process.env.PORT || 3001;

// En-têtes de sécurité HTTP Helmet (adapté au SPA Vite, Leaflet OpenStreetMap et streaming SSE)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "blob:", "https://*.tile.openstreetmap.org", "https://*.openstreetmap.org"],
        connectSrc: ["'self'", "https://generativelanguage.googleapis.com"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(express.json());

// --- REAL-TIME SSE (Server-Sent Events) ---
interface SSEClient {
  userId: string;
  res: Response;
}
const sseClients = new Set<SSEClient>();

const broadcastEvent = (event: string, data: any, targetUserId?: string) => {
  const payload = JSON.stringify({ event, data });
  for (const client of sseClients) {
    if (!targetUserId || client.userId === targetUserId) {
      try {
        client.res.write(`data: ${payload}\n\n`);
      } catch {
        sseClients.delete(client);
      }
    }
  }
};

// SSE Heartbeat périodique (empêche les coupures de socket par Nginx / proxies après 60s)
if (process.env.NODE_ENV !== 'test') {
  setInterval(() => {
    for (const client of sseClients) {
      try {
        client.res.write(': ping\n\n');
      } catch {
        sseClients.delete(client);
      }
    }
  }, 25000);
}

// Exiger obligatoirement JWT_SECRET au démarrage
if (!process.env.JWT_SECRET) {
  throw new Error("ERREUR CRITIQUE DE SÉCURITÉ: La variable d'environnement JWT_SECRET est obligatoire pour démarrer le serveur.");
}
const JWT_SECRET: string = process.env.JWT_SECRET;

// Migration/Initialisation automatique du hachage des mots de passe pour les utilisateurs existants
// --- RATE LIMITING ---
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.' }
});

export const procurementCampaignLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes de sourcing IA. Veuillez patienter.' }
});

export const emailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 100 : 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Limite d'envoi d'emails atteinte. Veuillez réessayer plus tard." }
});

// Basic health route
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'Puma Server Running', 
    database: db.open ? 'Connected' : 'Disconnected' 
  });
});

// Login route avec vérification bcrypt.compare
app.post('/api/login', loginLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    
    // Check if user exists
    const users = db.prepare(`SELECT * FROM users`).all() as any[];
    const userRow = users.find(u => {
      let data: any = {};
      try { data = JSON.parse(u.data); } catch { /* ignore */ }
      return u.email === email || data.email === email;
    });

    if (userRow) {
      let user: any = {};
      try { user = JSON.parse(userRow.data); } catch { /* ignore */ }
      const passwordHash = userRow.password_hash || user.password_hash;
      if (!passwordHash) {
        return res.status(401).json({ error: 'Compte non configuré ou mot de passe absent' });
      }
      const isMatch = await bcrypt.compare(password, passwordHash);

      if (isMatch) {
        const token = jwt.sign({ id: userRow.id, email: userRow.email || user.email, role: userRow.role || user.role }, JWT_SECRET, { expiresIn: '24h' });
        const cleanUser = formatRowResponse('users', userRow);
        res.json({ token, user: cleanUser });
        return;
      }
    }
    
    res.status(401).json({ error: 'Identifiants invalides' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Authentication Middleware
const authMiddleware = (req: any, res: Response, next: NextFunction) => {
  // Allow login and health endpoints
  if (req.path === '/api/login' || req.path === '/api/health') {
    return next();
  }

  // Check token for all other /api routes
  if (req.path.startsWith('/api/')) {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.path === '/api/stream' && req.query.token) {
      token = req.query.token as string;
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Token manquant ou invalide' });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (error) {
      return res.status(401).json({ error: 'Token expiré ou invalide' });
    }
  }
  
  next();
};

app.use(authMiddleware);

// Route /api/me : Valide le token et retourne l'utilisateur courant sans secrets
app.get('/api/me', (req: any, res: Response) => {
  try {
    const userRow = db.prepare(`SELECT * FROM users WHERE id = ?`).get(req.user?.id);
    if (!userRow) return res.status(404).json({ error: 'Utilisateur introuvable' });
    res.json(formatRowResponse('users', userRow, req.user));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// SSE Connection Endpoint
app.get('/api/stream', (req: any, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const client: SSEClient = {
    userId: req.user.id,
    res
  };
  sseClients.add(client);

  res.on('close', () => {
    sseClients.delete(client);
  });
});


// A2 — Zod Schemas (renforcés avec types stricts)
const VALID_ROLES = ['Admin', 'Responsable Global', 'Responsable Local', 'Collaborateur'] as const;
const VALID_STATUSES = ['Nouveau', 'En cours', 'En validation', 'Bloqué', 'En retard', 'Terminé', 'Annulé'] as const;
const VALID_PRIORITIES = ['Faible', 'Normale', 'Haute', 'Urgent'] as const;
const VALID_TYPES = ['Achat Standard', 'Achat Urgent', 'Achat Stratégique', 'Achat Maintenance', 'Achat Projet', 'Consultation Fournisseur', 'Audit Sécurité', 'Maintenance Préventive'] as const;

const schemas = {
  users: z.object({
    id: z.string().min(1),
    email: z.string().email({ message: 'Email invalide' }),
    name: z.string().min(1, { message: 'Nom requis' }),
    role: z.enum(VALID_ROLES, { message: 'Rôle invalide' })
  }).passthrough(),
  sites: z.object({ id: z.string().min(1) }).passthrough(),
  tasks: z.object({
    id: z.string().min(1),
    siteId: z.string().min(1, { message: 'Site requis' }),
    assigneeId: z.string().min(1, { message: 'Assigné requis' }),
    status: z.enum(VALID_STATUSES, { message: 'Statut invalide' }),
    priority: z.enum(VALID_PRIORITIES, { message: 'Priorité invalide' }).optional(),
    type: z.enum(VALID_TYPES, { message: 'Type invalide' }).optional()
  }).passthrough(),
  workflow_templates: z.object({ id: z.string().min(1) }).passthrough(),
  procurement_suppliers: z.object({ id: z.string().min(1), name: z.string().min(1) }).passthrough(),
  global_suppliers: z.object({ id: z.string().min(1), name: z.string().min(1) }).passthrough(),
  task_configurations: z.object({ id: z.string().min(1) }).passthrough(),
  notifications: z.object({ id: z.string().min(1), userId: z.string().min(1) }).passthrough(),
  settings: z.object({ id: z.string().min(1) }).passthrough(),
  procurement_campaigns: z.object({ id: z.string().min(1), status: z.string().optional() }).passthrough(),
  comparison_matrices: z.object({ id: z.string().min(1) }).passthrough()
};

// Middleware RBAC (Contrôle d'Accès Basé sur les Rôles)
const requireRole = (...allowedRoles: string[]) => {
  return (req: any, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (!userRole) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    const normUser = userRole.toLowerCase().trim();
    const isAllowed = allowedRoles.some(allowed => {
      const normAllowed = allowed.toLowerCase().trim();
      if (normAllowed === normUser) return true;
      if (normAllowed === 'admin' && normUser === 'admin') return true;
      if (normAllowed === 'manager' && ['admin', 'responsable global', 'responsable local', 'manager'].includes(normUser)) return true;
      return false;
    });

    if (!isAllowed) {
      return res.status(403).json({ error: 'Accès refusé' });
    }

    next();
  };
};

const getSqlColumnValue = (col: string, data: any) => {
  if (data[col] !== undefined && data[col] !== null) return data[col];
  if (col === 'site_id') return data.siteId || data.site_id || '';
  if (col === 'assignee_id') return data.assigneeId || data.assignee_id || '';
  if (col === 'manager_id') return data.managerId || data.manager_id || '';
  if (col === 'health_status') return data.healthStatus || data.health_status || '';
  if (col === 'risk_level') return data.riskLevel || data.risk_level || '';
  if (col === 'start_date') return data.startDate || data.start_date || '';
  if (col === 'due_date') return data.dueDate || data.due_date || '';
  if (col === 'created_at') return data.createdAt || data.created_at || '';
  if (col === 'updated_at') return data.updatedAt || data.updated_at || '';
  if (col === 'password_hash') return data.password_hash || data.passwordHash || '';
  if (col === 'campaign_id') return data.campaignId || data.campaign_id || '';
  return '';
};

const formatRowResponse = (tableName: string, row: any, reqUser?: any) => {
  if (!row) return null;
  let parsed: any = {};
  if (row.data) {
    try { parsed = JSON.parse(row.data); } catch { /* ignore */ }
  }

  if (tableName === 'users') {
    const cleanUser = { ...parsed };
    delete cleanUser.password_hash;
    delete cleanUser.passwordHash;
    
    if (cleanUser.smtpSettings) {
      const isSelf = reqUser && reqUser.id === row.id;
      const isAdmin = reqUser && reqUser.role === 'Admin';
      if (!isSelf && !isAdmin) {
        delete cleanUser.smtpSettings.pass;
      }
    }

    return {
      ...cleanUser,
      id: row.id,
      name: row.name || cleanUser.name,
      email: row.email || cleanUser.email,
      role: row.role || cleanUser.role,
      department: row.department || cleanUser.department,
      siteId: row.site_id || cleanUser.siteId || row.siteId
    };
  }

  if (tableName === 'sites') {
    return {
      ...parsed,
      id: row.id,
      name: row.name || parsed.name,
      type: row.type || parsed.type,
      managerId: row.manager_id || parsed.managerId || row.managerId
    };
  }

  if (tableName === 'tasks') {
    return {
      ...parsed,
      id: row.id,
      title: row.title || parsed.title,
      description: row.description || parsed.description,
      status: row.status || parsed.status,
      priority: row.priority || parsed.priority,
      siteId: row.site_id || parsed.siteId || row.siteId,
      assigneeId: row.assignee_id || parsed.assigneeId || row.assigneeId,
      managerId: row.manager_id || parsed.managerId || row.managerId,
      department: row.department || parsed.department,
      type: row.type || parsed.type,
      healthStatus: row.health_status || parsed.healthStatus || row.healthStatus,
      riskLevel: row.risk_level || parsed.riskLevel || row.riskLevel,
      startDate: row.start_date || parsed.startDate || row.startDate,
      dueDate: row.due_date || parsed.dueDate || row.dueDate,
      createdAt: row.created_at || parsed.createdAt || row.createdAt,
      updatedAt: row.updated_at || parsed.updatedAt || row.updatedAt
    };
  }

  return Object.keys(parsed).length > 0 ? parsed : row;
};

// Generic CRUD factory
const setupCrudRoutes = (tableName: string, extraCols: string[] = [], writeRoles?: string[]) => {
  // GET all (with optional pagination: ?page=1&limit=50)
  app.get(`/api/${tableName}`, (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const { page, limit } = req.query;
      
      // Cloisonnement des notifications par utilisateur connecté
      if (tableName === 'notifications') {
        let rows: any[];
        if (currentUser && currentUser.role === 'Admin') {
          rows = db.prepare('SELECT * FROM notifications').all();
        } else {
          rows = db.prepare('SELECT * FROM notifications WHERE userId = ? OR json_extract(data, "$.userId") = ?').all(currentUser?.id || '', currentUser?.id || '');
        }
        return res.json(rows.map(r => formatRowResponse(tableName, r, currentUser)));
      }

      if (page !== undefined && limit !== undefined) {
        const pageNum = Math.max(1, parseInt(page as string, 10) || 1);
        const limitNum = Math.min(200, Math.max(1, parseInt(limit as string, 10) || 50));
        const offset = (pageNum - 1) * limitNum;
        const rows = db.prepare(`SELECT * FROM ${tableName} LIMIT ? OFFSET ?`).all(limitNum, offset);
        const total = (db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).get() as any).count;
        res.json({
          data: rows.map(r => formatRowResponse(tableName, r, currentUser)),
          pagination: { page: pageNum, limit: limitNum, total, totalPages: Math.ceil(total / limitNum) }
        });
      } else {
        const rows = db.prepare(`SELECT * FROM ${tableName}`).all();
        res.json(rows.map(r => formatRowResponse(tableName, r, currentUser)));
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET one
  app.get(`/api/${tableName}/:id`, (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      const row = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
      if (!row) return res.status(404).json({ error: 'Not found' });
      res.json(formatRowResponse(tableName, row, currentUser));
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST
  const postMiddlewares = writeRoles ? [requireRole(...writeRoles)] : [];
  app.post(`/api/${tableName}`, ...postMiddlewares, (req: Request, res: Response) => {
    try {
      const schema = schemas[tableName as keyof typeof schemas];
      let data = req.body;
      if (schema) {
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: 'Erreur de validation', details: validation.error.format() });
        }
        data = validation.data;
      }
      if (!data.id) return res.status(400).json({ error: 'id is required' });
      
      // Hachage du mot de passe s'il s'agit d'une création d'utilisateur
      if (tableName === 'users' && data.password) {
        data.password_hash = bcrypt.hashSync(data.password, 10);
        delete data.password;
      }
      
      const cleanDataToStore = { ...data };
      delete cleanDataToStore.password_hash;
      delete cleanDataToStore.passwordHash;

      const cols = ['id', ...extraCols, 'data'];
      const vals = [data.id];
      extraCols.forEach(col => vals.push(getSqlColumnValue(col, data)));
      vals.push(JSON.stringify(cleanDataToStore));
      
      const placeholders = cols.map(() => '?').join(', ');
      
      db.prepare(`INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`).run(...vals);
      
      const responsePayload = formatRowResponse(tableName, data, (req as any).user);
      broadcastEvent(`${tableName.toUpperCase()}_CREATED`, responsePayload);
      
      res.status(201).json(responsePayload);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT (avec support d'auto-édition profil et d'Upsert)
  app.put(`/api/${tableName}/:id`, (req: Request, res: Response, next: NextFunction) => {
    if (tableName === 'users' && (req as any).user?.id === req.params.id) {
      return next();
    }
    if (writeRoles) {
      return requireRole(...writeRoles)(req, res, next);
    }
    next();
  }, (req: Request, res: Response) => {
    try {
      const schema = schemas[tableName as keyof typeof schemas];
      let data = req.body;
      if (schema) {
        const validation = schema.safeParse(req.body);
        if (!validation.success) {
          return res.status(400).json({ error: 'Erreur de validation', details: validation.error.format() });
        }
        data = validation.data;
      }
      data.id = req.params.id;
      
      const cleanDataToStore = { ...data };
      delete cleanDataToStore.password_hash;
      delete cleanDataToStore.passwordHash;

      const setClauses = extraCols.map(col => `${col} = ?`);
      setClauses.push('data = ?');
      
      const vals = [];
      extraCols.forEach(col => vals.push(getSqlColumnValue(col, data)));
      vals.push(JSON.stringify(cleanDataToStore));
      vals.push(req.params.id);
      
      const oldRow = db.prepare(`SELECT * FROM ${tableName} WHERE id = ?`).get(req.params.id);
      const oldData = oldRow ? formatRowResponse(tableName, oldRow) : null;
      
      const result = db.prepare(`UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = ?`).run(...vals);
      
      // Support d'Upsert si la ligne n'existait pas encore (ex: settings non initialisés)
      if (result.changes === 0) {
        const cols = ['id', ...extraCols, 'data'];
        const insertVals = [req.params.id];
        extraCols.forEach(col => insertVals.push(getSqlColumnValue(col, data)));
        insertVals.push(JSON.stringify(cleanDataToStore));
        const placeholders = cols.map(() => '?').join(', ');
        db.prepare(`INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders})`).run(...insertVals);
      }
      
      const responsePayload = formatRowResponse(tableName, data, (req as any).user);
      broadcastEvent(`${tableName.toUpperCase()}_UPDATED`, responsePayload);
      
      if (tableName === 'tasks' && oldData && oldData.status !== 'Terminé' && data.status === 'Terminé') {
        const usersRows = db.prepare(`SELECT * FROM users`).all();
        const users = usersRows.map(r => formatRowResponse('users', r));
        const assignee = users.find((u: any) => u.id === data.assigneeId);
        
        const notifId = `n${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const notification = {
          id: notifId,
          userId: data.managerId,
          type: 'TASK_COMPLETED',
          title: 'Objectif Atteint ! ✅',
          message: `${assignee?.name || 'Un collaborateur'} a terminé la tâche : "${data.title}"`,
          relatedTaskId: data.id,
          createdAt: new Date().toISOString(),
          isRead: false
        };
        
        db.prepare(`INSERT INTO notifications (id, userId, data) VALUES (?, ?, ?)`).run(notifId, data.managerId, JSON.stringify(notification));
        broadcastEvent(`NOTIFICATIONS_CREATED`, notification, data.managerId);
      }
      
      res.json(responsePayload);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE
  const deleteMiddlewares = writeRoles ? [requireRole(...writeRoles)] : [];
  app.delete(`/api/${tableName}/:id`, ...deleteMiddlewares, (req: Request, res: Response) => {
    try {
      const currentUser = (req as any).user;
      if (tableName === 'notifications') {
        const notif = db.prepare('SELECT * FROM notifications WHERE id = ?').get(req.params.id) as any;
        if (!notif) return res.status(404).json({ error: 'Notification introuvable' });
        let parsed: any = {};
        try { parsed = JSON.parse(notif.data); } catch { /* ignore */ }
        const ownerId = notif.userId || parsed.userId;
        if (currentUser.role !== 'Admin' && ownerId !== currentUser.id) {
          return res.status(403).json({ error: 'Accès refusé' });
        }
      }

      const result = db.prepare(`DELETE FROM ${tableName} WHERE id = ?`).run(req.params.id);
      if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
      
      broadcastEvent(`${tableName.toUpperCase()}_DELETED`, { id: req.params.id });
      
      res.status(204).end();
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
};

// Bootstrap standard CRUD routes
setupCrudRoutes('users', ['name', 'email', 'role', 'department', 'site_id', 'password_hash'], ['admin']);
setupCrudRoutes('sites', ['name', 'type', 'manager_id'], ['admin', 'manager']);
setupCrudRoutes('tasks', [
  'title', 'description', 'status', 'priority', 'site_id', 'assignee_id', 
  'manager_id', 'department', 'type', 'health_status', 'risk_level', 
  'start_date', 'due_date', 'created_at', 'updated_at'
], ['admin', 'manager']);
setupCrudRoutes('workflow_templates', [], ['admin']);
setupCrudRoutes('procurement_suppliers', ['name', 'campaign_id'], ['admin', 'manager', 'collaborateur']);
setupCrudRoutes('global_suppliers', ['name'], ['admin', 'manager']);
setupCrudRoutes('task_configurations', [], ['admin']);
setupCrudRoutes('notifications', ['userId']);
setupCrudRoutes('settings', [], ['admin']);
setupCrudRoutes('comparison_matrices', [], ['admin', 'manager', 'collaborateur']);

// Custom POST for procurement_campaigns to trigger AI
app.post('/api/procurement_campaigns', procurementCampaignLimiter, (req: Request, res: Response) => {
  try {
    const schema = schemas['procurement_campaigns'];
    let data = req.body;
    if (schema) {
      const validation = schema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ error: 'Erreur de validation', details: validation.error.format() });
      }
      data = validation.data;
    }
    if (!data.id) return res.status(400).json({ error: 'id is required' });
    
    // Save campaign first
    db.prepare(`INSERT INTO procurement_campaigns (id, status, data) VALUES (?, ?, ?)`).run(data.id, data.status || 'scanning', JSON.stringify(data));
    
    res.status(201).json(data);
    
    // Trigger AI deep search asynchronously
    runProcurementCampaign(data, db, broadcastEvent);
    
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Custom POST for refreshing a procurement campaign
app.post('/api/procurement_campaigns/:id/refresh', procurementCampaignLimiter, (req: Request, res: Response) => {
  try {
    const campaignId = req.params.id;
    const campaignRow = db.prepare(`SELECT data FROM procurement_campaigns WHERE id = ?`).get(campaignId);
    if (!campaignRow) return res.status(404).json({ error: 'Campagne introuvable' });

    const campaign = JSON.parse(campaignRow.data);
    campaign.status = 'scanning';
    
    // Update status in SQLite
    db.prepare(`UPDATE procurement_campaigns SET data = json_set(data, '$.status', 'scanning') WHERE id = ?`).run(campaignId);
    
    // Clear old suppliers from database
    db.prepare(`DELETE FROM procurement_suppliers WHERE campaign_id = ? OR json_extract(data, '$.campaignId') = ?`).run(campaignId, campaignId);
    
    // Broadcast live updates
    broadcastEvent('PROCUREMENT_CAMPAIGNS_UPDATED', campaign);
    broadcastEvent('PROCUREMENT_SUPPLIERS_CLEARED', { campaignId });

    res.json({ message: 'Sourcing relancé', campaign });

    // Re-run AI sourcing in background
    runProcurementCampaign(campaign, db, broadcastEvent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Custom POST for sending emails
const sendEmailSchema = z.object({
  userId: z.string().min(1),
  supplierId: z.string().min(1),
  toEmail: z.string().email().optional(),
  subject: z.string().optional(),
  body: z.string().min(1)
}).passthrough();

app.post('/api/send_email', emailLimiter, async (req: Request, res: Response) => {
  try {
    const validation = sendEmailSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ error: 'Erreur de validation', details: validation.error.format() });
    }
    
    const { userId, supplierId, toEmail, subject, body } = validation.data;
    
    // Contrôle d'accès : seul l'utilisateur lui-même ou un Admin peut envoyer un email
    const currentUser = (req as any).user;
    if (!currentUser || (currentUser.id !== userId && currentUser.role !== 'Admin')) {
      return res.status(403).json({ error: "Accès refusé : vous ne pouvez pas envoyer d'emails au nom d'un autre utilisateur." });
    }
    
    // Get user SMTP settings
    const userRow = db.prepare(`SELECT data FROM users WHERE id = ?`).get(userId);
    if (!userRow) return res.status(404).json({ error: 'User not found' });
    
    const user = JSON.parse(userRow.data);
    const smtp = user.smtpSettings;
    
    if (!smtp || !smtp.host || !smtp.user || !smtp.pass) {
      return res.status(400).json({ error: 'Messagerie non configurée. Veuillez configurer votre compte SMTP dans vos paramètres de profil.' });
    }

    const transporter = nodemailer.createTransport({
      host: smtp.host,
      port: smtp.port || 587,
      secure: smtp.secure || false,
      auth: {
        user: smtp.user,
        pass: smtp.pass
      }
    });

    await transporter.sendMail({
      from: `"${user.name} | ${user.department}" <${user.email}>`,
      to: toEmail || 'contact@fournisseur.com', // In reality, AI would extract this
      subject: subject || 'Demande de devis',
      text: body
    });

    // Update the supplier status to email_sent
    const supRow = db.prepare(`SELECT data FROM procurement_suppliers WHERE id = ?`).get(supplierId);
    if (supRow) {
      const supData = JSON.parse(supRow.data);
      supData.contactStatus = 'email_sent';
      db.prepare(`UPDATE procurement_suppliers SET data = ? WHERE id = ?`).run(JSON.stringify(supData), supplierId);
    }

    res.json({ success: true, message: 'Email envoyé avec succès !' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: 'Erreur lors de lenvoi de lemail: ' + error.message });
  }
});

// Endpoint to refresh supplier info using AI
app.post('/api/refresh_supplier_info', procurementCampaignLimiter, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const { supplierId, name } = req.body;
    if (!name) return res.status(400).json({ error: 'Nom requis' });
    const newData = await refreshSupplierInfo(name, db);
    
    if (newData) {
      const row = db.prepare(`SELECT data FROM global_suppliers WHERE id = ?`).get(supplierId);
      if (row) {
        const data = JSON.parse(row.data);
        const updated = { ...data, ...newData };
        db.prepare(`UPDATE global_suppliers SET data = ? WHERE id = ?`).run(JSON.stringify(updated), supplierId);
        return res.json(updated);
      }
    }
    res.status(404).json({ error: 'Failed to refresh info' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint to refresh ALL suppliers
app.post('/api/refresh_all_suppliers', procurementCampaignLimiter, requireRole('admin', 'manager'), async (req: Request, res: Response) => {
  try {
    const suppliers = db.prepare(`SELECT id, name, data FROM global_suppliers`).all();
    const results = await refreshAllSuppliers(suppliers, db);
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Setup GET, PUT, DELETE for procurement_campaigns
setupCrudRoutes('procurement_campaigns', ['status'], ['admin', 'manager', 'collaborateur']);

// Serve static files from the React app in production
const distPath = path.join(__dirname, '../dist');
app.use(express.static(distPath));

// The "catchall" handler: for any request that doesn't
// match one above, send back React's index.html file (or 404 for API).
app.get('*', (req: Request, res: Response) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'Endpoint API introuvable' });
  }
  res.sendFile(path.join(distPath, 'index.html'));
});

// Only start listening if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Puma Full-Stack Server is listening on port ${PORT}`);
  });
}

export { app };
