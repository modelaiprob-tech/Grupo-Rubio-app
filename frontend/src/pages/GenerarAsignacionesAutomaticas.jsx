// ============================================
// FRONTEND: GenerarAsignacionesAutomaticas.jsx
// ============================================

import React, { useState } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import * as horariosFijosApi from '../services/horariosFijosApi';

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';

const GenerarAsignacionesAutomaticas = ({ onAsignacionesGeneradas }) => {
  const api = useApiClient();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);

  const [formData, setFormData] = useState({
    periodo: 'semana', // semana, mes, personalizado
    fechaInicio: '',
    fechaFin: '',
    sobrescribir: false,
    soloActivos: true
  });

  const calcularFechas = () => {
    const hoy = new Date();
    let inicio, fin;

    switch (formData.periodo) {
      case 'semana':
        // Proxima semana (lunes a domingo)
        inicio = new Date(hoy);
        inicio.setDate(hoy.getDate() + (8 - hoy.getDay())); // Proximo lunes
        fin = new Date(inicio);
        fin.setDate(inicio.getDate() + 6); // Domingo
        break;

      case 'mes':
        // Proximo mes
        inicio = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);
        fin = new Date(hoy.getFullYear(), hoy.getMonth() + 2, 0);
        break;

      case 'personalizado':
        inicio = formData.fechaInicio ? new Date(formData.fechaInicio) : null;
        fin = formData.fechaFin ? new Date(formData.fechaFin) : null;
        break;

      default:
        return null;
    }

    return { inicio, fin };
  };

  const handleGenerar = async () => {
    const fechas = calcularFechas();

    if (!fechas || !fechas.inicio || !fechas.fin) {
      alert('Debe especificar un rango de fechas valido');
      return;
    }

    if (fechas.fin < fechas.inicio) {
      alert('La fecha de fin debe ser posterior a la fecha de inicio');
      return;
    }

    // Calcular dias aproximados
    const dias = Math.ceil((fechas.fin - fechas.inicio) / (1000 * 60 * 60 * 24)) + 1;

    if (dias > 60) {
      if (!window.confirm(`Vas a generar turnos para ${dias} dias. Esto puede tardar un poco. Continuar?`)) {
        return;
      }
    }

    try {
  setLoading(true);
  setResultado(null);

  const response = await horariosFijosApi.generarAsignaciones(api, {
    fechaInicio: fechas.inicio.toISOString().split('T')[0],
    fechaFin: fechas.fin.toISOString().split('T')[0],
    sobrescribir: formData.sobrescribir,
    soloActivos: formData.soloActivos
  });

  setResultado(response);

  // Notificar al componente padre que recargue las asignaciones
  if (onAsignacionesGeneradas) {
    onAsignacionesGeneradas();
  }

    } catch (error) {
      console.error('Error al generar asignaciones:', error);
      alert(error?.error || 'Error al generar asignaciones automaticas');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = () => {
    // Resetear estado
    setFormData({
      periodo: 'semana',
      fechaInicio: '',
      fechaFin: '',
      sobrescribir: false,
      soloActivos: true
    });
    setResultado(null);
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setResultado(null);
  };

  const fechasCalculadas = calcularFechas();

  return (
    <>
      <button
        onClick={abrirModal}
        className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all text-sm font-medium flex items-center gap-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Generar turnos automaticos
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  Generar Asignaciones Automaticas
                </h3>
                <button
                  onClick={cerrarModal}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl"
                >
                  x
                </button>
              </div>

              {!resultado ? (
                <div className="space-y-6">
                  {/* Periodo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-3">
                      Periodo
                    </label>
                    <div className="space-y-2">
                      <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.periodo === 'semana' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="periodo"
                          value="semana"
                          checked={formData.periodo === 'semana'}
                          onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                          className="mr-3 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">Proxima semana</div>
                          {fechasCalculadas && formData.periodo === 'semana' && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {fechasCalculadas.inicio.toLocaleDateString()} - {fechasCalculadas.fin.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </label>

                      <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.periodo === 'mes' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="periodo"
                          value="mes"
                          checked={formData.periodo === 'mes'}
                          onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                          className="mr-3 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 text-sm">Proximo mes</div>
                          {fechasCalculadas && formData.periodo === 'mes' && (
                            <div className="text-xs text-gray-500 mt-0.5">
                              {fechasCalculadas.inicio.toLocaleDateString()} - {fechasCalculadas.fin.toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </label>

                      <label className={`flex items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${formData.periodo === 'personalizado' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input
                          type="radio"
                          name="periodo"
                          value="personalizado"
                          checked={formData.periodo === 'personalizado'}
                          onChange={(e) => setFormData({ ...formData, periodo: e.target.value })}
                          className="mr-3 text-teal-600 focus:ring-teal-500"
                        />
                        <div className="font-medium text-gray-900 text-sm">Rango personalizado</div>
                      </label>
                    </div>
                  </div>

                  {/* Fechas personalizadas */}
                  {formData.periodo === 'personalizado' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                          Fecha inicio
                        </label>
                        <input
                          type="date"
                          value={formData.fechaInicio}
                          onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-500 mb-2">
                          Fecha fin
                        </label>
                        <input
                          type="date"
                          value={formData.fechaFin}
                          onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                          className={inputClass}
                        />
                      </div>
                    </div>
                  )}

                  {/* Opciones */}
                  <div className="space-y-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.sobrescribir}
                        onChange={(e) => setFormData({ ...formData, sobrescribir: e.target.checked })}
                        className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Sobrescribir turnos existentes</div>
                        <div className="text-xs text-gray-500">
                          Actualizar turnos ya creados con los horarios fijos
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.soloActivos}
                        onChange={(e) => setFormData({ ...formData, soloActivos: e.target.checked })}
                        className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
                      />
                      <div>
                        <div className="font-medium text-gray-900 text-sm">Solo trabajadores activos</div>
                        <div className="text-xs text-gray-500">
                          Excluir trabajadores dados de baja
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* Advertencia */}
                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="flex gap-3">
                      <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="font-medium text-amber-800 text-sm">Importante</div>
                        <div className="text-xs text-amber-700 mt-1">
                          Se crearan turnos automaticamente segun los horarios fijos configurados.
                          Los turnos que coincidan con ausencias aprobadas se marcaran como "requiere atencion".
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Botones */}
                  <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={cerrarModal}
                      className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleGenerar}
                      disabled={loading}
                      className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm disabled:opacity-50"
                    >
                      {loading ? 'Generando...' : 'Generar turnos'}
                    </button>
                  </div>
                </div>
              ) : (
                /* Resultado */
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-50 rounded-2xl mb-4">
                      <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-bold text-gray-900 mb-2">
                      Asignaciones generadas correctamente
                    </h4>
                    <p className="text-gray-500 text-sm">
                      {resultado.mensaje}
                    </p>
                  </div>

                  {resultado.conConflicto > 0 && (
                    <div className="bg-amber-50 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <div>
                          <div className="font-medium text-amber-800 text-sm mb-1">
                            {resultado.conConflicto} turnos requieren atencion
                          </div>
                          <div className="text-xs text-amber-700">
                            Hay trabajadores con ausencias aprobadas. Revisa el calendario para asignar sustitutos.
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={cerrarModal}
                    className="w-full px-4 py-2.5 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors font-medium text-sm"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GenerarAsignacionesAutomaticas;