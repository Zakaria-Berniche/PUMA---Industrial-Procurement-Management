import React, { useMemo } from 'react';
import { WorkflowBlock, WorkflowStep } from '../types';
import { format, differenceInDays, startOfDay, addDays } from 'date-fns';
import { getDomainColor } from '../lib/utils';

interface GanttChartProps {
  blocks: WorkflowBlock[];
  startDate: string;
  dueDate: string;
}

interface TaskWithOffsets extends WorkflowStep {
  taskStartOffsetInBlock: number;
  taskDuration: number;
}

interface BlockWithOffsets extends Omit<WorkflowBlock, 'tasks'> {
  tasks: WorkflowStep[];
  startOffsetHours: number;
  durationHours: number;
  tasksWithOffsets: TaskWithOffsets[];
}

export function GanttChart({ blocks, startDate, dueDate }: GanttChartProps) {
  const start = startOfDay(new Date(startDate));
  const end = startOfDay(new Date(dueDate));
  const totalDays = Math.max(differenceInDays(end, start) + 1, 14); 

  // Calculate sequential block positions with nested reduce (pure functional)
  const blockData = useMemo(() => {
    const result = (blocks || []).reduce((acc, block) => {
      const blockStart = acc.currentTotalHours;
      
      const taskResult = block.tasks.reduce((tAcc, task) => {
        const duration = task.slaHours || 24;
        return {
          tasks: [...tAcc.tasks, { 
            ...task, 
            taskStartOffsetInBlock: tAcc.totalBlockHours, 
            taskDuration: duration 
          }],
          totalBlockHours: tAcc.totalBlockHours + duration
        };
      }, { tasks: [] as TaskWithOffsets[], totalBlockHours: 0 });

      return {
        blocks: [...acc.blocks, { 
          ...block, 
          startOffsetHours: blockStart, 
          durationHours: taskResult.totalBlockHours, 
          tasksWithOffsets: taskResult.tasks 
        }],
        currentTotalHours: blockStart + taskResult.totalBlockHours
      };
    }, { blocks: [] as BlockWithOffsets[], currentTotalHours: 0 });

    return result.blocks;
  }, [blocks]);

  const days = Array.from({ length: totalDays }, (_, i) => addDays(start, i));

  return (
    <div className="w-full bg-slate-950/50 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full">
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <div className="min-w-[800px]">
          {/* Header Dates */}
          <div className="flex border-b border-slate-800 sticky top-0 bg-slate-950 z-30">
            <div className="w-48 shrink-0 border-r border-slate-800 p-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] bg-slate-950">
              Phases Opérationnelles
            </div>
            <div className="flex-1 flex">
              {days.map((day, i) => (
                <div 
                  key={i} 
                  className={`flex-1 min-w-[30px] border-r border-slate-900/50 p-1 text-center text-[8px] font-black ${
                    day.getDay() === 0 || day.getDay() === 6 ? 'bg-slate-900/50 text-slate-700' : 'text-slate-600'
                  }`}
                >
                  {format(day, 'dd')}
                </div>
              ))}
            </div>
          </div>

          {/* Blocks Rows */}
          <div className="divide-y divide-slate-800/30">
            {blockData.map((block) => {
              const left = (block.startOffsetHours / 24 / totalDays) * 100;
              const width = (block.durationHours / 24 / totalDays) * 100;

              return (
                <div key={block.id} className="flex group hover:bg-slate-900/20 transition-colors">
                  <div className="w-48 shrink-0 border-r border-slate-800 p-4 flex flex-col justify-center">
                    <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest truncate">{block.title}</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      {block.customType && (
                        <span className={`w-1.5 h-1.5 rounded-full domain-dot-${block.id}`} />
                      )}
                      <span className="text-[8px] text-slate-600 uppercase font-bold tracking-tighter">
                        {block.customType || block.type} • {block.tasks.length} tâches
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 relative h-16 flex items-center px-0">
                    {/* Background Grid Lines */}
                    <div className="absolute inset-0 flex pointer-events-none">
                      {days.map((_, i) => (
                        <div key={i} className="flex-1 border-r border-slate-900/20" />
                      ))}
                    </div>
                    
                    {/* Dynamic styling for this block and its tasks to avoid inline styles */}
                    <style>{`
                      .block-bar-${block.id} { left: ${left}%; width: ${width}%; }
                      .progress-label-${block.id} { left: ${left}%; }
                      ${block.customType ? `.domain-dot-${block.id} { background-color: ${getDomainColor(block.customType).base}; }` : ''}
                      ${block.tasksWithOffsets.map(task => {
                        const taskWidth = (task.taskDuration / block.durationHours) * 100;
                        return `.task-bar-${task.id} { width: ${taskWidth}%; }`;
                      }).join('\n')}
                    `}</style>

                    {/* Block Container Bar */}
                    <div className={`absolute h-8 rounded-xl overflow-hidden flex shadow-2xl transition-all block-bar-${block.id}`}>
                      <div className="absolute inset-0 flex">
                        {block.tasksWithOffsets.map((task) => {
                          const statusColor = 
                            task.status === 'Validé' ? 'bg-emerald-500' :
                            task.status === 'Bloqué' ? 'bg-red-500' :
                            task.status === 'Fait' ? 'bg-amber-500 animate-pulse' :
                            task.status === 'En traitement' ? 'bg-blue-500 animate-pulse' :
                            'bg-slate-800';

                          return (
                            <div 
                              key={task.id}
                              className={`${statusColor} h-full border-r border-slate-950/20 relative group/task task-bar-${task.id}`}
                              title={`${task.title} (${task.status})`}
                            >
                              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover/task:opacity-100 transition-opacity" />
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Block Progress Label */}
                    <div className={`absolute top-12 text-[8px] font-black text-slate-500 uppercase tracking-tighter progress-label-${block.id}`}>
                      {Math.round((block.tasks.filter(t => t.status === 'Validé').length / block.tasks.length) * 100)}% Complété
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-[8px] text-slate-600 uppercase font-black">Validé</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500" />
            <span className="text-[8px] text-slate-600 uppercase font-black">En cours</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-[8px] text-slate-600 uppercase font-black">À Valider</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <span className="text-[8px] text-slate-600 uppercase font-black">Bloqué</span>
          </div>
        </div>
        <span className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">Vue "Backbone" - Focus par Bloc Opérationnel</span>
      </div>
    </div>
  );
}
