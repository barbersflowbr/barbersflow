/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PricingPlan } from './types';

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
