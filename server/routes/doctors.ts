import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const doctorsRouter = Router();

// GET doctors
doctorsRouter.get('/', (req: Request, res: Response) => {
  const { specialtyId, unitId, status, search } = req.query;
  let doctors = db.getDoctors();

  if (specialtyId && typeof specialtyId === 'string') {
    doctors = doctors.filter((d) => d.specialtyId === specialtyId);
  }

  if (unitId && typeof unitId === 'string') {
    doctors = doctors.filter((d) => d.unitIds.includes(unitId));
  }

  if (status && status !== 'all') {
    doctors = doctors.filter((d) => d.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    doctors = doctors.filter(
      (d) =>
        d.name.toLowerCase().includes(q) ||
        d.crm.toLowerCase().includes(q) ||
        d.email.toLowerCase().includes(q)
    );
  }

  return res.json(doctors);
});

// GET doctor by ID
doctorsRouter.get('/:id', (req: Request, res: Response) => {
  const doctor = db.findDoctorById(req.params.id);
  if (!doctor) {
    return res.status(404).json({ error: 'Médico não encontrado.' });
  }
  return res.json(doctor);
});

// POST create doctor
doctorsRouter.post('/', (req: Request, res: Response) => {
  const {
    name,
    crm,
    specialtyId,
    phone,
    email,
    unitIds,
    status = 'active',
    appointmentDurationMinutes = 30,
    intervalMinutes = 0,
    bio,
  } = req.body;

  if (!name || !crm || !specialtyId || !phone || !email || !unitIds || unitIds.length === 0) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios e vincule ao menos uma unidade.' });
  }

  const doctor = db.createDoctor({
    name,
    crm,
    specialtyId,
    phone,
    email,
    unitIds,
    status,
    appointmentDurationMinutes: Number(appointmentDurationMinutes) || 30,
    intervalMinutes: Number(intervalMinutes) || 0,
    bio,
    avatarUrl: `https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&auto=format&fit=crop&q=80`,
  });

  // Auto-generate standard schedule (Mon-Fri 08:00 - 17:00) for configured units
  for (const unitId of unitIds) {
    for (let day = 1; day <= 5; day++) {
      db.createSchedule({
        doctorId: doctor.id,
        unitId,
        dayOfWeek: day,
        startTime: '08:00',
        endTime: '17:00',
        appointmentDurationMinutes: doctor.appointmentDurationMinutes,
        intervalMinutes: doctor.intervalMinutes,
        status: 'open',
      });
    }
  }

  db.logAudit(
    'admin',
    'admin@medagenda.com.br',
    'admin',
    'Cadastro de médico',
    `Médico ${name} (${crm}) cadastrado com especialidade vinculada.`
  );

  return res.status(201).json(doctor);
});

// PUT update doctor
doctorsRouter.put('/:id', (req: Request, res: Response) => {
  const existing = db.findDoctorById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Médico não encontrado.' });
  }

  const updated = db.updateDoctor(req.params.id, req.body);

  db.logAudit(
    'admin',
    'admin@medagenda.com.br',
    'admin',
    'Alteração de médico',
    `Médico ${existing.name} atualizado.`
  );

  return res.json(updated);
});

// DELETE doctor
doctorsRouter.delete('/:id', (req: Request, res: Response) => {
  const existing = db.findDoctorById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Médico não encontrado.' });
  }

  db.deleteDoctor(req.params.id);

  db.logAudit(
    'admin',
    'admin@medagenda.com.br',
    'admin',
    'Exclusão de médico',
    `Médico ${existing.name} desativado/removido.`
  );

  return res.json({ success: true, message: 'Médico removido com sucesso.' });
});
