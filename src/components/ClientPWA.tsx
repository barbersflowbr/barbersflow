/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
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
  X
} from 'lucide-react';
import { initialAvailableHours } from '../data';
import { Barber, Service, Appointment } from '../types';
import { Barbearia, addBooking, getUnavailableSlots } from '../lib/db';

interface ClientPWAProps {
  onNavigate: (view: 'landing' | 'admin' | 'pwa') => void;
  activeBarbearia: Barbearia | null;
  onSetActiveBarbearia: (barbearia: Barbearia | null) => void;
}

export default function ClientPWA({ onNavigate, activeBarbearia, onSetActiveBarbearia }: ClientPWAProps) {
  // Stepper Steps: 1 - Service, 2 - Barber, 3 - Date & Time, 4 - Confirm, 5 - Success
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-26'); // YYYY-MM-DD
  const [selectedTime, setSelectedTime] = useState<string | null>(null);

  // Client inputs
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');

  // API checking and booking states
  const [isCheckingSlots, setIsCheckingSlots] = useState(false);
  const [unavailableSlots, setUnavailableSlots] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedBooking, setConfirmedBooking] = useState<Appointment | null>(null);

  // PWA simulated install banner
  const [pwaInstalled, setPwaInstalled] = useState(false);
  const [showPwaBanner, setShowPwaBanner] = useState(true);

  // Category filter for step 1
  const [activeCategory, setActiveCategory] = useState<'Todos' | 'Cabelo' | 'Barba' | 'Combo' | 'Tratamento'>('Todos');

  // Real-time sub for barbearia data
  useEffect(() => {
    if (!activeBarbearia) return;

    const unsubscribe = import('../lib/db').then(m => 
      m.subscribeBarbearia(activeBarbearia.id, (updated) => {
        onSetActiveBarbearia(updated);
      })
    );

    return () => {
      unsubscribe.then(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [activeBarbearia?.id]);

  // Days list for the Date Picker
  const dateOptions = [
    { dayName: 'Sex', dayNum: '26', fullDate: '2026-06-26' },
    { dayName: 'Sáb', dayNum: '27', fullDate: '2026-06-27' },
    { dayName: 'Dom', dayNum: '28', fullDate: '2026-06-28' },
    { dayName: 'Seg', dayNum: '29', fullDate: '2026-06-29' },
    { dayName: 'Ter', dayNum: '30', fullDate: '2026-06-30' },
    { dayName: 'Qua', dayNum: '01', fullDate: '2026-07-01' },
    { dayName: 'Qui', dayNum: '02', fullDate: '2026-07-02' }
  ];

  // Dynamic references based on loaded barbearia
  const barbers = activeBarbearia?.barbers || [];
  const services = activeBarbearia?.services || [];

  // Call API to check slots availability for the selected barber and date
  const checkSlotsAvailability = async () => {
    if (!selectedBarber || !activeBarbearia) return;
    setIsCheckingSlots(true);
    
    try {
      const unavailable = await getUnavailableSlots(
        activeBarbearia.id,
        selectedBarber.id,
        selectedDate
      );
      setUnavailableSlots(unavailable);
    } catch (err) {
      console.error('Error fetching availability:', err);
    } finally {
      setIsCheckingSlots(false);
    }
  };

  // Re-run slot checker when barber or date changes
  useEffect(() => {
    if (step === 3 && selectedBarber) {
      checkSlotsAvailability();
      setSelectedTime(null); // Reset selected time on change
    }
  }, [selectedBarber, selectedDate, step]);

  // Handle final booking submission
  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBarber || !selectedService || !selectedTime || !activeBarbearia) return;

    setIsSubmitting(true);
    setBookingError(null);

    const payload = {
      barberId: selectedBarber.id,
      serviceId: selectedService.id,
      clientName,
      clientEmail: clientEmail || `${clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      clientPhone: clientPhone || '(11) 99999-9999',
      date: selectedDate,
      time: selectedTime,
      status: 'Ocupado' as const
    };

    try {
      const b = await addBooking(activeBarbearia.id, payload);
      setConfirmedBooking(b);
      setStep(5); // Go to success screen
    } catch (err: any) {
      console.error(err);
      setBookingError(err.message || 'Este horário acabou de ser preenchido por outro cliente. Por favor, retorne e selecione outro horário.');
      setStep(3); // Kick back to select time step
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFlow = () => {
    setSelectedService(null);
    setSelectedBarber(null);
    setSelectedTime(null);
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setStep(1);
    setBookingError(null);
  };

  const filteredServices = activeCategory === 'Todos' 
    ? services 
    : services.filter(s => s.category === activeCategory);

  if (!activeBarbearia) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-md bg-[#0E0E10] p-8 rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
          <h2 className="text-xl font-bold text-white tracking-tight">Nenhuma Barbearia Ativa</h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            Para realizar um agendamento, você deve acessar o link exclusivo da sua barbearia ou estar logado no painel administrativo.
          </p>
          <button 
            onClick={() => onNavigate('admin')}
            className="w-full py-3.5 bg-amber-500 text-black rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-amber-400 transition-all active:scale-[0.98] cursor-pointer"
          >
            Ir para Login Administrativo
          </button>
        </div>
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
              <span className="text-2xl font-bold tracking-tighter uppercase italic text-white">Barbers<span className="text-amber-500 font-bold">Flow</span></span>
            </div>
            
            <h1 className="text-4xl lg:text-5xl font-extrabold leading-[1.1] mb-6 tracking-tight text-white">
              A experiência <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500 font-extrabold">Premium</span> de gestão para sua barbearia.
            </h1>
            
            <p className="text-base text-neutral-400 mb-8 max-w-sm font-light leading-relaxed">
              Otimize sua agenda, encante seus clientes e escale seu faturamento com o SaaS mais moderno do mercado brasileiro.
            </p>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold border border-amber-500/20">✓</div>
                <span className="text-sm text-neutral-300 font-light">Agendamento PWA ultra-veloz</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold border border-amber-500/20">✓</div>
                <span className="text-sm text-neutral-300 font-light">Dashboard analítico completo</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500 text-xs font-bold border border-amber-500/20">✓</div>
                <span className="text-sm text-neutral-300 font-light">Gestão de estoque e financeiro</span>
              </div>
            </div>
          </div>

          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="flex -space-x-3">
                <img className="w-8 h-8 rounded-full border-2 border-[#0A0A0B] bg-neutral-700 object-cover" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" />
                <img className="w-8 h-8 rounded-full border-2 border-[#0A0A0B] bg-neutral-600 object-cover" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" />
                <img className="w-8 h-8 rounded-full border-2 border-[#0A0A0B] bg-neutral-500 object-cover" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" />
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
          
          {/* Mobile Frame Container */}
          <div className="relative w-full max-w-[340px] h-[670px] bg-[#111113] rounded-[48px] border-[8px] border-[#1F1F23] shadow-2xl overflow-hidden flex flex-col shrink-0">
        
        {/* iPhone Speaker Notch */}
        <div className="hidden md:flex absolute top-0 left-1/2 -translate-x-1/2 w-40 h-7 bg-gray-800 rounded-b-3xl z-40 items-center justify-center">
          <div className="w-16 h-1 bg-black rounded-full mb-1.5" />
          <div className="w-2 h-2 bg-gray-950 rounded-full ml-3 mb-1.5" />
        </div>

        {/* Dynamic Simulated Status Bar */}
        <div className="h-10 pt-4 px-6 flex items-center justify-between text-[11px] font-mono text-gray-400 shrink-0 select-none bg-[#0E0E10] z-30">
          <span>09:41</span>
          <div className="flex items-center gap-2">
            <span className="text-[9px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 rounded uppercase font-bold tracking-wide">PWA App</span>
            <div className="w-5 h-3 bg-gray-800 rounded-sm relative p-0.5">
              <div className="w-full h-full bg-gray-400 rounded-xs" />
            </div>
          </div>
        </div>

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
                <h4 className="text-[11px] font-bold text-white leading-tight">Instalar BarbersFlow</h4>
                <p className="text-[9px] text-gray-500 leading-none mt-0.5">Agende offline da sua tela de início</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setPwaInstalled(true)}
                className="px-2.5 py-1 bg-amber-500 text-black text-[10px] font-bold rounded-lg hover:bg-amber-400 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <Download className="w-3 h-3" />
                Instalar
              </button>
              <button onClick={() => setShowPwaBanner(false)} className="text-gray-500 hover:text-white p-1">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        )}

        {/* PWA App Navigation Header */}
        <header className="px-5 py-4 flex items-center justify-between border-b border-white/5 bg-[#121215]/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Scissors className="w-4.5 h-4.5" />
            </div>
            <div className="text-left">
              <span className="block text-[8px] font-mono text-amber-500 tracking-wider uppercase font-bold">Barbearia Becker</span>
              <h1 className="text-xs font-bold text-white leading-none mt-0.5">Membro VIP</h1>
            </div>
          </div>
          {step > 1 && step < 5 && (
            <button 
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-gray-300 text-[10px] font-semibold flex items-center gap-1 transition-all cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              Voltar
            </button>
          )}
        </header>

        {/* STEPPER PROGRESS BAR */}
        {step < 5 && (
          <div className="px-5 py-2 bg-[#121215]/40 flex items-center justify-between text-[10px] font-mono border-b border-white/5 shrink-0 select-none">
            <span className="text-gray-500 uppercase tracking-widest font-bold">Progresso</span>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div 
                  key={s} 
                  className={`w-4.5 h-1 rounded-full transition-all duration-300 ${
                    step >= s ? 'bg-amber-500' : 'bg-gray-800'
                  }`} 
                />
              ))}
              <span className="text-amber-500 font-bold ml-1.5">P{step}</span>
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
                  <h3 className="text-sm font-bold text-white tracking-wide">Selecione o Atendimento</h3>
                  <p className="text-[10px] text-gray-400 font-light mt-0.5">Estética capilar, barba e combos exclusivos de alto padrão.</p>
                </div>

                {/* Categories Tabs */}
                <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar shrink-0">
                  {(['Todos', 'Cabelo', 'Barba', 'Combo', 'Tratamento'] as const).map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setActiveCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-wider uppercase font-mono whitespace-nowrap transition-all cursor-pointer ${
                        activeCategory === cat
                          ? 'bg-amber-500 text-black font-extrabold shadow-sm'
                          : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Services Cards List */}
                <div className="flex flex-col gap-2.5">
                  {filteredServices.map((service) => {
                    const isSelected = selectedService?.id === service.id;
                    return (
                      <div
                        key={service.id}
                        onClick={() => setSelectedService(service)}
                        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.05)]' 
                            : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <span className="text-[8px] font-mono font-bold text-amber-500 uppercase tracking-widest bg-amber-500/5 px-1.5 py-0.5 rounded">
                              {service.category}
                            </span>
                            <h4 className="text-xs font-bold text-white mt-1.5 leading-tight">{service.name}</h4>
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
                            <Clock className="w-3.5 h-3.5 text-amber-500/60" /> {service.duration} minutos
                          </span>
                          <span className={`text-xs font-extrabold ${isSelected ? 'text-amber-400' : 'text-white'}`}>
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
                  <h3 className="text-sm font-bold text-white tracking-wide">Selecione o Profissional</h3>
                  <p className="text-[10px] text-gray-400 font-light mt-0.5">Nossos mestres visagistas prontos para te atender.</p>
                </div>

                <div className="flex flex-col gap-3">
                  {barbers.filter(b => b.assignedServices.includes(selectedService?.id || '')).map((barber) => {
                    const isSelected = selectedBarber?.id === barber.id;
                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-4 rounded-2xl border transition-all duration-300 cursor-pointer relative overflow-hidden flex items-center gap-4 ${
                          isSelected 
                            ? 'bg-amber-500/10 border-amber-500 shadow-[0_4px_15px_rgba(245,158,11,0.05)]' 
                            : 'bg-white/[0.03] border-white/5 hover:border-white/10'
                        }`}
                      >
                        <img 
                          className="w-14 h-14 rounded-full object-cover border border-white/10 shrink-0" 
                          src={barber.avatar} 
                          alt={barber.name} 
                        />
                        
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white leading-tight truncate">{barber.name}</h4>
                          <span className="text-[9px] text-amber-500/80 font-mono block leading-none mt-1">{barber.role}</span>
                          
                          <div className="flex items-center text-[10px] text-amber-500 mt-1.5">
                            <Star className="w-3.5 h-3.5 fill-amber-500" />
                            <span className="ml-1 font-bold text-white font-mono">{barber.rating.toFixed(1)}</span>
                            <span className="text-gray-500 ml-1 font-light font-mono">({barber.reviews} reviews)</span>
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
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 text-left"
              >
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Data e Horário</h3>
                  <p className="text-[10px] text-gray-400 font-light mt-0.5">Os horários são atualizados e validados pela API em tempo real.</p>
                </div>

                {/* Weekday Slide Selector */}
                <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar shrink-0">
                  {dateOptions.map((opt) => {
                    const isSelectedDate = selectedDate === opt.fullDate;
                    return (
                      <button
                        key={opt.fullDate}
                        onClick={() => setSelectedDate(opt.fullDate)}
                        className={`p-3 rounded-xl min-w-[55px] text-center flex flex-col items-center justify-center border transition-all cursor-pointer ${
                          isSelectedDate
                            ? 'bg-amber-500 border-amber-500 text-black font-bold shadow-[0_3px_12px_rgba(245,158,11,0.25)]'
                            : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                        }`}
                      >
                        <span className={`text-[9px] uppercase font-mono tracking-wider ${isSelectedDate ? 'text-black' : 'text-gray-500'}`}>
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
                  <span className="uppercase tracking-widest font-bold">Grade de Horários</span>
                  <span className="text-amber-500/80 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    Fuso: Horário de Brasília
                  </span>
                </div>

                {isCheckingSlots ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center text-xs text-gray-500 gap-3">
                    <RefreshCw className="w-6 h-6 text-amber-500 animate-spin" />
                    <span>Validando disponibilidade via API...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2.5">
                    {initialAvailableHours.filter(time => {
                      if (!selectedBarber) return true;
                      const [hour] = time.split(':').map(Number);
                      const [startH] = selectedBarber.workingHours.start.split(':').map(Number);
                      const [endH] = selectedBarber.workingHours.end.split(':').map(Number);
                      return hour >= startH && hour < endH;
                    }).map((time) => {
                      const isUnavailable = unavailableSlots.includes(time);
                      const isSelectedTime = selectedTime === time;

                      return (
                        <button
                          key={time}
                          disabled={isUnavailable}
                          onClick={() => setSelectedTime(time)}
                          className={`p-3 rounded-xl font-mono text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer ${
                            isUnavailable
                              ? 'bg-neutral-900/40 border border-neutral-900 text-gray-700 cursor-not-allowed opacity-50'
                              : isSelectedTime
                                ? 'bg-amber-500 border-amber-500 text-black font-extrabold shadow-[0_0_15px_rgba(245,158,11,0.3)]'
                                : 'bg-white/5 border-white/5 text-gray-200 hover:border-amber-500/30'
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
                    })}
                  </div>
                )}

                <div className="mt-4 pt-4 bg-gradient-to-t from-[#0E0E10] sticky bottom-0">
                  <button
                    disabled={!selectedTime || isCheckingSlots}
                    onClick={() => setStep(4)}
                    className="w-full py-4 rounded-xl bg-amber-500 text-black text-xs font-bold tracking-wider flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_20px_rgba(245,158,11,0.2)]"
                  >
                    Próximo: Dados & Confirmar
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}

            {/* PASSO 4: CONFIRMAÇÃO DO CLIENTE */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col gap-4 text-left"
              >
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wide">Dados de Confirmação</h3>
                  <p className="text-[10px] text-gray-400 font-light mt-0.5">Preencha seus dados para receber o lembrete de confirmação via WhatsApp.</p>
                </div>

                {/* Review selection details card */}
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-3 text-xs font-light">
                  <div className="flex items-center gap-2.5">
                    <Scissors className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono block">SERVIÇO</span>
                      <span className="font-bold text-white">{selectedService?.name} (R$ {selectedService?.price})</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-white/5 pt-2.5">
                    <User className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono block">BARBEIRO</span>
                      <span className="font-bold text-white">{selectedBarber?.name}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 border-t border-white/5 pt-2.5">
                    <Calendar className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-[10px] text-gray-500 font-mono block">HORÁRIO DE AGENDA</span>
                      <span className="font-bold text-white font-mono">
                        {selectedDate.split('-').reverse().join('/')} às <span className="text-amber-400 font-bold">{selectedTime}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <form onSubmit={handleConfirmBooking} className="space-y-3.5">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 mb-1">NOME COMPLETO</label>
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
                    <label className="block text-[10px] font-mono text-gray-500 mb-1">E-MAIL (OPCIONAL)</label>
                    <input
                      type="email"
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      placeholder="Ex: seuemail@gmail.com"
                      className="w-full p-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-500 mb-1">WHATSAPP / CELULAR</label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      placeholder="Ex: (11) 98888-7777"
                      className="w-full p-3.5 bg-white/[0.03] border border-white/5 rounded-xl text-xs text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 transition-all font-medium"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 rounded-xl bg-amber-500 text-black text-xs font-extrabold tracking-wider flex items-center justify-center gap-2 shadow-[0_4px_25px_rgba(245,158,11,0.25)] hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
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
              </motion.div>
            )}

            {/* PASSO 5: SUCESSO - PWA CONFIRMED APPOINTMENT */}
            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col gap-5 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
                  <Check className="w-8 h-8 font-extrabold" />
                </div>

                <div>
                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/5 px-2 py-1 rounded-full border border-emerald-500/10 inline-block">
                    Agendamento Confirmado
                  </span>
                  <h3 className="text-base font-extrabold text-white mt-3 tracking-wide">Tudo pronto para seu corte!</h3>
                  <p className="text-[10px] text-gray-400 font-light max-w-[280px] mx-auto mt-1 leading-relaxed">
                    Você receberá um lembrete no WhatsApp 2 horas antes de seu horário agendado.
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
                      <span className="font-bold text-white text-[10px] uppercase font-mono tracking-wider">BarbersFlow Pass</span>
                    </div>
                    <span className="text-[10px] font-mono text-amber-500/80 font-bold">VIP COORD</span>
                  </div>

                  {/* Pass Body */}
                  <div className="p-5 space-y-4 font-light text-[11px] text-gray-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-gray-500 font-mono block uppercase">CLIENTE</span>
                        <span className="font-bold text-white truncate block">{confirmedBooking?.clientName}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-mono block uppercase">PROFISSIONAL</span>
                        <span className="font-bold text-white block">{selectedBarber?.name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-[9px] text-gray-500 font-mono block uppercase">SERVIÇO</span>
                        <span className="font-bold text-white block">{selectedService?.name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-gray-500 font-mono block uppercase">PREÇO</span>
                        <span className="font-bold text-amber-400 block font-mono">R$ {selectedService?.price}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 border-t border-white/5 pt-3">
                      <div>
                        <span className="text-[9px] text-gray-500 font-mono block uppercase">DATA E HORÁRIO</span>
                        <span className="text-xs font-mono font-extrabold text-white">
                          {selectedDate.split('-').reverse().join('/')} às <span className="text-amber-400">{selectedTime}</span>
                        </span>
                      </div>
                    </div>

                    {/* Barcode representation */}
                    <div className="pt-4 flex flex-col items-center justify-center gap-2">
                      <div className="bg-white p-3 rounded-xl border border-white/10 flex items-center justify-center">
                        <QrCode className="w-16 h-16 text-black" />
                      </div>
                      <span className="text-[8px] font-mono text-gray-500 tracking-widest">{confirmedBooking?.id}</span>
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
                      onClick={() => alert('Link de agendamento compartilhado com sucesso!')}
                      className="flex-1 py-3.5 rounded-xl bg-black/40 border border-white/5 hover:bg-black text-[11px] text-gray-400 hover:text-white transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Compartilhar
                    </button>
                    <button
                      onClick={() => onNavigate('admin')}
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

        {/* Dynamic Simulated Home Indicator */}
        <div className="h-6 pb-2 flex justify-center shrink-0 bg-[#111113] select-none">
          <div className="w-28 h-1 bg-white/10 rounded-full" />
        </div>
      </div> {/* Close Mobile Frame Container */}
    </div> {/* Close Right Side div */}
  </div> {/* Close Outer Flex Container */}
</div>
  );
}
