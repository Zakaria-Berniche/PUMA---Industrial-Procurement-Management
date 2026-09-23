import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useStore } from '../store/useStore';
import { ObjectiveStatus, Objective } from '../types';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Calendar as CalendarIcon, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { NewTaskModal } from '../components/NewTaskModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';

const columns: { id: ObjectiveStatus; title: string; color: string }[] = [
  { id: 'Nouveau', title: 'Nouveau', color: 'bg-slate-500' },
  { id: 'En cours', title: 'En cours', color: 'bg-blue-500' },
  { id: 'En validation', title: 'Validation', color: 'bg-amber-500' },
  { id: 'Terminé', title: 'Atteint', color: 'bg-emerald-500' }
];

export function Kanban() {
  const { objectives, updateObjectiveStatus, users, sites, searchQuery, currentUser, hasPermission, kanbanFilters, setKanbanFilters } = useStore();
  const [localObjectives, setLocalObjectives] = useState<Objective[]>(objectives || []);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const siteFilter = kanbanFilters.siteFilter;
  const setSiteFilter = (v: string) => setKanbanFilters({ siteFilter: v });

  const canCreate = hasPermission(currentUser, 'tasks.create');
  const canEdit = hasPermission(currentUser, 'tasks.edit');

  React.useEffect(() => {
    setLocalObjectives(objectives || []);
  }, [objectives]);

  const onDragEnd = (result: DropResult) => {
    if (!canEdit) return;

    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as ObjectiveStatus;

    const newObjectives = Array.from(localObjectives);
    const index = newObjectives.findIndex((o) => o.id === draggableId);
    if (index > -1) {
      const moved = { ...newObjectives[index], status: newStatus };
      newObjectives.splice(index, 1);
      newObjectives.splice(destination.index, 0, moved);
      setLocalObjectives(newObjectives);

      updateObjectiveStatus(draggableId, newStatus);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'destructive';
      case 'Haute': return 'warning';
      case 'Normale': return 'secondary';
      default: return 'outline';
    }
  };

  const displayObjectives = React.useMemo(() => {
    return (localObjectives || []).filter((t) => {
      // Strict exclusion of Sourcing (Consultation Fournisseur) from Kanban
      if (t.type === 'Consultation Fournisseur') return false;
      
      if (siteFilter !== 'all' && t.siteId !== siteFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const site = (sites || []).find((s) => s.id === t.siteId);
        const assignee = (users || []).find((u) => u.id === t.assigneeId);
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
  }, [localObjectives, siteFilter, searchQuery, sites, users]);

  const objectivesByColumn = React.useMemo(() => {
    return columns.reduce(
      (acc, col) => {
        acc[col.id] = displayObjectives.filter((t) => t.status === col.id);
        return acc;
      },
      {} as Record<string, typeof displayObjectives>
    );
  }, [displayObjectives]);

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Gestion de Flux (Kanban)</h1>
          <p className="text-slate-400 mt-1">Pilotez vos opérations industrielles par glisser-déposer</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            title="Filtrer par site"
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-md px-3 py-1.5 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 hidden sm:block"
          >
            <option value="all">Tous les sites</option>
            {(sites || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          {canCreate && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/50 hover:bg-emerald-500/20 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-[0_0_15px_rgba(16,185,129,0.2)]"
            >
              + Nouvelle Opération
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4">
        {displayObjectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center h-full bg-slate-900/50 border border-dashed border-slate-700 rounded-xl max-w-2xl mt-12 mb-auto mx-auto w-full">
            <h3 className="text-xl font-semibold text-slate-200">Aucune opération trouvée</h3>
            <p className="text-slate-400 mt-2">
              {searchQuery
                ? `Aucun résultat pour "${searchQuery}" avec le site sélectionné.`
                : "Vous n'avez pas encore d'opérations."}
            </p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="flex gap-6 h-full items-start min-w-max">
              {columns.map((column) => {
                const columnTasks = objectivesByColumn[column.id] || [];
                return (
                  <div key={column.id} className="w-80 flex flex-col h-full max-h-full">
                    <div className="flex items-center justify-between mb-4 px-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${column.color} shadow-[0_0_8px_rgba(255,255,255,0.2)]`} />
                        <h3 className="font-bold text-sm uppercase tracking-widest text-slate-400">{column.title}</h3>
                      </div>
                      <Badge variant="secondary" className="bg-slate-800 text-slate-400 text-[10px]">
                        {columnTasks.length}
                      </Badge>
                    </div>

                    <Droppable droppableId={column.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 overflow-y-auto rounded-2xl bg-slate-900/40 border border-slate-800/60 p-3 transition-colors min-h-[500px] ${
                            snapshot.isDraggingOver ? 'bg-slate-800/40 border-slate-700/60' : ''
                          }`}
                        >
                          <div className="space-y-3">
                            {columnTasks.map((objective, index) => {
                              const assignee = users.find((u) => u.id === objective.assigneeId);
                              return (
                                <Draggable key={objective.id} draggableId={objective.id} index={index} isDragDisabled={!canEdit}>
                                  {(provided, snapshot) => (
                                    <Card
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      {...provided.dragHandleProps}
                                      onClick={() => setSelectedTaskId(objective.id)}
                                      className={`bg-slate-950 border-slate-800 cursor-grab active:cursor-grabbing hover:border-slate-700 transition-all relative overflow-hidden ${
                                        snapshot.isDragging
                                          ? 'shadow-2xl shadow-black/80 ring-2 ring-emerald-500/50 rotate-2 z-50'
                                          : ''
                                      }`}
                                    >
                                      {/* Health Glow */}
                                      <div className={`absolute top-0 right-0 w-16 h-16 opacity-5 blur-2xl ${
                                        objective.healthStatus === 'Critique' ? 'bg-red-500' : 
                                        objective.healthStatus === 'Attention' ? 'bg-amber-500' : 'bg-emerald-500'
                                      }`} />
                                      
                                      <CardContent className="p-4">
                                        <div className="flex items-start justify-between gap-2 mb-3">
                                          <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full ${
                                              objective.healthStatus === 'Critique' ? 'bg-red-500' : 
                                              objective.healthStatus === 'Attention' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`} />
                                            <Badge
                                              variant="outline"
                                              className="text-[9px] px-1.5 py-0 uppercase tracking-tighter border-slate-800 bg-slate-900"
                                            >
                                              {objective.type}
                                            </Badge>
                                            <Badge
                                              variant={getPriorityColor(objective.priority)}
                                              className="text-[8px] px-1 py-0 uppercase tracking-tighter"
                                            >
                                              {objective.priority}
                                            </Badge>
                                          </div>
                                          <span className="text-[10px] text-slate-600 font-mono">
                                            #{objective.id.toUpperCase()}
                                          </span>
                                        </div>

                                        <h4 className="text-sm font-bold text-slate-200 mb-2 leading-snug">
                                          {objective.title}
                                        </h4>

                                        {objective.workflow && objective.workflow.length > 0 && (
                                          <div className="mt-3 mb-1">
                                            <div className="flex items-center justify-between text-[9px] text-slate-600 mb-1 font-bold uppercase tracking-tighter">
                                              <span>Progression</span>
                                              <span>
                                                {Math.round(((objective.workflow || []).filter((s) => s.status === 'Validé').length / (objective.workflow?.length || 1)) * 100)}%
                                              </span>
                                            </div>
                                            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden">
                                              <div
                                                className={`h-full bg-emerald-500 transition-all duration-300 w-p-${Math.round(
                                                  ((objective.workflow || []).filter((s) => s.status === 'Validé').length / (objective.workflow?.length || 1)) * 20
                                                ) * 5}`}
                                              />
                                            </div>
                                          </div>
                                        )}

                                        <div className="flex items-center gap-3 mt-4 text-slate-500">
                                          <div className="flex items-center gap-1.5 text-[10px]">
                                            <CalendarIcon className="w-3 h-3" />
                                            <span className={new Date(objective.dueDate) < new Date() ? 'text-red-500' : ''}>
                                              {format(new Date(objective.dueDate), 'dd MMM', { locale: fr })}
                                            </span>
                                          </div>
                                          {objective.auditLog && objective.auditLog.length > 0 && (
                                            <div className="flex items-center gap-1 text-[10px]">
                                              <Activity className="w-3 h-3" />
                                              <span>{objective.auditLog.length}</span>
                                            </div>
                                          )}
                                          <div className="flex-1" />
                                          <Avatar className="w-5 h-5 border border-slate-800">
                                            <AvatarImage src={assignee?.avatar} />
                                            <AvatarFallback className="text-[8px]">
                                              {assignee?.name.charAt(0)}
                                            </AvatarFallback>
                                          </Avatar>
                                        </div>
                                        
                                        {currentUser?.id === objective.assigneeId && (
                                          <div className="mt-4 pt-3 border-t border-slate-800/50 flex gap-2">
                                            {objective.status === 'Nouveau' && (
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); updateObjectiveStatus(objective.id, 'En cours'); }}
                                                className="flex-1 bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 py-1.5 rounded text-xs font-bold transition-colors"
                                              >▶ Démarrer</button>
                                            )}
                                            {objective.status === 'En cours' && (
                                              <button 
                                                onClick={(e) => { e.stopPropagation(); updateObjectiveStatus(objective.id, 'En validation'); }}
                                                className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 py-1.5 rounded text-xs font-bold transition-colors"
                                              >✅ Terminer</button>
                                            )}
                                            {(objective.status === 'En cours' || objective.status === 'Nouveau') && (
                                              <button 
                                                onClick={(e) => { 
                                                  e.stopPropagation(); 
                                                  const reason = window.prompt("Motif de blocage ?");
                                                  if (reason) updateObjectiveStatus(objective.id, 'Bloqué'); 
                                                }}
                                                className="flex-none px-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 py-1.5 rounded text-xs font-bold transition-colors"
                                              >⚠️</button>
                                            )}
                                          </div>
                                        )}
                                      </CardContent>
                                    </Card>
                                  )}
                                </Draggable>
                              );
                            })}
                            {provided.placeholder}
                          </div>
                        </div>
                      )}
                    </Droppable>
                  </div>
                );
              })}
            </div>
          </DragDropContext>
        )}
      </div>
      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <TaskDetailsModal taskId={selectedTaskId} isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} />
    </div>
  );
}
