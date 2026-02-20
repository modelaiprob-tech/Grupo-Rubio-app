import React, { useState, useEffect } from 'react';
import { useApiClient } from '../../contexts/AuthContext';
import * as acuerdosApi from '../../services/acuerdosApi';
import ModalAcuerdo from '../../components/modals/ModalAcuerdo';

const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]';

export default function SeccionAcuerdos() {
  const api = useApiClient();
  const [acuerdos, setAcuerdos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [acuerdoEditando, setAcuerdoEditando] = useState(null);

  useEffect(() => {
    cargarAcuerdos();
  }, []);

  const cargarAcuerdos = async () => {
    try {
      setLoading(true);
      const data = await acuerdosApi.getAll(api);
      setAcuerdos(data);
    } catch (error) {
      console.error('Error cargando acuerdos:', error);
      alert('Error al cargar acuerdos');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (acuerdo = null) => {
    setAcuerdoEditando(acuerdo);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setAcuerdoEditando(null);
  };

  const eliminarAcuerdo = async (id) => {
    if (!confirm('Eliminar este acuerdo? No se podra recuperar.')) return;
    try {
      await acuerdosApi.eliminar(api, id);
      alert('Acuerdo eliminado correctamente');
      cargarAcuerdos();
    } catch (error) {
      console.error('Error eliminando acuerdo:', error);
      alert('Error al eliminar acuerdo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="flex gap-1.5">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={cardClass}>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Acuerdos Individuales</h2>
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors"
        >
          + Anadir Acuerdo
        </button>
      </div>

      {acuerdos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No hay acuerdos individuales configurados. Anade el primero.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Trabajador</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Tipo Acuerdo</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Centro</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripcion</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {acuerdos.map((acuerdo) => (
                <tr key={acuerdo.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-semibold text-gray-900 text-sm">
                    {acuerdo.trabajador.nombre} {acuerdo.trabajador.apellidos}
                  </td>
                  <td className="p-3">
                    <span className="px-2.5 py-1 bg-violet-50 text-violet-700 rounded-lg text-xs font-medium">
                      {acuerdo.tipoAcuerdo}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-teal-600 text-sm">
                    {parseFloat(acuerdo.valor).toFixed(2)}EUR
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {acuerdo.centro?.nombre || 'Todos'}
                  </td>
                  <td className="p-3 text-sm text-gray-500">
                    {acuerdo.descripcion || '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirModal(acuerdo)}
                        className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-xs font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarAcuerdo(acuerdo.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 text-xs font-medium transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalAbierto && (
        <ModalAcuerdo
          acuerdo={acuerdoEditando}
          onClose={cerrarModal}
          onGuardar={cargarAcuerdos}
        />
      )}
    </div>
  );
}
