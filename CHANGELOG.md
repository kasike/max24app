# CHANGELOG - MAX24APP

Todas las modificaciones notables, nuevas características, parches de seguridad y correcciones de errores en este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased] - 2026-07-23

### Añadido
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
