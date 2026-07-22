import React, { useState, useMemo, useEffect } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Layers,
  ShoppingBag,
  Clock,
  CheckCircle,
  AlertCircle,
  DollarSign,
  ChevronRight,
  TrendingDown,
  Inbox,
  CreditCard,
  Grid,
  Send,
  Check,
  Ban,
  Sparkles
} from 'lucide-react';
import { Supplier, Product, SupplierPurchase, StoreSettings, SupplierOffer, Employee } from '../types';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, doc } from 'firebase/firestore';

interface SuppliersProps {
  suppliers: Supplier[];
  onAddSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  onUpdateSupplier: (supplier: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  products: Product[];
  supplierPurchases: SupplierPurchase[];
  onAddSupplierPurchase: (purchase: Omit<SupplierPurchase, 'id' | 'storeEmail'>) => Promise<void>;
  storeSettings: StoreSettings;
}

export default function Suppliers({
  suppliers,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  products,
  supplierPurchases,
  onAddSupplierPurchase,
  storeSettings
}: SuppliersProps) {
  const [activeSubTab, setActiveSubTab] = useState<'directory' | 'purchases' | 'offers' | 'search_registered'>('directory');
  const [searchQuery, setSearchQuery] = useState('');

  const [receivedOffers, setReceivedOffers] = useState<SupplierOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);

  // States for platform suppliers (registered in the app)
  const [platformSuppliers, setPlatformSuppliers] = useState<Employee[]>([]);
  const [loadingPlatformSuppliers, setLoadingPlatformSuppliers] = useState(false);
  const [platformSearchQuery, setPlatformSearchQuery] = useState('');
  const [selectedProvinceFilter, setSelectedProvinceFilter] = useState('');

  useEffect(() => {
    if (activeSubTab === 'offers') {
      fetchReceivedOffers();
    } else if (activeSubTab === 'search_registered') {
      fetchPlatformSuppliers();
    }
  }, [activeSubTab, storeSettings.email]);

