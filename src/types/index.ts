export type Role = 'Admin' | 'Responsable Global' | 'Responsable Local' | 'Collaborateur';
export type Priority = 'Faible' | 'Normale' | 'Haute' | 'Urgent';

// Statuts Opérationnels Standardisés
export type ObjectiveStatus = 'Nouveau' | 'En cours' | 'En validation' | 'Bloqué' | 'En retard' | 'Terminé' | 'Annulé';
export type StepStatus = 'Non démarré' | 'En traitement' | 'En attente' | 'Bloqué' | 'Fait' | 'Validé';

// Types d'Opérations
export type ObjectiveType = 
  | 'Achat Standard' 
  | 'Achat Urgent' 
  | 'Achat Stratégique' 
  | 'Achat Maintenance' 
  | 'Achat Projet' 
  | 'Consultation Fournisseur'
  | 'Audit Sécurité'
  | 'Maintenance Préventive';

// Indice de Santé
export type HealthStatus = 'Stable' | 'Attention' | 'Critique';
export type RiskLevel = 'Faible' | 'Modéré' | 'Élevé' | 'Critique';

// Compatibilité descendante (alias)
export type Status = ObjectiveStatus;

export type PermissionAction =
  | 'tasks.view'
  | 'tasks.create'
  | 'tasks.edit'
  | 'tasks.delete'
  | 'tasks.delegate'
  | 'tasks.assign'
  | 'tasks.close'
  | 'workflows.view'
  | 'workflows.validate'
  | 'workflows.comment'
  | 'workflows.edit'
  | 'modules.dashboard'
  | 'modules.kanban'
  | 'modules.tasks'
  | 'modules.calendar'
  | 'modules.analysis'
  | 'modules.workflows'
  | 'modules.reports'
  | 'modules.admin'
  | 'modules.procurement';

export type SiteScope = 'global' | 'multi-site' | 'site';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  oldValue?: string;
  newValue?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  adminId: string;
  adminName: string;
  roleModified: Role;
  permissionModified: PermissionAction | 'scope';
  newValue: boolean | SiteScope;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  siteId?: string; // Active or primary site
  siteIds?: string[]; // List of all accessible sites for multi-site users
  department: string;
  avatar?: string;
  phone?: string;
  position?: string;
  themePreference?: 'light' | 'dark' | 'system';
  createdAt?: string;
  lastLogin?: string;
  allowedModules?: PermissionAction[];
  notificationPreferences?: {
    email: boolean;
    push: boolean;
    taskAssigned: boolean;
    workflowStepCompleted: boolean;
    validationRequired: boolean;
    taskOverdue: boolean;
    newComment: boolean;
    taskCompleted: boolean;
  };
  smtpSettings?: {
    host: string;
    port: number;
    user: string;
    pass: string;
    secure: boolean;
  };
}

export interface Site {
  id: string;
  name: string;
  location: { lat: number; lng: number };
  type: 'Usine' | 'Showroom' | 'Dépôt' | 'Carrière';
  managerId: string;
}

export interface WorkflowTemplateStep {
  id: string;
  title: string;
  description?: string;
  type: OperationalUnitType;
  customType?: string; // Domaine sémantique dynamique généré par l'IA ou personnalisé
  role?: Role;
  raciRole?: 'Responsible' | 'Accountable' | 'Consulted' | 'Informed';
  isValidationRequired: boolean;
  isMandatory?: boolean;
  isCritical?: boolean;
  requireNote?: boolean;
  requirePhoto?: boolean;
  slaHours?: number;
  order: number;
  microSteps?: string[]; // Liste de titres de micro-étapes par défaut
  conditions?: {
    field: string;
    operator: 'gt' | 'lt' | 'eq';
    value: string | number | boolean;
  }[];
}

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  type: ObjectiveType;
  steps: WorkflowTemplateStep[];
  complexity?: 'Simple' | 'Moyen' | 'Complexe';
  estimatedTotalSlaHours?: number;
  version?: number;
  updatedAt?: string;
  rules?: {
    condition: string;
    action: string;
    value?: string | number | boolean;
  }[];
}

