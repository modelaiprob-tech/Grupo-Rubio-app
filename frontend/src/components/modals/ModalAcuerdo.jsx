import React, { useState, useEffect } from 'react';

export default function ModalAcuerdo({ acuerdo, onClose, onGuardar, api }) 
{
  const [formData, setFormData] = useState({
    trabajadorId: acuerdo?.trabajadorId || '',
    tipoAcuerdo: acuerdo?.tipoAcuerdo || 'PRECIO_HORA',
    valor: acuerdo?.valor || '',
    centroId: acuerdo?.centroId || '',
    descripcion: acuerdo?.descripcion || '',
    fechaInicio: acuerdo?.fechaInicio ? acuerdo.fechaInicio.split('T')[0] : new Date().toISOString().split('T')[0],
    fechaFin: acuerdo?.fechaFin ? acuerdo.fechaFin.split('T')[0] : ''
  });
  const [trabajadores, setTrabajadores] = useState([]);
  const [centros, setCentros] = useState([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [trabData, centrosData] = await Promise.all([
        api.get('/trabajadores'),
        api.get('/centros')
      ]);
      setTrabajadores(trabData.filter(t => t.activo));
      setCentros(centrosData.filter(c => c.activo));
    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.trabajadorId || !formData.tipoAcuerdo || !formData.valor) {
      alert('Rellena todos los campos obligatorios');
      return;
    }

    try {
      setGuardando(true);
      const data = {
        ...formData,
        trabajadorId: parseInt(formData.trabajadorId),
        centroId: formData.centroId ? parseInt(formData.centroId) : null,
        valor: parseFloat(formData.valor),
        fechaFin: formData.fechaFin || null
      };
      
      if (acuerdo) {
        await api.put(`/acuerdos-individuales/${acuerdo.id}`, data);
      } else {
        await api.post('/acuerdos-individuales', data);
      }
      alert(acuerdo ? 'Acuerdo actualizado' : 'Acuerdo creado');
      onGuardar();
      onClose();
    } catch (error) {
      console.error('Error guardando acuerdo:', error);
      alert('Error al guardar acuerdo');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900">
            {acuerdo ? 'Editar Acuerdo Individual' : 'Nuevo Acuerdo Individual'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Trabajador <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.trabajadorId}
              onChange={(e) => setFormData({ ...formData, trabajadorId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              required
              disabled={!!acuerdo}
            >
              <option value="">Seleccionar trabajador</option>
              {trabajadores.map(t => (
                <option key={t.id} value={t.id}>
                  {t.nombre} {t.apellidos}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tipo de Acuerdo <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.tipoAcuerdo}
                onChange={(e) => setFormData({ ...formData, tipoAcuerdo: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              >
                <option value="PRECIO_HORA">Precio por Hora</option>
                <option value="PLUS_MENSUAL">Plus Mensual</option>
                <option value="SALARIO_BASE">Salario Base</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Valor (€) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Centro (Opcional)
            </label>
            <select
              value={formData.centroId}
              onChange={(e) => setFormData({ ...formData, centroId: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="">Aplica a todos los centros</option>
              {centros.map(c => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Descripción / Motivo</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              rows="2"
              placeholder="Antigüedad, disponibilidad 24/7, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Fin (Opcional)</label>
              <input
                type="date"
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
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
              className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium disabled:opacity-50"
              disabled={guardando}
            >
              {guardando ? 'Guardando...' : acuerdo ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}