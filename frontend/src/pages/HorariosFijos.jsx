// ============================================
// FRONTEND: HorariosFijos.jsx
// ============================================
// Guardar en: frontend/src/components/HorariosFijos.jsx

import React, { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';

const HorariosFijos = ({ trabajadorId }) => {
  const { get, post, put, del } = useApiClient();
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
    const horarios = centro.horariosLimpieza;
    const minInicio = horarios.reduce((min, h) => h.inicio < min ? h.inicio : min, horarios[0].inicio);
    const maxFin = horarios.reduce((max, h) => h.fin > max ? h.fin : max, horarios[0].fin);
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
      const data = await get(`/horarios-fijos/trabajador/${trabajadorId}`);
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
    const data = await get('/centros');
    setCentros(data);
  } catch (error) {
    console.error('Error al cargar centros:', error);
  }
};
// if (formData.horaFin <= formData.horaInicio) {
//   alert('La hora de fin debe ser posterior a la hora de inicio');
//   return;
// }
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

    // ✅ NUEVA VALIDACIÓN: Horario dentro del rango del centro
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
      
      const cruzaMedianoche = minutosFin < minutosInicio;
      const centroCruzaMedianoche = minutosCierre < minutosApertura;
      
      // Si el centro cruza medianoche (ej: 06:00-00:00)
      if (centroCruzaMedianoche) {
        // Permitir horarios que crucen medianoche dentro del rango
        return minutosInicio >= minutosApertura || minutosFin <= minutosCierre;
      } else {
        // Centro normal (no cruza medianoche)
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
        // Actualizar
        await put(`/horarios-fijos/${editando}`, formData);
        alert('Horario actualizado correctamente');
      } else {
        // Crear
        await post('/horarios-fijos', {
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
    await del(`/horarios-fijos/${id}`, { eliminarAsignacionesFuturas: true });
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-slate-800">Horarios Fijos</h3>
        <button
        type="button"
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Añadir horario
        </button>
      </div>

      {/* Lista de horarios */}
      {loading && horarios.length === 0 ? (
        <div className="text-center py-8 text-slate-500">Cargando...</div>
      ) : horarios.length === 0 ? (
        <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border-2 border-dashed border-slate-200">
          <p className="mb-2">No hay horarios fijos configurados</p>
          <p className="text-sm">Añade un horario fijo para generar turnos automáticamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {horarios.map(horario => (
            <div 
              key={horario.id}
              className="bg-white border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="font-semibold text-slate-800">
                      {horario.centro.cliente.nombre} - {horario.centro.nombre}
                    </h4>
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                      {getDiasTexto(horario)}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm text-slate-600">
                    <div>
                      <span className="font-medium">Horario:</span> {horario.horaInicio} - {horario.horaFin}
                    </div>
                    <div>
                      <span className="font-medium">Vigencia:</span> {' '}
                      {new Date(horario.fechaInicio).toLocaleDateString()}
                      {horario.fechaFin && ` - ${new Date(horario.fechaFin).toLocaleDateString()}`}
                      {!horario.fechaFin && ' (indefinido)'}
                    </div>
                  </div>

                  {horario.notas && (
                    <div className="mt-2 text-sm text-slate-500 italic">
                      {horario.notas}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    editarHorario(horario);
  }}
  className="px-3 py-1 text-sm bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors"
>
  Editar
</button>
                  <button
                    onClick={() => eliminarHorario(horario.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Desactivar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-slate-800">
                  {editando ? 'Editar' : 'Nuevo'} Horario Fijo
                </h3>
                <button
                  onClick={cerrarModal}
                  className="text-slate-400 hover:text-slate-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-6">
                {/* Centro */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Centro de trabajo *
                  </label>
                  <select
                    value={formData.centroId}
                    onChange={(e) => setFormData({ ...formData, centroId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Seleccionar centro...</option>
                    {centros.filter(c => c.activo).map(centro => (
                      <option key={centro.id} value={centro.id}>
                        {centro.cliente.nombre} - {centro.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Días de la semana */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">
                    Días de la semana *
                  </label>
                  <div className="grid grid-cols-7 gap-2">
                    {['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'].map((dia, index) => (
                      <label
                        key={dia}
                        className={`flex flex-col items-center p-3 border-2 rounded-lg cursor-pointer transition-colors ${
                          formData[dia]
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={formData[dia]}
                          onChange={(e) => setFormData({ ...formData, [dia]: e.target.checked })}
                          className="sr-only"
                        />
                        <span className="text-xs font-medium text-slate-700">
                          {['L', 'M', 'X', 'J', 'V', 'S', 'D'][index]}
                        </span>
                        <span className="text-[10px] text-slate-500 mt-1">
                          {dia.charAt(0).toUpperCase() + dia.slice(1, 3)}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Horarios */}
<div className="grid grid-cols-2 gap-4">
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      Hora inicio *
    </label>
    <input
      type="time"
      value={formData.horaInicio}
      onChange={(e) => setFormData({ ...formData, horaInicio: e.target.value })}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      required
    />
    {/* ✅ MOSTRAR RANGO DEL CENTRO */}
    {centroSeleccionado && (
  <p className="text-xs text-slate-500 mt-1">
    {centroSeleccionado.tipoHorarioLimpieza === 'FLEXIBLE' 
      ? 'Horario flexible (24/7)' 
      : `Rango: ${horarioMin} - ${horarioMax}`
    }
  </p>
)}
  </div>
  <div>
    <label className="block text-sm font-medium text-slate-700 mb-2">
      Hora fin *
    </label>
    <input
      type="time"
      value={formData.horaFin}
      onChange={(e) => setFormData({ ...formData, horaFin: e.target.value })}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
      required
    />
    {/* ✅ MOSTRAR RANGO DEL CENTRO */}
    {centroSeleccionado && (
  <p className="text-xs text-slate-500 mt-1">
    {centroSeleccionado.tipoHorarioLimpieza === 'FLEXIBLE' 
      ? 'Horario flexible (24/7)' 
      : `Rango: ${horarioMin} - ${horarioMax}`
    }
  </p>
)}
  </div>
</div>

                {/* Fechas de vigencia */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Vigente desde *
                    </label>
                    <input
                      type="date"
                      value={formData.fechaInicio}
                      onChange={(e) => setFormData({ ...formData, fechaInicio: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Vigente hasta (opcional)
                    </label>
                    <input
                      type="date"
                      value={formData.fechaFin}
                      onChange={(e) => setFormData({ ...formData, fechaFin: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      Dejar vacío para horario indefinido
                    </p>
                  </div>
                </div>

                {/* Notas */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Notas (opcional)
                  </label>
                  <textarea
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows="3"
                    placeholder="Observaciones sobre este horario..."
                  />
                </div>

                {/* Botones */}
                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={cerrarModal}
                    className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
  type="button"
  onClick={(e) => {
    e.stopPropagation();
    handleSubmit(e);
  }}
  disabled={loading}
  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
>
  {loading ? 'Guardando...' : editando ? 'Actualizar' : 'Crear'}
</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HorariosFijos;