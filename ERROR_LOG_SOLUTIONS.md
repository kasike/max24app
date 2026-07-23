# REGISTRO DE ERRORES Y SOLUCIONES (ERROR LOG & SOLUTIONS) - MAX24APP

> **HISTORIAL CENTRAL DE FALLOS, BUGS, CAUSAS RAÍZ Y SOLUCIONES APLICADAS**
> *Uso exclusivo para Asistentes de IA y Equipo de Desarrollo.*  
> *REGLA OBLIGATORIA:* Antes de modificar código relacionado con autenticación, bases de datos o compilación nativa, consulte este archivo para prevenir regresiones.

---

## 📋 Índice de Errores Registrados

| ID Error | Categoría | Resumen del Error | Estado |
|---|---|---|---|
| **ERR-01** | Trámites DNDA | Campo "Tasa" vacío en formulario TAD | Solucionado |
| **ERR-02** | Trámites DNDA | Rechazo de adjuntos en comprobantes TAD | Solucionado |
| **ERR-03** | Portal Compradores | Duplicación de tiendas en directorio público | Solucionado |
| **ERR-04** | SuperAdmin | Intercambio residual de productos al simular tiendas | Solucionado |
| **ERR-05** | POS | Selección manual obligatoria tras escanear producto | Solucionado |
| **ERR-06** | Firestore / Persistence | Borrado accidental de datos locales al cerrar sesión | Solucionado |
| **ERR-07** | Auth Multi-Tenant | Colisión de credenciales de empleados entre tiendas | Solucionado |
| **ERR-08** | Inventario | Envío prematuro del formulario al escanear código | Solucionado |
| **ERR-09** | Android Studio / AAPT | Fallo de compilación Gradle por archivo PNG corrupto | Solucionado |
| **ERR-10** | Mercado Pago IPN | Fallo de validación de firma `x-signature` en Webhook | Solucionado |
| **ERR-18** | Auth UI/UX & Security | Saturación de roles y credenciales en texto plano en Login | Solucionado |

---

## 🛠️ Detalle Técnico de Errores y Soluciones

### 🔴 Error 18: Saturación de Roles y Exposición de Credenciales en Texto Plano en Login
- **Fallo:** La pantalla de inicio de sesión mezclaba accesos para Compradores, Dueños, Empleados, Proveedores y SuperAdmin en una sola tarjeta saturada. Además, exhibía credenciales de prueba (`prueba / prueba`, `password123`) en texto plano visible en pantalla.
- **Causa Raíz:** Falta de segmentación por intención de usuario e inclusión de un bloque estático de desarrollo sin protección.
- **Solución Aplicada:**
  1. Rediseño completo en 3 portales dedicados (`Compradores`, `Comercio & POS`, `Proveedores B2B`) mediante pestañas superiores claras.
  2. Remoción total del bloque de texto plano. Reemplazado por botones de simulación segura de un solo clic (**⚡ Probar Demo Sandbox**) que autentican transparente sin expones contraseñas.
  3. Sustitución de etiquetas de texto por botones SSO con marcas oficiales (logos vectoriales SVG de Google y Facebook).
  4. Adición del botón **"🗺️ Explorar Mapa de Comercios (Sin Registro)"** con activación de geolocalización GPS.
  5. Módulo de fichaje de turno de trabajo (`⏱️ Reloj Checador`) con checkbox para registro de horario de cajeros al ingresar al POS.
  6. Reubicación del acceso SuperAdmin/Master a un disparador discreto en el pie de página con verificación 2FA para `pezziniarg@gmail.com`.

### 🔴 Error 01: Validación de Campo Vacío en Formulario TAD
- **Fallo:** El campo "Tasa" en el sistema Trámites a Distancia (TAD) de Argentina arrojaba el error *"No se permite vacío o espacios en blanco"*.
- **Causa Raíz:** El formulario requería la especificación explícita de la tasa del Fondo Nacional de las Artes (FNA), que al ser $0,00 por cálculo de porcentaje daba error de validación.
- **Solución Aplicada:** Se estableció el mínimo legal permitido de `$4.11` (utilizando punto como separador decimal).

---

### 🔴 Error 02: Rechazo de Adjuntos en TAD
- **Fallo:** Error de procesamiento al adjuntar comprobantes de pago unificados en formato de imagen.
- **Causa Raíz:** La plataforma DNDA exige separación estricta de documentos en formato PDF independiente.
- **Solución Aplicada:** Se separaron los adjuntos en dos archivos PDF independientes:
  1. Comprobante de pago del formulario DNDA/CESSI ($100).
  2. Comprobante de pago de la tasa FNA ($4.11).

---

### 🔴 Error 03: Duplicación de Tiendas en Portal de Compradores
- **Fallo:** Los clientes compradores veían el comercio `Big Max` duplicado en el directorio.
- **Causa Raíz:** Convivencia entre el registro mock de prueba (`bigmax24h7@gmail.com`) y el registro real de la tienda.
- **Solución Aplicada:** Se añadió una función de autolimpieza en `App.tsx` que elimina el registro residual mock cuando la tienda real inicializa su configuración.

