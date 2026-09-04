import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { api } from '../../services/api.ts';
import { Appointment, AvailableSlot } from '../../types/index.ts';
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  XCircle,
  CalendarSync,
  CalendarPlus,
  AlertTriangle,
  CheckCircle2,
  Filter,
  ArrowRight,
  Info,
  X,
  FileText,
} from 'lucide-react';

interface Props {
  onNewBookingClick: () => void;
}

export const MyAppointments: React.FC<Props> = ({ onNewBookingClick }) => {
  const { currentPatient, currentUser } = useAuth();
  const { subscribe } = useRealtime();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [filter, setFilter] = useState<'all' | 'scheduled' | 'completed' | 'cancelled'>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState<boolean>(false);
  const [cancelReason, setCancelReason] = useState<string>('');
  const [isCancelling, setIsCancelling] = useState<boolean>(false);

  // Reschedule state
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState<boolean>(false);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleSlots, setRescheduleSlots] = useState<AvailableSlot[]>([]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState<boolean>(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const loadAppointments = async () => {
    if (!currentPatient?.id) return;
    try {
      const list = await api.appointments.list({ patientId: currentPatient.id });
      setAppointments(list);
    } catch (err) {
      console.error('Error loading appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [currentPatient?.id]);

  // Real-time synchronization
  useEffect(() => {
    const unsub = subscribe((event) => {
      if (
        event.type === 'APPOINTMENT_BOOKED' ||
        event.type === 'APPOINTMENT_CANCELLED' ||
        event.type === 'APPOINTMENT_RESCHEDULED'
      ) {
        loadAppointments();
      }
    });
    return () => unsub();
  }, [subscribe]);

  // Cancel Appointment handler
  const handleConfirmCancel = async () => {
    if (!selectedAppointment) return;
    setIsCancelling(true);
    try {
      await api.appointments.cancel(selectedAppointment.id, {
        reason: cancelReason || 'Cancelado pelo paciente',
        userId: currentUser?.id,
      });
      setIsCancelModalOpen(false);
      setSelectedAppointment(null);
      setCancelReason('');
      await loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar consulta.');
    } finally {
      setIsCancelling(false);
    }
  };

  // Open Reschedule Modal & fetch available slots for initial date
  const handleOpenReschedule = async (app: Appointment) => {
    setSelectedAppointment(app);
    setRescheduleDate(app.date);
    setSelectedRescheduleSlot('');
    setRescheduleError(null);
    setIsRescheduleModalOpen(true);

    try {
      const res = await api.schedules.getAvailability({
        doctorId: app.doctorId,
        unitId: app.unitId,
        specialtyId: app.specialtyId,
        date: app.date,
      });
      setRescheduleSlots(res.slots);
    } catch (err) {
      console.error('Error fetching reschedule availability:', err);
    }
  };

  const handleDateChangeForReschedule = async (newDate: string) => {
    setRescheduleDate(newDate);
    setSelectedRescheduleSlot('');
    setRescheduleError(null);
    if (!selectedAppointment) return;

    try {
      const res = await api.schedules.getAvailability({
        doctorId: selectedAppointment.doctorId,
        unitId: selectedAppointment.unitId,
        specialtyId: selectedAppointment.specialtyId,
        date: newDate,
      });
      setRescheduleSlots(res.slots);
    } catch (err) {
      console.error('Error fetching slots:', err);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedAppointment || !rescheduleDate || !selectedRescheduleSlot) {
      setRescheduleError('Por favor selecione data e horário.');
      return;
    }

    setIsRescheduling(true);
    setRescheduleError(null);

    try {
      await api.appointments.reschedule(selectedAppointment.id, {
        newDate: rescheduleDate,
        newStartTime: selectedRescheduleSlot,
        userId: currentUser?.id,
      });
      setIsRescheduleModalOpen(false);
      setSelectedAppointment(null);
      await loadAppointments();
    } catch (err: any) {
      setRescheduleError(err.message || 'Erro ao reagendar consulta.');
    } finally {
      setIsRescheduling(false);
    }
  };

  // Download iCal (.ics)
  const handleDownloadIcs = (app: Appointment) => {
    const [year, month, day] = app.date.split('-');
    const [startH, startM] = app.startTime.split(':');
    const [endH, endM] = app.endTime.split(':');

    const dtStart = `${year}${month}${day}T${startH}${startM}00`;
    const dtEnd = `${year}${month}${day}T${endH}${endM}00`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MedAgenda//PT-BR
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Consulta com ${app.doctorName} - ${app.specialtyName}
DESCRIPTION:Consulta médica MedAgenda. Código: ${app.appointmentNumber}
LOCATION:${app.unitAddress}
DTSTART:${dtStart}
DTEND:${dtEnd}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `consulta_${app.appointmentNumber}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filtered = appointments.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'scheduled') return a.status === 'scheduled' || a.status === 'confirmed';
    if (filter === 'completed') return a.status === 'completed';
    if (filter === 'cancelled') return a.status === 'cancelled';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-outfit">Minhas Consultas</h1>
          <p className="text-xs text-slate-500">
            Acompanhe o status dos seus atendimentos, reagende horários ou cancele quando necessário.
          </p>
        </div>

        <button
          onClick={onNewBookingClick}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Calendar className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setFilter('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'all'
              ? 'bg-slate-800 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Todas ({appointments.length})
        </button>
        <button
          onClick={() => setFilter('scheduled')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'scheduled'
              ? 'bg-teal-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Agendadas ({appointments.filter((a) => a.status === 'scheduled' || a.status === 'confirmed').length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'completed'
              ? 'bg-emerald-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Realizadas ({appointments.filter((a) => a.status === 'completed').length})
        </button>
        <button
          onClick={() => setFilter('cancelled')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
            filter === 'cancelled'
              ? 'bg-rose-600 text-white'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Canceladas ({appointments.filter((a) => a.status === 'cancelled').length})
        </button>
      </div>

      {/* Consultations List */}
      {isLoading ? (
        <div className="py-20 text-center text-slate-400 text-xs animate-pulse">
          Carregando suas consultas...
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-200 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto stroke-1 mb-3" />
          <h3 className="font-bold text-slate-800 text-sm">Nenhuma consulta encontrada</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 mb-5">
            Você não possui consultas registradas neste status.
          </p>
          <button
            onClick={onNewBookingClick}
            className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-xs font-bold hover:bg-teal-700 shadow-xs cursor-pointer"
          >
            Realizar Novo Agendamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((app) => {
            const isCancelled = app.status === 'cancelled';
            const isCompleted = app.status === 'completed';
            const isUpcoming = !isCancelled && !isCompleted;

            return (
              <div
                key={app.id}
                className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 shadow-xs p-5 flex flex-col justify-between transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {app.appointmentNumber}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isCancelled
                          ? 'bg-rose-100 text-rose-800'
                          : isCompleted
                          ? 'bg-slate-100 text-slate-700'
                          : 'bg-teal-100 text-teal-800'
                      }`}
                    >
                      {app.status === 'confirmed'
                        ? 'Confirmada'
                        : app.status === 'scheduled'
                        ? 'Agendada'
                        : app.status === 'completed'
                        ? 'Realizada'
                        : 'Cancelada'}
                    </span>
                  </div>

                  <div className="mt-3.5 space-y-2">
                    <h3 className="font-bold text-slate-900 text-sm">{app.doctorName}</h3>
                    <p className="text-xs text-teal-700 font-semibold">{app.specialtyName}</p>

                    <div className="pt-2 text-xs text-slate-600 space-y-1">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Calendar className="w-3.5 h-3.5 text-teal-600" />
                        {app.date.split('-').reverse().join('/')} às {app.startTime}
                      </div>
                      <div className="flex items-start gap-1.5 text-slate-500">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                        <span className="line-clamp-1">{app.unitName} - {app.unitAddress}</span>
                      </div>
                    </div>

                    {isCancelled && app.cancellationReason && (
                      <div className="mt-2 p-2 rounded-lg bg-rose-50 text-rose-800 text-[11px] border border-rose-100">
                        Motivo: {app.cancellationReason}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs">
                  <button
                    onClick={() => handleDownloadIcs(app)}
                    className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Baixar para o Calendário (.ics)"
                  >
                    <CalendarPlus className="w-4 h-4" />
                  </button>

                  {isUpcoming && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReschedule(app)}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-[11px] flex items-center gap-1"
                      >
                        <CalendarSync className="w-3 h-3 text-teal-600" />
                        Reagendar
                      </button>

                      <button
                        onClick={() => {
                          setSelectedAppointment(app);
                          setIsCancelModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 font-medium text-[11px] flex items-center gap-1"
                      >
                        <XCircle className="w-3 h-3 text-rose-500" />
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CANCEL MODAL */}
      {isCancelModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-700 font-bold text-base">
                <AlertTriangle className="w-5 h-5" />
                Cancelar Consulta
              </div>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Tem certeza que deseja cancelar a consulta com{' '}
              <strong className="text-slate-900">{selectedAppointment.doctorName}</strong> marcada
              para o dia{' '}
              <strong className="text-slate-900">
                {selectedAppointment.date.split('-').reverse().join('/')} às{' '}
                {selectedAppointment.startTime}
              </strong>
              ?
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo do cancelamento (opcional):
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Imprevisto de trabalho, conflito de horários..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-800">
              Ao confirmar o cancelamento, este horário será imediatamente liberado na agenda do médico em tempo real.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Manter Consulta
              </button>
              <button
                disabled={isCancelling}
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isCancelling ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {isRescheduleModalOpen && selectedAppointment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-teal-800 font-bold text-base">
                <CalendarSync className="w-5 h-5 text-teal-600" />
                Reagendar Consulta
              </div>
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <p>Médico: <strong>{selectedAppointment.doctorName}</strong></p>
              <p>Especialidade: <strong>{selectedAppointment.specialtyName}</strong></p>
              <p>Unidade: <strong>{selectedAppointment.unitName}</strong></p>
            </div>

            {rescheduleError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {rescheduleError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Selecione a Nova Data:
              </label>
              <input
                type="date"
                value={rescheduleDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleDateChangeForReschedule(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Horários Disponíveis:
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto">
                {rescheduleSlots.filter((s) => s.available).length === 0 ? (
                  <p className="col-span-4 text-center py-4 text-xs text-slate-400">
                    Nenhum horário livre nesta data.
                  </p>
                ) : (
                  rescheduleSlots
                    .filter((s) => s.available)
                    .map((s) => (
                      <button
                        key={s.time}
                        onClick={() => setSelectedRescheduleSlot(s.time)}
                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                          selectedRescheduleSlot === s.time
                            ? 'bg-teal-600 text-white border-teal-600'
                            : 'bg-white text-slate-800 border-slate-200 hover:border-teal-500'
                        }`}
                      >
                        {s.time}
                      </button>
                    ))
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                disabled={isRescheduling || !selectedRescheduleSlot}
                onClick={handleConfirmReschedule}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isRescheduling ? 'Atualizando...' : 'Confirmar Reagendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
