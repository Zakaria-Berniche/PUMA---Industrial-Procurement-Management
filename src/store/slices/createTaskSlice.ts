import { StateCreator } from 'zustand';
import { 
  Objective, 
  ObjectiveStatus, 
  AuditLogEntry, 
  ObjectiveAttachment, 
  StepStatus, 
  BlockingReason, 
  WorkflowStep,
  WorkflowBlock,
  BlockStatus,
  OperationalUnitType
} from '../../types';
import { api } from '../../lib/api';
import { NotificationSlice } from './createNotificationSlice';
import { AuthSlice } from './createAuthSlice';
import { DataSlice } from './createDataSlice';

export interface ObjectiveSlice {
  objectives: Objective[];
  addObjective: (objective: Objective) => Promise<void>;
  updateObjectiveStatus: (objectiveId: string, status: ObjectiveStatus) => Promise<void>;
  updateObjective: (objective: Objective) => Promise<void>;
  addAttachment: (objectiveId: string, attachment: Omit<ObjectiveAttachment, 'id'>) => Promise<void>;
  addComment: (taskId: string, content: string, stepId?: string) => Promise<void>;
  
  // Nouvelles méthodes industrielles
  toggleMicroStep: (objectiveId: string, stepId: string, microStepId: string) => Promise<void>;
  setStepBlocking: (objectiveId: string, stepId: string, reason: BlockingReason | null, comment?: string) => Promise<void>;
  logStepTime: (objectiveId: string, stepId: string, minutes: number) => Promise<void>;
  updateWorkflowStep: (taskId: string, stepId: string, updates: Partial<WorkflowStep>) => Promise<void>;
  deleteObjective: (taskId: string) => Promise<void>;
  cancelObjective: (taskId: string) => Promise<void>;
  recalculateRisks: () => void;
}

type CombinedState = ObjectiveSlice & NotificationSlice & AuthSlice & DataSlice;

const flattenWorkflow = (blocks: WorkflowBlock[]): WorkflowStep[] => {
  return (blocks || []).flatMap(block => block.tasks);
};

const calculateObjectiveRisk = (objective: Objective): { score: number; level: 'Faible' | 'Modéré' | 'Élevé' | 'Critique' } => {
  let score = 0;
  const now = new Date();
  const allTasks = flattenWorkflow(objective.blocks);
  
  // 1. Check for blocked steps
  const blockedSteps = allTasks.filter(s => s.status === 'Bloqué').length;
  score += blockedSteps * 25;

  // 2. Check for overdue steps
  const overdueSteps = allTasks.filter(s => s.dueDate && new Date(s.dueDate) < now && s.status !== 'Validé').length;
  score += overdueSteps * 35;

  // 3. Overall Due Date
  if (new Date(objective.dueDate) < now && objective.status !== 'Terminé') {
    score += 50;
  }

  // 4. Complexity multiplier
  const complexityMultiplier = objective.complexityScore === 'Critique' ? 1.5 : objective.complexityScore === 'Complexe' ? 1.3 : 1;
  score = score * complexityMultiplier;

  // Cap at 100
  score = Math.min(score, 100);

  let level: 'Faible' | 'Modéré' | 'Élevé' | 'Critique' = 'Faible';
  if (score > 80) level = 'Critique';
  else if (score > 50) level = 'Élevé';
  else if (score > 20) level = 'Modéré';

  return { score: Math.round(score), level };
};

const createBlock = (title: string, type: OperationalUnitType, tasks: string[], state: CombinedState): WorkflowBlock => {
  const rules = state.globalRules;
  const defaultSla = rules.slaMatrix[type] || 24;

  // Chercher si le bloc lui-même a une configuration pour hériter de customType au niveau du bloc
  const blockConfig = state.taskConfigurations.find(c => c.category === title || c.title === title);

  return {
    id: `block_${Math.random().toString(36).substr(2, 9)}`,
    title,
    type,
    customType: blockConfig?.customType,
    status: 'Locked',
    order: 0,
    tasks: tasks.map((t, idx) => {
      // Rechercher la config de tâche si elle existe pour hériter des SLA/Micro-étapes par défaut
      const config = state.taskConfigurations.find(c => c.title === t);
      return {
        id: `task_${Math.random().toString(36).substr(2, 9)}`,
        title: t,
        type: config?.type || type,
        customType: config?.customType || blockConfig?.customType, // Hérite du domaine sémantique
        status: 'Non démarré',
        isValidationRequired: (config?.type || type) === 'Validation',
        isMandatory: true,
        requireNote: config?.requireNote || false,
        requirePhoto: config?.requirePhoto || false,
        slaHours: config?.defaultSlaHours || defaultSla,
        microSteps: (config?.defaultMicroSteps || []).map(msTitle => ({
          id: `ms_${Math.random().toString(36).substr(2, 6)}`,
          title: msTitle,
          isCompleted: false
        })),
        order: idx
      };
    })
  };
};

