import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Building2, Save, RefreshCw, Scale, Clock } from 'lucide-react';
import { GlobalRules } from '../../types';

export const CompanySettings: React.FC = () => {
  const { companyInfo, globalRules, updateCompanyInfo, updateGlobalRules } = useStore();
  const [localInfo, setLocalInfo] = useState(companyInfo);
  const [localRules, setLocalRules] = useState<GlobalRules>(globalRules);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    updateCompanyInfo(localInfo);
    await updateGlobalRules(localRules);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Building2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Informations Entreprise</CardTitle>
              <p className="text-xs text-slate-500">Identité visuelle et informations générales</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            SAUVEGARDER
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label htmlFor="company-name" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nom de l'organisation</label>
              <input
                id="company-name"
                title="Nom de l'organisation"
                placeholder="Entrez le nom de l'entreprise..."
                type="text"
                value={localInfo.name}
                onChange={(e) => setLocalInfo({ ...localInfo, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="company-sector" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Secteur d'activité</label>
              <input
                id="company-sector"
                title="Secteur d'activité"
                placeholder="Ex: Industrie Automobile..."
                type="text"
                value={localInfo.sector}
                onChange={(e) => setLocalInfo({ ...localInfo, sector: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200 outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Scale className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Règles Métier & Seuils</CardTitle>
              <p className="text-xs text-slate-500">Configuration des limites financières et des délais industriels</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200">Seuil de Validation Direction</h4>
                <p className="text-[11px] text-slate-500">Montant au-delà duquel une approbation de la Direction est requise</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  title="Seuil de validation en DZD"
                  placeholder="0"
                  type="number"
                  value={localRules.validationThresholdDZD}
                  onChange={(e) => setLocalRules({ ...localRules, validationThresholdDZD: parseInt(e.target.value) })}
                  className="w-32 bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm font-bold text-amber-400 text-right outline-none focus:ring-2 focus:ring-amber-500/50"
                />
                <span className="text-xs font-bold text-slate-600">DZD</span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest">
              <Clock className="w-3.5 h-3.5" /> Matrice des Délais (SLA) par Unité
            </div>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(localRules.slaMatrix || {}).map(([unit, hours]) => (
                <div key={unit} className="flex items-center justify-between p-3 bg-slate-950/50 rounded-lg border border-slate-800">
                  <span className="text-xs font-medium text-slate-400">{unit}</span>
                  <div className="flex items-center gap-2">
                    <input
                      title={`Heures SLA pour ${unit}`}
                      placeholder="0"
                      type="number"
                      value={hours}
                      onChange={(e) => setLocalRules({
                        ...localRules,
                        slaMatrix: { ...localRules.slaMatrix, [unit]: parseInt(e.target.value) }
                      })}
                      className="w-16 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-200 text-right"
                    />
                    <span className="text-[10px] text-slate-600">h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-slate-200">SLA Mode Urgence</h4>
                <p className="text-[11px] text-slate-500">Délai maximum pour chaque étape en mode accéléré</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  title="SLA Mode Urgence (heures)"
                  placeholder="0"
                  type="number"
                  value={localRules.urgentModeSlaHours}
                  onChange={(e) => setLocalRules({ ...localRules, urgentModeSlaHours: parseInt(e.target.value) })}
                  className="w-16 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-sm font-bold text-red-400 text-right"
                />
                <span className="text-xs font-bold text-slate-600">heures</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
