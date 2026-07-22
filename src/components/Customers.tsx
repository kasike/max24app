import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  X, 
  Send, 
  MessageSquare, 
  CheckCircle, 
  Sparkles, 
  PhoneCall, 
  Megaphone,
  UserCheck
} from 'lucide-react';
import { Customer } from '../types';

interface CustomersProps {
  customers: Customer[];
  onAddCustomer: (customer: Omit<Customer, 'id'>) => Customer;
  onUpdateCustomer: (customer: Customer) => void;
  onDeleteCustomer: (id: string) => void;
}

export default function Customers({
  customers,
  onAddCustomer,
  onUpdateCustomer,
  onDeleteCustomer
}: CustomersProps) {
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');

  // Customer Form Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Form Fields
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formDocId, setFormDocId] = useState('');
  const [formAddress, setFormAddress] = useState('');

  // Save/Edit success states for inside the modal
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // WhatsApp Single Message Modal
  const [isWAPopUpOpen, setIsWAPopUpOpen] = useState(false);
  const [waCustomer, setWaCustomer] = useState<Customer | null>(null);
  const [waMessage, setWaMessage] = useState('');
  const [waTemplateSelected, setWaTemplateSelected] = useState<string>('custom');

  // WhatsApp Broadcast Campaign (Bulk Publicity) Modal
  const [isBroadcastOpen, setIsBroadcastOpen] = useState(false);
  const [broadcastMessage, setBroadcastMessage] = useState(
    'Hola {nombre}, ¡tenemos ofertas imperdibles esta semana en MAX24! Aceite de Girasol 1.5L a solo $3200 y Leche entera a $1200. ¡Visítanos y aprovecha antes de que se agoten! 🚀'
  );
  // Track which customers in the list have been clicked/sent during this broadcast session
  const [broadcastSentStatus, setBroadcastSentStatus] = useState<Record<string, boolean>>({});

  // Message templates definitions
  const TEMPLATES = [
    { id: 'custom', label: 'Mensaje Libre', text: '' },
    { 
      id: 'coupon', 
      label: '🎁 Cupón de Descuento', 
      text: '¡Hola {nombre}! Como eres uno de nuestros clientes preferidos en MAX24, te regalamos un cupón de 10% de descuento para tu próxima compra utilizando el código: MAX24PRO. ¡Te esperamos! 🎉' 
    },
    { 
      id: 'debt', 
      label: '⚠️ Recordatorio de Saldo', 
      text: 'Estimado/a {nombre}, le escribimos desde MAX24 para recordarle que tiene un saldo pendiente con nosotros. Si desea regularizar o realizar alguna consulta, por favor contáctenos. ¡Muchas gracias!' 
    },
    { 
      id: 'greetings', 
      label: '🎂 Mensaje de Saludo', 
      text: '¡Hola {nombre}! Desde el equipo de MAX24 queremos saludarte en este día especial, agradecer tu confianza constante en nosotros y desearte un excelente día.' 
    }
  ];

  // Search filter implementation
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.phone && c.phone.includes(q)) ||
        (c.docId && c.docId.includes(q)) ||
        (c.address && c.address.toLowerCase().includes(q))
      );
    });
  }, [customers, searchQuery]);

  // Handle template switch for single chat
  const handleTemplateChange = (templateId: string, customerName: string) => {
    setWaTemplateSelected(templateId);
    if (templateId === 'custom') {
      setWaMessage('');
    } else {
      const selected = TEMPLATES.find(t => t.id === templateId);
      if (selected) {
        setWaMessage(selected.text.replace('{nombre}', customerName));
      }
    }
  };

  // Open single WhatsApp wizard
  const handleOpenWASingle = (customer: Customer) => {
    setWaCustomer(customer);
    setWaTemplateSelected('custom');
    setWaMessage(`Hola ${customer.name}, ¿cómo estás? Te escribimos desde MAX24...`);
    setIsWAPopUpOpen(true);
  };

  // Open bulk broadcast wizard
  const handleOpenBroadcast = () => {
    setBroadcastSentStatus({});
    setIsBroadcastOpen(true);
  };

  // Trigger individual WhatsApp redirection
  const handleSendWASingle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!waCustomer || !waCustomer.phone) {
      alert('El cliente no tiene un teléfono celular válido registrado.');
      return;
    }
    
    // Clean phone number (leave only digits)
    const cleanedPhone = waCustomer.phone.replace(/\D/g, '');
    const finalPhone = cleanedPhone.startsWith('54') ? cleanedPhone : `549${cleanedPhone}`; // Argentine standard default if no country code
    
    const encodedText = encodeURIComponent(waMessage);
    const waUrl = `https://wa.me/${finalPhone}?text=${encodedText}`;
    
    window.open(waUrl, '_blank');
    setIsWAPopUpOpen(false);
  };

  // Trigger broadcast client redirection
  const handleSendBroadcastItem = (customer: Customer) => {
    if (!customer.phone) return;

    // Clean phone number
    const cleanedPhone = customer.phone.replace(/\D/g, '');
    const finalPhone = cleanedPhone.startsWith('54') ? cleanedPhone : `549${cleanedPhone}`;

    // Personalize message
    const personalizedMessage = broadcastMessage.replace(/{nombre}/g, customer.name);
    const encodedText = encodeURIComponent(personalizedMessage);
    const waUrl = `https://wa.me/${finalPhone}?text=${encodedText}`;

    // Open WA in new tab
    window.open(waUrl, '_blank');

    // Mark as sent
    setBroadcastSentStatus(prev => ({
      ...prev,
      [customer.id]: true
    }));
  };

  const handleOpenCreate = () => {
    setFormMode('create');
    setSelectedCustomerId(null);
    setFormName('');
    setFormEmail('');
    setFormPhone('');
    setFormDocId('');
    setFormAddress('');
    setSaveSuccess(false);
    setSuccessMessage('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setFormMode('edit');
    setSelectedCustomerId(c.id);
    setFormName(c.name);
    setFormEmail(c.email);
    setFormPhone(c.phone || '');
    setFormDocId(c.docId || '');
    setFormAddress(c.address || '');
    setSaveSuccess(false);
    setSuccessMessage('');
    setIsFormOpen(true);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName || !formEmail) {
      alert('Por favor complete los campos obligatorios (*).');
      return;
    }

    const payload = {
      name: formName,
      email: formEmail,
      phone: formPhone || undefined,
      docId: formDocId || undefined,
      address: formAddress || undefined
    };

    if (formMode === 'create') {
      onAddCustomer(payload);
      setSuccessMessage('¡Cliente agregado con éxito!');
    } else if (formMode === 'edit' && selectedCustomerId) {
      onUpdateCustomer({
        ...payload,
        id: selectedCustomerId
      });
      setSuccessMessage('¡Datos de cliente actualizados con éxito!');
    }

    setSaveSuccess(true);

    // Auto-dismiss after 1.8 seconds with state reset
    setTimeout(() => {
      setSaveSuccess(false);
      setIsFormOpen(false);
    }, 1800);
  };

  return (
    <div className="space-y-6" id="customers-module">
      {/* Header section with Bulk WA broadcast option */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            Cartera de Clientes
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Administra tus clientes, asocia sus ventas y automatiza campañas de marketing y ofertas personalizadas por WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Publicity / Bulk WhatsApp Marketing */}
          <button
            onClick={handleOpenBroadcast}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-850 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md cursor-pointer transition-colors"
          >
            <Megaphone className="w-4 h-4 text-orange-400" />
            Envío Masivo de Ofertas ({customers.filter(c => c.phone).length} móviles)
          </button>

          {/* New Customer */}
          <button
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/15 cursor-pointer transition-colors"
          >
            <Plus className="w-4 h-4" />
            Agregar Cliente
          </button>
        </div>
      </div>

      {/* Customer search filter bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xxs">
        <div className="relative w-full">
          <span className="absolute left-3.5 top-3 text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Buscar por nombre, email, teléfono, celular, CUIT, DNI o domicilio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 focus:bg-white transition-all font-sans"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 focus:outline-hidden cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Customers List Board */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xxs">
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h3 className="font-extrabold text-sm text-slate-850 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            Base de Clientes Totales ({customers.length} registrados)
          </h3>
          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">
            Mostrando {filteredCustomers.length}
          </span>
        </div>

        {filteredCustomers.length === 0 ? (
          <div className="p-16 text-center space-y-3">
            <Users className="w-10 h-10 text-slate-200 mx-auto" />
            <p className="text-xs font-bold text-slate-500">Ningún cliente coincide con la búsqueda.</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="text-xs font-bold text-orange-500 hover:underline cursor-pointer"
            >
              Limpiar búsqueda
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 font-mono tracking-wider">
                  <th className="py-3.5 px-5">Nombre / Identidad</th>
                  <th className="py-3.5 px-4">Email de contacto</th>
                  <th className="py-3.5 px-4">Teléfono / WhatsApp</th>
                  <th className="py-3.5 px-4">DNI o CUIT</th>
                  <th className="py-3.5 px-4">Domicilio Fiscal/Despacho</th>
                  <th className="py-3.5 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60 transition-all">
                    {/* Name */}
                    <td className="py-3.5 px-5 font-bold text-slate-800">
                      {c.name}
                    </td>

                    {/* Email */}
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {c.email}
                    </td>

                    {/* Phone & whatsapp direct click */}
                    <td className="py-3.5 px-4">
                      {c.phone ? (
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-slate-700 font-semibold">{c.phone}</span>
                          <button
                            onClick={() => handleOpenWASingle(c)}
                            className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-md transition-colors cursor-pointer"
                            title="Enviar mensaje personalizado de WhatsApp"
                          >
                            <MessageSquare className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px] italic">Sin teléfono</span>
                      )}
                    </td>

                    {/* Document ID */}
                    <td className="py-3.5 px-4 font-mono text-slate-600 bg-slate-50/50">
                      {c.docId || <span className="text-slate-300">-</span>}
                    </td>

                    {/* Address */}
                    <td className="py-3.5 px-4 text-slate-500 max-w-[180px] truncate" title={c.address}>
                      {c.address || <span className="text-slate-350 italic text-[10px]">Sin domicilio</span>}
                    </td>

                    {/* Actions tools */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 hover:bg-slate-150 text-slate-400 hover:text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Editar detalles"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Dar de baja permanente a ${c.name} de la base de clientes?`)) {
                              onDeleteCustomer(c.id);
                            }
                          }}
                          className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-550 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar cliente"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL 1: CREATE / EDIT CUSTOMER */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsFormOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {saveSuccess ? (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-4 animate-scale-up">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-xs border border-emerald-100">
                  <CheckCircle className="w-10 h-10 animate-pulse text-emerald-600" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-black text-slate-900">{successMessage}</h4>
                  <p className="text-xs text-slate-500 font-extrabold">{formName}</p>
                </div>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
                  <Users className="text-orange-500 w-5 h-5" />
                  {formMode === 'create' ? 'Agregar Cliente Creador' : 'Modificar Datos de Cliente'}
                </h3>
                <p className="text-xs text-slate-500 mb-4">Introduce la información personal y fiscal del cliente.</p>

                <form onSubmit={handleSubmitForm} className="space-y-4 text-left">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      placeholder="ej. Juan Carlos Pérez"
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email *</label>
                    <input
                      type="email"
                      placeholder="ej. juan@gmail.com"
                      value={formEmail}
                      onChange={(e) => setFormEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">Celular / Teléfono</label>
                      <input
                        type="text"
                        placeholder="ej. 1150005000"
                        value={formPhone}
                        onChange={(e) => setFormPhone(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-wider mb-1">DNI o CUIT (Fiscal)</label>
                      <input
                        type="text"
                        placeholder="ej. 20-30123456-9"
                        value={formDocId}
                        onChange={(e) => setFormDocId(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Dirección de Entrega / Domicilio</label>
                    <input
                      type="text"
                      placeholder="ej. Av. Corrientes 1520 - Piso 2D"
                      value={formAddress}
                      onChange={(e) => setFormAddress(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    />
                  </div>

                  <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsFormOpen(false)}
                      className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
                    >
                      Confirmar Cliente
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: INDIVIDUAL WHATSAPP SENDER */}
      {isWAPopUpOpen && waCustomer && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsWAPopUpOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <MessageSquare className="text-emerald-500 w-5 h-5" />
              Enviar un WhatsApp
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Enviando a <span className="font-bold text-slate-850">{waCustomer.name}</span> ({waCustomer.phone})
            </p>

            <form onSubmit={handleSendWASingle} className="space-y-4 text-left">
              {/* Template picker */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">Usar Plantilla Rápida</label>
                <div className="grid grid-cols-2 gap-2">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => handleTemplateChange(t.id, waCustomer.name)}
                      className={`px-2 py-1.5 border rounded-lg text-[10px] font-semibold text-left truncate transition-colors cursor-pointer
                        ${waTemplateSelected === t.id 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-850 font-bold' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-605'}`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Message Field */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Mensaje final a enviar</label>
                <textarea
                  value={waMessage}
                  onChange={(e) => setWaMessage(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden min-h-[120px] font-sans text-slate-800"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsWAPopUpOpen(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cerrar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-extrabold rounded-xl text-xs cursor-pointer shadow-md inline-flex items-center justify-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5 text-slate-950" />
                  Abrir WhatsApp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: WHATSAPP BROADCAST MARKETING WIZARD */}
      {isBroadcastOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] flex flex-col">
            <button 
              onClick={() => setIsBroadcastOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="pb-3 border-b border-slate-100 shrink-0">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="text-orange-500 w-5 h-5 animate-bounce" />
                Centro de Difusión y Ofertas Masivas WA
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Escribe un anuncio y envíalo de manera ágil a todos los clientes. Al presionar el botón de cada cliente, se abrirá un chat pre-formateado.
              </p>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Message composer column */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1">Mensaje Publicitario General</label>
                    <textarea
                      value={broadcastMessage}
                      onChange={(e) => setBroadcastMessage(e.target.value)}
                      className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden min-h-[160px] font-sans text-slate-800"
                      placeholder="Usa {nombre} donde quieras insertar el nombre real del cliente automáticamente en cada chat..."
                    />
                    <p className="text-[10px] text-slate-400 mt-1 font-mono italic">
                      💡 Consejo: Utiliza la palabra clave <strong className="text-slate-600">{`{nombre}`}</strong> y el generador la reemplazará por el nombre real de cada cliente en su ventana de chat.
                    </p>
                  </div>

                  {/* Realtime Live preview card */}
                  <div className="bg-orange-50/50 p-3.5 rounded-2xl border border-orange-200/50 space-y-2">
                    <span className="text-[9px] font-black text-orange-950 uppercase tracking-wider block font-mono flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" /> Vista Previa del Anuncio
                    </span>
                    <div className="p-2.5 bg-white rounded-xl border border-slate-200/60 text-[11px] leading-relaxed text-slate-700 italic">
                      {broadcastMessage.replace(/{nombre}/g, customers[0]?.name || 'Juan Pérez')}
                    </div>
                  </div>
                </div>

                {/* Queue checklist column */}
                <div className="space-y-2 flex flex-col h-full">
                  <span className="block text-[10px] font-bold text-slate-700 uppercase tracking-widest mb-1 shrink-0">Cola de Envío Permanente</span>
                  
                  <div className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl p-2.5 overflow-y-auto max-h-[290px] space-y-1.5 pr-1 text-left min-h-[240px]">
                    {customers.filter(c => c.phone).length === 0 ? (
                      <p className="text-xs text-slate-400 text-center py-10 italic">No tienes ningún cliente con móvil registrado para difusión.</p>
                    ) : (
                      customers.filter(c => c.phone).map((customer) => {
                        const isSent = broadcastSentStatus[customer.id];
                        return (
                          <div 
                            key={customer.id} 
                            className={`p-2 rounded-xl flex items-center justify-between border text-[11px] font-sans transition-all
                              ${isSent 
                                ? 'bg-emerald-50/30 border-emerald-150 text-slate-500' 
                                : 'bg-white border-slate-150 text-slate-800'}`}
                          >
                            <div className="truncate flex-1 pr-2 leading-tight">
                              <strong className={`${isSent ? 'text-slate-405 font-medium' : 'text-slate-800'}`}>
                                {customer.name}
                              </strong>
                              <span className="block font-mono text-[9px] text-slate-400 mt-0.5">{customer.phone}</span>
                            </div>

                            <div>
                              {isSent ? (
                                <button
                                  onClick={() => handleSendBroadcastItem(customer)}
                                  className="px-2.5 py-1 bg-slate-150 text-emerald-700 border border-emerald-100 rounded-lg text-[9px] font-bold flex items-center gap-1 cursor-pointer hover:bg-emerald-100"
                                >
                                  <CheckCircle className="w-3 h-3 text-emerald-600" /> Refrescar / WA
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleSendBroadcastItem(customer)}
                                  className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-450 text-slate-950 font-black rounded-lg text-[9px] flex items-center gap-1 shadow-sm cursor-pointer"
                                >
                                  Enviar WA
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => setIsBroadcastOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold rounded-xl text-xs cursor-pointer"
              >
                Cerrar Panel de Difusión
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
