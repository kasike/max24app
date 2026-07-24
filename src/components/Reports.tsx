import React, { useState, useMemo, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  LineChart, 
  ShoppingBag, 
  Calendar, 
  User, 
  Search, 
  ArrowRight, 
  Layers, 
  ChevronRight,
  Eye,
  X,
  Printer,
  Trash2,
  RotateCcw,
  ShieldAlert,
  Clock,
  Receipt,
  Coins,
  Send,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
  FileText,
  Calculator,
  Plus,
  QrCode,
  CreditCard,
  Handshake
} from 'lucide-react';
import { Sale, Product, StoreSettings, CashierSession } from '../types';
import { db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';

interface ReportsProps {
  sales: Sale[];
  products: Product[];
  currentUser?: any;
  onClearSales?: () => void;
  backupExists?: boolean;
  backupDate?: string;
  onRestoreSales?: () => void;
  storeSettings?: StoreSettings;
  activeStoreEmail?: string;
  cashierSessions?: CashierSession[];
  onAddSession?: (newSession: Omit<CashierSession, 'id'>) => Promise<CashierSession>;
  onUpdateSessionStatus?: (sessionId: string, nextStatus: 'autorizado' | 'cerrado', closeCash?: number, wageAccrued?: number, hoursWorked?: number) => Promise<void>;
}

export default function Reports({ 
  sales: rawSales, 
  products: rawProducts, 
  currentUser, 
  onClearSales,
  backupExists = false,
  backupDate = '',
  onRestoreSales,
  storeSettings,
  activeStoreEmail,
  cashierSessions = [],
  onAddSession,
  onUpdateSessionStatus
}: ReportsProps) {
  const sales = useMemo(() => rawSales.filter(s => !s.isPracticeMode), [rawSales]);
  const products = useMemo(() => rawProducts.filter(p => !p.isPracticeMode), [rawProducts]);

  // Date filtering state (default: TODAY YYYY-MM-DD)
  const getTodayStr = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getYesterdayStr = () => {
    const now = new Date();
    now.setDate(now.getDate() - 1);
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [filterPreset, setFilterPreset] = useState<'today' | 'yesterday' | 'week' | 'custom'>('today');
  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());

  const [salesSearch, setSalesSearch] = useState('');
  const [selectedHistoricalSale, setSelectedHistoricalSale] = useState<Sale | null>(null);

  // Z-Report Ticket Modal State
  const [selectedZReportSession, setSelectedZReportSession] = useState<CashierSession | null>(null);

  // Arqueo / Shift Closure Modal State
  const [showArqueoModal, setShowArqueoModal] = useState(false);
  const [arqueoDeclaredCash, setArqueoDeclaredCash] = useState('');
  const [arqueoNotes, setArqueoNotes] = useState('');
  const [arqueoShift, setArqueoShift] = useState<'Mañana' | 'Tarde' | 'Noche'>('Mañana');
  const [arqueoEmployeeName, setArqueoEmployeeName] = useState(currentUser?.name || 'Administrador');
  const [isSavingArqueo, setIsSavingArqueo] = useState(false);

  // Double confirmation modals state for clear sales
  const [showConfirm1, setShowConfirm1] = useState(false);
  const [showConfirm2, setShowConfirm2] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  // Realtime food products cost and margin sync for financial calculations
  const [foodProducts, setFoodProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!activeStoreEmail) return;

    // Load from local storage fallback first
    const cached = localStorage.getItem(`food_products_${activeStoreEmail}`);
    if (cached) {
      try {
        setFoodProducts(JSON.parse(cached));
      } catch (e) {
        console.error("Error parsing cached food products:", e);
      }
    }

    // Realtime sync from Firestore
    const unsubscribe = onSnapshot(collection(db, 'storeSettings', activeStoreEmail, 'foodProducts'), (snap) => {
      const list: any[] = [];
      snap.forEach(doc => list.push(doc.data()));
      if (list.length > 0) {
        setFoodProducts(list);
        localStorage.setItem(`food_products_${activeStoreEmail}`, JSON.stringify(list));
      }
    });

    return () => unsubscribe();
  }, [activeStoreEmail]);

  const isOwner = currentUser?.role === 'Administrador';

  const handleStartClear = () => {
    setShowConfirm1(true);
  };

  const handleNextConfirm = () => {
    setShowConfirm1(false);
    setShowConfirm2(true);
  };

  const handleFinalConfirm = async () => {
    if (onClearSales) {
      setIsClearing(true);
      try {
        await onClearSales();
      } catch (e) {
        console.error("Error vaciando informe", e);
      } finally {
        setIsClearing(false);
        setShowConfirm2(false);
      }
    }
  };

  // Preset switchers
  const handleSelectPreset = (preset: 'today' | 'yesterday' | 'week' | 'custom') => {
    setFilterPreset(preset);
    if (preset === 'today') {
      setSelectedDate(getTodayStr());
    } else if (preset === 'yesterday') {
      setSelectedDate(getYesterdayStr());
    }
  };

  // Filtered Sales for Selected Date / Period
  const dateFilteredSales = useMemo(() => {
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    return sales.filter(s => {
      if (!s.date) return false;
      const saleDateStr = new Date(s.date).toISOString().split('T')[0];

      if (filterPreset === 'today') {
        return saleDateStr === today;
      } else if (filterPreset === 'yesterday') {
        return saleDateStr === yesterday;
      } else if (filterPreset === 'week') {
        const saleTime = new Date(s.date).getTime();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return saleTime >= sevenDaysAgo.getTime();
      } else {
        // custom
        return saleDateStr === selectedDate;
      }
    });
  }, [sales, filterPreset, selectedDate]);

  // Filtered Cashier Sessions (Turnos / Arqueos) for Selected Date / Period
  const dateFilteredSessions = useMemo(() => {
    const today = getTodayStr();
    const yesterday = getYesterdayStr();

    return cashierSessions.filter(sess => {
      const openDateStr = sess.openTime ? new Date(sess.openTime).toISOString().split('T')[0] : '';
      const closeDateStr = sess.closeTime ? new Date(sess.closeTime).toISOString().split('T')[0] : '';

      if (filterPreset === 'today') {
        return openDateStr === today || closeDateStr === today;
      } else if (filterPreset === 'yesterday') {
        return openDateStr === yesterday || closeDateStr === yesterday;
      } else if (filterPreset === 'week') {
        const openTime = sess.openTime ? new Date(sess.openTime).getTime() : 0;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        return openTime >= sevenDaysAgo.getTime();
      } else {
        return openDateStr === selectedDate || closeDateStr === selectedDate;
      }
    }).sort((a, b) => new Date(b.openTime).getTime() - new Date(a.openTime).getTime());
  }, [cashierSessions, filterPreset, selectedDate]);

  // Calculated Daily Summary Metrics
  const dailySummary = useMemo(() => {
    const totalRevenue = dateFilteredSales.reduce((acc, s) => acc + s.total, 0);
    const totalTransactions = dateFilteredSales.length;
    const averageTicket = totalTransactions > 0 ? Math.round(totalRevenue / totalTransactions) : 0;

    // Breakdown by payment method
    let cashSales = 0;
    let qrSales = 0;
    let cardSales = 0;
    let transferSales = 0;
    let creditAccountSales = 0;

    dateFilteredSales.forEach(s => {
      if (s.paymentMethod === 'Efectivo') {
        cashSales += s.total;
      } else if (s.paymentMethod === 'MercadoPago' || s.paymentMethod === 'Pago Móvil') {
        qrSales += s.total;
      } else if (s.paymentMethod === 'Transferencia') {
        transferSales += s.total;
      } else if (
        s.paymentMethod === 'Tarjeta de Crédito' || 
        s.paymentMethod === 'Tarjeta de Débito'
      ) {
        cardSales += s.total;
      } else if (s.paymentMethod === 'Cuenta Corriente') {
        creditAccountSales += s.total;
      } else {
        // Fallback default
        cashSales += s.total;
      }
    });

    // Sum initial cash from shift sessions
    const totalInitialCash = dateFilteredSessions.reduce((acc, sess) => acc + (sess.initialCash || 0), 0);
    // Expected cash in drawer = Initial Cash + Cash Sales
    const expectedCashInDrawer = totalInitialCash + cashSales;

    return {
      totalRevenue,
      totalTransactions,
      averageTicket,
      cashSales,
      qrSales,
      cardSales,
      transferSales,
      creditAccountSales,
      totalInitialCash,
      expectedCashInDrawer
    };
  }, [dateFilteredSales, dateFilteredSessions]);

  // Open Arqueo / Cierre Modal Handler
  const handleOpenArqueoModal = () => {
    setArqueoDeclaredCash(dailySummary.expectedCashInDrawer.toString());
    setArqueoNotes('');
    setArqueoShift('Mañana');
    setArqueoEmployeeName(currentUser?.name || 'Administrador');
    setShowArqueoModal(true);
  };

  // Submit Arqueo (Cierre de Caja)
  const handleSaveArqueo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingArqueo) return;

    setIsSavingArqueo(true);
    const declaredNum = Number(arqueoDeclaredCash) || 0;
    const expectedNum = dailySummary.expectedCashInDrawer;
    const difference = declaredNum - expectedNum;

    try {
      // Find open session to close, or create new closed session
      const activeSession = dateFilteredSessions.find(s => s.status === 'autorizado');

      let closedSession: CashierSession;

      if (activeSession && onUpdateSessionStatus) {
        await onUpdateSessionStatus(activeSession.id, 'cerrado', declaredNum);
        closedSession = {
          ...activeSession,
          status: 'cerrado',
          closeTime: new Date().toISOString(),
          closeCash: declaredNum,
          expectedCash: expectedNum,
          actualCash: declaredNum,
          difference: difference,
          notes: arqueoNotes,
          salesTotal: dailySummary.totalRevenue,
          salesCount: dailySummary.totalTransactions,
          salesByMethod: {
            Efectivo: dailySummary.cashSales,
            MercadoPago: dailySummary.qrSales,
            Tarjeta: dailySummary.cardSales,
            Transferencia: dailySummary.transferSales,
            'Cuenta Corriente': dailySummary.creditAccountSales
          }
        };
      } else if (onAddSession) {
        closedSession = await onAddSession({
          employeeId: currentUser?.id || 'emp-owner',
          employeeName: arqueoEmployeeName || currentUser?.name || 'Administrador',
          openTime: new Date().toISOString(),
          closeTime: new Date().toISOString(),
          initialCash: dailySummary.totalInitialCash,
          closeCash: declaredNum,
          salesCount: dailySummary.totalTransactions,
          salesTotal: dailySummary.totalRevenue,
          salesByMethod: {
            Efectivo: dailySummary.cashSales,
            MercadoPago: dailySummary.qrSales,
            Tarjeta: dailySummary.cardSales,
            Transferencia: dailySummary.transferSales,
            'Cuenta Corriente': dailySummary.creditAccountSales
          },
          debtPaymentsCollected: 0,
          hourlyRate: currentUser?.hourlyRate || 0,
          status: 'cerrado',
          storeEmail: activeStoreEmail || 'global',
          shift: arqueoShift,
          expectedCash: expectedNum,
          actualCash: declaredNum,
          difference: difference,
          notes: arqueoNotes
        });
      } else {
        // Local fallback
        closedSession = {
          id: `ses-${Date.now()}`,
          employeeId: currentUser?.id || 'emp-owner',
          employeeName: arqueoEmployeeName || currentUser?.name || 'Administrador',
          openTime: new Date().toISOString(),
          closeTime: new Date().toISOString(),
          initialCash: dailySummary.totalInitialCash,
          closeCash: declaredNum,
          salesCount: dailySummary.totalTransactions,
          salesTotal: dailySummary.totalRevenue,
          salesByMethod: {
            Efectivo: dailySummary.cashSales,
            MercadoPago: dailySummary.qrSales,
            Tarjeta: dailySummary.cardSales,
            Transferencia: dailySummary.transferSales,
            'Cuenta Corriente': dailySummary.creditAccountSales
          },
          debtPaymentsCollected: 0,
          hourlyRate: 0,
          status: 'cerrado',
          storeEmail: activeStoreEmail || 'global',
          shift: arqueoShift,
          expectedCash: expectedNum,
          actualCash: declaredNum,
          difference: difference,
          notes: arqueoNotes
        };
      }

      setShowArqueoModal(false);
      setIsSavingArqueo(false);
      // Open newly generated Z-Report Ticket modal for inspection/printing!
      setSelectedZReportSession(closedSession);
    } catch (err) {
      console.error("Error guardando arqueo de caja:", err);
      setIsSavingArqueo(false);
    }
  };

  // All-time general calculated metrics for overall charts
  const summaryStats = useMemo(() => {
    const count = sales.length;
    if (count === 0) {
      return { totalRevenue: 0, totalItemsSold: 0, averageTicket: 0, estimatedProfit: 0 };
    }

    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const averageTicket = Math.round(totalRevenue / count);

    let estimatedProfit = 0;
    let totalItemsSold = 0;

    sales.forEach(sale => {
      sale.items.forEach(item => {
        totalItemsSold += item.quantity;
        const prodMatch = products.find(p => p.id === item.productId);
        const foodMatch = foodProducts.find(f => f.id === item.productId);

        if (prodMatch) {
          const itemCost = prodMatch.cost * item.quantity;
          const itemRevenue = item.price * item.quantity;
          const discountProportion = sale.subtotal > 0 ? (sale.discount / sale.subtotal) : 0;
          const discountedRevenue = itemRevenue - (itemRevenue * discountProportion);
          estimatedProfit += (discountedRevenue - itemCost);
        } else if (foodMatch) {
          const costPerUnit = foodMatch.cost !== undefined 
            ? foodMatch.cost 
            : (foodMatch.margin !== undefined ? foodMatch.price * (1 - foodMatch.margin / 100) : foodMatch.price * 0.4);
          const itemCost = costPerUnit * item.quantity;
          const itemRevenue = item.price * item.quantity;
          const discountProportion = sale.subtotal > 0 ? (sale.discount / sale.subtotal) : 0;
          const discountedRevenue = itemRevenue - (itemRevenue * discountProportion);
          estimatedProfit += (discountedRevenue - itemCost);
        } else {
          estimatedProfit += (item.price * item.quantity * 0.3);
        }
      });
    });

    return {
      totalRevenue,
      totalItemsSold,
      averageTicket,
      estimatedProfit: Math.round(estimatedProfit)
    };
  }, [sales, products, foodProducts]);

  // Chart Data
  const chartData = useMemo(() => {
    const datesMap: { [date: string]: number } = {};
    
    sales.forEach(sale => {
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      datesMap[dateStr] = (datesMap[dateStr] || 0) + sale.total;
    });

    const sortedDates = Object.keys(datesMap).sort();
    
    if (sortedDates.length === 1) {
      const singleDate = sortedDates[0];
      const prev = new Date(singleDate);
      prev.setDate(prev.getDate() - 1);
      const prevStr = prev.toISOString().split('T')[0];
      return [
        { date: prevStr, amount: 0 },
        { date: singleDate, amount: datesMap[singleDate] }
      ];
    }

    return sortedDates.map(date => ({
      date,
      amount: datesMap[date]
    }));
  }, [sales]);

  const maxChartVal = useMemo(() => {
    const vals = chartData.map(d => d.amount);
    return vals.length > 0 ? Math.max(...vals, 1000) : 10000;
  }, [chartData]);

  // Category sales
  const categorySales = useMemo(() => {
    const shares: { [category: string]: number } = {};
    
    sales.forEach(sale => {
      sale.items.forEach(item => {
        const prod = products.find(p => p.id === item.productId);
        const cat = prod ? prod.category : 'Otros';
        shares[cat] = (shares[cat] || 0) + (item.price * item.quantity);
      });
    });

    const totalSalesVol = Object.values(shares).reduce((a, b) => a + b, 0) || 1;
    
    return Object.keys(shares).map(cat => ({
      category: cat,
      revenue: shares[cat],
      percentage: Math.round((shares[cat] / totalSalesVol) * 100)
    })).sort((a, b) => b.revenue - a.revenue);
  }, [sales, products]);

  // Filtered historical sales table list
  const filteredSales = useMemo(() => {
    return dateFilteredSales.filter(s => {
      const matchId = s.id.toLowerCase().includes(salesSearch.toLowerCase());
      const matchSeller = s.sellerName.toLowerCase().includes(salesSearch.toLowerCase());
      const matchMethod = s.paymentMethod.toLowerCase().includes(salesSearch.toLowerCase());
      return matchId || matchSeller || matchMethod;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [dateFilteredSales, salesSearch]);

  return (
    <div className="space-y-6">
      
      {/* CONFIRMATION STEP 1 MODAL */}
      {showConfirm1 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-xs animate-fade-in" onClick={() => setShowConfirm1(false)} />
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl animate-scale-up text-left space-y-5">
            <div className="p-3.5 bg-rose-50 text-rose-600 rounded-2xl w-fit">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-black text-slate-900 tracking-tight">¿Eliminar Reporte de Ventas?</h3>
              <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                Esta acción eliminará el reporte visible y las estadísticas acumuladas correspondientes de tu panel de control, dejándolo totalmente en limpio para tu nuevo comercio.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm1(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition-colors cursor-pointer text-center"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleNextConfirm}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-rose-600/10 transition-colors cursor-pointer text-center"
              >
                Siguiente Paso
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION STEP 2 MODAL */}
      {showConfirm2 && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs animate-fade-in" onClick={() => setShowConfirm2(false)} />
          <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 max-w-md w-full relative z-10 shadow-2xl animate-scale-up text-left space-y-6">
            <div className="p-3.5 bg-rose-100 text-rose-750 rounded-2xl w-fit flex items-center justify-center animate-pulse">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div className="space-y-2.5">
              <h3 className="text-xl font-black text-rose-700 tracking-tight">CONFIRMACIÓN CRÍTICA</h3>
              <p className="text-xs sm:text-sm text-slate-700 font-extrabold leading-relaxed">
                ¡Atención! Esta acción borrará todo el reporte del sistema.
              </p>
              <p className="text-[11px] text-slate-450 leading-relaxed">
                Sin embargo, la plataforma mantendrá guardada una copia de seguridad recuperable por unos días en el sistema para que puedas restablecerla si tocas por error.
              </p>
            </div>
            <div className="flex flex-col gap-2.5">
              <button
                type="button"
                disabled={isClearing}
                onClick={handleFinalConfirm}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/15 transition-all cursor-pointer text-center flex items-center justify-center gap-2"
              >
                {isClearing ? 'Procesando Vaciado...' : 'Confirmar e Inicializar Sistema'}
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setShowConfirm2(false)}
                className="w-full py-2.5 text-slate-400 font-bold text-xs hover:text-slate-600 transition-colors cursor-pointer text-center"
              >
                Volver Atrás / Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cabecera de reporte con opción de vaciado de reporte ejemplo para Propietarios */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-orange-500 w-5 h-5" />
            Reportes & Análisis de Ventas
          </h2>
          <p className="text-xs text-slate-500">
            Resumen diario en tiempo real, arqueos de caja, cierres de turno Z-Report y márgenes de ganancia.
          </p>
        </div>

        {isOwner && onClearSales && (
          <button
            type="button"
            onClick={handleStartClear}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 hover:border-rose-300 text-rose-600 font-extrabold text-[11px] tracking-wide uppercase rounded-xl transition-all duration-200 cursor-pointer select-none active:scale-95 shrink-0"
          >
            <Trash2 className="w-4 h-4 text-rose-600" />
            <span>Eliminar Reporte de Ejemplo (Vaciar)</span>
          </button>
        )}
      </div>

      {/* BACKUP RESTORE CARD BANNER */}
      {backupExists && onRestoreSales && (
        <div className="bg-slate-900 border border-amber-500/25 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl shrink-0">
              <RotateCcw className="w-5 h-5 text-amber-500" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-100">Copia de Seguridad de Reporte Disponible</h4>
              <p className="text-xs text-slate-400 leading-normal max-w-xl">
                Se guardó un respaldo del historial anterior el <strong className="text-amber-400 font-extrabold">{backupDate}</strong>. Si vaciaste los datos por error, puedes restaurarlos de inmediato.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onRestoreSales}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-[11px] tracking-wide uppercase rounded-xl transition-all duration-200 active:scale-95 shrink-0 cursor-pointer text-center"
          >
            Restaurar Historial de Reporte
          </button>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. FILTRO DE FECHA PRINCIPAL CON PRESETS (HOY, AYER, SEMANA) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl border border-slate-800 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-orange-500/15 border border-orange-500/30 text-orange-400 rounded-2xl">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-orange-400 font-mono">Filtro de Fecha Principal</h3>
            <p className="text-sm font-black text-white flex items-center gap-2 mt-0.5">
              <span>Consultando:</span>
              <span className="text-amber-300 font-mono bg-slate-950 px-2.5 py-0.5 rounded-lg border border-slate-800">
                {filterPreset === 'today' ? `HOY (${selectedDate})` : filterPreset === 'yesterday' ? `AYER (${selectedDate})` : filterPreset === 'week' ? 'ESTA SEMANA' : `FECHA: ${selectedDate}`}
              </span>
            </p>
          </div>
        </div>

        {/* Preset Selector Buttons & Date Picker */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectPreset('today')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${filterPreset === 'today' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
          >
            Hoy
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('yesterday')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${filterPreset === 'yesterday' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
          >
            Ayer
          </button>
          <button
            type="button"
            onClick={() => handleSelectPreset('week')}
            className={`px-3.5 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${filterPreset === 'week' ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20' : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'}`}
          >
            Esta Semana
          </button>
          
          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setFilterPreset('custom');
              }}
              className="bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-1.5 text-xs font-bold font-mono focus:border-orange-500 focus:outline-hidden cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TARJETA DESTACADA: RESUMEN DEL DÍA ACTUAL (X-REPORT / LIVE) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                📊 Resumen del Día Consulta (Vista en Vivo / Estado de Caja)
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Suma acumulada de facturación del día consultado y desglose inmediato por medio de pago.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenArqueoModal}
            className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0 active:scale-98"
          >
            <Calculator className="w-4 h-4" />
            <span>⚡ Registrar Cierre de Caja (Arqueo / Z-Report)</span>
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Total Vendido Hoy */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50/40 border border-orange-200/80 p-5 rounded-2xl relative overflow-hidden space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-orange-700 uppercase tracking-wider">Ventas Totales Hoy</span>
              <div className="p-2 bg-orange-500/10 text-orange-600 rounded-xl">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-orange-950 font-mono tracking-tight">
              ${dailySummary.totalRevenue.toLocaleString('es-AR')}
            </p>
            <div className="flex items-center justify-between text-xs text-orange-800 font-semibold pt-1 border-t border-orange-200/60">
              <span>{dailySummary.totalTransactions} Transacciones</span>
              <span>Ticket Prom.: ${dailySummary.averageTicket.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Efectivo en Caja */}
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50/40 border border-emerald-200/80 p-5 rounded-2xl relative overflow-hidden space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-emerald-700 uppercase tracking-wider">Efectivo en Caja</span>
              <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-xl">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-950 font-mono tracking-tight">
              ${dailySummary.expectedCashInDrawer.toLocaleString('es-AR')}
            </p>
            <div className="flex items-center justify-between text-xs text-emerald-800 font-semibold pt-1 border-t border-emerald-200/60">
              <span>Caja Inicial: ${dailySummary.totalInitialCash.toLocaleString('es-AR')}</span>
              <span>Ventas Ef.: ${dailySummary.cashSales.toLocaleString('es-AR')}</span>
            </div>
          </div>

          {/* Mercado Pago / QR */}
          <div className="bg-gradient-to-br from-blue-50 to-sky-50/40 border border-blue-200/80 p-5 rounded-2xl relative overflow-hidden space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-700 uppercase tracking-wider">Mercado Pago / QR</span>
              <div className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">
                <QrCode className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-blue-950 font-mono tracking-tight">
              ${dailySummary.qrSales.toLocaleString('es-AR')}
            </p>
            <p className="text-xs text-blue-800 font-semibold pt-1 border-t border-blue-200/60">
              Cobros acreditados en cuenta digital
            </p>
          </div>

          {/* Tarjetas / Transferencias / Fiado */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50/40 border border-purple-200/80 p-5 rounded-2xl relative overflow-hidden space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-purple-700 uppercase tracking-wider">Tarjetas / Banco / Fiado</span>
              <div className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">
                <CreditCard className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-purple-950 font-mono tracking-tight">
              ${(dailySummary.cardSales + dailySummary.transferSales + dailySummary.creditAccountSales).toLocaleString('es-AR')}
            </p>
            <div className="flex flex-wrap items-center justify-between text-xs text-purple-800 font-semibold pt-1 border-t border-purple-200/60 gap-y-1">
              <span>Tarjetas: ${dailySummary.cardSales.toLocaleString('es-AR')}</span>
              <span>Transf: ${dailySummary.transferSales.toLocaleString('es-AR')}</span>
              <span>Fiado: ${dailySummary.creditAccountSales.toLocaleString('es-AR')}</span>
            </div>
          </div>

        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. HISTORIAL DE TURNOS Y CIERRES DE CAJA (Z-REPORT HISTORY)   */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 tracking-tight flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Historial de Turnos y Cierres de Caja (Auditoría Z-Report)
            </h3>
            <p className="text-xs text-slate-500">
              Registro histórico de arqueos y diferencias de caja declaradas por los empleados y administradores.
            </p>
          </div>

          <span className="px-3 py-1 bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold font-mono shrink-0">
            {dateFilteredSessions.length} Turnos Registrados
          </span>
        </div>

        {dateFilteredSessions.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600">No hay cierres de caja ni turnos registrados para esta fecha.</p>
            <p className="text-[11px] text-slate-400">Haz clic en "Registrar Cierre de Caja" para realizar tu primer arqueo del día.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-extrabold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                  <th className="p-3">Cajero / Vendedor</th>
                  <th className="p-3">Horario</th>
                  <th className="p-3 text-right">Ef. Inicial</th>
                  <th className="p-3 text-right">Ef. Esperado</th>
                  <th className="p-3 text-right">Ef. Declarado</th>
                  <th className="p-3 text-center">Diferencia</th>
                  <th className="p-3 text-center">Estado</th>
                  <th className="p-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150">
                {dateFilteredSessions.map((session) => {
                  const expectedCash = session.expectedCash !== undefined 
                    ? session.expectedCash 
                    : (session.initialCash + (session.salesByMethod?.['Efectivo'] || session.salesTotal || 0));
                  
                  const declaredCash = session.closeCash !== undefined ? session.closeCash : (session.actualCash || 0);
                  const difference = session.difference !== undefined ? session.difference : (declaredCash - expectedCash);

                  return (
                    <tr key={session.id} className="hover:bg-slate-50/80 transition-colors font-sans">
                      <td className="p-3">
                        <div className="font-bold text-slate-900">{session.employeeName}</div>
                        <div className="text-[10px] text-slate-400">Turno: {session.shift || 'General'}</div>
                      </td>
                      <td className="p-3 font-mono text-slate-600">
                        {session.openTime ? new Date(session.openTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) : '--:--'} hs
                        {session.closeTime ? ` - ${new Date(session.closeTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs` : ' (En curso)'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-700">
                        ${(session.initialCash || 0).toLocaleString('es-AR')}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        ${expectedCash.toLocaleString('es-AR')}
                      </td>
                      <td className="p-3 text-right font-mono font-extrabold text-slate-950">
                        ${declaredCash.toLocaleString('es-AR')}
                      </td>
                      <td className="p-3 text-center">
                        {difference === 0 ? (
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] inline-block">
                            $0 (Perfecto)
                          </span>
                        ) : difference > 0 ? (
                          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] inline-block">
                            +${difference.toLocaleString('es-AR')} (Sobrante)
                          </span>
                        ) : (
                          <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2.5 py-0.5 rounded-full font-extrabold text-[10px] inline-block">
                            -${Math.abs(difference).toLocaleString('es-AR')} (Faltante)
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        {session.status === 'cerrado' ? (
                          <span className="bg-slate-200 text-slate-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                            Cerrado
                          </span>
                        ) : (
                          <span className="bg-amber-100 text-amber-800 border border-amber-300 font-extrabold px-2.5 py-0.5 rounded-full text-[10px] animate-pulse">
                            Abierto
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedZReportSession(session)}
                          className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-white font-extrabold rounded-lg text-[11px] flex items-center justify-center gap-1 mx-auto cursor-pointer transition-all"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Ver Ticket</span>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. BALANCE DE UTILIDAD REAL / ESTADO DE RESULTADOS            */}
      {/* ------------------------------------------------------------- */}
      {(() => {
        const totalFixedCosts = storeSettings?.fixedCosts 
          ? storeSettings.fixedCosts.reduce((acc, fc) => acc + (fc.amount || 0), 0)
          : 0;
        
        const totalSales = summaryStats.totalRevenue;
        const costOfGoodsSold = Math.max(0, totalSales - summaryStats.estimatedProfit);
        const grossProfit = summaryStats.estimatedProfit;
        const netProfit = grossProfit - totalFixedCosts;
        const hasProfit = netProfit >= 0;

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden font-sans">
            <div className={`absolute top-0 right-0 w-[400px] h-[400px] blur-[120px] rounded-full opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/3 ${hasProfit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${hasProfit ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'}`}>
                    {hasProfit ? 'Balance con Superávit' : 'Balance con Déficit'}
                  </span>
                  <span className="text-slate-450 text-[10px] font-mono font-bold">Fórmula: Ganancia Real = Ventas - Costos Variables - Costos Fijos</span>
                </div>
                <h3 className="text-xl font-black text-slate-100 tracking-tight">Estado de Resultados & Ganancia Real (Global)</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Balance financiero real del comercio, deduciendo costos variables de mercadería vendida y los costos fijos operacionales configurados.
                </p>
              </div>

              <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl flex flex-col items-center lg:items-end justify-center shrink-0 min-w-[245px] text-center lg:text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Ganancia Neta Real</span>
                <div className="flex items-center gap-2 mt-1.5">
                  {hasProfit ? (
                    <TrendingUp className="w-6 h-6 text-emerald-400" />
                  ) : (
                    <TrendingDown className="w-6 h-6 text-rose-400" />
                  )}
                  <span className={`text-2xl sm:text-3xl font-black font-mono leading-none ${hasProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                    ${netProfit.toLocaleString('es-AR')}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium font-sans">
                  {hasProfit ? '✓ Tu comercio está generando ingresos netos.' : '⚠ Los costos fijos y variables superan las ventas.'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 relative z-10 text-left font-sans">
              <div className="p-4 bg-slate-950/20 border border-slate-800/50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">1. Ventas Acumuladas (+)</span>
                <p className="text-lg font-black text-slate-100 font-mono">${totalSales.toLocaleString('es-AR')}</p>
                <p className="text-[10px] text-slate-500 font-sans">Facturación bruta acumulada</p>
              </div>

              <div className="p-4 bg-slate-950/20 border border-slate-800/50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">2. Costos Variables (-)</span>
                <p className="text-lg font-black text-slate-100 font-mono">${costOfGoodsSold.toLocaleString('es-AR')}</p>
                <p className="text-[10px] text-slate-500 font-sans">Costo de mercadería vendida</p>
              </div>

              <div className="p-4 bg-slate-950/20 border border-slate-800/50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">3. Costos Fijos (-)</span>
                <p className="text-lg font-black text-slate-100 font-mono">${totalFixedCosts.toLocaleString('es-AR')}</p>
                <p className="text-[10px] text-slate-500 font-sans">Alquiler, servicios, sueldos, etc.</p>
              </div>

              <div className={`p-4 rounded-2xl space-y-1 border ${hasProfit ? 'bg-emerald-950/15 border-emerald-500/20' : 'bg-rose-950/15 border-rose-500/20'}`}>
                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-400">4. Resultado Neto (=)</span>
                <p className={`text-lg font-black font-mono ${hasProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${netProfit.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-slate-500 font-sans">Margen de ganancia neto real</p>
              </div>
            </div>

            {storeSettings?.fixedCosts && storeSettings.fixedCosts.length > 0 && (
              <div className="mt-5 bg-slate-950/30 border border-slate-800/40 p-4 rounded-2xl text-left">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono block mb-2.5">Detalle de Costos Fijos de la Tienda</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-sans">
                  {storeSettings.fixedCosts.map((fc, i) => (
                    <div key={fc.id || i} className="bg-slate-900/60 border border-slate-800/40 px-3 py-1.5 rounded-xl flex justify-between items-center text-xs">
                      <span className="text-slate-400 truncate pr-2 capitalize font-semibold">{fc.category || 'Costo General'}</span>
                      <span className="font-mono font-black text-slate-200 shrink-0">${fc.amount.toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* ------------------------------------------------------------- */}
      {/* 5. GRÁFICOS Y ANÁLISIS POR CATEGORÍA                         */}
      {/* ------------------------------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart column 1: Daily Revenue Trend line SVG */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <LineChart className="text-orange-500 w-4.5 h-4.5" />
                Historial de Ventas Diarias
              </h3>
              <p className="text-[11px] text-slate-400">Evolución monetaria de ingresos por día de atención</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-[10px] font-bold text-slate-600 font-sans">
              Gráfico Dinámico
            </div>
          </div>

          <div className="h-[280px] w-full pt-4 flex flex-col justify-between relative select-none">
            <div className="w-full h-[220px] relative">
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <div 
                  key={i} 
                  className="absolute left-0 right-0 border-t border-dashed border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono"
                  style={{ top: `${p * 200}px` }}
                >
                  <span className="bg-white/85 pr-1.5">${Math.round(maxChartVal - (p * maxChartVal)).toLocaleString('es-AR')}</span>
                </div>
              ))}

              {chartData.length > 0 && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  <polygon
                    fill="url(#chartGrad)"
                    points={`
                      0,200
                      ${chartData.map((d, index) => {
                        const x = (index / (chartData.length - 1)) * 500;
                        const y = 200 - ((d.amount / maxChartVal) * 160 + 20);
                        return `${x},${y}`;
                      }).join(' ')}
                      500,200
                    `}
                  />

                  <polyline
                    fill="none"
                    stroke="#f97316"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartData.map((d, index) => {
                      const x = (index / (chartData.length - 1)) * 500;
                      const y = 200 - ((d.amount / maxChartVal) * 160 + 20);
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {chartData.map((d, index) => {
                    const x = (index / (chartData.length - 1)) * 500;
                    const y = 200 - ((d.amount / maxChartVal) * 160 + 20);
                    return (
                      <circle
                        key={index}
                        cx={x}
                        cy={y}
                        r="5.5"
                        fill="#ffffff"
                        stroke="#ea580c"
                        strokeWidth="3"
                        title={`${d.date}: $${d.amount}`}
                        className="cursor-pointer hover:r-7 transition-all"
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-2 px-1 text-[10px] font-bold text-slate-500 font-mono">
              {chartData.map((d, i) => (
                <span key={i} className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  {i === 0 ? 'Inicio (' + d.date.substring(5) + ')' : d.date.substring(5)}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Chart column 2: Category Shares */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-orange-500 w-4.5 h-4.5" />
              Venta por Categorías
            </h3>
            <p className="text-[11px] text-slate-400">Participación porcentual de rubros</p>
          </div>

          <div className="space-y-4 pt-4 flex-1">
            {categorySales.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs font-semibold">
                Sin ventas registradas por ahora
              </div>
            ) : (
              categorySales.slice(0, 5).map((cs, idx) => (
                <div key={idx} className="space-y-1.5 focus-card">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 font-sans">
                    <span className="capitalize">{cs.category}</span>
                    <span className="font-mono text-slate-500">${cs.revenue.toLocaleString('es-AR')} ({cs.percentage}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shadow-xxs">
                    <div 
                      className={`h-full rounded-full transition-all duration-500
                        ${idx === 0 ? 'bg-orange-500' : ''}
                        ${idx === 1 ? 'bg-amber-500' : ''}
                        ${idx === 2 ? 'bg-indigo-500' : ''}
                        ${idx === 3 ? 'bg-emerald-500' : ''}
                        ${idx >= 4 ? 'bg-slate-400' : ''}
                      `}
                      style={{ width: `${cs.percentage}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="mt-4 p-3 bg-slate-50 border border-slate-150/40 rounded-xl text-[10px] text-slate-500">
            💡 <strong>Sugerencia comercial:</strong> El rubro prioritario representa el {categorySales[0]?.percentage || 0}% de tus ingresos totales.
          </div>
        </div>

      </div>

      {/* ------------------------------------------------------------- */}
      {/* 6. HISTORIAL DE TRANSACCIONES Y VENTAS INDIVIDUALES           */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Historial de Transacciones (Período Seleccionado)</h3>
            <p className="text-xs text-slate-400">Busca, analiza y re-emite facturas o tickets registrados previamente</p>
          </div>

          <div className="w-full md:max-w-xs relative text-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtro ID, cajero, método de pago..."
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-700">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold tracking-wider uppercase border-b border-slate-100">
                <th className="py-3 px-4">ID Transact</th>
                <th className="py-3 px-4">Fecha / Hora</th>
                <th className="py-3 px-4 text-center">Cant. Artículos</th>
                <th className="py-3 px-4 text-right">Monto Neto</th>
                <th className="py-3 px-4 text-center">Método Pago</th>
                <th className="py-3 px-4">Atendido Por</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150/40">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-400 text-xs font-semibold">
                    No se encontraron transacciones registradas para este filtro o fecha.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => {
                  const totalItems = sale.items.reduce((acc, i) => acc + i.quantity, 0);

                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4">
                        <span className="font-mono font-extrabold text-slate-900 bg-orange-50 px-2 py-0.5 rounded border border-orange-200 text-[11px]">
                          {sale.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {new Date(sale.date).toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-800">
                        {totalItems} u.
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                        ${sale.total.toLocaleString('es-AR')}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="inline-flex items-center gap-1 bg-slate-150/60 text-slate-700 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
                          {sale.paymentMethod === 'Efectivo' ? '💵' : sale.paymentMethod === 'Cuenta Corriente' ? '🤝' : '💳'} {sale.paymentMethod}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-slate-650">
                          <User className="w-3 h-3 text-slate-400" />
                          <span>{sale.sellerName}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedHistoricalSale(sale)}
                          className="inline-flex items-center gap-1.5 font-bold text-orange-600 hover:text-orange-700 font-sans cursor-pointer py-1 px-2.5 bg-orange-50 hover:bg-orange-100 rounded-lg transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver Recibo
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* MODAL DE REGISTRO DE ARQUEO / CIERRE DE CAJA DIRECTO          */}
      {/* ------------------------------------------------------------- */}
      {showArqueoModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[110] animate-fade-in">
          <div className="bg-slate-900 text-white rounded-3xl p-6 max-w-lg w-full border border-slate-800 shadow-2xl relative space-y-5 animate-scale-up">
            <button
              type="button"
              onClick={() => setShowArqueoModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 bg-slate-800 hover:bg-slate-700 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="p-3 bg-gradient-to-tr from-orange-500 to-amber-500 text-slate-950 rounded-2xl font-black">
                <Calculator className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-400 font-mono">Módulo de Cierre Z-Report</span>
                <h3 className="text-lg font-black text-white tracking-tight">Arqueo y Cierre de Caja del Día</h3>
              </div>
            </div>

            <form onSubmit={handleSaveArqueo} className="space-y-4 text-xs">
              
              {/* Responsable & Turno */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Cajero / Responsable</label>
                  <input
                    type="text"
                    required
                    value={arqueoEmployeeName}
                    onChange={(e) => setArqueoEmployeeName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:border-orange-500 focus:outline-hidden"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-slate-300">Turno de Atención</label>
                  <select
                    value={arqueoShift}
                    onChange={(e) => setArqueoShift(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold focus:border-orange-500 focus:outline-hidden cursor-pointer"
                  >
                    <option value="Mañana">🌅 Turno Mañana</option>
                    <option value="Tarde">☀️ Turno Tarde</option>
                    <option value="Noche">🌙 Turno Noche</option>
                  </select>
                </div>
              </div>

              {/* Calculated Expected Summary Card */}
              <div className="bg-slate-950 border border-slate-800 p-4 rounded-2xl space-y-2 font-mono">
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Fondo Inicial Registrado:</span>
                  <span className="font-bold text-white">${dailySummary.totalInitialCash.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between items-center text-slate-400 text-[11px]">
                  <span>Ventas del Día en Efectivo:</span>
                  <span className="font-bold text-emerald-400">+${dailySummary.cashSales.toLocaleString('es-AR')}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
                  <span className="font-bold text-orange-400 uppercase font-sans">Efectivo Esperado en Gaveta:</span>
                  <span className="text-base font-black text-amber-300">${dailySummary.expectedCashInDrawer.toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Physical Cash Input */}
              <div className="space-y-1.5">
                <label className="font-extrabold text-slate-200 flex items-center justify-between">
                  <span>Efectivo Declarado / Contado en Gaveta ($)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Monto físicamente contado</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-sm">$</span>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1"
                    value={arqueoDeclaredCash}
                    onChange={(e) => setArqueoDeclaredCash(e.target.value)}
                    className="w-full pl-8 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-lg font-black text-amber-400 font-mono focus:border-orange-500 focus:outline-hidden"
                    placeholder="Monto contado"
                  />
                </div>
              </div>

              {/* Difference preview badge */}
              {(() => {
                const declared = Number(arqueoDeclaredCash) || 0;
                const diff = declared - dailySummary.expectedCashInDrawer;
                return (
                  <div className={`p-3 rounded-xl border flex items-center justify-between font-mono font-bold text-xs ${diff === 0 ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-400' : diff > 0 ? 'bg-blue-950/40 border-blue-500/30 text-blue-400' : 'bg-rose-950/40 border-rose-500/30 text-rose-400'}`}>
                    <span>Resultado de Arqueo:</span>
                    <span>
                      {diff === 0 ? '✓ Caja Exacta ($0)' : diff > 0 ? `▲ Sobrante (+$${diff.toLocaleString('es-AR')})` : `▼ Faltante (-$${Math.abs(diff).toLocaleString('es-AR')})`}
                    </span>
                  </div>
                );
              })()}

              {/* Notes */}
              <div className="space-y-1">
                <label className="font-bold text-slate-300">Observaciones del Cierre (Opcional)</label>
                <textarea
                  rows={2}
                  value={arqueoNotes}
                  onChange={(e) => setArqueoNotes(e.target.value)}
                  placeholder="Detalles sobre pagos, cambio o justificación de diferencia..."
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-sans text-xs focus:border-orange-500 focus:outline-hidden"
                />
              </div>

              {/* Actions */}
              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowArqueoModal(false)}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingArqueo}
                  className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-slate-950 font-black rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                >
                  {isSavingArqueo ? 'Procesando...' : 'Confirmar Cierre de Caja'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL VER TICKET Z-REPORT CIERRE DE CAJA                      */}
      {/* ------------------------------------------------------------- */}
      {selectedZReportSession && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-[120] animate-fade-in">
          <div className="bg-slate-100 rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative flex flex-col items-center">
            
            <button
              type="button"
              onClick={() => setSelectedZReportSession(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-200/50 hover:bg-slate-200 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-full bg-slate-900 text-amber-400 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-slate-900 tracking-tight">Ticket Z-Report (Cierre de Caja)</h4>
            <p className="text-[11px] text-slate-500 mt-0.5 mb-4">Documento de Arqueo y Control de Turno</p>

            {/* Thermal receipt layout */}
            <div className="bg-white p-5 rounded-2xl w-full border border-slate-300 shadow-md flex flex-col font-mono text-[11px] leading-relaxed text-slate-800">
              
              <div className="text-center pb-3 border-b border-dashed border-slate-300 mb-2">
                <h5 className="font-black text-xs uppercase tracking-wider">{storeSettings?.name || 'MAX24 POS SYSTEM'}</h5>
                <p className="text-[10px] text-slate-500">{storeSettings?.address || 'Sucursal Principal'}</p>
                <div className="my-1.5 text-slate-400">--------------------------</div>
                <div className="flex items-center justify-between text-[9px] text-slate-600">
                  <span>DOCUMENTO</span>
                  <span className="font-bold">Z-REPORT CIERRE</span>
                </div>
                <p className="text-[9px] text-slate-500 text-left mt-1">
                  ID Turno: {selectedZReportSession.id}
                </p>
                <p className="text-[9px] text-slate-500 text-left">
                  Fecha/Hora: {selectedZReportSession.closeTime ? new Date(selectedZReportSession.closeTime).toLocaleString('es-AR') : new Date().toLocaleString('es-AR')}
                </p>
              </div>

              {/* Operator info */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-300 mb-2">
                <div className="flex justify-between">
                  <span>Cajero:</span>
                  <span className="font-bold">{selectedZReportSession.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span>Turno:</span>
                  <span className="font-bold">{selectedZReportSession.shift || 'General'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cant. Ventas:</span>
                  <span className="font-bold">{selectedZReportSession.salesCount || 0} oper.</span>
                </div>
              </div>

              {/* Sales Breakdown */}
              <div className="space-y-1 pb-2 border-b border-dashed border-slate-300 mb-2">
                <div className="font-bold text-[10px] uppercase text-slate-500 mb-1">VENTAS POR MEDIO PAGO</div>
                <div className="flex justify-between">
                  <span>💵 Efectivo:</span>
                  <span>${(selectedZReportSession.salesByMethod?.['Efectivo'] || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>📱 Mercado Pago / QR:</span>
                  <span>${(selectedZReportSession.salesByMethod?.['MercadoPago'] || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>💳 Tarjetas:</span>
                  <span>${(selectedZReportSession.salesByMethod?.['Tarjeta'] || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>🏦 Transferencias:</span>
                  <span>${(selectedZReportSession.salesByMethod?.['Transferencia'] || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between">
                  <span>🤝 Cuenta Corriente:</span>
                  <span>${(selectedZReportSession.salesByMethod?.['Cuenta Corriente'] || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-extrabold text-slate-950 pt-1 border-t border-slate-200">
                  <span>Total Facturado:</span>
                  <span>${(selectedZReportSession.salesTotal || 0).toLocaleString('es-AR')}</span>
                </div>
              </div>

              {/* Cash Drawer Audit */}
              <div className="space-y-1 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="font-bold text-[10px] uppercase text-slate-700 mb-1">AUDITORÍA EN EFECTIVO</div>
                <div className="flex justify-between text-slate-600">
                  <span>Fondo Inicial:</span>
                  <span>${(selectedZReportSession.initialCash || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ventas Efectivo:</span>
                  <span>+${(selectedZReportSession.salesByMethod?.['Efectivo'] || 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-900 border-t border-slate-200 pt-1">
                  <span>Esperado en Caja:</span>
                  <span>${(selectedZReportSession.expectedCash || ((selectedZReportSession.initialCash || 0) + (selectedZReportSession.salesByMethod?.['Efectivo'] || 0))).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-black text-slate-950">
                  <span>Declarado en Caja:</span>
                  <span>${(selectedZReportSession.closeCash !== undefined ? selectedZReportSession.closeCash : (selectedZReportSession.actualCash || 0)).toLocaleString('es-AR')}</span>
                </div>
                {(() => {
                  const exp = selectedZReportSession.expectedCash !== undefined 
                    ? selectedZReportSession.expectedCash 
                    : ((selectedZReportSession.initialCash || 0) + (selectedZReportSession.salesByMethod?.['Efectivo'] || 0));
                  const decl = selectedZReportSession.closeCash !== undefined ? selectedZReportSession.closeCash : (selectedZReportSession.actualCash || 0);
                  const diff = selectedZReportSession.difference !== undefined ? selectedZReportSession.difference : (decl - exp);

                  return (
                    <div className={`flex justify-between font-extrabold pt-1 border-t border-slate-200 ${diff === 0 ? 'text-emerald-700' : diff > 0 ? 'text-blue-700' : 'text-rose-700'}`}>
                      <span>Diferencia:</span>
                      <span>{diff === 0 ? '$0 (OK)' : diff > 0 ? `+$${diff.toLocaleString('es-AR')}` : `-$${Math.abs(diff).toLocaleString('es-AR')}`}</span>
                    </div>
                  );
                })()}
              </div>

              {selectedZReportSession.notes && (
                <div className="mt-2 text-[10px] text-slate-600 italic border-t border-slate-200 pt-1">
                  Obs: {selectedZReportSession.notes}
                </div>
              )}

              {/* Signature placeholder */}
              <div className="mt-6 pt-4 border-t border-dashed border-slate-300 text-center text-[9px] text-slate-400">
                ______________________________________
                <p className="mt-1 font-bold text-slate-600">Firma del Responsable de Turno</p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 w-full mt-4">
              <a
                href={`https://wa.me/?text=MAX24%20Z-REPORT%20CIERRE%20DE%20CAJA%0AComercio%3A%20${encodeURIComponent(storeSettings?.name || 'MAX24')}%0ACajero%3A%20${encodeURIComponent(selectedZReportSession.employeeName)}%0ATurno%3A%20${encodeURIComponent(selectedZReportSession.shift || 'General')}%0ATotal%20Ventas%3A%20%24${selectedZReportSession.salesTotal}%0AEfectivo%20Declarado%3A%20%24${selectedZReportSession.closeCash}%0ADiferencia%3A%20%24${selectedZReportSession.difference || 0}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                WhatsApp
              </a>

              <button
                type="button"
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* RECEIPT DETAILED DRAWER POPUP FOR INDIVIDUAL SALES            */}
      {/* ------------------------------------------------------------- */}
      {selectedHistoricalSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-100 rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative flex flex-col items-center">
            
            <button
              type="button"
              onClick={() => setSelectedHistoricalSale(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-200/50 hover:bg-slate-200 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-slate-800 tracking-tight">Copia de Documento Fiscal</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Solo lectura. No modificable.</p>

            <div className="bg-white p-5 rounded-2xl w-full border border-slate-200 shadow-md flex flex-col font-mono text-[11px] leading-relaxed text-slate-800">
              
              <div className="text-center pb-3 border-b border-dashed border-slate-200 mb-2">
                <h5 className="font-bold text-xs uppercase tracking-wider">{storeSettings?.name || 'MAX24 POS SYSTEM'}</h5>
                <p className="text-[10px] text-slate-500">{storeSettings?.address || 'Calle Comercial 456, Buenos Aires'}</p>
                <div className="my-1.5 text-slate-400">--------------------------</div>
                <div className="flex items-center justify-between text-[9px] text-slate-500 px-1">
                  <span>Re-Impresión ID</span>
                  <span>{selectedHistoricalSale.id}</span>
                </div>
                <p className="text-[9px] text-slate-400 text-left mt-1.5">Fecha: {new Date(selectedHistoricalSale.date).toLocaleString('es-AR')}</p>
              </div>

              <div className="space-y-2 mb-3">
                {selectedHistoricalSale.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between">
                    <span className="pr-1">{item.quantity}x {item.productName}</span>
                    <span className="font-semibold">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-slate-200 pt-2 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span>Subtotal Neto:</span>
                  <span>${selectedHistoricalSale.subtotal.toLocaleString('es-AR')}</span>
                </div>
                {selectedHistoricalSale.discount > 0 && (
                  <div className="flex items-center justify-between text-amber-600">
                    <span>Descuento Aplicado:</span>
                    <span>-${selectedHistoricalSale.discount.toLocaleString('es-AR')}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-slate-400 text-[10px]">
                  <span>Monto IVA (21%):</span>
                  <span>${(selectedHistoricalSale.tax ?? 0).toLocaleString('es-AR')}</span>
                </div>
                <div className="flex items-center justify-between font-bold text-slate-950 pt-1.5 border-t border-slate-100">
                  <span>Total Neto:</span>
                  <span>${selectedHistoricalSale.total.toLocaleString('es-AR')}</span>
                </div>
              </div>

              <div className="mt-3 bg-slate-50 p-2 rounded-lg border border-slate-150/40 text-[10px]">
                <div className="flex items-center justify-between">
                  <span>Método Pago:</span>
                  <span className="font-semibold">{selectedHistoricalSale.paymentMethod}</span>
                </div>
                {selectedHistoricalSale.paymentMethod === 'Efectivo' && (
                  <>
                    <div className="flex items-center justify-between mt-0.5">
                      <span>Monto Entregado:</span>
                      <span>${(selectedHistoricalSale.cashReceived || 0).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5 text-emerald-800 font-bold">
                      <span>Monto Vuelto:</span>
                      <span>${(selectedHistoricalSale.change || 0).toLocaleString('es-AR')}</span>
                    </div>
                  </>
                )}
                <div className="flex items-center justify-between mt-1 text-[9px] text-slate-400 border-t border-slate-200 pt-1 font-sans">
                  <span>Cajero titular:</span>
                  <span>{selectedHistoricalSale.sellerName}</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                window.print();
              }}
              className="mt-4 w-full py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Duplicado
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
