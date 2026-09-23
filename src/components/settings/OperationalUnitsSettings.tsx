import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Edit2, Trash2, Plus, Clock, ListChecks } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { TaskConfiguration, OperationalUnitType } from '../../types';

export function OperationalUnitsSettings() {
  const { taskConfigurations, addTaskConfiguration, updateTaskConfiguration, deleteTaskConfiguration } = useStore();
  const [isEditing, setIsEditing] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<TaskConfiguration>>({});

  const handleSave = () => {
    if (!formData.title || !formData.type) return;

    if (isEditing === 'new') {
      addTaskConfiguration({
        id: `tc_${Date.now()}`,
        title: formData.title,
        type: formData.type as OperationalUnitType,
        defaultSlaHours: formData.defaultSlaHours || 24,
        requireNote: formData.requireNote || false,
        requirePhoto: formData.requirePhoto || false,
        defaultMicroSteps: formData.defaultMicroSteps || []
      } as TaskConfiguration);
    } else {
      updateTaskConfiguration(formData as TaskConfiguration);
    }
    setIsEditing(null);
    setFormData({});
  };

  const [searchTerm, setSearchTerm] = useState('');

  const filteredConfigs = taskConfigurations.filter(c => 
    c.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedConfigs = filteredConfigs.reduce((acc, config) => {
    if (!acc[config.category]) acc[config.category] = [];
    acc[config.category].push(config);
    return acc;
  }, {} as Record<string, TaskConfiguration[]>);

  return (
    <Card className="bg-slate-900/50 border-slate-800 animate-in fade-in slide-in-from-right-4 duration-300">
      <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <CardTitle className="text-xl text-slate-50">Colonne Vertébrale Achat (Backbone)</CardTitle>
          <CardDescription>Bibliothèque de tâches standardisées pour vos workflows.</CardDescription>
        </div>
        <div className="flex items-center gap-3">
          <input 
            type="text"
            placeholder="Rechercher une tâche..."
            value={searchTerm}
            title="Rechercher une tâche"
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 text-xs text-slate-300 focus:ring-1 focus:ring-emerald-500/50 outline-none w-48"
          />
          {!isEditing && (
            <Button
              variant="neon"
              size="sm"
              onClick={() => {
                setIsEditing('new');
                setFormData({ type: 'Analyse', category: 'ANALYSE BESOIN', defaultSlaHours: 24, defaultMicroSteps: [] });
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Tâche
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isEditing && (
          <div className="mb-8 p-6 bg-slate-950 border border-emerald-500/20 rounded-xl space-y-4 animate-in zoom-in-95">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Titre de la tâche</label>
                <input
                  type="text"
                  value={formData.title || ''}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="Ex: Vérifier demande interne"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Catégorie</label>
                <select
                  value={formData.category || ''}
                  title="Catégorie"
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="ANALYSE BESOIN">ANALYSE BESOIN</option>
                  <option value="CONSULTATION FOURNISSEURS">CONSULTATION FOURNISSEURS</option>
                  <option value="ANALYSE & COMPARAISON">ANALYSE & COMPARAISON</option>
                  <option value="NÉGOCIATION">NÉGOCIATION</option>
                  <option value="VALIDATION">VALIDATION</option>
                  <option value="COMMANDE">COMMANDE</option>
                  <option value="SUIVI LIVRAISON">SUIVI LIVRAISON</option>
                  <option value="RÉCEPTION">RÉCEPTION</option>
                  <option value="CLÔTURE">CLÔTURE</option>
                  <option value="GESTION BLOQUAGE">GESTION BLOQUAGE</option>
                  <option value="ADMINISTRATIVES">ADMINISTRATIVES</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type Métier</label>
                <select
                  value={formData.type || ''}
                  title="Sélectionner le type de tâche"
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as OperationalUnitType })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500/50"
                >
                  <option value="Analyse">Analyse</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Validation">Validation</option>
                  <option value="Négociation">Négociation</option>
                  <option value="Administratif">Administratif</option>
                  <option value="Logistique">Logistique</option>
                  <option value="Contrôle">Contrôle</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">SLA par défaut (Heures)</label>
                  <input
                    type="number"
                    title="SLA en heures"
                    value={formData.defaultSlaHours || 0}
                    onChange={(e) => setFormData({ ...formData, defaultSlaHours: parseInt(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500/50"
                  />
                </div>
                <div className="flex items-center gap-6 pt-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.requireNote || false}
                      onChange={(e) => setFormData({ ...formData, requireNote: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-300 transition-colors">Exiger Note</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox"
                      checked={formData.requirePhoto || false}
                      onChange={(e) => setFormData({ ...formData, requirePhoto: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-emerald-500 focus:ring-emerald-500/50"
                    />
                    <span className="text-[10px] font-bold text-slate-500 uppercase group-hover:text-slate-300 transition-colors">Exiger Photo</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Micro-étapes (Une par ligne)</label>
                <textarea
                  title="Micro-étapes"
                  value={(formData.defaultMicroSteps || []).join('\n')}
                  onChange={(e) => setFormData({ ...formData, defaultMicroSteps: e.target.value.split('\n').filter(s => s.trim()) })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-sm text-slate-100 focus:ring-2 focus:ring-emerald-500/50 min-h-[100px]"
                  placeholder="Vérifier stock\nDemander devis..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="ghost" size="sm" onClick={() => setIsEditing(null)}>Annuler</Button>
              <Button variant="neon" size="sm" onClick={handleSave}>Enregistrer</Button>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {Object.entries(groupedConfigs).map(([category, configs]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-slate-800"></div>
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{category}</h3>
                <div className="h-px flex-1 bg-slate-800"></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {configs.map((config) => (
                  <div
                    key={config.id}
                    className="flex items-start justify-between p-4 rounded-xl bg-slate-950/50 border border-slate-800 hover:border-emerald-500/30 transition-all group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-800 text-[8px] font-bold">
                          {config.type}
                        </Badge>
                        <h4 className="text-xs font-semibold text-slate-200">{config.title}</h4>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>SLA: <b className="text-slate-400">{config.defaultSlaHours}h</b></span>
                        </div>
                        {config.defaultMicroSteps.length > 0 && (
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <ListChecks className="w-3 h-3" />
                            <span><b className="text-slate-400">{config.defaultMicroSteps.length}</b> micros</span>
                          </div>
                        )}
                        {(config.requireNote || config.requirePhoto) && (
                          <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
                            {config.requireNote && <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[8px]">Note requis</Badge>}
                            {config.requirePhoto && <Badge className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[8px]">Photo requis</Badge>}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-emerald-400"
                        onClick={() => {
                          setFormData(config);
                          setIsEditing(config.id);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-500 hover:text-red-400"
                        onClick={() => deleteTaskConfiguration(config.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
          {taskConfigurations.length === 0 && !isEditing && (
            <div className="text-center py-12 border border-dashed border-slate-800 rounded-xl text-slate-500 text-sm">
              Votre bibliothèque de tâches est vide.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
