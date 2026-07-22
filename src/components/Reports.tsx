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
  ShieldAlert
} from 'lucide-react';
import { Sale, Product, StoreSettings } from '../types';
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
  activeStoreEmail
}: ReportsProps) {
  const sales = useMemo(() => rawSales.filter(s => !s.isPracticeMode), [rawSales]);
  const products = useMemo(() => rawProducts.filter(p => !p.isPracticeMode), [rawProducts]);

  const [salesSearch, setSalesSearch] = useState('');
  const [selectedHistoricalSale, setSelectedHistoricalSale] = useState<Sale | null>(null);

  // Double confirmation modals state
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

  // General calculated metrics
  const summaryStats = useMemo(() => {
    const count = sales.length;
    if (count === 0) {
      return { totalRevenue: 0, totalItemsSold: 0, averageTicket: 0, estimatedProfit: 0 };
    }

    const totalRevenue = sales.reduce((acc, s) => acc + s.total, 0);
    const averageTicket = Math.round(totalRevenue / count);

    // Calculate profit: Product sale price - cost value of registered items sold
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
          // Apply proportion of sale discount if any
          const discountProportion = sale.subtotal > 0 ? (sale.discount / sale.subtotal) : 0;
          const discountedRevenue = itemRevenue - (itemRevenue * discountProportion);
          estimatedProfit += (discountedRevenue - itemCost);
        } else if (foodMatch) {
          // Use food cost if set, or calculate based on margin percent or default
          const costPerUnit = foodMatch.cost !== undefined 
            ? foodMatch.cost 
            : (foodMatch.margin !== undefined ? foodMatch.price * (1 - foodMatch.margin / 100) : foodMatch.price * 0.4);
          const itemCost = costPerUnit * item.quantity;
          const itemRevenue = item.price * item.quantity;
          // Apply proportion of sale discount if any
          const discountProportion = sale.subtotal > 0 ? (sale.discount / sale.subtotal) : 0;
          const discountedRevenue = itemRevenue - (itemRevenue * discountProportion);
          estimatedProfit += (discountedRevenue - itemCost);
        } else {
          // Fallback if product deleted: assume 30% margin default
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

  // Aggregate Sales by date for custom SVG Area/Line Charting
  const chartData = useMemo(() => {
    const datesMap: { [date: string]: number } = {};
    
    sales.forEach(sale => {
      // Format as YYYY-MM-DD
      const dateStr = new Date(sale.date).toISOString().split('T')[0];
      datesMap[dateStr] = (datesMap[dateStr] || 0) + sale.total;
    });

    // Make sure we sort dates
    const sortedDates = Object.keys(datesMap).sort();
    
    // Fallback if very few dates, populate standard sequence to make chart look alive
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

  // Max value in chart data for layout scaling
  const maxChartVal = useMemo(() => {
    const vals = chartData.map(d => d.amount);
    return vals.length > 0 ? Math.max(...vals, 1000) : 10000;
  }, [chartData]);

  // Category popular share analysis ranking list
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

  // Filtered list of history sales
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const matchId = s.id.toLowerCase().includes(salesSearch.toLowerCase());
      const matchSeller = s.sellerName.toLowerCase().includes(salesSearch.toLowerCase());
      const matchMethod = s.paymentMethod.toLowerCase().includes(salesSearch.toLowerCase());
      return matchId || matchSeller || matchMethod;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales, salesSearch]);

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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xxs">
        <div className="space-y-1">
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-emerald-500 w-5 h-5 animate-pulse" />
            Reportes e Historial del Comercio
          </h2>
          <p className="text-xs text-slate-400">
            Analiza las transacciones del mostrador, márgenes de ganancia netos y métricas de desempeño financiero.
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
              <RotateCcw className="w-5 h-5 text-amber-500 animate-spin-slow" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-100">Copia de Seguridad de Reporte Disponible</h4>
              <p className="text-xs text-slate-405 leading-normal max-w-xl">
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

      {/* 4 Cards main stats summaries row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Facturación Total</span>
          </div>
          <h3 className="text-2xl font-sans font-black text-slate-800 leading-tight font-mono">
            ${summaryStats.totalRevenue.toLocaleString('es-AR')}
          </h3>
          <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1 font-semibold">
            <TrendingUp className="w-3 h-3" />
            <span>Monto bruto acumulado</span>
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="p-2.5 rounded-xl bg-violet-50 text-violet-600">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Ganancia Estimada</span>
          </div>
          <h3 className="text-2xl font-sans font-black text-slate-800 leading-tight font-mono">
            ${summaryStats.estimatedProfit.toLocaleString('es-AR')}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Restando costos de compra asignados
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Ticket Promedio</span>
          </div>
          <h3 className="text-2xl font-sans font-black text-slate-800 leading-tight font-mono">
            ${summaryStats.averageTicket.toLocaleString('es-AR')}
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Monto de ingreso promedio por venta
          </p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs">
          <div className="flex items-center gap-3.5 mb-2">
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-500">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-500">Cant. Artículos Vendidos</span>
          </div>
          <h3 className="text-2xl font-sans font-black text-slate-800 leading-tight font-mono">
            {summaryStats.totalItemsSold} u.
          </h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Unidades físicas entregadas total
          </p>
        </div>

      </div>

      {/* Balance de Utilidad Real / Estado de Resultados */}
      {(() => {
        const totalFixedCosts = storeSettings?.fixedCosts 
          ? storeSettings.fixedCosts.reduce((acc, fc) => acc + (fc.amount || 0), 0)
          : 0;
        
        // Ventas Totales
        const totalSales = summaryStats.totalRevenue;
        // Costos Variables (Mercadería vendida)
        // estimatedProfit is (discounted item revenue - item purchase cost).
        // So the purchase cost of the goods sold is roughly: totalSales - estimatedProfit
        const costOfGoodsSold = Math.max(0, totalSales - summaryStats.estimatedProfit);
        const grossProfit = summaryStats.estimatedProfit;
        const netProfit = grossProfit - totalFixedCosts;
        const hasProfit = netProfit >= 0;

        return (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden font-sans">
            {/* Visual background accents */}
            <div className={`absolute top-0 right-0 w-[400px] h-[400px] blur-[120px] rounded-full opacity-10 pointer-events-none -translate-y-1/2 translate-x-1/3 ${hasProfit ? 'bg-emerald-500' : 'bg-rose-500'}`} />
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
              <div className="space-y-2 max-w-xl text-left">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${hasProfit ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/15 text-rose-400 border border-rose-500/20'}`}>
                    {hasProfit ? 'Balance con Superávit' : 'Balance con Déficit'}
                  </span>
                  <span className="text-slate-450 text-[10px] font-mono font-bold">Fórmula: Ganancia Real = Ventas - Costos Variables - Costos Fijos</span>
                </div>
                <h3 className="text-xl font-black text-slate-100 tracking-tight">Estado de Resultados & Ganancia Real</h3>
                <p className="text-xs text-slate-400 leading-relaxed font-sans">
                  Balance financiero real del comercio, deduciendo costos variables (compra de mercadería vendida en el mostrador) y los costos fijos de mantenimiento.
                </p>
              </div>

              {/* Big Profit/Loss Display */}
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

            {/* Financial Breakdown Table Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 relative z-10 text-left font-sans">
              
              <div className="p-4 bg-slate-950/20 border border-slate-800/50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">1. Ventas Totales (+)</span>
                <p className="text-lg font-black text-slate-100 font-mono">${totalSales.toLocaleString('es-AR')}</p>
                <p className="text-[10px] text-slate-500 font-sans">Facturación bruta del período</p>
              </div>

              <div className="p-4 bg-slate-950/20 border border-slate-800/50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">2. Costos Variables (-)</span>
                <p className="text-lg font-black text-slate-100 font-mono">${costOfGoodsSold.toLocaleString('es-AR')}</p>
                <p className="text-[10px] text-slate-500 font-sans font-sans">Costo de mercadería vendida</p>
              </div>

              <div className="p-4 bg-slate-950/20 border border-slate-800/50 rounded-2xl space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">3. Costos Fijos (-)</span>
                <p className="text-lg font-black text-slate-100 font-mono">${totalFixedCosts.toLocaleString('es-AR')}</p>
                <p className="text-[10px] text-slate-500 font-sans font-sans">Alquiler, servicios, sueldos, etc.</p>
              </div>

              <div className={`p-4 rounded-2xl space-y-1 border ${hasProfit ? 'bg-emerald-950/15 border-emerald-500/20' : 'bg-rose-950/15 border-rose-500/20'}`}>
                <span className="text-[10px] font-black uppercase tracking-wider font-mono text-slate-400">4. Resultado Neto (=)</span>
                <p className={`text-lg font-black font-mono ${hasProfit ? 'text-emerald-400' : 'text-rose-400'}`}>
                  ${netProfit.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-slate-500 font-sans font-sans">Margen de ganancia neto real</p>
              </div>

            </div>

            {/* List of active fixed costs configured */}
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

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Chart column 1: Daily Revenue Trend line SVG */}
        <div className="lg:col-span-8 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <LineChart className="text-emerald-500 w-4.5 h-4.5" />
                Historial de Ventas Diarias
              </h3>
              <p className="text-[11px] text-slate-400">Evolución monetaria de ingresos por día de atención</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 px-3 py-1 rounded-xl text-[10px] font-bold text-slate-600 font-sans">
              Dynamic Live Chart
            </div>
          </div>

          {/* Clean Custom animated curve area vector graphing */}
          <div className="h-[280px] w-full pt-4 flex flex-col justify-between relative select-none">
            {/* SVG Plot */}
            <div className="w-full h-[220px] relative">
              {/* Horizontal dotted grid line markers */}
              {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
                <div 
                  key={i} 
                  className="absolute left-0 right-0 border-t border-dashed border-slate-100 flex items-center justify-between text-[9px] text-slate-400 font-mono"
                  style={{ top: `${p * 200}px` }}
                >
                  <span className="bg-white/85 pr-1.5">${Math.round(maxChartVal - (p * maxChartVal)).toLocaleString('es-AR')}</span>
                </div>
              ))}

              {/* Drawing vector Path line */}
              {chartData.length > 0 && (
                <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
                  {/* Gradient definition */}
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Build custom polygon area under line */}
                  <polygon
                    fill="url(#chartGrad)"
                    points={`
                      0,200
                      ${chartData.map((d, index) => {
                        const x = (index / (chartData.length - 1)) * 500;
                        const y = 200 - ((d.amount / maxChartVal) * 160 + 20); // Scale keeping margins
                        return `${x},${y}`;
                      }).join(' ')}
                      500,200
                    `}
                  />

                  {/* Outline curve path lines */}
                  <polyline
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    points={chartData.map((d, index) => {
                      const x = (index / (chartData.length - 1)) * 500;
                      const y = 200 - ((d.amount / maxChartVal) * 160 + 20);
                      return `${x},${y}`;
                    }).join(' ')}
                  />

                  {/* Bullet Interactive dots */}
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
                        stroke="#059669"
                        strokeWidth="3"
                        title={`${d.date}: $${d.amount}`}
                        className="cursor-pointer hover:r-7 transition-all"
                      />
                    );
                  })}
                </svg>
              )}
            </div>

            {/* X Axis dates labels progress */}
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

        {/* Chart column 2: Category Shares bars progress */}
        <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="text-emerald-500 w-4.5 h-4.5" />
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
                  {/* Tailwind native progress track bars with sleek animated fill */}
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 shadow-xxs">
                    <div 
                      className={`h-full rounded-full transition-all duration-500
                        ${idx === 0 ? 'bg-emerald-500' : ''}
                        ${idx === 1 ? 'bg-indigo-500' : ''}
                        ${idx === 2 ? 'bg-violet-500' : ''}
                        ${idx === 3 ? 'bg-amber-500' : ''}
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
            💡 <strong>Sugerencia comercial:</strong> El rubro prioritario representa el {categorySales[0]?.percentage || 0}% de tus ingresos totales. Enfoca promociones allí.
          </div>
        </div>

      </div>

      {/* Sales Historical list log and datatable query */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        
        {/* Filter log header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Historial Diario de Transacciones</h3>
            <p className="text-xs text-slate-400">Busca, analiza y re-emite facturas o tickets registrados previamente</p>
          </div>

          <div className="w-full md:max-w-xs relative text-xs">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              placeholder="Filtro ID, cajero, método de pago..."
              value={salesSearch}
              onChange={(e) => setSalesSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Datatable */}
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
              {filteredSales.map((sale) => {
                const totalItems = sale.items.reduce((acc, i) => acc + i.quantity, 0);

                return (
                  <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* ID */}
                    <td className="py-3 px-4">
                      <span className="font-mono font-extrabold text-slate-900 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100 text-[11px]">
                        {sale.id}
                      </span>
                    </td>

                    {/* DateTime */}
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {new Date(sale.date).toLocaleString('es-AR')}
                    </td>

                    {/* Quantity volume */}
                    <td className="py-3 px-4 text-center font-bold text-slate-800">
                      {totalItems} u.
                    </td>

                    {/* Total billing price */}
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                      ${sale.total.toLocaleString('es-AR')}
                    </td>

                    {/* Method container card */}
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-slate-150/60 text-slate-600 px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px]">
                        {sale.paymentMethod === 'Efectivo' ? '💵' : sale.paymentMethod === 'Cuenta Corriente' ? '🤝' : '💳'} {sale.paymentMethod}
                      </span>
                    </td>

                    {/* Operator */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-650">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{sale.sellerName}</span>
                      </div>
                    </td>

                    {/* Dynamic inspect row */}
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => setSelectedHistoricalSale(sale)}
                        className="inline-flex items-center gap-1.5 font-bold text-emerald-600 hover:text-emerald-700 font-sans cursor-pointer py-1 px-2.5 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver Recibo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECEIPT DETAILED DRAWER POPUP */}
      {selectedHistoricalSale && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-slate-100 rounded-3xl p-6 max-w-sm w-full border border-slate-200 shadow-2xl relative flex flex-col items-center">
            
            <button
              onClick={() => setSelectedHistoricalSale(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-200/50 hover:bg-slate-200 rounded-full"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h4 className="text-base font-extrabold text-slate-800 tracking-tight">Copia de Documento Fiscal</h4>
            <p className="text-[11px] text-slate-400 mt-0.5 mb-4">Solo lectura. No modificable.</p>

            {/* Thermal ticket replica */}
            <div className="bg-white p-5 rounded-2xl w-full border border-slate-200 shadow-md flex flex-col font-mono text-[11px] leading-relaxed text-slate-800">
              
              <div className="text-center pb-3 border-b border-dashed border-slate-200 mb-2">
                <h5 className="font-bold text-xs uppercase tracking-wider">STOREPOS SYSTEM</h5>
                <p className="text-[10px] text-slate-500">Calle Comercial 456, Buenos Aires</p>
                <div className="my-1.5 text-slate-400">--------------------------</div>
                <div className="flex items-center justify-between text-[9px] text-slate-500 px-1">
                  <span>Re-Impresión ID</span>
                  <span>{selectedHistoricalSale.id}</span>
                </div>
                <p className="text-[9px] text-slate-400 text-left mt-1.5">Fecha: {new Date(selectedHistoricalSale.date).toLocaleString('es-AR')}</p>
              </div>

              {/* Items listing */}
              <div className="space-y-2 mb-3">
                {selectedHistoricalSale.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between">
                    <span className="pr-1">{item.quantity}x {item.productName}</span>
                    <span className="font-semibold">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                  </div>
                ))}
              </div>

              {/* Subtotal, discounts, total details */}
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
              onClick={() => {
                window.print();
              }}
              className="mt-4 w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 cursor-pointer"
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
