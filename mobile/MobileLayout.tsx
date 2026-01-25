
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  ShieldAlert, 
  Settings as SettingsIcon,
  Plus
} from 'lucide-react';
import { AppTab, Check, SystemSettings } from '../types.ts';
import MobileDashboard from './MobileDashboard.tsx';
import MobileCheckList from './MobileCheckList.tsx';
import MobileRisks from './MobileRisks.tsx';
import MobileSettings from './MobileSettings.tsx';
import CheckModal from '../components/CheckModal.tsx';

interface MobileLayoutProps {
  activeTab: AppTab;
  setActiveTab: (tab: AppTab) => void;
  checks: Check[];
  settings: SystemSettings;
  onSaveCheck: (data: Partial<Check>) => void;
  onDeleteCheck: (id: string) => void;
  onMarkAsPaid: (id: string) => void;
  onLogout: () => void;
  isAdmin: boolean;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ 
  activeTab, setActiveTab, checks, settings, onSaveCheck, onDeleteCheck, onMarkAsPaid, onLogout, isAdmin 
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);

  const renderContent = () => {
    switch (activeTab) {
      case 'dash': return (
        <MobileDashboard 
          checks={checks} 
          currency={settings.currency} 
          onEdit={(c) => { setEditingCheck(c); setIsAddOpen(true); }}
          onMarkAsPaid={onMarkAsPaid}
        />
      );
      case 'checks': return (
        <MobileCheckList 
          checks={checks} 
          currency={settings.currency} 
          onEdit={(c) => { setEditingCheck(c); setIsAddOpen(true); }}
          onDelete={onDeleteCheck}
          onMarkAsPaid={onMarkAsPaid}
        />
      );
      case 'risks': return <MobileRisks checks={checks} currency={settings.currency} threshold={settings.high_value_threshold} />;
      case 'parameters': return <MobileSettings settings={settings} onLogout={onLogout} isAdmin={isAdmin} />;
      default: return <MobileDashboard checks={checks} currency={settings.currency} />;
    }
  };

  const navItems = [
    { id: 'dash', icon: LayoutDashboard, label: 'Dash' },
    { id: 'checks', icon: Receipt, label: 'Chèques' },
    { id: 'risks', icon: ShieldAlert, label: 'Risques' },
    { id: 'parameters', icon: SettingsIcon, label: 'Config' },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-[#05070a] text-white">
      {/* Header */}
      <header className="p-6 pt-10 flex items-center justify-between sticky top-0 bg-[#05070a]/80 backdrop-blur-lg z-30">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">FINANSSE</h1>
          <p className="text-[8px] text-gold font-black tracking-widest uppercase">{settings.company_name}</p>
        </div>
        <button 
          onClick={() => { setEditingCheck(null); setIsAddOpen(true); }}
          className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-black shadow-lg"
        >
          <Plus size={20} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-28 pt-4 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 p-4 z-40 pointer-events-none">
        <div className="max-w-md mx-auto glass-card rounded-[24px] border-white/5 flex items-center justify-between px-2 py-2 pointer-events-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as AppTab)}
                className={`flex flex-col items-center justify-center w-1/4 py-2 transition-all duration-300 ${isActive ? 'text-gold' : 'text-white/20'}`}
              >
                <Icon size={20} className={isActive ? 'scale-110' : ''} />
                <span className="text-[8px] font-black uppercase tracking-widest mt-1">{item.label}</span>
                {isActive && <div className="w-1 h-1 bg-gold rounded-full mt-1 animate-pulse" />}
              </button>
            );
          })}
        </div>
      </nav>

      {isAddOpen && (
        <CheckModal 
          onClose={() => setIsAddOpen(false)}
          onSave={onSaveCheck}
          initialData={editingCheck}
        />
      )}
    </div>
  );
};

export default MobileLayout;
