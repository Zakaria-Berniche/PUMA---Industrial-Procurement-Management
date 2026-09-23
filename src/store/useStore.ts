import { addDays, addWeeks, addMonths, addYears, isAfter } from 'date-fns';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthSlice, createAuthSlice } from './slices/createAuthSlice';
import { DataSlice, createDataSlice } from './slices/createDataSlice';
import { ObjectiveSlice, createTaskSlice } from './slices/createTaskSlice';
import { NotificationSlice, createNotificationSlice } from './slices/createNotificationSlice';
import { PermissionsSlice, createPermissionsSlice } from './slices/createPermissionsSlice';
import { ProcurementSlice, createProcurementSlice } from './slices/createProcurementSlice';
import { AnalysisSlice, createAnalysisSlice } from './slices/createAnalysisSlice';
import { UISlice, createUISlice } from './slices/createUISlice';
import { User, Site, Objective, WorkflowTemplate, ProcurementCampaign, ProcurementSupplier, GlobalSupplier, TaskConfiguration, Notification, GlobalRules, AIConfig, ReportConfig, ComparisonMatrix } from '../types';
import { AnalysisSettings } from './slices/createAnalysisSlice';
import { CompanyInfo } from './slices/createDataSlice';
import { api } from '../lib/api';

type AppState = AuthSlice & DataSlice & ObjectiveSlice & NotificationSlice & PermissionsSlice & ProcurementSlice & AnalysisSlice & UISlice & {
  initializeStore: () => Promise<void>;
};

export const useStore = create<AppState>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createDataSlice(...a),
      ...createTaskSlice(...a),
      ...createNotificationSlice(...a),
      ...createPermissionsSlice(...a),
      ...createProcurementSlice(...a),
      ...createAnalysisSlice(...a),
      ...createUISlice(...a),
      initializeStore: async () => {
        try {
          const [users, sites, objectives, workflowTemplates, taskConfigs, campaigns, suppliers, globalSuppliers, notifications, settings, globalRules, aiConfig, reportConfig, matrices, analysisSettings] = await Promise.all([
            api.get<User[]>('/users'),
            api.get<Site[]>('/sites'),
            api.get<Objective[]>('/tasks'),
            api.get<WorkflowTemplate[]>('/workflow_templates'),
            api.get<TaskConfiguration[]>('/task_configurations').catch(() => []),
            api.get<ProcurementCampaign[]>('/procurement_campaigns').catch(() => []),
            api.get<ProcurementSupplier[]>('/procurement_suppliers').catch(() => []),
            api.get<GlobalSupplier[]>('/global_suppliers').catch(() => []),
            api.get<Notification[]>('/notifications').catch(() => []),
            api.get<CompanyInfo>('/settings/company_info').catch(() => null),
            api.get<GlobalRules>('/settings/global_rules').catch(() => null),
            api.get<AIConfig>('/settings/ai_config').catch(() => null),
            api.get<ReportConfig>('/settings/report_config').catch(() => null),
            api.get<ComparisonMatrix[]>('/comparison_matrices').catch(() => []),
            api.get<AnalysisSettings>('/settings/analysis_settings').catch(() => null)
          ]);
          a[0]({
            users: users || [],
            sites: sites || [],
            objectives: objectives || [],
            workflowTemplates: workflowTemplates || [],
            taskConfigurations: taskConfigs || [],
            procurementCampaigns: campaigns || [],
            procurementSuppliers: suppliers || [],
            globalSuppliers: globalSuppliers || [],
            notifications: notifications || [],
            companyInfo: settings || a[1]().companyInfo,
            globalRules: globalRules || a[1]().globalRules,
            aiConfig: aiConfig || a[1]().aiConfig,
            reportConfig: reportConfig || a[1]().reportConfig,
            comparisonMatrices: matrices || [],
            analysisSettings: analysisSettings || a[1]().analysisSettings
          } as Partial<AppState>);

          // DÉCLENCHEMENT DE LA SURVEILLANCE SLA
          const updatedObjectives = checkSLACompliance(objectives || []);
          
          // GESTION DES OPÉRATIONS RÉCURRENTES (CDG 17.7)
          const { tasks: finalObjectives, created } = handleRecurringObjectives(updatedObjectives);
          
          if (JSON.stringify(finalObjectives) !== JSON.stringify(objectives) || created.length > 0) {
            a[0]({ objectives: finalObjectives } as Partial<AppState>);
            // Persist clones if any
            for (const newObj of created) {
               await api.post('/tasks', newObj).catch(console.error);
            }
          }
        } catch (error) {
          console.error("Failed to fetch initial data from backend", error);
        }
      }
    }),
    {
      name: 'puma-task-storage', // Key in localStorage
      merge: (persistedState: unknown, currentState) => ({
        ...currentState,
        ...(persistedState as object),
        // Ensure arrays are never undefined even after hydration
        objectives: (persistedState as AppState)?.objectives || [],
        users: (persistedState as AppState)?.users || [],
        sites: (persistedState as AppState)?.sites || [],
        workflowTemplates: (persistedState as AppState)?.workflowTemplates || [],
        taskConfigurations: (persistedState as AppState)?.taskConfigurations || [],
        notifications: (persistedState as AppState)?.notifications || [],
        procurementCampaigns: (persistedState as AppState)?.procurementCampaigns || [],
        procurementSuppliers: (persistedState as AppState)?.procurementSuppliers || [],
        globalSuppliers: (persistedState as AppState)?.globalSuppliers || []
      }),
      partialize: (state) => ({
        users: state.users,
        sites: state.sites,
        objectives: state.objectives,
        workflowTemplates: state.workflowTemplates,
        taskConfigurations: state.taskConfigurations,
        companyInfo: state.companyInfo,
        currentUser: state.currentUser,
        isAuthenticated: state.isAuthenticated,
        notifications: state.notifications,
        procurementCampaigns: state.procurementCampaigns,
        procurementSuppliers: state.procurementSuppliers,
        globalSuppliers: state.globalSuppliers,
        comparisonMatrices: state.comparisonMatrices,
        analysisSettings: state.analysisSettings,
        tasksFilters: state.tasksFilters,
        kanbanFilters: state.kanbanFilters,
        dashboardWidgetOrder: state.dashboardWidgetOrder
      })
    }
  )
);

