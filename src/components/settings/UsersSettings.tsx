import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { 
  Mail, 
  Briefcase, 
  LayoutDashboard, 
  KanbanSquare, 
  CheckSquare, 
  Calendar, 
  Bot, 
  BarChart3, 
  Settings 
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { UserModal } from '../UserModal';
import { User } from '../../types';

const AVAILABLE_SHORTCUTS = [
  { id: 'modules.dashboard' as const, label: 'Tableau de Bord', icon: LayoutDashboard },
  { id: 'modules.kanban' as const, label: 'Kanban', icon: KanbanSquare },
  { id: 'modules.tasks' as const, label: 'Mes Opérations', icon: CheckSquare },
  { id: 'modules.calendar' as const, label: 'Calendrier', icon: Calendar },
  { id: 'modules.procurement' as const, label: 'Sourcing IA', icon: Bot },
  { id: 'modules.analysis' as const, label: 'Analyse & Comparaison', icon: BarChart3 },
  { id: 'modules.admin' as const, label: 'Administration', icon: Settings }
];

export function UsersSettings() {
  const { users } = useStore();
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  return (
    <>
      <Card className="bg-slate-900/50 border-slate-800 animate-in fade-in slide-in-from-right-4 duration-300">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl text-slate-50">Utilisateurs & Rôles</CardTitle>
            <CardDescription>Gérez les accès et les permissions des collaborateurs.</CardDescription>
          </div>
          <Button
            variant="neon"
            size="sm"
            onClick={() => {
              setEditingUser(null);
              setIsUserModalOpen(true);
            }}
          >
            + Nouvel Utilisateur
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {users.map((user: User) => (
              <div
                key={user.id}
                className="flex items-center justify-between p-4 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Avatar className="w-10 h-10 border border-slate-700">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{user.name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Mail className="w-3 h-3" /> {user.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Briefcase className="w-3 h-3" /> {user.department}
                      </span>
                    </div>
                    {/* Shortcuts indicator for allowed modules */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {AVAILABLE_SHORTCUTS.map(shortcut => {
                        const hasAccess = user.allowedModules 
                          ? user.allowedModules.includes(shortcut.id)
                          : (user.role === 'Admin' || shortcut.id !== 'modules.admin');
                          
                        const Icon = shortcut.icon;
                        return (
                          <div 
                            key={shortcut.id} 
                            title={`${shortcut.label}: ${hasAccess ? 'Autorisé' : 'Interdit'}`}
                            className={`p-1 rounded border transition-colors ${hasAccess ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-slate-950 text-slate-700 border-slate-900 opacity-30'}`}
                          >
                            <Icon className="w-3 h-3" />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      user.role === 'Admin'
                        ? 'destructive'
                        : user.role.includes('Responsable')
                          ? 'warning'
                          : 'secondary'
                    }
                  >
                    {user.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-slate-400 hover:text-slate-200"
                    onClick={() => {
                      setEditingUser(user);
                      setIsUserModalOpen(true);
                    }}
                  >
                    Éditer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <UserModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setEditingUser(null);
        }}
        user={editingUser}
      />
    </>
  );
}
