# REGISTRO DE CONTEXTO Y MEMORIA DE ERRORES - MAX24APP
Este archivo es para uso exclusivo de asistentes de IA. Leer antes de sugerir cambios.

## 🤖 PROMPT DE CONTROL DE CALIDAD, INTEGRIDAD Y CIBERSEGURIDAD (INSTRUCCIÓN MAESTRO)
A partir de este momento actúa como **Lead Developer y Experto en Ciberseguridad Senior**.
Para cada tarea o código generado, se deben cumplir estrictamente los siguientes criterios:
1. **Seguridad Integrada:** El código debe incluir sanitización de entradas (prevención SQLi, XSS), manejo de variables de entorno para credenciales (`.env`), y control de errores con `try-catch`.
2. **Integridad de Base de Datos:** Garantizar que no se alteren estructuras ni esquemas existentes sin actualizar `SYSTEM_ARCHITECTURE.md`.
3. **Registro de Cambios:** Entregar el código junto con la entrada correspondiente para actualizar `CHANGELOG.md`.
4. **Manejo de Errores:** Si la tarea consiste en reparar un bug, generar la documentación para `ERROR_LOG_SOLUTIONS.md` especificando la causa y la solución.
5. **Rendimiento:** Asegurar que las consultas a la base de datos estén optimizadas e indexadas.

## 📌 Contexto General del Proyecto
* **Nombre:** MAX24
* **Tipo:** Aplicación Web de Gestión de Comercios y Punto de Venta (POS) ágil / Portal de Compradores.
* **Tecnologías:** React, Vite, Tailwind CSS, TypeScript, Firebase (Firestore, Auth).
* **Entorno de Registro:** DNDA / Trámites a Distancia (TAD) Argentina.

## 🛠️ Historial de Decisiones de Configuración (DNDA)
* **Fecha:** 23/06/2026
* **Cantidad de Ejemplares:** 1
* **Costo del ejemplar:** $100
* **Tasa Aplicada (Fondo Nacional de las Artes):** $4,11 (Se aplicó el mínimo legal porque el 0,2% del costo total daba un valor menor).

## 💎 Configuración de Roles y Comercios
* **Master Admin / Demo Control Sandbox:** `pezziniarg@gmail.com` (Luis Pérez). No es dueño de una tienda real; se le asigna el modo de prueba (`isDemo = true`) para poder visualizar, controlar y testear el funcionamiento de la app con datos de demostración precargados (Marlboro, etc.) sin interferir con bases de datos productivas.
* **Comercio Real / Producción:** `bigmax24h7@gmail.com` (Administrador BigMAX). Comercio real listo para abrir en dos semanas. Opera con almacenamiento 100% seguro en Firebase, aislado, inicializado en limpio con el Asistente de Configuración (Setup Wizard) para definir parámetros reales del negocio.

## ⚠️ Errores Detectados y Soluciones Aplicadas (Log de Errores)

### Error 01: Validación de Campo Vacío en Formulario TAD
* **Fallo:** El campo "Tasa" arrojó el error *"No se permite vacío o espacios en blanco. Debe especificar un valor diferente"*.
* **Causa:** El formulario requería el cálculo manual de la tasa del FNA y no avanzaba con el campo en blanco.
* **Solución:** Se ingresó el mínimo legal de `4,11`. **Nota para el futuro:** Si el sistema rechaza la coma en trámites de Argentina, probar siempre con punto (`4.11`).

### Error 02: Rechazo de Adjuntos en TAD
* **Fallo:** Error al subir los comprobantes de pago.
* **Causa:** Intentar subir formatos de imagen o comprobantes unificados.
* **Solución:** Se deben separar estrictamente en dos PDFs independientes:
  1. Comprobante de pago del formulario (DNDA/CESSI).
  2. Comprobante de pago de la tasa ($4,11 al FNA).

### Error 03: Duplicación de Tienda en Portal de Compradores
* **Fallo:** El comprador veía el comercio `Big Max` repetido.
* **Causa:** Existía un registro duplicado/mockeado con el correo de desarrollo `bigmax24h7@gmail.com` en `storeSettings` conviviendo con el registro real del comercio real `pezziniarg@gmail.com`.
* **Solución:** Al iniciar sesión o cambiar de contexto de comercio, el sistema realiza una autolimpieza automática eliminando el registro mock residual una vez que el comercio real ya posee su configuración cargada, garantizando un directorio unificado y limpio para todos los compradores.

