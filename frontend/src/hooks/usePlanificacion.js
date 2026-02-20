import { useState, useEffect } from 'react';
import { useAusencias } from './useAusencias';
import * as centrosApi from '../services/centrosApi';
import * as trabajadoresApi from '../services/trabajadoresApi';
import * as asignacionesApi from '../services/asignacionesApi';
import * as ausenciasApi from '../services/ausenciasApi';
import * as plantillasApi from '../services/plantillasApi';

// Helper: formatear fecha como YYYY-MM-DD en zona local (evita bug de timezone con toISOString)
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function usePlanificacion(api) {
  const [centros, setCentros] = useState([]);
  const [trabajadores, setTrabajadores] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [alertasBajas, setAlertasBajas] = useState([]);
  const [alertasGlobales, setAlertasGlobales] = useState([]);
  const [centroSeleccionado, setCentroSeleccionado] = useState(null);
  const [semanaOffset, setSemanaOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [busquedaCentro, setBusquedaCentro] = useState('');
  const [clienteExpandido, setClienteExpandido] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [diaSeleccionado, setDiaSeleccionado] = useState(null);
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null);

  const [form, setForm] = useState({
    trabajadorId: '',
    horaInicio: '06:00',
    horaFin: '14:00'
  });
  const [vistaActual, setVistaActual] = useState('semanal');
  const [mesActual, setMesActual] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [asignacionesMensuales, setAsignacionesMensuales] = useState([]);
  const [modalCopiarOpen, setModalCopiarOpen] = useState(false);
  const [copiandoSemana, setCopiandoSemana] = useState(false);
  const [modalPlantillaOpen, setModalPlantillaOpen] = useState(false);
  const [formPlantilla, setFormPlantilla] = useState({ nombre: '', descripcion: '' });
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false);
  const [ausenciasDiaModal, setAusenciasDiaModal] = useState([]);

  // Obtener fechas de la semana
  const getWeekDates = (offset) => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (offset * 7);
    const monday = new Date(today.setDate(diff));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const weekDates = getWeekDates(semanaOffset);
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const {
    ausenciasActivas,
    getAusencia,
    tieneAusenciaConfirmada,
    getColorTrabajador: getColorTrabajadorHook,
    cargarAusencias
  } = useAusencias(api, weekDates);

  useEffect(() => {
    cargarDatos();
  }, []);

  useEffect(() => {
    if (centroSeleccionado) {
      Promise.all([
        cargarAsignaciones(),
        cargarAlertasGlobales()
      ]);
    }
  }, [centroSeleccionado, semanaOffset]);

  useEffect(() => {
    if (vistaActual === 'mensual' && centroSeleccionado) {
      cargarAsignacionesMensuales();
    }
  }, [vistaActual, mesActual, centroSeleccionado]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [centrosData, trabajadoresData] = await Promise.all([
        centrosApi.getAll(api),
        trabajadoresApi.getAll(api)
      ]);
      setCentros(centrosData);
      setTrabajadores(trabajadoresData);
      if (centrosData.length > 0) {
        setCentroSeleccionado(centrosData[0]);
      }
    } catch (err) {
      console.error('Error cargando datos:', err);
    }
    setLoading(false);
  };

  const cargarAsignaciones = async () => {
    if (!centroSeleccionado) return;

    const fechaDesde = formatDateLocal(weekDates[0]);
    const fechaHasta = formatDateLocal(weekDates[6]);

    try {
      const params = `centroId=${centroSeleccionado.id}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
      const data = await asignacionesApi.getByFiltros(api, params);
      setAsignaciones(data);
    } catch (err) {
      console.error('Error cargando asignaciones:', err);
    }
  };

  const cargarAsignacionesMensuales = async () => {
    const firstDay = new Date(mesActual.year, mesActual.month, 1);
    const lastDay = new Date(mesActual.year, mesActual.month + 1, 0);
    const fechaDesde = formatDateLocal(firstDay);
    const fechaHasta = formatDateLocal(lastDay);

    try {
      let params = `fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`;
      if (centroSeleccionado) {
        params += `&centroId=${centroSeleccionado.id}`;
      }
      const data = await asignacionesApi.getByFiltros(api, params);
      setAsignacionesMensuales(data);
    } catch (err) {
      console.error('Error cargando asignaciones mensuales:', err);
    }
  };

  const cargarAlertasGlobales = async () => {
    try {
      const fechaDesde = formatDateLocal(weekDates[0]);
      const fechaHasta = formatDateLocal(weekDates[6]);

      const todasAsignaciones = await asignacionesApi.getByFiltros(api, `fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);

      const ausencias = await ausenciasApi.getAll(api);
      const activas = ausencias.filter(a => {
        const inicio = new Date(a.fechaInicio);
        const fin = new Date(a.fechaFin);
        return (inicio <= weekDates[6] && fin >= weekDates[0]);
      });

      const alertas = [];
      for (const ausencia of activas) {
        if (ausencia.estado === 'PENDIENTE' || ausencia.estado === 'APROBADA') {
          const asignacionesAfectadas = todasAsignaciones.filter(asig =>
            asig.trabajadorId === ausencia.trabajadorId &&
            new Date(asig.fecha) >= new Date(ausencia.fechaInicio) &&
            new Date(asig.fecha) <= new Date(ausencia.fechaFin)
          );

          if (asignacionesAfectadas.length > 0) {
            alertas.push({
              ausencia,
              asignaciones: asignacionesAfectadas,
              urgente: ausencia.estado === 'APROBADA'
            });
          }
        }
      }

      setAlertasGlobales(alertas);
    } catch (err) {
      console.error('Error cargando alertas globales:', err);
    }
  };

  const abrirModal = async (fecha, trabajador = null) => {
    setDiaSeleccionado(fecha);
    setTrabajadorSeleccionado(trabajador);
    setForm({
      trabajadorId: trabajador?.id || '',
      horaInicio: '06:00',
      horaFin: '14:00'
    });
    setModalOpen(true);

    try {
      const ausencias = await ausenciasApi.getAll(api);
      const fechaSel = new Date(fecha);
      fechaSel.setHours(12, 0, 0, 0);
      const ausenciasDia = ausencias.filter(a => {
        const inicio = new Date(a.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = a.fechaAltaReal ? new Date(a.fechaAltaReal) : new Date(a.fechaFin);
        fin.setHours(23, 59, 59, 999);
        return fechaSel >= inicio && fechaSel <= fin;
      });
      setAusenciasDiaModal(ausenciasDia);
    } catch (err) {
      console.error('Error cargando ausencias del día:', err);
      setAusenciasDiaModal([]);
    }

    await cargarTrabajadoresDisponibles(fecha, '06:00', '14:00');
  };

  const cargarTrabajadoresDisponibles = async (fecha, horaInicio, horaFin) => {
    if (!centroSeleccionado || !fecha) return;

    try {
      const todosTrabajadores = await trabajadoresApi.getActivos(api);
      setTrabajadores(todosTrabajadores);
    } catch (err) {
      console.error('Error cargando trabajadores:', err);
    }
  };

  const guardarAsignacion = async (e) => {
    e.preventDefault();
    try {
      const resultado = await asignacionesApi.crear(api, {
        trabajadorId: parseInt(form.trabajadorId),
        centroId: centroSeleccionado.id,
        fecha: formatDateLocal(diaSeleccionado),
        horaInicio: form.horaInicio,
        horaFin: form.horaFin
      });

      if (resultado.alertas && resultado.alertas.length > 0) {
        const mensajesAlerta = resultado.alertas.map(a => {
          return a.mensaje.replace(/[⚠️🌙📅]/g, '').trim();
        }).join('\n\n');

        const confirmar = window.confirm(
          `ALERTAS DETECTADAS:\n\n${mensajesAlerta}\n\n¿Desea continuar y crear el turno de todos modos?`
        );

        if (!confirmar) {
          await asignacionesApi.eliminar(api, resultado.asignacion.id);
          return;
        }
      }

      setModalOpen(false);
      cargarAsignaciones();
      if (vistaActual === 'mensual') cargarAsignacionesMensuales();

    } catch (err) {
      console.error('Error guardando:', err);
      alert(err.message || 'Error al guardar la asignación');
    }
  };

  const eliminarAsignacion = async (asignacionId) => {
    if (!confirm('¿Eliminar esta asignación?')) return;
    try {
      await asignacionesApi.eliminar(api, asignacionId);
      cargarAsignaciones();
      if (vistaActual === 'mensual') cargarAsignacionesMensuales();
    } catch (err) {
      console.error('Error eliminando:', err);
    }
  };

  const copiarSemana = async () => {
    if (!confirm('¿Copiar todos los turnos de esta semana a la semana siguiente?')) return;

    setCopiandoSemana(true);
    try {
      const fechaOrigenInicio = formatDateLocal(weekDates[0]);
      const fechaOrigenFin = formatDateLocal(weekDates[6]);

      const proximaSemana = new Date(weekDates[0]);
      proximaSemana.setDate(proximaSemana.getDate() + 7);
      const fechaDestinoInicio = formatDateLocal(proximaSemana);

      const resultado = await asignacionesApi.copiarSemana(api, {
        fechaOrigenInicio,
        fechaOrigenFin,
        fechaDestinoInicio
      });

      alert(`✅ ${resultado.mensaje}`);
      setSemanaOffset(semanaOffset + 1);
      if (vistaActual === 'mensual') cargarAsignacionesMensuales();
    } catch (err) {
      console.error('Error copiando semana:', err);
      alert('❌ Error al copiar semana');
    }
    setCopiandoSemana(false);
  };

  const guardarComoPlantilla = async (e) => {
    e.preventDefault();

    if (!formPlantilla.nombre.trim()) {
      alert('El nombre es obligatorio');
      return;
    }

    setGuardandoPlantilla(true);
    try {
      const fechaInicio = formatDateLocal(weekDates[0]);
      const fechaFin = formatDateLocal(weekDates[6]);

      await plantillasApi.crearDesdeSemana(api, {
        nombre: formPlantilla.nombre,
        descripcion: formPlantilla.descripcion,
        centroId: centroSeleccionado.id,
        fechaInicio,
        fechaFin
      });

      alert(`✅ Plantilla "${formPlantilla.nombre}" guardada`);
      setModalPlantillaOpen(false);
      setFormPlantilla({ nombre: '', descripcion: '' });
    } catch (err) {
      console.error('Error guardando plantilla:', err);
      alert(err.error || '❌ Error al guardar plantilla');
    }
    setGuardandoPlantilla(false);
  };

  const getColorTrabajador = (trabajadorId, fecha) => {
    return getColorTrabajadorHook(trabajadorId, fecha);
  };

  const getEstadoTrabajador = (trabajadorId, fecha) => {
    const ausencia = ausenciasActivas.find(a =>
      a.trabajadorId === trabajadorId &&
      new Date(a.fechaInicio) <= new Date(fecha) &&
      new Date(a.fechaFin) >= new Date(fecha)
    );

    if (ausencia) {
      if (ausencia.estado === 'APROBADA') return `En baja: ${ausencia.tipoAusencia?.nombre}`;
      if (ausencia.estado === 'PENDIENTE') return `Baja pendiente: ${ausencia.tipoAusencia?.nombre}`;
    }

    const fechaStr = fecha ? formatDateLocal(fecha) : null;
    const asignacionOtroCentro = asignaciones.find(a =>
      a.trabajadorId === trabajadorId &&
      a.fecha.split('T')[0] === fechaStr &&
      a.centroId !== centroSeleccionado?.id
    );

    if (asignacionOtroCentro) {
      return `Trabajando en ${asignacionOtroCentro.centro?.nombre || 'otro centro'}`;
    }

    return null;
  };

  const getAsignacionesDia = (fecha) => {
    const fechaStr = formatDateLocal(fecha);
    return asignaciones.filter(a => a.fecha.split('T')[0] === fechaStr);
  };

  const formatFecha = (date) => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  };

  return {
    centros,
    trabajadores,
    asignaciones,
    alertasGlobales,
    centroSeleccionado,
    setCentroSeleccionado,
    semanaOffset,
    setSemanaOffset,
    loading,
    busquedaCentro,
    setBusquedaCentro,
    clienteExpandido,
    setClienteExpandido,
    modalOpen,
    setModalOpen,
    diaSeleccionado,
    form,
    setForm,
    vistaActual,
    setVistaActual,
    mesActual,
    setMesActual,
    asignacionesMensuales,
    modalPlantillaOpen,
    setModalPlantillaOpen,
    formPlantilla,
    setFormPlantilla,
    guardandoPlantilla,
    ausenciasDiaModal,
    weekDates,
    diasSemana,
    abrirModal,
    guardarAsignacion,
    eliminarAsignacion,
    copiarSemana,
    guardarComoPlantilla,
    getColorTrabajador,
    getAsignacionesDia,
    formatFecha,
    cargarAsignaciones
  };
}
