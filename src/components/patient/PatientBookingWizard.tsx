import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { api } from '../../services/api.ts';
import {
  Specialty,
  Unit,
  Doctor,
  AvailableSlot,
  Appointment,
} from '../../types/index.ts';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Stethoscope,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  CalendarPlus,
  FileText,
  User,
  Info,
  Sparkles,
  Heart,
  Activity,
  Smile,
  Eye,
  UserCheck,
  Building,
  ChevronRight,
  Mail,
  Smartphone,
  Check,
} from 'lucide-react';

interface Props {
  onBookingSuccess?: (appointment: Appointment) => void;
  onViewAppointments?: () => void;
}

export const PatientBookingWizard: React.FC<Props> = ({ onBookingSuccess, onViewAppointments }) => {
  const { currentUser, currentPatient } = useAuth();
  const { subscribe } = useRealtime();

  // Wizard Step (1 to 9)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Selection states
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [selectedSpecialty, setSelectedSpecialty] = useState<Specialty | null>(null);

  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);

  // Default to today or tomorrow
  const getInitialDate = () => {
    const d = new Date();
    // Use format YYYY-MM-DD
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getInitialDate());

  // Available slots for the selected doctor, unit, date
  const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [isScheduleClosed, setIsScheduleClosed] = useState<boolean>(false);
  const [closedMessage, setClosedMessage] = useState<string>('');

  // Additional patient input
  const [consultationNotes, setConsultationNotes] = useState<string>('');

  // Loading and Error states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [confirmedAppointment, setConfirmedAppointment] = useState<Appointment | null>(null);

  // Initial load: fetch specialties & units
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [specs, unts] = await Promise.all([
          api.specialties.list('active'),
          api.units.list('active'),
        ]);
        setSpecialties(specs);
        setUnits(unts);
      } catch (err) {
        console.error('Error loading specialties/units:', err);
      }
    };
    loadInitialData();
  }, []);

  // When specialty or unit changes, load eligible doctors
  useEffect(() => {
    const loadDoctors = async () => {
      if (!selectedSpecialty) {
        setDoctors([]);
        return;
      }
      try {
        const docs = await api.doctors.list({
          specialtyId: selectedSpecialty.id,
          unitId: selectedUnit?.id,
          status: 'active',
        });
        setDoctors(docs);
      } catch (err) {
        console.error('Error loading doctors:', err);
      }
    };
    loadDoctors();
  }, [selectedSpecialty, selectedUnit]);

  // Load real-time slots when Doctor and Date are selected
  const fetchAvailability = useCallback(async () => {
    if (!selectedDoctor || !selectedUnit || !selectedSpecialty || !selectedDate) {
      return;
    }
    setIsLoading(true);
    setBookingError(null);
    try {
      const res = await api.schedules.getAvailability({
        doctorId: selectedDoctor.id,
        unitId: selectedUnit.id,
        specialtyId: selectedSpecialty.id,
        date: selectedDate,
      });

      setAvailableSlots(res.slots);
      setIsScheduleClosed(res.isClosed);
      if (res.message) {
        setClosedMessage(res.message);
      } else if (res.isClosed) {
        setClosedMessage(
          'A agenda para este período está fechada ou não possui horários disponíveis. Caso necessite de um encaixe, entre em contato diretamente com a unidade.'
        );
      } else {
        setClosedMessage('');
      }

      // If previously selected slot is no longer available, reset it
      if (selectedSlot && !res.slots.some((s) => s.time === selectedSlot.time && s.available)) {
        setSelectedSlot(null);
      }
    } catch (err: any) {
      console.error('Error fetching availability:', err);
      setIsScheduleClosed(true);
      setClosedMessage('Não foi possível carregar os horários. Tente novamente mais tarde.');
    } finally {
      setIsLoading(false);
    }
  }, [selectedDoctor, selectedUnit, selectedSpecialty, selectedDate, selectedSlot]);

  useEffect(() => {
    if (selectedDoctor && selectedUnit && selectedSpecialty && selectedDate) {
      fetchAvailability();
    }
  }, [selectedDoctor, selectedUnit, selectedSpecialty, selectedDate, fetchAvailability]);

  // Real-time synchronization: When appointments are booked/cancelled by ANY user on the server,
  // immediately update the availability without refreshing the page!
  useEffect(() => {
    const unsubscribe = subscribe((event) => {
      if (
        event.type === 'APPOINTMENT_BOOKED' ||
        event.type === 'APPOINTMENT_CANCELLED' ||
        event.type === 'AVAILABILITY_CHANGED' ||
        event.type === 'SCHEDULE_UPDATED'
      ) {
        if (selectedDoctor && selectedDate) {
          fetchAvailability();
        }
      }
    });
    return () => unsubscribe();
  }, [subscribe, selectedDoctor, selectedDate, fetchAvailability]);

  // Handle specialty icon
  const getSpecialtyIcon = (iconName?: string) => {
    switch (iconName) {
      case 'Heart':
        return <Heart className="w-5 h-5 text-rose-500" />;
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Activity':
        return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'Smile':
        return <Smile className="w-5 h-5 text-sky-500" />;
      case 'Eye':
        return <Eye className="w-5 h-5 text-indigo-500" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-purple-500" />;
      default:
        return <Stethoscope className="w-5 h-5 text-teal-600" />;
    }
  };

  // STEP 8: Atomic confirmation submission
  const handleConfirmBooking = async () => {
    if (!currentPatient?.id) {
      setBookingError('Identificação do paciente necessária. Por favor, realize login.');
      return;
    }
    if (!selectedDoctor || !selectedUnit || !selectedSpecialty || !selectedDate || !selectedSlot) {
      setBookingError('Por favor, selecione todos os dados da consulta.');
      return;
    }

    setIsLoading(true);
    setBookingError(null);

    try {
      const appointment = await api.appointments.book({
        patientId: currentPatient.id,
        doctorId: selectedDoctor.id,
        unitId: selectedUnit.id,
        specialtyId: selectedSpecialty.id,
        date: selectedDate,
        startTime: selectedSlot.time,
        notes: consultationNotes,
      });

      setConfirmedAppointment(appointment);
      setCurrentStep(9); // Step 9: Exibir confirmação
      if (onBookingSuccess) {
        onBookingSuccess(appointment);
      }
    } catch (err: any) {
      // Handles 409 Conflict:
      // "Este horário acabou de ser reservado por outro paciente. Atualize a agenda e escolha outro horário."
      setBookingError(err.message || 'Erro ao processar reserva atômica.');
      // Refresh slots automatically so the user sees the updated state
      fetchAvailability();
    } finally {
      setIsLoading(false);
    }
  };

  // Download iCal (.ics) file
  const handleDownloadCalendar = () => {
    if (!confirmedAppointment) return;

    const [year, month, day] = confirmedAppointment.date.split('-');
    const [startH, startM] = confirmedAppointment.startTime.split(':');
    const [endH, endM] = confirmedAppointment.endTime.split(':');

    const dtStart = `${year}${month}${day}T${startH}${startM}00`;
    const dtEnd = `${year}${month}${day}T${endH}${endM}00`;

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MedAgenda//Sistema de Agendamento Medico//PT-BR
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Consulta com ${confirmedAppointment.doctorName} - ${confirmedAppointment.specialtyName}
DESCRIPTION:Consulta médica confirmada via MedAgenda. Código: ${confirmedAppointment.appointmentNumber}\\nUnidade: ${confirmedAppointment.unitName}
LOCATION:${confirmedAppointment.unitAddress}
DTSTART:${dtStart}
DTEND:${dtEnd}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `consulta_${confirmedAppointment.appointmentNumber}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCancelJustBooked = async () => {
    if (!confirmedAppointment) return;
    if (!confirm('Deseja realmente cancelar este agendamento recém-criado?')) return;

    try {
      await api.appointments.cancel(confirmedAppointment.id, {
        reason: 'Cancelado pelo paciente na tela de confirmação',
        userId: currentUser?.id,
      });
      alert('Consulta cancelada. O horário foi liberado novamente na agenda.');
      // Reset wizard
      setCurrentStep(1);
      setSelectedSlot(null);
      setConfirmedAppointment(null);
    } catch (e: any) {
      alert(e.message || 'Erro ao cancelar.');
    }
  };

  // Step Indicators
  const stepsList = [
    { num: 1, label: 'Especialidade' },
    { num: 2, label: 'Unidade' },
    { num: 3, label: 'Médico' },
    { num: 4, label: 'Data' },
    { num: 5, label: 'Horário' },
    { num: 7, label: 'Revisão' },
    { num: 9, label: 'Confirmação' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Top Breadcrumb & Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 font-outfit tracking-tight">
              Agendamento de Consulta
            </h1>
            <p className="text-sm text-slate-500">
              Escolha especialidade, unidade e horário em poucos cliques com confirmação imediata.
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-teal-50 border border-teal-100 text-teal-800 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-teal-600" />
            Reserva Atômica Sem Filas
          </div>
        </div>

        {/* Step tracker bar */}
        <div className="hidden md:flex items-center justify-between border-y border-slate-200 py-3 bg-white px-4 rounded-xl shadow-xs">
          {stepsList.map((st, i) => {
            const isActive = currentStep === st.num;
            const isDone = currentStep > st.num || (st.num === 5 && currentStep >= 6);
            return (
              <React.Fragment key={st.num}>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      isDone
                        ? 'bg-teal-600 text-white'
                        : isActive
                        ? 'bg-teal-100 text-teal-800 ring-2 ring-teal-500'
                        : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {isDone ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : st.num}
                  </div>
                  <span
                    className={`text-xs font-medium ${
                      isActive ? 'text-slate-900 font-bold' : isDone ? 'text-slate-700' : 'text-slate-400'
                    }`}
                  >
                    {st.label}
                  </span>
                </div>
                {i < stepsList.length - 1 && (
                  <div className="flex-1 max-w-[40px] h-[2px] bg-slate-200 mx-2" />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* STEP 1: Selecionar Especialidade */}
        {currentStep === 1 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Passo 1 de 8</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Selecione a Especialidade Desejada</h2>
                <p className="text-xs text-slate-500">Qual tipo de atendimento médico você está buscando?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {specialties.map((spec) => {
                const isSelected = selectedSpecialty?.id === spec.id;
                return (
                  <div
                    key={spec.id}
                    onClick={() => {
                      setSelectedSpecialty(spec);
                      setSelectedDoctor(null); // Reset doctor
                    }}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow-2xs">
                        {getSpecialtyIcon(spec.iconName)}
                      </div>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </span>
                      )}
                    </div>
                    <div className="mt-3">
                      <h3 className="font-bold text-slate-900 text-sm">{spec.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {spec.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
              <button
                disabled={!selectedSpecialty}
                onClick={() => setCurrentStep(2)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              >
                Continuar para Unidade
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Selecionar Unidade */}
        {currentStep === 2 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Passo 2 de 8</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Selecione a Unidade de Atendimento</h2>
                <p className="text-xs text-slate-500">
                  Especialidade: <strong className="text-slate-800">{selectedSpecialty?.name}</strong>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {units.map((u) => {
                const isSelected = selectedUnit?.id === u.id;
                return (
                  <div
                    key={u.id}
                    onClick={() => {
                      setSelectedUnit(u);
                      setSelectedDoctor(null);
                    }}
                    className={`p-5 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="w-10 h-10 rounded-xl bg-teal-100/70 text-teal-800 flex items-center justify-center">
                          <Building className="w-5 h-5" />
                        </div>
                        {isSelected && (
                          <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </span>
                        )}
                      </div>

                      <h3 className="font-bold text-slate-900 text-sm mt-3">{u.name}</h3>
                      <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400 mt-0.5" />
                        <span>
                          {u.address}, {u.number} {u.complement && `- ${u.complement}`} <br />
                          {u.neighborhood}, {u.city} - {u.state}
                        </span>
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 text-[11px] text-slate-400">
                      Tel: {u.phone}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                disabled={!selectedUnit}
                onClick={() => setCurrentStep(3)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              >
                Continuar para Médico
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Selecionar Médico */}
        {currentStep === 3 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Passo 3 de 8</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Selecione o Médico Especialista</h2>
                <p className="text-xs text-slate-500">
                  {selectedSpecialty?.name} na {selectedUnit?.name}
                </p>
              </div>
            </div>

            {doctors.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-500">
                <Stethoscope className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">Nenhum médico disponível para esta unidade e especialidade.</p>
                <p className="text-xs text-slate-400 mt-1">Por favor, volte e escolha outra unidade ou especialidade.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {doctors.map((doc) => {
                  const isSelected = selectedDoctor?.id === doc.id;
                  return (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoctor(doc)}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-4 ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/50 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <img
                        src={doc.avatarUrl}
                        alt={doc.name}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                            <p className="text-xs text-teal-700 font-semibold">{doc.crm}</p>
                          </div>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-teal-600 text-white flex items-center justify-center shrink-0">
                              <Check className="w-3 h-3 stroke-[3]" />
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                          {doc.bio || 'Médico credenciado com ampla experiência em consultas ambulatoriais.'}
                        </p>

                        <div className="mt-2.5 flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {doc.appointmentDurationMinutes} min por consulta
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                disabled={!selectedDoctor}
                onClick={() => setCurrentStep(4)}
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              >
                Continuar para Data e Horário
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 4, 5, 6: Selecionar Data e Horários Disponíveis */}
        {currentStep >= 4 && currentStep <= 6 && (
          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Passos 4, 5 e 6 de 8</span>
                <h2 className="text-xl font-bold text-slate-900 mt-1">Data e Horários Disponíveis</h2>
                <p className="text-xs text-slate-500">
                  {selectedDoctor?.name} &bull; {selectedSpecialty?.name} na {selectedUnit?.name}
                </p>
              </div>

              {/* Real-time Indicator Badge */}
              <div className="flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Disponibilidade em Tempo Real
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left column: Date Selector */}
              <div className="lg:col-span-5 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                  <CalendarIcon className="w-4 h-4 text-teal-600" />
                  Selecione o Dia da Consulta:
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  min={getInitialDate()}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 shadow-2xs focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />

                <div className="mt-4 text-xs text-slate-500 space-y-1.5">
                  <p className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <strong>Horário Livre:</strong> Disponível para agendamento
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <strong>Encaixe / Extra:</strong> Horário especial autorizado
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    <strong>Indisponível / Ocupado:</strong> Já reservado por outro paciente
                  </p>
                </div>

                <div className="mt-6 p-3 bg-teal-50/70 rounded-xl border border-teal-100 text-[11px] text-teal-800 leading-relaxed">
                  <Info className="w-4 h-4 text-teal-600 mb-1" />
                  Os horários exibidos são calculados com base na escala médica oficial de {selectedDoctor?.name} (duração média: {selectedDoctor?.appointmentDurationMinutes} min).
                </div>
              </div>

              {/* Right column: Real-Time Slots */}
              <div className="lg:col-span-7">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-slate-800">
                    Horários para {selectedDate.split('-').reverse().join('/')}:
                  </h3>
                  {isLoading && <span className="text-xs text-teal-600 animate-pulse">Atualizando agenda...</span>}
                </div>

                {isScheduleClosed || availableSlots.length === 0 ? (
                  /* REQUIRED CLOSED SCHEDULE MESSAGE */
                  <div className="p-6 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs leading-relaxed space-y-2">
                    <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      Agenda Fechada ou Sem Vagas
                    </div>
                    <p>{closedMessage}</p>
                    <div className="pt-2 text-[11px] text-amber-700">
                      Telefone da unidade: <strong>{selectedUnit?.phone}</strong>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {availableSlots.map((slot) => {
                      const isSelected = selectedSlot?.time === slot.time;
                      const isAvailable = slot.available;

                      return (
                        <button
                          key={slot.time}
                          disabled={!isAvailable}
                          onClick={() => {
                            if (isAvailable) setSelectedSlot(slot);
                          }}
                          className={`p-3 rounded-xl text-center border transition-all flex flex-col items-center justify-center relative ${
                            !isAvailable
                              ? 'bg-slate-100/70 border-slate-200 text-slate-400 cursor-not-allowed line-through'
                              : isSelected
                              ? 'bg-teal-600 text-white border-teal-600 shadow-md ring-2 ring-teal-300 font-bold'
                              : 'bg-white border-slate-200 text-slate-800 hover:border-teal-500 hover:bg-teal-50/40 font-semibold'
                          }`}
                        >
                          <span className="text-sm">{slot.time}</span>
                          <span className="text-[10px] opacity-75 mt-0.5">às {slot.endTime}</span>

                          {slot.isFitIn && (
                            <span className="absolute -top-1.5 -right-1 px-1.5 py-0.2 bg-amber-500 text-white text-[9px] font-bold rounded-full">
                              Encaixe
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
              <button
                disabled={!selectedSlot}
                onClick={() => setCurrentStep(7)} // Step 7: Confirmar dados
                className="px-6 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-all"
              >
                Revisar Agendamento
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 7 & 8: Confirmar Dados e Agendar */}
        {currentStep === 7 && (
          <div className="p-6 sm:p-8">
            <div className="mb-6">
              <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">Passo 7 e 8 de 8</span>
              <h2 className="text-xl font-bold text-slate-900 mt-1">Confirmação dos Dados da Consulta</h2>
              <p className="text-xs text-slate-500">
                Verifique cuidadosamente os detalhes antes de confirmar a reserva definitiva.
              </p>
            </div>

            {bookingError && (
              <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Atenção ao realizar agendamento:</p>
                  <p className="mt-0.5">{bookingError}</p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Summary Card */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3.5 text-xs">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Resumo do Atendimento
                </h3>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Especialidade:</span>
                  <strong className="text-slate-800">{selectedSpecialty?.name}</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Médico Responsável:</span>
                  <strong className="text-slate-800">{selectedDoctor?.name} ({selectedDoctor?.crm})</strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Unidade:</span>
                  <strong className="text-slate-800">{selectedUnit?.name}</strong>
                </div>

                <div className="flex items-start justify-between">
                  <span className="text-slate-500">Endereço:</span>
                  <span className="text-slate-700 text-right max-w-[220px]">
                    {selectedUnit?.address}, {selectedUnit?.number} - {selectedUnit?.neighborhood}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                  <span className="text-slate-500 font-medium">Data Agendada:</span>
                  <strong className="text-teal-700 font-bold text-sm">
                    {selectedDate.split('-').reverse().join('/')}
                  </strong>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Horário da Consulta:</span>
                  <strong className="text-teal-700 font-bold text-sm">
                    {selectedSlot?.time} às {selectedSlot?.endTime}
                  </strong>
                </div>
              </div>

              {/* Patient Data & Notes */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                <h3 className="font-bold text-slate-900 text-sm border-b border-slate-200 pb-2">
                  Dados do Paciente
                </h3>

                <div>
                  <label className="block text-slate-500 mb-0.5">Nome Completo:</label>
                  <p className="font-bold text-slate-800 text-sm">{currentPatient?.name || currentUser?.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-slate-500 mb-0.5">CPF:</label>
                    <p className="font-medium text-slate-800">{currentPatient?.cpf || currentUser?.cpf}</p>
                  </div>
                  <div>
                    <label className="block text-slate-500 mb-0.5">Telefone:</label>
                    <p className="font-medium text-slate-800">{currentPatient?.phone || currentUser?.phone}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 mb-0.5">E-mail para confirmação:</label>
                  <p className="font-medium text-slate-800">{currentPatient?.email || currentUser?.email}</p>
                </div>

                <div>
                  <label className="block text-slate-600 font-medium mb-1">
                    Observações ou sintomas principais (opcional):
                  </label>
                  <textarea
                    rows={2}
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    placeholder="Ex: Primeira consulta, retorno de exames..."
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentStep(4)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                Alterar Horário
              </button>

              <button
                disabled={isLoading}
                onClick={handleConfirmBooking}
                className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-extrabold flex items-center gap-2 shadow-md shadow-teal-600/20 transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processando Reserva Atômica...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Agendamento
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* STEP 9: Exibir Confirmação da Consulta */}
        {currentStep === 9 && confirmedAppointment && (
          <div className="p-6 sm:p-10 text-center animate-in fade-in duration-300">
            <div className="w-16 h-16 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center mx-auto mb-4 shadow-inner">
              <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
            </div>

            <span className="text-xs font-bold text-teal-600 uppercase tracking-wider">
              Agendamento Concluído com Sucesso!
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 mt-1">
              Consulta Confirmada
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Seu horário foi garantido no sistema. Notificações automáticas foram enviadas por E-mail e SMS.
            </p>

            {/* Confirmation Ticket Card */}
            <div className="max-w-lg mx-auto mt-6 bg-slate-50 border border-slate-200 rounded-2xl p-6 text-left shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400">Código da Consulta</span>
                  <p className="text-lg font-mono font-extrabold text-teal-800">
                    {confirmedAppointment.appointmentNumber}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Confirmada
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 my-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Paciente</span>
                  <strong className="text-slate-800">{confirmedAppointment.patientName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Médico</span>
                  <strong className="text-slate-800">{confirmedAppointment.doctorName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Especialidade</span>
                  <strong className="text-slate-800">{confirmedAppointment.specialtyName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Unidade</span>
                  <strong className="text-slate-800">{confirmedAppointment.unitName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Data</span>
                  <strong className="text-slate-800">
                    {confirmedAppointment.date.split('-').reverse().join('/')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Horário</span>
                  <strong className="text-slate-800">
                    {confirmedAppointment.startTime} às {confirmedAppointment.endTime}
                  </strong>
                </div>
              </div>

              {/* Automated Notification Badges */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                  <Smartphone className="w-3.5 h-3.5" /> SMS Enviado
                </span>
                <span className="flex items-center gap-1.5 text-sky-700 font-semibold">
                  <Mail className="w-3.5 h-3.5" /> E-mail Enviado
                </span>
              </div>
            </div>

            {/* Actions: Add to Calendar, View, Cancel */}
            <div className="max-w-lg mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleDownloadCalendar}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <CalendarPlus className="w-4 h-4 text-teal-400" />
                Adicionar ao Calendário (.ics)
              </button>

              <button
                onClick={() => {
                  if (onViewAppointments) onViewAppointments();
                }}
                className="px-4 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4" />
                Minhas Consultas
              </button>

              <button
                onClick={handleCancelJustBooked}
                className="px-4 py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-colors"
              >
                Cancelar Consulta
              </button>
            </div>

            <div className="mt-8 text-xs text-slate-400">
              Precisa de outro agendamento?{' '}
              <button
                onClick={() => {
                  setCurrentStep(1);
                  setSelectedSlot(null);
                  setConfirmedAppointment(null);
                }}
                className="text-teal-600 font-bold hover:underline"
              >
                Novo agendamento
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
