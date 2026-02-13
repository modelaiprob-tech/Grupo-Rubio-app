import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import HorariosFijos from './HorariosFijos';
import { useApiClient } from '../contexts/AuthContext';

export default function TrabajadoresPage() {
  const api = useApiClient();
  const navigate = useNavigate();
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
                      navigate(`/trabajadores/${t.id}/perfil`)
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-slate-50 text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Perfil
                  </button>
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