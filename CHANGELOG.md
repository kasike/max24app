# CHANGELOG - MAX24APP

Todas las modificaciones notables, nuevas características, parches de seguridad y correcciones de errores en este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased] - 2026-07-24

### Corregido
- **Apertura Automática del Modal de Facturación/Cobro desde la Calculadora Express (`POS.tsx`)**:
  1. Se actualizó el parámetro por defecto `directCheckout` a `true` en la función `handleAddQuickItemToCart`.
  2. Al presionar "Agregar y Facturar / Cobrar" o presionar la tecla `Enter` en el campo de expresión de la calculadora, se agrega el importe al carrito y se abre automáticamente la pantalla modal de "Finalizar Transacción" para seleccionar la forma de pago (Efectivo, MercadoPago, Tarjetas, Transferencia, Cuenta Corriente) y realizar la venta en un solo paso.
- **Reparación de Evaluación de Sumas y Tecla '=' en Calculadora Express (`POS.tsx`)**:
  1. Se eliminó la llamada errónea `!isInfinite(result)` en `calcEvaluatedTotal`, reemplazándola por `Number.isFinite(result)`. Esto solucionó un `ReferenceError` interno que provocaba que la evaluación matemática devolviera `$0`.
  2. Se corrigió el problema por el cual al ingresar sumas múltiples (ej. `120+50000+250`), únicamente se agregaba el primer número (`120`) al carrito. Ahora se suma y calcula la totalidad de los valores agregados (ej. `$50.370`).
  3. Se habilitó la respuesta de la tecla igual (`=`) en el teclado virtual de la calculadora para resolver y mostrar en pantalla el monto total antes de facturar.
- **Sincronización de Ventas por Calculadora Express y Desglose por Transferencia en Reportes (`POS.tsx`, `App.tsx` & `Reports.tsx`)**:
  1. Se corrigió la pérdida de precio en ventas expresas/calculadora pasando `customProduct`, `productName` y `price` dentro de `itemsToRegister` desde `POS.tsx` hacia `handleRegisterSale` en `App.tsx`. Anteriormente, al mapearse únicamente `{ productId, quantity }` y no existir el ID dinámico (`quick-...`) en el catálogo general, la búsqueda del producto devolvía `undefined`, asignando precio `$0` y dejando la venta registrada en `$0`.
  2. Se actualizó `App.tsx` para que extraiga prioritariamente `item.price` e `item.productName` cuando provengan de ventas por calculadora, asegurando que el total de la venta (ej. `$50.370`) se registre e impacte correctamente en la base de datos de Firebase y en el estado global.
  3. Se añadió el rastreo y desglose específico de pagos con **Transferencia** bancaria dentro del resumen del día y tickets Z-Report en `Reports.tsx`, contabilizándolo junto con Tarjetas y Fiados de forma clara y transparente.
- **Optimización de Margen Superior de Seguridad en iOS / iPhone para Menú de Navegación (`App.tsx`, `Sidebar.tsx`, `index.html` & `index.css`)**: Se solucionó la superposición de la barra de estado de iPhone (reloj `12:43`, notch y Dynamic Island) sobre el botón de menú hamburguesa (`≡`) y el texto de "Sucursal Activa":
  1. Se actualizó el meta tag de estado de iOS en `index.html` a `content="default"` evitando que la app renderice por detrás de la hora del sistema.
  2. Se configuraron paddings dinámicos de seguridad CSS `style={{ paddingTop: 'max(0px, env(safe-area-inset-top))' }}` en la barra de cabecera principal y en el cajón desplegable del menú lateral `<aside>`.
  3. Se amplió el área táctil activa del botón de menú hamburguesa (`≡`) y botón de cierre (`X`) a un mínimo de 42px con retroalimentación táctil `active:bg-slate-200` y clase `touch-manipulation`, asegurando un despliegue cómodo e inmediato en iPhones y dispositivos móviles Android.