export const createTaskSlice: StateCreator<CombinedState, [], [], ObjectiveSlice> = (set, get) => ({
  objectives: [],

  addObjective: async (objective) => {
    const state = get();
    const rules = state.globalRules;
    const isUrgent = objective.priority === 'Urgent' || objective.type.includes('Urgence');
    
    // MOTEUR D'ASSEMBLAGE DE BLOCS DYNAMIQUE
    const blocks: WorkflowBlock[] = [];
    
    // Helper pour récupérer les titres de tâches par catégorie
    const getTasksByCategory = (category: string) => 
      state.taskConfigurations
        .filter(tc => tc.category === category)
        .map(tc => tc.title);

    if (isUrgent) {
      // MODE URGENCE : Workflow Accéléré (Basé sur la catégorie GESTION BLOQUAGE/URGENCE si existe)
      blocks.push(createBlock('ANALYSE ÉCLAIR', 'Analyse', ['Vérifier demande critique', 'Confirmer disponibilité stock immédiat'], state));
      blocks.push(createBlock('CONSULTATION DIRECTE', 'Consultation', ['Contacter fournisseur historique', 'Valider prix flash'], state));
      blocks.push(createBlock('VALIDATION ACCÉLÉRÉE', 'Validation', ['Validation Manager (Priorité Haute)'], state));
      blocks.push(createBlock('EXÉCUTION IMMÉDIATE', 'Administratif', ['Émettre BC Urgent', 'Confirmer ramassage/livraison express'], state));
      blocks.push(createBlock('CLÔTURE', 'Administratif', ['Archiver documents'], state));
    } else {
      // MODE STANDARD DYNAMIQUE
      // 1. Bloc Analyse
      blocks.push(createBlock('ANALYSE BESOIN', 'Analyse', getTasksByCategory('ANALYSE BESOIN'), state));

      // 2. Blocs optionnels selon le type
      if (objective.type === 'Consultation Fournisseur' || objective.type.includes('Achat')) {
        blocks.push(createBlock('CONSULTATION FOURNISSEURS', 'Consultation', getTasksByCategory('CONSULTATION FOURNISSEURS'), state));
        blocks.push(createBlock('ANALYSE OFFRES', 'Analyse', getTasksByCategory('ANALYSE & COMPARAISON'), state));
      }

      if (objective.type === 'Achat Stratégique' || objective.type === 'Achat Projet') {
        blocks.push(createBlock('NÉGOCIATION', 'Négociation', getTasksByCategory('NÉGOCIATION'), state));
      }

      // 3. Bloc Validation (Dynamique selon seuil)
      const validationTasks = ['Préparer dossier achat', 'Envoyer validation manager', 'Attendre approbation'];
      if (objective.quoteAmount && objective.quoteAmount > rules.validationThresholdDZD) {
        validationTasks.push(`Envoyer validation direction (> ${rules.validationThresholdDZD/1000}k)`);
      }
      blocks.push(createBlock('VALIDATION', 'Validation', validationTasks, state));

      // 4. Blocs d'exécution
      blocks.push(createBlock('COMMANDE', 'Administratif', getTasksByCategory('COMMANDE'), state));
      blocks.push(createBlock('LIVRAISON', 'Logistique', getTasksByCategory('SUIVI LIVRAISON'), state));
      blocks.push(createBlock('RÉCEPTION', 'Contrôle', getTasksByCategory('RÉCEPTION'), state));
      blocks.push(createBlock('CLÔTURE', 'Administratif', getTasksByCategory('CLÔTURE'), state));
    }

    // Organisation des ordres et activation du premier bloc
    const finalizedBlocks = blocks.map((b, idx) => ({
      ...b,
      order: idx,
      status: (idx === 0 ? 'Active' : 'Locked') as BlockStatus
    }));

    const enrichedObjective = {
      ...objective,
      blocks: finalizedBlocks,
      workflow: flattenWorkflow(finalizedBlocks)
    };

    const risk = calculateObjectiveRisk(enrichedObjective as Objective);

    const newObjective = {
      ...enrichedObjective,
      riskScore: risk.score,
      riskLevel: risk.level,
      auditLog: [
        ...(objective.auditLog || []),
        {
          id: `log_${Date.now()}`,
          timestamp: new Date().toISOString(),
          userId: state.currentUser?.id || 'system',
          userName: state.currentUser?.name || 'Système',
          action: 'CRÉATION',
          details: `Opération créée avec moteur de blocs industriels`
        }
      ]
    };

    set((state) => ({
      objectives: [...state.objectives, newObjective as Objective]
    }));
    await api.post('/tasks', newObjective).catch(console.error);
  },

  updateObjectiveStatus: async (objectiveId, status) => {
    const state = get();
    const oldObjective = state.objectives.find(o => o.id === objectiveId);
    if (!oldObjective) return;

    const auditEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser?.id || 'system',
      userName: state.currentUser?.name || 'Système',
      action: 'CHANGEMENT_STATUT',
      details: `Statut passé de ${oldObjective.status} à ${status}`,
      oldValue: oldObjective.status,
      newValue: status
    };

    // Optimistic update
    set((state) => ({
      objectives: state.objectives.map((o) => {
        if (o.id === objectiveId) {
          const updated = { ...o, status, auditLog: [...o.auditLog, auditEntry] };
          const risk = calculateObjectiveRisk(updated);
          return { ...updated, riskScore: risk.score, riskLevel: risk.level };
        }
        return o;
      })
    }));
    
    const updated = get().objectives.find(o => o.id === objectiveId);
    if (updated) {
      try {
        await api.put(`/tasks/${objectiveId}`, updated);
      } catch (err) {
        // Rollback on failure
        console.error('Rollback updateObjectiveStatus:', err);
        set((state) => ({
          objectives: state.objectives.map((o) => o.id === objectiveId ? oldObjective : o)
        }));
      }
    }
  },

  updateObjective: async (updatedObjective) => {
    const state = get();
    const oldObjective = state.objectives.find((o) => o.id === updatedObjective.id);
    if (!oldObjective) return;

    const auditEntry: AuditLogEntry = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: state.currentUser?.id || 'system',
      userName: state.currentUser?.name || 'Système',
      action: 'MISE_À_JOUR',
      details: 'Informations de l\'opération modifiées'
    };

    // Recalculate workflow from blocks if blocks changed
    const finalObjective = {
      ...updatedObjective,
      workflow: flattenWorkflow(updatedObjective.blocks),
      auditLog: [...(updatedObjective.auditLog || []), auditEntry]
    };

    const risk = calculateObjectiveRisk(finalObjective as Objective);
    finalObjective.riskScore = risk.score;
    finalObjective.riskLevel = risk.level;

    // Optimistic update
    set((state) => ({
      objectives: state.objectives.map((o) => (o.id === updatedObjective.id ? finalObjective as Objective : o))
    }));
    try {
      await api.put(`/tasks/${updatedObjective.id}`, finalObjective);
    } catch (err) {
      // Rollback on failure
      console.error('Rollback updateObjective:', err);
      set((state) => ({
        objectives: state.objectives.map((o) => o.id === updatedObjective.id ? oldObjective : o)
      }));
    }
  },

  addAttachment: async (objectiveId, attachmentData) => {
    const state = get();
    const objective = state.objectives.find((o) => o.id === objectiveId);
    if (!objective) return;

    const attachment: ObjectiveAttachment = {
      ...attachmentData,
      id: `att_${Date.now()}`
    };

    const updatedObjective: Objective = {
      ...objective,
      attachments: [...(objective.attachments || []), attachment],
      // AUTO-START: If task was Nouveau, move to En cours
      status: objective.status === 'Nouveau' ? 'En cours' : objective.status,
      auditLog: [...(objective.auditLog || []), {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: state.currentUser?.id || 'system',
        userName: state.currentUser?.name || 'Système',
        action: 'AJOUT_DOCUMENT',
        details: `Document "${attachment.name}" ajouté ${attachment.stepId ? 'à une étape' : ''} ${objective.status === 'Nouveau' ? '(Démarrage automatique)' : ''}`
      }]
    };

    set((state) => ({
      objectives: state.objectives.map((o) => (o.id === objectiveId ? updatedObjective : o))
    }));
    await api.put(`/tasks/${objectiveId}`, updatedObjective).catch(console.error);
  },

  toggleMicroStep: async (objectiveId, stepId, microStepId) => {
    const state = get();
    const objective = state.objectives.find((o) => o.id === objectiveId);
    if (!objective) return;

    const updatedBlocks = objective.blocks.map(block => ({
      ...block,
      tasks: block.tasks.map(task => {
        if (task.id === stepId) {
          return {
            ...task,
            microSteps: task.microSteps.map(ms => 
              ms.id === microStepId ? { ...ms, isCompleted: !ms.isCompleted } : ms
            )
          };
        }
        return task;
      })
    }));

    const allTasks = flattenWorkflow(updatedBlocks);
    const completedTasks = allTasks.filter(t => t.status === 'Validé').length;
    const totalTasks = allTasks.length;
    
    let newStatus = objective.status;
    if (newStatus === 'Nouveau' && completedTasks > 0) {
      newStatus = 'En cours';
    }

    // AUTO-COMPLETION / VALIDATION
    if (totalTasks > 0 && completedTasks === totalTasks && newStatus !== 'Terminé' && newStatus !== 'En validation') {
      const hasValidationStep = allTasks.some(t => t.isValidationRequired || t.type === 'Validation');
      newStatus = hasValidationStep ? 'En validation' : 'Terminé';
    }

    const updatedObjective: Objective = { 
      ...objective, 
      blocks: updatedBlocks,
      workflow: allTasks,
      status: newStatus
    };

    set((state) => ({
      objectives: state.objectives.map((o) => (o.id === objectiveId ? updatedObjective : o))
    }));
    await api.put(`/tasks/${objectiveId}`, updatedObjective).catch(console.error);
  },

  setStepBlocking: async (objectiveId, stepId, reason, comment) => {
    const objective = get().objectives.find((o) => o.id === objectiveId);
    if (!objective) return;

    const updatedBlocks = objective.blocks.map(block => ({
      ...block,
      tasks: block.tasks.map(task => {
        if (task.id === stepId) {
          return {
            ...task,
            status: (reason ? 'Bloqué' : 'En traitement') as StepStatus,
            blockingReason: reason || undefined,
            blockingComment: comment
          };
        }
        return task;
      })
    }));

    const updatedObjective = { 
      ...objective, 
      blocks: updatedBlocks,
      workflow: flattenWorkflow(updatedBlocks),
      status: (reason ? 'Bloqué' : objective.status) as ObjectiveStatus
    };
    
    set((state) => ({
      objectives: state.objectives.map((o) => (o.id === objectiveId ? updatedObjective : o))
    }));
    await api.put(`/tasks/${objectiveId}`, updatedObjective).catch(console.error);
  },

  logStepTime: async (objectiveId, stepId, minutes) => {
    const objective = get().objectives.find((o) => o.id === objectiveId);
    if (!objective) return;

    const updatedBlocks = objective.blocks.map(block => ({
      ...block,
      tasks: block.tasks.map(task => {
        if (task.id === stepId) {
          return { ...task, timeSpentMinutes: (task.timeSpentMinutes || 0) + minutes };
        }
        return task;
      })
    }));

    const allTasks = flattenWorkflow(updatedBlocks);
    const totalMinutes = allTasks.reduce((acc, s) => acc + (s.timeSpentMinutes || 0), 0);

    const updatedObjective = { 
      ...objective, 
      blocks: updatedBlocks,
      workflow: allTasks,
      totalTimeSpentMinutes: totalMinutes
    };

    set((state) => ({
      objectives: state.objectives.map((o) => (o.id === objectiveId ? updatedObjective : o))
    }));
    await api.put(`/tasks/${objectiveId}`, updatedObjective).catch(console.error);
  },

  updateWorkflowStep: async (taskId, stepId, updates) => {
    const objective = get().objectives.find((o) => o.id === taskId);
    if (!objective) return;

    const updatedBlocks = objective.blocks.map(block => ({
      ...block,
      tasks: block.tasks.map(task => (task.id === stepId ? { ...task, ...updates } : task))
    }));

    const allTasks = flattenWorkflow(updatedBlocks);
    const completedTasks = allTasks.filter(t => t.status === 'Validé').length;
    const totalTasks = allTasks.length;

    let newStatus = objective.status;
    if (newStatus === 'Nouveau' && (updates.status === 'En traitement' || updates.status === 'Validé' || updates.status === 'Fait')) {
      newStatus = 'En cours';
    }

    // AUTO-COMPLETION / VALIDATION
    const hasPendingValidation = allTasks.some(t => t.status === 'Fait' || t.status === 'Bloqué');
    if (hasPendingValidation && newStatus !== 'Terminé' && newStatus !== 'Annulé') {
      newStatus = 'En validation';
    }

    if (totalTasks > 0 && completedTasks === totalTasks && newStatus !== 'Terminé') {
      const hasValidationStep = allTasks.some(t => t.isValidationRequired || t.type === 'Validation');
      newStatus = hasValidationStep ? 'En validation' : 'Terminé';
    }

    const updatedObjective: Objective = { 
      ...objective, 
      blocks: updatedBlocks,
      workflow: allTasks,
      status: newStatus
    };

    set((state) => ({
      objectives: state.objectives.map((o) => (o.id === taskId ? updatedObjective : o))
    }));
    await api.put(`/tasks/${taskId}`, updatedObjective).catch(console.error);
  },

  deleteObjective: async (taskId) => {
    const state = get();
    const oldObjective = state.objectives.find(o => o.id === taskId);

    // Optimistic removal
    set((state) => ({
      objectives: state.objectives.filter((o) => o.id !== taskId)
    }));
    try {
      await api.delete(`/tasks/${taskId}`);
    } catch (err) {
      // Rollback on failure
      console.error('Rollback deleteObjective:', err);
      if (oldObjective) {
        set((state) => ({
          objectives: [...state.objectives, oldObjective]
        }));
      }
    }
  },

  cancelObjective: async (taskId) => {
    const state = get();
    const objective = state.objectives.find(o => o.id === taskId);
    if (!objective) return;

    const updatedObjective = { 
      ...objective, 
      status: 'Annulé' as ObjectiveStatus,
      auditLog: [...objective.auditLog, {
        id: `log_cancel_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: state.currentUser?.id || 'system',
        userName: state.currentUser?.name || 'Système',
        action: 'ANNULATION',
        details: `Opération annulée`
      }]
    };

    set((state) => ({
      objectives: state.objectives.map((o) => (o.id === taskId ? updatedObjective : o))
    }));
    await api.put(`/tasks/${taskId}`, updatedObjective).catch(console.error);
  },

  addComment: async (taskId, content, stepId) => {
    const state = get();
    const objective = state.objectives.find(o => o.id === taskId);
    if (!objective) return;

    const newComment = {
      id: `comm_${Date.now()}`,
      taskId,
      userId: state.currentUser?.id || 'system',
      content,
      createdAt: new Date().toISOString(),
      stepId
    };

    const updatedObjective = {
      ...objective,
      comments: [...(objective.comments || []), newComment],
      auditLog: [...(objective.auditLog || []), {
        id: `log_comm_${Date.now()}`,
        timestamp: new Date().toISOString(),
        userId: state.currentUser?.id || 'system',
        userName: state.currentUser?.name || 'Système',
        action: 'COMMENTAIRE',
        details: `Nouveau commentaire ${stepId ? 'sur une étape' : 'global'}`
      }]
    };

    set((state) => ({
      objectives: state.objectives.map(o => o.id === taskId ? updatedObjective : o)
    }));
    await api.put(`/tasks/${taskId}`, updatedObjective).catch(console.error);

    // Si c'est un commentaire sur une étape, on peut aussi déclencher une notification
    if (stepId) {
      const step = objective.workflow.find(s => s.id === stepId);
      if (step) {
        // Notification logic here if needed
      }
    }
  },

  recalculateRisks: () => {
    set((state) => ({
      objectives: state.objectives.map((obj) => {
        const risk = calculateObjectiveRisk(obj);
        return { ...obj, riskScore: risk.score, riskLevel: risk.level };
      })
    }));
  }
});
