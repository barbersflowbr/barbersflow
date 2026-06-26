/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  DollarSign, 
  Clock, 
  Menu, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash, 
  Check, 
  Phone, 
  Mail, 
  User, 
  TrendingUp, 
  Settings, 
  LogOut, 
  AlertCircle, 
  Scissors,
  CheckSquare,
  MapPin,
  Store,
  UploadCloud,
  Camera,
  Sparkles
} from 'lucide-react';
import { initialAvailableHours } from '../data';
import { Appointment, Barber, Service } from '../types';
import BarberManager from './BarberManager';
import ImageUploader from './ImageUploader';
import { 
  Barbearia, 
  registerBarbearia, 
  loginBarbearia, 
  logoutBarbearia,
  resetPasswordForEmail,
  updatePassword,
  subscribeBookings, 
  addBooking, 
  updateBookingStatus, 
  deleteBookingFromDb, 
  updateBarbearia 
} from '../lib/db';

interface AdminPanelProps {
  onNavigate: (view: 'landing' | 'admin' | 'pwa' | 'superadmin') => void;
  activeBarbearia: Barbearia | null;
  onSetActiveBarbearia: (barbearia: Barbearia | null) => void;
}

export default function AdminPanel({ onNavigate, activeBarbearia, onSetActiveBarbearia }: AdminPanelProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'config' | 'barbeiros'>('agenda');
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('2026-06-26'); // Set to default June 26, 2026
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all'); // 'all' or specific ID

  const exportData = (format: 'csv' | 'json') => {
    const dataToExport = bookings.filter(b => b.date === selectedDate);
    if (dataToExport.length === 0) return;

    if (format === 'json') {
      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(dataToExport))}`;
      const link = document.createElement('a');
      link.href = jsonString;
      link.download = `agenda-${selectedDate}.json`;
      link.click();
    } else {
      const headers = ['ID', 'Cliente', 'Serviço', 'Barbeiro', 'Horário', 'Data'];
      const csvRows = [
        headers.join(','),
        ...dataToExport.map(b => [b.id, b.clientName, b.serviceName, b.barberName, b.time, b.date].join(','))
      ];
      const csvString = `data:text/csv;chatset=utf-8,${encodeURIComponent(csvRows.join('\n'))}`;
      const link = document.createElement('a');
      link.href = csvString;
      link.download = `agenda-${selectedDate}.csv`;
      link.click();
    }
  };

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Auth form states
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'recovery' | 'update_password'>('login');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [authSlug, setAuthSlug] = useState('');
  const [authPlan, setAuthPlan] = useState('Pro Flow');
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMessage, setAuthMessage] = useState<string | null>(null);

  // Onboarding States
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardName, setOnboardName] = useState('');
  const [onboardLocation, setOnboardLocation] = useState('');
  const [onboardPhone, setOnboardPhone] = useState('');
  const [onboardLogo, setOnboardLogo] = useState('');

  const [onboardServices, setOnboardServices] = useState<Service[]>([]);
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(50);
  const [newServiceDuration, setNewServiceDuration] = useState(30);
  const [newServiceCategory, setNewServiceCategory] = useState<'Cabelo' | 'Barba' | 'Combo' | 'Tratamento'>('Cabelo');
  const [newServiceDescription, setNewServiceDescription] = useState('');
  const [serviceError, setServiceError] = useState<string | null>(null);
  const [isOnboardingSaving, setIsOnboardingSaving] = useState(false);

  // Profile Settings States
  const [configName, setConfigName] = useState('');
  const [configLocation, setConfigLocation] = useState('');
  const [configPhone, setConfigPhone] = useState('');
  const [configLogo, setConfigLogo] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Barber Settings States
  const [isEditingBarber, setIsEditingBarber] = useState<Barber | null>(null);
  const [isAddingBarber, setIsAddingBarber] = useState(false);
  const [barberFormName, setBarberFormName] = useState('');
  const [barberFormRole, setBarberFormRole] = useState('');
  const [barberFormAvatar, setBarberFormAvatar] = useState('');
  const [barberFormSpecialties, setBarberFormSpecialties] = useState<string[]>([]);
  const [newSpecialtyInput, setNewSpecialtyInput] = useState('');

  // Check for password recovery in URL
  useEffect(() => {
    if (window.location.hash.includes('recovery=true')) {
      setAuthMode('update_password');
    }
  }, []);

  // Sync onboarding and configuration state with activeBarbearia
  useEffect(() => {
    if (activeBarbearia) {
      setOnboardName(activeBarbearia.name || '');
      setOnboardLocation(activeBarbearia.location || '');
      setOnboardPhone(activeBarbearia.phone || '');
      setOnboardLogo(activeBarbearia.logo || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&h=150');
      setOnboardServices(activeBarbearia.services || []);

      // Sync active settings config
      setConfigName(activeBarbearia.name || '');
      setConfigLocation(activeBarbearia.location || '');
      setConfigPhone(activeBarbearia.phone || '');
      setConfigLogo(activeBarbearia.logo || 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&h=150');
    }
  }, [activeBarbearia]);

  // States for Quick Booking modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [modalBarberId, setModalBarberId] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');

  // Dynamic references based on logged-in barbearia
  const barbers = activeBarbearia?.barbers || [];
  const services = activeBarbearia?.services || [];

  // Update selectedServiceId when services are available
  useEffect(() => {
    if (services.length > 0 && !selectedServiceId) {
      setSelectedServiceId(services[0].id);
    }
  }, [services, selectedServiceId]);

  // Real-time sub to bookings of active barbearia
  useEffect(() => {
    if (!activeBarbearia) {
      setBookings([]);
      setIsLoading(false);
      setClientName('');
      setClientPhone('');
      setSelectedDate('2026-06-26');
      setSelectedBarberFilter('all');
      setOnboardName('');
      setOnboardLocation('');
      setConfigName('');
      setConfigLocation('');
      setBarberFormName('');
      setBarberFormRole('');
      setIsEditingBarber(null);
      setIsAddingBarber(false);
      setIsBookModalOpen(false);
      return;
    }
    setIsLoading(true);
    setClientName('');
    setClientPhone('');

    const unsubscribeBookings = subscribeBookings(activeBarbearia.id, (realtimeList) => {
      setBookings(realtimeList);
      setIsLoading(false);
      setErrorMessage(null);
    });

    const unsubscribeBarbearia = import('../lib/db').then(m => 
      m.subscribeBarbearia(activeBarbearia.id, (updated) => {
        onSetActiveBarbearia(updated);
      })
    );

    return () => {
      unsubscribeBookings();
      unsubscribeBarbearia.then(unsub => {
        if (typeof unsub === 'function') unsub();
      });
    };
  }, [activeBarbearia]);

  // Auth triggers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      const shop = await loginBarbearia(authEmail, authPassword);
      onSetActiveBarbearia(shop);
      if (authEmail === 'barbersflowbr@gmail.com') {
        onNavigate('superadmin');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao fazer login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsLoading(true);
    try {
      await resetPasswordForEmail(authEmail);
      setAuthMessage('Se houver uma conta com este e-mail, enviamos um link de recuperação para você.');
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao solicitar recuperação de senha.');
    } finally {
      setIsLoading(false);
    }
  };

  // ... inside AdminPanel component ...
  const handleCheckout = async () => {
    if (!activeBarbearia) return;
    
    setIsLoading(true);
    setErrorMessage(null);

    let price = 149;
    if (activeBarbearia.plan === 'Pro Flow') price = 289;
    if (activeBarbearia.plan === 'Black Elite') price = 499;

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planName: activeBarbearia.plan,
          price: price,
          email: activeBarbearia.email,
          title: `Assinatura ${activeBarbearia.plan} - BarbersFlow`
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Erro ao gerar link de pagamento');
      }

      // Redireciona para o Mercado Pago
      window.location.href = data.init_point;
    } catch (err: any) {
      setErrorMessage(err.message || 'Erro de conexão com o Mercado Pago');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthMessage(null);
    setIsLoading(true);
    try {
      await updatePassword(authPassword);
      setAuthMessage('Senha atualizada com sucesso! Você pode fazer login agora.');
      setAuthMode('login');
      setAuthPassword('');
      // Limpa a URL hash para evitar prender na tela de update password
      window.history.replaceState(null, '', window.location.pathname + '#admin');
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao atualizar a senha.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setIsLoading(true);
    try {
      if (!authSlug) {
        throw new Error('Link personalizado é obrigatório.');
      }
      const shop = await registerBarbearia(authName, authEmail, authPassword, authSlug, authPlan);
      
      // Send welcome email
      try {
        await fetch('/api/email/welcome', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: authEmail,
            name: authName,
            slug: authSlug,
            plan: authPlan
          }),
        });
      } catch (emailErr) {
        console.error('Failed to send welcome email:', emailErr);
      }

      onSetActiveBarbearia(shop);
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao realizar cadastro.');
    } finally {
      setIsLoading(false);
    }
  };



  const handleCompleteOnboarding = async () => {
    if (!activeBarbearia) return;
    setIsOnboardingSaving(true);
    setErrorMessage(null);
    try {
      await updateBarbearia(activeBarbearia.id, {
        name: onboardName.trim(),
        location: onboardLocation.trim(),
        phone: onboardPhone.trim(),
        logo: onboardLogo.trim() || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&h=150",
        services: onboardServices,
        isOnboarded: true
      });
      
      // Update parent component state
      onSetActiveBarbearia({
        ...activeBarbearia,
        name: onboardName.trim(),
        location: onboardLocation.trim(),
        phone: onboardPhone.trim(),
        logo: onboardLogo.trim() || "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&h=150",
        services: onboardServices,
        isOnboarded: true
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao salvar onboarding: ' + err.message);
    } finally {
      setIsOnboardingSaving(false);
    }
  };

  // Configuration Handlers
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBarbearia) return;
    setIsSavingConfig(true);
    setErrorMessage(null);
    try {
      await updateBarbearia(activeBarbearia.id, {
        name: configName.trim(),
        location: configLocation.trim(),
        phone: configPhone.trim(),
        logo: configLogo.trim()
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        name: configName.trim(),
        location: configLocation.trim(),
        phone: configPhone.trim(),
        logo: configLogo.trim()
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao salvar perfil da barbearia: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleOpenAddBarber = () => {
    setIsEditingBarber(null);
    setBarberFormName('');
    setBarberFormRole('');
    setBarberFormAvatar('https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250&h=250');
    setBarberFormSpecialties([]);
    setIsAddingBarber(true);
  };

  const handleOpenEditBarber = (barber: Barber) => {
    setIsAddingBarber(false);
    setIsEditingBarber(barber);
    setBarberFormName(barber.name);
    setBarberFormRole(barber.role);
    setBarberFormAvatar(barber.avatar);
    setBarberFormSpecialties(barber.specialties || []);
  };

  const handleSaveBarber = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBarbearia) return;
    setErrorMessage(null);
    setIsSavingConfig(true);

    try {
      let updatedBarbers = [...(activeBarbearia.barbers || [])];
      
      if (isEditingBarber) {
        // Edit Mode
        updatedBarbers = updatedBarbers.map(b => 
          b.id === isEditingBarber.id 
            ? { 
                ...b, 
                name: barberFormName.trim(), 
                role: barberFormRole.trim(), 
                avatar: barberFormAvatar, 
                specialties: barberFormSpecialties 
              } 
            : b
        );
      } else {
        // Add Mode
        const newBarber: Barber = {
          id: 'b_' + Date.now(),
          name: barberFormName.trim(),
          role: barberFormRole.trim(),
          avatar: barberFormAvatar,
          rating: 5.0,
          reviews: 1,
          specialties: barberFormSpecialties.length > 0 ? barberFormSpecialties : ['Cabelo'],
          assignedServices: [],
          workingHours: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start: '09:00', end: '18:00' }
        };
        updatedBarbers.push(newBarber);
      }

      await updateBarbearia(activeBarbearia.id, {
        barbers: updatedBarbers
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        barbers: updatedBarbers
      });

      setIsAddingBarber(false);
      setIsEditingBarber(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao salvar profissional: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDeleteBarber = async (barberId: string) => {
    if (!activeBarbearia) return;
    if (!confirm('Deseja realmente remover este profissional da equipe?')) return;
    setErrorMessage(null);
    setIsSavingConfig(true);

    try {
      const updatedBarbers = (activeBarbearia.barbers || []).filter(b => b.id !== barberId);
      await updateBarbearia(activeBarbearia.id, {
        barbers: updatedBarbers
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        barbers: updatedBarbers
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao remover profissional: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Update Status
  const handleUpdateStatus = async (bookingId: string, newStatus: 'Ocupado' | 'Concluído' | 'Livre') => {
    try {
      await updateBookingStatus(bookingId, newStatus as any);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar status: ' + err.message);
    }
  };

  // Delete/Cancel booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await deleteBookingFromDb(bookingId);
    } catch (err: any) {
      console.error(err);
      alert('Erro ao cancelar agendamento: ' + err.message);
    }
  };

  // Quick book from Admin
  const handleAdminBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName) {
      alert('Nome do cliente é obrigatório');
      return;
    }

    if (!activeBarbearia) return;

    const payload = {
      barberId: modalBarberId,
      serviceId: selectedServiceId,
      clientName,
      clientEmail: `${clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      clientPhone: clientPhone || '(11) 99999-9999',
      date: selectedDate,
      time: modalTime,
      status: 'Ocupado' as const
    };

    try {
      await addBooking(activeBarbearia.id, payload);
      setIsBookModalOpen(false);
      setClientName('');
      setClientPhone('');
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar agendamento');
    }
  };

  const openQuickBook = (barberId: string, time: string) => {
    setModalBarberId(barberId);
    setModalTime(time);
    setIsBookModalOpen(true);
  };

  // Calculations for dashboard indicators
  const filteredBookings = bookings.filter(b => b.date === selectedDate);
  const totalRevenue = filteredBookings.reduce((sum, b) => {
    const service = services.find(s => s.id === b.serviceId);
    return sum + (service ? service.price : 0);
  }, 0);

  const completedCount = filteredBookings.filter(b => b.status === 'Concluído').length;
  const busyCount = filteredBookings.filter(b => b.status === 'Ocupado').length;
  const totalBookingsToday = filteredBookings.length;

  const totalSlotsPossible = barbers.length * initialAvailableHours.length;
  const occupancyRate = totalSlotsPossible > 0 
    ? Math.round(((busyCount + completedCount) / totalSlotsPossible) * 100) 
    : 0;

  // Next / Previous Date navigation
  const navigateDate = (days: number) => {
    const current = new Date(selectedDate + 'T12:00:00');
    current.setDate(current.getDate() + days);
    const yyyy = current.getFullYear();
    const mm = String(current.getMonth() + 1).padStart(2, '0');
    const dd = String(current.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
  };

  const formatDateLabel = (dateStr: string) => {
    const parts = dateStr.split('-');
    const dt = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return dt.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' });
  };

  if (!activeBarbearia) {
    return (
      <div className="min-h-screen w-full bg-[#0A0A0B] text-gray-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Glow backgrounds */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-600/5 rounded-full blur-3xl" />

        <div className="w-full max-w-md bg-[#0F0F12]/95 border border-white/5 backdrop-blur-xl p-8 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] relative z-10">
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-4">
              <Scissors className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Barbers<span className="text-amber-500">Flow</span> Admin
            </h1>
            <p className="text-xs text-gray-400 mt-1.5 font-light">
              Gerencie sua barbearia com banco de dados em tempo real
            </p>
          </div>

          {/* Toggle Tabs */}
          {(authMode === 'login' || authMode === 'register') && (
            <div className="flex bg-[#16161B] p-1 rounded-xl border border-white/5 mb-6">
              <button
                onClick={() => { setAuthMode('login'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'login' 
                    ? 'bg-amber-500 text-black shadow' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Entrar
              </button>
              <button
                onClick={() => { setAuthMode('register'); setAuthError(null); }}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  authMode === 'register' 
                    ? 'bg-amber-500 text-black shadow' 
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Criar Conta
              </button>
            </div>
          )}

          {authMessage && (
            <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-xl text-green-400 text-xs text-center mb-5 font-light">
              {authMessage}
            </div>
          )}

          {authError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs text-center mb-5 font-light">
              {authError}
            </div>
          )}

          {authMode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 tracking-wider">E-MAIL</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@barbearia.com"
                  className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[10px] font-mono text-gray-400 tracking-wider">SENHA</label>
                  <button type="button" onClick={() => { setAuthMode('recovery'); setAuthError(null); setAuthMessage(null); }} className="text-[10px] text-amber-500 hover:text-amber-400 transition-colors cursor-pointer">Esqueceu a senha?</button>
                </div>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-500 text-black hover:bg-amber-400 rounded-xl font-bold text-xs tracking-wider transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none uppercase cursor-pointer"
              >
                {isLoading ? 'Entrando...' : 'Entrar no Painel'}
              </button>
            </form>
          )}
          
          {authMode === 'recovery' && (
            <form onSubmit={handleRecovery} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 tracking-wider">E-MAIL CADASTRADO</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@barbearia.com"
                  className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-500 text-black hover:bg-amber-400 rounded-xl font-bold text-xs tracking-wider transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none uppercase cursor-pointer"
              >
                {isLoading ? 'Enviando...' : 'Recuperar Senha'}
              </button>
              
              <div className="text-center pt-2">
                <button type="button" onClick={() => { setAuthMode('login'); setAuthError(null); setAuthMessage(null); }} className="text-xs text-gray-400 hover:text-white transition-colors cursor-pointer">
                  Voltar ao login
                </button>
              </div>
            </form>
          )}

          {authMode === 'update_password' && (
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 tracking-wider">NOVA SENHA</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-500 text-black hover:bg-amber-400 rounded-xl font-bold text-xs tracking-wider transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none uppercase cursor-pointer"
              >
                {isLoading ? 'Atualizando...' : 'Atualizar Senha'}
              </button>
            </form>
          )}

          {authMode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 tracking-wider">NOME DA BARBEARIA</label>
                <input
                  type="text"
                  required
                  value={authName}
                  onChange={(e) => setAuthName(e.target.value)}
                  placeholder="Ex: Barbearia Becker"
                  className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 tracking-wider">E-MAIL DO ADMINISTRADOR</label>
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="admin@barbearia.com"
                  className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 tracking-wider">SENHA DE ACESSO</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 tracking-wider">LINK EXCLUSIVO (SLUG)</label>
                <div className="flex items-center bg-[#131316] border border-white/5 rounded-xl px-3 focus-within:border-amber-500">
                  <span className="text-xs text-gray-600 font-mono select-none">/pwa#</span>
                  <input
                    type="text"
                    required
                    value={authSlug}
                    onChange={(e) => setAuthSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                    placeholder="ex: becker"
                    className="flex-1 p-3 bg-transparent text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-gray-400 mb-1.5 tracking-wider font-semibold">PLANO SELECIONADO</label>
                <select
                  value={authPlan}
                  onChange={(e) => setAuthPlan(e.target.value)}
                  className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="Standard">Standard (Básico)</option>
                  <option value="Pro Flow">Pro Flow (Recomendado)</option>
                  <option value="Black Elite">Black Elite (Completo)</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 bg-amber-500 text-black hover:bg-amber-400 rounded-xl font-bold text-xs tracking-wider transition-all shadow-[0_4px_15px_rgba(245,158,11,0.2)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none uppercase cursor-pointer"
              >
                {isLoading ? 'Cadastrando...' : 'Cadastrar e Acessar'}
              </button>
            </form>
          )}


        </div>
      </div>
    );
  }

  if (activeBarbearia && !activeBarbearia.isOnboarded) {
    return (
      <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex flex-col justify-center items-center p-4 md:p-8">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-2xl bg-[#0E0E10] border border-white/5 rounded-3xl p-6 md:p-10 shadow-2xl relative z-10 space-y-8">
          
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <Scissors className="w-6 h-6 text-black" />
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">Configuração Inicial</h1>
            <p className="text-sm text-gray-400 max-w-md mx-auto">
              Configure os detalhes iniciais da sua barbearia para começar a usar o BarbersFlow.
            </p>
          </div>

          {/* Step Progress Indicators */}
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex items-center">
                <div 
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    onboardStep >= step 
                      ? 'bg-amber-500 text-black shadow-[0_0_10px_rgba(245,158,11,0.3)]' 
                      : 'bg-white/5 text-gray-500 border border-white/5'
                  }`}
                >
                  {step === 1 && "1"}
                  {step === 2 && "2"}
                  {step === 3 && "3"}
                </div>
                {step < 3 && (
                  <div 
                    className={`w-12 md:w-20 h-0.5 ml-3 transition-colors ${
                      onboardStep > step ? 'bg-amber-500' : 'bg-white/5'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Error notice if fields are blank */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs">
              {errorMessage}
            </div>
          )}

          {/* STEP 1: Basic Profile Details */}
          {onboardStep === 1 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-5"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Store className="w-5 h-5 text-amber-500" />
                1. Perfil da Barbearia
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Nome da Barbearia</label>
                  <input
                    type="text"
                    required
                    value={onboardName}
                    onChange={(e) => setOnboardName(e.target.value)}
                    placeholder="Ex: Barber Club Paulista"
                    className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Endereço / Localização</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 w-4.5 h-4.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      value={onboardLocation}
                      onChange={(e) => setOnboardLocation(e.target.value)}
                      placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                      className="w-full pl-10 pr-4 p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">O endereço físico do seu estabelecimento.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Contato Suporte (WhatsApp)</label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-3.5 w-4.5 h-4.5 text-gray-500" />
                    <input
                      type="text"
                      value={onboardPhone}
                      onChange={(e) => setOnboardPhone(e.target.value)}
                      placeholder="Ex: 5511999999999"
                      className="w-full pl-10 pr-4 p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">Número de WhatsApp (com DDD) para suporte aos seus clientes. Apenas números.</span>
                </div>

                <div>
                  <ImageUploader 
                    currentImageUrl={onboardLogo}
                    onUploadSuccess={(url) => setOnboardLogo(url)}
                    label="Logotipo da Barbearia"
                    aspectRatio="square"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">Faça upload de uma imagem quadrada para o logo da sua barbearia.</span>
                </div>
              </div>

              <div className="pt-4 flex justify-between">
                <button
                  type="button"
                  onClick={() => {
                    logoutBarbearia();
                    onSetActiveBarbearia(null);
                    onNavigate('landing');
                  }}
                  className="px-5 py-2.5 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                >
                  Sair
                </button>
                <button
                  type="button"
                  disabled={!onboardName || !onboardLocation}
                  onClick={() => setOnboardStep(2)}
                  className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1"
                >
                  Continuar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: Services Offered */}
          {onboardStep === 2 && (
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Scissors className="w-5 h-5 text-amber-500" />
                  2. Defina os Seus Serviços
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Configure os serviços oferecidos e seus respectivos valores e durações.
                </p>
              </div>

              {/* Service list scroll area */}
              <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1">
                {onboardServices.map((service, index) => (
                  <div key={service.id || index} className="p-3.5 bg-[#131316] border border-white/5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-medium">{service.category}</span>
                        <h4 className="font-bold text-white">{service.name}</h4>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-1">{service.description}</p>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <div className="flex items-center bg-[#18181C] border border-white/5 rounded-lg px-2 py-1 w-20">
                        <span className="text-[9px] text-gray-500 mr-1">R$</span>
                        <input
                          type="number"
                          value={service.price}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value) || 0;
                            const updated = [...onboardServices];
                            updated[index] = { ...updated[index], price: val };
                            setOnboardServices(updated);
                          }}
                          className="bg-transparent text-white focus:outline-none w-full text-right font-mono"
                        />
                      </div>

                      <div className="flex items-center bg-[#18181C] border border-white/5 rounded-lg px-1.5 py-1 w-16">
                        <input
                          type="number"
                          value={service.duration}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const updated = [...onboardServices];
                            updated[index] = { ...updated[index], duration: val };
                            setOnboardServices(updated);
                          }}
                          className="bg-transparent text-white focus:outline-none w-full text-right font-mono mr-0.5"
                        />
                        <span className="text-[9px] text-gray-500">min</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setOnboardServices(onboardServices.filter((_, i) => i !== index));
                        }}
                        className="p-1.5 text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 rounded-lg transition-colors"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Custom Service Form section */}
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Novo Serviço Personalizado</h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={newServiceName}
                    onChange={(e) => { setNewServiceName(e.target.value); setServiceError(null); }}
                    placeholder="Nome do serviço (ex: Barba Terapia)"
                    className="p-2 bg-[#131316] border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={newServiceCategory}
                    onChange={(e: any) => setNewServiceCategory(e.target.value)}
                    className="p-2 bg-[#131316] border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Cabelo">Cabelo</option>
                    <option value="Barba">Barba</option>
                    <option value="Combo">Combo</option>
                    <option value="Tratamento">Tratamento</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="flex items-center bg-[#131316] border border-white/5 rounded-lg px-2 py-1.5">
                    <span className="text-[10px] text-gray-500 mr-1">R$</span>
                    <input
                      type="number"
                      value={newServicePrice}
                      onChange={(e) => { setNewServicePrice(parseFloat(e.target.value) || 0); setServiceError(null); }}
                      placeholder="Preço"
                      className="bg-transparent text-xs text-white focus:outline-none w-full"
                    />
                  </div>
                  <div className="flex items-center bg-[#131316] border border-white/5 rounded-lg px-2 py-1.5">
                    <input
                      type="number"
                      value={newServiceDuration}
                      onChange={(e) => { setNewServiceDuration(parseInt(e.target.value) || 0); setServiceError(null); }}
                      placeholder="Duração"
                      className="bg-transparent text-xs text-white focus:outline-none w-full mr-1"
                    />
                    <span className="text-[10px] text-gray-500">min</span>
                  </div>
                </div>

                <input
                  type="text"
                  value={newServiceDescription}
                  onChange={(e) => setNewServiceDescription(e.target.value)}
                  placeholder="Descrição rápida do serviço..."
                  className="w-full p-2 bg-[#131316] border border-white/5 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                />

                {serviceError && <p className="text-red-500 text-xs">{serviceError}</p>}
                <button
                  type="button"
                  onClick={() => {
                    if (!newServiceName.trim()) {
                      setServiceError('Nome do serviço é obrigatório.');
                      return;
                    }
                    if (newServicePrice <= 0) {
                      setServiceError('Preço deve ser maior que zero.');
                      return;
                    }
                    if (newServiceDuration <= 0) {
                      setServiceError('Duração deve ser maior que zero.');
                      return;
                    }
                    setServiceError(null);
                    const newService: Service = {
                      id: 's_' + Date.now(),
                      name: newServiceName,
                      price: newServicePrice,
                      duration: newServiceDuration,
                      category: newServiceCategory,
                      description: newServiceDescription
                    };
                    setOnboardServices([...onboardServices, newService]);
                    setNewServiceName('');
                    setNewServiceDescription('');
                    setNewServicePrice(50);
                    setNewServiceDuration(30);
                  }}
                  disabled={!newServiceName}
                  className="w-full py-1.5 bg-white/10 hover:bg-white/15 text-white disabled:opacity-50 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  Adicionar Serviço
                </button>
              </div>

              {/* Navigation buttons */}
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  onClick={() => setOnboardStep(1)}
                  className="px-5 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={onboardServices.length === 0}
                  onClick={() => setOnboardStep(3)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black disabled:opacity-50 font-bold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                >
                  Revisar
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: Success Confirmation */}
          {onboardStep === 3 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6"
            >
              <div className="text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <Check className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white">Quase Pronto!</h3>
                <p className="text-xs text-gray-400">Verifique os dados abaixo antes de ativar seu perfil.</p>
              </div>

              <div className="p-4 bg-[#131316] border border-white/5 rounded-2xl space-y-3 text-xs">
                <div className="flex items-center gap-3 border-b border-white/5 pb-2.5">
                  <img 
                    src={onboardLogo} 
                    alt="Logo" 
                    className="w-10 h-10 rounded-full object-cover border border-white/10 shrink-0"
                  />
                  <div>
                    <h4 className="font-bold text-white">{onboardName}</h4>
                    <span className="text-[10px] text-amber-500">Plano {activeBarbearia.plan}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-start gap-2 text-gray-300">
                    <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block text-[11px]">Endereço:</span>
                      <p className="text-gray-400 text-[11px]">{onboardLocation}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 text-gray-300">
                    <Scissors className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-white block text-[11px]">Serviços Habilitados ({onboardServices.length}):</span>
                      <p className="text-gray-400 text-[11px] line-clamp-2">
                        {onboardServices.map(s => `${s.name} (R$ ${s.price})`).join(', ')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation and Final Save */}
              <div className="pt-2 flex justify-between">
                <button
                  type="button"
                  disabled={isOnboardingSaving}
                  onClick={() => setOnboardStep(2)}
                  className="px-5 py-2 text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Voltar
                </button>
                <button
                  type="button"
                  disabled={isOnboardingSaving}
                  onClick={handleCompleteOnboarding}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-[0_4px_15px_rgba(245,158,11,0.2)]"
                >
                  {isOnboardingSaving ? "Ativando..." : "Finalizar & Entrar"}
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex overflow-hidden">
      
      {/* Sidebar de navegação colapsável e moderna */}
      <aside 
        className={`bg-[#0E0E10] border-r border-white/5 flex flex-col justify-between transition-all duration-300 ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        } shrink-0`}
      >
        <div>
          {/* Sidebar Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <Scissors className="w-4.5 h-4.5 text-black" />
              </div>
              {!isSidebarCollapsed && (
                <span className="text-base font-bold text-white tracking-tight shrink-0">
                  Barbers<span className="text-amber-500">Flow</span>
                </span>
              )}
            </div>
            <button 
              onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTab('agenda')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'agenda' 
                  ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.15)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Calendar className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Agenda Interativa</span>}
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.15)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Métricas Rápidas</span>}
            </button>

            <button
              onClick={() => setActiveTab('barbeiros')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'barbeiros' 
                  ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.15)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Barbeiros</span>}
            </button>

            <div className="h-px bg-white/5 my-4" />

            <button
              onClick={() => onNavigate('pwa')}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-amber-500/85 hover:bg-amber-500/5 transition-all"
            >
              <Scissors className="w-5 h-5 shrink-0 animate-pulse" />
              {!isSidebarCollapsed && <span>Simular PWA Cliente</span>}
            </button>
          </nav>
        </div>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-white/5">
          <button 
            onClick={() => {
              logoutBarbearia();
              onSetActiveBarbearia(null);
              onNavigate('landing');
            }}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-500 hover:text-rose-400 hover:bg-rose-500/5 transition-colors"
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {!isSidebarCollapsed && <span>Sair do Painel</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Navbar */}
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#0E0E10]/50 shrink-0">
          <div>
            <span className="text-xs font-mono text-amber-500/80 uppercase tracking-widest font-semibold">Painel Administrativo</span>
            <h2 className="text-lg font-bold text-white leading-none mt-1">
              {activeTab === 'dashboard' && 'Métricas de Faturamento'}
              {activeTab === 'agenda' && 'Agenda de Atendimento'}
              {activeTab === 'config' && 'Configurações da Barbearia'}
             {activeTab === 'barbeiros' && 'Gerenciar Barbeiros'}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            {activeBarbearia && (
              <button 
                onClick={handleCheckout}
                disabled={isLoading}
                className="hidden md:flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Aguarde...' : `Assinar ${activeBarbearia.plan}`}
              </button>
            )}
            <div className="flex items-center gap-2">
              <img 
                className="w-8 h-8 rounded-full border border-white/10 object-cover" 
                src={activeBarbearia?.logo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} 
                alt="Admin avatar" 
              />
              <span className="text-sm font-medium text-gray-300 hidden sm:inline-block">{activeBarbearia?.name || 'Dono Barbearia'}</span>
            </div>
          </div>
        </header>

        {/* Content Scroll Container */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          
          {/* API offline or connection notices */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-light">{errorMessage}</p>
            </div>
          )}

          {/* TAB 1: METRICS DASHBOARD */}
          {activeTab === 'dashboard' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Dynamic quick metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {/* Revenue card */}
                <div className="p-6 rounded-2xl bg-[#121215] border border-white/5 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl" />
                  <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-4">
                    <span>FATURAMENTO (HOJE)</span>
                    <DollarSign className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">R$ {totalRevenue.toFixed(2)}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    +18.4% comparado a ontem
                  </div>
                </div>

                {/* Total Bookings */}
                <div className="p-6 rounded-2xl bg-[#121215] border border-white/5 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-4">
                    <span>AGENDAMENTOS</span>
                    <Clock className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">{totalBookingsToday}</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-2">
                    {completedCount} concluídos • {busyCount} pendentes
                  </div>
                </div>

                {/* Occupancy Rate */}
                <div className="p-6 rounded-2xl bg-[#121215] border border-white/5 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-4">
                    <span>TAXA DE OCUPAÇÃO</span>
                    <TrendingUp className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">{occupancyRate}%</div>
                  <div className="text-[10px] text-amber-500 font-mono mt-2">
                    {busyCount + completedCount} de {totalSlotsPossible} horários ocupados
                  </div>
                </div>

                {/* Active Professionals */}
                <div className="p-6 rounded-2xl bg-[#121215] border border-white/5 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-4">
                    <span>BARBEIROS ATIVOS</span>
                    <Users className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">{barbers.length}</div>
                  <div className="text-[10px] text-emerald-400 font-mono mt-2 flex items-center gap-1">
                    100% online e operantes
                  </div>
                </div>
              </div>

              {/* Advanced chart visualization using pure styled elements */}
              <div className="p-6 sm:p-8 rounded-3xl bg-[#121215] border border-white/5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h3 className="text-lg font-bold text-white">Faturamento Diário - Tendências da Semana</h3>
                    <p className="text-xs text-gray-400 font-light mt-1">Análise volumétrica de agendamentos e faturamento acumulado por dia.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Faturamento</span>
                    <span className="flex items-center gap-1.5 text-xs text-gray-400"><span className="w-2.5 h-2.5 rounded bg-amber-500/20" /> Média</span>
                  </div>
                </div>

                {/* Styled Volume Chart */}
                <div className="h-64 flex items-end gap-3.5 pt-6 border-b border-white/5 pb-2">
                  {[
                    { day: 'Seg', val: 420, h: '40%' },
                    { day: 'Ter', val: 780, h: '60%' },
                    { day: 'Qua', val: 910, h: '70%' },
                    { day: 'Qui', val: 1140, h: '80%' },
                    { day: 'Sex', val: totalRevenue || 1240, h: '95%', today: true },
                    { day: 'Sáb', val: 1450, h: '100%' },
                    { day: 'Dom', val: 0, h: '5%' }
                  ].map((bar, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-3 group h-full justify-end">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-amber-500 text-black text-[10px] font-mono font-bold px-2 py-1 rounded mb-1 relative bottom-0">
                        R$ {bar.val}
                      </div>
                      <div 
                        className={`w-full rounded-t-xl transition-all duration-500 ${
                          bar.today 
                            ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)]' 
                            : 'bg-white/5 hover:bg-white/10'
                        }`}
                        style={{ height: bar.h }}
                      />
                      <span className={`text-[11px] font-mono ${bar.today ? 'text-amber-500 font-bold' : 'text-gray-500'}`}>
                        {bar.day} {bar.today && '(Hoje)'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: INTERACTIVE AGENDA CALENDAR */}
          {activeTab === 'agenda' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Agenda Controls (Date Select, Barber Filter) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121215] p-5 rounded-2xl border border-white/5">
                
                {/* Date Navigator */}
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => navigateDate(-1)}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-black/80 border border-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center min-w-[160px]">
                    <span className="block text-[10px] font-mono text-amber-500 uppercase tracking-widest font-semibold">Data Selecionada</span>
                    <span className="text-sm font-bold text-white capitalize">{formatDateLabel(selectedDate)}</span>
                  </div>
                  <button 
                    onClick={() => navigateDate(1)}
                    className="p-2.5 rounded-xl bg-black/40 hover:bg-black/80 border border-white/5 text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button onClick={() => exportData('csv')} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">Exportar CSV</button>
                  <button onClick={() => exportData('json')} className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">Exportar JSON</button>
                </div>

                {/* Barber filter selector tabs */}
                <div className="flex flex-wrap items-center gap-1.5 bg-black/40 p-1.5 rounded-xl border border-white/5">
                  <button
                    onClick={() => setSelectedBarberFilter('all')}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      selectedBarberFilter === 'all'
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Todos Barbeiros
                  </button>
                  {barbers.map((b) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBarberFilter(b.id)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedBarberFilter === b.id
                          ? 'bg-amber-500 text-black font-bold'
                          : 'text-gray-400 hover:text-white'
                      }`}
                    >
                      <img src={b.avatar} className="w-4.5 h-4.5 rounded-full object-cover" />
                      <span>{b.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Agenda Grid Calendar */}
              <div className="bg-[#121215] rounded-3xl border border-white/5 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[700px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-[#0E0E10]/80 h-14">
                        <th className="px-6 text-xs font-mono text-gray-400 font-bold uppercase tracking-wider w-28">Horário</th>
                        {barbers
                          .filter(b => selectedBarberFilter === 'all' || b.id === selectedBarberFilter)
                          .map((b) => (
                            <th key={b.id} className="px-6 py-3 min-w-[200px]">
                              <div className="flex items-center gap-3">
                                <img src={b.avatar} className="w-9 h-9 rounded-full object-cover border border-white/10" />
                                <div>
                                  <h4 className="text-sm font-bold text-white">{b.name}</h4>
                                  <span className="block text-[10px] text-amber-500/80 font-mono leading-none mt-0.5">{b.role}</span>
                                </div>
                              </div>
                            </th>
                          ))
                        }
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {initialAvailableHours.map((time) => (
                        <tr key={time} className="h-24 hover:bg-white/[0.01] transition-colors">
                          {/* Time Column */}
                          <td className="px-6 align-middle font-mono text-sm font-semibold text-gray-400 border-r border-white/5">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-amber-500/50" />
                              {time}
                            </div>
                          </td>

                          {/* Barber Scheduling Cards */}
                          {barbers
                            .filter(b => selectedBarberFilter === 'all' || b.id === selectedBarberFilter)
                            .map((barber) => {
                              // Find appointment for this date, time and barber
                              const booking = bookings.find(
                                (app) => app.barberId === barber.id && app.date === selectedDate && app.time === time
                              );

                              if (booking) {
                                const service = services.find((s) => s.id === booking.serviceId);
                                const isConcluido = booking.status === 'Concluído';

                                return (
                                  <td key={barber.id} className="px-4 py-2 align-middle border-r border-white/5">
                                    <div 
                                      className={`p-3.5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                                        isConcluido
                                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                          : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                      }`}
                                    >
                                      {/* Background accent shine */}
                                      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-xl pointer-events-none ${
                                        isConcluido ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                                      }`} />

                                      <div className="flex items-start justify-between gap-2 relative z-10">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                              isConcluido ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                                            }`} />
                                            <h5 className="text-xs font-bold text-white tracking-wide">{booking.clientName}</h5>
                                          </div>
                                          <p className="text-[10px] text-gray-400 mt-0.5 font-light">
                                            {service ? service.name : 'Serviço Premium'} ({service ? service.duration : 45} min)
                                          </p>
                                          
                                          {/* Hidden elements that appear on hover for actions */}
                                          <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-mono">
                                            <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-amber-500/60" /> {booking.clientPhone}</span>
                                            {service && <span className="text-white font-bold">R$ {service.price}</span>}
                                          </div>
                                        </div>

                                        {/* Dynamic Admin Actions */}
                                        <div className="flex items-center gap-1">
                                          {!isConcluido ? (
                                            <button
                                              onClick={() => handleUpdateStatus(booking.id, 'Concluído')}
                                              title="Concluir Atendimento"
                                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-all cursor-pointer"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                          ) : (
                                            <button
                                              onClick={() => handleUpdateStatus(booking.id, 'Ocupado')}
                                              title="Mudar para Pendente"
                                              className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500 text-amber-400 hover:text-black transition-all cursor-pointer"
                                            >
                                              <Clock className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          <button
                                            onClick={() => handleDeleteBooking(booking.id)}
                                            title="Cancelar Agendamento"
                                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500 hover:text-white text-rose-400 transition-all cursor-pointer"
                                          >
                                            <Trash className="w-3.5 h-3.5" />
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                );
                              }

                              // Available slot (Livre)
                              return (
                                <td key={barber.id} className="px-4 py-2 align-middle border-r border-white/5">
                                  <button
                                    onClick={() => openQuickBook(barber.id, time)}
                                    className="w-full h-14 rounded-2xl border-2 border-dashed border-white/5 hover:border-amber-500/30 hover:bg-amber-500/[0.02] flex items-center justify-center gap-2 text-gray-500 hover:text-amber-400 transition-all duration-300 group text-xs font-medium cursor-pointer"
                                  >
                                    <Plus className="w-4 h-4 text-gray-600 group-hover:text-amber-500 transition-colors" />
                                    <span>Livre / Reservar</span>
                                  </button>
                                </td>
                              );
                            })
                          }
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: BARBEIROS */}
          {activeTab === 'barbeiros' && activeBarbearia && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <BarberManager 
                barbeariaId={activeBarbearia.id}
                barbers={barbers}
                services={services}
                onUpdate={() => {
                   // Refresh logic
                }}
              />
            </motion.div>
          )}

          {/* TAB 4: CONFIGURATIONS */}
          {activeTab === 'config' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Profile Config Column */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 space-y-6">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Store className="w-5 h-5 text-amber-500" />
                      Perfil do Estabelecimento
                    </h3>
                    <p className="text-xs text-gray-400 mt-1">Configure o nome, localização e logotipo público da sua barbearia.</p>
                  </div>

                  <form onSubmit={handleSaveProfile} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Nome da Barbearia</label>
                      <input
                        type="text"
                        required
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        placeholder="Ex: BarbersFlow Paulista"
                        className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Endereço / Localização</label>
                      <input
                        type="text"
                        required
                        value={configLocation}
                        onChange={(e) => setConfigLocation(e.target.value)}
                        placeholder="Ex: Av. Paulista, 1000 - São Paulo, SP"
                        className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Contato Suporte (WhatsApp)</label>
                      <input
                        type="text"
                        value={configPhone}
                        onChange={(e) => setConfigPhone(e.target.value)}
                        placeholder="Ex: 5511999999999"
                        className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                      />
                      <span className="text-[10px] text-gray-500 mt-1 block">Número com DDD.</span>
                    </div>

                    <div>
                      <ImageUploader 
                        currentImageUrl={configLogo}
                        onUploadSuccess={(url) => setConfigLogo(url)}
                        label="Logotipo da Barbearia"
                        aspectRatio="square"
                      />
                      <span className="text-[10px] text-gray-500 mt-1.5 block">Substitua o logo atual enviando um arquivo.</span>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isSavingConfig}
                        className="w-full py-3 bg-amber-500 text-black text-sm font-extrabold rounded-xl hover:bg-amber-400 transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(245,158,11,0.15)] disabled:opacity-50"
                      >
                        {isSavingConfig ? (
                          <span className="animate-pulse">Salvando...</span>
                        ) : (
                          <>
                            <Check className="w-4 h-4" />
                            Salvar Perfil
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Barbers Management Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-500" />
                        Equipe de Profissionais
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Gerencie os profissionais da sua equipe e os serviços prestados.</p>
                    </div>
                    
                    <button
                      onClick={handleOpenAddBarber}
                      className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      Novo Profissional
                    </button>
                  </div>

                  {/* List Barbers */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {barbers.map((b) => (
                      <div key={b.id} className="p-4 rounded-2xl bg-[#131316] border border-white/5 flex gap-4 items-start relative group">
                        <img 
                          src={b.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop"} 
                          alt={b.name} 
                          className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="text-sm font-bold text-white truncate">{b.name}</h4>
                          <p className="text-xs text-amber-500/80 font-medium font-mono truncate">{b.role}</p>
                          
                          <div className="flex flex-wrap gap-1 pt-1">
                            {(b.specialties || []).map((s, idx) => (
                              <span key={idx} className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-gray-400 font-mono">
                                {s}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Edit/Delete Actions overlay on hover or top corner */}
                        <div className="absolute top-3 right-3 flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditBarber(b)}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-400 transition-colors cursor-pointer"
                            title="Editar Profissional"
                          >
                            <Settings className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteBarber(b.id)}
                            className="p-1.5 rounded-lg bg-[#E11D48]/10 hover:bg-rose-500 hover:text-white text-rose-400 transition-colors cursor-pointer"
                            title="Remover Profissional"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </div>
      </main>

      {/* QUICK BOOKING ADMIN MODAL */}
      <AnimatePresence>
        {isBookModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsBookModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0F0F12] border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
            >
              <button 
                onClick={() => setIsBookModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500">
                  <Scissors className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-lg font-bold text-white">Agendamento Expresso</h3>
              </div>

              <form onSubmit={handleAdminBook} className="space-y-4">
                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">PROFISSIONAL</label>
                  <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm font-medium text-gray-200">
                    {barbers.find(b => b.id === modalBarberId)?.name || 'Profissional'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5">DATA</label>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm font-medium text-gray-200 text-center font-mono">
                      {selectedDate}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5">HORÁRIO</label>
                    <div className="p-3 bg-white/5 border border-white/5 rounded-xl text-sm font-medium text-amber-400 text-center font-mono font-bold">
                      {modalTime}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">SERVIÇO</label>
                  <select
                    value={selectedServiceId}
                    onChange={(e) => setSelectedServiceId(e.target.value)}
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                  >
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} - R$ {s.price} ({s.duration} min)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">NOME DO CLIENTE</label>
                  <input
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Pedro Henrique"
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">TELEFONE DO CLIENTE (OPCIONAL)</label>
                  <input
                    type="text"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Ex: (11) 98888-7777"
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setIsBookModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-300 font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-3.5 rounded-xl bg-amber-500 text-black text-sm font-extrabold tracking-wide hover:bg-amber-400 transition-colors cursor-pointer"
                  >
                    Confirmar Reserva
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ADD / EDIT BARBER MODAL */}
      <AnimatePresence>
        {(isAddingBarber || isEditingBarber) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingBarber(false);
                setIsEditingBarber(null);
              }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0F0F12] border border-white/10 rounded-3xl p-6 shadow-2xl z-10"
            >
              <button 
                onClick={() => {
                  setIsAddingBarber(false);
                  setIsEditingBarber(null);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 animate-pulse">
                  <User className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isEditingBarber ? 'Editar Profissional' : 'Novo Profissional'}
                </h3>
              </div>

              <form onSubmit={handleSaveBarber} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={barberFormName}
                    onChange={(e) => setBarberFormName(e.target.value)}
                    placeholder="Ex: Carlos Oliveira"
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Função / Cargo</label>
                  <input
                    type="text"
                    required
                    value={barberFormRole}
                    onChange={(e) => setBarberFormRole(e.target.value)}
                    placeholder="Ex: Especialista em Barba"
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <ImageUploader 
                    currentImageUrl={barberFormAvatar}
                    onUploadSuccess={(url) => setBarberFormAvatar(url)}
                    label="Foto de Perfil"
                    aspectRatio="square"
                  />
                  <span className="text-[10px] text-gray-500 mt-1.5 block">Faça upload de uma foto quadrada.</span>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Especialidades</label>
                  <div className="flex flex-wrap gap-2">
                    {['Cabelo', 'Barba', 'Pigmentação', 'Tratamento', 'Visagismo'].map((spec) => {
                      const isSelected = barberFormSpecialties.includes(spec);
                      return (
                        <button
                          key={spec}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setBarberFormSpecialties(barberFormSpecialties.filter(s => s !== spec));
                            } else {
                              setBarberFormSpecialties([...barberFormSpecialties, spec]);
                            }
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-amber-500 text-black font-bold' 
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                          }`}
                        >
                          {spec}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSavingConfig}
                    onClick={() => {
                      setIsAddingBarber(false);
                      setIsEditingBarber(null);
                    }}
                    className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-300 font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="flex-1 py-3.5 rounded-xl bg-amber-500 text-black text-sm font-extrabold tracking-wide hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingConfig ? 'Salvando...' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
