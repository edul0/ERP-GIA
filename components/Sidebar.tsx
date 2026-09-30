import React from 'react';
import { View, User, Role } from '../types';
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  MapPin, 
  BarChart3, 
  Settings, 
  LogOut, 
  Wrench,
  Boxes,
  Smartphone,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  currentView: View;
  setView: (view: View) => void;
  currentUser: User;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUser, onLogout }) => {
  const navItems: { view: View; label: string; icon: React.ReactNode; roles: Role[] }[] = [
    { view: 'dashboard', label: 'Painel Executivo', icon: <LayoutDashboard size={20} />, roles: ['admin', 'user', 'finance', 'viewer'] },
    { view: 'dre', label: 'Resultado das viagens', icon: <DollarSign size={20} />, roles: ['admin', 'finance'] },
    { view: 'motorista-interno', label: 'Frota Interna', icon: <Truck size={20} />, roles: ['admin', 'user', 'finance', 'viewer'] },
    { view: 'motorista-externo', label: 'Frota Terceira', icon: <Truck size={20} />, roles: ['admin', 'user', 'finance', 'viewer'] },
    { view: 'tracking', label: 'Rastreamento GPS', icon: <MapPin size={20} />, roles: ['admin', 'finance', 'viewer'] },
    { view: 'fleet', label: 'Veículos e equipamentos', icon: <Truck size={20} />, roles: ['admin', 'user', 'finance', 'viewer', 'mechanic'] },
    { view: 'maintenance', label: 'Manutenção', icon: <Wrench size={20} />, roles: ['admin', 'user', 'mechanic', 'finance'] },
    { view: 'driver-management', label: 'Motoristas', icon: <Users size={20} />, roles: ['admin', 'user', 'finance', 'viewer'] },
    { view: 'advanced-reports', label: 'Inteligência (B.I)', icon: <BarChart3 size={20} />, roles: ['admin', 'user', 'finance', 'viewer'] },
    { view: 'user-management', label: 'Configurações', icon: <Settings size={20} />, roles: ['admin'] },
  ];
  
  const accessibleNavItems = navItems.filter(item => item.roles.includes(currentUser.role));

  return (
    <aside className="app-sidebar h-full w-full flex flex-col">
      <div className="sidebar-brand">
        <div className="brand-plate generic-brand"><img src="/logo-irmaos-andrade.png" alt="Grupo Irmãos Andrade" /></div>
        <div className="sidebar-product"><span>GESTÃO DE FROTA</span><span className="product-tag">ERP GIA</span></div>
      </div>
      <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-1.5 custom-scrollbar" aria-label="Navegação principal">
        <p className="nav-caption">ÁREA DE TRABALHO</p>
        {accessibleNavItems.map(item => (
          <button
            key={item.view}
            aria-current={currentView === item.view ? "page" : undefined}
            onClick={() => setView(item.view)}
            className={`w-full flex items-center px-4 py-3 text-left text-sm font-semibold rounded-xl transition-all duration-200 group ${
              currentView === item.view
                ? 'nav-active'
                : 'nav-idle'
            }`}
          >
            <span className={currentView === item.view ? 'text-white' : 'nav-icon'}>
              {item.icon}
            </span>
            <span className="ml-4 truncate">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="sidebar-footer p-4">
        <button
          onClick={onLogout}
          className="w-full flex items-center px-4 py-3 text-left text-sm font-bold rounded-xl transition-colors duration-200 text-white/70 hover:bg-white/10 hover:text-white"
        >
          <LogOut size={20} />
          <span className="ml-4">Sair do Sistema</span>
        </button>
        <p className="text-[10px] text-gray-400 text-center mt-4 font-medium uppercase tracking-widest">Grupo Irmãos Andrade • ERP GIA</p>
      </div>
    </aside>
  );
};

export default Sidebar;
