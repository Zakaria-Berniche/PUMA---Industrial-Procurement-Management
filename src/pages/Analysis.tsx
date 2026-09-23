import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { BarChart3, Plus, Search, Filter, Calendar, FileText, ChevronRight, Trash2 } from 'lucide-react';
import { ComparisonMatrixModule } from '../components/analysis/ComparisonMatrix';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import { useSearchParams } from 'react-router-dom';

export default function Analysis() {
  const { comparisonMatrices, deleteComparisonMatrix, objectives } = useStore();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMatrixId, setSelectedMatrixId] = useState<string | null>(searchParams.get('id'));
  const [isCreating, setIsCreating] = useState(searchParams.get('new') === 'true');

  const filteredMatrices = useMemo(() => {
    return comparisonMatrices.filter(m => 
      m.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.taskId?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [comparisonMatrices, searchQuery]);

  const selectedMatrix = useMemo(() => {
    return comparisonMatrices.find(m => m.id === selectedMatrixId);
  }, [comparisonMatrices, selectedMatrixId]);

  const handleCreate = () => {
    setIsCreating(true);
    setSelectedMatrixId(null);
  };

  const handleCloseEditor = () => {
    setIsCreating(false);
    setSelectedMatrixId(null);
    setSearchParams({});
  };

  if (isCreating || selectedMatrixId) {
    return (
      <div className="h-[calc(100vh-2rem)] animate-in fade-in slide-in-from-bottom-4 duration-500">
        <ComparisonMatrixModule 
          taskId={searchParams.get('taskId') || undefined}
          initialMatrix={selectedMatrix}
          onClose={handleCloseEditor}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-600/20 rotate-3 group-hover:rotate-6 transition-transform">
            <BarChart3 className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-50 uppercase tracking-tighter">ANALYSE & COMPARAISON</h1>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
               <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
               Aide à la décision industrielle autonome
            </p>
          </div>
        </div>
        <button 
          onClick={handleCreate}
          className="flex items-center gap-3 px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-blue-600/20 active:scale-95 group"
        >
          <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" /> Nouvelle Analyse
        </button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-focus-within:text-blue-500 transition-colors" />
          <input 
            type="text"
            placeholder="Rechercher une analyse, un fournisseur ou une tâche..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl pl-12 pr-4 py-4 text-slate-200 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-slate-600 font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-4 bg-slate-900/50 border border-slate-800 rounded-2xl text-slate-400 hover:text-slate-200 transition-all font-bold text-xs uppercase tracking-widest">
          <Filter className="w-4 h-4" /> Filtres
        </button>
      </div>

      {/* Analysis Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMatrices.map((matrix) => {
            const linkedTask = objectives.find(o => o.id === matrix.taskId);
            return (
              <motion.div 
                key={matrix.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="group relative bg-slate-900/40 border border-slate-800 rounded-3xl p-6 hover:bg-slate-800/40 transition-all hover:border-slate-700/50 hover:shadow-2xl hover:shadow-blue-500/5"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => deleteComparisonMatrix(matrix.id)}
                      className="p-2 text-slate-600 hover:text-red-500 transition-colors rounded-lg hover:bg-red-500/10"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setSelectedMatrixId(matrix.id)}
                      className="p-2 text-slate-600 hover:text-blue-400 transition-colors rounded-lg hover:bg-blue-500/10"
                      title="Ouvrir"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-100 uppercase tracking-tight group-hover:text-blue-400 transition-colors">{matrix.title}</h3>
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-3 h-3 text-slate-600" />
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Créé le {format(new Date(matrix.createdAt), 'dd MMMM yyyy')}</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[9px] font-black text-slate-400 uppercase">
                      {matrix.options.length} Options
                    </div>
                    <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[9px] font-black text-slate-400 uppercase">
                      {matrix.criteria.length} Critères
                    </div>
                    {linkedTask ? (
                      <div className="px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-black text-blue-400 uppercase flex items-center gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-blue-400 animate-pulse" />
                        Lié à: {linkedTask.title}
                      </div>
                    ) : (
                      <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[9px] font-black text-slate-600 uppercase">
                        Analyse Autonome
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-8 flex items-center justify-between border-t border-slate-800/50 pt-4">
                   <div className="flex -space-x-2">
                      {matrix.options.slice(0, 3).map((opt, i) => (
                        <div 
                          key={opt.id} 
                          className={`w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-400 shadow-lg ${
                            i === 0 ? 'z-[3]' : i === 1 ? 'z-[2]' : 'z-[1]'
                          }`}
                        >
                          {opt.name.charAt(0)}
                        </div>
                      ))}
                      {matrix.options.length > 3 && (
                        <div className="w-8 h-8 rounded-full bg-slate-950 border-2 border-slate-900 flex items-center justify-center text-[10px] font-black text-slate-600">
                          +{matrix.options.length - 3}
                        </div>
                      )}
                   </div>
                   <button 
                    onClick={() => setSelectedMatrixId(matrix.id)}
                    className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 transition-colors"
                   >
                    Éditer l'analyse <ChevronRight className="w-3 h-3" />
                   </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredMatrices.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center bg-slate-900/20 border-2 border-dashed border-slate-800 rounded-[3rem] text-center">
            <div className="w-20 h-20 rounded-full bg-slate-900 flex items-center justify-center mb-6">
              <BarChart3 className="w-10 h-10 text-slate-700" />
            </div>
            <h3 className="text-xl font-black text-slate-400 uppercase">Aucune analyse trouvée</h3>
            <p className="text-slate-600 mt-2 max-w-xs font-medium">Commencez par créer une nouvelle matrice de comparaison technique.</p>
            <button 
              onClick={handleCreate}
              className="mt-8 px-8 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
            >
              Créer la première analyse
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
