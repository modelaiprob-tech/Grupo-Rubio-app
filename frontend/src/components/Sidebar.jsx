import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { id: 'planificacion', label: 'Planificación', path: '/planificacion' },
    { id: 'trabajadores', label: 'Trabajadores', path: '/trabajadores' },
    { id: 'clientes', label: 'Clientes', path: '/clientes' },
    { id: 'ausencias', label: 'Ausencias', path: '/ausencias' },
    { id: 'informes', label: 'Informes', path: '/informes' },
    { id: 'rrhh', label: 'RR.HH', path: '/rrhh' },
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
          w-64 h-screen
          bg-slate-900 text-white
          flex flex-col
          transition-transform duration-300
          z-40
          ${menuAbierto ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
                <img
                  src="/logo-grupo-rubio-2.png"
                  alt="Grupo Rubio"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h1 className="font-bold">Grupo Rubio</h1>
              </div>
            </div>

            {/* Botón X cuando está abierto (solo móvil) */}
            <button
              onClick={() => setMenuAbierto(false)}
              className="lg:hidden w-8 h-8 flex items-center justify-center text-slate-400 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleMenuClick(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                isActive(item.path)
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
              <span className="font-bold">{user?.nombre?.charAt(0) || '?'}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{user?.nombre || 'Usuario'}</p>
              <p className="text-xs text-slate-400">{user?.rol || ''}</p>
            </div>
            {user?.rol === 'ADMIN' && (
              <button
                onClick={() => handleMenuClick('/ajustes')}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isActive('/ajustes')
                    ? 'bg-blue-500 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-white'
                }`}
                title="Ajustes"
              >
                ⚙️
              </button>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
          >
            <span>→</span>
            <span className="font-medium">Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Botón hamburguesa FUERA del sidebar (solo móvil cuando cerrado) */}
      {!menuAbierto && (
        <button
          onClick={() => setMenuAbierto(true)}
          className="lg:hidden fixed top-4 left-4 z-30 w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-lg"
        >
          ☰
        </button>
      )}
    </>
  );
}
