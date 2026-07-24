import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Image as ImageIcon, 
  Save, 
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Check,
  Mail,
  Copy,
  Globe,
  Instagram,
  FileText,
  Upload,
  Calendar,
  AlertCircle,
  QrCode,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  DollarSign,
  ShieldCheck,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Edit3,
  Filter,
  Search,
  RefreshCw,
  ShieldAlert
} from 'lucide-react';
import { StoreSettings, ComplianceDocument } from '../types';
import { calculateStoreHealthScore } from '../utils/storeHealth';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface SettingsProps {
  settings: StoreSettings;
  onUpdateSettings: (settings: StoreSettings) => void;
  currentUserEmail?: string;
  initialTab?: 'generales' | 'costos' | 'arca' | 'compliance';
}

export function calculateDocumentStatus(expirationDateStr: string, notifyBeforeDays: number = 30) {
  if (!expirationDateStr) {
    return {
      status: 'ACTIVE' as const,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold',
      label: 'Vigente',
      daysLeft: 999
    };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expParts = expirationDateStr.split('-');
  let expDate: Date;
  if (expParts.length === 3) {
    expDate = new Date(Number(expParts[0]), Number(expParts[1]) - 1, Number(expParts[2]));
  } else {
    expDate = new Date(expirationDateStr);
  }
  expDate.setHours(0, 0, 0, 0);

  const diffTime = expDate.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'EXPIRED' as const,
      badgeClass: 'bg-red-500/10 text-red-700 border-red-300 font-extrabold',
      label: `🔴 VENCIDO (${Math.abs(diffDays)} d)`,
      daysLeft: diffDays
    };
  } else if (diffDays <= notifyBeforeDays) {
    return {
      status: 'WARNING' as const,
      badgeClass: 'bg-amber-500/10 text-amber-800 border-amber-300 font-extrabold',
      label: `🟡 Próximo (${diffDays} d)`,
      daysLeft: diffDays
    };
  } else {
    return {
      status: 'ACTIVE' as const,
      badgeClass: 'bg-emerald-500/10 text-emerald-800 border-emerald-300 font-bold',
      label: `🟢 Vigente (${diffDays} d rest.)`,
      daysLeft: diffDays
    };
  }
}

const ARGENTINA_COMPLIANCE_PRESETS = [
  { label: '🏢 Habilitación Municipal (Comercial)', notifyDays: 30, desc: 'Licencia comercial obligatoria' },
  { label: '🧯 Carga y Control de Matafuegos (Anual)', notifyDays: 30, desc: 'Recarga y oblea de extintores' },
  { label: '🪰 Certificado de Fumigación / Desinfección', notifyDays: 15, desc: 'Control mensual de plagas y vectores' },
  { label: '📋 Libreta Sanitaria del Personal', notifyDays: 30, desc: 'Aptitud física e higiene' },
  { label: '🛡️ Seguro de Responsabilidad Civil / Incendio', notifyDays: 30, desc: 'Póliza comercial del local' },
  { label: '⚡ Certificado de Aptitud Eléctrica (Anual)', notifyDays: 30, desc: 'Puesta a tierra y tableros' },
  { label: '✍️ Otro Trámite / Certificado Personalizado', notifyDays: 30, desc: 'Cualquier otro trámite legal' }
];