// Types d'Unités Opérationnelles (Catégories Métier)
export type OperationalUnitType = 
  | 'Analyse' 
  | 'Consultation' 
  | 'Validation' 
  | 'Négociation' 
  | 'Administratif' 
  | 'Logistique' 
  | 'Contrôle'
  | 'Autre';

// Configuration Globale d'une Tâche (Bibliothèque)
export interface TaskConfiguration {
  id: string;
  title: string;
  category: string;
  type: OperationalUnitType;
  customType?: string; // Domaine sémantique dynamique généré par l'IA ou personnalisé
  defaultSlaHours: number;
  requireNote?: boolean;
  requirePhoto?: boolean;
  defaultMicroSteps: string[];
}
export interface FunctionalBlock {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: OperationalUnitType;
  defaultTasks: Partial<WorkflowTemplateStep>[];
  suggestedSlaHours: number;
}

export interface GlobalRules {
  id: 'global_rules';
  validationThresholdDZD: number;
  slaMatrix: Record<OperationalUnitType, number>;
  urgentModeSlaHours: number;
}

export interface AIConfig {
  id: 'ai_config';
  model: string;
  temperature: number;
  sourcingPromptTemplate: string;
  refreshPromptTemplate: string;
  version?: number;
  learningLogs?: {
    id: string;
    date: string;
    action: string;
    improvement: string;
    feedbackCount: number;
  }[];
  memoryBuffer?: string[];
}

export interface ReportConfig {
  id: 'report_config';
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  showHeader: boolean;
  showFooter: boolean;
  footerText: string;
}

// Motif de Blocage Industriel
export type BlockingReason = 
  | 'Attente Validation' 
  | 'Devis Manquant' 
  | 'Fournisseur Indisponible' 
  | 'Budget Insuffisant' 
  | 'Problème Technique'
  | 'Rupture Stock'
  | 'Force Majeure';

// Micro-Jalon (Checklist interne d'une tâche)
export interface MicroStep {
  id: string;
  title: string;
  isCompleted: boolean;
  completedAt?: string;
  completedBy?: string;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description?: string;
  type: OperationalUnitType;
  customType?: string; // Domaine sémantique dynamique généré par l'IA ou personnalisé
  assigneeId?: string;
  role?: Role;
  raciRole?: 'Responsible' | 'Accountable' | 'Consulted' | 'Informed';
  status: StepStatus;
  isValidationRequired: boolean;
  isMandatory?: boolean;
  requireNote?: boolean;
  requirePhoto?: boolean;
  dueDate?: string;
  startDate?: string;
  completedAt?: string;
  slaHours?: number; // Temps maximal autorisé en heures
  timeSpentMinutes?: number;
  comparisonMatrixId?: string;
  blockingReason?: BlockingReason;
  blockingComment?: string;
  microSteps: MicroStep[];
  order: number;
  parentId?: string;
}

export interface ComparisonCriteria {
  id: string;
  label: string;
  weight: number; // 1 to 5
  type: 'numeric' | 'boolean' | 'text';
  unit?: string;
  betterDirection?: 'higher' | 'lower';
}

export interface ComparisonOption {
  id: string;
  name: string;
  values: Record<string, string | number | boolean>; // criteriaId -> value
  score: number;
  pros: string[];
  cons: string[];
}

export interface ComparisonMatrix {
  id: string;
  taskId?: string; // Optionnel pour les analyses hors-opération
  title: string;
  productName?: string;
  criteria: ComparisonCriteria[];
  options: ComparisonOption[];
  recommendation?: string;
  createdAt: string;
  updatedAt: string;
}

export type BlockStatus = 'Locked' | 'Active' | 'Partial' | 'Completed' | 'Blocked';

