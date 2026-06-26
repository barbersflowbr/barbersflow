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
  const PORT = 3000;

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
