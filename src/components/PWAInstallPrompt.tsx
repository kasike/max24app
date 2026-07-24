import React, { useState, useEffect } from 'react';
import { Download, Smartphone, CheckCircle, X, Share, PlusSquare, Monitor } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isStandalone, setIsStandalone] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [showBanner, setShowBanner] = useState<boolean>(false);

  useEffect(() => {
    // Check if running in PWA standalone mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check 7-day snooze logic
    const dismissedTime = localStorage.getItem('pwa_banner_dismissed');
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const isSnoozed = dismissedTime && (Date.now() - Number(dismissedTime) < SEVEN_DAYS_MS);

    // Listen for beforeinstallprompt on Chrome/Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isStandaloneMode && !isSnoozed) {
        // Delay by 3 seconds for optimal UX
        setTimeout(() => {
          setShowBanner(true);
        }, 3000);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS Safari, show banner with delay if not standalone & not snoozed
    if (isIOSDevice && !isStandaloneMode && !isSnoozed) {
      setTimeout(() => {
        setShowBanner(true);
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Trigger native browser install prompt (Android / Chrome / Desktop)
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowBanner(false);
        setDeferredPrompt(null);
      }
    } else if (isIOS) {
      // Show iOS step-by-step installation modal
      setShowIOSModal(true);
    } else {
      // Fallback instruction
      alert('Para instalar MAX24: Abre el menú de tu navegador y selecciona "Agregar a la pantalla de inicio" o "Instalar Aplicación".');
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    // Snooze for 7 days
    localStorage.setItem('pwa_banner_dismissed', String(Date.now()));
  };

  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Sticky Floating Bottom Sheet (Thumb Zone UX) */}
      {showBanner && (
        <div className="fixed bottom-4 left-4 right-4 z-50 bg-slate-900/95 backdrop-blur-md border border-orange-500/40 text-white p-4 rounded-2xl shadow-2xl md:max-w-md md:left-auto md:right-6 font-sans animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <p className="font-black text-sm text-white flex items-center gap-1.5">
                  Instalá la App de MAX24
                  <span className="px-1.5 py-0.5 bg-orange-500/20 border border-orange-500/40 text-orange-300 text-[9px] font-mono font-bold rounded">PWA</span>
                </p>
                <p className="text-xs text-slate-300 font-medium leading-tight mt-0.5">
                  Acceso rápido a tu caja, sin ocupar espacio de memoria.
                </p>
              </div>
            </div>
            <button
              onClick={handleDismissBanner}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-all cursor-pointer shrink-0"
              title="Omitir por 7 días"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={handleInstallClick}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-slate-950 font-black py-2.5 px-4 rounded-xl text-xs transition-all shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isIOS ? (
                <>
                  <span>🍎</span>
                  <span>Ver cómo instalar en iPhone</span>
                </>
              ) : (
                <>
                  <span>⚡</span>
                  <span>Instalar en 1 Clic</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in font-sans">
          <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl max-w-sm w-full p-6 space-y-5 shadow-2xl relative">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-orange-500/20 border border-orange-500/40 text-orange-400 rounded-2xl flex items-center justify-center mx-auto">
                <Smartphone className="w-6 h-6" />
              </div>
              <h3 className="text-base font-black text-white">Instalar MAX24 en iPhone / iPad</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Sigue estos sencillos pasos desde Safari para agregar la app a tu pantalla de inicio:
              </p>
            </div>

            <div className="space-y-3 bg-slate-950/80 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <div>
                  <p className="font-bold text-slate-200">Toca el botón Compartir</p>
                  <p className="text-[11px] text-slate-400">
                    Ubicado en la barra inferior de Safari (icono <Share className="w-3.5 h-3.5 inline text-orange-400" />).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 pt-2 border-t border-slate-800">
                <span className="w-6 h-6 rounded-full bg-orange-500 text-slate-950 font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <div>
                  <p className="font-bold text-slate-200">Selecciona "Agregar a Inicio"</p>
                  <p className="text-[11px] text-slate-400">
                    Desplázate hacia abajo y toca <PlusSquare className="w-3.5 h-3.5 inline text-orange-400" /> <strong>"Agregar a pantalla de inicio"</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl transition-all cursor-pointer"
            >
              ¡Entendido!
            </button>
          </div>
        </div>
      )}
    </>
  );
}
