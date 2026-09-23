import React, { useMemo, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { 
  Users,
  TrendingUp, 
  Zap, 
  Target, 
  Award,
  Medal,
  ChevronRight,
  Activity,
  Timer
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  LineChart,
  Line
} from 'recharts';
import { motion } from 'motion/react';
import { Badge } from './ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { InfoTooltip } from './ui/InfoTooltip';

export function PerformanceDashboard() {
  const { objectives, users, sites } = useStore();
  const [selectedCollabId, setSelectedCollabId] = useState<string | null>(null);

  const collaborators = useMemo(() => 
    users.filter(u => u.role === 'Collaborateur' || u.role === 'Responsable Local'),
    [users]
  );

  // Helper to generate stable random-like values based on a string seed
  const seededRandom = (seed: string) => {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return (Math.abs(hash) % 100) / 100;
  };

  // Gamification Logic: Badges
  const getBadges = useCallback((collabId: string) => {
    const collabObjectives = objectives.filter(o => o.assigneeId === collabId && o.status === 'Terminé');
    const badges = [];
    
    if (collabObjectives.length >= 10) badges.push({ icon: '🏆', label: 'Vétéran', color: 'text-amber-500' });
    
    const fastTasks = collabObjectives.filter(o => {
      const sla = o.totalSlaHours || 48;
      const spent = (o.totalTimeSpentMinutes || 0) / 60;
      return spent < (sla * 0.5); 
    });
    if (fastTasks.length >= 3) badges.push({ icon: '⚡', label: 'Flash', color: 'text-yellow-400' });

    const qualityTasks = collabObjectives.filter(o => o.healthStatus === 'Stable');
    if (qualityTasks.length >= 5) badges.push({ icon: '🎯', label: 'Sniper', color: 'text-emerald-500' });

    return badges;
  }, [objectives]);

  // Sparkline Simulation (historical IRI) - Stable seed-based
  const getTrendData = useCallback((collabId: string) => {
    const seed = seededRandom(collabId);
    return [
      { v: 65 + seed * 20 },
      { v: 70 + seed * 15 },
      { v: 68 + seed * 22 },
      { v: 75 + seed * 18 },
      { v: 80 + seed * 12 },
      { v: 78 + seed * 20 },
      { v: 85 + seed * 10 },
    ];
  }, []);

  // 1. Benchmarking Inter-Sites
  const sitePerformance = useMemo(() => {
    return sites.map(site => {
      const siteObjectives = objectives.filter(o => o.siteId === site.id && o.status === 'Terminé');
      const avgTime = siteObjectives.length > 0 
        ? siteObjectives.reduce((acc, obj) => acc + (obj.totalTimeSpentMinutes || 0), 0) / siteObjectives.length
        : 0;
      
      return {
        name: site.name,
        avgMinutes: Math.round(avgTime),
        count: siteObjectives.length,
        color: site.name.includes('Sidi') ? '#10b981' : '#3b82f6'
      };
    }).sort((a, b) => a.avgMinutes - b.avgMinutes);
  }, [objectives, sites]);

  // 2. IRI & Team KPIs
  const teamKPIs = useMemo(() => {
    return collaborators.map(collab => {
      const collabObjectives = objectives.filter(o => o.assigneeId === collab.id);
      const finished = collabObjectives.filter(o => o.status === 'Terminé');
      
      let iri = 0;
      if (collabObjectives.length > 0) {
        const completionRate = finished.length / collabObjectives.length;
        const timeRatio = finished.reduce((acc, obj) => {
          const sla = obj.totalSlaHours || 48; 
          const spent = (obj.totalTimeSpentMinutes || 0) / 60;
          return acc + (spent > 0 ? sla / spent : 1);
        }, 0) / (finished.length || 1);
        
        iri = Math.round(completionRate * timeRatio * 100);
      }

      return {
        ...collab,
        iri: Math.min(iri, 100),
        activeTasks: collabObjectives.filter(o => o.status !== 'Terminé' && o.status !== 'Annulé').length,
        finishedCount: finished.length,
        badges: getBadges(collab.id),
        trend: getTrendData(collab.id)
      };
    }).sort((a, b) => b.iri - a.iri);
  }, [objectives, collaborators, getBadges, getTrendData]);

  // 3. Matrice Expertise (Categorical Efficiency)
  const expertiseMatrix = useMemo(() => {
    if (!selectedCollabId) return [];
    const collabObjectives = objectives.filter(o => o.assigneeId === selectedCollabId && o.status === 'Terminé');
    const categories = ['Achat Standard', 'Achat Urgent', 'Achat Projet', 'Consultation', 'Maintenance'];
    
    return categories.map(cat => {
      const catTasks = collabObjectives.filter(o => o.type.includes(cat) || o.title.includes(cat));
      const score = catTasks.length > 0 
        ? Math.min(100, Math.round(catTasks.reduce((acc, obj) => acc + (obj.totalSlaHours || 48) / ((obj.totalTimeSpentMinutes || 1) / 60), 0) / catTasks.length * 20))
        : 0;
      return { category: cat, score };
    });
  }, [objectives, selectedCollabId]);

  const selectedCollab = teamKPIs.find(u => u.id === selectedCollabId) || teamKPIs[0];

  return (
    <div className="p-8 space-y-8 bg-slate-950 min-h-full">
      {/* Header Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Efficacité Groupe', value: '87%', icon: Zap, color: 'text-emerald-500', trend: '+4%' },
          { label: 'Rentabilité SLA', value: '1.2x', icon: TrendingUp, color: 'text-blue-500', trend: '+12%' },
          { label: 'Collaborateurs Actifs', value: collaborators.length.toString(), icon: Users, color: 'text-purple-500', trend: 'Stable' },
          { label: 'Badges Distribués', value: '24', icon: Medal, color: 'text-amber-500', trend: '+2' },
        ].map((stat, i) => (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            key={stat.label} 
            className="bg-slate-900/50 border border-slate-800 p-6 rounded-2xl relative overflow-hidden group"
          >
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-all" />
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl bg-slate-950 border border-slate-800 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{stat.label}</p>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black text-slate-50">{stat.value}</span>
                  <span className="text-[10px] font-bold text-emerald-500">{stat.trend}</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Award className="w-6 h-6 text-amber-500" />
                <div>
                  <h3 className="text-xl font-bold text-slate-50 flex items-center">
                    Leaderboard Rentabilité
                    <InfoTooltip 
                      title="Indice de Rentabilité (IRI)"
                      definition="Score global combinant le taux de complétion des opérations et le respect des délais SLA."
                      impact="Un score élevé garantit une rotation rapide des stocks et une production fluide."
                      method="(Opérations Finies / Totales) * (SLA / Temps Réel)"
                    />
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">Classement dynamique des collaborateurs</p>
                </div>
              </div>
              <Badge variant="outline" className="bg-slate-950 border-slate-800 text-slate-400">LIVE TRACKING</Badge>
            </div>

            <div className="space-y-4">
              {teamKPIs.slice(0, 6).map((member, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={member.id} 
                  onClick={() => setSelectedCollabId(member.id)}
                  className={`flex items-center gap-6 p-4 rounded-2xl transition-all border cursor-pointer group ${
                    selectedCollabId === member.id ? 'bg-slate-800/80 border-blue-500/50' : 'hover:bg-slate-800/40 border-transparent hover:border-slate-700'
                  }`}
                >
                  <div className="w-8 h-8 flex items-center justify-center font-black text-slate-700">
                    {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx+1}`}
                  </div>
                  
                  <Avatar className="w-12 h-12 border-2 border-slate-800 group-hover:border-emerald-500/50">
                    <AvatarImage src={member.avatar} />
                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-slate-100 truncate">{member.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          {member.badges.map((b, bi) => (
                            <span key={bi} title={b.label} className="text-xs cursor-default">{b.icon}</span>
                          ))}
                          <span className="text-[9px] text-slate-600 font-black uppercase ml-2">{member.department}</span>
                        </div>
                      </div>
                      
                      {/* Trend Sparkline */}
                      <div className="w-16 h-8 opacity-50 group-hover:opacity-100 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={member.trend}>
                            <Line type="monotone" dataKey="v" stroke={member.iri > 70 ? '#10b981' : '#3b82f6'} strokeWidth={2} dot={false} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  <div className="px-6 border-l border-slate-800/50 text-right">
                    <span className={`text-xl font-black ${member.iri > 80 ? 'text-emerald-500' : 'text-blue-500'}`}>{member.iri}</span>
                    <p className="text-[8px] font-bold text-slate-600 uppercase">Score IRI</p>
                  </div>
                  
                  <ChevronRight className={`w-4 h-4 text-slate-700 transition-transform ${selectedCollabId === member.id ? 'rotate-90 text-blue-400' : ''}`} />
                </motion.div>
              ))}
            </div>
          </section>

          {/* Site Performance Benchmarking */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-slate-50 mb-8 flex items-center">
              <Activity className="w-6 h-6 text-emerald-500 mr-3" /> Benchmarking Inter-Sites
              <InfoTooltip 
                title="Comparatif Industriel"
                definition="Analyse de la vitesse moyenne de traitement par localisation géographique."
                impact="Permet d'identifier les goulots d'étranglement spécifiques à une usine."
              />
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sitePerformance}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} axisLine={false} tickLine={false} tickFormatter={v => `${v}m`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                    itemStyle={{ color: '#f8fafc', fontSize: '12px' }}
                  />
                  <Bar dataKey="avgMinutes" radius={[6, 6, 0, 0]} barSize={40}>
                    {sitePerformance.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </section>
        </div>

        {/* Deep Dive Sidebar */}
        <div className="space-y-8">
          {/* Matrice d'Expertise */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 shadow-xl">
            <h3 className="text-lg font-bold text-slate-50 mb-6 flex items-center">
              <Target className="w-5 h-5 text-emerald-500 mr-2" /> Matrice d'Expertise
              <InfoTooltip 
                title="Analyse des Compétences"
                definition="Répartition de l'efficacité du collaborateur par type d'achat."
                impact="Aide à l'affectation intelligente des opérations selon les forces de chacun."
              />
            </h3>
            <div className="flex items-center gap-3 mb-6 p-3 bg-slate-950 rounded-xl border border-slate-800">
              <Avatar className="w-8 h-8 border border-slate-700">
                <AvatarImage src={selectedCollab.avatar} />
                <AvatarFallback>{selectedCollab.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-100 truncate">{selectedCollab.name}</p>
                <p className="text-[9px] text-slate-500 uppercase font-black">Analyse par catégorie</p>
              </div>
            </div>
            
            <div className="space-y-5">
              {expertiseMatrix.length > 0 ? expertiseMatrix.map((item) => (
                <div key={item.category} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                    <span className="text-slate-400">{item.category}</span>
                    <span className="text-slate-200">{item.score}%</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${item.score}%` }}
                      className={`h-full ${item.score > 70 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : 'bg-blue-500'}`} 
                    />
                  </div>
                </div>
              )) : (
                <div className="text-center py-10">
                  <p className="text-xs text-slate-600 italic">Pas assez de données pour ce profil.</p>
                </div>
              )}
            </div>
          </section>

          {/* Gamification Badges Focus */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-slate-50 mb-6 flex items-center">
              <Medal className="w-5 h-5 text-amber-500 mr-2" /> Badges Industriels
              <InfoTooltip 
                title="Gamification & Reconnaissance"
                definition="Récompenses automatiques basées sur la qualité, la vitesse et l'ancienneté."
                impact="Motive les équipes et valorise l'excellence opérationnelle."
              />
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: '⚡', label: 'Flash', desc: 'Vitesse > 20%', color: 'yellow' },
                { icon: '🎯', label: 'Sniper', desc: '0 erreur SLA', color: 'emerald' },
                { icon: '🏆', label: 'Vétéran', desc: '10+ opérations', color: 'amber' },
                { icon: '🧠', label: 'Expert', desc: 'IRI constant', color: 'blue' },
              ].map((b) => {
                const hasIt = selectedCollab.badges.some(mb => mb.label === b.label);
                return (
                  <div key={b.label} className={`p-4 rounded-2xl border transition-all ${
                    hasIt ? `bg-${b.color}-500/10 border-${b.color}-500/30` : 'bg-slate-950 border-slate-800 opacity-30 grayscale'
                  }`}>
                    <span className="text-2xl mb-2 block">{b.icon}</span>
                    <p className="text-[10px] font-black uppercase text-slate-100">{b.label}</p>
                    <p className="text-[8px] text-slate-500 mt-1">{b.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Workload Tracker */}
          <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <h3 className="text-lg font-bold text-slate-50 mb-6 flex items-center gap-2">
              <Timer className="w-5 h-5 text-purple-500" /> Charge de Travail (Live)
            </h3>
            <div className="space-y-4">
              {teamKPIs.slice(0, 4).map(m => (
                <div key={m.id} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase">
                    <span>{m.name.split(' ')[0]}</span>
                    <span className={m.activeTasks > 5 ? 'text-red-500' : ''}>{m.activeTasks} tâches</span>
                  </div>
                  <div className="h-1 bg-slate-800 rounded-full">
                    <div className={`h-full rounded-full ${m.activeTasks > 5 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-slate-600'} w-p-${Math.min(100, Math.round(((m.activeTasks / 10) * 100) / 5) * 5)}`} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
