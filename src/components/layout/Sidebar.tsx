import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  KanbanSquare,
  CheckSquare,
  Settings,
  LogOut,
  Calendar as CalendarIcon,
  Bot,
  BarChart3
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useStore } from '../../store/useStore';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: KanbanSquare, label: 'Kanban', path: '/kanban' },
  { icon: CheckSquare, label: 'Mes Opérations', path: '/tasks' },
  { icon: CalendarIcon, label: 'Calendrier', path: '/calendar' },
  { icon: Bot, label: 'Sourcing IA', path: '/procurement' },
  { icon: BarChart3, label: 'Analyse & Comparaison', path: '/analysis' },
  { icon: Settings, label: 'Paramètres', path: '/settings' }
];

export function Sidebar() {
  const { currentUser, companyInfo, logout, hasPermission } = useStore();

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/60 flex flex-col h-screen sticky top-0 transition-colors duration-300 shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
      <div className="h-16 flex items-center px-6 border-b border-slate-800/60 cyber-gradient">
        <div className="flex items-center gap-3 text-emerald-400 group cursor-pointer">
          {companyInfo.logo ? (
            <img src={companyInfo.logo} alt={companyInfo.name} className="w-9 h-9 object-contain drop-shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          ) : (
            <div className="w-9 h-9 rounded bg-emerald-950/50 flex items-center justify-center border border-emerald-500/50 glow-emerald transition-all group-hover:glow-emerald-strong">
              <span className="font-bold text-lg text-emerald-300 text-glow-emerald">{companyInfo.name.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <span className="font-bold text-xl tracking-tight text-slate-50 truncate group-hover:text-emerald-300 transition-colors">{companyInfo.name}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const hasAccess = (() => {
            switch (item.path) {
              case '/':
                return hasPermission(currentUser, 'modules.dashboard');
              case '/kanban':
                return hasPermission(currentUser, 'modules.kanban');
              case '/tasks':
                return hasPermission(currentUser, 'modules.tasks');
              case '/calendar':
                return hasPermission(currentUser, 'modules.calendar');
              case '/procurement':
                return hasPermission(currentUser, 'modules.procurement');
              case '/analysis':
                return hasPermission(currentUser, 'modules.analysis');
              case '/settings':
                return hasPermission(currentUser, 'modules.admin');
              default:
                return true;
            }
          })();

          if (!hasAccess) return null;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all text-sm font-medium relative overflow-hidden group',
                  isActive
                    ? 'glass-panel-active text-emerald-300'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.8)] rounded-r-md"></div>
                  )}
                  <item.icon className={cn("w-4.5 h-4.5 z-10 transition-transform", isActive ? "scale-110 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]" : "group-hover:scale-110")} />
                  <span className="z-10">{item.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <NavLink
          to="/profile"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 mb-4 p-2 -mx-2 rounded-lg transition-all cursor-pointer group',
              isActive ? 'glass-panel-active' : 'hover:bg-slate-900/50 border border-transparent hover:border-slate-800'
            )
          }
        >
          <img
            src={currentUser?.avatar}
            alt={currentUser?.name}
            className="w-10 h-10 rounded-full border-2 border-slate-700 group-hover:border-emerald-500 group-hover:glow-emerald transition-all"
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-50 truncate group-hover:text-emerald-300 transition-colors">
              {currentUser?.name}
            </p>
            <p className="text-xs text-slate-400 truncate">{currentUser?.role}</p>
          </div>
        </NavLink>
        <button
          onClick={() => logout()}
          className="flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors text-sm w-full px-2 py-1.5 rounded-md hover:bg-slate-900"
        >
          <LogOut className="w-4 h-4" />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
