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
    // Check if already running in PWA standalone mode
    const isStandaloneMode = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    // Check if user previously dismissed the install prompt banner
    const isDismissed = localStorage.getItem('max24_pwa_banner_dismissed') === 'true';

    // Listen for beforeinstallprompt on Chrome/Android/Desktop
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      if (!isStandaloneMode && !isDismissed) {
        setShowBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, if not standalone and not dismissed, show banner
    if (isIOSDevice && !isStandaloneMode && !isDismissed) {
      setShowBanner(true);
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
      // Show iOS step-by-step installation instructions
      setShowIOSModal(true);
    } else {
      // Fallback instruction
      alert('Para instalar MAX24: Abre el menú de tu navegador y selecciona "Agregar a la pantalla de inicio" o "Instalar Aplicación".');
    }
  };

  const handleDismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('max24_pwa_banner_dismissed', 'true');
  };

  // If app is already installed/standalone, don't display prompt
  if (isStandalone) {
    return null;
  }

  return (
    <>
      {/* Floating or Top Banner for PWA Installation */}
      {showBanner && (
        <div className="mb-4 bg-gradient-to-r from-slate-900 via-orange-950/80 to-slate-900 border border-orange-500/30 text-white rounded-2xl p-3.5 sm:p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-3 animate-fade-in font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/40 text-orange-400 flex items-center justify-center shrink-0">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-white flex items-center gap-2">
                Instala MAX24 en tu dispositivo
                <span className="px-2 py-0.5 bg-orange-500 text-slate-950 font-black rounded-md text-[9px] uppercase">
                  PWA Directa
                </span>
              </h4>
              <p className="text-[11px] text-slate-300 font-medium leading-tight mt-0.5">
                Acceso rápido como App nativa desde tu pantalla de inicio, sin pasar por la Play Store.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleInstallClick}
              className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Instalar App</span>
            </button>
            <button
              type="button"
              onClick={handleDismissBanner}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-all cursor-pointer"
              title="Omitir"
            >
              <X className="w-4 h-4" />
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
