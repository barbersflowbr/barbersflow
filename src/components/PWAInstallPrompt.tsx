import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Smartphone,
  X,
  Sparkles,
  Share,
  PlusSquare,
  Check,
  Apple,
  Info,
  ChevronDown,
  ArrowRight,
} from "lucide-react";
import { Barbearia } from "../lib/db";

interface PWAInstallPromptProps {
  activeBarbearia: Barbearia | null;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({
  activeBarbearia,
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isIos: false,
    isAndroid: false,
    isChrome: false,
    isSafari: false,
  });
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Check localStorage for dismissal
    const dismissedSession = sessionStorage.getItem("pwa_prompt_dismissed");
    if (dismissedSession) {
      setIsDismissed(true);
    }

    // Detect device and browser specs
    const ua = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(ua);
    const isAndroid = /android/.test(ua);
    const isMobile = isIos || isAndroid || /mobile|phone/.test(ua);
    const isChrome = /chrome|crios/.test(ua) && !/edge|edg/i.test(ua);
    const isSafari = /safari/.test(ua) && !/chrome|crios|android/.test(ua);

    setDeviceInfo({
      isMobile,
      isIos,
      isAndroid,
      isChrome,
      isSafari,
    });

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // If we got the native install event and it's not dismissed, show it!
      setIsInstalled(false);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      console.log("[PWA] App installed successfully!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Install choice: ${outcome}`);
      if (outcome === "accepted") {
        setIsInstalled(true);
        setDeferredPrompt(null);
      }
    } else {
      // No native prompt, show custom step-by-step instructions
      setShowInstructions(true);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsExpanded(false);
    sessionStorage.setItem("pwa_prompt_dismissed", "true");
  };

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  // Do not render anything if the user is in standalone mode or has already fully installed
  if (isInstalled) return null;

  const barbeariaName = activeBarbearia?.name || "BarbersFlow";
  const barbeariaLogo = activeBarbearia?.logo;

