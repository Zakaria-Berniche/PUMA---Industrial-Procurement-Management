import React, { useState, useEffect } from 'react';
import { Search, Menu } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ThemeToggle } from '../ThemeToggle';
import { NotificationsDropdown } from './NotificationsDropdown';

export function Header() {
  const { currentUser, searchQuery, setSearchQuery } = useStore();
  const [localQuery, setLocalQuery] = useState(searchQuery);

  useEffect(() => {
    setLocalQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== localQuery) {
        setSearchQuery(localQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localQuery, setSearchQuery, searchQuery]);

  return (
    <header className="h-16 bg-slate-950/60 backdrop-blur-xl border-b border-slate-800/60 flex items-center justify-between px-6 sticky top-0 z-10 transition-colors duration-300 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.5)]">
      <div className="flex items-center gap-4 flex-1">
        <button className="lg:hidden text-slate-400 hover:text-emerald-400 transition-colors" aria-label="Menu Principal" title="Menu Principal">
          <Menu className="w-5 h-5" />
        </button>
        <div className="relative max-w-md w-full hidden sm:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-emerald-400 transition-colors" />
          <input
            type="text"
            value={localQuery}
            onChange={(e) => setLocalQuery(e.target.value)}
            placeholder="Rechercher une tâche, un site, un collaborateur..."
            className="w-full bg-slate-900/50 border border-slate-800/80 rounded-full pl-10 pr-16 py-2 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:bg-slate-900/80 focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500/50 transition-all shadow-inner"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 bg-slate-950 border border-slate-850 rounded px-1.5 py-0.5 text-[9px] font-mono text-slate-500 select-none pointer-events-none">
            Ctrl K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ThemeToggle />
        <NotificationsDropdown />
        <div className="h-8 w-px bg-slate-800 mx-2 hidden sm:block"></div>
        <div
          className="hidden sm:flex items-center gap-3 cursor-pointer hover:bg-slate-900/60 px-3 py-1.5 rounded-xl transition-all border border-transparent hover:border-slate-800/60 group"
          onClick={() => (window.location.href = '/profile')}
        >
          <div className="text-right">
            <p className="text-sm font-medium text-slate-50 group-hover:text-emerald-300 transition-colors">
              {currentUser?.name}
            </p>
            <p className="text-xs text-slate-400 font-mono">{currentUser?.department}</p>
          </div>
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-9 h-9 rounded-full border-2 border-slate-700 group-hover:border-emerald-500 group-hover:glow-emerald transition-all"
          />
        </div>
      </div>
    </header>
  );
}
