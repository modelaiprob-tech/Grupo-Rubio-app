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
    { id: 'planificacion', label: 'Planificación', path: '/planificacion', icon: CalendarDays },
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
      {/* Overlay oscuro (solo móvil cuando menu abierto) */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:relative
          ${collapsed ? 'lg:w-20' : 'lg:w-64'}
          w-64 h-screen
          bg-slate-900 text-white
          flex flex-col
          transition-all duration-300 ease-in-out
          z-40
          ${menuAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-800">
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
                <h1 className="font-bold text-lg">Grupo Rubio</h1>
              )}
            </div>

            {/* Botón cerrar móvil */}
            <button
              onClick={() => setMenuAbierto(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {/* Botón toggle desktop */}
            {!collapsed && (
              <button
                onClick={toggleCollapsed}
                className="hidden lg:flex w-8 h-8 items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Botón expandir cuando está colapsado (desktop) */}
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="hidden lg:flex w-full py-3 items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition-colors border-b border-slate-800"
          >
            <ChevronRight size={18} />
          </button>
        )}

        {/* Navegación */}
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
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* Usuario y logout */}
        <div className="p-3 border-t border-slate-800">
          <div className={`flex items-center gap-3 px-3 py-2 mb-2 ${collapsed ? 'justify-center px-0' : ''}`}>
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="font-bold">{user?.nombre?.charAt(0) || '?'}</span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.nombre || 'Usuario'}</p>
                <p className="text-xs text-slate-400">{user?.rol || ''}</p>
              </div>
            )}
            {!collapsed && user?.rol === 'ADMIN' && (
              <button
                onClick={() => handleMenuClick('/ajustes')}
                title="Ajustes"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${
                  isActive('/ajustes')
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                }`}
              >
                <Settings size={18} />
              </button>
            )}
          </div>

          {/* Ajustes cuando está colapsado */}
          {collapsed && user?.rol === 'ADMIN' && (
            <button
              onClick={() => handleMenuClick('/ajustes')}
              title="Ajustes"
              className={`w-full flex items-center justify-center py-3 rounded-xl transition-all mb-1 ${
                isActive('/ajustes')
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Settings size={20} />
            </button>
          )}

          <button
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} className="flex-shrink-0" />
            {!collapsed && <span className="font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      {/* Botón hamburguesa FUERA del sidebar (solo móvil cuando cerrado) */}
      {!menuAbierto && (
        <button
          onClick={() => setMenuAbierto(true)}
          className="lg:hidden fixed top-4 left-4 z-30 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"
        >
          <Menu size={24} />
        </button>
      )}
    </>
  );
}
