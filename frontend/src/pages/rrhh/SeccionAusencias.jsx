import React, { useState, useEffect } from 'react';
import { useApiClient } from '../../contexts/AuthContext';
import * as tiposAusenciaApi from '../../services/tiposAusenciaApi';
import ModalTipoAusencia from '../../components/modals/ModalTipoAusencia';

const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]';

export default function SeccionAusencias() {
  const api = useApiClient();
  const [tipos, setTipos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [tipoEditando, setTipoEditando] = useState(null);

  useEffect(() => {
    cargarTipos();
  }, []);

  const cargarTipos = async () => {
    try {
      setLoading(true);
      const data = await tiposAusenciaApi.getAll(api);
      setTipos(data);
    } catch (error) {
      console.error('Error cargando tipos de ausencia:', error);
      alert('Error al cargar tipos de ausencia');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (tipo = null) => {
    setTipoEditando(tipo);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setTipoEditando(null);
  };

  const eliminarTipo = async (id) => {
    if (!confirm('Eliminar este tipo de ausencia? No se podra recuperar.')) return;
    try {
      await tiposAusenciaApi.eliminar(api, id);
      alert('Tipo de ausencia eliminado correctamente');
      cargarTipos();
    } catch (error) {
      console.error('Error eliminando tipo:', error);
      alert(error.response?.data?.error || 'Error al eliminar tipo de ausencia');
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
        <h2 className="text-xl font-bold text-gray-900">Tipos de Ausencia</h2>
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors"
        >
          + Anadir Tipo
        </button>
      </div>

      {tipos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No hay tipos de ausencia configurados. Anade el primero.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Codigo</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripcion</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Dias Max</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">% Cobro</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Color</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-mono text-sm font-semibold text-gray-600">{tipo.codigo}</td>
                  <td className="p-3 font-semibold text-gray-900 text-sm">{tipo.nombre}</td>
                  <td className="p-3 text-sm text-gray-500">{tipo.descripcion || '-'}</td>
                  <td className="p-3 text-center text-sm text-gray-700">{tipo.diasMaximo || '-'}</td>
                  <td className="p-3 text-center font-bold text-teal-600 text-sm">
                    {parseFloat(tipo.porcentajeCobro)}%
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center">
                      <div
                        className="w-8 h-8 rounded-lg border-2 border-gray-200"
                        style={{ backgroundColor: tipo.colorHex }}
                      ></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirModal(tipo)}
                        className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-xs font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarTipo(tipo.id)}
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
        <ModalTipoAusencia
          tipo={tipoEditando}
          onClose={cerrarModal}
          onGuardar={cargarTipos}
        />
      )}
    </div>
  );
}
