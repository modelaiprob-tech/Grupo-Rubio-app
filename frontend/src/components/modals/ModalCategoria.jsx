import React, { useState } from 'react';

export default function ModalCategoria({ categoria, onClose, onGuardar, api }) {const [formData, setFormData] = useState({
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
        await api.put(`/categorias/${categoria.id}`, formData);
      } else {
        await api.post('/categorias', formData);
      }
      alert(categoria ? 'Categoría actualizada' : 'Categoría creada');
      onGuardar();
      onClose();
    } catch (error) {
      console.error('Error guardando categoría:', error);
      alert('Error al guardar categoría');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {categoria ? 'Editar Categoría' : 'Nueva Categoría'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Código <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => setFormData({ ...formData, codigo: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="ESP"
                maxLength="20"
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
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Especialista"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Personal cualificado..."
            />
          </div>

          {/* Salarios y precios */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900 mb-3">Salarios Base</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Salario Base (€/mes) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.salarioBase}
                  onChange={(e) => setFormData({ ...formData, salarioBase: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Plus Convenio (€/mes)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.plusConvenio}
                  onChange={(e) => setFormData({ ...formData, plusConvenio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Precio Hora (€) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.precioHora}
                  onChange={(e) => setFormData({ ...formData, precioHora: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>
          </div>

          {/* Recargos */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900 mb-3">Recargos (%)</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nocturno</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.recargoNocturno}
                  onChange={(e) => setFormData({ ...formData, recargoNocturno: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Festivo</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.recargoFestivo}
                  onChange={(e) => setFormData({ ...formData, recargoFestivo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">H. Extra 1ª</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.recargoExtra}
                  onChange={(e) => setFormData({ ...formData, recargoExtra: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">H. Extra Rest</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.recargoExtraAdicional}
                  onChange={(e) => setFormData({ ...formData, recargoExtraAdicional: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Pluses adicionales */}
          <div className="border-t border-slate-200 pt-4">
            <h3 className="font-semibold text-slate-900 mb-3">Pluses Adicionales (€/mes)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plus Transporte</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.plusTransporte}
                  onChange={(e) => setFormData({ ...formData, plusTransporte: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Plus Peligrosidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.plusPeligrosidad}
                  onChange={(e) => setFormData({ ...formData, plusPeligrosidad: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Botones */}
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
              className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50"
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