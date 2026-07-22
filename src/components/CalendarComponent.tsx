import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  AlertCircle, 
  PiggyBank, 
  Truck, 
  Gift, 
  Sparkles, 
  CalendarDays, 
  Edit2, 
  Check, 
  X,
  Store,
  Tag,
  Info,
  ChevronUp
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { CalendarEvent, Product, Supplier, Employee } from '../types';

interface CalendarProps {
  currentUser: Employee | null;
  activeStoreEmail: string;
  products: Product[];
  suppliers: Supplier[];
}

const CATEGORY_STYLES = {
  alquiler: {
    bg: 'bg-rose-50 border-rose-200 text-rose-700',
    dot: 'bg-rose-500',
    icon: PiggyBank,
    label: 'Alquiler / Gastos Fijos',
    badge: 'bg-rose-500 text-white hover:bg-rose-600',
  },
  proveedor: {
    bg: 'bg-amber-50 border-amber-200 text-amber-700',
    dot: 'bg-amber-500',
    icon: Truck,
    label: 'Pago a Proveedor',
    badge: 'bg-amber-500 text-white hover:bg-amber-600',
  },
  festivo: {
    bg: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    dot: 'bg-indigo-500',
    icon: Gift,
    label: 'Día Festivo / Celebración',
    badge: 'bg-indigo-500 text-white hover:bg-indigo-600',
  },
  oferta: {
    bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
    dot: 'bg-emerald-500',
    icon: Sparkles,
    label: 'Oferta Especial / Promo',
    badge: 'bg-emerald-500 text-white hover:bg-emerald-600',
  },
  otro: {
    bg: 'bg-slate-50 border-slate-200 text-slate-700',
    dot: 'bg-slate-500',
    icon: CalendarDays,
    label: 'Otro Recordatorio',
    badge: 'bg-slate-600 text-white hover:bg-slate-700',
  }
};

const LATAM_HOLIDAYS_PRESETS = [
  { title: 'Año Nuevo 🎉', category: 'festivo' as const, date: '-01-01', description: 'Inicio de año. Planificar ofertas especiales para bebidas y comidas al paso.' },
  { title: 'San Valentín ❤️', category: 'festivo' as const, date: '-02-14', description: 'Día de los enamorados. Ideal para lanzar ofertas de chocolates, flores y vinos.' },
  { title: 'Día del Trabajador 👷', category: 'festivo' as const, date: '-05-01', description: 'Feriado nacional. El comercio puede ajustar sus horarios o lanzar ofertas tempranas.' },
  { title: 'Día de la Patria 🇦🇷', category: 'festivo' as const, date: '-05-25', description: 'Revolución de Mayo. Tradición de comer locro, empanadas y pastelitos.' },
  { title: 'Día del Padre 👨', category: 'festivo' as const, date: '-06-21', description: 'Planificar promociones especiales para el regalo de papá: licores, snacks premium, tabaco.' },
  { title: 'Día del Amigo 🤝', category: 'festivo' as const, date: '-07-20', description: '¡Día de juntadas! Alta demanda de cervezas, papas fritas y picadas.' },
  { title: 'Día de las Infancias 🧒', category: 'festivo' as const, date: '-08-16', description: 'Día del Niño. Lanzar combos de golosinas y juguetes.' },
  { title: 'Día de la Madre 👩', category: 'festivo' as const, date: '-10-18', description: '¡Una de las fechas comerciales más importantes! Promociones especiales y combos de regalo.' },
  { title: 'Navidad 🎄', category: 'festivo' as const, date: '-12-25', description: 'Fiestas de fin de año. Venta de pan dulce, sidra, turrones y combos navideños.' },
  { title: 'Fin de Año 🌟', category: 'festivo' as const, date: '-12-31', description: 'Preparativos para la noche de año nuevo.' }
];

