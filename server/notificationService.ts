import { NotificationItem } from '../src/types/index.ts';
import { realtimeManager } from './realtime.ts';

export interface SendNotificationParams {
  recipientUserId?: string;
  patientId?: string;
  recipientEmail?: string;
  recipientPhone?: string;
  patientName: string;
  doctorName: string;
  specialtyName: string;
  unitName: string;
  unitAddress: string;
  date: string;
  startTime: string;
  appointmentNumber: string;
  type: 'confirmation' | 'cancellation' | 'rescheduled' | 'reminder';
  reason?: string;
}

export class NotificationService {
  private notifications: NotificationItem[] = [];

  constructor() {}

  setInitialNotifications(notifications: NotificationItem[]) {
    this.notifications = notifications;
  }

  getAllNotifications(): NotificationItem[] {
    return [...this.notifications].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  getNotificationsForUser(userId?: string, patientId?: string): NotificationItem[] {
    return this.notifications.filter(
      (n) =>
        (userId && n.recipientUserId === userId) ||
        (patientId && n.patientId === patientId)
    ).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Automated dispatch of Email, SMS and in-app system notification
   */
  dispatchAppointmentNotifications(params: SendNotificationParams): {
    emailNotification: NotificationItem;
    smsNotification: NotificationItem;
    systemNotification: NotificationItem;
  } {
    const timestamp = new Date().toISOString();
    const formattedDate = this.formatDatePtBr(params.date);

    let emailSubject = '';
    let emailBody = '';
    let smsBody = '';
    let systemTitle = '';
    let systemBody = '';

    if (params.type === 'confirmation') {
      emailSubject = `Confirmação de Consulta - ${params.appointmentNumber} | MedAgenda`;
      emailBody = `Olá, ${params.patientName}!\n\nSua consulta foi confirmada com sucesso na MedAgenda.\n\nDetalhes do Agendamento:\n- Código da Consulta: ${params.appointmentNumber}\n- Médico(a): ${params.doctorName}\n- Especialidade: ${params.specialtyName}\n- Unidade: ${params.unitName}\n- Endereço: ${params.unitAddress}\n- Data: ${formattedDate}\n- Horário: ${params.startTime}\n\nPor favor, chegue com 15 minutos de antecedência portando documento com foto e carteirinha de convênio se houver.\n\nAtenciosamente,\nEquipe MedAgenda`;
      smsBody = `[MedAgenda] Consulta CONFIRMADA com ${params.doctorName} (${params.specialtyName}) em ${formattedDate} às ${params.startTime} na ${params.unitName}. Ref: ${params.appointmentNumber}`;
      systemTitle = `Consulta Confirmada (#${params.appointmentNumber})`;
      systemBody = `Sua consulta com ${params.doctorName} foi agendada para ${formattedDate} às ${params.startTime}.`;
    } else if (params.type === 'cancellation') {
      emailSubject = `Cancelamento de Consulta - ${params.appointmentNumber} | MedAgenda`;
      emailBody = `Olá, ${params.patientName}.\n\nInformamos que sua consulta com ${params.doctorName} marcada para ${formattedDate} às ${params.startTime} foi cancelada.\n${params.reason ? `Motivo: ${params.reason}\n` : ''}\nCaso queira realizar um novo agendamento, acesse nosso portal ou contate a unidade.\n\nAtenciosamente,\nEquipe MedAgenda`;
      smsBody = `[MedAgenda] Sua consulta ${params.appointmentNumber} com ${params.doctorName} em ${formattedDate} às ${params.startTime} foi CANCELADA. Acesse o sistema para reagendar.`;
      systemTitle = `Consulta Cancelada (#${params.appointmentNumber})`;
      systemBody = `Sua consulta com ${params.doctorName} para ${formattedDate} foi cancelada.`;
    } else if (params.type === 'rescheduled') {
      emailSubject = `Reagendamento de Consulta - ${params.appointmentNumber} | MedAgenda`;
      emailBody = `Olá, ${params.patientName}!\n\nSua consulta ${params.appointmentNumber} foi REAGENDADA com sucesso.\n\nNovos dados:\n- Médico(a): ${params.doctorName}\n- Especialidade: ${params.specialtyName}\n- Unidade: ${params.unitName}\n- Nova Data: ${formattedDate}\n- Novo Horário: ${params.startTime}\n\nAtenciosamente,\nEquipe MedAgenda`;
      smsBody = `[MedAgenda] Consulta REAGENDADA: ${params.doctorName} em ${formattedDate} às ${params.startTime} na ${params.unitName}. Ref: ${params.appointmentNumber}`;
      systemTitle = `Consulta Reagendada (#${params.appointmentNumber})`;
      systemBody = `Sua consulta foi alterada para ${formattedDate} às ${params.startTime}.`;
    } else {
      emailSubject = `Lembrete de Consulta - Amanhã | MedAgenda`;
      emailBody = `Olá, ${params.patientName}! Lembrando da sua consulta com ${params.doctorName} marcada para ${formattedDate} às ${params.startTime} na ${params.unitName}.`;
      smsBody = `[MedAgenda] LEMBRETE: Sua consulta é amanhã (${formattedDate}) às ${params.startTime} com ${params.doctorName}. Chegue com 15 min de antecedência.`;
      systemTitle = `Lembrete de Consulta (#${params.appointmentNumber})`;
      systemBody = `Lembrete da consulta com ${params.doctorName} para ${formattedDate} às ${params.startTime}.`;
    }

    // 1. Email Notification Record
    const emailNotification: NotificationItem = {
      id: `notif_email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientUserId: params.recipientUserId,
      patientId: params.patientId,
      channel: 'email',
      title: emailSubject,
      message: emailBody,
      recipient: params.recipientEmail || 'paciente@medagenda.com.br',
      status: 'sent',
      timestamp,
      appointmentNumber: params.appointmentNumber,
      metadata: {
        doctorName: params.doctorName,
        date: params.date,
        time: params.startTime,
        unit: params.unitName,
      },
    };

    // 2. SMS Notification Record
    const smsNotification: NotificationItem = {
      id: `notif_sms_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientUserId: params.recipientUserId,
      patientId: params.patientId,
      channel: 'sms',
      title: 'SMS de Confirmação Automática',
      message: smsBody,
      recipient: params.recipientPhone || '(11) 99999-0000',
      status: 'delivered',
      timestamp,
      appointmentNumber: params.appointmentNumber,
      metadata: {
        charCount: smsBody.length,
        carrierGateway: 'MedAgenda SMS Gateway (Auto)',
      },
    };

    // 3. System In-App Notification Record
    const systemNotification: NotificationItem = {
      id: `notif_sys_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      recipientUserId: params.recipientUserId,
      patientId: params.patientId,
      channel: 'system',
      title: systemTitle,
      message: systemBody,
      recipient: 'App Portal',
      status: 'sent',
      timestamp,
      appointmentNumber: params.appointmentNumber,
    };

    this.notifications.unshift(systemNotification, emailNotification, smsNotification);

    // Broadcast in real-time
    realtimeManager.broadcast('NOTIFICATION_RECEIVED', {
      notifications: [systemNotification, emailNotification, smsNotification],
    });

    return {
      emailNotification,
      smsNotification,
      systemNotification,
    };
  }

  private formatDatePtBr(dateStr: string): string {
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  }
}

export const notificationService = new NotificationService();
