/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

// Mock DB Initial State
let appointments = [
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
  },
  {
    id: 'b4',
    barberId: '3', // Lucas Fontana
    serviceId: 's1', // Corte Premium
    clientName: 'Felipe Andrade',
    clientEmail: 'felipe@email.com',
    clientPhone: '(11) 96666-4444',
    date: '2026-06-26',
    time: '16:00',
    status: 'Ocupado'
  },
  {
    id: 'b5',
    barberId: '1', // Enzo Valentim
    serviceId: 's2', // Terapia de Barba
    clientName: 'Roberto Carlos',
    clientEmail: 'roberto@email.com',
    clientPhone: '(11) 95555-5555',
    date: '2026-06-27',
    time: '11:00',
    status: 'Ocupado'
  },
  {
    id: 'b6',
    barberId: '3', // Lucas Fontana
    serviceId: 's3', // Combo
    clientName: 'Gabriel Medeiros',
    clientEmail: 'gabriel.medeiros@email.com',
    clientPhone: '(21) 94444-1234',
    date: '2026-06-26',
    time: '11:00',
    status: 'Concluído'
  }
];

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json());

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Get all bookings
  app.get('/api/bookings', (req, res) => {
    res.json(appointments);
  });

  // Check double-booking slot availability
  app.post('/api/bookings/check', (req, res) => {
    const { barberId, date, time } = req.body;

    if (!barberId || !date || !time) {
       res.status(400).json({ error: 'barberId, date, and time are required' });
       return;
    }

    // Check if there is an active booking at the same date, time and barber
    const isBooked = appointments.some(
      (app) => app.barberId === barberId && app.date === date && app.time === time
    );

    res.json({ available: !isBooked });
  });

  // Book a new appointment with API-level validation
  app.post('/api/bookings', (req, res) => {
    const { barberId, serviceId, clientName, clientEmail, clientPhone, date, time } = req.body;

    if (!barberId || !serviceId || !clientName || !clientEmail || !clientPhone || !date || !time) {
       res.status(400).json({ error: 'Todos os campos são obrigatórios' });
       return;
    }

    // Server-side double booking prevention check
    const isAlreadyBooked = appointments.some(
      (app) => app.barberId === barberId && app.date === date && app.time === time
    );

    if (isAlreadyBooked) {
       res.status(409).json({ 
        error: 'Erro de Duplo Agendamento', 
        message: 'O horário selecionado já foi reservado para este barbeiro. Por favor, escolha outro horário ou profissional.' 
      });
       return;
    }

    const newAppointment = {
      id: `booking_${Date.now()}`,
      barberId,
      serviceId,
      clientName,
      clientEmail,
      clientPhone,
      date,
      time,
      status: 'Ocupado' as const
    };

    appointments.push(newAppointment);
    res.status(201).json({ success: true, booking: newAppointment });
  });

  // Update appointment status (Admin agenda action)
  app.post('/api/bookings/update-status', (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
       res.status(400).json({ error: 'id and status are required' });
       return;
    }

    const index = appointments.findIndex((app) => app.id === id);
    if (index === -1) {
       res.status(404).json({ error: 'Appointment not found' });
       return;
    }

    appointments[index].status = status;
    res.json({ success: true, booking: appointments[index] });
  });

  // Add/Quick-create booking from Admin Agenda
  app.post('/api/bookings/admin-add', (req, res) => {
    const { barberId, serviceId, clientName, clientEmail, clientPhone, date, time, status } = req.body;
    
    const isAlreadyBooked = appointments.some(
      (app) => app.barberId === barberId && app.date === date && app.time === time
    );

    if (isAlreadyBooked) {
       res.status(409).json({ 
        error: 'Double Booking', 
        message: 'Horário indisponível para este profissional.' 
      });
       return;
    }

    const newApp = {
      id: `booking_${Date.now()}`,
      barberId,
      serviceId,
      clientName,
      clientEmail: clientEmail || 'admin@barbersflow.com',
      clientPhone: clientPhone || '(11) 99999-9999',
      date,
      time,
      status: status || 'Ocupado'
    };

    appointments.push(newApp);
    res.status(201).json({ success: true, booking: newApp });
  });

  // Cancel/Delete appointment
  app.post('/api/bookings/delete', (req, res) => {
    const { id } = req.body;

    if (!id) {
       res.status(400).json({ error: 'id is required' });
       return;
    }

    const initialLength = appointments.length;
    appointments = appointments.filter((app) => app.id !== id);

    if (appointments.length === initialLength) {
       res.status(404).json({ error: 'Appointment not found' });
       return;
    }

    res.json({ success: true });
  });

  // Welcome Email for Barbearias
  app.post('/api/email/welcome', async (req, res) => {
    const { email, name, slug, plan } = req.body;

    if (!email || !name) {
      res.status(400).json({ error: 'Email and name are required' });
      return;
    }

    try {
      const resendKey = process.env.RESEND_API_KEY;
      if (!resendKey) {
        console.log(`[Email Mock] Boas-vindas para ${email} (${name}) - Slug: ${slug}, Plano: ${plan}`);
        console.log(`[Email Mock] "Olá ${name}, bem-vindo ao BarbersFlow! Seu link é: barbersflow.com/${slug}"`);
        res.json({ success: true, mock: true });
        return;
      }

      const { Resend } = await import('resend');
      const resend = new Resend(resendKey);

      const { data, error } = await resend.emails.send({
        from: 'BarbersFlow <onboarding@resend.dev>', // Usando dominio de teste do resend se n tiver dominio verificado
        to: [email],
        subject: `Bem-vindo ao BarbersFlow, ${name}! 🚀`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #1a1a1a;">Bem-vindo ao BarbersFlow!</h1>
            <p style="color: #4a4a4a; font-size: 16px;">Olá <strong>${name}</strong>,</p>
            <p style="color: #4a4a4a; font-size: 16px;">Sua barbearia foi cadastrada com sucesso com o plano <strong>${plan}</strong>.</p>
            <p style="color: #4a4a4a; font-size: 16px;">Seu link exclusivo de agendamento está pronto para ser compartilhado com seus clientes:</p>
            
            <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 24px 0; text-align: center;">
              <a href="https://barbersflow.com/${slug}" style="color: #2563eb; text-decoration: none; font-weight: bold; font-size: 18px;">
                barbersflow.com/${slug}
              </a>
            </div>

            <p style="color: #4a4a4a; font-size: 16px;">Acesse seu painel administrativo para configurar seus barbeiros, serviços e horários de funcionamento.</p>
            
            <br/>
            <p style="color: #888; font-size: 14px;">Um abraço,<br/>Equipe BarbersFlow</p>
          </div>
        `,
      });

      if (error) {
        console.error('Resend error:', error);
        res.status(500).json({ error: error.message });
        return;
      }

      res.json({ success: true, data });
    } catch (error: any) {
      console.error('Email sending failed:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Mercado Pago Checkout Endpoint
  app.post('/api/checkout', async (req, res) => {
    const { planName, price, email, title } = req.body;

    if (!planName || !price || !title) {
      res.status(400).json({ error: 'planName, price and title are required' });
      return;
    }

    try {
      const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN;
      if (!mpToken) {
        console.log(`[MercadoPago Mock] Checkout para o plano: ${planName}`);
        // Return a dummy URL for testing if no token is provided
        res.json({ success: true, init_point: 'https://sandbox.mercadopago.com.br/checkout/v1/redirect?pref_id=mock-id-123' });
        return;
      }

      // Initialize MercadoPago
      const { MercadoPagoConfig, Preference } = await import('mercadopago');
      const client = new MercadoPagoConfig({ accessToken: mpToken, options: { timeout: 5000 } });
      const preference = new Preference(client);

      // Convert price to number (it might be a string like "49.90")
      const unitPrice = typeof price === 'string' ? parseFloat(price.replace(',', '.')) : price;

      const body = {
        items: [
          {
            id: planName,
            title: title,
            quantity: 1,
            unit_price: unitPrice,
            currency_id: 'BRL',
          }
        ],
        payer: {
          email: email || 'cliente@exemplo.com'
        },
        back_urls: {
          success: 'https://barbersflow.com/admin',
          failure: 'https://barbersflow.com/admin',
          pending: 'https://barbersflow.com/admin'
        },
        auto_return: 'approved'
      };

      const result = await preference.create({ body });

      res.json({ success: true, init_point: result.init_point });
    } catch (error: any) {
      console.error('MercadoPago error:', error);
      res.status(500).json({ error: error.message || 'Erro ao gerar checkout' });
    }
  });

  // Integrate Vite as a middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