export interface WorkflowBlock {
  id: string;
  title: string;
  type: OperationalUnitType;
  customType?: string; // Domaine sémantique dynamique généré par l'IA ou personnalisé
  status: BlockStatus;
  order: number;
  tasks: WorkflowStep[];
  slaHours?: number;
  completedAt?: string;
  startedAt?: string;
}

export interface ObjectiveAttachment {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedBy: string;
  uploadedAt: string;
  size: number;
  stepId?: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  siteId: string;
  department: string;
  assigneeId: string;
  managerId: string;
  priority: Priority;
  status: ObjectiveStatus;
  type: ObjectiveType;
  customType?: string; // Domaine sémantique dynamique généré par l'IA ou personnalisé
  healthStatus: HealthStatus;
  riskScore: number; // 0-100
  riskLevel: RiskLevel;
  
  // Métriques Industrielles
  complexityScore: 'Simple' | 'Moyen' | 'Complexe' | 'Critique';
  totalSlaHours?: number;
  totalTimeSpentMinutes?: number;
  
  startDate: string;
  dueDate: string;
  createdAt: string;
  completedAt?: string;
  
  workflowTemplateId?: string;
  blocks: WorkflowBlock[]; // Nouveau système basé sur des blocs
  workflow: WorkflowStep[]; // Gardé pour compatibilité temporaire
  
  // Données opérationnelles
  supplierName?: string;
  quoteNumber?: string;
  quoteAmount?: number;
  currency?: string;
  internalReference?: string;
  
  tags?: string[];
  initialComment?: string;
  customFields: Record<string, string>;
  comments: Comment[];
  auditLog: AuditLogEntry[];
  attachments: ObjectiveAttachment[];
  dependencies: string[];
  
  // Récurrence (CDG 17.7)
  recurrence?: {
    frequency: 'Quotidien' | 'Hebdomadaire' | 'Mensuel' | 'Annuel';
    interval: number;
    nextGenerationDate: string;
    lastGeneratedDate?: string;
    isActive: boolean;
  };
}

// Alias pour compatibilité
export type Task = Objective;

export type NotificationType =
  | 'TASK_ASSIGNED'
  | 'WORKFLOW_STEP_COMPLETED'
  | 'VALIDATION_REQUIRED'
  | 'TASK_OVERDUE'
  | 'NEW_COMMENT'
  | 'TASK_COMPLETED';

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedTaskId?: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  stepId?: string;
}

export interface ProcurementCampaign {
  id: string;
  title: string;
  category: string;
  customType?: string; // Domaine sémantique dynamique généré par l'IA ou personnalisé
  brand?: string;
  specs: string;
  quantity: number;
  market: 'local' | 'international';
  status: 'initializing' | 'scanning' | 'filtering' | 'emailing' | 'completed';
  createdAt: string;
  relatedTaskId?: string;
}

export interface ProcurementSupplier {
  id: string;
  campaignId: string;
  name: string;
  reliabilityScore: number;
  contactStatus: 'pending' | 'email_sent' | 'email_opened' | 'replied' | 'rejected';
  selectionStatus: 'none' | 'selected' | 'rejected';
  quoteAmount?: number;
  emailDraft?: string;
  insight?: string;
  location?: { lat: number, lng: number };
  wilaya?: string;
  strengths?: string[];
  weaknesses?: string[];
}

export interface SupplierMetrics {
  averageDeliveryDelayDays: number;
  qualityScore: number; // 0-100
  reliabilityScore: number; // 0-100
  priceCompetitiveness: number; // 0-100
  complianceRate: number; // 0-100
  totalOrders: number;
  totalSpend: number;
}

export interface GlobalSupplier {
  id: string;
  name: string;
  category: string;
  status: 'Prospect' | 'Qualifié' | 'Partenaire Stratégique' | 'Blacklisté';
  tags: string[];
  aiScore: number;
  userScore: number | null;
  internalScore?: number; // Score global calculé par PUMA
  website: string;
  email: string;
  phone: string;
  consultations: number;
  metrics?: SupplierMetrics;
  lastAiSync?: string;
  location?: { lat: number, lng: number };
  wilaya?: string;
}
