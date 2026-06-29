/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeCanvas } from 'qrcode.react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
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
  Sparkles,
  Smartphone,
  Edit,
  Save,
  Package,
  Minus,
  RefreshCw,
  Copy,
  QrCode,
  Printer,
  Download,
  MessageCircle,
  Maximize2
} from 'lucide-react';
import { initialAvailableHours } from '../data';
import { Appointment, Barber, Service, InventoryItem } from '../types';
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
  updateBarbearia,
  getBarbearia
} from '../lib/db';

function get7DaysWindow(anchorDateStr: string) {
  const dates: { dateStr: string; label: string; matchPrefix: string }[] = [];
  const parts = anchorDateStr.split('-');
  const anchor = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  
  for (let i = 6; i >= 0; i--) {
    const d = new Date(anchor.getTime());
    d.setDate(anchor.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const label = d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' });
    dates.push({ dateStr, label, matchPrefix: dateStr });
  }
  return dates;
}

function get30DaysWindow(anchorDateStr: string) {
  const dates: { dateStr: string; label: string; matchPrefix: string }[] = [];
  const parts = anchorDateStr.split('-');
  const anchor = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  
  for (let i = 29; i >= 0; i--) {
    const d = new Date(anchor.getTime());
    d.setDate(anchor.getDate() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    // Show label only every few days to avoid crowding, or just show day/month
    const label = d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
    dates.push({ dateStr, label, matchPrefix: dateStr });
  }
  return dates;
}

function get12MonthsWindow(anchorDateStr: string) {
  const dates: { dateStr: string; label: string; matchPrefix: string }[] = [];
  const parts = anchorDateStr.split('-');
  const anchor = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  
  for (let i = 11; i >= 0; i--) {
    const d = new Date(anchor.getTime());
    d.setMonth(anchor.getMonth() - i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}`;
    const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
    dates.push({ dateStr, label, matchPrefix: dateStr });
  }
  return dates;
}

const CustomTooltip = ({ active, payload, label, prefix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#0F0F12] border border-white/10 p-3 rounded-xl shadow-xl">
        <p className="text-[10px] font-mono font-bold text-gray-400 uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-extrabold text-amber-500 font-mono">
          {prefix}{payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

function getTodayDateString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

interface AdminPanelProps {
  onNavigate: (view: 'landing' | 'admin' | 'pwa' | 'superadmin') => void;
  activeBarbearia: Barbearia | null;
  onSetActiveBarbearia: (barbearia: Barbearia | null) => void;
}

export default function AdminPanel({ onNavigate, activeBarbearia, onSetActiveBarbearia }: AdminPanelProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'clientes' | 'config' | 'barbeiros' | 'estoque' | 'marketing'>('agenda');
  const [bookings, setBookings] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayDateString()); // Dynamic local date
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>('all'); // 'all' or specific ID

  // Inventory module states
  const [isAddingInventory, setIsAddingInventory] = useState(false);
  const [invFormName, setInvFormName] = useState('');
  const [invFormCategory, setInvFormCategory] = useState<'Pomada' | 'Shampoo' | 'Lâmina' | 'Outros'>('Pomada');
  const [invFormStock, setInvFormStock] = useState<number>(10);
  const [invFormMinStock, setInvFormMinStock] = useState<number>(3);
  const [invFormUnit, setInvFormUnit] = useState('unidades');
  const [invFormCostPrice, setInvFormCostPrice] = useState<number>(0);
  const [selectedInvCategoryFilter, setSelectedInvCategoryFilter] = useState<string>('Todos');
  const [editingInventoryId, setEditingInventoryId] = useState<string | null>(null);

  // Skeleton Loader Component
  const SkeletonLoader = ({ className, key }: { className?: string, key?: React.Key }) => (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      className={`bg-white/5 rounded-2xl ${className}`}
    />
  );

  const DashboardSkeleton = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
        {[...Array(5)].map((_, i) => <SkeletonLoader key={i} className="h-32" />)}
      </div>
      <SkeletonLoader className="h-64" />
    </div>
  );

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
  const [configSlug, setConfigSlug] = useState('');
  const [isSavingConfig, setIsSavingConfig] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Marketing & QR Code States
  const [qrColor, setQrColor] = useState('#121214');
  const [showLogoCenter, setShowLogoCenter] = useState(true);
  const [qrSize, setQrSize] = useState(300);

  // Service Settings States
  const [isAddingService, setIsAddingService] = useState(false);
  const [isEditingService, setIsEditingService] = useState<Service | null>(null);
  const [serviceFormName, setServiceFormName] = useState('');
  const [serviceFormPrice, setServiceFormPrice] = useState(40);
  const [serviceFormDuration, setServiceFormDuration] = useState(30);
  const [serviceFormCategory, setServiceFormCategory] = useState<'Cabelo' | 'Barba' | 'Combo' | 'Tratamento'>('Cabelo');
  const [serviceFormDescription, setServiceFormDescription] = useState('');

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
    if (window.location.hash.includes('recovery=true') || window.location.search.includes('recovery=true')) {
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
      setConfigSlug(activeBarbearia.slug || '');
    }
  }, [activeBarbearia]);

  // States for Quick Booking modal
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [modalBarberId, setModalBarberId] = useState('');
  const [modalTime, setModalTime] = useState('');
  const [modalDate, setModalDate] = useState('');
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [isBlockSlotMode, setIsBlockSlotMode] = useState(false);
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [isSavingClient, setIsSavingClient] = useState(false);
  const [isChartExpanded, setIsChartExpanded] = useState(false);
  const [chartPeriod, setChartPeriod] = useState<'semanal' | 'mensal' | 'anual'>('semanal');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000);
  };

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
      setSelectedDate(getTodayDateString());
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
      // Limpa a URL e parâmetros para evitar prender na tela de update password
      window.history.replaceState(null, '', window.location.pathname);
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
      const sanitizedSlug = configSlug.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      await updateBarbearia(activeBarbearia.id, {
        name: configName.trim(),
        location: configLocation.trim(),
        phone: configPhone.trim(),
        logo: configLogo.trim(),
        slug: sanitizedSlug
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        name: configName.trim(),
        location: configLocation.trim(),
        phone: configPhone.trim(),
        logo: configLogo.trim(),
        slug: sanitizedSlug
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

  // Service Management Handlers
  const handleSaveService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBarbearia) return;
    setErrorMessage(null);
    setIsSavingConfig(true);

    try {
      let updatedServices = [...(activeBarbearia.services || [])];
      
      if (isEditingService) {
        // Edit Mode
        updatedServices = updatedServices.map(s => 
          s.id === isEditingService.id 
            ? { 
                ...s, 
                name: serviceFormName.trim(), 
                price: Number(serviceFormPrice), 
                duration: Number(serviceFormDuration), 
                category: serviceFormCategory, 
                description: serviceFormDescription.trim() 
              } 
            : s
        );
      } else {
        // Add Mode
        const newService: Service = {
          id: 'srv_' + Date.now(),
          name: serviceFormName.trim(),
          price: Number(serviceFormPrice),
          duration: Number(serviceFormDuration),
          category: serviceFormCategory,
          description: serviceFormDescription.trim()
        };
        updatedServices.push(newService);
      }

      await updateBarbearia(activeBarbearia.id, {
        services: updatedServices
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        services: updatedServices
      });

      setIsAddingService(false);
      setIsEditingService(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao salvar serviço: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    if (!activeBarbearia) return;
    if (!confirm('Deseja realmente remover este serviço?')) return;
    setErrorMessage(null);
    setIsSavingConfig(true);

    try {
      const updatedServices = (activeBarbearia.services || []).filter(s => s.id !== serviceId);
      await updateBarbearia(activeBarbearia.id, {
        services: updatedServices
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        services: updatedServices
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao remover serviço: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Inventory Handlers
  const handleSaveInventoryItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBarbearia) return;
    setErrorMessage(null);
    setIsSavingConfig(true);

    try {
      const currentInventory = activeBarbearia.inventory || [];
      let updatedInventory: InventoryItem[];

      if (editingInventoryId) {
        // Edit existing
        updatedInventory = currentInventory.map(item => {
          if (item.id === editingInventoryId) {
            return {
              ...item,
              name: invFormName.trim(),
              category: invFormCategory,
              stock: invFormStock,
              minStock: invFormMinStock,
              unit: invFormUnit.trim() || 'unidades',
              costPrice: invFormCostPrice,
              lastUpdated: new Date().toISOString()
            };
          }
          return item;
        });
      } else {
        // Create new
        const newItem: InventoryItem = {
          id: `inv-${Date.now()}`,
          name: invFormName.trim(),
          category: invFormCategory,
          stock: invFormStock,
          minStock: invFormMinStock,
          unit: invFormUnit.trim() || 'unidades',
          costPrice: invFormCostPrice,
          lastUpdated: new Date().toISOString()
        };
        updatedInventory = [...currentInventory, newItem];
      }

      await updateBarbearia(activeBarbearia.id, {
        inventory: updatedInventory
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        inventory: updatedInventory
      });

      // Reset form
      setInvFormName('');
      setInvFormCategory('Pomada');
      setInvFormStock(10);
      setInvFormMinStock(3);
      setInvFormUnit('unidades');
      setInvFormCostPrice(0);
      setIsAddingInventory(false);
      setEditingInventoryId(null);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao salvar item de estoque: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleDeleteInventoryItem = async (itemId: string) => {
    if (!activeBarbearia) return;
    if (!confirm('Deseja realmente remover este item do estoque?')) return;
    setErrorMessage(null);

    try {
      const updatedInventory = (activeBarbearia.inventory || []).filter(item => item.id !== itemId);
      await updateBarbearia(activeBarbearia.id, {
        inventory: updatedInventory
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        inventory: updatedInventory
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao remover item do estoque: ' + err.message);
    }
  };

  const handleAdjustInventoryStock = async (itemId: string, adjustment: number) => {
    if (!activeBarbearia) return;
    try {
      const updatedInventory = (activeBarbearia.inventory || []).map(item => {
        if (item.id === itemId) {
          const newStock = Math.max(0, item.stock + adjustment);
          return {
            ...item,
            stock: newStock,
            lastUpdated: new Date().toISOString()
          };
        }
        return item;
      });

      await updateBarbearia(activeBarbearia.id, {
        inventory: updatedInventory
      });

      onSetActiveBarbearia({
        ...activeBarbearia,
        inventory: updatedInventory
      });
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Erro ao atualizar quantidade em estoque: ' + err.message);
    }
  };

  // Update Status
  const handleUpdateStatus = async (bookingId: string, newStatus: 'Ocupado' | 'Concluído' | 'Livre') => {
    try {
      await updateBookingStatus(bookingId, newStatus as any);
      showToast(`Status atualizado para ${newStatus}`, 'success');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao atualizar status: ' + err.message);
      showToast('Erro ao atualizar status', 'error');
    }
  };

  const handleSendWhatsAppConfirmation = (booking: Appointment, serviceName: string, time: string) => {
    if (!booking.clientPhone) return;
    const phoneDigits = booking.clientPhone.replace(/\D/g, '');
    if (!phoneDigits) return;
    
    const dateFormatted = new Date(`${booking.date}T00:00:00`).toLocaleDateString('pt-BR');
    const message = `Olá ${booking.clientName}, passando para confirmar seu agendamento de ${serviceName} na ${activeBarbearia?.name || 'barbearia'} para o dia ${dateFormatted} às ${time}. Podemos confirmar?`;
    
    // Check if the phone starts with 55 (Brazil country code), if not, add it
    const fullPhone = phoneDigits.startsWith('55') ? phoneDigits : (phoneDigits.length >= 10 ? `55${phoneDigits}` : phoneDigits);
    const url = `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    showToast('Confirmação enviada com sucesso!', 'success');
  };

  // Delete/Cancel booking
  const handleDeleteBooking = async (bookingId: string) => {
    if (!confirm('Deseja realmente cancelar este agendamento?')) return;
    try {
      await deleteBookingFromDb(bookingId);
      showToast('Agendamento cancelado com sucesso!', 'success');
    } catch (err: any) {
      console.error(err);
      alert('Erro ao cancelar agendamento: ' + err.message);
      showToast('Erro ao cancelar agendamento', 'error');
    }
  };

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBarbearia) return;
    
    setIsSavingClient(true);
    
    try {
      const newClient = {
        id: Math.random().toString(36).substring(2, 15),
        name: newClientName,
        phone: newClientPhone,
        email: newClientEmail,
        createdAt: new Date().toISOString()
      };
      
      const currentClients = activeBarbearia.clients || [];
      await updateBarbearia(activeBarbearia.id, {
        clients: [...currentClients, newClient]
      });
      
      setIsAddClientModalOpen(false);
      setNewClientName('');
      setNewClientPhone('');
      setNewClientEmail('');
      showToast('Cliente adicionado com sucesso!', 'success');
      
    } catch (err: any) {
      console.error(err);
      alert('Erro ao adicionar cliente: ' + err.message);
    } finally {
      setIsSavingClient(false);
    }
  };

  // Quick book from Admin
  const handleAdminBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isBlockSlotMode && !clientName) {
      alert('Nome do cliente é obrigatório');
      return;
    }

    if (!activeBarbearia) return;

    const payload = {
      barberId: modalBarberId,
      serviceId: isBlockSlotMode ? (services[0]?.id || '') : selectedServiceId,
      clientName: isBlockSlotMode ? 'Bloqueio / Indisponível' : clientName,
      clientEmail: isBlockSlotMode ? 'bloqueado@sistema.com' : `${clientName.toLowerCase().replace(/\s+/g, '')}@example.com`,
      clientPhone: isBlockSlotMode ? '' : (clientPhone || '(11) 99999-9999'),
      date: modalDate || selectedDate,
      time: modalTime,
      status: 'Ocupado' as const
    };

    try {
      await addBooking(activeBarbearia.id, payload);
      setIsBookModalOpen(false);
      setClientName('');
      setClientPhone('');
      showToast(isBlockSlotMode ? 'Horário bloqueado com sucesso!' : 'Agendamento criado com sucesso!', 'success');
    } catch (err: any) {
      alert(err.message || 'Erro ao cadastrar agendamento');
      showToast('Erro ao cadastrar agendamento', 'error');
    }
  };

  const openQuickBook = (barberId: string, time: string) => {
    setModalBarberId(barberId);
    setModalTime(time);
    setModalDate(selectedDate);
    setIsBlockSlotMode(false);
    setIsBookModalOpen(true);
  };

  const openGeneralBook = () => {
    setModalBarberId(barbers[0]?.id || '');
    setModalTime(initialAvailableHours[0] || '09:00');
    setModalDate(selectedDate);
    setIsBlockSlotMode(false);
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

  const currentMonthPrefix = new Date().toISOString().substring(0, 7);
  const monthlyRevenue = bookings
    .filter(b => b.date.startsWith(currentMonthPrefix) && (b.status === 'Concluído' || b.status === 'Ocupado'))
    .reduce((sum, b) => {
      const service = services.find(s => s.id === b.serviceId);
      return sum + (service ? Number(service.price) : 0);
    }, 0);

  const pendingBookingsTotal = bookings.filter(b => b.status === 'Ocupado').length;
  const totalUniqueClients = Array.from(new Set(bookings.filter(b => b.clientName).map(b => b.clientPhone || b.clientName))).length;

  // Calculate chart data based on activeBarbearia settings & bookings
  const windowData = chartPeriod === 'semanal' 
    ? get7DaysWindow(selectedDate) 
    : chartPeriod === 'mensal' 
      ? get30DaysWindow(selectedDate)
      : get12MonthsWindow(selectedDate);

  const chartData = windowData.map(({ dateStr, label, matchPrefix }) => {
    const periodBookings = bookings.filter(b => b.date.startsWith(matchPrefix) && b.status !== 'Livre');
    const agendamentos = periodBookings.length;
    const receita = periodBookings.reduce((sum, b) => {
      const service = services.find(s => s.id === b.serviceId);
      return sum + (service ? Number(service.price) : 0);
    }, 0);
    return {
      name: label,
      agendamentos,
      receita,
      rawDate: dateStr
    };
  });

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
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1">
              Barbers<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 animate-text-gradient">Flow</span> Admin
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
    <div className="min-h-screen bg-[#0A0A0B] text-gray-100 flex overflow-hidden print:bg-white print:text-black">
      
      {/* Sidebar de navegação colapsável e moderna */}
      
      {/* Mobile Menu Toggle (Floating button, visible only on mobile) */}
      <div className="md:hidden fixed bottom-6 left-6 z-[60]">
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className={`p-4 bg-amber-500 text-black rounded-full shadow-[0_4px_20px_rgba(245,158,11,0.3)] hover:bg-amber-400 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isMobileMenuOpen ? 'rotate-180 scale-110' : 'rotate-0 scale-100'
          }`}
        >
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>
      
      <aside 
        className={`
          bg-[#0E0E10] flex flex-col justify-between shrink-0 print:hidden
          transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
          md:border-r md:border-white/5 border border-white/10
          md:relative fixed z-50
          md:translate-y-0 md:opacity-100 md:pointer-events-auto md:scale-100
          md:h-screen md:rounded-none rounded-3xl shadow-2xl md:shadow-none
          md:inset-auto inset-4 h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)]
          ${isSidebarCollapsed ? 'md:w-20' : 'md:w-64'}
          ${isMobileMenuOpen 
            ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto flex' 
            : 'opacity-0 translate-y-16 scale-95 pointer-events-none md:flex'
          }
        `}
      >
        <div>
          {/* Sidebar Header */}
          <div className="h-20 flex items-center justify-between px-6 border-b border-white/5">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                <Scissors className="w-4.5 h-4.5 text-black" />
              </div>
              {!isSidebarCollapsed && (
                <span className="text-base font-bold text-white tracking-tight shrink-0 flex items-center gap-1">
                  Barbers<span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600 animate-text-gradient">Flow</span>
                </span>
              )}
            </div>
            <button 
              onClick={() => {
                if (isMobileMenuOpen) {
                  setIsMobileMenuOpen(false);
                } else {
                  setIsSidebarCollapsed(!isSidebarCollapsed);
                }
              }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 flex flex-col gap-1.5">
            <button
              onClick={() => { setActiveTab('agenda'); setIsMobileMenuOpen(false); }}
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
              onClick={() => { setActiveTab('clientes'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'clientes' 
                  ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.15)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Clientes</span>}
            </button>

            <button
              onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
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
              onClick={() => { setActiveTab('barbeiros'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'barbeiros' 
                  ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.15)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Users className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Barbeiros</span>}
            </button>

            <button
              onClick={() => { setActiveTab('estoque'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'estoque' 
                  ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.15)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Package className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Controle de Estoque</span>}
            </button>

            <button
              onClick={() => { setActiveTab('config'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'config' 
                  ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.15)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Settings className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Configurações</span>}
            </button>

            <button
              onClick={() => { setActiveTab('marketing'); setIsMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                activeTab === 'marketing' 
                  ? 'bg-amber-500 text-black shadow-[0_4px_15px_rgba(245,158,11,0.15)] font-bold' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <QrCode className="w-5 h-5 shrink-0" />
              {!isSidebarCollapsed && <span>Divulgar QR Code</span>}
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
        <header className="h-20 border-b border-white/5 px-8 flex items-center justify-between bg-[#0E0E10]/50 shrink-0 print:hidden">
          <div>
            <span className="text-xs font-mono text-amber-500/80 uppercase tracking-widest font-semibold">Painel Administrativo</span>
            <h2 className="text-lg font-bold text-white leading-none mt-1">
              {activeTab === 'dashboard' && 'Métricas de Faturamento'}
              {activeTab === 'agenda' && 'Agenda de Atendimento'}
              {activeTab === 'clientes' && 'Gestão de Clientes'}
              {activeTab === 'config' && 'Configurações da Barbearia'}
              {activeTab === 'barbeiros' && 'Gerenciar Barbeiros'}
              {activeTab === 'estoque' && 'Controle de Estoque & Consumo'}
              {activeTab === 'marketing' && 'Divulgar PWA & QR Code'}
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
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 print:overflow-visible print:p-0">
          


          {/* API offline or connection notices */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <p className="font-light">{errorMessage}</p>
            </div>
          )}

          {/* TAB 1: METRICS DASHBOARD */}
          {activeTab === 'dashboard' && (
            isLoading ? (
              <DashboardSkeleton />
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
              {/* Global Quick Metrics Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#121215] p-5 rounded-2xl border border-white/5 shadow-lg print:hidden">
                <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                    Faturamento do Mês
                  </span>
                  <span className="text-2xl font-extrabold text-white">R$ {monthlyRevenue.toFixed(2)}</span>
                </div>
                
                <div className="flex flex-col gap-1 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:px-4">
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    Agendamentos Pendentes
                  </span>
                  <span className="text-2xl font-extrabold text-white">{pendingBookingsTotal}</span>
                </div>
                
                <div className="flex flex-col gap-1 pt-4 md:pt-0 md:pl-4">
                  <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-500" />
                    Total de Clientes
                  </span>
                  <span className="text-2xl font-extrabold text-white">{totalUniqueClients}</span>
                </div>
              </div>

              {/* Dynamic quick metrics cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
                {/* Trial Status */}
                <div className="p-6 rounded-2xl bg-[#121215] border border-white/5 relative overflow-hidden group">
                  <div className="flex items-center justify-between text-gray-400 text-xs font-mono mb-4">
                    <span>TESTE GRÁTIS</span>
                    <Sparkles className="w-4.5 h-4.5 text-amber-500" />
                  </div>
                  <div className="text-3xl font-extrabold text-white">{Math.max(0, 7 - Math.floor((new Date().getTime() - new Date(activeBarbearia?.createdAt || new Date()).getTime()) / (1000 * 60 * 60 * 24)))} dias</div>
                  <div className="text-[10px] text-gray-400 font-mono mt-2">
                    restantes no seu período de teste
                  </div>
                </div>

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

              {/* Recharts Metrics Panel Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Chart 1: Revenue (Faturamento Estimado) */}
                <div className="p-6 rounded-3xl bg-[#121215] border border-white/5 space-y-4">
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-base font-bold text-white">Faturamento & Receita Estimada</h3>
                        <p className="text-[11px] text-gray-400 mt-1 font-light">Evolução do faturamento baseado nos serviços agendados.</p>
                      </div>
                      <button
                        onClick={() => setIsChartExpanded(true)}
                        className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
                        title="Expandir gráfico"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 bg-[#1a1a1f] p-1 rounded-xl self-start">
                      <button
                        onClick={() => setChartPeriod('semanal')}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${chartPeriod === 'semanal' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Semanal
                      </button>
                      <button
                        onClick={() => setChartPeriod('mensal')}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${chartPeriod === 'mensal' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Mensal
                      </button>
                      <button
                        onClick={() => setChartPeriod('anual')}
                        className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-colors ${chartPeriod === 'anual' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                      >
                        Anual
                      </button>
                    </div>
                  </div>
                  
                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9ca3af" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                          tickFormatter={(val) => `R$${val}`}
                        />
                        <Tooltip content={<CustomTooltip prefix="R$ " />} />
                        <Line 
                          type="monotone" 
                          dataKey="receita" 
                          stroke="#f59e0b" 
                          strokeWidth={2.5}
                          dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }}
                          activeDot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Chart 2: Bookings Volume (Volume de Agendamentos) */}
                <div className="p-6 rounded-3xl bg-[#121215] border border-white/5 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white">Volume de Agendamentos Diários</h3>
                    <p className="text-[11px] text-gray-400 mt-1 font-light">Quantidade total de atendimentos realizados e marcados para cada dia.</p>
                  </div>

                  <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -30, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
                        <XAxis 
                          dataKey="name" 
                          stroke="#9ca3af" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          dy={10}
                        />
                        <YAxis 
                          stroke="#9ca3af" 
                          fontSize={11}
                          tickLine={false}
                          axisLine={false}
                          dx={-10}
                          allowDecimals={false}
                        />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar 
                          dataKey="agendamentos" 
                          fill="#f59e0b" 
                          radius={[6, 6, 0, 0]} 
                          maxBarSize={32}
                          fillOpacity={0.85}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            </motion.div>
          )
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
                
                {/* Date Navigator & Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full md:w-auto">
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

                  <button
                    onClick={openGeneralBook}
                    className="flex items-center justify-center gap-2 px-5 py-3 bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold tracking-wider uppercase rounded-xl transition-all duration-300 shadow-md shadow-amber-500/10 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-black stroke-[3px]" />
                    <span>Novo Agendamento</span>
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
                                const isBlocked = booking.clientName === 'Bloqueio / Indisponível';

                                return (
                                  <td key={barber.id} className="px-4 py-2 align-middle border-r border-white/5">
                                    <div 
                                      className={`p-3.5 rounded-2xl border transition-all duration-300 relative group overflow-hidden ${
                                        isBlocked
                                          ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                                          : isConcluido
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                                      }`}
                                    >
                                      {/* Background accent shine */}
                                      <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-xl pointer-events-none ${
                                        isBlocked ? 'bg-rose-500/10' : isConcluido ? 'bg-emerald-500/10' : 'bg-amber-500/10'
                                      }`} />

                                      <div className="flex items-start justify-between gap-2 relative z-10">
                                        <div>
                                          <div className="flex items-center gap-1.5">
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                              isBlocked ? 'bg-rose-400' : isConcluido ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'
                                            }`} />
                                            <h5 className="text-xs font-bold text-white tracking-wide">{booking.clientName}</h5>
                                          </div>
                                          {!isBlocked && (
                                            <>
                                              <p className="text-[10px] text-gray-400 mt-0.5 font-light">
                                                {service ? service.name : 'Serviço Premium'} ({service ? service.duration : 45} min)
                                              </p>
                                              
                                              {/* Hidden elements that appear on hover for actions */}
                                              <div className="mt-2 pt-2 border-t border-white/5 flex flex-wrap items-center gap-3 text-[10px] text-gray-400 font-mono">
                                                <span className="flex items-center gap-1"><Phone className="w-3 h-3 text-amber-500/60" /> {booking.clientPhone}</span>
                                                {service && <span className="text-white font-bold">R$ {service.price}</span>}
                                              </div>
                                            </>
                                          )}
                                        </div>

                                        {/* Dynamic Admin Actions */}
                                        <div className="flex flex-wrap items-center justify-end gap-1 mt-2 sm:mt-0">
                                          {!isBlocked && !isConcluido && booking.clientPhone && (
                                            <button
                                              onClick={() => handleSendWhatsAppConfirmation(booking, service ? service.name : 'Serviço', time)}
                                              title="Enviar Confirmação pelo WhatsApp"
                                              className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-black border border-emerald-500/20 transition-all cursor-pointer"
                                            >
                                              <MessageCircle className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {!isBlocked && !isConcluido && (
                                            <button
                                              onClick={() => handleUpdateStatus(booking.id, 'Concluído')}
                                              title="Concluir Atendimento"
                                              className="p-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500 text-emerald-400 hover:text-black transition-all cursor-pointer"
                                            >
                                              <Check className="w-3.5 h-3.5" />
                                            </button>
                                          )}
                                          {!isBlocked && isConcluido && (
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
                                            title={isBlocked ? "Desbloquear Horário" : "Cancelar Agendamento"}
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

          {/* TAB: CLIENTES */}
          {activeTab === 'clientes' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div className="bg-[#121215] p-6 rounded-2xl border border-white/5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                      <Users className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Gestão de Clientes</h3>
                      <p className="text-sm text-gray-400 mt-1">Lista de clientes e histórico de agendamentos</p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setIsAddClientModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold rounded-xl transition-colors shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    Adicionar Cliente
                  </button>
                </div>

                {(() => {
                  const clientMap = new Map<string, any>();
                  
                  bookings.forEach(b => {
                    if (!b.clientName) return;
                    const identifier = b.clientPhone || b.clientName;
                    if (!clientMap.has(identifier)) {
                      clientMap.set(identifier, {
                        id: identifier,
                        name: b.clientName,
                        phone: b.clientPhone || '',
                        email: b.clientEmail || '',
                        visits: 0,
                        lastVisit: b.date,
                        isManual: false
                      });
                    }
                    const client = clientMap.get(identifier);
                    client.visits += 1;
                    if (new Date(`${b.date}T${b.time}`).getTime() > new Date(`${client.lastVisit}T00:00:00`).getTime()) {
                       client.lastVisit = b.date;
                    }
                  });

                  if (activeBarbearia?.clients) {
                    activeBarbearia.clients.forEach(c => {
                      const identifier = c.phone || c.name;
                      if (!clientMap.has(identifier)) {
                        clientMap.set(identifier, {
                          id: c.id,
                          name: c.name,
                          phone: c.phone || '',
                          email: c.email || '',
                          visits: 0,
                          lastVisit: c.createdAt.substring(0, 10),
                          isManual: true
                        });
                      }
                    });
                  }

                  const allClients = Array.from(clientMap.values()).sort((a, b) => a.name.localeCompare(b.name));

                  if (allClients.length === 0) {
                    return (
                      <div className="text-center py-16 bg-black/20 rounded-2xl border border-dashed border-white/10">
                        <Users className="w-12 h-12 text-gray-500 mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-medium text-white mb-1">Nenhum cliente encontrado</h3>
                        <p className="text-sm text-gray-400">Adicione clientes manualmente ou aguarde novos agendamentos.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {allClients.map(client => (
                        <div key={client.id} className="bg-black/40 border border-white/5 rounded-xl p-5 hover:border-amber-500/30 transition-colors group">
                          <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400/20 to-amber-600/20 flex items-center justify-center shrink-0 border border-amber-500/20 group-hover:scale-110 transition-transform">
                              <span className="text-lg font-bold text-amber-500">{client.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-bold text-white truncate flex items-center gap-2">
                                {client.name}
                                {client.isManual && <span className="px-1.5 py-0.5 bg-white/10 rounded text-[9px] font-mono uppercase text-gray-400">Manual</span>}
                              </h4>
                              <p className="text-sm text-gray-400 font-mono mt-1 flex items-center gap-1.5">
                                <Smartphone className="w-3.5 h-3.5" />
                                {client.phone || 'Não informado'}
                              </p>
                              {client.email && (
                                <p className="text-xs text-gray-500 truncate mt-1 flex items-center gap-1.5">
                                  <Mail className="w-3 h-3" />
                                  {client.email}
                                </p>
                              )}
                              <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Histórico</span>
                                  <span className="text-xs font-medium text-amber-500">
                                    {client.visits} {client.visits === 1 ? 'visita' : 'visitas'}
                                  </span>
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] uppercase tracking-wider text-gray-500 font-semibold mb-0.5">Última</span>
                                  <span className="text-xs font-medium text-gray-300">
                                    {client.lastVisit ? new Date(`${client.lastVisit}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : '-'}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
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
                bookings={bookings}
                onUpdate={async () => {
                  try {
                    const freshShop = await getBarbearia(activeBarbearia.id);
                    if (freshShop) {
                      onSetActiveBarbearia(freshShop);
                    }
                  } catch (err) {
                    console.error("Erro ao atualizar dados do profissional:", err);
                  }
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
                      <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Link de Agendamento Personalizado (Slug)</label>
                      <input
                        type="text"
                        required
                        value={configSlug}
                        onChange={(e) => setConfigSlug(e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))}
                        placeholder="Ex: premium-barber"
                        className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                      />
                      <div className="mt-2 p-3 bg-[#17171B] rounded-xl border border-white/5 flex items-center justify-between gap-3 overflow-hidden">
                        <div className="min-w-0 flex-1">
                          <span className="block text-[9px] font-mono text-gray-500 uppercase tracking-wider">Seu link de agendamento:</span>
                          <span className="block text-xs font-mono text-amber-500 truncate mt-0.5 select-all">
                            {window.location.origin}/{configSlug || 'sua-barbearia'}
                          </span>
                        </div>
                        {configSlug && (
                          <button
                            type="button"
                            onClick={() => {
                              const fullUrl = `${window.location.origin}/${configSlug}`;
                              navigator.clipboard.writeText(fullUrl);
                              setLinkCopied(true);
                              setTimeout(() => setLinkCopied(false), 2000);
                            }}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold transition-all flex items-center gap-1 shrink-0 cursor-pointer ${
                              linkCopied 
                                ? 'bg-emerald-500 text-white shadow-[0_2px_10px_rgba(16,185,129,0.15)]' 
                                : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                            }`}
                          >
                            {linkCopied ? <Check size={11} /> : <Copy size={11} />}
                            {linkCopied ? 'Copiado!' : 'Copiar'}
                          </button>
                        )}
                      </div>
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

                {/* Services Offered Card */}
                <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Scissors className="w-5 h-5 text-amber-500" />
                        Serviços Oferecidos
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">Gerencie os serviços, preços e durações oferecidos na sua barbearia.</p>
                    </div>
                    
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingService(null);
                        setServiceFormName('');
                        setServiceFormPrice(40);
                        setServiceFormDuration(30);
                        setServiceFormCategory('Cabelo');
                        setServiceFormDescription('');
                        setIsAddingService(true);
                      }}
                      className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Novo Serviço
                    </button>
                  </div>

                  {/* List of Services */}
                  <div className="space-y-3">
                    {services.length === 0 ? (
                      <p className="text-xs text-gray-500 italic text-center py-6">Nenhum serviço cadastrado.</p>
                    ) : (
                      services.map((s) => (
                        <div key={s.id} className="p-4 rounded-2xl bg-[#131316] border border-white/5 flex items-center justify-between group relative">
                          <div className="space-y-1 min-w-0 flex-1 pr-4">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-white truncate">{s.name}</span>
                              <span className="px-2 py-0.5 rounded bg-white/5 text-[9px] text-amber-500 font-mono">
                                {s.category}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                              <span className="text-emerald-400 font-semibold">R$ {Number(s.price).toFixed(2)}</span>
                              <span>•</span>
                              <span>{s.duration} min</span>
                            </div>
                            {s.description && (
                              <p className="text-[11px] text-gray-500 leading-relaxed mt-1 break-words">{s.description}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                setIsAddingService(false);
                                setIsEditingService(s);
                                setServiceFormName(s.name);
                                setServiceFormPrice(s.price);
                                setServiceFormDuration(s.duration);
                                setServiceFormCategory(s.category);
                                setServiceFormDescription(s.description || '');
                              }}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500 hover:text-black text-gray-400 transition-colors cursor-pointer"
                              title="Editar Serviço"
                            >
                              <Edit className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteService(s.id)}
                              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500 hover:text-white text-gray-400 transition-colors cursor-pointer"
                              title="Excluir Serviço"
                            >
                              <Trash className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
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

          {/* TAB: MARKETING & QR CODE */}
          {activeTab === 'marketing' && activeBarbearia && (
            <>
              {/* On-Screen Layout */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-12 print:hidden"
              >
                {/* Customization Column */}
                <div className="lg:col-span-5 space-y-6">
                  <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <QrCode className="w-5 h-5 text-amber-500" />
                        Personalizar QR Code
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Personalize as cores e o estilo do seu código de agendamento online.
                      </p>
                    </div>

                    {/* Colors */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Cor do QR Code</label>
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { name: 'Preto Premium', value: '#121214', bg: 'bg-[#121214] border border-white/10' },
                          { name: 'Ouro Amber', value: '#F59E0B', bg: 'bg-amber-500' },
                          { name: 'Azul Cobalto', value: '#3B82F6', bg: 'bg-blue-500' },
                          { name: 'Verde Esmeralda', value: '#10B981', bg: 'bg-emerald-500' }
                        ].map((c) => (
                          <button
                            key={c.value}
                            onClick={() => setQrColor(c.value)}
                            className={`p-3 rounded-xl flex flex-col items-center gap-1.5 transition-all cursor-pointer ${
                              qrColor === c.value 
                                ? 'ring-2 ring-amber-500 bg-white/5 border-transparent' 
                                : 'bg-white/2 hover:bg-white/5 border border-white/5'
                            }`}
                          >
                            <span className={`w-6 h-6 rounded-full ${c.bg}`} />
                            <span className="text-[9px] font-mono font-medium text-gray-300 text-center truncate w-full">{c.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Logo center toggle */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Logotipo Central</label>
                      <div className="flex items-center justify-between p-3 bg-[#131316] border border-white/5 rounded-xl">
                        <div>
                          <span className="block text-xs font-semibold text-white">Centralizar Logo</span>
                          <span className="block text-[10px] text-gray-500 mt-0.5">Mostra a logo da barbearia no centro do QR Code</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setShowLogoCenter(!showLogoCenter)}
                          className={`w-12 h-6 rounded-full p-1 transition-colors ${showLogoCenter ? 'bg-amber-500' : 'bg-white/5'}`}
                        >
                          <div className={`w-4 h-4 rounded-full bg-black transition-transform ${showLogoCenter ? 'translate-x-6' : 'translate-x-0'}`} />
                        </button>
                      </div>
                    </div>

                    {/* Link Details */}
                    <div className="space-y-2">
                      <label className="block text-[10px] font-mono text-gray-400 uppercase tracking-wider font-semibold">Endereço de Destino (Link)</label>
                      <div className="p-3.5 bg-[#131316] border border-white/5 rounded-xl font-mono text-xs text-amber-500 select-all truncate">
                        {window.location.origin}/{activeBarbearia.slug || 'sua-barbearia'}
                      </div>
                      <span className="text-[10px] text-gray-500 block">Este é o link que os clientes abrirão ao escanear o QR Code.</span>
                    </div>

                    {/* Instructions */}
                    <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 text-xs text-amber-500/90 space-y-2">
                      <span className="font-bold block text-sm">💡 Dica de Negócio</span>
                      <p className="leading-relaxed">
                        Deixe uma placa com este QR Code no balcão de recepção e nos espelhos dos barbeiros. Incentive os clientes a escanearem para fazer o próximo agendamento em segundos, garantindo sua recorrência.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Preview Column */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="bg-[#121215] p-6 rounded-3xl border border-white/5 flex flex-col items-center">
                    <div className="w-full mb-4">
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">Visualização da Placa de Balcão</h3>
                      <p className="text-xs text-gray-400 mt-0.5">Mockup realista do stand acrílico para o balcão da sua barbearia.</p>
                    </div>

                    {/* Desk Stand Acrylic Mockup */}
                    <div className="relative w-full max-w-sm aspect-[3/4] bg-[#16161B] rounded-2xl border border-white/10 p-6 flex flex-col items-center justify-between shadow-2xl overflow-hidden group">
                      {/* Background glow lines */}
                      <div className="absolute inset-0 bg-gradient-to-b from-amber-500/5 via-transparent to-transparent opacity-50" />
                      <div className="absolute -inset-10 bg-[radial-gradient(circle_at_center,rgba(245,158,11,0.03),transparent_70%)]" />

                      {/* Acrylic highlight border */}
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

                      {/* Header */}
                      <div className="w-full text-center z-10 space-y-2">
                        {activeBarbearia.logo ? (
                          <img 
                            src={activeBarbearia.logo} 
                            alt="Logo" 
                            className="w-12 h-12 rounded-xl object-cover mx-auto border border-white/10 shadow-lg"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto text-amber-500">
                            <Scissors className="w-6 h-6" />
                          </div>
                        )}
                        <div>
                          <h4 className="text-base font-black text-white uppercase tracking-wider">{activeBarbearia.name}</h4>
                          <span className="inline-block text-[9px] font-mono bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded-full uppercase tracking-widest font-bold">AGENDAMENTO ONLINE</span>
                        </div>
                      </div>

                      {/* QR Code container */}
                      <div className="p-4 bg-white rounded-3xl shadow-xl border border-white/10 z-10 flex items-center justify-center relative">
                        <QRCodeCanvas
                          id="barber-qrcode-canvas"
                          value={`${window.location.origin}/${activeBarbearia.slug || 'sua-barbearia'}`}
                          size={180}
                          bgColor="#FFFFFF"
                          fgColor={qrColor}
                          level="H"
                          includeMargin={true}
                          imageSettings={
                            showLogoCenter && activeBarbearia.logo
                              ? {
                                  src: activeBarbearia.logo,
                                  height: 36,
                                  width: 36,
                                  excavate: true,
                                }
                              : undefined
                          }
                        />
                      </div>

                      {/* Footer Instructions */}
                      <div className="w-full text-center z-10 space-y-1.5">
                        <p className="text-xs font-bold text-gray-200">Aponte a câmera do celular para agendar</p>
                        <p className="text-[10px] text-gray-500 max-w-[240px] mx-auto">Instale nosso aplicativo direto pelo navegador sem ocupar memória.</p>
                        <span className="block text-[8px] font-mono text-amber-500/70 tracking-wider">PODER DE PARCERIA COM BARBERSFLOW</span>
                      </div>

                      {/* Desk Stand Base Shadow & Base Reflection Effect */}
                      <div className="absolute -bottom-1 inset-x-4 h-3 bg-black/60 blur-md rounded-full" />
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-sm mt-6">
                      <button
                        onClick={() => {
                          const canvas = document.getElementById('barber-qrcode-canvas') as HTMLCanvasElement;
                          if (canvas) {
                            const url = canvas.toDataURL('image/png');
                            const link = document.createElement('a');
                            link.download = `qrcode-${activeBarbearia.slug || 'barbearia'}.png`;
                            link.href = url;
                            link.click();
                          }
                        }}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-white text-xs font-bold font-mono transition-all border border-white/5 cursor-pointer"
                      >
                        <Download className="w-4 h-4" />
                        BAIXAR PNG
                      </button>

                      <button
                        onClick={() => {
                          window.print();
                        }}
                        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono transition-all cursor-pointer"
                      >
                        <Printer className="w-4 h-4" />
                        IMPRIMIR PLACA
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Printable Placa (Hidden on Screen, Visible on Print Only) */}
              <div className="hidden print:flex print:flex-col print:items-center print:justify-between print:min-h-screen print:bg-white print:text-black print:p-12 print:text-center print:w-full print:absolute print:inset-0 print:z-[99999] print:font-sans">
                {/* Outer frame borders for elegant poster look */}
                <div className="w-full flex-1 border-[16px] border-black p-10 flex flex-col items-center justify-between">
                  
                  {/* Print Header */}
                  <div className="space-y-4">
                    {activeBarbearia.logo ? (
                      <img 
                        src={activeBarbearia.logo} 
                        alt="Logo" 
                        className="w-24 h-24 rounded-2xl object-cover mx-auto border-4 border-black"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl border-4 border-black flex items-center justify-center mx-auto text-black">
                        <Scissors className="w-10 h-10" />
                      </div>
                    )}
                    <div>
                      <h1 className="text-4xl font-extrabold tracking-tight uppercase">{activeBarbearia.name}</h1>
                      <div className="h-1 w-24 bg-black mx-auto my-3" />
                      <span className="text-sm font-bold tracking-widest uppercase text-gray-700">FAÇA SEU AGENDAMENTO ONLINE</span>
                    </div>
                  </div>

                  {/* QR Code Container */}
                  <div className="my-8 p-6 bg-white border-8 border-black rounded-3xl flex items-center justify-center">
                    <QRCodeCanvas
                      value={`${window.location.origin}/${activeBarbearia.slug || 'sua-barbearia'}`}
                      size={320}
                      bgColor="#FFFFFF"
                      fgColor="#000000" // Always black for maximum physical scanner contrast
                      level="H"
                      includeMargin={true}
                      imageSettings={
                        showLogoCenter && activeBarbearia.logo
                          ? {
                              src: activeBarbearia.logo,
                              height: 60,
                              width: 60,
                              excavate: true,
                            }
                          : undefined
                      }
                    />
                  </div>

                  {/* Print Instructions */}
                  <div className="space-y-4 max-w-xl">
                    <h2 className="text-2xl font-bold tracking-tight">Abra a câmera do celular e aponte para o código</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Escaneie o QR Code acima para abrir nosso aplicativo de agendamentos. Escolha seu profissional, serviço e reserve seu horário em segundos!
                    </p>
                    <div className="pt-2">
                      <p className="text-xs font-mono text-gray-400">Powered by BarbersFlow</p>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}

          {/* TAB 5: INVENTORY CONTROL (ESTOQUE) */}
          {activeTab === 'estoque' && activeBarbearia && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6 pb-12"
            >
              {/* Alert Banner for Low Stock */}
              {(() => {
                const lowStockItems = (activeBarbearia.inventory || []).filter(item => item.stock <= item.minStock);
                if (lowStockItems.length === 0) return null;
                return (
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-amber-400">Atenção: Itens em Estoque Crítico!</h4>
                      <p className="text-xs text-gray-300 mt-0.5">
                        Os seguintes produtos estão abaixo do estoque mínimo configurado: {' '}
                        <span className="font-semibold text-white">
                          {lowStockItems.map(i => `${i.name} (${i.stock} ${i.unit})`).join(', ')}
                        </span>. 
                        Recomendamos realizar a reposição em breve.
                      </p>
                    </div>
                  </div>
                );
              })()}

              {/* Stats Cards Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-[#121215] p-5 rounded-3xl border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-semibold">Total de Itens Cadastrados</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-white">{(activeBarbearia.inventory || []).length}</span>
                    <span className="text-xs text-gray-500 font-mono">produtos</span>
                  </div>
                </div>

                <div className="bg-[#121215] p-5 rounded-3xl border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-semibold">Alerta de Estoque Baixo</span>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-extrabold ${
                      (activeBarbearia.inventory || []).filter(i => i.stock <= i.minStock).length > 0 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {(activeBarbearia.inventory || []).filter(i => i.stock <= i.minStock).length}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">críticos</span>
                  </div>
                </div>

                <div className="bg-[#121215] p-5 rounded-3xl border border-white/5 space-y-2">
                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-semibold">Investimento Estimado</span>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-extrabold text-amber-500">
                      R$ {
                        (activeBarbearia.inventory || [])
                          .reduce((acc, curr) => acc + (curr.stock * (curr.costPrice || 0)), 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                      }
                    </span>
                    <span className="text-xs text-gray-500 font-mono">em estoque</span>
                  </div>
                </div>
              </div>

              {/* Sub-navbar with Filters & Quick Add */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#121215] p-4 rounded-2xl border border-white/5">
                <div className="flex flex-wrap gap-1.5">
                  {['Todos', 'Pomada', 'Shampoo', 'Lâmina', 'Outros'].map((cat) => {
                    const isSelected = selectedInvCategoryFilter === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedInvCategoryFilter(cat)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500 text-black font-extrabold'
                            : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => {
                    if (isAddingInventory) {
                      setIsAddingInventory(false);
                      setEditingInventoryId(null);
                    } else {
                      setIsAddingInventory(true);
                      setEditingInventoryId(null);
                      setInvFormName('');
                      setInvFormCategory('Pomada');
                      setInvFormStock(10);
                      setInvFormMinStock(3);
                      setInvFormUnit('unidades');
                      setInvFormCostPrice(0);
                    }
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold font-mono tracking-wide rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {isAddingInventory ? <X size={14} /> : <Plus size={14} />}
                  {isAddingInventory ? 'Cancelar' : 'Cadastrar Produto'}
                </button>
              </div>

              {/* Grid Workspace */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Product List Grid Column */}
                <div className={isAddingInventory || editingInventoryId ? 'lg:col-span-8' : 'lg:col-span-12'}>
                  {(() => {
                    const filteredItems = (activeBarbearia.inventory || []).filter(item => {
                      if (selectedInvCategoryFilter === 'Todos') return true;
                      return item.category === selectedInvCategoryFilter;
                    });

                    if (filteredItems.length === 0) {
                      return (
                        <div className="text-center py-16 bg-[#121215] rounded-3xl border border-dashed border-white/5 flex flex-col items-center justify-center space-y-3">
                          <Package className="w-12 h-12 text-gray-600 animate-pulse" />
                          <div className="space-y-1">
                            <h3 className="text-sm font-bold text-white">Nenhum produto encontrado</h3>
                            <p className="text-xs text-gray-500 font-mono">
                              {selectedInvCategoryFilter === 'Todos' 
                                ? 'Cadastre seu primeiro item de estoque clicando em "Cadastrar Produto".' 
                                : `Não há produtos cadastrados na categoria "${selectedInvCategoryFilter}".`}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredItems.map((item) => {
                          const isLow = item.stock <= item.minStock;
                          return (
                            <div 
                              key={item.id} 
                              className={`bg-[#121215] p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 ${
                                isLow ? 'border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.05)]' : 'border-white/5 hover:border-white/10'
                              }`}
                            >
                              {/* Header Card info */}
                              <div className="space-y-2.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-mono uppercase tracking-wider ${
                                    item.category === 'Pomada' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                                    item.category === 'Shampoo' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                    item.category === 'Lâmina' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                    'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                  }`}>
                                    {item.category}
                                  </span>

                                  {isLow && (
                                    <span className="flex items-center gap-1 text-[9px] font-mono text-amber-500 font-bold bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 animate-pulse">
                                      <AlertCircle size={10} /> Estoque Baixo
                                    </span>
                                  )}
                                </div>

                                <div>
                                  <h4 className="text-sm font-bold text-white line-clamp-1" title={item.name}>{item.name}</h4>
                                  <div className="flex justify-between text-[10px] font-mono text-gray-500 mt-1">
                                    <span>Custo: R$ {(item.costPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                    <span>Alerta em: {item.minStock} {item.unit}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Stock Display Counter */}
                              <div className="bg-[#18181C] p-4 rounded-2xl border border-white/5 flex items-center justify-between gap-4 font-sans">
                                <div className="space-y-0.5">
                                  <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest block font-medium">Quantidade</span>
                                  <span className="text-2xl font-extrabold text-white font-mono">
                                    {item.stock} <span className="text-xs font-normal text-gray-400 font-sans">{item.unit}</span>
                                  </span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleAdjustInventoryStock(item.id, -1)}
                                    title="Diminuir"
                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                  >
                                    <Minus size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleAdjustInventoryStock(item.id, 1)}
                                    title="Aumentar"
                                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/5 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                                  >
                                    <Plus size={14} />
                                  </button>
                                </div>
                              </div>

                              {/* Footer Actions */}
                              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-gray-500 font-mono">
                                <span>Ref: {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString('pt-BR') : 'Não atualizado'}</span>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setEditingInventoryId(item.id);
                                      setIsAddingInventory(true);
                                      setInvFormName(item.name);
                                      setInvFormCategory(item.category);
                                      setInvFormStock(item.stock);
                                      setInvFormMinStock(item.minStock);
                                      setInvFormUnit(item.unit);
                                      setInvFormCostPrice(item.costPrice || 0);
                                    }}
                                    className="p-1 text-gray-400 hover:text-amber-500 transition-colors cursor-pointer"
                                    title="Editar"
                                  >
                                    <Edit size={13} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInventoryItem(item.id)}
                                    className="p-1 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                                    title="Excluir"
                                  >
                                    <Trash size={13} />
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Form Column for Add / Edit */}
                {(isAddingInventory || editingInventoryId) && (
                  <div className="lg:col-span-4 bg-[#121215] p-6 rounded-3xl border border-white/5 space-y-6 h-fit">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-amber-500" />
                        {editingInventoryId ? 'Editar Produto' : 'Novo Produto'}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1">
                        {editingInventoryId ? 'Modifique os detalhes do produto selecionado.' : 'Adicione itens de consumo ou venda ao estoque.'}
                      </p>
                    </div>

                    <form onSubmit={handleSaveInventoryItem} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Nome do Produto</label>
                        <input
                          type="text"
                          required
                          value={invFormName}
                          onChange={(e) => setInvFormName(e.target.value)}
                          placeholder="Ex: Pomada Brilho Matte 150g"
                          className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Categoria</label>
                        <div className="grid grid-cols-2 gap-2">
                          {(['Pomada', 'Shampoo', 'Lâmina', 'Outros'] as const).map((cat) => {
                            const isSelected = invFormCategory === cat;
                            return (
                              <button
                                key={cat}
                                type="button"
                                onClick={() => setInvFormCategory(cat)}
                                className={`py-2 rounded-xl text-[10px] font-mono font-medium transition-all cursor-pointer text-center ${
                                  isSelected 
                                    ? 'bg-amber-500 text-black font-bold' 
                                    : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                                }`}
                              >
                                {cat}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Qtd Atual</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={invFormStock}
                            onChange={(e) => setInvFormStock(parseInt(e.target.value) || 0)}
                            className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Estoque Mínimo</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={invFormMinStock}
                            onChange={(e) => setInvFormMinStock(parseInt(e.target.value) || 0)}
                            className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Unidade de Medida</label>
                          <input
                            type="text"
                            required
                            value={invFormUnit}
                            onChange={(e) => setInvFormUnit(e.target.value)}
                            placeholder="Ex: unidades, ml"
                            className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Preço de Custo (R$)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            required
                            value={invFormCostPrice}
                            onChange={(e) => setInvFormCostPrice(parseFloat(e.target.value) || 0)}
                            className="w-full p-3 bg-[#131316] border border-white/5 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono"
                          />
                        </div>
                      </div>

                      <div className="pt-4 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setIsAddingInventory(false);
                            setEditingInventoryId(null);
                          }}
                          className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-300 font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="submit"
                          className="flex-1 py-3.5 rounded-xl bg-amber-500 text-black text-sm font-extrabold tracking-wide hover:bg-amber-400 transition-colors cursor-pointer"
                        >
                          Confirmar
                        </button>
                      </div>
                    </form>
                  </div>
                )}
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
                <div className="flex bg-[#131316] p-1 rounded-xl border border-white/5 mb-4">
                  <button
                    type="button"
                    onClick={() => setIsBlockSlotMode(false)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${!isBlockSlotMode ? 'bg-amber-500 text-black shadow-sm' : 'text-gray-400 hover:text-white'}`}
                  >
                    Novo Agendamento
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsBlockSlotMode(true)}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${isBlockSlotMode ? 'bg-rose-500 text-white shadow-sm' : 'text-gray-400 hover:text-white'}`}
                  >
                    Bloquear Horário
                  </button>
                </div>

                <div>
                  <label className="block text-xs font-mono text-gray-400 mb-1.5">PROFISSIONAL</label>
                  <select
                    value={modalBarberId}
                    onChange={(e) => setModalBarberId(e.target.value)}
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500"
                  >
                    {barbers.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.role})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5">DATA</label>
                    <input
                      type="date"
                      required
                      value={modalDate}
                      onChange={(e) => setModalDate(e.target.value)}
                      className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 focus:outline-none focus:border-amber-500 text-center font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-mono text-gray-400 mb-1.5">HORÁRIO</label>
                    <select
                      value={modalTime}
                      onChange={(e) => setModalTime(e.target.value)}
                      className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-amber-400 font-bold focus:outline-none focus:border-amber-500 text-center font-mono"
                    >
                      {initialAvailableHours.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {!isBlockSlotMode && (
                  <>
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
                  </>
                )}

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
                    className={`flex-1 py-3.5 rounded-xl text-sm font-extrabold tracking-wide transition-colors cursor-pointer ${
                      isBlockSlotMode ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-amber-500 text-black hover:bg-amber-400'
                    }`}
                  >
                    {isBlockSlotMode ? 'Confirmar Bloqueio' : 'Confirmar Reserva'}
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

      {/* ADD / EDIT SERVICE MODAL */}
      <AnimatePresence>
        {(isAddingService || isEditingService) && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setIsAddingService(false);
                setIsEditingService(null);
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
                  setIsAddingService(false);
                  setIsEditingService(null);
                }}
                className="absolute top-5 right-5 p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500 animate-pulse">
                  <Scissors className="w-4.5 h-4.5" />
                </div>
                <h3 className="text-lg font-bold text-white">
                  {isEditingService ? 'Editar Serviço' : 'Novo Serviço'}
                </h3>
              </div>

              <form onSubmit={handleSaveService} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Nome do Serviço</label>
                  <input
                    type="text"
                    required
                    value={serviceFormName}
                    onChange={(e) => setServiceFormName(e.target.value)}
                    placeholder="Ex: Corte Degradê Navalhado"
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Preço (R$)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={serviceFormPrice}
                      onChange={(e) => setServiceFormPrice(Number(e.target.value))}
                      placeholder="Ex: 50.00"
                      className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Duração (minutos)</label>
                    <input
                      type="number"
                      required
                      min="5"
                      step="5"
                      value={serviceFormDuration}
                      onChange={(e) => setServiceFormDuration(Number(e.target.value))}
                      placeholder="Ex: 30"
                      className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Categoria</label>
                  <div className="grid grid-cols-4 gap-2">
                    {(['Cabelo', 'Barba', 'Combo', 'Tratamento'] as const).map((cat) => {
                      const isSelected = serviceFormCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setServiceFormCategory(cat)}
                          className={`py-2 rounded-xl text-[10px] font-mono font-medium transition-all cursor-pointer text-center ${
                            isSelected 
                              ? 'bg-amber-500 text-black font-bold' 
                              : 'bg-white/5 hover:bg-white/10 text-gray-300 border border-white/5'
                          }`}
                        >
                          {cat}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Descrição (Opcional)</label>
                  <textarea
                    value={serviceFormDescription}
                    onChange={(e) => setServiceFormDescription(e.target.value)}
                    placeholder="Ex: Corte moderno focado nas linhas do rosto com finalização com pomada premium."
                    rows={3}
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80 resize-none"
                  />
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSavingConfig}
                    onClick={() => {
                      setIsAddingService(false);
                      setIsEditingService(null);
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

      {/* ADD CLIENT MODAL */}
      <AnimatePresence>
        {isAddClientModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddClientModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-[#0E0E10] border border-white/10 rounded-2xl p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">Adicionar Cliente</h3>
                  <p className="text-xs text-gray-400 mt-1">Adicione um novo cliente manualmente à sua base.</p>
                </div>
                <button 
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="p-2 text-gray-500 hover:text-white bg-white/5 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddClient} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">Nome Completo</label>
                  <input
                    type="text"
                    required
                    value={newClientName}
                    onChange={(e) => setNewClientName(e.target.value)}
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80"
                    placeholder="Ex: João da Silva"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">WhatsApp (Opcional)</label>
                  <input
                    type="tel"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80"
                    placeholder="Ex: (11) 99999-9999"
                  />
                </div>
                
                <div>
                  <label className="block text-[10px] font-mono text-gray-400 mb-1.5 uppercase tracking-wider font-semibold">E-mail (Opcional)</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    className="w-full p-3 bg-[#131316] border border-white/10 rounded-xl text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/80"
                    placeholder="Ex: joao@email.com"
                  />
                </div>

                <div className="pt-4 flex items-center gap-3">
                  <button
                    type="button"
                    disabled={isSavingClient}
                    onClick={() => setIsAddClientModalOpen(false)}
                    className="flex-1 py-3.5 rounded-xl bg-white/5 border border-white/5 text-sm text-gray-300 font-semibold hover:bg-white/10 transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingClient}
                    className="flex-1 py-3.5 rounded-xl bg-amber-500 text-black text-sm font-extrabold tracking-wide hover:bg-amber-400 transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isSavingClient ? 'Salvando...' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expanded Chart Modal */}
      <AnimatePresence>
        {isChartExpanded && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 lg:p-12">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChartExpanded(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-md"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-7xl h-[80vh] bg-[#121215] border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col shadow-2xl overflow-hidden"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">Faturamento & Receita Estimada (Detalhado)</h2>
                  <p className="text-gray-400 mt-2 font-light">Evolução do faturamento baseado nos serviços agendados.</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 bg-[#1a1a1f] p-1 rounded-xl">
                    <button
                      onClick={() => setChartPeriod('semanal')}
                      className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${chartPeriod === 'semanal' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Semanal
                    </button>
                    <button
                      onClick={() => setChartPeriod('mensal')}
                      className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${chartPeriod === 'mensal' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Mensal
                    </button>
                    <button
                      onClick={() => setChartPeriod('anual')}
                      className={`px-3 py-1.5 text-sm font-bold rounded-lg transition-colors ${chartPeriod === 'anual' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                    >
                      Anual
                    </button>
                  </div>

                  <button
                    onClick={() => setIsChartExpanded(false)}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors cursor-pointer"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              <div className="flex-1 w-full min-h-0">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#9ca3af" 
                      fontSize={14}
                      tickLine={false}
                      axisLine={false}
                      dy={15}
                    />
                    <YAxis 
                      stroke="#9ca3af" 
                      fontSize={14}
                      tickLine={false}
                      axisLine={false}
                      dx={-15}
                      tickFormatter={(val) => `R$${val}`}
                    />
                    <Tooltip content={<CustomTooltip prefix="R$ " />} cursor={{ stroke: '#ffffff20', strokeWidth: 2 }} />
                    <Line 
                      type="monotone" 
                      dataKey="receita" 
                      stroke="#f59e0b" 
                      strokeWidth={4}
                      dot={{ r: 6, fill: '#f59e0b', strokeWidth: 0 }}
                      activeDot={{ r: 8, fill: '#f59e0b', strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-xl shadow-2xl border ${
              toast.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
              toast.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
              'bg-blue-500/10 border-blue-500/30 text-blue-400'
            } backdrop-blur-md`}
          >
            {toast.type === 'success' && <Check className="w-5 h-5" />}
            {(toast.type === 'error' || toast.type === 'info') && <AlertCircle className="w-5 h-5" />}
            <span className="text-sm font-bold tracking-wide">{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:bg-white/10 p-1 rounded-lg transition-colors cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
