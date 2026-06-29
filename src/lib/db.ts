import { supabase } from './supabase';
import { Appointment, Barber, Service, InventoryItem, Client, SuperAdminLog } from '../types';

export interface BarbeariaPlanInfo {
  name: string; // 'Standard' | 'Pro Flow' | 'Black Elite'
  status: 'trial' | 'active' | 'suspended' | 'expired';
  trialEndsAt?: string; // ISO string
  planEndsAt?: string; // ISO string
}

export function parseBarbeariaPlan(planStr: string | undefined): BarbeariaPlanInfo {
  if (!planStr) {
    return { name: 'Standard', status: 'trial' };
  }
  try {
    if (planStr.trim().startsWith('{')) {
      const parsed = JSON.parse(planStr);
      return {
        name: parsed.name || 'Standard',
        status: parsed.status || 'trial',
        trialEndsAt: parsed.trialEndsAt,
        planEndsAt: parsed.planEndsAt,
      };
    }
  } catch (e) {
    // Treat as simple string
  }
  return {
    name: planStr,
    status: planStr === 'Standard' ? 'trial' : 'active'
  };
}

export function serializeBarbeariaPlan(info: BarbeariaPlanInfo): string {
  return JSON.stringify(info);
}

export function getRemainingDays(endsAtStr: string | undefined): number {
  if (!endsAtStr) return 0;
  const endsAt = new Date(endsAtStr);
  const now = new Date();
  const diffTime = endsAt.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
}

export interface Barbearia {
  id: string;
  name: string;
  email: string;
  password?: string;
  slug: string; // URL safe identifier for clients
  plan: string; // 'Standard' | 'Pro Flow' | 'Black Elite'
  logo?: string;
  location?: string;
  phone?: string; // support contact
  isOnboarded?: boolean;
  barbers: Barber[];
  services: Service[];
  inventory?: InventoryItem[];
  clients?: Client[];
  createdAt: string;
}

export const mockBarbearia: Barbearia = {
  id: 'demo-barbearia-id',
  name: 'Barbearia Premium Demo',
  email: 'demo@barbersflow.com',
  slug: 'barbersflow-demo',
  plan: 'Pro Flow',
  logo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&h=150',
  location: 'Av. Paulista, 1000 - São Paulo, SP',
  phone: '5511999999999',
  isOnboarded: true,
  barbers: [
    {
      id: 'barber-1',
      name: 'Thiago Silva',
      role: 'Barbeiro Master & Visagista',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150',
      rating: 4.9,
      reviews: 124,
      specialties: ['Corte Moderno', 'Degradê', 'Visagismo'],
      assignedServices: ['srv-1', 'srv-2', 'srv-3'],
      workingHours: { days: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], start: '09:00', end: '20:00' }
    },
    {
      id: 'barber-2',
      name: 'Lucas Mendes',
      role: 'Especialista em Barbas',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150',
      rating: 4.8,
      reviews: 98,
      specialties: ['Barba de Respeito', 'Terapia Capilar'],
      assignedServices: ['srv-2', 'srv-4'],
      workingHours: { days: ['Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], start: '10:00', end: '21:00' }
    }
  ],
  services: [
    { id: 'srv-1', name: 'Corte Degradê Moderno', price: 60, duration: 45, category: 'Cabelo', description: 'Corte preciso acompanhando o formato da cabeça e estilo do cliente.' },
    { id: 'srv-2', name: 'Barba Completa com Toalha Quente', price: 45, duration: 30, category: 'Barba', description: 'Aparação, alinhamento e barbear clássico com toalha quente e óleos especiais.' },
    { id: 'srv-3', name: 'Combo Cabelo + Barba', price: 95, duration: 75, category: 'Combo', description: 'Nosso serviço mais procurado. Corte de cabelo mais o tratamento completo de barba.' },
    { id: 'srv-4', name: 'Alinhamento Capilar e Hidratação', price: 50, duration: 40, category: 'Tratamento', description: 'Tratamento profundo para fios rebeldes ou ressecados.' }
  ],
  inventory: [
    { id: 'inv-1', name: 'Pomada Efeito Matte Premium', category: 'Pomada', stock: 15, minStock: 5, unit: 'unidades', costPrice: 25, lastUpdated: new Date().toISOString() },
    { id: 'inv-2', name: 'Shampoo Refresh Ice Capilar', category: 'Shampoo', stock: 8, minStock: 3, unit: 'unidades', costPrice: 18, lastUpdated: new Date().toISOString() },
    { id: 'inv-3', name: 'Lâminas de Barbear Platinum (Cartela)', category: 'Lâmina', stock: 120, minStock: 50, unit: 'unidades', costPrice: 0.5, lastUpdated: new Date().toISOString() },
    { id: 'inv-4', name: 'Óleo para Barba Wood & Spice', category: 'Outros', stock: 4, minStock: 2, unit: 'unidades', costPrice: 22, lastUpdated: new Date().toISOString() }
  ],
  clients: [
    { id: 'cli-1', name: 'João Silva', phone: '11999999999', email: 'joao@example.com', createdAt: new Date().toISOString() }
  ],
  createdAt: new Date().toISOString()
};

const BARBEARIAS_COL = 'barbearias';
const BOOKINGS_COL = 'bookings';

// Helper to generate IDs
const generateId = () => Math.random().toString(36).substring(2, 15);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  READ = 'read',
}

