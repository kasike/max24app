import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Clock, 
  Mail, 
  FileText, 
  Sparkles, 
  Upload, 
  ArrowRight, 
  ArrowLeft, 
  Check, 
  Instagram, 
  Globe 
} from 'lucide-react';
import { StoreSettings } from '../types';

interface StoreSetupWizardProps {
  initialSettings: StoreSettings;
  onComplete: (settings: StoreSettings) => void;
  currentUserEmail: string;
  onClose?: () => void;
}

const PRESET_LOGOS = [
  { name: 'Naranja Eléctrico', fontColor: '#ffffff', gradient: 'from-amber-500 to-orange-500', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=120' },
  { name: 'Moderna Esencia', fontColor: '#ffffff', gradient: 'from-sky-500 to-indigo-600', url: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&q=80&w=120' },
  { name: 'Minimalista Negro', fontColor: '#ffffff', gradient: 'from-slate-800 to-slate-950', url: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=120' }
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

export default function StoreSetupWizard({ initialSettings, onComplete, currentUserEmail, onClose }: StoreSetupWizardProps) {
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  // Form states
  const [name, setName] = useState(initialSettings.name || '');
  const [address, setAddress] = useState(initialSettings.address || '');
  const [phone, setPhone] = useState(initialSettings.phone || '');
  const [logoUrl, setLogoUrl] = useState(initialSettings.logoUrl || '');
  const [cuit, setCuit] = useState(initialSettings.cuit || '');
  const [email, setEmail] = useState(initialSettings.email || currentUserEmail || '');
  const [website, setWebsite] = useState(initialSettings.website || '');
  const [instagram, setInstagram] = useState(initialSettings.instagram || '');
  const [country, setCountry] = useState(initialSettings.country || 'Argentina');
  const [province, setProvince] = useState(initialSettings.province || 'CABA');
  const [city, setCity] = useState(initialSettings.city || 'Belgrano');
  
  // Hours strategy: 'standard' | '24h' | 'custom'
  const [hoursStrategy, setHoursStrategy] = useState<'standard' | '24h' | 'custom'>('standard');
  const [detailedHours, setDetailedHours] = useState(initialSettings.detailedHours || DEFAULT_DETAILED_HOURS);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("El archivo supera el tamaño máximo de 2 MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      if (!name.trim()) {
        alert("Por favor ingrese el nombre de la tienda para continuar.");
        return;
      }
      if (!address.trim()) {
        alert("La dirección física del comercio es requerida.");
        return;
      }
    }
    if (step < totalSteps) {
      setStep(step + 1);
    }
  };

  const handlePrev = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const generateScheduleSummaryLocal = () => {
    if (hoursStrategy === '24h') {
      return "Abierto las 24 horas (Todos los días)";
    }
    if (hoursStrategy === 'standard') {
      return "Lunes a Sábado de 08:00 a 22:00 hs";
    }

    // Custom flow
    const openDays = detailedHours.filter(h => h.isOpen);
    if (openDays.length === 7 && openDays.every(h => h.is24h)) {
      return "Abierto las 24 horas (Todos los días)";
    }
    if (openDays.length === 0) {
      return "Cerrado temporalmente";
    }
    const monSatSame = detailedHours.slice(0, 6).every(h => 
      h.isOpen === detailedHours[0].isOpen && 
      h.is24h === detailedHours[0].is24h && 
      h.openTime === detailedHours[0].openTime && 
      h.closeTime === detailedHours[0].closeTime
    );

    if (monSatSame) {
      const first = detailedHours[0];
      const sunday = detailedHours[6];
      let summary = '';
      if (first.isOpen) {
        summary += `Lun a Sáb: ${first.is24h ? '24 hs' : `${first.openTime} a ${first.closeTime} hs`}`;
      } else {
        summary += 'Lun a Sáb: Cerrado';
      }
      summary += `, Dom: ${sunday.isOpen ? (sunday.is24h ? '24 hs' : `${sunday.openTime} a ${sunday.closeTime} hs`) : 'Cerrado'}`;
      return summary;
    }
    
    return openDays.map(h => `${h.day.slice(0, 3)}: ${h.is24h ? '24h' : `${h.openTime}-${h.closeTime}`}`).join(', ');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !address.trim()) {
      alert("Completá los campos obligatorios del Paso 1.");
      setStep(1);
      return;
    }

    // Compose final hours structure
    let finalHours = detailedHours;
    if (hoursStrategy === '24h') {
      finalHours = detailedHours.map(h => ({ ...h, isOpen: true, is24h: true }));
    } else if (hoursStrategy === 'standard') {
      finalHours = DEFAULT_DETAILED_HOURS;
    }

    const finalSettings: StoreSettings = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim() || '+54 11 4455-6677',
      logoUrl: logoUrl || undefined,
      schedule: generateScheduleSummaryLocal(),
      cuit: cuit.trim() || undefined,
      email: email.trim() || undefined,
      website: website.trim() || undefined,
      instagram: instagram.trim() || undefined,
      detailedHours: finalHours,
      country,
      province,
      city: city.trim(),
      isConfigured: true // Configuration complete!
    };

    onComplete(finalSettings);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto font-sans text-slate-800 antialiased">
      <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Wizard Header Banner */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-6 relative shrink-0">
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-amber-350 animate-pulse" />
              <span className="text-[10px] uppercase font-bold tracking-widest text-orange-50 font-mono">Primer Ingreso</span>
            </div>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 px-2 bg-white/10 hover:bg-white/20 text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                title="Cerrar y omitir por ahora"
              >
                ✕
              </button>
            )}
          </div>
          <h2 className="text-xl font-black tracking-tight flex items-center gap-2.5 font-sans">
            🚀 Bienvenido/a a MAX24 express
          </h2>
          <p className="text-xs text-orange-50/90 mt-1 font-sans">
            Vamos a configurar los detalles fundamentales para personalizar tu punto de venta en segundos.
          </p>

          {/* Step Indicator Bubbles */}
          <div className="flex items-center gap-4 mt-6">
            {[1, 2, 3].map((num) => (
              <div key={num} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black transition-all font-mono
                  ${step === num 
                    ? 'bg-white text-orange-600 ring-4 ring-white/20 scale-110 shadow-md' 
                    : step > num 
                      ? 'bg-orange-400 text-orange-950 font-bold' 
                      : 'bg-orange-600/50 text-orange-200'
                  }
                `}>
                  {step > num ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : num}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-wider
                  ${step === num ? 'text-white' : 'text-orange-200'}
                `}>
                  {num === 1 ? 'Perﬁl' : num === 2 ? 'Identidad' : 'Contacto'}
                </span>
                {num < 3 && <div className="w-8 h-0.5 bg-orange-400/35" />}
              </div>
            ))}
          </div>
        </div>

        {/* Wizard Main Content Container */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
          
          {step === 1 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 font-sans">
                  <Building2 className="w-4.5 h-4.5 text-orange-500" />
                  Paso 1: Información Principal
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Dinos el nombre formal de tu comercio y su ubicación para las facturas.</p>
              </div>

              {/* Name field */}
              <div className="space-y-1.5 animate-slide-up">
                <label className="text-xs font-bold text-slate-700 block">
                  Nombre de tu Comercio <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <Building2 className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej. BigMAX 24 Horas"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    required
                  />
                </div>
              </div>

              {/* Address field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Dirección Comercial Física <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <MapPin className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ej. Av. Corrientes 2424, CABA, Argentina"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    required
                  />
                </div>
              </div>

              {/* CUIT / NIT field */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  CUIT / Identificación Comercial (ID Tributaria)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400">
                    <FileText className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type="text"
                    value={cuit}
                    onChange={(e) => setCuit(e.target.value)}
                    placeholder="Ej. 30-74859632-9 (Opcional)"
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                  />
                </div>
                <p className="text-[10px] text-slate-450 italic mt-1 font-mono">Este número figurará al pie de los tickets de venta impresos.</p>
              </div>

              {/* Location Fields (Country, Province, City) */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl space-y-3">
                <span className="text-[10px] font-black uppercase tracking-wider text-orange-600 font-mono">Ubicación Geográfica (Necesario para Proveedores/Clientes)</span>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">País</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-slate-200 border border-slate-300 rounded-xl text-xs text-slate-500 font-bold"
                      value={country}
                      readOnly
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Provincia </label>
                    <select
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
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

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-600">Ciudad *</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 font-bold"
                      placeholder="Ej. Quilmes"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 font-sans">
                  <Upload className="w-4.5 h-4.5 text-orange-500" />
                  Paso 2: Imagen e Identidad de tu Tienda
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Sube el logotipo oficial de tu negocio o selecciona uno de nuestros pre-diseños.</p>
              </div>

              {/* Logo Selection Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 block">Tu Logotipo de Tienda</label>
                  
                  {/* Current Preview */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-orange-100 border-2 border-orange-200 flex items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {logoUrl ? (
                        <img 
                          src={logoUrl} 
                          alt="Logo Preview" 
                          className="w-full h-full object-cover" 
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center font-black text-xs text-orange-600 font-mono">
                          {name?.slice(0,2).toUpperCase() || 'M2'}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-700 leading-tight">Previsualización</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-sans">Así lucirá el ícono de tu local.</p>
                      {logoUrl && (
                        <button 
                          type="button" 
                          onClick={() => setLogoUrl('')} 
                          className="text-[10px] text-red-500 font-bold hover:underline mt-1 cursor-pointer"
                        >
                          Eliminar logotipo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Upload Button */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">Sube un archivo de imagen</label>
                  <label className="relative flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-orange-400 bg-white hover:bg-orange-50/20 py-3 px-4 rounded-xl cursor-pointer group transition-all text-center">
                    <Upload className="w-5 h-5 text-slate-400 group-hover:text-orange-500 transition-colors" />
                    <span className="text-[10px] font-bold text-slate-600 mt-1">Sugerido PNG, JPG máx. 2MB</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>

              {/* Preset suggestion */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">O elige un logotipo de identidad rápida:</label>
                <div className="grid grid-cols-3 gap-2">
                  {PRESET_LOGOS.map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLogoUrl(p.url)}
                      className="p-1 px-1.5 border border-slate-200 hover:border-orange-500 bg-white hover:bg-slate-50 rounded-xl flex items-center gap-2 cursor-pointer transition-all text-left"
                    >
                      <img src={p.url} className="w-7 h-7 rounded-md object-cover" referrerPolicy="no-referrer" alt="" />
                      <span className="text-[9px] font-bold text-slate-600 truncate">{p.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Digital assets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Sitio Web de tu Comercio</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400">
                      <Globe className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      placeholder="Ej. www.bigmax24.com"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">Instagram Comercial</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400">
                      <Instagram className="w-4 h-4" />
                    </span>
                    <input
                      type="text"
                      value={instagram}
                      onChange={(e) => setInstagram(e.target.value)}
                      placeholder="Ej. @bigmax_24hs"
                      className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5 animate-fade-in">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 font-sans">
                  <Phone className="w-4.5 h-4.5 text-orange-500" />
                  Paso 3: Contacto y Horarios de Atención
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Define cómo se contactarán tus clientes y los horarios del comercio.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Whatsapp field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    WhatsApp o Celular del Comercio <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400">
                      <Phone className="w-4.5 h-4.5 border-r border-slate-200 pr-1.5" />
                    </span>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="Ej. +54 11 7766-5544"
                      className="w-full pl-11 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-slate-450">Usado para enviar remitos de cobranzas por WA.</p>
                </div>

                {/* Email field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block">
                    Email de Atención Público
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-slate-400">
                      <Mail className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Ej. consultas@bigmax.com"
                      className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
                    />
                  </div>
                </div>
              </div>

              {/* Schedule definition */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3.5">
                <label className="text-xs font-bold text-slate-700 block">Horarios de Atención</label>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setHoursStrategy('standard')}
                    className={`p-3 border rounded-xl text-xs font-bold font-sans cursor-pointer transition-all flex flex-col gap-1 items-start
                      ${hoursStrategy === 'standard' 
                        ? 'border-orange-500 bg-orange-50/30 text-orange-900 shadow-xxs' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="flex items-center gap-1.5 text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-orange-500" />
                      Lunes a Sábado
                    </span>
                    <p className="text-[10px] text-slate-450 normal-case font-normal font-sans">08:00 hs a 22:00 hs. Domingos Cerrado.</p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setHoursStrategy('24h')}
                    className={`p-3 border rounded-xl text-xs font-bold font-sans cursor-pointer transition-all flex flex-col gap-1 items-start
                      ${hoursStrategy === '24h' 
                        ? 'border-orange-500 bg-orange-50/30 text-orange-900 shadow-xxs' 
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }
                    `}
                  >
                    <span className="flex items-center gap-1.5 text-slate-800">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                      Abierto 24 Horas
                    </span>
                    <p className="text-[10px] text-slate-450 normal-case font-normal font-sans">Siempre activo, todos los días (Feriados inclusive).</p>
                  </button>
                </div>

                <div className="text-[11px] text-slate-500 flex flex-col gap-1 mt-2 bg-white p-2.5 rounded-xl border border-slate-200/50">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                    <span>
                      <strong>Resumen del Horario:</strong> {generateScheduleSummaryLocal()}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 pl-5">
                    💡 <em>Podrás personalizar horarios específicos día por día (ej. 09:00 a 21:00) en el menú Ajustes → Tienda cuando quieras.</em>
                  </p>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Wizard Action Footer Bar */}
        <div className="bg-slate-50 border-t border-slate-200/80 p-5 shrink-0 flex items-center justify-between">
          <button
            type="button"
            onClick={handlePrev}
            disabled={step === 1}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer
              ${step === 1 
                ? 'text-slate-350 bg-transparent cursor-not-allowed' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }
            `}
          >
            <ArrowLeft className="w-4 h-4" />
            Atrás
          </button>

          {step < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              className="px-6 py-2.5 bg-orange-550 hover:bg-orange-650 text-white rounded-xl text-xs font-black tracking-wide transition-all shadow-lg shadow-orange-500/10 flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4 text-white" />
              Finalizar Configuración
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
