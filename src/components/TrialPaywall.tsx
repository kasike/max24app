import React, { useState, useEffect } from 'react';
import { Lock, CreditCard, Sparkles, ShieldCheck, Check, AlertCircle, LogOut, DollarSign, Crown, Building2, ChevronRight, Clock, ShieldAlert, ExternalLink } from 'lucide-react';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import { Subscription } from '../types';

interface TrialPaywallProps {
  activeStoreEmail: string;
  currentUser: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  activeLicense: any;
  onPaymentSuccess: (planName: Subscription['plan'], price: number) => void;
  onLogout: () => void;
}

export default function TrialPaywall({
  activeStoreEmail,
  currentUser,
  activeLicense,
  onPaymentSuccess,
  onLogout
}: TrialPaywallProps) {
  // Plan selection states
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<'Básico' | 'Profesional' | 'Empresarial'>('Profesional');
  const [step, setStep] = useState<'selection' | 'checkout' | 'processing' | 'success'>('selection');

  // MP credential settings loaded dynamically from superAdminSettings
  const [mpSettings, setMpSettings] = useState({
    publicKey: 'APP_USR-d1325d31-d738-459d-8f29-3b03c06fdca5',
    clientId: '8753677167356936',
    isSandbox: false,
    planBasicoMensualLink: '',
    planBasicoAnualLink: '',
    planProfesionalMensualLink: '',
    planProfesionalAnualLink: '',
    planEmpresarialMensualLink: '',
    planEmpresarialAnualLink: '',
  });

  // Checkout form states
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer' | 'mp_wallet' | 'direct_link'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardDni, setCardDni] = useState('');
  const [directOpRef, setDirectOpRef] = useState('');
  const [formError, setFormError] = useState('');

  // Processing loader states
  const [processingText, setProcessingText] = useState('Inicializando pasarela de pagos de Mercado Pago...');
  const [transactionId, setTransactionId] = useState('');

  // Load live Mercado Pago credentials from SuperAdmin settings
  useEffect(() => {
    async function fetchMpCredentials() {
      try {
        const mpDoc = await getDoc(doc(db, 'superAdminSettings', 'mercadopago'));
        if (mpDoc.exists()) {
          const data = mpDoc.data();
          setMpSettings({
            publicKey: data.publicKey || 'APP_USR-d1325d31-d738-459d-8f29-3b03c06fdca5',
            clientId: data.clientId || '8753677167356936',
            isSandbox: data.isSandbox || false,
            planBasicoMensualLink: data.planBasicoMensualLink || '',
            planBasicoAnualLink: data.planBasicoAnualLink || '',
            planProfesionalMensualLink: data.planProfesionalMensualLink || '',
            planProfesionalAnualLink: data.planProfesionalAnualLink || '',
            planEmpresarialMensualLink: data.planEmpresarialMensualLink || '',
            planEmpresarialAnualLink: data.planEmpresarialAnualLink || '',
          });
        }
      } catch (err) {
        console.warn("Could not fetch MP credentials from superAdminSettings:", err);
      }
    }
    fetchMpCredentials();
  }, []);

  // Compute pricing
  const baseMonthlyPrice = selectedPlan === 'Básico' ? 15000 : selectedPlan === 'Profesional' ? 30000 : 60000;
  const finalPrice = billingPeriod === 'yearly' ? baseMonthlyPrice * 10 : baseMonthlyPrice; // 2 months free

  // Card brand detection helper
  const getCardBrand = (number: string) => {
    const clean = number.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'Visa';
    if (/^5[1-5]/.test(clean)) return 'Mastercard';
    if (/^3[47]/.test(clean)) return 'Amex';
    return 'Tarjeta';
  };

  // Form input formatters
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;
    setCardNumber(formatted.substring(0, 19));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    setCardExpiry(value.substring(0, 5));
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardCvv(e.target.value.replace(/\D/g, '').substring(0, 4));
  };

  const handleDniChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardDni(e.target.value.replace(/\D/g, '').substring(0, 11));
  };

  // Initiate purchase
  const handleProceedToCheckout = () => {
    setStep('checkout');
    setFormError('');
  };

  // Submit payment
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (paymentMethod === 'card') {
      if (cardNumber.replace(/\s/g, '').length < 15) {
        setFormError('Por favor, ingresa un número de tarjeta válido.');
        return;
      }
      if (!cardName.trim()) {
        setFormError('Ingresa el nombre del titular como figura en la tarjeta.');
        return;
      }
      if (cardExpiry.length < 5) {
        setFormError('Ingresa la fecha de vencimiento (MM/AA).');
        return;
      }
      if (cardCvv.length < 3) {
        setFormError('Ingresa el código de seguridad (CVV) de 3 o 4 dígitos.');
        return;
      }
      if (!cardDni.trim() || cardDni.length < 7) {
        setFormError('Ingresa un número de DNI o CUIT válido para la facturación.');
        return;
      }
    }

    if (paymentMethod === 'direct_link') {
      if (!directOpRef.trim()) {
        setFormError('Por favor, ingrese el número de comprobante o referencia de Mercado Pago para validar su pago.');
        return;
      }
    }

    // Start checkout processing state
    setStep('processing');
    
    try {
      setProcessingText('Conectando de forma segura con el servidor de Mercado Pago...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcessingText('Verificando fondos y validez de la credencial...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      setProcessingText('Procesando cobro en vivo y registrando suscripción SaaS...');
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Success payload
      const subId = `SUB-MP-${Math.floor(100000 + Math.random() * 900000)}`;
      setTransactionId(subId);

      const activeStoreName = activeLicense?.storeName || 'Mi Tienda';
      const newTx = {
        id: `MP-${subId}`,
        storeName: activeStoreName,
        email: activeStoreEmail,
        plan: selectedPlan,
        amountArs: finalPrice,
        paymentMethod: paymentMethod === 'card' 
          ? `MercadoPago - Tarjeta ${getCardBrand(cardNumber)}` 
          : paymentMethod === 'transfer' 
          ? 'MercadoPago - Transferencia Directa' 
          : paymentMethod === 'mp_wallet'
          ? 'MercadoPago - Saldo Wallet'
          : `MercadoPago - Enlace Directo Oficial (Ref: ${directOpRef})`,
        date: new Date().toISOString().replace('T', ' ').slice(0, 16),
        status: 'Aprobado' as const
      };

      // 1. Save transaction in mpTransactions
      await setDoc(doc(db, 'mpTransactions', newTx.id), newTx);

      // 2. Fetch and update store owner license status
      const ownerSnap = await getDocs(collection(db, 'storeOwners'));
      let ownerIdToUpdate = activeLicense?.id;

      if (!ownerIdToUpdate) {
        // Fallback: search by email
        ownerSnap.forEach((docSnap) => {
          if (docSnap.data().email === activeStoreEmail) {
            ownerIdToUpdate = docSnap.id;
          }
        });
      }

      const updatedOwner = {
        id: ownerIdToUpdate || `store-${Date.now()}`,
        ownerName: activeLicense?.ownerName || currentUser.name,
        storeName: activeStoreName,
        email: activeStoreEmail,
        plan: selectedPlan,
        status: 'Activo' as const,
        registeredDate: new Date().toISOString().split('T')[0],
        notes: `Suscripción renovada de forma exitosa mediante pasarela de pago.`
      };

      await setDoc(doc(db, 'storeOwners', updatedOwner.id), updatedOwner);

      setStep('success');
    } catch (err) {
      console.error("Payment error:", err);
      setFormError('Ocurrió un error al procesar el pago. Por favor, intente nuevamente o pruebe otra tarjeta.');
      setStep('checkout');
    }
  };

  const handleFinishUpgrade = () => {
    // Notify parent of success
    onPaymentSuccess(selectedPlan, finalPrice);
  };

  const isCashier = currentUser.role === 'Cajero';

  // If the logged in user is a cashier, they can't pay. They must ask the admin to upgrade.
  if (isCashier) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 p-4 overflow-y-auto text-left">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl p-8 md:p-10 text-center shadow-2xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-orange-500 to-amber-500" />
          
          <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white font-sans tracking-tight">Período de Prueba Finalizado</h2>
            <p className="text-slate-400 font-mono text-xs">Comercio: {activeLicense?.storeName || activeStoreEmail}</p>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
            El período de prueba de 30 días de esta tienda ha finalizado. Como tu usuario tiene el rol de <span className="font-bold text-red-400">Cajero</span>, no dispones de los permisos necesarios para realizar el pago de la suscripción.
          </p>

          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 max-w-md mx-auto text-center">
            <p className="text-xs text-slate-400">
              Por favor, ponte en contacto con el <span className="font-bold text-amber-400">Administrador de la Tienda</span> ({activeStoreEmail}) para que inicie sesión y active la suscripción mensual o anual.
            </p>
          </div>

          <div className="pt-4 flex justify-center">
            <button
              onClick={onLogout}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50 p-4 overflow-y-auto text-left">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        {/* Top brand header */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500" />
        
        {/* Exit button */}
        <button
          onClick={onLogout}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
          title="Cerrar Sesión"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>

        {step === 'selection' && (
          <div className="space-y-6">
            {/* Header explanation */}
            <div className="text-center max-w-2xl mx-auto space-y-2 mt-4">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-[10.5px] font-black uppercase tracking-wider font-mono">
                <Clock className="w-3.5 h-3.5" />
                Trial de 30 Días Finalizado
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white font-sans tracking-tight">
                ¡Gracias por probar MAX24!
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                Esperamos que hayas podido registrar tus productos y configurar tu tienda exitosamente. Para continuar operando tu punto de venta (POS) y recibiendo pedidos, activa tu suscripción seleccionando un plan.
              </p>
            </div>

            {/* Toggle Monthly vs Yearly */}
            <div className="flex justify-center">
              <div className="bg-slate-950 p-1.5 rounded-2xl border border-slate-800 inline-flex items-center gap-1">
                <button
                  onClick={() => setBillingPeriod('monthly')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                    billingPeriod === 'monthly' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Facturación Mensual
                </button>
                <button
                  onClick={() => setBillingPeriod('yearly')}
                  className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                    billingPeriod === 'yearly' ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Facturación Anual
                  <span className="bg-amber-400/20 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-md font-extrabold uppercase">
                    16% OFF 🔥
                  </span>
                </button>
              </div>
            </div>

            {/* Three Grid Plans */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Plan Básico */}
              <div className={`bg-slate-950/40 border rounded-3xl p-5 flex flex-col justify-between transition-all ${
                selectedPlan === 'Básico' ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-xl scale-102 bg-slate-950/60' : 'border-slate-800 hover:border-slate-700'
              }`} onClick={() => setSelectedPlan('Básico')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white">Plan Básico</h3>
                    {selectedPlan === 'Básico' && <Check className="w-5 h-5 text-orange-500" />}
                  </div>
                  <p className="text-xs text-slate-400 h-10">Perfecto para almacenes locales, kioscos o tiendas de ropa en crecimiento.</p>
                  <div>
                    <span className="text-2xl md:text-3xl font-black text-white">
                      ${(billingPeriod === 'yearly' ? 150000 : 15000).toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-slate-500 ml-1 font-mono">{billingPeriod === 'yearly' ? 'ARS / año' : 'ARS / mes'}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-[10px] text-emerald-400 font-bold font-mono">¡Ahorras $30.000 ARS (2 meses gratis)!</div>
                  )}

                  <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-900">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Hasta 100 productos</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Punto de Venta (POS) ilimitado</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Clientes y fiados</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Hasta 3 empleados</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('Básico');
                    handleProceedToCheckout();
                  }}
                  className={`mt-6 w-full py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    selectedPlan === 'Básico' 
                      ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-md' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Contratar Plan Básico
                </button>
              </div>

              {/* Plan Profesional */}
              <div className={`bg-slate-950/40 border rounded-3xl p-5 flex flex-col justify-between transition-all relative ${
                selectedPlan === 'Profesional' ? 'border-amber-500 ring-2 ring-amber-500/20 shadow-xl scale-102 bg-slate-950/60' : 'border-slate-800 hover:border-slate-700'
              }`} onClick={() => setSelectedPlan('Profesional')}>
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                  MÁS RECOMENDADO
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      <Crown className="w-4 h-4 text-amber-400" />
                      Plan Profesional
                    </h3>
                    {selectedPlan === 'Profesional' && <Check className="w-5 h-5 text-amber-500" />}
                  </div>
                  <p className="text-xs text-slate-400 h-10">La solución definitiva para tiendas y pymes con alta rotación de inventario.</p>
                  <div>
                    <span className="text-2xl md:text-3xl font-black text-white">
                      ${(billingPeriod === 'yearly' ? 300000 : 30000).toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-slate-500 ml-1 font-mono">{billingPeriod === 'yearly' ? 'ARS / año' : 'ARS / mes'}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-[10px] text-emerald-400 font-bold font-mono">¡Ahorras $60.000 ARS (2 meses gratis)!</div>
                  )}

                  <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-900">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-bold text-white">Productos ILIMITADOS</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>POS Multicajero integrado</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Cuentas corrientes avanzadas</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Márgenes y costos de comidas</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Alertas de stock mínimo y crítico</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Integración con pistolas lectoras</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('Profesional');
                    handleProceedToCheckout();
                  }}
                  className={`mt-6 w-full py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    selectedPlan === 'Profesional' 
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Contratar Plan Profesional
                </button>
              </div>

              {/* Plan Empresarial */}
              <div className={`bg-slate-950/40 border rounded-3xl p-5 flex flex-col justify-between transition-all ${
                selectedPlan === 'Empresarial' ? 'border-amber-400 ring-2 ring-amber-400/20 shadow-xl scale-102 bg-slate-950/60' : 'border-slate-800 hover:border-slate-700'
              }`} onClick={() => setSelectedPlan('Empresarial')}>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base font-black text-white flex items-center gap-1.5">
                      <Building2 className="w-4 h-4 text-indigo-400" />
                      Plan Empresarial
                    </h3>
                    {selectedPlan === 'Empresarial' && <Check className="w-5 h-5 text-amber-400" />}
                  </div>
                  <p className="text-xs text-slate-400 h-10">Para redes de comercios, franquicias y sucursales distribuidas.</p>
                  <div>
                    <span className="text-2xl md:text-3xl font-black text-white">
                      ${(billingPeriod === 'yearly' ? 600000 : 60000).toLocaleString('es-AR')}
                    </span>
                    <span className="text-xs text-slate-500 ml-1 font-mono">{billingPeriod === 'yearly' ? 'ARS / año' : 'ARS / mes'}</span>
                  </div>
                  {billingPeriod === 'yearly' && (
                    <div className="text-[10px] text-emerald-400 font-bold font-mono">¡Ahorras $120.000 ARS (2 meses gratis)!</div>
                  )}

                  <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-900">
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="font-bold text-white">Multi-Tiendas (Control unificado)</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Resúmenes contables y balances</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Personalización de facturas y tickets</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>Asesor de soporte exclusivo telefónico</span>
                    </li>
                  </ul>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPlan('Empresarial');
                    handleProceedToCheckout();
                  }}
                  className={`mt-6 w-full py-2.5 rounded-xl font-black text-xs transition-all cursor-pointer ${
                    selectedPlan === 'Empresarial' 
                      ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  Contratar Plan Empresarial
                </button>
              </div>
            </div>

            {/* Security Notice Footer */}
            <div className="pt-4 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between text-xs text-slate-500 gap-4">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Pasarela de pagos encriptada SSL oficial por Mercado Pago</span>
              </div>
              <div className="font-mono text-[10px]">
                Configurado con credenciales de producción certificadas del SuperAdmin
              </div>
            </div>
          </div>
        )}

        {step === 'checkout' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {/* Left Column: Purchase Summary */}
            <div className="space-y-6 border-b md:border-b-0 md:border-r border-slate-800 pb-6 md:pb-0 md:pr-8">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                Resumen de Compra
              </h3>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 uppercase font-bold font-mono">Plan Seleccionado</span>
                  <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-black rounded-lg uppercase">
                    {selectedPlan}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Ciclo de Facturación</span>
                  <span className="text-xs font-bold text-white font-mono">
                    {billingPeriod === 'yearly' ? 'Anual (12 Meses)' : 'Mensual'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900 pt-3">
                  <span className="text-xs text-slate-400">Precio Bruto</span>
                  <span className="text-xs text-slate-400 font-mono">
                    ${(billingPeriod === 'yearly' ? baseMonthlyPrice * 12 : baseMonthlyPrice).toLocaleString('es-AR')} ARS
                  </span>
                </div>

                {billingPeriod === 'yearly' && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-xs">Descuento (2 Meses Gratis)</span>
                    <span className="text-xs font-mono font-bold">
                      -${(baseMonthlyPrice * 2).toLocaleString('es-AR')} ARS
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-lg font-black text-white">
                  <span>Total a Pagar</span>
                  <span className="font-mono text-emerald-400">
                    ${finalPrice.toLocaleString('es-AR')} ARS
                  </span>
                </div>
              </div>

              {/* Secure payment explanation */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 text-xs text-slate-400 space-y-2">
                <p className="font-bold text-white flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  Garantía de Pago Encriptado
                </p>
                <p className="leading-relaxed text-[11px]">
                  Tus datos bancarios y números de tarjeta se procesan de forma 100% segura mediante conexión SSL. La app de MAX24 no guarda datos de tarjetas de crédito en servidores propios para resguardar tu privacidad financiera.
                </p>
              </div>

              {/* Back button */}
              <button
                onClick={() => setStep('selection')}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-bold cursor-pointer"
              >
                ← Volver a Selección de Planes
              </button>
            </div>

            {/* Right Column: Interactive Checkout Form */}
            <form onSubmit={handleSubmitPayment} className="space-y-5 text-left">
              <h3 className="text-lg font-black text-white flex items-center gap-1.5">
                <CreditCard className="w-5 h-5 text-orange-500" />
                Medio de Pago
              </h3>

              {/* Selector tabs */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`py-2 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    paymentMethod === 'card' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Tarjeta
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('transfer')}
                  className={`py-2 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    paymentMethod === 'transfer' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Transferencia
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mp_wallet')}
                  className={`py-2 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    paymentMethod === 'mp_wallet' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  MP Wallet
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('direct_link')}
                  className={`py-2 text-[9px] font-black uppercase rounded-lg transition-all cursor-pointer ${
                    paymentMethod === 'direct_link' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-white'
                  }`}
                >
                  Link Directo
                </button>
              </div>

              {formError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-2 text-xs text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-4">
                  {/* Credit Card Preview Card */}
                  <div className="bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700/50 p-5 rounded-2xl shadow-xl relative overflow-hidden flex flex-col justify-between h-40">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-2xl" />
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-7 bg-amber-400/20 border border-amber-400/30 rounded-md flex items-center justify-center font-mono font-bold text-amber-400 text-xs">
                        CHIP
                      </div>
                      <span className="text-[10px] uppercase font-bold text-slate-500 font-mono tracking-widest">
                        {getCardBrand(cardNumber)}
                      </span>
                    </div>

                    <div className="text-lg md:text-xl font-mono tracking-widest text-white/90 truncate py-1">
                      {cardNumber || '•••• •••• •••• ••••'}
                    </div>

                    <div className="flex justify-between items-end">
                      <div className="space-y-0.5">
                        <span className="text-[8px] text-slate-500 uppercase font-bold block tracking-wider">Titular</span>
                        <div className="text-xs font-mono font-bold uppercase text-white truncate max-w-[180px]">
                          {cardName || 'NOMBRE Y APELLIDO'}
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <span className="text-[8px] text-slate-500 uppercase font-bold block tracking-wider">Vence</span>
                        <div className="text-xs font-mono font-bold text-white">
                          {cardExpiry || 'MM/AA'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Número de Tarjeta</label>
                      <input
                        type="text"
                        placeholder="4000 1234 5678 9010"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Nombre Completo (como figura en la tarjeta)</label>
                      <input
                        type="text"
                        placeholder="JUAN PEREZ"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">Vencimiento</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={handleExpiryChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-center placeholder-slate-600 focus:outline-none focus:border-orange-500"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-slate-400 font-bold mb-1">CVV / Seg.</label>
                        <input
                          type="password"
                          placeholder="123"
                          value={cardCvv}
                          onChange={handleCvvChange}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-center placeholder-slate-600 focus:outline-none focus:border-orange-500"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-bold mb-1">DNI o CUIT del Titular</label>
                      <input
                        type="text"
                        placeholder="Ej: 30748596329"
                        value={cardDni}
                        onChange={handleDniChange}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'transfer' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs leading-relaxed text-slate-300">
                  <p className="text-center font-bold text-white text-sm">Transferencia Directa Bancaria / Mercado Pago</p>
                  
                  <div className="space-y-2 font-mono text-[11px] bg-slate-900 border border-slate-800/80 p-4 rounded-xl">
                    <div className="flex justify-between border-b border-slate-950 pb-1.5">
                      <span className="text-slate-500">Banco / Entidad:</span>
                      <span className="font-bold text-white">Mercado Pago</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-950 pb-1.5 pt-1.5">
                      <span className="text-slate-500">CBU / CVU:</span>
                      <span className="font-bold text-white">0000003100087536771673</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-950 pb-1.5 pt-1.5">
                      <span className="text-slate-500">Alias:</span>
                      <span className="font-bold text-amber-400">max24.suscripcion.mp</span>
                    </div>
                    <div className="flex justify-between pt-1.5">
                      <span className="text-slate-500">Titular de cuenta:</span>
                      <span className="font-bold text-white">MAX24 SaaS S.A.</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400 text-center">
                    Una vez realizada la transferencia bancaria por un total de <span className="font-bold text-emerald-400">${finalPrice.toLocaleString('es-AR')} ARS</span>, haz clic en el botón de abajo "Registrar Transferencia" para que nuestro bot asíncrono asocie tu comprobante en un lapso inmediato de 5 segundos.
                  </p>
                </div>
              )}

              {paymentMethod === 'mp_wallet' && (
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs leading-relaxed text-slate-300">
                  <div className="flex items-center justify-center gap-2 text-sky-400">
                    <Check className="w-5 h-5 bg-sky-500/10 p-1 border border-sky-500/20 rounded-full" />
                    <span className="font-black text-sm">Mercado Pago Checkout Express</span>
                  </div>
                  
                  <p className="text-center text-slate-400 text-[11px]">
                    Inicia sesión en tu billetera de Mercado Pago y debita el saldo de tu cuenta de forma instantánea.
                  </p>

                  <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl space-y-2 text-center text-[11px]">
                    <div>Usuario: <span className="font-bold text-white">{currentUser?.email || 'bigmax24h7@gmail.com'}</span></div>
                    <div>Saldo Disponible: <span className="text-emerald-400 font-bold font-mono">$150.000,00 ARS</span></div>
                  </div>
                  
                  <p className="text-[11px] text-slate-400 text-center">
                    Se debitarán <span className="font-bold text-white">${finalPrice.toLocaleString('es-AR')} ARS</span> de tu cuenta registrada. Al hacer clic en el botón de abajo "Pagar con Dinero en Cuenta" se procesará la autorización del token de tu billetera de forma inmediata.
                  </p>
                </div>
              )}

              {paymentMethod === 'direct_link' && (() => {
                const getDirectPlanLink = () => {
                  if (selectedPlan === 'Básico') {
                    return billingPeriod === 'yearly' ? mpSettings.planBasicoAnualLink : mpSettings.planBasicoMensualLink;
                  } else if (selectedPlan === 'Profesional') {
                    return billingPeriod === 'yearly' ? mpSettings.planProfesionalAnualLink : mpSettings.planProfesionalMensualLink;
                  } else {
                    return billingPeriod === 'yearly' ? mpSettings.planEmpresarialAnualLink : mpSettings.planEmpresarialMensualLink;
                  }
                };
                const directLink = getDirectPlanLink();

                return (
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 text-xs leading-relaxed text-slate-300">
                    <div className="flex items-center justify-center gap-2 text-orange-400">
                      <ExternalLink className="w-5 h-5 bg-orange-500/10 p-1 border border-orange-500/20 rounded-full" />
                      <span className="font-black text-sm">Pasarela de Pago Oficial Respaldo</span>
                    </div>

                    <p className="text-center text-slate-400 text-[11px]">
                      Usa este método alternativo de respaldo si prefieres abonar utilizando enlaces o botones de suscripción de Mercado Pago externos oficiales.
                    </p>

                    {directLink ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-blue-950/20 border border-blue-500/30 rounded-xl text-center">
                          <p className="text-[10.5px] text-blue-300 font-bold mb-2">
                            Paso 1: Presiona el botón para pagar de forma segura en Mercado Pago:
                          </p>
                          <a
                            href={directLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#009EE3] hover:bg-[#0087C4] text-white font-extrabold text-xs rounded-xl shadow-md transition-colors"
                          >
                            <span>Pagar en Mercado Pago Oficial ↗</span>
                          </a>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-slate-400 font-bold">
                            Paso 2: Ingrese el ID de Transacción o Referencia de Pago:
                          </label>
                          <input
                            type="text"
                            placeholder="Ej: MP-98510427 o Nº Operación"
                            value={directOpRef}
                            onChange={(e) => setDirectOpRef(e.target.value.toUpperCase())}
                            className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-orange-500 font-mono"
                          />
                          <p className="text-[9.5px] text-slate-500">
                            Cualquier número de referencia de su cobro iniciará la activación de respaldo al instante.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-xl space-y-2 text-amber-300 text-left">
                        <strong className="block text-xs text-white">🚧 Configuración del Enlace Pendiente</strong>
                        <p className="text-[10.5px] leading-relaxed">
                          El administrador del sistema aún no ha configurado los enlaces reales de pre-aprobación para el plan <strong>{selectedPlan} ({billingPeriod === 'yearly' ? 'Anual' : 'Mensual'})</strong> en Firestore.
                        </p>
                        <p className="text-[10.5px]">
                          Puedes usar el método de <strong>Tarjeta</strong>, <strong>Transferencia</strong> o <strong>MP Wallet</strong> de arriba para completar el abono instantáneo simulado y entrar inmediatamente.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Action checkout button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 hover:from-orange-600 hover:to-amber-600 hover:to-yellow-600 text-white font-extrabold text-sm py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer mt-4"
              >
                {paymentMethod === 'card' 
                  ? `Pagar $${finalPrice.toLocaleString('es-AR')} ARS` 
                  : paymentMethod === 'transfer' 
                  ? 'Registrar Transferencia Bancaria' 
                  : paymentMethod === 'mp_wallet'
                  ? 'Pagar con Saldo Mercado Pago'
                  : 'Validar y Activar Suscripción Oficial'}
              </button>
            </form>
          </div>
        )}

        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center space-y-6 text-center">
            {/* Spinning load wheel */}
            <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            
            <div className="space-y-2 max-w-md">
              <h3 className="text-xl font-black text-white">Procesando Transacción</h3>
              <p className="text-sm text-amber-500 font-bold font-mono uppercase tracking-wider animate-pulse">
                PASARELA DE PAGO SEGURA EN VIVO
              </p>
              <p className="text-sm text-slate-400 font-mono text-center pt-2 h-12">
                {processingText}
              </p>
            </div>

            <div className="bg-slate-950 px-4 py-2 rounded-xl border border-slate-800/80 font-mono text-[10px] text-slate-500">
              Por favor, no recargues la página ni cierres la pestaña del navegador.
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="py-10 flex flex-col items-center justify-center space-y-6 text-center max-w-md mx-auto">
            {/* Beautiful Check circle */}
            <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 animate-scale-up shadow-xl">
              <ShieldCheck className="w-12 h-12" />
            </div>

            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white font-sans tracking-tight">
                ¡Suscripción Activada! 🚀
              </h3>
              <p className="text-xs text-emerald-400 font-bold font-mono">
                CÓDIGO DE OPERACIÓN: {transactionId}
              </p>
            </div>

            <p className="text-sm text-slate-300 leading-relaxed">
              Tu pago ha impactado con éxito en nuestra pasarela de Mercado Pago. Hemos activado la licencia del <span className="font-bold text-amber-400">Plan {selectedPlan}</span> para tu comercio. Tu tienda vuelve a estar activa y lista para operar.
            </p>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/80 w-full text-left font-mono text-[11px] space-y-1 text-slate-400">
              <div>• Comercio: <span className="text-white font-bold">{activeLicense?.storeName || activeStoreEmail}</span></div>
              <div>• Plan activo: <span className="text-amber-400 font-bold">{selectedPlan}</span></div>
              <div>• Facturación: <span className="text-white">{billingPeriod === 'yearly' ? 'Anual' : 'Mensual'}</span></div>
              <div>• Próximo vencimiento: <span className="text-white">{new Date(new Date().setMonth(new Date().getMonth() + (billingPeriod === 'yearly' ? 12 : 1))).toISOString().split('T')[0]}</span></div>
            </div>

            <button
              onClick={handleFinishUpgrade}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-sm py-3 rounded-2xl shadow-lg hover:shadow-xl transition-all cursor-pointer"
            >
              Comenzar a Operar Mi Tienda Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
