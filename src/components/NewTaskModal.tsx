import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Objective, Priority, ObjectiveType, ObjectiveStatus, HealthStatus } from '../types';
import { X, Users, DollarSign, Info, Settings2, ShieldCheck, Zap } from 'lucide-react';
import { useForm, FormProvider, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { motion, AnimatePresence } from 'framer-motion';

import { TaskGeneralInfo } from './task-form/TaskGeneralInfo';
import { TaskOrganization } from './task-form/TaskOrganization';
import { TaskFinancials } from './task-form/TaskFinancials';
import { TaskExtraData } from './task-form/TaskExtraData';

const objectiveSchema = z
  .object({
    title: z.string().min(1, 'Le titre est requis'),
    description: z.string().min(1, 'La description est requise'),
    objectiveType: z.string().min(1, 'Le type d\'opération est requis'),
    siteId: z.string().min(1, 'Le site est requis'),
    department: z.string().min(1, 'Le département est requis'),
    assigneeId: z.string().min(1, 'Le porteur de l\'opération est requis'),
    managerId: z.string().min(1, 'Le donneur d\'ordre est requis'),
    priority: z.enum(['Faible', 'Normale', 'Haute', 'Urgent']),
    startDate: z.string().min(1, 'La date de début est requise'),
    dueDate: z.string().min(1, 'La date limite est requise'),
    supplierName: z.string().optional(),
    quoteNumber: z.string().optional(),
    quoteAmount: z.string().optional(),
    currency: z.string(),
    internalReference: z.string().optional(),
    initialComment: z.string().optional()
  })
  .refine((data) => new Date(data.dueDate) >= new Date(data.startDate), {
    message: "La date d'échéance doit être postérieure ou égale à la date de début",
    path: ['dueDate']
  });

type ObjectiveFormValues = z.infer<typeof objectiveSchema>;

interface NewTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TABS = [
  { id: 'general', label: 'Informations', icon: Info, color: 'text-emerald-400' },
  { id: 'organization', label: 'Ressources', icon: Users, color: 'text-blue-400' },
  { id: 'financials', label: 'Finance', icon: DollarSign, color: 'text-amber-400' },
  { id: 'extras', label: 'Configuration', icon: Settings2, color: 'text-purple-400' }
] as const;

type TabId = (typeof TABS)[number]['id'];

const getInitialDates = () => {
  const now = new Date();
  const future = new Date(now.getTime() + 86400000 * 7);
  return {
    start: now.toISOString().split('T')[0],
    due: future.toISOString().split('T')[0]
  };
};

const generateId = (prefix: string) => `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

export function NewTaskModal({ isOpen, onClose }: NewTaskModalProps) {
  const { users, sites, workflowTemplates, addObjective, currentUser } = useStore();
  const [activeTab, setActiveTab] = useState<TabId>('general');

  const dates = getInitialDates();

  const methods = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveSchema) as unknown as Resolver<ObjectiveFormValues>,
    defaultValues: {
      title: '',
      description: '',
      objectiveType: 'Achat Standard',
      siteId: (sites || [])[0]?.id || '',
      department: 'Achat',
      assigneeId: (users || [])[0]?.id || '',
      managerId: currentUser?.id || (users || [])[0]?.id || '',
      priority: 'Normale',
      startDate: dates.start,
      dueDate: dates.due,
      supplierName: '',
      quoteNumber: '',
      quoteAmount: '',
      currency: 'EUR',
      internalReference: '',
      initialComment: ''
    }
  });

  const { handleSubmit, reset, formState: { errors } } = methods;

  const [tags, setTags] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<{ key: string; value: string }[]>([]);

  if (!isOpen) return null;

  const onSubmit = (formData: ObjectiveFormValues) => {
    const customFieldsRecord: Record<string, string> = {};
    customFields.forEach((f) => {
      if (f.key.trim()) {
        customFieldsRecord[f.key.trim()] = f.value.trim();
      }
    });

    const newId = generateId('obj');

    const newObjective: Objective = {
      id: newId,
      title: formData.title,
      description: formData.description,
      type: formData.objectiveType as ObjectiveType,
      siteId: formData.siteId,
      department: formData.department,
      assigneeId: formData.assigneeId,
      managerId: formData.managerId,
      priority: formData.priority as Priority,
      status: 'Nouveau' as ObjectiveStatus,
      healthStatus: 'Stable' as HealthStatus,
      riskScore: 0,
      riskLevel: 'Faible',
      complexityScore: 'Simple',
      startDate: new Date(formData.startDate).toISOString(),
      dueDate: new Date(formData.dueDate).toISOString(),
      createdAt: new Date().toISOString(),
      blocks: [], 
      workflow: [], 
      supplierName: formData.supplierName || undefined,
      quoteNumber: formData.quoteNumber || undefined,
      quoteAmount: formData.quoteAmount ? parseFloat(formData.quoteAmount) : undefined,
      currency: formData.quoteAmount ? formData.currency : undefined,
      internalReference: formData.internalReference || undefined,
      tags: tags.length > 0 ? tags : undefined,
      initialComment: formData.initialComment || undefined,
      customFields: customFieldsRecord,
      comments: [],
      auditLog: [], 
      attachments: [],
      dependencies: []
    };

    addObjective(newObjective);
    reset();
    setTags([]);
    setCustomFields([]);
    onClose();
  };

  const hasTabError = (tabId: TabId) => {
    if (tabId === 'general') return !!(errors.title || errors.description || errors.objectiveType || errors.startDate || errors.dueDate);
    if (tabId === 'organization') return !!(errors.siteId || errors.department || errors.assigneeId || errors.managerId);
    return false;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300 p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header Section */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-50 uppercase tracking-tighter">Initialiser l'Opération Industrielle</h2>
              <p className="text-xs text-slate-500 font-medium flex items-center gap-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500/50" />
                Planification conforme au standard Zero-Code PUMA
              </p>
            </div>
          </div>
          <button
            title="Fermer"
            onClick={() => { reset(); onClose(); }}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-800 text-slate-500 hover:text-slate-50 transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Navigation Sidebar */}
          <div className="w-64 border-r border-slate-800 bg-slate-950/40 p-4 space-y-2">
            <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-4 px-3">Configuration</div>
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              const hasError = hasTabError(tab.id);
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all group ${
                    isActive 
                      ? 'bg-emerald-500/10 text-slate-50 border border-emerald-500/20 shadow-[0_4px_12px_rgba(16,185,129,0.05)]' 
                      : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? tab.color : 'text-slate-600 group-hover:text-slate-400'}`} />
                    <span className="text-sm font-bold">{tab.label}</span>
                  </div>
                  {hasError && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />}
                </button>
              );
            })}

            <div className="absolute bottom-24 w-56 p-4 rounded-xl bg-slate-900/50 border border-slate-800/50 mt-auto mx-1">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Plan d'action IA</span>
              </div>
              <p className="text-[10px] leading-relaxed text-slate-500 italic">
                L'IA générera automatiquement les blocs de workflow après validation.
              </p>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="flex-1 overflow-y-auto p-8 bg-slate-900/20 custom-scrollbar">
            <FormProvider {...methods}>
              <form id="new-objective-form" onSubmit={handleSubmit(onSubmit)}>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === 'general' && <TaskGeneralInfo />}
                    {activeTab === 'organization' && <TaskOrganization sites={sites} users={users} workflowTemplates={workflowTemplates} />}
                    {activeTab === 'financials' && <TaskFinancials />}
                    {activeTab === 'extras' && (
                      <TaskExtraData
                        tags={tags}
                        setTags={setTags}
                        customFields={customFields}
                        setCustomFields={setCustomFields}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </form>
            </FormProvider>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex -space-x-2">
              {users?.slice(0, 3).map((u, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-900 bg-slate-800 overflow-hidden">
                  <img src={u.avatar || `https://ui-avatars.com/api/?name=${u.name}&background=random`} alt={u.name} />
                </div>
              ))}
            </div>
            <span className="text-[10px] font-medium text-slate-500 uppercase tracking-widest">Planification Collaborative Actif</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => { reset(); onClose(); }}
              className="px-6 py-2.5 text-xs font-black text-slate-500 hover:text-slate-300 transition-all uppercase tracking-widest"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="new-objective-form"
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-slate-950 px-10 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-[0_10px_25px_rgba(16,185,129,0.25)] flex items-center gap-3 active:scale-95"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              Lancer l'Opération
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
