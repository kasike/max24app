import React, { useState, useMemo, useEffect } from 'react';
import { 
  Scale, 
  Plus, 
  Search, 
  X, 
  Send, 
  MessageSquare, 
  CheckCircle, 
  Sparkles, 
  Clock, 
  AlertTriangle,
  Receipt,
  FileText,
  DollarSign,
  User,
  Activity,
  BellRing,
  HelpCircle,
  TrendingDown,
  TrendingUp,
  Settings,
  Flame,
  MousePointerClick
} from 'lucide-react';
import { Customer, DebtTransaction, Employee } from '../types';

interface DebtsProps {
  customers: Customer[];
  onUpdateCustomer: (customer: Customer) => void;
  currentUser: Employee | null;
}

export default function Debts({
  customers,
  onUpdateCustomer,
  currentUser
}: DebtsProps) {
  // Filters & State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'debtors' | 'settled'>('debtors');

  // Load / Save Ledger State in localStorage
  const [transactions, setTransactions] = useState<DebtTransaction[]>(() => {
    const saved = localStorage.getItem('store_debt_transactions');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'tx-1',
        customerId: 'cust-1',
        customerName: 'Juan Carlos Gómez',
        type: 'deuda',
        amount: 15000,
        date: '2026-06-05',
        concept: 'Fiado de mercadería general de almacén'
      },
      {
        id: 'tx-2',
        customerId: 'cust-1',
        customerName: 'Juan Carlos Gómez',
        type: 'pago',
        amount: 2500,
        date: '2026-06-10',
        concept: 'Abono parcial de cuenta corriente',
        paymentMethod: 'Efectivo'
      },
      {
        id: 'tx-3',
        customerId: 'cust-3',
        customerName: 'Esteban Di Pascuale',
        type: 'deuda',
        amount: 4600,
        date: '2026-06-05',
        concept: 'Leche, galletitas y artículos de limpieza'
      }
    ];
  });

  // Automated notification choices configuration
  const [autoNotifyOnRegister, setAutoNotifyOnRegister] = useState<boolean>(true);
  const [autoReminderInterval, setAutoReminderInterval] = useState<'disabled' | 'weekly' | 'biweekly' | 'monthly'>('weekly');
  const [customNotificationTemplate, setCustomNotificationTemplate] = useState<string>(
    'Estimado/a {nombre}, le informamos desde {tienda} que posee una cuenta abierta con un saldo pendiente consolidado de ${monto}. Agradecemos su cordial pago voluntario. ¡Muchas gracias!'
  );

  // Notification simulator feed
  const [notificationLogs, setNotificationLogs] = useState<Array<{ id: string; time: string; customerName: string; type: 'whatsapp' | 'email'; status: 'success' | 'sending'; message: string }>>([
    {
      id: 'log-1',
      time: '13:02:15',
      customerName: 'Juan Carlos Gómez',
      type: 'email',
      status: 'success',
      message: '📧 Correo automático de vencimiento enviado a juan.gomez@gmail.com - Saldo: $12.500'
    },
    {
      id: 'log-2',
      time: '11:45:00',
      customerName: 'Esteban Di Pascuale',
      type: 'whatsapp',
      status: 'success',
      message: '💬 Alerta automática de WhatsApp estructurada para Esteban (+54 11 2233-4455) - Saldo: $4.600'
    }
  ]);

  // Modals controllers
  const [isDebtModalOpen, setIsDebtModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  
  // Ledger Detail View controllers
  const [viewedCustomer, setViewedCustomer] = useState<Customer | null>(null);

  // Form Fields
  const [formAmount, setFormAmount] = useState<string>('');
  const [formConcept, setFormConcept] = useState<string>('');
  const [formDate, setFormDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [formPaymentMethod, setFormPaymentMethod] = useState<string>('Efectivo');

  // Persistent synchronizations
  useEffect(() => {
    localStorage.setItem('store_debt_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // Sync balances on load just to secure data consistency
  useEffect(() => {
    // Check if customer balances match sum of ledger
    customers.forEach(c => {
      const custHistory = transactions.filter(t => t.customerId === c.id);
      const computedBalance = custHistory.reduce((sum, item) => {
        return item.type === 'deuda' ? sum + item.amount : sum - item.amount;
      }, 0);
      
      const realBalance = c.debtBalance ?? 0;
      if (computedBalance !== realBalance) {
        onUpdateCustomer({
          ...c,
          debtBalance: computedBalance
        });
      }
    });
  }, [transactions]);

  // Stats Calculations
  const stats = useMemo(() => {
    const totalOutstanding = customers.reduce((sum, c) => sum + (c.debtBalance ?? 0), 0);
    const activeDebtorsCount = customers.filter(c => (c.debtBalance ?? 0) > 0).length;
    const totalRepayments = transactions
      .filter(t => t.type === 'pago')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalOutstanding,
      activeDebtorsCount,
      totalRepayments
    };
  }, [customers, transactions]);

  // Filter implementation
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = c.name.toLowerCase().includes(q) || 
                        c.email.toLowerCase().includes(q) || 
                        (c.phone && c.phone.includes(q)) ||
                        (c.docId && c.docId.includes(q));
      
      const balance = c.debtBalance ?? 0;
      if (activeFilter === 'debtors') return nameMatch && balance > 0;
      if (activeFilter === 'settled') return nameMatch && balance === 0;
      return nameMatch;
    });
  }, [customers, searchQuery, activeFilter]);

  // Handle Register Debt (Fiar Mercadería)
  const handleRegisterDebt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !formAmount || parseFloat(formAmount) <= 0) {
      alert('Por favor selecciona un cliente y proporciona un monto válido.');
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);
    if (!customerObj) return;

    const amountNum = parseFloat(formAmount);
    const newTx: DebtTransaction = {
      id: `tx-${Date.now()}`,
      customerId: selectedCustomerId,
      customerName: customerObj.name,
      type: 'deuda',
      amount: amountNum,
      date: formDate,
      concept: formConcept || 'Suministro de mercadería general fianza'
    };

    // Update transactions list
    setTransactions(prev => [...prev, newTx]);

    // Update customer debt balance
    const currentBalance = customerObj.debtBalance ?? 0;
    const updatedCustomer: Customer = {
      ...customerObj,
      debtBalance: currentBalance + amountNum
    };
    onUpdateCustomer(updatedCustomer);

    // Automation notification trigger mock-up
    if (autoNotifyOnRegister) {
      triggerAutomaticAlertSimulation(updatedCustomer, amountNum, 'deuda');
    }

    // Reset fields
    setFormAmount('');
    setFormConcept('');
    setSelectedCustomerId('');
    setIsDebtModalOpen(false);
  };

  // Handle Record Repayment (Cobrar de deudas)
  const handleRegisterPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId || !formAmount || parseFloat(formAmount) <= 0) {
      alert('Por favor selecciona un cliente y proporciona un monto de pago válido.');
      return;
    }

    const customerObj = customers.find(c => c.id === selectedCustomerId);
    if (!customerObj) return;

    const amountNum = parseFloat(formAmount);
    const currentBalance = customerObj.debtBalance ?? 0;

    if (amountNum > currentBalance) {
      const confirmOverpay = confirm(`El monto ingresado ($${amountNum}) supera la deuda actual ($${currentBalance}). ¿Deseas registrar un saldo a favor para el cliente?`);
      if (!confirmOverpay) return;
    }

    const newTx: DebtTransaction = {
      id: `tx-${Date.now()}`,
      customerId: selectedCustomerId,
      customerName: customerObj.name,
      type: 'pago',
      amount: amountNum,
      date: formDate,
      concept: formConcept || 'Pago / Abono voluntario de su saldo',
      paymentMethod: formPaymentMethod
    };

    // Update transactions
    setTransactions(prev => [...prev, newTx]);

    // Update customer debt balance & last payment date
    const updatedCustomer: Customer = {
      ...customerObj,
      debtBalance: Math.max(0, currentBalance - amountNum), // Or support negative balance for credit
      lastPaymentDate: formDate
    };
    onUpdateCustomer(updatedCustomer);

    // Notification simulation for repayment
    if (autoNotifyOnRegister) {
      triggerAutomaticAlertSimulation(updatedCustomer, amountNum, 'pago');
    }

    // Reset fields
    setFormAmount('');
    setFormConcept('');
    setSelectedCustomerId('');
    setIsPaymentModalOpen(false);
  };

  // Simulated automatic alerts dispatching console LOGGER
  const triggerAutomaticAlertSimulation = (customer: Customer, amount: number, actionType: 'deuda' | 'pago') => {
    const timestamp = new Date().toTimeString().split(' ')[0];
    const systemStoreName = 'MAX24 Express';

    let logMessage = '';
    let emailSubject = '';
    let emailHtml = '';

    if (actionType === 'deuda') {
      logMessage = `⚡ [Automático] Se envió un email de cobro y aviso inmediato a ${customer.email} por nueva fianza de $${amount.toLocaleString('es-AR')}. Deuda total: $${(customer.debtBalance ?? 0).toLocaleString('es-AR')}.`;
      emailSubject = `⚡ Aviso de Cuenta Corriente - Nueva Deuda Registrada - ${systemStoreName}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e1b4b; text-align: center;">⚡ Cuenta Corriente - Nueva Deuda</h2>
          <p>Hola <strong>${customer.name}</strong>,</p>
          <p>Te informamos que se ha registrado un nuevo cargo al fiado en tu cuenta de <strong>${systemStoreName}</strong>:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #cbd5e1;">
            <p style="margin: 5px 0;"><strong>Monto del cargo:</strong> $${amount.toLocaleString('es-AR')}</p>
            <p style="margin: 5px 0;"><strong>Saldo total pendiente:</strong> <span style="color: #ea580c; font-weight: bold;">$${(customer.debtBalance ?? 0).toLocaleString('es-AR')}</span></p>
          </div>
          <p>Agradecemos tu cordial pago a la brevedad. ¡Muchas gracias por tu confianza!</p>
          <p style="font-size: 11px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Enviado de forma automática por el sistema de notificaciones de MAX24. Si tienes dudas, contáctanos a soporte@max24app.com.
          </p>
        </div>
      `;
    } else {
      logMessage = `✨ [Automático] Comprobante digital autogenerado y enviado a ${customer.email} por abono de $${amount.toLocaleString('es-AR')}. Saldo remanente: $${(customer.debtBalance ?? 0).toLocaleString('es-AR')}.`;
      emailSubject = `✨ Comprobante de Pago Recibido - ${systemStoreName}`;
      emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #1e1b4b; text-align: center;">✨ Comprobante de Pago Recibido</h2>
          <p>Hola <strong>${customer.name}</strong>,</p>
          <p>Hemos recibido y registrado con éxito tu pago en tu cuenta corriente de <strong>${systemStoreName}</strong>:</p>
          <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0; border: 1px solid #cbd5e1;">
            <p style="margin: 5px 0;"><strong>Monto abonado:</strong> $${amount.toLocaleString('es-AR')}</p>
            <p style="margin: 5px 0;"><strong>Saldo remanente:</strong> <span style="color: #047857; font-weight: bold;">$${(customer.debtBalance ?? 0).toLocaleString('es-AR')}</span></p>
          </div>
          <p>Agradecemos tu cordial abono y tu puntualidad. ¡Gracias por elegirnos!</p>
          <p style="font-size: 11px; color: #64748b; margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            Enviado de forma automática por el sistema de notificaciones de MAX24. Si tienes dudas, contáctanos a soporte@max24app.com.
          </p>
        </div>
      `;
    }

    const newLog = {
      id: `log-${Date.now()}`,
      time: timestamp,
      customerName: customer.name,
      type: 'email' as const,
      status: 'success' as const,
      message: logMessage
    };

    setNotificationLogs(prev => [newLog, ...prev]);

    // Send real SMTP Email!
    if (customer.email && customer.email.includes('@')) {
      fetch("/api/send-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          type: "notificaciones",
          to: customer.email,
          subject: emailSubject,
          html: emailHtml
        })
      }).then(res => res.json())
        .then(data => console.log("SMTP Debt/Payment notification sent:", data))
        .catch(err => console.error("SMTP Debt/Payment notification error:", err));
    }
  };

  // Mass Auto-Notification alert launcher simulator
  const handleBulkNotificationLaunch = () => {
    const debtors = customers.filter(c => (c.debtBalance ?? 0) > 0);
    if (debtors.length === 0) {
      alert('No hay clientes en mora con deudas activas en este momento.');
      return;
    }

    // Dispatch simulated alerts
    const timestamp = new Date().toTimeString().split(' ')[0];
    const newLogs = debtors.map((debtor, index) => {
      // Process template
      let customizedMsg = customNotificationTemplate
        .replace(/{nombre}/g, debtor.name)
        .replace(/{tienda}/g, 'MAX24 Express')
        .replace(/{monto}/g, (debtor.debtBalance ?? 0).toLocaleString('es-AR'));

      return {
        id: `log-bulk-${Date.now()}-${index}`,
        time: timestamp,
        customerName: debtor.name,
        type: (index % 2 === 0 ? 'whatsapp' : 'email') as 'whatsapp' | 'email',
        status: 'success' as const,
        message: index % 2 === 0 
          ? `💬 WhatsApp automatizado preparado para ${debtor.name} (${debtor.phone || 'Email complementario'}): "${customizedMsg.slice(0,65)}..."`
          : `📧 Correo masivo electrónico enviado a ${debtor.email} con saldos de amortización.`
      };
    });

    setNotificationLogs(prev => [...newLogs, ...prev]);
    alert(`📢 ¡Difusión automática realizada con éxito! Se despacharon de forma inteligente ${debtors.length} avisos electrónicos de deudas.`);
  };

  // WhatsApp manual redirection link constructor
  const handleSendManualWhatsAppRemind = (customer: Customer) => {
    if (!customer.phone) {
      alert('Este cliente no posee celular / WhatsApp registrado.');
      return;
    }

    const cleanPhone = customer.phone.replace(/\D/g, '');
    const finalPhone = cleanPhone.startsWith('54') ? cleanPhone : `549${cleanPhone}`;

    let customizedMsg = customNotificationTemplate
      .replace(/{nombre}/g, customer.name)
      .replace(/{tienda}/g, 'MAX24 Express')
      .replace(/{monto}/g, (customer.debtBalance ?? 0).toLocaleString('es-AR'));

    const encodedText = encodeURIComponent(customizedMsg);
    const waUrl = `https://wa.me/${finalPhone}?text=${encodedText}`;
    window.open(waUrl, '_blank');

    // Append to logs
    const timestamp = new Date().toTimeString().split(' ')[0];
    setNotificationLogs(prev => [
      {
        id: `log-wa-${Date.now()}`,
        time: timestamp,
        customerName: customer.name,
        type: 'whatsapp',
        status: 'success',
        message: `💬 WhatsApp manual abierto para ${customer.name}: Aviso enviado por saldo de $${(customer.debtBalance ?? 0).toLocaleString('es-AR')}.`
      },
      ...prev
    ]);
  };

  // Delete transaction log (allows corrective entries)
  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    if (confirm(`¿Estás seguro de que deseas anular este movimiento de la cuenta corriente? Esto recalculará de forma inmediata el saldo del cliente en el almacén.`)) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      
      const customerObj = customers.find(c => c.id === tx.customerId);
      if (customerObj) {
        const balanceCorrection = tx.type === 'deuda' ? -tx.amount : tx.amount;
        onUpdateCustomer({
          ...customerObj,
          debtBalance: Math.max(0, (customerObj.debtBalance ?? 0) + balanceCorrection)
        });
      }
    }
  };

  // Inspect particular user ledger sheet
  const handleOpenCustomerHistory = (customer: Customer) => {
    setViewedCustomer(customer);
    setIsHistoryModalOpen(true);
  };

  const currentCustomerHistory = useMemo(() => {
    if (!viewedCustomer) return [];
    return transactions.filter(t => t.customerId === viewedCustomer.id)
                        .sort((a,b) => b.date.localeCompare(a.date));
  }, [viewedCustomer, transactions]);

  // Utility to count active debtors
  const activeDebtorsList = customers.filter(c => (c.debtBalance ?? 0) > 0);

  return (
    <div className="space-y-6 animate-fade-in" id="debts-ledger-dashboard">
      
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-6 h-6 text-orange-500" />
            Cuentas Corrientes y Fiados (Clientes)
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Control integral del fiado para almacenes y comercios locales. Registra deudas, abonos, gestiona saldos y emite avisos automáticos de deudas pendientes.
          </p>
        </div>

        {/* Core Quick Buttons */}
        <div className="flex items-center gap-2">
          {/* Pay debt button */}
          <button
            onClick={() => {
              setSelectedCustomerId('');
              setFormAmount('');
              setFormConcept('');
              setIsPaymentModalOpen(true);
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
          >
            <TrendingDown className="w-4 h-4 text-emerald-100" />
            Registrar Abono / Pago
          </button>

          {/* New Debt Button */}
          <button
            onClick={() => {
              setSelectedCustomerId('');
              setFormAmount('');
              setFormConcept('');
              setIsDebtModalOpen(true);
            }}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-orange-500/15 cursor-pointer transition-colors"
          >
            <TrendingUp className="w-4 h-4 text-slate-900" />
            Fiado / Registrar Deuda
          </button>
        </div>
      </div>

      {/* Interactive Stats Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Outstanding Balance */}
        <div className="p-5 bg-gradient-to-tr from-slate-900 to-slate-800 border border-slate-800 text-slate-100 rounded-3xl shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-5 opacity-10">
            <AlertTriangle className="w-24 h-24 text-orange-500" />
          </div>
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Total Deuda por Cobrar
          </span>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span className="text-3xl font-black text-orange-400 font-mono tracking-tight">
              ${stats.totalOutstanding.toLocaleString('es-AR')}
            </span>
            <span className="text-xs text-slate-400">ARS</span>
          </div>
          <p className="text-[11px] text-slate-400 leading-normal mt-3 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse inline-block" />
            Financiamiento otorgado a clientes de confianza.
          </p>
        </div>

        {/* Active Debtors Card */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xxs">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 block mb-1">
            Clientes Activos deudores
          </span>
          <div className="flex items-baseline gap-1 mt-1.5 text-slate-800">
            <span className="text-4xl font-extrabold font-mono tracking-tight text-slate-850">
              {stats.activeDebtorsCount}
            </span>
            <span className="text-xs text-slate-500 font-semibold">de {customers.length} total</span>
          </div>
          <div className="mt-3.5 flex items-center gap-3">
            <div className="bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-bold border border-red-100">
              {((stats.activeDebtorsCount / (customers.length || 1)) * 100).toFixed(0)}% de Base
            </div>
            <span className="text-[11px] text-slate-550">Poseen cuentas corrientes abiertas.</span>
          </div>
        </div>

        {/* Live Automatic channel sync summary */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xxs relative">
          <span className="text-[10px] font-bold font-mono uppercase tracking-wider text-slate-400 block mb-0.5">
            Canal de Notificaciones de Cobro
          </span>
          <div className="flex items-center gap-2 mt-2">
            <div className="px-2.5 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg text-xs font-bold font-sans flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
              SaaS Auto-Alertas
            </div>
            <span className="text-slate-400 text-[10px] font-mono">WhatsApp/Mail</span>
          </div>
          <p className="text-[11px] text-slate-550 leading-relaxed mt-3.5">
            Las deudas se notifican al celular en tiempo real de forma automática.
          </p>
        </div>
      </div>

      {/* Main Layout containing Customer ledger list + Side Automation Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: Customer Listing & Ledgers */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Searching and Tabs controls banner */}
          <div className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xxs flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search filter input */}
            <div className="relative w-full md:max-w-xs shrink-0">
              <span className="absolute left-3.5 top-3 text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Buscar deudor..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-orange-500/10 focus:border-orange-500 transition-all font-sans"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-450 hover:text-slate-650 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Quick state switcher tabs */}
            <div className="flex items-center bg-slate-100/85 p-1 rounded-xl self-stretch md:self-auto">
              <button
                onClick={() => setActiveFilter('debtors')}
                className={`flex-1 px-3.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  activeFilter === 'debtors' 
                    ? 'bg-white text-slate-850 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Con Deuda Activa ({activeDebtorsList.length})
              </button>
              <button
                onClick={() => setActiveFilter('settled')}
                className={`flex-1 px-3.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  activeFilter === 'settled' 
                    ? 'bg-white text-slate-850 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Al Día ({customers.filter(c => (c.debtBalance ?? 0) === 0).length})
              </button>
              <button
                onClick={() => setActiveFilter('all')}
                className={`flex-1 px-3.5 py-1.5 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  activeFilter === 'all' 
                    ? 'bg-white text-slate-850 shadow-xs' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Todos ({customers.length})
              </button>
            </div>
          </div>

          {/* Customers Table Card layout */}
          <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xxs">
            <div className="px-5 py-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-700">
              <span>Listado de Clientes</span>
              <span className="font-mono text-[10px] text-slate-400 uppercase tracking-widest font-black">Control de Cuenta Corriente</span>
            </div>

            {filteredCustomers.length === 0 ? (
              <div className="p-16 text-center space-y-3">
                <Scale className="w-8 h-8 text-slate-200 mx-auto animate-pulse" />
                <p className="text-xs font-bold text-slate-400">Ningún cliente coincide con la selección.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/20 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100 font-mono tracking-wider">
                      <th className="py-3 px-5">Nombre / Fianza</th>
                      <th className="py-3 px-4">Teléfono WhatsApp</th>
                      <th className="py-3 px-4 text-right">Saldo Pendiente</th>
                      <th className="py-3 px-4 text-center">Último Pago</th>
                      <th className="py-3 px-5 text-center">Gestión De cobro</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredCustomers.map((c) => {
                      const balance = c.debtBalance ?? 0;
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                          {/* Name and alert status tag */}
                          <td className="py-3.5 px-5">
                            <div className="leading-tight">
                              <span className="font-bold text-slate-800 block">{c.name}</span>
                              <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[170px] font-mono">
                                {c.email}
                              </span>
                            </div>
                          </td>

                          {/* Contact cell */}
                          <td className="py-3.5 px-4 font-mono text-slate-600">
                            {c.phone || <span className="text-slate-350 italic text-[10px]">Sin teléfono</span>}
                          </td>

                          {/* Debt Balance highlight */}
                          <td className="py-3.5 px-4 text-right">
                            {balance > 0 ? (
                              <div className="inline-block text-right">
                                <span className="font-black text-xs text-orange-600 font-mono block">
                                  ${balance.toLocaleString('es-AR')}
                                </span>
                                <span className="text-[9px] font-bold text-red-500 uppercase tracking-widest block font-mono">
                                  En Mora
                                </span>
                              </div>
                            ) : (
                              <div className="inline-block text-right">
                                <span className="font-bold text-xs text-emerald-650 font-mono block">
                                  $0
                                </span>
                                <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest block font-mono">
                                  Al Día
                                </span>
                              </div>
                            )}
                          </td>

                          {/* Last Repayment date */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-500 text-[11px]">
                            {c.lastPaymentDate || <span className="text-slate-305 italic text-[10px]">Sin abonos</span>}
                          </td>

                          {/* Action triggers */}
                          <td className="py-3.5 px-5 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Open detail ledger */}
                              <button
                                onClick={() => handleOpenCustomerHistory(c)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-lg text-[10px] flex items-center gap-0.5 cursor-pointer border border-slate-150 transition-all"
                                title="Ficha de Cuenta Corriente y Auditoría"
                              >
                                <Receipt className="w-3.5 h-3.5 text-slate-500" />
                                Extracto
                              </button>

                              {/* WhatsApp trigger alert */}
                              {balance > 0 && c.phone && (
                                <button
                                  onClick={() => handleSendManualWhatsAppRemind(c)}
                                  className="p-1 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 hover:text-emerald-700 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
                                  title="Enviar aviso manual inmediato de deuda vía WhatsApp"
                                >
                                  <MessageSquare className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: AUTO NOTIFICATION & REMINDER CONSOLE */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Automated settings panel card */}
          <div className="p-5.5 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            
            <div className="flex items-start gap-2.5">
              <div className="p-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 rounded-xl">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div className="space-y-0.5">
                <h3 className="text-xs font-extrabold text-white uppercase tracking-wider">Aviso de Deuda Automatizado</h3>
                <p className="text-[10px] text-slate-400 leading-normal">
                  Controla la emisión automatizada de alertas de mora para que tus clientes paguen en tiempo récord.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              
              {/* Option 1: Instant reminder */}
              <label className="flex items-start gap-3 p-3 bg-slate-805/50 border border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-805/80 transition-colors">
                <input
                  type="checkbox"
                  checked={autoNotifyOnRegister}
                  onChange={(e) => setAutoNotifyOnRegister(e.target.checked)}
                  className="mt-1 rounded border-slate-700 bg-slate-800 text-orange-500 focus:ring-orange-500 cursor-pointer"
                />
                <div className="leading-tight">
                  <span className="text-[11px] font-extrabold text-white block">Auto-notificar en Almacén</span>
                  <span className="text-[9px] text-slate-400 block mt-0.5 leading-normal">
                    Enviar e-mail/alertas en vivo ante deudas registradas en la caja o abonos en el POS.
                  </span>
                </div>
              </label>

              {/* Option 2: Batch execution cycle selection */}
              <div className="p-3.5 bg-slate-805/50 border border-slate-800 rounded-2xl space-y-1.5 text-left">
                <span className="text-[10px] font-bold text-slate-350 block uppercase tracking-wider font-mono">Ciclo Cobros Recurrentes</span>
                <select
                  value={autoReminderInterval}
                  onChange={(e) => setAutoReminderInterval(e.target.value as any)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold px-3 py-2 text-white focus:outline-hidden cursor-pointer"
                >
                  <option value="disabled">Desactivado (Aviso manual únicamente)</option>
                  <option value="weekly">Semanal (Todos los lunes 09:00 hs)</option>
                  <option value="biweekly">Quincenal (Día 1 y 15 de cada mes)</option>
                  <option value="monthly">Mensual (Fin de mes fiscal)</option>
                </select>
                <span className="text-[9px] text-slate-500 block leading-normal mt-1 italic">
                  💡 Configurado: El canal SaaS disparará recordatorios periódicos programados por servidor en segundo plano.
                </span>
              </div>

              {/* Option 3: Template Editor */}
              <div className="p-3.5 bg-slate-805/50 border border-slate-800 rounded-2xl space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-350 block uppercase tracking-wider font-mono">Plantilla de Aviso Auto-generado</span>
                <textarea
                  value={customNotificationTemplate}
                  onChange={(e) => setCustomNotificationTemplate(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-[11px] leading-relaxed text-slate-300 font-sans focus:outline-hidden resize-none min-h-[90px]"
                  placeholder="Redacta la plantilla..."
                />
                <div className="flex flex-wrap gap-1 text-[8px] font-mono font-bold text-orange-400">
                  <span>Reemplazos obligatorios:</span>
                  <span className="bg-slate-800 px-1 py-0.5 rounded text-white">{`{nombre}`}</span>
                  <span className="bg-slate-800 px-1 py-0.5 rounded text-white">{`{monto}`}</span>
                  <span className="bg-slate-800 px-1 py-0.5 rounded text-white">{`{tienda}`}</span>
                </div>
              </div>

              {/* Broadcast automated dispatch simulator action button */}
              <button
                onClick={handleBulkNotificationLaunch}
                className="w-full py-2.5 bg-gradient-to-tr from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-orange-500/10 cursor-pointer flex items-center justify-center gap-1.5 transition-all mt-2 uppercase tracking-wide"
              >
                <Send className="w-4 h-4 text-slate-950" />
                Ejecutar Alerta Masiva de Cobro
              </button>
            </div>
          </div>

          {/* Interactive live console feed of log actions */}
          <div className="p-4.5 bg-white border border-slate-200 rounded-3xl shadow-xxs space-y-3">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-slate-800 uppercase tracking-widest font-mono flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                Consola SaaS de Cobranzas
              </span>
              <button 
                onClick={() => setNotificationLogs([])}
                className="text-[9px] font-bold text-slate-400 hover:text-slate-650 cursor-pointer"
              >
                Limpiar logs
              </button>
            </div>

            <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 text-[10px] font-mono scrollbar-thin text-left leading-relaxed">
              {notificationLogs.length === 0 ? (
                <p className="text-slate-400 text-center py-10 italic">Consola inactiva. Los eventos de cobro aparecerán aquí en vivo.</p>
              ) : (
                notificationLogs.map((log) => (
                  <div key={log.id} className="p-2 rounded bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex justify-between items-center text-[9px] text-slate-400 font-bold">
                      <span>{log.customerName}</span>
                      <span>{log.time}</span>
                    </div>
                    <p className="text-slate-650 leading-normal text-[10px] break-words">{log.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: REGISTER NEW CUSTOMER DEBT (FIADO) */}
      {isDebtModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsDebtModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <TrendingUp className="text-orange-500 w-5 h-5" />
              Fiados / Registrar Nueva Deuda
            </h3>
            <p className="text-xs text-slate-500 mb-4">Añade saldo deudor en cuenta corriente para consumo fiado.</p>

            <form onSubmit={handleRegisterDebt} className="space-y-4 text-left">
              
              {/* Select Customer */}
              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase tracking-wider mb-1 font-mono">Nombre del Cliente *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                  required
                >
                  <option value="">Seleccione el cliente depositario...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.docId ? `(DNI/CUIT: ${c.docId})` : ''} - Saldo Actual: ${(c.debtBalance ?? 0).toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Debt amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase tracking-wider mb-1 font-mono">Monto Total de la Fianza ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Concept / explanation */}
              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase tracking-wider mb-1 font-mono">Concepto / Detalle de mercadería</label>
                <input
                  type="text"
                  placeholder="ej. Fiado de aceite, harina, azúcar y fideos s/ boletín"
                  value={formConcept}
                  onChange={(e) => setFormConcept(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase tracking-wider mb-1">Fecha de Registro</label>
                <input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsDebtModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-orange-500/10"
                >
                  Confirmar Fianza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REGISTER RECORDED PAYMENT (ABONO PAGO) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 shadow-2xl p-6 relative">
            <button 
              onClick={() => setIsPaymentModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <TrendingDown className="text-emerald-500 w-5 h-5" />
              Registrar Abono / Pago de Deuda
            </h3>
            <p className="text-xs text-slate-500 mb-4">Abona o cancela saldo deudor de un cliente.</p>

            <form onSubmit={handleRegisterPayment} className="space-y-4 text-left">
              
              {/* Select Customer */}
              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase tracking-wider mb-1 font-mono">Nombre del Cliente *</label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                  required
                >
                  <option value="">Seleccione el cliente que abona...</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} - Saldo Pendiente: ${(c.debtBalance ?? 0).toLocaleString('es-AR')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Repay amount */}
              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase tracking-wider mb-1 font-mono">Monto de Pago ($) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-3 text-slate-400 font-bold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full pl-7 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Payment Method */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-widest mb-1 font-mono">Método de Cobro</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta de Débito">Tarjeta de Débito</option>
                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-slate-700 uppercase tracking-widest mb-1 font-mono">Fecha de Cobro</label>
                  <input
                    type="date"
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>
              </div>

              {/* Concept */}
              <div>
                <label className="block text-[10px] font-bold text-slate-755 uppercase tracking-wider mb-1 font-mono">Anotación / Comentario</label>
                <input
                  type="text"
                  placeholder="ej. Pago a cuenta del saldo total"
                  value={formConcept}
                  onChange={(e) => setFormConcept(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-555 bg-emerald-500 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md shadow-emerald-500/10"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: AUDITED DE CUSTOMER HISTORY / STATEMENT */}
      {isHistoryModalOpen && viewedCustomer && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-slate-800">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl p-6 relative flex flex-col max-h-[85vh]">
            <button 
              onClick={() => {
                setViewedCustomer(null);
                setIsHistoryModalOpen(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 bg-slate-100 hover:bg-slate-200 rounded-full cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500">
                <FileText className="w-6 h-6" />
              </div>
              <div className="text-left leading-snug">
                <h3 className="font-extrabold text-sm text-slate-900">{viewedCustomer.name}</h3>
                <p className="text-[11px] text-slate-500">Ficha de Cuenta Corriente única y Auditorías</p>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              
              {/* Ledger Summary Cards inside Modal */}
              <div className="grid grid-cols-2 gap-3.5 text-left bg-slate-50 p-4.5 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">DNI o CUIT</span>
                  <span className="font-mono text-xs font-extrabold block text-slate-700 mt-0.5">{viewedCustomer.docId || 'Sin registrar'}</span>
                </div>
                <div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest font-mono">Saldo Pendiente de Pago</span>
                  <span className="font-mono text-sm font-black block text-orange-600 mt-0.5">
                    ${(viewedCustomer.debtBalance ?? 0).toLocaleString('es-AR')}
                  </span>
                </div>
              </div>

              {/* Transactions list table */}
              <div className="space-y-2 text-left">
                <span className="text-[10px] font-bold text-slate-450 uppercase tracking-wider font-mono">Extracto Analítico de Movimientos</span>
                
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xxs">
                  {currentCustomerHistory.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-10 italic">No se han registrado movimientos de deuda o abonos para este cliente todavía.</p>
                  ) : (
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50/70 border-b border-slate-150 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                          <th className="py-2.5 px-3">Fecha</th>
                          <th className="py-2.5 px-3">Movimiento</th>
                          <th className="py-2.5 px-3">Concepto anotado</th>
                          <th className="py-2.5 px-3 text-right">Importe</th>
                          <th className="py-2.5 px-3">Remover</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-sans">
                        {currentCustomerHistory.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50/40">
                            <td className="py-2 px-3 font-mono text-[10px] text-slate-500">{tx.date}</td>
                            <td className="py-2 px-3">
                              {tx.type === 'deuda' ? (
                                <span className="bg-red-50 text-red-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-red-100 flex items-center gap-0.5 w-fit">
                                  ⚠️ Fianza
                                </span>
                              ) : (
                                <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5 w-fit">
                                  ✓ Abono
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-slate-600 max-w-[150px] truncate" title={tx.concept}>
                              {tx.concept}
                              {tx.paymentMethod && <span className="text-[9px] text-slate-400 bg-slate-100 rounded px-1 ml-1">{tx.paymentMethod}</span>}
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-bold">
                              <span className={tx.type === 'deuda' ? 'text-red-500' : 'text-emerald-600'}>
                                {tx.type === 'deuda' ? '+' : '-'}${tx.amount.toLocaleString('es-AR')}
                              </span>
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                onClick={() => handleDeleteTransaction(tx.id)}
                                className="p-1 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded transition-colors cursor-pointer"
                                title="Anular este registro"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end shrink-0">
              <button
                onClick={() => {
                  setViewedCustomer(null);
                  setIsHistoryModalOpen(false);
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-650 font-bold rounded-xl text-xs cursor-pointer"
              >
                Cerrar Extracto
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
