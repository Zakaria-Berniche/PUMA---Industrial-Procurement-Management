import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ComparisonMatrix, ComparisonOption } from '../../types';
import { useStore } from '../../store/useStore';
import { Plus, Trash2, Download, CheckCircle2, BarChart3, Save, Info, Lightbulb } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { Badge } from '../ui/badge';

interface ComparisonMatrixProps {
  taskId?: string;
  initialMatrix?: ComparisonMatrix;
  onClose: () => void;
}

export function ComparisonMatrixModule({ taskId: initialTaskId, initialMatrix, onClose }: ComparisonMatrixProps) {
  const { addComparisonMatrix, updateComparisonMatrix, objectives, analysisSettings } = useStore();
  const [searchParams] = useSearchParams();
  const taskId = initialTaskId || searchParams.get('taskId');
  const stepId = searchParams.get('stepId');

  const linkedTask = useMemo(() => objectives.find(o => o.id === taskId), [objectives, taskId]);
  
  const [matrix, setMatrix] = useState<ComparisonMatrix>(() => initialMatrix || {
    id: `matrix_${Date.now()}`,
    taskId,
    title: 'ANALYSE & COMPARAISON',
    productName: '',
    criteria: analysisSettings.defaultCriteria,
    options: [
      { id: 'o1', name: 'Fournisseur A', values: {}, score: 0, pros: [], cons: [] },
      { id: 'o2', name: 'Fournisseur B', values: {}, score: 0, pros: [], cons: [] }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const matrixWithScores = useMemo(() => {
    const updatedOptions = matrix.options.map(opt => {
      let totalWeightedScore = 0;
      let totalPossibleWeight = 0;

      matrix.criteria.forEach(crit => {
        const value = parseFloat(opt.values[crit.id] as string) || 0;
        let score: number;

        if (crit.type === 'numeric') {
          const allValues = matrix.options.map(o => parseFloat(o.values[crit.id] as string) || 0);
          const minVal = Math.min(...allValues);
          const maxVal = Math.max(...allValues);

          if (crit.betterDirection === 'lower') {
            score = value === 0 ? 0 : (minVal / value) * 10;
          } else {
            score = maxVal === 0 ? 0 : (value / maxVal) * 10;
          }
        } else {
          score = value;
        }

        totalWeightedScore += score * crit.weight;
        totalPossibleWeight += 10 * crit.weight;
      });

      const finalScore = totalPossibleWeight > 0 
        ? Math.round((totalWeightedScore / totalPossibleWeight) * 100) 
        : 0;

      return { ...opt, score: finalScore };
    });

    return { ...matrix, options: updatedOptions };
  }, [matrix]);

  const handleAddOption = () => {
    const newOpt: ComparisonOption = {
      id: `o_${Date.now()}`,
      name: `Fournisseur ${String.fromCharCode(65 + matrix.options.length)}`,
      values: {},
      score: 0,
      pros: [],
      cons: []
    };
    setMatrix({ ...matrix, options: [...matrix.options, newOpt] });
  };

  const updateOptionValue = (optId: string, critId: string, value: string) => {
    setMatrix({
      ...matrix,
      options: matrix.options.map(o => o.id === optId 
        ? { ...o, values: { ...o.values, [critId]: value } } 
        : o
      )
    });
  };

  const handleSave = async (complete: boolean = false) => {
    if (initialMatrix) {
      await updateComparisonMatrix(matrixWithScores);
    } else {
      await addComparisonMatrix(matrixWithScores);
    }
    
    if (complete && taskId && stepId) {
      // updateWorkflowStep(taskId, stepId, 'Validé');
    }
    onClose();
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const docWithAutoTable = doc as jsPDF & { autoTable: (options: unknown) => void; lastAutoTable?: { finalY: number } };
    
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text('RAPPORT D\'ANALYSE & COMPARAISON', 20, 25);
    
    doc.setFontSize(10);
    doc.text(`Produit : ${matrix.productName || 'Non spécifié'}`, 20, 35);
    doc.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 150, 35);

    const head = [
      ['CRITÈRES', ...matrixWithScores.options.map(o => o.name.toUpperCase())]
    ];
    
    const body = matrix.criteria.map(crit => [
      `${crit.label} (${crit.unit || 'unit'})`,
      ...matrixWithScores.options.map(o => `${o.values[crit.id] || '0'} ${crit.unit || ''}`)
    ]);

    body.push([
      'SCORE FINAL (%)',
      ...matrixWithScores.options.map(o => `${o.score}%`)
    ]);

    docWithAutoTable.autoTable({
      startY: 50,
      head,
      body,
      theme: 'grid',
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 4 },
      columnStyles: { 0: { fontStyle: 'bold', fillColor: [248, 250, 252] } }
    });

    const winner = [...matrixWithScores.options].sort((a, b) => b.score - a.score)[0];
    const currentY = (docWithAutoTable.lastAutoTable?.finalY || 100) + 20;
    
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(14);
    doc.text('RECOMMANDATION FINALE', 20, currentY + 10);
    doc.setFontSize(11);
    doc.text(`Sur la base de l'analyse multicritères, la solution recommandée est : ${winner.name}`, 20, currentY + 20);
    doc.text(`Score de performance : ${winner.score}% (Calculé sur base DZD)`, 20, currentY + 28);

    doc.save(`Comparaison_${taskId}.pdf`);
  };

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 w-full h-full rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-900/50 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-lg shadow-blue-500/5">
              <BarChart3 className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-50 tracking-tight uppercase">{matrix.title}</h2>
              <div className="flex items-center gap-3 mt-1">
                {linkedTask && (
                  <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px] font-black px-2 py-0">
                    LIÉ À : {linkedTask.title}
                  </Badge>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-slate-500 uppercase">Produit :</span>
                  <input 
                    value={matrix.productName || ''}
                    title="Nom du produit"
                    placeholder="Nom du produit/service..."
                    onChange={(e) => setMatrix({ ...matrix, productName: e.target.value })}
                    className="bg-slate-950/50 border border-slate-800/50 rounded-lg px-3 py-1 text-[10px] font-bold text-slate-200 focus:ring-1 focus:ring-blue-500/50 outline-none w-64 placeholder:text-slate-700"
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-black uppercase transition-all border border-slate-700">
              <Download className="w-3.5 h-3.5" /> PDF
            </button>
            <button onClick={() => handleSave(true)} className="flex items-center gap-2 px-6 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black uppercase transition-all shadow-lg shadow-blue-600/20">
              <Save className="w-3.5 h-3.5" /> Sauvegarder
            </button>
            <button onClick={onClose} title="Fermer le module" className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
              <Plus className="w-5 h-5 rotate-45" />
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar bg-slate-950/20">
          <div className="max-w-[98%] mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-black text-sm">1</div>
                <h3 className="text-sm font-black text-slate-200 uppercase tracking-widest">Configurer le tableau</h3>
              </div>
              <button onClick={() => setMatrix({ ...matrix, criteria: analysisSettings.defaultCriteria })} className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 text-[9px] font-black uppercase flex items-center gap-2 transition-all">
                <Lightbulb className="w-3 h-3 text-amber-400" /> Réinitialiser standards
              </button>
            </div>

            <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 border-b border-slate-800">
                    <th className="p-5 w-72 border-r border-slate-800 bg-slate-950/40 text-[10px] font-black text-slate-500 uppercase tracking-widest">Critères standards</th>
                    {matrixWithScores.options.map(opt => (
                      <th key={opt.id} className="p-4 min-w-[200px] border-r border-slate-800 group relative" title={opt.name}>
                        <style>{`
                          .opt-score-bar-${opt.id} { width: ${opt.score}%; }
                        `}</style>
                        <div className="flex flex-col gap-2">
                          <input 
                            value={opt.name}
                            title="Nom du fournisseur"
                            onChange={(e) => setMatrix({ ...matrix, options: matrix.options.map(o => o.id === opt.id ? { ...o, name: e.target.value } : o)})}
                            className="bg-transparent border-none text-slate-50 font-black text-xs uppercase focus:ring-0 w-full"
                          />
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full ${opt.score > 70 ? 'bg-emerald-500' : opt.score > 40 ? 'bg-amber-500' : 'bg-red-500'} transition-all duration-1000 opt-score-bar-${opt.id}`} 
                                />
                              </div>
                              <span className={`text-[10px] font-black ${opt.score > 70 ? 'text-emerald-400' : 'text-slate-400'}`}>{opt.score}%</span>
                            </div>
                            <button onClick={() => setMatrix({ ...matrix, options: matrix.options.filter(o => o.id !== opt.id) })} title="Supprimer ce fournisseur" className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </th>
                    ))}
                    <th className="p-4 w-12 bg-slate-900/50 flex items-center justify-center">
                      <button onClick={handleAddOption} title="Ajouter un fournisseur" className="p-2 bg-emerald-500/10 text-emerald-500 rounded-full hover:bg-emerald-500 hover:text-white transition-all shadow-glow">
                        <Plus className="w-4 h-4" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {matrix.criteria.map(crit => (
                    <tr key={crit.id} className="group/row hover:bg-slate-800/30 transition-all">
                      <td className="p-4 border-r border-slate-800 bg-slate-950/30">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-bold text-slate-200">{crit.label}</span>
                          <span className="text-[8px] text-slate-500 uppercase font-black">Unit: {crit.unit} | Poids: x{crit.weight}</span>
                        </div>
                      </td>
                      {matrixWithScores.options.map(opt => (
                        <td key={opt.id} className="p-3 border-r border-slate-800">
                          <div className="relative group/input">
                            <input 
                              type="number"
                              value={String(opt.values[crit.id] || '')}
                              title={`Valeur pour ${crit.label}`}
                              onChange={(e) => updateOptionValue(opt.id, crit.id, e.target.value)}
                              className="w-full bg-slate-950/50 border border-slate-800 rounded-xl px-4 py-2.5 text-sm font-black text-slate-100 focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500/50 outline-none transition-all"
                            />
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-600 uppercase group-focus-within/input:text-blue-400">
                              {crit.unit}
                            </div>
                          </div>
                        </td>
                      ))}
                      <td className="p-3 bg-slate-900/10" />
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Info className="w-4 h-4" /> Points de Vigilance IA
                 </h4>
                 <div className="space-y-4">
                  {[...matrixWithScores.options].sort((a, b) => b.score - a.score).map((opt, i) => (
                    <div key={opt.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800/50">
                      <style>{`
                        .match-bar-${opt.id} { width: ${opt.score}%; }
                      `}</style>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400">#{i+1}</div>
                        <span className="text-xs font-black text-slate-100 uppercase">{opt.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1 bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full bg-emerald-500 transition-all match-bar-${opt.id}`} />
                        </div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase">{opt.score}% Match</span>
                      </div>
                    </div>
                  ))}
                 </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6">
                 <h4 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-400" /> Aide à la décision
                 </h4>
                 <div className="space-y-4 text-xs text-slate-400 leading-relaxed">
                   <p>Le moteur d'analyse compare les valeurs réelles saisies et calcule automatiquement un score relatif. Plus le score est proche de 100%, plus l'offre est performante selon vos critères.</p>
                   <ul className="space-y-2">
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Saisie des données réelles uniquement.</li>
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Pondération automatique centralisée.</li>
                     <li className="flex items-center gap-2"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Export PDF certifié disponible.</li>
                   </ul>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
