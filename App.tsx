import { cloudProfile, isDemo, loginCloud, logout } from './services/session';
import { emptyData, type UserData } from './lib/data';
import { normalizeExpense, validateExpense, validateMaintenance } from './lib/validation';
import React, { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import { Expense, Driver, View, User, Role, Truck, MaintenanceRecord } from './types';
import Sidebar from './components/Sidebar';
const ExecutiveDashboard = lazy(() => import('./components/ExecutiveDashboard').then(module => ({ default: module.ExecutiveDashboard })));
const ExpensesList = lazy(() => import('./components/ExpensesList').then(module => ({ default: module.ExpensesList })));
import Login from './components/Login';
const UserManagement = lazy(() => import('./components/UserManagement'));
const DriverManagement = lazy(() => import('./components/DriverManagement'));
const AdvancedReports = lazy(() => import('./components/AdvancedReports'));
const TrackingMap = lazy(() => import('./components/TrackingMap'));
const Maintenance = lazy(() => import('./components/Maintenance').then(module => ({ default: module.Maintenance })));
const DRE = lazy(() => import('./components/DRE').then(module => ({ default: module.DRE })));
import { APIProvider } from '@vis.gl/react-google-maps';
import { SaveIcon } from './components/icons/SaveIcon';
import { fetchUserData, saveUserData } from './services/firebaseService';

const VIEW_ROLES: Record<View, Role[]> = {
 dashboard: ['admin', 'user', 'finance', 'viewer'], dre: ['admin', 'finance'],
 'motorista-interno': ['admin', 'user', 'finance', 'viewer'], 'motorista-externo': ['admin', 'user', 'finance', 'viewer'],
 'driver-management': ['admin', 'user', 'finance', 'viewer'], 'advanced-reports': ['admin', 'user', 'finance', 'viewer'],
 tracking: ['admin', 'finance', 'viewer'], maintenance: ['admin', 'user', 'mechanic', 'finance'], fleet: ['admin', 'user', 'finance', 'viewer', 'mechanic'], 'user-management': ['admin']
};

import { ErrorBoundary } from './ErrorBoundary';

const API_KEY = process.env.GOOGLE_MAPS_PLATFORM_KEY || '';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loginError, setLoginError] = useState<string>('');
  const [view, setView] = useState<View>(() => {
    try {
      const saved = localStorage.getItem('gia_erp_current_view');
      return (saved as View) || 'dashboard';
    } catch {
      return 'dashboard';
    }
  });
  
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [trackingData, setTrackingData] = useState<UserData['trackingData']>([]);
  const [revision, setRevision] = useState(0);
  const [savedSnapshot, setSavedSnapshot] = useState('');
  const [dataReady, setDataReady] = useState(false);
  const [dataError, setDataError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const applyData = (data: UserData, role?: Role) => {
    setExpenses(data.expenses);
    setDrivers(data.drivers);
    setUsers(data.users);
    setTrucks(data.trucks);
    setMaintenance(data.maintenance);
    setTrackingData(data.trackingData);
    setRevision(data.revision); setSavedSnapshot(JSON.stringify([data.expenses, data.drivers, data.users, data.trucks, data.maintenance, data.trackingData]));
    setDataReady(true); setDataError('');
  };
  const snapshot = JSON.stringify([expenses, drivers, users, trucks, maintenance, trackingData]);
  const hasUnsavedChanges = dataReady && snapshot !== savedSnapshot;
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (hasUnsavedChanges) { event.preventDefault(); event.returnValue = ''; } };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasUnsavedChanges]);
  useEffect(() => {
    let active = true;
    const restore = async () => {
      try {
        if (isDemo) {
          const id = sessionStorage.getItem('frota_demo_session');
          if (!id) return;
          const data = await fetchUserData();
          const user = data.users.find(user => user.id === id);
          if (active && user) { const { password, ...profile } = user; const scoped = await fetchUserData(profile); if (active) { applyData(scoped); setCurrentUser(profile); } }
        } else {
          const profile = await cloudProfile();
          if (active && profile) { setCurrentUser(profile); applyData(await fetchUserData(), profile.role); }
        }
      } catch (error) { if (active) { setLoginError(error instanceof Error ? error.message : 'Não foi possível restaurar a sessão.'); setDataError('Não foi possível carregar a base. Saia e entre novamente.'); } }
    };
    void restore();
    return () => { active = false; };
  }, []);
  // Sync current active view
  useEffect(() => {
    try {
      localStorage.setItem('gia_erp_current_view', view);
    } catch (e) {
      console.error(e);
    }
  }, [view]);

  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
       const file = e.target.files[0];
       const reader = new FileReader();
       reader.onloadend = () => {
          const result = reader.result as string;
          setCurrentUser(prev => prev ? {...prev, profilePicture: result} : prev);
          setUsers(prevUsers => prevUsers.map(u => 
             currentUser && u.id === currentUser.id ? {...u, profilePicture: result} : u
          ));
       };
       reader.readAsDataURL(file);
    }
  };

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('');
  
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastTimeoutId, setToastTimeoutId] = useState<number | null>(null);
  
  const showToast = useCallback((message: string, duration: number = 5000) => {
    if (toastTimeoutId) {
        window.clearTimeout(toastTimeoutId);
    }
    setToastMessage(message);
    const newTimeoutId = window.setTimeout(() => {
        setToastMessage('');
        setToastTimeoutId(null);
    }, duration);
    setToastTimeoutId(newTimeoutId);
  }, [toastTimeoutId]);

  const handleCloseToast = useCallback(() => {
    if (toastTimeoutId) {
        window.clearTimeout(toastTimeoutId);
    }
    setToastMessage('');
    setToastTimeoutId(null);
  }, [toastTimeoutId]);

  const handleSaveData = useCallback(async () => {
    if (!currentUser) {
        showToast('Erro: Nenhum usuário logado.', 10000);
        return;
    }
    setIsLoading(true);
    setLoadingMessage(isDemo ? 'Salvando demonstração...' : 'Confirmando alterações na nuvem...');
    try {
        if (!dataReady) throw new Error('A base não foi carregada. Salvamento bloqueado.');
        if (currentUser.role === 'viewer') throw new Error('Seu perfil permite apenas consulta.');
        const nextRevision = await saveUserData({ expenses, drivers, users, trucks, maintenance, trackingData, revision }, currentUser);
        setRevision(nextRevision); setSavedSnapshot(snapshot);
        showToast(isDemo ? 'Dados salvos neste navegador.' : 'Dados confirmados na nuvem.');
    } catch (error) {
        console.error("Failed to save data to cloud:", error);
        showToast(error instanceof Error ? error.message : 'Falha ao salvar. As alterações continuam na tela.', 10000);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [currentUser, expenses, drivers, users, trucks, maintenance, trackingData, revision, snapshot, dataReady, showToast]);

  const handleSetView = useCallback((newView: View) => {
    if (!currentUser || !VIEW_ROLES[newView]?.includes(currentUser.role)) { showToast('Seu perfil não tem acesso a esta área.'); return; }
    setView(newView);
  }, [currentUser, showToast]);

  const handleLogin = useCallback(async (username: string, password: string): Promise<void> => {
    setIsLoading(true);
    setLoadingMessage('Acessando base de dados...');
    setLoginError('');
    try {
        let profile: User;
        let data: UserData;
        if (isDemo) {
          data = await fetchUserData();
          const matched = data.users.find(user => user.username.toLowerCase() === username.trim().toLowerCase() && user.password === password);
          if (!matched) throw new Error('Usuário ou senha inválidos.');
          const { password: secret, ...safeProfile } = matched; profile = safeProfile;
          data = await fetchUserData(profile);
          sessionStorage.setItem('frota_demo_session', profile.id);
        } else { profile = await loginCloud(username, password); data = await fetchUserData(); }
        applyData(data, profile.role); setCurrentUser(profile);
        setView(profile.role === 'mechanic' ? 'maintenance' : profile.role === 'user' ? 'motorista-interno' : 'dashboard');
    } catch (error) {
        setLoginError(error instanceof Error ? error.message : 'Ocorreu um erro no login.');
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  }, [users]);
  
  const handleLogout = async () => {
      if (hasUnsavedChanges && !window.confirm('Há alterações não salvas. Deseja sair e descartá-las?')) return;
      await logout(); setCurrentUser(null); applyData(emptyData()); setDataReady(false);
  };
  const assertEdit = (roles: Role[]) => {
    if (!currentUser || !roles.includes(currentUser.role)) throw new Error('Seu perfil não permite esta alteração.');
  };
  const addUser = useCallback((username: string, password: string, role: Role) => {
      const newUser: User = {
          id: `u${Date.now()}`,
          username,
          password,
          role
      };
      setUsers(prevUsers => [...prevUsers, newUser]);
  }, []);
  
  const updateUser = useCallback((updatedUser: User) => {
      setUsers(prevUsers => prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user));
  }, []);

  const deleteUser = useCallback((userId: string) => {
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
  }, []);

  const addDriver = useCallback((name: string) => {
    const newDriver: Driver = {
      id: `d${Date.now()}`,
      name,
    };
    setDrivers(prev => [newDriver, ...prev]);
  }, []);

  const deleteDriver = useCallback((driverId: string) => {
    if (expenses.some(expense => expense.driverId === driverId)) { showToast('Motorista vinculado a lançamentos. Preserve o histórico financeiro.'); return; }
    setDrivers(prevDrivers => prevDrivers.filter(d => d.id !== driverId));
  }, [expenses, showToast]);

  const addExpense = useCallback((expense: Omit<Expense, 'id'>) => {
    assertEdit(['admin', 'user', 'finance']);
    const issue = validateExpense(expense, drivers); if (issue) throw new Error(issue);
    expense = normalizeExpense(expense);
    const newExpense: Expense = {
      ...expense,
      id: `exp-${Date.now()}-${Math.random()}`,
    };
    setExpenses(prevExpenses => [newExpense, ...prevExpenses]);
  }, [drivers, currentUser]);
  
  const addExpensesBatch = useCallback((newExpenses: Omit<Expense, 'id'>[]) => {
    assertEdit(['admin', 'user', 'finance']);
    newExpenses.forEach((expense, index) => { const issue = validateExpense(expense, drivers); if (issue) throw new Error(`Linha ${index + 2}: ${issue}`); });
    newExpenses = newExpenses.map(normalizeExpense);
    const expensesWithIds: Expense[] = newExpenses.map(exp => ({
      ...exp,
      id: `exp-${Date.now()}-${Math.random()}`,
    }));
    setExpenses(prev => [...expensesWithIds, ...prev]);
  }, [drivers, currentUser]);

  const updateExpense = useCallback((updatedExpense: Expense) => {
    assertEdit(['admin', 'user', 'finance']);
    const issue = validateExpense(updatedExpense, drivers); if (issue) throw new Error(issue);
    updatedExpense = normalizeExpense(updatedExpense);
    setExpenses(prevExpenses => 
      prevExpenses.map(expense => 
        expense.id === updatedExpense.id ? updatedExpense : expense
      )
    );
  }, [drivers, currentUser]);

  const deleteExpense = useCallback((expenseId: string) => {
    setExpenses(prevExpenses => prevExpenses.filter(e => e.id !== expenseId));
  }, []);

  const handleCompleteCargo = useCallback((driverId: string, cargoId: string) => {
    setTrackingData(prev => prev.map(driver => {
      if (driver.driverId !== driverId) return driver;
      
      const finishedCargo = driver.pendingCargos.find(c => c.id === cargoId);
      const newPending = driver.pendingCargos.filter(c => c.id !== cargoId);
      
      return {
        ...driver,
        pendingCargos: newPending
      };
    }));
  }, []);

  const handleLinkExpense = () => showToast('Vínculo de rota indisponível: é necessário um destino geocodificado pelo provedor de rastreamento.');
  const handleBulkUpdateExpenses = useCallback((updates: Expense[], additions: Omit<Expense, 'id'>[], deletions: string[]) => {
    setExpenses(prevExpenses => {
      let newExpenses = [...prevExpenses];
      if (deletions.length > 0) {
        const deletionSet = new Set(deletions);
        newExpenses = newExpenses.filter(exp => !deletionSet.has(exp.id));
      }
      if (updates.length > 0) {
        const updatesMap = new Map(updates.map(u => [u.id, u]));
        newExpenses = newExpenses.map(exp => updatesMap.get(exp.id) || exp);
      }
      if (additions.length > 0) {
          const newAdditions: Expense[] = additions.map(exp => ({
              ...exp,
              id: `exp-${Date.now()}-${Math.random()}`,
          }));
          newExpenses = [...newAdditions, ...newExpenses];
      }
      return newExpenses;
    });
  }, []);
  
  const getHeaderTitle = () => {
      switch(view) {
          case 'dashboard': return 'Painel Executivo Logístico';
          case 'motorista-interno': return 'Gestão Frota Interna';
          case 'motorista-externo': return 'Gestão Frota Terceira';
          case 'driver-management': return 'Gerenciar Colaboradores';
          case 'maintenance': return 'Controle de Manutenção';
          case 'fleet': return 'Gestão de Ativos (Frota)';
          case 'user-management': return 'Configurações de Acesso';
          case 'advanced-reports': return 'Business Intelligence';
          case 'tracking': return 'Posições registradas';
          case 'dre': return 'Resultado das viagens';
          default: return 'Sistema ERP';
      }
  }

  const renderView = () => {
    if (isLoading && !toastMessage) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center p-10 bg-white rounded-lg shadow-md">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-500 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-700">{loadingMessage || 'Processando Dados...'}</h2>
                </div>
            </div>
        );
    }

    if (dataError) return <div role="alert" className="surface text-red-700">{dataError}</div>;
    if (!dataReady) return <p>Carregando a base...</p>;
    if (!currentUser || !VIEW_ROLES[view]?.includes(currentUser.role)) return <div className="surface">Seu perfil não tem acesso a esta área.</div>;
    switch (view) {
      case 'fleet': return <div className="surface"><h1 className="text-2xl font-bold text-brand-900 mb-5">Veículos e equipamentos</h1><div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">{trucks.map(truck => <article key={truck.id} className="rounded-xl border border-brand-100 p-5"><p className="text-xl font-bold text-brand-800">{truck.plate}</p><p className="mt-2">{truck.model} • {truck.year}</p><p className="text-sm text-gray-500 mt-2">{truck.lastOdometer.toLocaleString('pt-BR')} km</p><p className="text-sm mt-2">{truck.status === 'active' ? 'Ativo' : truck.status === 'maintenance' ? 'Em manutenção' : 'Parado'}</p></article>)}</div>{trucks.length === 0 && <p>Nenhum veículo cadastrado.</p>}</div>;
      case 'dashboard':
        return <ExecutiveDashboard expenses={expenses} drivers={drivers} trucks={trucks} maintenance={maintenance} />;
      case 'dre':
        return <DRE expenses={expenses} />;
      case 'motorista-interno':
        return <ExpensesList type="internal" isAdmin={currentUser?.role === 'admin'} expenses={expenses.filter(e => e.type === 'internal')} drivers={drivers} onAddExpense={addExpense} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense} onImportExpenses={addExpensesBatch} showToast={showToast} onBulkUpdate={handleBulkUpdateExpenses} />;
      case 'motorista-externo':
        return <ExpensesList type="external" isAdmin={currentUser?.role === 'admin'} expenses={expenses.filter(e => e.type === 'external')} drivers={drivers} onAddExpense={addExpense} onUpdateExpense={updateExpense} onDeleteExpense={deleteExpense} onImportExpenses={addExpensesBatch} showToast={showToast} onBulkUpdate={handleBulkUpdateExpenses} />;
      case 'maintenance':
        return <Maintenance maintenance={maintenance} trucks={trucks} onAddMaintenance={(m) => (() => { assertEdit(['admin', 'mechanic']); const issue = validateMaintenance(m, trucks); if (issue) throw new Error(issue); setMaintenance(prev => [{id: crypto.randomUUID(), ...m} as MaintenanceRecord, ...prev]); })()} onUpdateMaintenance={(m) => (() => { assertEdit(['admin', 'mechanic']); const issue = validateMaintenance(m, trucks); if (issue) throw new Error(issue); setMaintenance(prev => prev.map(record => record.id === m.id ? m : record)); })()} onDeleteMaintenance={(id) => setMaintenance(prev => prev.filter(record => record.id !== id))} />;
      case 'driver-management':
        return <DriverManagement drivers={drivers} onAddDriver={addDriver} onDeleteDriver={deleteDriver} />;
      case 'advanced-reports':
        return <AdvancedReports expenses={expenses} drivers={drivers} />;
      case 'tracking':
        return <TrackingMap 
           trackingData={trackingData} 
           onCompleteCargo={handleCompleteCargo} 
           expenses={expenses}
           onLinkExpense={handleLinkExpense}
        />;
      case 'user-management':
        if (!isDemo) return <div className="surface"><h2 className="text-xl font-bold">Acessos da empresa</h2><p className="mt-3 text-gray-600">As contas reais são gerenciadas pelo administrador no Firebase Authentication. Permissões são vinculadas à empresa; senhas não são armazenadas nos dados da frota.</p></div>;
        if (currentUser?.role === 'admin') return <UserManagement 
            users={users} 
            onAddUser={addUser} 
            onUpdateUser={updateUser}
            onDeleteUser={deleteUser}
            currentUser={currentUser}
        />;
        break;
      default:
        return <ExecutiveDashboard expenses={expenses} drivers={drivers} trucks={trucks} maintenance={maintenance} />;
    }
    return <div className="flex items-center justify-center h-full"><div className="text-center p-10 bg-white rounded-lg shadow-md"><h2 className="text-2xl font-bold text-red-600 mb-2">Acesso Negado</h2><p className="text-gray-600">Você não tem permissão para visualizar esta página.</p></div></div>;
  };

  if (!currentUser) {
      return <Login onLogin={handleLogin} error={loginError} busy={isLoading} />;
  }
  
  const viewsWithSaveButton: View[] = [
      'motorista-interno',
      'motorista-externo',
      'driver-management',
      'user-management',
      'tracking', 'maintenance', 'fleet'
  ];

  return (
    <APIProvider apiKey={API_KEY} version="weekly">
    <div className="app-shell flex h-screen bg-gray-50 overflow-hidden font-sans">
      {/* Mobile Backdrop */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 lg:hidden backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Desktop always visible, Mobile is a drawer */}
      <div className={`
        fixed inset-y-0 left-0 z-50 transform lg:relative lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0 w-72' : '-translate-x-full lg:w-64'}
      `}>
        <Sidebar 
          currentView={view} 
          setView={(v) => { handleSetView(v); setIsMobileMenuOpen(false); }} 
          currentUser={currentUser} 
          onLogout={handleLogout} 
        />
      </div>
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="app-header bg-white border-b border-gray-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
              aria-label="Abrir menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
            </button>
            <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate leading-tight">
              {getHeaderTitle()}
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {currentUser.role !== 'viewer' && (
              <button
                onClick={handleSaveData}
                disabled={isLoading || !dataReady || !hasUnsavedChanges}
                className="flex items-center px-3 sm:px-4 py-2 bg-brand-600 text-white text-sm font-bold rounded-lg shadow-sm hover:bg-brand-700 transition"
              >
                <SaveIcon className="h-4 w-4 mr-2" />
                {isLoading ? 'Salvando…' : 'Salvar'}
              </button>
            )}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-100">
               <div className="hidden md:flex flex-col items-end">
                  <span className="text-sm font-bold text-gray-800 leading-none">{currentUser.username}</span>
                  <span className="text-xs text-gray-400 font-medium">{currentUser.role === 'admin' ? 'Administrador' : 'Operador'}</span>
               </div>
               <div 
                 className="relative h-8 w-8 md:h-10 md:w-10 bg-brand-100 border border-brand-200 rounded-full flex items-center justify-center text-brand-600 font-bold text-sm md:text-base cursor-pointer overflow-hidden group"
                 onClick={() => fileInputRef.current?.click()}
                 title="Alterar foto de perfil"
               >
                 {currentUser.profilePicture ? (
                   <img src={currentUser.profilePicture} alt={currentUser.username} className="w-full h-full object-cover" />
                 ) : (
                   currentUser.username.charAt(0)
                 )}
                 <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                 </div>
               </div>
               <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleProfilePhotoChange} 
                  accept="image/*" 
                  className="hidden" 
               />
            </div>
          </div>
        </header>
        
        <main className="app-main flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 relative custom-scrollbar flex flex-col">
          <div className="max-w-[1600px] w-full mx-auto flex-1 flex flex-col">
            <ErrorBoundary>
              <div className="data-status mb-5" role="status"><span>{isDemo ? (currentUser.role === 'admin' ? 'Demonstração do administrador • dados de exemplo' : 'Base local deste usuário • dados salvos neste navegador') : 'Base da empresa • acesso autenticado'}</span><strong>{hasUnsavedChanges ? 'Alterações não salvas' : dataReady ? 'Sem alterações pendentes' : 'Carregando'}</strong></div>
              <Suspense fallback={<div className="surface">Carregando área...</div>}>{renderView()}</Suspense>
            </ErrorBoundary>
          </div>
          
          {toastMessage && (
             <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
               <div className="bg-gray-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                 <div className="p-1 bg-green-500 rounded-full">
                    <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                 </div>
                 <p className="text-sm font-semibold">{toastMessage}</p>
                 <button onClick={handleCloseToast} className="ml-2 text-gray-400 hover:text-white transition-colors">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                 </button>
               </div>
             </div>
          )}
        </main>
      </div>
    </div>
    </APIProvider>
  );
};

export default App;
