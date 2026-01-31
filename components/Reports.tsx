
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie
} from 'recharts';
import { 
  Download, Printer, RefreshCw, FileText, TrendingUp, TrendingDown, 
  AlertCircle, Building2, 
  AlertTriangle, ChevronDown,
  Info,
  ShieldCheck,
  RotateCcw,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Check, CheckStatus, Currency, CheckType } from '../types.ts';
import { COLORS, formatCurrency } from '../constants.tsx';

interface ReportsProps {
  checks: Check[];
  currency: Currency;
}

const ITEMS_PER_PAGE = 8;

const Reports: React.FC<ReportsProps> = ({ checks, currency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CheckType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CheckStatus>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, statusFilter, dateRange]);

  const handleReset = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setStatusFilter('all');
    setDateRange({ from: '', to: '' });
  };

  const stats = useMemo(() => {
    const today = new Date();
    const soonThreshold = new Date();
    soonThreshold.setDate(today.getDate() + 7);

    const incoming = checks.filter(c => c.type === CheckType.INCOMING);
    const outgoing = checks.filter(c => c.type === CheckType.OUTGOING);
    const pending = checks.filter(c => c.status === CheckStatus.PENDING);
    const returned = checks.filter(c => c.status === CheckStatus.RETURNED);
    const garantie = checks.filter(c => c.status === CheckStatus.GARANTIE);
    const dueSoon = pending.filter(c => {
      if (!c.due_date) return false;
      const due = new Date(c.due_date);
      return due >= today && due <= soonThreshold;
    });
    const dueToday = pending.filter(c => {
      if (!c.due_date) return false;
      const due = new Date(c.due_date);
      return due.toDateString() === today.toDateString();
    });

    return {
      totalIncoming: incoming.reduce((s, c) => s + c.amount, 0),
      countIncoming: incoming.length,
      totalOutgoing: outgoing.reduce((s, c) => s + c.amount, 0),
      countOutgoing: outgoing.length,
      totalPending: pending.reduce((s, c) => s + c.amount, 0),
      countPending: pending.length,
      totalReturned: returned.reduce((s, c) => s + c.amount, 0),
      countReturned: returned.length,
      totalGarantie: garantie.reduce((s, c) => s + c.amount, 0),
      countGarantie: garantie.length,
      totalDueSoon: dueSoon.reduce((s, c) => s + c.amount, 0),
      countDueSoon: dueSoon.length,
      countDueToday: dueToday.length,
      totalDueToday: dueToday.reduce((s, c) => s + c.amount, 0),
    };
  }, [checks]);

  const statusChartData = [
    { name: 'Payé', value: checks.filter(c => c.status === CheckStatus.PAID).length, color: COLORS.success },
    { name: 'En attente', value: stats.countPending, color: '#f59e0b' },
    { name: 'Return', value: stats.countReturned, color: COLORS.risk },
    { name: 'Garantie', value: stats.countGarantie, color: '#3b82f6' },
  ].filter(d => d.value > 0);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data: any[] = [];
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: d.getMonth(), year: d.getFullYear(), label: months[d.getMonth()] };
    });

    last6Months.forEach(m => {
      const inVal = checks.filter(c => {
        if (!c.due_date) return false;
        const d = new Date(c.due_date);
        return d.getMonth() === m.month && d.getFullYear() === m.year && c.type === CheckType.INCOMING;
      }).reduce((sum, c) => sum + c.amount, 0);

      const outVal = checks.filter(c => {
        if (!c.due_date) return false;
        const d = new Date(c.due_date);
        return d.getMonth() === m.month && d.getFullYear() === m.year && c.type === CheckType.OUTGOING;
      }).reduce((sum, c) => sum + c.amount, 0);

      data.push({ name: m.label, entrants: inVal, sortants: outVal });
    });
    return data;
  }, [checks]);

  const filteredChecks = useMemo(() => {
    return checks.filter(c => {
      const matchesSearch = c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.check_number.includes(searchTerm);
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      let matchesRange = true;
      if (dateRange.from && dateRange.to) {
        if (!c.due_date) return false;
        const due = new Date(c.due_date);
        matchesRange = due >= new Date(dateRange.from) && due <= new Date(dateRange.to);
      }
      return matchesSearch && matchesType && matchesStatus && matchesRange;
    });
  }, [checks, searchTerm, typeFilter, statusFilter, dateRange]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredChecks.length / ITEMS_PER_PAGE);
  const paginatedChecks = filteredChecks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const SummaryCard = ({ title, amount, count, icon: Icon, color, subText }: any) => (
    <div className="glass-card p-6 rounded-[14px] border-white/5 relative overflow-hidden group hover:border-white/10 transition-all duration-500">
      <div className={`absolute top-0 right-0 p-6 opacity-[0.03] transform group-hover:scale-110 transition-transform ${color}`}>
        <Icon size={80} />
      </div>
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-[12px] bg-opacity-10 ${color.replace('text-', 'bg-')} ${color}`}>
          <Icon size={20} />
        </div>
        <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{count} records</span>
      </div>
      <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
      <h3 className="text-[22px] font-bold leading-[33px] text-white mb-2">{formatCurrency(amount, currency)}</h3>
      {subText && <p className="text-[10px] text-white/30 italic font-medium">{subText}</p>}
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Intelligence de Rapport</h2>
          <p className="text-white/40 text-sm">Audit en temps réel et analyse du capital</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={handleReset}
            className="p-3 bg-[#0a0d18] border border-white/5 rounded-[12px] text-white/40 hover:text-white transition-all group"
            title="Réinitialiser tous les filtres"
          >
            <RotateCcw size={18} className="group-hover:rotate-[-45deg] transition-transform" />
          </button>
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[12px] border border-white/10">
            <input 
              type="date" 
              className="bg-transparent text-[10px] font-bold text-white outline-none border-none p-1 [color-scheme:dark]"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            />
            <span className="text-white/20 text-xs">au</span>
            <input 
              type="date" 
              className="bg-transparent text-[10px] font-bold text-white outline-none border-none p-1 [color-scheme:dark]"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            />
          </div>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 transition-colors">
            <Download size={18} />
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 transition-colors">
            <Printer size={18} />
          </button>
          <button className="p-3 bg-gold text-black rounded-[12px] font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-2 px-6">
            <RefreshCw size={14} /> Actualiser
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.countDueToday > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[14px] flex items-center gap-4 animate-pulse">
            <div className="p-2.5 bg-amber-500/20 rounded-full text-amber-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Action Requise Aujourd'hui</p>
              <p className="text-xs text-white/80 font-bold">{stats.countDueToday} chèque(s) à encaisser aujourd'hui ({formatCurrency(stats.totalDueToday, currency)})</p>
            </div>
          </div>
        )}
        {stats.countReturned > 0 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[14px] flex items-center gap-4">
            <div className="p-2.5 bg-rose-500/20 rounded-full text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Alerte de Risque Financier</p>
              <p className="text-xs text-white/80 font-bold">{stats.countReturned} Return(s) détectés dans le coffre.</p>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <SummaryCard 
          title="Total Entrants" 
          amount={stats.totalIncoming} 
          count={stats.countIncoming} 
          icon={TrendingUp} 
          color="text-emerald-500" 
          subText="Actifs vérifiés"
        />
        <SummaryCard 
          title="Total Sortants" 
          amount={stats.totalOutgoing} 
          count={stats.countOutgoing} 
          icon={TrendingDown} 
          color="text-rose-500" 
          subText="Passifs de capital"
        />
        <SummaryCard 
          title="En Collection" 
          amount={stats.totalPending} 
          count={stats.countPending} 
          icon={FileText} 
          color="text-amber-500" 
          subText="Attente de compensation"
        />
        <SummaryCard 
          title="Returns" 
          amount={stats.totalReturned} 
          count={stats.countReturned} 
          icon={AlertTriangle} 
          color="text-rose-400" 
          subText="Liquidité non vérifiée"
        />
        <SummaryCard 
          title="Garanties" 
          amount={stats.totalGarantie} 
          count={stats.countGarantie} 
          icon={ShieldCheck} 
          color="text-blue-400" 
          subText="Engagements externes"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-[14px] border-white/5">
          <div className="flex items-center justify-between mb-8">
             <h4 className="text-lg font-bold flex items-center gap-3">
               <TrendingUp className="text-gold" />
               Flux de Capital Mensuel
             </h4>
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-black text-white/40 uppercase">Entrants</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                   <span className="text-[10px] font-black text-white/40 uppercase">Sortants</span>
                </div>
             </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="rgba(255,255,255,0.3)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: '#0a0d18', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }}
                />
                <Bar dataKey="entrants" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="sortants" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 glass-card p-8 rounded-[14px] border-white/5">
           <h4 className="text-lg font-bold flex items-center gap-3 mb-8">
             <Building2 className="text-gold" />
             Répartition par Statut
           </h4>
           <div className="h-[300px] flex items-center justify-center relative">
             <ResponsiveContainer width="100%" height="100%">
               <PieChart>
                 <Pie
                   data={statusChartData}
                   innerRadius={80}
                   outerRadius={100}
                   paddingAngle={10}
                   dataKey="value"
                   stroke="none"
                 >
                   {statusChartData.map((entry, index) => (
                     <Cell key={`cell-${index}`} fill={entry.color} />
                   ))}
                 </Pie>
                 <Tooltip />
               </PieChart>
             </ResponsiveContainer>
             <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-black text-white tracking-tighter">{checks.length}</span>
                <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Actifs Totaux</span>
             </div>
           </div>
        </div>
      </div>

      <div className="glass-card rounded-[14px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h4 className="text-lg font-bold">Matrice de Données Détaillée</h4>
            <div className="flex items-center gap-3">
              <button 
                onClick={handleReset}
                className="p-3 bg-[#0a0d18] border border-white/5 rounded-[12px] text-white/40 hover:text-white transition-all group"
                title="Réinitialiser les filtres locaux"
              >
                <RotateCcw size={16} className="group-hover:rotate-[-45deg] transition-transform" />
              </button>
              <div className="relative group min-w-[320px]">
                <Info className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" size={18} />
                <input 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Recherche par entité, banque ou chèque #"
                  className="w-full bg-white/5 border border-white/10 rounded-[12px] py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-gold/30 transition-all placeholder:text-white/10"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2 bg-white/5 p-1 rounded-[10px] border border-white/10">
               <button onClick={() => setTypeFilter('all')} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === 'all' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}>Tous les Types</button>
               <button onClick={() => setTypeFilter(CheckType.INCOMING)} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === CheckType.INCOMING ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}>Entrants</button>
               <button onClick={() => setTypeFilter(CheckType.OUTGOING)} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === CheckType.OUTGOING ? 'bg-rose-500 text-white' : 'text-white/40 hover:text-white'}`}>Sortants</button>
             </div>

             <div className="relative min-w-[200px]">
               <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value as any)}
                 className="w-full bg-black border border-white/10 rounded-[10px] py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none cursor-pointer text-white"
               >
                 <option value="all" className="bg-black text-white">Tous les Statuts</option>
                 <option value={CheckStatus.PAID} className="bg-black text-white">Payés</option>
                 <option value={CheckStatus.PENDING} className="bg-black text-white">En attente</option>
                 <option value={CheckStatus.RETURNED} className="bg-black text-white">Returns</option>
                 <option value={CheckStatus.GARANTIE} className="bg-black text-white">Garanties</option>
               </select>
               <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/5">
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Référence</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Entité & Banque</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Dates</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Flux de Capital</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedChecks.map((check) => (
                <tr key={check.id} className="hover:bg-white/[0.01] transition-colors group">
                  <td className="px-8 py-5">
                    <span className="text-[11px] font-bold text-white/40 tracking-widest">{check.check_number}</span>
                  </td>
                  <td className="px-8 py-5">
                    <p className="text-sm font-black text-white group-hover:text-gold transition-colors">{check.entity_name}</p>
                    <p className="text-[10px] text-white/30 font-medium italic">{check.bank_name}</p>
                  </td>
                  <td className="px-8 py-5">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-white/20 uppercase w-12">Émis:</span>
                        <span className="text-[11px] font-bold text-white/60">{check.issue_date ? new Date(check.issue_date).toLocaleDateString() : '---'}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-white/20 uppercase w-12">Échéance:</span>
                        <span className={`text-[11px] font-black ${check.due_date && new Date(check.due_date) < new Date() && check.status === CheckStatus.PENDING ? 'text-rose-400' : 'text-white/80'}`}>
                          {check.due_date ? new Date(check.due_date).toLocaleDateString() : '---'}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-baseline gap-2">
                       <span className="text-base font-black text-white">{formatCurrency(check.amount, currency)}</span>
                       <span className={`text-[9px] font-black uppercase tracking-tighter ${check.type === CheckType.INCOMING ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {check.type === CheckType.INCOMING ? 'Crédit' : 'Débit'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      check.status === CheckStatus.PAID 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : check.status === CheckStatus.PENDING 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : check.status === CheckStatus.GARANTIE
                            ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {check.status === CheckStatus.PAID ? 'Payé' : check.status === CheckStatus.PENDING ? 'En attente' : check.status === CheckStatus.GARANTIE ? 'Garantie' : 'Return'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-8 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
              Résultats {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredChecks.length)} sur {filteredChecks.length}
            </p>
            <div className="flex items-center gap-2">
              <button 
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => prev - 1)}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-gold/10 hover:text-gold transition-all disabled:opacity-20 disabled:pointer-events-none"
              >
                <ChevronLeft size={16} />
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-[10px] font-black transition-all ${
                      currentPage === page 
                        ? 'bg-gold text-black shadow-lg shadow-gold/20' 
                        : 'text-white/30 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button 
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(prev => prev + 1)}
                className="p-2 rounded-lg bg-white/5 text-white/40 hover:bg-gold/10 hover:text-gold transition-all disabled:opacity-20 disabled:pointer-events-none"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;
