
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Sidebar.tsx';
import Dashboard from './components/Dashboard.tsx';
import CheckList from './components/CheckList.tsx';
import Reports from './components/Reports.tsx';
import RiskIntelligence from './components/RiskIntelligence.tsx';
import Settings from './components/Settings.tsx';
import CheckModal from './components/CheckModal.tsx';
import Auth from './components/Auth.tsx';
import { AppTab, Check, SystemSettings, Currency, CheckStatus, AppNotification } from './types.ts';
import { supabase, isConfigured } from './supabase.ts';
import { ShieldAlert, Loader2, Bell, X, CheckCheck } from 'lucide-react';

const DEFAULT_SETTINGS: SystemSettings = {
  company_name: 'Luxury Assets Ltd',
  currency: Currency.MAD,
  logo_url: '',
  alert_days: 3,
  high_value_threshold: 50000
};

const ADMIN_EMAIL = 'admin@apollo.com';
const STORAGE_KEY = 'finansse_internal_db';

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dash');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [checks, setChecks] = useState<Check[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCheck, setEditingCheck] = useState<Check | null>(null);
  const [loading, setLoading] = useState(true);

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(checks));
    
    const today = new Date();
    checks.forEach(c => {
      if (c.status === CheckStatus.RETURNED) {
        addNotification('Alerte : Chèque Retourné', `L'instrument #${c.check_number} a été rejeté.`, 'danger', c.id);
      }
      if (c.status === CheckStatus.PENDING && new Date(c.due_date) < today) {
        addNotification('Risque : Échéance Dépassée', `L'instrument #${c.check_number} est arrivé à maturité.`, 'warning', c.id);
      }
      if (c.amount >= (settings.high_value_threshold || 50000) && c.status === CheckStatus.PENDING) {
        addNotification('Signal : Haute Valeur', `Opération critique de ${c.amount} détectée.`, 'info', c.id);
      }
    });
  }, [checks, addNotification, settings.high_value_threshold]);

  useEffect(() => {
    if (!isConfigured) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
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
    if (!error && checksData) setChecks(checksData);
    
    const { data: settingsData } = await supabase.from('system_settings').select('*').maybeSingle();
    if (settingsData) {
      setSettings(prev => ({ ...prev, ...settingsData }));
    }
  }, [session]);

  useEffect(() => {
    if (session) syncWithServer();
  }, [session, syncWithServer]);

  const handleSaveSettings = async (newSettings: SystemSettings) => {
    setSettings(newSettings);
    if (isConfigured && session) {
      const { error } = await supabase.from('system_settings').upsert({
        ...newSettings,
        user_id: session.user.id
      });
      if (!error) {
        addNotification('Système', 'Paramètres de sécurité synchronisés.', 'info');
      }
    }
  };

  const handleSaveCheck = async (checkData: Partial<Check>) => {
    if (!session) return;
    const tempId = editingCheck ? editingCheck.id : Math.random().toString(36).substr(2, 9);
    const optimisticCheck: Check = {
      id: tempId,
      created_at: new Date().toISOString(),
      ...(editingCheck || {}),
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
        await supabase.from('checks').update({ ...checkData }).eq('id', editingCheck.id);
      } else {
        const { data } = await supabase.from('checks').insert({ ...checkData, user_id: session.user.id }).select().single();
        if (data) setChecks(prev => prev.map(c => c.id === tempId ? data : c));
      }
    }
  };

  const handleViewCheckById = (id: string) => {
    const check = checks.find(c => c.id === id);
    if (check) {
      setEditingCheck(check);
      setIsModalOpen(true);
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    setChecks(prev => prev.map(c => c.id === id ? { ...c, status: CheckStatus.PAID } : c));
    if (isConfigured) {
      await supabase.from('checks').update({ status: CheckStatus.PAID }).eq('id', id);
    }
  };

  const handleDeleteCheck = async (id: string) => {
    if (window.confirm('Confirmez-vous la suppression de cet enregistrement ?')) {
      setChecks(prev => prev.filter(c => c.id !== id));
      if (isConfigured) {
        await supabase.from('checks').delete().eq('id', id);
      }
    }
  };

  const unreadCount = notifications.filter(n => n.status === 'new').length;

  if (loading) return (
    <div className="min-h-screen bg-[#05070a] flex items-center justify-center">
       <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-gold animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Synchronisation du Coffre...</p>
       </div>
    </div>
  );

  if (!session) return <Auth />;
  const isAdmin = session.user.email === ADMIN_EMAIL;

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
      
      <main className="flex-1 overflow-y-auto h-screen relative">
        <div className="sticky top-0 z-40 p-8 flex items-center justify-end pointer-events-none">
          <div className="relative pointer-events-auto">
            <button 
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className={`p-3 rounded-full glass-card border-white/5 transition-all relative ${unreadCount > 0 ? 'text-gold' : 'text-white/40'}`}
            >
              <Bell size={20} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 rounded-full text-[10px] font-black flex items-center justify-center text-white border-2 border-[#05070a] animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-4 w-96 glass-card rounded-[20px] border-white/10 shadow-2xl p-6 animate-in slide-in-from-top-2 duration-300">
                <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
                  <h5 className="text-[11px] font-black uppercase tracking-widest text-white/40">Signaux de Sécurité</h5>
                  <button onClick={() => setNotifications(notifications.map(n => ({...n, status: 'read'})))} className="text-[10px] font-bold text-gold uppercase tracking-tight flex items-center gap-1.5 hover:opacity-80">
                     <CheckCheck size={12} /> Tout lire
                  </button>
                </div>
                
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className={`p-4 rounded-[16px] border transition-all ${n.status === 'new' ? 'bg-white/[0.03] border-white/10' : 'bg-transparent border-white/5 opacity-50'}`}>
                         <div className="flex items-start gap-4">
                            <div className={`p-2 rounded-full mt-0.5 ${n.type === 'danger' ? 'bg-rose-500/20 text-rose-500' : n.type === 'warning' ? 'bg-amber-500/20 text-amber-500' : 'bg-blue-500/20 text-blue-500'}`}>
                               <ShieldAlert size={14} />
                            </div>
                            <div className="flex-1">
                               <p className="text-[12px] font-bold text-white mb-0.5">{n.title}</p>
                               <p className="text-[10px] font-medium text-white/40 leading-relaxed">{n.message}</p>
                            </div>
                            <button onClick={() => setNotifications(prev => prev.filter(x => x.id !== n.id))} className="p-1 text-white/10 hover:text-white">
                               <X size={14} />
                            </button>
                         </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center">
                       <p className="text-[10px] font-black text-white/10 uppercase tracking-widest">Aucun signal détecté</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-8 md:px-12 pb-24 -mt-10">
          {activeTab === 'dash' && <Dashboard checks={checks} currency={settings.currency} onTabChange={setActiveTab as any} isAdmin={isAdmin} />}
          {activeTab === 'checks' && (
            <CheckList 
              checks={checks} 
              currency={settings.currency} 
              onAdd={() => setIsModalOpen(true)} 
              onEdit={(check) => {
                setEditingCheck(check);
                setIsModalOpen(true);
              }} 
              onDelete={handleDeleteCheck} 
              onMarkAsPaid={handleMarkAsPaid} 
              isAdmin={isAdmin} 
            />
          )}
          {activeTab === 'performance' && <Reports checks={checks} currency={settings.currency} />}
          {activeTab === 'risks' && <RiskIntelligence checks={checks} currency={settings.currency} highValueThreshold={settings.high_value_threshold || 50000} onViewCheck={handleViewCheckById} />}
          {activeTab === 'parameters' && (
            <div className="animate-in fade-in duration-700 min-h-[600px]">
              <Settings settings={settings} onSave={handleSaveSettings} />
            </div>
          )}
        </div>
      </main>
      {isModalOpen && <CheckModal onClose={() => { setIsModalOpen(false); setEditingCheck(null); }} onSave={handleSaveCheck} initialData={editingCheck} />}
    </div>
  );
};

export default App;