---

### 🔴 Error 04: Carga e Intercambio Residual de Productos al Simular Tiendas
- **Fallo:** Al simular el ingreso a una tienda desde el panel de SuperAdmin, la lista de productos mostraba ítems de la tienda anterior o se borraba al cambiar.
- **Causa Raíz:** El hook `activeStoreEmail` no sincronizaba de manera reactiva el parámetro `simulatedStoreEmail`.
- **Solución Aplicada:** Se vinculó `simulatedStoreEmail` en los disparadores de carga de Firebase (`loadDataFromFirebase`), forzando una recarga limpia y aislada cada vez que se cambia de tienda simulada.

---

### 🔴 Error 05: Selección Manual Obligatoria tras Escanear Productos en POS
- **Fallo:** Tras escanear un código de barras en el POS, el cajero debía hacer clic manualmente sobre el producto filtrado para agregarlo al carrito.
- **Causa Raíz:** El campo de búsqueda `searchQuery` solo actuaba como filtro pasivo sobre la grilla.
- **Solución Aplicada:** Se implementó un disparador `useEffect` en `/src/components/POS.tsx` que evalúa la coincidencia exacta con el código de barras o SKU y agrega el ítem automáticamente al carrito sin intervención manual, limpiando la caja de texto al instante.

---

### 🔴 Error 06: Borrado Accidental de Datos Locales al Cerrar Sesión
- **Fallo:** Al cerrar sesión de un comercio real y volver a ingresar, los productos y ventas aparecían vacíos.
- **Causa Raíz:** La función `loadDataFromFirebase` asignaba arreglos vacíos `[]` a los estados antes de completar la llamada a la red. Esto disparaba los efectos de persistencia local (`localStorage.setItem`), sobrescribiendo la memoria del navegador.
- **Solución Aplicada:** Se incorporó la bandera guardiana `isLoadingData`. Mientras la bandera permanezca activa, se bloquea la escritura en `localStorage`. Si la llamada a la red falla, se ejecuta un fallback leyendo la última versión guardada en caché.

---

### 🔴 Error 07: Colisión de Credenciales de Empleados en Escenarios Multi-Tenant
- **Fallo:** Riesgo de que un empleado ingrese al comercio equivocado si posee el mismo usuario/clave que otro empleado en una tienda diferente.
- **Causa Raíz:** El login no requería la especificación del código o ID de la tienda.
- **Solución Aplicada:** Se añadió el campo "ID Único de Tienda o Código de Comercio" en `/src/components/Login.tsx` con validación asíncrona contra Firestore.

---

### 🔴 Error 08: Envío Prematuro del Formulario al Escanear Código de Barras en Inventario
- **Fallo:** Al escanear un producto dentro de la ventana de creación de productos, la modal se cerraba guardando datos incompletos.
- **Causa Raíz:** Los escáneres físicos simulan la presión de la tecla "Enter" al final de la lectura, lo que en un formulario HTML dispara por defecto el evento `onSubmit`.
- **Solución Aplicada:** Se interceptó el evento `onKeyDown` en el formulario modal (`Inventory.tsx`), ejecutando `e.preventDefault()` si la tecla es "Enter" y el foco está en un campo de texto `<input>`.

---

### 🔴 Error 09: Fallo de Compilación Gradle en Android Studio (AAPT PNG Corrupto)
- **Fallo:** Durante la compilación de la APK en Android Studio con Capacitor, el compilador de recursos AAPT arrojaba el error:  
  `AAPT: error: failed to read PNG signature (not a PNG / corrupt)`.
- **Causa Raíz:** La herramienta de generación de imágenes creó un archivo web con cabeceras binarias no estándar para los iconos de Android (`app_icon.png` / `mipmap`).
- **Solución Aplicada:** Se sustituyeron los recursos rasterizados problemáticos por vectores SVG puros formateados conforme a la especificación oficial de Android Studio.

---

### 🔴 Error 10: Fallo de Validación de Firma IPN en Mercado Pago Webhook
- **Fallo:** El Webhook de Mercado Pago rechazaba eventos con advertencia de seguridad en logs.
- **Causa Raíz:** Discordancia entre el cálculo del manifest `id;request-id;ts` y la clave secreta de la app.
- **Solución Aplicada:** Se implementó la verificación de firma HMAC-SHA256 en `/server.ts` procesando `x-signature` y deduciendo automáticamente el timestamp (`ts`) y v1 manifest.

---

## 🔒 Protocolo para Futuras Soluciones de Errores

1. **Investigar Causa Raíz:** No aplicar parches superficiales sin identificar el motivo técnico.
2. **Documentar Inmediatamente:** Agregar el fallo a este archivo (`ERROR_LOG_SOLUTIONS.md`) bajo el siguiente número correlativo (`ERR-11`, `ERR-12`, etc.).
3. **Actualizar CHANGELOG.md:** Registrar la corrección en la sección `[Fixed]` o `[Corregido]` de la versión correspondiente.
4. **Verificar Compilación:** Correr `compile_applet` o `npm run lint` para garantizar que la app construye sin advertencias.
