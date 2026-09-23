import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  X,
  Calendar,
  Clock,
  FileText,
  History,
  Paperclip,
  Activity,
  UserCheck,
  Upload,
  LayoutGrid,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Lock,
  BarChart3,
  MessageSquare,
  ThumbsUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { ObjectiveAttachment } from '../types';
import { generateObjectivePDF } from '../lib/pdfGenerator';
import { GanttChart } from './GanttChart';
import { InfoTooltip } from './ui/InfoTooltip';
import { getDomainColor } from '../lib/utils';

interface TaskDetailsModalProps {
  taskId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

type TabType = 'overview' | 'audit' | 'binder' | 'timeline';

export function TaskDetailsModal({ taskId, isOpen, onClose }: TaskDetailsModalProps) {
  const navigate = useNavigate();
  const { 
    objectives, 
    sites, 
    users, 
    currentUser, 
    addAttachment, 
    addComment,
    toggleMicroStep,
    cancelObjective,
    deleteObjective,
    reportConfig,
    companyInfo
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [uploadingStepId, setUploadingStepId] = useState<string | null>(null);
  const [lastActionedStepId, setLastActionedStepId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const objective = (objectives || []).find((o) => o.id === taskId);
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(
    objective?.blocks?.find(b => b.status === 'Active' || b.status === 'Partial')?.id || 
    (objective?.blocks?.[0]?.id || null)
  );

  if (!isOpen || !taskId || !objective) return null;

  const isManager = currentUser?.role === 'Admin' || currentUser?.role === 'Responsable Global' || currentUser?.role === 'Responsable Local';
  const isAdmin = currentUser?.role === 'Admin';

  const site = (sites || []).find((s) => s.id === objective.siteId);
  const assignee = (users || []).find((u) => u.id === objective.assigneeId);
  const manager = (users || []).find((u) => u.id === objective.managerId);

  const allTasksFlattened = (objective.blocks || []).flatMap(b => b.tasks);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'destructive';
      case 'Haute': return 'warning';
      case 'Normale': return 'secondary';
      default: return 'outline';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newAttachment: Omit<ObjectiveAttachment, 'id'> = {
      name: file.name,
      url: '#',
      type: file.type.split('/')[1]?.toUpperCase() || 'FILE',
      uploadedBy: currentUser?.name || 'Inconnu',
      uploadedAt: new Date().toISOString(),
      size: file.size,
      stepId: uploadingStepId || undefined
    };

    addAttachment(objective.id, newAttachment);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-6xl h-[85vh] shadow-2xl flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
        {/* Header Section */}
        <div className="shrink-0 p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div className="flex items-center gap-6">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-2 ${
              objective.healthStatus === 'Critique' ? 'border-red-500/50 bg-red-500/10' :
              objective.healthStatus === 'Attention' ? 'border-amber-500/50 bg-amber-500/10' : 'border-emerald-500/50 bg-emerald-500/10'
            }`}>
              <Activity className={`w-7 h-7 ${
                objective.healthStatus === 'Critique' ? 'text-red-500' :
                objective.healthStatus === 'Attention' ? 'text-amber-500' : 'text-emerald-500'
              }`} />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  #{objective.id.toUpperCase()}
                </span>
                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-wider bg-slate-900 border-slate-800 text-slate-400">
                  {objective.type}
                </Badge>
                <Badge variant={objective.status === 'Terminé' ? 'success' : objective.status === 'Bloqué' ? 'destructive' : 'default'}>
                  {objective.status}
                </Badge>
                <Badge variant={getPriorityColor(objective.priority)} className="border-slate-700">
                  {objective.priority}
                </Badge>
              </div>
              <h2 className="text-xl font-bold text-slate-50">{objective.title}</h2>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex flex-col items-end mr-4">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center">
                Score de Risque
                <InfoTooltip 
                  title="Probabilité de Retard"
                  definition="Calculé par l'IA en fonction de l'historique et de la complexité."
                  impact="Un score élevé nécessite une surveillance accrue du manager."
                />
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-black ${
                  objective.riskScore > 70 ? 'text-red-500' :
                  objective.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'
                }`}>{objective.riskScore}%</span>
                <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    className={`h-full transition-all ${
                      objective.riskScore > 70 ? 'bg-red-500' :
                      objective.riskScore > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    animate={{ width: `${objective.riskScore}%` }}
                    transition={{ duration: 1 }}
                  />
                </div>
              </div>
            </div>
            <button title="Fermer" onClick={onClose} className="text-slate-400 hover:text-slate-50 transition-colors p-2 hover:bg-slate-800 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <div className="flex bg-slate-950/20 px-6 border-b border-slate-800 shrink-0">
          {[
            { id: 'overview', label: "Plan d'Action", icon: LayoutGrid },
            { id: 'audit', label: "Audit Trail", icon: History },
            { id: 'binder', label: "Classeur (Binder)", icon: Paperclip },
            { id: 'timeline', label: "Gantt", icon: Calendar }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex items-center gap-2 px-6 py-4 text-xs font-black uppercase tracking-widest transition-all relative ${
                activeTab === tab.id ? 'text-emerald-500 bg-slate-900' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/20">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 h-full divide-x divide-slate-800">
              {/* Vertical Timeline */}
              <div className="lg:col-span-2 p-8 space-y-8">
                <section>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Traitement par blocs (Focus)
                    </h3>
                  </div>
                  
                  <div className="relative pl-8">
                    <div className="absolute left-[15px] top-4 bottom-4 w-0.5 bg-slate-800" />
                    <motion.div 
                      className="absolute left-[15px] top-4 w-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]"
                      animate={{ height: `${Math.round((objective.workflow.filter(t => t.status === 'Validé').length / (objective.workflow.length || 1)) * 100)}%` }}
                      transition={{ duration: 1 }}
                    />

                    {(objective.blocks || []).map((block, blockIdx) => {
                      const isExpanded = expandedBlockId === block.id;
                      const completedTasks = block.tasks.filter(t => t.status === 'Validé').length;
                      const totalTasks = block.tasks.length;
                      const isBlockCompleted = completedTasks === totalTasks;
                      
                      const isBlockLocked = blockIdx > 0 && 
                        objective.blocks![blockIdx - 1].tasks.some(t => t.status !== 'Validé');

                      return (
                        <div key={block.id} className={`mb-6 last:mb-0 transition-all duration-500 ${isBlockLocked ? 'opacity-60' : 'opacity-100'}`}>
                          {/* Block Header */}
                          <div 
                            onClick={() => setExpandedBlockId(isExpanded ? null : block.id)}
                            className={`flex items-center gap-4 mb-4 sticky top-0 z-20 py-3 px-4 rounded-2xl cursor-pointer transition-all border ${
                              isBlockLocked ? 'bg-slate-900/40 border-slate-800/50' :
                              isExpanded ? 'bg-slate-900 border-slate-700 shadow-lg' : 
                              isBlockCompleted ? 'bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20' :
                              'bg-slate-900/40 border-slate-800/50 hover:bg-slate-800/40'
                            }`}
                          >
                            <div className={`relative z-10 w-7 h-7 rounded-lg flex items-center justify-center font-black text-[10px] ${
                              isBlockCompleted ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(16,185,129,0.4)]' :
                              isBlockLocked ? 'bg-slate-800 text-slate-600' :
                              'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)]'
                            }`}>
                              {isBlockCompleted ? <CheckCircle2 className="w-4 h-4" /> : 
                               isBlockLocked ? <Lock className="w-3 h-3" /> : blockIdx + 1}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className={`text-xs font-black uppercase tracking-[0.15em] ${
                                  isBlockCompleted ? 'text-emerald-400' :
                                  isBlockLocked ? 'text-slate-600' :
                                  isExpanded ? 'text-slate-100' : 'text-slate-500'
                                }`}>
                                  {block.title}
                                </h4>
                                {!isExpanded && (
                                  <div className="flex items-center gap-3">
                                    <span className={`text-[9px] font-black ${isBlockCompleted ? 'text-emerald-500/70' : 'text-slate-600'}`}>
                                      {completedTasks}/{totalTasks} Tâches
                                    </span>
                                    {isBlockLocked ? <Lock className="w-3 h-3 text-slate-700" /> : <ChevronRight className="w-3 h-3 text-slate-700" />}
                                  </div>
                                )}
                                {isExpanded && <ChevronDown className="w-4 h-4 text-slate-400" />}
                              </div>
                            </div>
                          </div>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div 
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden space-y-4 pl-4 border-l border-slate-800/50 ml-[13px]"
                              >
                                {block.tasks.map((step) => {
                                  const stepGlobalIdx = allTasksFlattened.findIndex(t => t.id === step.id);
                                  const isActive = objective.workflow.find(t => t.status !== 'Validé')?.id === step.id;
                                  const isDone = step.status === 'Validé';
                                  const isPendingValidation = step.status === 'Fait' || step.status === 'Bloqué';
                                  
                                  const isTaskLocked = stepGlobalIdx > 0 && allTasksFlattened[stepGlobalIdx - 1].status !== 'Validé';
                                  
                                  return (
                                    <div key={step.id} className={`relative group transition-all ${isTaskLocked ? 'opacity-50' : 'opacity-100'}`}>
                                      <div className={`absolute -left-[23px] top-5 w-3 h-3 rounded-full border-2 transition-all ${
                                        isDone ? 'bg-emerald-500 border-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' :
                                        isPendingValidation ? 'bg-amber-500 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.5)] animate-pulse' :
                                        isActive ? 'bg-blue-500 border-slate-900 animate-pulse shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 
                                        isTaskLocked ? 'bg-slate-950 border-slate-800' : 'bg-slate-900 border-slate-700'
                                      }`} />

                                      <div className={`bg-slate-950/20 border rounded-2xl p-4 transition-all ${
                                        isPendingValidation ? 'border-amber-500/50 bg-amber-500/5 shadow-[0_0_20px_rgba(245,158,11,0.1)]' :
                                        isActive ? 'border-blue-500/30 bg-blue-500/5' : 
                                        isDone ? 'border-emerald-500/10 bg-emerald-500/5' : 'border-slate-800/50'
                                      }`}>
                                        <div className="flex items-start justify-between gap-4">
                                          <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                              {step.customType && (
                                                <style>{`
                                                  .dynamic-badge-${step.id} {
                                                    color: ${getDomainColor(step.customType).base} !important;
                                                    border-color: ${getDomainColor(step.customType).base}40 !important;
                                                    background-color: ${getDomainColor(step.customType).base}0d !important;
                                                  }
                                                `}</style>
                                              )}
                                              <Badge 
                                                variant="outline" 
                                                className={`text-[8px] font-mono border-slate-800 text-slate-500 uppercase dynamic-badge-${step.id}`}
                                              >
                                                {step.customType || step.type}
                                              </Badge>
                                              {isActive && step.status !== 'Fait' && step.status !== 'Bloqué' && <Badge className="bg-blue-500/20 text-blue-400 text-[8px] animate-pulse uppercase font-black">Actif</Badge>}
                                              {step.status === 'Fait' && <Badge className="bg-amber-500/20 text-amber-400 text-[8px] animate-pulse uppercase font-black">En Revue</Badge>}
                                              {step.status === 'Bloqué' && <Badge className="bg-red-500/20 text-red-400 text-[8px] animate-pulse uppercase font-black">Bloqué</Badge>}
                                            </div>
                                            <h4 className={`text-sm font-bold leading-tight ${isDone ? 'text-slate-500' : isPendingValidation ? 'text-amber-100' : 'text-slate-100'}`}>{step.title}</h4>
                                          </div>

                                          <div className="flex items-center gap-2">
                                            {isDone ? (
                                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            ) : isTaskLocked ? (
                                              <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 text-slate-600">
                                                <Lock className="w-4 h-4" />
                                              </div>
                                            ) : (
                                              <div className="flex items-center gap-2">
                                                {(!isManager || step.status === 'Non démarré' || step.status === 'En traitement') && step.status !== 'Fait' && step.status !== 'Bloqué' && (
                                                  <div className="flex gap-1.5">
                                                    {step.type === 'Analyse' && (
                                                      <button 
                                                        onClick={() => {
                                                          onClose();
                                                          navigate(`/analysis?new=true&taskId=${objective.id}&stepId=${step.id}`);
                                                        }}
                                                        className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border border-blue-500/20 transition-all flex items-center gap-2"
                                                        title="Ouvrir la matrice de comparaison"
                                                      >
                                                        <BarChart3 className="w-3 h-3" /> Analyse & Comparaison
                                                      </button>
                                                    )}
                                                    <button 
                                                      onClick={() => {
                                                        useStore.getState().updateWorkflowStep(objective.id, step.id, { status: 'Fait' });
                                                        setLastActionedStepId(step.id);
                                                      }}
                                                      className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border border-emerald-500/20 transition-all flex items-center gap-2"
                                                    >
                                                      <ThumbsUp className="w-3 h-3" /> Fait
                                                    </button>
                                                    <button 
                                                      onClick={() => {
                                                        useStore.getState().updateWorkflowStep(objective.id, step.id, { status: 'Bloqué' });
                                                        setLastActionedStepId(step.id);
                                                      }}
                                                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 text-[10px] font-black uppercase px-3 py-1.5 rounded-xl border border-red-500/20 transition-all flex items-center gap-2"
                                                    >
                                                      <AlertCircle className="w-3 h-3" /> Bloqué
                                                    </button>
                                                  </div>
                                                )}

                                                {isManager && (step.status === 'Fait' || step.status === 'Bloqué') && (
                                                  <button 
                                                    onClick={() => useStore.getState().updateWorkflowStep(objective.id, step.id, { 
                                                      status: 'Validé',
                                                      completedAt: new Date().toISOString()
                                                    })}
                                                    className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2"
                                                  >
                                                    <CheckCircle className="w-3 h-3" /> Valider
                                                  </button>
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {/* Feedback / Action Required Section */}
                                        <AnimatePresence>
                                          {lastActionedStepId === step.id && (
                                            <motion.div 
                                              initial={{ opacity: 0, y: -10 }}
                                              animate={{ opacity: 1, y: 0 }}
                                              className="mt-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl"
                                            >
                                              <p className="text-[10px] font-bold text-blue-400 mb-2 uppercase flex items-center gap-2">
                                                <MessageSquare className="w-3 h-3" /> 
                                                {step.requireNote || step.requirePhoto ? 'Justificatifs Obligatoires' : 'Action enregistrée ! Ajouter un détail ?'}
                                              </p>
                                              <div className="flex gap-2">
                                                <button 
                                                  onClick={() => {
                                                    const note = window.prompt("Note :");
                                                    if (note) addComment(objective.id, note, step.id);
                                                    if (!step.requirePhoto) setLastActionedStepId(null);
                                                  }}
                                                  className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${
                                                    step.requireNote ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/10 hover:bg-blue-500/20'
                                                  }`}
                                                >
                                                  + Note {step.requireNote && '(Requis)'}
                                                </button>
                                                <button 
                                                  onClick={() => {
                                                    setUploadingStepId(step.id);
                                                    fileInputRef.current?.click();
                                                    if (!step.requireNote) setLastActionedStepId(null);
                                                  }}
                                                  className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-lg border transition-all ${
                                                    step.requirePhoto ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/10 hover:bg-emerald-500/20'
                                                  }`}
                                                >
                                                  + Photo {step.requirePhoto && '(Requis)'}
                                                </button>
                                                {!step.requireNote && !step.requirePhoto && (
                                                  <button 
                                                    onClick={() => setLastActionedStepId(null)}
                                                    className="text-slate-500 text-[9px] font-black uppercase px-3 py-1.5"
                                                  >
                                                    Passer
                                                  </button>
                                                )}
                                              </div>
                                            </motion.div>
                                          )}
                                        </AnimatePresence>

                                        {/* Manager Remark Field */}
                                        {isManager && (step.status === 'Fait' || step.status === 'Bloqué') && (
                                          <div className="mt-3">
                                            <div className="flex items-center gap-2 mb-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                              <MessageSquare className="w-3 h-3" /> Remarque Responsable
                                            </div>
                                            <textarea 
                                              placeholder="Ajouter une consigne ou un commentaire de revue..."
                                              className="w-full bg-slate-900 border-slate-800 rounded-xl p-3 text-xs text-slate-300 outline-none focus:border-blue-500/50 transition-all min-h-[60px]"
                                              onBlur={(e) => {
                                                if (e.target.value) {
                                                  addComment(objective.id, `[REMARQUE RESPONSABLE] ${e.target.value}`, step.id);
                                                  e.target.value = '';
                                                }
                                              }}
                                            />
                                          </div>
                                        )}

                                        {/* Micro-steps */}
                                        {(step.microSteps || []).length > 0 && (
                                          <div className={`mt-4 space-y-2 bg-slate-900/30 p-3 rounded-xl border border-slate-800/30 ${isTaskLocked ? 'pointer-events-none opacity-50' : ''}`}>
                                            {(step.microSteps || []).map((ms) => (
                                              <div 
                                                key={ms.id} 
                                                className={`flex items-center gap-3 ${isTaskLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                                                onClick={() => !isTaskLocked && toggleMicroStep(objective.id, step.id, ms.id)}
                                              >
                                                <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-all ${
                                                  ms.isCompleted ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
                                                }`}>
                                                  {ms.isCompleted && <X className="w-2.5 h-2.5 text-slate-950 stroke-[4]" />}
                                                </div>
                                                <span className={`text-[10px] font-bold ${ms.isCompleted ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{ms.title}</span>
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        {/* Footer Actions */}
                                        <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/30">
                                          <div className={`flex items-center gap-2 ${isTaskLocked ? 'pointer-events-none opacity-50' : ''}`}>
                                            <button 
                                              disabled={isTaskLocked}
                                              onClick={() => {
                                                const note = window.prompt("Note :");
                                                if (note) addComment(objective.id, note, step.id);
                                              }}
                                              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-blue-400 transition-colors disabled:cursor-not-allowed"
                                            >
                                              + Note
                                            </button>
                                            <button 
                                              disabled={isTaskLocked}
                                              onClick={() => {
                                                setUploadingStepId(step.id);
                                                fileInputRef.current?.click();
                                              }}
                                              className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-emerald-400 transition-colors disabled:cursor-not-allowed"
                                            >
                                              + Photo
                                            </button>
                                          </div>
                                          <div className="flex items-center gap-2">
                                            <Avatar className="w-5 h-5 border border-slate-800">
                                              <AvatarImage src={(users.find(u => u.id === step.assigneeId))?.avatar} />
                                              <AvatarFallback className="text-[8px]">?</AvatarFallback>
                                            </Avatar>
                                            <span className="text-[10px] font-bold text-slate-600 uppercase">{(users.find(u => u.id === step.assigneeId))?.name.split(' ')[0]}</span>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>

              {/* Sidebar Info */}
              <div className="p-8 bg-slate-950/20 space-y-8">
                <section className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <UserCheck className="w-3 h-3" /> Responsabilité
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-slate-800">
                        <Avatar className="w-8 h-8"><AvatarImage src={manager?.avatar} /></Avatar>
                        <div>
                          <p className="text-[9px] text-slate-500 uppercase font-black">Manager</p>
                          <p className="text-sm font-bold text-slate-100">{manager?.name}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-emerald-500/20">
                        <Avatar className="w-8 h-8"><AvatarImage src={assignee?.avatar} /></Avatar>
                        <div>
                          <p className="text-[9px] text-emerald-500 uppercase font-black">Responsable</p>
                          <p className="text-sm font-bold text-slate-100">{assignee?.name}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-800">
                    <h4 className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-4">Dates Clés</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase">Début</p>
                        <p className="text-xs font-bold text-slate-300">{format(new Date(objective.startDate), 'dd MMM yyyy')}</p>
                      </div>
                      <div>
                        <p className="text-[9px] text-slate-500 uppercase">Échéance</p>
                        <p className={`text-xs font-bold ${new Date(objective.dueDate) < new Date() ? 'text-red-500' : 'text-emerald-500'}`}>
                          {format(new Date(objective.dueDate), 'dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="p-8 space-y-4">
              <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
                <History className="w-4 h-4" /> Audit Trail
              </h3>
              {(objective.auditLog || []).map((log) => (
                <div key={log.id} className="flex gap-4 p-4 bg-slate-950/30 border border-slate-800 rounded-xl">
                  <Activity className="w-4 h-4 text-slate-500 mt-1" />
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-sm font-bold text-slate-100">{log.userName}</span>
                      <span className="text-[10px] text-slate-600 font-mono">{format(new Date(log.timestamp), 'dd/MM HH:mm')}</span>
                      <Badge variant="outline" className="text-[8px] uppercase">{log.action}</Badge>
                    </div>
                    <p className="text-xs text-slate-400">{log.details}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'binder' && (
            <div className="p-8">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-2">
                  <Paperclip className="w-4 h-4" /> Classeur (Binder)
                </h3>
                <div className="flex gap-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" title="Sélectionner un fichier" aria-label="Sélectionner un fichier" />
                  <button onClick={() => fileInputRef.current?.click()} className="bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Ajouter Fichier
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(objective.attachments || []).map((file) => (
                  <div key={file.id} className="bg-slate-950/50 border border-slate-800 p-4 rounded-2xl flex items-center gap-4 hover:border-emerald-500/30 transition-all cursor-pointer">
                    <div className="w-10 h-12 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-center text-slate-600">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-100 truncate">{file.name}</p>
                      <p className="text-[9px] text-slate-500 mt-1 uppercase font-black">{file.type} • {(file.size / 1024).toFixed(0)} KB</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="p-8 h-full">
              <GanttChart 
                blocks={objective.blocks} 
                startDate={objective.startDate} 
                dueDate={objective.dueDate} 
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => generateObjectivePDF(objective, site, assignee, manager, users, reportConfig, companyInfo)}
              className="px-6 py-2 text-[10px] font-black text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/5 transition-all uppercase tracking-widest"
            >
              Générer Rapport PDF
            </button>
            
            {isManager && objective.status !== 'Annulé' && objective.status !== 'Terminé' && (
              <button
                onClick={() => {
                  if (window.confirm("Annuler cette opération ?")) {
                    cancelObjective(objective.id);
                    onClose();
                  }
                }}
                className="px-6 py-2 text-[10px] font-black text-amber-500 border border-amber-500/20 rounded-xl hover:bg-amber-500/5 transition-all uppercase tracking-widest"
              >
                Annuler
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => {
                  if (window.confirm("Supprimer définitivement ?")) {
                    deleteObjective(objective.id);
                    onClose();
                  }
                }}
                className="px-6 py-2 text-[10px] font-black text-red-500 border border-red-500/20 rounded-xl hover:bg-red-500/5 transition-all uppercase tracking-widest"
              >
                Supprimer
              </button>
            )}
          </div>

          <button onClick={onClose} className="px-6 py-2 text-[10px] font-black text-slate-500 hover:text-slate-300 uppercase tracking-widest transition-all">
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
