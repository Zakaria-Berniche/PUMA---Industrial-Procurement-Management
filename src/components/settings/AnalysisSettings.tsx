import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Plus, Trash2, Save, BarChart3, Info, Scale, Target, Ruler } from 'lucide-react';
import { ComparisonCriteria } from '../../types';

export function AnalysisSettingsComponent() {
  const { analysisSettings, updateAnalysisSettings } = useStore();
  const [criteria, setCriteria] = useState<ComparisonCriteria[]>(analysisSettings.defaultCriteria);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateAnalysisSettings({ defaultCriteria: criteria });
    setIsSaving(false);
  };

  const addCriteria = () => {
    const newCrit: ComparisonCriteria = {
      id: `c_${Date.now()}`,
      label: 'Nouveau Critère',
      weight: 3,
      type: 'numeric',
      unit: 'DZD',
      betterDirection: 'lower'
    };
    setCriteria([...criteria, newCrit]);
  };

  const removeCriteria = (id: string) => {
    setCriteria(criteria.filter(c => c.id !== id));
  };

  const updateCriteria = (id: string, updates: Partial<ComparisonCriteria>) => {
    setCriteria(criteria.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const totalWeight = criteria.reduce((acc, c) => acc + c.weight, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/40 border border-slate-800 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <BarChart3 className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-50 tracking-tight">Standardisation des Analyses</h3>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Configuration du moteur de décision multicritères</p>
          </div>
        </div>
        
        <div className="flex items-center gap-6 px-6 py-3 bg-slate-950 rounded-xl border border-slate-800">
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase">Critères</p>
            <p className="text-lg font-black text-blue-400">{criteria.length}</p>
          </div>
          <div className="w-px h-8 bg-slate-800" />
          <div className="text-center">
            <p className="text-[10px] font-black text-slate-500 uppercase">Poids Total</p>
            <p className="text-lg font-black text-emerald-400">x{totalWeight}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-900/20 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800">
              <th className="px-6 py-4 text-left">
                <div className="flex items-center gap-2">
                  <Target className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Libellé du Critère</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left w-48">
                <div className="flex items-center gap-2">
                  <Scale className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Coefficient</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left w-64">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Logique Performance</span>
                </div>
              </th>
              <th className="px-6 py-4 text-left w-40">
                <div className="flex items-center gap-2">
                  <Ruler className="w-3.5 h-3.5 text-slate-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Unité</span>
                </div>
              </th>
              <th className="px-6 py-4 text-right w-20">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right block">Action</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {criteria.map((crit) => (
              <tr key={crit.id} className="group hover:bg-slate-800/20 transition-all">
                <td className="px-6 py-4">
                  <input
                    value={crit.label}
                    onChange={(e) => updateCriteria(crit.id, { label: e.target.value })}
                    className="w-full bg-transparent border-none text-sm font-bold text-slate-100 focus:ring-2 focus:ring-blue-500/20 rounded-lg px-2 -ml-2 py-1.5 transition-all"
                    placeholder="Ex: Prix unitaire, Délai logistique..."
                  />
                </td>
                <td className="px-6 py-4">
                  <select
                    value={crit.weight}
                    title="Importance relative de ce critère"
                    onChange={(e) => updateCriteria(crit.id, { weight: parseInt(e.target.value) })}
                    className="bg-slate-950 border border-slate-800 text-xs font-black text-emerald-400 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500/20 cursor-pointer w-full"
                  >
                    <option value={5}>x5 (CRITIQUE)</option>
                    <option value={4}>x4 (IMPORTANT)</option>
                    <option value={3}>x3 (MOYEN)</option>
                    <option value={2}>x2 (FAIBLE)</option>
                    <option value={1}>x1 (MINEUR)</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={crit.betterDirection}
                    title="Sens de la performance attendue"
                    onChange={(e) => updateCriteria(crit.id, { betterDirection: e.target.value as 'higher' | 'lower' })}
                    className={`bg-slate-950 border border-slate-800 text-[10px] font-black rounded-lg px-3 py-1.5 focus:ring-2 w-full cursor-pointer ${
                      crit.betterDirection === 'lower' ? 'text-amber-400 focus:ring-amber-500/20' : 'text-blue-400 focus:ring-blue-500/20'
                    }`}
                  >
                    <option value="lower">PLUS BAS = MEILLEUR</option>
                    <option value="higher">PLUS HAUT = MEILLEUR</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <input
                    value={crit.unit || ''}
                    onChange={(e) => updateCriteria(crit.id, { unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 text-xs font-bold text-slate-400 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-slate-500/20 transition-all uppercase"
                    placeholder="DZD, Jrs..."
                  />
                </td>
                <td className="px-6 py-4 text-right">
                  <button
                    onClick={() => removeCriteria(crit.id)}
                    title="Supprimer ce critère"
                    className="p-2 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="p-4 bg-slate-950/50 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={addCriteria}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase transition-all border border-slate-700"
          >
            <Plus className="w-3.5 h-3.5 text-blue-400" /> Ajouter une règle
          </button>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-8 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-[11px] font-black uppercase transition-all shadow-lg shadow-emerald-600/20"
          >
            <Save className="w-4 h-4" /> {isSaving ? 'Enregistrement...' : 'Valider les standards'}
          </button>
        </div>
      </div>

      <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0 border border-blue-500/30">
            <Info className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h4 className="text-blue-400 font-black text-[10px] uppercase tracking-widest mb-1.5">Impact sur la Production</h4>
            <p className="text-xs text-slate-500 leading-relaxed max-w-3xl">
              Ces règles définissent comment l'IA et le moteur de scoring vont traiter les devis. Un coefficient **x5** signifie que l'impact de ce critère est 500% plus fort qu'un coefficient **x1** dans le calcul final. Toute modification ici sera répercutée sur les futures analyses créées.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