export function handleSupabaseError(error: any, operationType: OperationType, path: string | null): never {
  console.error(`Supabase Error during ${operationType} on ${path}:`, error);
  
  let msg = 'Erro desconhecido no banco de dados.';
  let hint = '';
  let code = '';

  if (typeof error === 'string') {
    msg = error;
  } else if (error && typeof error === 'object') {
    msg = error.message || error.error_description || error.error || JSON.stringify(error);
    hint = error.hint ? ` (${error.hint})` : '';
    code = error.code ? ` [Code: ${error.code}]` : '';
  }

  throw new Error(`Erro no Supabase (${operationType} em ${path}): ${msg}${hint}${code}`);
}

// Register a new barbearia
export async function registerBarbearia(
  name: string, 
  email: string, 
  password: string, 
  slug: string, 
  plan: string
): Promise<Barbearia> {
  const cleanEmail = email.toLowerCase().trim();
  const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9-_]/g, '');

  // 1. Check if slug exists
  const { data: existingSlug, error: slugCheckError } = await supabase
    .from(BARBEARIAS_COL)
    .select('id')
    .eq('slug', cleanSlug);

  if (slugCheckError) {
    console.warn('Could not check slug existence before auth (RLS might be active):', slugCheckError);
    // Continue anyway, if the slug is taken, the unique constraint should catch it on insert,
    // or if we can't read it, we just hope it's available.
  } else if (existingSlug && existingSlug.length > 0) {
    throw new Error('Este link de barbearia já está sendo usado. Escolha outro.');
  }

  // 2. Register user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: password,
  });

  let userId: string | undefined;

  if (authError) {
    if (authError.status === 429) {
      throw new Error('Limite de envios atingido. Por favor, aguarde alguns minutos ou use um e-mail diferente. (Dica: Desative a confirmação de e-mail no painel do Supabase para testes)');
    }
    
    // If user already exists, we might still need to create their profile if it failed before
    if (authError.message.includes('already registered')) {
      // Try to sign in to get the ID, or just tell them to log in
      throw new Error('Este e-mail já está cadastrado. Por favor, faça login.');
    }
    
    throw new Error(authError.message);
  }

  userId = authData.user?.id;

  if (!userId) {
    throw new Error('Erro ao criar usuário: ID não retornado.');
  }

  const defaultTrialDays = 14;
  const trialEnds = new Date();
  trialEnds.setDate(trialEnds.getDate() + defaultTrialDays);

  const planInfo: BarbeariaPlanInfo = {
    name: plan || 'Standard',
    status: 'trial',
    trialEndsAt: trialEnds.toISOString(),
  };

  const newBarbearia: Barbearia = {
    id: userId,
    name,
    email: cleanEmail,
    slug: cleanSlug,
    plan: serializeBarbeariaPlan(planInfo),
    isOnboarded: false,
    barbers: [], 
    services: [], 
    createdAt: new Date().toISOString()
  };

  // 3. Create profile in public table
  const { error: dbError } = await supabase
    .from(BARBEARIAS_COL)
    .upsert(newBarbearia);

  if (dbError) {
    if (dbError.code === '23505') {
      throw new Error('Este link de barbearia já está sendo usado (ou outro erro de duplicidade). Escolha outro.');
    }
    if (dbError.code === '42501' || dbError.message.includes('row-level security')) {
      // RLS violation usually happens if email confirmations are enabled and user isn't logged in yet
      throw new Error('Conta criada! Por favor, confirme seu e-mail ou faça login (se a confirmação de e-mail estiver ativada no Supabase, você precisará desativá-la ou confirmar o e-mail antes de continuar).');
    }
    handleSupabaseError(dbError, OperationType.CREATE, BARBEARIAS_COL);
  }

  return newBarbearia;
}

