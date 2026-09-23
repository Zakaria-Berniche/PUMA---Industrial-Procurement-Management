import React from 'react';
import { useFormContext } from 'react-hook-form';
import { useStore } from '../../store/useStore';
import { InfoTooltip } from '../ui/InfoTooltip';

export function TaskGeneralInfo() {
  const { workflowTemplates } = useStore();
  const {
    register,
    formState: { errors }
  } = useFormContext();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-emerald-500 rounded-full" />
          <h3 className="text-lg font-bold text-slate-100">Définition de la Mission</h3>
        </div>
        
        <div className="space-y-6 bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center">
              Procédure Métier <span className="text-emerald-500 ml-1">*</span>
              <InfoTooltip 
                title="Choix de la Procédure"
                definition="Définit le flux d'étapes (workflow) que la tâche suivra automatiquement."
                impact="Une procédure adaptée garantit que les bons départements sont sollicités au bon moment."
              />
            </label>
            <select
              {...register('objectiveType')}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all appearance-none cursor-pointer"
            >
              {workflowTemplates.map((t) => (
                <option key={t.id} value={t.type}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center">
              Titre de l'Opération <span className="text-emerald-500 ml-1">*</span>
              <InfoTooltip 
                title="Titre Clair"
                definition="Un intitulé court qui décrit l'action principale."
                impact="Facilite la recherche et le suivi dans le dashboard global."
              />
            </label>
            <input
              {...register('title')}
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-700"
              placeholder="Ex: Optimisation du stock de sécurité PUMA..."
            />
            {errors.title && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.title.message as string}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center">
              Description Détaillée <span className="text-emerald-500 ml-1">*</span>
              <InfoTooltip 
                title="Détails Techniques"
                definition="Précisez les besoins, les références pièces ou les attentes spécifiques."
                impact="Réduit les allers-retours et les erreurs de traitement."
              />
            </label>
            <textarea
              {...register('description')}
              rows={4}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all placeholder:text-slate-700 resize-none"
              placeholder="Décrivez les résultats attendus et les contraintes techniques..."
            />
            {errors.description && <p className="text-red-400 text-[10px] font-bold mt-1 ml-1">{errors.description.message as string}</p>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-blue-500 rounded-full" />
          <h3 className="text-lg font-bold text-slate-100">Chronologie Industrielle</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-6 bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center">
              Date d'Ouverture
              <InfoTooltip 
                title="Lancement"
                definition="Date à laquelle la première étape du workflow doit commencer."
                impact="Sert de base de calcul pour la santé du flux."
              />
            </label>
            <input
              {...register('startDate')}
              type="date"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center">
              Deadline Impérative
              <InfoTooltip 
                title="Échéance Finale"
                definition="Date limite pour la clôture totale de l'opération."
                impact="Si dépassée, l'opération passe en 'Retard' et génère une alerte critique."
              />
            </label>
            <input
              {...register('dueDate')}
              type="date"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-red-500/30 transition-all"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
