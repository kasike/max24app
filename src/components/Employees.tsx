import React, { useState, useMemo } from 'react';
import { toPng } from 'html-to-image';
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Clock, 
  Mail, 
  Calendar, 
  ToggleLeft, 
  ToggleRight, 
  Trash2, 
  Edit,
  X,
  Phone,
  DollarSign,
  AlertOctagon,
  User,
  KeyRound,
  FileSpreadsheet,
  CheckCircle,
  Clock3,
  MessageSquare,
  History,
  TrendingUp,
  CreditCard,
  Lock,
  LockOpen
} from 'lucide-react';
import { Employee, CashierSession } from '../types';
import { exportToCSV } from '../utils/export';

interface EmployeesProps {
  employees: Employee[];
  onAddEmployee: (emp: Omit<Employee, 'id'>) => void;
  onUpdateEmployee: (emp: Employee) => void;
  onDeleteEmployee: (id: string) => void;
  cashierSessions: CashierSession[];
  onUpdateSessionStatus: (sessionId: string, nextStatus: 'autorizado' | 'cerrado', closeCash?: number, wageAccrued?: number) => Promise<void>;
  onRecordEmployeePayment: (employeeId: string, amount: number, notes: string, method: string) => Promise<void>;
  onAddCashierSession: (session: Omit<CashierSession, 'id'>) => Promise<CashierSession>;
  storeSettings?: any;
  onConsolidateSessions?: () => Promise<number>;
}

