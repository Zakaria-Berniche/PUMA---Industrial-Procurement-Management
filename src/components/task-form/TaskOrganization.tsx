import React from 'react';
import { useFormContext } from 'react-hook-form';
import { Site, User, WorkflowTemplate } from '../../types';

interface TaskOrganizationProps {
  sites: Site[];
  users: User[];
  workflowTemplates: WorkflowTemplate[];
}

export function TaskOrganization({ sites, users }: TaskOrganizationProps) {
  const {
    register
  } = useFormContext();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h3 className="text-lg font-bold text-slate-100">Responsabilités & Lieu</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-6 bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Donneur d'ordre</label>
            <select
              {...register('managerId')}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
            >
              {(users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Porteur du projet</label>
            <select
              {...register('assigneeId')}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
            >
              {(users || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Site d'Exécution</label>
            <select
              {...register('siteId')}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all appearance-none cursor-pointer"
            >
              {(sites || []).map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Département</label>
            <input
              {...register('department')}
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-slate-700"
              placeholder="Ex: Achat, Maintenance..."
            />
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-amber-500 rounded-full" />
          <h3 className="text-lg font-bold text-slate-100">Niveau de Priorité</h3>
        </div>
        
        <div className="bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
          <select
            {...register('priority')}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 focus:ring-1 focus:ring-amber-500/50 transition-all appearance-none cursor-pointer"
          >
            <option value="Faible">Faible (Amélioration)</option>
            <option value="Normale">Normale (Standard)</option>
            <option value="Haute">Haute (Critique métier)</option>
            <option value="Urgent">Urgent (Arrêt usine / Sécurité)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
