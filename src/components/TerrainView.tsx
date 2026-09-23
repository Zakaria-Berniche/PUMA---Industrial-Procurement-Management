import React from 'react';
import { useStore } from '../store/useStore';
import { CheckCircle2, Clock, MessageSquare, AlertTriangle, ChevronRight } from 'lucide-react';
import { Badge } from './ui/badge';
import { format } from 'date-fns';

interface TerrainViewProps {
  onSelectTask: (id: string) => void;
}

export function TerrainView({ onSelectTask }: TerrainViewProps) {
  const { objectives, currentUser, toggleMicroStep } = useStore();

  const myTasks = objectives.filter(o => o.assigneeId === currentUser?.id && o.status !== 'Terminé');

  return (
    <div className="space-y-4 md:hidden">
      <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl mb-6">
        <h2 className="text-emerald-400 font-bold flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5" /> Mode Terrain Actif
        </h2>
        <p className="text-[10px] text-emerald-500/70 uppercase font-black mt-1">Focus sur vos opérations prioritaires</p>
      </div>

      <div className="grid gap-4">
        {myTasks.map(task => {
          const activeStep = task.workflow?.find(s => s.status === 'En traitement' || s.status === 'Bloqué' || s.status === 'Non démarré');
          
          return (
            <div 
              key={task.id} 
              className={`bg-slate-900 border rounded-2xl p-4 transition-all ${
                task.healthStatus === 'Critique' ? 'border-red-500/30 bg-red-500/5' : 'border-slate-800'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <Badge variant="outline" className="text-[8px] font-mono border-slate-800 text-slate-500 mb-1">
                    #{task.id.toUpperCase()}
                  </Badge>
                  <h3 className="text-sm font-bold text-slate-100">{task.title}</h3>
                </div>
                <Badge variant={task.priority === 'Urgent' ? 'destructive' : 'default'} className="text-[8px]">
                  {task.priority}
                </Badge>
              </div>

              {activeStep && (
                <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/50 mb-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Étape Actuelle</span>
                    {activeStep.status === 'Bloqué' && <AlertTriangle className="w-3 h-3 text-red-500" />}
                  </div>
                  <p className="text-xs font-bold text-slate-300 mb-2">{activeStep.title}</p>
                  
                  {/* Quick Micro-steps */}
                  <div className="space-y-2">
                    {activeStep.microSteps?.slice(0, 3).map(ms => (
                      <div 
                        key={ms.id} 
                        className="flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleMicroStep(task.id, activeStep.id, ms.id);
                        }}
                      >
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                          ms.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
                        }`}>
                          {ms.isCompleted && <CheckCircle2 className="w-3 h-3 text-slate-950" />}
                        </div>
                        <span className={`text-[10px] ${ms.isCompleted ? 'text-slate-600 line-through' : 'text-slate-400'}`}>
                          {ms.title}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/50">
                <div className="flex gap-4">
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                    <Clock className="w-3 h-3" /> {format(new Date(task.dueDate), 'dd/MM')}
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-slate-500 font-bold">
                    <MessageSquare className="w-3 h-3" /> {task.auditLog?.length || 0}
                  </div>
                </div>
                <button 
                  onClick={() => onSelectTask(task.id)}
                  className="text-[10px] font-black text-emerald-500 uppercase flex items-center gap-1"
                >
                  Détails complets <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          );
        })}

        {myTasks.length === 0 && (
          <div className="text-center py-12 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl">
            <CheckCircle2 className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-500 font-bold">Aucune opération en cours</p>
            <p className="text-[10px] text-slate-600 uppercase mt-1">Reposez-vous, tout est sous contrôle</p>
          </div>
        )}
      </div>
    </div>
  );
}
