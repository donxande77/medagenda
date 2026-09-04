import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { RealtimeProvider } from './context/RealtimeContext.tsx';

// Common Components
import { Sidebar } from './components/common/Sidebar.tsx';
import { TopHeader } from './components/common/TopHeader.tsx';
import { AuthModal } from './components/common/AuthModal.tsx';

// Patient Views
import { PatientDashboard } from './components/patient/PatientDashboard.tsx';
import { PatientBookingWizard } from './components/patient/PatientBookingWizard.tsx';
import { MyAppointments } from './components/patient/MyAppointments.tsx';
import { PatientProfile } from './components/patient/PatientProfile.tsx';

// Admin Views
import { AdminDashboard } from './components/admin/AdminDashboard.tsx';
import { DoctorManagement } from './components/admin/DoctorManagement.tsx';
import { PatientManagement } from './components/admin/PatientManagement.tsx';
import { ScheduleManagement } from './components/admin/ScheduleManagement.tsx';
import { AppointmentManagement } from './components/admin/AppointmentManagement.tsx';
import { UnitManagement } from './components/admin/UnitManagement.tsx';
import { SpecialtyManagement } from './components/admin/SpecialtyManagement.tsx';
import { ReportsView } from './components/admin/ReportsView.tsx';
import { AuditLogsView } from './components/admin/AuditLogsView.tsx';

const AppContent: React.FC = () => {
  const { currentUser } = useAuth();
  const isAdmin = currentUser?.role === 'admin';

  const [activeTab, setActiveTab] = useState<string>(isAdmin ? 'dashboard' : 'patient_dashboard');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync tab default when switching demo roles
  React.useEffect(() => {
    if (isAdmin && (activeTab === 'patient_dashboard' || activeTab === 'book_appointment' || activeTab === 'my_appointments' || activeTab === 'profile')) {
      setActiveTab('dashboard');
    } else if (!isAdmin && (activeTab === 'dashboard' || activeTab === 'doctors' || activeTab === 'patients' || activeTab === 'schedules' || activeTab === 'units' || activeTab === 'specialties' || activeTab === 'reports' || activeTab === 'audit')) {
      setActiveTab('patient_dashboard');
    }
  }, [isAdmin]);

  const renderActiveView = () => {
    if (isAdmin) {
      switch (activeTab) {
        case 'dashboard':
          return <AdminDashboard onNavigate={setActiveTab} />;
        case 'appointments':
          return <AppointmentManagement />;
        case 'doctors':
          return <DoctorManagement />;
        case 'patients':
          return <PatientManagement />;
        case 'schedules':
          return <ScheduleManagement />;
        case 'units':
          return <UnitManagement />;
        case 'specialties':
          return <SpecialtyManagement />;
        case 'reports':
          return <ReportsView />;
        case 'audit':
          return <AuditLogsView />;
        default:
          return <AdminDashboard onNavigate={setActiveTab} />;
      }
    }

    // Patient View
    switch (activeTab) {
      case 'patient_dashboard':
        return (
          <PatientDashboard
            onStartBooking={() => setActiveTab('book_appointment')}
            onViewAppointments={() => setActiveTab('my_appointments')}
          />
        );
      case 'book_appointment':
        return (
          <PatientBookingWizard
            onSuccess={() => setActiveTab('my_appointments')}
            onCancel={() => setActiveTab('patient_dashboard')}
          />
        );
      case 'my_appointments':
        return (
          <MyAppointments
            onBookNew={() => setActiveTab('book_appointment')}
          />
        );
      case 'profile':
        return <PatientProfile />;
      default:
        return (
          <PatientDashboard
            onStartBooking={() => setActiveTab('book_appointment')}
            onViewAppointments={() => setActiveTab('my_appointments')}
          />
        );
    }
  };

  return (
    <div className="flex min-h-screen bg-[#F8FAFC] font-sans text-slate-800 antialiased selection:bg-indigo-500 selection:text-white overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpenMobile={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Top Header */}
        <TopHeader
          onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onSearchChange={setSearchQuery}
        />

        {/* Dynamic View Area */}
        <main className="flex-1 overflow-y-auto">
          {renderActiveView()}
        </main>

        {/* Hospital Footer */}
        <footer className="bg-white border-t border-slate-200 py-4 px-6 text-xs text-slate-500 mt-auto">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 tracking-tight">MedAgenda</span>
              <span>&bull;</span>
              <span>Sistema Integrado de Agendamento Médico Ambulatorial</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Sincronização Atômica SSE Ativa
              </span>
              <span>&bull;</span>
              <span>Conformidade CFM &amp; LGPD</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <AppContent />
      </RealtimeProvider>
    </AuthProvider>
  );
}
