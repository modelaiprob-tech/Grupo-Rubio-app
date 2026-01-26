import React from 'react';

export default function Sidebar({ currentPage, setCurrentPage, user, onLogout }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'planificacion', label: 'Planificación' },
    { id: 'plantillas', label: 'Plantillas' },
    { id: 'trabajadores', label: 'Trabajadores' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'ausencias', label: 'Ausencias' },
    { id: 'informes', label: 'Informes' },
    { id: 'rrhh', label: 'RR.HH' },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-800">
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
            <p className="text-xs text-slate-400">Gestión de Horas</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setCurrentPage(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              currentPage === item.id
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
      <span className="font-bold">{user.nombre.charAt(0)}</span>
    </div>
    <div className="flex-1">
      <p className="text-sm font-medium">{user.nombre}</p>
      <p className="text-xs text-slate-400">{user.rol}</p>
    </div>
    {user.rol === 'ADMIN' && (
      <button
        onClick={() => setCurrentPage('ajustes')}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
          currentPage === 'ajustes'
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
    onClick={onLogout}
    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
  >
    <span></span>
    <span className="font-medium">Cerrar sesión</span>
  </button>
</div>
    </aside>
  );
}