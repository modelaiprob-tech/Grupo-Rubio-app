import { useState, useEffect } from 'react';
import * as horariosFijosApi from '../services/horariosFijosApi';
import * as centrosApi from '../services/centrosApi';

export function useHorariosFijos(api, trabajadorId) {
  const [horarios, setHorarios] = useState([]);
  const [centros, setCentros] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editando, setEditando] = useState(null);

  const [formData, setFormData] = useState({
    centroId: '',
    lunes: false,
    martes: false,
    miercoles: false,
    jueves: false,
    viernes: false,
    sabado: false,
    domingo: false,
    horaInicio: '08:00',
    horaFin: '16:00',
    fechaInicio: new Date().toISOString().split('T')[0],
    fechaFin: '',
    notas: ''
  });

  // Obtener centro seleccionado
  const centroSeleccionado = centros.find(c => c.id === parseInt(formData.centroId));

  // Función para obtener horarios de validación
  const getHorariosValidacion = (centro) => {
    if (!centro) return { min: '06:00', max: '22:00' };

    if (centro.tipoHorarioLimpieza === 'FLEXIBLE') {
      return { min: '00:00', max: '23:59' };
    }

    if (centro.horariosLimpieza && centro.horariosLimpieza.length > 0) {
      const hrs = centro.horariosLimpieza;
      const minInicio = hrs.reduce((min, h) => h.inicio < min ? h.inicio : min, hrs[0].inicio);
      const maxFin = hrs.reduce((max, h) => h.fin > max ? h.fin : max, hrs[0].fin);
      return { min: minInicio, max: maxFin };
    }

    return {
      min: centro.horarioApertura || '06:00',
      max: centro.horarioCierre || '22:00'
    };
  };

  const { min: horarioMin, max: horarioMax } = getHorariosValidacion(centroSeleccionado);

  // Cargar horarios del trabajador
  useEffect(() => {
    if (trabajadorId) {
      cargarHorarios();
      cargarCentros();
    }
  }, [trabajadorId]);

  const cargarHorarios = async () => {
    try {
      setLoading(true);
      const data = await horariosFijosApi.getByTrabajador(api, trabajadorId);
      setHorarios(data);
    } catch (error) {
      console.error('Error al cargar horarios:', error);
      alert('Error al cargar horarios fijos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCentros = async () => {
    try {
      const data = await centrosApi.getAll(api);
      setCentros(data);
    } catch (error) {
      console.error('Error al cargar centros:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Validar que al menos un día esté seleccionado
    const algunDiaSeleccionado = formData.lunes || formData.martes || formData.miercoles ||
                                 formData.jueves || formData.viernes || formData.sabado || formData.domingo;

    if (!algunDiaSeleccionado) {
      alert('Debe seleccionar al menos un día de la semana');
      return;
    }

    if (!formData.centroId) {
      alert('Debe seleccionar un centro');
      return;
    }

    // Validación: Horario dentro del rango del centro
    if (centroSeleccionado) {
      const validarHorario = (inicio, fin, apertura, cierre) => {
        const [hI, mI] = inicio.split(':').map(Number);
        const [hF, mF] = fin.split(':').map(Number);
        const [hA, mA] = apertura.split(':').map(Number);
        const [hC, mC] = cierre.split(':').map(Number);

        const minutosInicio = hI * 60 + mI;
        const minutosFin = hF * 60 + mF;
        const minutosApertura = hA * 60 + mA;
        const minutosCierre = hC * 60 + mC;

        const centroCruzaMedianoche = minutosCierre < minutosApertura;

        if (centroCruzaMedianoche) {
          return minutosInicio >= minutosApertura || minutosFin <= minutosCierre;
        } else {
          return minutosInicio >= minutosApertura && minutosFin <= minutosCierre;
        }
      };

      if (!validarHorario(
        formData.horaInicio,
        formData.horaFin,
        horarioMin,
        horarioMax
      )) {
        alert(`El horario debe estar dentro del horario del centro: ${horarioMin} - ${horarioMax}`);
        return;
      }
    }

    try {
      setLoading(true);

      if (editando) {
        await horariosFijosApi.actualizar(api, editando, formData);
        alert('Horario actualizado correctamente');
      } else {
        await horariosFijosApi.crear(api, {
          ...formData,
          trabajadorId: parseInt(trabajadorId)
        });
        alert('Horario creado correctamente');
      }

      await cargarHorarios();
      cerrarModal();
    } catch (error) {
      console.error('Error al guardar horario:', error);
      alert(error?.error || 'Error al guardar el horario');
    } finally {
      setLoading(false);
    }
  };

  const eliminarHorario = async (id) => {
    const confirmar = window.confirm(
      '¿Desactivar este horario fijo?\n\n' +
      '⚠️ Las asignaciones futuras creadas desde este horario se eliminarán.'
    );

    if (!confirmar) return;

    try {
      setLoading(true);
      await horariosFijosApi.eliminar(api, id, { eliminarAsignacionesFuturas: true });
      alert('Horario desactivado y asignaciones futuras eliminadas');
      await cargarHorarios();
    } catch (error) {
      console.error('Error al desactivar horario:', error);
      alert('Error al desactivar el horario');
    } finally {
      setLoading(false);
    }
  };

  const editarHorario = (horario) => {
    setEditando(horario.id);
    setFormData({
      centroId: horario.centroId,
      lunes: horario.lunes,
      martes: horario.martes,
      miercoles: horario.miercoles,
      jueves: horario.jueves,
      viernes: horario.viernes,
      sabado: horario.sabado,
      domingo: horario.domingo,
      horaInicio: horario.horaInicio,
      horaFin: horario.horaFin,
      fechaInicio: horario.fechaInicio.split('T')[0],
      fechaFin: horario.fechaFin ? horario.fechaFin.split('T')[0] : '',
      notas: horario.notas || ''
    });
    setShowModal(true);
  };

  const cerrarModal = () => {
    setShowModal(false);
    setEditando(null);
    setFormData({
      centroId: '',
      lunes: false,
      martes: false,
      miercoles: false,
      jueves: false,
      viernes: false,
      sabado: false,
      domingo: false,
      horaInicio: '08:00',
      horaFin: '16:00',
      fechaInicio: new Date().toISOString().split('T')[0],
      fechaFin: '',
      notas: ''
    });
  };

  const getDiasTexto = (horario) => {
    const dias = [];
    if (horario.lunes) dias.push('L');
    if (horario.martes) dias.push('M');
    if (horario.miercoles) dias.push('X');
    if (horario.jueves) dias.push('J');
    if (horario.viernes) dias.push('V');
    if (horario.sabado) dias.push('S');
    if (horario.domingo) dias.push('D');
    return dias.join('-');
  };

  return {
    horarios,
    centros,
    loading,
    showModal,
    setShowModal,
    editando,
    formData,
    setFormData,
    centroSeleccionado,
    horarioMin,
    horarioMax,
    handleSubmit,
    eliminarHorario,
    editarHorario,
    cerrarModal,
    getDiasTexto
  };
}
