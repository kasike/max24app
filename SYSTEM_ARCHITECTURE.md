# ARQUITECTURA DEL SISTEMA Y CONEXIONES - MAX24APP

> **DOCUMENTO DE CONTROL DE ARQUITECTURA DE SOFTWARE E INTEGRACIÓN DE BASES DE DATOS**
> *Última actualización:* 2026-07-23  
> *Versión del Sistema:* 1.2.0-STABLE  
> *Entorno de Producción:* Google Cloud Run / Firebase Firestore / Hostinger SMTP / Mercado Pago IPN / AFIP ARCA

---

## 🏗️ 1. Mapeo General de la Arquitectura

```
                        +---------------------------------------+
                        |        CLIENTES / USUARIOS POS       |
                        | (Web App / PWA / Android Native App)  |
                        +-------------------+-------------------+
                                            |
                                  HTTPS (TLS 1.3 / CORS)
                                            |
                                            v
                        +---------------------------------------+
                        |     REVERSE PROXY & NODE.JS SERVER    |
                        |   Express + Vite (Port 3000 / SSL)   |
                        +---------+-------------------+---------+
                                  |                   |
            +---------------------+                   +---------------------+
            |                                                               |
            v                                                               v
+-----------------------+                                 +-----------------------+
|  FIREBASE FIRESTORE   |                                 |   SERVICIOS EXTERNOS  |
|  (NoSQL Cloud DB)     |                                 |   Y APIS PRODUCTIVAS  |
+-----------------------+                                 +-----------------------+
| - storeSettings       |                                 | - Hostinger SMTP      |
| - products            |                                 | - Mercado Pago IPN    |
| - sales / debts       |                                 | - AFIP ARCA SDK       |
| - storeOwners / SaaS  |                                 | - Google Gemini AI    |
| - mpTransactions      |                                 +-----------------------+
| - errorLogs           |
+-----------------------+
```

---

## 2. Estructura de la Base de Datos (Firestore Collections Schema)

La aplicación utiliza **Firebase Firestore** estructurada para entornos **Multi-Tenant Aislados**. Cada documento en las colecciones posee el atributo de aislamiento por correo de comercio (`storeEmail` o `ownerEmail`).

### Colecciones Principales:

1. **`storeSettings`** (Identificador: Documento con ID = Correo de la Tienda)
   - `storeName`: string
   - `address`, `phone`, `cuit`: string
   - `taxRate` (IVA %): number
   - `currency`: string (Ej: `"ARS ($)"`)
   - `fixedCosts`: Array de objetos `{ id: string, category: string, amount: number }`
   - `cajerosPermissions`: Map de roles y permisos configurables.

2. **`products`** (Identificador: Autogenerado en Firestore)
   - `storeEmail`: string (Llave de Aislamiento Tenant)
   - `name`, `category`, `barcode`, `sku`: string
   - `costPrice`, `salePrice`, `stock`, `minStock`: number

3. **`sales`** (Identificador: Autogenerado)
   - `storeEmail`: string
   - `date`: ISO Timestamp
   - `items`: Array de ítems vendidos
   - `total`: number
   - `paymentMethod`: `"efectivo" | "transferencia" | "tarjeta" | "cuenta_corriente"`
   - `cashierEmail`: string

4. **`debts`** (Cuentas Corrientes / Fiado)
   - `storeEmail`: string
   - `clientName`, `clientPhone`: string
   - `amount`: number
   - `status`: `"pendiente" | "pagado"`
   - `history`: Array de abonos con fecha y monto.

5. **`storeOwners`** (Gestión SaaS & Suscripciones)
   - `email`: string (ID del Documento)
   - `plan`: `"Gratuito" | "Básico" | "Profesional" | "Empresarial"`
   - `status`: `"Activo" | "Expirado" | "Cancelado"`
   - `createdAt`: ISO Timestamp (Utilizado para el control de vencimiento de 30 días del Trial).

6. **`mpTransactions`** (Historial de Pagos de Pasarela SaaS)
   - `id`: string (`MP-IPN-XXXXX`)
   - `resourceId`: string
   - `amountArs`: number
   - `payerEmail`: string
   - `status`: `"Aprobado" | "Pendiente" | "Rechazado"`
   - `raw`: Objeto con el payload completo enviado por el Webhook de Mercado Pago.

7. **`errorLogs` & `auditLogs`** (Monitoreo de Ciberseguridad & Sentry)
   - Registros automáticos de errores en cliente/servidor, fallos de firma `x-signature`, e intentos inusuales de acceso.

---

## 3. Cadenas de Conexión e Integración de Servidores (Sin credenciales expuestas)

### A. Servidor SMTP Hostinger (Cuentas Corporativas @max24app.com)
- **Host SMTP:** `smtp.hostinger.com`
- **Puerto Seguro:** `465` (SSL/TLS)
- **Cuentas de Correo:**
  - `seguridad@max24app.com`: Despacho de Códigos OTP 2FA y Alertas.
  - `notificaciones@max24app.com`: Comprobantes digitales y estados de cuenta corriente.
  - `soporte@max24app.com`: Asistencia técnica y tickets.
