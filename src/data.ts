/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PricingPlan } from './types';

export const pricingPlans: PricingPlan[] = [
  {
    name: 'Standard',
    price: 'R$ 34,90',
    period: '/mês',
    description: 'Extremamente atrativo para barbeiros individuais ou duplas que estão começando.',
    features: [
      { text: 'Agenda online inteligente', tooltip: 'Sistema de agendamento automático 24/7' },
      { text: 'Até 3 profissionais', tooltip: 'Capacidade para até 3 barbeiros simultâneos' },
      { text: 'Painel gerencial básico', tooltip: 'Visão simples do faturamento e agendamentos' },
      { text: 'Pagamentos (Pix/QR Code)', tooltip: 'Receba via Pix integrado diretamente no app' },
      { text: 'Suporte via ticket', tooltip: 'Atendimento via sistema de chamados' }
    ],
    popular: false,
    cta: 'Começar Teste Grátis'
  },
  {
    name: 'Pro Flow',
    price: 'R$ 54,90',
    period: '/mês',
    description: 'O "meio de funil" perfeito. Excelente para barbearias consolidadas de até 8 cadeiras com profissionais ilimitados.',
    features: [
      { text: 'Tudo do plano Standard', tooltip: 'Inclui todos os recursos do plano Standard' },
      { text: 'Profissionais ilimitados', tooltip: 'Sem limite de barbeiros cadastrados' },
      { text: 'Aplicativo próprio (PWA)', tooltip: 'Seu próprio app de agendamento na tela do cliente' },
      { text: 'Notificações WhatsApp (sem travamento)', tooltip: 'Lembretes automáticos garantidos' },
      { text: 'Painel gerencial completo', tooltip: 'Visão detalhada do seu negócio' },
      { text: 'Controle de estoque e ganhos', tooltip: 'Gestão de insumos e fluxo de caixa' },
      { text: 'Pagamentos completos (Pix, Cartão, QR)', tooltip: 'Sistema de pagamento robusto integrado' },
      { text: 'Suporte prioritário 24/7', tooltip: 'Atendimento via chat exclusivo' }
    ],
    popular: true,
    cta: 'Começar Teste Pro'
  },
  {
    name: 'Black Elite',
    price: 'R$ 74,90',
    period: '/mês',
    description: 'Preço competitivo para redes ou barbearias boutique de altíssimo luxo que demandam múltiplas filiais e IA.',
    features: [
      { text: 'Tudo do plano Pro Flow', tooltip: 'Inclui todos os recursos do plano Pro Flow' },
      { text: 'Múltiplas filiais/unidades', tooltip: 'Gerencie todas as suas barbearias em um só lugar' },
      { text: 'Domínio .com ou .br personalizado', tooltip: 'Seu próprio endereço na web' },
      { text: 'Relatórios com Inteligência Artificial', tooltip: 'Análise de dados avançada com IA' },
      { text: 'Gerente de conta dedicado', tooltip: 'Atendimento personalizado para seu negócio' },
      { text: 'Consultoria mensal de branding', tooltip: 'Apoio na construção da sua marca' }
    ],
    popular: false,
    cta: 'Falar com Consultor'
  }
];

export const initialAvailableHours = [
  '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];
