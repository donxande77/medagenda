import React from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import {
  LayoutDashboard,
  CalendarCheck,
  Stethoscope,
  Users,
  Calendar,
  Building,
  HeartPulse,
  BarChart3,
  ShieldCheck,
  CalendarPlus,
  User,
  Heart,
  X,
  Radio,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { currentUser, switchDemoRole } = useAuth();
  const { isConnected } = useRealtime();
  const isAdmin = currentUser?.role === 'admin';

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Consultas', icon: CalendarCheck },
    { id: 'doctors', label: 'Médicos', icon: Stethoscope },
    { id: 'patients', label: 'Pacientes', icon: Users },
    { id: 'schedules', label: 'Agendas', icon: Calendar },
    { id: 'units', label: 'Unidades', icon: Building },
    { id: 'specialties', label: 'Especialidades', icon: HeartPulse },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'audit', label: 'Auditoria', icon: ShieldCheck },
  ];

  const patientNavItems: NavItem[] = [
    { id: 'patient_dashboard', label: 'Meu Painel', icon: LayoutDashboard },
    { id: 'book_appointment', label: 'Agendar Consulta', icon: CalendarPlus, highlight: true },
    { id: 'my_appointments', label: 'Minhas Consultas', icon: CalendarCheck },
    { id: 'profile', label: 'Meu Perfil', icon: User },
  ];

  const navItems = isAdmin ? adminNavItems : patientNavItems;

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:z-20 shrink-0 border-r border-slate-800 ${
          isOpenMobile ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div
            onClick={() => handleSelectTab(isAdmin ? 'dashboard' : 'patient_dashboard')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white shadow-xs group-hover:scale-105 transition-transform">
              <Heart className="w-5 h-5 fill-white/20 stroke-[2.2]" />
            </div>
            <span className="text-white font-bold text-xl tracking-tight font-outfit">
              MedAgenda
            </span>
          </div>

          <button
            onClick={onCloseMobile}
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Role Quick Toggle in Sidebar */}
        <div className="px-4 pt-4 pb-1">
          <div className="p-1 bg-slate-800/90 rounded-lg border border-slate-700/60 flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                switchDemoRole('patient');
                setActiveTab('patient_dashboard');
              }}
              className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                !isAdmin
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              Paciente
            </button>
            <button
              type="button"
              onClick={() => {
                switchDemoRole('admin');
                setActiveTab('dashboard');
              }}
              className={`flex-1 py-1.5 px-2 text-[11px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                isAdmin
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              Admin
            </button>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 py-4 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer font-medium text-sm transition-colors text-left ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : item.highlight
                    ? 'text-indigo-400 bg-indigo-950/40 hover:bg-indigo-900/50 hover:text-indigo-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : ''}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Status Card */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-800 rounded-lg text-xs text-slate-400 border border-slate-700/50">
            <div className="flex items-center gap-2.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                }`}
              />
              <span className="font-semibold text-slate-300">Sistema Operacional</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-emerald-400">SSE Ativa</span>
          </div>

          <div className="px-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5">
            <span>CFM &amp; LGPD Compliant</span>
            <span>&bull;</span>
            <span>v2.6 Pro</span>
          </div>
        </div>
      </aside>
    </>
  );
};
