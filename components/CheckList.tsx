
import React, { useState, useEffect } from 'react';
import { Search, Plus, CheckCircle2, Pencil, RotateCcw, UserCheck, ChevronLeft, ChevronRight } from 'lucide-react';
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

const ITEMS_PER_PAGE = 8;

const CheckList: React.FC<CheckListProps> = ({ checks, currency, onAdd, onEdit, onMarkAsPaid, isAdmin }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | CheckStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | CheckType>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page when any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, dateFilter, statusFilter, typeFilter]);

  const handleReset = () => {
    setSearchTerm('');
    setDateFilter('all');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    const today = new Date();
    const date = new Date(dateString);
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };

  const filteredChecks = checks.filter(c => {
    const matchesSearch = 
      c.entity_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.check_number.includes(searchTerm) ||
      (c.fund_name && c.fund_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.notes && c.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    const matchesType = typeFilter === 'all' || c.type === typeFilter;
    let matchesDate = true;
    if (dateFilter !== 'all') {
      if (dateFilter === 'today') matchesDate = isToday(c.due_date);
    }
    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredChecks.length / ITEMS_PER_PAGE);
  const paginatedChecks = filteredChecks.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

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
        <div className="flex items-center gap-2 flex-1 w-full">
          <button 
            onClick={handleReset}
            className="p-3 bg-[#0a0d18] border border-white/5 rounded-[12px] text-white/40 hover:text-white transition-all group"
            title="Réinitialiser les filtres"
          >
            <RotateCcw size={16} className="group-hover:rotate-[-45deg] transition-transform" />
          </button>
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
            <input 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par numéro, entité, A L'ORDRE DE..."
              className="w-full bg-[#0a0d18] border border-white/5 rounded-[12px] py-3 pl-11 pr-4 text-xs font-medium focus:outline-none focus:border-gold/20 transition-all placeholder:text-white/10 text-white"
            />
          </div>
        </div>

        <div className="flex items-center gap-1 bg-[#0a0d18] p-1 rounded-[12px] border border-white/5 w-full lg:w-auto">
          {[
            { id: 'all', label: 'Tous' },
            { id: CheckType.INCOMING, label: 'Entrant' },
            { id: CheckType.OUTGOING, label: 'Sortant' }
          ].map((u) => (
            <button 
              key={u.id}
              onClick={() => setTypeFilter(u.id as any)} 
              className={`px-4 py-2 rounded-[10px] text-[9px] font-bold uppercase tracking-tight transition-all ${typeFilter === u.id ? 'bg-gold text-black shadow-lg shadow-gold/20' : 'text-white/30 hover:text-white/60'}`}
            >
              {u.label}
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-auto min-w-[150px]">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="w-full bg-[#0a0d18] border border-white/5 rounded-[12px] pl-5 pr-10 py-3 text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-gold/20 appearance-none cursor-pointer text-white/60"
          >
            <option value="all">Statuts: Tous</option>
            <option value={CheckStatus.PENDING}>En attente</option>
            <option value={CheckStatus.PAID}>Payé</option>
            <option value={CheckStatus.RETURNED}>Return</option>
            <option value={CheckStatus.GARANTIE}>Garantie</option>
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
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">A Émetteur</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">A L'ORDRE DE</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold">Montant</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-center">Type</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-center">État</th>
                <th className="px-6 py-4 text-[8px] uppercase tracking-[0.15em] text-white/20 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {paginatedChecks.map((check) => (
                <tr key={check.id} className="hover:bg-white/[0.015] transition-colors group">
                  <td className="px-6 py-4 text-[11px] font-medium text-white/40">
                    {check.check_number}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[11px] font-semibold text-white/60">
                      {check.due_date ? new Date(check.due_date).toLocaleDateString('fr-FR') : '---'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[12px] font-bold text-white/80">{check.entity_name}</span>
                      <span className="text-[9px] text-white/20 uppercase tracking-widest">{check.bank_name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-gold/80">
                      <UserCheck size={14} />
                      <span className="text-[11px] font-bold uppercase tracking-widest">{check.fund_name || '---'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[12px] font-bold text-white">{formatCurrency(check.amount, currency)}</span>
                  </td>
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
              {paginatedChecks.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
                    <p className="text-xs font-bold text-white/20 uppercase tracking-widest italic">Aucun instrument trouvé</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-white/[0.01]">
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">
              Affichage {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredChecks.length)} sur {filteredChecks.length}
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

export default CheckList;
