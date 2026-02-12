import React, { useState, useEffect } from 'react';
import Modal from '../components/Modal';
import { useApiClient } from '../contexts/AuthContext';

export default function ClientesPage() {
  const api = useApiClient();
  const [clientes, setClientes] = useState([])
  const [loading, setLoading] = useState(true)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)
  const [modalBajaOpen, setModalBajaOpen] = useState(false)
  const [modalBajaCentroOpen, setModalBajaCentroOpen] = useState(false)
  const [centroParaBaja, setCentroParaBaja] = useState(null)
  const [motivoBaja, setMotivoBaja] = useState('')
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
  tipoHorarioLimpieza: 'FLEXIBLE',
  horariosLimpieza: [{ inicio: '08:00', fin: '14:00' }],
  tipoServicio: 'FRECUENTE'
})

  useEffect(() => {
  cargarDatos()
}, [mostrarInactivos])

  const cargarDatos = async () => {
  setLoading(true)
  try {
    const data = await api.get('/clientes')
    const filtrados = mostrarInactivos ? data : data.filter(c => c.activo)
    setClientes(filtrados)
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
  setErrorCentro('')
  setClienteSeleccionado(cliente)
  setCentroEditando(null)
  setFormCentro({
    nombre: '',
    direccion: '',
    horarioApertura: '06:00',
    horarioCierre: '22:00',
    tipoHorarioLimpieza: 'FLEXIBLE',
    horariosLimpieza: [{ inicio: '08:00', fin: '14:00' }],
    tipoServicio: 'FRECUENTE'
  })
    setModalCentroOpen(true)
  }

  const abrirModalEditarCentro = (centro) => {
  setErrorCentro('')
  setCentroEditando(centro)
  
  // Cargar horarios limpieza si existen
  const horariosLimpieza = centro.horariosLimpieza && centro.horariosLimpieza.length > 0
    ? centro.horariosLimpieza.map(h => ({ inicio: h.inicio, fin: h.fin }))
    : [{ inicio: '08:00', fin: '14:00' }];
  
  setFormCentro({
    nombre: centro.nombre,
    direccion: centro.direccion || '',
    horarioApertura: centro.horarioApertura || '06:00',
    horarioCierre: centro.horarioCierre || '22:00',
    tipoHorarioLimpieza: centro.tipoHorarioLimpieza || 'FLEXIBLE',
    horariosLimpieza: horariosLimpieza,
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

  // Funciones para gestionar horarios limpieza múltiples
const añadirHorarioLimpieza = () => {
  setFormCentro({
    ...formCentro,
    horariosLimpieza: [...formCentro.horariosLimpieza, { inicio: '08:00', fin: '14:00' }]
  });
};

const eliminarHorarioLimpieza = (index) => {
  if (formCentro.horariosLimpieza.length === 1) {
    alert('Debe haber al menos un horario');
    return;
  }
  const nuevosHorarios = formCentro.horariosLimpieza.filter((_, i) => i !== index);
  setFormCentro({ ...formCentro, horariosLimpieza: nuevosHorarios });
};

const actualizarHorarioLimpieza = (index, campo, valor) => {
  const nuevosHorarios = [...formCentro.horariosLimpieza];
  nuevosHorarios[index][campo] = valor;
  setFormCentro({ ...formCentro, horariosLimpieza: nuevosHorarios });
};

  const guardarCentro = async (e) => {
  e.preventDefault()
  setErrorCentro('')
  
  // Validar horarios si es FIJO
  if (formCentro.tipoHorarioLimpieza === 'FIJO') {
    const horariosValidos = formCentro.horariosLimpieza.every(h => {
      if (!h.inicio || !h.fin) {
        setErrorCentro('Todos los horarios deben tener inicio y fin');
        return false;
      }
      if (h.inicio >= h.fin) {
        setErrorCentro('La hora de fin debe ser posterior a la hora de inicio');
        return false;
      }
      return true;
    });
    
    if (!horariosValidos) return;
  }
  
  try {
    const datos = {
      nombre: formCentro.nombre,
      direccion: formCentro.direccion,
      horarioApertura: formCentro.horarioApertura,
      horarioCierre: formCentro.horarioCierre,
      tipoHorarioLimpieza: formCentro.tipoHorarioLimpieza,
      tipoServicio: formCentro.tipoServicio,
      clienteId: clienteSeleccionado?.id
    };
    
    // Solo enviar horarios si es FIJO
    if (formCentro.tipoHorarioLimpieza === 'FIJO') {
      datos.horariosLimpieza = formCentro.horariosLimpieza;
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
    const mensaje = err.error || err.message || 'Error al guardar centro'
    setErrorCentro(mensaje)
  }
}
// Funciones de baja y reactivación
const darDeBajaCliente = async () => {
  try {
    await api.put(`/clientes/${clienteSeleccionado.id}/dar-baja`, { motivo: motivoBaja })
    alert('Cliente y sus centros dados de baja correctamente')
    setModalBajaOpen(false)
    setMotivoBaja('')
    cargarDatos()
  } catch (err) {
    console.error('Error:', err)
    alert('Error al dar de baja el cliente')
  }
}

const reactivarCliente = async (clienteId) => {
  if (!confirm('¿Reactivar este cliente?')) return
  try {
    await api.put(`/clientes/${clienteId}/reactivar`)
    alert('Cliente reactivado')
    cargarDatos()
  } catch (err) {
    console.error('Error:', err)
    alert('Error al reactivar')
  }
}

const darDeBajaCentro = async () => {
  try {
    await api.put(`/centros/${centroParaBaja.id}/dar-baja`, { motivo: motivoBaja })
    alert('Centro dado de baja correctamente')
    setModalBajaCentroOpen(false)
    setMotivoBaja('')
    cargarDatos()
  } catch (err) {
    console.error('Error:', err)
    alert('Error al dar de baja el centro')
  }
}

const reactivarCentro = async (centroId) => {
  if (!confirm('¿Reactivar este centro?')) return
  try {
    await api.put(`/centros/${centroId}/reactivar`)
    alert('Centro reactivado')
    cargarDatos()
  } catch (err) {
    console.error('Error:', err)
    alert('Error al reactivar')
  }
}


    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
  <div>
    <h1 className="text-2xl font-bold text-slate-800">Clientes</h1>
    <p className="text-slate-500">{clientes.length} clientes registrados</p>
  </div>
  <div className="flex gap-3">
    <button
      onClick={() => setMostrarInactivos(!mostrarInactivos)}
      className={`px-4 py-2 rounded-xl transition-all ${
        mostrarInactivos 
          ? 'bg-slate-200 text-slate-700' 
          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {mostrarInactivos ? 'Ocultar inactivos' : 'Mostrar inactivos'}
    </button>
    <button
      onClick={() => abrirModal()}
      className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all"
    >
      <span className="text-xl">+</span> Nuevo Cliente
    </button>
  </div>
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
                      <div className="flex gap-2">
  <button
    onClick={() => abrirModal(cliente)}
    className="px-3 py-1 text-sm bg-slate-100 rounded-lg hover:bg-slate-200"
  >
    Editar
  </button>
  {cliente.activo ? (
    <button
      onClick={() => {
        setClienteSeleccionado(cliente)
        setModalBajaOpen(true)
      }}
      className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
    >
      Dar de baja
    </button>
  ) : (
    <button
      onClick={() => reactivarCliente(cliente.id)}
      className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded-lg hover:bg-green-200"
    >
      Reactivar
    </button>
  )}
</div>
                    </div>
                  </div>

                  {cliente.centrosTrabajo && cliente.centrosTrabajo.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-100">
                      <p className="text-sm font-medium text-slate-600 mb-2">Centros de trabajo:</p>
                      <div className="flex flex-wrap gap-2">
                        {cliente.centrosTrabajo.map(centro => (
  <div key={centro.id} className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
    centro.activo 
      ? 'bg-blue-50 text-blue-700' 
      : 'bg-slate-200 text-slate-600'
  }`}>
    <span>{centro.nombre}</span>
    <button
      onClick={(e) => {
        e.stopPropagation();
        abrirModalEditarCentro(centro);
      }}
      className="hover:opacity-70"
    >
      ✏️
    </button>
    {centro.activo ? (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setCentroParaBaja(centro);
          setModalBajaCentroOpen(true);
        }}
        className="text-red-600 hover:text-red-800"
      >
        ❌
      </button>
    ) : (
      <button
        onClick={(e) => {
          e.stopPropagation();
          reactivarCentro(centro.id);
        }}
        className="text-green-600 hover:text-green-800"
      >
        ✅
      </button>
    )}
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

    {/* Horarios informativos */}
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

{/* Tipo de horario limpieza */}
<div>
  <label className="block text-sm font-medium text-slate-700 mb-3">Horario de Limpieza *</label>
  <div className="flex gap-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="tipoHorarioLimpieza"
        value="FLEXIBLE"
        checked={formCentro.tipoHorarioLimpieza === 'FLEXIBLE'}
        onChange={(e) => setFormCentro({ ...formCentro, tipoHorarioLimpieza: e.target.value })}
        className="w-4 h-4 text-blue-600"
      />
      <span className="text-sm">Horario Flexible</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        name="tipoHorarioLimpieza"
        value="FIJO"
        checked={formCentro.tipoHorarioLimpieza === 'FIJO'}
        onChange={(e) => setFormCentro({ ...formCentro, tipoHorarioLimpieza: e.target.value })}
        className="w-4 h-4 text-blue-600"
      />
      <span className="text-sm">Horario Fijo</span>
    </label>
  </div>
  <p className="text-xs text-slate-500 mt-1">
    {formCentro.tipoHorarioLimpieza === 'FLEXIBLE' 
      ? 'Los trabajadores pueden tener cualquier horario en este centro.'
      : 'Los horarios de trabajo deben estar dentro de los rangos definidos.'}
  </p>
</div>

{/* Horarios fijos (solo si es FIJO) */}
{formCentro.tipoHorarioLimpieza === 'FIJO' && (
  <div className="border border-slate-200 rounded-lg p-4 bg-slate-50">
    <label className="block text-sm font-medium text-slate-700 mb-3">Rangos horarios permitidos</label>
    <div className="space-y-3">
      {formCentro.horariosLimpieza.map((horario, index) => (
        <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-lg border border-slate-200">
          <div className="flex-1 grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-slate-600 mb-1">Desde</label>
              <input
                type="time"
                value={horario.inicio}
                onChange={(e) => actualizarHorarioLimpieza(index, 'inicio', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-600 mb-1">Hasta</label>
              <input
                type="time"
                value={horario.fin}
                onChange={(e) => actualizarHorarioLimpieza(index, 'fin', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      ))}
    </div>
    
  </div>
)}

{/* Tipo Servicio */}
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
{/* Modal Baja Cliente */}
<Modal 
  isOpen={modalBajaOpen} 
  onClose={() => {
    setModalBajaOpen(false)
    setMotivoBaja('')
  }} 
  title="Dar de baja cliente"
>
  <div className="space-y-4">
    <p className="text-slate-700">
      ¿Estás seguro de dar de baja a <strong>{clienteSeleccionado?.nombre}</strong>?
    </p>
    <p className="text-sm text-amber-600">
      ⚠️ También se darán de baja todos sus centros de trabajo.
    </p>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Motivo (opcional)
      </label>
      <textarea
        value={motivoBaja}
        onChange={(e) => setMotivoBaja(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="3"
        placeholder="Ej: Fin de contrato, cierre de empresa..."
      />
    </div>
    <div className="flex gap-3">
      <button
        onClick={() => {
          setModalBajaOpen(false)
          setMotivoBaja('')
        }}
        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        onClick={darDeBajaCliente}
        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
      >
        Dar de baja
      </button>
    </div>
  </div>
</Modal>

{/* Modal Baja Centro */}
<Modal 
  isOpen={modalBajaCentroOpen} 
  onClose={() => {
    setModalBajaCentroOpen(false)
    setMotivoBaja('')
  }} 
  title="Dar de baja centro"
>
  <div className="space-y-4">
    <p className="text-slate-700">
      ¿Estás seguro de dar de baja el centro <strong>{centroParaBaja?.nombre}</strong>?
    </p>
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">
        Motivo (opcional)
      </label>
      <textarea
        value={motivoBaja}
        onChange={(e) => setMotivoBaja(e.target.value)}
        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        rows="3"
        placeholder="Ej: Cierre definitivo, traslado..."
      />
    </div>
    <div className="flex gap-3">
      <button
        onClick={() => {
          setModalBajaCentroOpen(false)
          setMotivoBaja('')
        }}
        className="flex-1 px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
      >
        Cancelar
      </button>
      <button
        onClick={darDeBajaCentro}
        className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600"
      >
        Dar de baja
      </button>
    </div>
  </div>
</Modal>
      </div>
    )
  }