import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { objectives, users, globalSuppliers } = useStore();
  const navigate = useNavigate();

  // Listen to keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const [prevQuery, setPrevQuery] = useState(query);
  if (query !== prevQuery) {
    setPrevQuery(query);
    setSelectedIndex(0);
  }

  const allItems = React.useMemo(() => {
    const pages = [
      { name: 'Tableau de bord (Dashboard)', path: '/' },
      { name: 'Tableau Kanban', path: '/kanban' },
      { name: 'Mes Opérations (Tâches)', path: '/tasks' },
      { name: 'Calendrier des Échéances', path: '/calendar' },
      { name: 'Sourcing IA & Fournisseurs', path: '/procurement' },
      { name: 'Analyses & Comparaisons', path: '/analysis' },
      { name: 'Paramètres du Système', path: '/settings' },
      { name: 'Profil Utilisateur', path: '/profile' }
    ].filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

    const objs = (objectives || []).filter(o => 
      o.title.toLowerCase().includes(query.toLowerCase()) || 
      (o.description || '').toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    const usrs = (users || []).filter(u => 
      u.name.toLowerCase().includes(query.toLowerCase()) || 
      u.email.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    const sups = (globalSuppliers || []).filter(s => 
      s.name.toLowerCase().includes(query.toLowerCase()) || 
      s.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    return [
      ...pages.map(p => ({ type: 'page' as const, label: p.name, value: p.path })),
      ...objs.map(o => ({ type: 'task' as const, label: o.title, value: `/tasks?taskId=${o.id}` })),
      ...usrs.map(u => ({ type: 'user' as const, label: u.name, value: `/profile` })),
      ...sups.map(s => ({ type: 'supplier' as const, label: s.name, value: `/analysis` }))
    ];
  }, [query, objectives, users, globalSuppliers]);

  // Keyboard navigation when open
  useEffect(() => {
    if (!isOpen || allItems.length === 0) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % allItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (allItems[selectedIndex]) {
          navigate(allItems[selectedIndex].value);
          setIsOpen(false);
          setQuery('');
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, allItems, navigate]);

  // Close dropdown on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsOpen(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-start justify-center pt-[15vh] z-[9999] animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      <div className="bg-slate-900/95 border border-slate-800 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden glass-panel relative animate-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-950/20">
          <Search className="w-5 h-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une page, tâche, collaborateur..."
            className="w-full bg-transparent border-none text-slate-100 placeholder:text-slate-500 focus:outline-none text-base"
            autoFocus
          />
          <kbd className="bg-slate-950 border border-slate-850 rounded px-2 py-0.5 text-xs font-mono text-slate-500 select-none">
            ESC
          </kbd>
        </div>

        <div className="max-h-[320px] overflow-y-auto p-2 space-y-1">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm italic">
              Aucun résultat pour "{query}"
            </div>
          ) : (
            allItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={`${item.type}-${item.value}-${idx}`}
                  onClick={() => {
                    navigate(item.value);
                    setIsOpen(false);
                    setQuery('');
                  }}
                  className={`w-full flex items-center justify-between px-4 py-2.5 rounded-lg text-left text-sm transition-all border ${
                    isSelected 
                      ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                      : 'text-slate-300 hover:bg-slate-800/40 hover:text-slate-100 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                      item.type === 'page' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      item.type === 'task' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                      item.type === 'user' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      'bg-slate-800/50 text-slate-400 border border-slate-700/30'
                    }`}>
                      {item.type === 'page' ? 'Page' :
                       item.type === 'task' ? 'Opération' :
                       item.type === 'user' ? 'Membre' : 'Fournisseur'}
                    </span>
                    <span className="font-semibold truncate">{item.label}</span>
                  </div>
                  {isSelected && (
                    <span className="text-[10px] text-emerald-400 font-bold font-mono">⏎ Entrer</span>
                  )}
                </button>
              );
            })
          )}
        </div>
        <div className="p-3 bg-slate-950/40 border-t border-slate-800/60 flex justify-between items-center text-[10px] text-slate-500">
          <span>Utilisez les flèches ↑↓ et Entrée pour naviguer</span>
          <span>Ctrl + K pour ouvrir/fermer</span>
        </div>
      </div>
    </div>
  );
}
