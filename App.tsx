
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import CheckList from './components/CheckList.tsx';
import Reports from './components/Reports.tsx';
import RiskIntelligence from './components/RiskIntelligence.tsx';
import Settings from './components/Settings.tsx';
import CheckModal from './components/CheckModal.tsx';
import Auth from './components/Auth.tsx';
import MobileLayout from './mobile/MobileLayout.tsx';
import { AppTab, Check, SystemSettings, Currency, CheckStatus, AppNotification, CheckType } from './types.ts';
import { supabase, isConfigured } from './supabase.ts';
import { ShieldAlert, Loader2, Bell, CheckCheck, Info } from 'lucide-react';

const DEFAULT_SETTINGS: SystemSettings = {
  company_name: 'Luxury Assets Ltd',
  currency: Currency.MAD,
  logo_url: '',
  alert_days: 3,
  high_value_threshold: 50000
};

const ADMIN_EMAIL = 'admin@apollo.com';
const STORAGE_KEY = 'finansse_internal_db_v2'; 

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dash');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [checks, setChecks] = useState<Check[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setChecks(parsed);
      } catch (e) {
        setChecks([]);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
  }, [checks]);

  const addNotification = useCallback((title: string, message: string, type: 'danger' | 'warning' | 'info', linkId?: string) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newNotif: AppNotification = {
      id, title, message, type, status: 'new', createdAt: new Date().toISOString(), linkId
    };
    setNotifications(prev => {
      if (linkId && prev.some(n => n.linkId === linkId && n.title === title)) return prev;
      return [newNotif, ...prev];
    });
  }, []);

  useEffect(() => {
    const today = new Date();
    checks.forEach(c => {
      if (c.status === CheckStatus.RETURNED) {
        addNotification('Alerte : Chèque Return', `L'instrument #${c.check_number} a été marqué comme Return.`, 'danger', c.id);
      }
      if (c.status === CheckStatus.PENDING && new Date(c.due_date) < today) {
        addNotification('Risque : Échéance Dépassée', `L'instrument #${c.check_number} est arrivé à maturité.`, 'warning', c.id);
      }
    });
  }, [checks, addNotification]);

  useEffect(() => {
    if (!isConfigured) return;
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  const syncWithServer = useCallback(async () => {
    if (!session || !isConfigured) return;
    const { data: checksData, error } = await supabase
      .from('checks')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && checksData) {
      setChecks(checksData);
    }
    
    const { data: settingsData } = await supabase.from('system_settings').select('*').maybeSingle();
    if (settingsData) setSettings(prev => ({ ...prev, ...settingsData }));
  }, [session]);

  useEffect(() => {
    if (session) syncWithServer();
  }, [session, syncWithServer]);

  const handleSaveSettings = async (newSettings: SystemSettings) => {
    setSettings(newSettings);
    if (isConfigured && session) {
      await supabase.from('system_settings').upsert({ ...newSettings, user_id: session.user.id });
    }
  };

  const handleSaveCheck = async (checkData: Partial<Check>) => {
    if (!session) return;
    const tempId = editingCheck ? editingCheck.id : Math.random().toString(36).substr(2, 9);
    const optimisticCheck: Check = {
      id: tempId,
      created_at: editingCheck ? editingCheck.created_at : new Date().toISOString(),
      ...checkData,
    } as Check;

    if (editingCheck) {
      setChecks(prev => prev.map(c => c.id === editingCheck.id ? optimisticCheck : c));
    } else {
      setChecks(prev => [optimisticCheck, ...prev]);
    }

    setIsModalOpen(false);
    setEditingCheck(null);

    if (isConfigured) {
      if (editingCheck) {
        await supabase.from('checks').update(checkData).eq('id', editingCheck.id);
      } else {
        await supabase.from('checks').insert({ ...checkData, user_id: session.user.id });
      }
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status: CheckStatus.PAID } : c));
    if (isConfigured) await supabase.from('checks').update({ status: CheckStatus.PAID }).eq('id', id);
  };

  const handleDeleteCheck = async (id: string) => {
    if (window.confirm('Supprimer cet instrument ?')) {
      setChecks(prev => prev.filter(c => c.id !== id));
      if (isConfigured) await supabase.from('checks').delete().eq('id', id);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
       <Loader2 className="w-10 h-10 text-gold animate-spin" />
    </div>
  );

  if (!session) return <Auth />;
  const isAdmin = session.user.email === ADMIN_EMAIL;

  // Render Mobile Layout if on mobile
  if (isMobile) {
    return (
      <MobileLayout 
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        checks={checks}
        settings={settings}
        onSaveCheck={handleSaveCheck}
        onDeleteCheck={handleDeleteCheck}
        onMarkAsPaid={handleMarkAsPaid}
        onLogout={() => supabase.auth.signOut()}
        isAdmin={isAdmin}
      />
    );
  }

  return (
    <div className="flex bg-[#05070a] min-h-screen text-white overflow-hidden">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        companyName={settings.company_name} 
        logoUrl={settings.logo_url} 
        onLogout={() => supabase.auth.signOut()} 
        userEmail={session.user.email}
        isCollapsed={isSidebarCollapsed}
        setIsCollapsed={setIsSidebarCollapsed}
      />
      
      <main className="flex-1 overflow-y-auto h-screen relative custom-scrollbar">
        <div className="sticky top-0 z-40 p-8 flex items-center justify-end pointer-events-none">
          <div className="relative pointer-events-auto">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="p-3 rounded-full glass-card border-white/5 text-white/40 relative"
            >
              <Bell size={20} />
              {notifications.filter(n => n.status === 'new').length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-[#05070a]">
                  {notifications.filter(n => n.status === 'new').length}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-4 w-96 glass-card rounded-[20px] border-white/10 shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 duration-300">
                <div className="p-5 border-b border-white/5 flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Flux d'Alertes</h4>
                  <button onClick={() => setNotifications([])} className="text-[9px] font-bold text-rose-400">Nettoyer</button>
                </div>
                <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className="p-4 rounded-[12px] hover:bg-white/[0.02] mb-1">
                        <p className="text-[12px] font-bold text-white">{n.title}</p>
                        <p className="text-[10px] text-white/40">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center opacity-20">
                      <CheckCheck size={40} className="mx-auto mb-3" />
                      <p className="text-[10px] uppercase tracking-widest italic">Aucun incident critique</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-8 pb-12 max-w-7xl mx-auto">
          {activeTab === 'dash' && <Dashboard checks={checks} currency={settings.currency} onTabChange={setActiveTab} isAdmin={isAdmin} />}
          {activeTab === 'checks' && (
            <CheckList 
              checks={checks} 
              currency={settings.currency} 
              onAdd={() => { setEditingCheck(null); setIsModalOpen(true); }} 
              onEdit={(c) => { setEditingCheck(c); setIsModalOpen(true); }}
              onDelete={handleDeleteCheck}
              onMarkAsPaid={handleMarkAsPaid}
              isAdmin={isAdmin}
            />
          )}
          {activeTab === 'performance' && <Reports checks={checks} currency={settings.currency} />}
          {activeTab === 'risks' && (
            <RiskIntelligence 
              checks={checks} 
              currency={settings.currency} 
              highValueThreshold={settings.high_value_threshold} 
              onViewCheck={(id) => {
                const c = checks.find(ch => ch.id === id);
                if (c) { setEditingCheck(c); setIsModalOpen(true); }
              }}
            />
          )}
          {activeTab === 'parameters' && <Settings settings={settings} onSave={handleSaveSettings} />}
        </div>
      </main>

      {isModalOpen && (
        <CheckModal 
          onClose={() => { setIsModalOpen(false); setEditingCheck(null); }} 
          onSave={handleSaveCheck}
          initialData={editingCheck}
        />
      )}
    </div>
  );
};

export default App;
