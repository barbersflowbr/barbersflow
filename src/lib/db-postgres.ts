import { supabase } from './supabase';
import { query } from './postgres';
import { Appointment, Barber, Service, InventoryItem, Client, SuperAdminLog } from '../types';

export interface BarbeariaPlanInfo {
  name: string;
  status: 'trial' | 'active' | 'suspended' | 'expired';
  trialEndsAt?: string;
  planEndsAt?: string;
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
  slug: string;
  plan: string;
  logo?: string;
  location?: string;
  phone?: string;
  isOnboarded?: boolean;
  barbers: Barber[];
  services: Service[];
  inventory?: InventoryItem[];
  clients?: Client[];
  createdAt: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
  READ = 'read',
}

export function handleDatabaseError(error: any, operationType: OperationType, path: string | null): never {
  console.error(`Database Error during ${operationType} on ${path}:`, error);
  
  let msg = 'Erro desconhecido no banco de dados.';
  if (typeof error === 'string') {
    msg = error;
  } else if (error && typeof error === 'object') {
    msg = error.message || JSON.stringify(error);
  }

  throw new Error(`Erro no banco de dados (${operationType} em ${path}): ${msg}`);
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

  // 1. Register user in Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: cleanEmail,
    password: password,
  });

  let userId: string | undefined;

  if (authError) {
    if (authError.status === 429) {
      throw new Error('Limite de envios atingido. Por favor, aguarde alguns minutos ou use um e-mail diferente.');
    }
    
    if (authError.message.includes('already registered')) {
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

  // 2. Create profile in PostgreSQL
  try {
    await query(
      `INSERT INTO barbearias (id, name, email, slug, plan, isOnboarded, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [userId, name, cleanEmail, cleanSlug, newBarbearia.plan, false, new Date().toISOString(), new Date().toISOString()]
    );
  } catch (error: any) {
    if (error.code === '23505') {
      throw new Error('Este link de barbearia já está sendo usado. Escolha outro.');
    }
    handleDatabaseError(error, OperationType.CREATE, 'barbearias');
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

  // 2. Fetch profile from PostgreSQL
  try {
    const result = await query(
      `SELECT * FROM barbearias WHERE id = $1`,
      [authData.user.id]
    );

    if (result.rows.length === 0) {
      // Create profile if it doesn't exist
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
      
      await query(
        `INSERT INTO barbearias (id, name, email, slug, plan, isOnboarded, createdAt, updatedAt)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [authData.user.id, newBarbearia.name, cleanEmail, newBarbearia.slug, newBarbearia.plan, false, new Date().toISOString(), new Date().toISOString()]
      );
      
      return newBarbearia;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      slug: row.slug,
      plan: row.plan,
      logo: row.logo,
      location: row.location,
      phone: row.phone,
      isOnboarded: row.isonboarded,
      barbers: [],
      services: [],
      createdAt: row.createdat
    };
  } catch (error) {
    handleDatabaseError(error, OperationType.GET, 'barbearias');
  }
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
  try {
    const result = await query(`SELECT * FROM barbearias`);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      email: row.email,
      slug: row.slug,
      plan: row.plan,
      logo: row.logo,
      location: row.location,
      phone: row.phone,
      isOnboarded: row.isonboarded,
      barbers: [],
      services: [],
      createdAt: row.createdat
    }));
  } catch (error) {
    handleDatabaseError(error, OperationType.LIST, 'barbearias');
  }
}

// Subscribe to bookings in real-time (fallback to polling for PostgreSQL)
export function subscribeBookings(
  barbeariaId: string, 
  onUpdate: (bookings: Appointment[]) => void
) {
  if (barbeariaId === 'demo-barbearia-id') {
    onUpdate([]);
    return () => {};
  }

  // Initial fetch
  query(
    `SELECT * FROM bookings WHERE barbeariaId = $1 ORDER BY date, time`,
    [barbeariaId]
  ).then(result => {
    onUpdate(result.rows as Appointment[]);
  });

  // Poll every 5 seconds (PostgreSQL doesn't have real-time subscriptions like Supabase)
  const interval = setInterval(() => {
    query(
      `SELECT * FROM bookings WHERE barbeariaId = $1 ORDER BY date, time`,
      [barbeariaId]
    ).then(result => {
      onUpdate(result.rows as Appointment[]);
    });
  }, 5000);

  return () => {
    clearInterval(interval);
  };
}

