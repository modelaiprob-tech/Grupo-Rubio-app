import { useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import { useGestionAusencias } from '../hooks/useAusencias';

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

const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300';
const selectClass = 'bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm';
const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';
const labelClass = 'block text-sm font-medium text-gray-500 mb-2';

function Ausencias() {
  const api = useApiClient();
  const {
    ausencias,
    trabajadores,
    tiposAusencia,
    loading,
    modalOpen,
    setModalOpen,
    editando,
    mostrarArchivadas,
    setMostrarArchivadas,
    filtros,
    setFiltros,
    form,
    setForm,
    abrirModal,
    guardar,
    aprobar,
    rechazar,
    toggleArchivar,
    getEstadoBadge,
    ausenciaTerminada,
    esBajaMedica
  } = useGestionAusencias(api);

  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

  const estadoBadgeClass = (estado) => {
    if (estado === 'PENDIENTE') return 'bg-amber-50 text-amber-700';
    if (estado === 'APROBADA') return 'bg-emerald-50 text-emerald-700';
    if (estado === 'RECHAZADA') return 'bg-rose-50 text-rose-600';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Gestion de Ausencias</h1>
          <p className="text-gray-400 text-sm font-medium mt-1">Vacaciones, permisos, bajas medicas y mas</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setMostrarArchivadas(!mostrarArchivadas)}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
              mostrarArchivadas
                ? 'bg-gray-700 text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {mostrarArchivadas ? 'Ocultar Archivadas' : 'Mostrar Archivadas'}
          </button>
          <button
            onClick={() => abrirModal()}
            className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors"
          >
            + Nueva Ausencia
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros({ ...filtros, estado: e.target.value })}
          className={selectClass}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="APROBADA">Aprobadas</option>
          <option value="RECHAZADA">Rechazadas</option>
        </select>

        <select
          value={filtros.trabajadorId}
          onChange={(e) => setFiltros({ ...filtros, trabajadorId: e.target.value })}
          className={selectClass}
        >
          <option value="">Todos los trabajadores</option>
          {trabajadores.map(t => (
            <option key={t.id} value={t.id}>
              {t.nombre} {t.apellidos}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
        </div>
      ) : ausencias.length === 0 ? (
        <div className={`${cardClass} text-center py-16`}>
          <p className="text-gray-500 font-medium">{mostrarArchivadas ? 'No hay ausencias archivadas' : 'No hay ausencias registradas'}</p>
          {!mostrarArchivadas && (
            <button onClick={() => abrirModal()} className="mt-3 text-teal-600 hover:text-teal-700 text-sm font-medium">
              Registrar la primera
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ausencias.map(ausencia => {
            const terminada = ausenciaTerminada(ausencia);

            return (
              <div
                key={ausencia.id}
                className={cardClass}
                style={{
                  opacity: ausencia.archivada ? 0.7 : 1,
                  borderLeft: ausencia.archivada ? '4px solid #94a3b8' : undefined
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm">
                      {ausencia.trabajador?.nombre} {ausencia.trabajador?.apellidos}
                      {ausencia.archivada && <span className="ml-2 text-gray-400 text-xs">Archivada</span>}
                    </h3>
                    <p className="text-sm font-medium mt-0.5" style={{ color: ausencia.tipoAusencia?.colorHex }}>
                      {ausencia.tipoAusencia?.nombre}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${estadoBadgeClass(ausencia.estado)}`}>
                    {ausencia.estado}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Periodo</span>
                    <span className="text-gray-700 font-medium">
                      {new Date(ausencia.fechaInicio).toLocaleDateString('es-ES')} - {new Date(ausencia.fechaFin).toLocaleDateString('es-ES')}
                    </span>
                  </div>

                  {ausencia.fechaAltaReal && (
                    <div className="flex justify-between bg-emerald-50 rounded-lg px-3 py-2">
                      <span className="text-emerald-600">Alta real</span>
                      <span className="text-emerald-700 font-bold">
                        {new Date(ausencia.fechaAltaReal).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span className="text-gray-400">Duracion</span>
                    <span className="text-gray-700 font-medium">{ausencia.diasTotales} dias</span>
                  </div>

                  {ausencia.motivo && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Motivo</span>
                      <span className="text-gray-700 text-right max-w-[60%] truncate">{ausencia.motivo}</span>
                    </div>
                  )}

                  {ausencia.numeroParte && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">N Parte</span>
                      <span className="text-gray-700 font-mono">{ausencia.numeroParte}</span>
                    </div>
                  )}

                  {terminada && ausencia.estado === 'APROBADA' && !ausencia.archivada && (
                    <div className="bg-amber-50 rounded-lg px-3 py-2 text-xs text-amber-700 font-medium">
                      Esta ausencia ya finalizo. Puedes archivarla.
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-100">
                  {ausencia.estado === 'PENDIENTE' && !ausencia.archivada && (
                    <>
                      <button
                        onClick={() => aprobar(ausencia.id)}
                        className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 text-xs font-medium transition-colors"
                      >
                        Aprobar
                      </button>
                      <button
                        onClick={() => rechazar(ausencia.id)}
                        className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 text-xs font-medium transition-colors"
                      >
                        Rechazar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => abrirModal(ausencia)}
                    className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-xs font-medium transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => toggleArchivar(ausencia.id, ausencia.archivada)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      ausencia.archivada
                        ? 'bg-sky-50 text-sky-700 hover:bg-sky-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {ausencia.archivada ? 'Desarchivar' : 'Archivar'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">{editando ? 'Editar Ausencia' : 'Nueva Ausencia'}</h2>
            </div>

            <form onSubmit={guardar} className="p-6 space-y-4">
              <div>
                <label className={labelClass}>Trabajador *</label>
                <select
                  value={form.trabajadorId}
                  onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {trabajadores.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.apellidos}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClass}>Tipo de Ausencia *</label>
                <select
                  value={form.tipoAusenciaId}
                  onChange={(e) => setForm({ ...form, tipoAusenciaId: e.target.value })}
                  className={inputClass}
                  required
                >
                  <option value="">Seleccionar...</option>
                  {tiposAusencia.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.nombre} {t.diasMaximo ? `(max ${t.diasMaximo} dias)` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Fecha Inicio *</label>
                  <input type="date" value={form.fechaInicio} onChange={(e) => setForm({ ...form, fechaInicio: e.target.value })} className={inputClass} required />
                </div>
                <div>
                  <label className={labelClass}>Fecha Fin *</label>
                  <input type="date" value={form.fechaFin} onChange={(e) => setForm({ ...form, fechaFin: e.target.value })} min={form.fechaInicio} className={inputClass} required />
                </div>
              </div>

              <div>
                <label className={labelClass}>Fecha Alta Real (Reincorporacion anticipada)</label>
                <input type="date" value={form.fechaAltaReal} onChange={(e) => setForm({ ...form, fechaAltaReal: e.target.value })} min={form.fechaInicio} max={form.fechaFin} className={inputClass} />
                <p className="text-xs text-gray-400 mt-1">Si el trabajador se reincorpora antes de la fecha prevista</p>
              </div>

              {esBajaMedica && (
                <>
                  <div>
                    <label className={labelClass}>Numero de Parte *</label>
                    <input type="text" value={form.numeroParte} onChange={(e) => setForm({ ...form, numeroParte: e.target.value })} placeholder="Ej: 123456789" className={inputClass} required />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={labelClass}>Contingencia *</label>
                      <select value={form.contingencia} onChange={(e) => setForm({ ...form, contingencia: e.target.value })} className={inputClass} required>
                        <option value="COMUN">Comun</option>
                        <option value="LABORAL">Laboral</option>
                      </select>
                    </div>
                    <div>
                      <label className={labelClass}>Entidad Emisora</label>
                      <input type="text" value={form.entidadEmisora} onChange={(e) => setForm({ ...form, entidadEmisora: e.target.value })} placeholder="INSS / Mutua" className={inputClass} />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className={labelClass}>Motivo</label>
                <textarea value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} rows="2" placeholder="Descripcion breve..." className={`${inputClass} resize-none`} />
              </div>

              <div>
                <label className={labelClass}>Observaciones</label>
                <textarea value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} rows="3" placeholder="Notas internas, informacion adicional..." className={`${inputClass} resize-none`} />
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors">
                  Cancelar
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors">
                  {editando ? 'Guardar Cambios' : 'Crear Ausencia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Ausencias;
