import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Send, 
  MapPin, 
  Truck, 
  LogOut, 
  Plus, 
  Trash2, 
  Check, 
  Clock, 
  Inbox, 
  Phone, 
  Tag, 
  ArrowRight,
  ShieldAlert,
  Sliders,
  DollarSign,
  Briefcase,
  Sparkles,
  Zap
} from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, updateDoc, query, where, getDoc } from 'firebase/firestore';
import { Employee, StoreSettings, SupplierOffer } from '../types';

interface SupplierPortalProps {
  currentUser: Employee;
  onLogout: () => void;
  onUpdateCurrentUser: (updated: Employee) => void;
}

export default function SupplierPortal({ currentUser, onLogout, onUpdateCurrentUser }: SupplierPortalProps) {
  const [activeTab, setActiveTab] = useState<'stores' | 'offers'>('stores');
  const [stores, setStores] = useState<StoreSettings[]>([]);
  const [myOffers, setMyOffers] = useState<SupplierOffer[]>([]);
  const [loading, setLoading] = useState(true);

  // Profile Edit fields inside Portal for relocations
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileProvince, setProfileProvince] = useState(currentUser.province || 'Buenos Aires');
  const [profileCity, setProfileCity] = useState(currentUser.city || '');
  const [profileRubro, setProfileRubro] = useState(() => {
    if (currentUser.emergencyContact && currentUser.emergencyContact.startsWith('Rubro: ')) {
      return currentUser.emergencyContact.replace('Rubro: ', '');
    }
    return 'Almacén';
  });

  // Filter strategy
  const [locationFilter, setLocationFilter] = useState<'city' | 'province'>('city');

  // Mercado Pago settings for Supplier plan links
  const [mpSettings, setMpSettings] = useState<{
    planProveedorMensualLink: string;
    planProveedorAnualLink: string;
  }>({
    planProveedorMensualLink: 'https://mpago.la/33P1Q69',
    planProveedorAnualLink: 'https://mpago.la/2shPPRr'
  });

  // Oferta Creation Form Modal States
  const [selectedStore, setSelectedStore] = useState<StoreSettings | null>(null);
  const [offerTitle, setOfferTitle] = useState('');
  const [offerDescription, setOfferDescription] = useState('');
  const [offerProducts, setOfferProducts] = useState<{ productName: string; description?: string; price: number; unit?: string }[]>([
    { productName: '', description: '', price: 0, unit: 'unidades' }
  ]);

  useEffect(() => {
    fetchActiveData();
  }, [currentUser]);

  const fetchActiveData = async () => {
    setLoading(true);
    try {
      // 1. Fetch all store settings registered in Firebase
      const storesSnap = await getDocs(collection(db, 'storeSettings'));
      const fetchedStores: StoreSettings[] = [];
      storesSnap.forEach((doc) => {
        const data = doc.data() as StoreSettings;
        // Make sure it is a configured store with an email
        if (data.name && data.email) {
          fetchedStores.push(data);
        }
      });
      setStores(fetchedStores);

      // 2. Fetch offers sent by this supplier
      const offersSnap = await getDocs(collection(db, 'supplierOffers'));
      const fetchedOffers: SupplierOffer[] = [];
      offersSnap.forEach((doc) => {
        const data = doc.data() as SupplierOffer;
        if (data.supplierEmail === currentUser.email) {
          fetchedOffers.push(data);
        }
      });
      // Sort offers by date desc
      fetchedOffers.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setMyOffers(fetchedOffers);

      // 3. Fetch SuperAdmin MP Settings for Supplier plan links
      try {
        const mpDoc = await getDoc(doc(db, 'superAdminSettings', 'mercadopago'));
        if (mpDoc.exists()) {
          const dbData = mpDoc.data();
          setMpSettings({
            planProveedorMensualLink: dbData.planProveedorMensualLink || 'https://mpago.la/33P1Q69',
            planProveedorAnualLink: dbData.planProveedorAnualLink || 'https://mpago.la/2shPPRr'
          });
        }
      } catch (err) {
        console.warn("Could not load superAdminSettings/mercadopago in SupplierPortal:", err);
      }
    } catch (err) {
      console.error("Error loading Supplier portal data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Profile Update
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileCity.trim() || !profileName.trim()) {
      alert("Por favor complete nombre y ciudad.");
      return;
    }

    const updatedUser: Employee = {
      ...currentUser,
      name: profileName.trim(),
      phone: profilePhone.trim(),
      province: profileProvince,
      city: profileCity.trim(),
      emergencyContact: `Rubro: ${profileRubro}`
    };

    try {
      await setDoc(doc(db, 'employees', currentUser.id), updatedUser);
      onUpdateCurrentUser(updatedUser);
      setIsEditingProfile(false);
      alert("¡Ubicación de Proveedor y Perfil actualizados correctamente!");
    } catch (err) {
      console.error("Error updating profile in Firestore:", err);
      alert("No se pudo guardar la ubicación en la nube, pero se actualizó localmente.");
      onUpdateCurrentUser(updatedUser);
      setIsEditingProfile(false);
    }
  };

  // Subscription Premium Upgrade Simulator for suppliers
  const handleUpgrade = async (tier: 'monthly' | 'annually') => {
    const link = tier === 'annually' ? mpSettings.planProveedorAnualLink : mpSettings.planProveedorMensualLink;
    
    // Open Mercado Pago link in a new tab
    if (link) {
      window.open(link, '_blank');
    }

    const durationDays = tier === 'annually' ? 365 : 30;
    const updatedUser: Employee = {
      ...currentUser,
      isSupplierPremium: true,
      supplierPremiumTier: tier,
      supplierPremiumExpiry: new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };

    try {
      await setDoc(doc(db, 'employees', currentUser.id), updatedUser);
      onUpdateCurrentUser(updatedUser);
      alert(`¡Suscripción Pro (${tier === 'annually' ? 'Anual' : 'Mensual'}) activada con éxito! Se ha abierto el enlace de pago de Mercado Pago en una pestaña nueva para completar la suscripción, y se han eliminado tus límites de visualización y envío a tiendas en la aplicación.`);
    } catch (err) {
      console.error("Error updating subscription status:", err);
      onUpdateCurrentUser(updatedUser);
      alert(`¡Suscripción Pro (${tier === 'annually' ? 'Anual' : 'Mensual'}) activada de forma local con éxito!`);
    }
  };

  const handleDowngrade = async () => {
    if (!confirm("¿Seguro que deseas cancelar tu suscripción Mayorista Pro? Volverás a tener límites de visualización de 10 tiendas.")) return;
    const updatedUser: Employee = {
      ...currentUser,
      isSupplierPremium: false,
      supplierPremiumTier: undefined,
      supplierPremiumExpiry: undefined
    };

    try {
      await setDoc(doc(db, 'employees', currentUser.id), updatedUser);
      onUpdateCurrentUser(updatedUser);
      alert("Suscripción Pro cancelada con éxito. Has vuelto al Plan Base Gratuito.");
    } catch (err) {
      console.error("Error cancelling subscription:", err);
      onUpdateCurrentUser(updatedUser);
      alert("Suscripción de proveedor cancelada localmente.");
    }
  };

  // Filter stores based on supplier criteria
  const matchingStores = stores.filter(store => {
    // If the country doesn't match default 'Argentina', handle gracefully
    const storeCountry = store.country || 'Argentina';
    const supCountry = currentUser.country || 'Argentina';
    
    if (storeCountry.toLowerCase() !== supCountry.toLowerCase()) return false;

    // Based on search expander toggle:
    const storeProvince = (store.province || '').toLowerCase().trim();
    const supProvince = (currentUser.province || '').toLowerCase().trim();
    const storeCity = (store.city || '').toLowerCase().trim();
    const supCity = (currentUser.city || '').toLowerCase().trim();

    if (locationFilter === 'city') {
      return storeProvince === supProvince && storeCity === supCity;
    } else {
      return storeProvince === supProvince;
    }
  });

  const isPremium = currentUser.isSupplierPremium === true;
  const freeStoreLimit = 10;
  const filteredStores = isPremium ? matchingStores : matchingStores.slice(0, freeStoreLimit);
  const remainingStoresCount = Math.max(0, matchingStores.length - freeStoreLimit);

  // Adding item lines to offer
  const addProductLine = () => {
    setOfferProducts([
      ...offerProducts,
      { productName: '', description: '', price: 0, unit: 'unidades' }
    ]);
  };

  const removeProductLine = (index: number) => {
    if (offerProducts.length === 1) return;
    setOfferProducts(offerProducts.filter((_, i) => i !== index));
  };

  const updateProductLineField = (index: number, field: string, val: any) => {
    const updated = [...offerProducts];
    updated[index] = {
      ...updated[index],
      [field]: val
    };
    setOfferProducts(updated);
  };

  // Send the actual Offer to the commerce
  const handleSendOfferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    if (!offerTitle.trim()) {
      alert("El título de la oferta es obligatorio.");
      return;
    }

    const validatedProducts = offerProducts.filter(p => p.productName.trim() !== '');
    if (validatedProducts.length === 0) {
      alert("Debes agregar al menos un producto con su respectivo nombre para enviar la lista.");
      return;
    }

    const newOfferId = `offer-${Date.now()}`;
    const newOffer: SupplierOffer = {
      id: newOfferId,
      supplierId: currentUser.id,
      supplierName: currentUser.name,
      supplierEmail: currentUser.email,
      storeEmail: selectedStore.email || '',
      storeName: selectedStore.name,
      date: new Date().toISOString().split('T')[0],
      title: offerTitle.trim(),
      description: offerDescription.trim(),
      productsList: validatedProducts.map(p => ({
        productName: p.productName.trim(),
        description: p.description?.trim(),
        price: Number(p.price) || 0,
        unit: p.unit || 'unidades'
      })),
      status: 'Enviado'
    };

    try {
      await setDoc(doc(db, 'supplierOffers', newOfferId), newOffer);
      alert(`¡Oferta enviada con éxito a "${selectedStore.name}"! Ya puede verla al ingresar a su panel.`);
      
      // Cleanup
      setSelectedStore(null);
      setOfferTitle('');
      setOfferDescription('');
      setOfferProducts([{ productName: '', description: '', price: 0, unit: 'unidades' }]);
      fetchActiveData();
    } catch (err) {
      console.error("Error creating supplier offer:", err);
      alert("No se pudo enviar la oferta. Revisa tu conexión a internet.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Aceptado':
        return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
      case 'Rechazado':
        return 'bg-red-500/10 text-red-400 border border-red-500/20';
      case 'Leído':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
      default:
        return 'bg-orange-500/10 text-orange-450 border border-orange-500/15';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans" id="supplier-portal-root">
      {/* Central header */}
      <nav className="bg-slate-900 border-b border-slate-800 z-10 sticky top-0 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-tr from-indigo-600 to-indigo-400 rounded-xl text-white font-black shadow-lg shadow-indigo-600/15 flex items-center justify-center w-10 h-10 shrink-0">
                M24
              </div>
              <div>
                <span className="font-extrabold text-sm tracking-tight text-white leading-none block">MAX24 Mayorista</span>
                <span className="text-[10px] font-mono tracking-widest text-indigo-400 uppercase mt-1 block">Portal de Proveedores Oficial</span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden md:block text-right">
                <span className="block text-xs font-bold text-slate-200">{currentUser.name}</span>
                <span className="text-[9px] font-mono text-indigo-400 font-extrabold uppercase bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded mt-0.5 inline-block">
                  {profileRubro}
                </span>
              </div>

              <button
                onClick={onLogout}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-800 hover:bg-red-500/15 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                Salir
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Profile and Zone Banner */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-slate-900/60 border border-slate-850 rounded-3xl flex flex-col lg:flex-row gap-5 justify-between items-start lg:items-center">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="p-1 px-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono tracking-wider font-extrabold rounded-md uppercase">Zona de Influencia</span>
              <span className="text-slate-500 text-xs">•</span>
              <span className="text-[11px] font-bold text-slate-350 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400" />
                {currentUser.city}, {currentUser.province} ({currentUser.country})
              </span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">Buenas tardes, {currentUser.name}</h2>
            <p className="text-xs text-slate-400 max-w-2xl">
              Aquí verás las tiendas registradas en tu zona de distribución y podrás enviarles listas de precios exclusivas sin intermediarios.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2 bg-indigo-500 hover:bg-indigo-450 text-white rounded-xl text-xs font-extrabold cursor-pointer transition-colors flex items-center gap-1.5 shadow-lg shadow-indigo-500/10"
            >
              <Sliders className="w-3.5 h-3.5" />
              Actualizar Ubicación / Perfil
            </button>
          </div>
        </div>

        {/* COMPONENTE DE PLANES Y SUSCRIPCIÓN PARA PROVEEDORES */}
        <div className="p-5 bg-slate-900 border border-slate-800/80 rounded-3xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-2xl rounded-full" />
          
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 relative z-10">
            <div className="space-y-1 text-left">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[9px] font-mono tracking-widest font-black uppercase ${
                  isPremium 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {isPremium ? 'Plan Mayorista PRO Activo' : 'Versión Limitada • Plan Base Gratuito'}
                </span>
                {!isPremium && (
                  <span className="px-2 py-0.5 bg-amber-500/10 rounded text-[9px] font-bold text-amber-500 border border-amber-500/20 uppercase tracking-wider font-mono">
                    Límite: 10 Comercios
                  </span>
                )}
                {isPremium && (
                  <span className="text-[10px] text-amber-400 font-extrabold flex items-center gap-1 font-sans">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse" /> Comercios e Informes Ilimitados
                  </span>
                )}
              </div>
              <h3 className="text-sm font-black text-white mt-1">
                {isPremium 
                  ? `Suscripción Mayorista PRO (${currentUser.supplierPremiumTier === 'annually' ? 'Anual con Descuento' : 'Mensual'})`
                  : 'Suscripción Gratuita de Proveedor'
                }
              </h3>
              <p className="text-xs text-slate-400 max-w-3xl leading-normal">
                {isPremium 
                  ? `Muchas gracias por confiar en MAX24. Tienes acceso completo a todas las tiendas de la región y envíos ilimitados de presupuestos. Tu abono expira el ${currentUser.supplierPremiumExpiry}.`
                  : `Tu cuenta gratuita te permite ver y enviar presupuestos a un máximo de 10 tiendas de tu zona (actualmente tienes ${remainingStoresCount} tiendas ocultas). Suscríbete hoy para tener un menú sin límites y expandir tus ventas.`
                }
              </p>
            </div>

            <div className="shrink-0 w-full lg:w-auto flex flex-col sm:flex-row gap-2">
              {isPremium ? (
                <button
                  type="button"
                  onClick={handleDowngrade}
                  className="w-full sm:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-rose-400 text-xs font-bold rounded-xl border border-slate-850 hover:border-rose-500/20 transition-all cursor-pointer text-center"
                >
                  Cancelar Suscripción
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => handleUpgrade('monthly')}
                    className="w-full sm:w-auto px-4 py-2 bg-slate-950 hover:bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-indigo-500/30 text-xs font-bold rounded-xl transition-colors cursor-pointer text-center"
                  >
                    Abono Mensual • $19.900/mes
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpgrade('annually')}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-black rounded-xl hover:shadow-lg hover:shadow-indigo-500/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5 animate-pulse text-amber-400" />
                    Abono Anual • $14.900/mes (-25%)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Warning if they have hidden stores */}
        {!isPremium && remainingStoresCount > 0 && (
          <div className="p-4 bg-amber-500/10 border border-amber-500/25 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <p className="text-xs text-amber-300 font-semibold leading-normal">
                Atención: Tienes <strong className="text-white font-black">{remainingStoresCount} comercios adicionales</strong> en {currentUser.city} que se encuentran ocultos porque estás en la suscripción Gratuita.
              </p>
            </div>
            <button
              onClick={() => handleUpgrade('annually')}
              className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-[10px] font-black rounded-lg transition-colors cursor-pointer shrink-0 self-start sm:self-center"
            >
              Desbloquear Todos
            </button>
          </div>
        )}

        {/* PROFILE EDIT COLLAPSIBLE FORM */}
        {isEditingProfile && (
          <div className="p-5 bg-slate-900 border border-indigo-500/20 rounded-2xl animate-fade-in">
            <h3 className="text-xs font-black uppercase text-indigo-400 font-mono mb-4 tracking-widest flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Configurar Información de Facturación y Ubicación
            </h3>
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Razón Social / Nombre *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Rubro Principal</label>
                  <select
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    value={profileRubro}
                    onChange={(e) => setProfileRubro(e.target.value)}
                  >
                    <option value="Almacén">Almacén / Comestibles</option>
                    <option value="Bebidas">Bebidas con/sin Alcohol</option>
                    <option value="Limpieza">Limpieza y Perfumería</option>
                    <option value="Fiambrería">Fiambrería y Lácteos</option>
                    <option value="Golosinas">Kiosco y Golosinas</option>
                    <option value="Varios">Varios y General</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Celular WhatsApp</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Provincia *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    value={profileProvince}
                    onChange={(e) => setProfileProvince(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Ciudad Actual *</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    placeholder="Ej. Quilmes"
                    required
                  />
                </div>
                <div className="flex items-end justify-end md:col-span-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditingProfile(false)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-bold rounded-xl outline-hidden"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer"
                  >
                    Guardar Ubicación
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* NAVIGATION TABS & FILTER CONTROLS */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-3">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('stores')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'stores' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Comercios en mi Zona ({filteredStores.length})
            </button>

            <button
              onClick={() => setActiveTab('offers')}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                activeTab === 'offers' 
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Mis Ofertas Enviadas ({myOffers.length})
            </button>
          </div>

          {activeTab === 'stores' && (
            <div className="flex items-center gap-2 bg-slate-900 p-1 border border-slate-800 rounded-xl">
              <span className="text-[10px] font-mono text-slate-500 uppercase px-2 font-bold select-none">Filtrar por:</span>
              <button
                onClick={() => setLocationFilter('city')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  locationFilter === 'city' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                Misma Ciudad ({currentUser.city})
              </button>
              <button
                onClick={() => setLocationFilter('province')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  locationFilter === 'province' 
                    ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                    : 'text-slate-450 hover:text-slate-200'
                }`}
              >
                Misma Provincia ({currentUser.province})
              </button>
            </div>
          )}
        </div>

        {/* LOADER */}
        {loading && (
          <div className="p-20 text-center space-y-3 font-mono text-slate-400">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-xs">Sincronizando comercios y listas con base de datos...</p>
          </div>
        )}

        {/* TAB 1: STORES VIEW */}
        {!loading && activeTab === 'stores' && (
          <div className="space-y-4">
            {filteredStores.length === 0 ? (
              <div className="text-center p-14 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <Building2 className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">Ningún comercio encontrado en esta zona</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Aún no se han registrado comercios adheridos o completado ubicación tributaria en <strong className="text-indigo-400">{locationFilter === 'city' ? currentUser.city : currentUser.province}</strong>. Prueba a expandir tu filtro en los botones de arriba o invita comercios locales a unirse.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredStores.map((store) => (
                  <div 
                    key={store.email} 
                    className="p-5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 rounded-2xl flex flex-col justify-between transition-all group"
                  >
                    <div className="space-y-2.5">
                      <div className="flex justify-between items-start">
                        <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
                          <Building2 className="w-4.5 h-4.5" />
                        </div>
                        <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 uppercase tracking-widest font-black">
                          {store.storeCode || 'Comercio'}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-sm text-white group-hover:text-indigo-400 transition-colors">{store.name}</h4>
                        <p className="text-xs text-slate-400 flex items-center gap-1.5">
                          <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          <span className="truncate">{store.address}</span>
                        </p>
                        <p className="text-[11px] font-mono text-slate-500">{store.city}, {store.province}</p>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between">
                      <span className="text-[11px] text-slate-550 italic font-medium truncate max-w-[130px]">{store.phone}</span>
                      
                      <button
                        onClick={() => setSelectedStore(store)}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[11px] font-black cursor-pointer shadow-md flex items-center gap-1 group-hover:scale-105 transition-all"
                      >
                        Enviar Oferta
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: SENT OFFERS */}
        {!loading && activeTab === 'offers' && (
          <div className="space-y-4">
            {myOffers.length === 0 ? (
              <div className="text-center p-14 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
                <Inbox className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-white">No has enviado ofertas todavía</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto">
                  Selecciona la pestaña de comercios, elige un supermercado o minimercado local y hazle llegar tus ofertas de stock.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {myOffers.map((offer) => (
                  <div key={offer.id} className="p-5 bg-slate-900 border border-slate-800/80 rounded-2xl space-y-3 hover:border-slate-700 transition-all">
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{offer.title}</h4>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono uppercase font-black tracking-widest ${getStatusColor(offer.status)}`}>
                            {offer.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{offer.description}</p>
                        <p className="text-[11px] text-slate-500 mt-1">
                          Destinatario: <strong className="text-slate-300">{offer.storeName}</strong> ({offer.storeEmail})
                        </p>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <span className="block text-[11px] font-mono text-slate-500">{offer.date}</span>
                        <span className="text-xs font-extrabold text-indigo-400 mt-1 block">
                          {offer.productsList.length} artículos en lista
                        </span>
                      </div>
                    </div>

                    {/* Products details layout */}
                    <div className="p-3 bg-slate-950 border border-slate-850 rounded-xl">
                      <div className="grid grid-cols-3 gap-2 text-[10px] uppercase font-mono tracking-wider text-slate-500 border-b border-slate-800 pb-1 mb-1.5 font-black">
                        <div>Producto</div>
                        <div>Precio (ARS)</div>
                        <div className="text-right">Unidad / Detalle</div>
                      </div>
                      <div className="space-y-1">
                        {offer.productsList.map((prod, idx) => (
                          <div key={idx} className="grid grid-cols-3 gap-2 text-xs font-semibold text-slate-200 py-0.5">
                            <div className="truncate">
                              {prod.productName}
                              {prod.description && <span className="block text-[10px] text-slate-500 font-normal truncate">{prod.description}</span>}
                            </div>
                            <div className="text-emerald-400 font-mono font-bold">${prod.price.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</div>
                            <div className="text-right text-slate-400 font-mono">{prod.unit || 'unidades'}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </main>

      {/* CREATE OFFER DIALOG MODAL / FORM PANEL */}
      {selectedStore && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="bg-slate-850 p-5 border-b border-slate-800 flex justify-between items-center shrink-0">
              <div className="space-y-1">
                <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-[9px] font-mono tracking-widest font-black rounded uppercase">Nueva Oferta Comercial</span>
                <h3 className="text-sm font-black text-white mt-1">Enviar a: {selectedStore.name}</h3>
                <p className="text-xs text-slate-400">{selectedStore.address}, {selectedStore.city}</p>
              </div>
              <button
                onClick={() => setSelectedStore(null)}
                className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white rounded-lg text-slate-400 text-xs text-center"
              >
                Cerrar
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSendOfferSubmit} className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Título / Nombre de la Lista *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  placeholder="Ej. Ofertas Mayoristas de Lácteos - Distribuidora Quilmes"
                  value={offerTitle}
                  onChange={(e) => setOfferTitle(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block">Condiciones / Comentarios</label>
                <textarea
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white"
                  placeholder="Ej: Pedido mínimo 10 bultos. Entrega inmediata sin costo para minimercados de la ciudad."
                  rows={2}
                  value={offerDescription}
                  onChange={(e) => setOfferDescription(e.target.value)}
                />
              </div>

              {/* Products List builder */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Líneas de Productos / Ofertas</label>
                  <button
                    type="button"
                    onClick={addProductLine}
                    className="px-2.5 py-1 bg-indigo-600/10 hover:bg-indigo-600/25 border border-indigo-500/20 text-indigo-400 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Agregar Item
                  </button>
                </div>

                <div className="space-y-2">
                  {offerProducts.map((prod, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-850 items-center">
                      <div className="col-span-5 space-y-1">
                        <input
                          type="text"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="Nombre del Producto (Ej: Leche Entera 1L)"
                          value={prod.productName}
                          onChange={(e) => updateProductLineField(index, 'productName', e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-span-3 space-y-1">
                        <input
                          type="text"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="Marca o Detalle (Opcional)"
                          value={prod.description}
                          onChange={(e) => updateProductLineField(index, 'description', e.target.value)}
                        />
                      </div>

                      <div className="col-span-2 space-y-1">
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white text-center font-mono"
                          placeholder="$0.00"
                          value={prod.price || ''}
                          onChange={(e) => updateProductLineField(index, 'price', e.target.value)}
                          required
                        />
                      </div>

                      <div className="col-span-1.5 space-y-1">
                        <select
                          className="w-full px-1.5 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-white"
                          value={prod.unit}
                          onChange={(e) => updateProductLineField(index, 'unit', e.target.value)}
                        >
                          <option value="unidades">U.</option>
                          <option value="bulto">Bulto</option>
                          <option value="pack">Pack</option>
                          <option value="cajón">Cajón</option>
                          <option value="kg">kg</option>
                        </select>
                      </div>

                      <div className="col-span-0.5 text-right">
                        <button
                          type="button"
                          onClick={() => removeProductLine(index)}
                          className="text-slate-500 hover:text-red-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl text-xs cursor-pointer shadow-lg mt-3 flex items-center justify-center gap-1.5"
              >
                Enviar Oferta Comercial
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
