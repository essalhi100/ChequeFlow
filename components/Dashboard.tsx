
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertCircle,
  Clock,
  ChevronRight,
  Receipt,
  Users,
  Activity,
  HardDrive,
  Zap,
  ArrowUpRight,
  CalendarDays
} from 'lucide-react';
import { Check, CheckType, CheckStatus, Currency } from '../types.ts';
import { formatCurrency, getTypeBadge } from '../constants.tsx';

interface DashboardProps {
  checks: Check[];
  currency: Currency;
  onTabChange: (tab: 'checks') => void;
  isAdmin?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ checks, currency, onTabChange, isAdmin }) => {
  const incoming = checks.filter(c => c.type === CheckType.INCOMING);
  const outgoing = checks.filter(c => c.type === CheckType.OUTGOING);

  const totalIncoming = incoming.reduce((sum, c) => sum + c.amount, 0);
  const totalOutgoing = outgoing.reduce((sum, c) => sum + c.amount, 0);
  const netLiquidity = totalIncoming - totalOutgoing;

  // Dynamic Trend Calculation
  const trends = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevMonthDate = new Date();
    prevMonthDate.setMonth(now.getMonth() - 1);
    const prevMonth = prevMonthDate.getMonth();
    const prevYear = prevMonthDate.getFullYear();

    const getMonthStats = (m: number, y: number) => {
      const monthChecks = checks.filter(c => {
        const d = new Date(c.due_date || c.created_at);
        return d.getMonth() === m && d.getFullYear() === y;
      });
      const inc = monthChecks.filter(c => c.type === CheckType.INCOMING).reduce((s, c) => s + c.amount, 0);
      const out = monthChecks.filter(c => c.type === CheckType.OUTGOING).reduce((s, c) => s + c.amount, 0);
      return { inc, out, net: inc - out };
    };

    const current = getMonthStats(currentMonth, currentYear);
    const last = getMonthStats(prevMonth, prevYear);

    const calcTrend = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Math.round(((curr - prev) / prev) * 100);
    };

    return {
      incTrend: calcTrend(current.inc, last.inc),
      outTrend: calcTrend(current.out, last.out),
      netTrend: calcTrend(current.net, last.net)
    };
  }, [checks]);

  const pendingChecks = checks.filter(c => c.status === CheckStatus.PENDING);
  const overdueChecks = pendingChecks.filter(c => new Date(c.due_date) < new Date());
  
  const operationalAlerts = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    threeDaysFromNow.setHours(23, 59, 59, 999);

    const incomingToday = checks.filter(c => 
      c.type === CheckType.INCOMING && 
      c.status === CheckStatus.PENDING && 
      new Date(c.due_date).toDateString() === today.toDateString()
    );

    const outgoingNext3Days = checks.filter(c => 
      c.type === CheckType.OUTGOING && 
      c.status === CheckStatus.PENDING && 
      new Date(c.due_date) >= today && 
      new Date(c.due_date) <= threeDaysFromNow
    );

    return {
      incomingToday,
      incomingTodaySum: incomingToday.reduce((s, c) => s + c.amount, 0),
      outgoingNext3Days,
      outgoingNext3DaysSum: outgoingNext3Days.reduce((s, c) => s + c.amount, 0)
    };
  }, [checks]);

  const recentChecks = [...checks].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

  const StatCard = ({ title, amount, icon: Icon, trend, colorClass, isCurrency = true }: any) => (
    <div className="glass-card p-7 rounded-[12px] relative overflow-hidden group hover:border-gold/20 transition-all duration-500">
      <div className={`absolute top-0 right-0 p-7 opacity-[0.03] group-hover:scale-105 transition-transform ${colorClass}`}>
        <Icon size={70} />
      </div>
      <p className="text-white/30 text-[9px] font-bold uppercase tracking-[0.15em] mb-3">{title}</p>
      <h3 className="text-[22px] font-bold leading-[33px] mb-3 tracking-tight">
        {isCurrency ? formatCurrency(amount, currency) : amount}
      </h3>
      <div className={`flex items-center gap-1.5 text-[11px] font-semibold ${trend >= 0 ? 'text-emerald-400/80' : 'text-rose-400/80'}`}>
        {trend >= 0 ? '+' : ''}{trend}% vs cycle précédent
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-top-4 duration-1000">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className={`text-[22px] font-bold leading-[33px] italic tracking-tight ${isAdmin ? 'text-gold' : 'text-white'}`}>
              {isAdmin ? 'CONSOLE D\'ADMINISTRATION' : 'TABLEAU DE BORD'}
            </h2>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded-full bg-gold/10 border border-gold/20 text-[8px] font-bold text-gold tracking-widest">
                SYS_ADMIN
              </span>
            )}
          </div>
          <p className="text-white/40 text-xs font-medium">
            {isAdmin 
              ? 'Surveillance globale de l\'infrastructure financière.' 
              : `Vue d'ensemble de la liquidité pour le compte ${currency}.`
            }
          </p>
        </div>
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded-full glass-card border-white/5 text-[9px] font-bold uppercase tracking-widest flex items-center gap-2 text-white/50">
            <Clock size={12} className="text-gold" />
            <span>Actualisé en temps réel</span>
          </div>
        </div>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in slide-in-from-left-4 duration-700">
          {[
            { label: 'Utilisateurs Actifs', value: '12 Nœuds', icon: Users, color: 'gold' },
            { label: 'Documents Archivés', value: `${checks.length} Unités`, icon: HardDrive, color: 'emerald-500' },
            { label: 'Vitesse de Latence', value: '0.8s Rps', icon: Zap, color: 'blue-500' },
            { label: 'Indice de Risque', value: `${Math.round(100 - (overdueChecks.length / (checks.length || 1) * 100))}%`, icon: Activity, color: 'rose-500' }
          ].map((stat, i) => (
            <div key={i} className="glass-card p-5 rounded-[12px] border-white/5 flex items-center gap-4">
              <div className={`p-3 bg-${stat.color}/10 rounded-[10px] text-${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-[8px] font-bold text-white/20 uppercase tracking-widest">{stat.label}</p>
                <h4 className="text-sm font-bold text-white/80">{stat.value}</h4>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard title="Actifs (Entrants)" amount={totalIncoming} icon={TrendingUp} trend={trends.incTrend} colorClass="text-emerald-500" />
        <StatCard title="Passifs (Sortants)" amount={totalOutgoing} icon={TrendingDown} trend={trends.outTrend} colorClass="text-rose-500" />
        <StatCard title="Liquidité Nette" amount={netLiquidity} icon={Wallet} trend={trends.netTrend} colorClass="text-gold" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-[12px] border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-md font-bold flex items-center gap-2.5">
              <Receipt className="text-gold" size={18} />
              Derniers Mouvements
            </h4>
            <button onClick={() => onTabChange('checks')} className="text-[9px] font-bold text-gold uppercase tracking-[0.1em] hover:opacity-80 transition-opacity">Tout afficher</button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="pb-4 text-[8px] font-bold text-white/20 uppercase tracking-[0.15em]">Entité</th>
                  <th className="pb-4 text-[8px] font-bold text-white/20 uppercase tracking-[0.15em]">Montant</th>
                  <th className="pb-4 text-[8px] font-bold text-white/20 uppercase tracking-[0.15em]">Échéance</th>
                  <th className="pb-4 text-[8px] font-bold text-white/20 uppercase tracking-[0.15em] text-right">Flux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {recentChecks.map((check) => (
                  <tr key={check.id} className="group transition-colors">
                    <td className="py-4">
                      <p className="text-[13px] font-bold text-white/80 group-hover:text-gold transition-colors">{check.entity_name}</p>
                      <p className="text-[9px] text-white/20 font-medium">{check.bank_name}</p>
                    </td>
                    <td className="py-4 font-bold text-[13px]">{formatCurrency(check.amount, currency)}</td>
                    <td className="py-4 text-[11px] text-white/40">{new Date(check.due_date).toLocaleDateString()}</td>
                    <td className="py-4 text-right">{getTypeBadge(check.type)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          {/* Main Risk Card */}
          <div className="glass-card p-7 rounded-[12px] border-rose-500/10 bg-rose-500/[0.02]">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2.5 bg-rose-500/10 rounded-[10px] text-rose-400">
                <AlertCircle size={20} />
              </div>
              <span className="text-[8px] font-bold text-rose-400 uppercase tracking-widest">Risque Critique</span>
            </div>
            <h5 className="text-xl font-bold text-white/90 mb-1">{overdueChecks.length} Alertes d'échéance</h5>
            <p className="text-white/30 text-[11px] mb-6 leading-relaxed">Paiements en attente ayant dépassé la date de maturité sans confirmation.</p>
            <button 
              onClick={() => onTabChange('checks')}
              className="w-full py-3.5 bg-rose-500/90 text-white rounded-[10px] font-bold text-[11px] hover:bg-rose-500 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
            >
              Gérer les risques <ChevronRight size={14} />
            </button>
          </div>

          {/* Operational Alerts Area */}
          <div className="space-y-4 pt-2 border-t border-white/5">
            <h6 className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Prochaines Opérations</h6>
            
            {/* Incoming Today Alert */}
            <div className={`p-5 rounded-[12px] border ${operationalAlerts.incomingToday.length > 0 ? 'border-emerald-500/20 bg-emerald-500/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-40'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-[8px] ${operationalAlerts.incomingToday.length > 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                    <ArrowUpRight size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Entrants (Aujourd'hui)</span>
                </div>
                {operationalAlerts.incomingToday.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-[8px] font-black text-emerald-400 uppercase">Actif</span>
                )}
              </div>
              {operationalAlerts.incomingToday.length > 0 ? (
                <>
                  <p className="text-lg font-black text-white">{formatCurrency(operationalAlerts.incomingTodaySum, currency)}</p>
                  <p className="text-[9px] text-emerald-400/60 font-bold mt-1 uppercase italic tracking-tighter">
                    {operationalAlerts.incomingToday.length} instrument(s) à encaisser immédiatement
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-white/20 italic">Aucun flux entrant prévu aujourd'hui</p>
              )}
            </div>

            {/* Outgoing Next 3 Days Alert */}
            <div className={`p-5 rounded-[12px] border ${operationalAlerts.outgoingNext3Days.length > 0 ? 'border-amber-500/20 bg-amber-500/[0.03]' : 'border-white/5 bg-white/[0.01] opacity-40'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-[8px] ${operationalAlerts.outgoingNext3Days.length > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-white/5 text-white/20'}`}>
                    <CalendarDays size={14} />
                  </div>
                  <span className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Sortants (3 Prochains Jours)</span>
                </div>
                {operationalAlerts.outgoingNext3Days.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-[8px] font-black text-amber-400 uppercase">Alert</span>
                )}
              </div>
              {operationalAlerts.outgoingNext3Days.length > 0 ? (
                <>
                  <p className="text-lg font-black text-white">{formatCurrency(operationalAlerts.outgoingNext3DaysSum, currency)}</p>
                  <p className="text-[9px] text-amber-400/60 font-bold mt-1 uppercase italic tracking-tighter">
                    {operationalAlerts.outgoingNext3Days.length} paiement(s) à provisionner
                  </p>
                </>
              ) : (
                <p className="text-[10px] text-white/20 italic">Aucune sortie critique dans les 72h</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
