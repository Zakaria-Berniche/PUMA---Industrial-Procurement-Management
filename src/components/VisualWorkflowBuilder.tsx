import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { getDomainColor } from '../lib/utils';
import { 
  WorkflowTemplate, 
  WorkflowTemplateStep, 
  FunctionalBlock, 
  ObjectiveType,
  Role
} from '../types';
import { 
  X, Trash2, ChevronRight, 
  AlertTriangle, ShieldCheck, 
  Clock, Zap, Layout, Settings,
  Search, Send, BarChart2, MessageSquare, 
  CheckCircle, FileText, Truck, Package,
  PlayCircle, Save, MousePointer2,
  ShieldAlert, PenTool, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { lintWorkflow } from '../utils/workflowLinter';

interface VisualWorkflowBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  templateToEdit?: WorkflowTemplate | null;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Search, Send, BarChart2, MessageSquare, 
  CheckCircle, FileText, Truck, Package,
  ShieldCheck, ShieldAlert, PenTool, Database
};

export function VisualWorkflowBuilder({ isOpen, onClose, templateToEdit }: VisualWorkflowBuilderProps) {
  const { functionalBlocks, addWorkflowTemplate, updateWorkflowTemplate } = useStore();
  
  const [name, setName] = useState(templateToEdit?.name || '');
  const [description, setDescription] = useState(templateToEdit?.description || '');
  const [type, setType] = useState<ObjectiveType>(templateToEdit?.type || 'Achat Standard');
  const [steps, setSteps] = useState<WorkflowTemplateStep[]>(templateToEdit?.steps || []);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [blockToConfigure, setBlockToConfigure] = useState<FunctionalBlock | null>(null);
  const [selectedTaskIndices, setSelectedTaskIndices] = useState<Set<number>>(new Set());

  // Analysis & Metrics
  const metrics = useMemo(() => {
    const totalSla = steps.reduce((acc, s) => acc + (s.slaHours || 0), 0);
    const validations = steps.filter(s => s.isValidationRequired).length;
    
    let complexity: 'Simple' | 'Moyen' | 'Complexe' = 'Simple';
    if (steps.length > 8 || validations > 3) complexity = 'Complexe';
    else if (steps.length > 4 || validations > 1) complexity = 'Moyen';

    // Linting
    const lintIssues = lintWorkflow({ 
      id: '', name, description, type, steps, complexity 
    });

    return { totalSla, validations, complexity, lintIssues };
  }, [steps, name, description, type]);

  const errorCount = metrics.lintIssues.filter(i => i.type === 'error').length;
  const warningCount = metrics.lintIssues.filter(i => i.type === 'warning').length;

  if (!isOpen) return null;

  const handleAddBlockClick = (block: FunctionalBlock) => {
    setBlockToConfigure(block);
    // Cocher tout par défaut
    setSelectedTaskIndices(new Set(block.defaultTasks.map((_, i) => i)));
  };

  const confirmAddBlock = () => {
    if (!blockToConfigure) return;

    const tasksToAdd = blockToConfigure.defaultTasks.filter((_, i) => selectedTaskIndices.has(i));
    
    const newSteps: WorkflowTemplateStep[] = tasksToAdd.map((task, idx) => ({
      id: `step_${Date.now()}_${idx}`,
      title: task.title || blockToConfigure.name,
      type: blockToConfigure.type,
      isValidationRequired: task.isValidationRequired || false,
      isMandatory: task.isMandatory || true,
      slaHours: task.slaHours || 24,
      order: steps.length + idx + 1,
      microSteps: []
    }));
    
    setSteps([...steps, ...newSteps]);
    setBlockToConfigure(null);
    setSelectedTaskIndices(new Set());
  };

  const handleRemoveStep = (id: string) => {
    setSteps(steps.filter(s => s.id !== id).map((s, i) => ({ ...s, order: i + 1 })));
    if (selectedStepId === id) setSelectedStepId(null);
  };

  const handleSave = () => {
    const template: WorkflowTemplate = {
      id: templateToEdit?.id || `wt_${Date.now()}`,
      name,
      description,
      type,
      steps,
      complexity: metrics.complexity,
      estimatedTotalSlaHours: metrics.totalSla,
      updatedAt: new Date().toISOString(),
      version: (templateToEdit?.version || 0) + 1
    };

    if (templateToEdit) updateWorkflowTemplate(template);
    else addWorkflowTemplate(template);
    
    onClose();
  };

  const selectedStep = steps.find(s => s.id === selectedStepId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-4 md:p-8 animate-in fade-in duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full h-full max-w-[1600px] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <header className="flex items-center justify-between px-8 py-6 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Layout className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-xl font-black text-slate-50 tracking-tight">Visual Workflow Builder</h1>
              <p className="text-xs text-slate-500 font-medium">Plateforme de pilotage des processus achats multi-sites</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Linter Badge in Header */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all ${errorCount > 0 ? 'bg-red-500/10 border-red-500/50' : warningCount > 0 ? 'bg-amber-500/10 border-amber-500/50' : 'bg-emerald-500/10 border-emerald-500/50'}`}>
               <ShieldCheck className={`w-4 h-4 ${errorCount > 0 ? 'text-red-400' : warningCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`} />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">
                 {errorCount > 0 ? `${errorCount} Erreurs` : warningCount > 0 ? `${warningCount} Alertes` : 'Conforme'}
               </span>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl">
              <Badge variant={metrics.complexity === 'Simple' ? 'success' : metrics.complexity === 'Moyen' ? 'warning' : 'destructive'} className="text-[10px]">
                {metrics.complexity}
              </Badge>
              <div className="h-4 w-px bg-slate-800 mx-2" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-400">
                <Clock className="w-3.5 h-3.5" />
                {metrics.totalSla}h SLA
              </div>
            </div>
            
            <button
              title="Fermer le builder"
              onClick={onClose}
              className="p-2 hover:bg-slate-800 rounded-full text-slate-500 hover:text-slate-200 transition-all"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          
          {/* Left Panel: Library */}
          <aside className="w-80 border-r border-slate-800 bg-slate-950/20 p-6 overflow-y-auto custom-scrollbar">
            <div className="mb-6">
              <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                <Zap className="w-3 h-3" /> Bibliothèque de Blocs
              </h2>
              <div className="space-y-3">
                {functionalBlocks.map(block => {
                  const Icon = ICON_MAP[block.icon] || Layout;
                  return (
                    <motion.button
                      key={block.id}
                      title={`Ajouter le bloc ${block.name}`}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAddBlockClick(block)}
                      className="w-full group p-4 bg-slate-900/50 border border-slate-800 hover:border-emerald-500/50 rounded-2xl text-left transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-slate-950 rounded-lg group-hover:bg-emerald-500/10 transition-colors">
                          <Icon className="w-4 h-4 text-slate-400 group-hover:text-emerald-400" />
                        </div>
                        <span className="text-sm font-bold text-slate-200 group-hover:text-emerald-400">{block.name}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 leading-relaxed">{block.description}</p>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Central Panel: Canvas */}
          <main className="flex-1 bg-slate-950/40 p-8 overflow-y-auto custom-scrollbar relative">
            <div className="max-w-4xl mx-auto space-y-8 pb-20">
              
              {/* Workflow Info Section */}
              <div className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="wf-name" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Nom du Processus</label>
                    <input 
                      id="wf-name"
                      title="Nom du Workflow"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex: Achat CAPEX Industriel"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="wf-type" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Type d'Achat</label>
                    <select
                      id="wf-type"
                      title="Type d'Opération"
                      value={type}
                      onChange={(e) => setType(e.target.value as ObjectiveType)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                    >
                      <option value="Achat Standard">Achat Standard</option>
                      <option value="Achat Urgent">Achat Urgent</option>
                      <option value="Achat Stratégique">Achat Stratégique</option>
                      <option value="Achat Projet">Achat Projet</option>
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label htmlFor="wf-desc" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Description Stratégique</label>
                  <textarea 
                    id="wf-desc"
                    title="Description du Workflow"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                    placeholder="Quels sont les enjeux de ce processus ?"
                  />
                </div>
              </div>

              {/* Steps Visual Chain */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-6">
                  <PlayCircle className="w-5 h-5 text-emerald-500" />
                  <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Séquence Opérationnelle</span>
                </div>
                
                <AnimatePresence mode="popLayout">
                  {steps.map((step, idx) => (
                    <motion.div
                      key={step.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className={`group relative flex items-center gap-6 p-6 bg-slate-900 border ${selectedStepId === step.id ? 'border-emerald-500 ring-4 ring-emerald-500/10' : 'border-slate-800'} rounded-3xl cursor-pointer hover:bg-slate-800/50 transition-all`}
                      onClick={() => setSelectedStepId(step.id)}
                    >
                      <div className="flex flex-col items-center">
                         <div className="w-10 h-10 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center text-sm font-black text-slate-500 group-hover:text-emerald-400 group-hover:border-emerald-500/50 transition-all">
                           {idx + 1}
                         </div>
                         {idx < steps.length - 1 && (
                           <div className="w-0.5 h-12 bg-slate-800 my-2" />
                         )}
                      </div>
                      
                      <div className="flex-1 flex items-center justify-between">
                        <div>
                          <h3 className="text-sm font-black text-slate-100 mb-1">{step.title}</h3>
                          <div className="flex items-center gap-3">
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
                              className={`text-[8px] bg-slate-950 border-slate-800 text-slate-400 uppercase dynamic-badge-${step.id}`}
                            >
                              {step.customType || step.type}
                            </Badge>
                            <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {step.slaHours}h
                            </span>
                            {step.isValidationRequired && (
                              <Badge className="bg-blue-500/10 text-blue-400 text-[8px] border-blue-500/20">VALIDATION</Badge>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            title="Supprimer cette étape"
                            onClick={(e) => { e.stopPropagation(); handleRemoveStep(step.id); }}
                            className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <ChevronRight className="w-5 h-5 text-slate-700" />
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {steps.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-3xl">
                    <MousePointer2 className="w-10 h-10 text-slate-700 mb-4 animate-bounce" />
                    <p className="text-sm text-slate-500 font-bold">Glissez ou cliquez sur un bloc pour commencer</p>
                  </div>
                )}
              </div>
            </div>

            {/* Smart Injector Overlay */}
             <AnimatePresence>
               {blockToConfigure && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.95 }}
                   className="absolute inset-0 z-40 flex items-center justify-center p-8 bg-slate-950/60 backdrop-blur-md"
                 >
                   <div className="bg-slate-900 border border-slate-800 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col">
                     <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                       <div className="flex items-center gap-4">
                         <div className="p-3 bg-emerald-500/10 rounded-2xl">
                           {React.createElement(ICON_MAP[blockToConfigure.icon] || Layout, { className: "w-6 h-6 text-emerald-400" })}
                         </div>
                         <div>
                           <h3 className="text-xl font-black text-slate-50 uppercase tracking-tight">Injection : {blockToConfigure.name}</h3>
                           <p className="text-xs text-slate-500 font-medium italic">Sélectionnez les tâches à inclure dans votre workflow</p>
                         </div>
                       </div>
                       <button 
                         title="Fermer"
                         onClick={() => setBlockToConfigure(null)}
                         className="p-2 hover:bg-slate-800 rounded-full text-slate-500"
                       >
                         <X className="w-5 h-5" />
                       </button>
                     </div>

                     <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scrollbar max-h-[50vh]">
                       {blockToConfigure.defaultTasks.map((task, idx) => (
                         <div 
                           key={idx}
                           onClick={() => {
                             const newIndices = new Set(selectedTaskIndices);
                             if (newIndices.has(idx)) newIndices.delete(idx);
                             else newIndices.add(idx);
                             setSelectedTaskIndices(newIndices);
                           }}
                           className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                             selectedTaskIndices.has(idx) 
                               ? 'bg-emerald-500/5 border-emerald-500/30' 
                               : 'bg-slate-950/40 border-slate-800 opacity-60'
                           }`}
                         >
                           <div className="flex items-center gap-4">
                             <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-all ${
                               selectedTaskIndices.has(idx) ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700'
                             }`}>
                               {selectedTaskIndices.has(idx) && <CheckCircle className="w-3.5 h-3.5 text-slate-950" />}
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-200">{task.title}</p>
                               <div className="flex items-center gap-3 mt-1">
                                 <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1">
                                   <Clock className="w-3 h-3" /> {task.slaHours}h
                                 </span>
                                 {task.isValidationRequired && (
                                   <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Validation Requis</span>
                                 )}
                               </div>
                             </div>
                           </div>
                           {task.isMandatory && (
                             <Badge variant="outline" className="text-[8px] border-amber-500/30 text-amber-500 bg-amber-500/5">CRITIQUE</Badge>
                           )}
                         </div>
                       ))}
                     </div>

                     <div className="p-8 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between">
                       <div className="text-xs text-slate-500">
                         <span className="font-black text-slate-300">{selectedTaskIndices.size}</span> sur {blockToConfigure.defaultTasks.length} tâches sélectionnées
                       </div>
                       <div className="flex items-center gap-4">
                         <Button 
                           variant="ghost" 
                           onClick={() => setBlockToConfigure(null)}
                         >
                           ANNULER
                         </Button>
                         <Button 
                           variant="neon"
                           onClick={confirmAddBlock}
                           disabled={selectedTaskIndices.size === 0}
                           className="px-8 h-12"
                         >
                           INJECTER LA SÉLECTION
                         </Button>
                       </div>
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
           </main>

          {/* Right Panel: Inspector & Linter */}
          <aside className="w-96 border-l border-slate-800 bg-slate-950/20 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {selectedStep ? (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <Settings className="w-3 h-3" /> Paramètres du Bloc
                    </h2>
                    <button title="Désélectionner" onClick={() => setSelectedStepId(null)} className="text-[10px] text-slate-500 hover:text-slate-200">Désélectionner</button>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="step-title" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Titre de l'étape</label>
                      <input 
                        id="step-title"
                        title="Modifier le titre de l'étape"
                        type="text"
                        value={selectedStep.title}
                        onChange={(e) => setSteps(steps.map(s => s.id === selectedStep.id ? { ...s, title: e.target.value } : s))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label htmlFor="step-sla" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">SLA (Heures)</label>
                        <input 
                          id="step-sla"
                          title="Délai maximum en heures"
                          type="number"
                          value={selectedStep.slaHours}
                          onChange={(e) => setSteps(steps.map(s => s.id === selectedStep.id ? { ...s, slaHours: parseInt(e.target.value) } : s))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label htmlFor="step-role" className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Rôle Responsable</label>
                        <select
                          id="step-role"
                          title="Sélectionner le rôle responsable"
                          value={selectedStep.role}
                          onChange={(e) => setSteps(steps.map(s => s.id === selectedStep.id ? { ...s, role: e.target.value as Role } : s))}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 outline-none"
                        >
                          <option value="Collaborateur">Collaborateur</option>
                          <option value="Responsable Local">Responsable Local</option>
                          <option value="Responsable Global">Responsable Global</option>
                          <option value="Admin">Admin</option>
                        </select>
                      </div>
                    </div>

                    <div className="p-6 bg-slate-900 rounded-3xl border border-slate-800 space-y-4">
                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
                            <ShieldCheck className="w-4 h-4 text-blue-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-200">Validation Requise</span>
                            <span className="text-[8px] text-slate-500 uppercase font-bold">Approbation hiérarchique</span>
                          </div>
                        </div>
                        <input 
                          title="Requérir une validation pour cette étape"
                          type="checkbox"
                          checked={selectedStep.isValidationRequired}
                          onChange={(e) => setSteps(steps.map(s => s.id === selectedStep.id ? { ...s, isValidationRequired: e.target.checked } : s))}
                          className="w-5 h-5 accent-emerald-500 bg-slate-950 border-slate-800 rounded-lg"
                        />
                      </label>

                      <label className="flex items-center justify-between cursor-pointer group">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20 transition-colors">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-slate-200">Étape Critique</span>
                            <span className="text-[8px] text-slate-500 uppercase font-bold">Surveillance accrue</span>
                          </div>
                        </div>
                        <input 
                          title="Marquer comme étape critique"
                          type="checkbox"
                          checked={selectedStep.isCritical}
                          onChange={(e) => setSteps(steps.map(s => s.id === selectedStep.id ? { ...s, isCritical: e.target.checked } : s))}
                          className="w-5 h-5 accent-red-500 bg-slate-950 border-slate-800 rounded-lg"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <h2 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Rapport de Conformité
                  </h2>
                  
                  {metrics.lintIssues.length > 0 ? (
                    <div className="space-y-4">
                      {metrics.lintIssues.map((issue) => (
                        <div 
                          key={issue.id} 
                          className={`p-4 rounded-2xl border ${
                            issue.type === 'error' ? 'bg-red-500/5 border-red-500/20' : 
                            issue.type === 'warning' ? 'bg-amber-500/5 border-amber-500/20' : 
                            'bg-blue-500/5 border-blue-500/20'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`mt-1 p-1 rounded-md ${
                              issue.type === 'error' ? 'bg-red-500/20 text-red-400' : 
                              issue.type === 'warning' ? 'bg-amber-500/20 text-amber-400' : 
                              'bg-blue-500/20 text-blue-400'
                            }`}>
                              {issue.type === 'error' ? <X className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-[9px] font-black uppercase tracking-widest ${
                                  issue.type === 'error' ? 'text-red-400' : 
                                  issue.type === 'warning' ? 'text-amber-400' : 
                                  'text-blue-400'
                                }`}>
                                  {issue.category}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 font-medium leading-relaxed">{issue.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl">
                      <div className="p-4 bg-emerald-500/10 rounded-full">
                        <ShieldCheck className="w-8 h-8 text-emerald-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-emerald-400">Processus Conforme</h3>
                        <p className="text-xs text-slate-500 px-8">Ce workflow respecte tous les standards industriels configurés.</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        </div>

        {/* Footer Actions */}
        <footer className="px-8 py-6 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
          <div className="flex items-center gap-8">
             <div className="flex flex-col">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estimation Charge</span>
               <span className={`text-sm font-black ${metrics.complexity === 'Simple' ? 'text-emerald-400' : metrics.complexity === 'Moyen' ? 'text-amber-400' : 'text-red-400'}`}>
                 {metrics.complexity === 'Simple' ? 'Faible' : metrics.complexity === 'Moyen' ? 'Modérée' : 'Elevée'} ({metrics.validations} validations)
               </span>
             </div>
          </div>
          
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose} className="text-slate-400 hover:text-slate-100" title="Annuler les modifications">
              ANNULER
            </Button>
            <Button 
              variant="neon" 
              onClick={handleSave}
              disabled={!name || steps.length === 0 || errorCount > 0}
              className="px-8 h-12 gap-2"
              title={errorCount > 0 ? "Corrigez les erreurs de conformité pour sauvegarder" : "Sauvegarder le workflow"}
            >
              <Save className="w-4 h-4" />
              {errorCount > 0 ? `${errorCount} ERREURS DE CONFORMITÉ` : 'SAUVEGARDER LE WORKFLOW'}
            </Button>
          </div>
        </footer>
      </div>
    </div>
  );
}
