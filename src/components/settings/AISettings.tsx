import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Brain, Save, RefreshCw, AlertCircle } from 'lucide-react';
import { Badge } from '../ui/badge';
import { AIConfig } from '../../types';

export const AISettings: React.FC = () => {
  const { aiConfig, updateAIConfig } = useStore();
  const [localConfig, setLocalConfig] = useState<AIConfig>(aiConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateAIConfig(localConfig);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Brain className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Configuration IA (Gemini)</CardTitle>
              <p className="text-xs text-slate-500">Pilotez le cerveau de l'agent de sourcing</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            SAUVEGARDER
          </button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="ia-model" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Modèle IA</label>
              <select
                id="ia-model"
                title="Choisir le modèle d'intelligence artificielle"
                value={localConfig.model}
                onChange={(e) => setLocalConfig({ ...localConfig, model: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all"
              >
                <option value="gemini-2.5-flash">Gemini 2.5 Flash (Rapide & Précis)</option>
                <option value="gemini-2.0-pro-exp-02-05">Gemini 2.0 Pro (Raisonnement Complexe)</option>
              </select>
            </div>
            <div className="space-y-2">
              <label htmlFor="ia-temp" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Température ({localConfig.temperature})</label>
              <input
                id="ia-temp"
                title="Ajuster la température (créativité vs rigueur)"
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localConfig.temperature}
                onChange={(e) => setLocalConfig({ ...localConfig, temperature: parseFloat(e.target.value) })}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500 italic">
                <span>Strict / Précis</span>
                <span>Créatif / Libre</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="prompt-sourcing" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Template de Prompt : Sourcing de Campagne</label>
                <span className="text-[10px] text-purple-400 font-mono">Variables : {"{{category}}"}, {"{{brand}}"}, {"{{specs}}"}</span>
              </div>
              <textarea
                id="prompt-sourcing"
                title="Template du prompt de sourcing"
                placeholder="Entrez les instructions de sourcing ici..."
                value={localConfig.sourcingPromptTemplate}
                onChange={(e) => setLocalConfig({ ...localConfig, sourcingPromptTemplate: e.target.value })}
                rows={10}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="prompt-refresh" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Template de Prompt : Actualisation Fournisseur</label>
                <span className="text-[10px] text-purple-400 font-mono">Variable : {"{{name}}"}</span>
              </div>
              <textarea
                id="prompt-refresh"
                title="Template du prompt d'actualisation"
                placeholder="Entrez les instructions d'actualisation ici..."
                value={localConfig.refreshPromptTemplate}
                onChange={(e) => setLocalConfig({ ...localConfig, refreshPromptTemplate: e.target.value })}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-purple-500/50 outline-none transition-all leading-relaxed"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <RefreshCw className="w-3 h-3" /> Historique d'Évolution
              </h3>
              <Badge variant="outline" className="bg-purple-500/10 border-purple-500/20 text-purple-400">
                VERSION {localConfig.version || '1.0'}
              </Badge>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <table className="w-full text-[10px]">
                <thead className="bg-slate-900/50 border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">Action d'Apprentissage</th>
                    <th className="px-4 py-2 text-left font-bold text-slate-500 uppercase">Impact / Amélioration</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {localConfig.learningLogs && localConfig.learningLogs.length > 0 ? (
                    localConfig.learningLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-900/30 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono">{log.date}</td>
                        <td className="px-4 py-3 font-bold text-slate-200">{log.action}</td>
                        <td className="px-4 py-3 text-emerald-400">{log.improvement}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-10 text-center text-slate-600 italic">
                        Aucun cycle d'optimisation auto-généré pour le moment. L'IA analyse vos interactions...
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 px-4 py-2 bg-slate-900/50 border border-slate-800 rounded-lg">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] text-slate-400">
                <strong>Buffer Mémoire :</strong> {localConfig.memoryBuffer?.length || 0} préférences métier apprises et prêtes pour la prochaine version.
              </span>
            </div>
          </div>

          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0" />
            <p className="text-[10px] text-blue-300 leading-tight">
              <strong>Conseil Industriel :</strong> La modification des prompts affecte directement la qualité du sourcing. L'IA auto-optimise les instructions chaque semaine en fonction de vos feedbacks.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
