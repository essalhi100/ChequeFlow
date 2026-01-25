
import React, { useMemo } from 'react';
import { 
  ShieldAlert, AlertTriangle, Activity, TrendingDown, 
  Building2, UserX, DollarSign, ChevronRight, AlertCircle,
  ArrowUpRight, BarChart3, Users, TrendingUp, Sparkles, Clock, 
  ArrowRight
} from 'lucide-react';
import { Check, CheckStatus, Currency, RiskLevel, FinancialRisk, CheckType } from '../types.ts';
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
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);
    
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

    // 2. High Risk Clients
    const badClients = new Set(checks.filter(c => c.status === CheckStatus.RETURNED).map(c => c.entity_name));
    
    // 3. Status & Value Checks
    checks.forEach(c => {
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

    // 4. Critical Upcoming Outgoing Checks (3 Days)
    const upcomingOutgoing = checks.filter(c => 
      c.type === CheckType.OUTGOING && 
      c.status === CheckStatus.PENDING && 
      new Date(c.due_date) >= today && 
      new Date(c.due_date) <= threeDaysFromNow
    );

    const highCount = risks.filter(r => r.level === RiskLevel.HIGH).length;
    const medCount = risks.filter(r => r.level === RiskLevel.MEDIUM).length;
    const totalRiskAmount = risks.reduce((s, r) => s + r.amount, 0);
    const riskScore = Math.min(100, (highCount * 30) + (medCount * 10));

    const paidIncoming = checks.filter(c => c.status === CheckStatus.PAID && c.type === CheckType.INCOMING).reduce((s, c) => s + c.amount, 0);
    const totalIncoming = checks.filter(c => c.type === CheckType.INCOMING).reduce((s, c) => s + c.amount, 0);
    const recoveryRate = totalIncoming > 0 ? (paidIncoming / totalIncoming) * 100 : 0;
    const overdueIncomingSum = checks.filter(c => c.type === CheckType.INCOMING && c.status === CheckStatus.PENDING && new Date(c.due_date) < today).reduce((s, c) => s + c.amount, 0);

    const entityMap: Record<string, number> = {};
    checks.filter(c => c.status === CheckStatus.PENDING).forEach(c => entityMap[c.entity_name] = (entityMap[c.entity_name] || 0) + c.amount);
    const topEntity = Object.entries(entityMap).sort((a, b) => b[1] - a[1])[0] || [null, 0];
    
    return { 
      risks, totalRiskAmount, riskScore, highCount, medCount, 
      recoveryRate, overdueIncomingSum, 
      upcomingOutgoing,
      upcomingOutgoingSum: upcomingOutgoing.reduce((s, c) => s + c.amount, 0),
      topExposureEntityName: topEntity[0], 
      topExposurePercentage: totalVolume > 0 ? (topEntity[1] / totalVolume) * 100 : 0 
    };
  }, [checks, highValueThreshold]);

  // Fix: Explicitly typed as React.FC to correctly handle internal React props like 'key' when rendering this component in a list.
  const RiskCard: React.FC<{ risk: FinancialRisk }> = ({ risk }) => {
    const config = {
      [RiskLevel.HIGH]: { border: 'border-rose-500/30', bg: 'bg-rose-500/[0.03]', text: 'text-rose-400', icon: ShieldAlert },
      [RiskLevel.MEDIUM]: { border: 'border-amber-500/30', bg: 'bg-amber-500/[0.03]', text: 'text-amber-400', icon: AlertTriangle },
      [RiskLevel.LOW]: { border: 'border-blue-500/30', bg: 'bg-blue-500/[0.03]', text: 'text-blue-400', icon: AlertCircle },
    };
    const currentStyle = config[risk.level];
    const Icon = currentStyle.icon;

    return (
      <div className={`p-6 rounded-[16px] border ${currentStyle.border} ${currentStyle.bg} flex items-center justify-between group transition-all hover:bg-white/[0.04] animate-in fade-in slide-in-from-left-2 duration-300`}>
        <div className="flex items-center gap-5">
          <div className={`p-3 rounded-[12px] bg-white/[0.03] ${currentStyle.text}`}>
            <Icon size={24} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-white mb-1">{risk.description}</p>
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black text-white/30 uppercase tracking-widest">{formatCurrency(risk.amount, currency)}</span>
              <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded bg-white/5 ${currentStyle.text}`}>{risk.level}</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {risk.relatedId && (
            <button 
              onClick={() => onViewCheck?.(risk.relatedId!)}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-[10px] text-[10px] font-bold text-white uppercase tracking-widest transition-all border border-white/5"
            >
              Détails
            </button>
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
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Analyse des Risques</h2>
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
          <h3 className="text-[22px] font-bold leading-[33px] text-white mb-2">{formatCurrency(riskAnalysis.totalRiskAmount, currency)}</h3>
          <p className="text-[11px] text-rose-500 font-bold flex items-center gap-1">
            <TrendingDown size={14} /> Flux critique
          </p>
        </div>
        <div className="glass-card p-8 rounded-[20px] border-rose-500/10 bg-rose-500/[0.02]">
          <p className="text-[10px] font-black text-rose-500/50 uppercase tracking-[0.2em] mb-4">Niveau Élevé</p>
          <h3 className="text-[22px] font-bold leading-[33px] text-rose-500 mb-2">{riskAnalysis.highCount}</h3>
          <p className="text-[11px] text-white/20 font-medium">Alertes critiques</p>
        </div>
        <div className="glass-card p-8 rounded-[20px] border-amber-500/10 bg-amber-500/[0.02]">
          <p className="text-[10px] font-black text-amber-500/50 uppercase tracking-[0.2em] mb-4">Niveau Moyen</p>
          <h3 className="text-[22px] font-bold leading-[33px] text-amber-500 mb-2">{riskAnalysis.medCount}</h3>
          <p className="text-[11px] text-white/20 font-medium">Points de vigilance</p>
        </div>
        <div className="glass-card p-8 rounded-[20px] border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent">
          <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Ratio de Recouvrement</p>
          <h3 className="text-[22px] font-bold leading-[33px] text-emerald-500 mb-2">{riskAnalysis.recoveryRate.toFixed(1)}%</h3>
          <p className="text-[11px] text-white/20 font-medium">Efficacité des flux entrants</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-md font-bold flex items-center gap-2.5">
              <ShieldAlert className="text-gold" size={18} />
              Signaux de Vulnérabilité Détectés
            </h4>
            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{riskAnalysis.risks.length} Incidents</span>
          </div>

          <div className="space-y-4">
            {riskAnalysis.risks.length > 0 ? (
              riskAnalysis.risks.map(risk => (
                <RiskCard key={risk.id} risk={risk} />
              ))
            ) : (
              <div className="p-12 border-2 border-dashed border-white/5 rounded-[20px] text-center">
                <Sparkles className="mx-auto text-gold/20 mb-4" size={40} />
                <p className="text-[11px] font-black uppercase tracking-widest text-white/20">Aucune anomalie détectée</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="glass-card p-7 rounded-[20px] border-white/5">
             <h4 className="text-sm font-black uppercase tracking-widest text-white/40 mb-6 flex items-center gap-2">
               <Activity size={16} className="text-gold" /> Matrice d'Exposition
             </h4>
             
             <div className="space-y-6">
               <div className="p-4 rounded-[16px] bg-white/[0.02] border border-white/5">
                 <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Exposition Maximale</p>
                 <p className="text-sm font-bold text-white mb-2">{riskAnalysis.topExposureEntityName || 'N/A'}</p>
                 <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mb-1">
                   <div className="h-full bg-gold" style={{ width: `${riskAnalysis.topExposurePercentage}%` }} />
                 </div>
                 <p className="text-[10px] text-gold font-bold">{riskAnalysis.topExposurePercentage.toFixed(1)}% du capital en attente</p>
               </div>

               <div className="p-4 rounded-[16px] bg-white/[0.02] border border-white/5">
                 <p className="text-[9px] font-black text-white/20 uppercase tracking-widest mb-1">Sorties Critiques (3J)</p>
                 <p className="text-lg font-black text-white mb-1">{formatCurrency(riskAnalysis.upcomingOutgoingSum, currency)}</p>
                 <p className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                   <Clock size={12} /> {riskAnalysis.upcomingOutgoing.length} instruments à provisionner
                 </p>
               </div>

               <div className="pt-4 border-t border-white/5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-widest">Santé du Portefeuille</span>
                    <span className="text-[10px] font-black text-emerald-400 uppercase">Optimal</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-[12px] bg-emerald-500/5 border border-emerald-500/10 text-center">
                      <p className="text-[10px] font-black text-emerald-400 mb-1">Recouvrement</p>
                      <p className="text-sm font-black text-white">{riskAnalysis.recoveryRate.toFixed(0)}%</p>
                    </div>
                    <div className="p-3 rounded-[12px] bg-rose-500/5 border border-rose-500/10 text-center">
                      <p className="text-[10px] font-black text-rose-400 mb-1">Risque</p>
                      <p className="text-sm font-black text-white">{riskAnalysis.riskScore}%</p>
                    </div>
                  </div>
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* STRATEGIC INTELLIGENCE REPORT SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        <div className="glass-card p-10 rounded-[14px] bg-gold/5 border-gold/10 lg:col-span-3 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 opacity-[0.03] rotate-12 pointer-events-none">
            <TrendingUp size={200} className="text-white" />
          </div>
          <h4 className="text-sm font-black text-gold uppercase tracking-widest mb-8 italic flex items-center gap-3">
            <div className="w-8 h-[1px] bg-gold/50"></div> Rapport d'Intelligence Stratégique
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
            <div className="p-8 rounded-[14px] bg-black/60 border border-white/5 flex flex-col">
              <h5 className="font-black text-[10px] uppercase tracking-widest text-white/80 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-gold"></div> 
                Diagnostic de Liquidité
              </h5>
              <p className="text-xs text-white/50 leading-relaxed italic">
                Le taux de recouvrement de <strong>{riskAnalysis.recoveryRate.toFixed(1)}%</strong> suggère 
                {riskAnalysis.overdueIncomingSum > 0 
                  ? ` une action immédiate pour les impayés de ${formatCurrency(riskAnalysis.overdueIncomingSum, currency)}.`
                  : " une gestion saine du pipeline d'encaissement sans retard critique détecté."}
              </p>
            </div>

            <div className="p-8 rounded-[14px] bg-black/60 border border-white/5 flex flex-col">
              <h5 className="font-black text-[10px] uppercase tracking-widest text-white/80 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> 
                Avis d'Exposition
              </h5>
              <p className="text-xs text-white/50 leading-relaxed italic">
                {riskAnalysis.topExposureEntityName 
                  ? `Une concentration est notée pour ${riskAnalysis.topExposureEntityName} (${riskAnalysis.topExposurePercentage.toFixed(1)}%). Prévoyez une stratégie de diversification.`
                  : "L'exposition est bien répartie entre vos contreparties. Aucun risque de dépendance systémique à ce jour."}
              </p>
            </div>

            <div className="p-8 rounded-[14px] bg-black/60 border border-white/5 flex flex-col">
              <h5 className="font-black text-[10px] uppercase tracking-widest text-white/80 mb-4 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div> 
                Recommandation Stratégique IA
              </h5>
              <p className="text-xs text-white/50 leading-relaxed italic">
                {riskAnalysis.riskScore > 30 
                  ? "Alerte : Une fragilité de liquidité est détectée. Priorisez la diversification bancaire et le recouvrement des impayés."
                  : "Stabilité confirmée. Profil de risque optimal. Maintenez les processus de vérification et surveillez les seuils critiques."}
              </p>
              <div className="mt-auto pt-4 flex items-center gap-2 text-[9px] font-black text-amber-500/50 uppercase tracking-widest">
                <Sparkles size={12} /> Généré par Core Logic
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiskIntelligence;
