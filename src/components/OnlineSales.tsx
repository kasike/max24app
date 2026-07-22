import React, { useEffect, useState } from 'react';
import { 
  Globe, 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  CreditCard, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Truck, 
  Inbox, 
  Trash2, 
  ShoppingBag,
  Check,
  Search
} from 'lucide-react';
import { db } from '../firebase';
import { collection, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { Sale } from '../types';

interface OnlineSalesProps {
  activeStoreEmail: string;
  sales: Sale[];
  onUpdateSaleStatus?: (saleId: string, status: 'Completado' | 'Pendiente Control' | 'Cancelado') => void;
}

interface OnlineNotification {
  id: string;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  buyerAddress?: string;
  type: string;
  total: number;
  itemsCount: number;
  items: string[];
  date: string;
  paymentStatus: string;
  isRead: boolean;
  saleId?: string;
  orderStatus?: 'Pendiente' | 'En Preparacion' | 'Enviado' | 'Entregado' | 'Cancelado';
}

export default function OnlineSales({ activeStoreEmail, sales, onUpdateSaleStatus }: OnlineSalesProps) {
  const [notifications, setNotifications] = useState<OnlineNotification[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('Todos');

  // Load live notifications from the custom storeNotifications collection
  useEffect(() => {
    if (!activeStoreEmail) return;

    const collectionName = `storeNotifications_${activeStoreEmail}`;
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      const loaded: OnlineNotification[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as any;
        loaded.push({
          id: d.id,
          buyerName: data.buyerName || 'Cliente Anónimo',
          buyerEmail: data.buyerEmail || '',
          buyerPhone: data.buyerPhone || '',
          buyerAddress: data.buyerAddress || 'Domicilio Comprador',
          type: data.type || 'Pedido de Compra Online',
          total: data.total || 0,
          itemsCount: data.itemsCount || 0,
          items: data.items || [],
          date: data.date || new Date().toISOString(),
          paymentStatus: data.paymentStatus || 'Mercado Pago',
          isRead: !!data.isRead,
          saleId: data.saleId || '',
          orderStatus: data.orderStatus || 'Pendiente'
        });
      });
      // Sort newest first
      loaded.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setNotifications(loaded);
    }, (error) => {
      console.warn("Error subscribing to store notifications:", error);
    });

    return () => unsubscribe();
  }, [activeStoreEmail]);

  // Handle marking notification as read
  const handleMarkAsRead = async (notifId: string) => {
    try {
      const notifRef = doc(db, `storeNotifications_${activeStoreEmail}`, notifId);
      await updateDoc(notifRef, { isRead: true });
    } catch (err) {
      console.error("Error updating notification status:", err);
    }
  };

  // Handle changing status of order
  const handleUpdateOrderStatus = async (notif: OnlineNotification, newStatus: any) => {
    try {
      const notifRef = doc(db, `storeNotifications_${activeStoreEmail}`, notif.id);
      await updateDoc(notifRef, { orderStatus: newStatus });

      // If there's an associated sale ID, update its status as well
      if (notif.saleId) {
        const saleRef = doc(db, 'storeSettings', activeStoreEmail, 'sales', notif.saleId);
        let fbSaleStatus: 'Completado' | 'Pendiente Control' | 'Cancelado' = 'Completado';
        if (newStatus === 'Cancelado') {
          fbSaleStatus = 'Cancelado';
        } else if (newStatus === 'Pendiente') {
          fbSaleStatus = 'Pendiente Control';
        }
        await updateDoc(saleRef, { status: fbSaleStatus });
        
        // Notify parent callback if provided
        if (onUpdateSaleStatus) {
          onUpdateSaleStatus(notif.saleId, fbSaleStatus);
        }
      }
    } catch (err) {
      console.error("Error updating order status:", err);
    }
  };

  // Handle deleting notification
  const handleDeleteNotif = async (notifId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar este registro de pedido de la consola?")) return;
    try {
      const notifRef = doc(db, `storeNotifications_${activeStoreEmail}`, notifId);
      await deleteDoc(notifRef);
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // Filter list
  const filteredNotifs = notifications.filter(notif => {
    const q = searchTerm.toLowerCase().trim();
    const matchesSearch = 
      notif.buyerName.toLowerCase().includes(q) || 
      notif.buyerEmail.toLowerCase().includes(q) || 
      notif.buyerPhone.toLowerCase().includes(q) ||
      (notif.buyerAddress && notif.buyerAddress.toLowerCase().includes(q)) ||
      notif.id.toLowerCase().includes(q);

    const matchesStatus = statusFilter === 'Todos' || notif.orderStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalRevenue = notifications
    .filter(n => n.orderStatus !== 'Cancelado')
    .reduce((sum, n) => sum + n.total, 0);
  const pendingCount = notifications.filter(n => n.orderStatus === 'Pendiente' || n.orderStatus === 'En Preparacion').length;
  const shippedCount = notifications.filter(n => n.orderStatus === 'Enviado').length;
  const deliveredCount = notifications.filter(n => n.orderStatus === 'Entregado').length;

  return (
    <div className="space-y-6 font-sans text-left" id="online-sales-dashboard">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Globe className="w-6 h-6 text-orange-500" />
            Consola de Ventas Online
          </h2>
          <p className="text-xs text-slate-500">
            Administra los pedidos entrantes realizados por usuarios desde el portal de compras.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-500 font-semibold">Filtro de Estado:</span>
          {['Todos', 'Pendiente', 'En Preparacion', 'Enviado', 'Entregado', 'Cancelado'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                statusFilter === status 
                  ? 'bg-orange-500 border-orange-500 text-white' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {status === 'En Preparacion' ? 'En Preparación' : status}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-white border border-orange-100 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Ingresos Online</p>
          <p className="text-xl font-black text-slate-900 mt-1">${totalRevenue.toLocaleString('es-AR')}</p>
          <span className="text-[10px] text-emerald-600 font-bold">MercadoPago Aprobado</span>
        </div>

        <div className="p-4 bg-white border border-orange-100 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Pendientes / Preparación</p>
          <p className="text-xl font-black text-amber-600 mt-1">{pendingCount}</p>
          <span className="text-[10px] text-slate-500">Pedidos a despachar</span>
        </div>

        <div className="p-4 bg-white border border-orange-100 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">En camino (Enviados)</p>
          <p className="text-xl font-black text-indigo-600 mt-1">{shippedCount}</p>
          <span className="text-[10px] text-slate-500">En tránsito de delivery</span>
        </div>

        <div className="p-4 bg-white border border-orange-100 rounded-2xl shadow-xs">
          <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">Completados</p>
          <p className="text-xl font-black text-emerald-600 mt-1">{deliveredCount}</p>
          <span className="text-[10px] text-slate-500">Pedidos entregados con éxito</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <span className="absolute left-3 top-3 text-slate-400">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          placeholder="Buscar por cliente, email, teléfono, dirección o ID de pedido..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-orange-500/50"
        />
      </div>

      {/* Order Cards / Lists */}
      {filteredNotifs.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-150 rounded-3xl flex flex-col items-center justify-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-500">
            <Inbox className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No hay pedidos online</h3>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              No se encontraron registros de compras online {statusFilter !== 'Todos' ? `con estado "${statusFilter}"` : ''} en este momento.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredNotifs.map((notif) => {
            const isRead = notif.isRead;
            return (
              <div 
                key={notif.id} 
                onClick={() => {
                  if (!isRead) handleMarkAsRead(notif.id);
                }}
                className={`p-5 bg-white border rounded-3xl shadow-sm transition-all relative overflow-hidden flex flex-col justify-between space-y-4
                  ${!isRead ? 'border-l-4 border-l-orange-500 border-slate-200 bg-orange-50/5' : 'border-slate-200'}
                `}
              >
                {!isRead && (
                  <span className="absolute top-4 right-4 bg-orange-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded-full animate-pulse">
                    NUEVO
                  </span>
                )}

                {/* Header segment with status badges & Date */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-slate-400 font-mono">ID: {notif.id}</span>
                      {notif.saleId && (
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-600 font-bold">Trans: {notif.saleId}</span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-semibold block mt-1">
                      {new Date(notif.date).toLocaleString('es-AR', {
                        day: '2-digit', month: '2-digit', year: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </span>
                  </div>

                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase
                      ${notif.orderStatus === 'Pendiente' ? 'bg-amber-100 text-amber-700 border border-amber-200' : ''}
                      ${notif.orderStatus === 'En Preparacion' ? 'bg-blue-100 text-blue-700 border border-blue-200' : ''}
                      ${notif.orderStatus === 'Enviado' ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : ''}
                      ${notif.orderStatus === 'Entregado' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : ''}
                      ${notif.orderStatus === 'Cancelado' ? 'bg-rose-100 text-rose-700 border border-rose-200' : ''}
                    `}>
                      {notif.orderStatus === 'En Preparacion' ? 'En Preparación' : notif.orderStatus}
                    </span>
                    <span className="text-xs font-mono font-black text-emerald-600">${notif.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                {/* Buyer Information cards */}
                <div className="bg-slate-50 rounded-2xl p-4 space-y-2.5">
                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <User className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-slate-900">{notif.buyerName}</p>
                      <p className="text-[10px] text-slate-450 mt-0.5 flex items-center gap-1.5 font-semibold">
                        <Mail className="w-3 h-3 text-slate-400" /> {notif.buyerEmail}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 text-xs text-slate-700">
                    <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                    <p className="font-semibold">{notif.buyerPhone || 'Sin teléfono'}</p>
                  </div>

                  <div className="flex items-start gap-2.5 text-xs text-slate-700 border-t border-slate-200/60 pt-2.5">
                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-400 font-bold tracking-wider uppercase font-mono">Dirección de Entrega / Envío</p>
                      <p className="font-bold text-slate-900 mt-0.5 leading-tight">{notif.buyerAddress || 'Domicilio Comprador'}</p>
                    </div>
                  </div>
                </div>

                {/* Items list */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Detalle del Pedido</p>
                  <div className="max-h-32 overflow-y-auto bg-white border border-slate-100 rounded-xl p-3 divide-y divide-slate-100 [scrollbar-width:thin]">
                    {notif.items.map((item, idx) => (
                      <p key={idx} className="text-xs text-slate-700 py-1.5 font-bold flex items-center justify-between">
                        <span>{item}</span>
                      </p>
                    ))}
                  </div>
                </div>

                {/* Bottom action panel */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-bold">
                    <CreditCard className="w-4 h-4 text-emerald-500" />
                    <span>Pago: {notif.paymentStatus}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleDeleteNotif(notif.id)}
                      className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Eliminar Pedido"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>

                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                      {[
                        { label: 'Pend.', val: 'Pendiente', color: 'hover:bg-amber-100 hover:text-amber-700' },
                        { label: 'Prep.', val: 'En Preparacion', color: 'hover:bg-blue-100 hover:text-blue-700' },
                        { label: 'Env.', val: 'Enviado', color: 'hover:bg-indigo-100 hover:text-indigo-700' },
                        { label: 'Entr.', val: 'Entregado', color: 'hover:bg-emerald-100 hover:text-emerald-700' }
                      ].map((st) => (
                        <button
                          key={st.val}
                          onClick={() => handleUpdateOrderStatus(notif, st.val)}
                          className={`px-2 py-1 text-[10px] font-black rounded-lg transition-all cursor-pointer
                            ${notif.orderStatus === st.val 
                              ? 'bg-orange-500 text-white shadow-xs' 
                              : `text-slate-500 ${st.color}`
                            }
                          `}
                          title={`Marcar como ${st.val}`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
