
import React, { useRef, useEffect } from 'react';
import { Camera, Save, Globe, Building, Bell, Shield, DollarSign } from 'lucide-react';
import { SystemSettings, Currency } from '../types.ts';

interface SettingsProps {
  settings: SystemSettings;
  onSave: (settings: SystemSettings) => void;
}

const Settings: React.FC<SettingsProps> = ({ settings, onSave }) => {
  const [localSettings, setLocalSettings] = React.useState(settings);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLocalSettings({ ...localSettings, logo_url: event.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
          <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">Préférences Système</h2>
          <p className="text-white/40 text-sm">Contrôle de l'infrastructure et sécurité</p>
        </div>
        <button 
          onClick={() => onSave(localSettings)}
          className="bg-gold text-black font-black text-[11px] uppercase tracking-[0.2em] px-10 py-4 rounded-[14px] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 shadow-xl gold-glow"
        >
          <Save size={18} />
          Déployer les Paramètres
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="glass-card p-8 rounded-[20px] border-white/5 space-y-8">
          <div className="flex items-center gap-4 text-gold border-b border-white/5 pb-4">
            <Building size={22} />
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Identité de Marque</h3>
          </div>
          
          <div className="flex flex-col items-center gap-6 p-8 bg-black/40 rounded-[18px] border border-white/5 relative group">
             <div className="relative">
               <div className="w-32 h-32 rounded-[20px] overflow-hidden bg-transparent border-2 border-dashed border-white/10 group-hover:border-gold/30 transition-all flex items-center justify-center shadow-inner">
                  {localSettings.logo_url ? (
                    <img src={localSettings.logo_url} className="w-full h-full object-contain" alt="Logo" />
                  ) : (
                    <div className="text-white/10">
                      <Camera size={32} />
                    </div>
                  )}
               </div>
               <button 
                 onClick={() => fileInputRef.current?.click()}
                 className="absolute -bottom-2 -right-2 w-10 h-10 bg-gold rounded-[12px] flex items-center justify-center text-black shadow-lg hover:scale-110 transition-transform"
               >
                 <Camera size={18} />
               </button>
               <input type="file" ref={fileInputRef} onChange={handleLogoUpload} className="hidden" />
             </div>
             <div className="text-center">
               <p className="text-[12px] font-bold text-white mb-1">Logo d'Entreprise</p>
               <p className="text-[10px] text-white/20 uppercase tracking-widest font-medium">PNG / SVG Transparent</p>
             </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Nom de l'Organisation</label>
              <input 
                value={localSettings.company_name || ''}
                onChange={e => setLocalSettings({...localSettings, company_name: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-[14px] py-4 px-6 text-sm font-semibold focus:border-gold/50 focus:outline-none transition-all text-white"
              />
            </div>
          </div>
        </div>

        <div className="glass-card p-8 rounded-[20px] border-white/5 space-y-8">
           <div className="flex items-center gap-4 text-gold border-b border-white/5 pb-4">
            <Globe size={22} />
            <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">Intelligence Financière</h3>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Devise Locale</label>
              <div className="grid grid-cols-3 gap-3">
                {[Currency.EUR, Currency.MAD, Currency.USD].map(curr => (
                  <button 
                    key={curr}
                    onClick={() => setLocalSettings({...localSettings, currency: curr})}
                    className={`py-4 rounded-[14px] border font-black text-xs transition-all ${localSettings.currency === curr ? 'bg-gold/10 border-gold text-gold' : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10'}`}
                  >
                    {curr}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Seuil de Valeur Critique ({localSettings.currency})</label>
                 <span className="text-xs font-black text-gold">{(localSettings.high_value_threshold ?? 0).toLocaleString()}</span>
               </div>
               <div className="relative group">
                 <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-gold transition-colors" size={16}/>
                 <input 
                   type="number"
                   value={localSettings.high_value_threshold ?? 0}
                   onChange={e => setLocalSettings({...localSettings, high_value_threshold: parseInt(e.target.value) || 0})}
                   className="w-full bg-white/5 border border-white/10 rounded-[14px] py-4 pl-12 pr-6 text-sm font-bold focus:border-gold/50 focus:outline-none transition-all text-white"
                 />
               </div>
               <p className="text-[10px] text-white/20 italic">Déclenche un signal de risque pour tout instrument supérieur à ce montant.</p>
            </div>

            <div className="space-y-2">
               <div className="flex items-center justify-between mb-2">
                 <label className="text-[10px] font-black uppercase text-white/30 tracking-widest ml-1">Anticipation d'Alerte</label>
                 <span className="text-xs font-black text-gold">{(localSettings.alert_days ?? 3)} Jours</span>
               </div>
               <input 
                 type="range"
                 min="1"
                 max="30"
                 value={localSettings.alert_days ?? 3}
                 onChange={e => setLocalSettings({...localSettings, alert_days: parseInt(e.target.value)})}
                 className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-gold"
               />
            </div>
          </div>

          <div className="pt-8 border-t border-white/5">
             <div className="flex items-center gap-4 text-emerald-400 mb-4">
                <Shield size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Protocoles de Sécurité</span>
             </div>
             <p className="text-[11px] text-white/40 leading-relaxed italic font-medium">
               Vos seuils sont chiffrés et stockés dans votre environnement sécurisé.
             </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
