/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Scissors, 
  Calendar, 
  TrendingUp, 
  Smartphone, 
  MessageSquare, 
  Users, 
  Sparkles, 
  Check, 
  ArrowRight, 
  Star, 
  Clock, 
  ShieldCheck, 
  Menu, 
  X,
  LayoutDashboard,
  HelpCircle
} from 'lucide-react';
import { Tooltip } from './Tooltip';
import { pricingPlans } from '../data';

interface LandingPageProps {
  onNavigate: (view: 'landing' | 'admin' | 'pwa' | 'superadmin') => void;
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<'policies' | 'terms' | null>(null);
  const [isWhatsAppGray, setIsWhatsAppGray] = useState(false);

  const handleSectionClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string, targetId: string) => {
    e.preventDefault();
    window.history.pushState({}, '', path);
    const element = document.getElementById(targetId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsWhatsAppGray(true);
    }, 5000); // 5 segundos

    return () => clearTimeout(timer);
  }, []);

  // Smooth scroll to section if URL has path on mount or back/forward navigation
  useEffect(() => {
    const handleUrlScroll = () => {
      const pathname = window.location.pathname;
      const targetId = pathname === '/features' ? 'features' : pathname === '/bento' ? 'bento' : pathname === '/pricing' ? 'pricing' : null;
      if (targetId) {
        // Delay slightly to allow the DOM to fully render/transition
        setTimeout(() => {
          document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth' });
        }, 150);
      }
    };

    handleUrlScroll();

    window.addEventListener('popstate', handleUrlScroll);
    return () => window.removeEventListener('popstate', handleUrlScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 font-sans selection:bg-amber-500 selection:text-black overflow-x-hidden">
      {/* Background radial effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-[#0A0A0B]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 hover:scale-105 transition-transform duration-300">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center animate-float-pulse">
              <Scissors className="w-5 h-5 text-black" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-gray-200 to-amber-400 bg-clip-text text-transparent flex items-center gap-1 animate-text-gradient">
                Barbers<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 animate-text-gradient">Flow</span>
              </span>
              <span className="block text-[9px] text-amber-500/80 tracking-widest uppercase font-mono">Premium SaaS</span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a 
              href="/features" 
              onClick={(e) => handleSectionClick(e, '/features', 'features')}
              className="hover:text-amber-500 transition-colors"
            >
              Funcionalidades
            </a>
            <a 
              href="/bento" 
              onClick={(e) => handleSectionClick(e, '/bento', 'bento')}
              className="hover:text-amber-500 transition-colors"
            >
              Diferenciais
            </a>
            <a 
              href="/pricing" 
              onClick={(e) => handleSectionClick(e, '/pricing', 'pricing')}
              className="hover:text-amber-500 transition-colors"
            >
              Preços
            </a>
            <button 
              onClick={() => onNavigate('pwa')} 
              className="hover:text-amber-500 transition-colors text-amber-500/90 font-semibold"
            >
              Demo App Cliente
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => onNavigate('admin')}
              className="px-4.5 py-2.5 text-sm font-bold text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/30 hover:border-amber-500/60 rounded-xl transition-all duration-300 flex items-center gap-2 active:scale-95 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.1)] hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]"
            >
              <LayoutDashboard className="w-4 h-4" />
              Entrar no Painel
            </button>
            <button 
              onClick={() => onNavigate('admin')}
              className="relative group overflow-hidden px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black text-sm font-extrabold tracking-wide shadow-[0_0_25px_rgba(245,158,11,0.25)] hover:shadow-[0_0_35px_rgba(245,158,11,0.5)] hover:scale-[1.03] transition-all duration-300 active:scale-[0.97]"
            >
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none" />
              <span className="relative z-10 flex items-center gap-2">
                Começar Teste Grátis
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          </div>

          {/* Mobile menu toggle */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu & Backdrop Overlay with Blur */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <>
              {/* Blur Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileMenuOpen(false)}
                className="fixed inset-0 top-20 bg-black/60 backdrop-blur-md z-40 md:hidden"
              />

              {/* Mobile Menu Dropdown */}
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="md:hidden absolute top-20 left-0 w-full bg-[#0E0E10]/95 backdrop-blur-md border-b border-white/5 px-6 py-8 flex flex-col gap-6 z-50"
              >
                <a 
                  href="/features" 
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleSectionClick(e, '/features', 'features');
                  }}
                  className="text-lg text-gray-300 hover:text-amber-500 transition-colors"
                >
                  Funcionalidades
                </a>
                <a 
                  href="/bento" 
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleSectionClick(e, '/bento', 'bento');
                  }}
                  className="text-lg text-gray-300 hover:text-amber-500 transition-colors"
                >
                  Diferenciais
                </a>
                <a 
                  href="/pricing" 
                  onClick={(e) => {
                    setMobileMenuOpen(false);
                    handleSectionClick(e, '/pricing', 'pricing');
                  }}
                  className="text-lg text-gray-300 hover:text-amber-500 transition-colors"
                >
                  Preços
                </a>
                <button 
                  onClick={() => { onNavigate('pwa'); setMobileMenuOpen(false); }}
                  className="text-left text-lg text-amber-500 font-semibold"
                >
                  Demo App Cliente (PWA)
                </button>
                <div className="h-px bg-white/5 my-2" />
                <button 
                  onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                  className="text-left text-lg text-gray-300 hover:text-white"
                >
                  Acessar Painel Admin
                </button>
                <button 
                  onClick={() => { onNavigate('admin'); setMobileMenuOpen(false); }}
                  className="w-full text-center py-3.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-black font-extrabold tracking-wide hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg shadow-amber-500/20"
                >
                  Começar Teste Grátis
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className={`transition-all duration-300 ${mobileMenuOpen ? 'blur-sm' : ''}`}
      >
      {/* Hero Section */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Text Content */}
          <div className="lg:col-span-7 flex flex-col gap-6 text-center lg:text-left">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
              Eleve o padrão da sua barbearia com o <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-amber-600 bg-clip-text text-transparent animate-text-gradient">BarbersFlow</span>
            </h1>
            <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto lg:mx-0 font-light leading-relaxed">
              O ecossistema completo para gestão de agendas, controle financeiro privado e um aplicativo de agendamento mobile-first impecável que fideliza seus clientes.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start mt-2">
              <button 
                onClick={() => onNavigate('admin')}
                className="w-full sm:w-auto relative group overflow-hidden px-8 py-4 rounded-xl bg-amber-500 text-black font-bold tracking-wide shadow-[0_4px_30px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_40px_rgba(245,158,11,0.5)] transition-all duration-300"
              >
                Começar Teste Grátis
              </button>
              <button 
                onClick={() => onNavigate('pwa')}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 text-white font-semibold hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                <Smartphone className="w-4 h-4 text-amber-500" />
                Experimentar App Cliente
              </button>
            </div>
            
            {/* Social Proof */}
            <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 mt-6 pt-6 border-t border-white/5">
              <div className="flex -space-x-3">
                <img className="w-10 h-10 rounded-full border-2 border-[#0A0A0B]" src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop" alt="User 1" />
                <img className="w-10 h-10 rounded-full border-2 border-[#0A0A0B]" src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop" alt="User 2" />
                <img className="w-10 h-10 rounded-full border-2 border-[#0A0A0B]" src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop" alt="User 3" />
              </div>
              <div className="text-left text-sm text-gray-400">
                <div className="flex items-center text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-500" />
                  ))}
                  <span className="ml-2 font-bold text-white">4.9/5</span>
                </div>
                <p className="text-xs">Mais de 1.400 barbearias no Brasil utilizam o BarbersFlow</p>
              </div>
            </div>
          </div>

          {/* Interactive Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="absolute inset-0 bg-amber-500/10 rounded-3xl blur-[80px] pointer-events-none" />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="relative max-w-[310px] w-full aspect-[9/18.5] rounded-[40px] border-8 border-gray-800 bg-[#0A0A0B] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden group cursor-pointer"
              onClick={() => onNavigate('pwa')}
            >
              {/* Speaker & camera slot */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-2xl z-30 flex items-center justify-center">
                <div className="w-12 h-1 bg-black rounded-full mb-1" />
              </div>

              {/* Screen Content Showcase */}
              <div className="absolute inset-0 z-10 flex flex-col pt-8 bg-[#0E0E10] text-gray-200">
                <div className="px-5 pt-3 pb-2 flex items-center justify-between border-b border-white/5 bg-[#121215]">
                  <div>
                    <span className="text-[10px] uppercase font-mono tracking-wider text-amber-500/90 font-bold">Barbearia Becker</span>
                    <h4 className="text-xs font-bold text-white leading-none mt-0.5">Agendamento Online</h4>
                  </div>
                  <div className="w-6 h-6 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <Scissors className="w-3.5 h-3.5 text-amber-500" />
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col gap-3 overflow-y-auto no-scrollbar text-left">
                  {/* Step visual indicator */}
                  <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl border border-white/5">
                    <span className="text-[10px] font-mono text-gray-400">Passo 1 de 4</span>
                    <span className="text-[10px] font-bold text-amber-400 font-mono">Escolha o Serviço</span>
                  </div>

                  {/* Mock services list */}
                  <div className="flex flex-col gap-2">
                    <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-between">
                      <div>
                        <h5 className="text-[11px] font-bold text-white">Corte Premium (Fade)</h5>
                        <p className="text-[9px] text-gray-400">45 minutos • Lavagem Premium</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-400">R$ 70</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between opacity-80">
                      <div>
                        <h5 className="text-[11px] font-bold text-gray-300">Terapia de Barba</h5>
                        <p className="text-[9px] text-gray-400">35 minutos • Toalha Quente</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-gray-300">R$ 55</span>
                    </div>

                    <div className="p-3 rounded-xl bg-white/5 border border-white/5 flex items-center justify-between opacity-80">
                      <div>
                        <h5 className="text-[11px] font-bold text-gray-300">Assinatura Flow (Combo)</h5>
                        <p className="text-[9px] text-gray-400">80 minutos • Corte + Barba + Dose</p>
                      </div>
                      <span className="text-[11px] font-mono font-bold text-amber-400">R$ 115</span>
                    </div>
                  </div>

                  <div className="mt-auto bg-gradient-to-t from-[#0E0E10] pt-6 pb-2">
                    <div className="w-full py-2.5 rounded-xl bg-amber-500 text-black text-[11px] font-bold tracking-wider text-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                      Avançar para Profissionais
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Hover Overlay */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex flex-col items-center justify-center p-6 text-center">
                <Smartphone className="w-10 h-10 text-amber-500 mb-2 animate-bounce" />
                <span className="text-white font-bold text-sm">Ver App do Cliente</span>
                <span className="text-gray-400 text-xs mt-1">Clique para abrir o simulador PWA mobile-first</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Bento Grid - Features Section */}
      <section id="features" className="py-24 bg-[#0D0D0F] border-y border-white/5 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono text-amber-500 uppercase tracking-widest font-semibold mb-3">Diferenciais do Sistema</h2>
            <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Tudo o que sua barbearia precisa para reinar no mercado
            </h3>
            <p className="text-gray-400 mt-4 font-light">
              Uma infraestrutura de software de alta performance, projetada para a experiência perfeita do dono de barbearia ao cliente final.
            </p>
          </div>

          {/* Bento Grid Layout */}
          <div id="bento" className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Box 1: Agenda Fluid Calendar (large) */}
            <div className="md:col-span-8 p-8 rounded-3xl bg-[#121215] border border-white/5 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
              <div className="flex flex-col gap-4 h-full justify-between">
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Agenda Interativa com Validação em Tempo Real</h4>
                  <p className="text-gray-400 mt-2 text-sm font-light leading-relaxed max-w-xl">
                    Gerencie os horários de todos os barbeiros em uma única tela. O sistema impede que clientes façam agendamentos duplicados na mesma fração de segundo graças ao mecanismo de validação de ocupação na API.
                  </p>
                </div>
                <div className="mt-8 p-4 rounded-2xl bg-black/40 border border-white/5 flex gap-3 overflow-x-auto">
                  <span className="px-3 py-1.5 rounded-lg bg-[#112415] border border-[#1b4324] text-emerald-400 text-xs font-mono">09:00 - Livre</span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#2d1112] border border-[#4d191c] text-rose-400 text-xs font-mono">10:00 - Ocupado</span>
                  <span className="px-3 py-1.5 rounded-lg bg-[#1f1a10] border border-[#433015] text-amber-400 text-xs font-mono">11:00 - Concluído</span>
                </div>
              </div>
            </div>

            {/* Box 2: PWA Mobile-first (tall/small) */}
            <div onClick={() => onNavigate('pwa')} className="md:col-span-4 p-8 rounded-3xl bg-[#121215] border border-white/5 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300 flex flex-col justify-between cursor-pointer">
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-[40px] pointer-events-none" />
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6">
                <Smartphone className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">App de Agendamento PWA</h4>
                <p className="text-gray-400 mt-2 text-sm font-light leading-relaxed">
                  Sem necessidade de baixar nada nas lojas da Apple ou Google. O cliente acessa seu link exclusivo, instala instantaneamente na tela inicial do celular e agenda em menos de 1 minuto.
                </p>
              </div>
              <div className="mt-6 flex items-center gap-2 text-amber-500 text-sm font-bold">
                Acessar PWA de testes <ArrowRight className="w-4 h-4" />
              </div>
            </div>

            {/* Box 3: WhatsApp Automation */}
            <div className="md:col-span-4 p-8 rounded-3xl bg-[#121215] border border-white/5 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300 flex flex-col justify-between">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-white">Lembretes WhatsApp</h4>
                <p className="text-gray-400 mt-2 text-sm font-light leading-relaxed">
                  Reduza as faltas (no-shows) em até 85%. O BarbersFlow envia mensagens de lembrete automáticas e personalizadas para o WhatsApp do cliente contendo o link de confirmação rápida.
                </p>
              </div>
            </div>

            {/* Box 4: Financial Analytics (large/wide) */}
            <div onClick={() => onNavigate('pwa')} className="md:col-span-8 p-8 rounded-3xl bg-[#121215] border border-white/5 relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300 cursor-pointer">
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-[60px] pointer-events-none" />
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 h-full items-center">
                <div className="sm:col-span-7 flex flex-col gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <h4 className="text-2xl font-bold text-white">Analytics Privado Avançado</h4>
                  <p className="text-gray-400 text-sm font-light leading-relaxed">
                    Acompanhe em tempo real o faturamento diário, mensal, o tíquete médio, taxa de ocupação dos barbeiros e a recorrência média dos clientes. Painel de administração focado em decisões rápidas.
                  </p>
                </div>
                <div className="sm:col-span-5 bg-black/40 p-5 rounded-2xl border border-white/5 flex flex-col gap-3 font-mono">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">FATURAMENTO</span>
                    <span className="text-emerald-400 font-bold">+24%</span>
                  </div>
                  <div className="text-xl font-bold text-white">R$ 18.420,00</div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: '74%' }} />
                  </div>
                  <div className="text-[10px] text-gray-500 flex justify-between">
                    <span>Meta: R$ 25k</span>
                    <span>74% alcançado</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/5 rounded-full blur-[160px] pointer-events-none" />

        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-xs font-mono text-amber-500 uppercase tracking-widest font-semibold mb-3">Tabela de Preços</h2>
          <h3 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Planos sob medida para o tamanho da sua ambição
          </h3>
          <p className="text-gray-400 mt-4 font-light">
            Teste gratuitamente qualquer plano por 7 dias. Sem taxas de setup e sem fidelidade.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {pricingPlans.map((plan, index) => (
            <div 
              key={index}
              className={`p-8 rounded-3xl bg-[#121215] border flex flex-col justify-between transition-all duration-300 relative ${
                plan.popular 
                  ? 'border-amber-500 shadow-[0_15px_40px_-10px_rgba(245,158,11,0.15)] md:-translate-y-4' 
                  : 'border-white/5 hover:border-white/10'
              }`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-4 py-1 rounded-full bg-amber-500 text-black text-[11px] font-mono font-bold uppercase tracking-wider">
                  Mais Popular
                </div>
              )}

              <div>
                <div className="flex flex-col gap-1 mb-6">
                  <h4 className="text-lg font-bold text-white">{plan.name}</h4>
                  <p className="text-xs text-gray-400 font-light leading-relaxed">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1 mb-8">
                  <span className="text-3xl sm:text-4xl font-extrabold text-white">{plan.price}</span>
                  <span className="text-sm text-gray-500 font-light">{plan.period}</span>
                </div>

                <ul className="flex flex-col gap-3.5 mb-8">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-gray-300">
                      <Check className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <span className="font-light">{feature.text}</span>
                      {feature.tooltip && <Tooltip content={feature.tooltip} />}
                    </li>
                  ))}
                </ul>
              </div>

              {plan.cta === 'Falar com Consultor' ? (
                <a 
                  href="https://wa.me/5553997126656?text=Ol%C3%A1%2C%20gostaria%20de%20falar%20com%20um%20consultor%20sobre%20o%20BarbersFlow."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-4.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer bg-white/5 text-white hover:bg-white/10 border border-white/10 text-center block"
                >
                  {plan.cta}
                </a>
              ) : (
                <button 
                  onClick={() => onNavigate('admin')}
                  className={`w-full py-4.5 rounded-xl font-bold text-sm tracking-wide transition-all duration-300 cursor-pointer ${
                    plan.popular 
                      ? 'bg-amber-500 text-black shadow-[0_4px_20px_rgba(245,158,11,0.2)] hover:bg-amber-400' 
                      : 'bg-white/5 text-white hover:bg-white/10 border border-white/10'
                  }`}
                >
                  {plan.cta}
                </button>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Magnetic CTA Section */}
      <section className="py-24 bg-[#0A0A0B] border-t border-white/5">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative overflow-hidden rounded-3xl bg-gradient-to-b from-[#121215] to-[#0A0A0B] border border-white/5 p-12 md:p-16">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="flex flex-col gap-6 items-center max-w-2xl mx-auto relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Scissors className="w-8 h-8" />
            </div>
            <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Pronto para transformar a experiência da sua barbearia?
            </h3>
            <p className="text-gray-400 font-light text-base leading-relaxed">
              Junte-se a centenas de barbearias de alto padrão e ofereça a seus clientes o agendamento fluido que eles merecem. Leva menos de 5 minutos para configurar.
            </p>
            <div className="mt-4 w-full flex flex-col sm:flex-row items-center gap-4 justify-center">
              <button 
                onClick={() => onNavigate('admin')}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-amber-500 text-black font-extrabold text-base tracking-wide shadow-[0_4px_30px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
              >
                Começar Teste Grátis
              </button>
              <button 
                onClick={() => onNavigate('pwa')}
                className="w-full sm:w-auto px-10 py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-base hover:bg-white/10 transition-all flex items-center justify-center gap-2"
              >
                Simular Agendamento Cliente
              </button>
            </div>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-4">
              <span className="flex items-center gap-1"><ShieldCheck className="w-4 h-4 text-amber-500" /> Sem cartão de crédito</span>
              <span>•</span>
              <span>7 dias grátis</span>
              <span>•</span>
              <span>Cancele quando quiser</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#080809] border-t border-white/5 py-12 text-gray-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center">
              <Scissors className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold text-sm tracking-wider uppercase font-mono bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 bg-clip-text text-transparent">BarbersFlow</span>
          </div>
          <p className="font-light">© 2026 BarbersFlow</p>
          <div className="flex items-center gap-6 font-mono">
            <button 
              onClick={(e) => { e.preventDefault(); setActiveModal('policies'); }} 
              className="hover:text-amber-500 transition-colors cursor-pointer"
            >
              Políticas de Privacidade
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); setActiveModal('terms'); }} 
              className="hover:text-amber-500 transition-colors cursor-pointer"
            >
              Termos de Uso
            </button>
          </div>
        </div>
      </footer>
      </motion.div>

      {/* Real Policies and Terms Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="w-full max-w-3xl bg-[#0E0E11] border border-white/10 rounded-3xl p-6 md:p-8 max-h-[85vh] overflow-y-auto relative shadow-2xl"
          >
            {/* Close Button */}
            <button 
              onClick={() => setActiveModal(null)}
              className="absolute top-5 right-5 p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {activeModal === 'policies' ? (
              <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Política de Privacidade Real</h2>
                    <p className="text-xs text-gray-500">Última atualização: Junho de 2026</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p>
                    O <strong>BarbersFlow</strong> ("nós", "nosso", "SaaS") é uma plataforma dedicada a otimizar a gestão de agendamentos para barbearias premium. Esta Política de Privacidade descreve de forma transparente como coletamos, usamos, armazenamos e protegemos as informações pessoais e comerciais quando você utiliza nossa plataforma.
                  </p>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">1. Coleta de Informações</h3>
                    <p>
                      Coletamos as informações necessárias para prestar nossos serviços com excelência:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
                      <li><strong>Dados da Barbearia:</strong> Nome do estabelecimento, e-mail de login do proprietário, senha criptografada (através do Supabase Auth), logotipo, localização física, serviços oferecidos, preços e nomes dos barbeiros da equipe.</li>
                      <li><strong>Dados de Agendamento dos Clientes:</strong> Nome do cliente, número de telefone para contato/notificação e detalhes do agendamento (serviço escolhido, barbeiro e horário selecionado).</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">2. Uso dos Dados</h3>
                    <p>
                      Os dados coletados são utilizados estritamente para as seguintes finalidades:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
                      <li>Viabilizar o processo de agendamento online em tempo real no aplicativo do cliente (PWA).</li>
                      <li>Permitir o gerenciamento inteligente da agenda de atendimento no Painel Administrativo do proprietário.</li>
                      <li>Enviar confirmações e avisos de agendamentos por vias internas ou integrações de comunicação.</li>
                      <li>Aprimorar a segurança e evitar fraudes no acesso às contas administrativas.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">3. Segurança e Armazenamento dos Dados</h3>
                    <p>
                      Seus dados são armazenados de forma extremamente segura através da infraestrutura de ponta do <strong>Supabase (PostgreSQL Database & Auth)</strong>. Aplicamos criptografia em trânsito e em repouso. Nós nunca vendemos, alugamos ou comercializamos dados de clientes ou estabelecimentos com terceiros.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">4. Controle do Proprietário e LGPD</h3>
                    <p>
                      Em conformidade com a Lei Geral de Proteção de Dados (LGPD), garantimos ao proprietário da barbearia o controle total sobre seus dados e os dados de seus clientes. Você pode atualizar ou excluir informações de serviços, profissionais e agendamentos a qualquer momento diretamente pelo seu painel de controle.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">5. Contato e Suporte</h3>
                    <p>
                      Caso tenha dúvidas adicionais sobre a nossa Política de Privacidade ou sobre o tratamento de seus dados, sinta-se à vontade para entrar em contato com nossa equipe pelo e-mail: <a href="mailto:barbersflowbr@gmail.com" className="text-amber-500 hover:underline">barbersflowbr@gmail.com</a>.
                    </p>
                  </section>
                </div>
              </div>
            ) : (
              <div className="space-y-6 text-sm text-gray-300 leading-relaxed">
                <div className="flex items-center gap-3 border-b border-white/5 pb-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-white">Termos de Uso Reais</h2>
                    <p className="text-xs text-gray-500">Última atualização: Junho de 2026</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <p>
                    Bem-vindo ao <strong>BarbersFlow</strong>. Ao se cadastrar ou utilizar nossa plataforma SaaS de agendamento online e painel administrativo, você concorda em cumprir e estar vinculado aos seguintes Termos de Uso. Leia-os atentamente.
                  </p>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">1. Aceitação dos Termos</h3>
                    <p>
                      O uso das ferramentas e do aplicativo cliente do BarbersFlow constitui sua aceitação plena destes termos. Se você não concordar com qualquer parte deste documento, não deverá se cadastrar ou utilizar os serviços prestados pela nossa plataforma.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">2. Cadastro e Responsabilidade da Conta</h3>
                    <p>
                      Ao criar uma conta no BarbersFlow, o proprietário do estabelecimento declara que:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
                      <li>Fornecerá informações cadastrais verídicas, exatas e atualizadas (incluindo nome, localização física, e-mail e dados de serviços).</li>
                      <li>É o único responsável por manter a confidencialidade de sua senha de acesso e pelas atividades realizadas em sua conta administrativa.</li>
                      <li>Não utilizará a plataforma para fins ilícitos, nocivos ou fraudulentos.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">3. Planos, Cobrança e Cancelamento</h3>
                    <p>
                      Oferecemos um período de teste gratuito de 7 dias para novas barbearias conhecerem todos os recursos premium do BarbersFlow:
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-gray-400">
                      <li>Após o período de teste, o acesso às funcionalidades completas dependerá da assinatura mensal ou anual de um de nossos planos oficiais (Standard, Pro Flow, Black Elite).</li>
                      <li>Os cancelamentos podem ser efetuados pelo usuário a qualquer momento diretamente na área de configurações do plano, sem multas contratuais adicionais.</li>
                    </ul>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">4. Limitação de Responsabilidade</h3>
                    <p>
                      O BarbersFlow se esforça continuamente para manter o serviço disponível e livre de erros, utilizando tecnologias seguras de nuvem. No entanto, o serviço é fornecido "como está". Não nos responsabilizamos por perdas comerciais decorrentes de instabilidades momentâneas de rede externa, ausência de sinal de internet do cliente ou ações exclusivas de terceiros.
                    </p>
                  </section>

                  <section className="space-y-2">
                    <h3 className="text-base font-bold text-white uppercase tracking-wider text-amber-500 text-xs font-mono">5. Disposições Finais e Legislação</h3>
                    <p>
                      Reservamo-nos o direito de atualizar estes Termos de Uso periodicamente para refletir melhorias no produto ou conformidades legais. A versão revisada passará a vigorar no momento de sua publicação. Estes termos são regidos pelas leis da República Federativa do Brasil.
                    </p>
                    <p>
                      Para suporte, fale conosco através de: <a href="mailto:barbersflowbr@gmail.com" className="text-amber-500 hover:underline">barbersflowbr@gmail.com</a>.
                    </p>
                  </section>
                </div>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="mt-8 pt-4 border-t border-white/5 flex justify-end">
              <button 
                onClick={() => setActiveModal(null)}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
              >
                Entendi e Aceito
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* WhatsApp Floating Button */}
      <a 
        href="https://wa.me/5553997126656?text=Ol%C3%A1%2C%20gostaria%20de%20saber%20mais%20sobre%20o%20BarbersFlow." 
        target="_blank" 
        rel="noopener noreferrer"
        className={`fixed bottom-28 right-6 z-50 flex items-center justify-center w-12 h-12 rounded-full shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${isWhatsAppGray ? 'bg-gray-500 hover:bg-gray-400 opacity-70 text-white/90' : 'bg-[#25D366] hover:bg-[#20b958] text-white'}`}
        aria-label="Suporte WhatsApp 24h"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </a>
    </div>
  );
}
