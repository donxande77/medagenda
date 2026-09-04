import {
  User,
  Patient,
  Doctor,
  Specialty,
  Unit,
  DoctorSchedule,
  ScheduleException,
  Appointment,
  NotificationItem,
  AuditLog,
  AvailabilityResult,
  DashboardStats,
} from '../types/index.ts';

const BASE_URL = '/api';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('medagenda_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição ao servidor.');
  }

  return data as T;
}

export const api = {
  // AUTH
  auth: {
    login: (body: { email: string; password: string }) =>
      request<{ user: User; patient?: Patient; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    register: (body: any) =>
      request<{ user: User; patient: Patient; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    me: () => request<{ user: User; patient?: Patient }>('/auth/me'),
    forgotPassword: (email: string) =>
      request<{ message: string; demoResetCode?: string }>('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email }),
      }),
    resetPassword: (body: { email: string; newPassword: string }) =>
      request<{ message: string }>('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
    logout: (userId?: string) =>
      request<{ message: string }>('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }),
  },

  // PATIENTS
  patients: {
    list: (params?: { search?: string; status?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<Patient[]>(`/patients${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request<Patient>(`/patients/${id}`),
    create: (data: any) =>
      request<Patient>('/patients', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<Patient>(`/patients/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/patients/${id}`, {
        method: 'DELETE',
      }),
    getAppointments: (id: string) =>
      request<Appointment[]>(`/patients/${id}/appointments`),
  },

  // DOCTORS
  doctors: {
    list: (params?: { specialtyId?: string; unitId?: string; status?: string; search?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<Doctor[]>(`/doctors${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request<Doctor>(`/doctors/${id}`),
    create: (data: any) =>
      request<Doctor>('/doctors', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<Doctor>(`/doctors/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/doctors/${id}`, {
        method: 'DELETE',
      }),
  },

  // SPECIALTIES
  specialties: {
    list: (paramsOrStatus?: string | { status?: string }) => {
      const status = typeof paramsOrStatus === 'string' ? paramsOrStatus : paramsOrStatus?.status;
      return request<Specialty[]>(`/specialties${status ? `?status=${status}` : ''}`);
    },
    create: (data: any) =>
      request<Specialty>('/specialties', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<Specialty>(`/specialties/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/specialties/${id}`, {
        method: 'DELETE',
      }),
  },

  // UNITS
  units: {
    list: (paramsOrStatus?: string | { status?: string }) => {
      const status = typeof paramsOrStatus === 'string' ? paramsOrStatus : paramsOrStatus?.status;
      return request<Unit[]>(`/units${status ? `?status=${status}` : ''}`);
    },
    create: (data: any) =>
      request<Unit>('/units', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<Unit>(`/units/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/units/${id}`, {
        method: 'DELETE',
      }),
  },

  // SCHEDULES & AVAILABILITY
  schedules: {
    list: (params?: { doctorId?: string; unitId?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<DoctorSchedule[]>(`/schedules${query ? `?${query}` : ''}`);
    },
    create: (data: any) =>
      request<DoctorSchedule>('/schedules', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    update: (id: string, data: any) =>
      request<DoctorSchedule>(`/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ success: boolean }>(`/schedules/${id}`, {
        method: 'DELETE',
      }),
    getAvailability: (params: {
      doctorId: string;
      unitId: string;
      specialtyId: string;
      date: string;
    }) => {
      const query = new URLSearchParams(params).toString();
      return request<AvailabilityResult>(`/schedules/availability?${query}`);
    },
    getExceptions: (params?: { doctorId?: string; date?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<ScheduleException[]>(`/schedules/exceptions${query ? `?${query}` : ''}`);
    },
    createException: (data: any) =>
      request<ScheduleException>('/schedules/exceptions', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    deleteException: (id: string) =>
      request<{ success: boolean }>(`/schedules/exceptions/${id}`, {
        method: 'DELETE',
      }),
  },

  // APPOINTMENTS
  appointments: {
    list: (params?: {
      patientId?: string;
      doctorId?: string;
      unitId?: string;
      specialtyId?: string;
      date?: string;
      status?: string;
      period?: 'today' | 'upcoming' | 'past';
    }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<Appointment[]>(`/appointments${query ? `?${query}` : ''}`);
    },
    getById: (id: string) => request<Appointment>(`/appointments/${id}`),
    book: (data: {
      patientId: string;
      doctorId: string;
      unitId: string;
      specialtyId: string;
      date: string;
      startTime: string;
      notes?: string;
    }) =>
      request<Appointment>('/appointments', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    cancel: (id: string, body: { reason?: string; userId?: string }) =>
      request<{ success: boolean; message: string; appointment: Appointment }>(
        `/appointments/${id}/cancel`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      ),
    reschedule: (
      id: string,
      body: { newDate: string; newStartTime: string; userId?: string }
    ) =>
      request<{ success: boolean; message: string; appointment: Appointment }>(
        `/appointments/${id}/reschedule`,
        {
          method: 'POST',
          body: JSON.stringify(body),
        }
      ),
  },

  // REPORTS & AUDIT
  reports: {
    getDashboardStats: () => request<DashboardStats>('/reports/dashboard-stats'),
    getAnalytics: () => request<any>('/reports/analytics'),
    getAuditLogs: () => request<AuditLog[]>('/reports/audit-logs'),
  },

  // NOTIFICATIONS
  notifications: {
    list: (params?: { userId?: string; patientId?: string; channel?: string }) => {
      const query = new URLSearchParams(params as any).toString();
      return request<NotificationItem[]>(`/notifications${query ? `?${query}` : ''}`);
    },
  },
};