// Login barbearia
export async function loginBarbearia(email: string, password: string): Promise<Barbearia> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Authenticate with Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password: password,
  });

  if (authError) {
    throw new Error('E-mail ou senha incorretos.');
  }

  // 2. Fetch profile from DB
  const { data, error: dbError } = await supabase
    .from(BARBEARIAS_COL)
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (dbError && dbError.code === 'PGRST116') {
    // Record not found. Create it now!
    const defaultTrialDays = 14;
    const trialEnds = new Date();
    trialEnds.setDate(trialEnds.getDate() + defaultTrialDays);

    const planInfo: BarbeariaPlanInfo = {
      name: 'Pro Flow',
      status: 'trial',
      trialEndsAt: trialEnds.toISOString(),
    };

    const newBarbearia: Barbearia = {
      id: authData.user.id,
      name: 'Minha Barbearia',
      email: cleanEmail,
      slug: authData.user.id.substring(0, 8),
      plan: serializeBarbeariaPlan(planInfo),
      isOnboarded: false,
      barbers: [], 
      services: [], 
      createdAt: new Date().toISOString()
    };
    
    const { error: insertError } = await supabase
      .from(BARBEARIAS_COL)
      .insert(newBarbearia);
      
    if (insertError) {
       handleSupabaseError(insertError, OperationType.CREATE, BARBEARIAS_COL);
    }
    
    return newBarbearia;
  } else if (dbError || !data) {
    throw new Error('Dados da barbearia não encontrados no banco de dados.');
  }

  return data as Barbearia;
}

// Logout barbearia
export async function logoutBarbearia(): Promise<void> {
  await supabase.auth.signOut();
}

