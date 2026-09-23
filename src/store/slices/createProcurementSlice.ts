import { StateCreator } from 'zustand';
import { ProcurementCampaign, ProcurementSupplier, GlobalSupplier } from '../../types';
import { api } from '../../lib/api';

export interface ProcurementSlice {
  procurementCampaigns: ProcurementCampaign[];
  procurementSuppliers: ProcurementSupplier[];
  globalSuppliers: GlobalSupplier[];

  addProcurementCampaign: (campaign: ProcurementCampaign) => void;
  updateProcurementCampaign: (campaign: ProcurementCampaign) => void;
  
  addProcurementSupplier: (supplier: ProcurementSupplier) => void;
  updateProcurementSupplier: (supplier: ProcurementSupplier) => void;

  updateGlobalSupplier: (supplier: GlobalSupplier) => void;
  deleteGlobalSupplier: (supplierId: string) => void;
  deleteProcurementCampaign: (campaignId: string) => void;
  deleteProcurementSupplier: (supplierId: string) => void;
}

export const createProcurementSlice: StateCreator<ProcurementSlice, [], [], ProcurementSlice> = (set) => ({
  procurementCampaigns: [],
  procurementSuppliers: [],
  globalSuppliers: [],

  addProcurementCampaign: async (campaign) => {
    set((state) => ({ procurementCampaigns: [campaign, ...state.procurementCampaigns] }));
    await api.post('/procurement_campaigns', campaign).catch(console.error);
  },

  updateProcurementCampaign: async (campaign) => {
    set((state) => ({
      procurementCampaigns: state.procurementCampaigns.map((c: ProcurementCampaign) => (c.id === campaign.id ? campaign : c))
    }));
    await api.put(`/procurement_campaigns/${campaign.id}`, campaign).catch(console.error);
  },

  addProcurementSupplier: async (supplier) => {
    set((state) => ({ procurementSuppliers: [supplier, ...state.procurementSuppliers] }));
    await api.post('/procurement_suppliers', supplier).catch(console.error);
  },

  updateProcurementSupplier: async (supplier) => {
    set((state) => ({
      procurementSuppliers: state.procurementSuppliers.map((s: ProcurementSupplier) => (s.id === supplier.id ? supplier : s))
    }));
    await api.put(`/procurement_suppliers/${supplier.id}`, supplier).catch(console.error);
  },

  updateGlobalSupplier: async (supplier) => {
    set((state) => ({
      globalSuppliers: state.globalSuppliers.map((s: GlobalSupplier) => (s.id === supplier.id ? supplier : s))
    }));
    await api.put(`/global_suppliers/${supplier.id}`, supplier).catch(console.error);
  },

  deleteGlobalSupplier: async (supplierId) => {
    set((state) => ({
      globalSuppliers: state.globalSuppliers.filter((s: GlobalSupplier) => s.id !== supplierId)
    }));
    await api.delete(`/global_suppliers/${supplierId}`).catch(console.error);
  },
  
  deleteProcurementCampaign: async (campaignId) => {
    set((state) => ({
      procurementCampaigns: state.procurementCampaigns.filter((c: ProcurementCampaign) => c.id !== campaignId),
      procurementSuppliers: state.procurementSuppliers.filter((s: ProcurementSupplier) => s.campaignId !== campaignId)
    }));
    await api.delete(`/procurement_campaigns/${campaignId}`).catch(console.error);
  },

  deleteProcurementSupplier: async (supplierId) => {
    set((state) => ({
      procurementSuppliers: state.procurementSuppliers.filter((s: ProcurementSupplier) => s.id !== supplierId)
    }));
    await api.delete(`/procurement_suppliers/${supplierId}`).catch(console.error);
  }
});
