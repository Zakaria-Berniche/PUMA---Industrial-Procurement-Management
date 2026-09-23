import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit2, Trash2, Plus, Zap, Layout, Clock, Library } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { WorkflowTemplate, TaskConfiguration } from '../../types';
import { VisualWorkflowBuilder } from '../VisualWorkflowBuilder';

export function WorkflowSettings() {
  const { workflowTemplates, deleteWorkflowTemplate, taskConfigurations } = useStore();
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WorkflowTemplate | null>(null);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900/50 border-slate-800 animate-in fade-in slide-in-from-right-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl">
              <Zap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-xl text-slate-50 font-black tracking-tight">Visual Workflow Builder</CardTitle>
              <CardDescription className="text-slate-500 font-medium italic">Conception visuelle des standards opérationnels achats</CardDescription>
            </div>
          </div>
          <Button
            variant="neon"
            size="lg"
            onClick={() => {
              setEditingTemplate(null);
              setIsWorkflowModalOpen(true);
            }}
            className="rounded-xl shadow-[0_0_20px_rgba(16,185,129,0.2)]"
          >
            <Plus className="w-5 h-5 mr-2" />
            STUDIO DE CONCEPTION
          </Button>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {workflowTemplates.map((template: WorkflowTemplate) => (
              <div
                key={template.id}
                className="group flex items-start justify-between p-6 rounded-3xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900/50 transition-all duration-300"
              >
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-black text-slate-100 group-hover:text-emerald-400 transition-colors">{template.name}</h3>
                    <Badge variant={template.complexity === 'Simple' ? 'success' : template.complexity === 'Moyen' ? 'warning' : 'destructive'} className="text-[9px] px-2 py-0">
                      {template.complexity || 'Standard'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">{template.description}</p>
                  <div className="flex items-center gap-4 text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Layout className="w-3 h-3" /> {template.steps.length} Étapes</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {template.estimatedTotalSlaHours}h SLA</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-slate-900 hover:bg-emerald-500/10 text-slate-400 hover:text-emerald-400 rounded-xl"
                    onClick={() => {
                      setEditingTemplate(template);
                      setIsWorkflowModalOpen(true);
                    }}
                  >
                    <Edit2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-10 w-10 bg-slate-900 hover:bg-red-500/10 text-slate-400 hover:text-red-400 rounded-xl"
                    onClick={() => deleteWorkflowTemplate(template.id)}
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-900 border-slate-800 overflow-hidden">
        <CardHeader className="bg-slate-950/30">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Bibliothèque des Tâches Dynamiques</CardTitle>
              <CardDescription>Source de données pour l'assemblage automatique des workflows</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950/50 text-[10px] font-black uppercase tracking-widest text-slate-500 border-y border-slate-800">
                <th className="px-6 py-4">Titre de la Tâche</th>
                <th className="px-6 py-4">Unité Responsable</th>
                <th className="px-6 py-4">SLA Standard</th>
                <th className="px-6 py-4">Micro-étapes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {(taskConfigurations || []).map((config: TaskConfiguration) => (
                <tr key={config.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-200">{config.title}</span>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant="outline" className="text-[10px] border-slate-700 bg-slate-900/50 text-slate-400">
                      {config.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-amber-500 font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      {config.defaultSlaHours}h
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] text-slate-500 italic">
                      {config.defaultMicroSteps.length} points de contrôle
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {isWorkflowModalOpen && (
        <VisualWorkflowBuilder
          isOpen={isWorkflowModalOpen}
          onClose={() => setIsWorkflowModalOpen(false)}
          templateToEdit={editingTemplate}
        />
      )}
    </div>
  );
}