- **Ocultamiento de Tarjeta de Propiedad Intelectual (DNDA) en Comercios Estándar (`Settings.tsx`)**: Se condicionó la visualización del bloque DNDA exclusivamente al usuario Master Admin (`pezziniarg@gmail.com`), asegurando que clientes nuevos registrados no vean este certificado privado en la sección de Ajustes de su tienda.
- **Configuración de Horarios de Atención Personalizados Día por Día (`Settings.tsx` & `StoreSetupWizard.tsx`)**: Se implementó una interfaz interactiva con controles por segmentos (**✗ Cerrado**, **★ 24 Horas** y **🕒 Horario Personalizado**) con entradas libres de tipo hora `<input type="time">` para ingresar manualmente cualquier rango de apertura y cierre (ej. 08:30 a 22:00 hs), eliminando la limitación previa. Incluye plantillas rápidas (08-20, 09-21, 08-22, 24hs) y función en 1 clic de "Copiar Lunes a Todos los Días".

### Añadido
- **Módulo de Calculadora Rápida y Facturación Express en POS (`POS.tsx` & `App.tsx`)**: Se implementó una herramienta interactiva de venta rápida accesible mediante el botón **"Venta Rápida / Calc"** en la barra superior del POS y en el panel del carrito:
  1. **Evaluador Matemático Libre**: Permite ingresar expresiones o sumas directas de montos sin necesidad de buscar productos en el catálogo (ej: `120 + 50000 + 250` = `$50.370`).
  2. **Teclado Numérico Virtual e Intercepción de Teclas**: Soporta entrada táctil mediante un teclado en pantalla de 20 botones (operadores, borrar `C`, `⌫`, `00`, `=`) y entrada directa por teclado físico.
  3. **Personalización de Comprobante / Ticket**: Selector de etiquetas rápidas (`Venta Rápida / Varios`, `Mercadería Varias`, `Golosinas / Almacén`, `Kiosco / Cigarrillos`, `Ferretería`) y caja de texto para descripción en el ticket.
  4. **Modos de Facturación Directos**: Disparadores en 1 clic para **"Agregar al POS"** (mantiene la suma en el carrito para seguir agregando más ítems) o **"Cobrar Directo"** (añade el importe e inicia la pasarela de checkout inmediatamente).
  5. **Soporte de Registro en Backend**: Se adaptó el flujo de registro de ventas en `App.tsx` para admitir ítems expresos sin requerir SKU ni descontar stock de inventario preexistente.
- **Módulo Destacado de ID Único de Tienda para Acceso de Empleados (`Settings.tsx` & `Employees.tsx`)**: Se rediseñó la sección de Código de Tienda en la pestaña de Ajustes con un banner visual destacado en degradado naranja, botón **"Copiar ID"** en 1 clic y explicaciones paso a paso de cómo los empleados deben ingresar al POS. Además, se sumó la inclusión automática del ID Único de Tienda en las tarjetas de bienvenida y mensajes de WhatsApp enviados a los nuevos empleados al registrarlos.

---

## [1.2.1] - 2026-07-23

### Corregido
- **Rediseño Integral del Módulo "Reportes / Análisis" (X-Report & Z-Report History)**: Se transformó la sección de estadísticas para situar el "Resumen del Día" (X-Report en tiempo real) y el "Historial de Turnos y Arqueos de Caja" (Z-Reports) en primer plano prioritario. Incluye:
  1. **Filtro de Fecha Principal**: Selector superior con acceso rápido a accesos predefinidos (**Hoy**, **Ayer**, **Esta Semana** y **Fecha Personalizada** `<input type="date">`).
  2. **Tarjeta Destacada Resumen Diario**: Bloque destacado con suma de Ventas Totales, Transacciones, Ticket Promedio y desglose directo por medio de pago (**Efectivo en Caja**, **Mercado Pago / QR**, **Tarjetas** y **Cuentas Corrientes / Fiado**).
  3. **Módulo y Modal de Arqueo Directo de Caja (Z-Report)**: Formulario interactivo para que el dueño o cajero declare el efectivo físicamente contado en la gaveta. El sistema calcula automáticamente el efectivo esperado (`Fondo Inicial + Ventas Efectivo`) y determina la diferencia exacta (`$0 Perfecto`, `+$X Sobrante` o `-$X Faltante`), guardando el registro en Firestore (`cashierSessions`).
  4. **Historial de Turnos y Cierres Z-Report**: Tabla de auditoría detallada de cada turno cerrado por empleado con horarios, efectivo esperado, declarado, diferencias con etiquetas de color e ícono de acción **"📄 Ver Ticket"**.
  5. **Visor e Impresor de Ticket Z-Report / Envió WhatsApp**: Replicación estética de comprobante térmico con firmas del responsable de turno, opciones de impresión local (`window.print()`) y despacho de reporte detallado por WhatsApp al celular del comerciante.
