import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Activity, ShieldCheck, Zap, AlertCircle, GraduationCap } from 'lucide-react';
import { Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { format } from 'date-fns';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { NewTaskModal } from '../components/NewTaskModal';
import { TaskDetailsModal } from '../components/TaskDetailsModal';
import { PerformanceInsights } from '../components/admin/PerformanceInsights';
import { generateCOMEXReport } from '../lib/pdfGenerator';
import { FileText, LayoutGrid, BarChart3 } from 'lucide-react';
import { FocusModeView } from '../components/FocusModeView';
import { PerformanceDashboard } from '../components/PerformanceDashboard';
import { AnimatePresence, motion } from 'framer-motion';
import { InfoTooltip } from '../components/ui/InfoTooltip';

export function Dashboard() {
  const { objectives, sites, users, currentUser, hasPermission, reportConfig, companyInfo, isLearningMode, toggleLearningMode, setActiveSite, dashboardWidgetOrder, setDashboardWidgetOrder } = useStore();
  const canCreate = hasPermission(currentUser, 'tasks.create');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [siteFilter, setSiteFilter] = useState('all');
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'operations' | 'performance'>('operations');

  const isManager = currentUser?.role === 'Admin' || currentUser?.role === 'Responsable Global' || currentUser?.role === 'Responsable Local';

  const filteredObjectives = React.useMemo(() => {
    return (objectives || []).filter((t) => {
      // Ignore Sourcing in Dashboard analytics
      if (t.type === 'Consultation Fournisseur') return false;

      // 1. Permission de base (Collaborateur ne voit que ses tâches)
      if (currentUser?.role === 'Collaborateur' && t.assigneeId !== currentUser.id) return false;
      
      // 2. Périmètre des Sites (Scope)
      // Si l'utilisateur a des sites assignés, il ne voit que ceux-là
      if (currentUser?.siteIds && currentUser.siteIds.length > 0) {
        if (!currentUser.siteIds.includes(t.siteId)) return false;
      } else if (currentUser?.siteId && currentUser.role !== 'Admin' && currentUser.role !== 'Responsable Global') {
        // Fallback legacy
        if (t.siteId !== currentUser.siteId) return false;
      }

      // 3. Filtre Manuel du Dashboard
      const matchSite = siteFilter === 'all' || t.siteId === siteFilter;
      return matchSite;
    });
  }, [objectives, currentUser, siteFilter]);

  const stats = React.useMemo(() => ({
    total: filteredObjectives.length,
    completed: filteredObjectives.filter(o => o.status === 'Terminé').length,
    critical: filteredObjectives.filter(o => o.healthStatus === 'Critique').length,
    inProgress: filteredObjectives.filter(o => o.status === 'En cours' || o.status === 'En validation').length,
    healthRate: filteredObjectives.length > 0 
      ? Math.round((filteredObjectives.filter(o => o.healthStatus === 'Stable').length / filteredObjectives.length) * 100)
      : 100
  }), [filteredObjectives]);

  const healthData = React.useMemo(() => [
    { name: 'Stable', value: filteredObjectives.filter(o => o.healthStatus === 'Stable').length, color: '#10b981' },
    { name: 'Attention', value: filteredObjectives.filter(o => o.healthStatus === 'Attention').length, color: '#f59e0b' },
    { name: 'Critique', value: filteredObjectives.filter(o => o.healthStatus === 'Critique').length, color: '#ef4444' },
  ], [filteredObjectives]);

  const criticalAlerts = React.useMemo(() => {
    return (filteredObjectives || [])
      .filter(o => o.healthStatus === 'Critique' || (o.healthStatus === 'Attention' && new Date(o.dueDate) < new Date()))
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [filteredObjectives]);

  const getDashboardTitle = () => {
    if (viewMode === 'performance') return 'Intelligence & Performance Équipe';
    switch (currentUser?.role) {
      case 'Admin': return 'Pilotage Industriel (Admin)';
      case 'Responsable Global': return 'Suivi Multi-Sites PUMA';
      case 'Responsable Local': return 'Pilotage Opérationnel Site';
      case 'Collaborateur': return 'Mon Plan de Charge';
      default: return 'Tableau de bord';
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(dashboardWidgetOrder);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setDashboardWidgetOrder(items);
  };

  const renderWidget = (id: string) => {
    switch (id) {
      case 'healthRate':
        return (
          <Card className="glass-panel relative overflow-hidden group border-emerald-500/20 h-full">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
              <ShieldCheck className="w-16 h-16 text-emerald-500" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Taux de Santé</CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`text-4xl font-black ${stats.healthRate > 80 ? 'text-emerald-500' : 'text-amber-500'}`}>{stats.healthRate}%</div>
              <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">Opérations en zone verte</p>
            </CardContent>
          </Card>
        );
      case 'inProgress':
        return (
          <Card className="glass-panel border-blue-500/20 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">En Traitement</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-blue-500">{stats.inProgress}</div>
              <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">Missions actives</p>
            </CardContent>
          </Card>
        );
      case 'critical':
        return (
          <Card className="glass-panel border-red-500/20 h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-red-500 uppercase tracking-widest">Alertes Critiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-red-500">{stats.critical}</div>
              <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">Action immédiate requise</p>
            </CardContent>
          </Card>
        );
      case 'completed':
        return (
          <Card className="glass-panel h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Score de Livraison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-50">{stats.completed}</div>
              <p className="text-[10px] text-slate-600 mt-2 font-bold uppercase tracking-tighter">Opérations atteintes (MTD)</p>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 border-b border-slate-800 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tighter text-slate-50 uppercase">{getDashboardTitle()}</h1>
          <p className="text-slate-500 mt-1 font-medium italic">
            {viewMode === 'performance' ? 'Analyse de rentabilité et benchmarking inter-sites' : 'Performance industrielle & Santé des opérations opérationnelles'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Dual Dashboard Switcher for Managers */}
          {isManager && (
            <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={toggleLearningMode}
                className={`p-2 rounded-lg transition-all flex items-center gap-2 group ${
                  isLearningMode ? 'bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'text-slate-500 hover:text-slate-300'
                }`}
                title={isLearningMode ? "Désactiver le Mode Apprentissage" : "Activer le Mode Apprentissage"}
              >
                <GraduationCap className={`w-4 h-4 ${isLearningMode ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-black uppercase tracking-widest hidden md:block">Guide</span>
              </button>

              <div className="w-px h-4 bg-slate-800 mx-1" />

              <button 
                onClick={() => setViewMode('operations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'operations' ? 'bg-emerald-500 text-emerald-950 shadow-[0_0_20px_rgba(16,185,129,0.3)]' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" /> Opérations
              </button>
              <button 
                onClick={() => setViewMode('performance')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                  viewMode === 'performance' ? 'bg-blue-500 text-blue-950 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" /> Performance
              </button>
            </div>
          )}

          <div className="flex items-center gap-3">
            {viewMode === 'operations' && (
              <select
                title="Filtrer par site"
                value={siteFilter}
                onChange={(e) => setSiteFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-lg px-4 py-2 text-xs font-bold uppercase tracking-widest text-slate-400 focus:ring-2 focus:ring-emerald-500/50"
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
            )}
            
            {/* Multi-Site Active Selector for User Session */}
            {currentUser?.siteIds && currentUser.siteIds.length > 1 && (
              <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-emerald-500/30 rounded-xl">
                <span className="text-[8px] font-black text-emerald-500 uppercase">Site Actif</span>
                <select
                  title="Changer de site actif"
                  value={currentUser.siteId}
                  onChange={(e) => setActiveSite(e.target.value)}
                  className="bg-transparent border-none text-[10px] font-black text-slate-200 uppercase outline-none cursor-pointer"
                >
                  {sites.filter(s => currentUser.siteIds?.includes(s.id)).map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}
            
            {isManager && (
              <button
                onClick={() => generateCOMEXReport(objectives, sites, users, reportConfig, companyInfo)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 border border-slate-700"
              >
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                Rapport COMEX
              </button>
            )}

            {currentUser?.role === 'Collaborateur' && (
              <button
                onClick={() => {
                  const nextTask = filteredObjectives.find(o => o.status === 'En cours') || filteredObjectives.find(o => o.status === 'Nouveau');
                  if (nextTask) setFocusTaskId(nextTask.id);
                  else alert("Aucune tâche en cours ou à démarrer !");
                }}
                className="bg-blue-500 hover:bg-blue-400 text-blue-950 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all glow-blue border border-blue-400/50 flex items-center gap-2"
              >
                <Zap className="w-4 h-4" /> Mode Focus
              </button>
            )}

            {canCreate && (
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all glow-emerald hover:glow-emerald-strong border border-emerald-400/50"
              >
                + Nouvelle Opération
              </button>
            )}
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'performance' ? (
          <motion.div 
            key="perf"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <PerformanceDashboard />
          </motion.div>
        ) : (
          <motion.div 
            key="ops"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className="space-y-8"
          >
            {/* KPI Cards */}
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="kpi-cards" direction="horizontal">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                  >
                    {dashboardWidgetOrder.map((id, index) => (
                      <Draggable key={id} draggableId={id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`transition-shadow ${snapshot.isDragging ? 'shadow-2xl z-50 ring-2 ring-emerald-500/20' : ''}`}
                            style={{
                              ...provided.draggableProps.style,
                              cursor: 'grab'
                            }}
                          >
                            {renderWidget(id)}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Health Chart */}
              <Card className="glass-panel">
                <CardHeader>
                  <CardTitle className="text-sm font-bold text-slate-200 uppercase tracking-widest">Répartition Santé (Global)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px] flex items-center justify-center relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={healthData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {healthData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] text-slate-500 font-bold uppercase">Index</span>
                    <Activity className="w-5 h-5 text-emerald-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Recent Objectives */}
              <Card className="lg:col-span-2 glass-panel">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold text-slate-200 uppercase tracking-widest">Dernières Missions Lancées</CardTitle>
                  <Zap className="w-4 h-4 text-amber-500" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {filteredObjectives.slice(0, 5).map((obj) => (
                    <div
                      key={obj.id}
                      onClick={() => setSelectedTaskId(obj.id)}
                      className="flex items-center gap-4 p-4 rounded-xl glass-panel hover:glass-panel-active transition-all cursor-pointer group"
                    >
                      <div className={`w-1.5 h-8 rounded-full ${
                        obj.healthStatus === 'Critique' ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.3)]' : 
                        obj.healthStatus === 'Attention' ? 'bg-amber-500' : 'bg-emerald-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-mono text-slate-600">#{obj.id.toUpperCase()}</span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tighter">{obj.type}</span>
                        </div>
                        <p className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors truncate">{obj.title}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{obj.status}</p>
                        <p className="text-[10px] text-slate-600 mt-1 font-medium italic">{format(new Date(obj.dueDate), 'dd MMM yyyy')}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {isManager && criticalAlerts.length > 0 && (
              <section className="space-y-4">
                <div className="flex items-center gap-3 px-1">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-100 uppercase tracking-tighter flex items-center">
                    Alertes de Pilotage Prioritaires
                    <InfoTooltip 
                      title="Alertes Critiques"
                      definition="Tâches bloquées ou ayant dépassé le délai SLA."
                      impact="Nécessite une intervention immédiate pour éviter un arrêt de production."
                    />
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {criticalAlerts.slice(0, 6).map(obj => {
                    const assignee = users.find(u => u.id === obj.assigneeId);
                    return (
                      <Card 
                        key={obj.id} 
                        onClick={() => setSelectedTaskId(obj.id)}
                        className="bg-slate-950/40 border-red-500/20 hover:border-red-500/40 transition-all cursor-pointer group"
                      >
                        <CardContent className="p-5">
                          <div className="flex items-center justify-between mb-4">
                            <Badge variant="destructive" className="text-[8px] font-black uppercase tracking-widest">Critique</Badge>
                            <span className="text-[10px] font-mono text-slate-600">#{obj.id.toUpperCase()}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-200 mb-2 group-hover:text-red-400 transition-colors">{obj.title}</h4>
                          <div className="flex items-center gap-3 mt-4 pt-4 border-t border-slate-900">
                            <Avatar className="w-6 h-6 border border-slate-800">
                              <AvatarImage src={assignee?.avatar} />
                              <AvatarFallback className="text-[10px]">{assignee?.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0 text-right">
                              <p className="text-[10px] text-red-500/70 font-bold uppercase">Échéance</p>
                              <p className="text-[11px] font-black text-red-500">{format(new Date(obj.dueDate), 'dd/MM/yy')}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </section>
            )}

            <section className="space-y-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h2 className="text-xl font-bold text-slate-50 flex items-center">
                      Suivi Opérationnel
                      <InfoTooltip 
                        title="Liste des Tâches"
                        definition="Vue d'ensemble de tous les flux d'achats et de maintenance en cours."
                        impact="Garantit une visibilité totale sur chaque étape du processus."
                      />
                    </h2>
                    <p className="text-sm text-slate-500">Pilotage des flux en temps réel</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(objectives || [])
                  .filter(obj => siteFilter === 'all' || obj.siteId === siteFilter)
                  .map((obj, i) => {
                    const assignee = users.find(u => u.id === obj.assigneeId);
                    return (
                      <motion.div
                        key={obj.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                      >
                        <Card 
                          onClick={() => setSelectedTaskId(obj.id)}
                          className="bg-slate-900/40 border-slate-800 hover:border-slate-700 transition-all cursor-pointer group hover:bg-slate-800/20"
                        >
                          <CardContent className="p-6">
                            <div className="flex items-center justify-between mb-4">
                              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-tight bg-slate-950/50 border-slate-800">
                                {obj.type}
                              </Badge>
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${
                                  obj.healthStatus === 'Critique' ? 'bg-red-500' : 
                                  obj.healthStatus === 'Attention' ? 'bg-amber-500' : 'bg-emerald-500'
                                } shadow-[0_0_8px_currentColor]`} />
                                <span className="text-[10px] font-black text-slate-600">#{obj.id.toUpperCase()}</span>
                              </div>
                            </div>

                            <h3 className="text-sm font-bold text-slate-200 mb-6 line-clamp-2 min-h-[40px] group-hover:text-blue-400 transition-colors">
                              {obj.title}
                            </h3>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
                              <div className="flex items-center gap-3">
                                <Avatar className="w-8 h-8 border border-slate-800 group-hover:border-blue-500/50 transition-colors">
                                  <AvatarImage src={assignee?.avatar} />
                                  <AvatarFallback className="text-[10px] font-black bg-slate-950">{assignee?.name.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{assignee?.name.split(' ')[0]}</p>
                                  <p className="text-[9px] font-bold text-slate-600">{assignee?.department}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Échéance</p>
                                <p className="text-[11px] font-black text-slate-400">{format(new Date(obj.dueDate), 'dd/MM/yy')}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
              </div>
            </section>

            {isManager && (
              <section className="space-y-6 pt-12 border-t border-slate-800/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/50 border border-emerald-500/40 flex items-center justify-center glow-emerald">
                    <Activity className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-50 uppercase tracking-tighter">Analytique de Performance Opérationnelle</h3>
                    <p className="text-xs text-slate-500 font-medium italic">Métriques avancées de cycle et respect des SLA par unité.</p>
                  </div>
                </div>
                <PerformanceInsights />
              </section>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      <TaskDetailsModal taskId={selectedTaskId} isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      
      <AnimatePresence>
        {focusTaskId && (
          <FocusModeView 
            task={objectives.find(o => o.id === focusTaskId)!} 
            onClose={() => setFocusTaskId(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