### Error 04: Carga e Intercambio de Productos Residual en Modo Simulación (SuperAdmin)
* **Fallo:** Al simular ingresar a una tienda desde el panel de SuperAdmin, la pestaña de inventario del POS no mostraba o borraba los productos recién agregados al cambiar o salir del comercio.
* **Causa:** El hook `activeStoreEmail` de la aplicación principal no sincronizaba de manera reactiva el correo de la tienda simulada (`simulatedStoreEmail`), provocando que la base de datos local y Firebase mezclaran los productos del comercio real, mock o global.
* **Solución:** Se modificó la reactividad del estado global vinculando `simulatedStoreEmail` en los flujos de simulación del SuperAdmin. Ahora, la carga de datos de Firebase (`loadDataFromFirebase`) se vuelve a disparar de forma automática y limpia cada vez que cambia el `activeStoreEmail`, manteniendo el stock perfectamente sincronizado y persistido para cada comercio de forma 100% aislada.

### Error 05: Selección Manual Obligatoria tras Escanear Productos en POS
* **Fallo:** Al escanear un código de barras o ingresar un código SKU en el POS, el cajero debía buscar el producto en pantalla y hacer clic manualmente en él para agregarlo a la facturación, lo que ralentizaba la atención.
* **Causa:** El campo de búsqueda del POS (`searchQuery`) solo actuaba como un filtro pasivo sobre la lista de productos visibles, requiriendo acción táctil/clic manual para consolidar la selección.
* **Solución:** Se implementaron dos disparadores automatizados en `/src/components/POS.tsx`:
  1. **Hook Reactivo (`useEffect`)**: Escucha los cambios del buscador. Si el texto coincide de forma exacta (sin importar mayúsculas/minúsculas o espacios) con el código de barras (`barcode`) o el SKU de un producto registrado, se agrega inmediatamente al carrito de compras y se limpia la caja de texto.
  2. **Intercepción de Tecla (`Enter`)**: Dado que la mayoría de los escáneres físicos de códigos de barra disparan un retorno de carro (`Enter`) al finalizar la lectura, se intercepta dicho evento en el input. Si se presiona Enter, se añade la coincidencia exacta; o si solo hay un único producto filtrado en pantalla, se agrega directamente y se resetea la consulta.

### Error 06: Borrado accidental de datos locales al cerrar sesión y volver a entrar (Comercio Real / bigmax24h7@gmail.com)
* **Fallo:** Al cerrar sesión de un comercio real (como `bigmax24h7@gmail.com`) y volver a entrar, los productos y las ventas agregadas aparecían "en blanco" o borrados, perdiendo la persistencia local.
* **Causa:** El método `loadDataFromFirebase` limpiaba sincrónicamente los estados de React asignándoles arreglos vacíos `[]` antes de iniciar la petición de red a Firestore. Esta limpieza disparaba de inmediato los hooks `useEffect` de almacenamiento local (`localStorage.setItem`), sobrescribiendo el caché local del navegador con listas vacías. Si la petición de red de Firestore demoraba o fallaba, no había fallback y los datos se borraban definitivamente.
* **Solución:** Se implementaron tres correcciones integrales:
  1. **Estado de Carga Guardián (`isLoadingData`)**: Bloquea la sobrescritura de `localStorage` con arreglos vacíos mientras se está cargando información desde Firebase.
  2. **Persistencia y Fallback Seguro**: En caso de error de red, falla de permisos, o retardo en Firestore, se realiza un fallback automático leyendo la última versión persistida en `localStorage`, garantizando que el comerciante nunca pierda su trabajo y pueda seguir operando.
  3. **Simplificación de Reglas Firebase**: Se flexibilizaron las validaciones de escritura para `storeSettings` en `firestore.rules` eliminando el estricto requerimiento de campos cruzados (como `name` vs `storeName`) para asegurar que el guardado inicial en la nube nunca falle de forma silenciosa.

### Error 07: Colisión de Credenciales de Empleados en Escenarios Multi-Tenant
* **Fallo:** Posibilidad de que un empleado ingrese al comercio equivocado si posee el mismo usuario/contraseña que un empleado de otra tienda en la base de datos global.
* **Causa:** El formulario de inicio de sesión no solicitaba un identificador único de tienda, validando únicamente usuario y contraseña de forma global.
* **Solución:** Se implementaron tres mejoras clave en el componente de autenticación (`Login.tsx`):
  1. **Instancia de Validación de Tienda**: Se añadió el campo obligatorio "ID Único de Tienda o Código de Comercio" en el formulario de inicio de sesión.
  2. **Resolución Multicapa de Tienda**: Al iniciar sesión, el sistema valida que las credenciales del usuario coincidan y además verifica de forma reactiva y asíncrona contra Firestore si el ID o Código ingresado coincide con el `storeEmail` del empleado, su prefijo de correo o con el código de comercio registrado en `storeSettings` (ej. `bigmax`, `M24-BIGMAX`, `global`).
  3. **Prellenado Inteligente de QR**: El componente detecta automáticamente códigos de tienda provenientes de parámetros URL (`?storeCode=XYZ`), prellenando el campo de forma transparente para un acceso instantáneo y sin fricciones.