- **Manejo Seguro del Escáner de Cámara y Prevención de Crash en POS**: Se corrigió un error crítico no capturado que provocaba una pantalla blanca de error al cerrar abruptamente la cámara del escáner en la PWA. Se reestructuró la detención asíncrona de `html5-qrcode` con manejo defensivo de excepciones (`try-catch-finally`) y verificación del nodo DOM `#reader` para prevenir errores cuando el componente se desdesmonta.
- **Persistencia Automática de Carrito de Compras (`localStorage`)**: Se integró un estado persistente de los productos en el carrito (`max24_active_cart`) que evita la pérdida de ventas en curso ante cierres accidentales, recargas de página o fallas temporales de dispositivos.
- **Implementación de `POSErrorBoundary`**: Se envolvió el modal del escáner y el módulo del POS con un componente `ErrorBoundary` especializado que aísla cualquier inconveniente de hardware o sensores de video, permitiendo al usuario volver a la caja en 1 clic sin reiniciar la aplicación.
- **Rediseño Adaptativo e Interacción en Notificación 2FA Flotante (`Login.tsx`)**: Se reestructuró la posición y comportamiento del popup flotante de correo simulado en celulares móviles PWA. Se agregaron botones de acción rápida **"⚡ Autocompletar"** (relleno directo en 1 clic del código de 6 dígitos) y **"📋 Copiar"** (integración nativa con `navigator.clipboard`), eliminando desbordamientos de pantalla y problemas de tipeo manual en dispositivos táctiles.
- **Ajuste de Desbordamiento y Redundancia en Selector de Vendedor del POS**: Solucionado el desbordamiento de texto del menú desplegable de vendedor en pantallas de celulares. Se agregaron restricciones de ancho flexible (`min-w-0 flex-1 truncate max-w-[170px]`) y se eliminó la redundancia del rol en paréntesis (ej. `Administrador BigMAX (Administrador)`) cuando el nombre del usuario ya incluye el título de su rol.
- **Maquetación Adaptativa y Ajuste de Tarjetas PWA Móvil**: Corregido el desbordamiento de texto (`text overflow`) y deformación de tarjetas en la aplicación instalada en teléfonos inteligentes. Se sustituyeron alturas fijas (`h-36`) por rangos flexibles (`min-h-[144px] h-auto`), integrando truncamiento elegante con `line-clamp-2`, `break-words` y control de desbordamiento en nombres largos de comercios y productos del POS.
- **Optimización de Banner de Salud del Comercio**: Reorganizados los controles de acción ("Completar Ahora" y "Posponer") y posicionamiento absoluto del botón de cierre (`X`) en `StoreHealthBanner.tsx` para evitar saltos de línea o superposición de elementos en pantallas estrechas (360px–412px).
- **Ajuste de Cabecera Superior y Asistente de Accesibilidad**: Compactado el mensaje de "Conexión segura" en la barra de navegación superior en pantallas móviles (`sm:hidden text-[10px] font-bold`) y ajustado el tamaño del botón flotante de accesibilidad (`p-3 sm:p-4`) para garantizar un área táctil limpia de 44px sin invadir el catálogo de productos.
- **Alineación de Workflow de GitHub Actions (`android-build.yml`)**: Corregida la invocación de Gradle en el entorno de integración continua `ubuntu-latest`. Se sustituyó el comando global `gradle` por el script wrapper local `./gradlew` con permisos de ejecución (`chmod +x gradlew`), solucionando los fallos de compilación automática del ejecutable Android AAB.
- **Control de Acceso por Roles (RBAC) en Pestaña de Proveedores B2B y Portales**: Reparado el fallo de seguridad en `Login.tsx` donde credenciales pertenecientes a un Comercio/Administrador (ej. `bigmax24h7@gmail.com`) permitían iniciar sesión desde la pestaña "Proveedores B2B" e ingresar al panel del comercio. Se implementó una verificación estricta de rol (`mainPortalTab`), bloqueando la autenticación cruzada con alertas explicativas claras (ej. `⛔ Acceso denegado. Esta cuenta está registrada como Comercio. Por favor, inicia sesión desde la pestaña 'Comercio POS'.`).

