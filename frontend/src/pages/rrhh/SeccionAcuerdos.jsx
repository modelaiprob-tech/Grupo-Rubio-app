import React, { useState, useEffect } from 'react';
import { useApiClient } from '../../contexts/AuthContext';
import ModalAcuerdo from '../../components/modals/ModalAcuerdo';

export default function SeccionAcuerdos()
{
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
      const data = await api.get('/acuerdos-individuales');
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
    if (!confirm('¿Eliminar este acuerdo? No se podrá recuperar.')) return;
    
    try {
      await api.del(`/acuerdos-individuales/${id}`);
      alert('Acuerdo eliminado correctamente');
      cargarAcuerdos();
    } catch (error) {
      console.error('Error eliminando acuerdo:', error);
      alert('Error al eliminar acuerdo');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando acuerdos...</div>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Acuerdos Individuales</h2>
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 font-medium"
        >
          + Añadir Acuerdo
        </button>
      </div>

      {acuerdos.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No hay acuerdos individuales configurados. Añade el primero.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Trabajador</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Tipo Acuerdo</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">Valor</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Centro</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Descripción</th>
                <th className="text-center p-3 text-sm font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {acuerdos.map((acuerdo) => (
                <tr key={acuerdo.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium">
                    {acuerdo.trabajador.nombre} {acuerdo.trabajador.apellidos}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm font-medium">
                      {acuerdo.tipoAcuerdo}
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-purple-600">
                    {parseFloat(acuerdo.valor).toFixed(2)}€
                  </td>
                  <td className="p-3 text-sm text-slate-600">
                    {acuerdo.centro?.nombre || 'Todos'}
                  </td>
                  <td className="p-3 text-sm text-slate-600">
                    {acuerdo.descripcion || '-'}
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirModal(acuerdo)}
                        className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarAcuerdo(acuerdo.id)}
                        className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
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