import React, { useState, useEffect } from 'react';
import { useApiClient } from '../../contexts/AuthContext';
import * as acuerdosApi from '../../services/acuerdosApi';
import * as trabajadoresApi from '../../services/trabajadoresApi';
import * as centrosApi from '../../services/centrosApi';

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';
const labelClass = 'block text-sm font-medium text-gray-500 mb-2';

export default function ModalAcuerdo({ acuerdo, onClose, onGuardar })
{
  const api = useApiClient();
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
        trabajadoresApi.getAll(api),
        centrosApi.getAll(api)
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
        await acuerdosApi.actualizar(api, acuerdo.id, data);
      } else {
        await acuerdosApi.crear(api, data);
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
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900">
              {acuerdo ? 'Editar Acuerdo Individual' : 'Nuevo Acuerdo Individual'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors text-xl">x</button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className={labelClass}>
              Trabajador <span className="text-rose-500">*</span>
            </label>
            <select
              value={formData.trabajadorId}
              onChange={(e) => setFormData({ ...formData, trabajadorId: e.target.value })}
              className={inputClass}
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
              <label className={labelClass}>
                Tipo de Acuerdo <span className="text-rose-500">*</span>
              </label>
              <select
                value={formData.tipoAcuerdo}
                onChange={(e) => setFormData({ ...formData, tipoAcuerdo: e.target.value })}
                className={inputClass}
                required
              >
                <option value="PRECIO_HORA">Precio por Hora</option>
                <option value="PLUS_MENSUAL">Plus Mensual</option>
                <option value="SALARIO_BASE">Salario Base</option>
              </select>
            </div>

            <div>
              <label className={labelClass}>
                Valor (EUR) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                className={inputClass}
                required
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Centro (Opcional)</label>
            <select
              value={formData.centroId}
              onChange={(e) => setFormData({ ...formData, centroId: e.target.value })}
              className={inputClass}
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
            <label className={labelClass}>Descripcion / Motivo</label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
              className={`${inputClass} resize-none`}
              rows="2"
              placeholder="Antiguedad, disponibilidad 24/7, etc."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Fecha Inicio</label>
              <input
                type="date"
                value={formData.fechaInicio}
                onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Fecha Fin (Opcional)</label>
              <input
                type="date"
                value={formData.fechaFin}
                onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                className={inputClass}
              />
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
              {guardando ? 'Guardando...' : acuerdo ? 'Actualizar' : 'Crear'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}