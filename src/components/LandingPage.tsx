import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart3, 
  Wallet, 
  ShieldCheck, 
  Sparkles, 
  Zap, 
  Clock, 
  ArrowRight, 
  CheckCircle2, 
  Store, 
  Smartphone, 
  MessageSquareCode, 
  HelpCircle, 
  Lock,
  ArrowUpRight,
  ShieldAlert,
  Scale,
  Shirt,
  Apple,
  Utensils,
  MessageSquare,
  Building2,
  Gift,
  Search,
  Plus,
  Minus,
  Send,
  Check,
  RotateCcw,
  TrendingUp,
  UserCheck,
  History,
  User,
  Share2,
  FileSpreadsheet,
  Upload,
  Volume2,
  Eye,
  Key,
  Percent,
  DollarSign,
  Calendar,
  Menu,
  X
} from 'lucide-react';
import { Employee } from '../types';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface LandingPageProps {
  onLoginClick: (mode?: 'login' | 'register' | 'forgot' | 'buyer_register' | 'supplier_register' | 'employee_login') => void;
  onStartDemoClick: (planId: 'Básico' | 'Profesional' | 'Empresarial') => void;
  employees: Employee[];
  onDirectLogin?: (user: Employee) => void;
}

export default function LandingPage({ onLoginClick, onStartDemoClick, employees, onDirectLogin }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [globalWhatsApp, setGlobalWhatsApp] = useState('5491122334455');

  useEffect(() => {
    async function fetchContactSettings() {
      try {
        const contactDoc = await getDoc(doc(db, 'superAdminSettings', 'contactInfo'));
        if (contactDoc.exists()) {
          const data = contactDoc.data();
          if (data && data.whatsapp) {
            setGlobalWhatsApp(data.whatsapp);
          }
        }
      } catch (err) {
        console.warn("Could not fetch global contact info for LandingPage:", err);
      }
    }
    fetchContactSettings();
  }, []);
  const [shareCopied, setShareCopied] = useState(false);

  const [activeTourTab, setActiveTourTab] = useState<'pos' | 'stock' | 'debts' | 'reports' | 'employees'>('pos');
  const [activeTab, setActiveTab] = useState<'home' | 'comercios' | 'compradores' | 'proveedores'>('home');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // States for the interactive "Novedades y Nuevas Funcionalidades" demo center
  const [activeShowcaseTab, setActiveShowcaseTab] = useState<'pos-scan' | 'csv-import' | 'auth-2fa' | 'finance-net' | 'accessibility' | 'saas-mp'>('pos-scan');
  
  // 1. POS Scan states
  const [scannedQuery, setScannedQuery] = useState('');
  const [scanCart, setScanCart] = useState<any[]>([
    { code: '77901231', name: 'Yerba Mate Playadito 1kg', qty: 1, price: 3200 }
  ]);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  // 2. CSV Importer states
  const [csvFileUploaded, setCsvFileUploaded] = useState(false);
  const [detectedDelimiter, setDetectedDelimiter] = useState<string>('');
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvRows, setCsvRows] = useState<any[]>([]);
  const [csvDuplicateCount, setCsvDuplicateCount] = useState(0);

  // 3. Auth 2FA states
  const [authStep, setAuthStep] = useState<'login' | 'otp' | 'success'>('login');
  const [authEmail, setAuthEmail] = useState('bigmax24h7@gmail.com');
  const [authPassword, setAuthPassword] = useState('•••••••••');
  const [auth2faOtp, setAuth2faOtp] = useState('');
  const [receivedOtpCode, setReceivedOtpCode] = useState('');
  const [otpTimer, setOtpTimer] = useState(120);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // 4. Finance Net profit states
  const [financeRevenue, setFinanceRevenue] = useState(480000);
  const [financeCostOfGoods, setFinanceCostOfGoods] = useState(195000);
  const [financeFixedCosts, setFinanceFixedCosts] = useState([
    { id: 'alquiler', name: 'Alquiler del Local (Fijo)', amount: 80000, active: true },
    { id: 'luz', name: 'Servicio de Electricidad (Luz)', amount: 24000, active: true },
    { id: 'internet', name: 'Internet Fibra Óptica', amount: 12000, active: true },
    { id: 'telefono', name: 'Telefonía Móvil y WhatsApp', amount: 8000, active: true },
    { id: 'impuestos', name: 'Tasas e Impuestos Locales', amount: 15000, active: false }
  ]);

  // 5. Accessibility Assistant states
  const [assistVoiceOn, setAssistVoiceOn] = useState(false);
  const [assistSubtitles, setAssistSubtitles] = useState('');
  const [assistZoom, setAssistZoom] = useState(false);
  const [assistContrast, setAssistContrast] = useState(false);

  // 6. SaaS pricing toggle
  const [isYearlyPlan, setIsYearlyPlan] = useState(true);

  // Trigger barcode auto-add in demo
  useEffect(() => {
    const query = scannedQuery.trim();
    if (query === '77901230' || query === '77901231' || query === '77901232') {
      let itemName = '';
      let itemPrice = 0;
      if (query === '77901230') {
        itemName = 'Aceite Girasol Natura 1.5L';
        itemPrice = 3200;
      } else if (query === '77901231') {
        itemName = 'Yerba Mate Playadito 1kg';
        itemPrice = 3200;
      } else if (query === '77901232') {
        itemName = 'Gaseosa Coca-Cola 2.25L';
        itemPrice = 2700;
      }

      // Add to cart
      setScanCart(prev => {
        const existing = prev.find(item => item.code === query);
        if (existing) {
          return prev.map(item => item.code === query ? { ...item, qty: item.qty + 1 } : item);
        } else {
          return [...prev, { code: query, name: itemName, qty: 1, price: itemPrice }];
        }
      });

      // Sound or toast simulation
      setScanMessage(`[Escaner Lector] Código ${query} detectado de forma inmediata: ${itemName} agregado al mostrador.`);
      setScannedQuery('');
      setTimeout(() => setScanMessage(null), 4000);
    }
  }, [scannedQuery]);

  // OTP Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (authStep === 'otp' && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    } else if (otpTimer === 0 && authStep === 'otp') {
      setOtpMessage('El código OTP ha expirado. Por favor, solicita uno nuevo.');
    }
    return () => clearInterval(interval);
  }, [authStep, otpTimer]);

  // Narrate on Hover helper for accessibility demo
  const handleDemoElementHover = (text: string) => {
    if (assistVoiceOn) {
      setAssistSubtitles(`[Lector de Voz Activo] - "${text}"`);
    }
  };
  const renderComerciosPage = () => (
    <div className="py-12 px-6 max-w-6xl mx-auto w-full space-y-16 animate-fade-in text-left">
      {/* Hero Header */}
      <div className="space-y-4 text-center">
        <span className="text-xs tracking-widest uppercase font-black text-indigo-600 font-mono block">
          CENTRO DE CONTROL PARA COMERCIOS — SOFTWARE DE GESTIÓN EN LA NUBE PARA PYMES
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          El mejor <span className="text-indigo-650 font-extrabold">Software Punto de Venta para Comercios</span> <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-indigo-600 to-emerald-600">
            con Control de Stock y Ventas en Argentina
          </span>
        </h1>
        <p className="text-xs md:text-sm text-slate-600 max-w-3xl mx-auto font-medium leading-relaxed">
          Diseñado como un <strong>sistema de gestion comercial web</strong> ágil e intuitivo. Di adiós al descontrol del inventario, los cuadraditos de fiados perdidos y las sospechas de caja. MAX24 unifica tu <strong>programa para control de stock y ventas</strong> y tu <strong>software punto de venta con tienda online</strong> en una sola pantalla.
        </p>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center font-bold">
            <ShoppingBag className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="text-sm font-black text-slate-900">1. Punto de Venta (POS) Veloz</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Cobra en segundos conectando cualquier <strong>lector de codigo de barras software online</strong>. Registra múltiples métodos de pago, facturas rápidas con nuestro <strong>sistema de facturacion electronica para negocios</strong> y agilizá el mostrador.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <Package className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">2. Control de Stock Inteligente</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Carga tus productos, asóciales código, costo y precio de venta. Optimizado como <strong>software para maxikioscos</strong> y despensas, o como <strong>software para control de stock indumentaria</strong> y tiendas de ropa.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">3. Administración de Cuentas Corrientes</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Elimina los cuadernos. Lleva la <strong>administracion de cuentas corrientes de clientes</strong> con balances estrictos, alertas de saldo máximo y avisos automatizados por correo electrónico.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">4. Control de Caja Diaria</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Realiza el <strong>control de caja diaria para negocios</strong> con arqueos estrictos, múltiples turnos de empleados y registro exacto por cajero para evitar fugas. Excelente <strong>control de caja para drugstores</strong>.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">5. Tienda Online Integrada</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Descubrí cómo <strong>crear tienda online sincronizada con stock</strong> en un clic. Tus clientes locales compran por la web y la mercadería se descuenta de tu inventario físico en tiempo real.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-pink-500/10 text-pink-600 rounded-xl flex items-center justify-center font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">6. Reportes Financieros Completos</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Visualiza tus <strong>reportes de ventas y ganancias online</strong>. Resta tus gastos operativos fijos y conoce el margen neto real de tu <strong>sistema para puntos de venta de bazar</strong>, almacén o indumentaria.
          </p>
        </div>
      </div>

      {/* Verticales / Nicho Highlights */}
      <div className="p-8 bg-slate-50 border border-slate-200 rounded-3xl space-y-4">
        <h3 className="text-lg font-black text-slate-900">Módulos adaptados para tu vertical de negocio</h3>
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          MAX24 destaca por proveer un potente <strong>programa para kioscos con lector de barras</strong>, un robusto <strong>sistema de ventas para almacén y despensa</strong> barrial, un amigable <strong>programa de facturacion para locales de ropa</strong> y un flexible <strong>sistema de gestion para tienda de ropa</strong> con soporte multitalle.
        </p>
      </div>

      {/* Benefits and Call to Action */}
      <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-xl font-black text-slate-900">¿Listo para modernizar tu negocio?</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Te damos acceso completo por 30 días para <strong>probar software de gestión para comercios</strong> de forma gratuita. Accedé a la <strong>demo sistema de ventas gratis</strong> sin compromiso y conocé nuestro <strong>sistema de gestion comercial precios</strong> competitivo y <strong>software punto de venta economico</strong>.
          </p>
        </div>
        <button
          onClick={() => onLoginClick('register')}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-orange-500 to-emerald-600 hover:from-orange-600 hover:to-emerald-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/15 transition-all text-center cursor-pointer uppercase"
        >
          Registrar mi Comercio Ahora
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderCompradoresPage = () => (
    <div className="py-12 px-6 max-w-6xl mx-auto w-full space-y-16 animate-fade-in text-left">
      {/* Hero Header */}
      <div className="space-y-4 text-center">
        <span className="text-xs tracking-widest uppercase font-black text-teal-650 font-mono block">
          PORTAL PARA VECINOS Y COMPRADORES
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Tu Membrecía de Compras Local <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 via-blue-600 to-emerald-600">
            Control de Fiados y Descuentos en un Solo Lugar
          </span>
        </h1>
        <p className="text-xs md:text-sm text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Olvídate de acumular tickets de papel ilegibles o de llevar anotaciones complejas de cuánto debes en la despensa de la esquina. Con MAX24 Vecinos tienes total transparencia.
        </p>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Smartphone className="w-5 h-5 animate-bounce" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Credencial Digital del Vecino</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Accede a tu credencial con un código QR desde cualquier celular. Al cobrarte, el cajero escanea tu código en pantalla para aplicarte de inmediato tus condiciones y promociones especiales de cliente frecuente.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Wallet className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Control Remoto de Cuentas (Fiados)</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Revisa tus saldos actualizados al instante en todos tus comercios favoritos. Revisa cuánto debes pagar, cuál es tu límite de crédito permitido por el dueño del local y consulta tu historial completo de compras.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-teal-500/10 text-teal-600 rounded-xl flex items-center justify-center font-bold">
            <Gift className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Descuentos y Beneficios de Barrio</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Suma puntos en cada compra para canjear por productos de tu interés. Accede a cupones exclusivos que publican los almacenes y supermercados adheridos a la red nacional de MAX24.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Seguridad y Auto-Registro</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Al realizar tu primera compra en un comercio y proveer tu dirección de e-mail, quedas automáticamente registrado como cliente preferencial, recibiendo notificaciones personalizadas directas de su cuenta.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-pink-500/10 text-pink-600 rounded-xl flex items-center justify-center font-bold">
            <MessageSquareCode className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Soporte Digital</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Recibe estados de cuenta, cobros recibidos y avisos de vencimientos de crédito directo a tu correo electrónico sin demoras ni gestiones de oficina. Todo al alcance de tu mano.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <UserCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Registro Gratuito de por Vida</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Para el público y compradores, el acceso a la plataforma MAX24 es y será siempre 100% gratuito. No pagas comisiones ni abonos de ningún tipo por utilizar el portal ni consultar tus cuentas.
          </p>
        </div>
      </div>

      {/* Benefits and Call to Action */}
      <div className="p-8 bg-teal-50 border border-teal-100 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-xl">
          <h3 className="text-xl font-black text-slate-900">¿Quieres obtener tu credencial digital?</h3>
          <p className="text-xs text-slate-600 leading-relaxed font-semibold">
            Crea tu cuenta de vecino en un clic. Al ingresar podrás ver instantáneamente tus saldos en las tiendas autorizadas asociadas a tu correo electrónico.
          </p>
        </div>
        <button
          onClick={() => onLoginClick('buyer_register')}
          className="w-full md:w-auto px-8 py-4 bg-gradient-to-r from-teal-500 to-blue-600 hover:from-teal-600 hover:to-blue-700 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-teal-500/15 transition-all text-center cursor-pointer uppercase"
        >
          Registrarme como Comprador
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );

  const renderProveedoresPage = () => (
    <div className="py-12 px-6 max-w-6xl mx-auto w-full space-y-16 animate-fade-in text-left">
      {/* Hero Header */}
      <div className="space-y-4 text-center">
        <span className="text-xs tracking-widest uppercase font-black text-indigo-600 font-mono block">
          SUMINISTRO MAYORISTA B2B
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
          Tu Puente de Ventas Digital <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-orange-500">
            Conecta con Cientos de Tiendas de la Región
          </span>
        </h1>
        <p className="text-xs md:text-sm text-slate-600 max-w-2xl mx-auto font-medium leading-relaxed">
          Como distribuidor, fabricante o mayorista regional, el portal B2B de MAX24 te provee de un canal comercializador directo con comercios que necesitan tus productos diariamente.
        </p>
      </div>

      {/* Grid of details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-indigo-500/10 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
            <Package className="w-5 h-5 animate-pulse" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Catálogo de Productos Masivo</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Publica todos tus productos con detalles de precios, descripciones, unidades físicas y mínimos de compra. Los comercios podrán cargarlos directamente a su propio inventario con un solo clic.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-purple-500/10 text-purple-600 rounded-xl flex items-center justify-center font-bold">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Búsqueda y Filtros por Zona</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Filtra tiendas registradas basándote en su ubicación regional (Provincia y Ciudad). Encuentra nichos geográficos que coincidan con tu radio de distribución física y logística.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-pink-500/10 text-pink-600 rounded-xl flex items-center justify-center font-bold">
            <Send className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Envíos de Presupuestos Digitales</h3>
          <p className="text-xs text-slate-650 leading-normal">
            El sistema envía tus presupuestos estructurados directamente a la casilla de entrada de los comercios afiliados para que analicen, validen y asimilen a sus respectivos pedidos.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-blue-500/10 text-blue-600 rounded-xl flex items-center justify-center font-bold">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Registro Gratuito (Plan Gratuito Permanente)</h3>
          <p className="text-xs text-slate-650 leading-normal">
            La creación de tu perfil de proveedor es 100% gratuita. En el plan gratuito puedes publicar tu catálogo completo de mercadería y ver o enviar propuestas comerciales a un límite máximo de 10 comercios de tu zona. Hecho para proveedores en crecimiento.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-orange-500/10 text-orange-600 rounded-xl flex items-center justify-center font-bold">
            <Zap className="w-5 h-5 animate-bounce" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Mayorista PRO (Suscripción Ilimitada)</h3>
          <p className="text-xs text-slate-650 leading-normal">
            ¿Quieres un menú sin límites de tiendas ni envíos? Suscríbete a nuestro abono mensual o anual (con descuento) para desbloquear todas las tiendas territoriales, habilitar envíos ilimitados de ofertas y posicionar tus listados arriba del todo.
          </p>
        </div>

        <div className="p-6 bg-white border border-slate-200 shadow-xs hover:shadow-md transition-all duration-300 rounded-3xl space-y-4">
          <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-black text-slate-900">Soporte Mayorista B2B</h3>
          <p className="text-xs text-slate-650 leading-normal">
            Contamos con un equipo técnico listo para ayudarte a sincronizar listas de precios masivamente e incorporar tu marca de forma rápida y confiable dentro del ecosistema MAX24.
          </p>
        </div>
      </div>

      {/* Pricing cards side-by-side for Suppliers */}
      <div className="bg-indigo-50/40 border border-indigo-100 p-8 rounded-3xl max-w-4xl mx-auto space-y-8 relative overflow-hidden">
        <div className="space-y-2 text-center">
          <span className="text-[10px] font-mono tracking-widest text-indigo-600 uppercase font-black">Planificación Tarifaria Mayorista</span>
          <h3 className="text-xl font-black text-slate-900">Nuestros Planes de Suministro</h3>
          <p className="text-xs text-slate-600">Comienza a vender de forma gratuita y escala a un abono Pro cuando estés listo para cobertura regional ilimitada.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Supplier Gratuito Card */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-6 shadow-xs">
            <div className="space-y-3">
              <span className="text-[9px] font-mono font-black text-slate-500 uppercase tracking-wider bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded">BÁSICO • GRATUITO</span>
              <h4 className="text-lg font-black text-slate-800">Proveedor Gratis</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Prueba el ecosistema conectándote con hasta 10 comercios locales para validar la demanda de tus productos.</p>
              
              <div className="py-3 border-y border-slate-100">
                <span className="text-2xl font-mono font-black text-slate-900">$0</span>
                <span className="text-xs text-slate-500 font-bold ml-1">Gratis Siempre</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-650">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Ver hasta 10 tiendas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Enviar ofertas a 10 tiendas</span>
                </li>
                <li className="text-rose-600/70 font-semibold flex items-center gap-2 line-through">
                  Envíos e informes de cobertura ilimitados
                </li>
              </ul>
            </div>

            <button
              onClick={() => onLoginClick('supplier_register')}
              className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Registrarme Gratis como Proveedor
            </button>
          </div>

          {/* Supplier Mayorista Pro Card */}
          <div className="bg-white p-6 rounded-2xl border-2 border-indigo-600 flex flex-col justify-between space-y-6 shadow-md relative overflow-hidden group">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-mono font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 rounded">ILIMITADO PRO</span>
                <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded uppercase font-mono">¡Descuento -25%!</span>
              </div>
              <h4 className="text-lg font-black text-slate-900">Mayorista Pro</h4>
              <p className="text-xs text-slate-600 leading-relaxed">Envía propuestas a todo el país y posiciona tus listados al frente para una facturación mayorista robusta.</p>
              
              <div className="py-3 border-y border-slate-150">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-mono font-black text-slate-900">$14.900</span>
                  <span className="text-[10px] text-slate-500 uppercase font-sans">ARS / mes</span>
                </div>
                <span className="text-[10px] text-slate-400 block leading-none font-mono">Facturado anualmente ($178.800) • Opción mensual: $19.900</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-650">
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Tiendas ILIMITADAS a nivel nacional</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Envíos directos ilimitados de ofertas</span>
                </li>
                <li className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Soporte prioritario 24/7 y carga masiva</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => onLoginClick('supplier_register')}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-black text-xs rounded-xl hover:shadow-lg hover:shadow-indigo-500/20 transition-all text-center uppercase cursor-pointer"
            >
              Registrarme al Plan Pro Mayorista
            </button>
          </div>
        </div>
      </div>
    </div>
  );


  const handleDirectDemoLogin = (role: 'Administrador' | 'Comprador') => {
    if (!onDirectLogin) return;
    if (role === 'Administrador') {
      // Strictly prevent logging directly into the live owner email
      const adminEmp = employees.find(e => e.role === 'Administrador' && e.email !== 'pezziniarg@gmail.com') || {
        id: 'emp-bigmax',
        name: 'Administrador Demo',
        email: 'prueba@max24app.com',
        role: 'Administrador' as const,
        status: 'Activo' as const,
        shift: 'Rotativo',
        joinedDate: '2026-01-10',
        username: 'prueba@max24app.com',
        password: 'prueba',
        phone: '+54 11 5566-7788',
        salary: 850000,
        emergencyContact: 'Soporte - +54 11 0000-0000'
      };
      onDirectLogin(adminEmp);
    } else {
      const buyerEmp = employees.find(e => e.role === 'Comprador' && e.email !== 'pezziniarg@gmail.com') || {
        id: 'emp-buyer-demo',
        name: 'Juan Carlos Gómez (Comprador)',
        email: 'juan.gomez@gmail.com',
        role: 'Comprador' as const,
        status: 'Activo' as const,
        shift: 'Rotativo',
        joinedDate: new Date().toISOString().split('T')[0],
        phone: '+54 11 9876-5432',
        emergencyContact: 'DNI: 28123456'
      };
      onDirectLogin(buyerEmp);
    }
  };
  
  // State for POS terminal simulation
  const [posItems, setPosItems] = useState([
    { id: 1, name: 'Yerba Mate Playadito 1kg', qty: 1, price: 3200 },
    { id: 2, name: 'Galletitas Surtidas Terrabusi', qty: 2, price: 1100 },
    { id: 3, name: 'Gaseosa Coca-Cola 2.25L', qty: 2, price: 2700 }
  ]);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);

  // State for Inventory simulation
  const [stockSearch, setStockSearch] = useState('');
  const [stockItems, setStockItems] = useState([
    { code: '77901230', name: 'Aceite Girasol Natura 1.5L', stock: 4, minStock: 10, cost: 2100, price: 3200 },
    { code: '77901231', name: 'Yerba Playadito 1kg', stock: 24, minStock: 8, cost: 2200, price: 3200 },
    { code: '77901232', name: 'Coca-Cola Gaseosa 2.25L', stock: 2, minStock: 15, cost: 1800, price: 2700 },
    { code: '77901233', name: 'Galletitas Surtidas Terrabusi', stock: 42, minStock: 5, cost: 750, price: 1100 },
    { code: '77901234', name: 'Leche Entera La Serenísima 1L', stock: 12, minStock: 15, cost: 800, price: 1200 }
  ]);
  const [stockInputCode, setStockInputCode] = useState('77901230');
  const [stockInputQty, setStockInputQty] = useState(12);
  const [stockUpdateAlert, setStockUpdateAlert] = useState<string | null>(null);

  // State for Cuenta Corriente (Debts) simulation
  const [waSentUser, setWaSentUser] = useState<string | null>(null);
  const deudores = [
    { name: 'Doña Rosa Spina', balance: 14500, limit: 30000, phone: '+54 11 3344-5566', email: 'rosa.spina@gmail.com' },
    { name: 'Carlos Vecino', balance: 22000, limit: 25000, phone: '+54 11 5566-7788', email: 'carlos.v9@hotmail.com' },
    { name: 'Manuel Romano', balance: 6800, limit: 15000, phone: '+54 11 2233-4455', email: 'manuro_98@gmail.com' }
  ];

  const handleUpdateQty = (id: number, delta: number) => {
    setPosItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }).filter(item => item.qty > 0));
  };

  const handleSimulateCheckout = () => {
    setCheckoutSuccess(true);
    setTimeout(() => {
      setCheckoutSuccess(false);
      setPosItems([
        { id: 1, name: 'Yerba Mate Playadito 1kg', qty: 1, price: 3200 },
        { id: 2, name: 'Galletitas Surtidas Terrabusi', qty: 2, price: 1100 },
        { id: 3, name: 'Gaseosa Coca-Cola 2.25L', qty: 2, price: 2700 }
      ]);
    }, 4000);
  };

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    const targeted = stockItems.find(p => p.code === stockInputCode);
    if (!targeted) return;
    
    setStockItems(prev => prev.map(p => {
      if (p.code === stockInputCode) {
        return { ...p, stock: p.stock + Number(stockInputQty) };
      }
      return p;
    }));
    
    setStockUpdateAlert(`+${stockInputQty} unidades agregadas con éxito a "${targeted.name}"`);
    setTimeout(() => {
      setStockUpdateAlert(null);
    }, 4000);
  };

  const handleSimulateWhatsApp = (customerName: string) => {
    setWaSentUser(customerName);
    setTimeout(() => {
      setWaSentUser(null);
    }, 5000);
  };

  const benefits = [
    {
      icon: ShoppingBag,
      title: 'Punto de Venta POS Ultra-Veloz',
      desc: 'Realiza ventas en segundos con lector de código de barras, búsqueda predictiva y múltiples métodos de pago integrados (Efectivo, Tarjeta, Transferencia y Cuenta Corriente). El cajero trabaja sin demoras.',
      // Benefits list section configuration colors
      color: 'from-blue-500/10 to-blue-500/5',
      iconColor: 'text-blue-500'
    },
    {
      icon: Sparkles,
      title: 'Facturación Fiscal ARCA con IA',
      desc: 'Soporte completo para facturas fiscales electrónicas de ARCA (ex-AFIP) integrado con Inteligencia Artificial. Automatiza la categorización, genera facturas legales desde el POS en un solo clic y optimiza tu contabilidad inteligente.',
      color: 'from-orange-500/10 to-orange-500/5',
      iconColor: 'text-orange-500'
    },
    {
      icon: Package,
      title: 'Control de Stock Inteligente',
      desc: 'Evita quiebres de stock. Carga productos masivamente por categorías, recibe alertas automáticas de stock mínimo, registra stock crítico y controla tus márgenes de ganancias de forma automatizada.',
      color: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-500'
    },
    {
      icon: Wallet,
      title: 'Cuentas Corrientes integradas',
      desc: 'Fideliza a tus vecinos con el módulo de Cuenta Corriente (fiados). Registra deudas de clientes con límites de crédito configurables, historial cronológico de compras y saldos actualizados al instante.',
      color: 'from-emerald-500/10 to-teal-500/5',
      iconColor: 'text-emerald-500'
    },
    {
      icon: BarChart3,
      title: 'Reportería y Análisis en Tiempo Real',
      desc: 'Descubre qué productos se venden más, cuáles te dejan mayor margen y el balance de ventas diario/mensual en gráficos dinámicos interactivos. Descarga reportes completos para tomar decisiones inteligentes.',
      color: 'from-blue-500/10 to-indigo-500/5',
      iconColor: 'text-blue-500'
    },
    {
      icon: Users,
      title: 'Gestión de Empleados y Roles',
      desc: 'Asigna permisos específicos para Administradores, Gerentes y Cajeros. Audita quién realizó cada venta, controla los turnos de caja y supervisa el rendimiento de tu personal sin estar físicamente en la tienda.',
      color: 'from-purple-500/10 to-pink-500/5',
      iconColor: 'text-purple-500'
    },
    {
      icon: ShieldCheck,
      title: 'Backup en la Nube y Seguridad',
      desc: 'Tu información es sagrada. Toda la base de datos de productos, ventas y deudas se sincroniza en la nube bajo encriptación SSL de grado bancario. Accede a tu comercio desde cualquier computadora o tablet.',
      color: 'from-cyan-500/10 to-blue-500/5',
      iconColor: 'text-cyan-500'
    }
  ];

  const pricingPlans = [
    {
      id: 'Básico' as const,
      name: 'Plan Básico',
      desc: 'Perfecto para almacenes locales, tiendas de ropa, carnicerías, heladerías, verdulerías o kioscos en crecimiento.',
      usdPrice: 15,
      arsPrice: 15000,
      features: [
        'Hasta 100 Productos activos',
        'Punto de Venta (POS) ilimitado',
        'Gestión de Clientes y Fiados',
        'Hasta 3 empleados registrados',
        'Reportes de venta básicos',
        'Soporte por email'
      ],
      isPopular: false,
      badge: 'Más Vendido Local'
    },
    {
      id: 'Profesional' as const,
      name: 'Plan Profesional',
      desc: 'La solución definitiva para tiendas y pymes con alta rotación.',
      usdPrice: 29.99,
      arsPrice: 30000,
      features: [
        'Productos ILIMITADOS',
        'Punto de Venta (POS) Multicajero',
        'Cuentas Corrientes avanzadas',
        'Alertas de stock mínimo y crítico',
        'Márgenes y costos de comidas (Hamburguesas, Sándwiches, etc.)',
        'Empleados ILIMITADOS con roles',
        'Estadísticas avanzadas e históricos',
        'Integración con pistolas lectoras',
        'Soporte chat 24/7'
      ],
      isPopular: true,
      badge: 'RECOMENDADO'
    },
    {
      id: 'Empresarial' as const,
      name: 'Plan Empresarial',
      desc: 'Para redes de comercios y sucursales distribuidas.',
      usdPrice: 59.99,
      arsPrice: 60000,
      features: [
        'Multi-Tiendas (Control unificado)',
        'Resúmenes contables automáticos',
        'Servidor dedicado con 99.9% de uptime',
        'Personalización de facturas y tickets',
        'Dashboard para contadores',
        'Asesor de soporte exclusivo telefónico'
      ],
      isPopular: false,
      badge: 'Multicomercios'
    }
  ];

  const faqs = [
    {
      q: '¿Cómo funciona el Demo Gratis de 30 días?',
      a: 'Es 100% gratis y sin compromisos. Puedes registrarte en menos de un minuto usando tu correo. No ingresas tarjetas de crédito. Obtienes acceso inmediato al Plan Profesional con todas las funciones activas por 30 días para probar el sistema en tu tienda real.'
    },
    {
      q: '¿Qué formas de pago aceptan en Argentina?',
      a: 'Aceptamos pagos directos a través de MercadoPago Argentina. Esto incluye saldo en cuenta de MercadoPago, tarjetas de crédito (Visa, Mastercard, American Express, Naranja), tarjetas de débito, o efectivo en Pago Fácil y RapiPago.'
    },
    {
      q: '¿Qué pasa cuando termina el periodo de prueba gratis?',
      a: 'Antes de que expiren tus 30 días de prueba, el sistema te notificará para que puedas elegir el plan que mejor se adapte a tu comercio y realizar tu primer pago vía MercadoPago. Si decides no continuar, tus datos quedarán guardados de forma segura por si decides suscribirte en el futuro.'
    },
    {
      q: '¿Necesito comprar una lectora de código de barras?',
      a: 'No es estrictamente obligatorio. MAX24 funciona perfectamente buscando productos por nombre o código mediante teclado táctil, pero es 100% compatible con cualquier pistola lectora USB convencional para agilizar extraordinariamente tu atención.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-orange-500 selection:text-white" id="landing-page-root">
      
      {/* Decorative radial gradients for cosmic high-end aesthetic */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-orange-500/10 blur-[130px] rounded-full -translate-x-12 -translate-y-24 pointer-events-none" />
      <div className="absolute top-[800px] right-10 w-[500px] h-[500px] bg-emerald-500/10 blur-[140px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[200px] left-10 w-[600px] h-[600px] bg-emerald-500/5 blur-[150px] rounded-full pointer-events-none" />

       {/* Navigation Header */}
      <nav className="border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-4 md:px-6 py-4 lg:py-0 min-h-16 lg:h-20 flex flex-col lg:flex-row lg:items-center justify-between transition-all duration-300">
        <div className="w-full lg:w-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => {
            setActiveTab('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
            setMobileMenuOpen(false);
          }}>
            <div className="w-10 h-10 bg-orange-500 rounded-xl text-white font-black text-lg flex items-center justify-center shadow-lg shadow-orange-500/15">
              M24
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 leading-none block">
                MAX<span className="text-orange-500">24</span>
              </span>
              <span className="text-[9px] font-mono tracking-widest text-slate-500 uppercase block mt-1">Gestión de Tiendas</span>
            </div>
          </div>

          {/* Hamburger Menu Icon for Mobile / Tablet */}
          <button 
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 hover:text-orange-500 focus:outline-none transition-all rounded-xl hover:bg-slate-100 min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            aria-label="Abrir menú"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 animate-pulse" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Navigation Links and Buttons */}
        <div className={`${mobileMenuOpen ? 'flex' : 'hidden lg:flex'} flex-col lg:flex-row items-stretch lg:items-center w-full lg:w-auto gap-4 lg:gap-6 mt-4 lg:mt-0 pb-3 lg:pb-0`}>
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-1 lg:gap-6 text-sm lg:text-xs font-semibold text-slate-600">
            <button 
              type="button"
              onClick={() => {
                setActiveTab('home');
                setMobileMenuOpen(false);
              }}
              className={`transition-colors cursor-pointer py-2 text-left lg:text-center ${activeTab === 'home' ? 'text-orange-500 font-extrabold border-l-4 lg:border-l-0 lg:border-b-2 border-orange-500 pl-3 lg:pl-0' : 'hover:text-slate-900 pl-3 lg:pl-0'}`}
            >
              Inicio
            </button>
            <button 
              type="button"
              onClick={() => {
                setActiveTab('comercios');
                setMobileMenuOpen(false);
              }}
              className={`transition-colors cursor-pointer py-2 text-left lg:text-center ${activeTab === 'comercios' ? 'text-orange-500 font-extrabold border-l-4 lg:border-l-0 lg:border-b-2 border-orange-500 pl-3 lg:pl-0' : 'hover:text-slate-900 pl-3 lg:pl-0'}`}
            >
              Comercios
            </button>
            <button 
              type="button"
              onClick={() => {
                setActiveTab('compradores');
                setMobileMenuOpen(false);
              }}
              className={`transition-colors cursor-pointer py-2 text-left lg:text-center ${activeTab === 'compradores' ? 'text-orange-500 font-extrabold border-l-4 lg:border-l-0 lg:border-b-2 border-orange-500 pl-3 lg:pl-0' : 'hover:text-slate-900 pl-3 lg:pl-0'}`}
            >
              Compradores / Vecinos
            </button>
            <button 
              type="button"
              onClick={() => {
                setActiveTab('proveedores');
                setMobileMenuOpen(false);
              }}
              className={`transition-colors cursor-pointer py-2 text-left lg:text-center ${activeTab === 'proveedores' ? 'text-indigo-600 font-extrabold border-l-4 lg:border-l-0 lg:border-b-2 border-indigo-500 pl-3 lg:pl-0' : 'hover:text-slate-900 pl-3 lg:pl-0'}`}
            >
              Proveedores B2B
            </button>
            {activeTab === 'home' ? (
              <a 
                href="#planes" 
                onClick={() => setMobileMenuOpen(false)}
                className="hover:text-orange-500 transition-colors py-2 pl-3 lg:pl-0 text-left lg:text-center font-semibold text-slate-600"
              >
                Planes & Demo
              </a>
            ) : (
              <button 
                type="button"
                onClick={() => {
                  setActiveTab('home');
                  setMobileMenuOpen(false);
                  setTimeout(() => {
                    document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                }}
                className="hover:text-orange-500 transition-colors cursor-pointer py-2 pl-3 lg:pl-0 text-left lg:text-center"
              >
                Planes & Demo
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-2 lg:mt-0">
            <button 
              type="button"
              onClick={() => {
                onLoginClick('supplier_register');
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 text-sm lg:text-xs font-bold rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Registro Proveedor
            </button>

            <button 
              type="button"
              onClick={() => {
                onLoginClick('employee_login');
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2.5 text-sm lg:text-xs font-bold text-orange-700 hover:text-orange-900 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-xl transition-all cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Ingreso Empleados
            </button>

            <button 
              type="button"
              onClick={() => {
                onLoginClick('login');
                setMobileMenuOpen(false);
              }}
              className="px-4 py-2.5 text-sm lg:text-xs font-bold text-slate-700 hover:text-slate-900 transition-all hover:bg-slate-100 rounded-xl border border-slate-200 cursor-pointer min-h-[44px] flex items-center justify-center"
            >
              Iniciar Sesión
            </button>
            
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                if (activeTab !== 'home') {
                  setActiveTab('home');
                  setTimeout(() => {
                    document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' });
                  }, 150);
                } else {
                  document.getElementById('planes')?.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white text-sm lg:text-xs font-black rounded-xl hover:shadow-lg hover:shadow-blue-700/10 transition-all cursor-pointer min-h-[44px] flex items-center justify-center animate-pulse"
            >
              Testear Demo 30 Días
            </button>
          </div>
        </div>
      </nav>

      {activeTab === 'home' ? (
        <>
          {/* Hero Section */}
          <section className="px-6 py-16 md:py-24 max-w-7xl mx-auto w-full flex flex-col lg:flex-row items-center gap-12 relative z-10">
        <div className="flex-1 space-y-6 text-center lg:text-left">
          
          {/* Banner Pill Promo */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-orange-100 text-orange-850 border border-orange-200/80 rounded-full text-xs font-bold leading-none mx-auto lg:mx-0 shadow-xxs">
            <Sparkles className="w-3.5 h-3.5 text-orange-600" />
            ¡Prueba gratis sin tarjetas de crédito por 30 días!
          </div>

          <p className="text-[11px] font-mono tracking-widest text-indigo-700 uppercase font-extrabold block mb-1">
            Sistema de Gestión de Comercio & Punto de Venta (POS)
          </p>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-sans leading-tight tracking-tight text-slate-900">
            Tomá el control total de tu comercio y <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 font-extrabold">vendé más, sin complicaciones</span>
          </h1>

          <p className="text-sm md:text-base text-slate-650 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
            El sistema de ventas y stock inteligente diseñado para reemplazar tus planillas y cuadernos en minutos. Administrá tu inventario, deudas de clientes (fiados), turnos de caja y generá tu propia tienda online con un solo clic. Ideal para kioscos, almacenes, tiendas de ropa, carnicerías y más.
          </p>

          {/* ARCA & AI Invoice highlight box */}
          <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl max-w-xl mx-auto lg:mx-0 shadow-xs">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-xl shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="text-left">
              <span className="text-xs font-black text-emerald-850 block uppercase tracking-wider font-mono">¡NUEVO! Facturación Electrónica ARCA con IA</span>
              <p className="text-[11px] text-emerald-700 font-semibold leading-tight mt-0.5">
                Integración oficial con <strong>ARCA (ex-AFIP)</strong> y nuestro copiloto de <strong>Inteligencia Artificial</strong>. Emite facturas fiscales autorizadas directamente desde el POS de forma automática e inteligente.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
            <a
              href="#planes"
              className="w-full sm:w-auto px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-sm rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              Probar 30 Días Gratis
              <ArrowRight className="w-4.5 h-4.5" />
            </a>
            
            <button
              onClick={() => onLoginClick('login')}
              className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border border-slate-200 flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              Ingresar con mi cuenta de Comercio
            </button>

            <button
              onClick={() => onLoginClick('employee_login')}
              className="w-full sm:w-auto px-8 py-4 bg-orange-50 hover:bg-orange-100 border border-orange-200 text-orange-850 font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
            >
              <User className="w-4 h-4 text-orange-600" />
              Ingreso Empleados
            </button>
          </div>

          {/* Core Trust indicators */}
          <div className="grid grid-cols-3 gap-4 pt-8 max-w-md mx-auto lg:mx-0 text-left">
            <div className="space-y-1">
              <span className="text-lg md:text-xl font-black text-slate-900 font-mono block leading-none">+1,200</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Tiendas Activas</span>
            </div>
            <div className="space-y-1 border-l border-slate-200 pl-4">
              <span className="text-lg md:text-xl font-black text-slate-900 font-mono block leading-none">99.9%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Uptime Garantizado</span>
            </div>
            <div className="space-y-1 border-l border-slate-200 pl-4">
              <span className="text-lg md:text-xl font-black text-emerald-600 font-mono block leading-none">100%</span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">Local Argentina</span>
            </div>
          </div>

          {/* Interactive Demores Access Center */}
          <div className="mt-8 bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-md text-left max-w-md mx-auto lg:mx-0">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
              <span className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-black">Consola de Acceso y Demostración</span>
            </div>
            
            <p className="text-xs text-slate-650 leading-normal">
              Explora la app en vivo con un solo clic como <strong className="text-slate-900">Dueño de Comercio</strong> o como <strong className="text-slate-900">Comprador General</strong>:
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
              <button
                type="button"
                onClick={() => handleDirectDemoLogin('Administrador')}
                className="p-3 bg-blue-50/60 hover:bg-blue-105 border border-blue-200/50 hover:border-blue-300 rounded-xl text-left transition-all group flex items-start gap-2.5 cursor-pointer"
              >
                <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
                  <Store className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-black text-slate-800 group-hover:text-blue-700 block transition-colors">Demo Comercio</span>
                  <span className="text-[9px] text-slate-500 block mt-1 leading-none">Dueño / Empleado</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleDirectDemoLogin('Comprador')}
                className="p-3 bg-orange-50/50 hover:bg-orange-105 border border-orange-200/50 hover:border-orange-300 rounded-xl text-left transition-all group flex items-start gap-2.5 cursor-pointer"
              >
                <div className="p-1.5 bg-orange-100 text-orange-700 rounded-lg shrink-0 mt-0.5">
                  <Smartphone className="w-3.5 h-3.5" />
                </div>
                <div className="leading-tight">
                  <span className="text-xs font-black text-slate-800 group-hover:text-orange-700 block transition-colors">Demo Cliente</span>
                  <span className="text-[9px] text-slate-500 block mt-1 leading-none font-sans">Comprador General</span>
                </div>
              </button>
            </div>
            
            <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100 pt-2.5 font-mono uppercase">
              <span className="flex items-center gap-1"><Lock className="w-3 h-3 text-slate-400" /> Sin instalaciones</span>
              <span className="text-emerald-600 font-extrabold flex items-center gap-1">📍 Local e Instantáneo</span>
            </div>
          </div>
        </div>

        {/* Hero Interactive POS Mockup card */}
        <div className="flex-1 w-full max-w-xl">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl relative overflow-hidden group">
            {/* Top decorative browser dots */}
            <div className="flex items-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-[10px] font-mono text-slate-400 ml-2 font-bold tracking-wider">https://www.max24app.com/terminal-pos</span>
            </div>

            {/* Core interface simulator content */}
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex justify-between items-center">
                <div>
                  <span className="text-[9px] uppercase tracking-wider font-mono text-blue-600 font-bold">Caja nro 1</span>
                  <p className="text-sm font-black text-slate-900 mt-0.5">Terminal Punto de Venta (POS)</p>
                </div>
                <div className="bg-emerald-100 border border-emerald-200 text-emerald-700 text-[10px] px-2.5 py-1 rounded-lg font-bold font-mono">
                  Online
                </div>
              </div>

              {/* Sample simulated transaction */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest block font-bold">Lista de Compra actual</span>
                <div className="divide-y divide-slate-100 bg-slate-50 p-3 rounded-2xl border border-slate-150 text-xs">
                  <div className="py-2 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-800">2x Aceite Girasol 1.5L</span>
                      <span className="block text-[10px] text-slate-500 font-mono mt-0.5">$3.200 c/u</span>
                    </div>
                    <span className="font-bold font-mono text-slate-950">$6.400,00</span>
                  </div>
                  <div className="py-2 flex justify-between">
                    <div>
                      <span className="font-bold text-slate-800">3x Leche Entera Larga Vida 1L</span>
                      <span className="block text-[10px] text-slate-500 font-mono mt-0.5">$1.200 c/u</span>
                    </div>
                    <span className="font-bold font-mono text-slate-950">$3.600,00</span>
                  </div>
                </div>
              </div>

              {/* Total simulation box */}
              <div className="p-4 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl border border-blue-500 flex justify-between items-center text-white">
                <div className="text-left">
                  <span className="text-[10px] text-blue-100 uppercase font-mono tracking-widest font-bold">Total a Cobrar</span>
                  <p className="text-2xl font-black text-white font-mono mt-0.5">$10.000,00</p>
                </div>
                <div className="text-right space-y-1">
                  <span className="text-[9px] text-blue-100 block font-bold">Cobrar con:</span>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-1 bg-white/10 text-[9px] font-bold text-white rounded-md">💳 Tarjeta</span>
                    <span className="px-2 py-1 bg-white text-blue-600 text-[9px] font-black rounded-md">💵 Efectivo</span>
                  </div>
                </div>
              </div>
            </div>
            {/* Interactive hint caption */}
            <p className="text-[11px] text-slate-500 font-sans text-center mt-3.5 leading-relaxed font-semibold">
              📸 <b>Simulador de Interfaz Real</b>: Así luce MAX24 en tu negocio. Hacé clic en los botones de "Demo Comercio" abajo para probar el sistema completo en vivo.
            </p>
          </div>
        </div>
      </section>

      {/* SECCIÓN INTERACTIVA DE NUEVAS FUNCIONALIDADES Y EJEMPLOS REALES */}
      <section id="showcase-novedades" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200 scroll-mt-20">
        <div className="space-y-4 text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-indigo-100 text-indigo-850 border border-indigo-200 rounded-full text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-600 animate-pulse" />
            ¡Exclusivo para Nuevos Clientes!
          </div>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Probar nuestro <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-indigo-600 to-emerald-600 font-extrabold">Programa para Control de Stock y Ventas</span> en Vivo
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold max-w-2xl mx-auto">
            Hicimos de MAX24 el software de gestión más potente y accesible de Argentina. Interactúa con los ejemplos reales a continuación y descubre todo lo que vas a poder hacer en tu negocio.
          </p>
        </div>

        {/* Showcase Bento Grid container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
          {/* Tabs Selector list (4 columns) */}
          <div className="lg:col-span-4 flex flex-col gap-2.5 z-10 text-left">
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-bold block mb-1">
              Selecciona una Innovación para probar:
            </span>

            {/* Tab 1: POS Scan */}
            <button
              type="button"
              onClick={() => {
                setActiveShowcaseTab('pos-scan');
                handleDemoElementHover('Módulo de Punto de Venta con Escaneo Automatizado de códigos de barras. Simule registrar productos con lector físico.');
              }}
              onMouseEnter={() => handleDemoElementHover('Punto de venta y escaneo rápido')}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${activeShowcaseTab === 'pos-scan' ? 'bg-orange-50/50 border-orange-500 shadow-xs' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${activeShowcaseTab === 'pos-scan' ? 'bg-orange-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                <ShoppingBag className="w-4.5 h-4.5" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-xs text-slate-900 block">Punto de Venta con Auto-Escáner</span>
                <span className="text-[10px] text-slate-500 block mt-1">Suma items al instante ingresando un SKU o código de barra.</span>
              </div>
            </button>

            {/* Tab 2: CSV Importer */}
            <button
              type="button"
              onClick={() => {
                setActiveShowcaseTab('csv-import');
                handleDemoElementHover('Módulo de Importador Inteligente de Catálogo. Arrastre y suelte planillas CSV o JSON para migrar masivamente.');
              }}
              onMouseEnter={() => handleDemoElementHover('Importador de planillas de mercadería')}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${activeShowcaseTab === 'csv-import' ? 'bg-blue-50/50 border-blue-500 shadow-xs' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${activeShowcaseTab === 'csv-import' ? 'bg-blue-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                <FileSpreadsheet className="w-4.5 h-4.5" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-xs text-slate-900 block">Importador de Catálogo CSV / JSON</span>
                <span className="text-[10px] text-slate-500 block mt-1">Carga tu lista de precios anterior con auto-detección y de-duplicación.</span>
              </div>
            </button>

            {/* Tab 3: Auth 2FA */}
            <button
              type="button"
              onClick={() => {
                setActiveShowcaseTab('auth-2fa');
                handleDemoElementHover('Módulo de Autenticación Segura de Doble Factor por correo. Simule un inicio de sesión blindado.');
              }}
              onMouseEnter={() => handleDemoElementHover('Seguridad multi-factor para administradores')}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${activeShowcaseTab === 'auth-2fa' ? 'bg-indigo-50/50 border-indigo-500 shadow-xs' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${activeShowcaseTab === 'auth-2fa' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                <Key className="w-4.5 h-4.5" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-xs text-slate-900 block">Seguridad Multi-Factor (2FA OTP)</span>
                <span className="text-[10px] text-slate-500 block mt-1">Protege tus finanzas con un pin dinámico por SMTP corporativo.</span>
              </div>
            </button>

            {/* Tab 4: Fixed costs & Profitability */}
            <button
              type="button"
              onClick={() => {
                setActiveShowcaseTab('finance-net');
                handleDemoElementHover('Módulo de Control de Costos Fijos Mensuales y Ganancia Real Operativa. Optimice sus utilidades netas.');
              }}
              onMouseEnter={() => handleDemoElementHover('Cálculo de rentabilidad y costos mensuales')}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${activeShowcaseTab === 'finance-net' ? 'bg-emerald-50/50 border-emerald-500 shadow-xs' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${activeShowcaseTab === 'finance-net' ? 'bg-emerald-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                <DollarSign className="w-4.5 h-4.5" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-xs text-slate-900 block">Utilidad Neta y Gastos Fijos</span>
                <span className="text-[10px] text-slate-500 block mt-1">Configura Alquiler, Luz e Internet para ver tus márgenes netos reales.</span>
              </div>
            </button>

            {/* Tab 5: Accessibility */}
            <button
              type="button"
              onClick={() => {
                setActiveShowcaseTab('accessibility');
                handleDemoElementHover('Asistente de Voces y Narrador de Accesibilidad. Soporte TalkBack para discapacidades visuales e hipoacúsicos.');
              }}
              onMouseEnter={() => handleDemoElementHover('Opciones de accesibilidad global para empleados y clientes')}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${activeShowcaseTab === 'accessibility' ? 'bg-cyan-50/50 border-cyan-500 shadow-xs' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${activeShowcaseTab === 'accessibility' ? 'bg-cyan-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                <Volume2 className="w-4.5 h-4.5" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-xs text-slate-900 block">Accesibilidad y TalkBack Integrado</span>
                <span className="text-[10px] text-slate-500 block mt-1">Inclusión digital con narrador de voz nativo y subtitulado en vivo.</span>
              </div>
            </button>

            {/* Tab 6: SaaS yearly toggle */}
            <button
              type="button"
              onClick={() => {
                setActiveShowcaseTab('saas-mp');
                handleDemoElementHover('Módulo de Planes SaaS y pasarela de Mercado Pago. Pruebe contratar licencias anuales con dieciséis por ciento de descuento.');
              }}
              onMouseEnter={() => handleDemoElementHover('Planes de suscripción SaaS con Mercado Pago')}
              className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-3.5 ${activeShowcaseTab === 'saas-mp' ? 'bg-purple-50/50 border-purple-500 shadow-xs' : 'bg-slate-50 border-slate-100 hover:bg-slate-100/50'}`}
            >
              <div className={`p-2 rounded-xl shrink-0 ${activeShowcaseTab === 'saas-mp' ? 'bg-purple-500 text-white shadow-sm' : 'bg-slate-200 text-slate-600'}`}>
                <Percent className="w-4.5 h-4.5" />
              </div>
              <div className="leading-tight">
                <span className="font-extrabold text-xs text-slate-900 block">Planes SaaS y Mercado Pago</span>
                <span className="text-[10px] text-slate-500 block mt-1">Conmutación de abonos con 16% de ahorro (2 meses gratis de regalo).</span>
              </div>
            </button>
          </div>

          {/* Right workspace details / interactive simulator (8 columns) */}
          <div className="lg:col-span-8 bg-slate-900 border border-slate-850 rounded-2xl p-5 md:p-6 flex flex-col justify-between min-h-[440px] z-10 transition-all duration-300 relative text-left">
            
            {/* Ambient subtle light inside box */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-2xl rounded-full pointer-events-none" />

            {/* WORKSPACE 1: POS SCAN & AUTO-ADD DEMO */}
            {activeShowcaseTab === 'pos-scan' && (
              <div className="space-y-4 flex flex-col justify-between h-full animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono uppercase text-orange-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping" />
                      Demostración de Escáner y SKU Coincidencia Instantánea
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Punto de Venta ágil</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Nuestra terminal POS detecta la escritura exacta de códigos de barra o SKUs y intercepta la tecla <strong className="text-orange-400">Enter</strong> que envían los lectores físicos para añadir el producto de forma instantánea al mostrador, sin que el cajero deba usar el mouse ni presionar botones de búsqueda.
                  </p>

                  {scanMessage && (
                    <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs rounded-xl flex items-center gap-2 animate-bounce">
                      <span className="p-1 bg-emerald-500/20 text-emerald-400 rounded-lg">🔊 Beep!</span>
                      <span>{scanMessage}</span>
                    </div>
                  )}

                  {/* Simulated Reader Input Frame */}
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-3">
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                      <div className="relative w-full">
                        <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-650">SKU / Código:</span>
                        <input
                          type="text"
                          placeholder="Ingrese o presione un botón de abajo..."
                          value={scannedQuery}
                          onChange={(e) => setScannedQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (scannedQuery === '77901230' || scannedQuery === '77901231' || scannedQuery === '77901232') {
                                // Handled by useEffect, but trigger sound notification
                                setScanMessage(`[Escaner Lector] Interceptada tecla ENTER para el código "${scannedQuery}" de forma exitosa.`);
                              } else {
                                setScanMessage(`Código "${scannedQuery}" no coincide. Intente con los códigos sugeridos abajo.`);
                                setTimeout(() => setScanMessage(null), 3000);
                              }
                            }
                          }}
                          className="w-full bg-slate-900 border border-slate-800 rounded-xl py-2 pl-24 pr-4 text-xs font-mono font-bold text-orange-400 focus:outline-hidden focus:border-orange-500 text-left"
                        />
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 uppercase">O presione ENTER en el input</span>
                    </div>

                    {/* Pre-scanned quick simulator buttons */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setScannedQuery('77901231');
                          handleDemoElementHover('Escanear Yerba Mate Playadito uno de los productos de alta rotación.');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10.5px] font-bold rounded-lg text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🛒 Escanear Yerba Playadito (77901231)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScannedQuery('77901230');
                          handleDemoElementHover('Escanear Aceite Girasol Natura de uno coma cinco litros.');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10.5px] font-bold rounded-lg text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🛒 Escanear Aceite Natura (77901230)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setScannedQuery('77901232');
                          handleDemoElementHover('Escanear gaseosa Coca-Cola de dos coma veinticinco litros.');
                        }}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-[10.5px] font-bold rounded-lg text-slate-300 transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <span>🛒 Escanear Coca-Cola (77901232)</span>
                      </button>
                    </div>
                  </div>

                  {/* Simulated cart table */}
                  <div className="bg-slate-950 rounded-xl p-3 border border-slate-850">
                    <span className="text-[9px] font-mono text-slate-550 uppercase font-bold block mb-2 text-left">Ticket de Compra en Pantalla</span>
                    <div className="space-y-1 text-xs">
                      {scanCart.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-1.5 border-b border-slate-900 last:border-0">
                          <div className="text-left">
                            <span className="font-bold text-slate-200">{item.name}</span>
                            <span className="text-[10px] text-slate-550 block font-mono font-medium">Cód: {item.code} | Cantidad: {item.qty}</span>
                          </div>
                          <span className="font-mono font-bold text-orange-400 text-right">${(item.price * item.qty).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                      {scanCart.length === 0 && (
                        <p className="text-slate-500 py-2 text-center">No hay productos en el ticket actual.</p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800">
                  <span>Presiona un botón de escaneo para ver cómo reacciona de forma automática.</span>
                  <button
                    type="button"
                    onClick={() => {
                      setScanCart([]);
                      handleDemoElementHover('Limpiar simulador de ticket.');
                    }}
                    className="text-orange-400 hover:underline font-bold text-[10px] cursor-pointer bg-transparent border-0"
                  >
                    Vaciar Ticket
                  </button>
                </div>
              </div>
            )}

            {/* WORKSPACE 2: CSV IMPORTER */}
            {activeShowcaseTab === 'csv-import' && (
              <div className="space-y-4 flex flex-col justify-between h-full animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono uppercase text-blue-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      Asistente de Importación Inteligente (CSV / JSON)
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Inventario de Mercadería</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">
                    Evita la tortura de cargar tu stock a mano. MAX24 cuenta con un importador ágil que detecta automáticamente si tu archivo CSV usa <strong className="text-blue-400">comas (,)</strong> o <strong className="text-blue-400">punto y coma (;)</strong> (habitual en exportaciones de Excel de Argentina), mapea sinónimos de encabezados y de-duplica SKUs repetidos.
                  </p>

                  {!csvFileUploaded ? (
                    <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/80 rounded-2xl p-6 text-center space-y-3 bg-slate-950/50 transition-all cursor-pointer group"
                      onClick={() => {
                        setCsvFileUploaded(true);
                        setDetectedDelimiter('Punto y coma (;) - Formato Excel AR');
                        setCsvHeaders(['Nombre_Producto', 'SKU_Codigo', 'Costo_Unitario', 'Precio_Venta', 'Stock_Actual']);
                        setCsvDuplicateCount(3);
                        setCsvRows([
                          { name: 'Yerba Mate Playadito 1kg', sku: '77901231', cost: 2200, price: 3200, stock: 24, status: 'Sobrescrito (Duplicado)' },
                          { name: 'Aceite de Girasol Natura 1.5L', sku: '77901230', cost: 2100, price: 3200, stock: 12, status: 'Sobrescrito (Duplicado)' },
                          { name: 'Galletitas Melba Terrabusi 120g', sku: '77911122', cost: 450, price: 750, stock: 40, status: 'Producto Nuevo' },
                          { name: 'Fideos Tallarín Lucchetti 500g', sku: '77933344', cost: 380, price: 650, stock: 50, status: 'Producto Nuevo' }
                        ]);
                        handleDemoElementHover('Planilla cargada. Se detectaron cuatro productos, de los cuales dos ya existían y fueron sobrescritos de forma automática para evitar duplicados.');
                      }}
                    >
                      <Upload className="w-8 h-8 text-slate-500 mx-auto group-hover:text-blue-400 transition-colors animate-bounce" />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-200">Simula cargar una base de datos externa de mercadería</h4>
                        <p className="text-[10px] text-slate-500 max-w-sm mx-auto">Haz clic aquí para cargar una planilla de muestra con formato local de Excel Argentina.</p>
                      </div>
                      <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 font-bold text-[9px] uppercase rounded-lg">
                        📂 Probar Importador
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-3 animate-fade-in text-left">
                      {/* Detection specs box */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10.5px]">
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-bold font-mono">Delimitador Detectado</span>
                          <strong className="text-emerald-400 font-mono">{detectedDelimiter}</strong>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-bold font-mono">Columnas Mapeadas</span>
                          <strong className="text-blue-400 font-mono">5 columnas (Inteligente)</strong>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-xl border border-slate-850">
                          <span className="text-[8.5px] text-slate-500 block uppercase font-bold font-mono">Items Duplicados SKU</span>
                          <strong className="text-orange-400 font-mono">2 actualizados (0 duplicados)</strong>
                        </div>
                      </div>

                      {/* Tabular preview */}
                      <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850 overflow-x-auto">
                        <span className="text-[8.5px] font-mono text-slate-550 uppercase tracking-widest block font-bold mb-1.5 text-left">Vista previa de productos a importar</span>
                        <table className="w-full text-[10px] text-left">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 font-bold">
                              <th className="py-1">Nombre (Mapeado)</th>
                              <th className="py-1">SKU</th>
                              <th className="py-1 text-center">Costo</th>
                              <th className="py-1 text-center">Precio</th>
                              <th className="py-1 text-center">Stock</th>
                              <th className="py-1 text-right">Resultado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900 text-slate-300">
                            {csvRows.map((row, index) => (
                              <tr key={index} className="hover:bg-slate-900/50">
                                <td className="py-1.5 font-bold truncate max-w-[130px]">{row.name}</td>
                                <td className="py-1.5 font-mono text-slate-400">{row.sku}</td>
                                <td className="py-1.5 font-mono text-center">${row.cost}</td>
                                <td className="py-1.5 font-mono text-center text-emerald-400">${row.price}</td>
                                <td className="py-1.5 font-mono text-center">{row.stock}</td>
                                <td className={`py-1.5 text-right font-semibold text-[9.5px] ${row.status.includes('Sobrescrito') ? 'text-amber-500' : 'text-emerald-500'}`}>
                                  {row.status}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-3 border-t border-slate-800">
                  <span>Soporta mapear nombres de columnas como 'price', 'precio_venta', 'costo_unitario', etc.</span>
                  {csvFileUploaded && (
                    <button
                      type="button"
                      onClick={() => {
                        setCsvFileUploaded(false);
                        handleDemoElementHover('Reiniciar simulador de importación.');
                      }}
                      className="text-blue-400 hover:underline font-bold text-[10px] cursor-pointer bg-transparent border-0"
                    >
                      Cargar otro archivo
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* WORKSPACE 3: AUTH 2FA SECURE OTP */}
            {activeShowcaseTab === 'auth-2fa' && (
              <div className="space-y-4 flex flex-col justify-between h-full animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono uppercase text-indigo-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                      Flujo de Seguridad Multicapa (2FA OTP) por SMTP
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Control de Acceso Seguro</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed text-left">
                    Para resguardar tus deudas, ventas y parámetros, los administradores cuentan con un blindaje de <strong className="text-indigo-400">Doble Factor de Autenticación (2FA)</strong>. Al ingresar con tu clave, el sistema despacha al instante un código OTP único por SMTP seguro de Hostinger con expiración cronometrada.
                  </p>

                  {/* Mail inbox simulation popup */}
                  {authStep === 'otp' && (
                    <div className="bg-gradient-to-r from-blue-950 to-indigo-950 border border-blue-800 p-3 rounded-xl space-y-2 text-[11px] text-left shadow-lg animate-scale-up">
                      <div className="flex justify-between items-center text-[9px] text-blue-300 font-mono border-b border-blue-900 pb-1.5">
                        <span className="flex items-center gap-1">📨 NUEVO CORREO RECIBIDO: seguridad@max24app.com</span>
                        <span className="font-bold text-amber-400">Bandeja de Entrada BigMAX</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-bold text-white text-left">Código de Seguridad MAX24 para Inicio de Sesión</p>
                        <p className="text-slate-300 text-left">
                          Hola Administrador BigMAX, tu código OTP de validación para ingresar a tu comercio es: <strong className="text-lg font-mono text-amber-400 select-all tracking-wider px-2 py-0.5 bg-slate-950/80 rounded border border-slate-800 ml-1 font-black">{receivedOtpCode}</strong>
                        </p>
                        <span className="text-[9px] text-slate-400 block font-mono text-left">Emisor: Servidores Seguros Hostinger Argentina • Validez: 2 minutos.</span>
                      </div>
                    </div>
                  )}

                  {/* Simulated screen box */}
                  <div className="bg-slate-950 p-5 rounded-xl border border-slate-850 max-w-sm mx-auto text-center space-y-4">
                    {authStep === 'login' && (
                      <div className="space-y-3">
                        <div className="w-10 h-10 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center mx-auto border border-indigo-500/20">
                          <Lock className="w-5 h-5 animate-pulse" />
                        </div>
                        <h4 className="text-xs font-bold text-slate-200">Ingreso Administrativo Blindado</h4>
                        <div className="space-y-2 text-left">
                          <div>
                            <label className="text-[8.5px] font-mono text-slate-500 block uppercase font-bold mb-1">E-mail del Comercio</label>
                            <input
                              type="text"
                              disabled
                              value={authEmail}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-semibold text-slate-300"
                            />
                          </div>
                          <div>
                            <label className="text-[8.5px] font-mono text-slate-500 block uppercase font-bold mb-1">Contraseña</label>
                            <input
                              type="password"
                              disabled
                              value={authPassword}
                              className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs font-semibold text-slate-550"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
                            setReceivedOtpCode(generatedOtp);
                            setOtpTimer(120);
                            setOtpMessage(null);
                            setAuth2faOtp('');
                            setAuthStep('otp');
                            handleDemoElementHover(`Inicio de sesión iniciado. Código OTP ${generatedOtp} despachado de forma asíncrona a Hostinger.`);
                          }}
                          className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer border-0"
                        >
                          Iniciar Sesión & Enviar OTP
                        </button>
                      </div>
                    )}

                    {authStep === 'otp' && (
                      <div className="space-y-3 animate-fade-in text-center">
                        <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center mx-auto border border-amber-500/20">
                          <Key className="w-5 h-5 animate-pulse" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-200">Verificación de Doble Factor</h4>
                          <p className="text-[10px] text-slate-400 mt-1">Hemos enviado un código a su casilla Hostinger. Ingréselo abajo.</p>
                        </div>

                        <div className="space-y-2">
                          <input
                            type="text"
                            maxLength={6}
                            placeholder="Ingrese código de 6 dígitos"
                            value={auth2faOtp}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setAuth2faOtp(val);
                              if (val === receivedOtpCode) {
                                setAuthStep('success');
                                handleDemoElementHover('Código verificado con éxito. Sesión de administrador activa y autorizada.');
                              }
                            }}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-center font-mono font-bold text-lg text-amber-400 tracking-widest focus:outline-hidden focus:border-amber-500"
                          />

                          <div className="flex justify-between items-center text-[10px] text-slate-500">
                            <span>Expiración en: <strong className="font-mono text-slate-300 font-extrabold">{Math.floor(otpTimer / 60)}:{(otpTimer % 60).toString().padStart(2, '0')}</strong></span>
                            <button
                              type="button"
                              onClick={() => {
                                const generatedOtp = String(Math.floor(100000 + Math.random() * 900000));
                                setReceivedOtpCode(generatedOtp);
                                setOtpTimer(120);
                                setOtpMessage('Nuevo código OTP reenviado con éxito.');
                                setAuth2faOtp('');
                                handleDemoElementHover(`Código OTP reenviado con éxito.`);
                              }}
                              className="text-indigo-400 hover:underline font-bold bg-transparent border-0 cursor-pointer"
                            >
                              Reenviar Código
                            </button>
                          </div>
                        </div>

                        {otpMessage && <p className="text-[9.5px] text-indigo-400 font-bold text-left">{otpMessage}</p>}
                      </div>
                    )}

                    {authStep === 'success' && (
                      <div className="space-y-3 py-4 animate-scale-up text-center">
                        <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full flex items-center justify-center mx-auto text-xl font-black">
                          ✓
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white">¡Ingreso Exitoso Autorizado!</h4>
                          <p className="text-[10.5px] text-slate-400 mt-1 max-w-xs mx-auto">Bienvenido, Administrador BigMAX. Tu firma digital y control de caja están 100% activos.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setAuthStep('login');
                            handleDemoElementHover('Reiniciar simulador de inicio de sesión.');
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[10px] font-bold text-slate-300 rounded-lg cursor-pointer"
                        >
                          Volver a Simular
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800 text-left">
                  🛡️ <b>Hostinger SMTP Integrado</b>: La app despacha correos responsivos reales con encriptación para resguardar la identidad de cada comercio de forma infalible.
                </div>
              </div>
            )}

            {/* WORKSPACE 4: FIXED COSTS & NET PROFIT CALCULATOR */}
            {activeShowcaseTab === 'finance-net' && (
              <div className="space-y-4 flex flex-col justify-between h-full animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Motor de Ganancia Real & Estado de Resultados
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Finanzas PyME</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed text-left">
                    Las ventas brutas no reflejan la salud de tu negocio. El módulo financiero de MAX24 calcula tu <strong className="text-emerald-400">Ganancia Real (Utilidad Neta)</strong> restando automáticamente de tus ventas brutas tanto el costo de reposición de mercadería vendida, como los costos operativos fijos mensuales de tu local.
                  </p>

                  {/* Net profit balance ledger widget */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-stretch pt-1">
                    
                    {/* Fixed costs checks (7 cols) */}
                    <div className="md:col-span-7 bg-slate-950 p-3 rounded-xl border border-slate-850 space-y-2 text-left">
                      <span className="text-[9px] font-mono text-slate-500 block uppercase font-bold text-left">Control de Gastos Operativos Fijos</span>
                      
                      <div className="space-y-1.5 text-xs text-left">
                        {financeFixedCosts.map((cost) => (
                          <label key={cost.id} className="flex items-center justify-between p-1.5 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-700 cursor-pointer select-none text-left">
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={cost.active}
                                onChange={() => {
                                  setFinanceFixedCosts(prev => prev.map(c => c.id === cost.id ? { ...c, active: !c.active } : c));
                                }}
                                className="rounded text-emerald-650 focus:ring-0 bg-slate-950 border-slate-700"
                              />
                              <span className="text-[10.5px] font-medium text-slate-300">{cost.name}</span>
                            </div>
                            <span className="font-mono text-slate-450 font-bold text-[10.5px]">${cost.amount.toLocaleString('es-AR')}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Result card (5 cols) */}
                    <div className="md:col-span-5 bg-slate-950 p-3.5 rounded-xl border border-slate-850 flex flex-col justify-between space-y-4 text-left">
                      <div className="space-y-2 text-left text-xs">
                        <div>
                          <span className="text-[8px] text-slate-500 font-mono block font-bold uppercase leading-none">Ventas Totales Brutas</span>
                          <span className="font-mono font-bold text-slate-300 block mt-0.5">${financeRevenue.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 font-mono block font-bold uppercase leading-none">Costo de Mercadería</span>
                          <span className="font-mono font-bold text-rose-500 block mt-0.5">-${financeCostOfGoods.toLocaleString('es-AR')}</span>
                        </div>
                        <div>
                          <span className="text-[8px] text-slate-500 font-mono block font-bold uppercase leading-none">Gastos Fijos Deducidos</span>
                          <span className="font-mono font-bold text-rose-500 block mt-0.5">
                            -${financeFixedCosts.reduce((acc, c) => acc + (c.active ? c.amount : 0), 0).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>

                      {/* Final Net profit */}
                      <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-left">
                        <span className="text-[8px] text-emerald-400 font-mono block font-bold uppercase leading-none">UTILIDAD NETA (Ganancia Real)</span>
                        <strong className="text-sm font-mono font-black text-emerald-400 block mt-1 text-left">
                          ${(financeRevenue - financeCostOfGoods - financeFixedCosts.reduce((acc, c) => acc + (c.active ? c.amount : 0), 0)).toLocaleString('es-AR')} ARS
                        </strong>
                        <span className="text-[8.5px] text-emerald-500 font-bold uppercase block mt-1 leading-none font-mono">✓ Comercio con Superávit</span>
                      </div>
                    </div>

                  </div>
                </div>

                <div className="text-[9.5px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800 text-left">
                  📊 <b>Rentabilidad PyME</b>: Podes añadir categorías personalizadas para controlar balances de forma ágil desde el panel administrativo, eliminando cálculos manuales al final del mes.
                </div>
              </div>
            )}

            {/* WORKSPACE 5: ACCESSIBILITY ASSISTANT & SUBTITLES */}
            {activeShowcaseTab === 'accessibility' && (
              <div className="space-y-4 flex flex-col justify-between h-full animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono uppercase text-cyan-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                      Asistente Voces & Narrador de Accesibilidad (TalkBack)
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Inclusión Digital</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed text-left">
                    Para facilitar el trabajo de cajeros y la experiencia de compradores con discapacidades de visión o hipoacusias, MAX24 incluye un asistente global con <strong className="text-cyan-400">síntesis de voz en español</strong> (HTML5 SpeechSynthesis) que narra elementos en hover/foco y renderiza <strong className="text-cyan-400">subtítulos en tiempo real</strong> en pantalla.
                  </p>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4">
                    {/* Mode toggles */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-900 pb-3 text-left">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="text-slate-300 font-bold">Asistente Narrador de Voz:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setAssistVoiceOn(!assistVoiceOn);
                            if (!assistVoiceOn) {
                              setAssistSubtitles('[Lector de Voz Iniciado] - Hola, bienvenido al asistente de accesibilidad de MAX24.');
                            } else {
                              setAssistSubtitles('');
                            }
                          }}
                          className={`px-3 py-1 text-[10px] font-extrabold rounded-lg uppercase cursor-pointer border-0 ${assistVoiceOn ? 'bg-cyan-500 text-slate-950 font-black shadow-md' : 'bg-slate-800 text-slate-400'}`}
                        >
                          {assistVoiceOn ? '✓ ACTIVADO' : 'DESACTIVADO'}
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setAssistContrast(!assistContrast);
                            handleDemoElementHover(assistContrast ? 'Desconectar paleta de alto contraste.' : 'Conectar paleta de colores de alto contraste con letras amarillas.');
                          }}
                          className={`px-2.5 py-1 text-[9px] font-bold rounded-md cursor-pointer border-0 ${assistContrast ? 'bg-yellow-400 text-slate-950' : 'bg-slate-900 text-slate-450'}`}
                        >
                          🌓 Alto Contraste
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setAssistZoom(!assistZoom);
                            handleDemoElementHover(assistZoom ? 'Desconectar escala de letra grande.' : 'Conectar zoom de letra grande para mejor lectura ocular.');
                          }}
                          className={`px-2.5 py-1 text-[9px] font-bold rounded-md cursor-pointer border-0 ${assistZoom ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-450'}`}
                        >
                          🔍 Letra Grande
                        </button>
                      </div>
                    </div>

                    {/* Interactive elements block inside */}
                    <div className={`p-4 rounded-xl space-y-3 border transition-all duration-350 text-left ${assistContrast ? 'bg-black border-yellow-400 text-yellow-400' : 'bg-slate-900 border-slate-800 text-slate-250'} ${assistZoom ? 'text-sm' : 'text-xs'}`}>
                      <h4 className={`font-bold text-left ${assistContrast ? 'text-yellow-400' : 'text-white'}`}>Muestra de Panel de Operación de Tienda</h4>
                      
                      <div className="grid grid-cols-2 gap-3 text-[10px]">
                        <button
                          type="button"
                          onMouseEnter={() => handleDemoElementHover('Boton: Registrar venta en efectivo. Presione para confirmar el pago.')}
                          onClick={() => handleDemoElementHover('Venta procesada con éxito por un monto de tres mil doscientos pesos.')}
                          className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-lg text-center cursor-pointer font-bold text-slate-300 hover:text-white"
                        >
                          💵 Cobrar Efectivo
                        </button>
                        <button
                          type="button"
                          onMouseEnter={() => handleDemoElementHover('Boton: Generar recibo o ticket digital. Presione para despachar comprobante por correo.')}
                          onClick={() => handleDemoElementHover('Generando ticket en formato responsivo seguro.')}
                          className="p-3 bg-slate-950 border border-slate-800 hover:border-cyan-500 rounded-lg text-center cursor-pointer font-bold text-slate-300 hover:text-white"
                        >
                          📄 Imprimir Ticket
                        </button>
                      </div>
                    </div>

                    {/* Subtitle Display (Always visible if subtitles exist, simulating our floating helper) */}
                    <div className="bg-slate-950/80 p-2.5 rounded-lg border border-slate-850 text-left min-h-[44px]">
                      <span className="text-[7.5px] font-mono text-slate-500 uppercase font-black tracking-widest block mb-1 text-left">Subtítulos flotantes de apoyo auditivo (Hipoacúsicos)</span>
                      <p className="text-[10px] font-mono text-cyan-400 font-bold leading-normal text-left">
                        {assistSubtitles || 'Hacer hover sobre los botones de arriba para simular la narración...'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800 text-left">
                  🔊 <b>Inclusión Completa</b>: El asistente de accesibilidad opera globalmente en toda la suite de MAX24, facilitando enormemente las de-duplicaciones y auditorías de manera adaptativa.
                </div>
              </div>
            )}

            {/* WORKSPACE 6: SAAS PLANS & MERCADO PAGO 16% OFF INTEGRATION */}
            {activeShowcaseTab === 'saas-mp' && (
              <div className="space-y-4 flex flex-col justify-between h-full animate-fade-in">
                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                    <span className="text-[10px] font-mono uppercase text-purple-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      Planificación SaaS y Pago Integrado con Mercado Pago
                    </span>
                    <span className="text-[9px] text-slate-500 font-mono">Facturación Integrada</span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed text-left">
                    Maximiza tus ahorros con nuestra facturación simplificada. Conmutando a la modalidad de <strong className="text-purple-400">Plan Anual (16% de descuento de regalo)</strong>, tu comercio se bonifica con 2 meses gratuitos enteros para operar sin costos adicionales en Argentina.
                  </p>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-4 text-left">
                    {/* Toggle Selector */}
                    <div className="flex items-center justify-between bg-slate-900 p-2 rounded-xl border border-slate-800 text-left">
                      <div className="text-left text-xs">
                        <span className="text-[9.5px] text-slate-500 font-mono uppercase font-black block">Ciclo de Suscripción activo</span>
                        <strong className="text-white">{isYearlyPlan ? 'Facturación Anual (Ahorro 16% - 2 meses gratis)' : 'Facturación Mensual'}</strong>
                      </div>
                      
                      {/* Interactive toggle pill */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsYearlyPlan(!isYearlyPlan);
                        }}
                        className="p-1 bg-slate-950 border border-slate-800 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-md ${!isYearlyPlan ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500'}`}>Mensual</span>
                        <span className={`px-2.5 py-1 text-[10px] font-black rounded-md ${isYearlyPlan ? 'bg-purple-600 text-white shadow-sm' : 'text-slate-500'}`}>Anual (16% OFF)</span>
                      </button>
                    </div>

                    {/* Comparison rates row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left">
                      
                      {/* Plan Básico rates */}
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-left">
                        <span className="text-[8px] font-mono text-slate-500 uppercase font-black block text-left">Plan Básico</span>
                        <strong className="text-xs text-slate-200 mt-1 block text-left">
                          ${isYearlyPlan ? '12.500' : '15.000'} <span className="text-[8.5px] font-normal text-slate-400 font-sans">ARS / mes</span>
                        </strong>
                        {isYearlyPlan && <span className="text-[8px] text-emerald-450 font-bold block mt-1 font-mono uppercase text-left">Ahorras $30.000 anuales</span>}
                      </div>

                      {/* Plan Profesional rates */}
                      <div className="bg-slate-900 p-3 rounded-xl border border-purple-550 shadow-sm relative overflow-hidden text-left">
                        <span className="text-[8px] font-mono text-purple-400 uppercase font-black block text-left">Plan Profesional</span>
                        <strong className="text-xs text-white mt-1 block text-left">
                          ${isYearlyPlan ? '25.000' : '30.000'} <span className="text-[8.5px] font-normal text-slate-400 font-sans">ARS / mes</span>
                        </strong>
                        {isYearlyPlan && <span className="text-[8px] text-emerald-450 font-bold block mt-1 font-mono uppercase text-left">Ahorras $60.000 anuales</span>}
                      </div>

                      {/* Plan Empresarial rates */}
                      <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-left">
                        <span className="text-[8px] font-mono text-slate-500 uppercase font-black block text-left">Plan Empresarial</span>
                        <strong className="text-xs text-slate-200 mt-1 block text-left">
                          ${isYearlyPlan ? '50.000' : '60.000'} <span className="text-[8.5px] font-normal text-slate-400 font-sans">ARS / mes</span>
                        </strong>
                        {isYearlyPlan && <span className="text-[8px] text-emerald-450 font-bold block mt-1 font-mono uppercase text-left">Ahorras $120.000 anuales</span>}
                      </div>

                    </div>

                    {/* Integrated checkout simulation button */}
                    <button
                      type="button"
                      onClick={() => {
                        handleDemoElementHover('Suscripcion iniciada. Pasarela oficial cargando Mercado Pago en pesos.');
                        alert('Simulación de Pago: Has iniciado el checkout con Mercado Pago para tu comercio. Al abonar, tu licencia se actualizará inmediatamente en la base de datos segura.');
                      }}
                      className="w-full py-2.5 bg-purple-600 hover:bg-purple-550 text-white font-black text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 cursor-pointer border-0"
                    >
                      <span>💳 Cobrar Plan Seleccionado vía Mercado Pago</span>
                    </button>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-500 leading-relaxed pt-2 border-t border-slate-800 text-left">
                  ⚡ <b>Sincronización Interactiva</b>: Las credenciales de pago se validan en tiempo real contra Firestore, permitiendo a los de-duplicar operaciones.
                </div>
              </div>
            )}

          </div>
        </div>
      </section>

      {/* Rubros y Verticales del Negocio */}
      <section id="rubros" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200 scroll-mt-20">
        <div className="space-y-4 text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs tracking-widest uppercase font-black text-orange-600 font-mono block">
            ADAPTADO A TU NEGOCIO
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            Soluciones Especializadas para <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-indigo-600 to-blue-600 font-extrabold">Cada Tipo de Rubro</span>
          </h2>
          <p className="text-xs md:text-sm text-slate-650 leading-relaxed font-semibold max-w-2xl mx-auto">
            No todos los comercios venden de la misma manera. Diseñamos tarjetas independientes para que encuentres tu rubro de inmediato y entiendas cómo MAX24 automatiza tu mostrador.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {/* Card 1: Kioscos y Minimarkets */}
          <div className="bg-white border border-slate-200 hover:border-orange-300 hover:shadow-xl rounded-2xl p-5 space-y-4 transition-all duration-300 group flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-orange-100 text-orange-600 w-fit">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Kioscos y Minimarkets</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Escaneo ultra-veloz de golosinas y bebidas, control de vencimientos y reposición automatizada de stock crítico de cigarrillos y snacks.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-1 text-[10px] font-bold text-orange-600 font-mono">
              ★ Módulo de Cigarrillos & SKU
            </div>
          </div>

          {/* Card 2: Almacenes y Fiambrerías */}
          <div className="bg-white border border-slate-200 hover:border-blue-300 hover:shadow-xl rounded-2xl p-5 space-y-4 transition-all duration-300 group flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-blue-100 text-blue-600 w-fit">
                <Scale className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Almacenes y Fiambrerías</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Venta por peso o fraccionado, actualización masiva de precios por planillas CSV/Excel para ganarle a la inflación y control estricto de deudas con vecinos.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-1 text-[10px] font-bold text-blue-600 font-mono">
              ★ Cuaderno de Fiados Integrado
            </div>
          </div>

          {/* Card 3: Tiendas de Ropa y Calzado */}
          <div className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-xl rounded-2xl p-5 space-y-4 transition-all duration-300 group flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-indigo-100 text-indigo-600 w-fit">
                <Shirt className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Tiendas de Ropa</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Control de inventario discriminado por talles, colores y marcas. Registro ágil de devoluciones, promociones y rebajas de fin de temporada.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-1 text-[10px] font-bold text-indigo-600 font-mono">
              ★ Matriz de Talles y Colores
            </div>
          </div>

          {/* Card 4: Carnicerías y Verdulerías */}
          <div className="bg-white border border-slate-200 hover:border-emerald-300 hover:shadow-xl rounded-2xl p-5 space-y-4 transition-all duration-300 group flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-emerald-100 text-emerald-600 w-fit">
                <Apple className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Carnicerías</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Cálculo de mermas y desperdicios, pesaje directo en balanza integrado y ofertas del día por cartelera digital o tienda online.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-1 text-[10px] font-bold text-emerald-600 font-mono">
              ★ Integración con Balanzas
            </div>
          </div>

          {/* Card 5: Heladerías y Gastronomía Rápida */}
          <div className="bg-white border border-slate-200 hover:border-purple-300 hover:shadow-xl rounded-2xl p-5 space-y-4 transition-all duration-300 group flex flex-col justify-between shadow-xs">
            <div className="space-y-3">
              <div className="p-3 rounded-xl bg-purple-100 text-purple-600 w-fit">
                <Utensils className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Heladerías y Cafés</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Carga de combos de comidas personalizadas (Hamburguesas, Sándwiches), adición de gustos de helado en el POS y descuento automático de insumos del stock.
              </p>
            </div>
            <div className="border-t border-slate-100 pt-3 mt-1 text-[10px] font-bold text-purple-600 font-mono">
              ★ Módulo de Comidas & Adiciones
            </div>
          </div>
        </div>
      </section>

      {/* Sección de Doble Perspectiva: Comercios vs Público Comprador */}
      <section id="funcionalidades-roles" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200 scroll-mt-20">
        <div className="space-y-4 text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs tracking-widest uppercase font-black text-blue-600 font-mono block">
            DOS PORTALES • UNA SOLUCIÓN UNIFICADA
          </span>
          <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
            ¿Qué ofrece nuestro <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 font-extrabold">Sistema de Gestión Comercial Web</span>?
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
            Nuestra plataforma provee una experiencia dual integrada. Descubre todo lo que los dueños de tiendas y el público comprador pueden realizar de forma simultánea.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
          {/* Card 1: Comercios / Tiendas */}
          <div className="bg-white border border-slate-200 hover:shadow-lg rounded-3xl p-6 md:p-8 space-y-6 relative transition-all duration-300 group overflow-hidden flex flex-col justify-between">
            {/* Ambient blue highlight */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-3xl rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-xl text-xs font-black uppercase tracking-wider">
                <Store className="w-3.5 h-3.5 animate-pulse" />
                Para Comercios y Tiendas
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-left">
                Control absoluto de tu mostrador, finanzas e inventario
              </h3>
              <p className="text-xs text-slate-650 leading-relaxed text-left">
                Diseñado para simplificar el día a día de almacenes, minimarkets, kioscos, carnicerías, heladerías y tiendas de ropa con módulos profesionales y ágiles.
              </p>
            </div>

            <div className="border-y border-slate-100 py-6 my-2 space-y-4">
              <h4 className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-left">Capacidades del Comerciante:</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-blue-600 shrink-0" />
                    POS Ultra-Rápido
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Realiza ventas en segundos con pistolas de códigos, calculadora de vuelto móvil y sumatoria predictiva.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Package className="w-4 h-4 text-blue-600 shrink-0" />
                    Stock Inteligente
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Añade entradas de mercadería, controla márgenes de ganancias netas y recibe alertas de stock crítico.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    Auditoría de Turnos
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Controla accesos fijos para Cajeros y Encargados. Monitorea quién operó cada ticket para evitar fraudes.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-600 shrink-0" />
                    Saldos y Fiados (CoC)
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Lleva cuentas corrientes de confianza de vecinos, establece límites de crédito y envía avisos por WhatsApp.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600 shrink-0" />
                    Reportes en Vivo
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Gráficos diarios de revenue, ticket promedio de compra e historial integrado para descargar.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
                    Backups y Soporte
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Haz copias de seguridad de la base de datos de tu tienda y audita errores de sistema en tiempo real.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onLoginClick('login')}
              className="w-full py-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold hover:text-blue-800 rounded-xl text-xs transition-colors border border-blue-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Comenzar como Comercio <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2: Público / Compradores */}
          <div className="bg-white border border-slate-200 hover:shadow-lg rounded-3xl p-6 md:p-8 space-y-6 relative transition-all duration-300 group overflow-hidden flex flex-col justify-between">
            {/* Ambient emerald highlight */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-3xl rounded-full pointer-events-none group-hover:scale-150 transition-transform duration-500" />
            
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-black uppercase tracking-wider">
                <Users className="w-3.5 h-3.5 animate-pulse" />
                Para el Público en General
              </div>
              <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight text-left">
                Transparencia, consultas inmediatas de deudas y auto-servicio
              </h3>
              <p className="text-xs text-slate-650 leading-relaxed text-left">
                Permite a los compradores y clientes habituales de la comunidad interactuar con las tiendas  afiliadas desde un cliente web optimizado para móviles.
              </p>
            </div>

            <div className="border-y border-slate-100 py-6 my-2 space-y-4">
              <h4 className="text-[10px] uppercase font-black font-mono tracking-widest text-slate-500 text-left">Capacidades del Cliente / Comprador:</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                    Portal Adaptado a Móvil
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Inicia sesión de forma segura y portable para acceder instantáneamente a tus cuentas registradas.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    Mi Cuenta Corriente al Día
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Consulta tu deuda consolidada o pendientes de pago en tiempo real con las tiendas de tu vecindario.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-4 h-4 text-emerald-600 shrink-0" />
                    Tickets y Comprobantes
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Accede a tu historial de compras cronológico y descarga copias de tus tickets digitales inmediatamente.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                    Pedidos de Compra Online
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Busca y visualiza el catálogo de productos digital de tus tiendas favoritas, arma tu carrito y pide online.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-600 shrink-0" />
                    Escanear en Góndola
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Escanea códigos de barras de productos dentro de tiendas participantes para armar tu orden y pagar ágilmente.
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                    Fácil Acceso
                  </span>
                  <p className="text-[11px] text-slate-550 leading-normal pl-6">
                    Cero fricción: regístrate con tu correo y vincular al instante tus tiendas favoritas mediante sus códigos.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => onLoginClick('buyer_register')}
              className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold hover:text-emerald-800 rounded-xl text-xs transition-colors border border-emerald-200 cursor-pointer flex items-center justify-center gap-1.5"
            >
              Comenzar como Comprador <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* PORTAL DE PROVEEDORES B2B - NUEVA FUNCIONALIDAD DESTACADA */}
      <section id="b2b-proveedores" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200 scroll-mt-20 relative">
        <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] bg-indigo-600/5 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 space-y-6 text-left">
            <span className="text-xs tracking-widest uppercase font-black text-indigo-600 font-mono block">
              💡 NUEVO COMPONENTE B2B MAYORISTA
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Portal de Proveedores B2B y <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-650 via-purple-600 to-indigo-800 font-extrabold">Software Punto de Venta con Tienda Online</span>
            </h2>
            <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
              ¿Eres distribuidor, fabricante o mayorista regional? Registrándote en MAX24 puedes publicar tu catálogo completo de productos, actualizar precios masivamente y enviar ofertas personalizadas o presupuestos directos de forma simple y automática según el porcentaje de ganancia definido.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5 border border-indigo-100">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Presupuestos Interactivos y Pedidos</h4>
                  <p className="text-[11px] text-slate-600">Los dueños de tiendas pueden ver tus propuestas, compararlas y aceptarlas o comprarlas con un clic.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5 border border-indigo-100">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Búsqueda y Filtros de Tiendas por Zona</h4>
                  <p className="text-[11px] text-slate-600">Filtra por provincia o ciudad para detectar comercios necesitados de mercadería en tu radio de distribución física de forma ágil.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0 mt-0.5 border border-indigo-100">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Planes Gratuitos y Premium Flexibles</h4>
                  <p className="text-[11px] text-slate-600">Comienza gratis sin límite de tiempo para probar. Cuando crezcas, suscríbete para cobertura y envíos ilimitados con descuentos exclusivos.</p>
                </div>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-4">
              <button
                type="button"
                onClick={() => onLoginClick('supplier_register')}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl hover:shadow-lg hover:shadow-indigo-500/15 transition-all cursor-pointer flex items-center gap-2"
              >
                Registrarme Gratis como Proveedor
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              
              <button
                type="button"
                onClick={() => onLoginClick('login')}
                className="px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
              >
                Ingreso al Portal Proveedores
              </button>
            </div>
          </div>

          {/* Pricing cards side-by-side for Suppliers */}
          <div className="flex-1 w-full max-w-lg space-y-6">
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-6 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-xl rounded-full" />
              
              <div className="space-y-1 text-left">
                <span className="text-[8px] font-mono tracking-widest text-indigo-605 uppercase font-black">Planificación de Tarifas Mayoristas</span>
                <h3 className="text-lg font-black text-slate-900">Planes Especiales de Proveedores</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
                {/* Supplier Gratuito Card */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <span className="text-[8px] font-mono font-black text-slate-600 uppercase tracking-wider bg-white border border-slate-200 px-2 py-0.5 rounded">BÁSICO • GRATUITO</span>
                    <h4 className="text-sm font-black text-slate-800">Proveedor Gratis</h4>
                    <p className="text-[10px] text-slate-600 leading-relaxed">Prueba la plataforma y conéctate con tiendas locales.</p>
                    
                    <div className="py-2 border-y border-slate-200">
                      <span className="text-lg font-mono font-black text-slate-900">$0</span>
                      <span className="text-[9px] text-slate-500 font-bold ml-1">Gratis Siempre</span>
                    </div>

                    <ul className="space-y-1.5 text-[10px] text-slate-600">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Ver hasta 10 tiendas</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>Enviar ofertas a 10 tiendas</span>
                      </li>
                      <li className="text-rose-500/70 font-semibold block line-through">
                        Envíos ilimitados
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => onLoginClick('supplier_register')}
                    className="w-full py-2 bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200 text-[10px] rounded-xl transition-colors"
                  >
                    Registrarse Gratis
                  </button>
                </div>

                {/* Supplier Mayorista Pro Card */}
                <div className="bg-gradient-to-b from-indigo-50/50 to-white p-4 rounded-2xl border border-indigo-150 flex flex-col justify-between space-y-4 shadow-md">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center bg-transparent">
                      <span className="text-[8px] font-mono font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">ILIMITADO PRO</span>
                      <span className="text-[8px] font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded uppercase">¡Ahorra 25%!</span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900">Mayorista Pro</h4>
                    <p className="text-[10px] text-slate-600 leading-relaxed">Envía presupuestos masivos e impulsa tu facturación en Argentina.</p>
                    
                    <div className="py-1 border-y border-indigo-100">
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-mono font-black text-slate-900">$14.900</span>
                        <span className="text-[8px] text-slate-600 uppercase font-sans">ARS / mes</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block leading-none font-mono">Facturado anualmente ($178.800)</span>
                    </div>

                    <ul className="space-y-1.5 text-[10px] text-slate-705">
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Tiendas ILIMITADAS</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Envíos e impresos ilimitados</span>
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>Soporte prioritario 24/7</span>
                      </li>
                    </ul>
                  </div>

                  <button
                    onClick={() => onLoginClick('supplier_register')}
                    className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] rounded-xl hover:shadow-lg transition-all"
                  >
                    Suscribirse Pro
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits section */}
      <section id="beneficios" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200 scroll-mt-20">
        <div className="space-y-3.5 text-center max-w-xl mx-auto mb-16">
          <span className="text-xs tracking-widest uppercase font-black text-blue-600 font-mono">
            ¿Por qué elegir max24app?
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Diseñado para simplificar el día a día de tus tiendas y sucursales
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
            Te brindamos todas las herramientas necesarias para digitalizar tu mostrador, resguardar tu dinero y multiplicar tus ventas sin complicaciones técnicas.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((benefit, i) => {
            const IconComponent = benefit.icon;
            return (
              <div 
                key={i} 
                className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 hover:border-slate-300 hover:shadow-lg transition-all duration-300 relative group overflow-hidden"
              >
                <div className={`p-3 rounded-2xl bg-gradient-to-br ${benefit.color} w-fit`}>
                  <IconComponent className={`w-6 h-6 ${benefit.iconColor}`} />
                </div>
                <div className="space-y-2 relative z-10">
                  <h3 className="text-base font-extrabold text-slate-900 font-sans tracking-tight">
                    {benefit.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {benefit.desc}
                  </p>
                </div>
                {/* Micro accent */}
                <span className="absolute bottom-4 right-4 text-[10px] font-mono text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity font-black">
                  M24 FEATURE 0{i + 1}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Tour Interactivo de Módulos */}
      <section id="funcionalidades" className="py-20 px-6 max-w-7xl mx-auto w-full border-t border-slate-200 scroll-mt-20">
        <div className="space-y-3.5 text-center max-w-xl mx-auto mb-12">
          <span className="text-xs tracking-widest uppercase font-black text-orange-650 font-mono block animate-pulse">
            Tour Interactivo de la Plataforma
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Prueba todas sus funciones en vivo
          </h2>
          <p className="text-xs md:text-sm text-slate-600 font-semibold">
            Haz clic en los diferentes módulos para interactuar con el simulador real de nuestra terminal comercial.
          </p>
        </div>

        {/* Tab Selector & Preview Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch bg-slate-50 border border-slate-200 rounded-3xl p-6 md:p-8 relative overflow-hidden">
          {/* Right/Top Side Gradients */}
          <div className="absolute top-1/2 right-0 w-[400px] h-[400px] bg-orange-500/5 blur-[120px] rounded-full pointer-events-none" />

          {/* Left Column: Vertical click tabs (4 of 12 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-3 z-10">
            {/* POS */}
            <button
              onClick={() => setActiveTourTab('pos')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-4 ${activeTourTab === 'pos' ? 'bg-white border-orange-500 shadow-md' : 'bg-white/40 border-slate-200 hover:bg-slate-100/60'}`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${activeTourTab === 'pos' ? 'bg-orange-50 text-orange-600' : 'bg-slate-100 text-slate-500'}`}>
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className={`font-extrabold text-xs block ${activeTourTab === 'pos' ? 'text-slate-900' : 'text-slate-700'}`}>Punto de Venta (POS)</span>
                <span className="text-[10px] text-slate-500 block mt-1 leading-normal">Suma productos y simula un cobro instantáneo.</span>
              </div>
            </button>

            {/* Inventory */}
            <button
              onClick={() => setActiveTourTab('stock')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-4 ${activeTourTab === 'stock' ? 'bg-white border-amber-500 shadow-md' : 'bg-white/40 border-slate-200 hover:bg-slate-100/60'}`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${activeTourTab === 'stock' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-500'}`}>
                <Package className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className={`font-extrabold text-xs block ${activeTourTab === 'stock' ? 'text-slate-900' : 'text-slate-700'}`}>Control de Stock</span>
                <span className="text-[10px] text-slate-500 block mt-1 leading-normal">Busca mercadería y simula entradas/alertas críticos.</span>
              </div>
            </button>

            {/* Debts */}
            <button
              onClick={() => setActiveTourTab('debts')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-4 ${activeTourTab === 'debts' ? 'bg-white border-emerald-500 shadow-md' : 'bg-white/40 border-slate-200 hover:bg-slate-100/60'}`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${activeTourTab === 'debts' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                <Wallet className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className={`font-extrabold text-xs block ${activeTourTab === 'debts' ? 'text-slate-900' : 'text-slate-700'}`}>Deudas y Fiados</span>
                <span className="text-[10px] text-slate-500 block mt-1 leading-normal font-medium">Cuaderno de Fiados Digital: <b>"Cobrá a término y no pierdas plata olvidando quién te debe".</b></span>
              </div>
            </button>

            {/* Reports */}
            <button
              onClick={() => setActiveTourTab('reports')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-4 ${activeTourTab === 'reports' ? 'bg-white border-blue-500 shadow-md' : 'bg-white/40 border-slate-200 hover:bg-slate-100/60'}`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${activeTourTab === 'reports' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                <BarChart3 className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className={`font-extrabold text-xs block ${activeTourTab === 'reports' ? 'text-slate-900' : 'text-slate-700'}`}>Reportes y Estadísticas</span>
                <span className="text-[10px] text-slate-500 block mt-1 leading-normal font-medium">Márgenes netos, ticket promedio y gráficos anuales.</span>
              </div>
            </button>

            {/* Employees */}
            <button
              onClick={() => setActiveTourTab('employees')}
              className={`p-4 rounded-2xl text-left border transition-all cursor-pointer flex items-start gap-4 ${activeTourTab === 'employees' ? 'bg-white border-purple-500 shadow-md' : 'bg-white/40 border-slate-200 hover:bg-slate-100/60'}`}
            >
              <div className={`p-2.5 rounded-xl shrink-0 ${activeTourTab === 'employees' ? 'bg-purple-50 text-purple-600' : 'bg-slate-100 text-slate-500'}`}>
                <Users className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className={`font-extrabold text-xs block ${activeTourTab === 'employees' ? 'text-slate-900' : 'text-slate-700'}`}>Auditoría de Empleados</span>
                <span className="text-[10px] text-slate-500 block mt-1 leading-normal font-medium">Control de Turnos y Caja: <b>"Evitá faltantes sospechosos controlando cada cierre de turno".</b></span>
              </div>
            </button>
          </div>

          {/* Right Column: Live workspace (8 of 12 cols) */}
          <div className="lg:col-span-8 bg-slate-950 rounded-2xl border border-slate-850 p-5 md:p-6 flex flex-col justify-between min-h-[380px] z-10 transition-all duration-300">
            
            {/* CONTENT 1: POS WORKSPACE */}
            {activeTourTab === 'pos' && (
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase text-orange-400 font-bold">Terminal en Línea MAX24 (Simulador)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Mesa de compra activa</span>
                  </div>

                  {checkoutSuccess ? (
                    <div className="py-8 text-center space-y-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                      <div className="w-10 h-10 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center mx-auto text-base font-black animate-scale-up">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-extrabold text-white">¡Venta Registrada Exitosamente!</h4>
                        <p className="text-[11px] text-slate-350 max-w-sm mx-auto px-4">
                          Se restaron las unidades del inventario, se imputó el saldo en caja y se generó el comprobante listo para imprimir.
                        </p>
                      </div>
                      <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[9px] font-mono text-emerald-400 font-bold animate-pulse block w-fit mx-auto uppercase">
                        Reiniciando simulador en 2s...
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {posItems.map(item => (
                        <div key={item.id} className="flex items-center justify-between p-2.5 bg-slate-900 rounded-xl border border-slate-850 text-xs">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-100">{item.name}</span>
                            <span className="text-[10px] text-slate-450 block font-mono font-medium">
                              ${item.price.toLocaleString('es-AR')} ARS c/u
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {/* Quantity Modifiers */}
                            <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg">
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, -1)}
                                className="p-1 px-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-1.5 font-mono font-bold text-xs text-orange-400">{item.qty}</span>
                              <button
                                type="button"
                                onClick={() => handleUpdateQty(item.id, 1)}
                                className="p-1 px-2.5 text-slate-400 hover:text-white transition-colors cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                            <span className="font-bold font-mono text-slate-200 min-w-[75px] text-right">
                              ${(item.price * item.qty).toLocaleString('es-AR')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!checkoutSuccess && (
                  <div className="pt-4 border-t border-slate-900 flex flex-col sm:flex-row gap-4 items-center justify-between">
                    <div className="text-left w-full sm:w-auto">
                      <span className="text-[9px] text-slate-500 font-mono tracking-wider block font-bold">TOTAL A PAGAR</span>
                      <strong className="text-xl font-mono font-black text-white">
                        ${posItems.reduce((sum, i) => sum + (i.price * i.qty), 0).toLocaleString('es-AR')} ARS
                      </strong>
                    </div>
                    
                    <button
                      type="button"
                      onClick={handleSimulateCheckout}
                      disabled={posItems.length === 0}
                      className="w-full sm:w-auto px-6 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:bg-slate-850 disabled:text-slate-600 disabled:cursor-not-allowed text-slate-950 text-xs font-black rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                    >
                      Simular Cobro POS
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* CONTENT 2: STOCK CONTROL */}
            {activeTourTab === 'stock' && (
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase text-amber-400 font-bold">Inventario de Mercadería (Simulador)</span>
                    </div>
                    
                    {/* Live search input */}
                    <div className="relative">
                      <Search className="w-3 h-3 text-slate-500 absolute left-2.5 top-2" />
                      <input
                        type="text"
                        placeholder="Buscar producto..."
                        value={stockSearch}
                        onChange={(e) => setStockSearch(e.target.value)}
                        className="bg-slate-900 text-[10px] pl-7 pr-2.5 py-1 rounded-lg border border-slate-800 text-slate-250 placeholder-slate-500 focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {stockUpdateAlert && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-bold rounded-xl flex items-center gap-2">
                      <Check className="w-3.5 h-3.5" />
                      {stockUpdateAlert}
                    </div>
                  )}

                  {/* Stock Grid List */}
                  <div className="max-h-[170px] overflow-y-auto space-y-1.5 pr-1 text-[11px]">
                    {stockItems
                      .filter(p => p.name.toLowerCase().includes(stockSearch.toLowerCase()))
                      .map(p => {
                        const isCritical = p.stock <= p.minStock;
                        return (
                          <div key={p.code} className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-900 rounded-xl">
                            <div className="space-y-0.5 text-left">
                              <span className="font-extrabold text-slate-100">{p.name}</span>
                              <span className="block text-[9px] font-mono text-slate-500">SKU: {p.code}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right leading-relaxed hidden sm:block">
                                <span className="block font-semibold">Costo: ${p.cost} | Vta: ${p.price}</span>
                                <span className="text-[9px] text-emerald-400 font-bold font-mono">Margen: {Math.round((p.price - p.cost)/p.price * 100)}%</span>
                              </div>
                              <span className={`px-2 py-0.5 rounded-lg font-bold font-mono text-[9px] ${
                                isCritical 
                                  ? 'bg-rose-500/15 text-rose-450 border border-rose-500/20' 
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/15'
                              }`}>
                                {p.stock}u. {isCritical ? 'CRÍTICO' : 'Óptimo'}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>

                {/* Stock Addition Simulator Form */}
                <form onSubmit={handleAddStock} className="pt-3 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  <div className="sm:col-span-6 space-y-1 text-left">
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-bold block">Seleccionar Producto</label>
                    <select
                      value={stockInputCode}
                      onChange={(e) => setStockInputCode(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-semibold text-slate-100 focus:outline-hidden"
                    >
                      {stockItems.map(p => (
                        <option key={p.code} value={p.code}>{p.name} ({p.stock} unidades)</option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3 space-y-1 text-left">
                    <label className="text-[9px] font-mono text-slate-500 uppercase font-bold block text-center">Cant. Ingresar</label>
                    <input
                      type="number"
                      required
                      value={stockInputQty}
                      onChange={(e) => setStockInputQty(Math.max(1, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2 text-xs font-mono font-bold text-slate-100 text-center focus:outline-hidden"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <button
                      type="submit"
                      className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-colors cursor-pointer"
                    >
                      Entrar Stock
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CONTENT 3: CC DEBTS */}
            {activeTourTab === 'debts' && (
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase text-emerald-400 font-bold">Cuentas Corrientes y Fiados (Simulador)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Integración de Cobro</span>
                  </div>

                  {waSentUser && (
                    <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl space-y-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[10px] uppercase font-mono font-extrabold">Mensaje de WhatsApp Generado:</span>
                      </div>
                      <p className="text-[10px] text-slate-200 leading-normal font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-850 text-left">
                        "Encabezado Comercio MAX24: Hola <b>{waSentUser}</b>, queríamos recordarte de manera amable que tu cuenta corriente acumulada registra un saldo de <b>${deudores.find(d => d.name === waSentUser)?.balance.toLocaleString('es-AR')} ARS</b>. Puedes abonarlo mediante MercadoPago con Alias: <b>max24.pos</b>. ¡Muchas Gracias!"
                      </p>
                      <span className="text-[9px] text-emerald-500 font-sans font-bold block text-left">
                        ✓ Simulación completada para el número {deudores.find(d => d.name === waSentUser)?.phone}. El enlace de pago se asocia automáticamente.
                      </span>
                    </div>
                  )}

                  {/* Debtors List */}
                  <div className="space-y-1.5 text-xs">
                    {deudores.map(d => {
                      return (
                        <div key={d.name} className="p-2.5 bg-slate-900/60 border border-slate-900 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-[10.5px]">
                          <div className="space-y-1 text-left">
                            <span className="font-extrabold text-slate-100 block">{d.name}</span>
                            <div className="flex items-center gap-4 text-[9px] text-slate-500">
                              <span>Límite de Compra: ${d.limit.toLocaleString('es-AR')}</span>
                              <span>Cel: {d.phone}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-6">
                            <div className="text-right">
                              <span className="text-[9px] text-slate-450 tracking-wider font-bold block">SALDO ACUMULADO</span>
                              <strong className="text-rose-400 font-mono font-bold text-xs">${d.balance.toLocaleString('es-AR')}</strong>
                            </div>
                            
                            <button
                              type="button"
                              onClick={() => handleSimulateWhatsApp(d.name)}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black rounded-lg text-[9px] transition-colors uppercase cursor-pointer"
                            >
                              Enviar Recordatorio
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-500 leading-relaxed pt-2 border-t border-slate-900 text-left">
                  ⚡ <b>Seguridad Financiera</b>: MAX24 te permite controlar saldos limites por cliente y exportar recordatorios de cobro a Whatsapp en un solo botón, reduciendo las cuentas olvidadas a cero.
                </div>
              </div>
            )}

            {/* CONTENT 4: REPORTS */}
            {activeTourTab === 'reports' && (
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase text-blue-400 font-bold">Métricas y Ganancias Automatizadas (Simulador)</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Análisis comercial</span>
                  </div>

                  {/* KPIs row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block">Facturado (Mes)</span>
                      <strong className="text-xs font-mono font-bold text-white block mt-0.5">$324.500 ARS</strong>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block">Ganancia Neta</span>
                      <strong className="text-xs font-mono font-bold text-emerald-400 block mt-0.5">$112.400 ARS</strong>
                    </div>
                    <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-850 text-center">
                      <span className="text-[8.5px] text-slate-500 font-bold uppercase tracking-wider block">Ticket Promedio</span>
                      <strong className="text-xs font-mono font-bold text-blue-400 block mt-0.5">$4.500 ARS</strong>
                    </div>
                  </div>

                  {/* SVG Line Chart Simulator */}
                  <div className="bg-slate-900/40 border border-slate-900 p-3 rounded-xl space-y-1">
                    <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest block font-bold text-left">Facturación diaria por sucursal durante la semana</span>
                    <div className="h-24 w-full flex items-end justify-between px-2 pt-4 relative">
                      {/* Grid background lines */}
                      <div className="absolute inset-0 flex flex-col justify-between py-1 pointer-events-none opacity-5">
                        <div className="border-t border-white w-full" />
                        <div className="border-t border-white w-full" />
                        <div className="border-t border-white w-full" />
                      </div>

                      {/* SVG Line path representation */}
                      <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <path d="M 0 80 L 15 75 L 30 60 L 45 42 L 60 48 L 75 30 L 90 22 L 100 15" fill="none" stroke="rgb(59, 130, 246)" strokeWidth="3" />
                        <path d="M 0 80 L 15 75 L 30 60 L 45 42 L 60 48 L 75 30 L 90 22 L 100 15 L 100 100 L 0 100 Z" fill="url(#blue-gradient-fill)" opacity="0.1" />
                        <defs>
                          <linearGradient id="blue-gradient-fill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="rgb(59, 130, 246)" />
                            <stop offset="100%" stopColor="transparent" />
                          </linearGradient>
                        </defs>
                      </svg>

                      {/* Labels */}
                      <span className="text-[8px] text-slate-500 font-mono z-10 font-bold">Lun</span>
                      <span className="text-[8px] text-slate-500 font-mono z-10 font-bold">Mié</span>
                      <span className="text-[8px] text-slate-500 font-mono z-10 font-bold">Vie</span>
                      <span className="text-[8px] text-slate-500 font-mono z-10 font-bold">Sáb</span>
                      <span className="text-[8px] text-slate-500 font-mono z-10 font-bold">Dom</span>
                    </div>
                  </div>
                </div>

                <span className="text-[9.5px] text-slate-500 font-medium block leading-normal text-left">
                  📊 <b>Crecimiento Planificado</b>: Deja de adivinar tus ganancias al azar. Los tableros dinámicos computan tus datos cada segundo, listos para exportar reportes fiscales.
                </span>
              </div>
            )}

            {/* CONTENT 5: EMPLOYEES */}
            {activeTourTab === 'employees' && (
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-900">
                    <div className="flex items-center gap-2">
                       <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
                      <span className="text-[10px] font-mono uppercase text-purple-400 font-bold">Panel de Auditoría de Turnos de Empleados</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">Monitoreo activo</span>
                  </div>

                  {/* Team lists */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-850 text-left">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-slate-100">Ana Milena R.</strong>
                        <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-black uppercase rounded">En Turno</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-1 font-mono">Rol: Cajera Principal (Caja Fija 1)</span>
                    </div>
                    <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-850 text-left">
                      <div className="flex items-center justify-between">
                        <strong className="text-xs font-bold text-slate-100">Leandro Pérez</strong>
                        <span className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[8px] font-black uppercase rounded">Supervisor</span>
                      </div>
                      <span className="text-[9px] text-slate-500 block mt-1 font-mono">Rol: Encargado de Stock y Proveedores</span>
                    </div>
                  </div>

                  {/* Simulated system log */}
                  <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-900 space-y-1.5 text-left">
                    <span className="text-[8.5px] font-mono text-slate-500 uppercase tracking-widest block font-bold">Historial de Operaciones del Turno</span>
                    <div className="space-y-1 font-mono text-[9px] text-slate-400 max-h-[70px] overflow-hidden leading-relaxed">
                      <div className="flex gap-2 text-slate-500">
                        <span>14:32</span>
                        <span className="text-purple-400">Ana M.</span>
                        <span className="text-slate-350 truncate">completó Cobro POS por $5.400 en Efectivo</span>
                      </div>
                      <div className="flex gap-2 text-slate-500">
                        <span>14:12</span>
                        <span className="text-amber-400">Leandro P.</span>
                        <span className="text-slate-350 truncate">añadió stock a "Aceite Girasol Natura" (+12u)</span>
                      </div>
                      <div className="flex gap-2 text-slate-500">
                        <span>13:58</span>
                        <span className="text-blue-400">Carlos P.</span>
                        <span className="text-slate-350 truncate">ingresó desde terminal administrativa principal</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-[9.5px] text-slate-500 block font-semibold text-left">
                  🛡️ <b>Control Libre de Fraude</b>: Se elimina el cuadernito de cuadres complejos. Cada empleado accede con su clave individual fija y el sistema cruza las ventas con el arqueo financiero al cierre.
                </div>
              </div>
            )}

            {/* Platform indicator CTA overlay */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
              <span>EXPLORA LA EXPERIENCIA COMPLETA DESDE LA TERMINAL</span>
              <a href="#planes" className="text-orange-400 font-extrabold hover:underline uppercase flex items-center gap-1">
                Ver Planes de Suscripción <ArrowUpRight className="w-3.5 h-3.5" />
              </a>
            </div>

          </div>
        </div>
      </section>

      {/* 30-Day trial detailed ribbon */}
      <section className="bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 py-12 px-6 relative overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-xl md:text-2xl font-black tracking-tight flex items-center justify-center md:justify-start gap-2 text-slate-950">
              <Gift className="w-6 h-6 shrink-0" />
              ¿Quieres probar cómo funciona sin compromisos?
            </h3>
            <p className="text-xs md:text-sm font-extrabold text-slate-900/80 max-w-2xl leading-normal">
              Accede a la experiencia completa de MAX24 gratis durante 30 días. Tu cuenta vendrá precargada con productos de muestra para que operes de inmediato, o puedes empezar de cero en segundos.
            </p>
          </div>
          <a
            href="#planes"
            className="w-full md:w-auto px-8 py-3.5 bg-slate-950 text-orange-400 font-bold hover:text-white hover:bg-slate-900 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-xl shrink-0 transition-colors uppercase cursor-pointer"
          >
            Obtener mi Demo Gratis por 30 Días
            <ArrowRight className="w-4 h-4 text-orange-400" />
          </a>
        </div>
        {/* Background visual shapes */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 blur-3xl rounded-full" />
      </section>

      {/* Testimonials & Proof Section (Prueba Social) */}
      <section className="py-20 bg-slate-50 border-t border-b border-slate-200 px-6">
        <div className="max-w-7xl mx-auto w-full">
          <div className="space-y-4 text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs tracking-widest uppercase font-black text-orange-600 font-mono block">
              PRUEBA SOCIAL & CONFIANZA
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-tight">
              Más de <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-orange-500 font-extrabold">1.500 comercios</span> en Argentina ya confían en MAX24
            </h2>
            <p className="text-xs md:text-sm text-slate-650 leading-relaxed font-semibold max-w-2xl mx-auto">
              Descubrí por qué dueños de maxikioscos, almacenes y tiendas de indumentaria reemplazaron las planillas de Excel y los cuadernos con nuestro software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Testimonial 1 */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500">
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed text-left">
                  "Antes tardaba 2 horas en cerrar la caja, ahora con MAX24 lo hago en 5 minutos desde el celular. El módulo de fiados es espectacular, ya no pierdo plata olvidando quién me debe."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-750 font-black flex items-center justify-center text-xs">
                  CE
                </div>
                <div className="leading-tight text-left">
                  <span className="text-xs font-black text-slate-900 block">Carlos Espinoza</span>
                  <span className="text-[10px] text-slate-500 block">Dueño de Maxikiosco El Sol (Córdoba)</span>
                </div>
              </div>
            </div>

            {/* Testimonial 2 */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500">
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed text-left">
                  "Tengo una tienda de ropa y el control de stock por talle y color me solucionó la vida. Mis vendedoras usan la app re fácil y yo puedo auditar la caja en tiempo real sin tener que estar en el local."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-750 font-black flex items-center justify-center text-xs">
                  MR
                </div>
                <div className="leading-tight text-left">
                  <span className="text-xs font-black text-slate-900 block">Mariana Rodríguez</span>
                  <span className="text-[10px] text-slate-500 block">Dueña de Lola Chic Boutique (Buenos Aires)</span>
                </div>
              </div>
            </div>

            {/* Testimonial 3 */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl space-y-4 shadow-xs relative flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex gap-1 text-amber-500">
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                  <span className="text-lg">★</span>
                </div>
                <p className="text-xs text-slate-700 italic leading-relaxed text-left">
                  "El hecho de que se genere una tienda online gratis con un clic y que el stock se descuente automáticamente del local es de otro planeta. Excelente soporte técnico por WhatsApp, te contestan enseguida."
                </p>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-750 font-black flex items-center justify-center text-xs">
                  LP
                </div>
                <div className="leading-tight text-left">
                  <span className="text-xs font-black text-slate-900 block">Luis Palacios</span>
                  <span className="text-[10px] text-slate-500 block">Gerente de Almacén Los Andes (Mendoza)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing plans section */}
      <section id="planes" className="py-20 px-6 max-w-7xl mx-auto w-full scroll-mt-20">
        <div className="space-y-3.5 text-center max-w-xl mx-auto mb-16">
          <span className="text-xs tracking-widest uppercase font-black text-orange-600 font-mono block">
            Planes de Suscripción Flexibles
          </span>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Software Punto de Venta Económico para cada tipo de negocio
          </h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed font-semibold">
            Activa el Demo gratis del plan que quieras por 30 días. Luego puedes suscribirte mediante **MercadoPago Argentina** sin contratos ni cargos ocultos.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((p, i) => (
            <div 
              key={i} 
              className={`
                bg-white border p-6 md:p-8 rounded-3xl flex flex-col justify-between space-y-6 relative transition-all duration-300
                ${p.isPopular 
                  ? 'border-orange-500 ring-4 ring-orange-500/10 shadow-2xl scale-102' 
                  : 'border-slate-200 hover:border-slate-300 hover:shadow-lg'}
              `}
            >
              
              {/* Badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-100 text-slate-800 border border-slate-200 text-[9px] font-black tracking-widest px-3 py-1 rounded-full uppercase leading-none">
                {p.badge}
              </div>

              <div className="space-y-5">
                {/* Plan Header */}
                <div className="space-y-1 text-left">
                  <h3 className="text-lg font-black text-slate-900">{p.name}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed min-h-[36px]">{p.desc}</p>
                </div>

                {/* Price Display */}
                <div className="py-3 border-y border-slate-100 flex items-baseline justify-between gap-1.5 flex-wrap text-left">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono tracking-wider block font-bold">PRECIO MENSUAL</span>
                    <span className="text-2xl md:text-3xl font-black text-slate-900 font-mono leading-none">
                      ${p.arsPrice.toLocaleString('es-AR')}
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wide font-sans ml-1">ARS</span>
                    </span>
                  </div>
                </div>

                {/* Demo notice pill */}
                <div className="bg-emerald-50 border border-emerald-100 py-2 px-3 rounded-xl flex items-center justify-between text-emerald-750 text-xs">
                  <span className="font-semibold flex items-center gap-1.5 text-emerald-700">
                    <Gift className="w-3.5 h-3.5" />
                    Demo de Regalo
                  </span>
                  <span className="font-bold uppercase tracking-wider font-mono text-[9px] text-emerald-750">¡30 DIAS GRATIS!</span>
                </div>

                {/* Benefits checklist */}
                <ul className="space-y-3 pt-2 text-left">
                  {p.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-650 leading-relaxed">
                      <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submit triggers/buttons */}
              <button
                type="button"
                onClick={() => onStartDemoClick(p.id)}
                className={`
                  w-full py-3.5 rounded-2xl text-xs font-black transition-all cursor-pointer block text-center
                  ${p.isPopular 
                    ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-md' 
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200'}
                `}
              >
                Comenzar Demo de 30 Días Gratis
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* MercadoPago Integrated Banner Block */}
      <section className="py-12 bg-blue-50/50 border-y border-blue-100 px-6">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-sky-100 flex items-center justify-center text-sky-600 shrink-0 border border-sky-200">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-700 tracking-wider font-mono block">Facturación Integrada Local</span>
              <h4 className="text-base font-bold text-slate-900 mt-0.5">Suscripciones Recurrentes Seguras vía MercadoPago</h4>
              <p className="text-xs text-slate-600 mt-1 max-w-xl">
                Configurado con la pasarela oficial de MercadoPago. Abona de forma automatizada mes a mes en pesos argentinos desde la comodidad de tu panel sin recargos.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-2xl text-xs font-mono font-bold text-slate-705 shadow-sm">
            <Lock className="w-4 h-4 text-sky-600 shrink-0" />
            <span>MercadoPago Argentina</span>
          </div>
        </div>
      </section>

      {/* Preset account reminder helper card for testing */}
      <section className="py-10 bg-slate-50 px-6 border-t border-slate-150">
        <div className="max-w-md mx-auto bg-white border border-slate-200 p-5 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-start gap-3 text-left">
            <div className="p-2 bg-orange-500/10 rounded-lg text-orange-600 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-widest font-mono">Credenciales de Prueba de Comercio</h4>
              <p className="text-[11px] text-slate-605 mt-1 leading-normal">
                Usa este mail de muestra solicitado para simular la creación, el login y la prueba de la tienda:
              </p>
            </div>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-xs space-y-1 text-left">
            <div className="flex justify-between items-center text-slate-600">
              <span>Usuario o Correo:</span>
              <strong className="text-orange-600 font-bold select-all">prueba</strong>
            </div>
            <div className="flex justify-between items-center text-slate-600">
              <span>Contraseña:</span>
              <strong className="text-orange-600 font-bold select-all">prueba</strong>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onLoginClick('login')}
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Iniciar Sesión con esta cuenta ahora
          </button>
        </div>
      </section>

      {/* FAQs Section */}
      <section id="soporte" className="py-20 px-6 max-w-4xl mx-auto w-full scroll-mt-20 border-t border-slate-150">
        <div className="space-y-3.5 text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight">Preguntas Frecuentes</h2>
          <p className="text-xs text-slate-600">Todo lo que necesitas saber para lanzar tu comercio con MAX24</p>
        </div>

        <div className="space-y-4 font-sans">
          {faqs.map((faq, idx) => (
            <div 
              key={idx} 
              className="bg-white border border-slate-200 rounded-2xl overflow-hidden transition-all duration-350 shadow-xs hover:border-slate-300"
            >
              <button
                type="button"
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                className="w-full px-6 py-4 flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:bg-slate-50/50 transition-colors cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className={`text-orange-600 font-bold text-base transition-transform shrink-0 ml-4 ${activeFaq === idx ? 'rotate-45' : ''}`}>
                  +
                </span>
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-4 pt-1 text-xs text-slate-605 leading-relaxed border-t border-slate-100 bg-slate-50/30 animate-fade-in text-left">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
        </>
      ) : (
        <>
          {activeTab === 'comercios' && renderComerciosPage()}
          {activeTab === 'compradores' && renderCompradoresPage()}
          {activeTab === 'proveedores' && renderProveedoresPage()}
        </>
      )}

      {/* Social Sharing Section / Widget */}
      <section className="py-12 px-6 border-t border-slate-200 bg-slate-50/50 w-full font-sans">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-[11px] font-bold text-indigo-600 tracking-wider uppercase">
            <Share2 className="w-3.5 h-3.5 text-indigo-500 animate-bounce" />
            ¿Te gusta MAX24? ¡Compartí la Plataforma!
          </div>
          <div className="space-y-2">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Ayudá a digitalizar más almacenes y kioscos</h3>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Compartí MAX24 con otros dueños de comercios, proveedores o vecinos de tu zona para potenciar la digitalización y el crecimiento del comercio local en Argentina.
            </p>
          </div>

          <div className="flex flex-wrap justify-center items-center gap-3 pt-2">
            {/* WhatsApp */}
            <a
              href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                "¡Mirá MAX24! La plataforma definitiva para digitalizar kioscos, almacenes y minimarkets de forma ágil y segura. Control de stock, punto de venta (POS) y tienda online: https://www.max24app.com"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.381 9.805-9.782.001-2.592-1.01-5.031-2.846-6.87C16.398 2.113 13.964 1.1 11.386 1.1 5.981 1.1 1.581 5.484 1.579 10.885c-.001 1.73.454 3.424 1.316 4.922L1.85 21.092l5.066-1.32c1.44.786 2.87 1.196 4.301 1.196l-.57-.014z" />
              </svg>
              WhatsApp
            </a>

            {/* Twitter / X */}
            <a
              href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
                "¡Mirá MAX24! La plataforma SaaS definitiva para digitalizar kioscos, almacenes y minimarkets de forma ágil y segura. Control de stock, punto de venta (POS) y tienda online: https://www.max24app.com"
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              Compartir en X
            </a>

            {/* Facebook */}
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent("https://www.max24app.com")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              Facebook
            </a>

            {/* LinkedIn */}
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent("https://www.max24app.com")}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-700 hover:bg-sky-850 text-white text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764s.784.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
              LinkedIn
            </a>

            {/* Copy Link Button */}
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText('https://www.max24app.com');
                setShareCopied(true);
                setTimeout(() => setShareCopied(false), 2500);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl shadow-xs hover:shadow-md transition-all relative cursor-pointer"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              {shareCopied ? '¡Enlace Copiado!' : 'Copiar Enlace'}
              
              {shareCopied && (
                <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg animate-fade-in whitespace-nowrap z-50">
                  ¡Copiado al portapapeles!
                </span>
              )}
            </button>
          </div>
        </div>
      </section>

      {/* Floating Sticky Share Widget for Desktop */}
      <div className="fixed right-4 bottom-24 z-40 hidden md:flex flex-col gap-2.5 items-center bg-white/95 backdrop-blur-xs p-2.5 rounded-2xl shadow-xl border border-slate-200/80 animate-fade-in">
        <div className="p-0.5 text-[9px] font-black text-slate-400 uppercase tracking-widest font-mono select-none">
          Compartir
        </div>
        
        {/* WhatsApp Float */}
        <a
          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
            "¡Mirá MAX24! La plataforma definitiva para digitalizar kioscos, almacenes y minimarkets de forma ágil y segura. Control de stock, punto de venta (POS) y tienda online: https://www.max24app.com"
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Compartir en WhatsApp"
          className="p-2.5 bg-emerald-600 hover:bg-emerald-700 hover:scale-110 text-white rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.451 5.403.002 9.803-4.381 9.805-9.782.001-2.592-1.01-5.031-2.846-6.87C16.398 2.113 13.964 1.1 11.386 1.1 5.981 1.1 1.581 5.484 1.579 10.885c-.001 1.73.454 3.424 1.316 4.922L1.85 21.092l5.066-1.32c1.44.786 2.87 1.196 4.301 1.196l-.57-.014z" />
          </svg>
        </a>

        {/* X (Twitter) Float */}
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(
            "¡Mirá MAX24! La plataforma SaaS definitiva para digitalizar kioscos, almacenes y minimarkets de forma ágil y segura. Control de stock, punto de venta (POS) y tienda online: https://www.max24app.com"
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          title="Compartir en X (Twitter)"
          className="p-2.5 bg-slate-900 hover:bg-black hover:scale-110 text-white rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
        </a>

        {/* Copy Link Float */}
        <button
          type="button"
          onClick={() => {
            navigator.clipboard.writeText('https://www.max24app.com');
            setShareCopied(true);
            setTimeout(() => setShareCopied(false), 2500);
          }}
          title="Copiar Enlace"
          className="p-2.5 bg-slate-100 hover:bg-slate-200 hover:scale-110 text-slate-800 rounded-xl shadow-xs transition-all relative cursor-pointer"
        >
          <Share2 className="w-4 h-4 text-slate-700" />
          {shareCopied && (
            <span className="absolute right-12 top-1.5 bg-slate-900 text-white text-[9px] font-bold px-2 py-1 rounded shadow-lg whitespace-nowrap z-50">
              ¡Copiado!
            </span>
          )}
        </button>
      </div>

      {/* Public Footer */}
      <footer className="mt-auto border-t border-slate-200 bg-white py-12 px-6 text-center text-xs text-slate-500 font-mono">
        <p className="uppercase tracking-widest text-[9.5px]">max24app • Sistema de Gestión de Tiendas Cloud • Hecho en Argentina</p>
        <p className="text-[10px] mt-2">© 2026 MAX24. Todos los derechos reservados. Seguridad SSL Protegida 256-bit.</p>
      </footer>

      {/* Botón flotante de WhatsApp */}
      <a
        href={`https://wa.me/${globalWhatsApp.replace(/\D/g, '')}?text=${encodeURIComponent("Hola! Me interesa probar MAX24 para mi comercio.")}`}
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-6 right-6 z-50 bg-emerald-500 hover:bg-emerald-600 text-white p-3.5 rounded-full shadow-2xl flex items-center justify-center gap-2 group transition-all duration-300 hover:scale-105 active:scale-95"
        title="Consultar por WhatsApp"
      >
        <MessageSquare className="w-6 h-6 animate-pulse" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-500 ease-out text-xs font-black font-sans whitespace-nowrap">
          ¿Dudas? Chat en vivo
        </span>
      </a>

    </div>
  );
}
