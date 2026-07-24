export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  unit: string; // e.g. "Unidades", "Kg", "Litros"
  imageUrl?: string;
  supplierId?: string;
  storeEmail?: string; // Multi-tenant store selector
  isPracticeMode?: boolean;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  role: 'Administrador' | 'Cajero' | 'Supervisor' | 'Gerente' | 'Comprador' | 'Proveedor' | 'Soporte' | 'SupportCollaborator';
  status: 'Activo' | 'Inactivo';
  shift: string; // e.g. "Mañana", "Tarde", "Noche"
  joinedDate: string;
  username?: string;
  password?: string;
  phone?: string;
  salary?: number;
  emergencyContact?: string;
  storeEmail?: string; // Multi-tenant store selector
  hourlyRate?: number; // Pay rate per hour worked
  paymentCycle?: 'Diario' | 'Semanal' | 'Mensual'; // Payment cycle: Daily, Weekly, Monthly
  accruedWages?: number; // Total unpaid earned earnings
  paidWages?: number; // Total wages already paid out
  paymentsHistory?: {
    id: string;
    date: string;
    amount: number;
    notes?: string;
    method: string;
  }[];
  country?: string;   // Added for Supplier/Store Location Filter
  province?: string;  // Added for Supplier/Store Location Filter
  city?: string;      // Added for Supplier/Store Location Filter
  isSupplierPremium?: boolean;
  supplierPremiumTier?: 'monthly' | 'annually';
  supplierPremiumExpiry?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Sale {
  id: string;
  date: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: 'Efectivo' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Transferencia' | 'Pago Móvil' | 'Cuenta Corriente' | 'MercadoPago';
  cashReceived?: number;
  change?: number;
  sellerId: string;
  sellerName: string;
  customer?: Customer;
  storeEmail?: string; // Multi-tenant store selector
  isOnlineOrder?: boolean; // Online buyer portal purchase
  status?: 'Completado' | 'Pendiente Control' | 'Cancelado';
  isPracticeMode?: boolean;
  // AFIP / ARCA billing fields
  billingType?: 'ticket' | 'factura';
  cae?: string;
  caeVencimiento?: string;
  comprobanteNumero?: number;
  puntoDeVenta?: number;
  qrImageDataUrl?: string;
  afipQrUrl?: string;
  docTipo?: number;         // 99: Consumidor Final, 96: DNI, 80: CUIT
  docNro?: number;
  isPending?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  docId?: string; // DNI / CUIT / etc.
  address?: string;
  debtBalance?: number; // Total outstanding debt
  lastPaymentDate?: string;
  storeEmail?: string; // Multi-tenant store selector
  isPracticeMode?: boolean;
}

export interface DebtTransaction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'deuda' | 'pago';
  amount: number;
  date: string;
  concept: string;
  paymentMethod?: string;
  storeEmail?: string; // Multi-tenant store selector
  isPracticeMode?: boolean;
}

export interface Subscription {
  plan: 'Gratuito' | 'Básico' | 'Profesional' | 'Empresarial';
  status: 'Activo' | 'Suspendido' | 'Expirado';
  nextBillingDate: string;
  price: number;
}

export interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  logoUrl?: string;
  schedule: string;
  cuit?: string;
  email?: string;
  website?: string;
  instagram?: string;
  detailedHours?: {
    day: string;
    isOpen: boolean;
    is24h: boolean;
    openTime: string;
    closeTime: string;
  }[];
  isConfigured?: boolean;
  storeCode?: string; // Unique alphanumeric search code
  bankAlias?: string; // Bank transfer Alias
  // Night surcharge features (Profesional Plan and higher only)
  nightSurchargeActive?: boolean;
  nightSurchargePercent?: number;
  nightSurchargeStart?: string; // e.g. "22:00"
  nightSurchargeEnd?: string; // e.g. "08:00"
  country?: string;   // Location fields
  province?: string;  // Location fields
  city?: string;      // Location fields
  latitude?: number;  // GPS latitude
  longitude?: number; // GPS longitude
  fixedCosts?: {
    id: string;
    category: string;
    amount: number;
  }[];
  billingConfig?: BillingConfig;
}

export interface BillingConfig {
  enabled: boolean;
  cuit: string;
  razonSocial: string;
  condicionIva: 'MONOTRIBUTO' | 'RESPONSABLE_INSCRIPTO' | 'EXENTO';
  puntoDeVenta: number;
  certPem?: string;
  keyPem?: string;
  environment: 'production' | 'sandbox';
}

export interface SupplierOffer {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierEmail: string;
  storeEmail: string; // The targeted store's email
  storeName: string;
  date: string;
  title: string;
  description: string;
  productsList: {
    productName: string;
    description?: string;
    price: number;
    unit?: string;
  }[];
  status: 'Enviado' | 'Leído' | 'Aceptado' | 'Rechazado';
}

export interface Category {
  id: string;
  name: string;
  description: string;
  storeEmail?: string; // Multi-tenant store selector
}

export interface Supplier {
  id: string;
  name: string;
  contactName?: string;
  phone?: string;
  email?: string;
  address?: string;
  taxId?: string; // CUIT / RUT / etc.
  notes?: string;
  storeEmail?: string; // Multi-tenant store selector
}

export interface SupplierPurchase {
  id: string;
  supplierId: string;
  supplierName: string;
  date: string;
  items: {
    productId?: string;
    productName: string;
    quantity: number;
    cost: number;
  }[];
  totalAmount: number;
  paymentStatus: 'Pagado' | 'Pendiente';
  paymentMethod: 'Efectivo' | 'Transferencia' | 'Tarjeta de Crédito' | 'Tarjeta de Débito' | 'Otro';
  storeEmail: string;
}

export interface CashierSession {
  id: string;
  employeeId: string;
  employeeName: string;
  openTime: string;
  closeTime?: string;
  initialCash: number;
  closeCash?: number;
  salesCount: number;
  salesTotal: number;
  salesByMethod: { [key: string]: number };
  debtPaymentsCollected: number;
  hourlyRate: number;
  wageAccrued?: number;
  status: 'esperando_autorizacion' | 'autorizado' | 'cerrado';
  storeEmail: string;
  shift?: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string; // Formato YYYY-MM-DD
  category: 'alquiler' | 'proveedor' | 'festivo' | 'oferta' | 'otro';
  createdBy: string;
  storeEmail: string;
  createdAt: string;
}

