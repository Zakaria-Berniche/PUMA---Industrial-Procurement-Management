import React from 'react';
import { useFormContext } from 'react-hook-form';

export function TaskFinancials() {
  const { register } = useFormContext();

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1 h-6 bg-amber-500 rounded-full" />
          <h3 className="text-lg font-bold text-slate-100">Informations Commerciales</h3>
        </div>
        
        <div className="grid grid-cols-2 gap-6 bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Fournisseur Suggéré</label>
            <input
              {...register('supplierName')}
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-700"
              placeholder="Ex: ABC Steel Ind."
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Réf. Interne / SAP</label>
            <input
              {...register('internalReference')}
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-700"
              placeholder="Ex: PR-2024-001"
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 bg-slate-950/30 p-6 rounded-2xl border border-slate-800/50 shadow-inner">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">N° Devis</label>
            <input
              {...register('quoteNumber')}
              type="text"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-all placeholder:text-slate-700"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Montant Estimé</label>
            <input
              {...register('quoteAmount')}
              type="number"
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-all"
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Devise</label>
            <select
              {...register('currency')}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-sm text-slate-100 focus:outline-none focus:border-amber-500/50 transition-all appearance-none cursor-pointer"
            >
              <option value="DZD">DZD (DA)</option>
              <option value="EUR">EUR (€)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}
