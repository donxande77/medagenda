import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Doctor, Specialty, Unit } from '../../types/index.ts';
import {
  Stethoscope,
  Plus,
  Search,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  X,
  Clock,
  Building,
} from 'lucide-react';

export const DoctorManagement: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [search, setSearch] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [crm, setCrm] = useState('');
  const [specialtyId, setSpecialtyId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>([]);
  const [duration, setDuration] = useState(30);
  const [interval, setInterval] = useState(0);
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [bio, setBio] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const loadData = async () => {
    try {
      const [docs, specs, unts] = await Promise.all([
        api.doctors.list(),
        api.specialties.list('active'),
        api.units.list('active'),
      ]);
      setDoctors(docs);
      setSpecialties(specs);
      setUnits(unts);
    } catch (err) {
      console.error('Error loading doctors data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingDoctor(null);
    setName('');
    setCrm('');
    setSpecialtyId(specialties[0]?.id || '');
    setPhone('(11) 98888-0000');
    setEmail('');
    setSelectedUnitIds(units.map((u) => u.id));
    setDuration(30);
    setInterval(0);
    setStatus('active');
    setBio('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (doc: Doctor) => {
    setEditingDoctor(doc);
    setName(doc.name);
    setCrm(doc.crm);
    setSpecialtyId(doc.specialtyId);
    setPhone(doc.phone);
    setEmail(doc.email);
    setSelectedUnitIds(doc.unitIds);
    setDuration(doc.appointmentDurationMinutes);
    setInterval(doc.intervalMinutes);
    setStatus(doc.status);
    setBio(doc.bio || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!name || !crm || !specialtyId || selectedUnitIds.length === 0) {
      setFormError('Preencha os campos obrigatórios e vincule ao menos uma unidade.');
      return;
    }

    try {
      const payload = {
        name,
        crm,
        specialtyId,
        phone,
        email,
        unitIds: selectedUnitIds,
        appointmentDurationMinutes: Number(duration),
        intervalMinutes: Number(interval),
        status,
        bio,
      };

      if (editingDoctor) {
        await api.doctors.update(editingDoctor.id, payload);
      } else {
        await api.doctors.create(payload);
      }

      setIsModalOpen(false);
      await loadData();
    } catch (err: any) {
      setFormError(err.message || 'Erro ao salvar médico.');
    }
  };

  const handleToggleStatus = async (doc: Doctor) => {
    try {
      const nextStatus = doc.status === 'active' ? 'inactive' : 'active';
      await api.doctors.update(doc.id, { status: nextStatus });
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao alterar status do médico.');
    }
  };

  const handleDeleteDoctor = async (id: string) => {
    if (!confirm('Deseja realmente excluir este médico?')) return;
    try {
      await api.doctors.delete(id);
      await loadData();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir médico.');
    }
  };

  const filtered = doctors.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.crm.toLowerCase().includes(search.toLowerCase()) ||
      doc.email.toLowerCase().includes(search.toLowerCase());
    const matchesSpec = filterSpecialty === 'all' || doc.specialtyId === filterSpecialty;
    return matchesSearch && matchesSpec;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-outfit">
            Corpo Clínico (Médicos)
          </h1>
          <p className="text-xs text-slate-500">
            Cadastre, edite e controle os médicos credenciados, CRM, especialidades e tempo padrão de atendimento.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Médico
        </button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Buscar por nome, CRM ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <label className="text-xs text-slate-500 font-medium">Especialidade:</label>
          <select
            value={filterSpecialty}
            onChange={(e) => setFilterSpecialty(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-hidden"
          >
            <option value="all">Todas ({specialties.length})</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Doctors Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Médico</th>
                <th className="py-3 px-4">CRM</th>
                <th className="py-3 px-4">Especialidade</th>
                <th className="py-3 px-4">Duração Consulta</th>
                <th className="py-3 px-4">Unidades</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Carregando médicos...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Nenhum médico encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filtered.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900 flex items-center gap-3">
                      <img
                        src={doc.avatarUrl}
                        alt={doc.name}
                        className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                      />
                      <div>
                        <p className="font-bold text-slate-900">{doc.name}</p>
                        <p className="text-[11px] text-slate-400">{doc.email}</p>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-800">{doc.crm}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-medium">
                        {doc.specialtyName}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-medium">
                      {doc.appointmentDurationMinutes} min
                      {doc.intervalMinutes > 0 && (
                        <span className="text-slate-400 text-[10px] ml-1">
                          (+{doc.intervalMinutes}m)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {doc.unitIds?.length || 0} unidade(s)
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStatus(doc)}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                          doc.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {doc.status === 'active' ? (
                          <>
                            <CheckCircle className="w-3 h-3" /> Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3" /> Inativo
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-1">
                      <button
                        onClick={() => handleOpenEdit(doc)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                        title="Editar médico"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDoctor(doc.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                        title="Excluir médico"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-teal-600" />
                {editingDoctor ? 'Editar Médico' : 'Cadastrar Novo Médico'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl">
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveDoctor} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ex: Dr. Lucas Medeiros"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">CRM *</label>
                  <input
                    type="text"
                    required
                    value={crm}
                    onChange={(e) => setCrm(e.target.value)}
                    placeholder="Ex: CRM/SP 123456"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Especialidade *</label>
                  <select
                    value={specialtyId}
                    onChange={(e) => setSpecialtyId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    {specialties.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">E-mail Profissional</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="medico@medagenda.com.br"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Telefone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="active">Ativo (visível para agendamento)</option>
                    <option value="inactive">Inativo (bloqueado)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Duração da Consulta (minutos) *
                  </label>
                  <input
                    type="number"
                    min={10}
                    max={120}
                    step={5}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Intervalo entre Consultas (minutos)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={60}
                    step={5}
                    value={interval}
                    onChange={(e) => setInterval(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Units multi-check */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Unidades onde o médico atende *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {units.map((u) => {
                    const checked = selectedUnitIds.includes(u.id);
                    return (
                      <label
                        key={u.id}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                          checked
                            ? 'border-teal-500 bg-teal-50/50 text-teal-900 font-semibold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedUnitIds([...selectedUnitIds, u.id]);
                            } else {
                              setSelectedUnitIds(selectedUnitIds.filter((id) => id !== u.id));
                            }
                          }}
                          className="rounded-sm text-teal-600 focus:ring-teal-500"
                        />
                        <span>{u.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Biografia e Credenciais</label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Resumo das credenciais, graduação e especialização..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  Salvar Médico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
