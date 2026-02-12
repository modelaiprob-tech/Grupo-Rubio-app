import { useState, useEffect } from 'react';
import './Ausencias.css';
import { useApiClient } from '../contexts/AuthContext';

function Ausencias() {
  const api = useApiClient();
  const [ausencias, setAusencias] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [tiposAusencia, setTiposAusencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false); // NUEVO
  const [filtros, setFiltros] = useState({
    estado: '',
    trabajadorId: '',
    tipo: ''
  });

  const [form, setForm] = useState({
    trabajadorId: '',
    tipoAusenciaId: '',
    fechaInicio: '',
    fechaFin: '',
    motivo: '',
    observaciones: '',
    fechaAltaReal: '', // NUEVO - Fecha real de reincorporación
    // Campos específicos para bajas médicas
    numeroParte: '',
    contingencia: 'COMUN',
    entidadEmisora: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros.estado, filtros.trabajadorId, mostrarArchivadas]); // MODIFICADO

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.trabajadorId) params.append('trabajadorId', filtros.trabajadorId);
      if (!mostrarArchivadas) params.append('archivada', 'false'); // NUEVO

      const [ausenciasData, trabajadoresData, tiposData] = await Promise.all([
        api.get(`/ausencias?${params.toString()}`),
        api.get('/trabajadores?activo=true'), // ✅ TODOS los trabajadores activos
        api.get('/tipos-ausencia')
      ]);

      setAusencias(ausenciasData);
      setTrabajadores(trabajadoresData);
      setTiposAusencia(tiposData);
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
    setLoading(false);
  };

  const abrirModal = (ausencia = null) => {
    if (ausencia) {
      setEditando(ausencia);
      setForm({
        trabajadorId: ausencia.trabajadorId,
        tipoAusenciaId: ausencia.tipoAusenciaId,
        fechaInicio: ausencia.fechaInicio?.split('T')[0],
        fechaFin: ausencia.fechaFin?.split('T')[0],
        motivo: ausencia.motivo || '',
        observaciones: ausencia.observaciones || '',
        fechaAltaReal: ausencia.fechaAltaReal?.split('T')[0] || '', // NUEVO
        numeroParte: ausencia.numeroParte || '',
        contingencia: ausencia.contingencia || 'COMUN',
        entidadEmisora: ausencia.entidadEmisora || ''
      });
    } else {
      setEditando(null);
      setForm({
        trabajadorId: '',
        tipoAusenciaId: '',
        fechaInicio: '',
        fechaFin: '',
        motivo: '',
        observaciones: '',
        fechaAltaReal: '', // NUEVO
        numeroParte: '',
        contingencia: 'COMUN',
        entidadEmisora: ''
      });
    }
    setModalOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    try {
      const datos = {
        trabajadorId: parseInt(form.trabajadorId),
        tipoAusenciaId: parseInt(form.tipoAusenciaId),
        fechaInicio: form.fechaInicio,
        fechaFin: form.fechaFin,
        motivo: form.motivo,
        observaciones: form.observaciones,
        fechaAltaReal: form.fechaAltaReal || null // NUEVO
      };

      // Si es baja médica, agregar campos específicos
      const tipoSeleccionado = tiposAusencia.find(t => t.id === parseInt(form.tipoAusenciaId));
      if (tipoSeleccionado?.codigo === 'BM' || tipoSeleccionado?.codigo === 'BML') {
        datos.numeroParte = form.numeroParte;
        datos.contingencia = form.contingencia;
        datos.entidadEmisora = form.entidadEmisora;
      }

      if (editando) {
        await api.put(`/ausencias/${editando.id}`, datos);
      } else {
        await api.post('/ausencias', datos);
      }

      setModalOpen(false);
      cargarDatos();
    } catch (error) {
  console.error('Error guardando ausencia:', error);
  
  // Mostrar mensaje específico si es error de validación
  if (error.error) {
    alert(error.error + (error.ausenciasSolapadas ? '\n\nConflicto con: ' + error.ausenciasSolapadas : ''));
  } else if (error.detalles) {
    alert('Errores:\n' + error.detalles.join('\n'));
  } else {
    alert('Error al guardar ausencia');
  }
}
  };

  const aprobar = async (id) => {
    if (!confirm('¿Aprobar esta ausencia?')) return;
    try {
      const respuesta = await api.put(`/ausencias/${id}/aprobar`);
      
      // Mostrar centros afectados
      if (respuesta.centrosAfectados && respuesta.centrosAfectados.length > 0) {
        let mensaje = `🔴 AUSENCIA APROBADA - ACCIÓN REQUERIDA\n\n`;
        mensaje += `Se han detectado ${respuesta.totalAsignacionesAfectadas} asignaciones que requieren suplencia:\n\n`;
        
        respuesta.centrosAfectados.forEach(centro => {
          mensaje += `📍 ${centro.clienteNombre} - ${centro.centroNombre}\n`;
          mensaje += `   Días afectados: ${centro.dias.join(', ')}\n\n`;
        });
        
        mensaje += `⚠️ Las asignaciones han sido marcadas como URGENTES.\n`;
        mensaje += `Ve a Planificación para asignar suplentes.`;
        
        alert(mensaje);
      } else {
        alert('✅ Ausencia aprobada correctamente.\nNo hay asignaciones afectadas.');
      }
      
      cargarDatos();
    } catch (err) {
      console.error('Error aprobando:', err);
      alert('Error al aprobar ausencia');
    }
  };

  const rechazar = async (id) => {
    const motivo = prompt('Motivo del rechazo:');
    if (!motivo) return;
    
    try {
      await api.put(`/ausencias/${id}/rechazar`, { motivo });
      cargarDatos();
    } catch (err) {
      console.error('Error rechazando:', err);
      alert('Error al rechazar ausencia');
    }
  };

  // NUEVO: Función para archivar/desarchivar
  const toggleArchivar = async (id, archivada) => {
    const accion = archivada ? 'desarchivar' : 'archivar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} esta ausencia?`)) return;
    
    try {
      await api.put(`/ausencias/${id}/archivar`, { archivada: !archivada });
      alert(`✅ Ausencia ${archivada ? 'desarchivada' : 'archivada'} correctamente`);
      cargarDatos();
    } catch (err) {
      console.error('Error archivando:', err);
      alert('Error al archivar ausencia');
    }
  };

  const getEstadoBadge = (estado) => {
    const estilos = {
      PENDIENTE: 'bg-yellow-100 text-yellow-800',
      APROBADA: 'bg-green-100 text-green-800',
      RECHAZADA: 'bg-red-100 text-red-800'
    };
    return estilos[estado] || 'bg-gray-100 text-gray-800';
  };

  // NUEVO: Helper para saber si la ausencia ya terminó
  const ausenciaTerminada = (ausencia) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    // Si tiene fecha de alta real, usar esa
    if (ausencia.fechaAltaReal) {
      return new Date(ausencia.fechaAltaReal) < hoy;
    }
    
    // Si no, usar fecha fin
    return new Date(ausencia.fechaFin) < hoy;
  };

  const tipoSeleccionado = tiposAusencia.find(t => t.id === parseInt(form.tipoAusenciaId));
  const esBajaMedica = tipoSeleccionado?.codigo === 'BM' || tipoSeleccionado?.codigo === 'BML';

  return (
    <div className="ausencias-container">
      <div className="ausencias-header">
        <div>
          <h1> Gestión de Ausencias</h1>
          <p>Vacaciones, permisos, bajas médicas y más</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          {/* NUEVO: Botón toggle archivadas */}
          <button 
            onClick={() => setMostrarArchivadas(!mostrarArchivadas)} 
            className={mostrarArchivadas ? 'btn-secondary' : 'btn-secondary'}
            style={{
              backgroundColor: mostrarArchivadas ? '#64748b' : '#e2e8f0',
              color: mostrarArchivadas ? 'white' : '#334155'
            }}
          >
            {mostrarArchivadas ? ' Ocultar Archivadas' : ' Mostrar Archivadas'}
          </button>
          <button onClick={() => abrirModal()} className="btn-primary">
            + Nueva Ausencia
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          className="filtro-select"
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="RECHAZADA">Rechazadas</option>
        </select>

        <select
          value={filtros.trabajadorId}
          onChange={(e) => setFiltros({ ...filtros, trabajadorId: e.target.value })}
          className="filtro-select"
        >
          <option value="">Todos los trabajadores</option>
          {trabajadores.map(t => (
            <option key={t.id} value={t.id}>
              {t.nombre} {t.apellidos}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de ausencias */}
      {loading ? (
        <div className="loading">Cargando...</div>
      ) : ausencias.length === 0 ? (
        <div className="sin-datos">
          <p>{mostrarArchivadas ? 'No hay ausencias archivadas' : 'No hay ausencias registradas'}</p>
          {!mostrarArchivadas && (
            <button onClick={() => abrirModal()} className="btn-secondary">
              Registrar la primera
            </button>
          )}
        </div>
      ) : (
        <div className="ausencias-grid">
          {ausencias.map(ausencia => {
            const terminada = ausenciaTerminada(ausencia);
            
            return (
              <div 
                key={ausencia.id} 
                className="ausencia-card"
                style={{
                  opacity: ausencia.archivada ? 0.7 : 1,
                  borderLeft: ausencia.archivada ? '4px solid #94a3b8' : '4px solid transparent'
                }}
              >
                <div className="card-header">
                  <div>
                    <h3>
                      {ausencia.trabajador?.nombre} {ausencia.trabajador?.apellidos}
                      {ausencia.archivada && <span style={{ marginLeft: '8px', fontSize: '14px' }}>📦</span>}
                    </h3>
                    <p className="tipo-ausencia" style={{ color: ausencia.tipoAusencia?.colorHex }}>
                      {ausencia.tipoAusencia?.nombre}
                    </p>
                  </div>
                  <span className={`badge ${getEstadoBadge(ausencia.estado)}`}>
                    {ausencia.estado}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="label">Periodo:</span>
                    <span className="value">
                      {new Date(ausencia.fechaInicio).toLocaleDateString('es-ES')} - {new Date(ausencia.fechaFin).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  {/* NUEVO: Mostrar fecha de alta real si existe */}
                  {ausencia.fechaAltaReal && (
                    <div className="info-row" style={{ backgroundColor: '#dcfce7', padding: '8px', borderRadius: '6px' }}>
                      <span className="label">✅ Alta real:</span>
                      <span className="value" style={{ fontWeight: 'bold', color: '#16a34a' }}>
                        {new Date(ausencia.fechaAltaReal).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}

                  <div className="info-row">
                    <span className="label">Duración:</span>
                    <span className="value">{ausencia.diasTotales} días</span>
                  </div>

                  {ausencia.motivo && (
                    <div className="info-row">
                      <span className="label">Motivo:</span>
                      <span className="value">{ausencia.motivo}</span>
                    </div>
                  )}

                  {ausencia.numeroParte && (
                    <div className="info-row">
                      <span className="label">Nº Parte:</span>
                      <span className="value">{ausencia.numeroParte}</span>
                    </div>
                  )}

                  {/* NUEVO: Indicador visual si la ausencia terminó */}
                  {terminada && ausencia.estado === 'APROBADA' && !ausencia.archivada && (
                    <div style={{ 
                      marginTop: '8px', 
                      padding: '8px', 
                      backgroundColor: '#fef3c7', 
                      borderRadius: '6px',
                      fontSize: '12px',
                      color: '#92400e'
                    }}>
                      ⏱️ Esta ausencia ya finalizó. Puedes archivarla.
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  {ausencia.estado === 'PENDIENTE' && !ausencia.archivada && (
                    <>
                      <button onClick={() => aprobar(ausencia.id)} className="btn-approve">
                        ✓ Aprobar
                      </button>
                      <button onClick={() => rechazar(ausencia.id)} className="btn-reject">
                        ✗ Rechazar
                      </button>
                    </>
                  )}
                  <button onClick={() => abrirModal(ausencia)} className="btn-edit">
                     Editar
                  </button>
                  {/* NUEVO: Botón archivar/desarchivar */}
                  <button 
                    onClick={() => toggleArchivar(ausencia.id, ausencia.archivada)} 
                    className="btn-archive"
                    style={{
                      backgroundColor: ausencia.archivada ? '#3b82f6' : '#64748b',
                      color: 'white',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '13px'
                    }}
                  >
                    {ausencia.archivada ? ' Desarchivar' : ' Archivar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h2>{editando ? 'Editar Ausencia' : 'Nueva Ausencia'}</h2>

            <form onSubmit={guardar} className="form-ausencia">
              <div className="form-group">
                <label>Trabajador *</label>
                <select
                  value={form.trabajadorId}
                  onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {trabajadores.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Tipo de Ausencia *</label>
                <select
                  value={form.tipoAusenciaId}
                  onChange={(e) => setForm({ ...form, tipoAusenciaId: e.target.value })}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {tiposAusencia.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.diasMaximo ? `(máx ${t.diasMaximo} días)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Fecha Inicio *</label>
                  <input
                    type="date"
                    value={form.fechaInicio}
                    onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Fecha Fin *</label>
                  <input
                    type="date"
                    value={form.fechaFin}
                    onChange={(e) => setForm({ ...form, fechaFin: e.target.value })}
                    min={form.fechaInicio}
                    required
                  />
                </div>
              </div>

              {/* NUEVO: Campo de fecha de alta real (para TODOS los tipos) */}
              <div className="form-group">
                <label>Fecha Alta Real (Reincorporación anticipada)</label>
                <input
                  type="date"
                  value={form.fechaAltaReal}
                  onChange={(e) => setForm({ ...form, fechaAltaReal: e.target.value })}
                  min={form.fechaInicio}
                  max={form.fechaFin}
                />
                <small style={{ color: '#64748b', fontSize: '12px', marginTop: '4px', display: 'block' }}>
                  Si el trabajador se reincorpora antes de la fecha prevista, indícala aquí
                </small>
              </div>

              {/* Campos específicos para Baja Médica */}
              {esBajaMedica && (
                <>
                  <div className="form-group">
                    <label>Número de Parte *</label>
                    <input
                      type="text"
                      value={form.numeroParte}
                      onChange={(e) => setForm({ ...form, numeroParte: e.target.value })}
                      placeholder="Ej: 123456789"
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Contingencia *</label>
                      <select
                        value={form.contingencia}
                        onChange={(e) => setForm({ ...form, contingencia: e.target.value })}
                        required
                      >
                        <option value="COMUN">Común</option>
                        <option value="LABORAL">Laboral</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Entidad Emisora</label>
                      <input
                        type="text"
                        value={form.entidadEmisora}
                        onChange={(e) => setForm({ ...form, entidadEmisora: e.target.value })}
                        placeholder="INSS / Mutua"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Motivo</label>
                <textarea
                  value={form.motivo}
                  onChange={(e) => setForm({ ...form, motivo: e.target.value })}
                  rows="2"
                  placeholder="Descripción breve..."
                />
              </div>

              <div className="form-group">
                <label>Observaciones</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                  rows="3"
                  placeholder="Notas internas, información adicional..."
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  {editando ? 'Guardar Cambios' : 'Crear Ausencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ausencias;