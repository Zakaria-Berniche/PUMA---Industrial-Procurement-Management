import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Shield, Save, CheckCircle2, History, XCircle, Search } from 'lucide-react';
import { Role, PermissionAction, SiteScope } from '../../types';

const PERMISSION_GROUPS: Record<string, { label: string; actions: { id: PermissionAction; label: string }[] }> = {
  tasks: {
    label: 'Gestion des Tâches',
    actions: [
      { id: 'tasks.view', label: 'Voir les tâches' },
      { id: 'tasks.create', label: 'Créer une tâche' },
      { id: 'tasks.edit', label: 'Modifier une tâche' },
      { id: 'tasks.delete', label: 'Supprimer une tâche' },
      { id: 'tasks.delegate', label: 'Déléguer une tâche' },
      { id: 'tasks.assign', label: 'Assigner une tâche' },
      { id: 'tasks.close', label: 'Clôturer une tâche' }
    ]
  },
  workflows: {
    label: 'Gestion des Workflows',
    actions: [
      { id: 'workflows.view', label: 'Voir les workflows' },
      { id: 'workflows.validate', label: 'Valider une étape' },
      { id: 'workflows.comment', label: 'Commenter une étape' },
      { id: 'workflows.edit', label: 'Modifier un workflow' }
    ]
  },
  modules: {
    label: 'Accès aux Modules',
    actions: [
      { id: 'modules.dashboard', label: 'Tableau de bord' },
      { id: 'modules.kanban', label: 'Module Kanban' },
      { id: 'modules.tasks', label: 'Mes Opérations' },
      { id: 'modules.calendar', label: 'Module Calendrier' },
      { id: 'modules.procurement', label: 'Sourcing IA' },
      { id: 'modules.analysis', label: 'Analyses & Comparaisons' },
      { id: 'modules.workflows', label: 'Module Workflows' },
      { id: 'modules.reports', label: 'Module Rapports' },
      { id: 'modules.admin', label: 'Administration' }
    ]
  }
};

const ROLES: Role[] = ['Admin', 'Responsable Global', 'Responsable Local', 'Collaborateur'];
const SCOPES: { id: SiteScope; label: string }[] = [
  { id: 'global', label: 'Accès Global (Toutes usines)' },
  { id: 'multi-site', label: 'Accès Multi-sites' },
  { id: 'site', label: 'Accès Site Uniquement' }
];

