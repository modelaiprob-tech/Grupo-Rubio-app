import { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import './Plantillas.css';

function Plantillas() {
  const api = useApiClient();
  const [plantillas, setPlantillas] = useState([]);
  const [centros, setCentros] = useState([]);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
  const [fechaAplicar, setFechaAplicar] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      const [plantillasRes, centrosRes] = await Promise.all([
        api.get('/plantillas'),
        api.get('/centros')
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
      const resultado = await api.post(`/plantillas/${plantillaSeleccionada.id}/aplicar`, {
        fechaInicio: fechaAplicar
      });
      
      alert(`✅ ${resultado.mensaje || 'Plantilla aplicada correctamente'}`);
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
    if (!confirm('¿Eliminar esta plantilla?')) return;
    
    try {
      await api.del(`/plantillas/${id}`);
      alert('Plantilla eliminada');
      cargarDatos();
    } catch (err) {
      console.error('Error eliminando:', err);
      alert('Error al eliminar plantilla');
    }
  };

  const diasSemana = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div className="plantillas-container">
      <div className="plantillas-header">
        <h1>📋 Plantillas de Turnos</h1>
        <p>Plantillas guardadas que puedes aplicar a cualquier semana</p>
      </div>

      {plantillas.length === 0 ? (
        <div className="sin-plantillas">
          <p>🔍 No hay plantillas guardadas</p>
          <p className="hint">Ve a Planificación y usa "Guardar como plantilla" en una semana</p>
        </div>
      ) : (
        <div className="plantillas-grid">
          {plantillas.map(plantilla => (
            <div key={plantilla.id} className="plantilla-card">
              <div className="plantilla-header">
                <h3>{plantilla.nombre}</h3>
                <span className="plantilla-centro">
                  {plantilla.centros_trabajo?.nombre || 'Sin centro'}
                </span>
              </div>
              
              {plantilla.descripcion && (
                <p className="plantilla-descripcion">{plantilla.descripcion}</p>
              )}

              <div className="plantilla-stats">
                <span>👥 {plantilla.plantillas_turnos_detalle?.length || 0} turnos</span>
              </div>

              <div className="plantilla-detalles">
                {plantilla.plantillas_turnos_detalle?.slice(0, 5).map((det, idx) => (
                  <div key={idx} className="detalle-turno">
                    <span className="dia">{diasSemana[det.dia_semana]}</span>
                    <span className="trabajador">
                      {det.trabajadores?.nombre} {det.trabajadores?.apellidos}
                    </span>
                    <span className="horas">
                      {det.hora_inicio} - {det.hora_fin}
                    </span>
                  </div>
                ))}
                {plantilla.plantillas_turnos_detalle?.length > 5 && (
                  <p className="mas-turnos">
                    +{plantilla.plantillas_turnos_detalle.length - 5} turnos más...
                  </p>
                )}
              </div>

              <div className="plantilla-acciones">
                <button 
                  className="btn-aplicar"
                  onClick={() => {
                    setPlantillaSeleccionada(plantilla);
                    setMostrarModal(true);
                  }}
                >
                  ✨ Aplicar
                </button>
                <button 
                  className="btn-eliminar"
                  onClick={() => eliminarPlantilla(plantilla.id)}
                >
                  🗑️
                </button>
              </div>

              <div className="plantilla-fecha">
                Creada: {new Date(plantilla.created_at).toLocaleDateString('es-ES')}
              </div>
            </div>
          ))}
        </div>
      )}

      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>Aplicar Plantilla</h2>
            <p><strong>{plantillaSeleccionada?.nombre}</strong></p>
            
            <div className="form-group">
              <label>Fecha de inicio (lunes de la semana):</label>
              <input
                type="date"
                value={fechaAplicar}
                onChange={e => setFechaAplicar(e.target.value)}
              />
            </div>

            <div className="modal-acciones">
              <button onClick={() => setMostrarModal(false)}>Cancelar</button>
              <button 
                onClick={aplicarPlantilla}
                disabled={loading || !fechaAplicar}
                className="btn-primary"
              >
                {loading ? 'Aplicando...' : '✨ Aplicar Plantilla'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Plantillas;