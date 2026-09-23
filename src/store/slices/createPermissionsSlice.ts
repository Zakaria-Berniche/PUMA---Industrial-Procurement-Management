import { StateCreator } from 'zustand';
import { Role, PermissionAction, SiteScope, AuditLog, User } from '../../types';

export interface PermissionsSlice {
  permissions: Record<Role, Record<PermissionAction, boolean>>;
  scopes: Record<Role, SiteScope>;
  auditLogs: AuditLog[];

  hasPermission: (user: User | null, action: PermissionAction) => boolean;
  getScope: (user: User | null) => SiteScope;
  updatePermission: (adminId: string, adminName: string, role: Role, action: PermissionAction, value: boolean) => void;
  updateScope: (adminId: string, adminName: string, role: Role, scope: SiteScope) => void;
}

const DEFAULT_PERMISSIONS: Record<Role, Record<PermissionAction, boolean>> = {
  Admin: {
    'tasks.view': true,
    'tasks.create': true,
    'tasks.edit': true,
    'tasks.delete': true,
    'tasks.delegate': true,
    'tasks.assign': true,
    'tasks.close': true,
    'workflows.view': true,
    'workflows.validate': true,
    'workflows.comment': true,
    'workflows.edit': true,
    'modules.dashboard': true,
    'modules.kanban': true,
    'modules.tasks': true,
    'modules.calendar': true,
    'modules.analysis': true,
    'modules.workflows': true,
    'modules.reports': true,
    'modules.admin': true,
    'modules.procurement': true
  },
  'Responsable Global': {
    'tasks.view': true,
    'tasks.create': true,
    'tasks.edit': true,
    'tasks.delete': true,
    'tasks.delegate': true,
    'tasks.assign': true,
    'tasks.close': true,
    'workflows.view': true,
    'workflows.validate': true,
    'workflows.comment': true,
    'workflows.edit': true,
    'modules.dashboard': true,
    'modules.kanban': true,
    'modules.tasks': true,
    'modules.calendar': true,
    'modules.analysis': true,
    'modules.workflows': true,
    'modules.reports': true,
    'modules.admin': true,
    'modules.procurement': true
  },
  'Responsable Local': {
    'tasks.view': true,
    'tasks.create': true,
    'tasks.edit': true,
    'tasks.delete': true,
    'tasks.delegate': true,
    'tasks.assign': true,
    'tasks.close': true,
    'workflows.view': true,
    'workflows.validate': true,
    'workflows.comment': true,
    'workflows.edit': true,
    'modules.dashboard': true,
    'modules.kanban': true,
    'modules.tasks': true,
    'modules.calendar': true,
    'modules.analysis': true,
    'modules.workflows': true,
    'modules.reports': true,
    'modules.admin': true,
    'modules.procurement': true
  },
  'Collaborateur': {
    'tasks.view': true,
    'tasks.create': true,
    'tasks.edit': true,
    'tasks.delete': true,
    'tasks.delegate': true,
    'tasks.assign': true,
    'tasks.close': true,
    'workflows.view': true,
    'workflows.validate': true,
    'workflows.comment': true,
    'workflows.edit': true,
    'modules.dashboard': true,
    'modules.kanban': true,
    'modules.tasks': true,
    'modules.calendar': true,
    'modules.analysis': true,
    'modules.workflows': true,
    'modules.reports': true,
    'modules.admin': true,
    'modules.procurement': true
  }
};

const DEFAULT_SCOPES: Record<Role, SiteScope> = {
  Admin: 'global',
  'Responsable Global': 'global',
  'Responsable Local': 'site',
  Collaborateur: 'site'
};

export const createPermissionsSlice: StateCreator<PermissionsSlice, [], [], PermissionsSlice> = (set, get) => ({
  permissions: DEFAULT_PERMISSIONS,
  scopes: DEFAULT_SCOPES,
  auditLogs: [],

  hasPermission: (user: User | null, action: PermissionAction) => {
    if (!user) return false;
    
    // Check if the user has custom allowedModules overrides for modules.* actions
    if (action.startsWith('modules.') && user.allowedModules) {
      return user.allowedModules.includes(action);
    }
    
    // Admins usually have full access, but we consult the matrix to be strictly RBAC compliant
    return get().permissions[user.role]?.[action] ?? false;
  },

  getScope: (user: User | null) => {
    if (!user) return 'site';
    return get().scopes[user.role] ?? 'site';
  },

  updatePermission: (adminId, adminName, role, action, value) =>
    set((state) => {
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminId,
        adminName,
        roleModified: role,
        permissionModified: action,
        newValue: value
      };

      return {
        permissions: {
          ...state.permissions,
          [role]: {
            ...state.permissions[role],
            [action]: value
          }
        },
        auditLogs: [newLog, ...state.auditLogs]
      };
    }),

  updateScope: (adminId, adminName, role, scope) =>
    set((state) => {
      const newLog: AuditLog = {
        id: `log_${Date.now()}`,
        timestamp: new Date().toISOString(),
        adminId,
        adminName,
        roleModified: role,
        permissionModified: 'scope',
        newValue: scope
      };

      return {
        scopes: {
          ...state.scopes,
          [role]: scope
        },
        auditLogs: [newLog, ...state.auditLogs]
      };
    })
});
