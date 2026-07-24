import { Product, Employee, Sale, Subscription, StoreSettings, Category, Customer } from './types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Aceite de Girasol 1.5L',
    sku: 'ACE-GIR-15',
    category: 'Alimentos',
    price: 3200,
    cost: 2100,
    stock: 45,
    minStock: 10,
    unit: 'Unidades'
  },
  {
    id: 'prod-2',
    name: 'Arroz Integral Extra 1Kg',
    sku: 'ARR-INT-1K',
    category: 'Alimentos',
    price: 1500,
    cost: 950,
    stock: 8, // Low stock on purpose
    minStock: 15,
    unit: 'Unidades'
  },
  {
    id: 'prod-3',
    name: 'Leche Entera Larga Vida 1L',
    sku: 'LEC-LON-1L',
    category: 'Lácteos',
    price: 1200,
    cost: 800,
    stock: 120,
    minStock: 25,
    unit: 'Unidades'
  },
  {
    id: 'prod-4',
    name: 'Detergente Líquido Ropa 3L',
    sku: 'DET-LIQ-3L',
    category: 'Limpieza',
    price: 5400,
    cost: 3500,
    stock: 22,
    minStock: 5,
    unit: 'Unidades'
  },
  {
    id: 'prod-5',
    name: 'Café Molido Suave 500g',
    sku: 'CAF-SUA-50',
    category: 'Alimentos',
    price: 4800,
    cost: 3100,
    stock: 30,
    minStock: 8,
    unit: 'Unidades'
  },
  {
    id: 'prod-6',
    name: 'Manzanas Red Delicious x Kg',
    sku: 'MAN-RED-KG',
    category: 'Frescos',
    price: 2500,
    cost: 1400,
    stock: 35,
    minStock: 15,
    unit: 'Kg'
  },
  {
    id: 'prod-7',
    name: 'Jabón de Tocador Cremoso',
    sku: 'JAB-TOC-CRE',
    category: 'Higiene',
    price: 900,
    cost: 550,
    stock: 3, // Low stock on purpose
    minStock: 10,
    unit: 'Unidades'
  },
  {
    id: 'prod-8',
    name: 'Papel Higiénico Doble Hoja x4',
    sku: 'PAP-HIG-DH4',
    category: 'Higiene',
    price: 2100,
    cost: 1300,
    stock: 50,
    minStock: 12,
    unit: 'Unidades'
  }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Carlos Daniel Pérez',
    email: 'pezziniarg@gmail.com',
    role: 'Administrador',
    status: 'Activo',
    shift: 'Mañana',
    joinedDate: '2025-01-15',
    username: 'pezziniarg@gmail.com',
    password: 'Max24@2626',
    phone: '+54 11 5566-7788',
    salary: 1250000,
    emergencyContact: 'María Pérez (Madre) - +54 11 2233-4455'
  },
  {
    id: 'emp-bigmax',
    name: 'Administrador BigMAX',
    email: 'bigmax24h7@gmail.com',
    role: 'Administrador',
    status: 'Activo',
    shift: 'Rotativo',
    joinedDate: '2026-06-20',
    username: 'bigmax24h7@gmail.com',
    password: 'Bigmax2626@',
    phone: '+54 11 7766-5544',
    salary: 1500000,
    emergencyContact: 'Soporte Técnico - +54 11 5555-5555'
  },
  {
    id: 'emp-2',
    name: 'Ana Belén Martínez',
    email: 'ana.m@tienda.com',
    role: 'Cajero',
    status: 'Activo',
    shift: 'Tarde',
    joinedDate: '2025-03-10',
    username: 'ana.m',
    password: 'password123',
    phone: '+54 11 3344-5566',
    salary: 620000,
    emergencyContact: 'Juan Martínez (Hermano) - +54 11 9988-7766'
  },
  {
    id: 'emp-3',
    name: 'Jorge Luis Peña',
    email: 'jorge.p@tienda.com',
    role: 'Cajero',
    status: 'Activo',
    shift: 'Mañana',
    joinedDate: '2025-04-01',
    username: 'jorge.p',
    password: 'password123',
    phone: '+54 11 6677-8899',
    salary: 620000,
    emergencyContact: 'Inés Peña (Madre) - +54 11 1122-3344'
  },
  {
    id: 'emp-4',
    name: 'Sofía Rossi',
    email: 'sofia.r@tienda.com',
    role: 'Gerente',
    status: 'Activo',
    shift: 'Rotativo',
    joinedDate: '2024-08-20',
    username: 'sofia.r',
    password: 'password123',
    phone: '+54 11 7788-9900',
    salary: 950000,
    emergencyContact: 'Carlos Rossi (Padre) - +54 11 9988-1122'
  }
];

