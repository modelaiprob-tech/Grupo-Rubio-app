import React, { useEffect } from 'react';
import Modal from '../components/Modal';
import { useApiClient } from '../contexts/AuthContext';
import { useClientes } from '../hooks/useClientes';

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

const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';
const labelClass = 'block text-sm font-medium text-gray-500 mb-2';
const cardClass = 'bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300';

export default function ClientesPage() {
  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

  const api = useApiClient();
  const {
    clientes,
    loading,
    mostrarInactivos,
    setMostrarInactivos,
    modalBajaOpen,
    setModalBajaOpen,
    modalBajaCentroOpen,
    setModalBajaCentroOpen,
    centroParaBaja,
    setCentroParaBaja,
    motivoBaja,
    setMotivoBaja,
    modalOpen,
    setModalOpen,
    modalCentroOpen,
    setModalCentroOpen,
    centroEditando,
    setCentroEditando,
    editando,
    clienteSeleccionado,
    setClienteSeleccionado,
    error,
    errorCentro,
    form,
    setForm,
    formCentro,
    setFormCentro,
    abrirModal,
    abrirModalCentro,
    abrirModalEditarCentro,
    guardar,
    actualizarHorarioLimpieza,
    guardarCentro,
    darDeBajaCliente,
    reactivarCliente,
    darDeBajaCentro,
    reactivarCentro
  } = useClientes(api);

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Clientes</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">{clientes.length} clientes registrados</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setMostrarInactivos(!mostrarInactivos)}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              mostrarInactivos
                ? 'bg-gray-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {mostrarInactivos ? 'Ocultar inactivos' : 'Mostrar inactivos'}
          </button>
          <button
            onClick={() => abrirModal()}
            className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-all"
          >
            <span>+</span> Nuevo Cliente
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      ) : clientes.length === 0 ? (
        <div className={`${cardClass} text-center py-16`}>
          <p className="text-gray-500 font-medium mb-4">No hay clientes registrados</p>
          <button
            onClick={() => abrirModal()}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-all"
          >
            Anadir el primero
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {clientes.map(cliente => (
            <div key={cliente.id} className={`${cardClass} overflow-hidden`}>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-teal-500 to-emerald-400 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                      {cliente.nombre.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{cliente.nombre}</h3>
                      <p className="text-sm text-gray-500">CIF: {cliente.cif}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-2xl font-extrabold text-teal-600">{cliente.centrosTrabajo?.length || 0}</p>
                      <p className="text-xs text-gray-400">centros</p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => abrirModal(cliente)}
                        className="px-3 py-1.5 text-xs bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                      >
                        Editar
                      </button>
                      {cliente.activo ? (
                        <button
                          onClick={() => {
                            setClienteSeleccionado(cliente)
                            setModalBajaOpen(true)
                          }}
                          className="px-3 py-1.5 text-xs bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 font-medium transition-colors"
                        >
                          Dar de baja
                        </button>
                      ) : (
                        <button
                          onClick={() => reactivarCliente(cliente.id)}
                          className="px-3 py-1.5 text-xs bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100 font-medium transition-colors"
                        >
                          Reactivar
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {cliente.centrosTrabajo && cliente.centrosTrabajo.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-2">Centros de trabajo:</p>
                    <div className="flex flex-wrap gap-2">
                      {cliente.centrosTrabajo.map(centro => (
                        <div key={centro.id} className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
                          centro.activo
                            ? 'bg-teal-50 text-teal-700'
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          <span>{centro.nombre}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              abrirModalEditarCentro(centro);
                            }}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          </button>
                          {centro.activo ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setCentroParaBaja(centro);
                                setModalBajaCentroOpen(true);
                              }}
                              className="text-rose-400 hover:text-rose-600 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                reactivarCentro(centro.id);
                              }}
                              className="text-emerald-400 hover:text-emerald-600 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={() => abrirModalCentro(cliente)}
                  className="mt-4 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors"
                >
                  + Anadir centro de trabajo
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cliente */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editando ? 'Editar Cliente' : 'Nuevo Cliente'}>
        <form onSubmit={guardar} className="space-y-4">
          {error && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              <p className="font-medium">Error al guardar</p>
              <p className="mt-1">{error}</p>
            </div>
          )}

          <div>
            <label className={labelClass}>Nombre empresa *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>CIF *</label>
              <input
                type="text"
                value={form.cif}
                onChange={(e) => setForm({ ...form, cif: e.target.value.toUpperCase() })}
                className={inputClass}
                placeholder="Ej: B12345678"
                required
              />
              <p className="text-xs text-gray-400 mt-1">Formato: Letra + 7-8 numeros + letra/numero</p>
            </div>
            <div>
              <label className={labelClass}>Telefono</label>
              <input
                type="text"
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>Direccion</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Contacto (nombre)</label>
              <input
                type="text"
                value={form.contactoNombre}
                onChange={(e) => setForm({ ...form, contactoNombre: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Contacto (email)</label>
              <input
                type="email"
                value={form.contactoEmail}
                onChange={(e) => setForm({ ...form, contactoEmail: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors"
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
          {errorCentro && (
            <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm">
              <p className="font-medium">Error al guardar</p>
              <p className="mt-1">{errorCentro}</p>
            </div>
          )}

          <div>
            <label className={labelClass}>Nombre del centro *</label>
            <input
              type="text"
              value={formCentro.nombre}
              onChange={(e) => setFormCentro({ ...formCentro, nombre: e.target.value })}
              className={inputClass}
              placeholder="Ej: Planta Principal"
              required
            />
          </div>

          <div>
            <label className={labelClass}>Direccion</label>
            <input
              type="text"
              value={formCentro.direccion}
              onChange={(e) => setFormCentro({ ...formCentro, direccion: e.target.value })}
              className={inputClass}
            />
          </div>

          {/* Horarios informativos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Horario apertura</label>
              <input
                type="time"
                value={formCentro.horarioApertura}
                onChange={(e) => setFormCentro({ ...formCentro, horarioApertura: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Horario cierre</label>
              <input
                type="time"
                value={formCentro.horarioCierre}
                onChange={(e) => setFormCentro({ ...formCentro, horarioCierre: e.target.value })}
                className={inputClass}
              />
            </div>
          </div>

          {/* Tipo de horario limpieza */}
          <div>
            <label className={labelClass}>Horario de Limpieza *</label>
            <div className="flex gap-4">
              <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all flex-1 ${formCentro.tipoHorarioLimpieza === 'FLEXIBLE' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  name="tipoHorarioLimpieza"
                  value="FLEXIBLE"
                  checked={formCentro.tipoHorarioLimpieza === 'FLEXIBLE'}
                  onChange={(e) => setFormCentro({ ...formCentro, tipoHorarioLimpieza: e.target.value })}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Flexible</span>
              </label>
              <label className={`flex items-center gap-3 p-3 border-2 rounded-xl cursor-pointer transition-all flex-1 ${formCentro.tipoHorarioLimpieza === 'FIJO' ? 'border-teal-500 bg-teal-50' : 'border-gray-200 hover:border-gray-300'}`}>
                <input
                  type="radio"
                  name="tipoHorarioLimpieza"
                  value="FIJO"
                  checked={formCentro.tipoHorarioLimpieza === 'FIJO'}
                  onChange={(e) => setFormCentro({ ...formCentro, tipoHorarioLimpieza: e.target.value })}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm font-medium text-gray-700">Fijo</span>
              </label>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {formCentro.tipoHorarioLimpieza === 'FLEXIBLE'
                ? 'Los trabajadores pueden tener cualquier horario en este centro.'
                : 'Los horarios de trabajo deben estar dentro de los rangos definidos.'}
            </p>
          </div>

          {/* Horarios fijos (solo si es FIJO) */}
          {formCentro.tipoHorarioLimpieza === 'FIJO' && (
            <div className="bg-gray-50 rounded-xl p-4">
              <label className={labelClass}>Rangos horarios permitidos</label>
              <div className="space-y-3">
                {formCentro.horariosLimpieza.map((horario, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-gray-200">
                    <div className="flex-1 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Desde</label>
                        <input
                          type="time"
                          value={horario.inicio}
                          onChange={(e) => actualizarHorarioLimpieza(index, 'inicio', e.target.value)}
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Hasta</label>
                        <input
                          type="time"
                          value={horario.fin}
                          onChange={(e) => actualizarHorarioLimpieza(index, 'fin', e.target.value)}
                          className={inputClass}
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
            <label className={labelClass}>Tipo Servicio</label>
            <select
              value={formCentro.tipoServicio || 'FRECUENTE'}
              onChange={(e) => setFormCentro({ ...formCentro, tipoServicio: e.target.value })}
              className={inputClass}
            >
              <option value="FRECUENTE">Frecuente</option>
              <option value="PUNTUAL">Puntual</option>
              <option value="BAJO_DEMANDA">Bajo Demanda</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={() => setModalCentroOpen(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors"
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
          <p className="text-gray-700 text-sm">
            Estas seguro de dar de baja a <strong>{clienteSeleccionado?.nombre}</strong>?
          </p>
          <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
            Tambien se daran de baja todos sus centros de trabajo.
          </div>
          <div>
            <label className={labelClass}>Motivo (opcional)</label>
            <textarea
              value={motivoBaja}
              onChange={(e) => setMotivoBaja(e.target.value)}
              className={`${inputClass} resize-none`}
              rows="3"
              placeholder="Ej: Fin de contrato, cierre de empresa..."
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setModalBajaOpen(false)
                setMotivoBaja('')
              }}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={darDeBajaCliente}
              className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium text-sm transition-colors"
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
          <p className="text-gray-700 text-sm">
            Estas seguro de dar de baja el centro <strong>{centroParaBaja?.nombre}</strong>?
          </p>
          <div>
            <label className={labelClass}>Motivo (opcional)</label>
            <textarea
              value={motivoBaja}
              onChange={(e) => setMotivoBaja(e.target.value)}
              className={`${inputClass} resize-none`}
              rows="3"
              placeholder="Ej: Cierre definitivo, traslado..."
            />
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100">
            <button
              onClick={() => {
                setModalBajaCentroOpen(false)
                setMotivoBaja('')
              }}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={darDeBajaCentro}
              className="flex-1 px-4 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium text-sm transition-colors"
            >
              Dar de baja
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}