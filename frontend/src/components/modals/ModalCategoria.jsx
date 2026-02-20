import React, { useState } from 'react';
import { useApiClient } from '../../contexts/AuthContext';
import * as categoriasApi from '../../services/categoriasApi';

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';
const labelClass = 'block text-sm font-medium text-gray-500 mb-2';

export default function ModalCategoria({ categoria, onClose, onGuardar }) {
  const api = useApiClient();
  const [formData, setFormData] = useState({
    codigo: categoria?.codigo || '',
    nombre: categoria?.nombre || '',
    descripcion: categoria?.descripcion || '',
    salarioBase: categoria?.salarioBase || '',
    plusConvenio: categoria?.plusConvenio || '',
    precioHora: categoria?.precioHora || '',
    recargoNocturno: categoria?.recargoNocturno || 25,
    recargoFestivo: categoria?.recargoFestivo || 75,
    recargoExtra: categoria?.recargoExtra || 75,
    recargoExtraAdicional: categoria?.recargoExtraAdicional || 100,
    plusTransporte: categoria?.plusTransporte || 0,
    plusPeligrosidad: categoria?.plusPeligrosidad || 0
  });
  const [guardando, setGuardando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.codigo || !formData.nombre || !formData.salarioBase || !formData.precioHora) {
      alert('Rellena todos los campos obligatorios');
      return;
    }

    try {
      setGuardando(true);
      if (categoria) {
        await categoriasApi.actualizar(api, categoria.id, formData);
      } else {
        await categoriasApi.crear(api, formData);
      }
      alert(categoria ? 'Categoria actualizada' : 'Categoria creada');
      onGuardar();
      onClose();
    } catch (error) {
      console.error('Error guardando categoria:', error);
      alert('Error al guardar categoria');
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
              {categoria ? 'Editar Categoria' : 'Nueva Categoria'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl">x</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Informacion basica */}
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
                placeholder="ESP"
                maxLength="20"
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
                placeholder="Especialista"
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
              placeholder="Personal cualificado..."
            />
          </div>

          {/* Salarios y precios */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Salarios Base</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className={labelClass}>
                  Salario Base (EUR/mes) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salarioBase}
                  onChange={(e) => setFormData({ ...formData, salarioBase: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>

              <div>
                <label className={labelClass}>Plus Convenio (EUR/mes)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.plusConvenio}
                  onChange={(e) => setFormData({ ...formData, plusConvenio: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>
                  Precio Hora (EUR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precioHora}
                  onChange={(e) => setFormData({ ...formData, precioHora: e.target.value })}
                  className={inputClass}
                  required
                />
              </div>
            </div>
          </div>

          {/* Recargos */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Recargos (%)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className={labelClass}>Nocturno</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.recargoNocturno}
                  onChange={(e) => setFormData({ ...formData, recargoNocturno: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Festivo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.recargoFestivo}
                  onChange={(e) => setFormData({ ...formData, recargoFestivo: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>H. Extra 1a</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.recargoExtra}
                  onChange={(e) => setFormData({ ...formData, recargoExtra: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>H. Extra Rest</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.recargoExtraAdicional}
                  onChange={(e) => setFormData({ ...formData, recargoExtraAdicional: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Pluses adicionales */}
          <div className="border-t border-gray-100 pt-4">
            <h3 className="font-semibold text-gray-900 mb-3">Pluses Adicionales (EUR/mes)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Plus Transporte</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.plusTransporte}
                  onChange={(e) => setFormData({ ...formData, plusTransporte: e.target.value })}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Plus Peligrosidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.plusPeligrosidad}
                  onChange={(e) => setFormData({ ...formData, plusPeligrosidad: e.target.value })}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Botones */}
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
              {guardando ? 'Guardando...' : categoria ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}