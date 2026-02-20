import React from 'react';
import { useApiClient } from '../contexts/AuthContext';
import { useHorariosFijos } from '../hooks/useHorariosFijos';

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';

const HorariosFijos = ({ trabajadorId }) => {
  const api = useApiClient();
  const {
    horarios, centros, loading, showModal, setShowModal, editando,
    formData, setFormData, centroSeleccionado, horarioMin, horarioMax,
    handleSubmit, eliminarHorario, editarHorario, cerrarModal, getDiasTexto
  } = useHorariosFijos(api, trabajadorId);

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-gray-900">Horarios Fijos</h3>
        <button
          type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors text-sm font-medium"
        >
          + Anadir horario
        </button>
      </div>

      {loading && horarios.length === 0 ? (
        <div className="flex justify-center py-8">
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      ) : horarios.length === 0 ? (
        <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
          <p className="mb-1 font-medium">No hay horarios fijos configurados</p>
          <p className="text-sm">Anade un horario fijo para generar turnos automaticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {horarios.map(horario => (
            <div
              key={horario.id}
              className="bg-white border border-gray-100 rounded-2xl p-4 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-gray-900 text-sm">
                      {horario.centro.cliente.nombre} - {horario.centro.nombre}
                    </h4>
                    <span className="px-2.5 py-1 bg-teal-50 text-teal-700 text-xs rounded-lg font-medium">
                      {getDiasTexto(horario)}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-500">
                    <div><span className="font-medium text-gray-600">Horario:</span> {horario.horaInicio} - {horario.horaFin}</div>
                    <div>
                      <span className="font-medium text-gray-600">Vigencia:</span>{' '}
                      {new Date(horario.fechaInicio).toLocaleDateString()}
                      {horario.fechaFin && ` - ${new Date(horario.fechaFin).toLocaleDateString()}`}
                      {!horario.fechaFin && ' (indefinido)'}
                    </div>
                  </div>
                  {horario.notas && (
                    <div className="mt-2 text-sm text-gray-400 italic">{horario.notas}</div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); editarHorario(horario); }}
                    className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => eliminarHorario(horario.id)}
                    className="px-3 py-1.5 text-xs bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors font-medium"
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {editando ? 'Editar' : 'Nuevo'} Horario Fijo
                </h3>
                <button onClick={cerrarModal} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl">x</button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Centro de trabajo *</label>
                  <select value={formData.centroId} onChange={(e) => setFormData({ ...formData, centroId: e.target.value })} className={inputClass} required>
                    <option value="">Seleccionar centro...</option>
                    {centros.filter(c => c.activo).map(centro => (
                      <option key={centro.id} value={centro.id}>{centro.cliente.nombre} - {centro.nombre}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-3">Dias de la semana *</label>
                  <div className="grid grid-cols-7 gap-2">
                    {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia, index) => (
                      <label
                        key={dia}
                        className={`flex flex-col items-center p-3 border-2 rounded-xl cursor-pointer transition-all ${
                          formData[dia] ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input type="checkbox" checked={formData[dia]} onChange={(e) => setFormData({ ...formData, [dia]: e.target.checked })} className="sr-only" />
                        <span className="text-xs font-medium text-gray-700">{['L', 'M', 'X', 'J', 'V', 'S', 'D'][index]}</span>
                        <span className="text-[10px] text-gray-400 mt-1">{dia.charAt(0).toUpperCase() + dia.slice(1, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Hora inicio *</label>
                    <input type="time" value={formData.horaInicio} onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })} className={inputClass} required />
                    {centroSeleccionado && (
                      <p className="text-xs text-gray-400 mt-1">
                        {centroSeleccionado.tipoHorarioLimpieza === 'FLEXIBLE' ? 'Horario flexible (24/7)' : `Rango: ${horarioMin} - ${horarioMax}`}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Hora fin *</label>
                    <input type="time" value={formData.horaFin} onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })} className={inputClass} required />
                    {centroSeleccionado && (
                      <p className="text-xs text-gray-400 mt-1">
                        {centroSeleccionado.tipoHorarioLimpieza === 'FLEXIBLE' ? 'Horario flexible (24/7)' : `Rango: ${horarioMin} - ${horarioMax}`}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Vigente desde *</label>
                    <input type="date" value={formData.fechaInicio} onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })} className={inputClass} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Vigente hasta (opcional)</label>
                    <input type="date" value={formData.fechaFin} onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })} className={inputClass} />
                    <p className="mt-1 text-xs text-gray-400">Dejar vacio para horario indefinido</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Notas (opcional)</label>
                  <textarea value={formData.notas} onChange={(e) => setFormData({ ...formData, notas: e.target.value })} className={`${inputClass} resize-none`} rows="3" placeholder="Observaciones sobre este horario..." />
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                  <button type="button" onClick={cerrarModal} className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm">
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); handleSubmit(e); }}
                    disabled={loading}
                    className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-colors font-medium text-sm disabled:opacity-50"
                  >
                    {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorariosFijos;
