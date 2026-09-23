import React from 'react';
import { useStore } from '../../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Clock, TrendingUp, AlertTriangle, CheckCircle2, BarChart3 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, LineChart, Line } from 'recharts';
import { differenceInDays } from 'date-fns';

export function PerformanceInsights() {
  const { objectives, sites } = useStore();

  // Metrics calculation
  const leadTimeData = React.useMemo(() => {
    const completed = (objectives || []).filter(o => o.status === 'Terminé' && o.completedAt);
    return sites.map(site => {
      const siteObjectives = completed.filter(o => o.siteId === site.id);
      const avgLeadTime = siteObjectives.length > 0
        ? siteObjectives.reduce((acc, o) => acc + differenceInDays(new Date(o.completedAt!), new Date(o.createdAt)), 0) / siteObjectives.length
        : 0;
      return { name: site.name, days: Math.round(avgLeadTime * 10) / 10 };
    });
  }, [objectives, sites]);

  const slaPerformance = React.useMemo(() => {
    return (objectives || []).slice(-10).map(o => ({
      name: o.title.substring(0, 10) + '...',
      time: Math.round((o.totalTimeSpentMinutes || 0) / 60),
      sla: o.totalSlaHours || 0
    }));
  }, [objectives]);

  const totalRisky = (objectives || []).filter(o => o.riskScore > 50).length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <Clock className="w-3 h-3" /> Temps de Cycle Moyen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-50">
              {leadTimeData.length > 0 ? (leadTimeData.reduce((acc, d) => acc + d.days, 0) / leadTimeData.length).toFixed(1) : 0} Jours
            </div>
            <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase">De la création à la clôture</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <AlertTriangle className="w-3 h-3 text-amber-500" /> Indice de Risque Global
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-500">
              {totalRisky} <span className="text-sm text-slate-600">Opérations</span>
            </div>
            <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase tracking-tighter">Score de risque {'>'} 50%</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Efficacité SLA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-500">
              {Math.round((objectives.filter(o => (o.totalTimeSpentMinutes || 0) / 60 <= (o.totalSlaHours || 999)).length / objectives.length) * 100) || 0}%
            </div>
            <p className="text-[10px] text-slate-600 mt-1 font-bold uppercase">Respect des délais théoriques</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Lead Time par Site (Jours)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="days" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/40 border-slate-800">
          <CardHeader>
            <CardTitle className="text-xs font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Réel vs SLA (Dernières Opérations)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={slaPerformance}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px' }}
                />
                <Line type="monotone" dataKey="time" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} name="Réel (h)" />
                <Line type="monotone" dataKey="sla" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" dot={false} name="SLA (h)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
