import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App as CapacitorApp } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';
import { Menu, Building2, ShieldEllipsis, Crown, CheckCircle2, BookOpen, ChevronRight, ChefHat, AlertTriangle } from 'lucide-react';
import Sidebar from './components/Sidebar';
import POS from './components/POS';
import Inventory from './components/Inventory';
import Employees from './components/Employees';
import Reports from './components/Reports';
import SubscriptionsApp from './components/SubscriptionsApp';
import Settings from './components/Settings';
import Login from './components/Login';
import Customers from './components/Customers';
import Suppliers from './components/Suppliers';
import Debts from './components/Debts';
import StoreSetupWizard from './components/StoreSetupWizard';
import LandingPage from './components/LandingPage';
import SuperAdminDashboard from './components/SuperAdminDashboard';
import BuyerPortal from './components/BuyerPortal';
import SupplierPortal from './components/SupplierPortal';
import AISupportAndMaintenance from './components/AISupportAndMaintenance';
import UserManual from './components/UserManual';
import OnlineSales from './components/OnlineSales';
import AccessibilityAssistant from './components/AccessibilityAssistant';
import TrialPaywall from './components/TrialPaywall';
import Comidas from './components/Comidas';
import CashierLobby from './components/CashierLobby';
import CalendarComponent from './components/CalendarComponent';

// Import newly integrated Firebase services and error handler helpers
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
import { signInAnonymously } from 'firebase/auth';

import { Product, Employee, Sale, Subscription, StoreSettings, Category, Customer, Supplier, DebtTransaction, SupplierPurchase, CashierSession } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_EMPLOYEES, 
  INITIAL_SALES, 
  INITIAL_SUBSCRIPTION,
  INITIAL_STORE_SETTINGS,
  INITIAL_CATEGORIES,
  INITIAL_CUSTOMERS
} from './initialData';

