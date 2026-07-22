import React, { useState, useEffect, useRef } from 'react';
import { 
  ChefHat, 
  Plus, 
  Minus, 
  Trash2, 
  Settings, 
  AlertCircle, 
  CheckCircle2, 
  Printer, 
  ShoppingBag, 
  Utensils, 
  Check, 
  X, 
  Clock, 
  CreditCard, 
  ArrowRight, 
  Sparkles, 
  Pizza, 
  Flame, 
  ShieldAlert,
  Sliders,
  DollarSign,
  Truck,
  MapPin,
  Calendar,
  Pencil
} from 'lucide-react';
import { db } from '../firebase';
import { collection, doc, getDocs, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { Subscription, Employee, StoreSettings } from '../types';

// Types for the Comidas module
interface FoodModifier {
  id: string;
  name: string;
  price?: number;
  category: 'base' | 'aderezo' | 'extra';
  inStock: boolean;
}

interface FoodProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
  baseIngredients: string[];
  imageUrl?: string;
  cost?: number;    // Costo de preparación ($)
  margin?: number;  // Margen de ganancia (%)
}

interface FoodItemInOrder {
  producto_id: string;
  nombre: string;
  precio_base: number;
  quitar_ingredientes: string[];
  aderezos_seleccionados: string[];
  aderezos_excluir_todos_los_demas: boolean;
  agregados_extra: { ingrediente: string; precio: number }[];
  notas_especiales: string;
  precio_total: number;
  quantity: number;
}

interface FoodOrder {
  id: string;
  date: string;
  customerName: string;
  phone: string;
  type: 'delivery' | 'takeaway' | 'local';
  address?: string;
  items: FoodItemInOrder[];
  notes?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: 'pendiente' | 'preparando' | 'listo' | 'entregado';
  paymentMethod: string;
  paymentStatus: 'pendiente' | 'pagado';
}

interface ComidasProps {
  subscription: Subscription;
  onUpdateSubscription: (plan: Subscription['plan'], price: number) => void;
  currentUser: Employee | null;
  activeStoreEmail: string;
}

// Default/Initial Food Products
const INITIAL_FOOD_PRODUCTS: FoodProduct[] = [
  {
    id: 'food-lomito-completo',
    name: 'Lomito Completo con Fritas',
    price: 7500,
    category: 'Sándwiches',
    description: 'Bife de lomo tierno, jamón, queso, huevo frito, lechuga y tomate en pan casero con papas fritas crocantes.',
    baseIngredients: ['Pan de Lomo', 'Bife de Lomo', 'Jamón', 'Queso', 'Lechuga', 'Tomate', 'Huevo Frito'],
    cost: 3000,
    margin: 60
  },
  {
    id: 'food-burguer-doble',
    name: 'Hamburguesa Especial Doble Cheddar',
    price: 6500,
    category: 'Hamburguesas',
    description: 'Doble medallón de carne seleccionada, doble cheddar, panceta crujiente, cebolla caramelizada y salsa especial.',
    baseIngredients: ['Pan Brioche', 'Doble Medallón de Carne', 'Doble Cheddar', 'Panceta', 'Cebolla Caramelizada'],
    cost: 2600,
    margin: 60
  },
  {
    id: 'food-milanesa-completo',
    name: 'Sándwich de Milanesa Completo',
    price: 7000,
    category: 'Sándwiches',
    description: 'Milanesa de ternera XL super crujiente, jamón, queso, lechuga, tomate y huevo frito en pan francés.',
    baseIngredients: ['Pan Francés', 'Milanesa de Ternera', 'Jamón', 'Queso', 'Lechuga', 'Tomate', 'Huevo Frito'],
    cost: 2800,
    margin: 60
  },
  {
    id: 'food-pizza-muzarella',
    name: 'Pizza Muzzarella Individual',
    price: 5500,
    category: 'Pizzas',
    description: 'Masa casera esponjosa a la piedra con abundante muzzarella, aceitunas verdes y orégano seleccionado.',
    baseIngredients: ['Prepizza Casera', 'Salsa de Tomate', 'Muzzarella', 'Aceitunas', 'Orégano'],
    cost: 1650,
    margin: 70
  },
  {
    id: 'food-empanadas-carne',
    name: 'Empanada Criolla Cortada a Cuchillo',
    price: 1200,
    category: 'Entradas',
    description: 'Tradicional empanada frita de carne cortada a cuchillo con cebolla de verdeo y huevo duro.',
    baseIngredients: ['Masa de Empanada', 'Carne Picada', 'Cebolla de Verdeo', 'Huevo Duro'],
    cost: 360,
    margin: 70
  }
];

// Default modifiers
const INITIAL_MODIFIERS: FoodModifier[] = [
  // Dressings
  { id: 'ad-mayo', name: 'Mayonesa Tradicional', category: 'aderezo', inStock: true },
  { id: 'ad-ketchup', name: 'Kétchup', category: 'aderezo', inStock: true },
  { id: 'ad-mostaza', name: 'Mostaza', category: 'aderezo', inStock: true },
  { id: 'ad-golf', name: 'Salsa Golf', category: 'aderezo', inStock: true },
  { id: 'ad-bbq', name: 'Salsa Barbacoa', category: 'aderezo', inStock: true },
  { id: 'ad-chimi', name: 'Chimichurri de la Casa', category: 'aderezo', inStock: true },
  { id: 'ad-apio', name: 'Aderezo de Apio con Mayonesa 🌿', category: 'aderezo', inStock: true },
  
  // Extras
  { id: 'ex-huevo', name: 'Huevo Frito Extra', price: 500, category: 'extra', inStock: true },
  { id: 'ex-panceta', name: 'Panceta Crujiente', price: 700, category: 'extra', inStock: true },
  { id: 'ex-queso', name: 'Doble Queso', price: 800, category: 'extra', inStock: true },
  { id: 'ex-jamon', name: 'Extra Jamón Cocido', price: 600, category: 'extra', inStock: true },
  { id: 'ex-cebolla', name: 'Cebolla Caramelizada', price: 400, category: 'extra', inStock: true },
  { id: 'ex-carne', name: 'Medallón de Carne Extra', price: 1500, category: 'extra', inStock: true },
];