function checkSLACompliance(objectives: Objective[]): Objective[] {
  const now = new Date();
  let modified = false;

  const updated = objectives.map(obj => {
    let hasViolation = false;
    
    // Check blocks
    const updatedBlocks = (obj.blocks || []).map(block => {
      if (block.status === 'Active' || block.status === 'Partial') {
        const startedAt = block.startedAt ? new Date(block.startedAt) : new Date(obj.createdAt);
        const hoursDiff = (now.getTime() - startedAt.getTime()) / (1000 * 60 * 60);
        
        if (block.slaHours && hoursDiff > block.slaHours) {
          hasViolation = true;
        }
      }
      return block;
    });

    if (hasViolation && obj.healthStatus !== 'Critique') {
      modified = true;
      return { ...obj, blocks: updatedBlocks, healthStatus: 'Critique' as const, status: 'En retard' as const };
    }
    
    return obj;
  });

  return modified ? updated : objectives;
}

function handleRecurringObjectives(objectives: Objective[]): { tasks: Objective[], created: Objective[] } {
  const now = new Date();
  const created: Objective[] = [];
  const updated = objectives.map(obj => {
    if (!obj.recurrence || !obj.recurrence.isActive) return obj;

    const nextDate = new Date(obj.recurrence.nextGenerationDate);
    
    if (isAfter(now, nextDate)) {
      // Cloner l'opération
      const newId = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const newObjective: Objective = {
        ...obj,
        id: newId,
        status: 'Nouveau',
        healthStatus: 'Stable',
        createdAt: now.toISOString(),
        startDate: now.toISOString(),
        dueDate: addDays(now, 7).toISOString(), // Default 1 week
        recurrence: undefined, // Le clone n'est pas lui-même le parent récurrent
        auditLog: [],
        comments: [],
        attachments: []
      };
      
      created.push(newObjective);

      // Calculer prochaine date pour le parent
      let nextGenDate: Date;
      const interval = obj.recurrence.interval || 1;
      
      switch (obj.recurrence.frequency) {
        case 'Quotidien': nextGenDate = addDays(nextDate, interval); break;
        case 'Hebdomadaire': nextGenDate = addWeeks(nextDate, interval); break;
        case 'Mensuel': nextGenDate = addMonths(nextDate, interval); break;
        case 'Annuel': nextGenDate = addYears(nextDate, interval); break;
        default: nextGenDate = addMonths(nextDate, 1);
      }

      return {
        ...obj,
        recurrence: {
          ...obj.recurrence,
          lastGeneratedDate: now.toISOString(),
          nextGenerationDate: nextGenDate.toISOString()
        }
      };
    }
    
    return obj;
  });

  return { tasks: [...updated, ...created], created };
}
