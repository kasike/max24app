import React, { useState, useMemo, Component, ErrorInfo, ReactNode } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingCart, 
  DollarSign, 
  Receipt, 
  Users, 
  Sparkles,
  CreditCard,
  Ban,
  TrendingDown,
  Check,
  RotateCcw,
  Mail,
  Send,
  UserPlus,
  X,
  MessageSquare,
  Phone,
  Camera,
  QrCode,
  Smartphone,
  RefreshCw,
  AlertTriangle,
  Calculator,
  Zap,
  Delete,
  Tag,
  CheckCircle2
} from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { Product, Employee, CartItem, Sale, StoreSettings, Customer } from '../types';

interface ErrorBoundaryProps {
  children: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class POSErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;
  public setState: any;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.props = props;
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("POSErrorBoundary capturó un fallo temporal en el módulo del POS/Escáner:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-5 bg-amber-50 border border-amber-200 rounded-2xl text-slate-800 my-4 shadow-lg text-left">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500 text-white rounded-xl font-bold shrink-0 shadow-md shadow-amber-500/20">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="space-y-1.5 flex-1">
              <h4 className="text-sm font-black text-amber-950">Aviso del Escáner / Dispositivo POS</h4>
              <p className="text-xs text-amber-850 leading-relaxed font-sans">
                Ocurrió una interrupción al apagar o gestionar el sensor de la cámara del escáner. <strong>Tus productos en el carrito de compras están 100% protegidos y guardados intactos.</strong>
              </p>
              <button
                type="button"
                onClick={() => {
                  if (this.props.onReset) this.props.onReset();
                  this.setState({ hasError: false, error: null });
                }}
                className="mt-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider font-sans flex items-center gap-1.5 active:scale-95"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Volver a la Caja POS</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface POSProps {
  products: Product[];
  employees: Employee[];
  onRegisterSale: (
    saleItems: { productId: string; quantity: number; customProduct?: Product; productName?: string; price?: number }[],
    discountPercent: number,
    paymentMethod: Sale['paymentMethod'],
    cashReceived: number,
    sellerId: string,
    customer?: Customer,
    includeIva?: boolean,
    afipFields?: Partial<Sale>
  ) => Sale;
  currentUser: Employee | null;
  storeSettings: StoreSettings;
  customers: Customer[];
  onAddCustomer: (newCustomer: Omit<Customer, 'id'>) => Customer;
}

function POS({ products, employees, onRegisterSale, currentUser, storeSettings, customers, onAddCustomer }: POSProps) {
  // Navigation & Category states
  const [activeCategory, setActiveCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Quick Calculator / Express Sale States
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [calcExpression, setCalcExpression] = useState('');
  const [calcDescription, setCalcDescription] = useState('Venta Rápida / Varios');

  // Live evaluated math expression (e.g., "120 + 50000 + 250" => 50370)
  const calcEvaluatedTotal = useMemo(() => {
    if (!calcExpression.trim()) return 0;
    try {
      let sanitized = calcExpression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/,/g, '.')
        .replace(/[^0-9+\-*/.()]/g, '');

      while (/[+\-*/.]$/.test(sanitized)) {
        sanitized = sanitized.slice(0, -1);
      }
      if (!sanitized.trim()) return 0;

      const result = new Function(`'use strict'; return (${sanitized});`)();
      if (typeof result === 'number' && !isNaN(result) && Number.isFinite(result)) {
        return Math.max(0, Math.round(result * 100) / 100);
      }
      return 0;
    } catch (e) {
      return 0;
    }
  }, [calcExpression]);

  // Virtual Calculator keypad click handler
  const handleCalcKeyPress = (key: string) => {
    if (key === 'C') {
      setCalcExpression('');
    } else if (key === 'BACKSPACE') {
      setCalcExpression(prev => prev.slice(0, -1));
    } else if (key === '=') {
      setCalcExpression(calcEvaluatedTotal.toString());
    } else {
      setCalcExpression(prev => {
        const lastChar = prev.slice(-1);
        const operators = ['+', '-', '*', '/', '×', '÷'];
        if (operators.includes(lastChar) && operators.includes(key)) {
          return prev.slice(0, -1) + key;
        }
        return prev + key;
      });
    }
  };

  // Add calculated quick item to active cart and open payment checkout modal
  const handleAddQuickItemToCart = (directCheckout: boolean = true) => {
    const amount = calcEvaluatedTotal > 0 ? calcEvaluatedTotal : (parseFloat(calcExpression) || 0);
    if (amount <= 0) {
      alert("Por favor ingresa una suma o monto mayor a $0 en la calculadora.");
      return;
    }

    const descName = calcDescription.trim() || 'Venta Rápida / Varios';
    const quickProd: Product = {
      id: `quick-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: descName,
      price: amount,
      cost: 0,
      stock: 999999,
      minStock: 0,
      unit: 'un',
      category: 'Varios',
      sku: 'EXPRESS-' + Math.floor(1000 + Math.random() * 9000),
      storeEmail: storeSettings.email || 'global'
    };

    setCart(prev => [...prev, { product: quickProd, quantity: 1 }]);
    playBeep();
    setCalcExpression('');
    setIsCalculatorOpen(false);

    if (directCheckout) {
      setIsCheckoutOpen(true);
    }
  };
  
  // Barcode Camera Scanner States
  const [isScanning, setIsScanning] = useState(false);
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [autoCloseOnScan, setAutoCloseOnScan] = useState(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  
  // Cart state with localStorage recovery
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('max24_active_cart');
      if (savedCart) {
        const parsed = JSON.parse(savedCart);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Error cargando carrito guardado desde localStorage:", e);
    }
    return [];
  });
  const [discountPercent, setDiscountPercent] = useState<number>(0);

  // Automatic Cart Persistence in LocalStorage
  React.useEffect(() => {
    try {
      if (cart.length > 0) {
        localStorage.setItem('max24_active_cart', JSON.stringify(cart));
      } else {
        localStorage.removeItem('max24_active_cart');
      }
    } catch (e) {
      console.warn("Error al persistir el carrito en localStorage:", e);
    }
  }, [cart]);
  
  // Seller State (default to current employee or first active)
  const activeSellers = useMemo(() => employees.filter(e => e.status === 'Activo'), [employees]);
  const [selectedSellerId, setSelectedSellerId] = useState<string>(() => {
    return currentUser?.id || activeSellers[0]?.id || '';
  });

  // Sync selectedSellerId when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setSelectedSellerId(currentUser.id);
    }
  }, [currentUser]);

  // Checkout states
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Sale['paymentMethod']>('Efectivo');
  const [cashReceived, setCashReceived] = useState<string>('');
  const [latestCompletedSale, setLatestCompletedSale] = useState<Sale | null>(null);
  const [solicitaIva, setSolicitaIva] = useState(false);

  // Automated Local Integrated Payment States
  const [terminalState, setTerminalState] = useState<'idle' | 'waiting' | 'processing' | 'approved' | 'error'>('idle');
  const [qrState, setQrState] = useState<'idle' | 'generating' | 'waiting' | 'approved' | 'error'>('idle');
  const [terminalTxId, setTerminalTxId] = useState<string>('');
  const [qrTxId, setQrTxId] = useState<string>('');
  const [autoConfirmOnPay, setAutoConfirmOnPay] = useState<boolean>(true);

  // Auto trigger states when changing payment method
  React.useEffect(() => {
    if (!isCheckoutOpen) {
      setTerminalState('idle');
      setQrState('idle');
      setTerminalTxId('');
      setQrTxId('');
      return;
    }

    if (paymentMethod === 'Tarjeta de Crédito' || paymentMethod === 'Tarjeta de Débito') {
      setTerminalState('waiting');
      setQrState('idle');
      setTerminalTxId('TER-' + Math.floor(100000 + Math.random() * 900000));
    } else if (paymentMethod === 'Transferencia') {
      setQrState('generating');
      setTerminalState('idle');
      const timer = setTimeout(() => {
        setQrState('waiting');
        setQrTxId('MP-QR-' + Math.floor(100000 + Math.random() * 900000));
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setTerminalState('idle');
      setQrState('idle');
    }
  }, [paymentMethod, isCheckoutOpen]);

  // Customer selection / creation state
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerMode, setCustomerMode] = useState<'select' | 'new'>('select');
  const [customerEmailSearch, setCustomerEmailSearch] = useState('');
  
  // New Customer Form state
  const [newCustName, setNewCustName] = useState('');
  const [newCustEmail, setNewCustEmail] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustDocId, setNewCustDocId] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');

  // Email states for receipt modal
  const [emailToReceipt, setEmailToReceipt] = useState('');
  const [emailStatus, setEmailStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [phoneForWhatsApp, setPhoneForWhatsApp] = useState('');

  // AFIP Fiscal Billing checkout state
  const [billingType, setBillingType] = useState<'ticket' | 'factura'>(() => {
    return storeSettings.billingConfig?.enabled ? 'factura' : 'ticket';
  });
  const [docTipo, setDocTipo] = useState<number>(99); // 99 = Consumidor Final, 96 = DNI, 80 = CUIT
  const [docNro, setDocNro] = useState<string>('');
  const [docNombre, setDocNombre] = useState<string>('');
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  React.useEffect(() => {
    if (storeSettings.billingConfig?.enabled) {
      setBillingType('factura');
    } else {
      setBillingType('ticket');
    }
  }, [storeSettings.billingConfig?.enabled]);

  // Pre-fill email and phone output when latest completed sale loads
  React.useEffect(() => {
    if (latestCompletedSale) {
      setEmailToReceipt(latestCompletedSale.customer?.email || '');
      setPhoneForWhatsApp(latestCompletedSale.customer?.phone || '');
      setEmailStatus('idle');
    }
  }, [latestCompletedSale]);

  // List of unique categories for filters
  const categories = useMemo(() => {
    const list = new Set(products.map(p => p.category));
    return ['Todos', ...Array.from(list)];
  }, [products]);

  // Filtered products list based on search & category
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch = product.name.toLowerCase().includes(query) || 
                            product.sku.toLowerCase().includes(query) ||
                            (product.barcode && product.barcode.toLowerCase().includes(query));
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  // Add Item to cart
  const addToCart = (product: Product) => {
    // Check global stock
    const cartIdx = cart.findIndex(item => item.product.id === product.id);
    const quantityInCart = cartIdx > -1 ? cart[cartIdx].quantity : 0;
    
    if (quantityInCart >= product.stock) {
      alert(`No es posible agregar más unidades. El stock disponible es ${product.stock} ${product.unit}.`);
      return;
    }

    if (cartIdx > -1) {
      const newCart = [...cart];
      newCart[cartIdx].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { product, quantity: 1 }]);
    }
  };

  // Auto-add product when searchQuery matches barcode or SKU exactly (e.g., when scanned)
  React.useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return;

    const exactMatch = products.find(product => {
      const matchBarcode = product.barcode && product.barcode.trim().toLowerCase() === query;
      const matchSku = product.sku && product.sku.trim().toLowerCase() === query;
      return matchBarcode || matchSku;
    });

    if (exactMatch) {
      addToCart(exactMatch);
      setSearchQuery('');
    }
  }, [searchQuery, products]);

  // --- Barcode / Camera Scanner Helpers & Effects ---
  const html5QrCodeRef = React.useRef<Html5Qrcode | null>(null);
  const isStoppingRef = React.useRef<boolean>(false);
  const lastScannedCode = React.useRef<string>('');
  const lastScannedTime = React.useRef<number>(0);

  // Play a beautiful synthesized beep sound for real-time barcode feedback
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 key
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      oscillator.start(audioCtx.currentTime);
      oscillator.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      console.warn("Audio Context beep blocked or failed:", e);
    }
  };

  const stopScanning = async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;
    setScanFeedback(null);

    if (html5QrCodeRef.current) {
      const scanner = html5QrCodeRef.current;
      html5QrCodeRef.current = null;
      try {
        if (scanner.isScanning) {
          await scanner.stop();
        }
      } catch (err) {
        console.warn("Camara detenida silenciosamente (sin error):", err);
      } finally {
        try {
          scanner.clear();
        } catch (e) {
          // ignore clear error if DOM node was detached
        }
      }
    }

    setIsScanning(false);
    isStoppingRef.current = false;
  };

  const handleBarcodeScanned = (code: string) => {
    const cleanedCode = code.trim();
    if (!cleanedCode) return;

    const now = Date.now();
    // Prevent immediate re-scan of the exact same code within 1.8s
    if (lastScannedCode.current === cleanedCode && now - lastScannedTime.current < 1800) {
      return;
    }
    lastScannedCode.current = cleanedCode;
    lastScannedTime.current = now;

    // Find product matching this barcode or SKU
    const foundProduct = products.find(p => {
      const matchBarcode = p.barcode && p.barcode.trim().toLowerCase() === cleanedCode.toLowerCase();
      const matchSku = p.sku && p.sku.trim().toLowerCase() === cleanedCode.toLowerCase();
      return matchBarcode || matchSku;
    });

    if (foundProduct) {
      const cartIdx = cart.findIndex(item => item.product.id === foundProduct.id);
      const quantityInCart = cartIdx > -1 ? cart[cartIdx].quantity : 0;
      
      if (quantityInCart >= foundProduct.stock) {
        playBeep();
        setScanFeedback({
          type: 'error',
          message: `Stock insuficiente: "${foundProduct.name}" (Límite: ${foundProduct.stock})`
        });
        return;
      }

      // Add to cart
      addToCart(foundProduct);
      playBeep();

      setScanFeedback({
        type: 'success',
        message: `¡Agregado! ${foundProduct.name} - $${foundProduct.price.toLocaleString('es-AR')}`
      });

      if (autoCloseOnScan) {
        setTimeout(() => {
          stopScanning();
        }, 800);
      }
    } else {
      playBeep();
      setScanFeedback({
        type: 'error',
        message: `Código no registrado: "${cleanedCode}"`
      });
    }
  };

  React.useEffect(() => {
    if (isScanning) {
      setScanFeedback(null);
      isStoppingRef.current = false;
      
      const startTimer = setTimeout(async () => {
        try {
          if (!document.getElementById("reader")) return;

          const devices = await Html5Qrcode.getCameras().catch(() => []);
          if (devices.length === 0) {
            setHasCameraPermission(false);
          } else {
            setHasCameraPermission(true);
          }

          if (!document.getElementById("reader")) return;

          const scanner = new Html5Qrcode("reader");
          html5QrCodeRef.current = scanner;

          await scanner.start(
            { facingMode: "environment" },
            {
              fps: 15,
            },
            (decodedText) => {
              handleBarcodeScanned(decodedText);
            },
            () => {
              // Ignore standard scan errors
            }
          );
        } catch (err) {
          console.warn("No se pudo iniciar la cámara del escáner (manejado de forma segura):", err);
          setHasCameraPermission(false);
          setScanFeedback({
            type: 'error',
            message: "No se pudo acceder a la cámara. Otorga los permisos o ingresa mediante HTTPS."
          });
        }
      }, 350);

      return () => {
        clearTimeout(startTimer);
        if (html5QrCodeRef.current) {
          const currentScanner = html5QrCodeRef.current;
          html5QrCodeRef.current = null;
          try {
            if (currentScanner.isScanning) {
              currentScanner.stop().catch(err => {
                console.warn("Scanner stop cleanup handled:", err);
              }).finally(() => {
                try {
                  currentScanner.clear();
                } catch (e) {}
              });
            } else {
              try {
                currentScanner.clear();
              } catch (e) {}
            }
          } catch (e) {
            console.warn("Scanner cleanup exception ignored safely:", e);
          }
        }
      };
    }
  }, [isScanning]);

  // Decrease / Remove from Cart
  const updateQuantity = (productId: string, delta: number) => {
    const cartIdx = cart.findIndex(item => item.product.id === productId);
    if (cartIdx === -1) return;

    const newCart = [...cart];
    const item = newCart[cartIdx];
    const targetProduct = products.find(p => p.id === productId);

    if (!targetProduct) return;

    const newQty = item.quantity + delta;

    if (newQty <= 0) {
      // Remove
      newCart.splice(cartIdx, 1);
      setCart(newCart);
    } else {
      if (delta > 0 && newQty > targetProduct.stock) {
        alert(`No es posible agregar más unidades. El stock disponible es ${targetProduct.stock} ${targetProduct.unit}.`);
        return;
      }
      item.quantity = newQty;
      setCart(newCart);
    }
  };

  // Remove totally from Cart
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };

  // Clear Cart
  const clearCart = () => {
    setCart([]);
    setDiscountPercent(0);
    setSolicitaIva(false);
  };

  // Pricing calculations
  const subtotal = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.product.price * item.quantity), 0);
  }, [cart]);

  const discountAmount = useMemo(() => {
    return Math.round((subtotal * discountPercent) / 100);
  }, [subtotal, discountPercent]);

  const taxAmount = useMemo(() => {
    // 21% VAT included in price scenario, so we show it broken down if active
    if (!solicitaIva) return 0;
    return Math.round((subtotal - discountAmount) * 0.21);
  }, [subtotal, discountAmount, solicitaIva]);

  const total = useMemo(() => {
    return subtotal - discountAmount;
  }, [subtotal, discountAmount]);

  // Cash change calculations
  const changeAmount = useMemo(() => {
    const cash = parseFloat(cashReceived) || 0;
    return cash > total ? cash - total : 0;
  }, [cashReceived, total]);

  // Submit checkout
  const handleConfirmCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    if (!selectedSellerId) {
      alert("Por favor selecciona un cajero / vendedor para registrar la venta.");
      return;
    }

    // Require customer selection/creation when utilizing Cuenta Corriente payment method
    if (paymentMethod === 'Cuenta Corriente') {
      if (customerMode === 'select' && !selectedCustomerId) {
        alert("¡Atención! Para realizar cobros a 'Cuenta Corriente', es obligatorio asociar un cliente. Por favor selecciona un cliente de la lista/búsqueda o haz clic en 'Nuevo Cliente' para crearlo.");
        return;
      }
      if (customerMode === 'new' && (!newCustName.trim() || !newCustEmail.trim())) {
        alert("¡Atención! Para cobrar a 'Cuenta Corriente' registrando un nuevo cliente, debes ingresar de manera obligatoria el Nombre Completo y Email del cliente.");
        return;
      }
    }

    const cashValue = paymentMethod === 'Efectivo' ? (parseFloat(cashReceived) || total) : total;
    if (paymentMethod === 'Efectivo' && cashValue < total) {
      alert("La cantidad de efectivo recibido es menor al total de la venta.");
      return;
    }

    let saleCustomer: Customer | undefined = undefined;

    if (customerMode === 'new') {
      if (!newCustName.trim() || !newCustEmail.trim()) {
        alert("Por favor ingresa un nombre y correo electrónico válidos para el nuevo cliente.");
        return;
      }
      try {
        saleCustomer = onAddCustomer({
          name: newCustName.trim(),
          email: newCustEmail.trim().toLowerCase(),
          phone: newCustPhone.trim() || undefined,
          docId: newCustDocId.trim() || undefined,
          address: newCustAddress.trim() || undefined
        });

        // Reset new customer form fields
        setNewCustName('');
        setNewCustEmail('');
        setNewCustPhone('');
        setNewCustDocId('');
        setNewCustAddress('');
        setSelectedCustomerId(saleCustomer.id);
        setCustomerMode('select');
      } catch (err: any) {
        alert("Error al registrar cliente: " + err.message);
        return;
      }
    } else if (selectedCustomerId) {
      saleCustomer = customers.find(c => c.id === selectedCustomerId);
    }

    const itemsToRegister = cart.map(item => ({
      productId: item.product.id,
      quantity: item.quantity,
      customProduct: item.product,
      productName: item.product.name,
      price: item.product.price
    }));

    // Process fiscal billing if selected
    let afipFields: Partial<Sale> = {};
    if (billingType === 'factura') {
      setIsGeneratingInvoice(true);
      try {
        const itemsPayload = cart.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        }));

        const storeEmail = storeSettings.email || 'bigmax24h7@gmail.com';
        const res = await fetch('/api/afip/process-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            storeEmail,
            docTipo: Number(docTipo),
            docNro: docNro ? Number(docNro) : undefined,
            totalAmount: total,
            items: itemsPayload
          })
        });

        const result = await res.json();
        if (!res.ok || !result.success) {
          throw new Error(result.error || 'No se pudo generar la factura fiscal en la AFIP.');
        }

        const dataObj = result.data || result;

        afipFields = {
          billingType: 'factura',
          cae: dataObj.cae,
          caeVencimiento: dataObj.caeVencimiento,
          comprobanteNumero: dataObj.comprobanteNumero,
          puntoDeVenta: dataObj.puntoDeVenta,
          qrImageDataUrl: dataObj.qrImageDataUrl,
          afipQrUrl: dataObj.afipQrUrl,
          docTipo: Number(docTipo),
          docNro: docNro ? Number(docNro) : undefined,
          isPending: !!dataObj.isPending
        };

        if (dataObj.isPending) {
          alert("⏱️ ARCA/AFIP está demorando o se encuentra fuera de servicio temporalmente.\n\nLa venta se registró con éxito y quedó en cola de emisión automática. El ticket impreso saldrá marcado como 'Pendiente de Autorización'.");
        }
      } catch (err: any) {
        alert("Error al emitir Factura Fiscal AFIP: " + err.message + "\n\nSe canceló la transacción. Por favor, selecciona 'Ticket No Fiscal' si deseas realizar una venta sin registro AFIP en este momento.");
        setIsGeneratingInvoice(false);
        return;
      } finally {
        setIsGeneratingInvoice(false);
      }
    } else {
      afipFields = {
        billingType: 'ticket'
      };
    }

    try {
      const sale = onRegisterSale(
        itemsToRegister,
        discountPercent,
        paymentMethod,
        cashValue,
        selectedSellerId,
        saleCustomer,
        solicitaIva,
        afipFields
      );

      setLatestCompletedSale(sale);
      setCart([]);
      setDiscountPercent(0);
      setCashReceived('');
      setIsCheckoutOpen(false);
      setSelectedCustomerId('');
      setSolicitaIva(false);
      setCustomerEmailSearch('');
      setDocNro('');
      setDocNombre('');
    } catch (err: any) {
      alert(err.message || "Error al procesar la venta");
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-full items-start">
      
      {/* Left Column: Product Selection Catalog */}
      <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200 p-3.5 sm:p-6 shadow-xs flex flex-col space-y-4 sm:space-y-6">
        
        {/* Banner with helpful hints */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold font-sans text-slate-800 tracking-tight">Catálogo de Productos</h2>
            <p className="text-xs text-slate-500 mt-0.5">Selecciona o busca productos para venderlos</p>
          </div>
          
          {/* Seller / Operator Quick Dropdown to simulate different users */}
          <div className="flex items-center gap-1.5 bg-slate-50 px-2.5 sm:px-3 py-1.5 rounded-xl border border-slate-200 w-full sm:w-auto max-w-full min-w-0 overflow-hidden self-start md:self-auto">
            <Users className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs text-slate-600 font-medium font-sans shrink-0">Vendedor:</span>
            <select
              value={selectedSellerId}
              onChange={(e) => setSelectedSellerId(e.target.value)}
              className="text-xs bg-transparent border-none text-slate-800 focus:outline-hidden font-semibold cursor-pointer min-w-0 flex-1 truncate max-w-[170px] xs:max-w-[210px] sm:max-w-xs"
            >
              <option value="" disabled>Seleccionar...</option>
              {activeSellers.map(emp => {
                const roleTag = emp.role && !emp.name.toLowerCase().includes(emp.role.toLowerCase()) ? ` (${emp.role})` : '';
                return (
                  <option key={emp.id} value={emp.id}>
                    {emp.name}{roleTag}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Search and Categories bar */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nombre, categoría, código o SKU..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = searchQuery.trim().toLowerCase();
                    if (!query) return;

                    // Find if there is any product with an exact barcode or SKU match
                    const exactMatch = products.find(product => {
                      const matchBarcode = product.barcode && product.barcode.trim().toLowerCase() === query;
                      const matchSku = product.sku && product.sku.trim().toLowerCase() === query;
                      return matchBarcode || matchSku;
                    });

                    if (exactMatch) {
                      addToCart(exactMatch);
                      setSearchQuery('');
                    } else if (filteredProducts.length === 1) {
                      addToCart(filteredProducts[0]);
                      setSearchQuery('');
                    }
                  }
                }}
                className="w-full pl-11 pr-12 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setIsScanning(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all active:scale-95 flex items-center justify-center cursor-pointer select-none border border-emerald-200/50"
                title="Escanear con Cámara"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsCalculatorOpen(true)}
              className="px-3.5 py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/15 transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer shrink-0 font-sans tracking-tight"
              title="Abrir Calculadora Rápida para sumar importes libres (120+50000+250)"
            >
              <Calculator className="w-4 h-4 text-emerald-100 shrink-0" />
              <span className="hidden sm:inline font-black uppercase tracking-wider text-[11px]">Venta Rápida</span>
              <span className="sm:hidden font-black text-[11px]">Calc</span>
            </button>
          </div>

          {/* Horizon Category Badges list */}
          <div className="flex flex-nowrap sm:flex-wrap gap-1.5 pb-2 border-b border-slate-100 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`
                  px-3 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all duration-150 capitalize flex-shrink-0 cursor-pointer whitespace-nowrap
                  ${activeCategory === cat 
                    ? 'bg-blue-50 text-blue-950 border-b-2 border-blue-600' 
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'}
                `}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic products list */}
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
            <Ban className="w-10 h-10 text-slate-400 mb-2" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron productos</p>
            <p className="text-xs text-slate-400 mt-1">Intenta con otra búsqueda o ingresa un producto nuevo en Stock</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 max-h-[500px] overflow-y-auto pr-1">
            {filteredProducts.map((product) => {
              const inCartItem = cart.find(item => item.product.id === product.id);
              const inCartQty = inCartItem ? inCartItem.quantity : 0;
              const isLowStock = product.stock <= product.minStock;
              const isOutOfStock = product.stock <= 0;

              return (
                <button
                  key={product.id}
                  onClick={() => !isOutOfStock && addToCart(product)}
                  disabled={isOutOfStock}
                  className={`
                    text-left p-3.5 sm:p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between min-h-[144px] h-auto relative cursor-pointer group
                    ${isOutOfStock 
                      ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed' 
                      : inCartQty > 0
                        ? 'bg-blue-50/40 border-blue-400 shadow-sm shadow-blue-500/5 hover:border-blue-500'
                        : 'bg-white border-slate-200 hover:border-slate-350 hover:shadow-xs'}
                  `}
                >
                  {/* Badge quantity or alerts */}
                  {inCartQty > 0 && (
                    <span className="absolute top-2 right-2 bg-blue-600 text-white font-mono font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center shadow-sm z-10">
                      {inCartQty}
                    </span>
                  )}

                  <div className="flex justify-between items-start gap-2 w-full">
                    <div className="min-w-0 flex-1 pr-6">
                      <span className="text-[10px] font-semibold text-slate-400 tracking-wider font-mono uppercase truncate block">
                        {product.category}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 break-words leading-snug mt-0.5 group-hover:text-blue-700 transition-colors" title={product.name}>
                        {product.name}
                      </h3>
                      <p className="text-[10px] font-mono text-slate-500 mt-0.5 font-semibold truncate">SKU: {product.sku}</p>
                    </div>
                    {product.imageUrl && (
                      <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-lg border border-slate-150 overflow-hidden shrink-0 bg-slate-50 shadow-xxs">
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>

                  <div className="flex items-end justify-between mt-2 pt-2 border-t border-slate-50 w-full">
                    <div>
                      <span className="text-xs text-slate-400">Stock: </span>
                      <span className={`text-xs font-semibold
                        ${isOutOfStock ? 'text-red-600 font-bold' : isLowStock ? 'text-amber-500 font-bold' : 'text-slate-600'}
                      `}>
                        {isOutOfStock ? 'AGOTADO' : `${product.stock} ${product.unit}`}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-slate-900 block font-mono">
                        ${product.price.toLocaleString('es-AR')}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Column: Active Shopping Cart */}
      <div className="xl:col-span-5 flex flex-col space-y-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between h-[525px] xl:h-[560px]">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-emerald-600" />
                <h2 className="text-base font-bold text-slate-800 font-sans tracking-tight">Caja / Pedido Activo</h2>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs flex items-center gap-1.5 text-slate-400 hover:text-red-500 font-semibold cursor-pointer py-1 px-2 hover:bg-red-50 rounded-lg transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Vaciar
                </button>
              )}
            </div>

            {/* Cart products list */}
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 md:py-10 text-center">
                <div className="p-3 bg-emerald-50 rounded-full text-emerald-600 mb-2">
                  <ShoppingCart className="w-6 h-6" />
                </div>
                <p className="text-xs font-bold text-slate-700">Tu carrito está vacío</p>
                <p className="text-[10px] text-slate-400 max-w-xs mt-1">
                  Haz clic en los productos del catálogo o utiliza la Calculadora Rápida para sumar importes libres.
                </p>
                
                <button
                  type="button"
                  onClick={() => setIsCalculatorOpen(true)}
                  className="mt-3.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 font-sans"
                >
                  <Calculator className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Calculadora / Venta Rápida</span>
                </button>
              </div>
            ) : (
              <div className="overflow-y-auto max-h-[145px] xl:max-h-[180px] divide-y divide-slate-100 mt-1 pr-1">
                {cart.map((item) => (
                  <div key={item.product.id} className="py-3 flex items-center justify-between gap-2 group">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate" title={item.product.name}>
                        {item.product.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 font-mono">
                        ${item.product.price.toLocaleString('es-AR')} c/u • Sub: ${(item.product.price * item.quantity).toLocaleString('es-AR')}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-xl border border-slate-200">
                      <button
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-xs font-mono font-bold text-slate-800 px-1 min-w-[20px] text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="p-1 text-slate-500 hover:text-emerald-600 hover:bg-white rounded-lg transition-all cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Trash buttons */}
                    <button
                      onClick={() => removeFromCart(item.product.id)}
                      className="p-1.5 text-slate-350 hover:text-red-500 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pricing receipt totals footer */}
          <div className="border-t border-slate-100 pt-4 mt-auto space-y-3.5 bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Subtotal neto</span>
              <span className="font-mono font-medium">${subtotal.toLocaleString('es-AR')}</span>
            </div>

            {/* Discount Inputs slider with lucide triggers */}
            <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1">
                  <TrendingDown className="w-3.5 h-3.5 text-amber-500" />
                  Aplicar Descuento
                </span>
                <span className="font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                  -{discountPercent}%
                </span>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="5"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer h-1.5 bg-slate-200 rounded-lg"
                />
                <select
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(parseInt(e.target.value))}
                  className="text-xs font-semibold bg-white border border-slate-300 rounded px-1.5 py-0.5 focus:outline-hidden"
                >
                  <option value={0}>0%</option>
                  <option value={5}>5%</option>
                  <option value={10}>10%</option>
                  <option value={15}>15%</option>
                  <option value={20}>20%</option>
                  <option value={30}>30%</option>
                  <option value={50}>50%</option>
                </select>
              </div>
            </div>

            {/* Breakdown itemized */}
            <div className="space-y-1.5 text-xs text-slate-500 border-t border-slate-100/60 pt-2">
              {discountPercent > 0 && (
                <div className="flex items-center justify-between text-amber-600">
                  <span>Ahorro Descuento</span>
                  <span className="font-mono">-${discountAmount.toLocaleString('es-AR')}</span>
                </div>
              )}
              
              {/* Interactive IVA toggle */}
              <div className="bg-slate-50/70 p-2.5 rounded-xl border border-slate-200/50 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wide">
                    Factura con IVA
                  </span>
                  <button
                    type="button"
                    onClick={() => setSolicitaIva(!solicitaIva)}
                    className={`
                      px-2 py-0.5 text-[9px] font-extrabold rounded-md transition-all cursor-pointer flex items-center gap-1
                      ${solicitaIva 
                        ? 'bg-emerald-500 text-white shadow-xs' 
                        : 'bg-slate-200 text-slate-500 hover:bg-slate-300'
                      }
                    `}
                  >
                    <span className={`w-1 h-1 rounded-full ${solicitaIva ? 'bg-white animate-pulse' : 'bg-slate-400'}`}></span>
                    {solicitaIva ? 'SI' : 'NO'}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>{solicitaIva ? 'IVA (21% Discriminado)' : 'IVA (Desactivado)'}</span>
                  <span className="font-mono">${taxAmount.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            {/* Total Grand display */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span className="text-base font-bold text-slate-800">Total a Pagar</span>
              <span className="text-2xl font-black text-blue-600 font-mono">
                ${total.toLocaleString('es-AR')}
              </span>
            </div>

            {/* Checkout Trigger */}
            <button
              onClick={() => cart.length > 0 && setIsCheckoutOpen(true)}
              disabled={cart.length === 0}
              className={`
                w-full py-4 rounded-xl font-bold flex items-center justify-center gap-2 text-sm shadow-md transition-all duration-200 cursor-pointer
                ${cart.length > 0 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-600/15' 
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'}
              `}
            >
              <DollarSign className="w-4.5 h-4.5" />
              Proceder al Pago
            </button>
          </div>
        </div>
      </div>
       {/* MODAL 1: CHECKOUT CON FIRMADO DE VENTA */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl md:max-w-3xl w-full border border-slate-200 shadow-2xl p-3.5 sm:p-5 relative max-h-[96vh] sm:max-h-[92vh] flex flex-col">
            {/* Header with Prominent Total Display */}
            <div className="pb-2.5 border-b border-slate-100 shrink-0 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="text-emerald-500 w-4.5 h-4.5" />
                  Finalizar Transacción
                </h3>
                <p className="text-[11px] text-slate-500 hidden sm:block">Selecciona el método de pago y confirma la venta al instante.</p>
              </div>
              <div className="bg-emerald-600 text-white px-3 py-1 sm:py-1.5 rounded-xl font-black font-mono text-base sm:text-lg shadow-sm shadow-emerald-600/20 flex items-center gap-1 shrink-0">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-100">TOTAL:</span>
                <span>${total.toLocaleString('es-AR')}</span>
              </div>
            </div>

            <form onSubmit={handleConfirmCheckout} className="flex-1 overflow-y-auto py-2.5 pr-1 space-y-3">
              {/* Payment Method Selector (Compact 5-button bar) */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Método de Pago
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
                  {(['Efectivo', 'Tarjeta de Crédito', 'Tarjeta de Débito', 'Transferencia', 'Cuenta Corriente'] as Sale['paymentMethod'][]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`
                        py-1.5 px-1 text-[10px] sm:text-[11px] font-bold rounded-xl border flex items-center justify-center gap-1 transition-all cursor-pointer text-center
                        ${paymentMethod === method 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-black ring-2 ring-blue-500/20' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}
                      `}
                    >
                      {method === 'Efectivo' && <span className="text-xs">💵</span>}
                      {method.startsWith('Tarjeta') && <span className="text-xs">💳</span>}
                      {method === 'Transferencia' && <span className="text-xs">📱</span>}
                      {method === 'Cuenta Corriente' && <span className="text-xs">🤝</span>}
                      <span className="truncate">{method === 'Tarjeta de Crédito' ? 'T. Crédito' : method === 'Tarjeta de Débito' ? 'T. Débito' : method === 'Cuenta Corriente' ? 'Cta. Cte.' : method}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Cuenta Corriente Guidance Indicator */}
              {paymentMethod === 'Cuenta Corriente' && (
                <div className="bg-amber-50/80 border border-amber-300 p-2.5 rounded-xl space-y-0.5">
                  <p className="font-bold flex items-center gap-1.5 text-amber-900 text-xs">
                    <span>🤝</span> Cuenta Corriente Activa
                  </p>
                  <p className="leading-snug text-amber-800 text-[10.5px] font-medium">
                    El cobro se convertirá en <span className="font-bold">saldo deudor</span> para el cliente. Es obligatorio asociar un cliente registrado.
                  </p>
                </div>
              )}

              {/* Cash Collector (Only if "Efectivo") */}
              {paymentMethod === 'Efectivo' && (
                <div className="bg-blue-50/40 p-2.5 sm:p-3 rounded-xl border border-blue-200/60 space-y-2">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5">
                    <label className="block text-xs font-bold text-slate-700 shrink-0">
                      Monto de Efectivo Recibido ($)
                    </label>
                    {/* Quick Exact & Bill Chips */}
                    <div className="flex flex-wrap items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setCashReceived(total.toString())}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-black cursor-pointer shadow-2xs transition-colors"
                      >
                        $ Exacto (${total.toLocaleString('es-AR')})
                      </button>
                      {[1000, 2000, 5000, 10000, 20000].map(bill => (
                        <button
                          key={bill}
                          type="button"
                          onClick={() => setCashReceived(bill.toString())}
                          className="px-1.5 py-0.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-[10px] font-bold cursor-pointer font-mono shadow-2xs"
                        >
                          ${bill >= 1000 ? `${bill/1000}k` : bill}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={cashReceived}
                        onChange={(e) => setCashReceived(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono"
                        required={paymentMethod === 'Efectivo'}
                      />
                    </div>

                    {(() => {
                      const cash = parseFloat(cashReceived) || 0;
                      if (cashReceived === '') {
                        return (
                          <div className="text-[11px] bg-slate-100/80 px-2.5 py-1.5 text-slate-500 font-medium rounded-lg text-center">
                            A la espera de efectivo...
                          </div>
                        );
                      }
                      if (cash < total) {
                        const amountMissing = total - cash;
                        return (
                          <div className="text-[11px] bg-rose-50 px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 font-bold flex items-center justify-between">
                            <span>⚠️ Falta:</span>
                            <span className="font-mono text-xs">${amountMissing.toLocaleString('es-AR')}</span>
                          </div>
                        );
                      } else {
                        const change = cash - total;
                        return (
                          <div className="flex items-center justify-between py-1.5 px-3 bg-emerald-500/[0.1] rounded-xl border border-emerald-500 text-emerald-950 font-sans shadow-2xs">
                            <span className="font-black text-[10px] uppercase tracking-wider text-emerald-800">Vuelto:</span>
                            <span className="text-base font-black text-emerald-600 font-mono">
                              ${change.toLocaleString('es-AR')}
                            </span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                </div>
              )}

              {/* LOCAL INTEGRATED PAYMENT TERMINAL & QR SIMULATOR */}
              {(paymentMethod === 'Tarjeta de Crédito' || paymentMethod === 'Tarjeta de Débito') && (
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 space-y-2 animate-fade-in shadow-md">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                      📶 Smart POS Link (Mercado Pago / Clover / Lapos)
                    </span>
                    <span className="text-[9px] bg-slate-800 px-1.5 py-0.5 rounded font-mono text-slate-300">
                      ID: {terminalTxId}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 py-0.5">
                    <div className="w-10 h-12 bg-slate-800 border border-slate-700 rounded-lg flex flex-col items-center justify-between p-1 shrink-0 relative overflow-hidden shadow-inner">
                      <div className={`w-full h-5 rounded-xs flex items-center justify-center text-[7px] font-mono p-0.5 text-center leading-none
                        ${terminalState === 'approved' ? 'bg-emerald-500 text-slate-950 font-bold' : 
                          terminalState === 'processing' ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-950 text-slate-300'}`}>
                        {terminalState === 'waiting' && 'APROX.'}
                        {terminalState === 'processing' && 'PROC...'}
                        {terminalState === 'approved' && 'APROB.'}
                      </div>
                      <CreditCard className={`w-3.5 h-3.5 ${terminalState === 'approved' ? 'text-emerald-400' : 'text-slate-400'}`} />
                    </div>

                    <div className="flex-1 space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-sans">Monto sincronizado: <strong className="text-white font-mono">${total.toLocaleString('es-AR')}</strong></p>
                      <p className="text-[10.5px] font-medium">
                        {terminalState === 'waiting' && <span className="text-amber-400 animate-pulse">⏳ Esperando aproximación o inserción de tarjeta...</span>}
                        {terminalState === 'processing' && <span className="text-blue-400 flex items-center gap-1"><RefreshCw className="w-3 h-3 animate-spin" /> Procesando pago con banco...</span>}
                        {terminalState === 'approved' && <span className="text-emerald-400 font-bold">✔️ ¡Transacción Aprobada!</span>}
                      </p>
                    </div>
                  </div>

                  {terminalState === 'waiting' && (
                    <button
                      type="button"
                      onClick={() => {
                        setTerminalState('processing');
                        setTimeout(() => {
                          setTerminalState('approved');
                          if (autoConfirmOnPay) {
                            setTimeout(() => {
                              handleConfirmCheckout({ preventDefault: () => {} } as React.FormEvent);
                            }, 1000);
                          }
                        }, 1200);
                      }}
                      className="w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      Simular Aproximar / Deslizar Tarjeta
                    </button>
                  )}
                </div>
              )}

              {paymentMethod === 'Transferencia' && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 animate-fade-in shadow-2xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1 font-sans">
                      <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                      📱 QR Dinámico Mercado Pago (${total.toLocaleString('es-AR')})
                    </span>
                    <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-mono font-bold">Interoperable</span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-20 h-20 bg-white border border-slate-200 rounded-lg p-1 shrink-0 flex flex-col items-center justify-center relative overflow-hidden shadow-inner">
                      {qrState === 'approved' ? (
                        <div className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center text-white">
                          <span className="text-lg font-black">✓</span>
                          <span className="text-[8px] font-extrabold">PAGADO</span>
                        </div>
                      ) : (
                        <svg className="w-full h-full text-slate-900" viewBox="0 0 100 100">
                          <rect x="5" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="8" />
                          <rect x="12.5" y="12.5" width="10" height="10" fill="currentColor" />
                          <rect x="70" y="5" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="8" />
                          <rect x="77.5" y="12.5" width="10" height="10" fill="currentColor" />
                          <rect x="5" y="70" width="25" height="25" fill="none" stroke="currentColor" strokeWidth="8" />
                          <rect x="12.5" y="77.5" width="10" height="10" fill="currentColor" />
                          <rect x="42" y="42" width="16" height="16" rx="3" fill="#009ee3" />
                          <text x="50" y="53" fill="white" fontSize="10" fontWeight="black" textAnchor="middle" fontFamily="sans-serif">MP</text>
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 space-y-1 text-xs">
                      {qrState === 'waiting' && (
                        <p className="text-amber-600 font-bold animate-pulse text-[11px]">
                          ⏱️ Esperando confirmación de cobro MP...
                        </p>
                      )}
                      {qrState === 'approved' && (
                        <p className="text-emerald-600 font-bold text-[11px]">
                          ✔️ ¡Pago acreditado de inmediato!
                        </p>
                      )}
                      {qrState === 'waiting' && (
                        <button
                          type="button"
                          onClick={() => {
                            setQrState('approved');
                            if (autoConfirmOnPay) {
                              setTimeout(() => {
                                handleConfirmCheckout({ preventDefault: () => {} } as React.FormEvent);
                              }, 1000);
                            }
                          }}
                          className="py-1 px-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold cursor-pointer"
                        >
                          Simular Pago Cliente (MP)
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Grid 2 Columns for Comprobante, Cliente & Cajero */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                
                {/* Tipo de Comprobante AFIP / Ticket */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1 font-sans">
                      <span>🧾</span> Comprobante
                    </span>
                    <div className="flex bg-slate-200/70 p-0.5 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setBillingType('ticket')}
                        className={`px-2 py-0.5 text-[9px] font-extrabold rounded cursor-pointer ${billingType === 'ticket' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'}`}
                      >
                        Ticket
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingType('factura')}
                        className={`px-2 py-0.5 text-[9px] font-extrabold rounded cursor-pointer ${billingType === 'factura' ? 'bg-blue-600 text-white shadow-2xs' : 'text-slate-500'}`}
                      >
                        Factura AFIP
                      </button>
                    </div>
                  </div>

                  {billingType === 'factura' && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-200">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="block text-[8.5px] font-bold text-slate-500 uppercase">Documento</label>
                          <select
                            value={docTipo}
                            onChange={(e) => {
                              const val = Number(e.target.value);
                              setDocTipo(val);
                              if (val === 99) setDocNro('');
                            }}
                            className="w-full bg-white border border-slate-250 rounded px-1.5 py-1 text-[11px] text-slate-800"
                          >
                            <option value={99}>Consumidor Final</option>
                            <option value={96}>DNI (Persona)</option>
                            <option value={80}>CUIT (Empresa)</option>
                          </select>
                        </div>
                        {docTipo !== 99 && (
                          <div>
                            <label className="block text-[8.5px] font-bold text-slate-500 uppercase">Número</label>
                            <input
                              type="text"
                              placeholder={docTipo === 80 ? 'CUIT 11 dig' : 'DNI 8 dig'}
                              value={docNro}
                              onChange={(e) => setDocNro(e.target.value.replace(/\D/g, ''))}
                              className="w-full bg-white border border-slate-250 rounded px-1.5 py-1 text-[11px] font-mono text-slate-800"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Asociar Cliente */}
                <div className="bg-slate-50/80 p-2.5 rounded-xl border border-slate-200/70 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-500" />
                      <span>Cliente</span>
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCustomerMode('select')}
                        className={`px-1.5 py-0.5 text-[8.5px] font-bold rounded cursor-pointer ${customerMode === 'select' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        Buscar
                      </button>
                      <button
                        type="button"
                        onClick={() => setCustomerMode('new')}
                        className={`px-1.5 py-0.5 text-[8.5px] font-bold rounded cursor-pointer ${customerMode === 'new' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'}`}
                      >
                        + Nuevo
                      </button>
                    </div>
                  </div>

                  {customerMode === 'select' ? (
                    <select
                      value={selectedCustomerId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setSelectedCustomerId(id);
                        const match = customers.find(c => c.id === id);
                        if (match) setCustomerEmailSearch(match.email);
                        else setCustomerEmailSearch('');
                      }}
                      className="w-full px-2 py-1 bg-white border border-slate-250 rounded-lg text-[11px] font-semibold text-slate-800 cursor-pointer"
                    >
                      <option value="">Consumidor Final (Anónimo)</option>
                      {customers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} {c.docId ? `(DNI: ${c.docId})` : ''}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="grid grid-cols-2 gap-1 text-[10px]">
                      <input
                        type="text"
                        placeholder="Nombre *"
                        value={newCustName}
                        onChange={(e) => setNewCustName(e.target.value)}
                        className="p-1 bg-white border rounded text-[11px]"
                        required={customerMode === 'new'}
                      />
                      <input
                        type="email"
                        placeholder="Email *"
                        value={newCustEmail}
                        onChange={(e) => setNewCustEmail(e.target.value)}
                        className="p-1 bg-white border rounded text-[11px]"
                        required={customerMode === 'new'}
                      />
                    </div>
                  )}

                  {/* Active Cashier line */}
                  <div className="text-[10px] text-slate-500 pt-1 border-t border-slate-200/60 flex items-center justify-between">
                    <span className="font-semibold text-slate-600">Cajero:</span>
                    {currentUser ? (
                      <span className="font-bold text-slate-800 bg-slate-200/60 px-1.5 py-0.5 rounded text-[9.5px]">
                        {currentUser.name} ({currentUser.role})
                      </span>
                    ) : (
                      <select
                        value={selectedSellerId}
                        onChange={(e) => setSelectedSellerId(e.target.value)}
                        className="bg-white border rounded px-1 py-0.5 text-[10px] font-bold text-slate-700"
                        required
                      >
                        <option value="" disabled>Elegir Cajero...</option>
                        {activeSellers.map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

              </div>
            </form>

            {/* Sticky Action Footer */}
            <div className="flex items-center gap-2 pt-2.5 mt-1 border-t border-slate-100 shrink-0">
              <button
                type="button"
                disabled={isGeneratingInvoice}
                onClick={() => setIsCheckoutOpen(false)}
                className="py-2.5 px-3 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs sm:text-sm cursor-pointer transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmCheckout}
                disabled={isGeneratingInvoice}
                className={`
                  flex-1 py-2.5 sm:py-3 px-4 font-black rounded-xl text-xs sm:text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5
                  ${isGeneratingInvoice 
                    ? 'bg-blue-600 text-white cursor-not-allowed' 
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/20 active:scale-[0.99]'
                  }
                `}
              >
                {isGeneratingInvoice ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Autorizando AFIP...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5" />
                    <span>Confirmar Venta (${total.toLocaleString('es-AR')})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GORGEOUS PRINTABLE THERMAL RECEIPT popup */}
      {latestCompletedSale && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          {/* Custom style to isolate the print layout beautifully and avoid cutoffs */}
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              body * {
                visibility: hidden !important;
              }
              #thermal-ticket-print, #thermal-ticket-print * {
                visibility: visible !important;
              }
              #thermal-ticket-print {
                position: absolute !important;
                left: 0 !important;
                top: 0 !important;
                width: 80mm !important; /* Perfect for standard 80mm thermal printers */
                max-height: none !important;
                overflow: visible !important;
                border: none !important;
                box-shadow: none !important;
                margin: 0 auto !important;
                padding: 10px !important;
              }
            }
          `}} />

          <div className="bg-slate-100 rounded-3xl p-5 max-w-sm w-full border border-slate-200 shadow-2xl relative flex flex-col max-h-[85vh] md:max-h-[80vh] shrink-0 animate-scale-up">
            
            {/* Absolute close button in the top-right corner */}
            <button 
              onClick={() => setLatestCompletedSale(null)}
              className="absolute top-3.5 right-3.5 text-slate-400 hover:text-slate-700 bg-white hover:bg-slate-200/80 border border-slate-200/60 p-1.5 rounded-full shadow-xxs transition-all cursor-pointer z-10"
              title="Cerrar ticket"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header section (static) */}
            <div className="flex flex-col items-center mb-3.5 text-center shrink-0 pr-6">
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 mb-1.5 shadow-xxs">
                <Check className="w-5 h-5 stroke-[2.5]" />
              </div>
              <h4 className="text-sm font-black text-slate-800 tracking-tight">¡Venta Registrada!</h4>
              <p className="text-[10px] text-slate-500 font-sans">El stock de unidades actualizó correctamente.</p>
            </div>

            {/* Scrollable container for the ticket content */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3.5 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Thermal ticket container */}
              <div id="thermal-ticket-print" className="bg-white p-4 rounded-2xl w-full border border-slate-200 shadow-xs flex flex-col font-mono text-[11px] leading-relaxed relative text-slate-800">
                
                {/* Receipt zig-zag aesthetic borders */}
                <div className="text-center pb-3 border-b border-dashed border-slate-200 mb-2.5 flex flex-col items-center">
                  {storeSettings.logoUrl ? (
                    <img 
                      src={storeSettings.logoUrl} 
                      alt="Logo" 
                      className="w-11 h-11 object-contain mb-2 rounded-lg border border-slate-150 p-0.5 bg-slate-50"
                    />
                  ) : (
                    <span className="text-lg mb-1 leading-none">🏪</span>
                  )}
                  
                  <h5 className="font-extrabold text-xs uppercase tracking-tight text-slate-900 leading-tight">
                    {storeSettings.name || 'MAX24 SYSTEM'}
                  </h5>
                  <p className="text-[9px] text-slate-500 leading-tight mt-0.5 max-w-[190px] truncate mx-auto">
                    {storeSettings.address || 'Calle Comercial 456, Buenos Aires'}
                  </p>
                  <p className="text-[9px] text-slate-400">
                    Tel: {storeSettings.phone || '+54 11 4455-6677'}
                  </p>
                  {storeSettings.schedule && (
                    <p className="text-[8px] text-slate-400 italic">
                      Horario: {storeSettings.schedule}
                    </p>
                  )}
                  <div className="my-1 text-slate-300">--------------------------</div>
                  <div className="flex items-center justify-between text-[9px] text-slate-500 px-1 w-full">
                    <span>Ticket: {latestCompletedSale.id}</span>
                    <span>{new Date(latestCompletedSale.date).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Items Table */}
                <div className="space-y-1.5 mb-2.5">
                  <div className="flex items-center justify-between font-bold text-[10px] text-slate-500 border-b border-slate-100 pb-1">
                    <span>Detalle</span>
                    <span>Total</span>
                  </div>
                  {latestCompletedSale.items.map((item, idx) => (
                    <div key={idx} className="flex items-start justify-between">
                      <div className="pr-2 max-w-[170px] truncate">
                        <span>{item.quantity}x {item.productName}</span>
                      </div>
                      <span className="font-semibold">${(item.price * item.quantity).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>

                {/* Sub, taxes, totals */}
                <div className="border-t border-dashed border-slate-200 pt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Subtotal Neto:</span>
                    <span>${latestCompletedSale.subtotal.toLocaleString('es-AR')}</span>
                  </div>
                  {latestCompletedSale.discount > 0 && (
                    <div className="flex items-center justify-between text-amber-600">
                      <span>Descuento aplicado:</span>
                      <span>-${latestCompletedSale.discount.toLocaleString('es-AR')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-slate-400 text-[10px]">
                    <span>{(latestCompletedSale.tax || 0) > 0 ? "IVA Discriminado (21%):" : "IVA (Desactivado):"}</span>
                    <span>${(latestCompletedSale.tax || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <div className="flex items-center justify-between font-bold text-xs pt-1.5 border-t border-slate-100 text-slate-900">
                    <span>Total cobrado:</span>
                    <span>${latestCompletedSale.total.toLocaleString('es-AR')}</span>
                  </div>
                </div>

                {/* Payment Details */}
                <div className="mt-2.5 bg-slate-50 p-2 rounded-lg border border-slate-100 text-[10px]" id="payment-notes">
                  <div className="flex items-center justify-between">
                    <span>Medio de Pago:</span>
                    <span className="font-bold">{latestCompletedSale.paymentMethod}</span>
                  </div>
                  {latestCompletedSale.paymentMethod === 'Efectivo' && (
                    <>
                      <div className="flex items-center justify-between mt-0.5">
                        <span>Efectivo entregado:</span>
                        <span>${(latestCompletedSale.cashReceived || 0).toLocaleString('es-AR')}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5 font-bold text-emerald-700">
                        <span>Vuelto cambiario:</span>
                        <span>${(latestCompletedSale.change || 0).toLocaleString('es-AR')}</span>
                      </div>
                    </>
                  )}
                  <div className="flex items-center justify-between mt-1 text-slate-500 font-sans border-t border-slate-200 pt-1 text-[9px]">
                    <span>Le atendió:</span>
                    <span className="italic">{latestCompletedSale.sellerName}</span>
                  </div>
                  {latestCompletedSale.customer && (
                    <div className="mt-1.5 pt-1.5 border-t border-dashed border-slate-200 text-[9px] text-left leading-tight font-sans">
                      <span className="font-bold text-slate-700 block mb-0.5">Cliente Asociado:</span>
                      <span className="font-semibold text-slate-900 block">{latestCompletedSale.customer.name}</span>
                      {latestCompletedSale.customer.docId && <span className="text-slate-500 text-[8px]">DNI: {latestCompletedSale.customer.docId} | </span>}
                      {latestCompletedSale.customer.phone && <span className="text-slate-500 text-[8px]">Tel: {latestCompletedSale.customer.phone}</span>}
                      <span className="text-slate-500 text-[8px] block break-all">{latestCompletedSale.customer.email}</span>
                    </div>
                  )}
                </div>

                {/* AFIP Fiscal Details (only if bill is fiscal) */}
                {latestCompletedSale.billingType === 'factura' && (
                  <div className="mt-2.5 pt-2.5 border-t-2 border-dashed border-slate-250 text-[9.5px] space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    {latestCompletedSale.cae === 'PENDIENTE' || latestCompletedSale.isPending ? (
                      <>
                        <div className="text-center font-bold text-[9px] text-amber-850 bg-amber-50 border border-amber-250 py-1.5 px-2 rounded-lg uppercase tracking-tight mb-2 flex flex-col items-center justify-center gap-1 font-sans">
                          <span className="font-extrabold text-[10px]">⚠️ COMPROBANTE PENDIENTE</span>
                          <span className="text-[8px] font-medium lowercase text-amber-700 leading-tight">ARCA/AFIP con demoras. Este comprobante se autorizará automáticamente en segundo plano.</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Estado:</span>
                          <span className="font-extrabold text-amber-600 font-sans">PENDIENTE</span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center font-bold text-[9.5px] text-blue-800 tracking-wider uppercase mb-1.5 flex items-center justify-center gap-1 font-sans">
                        <span>🇦🇷</span> COMPROBANTE AUTORIZADO AFIP
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-500">Razón Social:</span>
                      <span className="font-semibold text-slate-800 text-right truncate max-w-[130px]" title={storeSettings.billingConfig?.razonSocial}>
                        {storeSettings.billingConfig?.razonSocial || storeSettings.name}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CUIT Emisor:</span>
                      <span className="font-mono font-semibold text-slate-800">
                        {storeSettings.billingConfig?.cuit || storeSettings.cuit || '30-71111111-8'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Pto. Venta:</span>
                      <span className="font-mono text-slate-800">
                        {String(latestCompletedSale.puntoDeVenta || storeSettings.billingConfig?.puntoDeVenta || 1).padStart(5, '0')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Comp. Nro:</span>
                      <span className="font-mono font-bold text-slate-800">
                        {latestCompletedSale.cae === 'PENDIENTE' || latestCompletedSale.isPending 
                          ? 'PENDIENTE DE ASIGNACIÓN' 
                          : String(latestCompletedSale.comprobanteNumero || 1).padStart(8, '0')}
                      </span>
                    </div>
                    {latestCompletedSale.cae !== 'PENDIENTE' && !latestCompletedSale.isPending && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-slate-500">CAE:</span>
                          <span className="font-mono font-bold text-slate-800">
                            {latestCompletedSale.cae || '76123456789012'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Vto CAE:</span>
                          <span className="font-mono text-slate-800">
                            {latestCompletedSale.caeVencimiento ? new Date(latestCompletedSale.caeVencimiento).toLocaleDateString() : '30/07/2026'}
                          </span>
                        </div>
                      </>
                    )}

                    {latestCompletedSale.qrImageDataUrl && latestCompletedSale.cae !== 'PENDIENTE' && !latestCompletedSale.isPending && (
                      <div className="flex flex-col items-center justify-center pt-2.5 mt-2 border-t border-slate-200">
                        <img 
                          src={latestCompletedSale.qrImageDataUrl} 
                          alt="QR Fiscal AFIP" 
                          className="w-24 h-24 border border-slate-200 p-1 bg-white rounded-lg shadow-xxs"
                          referrerPolicy="no-referrer"
                        />
                        <span className="text-[7.5px] text-slate-400 mt-1 uppercase tracking-wider font-sans">Escanear para verificar en AFIP</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Thank you */}
                <div className="text-center pt-2.5 border-t border-dashed border-slate-200 mt-2.5 text-[9px] text-slate-400">
                  <p>*** GRACIAS POR SU COMPRA ***</p>
                  <span className="text-[8px]">Powered by www.max24app.com</span>
                </div>
              </div>


              {/* WhatsApp Form Card Segment */}
              <div className="w-full bg-slate-200/40 p-3 rounded-2xl border border-slate-300/10 text-left font-sans">
                <label className="block text-[10px] font-bold text-slate-650 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Enviar por WhatsApp</span>
                </label>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!phoneForWhatsApp.trim()) {
                      alert('Por favor ingrese un número de teléfono válido.');
                      return;
                    }
                    
                    let cleanPhone = phoneForWhatsApp.replace(/\D/g, '');
                    if (cleanPhone.length === 10 && !cleanPhone.startsWith('54')) {
                      cleanPhone = '549' + cleanPhone;
                    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('15')) {
                      cleanPhone = '549' + cleanPhone.slice(2);
                    } else if (!cleanPhone.startsWith('54') && cleanPhone.length < 12) {
                      cleanPhone = '54' + cleanPhone;
                    }

                    let message = `*🧾 COMPROBANTE DE COMPRA - ${storeSettings.name || 'BIG MAX'}*\n`;
                    message += `==============================\n`;
                    message += `*Ticket:* ${latestCompletedSale?.id}\n`;
                    message += `*Fecha:* ${new Date(latestCompletedSale?.date || '').toLocaleDateString()}\n\n`;
                    message += `*Detalle de Productos:*\n`;
                    
                    latestCompletedSale?.items.forEach((item) => {
                      message += `• ${item.quantity}x ${item.productName} - $${(item.price * item.quantity).toLocaleString('es-AR')}\n`;
                    });
                    
                    message += `\n------------------------------\n`;
                    message += `*Subtotal:* $${latestCompletedSale?.subtotal.toLocaleString('es-AR')}\n`;
                    if ((latestCompletedSale?.discount || 0) > 0) {
                      message += `*Descuento:* -$${latestCompletedSale?.discount.toLocaleString('es-AR')}\n`;
                    }
                    message += `*Total Cobrado:* $${latestCompletedSale?.total.toLocaleString('es-AR')}\n`;
                    message += `*Medio de Pago:* ${latestCompletedSale?.paymentMethod}\n`;
                    
                    if (latestCompletedSale?.paymentMethod === 'Efectivo') {
                      message += `*Entregado:* $${(latestCompletedSale?.cashReceived || 0).toLocaleString('es-AR')}\n`;
                      message += `*Vuelto:* $${(latestCompletedSale?.change || 0).toLocaleString('es-AR')}\n`;
                    }
                    
                    message += `\n==============================\n`;
                    message += `*¡Muchas gracias por su compra!*\n`;
                    if (storeSettings.address) {
                      message += `📍 _${storeSettings.address}_\n`;
                    }
                    if (storeSettings.phone) {
                      message += `📞 _${storeSettings.phone}_\n`;
                    }

                    const encodedMsg = encodeURIComponent(message);
                    const whatsappUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`;
                    window.open(whatsappUrl, '_blank');
                  }}
                  className="mt-1 flex gap-1.5"
                >
                  <input
                    type="text"
                    required
                    placeholder="Número de celular del cliente"
                    value={phoneForWhatsApp}
                    onChange={(e) => setPhoneForWhatsApp(e.target.value)}
                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 text-xs py-1.5 font-medium placeholder-slate-400 focus:outline-hidden focus:border-emerald-500 text-slate-800 font-sans shadow-xxs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all cursor-pointer select-none bg-emerald-600 hover:bg-emerald-500 text-white font-bold active:scale-95 shadow-md shadow-emerald-600/10"
                  >
                    <MessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span>Compartir</span>
                  </button>
                </form>
              </div>
            </div>

            {/* Footer Section (static actions) */}
            <div className="flex gap-2 w-full mt-3.5 pt-3.5 border-t border-slate-200 shrink-0">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2 bg-slate-250 hover:bg-slate-300 text-slate-700 hover:text-slate-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer transition-colors active:scale-98"
              >
                <Receipt className="w-3.5 h-3.5" />
                Imprimir
              </button>
              <button
                onClick={() => setLatestCompletedSale(null)}
                className="flex-1 py-2 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-extrabold rounded-xl flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/10 active:scale-98 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Nueva Venta
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* QUICK CALCULATOR / EXPRESS SALE MODAL */}
      {isCalculatorOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col my-auto">
            
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-xl border border-emerald-500/30">
                  <Calculator className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold font-sans text-white tracking-tight flex items-center gap-2">
                    <span>Calculadora & Venta Rápida</span>
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-300 font-mono font-bold px-1.5 py-0.5 rounded border border-emerald-500/30">
                      EXPRESS
                    </span>
                  </h3>
                  <p className="text-[10px] text-slate-300 font-medium font-sans mt-0.5">
                    Facturación rápida sin necesidad de buscar productos en catálogo
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCalculatorOpen(false)}
                className="p-1.5 hover:bg-slate-700/60 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4 max-h-[85vh] overflow-y-auto">
              
              {/* Display & Math Expression Input Screen */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 shadow-inner flex flex-col justify-between space-y-2">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono font-semibold">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <Sparkles className="w-3 h-3" />
                    <span>OPERACIÓN LIBRE (EJ: 120+50000+250)</span>
                  </span>
                  {calcExpression && (
                    <button
                      type="button"
                      onClick={() => setCalcExpression('')}
                      className="text-slate-400 hover:text-rose-400 transition-colors uppercase font-bold text-[10px] cursor-pointer"
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={calcExpression}
                  onChange={(e) => setCalcExpression(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddQuickItemToCart(true);
                    }
                  }}
                  placeholder="0 + 0"
                  autoFocus
                  className="w-full bg-transparent text-right font-mono text-lg sm:text-xl font-bold text-emerald-300 focus:outline-hidden placeholder-slate-700 tracking-wider"
                />

                <div className="flex items-baseline justify-between border-t border-slate-800/80 pt-2 mt-1">
                  <span className="text-[11px] text-slate-400 font-bold font-sans">TOTAL A FACTURAR:</span>
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tracking-tight">
                    ${calcEvaluatedTotal.toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Description & Presets */}
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <label className="font-bold text-slate-700 font-sans flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Descripción en Comprobante / Ticket</span>
                  </label>
                </div>

                <input
                  type="text"
                  value={calcDescription}
                  onChange={(e) => setCalcDescription(e.target.value)}
                  placeholder="Ej: Venta Rápida / Varios"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />

                {/* Quick Preset Description Chips */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {[
                    'Venta Rápida / Varios',
                    'Mercadería Varias',
                    'Golosinas / Almacén',
                    'Kiosco / Cigarrillos',
                    'Ferretería'
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCalcDescription(preset)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold font-sans transition-all cursor-pointer ${
                        calcDescription === preset
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200/60'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interactive Virtual Calculator Keypad Grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('C')}
                  className="p-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-mono font-black rounded-xl text-sm transition-all active:scale-95 cursor-pointer border border-rose-200/60 shadow-xxs"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('BACKSPACE')}
                  className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer border border-slate-200 flex items-center justify-center shadow-xxs"
                  title="Borrar último carácter"
                >
                  <Delete className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('/')}
                  className="p-3 bg-slate-100 hover:bg-emerald-100 text-emerald-800 font-mono font-black rounded-xl text-base transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                >
                  ÷
                </button>
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('*')}
                  className="p-3 bg-slate-100 hover:bg-emerald-100 text-emerald-800 font-mono font-black rounded-xl text-base transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                >
                  ×
                </button>

                {['7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleCalcKeyPress(num)}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-800 font-mono font-bold rounded-xl text-base transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('-')}
                  className="p-3 bg-slate-100 hover:bg-emerald-100 text-emerald-800 font-mono font-black rounded-xl text-lg transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                >
                  -
                </button>

                {['4', '5', '6'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleCalcKeyPress(num)}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-800 font-mono font-bold rounded-xl text-base transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('+')}
                  className="p-3 bg-slate-100 hover:bg-emerald-100 text-emerald-800 font-mono font-black rounded-xl text-lg transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                >
                  +
                </button>

                {['1', '2', '3'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleCalcKeyPress(num)}
                    className="p-3 bg-white hover:bg-slate-50 text-slate-800 font-mono font-bold rounded-xl text-base transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('=')}
                  className="p-3 bg-emerald-100 hover:bg-emerald-200 text-emerald-900 font-mono font-black rounded-xl text-base transition-all active:scale-95 cursor-pointer border border-emerald-300 shadow-xxs"
                >
                  =
                </button>

                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('0')}
                  className="p-3 bg-white hover:bg-slate-50 text-slate-800 font-mono font-bold rounded-xl text-base transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('00')}
                  className="p-3 bg-white hover:bg-slate-50 text-slate-800 font-mono font-bold rounded-xl text-sm transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                >
                  00
                </button>
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('.')}
                  className="p-3 bg-white hover:bg-slate-50 text-slate-800 font-mono font-bold rounded-xl text-base transition-all active:scale-95 cursor-pointer border border-slate-200 shadow-xxs"
                >
                  .
                </button>
                <button
                  type="button"
                  onClick={() => handleCalcKeyPress('+')}
                  className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-mono font-black rounded-xl text-lg transition-all active:scale-95 cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  +
                </button>
              </div>

            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleAddQuickItemToCart(false)}
                className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs rounded-xl transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer font-sans shadow-xs"
              >
                <Plus className="w-4 h-4 text-slate-600" />
                <span>Solo Agregar al Carrito</span>
              </button>

              <button
                type="button"
                onClick={() => handleAddQuickItemToCart(true)}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs sm:text-sm rounded-xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer font-sans shadow-md shadow-emerald-600/25 uppercase tracking-wide"
              >
                <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                <span>Agregar y Facturar / Cobrar (${calcEvaluatedTotal.toLocaleString('es-AR')})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* CAMERA SCANNER MODAL OVERLAY */}
      {isScanning && (
        <POSErrorBoundary onReset={() => setIsScanning(false)}>
          <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 flex flex-col">
              
              {/* Header */}
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Escáner de Cámara POS</h3>
                    <p className="text-[11px] text-slate-500 font-medium font-sans">Apunta al código con la cámara trasera</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={stopScanning}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Video Container Frame */}
              <div className="relative aspect-video w-full bg-slate-950 overflow-hidden flex items-center justify-center">
                <div id="reader" className="w-full h-full" />
                
                {/* Pulsing/Scanning Laser Visual Overlay */}
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-emerald-500/80 shadow-[0_0_12px_#10b981] animate-pulse pointer-events-none" />
                
                {/* Corner brackets */}
                <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-emerald-500 rounded-tl-md pointer-events-none" />
                <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-emerald-500 rounded-tr-md pointer-events-none" />
                <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-emerald-500 rounded-bl-md pointer-events-none" />
                <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-emerald-500 rounded-br-md pointer-events-none" />

                {/* Loader/States Overlay */}
                {hasCameraPermission === null && (
                  <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-sans">Inicializando cámara...</span>
                  </div>
                )}

                {hasCameraPermission === false && (
                  <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center p-6 text-slate-400 gap-3">
                    <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="space-y-1 px-4">
                      <p className="text-xs font-bold text-slate-200">Acceso a cámara denegado</p>
                      <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed font-sans">
                        Asegúrate de dar permisos de cámara en tu navegador. Si estás en AI Studio, usa el botón en la barra de URL o abre la app en una pestaña nueva.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Live feedback alert bar */}
              {scanFeedback && (
                <div className={`p-3 text-center border-b transition-all ${
                  scanFeedback.type === 'success' 
                    ? 'bg-emerald-50/80 border-emerald-100 text-emerald-800' 
                    : 'bg-rose-50/80 border-rose-100 text-rose-900'
                }`}>
                  <p className="text-xs font-bold font-sans flex items-center justify-center gap-1.5">
                    {scanFeedback.type === 'success' ? (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <Ban className="w-4 h-4 text-rose-600 shrink-0" />
                    )}
                    <span>{scanFeedback.message}</span>
                  </p>
                </div>
              )}

              {/* Controls panel */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex flex-col gap-3">
                <label className="flex items-center justify-between cursor-pointer select-none">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-slate-800 block font-sans">Modo de Escaneo Continuo</span>
                    <span className="text-[10px] text-slate-500 font-medium block font-sans">Permite escanear múltiples productos seguidos</span>
                  </div>
                  <div className="relative">
                    <input
                      type="checkbox"
                      checked={!autoCloseOnScan}
                      onChange={(e) => setAutoCloseOnScan(!e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-focus:ring-2 peer-focus:ring-emerald-500/30 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                  </div>
                </label>

                <div className="text-[10px] text-slate-400 bg-slate-100 border border-slate-200 p-2.5 rounded-lg leading-relaxed font-medium font-sans">
                  <span className="font-bold text-slate-600">💡 Tip de Cajero:</span> Sostén el producto estable a 10-15 cm de la cámara para que enfoque el código de barras. El sistema emitirá un sonido "bip" y lo agregará al pedido al instante.
                </div>

                <button
                  type="button"
                  onClick={stopScanning}
                  className="w-full py-2 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold rounded-xl active:scale-98 transition-all cursor-pointer font-sans"
                >
                  Cerrar Escáner
                </button>
              </div>

            </div>
          </div>
        </POSErrorBoundary>
      )}
    </div>
  );
}

export default function POSWithBoundary(props: POSProps) {
  return (
    <POSErrorBoundary>
      <POS {...props} />
    </POSErrorBoundary>
  );
}
