export interface SystemFeature {
  id: string;
  name: string;
  description: string;
  status: 'Activo' | 'Optimizado' | 'En Pruebas' | 'Mantenimiento';
  version: string;
  category: 'Seguridad' | 'POS' | 'Inventario' | 'Finanzas' | 'Accesibilidad' | 'Infraestructura';
  date: string;
  details: string[];
}

export const SYSTEM_CHANGELOG: SystemFeature[] = [
  {
    id: 'feat-15',
    name: 'Sincronización y Validación de Claves Mercado Pago en Pasarela SaaS',
    description: 'Vincular el formulario de suscripciones SaaS de clientes para que consuma en tiempo real las credenciales configuradas desde el SuperAdmin en Firestore.',
    status: 'Activo',
    version: '1.3.6',
    category: 'Finanzas',
    date: '2026-06-27',
    details: [
      'Sincronización en tiempo real de Public Key, Client ID y modo de conexión (Sandbox vs Producción) en el checkout de suscripciones.',
      'Inyección de un banner certificado de validación visual del gateway de pagos con credenciales descriptas de forma transparente.',
      'Persistencia duradera en Firestore para registros de transacciones aprobadas y actualización de planes de licencias de comercios.'
    ]
  },
  {
    id: 'feat-14',
    name: 'Recuperación de Contraseña Real por SMTP Seguro',
    description: 'Permite recuperar credenciales de forma 100% segura mediante envíos SMTP reales a las casillas de correo registradas.',
    status: 'Activo',
    version: '1.3.5',
    category: 'Seguridad',
    date: '2026-06-27',
    details: [
      'Búsqueda inteligente multicapa que localiza tanto cuentas maestras (Super Admin) como de empleados y dueños en el sistema.',
      'Envíos reales asíncronos por la casilla corporativa de alta fidelidad seguridad@max24app.com.',
      'Plantilla de correo responsiva con diseño corporativo optimizado, logotipos de marca y visualización segura de credenciales.'
    ]
  },
  {
    id: 'feat-13',
    name: 'Integración de SMTP Seguro Hostinger (Cuentas Corporativas)',
    description: 'Permite el despacho seguro y real de correos electrónicos corporativos desde @max24app.com.',
    status: 'Activo',
    version: '1.3.0',
    category: 'Infraestructura',
    date: '2026-06-26',
    details: [
      'Configuración de cuentas corporativas reales: seguridad@max24app.com, notificaciones@max24app.com y soporte@max24app.com.',
      'Soporte SMTP seguro con SSL/TLS utilizando nodemailer en el backend de Node.',
      'Aislamiento de credenciales en variables de entorno para cumplir con las pautas de seguridad.',
      'Despacho automático de códigos 2FA y comprobantes de cuentas corrientes en tiempo real.'
    ]
  },
  {
    id: 'feat-12',
    name: 'Asistente Voces y Narrador de Accesibilidad (Soporte TalkBack & Hipoacúsicos)',
    description: 'Facilita la navegación de personas con discapacidades visuales o auditivas mediante síntesis de voz nativa y subtítulos.',
    status: 'Activo',
    version: '1.2.5',
    category: 'Accesibilidad',
    date: '2026-06-25',
    details: [
      'Motor de voz HTML5 SpeechSynthesis para leer textos al pasar el cursor o enfocar elementos.',
      'Subtítulos flotantes interactivos en la parte inferior de la pantalla para apoyo de personas hipoacúsicas.',
      'Controles directos para velocidad de lectura, volumen y zoom de texto.',
      'Inyección global del asistente en Landing, Login y paneles principales sin alterar el núcleo de diseño.'
    ]
  },
  {
    id: 'feat-11',
    name: 'Control de Costos Fijos y Ganancia Real (Utilidad Neta)',
    description: 'Motor financiero para el cálculo exacto de la rentabilidad mensual restando costos fijos y costo de mercadería.',
    status: 'Activo',
    version: '1.2.0',
    category: 'Finanzas',
    date: '2026-06-24',
    details: [
      'Gestión interactiva de costos fijos mensuales (alquiler, luz, internet, telefonía) en Configuración.',
      'Visualización del Estado de Resultados con balance de utilidad neta en la sección de Reportes.',
      'Cálculo matemático automático: Utilidad Neta = Ventas Brutas - Costo de Compra (COGS) - Costos Fijos.'
    ]
  },
  {
    id: 'feat-10',
    name: 'Autenticación Segura de Doble Factor (2FA) por Correo',
    description: 'Añade una capa de seguridad crítica con códigos OTP de 6 dígitos con validez temporal.',
    status: 'Activo',
    version: '1.1.5',
    category: 'Seguridad',
    date: '2026-06-23',
    details: [
      'Generación asíncrona de códigos dinámicos OTP temporales de 2 minutos.',
      'Notificador visual de bandeja de entrada para simulación fluida en entornos de prueba.',
      'Pantalla dedicada de verificación con cronómetro descendente y reenvío inteligente.'
    ]
  },
  {
    id: 'feat-09',
    name: 'Importador de Catálogo y Base de Datos Externa (CSV / JSON)',
    description: 'Agiliza la migración de productos mediante la carga masiva de archivos.',
    status: 'Activo',
    version: '1.1.0',
    category: 'Inventario',
    date: '2026-06-22',
    details: [
      'Lector avanzado con autodetección de delimitadores (comas , o punto y coma ;).',
      'Mapeo inteligente con tolerancia de sinónimos en inglés y español para encabezados.',
      'Control integrado contra códigos duplicados y registro en el historial de movimientos.'
    ]
  },
  {
    id: 'feat-05',
    name: 'Buscador Inteligente POS con Escaneo Automático Directo',
    description: 'Acelera la facturación en el mostrador interpretando escáneres físicos.',
    status: 'Activo',
    version: '1.0.5',
    category: 'POS',
    date: '2026-06-20',
    details: [
      'Coincidencia exacta de códigos de barra o SKUs que añade el producto automáticamente al carrito sin clic manual.',
      'Captura e interpretación del retorno de carro (tecla "Enter") para agilizar el flujo de cobros.'
    ]
  }
];
