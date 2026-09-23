import React, { useState } from 'react';
import { X } from 'lucide-react';
import { User, PermissionAction } from '../types';
import { useStore } from '../store/useStore';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
}

const AVAILABLE_MODULES = [
  { id: 'modules.dashboard', label: 'Tableau de Bord', description: 'Vue d\'ensemble des KPI et statuts' },
  { id: 'modules.kanban', label: 'Tableau Kanban', description: 'Planification visuelle des tâches par étapes' },
  { id: 'modules.tasks', label: 'Mes Opérations', description: 'Liste tabulaire complète et filtres avancés' },
  { id: 'modules.calendar', label: 'Calendrier', description: 'Planification et jalons temporels' },
  { id: 'modules.procurement', label: 'Sourcing IA', description: 'Recherche intelligente de fournisseurs' },
  { id: 'modules.analysis', label: 'Analyse & Comparaison', description: 'Matrice de notation des offres' },
  { id: 'modules.admin', label: 'Administration', description: 'Configuration globale de la plateforme (Admin uniquement)' }
];

export function UserModal({ isOpen, onClose, user }: UserModalProps) {
  const { addUser, updateUser, sites } = useStore();

  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'Collaborateur',
    department: '',
    siteId: '',
    siteIds: [],
    avatar: '',
    allowedModules: []
  });

  const [prevUser, setPrevUser] = useState<User | null | undefined>(undefined);

  if (user !== prevUser) {
    setPrevUser(user);
    if (user) {
      setFormData({
        ...user,
        allowedModules: user.allowedModules || (user.role === 'Admin'
          ? ['modules.dashboard', 'modules.kanban', 'modules.tasks', 'modules.calendar', 'modules.analysis', 'modules.procurement', 'modules.admin']
          : ['modules.dashboard', 'modules.kanban', 'modules.tasks', 'modules.calendar', 'modules.analysis', 'modules.procurement'])
      });
    } else {
      setFormData({
        name: '',
        email: '',
        role: 'Collaborateur',
        department: '',
        siteId: '',
        siteIds: [],
        avatar: '',
        allowedModules: ['modules.dashboard', 'modules.kanban', 'modules.tasks', 'modules.calendar', 'modules.analysis', 'modules.procurement']
      });
    }
  }

  if (!isOpen) return null;

  const handleRoleChange = (newRole: User['role']) => {
    const defaultModules: PermissionAction[] = [
      'modules.dashboard',
      'modules.kanban',
      'modules.tasks',
      'modules.calendar',
      'modules.analysis',
      'modules.procurement'
    ];
    if (newRole === 'Admin') {
      defaultModules.push('modules.admin');
    }
    setFormData({
      ...formData,
      role: newRole,
      allowedModules: defaultModules
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const resolvedModules = formData.allowedModules || (formData.role === 'Admin'
      ? ['modules.dashboard', 'modules.kanban', 'modules.tasks', 'modules.calendar', 'modules.analysis', 'modules.procurement', 'modules.admin']
      : ['modules.dashboard', 'modules.kanban', 'modules.tasks', 'modules.calendar', 'modules.analysis', 'modules.procurement']);

    // Ensure we do not save admin module for non-admin users
    const filteredModules = resolvedModules.filter(m => m !== 'modules.admin' || formData.role === 'Admin');

    const finalData = {
      ...formData,
      allowedModules: filteredModules
    };

    if (user) {
      updateUser({ ...user, ...finalData } as User);
    } else {
      addUser({
        ...finalData,
        id: `u${Date.now()}`,
        avatar: formData.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(formData.name || 'Puma')}`
      } as User);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950/50 shrink-0">
          <h2 className="text-lg font-semibold text-slate-50">
            {user ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </h2>
          <button onClick={onClose} title="Fermer" className="text-slate-400 hover:text-slate-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Nom complet</label>
            <input
              type="text"
              required
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="Jean Dupont"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              required
              value={formData.email || ''}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              placeholder="jean.dupont@puma.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Rôle</label>
              <select
                title="Rôle de l'utilisateur"
                value={formData.role || 'Collaborateur'}
                onChange={(e) => handleRoleChange(e.target.value as User['role'])}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                <option value="Collaborateur">Collaborateur</option>
                <option value="Responsable Local">Responsable Local</option>
                <option value="Responsable Global">Responsable Global</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Département</label>
              <input
                type="text"
                required
                value={formData.department || ''}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-sm text-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                placeholder="Ex: IT, Achat..."
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Périmètre des Sites (Multi-Site)</label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-36 overflow-y-auto space-y-2 custom-scrollbar">
              {sites.map((site) => (
                <label key={site.id} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={formData.siteIds?.includes(site.id) || false}
                    onChange={(e) => {
                      const currentIds = formData.siteIds || [];
                      const newIds = e.target.checked 
                        ? [...currentIds, site.id]
                        : currentIds.filter(id => id !== site.id);
                      setFormData({ 
                        ...formData, 
                        siteIds: newIds,
                        siteId: formData.siteId || newIds[0] || ''
                      });
                    }}
                    className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/50 bg-slate-900"
                  />
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 transition-colors">{site.name}</span>
                </label>
              ))}
              {sites.length === 0 && (
                <p className="text-[10px] text-slate-600 italic">Aucun site configuré</p>
              )}
            </div>
            {formData.siteIds && formData.siteIds.length > 0 && (
              <div className="mt-2 space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Site Actif par Défaut</label>
                <select
                  title="Site actif par défaut"
                  value={formData.siteId || ''}
                  onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-2 text-xs text-slate-300 focus:outline-none"
                >
                  {sites.filter(s => formData.siteIds?.includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-300">Accès aux Modules</label>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 max-h-48 overflow-y-auto space-y-3 custom-scrollbar">
              {AVAILABLE_MODULES.map((mod) => {
                const isChecked = formData.allowedModules 
                  ? formData.allowedModules.includes(mod.id as PermissionAction)
                  : true;

                // Only allow modules.admin if user role is Admin
                const isDisabled = mod.id === 'modules.admin' && formData.role !== 'Admin';

                return (
                  <label key={mod.id} className={`flex items-start gap-3 cursor-pointer group ${isDisabled ? 'opacity-40 cursor-not-allowed' : ''}`}>
                    <input
                      type="checkbox"
                      checked={isChecked && !isDisabled}
                      disabled={isDisabled}
                      onChange={(e) => {
                        const currentModules = formData.allowedModules || [];
                        let newModules: PermissionAction[];
                        if (e.target.checked) {
                          newModules = [...currentModules, mod.id as PermissionAction];
                        } else {
                          newModules = currentModules.filter(m => m !== mod.id);
                        }
                        setFormData({ ...formData, allowedModules: newModules });
                      }}
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500/50 bg-slate-900"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">{mod.label}</span>
                      <span className="text-[10px] text-slate-500 leading-normal">{mod.description}</span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-medium bg-emerald-500 hover:bg-emerald-600 text-slate-50 rounded-md transition-colors shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              {user ? 'Enregistrer' : "Créer l'utilisateur"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
