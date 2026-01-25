
import React, { useMemo } from 'react';
import { ShieldAlert, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import { Check, CheckStatus, Currency } from '../types.ts';
import { formatCurrency } from '../constants.tsx';

interface MobileRisksProps {
  checks: Check[];
  currency: Currency;
  threshold: number;
}

const MobileRisks: React.FC<MobileRisksProps> = ({ checks, currency, threshold }) => {
  const risks = useMemo(() => {
    const r = [];
    const today = new Date();
    checks.forEach(c => {
      if (c.status === CheckStatus.RETURNED) r.push({ type: 'returned', msg: `Return: ${c.check_number}`, level: 'high' });
      if (c.status === CheckStatus.PENDING && new Date(c.due_date) < today) r.push({ type: 'overdue', msg: `En retard: ${c.check_number}`, level: 'high' });
      if (c.amount >= threshold && c.status === CheckStatus.PENDING) r.push({ type: 'high_value', msg: `Haut montant: ${c.entity_name}`, level: 'medium' });
    });
    return r;
  }, [checks, threshold]);

  return (
    <div className="animate-in fade-in duration-500">
       <div className="mb-8">
        <h2 className="text-2xl font-black italic uppercase">Sécurité</h2>
        <p className="text-[10px] text-white/30 font-medium tracking-widest uppercase">Analyse des vulnérabilités</p>
      </div>

      <div className="space-y-4">
        {risks.length > 0 ? risks.map((risk, i) => (
          <div key={i} className={`p-5 rounded-[22px] border flex items-center gap-4 ${risk.level === 'high' ? 'bg-rose-500/5 border-rose-500/20 text-rose-500' : 'bg-amber-500/5 border-amber-500/20 text-amber-500'}`}>
            <div className={`p-2.5 rounded-xl bg-current bg-opacity-10`}>
              {risk.level === 'high' ? <ShieldAlert size={20} /> : <AlertTriangle size={20} />}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{risk.msg}</p>
              <p className="text-[9px] font-black uppercase tracking-widest opacity-40">{risk.level === 'high' ? 'Risque Critique' : 'Vigilance Requise'}</p>
            </div>
          </div>
        )) : (
          <div className="py-20 text-center opacity-20">
            <ShieldCheck size={48} className="mx-auto mb-4" />
            <p className="text-[10px] font-black uppercase tracking-widest">Aucune menace détectée</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileRisks;
