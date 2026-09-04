import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { Appointment, Doctor, Specialty, Unit, AvailableSlot } from '../../types/index.ts';
import {
  CalendarCheck,
  Search,
  Filter,
  XCircle,
  CalendarSync,
  Clock,
  MapPin,
  Stethoscope,
  X,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';

export const AppointmentManagement: React.FC = () => {
  const { subscribe } = useRealtime();

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // 6 Required Filters
  const [filterPatient, setFilterPatient] = useState('');
  const [filterDoctor, setFilterDoctor] = useState('all');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [filterUnit, setFilterUnit] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const [isLoading, setIsLoading] = useState(true);

  // Cancel modal
  const [selectedApp, setSelectedApp] = useState<Appointment | null>(null);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Reschedule modal
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState('');
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [appList, docList, specList, unitList] = await Promise.all([
        api.appointments.list(),
        api.doctors.list(),
        api.specialties.list(),
        api.units.list(),
      ]);
      setAppointments(appList);
      setDoctors(docList);
      setSpecialties(specList);
      setUnits(unitList);
    } catch (err) {
      console.error('Error loading appointments data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time synchronization
  useEffect(() => {
    const unsub = subscribe((event) => {
      if (
        event.type === 'APPOINTMENT_BOOKED' ||
        event.type === 'APPOINTMENT_CANCELLED' ||
        event.type === 'APPOINTMENT_RESCHEDULED'
      ) {
        loadData();
      }
    });
    return () => unsub();
  }, [subscribe, loadData]);

  const handleConfirmCancel = async () => {
    if (!selectedApp) return;
    setIsProcessing(true);
    try {
      await api.appointments.cancel(selectedApp.id, {
        reason: cancelReason || 'Cancelamento administrativo',
        userId: 'admin',
      });
      setIsCancelModalOpen(false);
      setSelectedApp(null);
      setCancelReason('');
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao cancelar consulta.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOpenReschedule = async (app: Appointment) => {
    setSelectedApp(app);
    setNewDate(app.date);
    setSelectedSlot('');
    setRescheduleError(null);
    setIsRescheduleModalOpen(true);

    try {
      const res = await api.schedules.getAvailability({
        doctorId: app.doctorId,
        unitId: app.unitId,
        specialtyId: app.specialtyId,
        date: app.date,
      });
      setSlots(res.slots);
    } catch (err) {
      console.error('Error loading availability:', err);
    }
  };

  const handleDateChange = async (date: string) => {
    setNewDate(date);
    setSelectedSlot('');
    setRescheduleError(null);
    if (!selectedApp) return;

    try {
      const res = await api.schedules.getAvailability({
        doctorId: selectedApp.doctorId,
        unitId: selectedApp.unitId,
        specialtyId: selectedApp.specialtyId,
        date,
      });
      setSlots(res.slots);
    } catch (err) {
      console.error('Error loading slots:', err);
    }
  };

  const handleConfirmReschedule = async () => {
    if (!selectedApp || !newDate || !selectedSlot) {
      setRescheduleError('Selecione uma data e horário válido.');
      return;
    }
    setIsProcessing(true);
    setRescheduleError(null);

    try {
      await api.appointments.reschedule(selectedApp.id, {
        newDate,
        newStartTime: selectedSlot,
        userId: 'admin',
      });
      setIsRescheduleModalOpen(false);
      setSelectedApp(null);
      await loadData();
    } catch (err: any) {
      setRescheduleError(err.message || 'Erro ao reagendar consulta.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Filter application
  const filtered = appointments.filter((app) => {
    const matchesPatient =
      !filterPatient ||
      app.patientName.toLowerCase().includes(filterPatient.toLowerCase()) ||
      app.appointmentNumber.toLowerCase().includes(filterPatient.toLowerCase());

    const matchesDoctor = filterDoctor === 'all' || app.doctorId === filterDoctor;
    const matchesSpecialty = filterSpecialty === 'all' || app.specialtyId === filterSpecialty;
    const matchesUnit = filterUnit === 'all' || app.unitId === filterUnit;
    const matchesDate = !filterDate || app.date === filterDate;
    const matchesStatus = filterStatus === 'all' || app.status === filterStatus;

    return (
      matchesPatient &&
      matchesDoctor &&
      matchesSpecialty &&
      matchesUnit &&
      matchesDate &&
      matchesStatus
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-outfit">
            Gestão Geral de Consultas
          </h1>
          <p className="text-xs text-slate-500">
            Filtre por paciente, médico, especialidade, unidade, data e status com suporte a reagendamento e cancelamento atômico.
          </p>
        </div>

        <div className="text-xs font-semibold text-slate-500 bg-slate-100 px-3.5 py-1.5 rounded-xl self-start sm:self-auto">
          Total listado: <strong className="text-slate-800">{filtered.length}</strong> consultas
        </div>
      </div>

      {/* 6 Filters Grid Required by Schema */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 shadow-xs text-xs">
        {/* Filter 1: Paciente / Código */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1">1. Paciente / Código</label>
          <input
            type="text"
            placeholder="Nome ou código..."
            value={filterPatient}
            onChange={(e) => setFilterPatient(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Filter 2: Médico */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1">2. Médico</label>
          <select
            value={filterDoctor}
            onChange={(e) => setFilterDoctor(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          >
            <option value="all">Todos os Médicos</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 3: Especialidade */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1">3. Especialidade</label>
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          >
            <option value="all">Todas</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 4: Unidade */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1">4. Unidade</label>
          <select
            value={filterUnit}
            onChange={(e) => setFilterUnit(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          >
            <option value="all">Todas as Unidades</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter 5: Data */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1">5. Data Específica</label>
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          />
        </div>

        {/* Filter 6: Status */}
        <div>
          <label className="block text-slate-500 font-semibold mb-1">6. Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
          >
            <option value="all">Todos os status</option>
            <option value="scheduled">Agendadas</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Realizadas</option>
            <option value="cancelled">Canceladas</option>
          </select>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Paciente</th>
                <th className="py-3 px-4">Médico / Esp.</th>
                <th className="py-3 px-4">Unidade</th>
                <th className="py-3 px-4">Data & Horário</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Carregando consultas...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhuma consulta encontrada com os filtros selecionados.
                  </td>
                </tr>
              ) : (
                filtered.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {app.appointmentNumber}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {app.patientName}
                    </td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">{app.doctorName}</p>
                      <p className="text-[11px] text-teal-700">{app.specialtyName}</p>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{app.unitName}</td>
                    <td className="py-3.5 px-4">
                      <p className="font-bold text-slate-800">
                        {app.date.split('-').reverse().join('/')}
                      </p>
                      <p className="text-slate-500 text-[11px]">
                        {app.startTime} às {app.endTime}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          app.status === 'cancelled'
                            ? 'bg-rose-100 text-rose-800'
                            : app.status === 'completed'
                            ? 'bg-slate-100 text-slate-700'
                            : 'bg-emerald-100 text-emerald-800'
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
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1 whitespace-nowrap">
                      {app.status !== 'cancelled' && (
                        <>
                          <button
                            onClick={() => handleOpenReschedule(app)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                            title="Reagendar consulta"
                          >
                            <CalendarSync className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedApp(app);
                              setIsCancelModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Cancelar consulta"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CANCEL MODAL */}
      {isCancelModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Cancelar Consulta {selectedApp.appointmentNumber}
              </h2>
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Esta ação liberará imediatamente o horário na agenda de {selectedApp.doctorName} e
              notificará o paciente por SMS e E-mail.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Motivo do cancelamento:
              </label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="Ex: Cancelamento solicitado pelo paciente ou indisponibilidade médica"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsCancelModalOpen(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Voltar
              </button>
              <button
                disabled={isProcessing}
                onClick={handleConfirmCancel}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                {isProcessing ? 'Cancelando...' : 'Confirmar Cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RESCHEDULE MODAL */}
      {isRescheduleModalOpen && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-teal-800 flex items-center gap-2">
                <CalendarSync className="w-5 h-5 text-teal-600" />
                Reagendar Consulta {selectedApp.appointmentNumber}
              </h2>
              <button
                onClick={() => setIsRescheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
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
                value={newDate}
                min={new Date().toISOString().split('T')[0]}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Horários Livres:
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-[160px] overflow-y-auto">
                {slots.filter((s) => s.available).length === 0 ? (
                  <p className="col-span-4 text-center py-4 text-xs text-slate-400">
                    Nenhum horário livre nesta data.
                  </p>
                ) : (
                  slots
                    .filter((s) => s.available)
                    .map((s) => (
                      <button
                        key={s.time}
                        onClick={() => setSelectedSlot(s.time)}
                        className={`p-2 rounded-lg text-xs font-bold border transition-all ${
                          selectedSlot === s.time
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
                disabled={isProcessing || !selectedSlot}
                onClick={handleConfirmReschedule}
                className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {isProcessing ? 'Atualizando...' : 'Confirmar Reagendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
