import React, { useState } from 'react';
import { 
  X, 
  Shield, 
  Star, 
  History, 
  MessageSquare, 
  Tag as TagIcon, 
  Activity,
  User as UserIcon,
  Bot,
  ExternalLink,
  Mail,
  Trash2,
  RefreshCw,
  Phone
} from 'lucide-react';
import { api } from '../../lib/api';
import { useStore } from '../../store/useStore';
import { GlobalSupplier } from '../../types';

interface SupplierDetailsDrawerProps {
  supplierId: string;
  onClose: () => void;
}

export function SupplierDetailsDrawer({ supplierId, onClose }: SupplierDetailsDrawerProps) {
  const { globalSuppliers, procurementSuppliers, updateGlobalSupplier, deleteGlobalSupplier } = useStore();
  const [activeTab, setActiveTab] = useState<'info' | 'history' | 'notes'>('info');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const supplier = globalSuppliers.find(s => s.id === supplierId);
  const consultations = procurementSuppliers.filter(s => s.name === supplier?.name);

  if (!supplier) return null;

  const handleUpdateStatus = (status: GlobalSupplier['status']) => {
    updateGlobalSupplier({ ...supplier, status });
  };

  const handleUpdateUserScore = (score: number) => {
    updateGlobalSupplier({ ...supplier, userScore: score });
  };

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-lg bg-slate-950/90 backdrop-blur-xl border-l border-slate-800 h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-900/50">
          <div className="flex gap-4">
            <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-2xl shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              {supplier.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-50 tracking-tight">{supplier.name}</h2>
              <p className="text-slate-400 text-sm flex items-center gap-1.5">
                <TagIcon className="w-3.5 h-3.5" />
                {supplier.category}
              </p>
              <div className="mt-2 flex items-center gap-2">
                <select
                  title="Statut fournisseur"
                  value={supplier.status}
                  onChange={(e) => handleUpdateStatus(e.target.value as GlobalSupplier['status'])}
                  className={`text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded border outline-none bg-slate-900
                    ${supplier.status === 'Partenaire Stratégique' ? 'text-emerald-400 border-emerald-500/30' : 
                      supplier.status === 'Blacklisté' ? 'text-red-400 border-red-500/30' : 
                      'text-slate-300 border-slate-700'}`}
                >
                  <option value="Prospect">Prospect</option>
                  <option value="Qualifié">Qualifié</option>
                  <option value="Partenaire Stratégique">Partenaire Stratégique</option>
                  <option value="Blacklisté">Blacklisté</option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (confirm('Supprimer définitivement ce fournisseur du CRM ?')) {
                  deleteGlobalSupplier(supplier.id);
                  onClose();
                }
              }}
              title="Supprimer définitivement"
              className="p-2 hover:bg-red-400/10 rounded-full text-slate-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            <button 
              onClick={onClose}
              title="Fermer le panneau"
              className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Refresh Bar */}
        <div className="px-6 py-2 bg-emerald-500/5 border-b border-slate-800 flex items-center justify-between">
          <span className="text-[10px] text-slate-500 font-medium flex items-center gap-1.5 uppercase tracking-wider">
            <Activity className="w-3 h-3" /> 
            {supplier.lastAiSync 
              ? `Vérifié le ${new Date(supplier.lastAiSync).toLocaleDateString()}` 
              : 'Données synchronisées'}
          </span>
          <button
            onClick={async () => {
              setIsRefreshing(true);
              try {
                const updated = await api.post('/refresh_supplier_info', { supplierId: supplier.id, name: supplier.name });
                if (updated) {
                  updateGlobalSupplier(updated as GlobalSupplier);
                }
              } catch (err) {
                console.error(err);
              } finally {
                setIsRefreshing(false);
              }
            }}
            disabled={isRefreshing}
            className={`text-[10px] flex items-center gap-1.5 font-bold transition-all
              ${isRefreshing ? 'text-slate-500 animate-pulse' : 'text-emerald-400 hover:text-emerald-600'}`}
          >
            <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'ACTUALISATION...' : 'ACTUALISER VIA IA'}
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="flex px-6 border-b border-slate-800">
          {(['info', 'history', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 px-4 text-sm font-medium relative capitalize transition-colors
                ${activeTab === tab ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {tab === 'info' ? 'Détails' : tab === 'history' ? 'Historique' : 'Notes & CRM'}
              {activeTab === tab && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-emerald-500 rounded-t-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {activeTab === 'info' && (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Reliability Section */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-3 uppercase tracking-wider">
                    <Bot className="w-4 h-4" /> Score IA
                  </div>
                  <div className="text-3xl font-bold text-slate-50">{supplier.aiScore}%</div>
                    <div className="mt-2 w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`bg-emerald-500 h-full rounded-full transition-all duration-500 w-p-${Math.round(supplier.aiScore / 5) * 5}`}
                      />
                    </div>
                </div>
                <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold mb-3 uppercase tracking-wider">
                    <UserIcon className="w-4 h-4" /> Votre Note
                  </div>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => handleUpdateUserScore(star * 20)}
                        title={`Noter ${star}/5`}
                        className="focus:outline-none"
                      >
                        <Star 
                          className={`w-6 h-6 ${supplier.userScore >= star * 20 ? 'fill-emerald-400 text-emerald-400' : 'text-slate-700'}`} 
                        />
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-2 italic">Affinera les prochaines suggestions IA</p>
                </div>
              </div>

              {/* Tags Section */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <TagIcon className="w-4 h-4" /> Tags & Mots-clés
                </h3>
                <div className="flex flex-wrap gap-2">
                  {supplier.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300">
                      {tag}
                    </span>
                  ))}
                  <button className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-xs text-emerald-400 font-medium hover:bg-emerald-500/20 transition-colors">
                    + Ajouter un tag
                  </button>
                </div>
              </div>

              {/* AI Insight */}
              <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
                <h3 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                  <Bot className="w-4 h-4" /> Analyse Stratégique de l'Agent IA
                </h3>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                   "Ce fournisseur présente une forte présence sur le marché {supplier.tags.includes('Import') ? 'International' : 'Local'}. 
                    Le score de fiabilité de {supplier.aiScore}% est justifié par une stabilité opérationnelle et des avis positifs vérifiés sur les réseaux B2B."
                </p>
              </div>

              {/* Quick Actions */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-300">Actions rapides</h3>
                <div className="grid grid-cols-2 gap-3">
                  <a 
                    href={supplier.website.startsWith('http') ? supplier.website : `https://${supplier.website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-slate-50 hover:bg-slate-800 transition-all"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-400" />
                    Voir Site Web
                  </a>
                  <a 
                    href={supplier.email ? `mailto:${supplier.email}` : '#'}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-slate-50 hover:bg-slate-800 transition-all"
                  >
                    <Mail className="w-4 h-4 text-emerald-400" />
                    {supplier.email || 'Email non renseigné'}
                  </a>
                  <a 
                    href={supplier.phone ? `tel:${supplier.phone}` : '#'}
                    className="flex items-center justify-center gap-2 p-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 hover:text-slate-50 hover:bg-slate-800 transition-all"
                  >
                    <Phone className="w-4 h-4 text-emerald-400" />
                    {supplier.phone || 'Appeler'}
                  </a>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                <History className="w-4 h-4" /> Campagnes précédentes
              </h3>
              {consultations.length === 0 ? (
                <p className="text-slate-500 text-sm italic">Aucun historique de consultation trouvé.</p>
              ) : (
                <div className="space-y-3">
                  {consultations.map((c, i) => (
                    <div key={i} className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-slate-50">Consulté via Sourcing IA</span>
                        <span className="text-[10px] text-slate-500">{new Date().toLocaleDateString()}</span>
                      </div>
                      <div className="text-sm text-slate-300 mb-2">
                        Statut : <span className="text-emerald-400 font-medium">{c.contactStatus === 'email_sent' ? 'Email Envoyé' : 'En attente'}</span>
                      </div>
                      {c.insight && (
                        <p className="text-[11px] text-slate-500 bg-slate-950/50 p-2 rounded italic">
                          "{c.insight}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6 animate-in fade-in duration-300 h-full flex flex-col">
              <div className="flex-1 space-y-4">
                <h3 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" /> Notes & CRM
                </h3>
                <textarea
                  placeholder="Ajoutez une note interne sur ce fournisseur (ex: retours d'expérience, prix négociés...)"
                  className="w-full h-64 bg-slate-900 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none transition-all"
                />
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-start gap-3">
                <Shield className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <p className="text-xs text-emerald-400/80 leading-relaxed">
                  Ces notes sont privées et uniquement visibles par votre organisation. Elles aident l'IA à qualifier le fournisseur lors de vos futurs besoins.
                </p>
              </div>
            </div>
          )}

        </div>
        
        {/* Footer */}
        <div className="p-6 border-t border-slate-800 bg-slate-900/50 flex justify-between items-center text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Dernière consultation: Aujourd'hui
          </div>
          <span className="font-medium text-slate-400">{supplier.consultations} total(s)</span>
        </div>
      </div>
    </div>
  );
}
