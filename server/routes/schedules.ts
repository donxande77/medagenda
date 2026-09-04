import { Router, Request, Response } from 'express';
import { db } from '../db.ts';
import { realtimeManager } from '../realtime.ts';

export const schedulesRouter = Router();

// GET all schedules
schedulesRouter.get('/', (req: Request, res: Response) => {
  const { doctorId, unitId } = req.query;
  const schedules = db.getSchedules(
    doctorId ? String(doctorId) : undefined,
    unitId ? String(unitId) : undefined
  );
  return res.json(schedules);
});

// POST create schedule
schedulesRouter.post('/', (req: Request, res: Response) => {
  const { doctorId, unitId, dayOfWeek, startTime, endTime, appointmentDurationMinutes = 30, intervalMinutes = 0, status = 'open' } = req.body;

  if (!doctorId || !unitId || dayOfWeek === undefined || !startTime || !endTime) {
    return res.status(400).json({ error: 'Campos obrigatórios incompletos para a agenda.' });
  }

  const schedule = db.createSchedule({
    doctorId,
    unitId,
    dayOfWeek: Number(dayOfWeek),
    startTime,
    endTime,
    appointmentDurationMinutes: Number(appointmentDurationMinutes),
    intervalMinutes: Number(intervalMinutes),
    status,
  });

  db.logAudit(
    'admin',
    'admin@medagenda.com.br',
    'admin',
    'Criação de agenda',
    `Agenda criada para médico ${doctorId} no dia ${dayOfWeek} (${startTime} - ${endTime})`
  );

  realtimeManager.broadcast('SCHEDULE_UPDATED', { doctorId, unitId });
  return res.status(201).json(schedule);
});

// PUT update schedule
schedulesRouter.put('/:id', (req: Request, res: Response) => {
  const updated = db.updateSchedule(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Agenda não encontrada.' });

  db.logAudit('admin', 'admin@medagenda.com.br', 'admin', 'Alteração de agenda', `Agenda ${req.params.id} atualizada.`);
  realtimeManager.broadcast('SCHEDULE_UPDATED', { scheduleId: req.params.id });
  return res.json(updated);
});

// DELETE schedule
schedulesRouter.delete('/:id', (req: Request, res: Response) => {
  const success = db.deleteSchedule(req.params.id);
  if (!success) return res.status(404).json({ error: 'Agenda não encontrada.' });

  realtimeManager.broadcast('SCHEDULE_UPDATED', { scheduleId: req.params.id });
  return res.json({ success: true });
});

// GET Availability (Crucial for Patient Flow)
schedulesRouter.get('/availability', (req: Request, res: Response) => {
  const { doctorId, unitId, specialtyId, date } = req.query;

  if (!doctorId || !unitId || !specialtyId || !date) {
    return res.status(400).json({ error: 'doctorId, unitId, specialtyId e date são obrigatórios.' });
  }

  const result = db.getAvailability({
    doctorId: String(doctorId),
    unitId: String(unitId),
    specialtyId: String(specialtyId),
    date: String(date),
  });

  return res.json(result);
});

// GET exceptions
schedulesRouter.get('/exceptions', (req: Request, res: Response) => {
  const { doctorId, date } = req.query;
  const exceptions = db.getExceptions(
    doctorId ? String(doctorId) : undefined,
    date ? String(date) : undefined
  );
  return res.json(exceptions);
});

// POST create exception (Bloquear horário, Liberar horário, Encaixe, Horário extra)
schedulesRouter.post('/exceptions', (req: Request, res: Response) => {
  const { doctorId, unitId, date, type, startTime, endTime, reason } = req.body;

  if (!doctorId || !unitId || !date || !type) {
    return res.status(400).json({ error: 'Campos obrigatórios incompletos para a exceção de agenda.' });
  }

  const exc = db.createException({
    doctorId,
    unitId,
    date,
    type,
    startTime,
    endTime,
    reason,
  });

  db.logAudit(
    'admin',
    'admin@medagenda.com.br',
    'admin',
    type === 'blocked' ? 'Bloqueio de horário' : 'Criação de encaixe/extra',
    `Exceção (${type}) registrada para o médico ${doctorId} em ${date} ${startTime ? `às ${startTime}` : ''}`
  );

  // Broadcast in real-time so patients immediately see blocked/unblocked slot
  realtimeManager.broadcast('AVAILABILITY_CHANGED', { doctorId, unitId, date });

  return res.status(201).json(exc);
});

// DELETE exception
schedulesRouter.delete('/exceptions/:id', (req: Request, res: Response) => {
  const success = db.deleteException(req.params.id);
  if (!success) return res.status(404).json({ error: 'Exceção não encontrada.' });

  realtimeManager.broadcast('AVAILABILITY_CHANGED', { exceptionId: req.params.id });
  return res.json({ success: true });
});
