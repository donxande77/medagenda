import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const specialtiesRouter = Router();

// GET all specialties
specialtiesRouter.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  let list = db.getSpecialties();
  if (status && status !== 'all') {
    list = list.filter((s) => s.status === status);
  }
  return res.json(list);
});

// POST create specialty
specialtiesRouter.post('/', (req: Request, res: Response) => {
  const { name, description, iconName = 'Activity', status = 'active' } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'O nome da especialidade é obrigatório.' });
  }

  const created = db.createSpecialty({
    name,
    description: description || '',
    iconName,
    status,
  });

  db.logAudit('admin', 'admin@medagenda.com.br', 'admin', 'Cadastro de Especialidade', `Especialidade ${name} criada.`);
  return res.status(201).json(created);
});

// PUT update specialty
specialtiesRouter.put('/:id', (req: Request, res: Response) => {
  const existing = db.findSpecialtyById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Especialidade não encontrada.' });

  const updated = db.updateSpecialty(req.params.id, req.body);
  return res.json(updated);
});

// DELETE specialty
specialtiesRouter.delete('/:id', (req: Request, res: Response) => {
  const existing = db.findSpecialtyById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Especialidade não encontrada.' });

  db.deleteSpecialty(req.params.id);
  return res.json({ success: true });
});
