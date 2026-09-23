import { StateCreator } from 'zustand';
import { User, Site, WorkflowTemplate, TaskConfiguration, FunctionalBlock, GlobalRules, AIConfig, ReportConfig } from '../../types';
import { api } from '../../lib/api';

export interface CompanyInfo {
  name: string;
  sector: string;
  logo: string | null;
}

export interface DataSlice {
  users: User[];
  sites: Site[];
  workflowTemplates: WorkflowTemplate[];
  taskConfigurations: TaskConfiguration[];
  functionalBlocks: FunctionalBlock[];
  globalRules: GlobalRules;
  aiConfig: AIConfig;
  reportConfig: ReportConfig;
  companyInfo: CompanyInfo;
  searchQuery: string;
  isLearningMode: boolean;
  dashboardWidgetOrder: string[];

  setSearchQuery: (query: string) => void;
  toggleLearningMode: () => void;
  setDashboardWidgetOrder: (order: string[]) => Promise<void>;

  addUser: (user: User) => void;
  updateUser: (user: User) => void;
  deleteUser: (userId: string) => void;

  addSite: (site: Site) => void;
  updateSite: (site: Site) => void;
  deleteSite: (siteId: string) => void;

  addWorkflowTemplate: (template: WorkflowTemplate) => void;
  updateWorkflowTemplate: (template: WorkflowTemplate) => void;
  deleteWorkflowTemplate: (templateId: string) => void;
  
  addTaskConfiguration: (config: TaskConfiguration) => void;
  updateTaskConfiguration: (config: TaskConfiguration) => void;
  deleteTaskConfiguration: (configId: string) => void;

