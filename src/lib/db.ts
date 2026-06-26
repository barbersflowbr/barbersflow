import { 
  db, 
  auth,
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc 
} from './firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut
} from 'firebase/auth';
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

// Error handling based on firebase-integration guidelines
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export function handleFirestoreError(error: any, operationType: OperationType, path: string | null): never {
  const isPermissionDenied = error && (
    error.code === 'permission-denied' ||
    (error.message && error.message.includes('permission-denied')) ||
    (error.message && error.message.includes('Missing or insufficient permissions'))
  );

  if (isPermissionDenied) {
    const errInfo = {
      error: error instanceof Error ? error.message : String(error),
      authInfo: {
        userId: null,
        email: null,
        emailVerified: null,
        isAnonymous: null,
        tenantId: null,
        providerInfo: []
      },
      operationType,
      path
    };
    console.error('Firestore Error: ', JSON.stringify(errInfo));
    throw new Error(JSON.stringify(errInfo));
  }
  throw error;
}

// Seed default barbearia so user has an active demo account to login
export async function seedDefaultData(): Promise<Barbearia> {
  const demoEmail = 'demo@barbersflow.com';
  let snapshot;
  try {
    const q = query(collection(db, BARBEARIAS_COL), where('email', '==', demoEmail));
    snapshot = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BARBEARIAS_COL);
  }

  if (!snapshot.empty) {
    const docData = snapshot.docs[0].data();
    return { id: snapshot.docs[0].id, ...docData } as Barbearia;
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

  try {
    await setDoc(doc(db, BARBEARIAS_COL, defaultId), defaultBarbearia);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${BARBEARIAS_COL}/${defaultId}`);
  }

  // Add initial mock bookings
  const mockBookings: Appointment[] = [
    {
      id: 'b1',
      barberId: '1', // Enzo Valentim
      serviceId: 's1', // Corte Premium
      clientName: 'Rodrigo Silva',
      clientEmail: 'rodrigo@email.com',
      clientPhone: '(11) 99999-1111',
      date: '2026-06-26',
      time: '09:00',
      status: 'Concluído'
    },
    {
      id: 'b2',
      barberId: '1', // Enzo Valentim
      serviceId: 's3', // Assinatura Combo
      clientName: 'Carlos Eduardo',
      clientEmail: 'carlos@email.com',
      clientPhone: '(11) 98888-2222',
      date: '2026-06-26',
      time: '10:00',
      status: 'Ocupado'
    },
    {
      id: 'b3',
      barberId: '2', // Gabriel Becker
      serviceId: 's2', // Terapia de Barba
      clientName: 'Matheus Pereira',
      clientEmail: 'matheus@email.com',
      clientPhone: '(11) 97777-3333',
      date: '2026-06-26',
      time: '14:00',
      status: 'Ocupado'
    }
  ];

  for (const b of mockBookings) {
    const docId = `${defaultId}_${b.id}`;
    try {
      await setDoc(doc(db, BOOKINGS_COL, docId), {
        ...b,
        barbeariaId: defaultId,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${BOOKINGS_COL}/${docId}`);
    }
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

  // 1. Check if slug or email exists in Firestore
  let slugSnapshot;
  try {
    const slugQ = query(collection(db, BARBEARIAS_COL), where('slug', '==', cleanSlug));
    slugSnapshot = await getDocs(slugQ);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BARBEARIAS_COL);
  }

  if (!slugSnapshot.empty) {
    throw new Error('Este link de barbearia já está sendo usado. Escolha outro.');
  }

  let emailSnapshot;
  try {
    const emailQ = query(collection(db, BARBEARIAS_COL), where('email', '==', cleanEmail));
    emailSnapshot = await getDocs(emailQ);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BARBEARIAS_COL);
  }

  if (!emailSnapshot.empty) {
    throw new Error('Este e-mail já está cadastrado.');
  }

  // 2. Register user in Firebase Authentication
  let userCredential;
  try {
    userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
  } catch (error: any) {
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('Este e-mail já está em uso na autenticação.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('A senha deve ter no mínimo 6 caracteres.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('E-mail inválido.');
    } else {
      throw new Error(error.message || 'Erro ao cadastrar usuário na autenticação.');
    }
  }

  const id = userCredential.user.uid;
  const newBarbearia: Barbearia = {
    id,
    name,
    email: cleanEmail,
    slug: cleanSlug,
    plan,
    isOnboarded: false,
    barbers: [], // Start with empty barbers list
    services: [], // Start with empty services list
    createdAt: new Date().toISOString()
  };

  try {
    await setDoc(doc(db, BARBEARIAS_COL, id), newBarbearia);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${BARBEARIAS_COL}/${id}`);
  }
  return newBarbearia;
}

// Login barbearia
export async function loginBarbearia(email: string, password: string): Promise<Barbearia> {
  const cleanEmail = email.toLowerCase().trim();

  // 1. Authenticate with Firebase Authentication
  let userCredential;
  try {
    userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
  } catch (error: any) {
    // Special handling for pre-existing seed default user login (if not created in Auth yet)
    if (cleanEmail === 'demo@barbersflow.com' && password === '123') {
      try {
        userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      } catch (createError) {
        try {
          userCredential = await signInWithEmailAndPassword(auth, cleanEmail, password);
        } catch (fallbackError: any) {
          throw new Error('Falha ao autenticar o usuário demo.');
        }
      }
    } else {
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        throw new Error('E-mail ou senha incorretos.');
      } else if (error.code === 'auth/user-not-found') {
        throw new Error('E-mail não cadastrado.');
      } else if (error.code === 'auth/invalid-email') {
        throw new Error('E-mail inválido.');
      } else {
        throw new Error(error.message || 'Erro de autenticação.');
      }
    }
  }

  // 2. Fetch profile from Firestore
  let snapshot;
  try {
    const q = query(
      collection(db, BARBEARIAS_COL), 
      where('email', '==', cleanEmail)
    );
    snapshot = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BARBEARIAS_COL);
  }

  if (snapshot.empty) {
    throw new Error('Dados da barbearia não encontrados no banco de dados.');
  }

  const docSnap = snapshot.docs[0];
  const data = docSnap.data();
  return { id: docSnap.id, ...data } as Barbearia;
}

// Logout barbearia
export async function logoutBarbearia(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Get all barbearias (for public listing or selection if needed)
export async function getAllBarbearias(): Promise<Barbearia[]> {
  try {
    const snapshot = await getDocs(collection(db, BARBEARIAS_COL));
    return snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Barbearia));
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BARBEARIAS_COL);
  }
}

// Subscribe to bookings of a barbearia in real-time
export function subscribeBookings(
  barbeariaId: string, 
  onUpdate: (bookings: Appointment[]) => void
) {
  const q = query(
    collection(db, BOOKINGS_COL), 
    where('barbeariaId', '==', barbeariaId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: Appointment[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      list.push({
        id: doc.id,
        barberId: data.barberId,
        serviceId: data.serviceId,
        clientName: data.clientName,
        clientEmail: data.clientEmail,
        clientPhone: data.clientPhone,
        date: data.date,
        time: data.time,
        status: data.status
      });
    });
    // Sort by date then time
    list.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
    onUpdate(list);
  }, (err) => {
    console.error('Real-time bookings sync error:', err);
    handleFirestoreError(err, OperationType.LIST, BOOKINGS_COL);
  });
}

// Add a new booking
export async function addBooking(
  barbeariaId: string, 
  booking: Omit<Appointment, 'id'>
): Promise<Appointment> {
  // Check double-booking slot
  let snapshot;
  try {
    const q = query(
      collection(db, BOOKINGS_COL),
      where('barbeariaId', '==', barbeariaId),
      where('barberId', '==', booking.barberId),
      where('date', '==', booking.date),
      where('time', '==', booking.time)
    );
    snapshot = await getDocs(q);
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, BOOKINGS_COL);
  }

  if (!snapshot.empty) {
    throw new Error('O horário selecionado já foi reservado para este barbeiro.');
  }

  try {
    const docRef = await addDoc(collection(db, BOOKINGS_COL), {
      ...booking,
      barbeariaId,
      createdAt: new Date().toISOString()
    });

    return {
      id: docRef.id,
      ...booking
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, BOOKINGS_COL);
  }
}

// Update booking status
export async function updateBookingStatus(
  bookingId: string, 
  status: 'Livre' | 'Ocupado' | 'Concluído'
): Promise<void> {
  const docRef = doc(db, BOOKINGS_COL, bookingId);
  try {
    await updateDoc(docRef, { status });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BOOKINGS_COL}/${bookingId}`);
  }
}

// Delete booking
export async function deleteBookingFromDb(bookingId: string): Promise<void> {
  try {
    await deleteDoc(doc(db, BOOKINGS_COL, bookingId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${BOOKINGS_COL}/${bookingId}`);
  }
}

// Update barbearia profile / settings
export async function updateBarbearia(
  barbeariaId: string, 
  updates: Partial<Omit<Barbearia, 'id' | 'email' | 'createdAt'>>
): Promise<void> {
  const docRef = doc(db, BARBEARIAS_COL, barbeariaId);
  try {
    await updateDoc(docRef, updates);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${BARBEARIAS_COL}/${barbeariaId}`);
  }
}
