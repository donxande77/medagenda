import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api.ts';
import { Doctor, Unit, DoctorSchedule, ScheduleException, AvailableSlot } from '../../types/index.ts';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Stethoscope,
  Building,
  Lock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const ScheduleManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');

  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [exceptions, setExceptions] = useState<ScheduleException[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Day of week names in Portuguese
  const daysOfWeek = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
  ];

  // Schedule modal state
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [modalDayOfWeek, setModalDayOfWeek] = useState(1);
  const [modalStartTime, setModalStartTime] = useState('08:00');
  const [modalEndTime, setModalEndTime] = useState('17:00');
  const [modalDuration, setModalDuration] = useState(30);
  const [modalInterval, setModalInterval] = useState(0);

  // Exception modal state (Bloqueio, Encaixe, Extra)
  const [isExceptionModalOpen, setIsExceptionModalOpen] = useState(false);
  const [exceptionType, setExceptionType] = useState<'blocked' | 'unblocked' | 'fit_in' | 'extra'>('blocked');
  const [exceptionDate, setExceptionDate] = useState(new Date().toISOString().split('T')[0]);
  const [exceptionStartTime, setExceptionStartTime] = useState('10:00');
  const [exceptionEndTime, setExceptionEndTime] = useState('10:30');
  const [exceptionReason, setExceptionReason] = useState('');

  const loadBaseData = async () => {
    try {
      const [docs, unts] = await Promise.all([
        api.doctors.list({ status: 'active' }),
        api.units.list({ status: 'active' }),
      ]);
      setDoctors(docs);
      setUnits(unts);
      if (docs.length > 0) setSelectedDoctorId(docs[0].id);
      if (unts.length > 0) setSelectedUnitId(unts[0].id);
    } catch (err) {
      console.error('Error loading base doctors/units:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBaseData();
  }, []);

  const loadDoctorSchedules = useCallback(async () => {
    if (!selectedDoctorId) return;
    try {
      const [schedList, excList] = await Promise.all([
        api.schedules.list({ doctorId: selectedDoctorId, unitId: selectedUnitId || undefined }),
        api.schedules.getExceptions({ doctorId: selectedDoctorId }),
      ]);
      setSchedules(schedList);
      setExceptions(excList);
    } catch (err) {
      console.error('Error loading schedules:', err);
    }
  }, [selectedDoctorId, selectedUnitId]);

  useEffect(() => {
    if (selectedDoctorId) {
      loadDoctorSchedules();
    }
  }, [selectedDoctorId, selectedUnitId, loadDoctorSchedules]);

  const handleSaveSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedUnitId) return;

    try {
      await api.schedules.create({
        doctorId: selectedDoctorId,
        unitId: selectedUnitId,
        dayOfWeek: Number(modalDayOfWeek),
        startTime: modalStartTime,
        endTime: modalEndTime,
        appointmentDurationMinutes: Number(modalDuration),
        intervalMinutes: Number(modalInterval),
        status: 'open',
      });
      setIsScheduleModalOpen(false);
      await loadDoctorSchedules();
    } catch (err: any) {
      alert(err.message || 'Erro ao criar agenda.');
    }
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!confirm('Deseja excluir esta grade semanal de atendimento?')) return;
    try {
      await api.schedules.delete(id);
      await loadDoctorSchedules();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover agenda.');
    }
  };

  const handleSaveException = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !selectedUnitId) return;

    try {
      await api.schedules.createException({
        doctorId: selectedDoctorId,
        unitId: selectedUnitId,
        date: exceptionDate,
        type: exceptionType,
        startTime: exceptionStartTime,
        endTime: exceptionEndTime,
        reason: exceptionReason,
      });
      setIsExceptionModalOpen(false);
      setExceptionReason('');
      await loadDoctorSchedules();
    } catch (err: any) {
      alert(err.message || 'Erro ao registrar exceção.');
    }
  };

  const handleDeleteException = async (id: string) => {
    if (!confirm('Deseja remover esta exceção?')) return;
    try {
      await api.schedules.deleteException(id);
      await loadDoctorSchedules();
    } catch (err: any) {
      alert(err.message || 'Erro ao remover exceção.');
    }
  };

  const selectedDoctor = doctors.find((d) => d.id === selectedDoctorId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-outfit">
            Gestão de Agendas Médicas
          </h1>
          <p className="text-xs text-slate-500">
            Configure horários de atendimento semanais, intervalos, bloqueios de agenda e horários de encaixe.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExceptionModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            Bloqueio / Encaixe
          </button>
          <button
            onClick={() => setIsScheduleModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nova Grade Semanal
          </button>
        </div>
      </div>

      {/* Doctor & Unit Selection */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 shadow-xs">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Stethoscope className="w-3.5 h-3.5 text-teal-600" />
            Selecione o Médico:
          </label>
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-hidden"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name} ({d.crm} - {d.specialtyName})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-teal-600" />
            Filtrar Unidade:
          </label>
          <select
            value={selectedUnitId}
            onChange={(e) => setSelectedUnitId(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-hidden"
          >
            <option value="">Todas as Unidades</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Weekly Schedule Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6, 0].map((dayIndex) => {
          const daySchedules = schedules.filter((s) => s.dayOfWeek === dayIndex);

          return (
            <div
              key={dayIndex}
              className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs font-bold text-slate-900 font-outfit">
                    {daysOfWeek[dayIndex]}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold">
                    {daySchedules.length} turno(s)
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {daySchedules.length === 0 ? (
                    <p className="text-xs text-slate-400 py-3 text-center italic">
                      Sem atendimento configurado
                    </p>
                  ) : (
                    daySchedules.map((s) => (
                      <div
                        key={s.id}
                        className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 text-xs flex items-center justify-between"
                      >
                        <div>
                          <p className="font-bold text-teal-900">
                            {s.startTime} às {s.endTime}
                          </p>
                          <p className="text-[11px] text-teal-700">
                            {s.appointmentDurationMinutes} min / consulta
                            {s.intervalMinutes > 0 && ` (+${s.intervalMinutes}m pausa)`}
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteSchedule(s.id)}
                          className="p-1 rounded-md text-teal-800 hover:text-rose-600 hover:bg-white"
                          title="Remover turno"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-3 mt-3 border-t border-slate-100 flex justify-end">
                <button
                  onClick={() => {
                    setModalDayOfWeek(dayIndex);
                    setIsScheduleModalOpen(true);
                  }}
                  className="text-[11px] font-bold text-teal-700 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Adicionar Horário
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Schedule Exceptions List (Bloqueios, Encaixes, Extras) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-600" />
              Exceções de Agenda Registradas
            </h2>
            <p className="text-xs text-slate-500">
              Bloqueios pontuais, horários de encaixe e plantões extras vinculados a datas específicas.
            </p>
          </div>
        </div>

        {exceptions.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">
            Nenhuma exceção registrada para {selectedDoctor?.name || 'este médico'}.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {exceptions.map((exc) => (
              <div
                key={exc.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                        exc.type === 'blocked'
                          ? 'bg-rose-100 text-rose-800'
                          : exc.type === 'fit_in'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {exc.type === 'blocked'
                        ? 'Bloqueado'
                        : exc.type === 'fit_in'
                        ? 'Encaixe'
                        : 'Horário Extra'}
                    </span>
                    <span className="font-bold text-slate-800">
                      {exc.date.split('-').reverse().join('/')}
                    </span>
                  </div>

                  {exc.startTime && (
                    <p className="text-slate-600 text-[11px]">
                      {exc.startTime} às {exc.endTime}
                    </p>
                  )}
                  {exc.reason && (
                    <p className="text-slate-500 text-[11px] italic mt-0.5">{exc.reason}</p>
                  )}
                </div>

                <button
                  onClick={() => handleDeleteException(exc.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-white"
                  title="Remover exceção"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CREATE SCHEDULE MODAL */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Configurar Grade de Horários</h2>
              <button
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dia da Semana</label>
                <select
                  value={modalDayOfWeek}
                  onChange={(e) => setModalDayOfWeek(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  {daysOfWeek.map((d, i) => (
                    <option key={i} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário Inicial</label>
                  <input
                    type="time"
                    required
                    value={modalStartTime}
                    onChange={(e) => setModalStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário Final</label>
                  <input
                    type="time"
                    required
                    value={modalEndTime}
                    onChange={(e) => setModalEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Duração (minutos)</label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    step={5}
                    value={modalDuration}
                    onChange={(e) => setModalDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Intervalo (minutos)</label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={5}
                    value={modalInterval}
                    onChange={(e) => setModalInterval(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Salvar Grade
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EXCEPTION MODAL */}
      {isExceptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">Registrar Bloqueio ou Encaixe</h2>
              <button
                onClick={() => setIsExceptionModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveException} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Operação</label>
                <select
                  value={exceptionType}
                  onChange={(e) => setExceptionType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                >
                  <option value="blocked">Bloquear Horário / Data (Indisponibilizar)</option>
                  <option value="fit_in">Criar Horário de Encaixe</option>
                  <option value="extra">Criar Horário Extra</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Data Específica</label>
                <input
                  type="date"
                  required
                  value={exceptionDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setExceptionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário Início</label>
                  <input
                    type="time"
                    value={exceptionStartTime}
                    onChange={(e) => setExceptionStartTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Horário Fim</label>
                  <input
                    type="time"
                    value={exceptionEndTime}
                    onChange={(e) => setExceptionEndTime(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Justificativa / Motivo</label>
                <input
                  type="text"
                  placeholder="Ex: Congresso médico, plantão especial..."
                  value={exceptionReason}
                  onChange={(e) => setExceptionReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExceptionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  Registrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