  updateGlobalRules: (rules: GlobalRules) => void;
  updateAIConfig: (config: AIConfig) => void;
  updateReportConfig: (config: ReportConfig) => void;
  updateCompanyInfo: (info: CompanyInfo) => void;
  addAIFeedback: (isPositive: boolean, feedback?: string) => Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createDataSlice: StateCreator<DataSlice & any, [], [], DataSlice> = (set) => ({
  users: [],
  sites: [],
  workflowTemplates: [],
  taskConfigurations: [],
  functionalBlocks: [
    {
      id: 'fb_analyse',
      name: 'Analyse besoin',
      description: 'Analyse de la demande et spécifications',
      icon: 'Search',
      type: 'Analyse',
      suggestedSlaHours: 24,
      defaultTasks: [
        { title: 'Définir spécifications techniques', isMandatory: true, slaHours: 8 },
        { title: 'Vérifier budget disponible', isMandatory: true, slaHours: 4 },
        { title: 'Valider éligibilité fournisseur', isMandatory: false, slaHours: 12 }
      ]
    },
    {
      id: 'fb_consultation',
      name: 'Consultation fournisseurs',
      description: 'Demande de devis et appels d\'offres',
      icon: 'Send',
      type: 'Consultation',
      suggestedSlaHours: 72,
      defaultTasks: [
        { title: 'Identifier fournisseurs potentiels', isMandatory: true, slaHours: 8 },
        { title: 'Envoyer demandes de prix (RFQ)', isMandatory: true, slaHours: 4 },
        { title: 'Relancer fournisseurs', isMandatory: false, slaHours: 48 },
        { title: 'Recevoir offres', isMandatory: true, slaHours: 12 }
      ]
    },
    {
      id: 'fb_analyse_offres',
      name: 'Analyse offres',
      description: 'Comparaison technique et commerciale',
      icon: 'BarChart2',
      type: 'Analyse',
      suggestedSlaHours: 48,
      defaultTasks: [
        { title: 'Tableau comparatif des offres', isMandatory: true, slaHours: 12 },
        { title: 'Vérification conformité technique', isMandatory: true, slaHours: 24 }
      ]
    },
    {
      id: 'fb_nego',
      name: 'Négociation',
      description: 'Discussion commerciale et conditions',
      icon: 'MessageSquare',
      type: 'Négociation',
      suggestedSlaHours: 48,
      defaultTasks: [
        { title: 'Négociation prix et délais', isMandatory: true, slaHours: 24 },
        { title: 'Définition conditions de paiement', isMandatory: true, slaHours: 8 }
      ]
    },
    {
      id: 'fb_validation',
      name: 'Validation',
      description: 'Approbation hiérarchique et budgétaire',
      icon: 'CheckCircle',
      type: 'Validation',
      suggestedSlaHours: 24,
      defaultTasks: [
        { title: 'Validation direction département', isMandatory: true, slaHours: 12, isValidationRequired: true },
        { title: 'Validation contrôle de gestion', isMandatory: true, slaHours: 12, isValidationRequired: true }
      ]
    },
    {
      id: 'fb_commande',
      name: 'Commande',
      description: 'Création et suivi bon de commande',
      icon: 'FileText',
      type: 'Administratif',
      suggestedSlaHours: 12,
      defaultTasks: [
        { title: 'Émission Bon de Commande (BC)', isMandatory: true, slaHours: 4 },
        { title: 'Confirmation commande fournisseur', isMandatory: true, slaHours: 8 }
      ]
    },
    {
      id: 'fb_livraison',
      name: 'Livraison',
      description: 'Suivi logistique et transport',
      icon: 'Truck',
      type: 'Logistique',
      suggestedSlaHours: 168,
      defaultTasks: [
        { title: 'Suivi expédition', isMandatory: true, slaHours: 24 },
        { title: 'Contrôle documents douaniers', isMandatory: false, slaHours: 48 }
      ]
    },
    {
      id: 'fb_reception',
      name: 'Réception',
      description: 'Contrôle physique et conformité',
      icon: 'Package',
      type: 'Contrôle',
      suggestedSlaHours: 24,
      defaultTasks: [
        { title: 'Contrôle quantitatif', isMandatory: true, slaHours: 4 },
        { title: 'Contrôle qualitatif / PV', isMandatory: true, slaHours: 12 }
      ]
    },
    {
      id: 'fb_douane',
      name: 'Douane & Documents',
      description: 'Gestion des formalités import/export',
      icon: 'ShieldCheck',
      type: 'Logistique',
      suggestedSlaHours: 72,
      defaultTasks: [
        { title: 'Vérification documents douaniers', isMandatory: true, slaHours: 24 },
        { title: 'Paiement taxes et droits', isMandatory: true, slaHours: 12 }
      ]
    },
    {
      id: 'fb_dsi',
      name: 'Validation IT / DSI',
      description: 'Conformité technique et sécurité IT',
      icon: 'ShieldAlert',
      type: 'Validation',
      suggestedSlaHours: 48,
      defaultTasks: [
        { title: 'Analyse compatibilité infra', isMandatory: true, slaHours: 24 },
        { title: 'Approbation sécurité DSI', isMandatory: true, slaHours: 24, isValidationRequired: true }
      ]
    },
    {
      id: 'fb_maintenance',
      name: 'Intervention Technique',
      description: 'Montage, réparation ou maintenance',
      icon: 'Settings',
      type: 'Contrôle',
      suggestedSlaHours: 48,
      defaultTasks: [
        { title: 'Installation équipement', isMandatory: true, slaHours: 24 },
        { title: 'Test de remise en service', isMandatory: true, slaHours: 8 }
      ]
    },
    {
      id: 'fb_contrat',
      name: 'Signature Contrat',
      description: 'Formalisation juridique et signature',
      icon: 'PenTool',
      type: 'Administratif',
      suggestedSlaHours: 120,
      defaultTasks: [
        { title: 'Revue juridique contrat', isMandatory: true, slaHours: 48 },
        { title: 'Signature parties prenantes', isMandatory: true, slaHours: 72, isValidationRequired: true }
      ]
    },
    {
      id: 'fb_stock',
      name: 'Vérification Stock',
      description: 'Disponibilité en magasin interne',
      icon: 'Database',
      type: 'Contrôle',
      suggestedSlaHours: 8,
      defaultTasks: [
        { title: 'Inventaire physique rapide', isMandatory: true, slaHours: 4 },
        { title: 'Vérification ERP stock', isMandatory: true, slaHours: 2 }
      ]
    }
  ],
  globalRules: {
    id: 'global_rules',
    validationThresholdDZD: 500000,
    slaMatrix: {
      Analyse: 24,
      Consultation: 48,
      Validation: 24,
      Négociation: 24,
      Administratif: 24,
      Logistique: 168,
      Contrôle: 24,
      Autre: 24
    },
    urgentModeSlaHours: 4
  },
  aiConfig: {
    id: 'ai_config',
    model: 'gemini-2.5-flash',
    temperature: 0.2,
    sourcingPromptTemplate: `Tu es un agent IA expert en "Procurement & Sourcing B2B" de niveau Senior.
Ta mission est de réaliser un sourcing de haute précision pour la demande suivante :
- Catégorie : {{category}}
- Marque : {{brand}}
- Specs : {{specs}}
- Quantité : {{quantity}}
- Marché : {{market}}

### STRATÉGIE ET ATTENDUS :
1. ANALYSE ET ADAPTATION : Tu dois constamment améliorer la qualité de tes recherches. Analyse le niveau de technicité requis et adapte la précision de tes insights.
2. SOURCING RÉEL : Identifie des entreprises existantes, leaders ou spécialistes. Évalue leur fiabilité (0-100) selon des critères industriels.
3. PRÉCISION LOCALE : Pour le marché Algérien, identifie la Wilaya exacte et fournis des coordonnées simulées mais réalistes.
4. TON ET PRÉSENTATION : Adopte un ton professionnel, structuré et stratégique. Tes insights doivent expliquer la valeur ajoutée du fournisseur (ex: SAV local, stock disponible, exclusivité marque).
5. CANAUX DE CONTACT (NORME ALGÉRIE) : Les coordonnées générées doivent être ultra-réalistes. Les téléphones doivent suivre le format strict '+213 (0) XX XX XX XX' (avec l'indicatif régional fixe réel ou mobile pro). Les emails et sites web doivent utiliser des noms de domaines réalistes ou se terminant par '.dz' ou '-dz.com'. La localisation physique doit mentionner le siège ou le dépôt dans une zone industrielle algérienne réelle (ex: Zone Industrielle de Rouiba, Z.I. Hassi Ameur, Zone des Partenaires Hassi Messaoud).

RETOURNE UNIQUEMENT UN TABLEAU JSON VALIDE (format strict) :
[
  {
    "name": "Nom",
    "reliabilityScore": 85,
    "contactStatus": "pending",
    "quoteAmount": 0,
    "insight": "Analyse stratégique courte",
    "emailDraft": "Email pro complet",
    "phone": "+213...",
    "website": "URL",
    "wilaya": "Wilaya",
    "location": { "lat": 36.75, "lng": 3.05 },
    "strengths": ["Force 1"],
    "weaknesses": ["Faiblesse 1"]
  }
]`,
    refreshPromptTemplate: `Fais une recherche web sur l'entreprise "{{name}}" et retourne ses informations de contact à jour au format JSON :
{
  "phone": "numéro de téléphone",
  "website": "url du site",
  "email": "email de contact",
  "description": "brève description",
  "reliabilityScore": 0-100,
  "wilaya": "Wilaya",
  "location": { "lat": 0, "lng": 0 }
}
RETOURNE UNIQUEMENT LE JSON.`,
    version: 1.0,
    learningLogs: [],
    memoryBuffer: []
  },
  reportConfig: {
    id: 'report_config',
    primaryColor: '#E10600',
    secondaryColor: '#000000',
    fontFamily: 'helvetica',
    showHeader: true,
    showFooter: true,
    footerText: ''
  },
  companyInfo: {
    name: 'PUMA',
    sector: 'Plateforme de gestion des tâches et tickets pour les services Achat et COMEX.',
    logo: '/logo.png'
  },
  searchQuery: '',
  isLearningMode: false,
  dashboardWidgetOrder: ['healthRate', 'inProgress', 'critical', 'completed'],
  setSearchQuery: (query) => set({ searchQuery: query }),
  toggleLearningMode: () => set((state) => ({ isLearningMode: !state.isLearningMode })),
  setDashboardWidgetOrder: async (order) => {
    set({ dashboardWidgetOrder: order });
    await api.put('/settings/dashboard_widget_order', { id: 'dashboard_widget_order', order }).catch(console.error);
  },

  addUser: async (user) => {
    set((state) => ({ users: [...state.users, user] }));
    await api.post('/users', user).catch(console.error);
  },

  updateUser: async (user) => {
    set((state) => ({
      users: state.users.map((u: User) => (u.id === user.id ? user : u)),
      currentUser: state.currentUser?.id === user.id ? user : state.currentUser
    }));
    await api.put(`/users/${user.id}`, user).catch(console.error);
  },

  deleteUser: async (userId) => {
    set((state) => ({
      users: state.users.filter((u: User) => u.id !== userId)
    }));
    await api.delete(`/users/${userId}`).catch(console.error);
  },

  addSite: async (site) => {
    set((state) => ({ sites: [...state.sites, site] }));
    await api.post('/sites', site).catch(console.error);
  },

  updateSite: async (site) => {
    set((state) => ({
      sites: state.sites.map((s: Site) => (s.id === site.id ? site : s))
    }));
    await api.put(`/sites/${site.id}`, site).catch(console.error);
  },

  deleteSite: async (siteId) => {
    set((state) => ({
      sites: state.sites.filter((s: Site) => s.id !== siteId)
    }));
    await api.delete(`/sites/${siteId}`).catch(console.error);
  },

  addWorkflowTemplate: async (template) => {
    set((state) => ({
      workflowTemplates: [...state.workflowTemplates, template]
    }));
    await api.post('/workflow_templates', template).catch(console.error);
  },

  updateWorkflowTemplate: async (template) => {
    set((state) => ({
      workflowTemplates: state.workflowTemplates.map((t: WorkflowTemplate) => (t.id === template.id ? template : t))
    }));
    await api.put(`/workflow_templates/${template.id}`, template).catch(console.error);
  },

  deleteWorkflowTemplate: async (templateId) => {
    set((state) => ({
      workflowTemplates: state.workflowTemplates.filter((t: WorkflowTemplate) => t.id !== templateId)
    }));
    await api.delete(`/workflow_templates/${templateId}`).catch(console.error);
  },

  addTaskConfiguration: async (config) => {
    set((state) => ({
      taskConfigurations: [...state.taskConfigurations, config]
    }));
    await api.post('/task_configurations', config).catch(console.error);
  },

  updateTaskConfiguration: async (config) => {
    set((state) => ({
      taskConfigurations: state.taskConfigurations.map((c: TaskConfiguration) => (c.id === config.id ? config : c))
    }));
    await api.put(`/task_configurations/${config.id}`, config).catch(console.error);
  },

  deleteTaskConfiguration: async (configId) => {
    set((state) => ({
      taskConfigurations: state.taskConfigurations.filter((c: TaskConfiguration) => c.id !== configId)
    }));
    await api.delete(`/task_configurations/${configId}`).catch(console.error);
  },

  updateGlobalRules: async (rules) => {
    set({ globalRules: rules });
    await api.put('/settings/global_rules', rules).catch(console.error);
  },

  updateAIConfig: async (config) => {
    set({ aiConfig: config });
    await api.put('/settings/ai_config', config).catch(console.error);
  },

  updateReportConfig: async (config) => {
    set({ reportConfig: config });
    await api.put('/settings/report_config', config).catch(console.error);
  },

  updateCompanyInfo: (info) => set({ companyInfo: info }),

  addAIFeedback: async (isPositive, feedback) => {
    set((state) => {
      const newMemory = [...(state.aiConfig.memoryBuffer || [])];
      if (feedback) newMemory.push(feedback);
      
      const newLogs = [...(state.aiConfig.learningLogs || [])];
      if (!isPositive) {
        newLogs.push({
          id: `log_${Date.now()}`,
          date: new Date().toLocaleDateString(),
          action: 'Analyse de Feedback Négatif',
          improvement: 'Réajustement des critères de précision du prompt',
          feedbackCount: (state.aiConfig.learningLogs?.length || 0) + 1
        });
      }

      return {
        aiConfig: {
          ...state.aiConfig,
          memoryBuffer: newMemory,
          learningLogs: newLogs,
          version: isPositive ? state.aiConfig.version : (state.aiConfig.version || 1.0) + 0.01
        }
      };
    });
  }
});
