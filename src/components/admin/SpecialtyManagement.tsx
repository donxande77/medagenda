import React, { useState, useEffect } from 'react';
import { api } from '../../services/api.ts';
import { Specialty } from '../../types/index.ts';
import {
  Stethoscope,
  Plus,
  Edit2,
  Trash2,
  X,
  Heart,
  Sparkles,
  Activity,
  Smile,
  Eye,
  UserCheck,
} from 'lucide-react';

export const SpecialtyManagement: React.FC = () => {
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSpecialty, setEditingSpecialty] = useState<Specialty | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [iconName, setIconName] = useState('Stethoscope');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');

  const loadSpecialties = async () => {
    try {
      const list = await api.specialties.list();
      setSpecialties(list);
    } catch (err) {
      console.error('Error loading specialties:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSpecialties();
  }, []);

  const handleOpenCreate = () => {
    setEditingSpecialty(null);
    setName('');
    setDescription('');
    setIconName('Stethoscope');
    setStatus('active');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: Specialty) => {
    setEditingSpecialty(s);
    setName(s.name);
    setDescription(s.description || '');
    setIconName(s.iconName || 'Stethoscope');
    setStatus(s.status);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        name,
        description,
        iconName,
        status,
      };

      if (editingSpecialty) {
        await api.specialties.update(editingSpecialty.id, payload);
      } else {
        await api.specialties.create(payload);
      }

      setIsModalOpen(false);
      await loadSpecialties();
    } catch (err: any) {
      alert(err.message || 'Erro ao salvar especialidade.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente excluir esta especialidade?')) return;
    try {
      await api.specialties.delete(id);
      await loadSpecialties();
    } catch (err: any) {
      alert(err.message || 'Erro ao excluir especialidade.');
    }
  };

  const renderIcon = (name?: string) => {
    switch (name) {
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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 font-outfit">
            Especialidades Médicas
          </h1>
          <p className="text-xs text-slate-500">
            Cadastre as áreas de atuação médica ofertadas aos pacientes no agendamento.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Cadastrar Especialidade
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {specialties.map((s) => (
          <div
            key={s.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                  {renderIcon(s.iconName)}
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    s.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {s.status === 'active' ? 'Ativa' : 'Inativa'}
                </span>
              </div>

              <h3 className="font-bold text-slate-900 text-sm mt-3">{s.name}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                {s.description || 'Especialidade médica ambulatorial cadastrada no sistema.'}
              </p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex justify-end gap-1">
              <button
                onClick={() => handleOpenEdit(s)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-teal-700 hover:bg-teal-50"
                title="Editar"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(s.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                title="Excluir"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* CREATE / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-slate-200 p-6 space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900">
                {editingSpecialty ? 'Editar Especialidade' : 'Cadastrar Especialidade'}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nome *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Neurologia Clínica"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ícone</label>
                <select
                  value={iconName}
                  onChange={(e) => setIconName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="Stethoscope">Estetoscópio (Padrão)</option>
                  <option value="Heart">Coração (Cardiologia)</option>
                  <option value="Sparkles">Estrela (Dermatologia)</option>
                  <option value="Activity">Atividade (Ortopedia)</option>
                  <option value="Smile">Sorriso (Pediatria)</option>
                  <option value="Eye">Olho (Oftalmologia)</option>
                  <option value="UserCheck">Médico Geral (Clínica)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descrição</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Breve descrição da especialidade..."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                >
                  <option value="active">Ativa</option>
                  <option value="inactive">Inativa</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-xs"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
