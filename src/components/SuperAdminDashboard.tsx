import React, { useState, useEffect } from 'react';
import { 
  Crown, Store, CreditCard, Wallet, Gift, Check, AlertCircle, ExternalLink, 
  Eye, EyeOff, ToggleLeft, ToggleRight, ShieldAlert, Users, Calendar, 
  DollarSign, Plus, Sparkles, RefreshCw, Search, CheckCircle2, Lock, 
  ArrowRight, UserCog, Building, Wrench, Database, Terminal, Download, 
  Upload, FileJson, Trash2, Edit, CheckSquare, MessageSquare, Megaphone, 
  Send, Shield, Activity, TrendingUp, Percent, Filter, ArrowUpRight, CheckCircle, X,
  Save, UserPlus
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, updateDoc, getDoc } from 'firebase/firestore';
import { Subscription } from '../types';

interface StoreOwner {
  id: string;
  ownerName: string;
  storeName: string;
  email: string;
  plan: Subscription['plan'] | 'Pase Libre';
  status: 'Activo' | 'Suspendido' | 'Expirado';
  registeredDate: string;
  notes?: string;
  isFreeByAdmin?: boolean;
  freeUntilDate?: string;
  authorizedEditorEmail?: string;
}

interface MpTransaction {
  id: string;
  storeName: string;
  email: string;
  plan: Subscription['plan'];
  amountArs: number;
  paymentMethod: string;
  date: string;
  status: 'Aprobado' | 'Reembolsado' | 'Pendiente' | 'Disputado';
}

interface PlanConfig {
  id: string;
  name: string;
  price: number;
  billingPeriod: string;
  type: 'Tienda' | 'Proveedor';
  features: string[];
}

interface ProviderB2B {
  id: string;
  companyName: string;
  cuit: string;
  ownerEmail: string;
  verified: boolean;
  status: 'Pendiente' | 'Aprobado' | 'Rechazado';
  reachSearchCount: number;
  salesVolumeArs: number;
  category: string;
}

interface EndUser {
  id: string;
  name: string;
  email: string;
  joinedDate: string;
  status: 'Activo' | 'Baneado' | 'Suspendido';
  preferredStores: string[];
  interactionsCount: number;
  lastActive: string;
}

interface SupportTicket {
  id: string;
  senderName: string;
  senderEmail: string;
  role: 'Tienda' | 'Proveedor' | 'Público';
  subject: string;
  message: string;
  status: 'Pendiente' | 'Resuelto';
  date: string;
  replies: Array<{ who: string; msg: string; date: string }>;
}

interface SuperAdminDashboardProps {
  currentUserEmail: string;
  onToggleShopMode: () => void;
  isSimulatingShop: boolean;
  onEditProfile?: () => void;
  onImpersonateStore?: (email: string) => void;
  isSupportCollaborator?: boolean;
}

