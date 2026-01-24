
import React, { useState } from 'react';
import { Search, Plus, Calendar, Filter, CheckCircle2, Pencil } from 'lucide-react';
import { Check, Currency, CheckType, CheckStatus } from '../types.ts';
import { formatCurrency, getStatusBadge, getTypeBadge } from '../constants.tsx';

interface CheckListProps {
  checks: Check[];
  currency: Currency;
  onAdd: () => void;
  onEdit: (check: Check) => void;
  onDelete: (id: string) => void;
  onMarkAsPaid?: (id: string) => void;
  isAdmin?: boolean;
}

const CheckList: React.FC<CheckListProps> = ({ checks, currency, onAdd, onEdit, onMarkAsPaid, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CheckStatus>('all');

  const isToday = (dateString: string) => {
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const filteredChecks = checks.filter(c => {
    const matchesSearch = 
      c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.check_number.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    let matchesDate = true;
    if (dateFilter !== 'all') {
      if (dateFilter === 'today') matchesDate = isToday(c.due_date);
    }
    return matchesSearch && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-white italic tracking-tight uppercase">Registre des Opérations</h1>
        <button 
          onClick={onAdd}
          className="bg-gold text-black font-bold text-[11px] uppercase tracking-widest px-8 py-3.5 rounded-[12px] hover:opacity-90 transition-all flex items-center gap-2 shadow-lg"
        >
          <Plus size={16} />
          Nouveau Chèque
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 items-center">
        <div className="relative flex-1 group w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
          <input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par numéro ou entité..."
            className="w-full bg-[#0a0d18] border border-white/5 rounded-[12px] py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-gold/20 transition-all placeholder:text-white/10 text-white"
          />
        </div>

        <div className="flex items-center gap-1 bg-[#0a0d18] p-1 rounded-[12px] border border-white/5 w-full lg:w-auto">
          {['all', 'today', 'week', 'month'].map((filter) => (
            <button 
              key={filter}
              onClick={() => setDateFilter(filter as any)} 
              className={`px-4 py-2 rounded-[10px] text-[9px] font-bold uppercase tracking-tight transition-all ${dateFilter === filter ? 'bg-gold text-black' : 'text-white/30 hover:text-white/60'}`}
            >
              {filter === 'all' ? 'Tout' : filter === 'today' ? 'Auj.' : filter === 'week' ? 'Sem.' : 'Mois'}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-auto min-w-[180px]">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-[#0a0d18] border border-white/5 rounded-[12px] pl-5 pr-10 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-gold/20 appearance-none cursor-pointer text-white/60"
          >
            <option value="all">Statuts: Tous</option>
            <option value={CheckStatus.PENDING}>En attente</option>
            <option value={CheckStatus.PAID}>Finalisé</option>
            <option value={CheckStatus.RETURNED}>Retourné</option>
          </select>
        </div>
      </div>

      <div className="glass-card rounded-[12px] overflow-hidden border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 bg-white/[0.01]">
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Référence</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Échéance</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Bénéficiaire/Émetteur</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Montant</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-center">Flux</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-center">État</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredChecks.map((check) => (
                <tr key={check.id} className="hover:bg-white/[0.015] transition-colors group">
                  <td className="px-6 py-4 text-[11px] font-medium text-white/40">{check.check_number}</td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-semibold text-white/60">
                      {new Date(check.due_date).toLocaleDateString('fr-FR')}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[12px] font-bold text-white/80">{check.entity_name}</td>
                  <td className="px-6 py-4 text-[12px] font-bold text-white">{formatCurrency(check.amount, currency)}</td>
                  <td className="px-6 py-4 text-center">{getTypeBadge(check.type)}</td>
                  <td className="px-6 py-4 text-center">{getStatusBadge(check.status)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {check.status === CheckStatus.PENDING && (
                        <button onClick={() => onMarkAsPaid?.(check.id)} className="p-2 text-emerald-500/60 hover:text-emerald-400 transition-colors">
                          <CheckCircle2 size={16} />
                        </button>
                      )}
                      <button onClick={() => onEdit(check)} className="p-2 text-white/20 hover:text-gold transition-colors">
                        <Pencil size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CheckList;
