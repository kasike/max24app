# CHANGELOG - MAX24APP

Todas las modificaciones notables, nuevas características, parches de seguridad y correcciones de errores en este proyecto serán documentadas en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/es-ES/1.0.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

---

## [Unreleased] - 2026-07-23

### Añadido
- **Implementación de Cabeceras de Seguridad y Rate Limiting en Servidor Express**: Adición de middleware de seguridad estilo Helmet (`X-Content-Type-Options`, `X-Frame-Options`, `X-XSS-Protection`, `Strict-Transport-Security`, `Permissions-Policy`) y limitador de velocidad por IP (180 req/min) en `/server.ts`.
- **Integración de Endpoint de Monitoreo de Errores Sentry/Shelter (`/api/log-error`)**: Recepción automática de trazas de errores de cliente y servidor persistidas en la colección `errorLogs` de Firestore.
- **Creación de Archivos de Memoria Persistente de Arquitectura**: `SYSTEM_ARCHITECTURE.md`, `CHANGELOG.md` y `ERROR_LOG_SOLUTIONS.md` en la raíz del repositorio.
- **Validación de Firma IPN Mercado Pago (`x-signature`)**: Verificación de seguridad mediante HMAC-SHA256 para eventos entrantes del Webhook de pasarela.
- **Vista Previa de Comprobante Fiscal AFIP / ARCA (Factura B)**: Generación e impresión de comprobantes con formato oficial, CAE y desglose de IVA en el panel de SuperAdmin.

### Cambiado
- **Reforzamiento de Seguridad en Credenciales Mercado Pago**: Encriptado AES-256 en pantalla con enmascarado `••••••••` y verificación obligatoria mediante PIN de 2 Factores (2FA).

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
