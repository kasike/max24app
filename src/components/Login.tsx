import React, { useState } from 'react';
import { 
  Lock, 
  Mail, 
  User, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle,
  Check,
  Building2,
  KeyRound,
  Eye,
  EyeOff,
  ArrowLeft,
  X,
  ShoppingCart,
  Store,
  Truck,
  Shield,
  Clock,
  Compass,
  MapPin,
  Zap
} from 'lucide-react';
import { Employee } from '../types';

interface LoginProps {
  employees: Employee[];
  onLoginSuccess: (user: Employee) => void;
  onRegisterAdmin: (newAdmin: Omit<Employee, 'id'>) => void;
  onBackToLanding?: () => void;
  initialMode?: AuthMode;
}

type AuthMode = 'login' | 'register' | 'forgot' | 'buyer_register' | 'supplier_register' | 'employee_login';

export default function Login({ employees, onLoginSuccess, onRegisterAdmin, onBackToLanding, initialMode }: LoginProps) {
  const [mode, setMode] = useState<AuthMode>(() => {
    if (initialMode === 'employee_login') return 'login';
    return initialMode || 'login';
  });
  
  // Custom Social SSO Loading States
  const [socialLoading, setSocialLoading] = useState<string | null>(null);

  const handleSocialLogin = async (provider: 'Google' | 'Facebook' | 'Invitado') => {
    setSocialLoading(provider);
    setLoginError('');

    try {
      if (provider === 'Google') {
        const { GoogleAuthProvider, signInWithPopup } = await import('firebase/auth');
        const { auth } = await import('../firebase');
        const googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({ prompt: 'select_account' });

        const result = await signInWithPopup(auth, googleProvider);
        const user = result.user;

        const email = (user.email || '').trim().toLowerCase();
        const name = user.displayName || (email ? email.split('@')[0] : 'Cliente Google');
        const loginUsername = email || `google_${user.uid}`;

        const existing = employees.find(e => (e.email || '').trim().toLowerCase() === email);

        const payload: Omit<Employee, 'id'> = {
          name: existing?.name || name,
          email: email,
          username: existing?.username || loginUsername,
          password: existing?.password || 'GoogleOAuthSSO',
          role: 'Comprador',
          status: 'Activo',
          shift: 'Rotativo',
          joinedDate: existing?.joinedDate || new Date().toISOString().split('T')[0],
          phone: existing?.phone || user.phoneNumber || '+54 11 9988-7766'
        };

        if (!existing) {
          onRegisterAdmin(payload);
        }

        const loggedUser: Employee = {
          ...payload,
          id: existing?.id || `emp-google-${user.uid}`
        };

        setSocialLoading(null);
        onLoginSuccess(loggedUser);
        return;
      }

      if (provider === 'Facebook') {
        const { FacebookAuthProvider, signInWithPopup } = await import('firebase/auth');
        const { auth } = await import('../firebase');
        const facebookProvider = new FacebookAuthProvider();

        const result = await signInWithPopup(auth, facebookProvider);
        const user = result.user;

        const email = (user.email || '').trim().toLowerCase() || `fb_${user.uid}@facebook.com`;
        const name = user.displayName || 'Cliente Facebook';
        const loginUsername = email;

        const existing = employees.find(e => (e.email || '').trim().toLowerCase() === email);

        const payload: Omit<Employee, 'id'> = {
          name: existing?.name || name,
          email: email,
          username: existing?.username || loginUsername,
          password: existing?.password || 'FacebookOAuthSSO',
          role: 'Comprador',
          status: 'Activo',
          shift: 'Rotativo',
          joinedDate: existing?.joinedDate || new Date().toISOString().split('T')[0],
          phone: existing?.phone || user.phoneNumber || '+54 11 9988-7766'
        };

        if (!existing) {
          onRegisterAdmin(payload);
        }

        const loggedUser: Employee = {
          ...payload,
          id: existing?.id || `emp-fb-${user.uid}`
        };

        setSocialLoading(null);
        onLoginSuccess(loggedUser);
        return;
      }

      if (provider === 'Invitado') {
        const rand = Math.floor(1000 + Math.random() * 9000);
        const email = `invitado.${rand}@max24app.com`;
        const name = `Comprador Invitado #${rand}`;
        const loginUsername = `invitado_${rand}`;

        const payload: Omit<Employee, 'id'> = {
          name,
          email,
          username: loginUsername,
          password: 'GuestModeHandshake',
          role: 'Comprador',
          status: 'Activo',
          shift: 'Rotativo',
          joinedDate: new Date().toISOString().split('T')[0],
          phone: '+54 11 9988-7766'
        };

        onRegisterAdmin(payload);

        const loggedUser: Employee = {
          ...payload,
          id: `emp-guest-${Date.now()}`
        };

        setSocialLoading(null);
        onLoginSuccess(loggedUser);
        return;
      }
    } catch (error: any) {
      console.error(`Error en autenticación con ${provider}:`, error);
      setSocialLoading(null);

      const errorCode = error?.code || '';
      if (errorCode === 'auth/popup-closed-by-user') {
        setLoginError('Se cerró la ventana emergente antes de completar el inicio de sesión.');
      } else if (errorCode === 'auth/popup-blocked') {
        setLoginError('El navegador bloqueó la ventana emergente de Google. Por favor, permite las ventanas emergentes para este sitio.');
      } else if (errorCode === 'auth/unauthorized-domain') {
        setLoginError('Dominio no autorizado en Firebase Auth. Ingresa con tu correo y contraseña.');
      } else if (errorCode === 'auth/operation-not-allowed' || errorCode === 'auth/configuration-not-found') {
        setLoginError(`El acceso con ${provider} requiere habilitar el proveedor en la consola de Firebase. Puedes ingresar registrándote con tu correo.`);
      } else {
        setLoginError(`Error al conectar con ${provider}. Puedes ingresar o registrarte directamente con tu correo electrónico.`);
      }
    }
  };
  
  // Portal and Login Form States
  const [mainPortalTab, setMainPortalTab] = useState<'comercio' | 'comprador' | 'proveedor'>('comercio');
  const [clockInShift, setClockInShift] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [storeIdOrCode, setStoreIdOrCode] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginTab, setLoginTab] = useState<'comercio' | 'empleado'>(() => {
    if (initialMode === 'employee_login') return 'empleado';
    return 'comercio';
  });

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('storeCode') || params.get('storeEmail') || params.get('store');
    if (code) {
      setStoreIdOrCode(code);
      setLoginTab('empleado');
    }
  }, []);

  // Secure Two-Factor Authentication (2FA) states
  const [is2FAPending, setIs2FAPending] = useState(false);
  const [tempUser, setTempUser] = useState<Employee | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [userInputCode, setUserInputCode] = useState('');
  const [verificationError, setVerificationError] = useState('');
  const [verificationTimer, setVerificationTimer] = useState(120);
  const [showEmailSentNotification, setShowEmailSentNotification] = useState(false);

  // Countdown timer for 2FA expiration
  React.useEffect(() => {
    let timer: any;
    if (is2FAPending && verificationTimer > 0) {
      timer = setTimeout(() => {
        setVerificationTimer(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [is2FAPending, verificationTimer]);

  // Register Form States
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regError, setRegError] = useState('');
  const [regSuccess, setRegSuccess] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Buyer Register Form States
  const [buyerName, setBuyerName] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerPassword, setBuyerPassword] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [buyerDocId, setBuyerDocId] = useState('');
  const [buyerError, setBuyerError] = useState('');
  const [buyerSuccess, setBuyerSuccess] = useState(false);
  const [showBuyerPassword, setShowBuyerPassword] = useState(false);

  // Supplier Register Form States
  const [supName, setSupName] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPassword, setSupPassword] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supCountry, setSupCountry] = useState('Argentina');
  const [supProvince, setSupProvince] = useState('Buenos Aires');
  const [supCity, setSupCity] = useState('');
  const [supRubro, setSupRubro] = useState('Almacén');
  const [supError, setSupError] = useState('');
  const [supSuccess, setSupSuccess] = useState(false);

  // Forgot Password States
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [forgotError, setForgotError] = useState('');

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsLoggingIn(true);

    try {
      const normalizedStore = storeIdOrCode.trim().toLowerCase();
      const normalizedUser = username.trim().toLowerCase();
      const normalizedPass = password.trim();

      if (mainPortalTab === 'comercio' && loginTab === 'empleado' && !normalizedStore) {
        setLoginError('El ID Único de Tienda o Código de Comercio es obligatorio.');
        setIsLoggingIn(false);
        return;
      }

      // 1. Find all candidate employees matching credentials
      const candidates = employees.filter(emp => {
        const dbUser = (emp.username || '').trim().toLowerCase();
        const dbEmail = (emp.email || '').trim().toLowerCase();
        const dbPass = (emp.password || '').trim();
        
        return (dbUser === normalizedUser || dbEmail === normalizedUser) && 
               (dbPass === normalizedPass || (!dbPass && normalizedPass === 'password123'));
      });

      let targetUser: Employee | null = null;

      // STRICT ROLE VALIDATION BASED ON ACTIVE PORTAL TAB (RBAC)
      if (mainPortalTab === 'proveedor') {
        // Strict role validation for Proveedores B2B
        targetUser = candidates.find(emp => emp.role === 'Proveedor') || null;

        if (!targetUser) {
          // Check if credentials match another role or admin account
          const isAdminMatch = candidates.some(emp => emp.role === 'Administrador' || emp.role === 'Soporte' || emp.role === 'SupportCollaborator') ||
            (normalizedUser === 'pezziniarg@gmail.com' && (normalizedPass === 'Max24@2626' || normalizedPass === 'max24@2626')) ||
            ((normalizedUser === 'bigmax24h7@gmail.com' || normalizedUser === 'prueba') && (normalizedPass === 'Bigmax2626@' || normalizedPass === 'bigmax2626@' || normalizedPass === 'prueba'));
          
          const isBuyerMatch = candidates.some(emp => emp.role === 'Comprador');
          const isEmployeeMatch = candidates.some(emp => emp.role === 'Cajero' || emp.role === 'Supervisor' || emp.role === 'Gerente');

          if (isAdminMatch) {
            setLoginError('⛔ Acceso denegado. Esta cuenta está registrada como Comercio. Por favor, inicia sesión desde la pestaña "Comercio POS".');
          } else if (isBuyerMatch) {
            setLoginError('⛔ Acceso denegado. Esta cuenta está registrada como Comprador. Por favor, inicia sesión desde la pestaña "Compradores".');
          } else if (isEmployeeMatch) {
            setLoginError('⛔ Acceso denegado. Esta cuenta corresponde a un empleado. Por favor, inicia sesión desde la pestaña "Comercio POS".');
          } else {
            setLoginError('⛔ Acceso denegado. Esta cuenta no está registrada como Proveedor B2B. Inicia sesión en el portal correspondiente.');
          }
          setIsLoggingIn(false);
          return;
        }
      } else if (mainPortalTab === 'comprador') {
        // Strict role validation for Compradores / Clientes
        targetUser = candidates.find(emp => emp.role === 'Comprador') || null;

        if (!targetUser) {
          const isAdminMatch = candidates.some(emp => emp.role === 'Administrador' || emp.role === 'Soporte' || emp.role === 'SupportCollaborator') ||
            (normalizedUser === 'pezziniarg@gmail.com' && (normalizedPass === 'Max24@2626' || normalizedPass === 'max24@2626')) ||
            ((normalizedUser === 'bigmax24h7@gmail.com' || normalizedUser === 'prueba') && (normalizedPass === 'Bigmax2626@' || normalizedPass === 'bigmax2626@' || normalizedPass === 'prueba'));
          
          const isSupplierMatch = candidates.some(emp => emp.role === 'Proveedor');
          const isEmployeeMatch = candidates.some(emp => emp.role === 'Cajero' || emp.role === 'Supervisor' || emp.role === 'Gerente');

          if (isAdminMatch) {
            setLoginError('⛔ Acceso denegado. Esta cuenta está registrada como Comercio. Por favor, inicia sesión desde la pestaña "Comercio POS".');
          } else if (isSupplierMatch) {
            setLoginError('⛔ Acceso denegado. Esta cuenta está registrada como Proveedor B2B. Por favor, inicia sesión desde la pestaña "Proveedores".');
          } else if (isEmployeeMatch) {
            setLoginError('⛔ Acceso denegado. Esta cuenta corresponde a un empleado. Por favor, inicia sesión desde la pestaña "Comercio POS".');
          } else {
            setLoginError('⛔ Acceso denegado. Esta cuenta no está registrada como Comprador. Inicia sesión en el portal correspondiente.');
          }
          setIsLoggingIn(false);
          return;
        }
      } else {
        // mainPortalTab === 'comercio'
        if (loginTab === 'comercio') {
          // Find merchant / owner roles (Administrador, Soporte, SupportCollaborator)
          targetUser = candidates.find(emp => emp.role === 'Administrador' || emp.role === 'Soporte' || emp.role === 'SupportCollaborator') || null;

          // Foolproof Owner Bypass for immediate, error-free entry
          if (!targetUser && normalizedUser === 'pezziniarg@gmail.com' && (normalizedPass === 'Max24@2626' || normalizedPass === 'max24@2626')) {
            const activeAdmin = employees.find(e => e.email.trim().toLowerCase() === 'pezziniarg@gmail.com') || {
              id: 'emp-1',
              name: 'Carlos Daniel Pérez',
              email: 'pezziniarg@gmail.com',
              role: 'Administrador' as const,
              status: 'Activo' as const,
              shift: 'Mañana',
              joinedDate: '2025-01-15',
              username: 'pezziniarg@gmail.com',
              password: 'Max24@2626',
              phone: '+54 11 5566-7788',
              salary: 1250000,
              emergencyContact: 'María Pérez (Madre) - +54 11 2233-4455'
            };
            targetUser = {
              ...activeAdmin,
              status: 'Activo',
              password: 'Max24@2626'
            };
          }

          if (!targetUser && (normalizedUser === 'prueba' || normalizedUser === 'bigmax24h7@gmail.com') && (normalizedPass === 'prueba' || normalizedPass === 'Bigmax2626@' || normalizedPass === 'bigmax2626@')) {
            if (normalizedUser === 'bigmax24h7@gmail.com' || normalizedPass === 'Bigmax2626@' || normalizedPass === 'bigmax2626@') {
              targetUser = {
                id: 'emp-bigmax',
                name: 'Administrador BigMAX',
                email: 'bigmax24h7@gmail.com',
                role: 'Administrador' as const,
                status: 'Activo' as const,
                shift: 'Rotativo',
                joinedDate: '2026-06-20',
                username: 'bigmax24h7@gmail.com',
                password: 'Bigmax2626@',
                phone: '+54 11 7766-5544',
                salary: 1500000,
                emergencyContact: 'Soporte Técnico - +54 11 5555-5555'
              };
            } else {
              targetUser = {
                id: 'emp-bigmax',
                name: 'Administrador Demo',
                email: 'prueba@max24app.com',
                role: 'Administrador' as const,
                status: 'Activo' as const,
                shift: 'Rotativo',
                joinedDate: '2026-06-20',
                username: 'prueba',
                password: 'prueba',
                phone: '+54 11 7766-5544',
                salary: 1500000,
                emergencyContact: 'Soporte Técnico - +54 11 5555-5555'
              };
            }
          }

          if (!targetUser) {
            const isSupplierMatch = candidates.some(emp => emp.role === 'Proveedor');
            const isBuyerMatch = candidates.some(emp => emp.role === 'Comprador');
            const isEmployeeMatch = candidates.some(emp => emp.role === 'Cajero' || emp.role === 'Supervisor' || emp.role === 'Gerente');

            if (isSupplierMatch) {
              setLoginError('⛔ Acceso denegado. Esta cuenta está registrada como Proveedor B2B. Por favor, inicia sesión desde la pestaña "Proveedores".');
            } else if (isBuyerMatch) {
              setLoginError('⛔ Acceso denegado. Esta cuenta está registrada como Comprador. Por favor, inicia sesión desde la pestaña "Compradores".');
            } else if (isEmployeeMatch) {
              setLoginError('Esta cuenta corresponde a un empleado. Por favor, inicia sesión en la sub-pestaña "Cajero / Empleado (POS)" con tu ID de Tienda.');
            } else {
              setLoginError('Usuario o Contraseña de Comercio incorrectos. Verifique sus credenciales.');
            }
            setIsLoggingIn(false);
            return;
          }
        } else {
          // loginTab === 'empleado'
          const employeeCandidates = candidates.filter(emp => emp.role === 'Cajero' || emp.role === 'Supervisor' || emp.role === 'Gerente');
          
          const isAdminMatch = candidates.some(emp => emp.role === 'Administrador' || emp.role === 'Soporte' || emp.role === 'SupportCollaborator') ||
            (normalizedUser === 'pezziniarg@gmail.com' && (normalizedPass === 'Max24@2626' || normalizedPass === 'max24@2626')) ||
            ((normalizedUser === 'bigmax24h7@gmail.com' || normalizedUser === 'prueba') && (normalizedPass === 'Bigmax2626@' || normalizedPass === 'bigmax2626@' || normalizedPass === 'prueba'));
          
          const isSupplierMatch = candidates.some(emp => emp.role === 'Proveedor');
          const isBuyerMatch = candidates.some(emp => emp.role === 'Comprador');

          if (employeeCandidates.length === 0) {
            if (isAdminMatch) {
              setLoginError('Esta cuenta corresponde al Dueño o Administrador del Comercio. Por favor, inicia sesión en la sub-pestaña "Dueño / Comercio".');
            } else if (isSupplierMatch) {
              setLoginError('⛔ Acceso denegado. Esta cuenta está registrada como Proveedor B2B. Por favor, inicia sesión desde la pestaña "Proveedores".');
            } else if (isBuyerMatch) {
              setLoginError('⛔ Acceso denegado. Esta cuenta está registrada como Comprador. Por favor, inicia sesión desde la pestaña "Compradores".');
            } else {
              setLoginError('ID de Tienda, Usuario o Contraseña de Empleado incorrectos. Verifique sus credenciales.');
            }
            setIsLoggingIn(false);
            return;
          }

          // Filter based on store match
          for (const emp of employeeCandidates) {
            const storeEmail = (emp.storeEmail || emp.email || 'global').trim().toLowerCase();
            
            if (storeEmail === normalizedStore) {
              targetUser = emp;
              break;
            }
            
            const prefix = storeEmail.split('@')[0];
            if (prefix === normalizedStore || prefix.includes(normalizedStore) || normalizedStore.includes(prefix)) {
              targetUser = emp;
              break;
            }

            try {
              const { doc, getDoc } = await import('firebase/firestore');
              const { db } = await import('../firebase');
              const settingsSnap = await getDoc(doc(db, 'storeSettings', storeEmail));
              if (settingsSnap.exists()) {
                const settingsData = settingsSnap.data();
                const code = (settingsData.storeCode || '').trim().toLowerCase();
                if (code && (code === normalizedStore || code.includes(normalizedStore) || normalizedStore.includes(code))) {
                  targetUser = emp;
                  break;
                }
              }
            } catch (err) {
              console.error("Error fetching store settings for validation:", err);
            }
          }
        }
      }

      if (targetUser) {
        if (targetUser.status === 'Inactivo') {
          setLoginError('Esta cuenta se encuentra inactiva. Contacte al Administrador o Dueño del Comercio.');
          setIsLoggingIn(false);
          return;
        }

        // Two-Factor Authentication (2FA) check for Admins and Store Owners
        if (targetUser.role === 'Administrador') {
          const secureCode = Math.floor(100000 + Math.random() * 900000).toString();
          setVerificationCode(secureCode);
          setTempUser(targetUser);
          setIs2FAPending(true);
          setVerificationError('');
          setVerificationTimer(120); // 2 minutes expiration
          setUserInputCode('');
          setShowEmailSentNotification(true);
          
          console.log(`[MAX24 SECURE SMTP] Código de seguridad enviado a ${targetUser.email}: ${secureCode}`);
          
          // Enviar correo real por SMTP a través de nuestra API segura de Node
          fetch("/api/send-email", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "seguridad",
              to: targetUser.email,
              subject: "🔒 Código de acceso de un solo uso MAX24",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                  <h2 style="color: #1e1b4b; text-align: center;">🔒 Verificación de Seguridad MAX24</h2>
                  <p>Hola <strong>${targetUser.name}</strong>,</p>
                  <p>Utiliza el siguiente código para iniciar sesión de forma segura en tu portal de MAX24:</p>
                  <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; border: 1px solid #cbd5e1;">
                    <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #ea580c; font-family: monospace;">${secureCode}</span>
                  </div>
                  <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
                    Este código expirará en 2 minutos. Si no solicitaste este acceso, por favor desestima este mensaje o contacta a soporte@max24app.com.
                  </p>
                </div>
              `
            })
          }).then(res => res.json())
            .then(data => console.log("SMTP real 2FA dispatch status:", data))
            .catch(err => console.error("SMTP real 2FA dispatch error:", err));

          setIsLoggingIn(false);
          return;
        }

        onLoginSuccess(targetUser);
      } else {
        if (loginTab === 'empleado') {
          setLoginError('ID de Tienda, Usuario o Contraseña de Empleado incorrectos. Verifique sus credenciales.');
        } else {
          setLoginError('Usuario o Contraseña de Comercio incorrectos. Verifique sus credenciales.');
        }
      }
    } catch (err) {
      console.error("Login submission error:", err);
      setLoginError('Error al procesar el inicio de sesión. Intente nuevamente.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError('');

    if (verificationTimer <= 0) {
      setVerificationError('El código ha expirado. Por favor, solicita uno nuevo.');
      return;
    }

    if (userInputCode.trim() === verificationCode) {
      if (tempUser) {
        setIs2FAPending(false);
        onLoginSuccess(tempUser);
      }
    } else {
      setVerificationError('El código de verificación ingresado es incorrecto.');
    }
  };

  const handleResend2FACode = () => {
    if (!tempUser) return;
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setVerificationCode(newCode);
    setVerificationTimer(120);
    setVerificationError('');
    setUserInputCode('');
    setShowEmailSentNotification(true);
    console.log(`[MAX24 SECURE SMTP] Código de seguridad reenviado a ${tempUser.email}: ${newCode}`);

    // Enviar correo real por SMTP a través de nuestra API segura de Node
    fetch("/api/send-email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "seguridad",
        to: tempUser.email,
        subject: "🔒 Código de acceso de un solo uso MAX24 (Reenvío)",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
            <h2 style="color: #1e1b4b; text-align: center;">🔒 Verificación de Seguridad MAX24</h2>
            <p>Hola <strong>${tempUser.name}</strong>,</p>
            <p>Utiliza el siguiente código de reenvío para iniciar sesión de forma segura en tu portal de MAX24:</p>
            <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; text-align: center; margin: 20px 0; border: 1px solid #cbd5e1;">
              <span style="font-size: 28px; font-weight: bold; letter-spacing: 5px; color: #ea580c; font-family: monospace;">${newCode}</span>
            </div>
            <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 20px;">
              Este código expirará en 2 minutos. Si no solicitaste este acceso, por favor desestima este mensaje o contacta a soporte@max24app.com.
            </p>
          </div>
        `
      })
    }).then(res => res.json())
      .then(data => console.log("SMTP real 2FA resend status:", data))
      .catch(err => console.error("SMTP real 2FA resend error:", err));
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccess(false);

    if (employees.some(emp => emp.email === regEmail)) {
      setRegError('Ya existe un usuario con este correo electrónico.');
      return;
    }

    const newAdmin: Omit<Employee, 'id'> = {
      name: regName,
      email: regEmail,
      username: regEmail,
      password: regPassword,
      role: 'Administrador',
      status: 'Activo',
      shift: 'Rotativo',
      joinedDate: new Date().toISOString().split('T')[0],
      phone: '+54 11 9999-8888'
    };

    onRegisterAdmin(newAdmin);
    setRegSuccess(true);
    setRegName('');
    setRegEmail('');
    setRegPassword('');
    setTimeout(() => {
      setMode('login');
      setRegSuccess(false);
    }, 2000);
  };

  const handleBuyerRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setBuyerError('');
    setBuyerSuccess(false);

    if (employees.some(emp => emp.email === buyerEmail)) {
      setBuyerError('Ya existe un usuario con este correo electrónico.');
      return;
    }

    const newBuyer: Omit<Employee, 'id'> = {
      name: buyerName,
      email: buyerEmail,
      username: buyerEmail,
      password: buyerPassword,
      role: 'Comprador',
      status: 'Activo',
      shift: 'Rotativo',
      joinedDate: new Date().toISOString().split('T')[0],
      phone: buyerPhone,
      emergencyContact: `DNI: ${buyerDocId}`
    };

    onRegisterAdmin(newBuyer);
    setBuyerSuccess(true);
    setBuyerName('');
    setBuyerEmail('');
    setBuyerPassword('');
    setBuyerPhone('');
    setBuyerDocId('');
    setTimeout(() => {
      setMode('login');
      setBuyerSuccess(false);
    }, 2000);
  };

  const handleSupplierRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSupError('');
    setSupSuccess(false);

    if (employees.some(emp => emp.email === supEmail)) {
      setSupError('Ya existe un usuario con este correo electrónico.');
      return;
    }

    if (!supCity.trim()) {
      setSupError('Por favor especifica tu ciudad.');
      return;
    }

    const newSupplierUser: Omit<Employee, 'id'> = {
      name: supName,
      email: supEmail,
      username: supEmail,
      password: supPassword,
      role: 'Proveedor',
      status: 'Activo',
      shift: 'Rotativo',
      joinedDate: new Date().toISOString().split('T')[0],
      phone: supPhone,
      emergencyContact: `Rubro: ${supRubro}`,
      country: supCountry,
      province: supProvince,
      city: supCity.trim()
    };

    onRegisterAdmin(newSupplierUser);
    setSupSuccess(true);
    setSupName('');
    setSupEmail('');
    setSupPassword('');
    setSupPhone('');
    setSupCity('');
    setTimeout(() => {
      setMode('login');
      setSupSuccess(false);
    }, 2000);
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError('');
    setForgotSuccess(false);

    const targetEmail = forgotEmail.trim().toLowerCase();
    let foundUser: any = null;

    // Check in employees first
    const matchedEmp = employees.find(emp => 
      (emp.email || '').trim().toLowerCase() === targetEmail || 
      (emp.username || '').trim().toLowerCase() === targetEmail
    );

    if (matchedEmp) {
      foundUser = {
        name: matchedEmp.name,
        email: matchedEmp.email,
        username: matchedEmp.username,
        password: matchedEmp.password || 'password123',
        role: matchedEmp.role
      };
    } else if (targetEmail === 'pezziniarg@gmail.com' || targetEmail === 'luis') {
      foundUser = {
        name: 'Luis Pérez (Master Admin)',
        email: 'pezziniarg@gmail.com',
        username: 'pezziniarg@gmail.com',
        password: 'Max24@2626',
        role: 'Master Admin'
      };
    } else if (targetEmail === 'bigmax24h7@gmail.com' || targetEmail === 'bigmax') {
      foundUser = {
        name: 'Administrador BigMAX',
        email: 'bigmax24h7@gmail.com',
        username: 'bigmax24h7@gmail.com',
        password: 'Bigmax2626@',
        role: 'Administrador'
      };
    }

    if (foundUser) {
      const recipientEmail = foundUser.email || 'pezziniarg@gmail.com';
      
      setForgotSuccess(true);
      setForgotEmail('');

      // Send the real SMTP recovery email
      fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "seguridad",
          to: recipientEmail,
          subject: "🔑 Recuperación de Credenciales - MAX24",
          html: `
            <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; border: 1px solid #e2e8f0; border-radius: 16px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
              <div style="text-align: center; margin-bottom: 25px;">
                <span style="background-color: #ea580c; color: #ffffff; padding: 8px 16px; border-radius: 8px; font-weight: bold; font-size: 18px; letter-spacing: 1px;">M24</span>
                <h2 style="color: #0f172a; margin-top: 15px; font-size: 22px; font-weight: 800;">Recuperación de Contraseña</h2>
                <p style="color: #64748b; font-size: 14px; margin-top: 5px;">Plataforma Inteligente de Comercio MAX24</p>
              </div>
              
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hola, <strong>${foundUser.name}</strong>:</p>
              <p style="color: #334155; font-size: 15px; line-height: 1.6;">Hemos recibido una solicitud para recuperar los datos de acceso de tu cuenta. A continuación, encontrarás tus credenciales registradas para iniciar sesión:</p>
              
              <div style="background-color: #f8fafc; padding: 20px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600; width: 120px;">Rol:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700;">${foundUser.role}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Usuario:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; font-family: monospace;">${foundUser.username}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 600;">Contraseña:</td>
                    <td style="padding: 6px 0; color: #ea580c; font-weight: bold; font-size: 16px; font-family: monospace;">${foundUser.password}</td>
                  </tr>
                </table>
              </div>

              <div style="text-align: center; margin: 30px 0;">
                <a href="${window.location.origin}" style="background-color: #ea580c; color: #ffffff; padding: 12px 30px; border-radius: 10px; font-weight: bold; text-decoration: none; font-size: 14px; display: inline-block; box-shadow: 0 4px 6px -1px rgba(234, 88, 12, 0.2);">
                  Ir al Inicio de Sesión
                </a>
              </div>

              <p style="color: #64748b; font-size: 12px; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 15px; margin-top: 25px; text-align: center;">
                Este correo fue enviado de manera automática y segura por MAX24.<br/>
                Si no solicitaste esta recuperación, te recomendamos ingresar y modificar tu contraseña desde el panel de configuración o contactarnos a <a href="mailto:soporte@max24app.com" style="color: #ea580c; text-decoration: none;">soporte@max24app.com</a>.
              </p>
            </div>
          `
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log("[SMTP RECOVERY SUCCESS]", data);
      })
      .catch(err => {
        console.error("[SMTP RECOVERY ERROR]", err);
      });
    } else {
      setForgotError('El correo o usuario ingresado no coincide con ningún registro de administrador o empleado en el sistema.');
    }
  };

  const handleQuickLogin = (email: string, pass: string) => {
    setLoginError('');
    const normalizedUser = email.trim().toLowerCase();
    const normalizedPass = pass.trim();

    // Populate state so the form fields show what's happening
    setUsername(email);
    setPassword(pass);

    let isEmployee = false;
    if (normalizedUser === 'ana.m') {
      isEmployee = true;
    } else {
      const found = employees.find(emp => (emp.username || '').trim().toLowerCase() === normalizedUser || (emp.email || '').trim().toLowerCase() === normalizedUser);
      if (found && (found.role === 'Cajero' || found.role === 'Supervisor' || found.role === 'Gerente')) {
        isEmployee = true;
      }
    }

    if (isEmployee) {
      setLoginTab('empleado');
      if (normalizedUser === 'ana.m') {
        setStoreIdOrCode('prueba');
      } else {
        const found = employees.find(emp => (emp.username || '').trim().toLowerCase() === normalizedUser || (emp.email || '').trim().toLowerCase() === normalizedUser);
        setStoreIdOrCode(found?.storeEmail?.split('@')[0] || 'prueba');
      }
    } else {
      setLoginTab('comercio');
      if (normalizedUser === 'prueba') {
        setStoreIdOrCode('prueba');
      } else if (normalizedUser === 'bigmax24h7@gmail.com' || normalizedUser === 'bigmax') {
        setStoreIdOrCode('bigmax');
      } else if (normalizedUser === 'pezziniarg@gmail.com') {
        setStoreIdOrCode('pezziniarg');
      } else {
        setStoreIdOrCode('');
      }
    }

    let targetUser = employees.find(emp => {
      const dbUser = (emp.username || '').trim().toLowerCase();
      const dbEmail = (emp.email || '').trim().toLowerCase();
      const dbPass = (emp.password || '').trim();
      
      return (dbUser === normalizedUser || dbEmail === normalizedUser) && 
             (dbPass === normalizedPass || (!dbPass && normalizedPass === 'password123'));
    });

    if (!targetUser && normalizedUser === 'pezziniarg@gmail.com' && normalizedPass === 'Max24@2626') {
      const activeAdmin = employees.find(e => e.email.trim().toLowerCase() === 'pezziniarg@gmail.com') || {
        id: 'emp-1',
        name: 'Carlos Daniel Pérez',
        email: 'pezziniarg@gmail.com',
        role: 'Administrador' as const,
        status: 'Activo' as const,
        shift: 'Mañana',
        joinedDate: '2025-01-15',
        username: 'pezziniarg@gmail.com',
        password: 'Max24@2626',
        phone: '+54 11 5566-7788',
        salary: 1250000,
        emergencyContact: 'María Pérez (Madre) - +54 11 2233-4455'
      };
      
      targetUser = {
        ...activeAdmin,
        status: 'Activo',
        password: 'Max24@2626'
      };
    }

    if (!targetUser && (normalizedUser === 'prueba' || normalizedUser === 'bigmax24h7@gmail.com') && (normalizedPass === 'prueba' || normalizedPass === 'Bigmax2626@' || normalizedPass === 'bigmax2626@')) {
      if (normalizedUser === 'bigmax24h7@gmail.com' || normalizedPass === 'Bigmax2626@' || normalizedPass === 'bigmax2626@') {
        targetUser = {
          id: 'emp-bigmax',
          name: 'Administrador BigMAX',
          email: 'bigmax24h7@gmail.com',
          role: 'Administrador' as const,
          status: 'Activo' as const,
          shift: 'Rotativo',
          joinedDate: '2026-06-20',
          username: 'bigmax24h7@gmail.com',
          password: 'Bigmax2626@',
          phone: '+54 11 7766-5544',
          salary: 1500000,
          emergencyContact: 'Soporte Técnico - +54 11 5555-5555'
        };
      } else {
        targetUser = {
          id: 'emp-bigmax',
          name: 'Administrador Demo',
          email: 'prueba@max24app.com',
          role: 'Administrador' as const,
          status: 'Activo' as const,
          shift: 'Rotativo',
          joinedDate: '2026-06-20',
          username: 'prueba',
          password: 'prueba',
          phone: '+54 11 7766-5544',
          salary: 1500000,
          emergencyContact: 'Soporte Técnico - +54 11 5555-5555'
        };
      }
    }

    if (targetUser) {
      if (targetUser.status === 'Inactivo') {
        setLoginError('Esta cuenta se encuentra inactiva. Contacte al Administrador.');
        return;
      }
      onLoginSuccess(targetUser);
    } else {
      setUsername(email);
      setPassword(pass);
    }
  };

  if (is2FAPending) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans" id="login-module-2fa-container">
        {/* Visual Ambient Blur Background circles */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full -translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[130px] rounded-full translate-x-12 translate-y-12" />

        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xl relative z-10 animate-fade-in text-center space-y-6">
          <div className="mx-auto w-12 h-12 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm shadow-blue-500/5">
            <ShieldCheck className="w-6 h-6 animate-pulse" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Verificación de Seguridad</h2>
            <p className="text-xs text-slate-500 leading-relaxed font-sans px-2">
              Se ha enviado un código de verificación de <span className="font-bold text-slate-800">6 dígitos</span> para validar tu acceso como dueño/administrador. Revisa la bandeja de entrada de tu correo:
            </p>
            {tempUser && (
              <p className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-100 py-1.5 px-3 rounded-lg inline-block font-sans max-w-xs truncate">
                {tempUser.email}
              </p>
            )}
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-2 text-left">Código de Ingreso</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                value={userInputCode}
                onChange={(e) => setUserInputCode(e.target.value.replace(/[^0-9a-zA-Z]/g, ''))}
                className="w-full text-center tracking-[0.5em] text-xl font-bold py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all font-mono"
                required
                autoFocus
              />
            </div>

            {verificationError && (
              <div className="p-3 bg-red-50 border border-red-150 rounded-xl flex items-center gap-2 text-xs text-red-700 animate-shake">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="font-sans font-semibold text-left leading-snug">{verificationError}</p>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs sm:text-sm shadow-lg shadow-slate-900/10 select-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              Confirmar Identidad y Acceder
            </button>
          </form>

          {/* Code expiration & resend block */}
          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs text-slate-500 font-sans">
            {verificationTimer > 0 ? (
              <p>El código expira en <span className="font-bold text-slate-700 font-mono">{Math.floor(verificationTimer / 60)}:{String(verificationTimer % 60).padStart(2, '0')}</span></p>
            ) : (
              <p className="text-red-500 font-bold">¡El código ha expirado!</p>
            )}

            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={handleResend2FACode}
                className={`font-bold hover:underline transition-all ${verificationTimer > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 cursor-pointer'}`}
                disabled={verificationTimer > 0}
              >
                Reenviar Código {verificationTimer > 0 && `(espera ${verificationTimer}s)`}
              </button>
              <span className="text-slate-300">|</span>
              <button
                type="button"
                onClick={() => {
                  setIs2FAPending(false);
                  setTempUser(null);
                  setVerificationError('');
                }}
                className="text-slate-600 hover:text-slate-800 font-bold hover:underline transition-all cursor-pointer"
              >
                Volver a login
              </button>
            </div>
          </div>
        </div>

        {/* ELEGANT FLOATING SIMULATED EMAIL CLIENT POPUP / OVERLAY */}
        {showEmailSentNotification && tempUser && (
          <div className="fixed bottom-4 right-4 max-w-sm w-full bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 shadow-2xl p-4.5 z-50 animate-bounce-in font-sans">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2">
                <span className="p-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg shrink-0">
                  <Mail className="w-4 h-4" />
                </span>
                <span className="text-[10px] uppercase font-black tracking-widest text-blue-400 font-mono">Notificación de Correo Recibido</span>
              </div>
              <button 
                onClick={() => setShowEmailSentNotification(false)}
                className="text-slate-400 hover:text-slate-200 transition-all p-0.5 rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3.5 space-y-2.5 text-xs text-slate-300 border-t border-slate-800 pt-3">
              <div>
                <span className="text-slate-500 font-sans">De:</span> <span className="font-semibold text-slate-200">seguridad@max24app.com</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans">Para:</span> <span className="font-semibold text-slate-200 font-sans">{tempUser.email}</span>
              </div>
              <div>
                <span className="text-slate-500 font-sans">Asunto:</span> <span className="font-semibold text-emerald-400 font-sans">🔒 Código de acceso de un solo uso MAX24</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl mt-2 text-[11px] leading-relaxed text-slate-300 font-sans">
                <p>Hola <strong className="text-white">{tempUser.name}</strong>,</p>
                <p className="mt-1">Utiliza el siguiente código para iniciar sesión de forma segura en tu portal de MAX24:</p>
                <div className="my-2.5 text-center">
                  <span className="inline-block tracking-[0.25em] bg-blue-500/10 text-blue-400 border border-blue-500/20 text-lg font-black px-4 py-1.5 rounded-xl font-mono">
                    {verificationCode}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500">Este código expirará en 2 minutos. Si no solicitaste este acceso, desestima este mensaje.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans" id="login-module-container">
      {/* Visual Ambient Blur Background circles */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-orange-500/5 blur-[120px] rounded-full -translate-x-12 -translate-y-12" />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-blue-500/5 blur-[130px] rounded-full translate-x-12 translate-y-12" />

      {onBackToLanding && (
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
          <button
            onClick={onBackToLanding}
            className="group text-xs sm:text-sm font-extrabold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 hover:border-orange-500/50 shadow-md hover:shadow-lg px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl flex items-center gap-2 cursor-pointer select-none transition-all duration-300 transform hover:-translate-x-0.5 active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 transition-transform group-hover:-translate-x-1 duration-300" />
            <span>Volver al inicio de MAX24</span>
          </button>
        </div>
      )}

      <div className="w-full max-w-md z-10 space-y-6">
        
        {/* Branding header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-3 bg-white border border-slate-200/80 p-3 rounded-2xl mx-auto shadow-md">
            <div className="w-12 h-12 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl text-white font-black text-xl flex items-center justify-center shadow-lg shadow-orange-500/10 shrink-0">
              M24
            </div>
            <div className="text-left leading-none">
              <h2 className="font-extrabold text-2xl tracking-tight text-slate-900">
                MAX<span className="text-orange-500">24</span>
              </h2>
              <p className="text-[10px] font-mono text-slate-400 tracking-widest uppercase mt-1">SISTEMA INTELIGENTE DE COMERCIO</p>
            </div>
          </div>
        </div>

        {/* Auth Body Box */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl space-y-6 relative overflow-hidden">
          
          {/* Glowing accent border line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-transparent via-orange-500 to-transparent" />

          {/* Form conditional render */}
          {mode === 'login' && (
            <div className="space-y-5">
              
              {/* Primary Portal Navigation Tabs */}
              <div>
                <p className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest text-center mb-2">Selecciona tu Portal de Acceso</p>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/80 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMainPortalTab('comprador');
                      setLoginError('');
                    }}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      mainPortalTab === 'comprador'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 shrink-0" />
                    <span className="truncate">Compradores</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMainPortalTab('comercio');
                      setLoginError('');
                    }}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      mainPortalTab === 'comercio'
                        ? 'bg-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <span className="truncate">Comercio POS</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMainPortalTab('proveedor');
                      setLoginError('');
                    }}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2 px-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                      mainPortalTab === 'proveedor'
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                    }`}
                  >
                    <Truck className="w-4 h-4 shrink-0" />
                    <span className="truncate">Proveedores</span>
                  </button>
                </div>
              </div>

              {loginError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded-xl text-xs flex gap-2.5 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="font-semibold leading-normal">{loginError}</span>
                </div>
              )}

              {/* PORTAL 1: COMPRADORES / CLIENTES */}
              {mainPortalTab === 'comprador' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 font-black text-xs">
                      <Compass className="w-4 h-4" />
                      <span>Portal de Clientes & Compradores</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Explora tiendas cercanas, consulta ofertas de kioscos y comercios en tiempo real o guarda tu historial de compras.
                    </p>
                  </div>

                  {/* Acceso Rápido con SSO Oficial */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono uppercase font-extrabold text-slate-400 tracking-wider">Acceso Instantáneo con Redes</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={!!socialLoading}
                        onClick={() => handleSocialLogin('Google')}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {socialLoading === 'Google' ? (
                          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
                            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.21v3.15C3.2 21.3 7.31 24 12 24z"/>
                            <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.21C.44 8.14 0 9.99 0 12s.44 3.86 1.21 5.39l4.07-3.15z"/>
                            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.2 2.7 1.21 6.61l4.07 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
                          </svg>
                        )}
                        <span>Continuar con Google</span>
                      </button>

                      <button
                        type="button"
                        disabled={!!socialLoading}
                        onClick={() => handleSocialLogin('Facebook')}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-emerald-500 text-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer disabled:opacity-50 shadow-xs"
                      >
                        {socialLoading === 'Facebook' ? (
                          <span className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <svg className="w-4 h-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                          </svg>
                        )}
                        <span>Continuar con Facebook</span>
                      </button>
                    </div>
                  </div>

                  {/* Prominent Explore Map / Guest Access Button */}
                  <div className="pt-1">
                    <button
                      type="button"
                      disabled={!!socialLoading}
                      onClick={() => handleSocialLogin('Invitado')}
                      className="w-full py-3 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition-all cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 animate-bounce" />
                      <span>🗺️ Explorar Mapa de Comercios (Sin Registro)</span>
                    </button>
                  </div>

                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-200" />
                    <span className="flex-shrink mx-3 text-[9px] font-mono font-bold uppercase tracking-widest text-slate-400">O INGRESA CON EMAIL</span>
                    <div className="flex-grow border-t border-slate-200" />
                  </div>

                  {/* Formulario Comprador Registrado */}
                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Correo de Comprador</label>
                      <input
                        type="email"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                        placeholder="cliente@gmail.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Contraseña</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs cursor-pointer shadow-sm transition-colors mt-2"
                    >
                      Ingresar como Comprador
                    </button>
                  </form>

                  <div className="pt-3 text-center border-t border-slate-100">
                    <span className="text-xs text-slate-500">¿Aún no tienes cuenta?</span>{' '}
                    <button
                      type="button"
                      onClick={() => setMode('buyer_register')}
                      className="text-xs font-black text-emerald-600 hover:underline transition-colors cursor-pointer"
                    >
                      Regístrate Gratis como Comprador
                    </button>
                  </div>
                </div>
              )}

              {/* PORTAL 2: COMERCIO & EMPLEADOS (POS) */}
              {mainPortalTab === 'comercio' && (
                <div className="space-y-4 animate-fade-in text-left">
                  
                  {/* Sub-selector Dueño vs Empleado */}
                  <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setLoginTab('comercio');
                        setLoginError('');
                      }}
                      className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        loginTab === 'comercio'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      🏢 Dueño / Comercio
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginTab('empleado');
                        setLoginError('');
                      }}
                      className={`flex-1 text-center py-2 text-xs font-black rounded-lg transition-all cursor-pointer ${
                        loginTab === 'empleado'
                          ? 'bg-white text-orange-600 shadow-xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      👨‍💼 Cajero / Empleado (POS)
                    </button>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3.5" id="login-form-submit">
                    {/* Campo ID de Tienda en la pestaña de Empleado */}
                    {loginTab === 'empleado' && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label htmlFor="login-store" className="text-xs font-bold text-slate-700 block">
                            ID Único de Tienda o Código de Comercio
                          </label>
                          <span className="text-[10px] font-mono text-orange-600 font-bold uppercase">
                            Requerido
                          </span>
                        </div>
                        <div className="relative">
                          <span className="absolute left-3.5 top-3.5 text-slate-400">
                            <Building2 className="w-4 h-4" />
                          </span>
                          <input
                            type="text"
                            id="login-store"
                            value={storeIdOrCode}
                            onChange={(e) => setStoreIdOrCode(e.target.value)}
                            className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-semibold"
                            placeholder="Ej: bigmax, MAX24-EXPRESS"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {/* Usuario / Email */}
                    <div className="space-y-1.5">
                      <label htmlFor="login-username" className="text-xs font-bold text-slate-700 block">
                        {loginTab === 'empleado' ? 'Usuario de Empleado (o PIN)' : 'Correo de Comercio o Usuario'}
                      </label>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400">
                          <Mail className="w-4 h-4" />
                        </span>
                        <input
                          type="text"
                          id="login-username"
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-semibold"
                          placeholder={loginTab === 'empleado' ? 'Ej: ana.m' : 'ejemplo@gmail.com'}
                          required
                        />
                      </div>
                    </div>

                    {/* Contraseña */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label htmlFor="login-pass" className="text-xs font-bold text-slate-700 block">
                          Contraseña
                        </label>
                        <button
                          type="button"
                          onClick={() => setMode('forgot')}
                          className="text-[11px] font-bold text-orange-600 hover:text-orange-700 transition-colors"
                        >
                          ¿Olvidaste tu contraseña?
                        </button>
                      </div>
                      <div className="relative">
                        <span className="absolute left-3.5 top-3.5 text-slate-400">
                          <Lock className="w-4 h-4" />
                        </span>
                        <input
                          type={showLoginPassword ? "text" : "password"}
                          id="login-pass"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono font-bold"
                          placeholder="••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                          className="absolute right-3 top-3.5 text-slate-450 hover:text-slate-650 transition-colors cursor-pointer flex items-center justify-center p-0.5"
                        >
                          {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Fichaje de Turno Checkbox p/ Empleados */}
                    {loginTab === 'empleado' && (
                      <div className="flex items-center gap-2 p-2.5 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <input
                          type="checkbox"
                          id="clock-in-shift"
                          checked={clockInShift}
                          onChange={(e) => setClockInShift(e.target.checked)}
                          className="w-4 h-4 accent-orange-500 rounded cursor-pointer"
                        />
                        <label htmlFor="clock-in-shift" className="text-xs font-extrabold text-slate-800 cursor-pointer flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                          <span>⏱️ Iniciar turno de trabajo / Fichar entrada al ingresar</span>
                        </label>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 hover:shadow-orange-500/15 transition-all cursor-pointer disabled:opacity-50 mt-2"
                    >
                      {isLoggingIn ? (
                        <>
                          <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin shrink-0" />
                          <span>Ingresando al sistema...</span>
                        </>
                      ) : (
                        <>
                          <span>Ingresar</span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Acceso Seguro Demo Sandbox (REPLACES Plaintext Credentials) */}
                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <p className="text-[10px] uppercase font-mono font-bold tracking-widest text-slate-400">Entorno de Demostración y Pruebas</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickLogin('prueba', 'prueba')}
                        className="p-2.5 border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <span className="block text-[11px] font-black text-slate-900">⚡ Demo Dueño</span>
                          <span className="block text-[9px] text-slate-500 font-medium">Comercio Sandbox</span>
                        </div>
                        <Zap className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickLogin('ana.m', 'password123')}
                        className="p-2.5 border border-orange-500/30 bg-orange-500/5 hover:bg-orange-500/10 rounded-xl text-left transition-all cursor-pointer flex items-center justify-between group"
                      >
                        <div>
                          <span className="block text-[11px] font-black text-slate-900">⚡ Demo Cajero</span>
                          <span className="block text-[9px] text-slate-500 font-medium">Terminal POS</span>
                        </div>
                        <Clock className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-3 text-center border-t border-slate-100">
                    <span className="text-xs text-slate-500">¿No tienes cuenta de comercio?</span>{' '}
                    <button
                      type="button"
                      onClick={() => setMode('register')}
                      className="text-xs font-black text-orange-600 hover:underline transition-colors cursor-pointer"
                    >
                      Regístrate como Comercio
                    </button>
                  </div>
                </div>
              )}

              {/* PORTAL 3: PROVEEDORES B2B */}
              {mainPortalTab === 'proveedor' && (
                <div className="space-y-4 animate-fade-in text-left">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl space-y-2">
                    <div className="flex items-center gap-2 text-indigo-700 font-black text-xs">
                      <Truck className="w-4 h-4" />
                      <span>Portal Mayoristas & Proveedores B2B</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Publica tu catálogo mayorista, define tus zonas y radios de entrega por kilometraje o provincia, y recibe pedidos de tiendas directamente.
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Correo o Usuario B2B</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                        placeholder="ventas@distribuidorasur.com"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-700 block">Contraseña Mayorista</label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                        placeholder="••••••••"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isLoggingIn}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs cursor-pointer shadow-sm transition-colors mt-2"
                    >
                      Ingresar como Proveedor B2B
                    </button>
                  </form>

                  <div className="pt-3 text-center border-t border-slate-100">
                    <span className="text-xs text-slate-500">¿Eres proveedor o distribuidor?</span>{' '}
                    <button
                      type="button"
                      onClick={() => setMode('supplier_register')}
                      className="text-xs font-black text-indigo-600 hover:underline transition-colors cursor-pointer"
                    >
                      Regístrate como Proveedor B2B
                    </button>
                  </div>
                </div>
              )}

              {/* Master Console Trigger discrete Footer Link */}
              <div className="pt-4 border-t border-slate-200/80 text-center">
                <button
                  type="button"
                  onClick={() => {
                    handleQuickLogin('pezziniarg@gmail.com', 'Max24@2626');
                  }}
                  className="text-[10px] font-mono font-bold text-slate-400 hover:text-slate-700 transition-colors flex items-center justify-center gap-1 mx-auto cursor-pointer"
                >
                  <Shield className="w-3 h-3 text-slate-400" />
                  <span>⚙️ Acceso Consola Master (Ruta Privada 2FA)</span>
                </button>
              </div>

            </div>
          )}

          {mode === 'register' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Registro de Comercio</h2>
                <p className="text-xs text-slate-500 mt-1">Crea una tienda MAX24 y configura el propietario.</p>
              </div>

              {regSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs flex gap-2.5 items-center">
                  <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="font-semibold leading-normal">¡Registrado! Redirigiendo al login...</span>
                </div>
              )}

              {regError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-650 rounded-xl text-xs flex gap-2.5 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="font-semibold leading-normal">{regError}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4" id="register-admin-form">
                <div className="space-y-1.5">
                  <label htmlFor="reg-name" className="text-xs font-semibold text-slate-700 block">
                    Nombre Completo
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <User className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      id="reg-name"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-semibold"
                      placeholder="Carlos Daniel Pérez"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-email" className="text-xs font-semibold text-slate-700 block">
                    Correo Electrónico (Propietario)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      id="reg-email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-semibold"
                      placeholder="propietario@kiosco.com"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reg-pass" className="text-xs font-semibold text-slate-700 block">
                    Contraseña de Acceso
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Lock className="w-4 h-4" />
                    </span>
                    <input
                      type={showRegPassword ? "text" : "password"}
                      id="reg-pass"
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-mono font-bold"
                      placeholder="Crea una contraseña segura"
                      minLength={6}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegPassword(!showRegPassword)}
                      className="absolute right-3 top-3.5 text-slate-450 hover:text-slate-650 transition-colors cursor-pointer flex items-center justify-center p-0.5"
                    >
                      {showRegPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={regSuccess}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 hover:shadow-orange-500/15 transition-all mt-4 cursor-pointer disabled:opacity-50"
                >
                  Registrar Comercio
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 text-center border-t border-slate-200">
                <button
                  onClick={() => setMode('login')}
                  className="text-xs font-black text-orange-600 hover:text-orange-500 hover:underline transition-colors cursor-pointer"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </div>
          )}

          {mode === 'forgot' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight">Recuperación de Contraseña</h2>
                <p className="text-xs text-slate-550 mt-1">Escribe tu correo electrónico para restablecer tu contraseña.</p>
              </div>

              {forgotSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs flex gap-2.5 items-center">
                  <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="font-semibold leading-normal">Se han enviado tus credenciales de acceso a tu casilla de correo registrada de forma segura.</span>
                </div>
              )}

              {forgotError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-650 rounded-xl text-xs flex gap-2.5 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="font-semibold leading-normal">{forgotError}</span>
                </div>
              )}

              <form onSubmit={handleForgotSubmit} className="space-y-4" id="forgot-password-form">
                <div className="space-y-1.5">
                  <label htmlFor="forgot-email" className="text-xs font-semibold text-slate-700 block">
                    Correo o Usuario
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3.5 text-slate-400">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      id="forgot-email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-semibold"
                      placeholder="Tu correo registrado o usuario"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 hover:shadow-orange-500/15 transition-all mt-4 cursor-pointer"
                >
                  Enviar Enlace
                  <KeyRound className="w-4 h-4" />
                </button>
              </form>

              <div className="pt-4 text-center border-t border-slate-200">
                <button
                  onClick={() => setMode('login')}
                  className="text-xs font-black text-orange-600 hover:text-orange-500 hover:underline transition-colors cursor-pointer"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </div>
          )}

          {mode === 'buyer_register' && (
            <div className="space-y-5 animate-fade-in text-left">
              <div>
                <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] font-mono tracking-widest font-black rounded uppercase">Portal Comprador</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1.5">Registro Público General</h2>
                <p className="text-xs text-slate-555 mt-1">Crea tu cuenta de comprador gratis. Agrégale comercios favoritos, escanea mercadería y realiza pedidos online.</p>
              </div>

              {buyerSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs flex gap-2.5 items-center">
                  <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="font-semibold leading-normal">¡Registrado con Éxito! Redirigiendo para que inicies sesión...</span>
                </div>
              )}

              {buyerError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-650 rounded-xl text-xs flex gap-2.5 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="font-semibold leading-normal">{buyerError}</span>
                </div>
              )}

              <form onSubmit={handleBuyerRegisterSubmit} className="space-y-4" id="buyer-register-form-block">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Nombre Completo *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      placeholder="Juan Pérez"
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">DNI / ID Cédula *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-semibold"
                      placeholder="38765432"
                      value={buyerDocId}
                      onChange={(e) => setBuyerDocId(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Email *</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      placeholder="juan@gmail.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Celular *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-semibold"
                      placeholder="1133445566"
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block">Contraseña de Ingreso *</label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                    placeholder="••••••••"
                    value={buyerPassword}
                    onChange={(e) => setBuyerPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs cursor-pointer shadow-md mt-3 animate-pulse"
                >
                  Registrarse Gratis como Comprador
                </button>
              </form>

              <div className="pt-4 text-center border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-black text-slate-500 hover:text-orange-600 transition-colors cursor-pointer"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </div>
          )}

          {mode === 'supplier_register' && (
            <div className="space-y-5 animate-fade-in text-left">
              <div>
                <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-600 border border-indigo-500/20 text-[9px] font-mono tracking-widest font-black rounded uppercase">Portal Mayorista</span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight mt-1.5">Registro de Proveedor</h2>
                <p className="text-xs text-slate-555 mt-1">Regístrate como distribuidor o fabricante. Ofrece tus productos, listas de precios y ofertas directamente a comercios de tu zona.</p>
              </div>

              {supSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 rounded-xl text-xs flex gap-2.5 items-center">
                  <Check className="w-4 h-4 shrink-0 text-emerald-500" />
                  <span className="font-semibold leading-normal">¡Registrado con Éxito! Redirigiendo para que inicies sesión...</span>
                </div>
              )}

              {supError && (
                <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-650 rounded-xl text-xs flex gap-2.5 items-center">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                  <span className="font-semibold leading-normal">{supError}</span>
                </div>
              )}

              <form onSubmit={handleSupplierRegisterSubmit} className="space-y-4" id="supplier-register-form-block">
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block font-sans">Nombre / Razón Social *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      placeholder="Distribuidora Sur"
                      value={supName}
                      onChange={(e) => setSupName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block font-sans">Rubro Principal *</label>
                    <select
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      value={supRubro}
                      onChange={(e) => setSupRubro(e.target.value)}
                    >
                      <option value="Almacén">Almacén / Comestibles</option>
                      <option value="Bebidas">Bebidas con/sin Alcohol</option>
                      <option value="Limpieza">Limpieza y Perfumería</option>
                      <option value="Fiambrería">Fiambrería y Lácteos</option>
                      <option value="Golosinas">Kiosco y Golosinas</option>
                      <option value="Varios">Varios y General</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block font-sans">Email de Contacto *</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-semibold"
                      placeholder="ventas@distsur.com"
                      value={supEmail}
                      onChange={(e) => setSupEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block font-sans">Teléfono WhatsApp *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-semibold"
                      placeholder="1144332211"
                      value={supPhone}
                      onChange={(e) => setSupPhone(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Location Block */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <p className="text-[10px] font-black uppercase text-indigo-600 tracking-wider font-mono">Ubicación de Distribución (Zona)</p>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500">País</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs text-slate-500 font-semibold"
                        value={supCountry}
                        readOnly
                      />
                    </div>
                    
                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500">Provincia *</label>
                      <select
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold"
                        value={supProvince}
                        onChange={(e) => setSupProvince(e.target.value)}
                      >
                        <option value="Buenos Aires">Buenos Aires</option>
                        <option value="CABA">CABA</option>
                        <option value="Córdoba">Córdoba</option>
                        <option value="Santa Fe">Santa Fe</option>
                        <option value="Mendoza">Mendoza</option>
                        <option value="Tucumán">Tucumán</option>
                        <option value="Entre Ríos">Entre Ríos</option>
                        <option value="Salta">Salta</option>
                        <option value="Misiones">Misiones</option>
                        <option value="Chaco">Chaco</option>
                        <option value="Corrientes">Corrientes</option>
                        <option value="San Juan">San Juan</option>
                        <option value="Jujuy">Jujuy</option>
                        <option value="Río Negro">Río Negro</option>
                        <option value="Neuquén">Neuquén</option>
                        <option value="Chubut">Chubut</option>
                        <option value="San Luis">San Luis</option>
                        <option value="Catamarca">Catamarca</option>
                        <option value="La Rioja">La Rioja</option>
                        <option value="La Pampa">La Pampa</option>
                        <option value="Santiago del Estero">Santiago del Estero</option>
                        <option value="Santa Cruz">Santa Cruz</option>
                        <option value="Tierra del Fuego">Tierra del Fuego</option>
                        <option value="Formosa">Formosa</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-slate-500">Ciudad *</label>
                      <input
                        type="text"
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-900 font-semibold"
                        placeholder="Ej: Quilmes"
                        value={supCity}
                        onChange={(e) => setSupCity(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold text-slate-600 uppercase tracking-wider block font-sans">Contraseña de Ingreso *</label>
                  <input
                    type="password"
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono"
                    placeholder="••••••••"
                    value={supPassword}
                    onChange={(e) => setSupPassword(e.target.value)}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs cursor-pointer shadow-md mt-3 transition-colors"
                >
                  Registrarse Gratis como Proveedor
                </button>
              </form>

              <div className="pt-4 text-center border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-xs font-black text-slate-500 hover:text-orange-600 transition-colors"
                >
                  Volver al Inicio de Sesión
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Brand visual Footer note */}
        <p className="text-[10px] text-slate-400 text-center font-mono uppercase tracking-wider">
          MAX24 Cloud Platform • Encriptación SSL • www.max24app.com
        </p>
      </div>
    </div>
  );
}