export default function Comidas({ subscription, onUpdateSubscription, currentUser, activeStoreEmail }: ComidasProps) {
  const isEmpresarial = subscription.plan === 'Empresarial' || currentUser?.email === 'pezziniarg@gmail.com';
  
  const [activeTab, setActiveTab] = useState<'pos' | 'kds' | 'admin'>('pos');
  const [products, setProducts] = useState<FoodProduct[]>([]);
  const [modifiers, setModifiers] = useState<FoodModifier[]>([]);
  const [orders, setOrders] = useState<FoodOrder[]>([]);
  const [cart, setCart] = useState<FoodItemInOrder[]>([]);
  
  // Customization Modal states
  const [selectedProduct, setSelectedProduct] = useState<FoodProduct | null>(null);
  const [modalStep, setModalStep] = useState<1 | 2 | 3 | 4>(1);
  const [quitarIngredientes, setQuitarIngredientes] = useState<string[]>([]);
  const [aderezosSeleccionados, setAderezosSeleccionados] = useState<string[]>([]);
  const [aderezosExcluirResto, setAderezosExcluirResto] = useState<boolean>(false);
  const [agregadosExtra, setAgregadosExtra] = useState<{ ingrediente: string; precio: number }[]>([]);
  const [notasEspeciales, setNotasEspeciales] = useState<string>('');
  const [customQty, setCustomQty] = useState<number>(1);

  // New Order Form states
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [orderType, setOrderType] = useState<'delivery' | 'takeaway' | 'local'>('local');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  const [paymentStatus, setPaymentStatus] = useState<'pendiente' | 'pagado'>('pagado');

  // Admin New Modifier Form
  const [newModName, setNewModName] = useState('');
  const [newModCategory, setNewModCategory] = useState<'aderezo' | 'extra'>('aderezo');
  const [newModPrice, setNewModPrice] = useState('');

  // Admin Food Product Form states
  const [editingFoodId, setEditingFoodId] = useState<string | null>(null);
  const [foodName, setFoodName] = useState('');
  const [foodCategory, setFoodCategory] = useState('Sándwiches');
  const [customCategory, setCustomCategory] = useState('');
  const [foodPrice, setFoodPrice] = useState('');
  const [foodCost, setFoodCost] = useState('');
  const [foodMargin, setFoodMargin] = useState('60'); // default 60%
  const [foodIngredients, setFoodIngredients] = useState('');
  const [foodDescription, setFoodDescription] = useState('');

  // Selected order for ticket printing / viewing
  const [activeTicketOrder, setActiveTicketOrder] = useState<FoodOrder | null>(null);

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // Chef WhatsApp phone number
  const [chefPhone, setChefPhone] = useState<string>('');

  // Sound effects
  const playBeep = (freq = 880, duration = 0.15) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Beep blocked or failed:", e);
    }
  };

  // Sync state from Firestore and LocalStorage
  useEffect(() => {
    if (!activeStoreEmail || !isEmpresarial) {
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initial Loading of modifiers and food items
    const localProds = localStorage.getItem(`food_products_${activeStoreEmail}`);
    const localMods = localStorage.getItem(`food_modifiers_${activeStoreEmail}`);
    const localOrders = localStorage.getItem(`food_orders_${activeStoreEmail}`);
    const localChefPhone = localStorage.getItem(`chef_phone_${activeStoreEmail}`);

    if (localProds) setProducts(JSON.parse(localProds));
    else setProducts(INITIAL_FOOD_PRODUCTS);

    if (localMods) setModifiers(JSON.parse(localMods));
    else setModifiers(INITIAL_MODIFIERS);

    if (localOrders) setOrders(JSON.parse(localOrders));
    if (localChefPhone) setChefPhone(localChefPhone);

    // Listen to Firebase Realtime Sync if possible
    const unsubscribeProds = onSnapshot(collection(db, 'storeSettings', activeStoreEmail, 'foodProducts'), (snap) => {
      if (!snap.empty) {
        const list: FoodProduct[] = [];
        snap.forEach(d => list.push(d.data() as FoodProduct));
        setProducts(list);
        localStorage.setItem(`food_products_${activeStoreEmail}`, JSON.stringify(list));
      }
    });

    const unsubscribeMods = onSnapshot(collection(db, 'storeSettings', activeStoreEmail, 'foodModifiers'), (snap) => {
      if (!snap.empty) {
        const list: FoodModifier[] = [];
        snap.forEach(d => list.push(d.data() as FoodModifier));
        setModifiers(list);
        localStorage.setItem(`food_modifiers_${activeStoreEmail}`, JSON.stringify(list));
      }
    });

    const unsubscribeOrders = onSnapshot(collection(db, 'storeSettings', activeStoreEmail, 'foodOrders'), (snap) => {
      const list: FoodOrder[] = [];
      snap.forEach(d => list.push(d.data() as FoodOrder));
      // Sort orders by date descending
      list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setOrders(list);
      localStorage.setItem(`food_orders_${activeStoreEmail}`, JSON.stringify(list));
    });

    const unsubscribeSettings = onSnapshot(doc(db, 'storeSettings', activeStoreEmail, 'foodSettings', 'config'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.chefPhone) {
          setChefPhone(data.chefPhone);
          localStorage.setItem(`chef_phone_${activeStoreEmail}`, data.chefPhone);
        }
      }
    });

    setLoading(false);

    return () => {
      unsubscribeProds();
      unsubscribeMods();
      unsubscribeOrders();
      unsubscribeSettings();
    };
  }, [activeStoreEmail, isEmpresarial]);

  // Load sample data if empty
  const handleLoadSampleMenu = async () => {
    try {
      playBeep(660, 0.25);
      setProducts(INITIAL_FOOD_PRODUCTS);
      setModifiers(INITIAL_MODIFIERS);
      
      // Save to local
      localStorage.setItem(`food_products_${activeStoreEmail}`, JSON.stringify(INITIAL_FOOD_PRODUCTS));
      localStorage.setItem(`food_modifiers_${activeStoreEmail}`, JSON.stringify(INITIAL_MODIFIERS));

      // Push to Firestore
      for (const p of INITIAL_FOOD_PRODUCTS) {
        await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodProducts', p.id), p);
      }
      for (const m of INITIAL_MODIFIERS) {
        await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodModifiers', m.id), m);
      }
      alert("¡Catálogo de Comidas y Modificadores de muestra cargado con éxito!");
    } catch (e) {
      console.error("Error loading sample food data:", e);
    }
  };

  // Cost and Profit Margin Actions for Food Products
  const handleUpdateProductCostMargin = async (productId: string, cost: number, margin: number) => {
    const prod = products.find(p => p.id === productId);
    if (!prod) return;
    
    const sanitizedCost = Math.max(0, Math.min(prod.price, cost));
    const sanitizedMargin = Math.max(0, Math.min(100, margin));

    const updatedProd: FoodProduct = {
      ...prod,
      cost: sanitizedCost,
      margin: sanitizedMargin
    };

    const nextProducts = products.map(p => p.id === productId ? updatedProd : p);
    setProducts(nextProducts);
    localStorage.setItem(`food_products_${activeStoreEmail}`, JSON.stringify(nextProducts));

    try {
      await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodProducts', productId), updatedProd);
    } catch (err) {
      console.error("Error updating food product margins in Firestore:", err);
    }
  };

  // Add or Edit Food Product
  const handleSaveFoodProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    playBeep(523, 0.15);

    if (!foodName.trim() || !foodPrice) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }

    const finalCategory = foodCategory === 'Nueva...' ? (customCategory.trim() || 'General') : foodCategory;
    const priceVal = Number(foodPrice);
    const costVal = foodCost !== '' ? Number(foodCost) : Math.round(priceVal * (1 - Number(foodMargin) / 100));
    const marginVal = foodMargin !== '' ? Number(foodMargin) : Math.round(((priceVal - costVal) / priceVal) * 100);

    const ingredientsArray = foodIngredients
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0);

    const productId = editingFoodId || `food-custom-${Date.now()}`;

    const newFoodProduct: FoodProduct = {
      id: productId,
      name: foodName.trim(),
      category: finalCategory,
      price: priceVal,
      cost: costVal,
      margin: marginVal,
      description: foodDescription.trim(),
      baseIngredients: ingredientsArray,
    };

    let nextProducts: FoodProduct[] = [];
    if (editingFoodId) {
      nextProducts = products.map(p => p.id === editingFoodId ? newFoodProduct : p);
    } else {
      nextProducts = [...products, newFoodProduct];
    }

    setProducts(nextProducts);
    localStorage.setItem(`food_products_${activeStoreEmail}`, JSON.stringify(nextProducts));

    try {
      await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodProducts', productId), newFoodProduct);
      alert(editingFoodId ? "¡Comida modificada con éxito!" : "¡Nueva comida agregada con éxito!");
    } catch (err) {
      console.error("Error saving food product to Firestore:", err);
    }

    // Reset Form
    setEditingFoodId(null);
    setFoodName('');
    setFoodPrice('');
    setFoodCost('');
    setFoodMargin('60');
    setFoodIngredients('');
    setFoodDescription('');
    setCustomCategory('');
  };

  // Preload food data into the editor form
  const handleEditFoodClick = (p: FoodProduct) => {
    playBeep(440, 0.1);
    setEditingFoodId(p.id);
    setFoodName(p.name);
    setFoodCategory(p.category);
    setFoodPrice(p.price.toString());
    setFoodCost((p.cost !== undefined ? p.cost : Math.round(p.price * 0.4)).toString());
    setFoodMargin((p.margin !== undefined ? p.margin : 60).toString());
    setFoodIngredients(p.baseIngredients.join(', '));
    setFoodDescription(p.description || '');
    setCustomCategory('');
  };

  // Delete Food Product
  const handleDeleteFoodClick = async (productId: string) => {
    if (!window.confirm("¿Estás seguro de que deseas eliminar esta comida del catálogo?")) return;
    playBeep(220, 0.2);

    const nextProducts = products.filter(p => p.id !== productId);
    setProducts(nextProducts);
    localStorage.setItem(`food_products_${activeStoreEmail}`, JSON.stringify(nextProducts));

    try {
      await deleteDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodProducts', productId));
    } catch (err) {
      console.error("Error deleting food product from Firestore:", err);
    }
  };

  // Modifier Actions
  const handleToggleModifierStock = async (id: string) => {
    playBeep(523, 0.1);
    const updated = modifiers.map(m => {
      if (m.id === id) {
        const newStock = !m.inStock;
        // Sync single item to firebase
        setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodModifiers', id), { ...m, inStock: newStock });
        return { ...m, inStock: newStock };
      }
      return m;
    });
    setModifiers(updated);
    localStorage.setItem(`food_modifiers_${activeStoreEmail}`, JSON.stringify(updated));
  };

  const handleAddModifier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModName.trim()) return;

    const priceNum = Number(newModPrice);
    const newMod: FoodModifier = {
      id: `mod-${Date.now()}`,
      name: newModName.trim(),
      category: newModCategory,
      price: newModCategory === 'extra' && priceNum ? priceNum : undefined,
      inStock: true
    };

    const updated = [...modifiers, newMod];
    setModifiers(updated);
    localStorage.setItem(`food_modifiers_${activeStoreEmail}`, JSON.stringify(updated));

    // Save to Firestore
    try {
      await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodModifiers', newMod.id), newMod);
      setNewModName('');
      setNewModPrice('');
      playBeep(987, 0.15);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteModifier = async (id: string) => {
    if (!confirm("¿Seguro que deseas eliminar este modificador?")) return;
    playBeep(330, 0.2);
    const updated = modifiers.filter(m => m.id !== id);
    setModifiers(updated);
    localStorage.setItem(`food_modifiers_${activeStoreEmail}`, JSON.stringify(updated));

    try {
      await deleteDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodModifiers', id));
    } catch (err) {
      console.error(err);
    }
  };

  // Launch Item Modifier Customizer
  const handleOpenModifierModal = (prod: FoodProduct) => {
    setSelectedProduct(prod);
    setModalStep(1);
    setQuitarIngredientes([]);
    setAderezosSeleccionados([]);
    setAderezosExcluirResto(false);
    setAgregadosExtra([]);
    setNotasEspeciales('');
    setCustomQty(1);
    playBeep(1100, 0.1);
  };

  // Handle step completion
  const handleNextStep = () => {
    if (modalStep < 4) {
      setModalStep((prev) => (prev + 1) as any);
      playBeep(880, 0.1);
    }
  };

  const handlePrevStep = () => {
    if (modalStep > 1) {
      setModalStep((prev) => (prev - 1) as any);
      playBeep(700, 0.1);
    }
  };

  // Select sauce dressing
  const handleToggleSauce = (sauceName: string) => {
    if (aderezosSeleccionados.includes(sauceName)) {
      setAderezosSeleccionados(aderezosSeleccionados.filter(s => s !== sauceName));
    } else {
      // If "Excluir todos los demás" (Solo este) is checked, we can clear others, or uncheck exclusivity
      if (aderezosExcluirResto) {
        setAderezosSeleccionados([sauceName]);
      } else {
        setAderezosSeleccionados([...aderezosSeleccionados, sauceName]);
      }
    }
    playBeep(880, 0.05);
  };

  // Toggle "Solo este aderezo"
  const handleToggleExclusivity = (sauceName: string) => {
    if (aderezosExcluirResto && aderezosSeleccionados.length === 1 && aderezosSeleccionados[0] === sauceName) {
      setAderezosExcluirResto(false);
    } else {
      setAderezosExcluirResto(true);
      setAderezosSeleccionados([sauceName]);
    }
    playBeep(980, 0.08);
  };

  // Add Extra
  const handleToggleExtra = (extra: { name: string; price: number }) => {
    const exists = agregadosExtra.find(e => e.ingrediente === extra.name);
    if (exists) {
      setAgregadosExtra(agregadosExtra.filter(e => e.ingrediente !== extra.name));
    } else {
      setAgregadosExtra([...agregadosExtra, { ingrediente: extra.name, precio: extra.price }]);
    }
    playBeep(880, 0.05);
  };

  // Calculate customized total item price
  const calculateItemCustomTotal = () => {
    if (!selectedProduct) return 0;
    const basePrice = selectedProduct.price;
    const extrasSum = agregadosExtra.reduce((acc, current) => acc + current.precio, 0);
    return (basePrice + extrasSum) * customQty;
  };

  // Confirm custom item addition to food cart
  const handleConfirmAddFoodItem = () => {
    if (!selectedProduct) return;

    const extrasSum = agregadosExtra.reduce((acc, current) => acc + current.precio, 0);
    const finalItemTotal = selectedProduct.price + extrasSum;

    const newCartItem: FoodItemInOrder = {
      producto_id: selectedProduct.id,
      nombre: selectedProduct.name,
      precio_base: selectedProduct.price,
      quitar_ingredientes: [...quitarIngredientes],
      aderezos_seleccionados: [...aderezosSeleccionados],
      aderezos_excluir_todos_los_demas: aderezosExcluirResto,
      agregados_extra: [...agregadosExtra],
      notas_especiales: notasEspeciales.trim(),
      precio_total: finalItemTotal,
      quantity: customQty
    };

    setCart([...cart, newCartItem]);
    setSelectedProduct(null);
    playBeep(1200, 0.2);
  };

  // Remove food item from order builder
  const handleRemoveFromCart = (index: number) => {
    playBeep(440, 0.15);
    setCart(cart.filter((_, i) => i !== index));
  };

  // Send detailed command to Chef's WhatsApp
  const sendToChefWhatsapp = (order: FoodOrder) => {
    if (!chefPhone) return;

    // Build the items text with clear, high-visibility structure
    const itemsText = order.items.map(food => {
      let text = `• ${food.quantity}x *${food.nombre.toUpperCase()}*\n`;
      if (food.quitar_ingredientes.length > 0) {
        text += `  - ❌ *SIN:* ${food.quitar_ingredientes.join(', ')}\n`;
      }
      if (food.aderezos_seleccionados.length > 0) {
        text += `  - 🟢 *ADEREZOS:* ${food.aderezos_excluir_todos_los_demas ? 'SOLO ' : ''}${food.aderezos_seleccionados.join(', ')}\n`;
      }
      if (food.agregados_extra.length > 0) {
        text += `  - ➕ *EXTRAS:* ${food.agregados_extra.map(ex => ex.ingrediente).join(', ')}\n`;
      }
      if (food.notas_especiales) {
        text += `  - 📝 _Nota:_ "${food.notas_especiales}"\n`;
      }
      return text;
    }).join('\n');

    const orderTypeLabel = order.type === 'local' ? 'Mesa / Local 🍽️' : order.type === 'takeaway' ? 'Retiro (Takeaway) 🛍️' : 'Envío a Domicilio 🚚';
    const readyUrl = `${window.location.origin}/?readyOrderId=${order.id}&storeEmail=${activeStoreEmail}`;

    let message = `*🍔 NUEVO PEDIDO PARA COCINA - MAX24 🍔*\n`;
    message += `----------------------------------------\n`;
    message += `*Pedido ID:* ${order.id}\n`;
    message += `*Tipo:* ${orderTypeLabel}\n`;
    message += `*Cliente:* ${order.customerName}\n`;
    if (order.phone) message += `*Teléfono:* ${order.phone}\n`;
    if (order.address) message += `*Dirección:* ${order.address}\n`;
    message += `*Fecha/Hora:* ${new Date(order.date).toLocaleString('es-AR')}\n\n`;
    message += `*DETALLE DEL PEDIDO:*\n${itemsText}\n`;
    if (order.notes && order.notes !== order.address) message += `*NOTAS GENERALES:* "${order.notes}"\n`;
    message += `----------------------------------------\n`;
    message += `*¿PEDIDO LISTO? HACE CLICK ACÁ:* 👉 ${readyUrl}\n`;
    message += `----------------------------------------\n`;
    message += `_¡A cocinar! 🔥_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${chefPhone.replace(/\D/g, '')}&text=${encodedMessage}`;
    
    // Open WhatsApp in a new tab/window
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  // Place the actual order (KDS dispatch)
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    const subtotal = cart.reduce((acc, item) => acc + (item.precio_total * item.quantity), 0);
    const finalTotal = subtotal + (orderType === 'delivery' ? deliveryFee : 0);

    const newOrder: FoodOrder = {
      id: `CMD-${Math.floor(1000 + Math.random() * 9000)}`,
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Consumidor Final',
      phone: customerPhone.trim(),
      type: orderType,
      address: orderType === 'delivery' ? deliveryAddress.trim() : "",
      items: [...cart],
      notes: orderType === 'delivery' ? deliveryAddress.trim() : "",
      subtotal,
      deliveryFee: orderType === 'delivery' ? deliveryFee : 0,
      total: finalTotal,
      status: 'pendiente',
      paymentMethod,
      paymentStatus
    };

    const updatedOrders = [newOrder, ...orders];
    setOrders(updatedOrders);
    localStorage.setItem(`food_orders_${activeStoreEmail}`, JSON.stringify(updatedOrders));

    try {
      // Save order in Firestore
      await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodOrders', newOrder.id), newOrder);
      
      // Auto register to global transactions/sales so financial reports sum correctly!
      const mainSaleItems = newOrder.items.map(food => {
        let nameWithMods = food.nombre;
        if (food.quitar_ingredientes.length > 0) nameWithMods += ` (SIN: ${food.quitar_ingredientes.join(', ')})`;
        if (food.aderezos_seleccionados.length > 0) nameWithMods += ` (ADEREZO: ${food.aderezos_excluir_todos_los_demas ? 'SOLO ' : ''}${food.aderezos_seleccionados.join(', ')})`;
        if (food.agregados_extra.length > 0) nameWithMods += ` (+EXTRAS: ${food.agregados_extra.map(ex => ex.ingrediente).join(', ')})`;

        return {
          productId: food.producto_id,
          productName: nameWithMods,
          quantity: food.quantity,
          price: food.precio_total
        };
      });

      // Submit a real sale to transaction collection for unified metrics
      const saleId = `V-${Math.floor(10000 + Math.random() * 90000)}`;
      const mainSalePayload = {
        id: saleId,
        date: new Date().toISOString(),
        items: mainSaleItems,
        subtotal: newOrder.subtotal,
        discount: 0,
        tax: Math.round(newOrder.subtotal * 0.21),
        total: newOrder.total,
        paymentMethod: newOrder.paymentMethod as any,
        sellerId: currentUser?.id || 'emp-system',
        sellerName: currentUser?.name || 'Comidas POS',
        storeEmail: activeStoreEmail,
        isOnlineOrder: false,
        status: 'Completado'
      };
      
      await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'sales', saleId), mainSalePayload);

      // Clean order taker cart
      setCart([]);
      setCustomerName('');
      setCustomerPhone('');
      setDeliveryAddress('');
      setDeliveryFee(0);
      playBeep(1500, 0.3);

      // Open WhatsApp for the Chef if phone is configured
      if (chefPhone) {
        sendToChefWhatsapp(newOrder);
      } else {
        alert(`¡Pedido ${newOrder.id} enviado a la Cocina y registrado en el POS con éxito!\n\nNota: Para enviar la comanda por WhatsApp, configura el celular del cocinero en la pestaña "Ingredientes & Stock".`);
      }
    } catch (err) {
      console.error("Error saving food order:", err);
    }
  };

  // Save Chef WhatsApp configuration
  const handleSaveChefConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    playBeep(987, 0.15);
    const cleanedPhone = chefPhone.trim().replace(/\D/g, '');
    setChefPhone(cleanedPhone);
    localStorage.setItem(`chef_phone_${activeStoreEmail}`, cleanedPhone);

    try {
      await setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodSettings', 'config'), {
        chefPhone: cleanedPhone
      }, { merge: true });
      alert("📞 ¡Contacto de WhatsApp del Cocinero guardado con éxito!");
    } catch (err) {
      console.error("Error saving chef phone config:", err);
      alert("Error al guardar el contacto en la nube. Se guardó localmente.");
    }
  };

  // Change active order status in KDS
  const handleChangeOrderStatus = async (orderId: string, nextStatus: FoodOrder['status']) => {
    playBeep(932, 0.15);
    const updated = orders.map(o => {
      if (o.id === orderId) {
        const updatedOrd = { ...o, status: nextStatus };
        // Save to Firebase
        setDoc(doc(db, 'storeSettings', activeStoreEmail, 'foodOrders', orderId), updatedOrd);
        return updatedOrd;
      }
      return o;
    });
    setOrders(updated);
    localStorage.setItem(`food_orders_${activeStoreEmail}`, JSON.stringify(updated));
  };

  // Simulated Free Trial SaaS upgrade to Empresarial
  const handleSimulatedUpgrade = () => {
    playBeep(1200, 0.35);
    onUpdateSubscription('Empresarial', 99.99);
    alert("🎉 ¡Felicidades! Has activado la Prueba Gratuita de la Licencia EMPRESARIAL en tu Sandbox de desarrollo de MAX24. Las funciones de Comidas, Modificadores, KDS y Comandas ya se encuentran habilitadas.");
  };

  // Visual layout if plan is locked
  if (!isEmpresarial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[75vh] p-6 text-center max-w-4xl mx-auto font-sans">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden text-left space-y-8 w-full">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase rounded-full tracking-wider font-mono">
                <ChefHat className="w-3.5 h-3.5" />
                Módulo Empresarial Exclusivo
              </div>
              <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                Módulo de Comidas, Minutas & Cocina (KDS)
              </h2>
              <p className="text-slate-400 text-sm max-w-xl">
                Diseñado exclusivamente para rotiserías, bares y restaurantes en crecimiento. Administra sándwiches, platos complejos con aderezos y comandas en tiempo real.
              </p>
            </div>

            <button 
              type="button"
              onClick={handleSimulatedUpgrade}
              className="py-3 px-6 bg-gradient-to-tr from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white font-black text-xs tracking-wider uppercase rounded-xl shadow-lg hover:shadow-violet-500/10 cursor-pointer active:scale-98 transition-all shrink-0 flex items-center gap-2 border border-violet-400/20"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Activar Plan Empresarial (Demo)</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80">
            <div className="p-5 bg-slate-950 border border-slate-800/60 rounded-2xl space-y-2">
              <div className="p-2 bg-violet-500/5 text-violet-400 w-fit rounded-lg border border-violet-500/10">
                <Sliders className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Personalización de Platos</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Añade ingredientes base extraíbles, aderezos iniciales o de la casa, y extras con costo adicional para cada plato de manera automatizada.
              </p>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800/60 rounded-2xl space-y-2">
              <div className="p-2 bg-purple-500/5 text-purple-400 w-fit rounded-lg border border-purple-500/10">
                <ChefHat className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Monitor de Cocina KDS</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Visualiza las comandas divididas en tiempo real. Resalta en rojo los ingredientes quitados y en verde los aderezos para evitar errores.
              </p>
            </div>

            <div className="p-5 bg-slate-950 border border-slate-800/60 rounded-2xl space-y-2">
              <div className="p-2 bg-pink-500/5 text-pink-400 w-fit rounded-lg border border-pink-500/10">
                <Truck className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-bold text-slate-200">Delivery, Takeaway y Local</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                Controla los despachos a domicilio con recargo de envío, pedidos listos para retirar, o mesas atendidas en el local con tickets optimizados.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6 max-w-7xl mx-auto font-sans text-slate-800">
      
      {/* HEADER SECTION */}
      <div className="bg-white rounded-2xl border border-orange-100 p-4 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-tr from-orange-500 to-amber-500 text-white rounded-2xl shadow-md">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">Comidas, Minutas & Cocina</h1>
              <span className="px-2 py-0.5 bg-violet-100 text-violet-800 text-[9px] font-black tracking-wider uppercase rounded-full border border-violet-200 font-mono">
                Licencia Empresarial
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Gestión de platos personalizables, KDS para cocina, comandas y envíos a domicilio.
            </p>
          </div>
        </div>

        {/* TABS CONTROLLER */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200/60 w-full md:w-auto shrink-0 font-bold text-xs select-none">
          <button
            type="button"
            onClick={() => setActiveTab('pos')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'pos' 
                ? 'bg-white text-orange-600 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Tomar Pedido</span>
          </button>
          
          <button
            type="button"
            onClick={() => setActiveTab('kds')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer relative ${
              activeTab === 'kds' 
                ? 'bg-white text-orange-600 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Utensils className="w-4 h-4" />
            <span>KDS Cocina</span>
            {orders.filter(o => o.status === 'pendiente' || o.status === 'preparando').length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-extrabold rounded-full animate-bounce shrink-0">
                {orders.filter(o => o.status === 'pendiente' || o.status === 'preparando').length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('admin')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'admin' 
                ? 'bg-white text-orange-600 shadow-xs' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Ingredientes & Stock</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. ORDER POS TAB */}
      {activeTab === 'pos' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main Food Catalog Area */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">Catálogo de Comidas Rápidas</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Haz clic en un plato para lanzar el asistente de cocina y aderezos.</p>
                </div>
                {products.length === 0 && (
                  <button
                    type="button"
                    onClick={handleLoadSampleMenu}
                    className="py-1.5 px-3 bg-orange-50 text-orange-700 hover:bg-orange-100 text-xs font-bold rounded-xl border border-orange-200/50 cursor-pointer transition-colors"
                  >
                    Cargar Menú de Muestra
                  </button>
                )}
              </div>

              {products.length === 0 ? (
                <div className="text-center py-12 bg-slate-50 border border-dashed border-slate-200 rounded-xl space-y-3">
                  <Pizza className="w-10 h-10 text-slate-400 mx-auto" />
                  <p className="text-xs text-slate-500 font-bold max-w-xs mx-auto">No hay comidas registradas. ¡Prueba cargando el menú de muestra para comenzar!</p>
                  <button
                    type="button"
                    onClick={handleLoadSampleMenu}
                    className="py-2 px-4 bg-orange-500 text-white hover:bg-orange-600 text-xs font-black rounded-xl cursor-pointer transition-all"
                  >
                    Cargar Menú de Muestra
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {products.map((p) => (
                    <div 
                      key={p.id}
                      onClick={() => handleOpenModifierModal(p)}
                      className="group bg-slate-50/50 hover:bg-white p-4 rounded-xl border border-slate-200/70 hover:border-orange-200 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between gap-3 text-left relative overflow-hidden"
                    >
                      <div className="space-y-1">
                        <span className="px-2 py-0.5 bg-slate-200/80 text-slate-600 text-[9px] font-extrabold rounded-md uppercase font-mono">
                          {p.category}
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 group-hover:text-orange-600 transition-colors mt-1 font-sans">{p.name}</h4>
                        <p className="text-[11px] text-slate-500 leading-normal line-clamp-2 font-sans">{p.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200/50 pt-2 mt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black text-slate-800">
                            ${p.price.toLocaleString('es-AR')}
                          </span>
                          {p.margin !== undefined && (
                            <span className="text-[9px] font-black text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                              {p.margin}% marg.
                            </span>
                          )}
                        </div>
                        <span className="px-2.5 py-1 bg-orange-50 group-hover:bg-orange-500 text-orange-600 group-hover:text-white rounded-lg text-[10px] font-extrabold transition-all">
                          Personalizar +
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Order Builder / Checkout Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-xs flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-3 border-b border-orange-50">
                <div className="p-1.5 bg-orange-50 text-orange-600 rounded-lg">
                  <ShoppingBag className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-sm font-extrabold text-slate-950 tracking-tight">Armando Pedido</h3>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <ChefHat className="w-8 h-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-bold leading-relaxed max-w-[160px] mx-auto">Selecciona platos del catálogo para personalizar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Cart Item Cards list */}
                  <div className="space-y-2 max-h-[30vh] overflow-y-auto pr-1">
                    {cart.map((item, idx) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 relative group text-left">
                        <button
                          type="button"
                          onClick={() => handleRemoveFromCart(idx)}
                          className="absolute right-2 top-2 p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-md transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        
                        <div className="leading-tight pr-6">
                          <span className="text-xs font-black text-slate-900">{item.quantity}x {item.nombre}</span>
                          <p className="text-[11px] font-black text-orange-600 mt-0.5">${(item.precio_total * item.quantity).toLocaleString('es-AR')}</p>
                        </div>

                        {/* Modifiers short summary */}
                        <div className="text-[10px] space-y-0.5 border-t border-slate-200/50 pt-1.5 text-slate-600 font-sans leading-normal">
                          {item.quitar_ingredientes.length > 0 && (
                            <p className="text-red-600 font-extrabold uppercase">❌ SIN: {item.quitar_ingredientes.join(', ')}</p>
                          )}
                          {item.aderezos_seleccionados.length > 0 && (
                            <p className="text-emerald-700 font-extrabold uppercase">🟢 {item.aderezos_excluir_todos_los_demas ? 'SOLO ' : 'ADEREZOS: '}{item.aderezos_seleccionados.join(', ')}</p>
                          )}
                          {item.agregados_extra.length > 0 && (
                            <p className="text-slate-800 font-bold">➕ EXTRAS: {item.agregados_extra.map(ex => ex.ingrediente).join(', ')}</p>
                          )}
                          {item.notas_especiales && (
                            <p className="text-slate-500 italic mt-0.5">Nota: "{item.notas_especiales}"</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Customer & Delivery Form Info */}
                  <div className="border-t border-orange-50 pt-4 space-y-3 font-sans">
                    <h4 className="text-xs font-extrabold text-slate-900">Datos del Pedido</h4>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-center text-xs font-bold cursor-pointer transition-colors relative">
                        <input
                          type="radio"
                          name="orderType"
                          checked={orderType === 'local'}
                          onChange={() => setOrderType('local')}
                          className="sr-only"
                        />
                        <span className={orderType === 'local' ? 'text-orange-600' : 'text-slate-600'}>Mesa / Local</span>
                        {orderType === 'local' && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                      </label>

                      <label className="flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-center text-xs font-bold cursor-pointer transition-colors relative">
                        <input
                          type="radio"
                          name="orderType"
                          checked={orderType === 'takeaway'}
                          onChange={() => setOrderType('takeaway')}
                          className="sr-only"
                        />
                        <span className={orderType === 'takeaway' ? 'text-orange-600' : 'text-slate-600'}>Takeaway</span>
                        {orderType === 'takeaway' && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                      </label>
                    </div>

                    <label className="flex items-center justify-center p-2 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 text-center text-xs font-bold cursor-pointer transition-colors relative">
                      <input
                        type="radio"
                        name="orderType"
                        checked={orderType === 'delivery'}
                        onChange={() => setOrderType('delivery')}
                        className="sr-only"
                      />
                      <span className={orderType === 'delivery' ? 'text-orange-600' : 'text-slate-600'}>🚚 Envío a Domicilio</span>
                      {orderType === 'delivery' && <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full" />}
                    </label>

                    {/* Customer Info Input */}
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Nombre de Cliente"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                      <input
                        type="tel"
                        placeholder="Teléfono (WhatsApp)"
                        value={customerPhone}
                        onChange={(e) => setCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>

                    {/* Delivery specific fields */}
                    {orderType === 'delivery' && (
                      <div className="space-y-2 p-3 bg-orange-50/20 border border-orange-100 rounded-xl">
                        <input
                          type="text"
                          placeholder="Dirección de entrega"
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
                        />
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-bold text-slate-500">Costo de Envío ($):</label>
                          <input
                            type="number"
                            value={deliveryFee || ''}
                            onChange={(e) => setDeliveryFee(Number(e.target.value))}
                            className="w-20 px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-xs text-right"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    )}

                    {/* Payment Settings */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Medio de Pago:</label>
                        <select
                          value={paymentMethod}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        >
                          <option value="Efectivo">Efectivo</option>
                          <option value="MercadoPago">MercadoPago</option>
                          <option value="Transferencia">Transferencia</option>
                          <option value="Cuenta Corriente">Cuenta Corriente</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 block">Estado de Pago:</label>
                        <select
                          value={paymentStatus}
                          onChange={(e) => setPaymentStatus(e.target.value as any)}
                          className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        >
                          <option value="pagado">PAGADO</option>
                          <option value="pendiente">PENDIENTE</option>
                        </select>
                      </div>
                    </div>

                    {/* Balance Sheet totals */}
                    <div className="pt-3 border-t border-slate-200/60 text-xs font-bold space-y-1.5">
                      <div className="flex items-center justify-between text-slate-500">
                        <span>Subtotal:</span>
                        <span>${cart.reduce((acc, item) => acc + (item.precio_total * item.quantity), 0).toLocaleString('es-AR')}</span>
                      </div>
                      {orderType === 'delivery' && (
                        <div className="flex items-center justify-between text-slate-500">
                          <span>Envío:</span>
                          <span>${deliveryFee.toLocaleString('es-AR')}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between text-sm font-black text-slate-900 border-t border-dashed border-slate-200 pt-2">
                        <span>TOTAL PEDIDO:</span>
                        <span className="text-orange-600">
                          ${(cart.reduce((acc, item) => acc + (item.precio_total * item.quantity), 0) + (orderType === 'delivery' ? deliveryFee : 0)).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handlePlaceOrder}
                      className="w-full py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black rounded-xl active:scale-98 transition-all shadow-md shadow-orange-500/10 cursor-pointer flex flex-col items-center justify-center gap-0.5"
                    >
                      <div className="flex items-center gap-2 justify-center">
                        <CheckCircle2 className="w-4.5 h-4.5" />
                        <span>ENVIAR PEDIDO A COCINA</span>
                      </div>
                      {chefPhone ? (
                        <span className="text-[9px] font-bold text-orange-100 uppercase tracking-wider block mt-0.5">
                          (Se enviará al WhatsApp: {chefPhone})
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-orange-200/90 block mt-0.5">
                          (Sin WhatsApp de cocinero asignado en Stock)
                        </span>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. KITCHEN DISPLAY MONITOR TAB (KDS) */}
      {activeTab === 'kds' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-orange-100 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-orange-50 mb-6">
              <div>
                <h3 className="text-sm font-extrabold text-slate-950 tracking-tight">KDS - Monitor de Comandas de Cocina</h3>
                <p className="text-[11px] text-slate-500 font-sans">Visualiza y controla el ciclo de vida de cada preparación gastronómica en tiempo real.</p>
              </div>
              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                <span className="text-red-600 uppercase font-mono">Panel Autorizado</span>
              </div>
            </div>

            {orders.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-3 bg-slate-50 border border-dashed border-slate-200 rounded-2xl max-w-md mx-auto">
                <ChefHat className="w-12 h-12 text-slate-300 mx-auto animate-pulse" />
                <p className="text-xs font-bold leading-relaxed max-w-xs mx-auto">No hay pedidos gastronómicos activos en este momento. ¡Toma un pedido para que aparezca aquí!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start font-sans">
                
                {/* 1. PENDIENTE COLUMN */}
                <div className="space-y-4">
                  <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-black text-red-800 uppercase tracking-wider">Pendientes ({orders.filter(o => o.status === 'pendiente').length})</span>
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
                  </div>
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {orders.filter(o => o.status === 'pendiente').map(order => (
                      <div key={order.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3 hover:shadow-md transition-shadow relative text-left">
                        <div className="flex justify-between items-start leading-tight">
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{order.id}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">
                              {new Date(order.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono border
                            ${order.type === 'delivery' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''}
                            ${order.type === 'takeaway' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
                            ${order.type === 'local' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : ''}
                          `}>
                            {order.type}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="text-[11px] leading-tight space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                          <p className="font-extrabold text-slate-800">C: {order.customerName}</p>
                          {order.phone && <p className="text-slate-500">Tel: {order.phone}</p>}
                        </div>

                        {/* Items customized listing */}
                        <div className="border-t border-dashed border-slate-200 pt-2.5 space-y-2 text-[11px]">
                          {order.items.map((item, i) => (
                            <div key={i} className="leading-normal">
                              <span className="font-extrabold text-slate-900">{item.quantity}x {item.nombre}</span>
                              
                              <div className="text-[10px] space-y-0.5 pl-3 mt-1 leading-relaxed border-l-2 border-slate-200 text-slate-600">
                                {item.quitar_ingredientes.length > 0 && (
                                  <p className="text-red-600 font-extrabold uppercase">❌ SIN: {item.quitar_ingredientes.join(', ')}</p>
                                )}
                                {item.aderezos_seleccionados.length > 0 && (
                                  <p className="text-emerald-700 font-extrabold uppercase">
                                    🟢 {item.aderezos_excluir_todos_los_demas ? 'SOLO ' : 'ADEREZOS: '}{item.aderezos_seleccionados.join(', ')}
                                  </p>
                                )}
                                {item.agregados_extra.length > 0 && (
                                  <p className="text-slate-800 font-black">
                                    ➕ EXTRAS: {item.agregados_extra.map(ex => ex.ingrediente).join(', ')}
                                  </p>
                                )}
                                {item.notas_especiales && (
                                  <p className="text-slate-500 italic">" {item.notas_especiales} "</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Order Notes / Address */}
                        {order.address && (
                          <div className="text-[10px] text-orange-700 bg-orange-50/50 p-2 rounded border border-orange-100 flex items-start gap-1">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="font-medium leading-normal">{order.address}</span>
                          </div>
                        )}

                        <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setActiveTicketOrder(order)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 flex-1 flex items-center justify-center cursor-pointer transition-colors"
                            title="Imprimir Comanda"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleChangeOrderStatus(order.id, 'preparando')}
                            className="py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white font-extrabold text-[10px] rounded-lg tracking-wider flex-1.5 flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <span>PREPARAR</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. PREPARANDO COLUMN */}
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-black text-amber-800 uppercase tracking-wider">Preparando ({orders.filter(o => o.status === 'preparando').length})</span>
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse" />
                  </div>
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {orders.filter(o => o.status === 'preparando').map(order => (
                      <div key={order.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3 hover:shadow-md transition-shadow relative text-left">
                        <div className="flex justify-between items-start leading-tight">
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{order.id}</span>
                            <span className="text-[9px] text-slate-400 mt-0.5 block">
                              {new Date(order.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono border
                            ${order.type === 'delivery' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''}
                            ${order.type === 'takeaway' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
                            ${order.type === 'local' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : ''}
                          `}>
                            {order.type}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="text-[11px] leading-tight space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                          <p className="font-extrabold text-slate-800">C: {order.customerName}</p>
                        </div>

                        {/* Items customized listing */}
                        <div className="border-t border-dashed border-slate-200 pt-2.5 space-y-2 text-[11px]">
                          {order.items.map((item, i) => (
                            <div key={i} className="leading-normal">
                              <span className="font-extrabold text-slate-900">{item.quantity}x {item.nombre}</span>
                              
                              <div className="text-[10px] space-y-0.5 pl-3 mt-1 leading-relaxed border-l-2 border-slate-200 text-slate-600">
                                {item.quitar_ingredientes.length > 0 && (
                                  <p className="text-red-600 font-extrabold uppercase">❌ SIN: {item.quitar_ingredientes.join(', ')}</p>
                                )}
                                {item.aderezos_seleccionados.length > 0 && (
                                  <p className="text-emerald-700 font-extrabold uppercase">
                                    🟢 {item.aderezos_excluir_todos_los_demas ? 'SOLO ' : 'ADEREZOS: '}{item.aderezos_seleccionados.join(', ')}
                                  </p>
                                )}
                                {item.agregados_extra.length > 0 && (
                                  <p className="text-slate-800 font-black">
                                    ➕ EXTRAS: {item.agregados_extra.map(ex => ex.ingrediente).join(', ')}
                                  </p>
                                )}
                                {item.notas_especiales && (
                                  <p className="text-slate-500 italic">" {item.notas_especiales} "</p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setActiveTicketOrder(order)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 flex-1 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleChangeOrderStatus(order.id, 'listo')}
                            className="py-1.5 px-3 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-lg tracking-wider flex-1.5 flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <span>LISTO</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. LISTO PARA ENTREGA COLUMN */}
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-black text-emerald-800 uppercase tracking-wider">Listo ({orders.filter(o => o.status === 'listo').length})</span>
                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                  </div>
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {orders.filter(o => o.status === 'listo').map(order => (
                      <div key={order.id} className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-xs space-y-3 hover:shadow-md transition-shadow relative text-left">
                        <div className="flex justify-between items-start leading-tight">
                          <div>
                            <span className="text-xs font-black text-slate-900 block">{order.id}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase font-mono border
                            ${order.type === 'delivery' ? 'bg-orange-50 border-orange-200 text-orange-600' : ''}
                            ${order.type === 'takeaway' ? 'bg-blue-50 border-blue-200 text-blue-600' : ''}
                            ${order.type === 'local' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : ''}
                          `}>
                            {order.type}
                          </span>
                        </div>

                        {/* Customer Info */}
                        <div className="text-[11px] leading-tight space-y-0.5 bg-slate-50 p-2 rounded-lg border border-slate-200/50">
                          <p className="font-extrabold text-slate-800">C: {order.customerName}</p>
                          <p className="text-[9px] text-slate-500 font-medium">Metodo: {order.paymentMethod} ({order.paymentStatus})</p>
                        </div>

                        {/* Items customized listing */}
                        <div className="border-t border-dashed border-slate-200 pt-2.5 space-y-2 text-[11px]">
                          {order.items.map((item, i) => (
                            <div key={i} className="leading-normal">
                              <span className="font-extrabold text-slate-900">{item.quantity}x {item.nombre}</span>
                            </div>
                          ))}
                        </div>

                        <div className="flex gap-1.5 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setActiveTicketOrder(order)}
                            className="p-1.5 hover:bg-slate-100 text-slate-500 rounded-lg border border-slate-200 flex-1 flex items-center justify-center cursor-pointer transition-colors"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleChangeOrderStatus(order.id, 'entregado')}
                            className="py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg tracking-wider flex-1.5 flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-xs"
                          >
                            <span>ENTREGADO</span>
                            <Check className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 4. ENTREGADO / HISTORIAL COLUMN */}
                <div className="space-y-4">
                  <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 uppercase tracking-wider">Completados ({orders.filter(o => o.status === 'entregado').length})</span>
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-1">
                    {orders.filter(o => o.status === 'entregado').slice(0, 10).map(order => (
                      <div key={order.id} className="bg-slate-50/70 border border-slate-200/50 rounded-xl p-4 shadow-xs space-y-2 relative opacity-70 text-left">
                        <div className="flex justify-between items-start leading-tight">
                          <span className="text-xs font-black text-slate-700">{order.id}</span>
                          <span className="text-[8px] font-black uppercase text-slate-500">
                            Entregado
                          </span>
                        </div>

                        <div className="text-[10px] leading-tight space-y-0.5">
                          <p className="font-extrabold text-slate-700">C: {order.customerName}</p>
                          <p className="font-black text-slate-800 mt-1">Total: ${order.total.toLocaleString('es-AR')}</p>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveTicketOrder(order)}
                          className="w-full py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-[9px] font-bold text-slate-600 cursor-pointer flex items-center justify-center gap-1 mt-1.5"
                        >
                          <Printer className="w-3 h-3" />
                          <span>Ver Comanda</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. INGREDIENTS & STOCK CONFIG TAB */}
      {activeTab === 'admin' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start font-sans">
          
          {/* Side Forms - Config, Foods & Modifiers Creator */}
          <div className="lg:col-span-4 space-y-6">

            {/* Create/Edit Food Product Form */}
            <div className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 shadow-xs text-left">
              <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                {editingFoodId ? <Pencil className="w-4.5 h-4.5 text-orange-500" /> : <Plus className="w-4.5 h-4.5 text-orange-500" />}
                <span>{editingFoodId ? 'Modificar Comida / Plato' : 'Nueva Comida / Menú'}</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans leading-normal">
                {editingFoodId 
                  ? 'Modifica los valores del plato gastronómico seleccionado. Se actualizará en el menú de inmediato.' 
                  : 'Registra un nuevo plato en tu menú de comidas (por ejemplo: empanadas, hamburguesas, pizzas, minutas).'}
              </p>

              <form onSubmit={handleSaveFoodProduct} className="space-y-4 pt-1">
                {/* Nombre de la comida */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Nombre del Plato <span className="text-orange-500">*</span></label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Empanada de Carne Cortada a Cuchillo"
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-orange-500 focus:outline-hidden font-medium"
                  />
                </div>

                {/* Categoría */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Categoría</label>
                    <select
                      value={foodCategory}
                      onChange={(e) => setFoodCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-orange-500 focus:outline-hidden font-medium bg-white"
                    >
                      <option value="Sándwiches">Sándwiches</option>
                      <option value="Hamburguesas">Hamburguesas</option>
                      <option value="Empanadas">Empanadas</option>
                      <option value="Pizzas">Pizzas</option>
                      <option value="Minutas">Minutas</option>
                      <option value="Entradas">Entradas</option>
                      <option value="Bebidas">Bebidas</option>
                      <option value="Postres">Postres</option>
                      <option value="Nueva...">Nueva categoría...</option>
                    </select>
                  </div>

                  {foodCategory === 'Nueva...' && (
                    <div className="space-y-1.5 animate-fadeIn">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Nueva Categoría <span className="text-orange-500">*</span></label>
                      <input
                        type="text"
                        required
                        placeholder="ej. Empanadas"
                        value={customCategory}
                        onChange={(e) => setCustomCategory(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-orange-500 focus:outline-hidden font-medium"
                      />
                    </div>
                  )}
                </div>

                {/* Precios, costos y margen */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">P. Venta ($) <span className="text-orange-500">*</span></label>
                    <input
                      type="number"
                      required
                      min="1"
                      placeholder="ej. 1500"
                      value={foodPrice}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFoodPrice(val);
                        // Recalculate cost based on margin if margin exists
                        if (val && foodMargin) {
                          setFoodCost(Math.round(Number(val) * (1 - Number(foodMargin) / 100)).toString());
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Costo Prep ($)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="ej. 600"
                      value={foodCost}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFoodCost(val);
                        // Recalculate margin based on cost
                        if (val && foodPrice) {
                          const computedMargin = Math.round(((Number(foodPrice) - Number(val)) / Number(foodPrice)) * 100);
                          setFoodMargin(Math.max(0, Math.min(100, computedMargin)).toString());
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Margen (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="ej. 60"
                      value={foodMargin}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFoodMargin(val);
                        // Recalculate cost based on margin
                        if (val && foodPrice) {
                          setFoodCost(Math.round(Number(foodPrice) * (1 - Number(val) / 100)).toString());
                        }
                      }}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:border-orange-500 focus:outline-hidden"
                    />
                  </div>
                </div>

                {/* Detalle visual en tiempo real de rentabilidad */}
                {foodPrice && (
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 flex justify-between items-center text-xs animate-fadeIn">
                    <span className="font-bold text-emerald-800">Rentabilidad estimada:</span>
                    <span className="font-black text-emerald-600 font-mono text-sm">
                      +${(Number(foodPrice) - (foodCost ? Number(foodCost) : Math.round(Number(foodPrice) * (1 - Number(foodMargin) / 100)))).toLocaleString('es-AR')}
                      <span className="text-[10px] font-bold text-emerald-500 ml-1">({foodMargin}%)</span>
                    </span>
                  </div>
                )}

                {/* Ingredientes base */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Ingredientes Base (separados por comas)</label>
                  <input
                    type="text"
                    placeholder="ej. Carne picada, Huevo, Cebolla, Masa de empanada"
                    value={foodIngredients}
                    onChange={(e) => setFoodIngredients(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-orange-500 focus:outline-hidden font-medium"
                  />
                  <p className="text-[9px] text-slate-400 font-medium">Estos ingredientes se podrán quitar opcionalmente al vender el plato en el POS.</p>
                </div>

                {/* Descripción */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Descripción Breve</label>
                  <textarea
                    rows={2}
                    placeholder="ej. Tradicional empanada criolla jugosa cocinada al horno..."
                    value={foodDescription}
                    onChange={(e) => setFoodDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-orange-500 focus:outline-hidden font-medium resize-none"
                  />
                </div>

                {/* Acciones */}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingFoodId ? 'MODIFICAR COMIDA' : 'CREAR COMIDA'}</span>
                  </button>

                  {editingFoodId && (
                    <button
                      type="button"
                      onClick={() => {
                        playBeep(220, 0.1);
                        setEditingFoodId(null);
                        setFoodName('');
                        setFoodPrice('');
                        setFoodCost('');
                        setFoodMargin('60');
                        setFoodIngredients('');
                        setFoodDescription('');
                        setCustomCategory('');
                      }}
                      className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancelar</span>
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            {/* Chef Configuration Card */}
            <div className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 shadow-xs text-left">
              <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                <ChefHat className="w-4.5 h-4.5 text-orange-500" />
                <span>Configuración de Cocina</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans leading-normal">
                Establece el celular del cocinero de turno para enviar las comandas detalladas automáticamente por WhatsApp. ¡Se puede modificar cuando quieras!
              </p>

              <form onSubmit={handleSaveChefConfig} className="space-y-4 pt-1">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">WhatsApp del Cocinero</label>
                  <input
                    type="tel"
                    required
                    placeholder="ej. 5493512345678"
                    value={chefPhone}
                    onChange={(e) => setChefPhone(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                  <span className="text-[10px] text-slate-400 font-medium leading-normal block">
                    Usa formato internacional sin símbolos (ej. 549 + característica + celular sin el 15).
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-xs font-black rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>GUARDAR CELULAR COCINA</span>
                </button>
              </form>
            </div>

            {/* Create custom modifier form */}
            <div className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 shadow-xs text-left">
              <h3 className="text-sm font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
                <Plus className="w-4.5 h-4.5 text-orange-500" />
                <span>Nuevo Modificador</span>
              </h3>
              <p className="text-[11px] text-slate-500 font-sans leading-normal">Registra aderezos especiales o agregados con costo extra para tus hamburguesas y minutas.</p>

              <form onSubmit={handleAddModifier} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Nombre del Modificador</label>
                  <input
                    type="text"
                    required
                    placeholder="ej. Salsa Barbacoa Especial, Huevo Frito"
                    value={newModName}
                    onChange={(e) => setNewModName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Categoría</label>
                    <select
                      value={newModCategory}
                      onChange={(e) => setNewModCategory(e.target.value as any)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                    >
                      <option value="aderezo">Aderezo</option>
                      <option value="extra">Extra / Agregado</option>
                    </select>
                  </div>

                  {newModCategory === 'extra' && (
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Precio Extra ($)</label>
                      <input
                        type="number"
                        required
                        placeholder="500"
                        value={newModPrice}
                        onChange={(e) => setNewModPrice(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-black rounded-xl cursor-pointer transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>GUARDAR MODIFICADOR</span>
                </button>
              </form>
            </div>

          </div>

          {/* List of active modifiers with stock status clickers */}
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 shadow-xs text-left">
              <div className="flex justify-between items-center pb-2 border-b border-orange-50">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-950 tracking-tight">Control de Stock de Ingredientes</h3>
                  <p className="text-[11px] text-slate-500">Pausa cualquier aderezo o extra sin stock con un solo clic para impedir que sea ordenado.</p>
                </div>
                <button
                  type="button"
                  onClick={handleLoadSampleMenu}
                  className="py-1 px-2.5 bg-slate-50 hover:bg-slate-100 text-[10px] font-extrabold text-slate-600 rounded-lg border border-slate-200/60 cursor-pointer"
                >
                  Re-cargar por Defecto
                </button>
              </div>

              {/* Grid display of modifiers */}
              <div className="space-y-4 pt-2">
                
                {/* Dressing section */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Aderezos / Salsas</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modifiers.filter(m => m.category === 'aderezo').map(mod => (
                      <div 
                        key={mod.id} 
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 font-sans transition-all
                          ${mod.inStock 
                            ? 'bg-emerald-50/10 border-slate-200 hover:bg-emerald-50/5' 
                            : 'bg-red-50/20 border-red-200/50 opacity-80'
                          }
                        `}
                      >
                        <div className="space-y-0.5 leading-tight">
                          <span className="text-xs font-bold text-slate-800">{mod.name}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Ingrediente Común</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleModifierStock(mod.id)}
                            className={`px-2.5 py-1 text-[9px] font-black tracking-wider uppercase rounded-lg border cursor-pointer transition-all
                              ${mod.inStock 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'bg-red-100 border-red-200 text-red-700'
                              }
                            `}
                          >
                            {mod.inStock ? 'ACTIVO' : 'PAUSADO'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteModifier(mod.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Extras section */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Extras / Agregados (Suman Costo)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {modifiers.filter(m => m.category === 'extra').map(mod => (
                      <div 
                        key={mod.id} 
                        className={`p-3 rounded-xl border flex items-center justify-between gap-3 font-sans transition-all
                          ${mod.inStock 
                            ? 'bg-emerald-50/10 border-slate-200 hover:bg-emerald-50/5' 
                            : 'bg-red-50/20 border-red-200/50 opacity-80'
                          }
                        `}
                      >
                        <div className="space-y-0.5 leading-tight">
                          <span className="text-xs font-bold text-slate-800">{mod.name}</span>
                          <span className="text-[9px] font-black text-orange-600 block">+${mod.price?.toLocaleString('es-AR')}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleModifierStock(mod.id)}
                            className={`px-2.5 py-1 text-[9px] font-black tracking-wider uppercase rounded-lg border cursor-pointer transition-all
                              ${mod.inStock 
                                ? 'bg-emerald-500 border-emerald-500 text-white' 
                                : 'bg-red-100 border-red-200 text-red-700'
                              }
                            `}
                          >
                            {mod.inStock ? 'ACTIVO' : 'PAUSADO'}
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteModifier(mod.id)}
                            className="p-1 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Márgenes y Costos de Comidas Card */}
            <div id="margenes-costos-comidas" className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 shadow-xs text-left">
              <div className="flex justify-between items-center pb-2 border-b border-orange-50">
                <div className="space-y-0.5">
                  <h3 className="text-sm font-extrabold text-slate-950 tracking-tight">Márgenes y Costos de Comidas</h3>
                  <p className="text-[11px] text-slate-500">Configura el costo de preparación de cada comida o define el porcentaje de margen de ganancia. Estos valores impactarán automáticamente en los reportes mensuales de ganancias.</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100 max-h-[450px] overflow-y-auto pr-1 space-y-3">
                {products.length === 0 ? (
                  <p className="text-xs text-slate-400 py-4 text-center font-medium">No hay comidas registradas en el catálogo actual.</p>
                ) : (
                  products.map(p => {
                    const costVal = p.cost !== undefined ? p.cost : Math.round(p.price * 0.4);
                    const marginVal = p.margin !== undefined ? p.margin : 60;
                    return (
                      <div key={p.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                        <div className="space-y-0.5 min-w-[150px] flex-1">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded">
                              {p.category}
                            </span>
                            <span className="font-extrabold text-slate-800 leading-none">{p.name}</span>
                          </div>
                          {p.description && (
                            <p className="text-[10px] text-slate-400 line-clamp-1">{p.description}</p>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                          {/* Precio Venta */}
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Venta</span>
                            <span className="font-black text-slate-800 font-mono">${p.price.toLocaleString('es-AR')}</span>
                          </div>

                          {/* Input Costo */}
                          <div className="flex flex-col gap-0.5 w-24">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Costo Prep ($)</span>
                            <input
                              type="number"
                              min="0"
                              max={p.price}
                              value={costVal}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newMargin = Math.round(((p.price - val) / p.price) * 100);
                                handleUpdateProductCostMargin(p.id, val, newMargin);
                              }}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono focus:border-orange-500 focus:outline-hidden"
                            />
                          </div>

                          {/* Input Margen */}
                          <div className="flex flex-col gap-0.5 w-16">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Margen (%)</span>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={marginVal}
                              onChange={(e) => {
                                const val = Number(e.target.value);
                                const newCost = Math.round(p.price * (1 - val / 100));
                                handleUpdateProductCostMargin(p.id, newCost, val);
                              }}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold font-mono text-center focus:border-orange-500 focus:outline-hidden"
                            />
                          </div>

                          {/* Ganancia Estimada */}
                          <div className="flex flex-col gap-0.5 text-right w-16">
                            <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-wider">U. Neta</span>
                            <span className="font-black text-emerald-600 font-mono">
                              +${(p.price - costVal).toLocaleString('es-AR')}
                            </span>
                          </div>

                          {/* Acciones Rápidas */}
                          <div className="flex items-center gap-1 pl-2 border-l border-slate-100">
                            <button
                              type="button"
                              onClick={() => handleEditFoodClick(p)}
                              title="Editar plato de comida"
                              className="p-1.5 text-slate-400 hover:text-orange-500 rounded-lg hover:bg-orange-50 transition-colors cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteFoodClick(p.id)}
                              title="Eliminar plato de comida"
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* --- FLOATING MODALS OVERLAYS --- */}

      {/* 1. STEP-BY-STEP PLATE CUSTOMIZER MODAL */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col font-sans">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 text-orange-800 rounded-xl">
                  <ChefHat className="w-5.5 h-5.5" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 leading-tight">Configurar Plato</h3>
                  <p className="text-[11px] text-slate-500 font-bold tracking-tight">Paso {modalStep} de 4: {
                    modalStep === 1 ? 'Ingredientes Base' : 
                    modalStep === 2 ? 'Elegir Aderezos' : 
                    modalStep === 3 ? 'Extras Opcionales' : 
                    'Detalles & Notas'
                  }</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal body based on steps */}
            <div className="p-6 overflow-y-auto max-h-[50vh] text-left space-y-4">
              
              {/* STEP 1: BASE INGREDIENTS REMOVAL */}
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="space-y-1 bg-slate-50 border border-slate-200 p-3 rounded-xl leading-normal">
                    <h4 className="text-xs font-black text-slate-900">¿Cómo querés tu {selectedProduct.name}?</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">Desmarca cualquier ingrediente base que quieras retirar del plato de forma estándar.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {selectedProduct.baseIngredients.map((ing) => {
                      const isRemoved = quitarIngredientes.includes(ing);
                      return (
                        <button
                          type="button"
                          key={ing}
                          onClick={() => {
                            playBeep(880, 0.05);
                            if (isRemoved) {
                              setQuitarIngredientes(quitarIngredientes.filter(i => i !== ing));
                            } else {
                              setQuitarIngredientes([...quitarIngredientes, ing]);
                            }
                          }}
                          className={`p-3 rounded-xl border text-left font-sans text-xs font-bold transition-all flex items-center justify-between cursor-pointer select-none
                            ${isRemoved 
                              ? 'bg-red-50 border-red-300 text-red-700 font-extrabold' 
                              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-800'
                            }
                          `}
                        >
                          <span>{ing}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded uppercase font-black font-mono border
                            ${isRemoved 
                              ? 'bg-red-100 border-red-300 text-red-700' 
                              : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            }
                          `}>
                            {isRemoved ? 'SIN' : 'INCLUIDO'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 2: SAUCES / DRESSINGS */}
              {modalStep === 2 && (
                <div className="space-y-4">
                  <div className="space-y-1 bg-slate-50 border border-slate-200 p-3 rounded-xl leading-normal">
                    <h4 className="text-xs font-black text-slate-900">Seleccioná tus Aderezos</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">Elige múltiples aderezos o selecciona exclusividad ("Solo este") para limpiar los otros por defecto.</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {modifiers.filter(m => m.category === 'aderezo').map((mod) => {
                      const isSelected = aderezosSeleccionados.includes(mod.name);
                      const isExcluding = aderezosExcluirResto && isSelected;
                      
                      return (
                        <div 
                          key={mod.id}
                          className={`p-3 rounded-xl border flex items-center justify-between gap-3 font-sans transition-all
                            ${!mod.inStock ? 'opacity-50 pointer-events-none bg-slate-100 border-slate-200' : ''}
                            ${isSelected 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100'
                            }
                          `}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleSauce(mod.name)}
                            disabled={!mod.inStock}
                            className="flex items-center gap-2.5 text-xs font-bold text-slate-800 text-left flex-1 cursor-pointer select-none"
                          >
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0
                              ${isSelected ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300 bg-white'}
                            `}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className={!mod.inStock ? 'line-through text-slate-400' : ''}>{mod.name}</span>
                            {!mod.inStock && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[8px] font-black rounded uppercase font-mono">SIN STOCK</span>
                            )}
                          </button>

                          {mod.inStock && isSelected && (
                            <button
                              type="button"
                              onClick={() => handleToggleExclusivity(mod.name)}
                              className={`px-2 py-1 rounded text-[9px] font-black tracking-wider uppercase border cursor-pointer transition-all shrink-0
                                ${isExcluding 
                                  ? 'bg-violet-600 border-violet-600 text-white' 
                                  : 'bg-white border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                                }
                              `}
                            >
                              {isExcluding ? '★ SOLO ESTE' : 'HACER EXCLUSIVO'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 3: EXTRAS / AGREGADOS */}
              {modalStep === 3 && (
                <div className="space-y-4">
                  <div className="space-y-1 bg-slate-50 border border-slate-200 p-3 rounded-xl leading-normal">
                    <h4 className="text-xs font-black text-slate-900">¿Le sumamos algo más?</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">Añade ingredientes extras con costo adicional. Suman directo al valor de este plato.</p>
                  </div>

                  <div className="space-y-2 pt-2">
                    {modifiers.filter(m => m.category === 'extra').map((mod) => {
                      const isSelected = !!agregadosExtra.find(e => e.ingrediente === mod.name);
                      
                      return (
                        <button
                          type="button"
                          key={mod.id}
                          disabled={!mod.inStock}
                          onClick={() => handleToggleExtra({ name: mod.name, price: mod.price || 0 })}
                          className={`w-full p-3 rounded-xl border flex items-center justify-between gap-3 font-sans transition-all cursor-pointer select-none text-left
                            ${!mod.inStock ? 'opacity-50 pointer-events-none bg-slate-100 border-slate-200' : ''}
                            ${isSelected 
                              ? 'bg-orange-50 border-orange-200 text-orange-950 font-extrabold' 
                              : 'bg-slate-50/50 border-slate-200 hover:bg-slate-100 text-slate-800'
                            }
                          `}
                        >
                          <div className="flex items-center gap-2.5 text-xs font-bold">
                            <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all shrink-0
                              ${isSelected ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-300 bg-white'}
                            `}>
                              {isSelected && <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span className={!mod.inStock ? 'line-through text-slate-400' : ''}>{mod.name}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-black text-orange-600 shrink-0">+${mod.price?.toLocaleString('es-AR')}</span>
                            {!mod.inStock && (
                              <span className="px-1.5 py-0.5 bg-red-100 text-red-800 text-[8px] font-black rounded uppercase font-mono shrink-0">SIN STOCK</span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4: NOTES & SUMMARY */}
              {modalStep === 4 && (
                <div className="space-y-4">
                  <div className="space-y-1 bg-slate-50 border border-slate-200 p-3 rounded-xl leading-normal">
                    <h4 className="text-xs font-black text-slate-900">Resumen & Notas del Plato</h4>
                    <p className="text-[10px] text-slate-500 leading-normal">Indica cualquier preferencia especial para cocina (ej. "La milanesa bien cocida") y define la cantidad.</p>
                  </div>

                  {/* Summary Card representation of JSON structure requested */}
                  <div className="p-3.5 bg-slate-950 text-white rounded-2xl border border-slate-800 space-y-2.5 font-sans leading-normal">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
                      <span className="text-[10px] font-mono text-emerald-400 font-extrabold tracking-wider uppercase">Ficha Técnica Comanda Gastronómica</span>
                    </div>

                    <div className="text-[11px] space-y-1 leading-relaxed">
                      <div className="flex justify-between border-b border-slate-800 pb-1.5">
                        <span className="text-slate-400">Plato:</span>
                        <span className="font-bold text-white">{selectedProduct.name}</span>
                      </div>

                      {quitarIngredientes.length > 0 && (
                        <div className="flex justify-between border-b border-slate-800 pb-1.5 text-red-400">
                          <span>❌ QUITAR INGREDIENTE:</span>
                          <span className="font-extrabold uppercase">{quitarIngredientes.join(', ')}</span>
                        </div>
                      )}

                      {aderezosSeleccionados.length > 0 && (
                        <div className="flex justify-between border-b border-slate-800 pb-1.5 text-emerald-400">
                          <span>🟢 ADEREZOS:</span>
                          <span className="font-extrabold uppercase">{aderezosExcluirResto ? 'SOLO ' : ''}{aderezosSeleccionados.join(', ')}</span>
                        </div>
                      )}

                      {agregadosExtra.length > 0 && (
                        <div className="flex justify-between border-b border-slate-800 pb-1.5 text-orange-400">
                          <span>➕ EXTRAS / AGREGADOS:</span>
                          <span className="font-bold">{agregadosExtra.map(ex => ex.ingrediente).join(', ')}</span>
                        </div>
                      )}

                      <div className="flex justify-between text-xs font-black text-white pt-1">
                        <span>PRECIO TOTAL UNITARIO:</span>
                        <span className="text-orange-500">${(calculateItemCustomTotal() / customQty).toLocaleString('es-AR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Special notes textarea */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 block uppercase tracking-wider">Notas especiales para Cocina</label>
                    <textarea
                      placeholder="ej. Papas bien crocantes, por favor."
                      value={notasEspeciales}
                      onChange={(e) => setNotasEspeciales(e.target.value)}
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-medium resize-none"
                    />
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-150">
                    <span className="text-xs font-black text-slate-800">Cantidad:</span>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          playBeep(700, 0.08);
                          if (customQty > 1) setCustomQty(customQty - 1);
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center cursor-pointer select-none"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="text-sm font-black font-mono w-6 text-center">{customQty}</span>
                      <button
                        type="button"
                        onClick={() => {
                          playBeep(900, 0.08);
                          setCustomQty(customQty + 1);
                        }}
                        className="w-8 h-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold flex items-center justify-center cursor-pointer select-none"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Controls Footer */}
            <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={handlePrevStep}
                disabled={modalStep === 1}
                className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-xl cursor-pointer select-none disabled:opacity-40 disabled:pointer-events-none"
              >
                Anterior
              </button>

              <div className="text-right leading-tight">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider font-mono">TOTAL ITEM</span>
                <span className="text-sm font-black text-slate-900">${calculateItemCustomTotal().toLocaleString('es-AR')}</span>
              </div>

              {modalStep === 4 ? (
                <button
                  type="button"
                  onClick={handleConfirmAddFoodItem}
                  className="py-2.5 px-6 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white text-xs font-black rounded-xl cursor-pointer select-none shadow-md shadow-orange-500/10 active:scale-98 transition-all"
                >
                  Agregar a Pedido
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className="py-2.5 px-6 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl cursor-pointer select-none"
                >
                  Siguiente
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* 2. PRINTABLE TICKET / COMANDA VIEW DIALOG */}
      {activeTicketOrder && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200 flex flex-col font-mono text-xs text-slate-900 leading-normal">
            
            {/* Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-150 flex justify-between items-center font-sans shrink-0">
              <span className="text-xs font-bold text-slate-800">Vista de Impresión de Comanda</span>
              <button
                type="button"
                onClick={() => setActiveTicketOrder(null)}
                className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket body mockup */}
            <div className="p-6 overflow-y-auto max-h-[60vh] bg-amber-50/15 border-b border-slate-100 flex flex-col items-center">
              <div className="w-full max-w-xs bg-white border border-slate-200 p-5 rounded-md shadow-sm space-y-4 font-mono text-[11px] text-slate-950 text-left relative">
                
                {/* Visual shear mock lines */}
                <div className="absolute -top-1.5 left-0 right-0 h-1 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-200 via-transparent to-transparent bg-[length:8px_4px] bg-repeat-x pointer-events-none" />

                {/* Ticket header */}
                <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
                  <h2 className="text-sm font-black uppercase tracking-wider">MAX24 RESTO</h2>
                  <p className="text-[9px] text-slate-500 font-sans">** COMANDA DE COCINA **</p>
                  <p className="text-[9px] text-slate-500">{new Date(activeTicketOrder.date).toLocaleDateString('es-AR')} - {new Date(activeTicketOrder.date).toLocaleTimeString('es-AR')}</p>
                </div>

                {/* Main Order ID block */}
                <div className="text-center space-y-0.5 py-1">
                  <h1 className="text-lg font-extrabold uppercase">PEDIDO {activeTicketOrder.id}</h1>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-800 text-[8px] font-black uppercase rounded border border-slate-200">
                    {activeTicketOrder.type}
                  </span>
                </div>

                {/* Customer / Service details */}
                <div className="space-y-0.5 pb-2.5 border-b border-dashed border-slate-300">
                  <p><strong>CLIENTE:</strong> {activeTicketOrder.customerName}</p>
                  {activeTicketOrder.phone && <p><strong>TEL:</strong> {activeTicketOrder.phone}</p>}
                  {activeTicketOrder.address && <p><strong>DIR:</strong> {activeTicketOrder.address}</p>}
                </div>

                {/* RED ALERT FOR REMOVALS & GREEN FOR SAUCES GUIDELINES REQUESTED */}
                <div className="py-2 space-y-3">
                  <div className="text-center bg-slate-900 text-white py-1 text-[9px] font-extrabold tracking-widest uppercase">
                    ***** ¡ATENCIÓN COCINA! *****
                  </div>

                  {activeTicketOrder.items.map((food, index) => (
                    <div key={index} className="space-y-1 pt-1">
                      <div className="flex justify-between items-start font-black text-slate-950">
                        <span>{food.quantity}x {food.nombre.toUpperCase()}</span>
                      </div>

                      {/* Removals layer */}
                      {food.quitar_ingredientes.length > 0 && (
                        <div className="pl-3 border-l-2 border-red-500 text-red-600 font-extrabold uppercase text-[10px]">
                          ❌ SIN: {food.quitar_ingredientes.map(i => i.toUpperCase()).join(', ')}
                        </div>
                      )}

                      {/* Sauces layer */}
                      {food.aderezos_seleccionados.length > 0 && (
                        <div className="pl-3 border-l-2 border-emerald-500 text-emerald-700 font-extrabold uppercase text-[10px]">
                          🟢 ADEREZOS: {food.aderezos_excluir_todos_los_demas ? 'SOLO ' : ''}{food.aderezos_seleccionados.map(s => s.toUpperCase()).join(', ')}
                        </div>
                      )}

                      {/* Extras layer */}
                      {food.agregados_extra.length > 0 && (
                        <div className="pl-3 border-l-2 border-orange-500 text-slate-800 font-bold uppercase text-[10px]">
                          ➕ EXTRAS: {food.agregados_extra.map(ex => ex.ingrediente.toUpperCase()).join(', ')}
                        </div>
                      )}

                      {/* Special notes */}
                      {food.notas_especiales && (
                        <p className="pl-3 text-slate-500 italic text-[10px]">
                          Nota: "{food.notas_especiales}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {/* Ticket footer banner */}
                <div className="border-t border-dashed border-slate-300 pt-3 text-center space-y-1">
                  <p className="text-[10px] font-black">--- GRACIAS POR TU TRABAJO ---</p>
                  <p className="text-[8px] text-slate-400 font-sans">MAX24 POS System - Comanda de despacho</p>
                </div>

              </div>
            </div>

            {/* Print trigger button */}
            <div className="p-4 bg-slate-50 flex gap-2 font-sans shrink-0">
              <button
                type="button"
                onClick={() => {
                  playBeep(1200, 0.4);
                  window.print();
                }}
                className="flex-1 py-2.5 bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold rounded-xl active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
              
              <button
                type="button"
                onClick={() => setActiveTicketOrder(null)}
                className="py-2.5 px-4 bg-white border border-slate-200 hover:bg-slate-100 text-xs font-bold text-slate-700 rounded-xl cursor-pointer"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