### Añadido
- **Guía e Instrucciones de Descarga e Instalación PWA Móvil en Home (`max24app.com`)**: Se agregó una sección completa e interactiva `#descargar-app` en la página principal (`LandingPage.tsx`) con un diseño moderno en degradado azul e índigo. Incluye instrucciones paso a paso ilustradas para celulares **Google Android** (Chrome/Edge/Brave) y **Apple iPhone/iPad** (Safari), destacando las ventajas clave de la PWA (instalación sin tiendas externas, consumo ultraliviano <5MB, actualizaciones automáticas en tiempo real y seguridad SSL 256-bit). Se sumó además un acceso directo "App Móvil PWA" con ícono animado en la barra de navegación superior.
- **Filtro Rápido "🟢 Abiertos Ahora" + Orden por Geolocalización GPS**: Interruptor dinámico en `BuyerPortal.tsx` que oculta comercios cerrados y despliega exclusivamente negocios activos (`checkIsStoreOpen`). Integrado con `navigator.geolocation` para calcular distancias en km (fórmula Haversine), etiquetar tarjetas (`📍 a 1.2 km`) y ordenar los resultados de menor a mayor cercanía.
- **Banner Nocturno Automatizado (Smart Night Banner)**: Cartel promocional inteligente que se despliega automáticamente en horario nocturno/madrugada (22:00 a 06:00 hs) invitando al usuario a filtrar comercios 24hs o abiertos en tiempo real.
- **Navegación Directa con Google Maps ("Ver mapa")**: Botón e hipervínculo directo en cada tarjeta de comercio para abrir la dirección exacta de la sucursal en Google Maps.
- **Indicador Visual en Tiempo Real (Abierto / Cerrado) en Tarjetas de Comercios**: Implementación de badge de estado circular (verde esmeralda animado `#22C55E` para sucursales abiertas vs rojo carmín `#EF4444` para cerradas) en `BuyerPortal.tsx`, calculado en tiempo real con la función `checkIsStoreOpen` que evalúa los días, horarios detallados (`detailedHours`) y banderas de cierre manual.
- **Jerarquía y Simplificación UX en Tarjetas de Comercio**: Agrupación visual optimizada de datos (Nombre, Código de Sucursal, Dirección, Teléfono, Horario) y botones de acción rápida e intuitiva (**Comprar**, **Escáner**, **Favorito** y **WhatsApp**).
- **Integración Real de Google OAuth en Portal de Compradores**: Implementación de `GoogleAuthProvider` y `signInWithPopup` de Firebase Auth para solicitar autorización directa a Google y sincronizar el correo de Gmail real y nombre del usuario.
- **Edición de Correo en Perfil de Comprador**: Habilitación del campo de correo electrónico de ingreso en el panel de perfil del comprador para permitir actualización directa en Firestore.
- **Rediseño Arquitectónico de Pantalla de Login por Portales de Rol**: Separación limpia en 3 portales dedicados en `/src/components/Login.tsx`:
  1. 🛒 **Portal Compradores/Clientes**: Autenticación rápida SSO con logos vectoriales oficiales de Google y Facebook, ingreso con email/contraseña y botón destacado **"🗺️ Explorar Mapa de Comercios (Sin Registro)"** con activación de geolocalización GPS.
  2. 🏪 **Portal Comercio & POS**: Sub-conmutador entre Dueño/Administrador y Cajero/Empleado con ID de Tienda obligatorio, ingreso por PIN de 4 dígitos y casilla de fichaje de turno de trabajo (`⏱️ Reloj Checador`).
  3. 🚛 **Portal Proveedores B2B**: Acceso exclusivo para mayoristas y distribuidores con contexto de zonas y radios de entrega por km/provincia.
