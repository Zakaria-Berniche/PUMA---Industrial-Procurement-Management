import { StateCreator } from 'zustand';

export interface TasksFilters {
  statusFilter: string;
  siteFilter: string;
  priorityFilter: string;
}

export interface KanbanFilters {
  siteFilter: string;
}

export interface UISlice {
  tasksFilters: TasksFilters;
  kanbanFilters: KanbanFilters;
  setTasksFilters: (filters: Partial<TasksFilters>) => void;
  setKanbanFilters: (filters: Partial<KanbanFilters>) => void;
  resetTasksFilters: () => void;
}

const defaultTasksFilters: TasksFilters = {
  statusFilter: 'all',
  siteFilter: 'all',
  priorityFilter: 'all'
};

const defaultKanbanFilters: KanbanFilters = {
  siteFilter: 'all'
};

export const createUISlice: StateCreator<UISlice> = (set) => ({
  tasksFilters: defaultTasksFilters,
  kanbanFilters: defaultKanbanFilters,

  setTasksFilters: (filters) =>
    set((state) => ({
      tasksFilters: { ...state.tasksFilters, ...filters }
    })),

  setKanbanFilters: (filters) =>
    set((state) => ({
      kanbanFilters: { ...state.kanbanFilters, ...filters }
    })),

  resetTasksFilters: () =>
    set({ tasksFilters: defaultTasksFilters })
});