// Kitchen Ready Screen for orders updated via Chef's WhatsApp direct link
function KitchenReadyScreen({ 
  kitchenReadyOrder, 
  onClose 
}: { 
  kitchenReadyOrder: { orderId: string, storeEmail: string }, 
  onClose: () => void 
}) {
  const [loading, setLoading] = useState(true);
  const [orderData, setOrderData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function updateOrder() {
      try {
        const orderRef = doc(db, 'storeSettings', kitchenReadyOrder.storeEmail, 'foodOrders', kitchenReadyOrder.orderId);
        const snap = await getDoc(orderRef);
        
        if (snap.exists()) {
          const data = snap.data();
          const updatedData = { ...data, status: 'listo' };
          
          // Update in Firestore
          await setDoc(orderRef, updatedData, { merge: true });
          
          if (active) {
            setOrderData(updatedData);
            setLoading(false);
          }
        } else {
          if (active) {
            setError("No se pudo encontrar el pedido en la base de datos de la nube. Por favor verifica si el pedido fue eliminado.");
            setLoading(false);
          }
        }
      } catch (err) {
        console.error("Error updating kitchen order:", err);
        if (active) {
          setError("Ocurrió un error al conectar con la base de datos Firestore.");
          setLoading(false);
        }
      }
    }
    updateOrder();
    return () => { active = false; };
  }, [kitchenReadyOrder]);

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden text-left">
        {/* Ambient background blur circles */}
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-emerald-500/15 rounded-full blur-3xl"></div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-bold text-slate-300">Marcando como Listo en Firestore...</p>
          </div>
        ) : error ? (
          <div className="py-6 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center border border-red-500/20 text-red-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Problema de Sincronización</h2>
            <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
            <div className="pt-4 w-full">
              <button
                onClick={onClose}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs rounded-xl cursor-pointer transition-all uppercase tracking-wider border border-slate-700"
              >
                Cerrar y Volver
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black tracking-widest text-emerald-400 uppercase">COCINA DIGITAL • MAX24</span>
                <h2 className="text-lg font-black text-white tracking-tight leading-none mt-1">¡Pedido Listo!</h2>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Hola <span className="font-bold text-orange-400">Cocinero</span>. El estado de este pedido ha sido cambiado a <span className="font-bold text-emerald-400 uppercase">Listo</span> en la base de datos central en tiempo real. Los cajeros ya pueden entregarlo.
            </p>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-sans font-bold uppercase tracking-wider text-[10px]">Pedido ID:</span>
                <span className="font-black text-orange-400">{orderData?.id}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-sans font-bold uppercase tracking-wider text-[10px]">Cliente:</span>
                <span className="font-bold text-white font-sans">{orderData?.customerName}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-2">
                <span className="text-slate-500 font-sans font-bold uppercase tracking-wider text-[10px]">Modalidad:</span>
                <span className="font-bold text-white font-sans uppercase text-[10px]">
                  {orderData?.type === 'local' ? 'Mesa / Local 🍽️' : orderData?.type === 'takeaway' ? 'Retiro 🛍️' : 'Envío 🚚'}
                </span>
              </div>
              <div className="pt-2">
                <span className="text-slate-500 font-sans font-bold uppercase tracking-wider text-[10px] block mb-1">Detalle del Menú:</span>
                <div className="space-y-1.5 text-slate-300 pl-2 border-l-2 border-orange-500/30 font-sans text-xs">
                  {orderData?.items?.map((item: any, idx: number) => (
                    <div key={idx} className="font-medium">
                      • {item.quantity}x <span className="font-bold text-white">{item.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-2 w-full">
              <button
                onClick={onClose}
                className="w-full py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black text-xs rounded-xl cursor-pointer transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg shadow-orange-500/10"
              >
                <ChefHat className="w-4 h-4" />
                <span>IR A LA PLATAFORMA POS</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const isNativePlatform = Capacitor.isNativePlatform();

  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const saved = localStorage.getItem('currentUser');
    return saved ? JSON.parse(saved) : null;
  });

  // Native session restoration effect from Capacitor Preferences
  useEffect(() => {
    if (isNativePlatform && !currentUser) {
      Preferences.get({ key: 'currentUser' }).then(({ value }) => {
        if (value) {
          try {
            const parsed = JSON.parse(value);
            setCurrentUser(parsed);
          } catch (e) {
            console.error("Error parsing saved native user session:", e);
          }
        }
      });
    }
  }, []);

  // Sync user session to Capacitor Preferences when changed
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      if (isNativePlatform) {
        Preferences.set({ key: 'currentUser', value: JSON.stringify(currentUser) }).catch(console.error);
      }
    } else {
      localStorage.removeItem('currentUser');
      if (isNativePlatform) {
        Preferences.remove({ key: 'currentUser' }).catch(console.error);
      }
    }
  }, [currentUser, isNativePlatform]);

  // Kitchen/Chef dynamic order ready handler state
  const [kitchenReadyOrder, setKitchenReadyOrder] = useState<{ orderId: string, storeEmail: string } | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const readyOrderId = params.get('readyOrderId');
    const storeEmail = params.get('storeEmail');
    if (readyOrderId && storeEmail) {
      return { orderId: readyOrderId, storeEmail };
    }
    return null;
  });

  const [showLiveOrderAlert, setShowLiveOrderAlert] = useState<any | null>(null);

  const [isSimulatingShop, setIsSimulatingShop] = useState<boolean>(() => {
    const saved = localStorage.getItem('is_simulating_shop');
    return saved === 'true';
  });

  const [simulatedStoreEmail, setSimulatedStoreEmail] = useState<string | null>(() => {
    return localStorage.getItem('simulated_store_email');
  });

  const isSuperAdmin = currentUser ? (currentUser.id === 'emp-1' || currentUser.email === 'pezziniarg@gmail.com') : false;
  const isSupportCollaborator = currentUser ? (currentUser.role === 'Soporte' || currentUser.role === 'SupportCollaborator') : false;
  const canAccessSuperAdmin = isSuperAdmin || isSupportCollaborator;

  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(() => {
    return localStorage.getItem('is_practice_mode') === 'true';
  });

  const handleTogglePracticeMode = (active: boolean) => {
    setIsPracticeMode(active);
    localStorage.setItem('is_practice_mode', String(active));
    if (!active) {
      setProducts(prev => prev.filter(p => !p.isPracticeMode));
      setSales(prev => prev.filter(s => !s.isPracticeMode));
      setCustomers(prev => prev.filter(c => !c.isPracticeMode));
    }
  };

  const [currentTab, setCurrentTab] = useState<string>(() => {
    const savedTab = localStorage.getItem('current_tab');
    if (savedTab) {
      return savedTab;
    }
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.email === 'pezziniarg@gmail.com' || parsed.id === 'emp-1' || parsed.role === 'Soporte' || parsed.role === 'SupportCollaborator') {
        if (parsed.role === 'Soporte' || parsed.role === 'SupportCollaborator') {
          return 'super_admin';
        }
        const sim = localStorage.getItem('is_simulating_shop') === 'true';
        return sim ? 'pos' : 'super_admin';
      }
    }
    return 'pos';
  });

  useEffect(() => {
    localStorage.setItem('current_tab', currentTab);
  }, [currentTab]);

  useEffect(() => {
    localStorage.setItem('is_simulating_shop', String(isSimulatingShop));
    // When simulation switches, dynamically snap the tab
    if (canAccessSuperAdmin) {
      if (!isSimulatingShop) {
        setCurrentTab('super_admin');
        localStorage.removeItem('simulated_store_email');
        setSimulatedStoreEmail(null);
        if (currentUser) {
          getDoc(doc(db, 'storeSettings', currentUser.email)).then((snap) => {
            if (snap.exists()) {
              setStoreSettings(snap.data() as StoreSettings);
            }
          });
        }
      } else {
        if (isSupportCollaborator) {
          setIsSimulatingShop(false);
          setCurrentTab('super_admin');
        } else {
          setCurrentTab('pos');
        }
      }
    }
  }, [isSimulatingShop, isSuperAdmin, isSupportCollaborator]);

  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [dismissedWizard, setDismissedWizard] = useState<boolean>(false);

  // Authentication State
  const [showLogin, setShowLogin] = useState<boolean>(() => {
    if (isNativePlatform) return true;
    return localStorage.getItem('showLogin') === 'true';
  });
  const [initialLoginMode, setInitialLoginMode] = useState<'login' | 'register' | 'forgot' | 'buyer_register' | 'supplier_register' | 'employee_login'>(() => {
    return (localStorage.getItem('initialLoginMode') as any) || 'login';
  });

  useEffect(() => {
    localStorage.setItem('showLogin', String(showLogin));
  }, [showLogin]);

  useEffect(() => {
    localStorage.setItem('initialLoginMode', initialLoginMode);
  }, [initialLoginMode]);

  // Native Android Hardware Back Button listener
  useEffect(() => {
    if (!isNativePlatform) return;

    const backListener = CapacitorApp.addListener('backButton', () => {
      // If user is not logged in or currently viewing login page
      if (!currentUser || showLogin) {
        CapacitorApp.exitApp();
      } else if (currentTab !== 'pos' && currentTab !== 'super_admin') {
        // Return to root tab instead of exiting immediately
        if (canAccessSuperAdmin && !isSimulatingShop) {
          setCurrentTab('super_admin');
        } else {
          setCurrentTab('pos');
        }
      } else {
        // If already on root tab, exit app
        CapacitorApp.exitApp();
      }
    });

    return () => {
      backListener.then(handler => handler.remove()).catch(console.error);
    };
  }, [isNativePlatform, currentUser, showLogin, currentTab, canAccessSuperAdmin, isSimulatingShop]);

  // Store Settings State
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    const saved = localStorage.getItem('store_settings');
    return saved ? JSON.parse(saved) : INITIAL_STORE_SETTINGS;
  });

  // Categories list State
  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('store_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  // Load state from local storage or fallback to defaults
  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('store_products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('store_employees');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate pezziniarg@gmail.com password from admin123 to Max24@2626 if found
      return parsed.map((e: any) => {
        if (e.email === 'pezziniarg@gmail.com') {
          return { ...e, password: 'Max24@2626', username: 'pezziniarg@gmail.com' };
        }
        return e;
      });
    }
    return INITIAL_EMPLOYEES;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem('store_sales');
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const saved = localStorage.getItem('store_customers');
    return saved ? JSON.parse(saved) : INITIAL_CUSTOMERS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const saved = localStorage.getItem('store_suppliers');
    return saved ? JSON.parse(saved) : [
      { id: 'sup-1', name: 'Distribuidora Arcor S.A.', contactName: 'Mariano Gómez', phone: '+541154321098', email: 'contacto@distribuidoraarcor.com', address: 'Av. Dorrego 1420, CABA', taxId: '30-12345678-9', notes: 'Suministra galletitas, chocolates, gomitas y caramelos.' },
      { id: 'sup-2', name: 'Coca-Cola FEMSA Argentina', contactName: 'Florencia López', phone: '+541178654321', email: 'vendedora@femsa.com.ar', address: 'Ruta 9 Km 45, Garín', taxId: '30-87654321-9', notes: 'Bebidas Cola, aguas saborizadas y jugos Cepita. Entrega los martes.' },
      { id: 'sup-3', name: 'La Serenísima S.A.', contactName: 'Néstor Peralta', phone: '+541123456789', email: 'nperalta@laserenisima.com.ar', address: 'General Rodríguez, Buenos Aires', taxId: '30-45678912-3', notes: 'Lácteos, quesos, manteca y yogures. Entrega lunes, miércoles y viernes.' }
    ];
  });

  const [subscription, setSubscription] = useState<Subscription>(() => {
    const saved = localStorage.getItem('store_subscription');
    return saved ? JSON.parse(saved) : INITIAL_SUBSCRIPTION;
  });

  const [supplierPurchases, setSupplierPurchases] = useState<SupplierPurchase[]>(() => {
    const saved = localStorage.getItem('store_supplier_purchases');
    return saved ? JSON.parse(saved) : [];
  });

  const [cashierSessions, setCashierSessions] = useState<CashierSession[]>(() => {
    const saved = localStorage.getItem('store_cashier_sessions');
    return saved ? JSON.parse(saved) : [];
  });

  const [initialCashText, setInitialCashText] = useState('5000');
  const [selectedShiftStr, setSelectedShiftStr] = useState('Mañana');
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Backup state for cleared reports
  const [backupExists, setBackupExists] = useState<boolean>(() => {
    return !!localStorage.getItem('store_sales_backup');
  });
  const [backupDate, setBackupDate] = useState<string>(() => {
    return localStorage.getItem('store_sales_backup_date') || '';
  });

  // License and trial tracking states
  const [activeLicense, setActiveLicense] = useState<any>(null);

  // Profile management states
  const [isEditingOwnProfile, setIsEditingOwnProfile] = useState(false);
  const [profileActiveTab, setProfileActiveTab] = useState<'info' | 'payments'>('info');
  const [profileEditName, setProfileEditName] = useState('');
  const [profileEditEmail, setProfileEditEmail] = useState('');
  const [profileEditPassword, setProfileEditPassword] = useState('');
  const [profileEditSuccessMsg, setProfileEditSuccessMsg] = useState('');
  const [profileEditErrorMsg, setProfileEditErrorMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const handleOpenEditProfile = () => {
    if (!currentUser) return;
    setProfileActiveTab('info');
    setProfileEditName(currentUser.name);
    setProfileEditEmail(currentUser.email);
    setProfileEditPassword(currentUser.password || '');
    setProfileEditSuccessMsg('');
    setProfileEditErrorMsg('');
    setIsEditingOwnProfile(true);
  };

  const handleSaveOwnProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (!profileEditName.trim()) {
      setProfileEditErrorMsg('El nombre no puede estar vacío');
      return;
    }
    if (!profileEditEmail.trim() || !profileEditEmail.includes('@')) {
      setProfileEditErrorMsg('Ingresa un correo electrónico válido');
      return;
    }

    setIsSavingProfile(true);
    setProfileEditSuccessMsg('');
    setProfileEditErrorMsg('');

    try {
      // Simulate real cloud database latency for professional feel
      await new Promise(resolve => setTimeout(resolve, 800));

      const updatedUser = {
        ...currentUser,
        name: profileEditName.trim(),
        email: profileEditEmail.trim().toLowerCase(),
        username: profileEditEmail.trim().toLowerCase(),
        password: profileEditPassword ? profileEditPassword.trim() : currentUser.password
      };

      // 1. Update active session
      setCurrentUser(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // 2. Locate and update in employees array
      const updatedEmployees = employees.map(emp => emp.id === currentUser.id ? updatedUser : emp);
      setEmployees(updatedEmployees);
      localStorage.setItem('store_employees', JSON.stringify(updatedEmployees));

      // 3. Save to cloud
      await setDoc(doc(db, 'employees', currentUser.id), updatedUser);

      // 4. If we are pezziniarg@gmail.com and we changed our name, also sync saas_registered_store_owners 'store-1'
      if (currentUser.email === 'pezziniarg@gmail.com') {
        const savedOwners = localStorage.getItem('saas_registered_store_owners');
        if (savedOwners) {
          let ownersList = JSON.parse(savedOwners);
          let updatedAny = false;
          ownersList = ownersList.map((so: any) => {
            if (so.id === 'store-1') {
              updatedAny = true;
              return {
                ...so,
                ownerName: profileEditName.trim(),
                email: profileEditEmail.trim().toLowerCase()
              };
            }
            return so;
          });
          if (updatedAny) {
            localStorage.setItem('saas_registered_store_owners', JSON.stringify(ownersList));
            const s1 = ownersList.find((o: any) => o.id === 'store-1');
            if (s1) {
              await setDoc(doc(db, 'storeOwners', 'store-1'), s1);
            }
          }
        }
      }

      setProfileEditSuccessMsg('¡Perfil actualizado con éxito en la Nube Firestore!');
      setProfileEditErrorMsg('');
      setIsSavingProfile(false);
      setTimeout(() => {
        setIsEditingOwnProfile(false);
        setProfileEditSuccessMsg('');
      }, 1800);
    } catch (err) {
      console.error("Error saving profile", err);
      // fallback local update
      const updatedUserLocal = {
        ...currentUser,
        name: profileEditName.trim(),
        email: profileEditEmail.trim().toLowerCase(),
        password: profileEditPassword ? profileEditPassword.trim() : currentUser.password
      };
      setCurrentUser(updatedUserLocal);
      localStorage.setItem('currentUser', JSON.stringify(updatedUserLocal));
      
      const updatedEmployeesLocal = employees.map(emp => emp.id === currentUser.id ? updatedUserLocal : emp);
      setEmployees(updatedEmployeesLocal);
      localStorage.setItem('store_employees', JSON.stringify(updatedEmployeesLocal));

      setProfileEditSuccessMsg('Perfil actualizado localmente en el navegador.');
      setIsSavingProfile(false);
      setTimeout(() => {
        setIsEditingOwnProfile(false);
        setProfileEditSuccessMsg('');
      }, 2500);
    }
  };

  useEffect(() => {
    if (isLoadingData) return;
    localStorage.setItem('store_supplier_purchases', JSON.stringify(supplierPurchases));
  }, [supplierPurchases, isLoadingData]);

  useEffect(() => {
    if (isLoadingData) return;
    localStorage.setItem('store_cashier_sessions', JSON.stringify(cashierSessions));
  }, [cashierSessions, isLoadingData]);

  const activeStoreEmail = currentUser
    ? (canAccessSuperAdmin && isSimulatingShop && simulatedStoreEmail ? simulatedStoreEmail : (currentUser.storeEmail || currentUser.email || 'global'))
    : 'global';

  // Load and check subscription trial expiration dynamically from Firestore
  useEffect(() => {
    if (!currentUser || activeStoreEmail === 'global' || currentUser.role === 'Comprador' || currentUser.role === 'Proveedor') {
      setActiveLicense(null);
      return;
    }

    let isSubscribed = true;
    
    async function loadActiveLicense() {
      try {
        const { getDocs, query, collection, where } = await import('firebase/firestore');
        const emailToFind = activeStoreEmail.trim().toLowerCase();
        const ownerSnap = await getDocs(query(collection(db, 'storeOwners'), where('email', '==', emailToFind)));
        
        if (!isSubscribed) return;

        if (!ownerSnap.empty) {
          const ownerDoc = ownerSnap.docs[0];
          setActiveLicense({ id: ownerDoc.id, ...ownerDoc.data() });
        } else {
          setActiveLicense(null);
        }
      } catch (err) {
        console.warn("Error loading active store license:", err);
      }
    }

    loadActiveLicense();

    return () => {
      isSubscribed = false;
    };
  }, [currentUser, activeStoreEmail]);

  // Check trial expiration helper
  const checkTrialExpiration = () => {
    if (!activeLicense) return false;
    
    // Skip trial blocking for master admin/demo control sandbox
    if (currentUser?.email === 'pezziniarg@gmail.com' || activeStoreEmail === 'pezziniarg@gmail.com') {
      return false;
    }
    
    // If the status is already Expirado or Suspendido, block!
    if (activeLicense.status === 'Expirado' || activeLicense.status === 'Suspendido') {
      return true;
    }

    // Gratuito plan is subject to the 30-day trial limit
    if (activeLicense.plan === 'Gratuito') {
      const regDate = new Date(activeLicense.registeredDate + 'T00:00:00');
      const today = new Date();
      regDate.setHours(0,0,0,0);
      today.setHours(0,0,0,0);
      
      const diffTime = today.getTime() - regDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 30) {
        // Auto-update status to Expirado in Firestore
        if (activeLicense.status !== 'Expirado') {
          import('firebase/firestore').then(({ doc, updateDoc }) => {
            updateDoc(doc(db, 'storeOwners', activeLicense.id), { status: 'Expirado' })
              .then(() => {
                setActiveLicense((prev: any) => prev ? { ...prev, status: 'Expirado' } : null);
              })
              .catch(err => console.error("Error auto-expiring trial license:", err));
          });
        }
        return true;
      }
    }
    return false;
  };

  const isTrialExpired = checkTrialExpiration();

  // Real-time listener for incoming online orders (alerts)
  useEffect(() => {
    if (!currentUser || !activeStoreEmail || activeStoreEmail === 'global' || currentUser.role === 'Comprador') return;

    const colName = `storeNotifications_${activeStoreEmail}`;
    let isInitialLoad = true;

    const unsubscribe = onSnapshot(collection(db, colName), (snapshot) => {
      let latestNewOrder: any = null;

      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          // Check if it's a real new order (within the last 60 seconds)
          const orderTime = new Date(data.date || '').getTime();
          const isRecent = orderTime > Date.now() - 60000;

          if (isRecent && !isInitialLoad && !data.isRead) {
            latestNewOrder = { id: change.doc.id, ...data };
          }
        }
      });

      isInitialLoad = false;

      if (latestNewOrder) {
        // Play notification sound
        try {
          const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(880, ctx.currentTime);
          gain.gain.setValueAtTime(0.2, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.25);
        } catch (e) {
          console.log("Audio notification bypassed.");
        }
        setShowLiveOrderAlert(latestNewOrder);
      }
    });

    return () => unsubscribe();
  }, [currentUser, activeStoreEmail]);

  // Real-time listener for cashier sessions
  useEffect(() => {
    if (!currentUser || !activeStoreEmail || activeStoreEmail === 'global' || currentUser.role === 'Comprador' || currentUser.role === 'Proveedor') {
      return;
    }

    const unsubscribe = onSnapshot(
      collection(db, 'storeSettings', activeStoreEmail, 'cashierSessions'),
      (snapshot) => {
        const fetchedSessions: CashierSession[] = [];
        snapshot.forEach((d) => fetchedSessions.push(d.data() as CashierSession));
        fetchedSessions.sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
        setCashierSessions(fetchedSessions);
      },
      (error) => {
        console.warn("Error in cashierSessions real-time listener:", error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, activeStoreEmail]);

  const getStoreCollection = (collectionName: string) => {
    return collection(db, 'storeSettings', activeStoreEmail, collectionName);
  };

  const getStoreDoc = (collectionName: string, docId: string) => {
    return doc(db, 'storeSettings', activeStoreEmail, collectionName, docId);
  };

  // Load initial data from Firebase on mount or when currentUser changes
  useEffect(() => {
    async function loadDataFromFirebase() {
      if (!currentUser) {
        // Clean up previous store state to prevent stale data flashing on logout
        setProducts([]);
        setCustomers([]);
        setCategories([]);
        setSuppliers([]);
        setSales([]);
        setSupplierPurchases([]);
        setCashierSessions([]);
        
        // Load global employees so they are available on the login screen
        try {
          const empSnap = await getDocs(collection(db, 'employees'));
          if (!empSnap.empty) {
            const fetched: Employee[] = [];
            empSnap.forEach(d => fetched.push(d.data() as Employee));
            // Merge with INITIAL_EMPLOYEES to make sure default accounts are always available
            const merged = [...INITIAL_EMPLOYEES];
            fetched.forEach(f => {
              if (!merged.some(m => m.email.toLowerCase() === f.email.toLowerCase())) {
                merged.push(f);
              }
            });
            setEmployees(merged);
          } else {
            setEmployees(INITIAL_EMPLOYEES);
          }
        } catch (e) {
          console.warn("Could not load global employees on mount, falling back to defaults:", e);
          setEmployees(INITIAL_EMPLOYEES);
        }
        return;
      }

      setIsLoadingData(true);
      const isDemo = activeStoreEmail === 'prueba@max24app.com' || activeStoreEmail === 'prueba' || activeStoreEmail === 'global' || activeStoreEmail === 'pezziniarg@gmail.com';

      try {
        console.log("Cargando base de datos segura y aislada para el comercio:", activeStoreEmail);
        
        if (!auth.currentUser) {
          try {
            await signInAnonymously(auth);
          } catch (authError) {
            console.warn("AnonymAuth Error:", authError);
          }
        }

        // 1. Products
        const prodSnap = await getDocs(getStoreCollection('products'));
        if (prodSnap.empty) {
          if (isDemo) {
            const fallbackProds = localStorage.getItem('store_products') 
              ? JSON.parse(localStorage.getItem('store_products')!) 
              : INITIAL_PRODUCTS;
            for (const p of fallbackProds) {
              await setDoc(getStoreDoc('products', p.id), { ...p, storeEmail: activeStoreEmail });
            }
            setProducts(fallbackProds);
          } else {
            // Real store: empty state initially as expected by merchant
            setProducts([]);
          }
        } else {
          const fetched: Product[] = [];
          prodSnap.forEach(d => fetched.push(d.data() as Product));
          setProducts(fetched);
        }

        // 2. Employees (Store internal staff)
        const empSnap = await getDocs(getStoreCollection('employees'));
        if (empSnap.empty) {
          if (isDemo) {
            const fallbackEmps = localStorage.getItem('store_employees')
              ? JSON.parse(localStorage.getItem('store_employees')!)
              : INITIAL_EMPLOYEES;
            for (const e of fallbackEmps) {
              await setDoc(getStoreDoc('employees', e.id), { ...e, storeEmail: activeStoreEmail });
              await setDoc(doc(db, 'employees', e.id), { ...e, storeEmail: activeStoreEmail });
            }
            setEmployees(fallbackEmps);
          } else {
            const ownerEmp = {
              ...currentUser,
              storeEmail: activeStoreEmail
            };
            await setDoc(getStoreDoc('employees', ownerEmp.id), ownerEmp);
            setEmployees([ownerEmp]);
          }
        } else {
          const fetched: Employee[] = [];
          empSnap.forEach(d => fetched.push(d.data() as Employee));
          setEmployees(fetched);
        }

        // 3. Customers
        const custSnap = await getDocs(getStoreCollection('customers'));
        if (custSnap.empty) {
          if (isDemo) {
            const fallbackCusts = localStorage.getItem('store_customers')
              ? JSON.parse(localStorage.getItem('store_customers')!)
              : INITIAL_CUSTOMERS;
            for (const c of fallbackCusts) {
              await setDoc(getStoreDoc('customers', c.id), { ...c, storeEmail: activeStoreEmail });
            }
            setCustomers(fallbackCusts);
          } else {
            setCustomers([]);
          }
        } else {
          const fetched: Customer[] = [];
          custSnap.forEach(d => fetched.push(d.data() as Customer));
          setCustomers(fetched);
        }

        // 4. Categories
        const catSnap = await getDocs(getStoreCollection('categories'));
        if (catSnap.empty) {
          if (isDemo) {
            const fallbackCats = localStorage.getItem('store_categories')
              ? JSON.parse(localStorage.getItem('store_categories')!)
              : INITIAL_CATEGORIES;
            for (const c of fallbackCats) {
              await setDoc(getStoreDoc('categories', c.id), { ...c, storeEmail: activeStoreEmail });
            }
            setCategories(fallbackCats);
          } else {
            const defaultCats = INITIAL_CATEGORIES;
            for (const c of defaultCats) {
              await setDoc(getStoreDoc('categories', c.id), { ...c, storeEmail: activeStoreEmail });
            }
            setCategories(defaultCats);
          }
        } else {
          const fetched: Category[] = [];
          catSnap.forEach(d => fetched.push(d.data() as Category));
          setCategories(fetched);
        }

        // 5. Suppliers
        const supSnap = await getDocs(getStoreCollection('suppliers'));
        const fetchedSups: Supplier[] = [];
        supSnap.forEach(d => fetchedSups.push(d.data() as Supplier));
        setSuppliers(fetchedSups);

        // 6. Sales
        const salesSnap = await getDocs(getStoreCollection('sales'));
        const fetchedSales: Sale[] = [];
        salesSnap.forEach(d => fetchedSales.push(d.data() as Sale));
        fetchedSales.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSales(fetchedSales);

        // 7. Supplier Purchases
        const purchaseSnap = await getDocs(getStoreCollection('supplierPurchases'));
        const fetchedPurchases: SupplierPurchase[] = [];
        purchaseSnap.forEach(d => fetchedPurchases.push(d.data() as SupplierPurchase));
        fetchedPurchases.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSupplierPurchases(fetchedPurchases);

        // 8. Cashier Sessions loaded via real-time onSnapshot listener (initialized above)

        // 9. Backups from secure subcollection
        try {
          const backupSnap = await getDoc(getStoreDoc('backups', 'sales_store_backup'));
          if (backupSnap.exists()) {
            const data = backupSnap.data();
            if (data && data.sales && data.sales.length > 0) {
              setBackupDate(data.backupDate || 'Reciente');
              setBackupExists(true);
              localStorage.setItem('store_sales_backup', JSON.stringify(data.sales));
              localStorage.setItem('store_sales_backup_date', data.backupDate || 'Reciente');
            }
          }
        } catch (e) {
          console.warn("No cloud backup found for this store.");
        }

        setIsLoadingData(false);
      } catch (err) {
        console.warn("Fallback local sync triggered due to load error:", err);
        // Fallback to local storage if Firestore load fails
        const localProds = localStorage.getItem('store_products');
        if (localProds) {
          try { setProducts(JSON.parse(localProds)); } catch (e) {}
        }
        const localEmps = localStorage.getItem('store_employees');
        if (localEmps) {
          try { setEmployees(JSON.parse(localEmps)); } catch (e) {}
        }
        const localCusts = localStorage.getItem('store_customers');
        if (localCusts) {
          try { setCustomers(JSON.parse(localCusts)); } catch (e) {}
        }
        const localCats = localStorage.getItem('store_categories');
        if (localCats) {
          try { setCategories(JSON.parse(localCats)); } catch (e) {}
        }
        const localSups = localStorage.getItem('store_suppliers');
        if (localSups) {
          try { setSuppliers(JSON.parse(localSups)); } catch (e) {}
        }
        const localSales = localStorage.getItem('store_sales');
        if (localSales) {
          try { setSales(JSON.parse(localSales)); } catch (e) {}
        }
        const localPurchases = localStorage.getItem('store_supplier_purchases');
        if (localPurchases) {
          try { setSupplierPurchases(JSON.parse(localPurchases)); } catch (e) {}
        }
        const localSessions = localStorage.getItem('store_cashier_sessions');
        if (localSessions) {
          try { setCashierSessions(JSON.parse(localSessions)); } catch (e) {}
        }
        setIsLoadingData(false);
      }
    }
    loadDataFromFirebase();
  }, [currentUser, activeStoreEmail, isPracticeMode]);

  // Save changes to localstorage when state updates
  useEffect(() => {
    if (isLoadingData) return;
    localStorage.setItem('store_products', JSON.stringify(products));
  }, [products, isLoadingData]);

  useEffect(() => {
    if (isLoadingData) return;
    localStorage.setItem('store_employees', JSON.stringify(employees));
  }, [employees, isLoadingData]);

  useEffect(() => {
    if (isLoadingData) return;
    localStorage.setItem('store_sales', JSON.stringify(sales));
  }, [sales, isLoadingData]);

  useEffect(() => {
    if (isLoadingData) return;
    localStorage.setItem('store_customers', JSON.stringify(customers));
  }, [customers, isLoadingData]);

  useEffect(() => {
    if (isLoadingData) return;
    localStorage.setItem('store_suppliers', JSON.stringify(suppliers));
  }, [suppliers, isLoadingData]);

  useEffect(() => {
    localStorage.setItem('store_subscription', JSON.stringify(subscription));
  }, [subscription]);

  useEffect(() => {
    localStorage.setItem('store_settings', JSON.stringify(storeSettings));
  }, [storeSettings]);

  // Synchronize personalized Store Settings when currentUser changes
  useEffect(() => {
    if (!currentUser || activeStoreEmail === 'global') return;

    async function syncUserSettings() {
      try {
        console.log("Sincronizando ajustes de tienda para:", activeStoreEmail);
        const docRef = doc(db, 'storeSettings', activeStoreEmail);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const fetchedSettings = docSnap.data() as StoreSettings;
          setStoreSettings(fetchedSettings);
        } else {
          // If first-time login for this license/email, construct defaults
          const emailLower = activeStoreEmail.toLowerCase();
          let initialName = 'Mi Nueva Tienda';
          let initialPhone = '+54 11 4455-6677';
          let initialAddr = 'Dirección Comercial 123, CABA, Argentina';
          
          if (emailLower === 'bigmax24h7@gmail.com') {
            initialName = 'BigMAX 24 Horas';
            initialPhone = '+54 11 7766-5544';
            initialAddr = 'Av. Pueyrredón 888, CABA, Argentina';
          } else if (emailLower === 'pezziniarg@gmail.com') {
            initialName = 'Max24 Express Belgrano';
            initialPhone = '+54 11 5566-7788';
            initialAddr = 'Av. Cabildo 2424, CABA, Argentina';
          }
          
          const newSettings: StoreSettings = {
            ...INITIAL_STORE_SETTINGS,
            name: initialName,
            phone: initialPhone,
            address: initialAddr,
            email: activeStoreEmail,
            isConfigured: false // This will trigger the Setup Wizard onboarding!
          };
          
          setStoreSettings(newSettings);
        }
      } catch (err) {
        console.warn("Could not load setting from firebase:", err);
      }
    }
    syncUserSettings();
  }, [currentUser, activeStoreEmail]);



  // Background self-healing check to make sure the logged-in Administrator is registered in 'storeOwners'
  useEffect(() => {
    async function alignStoreOwnersCollection() {
      if (!currentUser || currentUser.role !== 'Administrador' || currentUser.email === 'pezziniarg@gmail.com') return;
      
      try {
        const { getDocs, query, collection, where, setDoc, doc, getDoc } = await import('firebase/firestore');
        const emailToFind = currentUser.email.trim().toLowerCase();
        const ownerSnap = await getDocs(query(collection(db, 'storeOwners'), where('email', '==', emailToFind)));
        
        if (ownerSnap.empty) {
          console.log("Self-healing check: Adding missing Administrator to 'storeOwners' collection...");
          
          // Fetch store settings name if configured, otherwise use fallback name
          const settingsSnap = await getDoc(doc(db, 'storeSettings', emailToFind));
          const currentStoreName = settingsSnap.exists() ? (settingsSnap.data().name || 'Mi Nueva Tienda') : 'Mi Nueva Tienda';
          
          const newStoreId = `store-${Date.now()}`;
          const newStoreOwner = {
            id: newStoreId,
            ownerName: currentUser.name,
            storeName: currentStoreName,
            email: emailToFind,
            plan: 'Gratuito',
            status: 'Activo',
            registeredDate: currentUser.joinedDate || new Date().toISOString().split('T')[0],
            notes: 'Sincronizado de forma reactiva en el ciclo de vida del App.'
          };
          
          await setDoc(doc(db, 'storeOwners', newStoreId), newStoreOwner);
          
          // Add to local storage backup list too
          const savedStr = localStorage.getItem('saas_registered_store_owners');
          if (savedStr) {
            const parsed = JSON.parse(savedStr);
            if (!parsed.some((o: any) => o.email === emailToFind)) {
              parsed.push(newStoreOwner);
              localStorage.setItem('saas_registered_store_owners', JSON.stringify(parsed));
            }
          }
        }
      } catch (err) {
        console.warn("Retrospective store synchronization failure during active session alignment:", err);
      }
    }
    
    // Wait a brief delay after component mounts to let Firebase initialize fully
    const timer = setTimeout(() => {
      alignStoreOwnersCollection();
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('store_categories', JSON.stringify(categories));
  }, [categories]);

  // Customer handlers
  const handleAddCustomer = (newCust: Omit<Customer, 'id'>) => {
    const newId = `cust-${Date.now()}`;
    const added: Customer = { ...newCust, id: newId, storeEmail: activeStoreEmail, isPracticeMode: isPracticeMode ? true : undefined } as any;
    setCustomers(prev => [...prev, added]);
    
    if (!isPracticeMode) {
      try {
        const cleanAdded = JSON.parse(JSON.stringify(added));
        setDoc(getStoreDoc('customers', newId), cleanAdded).catch(err => console.error("Firebase error writing customer", err));
      } catch (e) {
        console.error("Firestore customer serialization error:", e);
      }
    }
    return added;
  };

  const handleUpdateCustomer = (updatedCust: Customer) => {
    const isPracticeItem = (updatedCust as any).isPracticeMode || isPracticeMode;
    const payload = isPracticeItem ? { ...updatedCust, isPracticeMode: true } : updatedCust;
    setCustomers(prev => prev.map(c => c.id === updatedCust.id ? payload : c));
    
    if (!isPracticeItem) {
      try {
        const cleanUpdated = JSON.parse(JSON.stringify(updatedCust));
        setDoc(getStoreDoc('customers', updatedCust.id), cleanUpdated).catch(err => console.error("Firebase error updating customer", err));
      } catch (e) {
        console.error("Firestore customer update serialization error:", e);
      }
    }
  };

  const handleDeleteCustomer = (id: string) => {
    const target = customers.find(c => c.id === id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    if (target && !(target as any).isPracticeMode) {
      deleteDoc(getStoreDoc('customers', id)).catch(err => console.error("Firebase error deleting customer", err));
    }
  };

  // Supplier CRUD
  const handleAddSupplier = (newSup: Omit<Supplier, 'id'>) => {
    const id = `sup-${Date.now()}`;
    const added = { ...newSup, id, storeEmail: activeStoreEmail };
    setSuppliers(prev => [...prev, added]);
    try {
      const cleanAdded = JSON.parse(JSON.stringify(added));
      setDoc(getStoreDoc('suppliers', id), cleanAdded).catch(err => console.error("Firebase error writing supplier", err));
    } catch (e) {
      console.error("Firestore supplier serialization error:", e);
    }
  };

  const handleUpdateSupplier = (updatedSup: Supplier) => {
    setSuppliers(prev => prev.map(s => s.id === updatedSup.id ? updatedSup : s));
    try {
      const cleanUpdated = JSON.parse(JSON.stringify(updatedSup));
      setDoc(getStoreDoc('suppliers', updatedSup.id), cleanUpdated).catch(err => console.error("Firebase error updating supplier", err));
    } catch (e) {
      console.error("Firestore supplier update serialization error:", e);
    }
  };

  const handleDeleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    deleteDoc(getStoreDoc('suppliers', id)).catch(err => console.error("Firebase error deleting supplier", err));
  };

  // Product CRUD
  const handleAddProduct = (newProd: Omit<Product, 'id'>) => {
    const id = `prod-${Date.now()}`;
    const added = { ...newProd, id, storeEmail: activeStoreEmail, isPracticeMode: isPracticeMode ? true : undefined } as any;
    setProducts([...products, added]);
    if (!isPracticeMode) {
      try {
        const cleanAdded = JSON.parse(JSON.stringify(added));
        setDoc(getStoreDoc('products', id), cleanAdded).catch(err => console.error("Firebase error writing product", err));
      } catch (e) {
        console.error("Firestore product serialization error:", e);
      }
    }
  };

  const handleUpdateProduct = (updatedProd: Product) => {
    const isPracticeItem = (updatedProd as any).isPracticeMode || isPracticeMode;
    const payload = isPracticeItem ? { ...updatedProd, isPracticeMode: true } : updatedProd;
    setProducts(products.map(p => p.id === updatedProd.id ? payload : p));
    if (!isPracticeItem) {
      try {
        const cleanUpdated = JSON.parse(JSON.stringify(updatedProd));
        setDoc(getStoreDoc('products', updatedProd.id), cleanUpdated).catch(err => console.error("Firebase error updating product", err));
      } catch (e) {
        console.error("Firestore product update serialization error:", e);
      }
    }
  };

  const handleDeleteProduct = (id: string) => {
    const target = products.find(p => p.id === id);
    setProducts(products.filter(p => p.id !== id));
    if (target && !(target as any).isPracticeMode) {
      deleteDoc(getStoreDoc('products', id)).catch(err => console.error("Firebase error deleting product", err));
    }
  };

  const handleImportProducts = async (importedList: Omit<Product, 'id'>[], onProgress?: (percent: number) => void) => {
    const updatedProducts = [...products];
    const total = importedList.length;
    let count = 0;

    for (const p of importedList) {
      // Find if product with same SKU already exists for this activeStoreEmail
      const existingIdx = p.sku ? updatedProducts.findIndex(existing => existing.sku.trim().toUpperCase() === p.sku.trim().toUpperCase() && (existing.storeEmail || '').trim().toLowerCase() === activeStoreEmail.trim().toLowerCase()) : -1;
      
      const id = existingIdx !== -1 ? updatedProducts[existingIdx].id : `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const completedProduct: Product = {
        ...p,
        id,
        storeEmail: activeStoreEmail
      };

      if (existingIdx !== -1) {
        updatedProducts[existingIdx] = completedProduct;
      } else {
        updatedProducts.push(completedProduct);
      }

      try {
        const cleanProd = JSON.parse(JSON.stringify(completedProduct));
        await setDoc(getStoreDoc('products', id), cleanProd);
      } catch (err) {
        console.error("Error importing single product:", err);
      }

      count++;
      if (onProgress) {
        onProgress(Math.round((count / total) * 100));
      }
    }

    setProducts(updatedProducts);
    localStorage.setItem('store_products', JSON.stringify(updatedProducts));
  };

  // Category CRUD
  const handleAddCategory = (newCat: Omit<Category, 'id'>) => {
    const id = `cat-${Date.now()}`;
    const added = { ...newCat, id, storeEmail: activeStoreEmail };
    setCategories([...categories, added]);
    try {
      const cleanAdded = JSON.parse(JSON.stringify(added));
      setDoc(getStoreDoc('categories', id), cleanAdded).catch(err => console.error("Firebase error writing category", err));
    } catch (e) {
      console.error("Firestore category serialization error:", e);
    }
  };

  const handleUpdateCategory = (updatedCat: Category) => {
    setCategories(categories.map(c => c.id === updatedCat.id ? updatedCat : c));
    try {
      const cleanUpdated = JSON.parse(JSON.stringify(updatedCat));
      setDoc(getStoreDoc('categories', updatedCat.id), cleanUpdated).catch(err => console.error("Firebase error updating category", err));
    } catch (e) {
      console.error("Firestore category update serialization error:", e);
    }
  };

  const handleDeleteCategory = (id: string) => {
    // Delete the category itself
    setCategories(categories.filter(c => c.id !== id));
    deleteDoc(getStoreDoc('categories', id)).catch(err => console.error("Firebase error deleting category", err));
    // Re-assign products of that category to Alimentos or any first active category
    const defaultCatName = categories[0]?.name || 'Alimentos';
    setProducts(products.map(p => {
      const match = categories.find(c => c.id === id);
      if (match && p.category === match.name) {
        const u = { ...p, category: defaultCatName };
        setDoc(getStoreDoc('products', p.id), u).catch(err => console.error("Firebase error updating product category", err));
        return u;
      }
      return p;
    }));
  };

  // Employee CRUD
  const handleAddEmployee = (newEmp: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    const added = { ...newEmp, id, storeEmail: activeStoreEmail };
    setEmployees([...employees, added]);
    try {
      const cleanAdded = JSON.parse(JSON.stringify(added));
      setDoc(doc(db, 'employees', id), cleanAdded).catch(err => console.error("Firebase error writing global employee", err));
      setDoc(getStoreDoc('employees', id), cleanAdded).catch(err => console.error("Firebase error writing store employee", err));
    } catch (e) {
      console.error("Firestore employee serialization error:", e);
    }
  };

  const handleUpdateEmployee = (updatedEmp: Employee) => {
    const payload = { ...updatedEmp, storeEmail: activeStoreEmail };
    setEmployees(employees.map(e => e.id === updatedEmp.id ? payload : e));
    try {
      const cleanPayload = JSON.parse(JSON.stringify(payload));
      setDoc(doc(db, 'employees', updatedEmp.id), cleanPayload).catch(err => console.error("Firebase error updating global employee", err));
      setDoc(getStoreDoc('employees', updatedEmp.id), cleanPayload).catch(err => console.error("Firebase error updating store employee", err));
    } catch (e) {
      console.error("Firestore employee update serialization error:", e);
    }
    // If the currently logged in user is being updated, sync back their session data
    if (currentUser && currentUser.id === updatedEmp.id) {
      setCurrentUser(payload);
      localStorage.setItem('currentUser', JSON.stringify(payload));
    }
  };

  const handleAddSupplierPurchase = async (newPurchase: Omit<SupplierPurchase, 'id' | 'storeEmail'>) => {
    const purchaseId = `pur-${Date.now()}`;
    const purchase: SupplierPurchase = {
      ...newPurchase,
      id: purchaseId,
      storeEmail: activeStoreEmail
    };

    // Increment stock level for each matching product
    const nextProducts = products.map(prod => {
      const receivedItem = purchase.items.find(item => item.productId === prod.id);
      if (receivedItem) {
        const cleanStock = Number(prod.stock || 0) + Number(receivedItem.quantity || 0);
        return {
          ...prod,
          stock: cleanStock
        };
      }
      return prod;
    });

    setProducts(nextProducts);
    setSupplierPurchases(prev => [purchase, ...prev]);

    try {
      await setDoc(getStoreDoc('supplierPurchases', purchaseId), purchase);
      for (const item of purchase.items) {
        const matchingProduct = nextProducts.find(p => p.id === item.productId);
        if (matchingProduct) {
          await setDoc(getStoreDoc('products', matchingProduct.id), matchingProduct);
        }
      }
    } catch (err) {
      console.error("Firebase error registering supplier purchase:", err);
    }
  };

  const handleRecordEmployeePayment = async (employeeId: string, amount: number, notes: string, method: string) => {
    const paymentId = `pay-${Date.now()}`;
    const payment = {
      id: paymentId,
      date: new Date().toISOString(),
      amount,
      notes,
      method,
      ownerConfirmed: false,
      employeeConfirmed: false
    };

    const nextEmployees = employees.map(emp => {
      if (emp.id === employeeId) {
        const currentPaid = emp.paidWages || 0;
        const history = emp.paymentsHistory || [];
        return {
          ...emp,
          paidWages: currentPaid + amount,
          paymentsHistory: [payment, ...history]
        };
      }
      return emp;
    });

    setEmployees(nextEmployees);

    const updatedEmployee = nextEmployees.find(e => e.id === employeeId);
    if (updatedEmployee) {
      try {
        await setDoc(doc(db, 'employees', employeeId), JSON.parse(JSON.stringify(updatedEmployee)));
        await setDoc(getStoreDoc('employees', employeeId), JSON.parse(JSON.stringify(updatedEmployee)));
      } catch (err) {
        console.error("Firebase error updating employee payment stats:", err);
      }
    }
  };

  const handleConfirmPaymentByEmployee = async (paymentId: string) => {
    if (!currentUser) return;

    const updatedHistory = (currentUser.paymentsHistory || []).map(p => {
      if (p.id === paymentId) {
        return {
          ...p,
          employeeConfirmed: true,
          employeeConfirmedAt: new Date().toISOString()
        };
      }
      return p;
    });

    const updatedUser = {
      ...currentUser,
      paymentsHistory: updatedHistory
    };

    setCurrentUser(updatedUser);
    localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    setEmployees(prev => prev.map(e => e.id === currentUser.id ? updatedUser : e));

    try {
      const cleanUser = JSON.parse(JSON.stringify(updatedUser));
      await setDoc(doc(db, 'employees', currentUser.id), cleanUser);
      await setDoc(getStoreDoc('employees', currentUser.id), cleanUser);
    } catch (err) {
      console.error("Error confirming payment by employee:", err);
    }
  };

  const handleAddCashierSession = async (newSession: Omit<CashierSession, 'id'>) => {
    // Check if employee already has an active or pending session to prevent duplicates
    const existing = cashierSessions.find(s => 
      s.employeeId === newSession.employeeId && 
      (s.status === 'autorizado' || s.status === 'esperando_autorizacion')
    );
    if (existing) {
      console.warn("An active or pending session already exists for this employee. Returning existing.");
      return existing;
    }

    const sessionId = `ses-${Date.now()}`;
    const session: CashierSession = {
      ...newSession,
      id: sessionId
    };

    setCashierSessions(prev => [session, ...prev]);

    try {
      await setDoc(getStoreDoc('cashierSessions', sessionId), JSON.parse(JSON.stringify(session)));
    } catch (err) {
      console.error("Firebase error registering cashier session:", err);
    }
    return session;
  };

  const handleUpdateSessionStatus = async (sessionId: string, nextStatus: 'autorizado' | 'cerrado', closeCash?: number, wageAccrued?: number, hoursWorked?: number) => {
    const targetSession = cashierSessions.find(s => s.id === sessionId);

    // If we are authorizing this session, auto-close all other pending/active sessions for this employee to prevent duplicates!
    if (nextStatus === 'autorizado' && targetSession) {
      const otherSessionsToClose = cashierSessions.filter(s => 
        s.employeeId === targetSession.employeeId && 
        s.id !== sessionId && 
        (s.status === 'autorizado' || s.status === 'esperando_autorizacion')
      );
      
      for (const oldSess of otherSessionsToClose) {
        const closedSess = {
          ...oldSess,
          status: 'cerrado' as const,
          closeTime: new Date().toISOString(),
          closeCash: 0,
          wageAccrued: 0
        };
        await setDoc(getStoreDoc('cashierSessions', oldSess.id), JSON.parse(JSON.stringify(closedSess))).catch(console.error);
      }
    }

    const nextSessions = cashierSessions.map(session => {
      if (session.id === sessionId) {
        return {
          ...session,
          status: nextStatus,
          closeTime: nextStatus === 'cerrado' ? new Date().toISOString() : undefined,
          closeCash: closeCash !== undefined ? closeCash : session.closeCash,
          wageAccrued: wageAccrued !== undefined ? wageAccrued : session.wageAccrued
        };
      }
      // If we auto-closed it above, ensure local state reflects that too!
      if (nextStatus === 'autorizado' && targetSession && session.employeeId === targetSession.employeeId && session.id !== sessionId && (session.status === 'autorizado' || session.status === 'esperando_autorizacion')) {
        return {
          ...session,
          status: 'cerrado' as const,
          closeTime: new Date().toISOString(),
          closeCash: 0,
          wageAccrued: 0
        };
      }
      return session;
    });

    setCashierSessions(nextSessions);

    // If it was closed, we must add the wageAccrued directly to the employee's accruedWages debt pool!
    if (nextStatus === 'cerrado' && targetSession && wageAccrued) {
      const targetEmp = employees.find(e => e.id === targetSession.employeeId);
      if (targetEmp) {
        const updatedEmp = {
          ...targetEmp,
          accruedWages: (targetEmp.accruedWages || 0) + wageAccrued
        };
        setEmployees(prev => prev.map(e => e.id === updatedEmp.id ? updatedEmp : e));
        await setDoc(doc(db, 'employees', updatedEmp.id), JSON.parse(JSON.stringify(updatedEmp))).catch(console.error);
        await setDoc(getStoreDoc('employees', updatedEmp.id), JSON.parse(JSON.stringify(updatedEmp))).catch(console.error);
      }
    }

    const updatedSession = nextSessions.find(s => s.id === sessionId);
    if (updatedSession) {
      try {
        await setDoc(getStoreDoc('cashierSessions', sessionId), JSON.parse(JSON.stringify(updatedSession)));
      } catch (err) {
        console.error("Firebase error updating cashier session status:", err);
      }
    }
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
    deleteDoc(doc(db, 'employees', id)).catch(err => console.error("Firebase error deleting global employee", err));
    deleteDoc(getStoreDoc('employees', id)).catch(err => console.error("Firebase error deleting store employee", err));
    // If current logged-in user is self-deleted, force logout
    if (currentUser?.id === id) {
      handleLogout();
    }
  };

  const handleConsolidateSessions = async () => {
    const activeOrPending = cashierSessions.filter(s => s.status === 'autorizado' || s.status === 'esperando_autorizacion');
    const grouped: { [empId: string]: CashierSession[] } = {};
    activeOrPending.forEach(s => {
      if (!grouped[s.employeeId]) grouped[s.employeeId] = [];
      grouped[s.employeeId].push(s);
    });

    let fixedCount = 0;
    for (const empId of Object.keys(grouped)) {
      const list = grouped[empId];
      if (list.length > 1) {
        // Sort by openTime: newest first
        list.sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
        // Keep the newest session (preferably the 'autorizado' one if it exists)
        const authorizedList = list.filter(s => s.status === 'autorizado');
        const newestToKeep = authorizedList.length > 0 ? authorizedList[0] : list[0];
        
        const duplicates = list.filter(s => s.id !== newestToKeep.id);
        for (const duplicate of duplicates) {
          const closedSess = {
            ...duplicate,
            status: 'cerrado' as const,
            closeTime: new Date().toISOString(),
            closeCash: 0,
            wageAccrued: 0
          };
          await setDoc(getStoreDoc('cashierSessions', duplicate.id), JSON.parse(JSON.stringify(closedSess))).catch(console.error);
          fixedCount++;
        }
      }
    }
    return fixedCount;
  };

  // State update callbacks
  const handleUpdateSettings = (settings: StoreSettings) => {
    setStoreSettings(settings);
    const docId = (currentUser && currentUser.email) ? currentUser.email : 'global';
    try {
      // Sanitize undefined fields so Firestore doesn't throw an error
      const cleanSettings = JSON.parse(JSON.stringify(settings));
      setDoc(doc(db, 'storeSettings', docId), cleanSettings)
        .then(async () => {
          // Also update the storeName inside the storeOwners collection matching this owner's email
          if (currentUser && currentUser.role === 'Administrador' && currentUser.email !== 'pezziniarg@gmail.com') {
            const emailToFind = currentUser.email.trim().toLowerCase();
            const { getDocs, query, collection, where, updateDoc, setDoc, doc } = await import('firebase/firestore');
            const ownerSnap = await getDocs(query(collection(db, 'storeOwners'), where('email', '==', emailToFind)));
            if (!ownerSnap.empty) {
              ownerSnap.forEach(async (docRef) => {
                await updateDoc(docRef.ref, { storeName: settings.name, ownerName: currentUser.name });
              });
            } else {
              // Create on the fly if missing
              const newStoreId = `store-${Date.now()}`;
              const newStoreOwner = {
                id: newStoreId,
                ownerName: currentUser.name,
                storeName: settings.name,
                email: emailToFind,
                plan: 'Gratuito',
                status: 'Activo',
                registeredDate: new Date().toISOString().split('T')[0],
                notes: 'Creado de emergencia mediante asistente de configuración.'
              };
              await setDoc(doc(db, 'storeOwners', newStoreId), newStoreOwner);
            }
          }
        })
        .catch(err => {
          console.error("Firebase error writing store settings", err);
          alert("Error al sincronizar con la nube (Firebase): " + (err instanceof Error ? err.message : String(err)));
        });
    } catch (err) {
      console.error("Synchronous error during Firestore write:", err);
      alert("Error local al escribir configuración: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    if (isNativePlatform) {
      Preferences.remove({ key: 'currentUser' }).catch(console.error);
      setShowLogin(true);
    }
    localStorage.removeItem('is_simulating_shop');
    localStorage.removeItem('simulated_store_email');
    localStorage.removeItem('current_tab');
    localStorage.removeItem('is_practice_mode');
    setIsPracticeMode(false);
    setIsSimulatingShop(false);
    setSimulatedStoreEmail(null);
    setCurrentTab('pos');
  };

  const handleRegisterAdmin = (newAdmin: Omit<Employee, 'id'>) => {
    const id = `emp-${Date.now()}`;
    const adminWithId = { ...newAdmin, id };
    setEmployees([...employees, adminWithId]);
    setDoc(doc(db, 'employees', id), adminWithId).catch(err => console.error("Firebase error registering admin", err));

    // Also register this new client store in the storeOwners collection
    const storeId = `store-${Date.now()}`;
    const newStoreOwner = {
      id: storeId,
      ownerName: newAdmin.name,
      storeName: 'Mi Nueva Tienda',
      email: newAdmin.email.trim().toLowerCase(),
      plan: 'Gratuito',
      status: 'Activo',
      registeredDate: new Date().toISOString().split('T')[0],
      notes: 'Registrado desde el portal de alta de comercio.'
    };
    setDoc(doc(db, 'storeOwners', storeId), newStoreOwner).catch(err => console.error("Firebase error registering store owner", err));

    // Update local storage backup
    const saved = localStorage.getItem('saas_registered_store_owners');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        parsed.push(newStoreOwner);
        localStorage.setItem('saas_registered_store_owners', JSON.stringify(parsed));
      } catch (e) {
        console.error("Local storage sync error", e);
      }
    } else {
      localStorage.setItem('saas_registered_store_owners', JSON.stringify([newStoreOwner]));
    }
  };

  // Registering POS Sale
  const handleRegisterSale = (
    cartItems: { productId: string; quantity: number }[],
    discountPercent: number,
    paymentMethod: Sale['paymentMethod'],
    cashReceived: number,
    sellerId: string,
    customer?: Customer,
    includeIva: boolean = false,
    afipFields?: Partial<Sale>
  ): Sale => {
    const sellerObj = employees.find(e => e.id === sellerId);
    const sellerName = sellerObj ? sellerObj.name : 'Vendedor Anónimo';

    // Verify stock availability
    for (const item of cartItems) {
      const prod = products.find(p => p.id === item.productId);
      if (!prod) {
        throw new Error(`El producto con ID ${item.productId} ya no está disponible en la base de datos.`);
      }
      if (prod.stock < item.quantity) {
        throw new Error(`Stock insuficiente para ${prod.name}. Quedan solamente ${prod.stock} ${prod.unit}.`);
      }
    }

    // Prepare item list details for invoice records
    const registeredItems = cartItems.map(item => {
      const prodObj = products.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        productName: prodObj.name,
        quantity: item.quantity,
        price: prodObj.price
      };
    });

    // Calculate billing Math
    const subtotal = registeredItems.reduce((acc, i) => acc + (i.price * i.quantity), 0);
    const discount = Math.round((subtotal * discountPercent) / 100);
    const tax = includeIva ? Math.round((subtotal - discount) * 0.21) : 0;
    const total = subtotal - discount;
    const change = paymentMethod === 'Efectivo' ? (cashReceived - total) : 0;

    const newSale: Sale = {
      id: `V-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      items: registeredItems,
      subtotal,
      discount,
      tax,
      total,
      paymentMethod,
      cashReceived: paymentMethod === 'Efectivo' ? cashReceived : total,
      change: change > 0 ? change : 0,
      sellerId,
      sellerName,
      customer,
      isPracticeMode: isPracticeMode ? true : undefined,
      ...afipFields
    } as any;

    // If "Cuenta Corriente" is used, handle updating the customer debt balance
    // and logging the ledger transaction
    if (paymentMethod === 'Cuenta Corriente') {
      if (!customer) {
        throw new Error('Debe especificar un cliente obligatorio para compras bajo la modalidad de Cuenta Corriente.');
      }
      // Update customer balance to reflect the new purchase amount
      const currentBalance = customer.debtBalance ?? 0;
      const updatedCust: Customer = {
        ...customer,
        debtBalance: currentBalance + total,
        isPracticeMode: isPracticeMode ? true : undefined
      } as any;
      handleUpdateCustomer(updatedCust);

      // Add a ledger/debt transaction under 'store_debt_transactions' for Debts tracking compatibility
      const newTx: DebtTransaction = {
        id: `TX-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        customerId: customer.id,
        customerName: customer.name,
        type: 'deuda',
        amount: total,
        date: new Date().toISOString().slice(0, 10),
        concept: `Compra POS - Venta #${newSale.id}`,
        isPracticeMode: isPracticeMode ? true : undefined
      } as any;
      
      if (!isPracticeMode) {
        try {
          const savedTxs = localStorage.getItem('store_debt_transactions');
          const txsList = savedTxs ? JSON.parse(savedTxs) : [];
          txsList.push(newTx);
          localStorage.setItem('store_debt_transactions', JSON.stringify(txsList));
        } catch (e) {
          console.error('Error al guardar la transacción de cuenta corriente:', e);
        }
      }
    }

    // Deduct stock levels from global state
    const nextProducts = products.map(prod => {
      const itemSold = cartItems.find(item => item.productId === prod.id);
      if (itemSold) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - itemSold.quantity),
          isPracticeMode: (prod as any).isPracticeMode || (isPracticeMode ? true : undefined)
        };
      }
      return prod;
    });

    setProducts(nextProducts);

    // Add sale to history list
    setSales(prevSales => [newSale, ...prevSales]);

    // Handle Firestore background synchronization outside state updaters securely
    if (!isPracticeMode) {
      try {
        // JSON cleaning removes any fields that are undefined, which would crash the Firestore SDK setDoc synchronously
        const cleanSale = JSON.parse(JSON.stringify(newSale));
        setDoc(getStoreDoc('sales', newSale.id), cleanSale)
          .catch(err => console.error("Firebase error writing sale record", err));

        cartItems.forEach(item => {
          const prodMatch = nextProducts.find(p => p.id === item.productId);
          if (prodMatch) {
            const cleanProduct = JSON.parse(JSON.stringify(prodMatch));
            setDoc(getStoreDoc('products', prodMatch.id), cleanProduct)
              .catch(err => console.error("Firebase error updating product stock", err));
          }
        });
      } catch (e) {
        console.error("Firestore serialization sync error:", e);
      }
    }

    return newSale;
  };

  const handleClearSales = async () => {
    if (!currentUser || currentUser.role !== 'Administrador') {
      alert("No tienes permisos suficientes. Solo el dueño del comercio con rol Administrador puede realizar esta acción.");
      return;
    }

    // Save backing date
    const currentDateStr = new Date().toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });

    // 1. Create backup object with current sales
    const backupObj = {
      sales: sales,
      backupDate: currentDateStr,
      timestamp: Date.now()
    };

    // 2. Local fallback storage
    localStorage.setItem('store_sales_backup', JSON.stringify(sales));
    localStorage.setItem('store_sales_backup_date', currentDateStr);
    setBackupExists(true);
    setBackupDate(currentDateStr);

    // 3. Firestore cloud storage backup doc
    try {
      await setDoc(getStoreDoc('backups', 'sales_store_backup'), backupObj);
      console.log("Copia de seguridad del reporte respaldada en Firestore Nube.");
    } catch (e) {
      console.warn("No se pudo escribir la copia de seguridad de reporte en Firestore:", e);
    }

    // 4. Update memory & sync active sales state to empty
    setSales([]);
    localStorage.setItem('store_sales', JSON.stringify([]));

    // 5. Delete actual documents from the active sales collection
    try {
      const salesSnap = await getDocs(getStoreCollection('sales'));
      if (!salesSnap.empty) {
        const promises = salesSnap.docs.map(item => deleteDoc(item.ref));
        await Promise.all(promises);
      }
      console.log("Historial de ventas activas vaciado con éxito en la nube de Firestore.");
    } catch (err) {
      console.warn("No se pudo vaciar la colección activa de Firestore. Cambios guardados de forma local:", err);
    }
  };

  const handleRestoreSales = async () => {
    if (!currentUser || currentUser.role !== 'Administrador') {
      alert("No tienes permisos suficientes.");
      return;
    }

    let restoredSales: Sale[] = [];

    // Fallback LocalStorage parsed content
    const localStr = localStorage.getItem('store_sales_backup');
    if (localStr) {
      try {
        restoredSales = JSON.parse(localStr);
      } catch (e) {
        console.error("Error parsing local reports backup", e);
      }
    }

    // Direct Firestore fetch
    try {
      const backupSnap = await getDoc(getStoreDoc('backups', 'sales_store_backup'));
      if (backupSnap.exists()) {
        const data = backupSnap.data();
        if (data && data.sales && data.sales.length > 0) {
          restoredSales = data.sales;
        }
      }
    } catch (err) {
      console.warn("Error al recuperar backup desde Firestore, usando localStorage si existe:", err);
    }

    if (!restoredSales || restoredSales.length === 0) {
      alert("No se encontró ningún respaldo elegible para recuperar.");
      return;
    }

    // Restore to state and local storage
    setSales(restoredSales);
    localStorage.setItem('store_sales', JSON.stringify(restoredSales));

    // Re-create the Firebase sales records
    try {
      const promises = restoredSales.map(item => {
        const cleanSale = JSON.parse(JSON.stringify(item));
        return setDoc(getStoreDoc('sales', item.id), cleanSale);
      });
      await Promise.all(promises);
      console.log("Sincronización de restauración completada en Firestore.");
    } catch (err) {
      console.error("Error restaurando ventas activas en Firestore:", err);
    }

    // Clear backups since they are restored
    localStorage.removeItem('store_sales_backup');
    localStorage.removeItem('store_sales_backup_date');
    setBackupExists(false);
    setBackupDate('');

    try {
      await deleteDoc(getStoreDoc('backups', 'sales_store_backup'));
    } catch (e) {
      console.warn("Error borrando backup recuperado de Firestore", e);
    }

    alert("¡Reporte e historial de ventas del comercio recuperado con éxito!");
  };

  // Subscription payment updates
  const handleUpdateSubscription = (plan: Subscription['plan'], price: number) => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 30);
    const nextFormatted = targetDate.toISOString().split('T')[0];

    setSubscription({
      plan,
      price,
      status: 'Activo',
      nextBillingDate: nextFormatted
    });
  };

  // Render correct tab interface body segment
  const renderTabContent = () => {
    switch (currentTab) {
      case 'pos':
        // If logged in user is a cashier, check if they have active and authorized cashier sessions
        if (currentUser && currentUser.role === 'Cajero') {
          const activeSession = cashierSessions.find(s => s.employeeId === currentUser.id && s.status === 'autorizado');
          const pendingSession = cashierSessions.find(s => s.employeeId === currentUser.id && s.status === 'esperando_autorizacion');

          if (!activeSession) {
            return (
              <div className="flex flex-col items-center justify-center min-h-[75vh] p-4 font-sans text-left max-w-lg mx-auto" id="pos-cashier-shift-guard">
                <div className="w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500 to-transparent" />
                  
                  {pendingSession ? (
                    <div className="space-y-5 text-center">
                      <div className="inline-flex p-3 bg-amber-550/10 border border-amber-500/20 rounded-2xl text-amber-500 animate-pulse">
                        <ShieldEllipsis className="w-8 h-8" />
                      </div>
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-black text-white">Sesión de Caja Pendiente</h3>
                        <p className="text-xs text-slate-400">
                          Tu solicitud de apertura de turno ({pendingSession.shift || 'N/A'}) con un saldo inicial de{' '}
                          <strong className="text-white">${(pendingSession.initialCash || 0).toLocaleString('es-AR')}</strong> se registró el{' '}
                          {new Date(pendingSession.openTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}.
                        </p>
                      </div>

                      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-left">
                        <p className="text-[11px] text-slate-405 leading-relaxed font-semibold">
                          Por favor, notifique al Administrador o Encargado para que apruebe su acceso en línea desde la sección excel de su panel de personal.
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 pt-2">
                        <a
                          href={`https://wa.me/?text=Hola+Gerente,+he+solicitado+la+apertura+de+caja+para+mi+turno+de+${pendingSession.shift || 'N/A'}+con+un+fondo+inicial+de+%24${pendingSession.initialCash || 0}.+Por+favor+autor%C3%ADzame+en+la+secci%C3%B3n+de+Personal.+Gracias!`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg cursor-pointer transition-colors"
                        >
                          Notificar por WhatsApp
                        </a>

                        {/* Practical Demo Bypass */}
                        <button
                          type="button"
                          onClick={() => handleUpdateSessionStatus(pendingSession.id, 'autorizado')}
                          className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-colors border border-slate-700"
                        >
                          Auto-Aprobar Ingreso (Modo Simulador)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      <div className="space-y-1 text-center">
                        <div className="inline-flex p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 mb-3">
                          <Building2 className="w-8 h-8" />
                        </div>
                        <h3 className="text-lg font-black text-white">Turno de Caja Cerrado</h3>
                        <p className="text-xs text-slate-400">Debes solicitar autorización de un Encargado para iniciar la facturación.</p>
                      </div>

                      <div className="pt-2 space-y-4 border-t border-slate-800">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-350">Monto Inicial en Efectivo ($)</label>
                          <input
                            type="number"
                            className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-650"
                            placeholder="Monto inicial de cambio"
                            value={initialCashText}
                            onChange={(e) => setInitialCashText(e.target.value)}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-350">Turno de Trabajo</label>
                          <select
                            className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                            value={selectedShiftStr}
                            onChange={(e) => setSelectedShiftStr(e.target.value)}
                          >
                            <option value="Mañana">Mañana</option>
                            <option value="Tarde">Tarde</option>
                            <option value="Noche">Noche</option>
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            handleAddCashierSession({
                              employeeId: currentUser.id,
                              employeeName: currentUser.name,
                              openTime: new Date().toISOString(),
                              status: 'esperando_autorizacion',
                              initialCash: Number(initialCashText) || 0,
                              salesCount: 0,
                              salesTotal: 0,
                              salesByMethod: {},
                              debtPaymentsCollected: 0,
                              hourlyRate: currentUser.hourlyRate || 0,
                              storeEmail: currentUser.storeEmail || 'global',
                              shift: selectedShiftStr
                            });
                          }}
                          className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-lg transition-all"
                        >
                          Solicitar Apertura de Caja
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }
        }

        return (
          <POS 
            products={products} 
            employees={employees} 
            onRegisterSale={handleRegisterSale}
            currentUser={currentUser}
            storeSettings={storeSettings}
            customers={customers}
            onAddCustomer={handleAddCustomer}
          />
        );
      case 'comidas':
        return (
          <Comidas 
            subscription={subscription}
            onUpdateSubscription={handleUpdateSubscription}
            currentUser={currentUser}
            activeStoreEmail={activeStoreEmail}
          />
        );
      case 'inventory':
        return (
          <Inventory 
            products={products}
            categories={categories}
            suppliers={suppliers}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAddCategory={handleAddCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onImportProducts={handleImportProducts}
          />
        );
      case 'customers':
        return (
          <Customers 
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
          />
        );
      case 'debts':
        return (
          <Debts 
            customers={customers}
            onUpdateCustomer={handleUpdateCustomer}
            currentUser={currentUser}
          />
        );
      case 'calendar':
        return (
          <CalendarComponent 
            currentUser={currentUser}
            activeStoreEmail={activeStoreEmail}
            products={products}
            suppliers={suppliers}
          />
        );
      case 'suppliers':
        return (
          <Suppliers 
            suppliers={suppliers}
            onAddSupplier={handleAddSupplier}
            onUpdateSupplier={handleUpdateSupplier}
            onDeleteSupplier={handleDeleteSupplier}
            products={products}
            supplierPurchases={supplierPurchases}
            onAddSupplierPurchase={handleAddSupplierPurchase}
            storeSettings={storeSettings}
          />
        );
      case 'employees':
        return (
          <Employees 
            employees={employees}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            cashierSessions={cashierSessions}
            onUpdateSessionStatus={handleUpdateSessionStatus}
            onRecordEmployeePayment={handleRecordEmployeePayment}
            onAddCashierSession={handleAddCashierSession}
            storeSettings={storeSettings}
            onConsolidateSessions={handleConsolidateSessions}
          />
        );
      case 'reports':
        return (
          <Reports 
            sales={sales} 
            products={products} 
            currentUser={currentUser}
            onClearSales={handleClearSales}
            backupExists={backupExists}
            backupDate={backupDate}
            onRestoreSales={handleRestoreSales}
            storeSettings={storeSettings}
            activeStoreEmail={activeStoreEmail}
          />
        );
      case 'online_sales':
        return (
          <OnlineSales 
            activeStoreEmail={activeStoreEmail} 
            sales={sales}
            onUpdateSaleStatus={(saleId, newStatus) => {
              // Update sales list in memory to keep things synced
              setSales(prev => prev.map(s => s.id === saleId ? { ...s, status: newStatus } : s));
            }}
          />
        );
      case 'settings':
        return (
          <Settings 
            settings={storeSettings}
            onUpdateSettings={handleUpdateSettings}
            currentUserEmail={currentUser?.email || ''}
          />
        );
      case 'subscription':
        return (
          <SubscriptionsApp 
            subscription={subscription} 
            onUpdateSubscription={handleUpdateSubscription} 
            currentUser={currentUser}
            isSimulatingShop={isSimulatingShop}
          />
        );
      case 'super_admin':
        return (
          <SuperAdminDashboard 
            currentUserEmail={currentUser?.email || ''} 
            onToggleShopMode={() => setIsSimulatingShop(!isSimulatingShop)} 
            isSimulatingShop={isSimulatingShop}
            onEditProfile={handleOpenEditProfile}
            isSupportCollaborator={isSupportCollaborator}
            onImpersonateStore={(email) => {
              setIsSimulatingShop(true);
              setSimulatedStoreEmail(email);
              localStorage.setItem('is_simulating_shop', 'true');
              localStorage.setItem('simulated_store_email', email);
              getDoc(doc(db, 'storeSettings', email)).then((snap) => {
                if (snap.exists()) {
                  setStoreSettings(snap.data() as StoreSettings);
                } else {
                  setStoreSettings({
                    ...INITIAL_STORE_SETTINGS,
                    name: 'Kiosco Simulado (' + email + ')',
                    email: email,
                    isConfigured: true
                  });
                }
              }).catch(() => {
                // local fallback if offline or rules block
                setStoreSettings({
                  ...INITIAL_STORE_SETTINGS,
                  name: 'Kiosco Simulado (' + email + ')',
                  email: email,
                  isConfigured: true
                });
              });
              setCurrentTab('pos');
            }}
          />
        );
      case 'ai_support':
        return (
          <AISupportAndMaintenance 
            products={products}
            setProducts={setProducts}
            sales={sales}
            setSales={setSales}
            employees={employees}
            setEmployees={setEmployees}
            customers={customers}
            setCustomers={setCustomers}
            storeSettings={storeSettings}
            subscription={subscription}
            setSubscription={setSubscription}
          />
        );
      case 'manual':
        return (
          <UserManual 
            currentUserRole={currentUser?.role}
            storeName={storeSettings.storeName}
          />
        );
      default:
        return <div className="text-center p-20 text-slate-500 font-bold">Página no encontrada</div>;
    }
  };

  // Render Kitchen/Chef WhatsApp update screen if the direct URL link was clicked
  if (kitchenReadyOrder) {
    return (
      <KitchenReadyScreen 
        kitchenReadyOrder={kitchenReadyOrder}
        onClose={() => {
          // Clear query parameters from URL completely and clean state
          const url = new URL(window.location.href);
          url.searchParams.delete('readyOrderId');
          url.searchParams.delete('storeEmail');
          window.history.replaceState({}, '', url.pathname + url.search);
          setKitchenReadyOrder(null);
        }}
      />
    );
  }

  // If NOT logged in, show LandingPage by default, with opt-in Login
  if (!currentUser) {
    if (!showLogin) {
      return (
        <>
          <LandingPage 
            onLoginClick={(mode) => {
              const actualMode = typeof mode === 'string' ? mode : 'login';
              setInitialLoginMode(actualMode);
              setShowLogin(true);
            }}
            onStartDemoClick={(planId) => {
              setInitialLoginMode('login');
              setShowLogin(true);
            }}
            employees={employees}
            onDirectLogin={(user) => {
              if (user.email === 'pezziniarg@gmail.com') {
                console.warn("Seguridad: Intento de bypass de credenciales para el Administrador Principal denegado.");
                setInitialLoginMode('login');
                setShowLogin(true); // Redirige al login seguro
                return;
              }
              setCurrentUser(user);
              localStorage.setItem('currentUser', JSON.stringify(user));
            }}
          />
          <AccessibilityAssistant activeStoreEmail={activeStoreEmail} />
        </>
      );
    }

    return (
      <>
        <Login 
          employees={employees}
          onLoginSuccess={async (user) => {
            setCurrentUser(user);
            localStorage.setItem('currentUser', JSON.stringify(user));
            
            // Set correct default initial tab on fresh login
            if (user.email === 'pezziniarg@gmail.com' || user.id === 'emp-1') {
              setCurrentTab('super_admin');
            } else {
              setCurrentTab('pos');
            }

            if (user.role === 'Administrador' && user.email !== 'pezziniarg@gmail.com') {
              try {
                const { getDocs, query, collection, where, setDoc, doc, getDoc } = await import('firebase/firestore');
                const emailToFind = user.email.trim().toLowerCase();
                const ownerSnap = await getDocs(query(collection(db, 'storeOwners'), where('email', '==', emailToFind)));
                
                if (ownerSnap.empty) {
                  // Read their current settings default name if any, or use fallback
                  const settingsSnap = await getDoc(doc(db, 'storeSettings', emailToFind));
                  const currentStoreName = settingsSnap.exists() ? (settingsSnap.data().name || 'Mi Nueva Tienda') : 'Mi Nueva Tienda';
                  
                  const newStoreId = `store-${Date.now()}`;
                  const newStoreOwner = {
                    id: newStoreId,
                    ownerName: user.name,
                    storeName: currentStoreName,
                    email: emailToFind,
                    plan: 'Gratuito',
                    status: 'Activo',
                    registeredDate: user.joinedDate || new Date().toISOString().split('T')[0],
                    notes: 'Sincronizado retrospectivamente en el inicio de sesión.'
                  };
                  
                  await setDoc(doc(db, 'storeOwners', newStoreId), newStoreOwner);
                  
                  // Add to local storage backup list too
                  const saved = localStorage.getItem('saas_registered_store_owners');
                  if (saved) {
                    const parsed = JSON.parse(saved);
                    if (!parsed.some((o: any) => o.email === emailToFind)) {
                      parsed.push(newStoreOwner);
                      localStorage.setItem('saas_registered_store_owners', JSON.stringify(parsed));
                    }
                  }
                }
              } catch (err) {
                console.error("Retrospective store synchronization failed:", err);
              }
            }
          }}
          onRegisterAdmin={handleRegisterAdmin}
          onBackToLanding={isNativePlatform ? undefined : () => setShowLogin(false)}
          initialMode={initialLoginMode}
        />
        <AccessibilityAssistant activeStoreEmail={activeStoreEmail} />
      </>
    );
  }

  // If logged in user is a public general buyer, serve customer-facing mobile client portal
  if (currentUser && currentUser.role === 'Comprador') {
    return (
      <>
        <BuyerPortal 
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateCurrentUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('currentUser', JSON.stringify(updated));
            // Also update in local employees state
            setEmployees(prev => prev.map(emp => emp.id === updated.id ? updated : emp));
          }}
        />
        <AccessibilityAssistant activeStoreEmail={activeStoreEmail} />
      </>
    );
  }

  // If logged in user is a supplier, serve the specialized supplier portal to view local stores
  if (currentUser && currentUser.role === 'Proveedor') {
    return (
      <>
        <SupplierPortal
          currentUser={currentUser}
          onLogout={handleLogout}
          onUpdateCurrentUser={(updated) => {
            setCurrentUser(updated);
            localStorage.setItem('currentUser', JSON.stringify(updated));
            // Also update in local employees state
            setEmployees(prev => prev.map(emp => emp.id === updated.id ? updated : emp));
          }}
        />
        <AccessibilityAssistant activeStoreEmail={activeStoreEmail} />
      </>
    );
  }

  // Render trial expiration paywall if the store trial has expired
  if (isTrialExpired) {
    return (
      <>
        <TrialPaywall
          activeStoreEmail={activeStoreEmail}
          currentUser={currentUser}
          activeLicense={activeLicense}
          onPaymentSuccess={(planName, price) => {
            // Update subscription state to keep main view aligned
            setSubscription({
              plan: planName,
              status: 'Activo',
              nextBillingDate: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0],
              price: planName === 'Básico' ? 15.00 : planName === 'Profesional' ? 29.99 : 59.99
            });
            // Update local activeLicense to clear the blocker instantly
            setActiveLicense(prev => prev ? { ...prev, plan: planName, status: 'Activo' } : null);
          }}
          onLogout={handleLogout}
        />
        <AccessibilityAssistant activeStoreEmail={activeStoreEmail} />
      </>
    );
  }

  // If logged in user is a cashier (Cajero) and has no authorized shift session active, serve the lobby waiting / shift registration stage
  const isCashier = currentUser && currentUser.role === 'Cajero';
  const activeSession = isCashier ? cashierSessions.find(s => s.employeeId === currentUser.id && s.status === 'autorizado') : null;
  const pendingSession = isCashier ? cashierSessions.find(s => s.employeeId === currentUser.id && s.status === 'esperando_autorizacion') : null;

  if (currentUser && currentUser.role === 'Cajero' && !activeSession) {
    return (
      <>
        <CashierLobby 
          pendingSession={pendingSession}
          onAddSession={handleAddCashierSession}
          onUpdateStatus={handleUpdateSessionStatus}
          currentUser={currentUser}
          onLogout={handleLogout}
          storeSettings={storeSettings}
        />
        <AccessibilityAssistant activeStoreEmail={activeStoreEmail} />
      </>
    );
  }

  return (
    <>
      <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800 antialiased">
      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        subscription={subscription}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        currentUser={currentUser}
        onLogout={handleLogout}
        storeSettings={storeSettings}
        isSimulatingShop={isSimulatingShop}
        setIsSimulatingShop={setIsSimulatingShop}
        onEditProfile={handleOpenEditProfile}
        isPracticeMode={isPracticeMode}
        onTogglePracticeMode={handleTogglePracticeMode}
      />

      {/* Onboarding Wizard popup for first login / unconfigured store settings */}
      {currentUser && currentUser.role === 'Administrador' && !isSuperAdmin && storeSettings.isConfigured === false && !dismissedWizard && (
        <StoreSetupWizard 
          initialSettings={storeSettings}
          onComplete={handleUpdateSettings}
          currentUserEmail={currentUser.email}
          onClose={() => setDismissedWizard(true)}
        />
      )}

      {/* Main Content Pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        
        {/* Top bar header */}
        <header className="bg-white border-b border-slate-200 h-16 flex-shrink-0 flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 hover:bg-slate-100 rounded-xl text-slate-600 focus:outline-hidden cursor-pointer"
              aria-label="Abrir menú"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${isPracticeMode ? 'bg-amber-500' : 'bg-orange-500'}`} />
              <div className="text-xs text-slate-500 font-mono font-medium flex items-center gap-1.5">
                {isPracticeMode ? (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md font-bold text-[9px] tracking-wider">
                    MODO PRACTICANTE ACTIVO
                  </span>
                ) : (
                  "Conexión segura establecida • Sucursal Activa"
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && !isSimulatingShop ? (
              <>
                {/* SaaS Admin Header Elements */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-orange-50 border border-orange-200 text-orange-800 rounded-xl text-[10px] font-mono font-bold uppercase">
                  <Crown className="w-3.5 h-3.5 text-orange-500" />
                  <span>MAX24 • SISTEMA CENTRAL</span>
                </div>
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-900 rounded-lg text-[9px] font-bold font-sans border border-orange-200">
                  <ShieldEllipsis className="w-3.5 h-3.5 text-orange-600" />
                  <span>Propietario de Plataforma</span>
                </div>
              </>
            ) : (
              <>
                {/* Standard Client Store Header Elements */}
                <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-mono font-bold text-slate-600 uppercase">
                  {storeSettings.logoUrl ? (
                    <img 
                      src={storeSettings.logoUrl} 
                      className="w-4.5 h-4.5 rounded object-cover flex-shrink-0" 
                      referrerPolicy="no-referrer"
                      alt="" 
                    />
                  ) : (
                    <Building2 className="w-3.5 h-3.5" />
                  )}
                  <span className="max-w-[120px] truncate">{storeSettings.name}</span>
                </div>
                
                {/* User security flag info */}
                <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-orange-50 text-orange-700 rounded-lg text-[9px] font-bold font-sans border border-orange-100">
                  <ShieldEllipsis className="w-3.5 h-3.5 text-orange-600" />
                  <span>Rol: {currentUser.role}</span>
                </div>
              </>
            )}
          </div>
        </header>

        {/* Superadmin Shop Simulation Notification Banner */}
        {isSuperAdmin && isSimulatingShop && (
          <div className="bg-amber-400 text-slate-950 px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-xs font-bold shadow-md z-30 select-none border-b border-amber-500">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-slate-950 text-white rounded font-mono text-[9px] font-black uppercase tracking-wider shrink-0">Simulación Activa</span>
              <span>Estás visualizando la app como una Tienda Cliente ("Max24 Express Belgrano") para auditar el POS.</span>
            </div>
            <button
              onClick={() => setIsSimulatingShop(false)}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-white rounded-lg text-[10.5px] font-black transition-all cursor-pointer shrink-0 uppercase tracking-wide"
            >
              Volver a Panel Propietario
            </button>
          </div>
        )}

        {/* Modo Practicante Training Banner */}
        {isPracticeMode && (
          <div className="bg-amber-500 text-white px-6 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 font-sans text-xs font-bold shadow-md z-30 select-none border-b border-amber-600">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-amber-600/60 rounded-lg text-sm leading-none shrink-0">🚧</span>
              <span>Estas operando en el <strong>MODO PRACTICANTE (Entrenamiento)</strong>. Las ventas, productos y deudas agregados no quedarán registrados en el informe real de la tienda.</span>
            </div>
            <button
              onClick={() => handleTogglePracticeMode(false)}
              className="px-3.5 py-1.5 bg-white hover:bg-amber-50 text-amber-700 rounded-lg text-[10.5px] font-black transition-all cursor-pointer shrink-0 uppercase tracking-wider"
            >
              Salir de Modo Pruebas
            </button>
          </div>
        )}

        {/* Content View Container */}
        <main className="p-6 md:p-8 flex-1 max-w-[1500px] w-full mx-auto" id="app-content-stage font-sans">
          {showLiveOrderAlert && (
            <div className="mb-6 p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-orange-400 relative overflow-hidden z-40 animate-bounce">
              <div className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-white text-orange-600 flex items-center justify-center text-lg font-bold">🔔</span>
                <div className="text-left">
                  <h4 className="text-sm font-black tracking-tight text-white">¡Nuevo pedido de compra online recibido! 🌐</h4>
                  <p className="text-[11px] text-white/90 font-medium">
                    Ingresó un pedido de <strong>{showLiveOrderAlert.buyerName}</strong> por un total de <strong>${showLiveOrderAlert.total.toLocaleString('es-AR')}</strong>.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => {
                    setCurrentTab('online_sales');
                    setShowLiveOrderAlert(null);
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Ir a Venta Online
                </button>
                <button
                  onClick={() => setShowLiveOrderAlert(null)}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Descartar
                </button>
              </div>
            </div>
          )}

          {/* Supervisor Notification Banner for Cashier Sign-ins */}
          {currentUser && (currentUser.role === 'Administrador' || currentUser.role === 'Gerente' || currentUser.role === 'Supervisor' || isSuperAdmin) && 
           cashierSessions.filter(s => s.status === 'esperando_autorizacion').length > 0 && (
            <div className="mb-6 p-4.5 bg-gradient-to-r from-amber-600 to-orange-500 text-white rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl border border-amber-500 relative overflow-hidden z-40">
              <div className="flex items-center gap-3 text-left">
                <span className="w-10 h-10 rounded-full bg-slate-950/40 text-amber-300 flex items-center justify-center text-lg font-bold shrink-0">⏱️</span>
                <div>
                  <h4 className="text-sm font-black tracking-tight text-white">Aprobación de Caja Requerida ({cashierSessions.filter(s => s.status === 'esperando_autorizacion').length})</h4>
                  <p className="text-[11px] text-white/95 font-medium leading-relaxed">
                    {cashierSessions.filter(s => s.status === 'esperando_autorizacion').map(p => `${p.employeeName} (${p.shift || 'Rotativo'}) con base de $${(p.initialCash || 0).toLocaleString('es-AR')}`).join(', ')} solicita autorización para comenzar facturación.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                <button
                  onClick={async () => {
                    const pends = cashierSessions.filter(s => s.status === 'esperando_autorizacion');
                    for (const p of pends) {
                      await handleUpdateSessionStatus(p.id, 'autorizado');
                    }
                    alert("¡Turno(s) autorizado(s) en línea con éxito!");
                  }}
                  className="px-4 py-2 bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer whitespace-nowrap"
                >
                  Autorizar Todo
                </button>
                <button
                  onClick={() => setCurrentTab('employees')}
                  className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white font-semibold text-xs rounded-xl transition-all cursor-pointer whitespace-nowrap"
                >
                  Ver Detalles
                </button>
              </div>
            </div>
          )}

          {renderTabContent()}
        </main>
      </div>

      {/* GLOBAL OWN PROFILE EDITING MODAL */}
      {isEditingOwnProfile && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in text-left">
          <div className={`bg-white border border-slate-200 rounded-3xl w-full ${currentUser && currentUser.role !== 'Comprador' && currentUser.role !== 'Proveedor' ? 'max-w-2xl' : 'max-w-md'} p-6 space-y-5 shadow-2xl animate-scale-up`}>
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 font-sans">
                <Crown className="w-5 h-5 text-orange-500 shrink-0" />
                Mi Perfil de Acceso y Sueldo
              </h3>
              <button 
                type="button"
                disabled={isSavingProfile}
                onClick={() => setIsEditingOwnProfile(false)}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer disabled:opacity-30"
              >
                ✕
              </button>
            </div>

            {/* Tab Selector */}
            {currentUser && currentUser.role !== 'Comprador' && currentUser.role !== 'Proveedor' && (
              <div className="flex border-b border-slate-100 -mx-6 px-6">
                <button
                  type="button"
                  onClick={() => setProfileActiveTab('info')}
                  className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
                    profileActiveTab === 'info'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  👤 Mis Datos de Acceso
                </button>
                <button
                  type="button"
                  onClick={() => setProfileActiveTab('payments')}
                  className={`py-2 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    profileActiveTab === 'payments'
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  💵 Mis Sueldos y Pagos
                  {currentUser.paymentsHistory?.some((p: any) => !p.employeeConfirmed) && (
                    <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  )}
                </button>
              </div>
            )}

            {profileActiveTab === 'payments' && currentUser && currentUser.role !== 'Comprador' && currentUser.role !== 'Proveedor' ? (
              <div className="space-y-4 animate-fade-in text-left">
                {/* Financial Summary */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
                      Sueldo Acumulado Pendiente
                    </span>
                    <p className="text-2xl font-black text-slate-900 mt-1">
                      ${(currentUser.accruedWages || 0).toLocaleString('es-AR')}
                    </p>
                  </div>
                  <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block font-sans">
                      Total Recibido (Histórico)
                    </span>
                    <p className="text-2xl font-black text-emerald-600 mt-1">
                      ${(currentUser.paidWages || 0).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>

                {/* Payments History List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-black text-slate-900 font-sans tracking-tight">
                    Historial de Pagos con Doble Firma
                  </h4>
                  
                  {!currentUser.paymentsHistory || currentUser.paymentsHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 py-6 text-center italic border border-dashed border-slate-200 rounded-2xl">
                      Aún no hay registros de pagos de sueldo.
                    </p>
                  ) : (
                    <div className="max-h-[220px] overflow-y-auto space-y-2.5 pr-1 font-mono text-xs">
                      {currentUser.paymentsHistory.map((pay: any) => {
                        return (
                          <div 
                            key={pay.id} 
                            className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-2 flex flex-col justify-between"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-bold text-slate-900 text-sm">${pay.amount.toLocaleString('es-AR')}</span>
                                <span className="text-[10px] text-slate-400 bg-slate-200 px-1.5 py-0.5 rounded ml-2 uppercase font-sans font-bold">
                                  {pay.method}
                                </span>
                                <p className="text-[11px] text-slate-500 font-sans mt-1">{pay.notes || 'Pago de Salario'}</p>
                              </div>
                              <span className="text-[10px] text-slate-400 text-right font-sans shrink-0">
                                {pay.date ? (() => {
                                  try {
                                    const d = new Date(pay.date);
                                    if (!isNaN(d.getTime())) {
                                      return (
                                        <>
                                          <div className="font-bold text-slate-600">{d.toLocaleDateString('es-AR')}</div>
                                          <div className="text-[9px] font-mono mt-0.5">{d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs</div>
                                        </>
                                      );
                                    }
                                  } catch (e) {}
                                  return pay.date;
                                })() : ''}
                              </span>
                            </div>

                            {/* Dual confirmation signatures status */}
                            <div className="pt-2 border-t border-slate-200/60 flex flex-wrap items-center justify-between gap-2">
                              <div className="flex gap-1.5 flex-wrap">
                                {/* Owner status */}
                                <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-lg px-2 py-0.5 text-[9.5px]">
                                  <span>💼 Dueño (Pagador):</span>
                                  {pay.ownerConfirmed ? (
                                    <span className="text-emerald-600 font-extrabold flex items-center gap-0.5" title={pay.ownerConfirmedAt ? new Date(pay.ownerConfirmedAt).toLocaleString('es-AR') : undefined}>
                                      ✅ Confirmado
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 font-bold">⏳ Pendiente</span>
                                  )}
                                </div>

                                {/* Employee status */}
                                <div className="flex items-center gap-1 bg-white border border-slate-200/80 rounded-lg px-2 py-0.5 text-[9.5px]">
                                  <span>👤 Vos (Empleado):</span>
                                  {pay.employeeConfirmed ? (
                                    <span className="text-emerald-600 font-extrabold flex items-center gap-0.5" title={pay.employeeConfirmedAt ? new Date(pay.employeeConfirmedAt).toLocaleString('es-AR') : undefined}>
                                      ✅ Confirmado
                                    </span>
                                  ) : (
                                    <span className="text-amber-600 font-bold">⏳ Pendiente</span>
                                  )}
                                </div>
                              </div>

                              {/* Confirmation action for employee */}
                              {!pay.employeeConfirmed && (
                                <button
                                  type="button"
                                  onClick={() => handleConfirmPaymentByEmployee(pay.id)}
                                  className="py-1 px-2.5 bg-orange-600 hover:bg-orange-500 text-white font-black text-[9.5px] rounded-lg cursor-pointer transition-colors uppercase font-sans tracking-tight"
                                >
                                  ✍️ Confirmar Recepción
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingOwnProfile(false)}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
                  >
                    Cerrar Perfil
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSaveOwnProfile} className="space-y-5">
                {/* MANUAL ACCESS BANNER */}
                <div className="bg-orange-50/70 border border-orange-200/60 p-3.5 rounded-2xl flex items-start gap-3">
                  <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900">Manual de Operación de Tienda</h4>
                    <p className="text-[10px] text-slate-500 leading-normal font-medium">
                      Guía de funciones específicas para Propietarios y Empleados de MAX24. Puedes verla online o imprimirla en PDF.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentTab('manual');
                        setIsEditingOwnProfile(false);
                      }}
                      className="text-[10px] font-black text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1 mt-1 cursor-pointer"
                    >
                      Abrir Manual de MAX24 <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {profileEditSuccessMsg && (
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-955 flex items-start gap-3 animate-fade-in text-xs font-semibold">
                    <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="font-bold">¡Cambios Guardados!</p>
                      <p className="text-[10px] text-emerald-800 font-medium leading-tight">{profileEditSuccessMsg}</p>
                    </div>
                  </div>
                )}

                {profileEditErrorMsg && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-950 text-xs font-semibold">
                    {profileEditErrorMsg}
                  </div>
                )}

                <div className="space-y-4 text-left">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block">Mi Nombre Completo</label>
                    <input
                      type="text"
                      required
                      disabled={isSavingProfile}
                      placeholder="ej. Tu Nombre real"
                      value={profileEditName}
                      onChange={(e) => setProfileEditName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all focus:ring-1 focus:ring-orange-500/10 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block font-sans">Correo Electrónico de Ingreso</label>
                    <input
                      type="email"
                      required
                      disabled={isSavingProfile}
                      placeholder="ej: tuemail@gmail.com"
                      value={profileEditEmail}
                      onChange={(e) => setProfileEditEmail(e.target.value.trim().toLowerCase())}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all focus:ring-1 focus:ring-orange-500/10 disabled:opacity-50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 block flex items-center justify-between">
                      <span>Contraseña de Acceso</span>
                      <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded font-semibold font-sans">Seguridad</span>
                    </label>
                    <input
                      type="text"
                      required
                      disabled={isSavingProfile}
                      placeholder="Contraseña del sistema"
                      value={profileEditPassword}
                      onChange={(e) => setProfileEditPassword(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold text-slate-950 focus:outline-hidden focus:border-orange-500 focus:bg-white transition-all focus:ring-1 focus:ring-orange-500/10 disabled:opacity-50"
                    />
                    <p className="text-[10px] text-slate-400 leading-normal font-medium mt-1">
                      Usa una contraseña segura para tu acceso. El cambio impacta inmediatamente.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    disabled={isSavingProfile}
                    onClick={() => setIsEditingOwnProfile(false)}
                    className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isSavingProfile ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : profileEditSuccessMsg ? (
                      '¡Guardado!'
                    ) : (
                      'Guardar Mi Perfil'
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
    <AccessibilityAssistant activeStoreEmail={activeStoreEmail} />
    </>
  );
}
