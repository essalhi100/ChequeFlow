
import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShieldAlert, 
  Plus
} from 'lucide-react';
import { AppTab, Check, SystemSettings } from '../types.ts';
import MobileDashboard from './MobileDashboard.tsx';
import MobileRisks from './MobileRisks.tsx';
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

  const handleViewDetails = (id: string) => {
    const check = checks.find(c => c.id === id);
    if (check) {
      setEditingCheck(check);
      setIsAddOpen(true);
    }
  };

  const handleSaveAndRedirect = (data: Partial<Check>) => {
    onSaveCheck(data);
    setIsAddOpen(false);
    setActiveTab('dash'); // Force return to Dashboard (Home) after saving
  };

  // Simplified content rendering for mobile
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
      case 'risks': return (
        <MobileRisks 
          checks={checks} 
          currency={settings.currency} 
          threshold={settings.high_value_threshold} 
          onViewCheck={handleViewDetails}
        />
      );
      default: return (
        <MobileDashboard 
          checks={checks} 
          currency={settings.currency} 
          onEdit={(c) => { setEditingCheck(c); setIsAddOpen(true); }}
          onMarkAsPaid={onMarkAsPaid}
        />
      );
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#05070a] text-white">
      {/* Header - Cleaned up */}
      <header className="p-6 pt-10 flex items-center justify-between sticky top-0 bg-[#05070a]/80 backdrop-blur-lg z-30">
        <div>
          <h1 className="text-xl font-black italic tracking-tighter uppercase">FINANSSE</h1>
          <p className="text-[8px] text-gold font-black tracking-widest uppercase">{settings.company_name}</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="px-3 py-1 rounded-full border border-white/5 bg-white/5">
              <span className="text-[8px] font-black text-gold uppercase tracking-widest">Live PRO</span>
           </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 px-5 pb-32 pt-4 overflow-y-auto">
        {renderContent()}
      </main>

      {/* Bottom Navigation with Integrated Plus Button */}
      <nav className="fixed bottom-0 left-0 right-0 p-6 z-40 pointer-events-none">
        <div className="max-w-md mx-auto glass-card rounded-[30px] border-white/5 flex items-center justify-around py-3 px-4 pointer-events-auto shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dash')}
            className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'dash' ? 'text-gold' : 'text-white/20'}`}
          >
            <LayoutDashboard size={22} className={activeTab === 'dash' ? 'scale-110' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Accueil</span>
          </button>

          {/* Central Plus Action Button */}
          <button 
            onClick={() => { setEditingCheck(null); setIsAddOpen(true); }}
            className="w-14 h-14 bg-gold rounded-[20px] flex items-center justify-center text-black shadow-[0_10px_20px_rgba(212,175,55,0.3)] active:scale-90 transition-all -translate-y-4 border-4 border-[#05070a]"
          >
            <Plus size={28} />
          </button>

          {/* Risks Tab */}
          <button
            onClick={() => setActiveTab('risks')}
            className={`flex flex-col items-center justify-center transition-all duration-300 ${activeTab === 'risks' ? 'text-gold' : 'text-white/20'}`}
          >
            <ShieldAlert size={22} className={activeTab === 'risks' ? 'scale-110' : ''} />
            <span className="text-[8px] font-black uppercase tracking-widest mt-1">Risques</span>
          </button>

        </div>
      </nav>

      {isAddOpen && (
        <CheckModal 
          onClose={() => setIsAddOpen(false)}
          onSave={handleSaveAndRedirect}
          initialData={editingCheck}
        />
      )}
    </div>
  );
};

export default MobileLayout;