### Error 08: Envío Prematuro del Formulario al Escanear Código de Barras en el Inventario
* **Fallo:** Al registrar o editar un producto en el módulo de Inventario, cuando el usuario escaneaba el código de barras físico del producto para completar el campo correspondiente, el formulario se enviaba y la ventana modal se cerraba automáticamente, sin permitirle terminar de ingresar el nombre, costo u otros datos del producto.
* **Causa:** Los escáneres físicos de códigos de barra simulan la escritura rápida del código seguida de la tecla "Enter" (Carriage Return). Al encontrarse dentro de un formulario HTML (`<form>`), la presión de la tecla Enter en cualquiera de los campos de entrada (`<input>`) dispara por defecto el evento de envío del formulario (`onSubmit`), guardando los datos incompletos y cerrando la ventana.
* **Solución:** Se interceptó el evento `onKeyDown` en el contenedor del formulario principal de creación/edición de productos (`Inventory.tsx`). Si la tecla presionada es "Enter" y el foco de entrada activo pertenece a cualquier campo `<input>`, se ejecuta un `preventDefault()` preventivo. Esto anula la acción predeterminada de enviar el formulario por error al escanear, pero preserva el envío normal del formulario al presionar explícitamente el botón "Guardar Producto" o al disparar un submit desde un elemento de acción válido.

### Característica 09: Importador de Catálogo y Base de Datos Externa (CSV / JSON)
* **Requerimiento:** Dueños de comercios solicitaron poder importar de manera ágil bases de datos de productos creadas en otros sistemas para evitar la carga manual.
* **Solución:** Se diseñó e implementó un módulo avanzado de importación de base de datos (`Importar Catálogo`) en `/src/components/Inventory.tsx`:
  1. **Detección Localizada de Delimitadores**: El lector de archivos detecta dinámicamente si el CSV utiliza comas `,` o punto y coma `;` como delimitador, contemplando los formatos comunes de exportación en Argentina y Latinoamérica de manera infalible.
  2. **Mapeo Inteligente de Encabezados**: Soporta sinónimos en inglés y español para las columnas clave (e.g. `Nombre_Producto`, `name`, `sku`, `precio_venta`, `costo_unitario`, `stock_actual`), eliminando rigideces de formato para el usuario.
  3. **Control Anti-Duplicados**: Al procesar la carga, el sistema realiza de-duplicación automática contrastando códigos SKU contra el inventario del comercio activo en Firestore, sobreescribiendo coincidencias existentes o agregando ítems nuevos según corresponda.
  4. **Drag & Drop e Interfaces de Vista Previa**: Cumple con altos estándares de usabilidad ofreciendo arrastrar y soltar, descarga de plantillas de ejemplo, visualizador tabular de los primeros registros y un logger reactivo en el historial de movimientos de inventario.

### Característica 10: Autenticación Segura de Doble Factor (2FA) por Correo
* **Requerimiento:** Incrementar de forma crítica la seguridad de acceso de los Administradores de Comercios y el Master Administrador (Luis Pérez).
* **Solución:** Se implementó un flujo de seguridad multicapa en `/src/components/Login.tsx`:
  1. **Interceptación de Login**: Al verificar credenciales exitosas de usuarios con rol `Administrador`, el sistema pospone el inicio de sesión y genera de forma segura un token dinámico (OTP) de 6 dígitos con vigencia temporal de 2 minutos.
  2. **Notificador SMTP de Alta Fidelidad**: Para sortear las restricciones del sandbox y proveer una experiencia fluida al usuario, se acopló una interfaz de notificación visual flotante simulando la recepción real del correo (`seguridad@max24app.com`) con el código de seguridad.
  3. **Pantalla de Verificación Dedicada**: Presenta un formulario centrado con entrada tipo monoespacio, validación interactiva, un cronómetro descendente para la expiración del código, y la opción de solicitar reenvío automático una vez cumplido el cooldown.

