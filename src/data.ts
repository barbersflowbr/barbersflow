/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Barber, Service, PricingPlan } from './types';

export const premiumBarbers: Barber[] = [
  {
    id: '1',
    name: 'Enzo Valentim',
    role: 'Master Barber & Fundador',
    avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=250&h=250',
    rating: 4.9,
    reviews: 142,
    specialties: ['Fade Clássico', 'Visagismo Masculino', 'Tratamentos de Couro Cabeludo'],
    assignedServices: ['s1', 's3'],
    workingHours: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], start: '09:00', end: '18:00' }
  },
  {
    id: '2',
    name: 'Gabriel Becker',
    role: 'Hair Designer & Visagista',
    avatar: 'https://images.unsplash.com/photo-1607990283143-e81e7a2c93ab?auto=format&fit=crop&q=80&w=250&h=250',
    rating: 4.8,
    reviews: 98,
    specialties: ['Cortes Modernos', 'Colorimetria/Platinado', 'Design de Sobrancelha'],
    assignedServices: ['s1', 's4'],
    workingHours: { days: ['Tue', 'Wed', 'Thu', 'Fri', 'Sat'], start: '10:00', end: '19:00' }
  },
  {
    id: '3',
    name: 'Lucas Fontana',
    role: 'Especialista em Navalha',
    avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=250&h=250',
    rating: 5.0,
    reviews: 215,
    specialties: ['Toalha Quente Tradicional', 'Alinhamento de Barba', 'Corte com Navalha'],
    assignedServices: ['s2', 's3'],
    workingHours: { days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'], start: '08:00', end: '17:00' }
  }
];

export const premiumServices: Service[] = [
  {
    id: 's1',
    name: 'Corte Premium (Fade/Social)',
    price: 70,
    duration: 45,
    category: 'Cabelo',
    description: 'Corte executado sob medida, lavagem com shampoo premium, massagem capilar e finalização com pomada modeladora.'
  },
  {
    id: 's2',
    name: 'Terapia de Barba Italiana',
    price: 55,
    duration: 35,
    category: 'Barba',
    description: 'Barba feita com navalha clássica, massagem facial, óleo hidratante, óleo de ozônio e duas toalhas quentes.'
  },
  {
    id: 's3',
    name: 'Assinatura BarbersFlow (Combo)',
    price: 115,
    duration: 80,
    category: 'Combo',
    description: 'A experiência completa: corte premium + barba italiana + hidratação capilar profunda + dose de whisky cortesia.'
  },
  {
    id: 's4',
    name: 'Selagem & Alinhamento Capilar',
    price: 130,
    duration: 60,
    category: 'Tratamento',
    description: 'Tratamento redutor de volume e frizz, alinhamento dos fios e reposição de queratina premium.'
  }
];

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Standard',
    price: 'R$ 149',
    period: '/mês',
    description: 'Perfeito para barbearias em crescimento que precisam otimizar sua agenda.',
    features: [
      'Agenda online inteligente e dinâmica',
      'Até 3 profissionais/barbeiros cadastrados',
      'Validação de double-booking via API',
      'Notificações simples via E-mail',
      'Suporte via ticket'
    ],
    popular: false,
    cta: 'Começar Teste Grátis'
  },
  {
    name: 'Pro Flow',
    price: 'R$ 289',
    period: '/mês',
    description: 'O plano mais vendido. Potencialize seu negócio e aumente sua retenção.',
    features: [
      'Tudo do plano Standard',
      'Profissionais ilimitados',
      'PWA de agendamento personalizado',
      'Notificações via WhatsApp integradas',
      'Painel Financeiro Avançado',
      'Suporte prioritário 24/7'
    ],
    popular: true,
    cta: 'Começar Teste Pro'
  },
  {
    name: 'Black Elite',
    price: 'R$ 499',
    period: '/mês',
    description: 'Para redes de barbearia ou estabelecimentos de altíssimo padrão.',
    features: [
      'Tudo do plano Pro Flow',
      'Múltiplas filiais/unidades',
      'Domínio próprio personalizado (sua-barbearia.com)',
      'Relatórios de faturamento com Inteligência Artificial',
      'Gerente de conta dedicado',
      'Consultoria mensal de branding'
    ],
    popular: false,
    cta: 'Falar com Consultor'
  }
];

export const initialAvailableHours = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];
