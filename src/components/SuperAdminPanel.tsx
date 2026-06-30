import React, { useState, useEffect } from 'react';
import { 
  Barbearia, 
  getAllBarbearias, 
  updateBarbearia, 
  deleteBarbearia, 
  parseBarbeariaPlan, 
  serializeBarbeariaPlan, 
  getRemainingDays,
  BarbeariaPlanInfo,
  logoutBarbearia,
  createSuperAdminLog,
  getSuperAdminLogs
} from '../lib/db';
import { SuperAdminLog } from '../types';
import { 
  ShieldAlert, 
  ArrowLeft, 
  Search, 
  Building2, 
  Users, 
  LogOut, 
  Calendar, 
  ShieldCheck, 
  Edit2, 
  Trash2, 
  X, 
  Check, 
  Clock, 
  AlertTriangle, 
  Pause, 
  Sparkles,
  Info,
  History,
  FileText,
  TrendingUp,
  Target,
  DollarSign,
  Award,
  Settings2,
  Activity,
  ArrowUpRight,
  BarChart3,
  Sliders,
  Zap,
  Megaphone,
  Percent,
  Download,
  Calculator
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BarbeariaTableSkeleton } from './LoadingSkeleton';

export default function SuperAdminPanel({ onBack }: { onBack: () => void }) {
  const [barbearias, setBarbearias] = useState<Barbearia[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [selectedBarbearia, setSelectedBarbearia] = useState<Barbearia | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editPlanName, setEditPlanName] = useState<'Standard' | 'Pro Flow' | 'Black Elite'>('Standard');
  const [editPlanStatus, setEditPlanStatus] = useState<'trial' | 'active' | 'suspended' | 'expired'>('trial');
  const [editTrialEndsAt, setEditTrialEndsAt] = useState('');
  const [editPlanEndsAt, setEditPlanEndsAt] = useState('');
  const [editIsOnboarded, setEditIsOnboarded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Logs state
  const [activeTab, setActiveTab] = useState<'barbearias' | 'logs' | 'metrics' | 'tools'>('barbearias');
  const [logs, setLogs] = useState<SuperAdminLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logSearchTerm, setLogSearchTerm] = useState('');
  const [logActionFilter, setLogActionFilter] = useState('all');

  // Configurable Goals State (with localStorage persistence)
  const [targetConversionRate, setTargetConversionRate] = useState<number>(() => {
    const saved = localStorage.getItem('saas_target_conversion_rate');
    return saved ? parseFloat(saved) : 30; // default 30% conversion target
  });
  const [targetMRR, setTargetMRR] = useState<number>(() => {
    const saved = localStorage.getItem('saas_target_mrr');
    return saved ? parseInt(saved) : 5000; // default 5,000 BRL target
  });
  const [dailyRegGoal, setDailyRegGoal] = useState<number>(() => {
    const saved = localStorage.getItem('saas_daily_reg_goal');
    return saved ? parseInt(saved) : 5; // default 5 daily registrations
  });

  // Pricing Simulator State
  const [simStandardPrice, setSimStandardPrice] = useState<number>(34.90);
  const [simProPrice, setSimProPrice] = useState<number>(54.90);
  const [simBlackPrice, setSimBlackPrice] = useState<number>(74.90);

  // SaaS Revenue & Subscriber Calculator States
  const [calcMode, setCalcMode] = useState<'target' | 'volume'>('target');
  const [calcTargetMRR, setCalcTargetMRR] = useState<number>(15000);
  const [calcPreset, setCalcPreset] = useState<'balanced' | 'volume_heavy' | 'pro_heavy' | 'premium_heavy'>('balanced');
  const [calcStandardSubs, setCalcStandardSubs] = useState<number>(100);
  const [calcProSubs, setCalcProSubs] = useState<number>(60);
  const [calcBlackSubs, setCalcBlackSubs] = useState<number>(30);

  // Editable Input States for Goal Settings
  const [goalConvInput, setGoalConvInput] = useState<string>(targetConversionRate.toString());
  const [goalMRRInput, setGoalMRRInput] = useState<string>(targetMRR.toString());
  const [goalRegInput, setGoalRegInput] = useState<string>(dailyRegGoal.toString());

  // Tools & Control Deck States
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastContent, setBroadcastContent] = useState('');
  const [broadcastType, setBroadcastType] = useState<'info' | 'warning' | 'success' | 'danger'>('info');
  const [broadcastTarget, setBroadcastTarget] = useState<string>('all');
  const [broadcasts, setBroadcasts] = useState<any[]>([]);

  const [voucherCode, setVoucherCode] = useState('');
  const [voucherType, setVoucherType] = useState<'extend_trial' | 'activate_plan'>('extend_trial');
  const [voucherValue, setVoucherValue] = useState<number>(30);
  const [voucherPlanTarget, setVoucherPlanTarget] = useState<string>('all');
  const [vouchers, setVouchers] = useState<any[]>([]);
  const [isGeneratingSandbox, setIsGeneratingSandbox] = useState(false);

  useEffect(() => {
    setGoalConvInput(targetConversionRate.toString());
    setGoalMRRInput(targetMRR.toString());
    setGoalRegInput(dailyRegGoal.toString());
  }, [targetConversionRate, targetMRR, dailyRegGoal]);

  useEffect(() => {
    let channel: any = null;

    async function checkAuth() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.email === 'barbersflowbr@gmail.com') {
        setIsAuthorized(true);
        loadData();

        // Subscribe to real-time changes in the 'barbearias' table
        // Clean up any existing channel with this name first to prevent duplicate subscription errors
        supabase.removeChannel(supabase.channel('super-admin-barbearias-realtime'));
        
        channel = supabase
          .channel('super-admin-barbearias-realtime')
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'barbearias'
            },
            () => {
              // Fetch latest data silently to keep metrics updated in real-time
              getAllBarbearias().then(data => {
                if (data) {
                  setBarbearias(data);
                }
              });
            }
          )
          .subscribe();
      } else {
        setIsAuthorized(false);
      }
      setAuthChecking(false);
    }
    
    checkAuth();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  async function loadData() {
    setIsLoading(true);
    try {
      const data = await getAllBarbearias();
      setBarbearias(data || []);
    } catch (error) {
      console.error('Error loading barbearias:', error);
      showToast('Erro ao carregar barbearias.', 'error');
    } finally {
      setIsLoading(false);
    }
  }

  async function loadLogs() {
    setLogsLoading(true);
    try {
      const data = await getSuperAdminLogs();
      setLogs(data);
    } catch (err) {
      console.error('Error loading logs:', err);
      showToast('Erro ao carregar os logs de auditoria.', 'error');
    } finally {
      setLogsLoading(false);
    }
  }

  const loadToolsData = () => {
    try {
      const bData = localStorage.getItem('saas_broadcasts');
      setBroadcasts(bData ? JSON.parse(bData) : []);

      const vData = localStorage.getItem('saas_promo_vouchers');
      setVouchers(vData ? JSON.parse(vData) : [
        {
          id: '1',
          code: 'FLOW7DIAS',
          type: 'extend_trial',
          value: 7,
          planTarget: 'all',
          maxUses: 100,
          usedCount: 12,
          active: true,
          expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          code: 'PROFLOW30',
          type: 'activate_plan',
          value: 30,
          planTarget: 'Pro Flow',
          maxUses: 50,
          usedCount: 3,
          active: true,
          expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          code: 'VIPBLACK',
          type: 'activate_plan',
          value: 30,
          planTarget: 'Black Elite',
          maxUses: 10,
          usedCount: 0,
          active: true,
          expiresAt: new Date(new Date().getTime() + 45 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]);
    } catch (e) {
      console.warn('Error loading tools database:', e);
    }
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      loadLogs();
    }
    if (activeTab === 'tools') {
      loadToolsData();
    }
  }, [activeTab]);

  const handleAddBroadcast = () => {
    if (!broadcastTitle.trim() || !broadcastContent.trim()) {
      showToast('Por favor, preencha o título e o conteúdo do comunicado.', 'error');
      return;
    }

    const newBroadcast = {
      id: crypto.randomUUID(),
      title: broadcastTitle,
      content: broadcastContent,
      type: broadcastType,
      target: broadcastTarget,
      active: true,
      createdAt: new Date().toISOString()
    };

    const updatedList = [newBroadcast, ...broadcasts];
    localStorage.setItem('saas_broadcasts', JSON.stringify(updatedList));
    setBroadcasts(updatedList);

    // Auditoria
    createSuperAdminLog({
      action: 'Comunicado Global',
      details: `Criou comunicado: "${broadcastTitle}" para planos: ${broadcastTarget}`,
      performedBy: 'superadmin'
    });

    setBroadcastTitle('');
    setBroadcastContent('');
    showToast('Comunicado enviado e publicado com sucesso!', 'success');
  };

  const handleToggleBroadcast = (id: string) => {
    const updated = broadcasts.map((b: any) => b.id === id ? { ...b, active: !b.active } : b);
    localStorage.setItem('saas_broadcasts', JSON.stringify(updated));
    setBroadcasts(updated);
    showToast('Status do comunicado atualizado!', 'success');
  };

  const handleDeleteBroadcast = (id: string) => {
    const filtered = broadcasts.filter((b: any) => b.id !== id);
    localStorage.setItem('saas_broadcasts', JSON.stringify(filtered));
    setBroadcasts(filtered);
    showToast('Comunicado excluído.', 'success');
  };

  const handleAddVoucher = () => {
    const codeClean = voucherCode.trim().toUpperCase();
    if (!codeClean) {
      showToast('Preencha o código do cupom.', 'error');
      return;
    }

    if (vouchers.some((v: any) => v.code === codeClean)) {
      showToast('Este cupom já existe!', 'error');
      return;
    }

    const newVoucher = {
      id: crypto.randomUUID(),
      code: codeClean,
      type: voucherType,
      value: voucherValue,
      planTarget: voucherPlanTarget,
      maxUses: 100,
      usedCount: 0,
      active: true,
      expiresAt: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };

    const updated = [newVoucher, ...vouchers];
    localStorage.setItem('saas_promo_vouchers', JSON.stringify(updated));
    setVouchers(updated);

    createSuperAdminLog({
      action: 'Criar Cupom',
      details: `Criou cupom: "${codeClean}" (${voucherType === 'extend_trial' ? 'Teste +' + voucherValue + 'd' : 'Ativação ' + voucherPlanTarget})`,
      performedBy: 'superadmin'
    });

    setVoucherCode('');
    showToast('Cupom criado com sucesso!', 'success');
  };

  const handleToggleVoucher = (id: string) => {
    const updated = vouchers.map((v: any) => v.id === id ? { ...v, active: !v.active } : v);
    localStorage.setItem('saas_promo_vouchers', JSON.stringify(updated));
    setVouchers(updated);
    showToast('Status do cupom atualizado!', 'success');
  };

  const handleDeleteVoucher = (id: string) => {
    const filtered = vouchers.filter((v: any) => v.id !== id);
    localStorage.setItem('saas_promo_vouchers', JSON.stringify(filtered));
    setVouchers(filtered);
    showToast('Cupom excluído.', 'success');
  };

  const handleGenerateSandbox = async () => {
    setIsGeneratingSandbox(true);
    let createdCount = 0;
    try {
      const dummyShops = [
        { name: '💈 Confraria do Bigode', slug: 'confraria-bigode', planName: 'Pro Flow', status: 'active', email: 'confraria@example.com' },
        { name: '✂️ Corte de Elite Premium', slug: 'corte-elite', planName: 'Black Elite', status: 'active', email: 'elite@example.com' },
        { name: '🌱 Vintage Club Barbearia', slug: 'vintage-club', planName: 'Standard', status: 'trial', email: 'vintage@example.com' },
        { name: '👑 Barbearia Dom Pedro', slug: 'dom-pedro', planName: 'Pro Flow', status: 'active', email: 'pedro@example.com' },
        { name: '🔥 Navalha de Ouro Express', slug: 'navalha-ouro', planName: 'Black Elite', status: 'active', email: 'ouro@example.com' }
      ];

      for (const shop of dummyShops) {
        const uniqueSlug = `${shop.slug}-${Math.floor(Math.random() * 9000 + 1000)}`;
        const planInfo = {
          name: shop.planName,
          status: shop.status,
          planEndsAt: shop.status === 'active' ? new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString() : undefined,
          trialEndsAt: shop.status === 'trial' ? new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000).toISOString() : undefined,
        };

        const newBarbearia = {
          id: crypto.randomUUID(),
          name: shop.name,
          email: shop.email,
          slug: uniqueSlug,
          plan: JSON.stringify(planInfo),
          isOnboarded: true,
          barbers: [
            { id: 'b1', name: 'Carlos Master', phone: '11999999999', bio: 'Navalha e barba de respeito.', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop', available: true },
            { id: 'b2', name: 'Felipe Barber', phone: '11988888888', bio: 'Cortes degradê e modernos.', avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=100&h=100&fit=crop', available: true }
          ],
          services: [
            { id: 's1', name: 'Corte Tradicional', price: 40, duration: 30, category: 'Cabelo', description: 'Corte tradicional com tesoura e máquina.' },
            { id: 's2', name: 'Barba de Toalha Quente', price: 30, duration: 20, category: 'Barba', description: 'Barba clássica com espuma e toalha.' }
          ],
          createdAt: new Date().toISOString()
        };

        const { error } = await supabase.from('barbearias').insert(newBarbearia);
        if (!error) {
          createdCount++;
        }
      }

      await createSuperAdminLog({
        action: 'Massa / Sandbox',
        details: `Iniciou 5 barbearias de simulação no sistema.`,
        performedBy: 'superadmin'
      });

      showToast(`Sandbox inicializado! ${createdCount} lojas de simulação adicionadas com sucesso.`, 'success');
      
      const data = await getAllBarbearias();
      setBarbearias(data || []);
    } catch (e: any) {
      showToast(`Erro ao inicializar sandbox: ${e.message}`, 'error');
    } finally {
      setIsGeneratingSandbox(false);
    }
  };

  const handlePurgeSandbox = async () => {
    if (!window.confirm('Atenção: Isso irá deletar permanentemente todas as 5 lojas de simulação (emails contendo @example.com). Confirmar?')) return;
    setIsGeneratingSandbox(true);
    try {
      const { data, error } = await supabase.from('barbearias').select('id, name').like('email', '%@example.com');
      if (error) throw error;

      if (!data || data.length === 0) {
        showToast('Nenhuma loja de simulação sandbox encontrada no banco.', 'error');
        return;
      }

      let deletedCount = 0;
      for (const shop of data) {
        const { error: delErr } = await supabase.from('barbearias').delete().eq('id', shop.id);
        if (!delErr) deletedCount++;
      }

      await createSuperAdminLog({
        action: 'Massa / Limpeza',
        details: `Deletou ${deletedCount} lojas de simulação do banco.`,
        performedBy: 'superadmin'
      });

      showToast(`Limpeza concluída! ${deletedCount} barbearias sandbox removidas do sistema.`, 'success');
      
      const latestData = await getAllBarbearias();
      setBarbearias(latestData || []);
    } catch (e: any) {
      showToast(`Erro ao limpar sandbox: ${e.message}`, 'error');
    } finally {
      setIsGeneratingSandbox(false);
    }
  };

  const handleExportCSVReport = () => {
    try {
      let csvContent = "data:text/csv;charset=utf-8,";
      csvContent += "ID,Nome da Barbearia,Email de Cadastro,Slug PWA,Plano Ativo,Status da Assinatura,Data de Cadastro\n";

      barbearias.forEach(b => {
        const planInfo = parseBarbeariaPlan(b.plan);
        const row = [
          b.id,
          b.name.replace(/,/g, ' '),
          b.email,
          b.slug,
          planInfo.name,
          planInfo.status,
          b.createdAt ? new Date(b.createdAt).toLocaleDateString('pt-BR') : 'N/A'
        ].join(",");
        csvContent += row + "\n";
      });

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `Relatorio_Consolidado_SaaS_${new Date().toISOString().substring(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Relatório consolidado CSV exportado com sucesso!', 'success');
    } catch (e) {
      showToast('Erro ao exportar relatório.', 'error');
    }
  };

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleSaveGoals = (conv: number, mrr: number, reg: number) => {
    localStorage.setItem('saas_target_conversion_rate', conv.toString());
    localStorage.setItem('saas_target_mrr', mrr.toString());
    localStorage.setItem('saas_daily_reg_goal', reg.toString());
    setTargetConversionRate(conv);
    setTargetMRR(mrr);
    setDailyRegGoal(reg);
    showToast('Metas e conversões salvas com sucesso!', 'success');
  };

  const handleOpenManageModal = (b: Barbearia) => {
    const planInfo = parseBarbeariaPlan(b.plan);
    setSelectedBarbearia(b);
    setEditPlanName(planInfo.name as any || 'Standard');
    setEditPlanStatus(planInfo.status || 'trial');
    
    // Format dates for date input (YYYY-MM-DD)
    const formatToDateInput = (isoStr?: string) => {
      if (!isoStr) return '';
      try {
        return new Date(isoStr).toISOString().substring(0, 10);
      } catch {
        return '';
      }
    };

    setEditTrialEndsAt(formatToDateInput(planInfo.trialEndsAt));
    setEditPlanEndsAt(formatToDateInput(planInfo.planEndsAt));
    setEditIsOnboarded(!!b.isOnboarded);
    setIsModalOpen(true);
  };

  const handleSavePlan = async () => {
    if (!selectedBarbearia) return;
    setIsSaving(true);
    try {
      // Calculate changes for logs
      const oldPlanInfo = parseBarbeariaPlan(selectedBarbearia.plan);
      const changes: string[] = [];
      let isPlanChange = false;
      let isStatusChange = false;
      let isExpirationChange = false;
      let isOnboardingToggle = false;

      if (oldPlanInfo.name !== editPlanName) {
        changes.push(`Plano alterado de "${oldPlanInfo.name}" para "${editPlanName}"`);
        isPlanChange = true;
      }
      if (oldPlanInfo.status !== editPlanStatus) {
        changes.push(`Status alterado de "${oldPlanInfo.status}" para "${editPlanStatus}"`);
        isStatusChange = true;
      }
      const oldTrialEnds = oldPlanInfo.trialEndsAt ? new Date(oldPlanInfo.trialEndsAt).toLocaleDateString('pt-BR') : 'Nenhuma';
      const newTrialEnds = editTrialEndsAt ? new Date(editTrialEndsAt + 'T23:59:59').toLocaleDateString('pt-BR') : 'Nenhuma';
      if (oldTrialEnds !== newTrialEnds && editPlanStatus === 'trial') {
        changes.push(`Expiração do teste alterada de "${oldTrialEnds}" para "${newTrialEnds}"`);
        isExpirationChange = true;
      }
      const oldPlanEnds = oldPlanInfo.planEndsAt ? new Date(oldPlanInfo.planEndsAt).toLocaleDateString('pt-BR') : 'Nenhuma';
      const newPlanEnds = editPlanEndsAt ? new Date(editPlanEndsAt + 'T23:59:59').toLocaleDateString('pt-BR') : 'Nenhuma';
      if (oldPlanEnds !== newPlanEnds && editPlanStatus === 'active') {
        changes.push(`Vencimento da assinatura alterado de "${oldPlanEnds}" para "${newPlanEnds}"`);
        isExpirationChange = true;
      }
      if (!!selectedBarbearia.isOnboarded !== editIsOnboarded) {
        changes.push(`Onboarding alterado de "${selectedBarbearia.isOnboarded ? 'Concluído' : 'Pendente'}" para "${editIsOnboarded ? 'Concluído' : 'Pendente'}"`);
        isOnboardingToggle = true;
      }

      const details = changes.length > 0 ? changes.join('; ') : 'Configurações salvas sem alterações de valores.';
      let action = 'settings_update';
      if (isStatusChange) action = 'status_change';
      else if (isPlanChange) action = 'plan_change';
      else if (isExpirationChange) action = 'expiration_change';
      else if (isOnboardingToggle) action = 'onboarding_toggle';

      // Build serialized plan info
      const planInfo: BarbeariaPlanInfo = {
        name: editPlanName,
        status: editPlanStatus,
        trialEndsAt: editTrialEndsAt ? new Date(editTrialEndsAt + 'T23:59:59').toISOString() : undefined,
        planEndsAt: editPlanEndsAt ? new Date(editPlanEndsAt + 'T23:59:59').toISOString() : undefined,
      };

      await updateBarbearia(selectedBarbearia.id, {
        plan: serializeBarbeariaPlan(planInfo),
        isOnboarded: editIsOnboarded
      });

      // Insert Log
      await createSuperAdminLog({
        barbeariaId: selectedBarbearia.id,
        barbeariaName: selectedBarbearia.name,
        action,
        details,
        performedBy: 'Super Admin'
      });

      showToast('Configurações salvas com sucesso!', 'success');
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      console.error('Error updating plan:', err);
      showToast('Erro ao salvar configurações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTrialDays = (days: number) => {
    const baseDate = editTrialEndsAt ? new Date(editTrialEndsAt + 'T12:00:00') : new Date();
    baseDate.setDate(baseDate.getDate() + days);
    setEditTrialEndsAt(baseDate.toISOString().substring(0, 10));
  };

  const handleDelete = async (b: Barbearia) => {
    if (!confirm(`ATENÇÃO CRÍTICA!\n\nVocê tem certeza que deseja EXCLUIR permanentemente a barbearia "${b.name}"? Isso excluirá todos os profissionais, serviços e agendamentos vinculados a ela. Esta operação não pode ser desfeita.`)) return;
    if (!confirm(`Confirmação final: Digite "SIM" para excluir permanentemente a conta de ${b.email}`)) return;
    
    const shopName = b.name;
    const shopEmail = b.email;
    const shopId = b.id;

    try {
      await deleteBarbearia(shopId);

      // Log Deletion
      await createSuperAdminLog({
        barbeariaId: null,
        barbeariaName: shopName,
        action: 'barbearia_delete',
        details: `Exclusão permanente da barbearia "${shopName}" (${shopEmail})`,
        performedBy: 'Super Admin'
      });

      showToast('Barbearia excluída com sucesso!', 'success');
      loadData();
    } catch (err: any) {
      console.error('Error deleting barbearia:', err);
      showToast('Erro ao excluir barbearia: ' + err.message, 'error');
    }
  };

  const filteredBarbearias = barbearias.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Statistics summaries
  const totalShops = barbearias.length;
  const activeShops = barbearias.filter(b => b.isOnboarded).length;
  const trialShops = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.status === 'trial';
  }).length;
  const suspendedShops = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.status === 'suspended';
  }).length;

  // Plan types count
  const standardCount = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.name === 'Standard' || (!planInfo.name);
  }).length;
  const proCount = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.name === 'Pro Flow';
  }).length;
  const blackCount = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.name === 'Black Elite';
  }).length;

  const paidActiveCount = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.status === 'active';
  }).length;

  // Active paid plan types count (status === 'active')
  const activeStandardCount = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.status === 'active' && (planInfo.name === 'Standard' || !planInfo.name);
  }).length;
  const activeProCount = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.status === 'active' && planInfo.name === 'Pro Flow';
  }).length;
  const activeBlackCount = barbearias.filter(b => {
    const planInfo = parseBarbeariaPlan(b.plan);
    return planInfo.status === 'active' && planInfo.name === 'Black Elite';
  }).length;

  // Monthly Recurring Revenue (MRR) - Standard=34.90, Pro=54.90, Black=74.90
  const calculatedMRR = barbearias.reduce((total, b) => {
    const planInfo = parseBarbeariaPlan(b.plan);
    if (planInfo.status === 'active') {
      if (planInfo.name === 'Black Elite') return total + 74.90;
      if (planInfo.name === 'Pro Flow') return total + 54.90;
      return total + 34.90; // Default Standard active
    }
    return total;
  }, 0);

  // Conversion rate (active paid plans / total registered)
  const currentConversionRate = totalShops > 0 ? (paidActiveCount / totalShops) * 100 : 0;

  // Daily registrations
  const registeredToday = barbearias.filter(b => {
    if (!b.createdAt) return false;
    const createdDate = new Date(b.createdAt).toLocaleDateString('pt-BR');
    const todayDate = new Date().toLocaleDateString('pt-BR');
    return createdDate === todayDate;
  }).length;

  const registeredThisWeek = barbearias.filter(b => {
    if (!b.createdAt) return false;
    const createdTime = new Date(b.createdAt).getTime();
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return createdTime >= oneWeekAgo;
  }).length;

  // Top 5 Performing Shops (by number of barbers + services + onboarded status)
  const topShops = [...barbearias]
    .map(b => {
      const barbersCount = b.barbers?.length || 0;
      const servicesCount = b.services?.length || 0;
      const score = barbersCount * 2 + servicesCount;
      return { ...b, barbersCount, servicesCount, score };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  if (authChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
        <p className="text-gray-600 mb-6 text-center max-w-md">
          Você não tem permissão para acessar o painel de administração global. 
          Faça login com a conta de super administrador.
        </p>
        <button 
          onClick={onBack}
          className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
        >
          Voltar para a página inicial
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-4 md:p-8 relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border text-sm font-semibold animate-bounce ${
          toast.type === 'success' 
            ? 'bg-[#10b981] border-emerald-400 text-white shadow-emerald-500/10' 
            : 'bg-[#ef4444] border-red-400 text-white shadow-red-500/10'
        }`}>
          {toast.type === 'success' ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
          <span>{toast.text}</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center">
            <button onClick={onBack} className="mr-4 p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3 text-gray-900">
                <ShieldAlert className="w-8 h-8 text-amber-500" />
                Super Admin
              </h1>
              <p className="text-gray-500 mt-1">Controle de Planos, Trials, Ativação e Gestão Global SaaS</p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <button 
              onClick={async () => {
                await logoutBarbearia();
                onBack();
              }}
              className="bg-white px-4 py-2 border border-gray-200 rounded-lg shadow-sm flex items-center gap-2 hover:bg-gray-50 text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium text-sm">Sair</span>
            </button>
          </div>
        </div>

        {/* Dynamic Metric Summaries */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Total de Lojas</p>
              <p className="text-2xl font-bold text-gray-900">{totalShops}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Onboarding Concluído</p>
              <p className="text-2xl font-bold text-gray-900">{activeShops}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Em Período de Teste</p>
              <p className="text-2xl font-bold text-gray-900">{trialShops}</p>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-red-500">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Contas Suspensas</p>
              <p className="text-2xl font-bold text-gray-900">{suspendedShops}</p>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab('barbearias')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'barbearias'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              <span>Gerenciar Lojas</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'logs'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <History className="w-4 h-4" />
              <span>Histórico de Auditoria</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'metrics'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              <span>Métricas & Metas SaaS</span>
            </div>
          </button>
          <button
            onClick={() => setActiveTab('tools')}
            className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tools'
                ? 'border-amber-500 text-amber-600'
                : 'border-transparent text-gray-500 hover:text-gray-900 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4" />
              <span>Painel de Ferramentas</span>
            </div>
          </button>
        </div>

        {activeTab === 'barbearias' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-500" />
                Barbearias Cadastradas
              </h2>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar barbearia..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                />
              </div>
            </div>
            
            {isLoading ? (
              <BarbeariaTableSkeleton />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Barbearia / Contato</th>
                      <th className="px-6 py-4 font-medium">Slug (Link)</th>
                      <th className="px-6 py-4 font-medium">Plano / Categoria</th>
                      <th className="px-6 py-4 font-medium">Controle de Uso & Teste</th>
                      <th className="px-6 py-4 font-medium">Status do Sistema</th>
                      <th className="px-6 py-4 font-medium">Métricas</th>
                      <th className="px-6 py-4 font-medium">Cadastro</th>
                      <th className="px-6 py-4 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredBarbearias.map((b) => {
                      const planInfo = parseBarbeariaPlan(b.plan);
                      const remDays = getRemainingDays(planInfo.trialEndsAt);
                      
                      return (
                        <tr key={b.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-semibold text-gray-900">{b.name}</div>
                            <div className="text-gray-500 text-xs mt-0.5">{b.email}</div>
                          </td>
                          <td className="px-6 py-4">
                            <a href={`/${b.slug}`} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline font-medium">
                              /{b.slug}
                            </a>
                          </td>
                          <td className="px-6 py-4">
                            {planInfo.name === 'Black Elite' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20 shadow-[0_0_8px_rgba(168,85,247,0.1)] whitespace-nowrap">
                                👑 Black Elite
                              </span>
                            ) : planInfo.name === 'Pro Flow' ? (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.1)] whitespace-nowrap">
                                ✨ Pro Flow
                              </span>
                            ) : (
                              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-500/10 text-slate-700 border border-slate-500/20 whitespace-nowrap">
                                💈 Standard
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {planInfo.status === 'trial' ? (
                              <div className="flex flex-col gap-1.5">
                                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 text-[11px] font-bold border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)] self-start whitespace-nowrap">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span>
                                  </span>
                                  <span>Em Teste</span>
                                </span>
                                <span className="text-xs text-gray-500 font-medium pl-1">
                                  {remDays > 0 ? `${remDays} dias restantes` : 'Expirado hoje'}
                                </span>
                              </div>
                            ) : planInfo.status === 'active' ? (
                              <div className="flex flex-col gap-1.5">
                                <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.15)] self-start whitespace-nowrap">
                                  <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]"></span>
                                  </span>
                                  <span>Assinatura Ativa</span>
                                </span>
                                {planInfo.planEndsAt && (
                                  <span className="text-[10px] text-gray-400 font-medium pl-1">Expira em: {new Date(planInfo.planEndsAt).toLocaleDateString('pt-BR')}</span>
                                )}
                              </div>
                            ) : planInfo.status === 'suspended' ? (
                              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-600 text-[11px] font-bold border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.1)] self-start whitespace-nowrap">
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]"></span>
                                </span>
                                <span>Suspenso</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 text-[11px] font-bold border border-rose-500/20 shadow-[0_0_10px_rgba(244,63,94,0.1)] self-start whitespace-nowrap">
                                <span className="relative flex h-2 w-2">
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]"></span>
                                </span>
                                <span>Expirado / Inativo</span>
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            {b.isOnboarded ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] animate-pulse"></span>
                                Ativo
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-zinc-500/10 text-zinc-500 border border-zinc-500/20 whitespace-nowrap">
                                <span className="w-1.5 h-1.5 rounded-full bg-zinc-400"></span>
                                Pendente
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-3 text-xs text-gray-600">
                              <span title="Profissionais">💈 {b.barbers?.length || 0}</span>
                              <span title="Serviços">✂️ {b.services?.length || 0}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-gray-500 text-xs">
                            {b.createdAt ? new Date(b.createdAt).toLocaleDateString('pt-BR') : 'Desconhecida'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenManageModal(b)}
                                className="p-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                                title="Gerenciar Plano & Uso"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(b)}
                                className="p-1.5 bg-white border border-gray-200 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors cursor-pointer"
                                title="Excluir Barbearia"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {filteredBarbearias.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                          Nenhuma barbearia encontrada.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gray-50/50">
              <div>
                <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900">
                  <FileText className="w-5 h-5 text-gray-500" />
                  Rastreamento de Atividades (SaaS Logs)
                </h2>
                <p className="text-xs text-gray-500 mt-1">Histórico completo de alterações de status, expirações de teste e exclusões de contas.</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Action Filter */}
                <select
                  value={logActionFilter}
                  onChange={(e) => setLogActionFilter(e.target.value)}
                  className="px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white outline-none focus:ring-2 focus:ring-amber-500 font-medium"
                >
                  <option value="all">Todas as Ações</option>
                  <option value="plan_change">Alteração de Plano</option>
                  <option value="status_change">Alteração de Status</option>
                  <option value="expiration_change">Expiração / Prazos</option>
                  <option value="onboarding_toggle">Onboarding</option>
                  <option value="barbearia_delete">Exclusão de Barbearia</option>
                </select>

                {/* Log Search Input */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Buscar barbearia ou detalhes..."
                    value={logSearchTerm}
                    onChange={(e) => setLogSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {logsLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto mb-4"></div>
                <p className="text-sm text-gray-500">Buscando histórico de auditoria...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-4 font-medium">Data / Hora</th>
                      <th className="px-6 py-4 font-medium">Barbearia</th>
                      <th className="px-6 py-4 font-medium">Ação</th>
                      <th className="px-6 py-4 font-medium">Detalhes da Alteração</th>
                      <th className="px-6 py-4 font-medium">Responsável</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(() => {
                      const filtered = logs.filter(log => {
                        const matchesSearch = 
                          (log.barbeariaName || '').toLowerCase().includes(logSearchTerm.toLowerCase()) ||
                          (log.details || '').toLowerCase().includes(logSearchTerm.toLowerCase());
                        const matchesAction = logActionFilter === 'all' || log.action === logActionFilter;
                        return matchesSearch && matchesAction;
                      });

                      if (filtered.length === 0) {
                        return (
                          <tr>
                            <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                              Nenhum log de auditoria encontrado para os filtros selecionados.
                            </td>
                          </tr>
                        );
                      }

                      return filtered.map((log, index) => {
                        // Badge formatting for action type
                        let actionBadge = (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200">
                            {log.action}
                          </span>
                        );

                        if (log.action === 'plan_change') {
                          actionBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                              Plano Alterado
                            </span>
                          );
                        } else if (log.action === 'status_change') {
                          actionBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                              Status Alterado
                            </span>
                          );
                        } else if (log.action === 'expiration_change') {
                          actionBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100">
                              Prazo Alterado
                            </span>
                          );
                        } else if (log.action === 'onboarding_toggle') {
                          actionBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                              Onboarding
                            </span>
                          );
                        } else if (log.action === 'barbearia_delete') {
                          actionBadge = (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-100">
                              Exclusão Conta
                            </span>
                          );
                        }

                        return (
                          <tr key={log.id || index} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">
                              {log.createdAt ? new Date(log.createdAt).toLocaleString('pt-BR') : 'Desconhecida'}
                            </td>
                            <td className="px-6 py-4 font-semibold text-gray-900">
                              {log.barbeariaName || (
                                <span className="text-gray-400 font-normal italic">Deletada do Sistema</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {actionBadge}
                            </td>
                            <td className="px-6 py-4 text-gray-600 font-medium">
                              {log.details}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-gray-500">
                              {log.performedBy || 'Super Admin'}
                            </td>
                          </tr>
                        );
                      });
                    })()}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-8">
            {/* Top Row: Business metrics with goal progress */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Card 1: MRR with progress */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                      <DollarSign className="w-6 h-6" />
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase font-mono">
                      MRR SaaS
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider font-mono">
                    Faturamento Estimado
                  </h3>
                  <p className="text-3xl font-black text-gray-900 mt-1">
                    R$ {calculatedMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Progresso da Meta (R$ {targetMRR.toLocaleString('pt-BR')})</span>
                    <span className="font-bold text-emerald-600">
                      {Math.min(100, Math.round((calculatedMRR / targetMRR) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200/50">
                    <div 
                      className="bg-emerald-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
                      style={{ width: `${Math.min(100, (calculatedMRR / targetMRR) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card 2: Conversion Rate with progress */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                      <TrendingUp className="w-6 h-6" />
                    </span>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100 uppercase font-mono">
                      Conversão
                    </span>
                  </div>
                  <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider font-mono">
                    Taxa de Conversão SaaS
                  </h3>
                  <p className="text-3xl font-black text-gray-900 mt-1">
                    {currentConversionRate.toFixed(1)}%
                  </p>
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Meta de Conversão ({targetConversionRate}%)</span>
                    <span className="font-bold text-purple-600">
                      {Math.min(100, Math.round((currentConversionRate / targetConversionRate) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200/50">
                    <div 
                      className="bg-purple-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(168,85,247,0.4)]"
                      style={{ width: `${Math.min(100, (currentConversionRate / targetConversionRate) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Card 3: Daily Registration Progress */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                      <Zap className="w-6 h-6" />
                    </span>
                    {registeredToday >= dailyRegGoal ? (
                      <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        🏆 Meta Batida!
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-100 uppercase font-mono">
                        Diário
                      </span>
                    )}
                  </div>
                  <h3 className="text-gray-500 text-xs font-semibold uppercase tracking-wider font-mono">
                    Cadastros Hoje
                  </h3>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-3xl font-black text-gray-900">
                      {registeredToday}
                    </span>
                    <span className="text-xs text-gray-400 font-medium">
                      ({registeredThisWeek} esta semana)
                    </span>
                  </div>
                </div>
                
                <div className="mt-6 space-y-2">
                  <div className="flex justify-between text-xs font-medium text-gray-500">
                    <span>Meta de hoje ({dailyRegGoal} cadastros)</span>
                    <span className="font-bold text-blue-600">
                      {Math.min(100, Math.round((registeredToday / dailyRegGoal) * 100))}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200/50">
                    <div 
                      className="bg-blue-500 h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(59,130,246,0.4)]"
                      style={{ width: `${Math.min(100, (registeredToday / dailyRegGoal) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

            </div>

            {/* Middle Section: Simulation & Goal Management Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Box 1: Interactive Goal Setter */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <Settings2 className="w-5 h-5 text-gray-500" />
                    Ajustar Metas Globais do SaaS
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">Modifique as metas de negócio. Elas afetam os indicadores e barras de progresso do painel.</p>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 font-mono uppercase tracking-wide mb-1.5">Meta de Conversão (%)</label>
                      <div className="relative">
                        <input 
                          type="number"
                          value={goalConvInput}
                          onChange={(e) => setGoalConvInput(e.target.value)}
                          placeholder="Ex: 30"
                          className="w-full pl-4 pr-10 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">%</span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 font-mono uppercase tracking-wide mb-1.5">Meta de Faturamento (R$ MRR)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                        <input 
                          type="number"
                          value={goalMRRInput}
                          onChange={(e) => setGoalMRRInput(e.target.value)}
                          placeholder="Ex: 15000"
                          className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 font-mono uppercase tracking-wide mb-1.5">Meta Diária de Cadastros (Unidades)</label>
                      <input 
                        type="number"
                        value={goalRegInput}
                        onChange={(e) => setGoalRegInput(e.target.value)}
                        placeholder="Ex: 5"
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => {
                      const conv = parseFloat(goalConvInput) || 0;
                      const mrr = parseInt(goalMRRInput) || 0;
                      const reg = parseInt(goalRegInput) || 0;
                      handleSaveGoals(conv, mrr, reg);
                    }}
                    className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-sm shadow-md shadow-amber-500/10 hover:shadow-amber-500/20 transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Salvar Metas de Negócio
                  </button>
                </div>
              </div>

              {/* Box 2: Live Billing & Pricing Projections Simulator */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <Sliders className="w-5 h-5 text-gray-500" />
                    Simulador Interativo de Preço & Projeções
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">Simule alterações de valores nas assinaturas e veja o impacto financeiro imediato no MRR real.</p>
                  
                  <div className="space-y-4">
                    {/* Standard price slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-600">Mensalidade Standard ({activeStandardCount} ativas / {standardCount} total)</span>
                        <span className="font-bold text-gray-900">R$ {simStandardPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <input 
                        type="range"
                        min="10"
                        max="100"
                        step="1"
                        value={simStandardPrice}
                        onChange={(e) => setSimStandardPrice(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Pro pricing slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-600">Mensalidade Pro Flow ({activeProCount} ativas / {proCount} total)</span>
                        <span className="font-bold text-gray-900">R$ {simProPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <input 
                        type="range"
                        min="20"
                        max="150"
                        step="1"
                        value={simProPrice}
                        onChange={(e) => setSimProPrice(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Black Elite slider */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-gray-600">Mensalidade Black Elite ({activeBlackCount} ativas / {blackCount} total)</span>
                        <span className="font-bold text-gray-900">R$ {simBlackPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                      <input 
                        type="range"
                        min="30"
                        max="200"
                        step="1"
                        value={simBlackPrice}
                        onChange={(e) => setSimBlackPrice(parseFloat(e.target.value))}
                        className="w-full accent-amber-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Calculation outcomes inside simulator */}
                <div className="mt-6 p-4 bg-gray-50 border border-gray-100 rounded-xl space-y-2">
                  {(() => {
                    // Compute simulated MRR
                    const simMRR = barbearias.reduce((total, b) => {
                      const planInfo = parseBarbeariaPlan(b.plan);
                      if (planInfo.status === 'active') {
                        if (planInfo.name === 'Black Elite') return total + simBlackPrice;
                        if (planInfo.name === 'Pro Flow') return total + simProPrice;
                        return total + simStandardPrice;
                      }
                      return total;
                    }, 0);
                    const diff = simMRR - calculatedMRR;

                    return (
                      <>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500 font-medium">MRR Simulado:</span>
                          <span className="font-extrabold text-gray-900 text-base">
                            R$ {simMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-gray-500 font-medium">Diferença em relação ao atual:</span>
                          <span className={`font-bold flex items-center gap-1 ${diff >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {diff >= 0 ? '+' : ''}R$ {diff.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            {diff !== 0 && <ArrowUpRight className={`w-3 h-3 ${diff < 0 ? 'rotate-90' : ''}`} />}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>

            </div>

            {/* SaaS Subscriber & Revenue Calculator */}
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-300">
              {/* Header */}
              <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-amber-500" />
                    Calculadora de Planejamento SaaS (Volume & Receita)
                  </h3>
                  <p className="text-xs text-gray-500">
                    Projete metas de faturamento mensal e determine o volume necessário de clientes ativos por plano ou vice-versa.
                  </p>
                </div>

                {/* Mode Selector Tab */}
                <div className="flex bg-gray-100 p-1 rounded-xl self-start sm:self-center">
                  <button
                    onClick={() => setCalcMode('target')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      calcMode === 'target' 
                        ? 'bg-white text-gray-900 shadow-xs' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Meta de Faturamento (Reversa)
                  </button>
                  <button
                    onClick={() => setCalcMode('volume')}
                    className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      calcMode === 'volume' 
                        ? 'bg-white text-gray-900 shadow-xs' 
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >
                    Simulador de Volume (Direta)
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="p-6">
                {calcMode === 'target' ? (
                  <div className="space-y-6">
                    {/* Reverse Mode: Target Revenue -> Subs needed */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Column 1: Input Meta */}
                      <div className="space-y-4 md:col-span-1">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-2">
                            Meta de Faturamento Mensal (MRR)
                          </label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">R$</span>
                            <input
                              type="number"
                              min="100"
                              max="1000000"
                              value={calcTargetMRR}
                              onChange={(e) => setCalcTargetMRR(Math.max(0, parseInt(e.target.value) || 0))}
                              className="w-full pl-10 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none font-bold text-gray-900 text-lg"
                            />
                          </div>
                        </div>

                        {/* Quick Presets for Target */}
                        <div className="grid grid-cols-2 gap-2">
                          {[5000, 15000, 30000, 50000].map((val) => (
                            <button
                              key={val}
                              onClick={() => setCalcTargetMRR(val)}
                              className={`py-1.5 px-3 rounded-lg border text-xs font-bold transition-all cursor-pointer ${
                                calcTargetMRR === val
                                  ? 'bg-amber-500 border-amber-500 text-black shadow-xs'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              R$ {val.toLocaleString('pt-BR')}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Column 2: Preset Weight distribution */}
                      <div className="space-y-3 md:col-span-2">
                        <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider">
                          Estratégia de Distribuição dos Planos
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: 'balanced', name: 'Equilibrada', desc: 'Foco dividido igualmente', weights: '34% Std | 33% Pro | 33% Black' },
                            { id: 'volume_heavy', name: 'Volume / Econômica', desc: 'Foco no plano de entrada', weights: '60% Std | 30% Pro | 10% Black' },
                            { id: 'pro_heavy', name: 'Intermediária / Recomendada', desc: 'Maior adesão no Pro Flow', weights: '20% Std | 60% Pro | 20% Black' },
                            { id: 'premium_heavy', name: 'Alta Conversão / Premium', desc: 'Foco no ticket alto (Black Elite)', weights: '10% Std | 20% Pro | 70% Black' }
                          ].map((p) => (
                            <button
                              key={p.id}
                              onClick={() => setCalcPreset(p.id as any)}
                              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                                calcPreset === p.id
                                  ? 'bg-amber-50/50 border-amber-300 ring-1 ring-amber-300'
                                  : 'bg-white border-gray-200 hover:border-gray-300'
                              }`}
                            >
                              <div>
                                <h4 className="text-xs font-bold text-gray-900">{p.name}</h4>
                                <p className="text-[10px] text-gray-500 mt-0.5 leading-tight">{p.desc}</p>
                              </div>
                              <span className="text-[9px] font-mono font-semibold text-amber-700 mt-2 block bg-amber-100/50 px-1.5 py-0.5 rounded self-start">
                                {p.weights}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Results of reverse calculation */}
                    {(() => {
                      const weights = {
                        balanced: { std: 34, pro: 33, blk: 33 },
                        volume_heavy: { std: 60, pro: 30, blk: 10 },
                        pro_heavy: { std: 20, pro: 60, blk: 20 },
                        premium_heavy: { std: 10, pro: 20, blk: 70 },
                      }[calcPreset];

                      const arpu = ((weights.std * simStandardPrice) + (weights.pro * simProPrice) + (weights.blk * simBlackPrice)) / 100;
                      const totalSubs = arpu > 0 ? Math.ceil(calcTargetMRR / arpu) : 0;
                      
                      const stdSubs = Math.round((totalSubs * weights.std) / 100);
                      const proSubs = Math.round((totalSubs * weights.pro) / 100);
                      const blkSubs = Math.max(0, totalSubs - stdSubs - proSubs);

                      const exactMRR = (stdSubs * simStandardPrice) + (proSubs * simProPrice) + (blkSubs * simBlackPrice);
                      const exactARR = exactMRR * 12;

                      return (
                        <div className="space-y-6 pt-4 border-t border-gray-100">
                          {/* Bento results per plan */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Standard needed */}
                            <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 flex flex-col justify-between space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-gray-500 font-mono uppercase bg-gray-200/50 px-2.5 py-0.5 rounded">
                                  💈 Standard
                                </span>
                                <span className="text-xs font-bold text-gray-900 font-mono">
                                  R$ {simStandardPrice.toFixed(2)}/mês
                                </span>
                              </div>
                              <div>
                                <p className="text-2xl font-black text-gray-900">
                                  {stdSubs} <span className="text-sm font-semibold text-gray-500">assinantes</span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  ({weights.std}% da base sugerida)
                                </p>
                              </div>
                              <div className="pt-3 border-t border-gray-200/50 flex justify-between text-xs text-gray-600 font-medium">
                                <span>Contribuição Mensal:</span>
                                <span className="font-bold text-gray-900">
                                  R$ {(stdSubs * simStandardPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Pro needed */}
                            <div className="p-5 rounded-2xl bg-amber-50/40 border border-amber-100 flex flex-col justify-between space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-amber-700 font-mono uppercase bg-amber-100/50 px-2.5 py-0.5 rounded">
                                  ✨ Pro Flow
                                </span>
                                <span className="text-xs font-bold text-amber-900 font-mono">
                                  R$ {simProPrice.toFixed(2)}/mês
                                </span>
                              </div>
                              <div>
                                <p className="text-2xl font-black text-gray-900">
                                  {proSubs} <span className="text-sm font-semibold text-gray-500">assinantes</span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  ({weights.pro}% da base sugerida)
                                </p>
                              </div>
                              <div className="pt-3 border-t border-amber-200/50 flex justify-between text-xs text-gray-600 font-medium">
                                <span>Contribuição Mensal:</span>
                                <span className="font-bold text-gray-900 font-mono">
                                  R$ {(proSubs * simProPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>

                            {/* Black needed */}
                            <div className="p-5 rounded-2xl bg-zinc-900 text-white flex flex-col justify-between space-y-4">
                              <div className="flex justify-between items-center">
                                <span className="text-xs font-bold text-amber-400 font-mono uppercase bg-white/10 px-2.5 py-0.5 rounded">
                                  👑 Black Elite
                                </span>
                                <span className="text-xs font-bold text-amber-300 font-mono">
                                  R$ {simBlackPrice.toFixed(2)}/mês
                                </span>
                              </div>
                              <div>
                                <p className="text-2xl font-black text-white">
                                  {blkSubs} <span className="text-sm font-semibold text-gray-400">assinantes</span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                  ({weights.blk}% da base sugerida)
                                </p>
                              </div>
                              <div className="pt-3 border-t border-zinc-800 flex justify-between text-xs text-gray-400 font-medium">
                                <span>Contribuição Mensal:</span>
                                <span className="font-bold text-amber-400 font-mono">
                                  R$ {(blkSubs * simBlackPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Summary Consolidated Banner */}
                          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 text-black flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="space-y-0.5">
                              <h4 className="text-sm font-bold uppercase tracking-wider font-mono">Resultado da Simulação de Meta</h4>
                              <p className="text-xs font-medium opacity-90">
                                Para gerar um faturamento de <strong className="font-bold font-mono">R$ {calcTargetMRR.toLocaleString('pt-BR')}</strong>, você precisa adquirir um total consolidado de <strong className="font-black text-sm">{totalSubs} lojistas</strong> sob as mensalidades configuradas.
                              </p>
                            </div>
                            <div className="flex gap-4 self-stretch md:self-auto justify-between border-t border-black/10 md:border-t-0 pt-3 md:pt-0">
                              <div className="text-left md:text-right">
                                <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75 font-mono">Faturamento Real Estimado</span>
                                <span className="text-lg font-black font-mono">R$ {exactMRR.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}<span className="text-xs font-bold">/mês</span></span>
                              </div>
                              <div className="text-left md:text-right border-l border-black/10 pl-4">
                                <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75 font-mono">Ticket Médio (ARPU)</span>
                                <span className="text-lg font-black font-mono">R$ {arpu.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                              </div>
                              <div className="text-left md:text-right border-l border-black/10 pl-4 hidden sm:block">
                                <span className="text-[10px] font-bold uppercase tracking-widest block opacity-75 font-mono">Faturamento Anualizado (ARR)</span>
                                <span className="text-lg font-black font-mono">R$ {exactARR.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Forward Mode: User chooses volume -> revenue is calculated */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Volume Sliders */}
                      <div className="space-y-5">
                        <h4 className="text-xs font-bold text-gray-700 font-mono uppercase tracking-widest mb-2">Configure o Volume de Assinantes Desejado</h4>
                        
                        {/* Standard Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-gray-600 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded bg-slate-400" />
                              Lojas no Plano Standard (R$ {simStandardPrice.toFixed(2)})
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                min="0"
                                max="10000"
                                value={calcStandardSubs}
                                onChange={(e) => setCalcStandardSubs(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 px-2 py-1 text-right text-xs font-bold border border-gray-200 rounded"
                              />
                              <span className="text-gray-400 text-[10px]">Lojas</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="500"
                            step="5"
                            value={calcStandardSubs}
                            onChange={(e) => setCalcStandardSubs(parseInt(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Pro Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-gray-600 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded bg-amber-500" />
                              Lojas no Plano Pro Flow (R$ {simProPrice.toFixed(2)})
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                min="0"
                                max="10000"
                                value={calcProSubs}
                                onChange={(e) => setCalcProSubs(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 px-2 py-1 text-right text-xs font-bold border border-gray-200 rounded"
                              />
                              <span className="text-gray-400 text-[10px]">Lojas</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="500"
                            step="5"
                            value={calcProSubs}
                            onChange={(e) => setCalcProSubs(parseInt(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                          />
                        </div>

                        {/* Black Slider */}
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs font-medium">
                            <span className="text-gray-600 flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded bg-zinc-900" />
                              Lojas no Plano Black Elite (R$ {simBlackPrice.toFixed(2)})
                            </span>
                            <div className="flex items-center gap-2">
                              <input 
                                type="number"
                                min="0"
                                max="10000"
                                value={calcBlackSubs}
                                onChange={(e) => setCalcBlackSubs(Math.max(0, parseInt(e.target.value) || 0))}
                                className="w-16 px-2 py-1 text-right text-xs font-bold border border-gray-200 rounded"
                              />
                              <span className="text-gray-400 text-[10px]">Lojas</span>
                            </div>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="500"
                            step="5"
                            value={calcBlackSubs}
                            onChange={(e) => setCalcBlackSubs(parseInt(e.target.value))}
                            className="w-full accent-amber-500 h-1.5 bg-gray-100 rounded-lg cursor-pointer"
                          />
                        </div>
                      </div>

                      {/* Right: Outcome indicators */}
                      <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 flex flex-col justify-between space-y-6">
                        {(() => {
                          const totalSubs = calcStandardSubs + calcProSubs + calcBlackSubs;
                          const calculatedRevenue = (calcStandardSubs * simStandardPrice) + (calcProSubs * simProPrice) + (calcBlackSubs * simBlackPrice);
                          const totalARR = calculatedRevenue * 12;
                          const arpuValue = totalSubs > 0 ? calculatedRevenue / totalSubs : 0;
                          
                          // Compare with goal MRR
                          const goalPct = targetMRR > 0 ? Math.min(100, Math.round((calculatedRevenue / targetMRR) * 100)) : 0;

                          return (
                            <>
                              <div className="space-y-4">
                                <h4 className="text-xs font-bold text-gray-500 font-mono uppercase tracking-widest">Receita Recorrente Estimada por Mês</h4>
                                
                                <div className="grid grid-cols-2 gap-4">
                                  {/* MRR Card */}
                                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase">MRR SaaS Estimado</span>
                                    <span className="text-2xl font-black text-gray-900 font-mono">
                                      R$ {calculatedRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                  
                                  {/* ARR Card */}
                                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase">ARR Projeção Anual</span>
                                    <span className="text-2xl font-black text-emerald-600 font-mono">
                                      R$ {totalARR.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                                    </span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                  {/* Total Subscribers */}
                                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase">Total Assinantes</span>
                                    <span className="text-xl font-bold text-gray-800">
                                      {totalSubs} lojistas
                                    </span>
                                  </div>

                                  {/* ARPU */}
                                  <div className="bg-white p-4 rounded-xl border border-gray-200">
                                    <span className="text-[10px] font-bold text-gray-400 block font-mono uppercase">Ticket Médio (ARPU)</span>
                                    <span className="text-xl font-bold text-gray-800 font-mono">
                                      R$ {arpuValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Progress bar compared to target MRR */}
                              <div className="space-y-2 pt-4 border-t border-gray-200/60">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-500 font-medium">Progresso contra a meta SaaS de R$ {targetMRR.toLocaleString('pt-BR')}:</span>
                                  <span className={`font-black ${goalPct >= 100 ? 'text-emerald-600' : 'text-amber-500'}`}>{goalPct}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden border border-gray-300/30">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-300 ${
                                      goalPct >= 100 ? 'bg-emerald-500' : 'bg-amber-500'
                                    }`}
                                    style={{ width: `${goalPct}%` }}
                                  />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Row: Distribution & Leaderboard */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Distribution charts styled nicely */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2 mb-2">
                    <BarChart3 className="w-5 h-5 text-gray-500" />
                    Distribuição dos Planos
                  </h3>
                  <p className="text-xs text-gray-500 mb-6">Adesão atual por categorias de planos SaaS ativos ou trials.</p>
                  
                  <div className="space-y-4">
                    {/* Standard bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-700">💈 Standard</span>
                        <span className="text-gray-500">{activeStandardCount} ativa(s) / {standardCount} total ({totalShops > 0 ? Math.round((standardCount / totalShops) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-slate-400 h-full rounded-full"
                          style={{ width: `${totalShops > 0 ? (standardCount / totalShops) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Pro Flow bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-700">✨ Pro Flow</span>
                        <span className="text-gray-500">{activeProCount} ativa(s) / {proCount} total ({totalShops > 0 ? Math.round((proCount / totalShops) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-amber-500 h-full rounded-full shadow-[0_0_6px_rgba(245,158,11,0.2)]"
                          style={{ width: `${totalShops > 0 ? (proCount / totalShops) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Black Elite bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="font-semibold text-gray-700">👑 Black Elite</span>
                        <span className="text-gray-500">{activeBlackCount} ativa(s) / {blackCount} total ({totalShops > 0 ? Math.round((blackCount / totalShops) * 100) : 0}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-full rounded-full shadow-[0_0_6px_rgba(168,85,247,0.2)]"
                          style={{ width: `${totalShops > 0 ? (blackCount / totalShops) * 100 : 0}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 border-t border-gray-100 pt-4 text-center">
                  <div className="text-xs text-gray-400 font-medium flex items-center justify-center gap-1">
                    <Activity className="w-4 h-4 text-amber-500 animate-pulse" />
                    {paidActiveCount} assinaturas gerando receita recorrente ativa
                  </div>
                </div>
              </div>

              {/* Leaderboard Section */}
              <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm lg:col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Top Lojas por Densidade de Atividade
                  </h3>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Métrica de Engajamento</span>
                </div>
                <p className="text-xs text-gray-500 mb-6">Barbearias com maior número de barbeiros cadastrados e serviços configurados.</p>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b border-gray-100">
                      <tr>
                        <th className="px-4 py-2.5 font-semibold">Posição</th>
                        <th className="px-4 py-2.5 font-semibold">Nome / Contato</th>
                        <th className="px-4 py-2.5 font-semibold">Plano</th>
                        <th className="px-4 py-2.5 font-semibold text-center">Barbeiros</th>
                        <th className="px-4 py-2.5 font-semibold text-center">Serviços</th>
                        <th className="px-4 py-2.5 font-semibold text-right">Escore</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {topShops.map((shop, idx) => {
                        const planInfo = parseBarbeariaPlan(shop.plan);
                        let planBadge = (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                            Standard
                          </span>
                        );
                        if (planInfo.name === 'Pro Flow') {
                          planBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20">
                              Pro Flow
                            </span>
                          );
                        } else if (planInfo.name === 'Black Elite') {
                          planBadge = (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-600 border border-purple-500/20">
                              Black Elite
                            </span>
                          );
                        }

                        return (
                          <tr key={shop.id} className="hover:bg-gray-50/50 transition-colors">
                            <td className="px-4 py-3 font-mono font-bold text-gray-400">
                              #{idx + 1}
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-semibold text-gray-900 text-xs">{shop.name}</div>
                              <div className="text-[10px] text-gray-400 font-medium">{shop.email}</div>
                            </td>
                            <td className="px-4 py-3">
                              {planBadge}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-semibold text-gray-700">
                              {shop.barbersCount}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-semibold text-gray-700">
                              {shop.servicesCount}
                            </td>
                            <td className="px-4 py-3 text-right font-mono font-bold text-amber-600">
                              {shop.score} pts
                            </td>
                          </tr>
                        );
                      })}
                      {topShops.length === 0 && (
                        <tr>
                          <td colSpan={6} className="px-4 py-6 text-center text-gray-400 text-xs">
                            Nenhuma loja ativa disponível para cálculo de ranking.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

          </div>
        )}

        {activeTab === 'tools' && (
          <div className="space-y-8 animate-in fade-in duration-200">
            {/* Page Header */}
            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                Painel de Ferramentas & Controle SaaS
              </h2>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Configure canais de comunicação com lojistas em tempo real, gerencie cupons para campanhas de marketing/suporte, e controle ambientes de sandbox e relatórios.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column: Communications and Vouchers (Span 2) */}
              <div className="lg:col-span-2 space-y-8">
                
                {/* section: Communications */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-amber-500" />
                      Comunicados Globais (Notificação em Tempo Real)
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono">PUSH REALTIME</span>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-1.5">Título do Alerta</label>
                        <input
                          type="text"
                          placeholder="Ex: Nova atualização do sistema!"
                          value={broadcastTitle}
                          onChange={(e) => setBroadcastTitle(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-1.5">Estilo / Nível</label>
                          <select
                            value={broadcastType}
                            onChange={(e: any) => setBroadcastType(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                          >
                            <option value="info">Informação (Azul)</option>
                            <option value="success">Novidade (Verde)</option>
                            <option value="warning">Alerta (Laranja)</option>
                            <option value="danger">Crítico (Vermelho)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-1.5">Público Alvo</label>
                          <select
                            value={broadcastTarget}
                            onChange={(e: any) => setBroadcastTarget(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                          >
                            <option value="all">Todas as Lojas</option>
                            <option value="Standard">Apenas Standard</option>
                            <option value="Pro Flow">Apenas Pro Flow</option>
                            <option value="Black Elite">Apenas Black Elite</option>
                          </select>
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-1.5">Mensagem do Comunicado</label>
                      <textarea
                        rows={3}
                        placeholder="Escreva a mensagem clara que aparecerá no painel de controle do dono da barbearia..."
                        value={broadcastContent}
                        onChange={(e) => setBroadcastContent(e.target.value)}
                        className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none resize-none"
                      />
                    </div>

                    <button
                      onClick={handleAddBroadcast}
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 self-start"
                    >
                      <Megaphone className="w-3.5 h-3.5" />
                      Publicar Comunicado SaaS
                    </button>

                    {/* Broadcast List */}
                    <div className="mt-6 border-t border-gray-100 pt-6">
                      <h4 className="text-xs font-bold text-gray-600 font-mono uppercase tracking-widest mb-3">Histórico de Mensagens Ativas</h4>
                      <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                        {broadcasts.map((b: any) => (
                          <div key={b.id} className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 flex items-start justify-between gap-4 text-xs">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className={`w-2.5 h-2.5 rounded-full ${
                                  b.type === 'danger' ? 'bg-red-500' :
                                  b.type === 'warning' ? 'bg-amber-500' :
                                  b.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                                }`} />
                                <strong className="text-gray-900">{b.title}</strong>
                                <span className="text-[9px] px-1.5 py-0.2 bg-gray-200 text-gray-600 rounded uppercase font-semibold font-mono">
                                  {b.target === 'all' ? 'Todos' : b.target}
                                </span>
                              </div>
                              <p className="text-gray-600 leading-relaxed">{b.content}</p>
                              <div className="text-[10px] text-gray-400 font-mono">
                                {new Date(b.createdAt).toLocaleString('pt-BR')}
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleToggleBroadcast(b.id)}
                                className={`px-2 py-1 rounded font-bold font-mono text-[9px] transition-colors cursor-pointer ${
                                  b.active ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                }`}
                              >
                                {b.active ? 'ATIVO' : 'PAUSADO'}
                              </button>
                              <button
                                onClick={() => handleDeleteBroadcast(b.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                        {broadcasts.length === 0 && (
                          <div className="text-center py-6 text-gray-400 text-xs font-medium">
                            Nenhum comunicado ativo registrado. Envie um acima!
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* section: Vouchers */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Percent className="w-4 h-4 text-emerald-500" />
                      Cupons SaaS & Vouchers de Ativação
                    </h3>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-mono">CONVERSÃO</span>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-1.5">Código Cupom</label>
                        <input
                          type="text"
                          placeholder="EX: VIP90DIAS"
                          value={voucherCode}
                          onChange={(e) => setVoucherCode(e.target.value)}
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-bold placeholder:font-normal uppercase"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-1.5">Ação do Cupom</label>
                        <select
                          value={voucherType}
                          onChange={(e: any) => setVoucherType(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                        >
                          <option value="extend_trial">Estender Período de Testes</option>
                          <option value="activate_plan">Ativar Plano Diretamente</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-1.5">Valor (Dias de Uso)</label>
                        <input
                          type="number"
                          value={voucherValue}
                          onChange={(e) => setVoucherValue(Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none font-semibold"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-700 font-mono uppercase tracking-wider mb-1.5">Plano Destino</label>
                        <select
                          value={voucherPlanTarget}
                          onChange={(e: any) => setVoucherPlanTarget(e.target.value)}
                          className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                        >
                          <option value="all">Qualquer Plano</option>
                          <option value="Standard">Standard</option>
                          <option value="Pro Flow">Pro Flow</option>
                          <option value="Black Elite">Black Elite</option>
                        </select>
                      </div>
                    </div>

                    <button
                      onClick={handleAddVoucher}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-2 self-start"
                    >
                      <Percent className="w-3.5 h-3.5" />
                      Criar Código Promocional
                    </button>

                    {/* Vouchers list table */}
                    <div className="mt-6 border-t border-gray-100 pt-6">
                      <h4 className="text-xs font-bold text-gray-600 font-mono uppercase tracking-widest mb-3">Cupons Cadastrados no SaaS</h4>
                      <div className="overflow-x-auto rounded-xl border border-gray-200">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-gray-50 border-b border-gray-100 font-mono font-bold text-gray-500 uppercase">
                            <tr>
                              <th className="px-4 py-2.5">Código</th>
                              <th className="px-4 py-2.5">Tipo de Ação</th>
                              <th className="px-4 py-2.5 text-center">Dias / Valor</th>
                              <th className="px-4 py-2.5">Plano Alvo</th>
                              <th className="px-4 py-2.5 text-center">Status</th>
                              <th className="px-4 py-2.5 text-right">Ações</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-gray-600">
                            {vouchers.map((v: any) => (
                              <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-4 py-3 font-bold font-mono text-gray-900">
                                  {v.code}
                                </td>
                                <td className="px-4 py-3">
                                  {v.type === 'extend_trial' ? '🎁 Estender Teste' : '⚡ Ativação de Plano'}
                                </td>
                                <td className="px-4 py-3 text-center font-bold font-mono">
                                  +{v.value}d
                                </td>
                                <td className="px-4 py-3 font-semibold text-gray-500">
                                  {v.planTarget === 'all' ? 'Qualquer um' : v.planTarget}
                                </td>
                                <td className="px-4 py-3 text-center">
                                  <button
                                    onClick={() => handleToggleVoucher(v.id)}
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono transition-colors cursor-pointer ${
                                      v.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                                    }`}
                                  >
                                    {v.active ? 'ATIVO' : 'PAUSADO'}
                                  </button>
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleDeleteVoucher(v.id)}
                                    className="p-1 bg-red-50 hover:bg-red-100 text-red-500 rounded transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {vouchers.length === 0 && (
                              <tr>
                                <td colSpan={6} className="px-4 py-6 text-center text-gray-400 font-medium">
                                  Nenhum cupom ou código promocional cadastrado.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Database Seeding & Analytics Tool (Span 1) */}
              <div className="space-y-8">
                
                {/* section: Sandbox Database Seeder */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500 animate-pulse" />
                      Operações de Massa & Sandbox
                    </h3>
                  </div>

                  <div className="p-6 space-y-5">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Ferramentas para demonstrar a plataforma para investidores ou clientes sem precisar criar contas reais passo a passo.
                    </p>

                    <div className="space-y-4">
                      {/* Seed button */}
                      <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 space-y-3">
                        <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-amber-500" />
                          Gerar Lojas Sandbox
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Adiciona instantaneamente 5 barbearias de simulação completas com diferentes planos e faturamentos para preencher os gráficos de métricas.
                        </p>
                        <button
                          onClick={handleGenerateSandbox}
                          disabled={isGeneratingSandbox}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer animate-pulse"
                        >
                          <Sparkles className="w-4 h-4" />
                          {isGeneratingSandbox ? 'Gerando dados...' : 'Criar 5 Barbearias de Teste'}
                        </button>
                      </div>

                      {/* Purge button */}
                      <div className="p-4 rounded-xl border border-red-100 bg-red-50/30 space-y-3">
                        <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                          <Trash2 className="w-4 h-4 text-red-500" />
                          Limpar Lojas Sandbox
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                          Remove de forma segura todas as lojas geradas para simulação sem afetar nenhum lojista real.
                        </p>
                        <button
                          onClick={handlePurgeSandbox}
                          disabled={isGeneratingSandbox}
                          className="w-full py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          {isGeneratingSandbox ? 'Limpando dados...' : 'Remover Barbearias Sandbox'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* section: SaaS Exporters */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                      <Download className="w-4 h-4 text-blue-500" />
                      Relatórios & Exportadores
                    </h3>
                  </div>

                  <div className="p-6 space-y-4">
                    <p className="text-xs text-gray-500 leading-relaxed">
                      Exporte o banco de dados de clientes consolidados e assinaturas em formato compatível com Excel e BI.
                    </p>

                    <button
                      onClick={handleExportCSVReport}
                      className="w-full py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-amber-500" />
                      Exportar Base Lojistas (.CSV)
                    </button>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Control / Plan management modal */}
      {isModalOpen && selectedBarbearia && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl border border-gray-100 shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Gerenciar Barbearia SaaS</h3>
                <p className="text-xs text-gray-500 mt-1">{selectedBarbearia.name} ({selectedBarbearia.email})</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 bg-white border border-gray-100 text-gray-400 hover:text-gray-900 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              
              {/* Plan Category */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 font-mono uppercase tracking-wide">Plano Principal</label>
                <select
                  value={editPlanName}
                  onChange={(e: any) => setEditPlanName(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="Standard">Standard</option>
                  <option value="Pro Flow">Pro Flow</option>
                  <option value="Black Elite">Black Elite</option>
                </select>
              </div>

              {/* Account Status */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 font-mono uppercase tracking-wide">Status do Plano</label>
                <select
                  value={editPlanStatus}
                  onChange={(e: any) => setEditPlanStatus(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none bg-white"
                >
                  <option value="trial">Em Teste (Trial)</option>
                  <option value="active">Ativo / Assinatura Paga</option>
                  <option value="suspended">Suspenso por Inadimplência</option>
                  <option value="expired">Expirado / Cancelado</option>
                </select>
              </div>

              {/* Conditional Trial Expiration */}
              {editPlanStatus === 'trial' && (
                <div className="p-4 bg-amber-50/40 border border-amber-200/50 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 text-xs font-semibold">
                    <Clock className="w-4 h-4" />
                    <span>Configuração de Período de Testes</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-gray-600 block">Data de Expiração do Teste</label>
                    <input
                      type="date"
                      value={editTrialEndsAt}
                      onChange={(e) => setEditTrialEndsAt(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleAddTrialDays(7)}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors cursor-pointer"
                    >
                      +7 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTrialDays(14)}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors cursor-pointer"
                    >
                      +14 dias
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddTrialDays(30)}
                      className="px-2.5 py-1 text-xs bg-white hover:bg-gray-50 border border-gray-200 rounded-lg text-gray-700 font-medium transition-colors cursor-pointer"
                    >
                      +30 dias
                    </button>
                  </div>
                </div>
              )}

              {/* Conditional Active Subscription expiration */}
              {editPlanStatus === 'active' && (
                <div className="p-4 bg-emerald-50/40 border border-emerald-200/50 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <Calendar className="w-4 h-4" />
                    <span>Configuração de Período da Assinatura</span>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-[11px] font-medium text-gray-600 block">Vencimento da Fatura / Assinatura (Opcional)</label>
                    <input
                      type="date"
                      value={editPlanEndsAt}
                      onChange={(e) => setEditPlanEndsAt(e.target.value)}
                      className="w-full px-4 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Onboarding Complete (System Activation) */}
              <div className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200/50 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">Onboarding Concluído</p>
                    <p className="text-xs text-gray-500 mt-0.5">Define se a barbearia configurou o perfil inicial e está ativa para receber agendamentos.</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={editIsOnboarded}
                    onChange={(e) => setEditIsOnboarded(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 flex gap-3 justify-end bg-gray-50/50">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-semibold text-gray-700 transition-colors cursor-pointer bg-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleSavePlan}
                disabled={isSaving}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-bold shadow-md shadow-amber-500/10 flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white animate-spin rounded-full" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Salvar Alterações
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
