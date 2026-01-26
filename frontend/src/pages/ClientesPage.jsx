import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';

export default function ClientesPage({ api }) {
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