  const fetchPlatformSuppliers = async () => {
    setLoadingPlatformSuppliers(true);
    try {
      const snap = await getDocs(collection(db, 'employees'));
      const list: Employee[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as Employee;
        if (data.role === 'Proveedor') {
          list.push({ ...data, id: doc.id });
        }
      });
      setPlatformSuppliers(list);
    } catch (err) {
      console.error("Error loading registered application suppliers:", err);
    } finally {
      setLoadingPlatformSuppliers(false);
    }
  };

  const fetchReceivedOffers = async () => {
    setLoadingOffers(true);
    try {
      const snap = await getDocs(collection(db, 'supplierOffers'));
      const list: SupplierOffer[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as SupplierOffer;
        // Filter by this store's email address
        if (data.storeEmail === storeSettings.email) {
          list.push(data);
        }
      });
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setReceivedOffers(list);
    } catch (err) {
      console.error("Error loading received supplier offers:", err);
    } finally {
      setLoadingOffers(false);
    }
  };

  const handleUpdateOfferStatus = async (offerId: string, newStatus: 'Aceptado' | 'Rechazado' | 'Leído') => {
    try {
      const ref = doc(db, 'supplierOffers', offerId);
      await updateDoc(ref, { status: newStatus });
      
      setReceivedOffers(prev => prev.map(o => o.id === offerId ? { ...o, status: newStatus } : o));
      alert(`La oferta ahora está en estado "${newStatus}". El proveedor podrá verificarlo en su cuenta.`);
    } catch (err) {
      console.error("Error updating offer status in Firestore:", err);
    }
  };

  // Form Modal toggle states for Suppliers
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);

  // Form Fields for Supplier Directory
  const [formName, setFormName] = useState('');
  const [formContactName, setFormContactName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formAddress, setFormAddress] = useState('');
  const [formTaxId, setFormTaxId] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Form Fields for new merchandise receiving (purchases)
  const [isPurchaseFormOpen, setIsPurchaseFormOpen] = useState(false);
  const [purchaseSupplierId, setPurchaseSupplierId] = useState('');
  const [purchaseDate, setPurchaseDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [purchaseStatus, setPurchaseStatus] = useState<'Pagado' | 'Pendiente'>('Pagado');
  const [purchaseMethod, setPurchaseMethod] = useState<'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Otro'>('Efectivo');
  
  // Selection rows state for items of current purchase
  const [purchaseItems, setPurchaseItems] = useState<{ productId: string; productName: string; quantity: number; cost: number }[]>([]);
  const [selectedItemProductId, setSelectedItemProductId] = useState('');
  const [selectedItemQty, setSelectedItemQty] = useState(1);
  const [selectedItemCost, setSelectedItemCost] = useState(0);

  // Filter supplier listings
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contactName && s.contactName.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.email && s.email.toLowerCase().includes(q)) ||
        (s.address && s.address.toLowerCase().includes(q)) ||
        (s.taxId && s.taxId.includes(q)) ||
        (s.notes && s.notes.toLowerCase().includes(q))
      );
    });
  }, [suppliers, searchQuery]);

  // Handler for directory submissions
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName) {
      alert('El Nombre de la Empresa es obligatorio.');
      return;
    }

    const payload = {
      name: formName,
      contactName: formContactName || undefined,
      phone: formPhone || undefined,
      email: formEmail || undefined,
      address: formAddress || undefined,
      taxId: formTaxId || undefined,
      notes: formNotes || undefined
    };

    if (formMode === 'create') {
      onAddSupplier(payload);
    } else if (formMode === 'edit' && selectedSupplierId) {
      onUpdateSupplier({
        ...payload,
        id: selectedSupplierId
      });
    }

    setIsFormOpen(false);
  };

  // Handler to add item to current Purchase Cart
  const handleAddPurchaseItem = () => {
    if (!selectedItemProductId) {
      alert('Selecciona un producto primero.');
      return;
    }
    const product = products.find(p => p.id === selectedItemProductId);
    if (!product) return;

    // Check if food already in collection
    const existingIdx = purchaseItems.findIndex(i => i.productId === selectedItemProductId);
    if (existingIdx !== -1) {
      const updated = [...purchaseItems];
      updated[existingIdx].quantity += selectedItemQty;
      setPurchaseItems(updated);
    } else {
      setPurchaseItems(prev => [
        ...prev, 
        { 
          productId: selectedItemProductId, 
          productName: product.name, 
          quantity: selectedItemQty, 
          cost: selectedItemCost || product.cost 
        }
      ]);
    }

    // Reset controls
    setSelectedItemProductId('');
    setSelectedItemQty(1);
    setSelectedItemCost(0);
  };

  // Handler for submitting purchase order
  const handleSubmitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseSupplierId) {
      alert('Define el proveedor.');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Agrega al menos un producto a recibir.');
      return;
    }

    const supplierObj = suppliers.find(s => s.id === purchaseSupplierId);
    if (!supplierObj) return;

    const total = purchaseItems.reduce((sum, item) => sum + (item.cost * item.quantity), 0);

    try {
      await onAddSupplierPurchase({
        supplierId: purchaseSupplierId,
        supplierName: supplierObj.name,
        date: purchaseDate,
        items: purchaseItems,
        totalAmount: total,
        paymentStatus: purchaseStatus,
        paymentMethod: purchaseMethod
      });

      // Clear state and close modal
      setIsPurchaseFormOpen(false);
      setPurchaseSupplierId('');
      setPurchaseItems([]);
      alert('¡Orden de compra guardada! El stock de los productos recibidos se actualizó automáticamente.');
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error guardando la orden de compra.');
    }
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedSupplierId(null);
    setFormName('');
    setFormContactName('');
    setFormPhone('');
    setFormEmail('');
    setFormAddress('');
    setFormTaxId('');
    setFormNotes('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (s: Supplier) => {
    setFormMode('edit');
    setSelectedSupplierId(s.id);
    setFormName(s.name);
    setFormContactName(s.contactName || '');
    setFormPhone(s.phone || '');
    setFormEmail(s.email || '');
    setFormAddress(s.address || '');
    setFormTaxId(s.taxId || '');
    setFormNotes(s.notes || '');
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-6 text-left font-sans" id="suppliers-module">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 leading-none">
            <Building2 className="w-6 h-6 text-orange-500" />
            Proveedores & Mercancías
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 font-sans">
            Registra tus proveedores de mercadería y gestiona las compras recibidas para actualizar stock automáticamente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeSubTab === 'directory' && (
            <button
              onClick={handleOpenCreate}
              className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/15 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Registrar Proveedor
            </button>
          )}
          {activeSubTab === 'purchases' && (
            <button
              onClick={() => {
                setPurchaseItems([]);
                setIsPurchaseFormOpen(true);
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/15 cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nueva Recepción de Stock
            </button>
          )}
        </div>
      </div>

      {/* Sub tabs switcher */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveSubTab('directory')}
          className={`px-4.5 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors
            ${activeSubTab === 'directory' 
              ? 'border-orange-500 text-orange-600 font-extrabold bg-orange-50/10' 
              : 'border-transparent text-slate-550 hover:text-slate-800'}
          `}
        >
          Directorio de Proveedores
        </button>
        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`px-4.5 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors
            ${activeSubTab === 'purchases' 
              ? 'border-orange-500 text-orange-600 font-extrabold bg-orange-50/10' 
              : 'border-transparent text-slate-550 hover:text-slate-800'}
          `}
        >
          Compras y Entradas de Stock ({supplierPurchases.length})
        </button>
        <button
          onClick={() => setActiveSubTab('offers')}
          className={`px-4.5 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors
            ${activeSubTab === 'offers' 
              ? 'border-orange-500 text-orange-600 font-extrabold bg-orange-50/10' 
              : 'border-transparent text-slate-550 hover:text-slate-800'}
          `}
        >
          Ofertas Recibidas de Zona ({receivedOffers.length})
        </button>
        <button
          onClick={() => setActiveSubTab('search_registered')}
          className={`px-4.5 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors 
            ${activeSubTab === 'search_registered' 
              ? 'border-orange-500 text-orange-600 font-extrabold bg-orange-50/10' 
              : 'border-transparent text-slate-550 hover:text-slate-800'}
          `}
        >
          🔍 Buscar Proveedores Registrados
        </button>
      </div>

      {activeSubTab === 'directory' && (
        <div className="space-y-6" id="suppliers-directory-subtab">
          {/* Search filters panel */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xxs">
            <div className="relative w-full">
              <span className="absolute left-3.5 top-3 text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Buscar por distribuidora, chofer, email, número de contacto..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
              />
            </div>
          </div>

          {/* Grid of suppliers */}
          {filteredSuppliers.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
              <Building2 className="w-10 h-10 text-slate-200 mx-auto" strokeWidth={1.5} />
              <p className="text-xs font-bold text-slate-500 font-sans">No se encontraron proveedores de mercadería.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5" id="suppliers-grid">
              {filteredSuppliers.map((supplier) => (
                <div 
                  key={supplier.id} 
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xxs flex flex-col justify-between hover:shadow-xs transition-shadow text-left space-y-4"
                >
                  <div>
                    {/* Header branding block */}
                    <div className="flex items-start justify-between gap-2.5 pb-3 border-b border-slate-100">
                      <div className="min-w-0">
                        <h3 className="font-sans font-black text-slate-850 text-sm leading-tight truncate">
                          {supplier.name}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold tracking-wide uppercase mt-1">
                          {supplier.contactName ? `Repr: ${supplier.contactName}` : 'Chofer No Definido'}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          onClick={() => handleOpenEdit(supplier)}
                          className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-800 rounded-lg transition-colors cursor-pointer"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Eliminar permanently a ${supplier.name}? Esto no afectará tu stock existente.`)) {
                              onDeleteSupplier(supplier.id);
                            }
                          }}
                          className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Main info parameters row */}
                    <div className="pt-3.5 space-y-2 text-xs text-slate-550">
                      {supplier.phone && (
                        <p className="flex items-center gap-2">
                          <Phone className="w-3.5 h-3.5 text-slate-400 expand-0 shrink-0" />
                          <span className="font-mono font-bold">{supplier.phone}</span>
                        </p>
                      )}

                      {supplier.email && (
                        <p className="flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate block max-w-[200px]">{supplier.email}</span>
                        </p>
                      )}

                      {supplier.address && (
                        <p className="flex items-start gap-2">
                          <MapPin className="w-3.5 h-3.5 text-slate-404 shrink-0 mt-0.5" />
                          <span className="leading-tight font-medium">{supplier.address}</span>
                        </p>
                      )}

                      {supplier.taxId && (
                        <p className="flex items-center gap-2">
                          <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="font-mono text-[10px] text-slate-605">CUIT: <strong>{supplier.taxId}</strong></span>
                        </p>
                      )}
                    </div>
                  </div>

                  {supplier.notes && (
                    <div className="pt-2 border-t border-slate-100 bg-slate-50 p-2.5 rounded-xl italic text-[11px] text-slate-500">
                      "{supplier.notes}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'purchases' && (
        <div className="space-y-6" id="suppliers-purchases-subtab">
          
          {/* Purchase History Ledger */}
          {supplierPurchases.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-16 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-200 mx-auto" strokeWidth={1.5} />
              <p className="text-xs font-bold text-slate-500 font-sans">Aún no se ingresaron compras de mercadería.</p>
              <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-normal">
                Haz click en "Nueva Recepción de Stock" para registrar productos comprados, montos de costo pagados a distribuidores, y reposicionar inventario de inmediato.
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {supplierPurchases.map((purchase) => (
                <div 
                  key={purchase.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs text-left flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 leading-none flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider">
                        ORD: {purchase.id}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-medium">{purchase.date}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                        ${purchase.paymentStatus === 'Pagado' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-150' 
                          : 'bg-amber-50 text-amber-700 border-amber-150 animate-pulse'}`}
                      >
                        {purchase.paymentStatus}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1.5 pt-1">
                      <p className="font-extrabold text-slate-800 text-sm">{purchase.supplierName}</p>
                      <p className="font-semibold text-slate-500 block truncate max-w-[480px]">
                        Detalle recibos: {purchase.items.map(item => `${item.quantity}x ${item.productName} (Costo: $${item.cost})`).join(', ')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-100 pt-3.5 md:pt-0">
                    <div className="text-right leading-none shrink-0">
                      <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Medio de Pago</p>
                      <p className="text-xs font-extrabold text-slate-700 mt-1 flex items-center gap-1">
                        <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                        {purchase.paymentMethod}
                      </p>
                    </div>

                    <div className="text-right leading-none shrink-0">
                      <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Total de Compra</p>
                      <p className="text-base font-black text-slate-900 mt-1 font-mono">${purchase.totalAmount.toLocaleString('es-AR')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'offers' && (
        <div className="space-y-6" id="suppliers-offers-subtab">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xxs">
            <div className="pb-3 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black text-slate-800 font-sans">Ofertas y Listas de Precios Recibidas</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Estas son las propuestas directas de distribuidores que operan en tu misma ciudad o provincia. Al aceptarlas, se marca el pedido para contacto directo.
                </p>
              </div>

              <button
                type="button"
                onClick={fetchReceivedOffers}
                className="px-3 py-1 bg-slate-105 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all"
              >
                Refrescar
              </button>
            </div>

            {loadingOffers ? (
              <div className="p-12 text-center text-xs text-slate-405 font-mono">
                Cargando ofertas de zona...
              </div>
            ) : receivedOffers.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Trash2 className="w-10 h-10 text-slate-200 mx-auto" />
                <p className="text-xs font-bold text-slate-500 font-sans">No hay ofertas recibidas en tu zona aún.</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-normal">
                  Los proveedores registrados en tu ubicación aún no han cargado listas de precios para tu correo de comercio ({storeSettings.email}). Las ofertas directas aparecerán aquí en tiempo real.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-4">
                {receivedOffers.map((offer) => (
                  <div key={offer.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-200 transition-all flex flex-col gap-3">
                    <div className="flex flex-col md:flex-row justify-between md:items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-black text-slate-805">{offer.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-mono tracking-wider font-extrabold uppercase ${
                            offer.status === 'Aceptado' 
                              ? 'bg-emerald-100 text-emerald-850 border border-emerald-200' 
                              : offer.status === 'Rechazado' 
                                ? 'bg-red-100 text-red-850 border border-red-200' 
                                : 'bg-orange-100 text-orange-900 border border-orange-200'
                          }`}>
                            {offer.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-650 font-medium">{offer.description}</p>
                        <p className="text-[11px] text-slate-500">
                          Proveedor: <strong className="text-indigo-650">{offer.supplierName}</strong> ({offer.supplierEmail})
                        </p>
                      </div>

                      <div className="text-left md:text-right shrink-0">
                        <span className="block text-[10px] font-mono text-slate-500 font-bold">{offer.date}</span>
                        {offer.status === 'Enviado' && (
                          <div className="flex gap-1.5 mt-2.5">
                            <button
                              type="button"
                              onClick={() => handleUpdateOfferStatus(offer.id, 'Rechazado')}
                              className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg text-[10px] font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                            >
                              <Ban className="w-3 h-3" /> Rechazar
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateOfferStatus(offer.id, 'Aceptado')}
                              className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-xs transition-colors flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" /> Aceptar Oferta
                            </button>
                          </div>
                        )}
                        
                        {offer.status !== 'Enviado' && (
                          <span className="text-[11px] font-mono text-slate-400 block mt-2">
                            Estado finalizado
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Products details list */}
                    <div className="p-3.5 bg-white border border-slate-200 rounded-xl space-y-1">
                      <div className="grid grid-cols-3 gap-2 text-[9px] uppercase font-mono tracking-widest text-slate-400 border-b border-slate-100 pb-1 mb-1.5 font-bold">
                        <div>Producto</div>
                        <div>Precio (ARS)</div>
                        <div className="text-right">Unidad</div>
                      </div>
                      <div className="space-y-1">
                        {offer.productsList.map((prod, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-2 text-xs text-slate-700 py-0.5">
                            <div className="truncate">
                              <span className="font-bold text-slate-800">{prod.productName}</span>
                              {prod.description && <span className="block text-[10px] text-slate-500 truncate">{prod.description}</span>}
                            </div>
                            <div className="text-emerald-600 font-mono font-bold">${prod.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                            <div className="text-right text-slate-500 font-mono">{prod.unit || 'unidades'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'search_registered' && (
        <div className="space-y-6" id="suppliers-platform-subtab">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xxs">
            <div className="pb-3 border-b border-slate-100 flex flex-col md:flex-row justify-between md:items-center gap-3">
              <div>
                <h3 className="text-sm font-black text-slate-800 font-sans flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-indigo-500 animate-pulse" />
                  Buscador de Proveedores Oficiales MAX24
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Descubre proveedores de distribución mayorista registrados en la plataforma. Impulsa tu abastecimiento y agrégalos a tu agenda de compras directa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={fetchPlatformSuppliers}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Actualizar Lista
                </button>
              </div>
            </div>

            {/* Filters bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-4">
              <div className="relative">
                <span className="absolute left-3 top-3.5 text-slate-400">
                  <Search className="w-3.5 h-3.5" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar por Rubro, Empresa, Ciudad o Provincia..."
                  value={platformSearchQuery}
                  onChange={(e) => setPlatformSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>

              <div>
                <select
                  value={selectedProvinceFilter}
                  onChange={(e) => setSelectedProvinceFilter(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                >
                  <option value="">Todas las Provincias / Regiones</option>
                  {Array.from(new Set(platformSuppliers.map(p => p.province).filter(Boolean))).sort().map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end text-[11px] font-mono text-slate-400 font-bold">
                Mostrando {platformSuppliers.filter(p => {
                  const q = platformSearchQuery.toLowerCase().trim();
                  const matchesSearch = !q || (
                    p.name.toLowerCase().includes(q) ||
                    p.email.toLowerCase().includes(q) ||
                    (p.phone && p.phone.toLowerCase().includes(q)) ||
                    (p.city && p.city.toLowerCase().includes(q)) ||
                    (p.province && p.province.toLowerCase().includes(q))
                  );
                  const matchesProvince = !selectedProvinceFilter || p.province === selectedProvinceFilter;
                  return matchesSearch && matchesProvince;
                }).length} proveedor(es) registrado(s)
              </div>
            </div>

            {loadingPlatformSuppliers ? (
              <div className="py-16 text-center text-xs text-slate-400 font-mono">
                Buscando en la base de datos de MAX24...
              </div>
            ) : platformSuppliers.filter(p => {
              const q = platformSearchQuery.toLowerCase().trim();
              const matchesSearch = !q || (
                p.name.toLowerCase().includes(q) ||
                p.email.toLowerCase().includes(q) ||
                (p.phone && p.phone.toLowerCase().includes(q)) ||
                (p.city && p.city.toLowerCase().includes(q)) ||
                (p.province && p.province.toLowerCase().includes(q))
              );
              const matchesProvince = !selectedProvinceFilter || p.province === selectedProvinceFilter;
              return matchesSearch && matchesProvince;
            }).length === 0 ? (
              <div className="py-16 text-center space-y-3">
                <Search className="w-8 h-8 text-slate-350 mx-auto" />
                <p className="text-xs font-bold text-slate-500 font-sans">No se encontraron proveedores registrados.</p>
                <p className="text-[10px] text-slate-400 max-w-sm mx-auto leading-normal">
                  Intenta cambiar los términos de búsqueda o selecciona otra provincia para ver más mayoristas en otras regiones.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                {platformSuppliers.filter(p => {
                  const q = platformSearchQuery.toLowerCase().trim();
                  const matchesSearch = !q || (
                    p.name.toLowerCase().includes(q) ||
                    p.email.toLowerCase().includes(q) ||
                    (p.phone && p.phone.toLowerCase().includes(q)) ||
                    (p.city && p.city.toLowerCase().includes(q)) ||
                    (p.province && p.province.toLowerCase().includes(q))
                  );
                  const matchesProvince = !selectedProvinceFilter || p.province === selectedProvinceFilter;
                  return matchesSearch && matchesProvince;
                }).map((provider) => (
                  <div 
                    key={provider.id} 
                    className={`p-4 bg-slate-50/50 hover:bg-slate-50 rounded-2xl border transition-all flex flex-col justify-between gap-4
                      ${provider.isSupplierPremium 
                        ? 'border-indigo-200 shadow-xs ring-1 ring-indigo-50/50 hover:border-indigo-300' 
                        : 'border-slate-200 hover:border-slate-300'}
                    `}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="text-sm font-black text-slate-900 leading-tight flex items-center gap-1.5 flex-wrap">
                            {provider.name}
                            {provider.isSupplierPremium && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-extrabold text-[8px] font-mono rounded-md uppercase tracking-wider shadow-xxs">
                                <Sparkles className="w-2.5 h-2.5" /> PRO
                              </span>
                            )}
                          </h4>
                          <span className="text-[10px] font-mono text-slate-400 font-bold block mt-0.5">ID Proveedor MAX24</span>
                        </div>
                      </div>

                      <div className="space-y-1 text-xs text-slate-600 font-sans pt-1">
                        <div className="flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{provider.city || 'Ciudad s/e'}, {provider.province || 'Provincia no asignada'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate" title={provider.email}>{provider.email}</span>
                        </div>
                        {provider.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>{provider.phone}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex gap-2">
                      {provider.phone && (
                        <a
                          href={`https://wa.me/${provider.phone.replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 bg-emerald-500 hover:bg-emerald-650 text-white rounded-xl text-xs font-bold flex items-center justify-center shadow-xs transition-transform hover:scale-[1.02]"
                        >
                          WhatsApp
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          const exists = suppliers.some(s => s.email?.toLowerCase() === provider.email.toLowerCase() || s.name.toLowerCase() === provider.name.toLowerCase());
                          if (exists) {
                            alert(`El proveedor "${provider.name}" ya se encuentra registrado en tu Directorio de Proveedores Local.`);
                            return;
                          }
                          onAddSupplier({
                            name: provider.name,
                            contactName: provider.name,
                            phone: provider.phone,
                            email: provider.email,
                            address: provider.city ? `${provider.city}, ${provider.province || ''}` : provider.province || '',
                            notes: `Importado de MAX24. Proveedor Oficial Registrado.`
                          });
                          alert(`¡Excelente! "${provider.name}" se agregó a tu Directorio de Proveedores local.`);
                        }}
                        className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                      >
                        Agregar Agenda
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* NEW MERCHANDISE RECEIVING / STOCK UPDATE MODAL */}
      {isPurchaseFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative overflow-hidden">
            <button 
              onClick={() => setIsPurchaseFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <ShoppingBag className="text-indigo-650 w-5 h-5" />
              Nueva Recepción de Stock y Mercadería
            </h3>
            <p className="text-xs text-slate-500 mb-4">Ingresa los productos que acabas de recibir de un distribuidor para actualizar stock.</p>

            <form onSubmit={handleSubmitPurchase} className="space-y-4">
              
              {/* Supplier & Entry date block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Proveedor Distribuidor *</label>
                  <select
                    value={purchaseSupplierId}
                    onChange={(e) => setPurchaseSupplierId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                    required
                  >
                    <option value="">Seleccionar Proveedor...</option>
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Fecha de Recepción *</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                    required
                  />
                </div>
              </div>

              {/* Dynamic Add Product block */}
              <div className="p-4 bg-slate-5 w-full rounded-2xl border border-slate-200/60 space-y-3">
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-450 font-mono">Añadir Productos Recibidos</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="md:col-span-3">
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Producto</label>
                    <select
                      value={selectedItemProductId}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSelectedItemProductId(val);
                        const mapped = products.find(p => p.id === val);
                        if (mapped) {
                          setSelectedItemCost(mapped.cost || 0);
                        }
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    >
                      <option value="">Seleccionar de Catálogo...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (SKU: {p.sku})</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Cantidad Recibida</label>
                    <input
                      type="number"
                      min="1"
                      value={selectedItemQty}
                      onChange={(e) => setSelectedItemQty(Number(e.target.value))}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[9px] font-bold text-slate-600 uppercase tracking-wider mb-1">Costo Unitario Compra</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        value={selectedItemCost}
                        onChange={(e) => setSelectedItemCost(Number(e.target.value))}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                      />
                    </div>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddPurchaseItem}
                      className="w-full py-1.5 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 cursor-pointer"
                    >
                      + Añadir Item
                    </button>
                  </div>
                </div>
              </div>

              {/* Items Table Cart Preview */}
              {purchaseItems.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Detalle del Cargamento</span>
                  <div className="border border-slate-200 rounded-xl max-h-[140px] overflow-y-auto divide-y divide-slate-100">
                    {purchaseItems.map((item, idx) => (
                      <div key={idx} className="p-2.5 flex justify-between items-center text-xs">
                        <div className="min-w-0 flex-1 leading-tight text-left">
                          <p className="font-bold text-slate-800 truncate">{item.productName}</p>
                          <p className="text-[10px] text-slate-450 mt-0.5 font-mono">
                            {item.quantity}u × ${item.cost.toLocaleString('es-AR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className="font-mono font-extrabold text-slate-900">${(item.quantity * item.cost).toLocaleString('es-AR')}</span>
                          <button
                            type="button"
                            onClick={() => setPurchaseItems(prev => prev.filter((_, i) => i !== idx))}
                            className="text-red-500 hover:text-red-700 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center pt-2 text-xs font-black text-slate-805 text-left border-t border-slate-100">
                    <span>Monto Estimado Total:</span>
                    <span className="font-mono text-indigo-750 text-sm">${purchaseItems.reduce((acc, i) => acc + (i.quantity * i.cost), 0).toLocaleString('es-AR')}</span>
                  </div>
                </div>
              )}

              {/* Payment Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 border-t border-slate-100 pt-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Estado de Pago</label>
                  <select
                    value={purchaseStatus}
                    onChange={(e) => setPurchaseStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Pagado">Pagado al Recibir</option>
                    <option value="Pendiente">Deuda Pendiente (Fiado/Consign.)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Método de Adquisición</label>
                  <select
                    value={purchaseMethod}
                    onChange={(e) => setPurchaseMethod(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  >
                    <option value="Efectivo">Efectivo (Caja Chica/Fondo)</option>
                    <option value="Transferencia">Transferencia Bancaria / CVU</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-4 border-t border-slate-150">
                <button
                  type="button"
                  onClick={() => setIsPurchaseFormOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-650 font-bold rounded-xl text-xs hover:bg-slate-55 cursor-pointer text-center"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Registrar Entrada y Sumar Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RENDER SUPPLIER FORM MODAL */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-55 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 className="text-orange-500 w-5 h-5" />
              {formMode === 'create' ? 'Agregar Proveedor de Mercadería' : 'Actualizar Datos de Distribuidora'}
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-sans">Introduce la información oficial fiscal y datos logísticos.</p>

            <form onSubmit={handleSubmitForm} className="space-y-3.5 text-left">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre Comercial de la Empresa *</label>
                <input
                  type="text"
                  placeholder="ej. Distribuidora Coca-Cola S.A."
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">Representante</label>
                  <input
                    type="text"
                    placeholder="ej. Daniel Rossi"
                    value={formContactName}
                    onChange={(e) => setFormContactName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="ej. 1151234567"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="ej. logistica@empresa.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">CUIT</label>
                  <input
                    type="text"
                    placeholder="ej. 30-87654321-9"
                    value={formTaxId}
                    onChange={(e) => setFormTaxId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Dirección de Depósito / Oficinas</label>
                <input
                  type="text"
                  placeholder="ej. Parque Industrial Garín, Lote 12"
                  value={formAddress}
                  onChange={(e) => setFormAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Notas de Reparto</label>
                <textarea
                  placeholder="Detalles adicionales..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden min-h-[70px] font-sans"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-650 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
