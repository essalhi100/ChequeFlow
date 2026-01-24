
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  PieChart, Pie, AreaChart, Area, LineChart, Line, Legend
} from 'recharts';
import { 
  Download, Printer, RefreshCw, FileText, TrendingUp, TrendingDown, 
  AlertCircle, Calendar, Filter as FilterIcon, Search, Building2, 
  ArrowUpRight, AlertTriangle, CheckCircle2, MoreHorizontal, ChevronDown,
  Info
} from 'lucide-react';
import { Check, CheckStatus, Currency, CheckType } from '../types.ts';
import { COLORS, formatCurrency } from '../constants.tsx';

interface ReportsProps {
  checks: Check[];
  currency: Currency;
}

const Reports: React.FC<ReportsProps> = ({ checks, currency }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | CheckType>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CheckStatus>('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });

  // 1. CALCULATIONS
  const stats = useMemo(() => {
    const today = new Date();
    const soonThreshold = new Date();
    soonThreshold.setDate(today.getDate() + 7);

    const incoming = checks.filter(c => c.type === CheckType.INCOMING);
    const outgoing = checks.filter(c => c.type === CheckType.OUTGOING);
    const pending = checks.filter(c => c.status === CheckStatus.PENDING);
    const returned = checks.filter(c => c.status === CheckStatus.RETURNED);
    const dueSoon = pending.filter(c => {
      const due = new Date(c.due_date);
      return due >= today && due <= soonThreshold;
    });
    const dueToday = pending.filter(c => {
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
      totalDueSoon: dueSoon.reduce((s, c) => s + c.amount, 0),
      countDueSoon: dueSoon.length,
      countDueToday: dueToday.length,
      totalDueToday: dueToday.reduce((s, c) => s + c.amount, 0),
    };
  }, [checks]);

  // 2. CHART DATA PREPARATION
  const statusChartData = [
    { name: 'Encaissé', value: checks.filter(c => c.status === CheckStatus.PAID).length, color: COLORS.success },
    { name: 'En attente', value: stats.countPending, color: '#f59e0b' },
    { name: 'Retourné', value: stats.countReturned, color: COLORS.risk },
  ].filter(d => d.value > 0);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data: any[] = [];
    const last6Months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() - (5 - i));
      return { month: d.getMonth(), year: d.getFullYear(), label: months[d.getMonth()] };
    });

    last6Months.forEach(m => {
      const inVal = checks.filter(c => {
        const d = new Date(c.due_date);
        return d.getMonth() === m.month && d.getFullYear() === m.year && c.type === CheckType.INCOMING;
      }).reduce((sum, c) => sum + c.amount, 0);

      const outVal = checks.filter(c => {
        const d = new Date(c.due_date);
        return d.getMonth() === m.month && d.getFullYear() === m.year && c.type === CheckType.OUTGOING;
      }).reduce((sum, c) => sum + c.amount, 0);

      data.push({ name: m.label, incoming: inVal, outgoing: outVal });
    });
    return data;
  }, [checks]);

  // 3. TABLE FILTERING
  const filteredChecks = useMemo(() => {
    return checks.filter(c => {
      const matchesSearch = c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || c.check_number.includes(searchTerm);
      const matchesType = typeFilter === 'all' || c.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      let matchesRange = true;
      if (dateRange.from && dateRange.to) {
        const due = new Date(c.due_date);
        matchesRange = due >= new Date(dateRange.from) && due <= new Date(dateRange.to);
      }
      return matchesSearch && matchesType && matchesStatus && matchesRange;
    });
  }, [checks, searchTerm, typeFilter, statusFilter, dateRange]);

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
      {/* HEADER SECTION */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Reporting Intelligence</h2>
          <p className="text-white/40 text-sm">Real-time audit and capital analysis dashboard</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-[12px] border border-white/10">
            <input 
              type="date" 
              className="bg-transparent text-[10px] font-bold text-white outline-none border-none p-1 [color-scheme:dark]"
              value={dateRange.from}
              onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
            />
            <span className="text-white/20 text-xs">to</span>
            <input 
              type="date" 
              className="bg-transparent text-[10px] font-bold text-white outline-none border-none p-1 [color-scheme:dark]"
              value={dateRange.to}
              onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
            />
          </div>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 transition-colors" title="Export PDF">
            <Download size={18} />
          </button>
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-[12px] text-white/60 transition-colors" title="Print">
            <Printer size={18} />
          </button>
          <button className="p-3 bg-gold text-black rounded-[12px] font-black text-[10px] uppercase tracking-widest shadow-lg hover:scale-105 transition-transform flex items-center gap-2 px-6">
            <RefreshCw size={14} /> Update Data
          </button>
        </div>
      </div>

      {/* INTELLIGENT ALERTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.countDueToday > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-[14px] flex items-center gap-4 animate-pulse">
            <div className="p-2.5 bg-amber-500/20 rounded-full text-amber-500">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Action Required Today</p>
              <p className="text-xs text-white/80 font-bold">{stats.countDueToday} checks due for collection today ({formatCurrency(stats.totalDueToday, currency)})</p>
            </div>
          </div>
        )}
        {stats.countReturned > 0 && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-[14px] flex items-center gap-4">
            <div className="p-2.5 bg-rose-500/20 rounded-full text-rose-500">
              <AlertTriangle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Financial Risk Alert</p>
              <p className="text-xs text-white/80 font-bold">{stats.countReturned} returned instruments detected in vault.</p>
            </div>
          </div>
        )}
      </div>

      {/* SUMMARY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <SummaryCard 
          title="Total Incoming" 
          amount={stats.totalIncoming} 
          count={stats.countIncoming} 
          icon={TrendingUp} 
          color="text-emerald-500" 
          subText="Verified assets"
        />
        <SummaryCard 
          title="Total Outgoing" 
          amount={stats.totalOutgoing} 
          count={stats.countOutgoing} 
          icon={TrendingDown} 
          color="text-rose-500" 
          subText="Capital liabilities"
        />
        <SummaryCard 
          title="Under Collection" 
          amount={stats.totalPending} 
          count={stats.countPending} 
          icon={FileText} 
          color="text-amber-500" 
          subText="Awaiting clearance"
        />
        <SummaryCard 
          title="Due Soon" 
          amount={stats.totalDueSoon} 
          count={stats.countDueSoon} 
          icon={Calendar} 
          color="text-blue-500" 
          subText="Maturity in < 7 days"
        />
        <SummaryCard 
          title="Returned" 
          amount={stats.totalReturned} 
          count={stats.countReturned} 
          icon={AlertTriangle} 
          color="text-slate-400" 
          subText="Non-verified liquidity"
        />
      </div>

      {/* CHARTS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 glass-card p-8 rounded-[14px] border-white/5">
          <div className="flex items-center justify-between mb-8">
             <h4 className="text-lg font-bold flex items-center gap-3">
               <TrendingUp className="text-gold" />
               Capital Flow Comparison
             </h4>
             <div className="flex gap-4">
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                   <span className="text-[10px] font-black text-white/40 uppercase">In</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                   <span className="text-[10px] font-black text-white/40 uppercase">Out</span>
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
                <Bar dataKey="incoming" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="outgoing" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="lg:col-span-1 glass-card p-8 rounded-[14px] border-white/5">
           <h4 className="text-lg font-bold flex items-center gap-3 mb-8">
             <Building2 className="text-gold" />
             Instrument Status Breakdown
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
                <span className="text-[10px] text-white/20 uppercase font-black tracking-widest">Total Active</span>
             </div>
           </div>
        </div>
      </div>

      {/* ADVANCED FILTERING & DETAILED GRID */}
      <div className="glass-card rounded-[14px] border-white/5 overflow-hidden">
        <div className="p-8 border-b border-white/5 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <h4 className="text-lg font-bold">Detailed Data Matrix</h4>
            <div className="relative group min-w-[320px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" size={18} />
              <input 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by entity, bank or check #"
                className="w-full bg-white/5 border border-white/10 rounded-[12px] py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-gold/30 transition-all placeholder:text-white/10"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2 bg-white/5 p-1 rounded-[10px] border border-white/10">
               <button onClick={() => setTypeFilter('all')} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === 'all' ? 'bg-gold text-black' : 'text-white/40 hover:text-white'}`}>All Types</button>
               <button onClick={() => setTypeFilter(CheckType.INCOMING)} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === CheckType.INCOMING ? 'bg-emerald-500 text-white' : 'text-white/40 hover:text-white'}`}>Incoming</button>
               <button onClick={() => setTypeFilter(CheckType.OUTGOING)} className={`px-4 py-1.5 rounded-[8px] text-[10px] font-black uppercase transition-all ${typeFilter === CheckType.OUTGOING ? 'bg-rose-500 text-white' : 'text-white/40 hover:text-white'}`}>Outgoing</button>
             </div>

             <div className="relative min-w-[200px]">
               <FilterIcon size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
               <select 
                 value={statusFilter}
                 onChange={(e) => setStatusFilter(e.target.value as any)}
                 className="w-full bg-white/5 border border-white/10 rounded-[10px] py-2.5 pl-10 pr-4 text-[10px] font-black uppercase tracking-widest focus:outline-none appearance-none cursor-pointer"
               >
                 <option value="all">Every Status</option>
                 <option value={CheckStatus.PAID}>Paid / Verified</option>
                 <option value={CheckStatus.PENDING}>Pending</option>
                 <option value={CheckStatus.RETURNED}>Returned</option>
               </select>
               <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 pointer-events-none" />
             </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-white/[0.01] border-b border-white/5">
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Reference</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Entity & Bank</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Dates</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Capital Flow</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-white/30 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredChecks.map((check) => (
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
                        <span className="text-[9px] font-black text-white/20 uppercase w-10">Issue:</span>
                        <span className="text-[11px] font-bold text-white/60">{new Date(check.issue_date).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-black text-white/20 uppercase w-10">Due:</span>
                        <span className={`text-[11px] font-black ${new Date(check.due_date) < new Date() && check.status === CheckStatus.PENDING ? 'text-rose-400' : 'text-white/80'}`}>
                          {new Date(check.due_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-baseline gap-2">
                       <span className="text-base font-black text-white">{formatCurrency(check.amount, currency)}</span>
                       <span className={`text-[9px] font-black uppercase tracking-tighter ${check.type === CheckType.INCOMING ? 'text-emerald-500' : 'text-rose-500'}`}>
                         {check.type === CheckType.INCOMING ? 'Credit' : 'Debit'}
                       </span>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                      check.status === CheckStatus.PAID 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : check.status === CheckStatus.PENDING 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {check.status === CheckStatus.PAID ? 'Cleared' : check.status === CheckStatus.PENDING ? 'Pending' : 'Returned'}
                    </span>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button className="p-2.5 bg-white/5 hover:bg-gold/20 hover:text-gold rounded-lg transition-all">
                         <Info size={14} />
                       </button>
                       <button className="p-2.5 bg-white/5 hover:bg-white/10 rounded-lg transition-all">
                         <MoreHorizontal size={14} />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredChecks.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-24 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/10 italic">Matrix Empty: Adjust search parameters</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
