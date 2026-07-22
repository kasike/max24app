import React, { useState } from 'react';
import { 
  BookOpen, 
  Download, 
  CheckCircle, 
  User, 
  ShieldAlert, 
  Terminal, 
  Package, 
  Users, 
  Printer, 
  TrendingUp, 
  Wallet, 
  HelpCircle,
  FileText,
  BadgeAlert,
  Sliders,
  ChevronRight,
  Building2,
  RefreshCw,
  Search,
  Activity
} from 'lucide-react';
import { SYSTEM_CHANGELOG, SystemFeature } from '../data/changelog';

interface UserManualProps {
  currentUserRole?: string;
  storeName?: string;
}

export default function UserManual({ currentUserRole = 'Empleado', storeName = 'Mi Comercio' }: UserManualProps) {
  const [activeSegment, setActiveSegment] = useState<'propietario' | 'empleado' | 'actualizaciones'>(
    currentUserRole === 'Administrador' ? 'propietario' : 'empleado'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const handlePrint = () => {
    // Open print preview specifically of the manual content
    const printContent = document.getElementById('printable-manual-content');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Manual_Operativo_MAX24_${storeName.replace(/\s+/g, '_')}</title>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&family=JetBrains+Mono:wght@400;700&display=swap" rel="stylesheet">
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body {
                  font-family: 'Inter', sans-serif;
                  color: #0f172a;
                  background-color: #ffffff;
                }
                .page-break {
                  page-break-before: always;
                }
                .no-print {
                  display: none;
                }
              }
            </style>
          </head>
          <body class="p-10 max-w-4xl mx-auto bg-white text-slate-900">
            <div class="border-b border-slate-300 pb-6 mb-8 text-center">
              <h1 class="text-3xl font-black text-slate-950 uppercase tracking-tight">M24 MAX24</h1>
              <p class="text-sm font-semibold text-slate-500 uppercase tracking-widest mt-1">Manual de Operación de Tienda</p>
              <div class="mt-4 inline-block bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                <span class="text-xs font-bold text-slate-700">Comercio: ${storeName}</span>
              </div>
            </div>
            ${printContent.innerHTML}
            <div class="mt-12 pt-6 border-t border-slate-200 text-center text-[10px] text-slate-400 font-mono">
              Soporte Central MAX24 • Sitio Oficial: www.max24app.com • v1.2.0 Pro
            </div>
            <script>
              window.onload = function() {
                window.print();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="space-y-6 font-sans text-left">
      {/* Top Welcome Title */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/[0.04] blur-[80px] rounded-full -translate-y-12 translate-x-12 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/[0.02] blur-[80px] rounded-full translate-y-12 -translate-x-12 pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="px-3 py-1 bg-orange-500/15 text-orange-400 border border-orange-500/25 rounded-full text-[10px] font-black tracking-widest uppercase">
              Centro de Capacitación
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
              Manual del Comercio MAX24
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
              Una guía completa de instrucciones operativas, dividida específicamente por roles para garantizar una gestión de mostrador ágil, segura y libre de fraudes.
            </p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center justify-center gap-2 px-5 py-3 bg-orange-500 hover:bg-orange-600 active:scale-95 text-slate-950 font-extrabold text-xs tracking-wide uppercase rounded-2xl shadow-xl shadow-orange-500/15 cursor-pointer transition-all self-start md:self-auto select-none"
          >
            <Printer className="w-4 h-4 text-slate-950" />
            <span>Descargar en PDF / Imprimir</span>
          </button>
        </div>
      </div>

      {/* Tabs / Selectors */}
      <div className="grid grid-cols-1 md:grid-cols-3 bg-slate-900/60 p-1.5 rounded-2xl border border-slate-800/80 gap-1.5">
        <button
          onClick={() => setActiveSegment('propietario')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSegment === 'propietario'
              ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>PARTE 1: Propietario / Dueño</span>
        </button>

        <button
          onClick={() => setActiveSegment('empleado')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSegment === 'empleado'
              ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>PARTE 2: Empleados y Cajeros</span>
        </button>

        <button
          onClick={() => setActiveSegment('actualizaciones')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-black transition-all cursor-pointer ${
            activeSegment === 'actualizaciones'
              ? 'bg-orange-500 text-slate-950 shadow-lg shadow-orange-500/10'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
          }`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>PARTE 3: Cambios y Novedades 🔄</span>
        </button>
      </div>

      {/* Main Manual Content */}
      <div className="bg-slate-900/40 border border-slate-800 p-6 md:p-8 rounded-3xl space-y-8">
        
        {/* Dynamic Display Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-800/80">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-orange-500">
            {activeSegment === 'propietario' ? (
              <Building2 className="w-6 h-6" />
            ) : activeSegment === 'empleado' ? (
              <Users className="w-6 h-6" />
            ) : (
              <RefreshCw className="w-6 h-6 animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="text-lg font-black text-white">
              {activeSegment === 'propietario' 
                ? 'Manual del Propietario (Dueño del Negocio)' 
                : activeSegment === 'empleado' 
                  ? 'Manual de Empleados (Cajeros y Encargados)' 
                  : 'Novedades, Historial & Actualizaciones de Sistema'}
            </h2>
            <p className="text-slate-400 text-xs mt-0.5">
              {activeSegment === 'propietario'
                ? 'Configuraciones de marcas, control general de finanzas, auditorías y gestión de personal.'
                : activeSegment === 'empleado'
                  ? 'Operación rápida de la terminal, facturación, cuentas corrientes/fiados y control de caja.'
                  : 'Registro de cambios en tiempo real. Este módulo se auto-actualiza dinámicamente con cada cambio.'}
            </p>
          </div>
        </div>

        {/* Dynamic content rendering */}
        <div id="printable-manual-content" className="space-y-10 text-slate-300">
          {activeSegment === 'propietario' ? (
            <div className="space-y-8">
              
              {/* Introduction Section */}
              <div className="space-y-3 bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  1. Visión General del Propietario
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Como **Propietario / Dueño del Comercio** en MAX24, usted cuenta con el control administrativo absoluto. Su panel centralizado le permite configurar la identidad de la tienda, supervisar el flujo de caja integrado, autorizar las claves de API (como cobros por Mercado Pago), auditar las ventas y definir los sueldos y perfiles de acceso de todo su equipo de trabajo.
                </p>
              </div>

              {/* Step 2 */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  2. Ajustes de Tienda y Logo de Marca
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Para dar identidad y formalidad a sus tickets impresos y pantallas de ventas, ingrese a la pestaña **Ajustes de Tienda**. Desde allí podrá:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-400">
                  <li>**Establecer Datos Fiscales:** Razón Social, CUIT, Dirección del Local y Teléfono Oficial de Contacto.</li>
                  <li>**Logotipo Personalizado:** Suba un archivo de imagen en formato JPEG/PNG o enlace directo para personalizar su interfaz. Su logo aparecerá en la terminal de cobros y en los comprobantes del cliente.</li>
                  <li>**Establecer Moneda y Región:** Configure la moneda de transacción base (ARS por defecto en Argentina).</li>
                </ul>
              </div>

              {/* Step 3 */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  3. Gestión de Personal (Control de Turnos y Auditorías de Caja)
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Bajo la sección **Empleados / Roles**, usted tiene el poder exclusivo de vigilar y registrar a su equipo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-2">
                    <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider">Altas de Empleados</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      Registre nuevos usuarios asignándoles un rol específico (**Cajero, Supervisor, Gerente**). Defina un nombre de usuario de acceso corto y una contraseña segura de inicio en la terminal.
                    </p>
                  </div>
                  <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/80 space-y-2">
                    <h4 className="text-xs font-black text-orange-400 uppercase tracking-wider">Cláusulas de Seguridad</h4>
                    <p className="text-slate-400 text-xs leading-relaxed">
                      **¡Evite fraudes en caja!** El personal con rol de Cajero básico NO tiene permisos para modificar precios, eliminar stock del inventario de forma manual, ni activar créditos fiados sin autorización explícita de un supervisor.
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 4 */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  4. Control Exacto de Inventario y Alertas de Quiebre de Stock
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  La pestaña **Inventario / Stock** es el corazón de la rentabilidad:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-400">
                  <li>**Carga de Productos:** Registre sus mercaderías con código de barras (EAN), precio de costo y precio de venta final para calcular márgenes de ganancias reales automáticos.</li>
                  <li>**Alertas Críticas:** Defina el campo "Stock Mínimo" para cada producto. El sistema generará insignias rojas de alerta cuando el stock físico caiga por debajo de este umbral, avisando la necesidad urgente de reponer con proveedores.</li>
                  <li>**Fórmula de Reposición Inteligente:** Use el calculador del sistema para pedir cantidades precisas basadas en tendencias semanales.</li>
                </ul>
              </div>

              {/* Step 5 */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500" />
                  5. Mercado Pago y Pasarla de Pagos QR
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Para permitir cobros por QR digitales en el mostrador:
                </p>
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3.5">
                  <ShieldAlert className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-white">Instrucciones de Vinculación Oficial</p>
                    <p className="text-slate-450 text-xs leading-relaxed">
                      Obtenga sus credenciales de producción de **Mercado Pago Argentina** (Access Token) e infórmelas en la pestaña correspondiente de Ajustes / Finanzas de su cuenta. **Nunca brinde su clave personal de Mercado Pago a sus cajeros o empleados.**
                    </p>
                  </div>
                </div>
              </div>

            </div>
          ) : activeSegment === 'empleado' ? (
            <div className="space-y-8">
              
              {/* Introduction Section */}
              <div className="space-y-3 bg-slate-900/30 p-5 rounded-2xl border border-slate-800/50">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  1. El Rol del Cajero / Operario de Mostrador
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Como **Empleado o Cajero de MAX24**, su prioridad primordial es brindar una atención veloz de facturación, registrar las ventas al instante para evitar discrepancias de inventario, y operar la caja de manera responsable durante su jornada laboral asignada.
                </p>
              </div>

              {/* POS operation */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  2. Pasos para Operar la Terminal POS (Punto de Venta)
                </h3>
                <ol className="list-decimal pl-5 space-y-3 text-xs sm:text-sm text-slate-400">
                  <li>
                    <strong className="text-white">Lectura de Mercaderías:</strong> Utilice la pistola lectora o busque de forma manual escribiendo el nombre del producto en el casillero de búsqueda de la terminal. El producto se agregará de inmediato a la boleta.
                  </li>
                  <li>
                    <strong className="text-white">Ajuste de Cantidades:</strong> Incremente o decremente unidades usando los botones (+/-) provistos para evitar transacciones incorrectas.
                  </li>
                  <li>
                    <strong className="text-white">Selección de Método de Pago:</strong> Pregunte al cliente cómo abonará la compra. El sistema soporta:
                    <div className="mt-1 flex flex-wrap gap-2 text-[10px] font-bold">
                      <span className="bg-slate-850 text-slate-300 px-2 py-0.5 rounded-full">Efectivo</span>
                      <span className="bg-slate-850 text-slate-300 px-2 py-0.5 rounded-full">Mercado Pago QR</span>
                      <span className="bg-slate-850 text-slate-300 px-2 py-0.5 rounded-full">Tarjeta (Débito/Crédito)</span>
                      <span className="bg-slate-850 text-slate-300 px-2 py-0.5 rounded-full">Fiado / Cuenta Corriente</span>
                    </div>
                  </li>
                  <li>
                    <strong className="text-white">Cerrar Transacción:</strong> Presione el botón **Confirmar e Imprimir** para liberar el inventario, registrar la venta en la base de datos de auditorías y concluir la transacción física correspondientemente.
                  </li>
                </ol>
              </div>

              {/* Debt and Fiados */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  3. Control de Cuentas Corrientes ("Fiados") y Clientes
                </h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Para clientes recurrentes autorizados a llevar mercadería fianza (a pagar con posterioridad):
                </p>
                <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm text-slate-400">
                  <li>**Asignar Cliente:** Antes de cerrar la compra en la terminal POS, es OBLIGATORIO seleccionar el nombre del cliente del buscador superior. No se puede fiar a un comprador genérico o anónimo.</li>
                  <li>**Verificar Límite de Crédito:** Si el cliente ya posee deudas muy altas acumuladas, el sistema mostrará una advertencia de bloqueo. Deberá solicitar la cancelación parcial o total para reactivar su saldo.</li>
                  <li>**Generar Remito de Retirada:** Siempre asegúrese de que el cliente registre el comprobante con su firma física en caso de solicitudes de altos montos.</li>
                </ul>
              </div>

              {/* Shifts and Clock in/out */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  4. Control de Turnos y Apertura/Cierre de Caja
                </h3>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl text-slate-400 space-y-2 text-xs sm:text-sm">
                  <p className="font-bold text-white">Al iniciar su turno laboral:</p>
                  <p>Ingrese con sus credenciales autorizadas e informe su fondo de caja inicial. Todas las ventas procesadas quedarán asociadas a su nombre específico para el arqueo de caja de supervisión.</p>
                  <p className="font-bold text-white pt-2">Al finalizar su turno laboral:</p>
                  <p>Contabilice el efectivo físico en cajón y compárelo contra el saldo de la terminal. Genere el reporte impreso con las diferencias si correspondiese antes de cerrar sesión para que el siguiente empleado pueda asumir el puesto.</p>
                </div>
              </div>

              {/* Best practices */}
              <div className="space-y-4">
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  5. Preguntas Frecuentes y Soporte IA
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-white">¿Qué hago si se cae Internet o el sistema?</p>
                    <p className="text-slate-450 text-xs">**MAX24 cuenta con motor offline de guardado temporal.** Siga facturando normalmente en la terminal. Una vez restablecida la red, el sistema sincronizará automáticamente sus cambios en segundo plano con la nube sin pérdida de información.</p>
                  </div>
                  <div className="p-3 bg-slate-950/40 border border-slate-850 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-white">¿Cómo pido ayuda con tareas administrativas complejas?</p>
                    <p className="text-slate-450 text-xs">Utilice la barra de pestaña **Soporte IA y Auto-Mant.** para que el asistente cognitivo inteligente lo asista en restauraciones de base de datos, cálculo de precios masivos o correcciones de inventario.</p>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="space-y-6 text-left" id="changelog-manual-section">
              {/* Info Notification Card */}
              <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl flex items-start gap-3">
                <Activity className="w-5 h-5 text-orange-500 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Base de Conocimiento Sincronizada Automáticamente</h4>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    Este manual interactivo lee directamente el registro integrado del sistema. Cada nueva característica, corrección de errores, u optimización implementada en el ecosistema <strong>MAX24</strong> se mapea aquí en tiempo real de forma dinámica y sin necesidad de descargas.
                  </p>
                </div>
              </div>

              {/* Search & Category Filter Section */}
              <div className="flex flex-col md:flex-row gap-3 items-center justify-between pb-2">
                <div className="relative w-full md:max-w-xs">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Buscar mejoras o características..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 transition-all font-sans"
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
                  {['all', 'Seguridad', 'POS', 'Inventario', 'Finanzas', 'Accesibilidad', 'Infraestructura'].map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? 'bg-orange-500 text-slate-950 font-black'
                          : 'bg-slate-900 border border-slate-850 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat === 'all' ? 'Todos' : cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Grid of features */}
              <div className="space-y-4">
                {SYSTEM_CHANGELOG.filter(feat => {
                  const matchesSearch = feat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                       feat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                       feat.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
                  const matchesCategory = selectedCategory === 'all' || feat.category === selectedCategory;
                  return matchesSearch && matchesCategory;
                }).map((feat) => (
                  <div 
                    key={feat.id} 
                    className="p-5 bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl space-y-3 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/50 pb-2.5">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700/50 rounded text-[9px] font-mono">
                            v{feat.version}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                            feat.category === 'Seguridad' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                            feat.category === 'POS' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                            feat.category === 'Inventario' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                            feat.category === 'Finanzas' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                            'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                          }`}>
                            {feat.category}
                          </span>
                          <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 rounded text-[9px] font-black tracking-wider uppercase">
                            {feat.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-black text-white">{feat.name}</h4>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono sm:self-start">
                        {feat.date}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">
                      {feat.description}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Detalles de la mejora:</p>
                      <ul className="space-y-1 pl-1">
                        {feat.details.map((detail, idx) => (
                          <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                            <span className="text-orange-500 font-bold mt-0.5">›</span>
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}

                {SYSTEM_CHANGELOG.filter(feat => {
                  const matchesSearch = feat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                       feat.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                       feat.details.some(d => d.toLowerCase().includes(searchQuery.toLowerCase()));
                  const matchesCategory = selectedCategory === 'all' || feat.category === selectedCategory;
                  return matchesSearch && matchesCategory;
                }).length === 0 && (
                  <div className="text-center py-8 bg-slate-900/20 border border-dashed border-slate-800 rounded-2xl">
                    <HelpCircle className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-xs font-bold text-slate-400">No se encontraron mejoras o actualizaciones</p>
                    <p className="text-[10px] text-slate-550 mt-1">Intente cambiar el término de búsqueda o el filtro de categoría.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Footer Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-left space-y-1.5 hover:border-slate-800 transition-colors">
          <TrendingUp className="w-5 h-5 text-orange-500" />
          <h4 className="text-xs font-black text-white">Auditoría 24/7</h4>
          <p className="text-[11px] text-slate-450 leading-relaxed">
            Cada movimiento, pago fiado, caja abierta y login de usuario queda registrado con estampa de hora en la nube indestructible.
          </p>
        </div>
        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-left space-y-1.5 hover:border-slate-800 transition-colors">
          <Wallet className="w-5 h-5 text-orange-500" />
          <h4 className="text-xs font-black text-white">Gestión Financiera</h4>
          <p className="text-[11px] text-slate-450 leading-relaxed">
            Consulte en vivo las utilidades netas descontando los costos cargados en el catálogo de productos.
          </p>
        </div>
        <div className="p-5 bg-slate-900/40 border border-slate-800/80 rounded-2xl text-left space-y-1.5 hover:border-slate-800 transition-colors">
          <HelpCircle className="w-5 h-5 text-orange-500" />
          <h4 className="text-xs font-black text-white">Centro de Soporte</h4>
          <p className="text-[11px] text-slate-450 leading-relaxed">
            ¿Tiene dudas normativas o problemas de hardware? Contacte al equipo central desde www.max24app.com.
          </p>
        </div>
      </div>
    </div>
  );
}
