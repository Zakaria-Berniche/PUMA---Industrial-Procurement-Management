import React, { useState, useEffect } from 'react';
import { Bot, Search, Globe, Zap, FileText, CheckCircle, Activity, BarChart, Mail, Server, Trash2, X, Phone, RefreshCw, LayoutGrid, Map as MapIcon, Shield } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { ProcurementCampaign, GlobalSupplier, ProcurementSupplier } from '../../types';
import { api } from '../../lib/api';
import { SupplierDetailsDrawer } from '../../components/procurement/SupplierDetailsDrawer';
import { SourcingMatrix } from '../../components/procurement/SourcingMatrix';
import { SupplierMap } from '../../components/procurement/SupplierMap';
import { motion, AnimatePresence } from 'framer-motion';
import { Objective } from '../../types';

export function Procurement() {
  const { 
    currentUser, 
    procurementCampaigns, 
    globalSuppliers, 
    procurementSuppliers, 
    addProcurementCampaign, 
    updateGlobalSupplier, 
    updateProcurementSupplier,
    deleteProcurementCampaign,
    deleteProcurementSupplier,
    deleteGlobalSupplier,
    initializeStore,
    addObjective,
    updateObjectiveStatus
  } = useStore();
  const [activeTab, setActiveTab] = useState<'new' | 'active' | 'crm'>('new');
  
  // Email Draft Modal State
  const [draftModal, setDraftModal] = useState<{isOpen: boolean, supplier: ProcurementSupplier | null, text: string}>({isOpen: false, supplier: null, text: ''});
  const [isEmailApproved, setIsEmailApproved] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [showMatrix, setShowMatrix] = useState<{ isOpen: boolean, suppliers: ProcurementSupplier[] }>({ isOpen: false, suppliers: [] });
  const [crmViewMode, setCrmViewMode] = useState<'list' | 'map'>('list');
  const [crmSearch, setCrmSearch] = useState('');
  const [crmFilterCategory, setCrmFilterCategory] = useState<string>('Tous');
  const [isSending, setIsSending] = useState(false);
  const [isGlobalSyncing, setIsGlobalSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ updated: number, failed: number } | null>(null);
  
  // Form State
  const [sourcingIntent, setSourcingIntent] = useState('');
  const [customCategoryLabel, setCustomCategoryLabel] = useState('');
  const [customFieldName, setCustomFieldName] = useState('');
  const [customFieldValue, setCustomFieldValue] = useState('');
  const [dynamicSpecs, setDynamicSpecs] = useState<Record<string, string>>({});
  const [brand, setBrand] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [market] = useState<'local' | 'international'>('local');

  const [isSearching, setIsSearching] = useState(false);
  const [searchSteps, setSearchSteps] = useState(0);

  // Moteur d'Extraction Sémantique Heuristique Temps Réel
  useEffect(() => {
    if (!sourcingIntent.trim()) {
      setCustomCategoryLabel('');
      setBrand('');
      setQuantity(1);
      setDynamicSpecs({});
      return;
    }

    const text = sourcingIntent;
    
    // 1. Extraction de la Quantité
    let parsedQty = 1;
    const qtyRegex = /(?:^|\s)(\d+)(?:\s*(?:x|pcs|pièces|unités|u|vannes|moteurs|u\.)?\s+)/i;
    const qtyMatch = text.match(qtyRegex) || text.match(/(?:^|\s)x\s*(\d+)/i) || text.match(/(?:^|\s)(\d+)\s*$/);
    if (qtyMatch) {
      const val = parseInt(qtyMatch[1] || qtyMatch[2]);
      if (!isNaN(val) && val > 0) {
        parsedQty = val;
      }
    }

    // 2. Extraction de la Marque
    const brandsList = [
      'Siemens', 'KSB', 'Schneider', 'ABB', 'Flowserve', 'Emerson', 'Endress+Hauser', 'Yokogawa',
      'Rockwell', 'Honeywell', 'Grundfos', 'Danfoss', 'Atlas Copco', 'Sandvik', 'SMC', 'Festool',
      'Legrand', 'Bosch', 'Mitsubishi', 'TE Connectivity', 'Hilti', 'Wilo', 'General Electric', 'Alstom'
    ];
    let parsedBrand = '';
    for (const b of brandsList) {
      const regex = new RegExp(`\\b${b}\\b`, 'i');
      if (regex.test(text)) {
        parsedBrand = b;
        break;
      }
    }

    // 3. Extraction du Domaine Sémantique Principal
    const cleaned = text
      .replace(/(je\s+)?(?:cherche|besoin\s+de|sourcing\s+de|achat\s+de|recherche|approvisionnement\s+de)\s+/i, '')
      .replace(new RegExp(`\\b${parsedQty}\\b`, 'g'), '')
      .replace(new RegExp(`\\b${parsedBrand}\\b`, 'gi'), '')
      .replace(/\b(?:de\s+marque|marque|de|pour|avec)\b/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    let parsedDomain = cleaned.split(/[,.;()]/)[0].trim();
    if (parsedDomain) {
      parsedDomain = parsedDomain.charAt(0).toUpperCase() + parsedDomain.slice(1);
    }

    // 4. Extraction des Spécifications Techniques
    const specs: Record<string, string> = {};
    const technicalKeywords = [
      { key: 'Sécurité', keywords: ['ATEX', 'IP67', 'IP65', 'SIL2', 'SIL3', 'Antidéflagrant'] },
      { key: 'Pression', keywords: ['haute pression', 'basse pression', 'PN16', 'PN25', 'PN40', '10 bar', '16 bar', '40 bar'] },
      { key: 'Matériau', keywords: ['inox', 'acier', 'fonte', 'bronze', 'plastique', 'pvc', 'titane'] },
      { key: 'Raccordement', keywords: ['bride', 'brides', 'taraudé', 'soudé', 'fileté'] },
      { key: 'Tension', keywords: ['220V', '380V', '400V', '24V', '12V', 'monophasé', 'triphasé'] },
      { key: 'Température', keywords: ['haute température', 'cryogénique', 'cryo', 'basse température'] }
    ];

    for (const group of technicalKeywords) {
      for (const kw of group.keywords) {
        const regex = new RegExp(`\\b${kw}\\b`, 'i');
        if (regex.test(text)) {
          specs[group.key] = kw.charAt(0).toUpperCase() + kw.slice(1);
          break;
        }
      }
    }

    setCustomCategoryLabel(parsedDomain || 'Autre Sourcing');
    setBrand(parsedBrand);
    setQuantity(parsedQty);
    setDynamicSpecs(specs);
  }, [sourcingIntent]);

  const handleLaunchSearch = () => {
    if (!sourcingIntent.trim()) return;
    
    const categoryLabel = customCategoryLabel || 'Autre Sourcing';
    
    // Compile specs from dynamic form
    const compiledSpecs = Object.entries(dynamicSpecs)
      .filter(([_, v]) => v)
      .map(([k, v]) => `${k}: ${v}`)
      .join(', ');

    setIsSearching(true);
    setSearchSteps(0);
    
    // Simulate AI steps progression
    setTimeout(() => setSearchSteps(1), 1000);
    setTimeout(() => setSearchSteps(2), 2500);
    setTimeout(() => setSearchSteps(3), 4000);
    setTimeout(() => {
      const newTaskId = `task_${Date.now()}`;
      const newTask = {
        id: newTaskId,
        title: `[SOURCING] ${categoryLabel}`,
        description: `Sourcing IA pour : ${compiledSpecs || 'Critères libres'}. Quantité : ${quantity}. Catégorie : ${categoryLabel}`,
        status: 'En cours' as const,
        priority: 'Haute' as const,
        assigneeId: currentUser?.id || '1',
        siteId: 'site1',
        department: currentUser?.department || 'Achats',
        startDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
        type: 'Consultation Fournisseur',
        customType: categoryLabel,
        complexityScore: 'Moyen',
        managerId: currentUser?.id || '1',
        healthStatus: 'Stable',
        riskScore: 0,
        riskLevel: 'Faible',
        dependencies: [],
        auditLog: [],
        comments: [],
        attachments: [],
        blocks: [],
        workflow: [],
        customFields: {}
      } as Objective;
      addObjective(newTask);

      // 2. Create the campaign in the store & database
      const newCampaign: ProcurementCampaign = {
        id: `camp_${Date.now()}`,
        title: categoryLabel,
        category: 'Consultation', 
        customType: categoryLabel,
        brand,
        specs: compiledSpecs,
        quantity,
        market,
        status: 'scanning', 
        createdAt: new Date().toISOString(),
        relatedTaskId: newTaskId 
      };
      
      addProcurementCampaign(newCampaign);
      
      // 3. Reset and switch view
      setIsSearching(false);
      setSourcingIntent('');
      setCustomCategoryLabel('');
      setDynamicSpecs({});
      setBrand('');
      setQuantity(1);
      setActiveTab('active');
    }, 6000);
  };

  const getSearchProgress = () => {
    switch (searchSteps) {
      case 0: return { percent: 15, label: "Initialisation et parsing de l'intention..." };
      case 1: return { percent: 45, label: "Scan du web et des bases de données..." };
      case 2: return { percent: 75, label: "Filtrage et qualification technique des fournisseurs..." };
      case 3: return { percent: 95, label: "Génération des Ghost-Emails pour la campagne..." };
      default: return { percent: 0, label: "Prêt" };
    }
  };
  const currentProgress = getSearchProgress();

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-8">
      <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.15)]">
              <Bot className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-slate-50 tracking-tight">Smart Procurement AI</h1>
              <p className="text-slate-400">Sourcing automatisé et gestion intelligente des fournisseurs</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-slate-800 pb-px">
          <button
            onClick={() => setActiveTab('new')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'new' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Nouvelle Campagne
            {activeTab === 'new' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('active')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'active' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Campagnes en Cours
            {activeTab === 'active' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('crm')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'crm' ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Annuaire CRM
            {activeTab === 'crm' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
            )}
          </button>
        </div>

        {/* Content */}
        {activeTab === 'new' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Form */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-32 bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none"></div>
              
              <h2 className="text-xl font-semibold text-slate-50 mb-6 flex items-center gap-2">
                <Search className="w-5 h-5 text-emerald-400" />
                Smart Intent Sourcing Console
              </h2>

              <div className="space-y-5 relative z-10">
                {/* Intent Saisie Area */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Quel équipement ou service souhaitez-vous sourcer ?</label>
                  <textarea
                    rows={3}
                    placeholder="Saisissez votre besoin d'achat en langage naturel libre... (ex: Achat de 25 transformateurs triphasés 400V de marque Siemens avec disjoncteur intégré...)"
                    value={sourcingIntent}
                    onChange={(e) => setSourcingIntent(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 focus:border-emerald-500 outline-none transition-all resize-none shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
                  />
                  <p className="text-[11px] text-slate-500 italic">L'intelligence artificielle PUMA va instantanément extraire le domaine, la marque, la quantité et les critères techniques.</p>
                </div>

                <AnimatePresence>
                  {sourcingIntent.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 15 }}
                      className="space-y-4 pt-2"
                    >
                      {/* Synthese Technique */}
                      <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-4 shadow-lg relative">
                        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black uppercase tracking-wider animate-pulse">
                          <Bot className="w-2.5 h-2.5" /> IA Live
                        </div>

                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-1.5 h-3.5 bg-gradient-to-b from-emerald-400 to-indigo-500 rounded-full" />
                          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fiche Technique Déduite</h3>
                        </div>

                        {/* Domaine Sémantique Extrait */}
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Domaine Sémantique</label>
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-semibold">
                            <Zap className="w-4 h-4 text-indigo-400" />
                            {customCategoryLabel || 'Autre Sourcing'}
                          </div>
                        </div>

                        {/* Marque & Qty */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Marque Détectée</label>
                            <input
                              type="text"
                              value={brand}
                              title="Marque Détectée"
                              onChange={(e) => setBrand(e.target.value)}
                              placeholder="Non détectée"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Quantité</label>
                            <input
                              type="number"
                              min={1}
                              title="Quantité"
                              value={quantity}
                              onChange={(e) => setQuantity(Number(e.target.value))}
                              placeholder="1"
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>

                        {/* Spécifications Techniques */}
                        <div className="space-y-3 pt-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Spécifications Extraites</label>
                          
                          {Object.keys(dynamicSpecs).length > 0 ? (
                            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-900/40 rounded-lg border border-slate-800/40">
                              {Object.entries(dynamicSpecs).map(([k, v]) => (
                                <div key={k} className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-[10px]">
                                  <span className="font-semibold">{k}:</span>
                                  <span>{v}</span>
                                  <button 
                                    onClick={() => {
                                      const next = { ...dynamicSpecs };
                                      delete next[k];
                                      setDynamicSpecs(next);
                                    }}
                                    className="hover:text-red-400 transition-colors ml-1 font-bold text-[12px]"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-[10px] text-slate-500 italic">Aucune spécification technique spécifique détectée dans le texte.</p>
                          )}

                          {/* Ajouter manuellement des spécifications */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-900/60">
                            <input
                              type="text"
                              title="Nom du critère personnalisé"
                              placeholder="Nom (ex: Tension)"
                              value={customFieldName}
                              onChange={(e) => setCustomFieldName(e.target.value)}
                              className="sm:col-span-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 focus:border-indigo-500 outline-none"
                            />
                            <input
                              type="text"
                              title="Valeur du critère personnalisé"
                              placeholder="Valeur (ex: 380V)"
                              value={customFieldValue}
                              onChange={(e) => setCustomFieldValue(e.target.value)}
                              className="sm:col-span-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-200 focus:border-indigo-500 outline-none"
                            />
                            <button
                              onClick={() => {
                                if (customFieldName.trim() && customFieldValue.trim()) {
                                  setDynamicSpecs({ ...dynamicSpecs, [customFieldName.trim()]: customFieldValue.trim() });
                                  setCustomFieldName('');
                                  setCustomFieldValue('');
                                }
                              }}
                              className="sm:col-span-1 py-1.5 px-2.5 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 text-[10px] font-semibold transition-colors"
                            >
                              + Ajouter
                            </button>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <button
                  onClick={handleLaunchSearch}
                  disabled={isSearching || !sourcingIntent.trim()}
                  className={`w-full mt-4 flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-slate-50 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)]
                    ${isSearching || !sourcingIntent.trim() ? 'bg-slate-700 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-500 hover:to-indigo-500'}`}
                >
                  {isSearching ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      Analyse Industrielle en cours...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Lancer le Sourcing Intégré
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* AI Visualization Cockpit */}
            <div className="bg-slate-900/50 border border-slate-800/50 rounded-2xl p-6 flex flex-col justify-center min-h-[500px]">
              {!isSearching && searchSteps === 0 ? (
                <div className="text-center space-y-4 opacity-50">
                  <Bot className="w-16 h-16 text-slate-500 mx-auto animate-pulse" />
                  <p className="text-slate-400 max-w-sm mx-auto">L'Agent IA est prêt. Remplissez votre intention de sourcing pour démarrer l'analyse.</p>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in zoom-in duration-500">
                  {/* Dynamic Progress Console */}
                  <div className="p-5 bg-slate-950/40 border border-slate-800/60 rounded-2xl space-y-4 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-24 bg-gradient-to-br from-emerald-500/10 to-indigo-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center relative">
                          <Bot className="w-5 h-5 text-emerald-400" />
                          <div className="absolute inset-0 rounded-xl border border-emerald-400/40 animate-ping opacity-25"></div>
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-slate-100">Recherche IA PUMA</h3>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Agent Actif</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono text-2xl font-black bg-gradient-to-r from-emerald-400 to-indigo-400 text-transparent bg-clip-text animate-pulse">
                          {currentProgress.percent}%
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 tracking-wide">
                        <span className="text-emerald-400 animate-pulse">{currentProgress.label}</span>
                        <span className="text-slate-500">Phase {searchSteps + 1}/4</span>
                      </div>

                      <div className="h-3 w-full bg-slate-950/80 rounded-full border border-slate-800/80 p-0.5 overflow-hidden relative">
                        <style>{`
                          #sourcing_progress_fill {
                            width: ${currentProgress.percent}%;
                          }
                        `}</style>
                        <div 
                          id="sourcing_progress_fill" 
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 transition-all duration-1000 ease-out relative"
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 blur-[3px] opacity-80 rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Steps Checklist */}
                  <div className="space-y-4 max-w-sm mx-auto pt-2">
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${searchSteps >= 1 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-500 border border-slate-850'}`}>
                        {searchSteps >= 1 ? <CheckCircle className="w-4 h-4" /> : <Activity className="w-4 h-4 animate-pulse" />}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${searchSteps >= 1 ? 'text-slate-50' : 'text-slate-400'}`}>Scan du web (Recherche {market})</span>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${searchSteps >= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-500 border border-slate-850'}`}>
                        {searchSteps >= 2 ? <CheckCircle className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${searchSteps >= 2 ? 'text-slate-50' : 'text-slate-400'}`}>Filtrage des fournisseurs pour : {customCategoryLabel || 'Autre Sourcing'}</span>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 ${searchSteps >= 3 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800/80 text-slate-500 border border-slate-850'}`}>
                        {searchSteps >= 3 ? <CheckCircle className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                      </div>
                      <span className={`text-sm font-medium transition-colors ${searchSteps >= 3 ? 'text-slate-50' : 'text-slate-400'}`}>Préparation des emails (Ghost Sending)</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {activeTab === 'active' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            {procurementCampaigns.length === 0 ? (
              <div className="text-center p-12 border border-slate-800 border-dashed rounded-2xl bg-slate-900/50">
                <Bot className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-50">Aucune campagne en cours</h3>
                <p className="text-slate-400">Lancez une nouvelle recherche pour commencer le sourcing.</p>
              </div>
            ) : (
              procurementCampaigns.map(campaign => {
                const campaignSuppliers = procurementSuppliers.filter(s => s.campaignId === campaign.id);
                return (
                  <div key={campaign.id} className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_0_15px_rgba(59,130,246,0.1)] transition-shadow">
                    <div className="p-6 border-b border-slate-800 flex items-center justify-between">
                      <div>
                          <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                            <BarChart className="w-5 h-5 text-emerald-400" />
                            Campagne: {campaign.title}
                          </h2>
                          <p className="text-sm text-slate-400 mt-1">
                            Créée le {new Date(campaign.createdAt).toLocaleDateString()} • Marché {campaign.market} • Qté: {campaign.quantity} • {campaign.category}
                          </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 text-xs font-medium rounded-full border border-emerald-500/20">
                          {campaign.status === 'scanning' ? 'En cours d\'analyse' : campaign.status}
                        </span>
                        {campaignSuppliers.length > 0 && (
                          <button
                            onClick={() => setShowMatrix({ isOpen: true, suppliers: campaignSuppliers })}
                            className="flex items-center gap-2 px-3 py-1 bg-emerald-500 text-slate-50 text-xs font-bold rounded-md hover:bg-emerald-600 transition-all shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            COMPARER VIA IA
                          </button>
                        )}
                        <button
                          onClick={async () => {
                            if (confirm('Relancer le sourcing IA pour cette campagne ? Les résultats existants seront actualisés.')) {
                              await api.post(`/procurement_campaigns/${campaign.id}/refresh`, {}).catch(console.error);
                            }
                          }}
                          title="Rafraîchir le sourcing IA"
                          className="p-1.5 text-slate-500 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors group"
                        >
                          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Supprimer cette campagne et tous ses résultats ?')) {
                              deleteProcurementCampaign(campaign.id);
                            }
                          }}
                          title="Supprimer la campagne"
                          className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sourcing Campaign Progress Gauge */}
                    <div className="px-6 py-4 bg-slate-950/20 border-b border-slate-800 flex flex-col gap-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${campaign.status === 'scanning' ? 'bg-indigo-500 animate-ping' : 'bg-emerald-500'}`} />
                          <span className={`text-[11px] font-bold tracking-wide uppercase ${campaign.status === 'scanning' ? 'text-indigo-400 animate-pulse' : 'text-emerald-400'}`}>
                            {campaign.status === 'scanning' ? "Recherche active de sources qualifiées par IA..." : "Sourcing IA Complet"}
                          </span>
                        </div>
                        <span className="font-mono text-[11px] font-black text-slate-300">
                          {campaign.status === 'scanning' ? "68%" : "100%"}
                        </span>
                      </div>

                      {/* Track and Fill */}
                      <div className="h-2 w-full bg-slate-950/80 rounded-full border border-slate-800/80 p-0.5 overflow-hidden relative">
                        <style>{`
                          #campaign_progress_fill_${campaign.id} {
                            width: ${campaign.status === 'scanning' ? '68%' : '100%'};
                          }
                        `}</style>
                        <div 
                          id={`campaign_progress_fill_${campaign.id}`}
                          className={`h-full rounded-full transition-all duration-1000 ease-out relative ${
                            campaign.status === 'scanning' 
                              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 animate-pulse' 
                              : 'bg-emerald-500'
                          }`}
                        >
                          <div className="absolute inset-0 bg-white/20 rounded-full blur-[1px]"></div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-0 overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-slate-950/50 text-slate-400 text-sm border-b border-slate-800">
                            <th className="p-4 font-medium">Fournisseur</th>
                            <th className="p-4 font-medium">Score IA</th>
                            <th className="p-4 font-medium">Statut Email</th>
                            <th className="p-4 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800 text-sm">
                          {campaignSuppliers.length === 0 ? (
                            <tr>
                              <td colSpan={4} className="p-8 text-center text-slate-500">
                                {campaign.status === 'scanning' ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <Activity className="w-4 h-4 animate-pulse" /> IA en cours de recherche...
                                  </span>
                                ) : (
                                  "Aucun fournisseur trouvé."
                                )}
                              </td>
                            </tr>
                          ) : (
                            campaignSuppliers.map(sup => (
                              <tr key={sup.id} className="hover:bg-slate-800/50 transition-colors group">
                                <td className="p-4 text-slate-50 font-medium">
                                  {sup.name}
                                  <div className="text-xs text-slate-500 font-normal mt-1">{sup.insight}</div>
                                </td>
                                <td className="p-4">
                                  <div className="flex items-center gap-2">
                                    <div className="w-full bg-slate-800 rounded-full h-1.5 max-w-[100px]">
                                      <div 
                                        className={`bg-emerald-500 h-1.5 rounded-full transition-all duration-1000 w-p-${Math.round(sup.reliabilityScore / 5) * 5}`} 
                                        title={`Score: ${sup.reliabilityScore}%`}
                                      />
                                    </div>
                                    <span className="text-emerald-400 text-xs font-medium">{sup.reliabilityScore}%</span>
                                  </div>
                                </td>
                                <td className="p-4 text-slate-400 flex items-center gap-2">
                                  {sup.contactStatus === 'pending' ? (
                                    <span className="flex items-center gap-1.5 text-amber-400">
                                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" /> Brouillon IA prêt
                                    </span>
                                  ) : (
                                    <span className="flex items-center gap-1.5 text-emerald-400">
                                      <CheckCircle className="w-4 h-4" /> Envoyé
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-right flex items-center justify-end gap-2">
                                  {sup.selectionStatus === 'none' || !sup.selectionStatus ? (
                                    <div className="flex items-center gap-1">
                                      <button 
                                        onClick={() => updateProcurementSupplier({ ...sup, selectionStatus: 'selected' })}
                                        title="Sélectionner pour l'étape suivante"
                                        className="p-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-slate-50 rounded transition-all"
                                      >
                                        <CheckCircle className="w-4 h-4" />
                                      </button>
                                      <button 
                                        onClick={() => updateProcurementSupplier({ ...sup, selectionStatus: 'rejected' })}
                                        title="Ignorer ce résultat"
                                        className="p-1.5 bg-slate-800 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded transition-all"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  ) : sup.selectionStatus === 'selected' ? (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Sélectionné</span>
                                      {sup.contactStatus === 'pending' ? (
                                        <button 
                                          onClick={() => setDraftModal({ isOpen: true, supplier: sup, text: sup.emailDraft || '' })}
                                          className="inline-flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-50 px-3 py-1.5 rounded text-xs font-medium transition-colors"
                                        >
                                          <Mail className="w-3.5 h-3.5" /> Valider Email
                                        </button>
                                      ) : (
                                        <button 
                                          onClick={() => {
                                            const globalSup = globalSuppliers.find(gs => gs.name === sup.name);
                                            if (globalSup) setSelectedSupplierId(globalSup.id);
                                          }}
                                          className="text-emerald-400 hover:text-blue-300 font-medium text-xs"
                                        >
                                          Voir détails
                                        </button>
                                      )}
                                      <button 
                                        onClick={() => updateProcurementSupplier({ ...sup, selectionStatus: 'none' })}
                                        title="Annuler la sélection"
                                        className="p-1 text-slate-500 hover:text-slate-300"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] text-slate-500 italic">Ignoré</span>
                                      <button 
                                        onClick={() => updateProcurementSupplier({ ...sup, selectionStatus: 'none' })}
                                        className="text-[10px] text-emerald-400 hover:underline"
                                      >
                                        Restaurer
                                      </button>
                                    </div>
                                  )}
                                  
                                  <button
                                    onClick={() => {
                                      if (confirm('Retirer ce résultat ?')) {
                                        deleteProcurementSupplier(sup.id);
                                      }
                                    }}
                                    title="Supprimer définitivement"
                                    className="p-1 text-slate-600 hover:text-red-400 transition-colors ml-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CRM Annuaire */}
        {activeTab === 'crm' && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-500">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-50 flex items-center gap-2">
                <Globe className="w-5 h-5 text-emerald-400" />
                Base de Données Fournisseurs
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 mr-2">
                  <button
                    onClick={() => setCrmViewMode('list')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${crmViewMode === 'list' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    LISTE
                  </button>
                  <button
                    onClick={() => setCrmViewMode('map')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${crmViewMode === 'map' ? 'bg-slate-800 text-emerald-400 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    <MapIcon className="w-3.5 h-3.5" />
                    CARTE
                  </button>
                </div>
                <button
                  onClick={async () => {
                    if (confirm('Voulez-vous actualiser les coordonnées de TOUS les fournisseurs via l\'IA ? (Cela peut prendre quelques minutes)')) {
                      setIsGlobalSyncing(true);
                      setSyncResult(null);
                      try {
                        const result = await api.post('/refresh_all_suppliers', {});
                        setSyncResult(result as { updated: number, failed: number });
                        await initializeStore(); // Refresh from DB
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsGlobalSyncing(false);
                      }
                    }
                  }}
                  disabled={isGlobalSyncing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all border
                    ${isGlobalSyncing 
                      ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed' 
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]'}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isGlobalSyncing ? 'animate-spin' : ''}`} />
                  {isGlobalSyncing ? 'SYNCHRONISATION...' : 'ACTUALISER L\'ANNUAIRE'}
                </button>
                <div className="relative ml-2">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input 
                    type="text" 
                    value={crmSearch}
                    onChange={(e) => setCrmSearch(e.target.value)}
                    placeholder="Rechercher..." 
                    title="Recherche fournisseur"
                    className="bg-slate-900 border border-slate-800 rounded-full pl-9 pr-4 py-2 text-sm text-slate-50 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none w-64"
                  />
                </div>
              </div>
            </div>

            {syncResult && (
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-between animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-50">Synchronisation terminée !</h4>
                    <p className="text-xs text-slate-400">{syncResult.updated} fournisseurs mis à jour avec succès.</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSyncResult(null)}
                  title="Fermer la notification"
                  className="text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {['Tous', ...Array.from(new Set(globalSuppliers.map(s => s.category)))].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCrmFilterCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border
                    ${crmFilterCategory === cat 
                      ? 'bg-emerald-500 border-emerald-400 text-slate-50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-600'}`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {crmViewMode === 'map' ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <SupplierMap suppliers={globalSuppliers.filter(s => 
                  (crmFilterCategory === 'Tous' || s.category === crmFilterCategory) &&
                  (s.name.toLowerCase().includes(crmSearch.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(crmSearch.toLowerCase())))
                )} />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {globalSuppliers.filter(s => 
                (crmFilterCategory === 'Tous' || s.category === crmFilterCategory) &&
                (s.name.toLowerCase().includes(crmSearch.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(crmSearch.toLowerCase())))
              ).length === 0 ? (
                <div className="col-span-full text-center p-12 border border-slate-800 border-dashed rounded-2xl bg-slate-900/50">
                  <Bot className="w-12 h-12 text-slate-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-50">Aucun résultat</h3>
                  <p className="text-slate-400">Essayez de modifier vos filtres ou lancez une nouvelle recherche IA.</p>
                </div>
              ) : (
                globalSuppliers
                  .filter(s => 
                    (crmFilterCategory === 'Tous' || s.category === crmFilterCategory) &&
                    (s.name.toLowerCase().includes(crmSearch.toLowerCase()) || s.tags.some(t => t.toLowerCase().includes(crmSearch.toLowerCase())))
                  )
                  .map(supplier => (
                  <div key={supplier.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-lg relative">
                        {supplier.name.charAt(0)}
                        {supplier.lastAiSync && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-slate-950" title="Vérifié par IA" />
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <select 
                          title="Statut fournisseur"
                          value={supplier.status}
                          onChange={(e) => updateGlobalSupplier({ ...supplier, status: e.target.value as GlobalSupplier['status'] })}
                          className={`text-xs font-medium px-2 py-1 rounded-md border outline-none bg-slate-950/50
                            ${supplier.status === 'Partenaire Stratégique' ? 'text-emerald-400 border-emerald-500/30' : 
                              supplier.status === 'Blacklisté' ? 'text-red-400 border-red-500/30' : 
                              'text-slate-300 border-slate-700'}`}
                        >
                          <option value="Prospect">Prospect</option>
                          <option value="Qualifié">Qualifié</option>
                          <option value="Partenaire Stratégique">Partenaire Stratégique</option>
                          <option value="Blacklisté">Blacklisté</option>
                        </select>
                        <button
                          onClick={() => {
                            if (confirm('Supprimer définitivement ce fournisseur du CRM ?')) {
                              deleteGlobalSupplier(supplier.id);
                            }
                          }}
                          title="Supprimer du CRM"
                          className="p-1 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <h3 className="text-slate-50 font-medium truncate mb-1">{supplier.name}</h3>
                    <p className="text-xs text-slate-400 mb-4">{supplier.category}</p>

                    <div className="flex items-center justify-between mb-4">
                      <div className="text-xs font-medium text-slate-400">Score IA</div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-50">{supplier.aiScore}/100</span>
                        <div className="w-16 bg-slate-800 rounded-full h-1.5">
                          <div 
                            className={`bg-emerald-500 h-1.5 rounded-full w-p-${Math.round(supplier.aiScore / 5) * 5}`} 
                            title={`Score IA: ${supplier.aiScore}%`}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {supplier.tags.map(tag => (
                        <span key={tag} className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded border border-slate-700">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {supplier.phone && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-1.5 bg-slate-950/30 p-1.5 rounded border border-slate-800/50">
                        <Phone className="w-3 h-3 text-emerald-400" />
                        {supplier.phone}
                      </div>
                    )}

                    {supplier.email && (
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-4 bg-slate-950/30 p-1.5 rounded border border-slate-800/50">
                        <Mail className="w-3 h-3 text-emerald-400" />
                        {supplier.email}
                      </div>
                    )}

                    <div className="pt-4 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
                      <span>{supplier.consultations} consultation(s)</span>
                      <button 
                        onClick={() => setSelectedSupplierId(supplier.id)}
                        className="text-emerald-400 hover:text-blue-300 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        Ouvrir fiche
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Email Draft Modal */}
      {draftModal.isOpen && draftModal.supplier && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-5 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-emerald-400" />
                  Validation de l'Email
                </h3>
                <p className="text-sm text-slate-400">À l'attention de : {draftModal.supplier.name}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-2 py-1 bg-amber-500/10 text-amber-400 text-[10px] font-bold border border-amber-500/20 rounded uppercase tracking-wider animate-pulse">
                  Action Requise : Validation Humaine
                </span>
                <button
                  onClick={() => {
                    setDraftModal({ isOpen: false, supplier: null, text: '' });
                    setIsEmailApproved(false);
                  }}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="p-5">
              <textarea
                value={draftModal.text}
                onChange={(e) => setDraftModal({ ...draftModal, text: e.target.value })}
                title="Contenu de l'email"
                placeholder="Rédigez votre email ici..."
                className="w-full h-64 bg-slate-950 border border-slate-800 rounded-lg p-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none font-mono"
              />
              
              <div className="mt-4 flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-sm text-emerald-400">
                <Server className="w-5 h-5 shrink-0" />
                <p>
                  Cet email sera expédié en utilisant le compte SMTP configuré dans votre profil ({currentUser?.email}).
                </p>
              </div>

              <div className="mt-6 flex items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl cursor-pointer hover:border-emerald-500/30 transition-all group" onClick={() => setIsEmailApproved(!isEmailApproved)}>
                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${isEmailApproved ? 'bg-emerald-500 border-emerald-500' : 'border-slate-700 bg-slate-900 group-hover:border-slate-500'}`}>
                  {isEmailApproved && <CheckCircle className="w-4 h-4 text-slate-50" />}
                </div>
                <span className={`text-sm font-medium transition-colors ${isEmailApproved ? 'text-emerald-400' : 'text-slate-400 group-hover:text-slate-200'}`}>
                  J'ai relu et j'approuve le contenu de cet email pour envoi.
                </span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-800 bg-slate-900/50 rounded-b-xl">
              <button
                onClick={() => {
                  setDraftModal({ isOpen: false, supplier: null, text: '' });
                  setIsEmailApproved(false);
                }}
                className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-slate-50 hover:bg-slate-800 rounded-md transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={async () => {
                  if (!isEmailApproved) return;
                  setIsSending(true);
                  try {
                    const res = (await api.post('/send_email', {
                      userId: currentUser?.id,
                      supplierId: draftModal.supplier?.id,
                      body: draftModal.text
                    })) as { success: boolean };
                    
                    if (res && 'success' in res && res.success) {
                      updateProcurementSupplier({ ...draftModal.supplier!, contactStatus: 'email_sent' });
                      
                      // Sync with Kanban
                      const campaign = procurementCampaigns.find(c => c.id === draftModal.supplier?.campaignId);
                      if (campaign?.relatedTaskId) {
                        updateObjectiveStatus(campaign.relatedTaskId, 'En cours');
                      }
                      
                      setDraftModal({ isOpen: false, supplier: null, text: '' });
                      setIsEmailApproved(false);
                    }
                  } catch (err: unknown) {
                    console.error('Send email error:', err);
                  } finally {
                    setIsSending(false);
                  }
                }}
                disabled={isSending || !isEmailApproved}
                className={`flex items-center gap-2 px-6 py-2 rounded-md text-sm font-bold transition-all
                  ${!isEmailApproved || isSending 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed shadow-none' 
                    : 'bg-emerald-500 hover:bg-emerald-600 text-slate-50 shadow-[0_0_20px_rgba(16,185,129,0.3)]'}`}
              >
                {isSending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    ENVOI...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    APPROUVER ET ENVOYER
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Supplier Details Drawer */}
      {selectedSupplierId && (
        <SupplierDetailsDrawer 
          supplierId={selectedSupplierId} 
          onClose={() => setSelectedSupplierId(null)} 
        />
      )}

      {showMatrix.isOpen && (
        <SourcingMatrix 
          suppliers={showMatrix.suppliers} 
          onClose={() => setShowMatrix({ isOpen: false, suppliers: [] })} 
        />
      )}
      </div>
    </div>
  );
}
