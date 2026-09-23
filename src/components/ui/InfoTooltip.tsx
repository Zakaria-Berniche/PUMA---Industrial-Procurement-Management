import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';

interface InfoTooltipProps {
  title: string;
  definition: string;
  impact: string;
  method?: string;
  children?: React.ReactNode;
}

export function InfoTooltip({ title, definition, impact, method }: InfoTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isLearningMode } = useStore();

  return (
    <div className="relative inline-flex items-center">
      <button
        onMouseEnter={() => setIsOpen(true)}
        onMouseLeave={() => setIsOpen(false)}
        onClick={() => setIsOpen(!isOpen)}
        title={`Informations sur ${title}`}
        className={`ml-2 p-1 rounded-full transition-all group relative ${
          isLearningMode ? 'bg-blue-500/10 ring-2 ring-blue-500/30' : 'hover:bg-slate-800'
        }`}
      >
        {isLearningMode && (
          <motion.div
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute inset-0 rounded-full bg-blue-500/20 blur-sm"
          />
        )}
        <Info className={`w-3.5 h-3.5 transition-colors ${
          isLearningMode ? 'text-blue-400' : 'text-slate-500 group-hover:text-blue-400'
        }`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute z-[100] bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 p-4 bg-slate-900/90 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl pointer-events-none"
          >
            <div className="space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
                <HelpCircle className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-black text-slate-100 uppercase tracking-tight">{title}</h4>
              </div>
              
              <div className="space-y-2">
                <div>
                  <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest mb-0.5">Définition</p>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-medium">{definition}</p>
                </div>
                
                <div>
                  <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mb-0.5">Impact Métier</p>
                  <p className="text-[10px] text-slate-300 leading-relaxed font-medium">{impact}</p>
                </div>

                {method && (
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Calcul</p>
                    <p className="text-[10px] text-slate-500 font-mono">{method}</p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-8 border-transparent border-t-slate-900/90" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
