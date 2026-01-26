import React, { useState, useEffect } from 'react';
import ModalCategoria from '../../components/modals/ModalCategoria';

export default function SeccionCategorias({ api }) {
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
      const data = await api.get('/categorias');
      setCategorias(data);
    } catch (error) {
      console.error('Error cargando categorías:', error);
      alert('Error al cargar categorías');
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
    if (!confirm('¿Eliminar esta categoría? No se podrá recuperar.')) return;
    
    try {
      await api.delete(`/categorias/${id}`);
      alert('Categoría eliminada correctamente');
      cargarCategorias();
    } catch (error) {
      console.error('Error eliminando categoría:', error);
      alert(error.response?.data?.error || 'Error al eliminar categoría');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Cargando categorías...</div>;
  }

  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-slate-900">Categorías Laborales</h2>
        <button
          onClick={() => abrirModal()}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          + Añadir Categoría
        </button>
      </div>

      {categorias.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          No hay categorías configuradas. Añade la primera.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Código</th>
                <th className="text-left p-3 text-sm font-semibold text-slate-700">Nombre</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">Salario Base</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">Plus Convenio</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">€/hora</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">% Nocturn</th>
                <th className="text-right p-3 text-sm font-semibold text-slate-700">% Festiv</th>
                <th className="text-center p-3 text-sm font-semibold text-slate-700">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((cat) => (
                <tr key={cat.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-mono text-sm">{cat.codigo}</td>
                  <td className="p-3 font-medium">{cat.nombre}</td>
                  <td className="p-3 text-right">{parseFloat(cat.salarioBase).toFixed(2)}€</td>
                  <td className="p-3 text-right">{parseFloat(cat.plusConvenio).toFixed(2)}€</td>
                  <td className="p-3 text-right font-semibold text-blue-600">{parseFloat(cat.precioHora).toFixed(2)}€</td>
                  <td className="p-3 text-right text-sm text-slate-600">{parseFloat(cat.recargoNocturno)}%</td>
                  <td className="p-3 text-right text-sm text-slate-600">{parseFloat(cat.recargoFestivo)}%</td>
                  <td className="p-3">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => abrirModal(cat)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => eliminarCategoria(cat.id)}
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
        <ModalCategoria
          categoria={categoriaEditando}
          onClose={cerrarModal}
          onGuardar={cargarCategorias}
          api={api}
        />
      )}
    </div>
  );
}