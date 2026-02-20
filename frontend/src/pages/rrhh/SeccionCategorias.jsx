import React, { useState, useEffect } from 'react';
import { useApiClient } from '../../contexts/AuthContext';
import * as categoriasApi from '../../services/categoriasApi';
import ModalCategoria from '../../components/modals/ModalCategoria';

const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]';

export default function SeccionCategorias() {
  const api = useApiClient();
  const [categorias, setCategorias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [categoriaEditando, setCategoriaEditando] = useState(null);

  useEffect(() => {
    cargarCategorias();
  }, []);

  const cargarCategorias = async () => {
    try {
      setLoading(true);
      const data = await categoriasApi.getAll(api);
      setCategorias(data);
    } catch (error) {
      console.error('Error cargando categorias:', error);
      alert('Error al cargar categorias');
    } finally {
      setLoading(false);
    }
  };

  const abrirModal = (categoria = null) => {
    setCategoriaEditando(categoria);
    setModalAbierto(true);
  };

  const cerrarModal = () => {
    setModalAbierto(false);
    setCategoriaEditando(null);
  };

  const eliminarCategoria = async (id) => {
    if (!confirm('Eliminar esta categoria? No se podra recuperar.')) return;
    try {
      await categoriasApi.eliminar(api, id);
      alert('Categoria eliminada correctamente');
      cargarCategorias();
    } catch (error) {
      console.error('Error eliminando categoria:', error);
      alert(error.response?.data?.error || 'Error al eliminar categoria');
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
        <h2 className="text-xl font-bold text-gray-900">Categorias Laborales</h2>
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors"
        >
          + Anadir Categoria
        </button>
      </div>

      {categorias.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No hay categorias configuradas. Anade la primera.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Codigo</th>
                <th className="text-left p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Salario Base</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Plus Convenio</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">/hora</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">% Noct</th>
                <th className="text-right p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">% Fest</th>
                <th className="text-center p-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 font-mono text-sm text-gray-600">{cat.codigo}</td>
                  <td className="p-3 font-semibold text-gray-900 text-sm">{cat.nombre}</td>
                  <td className="p-3 text-right text-sm text-gray-700">{parseFloat(cat.salarioBase).toFixed(2)}EUR</td>
                  <td className="p-3 text-right text-sm text-gray-700">{parseFloat(cat.plusConvenio).toFixed(2)}EUR</td>
                  <td className="p-3 text-right font-bold text-teal-600 text-sm">{parseFloat(cat.precioHora).toFixed(2)}EUR</td>
                  <td className="p-3 text-right text-sm text-gray-500">{parseFloat(cat.recargoNocturno)}%</td>
                  <td className="p-3 text-right text-sm text-gray-500">{parseFloat(cat.recargoFestivo)}%</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirModal(cat)}
                        className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-xs font-medium transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarCategoria(cat.id)}
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
        <ModalCategoria
          categoria={categoriaEditando}
          onClose={cerrarModal}
          onGuardar={cargarCategorias}
        />
      )}
    </div>
  );
}