export const INITIAL_SALES: Sale[] = [
  {
    id: 'V-1001',
    date: '2026-06-18T10:30:00Z',
    items: [
      { productId: 'prod-1', productName: 'Aceite de Girasol 1.5L', quantity: 2, price: 3200 },
      { productId: 'prod-3', productName: 'Leche Entera Larga Vida 1L', quantity: 3, price: 1200 }
    ],
    subtotal: 10000,
    discount: 500,
    tax: 2100,
    total: 11600,
    paymentMethod: 'Efectivo',
    cashReceived: 12000,
    change: 400,
    sellerId: 'emp-2',
    sellerName: 'Ana Belén Martínez'
  },
  {
    id: 'V-1002',
    date: '2026-06-18T16:15:00Z',
    items: [
      { productId: 'prod-4', productName: 'Detergente Líquido Ropa 3L', quantity: 1, price: 5400 },
      { productId: 'prod-8', productName: 'Papel Higiénico Doble Hoja x4', quantity: 2, price: 2100 }
    ],
    subtotal: 9600,
    discount: 0,
    tax: 2016,
    total: 11616,
    paymentMethod: 'Tarjeta de Crédito',
    sellerId: 'emp-3',
    sellerName: 'Jorge Luis Peña'
  },
  {
    id: 'V-1003',
    date: '2026-06-19T09:45:00Z',
    items: [
      { productId: 'prod-5', productName: 'Café Molido Suave 500g', quantity: 1, price: 4800 },
      { productId: 'prod-2', productName: 'Arroz Integral Extra 1Kg', quantity: 4, price: 1500 },
      { productId: 'prod-6', productName: 'Manzanas Red Delicious x Kg', quantity: 1.5, price: 2500 }
    ],
    subtotal: 14550,
    discount: 1000,
    tax: 3055,
    total: 16605,
    paymentMethod: 'Transferencia',
    sellerId: 'emp-2',
    sellerName: 'Ana Belén Martínez'
  },
  {
    id: 'V-1004',
    date: '2026-06-19T13:20:00Z',
    items: [
      { productId: 'prod-3', productName: 'Leche Entera Larga Vida 1L', quantity: 6, price: 1200 }
    ],
    subtotal: 7200,
    discount: 0,
    tax: 1512,
    total: 8712,
    paymentMethod: 'Efectivo',
    cashReceived: 10000,
    change: 1288,
    sellerId: 'emp-3',
    sellerName: 'Jorge Luis Peña'
  },
  {
    id: 'V-1005',
    date: '2026-06-20T10:05:00Z', // Today
    items: [
      { productId: 'prod-1', productName: 'Aceite de Girasol 1.5L', quantity: 1, price: 3200 },
      { productId: 'prod-5', productName: 'Café Molido Suave 500g', quantity: 2, price: 4800 },
      { productId: 'prod-7', productName: 'Jabón de Tocador Cremoso', quantity: 5, price: 900 }
    ],
    subtotal: 17300,
    discount: 1200,
    tax: 3633,
    total: 19733,
    paymentMethod: 'Tarjeta de Débito',
    sellerId: 'emp-2',
    sellerName: 'Ana Belén Martínez'
  }
];

