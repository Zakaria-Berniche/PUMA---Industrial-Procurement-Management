import { StateCreator } from 'zustand';
import { ComparisonMatrix, ComparisonCriteria } from '../../types';
import { api } from '../../lib/api';

export interface AnalysisSettings {
  defaultCriteria: ComparisonCriteria[];
}

export interface AnalysisSlice {
  comparisonMatrices: ComparisonMatrix[];
  analysisSettings: AnalysisSettings;
  addComparisonMatrix: (matrix: ComparisonMatrix) => Promise<void>;
  updateComparisonMatrix: (matrix: ComparisonMatrix) => Promise<void>;
  deleteComparisonMatrix: (matrixId: string) => Promise<void>;
  updateAnalysisSettings: (settings: AnalysisSettings) => Promise<void>;
}

export const createAnalysisSlice: StateCreator<AnalysisSlice, [], [], AnalysisSlice> = (set) => ({
  comparisonMatrices: [],
  analysisSettings: {
    defaultCriteria: [
      { id: 'c1', label: 'Prix Final', weight: 5, type: 'numeric', unit: 'DZD', betterDirection: 'lower' },
      { id: 'c2', label: 'Délai Livraison', weight: 4, type: 'numeric', unit: 'Jours', betterDirection: 'lower' },
      { id: 'c3', label: 'Qualité Technique', weight: 4, type: 'numeric', unit: '/10', betterDirection: 'higher' }
    ]
  },
  
  addComparisonMatrix: async (matrix) => {
    set((state) => ({ comparisonMatrices: [...state.comparisonMatrices, matrix] }));
    await api.post('/comparison_matrices', matrix).catch(console.error);
  },
  
  updateComparisonMatrix: async (matrix) => {
    set((state) => ({
      comparisonMatrices: state.comparisonMatrices.map((m) => (m.id === matrix.id ? matrix : m))
    }));
    await api.put(`/comparison_matrices/${matrix.id}`, matrix).catch(console.error);
  },
  
  deleteComparisonMatrix: async (matrixId) => {
    set((state) => ({
      comparisonMatrices: state.comparisonMatrices.filter((m) => m.id !== matrixId)
    }));
    await api.delete(`/comparison_matrices/${matrixId}`).catch(console.error);
  },

  updateAnalysisSettings: async (settings) => {
    set({ analysisSettings: settings });
    await api.put('/settings/analysis_settings', settings).catch(console.error);
  }
});
