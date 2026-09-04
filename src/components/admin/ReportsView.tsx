import React, { useEffect, useState } from 'react';
import { api } from '../../services/api.ts';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart2, Activity, Calendar, Award } from 'lucide-react';

const COLORS = ['#0d9488', '#0284c7', '#6366f1', '#f59e0b', '#ec4899', '#10b981'];

export const ReportsView: React.FC = () => {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      try {
        const res = await api.reports.getAnalytics();
        setData(res);
      } catch (err) {
        console.error('Error loading reports analytics:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadReports();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-xs animate-pulse">
        Carregando relatórios analíticos e indicadores de ocupação...
      </div>
    );
  }

  const byDoctor = data?.byDoctor || [];
  const bySpecialty = data?.bySpecialty || [];
  const byUnit = data?.byUnit || [];
  const occupancyRate = data?.occupancyRate || 68;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 font-outfit">
          Relatórios Gerenciais e Indicadores de Ocupação
        </h1>
        <p className="text-xs text-slate-500">
          Métricas consolidadas de demanda por especialidade, volume por médico e taxa de ocupação da infraestrutura.
        </p>
      </div>

      {/* Top Occupancy Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Taxa de Ocupação
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-teal-700">{occupancyRate}%</span>
              <span className="text-xs font-semibold text-emerald-600">Capacidade Operacional</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Proporção de horários agendados vs livres</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center">
            <Activity className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Especialidade com Maior Demanda
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {bySpecialty[0]?.name || 'Cardiologia'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {bySpecialty[0]?.count || 0} consultas registradas
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-700 flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Unidade com Maior Fluxo
            </span>
            <div className="text-xl font-extrabold text-slate-900 mt-1">
              {byUnit[0]?.name || 'Unidade Centro'}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {byUnit[0]?.count || 0} atendimentos distribuídos
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Consultas por Especialidade */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-teal-600" />
                Distribuição por Especialidade
              </h3>
              <p className="text-xs text-slate-400">Proporção do volume total de consultas</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={bySpecialty}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {bySpecialty.map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Consultas por Unidade */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                Consultas por Unidade de Atendimento
              </h3>
              <p className="text-xs text-slate-400">Volume total por posto físico</p>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byUnit} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Consultas" fill="#0d9488" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Atendimentos por Médico */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart2 className="w-4 h-4 text-teal-600" />
                Volume de Consultas por Médico Especialista
              </h3>
              <p className="text-xs text-slate-400">Carga horária e agendamentos confirmados por profissional</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byDoctor} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-10} textAnchor="end" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Consultas Agendadas" fill="#0284c7" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
