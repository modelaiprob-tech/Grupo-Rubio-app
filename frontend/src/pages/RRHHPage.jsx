import React, { useState } from 'react';
import SeccionCategorias from './rrhh/SeccionCategorias';
import SeccionAusencias from './rrhh/SeccionAusencias';
import SeccionAcuerdos from './rrhh/SeccionAcuerdos';
import ControlHorasPage from './ControlHorasPage';

export default function RRHHPage({ api }) {
  const [seccionActiva, setSeccionActiva] = useState('categorias');

  return (
      <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Recursos Humanos</h1>
        <p className="text-slate-600 mt-1">Configuración de nóminas y convenio colectivo</p>
      </div>

      {/* PESTAÑAS */}
      <div className="mb-6 flex gap-2 bg-white p-2 rounded-xl shadow-sm border border-slate-200">
        <button
          onClick={() => setSeccionActiva('categorias')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            seccionActiva === 'categorias'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Categorías Laborales
        </button>
        <button
          onClick={() => setSeccionActiva('ausencias')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            seccionActiva === 'ausencias'
              ? 'bg-green-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Tipos de Ausencia
        </button>
        <button
          onClick={() => setSeccionActiva('acuerdos')}
          className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
            seccionActiva === 'acuerdos'
              ? 'bg-purple-500 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Acuerdos Individuales
        </button>
        <button
    onClick={() => setSeccionActiva('control-horas')}
    className={`flex-1 px-6 py-3 rounded-lg font-medium transition-all ${
      seccionActiva === 'control-horas'
        ? 'bg-orange-500 text-white shadow-md'
        : 'text-slate-600 hover:bg-slate-100'
    }`}
  >
    Control de Horas
  </button>
      </div>

      {/* CONTENIDO */}
      {seccionActiva === 'categorias' && <SeccionCategorias api={api} />}
      {seccionActiva === 'ausencias' && <SeccionAusencias api={api} />}
      {seccionActiva === 'acuerdos' && <SeccionAcuerdos api={api} />}
      {seccionActiva === 'control-horas' && <ControlHorasPage api={api} />}
    
    </div>
  );
}