  return (
    <>
      {/* Minimized floating trigger button (visible when not expanded but still active) */}
      <AnimatePresence>
        {!isExpanded && (
          <motion.button
            id="pwa-install-fab"
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0, y: 50 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={toggleExpand}
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-amber-600 text-black font-semibold rounded-full p-3.5 shadow-2xl flex items-center justify-center gap-2 border border-amber-400/30 group cursor-pointer"
          >
            <div className="absolute inset-0 rounded-full bg-amber-400/20 animate-ping" />
            <Download className="w-5 h-5 animate-bounce" />
            {deviceInfo.isMobile && (
              <span className="text-xs font-bold tracking-wide pr-1">
                Instalar App
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Expanded PWA Install Sheet/Modal */}
      <AnimatePresence>
        {isExpanded && (
          <>
            {/* Backdrop overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleExpand}
              className="fixed inset-0 bg-black z-50 backdrop-blur-xs"
            />

            {/* Bottom Sheet for Mobile, Floating Box for Desktop */}
            <motion.div
              id="pwa-install-dialog"
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed bottom-0 left-0 right-0 md:bottom-6 md:right-6 md:left-auto md:max-w-md w-full bg-[#121215] border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl z-50 overflow-hidden text-gray-100 flex flex-col"
            >
              {/* Drag Handle or Small Indicator for Mobile */}
              <div className="w-full flex justify-center pt-3 pb-1 md:hidden">
                <div className="w-12 h-1 bg-white/20 rounded-full" />
              </div>

              {/* Header */}
              <div className="px-6 pt-4 pb-3 flex items-center justify-between border-b border-white/5">
                <div className="flex items-center gap-2.5">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 overflow-hidden border border-amber-500/20">
                      {barbeariaLogo ? (
                        <img
                          src={barbeariaLogo}
                          alt={barbeariaName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Smartphone className="w-5 h-5" />
                      )}
                    </div>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                    </span>
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-[15px] text-white">
                      Instalar Aplicativo
                    </h3>
                    <p className="text-[11px] text-gray-400">
                      {barbeariaName} no seu celular
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={handleDismiss}
                    title="Não mostrar novamente nesta sessão"
                    className="p-1.5 rounded-full hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="px-6 py-4 max-h-[60vh] overflow-y-auto space-y-4">
                {!showInstructions ? (
                  <>
                    <p className="text-xs text-gray-300 leading-relaxed text-left">
                      Adicione o aplicativo do <strong>{barbeariaName}</strong>{" "}
                      à sua tela de início para agendar com mais praticidade e
                      velocidade.
                    </p>

                    {/* App Benefits List */}
                    <div className="space-y-3 pt-1">
                      <div className="flex gap-3 text-left">
                        <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">
                            ⚡ Acesso Instantâneo
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Abra direto do ícone na tela inicial, como se fosse
                            instalado pela App Store/Play Store.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 text-left">
                        <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">
                            📶 Modo Offline
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Consulte seus agendamentos salvos e horários mesmo
                            sem conexão com a internet.
                          </p>
                        </div>
                      </div>

                      <div className="flex gap-3 text-left">
                        <div className="w-5 h-5 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-semibold text-white">
                            💾 Super Leve e Ágil
                          </h4>
                          <p className="text-[11px] text-gray-400">
                            Ocupa menos de 1MB de espaço e carrega
                            instantaneamente, poupando dados.
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  // Custom Step-By-Step Instructions based on OS
                  <div className="space-y-4 text-left">
                    <h4 className="text-xs font-semibold text-white flex items-center gap-1.5 uppercase tracking-wide">
                      <Info className="w-4 h-4 text-amber-500" />
                      Guia de Instalação Passo a Passo
                    </h4>

                    {deviceInfo.isIos ? (
                      /* iOS Safari Prompt */
                      <div className="space-y-3.5 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Apple className="w-4 h-4 text-white" />
                          <span className="text-xs font-bold text-white">
                            No iPhone / iPad (Safari)
                          </span>
                        </div>
                        <ol className="text-xs space-y-2.5 text-gray-300">
                          <li className="flex gap-2.5">
                            <span className="bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              1
                            </span>
                            <span>
                              Toque no botão de <strong>Compartilhar</strong>{" "}
                              (ícone de seta para cima{" "}
                              <Share className="w-3.5 h-3.5 inline mx-0.5 text-amber-500" />
                              ) na barra inferior do Safari.
                            </span>
                          </li>
                          <li className="flex gap-2.5">
                            <span className="bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              2
                            </span>
                            <span>
                              Role as opções para baixo e toque em{" "}
                              <strong>Adicionar à Tela de Início</strong> (
                              <PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-amber-500" />
                              ).
                            </span>
                          </li>
                          <li className="flex gap-2.5">
                            <span className="bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              3
                            </span>
                            <span>
                              Confirme clicando em <strong>Adicionar</strong> no
                              canto superior direito do seu iPhone.
                            </span>
                          </li>
                        </ol>
                      </div>
                    ) : deviceInfo.isAndroid ? (
                      /* Android / Chrome Manual Prompt */
                      <div className="space-y-3.5 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-white" />
                          <span className="text-xs font-bold text-white">
                            No Android (Chrome / Samsung)
                          </span>
                        </div>
                        <ol className="text-xs space-y-2.5 text-gray-300">
                          <li className="flex gap-2.5">
                            <span className="bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              1
                            </span>
                            <span>
                              Toque no ícone de menu (
                              <strong>três pontinhos</strong>) no canto superior
                              direito do navegador.
                            </span>
                          </li>
                          <li className="flex gap-2.5">
                            <span className="bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              2
                            </span>
                            <span>
                              Selecione a opção{" "}
                              <strong>Adicionar à tela inicial</strong> ou{" "}
                              <strong>Instalar aplicativo</strong>.
                            </span>
                          </li>
                          <li className="flex gap-2.5">
                            <span className="bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              3
                            </span>
                            <span>
                              Confirme a instalação no popup que aparecerá na
                              tela.
                            </span>
                          </li>
                        </ol>
                      </div>
                    ) : (
                      /* Desktop Browsers */
                      <div className="space-y-3.5 bg-amber-500/5 border border-amber-500/10 p-3.5 rounded-2xl">
                        <div className="flex items-center gap-2">
                          <Download className="w-4 h-4 text-white" />
                          <span className="text-xs font-bold text-white">
                            No Computador / Desktop
                          </span>
                        </div>
                        <ol className="text-xs space-y-2.5 text-gray-300">
                          <li className="flex gap-2.5">
                            <span className="bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              1
                            </span>
                            <span>
                              Clique no ícone de <strong>instalação</strong>{" "}
                              (computador com seta para baixo ou um ícone de +)
                              na barra de endereços do navegador (ao lado da
                              estrela de favoritos).
                            </span>
                          </li>
                          <li className="flex gap-2.5">
                            <span className="bg-amber-500 text-black text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                              2
                            </span>
                            <span>
                              Ou abra o menu de configurações (três pontinhos) e
                              selecione <strong>Salvar e Compartilhar</strong>{" "}
                              ou <strong>Instalar BarbersFlow</strong>.
                            </span>
                          </li>
                        </ol>
                      </div>
                    )}

                    <button
                      onClick={() => setShowInstructions(false)}
                      className="text-xs text-amber-500 hover:text-amber-400 font-semibold flex items-center gap-1 mt-2 cursor-pointer"
                    >
                      Voltar aos benefícios
                    </button>
                  </div>
                )}
              </div>

              {/* Action Buttons Footer */}
              <div className="px-6 py-4 bg-[#0E0E10] border-t border-white/5 flex flex-col gap-2.5">
                {deferredPrompt ? (
                  <button
                    onClick={handleInstallClick}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Instalar Aplicativo Agora
                  </button>
                ) : !showInstructions ? (
                  <button
                    onClick={() => setShowInstructions(true)}
                    className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition-all cursor-pointer"
                  >
                    <Smartphone className="w-4 h-4" />
                    Como Instalar no Celular
                  </button>
                ) : null}

                <div className="flex gap-2">
                  <button
                    onClick={toggleExpand}
                    className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-gray-300 font-medium rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    Minimizar
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="flex-1 py-2 bg-transparent hover:bg-white/5 text-gray-400 hover:text-white font-medium rounded-lg text-[11px] transition-colors cursor-pointer"
                  >
                    Não lembrar de novo
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
