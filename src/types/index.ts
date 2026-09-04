export type UserRole = 'admin' | 'patient';

export type AppointmentStatus =
  | 'scheduled'
  | 'confirmed'
  | 'cancelled'
  | 'completed'
  | 'no_show'
  | 'rescheduled';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  cpf: string;
  birthDate: string;
  status: 'active' | 'blocked';
  createdAt: string;
}

export interface Patient {
  id: string;
  userId: string;
  name: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  status: 'active' | 'blocked';
  createdAt: string;
  notes?: string;
}

export interface Doctor {
  id: string;
  userId?: string;
  name: string;
  crm: string;
  specialtyId: string;
  phone: string;
  email: string;
  unitIds: string[];
  status: 'active' | 'inactive';
  appointmentDurationMinutes: number;
  intervalMinutes: number;
  avatarUrl?: string;
  bio?: string;
  createdAt: string;
}

export interface Specialty {
  id: string;
  name: string;
  description: string;
  iconName?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Unit {
  id: string;
  name: string;
  address: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipCode: string;
  phone: string;
  email: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface DoctorSchedule {
  id: string;
  doctorId: string;
  unitId: string;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  appointmentDurationMinutes: number;
  intervalMinutes: number;
  status: 'open' | 'closed';
}

export interface ScheduleException {
  id: string;
  doctorId: string;
  unitId: string;
  date: string; // YYYY-MM-DD
  type: 'blocked' | 'extra' | 'fit_in'; // fit_in = encaixe
  startTime?: string;
  endTime?: string;
  reason?: string;
}

export interface Appointment {
  id: string;
  appointmentNumber: string; // e.g. MED-2026-0042
  patientId: string;
  patientName?: string;
  patientPhone?: string;
  patientEmail?: string;
  patientCpf?: string;
  doctorId: string;
  doctorName?: string;
  doctorCrm?: string;
  unitId: string;
  unitName?: string;
  unitAddress?: string;
  specialtyId: string;
  specialtyName?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: AppointmentStatus;
  cancellationReason?: string;
  cancelledAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  recipientUserId?: string;
  patientId?: string;
  channel: 'email' | 'sms' | 'system';
  title: string;
  message: string;
  recipient: string; // email address or phone number
  status: 'sent' | 'delivered' | 'read';
  timestamp: string;
  appointmentNumber?: string;
  metadata?: Record<string, any>;
}

export interface AuditLog {
  id: string;
  userId: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  details: string;
  timestamp: string;
  ip?: string;
}

export interface AvailableSlot {
  time: string; // HH:mm
  endTime: string; // HH:mm
  available: boolean;
  reason?: string;
  isFitIn?: boolean; // horário de encaixe
}

export interface AvailabilityResult {
  date: string;
  doctor: Doctor;
  unit: Unit;
  specialty: Specialty;
  slots: AvailableSlot[];
  isClosed: boolean;
  message?: string;
}

export interface DashboardStats {
  totalPatients: number;
  totalDoctors: number;
  totalUnits: number;
  todayAppointmentsCount: number;
  futureAppointmentsCount: number;
  cancelledAppointmentsCount: number;
  availableSlotsTodayCount: number;
  monthlyAppointmentsCount: number;
}
