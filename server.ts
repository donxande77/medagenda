import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authRouter } from './server/routes/auth.ts';
import { patientsRouter } from './server/routes/patients.ts';
import { doctorsRouter } from './server/routes/doctors.ts';
import { specialtiesRouter } from './server/routes/specialties.ts';
import { unitsRouter } from './server/routes/units.ts';
import { schedulesRouter } from './server/routes/schedules.ts';
import { appointmentsRouter } from './server/routes/appointments.ts';
import { reportsRouter } from './server/routes/reports.ts';
import { notificationsRouter } from './server/routes/notifications.ts';
import { realtimeManager } from './server/realtime.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'MedAgenda API',
      timestamp: new Date().toISOString(),
      connectedClients: realtimeManager.getClientCount(),
    });
  });

  // Real-time SSE Stream Endpoint
  app.get('/api/realtime/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Prevent proxy buffering
    res.flushHeaders();

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const userId = req.query.userId ? String(req.query.userId) : undefined;
    const role = req.query.role ? String(req.query.role) : undefined;

    realtimeManager.addClient(clientId, res, userId, role);

    // Keep connection alive with periodic comment ping
    const keepAlive = setInterval(() => {
      res.write(': ping\n\n');
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
    });
  });

  // Mount API Routers
  app.use('/api/auth', authRouter);
  app.use('/api/patients', patientsRouter);
  app.use('/api/doctors', doctorsRouter);
  app.use('/api/specialties', specialtiesRouter);
  app.use('/api/units', unitsRouter);
  app.use('/api/schedules', schedulesRouter);
  app.use('/api/appointments', appointmentsRouter);
  app.use('/api/reports', reportsRouter);
  app.use('/api/notifications', notificationsRouter);

  // Vite middleware for development / static files for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MedAgenda Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start MedAgenda server:', err);
});
