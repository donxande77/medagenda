import React, { useState } from 'react';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import { NotificationItem } from '../../types/index.ts';
import { Mail, MessageSquare, Bell, X, CheckCheck, Smartphone, Clock, Calendar, CheckCircle2 } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationDrawerModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { notifications, markAllNotificationsAsRead } = useRealtime();
  const [filter, setFilter] = useState<'all' | 'sms' | 'email' | 'system'>('all');
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null);

  if (!isOpen) return null;

  const filtered = notifications.filter((n) => filter === 'all' || n.channel === filter);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-[85vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Central de Notificações Automatizadas
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-teal-100 text-teal-800 font-medium">
                  {notifications.length} envios registrados
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Disparos instantâneos por E-mail, SMS e Sistema para confirmações, cancelamentos e reagendamentos
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={markAllNotificationsAsRead}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 transition-colors"
            >
              <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
              Marcar lidas
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                filter === 'all'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              Todas ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('sms')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                filter === 'sms'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              SMS ({notifications.filter((n) => n.channel === 'sms').length})
            </button>
            <button
              onClick={() => setFilter('email')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                filter === 'email'
                  ? 'bg-sky-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              E-mail ({notifications.filter((n) => n.channel === 'email').length})
            </button>
            <button
              onClick={() => setFilter('system')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all ${
                filter === 'system'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Sistema ({notifications.filter((n) => n.channel === 'system').length})
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            Simulador de Gateway Ativo
          </div>
        </div>

        {/* Content Split: List + Preview */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Notifications List */}
          <div className="md:col-span-6 overflow-y-auto p-4 space-y-2.5">
            {filtered.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <Bell className="w-10 h-10 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-sm">Nenhuma notificação registrada neste filtro.</p>
              </div>
            ) : (
              filtered.map((notif) => {
                const isSelected = selectedNotification?.id === notif.id;
                return (
                  <div
                    key={notif.id}
                    onClick={() => setSelectedNotification(notif)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'border-teal-500 bg-teal-50/50 shadow-xs ring-1 ring-teal-400'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {notif.channel === 'sms' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            <Smartphone className="w-3 h-3" /> SMS Automático
                          </span>
                        )}
                        {notif.channel === 'email' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-sky-100 text-sky-800">
                            <Mail className="w-3 h-3" /> E-mail Oficial
                          </span>
                        )}
                        {notif.channel === 'system' && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-100 text-indigo-800">
                            <Bell className="w-3 h-3" /> Alerta do App
                          </span>
                        )}
                        {notif.appointmentNumber && (
                          <span className="text-[11px] text-slate-500 font-mono font-medium">
                            {notif.appointmentNumber}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 whitespace-nowrap">
                        {new Date(notif.timestamp).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-1">
                      {notif.title}
                    </h4>
                    <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                      {notif.message}
                    </p>

                    <div className="mt-2 pt-2 border-t border-slate-100/80 flex items-center justify-between text-[11px] text-slate-400">
                      <span>Destinatário: <strong className="text-slate-600">{notif.recipient}</strong></span>
                      <span className="text-emerald-600 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Entregue
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Detailed Preview / Device Simulation */}
          <div className="md:col-span-6 overflow-y-auto p-5 bg-slate-50/50 flex flex-col justify-center items-center">
            {selectedNotification ? (
              <div className="w-full max-w-sm">
                <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2 text-center">
                  Visualização do Destinatário ({selectedNotification.channel.toUpperCase()})
                </div>

                {selectedNotification.channel === 'sms' ? (
                  /* Smartphone SMS Mockup */
                  <div className="bg-slate-900 rounded-3xl p-3 shadow-xl border-4 border-slate-800">
                    <div className="w-20 h-4 bg-slate-800 rounded-full mx-auto mb-3" />
                    <div className="bg-slate-800/80 rounded-t-xl px-3 py-2 flex items-center justify-between text-slate-300 text-xs border-b border-slate-700/50">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
                          MA
                        </div>
                        <div>
                          <p className="font-semibold text-slate-100">MedAgenda SMS</p>
                          <p className="text-[10px] text-slate-400">{selectedNotification.recipient}</p>
                        </div>
                      </div>
                      <span className="text-[10px] text-slate-400">Agora</span>
                    </div>

                    <div className="bg-slate-950 p-4 rounded-b-xl min-h-[220px] flex flex-col justify-end">
                      <div className="bg-emerald-600 text-white text-xs p-3 rounded-2xl rounded-bl-xs max-w-[90%] shadow-sm leading-relaxed">
                        {selectedNotification.message}
                      </div>
                      <span className="text-[10px] text-slate-500 mt-1 pl-1">
                        Entregue via MedAgenda SMS Gateway
                      </span>
                    </div>
                  </div>
                ) : selectedNotification.channel === 'email' ? (
                  /* Email client preview */
                  <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden text-xs">
                    <div className="bg-slate-100 px-4 py-3 border-b border-slate-200">
                      <p className="text-slate-500 text-[11px]">De: <strong>MedAgenda Confirmações &lt;nao-responda@medagenda.com.br&gt;</strong></p>
                      <p className="text-slate-500 text-[11px] mt-0.5">Para: <strong>{selectedNotification.recipient}</strong></p>
                      <p className="text-slate-800 font-bold mt-1 text-sm">{selectedNotification.title}</p>
                    </div>

                    <div className="p-4 space-y-3 whitespace-pre-line text-slate-700 leading-relaxed font-sans">
                      {selectedNotification.message}
                    </div>

                    <div className="bg-teal-50 border-t border-teal-100 p-3 flex items-center justify-between text-[11px] text-teal-800">
                      <span>Arquivo de Calendário (iCal / .ics) anexado</span>
                      <Calendar className="w-4 h-4 text-teal-600" />
                    </div>
                  </div>
                ) : (
                  /* In-app notification card */
                  <div className="bg-white p-5 rounded-2xl shadow-lg border border-indigo-100">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
                      <Bell className="w-4 h-4" />
                      {selectedNotification.title}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      {selectedNotification.message}
                    </p>
                    <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                      <span>Notificação do Sistema</span>
                      <span>Ref: {selectedNotification.appointmentNumber || '-'}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center text-slate-400 py-12">
                <Smartphone className="w-12 h-12 mx-auto stroke-1 text-slate-300 mb-2" />
                <p className="text-sm font-medium">Selecione uma notificação na lista</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Veja a reprodução fiel do SMS recebido no celular do paciente ou o e-mail oficial com layout médico.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