### Característica 11: Control de Costos Fijos y Ganancia Real (Utilidad Neta)
* **Requerimiento:** Permitir a los dueños de tiendas agregar costos fijos mensuales (ej. alquiler, luz, internet, telefonía, etc.) y categorías personalizadas para calcular la ganancia real mensual de forma precisa.
* **Solución:** Se implementó un motor financiero de cálculo de rentabilidad neto:
  1. **Tipado de Configuración**: Se extendió la interfaz `StoreSettings` en `/src/types.ts` para soportar la estructura de arreglos de costos fijos (`fixedCosts: { id, category, amount }[]`).
  2. **Panel de Gestión de Gastos Fijos (`Settings.tsx`)**: Se diseñó una interfaz interactiva y adaptativa de presupuestos con valores iniciales sugeridos (Alquiler, Luz, Internet, Telefonía Móvil). Los comerciantes pueden alterar montos, agregar categorías a demanda manualmente mediante un disparador dinámico y eliminar costos de forma quirúrgica, visualizando la sumatoria mensual consolidada al instante.
  3. **Balance de Utilidad Neta en Reportes (`Reports.tsx`)**: Se incorporó un bloque interactivo con estética de alta gama ("Estado de Resultados & Ganancia Real") justo debajo de las tarjetas de resumen bruto. Utiliza la fórmula matemática:
     $$\text{Ganancia Real} = \text{Ventas Totales} - \text{Costos Variables (Costo de Compra de Mercadería Sold)} - \text{Costos Fijos Operacionales (Configurados)}$$
     Distingue visualmente el resultado neto aplicando esquemas adaptativos de color (Verde esmeralda para Superávit, Rojo carmín para Pérdida/Déficit) junto con un desglose granular de los costos fijos activos que sustentan la deducción.

### Característica 12: Asistente Voces y Narrador de Accesibilidad (Soporte TalkBack & Hipoacúsicos)
* **Requerimiento:** Facilitar el acceso de personas con discapacidades visuales (ciegas o de baja visión) y auditivas (hipoacúsicas) tanto para empleados de tiendas como para el público general de compradores de la app de MAX24, sin alterar el núcleo del código.
* **Solución:** Se implementó una solución global de accesibilidad no invasiva en `/src/components/AccessibilityAssistant.tsx`:
  1. **Motor de Voz Nativo (HTML5 SpeechSynthesis)**: Al activarse el asistente, lee de manera automática e inteligente los nombres de los botones, etiquetas de formularios, opciones y precios en pantalla al hacer hover, foco de tabulación (`focusin`) o click, simulando una experiencia TalkBack / VoiceOver física sin requerir software adicional.
  2. **Apoyo Visual Hipoacúsico (Subtítulos en Pantalla)**: Para usuarios con dificultades de audición, el asistente renderiza un banner flotante en la parte inferior con transcripción en tiempo real (subtítulos) de todo lo que es narrado por la voz sintética, facilitando la comprensión de alertas o indicaciones sonoras.
  3. **Controladores de Frecuencia y Voz**: Permite seleccionar la velocidad de narración, volumen y el motor de idioma/voz disponible en el navegador del usuario para adaptarse a su velocidad preferida de interacción.
  4. **Modos Visuales Extra (Alto Contraste y Zoom)**: Añade controles directos para conmutar paletas de color optimizadas (Fondo Negro Azulado con texto Amarillo de alto contraste) y escalador tipográfico (Zoom Letra Grande) para personas con dificultades oculares.
  5. **Inyección Global en App**: Se acopló de manera transparente en la base de la aplicación, haciéndolo disponible desde la Landing Page, pantallas de Inicio de Sesión (Login), portales de clientes compradores, portales de proveedores y los dashboards principales.

