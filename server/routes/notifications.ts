import { Router, Request, Response } from 'express';
import { notificationService } from '../notificationService.ts';

export const notificationsRouter = Router();

// GET notifications (filter by userId / patientId or admin gets all)
notificationsRouter.get('/', (req: Request, res: Response) => {
  const { userId, patientId, channel } = req.query;

  let list = notificationService.getAllNotifications();

  if (patientId) {
    list = list.filter((n) => n.patientId === patientId || n.recipientUserId === userId);
  } else if (userId) {
    list = list.filter((n) => n.recipientUserId === userId);
  }

  if (channel && channel !== 'all') {
    list = list.filter((n) => n.channel === channel);
  }

  return res.json(list);
});
