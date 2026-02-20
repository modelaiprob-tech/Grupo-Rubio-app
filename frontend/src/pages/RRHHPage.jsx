import React, { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import SeccionCategorias from './rrhh/SeccionCategorias';
import SeccionAusencias from './rrhh/SeccionAusencias';
import SeccionAcuerdos from './rrhh/SeccionAcuerdos';
import ControlHorasPage from './ControlHorasPage';

function useFont(href) {
  useEffect(() => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);
}

export default function RRHHPage() {
  const api = useApiClient();
  const [seccionActiva, setSeccionActiva] = useState('categorias');
  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

  const font = { fontFamily: '"Outfit", sans-serif' };

  const tabs = [
    { id: 'categorias', label: 'Categorias Laborales' },
    { id: 'ausencias', label: 'Tipos de Ausencia' },
    { id: 'acuerdos', label: 'Acuerdos Individuales' },
    { id: 'control-horas', label: 'Control de Horas' },
  ];

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Recursos Humanos</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Configuracion de nominas y convenio colectivo</p>
      </div>

      <div className="mb-6 flex gap-1.5 bg-white p-1.5 rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setSeccionActiva(tab.id)}
            className={`flex-1 px-5 py-3 rounded-xl font-medium text-sm transition-all ${
              seccionActiva === tab.id
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {seccionActiva === 'categorias' && <SeccionCategorias />}
      {seccionActiva === 'ausencias' && <SeccionAusencias />}
      {seccionActiva === 'acuerdos' && <SeccionAcuerdos />}
      {seccionActiva === 'control-horas' && <ControlHorasPage />}
    </div>
  );
}