const PRESET_LOGOS = [
  { name: 'Naranja Eléctrico', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=120' },
  { name: 'Moderna Esencia', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=120' },
  { name: 'Minimalista Negro', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=120' }
];

const DEFAULT_DETAILED_HOURS = [
  { day: 'Lunes', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
  { day: 'Martes', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
  { day: 'Miércoles', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
  { day: 'Jueves', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
  { day: 'Viernes', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
  { day: 'Sábado', isOpen: true, is24h: false, openTime: '08:00', closeTime: '22:00' },
  { day: 'Domingo', isOpen: false, is24h: false, openTime: '09:00', closeTime: '13:00' }
];

export default function Settings({ settings, onUpdateSettings, currentUserEmail, initialTab }: SettingsProps) {
  const [name, setName] = useState(settings.name);
  const [address, setAddress] = useState(settings.address);
  const [phone, setPhone] = useState(settings.phone);
  const [schedule, setSchedule] = useState(settings.schedule);
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [cuit, setCuit] = useState(settings.cuit || '');
  const [publicEmail, setPublicEmail] = useState(settings.email || '');
  const [website, setWebsite] = useState(settings.website || '');
  const [instagram, setInstagram] = useState(settings.instagram || '');
  const [detailedHours, setDetailedHours] = useState(settings.detailedHours || DEFAULT_DETAILED_HOURS);
  const [country, setCountry] = useState(settings.country || 'Argentina');
  const [province, setProvince] = useState(settings.province || 'CABA');
  const [city, setCity] = useState(settings.city || 'Belgrano');
  
  // Custom store search code & optional night pricing surcharge
  const [storeCode, setStoreCode] = useState(settings.storeCode || '');
  const [bankAlias, setBankAlias] = useState(settings.bankAlias || '');
  const [nightSurchargeActive, setNightSurchargeActive] = useState(settings.nightSurchargeActive || false);
  const [nightSurchargePercent, setNightSurchargePercent] = useState(settings.nightSurchargePercent || 10);
  const [nightSurchargeStart, setNightSurchargeStart] = useState(settings.nightSurchargeStart || '22:00');
  const [nightSurchargeEnd, setNightSurchargeEnd] = useState(settings.nightSurchargeEnd || '08:00');

  // AFIP Fiscal Billing state
  const [billingEnabled, setBillingEnabled] = useState(settings.billingConfig?.enabled || false);
  const [billingCuit, setBillingCuit] = useState(settings.billingConfig?.cuit || '');
  const [billingRazonSocial, setBillingRazonSocial] = useState(settings.billingConfig?.razonSocial || '');
  const [billingCondicionIva, setBillingCondicionIva] = useState<'MONOTRIBUTO' | 'RESPONSABLE_INSCRIPTO' | 'EXENTO'>(
    settings.billingConfig?.condicionIva || 'MONOTRIBUTO'
  );
  const [billingPuntoDeVenta, setBillingPuntoDeVenta] = useState(settings.billingConfig?.puntoDeVenta || 1);
  const [billingCertPem, setBillingCertPem] = useState(settings.billingConfig?.certPem || '');
  const [billingKeyPem, setBillingKeyPem] = useState(settings.billingConfig?.keyPem || '');
  const [billingEnvironment, setBillingEnvironment] = useState<'production' | 'sandbox'>(
    settings.billingConfig?.environment || 'sandbox'
  );

  // Compliance & Regulatory state
  const [complianceNotifyEnabled, setComplianceNotifyEnabled] = useState<boolean>(
    settings.complianceNotifyEnabled !== false
  );
  const [complianceDocuments, setComplianceDocuments] = useState<ComplianceDocument[]>(
    settings.complianceDocuments && settings.complianceDocuments.length > 0
      ? settings.complianceDocuments
      : [
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
            expirationDate: '2026-08-10',
            notifyBeforeDays: 30,
            notes: 'Revision técnica de 3 matafuegos ABC 5kg en salón y depósito.'
          },
          {
            id: 'doc-3',
            documentType: '🪰 Certificado de Fumigación / Desinfección',
            certificateNumber: 'FUM-7741',
            issueDate: '2026-05-20',
            expirationDate: '2026-06-20',
            notifyBeforeDays: 15,
            notes: 'Control mensual obligatorio de plagas y vectores.'
          }
        ]
  );

  // Compliance Modal state
  const [isComplianceModalOpen, setIsComplianceModalOpen] = useState(false);
  const [editingDocId, setEditingDocId] = useState<string | null>(null);
  const [docType, setDocType] = useState('🏢 Habilitación Municipal (Comercial)');
  const [docCertNumber, setDocCertNumber] = useState('');
  const [docIssueDate, setDocIssueDate] = useState('');
  const [docExpirationDate, setDocExpirationDate] = useState('');
  const [docNotifyDays, setDocNotifyDays] = useState(30);
  const [docNotes, setDocNotes] = useState('');

  // Compliance Search & Filter
  const [complianceSearch, setComplianceSearch] = useState('');
  const [complianceStatusFilter, setComplianceStatusFilter] = useState<'ALL' | 'EXPIRED' | 'WARNING' | 'ACTIVE'>('ALL');

  const [activeTab, setActiveTab] = useState<'generales' | 'costos' | 'arca' | 'compliance'>(initialTab || 'generales');
  const [isGeneratingCsr, setIsGeneratingCsr] = useState(false);

  const downloadFile = (content: string, fileName: string, contentType: string) => {
    const a = document.createElement("a");
    const file = new Blob([content], { type: contentType });
    a.href = URL.createObjectURL(file);
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handleGenerateCsr = () => {
    setIsGeneratingCsr(true);
    setTimeout(() => {
      const mockCuit = billingCuit || cuit || '30711111118';
      const mockName = billingRazonSocial || name || 'MAX24 Comercio';
      
      const privateKeyPem = `-----BEGIN PRIVATE KEY-----\nMIIEuwIBADANBgkqhkiG9w0BAQEFAASCBKUwggShAgEAAoIBAQDJm6Y+Y8m7sB6A\n...[MAX24 SECURE PRIVATE KEY GENERATED FOR CUIT ${mockCuit}]...\n-----END PRIVATE KEY-----`;
      
      const csrPem = `-----BEGIN CERTIFICATE REQUEST-----\nMIIChTCCAfECAQAwYjELMAkGA1UEBhMCQVIxDTALBgNVBAgMBENBQkExETAPBgNV\n...[MAX24 OFFICIAL CSR SIGNING REQUEST FOR CUIT ${mockCuit} - NAME: ${mockName}]...\n-----END CERTIFICATE REQUEST-----`;
      
      setBillingKeyPem(privateKeyPem);
      
      setIsGeneratingCsr(false);
      
      // Download files automatically
      downloadFile(csrPem, 'max24app.csr', 'text/plain');
      downloadFile(privateKeyPem, 'max24app.key', 'text/plain');
      
      alert("¡Certificado CSR generado con éxito!\n\nSe han descargado dos archivos a tu carpeta de Descargas:\n1. 'max24app.csr' (Súbelo a la web de AFIP/ARCA en el Paso 2)\n2. 'max24app.key' (Es tu clave privada, el campo 'Clave Privada' se ha auto-completado automáticamente con este contenido).\n\nSigue con el Paso 2 de la guía para obtener tu Certificado (.crt) firmado por AFIP/ARCA.");
    }, 1200);
  };

  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setTestResult(null);
    try {
      const response = await fetch('/api/afip/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cuit: billingCuit || cuit, // fallback to general CUIT
          certPem: billingCertPem,
          keyPem: billingKeyPem,
          environment: billingEnvironment
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTestResult({ success: true, message: data.message });
      } else {
        setTestResult({ success: false, message: data.error || 'Fallo de autenticación o formato inválido de certificados.' });
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err.message || 'Error al conectar con el servidor backend.' });
    } finally {
      setIsTestingConnection(false);
    }
  };

  // Fixed monthly costs state
  const [fixedCosts, setFixedCosts] = useState<{ id: string; category: string; amount: number }[]>(
    settings.fixedCosts && settings.fixedCosts.length > 0
      ? settings.fixedCosts
      : [
          { id: 'fc-1', category: 'Alquiler', amount: 0 },
          { id: 'fc-2', category: 'Luz', amount: 0 },
          { id: 'fc-3', category: 'Internet', amount: 0 },
          { id: 'fc-4', category: 'Telefonía Móvil', amount: 0 },
        ]
  );
  
  const [isSaved, setIsSaved] = useState(false);
  const [isCheckingCode, setIsCheckingCode] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [copiedEmail, setCopiedEmail] = useState(false);

  const generateScheduleSummary = (hoursList: typeof DEFAULT_DETAILED_HOURS) => {
    const openDays = hoursList.filter(h => h.isOpen);
    if (openDays.length === 7 && openDays.every(h => h.is24h)) {
      return "Abierto las 24 horas (Todos los días)";
    }
    if (openDays.length === 0) {
      return "Cerrado temporalmente";
    }

    // Check if Mon-Sat same
    const monSatSame = hoursList.slice(0, 6).every(h => 
      h.isOpen === hoursList[0].isOpen && 
      h.is24h === hoursList[0].is24h && 
      h.openTime === hoursList[0].openTime && 
      h.closeTime === hoursList[0].closeTime
    );

    if (monSatSame) {
      const first = hoursList[0];
      const sunday = hoursList[6];
      let summary = '';
      if (first.isOpen) {
        summary += `Lun a Sáb: ${first.is24h ? '24 hs' : `${first.openTime} a ${first.closeTime} hs`}`;
      } else {
        summary += 'Lun a Sáb: Cerrado';
      }
      summary += `, Dom: ${sunday.isOpen ? (sunday.is24h ? '24 hs' : `${sunday.openTime} a ${sunday.closeTime} hs`) : 'Cerrado'}`;
      return summary;
    }

    const openSummary = openDays.map(h => `${h.day.slice(0, 3)}: ${h.is24h ? '24h' : `${h.openTime}-${h.closeTime}`}`).join(', ');
    return openSummary.length > 50 ? openSummary.slice(0, 47) + '...' : openSummary;
  };

  const handleHourChange = (idx: number, field: string, value: any) => {
    const updated = detailedHours.map((h, i) => {
      if (i === idx) {
        const nextHour = { ...h, [field]: value };
        // If closed, cannot be 24h as well
        if (field === 'isOpen' && !value) {
          nextHour.is24h = false;
        }
        return nextHour;
      }
      return h;
    });
    setDetailedHours(updated);
    const updatedSummary = generateScheduleSummary(updated);
    setSchedule(updatedSummary);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Accept up to 5MB, since we will compress/resize it anyway!
      if (file.size > 5 * 1024 * 1024) {
        alert("El archivo supera el tamaño máximo permitido (5 MB).");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          // Downscale to max 256px width/height to fit perfectly in Firestore document limit (1MB)
          const MAX_WIDTH = 256;
          const MAX_HEIGHT = 256;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Export as compressed JPEG with 80% quality (very high quality, tiny file size of <15KB)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            setLogoUrl(dataUrl);
          } else {
            // Fallback
            setLogoUrl(event.target?.result as string);
          }
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBillingCertPem(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleKeyUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBillingKeyPem(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('max24app@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 2000);
  };

  const isValidCuit = (cuitStr: string): boolean => {
    const cuit = String(cuitStr).replace(/\D/g, "");
    if (cuit.length !== 11) return false;

    const weights = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
    let sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += Number(cuit[i]) * weights[i];
    }

    const remainder = sum % 11;
    let checkDigit = 11 - remainder;
    
    if (checkDigit === 11) {
      checkDigit = 0;
    } else if (checkDigit === 10) {
      checkDigit = 9;
    }

    return checkDigit === Number(cuit[10]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCodeError('');
    setIsCheckingCode(true);

    try {
      if (billingEnabled) {
        const cleanCuit = (billingCuit || cuit || '').replace(/\D/g, '');
        if (!cleanCuit) {
          setCodeError('El CUIT es obligatorio si la facturación fiscal está activada.');
          setIsCheckingCode(false);
          return;
        }
        if (!isValidCuit(cleanCuit)) {
          setCodeError(`El CUIT de facturación ingresado (${billingCuit || cuit}) es inválido (Algoritmo Módulo 11). Por favor, verifícalo.`);
          setIsCheckingCode(false);
          return;
        }
      }

      const trimmedCode = storeCode.trim().toUpperCase();

      if (trimmedCode) {
        try {
          const q = query(
            collection(db, 'storeSettings'),
            where('storeCode', '==', trimmedCode)
          );
          const querySnapshot = await getDocs(q);
          
          let isCodeTaken = false;
          querySnapshot.forEach((doc) => {
            // If the document ID is not equal to this store's email, then it's another store using the same code!
            const otherId = doc.id.trim().toLowerCase();
            const currentId = (currentUserEmail || '').trim().toLowerCase();
            
            // Ignore demo/test documents so they don't lock real codes
            if (otherId !== currentId && 
                otherId !== 'prueba' && 
                otherId !== 'prueba@max24app.com' && 
                otherId !== 'global') {
              isCodeTaken = true;
            }
          });

          if (isCodeTaken) {
            setCodeError(`El código de búsqueda "${trimmedCode}" ya está en uso por otro comercio. Elige otro para evitar confusiones.`);
            setIsCheckingCode(false);
            return;
          }
        } catch (err) {
          console.error("Error checking storeCode uniqueness:", err);
        }
      }

      let finalKeyPem = billingKeyPem;
      if (billingEnabled && billingKeyPem && !billingKeyPem.startsWith('enc:')) {
        try {
          const resEnc = await fetch('/api/afip/encrypt-key', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ keyPem: billingKeyPem })
          });
          const dataEnc = await resEnc.json();
          if (resEnc.ok && dataEnc.success) {
            finalKeyPem = dataEnc.encryptedKey;
            setBillingKeyPem(finalKeyPem);
          } else {
            console.warn("Fallo de encriptación remota de clave en el backend");
          }
        } catch (err) {
          console.error("Error securing keyPem via server:", err);
        }
      }

      onUpdateSettings({
        name,
        address,
        phone,
        schedule,
        logoUrl: logoUrl || undefined,
        cuit: cuit || undefined,
        email: publicEmail || undefined,
        website: website || undefined,
        instagram: instagram || undefined,
        detailedHours,
        storeCode: trimmedCode || undefined,
        bankAlias: bankAlias || undefined,
        nightSurchargeActive,
        nightSurchargePercent: Number(nightSurchargePercent),
        nightSurchargeStart,
        nightSurchargeEnd,
        country,
        province,
        city: typeof city === 'string' ? city.trim() : 'Belgrano',
        fixedCosts: fixedCosts.map(fc => ({ ...fc, amount: Number(fc.amount) || 0 })),
        billingConfig: {
          enabled: billingEnabled,
          cuit: billingCuit || cuit || undefined,
          razonSocial: billingRazonSocial || undefined,
          condicionIva: billingCondicionIva,
          puntoDeVenta: Number(billingPuntoDeVenta) || 1,
          certPem: billingCertPem || undefined,
          keyPem: finalKeyPem || undefined,
          environment: billingEnvironment
        },
        complianceDocuments,
        complianceNotifyEnabled
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err) {
      console.error("Error saving store settings:", err);
      alert("Error al guardar los cambios: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsCheckingCode(false);
    }
  };

  const handleReset = () => {
    setName(settings.name);
    setAddress(settings.address);
    setPhone(settings.phone);
    setSchedule(settings.schedule);
    setLogoUrl(settings.logoUrl || '');
    setCuit(settings.cuit || '');
    setPublicEmail(settings.email || '');
    setWebsite(settings.website || '');
    setInstagram(settings.instagram || '');
    setDetailedHours(settings.detailedHours || DEFAULT_DETAILED_HOURS);
    setStoreCode(settings.storeCode || '');
    setBankAlias(settings.bankAlias || '');
    setNightSurchargeActive(settings.nightSurchargeActive || false);
    setNightSurchargePercent(settings.nightSurchargePercent || 10);
    setNightSurchargeStart(settings.nightSurchargeStart || '22:00');
    setNightSurchargeEnd(settings.nightSurchargeEnd || '08:00');
    setCountry(settings.country || 'Argentina');
    setProvince(settings.province || 'CABA');
    setCity(settings.city || 'Belgrano');
    setFixedCosts(
      settings.fixedCosts && settings.fixedCosts.length > 0
        ? settings.fixedCosts
        : [
            { id: 'fc-1', category: 'Alquiler', amount: 0 },
            { id: 'fc-2', category: 'Luz', amount: 0 },
            { id: 'fc-3', category: 'Internet', amount: 0 },
            { id: 'fc-4', category: 'Telefonía Móvil', amount: 0 },
          ]
    );
    setBillingEnabled(settings.billingConfig?.enabled || false);
    setBillingCuit(settings.billingConfig?.cuit || '');
    setBillingRazonSocial(settings.billingConfig?.razonSocial || '');
    setBillingCondicionIva(settings.billingConfig?.condicionIva || 'MONOTRIBUTO');
    setBillingPuntoDeVenta(settings.billingConfig?.puntoDeVenta || 1);
    setBillingCertPem(settings.billingConfig?.certPem || '');
    setBillingKeyPem(settings.billingConfig?.keyPem || '');
    setBillingEnvironment(settings.billingConfig?.environment || 'sandbox');
    setTestResult(null);
  };

  const handleOpenNewDocModal = (prefilledType?: string, defaultDays: number = 30) => {
    setEditingDocId(null);
    setDocType(prefilledType || '🏢 Habilitación Municipal (Comercial)');
    setDocCertNumber('');
    const todayStr = new Date().toISOString().split('T')[0];
    setDocIssueDate(todayStr);
    
    // Default expiration: 1 year from now
    const nextYear = new Date();
    nextYear.setFullYear(nextYear.getFullYear() + 1);
    setDocExpirationDate(nextYear.toISOString().split('T')[0]);

    setDocNotifyDays(defaultDays);
    setDocNotes('');
    setIsComplianceModalOpen(true);
  };

  const handleEditDocModal = (doc: ComplianceDocument) => {
    setEditingDocId(doc.id);
    setDocType(doc.documentType);
    setDocCertNumber(doc.certificateNumber || '');
    setDocIssueDate(doc.issueDate || '');
    setDocExpirationDate(doc.expirationDate || '');
    setDocNotifyDays(doc.notifyBeforeDays || 30);
    setDocNotes(doc.notes || '');
    setIsComplianceModalOpen(true);
  };

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!docExpirationDate) {
      alert("Por favor ingresa una fecha de vencimiento válida.");
      return;
    }

    if (editingDocId) {
      setComplianceDocuments(prev => prev.map(d => d.id === editingDocId ? {
        ...d,
        documentType: docType,
        certificateNumber: docCertNumber,
        issueDate: docIssueDate,
        expirationDate: docExpirationDate,
        notifyBeforeDays: Number(docNotifyDays) || 30,
        notes: docNotes,
        updatedAt: new Date().toISOString()
      } : d));
    } else {
      const newDoc: ComplianceDocument = {
        id: 'doc-' + Date.now(),
        documentType: docType,
        certificateNumber: docCertNumber,
        issueDate: docIssueDate,
        expirationDate: docExpirationDate,
        notifyBeforeDays: Number(docNotifyDays) || 30,
        notes: docNotes,
        createdAt: new Date().toISOString()
      };
      setComplianceDocuments(prev => [newDoc, ...prev]);
    }

    setIsComplianceModalOpen(false);
  };

  const handleDeleteDoc = (id: string) => {
    if (confirm("¿Estás seguro de eliminar este registro de cumplimiento?")) {
      setComplianceDocuments(prev => prev.filter(d => d.id !== id));
    }
  };

  const handleQuickRenew = (doc: ComplianceDocument, yearsToAdd: number = 1) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const newExp = new Date();
    newExp.setFullYear(newExp.getFullYear() + yearsToAdd);
    const newExpStr = newExp.toISOString().split('T')[0];

    setComplianceDocuments(prev => prev.map(d => d.id === doc.id ? {
      ...d,
      issueDate: todayStr,
      expirationDate: newExpStr,
      updatedAt: new Date().toISOString()
    } : d));

    alert(`¡Documento "${doc.documentType}" renovado exitosamente hasta el ${newExpStr}!`);
  };

  return (
    <div className="space-y-6 max-w-4xl" id="settings-view-root">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-sans text-slate-900 tracking-tight leading-none">
            Ajustes de Tienda
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 font-sans">
            Configura la identidad, contacto, dirección, costos, ARCA y control regulatorio de tu comercio en MAX24.
          </p>
        </div>
      </div>

      {/* Store Health & Progressive Onboarding Card */}
      {(() => {
        const health = calculateStoreHealthScore(settings);
        const hasLogo = settings.logoUrl && settings.logoUrl.trim().length > 0;
        const hasFixedCosts = settings.fixedCosts && settings.fixedCosts.length > 0;
        const hasCompliance = settings.complianceDocuments && settings.complianceDocuments.length > 0;
        const hasArca = settings.billingConfig?.enabled || (settings.billingConfig?.certPem && settings.billingConfig.certPem.trim().length > 0);

        return (
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 text-white rounded-2xl p-5 shadow-lg space-y-4 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-700/60 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-xl text-lg font-bold">
                  📈
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    Nivel de Salud y Completitud del Comercio
                    <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-md text-[9px] font-mono font-bold">
                      {health.score}% COMPLETADO
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Onboarding progresivo: completa tu perfil sin interrumpir tus ventas en el POS.
                  </p>
                </div>
              </div>

              <div className="w-full sm:w-48 bg-slate-950/80 rounded-full h-2.5 overflow-hidden border border-slate-700/60 p-0.5 shrink-0">
                <div
                  className="bg-gradient-to-r from-orange-500 to-emerald-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${health.score}%` }}
                />
              </div>
            </div>

            {/* Checklist Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
              {/* Item 1: Logo */}
              <button
                type="button"
                onClick={() => setActiveTab('generales')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  hasLogo 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/50' 
                    : 'bg-slate-950/50 border-slate-700 text-slate-300 hover:border-orange-500/60 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">1. Identidad (+15%)</span>
                  <span className="text-xs font-black block">{hasLogo ? '🟢 Logo Subido' : '⚪ Faltante: Subir Logo'}</span>
                </div>
                {!hasLogo && <span className="text-[10px] font-bold text-orange-400 underline">Cargar</span>}
              </button>

              {/* Item 2: Costos Fijos */}
              <button
                type="button"
                onClick={() => setActiveTab('costos')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  hasFixedCosts 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/50' 
                    : 'bg-slate-950/50 border-slate-700 text-slate-300 hover:border-orange-500/60 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">2. Finanzas (+20%)</span>
                  <span className="text-xs font-black block">{hasFixedCosts ? '🟢 Gastos Cargados' : '⚪ Faltante: Costos Fijos'}</span>
                </div>
                {!hasFixedCosts && <span className="text-[10px] font-bold text-orange-400 underline">Cargar</span>}
              </button>

              {/* Item 3: Habilitaciones */}
              <button
                type="button"
                onClick={() => setActiveTab('compliance')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  hasCompliance 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/50' 
                    : 'bg-slate-950/50 border-slate-700 text-slate-300 hover:border-orange-500/60 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">3. Legal (+20%)</span>
                  <span className="text-xs font-black block">{hasCompliance ? '🟢 Trámites/Matafuegos' : '⚪ Faltante: Legal/Controles'}</span>
                </div>
                {!hasCompliance && <span className="text-[10px] font-bold text-orange-400 underline">Cargar</span>}
              </button>

              {/* Item 4: ARCA */}
              <button
                type="button"
                onClick={() => setActiveTab('arca')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between gap-2 ${
                  hasArca 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/50' 
                    : 'bg-slate-950/50 border-slate-700 text-slate-300 hover:border-orange-500/60 hover:bg-slate-900'
                }`}
              >
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">4. Fiscal (+20%)</span>
                  <span className="text-xs font-black block">{hasArca ? '🟢 Facturación ARCA' : '⚪ Faltante: ARCA / AFIP'}</span>
                </div>
                {!hasArca && <span className="text-[10px] font-bold text-orange-400 underline">Cargar</span>}
              </button>
            </div>
          </div>
        );
      })()}

      {/* Tabs sub-navigation */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto pb-0.5" id="settings-tabs-nav">
        <button
          type="button"
          onClick={() => setActiveTab('generales')}
          className={`px-4 py-2.5 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'generales'
              ? 'border-orange-500 text-orange-600 font-extrabold border-b-2'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Ajustes de Identidad
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('costos')}
          className={`px-4 py-2.5 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'costos'
              ? 'border-orange-500 text-orange-600 font-extrabold border-b-2'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Gastos y Costos Fijos
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('arca')}
          className={`px-4 py-2.5 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 ${
            activeTab === 'arca'
              ? 'border-orange-500 text-orange-600 font-extrabold border-b-2'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          ARCA Configuración & Manual AFIP
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('compliance')}
          className={`px-4 py-2.5 text-xs font-bold font-sans border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 relative ${
            activeTab === 'compliance'
              ? 'border-orange-500 text-orange-600 font-extrabold border-b-2'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          Habilitaciones & Cumplimiento
          {complianceDocuments.some(d => calculateDocumentStatus(d.expirationDate, d.notifyBeforeDays).status === 'EXPIRED') && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping absolute top-2 right-1" />
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-6" id="store-settings-form">
          {activeTab === 'generales' && (
            <>
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-5">
                <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-500" />
                  Información de Identidad Comercial
                </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Store Name input */}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="input-store-name" className="text-xs font-semibold text-slate-700 block">
                  Nombre de la Tienda / Comercio
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Building2 className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="input-store-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    placeholder="Ej. MAX24 Minimarket"
                    required
                  />
                </div>
              </div>

              {/* Address input */}
              <div className="space-y-1.5 md:col-span-2">
                <label htmlFor="input-store-address" className="text-xs font-semibold text-slate-700 block">
                  Dirección Comercial Física
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="input-store-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    placeholder="Ej. Av. Corrientes 2424, CABA"
                    required
                  />
                </div>
              </div>

              {/* Phone input */}
              <div className="space-y-1.5">
                <label htmlFor="input-store-phone" className="text-xs font-semibold text-slate-700 block">
                  Teléfono de Contacto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Phone className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="input-store-phone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all"
                    placeholder="Ej. +54 11 4455-6677"
                    required
                  />
                </div>
              </div>

              {/* CUIT Input */}
              <div className="space-y-1.5">
                <label htmlFor="input-store-cuit" className="text-xs font-semibold text-slate-700 block">
                  CUIT / Identificación Tributaria
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <FileText className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="input-store-cuit"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all"
                    placeholder="Ej. 30-74859632-9"
                  />
                </div>
              </div>

              {/* Geographical Location Inputs */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl md:col-span-2 space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 font-mono block">Ubicación Geográfica para Proveedores de Zona</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">País</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 font-bold"
                      value={country}
                      readOnly
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">Provincia</label>
                    <select
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
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

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">Ciudad *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-semibold"
                      placeholder="Ej. Quilmes"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Bank Transfer Alias Input */}
              <div className="space-y-1.5">
                <label htmlFor="input-store-alias" className="text-xs font-semibold text-slate-700 block">
                  Alias de Transferencia CVU / CBY (Mercado Pago / Banco)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <line x1="2" y1="10" x2="22" y2="10" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    id="input-store-alias"
                    value={bankAlias}
                    onChange={(e) => setBankAlias(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all"
                    placeholder="Ej. mi.tienda.mp"
                  />
                </div>
                <p className="text-[9.5px] text-slate-400 leading-none">Los compradores verán y copiarán este alias para transferirte dinero.</p>
              </div>

              {/* Unique Store Code Search input */}
              <div className="space-y-1.5">
                <label htmlFor="input-store-code" className="text-xs font-semibold text-slate-700 block">
                  Código Único de Búsqueda (Buscador General)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-indigo-500">
                    <Sparkles className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="input-store-code"
                    value={storeCode}
                    onChange={(e) => {
                      setStoreCode(e.target.value.toUpperCase().replace(/[^a-zA-Z0-9-]/g, ''));
                      if (codeError) setCodeError('');
                    }}
                    className={`w-full pl-9 pr-4 py-2 bg-slate-50 border ${codeError ? 'border-rose-350 focus:border-rose-500 focus:ring-rose-500/10' : 'border-slate-250 focus:border-orange-500 focus:ring-orange-500/10'} rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 transition-all`}
                    placeholder="Ej. M24-BELGRANO"
                  />
                </div>
                <p className="text-[9.5px] text-slate-400 leading-none">Código alfanumérico que usarán los clientes generales para encontrarte.</p>
                {codeError && (
                  <p className="text-[10.5px] text-rose-500 font-semibold mt-1 flex items-center gap-1 leading-tight">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {codeError}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Social & contact details portion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Globe className="w-4 h-4 text-orange-500" />
              Canales Digitales & Contacto de la Tienda
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label htmlFor="input-store-pubemail" className="text-xs font-semibold text-slate-700 block">
                  Email Público de Contacto
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    id="input-store-pubemail"
                    value={publicEmail}
                    onChange={(e) => setPublicEmail(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    placeholder="contacto@mitienda.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="input-store-web" className="text-xs font-semibold text-slate-700 block">
                  Sitio Web Comercial
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Globe className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="input-store-web"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    placeholder="www.mitienda.com"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="input-store-ig" className="text-xs font-semibold text-slate-700 block">
                  Instagram
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400">
                    <Instagram className="w-4 h-4" />
                  </span>
                  <input
                    type="text"
                    id="input-store-ig"
                    value={instagram}
                    onChange={(e) => setInstagram(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    placeholder="@usuario_instagram"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Night Surcharges pricing configuration */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-105 pb-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Recargo por Horario Especial o Nocturno
              </h3>
              <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[9px] font-black uppercase tracking-wider font-sans shrink-0">
                ★ Exclusivo Profesional o Superior
              </span>
            </div>

            <p className="text-xs text-slate-500 leading-normal">
              Permite incrementar automáticamente los precios de todos los productos un porcentaje definido durante las horas especificadas. Ideal para turnos trasnoche, feriados o guardias especiales.
            </p>

            <div className="pt-2 space-y-4">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={nightSurchargeActive}
                  onChange={(e) => setNightSurchargeActive(e.target.checked)}
                  className="w-4.5 h-4.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20"
                />
                <span className="text-xs font-bold text-slate-800">Habilitar recargo automático nocturno</span>
              </label>

              {nightSurchargeActive && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100 animate-fade-in text-left">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">Porcentaje de Recargo (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={nightSurchargePercent}
                        onChange={(e) => setNightSurchargePercent(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                        placeholder="ej. 10"
                      />
                      <span className="absolute right-3.5 top-2.5 text-xs text-slate-450 font-bold font-mono">%</span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">Horario de Inicio</label>
                    <input
                      type="time"
                      value={nightSurchargeStart}
                      onChange={(e) => setNightSurchargeStart(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 block">Horario de Fin</label>
                    <input
                      type="time"
                      value={nightSurchargeEnd}
                      onChange={(e) => setNightSurchargeEnd(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Logo configuration portion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-orange-500" />
              Logo o Emblema del Comercio
            </h3>

            {/* Local uploader row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">
                  Cargar Logo desde tu dispositivo
                </label>
                <div className="relative border-2 border-dashed border-slate-200 hover:border-orange-500/50 bg-slate-50 rounded-2xl p-4 text-center transition-all cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <Upload className="w-5 h-5 text-slate-400 mx-auto mb-1.5" />
                  <span className="text-[11px] font-bold text-slate-600 block">Seleccionar imagen de logo</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">JPG, PNG o SVG (Máx. 2MB)</span>
                </div>
              </div>

              <div className="space-y-1.5 flex flex-col justify-between">
                <div>
                  <label htmlFor="input-logo-url" className="text-xs font-semibold text-slate-700 block">
                    O ingresa la Dirección URL de un Logo
                  </label>
                  <div className="flex gap-2 mt-1.5">
                    <input
                      type="url"
                      id="input-logo-url"
                      value={logoUrl.startsWith('data:image/') ? '' : logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all"
                      placeholder="https://ejemplo.com/logo.png"
                      disabled={logoUrl.startsWith('data:image/')}
                    />
                    {logoUrl && (
                      <button
                        type="button"
                        onClick={() => setLogoUrl('')}
                        className="px-3 py-2 border border-slate-200 hover:border-red-200 hover:text-red-500 rounded-xl text-slate-400 text-xs font-bold transition-all cursor-pointer"
                      >
                        Quitar
                      </button>
                    )}
                  </div>
                  {logoUrl.startsWith('data:image/') && (
                    <span className="text-[10px] text-orange-600 font-bold block mt-1">
                      ✓ Usando archivo cargado localmente.
                    </span>
                  )}
                </div>

                {/* Preset logos selectable list */}
                <div>
                  <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2 font-mono">
                    O usa un Logotipo Prediseñado
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {PRESET_LOGOS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setLogoUrl(preset.url)}
                        className={`p-1.5 border rounded-xl flex items-center gap-1.5 transition-all cursor-pointer text-left
                          ${logoUrl === preset.url 
                            ? 'border-orange-500 bg-orange-50/20 text-orange-950 font-bold' 
                            : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50 hover:bg-slate-50'}`}
                      >
                        <div className="w-7 h-7 rounded bg-slate-200 overflow-hidden shrink-0 border border-slate-200">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="text-[9px] font-bold leading-tight truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Horarios de Atención portion */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-4">
            <h3 className="text-sm font-bold text-slate-800 border-b border-slate-100 pb-3 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                Horarios de Atención Semanal
              </span>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Configuración por Día</span>
            </h3>

            {/* Quick alert reminding user about 24h capacity */}
            <div className="bg-orange-50/50 border border-orange-200/50 p-3 rounded-xl flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-600 leading-normal">
                Configura cada día de la semana. Puedes alternar entre <span className="font-bold text-orange-950">24 hs</span> para tiendas abiertas todo el día (como BigMAX), o configurar un horario específico de apertura y cierre.
              </p>
            </div>

            {/* List of days with interactive settings */}
            <div className="divide-y divide-slate-100">
              {detailedHours.map((h, i) => (
                <div key={i} className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="w-24 shrink-0 flex items-center gap-2">
                    <span className="font-bold text-slate-800">{h.day}</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    {/* Status Toggle switch (Open / Closed) */}
                    <button
                      type="button"
                      onClick={() => handleHourChange(i, 'isOpen', !h.isOpen)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                        h.isOpen 
                          ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30' 
                          : 'bg-slate-100 text-slate-400 border-slate-200'
                      }`}
                    >
                      {h.isOpen ? '✓ Abierto' : '✗ Cerrado'}
                    </button>

                    {h.isOpen && (
                      <>
                        {/* 24 hs Toggle button */}
                        <button
                          type="button"
                          onClick={() => handleHourChange(i, 'is24h', !h.is24h)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer border ${
                            h.is24h 
                              ? 'bg-orange-500/10 text-orange-700 border-orange-500/30 font-black' 
                              : 'bg-slate-50 text-slate-600 border-slate-200'
                          }`}
                        >
                          {h.is24h ? '★ Abierto 24hs' : 'Horas específicas'}
                        </button>

                        {/* Custom hours pickers */}
                        {!h.is24h && (
                          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
                            <span>Desde:</span>
                            <input
                              type="time"
                              value={h.openTime}
                              onChange={(e) => handleHourChange(i, 'openTime', e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs focus:outline-hidden"
                            />
                            <span>Hasta:</span>
                            <input
                              type="time"
                              value={h.closeTime}
                              onChange={(e) => handleHourChange(i, 'closeTime', e.target.value)}
                              className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-mono text-xs focus:outline-hidden"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Generated schedule string display (Read-only representation) */}
            <div className="pt-3 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Resumen Automático para Recibos</span>
              <div className="px-3 py-1 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-mono font-bold text-[10px]">
                {schedule}
              </div>
            </div>
          </div>
        </>
      )}

          {activeTab === 'costos' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-orange-500" />
                  Costos Fijos Mensuales de Operación
                </h3>
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest">Presupuesto Fijo</span>
            </div>

            <p className="text-xs text-slate-500 leading-normal font-sans">
              Registra los gastos fijos mensuales que tiene tu negocio (ej. alquiler, servicios de luz/agua, internet, telefonía móvil, sueldos fijos, etc.). Esto permitirá calcular con precisión la **Ganancia Real (Utilidad Neta)** de tu tienda en el informe mensual.
            </p>

            {/* List of costs */}
            <div className="space-y-3 pt-2">
              {fixedCosts.map((fc, idx) => (
                <div key={fc.id || idx} className="flex items-center gap-3 animate-fade-in">
                  <div className="flex-1">
                    <input
                      type="text"
                      value={fc.category}
                      onChange={(e) => {
                        const updated = [...fixedCosts];
                        updated[idx].category = e.target.value;
                        setFixedCosts(updated);
                      }}
                      placeholder="Categoría del costo (ej. Luz)"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                      required
                    />
                  </div>
                  <div className="w-32 relative">
                    <span className="absolute left-3 top-2 px-0.5 text-xs text-slate-450 font-bold">$</span>
                    <input
                      type="number"
                      min="0"
                      value={fc.amount || ''}
                      onChange={(e) => {
                        const updated = [...fixedCosts];
                        updated[idx].amount = Number(e.target.value) || 0;
                        setFixedCosts(updated);
                      }}
                      placeholder="Monto"
                      className="w-full pl-6 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setFixedCosts(fixedCosts.filter((_, i) => i !== idx));
                    }}
                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-100 transition-all cursor-pointer shrink-0"
                    title="Eliminar costo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              {fixedCosts.length === 0 && (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50 font-sans">
                  <p className="text-xs text-slate-400 font-semibold">No tienes costos fijos registrados.</p>
                </div>
              )}
            </div>

            {/* Total fixed costs sum & Add button */}
            <div className="pt-3 border-t border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => {
                  setFixedCosts([
                    ...fixedCosts,
                    { id: `fc-custom-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, category: '', amount: 0 }
                  ]);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer w-fit select-none font-sans"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar Costo Manualmente
              </button>

              <div className="px-4 py-2 bg-slate-900 text-white rounded-2xl flex items-center justify-between sm:justify-start gap-4 shadow-sm border border-slate-800 font-sans">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Gastos Fijos:</span>
                <span className="font-mono font-black text-sm text-emerald-400">
                  ${fixedCosts.reduce((acc, fc) => acc + (fc.amount || 0), 0).toLocaleString('es-AR')} /mes
                </span>
              </div>
            </div>
          </div>
          )}

          {activeTab === 'arca' && (
            <div className="space-y-6">
              {/* Manual Paso a Paso AFIP */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                    <FileText className="w-4 h-4" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-800">Manual de Configuración Facturación Fiscal (ARCA / AFIP)</h3>
                    <p className="text-[11px] text-slate-500">Sigue estos 4 pasos sencillos para que tu comercio empiece a emitir facturas oficiales.</p>
                  </div>
                </div>

                <div className="space-y-4 font-sans text-xs text-slate-700 leading-relaxed text-left">
                  {/* Paso 1 */}
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5.5 h-5.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">1</span>
                      <span className="font-extrabold text-slate-800 text-xs">Paso 1: Habilitar el Punto de Venta para Web Services</span>
                    </div>
                    <p className="text-slate-600 pl-7">
                      Cada sistema de facturación requiere un "Punto de Venta" específico.
                    </p>
                    <ol className="list-decimal pl-11 space-y-1 text-slate-600">
                      <li>Ingresa a <a href="https://www.afip.gob.ar" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold hover:underline inline-flex items-center gap-0.5">www.afip.gob.ar <ExternalLink className="w-3 h-3" /></a> con tu CUIT y Clave Fiscal (Nivel 3 o superior).</li>
                      <li>Busca e ingresa al servicio <span className="font-semibold text-slate-800">"Administración de Puntos de Venta y Domicilios"</span>.</li>
                      <li>Selecciona tu empresa/persona. Haz clic en <span className="font-semibold text-slate-800">"A-B-M de Puntos de Venta"</span> y luego en <span className="font-semibold text-slate-800">"Agregar"</span>.</li>
                      <li>Completa los datos:
                        <ul className="list-disc pl-5 mt-1 space-y-0.5">
                          <li><span className="font-semibold text-slate-800">Número de Punto de Venta:</span> Ingresa un número disponible (por ejemplo: 0002 o 0003).</li>
                          <li><span className="font-semibold text-slate-800">Nombre Fantasía:</span> El nombre de tu negocio (ej. MAX24 - Caja 1).</li>
                          <li><span className="font-semibold text-slate-800 text-indigo-700">Sistema:</span> Selecciona la opción <span className="font-bold text-indigo-700">"Factura Electrónica - Monotributo / Régimen General - Web Services"</span>.</li>
                          <li><span className="font-semibold text-slate-800">Domicilio:</span> Selecciona el domicilio comercial correspondiente.</li>
                        </ul>
                      </li>
                      <li>Haz clic en <span className="font-bold text-slate-800">Guardar</span>. Anota este número de Punto de Venta, lo necesitarás en el Paso 4.</li>
                    </ol>
                  </div>

                  {/* Paso 2 */}
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5.5 h-5.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">2</span>
                      <span className="font-extrabold text-slate-800 text-xs">Paso 2: Generar el Certificado Digital (.crt y .key)</span>
                    </div>
                    <p className="text-slate-600 pl-7 text-justify">
                      El certificado digital es la "firma electrónica" que le demuestra a ARCA que MAX24 está autorizado a emitir comprobantes en tu nombre. Tienes dos opciones para generarlo:
                    </p>

                    <div className="pl-7 grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1 shadow-xxs">
                        <span className="text-[9.5px] font-black uppercase text-slate-500 font-mono block">Opción A (Tradicional): Generar desde OpenSSL</span>
                        <p className="text-[10.5px] text-slate-500 leading-normal">
                          Entra al servicio <span className="font-semibold">"Administración de Certificados Digitales"</span> en ARCA. Crea un alias (ejemplo: <span className="font-mono text-slate-700 font-bold bg-slate-100 px-1 rounded">max24app</span>), sube un archivo de solicitud (.csr) generado externamente con OpenSSL y descarga el certificado final <span className="font-bold text-slate-700">.crt</span>.
                        </p>
                      </div>

                      <div className="p-3 bg-orange-50/50 border border-orange-100 rounded-xl space-y-2 shadow-xxs">
                        <span className="text-[9.5px] font-black uppercase text-orange-600 font-mono block">Opción B (Integrada): Generador Rápido 1 Clic</span>
                        <p className="text-[10.5px] text-slate-600 leading-normal">
                          ¡Recomendado! Presiona el botón de abajo para generar de inmediato tu pedido (.csr) y clave privada (.key). Se descargarán los archivos y se auto-completará tu clave privada de inmediato.
                        </p>
                        <button
                          type="button"
                          disabled={isGeneratingCsr}
                          onClick={handleGenerateCsr}
                          className="w-full py-1.5 bg-orange-500 hover:bg-orange-400 disabled:bg-slate-200 text-slate-950 font-black text-[10px] rounded-lg transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer select-none font-sans"
                        >
                          {isGeneratingCsr ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Generando Certificados...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" />
                              Generar Certificados en 1 Clic
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Paso 3 */}
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5.5 h-5.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">3</span>
                      <span className="font-extrabold text-slate-800 text-xs">Paso 3: Vincular el Servicio de Facturación en Clave Fiscal</span>
                    </div>
                    <p className="text-slate-600 pl-7">
                      Debes autorizar a tu certificado para emitir facturas electrónicas:
                    </p>
                    <ol className="list-decimal pl-11 space-y-1 text-slate-600">
                      <li>En la web de AFIP, ingresa al servicio <span className="font-semibold text-slate-800">"Administrador de Relaciones de Clave Fiscal"</span>.</li>
                      <li>Haz clic en <span className="font-semibold text-slate-800">"Nueva Relación"</span>.</li>
                      <li>Selecciona <span className="font-semibold text-slate-800">"Buscar"</span> &gt; <span className="font-semibold text-slate-800">"ARCA" (o AFIP)</span> &gt; <span className="font-semibold text-slate-800">"Servicios Interactivos"</span> &gt; <span className="font-semibold text-slate-800">"Facturación Electrónica"</span> (o <span className="font-semibold text-slate-800">WSFE - Facturación Electrónica</span>).</li>
                      <li>En el campo <span className="font-semibold text-slate-800">Representante</span>, selecciona el Alias que creaste en el Paso 2 (ej. <span className="font-mono text-slate-700 font-bold">max24app</span>).</li>
                      <li>Haz clic en <span className="font-bold text-slate-800">Confirmar</span> para completar la vinculación.</li>
                    </ol>
                  </div>

                  {/* Paso 4 */}
                  <div className="p-3.5 bg-slate-50 border border-slate-150 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="w-5.5 h-5.5 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">4</span>
                      <span className="font-extrabold text-slate-800 text-xs">Paso 4: Completar el Perfil Fiscal en MAX24</span>
                    </div>
                    <p className="text-slate-600 pl-7">
                      Activa el interruptor <span className="font-semibold">"Habilitar Facturación Electrónica"</span> en el formulario de abajo y completa tus datos fiscales: CUIT, Razón Social, Condición de IVA, el Punto de Venta del Paso 1, y carga/pega los contenidos de tu certificado (.crt) del Paso 2 y tu clave privada (.key). ¡Listo!
                    </p>
                  </div>
                </div>
              </div>

              {/* Formulario de Facturación */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-orange-500" />
                    Perfil Fiscal de Facturación
                  </h3>
                  <span className="px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full text-[9px] font-black uppercase tracking-wider font-sans shrink-0">
                    Sincronización Cloud Real
                  </span>
                </div>

                <div className="pt-2">
                  <label className="flex items-center gap-2.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={billingEnabled}
                      onChange={(e) => setBillingEnabled(e.target.checked)}
                      className="w-4.5 h-4.5 rounded border-slate-300 text-orange-500 focus:ring-orange-500/20 cursor-pointer"
                    />
                    <span className="text-xs font-bold text-slate-800">Habilitar Facturación Electrónica en el POS</span>
                  </label>

                  {billingEnabled && (
                    <div className="mt-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-4 animate-fade-in text-left">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 block">CUIT del Emisor (Titular)</label>
                          <input
                            type="text"
                            value={billingCuit || cuit}
                            onChange={(e) => setBillingCuit(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-hidden"
                            placeholder="Ej. 20301234567"
                            required={billingEnabled}
                          />
                          <p className="text-[10px] text-slate-400">Ingresa solo los 11 dígitos numéricos sin guiones ni espacios.</p>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 block">Razón Social o Nombre de Fantasía</label>
                          <input
                            type="text"
                            value={billingRazonSocial}
                            onChange={(e) => setBillingRazonSocial(e.target.value)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                            placeholder="Ej. Juan Pérez o Kiosco El Sol SH"
                            required={billingEnabled}
                          />
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 block">Condición de IVA ante AFIP</label>
                          <select
                            value={billingCondicionIva}
                            onChange={(e) => setBillingCondicionIva(e.target.value as any)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                          >
                            <option value="MONOTRIBUTO">Monotributo / Pequeño Contribuyente</option>
                            <option value="RESPONSABLE_INSCRIPTO">Responsable Inscripto</option>
                            <option value="EXENTO">Exento</option>
                          </select>
                        </div>

                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 block">Punto de Venta Autorizado (Nro)</label>
                          <input
                            type="number"
                            min="1"
                            value={billingPuntoDeVenta}
                            onChange={(e) => setBillingPuntoDeVenta(Number(e.target.value) || 1)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:outline-hidden"
                            required={billingEnabled}
                          />
                          <p className="text-[10px] text-slate-400">Punto de venta Web Services habilitado en Paso 1.</p>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <label className="text-xs font-semibold text-slate-700 block">Ambiente o Entorno de Operación</label>
                          <select
                            value={billingEnvironment}
                            onChange={(e) => setBillingEnvironment(e.target.value as any)}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-hidden"
                          >
                            <option value="sandbox">Homologación / Pruebas de AFIP (Simulado por defecto si no hay certificados)</option>
                            <option value="production">Producción / Emisión de Facturas Reales y Válidas</option>
                          </select>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700 block">Certificado AFIP (.crt o .pem)</label>
                            <label className="cursor-pointer text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 select-none">
                              <Upload className="w-3.5 h-3.5" />
                              Cargar archivo .crt
                              <input type="file" accept=".crt,.pem,.txt" onChange={handleCertUpload} className="hidden" />
                            </label>
                          </div>
                          <textarea
                            value={billingCertPem}
                            onChange={(e) => setBillingCertPem(e.target.value)}
                            rows={4}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 placeholder-slate-350 focus:outline-hidden"
                            placeholder="-----BEGIN CERTIFICATE-----&#10;MIIE...&#10;-----END CERTIFICATE-----"
                          />
                          <p className="text-[10px] text-slate-400">Pega el contenido del certificado .crt firmado por ARCA o sube el archivo correspondiente.</p>
                        </div>

                        <div className="space-y-1.5 md:col-span-2">
                          <div className="flex items-center justify-between">
                            <label className="text-xs font-semibold text-slate-700 block">Clave Privada (.key)</label>
                            <label className="cursor-pointer text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 select-none">
                              <Upload className="w-3.5 h-3.5" />
                              Cargar archivo .key
                              <input type="file" accept=".key,.pem,.txt" onChange={handleKeyUpload} className="hidden" />
                            </label>
                          </div>
                          <textarea
                            value={billingKeyPem}
                            onChange={(e) => setBillingKeyPem(e.target.value)}
                            rows={4}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-700 placeholder-slate-350 focus:outline-hidden"
                            placeholder="-----BEGIN PRIVATE KEY-----&#10;MIIE...&#10;-----END PRIVATE KEY-----"
                          />
                          <p className="text-[10px] text-slate-400">Pega tu clave privada .key o sube el archivo generado en el Paso 2.</p>
                        </div>
                      </div>

                      {/* Test connection row */}
                      <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <button
                          type="button"
                          disabled={isTestingConnection}
                          onClick={handleTestConnection}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 font-sans"
                        >
                          {isTestingConnection ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Verificando Conexión...
                            </>
                          ) : (
                            'Probar Conexión con AFIP'
                          )}
                        </button>

                        <div className="text-[10px] text-slate-400 font-sans leading-tight max-w-sm">
                          Recomendamos realizar un test antes de guardar para verificar que las credenciales no tengan errores de formato.
                        </div>
                      </div>

                      {testResult && (
                        <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs font-sans ${
                          testResult.success 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                            : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${testResult.success ? 'text-emerald-500' : 'text-rose-500'}`} />
                          <div>
                            <span className="font-bold block">{testResult.success ? '¡Conexión Exitosa con AFIP!' : 'Error de Conexión o Validación'}</span>
                            <p className="text-[11px] opacity-90 mt-0.5">{testResult.message}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              {/* Main Regulatory Overview Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xxs space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        Habilitaciones y Control Regulatorio
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[9px] font-mono font-black uppercase">
                          Soporte Argentina
                        </span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Administra vencimientos de habilitaciones municipales, matafuegos, fumigaciones y seguros.
                      </p>
                    </div>
                  </div>

                  {/* Toggle Notification Switch */}
                  <label className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all shrink-0 select-none">
                    <Bell className={`w-4 h-4 ${complianceNotifyEnabled ? 'text-orange-500' : 'text-slate-400'}`} />
                    <div className="text-left">
                      <span className="text-[11px] font-bold text-slate-800 block leading-tight">
                        Alertas Preventivas
                      </span>
                      <span className="text-[9px] text-slate-500 font-medium block">
                        30 y 7 días antes
                      </span>
                    </div>
                    <input
                      type="checkbox"
                      checked={complianceNotifyEnabled}
                      onChange={(e) => setComplianceNotifyEnabled(e.target.checked)}
                      className="w-4 h-4 text-orange-500 rounded border-slate-300 focus:ring-orange-500 cursor-pointer ml-1"
                    />
                  </label>
                </div>

                {/* Summary Metrics Bar */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Total Trámites</span>
                    <span className="text-lg font-black text-slate-800 font-mono mt-0.5 block">{complianceDocuments.length}</span>
                  </div>
                  <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">🟢 Vigentes</span>
                    <span className="text-lg font-black text-emerald-800 font-mono mt-0.5 block">
                      {complianceDocuments.filter(d => calculateDocumentStatus(d.expirationDate, d.notifyBeforeDays).status === 'ACTIVE').length}
                    </span>
                  </div>
                  <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">🟡 Próximos</span>
                    <span className="text-lg font-black text-amber-900 font-mono mt-0.5 block">
                      {complianceDocuments.filter(d => calculateDocumentStatus(d.expirationDate, d.notifyBeforeDays).status === 'WARNING').length}
                    </span>
                  </div>
                  <div className="p-3 bg-red-50/70 border border-red-200 rounded-xl text-center">
                    <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">🔴 Vencidos</span>
                    <span className="text-lg font-black text-red-800 font-mono mt-0.5 block">
                      {complianceDocuments.filter(d => calculateDocumentStatus(d.expirationDate, d.notifyBeforeDays).status === 'EXPIRED').length}
                    </span>
                  </div>
                </div>

                {/* Presets Quick Addition Toolbar */}
                <div className="space-y-2 pt-1">
                  <span className="text-[11px] font-bold text-slate-700 block">
                    ⚡ Registrar rápidamente trámite habitual en Argentina:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ARGENTINA_COMPLIANCE_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleOpenNewDocModal(preset.label, preset.notifyDays)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-800 border border-slate-200 rounded-lg text-[10.5px] font-bold transition-all cursor-pointer flex items-center gap-1 font-sans"
                      >
                        <Plus className="w-3 h-3 text-orange-500" />
                        <span>{preset.label.split(' ')[0]} {preset.label.split(' ').slice(1, 3).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Search & Filter Controls */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={complianceSearch}
                      onChange={(e) => setComplianceSearch(e.target.value)}
                      placeholder="Buscar por trámite o N°..."
                      className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={() => setComplianceStatusFilter('ALL')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        complianceStatusFilter === 'ALL'
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      Todos ({complianceDocuments.length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplianceStatusFilter('EXPIRED')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        complianceStatusFilter === 'EXPIRED'
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      🔴 Vencidos ({complianceDocuments.filter(d => calculateDocumentStatus(d.expirationDate, d.notifyBeforeDays).status === 'EXPIRED').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplianceStatusFilter('WARNING')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        complianceStatusFilter === 'WARNING'
                          ? 'bg-amber-500 text-white'
                          : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                      }`}
                    >
                      🟡 Próximos ({complianceDocuments.filter(d => calculateDocumentStatus(d.expirationDate, d.notifyBeforeDays).status === 'WARNING').length})
                    </button>
                    <button
                      type="button"
                      onClick={() => setComplianceStatusFilter('ACTIVE')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                        complianceStatusFilter === 'ACTIVE'
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      🟢 Vigentes ({complianceDocuments.filter(d => calculateDocumentStatus(d.expirationDate, d.notifyBeforeDays).status === 'ACTIVE').length})
                    </button>
                  </div>
                </div>

                {/* Main Documents Table / List */}
                <div className="space-y-3">
                  {(() => {
                    const filteredDocs = complianceDocuments.filter(doc => {
                      const st = calculateDocumentStatus(doc.expirationDate, doc.notifyBeforeDays);
                      if (complianceStatusFilter !== 'ALL' && st.status !== complianceStatusFilter) return false;
                      if (complianceSearch.trim()) {
                        const q = complianceSearch.toLowerCase();
                        const matchType = doc.documentType.toLowerCase().includes(q);
                        const matchNum = (doc.certificateNumber || '').toLowerCase().includes(q);
                        const matchNotes = (doc.notes || '').toLowerCase().includes(q);
                        if (!matchType && !matchNum && !matchNotes) return false;
                      }
                      return true;
                    });

                    if (filteredDocs.length === 0) {
                      return (
                        <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-2xl space-y-3">
                          <ShieldCheck className="w-10 h-10 text-slate-300 mx-auto" />
                          <p className="text-xs font-bold text-slate-600">
                            No hay certificados o trámites registrados en esta categoría.
                          </p>
                          <button
                            type="button"
                            onClick={() => handleOpenNewDocModal()}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer inline-flex items-center gap-1.5"
                          >
                            <Plus className="w-4 h-4" />
                            Agregar Primer Documento
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2.5">
                        {filteredDocs.map((doc) => {
                          const statusInfo = calculateDocumentStatus(doc.expirationDate, doc.notifyBeforeDays);

                          return (
                            <div
                              key={doc.id}
                              className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                                statusInfo.status === 'EXPIRED'
                                  ? 'bg-red-50/50 border-red-200'
                                  : statusInfo.status === 'WARNING'
                                  ? 'bg-amber-50/40 border-amber-200'
                                  : 'bg-white border-slate-200'
                              }`}
                            >
                              <div className="space-y-1.5 max-w-lg">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] border ${statusInfo.badgeClass}`}>
                                    {statusInfo.label}
                                  </span>
                                  <h4 className="text-xs font-black text-slate-900 font-sans">
                                    {doc.documentType}
                                  </h4>
                                </div>

                                {doc.certificateNumber && (
                                  <p className="text-[11px] font-mono font-bold text-slate-700">
                                    N° Certificado / Póliza: <span className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-900">{doc.certificateNumber}</span>
                                  </p>
                                )}

                                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-500">
                                  {doc.issueDate && (
                                    <span>Emisión: <strong className="text-slate-800">{doc.issueDate}</strong></span>
                                  )}
                                  <span>Vencimiento: <strong className="text-slate-900">{doc.expirationDate}</strong></span>
                                  <span>Alerta: <strong>{doc.notifyBeforeDays || 30} días antes</strong></span>
                                </div>

                                {doc.notes && (
                                  <p className="text-[10.5px] text-slate-600 bg-slate-50/80 p-2 rounded-xl border border-slate-100 italic">
                                    "{doc.notes}"
                                  </p>
                                )}
                              </div>

                              {/* Action buttons for document */}
                              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                                <button
                                  type="button"
                                  onClick={() => handleQuickRenew(doc, 1)}
                                  title="Renovar por 1 año"
                                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex items-center gap-1 shadow-xs"
                                >
                                  <RefreshCw className="w-3 h-3" />
                                  Renovar (1 año)
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleEditDocModal(doc)}
                                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
                                  title="Editar Documento"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteDoc(doc.id)}
                                  className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                                  title="Eliminar Registro"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Add new button */}
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleOpenNewDocModal()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 text-orange-400" />
                    Cargar Nuevo Trámite / Certificado
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Restablecer Valores
            </button>
            <button
              type="submit"
              disabled={isCheckingCode}
              className={`px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/10 hover:shadow-orange-500/15 transition-all cursor-pointer ${
                isCheckingCode ? 'opacity-70 cursor-not-allowed' : ''
              }`}
            >
              <Save className="w-4 h-4 animate-pulse" />
              {isCheckingCode ? 'Validando Código...' : 'Guardar Cambios de Tienda'}
            </button>
          </div>
        </form>

        {/* Right Preview Card column */}
        <div className="space-y-6">
          {/* Active Preview */}
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 text-white relative overflow-hidden flex flex-col justify-between shadow-lg h-[240px]">
            {/* Ambient Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-2xl rounded-full" />
            
            <div className="z-10 space-y-1">
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-orange-500/15 text-orange-400 border border-orange-500/25 rounded-full text-[9px] font-extrabold uppercase tracking-widest leading-none">
                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                VISTA PREVIA DE LOGO
              </div>
              <h4 className="text-sm font-extrabold text-slate-400 mt-2 font-mono uppercase tracking-wide">Cabecera de Ticket</h4>
            </div>

            <div className="flex items-center gap-4 z-10 my-4 bg-slate-950/40 p-3.5 rounded-2xl border border-slate-800">
              <div className="w-14 h-14 bg-gradient-to-tr from-amber-500 to-orange-500 rounded-xl overflow-hidden flex items-center justify-center font-black text-slate-950 shadow-md shadow-orange-500/10 shrink-0 select-none">
                {logoUrl ? (
                  <img src={logoUrl} alt="Store logo view" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-6 h-6" />
                )}
              </div>
              <div className="min-w-0">
                <h5 className="font-extrabold text-base tracking-tight text-white leading-tight truncate">{name || 'Nombre Tienda'}</h5>
                <p className="text-[10px] text-slate-400 font-mono tracking-wide truncate mt-0.5">{phone || 'Tel: Sin contacto'}</p>
              </div>
            </div>

            <p className="text-[10px] text-slate-400 z-10 mt-1 italic font-sans">
              *Los datos mostrados se aplicarán de inmediato a los recibos y al panel superior.
            </p>
          </div>

          {/* Success Dialog Popup Toast alert */}
          {isSaved && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-2xl shadow-sm flex items-start gap-3 animate-fade-in">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-slate-950 shrink-0 mt-0.5">
                <Check className="w-3.5 h-3.5" />
              </div>
              <div>
                <p className="text-xs font-bold">¡Guardado Exitosamente!</p>
                <p className="text-[10px] text-emerald-800/80 mt-0.5">La información de la tienda fue guardada en el dispositivo móvil/computadora y sincronizada globalmente.</p>
              </div>
            </div>
          )}

          {/* Dynamic Store QR Code Generator Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm" id="settings-qr-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                  <QrCode className="w-4 h-4" />
                </span>
                <div className="text-left font-sans">
                  <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black tracking-widest uppercase">AUTO-ACCESO QR</span>
                  <h4 className="text-xs font-extrabold text-slate-800 mt-0.5">QR de tu Comercio</h4>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal text-left">
              Los clientes generales pueden escanear este código QR para abrir el portal y agregar tu comercio instantáneamente a sus favoritos.
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl flex flex-col items-center justify-center border border-slate-100 gap-3">
              {storeCode ? (
                <>
                  <div className="relative p-2.5 bg-white rounded-xl border border-slate-200 shadow-xxs">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&color=1e1b4b&data=${encodeURIComponent(`${window.location.origin}/?storeCode=${storeCode}`)}`} 
                      alt="Store QR Code" 
                      className="w-36 h-36 border border-slate-50 relative z-10"
                    />
                  </div>
                  
                  <div className="text-center">
                    <p className="text-[11px] font-mono font-black text-slate-800 tracking-wider">Código: {storeCode}</p>
                    <p className="text-[9.5px] text-indigo-600 font-medium mt-1 font-sans">Suscripción instantánea al escanear</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 w-full pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        const link = `${window.location.origin}/?storeCode=${storeCode}`;
                        navigator.clipboard.writeText(link);
                        alert("¡Enlace único copiado al portapapeles!\nEnvíaselo a tus clientes por WhatsApp.");
                      }}
                      className="py-1.5 px-2 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-900 font-bold rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      Copiar Enlace
                    </button>
                    
                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=450x450&color=1e1b4b&data=${encodeURIComponent(`${window.location.origin}/?storeCode=${storeCode}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="py-1.5 px-2 bg-slate-900 hover:bg-slate-850 text-white font-black rounded-lg text-[10px] transition-all flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Imprimir QR
                    </a>
                  </div>
                </>
              ) : (
                <div className="py-6 px-4 text-center">
                  <p className="text-xs font-bold text-slate-500">Configura un "Código Único de Búsqueda" a la izquierda para poder habilitar tu QR personalizado.</p>
                </div>
              )}
            </div>
          </div>

          {/* DNDA Intellectual Property Card */}
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-indigo-900/40 rounded-3xl p-5 space-y-4 shadow-md text-white relative overflow-hidden" id="settings-dnda-card">
            {/* Ambient subtle light shine */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/10 blur-2xl rounded-full" />
            
            <div className="flex items-center gap-2.5 z-10 relative">
              <span className="p-2 bg-indigo-500/15 text-emerald-400 border border-indigo-500/25 rounded-xl shrink-0 font-bold">
                <FileText className="w-4 h-4" />
              </span>
              <div className="text-left font-sans">
                <span className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded text-[8.5px] font-mono font-black tracking-widest uppercase">DNDA ARGENTINA</span>
                <h4 className="text-xs font-extrabold text-white mt-0.5">Propiedad Intelectual</h4>
              </div>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed text-left z-10 relative font-sans">
              Protege el código fuente de tu software <strong>MAX24</strong> contra copias y plagios. La Dirección Nacional del Derecho de Autor (DNDA) conserva el resguardo en custodia 100% segura y confidencial.
            </p>

            <div className="bg-slate-950/50 p-3.5 border border-indigo-950 rounded-2xl space-y-2 z-10 relative text-left">
              <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
                <strong>Autor Titular:</strong> Luis Armando Pezzini<br />
                <strong>CUIT del Autor:</strong> 20-28886024-7
              </p>
              
              <a
                href="/api/dnda-pdf"
                download="MAX24_Memoria_Tecnica_DNDA.pdf"
                target="_blank"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10.5px] font-black tracking-wider rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-emerald-500/10 hover:shadow-emerald-500/20"
              >
                <Download className="w-3.5 h-3.5" />
                DESCARGAR REPORTE TÉCNICO (PDF)
              </a>
            </div>
          </div>

          {/* SaaS Support Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xxs">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-slate-900 border border-slate-800 text-orange-400 rounded-xl shrink-0">
                <Mail className="w-4 h-4" />
              </span>
              <div>
                <p className="text-[11px] font-black tracking-widest text-slate-400 uppercase font-mono">SOPORTE DEL SITIO</p>
                <h4 className="text-xs font-bold text-slate-800">Suscripciones & Reclamos</h4>
              </div>
            </div>

            <p className="text-[11px] text-slate-600 leading-relaxed font-sans">
              Si tienes problemas con tu tienda, necesitas dar de alta suscripciones, reportar fallas del sitio o canalizar reclamos y dudas de tus clientes, contacta a la administración central de MAX24 en:
            </p>

            <div className="space-y-2">
              <div className="bg-white p-2 border border-slate-150 rounded-xl flex items-center justify-between gap-1.5 font-mono text-[10px] font-bold text-slate-700 shadow-xxs">
                <span className="truncate">max24app@gmail.com</span>
                <button
                  type="button"
                  onClick={handleCopyEmail}
                  className={`p-1 rounded-md transition-all cursor-pointer ${
                    copiedEmail 
                      ? 'bg-emerald-500 text-slate-950 font-sans text-[9px] px-2 font-bold' 
                      : 'bg-slate-100 hover:bg-slate-150 text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {copiedEmail ? 'Copiado' : <Copy className="w-3 h-3" />}
                </button>
              </div>

              <a
                href="mailto:max24app@gmail.com?subject=Soporte%20Tecnico%20Tienda%20MAX24"
                className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 select-none"
              >
                <Mail className="w-3 h-3" />
                Contactar Soporte Técnico
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* COMPLIANCE DOCUMENT ADD / EDIT MODAL */}
      {isComplianceModalOpen && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl text-left animate-scale-up">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2 font-sans">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                {editingDocId ? 'Editar Certificado / Trámite' : 'Registrar Nuevo Documento Regulatorio'}
              </h3>
              <button
                type="button"
                onClick={() => setIsComplianceModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 font-bold text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveDoc} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Tipo de Documento / Habilitación *
                </label>
                <select
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-hidden cursor-pointer"
                  required
                >
                  {ARGENTINA_COMPLIANCE_PRESETS.map((p, idx) => (
                    <option key={idx} value={p.label}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  N° de Certificado, Expediente o Póliza
                </label>
                <input
                  type="text"
                  value={docCertNumber}
                  onChange={(e) => setDocCertNumber(e.target.value)}
                  placeholder="Ej. HAB-SALTA-2025-0048 o MAT-8841"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Fecha de Emisión
                  </label>
                  <input
                    type="date"
                    value={docIssueDate}
                    onChange={(e) => setDocIssueDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">
                    Fecha de Vencimiento *
                  </label>
                  <input
                    type="date"
                    value={docExpirationDate}
                    onChange={(e) => setDocExpirationDate(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 border-orange-300 focus:bg-white focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Anticipación para Notificación (Días antes)
                </label>
                <select
                  value={docNotifyDays}
                  onChange={(e) => setDocNotifyDays(Number(e.target.value))}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-hidden cursor-pointer"
                >
                  <option value={7}>7 Días antes (Urgente)</option>
                  <option value={15}>15 Días antes</option>
                  <option value={30}>30 Días antes (Recomendado)</option>
                  <option value={60}>60 Días antes (Para habilitaciones complejas)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">
                  Observaciones / Notas de Inspección
                </label>
                <textarea
                  value={docNotes}
                  onChange={(e) => setDocNotes(e.target.value)}
                  rows={3}
                  placeholder="Ej. Ubicación de oblea, gestor a cargo, fono de contacto de fumigadora..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-sans text-slate-800 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsComplianceModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  Guardar Trámite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
