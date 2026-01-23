import React, { useState, useEffect } from 'react'
import Plantillas from './pages/Plantillas'
import Ausencias from './pages/Ausencias'
import Informes from './pages/Informes';
import HorariosFijos from './pages/HorariosFijos';
import GenerarAsignacionesAutomaticas from './pages/GenerarAsignacionesAutomaticas';
import { useAusencias } from './hooks/useAusencias';


const API_URL = import.meta.env.VITE_API_URL || 'https://grupo-rubio-app-production.up.railway.app/api';

// Hook para llamadas a la API
function useApi() {
  const [token, setToken] = useState(localStorage.getItem('token'))

  const headers = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` })
  }

  const login = async (email, password) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    })
    const data = await res.json()
    if (data.token) {
      localStorage.setItem('token', data.token)
      setToken(data.token)
    }
    return data
  }

  const logout = () => {
    localStorage.removeItem('token')
    setToken(null)
  }

  const get = async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, { headers })
    const data = await res.json()
    if (!res.ok) {
      throw data
    }
    return data
  }

  const post = async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) {
      throw data
    }
    return data
  }

  const put = async (endpoint, body) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body)
    })
    const data = await res.json()
    if (!res.ok) {
      throw data
    }
    return data
  }

  const del = async (endpoint) => {
    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'DELETE',
      headers
    })
    const data = await res.json()
    if (!res.ok) {
      throw data
    }
    return data
  }

  return { token, login, logout, get, post, put, del }
}

// Componente Login
function LoginPage({ onLogin, api }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)


  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api.login(email, password)
      if (data.token) {
        onLogin(data.user)
      } else {
        setError(data.error || 'Error al iniciar sesión')
      }
    } catch (err) {
      setError('Error de conexión con el servidor')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-2xl shadow-lg mb-4 p-2">
  <img 
    src="/logo-grupo-rubio-2.png" 
    alt="Grupo Rubio" 
    className="w-full h-full object-contain"
  />
</div>
          <h1 className="text-2xl font-bold text-white">Grupo Rubio</h1>
          <p className="text-blue-200/70 text-sm mt-1">Sistema de Gestión de Horas</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-blue-200/80 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="tu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-blue-200/80 mb-2">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-400"
              placeholder="********"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/20 border border-red-500/30 rounded-xl px-4 py-3 text-red-200 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-500 transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Iniciar Sesión'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center text-blue-200/50 text-xs">
          <p>Usuarios de prueba:</p>
          <p className="mt-1">admin@gruporubio.net / admin123</p>
        </div>
      </div>
    </div>
  )
}

// Modal genérico
function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}

// ========================================
// PÁGINA DE PLANIFICACIÓN
// ========================================
function PlanificacionPage({ api }) {
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
          <button
            onClick={() => setModalPlantillaOpen(true)}
            className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm font-medium"
          >
            Guardar
          </button>
          <GenerarAsignacionesAutomaticas 
              onAsignacionesGeneradas={() => {
                cargarAsignaciones();
              }}
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
                min={centroSeleccionado?.horarioLimpiezaInicio || centroSeleccionado?.horarioApertura || '06:00'}
                max={centroSeleccionado?.horarioLimpiezaFin || centroSeleccionado?.horarioCierre || '22:00'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Rango: {centroSeleccionado?.horarioLimpiezaInicio || centroSeleccionado?.horarioApertura || '06:00'} - {centroSeleccionado?.horarioLimpiezaFin || centroSeleccionado?.horarioCierre || '22:00'}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Hora fin *</label>
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                min={centroSeleccionado?.horarioLimpiezaInicio || centroSeleccionado?.horarioApertura || '06:00'}
                max={centroSeleccionado?.horarioLimpiezaFin || centroSeleccionado?.horarioCierre || '22:00'}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-xs text-slate-500 mt-1">
                Rango: {centroSeleccionado?.horarioLimpiezaInicio || centroSeleccionado?.horarioApertura || '06:00'} - {centroSeleccionado?.horarioLimpiezaFin || centroSeleccionado?.horarioCierre || '22:00'}
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

function TrabajadoresPage({ api }) {
  const [trabajadores, setTrabajadores] = useState([])
  const [categorias, setCategorias] = useState([])
  const [centros, setCentros] = useState([])
  const [centrosSeleccionados, setCentrosSeleccionados] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editando, setEditando] = useState(null)
  const [busqueda, setBusqueda] = useState('')
  const [mostrarInactivos, setMostrarInactivos] = useState(false) // NUEVO

  const [form, setForm] = useState({
    nombre: '',
    apellidos: '',
    dni: '',
    telefono: '',
    email: '',
    categoriaId: '',
    tipoContrato: 'INDEFINIDO',
    horasContrato: 40,
    fechaAlta: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const [trabData, catData, centrosData] = await Promise.all([
        api.get('/trabajadores'),
        api.get('/categorias'),
        api.get('/centros')
      ])
      setTrabajadores(trabData)
      setCategorias(catData)
      setCentros(centrosData)
    } catch (err) {
      console.error('Error cargando datos:', err)
    }
    setLoading(false)
  }

  const abrirModal = (trabajador = null) => {
    if (trabajador) {
      setEditando(trabajador)
      setForm({
        nombre: trabajador.nombre,
        apellidos: trabajador.apellidos,
        dni: trabajador.dni,
        telefono: trabajador.telefono || '',
        email: trabajador.email || '',
        categoriaId: trabajador.categoriaId,
        tipoContrato: trabajador.tipoContrato,
        horasContrato: trabajador.horasContrato,
        fechaAlta: trabajador.fechaAlta?.split('T')[0] || ''
      })
      const centrosHabituales = trabajador.centrosAsignados
        ?.filter(ca => ca.esHabitual)
        .map(ca => ca.centroId) || []
      setCentrosSeleccionados(centrosHabituales)
    } else {
      setEditando(null)
      setForm({
        nombre: '',
        apellidos: '',
        dni: '',
        telefono: '',
        email: '',
        categoriaId: categorias[0]?.id || '',
        tipoContrato: 'INDEFINIDO',
        horasContrato: 40,
        fechaAlta: new Date().toISOString().split('T')[0]
      })
      setCentrosSeleccionados([])
    }
    setModalOpen(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    try {
      const datos = {
        ...form,
        categoriaId: parseInt(form.categoriaId),
        horasContrato: parseFloat(form.horasContrato),
        fechaAlta: new Date(form.fechaAlta)
      }

      let trabajadorId
      if (editando) {
        await api.put(`/trabajadores/${editando.id}`, datos)
        trabajadorId = editando.id
      } else {
        const resultado = await api.post('/trabajadores', datos)
        trabajadorId = resultado.id
      }

      // Guardar centros habituales
      if (editando) {
        const relacionesActuales = editando.centrosAsignados || []
        for (const rel of relacionesActuales) {
          await api.del(`/trabajador-centro/${rel.id}`)
        }
      }

      for (const centroId of centrosSeleccionados) {
        await api.post('/trabajador-centro', {
          trabajadorId: trabajadorId,
          centroId: centroId,
          esHabitual: true
        })
      }

      setModalOpen(false)
      cargarDatos()
    } catch (err) {
      console.error('Error guardando:', err);
      const mensaje = err.error || err.message || 'Error desconocido';
      alert('❌ ' + mensaje);
    }
  }
    // NUEVO: Dar de baja
    const darDeBaja = async (trabajador) => {
      const motivo = prompt(`¿Motivo de la baja de ${trabajador.nombre} ${trabajador.apellidos}?`)
      if (!motivo) return

      if (!confirm(`¿Seguro que quieres dar de baja a ${trabajador.nombre} ${trabajador.apellidos}?\n\nEsto NO eliminará el trabajador, solo lo marcará como inactivo.`)) {
        return
      }

      try {
        await api.put(`/trabajadores/${trabajador.id}/dar-baja`, { motivo })
        alert('Trabajador dado de baja correctamente')
        cargarDatos()
      } catch (err) {
        console.error('Error guardando:', err);
        const mensaje = err.error || err.message || 'Error desconocido';
        alert('❌ ' + mensaje);
      }
    }

    // NUEVO: Reactivar
    const reactivar = async (trabajador) => {
      if (!confirm(`¿Reactivar a ${trabajador.nombre} ${trabajador.apellidos}?`)) {
        return
      }

      try {
        await api.put(`/trabajadores/${trabajador.id}/reactivar`)
        alert('Trabajador reactivado correctamente')
        cargarDatos()
      } catch (err) {
        console.error('Error guardando:', err);
        const mensaje = err.error || err.message || 'Error desconocido';
        alert('❌ ' + mensaje);
      }
    }

    // FILTRADO: incluir/excluir inactivos
    const trabajadoresFiltrados = trabajadores
      .filter(t => mostrarInactivos || t.activo) // Filtrar por activo/inactivo
      .filter(t => `${t.nombre} ${t.apellidos}`.toLowerCase().includes(busqueda.toLowerCase()))

    const trabajadoresActivos = trabajadores.filter(t => t.activo).length
    const trabajadoresInactivos = trabajadores.filter(t => !t.activo).length

    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Trabajadores</h1>
            <p className="text-slate-500">
              {trabajadoresActivos} activos • {trabajadoresInactivos} inactivos
            </p>
          </div>
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
          >
            <span className="text-xl">+</span> Nuevo Trabajador
          </button>
        </div>

        {/* FILTROS */}
        <div className="mb-4 flex gap-4">
          <input
            type="text"
            placeholder="Buscar trabajador..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="flex-1 max-w-md px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
              className="rounded border-slate-300"
            />
            <span className="text-sm text-slate-700">Mostrar inactivos</span>
          </label>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : trabajadoresFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500 mb-4">
              {mostrarInactivos ? 'No hay trabajadores inactivos' : 'No hay trabajadores registrados'}
            </p>
            {!mostrarInactivos && (
              <button
                onClick={() => abrirModal()}
                className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
              >
                Añadir el primero
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trabajadoresFiltrados.map(t => (
              <div
                key={t.id}
                className={`bg-white rounded-2xl p-5 shadow-sm border transition-all ${t.activo
                    ? 'border-slate-100 hover:shadow-md hover:border-blue-200'
                    : 'border-red-200 bg-red-50'
                  }`}
              >
                {/* BADGE INACTIVO */}
                {!t.activo && (
                  <div className="mb-3">
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                      INACTIVO
                    </span>
                  </div>
                )}

                <div
                  onClick={() => abrirModal(t)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${t.activo ? 'bg-gradient-to-br from-blue-500 to-cyan-400' : 'bg-gray-400'
                      }`}>
                      {t.nombre.charAt(0)}{t.apellidos.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800">{t.nombre} {t.apellidos}</h3>
                      <p className="text-sm text-slate-500">{t.categoria?.nombre || 'Sin categoría'}</p>
                    </div>
                  </div>
                  <div className="text-sm text-slate-500 space-y-1">
                    <p>{t.telefono || 'Sin teléfono'}</p>
                    <p>{t.tipoContrato} - {t.horasContrato}h/sem</p>
                    <p>{t.dni}</p>
                  </div>
                </div>

                {/* BOTONES BAJA/REACTIVAR */}
                <div className="mt-4 pt-4 border-t border-slate-200 flex gap-2">
                  {t.activo ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        darDeBaja(t)
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      Dar de Baja
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        reactivar(t)
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      Reactivar
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      abrirModal(t)
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    Editar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Trabajador' : 'Nuevo Trabajador'}>
          <form onSubmit={guardar} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Apellidos *</label>
                <input
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">DNI *</label>
                <input
                  type="text"
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Categoría *</label>
                <select
                  value={form.categoriaId}
                  onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Contrato *</label>
                <select
                  value={form.tipoContrato}
                  onChange={(e) => setForm({ ...form, tipoContrato: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="INDEFINIDO">Indefinido</option>
                  <option value="TEMPORAL">Temporal</option>
                  <option value="OBRA_SERVICIO">Obra y Servicio</option>
                  <option value="ETT">ETT</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Horas/semana *</label>
                <input
                  type="number"
                  value={form.horasContrato}
                  onChange={(e) => setForm({ ...form, horasContrato: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Fecha Alta *</label>
                <input
                  type="date"
                  value={form.fechaAlta}
                  onChange={(e) => setForm({ ...form, fechaAlta: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Empresas/Centros Habituales
              </label>
              <div className="border border-slate-200 rounded-lg p-3 max-h-48 overflow-y-auto">
                {centros.length === 0 ? (
                  <p className="text-sm text-slate-400">No hay centros disponibles</p>
                ) : (
                  centros.map(centro => (
                    <label key={centro.id} className="flex items-center gap-2 py-2 hover:bg-slate-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={centrosSeleccionados.includes(centro.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setCentrosSeleccionados([...centrosSeleccionados, centro.id])
                          } else {
                            setCentrosSeleccionados(centrosSeleccionados.filter(id => id !== centro.id))
                          }
                        }}
                        className="rounded border-slate-300"
                      />
                      <span className="text-sm text-slate-700">
                        {centro.cliente?.nombre} - {centro.nombre}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Marca los centros donde este trabajador suele trabajar habitualmente
              </p>
            </div>
            {/* ✅ HORARIOS FIJOS */}
            {editando && (
              <div className="border-t border-slate-200 pt-4 mt-4">
                <HorariosFijos trabajadorId={editando.id} />
              </div>
            )}

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
                {editando ? 'Guardar Cambios' : 'Crear Trabajador'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    )
  }

 // Página de Clientes
function ClientesPage({ api }) {
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalCentroOpen, setModalCentroOpen] = useState(false)
  const [centroEditando, setCentroEditando] = useState(null)
  const [editando, setEditando] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [error, setError] = useState('') // ✅ NUEVO: Estado para errores
  const [errorCentro, setErrorCentro] = useState('') // ✅ NUEVO: Para errores de centro

  const [form, setForm] = useState({
    nombre: '',
    cif: '',
    direccion: '',
    telefono: '',
    contactoNombre: '',
    contactoEmail: ''
  })

  const [formCentro, setFormCentro] = useState({
    nombre: '',
    direccion: '',
    horarioApertura: '06:00',
    horarioCierre: '22:00',
    horarioLimpiezaInicio: '',
    horarioLimpiezaFin: '',
    flexibilidadHoraria: 'FLEXIBLE',
    tipoServicio: 'FRECUENTE'
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const data = await api.get('/clientes')
      setClientes(data)
    } catch (err) {
      console.error('Error cargando clientes:', err)
    }
    setLoading(false)
  }

  const abrirModal = (cliente = null) => {
    setError('') // ✅ NUEVO: Limpiar error al abrir modal
    if (cliente) {
      setEditando(cliente)
      setForm({
        nombre: cliente.nombre,
        cif: cliente.cif,
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        contactoNombre: cliente.contactoNombre || '',
        contactoEmail: cliente.contactoEmail || ''
      })
    } else {
      setEditando(null)
      setForm({
        nombre: '',
        cif: '',
        direccion: '',
        telefono: '',
        contactoNombre: '',
        contactoEmail: ''
      })
    }
    setModalOpen(true)
  }

  const abrirModalCentro = (cliente) => {
    setErrorCentro('') // ✅ NUEVO: Limpiar error al abrir modal
    setClienteSeleccionado(cliente)
    setCentroEditando(null)
    setFormCentro({
      nombre: '',
      direccion: '',
      horarioApertura: '06:00',
      horarioCierre: '22:00',
      horarioLimpiezaInicio: '',
      horarioLimpiezaFin: '',
      flexibilidadHoraria: 'FLEXIBLE',
      tipoServicio: 'FRECUENTE'
    })
    setModalCentroOpen(true)
  }

  const abrirModalEditarCentro = (centro) => {
    setErrorCentro('') // ✅ NUEVO: Limpiar error al abrir modal
    setCentroEditando(centro)
    setFormCentro({
      nombre: centro.nombre,
      direccion: centro.direccion || '',
      horarioApertura: centro.horarioApertura || '06:00',
      horarioCierre: centro.horarioCierre || '22:00',
      horarioLimpiezaInicio: centro.horarioLimpiezaInicio || '',
      horarioLimpiezaFin: centro.horarioLimpiezaFin || '',
      flexibilidadHoraria: centro.flexibilidadHoraria || 'FLEXIBLE',
      tipoServicio: centro.tipoServicio || 'FRECUENTE'
    })
    setModalCentroOpen(true)
  }

  const guardar = async (e) => {
    e.preventDefault()
    setError('') // ✅ NUEVO: Limpiar error previo
    
    try {
      if (editando) {
        await api.put(`/clientes/${editando.id}`, form)
      } else {
        await api.post('/clientes', form)
      }
      setModalOpen(false)
      cargarDatos()
    } catch (err) {
      console.error('Error guardando:', err)
      // ✅ NUEVO: Mostrar error en pantalla sin alert
      const mensaje = err.error || err.message || 'Error al guardar cliente'
      setError(mensaje)
    }
  }

  const guardarCentro = async (e) => {
    e.preventDefault()
    setErrorCentro('') // ✅ NUEVO: Limpiar error previo
    
    try {
      const datos = {
        ...formCentro,
        clienteId: clienteSeleccionado?.id
      }

      if (centroEditando) {
        await api.put(`/centros/${centroEditando.id}`, datos)
      } else {
        await api.post('/centros', datos)
      }
      
      setModalCentroOpen(false)
      cargarDatos()
    } catch (err) {
      console.error('Error guardando centro:', err)
      // ✅ NUEVO: Mostrar error en pantalla sin alert
      const mensaje = err.error || err.message || 'Error al guardar centro'
      setErrorCentro(mensaje)
    }
  }


    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
            <p className="text-slate-500">{clientes.length} clientes registrados</p>
          </div>
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
          >
            <span className="text-xl">+</span> Nuevo Cliente
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-500">Cargando...</div>
        ) : clientes.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <p className="text-slate-500 mb-4">No hay clientes registrados</p>
            <button
              onClick={() => abrirModal()}
              className="px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
            >
              Añadir el primero
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {clientes.map(cliente => (
              <div key={cliente.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                <div className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-400 rounded-xl flex items-center justify-center text-white font-bold">
                        {cliente.nombre.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800">{cliente.nombre}</h3>
                        <p className="text-sm text-slate-500">CIF: {cliente.cif}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-600">{cliente.centrosTrabajo?.length || 0}</p>
                        <p className="text-xs text-slate-500">centros</p>
                      </div>
                      <button
                        onClick={() => abrirModal(cliente)}
                        className="px-3 py-1 text-sm bg-slate-100 rounded-lg hover:bg-slate-200"
                      >
                        Editar
                      </button>
                    </div>
                  </div>

                  {cliente.centrosTrabajo && cliente.centrosTrabajo.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-600 mb-2">Centros de trabajo:</p>
                      <div className="flex flex-wrap gap-2">
                        {cliente.centrosTrabajo.map(centro => (
                          <div key={centro.id} className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                            <span>{centro.nombre}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                abrirModalEditarCentro(centro);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              ✏️
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    onClick={() => abrirModalCentro(cliente)}
                    className="mt-4 text-sm text-blue-500 hover:text-blue-700"
                  >
                    + Añadir centro de trabajo
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal Cliente */}
<Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Cliente' : 'Nuevo Cliente'}>
  <form onSubmit={guardar} className="space-y-4">
    {/* ✅ NUEVO: Mostrar error si existe */}
    {error && (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <p className="font-medium">Error al guardar</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre empresa *</label>
      <input
        type="text"
        value={form.nombre}
        onChange={(e) => setForm({ ...form, nombre: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        required
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">CIF *</label>
        <input
          type="text"
          value={form.cif}
          onChange={(e) => setForm({ ...form, cif: e.target.value.toUpperCase() })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Ej: B12345678"
          required
        />
        <p className="text-xs text-slate-500 mt-1">Formato: Letra + 7-8 números + letra/número</p>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
        <input
          type="text"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
      <input
        type="text"
        value={form.direccion}
        onChange={(e) => setForm({ ...form, direccion: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contacto (nombre)</label>
        <input
          type="text"
          value={form.contactoNombre}
          onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Contacto (email)</label>
        <input
          type="email"
          value={form.contactoEmail}
          onChange={(e) => setForm({ ...form, contactoEmail: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
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
        {editando ? 'Guardar Cambios' : 'Crear Cliente'}
      </button>
    </div>
  </form>
</Modal>

{/* Modal Centro */}
<Modal
  isOpen={modalCentroOpen}
  onClose={() => {
    setModalCentroOpen(false);
    setCentroEditando(null);
  }}
  title={centroEditando ? `Editar Centro - ${centroEditando.nombre}` : `Nuevo Centro - ${clienteSeleccionado?.nombre}`}
>
  <form onSubmit={guardarCentro} className="space-y-4">
    {/* ✅ NUEVO: Mostrar error si existe */}
    {errorCentro && (
      <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-start gap-3">
        <span className="text-xl">⚠️</span>
        <div className="flex-1">
          <p className="font-medium">Error al guardar</p>
          <p className="text-sm mt-1">{errorCentro}</p>
        </div>
      </div>
    )}

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del centro *</label>
      <input
        type="text"
        value={formCentro.nombre}
        onChange={(e) => setFormCentro({ ...formCentro, nombre: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Ej: Planta Principal"
        required
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
      <input
        type="text"
        value={formCentro.direccion}
        onChange={(e) => setFormCentro({ ...formCentro, direccion: e.target.value })}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Horario apertura</label>
        <input
          type="time"
          value={formCentro.horarioApertura}
          onChange={(e) => setFormCentro({ ...formCentro, horarioApertura: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Horario cierre</label>
        <input
          type="time"
          value={formCentro.horarioCierre}
          onChange={(e) => setFormCentro({ ...formCentro, horarioCierre: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Horario Limpieza Inicio</label>
        <input
          type="time"
          value={formCentro.horarioLimpiezaInicio || ''}
          onChange={(e) => setFormCentro({ ...formCentro, horarioLimpiezaInicio: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Horario Limpieza Fin</label>
        <input
          type="time"
          value={formCentro.horarioLimpiezaFin || ''}
          onChange={(e) => setFormCentro({ ...formCentro, horarioLimpiezaFin: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Flexibilidad</label>
        <select
          value={formCentro.flexibilidadHoraria || 'FLEXIBLE'}
          onChange={(e) => setFormCentro({ ...formCentro, flexibilidadHoraria: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="FLEXIBLE">Flexible</option>
          <option value="PARCIAL">Parcial (±1h)</option>
          <option value="ESTRICTO">Estricto</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Tipo Servicio</label>
        <select
          value={formCentro.tipoServicio || 'FRECUENTE'}
          onChange={(e) => setFormCentro({ ...formCentro, tipoServicio: e.target.value })}
          className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="FRECUENTE">Frecuente</option>
          <option value="PUNTUAL">Puntual</option>
          <option value="BAJO_DEMANDA">Bajo Demanda</option>
        </select>
      </div>
    </div>

    <div className="flex gap-3 pt-4">
      <button
        type="button"
        onClick={() => setModalCentroOpen(false)}
        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        type="submit"
        className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600"
      >
        {centroEditando ? 'Guardar Cambios' : 'Crear Centro'}
      </button>
    </div>
  </form>
</Modal>
      </div>
    )
  }
  // Componente para tarjeta desplegable de centro sin cubrir
  function CentroSinCubrirCard({ grupo, setCurrentPage }) {
    const [desplegado, setDesplegado] = useState(false);

    return (
      <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50">
        {/* Header clickeable */}
        <div
          className="p-4 cursor-pointer hover:bg-red-100 transition-colors"
          onClick={() => setDesplegado(!desplegado)}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{desplegado ? '📂' : '📁'}</span>
                <div>
                  <p className="font-bold text-red-800 text-lg">{grupo.centro}</p>
                  <p className="text-sm text-red-600">{grupo.cliente}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-3xl font-bold text-red-700">{grupo.dias.length}</p>
                <p className="text-xs text-red-600">días sin cubrir</p>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentPage('planificacion');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Asignar →
              </button>
            </div>
          </div>
        </div>

        {/* Lista desplegable de días */}
        {desplegado && (
          <div className="border-t border-red-200 bg-white">
            <div className="p-4 space-y-2">
              {grupo.dias
                .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                .map((dia, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-red-700 min-w-[40px]">{dia.diaSemana}</span>
                      <span className="text-red-600">
                        {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                    <span className="text-sm text-red-500 font-medium">{dia.horario}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    );
  
  }

  function DashboardPage({ api, setCurrentPage }) {
    const [stats, setStats] = useState({
      trabajadoresActivos: 0,
      trabajadoresEnBaja: 0,
      turnosHoy: 0,
      clientesActivos: 0,
      ausenciasPendientes: 0
    });
    const [dashboardCEO, setDashboardCEO] = useState(null);
    const [loadingCEO, setLoadingCEO] = useState(true);
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [año, setAño] = useState(new Date().getFullYear());

    useEffect(() => {
      cargarDatos();
    }, [mes, año]);

    const cargarDatos = async () => {
      try {
        const statsData = await api.get('/dashboard/stats');
        setStats(statsData);
      } catch (err) {
        console.error('Error cargando stats:', err);
      }

      try {
        setLoadingCEO(true);
        const ceoData = await api.get(`/dashboard/ejecutivo?mes=${mes}&año=${año}`);
        setDashboardCEO(ceoData);  // ✅ CORRECTO
      } catch (err) {
        console.error('Error cargando dashboard CEO:', err);
        setDashboardCEO(null);
      } finally {
        setLoadingCEO(false);
      }
    };

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    const getSeveridadColor = (severidad) => {
      switch (severidad) {
        case 'CRÍTICA': return 'bg-red-100 border-red-300 text-red-800';
        case 'ALTA': return 'bg-orange-100 border-orange-300 text-orange-800';
        case 'MEDIA': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        default: return 'bg-blue-100 border-blue-300 text-blue-800';
      }
    };

    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Panel Ejecutivo</h1>
          <p className="text-slate-600 mt-1">Visión general del negocio</p>
        </div>

        {/* SELECTOR DE PERIODO */}
        <div className="mb-6 flex gap-3">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
              </option>
            ))}
          </select>
          <select
            value={año}
            onChange={(e) => setAño(parseInt(e.target.value))}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        {loadingCEO ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-slate-600">Cargando dashboard...</p>
          </div>
        ) : !dashboardCEO ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-slate-500 text-lg">No hay datos disponibles para este período</p>
            <p className="text-slate-400 text-sm mt-2">Completa registros de horas para ver el dashboard ejecutivo</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs FINANCIEROS */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Indicadores Financieros</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-1">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatCurrency(dashboardCEO.kpisFinancieros.ingresosTotales)}
                  </p>
                  <p className={`text-sm mt-2 font-semibold ${dashboardCEO.kpisFinancieros.variacionIngresos >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {dashboardCEO.kpisFinancieros.variacionIngresos >= 0 ? '+' : ''}
                    {dashboardCEO.kpisFinancieros.variacionIngresos}% vs mes anterior
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <p className="text-sm text-green-700 font-medium mb-1">Margen Bruto</p>
                  <p className="text-3xl font-bold text-green-900">
                    {formatCurrency(dashboardCEO.kpisFinancieros.margenBruto)}
                  </p>
                  <p className="text-sm mt-2 text-green-700 font-semibold">
                    {dashboardCEO.kpisFinancieros.porcentajeMargen}% margen
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                  <p className="text-sm text-purple-700 font-medium mb-1">Horas Facturables</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {dashboardCEO.kpisFinancieros.horasFacturables.toLocaleString('es-ES')}h
                  </p>
                  <p className="text-sm mt-2 text-purple-700">
                    {(dashboardCEO.kpisFinancieros.ingresosTotales / dashboardCEO.kpisFinancieros.horasFacturables).toFixed(2)}€/hora
                  </p>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 border border-cyan-200">
                  <p className="text-sm text-cyan-700 font-medium mb-1">Utilización</p>
                  <p className="text-3xl font-bold text-cyan-900">
                    {dashboardCEO.kpisOperativos.utilizacion}%
                  </p>
                  <p className="text-sm mt-2 text-cyan-700">
                    {dashboardCEO.kpisOperativos.horasTrabajadas}h / {dashboardCEO.kpisOperativos.horasDisponibles}h
                  </p>
                </div>
              </div>
            </div>

            {/* TOP CLIENTES */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Top 5 Clientes por Facturación</h2>
              {dashboardCEO.topClientes.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay datos de clientes</p>
              ) : (
                <div className="space-y-3">
                  {dashboardCEO.topClientes.map((cliente, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{cliente.nombre}</p>
                          <p className="text-sm text-slate-500">{cliente.horas}h trabajadas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(cliente.ingresos)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ALERTAS CRÍTICAS */}
            {dashboardCEO.alertasCriticas.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Alertas Críticas</h2>
                <div className="space-y-2">
                  {dashboardCEO.alertasCriticas.map((alerta, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${getSeveridadColor(alerta.severidad)}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold">
                          {alerta.severidad === 'CRÍTICA' ? '🔴' : alerta.severidad === 'ALTA' ? '🟠' : '🟡'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{alerta.mensaje}</p>
                          <p className="text-xs mt-1 opacity-75">Tipo: {alerta.tipo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EFICIENCIA OPERATIVA */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Eficiencia Operativa</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Ratio Horas Extra</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardCEO.eficiencia.ratioHorasExtras}%</p>
                  <p className={`text-sm mt-1 ${dashboardCEO.eficiencia.ratioHorasExtras < 10 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                    {dashboardCEO.eficiencia.ratioHorasExtras < 10 ? 'Óptimo' : 'Revisar planificación'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Ausencias No Planificadas</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardCEO.eficiencia.ausenciasNoPlanificadas}</p>
                  <p className="text-sm text-slate-500 mt-1">Bajas médicas este mes</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Cobertura de Turnos</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardCEO.eficiencia.coberturaTurnos}%</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {dashboardCEO.eficiencia.totalAsignaciones} asignaciones totales
                  </p>
                </div>
              </div>
            </div>

            {/* STATS RÁPIDAS (las que ya tenías) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Estado Actual</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700">Trabajadores Activos</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.trabajadoresActivos}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-700">En Baja Médica</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{stats.trabajadoresEnBaja}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-700">Clientes Activos</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.clientesActivos}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-sm text-amber-700">Ausencias Pendientes</p>
                  <p className="text-3xl font-bold text-amber-900 mt-2">{stats.ausenciasPendientes}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
  
  // Página placeholder
  function PlaceholderPage({ title }) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">{title}</h1>
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <p className="text-slate-500 text-lg">🚧 En construcción</p>
          <p className="text-slate-400 mt-2">Esta sección estará disponible próximamente</p>
        </div>
      </div>
    )
  }

  // Aplicación principal
  function MainApp({ user, onLogout, api }) {
    const [currentPage, setCurrentPage] = useState('dashboard')

    const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: '📊' },
      { id: 'planificacion', label: 'Planificación', icon: '📅' },
      { id: 'plantillas', label: 'Plantillas', icon: '📋' },
      { id: 'trabajadores', label: 'Trabajadores', icon: '👥' },
      { id: 'clientes', label: 'Clientes', icon: '🏢' },
      { id: 'ausencias', label: 'Ausencias', icon: '🏖️' },
      { id: 'informes', label: 'Informes', icon: '📋' },
    ]


    const renderPage = () => {
      switch (currentPage) {
        case 'dashboard':
          return <DashboardPage api={api} setCurrentPage={setCurrentPage} />
        case 'planificacion':
          return <PlanificacionPage api={api} />
        case 'plantillas':
          return <Plantillas api={api} />
        case 'trabajadores':
          return <TrabajadoresPage api={api} />
        case 'clientes':
          return <ClientesPage api={api} />
        case 'ausencias':
          return <Ausencias api={api} />
        case 'informes':  // 👈 AÑADIR ESTAS 2 LÍNEAS
          return <Informes api={api} />
        default:
          return <PlaceholderPage title={menuItems.find(m => m.id === currentPage)?.label || 'Página'} />
      }
    }


    return (
      <div className="flex h-screen bg-slate-100">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900 text-white flex flex-col">
          <div className="p-6 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1">
  <img 
    src="/logo-grupo-rubio-2.png" 
    alt="Grupo Rubio" 
    className="w-full h-full object-contain"
  />
</div>
              <div>
                <h1 className="font-bold">Grupo Rubio</h1>
                <p className="text-xs text-slate-400">Gestión de Horas</p>
              </div>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${currentPage === item.id
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-slate-800">
            <div className="flex items-center gap-3 px-4 py-2 mb-2">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center">
                <span className="font-bold">{user.nombre.charAt(0)}</span>
              </div>
              <div>
                <p className="text-sm font-medium">{user.nombre}</p>
                <p className="text-xs text-slate-400">{user.rol}</p>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all"
            >
              <span>🚪</span>
              <span className="font-medium">Cerrar sesión</span>
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderPage()}

        </main>
      </div>
    )
  }

  // App Root
  export default function App() {
    const api = useApi()
    const [user, setUser] = useState(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
      const checkAuth = async () => {
        if (api.token) {
          try {
            const userData = await api.get('/auth/me')
            if (userData.id) {
              setUser(userData)
            }
          } catch (err) {
            api.logout()
          }
        }
        setChecking(false)
      }
      checkAuth()
    }, [api.token])

    const handleLogout = () => {
      api.logout()
      setUser(null)
    }

    if (checking) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white">Cargando...</div>
        </div>
      )
    }

    if (!user) {
      return <LoginPage onLogin={setUser} api={api} />
    }

    return <MainApp user={user} onLogout={handleLogout} api={api} />
  }