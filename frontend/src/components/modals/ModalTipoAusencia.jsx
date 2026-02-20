import React, { useState } from 'react';
import { useApiClient } from '../../contexts/AuthContext';
import * as tiposAusenciaApi from '../../services/tiposAusenciaApi';

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';
const labelClass = 'block text-sm font-medium text-gray-500 mb-2';

export default function ModalTipoAusencia({ tipo, onClose, onGuardar }) {
  const api = useApiClient();
  const [formData, setFormData] = useState({
    codigo: tipo?.codigo || '',
    nombre: tipo?.nombre || '',
    descripcion: tipo?.descripcion || '',
    restaVacaciones: tipo?.restaVacaciones || false,
    restaAsuntos: tipo?.restaAsuntos || false,
    pagada: tipo?.pagada !== undefined ? tipo.pagada : true,

    // CALCULO ECONOMICO
    porcentajeCobro: tipo?.porcentajeCobro || 100,
    usaTramos: tipo?.usaTramos || false,
    tramosJson: tipo?.tramosJson || '',
    baseCalculo: tipo?.baseCalculo || 'SALARIO_BASE',
    diasCarencia: tipo?.diasCarencia || 0,
    topeDiarioEuros: tipo?.topeDiarioEuros || '',

    // QUIEN PAGA
    pagador: tipo?.pagador || 'EMPRESA',

    // COMPUTO DIAS
    incluyeDomingos: tipo?.incluyeDomingos !== undefined ? tipo.incluyeDomingos : true,
    incluyeFestivos: tipo?.incluyeFestivos !== undefined ? tipo.incluyeFestivos : true,
    diasMaximo: tipo?.diasMaximo || '',

    // DOCUMENTACION
    requiereJustificante: tipo?.requiereJustificante || false,
    tipoJustificante: tipo?.tipoJustificante || 'MEDICO',
    requiereAltaMedica: tipo?.requiereAltaMedica || false,

    colorHex: tipo?.colorHex || '#6B7280'
  });

  const [guardando, setGuardando] = useState(false);
  const [mostrarAvanzado, setMostrarAvanzado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigo || !formData.nombre) {
      alert('Rellena todos los campos obligatorios');
      return;
    }

    try {
      setGuardando(true);
      const data = {
  ...formData,
  porcentajeCobro: parseFloat(formData.porcentajeCobro) || 100,
  diasCarencia: parseInt(formData.diasCarencia) || 0,
  diasMaximo: formData.diasMaximo ? parseInt(formData.diasMaximo) : null,
  topeDiarioEuros: formData.topeDiarioEuros ? parseFloat(formData.topeDiarioEuros) : null,
  tramosJson: formData.usaTramos && formData.tramosJson ? formData.tramosJson : null
};
      if (tipo) {
        await tiposAusenciaApi.actualizar(api, tipo.id, data);
      } else {
        await tiposAusenciaApi.crear(api, data);
      }
      alert(tipo ? 'Tipo actualizado' : 'Tipo creado');
      onGuardar();
      onClose();
    } catch (error) {
      console.error('Error guardando tipo:', error);
      alert('Error al guardar tipo de ausencia');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {tipo ? 'Editar Tipo de Ausencia' : 'Nuevo Tipo de Ausencia'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl">x</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* INFORMACION BASICA */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900">Informacion Basica</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  Codigo <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className={inputClass}
                  placeholder="IT, AL, V"
                  maxLength="10"
                  required
                />
              </div>

              <div>
                <label className={labelClass}>
                  Nombre <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className={inputClass}
                  placeholder="Incapacidad Temporal"
                  required
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Descripcion</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className={`${inputClass} resize-none`}
                rows="2"
                placeholder="Detalles del tipo de ausencia..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Color</label>
                <input
                  type="color"
                  value={formData.colorHex}
                  onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                  className="w-full h-10 border border-gray-200 rounded-xl cursor-pointer"
                />
              </div>

              <div>
                <label className={labelClass}>Dias Maximo Anuales</label>
                <input
                  type="number"
                  value={formData.diasMaximo}
                  onChange={(e) => setFormData({ ...formData, diasMaximo: e.target.value })}
                  className={inputClass}
                  placeholder="Ilimitado si vacio"
                />
              </div>
            </div>
          </div>

          {/* CALCULO DE NOMINA */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <h3 className="font-semibold text-gray-900">Calculo de Nomina</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>
                  % de Cobro <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.porcentajeCobro}
                    onChange={(e) => setFormData({ ...formData, porcentajeCobro: e.target.value })}
                    className={`${inputClass} flex-1`}
                    required
                    disabled={formData.usaTramos}
                  />
                  <span className="flex items-center text-gray-500 text-sm">%</span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Base de Calculo</label>
                <select
                  value={formData.baseCalculo}
                  onChange={(e) => setFormData({ ...formData, baseCalculo: e.target.value })}
                  className={inputClass}
                >
                  <option value="SALARIO_BASE">Solo Salario Base</option>
                  <option value="SALARIO_TOTAL">Salario + Pluses</option>
                  <option value="SALARIO_REGULADOR">Salario Regulador</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Dias de Carencia</label>
                <input
                  type="number"
                  min="0"
                  value={formData.diasCarencia}
                  onChange={(e) => setFormData({ ...formData, diasCarencia: e.target.value })}
                  className={inputClass}
                  placeholder="0"
                />
                <p className="text-xs text-gray-400 mt-1">Dias sin cobro al inicio</p>
              </div>

              <div>
                <label className={labelClass}>Tope Diario (EUR)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.topeDiarioEuros}
                  onChange={(e) => setFormData({ ...formData, topeDiarioEuros: e.target.value })}
                  className={inputClass}
                  placeholder="Ilimitado si vacio"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.usaTramos}
                  onChange={(e) => setFormData({ ...formData, usaTramos: e.target.checked })}
                  className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Usar % escalonado por dias (IT comun)
                </span>
              </label>
            </div>

            {formData.usaTramos && (
              <div className="bg-teal-50 rounded-xl p-4">
                <label className={labelClass}>Tramos JSON</label>
                <textarea
                  value={formData.tramosJson}
                  onChange={(e) => setFormData({ ...formData, tramosJson: e.target.value })}
                  className={`${inputClass} font-mono text-xs resize-none`}
                  rows="4"
                  placeholder='[{"diaDesde":1,"diaHasta":3,"porcentaje":0},{"diaDesde":4,"diaHasta":15,"porcentaje":60},{"diaDesde":16,"diaHasta":20,"porcentaje":75},{"diaDesde":21,"diaHasta":999,"porcentaje":100}]'
                />
                <p className="text-xs text-teal-700 mt-1">
                  Ejemplo IT: dias 1-3 = 0%, dias 4-15 = 60%, dias 16-20 = 75%, dia 21+ = 100%
                </p>
              </div>
            )}
          </div>

          {/* OPCIONES AVANZADAS (COLAPSABLE) */}
          <div className="pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setMostrarAvanzado(!mostrarAvanzado)}
              className="flex items-center gap-2 text-gray-700 hover:text-gray-900 font-medium text-sm"
            >
              <svg className={`w-4 h-4 transition-transform ${mostrarAvanzado ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              <span>Opciones Avanzadas</span>
            </button>

            {mostrarAvanzado && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Entidad que Paga</label>
                    <select
                      value={formData.pagador}
                      onChange={(e) => setFormData({ ...formData, pagador: e.target.value })}
                      className={inputClass}
                    >
                      <option value="EMPRESA">Empresa</option>
                      <option value="MUTUA">Mutua</option>
                      <option value="SEGURIDAD_SOCIAL">Seguridad Social</option>
                      <option value="MIXTO">Mixto</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Tipo Justificante</label>
                    <select
                      value={formData.tipoJustificante}
                      onChange={(e) => setFormData({ ...formData, tipoJustificante: e.target.value })}
                      className={inputClass}
                    >
                      <option value="MEDICO">Medico</option>
                      <option value="ADMINISTRATIVO">Administrativo</option>
                      <option value="NINGUNO">Ninguno</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.incluyeDomingos}
                      onChange={(e) => setFormData({ ...formData, incluyeDomingos: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">Incluir domingos en computo</span>
                  </label>

                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.incluyeFestivos}
                      onChange={(e) => setFormData({ ...formData, incluyeFestivos: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">Incluir festivos en computo</span>
                  </label>

                  <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiereAltaMedica}
                      onChange={(e) => setFormData({ ...formData, requiereAltaMedica: e.target.checked })}
                      className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-700">Requiere parte de alta medica</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* OPCIONES BASICAS */}
          <div className="space-y-2 pt-4 border-t border-gray-100">
            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pagada}
                onChange={(e) => setFormData({ ...formData, pagada: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Ausencia pagada</span>
            </label>

            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.restaVacaciones}
                onChange={(e) => setFormData({ ...formData, restaVacaciones: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Resta dias de vacaciones</span>
            </label>

            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.restaAsuntos}
                onChange={(e) => setFormData({ ...formData, restaAsuntos: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Resta dias de asuntos propios</span>
            </label>

            <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiereJustificante}
                onChange={(e) => setFormData({ ...formData, requiereJustificante: e.target.checked })}
                className="w-4 h-4 text-teal-600 border-gray-200 rounded focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Requiere justificante</span>
            </label>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors disabled:opacity-50"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : tipo ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}