export const INITIAL_SUBSCRIPTION: Subscription = {
  plan: 'Profesional',
  status: 'Activo',
  nextBillingDate: '2026-07-20',
  price: 29.99
};

export const INITIAL_STORE_SETTINGS: StoreSettings = {
  name: 'MAX24 Express',
  address: 'Av. Corrientes 2424, CABA, Argentina',
  phone: '+54 11 4455-6677',
  logoUrl: '',
  schedule: 'Lunes a Sábado de 08:00 a 22:00 hs',
  cuit: '30-74859632-9',
  email: 'contacto@max24express.com',
  website: 'www.max24express.com',
  instagram: '@max24express_ar',
  storeCode: 'MAX24-EXPRESS',
  bankAlias: 'max24.express.mp',
  country: 'Argentina',
  province: 'CABA',
  city: 'Belgrano',
  detailedHours: [
    { day: 'Lunes', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
    { day: 'Martes', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
    { day: 'Miércoles', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
    { day: 'Jueves', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
    { day: 'Viernes', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
    { day: 'Sábado', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
    { day: 'Domingo', isOpen: false, is24h: false, openTime: '09:00', closeTime: '13:00' }
  ],
  complianceNotifyEnabled: true,
  complianceDocuments: [
    {
      id: 'doc-1',
      documentType: '🏢 Habilitación Municipal (Comercial)',
      certificateNumber: 'HAB-SALTA-2025-8849',
      issueDate: '2025-03-15',
      expirationDate: '2028-03-15',
      notifyBeforeDays: 30,
      notes: 'Habilitación comercial definitiva expedida por la Municipalidad.'
    },
    {
      id: 'doc-2',
      documentType: '🧯 Carga y Control de Matafuegos (Anual)',
      certificateNumber: 'MAT-55210-OPDS',
      issueDate: '2025-08-10',
      expirationDate: '2026-08-10', // Upcoming or valid
      notifyBeforeDays: 30,
      notes: 'Revision técnica de 3 matafuegos ABC 5kg en salón y depósito.'
    },
    {
      id: 'doc-3',
      documentType: '🪰 Certificado de Fumigación / Desinfección',
      certificateNumber: 'FUM-7741',
      issueDate: '2026-05-20',
      expirationDate: '2026-06-20', // Expired or close to expiration for demonstration
      notifyBeforeDays: 15,
      notes: 'Control mensual obligatorio de plagas y vectores.'
    }
  ]
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Alimentos', description: 'Comestibles generales y secos' },
  { id: 'cat-2', name: 'Lácteos', description: 'Leche, quesos, yogures y derivados' },
  { id: 'cat-3', name: 'Limpieza', description: 'Artículos de desinfección e higiene' },
  { id: 'cat-4', name: 'Higiene', description: 'Cuidado personal y perfumería' }
];

export const INITIAL_CUSTOMERS: Customer[] = [
  { id: 'cust-1', name: 'Juan Carlos Gómez', email: 'juan.gomez@gmail.com', phone: '+54 11 9876-5432', docId: '28123456', address: 'Corrientes 1234, CABA', debtBalance: 12500, lastPaymentDate: '2026-06-10' },
  { id: 'cust-2', name: 'María Elena Silva', email: 'maria.silva@outlook.com', phone: '+54 11 5544-3322', docId: '32987654', address: 'Rivadavia 4567, CABA', debtBalance: 0, lastPaymentDate: '2026-06-18' },
  { id: 'cust-3', name: 'Esteban Di Pascuale', email: 'esteban.dp@hotmail.com', phone: '+54 11 2233-4455', docId: '24111222', address: 'Santa Fe 890, CABA', debtBalance: 4600, lastPaymentDate: '2026-06-05' }
];
