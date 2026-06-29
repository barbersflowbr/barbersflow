/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Scissors,
  Calendar,
  User,
  Clock,
  ChevronRight,
  ChevronLeft,
  Check,
  Phone,
  Mail,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Lock,
  Download,
  Smartphone,
  Share2,
  Star,
  RefreshCw,
  QrCode,
  X,
  MapPin,
} from "lucide-react";
import { initialAvailableHours } from "../data";
import { Barber, Service, Appointment } from "../types";
import {
  Barbearia,
  addBooking,
  getUnavailableSlots,
  mockBarbearia,
} from "../lib/db";
import { supabase } from "../lib/supabase";

function generateTimeSlots(
  start: string,
  end: string,
  intervalMinutes: number = 30,
): string[] {
  if (!start || !end) return [];
  const slots: string[] = [];
  let [currH, currM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  const endMinutes = endH * 60 + endM;

  while (true) {
    const currentMinutes = currH * 60 + currM;
    if (currentMinutes >= endMinutes) break;

    const hStr = String(currH).padStart(2, "0");
    const mStr = String(currM).padStart(2, "0");
    slots.push(`${hStr}:${mStr}`);

    currM += intervalMinutes;
    if (currM >= 60) {
      currH += Math.floor(currM / 60);
      currM = currM % 60;
    }
  }
  return slots;
}

function generateDateOptions() {
  const options = [];
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const d = new Date(today.getTime());
    d.setDate(today.getDate() + i);

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    const fullDate = `${yyyy}-${mm}-${dd}`;

    const dayName = daysOfWeek[d.getDay()];
    const dayNum = String(d.getDate()).padStart(2, "0");

    options.push({ dayName, dayNum, fullDate });
  }
  return options;
}

interface ClientPWAProps {
  onNavigate: (view: "landing" | "admin" | "pwa" | "superadmin") => void;
  activeBarbearia: Barbearia | null;
  onSetActiveBarbearia: (barbearia: Barbearia | null) => void;
  isStandalone?: boolean;
}

