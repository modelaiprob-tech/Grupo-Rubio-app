import { useState, useEffect, useCallback, useMemo } from 'react';
import * as ausenciasApi from '../services/ausenciasApi';
import * as trabajadoresApi from '../services/trabajadoresApi';
import * as tiposAusenciaApi from '../services/tiposAusenciaApi';

// ========================================
// Hook para PlanificacionPage (ausencias semanales)
// ========================================
export function useAusencias(api, weekDates) {
  const [ausenciasActivas, setAusenciasActivas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Crear una clave única que solo cambia cuando cambia la semana
  const semanaKey = useMemo(() => {
    if (!weekDates || weekDates.length === 0) return null;
    return weekDates[0].toISOString().split('T')[0];
  }, [weekDates[0]?.getTime()]);

  const cargarAusencias = useCallback(async () => {
    if (!weekDates || weekDates.length === 0 || !api) return;

    setLoading(true);
    try {
      const ausencias = await ausenciasApi.getAll(api);

      const activas = ausencias.filter(a => {
        const inicio = new Date(a.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(a.fechaFin);
        fin.setHours(23, 59, 59, 999);

        const inicioSemana = new Date(weekDates[0]);
        inicioSemana.setHours(0, 0, 0, 0);
        const finSemana = new Date(weekDates[6]);
        finSemana.setHours(23, 59, 59, 999);

        return (inicio <= finSemana && fin >= inicioSemana);
      });

      console.log(`✅ Ausencias cargadas: ${activas.length}`);
      setAusenciasActivas(activas);
    } catch (err) {
      console.error('❌ Error cargando ausencias:', err);
    } finally {
      setLoading(false);
    }
  }, [semanaKey]);

  useEffect(() => {
    if (semanaKey) {
      cargarAusencias();
    }
  }, [semanaKey]);

  const getAusencia = useCallback((trabajadorId, fecha) => {
  const fechaBusqueda = new Date(fecha);
  fechaBusqueda.setHours(12, 0, 0, 0);

  const ausencia = ausenciasActivas.find(a => {
    const inicio = new Date(a.fechaInicio);
    inicio.setHours(0, 0, 0, 0);

    // ✅ USAR fechaAltaReal si existe, sino fechaFin
    const finReal = a.fechaAltaReal ? new Date(a.fechaAltaReal) : new Date(a.fechaFin);
    finReal.setHours(23, 59, 59, 999);

    return a.trabajadorId === trabajadorId &&
           fechaBusqueda >= inicio &&
           fechaBusqueda <= finReal;  // ← Cambio aquí
  });

  return ausencia;
}, [ausenciasActivas]);



  const tieneAusenciaConfirmada = useCallback((trabajadorId, fecha) => {
    const ausencia = getAusencia(trabajadorId, fecha);
    return ausencia?.estado === 'APROBADA';
  }, [getAusencia]);

  const getColorTrabajador = useCallback((trabajadorId, fecha) => {
    const ausencia = getAusencia(trabajadorId, fecha);

    if (!ausencia) return '#3b82f6'; // Azul - disponible
    if (ausencia.estado === 'APROBADA') return '#ef4444'; // Rojo - confirmada
    if (ausencia.estado === 'PENDIENTE') return '#eab308'; // Amarillo - pendiente
    return '#3b82f6';
  }, [getAusencia]);

  const getEstadoTrabajador = useCallback((trabajadorId, fecha) => {
    const ausencia = getAusencia(trabajadorId, fecha);
    if (!ausencia) return null;

    if (ausencia.estado === 'APROBADA') return `🔴 ${ausencia.tipoAusencia?.nombre || 'AUSENCIA'}`;
    if (ausencia.estado === 'PENDIENTE') return `🟡 ${ausencia.tipoAusencia?.nombre || 'PENDIENTE'}`;
    return null;
  }, [getAusencia]);

  return {
    ausenciasActivas,
    loading,
    cargarAusencias,
    getAusencia,
    tieneAusenciaConfirmada,
    getColorTrabajador,
    getEstadoTrabajador
  };
}

// ========================================
// Hook para Ausencias.jsx (gestión CRUD)
// ========================================
export function useGestionAusencias(api) {
  const [ausencias, setAusencias] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [tiposAusencia, setTiposAusencia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editando, setEditando] = useState(null);
  const [mostrarArchivadas, setMostrarArchivadas] = useState(false);
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
    fechaAltaReal: '',
    numeroParte: '',
    contingencia: 'COMUN',
    entidadEmisora: ''
  });

  useEffect(() => {
    cargarDatos();
  }, [filtros.estado, filtros.trabajadorId, mostrarArchivadas]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filtros.estado) params.append('estado', filtros.estado);
      if (filtros.trabajadorId) params.append('trabajadorId', filtros.trabajadorId);
      if (!mostrarArchivadas) params.append('archivada', 'false');

      const [ausenciasData, trabajadoresData, tiposData] = await Promise.all([
        ausenciasApi.getAll(api, params.toString()),
        trabajadoresApi.getActivos(api),
        tiposAusenciaApi.getAll(api)
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
        fechaAltaReal: ausencia.fechaAltaReal?.split('T')[0] || '',
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
        fechaAltaReal: '',
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
        fechaAltaReal: form.fechaAltaReal || null
      };

      const tipoSel = tiposAusencia.find(t => t.id === parseInt(form.tipoAusenciaId));
      if (tipoSel?.codigo === 'BM' || tipoSel?.codigo === 'BML') {
        datos.numeroParte = form.numeroParte;
        datos.contingencia = form.contingencia;
        datos.entidadEmisora = form.entidadEmisora;
      }

      if (editando) {
        await ausenciasApi.actualizar(api, editando.id, datos);
      } else {
        await ausenciasApi.crear(api, datos);
      }

      setModalOpen(false);
      cargarDatos();
    } catch (error) {
      console.error('Error guardando ausencia:', error);
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
      const respuesta = await ausenciasApi.aprobar(api, id);

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
      await ausenciasApi.rechazar(api, id, { motivo });
      cargarDatos();
    } catch (err) {
      console.error('Error rechazando:', err);
      alert('Error al rechazar ausencia');
    }
  };

  const toggleArchivar = async (id, archivada) => {
    const accion = archivada ? 'desarchivar' : 'archivar';
    if (!confirm(`¿${accion.charAt(0).toUpperCase() + accion.slice(1)} esta ausencia?`)) return;

    try {
      await ausenciasApi.archivar(api, id, { archivada: !archivada });
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

  const ausenciaTerminada = (ausencia) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    if (ausencia.fechaAltaReal) {
      return new Date(ausencia.fechaAltaReal) < hoy;
    }
    return new Date(ausencia.fechaFin) < hoy;
  };

  const tipoSeleccionado = tiposAusencia.find(t => t.id === parseInt(form.tipoAusenciaId));
  const esBajaMedica = tipoSeleccionado?.codigo === 'BM' || tipoSeleccionado?.codigo === 'BML';

  return {
    ausencias,
    trabajadores,
    tiposAusencia,
    loading,
    modalOpen,
    setModalOpen,
    editando,
    mostrarArchivadas,
    setMostrarArchivadas,
    filtros,
    setFiltros,
    form,
    setForm,
    abrirModal,
    guardar,
    aprobar,
    rechazar,
    toggleArchivar,
    getEstadoBadge,
    ausenciaTerminada,
    tipoSeleccionado,
    esBajaMedica
  };
}
