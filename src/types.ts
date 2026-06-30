/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Barber {
  id: string;
  name: string;
  role: string;
  avatar: string;
  rating: number;
  reviews: number;
  specialties: string[];
  assignedServices: string[];
  workingHours: {
    days: string[];
    start: string;
    end: string;
    slotInterval?: number; // in minutes (e.g. 15, 30, 45, 60)
  };
  clientPreferences?: Record<string, string>; // Maps clientEmail or clientPhone to preference text
}

export interface InventoryItem {
  id: string;
  name: string;
  category: 'Pomada' | 'Shampoo' | 'Lâmina' | 'Outros';
  stock: number;
  minStock: number;
  unit: string; // e.g., 'unidades', 'ml', 'caixas'
  costPrice?: number;
  lastUpdated?: string;
}

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  category: 'Cabelo' | 'Barba' | 'Combo' | 'Tratamento';
  description: string;
}

export interface Appointment {
  id: string;
  barberId: string;
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  status: 'Livre' | 'Ocupado' | 'Concluído';
}

export interface Client {
  id: string;
  name: string;
  phone: string;
  email?: string;
  notes?: string;
  loyaltyPoints?: number;
  createdAt: string;
}

export interface Metric {
  label: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
}

export interface Feature {
  text: string;
  tooltip?: string;
}

export interface PricingPlan {
  name: string;
  price: string;
  period: string;
  description: string;
  features: Feature[];
  popular: boolean;
  cta: string;
}

export interface SuperAdminLog {
  id?: string;
  barbeariaId?: string | null;
  barbeariaName?: string | null;
  action: string; // 'plan_change' | 'status_change' | 'expiration_change' | 'onboarding_toggle' | 'barbearia_delete' | etc.
  details: string;
  performedBy?: string;
  createdAt?: string;
}