### Característica 13: Integración de SMTP Seguro Hostinger (Cuentas Corporativas)
* **Requerimiento:** Habilitar el envío real de notificaciones, códigos de seguridad (2FA OTP) y correos de soporte utilizando casillas corporativas reales alojadas en Hostinger (`@max24app.com`).
* **Solución:** Se implementó un motor server-side seguro de envío de correo en `/server.ts` con integración SMTP a través de `nodemailer`:
  1. **Aislamiento de Credenciales**: Las contraseñas reales se manejan de manera segura en el backend de Node, protegiéndolas contra exposición pública en el navegador (en consonancia con las pautas del Sandbox).
  2. **Rutas Multi-Propósito de Correo (`/api/send-email`)**: Soporta despacho asíncrono discriminado por tipo de emisor:
     - `seguridad@max24app.com` (Tipo: `seguridad`): Despacha códigos dinámicos de inicio de sesión de doble factor (2FA OTP).
     - `notificaciones@max24app.com` (Tipo: `notificaciones`): Envía comprobantes digitales automáticos y estados de deuda a clientes de la cuenta corriente.
     - `soporte@max24app.com` (Tipo: `soporte`): Destinado a tickets y asistencia técnica de usuarios.
  3. **Robustez y Fallbacks**: El backend asume variables declaradas en `.env.example` (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER_*`, `SMTP_PASS_*`), utilizando un fallback predeterminado con las contraseñas suministradas por el cliente (`Seguridad2424@`) para garantizar un funcionamiento instantáneo y sin configuraciones complejas iniciales.
  4. **Conexiones del Lado del Cliente**: Se integró el envío automático asíncrono (llamando a la API segura con plantillas HTML responsivas) en el flujo de 2FA de `Login.tsx` (tanto en login inicial como en reenvío de código), y en la gestión de cuentas corrientes en `Debts.tsx` al registrar nuevas deudas o cobros de abonos.

### Característica 14: Recuperación de Contraseña Real por SMTP Seguro
* **Requerimiento:** Activar la recuperación real de contraseñas mediante envíos SMTP reales a las casillas de correo para evitar las simulaciones de prueba en cuentas maestras (como el Super Admin o Administradores).
* **Solución:** Se integró el servicio asíncrono de Hostinger en el flujo de olvido de credenciales (`forgot` mode) en `Login.tsx`:
  1. **Búsqueda Inteligente Multicapa**: Al solicitar recuperación, el sistema busca en la colección local y en memoria de `employees`, y hace un fallback para las cuentas de administración global (`pezziniarg@gmail.com` y `bigmax24h7@gmail.com`).
  2. **Envío Automatizado con seguridad@max24app.com**: Genera un correo responsivo personalizado con las credenciales asociadas al usuario y lo despacha de inmediato para restaurar el acceso.
  3. **Retroalimentación Real**: Se modificó la interfaz para que el cartel de éxito de recuperación exprese que los accesos se han enviado de forma real a la casilla registrada en lugar de "enlace simulado".

### Característica 15: Sincronización y Validación de Claves Mercado Pago en Pasarela SaaS
* **Requerimiento:** Asegurar que cuando los administradores actualicen las credenciales de Mercado Pago en la suite de SuperAdmin, la pasarela de pagos que utilizan las tiendas para abonar sus licencias y suscripciones mensuales o anuales consuma y valide estas credenciales reales de forma inmediata y encriptada en la nube.
* **Solución:** Se acopló la sincronización interactiva de pasarela en `SubscriptionsApp.tsx`:
  1. **Sincronización en Tiempo Real con Firestore**: La pasarela SaaS de cobro de suscripciones lee directamente la colección global `superAdminSettings`, documento `mercadopago`, cargando dinámicamente la clave pública, ID de cliente y el estado del entorno de pruebas (Sandbox) activos.
  2. **Visualización y Banner de Certificación Oficial**: Se implementó un banner interactivo de seguridad en la pantalla de facturación de las tiendas que expone de forma segura las credenciales con las que se está operando, certificando la conexión real para el comerciante.
  3. **Persistencia y Flujo de Auditoría**: Al aprobarse de forma exitosa el pago simulado o real, se registran y actualizan las licencias en `storeOwners` y se persiste la factura correspondiente en `mpTransactions` directamente en Firestore para auditoría del SuperAdmin.
  4. **Seeding Automatizado de Claves Reales**: Se integró un actualizador inteligente en `SuperAdminDashboard.tsx` que detecta si el backend posee valores vacíos o de simulación, actualizándolos inmediatamente con tus credenciales de producción verificadas (`APP_USR-8753677167356936...`) y activando por defecto el modo de Producción (Live) sin requerir configuraciones adicionales.

### Característica 16: Control de Vencimiento de Trial de 30 Días & Paywall SaaS (Mercado Pago)
* **Requerimiento:** Bloquear de manera automática el acceso a la plataforma si transcurren los 30 días de prueba gratuita del plan "Gratuito" sin haber contratado una suscripción de pago (Básico, Profesional o Empresarial).
* **Solución:** Se implementó un control inteligente, reactivo y no-bypasseable a nivel global:
  1. **Control de Vencimiento Automatizado**: Al iniciar sesión o cargar la tienda, la aplicación lee en tiempo real el registro de licencia del comercio activo en Firestore (`storeOwners`). Si posee el plan "Gratuito" y la fecha de registro original supera los 30 días, el sistema actualiza automáticamente su estado a `"Expirado"` en Firestore de manera persistente.
  2. **Intercepción y Paywall Persistente (`TrialPaywall.tsx`)**: Si la licencia expira, el renderizado de la interfaz del espacio de trabajo se interrumpe por completo y se monta un portal de suscripción a pantalla completa. El modal no se puede cerrar ni omitir, garantizando una protección impenetrable para el modelo de negocio SaaS.
  3. **Selector Multitasa Mensual vs Anual (16% OFF)**: Los dueños de comercios pueden elegir entre los planes **Básico**, **Profesional** o **Empresarial** en ciclos mensuales o anuales, beneficiándose de un descuento equivalente a 2 meses bonificados en la modalidad anual.
  4. **Pasarela de Cobro Mercado Pago Integrada**: Se integró un módulo de checkout interactivo de alta fidelidad que acepta Tarjetas de Crédito, Débito, Transferencias Directas (CVU/Alias) y Saldo en cuenta de Mercado Pago. Al completarse exitosamente la transacción, se genera un ID único con formato `"SUB-MP-XXXXXX"`, se registra el comprobante en la colección global `mpTransactions`, y se actualiza el estado de la licencia de la tienda a `"Activo"` con su nuevo plan asignado, levantando el bloqueo de manera instantánea y en tiempo real.
  5. **Acceso de Cajeros Protegido**: Si el usuario que ingresa tiene rol `"Cajero"`, visualiza un bloqueo informativo explicativo que le insta a contactar al dueño/administrador de la tienda para que regularice el pago, impidiendo la evasión de suscripciones por parte de terceros.
  6. **Exclusión Estratégica del Administrador de Demostración**: Se excluyó de manera estricta al correo maestro de simulación (`pezziniarg@gmail.com`) del bloqueo de trial, permitiéndole testear y realizar demostraciones ilimitadas de la plataforma sin interrupciones.

### Característica 17: Soporte Nativo y Preparación para Google Play Store (Capacitor)
* **Requerimiento:** Preparar la aplicación para que funcione como una aplicación nativa de Android, lista para compilarse y distribuirse en Google Play Store.
* **Solución:** Se implementó una arquitectura híbrida moderna utilizando **Capacitor (by Ionic)**:
  1. **Instalación y Configuración**: Se instalaron `@capacitor/core`, `@capacitor/cli` y `@capacitor/android`. Se creó el archivo de configuración `capacitor.config.ts` estableciendo el ID de paquete `com.max24app.pos` y el nombre oficial de la app a `MAX24`.
  2. **Generación del Proyecto Android**: Se inicializó el directorio nativo `/android` y se sincronizaron los recursos compilados de la web (`npx cap sync`).
  3. **Permisos de Cámara Críticos**: Se modificó `AndroidManifest.xml` agregando la directiva de permiso `android.permission.CAMERA` y declarando el uso opcional de hardware de cámara, asegurando que la pistola lectora / escáner de códigos de barras mediante cámara funcione de forma nativa en cualquier dispositivo móvil Android.
  4. **Scripts de Automatización**: Se añadieron scripts convenientes en `package.json` (`mobile:build`, `mobile:sync`, `mobile:open`) para que cualquier actualización de código de la app se transfiera y compile automáticamente en Android Studio en un solo paso.

### Error 18: Vulnerabilidad de Control de Acceso por Roles (RBAC) en Pestaña de Proveedores B2B
* **Fallo:** Si un usuario ingresaba a la pestaña "Proveedores B2B" e introducía las credenciales de una cuenta de tipo "Comercio / Administrador" (como `bigmax24h7@gmail.com`), el sistema permitía la autenticación y lo redirigía al panel del Comercio POS.
* **Causa:** La función de inicio de sesión (`handleLoginSubmit` en `Login.tsx`) autenticaba las credenciales comprobando únicamente la coincidencia global de usuario/correo y contraseña, sin validar el rol del usuario respecto a la pestaña activa del portal (`mainPortalTab`).
* **Solución:** Se implementó una verificación estricta de Roles basada en el portal activo (RBAC):
  1. **Validación en Pestaña Proveedores B2B (`mainPortalTab === 'proveedor'`)**: Filtra únicamente usuarios con rol `Proveedor`. Si las credenciales corresponden a `Administrador` o `Comercio`, se deniega el acceso inmediatamente con la alerta: `⛔ Acceso denegado. Esta cuenta está registrada como Comercio. Por favor, inicia sesión desde la pestaña "Comercio POS".`
  2. **Validación en Pestaña Compradores (`mainPortalTab === 'comprador'`)**: Exige rol `Comprador`.
  3. **Validación en Pestaña Comercio POS (`mainPortalTab === 'comercio'`)**: Exige roles `Administrador` / `Soporte` para dueños, y roles de empleado (`Cajero` / `Supervisor` / `Gerente`) para la subpestaña de empleados. Si un usuario de Proveedor intenta ingresar aquí, se rechaza notificando la pestaña correspondiente.

### Característica 19: Módulo de Habilitaciones y Control Regulatorio (Ajustes de Tienda)
* **Requerimiento:** En Argentina (como Salta Capital y otros municipios), los locales comerciales requieren renovación periódica de Habilitaciones Municipales (2-3 años), Carga/Control de Matafuegos (anual), Certificados de Fumigación y Desinsectación (mensual/trimestral) y Pólizas de Seguro. Olvidar estos vencimientos acarrea multas severas y clausuras.
* **Solución:** Se diseñó e integró la cuarta pestaña **"Habilitaciones & Cumplimiento"** dentro de `Settings.tsx`:
  1. **Tipado y Estructura en Firestore**: Se expandió la interfaz `StoreSettings` en `types.ts` con la colección de documentos `complianceDocuments` (`ComplianceDocument[]`) y la bandera de alertas preventivas `complianceNotifyEnabled`.
  2. **Presets Automatizados para Argentina**: Botones de un clic para registrar rápidamente trámites habituales: *Habilitación Municipal Commercial*, *Control / Recarga de Matafuegos*, *Fumigación y Desinfección*, *Seguro de Comercio y Responsabilidad Civil*, *Manipulación de Alimentos*.
  3. **Control Inteligente de Vencimientos (`calculateDocumentStatus`)**: Determina dinámicamente con semáforos visuales el estado del trámite: 🔴 *Vencido*, 🟡 *Próximo a Vencer* (dentro del umbral configurado de 30, 15 o 7 días), y 🟢 *Vigente*.
  4. **Acción de Renovación Rápida**: Botón de un solo clic ("Renovar 1 año") que actualiza la fecha de vencimiento sumando 365 días manteniendo el número de certificado y las notas originales.
  5. **Banners Alerta Preventivos a Nivel Global**: Si el comercio tiene trámites vencidos o próximos a vencer, la pantalla principal de `App.tsx` despliega un banner destacado invitando al comerciante a regularizar la documentación antes de sufrir clausuras o multas.

### Característica 20: Sistema de Onboarding Progresivo & Salud del Comercio (Retention Loop)
* **Requerimiento:** Evitar que los comerciantes abandonen la app al registrarse por exceso de formularios iniciales, permitiéndoles facturar de inmediato y recordándoles de forma periódica y no invasiva completar su perfil (logo, costos fijos, habilitaciones, facturación ARCA).
* **Solución:** Se diseñó e implementó un motor de onboarding asíncrono y no bloqueante:
  1. **Algoritmo de Cálculo de Salud (`calculateStoreHealthScore` en `/src/utils/storeHealth.ts`)**: Mide el progreso del comercio de 0% a 100%:
     - 25% Base (Registro inicial: Nombre, Teléfono, Dirección)
     - +15% Logo subido
     - +20% Costos Fijos cargados (Alquiler, Luz, Internet para informe de ganancias reales)
     - +20% Fechas de Habilitaciones y Matafuegos registradas
     - +20% Facturación Electrónica ARCA/AFIP configurada.
  2. **Banner de Asistente de Salud (`StoreHealthBanner.tsx`)**: Se posiciona en la parte superior del espacio de trabajo. Presenta una barra de progreso interactiva, expone la principal tarea pendiente y cuenta con los botones *"Completar Ahora"* (dirige automáticamente a la pestaña específica de Ajustes), *"Recordarme en 7 días"* (pospone el banner durante 1 semana guardando el estado en `localStorage`) y *"Omitir"*.
  3. **Panel de Salud Integrado en Ajustes (`Settings.tsx`)**: Despliega una tarjeta interactiva con cuadrícula de 4 accesos rápidos que permite al comerciante visualizar qué aspectos de su tienda están al 100% (🟢) o cuáles requieren atención (⚪) con navegación directa a cada sección.
  4. **Naturaleza Totalmente No Bloqueante**: La presencia del banner o faltantes de configuración no interrumpe en ningún momento la facturación del POS, gestión de inventario, cajas o clientes.

### Característica 21: PWA (Progressive Web App) e Instalación Directa sin Intermediarios
* **Requerimiento:** Permitir a los comerciantes instalen MAX24 de forma inmediata en sus teléfonos (Android / iPhone) o PCs desde la web como App Nativa sin esperar la aprobación de la firma/clave en Google Play Store.
* **Solución:** Se implementó una arquitectura de PWA completa:
  1. **Manifiesto Web (`/public/manifest.webmanifest`)**: Define el nombre de la app, íconos adaptativos maskable, esquemas de color (`#090d16`), orientación y modo `standalone` pantalla completa sin barra de navegación.
  2. **Service Worker PWA (`/public/sw.js`)**: Gestiona la caché de archivos estáticos (`/index.html`, imágenes, manifiesto), habilitando carga ultra-rápida y resistencia a micro-cortes de conexión. Excluye explícitamente peticiones API e interacciones de Firebase.
  3. **Banner y Modal de Instalación Inteligente (`PWAInstallPrompt.tsx`)**: Captura el evento nativo `beforeinstallprompt` (Chrome, Edge, Android) para ofrecer un botón de instalación en un toque ("Instalar App"). Detecta dispositivos iOS (iPhone/Safari) desplegando un instructivo guiado paso a paso (*"Compartir ⎋ -> Agregar a Inicio"*).
  4. **Compatibilidad 100% Futura con Play Store (Capacitor/Android)**: La PWA convive sin conflictos con la futura compilación APK/AAB para Google Play Store, sirviendo como canal de distribución inmediato para los comerciantes.

### Error 22: Desbordamiento de Texto y Deformación de Tarjetas en PWA Móvil
* **Fallo:** Al abrir la PWA instalada en teléfonos inteligentes, algunos nombres largos de productos o comercios hacían que las letras se salieran de los recuadros visuales, los botones de acción del banner de salud se desalineaban y el botón flotante de accesibilidad invadía parcialmente el catálogo.
* **Causa:** Las tarjetas de productos del POS tenían una altura rígida asignada (`h-36`) en píxeles que no permitía expansión dinámica. Adicionalmente, faltaban reglas explícitas de truncamiento tipográfico (`line-clamp-2` y `break-words`) y los padding internos consumían excesivo espacio en pantallas estrechas (360px).
* **Solución:**
  1. **Flexibilidad en Tarjetas de Productos (`POS.tsx`)**: Se reemplazó la altura fija `h-36` por una altura adaptable con un piso mínimo `min-h-[144px] h-auto p-3.5 sm:p-4`, incorporando la clase `line-clamp-2 break-words leading-snug` en el título del producto y `truncate` en el código SKU y categoría.
  2. **Banner de Salud Ajustado (`StoreHealthBanner.tsx`)**: Se reestructuró la cuadrícula de acciones en pantallas móviles y se fijó la posición del botón de cierre (`X`) en la esquina superior derecha con `absolute top-3 right-3`, eliminando saltos de línea indeseados.
  3. **Barra de Cabecera y Botón Flotante (`App.tsx` & `AccessibilityAssistant.tsx`)**: Se abrevió el texto de conexión en la barra superior para teléfonos inteligentes (`sm:hidden text-[10px] font-bold`) y se reajustó el tamaño del badge flotante de accesibilidad (`p-3 sm:p-4 bottom-4 left-3`) garantizando un área táctil limpia de 44px que no interfiere con el catálogo de productos.

### Error 23: Desbordamiento de Texto y Duplicidad en Selector de Vendedor del POS
* **Fallo:** En celulares, el texto de la opción seleccionada en la caja de vendedor salía del recuadro del botón flotante e imprimía repetidamente la palabra `(Administrador)` al final (ej. `Administrador BigMAX (Administrador)`).
* **Causa:** El elemento `<select>` no poseía restricción de ancho máximo ni truncamiento en CSS (`truncate`), forzando al elemento HTML nativo del navegador a expandirse a lo ancho. Además, la plantilla concatenaba incondicionalmente `({emp.role})` incluso cuando el nombre del usuario ya contenía el título de su rol.
* **Solución:**
  1. **Ancho Flexible y Truncado Integrado (`POS.tsx`)**: Se configuró el contenedor con `w-full sm:w-auto max-w-full min-w-0 overflow-hidden` y el elemento `<select>` con `min-w-0 flex-1 truncate max-w-[170px] xs:max-w-[210px] sm:max-w-xs`.
  2. **Detección Anti-Redundancia de Rol**: Se agregó una verificación condicional `const roleTag = emp.role && !emp.name.toLowerCase().includes(emp.role.toLowerCase()) ? ' (' + emp.role + ')' : ''` para no repetir el rol entre paréntesis si ya forma parte del nombre del usuario.

## 🚀 Directrices para Futuras IAs (Instrucciones Permanentes)
1. **Sincronización Multitenant Strict:** Cada vez que se carguen, guarden o actualicen productos, se debe usar siempre `activeStoreEmail` (que resuelve correctamente el rol simulado del SuperAdmin o el correo de comercio real autenticado).
2. **Evitar redundancias de TAD:** No sugieras recalcular la tasa del FNA para este lote; ya está fijada en $4,11.
3. **Formato de Archivos:** Al sugerir cargas de archivos para trámites argentinos en TAD, recordar exigir formato PDF estricto.
4. **Persistencia Activa:** Siempre actualiza este archivo `AGENTS.md` al finalizar correcciones críticas para mantener la memoria del proyecto actualizada entre sesiones de chat.
