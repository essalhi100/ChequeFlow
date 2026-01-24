
import React from 'react';
import { LayoutDashboard, Receipt, BarChart3, Settings, LogOut, ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';
import { AppTab } from '../types.ts';

interface SidebarProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  companyName: string;
  logoUrl: string;
  onLogout: () => void;
  userEmail?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, companyName, logoUrl, onLogout, userEmail }) => {
  const isAdmin = userEmail === 'admin@apollo.com';
  
  const menuItems: { id: AppTab; label: string; icon: any }[] = [
    { id: 'dash', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'checks', label: 'Chèques', icon: Receipt },
    { id: 'performance', label: 'Rapports', icon: BarChart3 },
    { id: 'risks', label: 'Sécurité & Risques', icon: ShieldX },
    { id: 'parameters', label: 'Paramètres', icon: Settings },
  ];

  return (
    <div className="w-72 h-screen flex flex-col glass-card border-r border-white/5 sticky top-0">
      <div className="p-8 flex items-center gap-4 mb-4">
        <div className="w-11 h-11 rounded-[12px] bg-gold flex items-center justify-center gold-glow overflow-hidden shrink-0">
          {logoUrl ? (
            <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <ShieldCheck className="text-black" size={24} />
          )}
        </div>
        <div className="overflow-hidden">
          <h1 className="text-lg font-bold tracking-tight text-white uppercase italic truncate">FINANSSE</h1>
          <p className="text-[9px] text-gold font-bold tracking-[0.15em] uppercase opacity-70 truncate">{companyName || 'Pro Edition'}</p>
        </div>
      </div>

      <div className="px-6 mb-6">
        <div className="p-4 rounded-[12px] bg-white/[0.02] border border-white/5">
          <p className="text-[8px] font-bold text-white/30 uppercase tracking-[0.2em] mb-1.5">Identité Active</p>
          <p className="text-[11px] font-medium text-white/70 truncate mb-2">{userEmail}</p>
          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-gold/10 border border-gold/20 w-fit">
              <ShieldAlert size={9} className="text-gold" />
              <span className="text-[8px] font-bold text-gold uppercase tracking-widest">Admin Système</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] bg-emerald-500/10 border border-emerald-500/20 w-fit">
              <ShieldCheck size={9} className="text-emerald-400" />
              <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Utilisateur</span>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto custom-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-5 py-3.5 rounded-[12px] transition-all duration-300 group ${
                isActive 
                  ? 'bg-gold/10 text-gold border border-gold/10' 
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5'
              }`}
            >
              <Icon size={18} className={isActive ? 'text-gold' : 'group-hover:text-white/60'} />
              <span className="font-semibold text-[13px]">{item.label}</span>
              {isActive && <div className="ml-auto w-1 h-1 rounded-full bg-gold" />}
            </button>
          );
        })}
      </nav>

      <div className="p-8">
        <button 
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-5 py-3.5 rounded-[12px] text-rose-400/80 hover:bg-rose-500/10 transition-all font-semibold text-[13px] border border-transparent hover:border-rose-500/10"
        >
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