// Reset password for barbearia
export async function resetPasswordForEmail(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/admin?recovery=true`,
  });
  if (error) {
    throw new Error(error.message || 'Erro ao enviar email de recuperação.');
  }
}

// Update password
export async function updatePassword(newPassword: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) {
    throw new Error(error.message || 'Erro ao atualizar a senha.');
  }
}

// Get all barbearias
export async function getAllBarbearias(): Promise<Barbearia[]> {
  const { data, error } = await supabase
    .from(BARBEARIAS_COL)
    .select('*');
  
  if (error) {
    handleSupabaseError(error, OperationType.LIST, BARBEARIAS_COL);
  }
  return data as Barbearia[];
}

// Subscribe to bookings in real-time
export function subscribeBookings(
  barbeariaId: string, 
  onUpdate: (bookings: Appointment[]) => void
) {
  if (barbeariaId === 'demo-barbearia-id') {
    onUpdate([]);
    return () => {};
  }

  // Initial fetch
  supabase
    .from(BOOKINGS_COL)
    .select('*')
    .eq('barbeariaId', barbeariaId)
    .then(({ data }) => {
      if (data) {
        const sorted = [...data].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
        onUpdate(sorted as Appointment[]);
      }
    });

  // Real-time subscription
  const channel = supabase
    .channel(`bookings:${barbeariaId}`)
    .on(
      'postgres_changes', 
      { 
        event: '*', 
        schema: 'public', 
        table: BOOKINGS_COL,
        filter: `barbeariaId=eq.${barbeariaId}`
      }, 
      () => {
        // Re-fetch everything on any change for simplicity, 
        // or you could update the local list based on payload.
        supabase
          .from(BOOKINGS_COL)
          .select('*')
          .eq('barbeariaId', barbeariaId)
          .then(({ data }) => {
            if (data) {
              const sorted = [...data].sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
              onUpdate(sorted as Appointment[]);
            }
          });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Subscribe to changes in a specific barbearia (for barbers, services updates)
export function subscribeBarbearia(
  barbeariaId: string, 
  onUpdate: (barbearia: Barbearia) => void
) {
  if (barbeariaId === 'demo-barbearia-id') {
    return () => {};
  }

  const channel = supabase
    .channel(`barbearia:${barbeariaId}`)
    .on(
      'postgres_changes', 
      { 
        event: 'UPDATE', 
        schema: 'public', 
        table: BARBEARIAS_COL,
        filter: `id=eq.${barbeariaId}`
      }, 
      (payload) => {
        onUpdate(payload.new as Barbearia);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// Add a new booking
export async function addBooking(
  barbeariaId: string, 
  booking: Omit<Appointment, 'id'>
): Promise<Appointment> {
  if (barbeariaId === 'demo-barbearia-id') {
    return {
      id: Math.random().toString(36).substring(2, 15),
      ...booking,
      status: 'Ocupado'
    } as Appointment;
  }

  // Check double-booking
  const { data: existing } = await supabase
    .from(BOOKINGS_COL)
    .select('id')
    .eq('barbeariaId', barbeariaId)
    .eq('barberId', booking.barberId)
    .eq('date', booking.date)
    .eq('time', booking.time)
    .single();

  if (existing) {
    throw new Error('O horário selecionado já foi reservado para este barbeiro.');
  }

  const { data, error } = await supabase
    .from(BOOKINGS_COL)
    .insert({
      ...booking,
      barbeariaId,
      createdAt: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    handleSupabaseError(error, OperationType.CREATE, BOOKINGS_COL);
  }

  return data as Appointment;
}

// Update booking status
export async function updateBookingStatus(
  bookingId: string, 
  status: 'Livre' | 'Ocupado' | 'Concluído'
): Promise<void> {
  const { error } = await supabase
    .from(BOOKINGS_COL)
    .update({ status })
    .eq('id', bookingId);

  if (error) {
    handleSupabaseError(error, OperationType.UPDATE, BOOKINGS_COL);
  }
}

// Delete booking
export async function deleteBookingFromDb(bookingId: string): Promise<void> {
  const { error } = await supabase
    .from(BOOKINGS_COL)
    .delete()
    .eq('id', bookingId);

  if (error) {
    handleSupabaseError(error, OperationType.DELETE, BOOKINGS_COL);
  }
}

// Update barbearia profile
export async function updateBarbearia(
  barbeariaId: string, 
  updates: Partial<Omit<Barbearia, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  if (barbeariaId === 'demo-barbearia-id') {
    return;
  }

  const { error } = await supabase
    .from(BARBEARIAS_COL)
    .update(updates)
    .eq('id', barbeariaId);

  if (error) {
    handleSupabaseError(error, OperationType.UPDATE, BARBEARIAS_COL);
  }
}

// Delete barbearia profile
export async function deleteBarbearia(barbeariaId: string): Promise<void> {
  if (barbeariaId === 'demo-barbearia-id') {
    return;
  }

  const { error } = await supabase
    .from(BARBEARIAS_COL)
    .delete()
    .eq('id', barbeariaId);

  if (error) {
    handleSupabaseError(error, OperationType.DELETE, BARBEARIAS_COL);
  }
}

// Get barbearia profile
export async function getBarbearia(barbeariaId: string): Promise<Barbearia | null> {
  if (barbeariaId === 'demo-barbearia-id') {
    return mockBarbearia;
  }
  const { data, error } = await supabase
    .from(BARBEARIAS_COL)
    .select('*')
    .eq('id', barbeariaId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    handleSupabaseError(error, OperationType.GET, BARBEARIAS_COL);
  }

  return data as Barbearia;
}

// Check slot availability
export async function getUnavailableSlots(
  barbeariaId: string,
  barberId: string,
  date: string
): Promise<string[]> {
  if (barbeariaId === 'demo-barbearia-id') {
    return [];
  }

  const { data, error } = await supabase
    .from(BOOKINGS_COL)
    .select('time')
    .eq('barbeariaId', barbeariaId)
    .eq('barberId', barberId)
    .eq('date', date);

  if (error) {
    handleSupabaseError(error, OperationType.LIST, BOOKINGS_COL);
  }

  return (data || []).map(d => d.time);
}

// SuperAdmin Logs database actions
const LOGS_COL = 'superadmin_logs';

export async function createSuperAdminLog(log: Omit<SuperAdminLog, 'id' | 'createdAt'>): Promise<void> {
  try {
    const { error } = await supabase
      .from(LOGS_COL)
      .insert({
        barbeariaId: log.barbeariaId,
        barbeariaName: log.barbeariaName,
        action: log.action,
        details: log.details,
        performedBy: log.performedBy || 'superadmin',
        createdAt: new Date().toISOString()
      });
    if (error) {
      console.warn('Failing to write superadmin log in DB, falling back to local simulation:', error.message);
      const localLogs = JSON.parse(localStorage.getItem('superadmin_local_logs') || '[]');
      localLogs.unshift({
        ...log,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('superadmin_local_logs', JSON.stringify(localLogs.slice(0, 200)));
    }
  } catch (err) {
    console.warn('Error saving log to DB:', err);
    try {
      const localLogs = JSON.parse(localStorage.getItem('superadmin_local_logs') || '[]');
      localLogs.unshift({
        ...log,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('superadmin_local_logs', JSON.stringify(localLogs.slice(0, 200)));
    } catch (_) {}
  }
}

export async function getSuperAdminLogs(): Promise<SuperAdminLog[]> {
  try {
    const { data, error } = await supabase
      .from(LOGS_COL)
      .select('*')
      .order('createdAt', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Failing to read superadmin logs from DB, loading from local simulation:', error.message);
      return JSON.parse(localStorage.getItem('superadmin_local_logs') || '[]');
    }

    const localLogs = JSON.parse(localStorage.getItem('superadmin_local_logs') || '[]');
    const dbLogs = (data || []).map(item => ({
      id: item.id,
      barbeariaId: item.barbeariaId,
      barbeariaName: item.barbeariaName,
      action: item.action,
      details: item.details,
      performedBy: item.performedBy,
      createdAt: item.createdAt
    }));

    const allLogs = [...dbLogs, ...localLogs];
    allLogs.sort((a, b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    return allLogs.slice(0, 150);
  } catch (err) {
    console.warn('Error reading logs:', err);
    try {
      return JSON.parse(localStorage.getItem('superadmin_local_logs') || '[]');
    } catch (_) {
      return [];
    }
  }
}


