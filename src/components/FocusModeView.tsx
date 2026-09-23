import { X, Play, CheckCircle2, AlertTriangle, ChevronRight, Zap } from 'lucide-react';
import { Objective, ObjectiveStatus, StepStatus } from '../types';
import { useStore } from '../store/useStore';
import { Badge } from './ui/badge';
import { getDomainColor } from '../lib/utils';
import { motion } from 'framer-motion';
import { InfoTooltip } from './ui/InfoTooltip';

interface FocusModeViewProps {
  task: Objective;
  onClose: () => void;
}

export function FocusModeView({ task, onClose }: FocusModeViewProps) {
  const { updateObjectiveStatus, updateWorkflowStep } = useStore();

  const handleStatusChange = (newStatus: ObjectiveStatus) => {
    updateObjectiveStatus(task.id, newStatus);
    if (newStatus === 'Terminé') {
      onClose();
    }
  };

  const progress = task.workflow && task.workflow.length > 0
    ? Math.round((task.workflow.filter(s => s.status === 'Validé').length / task.workflow.length) * 100)
    : 0;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8"
    >
      {/* Background Decor */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-emerald-500/5 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
      </div>

      <div className="w-full max-w-4xl flex flex-col h-full relative z-10">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center">
                Mode Focus Actif
                <InfoTooltip 
                  title="Immersion Totale"
                  definition="Interface simplifiée pour se concentrer sur l'exécution d'une seule mission."
                  impact="Réduit les distractions et permet une exécution plus rapide."
                />
              </p>
              <h2 className="text-sm font-bold text-slate-300">#{task.id.toUpperCase()}</h2>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-50 transition-all hover:border-slate-700"
            title="Quitter le mode focus"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Main Content Card */}
        <div className="flex-1 bg-slate-900/50 border border-slate-800 rounded-[2.5rem] p-8 sm:p-12 shadow-2xl flex flex-col overflow-hidden">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <Badge variant="outline" className="bg-slate-950 border-slate-800 text-slate-500 uppercase tracking-widest text-[10px]">
                {task.type}
              </Badge>
              <Badge className={`${
                task.priority === 'Urgent' ? 'bg-red-500/20 text-red-500 border-red-500/30' :
                task.priority === 'Haute' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                'bg-blue-500/20 text-blue-500 border-blue-500/30'
              } text-[10px] font-black uppercase tracking-widest`}>
                {task.priority}
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-slate-50 leading-tight mb-4">
              {task.title}
            </h1>
            <p className="text-lg text-slate-400 leading-relaxed max-w-2xl">
              {task.description || "Aucune description détaillée."}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-end mb-3">
              <span className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center">
                Progression Globale
                <InfoTooltip 
                  title="Avancement"
                  definition="Ratio d'étapes validées par rapport au total prévu."
                  impact="Indique visuellement si l'opération est proche de la clôture."
                />
              </span>
              <span className="text-2xl font-black text-emerald-500">{progress}%</span>
            </div>
            <div className="h-4 bg-slate-950 rounded-full overflow-hidden p-1 border border-slate-800">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"
              />
            </div>
          </div>

          {/* Checklist Area */}
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 -mr-4 mb-8">
            <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Étapes à réaliser
            </h3>
            <div className="space-y-4">
              {task.workflow && task.workflow.map((step) => (
                <div 
                  key={step.id}
                  onClick={() => {
                    const nextStatus = step.status === 'Validé' ? 'En traitement' : 'Validé';
                    updateWorkflowStep(task.id, step.id, { 
                      status: nextStatus as StepStatus,
                      completedAt: nextStatus === 'Validé' ? new Date().toISOString() : undefined
                    });
                  }}
                  className={`group p-6 rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-6 ${
                    step.status === 'Validé' 
                      ? 'bg-emerald-500/5 border-emerald-500/20 opacity-60' 
                      : 'bg-slate-950 border-slate-800 hover:border-emerald-500/50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl border-2 flex items-center justify-center transition-all ${
                    step.status === 'Validé' 
                      ? 'bg-emerald-500 border-emerald-500 text-slate-950' 
                      : 'border-slate-700 group-hover:border-emerald-500/50'
                  }`}>
                    {step.status === 'Validé' && <CheckCircle2 className="w-5 h-5 stroke-[3]" />}
                  </div>
                  <div className="flex-1">
                    <h4 className={`text-lg font-bold transition-all ${step.status === 'Validé' ? 'text-slate-500 line-through' : 'text-slate-100'}`}>
                      {step.title}
                    </h4>
                    {step.type && (
                      <>
                        {step.customType && (
                          <style>{`
                            .dynamic-text-${step.id} {
                              color: ${getDomainColor(step.customType).base} !important;
                            }
                          `}</style>
                        )}
                        <span className={`text-[10px] text-slate-600 font-bold uppercase tracking-widest dynamic-text-${step.id}`}>
                          {step.customType || step.type}
                        </span>
                      </>
                    )}
                  </div>
                  <ChevronRight className={`w-6 h-6 transition-all ${step.status === 'Validé' ? 'text-slate-800' : 'text-slate-700 group-hover:text-emerald-500'}`} />
                </div>
              ))}
              {(!task.workflow || task.workflow.length === 0) && (
                <div className="p-12 text-center border-2 border-dashed border-slate-800 rounded-[2.5rem]">
                  <p className="text-slate-500 italic">Aucune étape spécifique définie pour cette opération.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons Overlay */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {task.status !== 'En cours' ? (
            <button 
              onClick={() => handleStatusChange('En cours')}
              className="sm:col-span-2 group h-24 bg-blue-600 hover:bg-blue-500 text-white rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-[0_0_40px_rgba(37,99,235,0.2)]"
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-6 h-6 fill-current" />
              </div>
              <span className="text-2xl font-black uppercase tracking-widest">Démarrer l'opération</span>
            </button>
          ) : (
            <button 
              onClick={() => handleStatusChange('Terminé')}
              className="sm:col-span-2 group h-24 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center gap-4 transition-all shadow-[0_0_40px_rgba(16,185,129,0.2)]"
            >
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-6 h-6 stroke-[3]" />
              </div>
              <span className="text-2xl font-black uppercase tracking-widest">Terminer l'opération</span>
            </button>
          )}

          <button 
            onClick={() => {
              const reason = window.prompt("Quel est le problème ?");
              if (reason) handleStatusChange('Bloqué');
            }}
            className="group h-24 bg-slate-900 border-2 border-slate-800 hover:border-red-500/50 text-slate-400 hover:text-red-500 rounded-[2rem] flex flex-col items-center justify-center gap-1 transition-all"
          >
            <AlertTriangle className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-widest">Signaler un blocage</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

