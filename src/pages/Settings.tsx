import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Settings2, Users, Building2, Workflow, Shield, Bell, Brain, FileText, BarChart3 } from 'lucide-react';
import { CompanySettings } from '../components/settings/CompanySettings';
import { UsersSettings } from '../components/settings/UsersSettings';
import { SitesSettings } from '../components/settings/SitesSettings';
import { WorkflowSettings } from '../components/settings/WorkflowSettings';
import { NotificationsSettings } from '../components/settings/NotificationsSettings';
import { PermissionsSettings } from '../components/settings/PermissionsSettings';
import { OperationalUnitsSettings } from '../components/settings/OperationalUnitsSettings';
import { AISettings } from '../components/settings/AISettings';
import { ReportSettings } from '../components/settings/ReportSettings';
import { AnalysisSettingsComponent } from '../components/settings/AnalysisSettings';

export function Settings() {
  const { currentUser } = useStore();
  const [activeTab, setActiveTab] = useState('general');

  if (currentUser?.role !== 'Admin') {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-4 animate-in fade-in slide-in-from-bottom-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
          <Shield className="w-8 h-8 text-red-500" />
        </div>
        <h2 className="text-2xl font-bold text-slate-50">Accès Restreint</h2>
        <p className="text-slate-400 max-w-md">
          Vous n'avez pas les droits nécessaires pour accéder aux paramètres de la plateforme. Veuillez contacter un
          administrateur.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Paramètres</h1>
          <p className="text-slate-400 mt-1">Configuration globale de la plateforme Puma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('general')}
            title="Paramètres Généraux"
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'general' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-lg shadow-emerald-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'}`}
          >
            <Settings2 className="w-4 h-4" />
            Général
          </button>
          
          <button
            onClick={() => setActiveTab('ai')}
            title="Paramètres de l'Intelligence Artificielle"
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'ai' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-lg shadow-purple-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'}`}
          >
            <Brain className="w-4 h-4" />
            Intelligence Artificielle
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'reports' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'}`}
          >
            <FileText className="w-4 h-4" />
            Design Rapports
          </button>

          <button
            onClick={() => setActiveTab('analysis')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'analysis' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20 shadow-lg shadow-orange-500/5' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900 border border-transparent'}`}
          >
            <BarChart3 className="w-4 h-4" />
            Règles Analyses
          </button>

          <div className="py-2">
            <div className="h-px bg-slate-800 mx-4" />
          </div>

          <button
            onClick={() => setActiveTab('users')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'users' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
          >
            <Users className="w-4 h-4" />
            Utilisateurs & Rôles
          </button>
          <button
            onClick={() => setActiveTab('sites')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'sites' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
          >
            <Building2 className="w-4 h-4" />
            Sites & Départements
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'workflows' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
          >
            <Workflow className="w-4 h-4" />
            Modèles de Workflows
          </button>
          <button
            onClick={() => setActiveTab('operational-units')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'operational-units' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
          >
            <Settings2 className="w-4 h-4" />
            Unités Opérationnelles
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'notifications' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab('permissions')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-widest transition-all text-left ${activeTab === 'permissions' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900'}`}
          >
            <Shield className="w-4 h-4" />
            Rôles & Permissions
          </button>
        </div>

        <div className={`md:col-span-3 ${activeTab === 'analysis' ? 'space-y-0' : 'space-y-6'}`}>
          {activeTab === 'general' && <CompanySettings />}
          {activeTab === 'ai' && <AISettings />}
          {activeTab === 'reports' && <ReportSettings />}
          {activeTab === 'analysis' && <AnalysisSettingsComponent />}
          {activeTab === 'users' && <UsersSettings />}
          {activeTab === 'sites' && <SitesSettings />}
          {activeTab === 'workflows' && <WorkflowSettings />}
          {activeTab === 'notifications' && <NotificationsSettings />}
          {activeTab === 'permissions' && <PermissionsSettings />}
          {activeTab === 'operational-units' && <OperationalUnitsSettings />}
        </div>
      </div>
    </div>
  );
}
