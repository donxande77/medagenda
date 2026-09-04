import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { api } from '../../services/api.ts';
import { Appointment } from '../../types/index.ts';
import {
  Calendar,
  Clock,
  MapPin,
  Stethoscope,
  ChevronRight,
  Sparkles,
  ArrowRight,
  AlertCircle,
  FileCheck,
  User,
  ShieldCheck,
  BellRing,
} from 'lucide-react';

interface Props {
  onStartBooking: () => void;
  onViewAppointments: () => void;
  onViewProfile: () => void;
}

export const PatientDashboard: React.FC<Props> = ({
  onStartBooking,
  onViewAppointments,
  onViewProfile,
}) => {
  const { currentUser, currentPatient } = useAuth();
  const { subscribe } = useRealtime();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [nextAppointment, setNextAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadAppointments = async () => {
    if (!currentPatient?.id) return;
    try {
      const list = await api.appointments.list({ patientId: currentPatient.id });
      setAppointments(list);

      const today = new Date().toISOString().split('T')[0];
      const upcoming = list
        .filter((a) => a.date >= today && a.status !== 'cancelled')
        .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime());

      setNextAppointment(upcoming[0] || null);
    } catch (err) {
      console.error('Error loading patient appointments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [currentPatient?.id]);

  // Subscribe to real-time events
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

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Patient Hero Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white p-7 sm:p-10 overflow-hidden shadow-lg border border-slate-800">
        <div className="relative z-10 max-w-2xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Portal do Paciente &bull; MedAgenda
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight font-outfit">
            Olá, {currentPatient?.name || currentUser?.name || 'Paciente'}!
          </h1>

          {/* MAIN MESSAGE REQUIRED BY PROMPT */}
          <p className="text-sm sm:text-base text-slate-300 font-normal leading-relaxed">
            Agende sua consulta de forma rápida e sem precisar ligar.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* MAIN ACTION REQUIRED BY PROMPT */}
            <button
              onClick={onStartBooking}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Agendar consulta
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onViewAppointments}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition-colors cursor-pointer"
            >
              Minhas consultas ({appointments.filter((a) => a.status !== 'cancelled').length})
            </button>
          </div>
        </div>

        {/* Decorative background grid */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      </div>

      {/* Grid: Next Consultation + Quick Features */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Next Appointment Card */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-600" />
                Sua Próxima Consulta
              </h2>
              {nextAppointment && (
                <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase">
                  {nextAppointment.status === 'confirmed' ? 'Confirmada' : 'Agendada'}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="py-12 text-center text-slate-400 text-xs animate-pulse">
                Carregando consultas...
              </div>
            ) : nextAppointment ? (
              <div className="py-5 space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold uppercase">
                      {new Date(nextAppointment.date + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}
                    </span>
                    <span className="text-lg font-extrabold leading-none">
                      {nextAppointment.date.split('-')[2]}
                    </span>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-base font-bold text-slate-900">
                      {nextAppointment.doctorName}
                    </h3>
                    <p className="text-xs text-indigo-700 font-semibold">
                      {nextAppointment.specialtyName} &bull; {nextAppointment.doctorCrm}
                    </p>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {nextAppointment.startTime} às {nextAppointment.endTime}
                    </p>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                    {nextAppointment.unitName}
                  </div>
                  <p className="text-[11px] text-slate-400 pl-5">
                    {nextAppointment.unitAddress}
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400">
                <FileCheck className="w-10 h-10 mx-auto text-slate-300 stroke-1 mb-2" />
                <p className="text-sm font-semibold text-slate-600">Nenhuma consulta futura agendada</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Você não possui nenhuma consulta pendente no momento. Escolha um especialista e reserve quando desejar.
                </p>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            {nextAppointment ? (
              <>
                <span className="text-slate-400 font-mono text-[11px]">
                  Ref: {nextAppointment.appointmentNumber}
                </span>
                <button
                  onClick={onViewAppointments}
                  className="text-indigo-600 font-bold hover:underline flex items-center gap-1"
                >
                  Gerenciar consulta
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={onStartBooking}
                className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-center transition-colors cursor-pointer"
              >
                Buscar Horários Disponíveis
              </button>
            )}
          </div>
        </div>

        {/* Quick Access Cards */}
        <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div
            onClick={onStartBooking}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-slate-900 text-sm">Novo Agendamento</h3>
              <p className="text-xs text-slate-500 mt-1">
                Especialidades, unidades e horários em tempo real.
              </p>
            </div>
          </div>

          <div
            onClick={onViewAppointments}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-lg bg-sky-50 text-sky-700 flex items-center justify-center">
              <FileCheck className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-slate-900 text-sm">Minhas Consultas</h3>
              <p className="text-xs text-slate-500 mt-1">
                Acompanhe status, cancelamentos ou reagendamentos.
              </p>
            </div>
          </div>

          <div
            onClick={onViewProfile}
            className="p-5 rounded-xl bg-white border border-slate-200 hover:border-indigo-400 shadow-xs transition-all cursor-pointer flex flex-col justify-between"
          >
            <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-slate-900 text-sm">Meu Perfil</h3>
              <p className="text-xs text-slate-500 mt-1">
                Mantenha seu telefone e e-mail de SMS atualizados.
              </p>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
            <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="mt-4">
              <h3 className="font-bold text-slate-900 text-sm">Canais Ativos</h3>
              <p className="text-xs text-slate-500 mt-1">
                Confirmações automáticas por E-mail e SMS.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
