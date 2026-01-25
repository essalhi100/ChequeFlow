
import React, { useState, useRef, useEffect } from 'react';
import { X, Camera, Loader2, Upload, Receipt, Calendar, Building2, User, DollarSign, Fingerprint, ShieldCheck } from 'lucide-react';
import { Check, CheckType, CheckStatus } from '../types.ts';
import { extractCheckData } from '../services/geminiService.ts';

interface CheckModalProps {
  onClose: () => void;
  onSave: (check: Partial<Check>) => void;
  initialData?: Check | null;
}

const InputWrapper = ({ label, icon: Icon, children }: any) => (
  <div className="space-y-1.5 group">
    <label className="text-[10px] uppercase tracking-widest text-white/30 font-black ml-1 group-focus-within:text-gold transition-colors">
      {label}
    </label>
    <div className="relative rounded-[14px] border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-gold/50 focus-within:bg-gold/[0.02] focus-within:ring-1 focus-within:ring-gold/20">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors">
        <Icon size={18} />
      </div>
      {children}
    </div>
  </div>
);

const CheckModal: React.FC<CheckModalProps> = ({ onClose, onSave, initialData }) => {
  const [formData, setFormData] = useState<Partial<Check>>(
    initialData || {
      check_number: '',
      bank_name: '',
      amount: 0,
      issue_date: new Date().toISOString().split('T')[0],
      due_date: new Date().toISOString().split('T')[0],
      entity_name: '',
      type: CheckType.INCOMING,
      status: CheckStatus.PENDING,
      image_url: '',
    }
  );

  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (firstInputRef.current) {
      firstInputRef.current.focus();
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setFormData(prev => ({ ...prev, image_url: base64 }));

      const extracted = await extractCheckData(base64);
      if (extracted) {
        setFormData(prev => ({
          ...prev,
          ...extracted,
          issue_date: extracted.issue_date || prev.issue_date,
          due_date: extracted.due_date || prev.due_date,
        }));
      }
      setIsProcessing(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="glass-card w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[14px] flex flex-col md:flex-row shadow-2xl border-white/10 animate-in zoom-in duration-300">
        
        <div className="w-full md:w-2/5 bg-black/40 border-r border-white/5 flex flex-col">
          <div className="p-8 border-b border-white/5">
            <h3 className="text-xl font-black text-white italic">SCANNER IA</h3>
            <p className="text-white/40 text-xs">Extraction de Données Neuronales</p>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center p-8 relative">
            {isProcessing ? (
              <div className="text-center space-y-4 animate-pulse">
                <Loader2 className="w-16 h-16 text-gold animate-spin mx-auto" />
                <p className="text-gold font-black text-xs uppercase tracking-widest">Analyse des documents...</p>
              </div>
            ) : formData.image_url ? (
              <div className="relative w-full aspect-[16/9] rounded-[14px] overflow-hidden border-2 border-gold/20 shadow-2xl group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <img src={formData.image_url} className="w-full h-full object-cover" alt="Chèque" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Camera className="text-white" size={48} />
                </div>
              </div>
            ) : (
              <button 
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full aspect-[16/9] border-2 border-dashed border-white/10 rounded-[14px] flex flex-col items-center justify-center gap-4 hover:border-gold/30 hover:bg-gold/5 transition-all group"
              >
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Upload className="text-white/20 group-hover:text-gold" />
                </div>
                <span className="text-xs font-black text-white/40 uppercase tracking-widest">Charger l'image du chèque</span>
              </button>
            )}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
          </div>

          <div className="p-8 mt-auto">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-[14px] flex items-center gap-4">
              <div className="p-2 bg-emerald-500/20 rounded-[10px] text-emerald-400">
                <ShieldCheck size={20} />
              </div>
              <div>
                <p className="text-[10px] text-emerald-400 font-black uppercase tracking-tighter">Protocole de Sécurité</p>
                <p className="text-[11px] text-emerald-100/60 font-medium italic leading-none">AES-256 Actif</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-8 md:p-12 overflow-y-auto">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h2 className="text-[22px] font-bold leading-[33px] italic tracking-tight">{initialData ? 'MODIFIER L\'ENREGISTREMENT' : 'NOUVELLE ENTRÉE AU COFFRE'}</h2>
              <div className="h-1 w-12 bg-gold mt-1"></div>
            </div>
            <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); onSave(formData); }} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
               <button 
                 type="button"
                 onClick={() => setFormData({...formData, type: CheckType.INCOMING})}
                 className={`py-4 rounded-[14px] border font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === CheckType.INCOMING ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
               >
                 Actifs (Entrants)
               </button>
               <button 
                 type="button"
                 onClick={() => setFormData({...formData, type: CheckType.OUTGOING})}
                 className={`py-4 rounded-[14px] border font-black text-[10px] uppercase tracking-widest transition-all ${formData.type === CheckType.OUTGOING ? 'bg-rose-500/20 border-rose-500/50 text-rose-400' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
               >
                 Passifs (Sortants)
               </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputWrapper label="Référence du Chèque" icon={Fingerprint}>
                <input 
                  ref={firstInputRef}
                  value={formData.check_number}
                  onChange={e => setFormData({...formData, check_number: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none placeholder:text-white/10"
                  placeholder="00000000"
                />
              </InputWrapper>
              <InputWrapper label="Capital Total" icon={DollarSign}>
                <input 
                  type="number"
                  step="any"
                  value={formData.amount || ''}
                  onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-black focus:outline-none"
                  placeholder="0.00"
                />
              </InputWrapper>
            </div>

            <InputWrapper label="Entité / Contrepartie" icon={User}>
              <input 
                value={formData.entity_name}
                onChange={e => setFormData({...formData, entity_name: e.target.value})}
                className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none"
                placeholder="Nom du client ou fournisseur"
              />
            </InputWrapper>

            <InputWrapper label="Institution Financière" icon={Building2}>
              <input 
                value={formData.bank_name}
                onChange={e => setFormData({...formData, bank_name: e.target.value})}
                className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none"
                placeholder="Nom de la banque (ex: CIH, BMCE)"
              />
            </InputWrapper>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <InputWrapper label="Date d'Émission" icon={Calendar}>
                <input 
                  type="date"
                  value={formData.issue_date}
                  onChange={e => setFormData({...formData, issue_date: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none [color-scheme:dark]"
                />
              </InputWrapper>
              <InputWrapper label="Date d'Échéance" icon={Calendar}>
                <input 
                  type="date"
                  value={formData.due_date}
                  onChange={e => setFormData({...formData, due_date: e.target.value})}
                  className="w-full bg-transparent border-none py-4 pl-12 pr-6 text-white text-sm font-semibold focus:outline-none [color-scheme:dark]"
                />
              </InputWrapper>
            </div>

            <div className="space-y-1.5 group">
              <label className="text-[10px] uppercase tracking-widest text-white/30 font-black ml-1 group-focus-within:text-gold transition-colors">Statut Opérationnel</label>
              <div className="relative rounded-[14px] border border-white/10 bg-white/5 transition-all duration-300 focus-within:border-gold/50 focus-within:bg-gold/[0.02]">
                <select 
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as CheckStatus})}
                  className="w-full bg-transparent border-none py-4 px-6 text-white text-sm font-semibold focus:outline-none appearance-none cursor-pointer"
                >
                  <option value={CheckStatus.PENDING} className="bg-slate-900">En attente d'autorisation</option>
                  <option value={CheckStatus.PAID} className="bg-slate-900">Finalisé / Payé</option>
                  <option value={CheckStatus.RETURNED} className="bg-slate-900">Retourné / Impayé</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/20 group-focus-within:text-gold">
                  <Receipt size={14} />
                </div>
              </div>
            </div>

            <div className="pt-6">
              <button 
                type="submit"
                className="w-full py-5 bg-gold text-black rounded-[14px] font-black text-xs uppercase tracking-[0.2em] gold-glow hover:scale-[1.01] active:scale-95 transition-all shadow-xl"
              >
                Synchroniser avec la Base
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CheckModal;
