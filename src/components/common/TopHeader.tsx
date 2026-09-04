import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.tsx';
import { useRealtime } from '../../context/RealtimeContext.tsx';
import {
  Menu,
  Search,
  Bell,
  LogOut,
  User,
  ShieldCheck,
  CalendarCheck,
} from 'lucide-react';
import { NotificationDrawerModal } from './NotificationDrawerModal.tsx';

interface TopHeaderProps {
  onToggleMobileMenu: () => void;
  onOpenAuthModal: () => void;
  onSearchChange?: (query: string) => void;
}

export const TopHeader: React.FC<TopHeaderProps> = ({
  onToggleMobileMenu,
  onOpenAuthModal,
  onSearchChange,
}) => {
  const { currentUser, logout, switchDemoRole } = useAuth();
  const { unreadCount } = useRealtime();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');

  const isAdmin = currentUser?.role === 'admin';

  const getInitials = (name?: string) => {
    if (!name) return 'MA';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
    if (onSearchChange) {
      onSearchChange(e.target.value);
    }
  };

  return (
    <>
      <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between shadow-xs sticky top-0 z-20">
        {/* Left: Mobile hamburger + Search Bar */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 max-w-md">
          <button
            type="button"
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 pointer-events-none">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchValue}
              onChange={handleSearch}
              placeholder="Pesquisar paciente ou médico..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all placeholder:text-slate-400 text-slate-800"
            />
          </div>
        </div>

        {/* Right Section: Notifications + User Status */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Notifications button */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50/50 rounded-lg transition-colors cursor-pointer"
            title="Abrir Central de Notificações (SMS, E-mail e Alertas)"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 ? (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white ring-1 ring-rose-500/20" />
            ) : null}
          </button>

          {/* User Profile Card */}
          {currentUser ? (
            <div className="flex items-center gap-3 pl-3 sm:pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  {isAdmin ? 'Administrador' : 'Paciente Cadastrado'}
                </p>
              </div>

              {/* Avatar circle with Initials */}
              <div className="w-10 h-10 bg-slate-100 rounded-full border border-slate-200 overflow-hidden flex items-center justify-center text-indigo-600 font-bold text-xs select-none">
                {getInitials(currentUser.name)}
              </div>

              {/* Logout Button */}
              <button
                type="button"
                onClick={() => {
                  logout();
                  onOpenAuthModal();
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                title="Sair da conta"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              Entrar
            </button>
          )}
        </div>
      </header>

      {/* Notification Drawer Modal */}
      <NotificationDrawerModal
        isOpen={isNotifOpen}
        onClose={() => setIsNotifOpen(false)}
      />
    </>
  );
};
