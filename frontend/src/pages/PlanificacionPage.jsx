import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import GenerarAsignacionesAutomaticas from './GenerarAsignacionesAutomaticas';
import { useAusencias } from '../hooks/useAusencias';


// ========================================
// PÁGINA DE PLANIFICACIÓN
// ========================================
export default function PlanificacionPage({ api }) {
  const [centros, setCentros] = useState([])
  const [trabajadores, setTrabajadores] = useState([])
  const [asignaciones, setAsignaciones] = useState([])
  const [alertasBajas, setAlertasBajas] = useState([]);
  const [alertasGlobales, setAlertasGlobales] = useState([]);
  const [centroSeleccionado, setCentroSeleccionado] = useState(null)
  const [semanaOffset, setSemanaOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [busquedaCentro, setBusquedaCentro] = useState('')
  const [clienteExpandido, setClienteExpandido] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [diaSeleccionado, setDiaSeleccionado] = useState(null)
  const [trabajadorSeleccionado, setTrabajadorSeleccionado] = useState(null)

  const [form, setForm] = useState({
    trabajadorId: '',
    horaInicio: '06:00',
    horaFin: '14:00'
  })
  const [modalCopiarOpen, setModalCopiarOpen] = useState(false)
  const [copiandoSemana, setCopiandoSemana] = useState(false)
  const [modalPlantillaOpen, setModalPlantillaOpen] = useState(false)
  const [formPlantilla, setFormPlantilla] = useState({ nombre: '', descripcion: '' })
  const [guardandoPlantilla, setGuardandoPlantilla] = useState(false)
  // Obtener fechas de la semana
  const getWeekDates = (offset) => {
    const today = new Date()
    const dayOfWeek = today.getDay()
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (offset * 7)
    const monday = new Date(today.setDate(diff))

    const dates = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      dates.push(date)
    }
    return dates
  }

  const weekDates = getWeekDates(semanaOffset)
  const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const { 
  ausenciasActivas, 
  getAusencia,
  tieneAusenciaConfirmada,
  getColorTrabajador: getColorTrabajadorHook,  // ✅ AGREGAR ESTA LÍNEA
  cargarAusencias 
} = useAusencias(api, weekDates);

  useEffect(() => {
    cargarDatos()
  }, [])

  useEffect(() => {
    if (centroSeleccionado) {
      cargarAsignaciones()
    }
    cargarAlertasGlobales()  // 👈 NUEVA LÍNEA
  }, [centroSeleccionado, semanaOffset])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [centrosData, trabajadoresData] = await Promise.all([
        api.get('/centros'),
        api.get('/trabajadores')
      ])
      setCentros(centrosData)
      setTrabajadores(trabajadoresData)
      if (centrosData.length > 0) {
        setCentroSeleccionado(centrosData[0])
      }
    } catch (err) {
      console.error('Error cargando datos:', err)
    }
    setLoading(false)
  }

  const cargarAsignaciones = async () => {
    if (!centroSeleccionado) return

    const fechaDesde = weekDates[0].toISOString().split('T')[0]
    const fechaHasta = weekDates[6].toISOString().split('T')[0]

    try {
      const data = await api.get(`/asignaciones?centroId=${centroSeleccionado.id}&fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`)
      setAsignaciones(data)
    } catch (err) {
      console.error('Error cargando asignaciones:', err)
    }
  }


  const cargarAlertasGlobales = async () => {
    try {
      const fechaDesde = weekDates[0].toISOString().split('T')[0];
      const fechaHasta = weekDates[6].toISOString().split('T')[0];

      // Obtener TODAS las asignaciones de la semana (sin filtrar por centro)
      const todasAsignaciones = await api.get(`/asignaciones?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}`);

      const ausencias = await api.get('/ausencias');
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
    setDiaSeleccionado(fecha)
    setTrabajadorSeleccionado(trabajador)
    setForm({
      trabajadorId: trabajador?.id || '',
      horaInicio: '06:00',
      horaFin: '14:00'
    })
    setModalOpen(true)

    // 🔥 NUEVO: Cargar trabajadores disponibles
    await cargarTrabajadoresDisponibles(fecha, '06:00', '14:00')
  }
  const cargarTrabajadoresDisponibles = async (fecha, horaInicio, horaFin) => {
  if (!centroSeleccionado || !fecha) return

  try {
    // Cargar TODOS los trabajadores activos
    const todosTrabajadores = await api.get('/trabajadores?activo=true');
    
    // Filtrar solo los que tienen ausencia CONFIRMADA
    const trabajadoresDisponibles = todosTrabajadores.filter(t => {
      return !tieneAusenciaConfirmada(t.id, fecha);
    });
    
    setTrabajadores(trabajadoresDisponibles);
  } catch (err) {
    console.error('Error cargando trabajadores:', err)
  }
}
const guardarAsignacion = async (e) => {
  e.preventDefault()
  try {
    const resultado = await api.post('/asignaciones', {
      trabajadorId: parseInt(form.trabajadorId),
      centroId: centroSeleccionado.id,
      fecha: diaSeleccionado.toISOString().split('T')[0],
      horaInicio: form.horaInicio,
      horaFin: form.horaFin
    })

    // Verificar si hay alertas
    if (resultado.alertas && resultado.alertas.length > 0) {
      const mensajesAlerta = resultado.alertas.map(a => {
        return a.mensaje.replace(/[⚠️🌙📅]/g, '').trim()
      }).join('\n\n')

      const confirmar = window.confirm(
        `ALERTAS DETECTADAS:\n\n${mensajesAlerta}\n\n¿Desea continuar y crear el turno de todos modos?`
      )

      if (!confirmar) {
        await api.del(`/asignaciones/${resultado.asignacion.id}`)
        return
      }
    }

    setModalOpen(false)
    cargarAsignaciones()

  } catch (err) {
    console.error('Error guardando:', err)
    alert(err.message || 'Error al guardar la asignación')
  }
}

  const eliminarAsignacion = async (asignacionId) => {
    if (!confirm('¿Eliminar esta asignación?')) return
    try {
      await api.del(`/asignaciones/${asignacionId}`)
      cargarAsignaciones()
    } catch (err) {
      console.error('Error eliminando:', err)
    }
  }
  const copiarSemana = async () => {
    if (!confirm('¿Copiar todos los turnos de esta semana a la semana siguiente?')) return

    setCopiandoSemana(true)
    try {
      const fechaOrigenInicio = weekDates[0].toISOString().split('T')[0]
      const fechaOrigenFin = weekDates[6].toISOString().split('T')[0]

      // Calcular semana siguiente
      const proximaSemana = new Date(weekDates[0])
      proximaSemana.setDate(proximaSemana.getDate() + 7)
      const fechaDestinoInicio = proximaSemana.toISOString().split('T')[0]

      const resultado = await api.post('/asignaciones/copiar-semana', {
        fechaOrigenInicio,
        fechaOrigenFin,
        fechaDestinoInicio
      })

      alert(`✅ ${resultado.mensaje}`)
      setSemanaOffset(semanaOffset + 1) // Ir a la semana copiada
    } catch (err) {
      console.error('Error copiando semana:', err)
      alert('❌ Error al copiar semana')
    }
    setCopiandoSemana(false)
  }
  const guardarComoPlantilla = async (e) => {
    e.preventDefault()

    if (!formPlantilla.nombre.trim()) {
      alert('El nombre es obligatorio')
      return
    }

    setGuardandoPlantilla(true)
    try {
      const fechaInicio = weekDates[0].toISOString().split('T')[0]
      const fechaFin = weekDates[6].toISOString().split('T')[0]

      const resultado = await api.post('/plantillas/crear-desde-semana', {
        nombre: formPlantilla.nombre,
        descripcion: formPlantilla.descripcion,
        centroId: centroSeleccionado.id,
        fechaInicio,
        fechaFin
      })

      alert(`✅ Plantilla "${formPlantilla.nombre}" guardada`)
      setModalPlantillaOpen(false)
      setFormPlantilla({ nombre: '', descripcion: '' })
    } catch (err) {
      console.error('Error guardando plantilla:', err)
      alert(err.error || '❌ Error al guardar plantilla')
    }
    setGuardandoPlantilla(false)
  }
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

    const fechaStr = fecha?.toISOString().split('T')[0];
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
    const fechaStr = fecha.toISOString().split('T')[0]
    return asignaciones.filter(a => a.fecha.split('T')[0] === fechaStr)
  }

  const formatFecha = (date) => {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
  }

  if (loading) {
    return <div className="p-6 text-center text-slate-500">Cargando...</div>
  }

  if (centros.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-100">
          <p className="text-slate-500 text-lg mb-4">No hay centros de trabajo</p>
          <p className="text-slate-400">Primero crea un cliente y un centro de trabajo en la sección "Clientes"</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Planificación</h1>
          <p className="text-slate-500">Asigna trabajadores a los turnos</p>
        </div>

        <div className="flex flex-wrap gap-3">
          {/* Selector de centro con búsqueda */}
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Buscar empresa o centro..."
              value={busquedaCentro}
              onChange={(e) => setBusquedaCentro(e.target.value)}
              className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {busquedaCentro && (
              <div className="absolute top-full mt-2 w-full bg-white border border-slate-200 rounded-xl shadow-lg max-h-96 overflow-y-auto z-50">
                {(() => {
                  // Agrupar centros por cliente
                  const clientesAgrupados = centros.reduce((acc, centro) => {
                    const clienteId = centro.clienteId;
                    if (!acc[clienteId]) {
                      acc[clienteId] = {
                        cliente: centro.cliente,
                        centros: []
                      };
                    }
                    acc[clienteId].centros.push(centro);
                    return acc;
                  }, {});

                  // Filtrar por búsqueda
                  const resultados = Object.values(clientesAgrupados).filter(grupo => {
                    const nombreCliente = grupo.cliente?.nombre?.toLowerCase() || '';
                    const nombresCentros = grupo.centros.map(c => c.nombre.toLowerCase()).join(' ');
                    const busqueda = busquedaCentro.toLowerCase();
                    return nombreCliente.includes(busqueda) || nombresCentros.includes(busqueda);
                  });

                  if (resultados.length === 0) {
                    return (
                      <div className="p-4 text-center text-slate-500">
                        No se encontraron resultados
                      </div>
                    );
                  }

                  return resultados.map(grupo => (
                    <div key={grupo.cliente?.id} className="border-b border-slate-100 last:border-0">
                      <div
                        className="p-3 bg-slate-50 font-medium text-slate-700 cursor-pointer hover:bg-slate-100"
                        onClick={() => setClienteExpandido(clienteExpandido === grupo.cliente?.id ? null : grupo.cliente?.id)}
                      >
                        {grupo.cliente?.nombre} ({grupo.centros.length} {grupo.centros.length === 1 ? 'centro' : 'centros'})
                      </div>
                      {(clienteExpandido === grupo.cliente?.id || grupo.centros.length === 1) && (
                        <div className="bg-white">
                          {grupo.centros.map(centro => (
                            <div
                              key={centro.id}
                              onClick={() => {
                                setCentroSeleccionado(centro);
                                setBusquedaCentro('');
                                setClienteExpandido(null);
                              }}
                              className={`p-3 pl-6 cursor-pointer hover:bg-blue-50 ${centroSeleccionado?.id === centro.id ? 'bg-blue-100 text-blue-700 font-medium' : 'text-slate-600'
                                }`}
                            >
                              {centro.nombre}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ));
                })()}
              </div>
            )}
          </div>

          {/* Centro seleccionado actual */}
          {centroSeleccionado && !busquedaCentro && (
            <div className="px-4 py-2 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 font-medium">
              {centroSeleccionado.cliente?.nombre} - {centroSeleccionado.nombre}
            </div>
          )}

          {/* Navegación semanas */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSemanaOffset(s => s - 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              ←
            </button>
            <button
              onClick={() => setSemanaOffset(0)}
              className="px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 text-sm"
            >
              Hoy
            </button>
            <button
              onClick={() => setSemanaOffset(s => s + 1)}
              className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              →
            </button>
          </div>

          <button
            onClick={copiarSemana}
            disabled={copiandoSemana}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-sm font-medium"
          >
            {copiandoSemana ? 'Copiando...' : 'Copiar'}
          </button>
          
          <GenerarAsignacionesAutomaticas
  onAsignacionesGeneradas={cargarAsignaciones}
  api={api}
/>
        </div>
      </div>

      {/* Info del centro */}
      {centroSeleccionado && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-bold text-blue-800">{centroSeleccionado.nombre}</h2>
              <p className="text-sm text-blue-600">{centroSeleccionado.cliente?.nombre}</p>
            </div>
            <div className="text-right text-sm text-blue-600">
              <p>Horario: {centroSeleccionado.horarioApertura || '06:00'} - {centroSeleccionado.horarioCierre || '22:00'}</p>
            </div>
          </div>
        </div>
      )}



      {/* Calendario semanal */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-slate-50">
                <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600 w-20">Semana</th>
                {weekDates.map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isWeekend = i >= 5
                  return (
                    <th
                      key={i}
                      className={`text-center py-3 px-2 text-sm font-semibold min-w-[120px] ${isToday ? 'bg-blue-100 text-blue-700' :
                          isWeekend ? 'bg-slate-100 text-slate-500' : 'text-slate-600'
                        }`}
                    >
                      <div>{diasSemana[i]}</div>
                      <div className="text-lg font-bold">{date.getDate()}</div>
                      <div className="text-xs font-normal">{formatFecha(date)}</div>
                    </th>
                  )
                })}
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-slate-100">
                <td className="py-4 px-4 align-top">
                  <span className="text-sm font-medium text-slate-600">Turnos</span>
                </td>
                {weekDates.map((date, i) => {
                  const asignacionesDia = getAsignacionesDia(date)
                  const isWeekend = i >= 5
                  return (
                    <td
  key={i}
  className={`py-2 px-2 align-top border-l border-slate-100 ${isWeekend ? 'bg-slate-50' : ''}`}
>
  <div className="space-y-2 min-h-[100px]">
    {asignacionesDia.map(asig => {
      const estaCancelado = asig.estado === 'CANCELADO';
      const color = estaCancelado ? '#9ca3af' : getColorTrabajador(asig.trabajadorId, date);
      
      return (
        <div
          key={asig.id}
          className={`rounded-lg p-2 text-xs group relative ${estaCancelado ? 'opacity-50' : ''}`}
          style={{
            borderLeft: `4px solid ${color}`,
            backgroundColor: color === '#ef4444' ? '#fee2e2' :
              color === '#eab308' ? '#fef3c7' : 
              color === '#9ca3af' ? '#f3f4f6' : '#dbeafe',
            borderTop: `1px solid ${color}`,
            borderRight: `1px solid ${color}`,
            borderBottom: `1px solid ${color}`
          }}
        >
                            <button
                              onClick={() => eliminarAsignacion(asig.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                            <p className="font-medium text-blue-800 truncate">
                              {asig.trabajador?.nombre} {asig.trabajador?.apellidos?.split(' ')[0]}
                            </p>
                            <p className="text-blue-600">
                              {asig.horaInicio} - {asig.horaFin}
                            </p>
                          </div>
                          
                        );})}
                        <button
                          onClick={() => abrirModal(date)}
                          className="w-full py-2 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors text-sm"
                        >
                          + Añadir
                        </button>
                      </div>
                    </td>
                  )
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-600 bg-slate-50 p-4 rounded-xl">
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 bg-blue-100 border-l-4 border-blue-500 rounded"></span>
          <strong>Disponible</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 bg-yellow-100 border-l-4 border-yellow-500 rounded"></span>
          <strong>Baja Pendiente</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 bg-red-100 border-l-4 border-red-500 rounded"></span>
          <strong>Baja Confirmada - Requiere Suplencia</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-slate-100 rounded"></span>
          Fin de semana
        </span>
      </div>
      {/* Semanas Archivadas */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-800">Centros - Estado Actual</h2>
        </div>

        <div className="space-y-3">
          {(() => {
            // Agrupar centros por cliente
            const clientesAgrupados = {};

            // Primero, identificar qué centros tienen alertas
            const centrosConAlertas = new Set();
            const centrosUrgentes = new Set();

            alertasGlobales.forEach(alerta => {
              alerta.asignaciones.forEach(asig => {
                centrosConAlertas.add(asig.centroId);
                if (alerta.urgente) {
                  centrosUrgentes.add(asig.centroId);
                }
              });
            });

            // Agrupar todos los centros
            centros.forEach(centro => {
              const clienteId = centro.clienteId;
              if (!clientesAgrupados[clienteId]) {
                clientesAgrupados[clienteId] = {
                  cliente: centro.cliente,
                  centros: []
                };
              }

              let estado = 'verde';
              if (centrosUrgentes.has(centro.id)) {
                estado = 'rojo';
              } else if (centrosConAlertas.has(centro.id)) {
                estado = 'amarillo';
              }

              clientesAgrupados[clienteId].centros.push({
                ...centro,
                estado
              });
            });

            return Object.values(clientesAgrupados).map(grupo => {
              const tieneRojo = grupo.centros.some(c => c.estado === 'rojo');
              const tieneAmarillo = grupo.centros.some(c => c.estado === 'amarillo');
              const colorCliente = tieneRojo ? 'rojo' : tieneAmarillo ? 'amarillo' : 'verde';

              const bgColor = colorCliente === 'rojo' ? 'bg-red-50 border-red-200' :
                colorCliente === 'amarillo' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-green-50 border-green-200';

              const textColor = colorCliente === 'rojo' ? 'text-red-800' :
                colorCliente === 'amarillo' ? 'text-yellow-800' :
                  'text-green-800';

              return (
                <div key={grupo.cliente?.id} className={`border rounded-xl overflow-hidden ${bgColor}`}>
                  <div
                    className={`p-4 cursor-pointer hover:opacity-80 transition-opacity ${textColor}`}
                    onClick={() => setClienteExpandido(clienteExpandido === grupo.cliente?.id ? null : grupo.cliente?.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{clienteExpandido === grupo.cliente?.id ? '▼' : ''}</span>
                        <div>
                          <p className="font-bold text-lg">{grupo.cliente?.nombre}</p>
                          <p className="text-sm opacity-75">{grupo.centros.length} {grupo.centros.length === 1 ? 'centro' : 'centros'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colorCliente === 'rojo' ? 'bg-red-200 text-red-900' :
                            colorCliente === 'amarillo' ? 'bg-yellow-200 text-yellow-900' :
                              'bg-green-200 text-green-900'
                          }`}>
                          {colorCliente === 'rojo' ? 'Requiere atención' :
                            colorCliente === 'amarillo' ? 'Pendiente' :
                              'Operativo'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {clienteExpandido === grupo.cliente?.id && (
                    <div className="border-t bg-white">
                      {grupo.centros.map(centro => {
                        const bgCentro = centro.estado === 'rojo' ? 'bg-red-50 hover:bg-red-100' :
                          centro.estado === 'amarillo' ? 'bg-yellow-50 hover:bg-yellow-100' :
                            'bg-green-50 hover:bg-green-100';

                        const textCentro = centro.estado === 'rojo' ? 'text-red-700' :
                          centro.estado === 'amarillo' ? 'text-yellow-700' :
                            'text-green-700';

                        return (
                          <div
                            key={centro.id}
                            className={`p-3 px-6 ${bgCentro} ${textCentro} transition-colors`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium">{centro.nombre}</span>
                              <span className="text-sm">
                                {centro.estado === 'rojo' ? 'Baja confirmada' :
                                  centro.estado === 'amarillo' ? 'Baja pendiente' : ''}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
      {/* Modal nueva asignación */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`Nuevo turno - ${diaSeleccionado?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      >
        <form onSubmit={guardarAsignacion} className="space-y-4">
          <div>


            {/* Trabajadores habituales */}
            {(() => {
              const habituales = trabajadores.filter(t =>
                t.centrosAsignados?.some(ca => ca.centroId === centroSeleccionado?.id && ca.esHabitual)
              );

              console.log('Centro seleccionado:', centroSeleccionado?.id);
              console.log('Trabajadores:', trabajadores.map(t => ({
                nombre: t.nombre,
                centros: t.centrosAsignados
              })));
              console.log('Habituales encontrados:', habituales);

              if (habituales.length > 0) {
                return (
                  <>
                    <label className="block text-xs font-medium text-blue-600 mt-3 mb-1">
                      Trabajadores Habituales
                    </label>
                    <select
                      value={form.trabajadorId}
                      onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                    >
                      <option value="">Seleccionar...</option>
                      {habituales.map(t => {
  const ausencia = getAusencia(t.id, diaSeleccionado);
  
  // Si tiene ausencia APROBADA, no mostrar
  if (ausencia?.estado === 'APROBADA') return null;
  
  // Determinar color de fondo
  let backgroundColor = '#dbeafe'; // Azul claro por defecto (disponible)
  
  if (ausencia?.estado === 'PENDIENTE') {
    backgroundColor = '#fef3c7'; // Amarillo claro (pendiente)
  }
  
  // Texto del estado
  const estadoTexto = ausencia?.estado === 'PENDIENTE' 
    ? ` - ⚠️ ${ausencia.tipoAusencia?.nombre || 'Pendiente'}` 
    : '';
  
  return (
    <option
      key={t.id}
      value={t.id}
      style={{
        backgroundColor: backgroundColor
      }}
    >
      {t.nombre} {t.apellidos}{estadoTexto}
    </option>
  );
})}
                    </select>
                  </>
                );
              }
              return null;
            })()}

            {/* Otros trabajadores */}
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Otros Trabajadores
            </label>
            <select
  value={form.trabajadorId}
  onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })}
  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  required={trabajadores.filter(t => t.centrosAsignados?.some(ca => ca.centroId === centroSeleccionado?.id && ca.esHabitual)).length === 0}
>
  <option value="">Seleccionar...</option>
  {trabajadores
    .filter(t => !t.centrosAsignados?.some(ca => ca.centroId === centroSeleccionado?.id && ca.esHabitual))
    .map(t => {
      const ausencia = getAusencia(t.id, diaSeleccionado);
      
      // Si tiene ausencia APROBADA, no mostrar
      if (ausencia?.estado === 'APROBADA') return null;
      
      // Determinar color de fondo
      let backgroundColor = '#dbeafe'; // Azul claro por defecto (disponible)
      
      if (ausencia?.estado === 'PENDIENTE') {
        backgroundColor = '#fef3c7'; // Amarillo claro (pendiente)
      }
      
      // Texto del estado
      const estadoTexto = ausencia?.estado === 'PENDIENTE' 
        ? ` - ⚠️ ${ausencia.tipoAusencia?.nombre || 'Pendiente'}` 
        : '';
      
      return (
        <option
          key={t.id}
          value={t.id}
          style={{
            backgroundColor: backgroundColor          }}
        >
          {t.nombre} {t.apellidos}{estadoTexto}
        </option>
      );
    })}
</select>
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora inicio *</label>
              <input
  type="time"
  value={form.horaInicio}
  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
  min={centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' ? '00:00' : centroSeleccionado?.horariosLimpieza?.[0]?.inicio || '06:00'}
  max={centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' ? '23:59' : centroSeleccionado?.horariosLimpieza?.[0]?.fin || '22:00'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
  {centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' 
    ? 'Horario flexible' 
    : `Rango: ${centroSeleccionado?.horariosLimpieza?.[0]?.inicio || '06:00'} - ${centroSeleccionado?.horariosLimpieza?.[0]?.fin || '22:00'}`
  }
</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora fin *</label>
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                min={centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' ? '00:00' : centroSeleccionado?.horariosLimpieza?.[0]?.inicio || '06:00'}
  max={centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' ? '23:59' : centroSeleccionado?.horariosLimpieza?.[0]?.fin || '22:00'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
  {centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' 
    ? 'Horario flexible' 
    : `Rango: ${centroSeleccionado?.horariosLimpieza?.[0]?.inicio || '06:00'} - ${centroSeleccionado?.horariosLimpieza?.[0]?.fin || '22:00'}`
  }
</p>
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-3 text-sm text-slate-600">
            <p><strong>Centro:</strong> {centroSeleccionado?.nombre}</p>
            <p><strong>Fecha:</strong> {diaSeleccionado?.toLocaleDateString('es-ES')}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
            >
              Crear Turno
            </button>
          </div>
        </form>
      </Modal>
      {/* Modal guardar plantilla */}
      {modalPlantillaOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-slate-800">Guardar como Plantilla</h2>
              <button
                onClick={() => setModalPlantillaOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
              >
                &times;
              </button>
            </div>
            <form onSubmit={guardarComoPlantilla} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nombre de la plantilla *
                </label>
                <input
                  type="text"
                  value={formPlantilla.nombre}
                  onChange={(e) => setFormPlantilla({ ...formPlantilla, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Ej: Semana típica UVESA"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formPlantilla.descripcion}
                  onChange={(e) => setFormPlantilla({ ...formPlantilla, descripcion: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows="3"
                  placeholder="Describe esta plantilla..."
                />
              </div>

              <div className="bg-blue-50 rounded-lg p-3 text-sm text-slate-600">
                <p><strong>Centro:</strong> {centroSeleccionado?.nombre}</p>
                <p><strong>Periodo:</strong> {weekDates[0].toLocaleDateString('es-ES')} - {weekDates[6].toLocaleDateString('es-ES')}</p>
                <p><strong>Turnos:</strong> {asignaciones.length}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalPlantillaOpen(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPlantilla}
                  className="flex-1 px-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 disabled:opacity-50"
                >
                  {guardandoPlantilla ? 'Guardando...' : ' Guardar Plantilla'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}