// Subscribe to changes in a specific barbearia
export function subscribeBarbearia(
  barbeariaId: string, 
  onUpdate: (barbearia: Barbearia) => void
) {
  if (barbeariaId === 'demo-barbearia-id') {
    return () => {};
  }

  // Poll every 5 seconds
  const interval = setInterval(() => {
    query(
      `SELECT * FROM barbearias WHERE id = $1`,
      [barbeariaId]
    ).then(result => {
      if (result.rows.length > 0) {
        const row = result.rows[0];
        onUpdate({
          id: row.id,
          name: row.name,
          email: row.email,
          slug: row.slug,
          plan: row.plan,
          logo: row.logo,
          location: row.location,
          phone: row.phone,
          isOnboarded: row.isonboarded,
          barbers: [],
          services: [],
          createdAt: row.createdat
        });
      }
    });
  }, 5000);

  return () => {
    clearInterval(interval);
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

  try {
    // Check double-booking
    const checkResult = await query(
      `SELECT id FROM bookings WHERE barbeariaId = $1 AND barberId = $2 AND date = $3 AND time = $4`,
      [barbeariaId, booking.barberId, booking.date, booking.time]
    );

    if (checkResult.rows.length > 0) {
      throw new Error('O horário selecionado já foi reservado para este barbeiro.');
    }

    const result = await query(
      `INSERT INTO bookings (barbeariaId, barberId, clientId, clientName, clientPhone, serviceId, serviceName, date, time, status, notes, createdAt, updatedAt)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING *`,
      [
        barbeariaId, booking.barberId, booking.clientId, booking.clientName, booking.clientPhone,
        booking.serviceId, booking.serviceName, booking.date, booking.time, 'Livre', booking.notes,
        new Date().toISOString(), new Date().toISOString()
      ]
    );

    return result.rows[0] as Appointment;
  } catch (error) {
    handleDatabaseError(error, OperationType.CREATE, 'bookings');
  }
}

// Update booking status
export async function updateBookingStatus(
  bookingId: string, 
  status: 'Livre' | 'Ocupado' | 'Concluído'
): Promise<void> {
  try {
    await query(
      `UPDATE bookings SET status = $1, updatedAt = $2 WHERE id = $3`,
      [status, new Date().toISOString(), bookingId]
    );
  } catch (error) {
    handleDatabaseError(error, OperationType.UPDATE, 'bookings');
  }
}

// Delete booking
export async function deleteBookingFromDb(bookingId: string): Promise<void> {
  try {
    await query(`DELETE FROM bookings WHERE id = $1`, [bookingId]);
  } catch (error) {
    handleDatabaseError(error, OperationType.DELETE, 'bookings');
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

  try {
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        setClauses.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (setClauses.length === 0) return;

    setClauses.push(`updatedAt = $${paramIndex}`);
    values.push(new Date().toISOString());
    paramIndex++;

    values.push(barbeariaId);

    await query(
      `UPDATE barbearias SET ${setClauses.join(', ')} WHERE id = $${paramIndex}`,
      values
    );
  } catch (error) {
    handleDatabaseError(error, OperationType.UPDATE, 'barbearias');
  }
}

// Delete barbearia profile
export async function deleteBarbearia(barbeariaId: string): Promise<void> {
  if (barbeariaId === 'demo-barbearia-id') {
    return;
  }

  try {
    await query(`DELETE FROM barbearias WHERE id = $1`, [barbeariaId]);
  } catch (error) {
    handleDatabaseError(error, OperationType.DELETE, 'barbearias');
  }
}

// Get barbearia profile
export async function getBarbearia(barbeariaId: string): Promise<Barbearia | null> {
  if (barbeariaId === 'demo-barbearia-id') {
    return null;
  }

  try {
    const result = await query(
      `SELECT * FROM barbearias WHERE id = $1`,
      [barbeariaId]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      slug: row.slug,
      plan: row.plan,
      logo: row.logo,
      location: row.location,
      phone: row.phone,
      isOnboarded: row.isonboarded,
      barbers: [],
      services: [],
      createdAt: row.createdat
    };
  } catch (error) {
    handleDatabaseError(error, OperationType.GET, 'barbearias');
  }
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

  try {
    const result = await query(
      `SELECT time FROM bookings WHERE barbeariaId = $1 AND barberId = $2 AND date = $3`,
      [barbeariaId, barberId, date]
    );

    return result.rows.map(row => row.time);
  } catch (error) {
    handleDatabaseError(error, OperationType.LIST, 'bookings');
  }
}

// SuperAdmin Logs
export async function createSuperAdminLog(log: Omit<SuperAdminLog, 'id' | 'createdAt'>): Promise<void> {
  try {
    await query(
      `INSERT INTO superadmin_logs (barbeariaId, barbeariaName, action, details, performedBy, createdAt)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        log.barbeariaId,
        log.barbeariaName,
        log.action,
        JSON.stringify(log.details),
        log.performedBy || 'superadmin',
        new Date().toISOString()
      ]
    );
  } catch (err) {
    console.warn('Error saving log to DB:', err);
  }
}

export async function getSuperAdminLogs(): Promise<SuperAdminLog[]> {
  try {
    const result = await query(
      `SELECT * FROM superadmin_logs ORDER BY createdAt DESC LIMIT 100`
    );

    return result.rows.map(row => ({
      id: row.id,
      barbeariaId: row.barbeariaId,
      barbeariaName: row.barbeariaName,
      action: row.action,
      details: row.details,
      performedBy: row.performedBy,
      createdAt: row.createdAt
    }));
  } catch (err) {
    console.warn('Error reading logs:', err);
    return [];
  }
}

