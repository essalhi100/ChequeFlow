
import React, { useMemo } from 'react';
import { 
  ShieldAlert, AlertTriangle, Activity, TrendingDown, 
  Building2, UserX, DollarSign, ChevronRight, AlertCircle,
  ArrowUpRight, BarChart3, Users
} from 'lucide-react';
import { Check, CheckStatus, Currency, RiskLevel, FinancialRisk } from '../types.ts';
import { formatCurrency } from '../constants.tsx';

interface RiskIntelligenceProps {
  checks: Check[];
  currency: Currency;
  highValueThreshold: number;
  onViewCheck?: (id: string) => void;
}

const RiskIntelligence: React.FC<RiskIntelligenceProps> = ({ checks, currency, highValueThreshold, onViewCheck }) => {
  const riskAnalysis = useMemo(() => {
    const risks: FinancialRisk[] = [];
    const today = new Date();
    
    // 1. Bank Concentration Check (>50% of total volume)
    const bankMap: Record<string, number> = {};
    const totalVolume = checks.reduce((s, c) => s + c.amount, 0);
    checks.forEach(c => bankMap[c.bank_name] = (bankMap[c.bank_name] || 0) + c.amount);
    
    Object.entries(bankMap).forEach(([bank, amount]) => {
      if (amount > totalVolume * 0.5 && checks.length > 2) {
        risks.push({
          id: `conc-${bank}`,
          type: 'concentration',
          level: RiskLevel.MEDIUM,
          description: `Concentration élevée sur ${bank} (>50% du capital)`,
          amount: amount
        });
      }
    });

    // 2. High Risk Clients (Those with at least 1 returned check)
    const badClients = new Set(checks.filter(c => c.status === CheckStatus.RETURNED).map(c => c.entity_name));
    
    // 3. Status & Value Checks
    checks.forEach(c => {
      // Returned Checks
      if (c.status === CheckStatus.RETURNED) {
        risks.push({
          id: `ret-${c.id}`,
          type: 'returned',
          level: RiskLevel.HIGH,
          description: `Chèque retourné #${c.check_number} (${c.entity_name})`,
          amount: c.amount,
          relatedId: c.id
        });
      }
      
      // Overdue Checks
      if (c.status === CheckStatus.PENDING && new Date(c.due_date) < today) {
        risks.push({
          id: `over-${c.id}`,
          type: 'overdue',
          level: RiskLevel.HIGH,
          description: `Maturité dépassée pour #${c.check_number}`,
          amount: c.amount,
          relatedId: c.id
        });
      }

      // High Value Threshold
      if (c.amount >= highValueThreshold && c.status === CheckStatus.PENDING) {
        risks.push({
          id: `high-${c.id}`,
          type: 'high_value',
          level: RiskLevel.MEDIUM,
          description: `Instrument haute valeur #${c.check_number}`,
          amount: c.amount,
          relatedId: c.id
        });
      }

      // Client Risk Warning
      if (badClients.has(c.entity_name) && c.status === CheckStatus.PENDING) {
        risks.push({
          id: `cl-${c.id}`,
          type: 'client_risk',
          level: RiskLevel.MEDIUM,
          description: `Client à risque : ${c.entity_name}`,
          amount: c.amount,
          relatedId: c.id
        });
      }
    });

    const highCount = risks.filter(r => r.level === RiskLevel.HIGH).length;
    const medCount = risks.filter(r => r.level === RiskLevel.MEDIUM).length;
    const totalRiskAmount = risks.reduce((s, r) => s + r.amount, 0);
    const riskScore = Math.min(100, (highCount * 30) + (medCount * 10));

    return { risks, totalRiskAmount, riskScore, highCount, medCount };
  }, [checks, highValueThreshold]);

  const RiskCard = ({ risk }: { risk: FinancialRisk }) => {
    const config = {
      [RiskLevel.HIGH]: { border: 'border-rose-500/30', bg: 'bg-rose-500/[0.03]', text: 'text-rose-400', icon: ShieldAlert },
      [RiskLevel.MEDIUM]: { border: 'border-amber-500/30', bg: 'bg-amber-500/[0.03]', text: 'text-amber-400', icon: AlertTriangle },
      [RiskLevel.LOW]: { border: 'border-blue-500/30', bg: 'bg-blue-500/[0.03]', text: 'text-blue-400', icon: AlertCircle },
    };
    const style = config[risk.level];
    const Icon = style.icon;

    return (
      <div className={`p-6 rounded-[16px] border ${style.border} ${style.bg} flex items-center justify-between group transition-all hover:bg-white/[0.04] animate-in fade-in slide-in-from-left-2 duration-300`}>
        <div className="flex items-center gap-5">
          <div className={`p-3 rounded-[12px] bg-white/[0.03] ${style.text}`}>
            <Icon size={24} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white mb-1">{risk.description}</p>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-white/30 uppercase tracking-widest">{formatCurrency(risk.amount, currency)}</span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 ${style.text}`}>{risk.level}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {risk.relatedId ? (
            <button 
              onClick={() => onViewCheck?.(risk.relatedId!)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-bold text-white uppercase tracking-widest transition-all border border-white/5"
            >
              Détails
            </button>
          ) : (
             <span className="text-[9px] font-black text-white/10 uppercase italic">Agrégat</span>
          )}
          <ChevronRight size={18} className="text-white/10" />
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">ANALYSE DES RISQUES</h2>
          <p className="text-white/40 text-sm mt-1">Intelligence artificielle de détection des vulnérabilités financières</p>
        </div>
        
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-2">SCORE DE RISQUE GLOBAL</p>
            <div className="flex items-center gap-5">
              <span className={`text-4xl font-black italic ${riskAnalysis.riskScore > 50 ? 'text-rose-500' : riskAnalysis.riskScore > 20 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {riskAnalysis.riskScore}%
              </span>
              <div className="w-32 h-2.5 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${riskAnalysis.riskScore > 50 ? 'bg-rose-500' : riskAnalysis.riskScore > 20 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${riskAnalysis.riskScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-card p-8 rounded-[20px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Capital à Risque</p>
          <h3 className="text-2xl font-black text-white mb-2">{formatCurrency(riskAnalysis.totalRiskAmount, currency)}</h3>
          <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
            <TrendingDown size={14} /> Flux critique
          </p>
        </div>
        <div className="glass-card p-8 rounded-[20px] border-rose-500/10 bg-rose-500/[0.02]">
          <p className="text-[10px] font-black text-rose-500/50 uppercase tracking-[0.2em] mb-4">Niveau Élevé</p>
          <h3 className="text-3xl font-black text-rose-500 mb-2">{riskAnalysis.highCount}</h3>
          <p className="text-[11px] text-white/20 font-medium">Alertes critiques</p>
        </div>
        <div className="glass-card p-8 rounded-[20px] border-amber-500/10 bg-amber-500/[0.02]">
          <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-4">Niveau Modéré</p>
          <h3 className="text-3xl font-black text-amber-500 mb-2">{riskAnalysis.medCount}</h3>
          <p className="text-[11px] text-white/20 font-medium">Attention requise</p>
        </div>
        <div className="glass-card p-8 rounded-[20px] border-white/5">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Seuil d'Alerte</p>
          <h3 className="text-2xl font-black text-gold mb-2">{formatCurrency(highValueThreshold, currency)}</h3>
          <p className="text-[11px] text-white/20 font-medium italic">Paramètre système</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white/60">Journal des Anomalies</h4>
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-gold" />
              <span className="text-[9px] font-bold text-white/30 uppercase">Scan temps réel actif</span>
            </div>
          </div>

          <div className="space-y-3">
            {riskAnalysis.risks.length > 0 ? (
              riskAnalysis.risks.map(risk => <RiskCard key={risk.id} risk={risk} />)
            ) : (
              <div className="py-24 flex flex-col items-center justify-center glass-card rounded-[20px] border-dashed border-white/5">
                <div className="p-5 bg-emerald-500/10 rounded-full text-emerald-400 mb-5">
                   <ShieldAlert size={32} />
                </div>
                <p className="text-sm font-bold text-white/40">Aucun risque critique détecté</p>
                <p className="text-[10px] uppercase tracking-widest text-white/20 mt-2">Le système est stable</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-8 rounded-[20px] border-white/5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-8">Classification Stratégique</h4>
            <div className="space-y-6">
              {[
                { label: 'Chèques Retournés', count: riskAnalysis.risks.filter(r => r.type === 'returned').length, color: 'bg-rose-500' },
                { label: 'Maturité Dépassée', count: riskAnalysis.risks.filter(r => r.type === 'overdue').length, color: 'bg-rose-400' },
                { label: 'Flux Haute Valeur', count: riskAnalysis.risks.filter(r => r.type === 'high_value').length, color: 'bg-amber-400' },
                { label: 'Concentration Bancaire', count: riskAnalysis.risks.filter(r => r.type === 'concentration').length, color: 'bg-blue-400' }
              ].map((item, i) => (
                <div key={i}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[11px] font-bold text-white/50">{item.label}</span>
                    <span className="text-[11px] font-black text-white">{item.count}</span>
                  </div>
                  <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all duration-700`}
                      style={{ width: `${(item.count / (riskAnalysis.risks.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8 rounded-[20px] bg-gold/5 border border-gold/10">
             <div className="flex items-center gap-3 text-gold mb-4">
                <ArrowUpRight size={18} />
                <h5 className="text-[10px] font-black uppercase tracking-[0.2em]">Recommandation IA</h5>
             </div>
             <p className="text-xs text-white/60 leading-relaxed font-medium italic">
                {riskAnalysis.riskScore > 30 
                  ? "Alerte : Une fragilité de liquidité est détectée. Priorisez la diversification des banques et lanceز des actions de recouvrement pour les impayés."
                  : "Stabilité confirmée. Votre profil de risque est optimal. Maintenez vos processus actuels de vérification des émetteurs."}
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskIntelligence;
