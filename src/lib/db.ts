import { supabase } from './supabase';
import { Appointment, Barber, Service } from '../types';
import { premiumBarbers, premiumServices } from '../data';

export interface Barbearia {
  id: string;
  name: string;
  email: string;
  password?: string;
  slug: string; // URL safe identifier for clients
  plan: string; // 'Standard' | 'Pro Flow' | 'Black Elite'
  logo?: string;
  location?: string;
  isOnboarded?: boolean;
  barbers: Barber[];
  services: Service[];
  createdAt: string;
}

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
}

export function handleSupabaseError(error: any, operationType: OperationType, path: string | null): never {
  console.error(`Supabase Error during ${operationType} on ${path}:`, error);
  throw error;
}

// Seed default barbearia so user has an active demo account to login
export async function seedDefaultData(): Promise<Barbearia> {
  const demoEmail = 'demo@barbersflow.com';
  
  const { data: existing, error: getError } = await supabase
    .from(BARBEARIAS_COL)
    .select('*')
    .eq('email', demoEmail)
    .single();

  if (existing) {
    return existing as Barbearia;
  }

  // Create default barbearia
  const defaultId = 'royal_barber';
  const defaultBarbearia: Barbearia = {
    id: defaultId,
    name: 'Royal Barber Club',
    email: demoEmail,
    password: '123', // Simple password for testing
    slug: 'royal',
    plan: 'Pro Flow',
    logo: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=150&h=150',
    isOnboarded: true,
    barbers: premiumBarbers,
    services: premiumServices,
    createdAt: new Date().toISOString()
  };

  const { error: insertError } = await supabase
    .from(BARBEARIAS_COL)
    .upsert(defaultBarbearia);

  if (insertError) {
    handleSupabaseError(insertError, OperationType.CREATE, BARBEARIAS_COL);
  }

  // Add initial mock bookings
  const mockBookings = [
    {
      id: 'b1',
      barberId: '1',
      serviceId: 's1',
      clientName: 'Rodrigo Silva',
      clientEmail: 'rodrigo@email.com',
      clientPhone: '(11) 99999-1111',
      date: '2026-06-26',
      time: '09:00',
      status: 'Concluído',
      barbeariaId: defaultId
    },
    {
      id: 'b2',
      barberId: '1',
      serviceId: 's3',
      clientName: 'Carlos Eduardo',
      clientEmail: 'carlos@email.com',
      clientPhone: '(11) 98888-2222',
      date: '2026-06-26',
      time: '10:00',
      status: 'Ocupado',
      barbeariaId: defaultId
    },
    {
      id: 'b3',
      barberId: '2',
      serviceId: 's2',
      clientName: 'Matheus Pereira',
      clientEmail: 'matheus@email.com',
      clientPhone: '(11) 97777-3333',
      date: '2026-06-26',
      time: '14:00',
      status: 'Ocupado',
      barbeariaId: defaultId
    }
  ];

  const { error: bookingsError } = await supabase
    .from(BOOKINGS_COL)
    .upsert(mockBookings.map(b => ({ ...b, createdAt: new Date().toISOString() })));

  if (bookingsError) {
    handleSupabaseError(bookingsError, OperationType.CREATE, BOOKINGS_COL);
  }

  return defaultBarbearia;
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
  const { data: slugExists } = await supabase
    .from(BARBEARIAS_COL)
    .select('id')
    .eq('slug', cleanSlug)
    .single();

  if (slugExists) {
    throw new Error('Este link de barbearia já está sendo usado. Escolha outro.');
  }

  // 2. Register user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: password,
  });

  if (authError) {
    throw new Error(authError.message);
  }

  if (!authData.user) {
    throw new Error('Erro ao criar usuário.');
  }

  const id = authData.user.id;
  const newBarbearia: Barbearia = {
    id,
    name,
    email: cleanEmail,
    slug: cleanSlug,
    plan,
    isOnboarded: false,
    barbers: [], 
    services: [], 
    createdAt: new Date().toISOString()
  };

  const { error: dbError } = await supabase
    .from(BARBEARIAS_COL)
    .insert(newBarbearia);

  if (dbError) {
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
    // Special handling for pre-existing seed default user login
    if (cleanEmail === 'demo@barbersflow.com' && password === '123') {
       // Just return the seeded data if it exists
       const { data: demo } = await supabase.from(BARBEARIAS_COL).select('*').eq('email', cleanEmail).single();
       if (demo) return demo as Barbearia;
    }
    throw new Error('E-mail ou senha incorretos.');
  }

  // 2. Fetch profile from DB
  const { data, error: dbError } = await supabase
    .from(BARBEARIAS_COL)
    .select('*')
    .eq('id', authData.user.id)
    .single();

  if (dbError || !data) {
    throw new Error('Dados da barbearia não encontrados no banco de dados.');
  }

  return data as Barbearia;
}

// Logout barbearia
export async function logoutBarbearia(): Promise<void> {
  await supabase.auth.signOut();
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

// Add a new booking
export async function addBooking(
  barbeariaId: string, 
  booking: Omit<Appointment, 'id'>
): Promise<Appointment> {
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
  const { error } = await supabase
    .from(BARBEARIAS_COL)
    .update(updates)
    .eq('id', barbeariaId);

  if (error) {
    handleSupabaseError(error, OperationType.UPDATE, BARBEARIAS_COL);
  }
}

// Check slot availability
export async function getUnavailableSlots(
  barbeariaId: string,
  barberId: string,
  date: string
): Promise<string[]> {
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

