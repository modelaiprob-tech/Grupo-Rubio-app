import React, { useState, useEffect } from 'react';
import ModalTipoAusencia from '../../components/modals/ModalTipoAusencia';

export default function SeccionAusencias({ api }) 
{
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
      const data = await api.get('/tipos-ausencia');
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
    if (!confirm('¿Eliminar este tipo de ausencia? No se podrá recuperar.')) return;
    
    try {
      await api.del(`/tipos-ausencia/${id}`);
      alert('Tipo de ausencia eliminado correctamente');
      cargarTipos();
    } catch (error) {
      console.error('Error eliminando tipo:', error);
      alert(error.response?.data?.error || 'Error al eliminar tipo de ausencia');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando tipos de ausencia...</div>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Tipos de Ausencia</h2>
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 font-medium"
        >
          + Añadir Tipo
        </button>
      </div>

      {tipos.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No hay tipos de ausencia configurados. Añade el primero.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Código</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Nombre</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Descripción</th>
                <th className="text-center p-3 text-sm font-semibold text-slate-700">Días Máx</th>
                <th className="text-center p-3 text-sm font-semibold text-slate-700">% Cobro</th>
                <th className="text-center p-3 text-sm font-semibold text-slate-700">Color</th>
                <th className="text-center p-3 text-sm font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-mono text-sm font-semibold">{tipo.codigo}</td>
                  <td className="p-3 font-medium">{tipo.nombre}</td>
                  <td className="p-3 text-sm text-slate-600">{tipo.descripcion || '-'}</td>
                  <td className="p-3 text-center">{tipo.diasMaximo || '-'}</td>
                  <td className="p-3 text-center font-semibold text-green-600">
                    {parseFloat(tipo.porcentajeCobro)}%
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex justify-center">
                      <div 
                        className="w-8 h-8 rounded-lg border-2 border-slate-300"
                        style={{ backgroundColor: tipo.colorHex }}
                      ></div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirModal(tipo)}
                        className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarTipo(tipo.id)}
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
        <ModalTipoAusencia
          tipo={tipoEditando}
          onClose={cerrarModal}
          onGuardar={cargarTipos}
          api={api}
        />
      )}
    </div>
  );
}