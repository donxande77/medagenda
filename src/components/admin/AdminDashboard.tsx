import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { DashboardStats, Appointment } from '../../types/index.ts';
import {
  Users,
  Stethoscope,
  Building,
  CalendarCheck,
  Clock,
  XCircle,
  Calendar,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
  PlusCircle,
  Activity,
  ChevronRight,
  Bell,
  RefreshCw,
} from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
}

export const AdminDashboard: React.FC<Props> = ({ onNavigate }) => {
  const { subscribe, lastEventTime } = useRealtime();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [s, appList] = await Promise.all([
        api.reports.getDashboardStats(),
        api.appointments.list(),
      ]);
      setStats(s);

      const todayStr = new Date().toISOString().split('T')[0];
      const today = appList.filter((a) => a.date === todayStr);
      const upcoming = appList
        .filter((a) => a.date >= todayStr && a.status !== 'cancelled')
        .sort((a, b) => new Date(`${a.date}T${a.startTime}`).getTime() - new Date(`${b.date}T${b.startTime}`).getTime())
        .slice(0, 6);

      setTodayAppointments(today);
      setUpcomingAppointments(upcoming);
    } catch (err) {
      console.error('Error loading admin dashboard stats:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Real-time synchronization
  useEffect(() => {
    const unsub = subscribe((event) => {
      if (
        event.type === 'APPOINTMENT_BOOKED' ||
        event.type === 'APPOINTMENT_CANCELLED' ||
        event.type === 'APPOINTMENT_RESCHEDULED' ||
        event.type === 'SCHEDULE_UPDATED' ||
        event.type === 'AVAILABILITY_CHANGED'
      ) {
        loadData();
      }
    });
    return () => unsub();
  }, [subscribe]);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200/80">
              Painel de Controle Hospitalar
            </span>
            {lastEventTime && (
              <span className="text-[11px] text-slate-400 flex items-center gap-1.5 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Atualizado às {lastEventTime}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-outfit mt-1.5">
            Visão Geral da Operação Clínica
          </h1>
          <p className="text-xs text-slate-500">
            Controle integral de médicos, pacientes, especialidades, unidades, agendas e consultas atômicas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={loadData}
            className="p-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 bg-white shadow-xs"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => onNavigate('appointments')}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <CalendarCheck className="w-4 h-4" />
            Ver Todas Consultas
          </button>
        </div>
      </div>

      {/* 8 SUMMARY CARDS - PROFESSIONAL POLISH */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Agendamentos Hoje */}
        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Agendamentos Hoje
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {stats?.appointmentsToday ?? '-'}
            </span>
            <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              Hoje
            </span>
          </div>
        </div>

        {/* 2. Total de Pacientes */}
        <div
          onClick={() => onNavigate('patients')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Pacientes Totais
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {stats?.totalPatients ?? '-'}
            </span>
            <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5 stroke-[3]" />
              Ativos
            </span>
          </div>
        </div>

        {/* 3. Médicos Ativos */}
        <div
          onClick={() => onNavigate('doctors')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Médicos Ativos
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {stats?.totalDoctors ?? '-'}
            </span>
            <span className="text-slate-400 text-xs font-bold mb-1">Estável</span>
          </div>
        </div>

        {/* 4. Cancelamentos (Mês) */}
        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-rose-400 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Cancelamentos (Mês)
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-rose-600">
              {stats?.cancelledAppointments ?? '-'}
            </span>
            <span className="text-rose-500 text-xs font-bold mb-1 flex items-center gap-0.5">
              Liberados
            </span>
          </div>
        </div>

        {/* 5. Consultas Futuras */}
        <div
          onClick={() => onNavigate('appointments')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Consultas Futuras
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {stats?.upcomingAppointments ?? '-'}
            </span>
            <span className="text-indigo-600 text-xs font-bold mb-1">Próximos dias</span>
          </div>
        </div>

        {/* 6. Horários Disponíveis */}
        <div
          onClick={() => onNavigate('schedules')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Vagas Livres Hoje
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {stats?.availableSlotsToday ?? '-'}
            </span>
            <span className="text-emerald-600 text-xs font-bold mb-1">Disponíveis</span>
          </div>
        </div>

        {/* 7. Total de Unidades */}
        <div
          onClick={() => onNavigate('units')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Unidades Clínicas
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {stats?.totalUnits ?? '-'}
            </span>
            <span className="text-slate-400 text-xs font-bold mb-1">Filiais</span>
          </div>
        </div>

        {/* 8. Agendamentos no Mês */}
        <div
          onClick={() => onNavigate('reports')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-400 transition-all cursor-pointer"
        >
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">
            Total Mensal
          </p>
          <div className="flex items-end justify-between mt-2">
            <span className="text-3xl font-bold text-slate-900">
              {stats?.appointmentsThisMonth ?? '-'}
            </span>
            <span className="text-emerald-500 text-xs font-bold mb-1 flex items-center gap-0.5">
              Consolidado
            </span>
          </div>
        </div>
      </div>

      {/* QUICK VIEWS SECTION (Agenda do Dia + Widgets) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Table from Design HTML */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Agenda do Dia &bull; Próximos Atendimentos</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {todayAppointments.length} agendamento(s) para hoje &bull; {upcomingAppointments.length} na fila
              </p>
            </div>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"
            >
              Ver Agenda Completa &rarr;
            </button>
          </div>

          <div className="flex-1 overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Horário</th>
                  <th className="px-6 py-3.5">Paciente</th>
                  <th className="px-6 py-3.5">Médico</th>
                  <th className="px-6 py-3.5">Especialidade</th>
                  <th className="px-6 py-3.5">Status</th>
                </tr>
              </thead>
              <tbody className="text-xs divide-y divide-slate-100">
                {upcomingAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 text-xs">
                      Nenhuma consulta agendada no momento.
                    </td>
                  </tr>
                ) : (
                  upcomingAppointments.slice(0, 7).map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3.5 font-mono font-medium text-indigo-600 whitespace-nowrap">
                        {app.startTime}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {app.patientName}
                      </td>
                      <td className="px-6 py-3.5 text-slate-700">
                        {app.doctorName}
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">
                        {app.specialtyName}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        {app.status === 'confirmed' ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold uppercase">
                            Confirmado
                          </span>
                        ) : app.status === 'scheduled' ? (
                          <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-[10px] font-bold uppercase">
                            Aguardando
                          </span>
                        ) : app.status === 'cancelled' ? (
                          <span className="px-2.5 py-1 bg-rose-100 text-rose-700 rounded-full text-[10px] font-bold uppercase">
                            Cancelado
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-bold uppercase">
                            {app.status}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right 1 Col: Status do Sistema, Gerenciamento Ágil Banner, Alerta Crítico */}
        <div className="space-y-6">
          {/* Status do Sistema Widget */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <h3 className="font-bold text-slate-800 mb-4 text-sm">Status do Sistema</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Ocupação das Agendas</span>
                <span className="font-bold text-indigo-600">84%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full rounded-full" style={{ width: '84%' }}></div>
              </div>
              <div className="pt-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">
                    Sincronização Ativa
                  </span>
                </div>
                <button
                  onClick={() => onNavigate('audit')}
                  className="text-[10px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 rounded-md font-bold text-slate-700 transition-colors"
                >
                  LOGS
                </button>
              </div>
            </div>
          </div>

          {/* Gerenciamento Ágil Banner */}
          <div className="bg-indigo-600 p-5 rounded-xl text-white relative overflow-hidden shadow-lg">
            <div className="relative z-10">
              <h3 className="font-bold text-lg leading-tight mb-2">Gerenciamento Ágil</h3>
              <p className="text-indigo-100 text-xs mb-4 opacity-90 leading-relaxed">
                Configure novas especialidades e abra agendas em massa com um único clique.
              </p>
              <button
                onClick={() => onNavigate('schedules')}
                className="bg-white text-indigo-600 px-4 py-2 rounded-lg text-xs font-bold shadow-md hover:bg-indigo-50 transition-colors cursor-pointer"
              >
                Abrir Nova Agenda
              </button>
            </div>
            <svg
              viewBox="0 0 200 200"
              className="absolute -right-10 -bottom-10 w-40 h-40 opacity-10 text-white pointer-events-none"
              fill="currentColor"
            >
              <path d="M100 0C44.8 0 0 44.8 0 100s44.8 100 100 100 100-44.8 100-100S155.2 0 100 0zm0 180c-44.1 0-80-35.9-80-80s35.9-80 80-80 80 35.9 80 80-35.9 80-80 80z" />
            </svg>
          </div>

          {/* Alerta Informativo */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs border-l-4 border-l-rose-500">
            <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Monitoramento Clínico</h3>
            <p className="text-xs font-medium text-slate-700 leading-snug">
              O motor atômico de agendamento está monitorando conflitos de horários em tempo real em todas as filiais.
            </p>
            <button
              onClick={() => onNavigate('appointments')}
              className="mt-3 text-xs font-bold text-rose-600 hover:text-rose-700 cursor-pointer"
            >
              Verificar Conflitos &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