export function PermissionsSettings() {
  const { currentUser, permissions, scopes, updatePermission, updateScope } = useStore();
  const [activeTab, setActiveTab] = useState<'matrix' | 'audit'>('matrix');
  const [activeGroup, setActiveGroup] = useState<string>('all');
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Local state for the matrix to allow bulk changes before saving (optional, but requested real-time usually in React, we'll do real-time Zustand updates for instant feedback)
  const handleToggle = (role: Role, action: PermissionAction, currentValue: boolean) => {
    if (!currentUser) return;
    updatePermission(currentUser.id, currentUser.name, role, action, !currentValue);
  };

  const handleScopeChange = (role: Role, scope: SiteScope) => {
    if (!currentUser) return;
    updateScope(currentUser.id, currentUser.name, role, scope);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-50 flex items-center gap-2">
            <Shield className="w-6 h-6 text-emerald-500" />
            Gestion des rôles et permissions
          </h2>
          <p className="text-sm text-slate-400 mt-1">Matrice de contrôle d'accès basée sur les rôles (RBAC)</p>
        </div>
        <div className="flex gap-2 bg-slate-900/50 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'matrix' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Matrice des Permissions
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'audit' ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Journal d'Audit
          </button>
        </div>
      </div>

      {activeTab === 'matrix' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Scope Configuration */}
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-800/50">
              <CardTitle className="text-base text-slate-50 flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-500" /> Restrictions Multi-Sites (Scopes)
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {ROLES.map((role) => (
                  <div key={`scope-${role}`} className="space-y-2">
                    <label className="text-sm font-medium text-slate-300">{role}</label>
                    <select
                      title="Changer de rôle"
                      value={scopes[role]}
                      onChange={(e) => handleScopeChange(role, e.target.value as SiteScope)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 px-3 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    >
                      {SCOPES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Matrix Controls */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto w-full pb-2 sm:pb-0 scrollbar-hide">
              <button
                onClick={() => setActiveGroup('all')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                  activeGroup === 'all'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                }`}
              >
                Tous les modules
              </button>
              {Object.entries(PERMISSION_GROUPS).map(([key, group]) => (
                <button
                  key={key}
                  onClick={() => setActiveGroup(key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
                    activeGroup === key
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-950 text-slate-400 border border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {group.label}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setIsSaving(true);
                setTimeout(() => {
                  setIsSaving(false);
                  setShowSuccess(true);
                  setTimeout(() => setShowSuccess(false), 3000);
                }, 600);
              }}
              disabled={isSaving}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-50 px-4 py-2 rounded-md font-semibold transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)] whitespace-nowrap"
            >
              {isSaving ? (
                <span className="animate-pulse">Application...</span>
              ) : (
                <>
                  <Save className="w-4 h-4" /> Sauvegarder
                </>
              )}
            </button>
          </div>

          {showSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-md flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-5 h-5" />
              Les permissions ont été appliquées avec succès.
            </div>
          )}

          {/* The Matrix */}
          <Card className="bg-slate-900/50 border-slate-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="p-4 bg-slate-50/80 border-b border-slate-800 text-sm font-semibold text-slate-300 w-1/3 min-w-[200px] sticky left-0 z-20">
                      Permission / Action
                    </th>
                    {ROLES.map((role) => (
                      <th
                        key={`header-${role}`}
                        className="p-4 bg-slate-50/80 border-b border-l border-slate-800 text-sm font-semibold text-slate-300 text-center min-w-[140px]"
                      >
                        {role}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(PERMISSION_GROUPS)
                    .filter(([key]) => activeGroup === 'all' || activeGroup === key)
                    .map(([key, group]) => (
                      <React.Fragment key={key}>
                        <tr className="bg-slate-900 border-b border-slate-800">
                          <td
                            colSpan={5}
                            className="p-3 text-xs font-bold text-emerald-500 uppercase tracking-widest bg-emerald-500/5 sticky left-0 z-10"
                          >
                            {group.label}
                          </td>
                        </tr>
                        {group.actions.map((action) => (
                          <tr
                            key={action.id}
                            className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors group"
                          >
                            <td className="p-4 text-sm text-slate-300 font-medium sticky left-0 z-10 bg-inherit border-r border-slate-800/50">
                              {action.label}
                              <div className="text-[10px] text-slate-500 font-mono mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                {action.id}
                              </div>
                            </td>
                            {ROLES.map((role) => {
                              const isGranted = permissions[role]?.[action.id] ?? false;
                              // Predefined blocks for Admin to prevent locking out
                              const isAdminAndModuleParam = role === 'Admin' && action.id === 'modules.admin';
                              const disabled = isAdminAndModuleParam;

                              return (
                                <td
                                  key={`cell-${role}-${action.id}`}
                                  className="p-4 border-l border-slate-800/50 text-center"
                                >
                                  <label
                                    className={`relative inline-flex items-center cursor-pointer ${disabled ? 'opacity-50' : ''}`}
                                  >
                                    <input
                                      type="checkbox"
                                      title="Activer/Désactiver la permission"
                                      className="sr-only peer"
                                      checked={isGranted}
                                      onChange={() => handleToggle(role, action.id, isGranted)}
                                      disabled={disabled}
                                    />
                                    <div className="w-11 h-6 bg-slate-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500 shadow-inner"></div>
                                  </label>
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {activeTab === 'audit' && <AuditLogsViewer />}
    </div>
  );
}

function AuditLogsViewer() {
  const { auditLogs } = useStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = auditLogs.filter(
    (log) =>
      log.adminName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.roleModified.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.permissionModified.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className="bg-slate-900/50 border-slate-800 animate-in fade-in">
      <CardHeader className="border-b border-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-lg text-slate-50 flex items-center gap-2">
            <History className="w-5 h-5 text-emerald-500" /> Journal d'Audit des Permissions
          </CardTitle>
          <CardDescription className="text-slate-400">
            Traçabilité complète des modifications de sécurité
          </CardDescription>
        </div>
        <div className="relative max-w-xs w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Rechercher (Admin, Rôle, Action)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md py-2 pl-9 pr-3 text-sm text-slate-50 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-medium">
              <tr>
                <th className="px-6 py-4">Date & Heure</th>
                <th className="px-6 py-4">Administrateur</th>
                <th className="px-6 py-4">Rôle Impacté</th>
                <th className="px-6 py-4">Action / Propriété</th>
                <th className="px-6 py-4 text-right">Nouvelle Valeur</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    Aucun événement de sécurité enregistré pour le moment.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('fr-FR')}
                    </td>
                    <td className="px-6 py-4 text-emerald-400 font-medium">{log.adminName}</td>
                    <td className="px-6 py-4 text-slate-300">
                      <span className="bg-slate-800 px-2 py-1 rounded text-xs">{log.roleModified}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-mono text-xs">{log.permissionModified}</td>
                    <td className="px-6 py-4 text-right">
                      {typeof log.newValue === 'boolean' ? (
                        log.newValue ? (
                          <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded text-xs">
                            <CheckCircle2 className="w-3 h-3" /> Activé
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded text-xs">
                            <XCircle className="w-3 h-3" /> Désactivé
                          </span>
                        )
                      ) : (
                        <span className="text-blue-400 font-medium capitalize text-xs bg-blue-500/10 px-2 py-1 rounded">
                          {log.newValue}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
