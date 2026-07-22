import React, { useState, useEffect, useRef } from 'react';
import { 
  Accessibility, 
  Eye, 
  Type, 
  Volume2, 
  VolumeX, 
  X, 
  Settings, 
  Plus, 
  Minus, 
  Ear,
  Play
} from 'lucide-react';

interface AccessibilityAssistantProps {
  activeStoreEmail?: string;
}

export default function AccessibilityAssistant({ activeStoreEmail }: AccessibilityAssistantProps) {
  // Persistence key based on current store
  const storeSuffix = activeStoreEmail ? `_${activeStoreEmail}` : '_global';
  
  // Accessibility states
  const [isEnabled, setIsEnabled] = useState<boolean>(() => {
    return localStorage.getItem(`talkback_enabled${storeSuffix}`) === 'true';
  });
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    return localStorage.getItem(`accessibility_highcontrast${storeSuffix}`) === 'true';
  });
  const [largeText, setLargeText] = useState<boolean>(() => {
    return localStorage.getItem(`accessibility_largetext${storeSuffix}`) === 'true';
  });
  const [speechRate, setSpeechRate] = useState<number>(() => {
    return Number(localStorage.getItem(`talkback_rate${storeSuffix}`)) || 1.0;
  });
  const [speechVolume, setSpeechVolume] = useState<number>(() => {
    const saved = localStorage.getItem(`talkback_volume${storeSuffix}`);
    return saved !== null ? Number(saved) : 1.0;
  });

  const [isOpen, setIsOpen] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState<string>('');
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState<string>(() => {
    return localStorage.getItem(`talkback_voice${storeSuffix}`) || '';
  });
  const [lastSpoken, setLastSpoken] = useState<string>('');

  // Track utterance ref to allow cancellation
  const lastUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Load browser voices
  useEffect(() => {
    const updateVoices = () => {
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        // Filter for Spanish voices or fallback to English if no Spanish, or list all
        const spanishOrAll = availableVoices.filter(v => v.lang.toLowerCase().includes('es') || v.lang.toLowerCase().includes('en'));
        setVoices(spanishOrAll.length > 0 ? spanishOrAll : availableVoices);
        
        // Select a default Spanish voice if none set
        if (!selectedVoiceName && availableVoices.length > 0) {
          const defaultEs = availableVoices.find(v => v.lang.toLowerCase().includes('es-ar') || v.lang.toLowerCase().includes('es-'));
          if (defaultEs) {
            setSelectedVoiceName(defaultEs.name);
          } else {
            setSelectedVoiceName(availableVoices[0].name);
          }
        }
      }
    };

    updateVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, [selectedVoiceName]);

  // Persist settings on change
  useEffect(() => {
    localStorage.setItem(`talkback_enabled${storeSuffix}`, String(isEnabled));
    localStorage.setItem(`accessibility_highcontrast${storeSuffix}`, String(highContrast));
    localStorage.setItem(`accessibility_largetext${storeSuffix}`, String(largeText));
    localStorage.setItem(`talkback_rate${storeSuffix}`, String(speechRate));
    localStorage.setItem(`talkback_volume${storeSuffix}`, String(speechVolume));
    if (selectedVoiceName) {
      localStorage.setItem(`talkback_voice${storeSuffix}`, selectedVoiceName);
    }
  }, [isEnabled, highContrast, largeText, speechRate, speechVolume, selectedVoiceName, storeSuffix]);

  // Apply Visual Classes (High Contrast / Large Text) to the body element
  useEffect(() => {
    const root = document.documentElement;
    if (highContrast) {
      root.classList.add('accessibility-high-contrast');
    } else {
      root.classList.remove('accessibility-high-contrast');
    }

    if (largeText) {
      root.classList.add('accessibility-large-text');
    } else {
      root.classList.remove('accessibility-large-text');
    }

    return () => {
      root.classList.remove('accessibility-high-contrast');
      root.classList.remove('accessibility-large-text');
    };
  }, [highContrast, largeText]);

  // Central voice engine
  const speak = (text: string) => {
    if (!isEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;

    // Avoid repeating identical rapid narrations
    if (text === lastSpoken) return;

    try {
      window.speechSynthesis.cancel(); // Cancel active narration

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechRate;
      utterance.volume = speechVolume;
      
      // Assign selected voice
      if (selectedVoiceName) {
        const found = voices.find(v => v.name === selectedVoiceName);
        if (found) utterance.voice = found;
      }

      utterance.onstart = () => {
        setCurrentSubtitle(text);
        setLastSpoken(text);
      };

      utterance.onend = () => {
        // Clear subtitles after speech ends, with a slight delay
        setTimeout(() => {
          setCurrentSubtitle(prev => prev === text ? '' : prev);
        }, 800);
      };

      utterance.onerror = () => {
        setCurrentSubtitle('');
      };

      lastUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  // Helper to extract clean narrator text from DOM elements
  const getElementDescription = (el: HTMLElement): string => {
    // 1. Respect explicit ARIA definitions
    if (el.getAttribute('aria-label')) {
      return el.getAttribute('aria-label') || '';
    }
    
    // 2. Form controls
    if (el.tagName === 'INPUT') {
      const input = el as HTMLInputElement;
      const placeholder = input.placeholder ? ` con marcador ${input.placeholder}` : '';
      const val = input.value ? `, valor actual: ${input.value}` : '';
      let fieldType = 'campo de entrada';
      if (input.type === 'password') fieldType = 'campo de contraseña segura';
      if (input.type === 'number') fieldType = 'campo numérico';
      if (input.type === 'checkbox') fieldType = 'casilla de verificación ' + (input.checked ? 'marcada' : 'sin marcar');
      
      return `${fieldType}${placeholder}${val}`;
    }

    if (el.tagName === 'SELECT') {
      const select = el as HTMLSelectElement;
      const option = select.options[select.selectedIndex]?.text || '';
      return `Menú desplegable, seleccionado: ${option}`;
    }

    // 3. Native title attribute
    if (el.title) {
      return el.title;
    }

    // 4. Clean inner text parsing
    const directText = (el.innerText || el.textContent || '').trim();
    if (directText) {
      // Limit size to avoid reading massive pages on a simple hover
      if (directText.length < 180) {
        let prefix = '';
        if (el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') {
          prefix = 'Botón ';
        } else if (el.tagName === 'A' || el.getAttribute('role') === 'link') {
          prefix = 'Enlace a ';
        } else if (el.tagName === 'H1' || el.tagName === 'H2' || el.tagName === 'H3') {
          prefix = 'Título ';
        }
        return `${prefix}${directText}`;
      }
    }

    return '';
  };

  // Global listeners for hover and focus to simulate real TalkBack swipe/cursor narrations
  useEffect(() => {
    if (!isEnabled) {
      setCurrentSubtitle('');
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      return;
    }

    // Speak initial state
    speak("Lector de pantalla MAX24 activado.");

    let hoverTimeout: any;

    const handleMouseOver = (e: MouseEvent) => {
      clearTimeout(hoverTimeout);
      const target = e.target as HTMLElement;
      if (!target) return;

      // Find closest interactive or readable element up the tree
      const interactiveEl = target.closest('button, a, input, select, textarea, h1, h2, h3, [role="button"], [data-narrate]');
      if (interactiveEl) {
        hoverTimeout = setTimeout(() => {
          const desc = getElementDescription(interactiveEl as HTMLElement);
          if (desc) {
            speak(desc);
          }
        }, 150); // Debounce mouse tracking
      }
    };

    const handleFocusIn = (e: FocusEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;

      const desc = getElementDescription(target);
      if (desc) {
        speak(`En foco: ${desc}`);
      }
    };

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const btn = target.closest('button, [role="button"]');
      if (btn) {
        const desc = getElementDescription(btn as HTMLElement);
        if (desc) {
          speak(`Presionado: ${desc}`);
        }
      }
    };

    // Attach listeners
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('click', handleClick);

    return () => {
      clearTimeout(hoverTimeout);
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('click', handleClick);
    };
  }, [isEnabled, speechRate, speechVolume, selectedVoiceName]);

  // CSS overrides for High Contrast and Typography scaling
  useEffect(() => {
    const styleId = 'accessibility-assistant-custom-styles';
    let styleTag = document.getElementById(styleId);
    
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      styleTag.innerHTML = `
        /* High Contrast Theme Overrides */
        .accessibility-high-contrast,
        .accessibility-high-contrast body,
        .accessibility-high-contrast #root {
          background-color: #0f172a !important; /* Dark charcoal/blue background */
          color: #fef08a !important; /* Yellow text for premium legibility */
        }
        
        .accessibility-high-contrast div,
        .accessibility-high-contrast p,
        .accessibility-high-contrast span,
        .accessibility-high-contrast label,
        .accessibility-high-contrast input,
        .accessibility-high-contrast select,
        .accessibility-high-contrast header,
        .accessibility-high-contrast aside {
          background-color: #1e293b !important;
          color: #fef08a !important;
          border-color: #eab308 !important;
        }

        .accessibility-high-contrast button,
        .accessibility-high-contrast a,
        .accessibility-high-contrast [role="button"] {
          background-color: #eab308 !important;
          color: #0f172a !important;
          border: 2px solid #ffffff !important;
          font-weight: 900 !important;
        }

        .accessibility-high-contrast button:hover,
        .accessibility-high-contrast a:hover {
          background-color: #fef08a !important;
          color: #000000 !important;
        }

        .accessibility-high-contrast input::placeholder {
          color: #a1a1aa !important;
        }

        /* Large Font Scale Overrides */
        .accessibility-large-text p {
          font-size: 1.15rem !important;
          line-height: 1.6 !important;
        }
        .accessibility-large-text span, 
        .accessibility-large-text label, 
        .accessibility-large-text input, 
        .accessibility-large-text select,
        .accessibility-large-text button {
          font-size: 1.05rem !important;
        }
        .accessibility-large-text h1 {
          font-size: 2.25rem !important;
        }
        .accessibility-large-text h2 {
          font-size: 1.75rem !important;
        }
        .accessibility-large-text h3 {
          font-size: 1.45rem !important;
        }
      `;
      document.head.appendChild(styleTag);
    }
  }, []);

  return (
    <div id="accessibility-global-assistant-root" className="relative z-50">
      
      {/* Visual Subtitle Track - Rendered at bottom of screen (Helpful for Hipoacúsicos) */}
      {isEnabled && currentSubtitle && (
        <div 
          id="accessibility-subtitle-banner"
          className="fixed bottom-20 left-1/2 -translate-x-1/2 max-w-xl w-[90%] bg-slate-900/95 text-yellow-300 border-2 border-yellow-400 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-fade-in text-center font-sans"
        >
          <Ear className="w-5 h-5 text-yellow-400 animate-pulse shrink-0" />
          <p className="text-sm font-black tracking-wide leading-relaxed mx-auto">
            {currentSubtitle}
          </p>
        </div>
      )}

      {/* Floating Interactive Badge Indicator */}
      <button
        id="accessibility-floating-toggle-badge"
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 left-6 p-4 rounded-full shadow-2xl transition-all cursor-pointer flex items-center justify-center gap-1 group z-50 ${
          isEnabled 
            ? 'bg-blue-600 hover:bg-blue-700 text-white animate-pulse' 
            : 'bg-slate-800 hover:bg-slate-700 text-white'
        }`}
        aria-label="Panel de Accesibilidad y TalkBack por Voz"
        title="Panel de Accesibilidad y Narrador por Voz"
      >
        <Accessibility className="w-6 h-6 shrink-0 group-hover:rotate-12 transition-transform" />
        {isEnabled && (
          <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-slate-900 absolute top-0.5 right-0.5" />
        )}
      </button>

      {/* Settings Modal Interface Panel */}
      {isOpen && (
        <div 
          id="accessibility-settings-panel"
          className="fixed bottom-24 left-6 w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-2xl z-50 animate-bounce-in font-sans space-y-4 text-left"
        >
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-600 rounded-lg shrink-0">
                <Accessibility className="w-4 h-4" />
              </span>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 tracking-tight">Menú de Accesibilidad</h3>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-all p-1 rounded-lg"
              aria-label="Cerrar panel de accesibilidad"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="space-y-4">
            
            {/* 1. Voice TalkBack Toggle */}
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Asistente Narrador de Voz (TalkBack)</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEnabled(true);
                    setTimeout(() => speak("Lector de pantalla activo. Desliza el cursor o pulsa tabulador."), 200);
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    isEnabled 
                      ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-850'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  Activado
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEnabled(false);
                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                  }}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                    !isEnabled 
                      ? 'bg-slate-900 border-slate-800 text-white shadow-md' 
                      : 'bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-850'
                  }`}
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  Apagado
                </button>
              </div>
            </div>

            {/* Subtitle / Hear notification indicator for hipoacúsicos */}
            <div className="p-3 bg-blue-50/50 dark:bg-slate-850/40 border border-blue-100/50 dark:border-slate-800 rounded-xl space-y-1.5">
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 block">Apoyo Hipoacúsico</span>
              <p className="text-[10px] text-slate-500 dark:text-slate-450 leading-relaxed font-sans">
                El sistema de TalkBack incluye subtítulos flotantes de alta legibilidad en pantalla para personas con dificultades de audición.
              </p>
            </div>

            {/* 2. High Contrast toggle */}
            <div className="flex items-center justify-between py-1">
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-yellow-500 shrink-0" />
                  Alto Contraste Visual
                </span>
                <p className="text-[10px] text-slate-550 dark:text-slate-500 leading-snug font-sans">
                  Paleta de negro y oro de alta legibilidad.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-hidden shrink-0 ${
                  highContrast ? 'bg-yellow-550' : 'bg-slate-250 dark:bg-slate-800'
                }`}
                aria-label="Alternar modo de alto contraste"
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${
                  highContrast ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 3. Large Text scale toggle */}
            <div className="flex items-center justify-between py-1 border-t border-slate-100 dark:border-slate-800 pt-3">
              <div className="space-y-0.5 text-left">
                <span className="text-xs font-bold text-slate-850 dark:text-slate-200 flex items-center gap-1.5">
                  <Type className="w-4 h-4 text-emerald-500 shrink-0" />
                  Letra Grande (Zoom)
                </span>
                <p className="text-[10px] text-slate-550 dark:text-slate-500 leading-snug font-sans">
                  Aumenta el tamaño de la tipografía.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setLargeText(!largeText)}
                className={`w-11 h-6 rounded-full transition-colors relative cursor-pointer outline-hidden shrink-0 ${
                  largeText ? 'bg-emerald-500' : 'bg-slate-250 dark:bg-slate-800'
                }`}
                aria-label="Alternar texto de mayor tamaño"
              >
                <span className={`block w-4 h-4 rounded-full bg-white shadow-sm transition-transform absolute top-1 ${
                  largeText ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            {/* 4. Voice Rate controls (Only if Voice enabled) */}
            {isEnabled && (
              <div className="space-y-2 border-t border-slate-100 dark:border-slate-800 pt-3 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500">Velocidad de Lectura</span>
                  <span className="text-[10px] font-mono font-bold text-blue-500">{speechRate.toFixed(1)}x</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSpeechRate(prev => Math.max(0.5, prev - 0.1))}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                    title="Menor velocidad"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="range"
                    min="0.5"
                    max="2.0"
                    step="0.1"
                    value={speechRate}
                    onChange={(e) => setSpeechRate(Number(e.target.value))}
                    className="flex-1 accent-blue-600 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-lg appearance-none cursor-pointer"
                  />
                  <button
                    type="button"
                    onClick={() => setSpeechRate(prev => Math.min(2.0, prev + 0.1))}
                    className="p-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-lg cursor-pointer"
                    title="Mayor velocidad"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Voice Selector Dropdown */}
                {voices.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-450 dark:text-slate-500 block">Voz del Narrador</span>
                    <select
                      value={selectedVoiceName}
                      onChange={(e) => setSelectedVoiceName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-250 focus:outline-hidden focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-sans cursor-pointer"
                    >
                      {voices.map((v, i) => (
                        <option key={i} value={v.name}>
                          {v.name} ({v.lang})
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Test Narration button */}
                <button
                  type="button"
                  onClick={() => speak("Prueba de audio del lector de pantalla MAX24. Conexión segura establecida.")}
                  className="w-full py-1.5 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 text-blue-600 hover:text-blue-700 font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1"
                >
                  <Play className="w-3 h-3" />
                  Probar Sonido
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
