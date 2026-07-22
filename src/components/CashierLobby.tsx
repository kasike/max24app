import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  ShieldAlert, 
  LogOut, 
  CheckCircle, 
  Building2, 
  Send, 
  Loader2, 
  Sparkles,
  PhoneCall,
  User,
  Coins
} from 'lucide-react';
import { motion } from 'motion/react';
import { CashierSession, Employee, StoreSettings } from '../types';

interface CashierLobbyProps {
  pendingSession: CashierSession | null;
  onAddSession: (newSession: Omit<CashierSession, 'id'>) => Promise<CashierSession>;
  onUpdateStatus: (sessionId: string, nextStatus: 'autorizado' | 'cerrado') => Promise<void>;
  currentUser: Employee;
  onLogout: () => void;
  storeSettings: StoreSettings;
}

export default function CashierLobby({
  pendingSession,
  onAddSession,
  onUpdateStatus,
  currentUser,
  onLogout,
  storeSettings
}: CashierLobbyProps) {
  const [initialCashText, setInitialCashText] = useState('0');
  const [selectedShiftStr, setSelectedShiftStr] = useState('Mañana');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live clock effect for visual fidelity and reassurance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onAddSession({
        employeeId: currentUser.id,
        employeeName: currentUser.name,
        openTime: new Date().toISOString(),
        status: 'esperando_autorizacion',
        initialCash: Number(initialCashText) || 0,
        salesCount: 0,
        salesTotal: 0,
        salesByMethod: {},
        debtPaymentsCollected: 0,
        hourlyRate: currentUser.hourlyRate || 1500,
        storeEmail: currentUser.storeEmail || 'global',
        shift: selectedShiftStr
      });
    } catch (err) {
      console.error("Error submitting cashier session request:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGreeting = () => {
    const hours = currentTime.getHours();
    if (hours < 12) return '¡Buenos días';
    if (hours < 20) return '¡Buenas tardes';
    return '¡Buenas noches';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between font-sans relative overflow-hidden" id="cashier-lobby-screen">
      {/* Dynamic ambient background blurs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-500/5 blur-[120px] pointer-events-none" />

      {/* Header Bar */}
      <header className="px-6 py-4 border-b border-slate-900 bg-slate-950/80 backdrop-blur-md flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          {storeSettings.logoUrl ? (
            <img 
              src={storeSettings.logoUrl} 
              className="w-9 h-9 rounded-xl object-cover border border-slate-800" 
              referrerPolicy="no-referrer"
              alt="logo" 
            />
          ) : (
            <div className="p-2 bg-gradient-to-tr from-orange-500 to-amber-500 rounded-xl text-slate-950 font-black flex items-center justify-center w-9 h-9 text-xs">
              M24
            </div>
          )}
          <div>
            <h1 className="font-extrabold text-sm tracking-tight text-white">{storeSettings.name || 'MAX24'}</h1>
            <p className="text-[10px] text-slate-400 font-medium">Terminal de Cajeros</p>
          </div>
        </div>

        {/* Live Clock Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs font-mono font-medium text-slate-300">
          <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
          <span>{currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 md:p-8 z-10">
        <div className="w-full max-w-lg">
          {pendingSession ? (
            /* --- WAITING FOR AUTHORIZATION SCREEN --- */
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900/90 border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6 text-center relative overflow-hidden"
            >
              {/* Premium Top Line Accent */}
              <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-400" />

              {/* Pulsing Loading Badge */}
              <div className="relative flex justify-center py-4">
                <div className="absolute w-20 h-20 bg-amber-500/10 rounded-full animate-ping pointer-events-none" />
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Loader2 className="w-8 h-8 animate-spin" />
                </div>
              </div>

              {/* Main Information */}
              <div className="space-y-2">
                <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/25 rounded-full text-[10px] font-bold uppercase tracking-wider text-amber-400 inline-flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Pendiente de Aprobación
                </span>
                <h2 className="text-xl font-black text-white tracking-tight">Solicitud de Turno Registrada</h2>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  {getGreeting()}, <span className="text-white font-semibold">{currentUser.name}</span>. Hemos enviado tu solicitud de ingreso en tiempo real al administrador.
                </p>
              </div>

              {/* Shift Details Receipt Box */}
              <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 text-left space-y-3 font-sans">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-900 pb-1.5">Detalle del Turno Solicitado</h3>
                <div className="grid grid-cols-2 gap-y-2.5 gap-x-4 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Cajero / Empleado</span>
                    <span className="text-white font-semibold truncate block">{currentUser.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Turno Registrado</span>
                    <span className="text-white font-semibold block">{pendingSession.shift || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Fondo de Caja</span>
                    <span className="text-amber-500 font-extrabold block">${(pendingSession.initialCash || 0).toLocaleString('es-AR')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Hora de Solicitud</span>
                    <span className="text-white font-mono block">
                      {new Date(pendingSession.openTime).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })} hs
                    </span>
                  </div>
                </div>
              </div>

              {/* Real-time sync assurance alert */}
              <div className="px-4 py-3 bg-slate-950/40 border border-slate-900 rounded-2xl flex items-start gap-2 text-left">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-slate-300 leading-normal">
                  <strong>Actualización en Tiempo Real:</strong> No es necesario recargar esta pantalla. En cuanto el Administrador apruebe tu ingreso, el sistema se desbloqueará automáticamente y entrarás directo al Terminal de Cobros POS.
                </p>
              </div>

              {/* Actions list */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href={`https://wa.me/?text=Hola+Gerente,+he+solicitado+la+apertura+de+caja+para+mi+turno+de+${pendingSession.shift || 'N/A'}+con+un+fondo+inicial+de+%24${pendingSession.initialCash || 0}.+Por+favor+autor%C3%ADzame+en+la+secci%C3%B3n+de+Personal.+Gracias!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg transition-colors cursor-pointer"
                >
                  <PhoneCall className="w-4 h-4" />
                  Notificar por WhatsApp
                </a>

                <button
                  type="button"
                  onClick={onLogout}
                  className="py-3 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
                >
                  <LogOut className="w-4 h-4" />
                  Salir / Cambiar de Usuario
                </button>
              </div>

              {/* Practical Demo Bypass for easy testing */}
              <div className="pt-2 border-t border-slate-850/50">
                <button
                  type="button"
                  onClick={() => onUpdateStatus(pendingSession.id, 'autorizado')}
                  className="w-full py-2.5 bg-slate-850/60 hover:bg-slate-800 text-slate-400 hover:text-white font-bold text-[10px] rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer border border-slate-800 hover:border-slate-700"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                  Auto-Aprobar Acceso (Modo Sandbox / Prueba)
                </button>
              </div>
            </motion.div>
          ) : (
            /* --- SHIFT INITIALIZATION FORM SCREEN --- */
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl space-y-6"
            >
              {/* Profile Greeting */}
              <div className="flex items-center gap-4 border-b border-slate-800 pb-5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-orange-500/10">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-black text-white">{getGreeting()}, {currentUser.name}</h2>
                  <p className="text-xs text-slate-400 font-medium">Inicia tu turno de caja para comenzar a vender.</p>
                </div>
              </div>

              <form onSubmit={handleRequestSubmit} className="space-y-4">
                {/* Initial Cash input */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-500" />
                    Monto de Caja Inicial ($)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-bold font-mono text-xs">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      className="w-full pl-7 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-amber-500 focus:outline-hidden font-semibold"
                      placeholder="Monto de cambio inicial en efectivo"
                      value={initialCashText}
                      onChange={(e) => setInitialCashText(e.target.value)}
                    />
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Ingresa el efectivo inicial disponible en la gaveta para cambios.
                  </p>
                </div>

                {/* Shift selector */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-amber-500" />
                    Turno de Trabajo Asignado
                  </label>
                  <select
                    className="w-full px-3.5 py-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:border-amber-500 focus:outline-hidden font-semibold cursor-pointer"
                    value={selectedShiftStr}
                    onChange={(e) => setSelectedShiftStr(e.target.value)}
                  >
                    <option value="Mañana">🌅 Turno Mañana</option>
                    <option value="Tarde">☀️ Turno Tarde</option>
                    <option value="Noche">🌙 Turno Noche</option>
                  </select>
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg hover:shadow-orange-500/10 cursor-pointer disabled:opacity-50 transition-all"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Solicitar Apertura de Caja
                </button>
              </form>

              {/* Signout back options */}
              <div className="pt-4 border-t border-slate-800 flex justify-center">
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <LogOut className="w-4 h-4 text-red-400" />
                  Cerrar Sesión / Cambiar de Empleado
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </main>

      {/* Footer Branding */}
      <footer className="py-4 border-t border-slate-900 bg-slate-950 text-center text-[10px] text-slate-500 shrink-0 select-none z-10">
        <p>Sistema Operativo MAX24 • Tecnología Multi-Sucursal Segura en la Nube</p>
      </footer>
    </div>
  );
}