export default function ClientPWA({
  onNavigate,
  activeBarbearia,
  onSetActiveBarbearia,
  isStandalone = false,
}: ClientPWAProps) {
  // Days list for the Date Picker
  const dateOptions = generateDateOptions();

  // Stepper Steps: 0 - Landing, 1 - Service, 2 - Barber, 3 - Date & Time, 4 - Confirm, 5 - Success
  const [step, setStep] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    dateOptions[0]?.fullDate || "",
  ); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Client inputs
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // API checking and booking states
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(
    null,
  );

  // Validate URL slug and update activeBarbearia if needed
  useEffect(() => {
    const checkSlug = async () => {
      const pathname = window.location.pathname;
      const normalizedSlug = pathname.replace(/^\/+|\/+$/g, "").toLowerCase();

      if (
        normalizedSlug &&
        normalizedSlug !== "pwa" &&
        normalizedSlug !== "admin" &&
        normalizedSlug !== "superadmin" &&
        normalizedSlug !== "features" &&
        normalizedSlug !== "bento" &&
        normalizedSlug !== "pricing"
      ) {
        if (!activeBarbearia || activeBarbearia.slug !== normalizedSlug) {
          try {
            const { data, error } = await supabase
              .from("barbearias")
              .select("*")
              .eq("slug", normalizedSlug)
              .single();

            if (data && !error) {
              onSetActiveBarbearia(data as Barbearia);
            }
          } catch (err) {
            console.error("Error fetching barbearia by slug:", err);
          }
        }
      }
    };
    checkSlug();
  }, [activeBarbearia?.slug, onSetActiveBarbearia]);

  // Real PWA installation states & hooks
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIos, setIsIos] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPwaBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    // Detect iOS devices
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIosDevice);

    // Check if running in standalone mode (installed as PWA)
    const isStandaloneMode =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone;
    if (isStandaloneMode) {
      setPwaInstalled(true);
    }

    // Default banner visibility
    const isMobile =
      /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(
        userAgent,
      );
    setShowPwaBanner(isMobile && !isStandaloneMode);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
    };
  }, []);

  useEffect(() => {
    if (activeBarbearia && activeBarbearia.slug) {
      const manifest = {
        name: `${activeBarbearia.name}`,
        short_name: activeBarbearia.name,
        description: `Agendamento online para ${activeBarbearia.name}`,
        start_url: `/${activeBarbearia.slug}`,
        display: "standalone",
        orientation: "portrait",
        background_color: "#0E0E11",
        theme_color: "#F59E0B",
        icons: [
          {
            src: activeBarbearia.logo || "/logo.svg",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: activeBarbearia.logo || "/logo.svg",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      };

      const stringManifest = JSON.stringify(manifest);
      const blob = new Blob([stringManifest], { type: "application/json" });
      const manifestURL = URL.createObjectURL(blob);

      let manifestLink = document.querySelector('link[rel="manifest"]');
      if (manifestLink) {
        manifestLink.setAttribute("href", manifestURL);
      } else {
        manifestLink = document.createElement("link");
        manifestLink.setAttribute("rel", "manifest");
        manifestLink.setAttribute("href", manifestURL);
        document.head.appendChild(manifestLink);
      }

      // Update title
      document.title = `${activeBarbearia.name} - Agendamento`;

      return () => {
        URL.revokeObjectURL(manifestURL);
      };
    }
  }, [activeBarbearia]);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] PWA Install Prompt user choice: ${outcome}`);
      if (outcome === "accepted") {
        setPwaInstalled(true);
      }
      setDeferredPrompt(null);
    } else if (isIos) {
      alert(
        'Para instalar no seu iPhone:\n\n1. Toque no botão de "Compartilhar" (ícone com seta para cima)\n2. Role a lista e toque em "Adicionar à Tela de Início"\n3. Confirme clicando em "Adicionar" no canto superior direito.',
      );
    } else {
      alert(
        'Para instalar o aplicativo:\n\nToque no ícone de menu do seu navegador (três pontinhos no canto superior) e selecione "Instalar aplicativo" ou "Adicionar à tela inicial".',
      );
    }
  };

  // Category filter for step 1
  const [activeCategory, setActiveCategory] = useState<
    "Todos" | "Cabelo" | "Barba" | "Combo" | "Tratamento"
  >("Todos");

  const [isLoading, setIsLoading] = useState(!activeBarbearia);

  // Fallback / Auto-load from DB
  useEffect(() => {
    if (!activeBarbearia) {
      const loadDefaultBarbearia = async () => {
        try {
          const { getAllBarbearias, mockBarbearia } = await import("../lib/db");
          const list = await getAllBarbearias();
          let onboarded = null;
          if (list && list.length > 0) {
            // Find a barbearia that is fully onboarded and has both barbers and services
            onboarded = list.find(
              (b) =>
                b.isOnboarded &&
                b.barbers &&
                b.barbers.length > 0 &&
                b.services &&
                b.services.length > 0,
            );
          }
          if (onboarded) {
            onSetActiveBarbearia(onboarded);
          } else {
            onSetActiveBarbearia(mockBarbearia);
          }
        } catch (err) {
          console.warn("Could not load database barbearias:", err);
          try {
            const { mockBarbearia } = await import("../lib/db");
            onSetActiveBarbearia(mockBarbearia);
          } catch (mockErr) {
            console.error("Failed to load mockBarbearia:", mockErr);
          }
        } finally {
          setIsLoading(false);
        }
      };
      loadDefaultBarbearia();
    } else {
      setIsLoading(false);
    }
  }, [activeBarbearia, onSetActiveBarbearia]);

  // Real-time sub for barbearia data
  useEffect(() => {
    if (!activeBarbearia) return;

    const unsubscribe = import("../lib/db").then((m) =>
      m.subscribeBarbearia(activeBarbearia.id, (updated) => {
        onSetActiveBarbearia(updated);
      }),
    );

    return () => {
      unsubscribe.then((unsub) => {
        if (typeof unsub === "function") unsub();
      });
    };
  }, [activeBarbearia?.id]);

  // Dynamic references based on loaded barbearia
  const barbers = activeBarbearia?.barbers || [];
  const services = activeBarbearia?.services || [];

  // Re-run slot checker with real-time subscription when barber, date, or step changes
  useEffect(() => {
    if (!activeBarbearia || !selectedBarber || step !== 3) return;

    setIsCheckingSlots(true);
    setSelectedTime(null); // Reset selected time on change

    const unsubscribePromise = import("../lib/db").then((m) => {
      return m.subscribeBookings(activeBarbearia.id, (allBookings) => {
        const barberBookings = allBookings.filter(
          (b) => b.barberId === selectedBarber.id && b.date === selectedDate,
        );
        const unavailable = barberBookings.map((b) => b.time);
        setUnavailableSlots(unavailable);
        setIsCheckingSlots(false);
      });
    });

    return () => {
      unsubscribePromise.then((unsub) => {
        if (typeof unsub === "function") unsub();
      });
    };
  }, [activeBarbearia?.id, selectedBarber?.id, selectedDate, step]);

  // Handle final booking submission
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !selectedBarber ||
      !selectedService ||
      !selectedTime ||
      !activeBarbearia
    )
      return;

    setIsSubmitting(true);
    setBookingError(null);

    const payload = {
      barberId: selectedBarber.id,
      serviceId: selectedService.id,
      clientName,
      clientEmail:
        clientEmail ||
        `${clientName.toLowerCase().replace(/\s+/g, "")}@example.com`,
      clientPhone: clientPhone || "(11) 99999-9999",
      date: selectedDate,
      time: selectedTime,
      status: "Ocupado" as const,
    };

    try {
      const b = await addBooking(activeBarbearia.id, payload);
      setConfirmedBooking(b);
      setStep(5); // Go to success screen
    } catch (err: any) {
      console.error(err);
      setBookingError(
        err.message ||
          "Este horário acabou de ser preenchido por outro cliente. Por favor, retorne e selecione outro horário.",
      );
      setStep(3); // Kick back to select time step
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedTime(null);
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setStep(0);
    setBookingError(null);
  };

  const filteredServices =
    activeCategory === "Todos"
      ? services
      : services.filter((s) => s.category === activeCategory);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto" />
          <p className="text-xs text-gray-400 font-mono tracking-widest uppercase">
            Carregando Aplicativo...
          </p>
        </div>
      </div>
    );
  }

  if (!activeBarbearia) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-[#0E0E10] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white tracking-tight">
            Nenhuma Barbearia Ativa
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Para realizar um agendamento, você deve acessar o link exclusivo da
            sua barbearia ou estar logado no painel administrativo.
          </p>
          <button
            onClick={() => onNavigate("admin")}
            className="w-full py-3.5 bg-amber-500 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-[0.98] cursor-pointer"
          >
            Ir para Login Administrativo
          </button>
        </div>
      </div>
    );
  }

  const pwaContent = (
    <div
      className={`relative w-full ${isStandalone ? "max-w-5xl lg:max-w-6xl min-h-screen mx-auto rounded-none border-none shadow-none bg-[#0E0E10]" : "max-w-[340px] h-[670px] rounded-[48px] border-[8px] border-[#1F1F23] bg-[#111113] shadow-2xl"} overflow-hidden flex flex-col shrink-0`}
    >
      {/* iPhone Speaker Notch */}
      {!isStandalone && (
        <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-800 rounded-b-3xl z-40 items-center justify-center">
          <div className="w-16 h-1 bg-black rounded-full mb-1.5" />
          <div className="w-2 h-2 bg-gray-950 rounded-full ml-3 mb-1.5" />
        </div>
      )}

      {/* Dynamic Simulated Status Bar */}
      {!isStandalone && (
        <div className="h-10 pt-4 px-6 flex items-center justify-between text-[11px] font-mono text-gray-400 shrink-0 select-none bg-[#0E0E10] z-30">
          <span>09:41</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 rounded uppercase font-bold tracking-wide">
              PWA App
            </span>
            <div className="w-5 h-3 bg-gray-800 rounded-sm relative p-0.5">
              <div className="w-full h-full bg-gray-400 rounded-xs" />
            </div>
          </div>
        </div>
      )}

      {/* PWA Simulated Smart App Install Banner */}
      {showPwaBanner && !pwaInstalled && step !== 5 && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="mx-4 mt-2 p-3 bg-gradient-to-r from-[#17171B] to-[#121215] border border-amber-500/20 rounded-2xl flex items-center justify-between z-20 relative shadow-lg"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center shrink-0">
              <Scissors className="w-4 h-4 text-black" />
            </div>
            <div className="text-left">
              <h4 className="text-[11px] font-bold text-white leading-tight">
                Instalar BarbersFlow
              </h4>
              <p className="text-[9px] text-gray-500 leading-none mt-0.5">
                Agende offline da sua tela de início
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleInstallClick}
              className="px-2.5 py-1 bg-amber-500 text-black text-[10px] font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3" />
              Instalar
            </button>
            <button
              onClick={() => setShowPwaBanner(false)}
              className="text-gray-500 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
      {/* PWA App Navigation Header */}
      <header className="px-5 py-4 border-b border-white/5 bg-[#121215]/80 shrink-0">
        <div
          className={`flex items-center justify-between w-full ${isStandalone ? "max-w-5xl lg:max-w-6xl mx-auto px-1 md:px-4" : ""}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500 overflow-hidden shrink-0">
              {activeBarbearia?.logo ? (
                <img
                  src={activeBarbearia.logo}
                  alt="Logo"
                  className="w-full h-full object-cover"
                />
              ) : (
                <Scissors className="w-4.5 h-4.5" />
              )}
            </div>
            <div className="text-left">
              <span className="block text-[8px] font-mono text-amber-500 tracking-wider uppercase font-bold truncate max-w-[140px]">
                {activeBarbearia?.name || "Sua Barbearia"}
              </span>
              <h1 className="text-xs font-bold text-white leading-none mt-0.5">
                Agendamento
              </h1>
            </div>
          </div>
          {step > 0 && step < 5 && (
            <button
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              Voltar
            </button>
          )}
        </div>
      </header>

      {/* STEPPER PROGRESS BAR */}
      {step > 0 && step < 5 && (
        <div className="px-5 py-2 bg-[#121215]/40 border-b border-white/5 shrink-0 select-none">
          <div
            className={`flex items-center justify-between w-full ${isStandalone ? "max-w-5xl lg:max-w-6xl mx-auto px-1 md:px-4" : ""} text-[10px] font-mono`}
          >
            <span className="text-gray-500 uppercase tracking-widest font-bold">
              Progresso
            </span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`w-4.5 h-1 rounded-full transition-all duration-300 ${
                    step >= s ? "bg-amber-500" : "bg-gray-800"
                  }`}
                />
              ))}
              <span className="text-amber-500 font-bold ml-1.5">P{step}</span>
            </div>
          </div>
        </div>
      )}

      {/* APP BODY (Scrollable Screen area) */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col no-scrollbar bg-[#0E0E10]">
        {/* Dynamic Collision Errors */}
        {bookingError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2 animate-pulse">
            <AlertCircle className="w-4.5 h-4.5 shrink-0 mt-0.5" />
            <p className="font-light leading-relaxed">{bookingError}</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* PASSO 0: LANDING DA BARBEARIA */}
          {step === 0 && (
            <motion.div
              key="step0"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-6 text-left pb-6"
            >
              {/* Under standalone view, we render a beautiful responsive grid of details */}
              <div
                className={`grid grid-cols-1 ${isStandalone ? "lg:grid-cols-12" : ""} gap-6`}
              >
                {/* Left Column: Cover Banner and Information */}
                <div
                  className={`${isStandalone ? "lg:col-span-7" : ""} flex flex-col gap-5`}
                >
                  {/* Hero Banner Card */}
                  <div className="relative h-48 md:h-64 lg:h-72 rounded-2xl overflow-hidden border border-white/5 shadow-2xl shrink-0">
                    <img
                      src="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1000&auto=format&fit=crop&q=80"
                      alt="Barbearia Padrão"
                      className="w-full h-full object-cover brightness-[0.35] scale-105 hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10] via-transparent to-transparent" />

                    {/* Status Indicator */}
                    <div className="absolute top-3 left-3 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                      <span className="text-[9px] font-mono font-extrabold text-emerald-400 uppercase tracking-widest">
                        Aberto
                      </span>
                    </div>

                    {/* Rating Badge */}
                    <div className="absolute top-3 right-3 bg-black/40 border border-white/5 px-2.5 py-1 rounded-lg flex items-center gap-1 backdrop-blur-md text-[10px] font-mono">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-extrabold text-white">4.9</span>
                    </div>

                    {/* Identity Header overlay */}
                    <div className="absolute bottom-5 left-5 right-5 flex items-center gap-4">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 overflow-hidden shrink-0 shadow-lg backdrop-blur-sm">
                        {activeBarbearia?.logo ? (
                          <img
                            src={activeBarbearia.logo}
                            alt="Logo"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Scissors className="w-6 h-6 text-amber-500" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-lg md:text-2xl font-extrabold text-white tracking-tight truncate leading-tight">
                          {activeBarbearia?.name}
                        </h2>
                        <span className="text-[11px] md:text-xs text-gray-400 font-light flex items-center gap-1 mt-1 font-mono">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate">
                            {activeBarbearia?.location || "Localização Premium"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* About / Welcome Segment */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5">
                    <h3 className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">
                      Boas-vindas
                    </h3>
                    <p className="text-xs md:text-sm text-gray-400 font-light leading-relaxed mt-2.5">
                      Cortes modernos, barbas alinhadas à toalha quente e uma
                      experiência única de autocuidado masculino. O padrão de
                      qualidade que você merece para elevar sua autoimagem.
                    </p>
                  </div>

                  {/* Contacts & Horários cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left">
                      <span className="text-[9px] text-gray-500 font-mono block uppercase tracking-wider">
                        HORÁRIOS
                      </span>
                      <span className="text-xs text-white font-medium block mt-1.5 leading-relaxed">
                        Seg a Sáb
                        <br />
                        09:00 às 20:00
                      </span>
                    </div>
                    <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left flex flex-col justify-between">
                      <div>
                        <span className="text-[9px] text-gray-500 font-mono block uppercase tracking-wider">
                          CONTATO
                        </span>
                        <span className="text-xs text-white font-medium block mt-1 truncate">
                          {activeBarbearia?.phone || "WhatsApp da Casa"}
                        </span>
                      </div>
                      {activeBarbearia?.phone && (
                        <a
                          href={`https://wa.me/${activeBarbearia.phone.replace(/\D/g, "")}?text=Ol%C3%A1%2C%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20sobre%20os%20hor%C3%A1rios.`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[10px] text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1 mt-3 font-mono uppercase"
                        >
                          Conversar
                          <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Column: Actions (CTA, Barbers & Services List) */}
                <div
                  className={`${isStandalone ? "lg:col-span-5" : ""} flex flex-col gap-5`}
                >
                  {/* Master Action */}
                  <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-5 flex flex-col gap-3">
                    <span className="text-[9px] text-amber-500 font-mono block uppercase tracking-wider text-center">
                      Fazer Reserva
                    </span>
                    <button
                      onClick={() => setStep(1)}
                      className="w-full py-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(245,158,11,0.25)] hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
                    >
                      <Scissors className="w-4.5 h-4.5 text-black stroke-[3px]" />
                      <span>Agendar Online Agora</span>
                    </button>
                  </div>

                  {/* Grid of Professionals with Quick Link */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                        Profissionais
                      </h3>
                      <span className="text-[9px] text-gray-500 font-mono">
                        Toque para agendar
                      </span>
                    </div>

                    <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                      {barbers.length === 0 ? (
                        <p className="text-[10px] text-gray-500 italic">
                          Nenhum profissional cadastrado.
                        </p>
                      ) : (
                        barbers.map((barber) => (
                          <div
                            key={barber.id}
                            onClick={() => {
                              setSelectedBarber(barber);
                              setStep(1); // Jump to select service
                            }}
                            className="flex flex-col items-center p-3.5 bg-white/[0.02] border border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5 rounded-xl min-w-[105px] text-center transition-all duration-300 cursor-pointer shrink-0"
                          >
                            <img
                              src={barber.avatar}
                              alt={barber.name}
                              className="w-12 h-12 rounded-full object-cover border border-white/10"
                            />
                            <span className="text-xs font-bold text-white mt-2 truncate w-full">
                              {barber.name}
                            </span>
                            <span className="text-[9px] text-amber-500/80 font-mono block truncate w-full mt-1">
                              {barber.role}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Popular Services Shortcuts */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-white uppercase tracking-widest font-mono">
                        Serviços Disponíveis
                      </h3>
                      <span className="text-[9px] text-gray-500 font-mono">
                        Toque para escolher
                      </span>
                    </div>

                    <div className="flex flex-col gap-2.5">
                      {services.length === 0 ? (
                        <p className="text-[10px] text-gray-500 italic">
                          Nenhum serviço cadastrado.
                        </p>
                      ) : (
                        services.slice(0, 3).map((service) => (
                          <div
                            key={service.id}
                            onClick={() => {
                              setSelectedService(service);
                              setStep(2); // Set service and jump to choose barber
                            }}
                            className="p-4 rounded-xl bg-white/[0.02] hover:bg-amber-500/[0.04] border border-white/5 hover:border-amber-500/20 flex items-center justify-between transition-all duration-300 cursor-pointer text-xs"
                          >
                            <div className="text-left">
                              <span className="text-[8px] font-mono text-amber-500 uppercase tracking-wider bg-amber-500/5 px-1.5 py-0.5 rounded">
                                {service.category}
                              </span>
                              <h4 className="font-bold text-white mt-2">
                                {service.name}
                              </h4>
                              <span className="text-[9px] text-gray-500 flex items-center gap-1 mt-1 font-mono">
                                <Clock className="w-3.5 h-3.5 text-amber-500/50" />{" "}
                                {service.duration} min
                              </span>
                            </div>
                            <span className="font-mono font-extrabold text-amber-400 text-sm">
                              R$ {service.price}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* PASSO 1: SELECIONAR SERVIÇO */}
          {step === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 text-left"
            >
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Selecione o Atendimento
                </h3>
                <p className="text-[10px] text-gray-400 font-light mt-0.5">
                  Estética capilar, barba e combos exclusivos de alto padrão.
                </p>
              </div>

              {/* Categories Tabs */}
              <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
                {(
                  ["Todos", "Cabelo", "Barba", "Combo", "Tratamento"] as const
                ).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase font-mono whitespace-nowrap transition-all cursor-pointer ${
                      activeCategory === cat
                        ? "bg-amber-500 text-black font-extrabold shadow-sm"
                        : "bg-white/5 text-gray-400 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Services Cards List */}
              <div
                className={`grid grid-cols-1 ${isStandalone ? "md:grid-cols-2 lg:grid-cols-3" : ""} gap-4`}
              >
                {filteredServices.map((service) => {
                  const isSelected = selectedService?.id === service.id;
                  return (
                    <div
                      key={service.id}
                      onClick={() => setSelectedService(service)}
                      className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? "bg-amber-500/10 border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.05)] pl-5"
                          : "bg-white/[0.03] border-white/5 hover:border-white/10"
                      }`}
                    >
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                      )}
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <span className="text-[8px] font-mono font-bold text-amber-500 uppercase tracking-widest bg-amber-500/5 px-1.5 py-0.5 rounded">
                            {service.category}
                          </span>
                          <h4 className="text-xs font-bold text-white mt-1.5 leading-tight">
                            {service.name}
                          </h4>
                          <p className="text-[10px] text-gray-400 font-light mt-1 leading-snug">
                            {service.description}
                          </p>
                        </div>
                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-black font-extrabold" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3.5 border-t border-white/5 font-mono">
                        <span className="text-[10px] text-gray-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-amber-500/60" />{" "}
                          {service.duration} minutos
                        </span>
                        <span
                          className={`text-xs font-extrabold ${isSelected ? "text-amber-400" : "text-white"}`}
                        >
                          R$ {service.price}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Navigation Button */}
              <div className="mt-4 pt-4 bg-gradient-to-t from-[#0E0E10] sticky bottom-0">
                <button
                  disabled={!selectedService}
                  onClick={() => setStep(2)}
                  className="w-full py-4 rounded-xl bg-amber-500 text-black text-xs font-bold tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                >
                  Próximo: Escolher Barbeiro
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* PASSO 2: SELECIONAR BARBEIRO */}
          {step === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-4 text-left"
            >
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Selecione o Profissional
                </h3>
                <p className="text-[10px] text-gray-400 font-light mt-0.5">
                  Nossos mestres visagistas prontos para te atender.
                </p>
              </div>

              <div
                className={`grid grid-cols-1 ${isStandalone ? "md:grid-cols-2 lg:grid-cols-3" : ""} gap-4`}
              >
                {barbers
                  .filter((b) =>
                    b.assignedServices.includes(selectedService?.id || ""),
                  )
                  .map((barber) => {
                    const isSelected = selectedBarber?.id === barber.id;
                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex items-center gap-4 ${
                          isSelected
                            ? "bg-amber-500/10 border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.05)] pl-5"
                            : "bg-white/[0.03] border-white/5 hover:border-white/10"
                        }`}
                      >
                        {isSelected && (
                          <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-amber-500" />
                        )}
                        <img
                          className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0"
                          src={barber.avatar}
                          alt={barber.name}
                        />

                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white leading-tight truncate">
                            {barber.name}
                          </h4>
                          <span className="text-[9px] text-amber-500/80 font-mono block leading-none mt-1">
                            {barber.role}
                          </span>

                          <div className="flex items-center text-[10px] text-amber-500 mt-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span className="ml-1 font-bold text-white font-mono">
                              {barber.rating.toFixed(1)}
                            </span>
                            <span className="text-gray-500 ml-1 font-light font-mono">
                              ({barber.reviews} reviews)
                            </span>
                          </div>
                        </div>

                        {isSelected && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shrink-0">
                            <Check className="w-3 h-3 text-black font-extrabold" />
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>

              <div className="mt-4 pt-4 bg-gradient-to-t from-[#0E0E10] sticky bottom-0">
                <button
                  disabled={!selectedBarber}
                  onClick={() => setStep(3)}
                  className="w-full py-4 rounded-xl bg-amber-500 text-black text-xs font-bold tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                >
                  Próximo: Escolher Horário
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* PASSO 3: SELECIONAR DATA / HORÁRIO (Chips & API validation) */}
          {step === 3 &&
            (() => {
              const currentDayOpt = dateOptions.find(
                (d) => d.fullDate === selectedDate,
              );
              const currentDayName = currentDayOpt?.dayName || "";
              const isWorkingDaySelected = selectedBarber?.workingHours?.days
                ? selectedBarber.workingHours.days.includes(currentDayName)
                : true;

              return (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="flex flex-col gap-4 text-left"
                >
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Data e Horário
                    </h3>
                    <p className="text-[10px] text-gray-400 font-light mt-0.5">
                      Os horários são atualizados e validados pela API em tempo
                      real.
                    </p>
                  </div>

                  {/* Weekday Slide Selector */}
                  <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
                    {dateOptions.map((opt) => {
                      const isSelectedDate = selectedDate === opt.fullDate;
                      const worksThisDay = selectedBarber?.workingHours?.days
                        ? selectedBarber.workingHours.days.includes(opt.dayName)
                        : true;

                      return (
                        <button
                          key={opt.fullDate}
                          onClick={() => {
                            setSelectedDate(opt.fullDate);
                            setSelectedTime(""); // Reset selected time on date change
                          }}
                          className={`p-3 rounded-xl min-w-[55px] text-center flex flex-col items-center justify-center border transition-all cursor-pointer ${
                            isSelectedDate
                              ? "bg-amber-500 border-amber-500 text-black font-bold shadow-[0_3px_12px_rgba(245,158,11,0.25)]"
                              : worksThisDay
                                ? "bg-white/5 border-white/5 text-gray-400 hover:text-white"
                                : "bg-[#121215]/30 border-white/5 text-gray-600 line-through"
                          }`}
                          title={
                            worksThisDay
                              ? undefined
                              : "Profissional não atende neste dia"
                          }
                        >
                          <span
                            className={`text-[9px] uppercase font-mono tracking-wider ${isSelectedDate ? "text-black" : "text-gray-500"}`}
                          >
                            {opt.dayName}
                          </span>
                          <span className="text-xs font-mono font-extrabold mt-1">
                            {opt.dayNum}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Hour Chips Grid */}
                  <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 border-t border-b border-white/5 py-2">
                    <span className="uppercase tracking-widest font-bold">
                      Grade de Horários
                    </span>
                    <span className="text-amber-500/80 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      Fuso: Horário de Brasília
                    </span>
                  </div>

                  {!isWorkingDaySelected ? (
                    <div className="py-10 flex flex-col items-center justify-center text-center text-xs text-gray-500 gap-2 border border-white/5 bg-[#131316] rounded-2xl p-4">
                      <AlertCircle className="w-6 h-6 text-amber-500/80 animate-bounce" />
                      <span className="font-semibold text-gray-300">
                        Profissional Indisponível
                      </span>
                      <p className="text-[10px] text-gray-500 max-w-xs px-4">
                        {selectedBarber?.name} não trabalha aos/às{" "}
                        <strong>{currentDayName}s</strong>. Por favor, selecione
                        outra data.
                      </p>
                    </div>
                  ) : isCheckingSlots ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center text-xs text-gray-500 gap-3">
                      <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                      <span>Validando disponibilidade via API...</span>
                    </div>
                  ) : (
                    <div
                      className={`grid grid-cols-3 ${isStandalone ? "sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8" : ""} gap-2.5`}
                    >
                      {(() => {
                        const slots =
                          selectedBarber && selectedBarber.workingHours
                            ? generateTimeSlots(
                                selectedBarber.workingHours.start,
                                selectedBarber.workingHours.end,
                                selectedBarber.workingHours.slotInterval || 30,
                              )
                            : initialAvailableHours;

                        if (slots.length === 0) {
                          return (
                            <p className="col-span-3 text-xs text-gray-500 italic text-center py-6">
                              Nenhum horário disponível para esta data.
                            </p>
                          );
                        }

                        return slots.map((time) => {
                          const isUnavailable = unavailableSlots.includes(time);
                          const isSelectedTime = selectedTime === time;

                          return (
                            <button
                              key={time}
                              disabled={isUnavailable}
                              onClick={() => setSelectedTime(time)}
                              className={`p-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                                isUnavailable
                                  ? "bg-neutral-900/40 border border-neutral-900 text-gray-700 cursor-not-allowed opacity-50"
                                  : isSelectedTime
                                    ? "bg-amber-500 border-amber-500 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]"
                                    : "bg-white/5 border-white/5 text-gray-200 hover:border-amber-500/30"
                              }`}
                            >
                              {isUnavailable ? (
                                <>
                                  <Lock className="w-3 h-3 text-gray-700" />
                                  <span className="line-through">{time}</span>
                                </>
                              ) : (
                                time
                              )}
                            </button>
                          );
                        });
                      })()}
                    </div>
                  )}

                  <div className="mt-4 pt-4 bg-gradient-to-t from-[#0E0E10] sticky bottom-0">
                    <button
                      disabled={
                        !selectedTime ||
                        isCheckingSlots ||
                        !isWorkingDaySelected
                      }
                      onClick={() => setStep(4)}
                      className="w-full py-4 rounded-xl bg-amber-500 text-black text-xs font-bold tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(245,158,11,0.25)]"
                    >
                      Próximo: Dados & Confirmar
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })()}

          {/* PASSO 4: CONFIRMAÇÃO DO CLIENTE */}
          {step === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-5 text-left"
            >
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Dados de Confirmação
                </h3>
                <p className="text-[10px] text-gray-400 font-light mt-0.5">
                  Preencha seus dados para receber o lembrete de confirmação via
                  WhatsApp.
                </p>
              </div>

              <div
                className={`grid grid-cols-1 ${isStandalone ? "md:grid-cols-2" : ""} gap-5 items-start`}
              >
                {/* Review selection details card */}
                <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4 text-xs font-light">
                  <span className="text-[10px] font-mono font-bold text-amber-500 uppercase tracking-widest block border-b border-white/5 pb-2">
                    Resumo da Reserva
                  </span>

                  <div className="flex items-center gap-3">
                    <Scissors className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono block">
                        SERVIÇO
                      </span>
                      <span className="font-bold text-white text-sm">
                        {selectedService?.name} (R$ {selectedService?.price})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                    <User className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono block">
                        BARBEIRO
                      </span>
                      <span className="font-bold text-white text-sm">
                        {selectedBarber?.name}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 border-t border-white/5 pt-3">
                    <Calendar className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono block">
                        HORÁRIO DE AGENDA
                      </span>
                      <span className="font-bold text-white font-mono text-sm">
                        {selectedDate.split("-").reverse().join("/")} às{" "}
                        <span className="text-amber-400 font-bold">
                          {selectedTime}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmBooking} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 mb-1 tracking-wider">
                      NOME COMPLETO
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="Ex: Gabriel Silva"
                      className="w-full p-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 mb-1 tracking-wider">
                      E-MAIL (OPCIONAL)
                    </label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Ex: seuemail@gmail.com"
                      className="w-full p-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 mb-1 tracking-wider">
                      WHATSAPP / CELULAR
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: (11) 98888-7777"
                      className="w-full p-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-medium"
                    />
                  </div>

                  <div className="pt-3">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-amber-500 text-black text-xs font-extrabold tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(245,158,11,0.25)] hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Finalizando reserva...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4.5 h-4.5" />
                          Confirmar Agendamento Premium
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* PASSO 5: SUCESSO - PWA CONFIRMED APPOINTMENT */}
          {step === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col gap-5 text-center py-4 max-w-md mx-auto w-full"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                <Check className="w-8 h-8 font-extrabold" />
              </div>

              <div>
                <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10 inline-block">
                  Agendamento Confirmado
                </span>
                <h3 className="text-base font-extrabold text-white mt-3 tracking-wide">
                  Tudo pronto para seu corte!
                </h3>
                <p className="text-[10px] text-gray-400 font-light max-w-[280px] mx-auto mt-1 leading-relaxed">
                  Você receberá um lembrete no WhatsApp 2 horas antes de seu
                  horário agendado.
                </p>
              </div>

              {/* DIGITAL PASS WALLET ACCENT DESIGN */}
              <div className="bg-[#121215] rounded-3xl border border-white/5 overflow-hidden text-left shadow-lg relative">
                {/* Rounded cuts on side to simulate ticket wallet pass */}
                <div className="absolute top-1/2 -left-3 w-6 h-6 bg-[#0E0E10] rounded-full z-10" />
                <div className="absolute top-1/2 -right-3 w-6 h-6 bg-[#0E0E10] rounded-full z-10" />

                {/* Pass Header */}
                <div className="p-4 border-b border-dashed border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4.5 h-4.5 text-amber-500" />
                    <span className="font-bold text-white text-[10px] uppercase font-mono tracking-wider">
                      BarbersFlow Pass
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-amber-500/80 font-bold">
                    VIP COORD
                  </span>
                </div>

                {/* Pass Body */}
                <div className="p-5 space-y-4 font-light text-[11px] text-gray-300">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-gray-500 font-mono block uppercase">
                        CLIENTE
                      </span>
                      <span className="font-bold text-white truncate block">
                        {confirmedBooking?.clientName}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-mono block uppercase">
                        PROFISSIONAL
                      </span>
                      <span className="font-bold text-white block">
                        {selectedBarber?.name}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-[9px] text-gray-500 font-mono block uppercase">
                        SERVIÇO
                      </span>
                      <span className="font-bold text-white block">
                        {selectedService?.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-[9px] text-gray-500 font-mono block uppercase">
                        PREÇO
                      </span>
                      <span className="font-bold text-amber-400 block font-mono">
                        R$ {selectedService?.price}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 border-t border-white/5 pt-3">
                    <div>
                      <span className="text-[9px] text-gray-500 font-mono block uppercase">
                        DATA E HORÁRIO
                      </span>
                      <span className="text-xs font-mono font-extrabold text-white">
                        {selectedDate.split("-").reverse().join("/")} às{" "}
                        <span className="text-amber-400">{selectedTime}</span>
                      </span>
                    </div>
                  </div>

                  {/* Barcode representation */}
                  <div className="pt-4 flex flex-col items-center justify-center gap-2">
                    <div className="bg-white p-3 rounded-xl border border-white/10 flex items-center justify-center">
                      <QrCode className="w-16 h-16 text-black" />
                    </div>
                    <span className="text-[8px] font-mono text-gray-500 tracking-widest">
                      {confirmedBooking?.id}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5">
                <button
                  onClick={resetFlow}
                  className="w-full py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold text-xs text-white transition-all cursor-pointer"
                >
                  Agendar Outro Atendimento
                </button>

                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      alert("Link de agendamento compartilhado com sucesso!")
                    }
                    className="flex-1 py-3.5 rounded-xl bg-black/40 border border-white/5 hover:bg-black text-[11px] text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Compartilhar
                  </button>
                  <button
                    onClick={() => onNavigate("admin")}
                    className="flex-1 py-3.5 rounded-xl bg-black/40 border border-white/5 hover:bg-black text-[11px] text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Ver na Agenda
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {activeBarbearia?.phone && (
        <a
          href={`https://wa.me/${activeBarbearia.phone.replace(/\D/g, "")}?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20sobre%20um%20agendamento.`}
          target="_blank"
          rel="noopener noreferrer"
          className={`absolute ${isStandalone ? "bottom-6 right-6" : "bottom-10 right-4"} z-40 flex items-center justify-center w-12 h-12 bg-[#25D366] hover:bg-[#20b958] text-white rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300`}
          aria-label="Suporte WhatsApp da Barbearia"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="w-6 h-6"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      )}

      {/* Dynamic Simulated Home Indicator */}
      {!isStandalone && (
        <div className="h-6 pb-2 flex justify-center shrink-0 bg-[#111113] select-none">
          <div className="w-28 h-1 bg-white/10 rounded-full" />
        </div>
      )}
    </div>
  );

  if (isStandalone) {
    return (
      <div className="min-h-[100dvh] w-full bg-[#0E0E10] flex justify-center selection:bg-amber-500 selection:text-black">
        {pwaContent}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex items-center justify-center p-4 lg:p-8 font-sans selection:bg-amber-500 selection:text-black overflow-y-auto lg:overflow-hidden relative">
      {/* Background radial effects */}
      <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      {/* Outer Flex Container for 2-Panel Presentation */}
      <div className="w-full max-w-6xl bg-[#0A0A0B] text-[#EDEDED] font-sans flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 relative z-10 p-4 lg:p-12 rounded-[32px] border border-white/5 shadow-2xl overflow-hidden min-h-[85vh] lg:h-[780px]">
        {/* Left Side: Brand & Value Prop (visible on large screens) */}
        <div className="hidden lg:flex lg:w-1/2 h-full p-6 flex-col justify-between border-r border-white/5 text-left shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-12">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
                <Scissors className="w-5 h-5 text-black" />
              </div>
              <span className="text-2xl font-bold tracking-tighter uppercase italic text-white">
                Barbers<span className="text-amber-500 font-bold">Flow</span>
              </span>
            </div>

            <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] mb-6 tracking-tight text-white">
              A experiência{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 font-extrabold">
                Premium
              </span>{" "}
              de gestão para sua barbearia.
            </h1>

            <p className="text-base text-neutral-400 mb-8 max-w-sm font-light leading-relaxed">
              Otimize sua agenda, encante seus clientes e escale seu faturamento
              com o SaaS mais moderno do mercado brasileiro.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold border border-amber-500/20">
                  ✓
                </div>
                <span className="text-sm text-neutral-300 font-light">
                  Agendamento PWA ultra-veloz
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold border border-amber-500/20">
                  ✓
                </div>
                <span className="text-sm text-neutral-300 font-light">
                  Dashboard analítico completo
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold border border-amber-500/20">
                  ✓
                </div>
                <span className="text-sm text-neutral-300 font-light">
                  Gestão de estoque e financeiro
                </span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <img
                  className="w-8 h-8 rounded-full border-2 border-[#0A0A0B] bg-neutral-700 object-cover"
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"
                />
                <img
                  className="w-8 h-8 rounded-full border-2 border-[#0A0A0B] bg-neutral-600 object-cover"
                  src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop"
                />
                <img
                  className="w-8 h-8 rounded-full border-2 border-[#0A0A0B] bg-neutral-500 object-cover"
                  src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop"
                />
              </div>
              <span className="text-xs text-neutral-400 font-semibold tracking-wider uppercase">
                +500 barbearias cadastradas
              </span>
            </div>
          </div>
        </div>
        {/* Right Side: PWA Mobile Preview Simulator */}
        <div className="w-full lg:w-1/2 flex items-center justify-center relative py-6 lg:py-0">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(245,158,11,0.03),transparent_70%)] pointer-events-none" />

          {pwaContent}
        </div>{" "}
        {/* Close Right Side div */}
      </div>{" "}
      {/* Close Outer Flex Container */}
    </div>
  );
}
