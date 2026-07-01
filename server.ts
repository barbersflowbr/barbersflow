/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { z } from 'zod';
import pino from 'pino';

// Supabase Client
import { createClient } from '@supabase/supabase-js';

const logger = pino();

const envSchema = z.object({
  PORT: z.string().default('3000'),
  VITE_SUPABASE_URL: z.string().url(),
  VITE_SUPABASE_ANON_KEY: z.string().min(1),
});

const env = envSchema.safeParse(process.env);
if (!env.success) {
  logger.error({ errors: env.error.format() }, 'Invalid environment variables:');
  process.exit(1);
}

const getSupabase = () => {
  return createClient(env.data.VITE_SUPABASE_URL, env.data.VITE_SUPABASE_ANON_KEY);
};
const supabase = getSupabase();

async function startServer() {
  const app = express();
  const PORT = parseInt(env.data.PORT, 10);
  app.use(express.json());

  // Logging middleware
  app.use((req, res, next) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming request');
    next();
  });

  // Scheduler to check for reminders every 5 minutes
  setInterval(async () => {
    logger.info('[Scheduler] Checking for upcoming reminders...');
    const now = new Date();
    
    const { data: upcomingBookings, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('status', 'Ocupado');

    if (error) {
        logger.error({ error }, 'Error fetching bookings for reminders');
        return;
    }

    if (upcomingBookings) {
        for (const booking of upcomingBookings) {
            // If reminded column exists, skip
            if (booking.reminded) continue;

            const appDate = new Date(`${booking.date}T${booking.time}:00`);
            const diffInHours = (appDate.getTime() - now.getTime()) / (1000 * 60 * 60);

            if (diffInHours > 0 && diffInHours <= 1) {
                logger.info({ clientPhone: booking.clientPhone }, `[WhatsApp Reminder] Enviando para ${booking.clientPhone}: Olá ${booking.clientName}, lembrete: seu agendamento na BarbersFlow está marcado para ${booking.date} às ${booking.time}.`);
                
                // Mark as reminded in DB if column exists (try/catch to avoid crash if not)
                try {
                  await supabase
                      .from('bookings')
                      .update({ reminded: true })
                      .eq('id', booking.id);
                } catch (e) {
                  logger.warn({ error: e }, 'Could not update reminder status (column might not exist)');
                }
            }
        }
    }
  }, 5 * 60 * 1000);

  // API Endpoints
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date() });
  });

  // Get all bookings
  app.get('/api/bookings', async (req, res) => {
    const { data, error } = await supabase.from('bookings').select('*');
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }
    res.json(data);
  });

  // Check double-booking slot availability
  app.post('/api/bookings/check', async (req, res) => {
    const { barberId, date, time, barbeariaId } = req.body;

    if (!barberId || !date || !time || !barbeariaId) {
       res.status(400).json({ error: 'barberId, date, time, and barbeariaId are required' });
       return;
    }

    // Check if there is an active booking at the same date, time and barber
    const { data, error } = await supabase
      .from('bookings')
      .select('id')
      .eq('barbeariaId', barbeariaId)
      .eq('barberId', barberId)
      .eq('date', date)
      .eq('time', time);
    
    if (error) {
      res.status(500).json({ error: error.message });
      return;
    }

    res.json({ available: data.length === 0 });
  });

  // Book a new appointment with API-level validation
  app.post('/api/bookings', async (req, res) => {
    const { barbeariaId, barberId, serviceId, clientName, clientEmail, clientPhone, date, time } = req.body;

    if (!barbeariaId || !barberId || !serviceId || !clientName || !clientEmail || !clientPhone || !date || !time) {
       res.status(400).json({ error: 'Todos os campos são obrigatórios' });
       return;
    }

    // Check availability in DB
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('barbeariaId', barbeariaId)
      .eq('barberId', barberId)
      .eq('date', date)
      .eq('time', time);

    if (checkError) {
       res.status(500).json({ error: checkError.message });
       return;
    }

    if (existing && existing.length > 0) {
       res.status(409).json({ 
        error: 'Erro de Duplo Agendamento', 
        message: 'O horário selecionado já foi reservado para este barbeiro.' 
      });
       return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        barbeariaId,
        barberId,
        serviceId,
        clientName,
        clientEmail,
        clientPhone,
        date,
        time,
        status: 'Ocupado'
      })
      .select()
      .single();

    if (error) {
       res.status(500).json({ error: error.message });
       return;
    }

    res.status(201).json({ success: true, booking: data });
  });

  // Update appointment status (Admin agenda action)
  app.post('/api/bookings/update-status', async (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
       res.status(400).json({ error: 'id and status are required' });
       return;
    }

    const { error } = await supabase
      .from('bookings')
      .update({ status })
      .eq('id', id);
    
    if (error) {
       res.status(500).json({ error: error.message });
       return;
    }

    res.json({ success: true });
  });

  // Add/Quick-create booking from Admin Agenda
  app.post('/api/bookings/admin-add', async (req, res) => {
    const { barbeariaId, barberId, serviceId, clientName, clientEmail, clientPhone, date, time, status } = req.body;
    
    const { data: existing, error: checkError } = await supabase
      .from('bookings')
      .select('id')
      .eq('barbeariaId', barbeariaId)
      .eq('barberId', barberId)
      .eq('date', date)
      .eq('time', time);

    if (checkError) {
        res.status(500).json({ error: checkError.message });
        return;
    }

    if (existing && existing.length > 0) {
       res.status(409).json({ 
        error: 'Double Booking', 
        message: 'Horário indisponível para este profissional.' 
      });
       return;
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert({
        barbeariaId,
        barberId,
        serviceId,
        clientName,
        clientEmail: clientEmail || 'admin@barbersflow.com',
        clientPhone: clientPhone || '(11) 99999-9999',
        date,
        time,
        status: status || 'Ocupado'
      })
      .select()
      .single();
      
    if (error) {
       res.status(500).json({ error: error.message });
       return;
    }

    res.status(201).json({ success: true, booking: data });
  });

  // Cancel/Delete appointment
  app.post('/api/bookings/delete', async (req, res) => {
    const { id } = req.body;

    if (!id) {
       res.status(400).json({ error: 'id is required' });
       return;
    }

    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id);

    if (error) {
       res.status(500).json({ error: error.message });
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
        logger.info(`[Email Mock] Boas-vindas para ${email} (${name}) - Slug: ${slug}, Plano: ${plan}`);
        logger.info(`[Email Mock] "Olá ${name}, bem-vindo ao BarbersFlow! Seu link é: barbersflow.com/${slug}"`);
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
        logger.info(`[MercadoPago Mock] Checkout para o plano: ${planName}`);
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

  // Dynamic PWA Manifest Endpoint
  app.get('/manifest.json', async (req, res) => {
    const slug = req.query.slug as string;

    const defaultManifest = {
      name: "BarbersFlow - Agendamento de Barbearias",
      short_name: "BarbersFlow",
      description: "Plataforma de agendamento online e gestão para barbearias de forma simples e rápida.",
      start_url: "/",
      id: "/",
      display: "standalone",
      orientation: "portrait",
      background_color: "#0E0E11",
      theme_color: "#F59E0B",
      categories: ["business", "utilities"],
      icons: [
        {
          src: "/logo.svg",
          sizes: "192x192",
          type: "image/svg+xml",
          purpose: "any"
        },
        {
          src: "/logo.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "any"
        },
        {
          src: "/logo.svg",
          sizes: "192x192",
          type: "image/svg+xml",
          purpose: "maskable"
        },
        {
          src: "/logo.svg",
          sizes: "512x512",
          type: "image/svg+xml",
          purpose: "maskable"
        }
      ]
    };

    if (!slug) {
      res.json(defaultManifest);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('barbearias')
        .select('name, slug, logo')
        .eq('slug', slug.toLowerCase())
        .single();

      if (error || !data) {
        logger.warn({ errorMessage: error?.message }, `Could not find barbearia with slug "${slug}" for dynamic manifest, serving default.`);
        res.json(defaultManifest);
        return;
      }

      const customManifest = {
        name: data.name,
        short_name: data.name.split(" ")[0] || data.name,
        description: `Agende seu horário na ${data.name} via BarbersFlow.`,
        start_url: `/${data.slug}`,
        id: `/${data.slug}`,
        display: "standalone",
        orientation: "portrait",
        background_color: "#0E0E11",
        theme_color: "#F59E0B",
        categories: ["business", "utilities"],
        icons: [
          {
            src: data.logo || "/logo.svg",
            sizes: "192x192",
            type: data.logo ? "image/png" : "image/svg+xml",
            purpose: "any"
          },
          {
            src: data.logo || "/logo.svg",
            sizes: "512x512",
            type: data.logo ? "image/png" : "image/svg+xml",
            purpose: "any"
          },
          {
            src: data.logo || "/logo.svg",
            sizes: "192x192",
            type: data.logo ? "image/png" : "image/svg+xml",
            purpose: "maskable"
          },
          {
            src: data.logo || "/logo.svg",
            sizes: "512x512",
            type: data.logo ? "image/png" : "image/svg+xml",
            purpose: "maskable"
          }
        ]
      };

      res.json(customManifest);
    } catch (err) {
      logger.error({ err }, "Error creating dynamic manifest");
      res.json(defaultManifest);
    }
  });

  // Global Error Handler
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    logger.error({ err }, `[Error] ${err.stack}`);
    res.status(500).json({ error: 'Internal Server Error' });
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
    logger.info(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
