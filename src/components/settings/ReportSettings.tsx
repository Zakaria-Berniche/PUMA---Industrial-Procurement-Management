import React, { useState } from 'react';
import { useStore } from '../../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { FileText, Save, RefreshCw, Palette } from 'lucide-react';
import { ReportConfig } from '../../types';

export const ReportSettings: React.FC = () => {
  const { reportConfig, updateReportConfig } = useStore();
  const [localConfig, setLocalConfig] = useState<ReportConfig>(reportConfig);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    await updateReportConfig(localConfig);
    setIsSaving(false);
  };

  return (
    <div className="space-y-6">
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <CardTitle className="text-lg text-slate-100">Design des Rapports PDF</CardTitle>
              <p className="text-xs text-slate-500">Personnalisez l'identité visuelle de vos exports</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            SAUVEGARDER
          </button>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-4">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Palette className="w-3.5 h-3.5" /> Couleurs de la Marque
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500">Primaire</span>
                    <div className="flex items-center gap-2">
                      <input
                        id="primary-color-picker"
                        title="Sélecteur de couleur primaire"
                        type="color"
                        value={localConfig.primaryColor}
                        onChange={(e) => setLocalConfig({ ...localConfig, primaryColor: e.target.value })}
                        className="w-10 h-10 bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        id="primary-color-hex"
                        title="Code hexadécimal couleur primaire"
                        placeholder="#000000"
                        type="text"
                        value={localConfig.primaryColor}
                        onChange={(e) => setLocalConfig({ ...localConfig, primaryColor: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-400"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500">Secondaire</span>
                    <div className="flex items-center gap-2">
                      <input
                        id="secondary-color-picker"
                        title="Sélecteur de couleur secondaire"
                        type="color"
                        value={localConfig.secondaryColor}
                        onChange={(e) => setLocalConfig({ ...localConfig, secondaryColor: e.target.value })}
                        className="w-10 h-10 bg-transparent border-0 cursor-pointer"
                      />
                      <input
                        id="secondary-color-hex"
                        title="Code hexadécimal couleur secondaire"
                        placeholder="#000000"
                        type="text"
                        value={localConfig.secondaryColor}
                        onChange={(e) => setLocalConfig({ ...localConfig, secondaryColor: e.target.value })}
                        className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs font-mono text-slate-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="report-font" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Typographie (PDF)</label>
                <select
                  id="report-font"
                  title="Choisir la police du rapport"
                  value={localConfig.fontFamily}
                  onChange={(e) => setLocalConfig({ ...localConfig, fontFamily: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-2.5 text-sm text-slate-200"
                >
                  <option value="helvetica">Helvetica (Standard)</option>
                  <option value="times">Times New Roman (Sérieux)</option>
                  <option value="courier">Courier (Technique)</option>
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Visibilité des Sections</label>
              <div className="space-y-3 p-4 bg-slate-950/50 rounded-lg border border-slate-800">
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">Afficher l'En-tête</span>
                  <input
                    title="Afficher l'en-tête du rapport"
                    type="checkbox"
                    checked={localConfig.showHeader}
                    onChange={(e) => setLocalConfig({ ...localConfig, showHeader: e.target.checked })}
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
                <label className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-slate-300">Afficher le Bas de page</span>
                  <input
                    title="Afficher le bas de page du rapport"
                    type="checkbox"
                    checked={localConfig.showFooter}
                    onChange={(e) => setLocalConfig({ ...localConfig, showFooter: e.target.checked })}
                    className="w-4 h-4 accent-blue-500"
                  />
                </label>
              </div>

              <div className="space-y-2">
                <label htmlFor="footer-text" className="text-xs font-bold text-slate-400 uppercase tracking-widest">Texte de Bas de page</label>
                <textarea
                  id="footer-text"
                  title="Texte du bas de page"
                  value={localConfig.footerText}
                  onChange={(e) => setLocalConfig({ ...localConfig, footerText: e.target.value })}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-4 py-3 text-xs text-slate-300 outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="Ex: Document Confidentiel - Tous droits réservés"
                />
              </div>
            </div>
          </div>

          {/* Preview Placeholder */}
          <div className="mt-4 p-6 bg-white rounded shadow-2xl overflow-hidden">
            <style>
              {`
                .report-preview-primary-bg { background-color: ${localConfig.primaryColor}; }
                .report-preview-secondary-bg { background-color: ${localConfig.secondaryColor}; }
                .report-preview-secondary-light-bg { background-color: ${localConfig.secondaryColor}10; }
              `}
            </style>
            <div className="h-4 w-full bg-slate-100 rounded mb-4 report-preview-secondary-light-bg" />
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded report-preview-primary-bg" />
              <div>
                <div className="h-6 w-48 bg-slate-200 rounded mb-1 report-preview-secondary-bg" />
                <div className="h-3 w-32 bg-slate-100 rounded" />
              </div>
            </div>
            <div className="space-y-2 mb-12">
              <div className="h-2 w-full bg-slate-50 rounded" />
              <div className="h-2 w-full bg-slate-50 rounded" />
              <div className="h-2 w-3/4 bg-slate-50 rounded" />
            </div>
            <div className="pt-4 border-t border-slate-100 flex justify-between">
              <div className="h-2 w-48 bg-slate-50 rounded" />
              <div className="h-2 w-12 bg-slate-50 rounded" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
