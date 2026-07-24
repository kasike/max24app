import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Phone, 
  Heart, 
  Camera, 
  Clock, 
  QrCode, 
  CreditCard, 
  CheckCircle2, 
  Bell, 
  Plus, 
  Minus, 
  Trash2, 
  Store,
  ArrowRight,
  Sparkles,
  SearchCode,
  Smartphone,
  CheckCircle,
  HelpCircle,
  X,
  ChevronRight,
  DollarSign,
  Barcode,
  Volume2,
  Contact,
  User,
  UserCog,
  Copy
} from 'lucide-react';
import { Employee, Product, StoreSettings, Customer, Sale } from '../types';
import { db } from '../firebase';
import { collection, getDocs, setDoc, doc, updateDoc, getDoc } from 'firebase/firestore';

interface BuyerPortalProps {
  currentUser: Employee;
  onLogout: () => void;
  onUpdateCurrentUser?: (updated: Employee) => void;
}

export default function BuyerPortal({ currentUser, onLogout, onUpdateCurrentUser }: BuyerPortalProps) {
  // Navigation tabs for the Buyer
  const [activeTab, setActiveTab] = useState<'my_stores' | 'shop_online' | 'scan_n_pay' | 'my_receipts' | 'my_profile'>('my_stores');

  // Buyer profile form states - initialized from currentUser
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePhone, setProfilePhone] = useState(currentUser.phone || '');
  const [profileDocId, setProfileDocId] = useState(() => {
    // extract numeric DNI from format "DNI: xxxxx" or similar
    const raw = currentUser.emergencyContact || '';
    if (raw.toUpperCase().startsWith('DNI:')) {
      return raw.replace(/DNI\s*:\s*/i, '').trim();
    }
    return raw.trim();
  });
  const [profilePassword, setProfilePassword] = useState(currentUser.password || '');
  const [profileAddress, setProfileAddress] = useState(currentUser.shift === 'Rotativo' ? '' : currentUser.shift || ''); // Use shift field to store delivery address so we don't break Employee structure
  const [profileSuccessMsg, setProfileSuccessMsg] = useState('');
  const [profileErrorMsg, setProfileErrorMsg] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // WhatsApp automatic templates
  const [waSelectedStoreEmail, setWaSelectedStoreEmail] = useState('');
  const [waTemplateType, setWaTemplateType] = useState('consulta_general');
  const [waCustomMessage, setWaCustomMessage] = useState('');

  // Stores lists
  const [allStores, setAllStores] = useState<StoreSettings[]>([]);
  const [myFavoriteEmails, setMyFavoriteEmails] = useState<string[]>(() => {
    const saved = localStorage.getItem(`favorites_${currentUser.email}`);
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedStoreEmail, setSelectedStoreEmail] = useState<string>('');
  
  // Products and State for selected store
  const [storeProducts, setStoreProducts] = useState<Product[]>([]);
  const [selectedStoreSettings, setSelectedStoreSettings] = useState<StoreSettings | null>(null);

  // QR and Bank Alias copying states
  const [copiedAliasStore, setCopiedAliasStore] = useState<string>('');
  const [isQRScannerModalOpen, setIsQRScannerModalOpen] = useState<boolean>(false);
  const [manualStoreCode, setManualStoreCode] = useState<string>('');
  const [qrScannerError, setQrScannerError] = useState<string>('');
  const [deepLinkToast, setDeepLinkToast] = useState<string>('');

  // Search filter
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('Todos');

  // Online Store Cart / Physical Scan Cart
  const [onlineCart, setOnlineCart] = useState<{ product: Product; quantity: number }[]>([]);
  const [scanCart, setScanCart] = useState<{ product: Product; quantity: number }[]>([]);

  // Scanning mode states
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>('');

  // Surcharges
  const [isSurchargePeriod, setIsSurchargePeriod] = useState(false);

  // Checkout modal
  const [checkoutMode, setCheckoutMode] = useState<'online' | 'scan' | null>(null);
  const [mpMethod, setMpMethod] = useState<'Dinero' | 'Debito' | 'Credito' | 'Transferencia'>('Dinero');
  const [isMpSubmitted, setIsMpSubmitted] = useState(false);
  const [purchaseSuccess, setPurchaseSuccess] = useState<Sale | null>(null);

  // Buyer purchase list (Receipts)
  const [buyerReceipts, setBuyerReceipts] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(`receipts_${currentUser.email}`);
    return saved ? JSON.parse(saved) : [];
  });

  // Fetch all stores from database
  useEffect(() => {
    async function loadStores() {
      try {
        const snap = await getDocs(collection(db, 'storeSettings'));
        const loaded: StoreSettings[] = [];
        snap.forEach(d => {
          const data = d.data() as StoreSettings;
          if (data.name) {
            // Generate a unique store code if missing for searching
            if (!data.storeCode) {
              const cleaned = data.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase();
              data.storeCode = `M24-${cleaned}`;
            }
            if (!data.email) {
              data.email = d.id; // DocId is email
            }
            loaded.push(data);
          }
        });

        // Add defaults if Firestore list is empty
        if (loaded.length === 0) {
          const fallbackStores: StoreSettings[] = [
            {
              name: 'Max24 Express Belgrano',
              address: 'Av. Cabildo 2424, CABA, Argentina',
              phone: '+54 11 5566-7788',
              email: 'pezziniarg@gmail.com',
              schedule: '08:00 a 22:00',
              storeCode: 'M24-BELGRANO',
              detailedHours: [],
              isConfigured: true,
              nightSurchargeActive: true,
              nightSurchargePercent: 10,
              nightSurchargeStart: '22:00',
              nightSurchargeEnd: '08:00'
            },
            {
              name: 'BigMAX 24 Horas',
              address: 'Av. Pueyrredón 888, CABA, Argentina',
              phone: '+54 11 7766-5544',
              email: 'bigmax24h7@gmail.com',
              schedule: '24 Horas Autocontrol',
              storeCode: 'M24-BIGMAX',
              detailedHours: [],
              isConfigured: true,
              nightSurchargeActive: true,
              nightSurchargePercent: 15,
              nightSurchargeStart: '23:00',
              nightSurchargeEnd: '07:00'
            }
          ];
          for (const fs of fallbackStores) {
            await setDoc(doc(db, 'storeSettings', fs.email!), fs);
          }
          setAllStores(fallbackStores);
        } else {
          setAllStores(loaded);
        }
      } catch (e) {
        console.warn("Could not load stores from Firebase. Using offline presets:", e);
        // Offline Fallback
        setAllStores([
          {
            name: 'Max24 Express Belgrano',
            address: 'Av. Cabildo 2424, CABA, Argentina',
            phone: '+54 11 5566-7788',
            email: 'pezziniarg@gmail.com',
            schedule: '08:00 a 22:00',
            storeCode: 'M24-BELGRANO',
            nightSurchargeActive: true,
            nightSurchargePercent: 10,
            nightSurchargeStart: '22:00',
            nightSurchargeEnd: '08:00'
          },
          {
            name: 'BigMAX 24 Horas',
            address: 'Av. Pueyrredón 888, CABA, Argentina',
            phone: '+54 11 7766-5544',
            email: 'bigmax24h7@gmail.com',
            schedule: '24 Horas Autocontrol',
            storeCode: 'M24-BIGMAX',
            nightSurchargeActive: true,
            nightSurchargePercent: 15,
            nightSurchargeStart: '23:00',
            nightSurchargeEnd: '07:00'
          }
        ]);
      }
    }
    loadStores();
  }, []);

  // Sync favorites & receipts to local storage
  useEffect(() => {
    localStorage.setItem(`favorites_${currentUser.email}`, JSON.stringify(myFavoriteEmails));
  }, [myFavoriteEmails, currentUser]);

  useEffect(() => {
    localStorage.setItem(`receipts_${currentUser.email}`, JSON.stringify(buyerReceipts));
  }, [buyerReceipts, currentUser]);

  // Deep-link storeCode QR Auto-Subscription & Selection logic
  useEffect(() => {
    if (allStores.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const code = params.get('storeCode');
    if (code) {
      const codeUpper = code.toUpperCase().trim();
      const matchedStore = allStores.find(s => 
        (s.storeCode && s.storeCode.toUpperCase() === codeUpper) || 
        (s.email && s.email.toUpperCase() === codeUpper)
      );
      
      if (matchedStore && matchedStore.email) {
        const storeEmail = matchedStore.email;
        // Auto subscribe & register as favorite
        if (!myFavoriteEmails.includes(storeEmail)) {
          setMyFavoriteEmails(prev => [...prev, storeEmail]);
          // register customer in Firestore
          try {
            const customerId = `cust-buyer-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '')}`;
            const newCustomer = {
              id: customerId,
              name: currentUser.name,
              email: currentUser.email,
              phone: currentUser.phone || '+54 11 9999-9999',
              docId: 'DNI ' + Math.floor(10000000 + Math.random() * 80000000),
              address: currentUser.emergencyContact || 'Domicilio Comprador',
              debtBalance: 0,
              storeEmail: storeEmail
            };
            setDoc(doc(db, 'storeSettings', storeEmail, 'customers', customerId), newCustomer);
          } catch(e) {
            console.warn("Deep-link error in auto-customer register:", e);
          }
        }
        
        // Select & Connect
        setSelectedStoreEmail(storeEmail);
        setActiveTab('my_stores');
        setDeepLinkToast(`¡Comercio "${matchedStore.name}" (${matchedStore.storeCode || 'S/C'}) agregado y conectado automáticamente desde el QR!`);
        
        // Clear parameter from address bar
        window.history.replaceState({}, document.title, window.location.pathname);
        setTimeout(() => setDeepLinkToast(''), 6000);
      }
    }
  }, [allStores]);

  // Handle selected store changes (load products)
  useEffect(() => {
    if (!selectedStoreEmail) {
      setStoreProducts([]);
      setSelectedStoreSettings(null);
      return;
    }

    const matchedStore = allStores.find(s => s.email === selectedStoreEmail);
    if (matchedStore) {
      setSelectedStoreSettings(matchedStore);
    }

    async function loadStoreProducts() {
      try {
        const snap = await getDocs(collection(db, 'storeSettings', selectedStoreEmail, 'products'));
        const loaded: Product[] = [];
        snap.forEach(d => {
          const productData = d.data() as Product;
          loaded.push(productData);
        });
        setStoreProducts(loaded);
      } catch (e) {
        console.warn("Could not load products of store from Firebase", e);
        // Fallback to initial products set only for demo/prueba stores
        const isDemo = selectedStoreEmail === 'prueba@max24app.com' || selectedStoreEmail === 'prueba' || selectedStoreEmail === 'global' || selectedStoreEmail === 'pezziniarg@gmail.com';
        if (isDemo) {
          setStoreProducts([
            { id: 'prod-1', name: 'Aceite de Girasol 1.5L', sku: 'ACE-GIR-15', category: 'Alimentos', price: 3200, cost: 2100, stock: 45, minStock: 10, unit: 'Unidades', storeEmail: selectedStoreEmail },
            { id: 'prod-2', name: 'Arroz Integral Extra 1Kg', sku: 'ARR-INT-1K', category: 'Alimentos', price: 1500, cost: 950, stock: 8, minStock: 15, unit: 'Unidades', storeEmail: selectedStoreEmail },
            { id: 'prod-3', name: 'Leche Entera Larga Vida 1L', sku: 'LEC-LON-1L', category: 'Lácteos', price: 1200, cost: 800, stock: 120, minStock: 25, unit: 'Unidades', storeEmail: selectedStoreEmail },
            { id: 'prod-4', name: 'Detergente Líquido Ropa 3L', sku: 'DET-LIQ-3L', category: 'Limpieza', price: 5400, cost: 3500, stock: 22, minStock: 5, unit: 'Unidades', storeEmail: selectedStoreEmail },
            { id: 'prod-5', name: 'Café Molido Suave 500g', sku: 'CAF-SUA-50', category: 'Alimentos', price: 4800, cost: 3100, stock: 30, minStock: 8, unit: 'Unidades', storeEmail: selectedStoreEmail },
            { id: 'prod-6', name: 'Manzanas Red Delicious x Kg', sku: 'MAN-RED-KG', category: 'Frescos', price: 2500, cost: 1400, stock: 35, minStock: 15, unit: 'Kg', storeEmail: selectedStoreEmail }
          ]);
        } else {
          setStoreProducts([]);
        }
      }
    }

    loadStoreProducts();
  }, [selectedStoreEmail, allStores]);

  // Check night surcharge in real time
  useEffect(() => {
    if (!selectedStoreSettings || !selectedStoreSettings.nightSurchargeActive) {
      setIsSurchargePeriod(false);
      return;
    }

    function checkSurcharge() {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMin = now.getMinutes();
      const currentTimeInMins = currentHour * 60 + currentMin;

      const [startH, startM] = (selectedStoreSettings!.nightSurchargeStart || "22:00").split(':').map(Number);
      const [endH, endM] = (selectedStoreSettings!.nightSurchargeEnd || "08:00").split(':').map(Number);
      
      const startMins = startH * 60 + startM;
      const endMins = endH * 60 + endM;

      let active = false;
      if (startMins > endMins) {
        active = currentTimeInMins >= startMins || currentTimeInMins < endMins;
      } else {
        active = currentTimeInMins >= startMins && currentTimeInMins < endMins;
      }
      setIsSurchargePeriod(active);
    }

    checkSurcharge();
    const interval = setInterval(checkSurcharge, 30000);
    return () => clearInterval(interval);
  }, [selectedStoreSettings]);

  // Helper for applying surcharge to product price
  const getProductPrice = (product: Product) => {
    if (isSurchargePeriod && selectedStoreSettings?.nightSurchargeActive) {
      const rate = 1 + (selectedStoreSettings.nightSurchargePercent || 10) / 100;
      return Math.round(product.price * rate);
    }
    return product.price;
  };

  // Add / Remove Store favorites
  const toggleFavoriteStore = async (store: StoreSettings) => {
    const email = store.email!;
    if (myFavoriteEmails.includes(email)) {
      setMyFavoriteEmails(prev => prev.filter(e => e !== email));
      if (selectedStoreEmail === email) {
        setSelectedStoreEmail('');
      }
    } else {
      setMyFavoriteEmails(prev => [...prev, email]);
      setSelectedStoreEmail(email);

      // CRITICAL: Auto-register customer data to this store's customer list in Firebase!
      try {
        const customerId = `cust-buyer-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '')}`;
        const newCustomer: Customer = {
          id: customerId,
          name: currentUser.name,
          email: currentUser.email,
          phone: currentUser.phone || '+54 11 9999-9999',
          docId: 'DNI ' + Math.floor(10000000 + Math.random() * 80000000),
          address: currentUser.emergencyContact || 'Domicilio Comprador',
          debtBalance: 0,
          storeEmail: email // Link tenant store
        };
        // Set registry onto Firestore collection "customers"
        await setDoc(doc(db, 'storeSettings', email, 'customers', customerId), newCustomer);
        console.log(`Auto-registered customer ${currentUser.name} successfully into Store: ${store.name}`);
      } catch (err) {
        console.warn("Could not automatically register client card into Store Database on Firestore:", err);
      }
    }
  };

  // Online Cart Modifiers
  const updateOnlineCartQty = (product: Product, delta: number) => {
    setOnlineCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) {
          return prev.filter(item => item.product.id !== product.id);
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: nextQty } : item);
      } else if (delta > 0) {
        return [...prev, { product, quantity: delta }];
      }
      return prev;
    });
  };

  // Physical Scan-Shopping Modifiers
  const updateScanCartQty = (product: Product, delta: number) => {
    setScanCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        const nextQty = existing.quantity + delta;
        if (nextQty <= 0) {
          return prev.filter(item => item.product.id !== product.id);
        }
        return prev.map(item => item.product.id === product.id ? { ...item, quantity: nextQty } : item);
      } else if (delta > 0) {
        return [...prev, { product, quantity: delta }];
      }
      return prev;
    });
  };

  // Beep sound generator for barcode scanning
  const playBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1050, ctx.currentTime);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      console.log("Audio beep bypassed due to iframe user gesture lock.");
    }
  };

  // Simulated scan of product
  const simulateProductScan = (product: Product) => {
    playBeep();
    setScanStatus(`¡Escaneado con éxito: ${product.name}!`);
    updateScanCartQty(product, 1);
    setTimeout(() => setScanStatus(''), 2500);
  };

  // Math getters
  const getCartTotal = (cart: { product: Product; quantity: number }[]) => {
    return cart.reduce((sum, item) => sum + (getProductPrice(item.product) * item.quantity), 0);
  };

  // Checkout process with Mercado Pago Argentina
  const handleProceedCheckout = (mode: 'online' | 'scan') => {
    const cart = mode === 'online' ? onlineCart : scanCart;
    if (cart.length === 0) return;
    setCheckoutMode(mode);
    setIsMpSubmitted(false);
    setPurchaseSuccess(null);
  };

  const handleConfirmMercadoPagoPayment = async () => {
    setIsMpSubmitted(true);
    const mode = checkoutMode!;
    const cart = mode === 'online' ? onlineCart : scanCart;
    const total = getCartTotal(cart);

    // Formulate sale data
    const transactionId = `V-ONLINE-${Date.now().toString().slice(-4)}`;
    const customerObj: Customer = {
      id: `cust-buyer-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '')}`,
      name: profileName || currentUser.name,
      email: profileEmail || currentUser.email,
      phone: profilePhone || currentUser.phone || '',
      docId: profileDocId ? `DNI ${profileDocId}` : '',
      address: profileAddress || (currentUser.shift === 'Rotativo' ? '' : currentUser.shift) || 'Domicilio Comprador',
      storeEmail: selectedStoreEmail
    };

    const sale: Sale = {
      id: transactionId,
      date: new Date().toISOString(),
      items: cart.map(item => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        price: getProductPrice(item.product)
      })),
      subtotal: total,
      discount: 0,
      tax: Math.round(total * 0.21),
      total: total,
      paymentMethod: 'MercadoPago',
      cashReceived: total,
      change: 0,
      sellerId: 'buyer-api',
      sellerName: `${currentUser.name} (Público)`,
      storeEmail: selectedStoreEmail,
      isOnlineOrder: true,
      status: mode === 'scan' ? 'Pendiente Control' : 'Completado', // Presencial requires scanning control validation!
      customer: customerObj
    };

    try {
      // 1. Sync checkout sale into global sales table in Firebase Firestore
      await setDoc(doc(db, 'storeSettings', selectedStoreEmail, 'sales', transactionId), sale);

      // 2. Decrement product stocks inside Firebase Firestore
      for (const item of cart) {
        const prodRef = doc(db, 'storeSettings', selectedStoreEmail, 'products', item.product.id);
        const nextStock = Math.max(0, item.product.stock - item.quantity);
        await updateDoc(prodRef, { stock: nextStock });
      }

      // 3. Trigger live alert/notification inside Selected Store
      const notificationId = `notif-${Date.now()}`;
      const storeNotification = {
        id: notificationId,
        buyerName: profileName || currentUser.name,
        buyerEmail: profileEmail || currentUser.email,
        buyerPhone: profilePhone || currentUser.phone || '',
        buyerAddress: profileAddress || (currentUser.shift === 'Rotativo' ? '' : currentUser.shift) || 'Domicilio Comprador',
        type: mode === 'scan' ? 'Escaneo Presencial Corredor' : 'Pedido de Compra Online',
        total: total,
        itemsCount: cart.reduce((acc, i) => acc + i.quantity, 0),
        items: cart.map(item => `${item.quantity}x ${item.product.name}`),
        date: new Date().toISOString(),
        paymentStatus: 'Aprobado Mercado Pago (Argentina)',
        isRead: false,
        saleId: transactionId
      };
      
      // Store under active notifications
      await setDoc(doc(db, `storeNotifications_${selectedStoreEmail}`, notificationId), storeNotification);

      // Success hooks
      setBuyerReceipts(prev => [sale, ...prev]);
      setPurchaseSuccess(sale);
      
      // Clear relevant cart
      if (mode === 'online') {
        setOnlineCart([]);
      } else {
        setScanCart([]);
      }
    } catch (err) {
      console.error("Failure submitting sale transaction to Firestore:", err);
      // Fallback offline simulated success
      setBuyerReceipts(prev => [sale, ...prev]);
      setPurchaseSuccess(sale);
      if (mode === 'online') {
        setOnlineCart([]);
      } else {
        setScanCart([]);
      }
    }
  };

  // Profile data save and WhatsApp automation triggers
  const handleSaveBuyerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      setProfileErrorMsg('El nombre no puede quedar vacío.');
      return;
    }
    if (!profileEmail.trim() || !profileEmail.includes('@')) {
      setProfileErrorMsg('Por favor ingresa un correo electrónico válido.');
      return;
    }

    setIsSavingProfile(true);
    setProfileSuccessMsg('');
    setProfileErrorMsg('');

    try {
      // Simulate database latency
      await new Promise(resolve => setTimeout(resolve, 850));

      const updatedUser: Employee = {
        ...currentUser,
        name: profileName.trim(),
        email: profileEmail.trim().toLowerCase(),
        username: profileEmail.trim().toLowerCase(),
        phone: profilePhone.trim(),
        emergencyContact: `DNI: ${profileDocId.trim()}`,
        password: profilePassword ? profilePassword.trim() : currentUser.password,
        shift: profileAddress.trim() || 'Rotativo', // Save custom delivery address in shift to preserve Employee structure
      };

      // 1. Update in Firestore employees collection
      await setDoc(doc(db, 'employees', currentUser.id), updatedUser);

      // 2. Automatically register as customer in all favorite stores to let store owner see updated client details
      const customerId = `cust-buyer-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '')}`;
      for (const st of myFavoriteEmails) {
        const storeCustomerId = `${customerId}-${st.replace(/[^a-zA-Z0-9]/g, '')}`;
        const newCustomer: Customer = {
          id: storeCustomerId,
          name: profileName.trim(),
          email: profileEmail.trim().toLowerCase(),
          phone: profilePhone.trim() || '+54 11 9999-9999',
          docId: 'DNI ' + profileDocId.trim(),
          address: profileAddress.trim() || 'Domicilio Comprador',
          debtBalance: 0,
          storeEmail: st
        };
        await setDoc(doc(db, 'storeSettings', st, 'customers', storeCustomerId), newCustomer);
      }

      setProfileSuccessMsg('¡Tu perfil y datos de cliente han sido actualizados con éxito en la nube Firestore!');
      
      // Notify parent
      if (onUpdateCurrentUser) {
        onUpdateCurrentUser(updatedUser);
      }
    } catch (err: any) {
      console.error("Error saving buyer profile:", err);
      setProfileErrorMsg('Error al conectar con la base de datos Firestore: ' + err.message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const getWATemplateText = (type: string, storeName: string) => {
    switch (type) {
      case 'consulta_general':
        return `Hola, *${storeName}*! Les escribo desde mi perfil de usuario de la plataforma MAX24. Mi nombre es *${profileName}* (DNI: ${profileDocId}). Quería realizarles una consulta.`;
      case 'consulta_pedido':
        return `Hola, *${storeName}*! ¿Cómo están? Les escribo desde mi perfil de cliente. Mi nombre es *${profileName}*. Quería consultar si mi pedido online con recibos registrados bajo mi email (${profileEmail}) ya se encuentra listo para retirar o enviar a mi domicilio: _${profileAddress || 'No cargado aún'}_. ¡Muchas gracias!`;
      case 'consulta_deuda':
        return `Estimados de *${storeName}*, buenas. Mi nombre es *${profileName}* (DNI/CUIT: ${profileDocId}). Me contacto desde mi perfil de la app de MAX24 para consultar el estado actual de mi cuenta corriente de deudas y ver si tengo algún saldo pendiente de pago. ¡Gracias!`;
      case 'consulta_envio':
        return `Hola, *${storeName}*! Mi nombre es *${profileName}*. Quería coordinar el despacho del envío de mi mercadería para el domicilio: _${profileAddress || 'No ingresado aún'}_. Mi teléfono de contacto es ${profilePhone}. ¡Saludos!`;
      default:
        return '';
    }
  };

  const handleOpenAutoWhatsApp = (targetStore: StoreSettings, customTemplateContent?: string) => {
    if (!targetStore || !targetStore.phone) {
      alert("Este comercio no posee un teléfono de WhatsApp configurado.");
      return;
    }
    // Clean phone
    const cleaned = targetStore.phone.replace(/[^0-9]/g, '');
    let finalPhone = cleaned;
    if (cleaned.length > 0 && !cleaned.startsWith('54') && cleaned.length <= 11) {
      finalPhone = `549${cleaned}`; // Argentina dial wrapper
    }

    let messageText = '';
    if (customTemplateContent) {
      messageText = customTemplateContent;
    } else if (waTemplateType === 'mensaje_personalizado') {
      messageText = waCustomMessage;
    } else {
      messageText = getWATemplateText(waTemplateType, targetStore.name);
    }

    if (!messageText.trim()) {
      alert("Por favor escribe o selecciona un mensaje para enviar.");
      return;
    }

    const encodedText = encodeURIComponent(messageText);
    const waUrl = `https://wa.me/${finalPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  // Get filtered store listings
  const filteredStores = allStores.filter(store => {
    const q = storeSearchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      store.name.toLowerCase().includes(q) ||
      (store.storeCode && store.storeCode.toLowerCase().includes(q)) ||
      (store.address && store.address.toLowerCase().includes(q))
    );
  });

  // Get active products for current selected store
  const filteredProducts = storeProducts.filter(p => {
    const q = productSearchQuery.toLowerCase().trim();
    const matchesSearch = p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
    const matchesCategory = activeCategory === 'Todos' || p.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Extract category buttons
  const uniqueCategories = ['Todos', ...Array.from(new Set(storeProducts.map(p => p.category)))];

  const currentFavoriteStores = allStores.filter(s => myFavoriteEmails.includes(s.email!));

  return (
    <div className="space-y-6 pb-20 font-sans text-left" id="buyer-portal">
      
      {/* Toast Alert from Deep Link Scanning / Adding */}
      {deepLinkToast && (
        <div className="p-4 bg-emerald-50 border border-emerald-250 text-emerald-950 rounded-2xl flex items-center justify-between shadow-lg animate-pulse relative z-50">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">✓</span>
            <div className="text-left leading-normal">
              <p className="text-xs font-bold text-slate-900">Suscripción Exitosa</p>
              <p className="text-[11px] text-emerald-950/80 leading-tight mt-0.5">{deepLinkToast}</p>
            </div>
          </div>
          <button 
            onClick={() => setDeepLinkToast('')}
            className="text-[11px] font-mono font-bold text-slate-450 hover:text-slate-800 px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg cursor-pointer transition-all"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Greetings buyer board */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-48 h-48 bg-orange-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-[10px] font-bold tracking-widest text-indigo-300 uppercase">
              Público General • Gratuito & Ilimitado
            </span>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight font-sans">
              ¡Hola, {currentUser.name}! 📱
            </h2>
            <p className="text-xs text-slate-300 max-w-xl font-sans font-medium">
              Explora comercios de cercanía, agrégalos a favoritas, llena tu carrito de compras de forma presencial escaneando con tu celular, y paga de forma online con Mercado Pago.
            </p>
          </div>

          <button 
            onClick={onLogout}
            className="self-start md:self-center px-4 py-2 bg-white/10 hover:bg-white/15 text-slate-100 font-bold text-xs rounded-xl border border-white/20 hover:border-white/30 transition-all cursor-pointer"
          >
            Cerrar Sesión General
          </button>
        </div>

        {/* Selected Store Indicator row */}
        {selectedStoreSettings && (
          <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 border border-orange-500/35 flex items-center justify-center text-orange-400">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Comercio Conectado Activo</p>
                <h4 className="text-sm font-black text-white">{selectedStoreSettings.name}</h4>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {selectedStoreSettings.bankAlias && (
                <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-850 px-2.5 py-1 rounded-lg text-[10px]">
                  <span className="text-slate-400 font-semibold">CVU Alias:</span>
                  <span className="text-slate-200 font-mono font-extrabold">{selectedStoreSettings.bankAlias}</span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedStoreSettings.bankAlias!);
                      setCopiedAliasStore(selectedStoreSettings.email!);
                      setTimeout(() => setCopiedAliasStore(''), 2000);
                    }}
                    className="ml-1 text-slate-400 hover:text-orange-400 p-0.5 rounded transition-all cursor-pointer"
                    title="Copiar Alias"
                  >
                    {copiedAliasStore === selectedStoreSettings.email ? (
                      <span className="text-emerald-400 font-mono text-[9px] font-bold">¡Copiado!</span>
                    ) : (
                      <Copy className="w-3 h-3 text-slate-400 hover:text-white" />
                    )}
                  </button>
                </div>
              )}

              <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/35 px-2.5 py-1 rounded-lg text-[10px] font-bold font-mono">
                {selectedStoreSettings.storeCode}
              </span>
              
              {isSurchargePeriod && selectedStoreSettings.nightSurchargeActive && (
                <span className="bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                  🌙 Recargo Nocturno Activo (+{selectedStoreSettings.nightSurchargePercent}%)
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Buyer main navigation tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('my_stores')}
          className={`px-4.5 py-3 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap
            ${activeTab === 'my_stores' 
              ? 'border-indigo-600 font-extrabold text-indigo-600 bg-indigo-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800'}
          `}
        >
          <Heart className="w-4 h-4 shrink-0" />
          Comercios
          {currentFavoriteStores.length > 0 && (
            <span className="ml-1 bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none">{currentFavoriteStores.length}</span>
          )}
        </button>

        <button
          onClick={() => {
            setActiveTab('shop_online');
          }}
          className={`px-4.5 py-3 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap
            ${activeTab === 'shop_online' 
              ? 'border-indigo-600 font-extrabold text-indigo-600 bg-indigo-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800'}
          `}
        >
          <ShoppingBag className="w-4 h-4 shrink-0" />
          Compra Online
        </button>

        <button
          onClick={() => {
            setActiveTab('scan_n_pay');
          }}
          className={`px-4.5 py-3 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap
            ${activeTab === 'scan_n_pay' 
              ? 'border-indigo-600 font-extrabold text-indigo-600 bg-indigo-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800'}
          `}
        >
          <Smartphone className="w-4 h-4 shrink-0" />
          Escáner Presencial
        </button>

        <button
          onClick={() => setActiveTab('my_receipts')}
          className={`px-4.5 py-3 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap
            ${activeTab === 'my_receipts' 
              ? 'border-indigo-600 font-extrabold text-indigo-600 bg-indigo-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800'}
          `}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          Recibos y Facturas
          {buyerReceipts.length > 0 && (
            <span className="ml-1 bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded-full text-[10px] font-mono font-bold leading-none">{buyerReceipts.length}</span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('my_profile')}
          className={`px-4.5 py-3 text-xs font-black rounded-t-xl transition-all flex items-center gap-2 border-b-2 cursor-pointer whitespace-nowrap
            ${activeTab === 'my_profile' 
              ? 'border-indigo-600 font-extrabold text-indigo-600 bg-indigo-50/40' 
              : 'border-transparent text-slate-500 hover:text-slate-800'}
          `}
        >
          <User className="w-4 h-4 shrink-0" />
          Mi Perfil y WhatsApp
        </button>
      </div>

      {/* RENDER CONTENT PANELS */}
      {activeTab === 'my_stores' && (
        <div className="space-y-6" id="buyer-stores-tab">
          
          {/* QR Scan & Manual Store Code adding tool */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-slate-800 space-y-4 text-left">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="bg-orange-500/20 border border-orange-500/35 text-orange-400 px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest uppercase">
                  Acceso Rápido QR / CÓDIGO
                </span>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-orange-400" />
                  Agregar Comercio al Instante
                </h3>
                <p className="text-[11px] text-slate-300 max-w-lg leading-relaxed">
                  Escanea el código QR de un comercio o ingresa su código alfanumérico único para agregarlo inmediatamente a tus favoritos y ver su catálogo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setQrScannerError('');
                  setIsQRScannerModalOpen(true);
                }}
                className="px-4.5 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md shadow-orange-500/10 cursor-pointer self-start sm:self-center transition-all shrink-0"
              >
                <QrCode className="w-4 h-4" />
                Escanear QR de Sucursal
              </button>
            </div>

            <div className="pt-2 border-t border-white/5 flex flex-col md:flex-row gap-3 items-end">
              <div className="w-full space-y-1.5 text-left">
                <label className="text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono">Ingreso de Código de Sucursal:</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 font-mono text-xs">#</span>
                  <input
                    type="text"
                    placeholder="Ej: M24-BELGRANO"
                    value={manualStoreCode}
                    onChange={(e) => {
                      setQrScannerError('');
                      setManualStoreCode(e.target.value.toUpperCase().replace(/\s/g, ''));
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-7 py-2 text-xs font-mono font-extrabold text-white placeholder:text-slate-600 focus:outline-hidden focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!manualStoreCode.trim()) {
                    setQrScannerError("Por favor ingresa un código.");
                    return;
                  }
                  const codeUpper = manualStoreCode.toUpperCase().trim();
                  const found = allStores.find(s => 
                    (s.storeCode && s.storeCode.toUpperCase() === codeUpper) || 
                    (s.email && s.email.toUpperCase() === codeUpper)
                  );

                  if (found && found.email) {
                    const storeEmail = found.email;
                    // subscribe
                    if (!myFavoriteEmails.includes(storeEmail)) {
                      setMyFavoriteEmails(prev => [...prev, storeEmail]);
                      // register customer
                      try {
                        const customerId = `cust-buyer-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '')}`;
                        const newCustomer = {
                          id: customerId,
                          name: currentUser.name,
                          email: currentUser.email,
                          phone: currentUser.phone || '+54 11 9999-9999',
                          docId: 'DNI ' + Math.floor(10000000 + Math.random() * 80000000),
                          address: currentUser.emergencyContact || 'Domicilio Comprador',
                          debtBalance: 0,
                          storeEmail: storeEmail
                        };
                        await setDoc(doc(db, 'storeSettings', storeEmail, 'customers', customerId), newCustomer);
                      } catch (err) {
                        console.warn(err);
                      }
                    }

                    setSelectedStoreEmail(storeEmail);
                    setManualStoreCode('');
                    setQrScannerError('');
                    setDeepLinkToast(`¡Comercio "${found.name}" (${found.storeCode || 'S/C'}) agregado con código con éxito!`);
                    setTimeout(() => setDeepLinkToast(''), 5000);
                  } else {
                    setQrScannerError("Código de sucursal inválido. Intenta con 'MAX24-EXPRESS' o consulta al comerciante.");
                  }
                }}
                className="w-full md:w-auto px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shrink-0"
              >
                <span>Suscripción Rápida</span>
              </button>
            </div>

            {qrScannerError && (
              <p className="text-[11px] text-rose-400 font-bold tracking-wide mt-1 animate-pulse">⚠️ {qrScannerError}</p>
            )}
          </div>
          
          {/* Favorites List */}
          {currentFavoriteStores.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold tracking-widest text-indigo-950 font-mono uppercase">Mis Comercios Favoritos</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentFavoriteStores.map(store => (
                  <div 
                    key={store.email}
                    onClick={() => setSelectedStoreEmail(store.email!)}
                    className={`p-4 bg-white rounded-2xl border transition-all hover:border-indigo-500 cursor-pointer flex items-center justify-between shadow-xs relative overflow-hidden
                      ${selectedStoreEmail === store.email ? 'border-2 border-indigo-600 bg-indigo-50/15' : 'border-slate-200'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center text-indigo-600">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="text-left font-sans leading-none">
                        <h4 className="font-extrabold text-slate-800 text-sm">{store.name}</h4>
                        <p className="text-[11px] text-slate-550 font-semibold mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {store.address}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <span className="bg-slate-100 text-slate-700 px-2 py-1 rounded text-[10px] font-mono font-extrabold">
                        {store.storeCode}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenAutoWhatsApp(store, `Hola, *${store.name}*! Soy *${profileName || currentUser.name}*, me contacto desde de mi perfil en la app MAX24 para realizarles una consulta. `);
                        }}
                        className="p-2 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl hover:bg-emerald-100 cursor-pointer flex items-center justify-center shrink-0"
                        title="Enviar WhatsApp al Comercio"
                      >
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                          <path d="M12.004 2c-5.51 0-9.99 4.49-9.99 10 0 1.91.54 3.7 1.48 5.24l-1.4 5.12 5.24-1.37c1.5.89 3.23 1.4 5.07 1.4 5.51 0 10-4.49 10-10s-4.49-10-10-10zm5.66 14.18c-.24.67-1.19 1.25-1.95 1.41-.53.11-1.22.2-3.54-.76-2.96-1.23-4.88-4.25-5.03-4.45-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.59-.38.79-.38.2 0 .39 0 .57.01.18.01.42-.08.66.5.24.58.83 2.03.9 2.18.07.15.12.33.02.53-.1.2-.15.3-.3.48-.15.18-.31.4-.44.54-.15.15-.31.32-.13.63.18.31.81 1.33 1.73 2.15.92.82 1.7-1.07 2.15-1.21.31-.1.6.01.78.18.18.18 1.15 1.15 1.35 1.25.2.1.33.15.38.24.05.09.05.53-.19 1.2z" />
                        </svg>
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavoriteStore(store);
                        }}
                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 cursor-pointer"
                        title="Quitar de Favoritas"
                      >
                        <Heart className="w-4 h-4 fill-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Directory Search */}
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold tracking-widest text-indigo-950 font-mono uppercase">Directorio de Comercios Registrados</h3>
                <p className="text-xs text-slate-450 mt-1">Busca por nombre o ingresa el código numérico provisto por la sucursal.</p>
              </div>

              <div className="relative w-full md:max-w-xs shrink-0">
                <span className="absolute left-3.5 top-2.5 text-slate-405">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="ej. M24-BELGRANO o Max24..."
                  value={storeSearchQuery}
                  onChange={(e) => setStoreSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-indigo-500/15"
                />
              </div>
            </div>

            {/* List of matching stores */}
            {filteredStores.length === 0 ? (
              <div className="p-12 text-center bg-slate-100 rounded-2xl border border-dashed border-slate-300">
                <Store className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">Ningún comercio coincide con tu búsqueda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="all-stores-directory">
                {filteredStores.map(store => {
                  const isFav = myFavoriteEmails.includes(store.email!);
                  return (
                    <div 
                      key={store.email}
                      className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs flex flex-col justify-between hover:shadow-xs transition-shadow"
                    >
                      <div className="space-y-3.5 text-left leading-normal">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-extrabold text-slate-800 text-sm">{store.name}</h4>
                          <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider shrink-0">
                            {store.storeCode}
                          </span>
                        </div>

                        <div className="space-y-2 text-xs text-slate-500 leading-tight">
                          <p className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {store.address}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {store.phone}
                          </p>
                          <p className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            {store.schedule || '08:00 a 22:00'}
                          </p>

                          {store.bankAlias && (
                            <div className="bg-slate-50 border border-slate-150 p-2 rounded-xl flex items-center justify-between text-[11px] mt-3">
                              <div>
                                <span className="text-slate-400 font-extrabold block text-[8px] uppercase tracking-wider leading-none">ALIAS TRANSFERENCIAS</span>
                                <span className="text-slate-800 font-mono font-black mt-1 inline-block">{store.bankAlias}</span>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(store.bankAlias!);
                                  setCopiedAliasStore(store.email!);
                                  setTimeout(() => setCopiedAliasStore(''), 2000);
                                }}
                                className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 font-black rounded-lg text-[10px] transition-all flex items-center gap-1 cursor-pointer shrink-0"
                                title="Copiar alias bancario"
                              >
                                {copiedAliasStore === store.email ? (
                                  <span className="text-emerald-500">¡Copiado!</span>
                                ) : (
                                  <span>Copiar</span>
                                )}
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-2 mt-4">
                        <button
                          onClick={() => toggleFavoriteStore(store)}
                          className={`w-full py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-all
                            ${isFav 
                              ? 'bg-indigo-50 border border-indigo-200 text-indigo-600' 
                              : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-md shadow-indigo-100'}
                          `}
                        >
                          <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-indigo-600' : ''}`} />
                          {isFav ? 'Suscrito (Favorito)' : 'Agregar a mis favor.'}
                        </button>

                        <button
                          onClick={() => handleOpenAutoWhatsApp(store, `Hola, *${store.name}*! Soy *${profileName || currentUser.name}*, me contacto desde de mi perfil en la app MAX24 para realizarles una consulta. `)}
                          className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 border border-emerald-200 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"
                          title="Enviar WhatsApp al Comercio"
                        >
                          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                            <path d="M12.004 2c-5.51 0-9.99 4.49-9.99 10 0 1.91.54 3.7 1.48 5.24l-1.4 5.12 5.24-1.37c1.5.89 3.23 1.4 5.07 1.4 5.51 0 10-4.49 10-10s-4.49-10-10-10zm5.66 14.18c-.24.67-1.19 1.25-1.95 1.41-.53.11-1.22.2-3.54-.76-2.96-1.23-4.88-4.25-5.03-4.45-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.59-.38.79-.38.2 0 .39 0 .57.01.18.01.42-.08.66.5.24.58.83 2.03.9 2.18.07.15.12.33.02.53-.1.2-.15.3-.3.48-.15.18-.31.4-.44.54-.15.15-.31.32-.13.63.18.31.81 1.33 1.73 2.15.92.82 1.7-1.07 2.15-1.21.31-.1.6.01.78.18.18.18 1.15 1.15 1.35 1.25.2.1.33.15.38.24.05.09.05.53-.19 1.2z" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'shop_online' && !selectedStoreSettings && (
        <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in" id="shop-online-store-required">
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 rounded-3xl p-6 text-white text-left space-y-3 shadow-xl border border-slate-800">
            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/35 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-black">Paso Requerido</span>
            <h2 className="text-xl font-black">Selecciona la sucursal donde quieres comprar</h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Para poder ver el catálogo de productos, precios en vivo y realizar tu pedido para envío a domicilio o retiro, por favor selecciona una de las siguientes sucursales activas en el sistema:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allStores.map(store => (
              <div 
                key={store.email}
                onClick={async () => {
                  setSelectedStoreEmail(store.email || '');
                  if (store.email && !myFavoriteEmails.includes(store.email)) {
                     setMyFavoriteEmails(prev => [...prev, store.email || '']);
                  }
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all cursor-pointer shadow-xxs block text-left group"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-[10px] font-mono font-extrabold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {store.storeCode}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">{store.name}</h3>
                <p className="text-[11px] text-slate-500 font-semibold mt-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {store.address}
                </p>
                <p className="text-[10px] text-slate-400 mt-2 font-mono">⚡ Horario: {store.schedule}</p>
                <button
                  type="button"
                  className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Conectar y Comprar Aquí
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'shop_online' && selectedStoreSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="buyer-online-shop">
          
          {/* Header info detailing exactly which store is selected */}
          <div className="lg:col-span-3 bg-indigo-50/70 border border-indigo-100/80 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[9px] font-black uppercase text-indigo-650 tracking-wider">Tienda de Compra Activa</span>
                <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">{selectedStoreSettings.name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Tus productos e importes se facturan en esta sucursal.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedStoreEmail('');
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-black text-[10px] rounded-xl transition-colors cursor-pointer shrink-0 uppercase tracking-wide"
            >
              Cambiar Sucursal / Tienda
            </button>
          </div>
          
          {/* Product Feed */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200">
              <div className="relative w-full sm:max-w-xs shrink-0">
                <span className="absolute left-3 top-2.5 text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Buscar chocolates, fideos, gaseosa..."
                  value={productSearchQuery}
                  onChange={(e) => setProductSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>

              {/* Feed categories slider */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {uniqueCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-lg transition-colors cursor-pointer shrink-0
                      ${activeCategory === cat 
                        ? 'bg-slate-900 border border-slate-950 text-white' 
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-650'}
                    `}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Price Alert Banner */}
            {isSurchargePeriod && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-900 rounded-2xl text-[11px] font-sans font-bold flex gap-2 items-center leading-normal text-left">
                <span className="text-base shrink-0">🌙</span>
                <span>
                  <strong>Horario nocturno activo</strong> en <strong>{selectedStoreSettings.name}</strong>. Los precios de los productos tienen aplicado un recargo del <strong>{selectedStoreSettings.nightSurchargePercent}%</strong> automáticamente según tarifas de comercio.
                </span>
              </div>
            )}

            {filteredProducts.length === 0 ? (
              <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
                <Store className="w-8 h-8 text-slate-350 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-500">No hay productos disponibles bajo estos filtros en la sucursal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" id="online-products-showcase">
                {filteredProducts.map(p => {
                  const qtyInCart = onlineCart.find(i => i.product.id === p.id)?.quantity || 0;
                  const finalPrice = getProductPrice(p);
                  return (
                    <div 
                      key={p.id}
                      className="bg-white p-4 border border-slate-200 rounded-2xl shadow-xxs flex justify-between gap-3 text-left"
                    >
                      <div className="flex flex-col justify-between leading-normal shrink-0 max-w-[150px]">
                        <div>
                          <span className="text-[9px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                            {p.category}
                          </span>
                          <h4 className="font-extrabold text-slate-800 text-xs mt-1.5 truncate leading-tight block" title={p.name}>
                            {p.name}
                          </h4>
                          <p className="text-[10px] text-slate-450 mt-1 font-mono">Stock: {p.stock} ({p.unit})</p>
                        </div>
                        
                        <div className="mt-2.5">
                          <p className="text-base font-black text-slate-900 font-mono">
                            ${finalPrice.toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>

                      {/* Add button / Qty control */}
                      <div className="flex flex-col justify-end items-end shrink-0">
                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                            <button
                              onClick={() => updateOnlineCartQty(p, -1)}
                              className="p-1 bg-white hover:bg-slate-50 rounded-lg text-slate-600 border border-slate-200 shrink-0 cursor-pointer"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-mono font-bold text-slate-800">{qtyInCart}</span>
                            <button
                              onClick={() => {
                                if (qtyInCart >= p.stock) {
                                  alert(`Solamente quedan ${p.stock} unidades de este producto.`);
                                  return;
                                }
                                updateOnlineCartQty(p, 1);
                              }}
                              className="p-1 bg-white hover:bg-slate-50 rounded-lg text-slate-600 border border-slate-200 shrink-0 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              if (p.stock <= 0) {
                                alert("No hay stock disponible de este producto.");
                                return;
                              }
                              updateOnlineCartQty(p, 1);
                            }}
                            disabled={p.stock <= 0}
                            className={`px-3 py-2 text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1
                              ${p.stock <= 0 
                                ? 'bg-slate-100 border border-slate-200 text-slate-400' 
                                : 'bg-slate-900 hover:bg-slate-850 text-white'}`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Agregar
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Cart Sidebar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xxs h-fit space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
              <ShoppingBag className="text-indigo-650 w-4 h-4" />
              Mi Carrito de Compra
            </h3>

            {onlineCart.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-250 italic text-[11px] text-slate-450 leading-tight">
                El carrito está esperando tu selección. Explora los productos de {selectedStoreSettings.name} y agrégalos aquí.
              </div>
            ) : (
              <div className="space-y-3.5">
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {onlineCart.map(item => {
                    const price = getProductPrice(item.product);
                    return (
                      <div key={item.product.id} className="flex justify-between items-start gap-2.5 text-xs">
                        <div className="min-w-0 flex-1 leading-tight text-left">
                          <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                            {item.quantity}x ${price.toLocaleString('es-AR')}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900 shrink-0">
                          ${(price * item.quantity).toLocaleString('es-AR')}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 leading-none text-left">
                  <div className="flex justify-between items-center text-xs text-slate-505 font-bold">
                    <span>Subtotal:</span>
                    <span className="font-mono text-slate-700">${getCartTotal(onlineCart).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-900 font-extrabold pb-2">
                    <span>Total Compra:</span>
                    <span className="font-mono text-indigo-700 text-base">${getCartTotal(onlineCart).toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleProceedCheckout('online')}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer transition-all"
                >
                  Continuar Pago con MercadoPago
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'scan_n_pay' && !selectedStoreSettings && (
        <div className="max-w-4xl mx-auto space-y-6 text-left animate-fade-in" id="scan-pay-store-required">
          <div className="bg-gradient-to-br from-indigo-950 to-slate-905 rounded-3xl p-6 text-white text-left space-y-3 shadow-xl border border-slate-800">
            <span className="bg-orange-500/20 text-orange-400 border border-orange-500/35 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest uppercase font-black">Escáner Presencial</span>
            <h2 className="text-xl font-black">Selecciona la sucursal donde te encuentras</h2>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              Para escanear códigos de barras de productos usando la cámara de tu celular y auto-pagar presencialmente, por favor selecciona tu sucursal actual:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allStores.map(store => (
              <div 
                key={store.email}
                onClick={async () => {
                  setSelectedStoreEmail(store.email || '');
                  if (store.email && !myFavoriteEmails.includes(store.email)) {
                     setMyFavoriteEmails(prev => [...prev, store.email || '']);
                  }
                }}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-indigo-500 transition-all cursor-pointer shadow-xxs block text-left group"
              >
                <div className="flex justify-between items-center mb-3">
                  <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center font-bold">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-[10px] font-mono font-extrabold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {store.storeCode}
                  </span>
                </div>
                <h3 className="font-extrabold text-slate-800 text-sm">{store.name}</h3>
                <p className="text-[11px] text-slate-550 font-semibold mt-1.5 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  {store.address}
                </p>
                <button
                  type="button"
                  className="w-full mt-4 py-2 bg-slate-900 hover:bg-slate-850 text-white font-black text-xs rounded-xl transition-colors cursor-pointer"
                >
                  Conectar Escáner Aquí
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'scan_n_pay' && selectedStoreSettings && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="buyer-scan-n-pay">
          
          {/* Selected store header info */}
          <div className="lg:col-span-3 bg-indigo-50/70 border border-indigo-100/80 p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-indigo-600 text-white rounded-xl flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div className="leading-tight">
                <span className="text-[9px] font-black uppercase text-indigo-650 tracking-wider font-mono">Terminal de Auto-Pago</span>
                <h3 className="text-sm font-extrabold text-slate-800 mt-0.5">{selectedStoreSettings.name}</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-semibold">Tus escaneos sumarán ítems al carrito local de este local.</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedStoreEmail('');
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 font-black text-[10px] rounded-xl transition-colors cursor-pointer shrink-0 uppercase tracking-wide"
            >
              Cambiar Sucursal / Tienda
            </button>
          </div>
          
          {/* Scanner Viewfinder Area */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-slate-950 rounded-2xl border border-slate-800 p-5 text-white flex flex-col justify-between overflow-hidden shadow-xl min-h-[350px] relative">
              <div className="absolute inset-0 bg-slate-900/15 backdrop-blur-[0.5px] pointer-events-none" />
              
              {/* Overlay Frame Design */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border-[3px] border-orange-500 border-dashed rounded-2xl flex items-center justify-center animate-pulse pointer-events-none">
                <span className="w-full h-0.5 bg-red-500 shadow-md shadow-red-500" />
              </div>

              {/* Status flag */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
                  <span className="text-[10px] font-black uppercase font-mono tracking-widest text-emerald-400">Escáner móvil activo</span>
                </div>
                <div className="bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-[9px] font-mono whitespace-nowrap">
                  Cámara trasera • Lector laser online
                </div>
              </div>

              {/* Central scanning simulation feedback */}
              <div className="relative z-10 py-16 text-center space-y-4">
                {scanStatus ? (
                  <div className="inline-flex items-center gap-2 bg-emerald-500 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-lg">
                    <CheckCircle className="w-4 h-4" />
                    <span>{scanStatus}</span>
                  </div>
                ) : (
                  <div className="space-y-1 text-slate-300">
                    <Barcode className="w-12 h-12 text-orange-500 mx-auto my-1 select-none animate-pulse" />
                    <p className="text-xs font-bold font-sans">Apunta la cámara de tu celular a la etiqueta del producto.</p>
                    <p className="text-[10px] text-slate-500 select-none leading-normal">O selecciona de la lista rápida abajo para simular haber escaneado.</p>
                  </div>
                )}
              </div>

              {/* Simulator products prompt tray */}
              <div className="relative z-10 pt-4 border-t border-slate-900 space-y-2">
                <p className="text-[9px] uppercase font-bold tracking-widest text-slate-400 text-left font-mono">Simulador de Lectura laser (Haz Click para escanear):</p>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {storeProducts.map(p => {
                    const qty = scanCart.find(i => i.product.id === p.id)?.quantity || 0;
                    return (
                      <button
                        key={p.id}
                        onClick={() => simulateProductScan(p)}
                        className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-850 rounded-xl text-[10px] font-semibold text-slate-200 shrink-0 text-left flex items-center gap-1.5 cursor-pointer leading-none"
                      >
                        <Barcode className="w-3.5 h-3 text-orange-500" />
                        <span className="truncate max-w-[100px]">{p.name}</span>
                        {qty > 0 && <span className="bg-orange-500 text-slate-950 px-1 rounded-full font-mono text-[9px] font-black">{qty}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Price notification during night surcharge */}
            {isSurchargePeriod && (
              <div className="p-3.5 bg-amber-500/10 border border-amber-500/25 text-amber-900 rounded-2xl text-[11px] font-sans font-bold flex gap-2 items-center leading-normal text-left">
                <span className="text-base shrink-0">🌙</span>
                <span>
                  <strong>Atención:</strong> Tarifa nocturna activa en local. Todos los productos escaneados automáticamente acumulan un recargo del <strong>{selectedStoreSettings.nightSurchargePercent}%</strong> en tu carrito físico.
                </span>
              </div>
            )}
          </div>

          {/* Physical Scan Shopping Cart */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xxs h-fit space-y-4">
            <h3 className="font-extrabold text-slate-900 text-sm border-b border-slate-100 pb-2 flex items-center gap-2">
              <Smartphone className="text-orange-500 w-4 h-4" />
              Mi Canasto Presencial
            </h3>

            {scanCart.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-250 italic text-[11px] text-slate-450 leading-tight">
                Canasto vacío. Escanea algún código de barras usando los disparadores del simulador en el panel izquierdo.
              </div>
            ) : (
              <div className="space-y-3.5" id="scan-cart-body">
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {scanCart.map(item => {
                    const price = getProductPrice(item.product);
                    return (
                      <div key={item.product.id} className="flex justify-between items-start gap-2.5 text-xs">
                        <div className="min-w-0 flex-1 leading-tight text-left">
                          <p className="font-bold text-slate-800 truncate">{item.product.name}</p>
                          <p className="text-[10px] text-slate-450 font-mono mt-0.5">
                            {item.quantity}x ${price.toLocaleString('es-AR')}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-mono font-bold text-slate-900">
                            ${(price * item.quantity).toLocaleString('es-AR')}
                          </span>
                          <button
                            onClick={() => updateScanCartQty(item.product, -item.quantity)}
                            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-100 space-y-2 leading-none text-left">
                  <div className="flex justify-between items-center text-xs text-slate-505 font-bold">
                    <span>Monto Productos:</span>
                    <span className="font-mono text-slate-705">${getCartTotal(scanCart).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm text-slate-900 font-extrabold pb-2">
                    <span>Total a Abonar:</span>
                    <span className="font-mono text-orange-600 text-base">${getCartTotal(scanCart).toLocaleString('es-AR')}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleProceedCheckout('scan')}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1 shadow-md cursor-pointer"
                >
                  Pagar mi Carrito (Mercado Pago)
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'my_receipts' && (
        <div className="space-y-4" id="buyer-receipts-tab">
          <h3 className="text-xs font-bold tracking-widest text-indigo-950 font-mono uppercase">Mi Historial de Compras Realizadas</h3>
          
          {buyerReceipts.length === 0 ? (
            <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
              <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto" strokeWidth={1.5} />
              <p className="text-xs font-bold text-slate-500 mt-2">Aún no registraste ninguna compra.</p>
              <p className="text-[10px] text-slate-400 mt-1 leading-normal">Tus compras online o escaneadas aprobadas por Mercado Pago aparecerán aquí.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {buyerReceipts.map(rec => (
                <div 
                  key={rec.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xxs text-left flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-2 leading-none">
                    <div className="flex items-center gap-2">
                      <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 px-2 py-0.5 rounded text-[10.5px] font-mono font-bold uppercase tracking-wider">
                        Cod: {rec.id}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(rec.date).toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600">
                      <p className="font-semibold block truncate max-w-[400px]">
                        Detalles: {rec.items.map(item => `${item.quantity}x ${item.productName}`).join(', ')}
                      </p>
                      
                      {rec.status && (
                        <div className="mt-2 flex items-center gap-1.5">
                          <span className={`inline-block w-2 h-2 rounded-full 
                            ${rec.status === 'Pendiente Control' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                          <span className="text-[10.5px] font-bold">
                            Estado: <strong className={rec.status === 'Pendiente Control' ? 'text-amber-600' : 'text-emerald-600'}>
                              {rec.status === 'Pendiente Control' ? 'Aprobar Control en Salida (Escaneado)' : 'Completado'}
                            </strong>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <div className="text-right leading-none shrink-0">
                      <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase font-mono">Abonado vía MP</p>
                      <p className="text-lg font-black text-slate-900 mt-1 font-mono">${rec.total.toLocaleString('es-AR')}</p>
                    </div>

                    <div className="bg-emerald-50 text-emerald-700 text-xs font-bold py-2 px-3 rounded-xl border border-emerald-100 flex items-center gap-1 leading-none shrink-0 select-none">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      Pagado
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'my_profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 text-left animate-fade-in" id="buyer-profile-tab-panel">
          {/* Left Column: Edit profile form */}
          <div className="lg:col-span-7 bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-600" />
                Mis Datos de Usuario
              </h3>
              <p className="text-xs text-slate-500 font-medium font-sans">Asocia tu nombre, celular y domicilio de entrega para que los comercios preparen eficientemente tus pedidos.</p>
            </div>

            {profileSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 flex items-start gap-3 animate-fade-in text-xs font-semibold">
                <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 mt-0.5 animate-bounce">
                  <CheckCircle className="w-3.5 h-3.5" />
                </div>
                <div>
                  <p className="font-bold">¡Cambios Guardados!</p>
                  <p className="text-[10.5px] text-emerald-800 font-normal leading-tight">{profileSuccessMsg}</p>
                </div>
              </div>
            )}

            {profileErrorMsg && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-950 text-xs font-semibold animate-fade-in">
                {profileErrorMsg}
              </div>
            )}

            <form onSubmit={handleSaveBuyerProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Nombre Completo *</label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    placeholder="Tu nombre completo"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all focus:ring-1 focus:ring-indigo-500/10"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">DNI / Identificación *</label>
                  <input
                    type="text"
                    required
                    value={profileDocId}
                    onChange={(e) => setProfileDocId(e.target.value)}
                    placeholder="ej: 38765432"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all focus:ring-1 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">E-mail de Ingreso *</label>
                  <input
                    type="email"
                    required
                    value={profileEmail}
                    onChange={(e) => setProfileEmail(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all focus:ring-1 focus:ring-indigo-500/10"
                    placeholder="tu-correo@gmail.com"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">Celular / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="ej: 1122334455"
                    className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all focus:ring-1 focus:ring-indigo-500/10"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Domicilio Completo para Envíos</label>
                <input
                  type="text"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="ej: Av. Rivadavia 4560, Piso 3 Depto B, Buenos Aires"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-semibold text-slate-900 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all focus:ring-1 focus:ring-indigo-500/10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block font-sans">Contraseña de Acceso</label>
                <input
                  type="text"
                  required
                  value={profilePassword}
                  onChange={(e) => setProfilePassword(e.target.value)}
                  placeholder="Contraseña del sistema"
                  className="w-full bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-xs font-mono font-semibold text-slate-950 focus:outline-hidden focus:border-indigo-500 focus:bg-white transition-all focus:ring-1 focus:ring-indigo-500/10"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black rounded-xl cursor-pointer shadow-md shadow-indigo-100 flex items-center gap-2 disabled:opacity-50 transition-all font-sans"
                >
                  {isSavingProfile ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Guardando Cambios...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>Guardar Datos en la Nube</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: WhatsApp Automatic Messaging Tool */}
          <div className="lg:col-span-5 bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-md flex flex-col justify-between space-y-6 border border-slate-800">
            <div className="space-y-4">
              <div className="space-y-1">
                <span className="bg-emerald-500/25 border border-emerald-500/35 text-emerald-300 px-2 py-0.5 rounded text-[9px] font-mono font-black tracking-widest uppercase">
                  Comercios de mi Perfil • WhatsApp
                </span>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <svg className="w-5 h-5 text-emerald-400 fill-current animate-pulse" viewBox="0 0 24 24">
                    <path d="M12.004 2c-5.51 0-9.99 4.49-9.99 10 0 1.91.54 3.7 1.48 5.24l-1.4 5.12 5.24-1.37c1.5.89 3.23 1.4 5.07 1.4 5.51 0 10-4.49 10-10s-4.49-10-10-10zm5.66 14.18c-.24.67-1.19 1.25-1.95 1.41-.53.11-1.22.2-3.54-.76-2.96-1.23-4.88-4.25-5.03-4.45-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.59-.38.79-.38.2 0 .39 0 .57.01.18.01.42-.08.66.5.24.58.83 2.03.9 2.18.07.15.12.33.02.53-.1.2-.15.3-.3.48-.15.18-.31.4-.44.54-.15.15-.31.32-.13.63.18.31.81 1.33 1.73 2.15.92.82 1.7-1.07 2.15-1.21.31-.1.6.01.78.18.18.18 1.15 1.15 1.35 1.25.2.1.33.15.38.24.05.09.05.53-.19 1.2z" />
                  </svg>
                  Mensajería por WhatsApp
                </h3>
                <p className="text-[11px] text-indigo-200 leading-normal font-sans font-medium">
                  Comunícate de manera automatizada con los comercios que has agregado a tu perfil. Selecciona la tienda agregada, elige un motivo y redacta o envía al instante.
                </p>
              </div>

              {currentFavoriteStores.length === 0 ? (
                <div className="bg-indigo-950/40 border border-indigo-500/20 px-4 py-4 rounded-2xl space-y-3">
                  <p className="text-[11px] text-indigo-300 font-semibold leading-relaxed">
                    ⚠️ No posees tiendas agregadas a tu perfil como favoritas aún.
                  </p>
                  <p className="text-[10px] text-indigo-200/70 font-normal leading-normal">
                    Para enviar mensajes rápidos de WhatsApp a un comercio, primero debes agregarlo como favorito desde tu directorio general.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('my_stores')}
                    className="w-full py-2 bg-indigo-650 hover:bg-indigo-600 text-white rounded-xl text-[11px] font-black tracking-wide transition-all cursor-pointer shadow-sm text-center"
                  >
                    Ir a Buscar & Agregar Comercios
                  </button>
                </div>
              ) : (
                <>
                  {/* Selector 1: Added Stores only */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-wider block font-sans">Elegir Comercio Agregado en mi Perfil</label>
                    <select
                      value={waSelectedStoreEmail}
                      onChange={(e) => setWaSelectedStoreEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs text-white focus:outline-hidden font-bold cursor-pointer"
                    >
                      <option value="">-- Seleccionar de mis Comercios --</option>
                      {currentFavoriteStores.map(st => (
                        <option key={st.email} value={st.email}>
                          ⭐ {st.name} ({st.storeCode})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Selector 2: Templates */}
                  <div className="space-y-1 text-left">
                    <label className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-wider block font-sans">Motivo o Plantilla del Mensaje</label>
                    <select
                      value={waTemplateType}
                      onChange={(e) => setWaTemplateType(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs text-white focus:outline-hidden font-bold cursor-pointer"
                    >
                      <option value="consulta_general">Consulta General de Cliente</option>
                      <option value="consulta_pedido">Estado de Envío / Pedidos Recientes</option>
                      <option value="consulta_deuda">Consulta Cuentas Corrientes y Saldos</option>
                      <option value="consulta_envio">Coordinar Despacho a Domicilio</option>
                      <option value="mensaje_personalizado">Redactar Mensaje Libre...</option>
                    </select>
                  </div>

                  {/* Custom Free Message Container */}
                  {waTemplateType === 'mensaje_personalizado' && (
                    <div className="space-y-1 text-left animate-fade-in">
                      <label className="text-[10px] font-extrabold text-indigo-200 uppercase tracking-wider block font-sans">Mensaje Personalizado:</label>
                      <textarea
                        rows={3}
                        value={waCustomMessage}
                        onChange={(e) => setWaCustomMessage(e.target.value)}
                        placeholder="Redacta las consultas o inquietudes libres..."
                        className="w-full bg-slate-900 border border-slate-700 p-2.5 rounded-xl text-xs text-indigo-50 placeholder-indigo-400/50 font-sans"
                      />
                    </div>
                  )}

                  {/* Message Preview visual Box */}
                  {waSelectedStoreEmail && (
                    <div className="space-y-1 text-left animate-fade-in bg-slate-950/50 p-3.5 rounded-2xl border border-indigo-550/30">
                      <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        Vista Previa del WhatsApp:
                      </span>
                      <p className="text-[10.5px] italic font-medium leading-relaxed text-indigo-100 whitespace-pre-wrap mt-1 select-all font-sans">
                        {waTemplateType === 'mensaje_personalizado' 
                          ? (waCustomMessage || "(escribe tu mensaje para previsualizarlo...)")
                          : getWATemplateText(waTemplateType, currentFavoriteStores.find(s => s.email === waSelectedStoreEmail)?.name || 'Tienda')
                        }
                      </p>
                    </div>
                  )}

                  {/* Quick Shortcut List for all Added Stores in profile */}
                  <div className="pt-2">
                    <span className="text-[10px] font-extrabold text-indigo-300 uppercase tracking-wider block mb-2">Comercios en mi Perfil:</span>
                    <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto pr-1">
                      {currentFavoriteStores.map(store => (
                        <div 
                          key={store.email}
                          onClick={() => setWaSelectedStoreEmail(store.email!)}
                          className={`p-2.5 rounded-xl border flex items-center justify-between text-left cursor-pointer transition-all
                            ${waSelectedStoreEmail === store.email 
                              ? 'bg-indigo-950/80 border-indigo-500' 
                              : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/60'}
                          `}
                        >
                          <div className="leading-tight">
                            <h5 className="text-[11px] font-black text-white">{store.name}</h5>
                            <p className="text-[9px] text-slate-400 font-mono mt-0.5">{store.phone || 'Sin WhatsApp'}</p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <span className="text-[9px] font-bold text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                              {store.storeCode}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAutoWhatsApp(store, `Hola *${store.name}*! Te escribo desde mi perfil en MAX24 (Comprador *${profileName || currentUser.name}*). Quería consultarte algo.`);
                              }}
                              className="p-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 rounded-lg transition-all"
                              title="Mensaje rápido de WhatsApp"
                            >
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                <path d="M12.004 2c-5.51 0-9.99 4.49-9.99 10 0 1.91.54 3.7 1.48 5.24l-1.4 5.12 5.24-1.37c1.5.89 3.23 1.4 5.07 1.4 5.51 0 10-4.49 10-10s-4.49-10-10-10zm5.66 14.18c-.24.67-1.19 1.25-1.95 1.41-.53.11-1.22.2-3.54-.76-2.96-1.23-4.88-4.25-5.03-4.45-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.59-.38.79-.38.2 0 .39 0 .57.01.18.01.42-.08.66.5.24.58.83 2.03.9 2.18.07.15.12.33.02.53-.1.2-.15.3-.3.48-.15.18-.31.4-.44.54-.15.15-.31.32-.13.63.18.31.81 1.33 1.73 2.15.92.82 1.7-1.07 2.15-1.21.31-.1.6.01.78.18.18.18 1.15 1.15 1.35 1.25.2.1.33.15.38.24.05.09.05.53-.19 1.2z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {currentFavoriteStores.length > 0 && (
              <div className="pt-4 border-t border-indigo-900 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const s = currentFavoriteStores.find(st => st.email === waSelectedStoreEmail);
                    if (!s) {
                      alert("Por favor selecciona un comercio de la lista primero!");
                      return;
                    }
                    handleOpenAutoWhatsApp(s);
                  }}
                  disabled={!waSelectedStoreEmail}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-45 select-none transition-all"
                >
                  <svg className="w-4 h-4 fill-current animate-pulse" viewBox="0 0 24 24">
                    <path d="M12.004 2c-5.51 0-9.99 4.49-9.99 10 0 1.91.54 3.7 1.48 5.24l-1.4 5.12 5.24-1.37c1.5.89 3.23 1.4 5.07 1.4 5.51 0 10-4.49 10-10s-4.49-10-10-10zm5.66 14.18c-.24.67-1.19 1.25-1.95 1.41-.53.11-1.22.2-3.54-.76-2.96-1.23-4.88-4.25-5.03-4.45-.15-.2-1.21-1.61-1.21-3.07 0-1.46.76-2.18 1.03-2.48.27-.3.59-.38.79-.38.2 0 .39 0 .57.01.18.01.42-.08.66.5.24.58.83 2.03.9 2.18.07.15.12.33.02.53-.1.2-.15.3-.3.48-.15.18-.31.4-.44.54-.15.15-.31.32-.13.63.18.31.81 1.33 1.73 2.15.92.82 1.7-1.07 2.15-1.21.31-.1.6.01.78.18.18.18 1.15 1.15 1.35 1.25.2.1.33.15.38.24.05.09.05.53-.19 1.2z" />
                  </svg>
                  <span>Enviar WhatsApp Automático</span>
                </button>
                <p className="text-[9px] text-indigo-300 font-medium text-center font-sans uppercase">La plataforma abrirá una nueva solapa direccionando a wa.me automáticamente.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* COMPREHENSIVE MERCADO PAGO INTEGRATION MODAL */}
      {checkoutMode && selectedStoreSettings && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl relative overflow-hidden" id="mp-payment-modal">
            
            {/* MP Blue branded header */}
            <div className="bg-blue-600 p-5 text-white flex items-center justify-between relative">
              <div className="absolute right-0 top-0 w-24 h-24 bg-white/5 rounded-full blur-md" />
              <div className="flex items-center gap-2.5 relative z-10 z-index">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 font-extrabold text-lg shadow-md select-none">
                  mp
                </div>
                <div>
                  <h3 className="font-extrabold text-sm font-sans tracking-tight">Mercado Pago Argentina</h3>
                  <p className="text-[10px] text-blue-100 font-bold uppercase tracking-wider mt-0.5">Pasarela Oficial de Cobro</p>
                </div>
              </div>
              <button 
                onClick={() => setCheckoutMode(null)}
                className="text-white hover:bg-white/10 p-1.5 rounded-xl cursor-pointer"
              >
                <X className="w-5 h-5 animate-pulse" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              
              {!purchaseSuccess ? (
                <>
                  {/* Ledger bill details */}
                  <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex justify-between items-center leading-none text-left">
                    <div>
                      <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Destino de Fondos</p>
                      <p className="text-xs font-extrabold text-slate-800 mt-1">{selectedStoreSettings.name}</p>
                    </div>

                    <div className="text-right">
                      <p className="text-[10px] font-bold uppercase text-slate-450 tracking-wider">Importe ARS</p>
                      <p className="text-lg font-black text-blue-600 font-mono mt-1">
                        ${getCartTotal(checkoutMode === 'online' ? onlineCart : scanCart).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>

                  {/* MP Payment Method selector */}
                  <div className="space-y-2 text-left">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider leading-none">Elige tu medio de pago de Mercado Pago:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => setMpMethod('Dinero')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer leading-tight
                          ${mpMethod === 'Dinero' 
                            ? 'border-blue-600 bg-blue-50/10 text-blue-700 font-black' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                      >
                        <span className="block text-xs">Dinero en cuenta</span>
                        <span className="block text-[9px] text-slate-400 font-mono mt-0.5">Saldo: $85.320</span>
                      </button>

                      <button
                        onClick={() => setMpMethod('Debito')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer leading-tight
                          ${mpMethod === 'Debito' 
                            ? 'border-blue-600 bg-blue-50/10 text-blue-700 font-black' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                      >
                        <span className="block text-xs">Tarjeta de Débito</span>
                        <span className="block text-[9px] text-slate-400 font-sans mt-0.5">Visa Débito **** 4322</span>
                      </button>

                      <button
                        onClick={() => setMpMethod('Credito')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer leading-tight
                          ${mpMethod === 'Credito' 
                            ? 'border-blue-600 bg-blue-50/10 text-blue-700 font-black' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                      >
                        <span className="block text-xs">Tarjeta de Crédito</span>
                        <span className="block text-[9px] text-slate-400 font-sans mt-0.5">Mastercard **** 8711</span>
                      </button>

                      <button
                        onClick={() => setMpMethod('Transferencia')}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer leading-tight
                          ${mpMethod === 'Transferencia' 
                            ? 'border-blue-600 bg-blue-50/10 text-blue-700 font-black' 
                            : 'border-slate-200 hover:bg-slate-50 text-slate-600'}`}
                      >
                        <span className="block text-xs">Débito Inmediato</span>
                        <span className="block text-[9px] text-slate-400 font-mono mt-0.5">CVU Bancario</span>
                      </button>
                    </div>
                  </div>

                  {/* Visual QR Code simulation or Direct Bank Transfer credentials */}
                  {mpMethod === 'Transferencia' ? (
                    <div className="bg-indigo-50 border border-indigo-150 p-4 rounded-2xl space-y-3 text-left">
                      <div className="flex items-center gap-2">
                        <span className="p-1 px-2.5 bg-indigo-600 text-indigo-50 text-[9px] font-mono font-black rounded-lg">CBU/CVU PROVISTO</span>
                        <h4 className="text-xs font-black text-indigo-950">Datos para Transferencia Bancaria</h4>
                      </div>

                      <div className="space-y-2">
                        {selectedStoreSettings.bankAlias ? (
                          <div className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-xl text-xs">
                            <div>
                              <p className="text-[9px] text-slate-400 font-extrabold uppercase leading-none">ALIAS (Mercado Pago / Banco)</p>
                              <p className="font-mono font-black text-slate-900 mt-1">{selectedStoreSettings.bankAlias}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedStoreSettings.bankAlias!);
                                setCopiedAliasStore(selectedStoreSettings.email!);
                                setTimeout(() => setCopiedAliasStore(''), 2000);
                              }}
                              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-505 text-white font-black rounded-lg text-[10px] cursor-pointer transition-all shrink-0"
                            >
                              {copiedAliasStore === selectedStoreSettings.email ? '¡Copiado!' : 'Copiar Alias'}
                            </button>
                          </div>
                        ) : (
                          <div className="bg-amber-500/10 border border-amber-500/25 p-2 rounded-xl text-[10px] text-amber-900">
                            🚨 El comercio no ha especificado un Alias de transferencia todavía. Contacta al comercio por WhatsApp.
                          </div>
                        )}

                        {selectedStoreSettings.cuit && (
                          <div className="flex items-center justify-between bg-white border border-slate-150 p-2.5 rounded-xl text-xs">
                            <div>
                              <p className="text-[9px] text-slate-400 font-extrabold uppercase leading-none">CUIT DESTINATARIO</p>
                              <p className="font-mono font-black text-slate-900 mt-1">{selectedStoreSettings.cuit}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(selectedStoreSettings.cuit!);
                                alert("¡CUIT de la Tienda Copiado!");
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-lg text-[10px] cursor-pointer transition-all shrink-0"
                            >
                              Copiar CUIT
                            </button>
                          </div>
                        )}

                        <div className="bg-indigo-100/10 p-2 rounded-lg text-[10px] text-indigo-950 font-medium leading-normal">
                          💡 Realiza la transferencia desde la app de tu Banco / billetera digital preferida, copia el alias de arriba y luego haz click en el botón azul para simular el procesamiento inmediato del pago.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100 p-4 rounded-2xl flex items-center gap-3 border border-slate-200">
                      <QrCode className="w-12 h-12 text-slate-700 shrink-0 select-none animate-pulse" />
                      <div className="text-left leading-tight">
                        <p className="text-xs font-bold text-slate-800">Escaneo de QR de Terminal</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1 leading-normal">
                          Al hacer click en el botón de abajo, se confirmará tu pago mediante la API Sandbox de Mercado Pago Argentina inmediatamente.
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <button
                      onClick={handleConfirmMercadoPagoPayment}
                      disabled={isMpSubmitted}
                      className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-extrabold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-blue-600/10 cursor-pointer disabled:opacity-50"
                    >
                      {isMpSubmitted ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                          <span>Procesando pago en Mercado Pago...</span>
                        </>
                      ) : (
                        <>
                          <span>Pagar con Mercado Pago en ARS</span>
                          <CheckCircle className="w-4 h-4 shrink-0" />
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6 space-y-4">
                  <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto text-2xl border border-emerald-100/50 shadow-md">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500" />
                  </div>

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-slate-900 text-base">¡Transacción Aprobada! 🇦🇷</h4>
                    <p className="text-xs text-slate-500 leading-normal max-w-xs mx-auto">
                      Tu dinero ha sido transferido a la cuenta de Mercado Pago de <strong>{selectedStoreSettings.name}</strong>.
                    </p>
                  </div>

                  {checkoutMode === 'scan' ? (
                    <div className="p-3 bg-amber-500/10 border border-amber-500/15 rounded-xl text-[10.5px] font-sans font-medium text-amber-900 leading-normal text-slate-600 max-w-xs mx-auto">
                      📝 <strong>Control de compras presencial:</strong> Dirígete al cajero para que escanee o controle los productos comprados. La sucursal ya recibió la notificación de tu pago de <strong>${purchaseSuccess.total.toLocaleString('es-AR')}</strong>.
                    </div>
                  ) : (
                    <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[10.5px] font-sans font-medium text-indigo-900 leading-normal text-slate-600 max-w-xs mx-auto">
                      🚚 <strong>Pedido en Preparación:</strong> La sucursal ya recibió la orden de compra online para preparar tu pedido y despacharlo.
                    </div>
                  )}

                  <div className="pt-3 flex gap-2">
                    <button
                      onClick={() => {
                        setCheckoutMode(null);
                        setActiveTab('my_receipts');
                      }}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      Ver mi Factura
                    </button>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Interactive QR Scanner Simulator Modal */}
      {isQRScannerModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-left">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 px-2.5 bg-indigo-500/10 border border-indigo-400/20 text-indigo-400 font-mono text-[9px] font-black rounded-lg uppercase">
                  Scanner Activo
                </span>
                <h3 className="text-sm font-black text-white">Lector de Códigos QR de Comercios</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsQRScannerModalOpen(false)}
                className="text-xs font-bold text-slate-400 hover:text-white px-2.5 py-1 bg-slate-950 border border-slate-850 rounded-lg cursor-pointer transition-all"
              >
                Cerrar
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Camera Simulator viewport */}
              <div className="relative bg-slate-950 rounded-2xl border border-slate-800 p-4 h-48 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-indigo-550/5 pointer-events-none" />
                
                {/* Glowing laser scanning line */}
                <span className="absolute left-0 right-0 h-0.5 bg-emerald-400 shadow-md shadow-emerald-400/50 animate-bounce pointer-events-none" style={{ top: '40%' }} />

                {/* Tracking Corner Brackets */}
                <div className="absolute top-6 left-6 w-8 h-8 border-t-2 border-l-2 border-emerald-400 rounded-tl-lg pointer-events-none" />
                <div className="absolute top-6 right-6 w-8 h-8 border-t-2 border-r-2 border-emerald-400 rounded-tr-lg pointer-events-none" />
                <div className="absolute bottom-6 left-6 w-8 h-8 border-b-2 border-l-2 border-emerald-400 rounded-bl-lg pointer-events-none" />
                <div className="absolute bottom-6 right-6 w-8 h-8 border-b-2 border-r-2 border-emerald-400 rounded-br-lg pointer-events-none" />

                <div className="text-center space-y-2 relative z-10 leading-normal">
                  <QrCode className="w-10 h-10 text-emerald-400 mx-auto animate-pulse" />
                  <p className="text-xs font-bold text-slate-300">Simulador de Cámara Trasera</p>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto text-center">Selecciona una sucursal abajo para simular haber apuntado tu teléfono y escaneado su QR oficial.</p>
                </div>
              </div>

              {/* List of stores with their codes for simulation */}
              <div className="space-y-2.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">Apuntar Cámara a Sucursal de la Red:</p>
                
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {allStores.map(st => {
                    const isAlreadyFav = myFavoriteEmails.includes(st.email!);
                    return (
                      <div 
                        key={st.email}
                        className="bg-slate-950/60 p-3 rounded-xl border border-slate-850 flex items-center justify-between text-xs gap-3"
                      >
                        <div className="text-left font-sans">
                          <h4 className="font-bold text-slate-200">{st.name}</h4>
                          <span className="text-[9.5px] font-mono text-slate-450 mt-0.5 inline-block">Código: {st.storeCode || 'S/C'} {isAlreadyFav && '• ⭐ Favorito'}</span>
                        </div>

                        <button
                          type="button"
                          onClick={async () => {
                            setQrScannerError('');
                            setIsQRScannerModalOpen(false);
                            
                            if (!myFavoriteEmails.includes(st.email!)) {
                              setMyFavoriteEmails(prev => [...prev, st.email!]);
                              try {
                                const customerId = `cust-buyer-${currentUser.email.replace(/[^a-zA-Z0-9]/g, '')}`;
                                const newCustomer = {
                                  id: customerId,
                                  name: currentUser.name,
                                  email: currentUser.email,
                                  phone: currentUser.phone || '+54 11 9999-9999',
                                  docId: 'DNI ' + Math.floor(10000000 + Math.random() * 80000000),
                                  address: currentUser.emergencyContact || 'Domicilio Comprador',
                                  debtBalance: 0,
                                  storeEmail: st.email!
                                };
                                await setDoc(doc(db, 'storeSettings', st.email!, 'customers', customerId), newCustomer);
                              } catch(e) {
                                console.warn(e);
                              }
                            }
                            
                            setSelectedStoreEmail(st.email!);
                            setDeepLinkToast(`¡Escaneo de QR exitoso! Comercio "${st.name}" conectado automáticamente de forma ágil.`);
                            setTimeout(() => setDeepLinkToast(''), 5000);
                          }}
                          className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black rounded-lg text-[10px] cursor-pointer transition-all shrink-0 flex items-center gap-1"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Escanear QR</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