export default function Employees({ 
  employees, 
  onAddEmployee, 
  onUpdateEmployee, 
  onDeleteEmployee,
  cashierSessions,
  onUpdateSessionStatus,
  onRecordEmployeePayment,
  onAddCashierSession,
  storeSettings,
  onConsolidateSessions
}: EmployeesProps) {
  
  const [activeTab, setActiveTab] = useState<'roster' | 'shifts'>('roster');
  const [showRolesGuide, setShowRolesGuide] = useState(false);
  
  const displayStoreCode = storeSettings?.storeCode || storeSettings?.email || 'M24-TIENDA';
  const [isConsolidating, setIsConsolidating] = useState(false);
  
  // Modals controller
  const [isOpenForm, setIsOpenForm] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  
  // Pay disbursement modal
  const [payEmpId, setPayEmpId] = useState<string | null>(null);
  const [disburseAmount, setDisburseAmount] = useState<number>(0);
  const [disburseNotes, setDisburseNotes] = useState<string>('');
  const [disburseMethod, setDisburseMethod] = useState<string>('Efectivo');

  // Manual shift modals
  const [showClockInModal, setShowClockInModal] = useState<Employee | null>(null);
  const [showClockOutModal, setShowClockOutModal] = useState<CashierSession | null>(null);
  const [manualInitialCash, setManualInitialCash] = useState<string>('0');
  const [manualShift, setManualShift] = useState<string>('Mañana');
  const [manualCloseCash, setManualCloseCash] = useState<string>('0');

  // Selected employee id for edit
  const [selectedEmpId, setSelectedEmpId] = useState<string | null>(null);

  // Form Fields state variables
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Employee['role']>('Cajero');
  const [shift, setShift] = useState('Mañana');
  const [status, setStatus] = useState<Employee['status']>('Activo');
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [salary, setSalary] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [paymentCycle, setPaymentCycle] = useState<'Diario' | 'Semanal' | 'Mensual'>('Diario');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Success state for newly registered employee badge card
  const [justCreatedEmployee, setJustCreatedEmployee] = useState<any | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const downloadBadgeImage = () => {
    const node = document.getElementById('employee-badge-card');
    if (!node) return;
    setIsGeneratingImage(true);
    toPng(node, {
      cacheBust: true,
      backgroundColor: '#0f172a', // deep high-contrast dark theme background
      style: {
        transform: 'scale(1)',
        borderRadius: '16px',
        padding: '24px'
      }
    })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = `Credencial_${(justCreatedEmployee?.name || 'Empleado').replace(/\s+/g, '_')}.png`;
        link.href = dataUrl;
        link.click();
        setIsGeneratingImage(false);
      })
      .catch((err) => {
        console.error('Error generating badge image:', err);
        setIsGeneratingImage(false);
        alert('Hubo un error al generar la imagen. Pruebe descargando nuevamente.');
      });
  };

  // Filtering employees
  const activeEmployees = useMemo(() => employees, [employees]);

  const openCreateForm = () => {
    setFormMode('create');
    setSelectedEmpId(null);
    setName('');
    setEmail('');
    setRole('Cajero');
    setShift('Mañana');
    setStatus('Activo');
    setUsername('');
    setPassword('password123'); // Default safe password
    setPhone('');
    setSalary('');
    setHourlyRate('1500'); // Default starting hourly wage
    setPaymentCycle('Diario');
    setEmergencyContact('');
    setIsOpenForm(true);
  };

  const openEditForm = (emp: Employee) => {
    setFormMode('edit');
    setSelectedEmpId(emp.id);
    setName(emp.name);
    setEmail(emp.email);
    setRole(emp.role);
    setShift(emp.shift);
    setStatus(emp.status);
    setUsername(emp.username || '');
    setPassword(emp.password || '');
    setPhone(emp.phone || '');
    setSalary(emp.salary ? String(emp.salary) : '');
    setHourlyRate(emp.hourlyRate ? String(emp.hourlyRate) : '1500');
    setPaymentCycle(emp.paymentCycle || 'Diario');
    setEmergencyContact(emp.emergencyContact || '');
    setIsOpenForm(true);
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email) {
      alert("Por favor rellene todos los campos obligatorios.");
      return;
    }

    const payload = {
      name,
      email,
      role,
      status,
      shift,
      joinedDate: formMode === 'create' ? new Date().toISOString().split('T')[0] : (employees.find(e => e.id === selectedEmpId)?.joinedDate || new Date().toISOString().split('T')[0]),
      username: username || email.split('@')[0],
      password: password || 'password123',
      phone,
      salary: salary ? Number(salary) : undefined,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      paymentCycle,
      emergencyContact
    };

    if (formMode === 'create') {
      onAddEmployee(payload);
      setJustCreatedEmployee(payload);
    } else if (formMode === 'edit' && selectedEmpId) {
      onUpdateEmployee({
        ...payload,
        id: selectedEmpId
      });
    }

    setIsOpenForm(false);
  };

  // Render employee paysheet voucher modal
  const openPaymentModal = (employeeId: string) => {
    setPayEmpId(employeeId);
    setDisburseAmount(0);
    setDisburseNotes('Pago Salario por horas trabajadas');
    setDisburseMethod('Efectivo');
  };

  const handleRecordPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payEmpId || disburseAmount <= 0) {
      alert("Introduce un monto de pago válido");
      return;
    }
    await onRecordEmployeePayment(payEmpId, disburseAmount, disburseNotes, disburseMethod);
    setPayEmpId(null);
    alert("¡Pago de sueldo registrado con éxito!");
  };

  const toggleEmployeeStatus = (emp: Employee) => {
    onUpdateEmployee({
      ...emp,
      status: emp.status === 'Activo' ? 'Inactivo' : 'Activo'
    });
  };

  const handleManualClockInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showClockInModal) return;

    await onAddCashierSession({
      employeeId: showClockInModal.id,
      employeeName: showClockInModal.name,
      openTime: new Date().toISOString(),
      status: 'autorizado', // Directly active as authorized by admin
      initialCash: Number(manualInitialCash) || 0,
      salesCount: 0,
      salesTotal: 0,
      salesByMethod: {},
      debtPaymentsCollected: 0,
      hourlyRate: showClockInModal.hourlyRate || 1500,
      storeEmail: showClockInModal.storeEmail || 'global',
      shift: manualShift
    } as any);

    setShowClockInModal(null);
    alert(`¡Turno de ${showClockInModal.name} iniciado con éxito de forma manual!`);
  };

  const handleManualClockOutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showClockOutModal) return;

    const diffMs = Date.now() - new Date(showClockOutModal.openTime).getTime();
    const hoursWorked = diffMs / (1000 * 60 * 60);
    const calculatedWage = Math.round(hoursWorked * (showClockOutModal.hourlyRate || 1500));

    await onUpdateSessionStatus(
      showClockOutModal.id,
      'cerrado',
      Number(manualCloseCash) || 0,
      calculatedWage
    );

    setShowClockOutModal(null);
    alert(`¡Turno finalizado con éxito! Se acreditaron $${calculatedWage.toLocaleString('es-AR')} de salario devengado.`);
  };

  const handleExportEmployees = () => {
    const dataToExport = employees.map(emp => ({
      ID: emp.id,
      Nombre: emp.name,
      Email: emp.email,
      Usuario: emp.username || 'No asignado',
      Rol: emp.role,
      Horario: emp.shift,
      Fecha_Ingreso: emp.joinedDate,
      Estado: emp.status,
      Monto_Por_Hora: emp.hourlyRate || 0,
      Celular: emp.phone || 'No asignado',
      Salario_Basico: emp.salary || 0,
      Deuda_Acumulada: emp.accruedWages || 0,
      Monto_Pagado: emp.paidWages || 0,
      Contacto_Emergencia: emp.emergencyContact || 'No asignado'
    }));
    exportToCSV('MAX24_Personal_Liquidaciones', dataToExport);
  };

  const activeSessionsList = cashierSessions.filter(s => s.status === 'autorizado');
  const uniqueActiveIds = new Set(activeSessionsList.map(s => s.employeeId));
  const uniqueActiveCount = uniqueActiveIds.size;
  const hasDuplicateActiveSessions = activeSessionsList.length > uniqueActiveCount;

  return (
    <div className="space-y-6 text-left font-sans" id="employees-management-wrapper">
      
      {/* Title section and Add button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black font-sans text-slate-900 tracking-tight leading-none">Gestión de Personal & Finanzas</h2>
          <p className="text-xs text-slate-500 mt-1.5 font-sans">Controla accesos, tarifas por hora trabajada de tus cajeros y autoriza aperturas de cajas online vía WhatsApp.</p>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleExportEmployees}
            className="flex-1 sm:flex-initial border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Exportar planilla de personal a CSV"
          >
            <FileSpreadsheet className="w-4 h-4 text-slate-500 shrink-0" />
            Liquidaciones CSV
          </button>
          
          <button
            onClick={openCreateForm}
            className="flex-1 sm:flex-initial bg-orange-500 hover:bg-orange-400 text-slate-950 font-black px-4 py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-orange-500/10 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Empleado
          </button>
        </div>
      </div>

      {/* Roles Guide Section */}
      <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5" id="roles-guide-container">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowRolesGuide(!showRolesGuide)}>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-orange-100 rounded-xl text-orange-600">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">Definición de Roles de Usuario y Permisos</h4>
              <p className="text-[11px] text-slate-500">Haz clic para ver las capacidades y privilegios de cada cuenta en el sistema.</p>
            </div>
          </div>
          <button className="text-xs font-bold text-orange-600 hover:text-orange-500 cursor-pointer">
            {showRolesGuide ? "Ocultar Guía" : "Mostrar Detalle"}
          </button>
        </div>

        {showRolesGuide && (
          <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t border-slate-200/60 animate-fade-in">
            {/* Super Admin */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-red-100 text-red-600 border border-red-200 text-[9px] font-black tracking-widest rounded uppercase">Nivel Plataforma</span>
                <span className="text-xs font-bold text-slate-900">Super Master Admin</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Asociado a <span className="font-mono text-orange-600 font-bold">pezziniarg@gmail.com</span>. Administrador general del ecosistema MAX24. Administra todas las tiendas, planes de suscripción, soporte técnico y visualización global del negocio.
              </p>
            </div>

            {/* Administrador */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 border border-orange-200 text-[9px] font-black tracking-widest rounded uppercase">Propietario</span>
                <span className="text-xs font-bold text-slate-900">Administrador / Comercio</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Asociado al dueño de comercio (ej. <span className="font-mono text-orange-600 font-bold">bigmax24h7@gmail.com</span>). Tiene acceso total a la tienda: agregar/editar productos, control de stock, registrar compras mayoristas, configurar tarifas y autorizar aperturas de caja.
              </p>
            </div>

            {/* Gerente */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 border border-indigo-200 text-[9px] font-black tracking-widest rounded uppercase">Encargado</span>
                <span className="text-xs font-bold text-slate-900">Gerente</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Asistente directo del administrador del comercio. Puede gestionar productos, ver reportes y coordinar compras o inventario, pero no tiene permisos para alterar configuraciones avanzadas o suscripciones generales.
              </p>
            </div>

            {/* Supervisor */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 border border-emerald-200 text-[9px] font-black tracking-widest rounded uppercase">Control</span>
                <span className="text-xs font-bold text-slate-900">Supervisor</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Rol intermedio de control financiero. Autoriza aperturas de cajas, controla la recaudación física, audita retiros o ingresos de efectivo a la caja chica y gestiona el flujo de caja del turno activo.
              </p>
            </div>

            {/* Cajero */}
            <div className="p-4 bg-white border border-slate-100 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 border border-slate-200 text-[9px] font-black tracking-widest rounded uppercase">Operador</span>
                <span className="text-xs font-bold text-slate-900">Cajero</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Operador del Punto de Venta (POS). Escanea productos, cobra con diferentes métodos de pago, gestiona deudas de clientes ("Fiado") y debe solicitar autorización digital para iniciar o terminar su jornada de caja.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* SECCIÓN DE MONITOREO EN TIEMPO REAL */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-6" id="real-time-monitoring-dashboard">
        
        {/* CARD 1: EMPLEADOS TRABAJANDO AHORA */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xxs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-4">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
          </div>
          
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Trabajando Ahora</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 leading-none">
                {uniqueActiveCount}
              </span>
              <span className="text-xs font-bold text-slate-500">empleados en turno</span>
            </div>

            {hasDuplicateActiveSessions && (
              <div className="mt-3.5 p-2.5 bg-amber-50 border border-amber-200/80 rounded-2xl text-left animate-pulse">
                <p className="text-[10px] text-amber-800 font-bold leading-normal">
                  ⚠️ Se detectaron {activeSessionsList.length - uniqueActiveCount} turnos duplicados activos por solicitudes repetidas.
                </p>
                <button
                  onClick={async () => {
                    if (onConsolidateSessions) {
                      setIsConsolidating(true);
                      try {
                        const count = await onConsolidateSessions();
                        alert(`¡Consolidación exitosa! Se cerraron ${count} turnos duplicados residuales de Soledad Martinez / otros cajeros.`);
                      } catch (err) {
                        console.error(err);
                        alert("Hubo un error al consolidar.");
                      } finally {
                        setIsConsolidating(false);
                      }
                    }
                  }}
                  disabled={isConsolidating}
                  className="mt-2 w-full py-1.5 px-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-black text-[9px] rounded-xl tracking-tight uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                >
                  {isConsolidating ? 'Consolidando...' : '⚙️ Consolidar y Limpiar Duplicados'}
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs">
            {cashierSessions.filter(s => s.status === 'autorizado').length === 0 ? (
              <p className="text-slate-400 italic">No hay turnos activos en este momento.</p>
            ) : (
              <div className="space-y-1.5 max-h-[100px] overflow-y-auto pr-1">
                {cashierSessions.filter(s => s.status === 'autorizado').map(session => {
                  const diffMs = Date.now() - new Date(session.openTime).getTime();
                  const hours = Math.floor(diffMs / (1000 * 60 * 60));
                  const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
                  const runningWages = (diffMs / (1000 * 60 * 60)) * (session.hourlyRate || 1500);

                  return (
                    <div key={session.id} className="flex justify-between items-center bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <div className="text-left">
                        <p className="font-extrabold text-slate-800 leading-none">{session.employeeName}</p>
                        <span className="text-[9px] text-slate-400 font-medium font-mono">
                          In: {new Date(session.openTime).toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})} ({hours}h {mins}m)
                        </span>
                      </div>
                      <div className="text-right font-mono flex flex-col items-end">
                        <span className="text-[10px] font-bold text-emerald-600 leading-none">+${Math.round(runningWages).toLocaleString('es-AR')}</span>
                        <button 
                          onClick={() => setShowClockOutModal(session)}
                          className="text-[9px] font-black text-orange-600 hover:text-orange-500 cursor-pointer underline mt-1"
                        >
                          Cerrar Turno
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* CARD 2: COSTO HORARIO CORRIENTE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xxs flex flex-col justify-between">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Costo Horario Activo</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-slate-900 leading-none">
                ${cashierSessions.filter(s => s.status === 'autorizado').reduce((sum, s) => sum + (s.hourlyRate || 1500), 0).toLocaleString('es-AR')}
              </span>
              <span className="text-xs font-bold text-slate-500">/ hora total</span>
            </div>
            <p className="text-[11px] text-slate-450 leading-tight pt-1">
              Es el costo devengado acumulado por hora basado en las tarifas individuales configuradas de los cajeros activos.
            </p>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs flex justify-between items-center text-slate-500 bg-orange-50/10 p-2 rounded-xl border border-orange-500/10">
            <div className="text-left leading-none">
              <span className="text-[9px] font-bold uppercase tracking-wider text-orange-850 block font-mono">Simulador de Horas</span>
              <p className="text-[10px] font-medium text-slate-500 mt-1">Suma total de personal: {employees.length} registrados</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-black text-orange-950 bg-orange-100 px-1.5 py-0.5 rounded font-mono">Sincronizado</span>
            </div>
          </div>
        </div>

        {/* CARD 3: CICLOS DE LIQUIDACIÓN Y PAGO */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xxs flex flex-col justify-between">
          <div className="space-y-1 text-left">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Ciclos de Liquidación</span>
            <h4 className="text-xs font-black text-slate-800 pb-1">Distribución de Frecuencias de Pago</h4>
            
            <div className="grid grid-cols-3 gap-2 pt-1">
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Diario</span>
                <p className="text-sm font-black text-slate-800 font-mono">{employees.filter(e => (e.paymentCycle || 'Diario') === 'Diario').length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Semanal</span>
                <p className="text-sm font-black text-slate-800 font-mono">{employees.filter(e => e.paymentCycle === 'Semanal').length}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-2 text-center">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Mensual</span>
                <p className="text-sm font-black text-slate-800 font-mono">{employees.filter(e => e.paymentCycle === 'Mensual').length}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 border-t border-slate-100 pt-3 text-xs flex justify-between items-center text-slate-550">
            <span className="text-[10px] font-bold text-slate-450">Total Devengado Sin Pagar:</span>
            <span className="font-mono font-black text-red-650">
              ${employees.reduce((sum, e) => sum + ((e.accruedWages || 0) - (e.paidWages || 0)), 0).toLocaleString('es-AR')}
            </span>
          </div>
        </div>

      </div>

      {/* Internal Roster / Cashier Authorization Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4.5 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors
            ${activeTab === 'roster' 
              ? 'border-orange-500 text-orange-600 font-extrabold bg-orange-50/10' 
              : 'border-transparent text-slate-550 hover:text-slate-800'}
          `}
        >
          Nómina de Personal y Saldos
        </button>
        <button
          onClick={() => setActiveTab('shifts')}
          className={`px-4.5 py-2.5 text-xs font-bold border-b-2 cursor-pointer transition-colors flex items-center gap-1.5
            ${activeTab === 'shifts' 
              ? 'border-orange-500 text-orange-600 font-extrabold bg-orange-50/10' 
              : 'border-transparent text-slate-550 hover:text-slate-800'}
          `}
        >
          Autorización y Cierres de Turno
          {cashierSessions.filter(s => s.status === 'esperando_autorizacion').length > 0 && (
            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-bounce">
              {cashierSessions.filter(s => s.status === 'esperando_autorizacion').length} PENDI.
            </span>
          )}
        </button>
      </div>

      {activeTab === 'roster' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="roster-grid">
          {activeEmployees.map((emp) => {
            const isActive = emp.status === 'Activo';
            const accrued = emp.accruedWages || 0;
            const paid = emp.paidWages || 0;
            const debtToEmployee = accrued - paid;
            const activeSession = cashierSessions.find(s => s.employeeId === emp.id && s.status === 'autorizado');

            return (
              <div 
                key={emp.id} 
                className={`
                  bg-white p-5 rounded-3xl border transition-all duration-300 relative flex flex-col justify-between shadow-xxs
                  ${isActive ? 'border-slate-200' : 'border-slate-100 opacity-65 bg-slate-50/50'}
                  ${activeSession ? 'ring-2 ring-emerald-500/30 border-emerald-500' : ''}
                `}
              >
                <div>
                  {/* Badge top block */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 text-left">
                      <div className={`p-2.5 rounded-xl text-slate-700 bg-slate-50 border border-slate-100`}>
                        <ShieldCheck className="w-5 h-5 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="font-extrabold text-slate-800 text-sm leading-tight">{emp.name}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-bold tracking-wider uppercase font-mono">{emp.role}</p>
                      </div>
                    </div>

                    {activeSession ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 bg-green-50 text-green-700 border border-green-200 text-[9px] font-black tracking-wide uppercase rounded-full font-mono">
                        <span className="h-1.5 w-1.5 bg-green-500 rounded-full animate-pulse shrink-0" />
                        Turno Activo
                      </span>
                    ) : (
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide uppercase font-sans
                        ${isActive ? 'bg-orange-100 text-orange-900 border border-orange-200' : 'bg-slate-100 text-slate-500'}
                      `}>
                        {emp.status}
                      </span>
                    )}
                  </div>

                  {/* Wage Stats Widget box */}
                  <div className="mt-4 p-3 bg-slate-50 border border-slate-100 rounded-2xl grid grid-cols-3 gap-1 text-center font-mono">
                    <div className="leading-none text-left pl-1">
                      <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans tracking-tight">Valor Hora</span>
                      <p className="text-xs font-black text-slate-700 mt-1">${emp.hourlyRate || 1500}</p>
                    </div>
                    <div className="leading-none text-center">
                      <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans tracking-tight">Pagado</span>
                      <p className="text-xs font-black text-emerald-600 mt-1">${paid.toLocaleString('es-AR')}</p>
                    </div>
                    <div className="leading-none text-right pr-1">
                      <span className="text-[8.5px] uppercase font-bold text-slate-400 font-sans tracking-tight">Deuda Local</span>
                      <p className={`text-xs font-black mt-1 ${debtToEmployee > 0 ? 'text-red-650 font-bold' : 'text-slate-500'}`}>
                        ${debtToEmployee.toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>

                  {/* Main Contact fields */}
                  <div className="space-y-2 mt-4 border-t border-slate-100 pt-3.5 text-left text-xs text-slate-505">
                    <p className="flex items-center gap-2 text-[11px] text-slate-500 truncate">
                      <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{emp.email}</span>
                    </p>

                    <p className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Contacto: <strong>{emp.phone || 'No configurado'}</strong></span>
                    </p>

                    <p className="flex items-center gap-2 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Turno actual: <strong className="text-slate-700">{emp.shift}</strong></span>
                    </p>

                    <p className="flex items-center gap-2 text-[11px] text-slate-500">
                      <CreditCard className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>Frecuencia de pago: <strong className="text-slate-700">{emp.paymentCycle || 'Diario'}</strong></span>
                    </p>

                    {/* Security access creds */}
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 p-1.5 rounded-lg border border-slate-100 bg-slate-50/50 mt-1.5">
                      <User className="w-3.5 h-3.5 text-slate-450 shrink-0" />
                      <span className="truncate">Ingreso: <strong className="font-mono text-slate-800">{emp.username || 'Sin configurar'}</strong></span>
                    </div>

                    {/* History logs of past payments received */}
                    {emp.paymentsHistory && emp.paymentsHistory.length > 0 && (
                      <div className="pt-3 border-t border-slate-100 mt-2 text-left space-y-1.5">
                        <span className="text-[9px] uppercase font-bold tracking-wider text-slate-400 block font-sans">
                          Registro de Pagos de Sueldo ({emp.paymentsHistory.length})
                        </span>
                        <div className="max-h-[140px] overflow-y-auto pr-1 space-y-2 font-sans text-[11px]">
                          {emp.paymentsHistory.map(pay => {
                            return (
                              <div key={pay.id} className="p-2 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                                <div className="flex justify-between items-start gap-1">
                                  <div>
                                    <span className="font-extrabold text-slate-900">${pay.amount.toLocaleString('es-AR')}</span>
                                    <span className="text-[8px] font-mono text-slate-450 bg-slate-200/80 px-1 rounded ml-1.5 uppercase font-bold">{pay.method}</span>
                                    <p className="text-[10px] text-slate-500 font-medium leading-tight mt-0.5">{pay.notes || 'Pago de Salario'}</p>
                                  </div>
                                  <span className="text-[9px] text-slate-400 font-mono whitespace-nowrap text-right">
                                    {pay.date ? (() => {
                                      try {
                                        const d = new Date(pay.date);
                                        if (!isNaN(d.getTime())) {
                                          return (
                                            <>
                                              <div>{d.toLocaleDateString('es-AR')}</div>
                                              <div className="text-[8px] font-mono mt-0.5 text-slate-400">{d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs</div>
                                            </>
                                          );
                                        }
                                      } catch (e) {}
                                      return pay.date;
                                    })() : ''}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 text-[9.5px] mt-1">
                                  <div className="flex gap-1.5">
                                    <span className="text-slate-500">💼 Dueño:</span>
                                    {pay.ownerConfirmed ? (
                                      <span className="text-emerald-600 font-extrabold">✅ OK</span>
                                    ) : (
                                      <span className="text-amber-600 font-bold">⏳ Pendiente</span>
                                    )}
                                  </div>
                                  <div className="flex gap-1.5">
                                    <span className="text-slate-500">👤 Empleado:</span>
                                    {pay.employeeConfirmed ? (
                                      <span className="text-emerald-600 font-extrabold">✅ OK</span>
                                    ) : (
                                      <span className="text-amber-600 font-bold">⏳ Pendiente</span>
                                    )}
                                  </div>
                                </div>
                                {!pay.ownerConfirmed && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const updatedHistory = emp.paymentsHistory.map((p: any) => {
                                        if (p.id === pay.id) {
                                          return { ...p, ownerConfirmed: true, ownerConfirmedAt: new Date().toISOString() };
                                        }
                                        return p;
                                      });
                                      const updatedEmp = { ...emp, paymentsHistory: updatedHistory };
                                      if (onUpdateEmployee) {
                                        await onUpdateEmployee(updatedEmp);
                                      }
                                    }}
                                    className="w-full text-center py-1 mt-1 bg-slate-900 hover:bg-slate-800 text-white font-black text-[9px] rounded-md cursor-pointer uppercase transition-colors"
                                  >
                                    ✍️ Firmar como Dueño
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card controls row */}
                <div className="flex items-center justify-between border-t border-slate-100 pt-3.5 mt-4">
                  <button
                    onClick={() => toggleEmployeeStatus(emp)}
                    className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    {isActive ? (
                      <>
                        <ToggleRight className="w-5 h-5 text-orange-500" />
                        <span>Desactivar</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-5 h-5 text-slate-300" />
                        <span>Activar</span>
                      </>
                    )}
                  </button>

                  <div className="flex items-center gap-1">
                    {isActive && (
                      activeSession ? (
                        <button
                          onClick={() => {
                            setShowClockOutModal(activeSession);
                            setManualCloseCash('0');
                          }}
                          className="p-1 px-2 text-[9.5px] bg-red-650 hover:bg-red-500 text-white font-black rounded-lg transition-all cursor-pointer shadow-xs"
                          title="Finalizar turno de trabajo manual"
                        >
                          ⏹ Fin Turno
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setShowClockInModal(emp);
                            setManualShift(emp.shift || 'Mañana');
                            setManualInitialCash('0');
                          }}
                          className="p-1 px-2 text-[9.5px] bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-lg transition-all cursor-pointer shadow-xs"
                          title="Iniciar turno de trabajo manual"
                        >
                          ▶ Iniciar Turno
                        </button>
                      )
                    )}
                    <button
                      onClick={() => openPaymentModal(emp.id)}
                      className="p-1 px-2 text-[9.5px] bg-emerald-500 text-slate-950 font-black rounded-lg transition-all hover:bg-emerald-400 cursor-pointer"
                    >
                      $ Pagar Haberes
                    </button>
                    <button
                      onClick={() => setJustCreatedEmployee(emp)}
                      className="p-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-600 rounded-lg cursor-pointer flex items-center justify-center transition-colors"
                      title="Ver, descargar o compartir credenciales"
                    >
                      <CreditCard className="w-3.5 h-3.5 text-emerald-500" />
                    </button>
                    <button
                      onClick={() => openEditForm(emp)}
                      className="p-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-lg cursor-pointer"
                      title="Editar ficha básica"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Dar de baja de manera irreversible a ${emp.name}?`)) {
                          onDeleteEmployee(emp.id);
                        }
                      }}
                      className="p-1.5 hover:bg-red-50 text-slate-300 hover:text-red-500 rounded-lg cursor-pointer animate-none"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-6" id="shifts-controls-subtab">
          
          {/* Section: Pending live sign-ins authorizations needing Owner validation */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <Clock3 className="text-orange-500 w-4.5 h-4.5" />
              Solicitudes de Apertura de Caja / Sesión Pendientes
            </h3>

            {cashierSessions.filter(s => s.status === 'esperando_autorizacion').length === 0 ? (
              <div className="p-8 text-center italic text-xs text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                Ningún empleado está intentando ingresar al sistema POS en este momento.
              </div>
            ) : (
              <div className="divide-y divide-slate-150 animate-fade-in" id="pending-authorizations-ledger">
                {cashierSessions.filter(s => s.status === 'esperando_autorizacion').map((session) => (
                  <div key={session.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-left">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-amber-100 border border-amber-200 text-amber-900 font-extrabold text-[9px] font-mono tracking-wider rounded uppercase">
                          Cód: {session.id}
                        </span>
                        <span className="font-bold text-slate-750 text-sm">{session.employeeName}</span>
                      </div>
                      <p className="text-slate-500 font-medium">
                        Solicita ingresar turno con base de efectivo inicial: <strong className="font-mono text-slate-800">${session.initialCash}</strong>. Hora de ingreso: {new Date(session.openTime).toLocaleString('es-AR')}.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      
                      {/* Live WhatsApp fallback link click simulator */}
                      <a
                        href={`https://wa.me/54110000000?text=MAX24%20AUTORIZACION%3A%20Autorizar%20apertura%20de%20caja%20del%20empleado%20${encodeURIComponent(session.employeeName)}%20con%20código%20${session.id}`}
                        target="_blank"
                        referrerPolicy="no-referrer"
                        className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl flex items-center justify-center border border-emerald-150 cursor-pointer"
                        title="Autorizar y enviar aviso WhatsApp a Gerente"
                      >
                        <MessageSquare className="w-4 h-4" />
                      </a>

                      <button
                        onClick={async () => {
                          await onUpdateSessionStatus(session.id, 'autorizado');
                          alert(`¡Sesión de ${session.employeeName} autorizada en línea de inmediato! Ya puede iniciar facturación.`);
                        }}
                        className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow-sm"
                      >
                        <LockOpen className="w-3.5 h-3.5" />
                        Autorizar Online
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Historical closed cashier sessions log listing */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
              <History className="text-orange-500 w-4.5 h-4.5" />
              Historial de Horas Trabajadas y Cierres de Turno
            </h3>

            {cashierSessions.filter(s => s.status === 'cerrado').length === 0 ? (
              <div className="p-8 text-center italic text-xs text-slate-450 border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                Aún no existen cierres de turno / caja completados en esta sucursal.
              </div>
            ) : (
              <div className="space-y-4.5 animate-fade-in" id="closed-sessions-ledger">
                {cashierSessions.filter(s => s.status === 'cerrado').map((session) => {
                  
                  // Calculate shift duration
                  let durStr = 'No calculado';
                  if (session.closeTime) {
                    const diffMs = new Date(session.closeTime).getTime() - new Date(session.openTime).getTime();
                    const diffHrs = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;
                    durStr = `${diffHrs} hs trabajadas`;
                  }

                  return (
                    <div 
                      key={session.id}
                      className="p-4 bg-slate-5 border border-slate-150 rounded-2xl text-xs text-left grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      {/* Left: Metadata */}
                      <div className="space-y-1.5 leading-none">
                        <div className="flex items-center gap-2">
                          <span className="bg-slate-250 text-slate-700 px-1.5 py-0.5 font-mono font-bold text-[9px] rounded uppercase">
                            Sesión #{session.id}
                          </span>
                          <span className="text-[10.5px] text-emerald-700 font-extrabold flex items-center gap-0.5 font-sans">
                            <CheckCircle className="w-3 h-3 text-emerald-500" />
                            Cierre registrado
                          </span>
                        </div>

                        <p className="font-extrabold text-slate-800 text-sm leading-tight pt-1">{session.employeeName}</p>
                        <p className="text-[10px] text-slate-400 font-semibold">{durStr}</p>
                        <p className="text-[9.5px] text-slate-400 font-mono mt-1">In: {session.openTime.slice(11,16)}hs • Out: {session.closeTime?.slice(11,16)}hs</p>
                      </div>

                      {/* Center: Sales Breakdown */}
                      <div className="space-y-1 bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] leading-tight flex flex-col justify-between">
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Caja Apertura:</span>
                          <span className="font-mono font-bold text-slate-700">${session.initialCash}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Ventas del Turno ({session.salesCount}u):</span>
                          <span className="font-mono font-bold text-indigo-700">${session.salesTotal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400 font-semibold">Créditos/Fiados Turno:</span>
                          <span className="font-mono font-bold text-slate-600">${session.debtPaymentsCollected || 0}</span>
                        </div>
                        <div className="flex justify-between border-t pt-1.5 mt-1 border-dashed">
                          <span className="font-bold text-slate-805">Caja de Cierre:</span>
                          <span className="font-mono font-black text-slate-900">${session.closeCash || 0}</span>
                        </div>
                      </div>

                      {/* Right: Salary earned credit breakdown */}
                      <div className="flex flex-col justify-between text-right leading-none shrink-0 md:border-l border-slate-150 md:pl-4">
                        <div>
                          <p className="text-[9px] font-bold text-slate-400 tracking-wider uppercase font-mono">Pago Devengado del Turno</p>
                          <p className="text-base font-black text-slate-900 mt-1 font-mono">${(session.wageAccrued || 0).toLocaleString('es-AR')}</p>
                          <p className="text-[10px] text-slate-450 mt-1">Tarifa hora applied: ${session.hourlyRate}/h</p>
                        </div>

                        {/* WhatsApp / Send to owner actions link */}
                        <a
                          href={`https://wa.me/54110000000?text=MAX24%20REPORTE%20CIERRE%20Caja%20del%20empleado%20${encodeURIComponent(session.employeeName)}.%20Total%20Ventas%3A%20$${session.salesTotal}.%20Saldo%20Final%20Caja%3A%20$${session.closeCash}.%20Monto%2520Horas%2520Devengado%3A%20$${session.wageAccrued}.`}
                          target="_blank"
                          referrerPolicy="no-referrer"
                          className="py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-150 text-emerald-800 text-[9.5px] font-black rounded-lg flex items-center justify-center gap-1 cursor-pointer select-none leading-none mt-2 text-center"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />
                          Enviar Cierre por WhatsApp
                        </a>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      )}

      {/* DISBURSE EMPLOYEE PAY MODAL */}
      {payEmpId && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden" id="disburse-pay-modal">
            <button 
              onClick={() => setPayEmpId(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-1.5">
              <DollarSign className="text-emerald-500 w-5 h-5" />
              Registrar Liquidación / Entrega de Pago
            </h3>
            <p className="text-xs text-slate-500 mb-4">Ingresa el dinero desembolsado para deducir de la deuda de sutos/horas de tu empleado.</p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Monto Abonado ($ ARS) *</label>
                <input
                  type="number"
                  min="1"
                  value={disburseAmount}
                  onChange={(e) => setDisburseAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Método de Desembolso</label>
                <select
                  value={disburseMethod}
                  onChange={(e) => setDisburseMethod(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                >
                  <option value="Efectivo">Efectivo de Caja General</option>
                  <option value="Transferencia">Transferencia Bancaria / CVU</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Detalle o Concepto del Pago</label>
                <input
                  type="text"
                  value={disburseNotes}
                  onChange={(e) => setDisburseNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  placeholder="ej. Adelanto de quincena, Pago de turnos del fin de semana..."
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayEmpId(null)}
                  className="flex-1 py-2 text-slate-500 hover:text-slate-700 font-bold text-xs cursor-pointer rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Confirmar Pago y Registrar Egresar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MANUAL CLOCK IN */}
      {showClockInModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
          <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden" id="manual-clockin-modal">
            <button 
              onClick={() => setShowClockInModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-1.5">
              <Clock className="text-orange-500 w-5 h-5 animate-pulse" />
              Iniciar Turno Manual
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Estás abriendo una jornada de caja activa para <strong className="text-slate-900">{showClockInModal.name}</strong> de manera autorizada.
            </p>

            <form onSubmit={handleManualClockInSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Efectivo Inicial de Caja ($) *</label>
                <input
                  type="number"
                  value={manualInitialCash}
                  onChange={(e) => setManualInitialCash(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black"
                  placeholder="ej. 0"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Turno de Trabajo</label>
                <select
                  value={manualShift}
                  onChange={(e) => setManualShift(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                >
                  <option value="Mañana">Mañana</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Noche">Noche</option>
                  <option value="Rotativo">Rotativo</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowClockInModal(null)}
                  className="flex-1 py-2 text-slate-500 hover:text-slate-700 font-bold text-xs cursor-pointer rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Confirmar e Iniciar Turno
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL MANUAL CLOCK OUT */}
      {showClockOutModal && (() => {
        const diffMs = Date.now() - new Date(showClockOutModal.openTime).getTime();
        const hoursWorked = diffMs / (1000 * 60 * 60);
        const calculatedWage = Math.round(hoursWorked * (showClockOutModal.hourlyRate || 1500));
        
        return (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left">
            <div className="bg-white rounded-3xl max-w-md w-full border border-slate-200 p-6 relative overflow-hidden" id="manual-clockout-modal">
              <button 
                onClick={() => setShowClockOutModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <h3 className="text-base font-black text-slate-900 mb-1 flex items-center gap-1.5">
                <Clock className="text-red-500 w-5 h-5" />
                Cerrar Turno de Trabajo Manual
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Estás cerrando la jornada de caja activa para <strong className="text-slate-900">{showClockOutModal.employeeName}</strong>.
              </p>

              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-2xl space-y-2 mb-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Hora de inicio:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {new Date(showClockOutModal.openTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}hs
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Horas acumuladas:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {hoursWorked.toFixed(2)} horas
                  </span>
                </div>
                <div className="flex justify-between text-xs border-t border-slate-200/60 pt-2">
                  <span className="text-slate-500 font-bold">Salario a Acreditar:</span>
                  <span className="font-mono font-black text-emerald-600">
                    ${calculatedWage.toLocaleString('es-AR')} (${showClockOutModal.hourlyRate || 1500}/h)
                  </span>
                </div>
              </div>

              <form onSubmit={handleManualClockOutSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Efectivo de Cierre ($) *</label>
                  <input
                    type="number"
                    value={manualCloseCash}
                    onChange={(e) => setManualCloseCash(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-black"
                    placeholder="ej. 0"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowClockOutModal(null)}
                    className="flex-1 py-2 text-slate-500 hover:text-slate-700 font-bold text-xs cursor-pointer rounded-xl"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white font-black rounded-xl text-xs cursor-pointer shadow-md"
                  >
                    Cerrar Turno y Acreditar Pago
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* BASIC MODAL: REGISTRAR / EDITAR EMPLEADO */}
      {isOpenForm && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in col-span-2 text-left">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setIsOpenForm(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 hover:bg-slate-50 rounded-xl cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-extrabold text-slate-900 mb-1 flex items-center gap-2">
              <Users className="text-orange-500" />
              {formMode === 'create' ? 'Registrar Nuevo Miembro' : 'Editar Información Personal'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Complete las contraseñas, valor hora, salario e información de seguridad del empleado.</p>

            <form onSubmit={submitForm} className="space-y-4">
              
              {/* Full Name */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Nombre y Apellido *</label>
                <input
                  type="text"
                  placeholder="ej. Ana Belén Martínez"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Email */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    placeholder="ej. ana.m@tienda.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    placeholder="ej. +54 11 3344-5566"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                  />
                </div>
              </div>

              {/* SECURITY / CREDENTIALS section */}
              <div className="p-4 bg-orange-50/20 border border-orange-500/15 rounded-2xl space-y-3.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-950 block font-mono">Credenciales de Acceso</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {/* Username */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <User className="w-3 h-3 text-orange-500" />
                      Nombre de Usuario *
                    </label>
                    <input
                      type="text"
                      placeholder="ej. ana.m"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                      required
                    />
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1">
                      <KeyRound className="w-3 h-3 text-orange-500" />
                      Contraseña *
                    </label>
                    <input
                      type="password"
                      placeholder="ej. password123"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-hidden"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Role selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Rol Operativo *</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as Employee['role'])}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="Cajero">Cajero</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Gerente">Gerente</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                {/* Shift selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Horario de Turno *</label>
                  <select
                    value={shift}
                    onChange={(e) => setShift(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="Mañana">Mañana (08:00 - 16:00)</option>
                    <option value="Tarde">Tarde (16:00 - 00:00)</option>
                    <option value="Noche">Noche (00:00 - 08:00)</option>
                    <option value="Rotativo">Rotativo completo</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* Sueldo por Hora */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Sueldo por Hora ($)*</label>
                  <input
                    type="number"
                    placeholder="ej. 1500"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden"
                    required
                  />
                </div>

                {/* Payment Cycle */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Frecuencia de Pago</label>
                  <select
                    value={paymentCycle}
                    onChange={(e) => setPaymentCycle(e.target.value as 'Diario' | 'Semanal' | 'Mensual')}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden cursor-pointer"
                  >
                    <option value="Diario">Diario</option>
                    <option value="Semanal">Semanal</option>
                    <option value="Mensual">Mensual</option>
                  </select>
                </div>

                {/* Status selection */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Estado de Acceso</label>
                  <div className="flex items-center justify-around mt-1 bg-slate-50 px-2 py-2 text-xs rounded-xl border border-slate-200 h-[38px]">
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        value="Activo" 
                        checked={status === 'Activo'} 
                        onChange={() => setStatus('Activo')} 
                        className="accent-orange-500"
                      />
                      <span>Activo</span>
                    </label>
                    <label className="flex items-center gap-1 cursor-pointer">
                      <input 
                        type="radio" 
                        name="status" 
                        value="Inactivo" 
                        checked={status === 'Inactivo'} 
                        onChange={() => setStatus('Inactivo')} 
                        className="accent-orange-500"
                      />
                      <span>Inactivo</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Emergency contact info */}
              <div>
                <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Contacto de Emergencia</label>
                <textarea
                  placeholder="ej. María Pérez (Madre) - +54 11 2233-4455"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden h-16 resize-none"
                />
              </div>

              <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsOpenForm(false)}
                  className="flex-1 py-2.5 border border-slate-250 text-slate-600 font-bold rounded-xl text-xs hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* POPUP DE LA TARJETA DE CREDENCIALES COMPARTIBLE */}
      {justCreatedEmployee && (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in text-left font-sans">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-orange-150 shadow-2xl p-6 relative overflow-hidden flex flex-col items-center">
            {/* Barra superior de gradiente */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600" />
            
            {/* Encabezado */}
            <div className="text-center mt-2 mb-4">
              <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-2.5 shadow-xs">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-slate-900">¡Empleado Registrado!</h4>
              <p className="text-[11px] text-slate-500">Se ha creado la ficha y su acceso de forma segura.</p>
            </div>

            {/* Credential Card UI */}
            <div id="employee-badge-card" className="w-full bg-slate-900 text-white rounded-2xl p-5 shadow-lg border border-slate-800 relative overflow-hidden flex flex-col items-center">
              {/* Marca de agua */}
              <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full pointer-events-none" />
              
              {/* Encabezado con Logo/Nombre de la tienda en formato premium */}
              <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3.5 mb-2.5 select-none">
                <div className="flex items-center gap-2">
                  {storeSettings?.logoUrl ? (
                    <img src={storeSettings.logoUrl} alt="Logo" className="w-5 h-5 object-contain rounded-md" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-5 h-5 bg-gradient-to-br from-orange-500 to-amber-500 text-slate-950 rounded-md flex items-center justify-center font-black text-[10px]">
                      M
                    </div>
                  )}
                  <span className="font-sans font-black text-[11px] tracking-tight text-slate-100 uppercase truncate max-w-[130px]">
                    {storeSettings?.storeName || 'MAX24'}
                  </span>
                </div>
                <span className="text-[8px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                  Credencial Oficial
                </span>
              </div>

              <div className="absolute top-4.5 right-4 text-[8px] font-mono text-slate-400 font-bold hidden">ID: {justCreatedEmployee.username || 'emp'}</div>

              {/* Avatar Frame */}
              <div className="mt-2 mb-3.5 relative">
                <div className="w-16 h-16 bg-slate-800 border-2 border-orange-500 rounded-full flex items-center justify-center shadow-md">
                  <User className="w-8 h-8 text-orange-400" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-slate-900 flex items-center justify-center" title="Acceso Activo">
                  <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                </div>
              </div>

              {/* Name & Role */}
              <div className="text-center w-full">
                <h5 className="font-extrabold text-sm text-slate-100 tracking-tight truncate px-2">{justCreatedEmployee.name}</h5>
                <span className="mt-1 inline-block px-2.5 py-0.5 bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[9px] font-black tracking-widest uppercase rounded">
                  {justCreatedEmployee.role}
                </span>
              </div>

              {/* Info Box */}
              <div className="mt-4 w-full bg-slate-950/65 border border-slate-800/85 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium font-sans">ID Único de Tienda:</span>
                  <span className="font-mono font-black text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded select-all">{displayStoreCode}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium font-sans">Nombre de Usuario:</span>
                  <span className="font-mono font-bold text-slate-100 bg-white/5 px-2 py-0.5 rounded select-all">{justCreatedEmployee.username}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                  <span className="text-slate-400 font-medium font-sans">Contraseña Temporal:</span>
                  <span className="font-mono font-bold text-orange-400 bg-orange-500/5 px-2 py-0.5 rounded select-all">{justCreatedEmployee.password}</span>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-4.5 w-full flex justify-between items-center border-t border-slate-800/60 pt-3 text-[10px] text-slate-400 font-mono">
                <div>
                  <span className="block text-[8px] text-slate-500 uppercase font-bold">Turno</span>
                  <span className="font-bold text-slate-300">{justCreatedEmployee.shift}</span>
                </div>
                <div className="text-right">
                  <span className="block text-[8px] text-slate-500 uppercase font-bold">Sueldo /h</span>
                  <span className="font-bold text-emerald-400">${justCreatedEmployee.hourlyRate || 1500}</span>
                </div>
              </div>
            </div>

            {/* Acciones */}
            <div className="mt-5 w-full space-y-2">
              <button
                type="button"
                disabled={isGeneratingImage}
                onClick={downloadBadgeImage}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-amber-500/10"
              >
                {isGeneratingImage ? (
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CreditCard className="w-4.5 h-4.5" />
                )}
                <span>Descargar Tarjeta como Imagen (PNG)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const cleanPhone = justCreatedEmployee.phone ? justCreatedEmployee.phone.replace(/[^0-9]/g, '') : '';
                  const originUrl = window.location.origin;
                  
                  const waMessage = `*MAX24 - TARJETA DE ACCESO DE EMPLEADO*%0A%0A` +
                    `Hola *${encodeURIComponent(justCreatedEmployee.name)}*,%0A` +
                    `Te damos la bienvenida al equipo. Aquí tienes tus credenciales para ingresar al sistema de la tienda:%0A%0A` +
                    `🔑 *ID Único de Tienda:* ${encodeURIComponent(displayStoreCode)}%0A` +
                    `• *Usuario:* ${encodeURIComponent(justCreatedEmployee.username)}%0A` +
                    `• *Contraseña:* ${encodeURIComponent(justCreatedEmployee.password)}%0A` +
                    `• *Rol asignado:* ${encodeURIComponent(justCreatedEmployee.role)}%0A` +
                    `• *Turno:* ${encodeURIComponent(justCreatedEmployee.shift)}%0A` +
                    `• *Pago por Hora:* $${justCreatedEmployee.hourlyRate || 1500}/h%0A%0A` +
                    `🔗 *Ingresar aquí:* ${encodeURIComponent(originUrl)}%0A` +
                    `_(Elige "Cajero/Empleado" e ingresa el ID de Tienda arriba)_%0A%0A` +
                    `_¡Buen turno de trabajo!_`;
                    
                  const waUrl = cleanPhone 
                    ? `https://wa.me/${cleanPhone}?text=${waMessage}` 
                    : `https://wa.me/?text=${waMessage}`;
                    
                  window.open(waUrl, '_blank', 'noopener,noreferrer');
                }}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-500/10"
              >
                <MessageSquare className="w-4.5 h-4.5" />
                <span>Enviar Datos por WhatsApp</span>
              </button>

              <button
                type="button"
                onClick={() => setJustCreatedEmployee(null)}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs cursor-pointer transition-colors text-center"
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