export default function CalendarComponent({ 
  currentUser, 
  activeStoreEmail,
  products,
  suppliers
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);

  // Form states
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<CalendarEvent['category']>('otro');
  const [formDate, setFormDate] = useState('');
  
  // Dynamic fields
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [promoPrice, setPromoPrice] = useState('');

  // Loading and alerts
  const [loading, setLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState('');

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Subscribe to real-time calendar updates in Firestore
  useEffect(() => {
    if (!activeStoreEmail || activeStoreEmail === 'global') return;

    setLoading(true);
    const colRef = collection(db, 'storeSettings', activeStoreEmail, 'calendarEvents');
    
    const unsubscribe = onSnapshot(colRef, (snapshot) => {
      const fetchedEvents: CalendarEvent[] = [];
      snapshot.forEach((snapDoc) => {
        fetchedEvents.push({ id: snapDoc.id, ...snapDoc.data() } as CalendarEvent);
      });
      // Sort events chronologically
      fetchedEvents.sort((a, b) => a.date.localeCompare(b.date));
      setEvents(fetchedEvents);
      setLoading(false);
    }, (error) => {
      console.error("Error loading calendar events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeStoreEmail]);

  // Handle month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayClick = (dayStr: string) => {
    setSelectedDateStr(dayStr);
  };

  // Generate days in monthly grid (starting on Monday)
  const generateGridDays = () => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // Sunday=0, Monday=1
    const adjustedFirstDay = firstDayIndex === 0 ? 6 : firstDayIndex - 1; // Adjust Monday to index 0
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDays = new Date(year, month, 0).getDate();

    const days = [];

    // Prior month overflow days
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonthObj = month === 0 ? 11 : month - 1;
      const prevYearObj = month === 0 ? year - 1 : year;
      const dateStr = `${prevYearObj}-${String(prevMonthObj + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, dateStr });
    }

    // Active month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: true, dateStr });
    }

    // Next month overflow days to keep the grid perfectly square (6 rows * 7 columns)
    const totalCells = 42;
    const remainingCells = totalCells - days.length;
    for (let d = 1; d <= remainingCells; d++) {
      const nextMonthObj = month === 11 ? 0 : month + 1;
      const nextYearObj = month === 11 ? year + 1 : year;
      const dateStr = `${nextYearObj}-${String(nextMonthObj + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, dateStr });
    }

    return days;
  };

  // Auto-populate preset Argentinean/Latam Holidays if calendar is empty
  const handleLoadPresets = async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const promises = LATAM_HOLIDAYS_PRESETS.map(preset => {
        const id = `preset-${preset.category}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        // Holiday date is created for the current year
        const formattedDate = `${year}${preset.date}`;
        const newEvent: CalendarEvent = {
          id,
          title: preset.title,
          description: preset.description,
          date: formattedDate,
          category: preset.category,
          createdBy: 'Sistema Inteligente MAX24',
          storeEmail: activeStoreEmail,
          createdAt: new Date().toISOString()
        };
        const docRef = doc(db, 'storeSettings', activeStoreEmail, 'calendarEvents', id);
        return setDoc(docRef, newEvent);
      });
      await Promise.all(promises);
      triggerNotification('¡Calendario Comercial y de Días Festivos cargado con éxito!');
    } catch (err) {
      console.error("Error loading presets:", err);
    } finally {
      setLoading(false);
    }
  };

  const triggerNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 3000);
  };

  // Open Add Modal
  const openAddModal = (dateStr?: string) => {
    const targetDate = dateStr || selectedDateStr;
    setFormDate(targetDate);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('otro');
    setSelectedSupplierId('');
    setSelectedProductId('');
    setPromoPrice('');
    setIsAddModalOpen(true);
  };

  // React to category shifts during create
  useEffect(() => {
    if (formCategory === 'proveedor' && suppliers.length > 0) {
      const firstSup = suppliers[0];
      setSelectedSupplierId(firstSup.id);
      setFormTitle(`Pago a proveedor: ${firstSup.name}`);
    } else if (formCategory === 'alquiler') {
      setFormTitle('Pago de Alquiler / Gastos Fijos 💰');
    } else if (formCategory === 'oferta' && products.length > 0) {
      const firstProd = products[0];
      setSelectedProductId(firstProd.id);
      setFormTitle(`Oferta Especial: ${firstProd.name}`);
    } else {
      setFormTitle('');
    }
  }, [formCategory, suppliers, products]);

  // React to dynamic product/promo selections
  const handleProductChange = (prodId: string) => {
    setSelectedProductId(prodId);
    const prod = products.find(p => p.id === prodId);
    if (prod) {
      setFormTitle(`Oferta Especial: ${prod.name} 🏷️`);
      if (promoPrice) {
        setFormTitle(`Oferta Especial: ${prod.name} a $${promoPrice} 🏷️`);
      }
    }
  };

  const handlePromoPriceChange = (price: string) => {
    setPromoPrice(price);
    const prod = products.find(p => p.id === selectedProductId);
    if (prod) {
      if (price) {
        setFormTitle(`Oferta Especial: ${prod.name} a $${price} 🏷️`);
      } else {
        setFormTitle(`Oferta: ${prod.name} 🏷️`);
      }
    }
  };

  const handleSupplierChange = (supId: string) => {
    setSelectedSupplierId(supId);
    const sup = suppliers.find(s => s.id === supId);
    if (sup) {
      setFormTitle(`Pago a proveedor: ${sup.name} 🚚`);
    }
  };

  // Submit create event
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle.trim() || !formDate) return;

    try {
      const id = `evt-${Date.now()}`;
      
      let finalDescription = formDescription.trim();
      if (formCategory === 'oferta' && selectedProductId) {
        const prod = products.find(p => p.id === selectedProductId);
        if (prod) {
          finalDescription = `Promoción planificada para el producto: ${prod.name} (SKU: ${prod.sku}). Precio Regular: $${prod.price}. Precio Promocional: $${promoPrice || 'A definir'}.\n\n${formDescription}`;
        }
      } else if (formCategory === 'proveedor' && selectedSupplierId) {
        const sup = suppliers.find(s => s.id === selectedSupplierId);
        if (sup) {
          finalDescription = `Recordatorio de pago para el distribuidor: ${sup.name}.\nContacto: ${sup.contactName || 'No especificado'} (${sup.phone || '-'})\n\n${formDescription}`;
        }
      }

      const newEvent: CalendarEvent = {
        id,
        title: formTitle.trim(),
        description: finalDescription,
        date: formDate,
        category: formCategory,
        createdBy: currentUser?.name || 'Administrador',
        storeEmail: activeStoreEmail,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'calendarEvents', id), newEvent);
      setIsAddModalOpen(false);
      triggerNotification('¡Recordatorio guardado con éxito en la nube!');
    } catch (err) {
      console.error("Error creating event:", err);
    }
  };

  // Open Edit Modal
  const openEditModal = (evt: CalendarEvent) => {
    setEditingEvent(evt);
    setFormTitle(evt.title);
    setFormDescription(evt.description || '');
    setFormCategory(evt.category);
    setFormDate(evt.date);
    setIsEditModalOpen(true);
  };

  // Submit Edit Event
  const handleUpdateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent || !formTitle.trim() || !formDate) return;

    try {
      const updatedEvent: CalendarEvent = {
        ...editingEvent,
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        date: formDate
      };

      await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'calendarEvents', editingEvent.id), updatedEvent);
      setIsEditModalOpen(false);
      setEditingEvent(null);
      triggerNotification('¡Recordatorio actualizado con éxito!');
    } catch (err) {
      console.error("Error updating event:", err);
    }
  };

  // Delete event
  const handleDeleteEvent = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este recordatorio?')) return;
    try {
      await deleteDoc(doc(db, 'storeSettings', activeStoreEmail, 'calendarEvents', id));
      triggerNotification('¡Recordatorio eliminado!');
    } catch (err) {
      console.error("Error deleting event:", err);
    }
  };

  const gridDays = generateGridDays();
  const selectedDayEvents = events.filter(evt => evt.date === selectedDateStr);
  const selectedDateObject = new Date(selectedDateStr + 'T00:00:00');
  
  const formattedSelectedDate = selectedDateObject.toLocaleDateString('es-AR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="p-4 md:p-6 space-y-6 font-sans bg-slate-50/40 min-h-screen" id="commercial-calendar-dashboard">
      {/* Dynamic Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-orange-100">
        <div>
          <span className="text-[10px] font-black tracking-widest text-orange-600 uppercase">HERRAMIENTA SAAS EXCLUSIVA</span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-6 h-6 text-orange-500" />
            <span>Calendario Comercial Inteligente</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Planifica cobros, pagos de alquiler, facturas de proveedores y días festivos para optimizar tus ofertas de inventario.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {events.length === 0 && !loading && (
            <button
              onClick={handleLoadPresets}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white text-xs font-bold rounded-xl shadow-md shadow-orange-500/10 cursor-pointer flex items-center gap-2 transition-all active:scale-95"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Cargar Calendario Festivo de Argentina / Latam</span>
            </button>
          )}
          <button
            onClick={() => openAddModal()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl cursor-pointer flex items-center gap-2 shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Recordatorio</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="bg-emerald-500 text-white text-xs font-bold px-4 py-3 rounded-xl flex items-center gap-2 shadow-md animate-fade-in">
          <Check className="w-4 h-4" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Calendar Grid */}
        <div className="lg:col-span-8 bg-white border border-slate-150 rounded-3xl p-5 shadow-sm space-y-4">
          {/* Calendar Header Nav */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-800 tracking-tight">
                {monthNames[month]} {year}
              </span>
              <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                {events.length} Eventos totales
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer transition-colors"
                title="Mes Anterior"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1 text-[11px] font-black text-slate-500 hover:text-orange-600 hover:bg-orange-50/50 rounded-lg cursor-pointer"
              >
                Hoy
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 cursor-pointer transition-colors"
                title="Mes Siguiente"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-extrabold text-slate-450 uppercase tracking-widest font-mono py-1">
            {daysOfWeek.map(day => (
              <div key={day}>{day}</div>
            ))}
          </div>

          {/* Days Grid */}
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-400 font-bold">Cargando fechas de Firestore...</p>
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2.5">
              {gridDays.map((dayData, idx) => {
                const dayEvents = events.filter(evt => evt.date === dayData.dateStr);
                const isSelected = dayData.dateStr === selectedDateStr;
                const isToday = dayData.dateStr === new Date().toISOString().split('T')[0];
                
                return (
                  <div
                    key={idx}
                    onClick={() => handleDayClick(dayData.dateStr)}
                    onDoubleClick={() => openAddModal(dayData.dateStr)}
                    className={`
                      min-h-[90px] border rounded-2xl p-2 flex flex-col justify-between transition-all duration-200 cursor-pointer select-none group relative
                      ${dayData.isCurrentMonth ? 'bg-white' : 'bg-slate-50/40 opacity-40'}
                      ${isSelected ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-150 hover:border-slate-300'}
                      ${isToday ? 'shadow-inner' : ''}
                    `}
                  >
                    {/* Day Number Header */}
                    <div className="flex items-center justify-between">
                      <span className={`
                        text-xs font-black font-mono w-6 h-6 flex items-center justify-center rounded-lg
                        ${isToday ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/20' : 'text-slate-700'}
                        ${isSelected && !isToday ? 'bg-slate-900 text-white' : ''}
                      `}>
                        {dayData.day}
                      </span>
                      
                      {dayEvents.length > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 group-hover:scale-125 transition-transform"></span>
                      )}
                    </div>

                    {/* Event indicators listing */}
                    <div className="mt-1.5 space-y-1 overflow-hidden flex-1 flex flex-col justify-end">
                      {dayEvents.slice(0, 2).map(evt => {
                        const style = CATEGORY_STYLES[evt.category];
                        return (
                          <div
                            key={evt.id}
                            className={`px-1.5 py-0.5 rounded-md text-[9px] font-semibold border truncate ${style.bg}`}
                            title={evt.title}
                          >
                            {evt.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] font-mono text-slate-400 font-extrabold text-right">
                          +{dayEvents.length - 2} más
                        </div>
                      )}
                    </div>

                    {/* Quick Add Button on Hover */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openAddModal(dayData.dateStr);
                      }}
                      className="absolute right-2 top-2 p-0.5 bg-slate-900 text-white hover:bg-orange-500 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-150 shadow-sm shrink-0"
                      title="Agregar recordatorio rápido"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Day Details panel */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* Calendar Helper Info */}
          <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl"></div>
            <div className="flex items-start gap-3.5 relative z-10">
              <div className="p-2.5 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-400 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-bold text-orange-400 tracking-widest uppercase">MOTOR SUGERIDOR DE OFERTAS</span>
                <h3 className="font-extrabold text-sm text-white tracking-tight leading-snug">
                  Planifica ofertas por eventos
                </h3>
                <p className="text-[11px] text-slate-300 leading-relaxed font-medium">
                  Crea recordatorios de días festivos populares (como Día del Padre o Día de la Madre) y define ofertas de productos anticipadas para maximizar tus ventas.
                </p>
              </div>
            </div>
          </div>

          {/* Selected Date Card & Events List */}
          <div className="bg-white border border-slate-150 rounded-3xl shadow-sm overflow-hidden flex-1 flex flex-col min-h-[350px]">
            {/* Header */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <span className="text-[9px] font-black text-slate-400 tracking-widest uppercase">FECHA SELECCIONADA</span>
              <h2 className="text-sm font-black text-slate-800 capitalize tracking-tight mt-1">
                {formattedSelectedDate}
              </h2>
            </div>

            {/* List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3 [scrollbar-width:thin] max-h-[400px]">
              {selectedDayEvents.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-3.5">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-150 rounded-2xl flex items-center justify-center text-slate-350">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-700">No hay recordatorios cargados</p>
                    <p className="text-[11px] text-slate-405 leading-relaxed">
                      Haz doble clic en este casillero o presiona el botón para agregar un recordatorio.
                    </p>
                  </div>
                  <button
                    onClick={() => openAddModal(selectedDateStr)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-orange-600 border border-slate-200 hover:border-orange-200 text-[10px] font-extrabold rounded-lg cursor-pointer transition-colors"
                  >
                    + Agregar Recordatorio
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map(evt => {
                    const style = CATEGORY_STYLES[evt.category];
                    const IconComponent = style.icon;
                    return (
                      <div
                        key={evt.id}
                        className="p-4 rounded-2xl border border-slate-150 bg-white hover:shadow-md hover:border-slate-250 transition-all duration-200 space-y-3 text-left"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <div className={`p-2 rounded-xl border shrink-0 ${style.bg}`}>
                              <IconComponent className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">
                                {style.label}
                              </span>
                              <h3 className="text-xs font-black text-slate-800 tracking-tight leading-snug">
                                {evt.title}
                              </h3>
                            </div>
                          </div>
                          
                          {/* Actions panel */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => openEditModal(evt)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                              title="Editar recordatorio"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteEvent(evt.id)}
                              className="p-1 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                              title="Eliminar recordatorio"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {evt.description && (
                          <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                            <p className="text-[11px] text-slate-500 whitespace-pre-line leading-relaxed">
                              {evt.description}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-100/60 pt-2 font-mono">
                          <span>Registrado por: <b>{evt.createdBy}</b></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================
          MODAL: ADD RECORDATORIO
          ======================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-150 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-scale-in text-left">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 mb-5">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Agregar Recordatorio Comercial
                </h3>
                <p className="text-[11px] text-slate-400">
                  Sincronizado en tiempo real para todos los administradores y cajeros.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha planificada</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-orange-500 focus:outline-hidden"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo de Evento</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-orange-500 focus:outline-hidden"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CalendarEvent['category'])}
                  >
                    <option value="otro">Otro recordatorio</option>
                    <option value="alquiler">Alquiler / Gasto Fijo</option>
                    <option value="proveedor">Pago a Proveedor</option>
                    <option value="festivo">Día Festivo / Feriado</option>
                    <option value="oferta">Oferta / Promoción</option>
                  </select>
                </div>
              </div>

              {/* Dynamic Field: PROVEEDOR Selection */}
              {formCategory === 'proveedor' && (
                <div className="space-y-1.5 p-3.5 bg-amber-50/50 border border-amber-100 rounded-2xl animate-fade-in">
                  <label className="text-[10px] font-black text-amber-700 uppercase tracking-wider">Vincular a Distribuidor / Proveedor</label>
                  {suppliers.length === 0 ? (
                    <p className="text-[11px] text-amber-600 font-semibold">
                      No tienes proveedores registrados. Ve al módulo de Proveedores para crear uno.
                    </p>
                  ) : (
                    <select
                      className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-amber-850 font-semibold"
                      value={selectedSupplierId}
                      onChange={(e) => handleSupplierChange(e.target.value)}
                    >
                      {suppliers.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              {/* Dynamic Field: OFERTA Product Selection */}
              {formCategory === 'oferta' && (
                <div className="space-y-3.5 p-4 bg-emerald-50/40 border border-emerald-100 rounded-2xl animate-fade-in">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Seleccionar Producto del Inventario</label>
                    {products.length === 0 ? (
                      <p className="text-[11px] text-emerald-600 font-semibold">
                        No tienes productos en stock para seleccionar.
                      </p>
                    ) : (
                      <select
                        className="w-full px-3 py-2 bg-white border border-emerald-250 rounded-xl text-xs text-emerald-850 font-semibold"
                        value={selectedProductId}
                        onChange={(e) => handleProductChange(e.target.value)}
                      >
                        {products.map(p => (
                          <option key={p.id} value={p.id}>{p.name} (Reg: ${p.price})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Precio Promocional ($)</label>
                      <input
                        type="number"
                        placeholder="Ej. 1200"
                        className="w-full px-3 py-2 bg-white border border-emerald-250 rounded-xl text-xs text-emerald-850 font-medium"
                        value={promoPrice}
                        onChange={(e) => handlePromoPriceChange(e.target.value)}
                      />
                    </div>
                    <div className="flex items-center justify-center pt-5 text-emerald-600 text-[10px] font-bold">
                      {selectedProductId && products.find(p => p.id === selectedProductId) && (
                        <span>
                          Descuento sugerido: {Math.round(100 - (Number(promoPrice) / (products.find(p => p.id === selectedProductId)?.price || 1)) * 100)}% OFF
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Título del Recordatorio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Comprar sidra y pan dulce para stock"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-orange-500 focus:outline-hidden"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Detalles / Notas Adicionales (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Escribe comentarios de apoyo, plazos, montos estimados, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-orange-500 focus:outline-hidden resize-none"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-orange-500/10"
                >
                  Guardar en la Nube
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: EDIT RECORDATORIO
          ======================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-150 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative animate-scale-in text-left">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingEvent(null);
              }}
              className="absolute top-5 right-5 p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 mb-5">
              <div className="p-2.5 bg-orange-50 text-orange-600 rounded-2xl border border-orange-100">
                <Edit2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 tracking-tight">
                  Editar Recordatorio
                </h3>
                <p className="text-[11px] text-slate-400">
                  Modifica los parámetros de este recordatorio comercial.
                </p>
              </div>
            </div>

            <form onSubmit={handleUpdateEvent} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Date */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Fecha planificada</label>
                  <input
                    type="date"
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-orange-500 focus:outline-hidden"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                  />
                </div>

                {/* Category */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Tipo de Evento</label>
                  <select
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-orange-500 focus:outline-hidden"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value as CalendarEvent['category'])}
                  >
                    <option value="otro">Otro recordatorio</option>
                    <option value="alquiler">Alquiler / Gasto Fijo</option>
                    <option value="proveedor">Pago a Proveedor</option>
                    <option value="festivo">Día Festivo / Feriado</option>
                    <option value="oferta">Oferta / Promoción</option>
                  </select>
                </div>
              </div>

              {/* Title */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Título del Recordatorio</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Comprar sidra y pan dulce para stock"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-orange-500 focus:outline-hidden"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Detalles / Notas Adicionales (Opcional)</label>
                <textarea
                  rows={3}
                  placeholder="Escribe comentarios de apoyo, plazos, montos estimados, etc."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-medium focus:bg-white focus:border-orange-500 focus:outline-hidden resize-none"
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 text-slate-500 hover:bg-slate-50 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-orange-500/10"
                >
                  Actualizar Recordatorio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