- **Acceso Directo Seguro a Consola Master (SuperAdmin)**: Enlace discreto protegido en el pie de página que activa la verificación 2FA para el propietario de la plataforma (`pezziniarg@gmail.com`).

### Cambiado
- **Eliminación Total de Credenciales en Texto Plano**: Remoción completa del bloque de texto estático `prueba / prueba` y `password123` en la pantalla de inicio de sesión. Reemplazado por botones de simulación segura de un solo clic (**⚡ Probar Demo Sandbox**) que autentican de forma transparente sin exponer contraseñas.
- **Normalización de Botones de Acción**: Sustitución del texto ambiguo "Confirmar Credenciales" por "Ingresar" e "Ingresar al POS" con estados de carga reactivos.

---

## [1.2.0] - 2026-07-20

### Añadido
- **Soporte Nativo Android con Capacitor (Google Play Store)**: Configuración completa del directorio `/android` y `capacitor.config.ts` con ID de paquete `com.max24app.pos`.
- **Modo Oscuro Adaptativo (Dark Mode)**: Switcher global de interfaz para entornos de poca luz en comercios nocturnos.
- **Calculador de Ganancia Real y Costos Fijos**: Módulo en `/src/components/Settings.tsx` y `/src/components/Reports.tsx` para deducir costos fijos operacionales (alquiler, luz, internet) del margen bruto.
- **Asistente de Accesibilidad Narrador (TalkBack / Hipoacúsicos)**: Motor nativo de sintesis de voz e interfaz de subtítulos flotantes en `/src/components/AccessibilityAssistant.tsx`.

### Corregido
- **Error AAPT PNG Corrupto en Compilación Android Studio**: Solución definitiva sustituyendo el icono comprimido no estándar por un vector SVG limpio en recursos Android.
- **Submit Inadvertido al Escanear en Inventario**: Intercepción de la tecla `Enter` en campos de entrada (`<input>`) dentro de formularios modal de inventario.

---

## [1.1.0] - 2026-07-10

### Añadido
- **Integración de Servidor SMTP Hostinger**: Rutas `/api/send-email` en `server.ts` con soporte para casillas corporativas `@max24app.com` (`seguridad@`, `notificaciones@`, `soporte@`).
- **Autenticación de Doble Factor (2FA OTP)**: Generación e ingreso de códigos dinámicos de 6 dígitos con vigencia temporal de 2 minutos para administradores.
- **Importador de Catálogo CSV / JSON**: Detección de delimitadores (coma o punto y coma), mapeo de columnas y de-duplicación por SKU.

### Corregido
- **Eliminación Accidental de Datos Locales al Cerrar Sesión**: Guardián de carga `isLoadingData` que impide la sobrescritura de `localStorage` con listas vacías durante peticiones lentas de Firestore.
- **Conflicto Multi-Tenant en Login de Empleados**: Incorporación de ID / Código de Comercio obligatorio para aislar usuarios con idénticos nombres en diferentes tiendas.

---

## [1.0.0] - 2026-06-23

### Añadido
- **Lanzamiento Inicial MAX24 POS**: Plataforma ágil de gestión de punto de venta, inventarios, facturación, cuentas corrientes y reportes en tiempo real.
- **Directorio de Registro DNDA Argentina**: Trámite completado bajo el legajo de software e impuestos FNA.
