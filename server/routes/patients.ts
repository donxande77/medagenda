import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const patientsRouter = Router();

// GET all patients
patientsRouter.get('/', (req: Request, res: Response) => {
  const { search, status } = req.query;
  let patients = db.getPatients();

  if (status && status !== 'all') {
    patients = patients.filter((p) => p.status === status);
  }

  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    patients = patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.cpf.includes(q) ||
        p.email.toLowerCase().includes(q) ||
        p.phone.includes(q)
    );
  }

  return res.json(patients);
});

// GET patient by ID
patientsRouter.get('/:id', (req: Request, res: Response) => {
  const patient = db.findPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }
  return res.json(patient);
});

// POST create patient (Admin)
patientsRouter.post('/', (req: Request, res: Response) => {
  const { name, cpf, birthDate, phone, email, notes, password } = req.body;

  if (!name || !cpf || !birthDate || !phone || !email) {
    return res.status(400).json({ error: 'Preencha todos os campos obrigatórios.' });
  }

  if (db.findUserByCpf(cpf)) {
    return res.status(400).json({ error: 'Já existe um paciente cadastrado com este CPF.' });
  }

  if (db.findUserByEmail(email)) {
    return res.status(400).json({ error: 'Já existe um paciente cadastrado com este e-mail.' });
  }

  // Create user account for patient
  const user = db.createUser(
    {
      name,
      email: email.toLowerCase(),
      role: 'patient',
      phone,
      cpf,
      birthDate,
      status: 'active',
    },
    password || 'Paciente@123'
  );

  const patient = db.createPatient({
    userId: user.id,
    name,
    cpf,
    birthDate,
    phone,
    email,
    status: 'active',
    notes,
  });

  db.logAudit(
    'admin',
    'admin@medagenda.com.br',
    'admin',
    'Cadastro de paciente',
    `Paciente ${name} (CPF: ${cpf}) cadastrado pelo administrador.`
  );

  return res.status(201).json(patient);
});

// PUT update patient (Edit, Block, Unblock)
patientsRouter.put('/:id', (req: Request, res: Response) => {
  const { name, phone, email, status, notes } = req.body;
  const existing = db.findPatientById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const updated = db.updatePatient(req.params.id, {
    name: name !== undefined ? name : existing.name,
    phone: phone !== undefined ? phone : existing.phone,
    email: email !== undefined ? email : existing.email,
    status: status !== undefined ? status : existing.status,
    notes: notes !== undefined ? notes : existing.notes,
  });

  db.logAudit(
    'admin',
    'admin@medagenda.com.br',
    'admin',
    'Alteração de paciente',
    `Paciente ${existing.name} atualizado. Status: ${status || existing.status}`
  );

  return res.json(updated);
});

// DELETE patient
patientsRouter.delete('/:id', (req: Request, res: Response) => {
  const existing = db.findPatientById(req.params.id);
  if (!existing) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  db.deletePatient(req.params.id);

  db.logAudit(
    'admin',
    'admin@medagenda.com.br',
    'admin',
    'Exclusão de paciente',
    `Paciente ${existing.name} removido.`
  );

  return res.json({ success: true, message: 'Paciente excluído com sucesso.' });
});

// GET patient appointment history
patientsRouter.get('/:id/appointments', (req: Request, res: Response) => {
  const patient = db.findPatientById(req.params.id);
  if (!patient) {
    return res.status(404).json({ error: 'Paciente não encontrado.' });
  }

  const appointments = db.getAppointments({ patientId: req.params.id });
  return res.json(appointments);
});
