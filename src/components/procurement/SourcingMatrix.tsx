import React, { useState } from 'react';
import { ProcurementSupplier } from '../../types';
import { useStore } from '../../store/useStore';
import { 
  Check, X, Shield, Zap, TrendingUp, 
  AlertTriangle, ThumbsUp, ThumbsDown 
} from 'lucide-react';

interface SourcingMatrixProps {
  suppliers: ProcurementSupplier[];
  onClose: () => void;
}

export function SourcingMatrix({ suppliers, onClose }: SourcingMatrixProps) {
  const { addAIFeedback } = useStore();
  const [feedbackSent, setFeedbackSent] = useState(false);

  const handleFeedback = (isPositive: boolean) => {
    addAIFeedback(isPositive, `Analyse matricielle pour ${suppliers.length} fournisseurs.`);
    setFeedbackSent(true);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
      <div className="bg-slate-950 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div>
            <h2 className="text-2xl font-bold text-slate-50 flex items-center gap-3">
              <Shield className="w-6 h-6 text-emerald-400" />
              Matrice de Comparaison IA
            </h2>
            <p className="text-slate-400 text-sm mt-1">Analyse comparative des forces et faiblesses des fournisseurs sélectionnés</p>
          </div>
          <button 
            onClick={onClose}
            title="Fermer la matrice"
            className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((sup) => (
              <div key={sup.id} className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 flex flex-col gap-5 hover:border-emerald-500/30 transition-all group">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-xl">
                    {sup.name.charAt(0)}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-50">{sup.reliabilityScore}%</div>
                    <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Fiabilité IA</div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-50 group-hover:text-emerald-400 transition-colors">{sup.name}</h3>
                  <div className="flex items-center gap-2 mt-1 text-slate-500 text-xs">
                    <Zap className="w-3 h-3" />
                    Wilaya: {sup.wilaya || 'Non précisée'}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <TrendingUp className="w-3 h-3" /> Points Forts
                    </div>
                    <div className="space-y-1.5">
                      {sup.strengths?.map((s, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-emerald-500/5 p-2 rounded-lg border border-emerald-500/10">
                          <Check className="w-3 h-3 text-emerald-500" />
                          {s}
                        </div>
                      )) || <span className="text-slate-600 text-xs">Analyse en cours...</span>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="text-[10px] text-amber-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3" /> Points de Vigilance
                    </div>
                    <div className="space-y-1.5">
                      {sup.weaknesses?.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs text-slate-300 bg-amber-500/5 p-2 rounded-lg border border-amber-500/10">
                          <X className="w-3 h-3 text-amber-500" />
                          {w}
                        </div>
                      )) || <span className="text-slate-600 text-xs">Analyse en cours...</span>}
                    </div>
                  </div>
                </div>

                <div className="mt-auto pt-4 border-t border-slate-800">
                  <div className="text-xs text-slate-500 mb-2">Estimation budgétaire :</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">
                    {sup.quoteAmount ? `${sup.quoteAmount.toLocaleString()} DZD` : 'Sur devis'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 border-t border-slate-800 bg-slate-900/30 flex items-center justify-between">
          <p className="text-xs text-slate-500 italic max-w-xl">
            * Les données sont générées par l'Agent IA en croisant les informations web publiques et votre historique d'achats.
          </p>
          
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cette analyse est-elle utile ?</span>
            {feedbackSent ? (
              <div className="flex items-center gap-2 text-emerald-400 text-[10px] font-bold bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <Check className="w-3 h-3" /> MERCI POUR VOTRE RETOUR
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleFeedback(true)}
                  className="p-2 bg-slate-900 hover:bg-emerald-500/20 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-slate-400 hover:text-emerald-400 transition-all"
                  title="Analyse Pertinente"
                >
                  <ThumbsUp className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => handleFeedback(false)}
                  className="p-2 bg-slate-900 hover:bg-red-500/20 border border-slate-800 hover:border-red-500/50 rounded-xl text-slate-400 hover:text-red-400 transition-all"
                  title="Analyse Imprécise"
                >
                  <ThumbsDown className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
