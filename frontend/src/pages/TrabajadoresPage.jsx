import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';
import HorariosFijos from './HorariosFijos';
import { useApiClient } from '../contexts/AuthContext';
import * as trabajadoresApi from '../services/trabajadoresApi';
import * as categoriasApi from '../services/categoriasApi';
import * as centrosApi from '../services/centrosApi';

function useFont(href) {
  useEffect(() => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);
}

export default function TrabajadoresPage() {
  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

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
        trabajadoresApi.getAll(api),
        categoriasApi.getAll(api),
        centrosApi.getAll(api)
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
        await trabajadoresApi.actualizar(api, editando.id, datos)
        trabajadorId = editando.id
      } else {
        const resultado = await trabajadoresApi.crear(api, datos)
        trabajadorId = resultado.id
      }

      // Guardar centros habituales
      if (editando) {
        const relacionesActuales = editando.centrosAsignados || []
        for (const rel of relacionesActuales) {
          await trabajadoresApi.desvincularCentro(api, rel.id)
        }
      }

      for (const centroId of centrosSeleccionados) {
        await trabajadoresApi.vincularCentro(api, {
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
        await trabajadoresApi.darBaja(api, trabajador.id, { motivo })
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
        await trabajadoresApi.reactivar(api, trabajador.id)
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
      <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900">Trabajadores</h1>
            <p className="text-gray-500">
              {trabajadoresActivos} activos • {trabajadoresInactivos} inactivos
            </p>
          </div>
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-300"
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
            className="flex-1 max-w-md bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
          />
          <label className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50 transition-all duration-300">
            <input
              type="checkbox"
              checked={mostrarInactivos}
              onChange={(e) => setMostrarInactivos(e.target.checked)}
              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
            />
            <span className="text-sm text-gray-500">Mostrar inactivos</span>
          </label>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2">
            <span className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
            <span className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
            <span className="w-2.5 h-2.5 bg-teal-600 rounded-full animate-bounce"></span>
          </div>
        ) : trabajadoresFiltrados.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]">
            <p className="text-gray-500 mb-4">
              {mostrarInactivos ? 'No hay trabajadores inactivos' : 'No hay trabajadores registrados'}
            </p>
            {!mostrarInactivos && (
              <button
                onClick={() => abrirModal()}
                className="px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-300"
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
                className={`bg-white rounded-2xl p-6 transition-all duration-300 ${t.activo
                    ? 'shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)]'
                    : 'border border-rose-200 bg-rose-50/30'
                  }`}
              >
                {/* BADGE INACTIVO */}
                {!t.activo && (
                  <div className="mb-3">
                    <span className="inline-block px-2.5 py-1 bg-rose-50 text-rose-600 text-xs font-semibold rounded-full">
                      INACTIVO
                    </span>
                  </div>
                )}

                <div
                  onClick={() => abrirModal(t)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold ${t.activo ? 'bg-gradient-to-br from-teal-500 to-emerald-400' : 'bg-gray-400'
                      }`}>
                      {t.nombre.charAt(0)}{t.apellidos.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-extrabold tracking-tight text-gray-900">{t.nombre} {t.apellidos}</h3>
                      <p className="text-sm text-gray-500">{t.categoria?.nombre || 'Sin categoría'}</p>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400 space-y-1">
                    <p>{t.telefono || 'Sin teléfono'}</p>
                    <p>{t.tipoContrato} - {t.horasContrato}h/sem</p>
                    <p>{t.dni}</p>
                  </div>
                </div>

                {/* BOTONES BAJA/REACTIVAR */}
                <div className="mt-4 pt-4 border-t border-gray-200 flex gap-2">
                  {t.activo ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        darDeBaja(t)
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-all duration-300"
                    >
                      Dar de Baja
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        reactivar(t)
                      }}
                      className="flex-1 px-3 py-2 text-sm bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 transition-all duration-300"
                    >
                      Reactivar
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      navigate(`/trabajadores/${t.id}/perfil`)
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-300"
                  >
                    Perfil
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      abrirModal(t)
                    }}
                    className="flex-1 px-3 py-2 text-sm bg-teal-50 text-teal-600 rounded-lg hover:bg-teal-100 transition-all duration-300"
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
                <label className="block text-sm font-medium text-gray-500 mb-1">Nombre *</label>
                <input
                  type="text"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Apellidos *</label>
                <input
                  type="text"
                  value={form.apellidos}
                  onChange={(e) => setForm({ ...form, apellidos: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">DNI *</label>
                <input
                  type="text"
                  value={form.dni}
                  onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Telefono</label>
                <input
                  type="text"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Categoria *</label>
                <select
                  value={form.categoriaId}
                  onChange={(e) => setForm({ ...form, categoriaId: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {categorias.map(c => (
                    <option key={c.id} value={c.id}>{c.nombre}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tipo Contrato *</label>
                <select
                  value={form.tipoContrato}
                  onChange={(e) => setForm({ ...form, tipoContrato: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
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
                <label className="block text-sm font-medium text-gray-500 mb-1">Horas/semana *</label>
                <input
                  type="number"
                  value={form.horasContrato}
                  onChange={(e) => setForm({ ...form, horasContrato: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Fecha Alta *</label>
                <input
                  type="date"
                  value={form.fechaAlta}
                  onChange={(e) => setForm({ ...form, fechaAlta: e.target.value })}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">
                Empresas/Centros Habituales
              </label>
              <div className="border border-gray-200 rounded-xl p-3 max-h-48 overflow-y-auto">
                {centros.length === 0 ? (
                  <p className="text-sm text-gray-400">No hay centros disponibles</p>
                ) : (
                  centros.map(centro => (
                    <label key={centro.id} className="flex items-center gap-2 py-2 hover:bg-gray-50 cursor-pointer rounded-lg px-1 transition-all duration-300">
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
                        className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                      />
                      <span className="text-sm text-gray-500">
                        {centro.cliente?.nombre} - {centro.nombre}
                      </span>
                    </label>
                  ))
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Marca los centros donde este trabajador suele trabajar habitualmente
              </p>
            </div>
            {/* HORARIOS FIJOS */}
            {editando && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <HorariosFijos trabajadorId={editando.id} />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="flex-1 px-4 py-2.5 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 transition-all duration-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all duration-300"
              >
                {editando ? 'Guardar Cambios' : 'Crear Trabajador'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    )
  }
