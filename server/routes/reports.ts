import { Router, Request, Response } from 'express';
import { db } from '../db.ts';

export const reportsRouter = Router();

// GET dashboard stats for admin cards
reportsRouter.get('/dashboard-stats', (req: Request, res: Response) => {
  const stats = db.getDashboardStats();
  return res.json(stats);
});

// GET complete analytics reports
reportsRouter.get('/analytics', (req: Request, res: Response) => {
  const reports = db.getReports();
  return res.json(reports);
});

// GET system audit logs
reportsRouter.get('/audit-logs', (req: Request, res: Response) => {
  const logs = db.getAuditLogs();
  return res.json(logs);
});
