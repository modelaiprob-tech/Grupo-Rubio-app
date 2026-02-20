import { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import * as plantillasApi from '../services/plantillasApi';
import * as centrosApi from '../services/centrosApi';

function useFont(href) {
  useEffect(() => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);
}

const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300';

function Plantillas() {
  const api = useApiClient();
  const [plantillas, setPlantillas] = useState([]);
  const [centros, setCentros] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [fechaAplicar, setFechaAplicar] = useState('');
  const [loading, setLoading] = useState(false);

  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [plantillasRes, centrosRes] = await Promise.all([
        plantillasApi.getAll(api),
        centrosApi.getAll(api)
      ]);
      setPlantillas(plantillasRes);
      setCentros(centrosRes);
    } catch (err) {
      console.error('Error cargando datos:', err);
      alert('Error al cargar plantillas');
    }
  };

  const aplicarPlantilla = async () => {
    if (!plantillaSeleccionada || !fechaAplicar) {
      alert('Selecciona plantilla y fecha');
      return;
    }

    setLoading(true);
    try {
      const resultado = await plantillasApi.aplicar(api, plantillaSeleccionada.id, {
        fechaInicio: fechaAplicar
      });
      alert(`${resultado.mensaje || 'Plantilla aplicada correctamente'}`);
      setMostrarModal(false);
      setPlantillaSeleccionada(null);
      setFechaAplicar('');
    } catch (err) {
      console.error('Error aplicando plantilla:', err);
      alert('Error al aplicar plantilla');
    } finally {
      setLoading(false);
    }
  };

  const eliminarPlantilla = async (id) => {
    if (!confirm('Eliminar esta plantilla?')) return;
    try {
      await plantillasApi.eliminar(api, id);
      alert('Plantilla eliminada');
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando:', err);
      alert('Error al eliminar plantilla');
    }
  };

  const diasSemana = ['', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Plantillas de Turnos</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Plantillas guardadas que puedes aplicar a cualquier semana</p>
      </div>

      {plantillas.length === 0 ? (
        <div className={`${cardClass} text-center py-16`}>
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">No hay plantillas guardadas</p>
          <p className="text-gray-400 text-sm mt-1">Ve a Planificacion y usa "Guardar como plantilla" en una semana</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {plantillas.map(plantilla => (
            <div key={plantilla.id} className={cardClass}>
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900">{plantilla.nombre}</h3>
                <span className="inline-block mt-1 px-2.5 py-1 bg-teal-50 text-teal-700 rounded-lg text-xs font-medium">
                  {plantilla.centros_trabajo?.nombre || 'Sin centro'}
                </span>
              </div>

              {plantilla.descripcion && (
                <p className="text-sm text-gray-500 mb-4">{plantilla.descripcion}</p>
              )}

              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <span className="text-sm text-gray-500 font-medium">{plantilla.plantillas_turnos_detalle?.length || 0} turnos</span>
              </div>

              <div className="space-y-1.5 mb-4">
                {plantilla.plantillas_turnos_detalle?.slice(0, 5).map((det, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm bg-gray-50 rounded-lg px-3 py-2">
                    <span className="font-semibold text-teal-600 w-8">{diasSemana[det.dia_semana]}</span>
                    <span className="text-gray-700 flex-1 truncate">
                      {det.trabajadores?.nombre} {det.trabajadores?.apellidos}
                    </span>
                    <span className="text-gray-400 text-xs font-mono">
                      {det.hora_inicio}-{det.hora_fin}
                    </span>
                  </div>
                ))}
                {plantilla.plantillas_turnos_detalle?.length > 5 && (
                  <p className="text-xs text-gray-400 px-3 font-medium">
                    +{plantilla.plantillas_turnos_detalle.length - 5} turnos mas...
                  </p>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-100">
                <button
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 text-sm font-medium transition-colors"
                  onClick={() => {
                    setPlantillaSeleccionada(plantilla);
                    setMostrarModal(true);
                  }}
                >
                  Aplicar
                </button>
                <button
                  className="px-4 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 text-sm font-medium transition-colors"
                  onClick={() => eliminarPlantilla(plantilla.id)}
                >
                  Eliminar
                </button>
              </div>

              <p className="text-xs text-gray-400 mt-3">
                Creada: {new Date(plantilla.created_at).toLocaleDateString('es-ES')}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Modal Aplicar */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setMostrarModal(false)}>
          <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Aplicar Plantilla</h2>
              <p className="text-sm text-gray-500 mt-1"><span className="font-semibold text-gray-700">{plantillaSeleccionada?.nombre}</span></p>
            </div>

            <div className="p-6">
              <label className="block text-sm font-medium text-gray-500 mb-2">Fecha de inicio (lunes de la semana)</label>
              <input
                type="date"
                value={fechaAplicar}
                onChange={e => setFechaAplicar(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
              />
            </div>

            <div className="p-6 pt-0 flex gap-3">
              <button
                onClick={() => setMostrarModal(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={aplicarPlantilla}
                disabled={loading || !fechaAplicar}
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Aplicando...' : 'Aplicar Plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Plantillas;
