import React from 'react';
import { 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart3, 
  CreditCard,
  Building2,
  CheckCircle,
  Menu,
  X,
  Settings,
  LogOut,
  Truck,
  Contact,
  Wallet,
  Crown,
  UserCog,
  Sparkles,
  BookOpen,
  Globe,
  Utensils,
  CalendarDays
} from 'lucide-react';
import { Subscription, Employee, StoreSettings } from '../types';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  subscription: Subscription;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentUser: Employee | null;
  onLogout: () => void;
  storeSettings: StoreSettings;
  isSimulatingShop?: boolean;
  setIsSimulatingShop?: (val: boolean) => void;
  onEditProfile?: () => void;
  isPracticeMode?: boolean;
  onTogglePracticeMode?: (val: boolean) => void;
}

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  subscription,
  sidebarOpen,
  setSidebarOpen,
  currentUser,
  onLogout,
  storeSettings,
  isSimulatingShop = false,
  setIsSimulatingShop,
  onEditProfile,
  isPracticeMode = false,
  onTogglePracticeMode
}: SidebarProps) {
  const isSuperAdmin = currentUser?.email === 'pezziniarg@gmail.com';
  const isSupportCollaborator = currentUser?.role === 'Soporte' || currentUser?.role === 'SupportCollaborator';
  const canAccessSuperAdmin = isSuperAdmin || isSupportCollaborator;

  const menuItems = [
    { id: 'pos', name: 'Terminal POS', icon: ShoppingBag, adminOnly: false },
    { id: 'comidas', name: 'Comidas 🍔', icon: Utensils, adminOnly: false },
    { id: 'online_sales', name: 'Venta Online 🌐', icon: Globe, adminOnly: false },
    { id: 'inventory', name: 'Inventario / Stock', icon: Package, adminOnly: true },
    { id: 'customers', name: 'Gestión de Clientes', icon: Contact, adminOnly: false },
    { id: 'debts', name: 'Cuentas Corrientes', icon: Wallet, adminOnly: false },
    { id: 'calendar', name: 'Calendario Comercial', icon: CalendarDays, adminOnly: false },
    { id: 'suppliers', name: 'Proveedores', icon: Truck, adminOnly: true },
    { id: 'employees', name: 'Empleados / Roles', icon: Users, adminOnly: true },
    { id: 'reports', name: 'Reportes y Análisis', icon: BarChart3, adminOnly: true },
    { id: 'settings', name: 'Ajustes de Tienda', icon: Settings, adminOnly: true },
    { id: 'subscription', name: 'Mi Suscripción', icon: CreditCard, adminOnly: true },
    { id: 'ai_support', name: 'Soporte IA y Auto-Mant.', icon: Sparkles, adminOnly: false },
    { id: 'manual', name: 'Manual de MAX24', icon: BookOpen, adminOnly: false },
  ];

  const adminMenuItems = [
    { id: 'super_admin', name: 'Dashboard General', icon: Crown, adminOnly: false },
  ];

  const isAdmin = currentUser?.role === 'Administrador' || currentUser?.role === 'Gerente' || currentUser?.role === 'Supervisor';
  
  // Decide which menu items to show based on simulation state
  const activeMenuItems = canAccessSuperAdmin
    ? (isSimulatingShop 
        ? [ { id: 'super_admin', name: 'Dashboard General', icon: Crown, adminOnly: false }, ...menuItems ]
        : [ { id: 'super_admin', name: 'Dashboard General', icon: Crown, adminOnly: false } ]
      )
    : menuItems.filter(item => !item.adminOnly || isAdmin);

  return (
    <>
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed inset-y-0 left-0 bg-white text-slate-800 w-64 z-40 transform transition-transform duration-300 ease-in-out flex flex-col justify-between border-r border-orange-100 shadow-sm
        lg:translate-x-0 lg:static lg:h-[100vh]
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Header Block & Branding */}
        <div className="flex-1 overflow-y-auto min-h-0 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-orange-100 [&::-webkit-scrollbar-track]:bg-transparent">
          <div className="p-6 border-b border-orange-100 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {canAccessSuperAdmin && !isSimulatingShop ? (
                <>
                  <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl text-white font-black shadow-md shadow-orange-500/25 flex items-center justify-center w-10 h-10 aspect-square shrink-0">
                    M24
                  </div>
                  <div className="min-w-0">
                    <h2 className="font-sans font-extrabold text-xs tracking-tight text-slate-900 leading-tight truncate max-w-[130px]">
                      {isSupportCollaborator ? 'M24 SOPORTE' : 'MAX24 SAAS'}
                    </h2>
                    <p className="text-[9px] font-mono text-orange-600 tracking-wider uppercase mt-0.5 font-bold">Consola Central</p>
                  </div>
                </>
              ) : (
                <>
                  {storeSettings.logoUrl ? (
                    <img 
                      src={storeSettings.logoUrl} 
                      className="w-10 h-10 rounded-xl object-cover border border-orange-100 shadow-sm flex-shrink-0" 
                      referrerPolicy="no-referrer"
                      alt="logo" 
                    />
                  ) : (
                    <div className="p-2.5 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl text-white font-black shadow-md shadow-orange-500/25 flex items-center justify-center w-10 h-10 aspect-square shrink-0">
                      M24
                    </div>
                  )}
                  <div className="min-w-0">
                    <h2 className="font-sans font-extrabold text-sm tracking-tight text-slate-900 leading-tight truncate max-w-[130px]">
                      {storeSettings.name}
                    </h2>
                    <p className="text-[9px] font-mono text-orange-600 tracking-widest uppercase mt-0.5 font-bold">Punto de Venta</p>
                  </div>
                </>
              )}
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1.5 hover:bg-orange-50 rounded-lg text-slate-500 hover:text-orange-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
 
          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 focus-nav" id="sidebar-nav">
            {activeMenuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              const isComidas = item.id === 'comidas';
              const isLocked = isComidas && subscription.plan !== 'Empresarial' && !isSuperAdmin;
              return (
                <button
                   key={item.id}
                   id={`nav-tab-${item.id}`}
                   onClick={() => {
                     setCurrentTab(item.id);
                     setSidebarOpen(false);
                   }}
                   className={`
                     w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer
                     ${isActive 
                       ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold shadow-md shadow-orange-500/20' 
                       : 'text-slate-600 hover:text-orange-600 hover:bg-orange-50/50'}
                   `}
                 >
                   <div className="flex items-center gap-3 min-w-0">
                     <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-orange-500'}`} />
                     <span className="truncate">{item.name}</span>
                   </div>
                   {isLocked && (
                     <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[8px] font-bold uppercase rounded border border-violet-200/50 tracking-wider font-mono shrink-0">
                       PRO
                     </span>
                   )}
                </button>
              );
            })}
          </nav>
        </div>
 
        {/* Subscription Footer Info Badge */}
        <div className="p-4 border-t border-orange-100 bg-orange-50/15 space-y-3.5">
          {/* User Profile Info Card with Logout Option */}
          {currentUser && (
            <div className="p-3 bg-white rounded-xl border border-orange-100 flex flex-col gap-2.5 shadow-xs">
              <div className="flex items-center justify-between gap-2 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8.5 h-8.5 rounded-lg bg-orange-50 border border-orange-150 text-orange-600 flex items-center justify-center font-bold text-sm shrink-0 uppercase font-mono">
                    {currentUser.name.slice(0, 2)}
                  </div>
                  <div className="min-w-0 leading-tight">
                    <p className="text-xs font-bold text-slate-800 truncate">{currentUser.name}</p>
                    <p className="text-[10px] font-mono text-orange-600 font-bold tracking-wider uppercase mt-0.5">
                      {isSupportCollaborator ? 'Soporte Técnico' : (isSuperAdmin && !isSimulatingShop ? 'Master Creador' : currentUser.role)}
                    </p>
                  </div>
                </div>
                {onEditProfile && (
                  <button 
                    onClick={onEditProfile}
                    className="p-1.5 bg-orange-50/55 hover:bg-orange-500 hover:text-white rounded-lg text-orange-600/80 transition-all cursor-pointer shrink-0"
                    title="Editar Mi Perfil"
                  >
                    <UserCog className="w-4 h-4" />
                  </button>
                )}
              </div>
              <button 
                onClick={onLogout}
                className="w-full py-2 bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 hover:border-emerald-600 rounded-xl transition-all cursor-pointer shadow-xs flex items-center justify-center gap-1.5 font-extrabold text-xs tracking-wider"
                title="Cerrar Sesión (Salir del Sistema)"
              >
                <LogOut className="w-4 h-4" />
                <span>SALIR DEL SISTEMA</span>
              </button>

              {/* Modo Practicante Toggle Switch */}
              {currentUser.role !== 'Comprador' && currentUser.role !== 'Proveedor' && (
                <div className="pt-2 border-t border-orange-100/60 flex items-center justify-between gap-2 text-[11px] mt-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${isPracticeMode ? 'bg-amber-500 animate-pulse' : 'bg-slate-300'}`} />
                    <span className="font-extrabold text-slate-600 tracking-tight">Modo Practicante</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTogglePracticeMode?.(!isPracticeMode)}
                    className={`relative inline-flex h-4.5 w-8 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${isPracticeMode ? 'bg-amber-500' : 'bg-slate-200'}`}
                    title={isPracticeMode ? "Desactivar Modo Practicante" : "Activar Modo Practicante"}
                  >
                    <span
                      className={`pointer-events-none inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${isPracticeMode ? 'translate-x-3.5' : 'translate-x-0'}`}
                    />
                  </button>
                </div>
              )}
            </div>
          )}
 
          {canAccessSuperAdmin && !isSimulatingShop ? (
            <div className="p-3.5 bg-gradient-to-br from-white to-orange-50/20 border border-orange-200 rounded-xl shadow-xs relative overflow-hidden">
              <div className="absolute right-0 top-0 w-10 h-10 bg-orange-500/5 rounded-full blur-md" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] text-orange-600 font-bold tracking-widest uppercase font-mono">
                  {isSupportCollaborator ? 'Acceso Soporte' : 'Licencia Master'}
                </span>
                <span className="px-2 py-0.5 bg-orange-500 text-white rounded-full text-[9px] font-bold tracking-wide uppercase">
                  {isSupportCollaborator ? 'LIMITADO' : 'ILIMITADO'}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                <Crown className="w-3.5 h-3.5 text-orange-500" />
                <span>{isSupportCollaborator ? 'Soporte Oficial' : 'Consola Propietario'}</span>
              </div>
              <p className="text-[9px] text-slate-500 mt-1 z-10 relative">
                {isSupportCollaborator ? 'Atención al cliente y resolución de reclamos' : 'Controlador absoluto de marcas y cobranzas'}
              </p>
            </div>
          ) : (
            <div className="p-3.5 bg-white rounded-xl border border-orange-100 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-500 font-medium">Plan de Tienda</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase
                  ${subscription.plan === 'Profesional' ? 'bg-orange-500/15 text-orange-600 border border-orange-500/35' : ''}
                  ${subscription.plan === 'Básico' ? 'bg-blue-500/15 text-blue-500 border border-blue-500/35' : ''}
                  ${subscription.plan === 'Empresarial' ? 'bg-violet-500/15 text-violet-500 border border-violet-500/35' : ''}
                  ${subscription.plan === 'Gratuito' ? 'bg-slate-500/15 text-slate-500 border border-slate-500/35' : ''}
                `}>
                  {subscription.plan}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold text-orange-600">
                <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                <span>Suscripción Activa</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1.5 font-mono">
                Próximo cobro: {subscription.nextBillingDate}
              </p>
            </div>
          )}
          
          <div className="mt-4 flex items-center justify-between text-[11px] text-slate-400">
            <span>v1.2.0 Pro</span>
            <span className="font-mono text-[9px] bg-orange-50 border border-orange-100 px-1.5 py-0.5 rounded text-orange-600">max24app.com</span>
          </div>
        </div>
      </aside>
    </>
  );
}
