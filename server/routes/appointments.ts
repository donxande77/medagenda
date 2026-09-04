import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const appointmentsRouter = Router();

// GET appointments with rich filters
appointmentsRouter.get('/', (req: Request, res: Response) => {
  const { patientId, doctorId, unitId, specialtyId, date, status, period } = req.query;

  let appointments = db.getAppointments({
    patientId: patientId ? String(patientId) : undefined,
    doctorId: doctorId ? String(doctorId) : undefined,
    unitId: unitId ? String(unitId) : undefined,
    specialtyId: specialtyId ? String(specialtyId) : undefined,
    date: date ? String(date) : undefined,
    status: status ? String(status) : undefined,
  });

  // Filter by period if requested (e.g. 'today', 'upcoming', 'past')
  const today = new Date().toISOString().split('T')[0];
  if (period === 'today') {
    appointments = appointments.filter((a) => a.date === today);
  } else if (period === 'upcoming') {
    appointments = appointments.filter((a) => a.date >= today && a.status !== 'cancelled');
  } else if (period === 'past') {
    appointments = appointments.filter((a) => a.date < today);
  }

  return res.json(appointments);
});

// GET single appointment by ID
appointmentsRouter.get('/:id', (req: Request, res: Response) => {
  const appointment = db.findAppointmentById(req.params.id);
  if (!appointment) {
    return res.status(404).json({ error: 'Consulta não encontrada.' });
  }
  return res.json(appointment);
});

// POST Atomic Appointment Booking
appointmentsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { patientId, doctorId, unitId, specialtyId, date, startTime, notes } = req.body;

    if (!patientId || !doctorId || !unitId || !specialtyId || !date || !startTime) {
      return res.status(400).json({ error: 'Dados incompletos para efetuar o agendamento.' });
    }

    // Call database atomic booking with concurrency locks
    const result = await db.bookAppointmentAtomic({
      patientId,
      doctorId,
      unitId,
      specialtyId,
      date,
      startTime,
      notes,
    });

    if (!result.success) {
      // Return 409 Conflict if slot is already occupied or conflict occurs
      return res.status(409).json({ error: result.error });
    }

    return res.status(201).json(result.appointment);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao agendar consulta.' });
  }
});

// POST Cancel Appointment
appointmentsRouter.post('/:id/cancel', async (req: Request, res: Response) => {
  try {
    const { reason, userId } = req.body;
    const appointmentId = req.params.id;

    const result = await db.cancelAppointmentAtomic(appointmentId, userId || 'sistema', reason);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Consulta cancelada com sucesso. O horário foi liberado na agenda.',
      appointment: result.appointment,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao cancelar consulta.' });
  }
});

// POST Reschedule Appointment
appointmentsRouter.post('/:id/reschedule', async (req: Request, res: Response) => {
  try {
    const { newDate, newStartTime, userId } = req.body;
    const appointmentId = req.params.id;

    if (!newDate || !newStartTime) {
      return res.status(400).json({ error: 'Nova data e novo horário são obrigatórios.' });
    }

    const result = await db.rescheduleAppointmentAtomic(
      appointmentId,
      newDate,
      newStartTime,
      userId || 'sistema'
    );

    if (!result.success) {
      return res.status(409).json({ error: result.error });
    }

    return res.json({
      success: true,
      message: 'Consulta reagendada com sucesso.',
      appointment: result.appointment,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Erro ao reagendar consulta.' });
  }
});