- **Variables de Entorno (`.env`):**
  ```env
  SMTP_HOST=smtp.hostinger.com
  SMTP_PORT=465
  SMTP_USER_SEGURIDAD=seguridad@max24app.com
  SMTP_PASS_SEGURIDAD=[ENCRYPTED_IN_ENV]
  ```

### B. Pasarela de Pagos Mercado Pago IPN & Webhook
- **Endpoint Webhook:** `POST /api/mercadopago/webhook`
- **Validación de Seguridad:** Firma HMAC-SHA256 procesada a través de la cabecera HTTP `x-signature`.
- **Claves:**
  ```env
  MP_ACCESS_TOKEN=[ENCRYPTED_IN_ENV]
  MP_CLIENT_SECRET=[ENCRYPTED_IN_ENV]
  MP_WEBHOOK_SECRET=[ENCRYPTED_IN_ENV]
  ```

### C. AFIP / ARCA SDK Argentina
- **Ambiente:** Homologación (Testing) / Producción
- **Facturación Electrónica:** Generación automática de Factura B / Comprobantes con CAE.

---

## 3. Arquitectura del Sistema de Autenticación (Portal Multi-Rol)

La autenticación en MAX24 (`src/components/Login.tsx`) está estructurada por **Portales de Acceso Dedicados** según el rol e intención del usuario:

```
                                  +---------------------------------------+
                                  |      PANTALLA DE ACCESO MAX24        |
                                  +-------------------+-------------------+
                                                      |
                    +---------------------------------+---------------------------------+
                    |                                 |                                 |
                    v                                 v                                 v
        +-----------------------+         +-----------------------+         +-----------------------+
        |   PORTAL COMPRADORES  |         |   PORTAL COMERCIO/POS |         |   PORTAL PROVEEDORES  |
        +-----------------------+         +-----------------------+         +-----------------------+
        | - Google SSO (Official)|         | - Dueño/Comercio      |         | - Catálogos Mayoristas|
        | - Facebook SSO        |         | - Empleado/Cajero (POS)|         | - Zonas/Radios entrega|
        | - Mapa Sin Registro   |         | - ID Tienda Obligatorio|         | - Pedidos B2B         |
        | - Historial de Compras|         | - Fichaje Reloj Shift |         +-----------------------+
        +-----------------------+         | - Demo Sandbox Seguro |
                                          +-----------------------+
                                                      |
                                                      v
                                        +---------------------------+
                                        |   CONSOLA MASTER (2FA)    |
                                        |   Ruta Privada SuperAdmin |
                                        +---------------------------+
```

1. **Aislamiento Multi-Tenant**: Los empleados/cajeros requieren el `ID Único de Tienda` o Código de Comercio para asociar la sesión a su tenant correspondiente.
2. **Eliminación de Vulnerabilidad de Texto Plano**: Se removió el bloque estático de credenciales visibles. El acceso a demostración se realiza mediante tokens dinámicos en segundo plano (**⚡ Probar Demo Sandbox**).
3. **Control de Asistencia (Reloj Checador)**: Fichaje de turno de trabajo mediante la propiedad `clockInShift` activa al iniciar sesión en el POS.
4. **Protección Consola Master**: El acceso SuperAdmin (`pezziniarg@gmail.com`) está aislado en el pie de página y requiere verificación OTP de 2 Factores enviada por SMTP desde `seguridad@max24app.com`.

---

## 4. Integraciones con Servicios Externos

1. **Cabeceras de Seguridad (Security Headers):**
   - `X-Content-Type-Options: nosniff`
   - `X-Frame-Options: SAMEORIGIN`
   - `X-XSS-Protection: 1; mode=block`
   - `Strict-Transport-Security: max-age=31536000`
   - `Permissions-Policy: camera=(self)`

2. **Protección contra Fuerza Bruta (Rate Limiter):**
   - Límite automático de 180 peticiones por minuto por IP para prevenir ataques de denegación de servicio (DDoS) y escaneos automáticos.

3. **Encriptación de Secretos en Repositorio (AES-256-GCM):**
   - Los Tokens sensibles de Mercado Pago en Firestore se almacenan encriptados en reposo (`/src/server/crypto.ts`), requiriendo verificación PIN 2FA por parte del Master Administrador para ser revelados.

---

## 5. Flujo Git / GitHub & Despliegue CI/CD

```
  [Local Workstation] -- (git push) --> [GitHub Repo (main)]
                                                |
                                                v
                                    [Automated Tests / Lint]
                                                |
                                                v
                                  [Cloud Run / Capacitor Android]
```

- **Rama Principal:** `main`
- **Generación Nativa Android:** Sincronizado mediante Ionic Capacitor en directorio `/android`.
- **Regla de Oro:** Todo cambio en la estructura de la base de datos o APIs debe actualizar este archivo (`SYSTEM_ARCHITECTURE.md`), `CHANGELOG.md` y `ERROR_LOG_SOLUTIONS.md` antes de dar la tarea por finalizada.
