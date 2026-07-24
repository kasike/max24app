import React, { useState, useEffect } from 'react';
import { Activity, CheckCircle2, ChevronRight, X, Sparkles, Clock, AlertCircle } from 'lucide-react';
import { StoreSettings, Employee } from '../types';
import { calculateStoreHealthScore, PendingTask } from '../utils/storeHealth';

interface StoreHealthBannerProps {
  storeSettings: StoreSettings;
  onOpenSettingsTab: (tab: 'generales' | 'costos' | 'arca' | 'compliance') => void;
  currentUser: Employee | null;
}

export default function StoreHealthBanner({
  storeSettings,
  onOpenSettingsTab,
  currentUser
}: StoreHealthBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [snoozedUntil, setSnoozedUntil] = useState<number>(() => {
    const saved = localStorage.getItem('health_banner_snoozed_until');
    return saved ? Number(saved) : 0;
  });

  const healthResult = calculateStoreHealthScore(storeSettings);
  const { score, pendingTasks } = healthResult;

  // Only show for Admins / Gerentes / SuperAdmin
  const isAdminOrManager = currentUser && (
    currentUser.role === 'Administrador' ||
    currentUser.role === 'Gerente' ||
    currentUser.email === 'pezziniarg@gmail.com'
  );

  if (!isAdminOrManager) return null;

  const isSnoozed = snoozedUntil > Date.now();

  if (score === 100) {
    return (
      <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-950 font-sans shadow-xxs">
        <div className="flex items-center gap-3 text-xs font-semibold">
          <div className="p-1.5 bg-emerald-500 text-white rounded-xl">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-emerald-900">¡Salud de tu Comercio al 100%!</span>
            <span className="text-[11px] text-emerald-700 block mt-0.5">
              Tu perfil, costos fijos, habilitaciones y facturación están perfectamente configurados.
            </span>
          </div>
        </div>
        <button
          onClick={() => onOpenSettingsTab('generales')}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[11px] rounded-xl transition-all cursor-pointer whitespace-nowrap"
        >
          Ver Ajustes
        </button>
      </div>
    );
  }

  if (isDismissed || isSnoozed) {
    return (
      <div className="mb-4 flex items-center justify-between px-3.5 py-2 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-all">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-orange-500" />
          <span className="font-bold text-slate-800">Salud del Comercio: {score}%</span>
          <span className="text-[10.5px] text-slate-500 hidden sm:inline">• Recordatorio pospuesto</span>
        </div>
        <button
          onClick={() => {
            setIsDismissed(false);
            setSnoozedUntil(0);
            localStorage.removeItem('health_banner_snoozed_until');
          }}
          className="text-[10.5px] font-bold text-orange-600 hover:text-orange-800 underline cursor-pointer"
        >
          Ver Tareas Pendientes ({pendingTasks.length})
        </button>
      </div>
    );
  }

  const topTask: PendingTask = pendingTasks[0];

  const handleSnoozeOneWeek = () => {
    const nextWeek = Date.now() + 7 * 24 * 3600 * 1000;
    setSnoozedUntil(nextWeek);
    localStorage.setItem('health_banner_snoozed_until', String(nextWeek));
  };

  return (
    <div className="mb-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 text-white rounded-2xl p-4 sm:p-5 shadow-xl relative overflow-hidden font-sans animate-fade-in">
      {/* Decorative subtle background gradient blur */}
      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
        <div className="space-y-2 max-w-xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-0.5 bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg text-[10px] font-black uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-orange-400" />
              Onboarding Progresivo
            </span>
            <span className="text-xs font-bold text-slate-300">
              Salud de tu Comercio: <strong className="text-orange-400 font-mono text-sm">{score}%</strong>
            </span>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-slate-950/80 rounded-full h-2 overflow-hidden border border-slate-700/60 p-0.5">
            <div
              className="bg-gradient-to-r from-orange-500 to-amber-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${score}%` }}
            />
          </div>

          <p className="text-xs text-slate-200 font-medium leading-relaxed pt-0.5">
            <strong className="text-white">{topTask.icon} {topTask.title}:</strong> {topTask.description}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-end md:self-center">
          <button
            onClick={() => onOpenSettingsTab(topTask.targetTab)}
            className="px-4 py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <span>Completar Ahora</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button
            onClick={handleSnoozeOneWeek}
            title="Posponer recordatorio por 7 días"
            className="px-3 py-2.5 bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white border border-white/10 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1"
          >
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Recordarme en 7 días</span>
            <span className="sm:hidden">Posponer</span>
          </button>

          <button
            onClick={() => setIsDismissed(true)}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
            title="Omitir por esta sesión"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