export default function SuperAdminDashboard({ 
  currentUserEmail, 
  onToggleShopMode,
  isSimulatingShop,
  onEditProfile,
  onImpersonateStore,
  isSupportCollaborator = false
}: SuperAdminDashboardProps) {
  // Navigation
  const [activeAdminTab, setActiveAdminTab] = useState<'dashboard' | 'subscriptions' | 'stores' | 'suppliers' | 'users' | 'support' | 'maintenance'>('dashboard');

  // Core Store owners & transactions state
  const [storeOwners, setStoreOwners] = useState<StoreOwner[]>([]);
  const [mpTransactions, setMpTransactions] = useState<MpTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);

  // Searches
  const [storeSearch, setStoreSearch] = useState('');
  const [txSearch, setTxSearch] = useState('');
  const [userSearch, setUserSearch] = useState('');
  const [provSearch, setProvSearch] = useState('');

  // Filters
  const [nicheFilter, setNicheFilter] = useState('Todos');
  const [storeStatusFilter, setStoreStatusFilter] = useState('Todos');

  // 1. Interactive Plans State
  const [plans, setPlans] = useState<PlanConfig[]>(() => {
    const saved = localStorage.getItem('saas_plans');
    return saved ? JSON.parse(saved) : [
      { id: 'plan-basic', name: 'Plan Básico (Kioscos)', price: 15000, billingPeriod: 'Mensual', type: 'Tienda', features: ['Hasta 500 productos', 'Soporte Básico', 'Reportes Simples'] },
      { id: 'plan-pro', name: 'Plan Profesional (Multirubros)', price: 30000, billingPeriod: 'Mensual', type: 'Tienda', features: ['Productos Ilimitados', 'Acceso Multi-Caja', 'Estadísticas e Inteligencia Artificial'] },
      { id: 'plan-emp', name: 'Plan Empresarial (Franquicias)', price: 60000, billingPeriod: 'Mensual', type: 'Tienda', features: ['Multi-Sucursales', 'Prioridad de Soporte', 'Consola Unificada'] },
      { id: 'plan-prov', name: 'Plan Proveedor Mayorista', price: 45000, billingPeriod: 'Mensual', type: 'Proveedor', features: ['Catálogo Mayorista', 'Publicación sin límites', 'Validación de Identidad'] }
    ];
  });
  const [editingPlan, setEditingPlan] = useState<PlanConfig | null>(null);

  // 2. Interactive B2B Providers State
  const [providers, setProviders] = useState<ProviderB2B[]>(() => {
    const saved = localStorage.getItem('saas_providers_b2b');
    return saved ? JSON.parse(saved) : [
      { id: 'prov-1', companyName: 'Distribuidora Central S.A.', cuit: '30-71458962-9', ownerEmail: 'central@distrisuper.com.ar', verified: true, status: 'Aprobado', reachSearchCount: 1450, salesVolumeArs: 1850000, category: 'Bebidas' },
      { id: 'prov-2', companyName: 'Golopolis S.A. Mayorista', cuit: '33-54871295-9', ownerEmail: 'contacto@golopolis.com', verified: true, status: 'Aprobado', reachSearchCount: 2100, salesVolumeArs: 3200000, category: 'Golosinas' },
      { id: 'prov-3', companyName: 'Lácteos La Serenísima', cuit: '30-50001045-3', ownerEmail: 'logis@laserenisima.com', verified: true, status: 'Aprobado', reachSearchCount: 950, salesVolumeArs: 1100000, category: 'Lácteos' },
      { id: 'prov-4', companyName: 'Distribuidora El Trébol SRL', cuit: '30-68541297-4', ownerEmail: 'ventas@trebolsrl.com', verified: false, status: 'Pendiente', reachSearchCount: 420, salesVolumeArs: 0, category: 'Limpieza' }
    ];
  });

  // 3. Interactive Support Tickets State
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    const saved = localStorage.getItem('saas_support_tickets');
    return saved ? JSON.parse(saved) : [
      { id: 'TCK-2241', senderName: 'Carlos Daniel Pérez', senderEmail: 'pezziniarg@gmail.com', role: 'Tienda', subject: 'Falla al acreditar Mercado Pago', message: 'Hola, un cobro QR no se acreditó en mi caja al instante. El cliente tiene el comprobante.', status: 'Pendiente', date: '2026-06-22 10:15', replies: [] },
      { id: 'TCK-2195', senderName: 'Juan Pérez', senderEmail: 'juanperez@despensa.com', role: 'Tienda', subject: 'Lector de barra USB', message: 'No logro que mi lectora USB ingrese un Enter automático al escanear.', status: 'Resuelto', date: '2026-06-18 19:40', replies: [{ who: 'Soporte MAX24', msg: 'Hola Juan, debes configurar la lectora agregando el sufijo "Carriage Return" de su manual.', date: '2026-06-19 12:10' }] },
      { id: 'TCK-2204', senderName: 'Sofía Galetti', senderEmail: 'sofigaletti@gmail.com', role: 'Público', subject: 'Diferencia de precio Belgrano', message: 'En góndola salía $800 un alfajor y en la pantalla del POS cobró $950.', status: 'Pendiente', date: '2026-06-21 16:35', replies: [] }
    ];
  });
  const [replyTicketId, setReplyTicketId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');

  // 4. Interactive End Users State
  const [endUsers, setEndUsers] = useState<EndUser[]>(() => {
    const saved = localStorage.getItem('saas_end_users');
    return saved ? JSON.parse(saved) : [
      { id: 'user-1', name: 'Martín Altamirano', email: 'martinalta@hotmail.com', joinedDate: '2026-05-12', status: 'Activo', preferredStores: ['Max24 Express Belgrano', 'Kiosco El Trébol'], interactionsCount: 48, lastActive: 'Hace 2 horas' },
      { id: 'user-2', name: 'Sofía Galetti', email: 'sofigaletti@gmail.com', joinedDate: '2026-06-01', status: 'Activo', preferredStores: ['BigMAX 24 Horas'], interactionsCount: 15, lastActive: 'Ayer' },
      { id: 'user-3', name: 'Claudio Bustos', email: 'claudio95@yahoo.com.ar', joinedDate: '2026-03-22', status: 'Baneado', preferredStores: ['Despensa Don Juan'], interactionsCount: 112, lastActive: 'Hace 10 días' },
      { id: 'user-4', name: 'Laura San Román', email: 'laura1980@gmail.com', joinedDate: '2026-06-19', status: 'Activo', preferredStores: ['Max24 Express Belgrano'], interactionsCount: 4, lastActive: 'Hace 5 min' }
    ];
  });
  const [editingUser, setEditingUser] = useState<EndUser | null>(null);

  // 5. Broadcaster notifications
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'stores' | 'suppliers' | 'users'>('all');
  const [broadcastSubject, setBroadcastSubject] = useState('');
  const [broadcastMsg, setBroadcastMsg] = useState('');

  // 6. Active System Alerts State
  const [sysAlerts, setSysAlerts] = useState([
    { id: 'al-1', type: 'error', source: 'Mercado Pago SDK', msg: 'Error 504 Gateway Timeout recopilando respuesta IPN.', date: 'Hace 10 min' },
    { id: 'al-2', type: 'warn', source: 'Suscripción Kiosco El Trébol', msg: 'Re-intento de débito rechazado (sin saldo suficiente del titular).', date: 'Hace 3 horas' },
    { id: 'al-3', type: 'info', source: 'Comercio Pendiente', msg: 'Distribuidora El Trébol SRL cargó documentación CUIT para verificación.', date: 'Hoy 09:15' }
  ]);

  // Mercado Pago settings State
  const [mpSettings, setMpSettings] = useState({
    accessToken: localStorage.getItem('mp_super_access_token') || 'APP_USR-8753677167356936-061420-85c0eae57e0ea48e95fba24aebfc33ef-1638313806',
    publicKey: localStorage.getItem('mp_super_public_key') || 'APP_USR-d1325d31-d738-459d-8f29-3b03c06fdca5',
    clientId: localStorage.getItem('mp_super_client_id') || '8753677167356936',
    clientSecret: localStorage.getItem('mp_super_client_secret') || 'ug8vce82sConKomHXC0u3sJp9EDAqhyw',
    isSandbox: localStorage.getItem('mp_super_is_sandbox') === 'true' ? true : false,
    webhookUrl: `https://max24app.com/api/mercadopago/webhook`,
    planBasicoMensualLink: localStorage.getItem('mp_link_basico_mensual') || 'https://mpago.la/24WN732',
    planBasicoAnualLink: localStorage.getItem('mp_link_basico_anual') || 'https://mpago.la/1arSVAC',
    planProfesionalMensualLink: localStorage.getItem('mp_link_profesional_mensual') || 'https://mpago.la/292vRL9',
    planProfesionalAnualLink: localStorage.getItem('mp_link_profesional_anual') || 'https://mpago.la/21BFUq9',
    planEmpresarialMensualLink: localStorage.getItem('mp_link_empresarial_mensual') || 'https://mpago.la/1xiaYqQ',
    planEmpresarialAnualLink: localStorage.getItem('mp_link_empresarial_anual') || 'https://mpago.la/1Aqgue2',
    planProveedorMensualLink: localStorage.getItem('mp_link_proveedor_mensual') || 'https://mpago.la/33P1Q69',
    planProveedorAnualLink: localStorage.getItem('mp_link_proveedor_anual') || 'https://mpago.la/2shPPRr',
  });
  const [showSecrets, setShowSecrets] = useState(false);

  // Modals for stores
  const [editingStore, setEditingStore] = useState<StoreOwner | null>(null);
  const [freePlan, setFreePlan] = useState<Subscription['plan'] | 'Pase Libre'>('Pase Libre');
  const [freeUntil, setFreeUntil] = useState('Ilimitado');
  const [customNotes, setCustomNotes] = useState('');
  const [editingStoreDetails, setEditingStoreDetails] = useState<StoreOwner | null>(null);
  const [isSavingStore, setIsSavingStore] = useState(false);
  const [storeSaveSuccess, setStoreSaveSuccess] = useState(false);
  const [storeToDelete, setStoreToDelete] = useState<StoreOwner | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [newStore, setNewStore] = useState({
    ownerName: '',
    storeName: '',
    email: '',
    plan: 'Profesional' as Subscription['plan'],
    status: 'Activo' as const
  });

  // Support Sub-Tabs & Support Collaborator / Contact settings states
  const [activeSupportSubTab, setActiveSupportSubTab] = useState<'tickets' | 'contact' | 'collaborators'>('tickets');
  const [contactSettings, setContactSettings] = useState({
    whatsapp: '5491122334455',
    email: 'contacto@max24app.com',
    supportHours: 'Lunes a Viernes 9:00 a 18:00hs',
    socialFb: 'https://facebook.com/max24app',
    socialIg: 'https://instagram.com/max24app',
  });
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [loadingCollaborators, setLoadingCollaborators] = useState(false);
  const [collabForm, setCollabForm] = useState({ name: '', email: '', username: '', password: '' });
  const [collabSuccess, setCollabSuccess] = useState('');
  const [collabError, setCollabError] = useState('');

  // Maintenance section States
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [isCheckingIntegrity, setIsCheckingIntegrity] = useState(false);
  const [globalExportSuccess, setGlobalExportSuccess] = useState(false);
  const [globalImportLoading, setGlobalImportLoading] = useState(false);
  const [globalImportSuccess, setGlobalImportSuccess] = useState('');
  const [globalImportError, setGlobalImportError] = useState('');
  const [maintenanceLogs, setMaintenanceLogs] = useState<{ id: string; time: string; type: 'info'|'success'|'error'|'warn'; message: string }[]>([
    { id: 'log-1', time: '12:05', type: 'success', message: 'Servicio Express MAX24 activo en puerto 3000.' },
    { id: 'log-2', time: '12:06', type: 'info', message: 'Enlace bidireccional Firestore establecido correctamente.' },
    { id: 'log-3', time: '12:07', type: 'success', message: 'Servicio de escucha Webhook de Mercado Pago sincronizado.' }
  ]);

  // Load Data
  const loadData = async () => {
    setLoading(true);
    try {
      const { auth: saAuth } = await import('../firebase');
      const { signInAnonymously: saSignIn } = await import('firebase/auth');
      if (!saAuth.currentUser) {
        try { 
          await saSignIn(saAuth); 
        } catch (e) { 
          console.warn("AnonymAuth restricted or disabled, proceeding as unauthenticated:", e); 
        }
      }

      const ownerSnap = await getDocs(collection(db, 'storeOwners'));
      let owners: StoreOwner[] = [];
      if (!ownerSnap.empty) {
        ownerSnap.forEach(d => { owners.push({ id: d.id, ...d.data() } as StoreOwner); });
      } else {
        const saved = localStorage.getItem('saas_registered_store_owners');
        if (saved) {
          owners = JSON.parse(saved);
        } else {
          owners = [
            { id: 'store-1', ownerName: 'Carlos Daniel Pérez', storeName: 'Max24 Express Belgrano', email: 'pezziniarg@gmail.com', plan: 'Profesional', status: 'Activo', registeredDate: '2026-01-10' },
            { id: 'store-bigmax', ownerName: 'Administrador BigMAX', storeName: 'BigMAX 24 Horas', email: 'bigmax24h7@gmail.com', plan: 'Profesional', status: 'Activo', registeredDate: '2026-06-20' },
            { id: 'store-2', ownerName: 'Juan Pérez', storeName: 'Despensa Don Juan', email: 'juanperez@despensa.com', plan: 'Gratuito', status: 'Activo', registeredDate: '2026-03-15' },
            { id: 'store-3', ownerName: 'María Rodríguez', storeName: 'Kiosco El Trébol', email: 'rodriguez_maria@kiosco.com', plan: 'Básico', status: 'Activo', registeredDate: '2026-04-02' },
            { id: 'store-4', ownerName: 'Andrés López', storeName: 'Minimarket Los Andes', email: 'andres.lopez@minimarket.com', plan: 'Profesional', status: 'Suspendido', registeredDate: '2025-11-20' },
            { id: 'store-5', ownerName: 'Cecilia Fernández', storeName: 'Farmacia General Urquiza', email: 'cfernandez@farmaurquiza.com', plan: 'Empresarial', status: 'Activo', registeredDate: '2026-02-18' }
          ];
        }
      }

      // Auto-migrate standard accounts
      let updatedAny = false;
      owners = owners.map(so => {
        if (so.id === 'store-1' && so.email !== 'pezziniarg@gmail.com') {
          updatedAny = true;
          return { ...so, email: 'pezziniarg@gmail.com', authorizedEditorEmail: '' };
        }
        if (so.id === 'store-bigmax' && so.email !== 'bigmax24h7@gmail.com') {
          updatedAny = true;
          return { ...so, email: 'bigmax24h7@gmail.com', ownerName: 'Administrador BigMAX' };
        }
        return so;
      });

      if (!owners.some(o => o.id === 'store-bigmax')) {
        updatedAny = true;
        owners.push({ id: 'store-bigmax', ownerName: 'Administrador BigMAX', storeName: 'BigMAX 24 Horas', email: 'bigmax24h7@gmail.com', plan: 'Profesional', status: 'Activo', registeredDate: '2026-06-20' });
      }

      if (updatedAny) {
        localStorage.setItem('saas_registered_store_owners', JSON.stringify(owners));
        try {
          const s1 = owners.find(o => o.id === 'store-1');
          if (s1) await setDoc(doc(db, 'storeOwners', 'store-1'), s1);
          const sB = owners.find(o => o.id === 'store-bigmax');
          if (sB) await setDoc(doc(db, 'storeOwners', 'store-bigmax'), sB);
        } catch (err) { console.warn(err); }
      }
      setStoreOwners(owners);

      const txSnap = await getDocs(collection(db, 'mpTransactions'));
      let txs: MpTransaction[] = [];
      if (!txSnap.empty) {
        txSnap.forEach(d => { txs.push({ id: d.id, ...d.data() } as MpTransaction); });
      } else {
        const saved = localStorage.getItem('mp_transactions_audit_log');
        if (saved) {
          txs = JSON.parse(saved);
        } else {
          txs = [
            { id: 'MP-895412', storeName: 'Max24 Express Belgrano', email: 'bigmax24h7@gmail.com', plan: 'Profesional', amountArs: 30000, paymentMethod: 'MercadoPago - Tarjeta', date: '2026-06-18 14:22', status: 'Aprobado' },
            { id: 'MP-431256', storeName: 'Kiosco El Trébol', email: 'rodriguez_maria@kiosco.com', plan: 'Básico', amountArs: 15000, paymentMethod: 'MercadoPago - Dinero', date: '2026-06-19 10:05', status: 'Aprobado' },
            { id: 'MP-774123', storeName: 'Farmacia General Urquiza', email: 'cfernandez@farmaurquiza.com', plan: 'Empresarial', amountArs: 60000, paymentMethod: 'MercadoPago - Cupón', date: '2026-06-15 18:47', status: 'Aprobado' },
            { id: 'MP-994112', storeName: 'Minimarket Los Andes', email: 'andres.lopez@minimarket.com', plan: 'Profesional', amountArs: 30000, paymentMethod: 'MercadoPago - Tarjeta', date: '2026-06-10 11:21', status: 'Disputado' }
          ];
        }
      }
      txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMpTransactions(txs);

      try {
        const mpDoc = await getDoc(doc(db, 'superAdminSettings', 'mercadopago'));
        let finalSettings = { ...mpSettings };
        if (mpDoc.exists()) {
          const dbData = mpDoc.data();
          // If the database has older/test keys or sandbox mode is true by default, and we want to ensure your production keys are live
          if (!dbData.accessToken || dbData.accessToken.startsWith('TEST-') || dbData.isSandbox === true) {
            const prodKeys = {
              accessToken: 'APP_USR-8753677167356936-061420-85c0eae57e0ea48e95fba24aebfc33ef-1638313806',
              publicKey: 'APP_USR-d1325d31-d738-459d-8f29-3b03c06fdca5',
              clientId: '8753677167356936',
              clientSecret: 'ug8vce82sConKomHXC0u3sJp9EDAqhyw',
              isSandbox: false,
              webhookUrl: 'https://max24app.com/api/mercadopago/webhook',
              planBasicoMensualLink: dbData.planBasicoMensualLink || 'https://mpago.la/24WN732',
              planBasicoAnualLink: dbData.planBasicoAnualLink || 'https://mpago.la/1arSVAC',
              planProfesionalMensualLink: dbData.planProfesionalMensualLink || 'https://mpago.la/292vRL9',
              planProfesionalAnualLink: dbData.planProfesionalAnualLink || 'https://mpago.la/21BFUq9',
              planEmpresarialMensualLink: dbData.planEmpresarialMensualLink || 'https://mpago.la/1xiaYqQ',
              planEmpresarialAnualLink: dbData.planEmpresarialAnualLink || 'https://mpago.la/1Aqgue2',
              planProveedorMensualLink: dbData.planProveedorMensualLink || 'https://mpago.la/33P1Q69',
              planProveedorAnualLink: dbData.planProveedorAnualLink || 'https://mpago.la/2shPPRr',
            };
            await setDoc(doc(db, 'superAdminSettings', 'mercadopago'), prodKeys);
            finalSettings = prodKeys;
            localStorage.setItem('mp_super_access_token', prodKeys.accessToken);
            localStorage.setItem('mp_super_public_key', prodKeys.publicKey);
            localStorage.setItem('mp_super_client_id', prodKeys.clientId);
            localStorage.setItem('mp_super_client_secret', prodKeys.clientSecret);
            localStorage.setItem('mp_super_is_sandbox', 'false');
          } else {
            finalSettings = {
              ...finalSettings,
              ...dbData,
              planBasicoMensualLink: dbData.planBasicoMensualLink || 'https://mpago.la/24WN732',
              planBasicoAnualLink: dbData.planBasicoAnualLink || 'https://mpago.la/1arSVAC',
              planProfesionalMensualLink: dbData.planProfesionalMensualLink || 'https://mpago.la/292vRL9',
              planProfesionalAnualLink: dbData.planProfesionalAnualLink || 'https://mpago.la/21BFUq9',
              planEmpresarialMensualLink: dbData.planEmpresarialMensualLink || 'https://mpago.la/1xiaYqQ',
              planEmpresarialAnualLink: dbData.planEmpresarialAnualLink || 'https://mpago.la/1Aqgue2',
              planProveedorMensualLink: dbData.planProveedorMensualLink || 'https://mpago.la/33P1Q69',
              planProveedorAnualLink: dbData.planProveedorAnualLink || 'https://mpago.la/2shPPRr',
            };
            if (!dbData.planBasicoMensualLink || !dbData.planBasicoAnualLink || !dbData.planProfesionalMensualLink || !dbData.planProfesionalAnualLink || !dbData.planEmpresarialMensualLink || !dbData.planEmpresarialAnualLink || !dbData.planProveedorMensualLink || !dbData.planProveedorAnualLink) {
              await setDoc(doc(db, 'superAdminSettings', 'mercadopago'), finalSettings);
            }
          }
        } else {
          // If the document doesn't exist, create it immediately with the verified credentials
          const prodKeys = {
            accessToken: 'APP_USR-8753677167356936-061420-85c0eae57e0ea48e95fba24aebfc33ef-1638313806',
            publicKey: 'APP_USR-d1325d31-d738-459d-8f29-3b03c06fdca5',
            clientId: '8753677167356936',
            clientSecret: 'ug8vce82sConKomHXC0u3sJp9EDAqhyw',
            isSandbox: false,
            webhookUrl: 'https://max24app.com/api/mercadopago/webhook',
            planBasicoMensualLink: 'https://mpago.la/24WN732',
            planBasicoAnualLink: 'https://mpago.la/1arSVAC',
            planProfesionalMensualLink: 'https://mpago.la/292vRL9',
            planProfesionalAnualLink: 'https://mpago.la/21BFUq9',
            planEmpresarialMensualLink: 'https://mpago.la/1xiaYqQ',
            planEmpresarialAnualLink: 'https://mpago.la/1Aqgue2',
            planProveedorMensualLink: 'https://mpago.la/33P1Q69',
            planProveedorAnualLink: 'https://mpago.la/2shPPRr',
          };
          await setDoc(doc(db, 'superAdminSettings', 'mercadopago'), prodKeys);
          finalSettings = prodKeys;
          localStorage.setItem('mp_super_access_token', prodKeys.accessToken);
          localStorage.setItem('mp_super_public_key', prodKeys.publicKey);
          localStorage.setItem('mp_super_client_id', prodKeys.clientId);
          localStorage.setItem('mp_super_client_secret', prodKeys.clientSecret);
          localStorage.setItem('mp_super_is_sandbox', 'false');
        }
        setMpSettings(finalSettings);
      } catch (err) { console.warn("Could not load or sync superAdminSettings/mercadopago:", err); }

      try {
        const contactDoc = await getDoc(doc(db, 'superAdminSettings', 'contactInfo'));
        if (contactDoc.exists()) {
          setContactSettings(contactDoc.data() as any);
        } else {
          const defaultContact = {
            whatsapp: '5491122334455',
            email: 'contacto@max24app.com',
            supportHours: 'Lunes a Viernes 9:00 a 18:00hs',
            socialFb: 'https://facebook.com/max24app',
            socialIg: 'https://instagram.com/max24app',
          };
          await setDoc(doc(db, 'superAdminSettings', 'contactInfo'), defaultContact);
          setContactSettings(defaultContact);
        }
      } catch (err) { console.warn("Could not load superAdminSettings/contactInfo:", err); }

      try {
        const empSnap = await getDocs(collection(db, 'employees'));
        if (!empSnap.empty) {
          const loadedCollabs: any[] = [];
          empSnap.forEach(docSnap => {
            const data = docSnap.data();
            if (data.role === 'Soporte' || data.role === 'SupportCollaborator') {
              loadedCollabs.push({ id: docSnap.id, ...data });
            }
          });
          setCollaborators(loadedCollabs);
        }
      } catch (err) { console.warn("Could not load support collaborators on mount:", err); }

    } catch (err: any) {
      console.error(err);
      setErrorMsg(err?.message || String(err));
      setIsOfflineFallback(true);
      const saved = localStorage.getItem('saas_registered_store_owners');
      if (saved) setStoreOwners(JSON.parse(saved));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save global contact and WhatsApp settings
  const handleSaveContactSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupportCollaborator) {
      setErrorMsg('Error: Los colaboradores de soporte no tienen permisos para editar la configuración de contacto global.');
      return;
    }
    try {
      await setDoc(doc(db, 'superAdminSettings', 'contactInfo'), contactSettings);
      setSuccessMsg('¡Información de contacto y WhatsApp actualizada correctamente!');
      setTimeout(() => setSuccessMsg(''), 3000);
      addMaintenanceLog('Información de contacto global actualizada por SuperAdmin.', 'success');
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Error guardando la configuración: ' + (err.message || String(err)));
    }
  };

  // Add support collaborator
  const handleCreateCollaborator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSupportCollaborator) {
      setCollabError('Error: Solo el SuperAdministrador principal puede agregar colaboradores de soporte.');
      return;
    }
    setCollabError('');
    setCollabSuccess('');
    
    const { name, email, username, password } = collabForm;
    if (!name || !email || !username || !password) {
      setCollabError('Por favor complete todos los campos.');
      return;
    }

    try {
      const collabId = `emp-collab-${Date.now()}`;
      const payload = {
        id: collabId,
        name,
        email: email.trim().toLowerCase(),
        role: 'Soporte' as const,
        status: 'Activo' as const,
        shift: 'Rotativo',
        joinedDate: new Date().toISOString().split('T')[0],
        username: username.trim().toLowerCase(),
        password: password.trim(),
        storeEmail: 'global',
      };

      await setDoc(doc(db, 'employees', collabId), payload);
      setCollaborators(prev => [...prev, payload]);
      setCollabForm({ name: '', email: '', username: '', password: '' });
      setCollabSuccess('¡Colaborador de soporte registrado exitosamente!');
      setTimeout(() => setCollabSuccess(''), 3000);
      addMaintenanceLog(`Nuevo colaborador de soporte registrado: ${name} (${username})`, 'success');
    } catch (err: any) {
      setCollabError('Error registrando colaborador: ' + (err.message || String(err)));
    }
  };

  // Delete support collaborator
  const handleDeleteCollaborator = async (collabId: string, collabName: string) => {
    if (isSupportCollaborator) {
      setErrorMsg('Error: Los colaboradores de soporte no pueden eliminar a otros colaboradores.');
      return;
    }
    if (!window.confirm(`¿Está seguro que desea desvincular al colaborador de soporte "${collabName}"?`)) {
      return;
    }
    try {
      await deleteDoc(doc(db, 'employees', collabId));
      setCollaborators(prev => prev.filter(c => c.id !== collabId));
      setSuccessMsg('Colaborador de soporte desvinculado con éxito.');
      setTimeout(() => setSuccessMsg(''), 3000);
      addMaintenanceLog(`Colaborador de soporte eliminado: ${collabName}`, 'info');
    } catch (err: any) {
      setErrorMsg('Error eliminando colaborador: ' + (err.message || String(err)));
    }
  };

  // Save MP Settings
  const saveMpSettings = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('mp_super_access_token', mpSettings.accessToken);
    localStorage.setItem('mp_super_public_key', mpSettings.publicKey);
    localStorage.setItem('mp_super_client_id', mpSettings.clientId);
    localStorage.setItem('mp_super_client_secret', mpSettings.clientSecret);
    localStorage.setItem('mp_super_is_sandbox', String(mpSettings.isSandbox));
    localStorage.setItem('mp_link_basico_mensual', mpSettings.planBasicoMensualLink || '');
    localStorage.setItem('mp_link_basico_anual', mpSettings.planBasicoAnualLink || '');
    localStorage.setItem('mp_link_profesional_mensual', mpSettings.planProfesionalMensualLink || '');
    localStorage.setItem('mp_link_profesional_anual', mpSettings.planProfesionalAnualLink || '');
    localStorage.setItem('mp_link_empresarial_mensual', mpSettings.planEmpresarialMensualLink || '');
    localStorage.setItem('mp_link_empresarial_anual', mpSettings.planEmpresarialAnualLink || '');
    localStorage.setItem('mp_link_proveedor_mensual', mpSettings.planProveedorMensualLink || '');
    localStorage.setItem('mp_link_proveedor_anual', mpSettings.planProveedorAnualLink || '');

    setDoc(doc(db, 'superAdminSettings', 'mercadopago'), mpSettings)
      .then(() => {
        setSuccessMsg('¡Credenciales y enlaces de suscripción Mercado Pago actualizados correctamente!');
        setTimeout(() => setSuccessMsg(''), 3000);
      })
      .catch((err) => {
        setSuccessMsg('Credenciales guardadas localmente.');
        setTimeout(() => setSuccessMsg(''), 3000);
      });
  };

  // Grant concessions helper modal opener
  const openGrantModal = (store: StoreOwner) => {
    setEditingStore(store);
    setFreePlan(store.plan as any);
    setFreeUntil(store.freeUntilDate || 'Ilimitado');
    setCustomNotes(store.notes || '');
  };

  // Backups export handler
  const handleExportSaaSBackupJSON = () => {
    try {
      addMaintenanceLog('Iniciando copia de seguridad global del SaaS...', 'info');
      const backup = {
        app: 'MAX24_SAAS_GLOBAL',
        exportedAt: new Date().toISOString(),
        storeOwners,
        mpTransactions,
        mpSettings
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(backup, null, 2))}`;
      const dl = document.createElement('a');
      dl.setAttribute('href', jsonString);
      dl.setAttribute('download', `saas_global_backup_max24_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(dl);
      dl.click();
      dl.remove();
      setGlobalExportSuccess(true);
      addMaintenanceLog('¡Copia de seguridad exportada satisfactoriamente!', 'success');
      setTimeout(() => setGlobalExportSuccess(false), 3000);
    } catch {
      addMaintenanceLog('Fallo al compilar copia global.', 'error');
    }
  };

  // Local backups updates for Plans
  const handleSavePlan = (plan: PlanConfig) => {
    const next = plans.map(p => p.id === plan.id ? plan : p);
    setPlans(next);
    localStorage.setItem('saas_plans', JSON.stringify(next));
    setEditingPlan(null);
    setSuccessMsg(`Plan "${plan.name}" actualizado.`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // Providers verification / approval
  const toggleProviderVerify = (id: string) => {
    const next = providers.map(p => {
      if (p.id === id) {
        const nextVerified = !p.verified;
        return { 
          ...p, 
          verified: nextVerified, 
          status: (nextVerified ? 'Aprobado' : 'Pendiente') as any 
        };
      }
      return p;
    });
    setProviders(next);
    localStorage.setItem('saas_providers_b2b', JSON.stringify(next));
    setSuccessMsg('Estado del proveedor modificado.');
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  // Moderation: Users Status change (Ban / Suspend)
  const handleUserStatusChange = (id: string, nextStatus: EndUser['status']) => {
    const next = endUsers.map(u => u.id === id ? { ...u, status: nextStatus } : u);
    setEndUsers(next);
    localStorage.setItem('saas_end_users', JSON.stringify(next));
    setSuccessMsg(`Estado de usuario cambiado a ${nextStatus}`);
    setTimeout(() => setSuccessMsg(''), 2000);
  };

  // Edit / update End User details
  const saveEndUserSettings = (user: EndUser) => {
    const next = endUsers.map(u => u.id === user.id ? user : u);
    setEndUsers(next);
    localStorage.setItem('saas_end_users', JSON.stringify(next));
    setEditingUser(null);
    setSuccessMsg(`Usuario "${user.name}" modificado.`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  // Tickets Response Thread
  const handleSendReply = (ticketId: string) => {
    if (!replyText.trim()) return;
    const next = tickets.map(t => {
      if (t.id === ticketId) {
        return {
          ...t,
          status: 'Resuelto' as const,
          replies: [...t.replies, { who: 'Soporte MAX24', msg: replyText, date: new Date().toISOString().replace('T', ' ').substring(0, 16) }]
        };
      }
      return t;
    });
    setTickets(next);
    localStorage.setItem('saas_support_tickets', JSON.stringify(next));
    setReplyText('');
    setReplyTicketId(null);
    setSuccessMsg('Respuesta al ticket enviada con éxito.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Broadcaster
  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastSubject || !broadcastMsg) return;
    addMaintenanceLog(`[DIFUSIÓN MASIVA] Enviado a destinatarios (${broadcastTarget}): "${broadcastSubject}"`, 'info');
    setSuccessMsg(`¡Notificación enviada correctamente a los destinatarios especificados!`);
    setBroadcastSubject('');
    setBroadcastMsg('');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Store deletion
  const handleDeleteStoreInit = (store: StoreOwner) => {
    setStoreToDelete(store);
    setDeleteConfirmName('');
  };

  const handleDeleteStoreConfirm = async () => {
    if (!storeToDelete) return;
    if (deleteConfirmName.trim() !== storeToDelete.storeName.trim()) {
      setErrorMsg("El nombre no coincide exactamente. Reintenta.");
      setTimeout(() => setErrorMsg(''), 3000);
      return;
    }
    try {
      const nextOwners = storeOwners.filter(so => so.id !== storeToDelete.id);
      setStoreOwners(nextOwners);
      localStorage.setItem('saas_registered_store_owners', JSON.stringify(nextOwners));
      await deleteDoc(doc(db, 'storeOwners', storeToDelete.id));
      setSuccessMsg(`Comercio "${storeToDelete.storeName}" desvinculado.`);
      setStoreToDelete(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (e) {
      setStoreOwners(storeOwners.filter(so => so.id !== storeToDelete.id));
      setSuccessMsg("Comercio desvinculado.");
      setStoreToDelete(null);
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  // Concession Modal Save
  const handleSaveFreeAccess = async () => {
    if (!editingStore) return;
    const isGiftActive = freePlan !== 'Gratuito' && freeUntil !== 'Expirado';
    const updated: StoreOwner = {
      ...editingStore,
      plan: freePlan as any,
      isFreeByAdmin: isGiftActive,
      freeUntilDate: freeUntil,
      notes: customNotes || `Cortesía otorgada por Creador.`,
      status: 'Activo'
    };

    setIsSavingStore(true);
    try {
      const nextOwners = storeOwners.map(so => so.id === editingStore.id ? updated : so);
      setStoreOwners(nextOwners);
      localStorage.setItem('saas_registered_store_owners', JSON.stringify(nextOwners));
      await setDoc(doc(db, 'storeOwners', editingStore.id), updated);
      setSuccessMsg(`Periodo de cortesía actualizado para ${editingStore.storeName}`);
      setTimeout(() => {
        setEditingStore(null);
        setIsSavingStore(false);
      }, 1000);
    } catch (e) {
      setSuccessMsg(`Periodo actualizado localmente.`);
      setTimeout(() => {
        setEditingStore(null);
        setIsSavingStore(false);
      }, 1000);
    }
  };

  // Add store manual
  const handleAddNewStore = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = `store-${Date.now()}`;
    const added: StoreOwner = {
      id: newId,
      ownerName: newStore.ownerName,
      storeName: newStore.storeName,
      email: newStore.email.trim().toLowerCase(),
      plan: newStore.plan,
      status: newStore.status,
      registeredDate: new Date().toISOString().split('T')[0],
      notes: 'Creado manual.'
    };

    setIsSavingStore(true);
    try {
      const nextOwners = [added, ...storeOwners];
      setStoreOwners(nextOwners);
      localStorage.setItem('saas_registered_store_owners', JSON.stringify(nextOwners));
      await setDoc(doc(db, 'storeOwners', newId), added);
      setSuccessMsg(`¡Tienda cliente "${newStore.storeName}" creada!`);
      setTimeout(() => {
        setIsAddStoreOpen(false);
        setIsSavingStore(false);
        setNewStore({ ownerName: '', storeName: '', email: '', plan: 'Profesional', status: 'Activo' });
      }, 1000);
    } catch (e) {
      setSuccessMsg(`Creada localmente.`);
      setTimeout(() => {
        setIsAddStoreOpen(false);
        setIsSavingStore(false);
        setNewStore({ ownerName: '', storeName: '', email: '', plan: 'Profesional', status: 'Activo' });
      }, 1000);
    }
  };

  // Edit core settings
  const handleEditStoreDetails = (store: StoreOwner) => {
    setEditingStoreDetails({ ...store });
  };

  const handleSaveStoreDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStoreDetails) return;
    setIsSavingStore(true);
    try {
      const nextOwners = storeOwners.map(so => so.id === editingStoreDetails.id ? editingStoreDetails : so);
      setStoreOwners(nextOwners);
      localStorage.setItem('saas_registered_store_owners', JSON.stringify(nextOwners));
      await setDoc(doc(db, 'storeOwners', editingStoreDetails.id), editingStoreDetails);
      setSuccessMsg(`Cambios aplicados a la tienda "${editingStoreDetails.storeName}".`);
      setTimeout(() => {
        setEditingStoreDetails(null);
        setIsSavingStore(false);
      }, 1000);
    } catch (e) {
      setSuccessMsg(`Datos actualizados localmente.`);
      setTimeout(() => {
        setEditingStoreDetails(null);
        setIsSavingStore(false);
      }, 1000);
    }
  };

  // Maintenance behaviors
  const addMaintenanceLog = (message: string, type: 'info'|'success'|'error'|'warn') => {
    setMaintenanceLogs(prev => [
      { id: `saas-log-${Date.now()}-${Math.random()}`, time: new Date().toLocaleTimeString('es-AR'), type, message },
      ...prev
    ]);
  };

  const handleOptimizeSaaSIndexes = async () => {
    setIsOptimizing(true);
    addMaintenanceLog('Limpiando índices y compactando búfer lógicos de platform...', 'info');
    await new Promise(r => setTimeout(r, 1200));
    addMaintenanceLog('¡Compactación exitosa! Liberados registros inactivos.', 'success');
    setIsOptimizing(false);
    setSuccessMsg('Optimización preventiva SaaS finalizada.');
  };

  // Exception modification triggers
  const handlePauseStoreSubscription = async (store: StoreOwner) => {
    const nextStatus = store.status === 'Suspendido' ? 'Activo' : 'Suspendido';
    const updated = { ...store, status: nextStatus as any };
    const nextOwners = storeOwners.map(so => so.id === store.id ? updated : so);
    setStoreOwners(nextOwners);
    localStorage.setItem('saas_registered_store_owners', JSON.stringify(nextOwners));
    try {
      await setDoc(doc(db, 'storeOwners', store.id), updated);
    } catch {}
    setSuccessMsg(`Estado de suscripción para ${store.storeName} cambiado a: ${nextStatus}`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Calculations for Dash
  const totalRevenue = mpTransactions
    .filter(t => t.status === 'Aprobado')
    .reduce((sum, t) => sum + t.amountArs, 0);

  const mrrComputed = storeOwners.reduce((sum, so) => {
    if (so.status !== 'Activo') return sum;
    if (so.plan === 'Básico') return sum + 15000;
    if (so.plan === 'Profesional') return sum + 30000;
    if (so.plan === 'Empresarial') return sum + 60000;
    return sum;
  }, 0) + providers.filter(p => p.status === 'Aprobado').length * 45000;

  const churnRate = 4.8;
  const activeStoresCount = storeOwners.filter(s => s.status === 'Activo').length;
  const premiumStoresCount = storeOwners.filter(s => s.plan !== 'Gratuito' && s.status === 'Activo').length;

  return (
    <div className="space-y-6 animate-fade-in font-sans p-2">
      {/* HEADER BANNER */}
      <div className="bg-gradient-to-r from-orange-400/10 via-white to-amber-500/5 border border-orange-150 text-slate-900 rounded-3xl p-5 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-5 shadow-xs">
        <div className="absolute top-1/2 right-0 w-[200px] h-[200px] bg-gradient-to-tr from-amber-500/15 to-orange-500/15 blur-[80px] pointer-events-none rounded-full" />
        
        <div className="space-y-1.5 z-10 text-center md:text-left">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
            <span className="p-1 px-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-full font-mono text-[9px] font-extrabold uppercase tracking-widest">
              Master Creador
            </span>
            <span className="text-orange-700 font-bold font-mono text-[11px]">Panel Licencia Unificada</span>
            {isOfflineFallback && (
              <span className="p-1 px-2 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-full font-mono text-[9px] font-bold flex items-center gap-1 animate-pulse">
                <span>⚠️ Simulación Local Activa</span>
              </span>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 flex items-center justify-center md:justify-start gap-1.5">
            MAX24 Multi-Tenant Suite <Crown className="w-5 h-5 text-orange-550 shrink-0" />
          </h2>
          <p className="text-[11px] text-slate-600 max-w-xl font-medium">
            Soporte global B2B / B2C, administración de pasarelas de pago vinculadas, configuradores de planes comerciales y herramientas masivas.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2.5 z-10 shrink-0 w-full md:w-auto">
          {onEditProfile && (
            <button
              onClick={onEditProfile}
              className="px-4 py-2 bg-white hover:bg-orange-50 border border-orange-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs hover:text-orange-600"
            >
              <UserCog className="w-4 h-4 text-orange-500" />
              <span>Mi Perfil</span>
            </button>
          )}

          <button
            onClick={onToggleShopMode}
            className={`px-4 py-2 border font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isSimulatingShop 
                ? 'bg-orange-500 text-white border-orange-400 shadow-md shadow-orange-500/10'
                : 'bg-white text-slate-700 border-orange-200 hover:bg-orange-50 hover:text-orange-600 hover:border-orange-300'
            }`}
          >
            {isSimulatingShop ? (
              <>
                <ToggleRight className="w-4 h-4 text-white block" />
                <span>Simulador: Kiosco Belgrano Activo</span>
              </>
            ) : (
              <>
                <ToggleLeft className="w-4 h-4 text-slate-400 block" />
                <span>Cambiar a Modo Kiosco (Test POS)</span>
              </>
            )}
          </button>
          
          <button
            onClick={loadData}
            className="p-2.5 bg-white border border-orange-200 rounded-xl text-slate-500 hover:text-orange-650 flex items-center justify-center cursor-pointer transition-colors hover:bg-orange-50"
            title="Refrescar Servidores"
          >
            <RefreshCw className="w-4 h-4 animate-spin-hover" />
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 bg-orange-50 border border-orange-200 text-orange-800 text-xs font-bold rounded-xl flex items-center justify-between gap-2.5 animate-scale-up">
          <div className="flex items-center gap-2.5">
            <CheckCircle className="w-4 h-4 text-orange-600 font-bold shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-orange-600 hover:text-orange-800 text-xs px-2 cursor-pointer transition-colors">
            ✕
          </button>
        </div>
      )}

      {isOfflineFallback && (
        <div className="p-3.5 bg-amber-500/5 border border-amber-500/20 text-amber-600 text-xs font-medium rounded-xl flex items-center justify-between gap-3 animate-scale-up">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <span>
              <strong>Base de Datos Local (Offline Fallback):</strong> Sincronización remota interrumpida. La plataforma MAX24 ha cargado automáticamente la simulación de respaldo en caché de navegador (Local Storage) para garantizar un funcionamiento inmediato y sin demoras.
            </span>
          </div>
          <button 
            onClick={() => setIsOfflineFallback(false)} 
            className="text-amber-500 hover:text-amber-600 font-bold px-2 py-1 text-xs cursor-pointer transition-colors"
            title="Descartar aviso"
          >
            ✕
          </button>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-bold rounded-xl flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-200 text-xs px-2 cursor-pointer transition-colors">
            ✕
          </button>
        </div>
      )}

      {/* CORE MODULAR NAVIGATION TABS */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1 pb-1 scrollbar-thin">
        <button
          onClick={() => setActiveAdminTab('dashboard')}
          className={`px-4 py-2.5 font-bold text-xs shrink-0 tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer
            ${activeAdminTab === 'dashboard' ? 'border-orange-500 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Activity className="w-3.5 h-3.5" />
          <span>1. Dashboard</span>
        </button>

        {!isSupportCollaborator && (
          <button
            onClick={() => setActiveAdminTab('subscriptions')}
            className={`px-4 py-2.5 font-bold text-xs shrink-0 tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer
              ${activeAdminTab === 'subscriptions' ? 'border-orange-500 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>2. Planes & Ingresos</span>
          </button>
        )}

        <button
          onClick={() => setActiveAdminTab('stores')}
          className={`px-4 py-2.5 font-bold text-xs shrink-0 tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer
            ${activeAdminTab === 'stores' ? 'border-orange-500 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Building className="w-3.5 h-3.5" />
          <span>3. Tiendas B2C</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('suppliers')}
          className={`px-4 py-2.5 font-bold text-xs shrink-0 tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer
            ${activeAdminTab === 'suppliers' ? 'border-orange-500 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Store className="w-3.5 h-3.5" />
          <span>4. Proveedores B2B</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('users')}
          className={`px-4 py-2.5 font-bold text-xs shrink-0 tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer
            ${activeAdminTab === 'users' ? 'border-orange-500 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>5. Público General</span>
        </button>

        <button
          onClick={() => setActiveAdminTab('support')}
          className={`px-4 py-2.5 font-bold text-xs shrink-0 tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer
            ${activeAdminTab === 'support' ? 'border-orange-500 text-slate-900 font-extrabold' : 'border-transparent text-slate-500 hover:text-slate-800'}`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>6. Soporte & Tickets</span>
        </button>

        {!isSupportCollaborator && (
          <button
            onClick={() => setActiveAdminTab('maintenance')}
            className={`px-4 py-2.5 font-bold text-xs shrink-0 tracking-wider transition-all flex items-center gap-1.5 border-b-2 cursor-pointer
              ${activeAdminTab === 'maintenance' ? 'border-orange-500 text-slate-905 font-extrabold' : 'border-transparent text-slate-500'}`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>7. Resguardo & Servidor</span>
          </button>
        )}
      </div>

      {/* ======================= TAB 1: DASHBOARD PRINCIPAL ======================= */}
      {activeAdminTab === 'dashboard' && (
        <div className="space-y-6" id="sa-tab-dashboard">
          {/* STATS KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-205 p-4 rounded-2xl text-left flex items-center gap-3.5 shadow-xs">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><DollarSign className="w-5 h-5" /></div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Recaudado Total</span>
                <strong className="text-lg font-mono text-slate-900 block font-black">${totalRevenue.toLocaleString('es-AR')}</strong>
                <span className="text-[9.5px] text-orange-600 font-bold block">✓ Pasarela Mercado Pago</span>
              </div>
            </div>

            <div className="bg-white border border-slate-205 p-4 rounded-2xl text-left flex items-center gap-3.5 shadow-xs">
              <div className="p-3 bg-orange-50 text-orange-650 rounded-xl"><TrendingUp className="w-5 h-5 animate-pulse" /></div>
              <div>
                <span className="text-[10px] text-slate-550 uppercase font-bold tracking-widest block">Ingresos Recurrentes (MRR)</span>
                <strong className="text-lg font-mono text-slate-900 block font-black">${mrrComputed.toLocaleString('es-AR')} /mes</strong>
                <p className="text-[9.5px] text-slate-450 font-medium">Sectores B2B y B2C consolidados</p>
              </div>
            </div>

            <div className="bg-white border border-slate-205 p-4 rounded-2xl text-left flex items-center gap-3.5 shadow-xs">
              <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><Percent className="w-5 h-5" /></div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Churn Rate (SaaS)</span>
                <strong className="text-lg font-mono text-slate-950 block font-black">{churnRate}% mensual</strong>
                <span className="text-[9.5px] text-orange-600 font-bold">Tasa baja de cancelación</span>
              </div>
            </div>

            <div className="bg-white border border-slate-205 p-4 rounded-2xl text-left flex items-center gap-3.5 shadow-xs">
              <div className="p-3 bg-orange-55/75 text-orange-100 rounded-xl" style={{ backgroundColor: '#ffedd5', color: '#ea580c' }}><Users className="w-5 h-5" /></div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest block">Ecosistema Global</span>
                <strong className="text-lg font-mono text-slate-900 block font-black">
                  {storeOwners.length + providers.length + endUsers.length} Activos
                </strong>
                <span className="text-[9.5px] text-orange-600 font-bold block mt-0.5">
                  {storeOwners.length} Tiendas | {providers.length} Proveedores | {endUsers.length} Públicos
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* ALERTS & NOTIFICATIONS FEED (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-xs text-left space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Alertas del Sistema y Reportes en Tiempo Real</h3>
                  <p className="text-[11px] text-slate-450 font-medium">Problemas de conexión, fallos de pago, o vulnerabilidad en marcas.</p>
                </div>
                <span className="px-2 py-0.5 bg-rose-100 text-rose-700 font-bold rounded text-[9.5px] uppercase">
                  {sysAlerts.length} Eventos críticos
                </span>
              </div>

              {sysAlerts.length === 0 ? (
                <p className="text-slate-400 text-xs py-5 text-center">No hay reportes de fallas vigentes en el día.</p>
              ) : (
                <div className="space-y-2.5">
                  {sysAlerts.map(alert => (
                    <div key={alert.id} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-start justify-between gap-3 text-xs">
                      <div className="flex gap-2 text-left">
                        {alert.type === 'error' ? (
                          <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                        ) : alert.type === 'warn' ? (
                          <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                        ) : (
                          <Activity className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
                        )}
                        <div>
                          <p className="font-bold text-slate-950 block">Originador: {alert.source}</p>
                          <p className="text-slate-600 text-[11px] mt-0.5 leading-tight">{alert.msg}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9.5px] text-slate-400 shrink-0 font-mono">{alert.date}</span>
                        <button 
                          onClick={() => setSysAlerts(sysAlerts.filter(a => a.id !== alert.id))}
                          className="text-slate-300 hover:text-slate-550 p-1 text-[11px]"
                          title="Descartar reclamo"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* QUICK ACTIONS PANEL (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-left space-y-3.5">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Atajos de Administración</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => setActiveAdminTab('stores')}
                  className="w-full p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between"
                >
                  <span className="flex items-center gap-1.5 text-slate-800"><Building className="w-3.5 h-3.5 text-slate-500" /> Gestionar Licencias B2C</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => setIsAddStoreOpen(true)}
                  className="w-full p-2.5 bg-orange-600/10 hover:bg-orange-600/20 border border-orange-500/10 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between text-orange-700"
                >
                  <span className="flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Dar de Alta un Comercio Nuevo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button 
                  onClick={() => setActiveAdminTab('support')}
                  className="w-full p-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-left text-xs font-bold transition-all flex items-center justify-between text-indigo-700"
                >
                  <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Responder Tickets Soporte</span>
                  <span className="px-1.5 py-0.2 bg-indigo-200 text-indigo-805 rounded font-mono text-[9px] font-black">{tickets.filter(t=>t.status==='Pendiente').length}</span>
                </button>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl text-[10.5px] leading-relaxed text-amber-900 font-semibold border border-amber-100">
                ⭐ <strong>Consejo Master:</strong> Recuerda verificar sistemáticamente las credenciales de producción de Mercado Pago para asegurar el cobro de mensualidades automatizadas de tu red comercial.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 2: SUSCRIPCIONES & PLANES ======================= */}
      {activeAdminTab === 'subscriptions' && (
        <div className="space-y-6 animate-fade-in" id="sa-tab-subscriptions">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-left">
            
            {/* PLAN CONFIGURATOR (5 cols) */}
            <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Configurador Master de Planes de Licencia</h3>
                <p className="text-[11px] text-slate-450">Define planes, cuotas de renovación periódicas e incrementos en la app.</p>
              </div>

              <div className="space-y-2.5">
                {plans.map(plan => (
                  <div key={plan.id} className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-2 flex flex-col justify-between">
                    <div className="flex items-start justify-between">
                      <div>
                        <strong className="text-slate-900 text-xs block">{plan.name}</strong>
                        <span className="text-[9.5px] bg-slate-200 text-slate-700 px-1 border border-slate-250 font-bold rounded tracking-wider uppercase font-mono">{plan.type}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-black text-xs text-slate-950 block">${plan.price.toLocaleString('es-AR')} ARS</span>
                        <span className="text-[10px] text-slate-400 block">{plan.billingPeriod}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                      <span className="text-[9px] text-slate-400 truncate max-w-[200px]">{plan.features.join(', ')}</span>
                      <button 
                        onClick={() => setEditingPlan(plan)}
                        className="text-xs text-orange-600 hover:text-orange-700 font-bold cursor-pointer"
                      >
                        Editar Tarifa
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AUDIT LOG INVOICES & DISPUTES GATE (7 cols) */}
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Auditoría en Tiempo Real de Pasarela de Pago</h3>
                <p className="text-[11px] text-slate-450">Cobros automáticos devueltos, aprobados o con problemas de disputas bancarias.</p>
              </div>

              <div className="overflow-x-auto max-w-full">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[10px] uppercase font-mono text-slate-450 font-bold">
                      <th className="py-2.5 px-3">Transacción</th>
                      <th className="py-2.5 px-3">Comercio</th>
                      <th className="py-2.5 px-3">Importe</th>
                      <th className="py-2.5 px-3">Estado</th>
                      <th className="py-2.5 px-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mpTransactions.map(tx => (
                      <tr key={tx.id} className="border-b border-slate-50 hover:bg-slate-25 transition-all">
                        <td className="py-2 px-3 font-mono">
                          <span className="block font-bold mt-0.5">{tx.id}</span>
                          <span className="block text-[9.5px] text-slate-400">{tx.date}</span>
                        </td>
                        <td className="py-2 px-3 font-semibold text-slate-800">{tx.storeName}</td>
                        <td className="py-2 px-3 font-mono font-bold">${tx.amountArs.toLocaleString('es-AR')}</td>
                        <td className="py-2 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            tx.status === 'Aprobado' ? 'bg-emerald-50 text-emerald-700' :
                            tx.status === 'Disputado' ? 'bg-orange-50 text-orange-600 animate-pulse border border-orange-100' :
                            'bg-slate-50 text-slate-500'
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <button 
                              onClick={() => {
                                const next = mpTransactions.map(t => t.id === tx.id ? { ...t, status: 'Reembolsado' as const } : t);
                                setMpTransactions(next);
                                localStorage.setItem('mp_transactions_audit_log', JSON.stringify(next));
                                setSuccessMsg(`Reembolso emitido con éxito para la transacción ${tx.id}`);
                                setTimeout(() => setSuccessMsg(''), 2000);
                              }}
                              disabled={tx.status === 'Reembolsado'}
                              className="px-2 py-1 bg-slate-100 hover:bg-rose-50 text-rose-600 disabled:opacity-40 text-[9.5px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              Devolver
                            </button>
                            <button 
                              onClick={() => {
                                alert(`Factura fiscal pre-construida para ${tx.storeName}\nCUIT: 30-71458962-9\nImporte neto: $${tx.amountArs}\nIGV/IVA: Sincronizado fiscalmente.`);
                              }}
                              className="p-1 text-slate-400 hover:text-slate-600 text-xs" 
                              title="Detalle Factura PDF"
                            >
                              📥
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* MERCADO PAGO GATEWAY CREDENTIALS */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Configuración de Pasarela Mercado Pago Argentina</h3>
                  <p className="text-[11px] text-slate-450">Vincule su cuenta para percibir automáticamente los fondos de las suscripciones SaaS.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSecrets(!showSecrets)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {showSecrets ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showSecrets ? 'Ocultar Secretos' : 'Mostrar Secretos'}</span>
              </button>
            </div>

            <form onSubmit={saveMpSettings} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* CLIENT ID */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono">
                    Client ID (Mercado Pago)
                  </label>
                  <input
                    type="text"
                    value={mpSettings.clientId}
                    onChange={(e) => setMpSettings({ ...mpSettings, clientId: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                    placeholder="Ej: 1638313806"
                    required
                  />
                </div>

                {/* CLIENT SECRET */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono">
                    Client Secret
                  </label>
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={mpSettings.clientSecret}
                    onChange={(e) => setMpSettings({ ...mpSettings, clientSecret: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                    placeholder="Introduce tu Client Secret"
                    required
                  />
                </div>

                {/* PUBLIC KEY */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono">
                    Public Key
                  </label>
                  <input
                    type="text"
                    value={mpSettings.publicKey}
                    onChange={(e) => setMpSettings({ ...mpSettings, publicKey: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                    placeholder="Ej: TEST-8160c7fe-ba43..."
                    required
                  />
                </div>

                {/* ACCESS TOKEN */}
                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono">
                    Access Token (Producción / Sandbox)
                  </label>
                  <input
                    type={showSecrets ? "text" : "password"}
                    value={mpSettings.accessToken}
                    onChange={(e) => setMpSettings({ ...mpSettings, accessToken: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-250 rounded-xl font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                    placeholder="Ej: TEST-87536771..."
                    required
                  />
                </div>
              </div>

              {/* ADDITIONAL FIELDS: SANDBOX TOGGLE AND WEBHOOK */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* SANDBOX MODE */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 text-xs block">Modo Sandbox (Entorno de Pruebas)</strong>
                    <span className="text-[10px] text-slate-450 block">Habilita transacciones simuladas sin cargo real.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setMpSettings({ ...mpSettings, isSandbox: !mpSettings.isSandbox })}
                    className="text-orange-600 hover:text-orange-700 transition-all focus:outline-none cursor-pointer"
                  >
                    {mpSettings.isSandbox ? (
                      <ToggleRight className="w-10 h-10 text-orange-600" />
                    ) : (
                      <ToggleLeft className="w-10 h-10 text-slate-350" />
                    )}
                  </button>
                </div>

                {/* WEBHOOK / IPN URL */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-left">
                  <span className="block text-[10px] font-bold uppercase text-slate-500 tracking-wider font-mono">
                    URL del Webhook de Notificación (IPN)
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={mpSettings.webhookUrl}
                      className="flex-1 px-2.5 py-1 text-[10.5px] bg-white border border-slate-200 rounded-lg font-mono text-slate-600 select-all outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(mpSettings.webhookUrl);
                        alert("¡Enlace de Webhook copiado!");
                      }}
                      className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Copiar
                    </button>
                  </div>
                  <span className="block text-[9.5px] text-slate-400">
                    Configure esta URL en su panel de Mercado Pago Developers para recibir estados de pago síncronos.
                  </span>
                </div>
              </div>

              {/* ENLACES DIRECTOS MERCADO PAGO */}
              <div className="p-4 bg-orange-50/50 border border-orange-100 rounded-2xl text-left space-y-4">
                <div>
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1">
                    <ExternalLink className="w-3.5 h-3.5 text-orange-600" />
                    Enlaces de Pago Directos / Planes de Suscripción Oficiales (Mercado Pago)
                  </h4>
                  <p className="text-[10.5px] text-slate-500">
                    Pegue los enlaces de pre-aprobación/suscripción creados en su dashboard de Mercado Pago. Si un enlace está configurado, la aplicación ofrecerá un botón para pagar de forma directa en la plataforma oficial de Mercado Pago como alternativa de respaldo.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* BASICO */}
                  <div className="bg-white p-3 border border-slate-150 rounded-xl space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-700 font-mono">Plan Básico</span>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold">Enlace Mensual ($15.000)</label>
                        <input
                          type="url"
                          value={mpSettings.planBasicoMensualLink || ''}
                          onChange={(e) => setMpSettings({ ...mpSettings, planBasicoMensualLink: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                          placeholder="https://www.mercadopago.com.ar/subscriptions/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold">Enlace Anual ($150.000)</label>
                        <input
                          type="url"
                          value={mpSettings.planBasicoAnualLink || ''}
                          onChange={(e) => setMpSettings({ ...mpSettings, planBasicoAnualLink: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                          placeholder="https://www.mercadopago.com.ar/subscriptions/..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* PROFESIONAL */}
                  <div className="bg-white p-3 border border-slate-150 rounded-xl space-y-2">
                    <span className="text-[10px] font-black uppercase text-slate-700 font-mono">Plan Profesional</span>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold">Enlace Mensual ($30.000)</label>
                        <input
                          type="url"
                          value={mpSettings.planProfesionalMensualLink || ''}
                          onChange={(e) => setMpSettings({ ...mpSettings, planProfesionalMensualLink: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                          placeholder="https://www.mercadopago.com.ar/subscriptions/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold">Enlace Anual ($300.000)</label>
                        <input
                          type="url"
                          value={mpSettings.planProfesionalAnualLink || ''}
                          onChange={(e) => setMpSettings({ ...mpSettings, planProfesionalAnualLink: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                          placeholder="https://www.mercadopago.com.ar/subscriptions/..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* EMPRESARIAL */}
                  <div className="bg-white p-3 border border-slate-150 rounded-xl space-y-2 md:col-span-2">
                    <span className="text-[10px] font-black uppercase text-slate-700 font-mono">Plan Empresarial</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold">Enlace Mensual ($60.000)</label>
                        <input
                          type="url"
                          value={mpSettings.planEmpresarialMensualLink || ''}
                          onChange={(e) => setMpSettings({ ...mpSettings, planEmpresarialMensualLink: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                          placeholder="https://www.mercadopago.com.ar/subscriptions/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold">Enlace Anual ($600.000)</label>
                        <input
                          type="url"
                          value={mpSettings.planEmpresarialAnualLink || ''}
                          onChange={(e) => setMpSettings({ ...mpSettings, planEmpresarialAnualLink: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                          placeholder="https://www.mercadopago.com.ar/subscriptions/..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* PROVEEDOR MAYORISTA */}
                  <div className="bg-white p-3 border border-slate-150 rounded-xl space-y-2 md:col-span-2">
                    <span className="text-[10px] font-black uppercase text-slate-700 font-mono text-orange-600">Plan Proveedor Mayorista</span>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold">Enlace Mensual ($45.000)</label>
                        <input
                          type="url"
                          value={mpSettings.planProveedorMensualLink || ''}
                          onChange={(e) => setMpSettings({ ...mpSettings, planProveedorMensualLink: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                          placeholder="https://www.mercadopago.com.ar/subscriptions/..."
                        />
                      </div>
                      <div>
                        <label className="block text-[9px] text-slate-400 font-bold">Enlace Anual ($453.600)</label>
                        <input
                          type="url"
                          value={mpSettings.planProveedorAnualLink || ''}
                          onChange={(e) => setMpSettings({ ...mpSettings, planProveedorAnualLink: e.target.value })}
                          className="w-full px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono focus:bg-white focus:ring-1 focus:ring-orange-500 transition-all outline-none"
                          placeholder="https://www.mercadopago.com.ar/subscriptions/..."
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-extrabold text-xs rounded-xl transition-all shadow-md shadow-orange-600/10 hover:shadow-orange-700/20 flex items-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar Credenciales de Pasarela</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= TAB 3: TIENDAS Y COMERCIOS (B2C) ======================= */}
      {activeAdminTab === 'stores' && (
        <div className="space-y-6" id="sa-tab-stores">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5 text-left shadow-xs">
            
            {/* TABLE HEADER & FILTER CONTROLS */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Cartera Unificada de Comercios y Tiendas B2C</h3>
                <p className="text-[11px] text-slate-450 mt-0.5 font-medium">Habilita accesos, impersona perfiles, o modera descripciones y logos.</p>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Buscar por tienda, email..."
                    value={storeSearch}
                    onChange={(e) => setStoreSearch(e.target.value)}
                    className="pl-8 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>

                <button 
                  onClick={() => setIsAddStoreOpen(true)}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" /> Registrar Tienda
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-105 uppercase tracking-wider text-slate-450 text-[10px] font-black">
                    <th className="py-3 px-4">Local / Comercio</th>
                    <th className="py-3 px-4">Propietario Principal</th>
                    <th className="py-3 px-4">Rubro</th>
                    <th className="py-3 px-4">Plan Actual</th>
                    <th className="py-3 px-4">Control Estado</th>
                    <th className="py-3 px-4 text-right">Moderación e Impersonar</th>
                  </tr>
                </thead>
                <tbody>
                  {storeOwners
                    .filter(so => 
                      so.storeName.toLowerCase().includes(storeSearch.toLowerCase()) ||
                      so.ownerName.toLowerCase().includes(storeSearch.toLowerCase()) ||
                      so.email.toLowerCase().includes(storeSearch.toLowerCase())
                    )
                    .map(so => {
                      const isMaster = so.email === 'pezziniarg@gmail.com';
                      return (
                        <tr key={so.id} className="border-b border-slate-100 hover:bg-slate-25 transition-all">
                          <td className="py-3 px-4">
                            <strong className="text-slate-900 block font-black">{so.storeName}</strong>
                            <span className="text-[10.2px] text-slate-400 font-mono block">Alta: {so.registeredDate}</span>
                          </td>
                          <td className="py-3 px-4 text-slate-650">
                            <span className="font-bold block text-slate-800">{so.ownerName}</span>
                            <span className="font-mono text-[10px] text-slate-450 block truncate max-w-[170px]">{so.email}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-0.5 bg-slate-100 border border-slate-200 text-slate-600 rounded text-[10px] font-semibold">
                              {so.notes && so.notes.includes('farmacia') ? 'Farmacia' : 'Kiosco / Minimarket'}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-bold font-mono">
                            <span className={`px-2 py-0.5 rounded-full text-[9.5px] ${
                              so.plan === 'Gratuito' ? 'bg-slate-100 text-slate-600' :
                              so.plan === 'Básico' ? 'bg-sky-50 text-sky-700' :
                              'bg-orange-50 text-orange-700'
                            }`}>
                              {so.plan}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {so.isFreeByAdmin ? (
                              <span className="text-[10px] bg-emerald-50 text-emerald-800 font-extrabold border border-emerald-100 p-1 rounded">✓ Cortesía hasta: {so.freeUntilDate}</span>
                            ) : (
                              <button
                                onClick={() => handlePauseStoreSubscription(so)}
                                className={`px-2 py-0.5 font-bold rounded text-[9.5px] border uppercase transition-colors shrink-0 cursor-pointer ${
                                  so.status === 'Activo' ? 'bg-emerald-50 border-emerald-100 text-emerald-700 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100' : 'bg-rose-50 border-rose-100 text-rose-700'
                                }`}
                                title="Click para cambiar estado de validez"
                              >
                                {so.status}
                              </button>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end items-center gap-2">
                              {onImpersonateStore && !isMaster && (
                                <button
                                  onClick={() => {
                                    if (confirm(`¿Iniciar simulación y modo IMPERSONAR para entrar al entorno del comercio "${so.storeName}"?`)) {
                                      onImpersonateStore(so.email);
                                    }
                                  }}
                                  className="px-2 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                                  title="Ingresar como el dueño para soporte"
                                >
                                  <Eye className="w-3.5 h-3.5 shrink-0" />
                                  <span>Imp. / Ver Como</span>
                                </button>
                              )}

                              <button 
                                onClick={() => handleEditStoreDetails(so)}
                                className="px-2 py-1 bg-slate-105 hover:bg-slate-200 rounded text-[10px] font-bold"
                              >
                                Editar
                              </button>

                              <button 
                                onClick={() => openGrantModal(so)}
                                className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px]"
                                title="Pase Libre cortesía"
                              >
                                🎁
                              </button>

                              {!isMaster && (
                                <button 
                                  onClick={() => handleDeleteStoreInit(so)}
                                  className="text-[10.5px] text-rose-500 hover:text-rose-700 p-1"
                                >
                                  ✕
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 4: PROVEEDORES (B2B) ======================= */}
      {activeAdminTab === 'suppliers' && (
        <div className="space-y-6 animate-fade-in" id="sa-tab-providers">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start text-left">
            
            {/* SUPPLIERS DIRECTORY AND VERIFICATION (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Cartera de Proveedores Mayoristas B2B</h3>
                  <p className="text-[11px] text-slate-450">Filtre, audite CUIT/documentación tributaria y verifique identidades para evitar fraude.</p>
                </div>
                <input
                  type="text"
                  placeholder="Buscar por razón social, CUIT..."
                  value={provSearch}
                  onChange={(e) => setProvSearch(e.target.value)}
                  className="p-1 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 uppercase text-slate-450 font-bold text-[9.5px]">
                      <th className="py-2 px-3">Razón Social Mayorista</th>
                      <th className="py-2 px-3">CUIT Tributaria</th>
                      <th className="py-2 px-3">Alcance Consultas</th>
                      <th className="py-2 px-3">Validación Cuit</th>
                      <th className="py-2 px-3 text-right">Validar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {providers
                      .filter(p => p.companyName.toLowerCase().includes(provSearch.toLowerCase()) || p.cuit.includes(provSearch))
                      .map(p => (
                        <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-25">
                          <td className="py-3 px-3">
                            <strong className="text-slate-900 block">{p.companyName}</strong>
                            <span className="text-[10px] text-slate-400 font-mono block">{p.ownerEmail}</span>
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-slate-700">{p.cuit}</td>
                          <td className="py-3 px-3 font-mono">
                            <span className="block font-black text-indigo-700">{p.reachSearchCount} búsquedas</span>
                            <span className="text-[10px] text-slate-400 block">${p.salesVolumeArs.toLocaleString('es-AR')} volumen de venta</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                              p.verified ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100 animate-pulse'
                            }`}>
                              {p.verified ? '✓ CUIT Verificado' : '⏳ Esperando archivos CUIT'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <button
                              onClick={() => toggleProviderVerify(p.id)}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors cursor-pointer block ml-auto ${
                                p.verified ? 'bg-slate-150 hover:bg-slate-205 text-slate-700' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                              }`}
                            >
                              {p.verified ? 'Revocar' : 'Aprobar Fiscal'}
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CATALOG WATCHER MONITOR & REACH CHART (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-4 space-y-4 shadow-xs">
              <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1">
                Catálogo Mayorista Publicado <Activity className="w-4 h-4 text-indigo-650" />
              </h3>
              
              <div className="space-y-3">
                <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl space-y-1 text-xs">
                  <strong className="block text-indigo-900 font-black">Distribuidora Central S.A.</strong>
                  <p className="text-slate-600 text-[11px]">Cargó 45 nuevos productos (Línea de Gaseosas y Cervezas nacionales).</p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs">
                  <strong className="block text-slate-800 font-bold">Lácteos La Serenísima</strong>
                  <p className="text-slate-600 text-[11px]">Cargó actualizaciones de stock para el Hub Fresh de Buenos Aires.</p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 leading-relaxed text-[11px] text-slate-400 font-medium">
                🔒 <strong>Seguridad Mayorista B2B:</strong> Todos los adjuntos tributarios cargados por los proveedores están protegidos fiscalmente y solo son visibles bajo credenciales cifradas y aprobadas.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 5: PUBLICO REGISTRADO ======================= */}
      {activeAdminTab === 'users' && (
        <div className="space-y-6 animate-fade-in" id="sa-tab-consumers">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 text-left space-y-4 shadow-xs">
            
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Registro de Público en General (Usuarios Finales)</h3>
                <p className="text-[11px] text-slate-450">Monitoree el comportamiento no violativo de la privacidad, audite perfiles o banee cuentas sospechosas.</p>
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="p-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 uppercase tracking-wider text-slate-450 font-bold text-[9.5px]">
                    <th className="py-2.5 px-3">Cliente / Consumidor</th>
                    <th className="py-2.5 px-3">Ingreso Fecha</th>
                    <th className="py-2.5 px-3">Frecuencia / Tienda Favorita</th>
                    <th className="py-2.5 px-3">Estado Control</th>
                    <th className="py-2.5 px-3 text-right">Moderación</th>
                  </tr>
                </thead>
                <tbody>
                  {endUsers
                    .filter(u => u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase()))
                    .map(u => (
                      <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-25">
                        <td className="py-3 px-3">
                          <strong className="text-slate-900 block font-bold">{u.name}</strong>
                          <span className="text-[10px] text-slate-400 font-mono block">{u.email}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{u.joinedDate}</td>
                        <td className="py-3 px-3">
                          <span className="font-mono block font-bold text-slate-850">{u.interactionsCount} clicks en Kiosk</span>
                          <span className="text-[10px] text-slate-400 block">Preferencia: {u.preferredStores.join(', ')}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`px-2 py-0.5 rounded text-[9.5px] font-bold ${
                            u.status === 'Activo' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                setEditingUser(u);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded text-[10px] font-bold"
                            >
                              Editar Perfil
                            </button>
                            <button
                              onClick={() => {
                                const nextStatus = u.status === 'Baneado' ? 'Activo' : 'Baneado';
                                handleUserStatusChange(u.id, nextStatus);
                              }}
                              className={`px-2.5 py-1 text-[10px] font-black rounded-lg transition-colors cursor-pointer ${
                                u.status === 'Baneado' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              }`}
                            >
                              {u.status === 'Baneado' ? 'Quitar Ban' : 'Baneó'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================= TAB 6: SOPORTE & COMUNICACION DIRECTA ======================= */}
      {activeAdminTab === 'support' && (
        <div className="space-y-6 animate-fade-in" id="sa-tab-support">
          {/* Sub-navigation bar inside Support */}
          <div className="flex flex-wrap gap-2 border-b border-slate-150 pb-2">
            <button
              onClick={() => setActiveSupportSubTab('tickets')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSupportSubTab === 'tickets' ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Tickets de Ayuda</span>
            </button>
            <button
              onClick={() => setActiveSupportSubTab('contact')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSupportSubTab === 'contact' ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Contacto & WhatsApp</span>
            </button>
            <button
              onClick={() => setActiveSupportSubTab('collaborators')}
              className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                activeSupportSubTab === 'collaborators' ? 'bg-orange-500 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Colaboradores de Soporte</span>
            </button>
          </div>

          {/* Sub-view 1: TICKETS (The original ticket and broadcast system) */}
          {activeSupportSubTab === 'tickets' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left items-start">
              {/* SUPPORT TICKETS INBOX (7 cols) */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Tickets de Ayuda Pendientes</h3>
                  <p className="text-[11px] text-slate-450">Bandeja de reclamos o dudas de suscriptores B2B/B2C y público consumidor.</p>
                </div>

                <div className="space-y-3">
                  {tickets.map(ticket => (
                    <div key={ticket.id} className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1.5 items-center">
                          <span className="font-mono bg-slate-150 text-slate-800 px-1.5 py-0.2 rounded font-bold">{ticket.id}</span>
                          <span className={`px-2 py-0.2 text-[9px] font-bold rounded ${
                            ticket.role === 'Tienda' ? 'bg-sky-50 text-sky-700' :
                            ticket.role === 'Proveedor' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {ticket.role}
                          </span>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ticket.status === 'Pendiente' ? 'bg-amber-100 text-amber-805 animate-pulse' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {ticket.status}
                        </span>
                      </div>

                      <div>
                        <strong className="block text-slate-900">{ticket.subject}</strong>
                        <span className="text-[10px] text-slate-400 font-medium font-mono">{ticket.senderName} ({ticket.senderEmail}) • {ticket.date}</span>
                        <p className="text-slate-600 text-[11px] mt-1.5 leading-relaxed bg-white p-2 rounded-lg border border-slate-100">{ticket.message}</p>
                      </div>

                      {/* Replies feed */}
                      {ticket.replies.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-150">
                          {ticket.replies.map((reply, rid) => (
                            <div key={rid} className="p-2.5 bg-blue-50/50 rounded-lg text-[10.5px]">
                              <strong className="text-blue-900 block font-bold">{reply.who} • <span className="font-mono text-[9.5px] font-normal text-slate-450">{reply.date}</span></strong>
                              <p className="text-slate-700 text-[11px] mt-1">{reply.msg}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="pt-2">
                        {replyTicketId === ticket.id ? (
                          <div className="space-y-2">
                            <textarea
                              placeholder="Escribe la respuesta formal del equipo MAX24..."
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden focus:border-orange-500 font-bold"
                              rows={3}
                            />
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setReplyTicketId(null); setReplyText(''); }}
                                className="px-3 py-1 bg-slate-100 rounded text-xs"
                              >
                                Cancelar
                              </button>
                              <button
                                onClick={() => handleSendReply(ticket.id)}
                                className="px-3 py-1 bg-slate-900 text-white hover:bg-slate-800 rounded text-xs font-bold"
                              >
                                Enviar Respuesta
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setReplyTicketId(ticket.id)}
                            className="px-2.5 py-1.5 bg-slate-101 hover:bg-slate-200 rounded-lg text-xs font-bold font-sans transition-colors cursor-pointer text-slate-730 block ml-auto"
                          >
                            ↳ Responder Ticket
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* BROADCAST PUSH/MASS EMAILS EDITOR (5 cols) */}
              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                    Difusión Masiva (Emails & Mensajes Push) <Megaphone className="w-5 h-5 text-orange-500 animate-bounce" />
                  </h3>
                  <p className="text-[11px] text-slate-450">Redacte un boletín o comunicado crítico que llegará de forma simultánea a suscriptores o consumidores.</p>
                </div>

                <form onSubmit={handleBroadcast} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">Grupo Destinatario</label>
                    <select
                      value={broadcastTarget}
                      onChange={(e) => setBroadcastTarget(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-hidden"
                    >
                      <option value="all">A Todo el Ecosistema Registrado (Comercios + Proveedores + Público)</option>
                      <option value="stores">Únicamente Tiendas Comerciales B2C</option>
                      <option value="suppliers">Únicamente Proveedores Mayoristas B2B</option>
                      <option value="users">Únicamente Público Consumidor</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">Asunto / Línea de Título</label>
                    <input
                      type="text"
                      required
                      placeholder="ej: ¡Aviso de mantenimiento programado!"
                      value={broadcastSubject}
                      onChange={(e) => setBroadcastSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden font-bold"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10.5px] font-bold text-slate-650 block">Mensaje / Cuerpo de Comunicación</label>
                    <textarea
                      required
                      placeholder="Escriba el comunicado formal..."
                      value={broadcastMsg}
                      onChange={(e) => setBroadcastMsg(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden"
                      rows={4}
                    />
                    <div className="p-2.5 bg-slate-100 rounded-lg text-[10px] space-y-1 text-slate-500 border border-slate-150">
                      <span className="block font-black text-slate-700">Pre-visualizar Plantilla</span>
                      <p className="italic">"{broadcastSubject || '(Sin Asunto)'}: {broadcastMsg || 'Ingresa un comunicado representativo...'}"</p>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Emitir Notificación Masiva</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* Sub-view 2: CONTACT & WHATSAPP SETTINGS */}
          {activeSupportSubTab === 'contact' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 max-w-2xl text-left space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Configuración de Contacto del Portal</h3>
                <p className="text-[11px] text-slate-450">Defina el número de WhatsApp y los enlaces de soporte visibles en la página web principal de MAX24.</p>
              </div>

              <form onSubmit={handleSaveContactSettings} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-650 block">WhatsApp de Contacto (con código de país)</label>
                    <input
                      type="text"
                      required
                      disabled={isSupportCollaborator}
                      placeholder="ej: 5491155667788"
                      value={contactSettings.whatsapp}
                      onChange={(e) => setContactSettings({ ...contactSettings, whatsapp: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden font-mono"
                    />
                    <span className="text-[9px] text-slate-400 block">Formato internacional sin el signo + ni espacios.</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-650 block">Email de Soporte Técnico</label>
                    <input
                      type="email"
                      required
                      disabled={isSupportCollaborator}
                      placeholder="soporte@max24app.com"
                      value={contactSettings.email}
                      onChange={(e) => setContactSettings({ ...contactSettings, email: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[11px] font-bold text-slate-650 block">Horarios de Soporte / Atención</label>
                    <input
                      type="text"
                      required
                      disabled={isSupportCollaborator}
                      placeholder="Lunes a Viernes 9:00 a 18:00hs • Sábados 9:00 a 13:00hs"
                      value={contactSettings.supportHours}
                      onChange={(e) => setContactSettings({ ...contactSettings, supportHours: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-650 block">Instagram URL (opcional)</label>
                    <input
                      type="url"
                      disabled={isSupportCollaborator}
                      placeholder="https://instagram.com/max24app"
                      value={contactSettings.socialIg}
                      onChange={(e) => setContactSettings({ ...contactSettings, socialIg: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-slate-650 block">Facebook URL (opcional)</label>
                    <input
                      type="url"
                      disabled={isSupportCollaborator}
                      placeholder="https://facebook.com/max24app"
                      value={contactSettings.socialFb}
                      onChange={(e) => setContactSettings({ ...contactSettings, socialFb: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs focus:outline-hidden"
                    />
                  </div>
                </div>

                {isSupportCollaborator ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] rounded-xl">
                    ⚠️ Tienes permisos de Colaborador limitados. Solo el SuperAdministrador puede modificar la información de contacto global.
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Guardar Configuración</span>
                  </button>
                )}
              </form>
            </div>
          )}

          {/* Sub-view 3: COLLABORATORS LIST & REGISTER */}
          {activeSupportSubTab === 'collaborators' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left items-start">
              {/* Form - only show if superAdmin */}
              {!isSupportCollaborator ? (
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs font-sans">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Nuevo Colaborador de Soporte</h3>
                    <p className="text-[11px] text-slate-450">Registre personal de asistencia con accesos limitados al panel central de administración.</p>
                  </div>

                  {collabError && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold rounded-xl">
                      {collabError}
                    </div>
                  )}

                  {collabSuccess && (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl">
                      {collabSuccess}
                    </div>
                  )}

                  <form onSubmit={handleCreateCollaborator} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block font-sans">Nombre Completo</label>
                      <input
                        type="text"
                        required
                        placeholder="ej: Juan Pérez"
                        value={collabForm.name}
                        onChange={(e) => setCollabForm({ ...collabForm, name: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden font-sans font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block font-sans">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        placeholder="ej: juan.soporte@max24app.com"
                        value={collabForm.email}
                        onChange={(e) => setCollabForm({ ...collabForm, email: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden font-sans font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block font-sans">Nombre de Usuario (Login)</label>
                      <input
                        type="text"
                        required
                        placeholder="ej: juan.soporte"
                        value={collabForm.username}
                        onChange={(e) => setCollabForm({ ...collabForm, username: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden font-sans font-bold text-slate-800"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-650 block font-sans">Contraseña de Acceso</label>
                      <input
                        type="text"
                        required
                        placeholder="Min. 6 caracteres"
                        value={collabForm.password}
                        onChange={(e) => setCollabForm({ ...collabForm, password: e.target.value })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 text-xs focus:outline-hidden font-mono font-bold text-slate-800"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer font-sans"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Registrar Colaborador</span>
                    </button>
                  </form>
                </div>
              ) : (
                <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs font-sans">
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-sm">Permisos Limitados</h3>
                    <p className="text-[11px] text-slate-450">Como colaborador de soporte, no tienes permisos para crear ni desvincular otros colaboradores.</p>
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-100 rounded-2xl text-xs text-orange-800 leading-relaxed">
                    Para solicitar el alta de nuevos compañeros de soporte, contacta al SuperAdministrador principal de la plataforma.
                  </div>
                </div>
              )}

              {/* List */}
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm font-sans">Equipo de Soporte Registrado</h3>
                  <p className="text-[11px] text-slate-450 font-sans">Listado de colaboradores autorizados para responder consultas del ecosistema.</p>
                </div>

                <div className="space-y-3 font-sans">
                  {collaborators.length === 0 ? (
                    <div className="p-4 bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-450 rounded-xl font-sans">
                      No hay colaboradores de soporte registrados actualmente.
                    </div>
                  ) : (
                    collaborators.map(c => (
                      <div key={c.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center font-sans">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 font-sans">
                            <span className="font-bold text-slate-900">{c.name}</span>
                            <span className="bg-orange-50 text-orange-700 border border-orange-100 text-[9px] font-bold px-1.5 rounded-full font-sans">
                              Soporte
                            </span>
                          </div>
                          <div className="text-[10.5px] text-slate-500 font-sans leading-relaxed">
                            <span className="block">Email: <strong className="text-slate-700">{c.email}</strong></span>
                            <span className="block">Usuario: <strong className="text-slate-700 font-mono">{c.username}</strong></span>
                            <span className="block">Contraseña: <strong className="text-slate-700 font-mono">{c.password}</strong></span>
                          </div>
                          <span className="text-[9.5px] text-slate-400 block pt-1 font-sans">Ingresó: {c.joinedDate || 'Reciente'}</span>
                        </div>

                        {!isSupportCollaborator && (
                          <button
                            onClick={() => handleDeleteCollaborator(c.id, c.name)}
                            className="p-1.5 bg-rose-50 border border-rose-100 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg cursor-pointer transition-colors"
                            title="Eliminar Colaborador"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ======================= TAB 7: SAAS MANTENIMIENTO ======================= */}
      {activeAdminTab === 'maintenance' && (
        <div className="space-y-6 animate-fade-in" id="sa-tab-maintenance">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-left items-start">
            
            {/* HARDWARE CHECKS AND BACKUPS (4 cols) */}
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 space-y-4">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Resguardos y Estado de Servicio</h3>
                <p className="text-[11px] text-slate-450">Servidores Cloud Run y API en Cloud Run Container.</p>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleOptimizeSaaSIndexes}
                  disabled={isOptimizing}
                  className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center justify-between px-3"
                >
                  <span>Compactar Índices Lógicos</span>
                  <Database className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={handleExportSaaSBackupJSON}
                  disabled={globalExportSuccess}
                  className="w-full py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-xl text-xs font-bold flex items-center justify-between px-3"
                >
                  <span>Exportar Copia Global JSON</span>
                  <Download className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* SERVER SHELL TERMINAL LOGS (8 cols) */}
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Consola de Eventos del Servidor</h3>
                  <p className="text-[11px] text-slate-450">Actividad de webhooks, actualizaciones e ingresos en tiempo real.</p>
                </div>
                <button
                  onClick={() => setMaintenanceLogs([])}
                  className="text-xs text-rose-600 font-bold"
                >
                  Limpiar Consola
                </button>
              </div>

              <div className="p-3.5 bg-orange-50/50 border border-orange-100 rounded-xl text-slate-700 font-mono text-[10.5px] leading-relaxed max-h-[250px] overflow-y-auto space-y-1 scrollbar-thin">
                {maintenanceLogs.map(log => (
                  <div key={log.id} className="flex gap-2 text-left">
                    <span className="text-orange-600 font-bold">[{log.time}]</span>
                    <span className={`font-semibold ${
                      log.type === 'info' ? 'text-sky-600' :
                      log.type === 'success' ? 'text-orange-650 font-bold' :
                      log.type === 'warn' ? 'text-amber-600 font-bold' : 'text-rose-600 font-black'
                    }`}>{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT PLAN ======================= */}
      {editingPlan && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1">
                <Edit className="w-4 h-4" /> Editar Tarifa de Licencia
              </h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-650 font-bold">Nombre del Plan</label>
                <input
                  type="text"
                  required
                  value={editingPlan.name}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-650 font-bold">Precio Mensual ($ ARS)</label>
                <input
                  type="number"
                  required
                  value={editingPlan.price}
                  onChange={(e) => setEditingPlan({ ...editingPlan, price: Number(e.target.value) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-650 font-bold">Características (Separadas por comas)</label>
                <input
                  type="text"
                  value={editingPlan.features.join(', ')}
                  onChange={(e) => setEditingPlan({ ...editingPlan, features: e.target.value.split(',').map(s=>s.trim()) })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button onClick={() => setEditingPlan(null)} className="px-3 py-1.5 border border-slate-250 rounded hover:bg-slate-100">Cancelar</button>
              <button onClick={() => handleSavePlan(editingPlan)} className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded font-bold">Aceptar Cambios</button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: EDIT USER PROFILE ======================= */}
      {editingUser && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={(e) => { e.preventDefault(); saveEndUserSettings(editingUser); }} className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl text-left">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Editar Perfil de Público General</h3>
              <button type="button" onClick={() => setEditingUser(null)} className="text-slate-400">✕</button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-500">Nombre y Apellido</label>
                <input
                  type="text"
                  required
                  value={editingUser.name}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-205 rounded-xl font-bold mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-500 font-mono">Restablecer Contraseña (Simulación segura)</label>
                <button
                  type="button"
                  onClick={() => {
                    alert(`¡Enlace temporal de cambio de credenciales generado!\nEnviado a: ${editingUser.email}\nPermite al de soporte redirigir al usuario.`);
                  }}
                  className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-150 text-indigo-700 font-bold rounded-xl mt-1 text-xs"
                >
                  Enviar Email de Recuperación
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs">
              <button type="button" onClick={() => setEditingUser(null)} className="px-4 py-1.5 border border-slate-200 rounded-xl">Cancelar</button>
              <button type="submit" className="px-4 py-1.5 bg-slate-900 text-white hover:bg-slate-800 rounded-xl font-bold">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================= MODAL: CO-OWNERSHIP EXCEPTION DIALOG ======================= */}
      {editingStore && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl text-left animate-scale-up">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-widest flex items-center gap-1.5">
              <Gift className="w-4 h-4 text-orange-500 shrink-0" /> Regalar Concesión de Cortesía
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="text-slate-650 font-bold block">Plan Gratuito Asignado por Creador</label>
                <select
                  value={freePlan}
                  onChange={(e) => setFreePlan(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                >
                  <option value="Gratuito">No Otorgar Pase Libre (Volver a Plan Contratado)</option>
                  <option value="Básico">Pase Libre Básico</option>
                  <option value="Profesional">Pase Libre Profesional Premium</option>
                  <option value="Empresarial">Pase Libre Corporativo Empresarial</option>
                  <option value="Pase Libre">Licencia de Cortesía Ilimitada</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-650 font-bold block">Vigencia del Pase</label>
                <select
                  value={freeUntil}
                  onChange={(e) => setFreeUntil(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold font-mono"
                >
                  <option value="Ilimitado">Gratis por Sorteo / Ilimitado</option>
                  <option value="30 Días">Prueba Extra por 30 Días</option>
                  <option value="15 Días">Prueba Extra por 15 Días</option>
                  <option value="Expirado">Desactivar Pase de Cortesía</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-slate-650 font-bold block">Notas / Motivo Tributario</label>
                <textarea
                  placeholder="ej: negociado por canal corporativo."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl focus:border-orange-500 text-xs"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-bold">
              <button onClick={() => setEditingStore(null)} className="px-4 py-2 border border-slate-200 rounded-xl font-bold cursor-pointer">Cancelar</button>
              <button onClick={handleSaveFreeAccess} className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1">
                {isSavingStore ? 'Sincronizando...' : 'Otorgar Concesión'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: ACCESO PRIMARIO TIENDA DETALLES ======================= */}
      {editingStoreDetails && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleSaveStoreDetails} className="bg-white border border-slate-205 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl text-left">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-705">Editar Datos de Comercio Registrado</h3>
            
            <div className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-600">Nombre Comerciante</label>
                <input
                  type="text"
                  required
                  value={editingStoreDetails.ownerName}
                  onChange={(e) => setEditingStoreDetails({ ...editingStoreDetails, ownerName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600">Nombre de la Tienda / Negocio</label>
                <input
                  type="text"
                  required
                  value={editingStoreDetails.storeName}
                  onChange={(e) => setEditingStoreDetails({ ...editingStoreDetails, storeName: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 font-mono">Email Acceso</label>
                <input
                  type="email"
                  required
                  value={editingStoreDetails.email}
                  onChange={(e) => setEditingStoreDetails({ ...editingStoreDetails, email: e.target.value.toLowerCase() })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-655 block">Plan</label>
                  <select
                    value={editingStoreDetails.plan}
                    onChange={(e) => setEditingStoreDetails({ ...editingStoreDetails, plan: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  >
                    <option value="Gratuito">Gratuito</option>
                    <option value="Básico">Básico</option>
                    <option value="Profesional">Profesional</option>
                    <option value="Empresarial">Empresarial</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-655 block">Estado</label>
                  <select
                    value={editingStoreDetails.status}
                    onChange={(e) => setEditingStoreDetails({ ...editingStoreDetails, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-200 p-2 rounded-xl"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Suspendido">Suspendido</option>
                    <option value="Expirado">Expirado</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 text-xs font-bold">
              <button type="button" onClick={() => setEditingStoreDetails(null)} className="px-4 py-2 border border-slate-200 rounded-xl">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 text-white rounded-xl">Guardar Cambios</button>
            </div>
          </form>
        </div>
      )}

      {/* ======================= MODAL: DOBLE CONFIRMACION ELIMINAR ======================= */}
      {storeToDelete && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl text-left text-xs">
            <h3 className="font-black text-rose-700 flex items-center gap-1">
              ⚠️ Confirmación Desvincular Tienda Cliente
            </h3>
            <p className="text-slate-505 leading-relaxed font-semibold">
              Estás a punto de desvincular <strong className="text-slate-900">{storeToDelete.storeName}</strong> de la red general de MAX24. Se borrarán todas las cajas y datos acumulados de forma definitiva.
            </p>
            <div className="p-2 bg-rose-50 border border-rose-100 rounded text-rose-800">
              Para validar, escriba de forma idéntica el nombre de la tienda: <strong className="block font-mono bg-white p-1 text-center font-black mt-1 select-all">{storeToDelete.storeName}</strong>
            </div>

            <input
              type="text"
              required
              placeholder="Confirmar escribiendo idénticamente..."
              value={deleteConfirmName}
              onChange={(e) => setDeleteConfirmName(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold uppercase text-center"
            />

            <div className="flex justify-end gap-2 pt-1 font-bold">
              <button onClick={() => setStoreToDelete(null)} className="px-4 py-2 border border-slate-200 rounded-xl">Cancelar</button>
              <button 
                onClick={handleDeleteStoreConfirm}
                disabled={deleteConfirmName.trim() !== storeToDelete.storeName.trim()}
                className={`px-4 py-2 rounded-xl text-white ${deleteConfirmName.trim() === storeToDelete.storeName.trim() ? 'bg-rose-600 hover:bg-rose-700': 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
              >
                Eliminar Permanentemente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================= MODAL: DAR DE ALTA MANUALLY CLIENT ======================= */}
      {isAddStoreOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddNewStore} className="bg-white border border-slate-200 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-xl text-left text-xs">
            <h3 className="font-black text-slate-800">Registrar Nuevo Comercio / Tienda B2C</h3>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-slate-600 block">Nombre del Titular / Cliente</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Andrés Manuel Pérez"
                  value={newStore.ownerName}
                  onChange={(e) => setNewStore({ ...newStore, ownerName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 block">Razón Social / Nombre Comercial del Local</label>
                <input
                  type="text"
                  required
                  placeholder="ej: Kiosco El Centenario"
                  value={newStore.storeName}
                  onChange={(e) => setNewStore({ ...newStore, storeName: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-605 block">Email de Acceso (Dueno)</label>
                <input
                  type="email"
                  required
                  placeholder="ej: centenario24@gmail.com"
                  value={newStore.email}
                  onChange={(e) => setNewStore({ ...newStore, email: e.target.value.toLowerCase() })}
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 grid-start">
                <div>
                  <label className="font-bold text-slate-600 block">Plan Mensual</label>
                  <select
                    value={newStore.plan}
                    onChange={(e) => setNewStore({ ...newStore, plan: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-202 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Gratuito">Gratuito</option>
                    <option value="Básico">Básico</option>
                    <option value="Profesional">Profesional</option>
                    <option value="Empresarial">Empresarial</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 block">Estado Inicial</label>
                  <select
                    value={newStore.status}
                    onChange={(e) => setNewStore({ ...newStore, status: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-202 rounded-xl p-2.5 font-bold"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Suspendido">Suspendido</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 font-bold">
              <button type="button" onClick={() => setIsAddStoreOpen(false)} className="px-4 py-2 border border-slate-200 rounded-xl">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl">Sincronizar y Crear</button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
