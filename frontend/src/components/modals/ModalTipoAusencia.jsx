import React, { useState } from 'react';
import { useApiClient } from '../../contexts/AuthContext';

export default function ModalTipoAusencia({ tipo, onClose, onGuardar }) {
  const api = useApiClient();
  const [formData, setFormData] = useState({
    codigo: tipo?.codigo || '',
    nombre: tipo?.nombre || '',
    descripcion: tipo?.descripcion || '',
    restaVacaciones: tipo?.restaVacaciones || false,
    restaAsuntos: tipo?.restaAsuntos || false,
    pagada: tipo?.pagada !== undefined ? tipo.pagada : true,
    
    // CÁLCULO ECONÓMICO
    porcentajeCobro: tipo?.porcentajeCobro || 100,
    usaTramos: tipo?.usaTramos || false,
    tramosJson: tipo?.tramosJson || '',
    baseCalculo: tipo?.baseCalculo || 'SALARIO_BASE',
    diasCarencia: tipo?.diasCarencia || 0,
    topeDiarioEuros: tipo?.topeDiarioEuros || '',
    
    // QUIÉN PAGA
    pagador: tipo?.pagador || 'EMPRESA',
    
    // CÓMPUTO DÍAS
    incluyeDomingos: tipo?.incluyeDomingos !== undefined ? tipo.incluyeDomingos : true,
    incluyeFestivos: tipo?.incluyeFestivos !== undefined ? tipo.incluyeFestivos : true,
    diasMaximo: tipo?.diasMaximo || '',
    
    // DOCUMENTACIÓN
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
        await api.put(`/tipos-ausencia/${tipo.id}`, data);
      } else {
        await api.post('/tipos-ausencia', data);
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {tipo ? 'Editar Tipo de Ausencia' : 'Nuevo Tipo de Ausencia'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* INFORMACIÓN BÁSICA */}
          <div className="space-y-4">
            <h3 className="font-semibold text-slate-900 text-lg">Información Básica</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Código <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.codigo}
                  onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="IT, AL, V"
                  maxLength="10"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Incapacidad Temporal"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
              <textarea
                value={formData.descripcion}
                onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                rows="2"
                placeholder="Detalles del tipo de ausencia..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Color</label>
                <input
                  type="color"
                  value={formData.colorHex}
                  onChange={(e) => setFormData({ ...formData, colorHex: e.target.value })}
                  className="w-full h-10 border border-slate-300 rounded-lg cursor-pointer"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Días Máximo Anuales
                </label>
                <input
                  type="number"
                  value={formData.diasMaximo}
                  onChange={(e) => setFormData({ ...formData, diasMaximo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ilimitado si vacío"
                />
              </div>
            </div>
          </div>

          {/* CÁLCULO DE NÓMINA */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="font-semibold text-slate-900 text-lg">💰 Cálculo de Nómina</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  % de Cobro <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={formData.porcentajeCobro}
                    onChange={(e) => setFormData({ ...formData, porcentajeCobro: e.target.value })}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                    disabled={formData.usaTramos}
                  />
                  <span className="flex items-center text-slate-600">%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Base de Cálculo
                </label>
                <select
                  value={formData.baseCalculo}
                  onChange={(e) => setFormData({ ...formData, baseCalculo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="SALARIO_BASE">Solo Salario Base</option>
                  <option value="SALARIO_TOTAL">Salario + Pluses</option>
                  <option value="SALARIO_REGULADOR">Salario Regulador</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Días de Carencia
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.diasCarencia}
                  onChange={(e) => setFormData({ ...formData, diasCarencia: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="0"
                />
                <p className="text-xs text-slate-500 mt-1">Días sin cobro al inicio</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tope Diario (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.topeDiarioEuros}
                  onChange={(e) => setFormData({ ...formData, topeDiarioEuros: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  placeholder="Ilimitado si vacío"
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.usaTramos}
                  onChange={(e) => setFormData({ ...formData, usaTramos: e.target.checked })}
                  className="w-4 h-4 text-green-600"
                />
                <span className="text-sm font-medium text-slate-700">
                  Usar % escalonado por días (IT común)
                </span>
              </label>
            </div>

            {formData.usaTramos && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tramos JSON
                </label>
                <textarea
                  value={formData.tramosJson}
                  onChange={(e) => setFormData({ ...formData, tramosJson: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-xs"
                  rows="4"
                  placeholder='[{"diaDesde":1,"diaHasta":3,"porcentaje":0},{"diaDesde":4,"diaHasta":15,"porcentaje":60},{"diaDesde":16,"diaHasta":20,"porcentaje":75},{"diaDesde":21,"diaHasta":999,"porcentaje":100}]'
                />
                <p className="text-xs text-blue-700 mt-1">
                  Ejemplo IT: días 1-3 = 0%, días 4-15 = 60%, días 16-20 = 75%, día 21+ = 100%
                </p>
              </div>
            )}
          </div>

          {/* OPCIONES AVANZADAS (COLAPSABLE) */}
          <div className="pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setMostrarAvanzado(!mostrarAvanzado)}
              className="flex items-center gap-2 text-slate-700 hover:text-slate-900 font-medium"
            >
              <span>{mostrarAvanzado ? '▼' : '▶'}</span>
              <span>Opciones Avanzadas</span>
            </button>

            {mostrarAvanzado && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Entidad que Paga
                    </label>
                    <select
                      value={formData.pagador}
                      onChange={(e) => setFormData({ ...formData, pagador: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="EMPRESA">Empresa</option>
                      <option value="MUTUA">Mutua</option>
                      <option value="SEGURIDAD_SOCIAL">Seguridad Social</option>
                      <option value="MIXTO">Mixto</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Tipo Justificante
                    </label>
                    <select
                      value={formData.tipoJustificante}
                      onChange={(e) => setFormData({ ...formData, tipoJustificante: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500"
                    >
                      <option value="MEDICO">Médico</option>
                      <option value="ADMINISTRATIVO">Administrativo</option>
                      <option value="NINGUNO">Ninguno</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.incluyeDomingos}
                      onChange={(e) => setFormData({ ...formData, incluyeDomingos: e.target.checked })}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm text-slate-700">Incluir domingos en cómputo</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.incluyeFestivos}
                      onChange={(e) => setFormData({ ...formData, incluyeFestivos: e.target.checked })}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm text-slate-700">Incluir festivos en cómputo</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiereAltaMedica}
                      onChange={(e) => setFormData({ ...formData, requiereAltaMedica: e.target.checked })}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="text-sm text-slate-700">Requiere parte de alta médica</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* OPCIONES BÁSICAS */}
          <div className="space-y-2 pt-4 border-t border-slate-200">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pagada}
                onChange={(e) => setFormData({ ...formData, pagada: e.target.checked })}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm text-slate-700">Ausencia pagada</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.restaVacaciones}
                onChange={(e) => setFormData({ ...formData, restaVacaciones: e.target.checked })}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm text-slate-700">Resta días de vacaciones</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.restaAsuntos}
                onChange={(e) => setFormData({ ...formData, restaAsuntos: e.target.checked })}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm text-slate-700">Resta días de asuntos propios</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiereJustificante}
                onChange={(e) => setFormData({ ...formData, requiereJustificante: e.target.checked })}
                className="w-4 h-4 text-green-600"
              />
              <span className="text-sm text-slate-700">Requiere justificante</span>
            </label>
          </div>

          {/* BOTONES */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 font-medium"
              disabled={guardando}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium disabled:opacity-50"
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