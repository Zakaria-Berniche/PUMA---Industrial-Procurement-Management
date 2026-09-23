import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Clock, FileText, Filter, MoreHorizontal, X } from 'lucide-react';
import { NewTaskModal } from '../components/NewTaskModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { generateObjectivePDF } from '../lib/pdfGenerator';
import { TerrainView } from '../components/TerrainView';

export function Tasks() {
  const objectives = useStore((state) => state.objectives);
  const sites = useStore((state) => state.sites);
  const users = useStore((state) => state.users);
  const searchQuery = useStore((state) => state.searchQuery) || '';
  const currentUser = useStore((state) => state.currentUser);
  const hasPermission = useStore((state) => state.hasPermission);
  const reportConfig = useStore((state) => state.reportConfig);
  const companyInfo = useStore((state) => state.companyInfo);
  const { tasksFilters, setTasksFilters, resetTasksFilters } = useStore();

  const memoObjectives = React.useMemo(() => objectives || [], [objectives]);
  const memoSites = React.useMemo(() => sites || [], [sites]);
  const memoUsers = React.useMemo(() => users || [], [users]);

  // Destructure persisted filters
  const filter = tasksFilters.statusFilter;
  const siteFilter = tasksFilters.siteFilter;
  const priorityFilter = tasksFilters.priorityFilter;
  const setFilter = (v: string) => setTasksFilters({ statusFilter: v });
  const setSiteFilter = (v: string) => setTasksFilters({ siteFilter: v });
  const setPriorityFilter = (v: string) => setTasksFilters({ priorityFilter: v });

  const [showFilters, setShowFilters] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isFiltered = filter !== 'all' || siteFilter !== 'all' || priorityFilter !== 'all';

  const [searchParams, setSearchParams] = useSearchParams();
  const urlTaskId = searchParams.get('taskId');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(urlTaskId);

  React.useEffect(() => {
    if (urlTaskId) {
      setSelectedTaskId(urlTaskId);
    }
  }, [urlTaskId]);

  const handleCloseDetails = () => {
    setSelectedTaskId(null);
    setSearchParams(params => {
      const newParams = new URLSearchParams(params);
      newParams.delete('taskId');
      return newParams;
    });
  };

  const filteredObjectives = React.useMemo(() => {
    return (memoObjectives || []).filter((t) => {
      // Strict exclusion of Sourcing (Consultation Fournisseur) from operational list
      if (t.type === 'Consultation Fournisseur') return false;

      // 1. Périmètre des Sites (Scope)
      if (currentUser?.siteIds && currentUser.siteIds.length > 0) {
        if (!currentUser.siteIds.includes(t.siteId)) return false;
      } else if (currentUser?.siteId && currentUser.role !== 'Admin' && currentUser.role !== 'Responsable Global') {
        if (t.siteId !== currentUser.siteId) return false;
      }

      if (filter === 'active' && t.status === 'Terminé') return false;
      if (filter === 'completed' && t.status !== 'Terminé') return false;
      if (siteFilter !== 'all' && t.siteId !== siteFilter) return false;
      if (priorityFilter !== 'all' && t.priority !== priorityFilter) return false;

      // search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const site = (memoSites || []).find((s) => s.id === t.siteId);
        const assignee = (memoUsers || []).find((u) => u.id === t.assigneeId);
        const matchesTitle = t.title.toLowerCase().includes(query);
        const matchesDesc = (t.description || '').toLowerCase().includes(query);
        const matchesSite = (site?.name || '').toLowerCase().includes(query);
        const matchesAssignee = (assignee?.name || '').toLowerCase().includes(query);
        const matchesId = t.id.toLowerCase().includes(query);

        if (!matchesTitle && !matchesDesc && !matchesSite && !matchesAssignee && !matchesId) {
          return false;
        }
      }

      return true;
    });
  }, [memoObjectives, filter, siteFilter, priorityFilter, searchQuery, memoSites, memoUsers, currentUser]);

  const canCreate = hasPermission?.(currentUser, 'tasks.create') ?? false;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Suivi des Opérations</h1>
          <p className="text-slate-400 mt-1">Gérez vos opérations industrielles et procédures standards</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`border px-3 py-2 rounded-md text-sm transition-colors flex items-center gap-2 relative ${showFilters ? 'bg-slate-800 border-slate-700 text-slate-50' : 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-300'}`}
          >
            <Filter className="w-4 h-4" />
            Filtrer
            {isFiltered && (
              <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 bg-emerald-500 text-slate-950 font-black text-[8px] rounded-full flex items-center justify-center border border-slate-950">
                !
              </span>
            )}
          </button>
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/50 hover:bg-emerald-500/20 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              + Nouvelle Opération
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 border-b border-slate-800 pb-4">
        <button
          onClick={() => setFilter('all')}
          className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${filter === 'all' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Tous
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${filter === 'active' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          En cours
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`text-sm font-medium px-4 py-2 rounded-full transition-colors ${filter === 'completed' ? 'bg-slate-800 text-slate-50' : 'text-slate-400 hover:text-slate-200'}`}
        >
          Atteints
        </button>
      </div>

      {showFilters && (
        <div className="flex flex-wrap gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-lg animate-in fade-in slide-in-from-top-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Site</label>
            <select
              title="Filtrer par site"
              value={siteFilter}
              onChange={(e) => setSiteFilter(e.target.value)}
              className="block w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Tous les sites {currentUser?.siteIds ? `(${currentUser.siteIds.length})` : ''}</option>
              {(sites || [])
                .filter(s => !currentUser?.siteIds || currentUser.siteIds.length === 0 || currentUser.siteIds.includes(s.id))
                .map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-400">Priorité</label>
            <select
              title="Filtrer par priorité"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="block w-full bg-slate-950 border border-slate-800 rounded-md px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            >
              <option value="all">Toutes les priorités</option>
              <option value="Faible">Faible</option>
              <option value="Normale">Normale</option>
              <option value="Haute">Haute</option>
              <option value="Urgent">Urgent</option>
            </select>
          </div>
          {isFiltered && (
            <div className="flex items-end">
              <button
                onClick={resetTasksFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-md transition-colors"
              >
                <X className="w-3 h-3" />
                Réinitialiser
              </button>
            </div>
          )}
        </div>
      )}

      <div className="hidden md:grid gap-4">
        {filteredObjectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-slate-900/50 border border-dashed border-slate-700 rounded-xl">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-xl font-semibold text-slate-200">Aucune opération trouvée</h3>
            <p className="text-slate-400 mt-2 max-w-md">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}" avec les critères sélectionnés.`
                : "Vous n'avez pas encore d'opérations assignées."}
            </p>
          </div>
        ) : (
          filteredObjectives.map((objective) => {
            const site = (memoSites || []).find((s) => s.id === objective.siteId);
            const assignee = (memoUsers || []).find((u) => u.id === objective.assigneeId);
            const manager = (memoUsers || []).find((u) => u.id === objective.managerId);

            return (
              <Card
                key={objective.id}
                onClick={() => setSelectedTaskId(objective.id)}
                className={`bg-slate-900/50 border-slate-800 hover:border-slate-700 transition-colors group cursor-pointer relative overflow-hidden`}
              >
                {/* Health Indicator bar */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  objective.status === 'En validation' ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)]' :
                  objective.healthStatus === 'Critique' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' :
                  objective.healthStatus === 'Attention' ? 'bg-amber-500' : 'bg-emerald-500'
                }`} />

                <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="outline" className="font-mono text-[10px] border-slate-800">
                            {objective.type}
                          </Badge>
                          <Badge
                            variant={
                              objective.status === 'Terminé'
                                ? 'success'
                                : objective.status === 'Bloqué' || objective.status === 'En retard'
                                  ? 'destructive'
                                  : objective.status === 'En validation'
                                    ? 'warning'
                                    : 'default'
                            }
                          >
                            {objective.status}
                          </Badge>
                          {objective.priority === 'Urgent' && (
                            <Badge variant="destructive" className="animate-pulse">URGENT</Badge>
                          )}
                          {objective.status === 'En validation' && (
                            <Badge className="bg-amber-500 text-slate-950 font-black animate-pulse">REVUE REQUISE</Badge>
                          )}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-200 group-hover:text-emerald-400 transition-colors">
                          {objective.title}
                        </h3>
                        <p className="text-sm text-slate-400 mt-1 line-clamp-2">{objective.description}</p>
                      </div>
                      <button title="Plus d'options" className="text-slate-500 hover:text-slate-300 p-1 rounded hover:bg-slate-800">
                        <MoreHorizontal className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-sm text-slate-400">
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Porteur</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 border border-slate-700">
                            <AvatarImage src={assignee?.avatar} />
                            <AvatarFallback>{assignee?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-slate-300">{assignee?.name}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Donneur d'ordre</span>
                        <div className="flex items-center gap-2">
                          <Avatar className="w-5 h-5 border border-slate-800 opacity-80">
                            <AvatarImage src={manager?.avatar} />
                            <AvatarFallback>{manager?.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-xs italic">{manager?.name}</span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Échéance</span>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className={new Date(objective.dueDate) < new Date() && objective.status !== 'Terminé' ? 'text-red-400 font-bold' : ''}>
                            {format(new Date(objective.dueDate), 'dd MMM yyyy', { locale: fr })}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] uppercase tracking-wider text-slate-600 font-bold">Risque</span>
                        <div className="flex items-center gap-2">
                          <span className={`text-[11px] font-black ${
                            objective.riskScore > 70 ? 'text-red-500' :
                            objective.riskScore > 40 ? 'text-amber-500' : 'text-emerald-500'
                          }`}>{objective.riskScore}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="sm:w-64 border-t sm:border-t-0 sm:border-l border-slate-800 pt-4 sm:pt-0 sm:pl-6 flex flex-col justify-center">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Plan d'action</h4>
                      {objective.workflow && objective.workflow.length > 0 && (
                        <span className="text-xs font-bold text-emerald-500">
                          {Math.round(((objective.workflow || []).filter((s) => s.status === 'Validé').length / (objective.workflow?.length || 1)) * 100)}%
                        </span>
                      )}
                    </div>

                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden mb-4">
                      <div
                        className={`h-full bg-emerald-500 transition-all duration-300 w-p-${Math.round(
                          ((objective.workflow || []).filter((s) => s.status === 'Validé').length / (objective.workflow?.length || 1)) * 20
                        ) * 5}`}
                      />
                    </div>

                    <div className="space-y-2">
                      {(objective.workflow || []).slice(0, 4).map((step) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full ${
                            step.status === 'Validé' ? 'bg-emerald-500' : 
                            step.status === 'En traitement' ? 'bg-blue-500 animate-pulse' : 
                            step.status === 'Bloqué' ? 'bg-red-500' : 'bg-slate-700'
                          }`} />
                          <span className={`text-[11px] truncate ${step.status === 'Validé' ? 'text-slate-500 line-through' : 'text-slate-400'}`}>
                            {step.title}
                          </span>
                        </div>
                      ))}
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const managerUser = (memoUsers || []).find(u => u.id === objective.managerId);
                        generateObjectivePDF(objective, site, assignee, managerUser, (memoUsers || []), reportConfig, companyInfo);
                      }}
                      className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors border border-slate-800"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Dossier PDF
                    </button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      <div className="md:hidden">
        <TerrainView onSelectTask={setSelectedTaskId} />
      </div>
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <TaskDetailsModal taskId={selectedTaskId} isOpen={!!selectedTaskId} onClose={handleCloseDetails} />
    </div>
  );
}
