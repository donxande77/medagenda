import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const unitsRouter = Router();

// GET all units
unitsRouter.get('/', (req: Request, res: Response) => {
  const { status } = req.query;
  let list = db.getUnits();
  if (status && status !== 'all') {
    list = list.filter((u) => u.status === status);
  }
  return res.json(list);
});

// POST create unit
unitsRouter.post('/', (req: Request, res: Response) => {
  const { name, address, number, complement, neighborhood, city, state, zipCode, phone, email, status = 'active' } = req.body;
  if (!name || !address || !number || !city || !state || !phone) {
    return res.status(400).json({ error: 'Preencha os dados obrigatórios da unidade.' });
  }

  const created = db.createUnit({
    name,
    address,
    number,
    complement,
    neighborhood: neighborhood || '',
    city,
    state,
    zipCode: zipCode || '',
    phone,
    email: email || '',
    status,
  });

  db.logAudit('admin', 'admin@medagenda.com.br', 'admin', 'Cadastro de Unidade', `Unidade ${name} cadastrada.`);
  return res.status(201).json(created);
});

// PUT update unit
unitsRouter.put('/:id', (req: Request, res: Response) => {
  const existing = db.findUnitById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Unidade não encontrada.' });

  const updated = db.updateUnit(req.params.id, req.body);
  return res.json(updated);
});

// DELETE unit
unitsRouter.delete('/:id', (req: Request, res: Response) => {
  const existing = db.findUnitById(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Unidade não encontrada.' });

  db.deleteUnit(req.params.id);
  return res.json({ success: true });
});
