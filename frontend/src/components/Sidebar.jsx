import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Building2,
  CalendarOff,
  FileBarChart,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export default function Sidebar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { id: 'planificacion', label: 'Planificacion', path: '/planificacion', icon: CalendarDays },
    { id: 'trabajadores', label: 'Trabajadores', path: '/trabajadores', icon: Users },
    { id: 'clientes', label: 'Clientes', path: '/clientes', icon: Building2 },
    { id: 'ausencias', label: 'Ausencias', path: '/ausencias', icon: CalendarOff },
    { id: 'informes', label: 'Informes', path: '/informes', icon: FileBarChart },
    { id: 'rrhh', label: 'RR.HH', path: '/rrhh', icon: Briefcase },
  ];

  const handleMenuClick = (path) => {
    navigate(path);
    setMenuAbierto(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="lg:hidden fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
        />
      )}

      <aside
        className={`
          fixed lg:relative
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64 h-screen
          bg-[#0f172a] text-white
          flex flex-col
          transition-all duration-300 ease-in-out
          z-40
          ${menuAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className={`flex items-center gap-3 ${collapsed ? 'justify-center w-full' : ''}`}>
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1 flex-shrink-0">
                <img
                  src="/logo-grupo-rubio-2.png"
                  alt="Grupo Rubio"
                  className="w-full h-full object-contain"
                />
              </div>
              {!collapsed && (
                <h1 className="font-bold text-lg tracking-tight">Grupo Rubio</h1>
              )}
            </div>

            <button
              onClick={() => setMenuAbierto(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {!collapsed && (
              <button
                onClick={toggleCollapsed}
                className="hidden lg:flex w-8 h-8 items-center justify-center text-gray-500 hover:text-white rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>
        </div>

        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex w-full py-3 items-center justify-center text-gray-500 hover:text-white hover:bg-white/[0.06] transition-colors border-b border-white/[0.06]"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.path)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  collapsed ? 'justify-center' : ''
                } ${
                  isActive(item.path)
                    ? 'bg-teal-500/15 text-teal-400'
                    : 'text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="font-medium text-sm">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User + Logout */}
        <div className="p-3 border-t border-white/[0.06]">
          <div className={`flex items-center gap-3 px-3 py-2 mb-2 ${collapsed ? 'justify-center px-0' : ''}`}>
            <div className="w-10 h-10 bg-teal-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="font-bold text-teal-400">{user?.nombre?.charAt(0) || '?'}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-gray-200">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-gray-500">{user?.rol || ''}</p>
              </div>
            )}
            {!collapsed && user?.rol === 'ADMIN' && (
              <button
                onClick={() => handleMenuClick('/ajustes')}
                title="Ajustes"
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all flex-shrink-0 ${
                  isActive('/ajustes')
                    ? 'bg-teal-500/15 text-teal-400'
                    : 'bg-white/[0.06] text-gray-400 hover:text-gray-200'
                }`}
              >
                <Settings size={18} />
              </button>
            )}
          </div>

          {collapsed && user?.rol === 'ADMIN' && (
            <button
              onClick={() => handleMenuClick('/ajustes')}
              title="Ajustes"
              className={`w-full flex items-center justify-center py-3 rounded-xl transition-all mb-1 ${
                isActive('/ajustes')
                  ? 'bg-teal-500/15 text-teal-400'
                  : 'text-gray-400 hover:bg-white/[0.06] hover:text-gray-200'
              }`}
            >
              <Settings size={20} />
            </button>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesion' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-500 hover:bg-rose-500/10 hover:text-rose-400 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span className="font-medium text-sm">Cerrar sesion</span>}
          </button>
        </div>
      </aside>

      {!menuAbierto && (
        <button
          onClick={() => setMenuAbierto(true)}
          className="lg:hidden fixed top-4 left-4 z-30 w-12 h-12 bg-[#0f172a] text-white rounded-xl flex items-center justify-center shadow-lg"
        >
          <Menu size={24} />
        </button>
      )}
    </>
  );
}
