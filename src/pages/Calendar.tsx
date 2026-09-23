import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameMonth,
  isSameDay,
  isToday,
  addMonths,
  subMonths,
  parseISO
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, AlertCircle } from 'lucide-react';
import { TaskDetailsModal } from '../components/TaskDetailsModal';

export function CalendarView() {
  const { objectives } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  const { days, monthStart } = React.useMemo(() => {
    const ms = startOfMonth(currentDate);
    const me = endOfMonth(ms);
    const sDate = startOfWeek(ms, { weekStartsOn: 1 });
    const eDate = endOfWeek(me, { weekStartsOn: 1 });

    return {
      monthStart: ms,
      days: eachDayOfInterval({ start: sDate, end: eDate })
    };
  }, [currentDate]);

  const dateFormat = 'd';
  const weekDays = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  const { objectivesOfTheDay, importantDeadlines } = React.useMemo(() => {
    const rightNow = new Date();
    const objs = (objectives || []).filter(t => t.type !== 'Consultation Fournisseur');
    return {
      objectivesOfTheDay: objs.filter((t) => isSameDay(parseISO(t.dueDate), rightNow) && t.status !== 'Terminé'),
      importantDeadlines: objs
        .filter((t) => (t.priority === 'Urgent' || t.priority === 'Haute') && t.status !== 'Terminé')
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5)
    };
  }, [objectives]);

  const objectivesByDayStr = React.useMemo(() => {
    const map: Record<string, typeof objectives> = {};
    (objectives || []).filter(t => t.type !== 'Consultation Fournisseur').forEach((obj) => {
      const dayStr = format(parseISO(obj.dueDate), 'yyyy-MM-dd');
      if (!map[dayStr]) map[dayStr] = [];
      map[dayStr].push(obj);
    });
    return map;
  }, [objectives]);

  const getDayObjectives = React.useCallback(
    (day: Date) => {
      const dayStr = format(day, 'yyyy-MM-dd');
      return objectivesByDayStr[dayStr] || [];
    },
    [objectivesByDayStr]
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Urgent': return 'bg-red-500/20 text-red-400 border-red-500/50';
      case 'Haute': return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'Normale': return 'bg-slate-500/20 text-slate-400 border-slate-500/50';
      default: return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-50">Planning des Opérations</h1>
          <p className="text-slate-400 mt-1">Visualisez les échéances critiques de vos missions</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <CalendarIcon className="w-4 h-4 text-emerald-400" />
                Missions du jour ({objectivesOfTheDay.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {objectivesOfTheDay.length === 0 ? (
                <p className="text-xs text-slate-600 italic">Aucune opération à échéance aujourd'hui</p>
              ) : (
                objectivesOfTheDay.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedTaskId(obj.id)}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-slate-200 group-hover:text-emerald-400 transition-colors line-clamp-1">{obj.title}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border whitespace-nowrap uppercase ${getPriorityColor(obj.priority)}`}>
                        {obj.priority}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>{format(parseISO(obj.dueDate), 'HH:mm', { locale: fr })}</span>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="bg-slate-900/50 border-slate-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Alertes Critique (Top 5)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {importantDeadlines.length === 0 ? (
                <p className="text-xs text-slate-600 italic">Aucune alerte prioritaire</p>
              ) : (
                importantDeadlines.map((obj) => (
                  <div
                    key={obj.id}
                    onClick={() => setSelectedTaskId(obj.id)}
                    className="p-3 rounded-xl bg-slate-950 border border-red-500/20 hover:border-red-500/50 cursor-pointer transition-all"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <p className="text-sm font-bold text-slate-200 line-clamp-1">{obj.title}</p>
                    </div>
                    <p className="text-[10px] text-red-500 font-black uppercase">
                      Deadline: {format(parseISO(obj.dueDate), 'd MMM yyyy', { locale: fr })}
                    </p>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Calendar Grid */}
        <div className="lg:col-span-3">
          <Card className="bg-slate-900/50 border-slate-800 h-full flex flex-col overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-4 bg-slate-950/30">
              <CardTitle className="text-xl font-black text-slate-50 uppercase tracking-tighter">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </CardTitle>
              <div className="flex items-center gap-2">
                <button
                  title="Mois précédent"
                  onClick={prevMonth}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-50 transition-colors border border-slate-800"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentDate(new Date())}
                  className="px-4 py-1.5 text-xs font-bold uppercase tracking-widest hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-50 transition-colors border border-slate-800"
                >
                  Aujourd'hui
                </button>
                <button
                  title="Mois suivant"
                  onClick={nextMonth}
                  className="p-2 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-slate-50 transition-colors border border-slate-800"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
              <div className="grid grid-cols-7 gap-px bg-slate-800 border-b border-slate-800">
                {weekDays.map((day) => (
                  <div
                    key={day}
                    className="bg-slate-950 py-3 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest"
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-800 flex-1">
                {days.map((day) => {
                  const dayObjectives = getDayObjectives(day);
                  const isCurrentMonth = isSameMonth(day, monthStart);

                  return (
                    <div
                      key={day.toString()}
                      className={`min-h-[120px] bg-slate-950 p-2 transition-all ${
                        !isCurrentMonth ? 'bg-slate-950/40 opacity-30' : 'text-slate-300'
                      } ${isToday(day) ? 'bg-slate-900/60 ring-1 ring-inset ring-emerald-500/20' : 'hover:bg-slate-900/40'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg ${
                            isToday(day) ? 'bg-emerald-500 text-slate-950 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : ''
                          }`}
                        >
                          {format(day, dateFormat)}
                        </span>
                        {dayObjectives.length > 0 && (
                          <span className="text-[9px] font-black bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded-full border border-slate-800">
                            {dayObjectives.length}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1 overflow-y-auto max-h-[90px] pr-1 custom-scrollbar">
                        {dayObjectives.map((obj) => (
                          <div
                            key={obj.id}
                            onClick={() => setSelectedTaskId(obj.id)}
                            title={obj.title}
                            className={`text-[10px] font-medium px-2 py-1 rounded-md truncate cursor-pointer transition-all border ${
                              obj.status === 'Terminé'
                                ? 'bg-emerald-500/10 text-emerald-500/50 border-emerald-500/10 line-through'
                                : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600 hover:bg-slate-800'
                            }`}
                          >
                            {obj.title}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {selectedTaskId && (
        <TaskDetailsModal taskId={selectedTaskId} isOpen={!!selectedTaskId} onClose={() => setSelectedTaskId(null)} />
      )}
    </div>
  );
}
