import { useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import { useInformes } from '../hooks/useInformes';
import InformeNominaDetallada from './InformeNominaDetallada';
import InformacionTrabajador from './InformacionTrabajador';

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

function Informes() {
  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

  const api = useApiClient();
  const {
    tipoInforme,
    setTipoInforme,
    loading,
    datos,
    fecha,
    setFecha,
    mes,
    setMes,
    año,
    setAño,
    trabajadorId,
    setTrabajadorId,
    clienteId,
    setClienteId,
    fechaFin,
    setFechaFin,
    trabajadores,
    clientes,
    generarInforme,
    volver
  } = useInformes(api);

return (
  <div className="bg-[#f0f4f8] min-h-screen p-5 lg:p-8" style={font}>
    {/* HEADER */}
    <div className="mb-8">
      <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Informes y Reportes</h1>
      <p className="text-gray-400 text-sm font-medium mt-1">Selecciona el tipo de informe que deseas generar</p>
    </div>

    {/* Si NO hay informe seleccionado -> Mostrar las 4 tarjetas */}
    {!tipoInforme ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TARJETA 1: Estado Diario de Trabajadores */}
        <button
          onClick={() => setTipoInforme('estado-trabajadores')}
          className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 text-left cursor-pointer border-l-4 border-teal-500"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-teal-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Estado Diario de Trabajadores</h2>
              <p className="text-sm text-gray-500 mt-1">
                Consulta el estado de cada trabajador por dia: horas trabajadas, ausencias y disponibilidad
              </p>
            </div>
          </div>
        </button>

        {/* TARJETA 2: Info Trabajador */}
        <button
          onClick={() => setTipoInforme('info-trabajador')}
          className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 text-left cursor-pointer border-l-4 border-emerald-500"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Informacion del Trabajador</h2>
              <p className="text-sm text-gray-500 mt-1">
                Vista completa: distribucion por cliente, horas detalladas y nomina en un solo lugar
              </p>
            </div>
          </div>
        </button>

        {/* TARJETA 3: Horas por Cliente */}
        <button
          onClick={() => setTipoInforme('horas-cliente')}
          className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 text-left cursor-pointer border-l-4 border-violet-500"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Horas por Cliente</h2>
              <p className="text-sm text-gray-500 mt-1">
                Total de horas y costes por cliente para facturacion y analisis de rentabilidad
              </p>
            </div>
          </div>
        </button>

        {/* TARJETA 4: Calendario Empresa */}
        <button
          onClick={() => setTipoInforme('calendario-empresa')}
          className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 text-left cursor-pointer border-l-4 border-cyan-500"
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-cyan-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Calendario Semanal por Empresa</h2>
              <p className="text-sm text-gray-500 mt-1">
                Vista matricial del estado de trabajadores por dia: quien trabaja, quien esta de baja, vacaciones, etc.
              </p>
            </div>
          </div>
        </button>
      </div>
    ) : (
      /* Si hay un informe seleccionado -> Mostrar filtros y resultados */
      <div className="space-y-6">
        {/* Boton VOLVER */}
        <button
          onClick={volver}
          className="flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-900 font-medium transition-all"
        >
          <span className="text-xl">&larr;</span>
          <span className="font-medium">Volver a Informes</span>
        </button>

        {/* Panel de filtros - NO mostrar para nomina detallada */}
{tipoInforme !== 'nomina-detallada' && tipoInforme !== 'info-trabajador' && (
          <div className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]">
            <h2 className="text-xl font-extrabold tracking-tight text-gray-900 mb-4">
              {tipoInforme === 'estado-trabajadores' && 'Estado Diario de Trabajadores'}
              {tipoInforme === 'horas-trabajador' && 'Horas por Trabajador'}
              {tipoInforme === 'horas-cliente' && 'Horas por Cliente'}
              {tipoInforme === 'resumen-ausencias' && 'Analisis de Ausencias'}
            </h2>

            {/* FILTROS ESPECIFICOS POR TIPO */}
            <div className="space-y-4">
              {tipoInforme === 'estado-trabajadores' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Fecha</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    />
                  </div>
                </div>
              )}


              {tipoInforme === 'horas-cliente' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Cliente</label>
                    <select
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    >
                      <option value="">Seleccionar...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Mes</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>
                          {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Ano</label>
                    <input
                      type="number"
                      value={año}
                      onChange={(e) => setAño(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    />
                  </div>
                </div>
              )}

              {tipoInforme === 'resumen-ausencias' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Mes</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(parseInt(e.target.value))}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>
                          {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Ano</label>
                    <input
                      type="number"
                      value={año}
                      onChange={(e) => setAño(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    />
                  </div>
                </div>
              )}

              {tipoInforme === 'calendario-empresa' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Cliente/Empresa</label>
                    <select
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    >
                      <option value="">Seleccionar...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Desde</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin || fecha}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Boton de accion */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={generarInforme}
                  disabled={loading}
                  className="flex-1 px-6 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Generando...' : 'Generar Informe'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VISUALIZACION DE RESULTADOS */}
        {loading && (
          <div className="bg-white rounded-2xl p-12 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-4">
              {[0, 150, 300].map(d => (
                <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
              ))}
            </div>
            <p className="text-gray-500 text-sm font-medium">Generando informe...</p>
          </div>
        )}

        {/* INFO TRABAJADOR - Renderizado independiente */}
{tipoInforme === 'info-trabajador' && (
  <InformacionTrabajador />
)}

        {/* RESTO DE INFORMES - Requieren generar datos */}
        {datos && !loading && tipoInforme !== 'nomina-detallada' && (
          <div>
            {tipoInforme === 'estado-trabajadores' && (
              <InformeEstadoTrabajadores datos={datos} />
            )}
            {tipoInforme === 'horas-cliente' && (
              <InformeHorasCliente datos={datos} />
            )}
            {tipoInforme === 'resumen-ausencias' && (
              <InformeAusencias datos={datos} />
            )}
            {tipoInforme === 'calendario-empresa' && (
              <InformeCalendarioEmpresa datos={datos} />
            )}
          </div>
        )}
      </div>
    )}
  </div>
);
}

// ============================================
// COMPONENTES DE VISUALIZACION
// ============================================

function InformeEstadoTrabajadores({ datos }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Estado de Trabajadores - {datos.fecha}</h2>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="rounded-xl p-4 text-center bg-gray-50">
          <span className="text-2xl font-extrabold text-gray-900">{datos.resumen.totalActivos}</span>
          <span className="text-xs font-medium mt-1 block text-gray-500">Total Activos</span>
        </div>
        <div className="rounded-xl p-4 text-center bg-emerald-50">
          <span className="text-2xl font-extrabold text-emerald-700">{datos.resumen.disponibles}</span>
          <span className="text-xs font-medium mt-1 block text-emerald-600">Disponibles</span>
        </div>
        <div className="rounded-xl p-4 text-center bg-rose-50">
          <span className="text-2xl font-extrabold text-rose-700">{datos.resumen.enBajaMedica}</span>
          <span className="text-xs font-medium mt-1 block text-rose-600">Bajas Medicas</span>
        </div>

        <div className="rounded-xl p-4 text-center bg-cyan-50">
          <span className="text-2xl font-extrabold text-cyan-700">{datos.resumen.enVacaciones}</span>
          <span className="text-xs font-medium mt-1 block text-cyan-600">Vacaciones</span>
        </div>
        <div className="rounded-xl p-4 text-center bg-amber-50">
          <span className="text-2xl font-extrabold text-amber-700">{datos.resumen.conPermisos}</span>
          <span className="text-xs font-medium mt-1 block text-amber-600">Otros Permisos</span>
        </div>
        <div className="rounded-xl p-4 text-center bg-violet-50">
          <span className="text-2xl font-extrabold text-violet-700">{datos.resumen.pendientesAprobacion}</span>
          <span className="text-xs font-medium mt-1 block text-violet-600">Pendientes Aprobar</span>
        </div>
      </div>


      {datos.detalles.bajasMedicas.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Bajas Medicas</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Trabajador</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Tipo</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Desde</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Hasta</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Dias</th>
                </tr>
              </thead>
              <tbody>
                {datos.detalles.bajasMedicas.map((baja, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-gray-700 border-b border-gray-50">{baja.trabajador.nombre} {baja.trabajador.apellidos}</td>
                    <td className="p-3 text-gray-700 border-b border-gray-50">{baja.tipoAusencia.nombre}</td>
                    <td className="p-3 text-gray-700 border-b border-gray-50">{new Date(baja.fechaInicio).toLocaleDateString('es-ES')}</td>
                    <td className="p-3 text-gray-700 border-b border-gray-50">{new Date(baja.fechaFin).toLocaleDateString('es-ES')}</td>
                    <td className="p-3 text-gray-700 border-b border-gray-50">{baja.diasTotales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {datos.detalles.vacaciones.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Vacaciones</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Trabajador</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Desde</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Hasta</th>
                  <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Dias</th>
                </tr>
              </thead>
              <tbody>
                {datos.detalles.vacaciones.map((vac, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-3 text-gray-700 border-b border-gray-50">{vac.trabajador.nombre} {vac.trabajador.apellidos}</td>
                    <td className="p-3 text-gray-700 border-b border-gray-50">{new Date(vac.fechaInicio).toLocaleDateString('es-ES')}</td>
                    <td className="p-3 text-gray-700 border-b border-gray-50">{new Date(vac.fechaFin).toLocaleDateString('es-ES')}</td>
                    <td className="p-3 text-gray-700 border-b border-gray-50">{vac.diasTotales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}





function InformeAusencias({ datos }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Resumen de Ausencias</h2>
      <p className="text-gray-500 text-sm mt-1 mb-4">{datos.periodo.mesNombre} {datos.periodo.año}</p>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="rounded-xl p-4 text-center bg-gray-50">
          <span className="text-2xl font-extrabold text-gray-900">{datos.resumen.totalAusencias}</span>
          <span className="text-xs font-medium mt-1 block text-gray-500">Total Ausencias</span>
        </div>
        <div className="rounded-xl p-4 text-center bg-teal-50">
          <span className="text-2xl font-extrabold text-teal-700">{datos.resumen.totalDias}</span>
          <span className="text-xs font-medium mt-1 block text-teal-600">Total Dias</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Por Tipo de Ausencia</h3>
        {datos.porTipo.map((tipo, idx) => (
          <div key={idx} className="mb-4">
            <div
              className="p-3 rounded-xl bg-gray-50 mb-2 flex items-center justify-between"
              style={{ borderLeft: `4px solid ${tipo.color}` }}
            >
              <h4 className="font-semibold text-gray-900 text-sm">{tipo.tipo}</h4>
              <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">{tipo.cantidad} ausencias | {tipo.totalDias} dias</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Trabajador</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Desde</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Hasta</th>
                    <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Dias</th>
                  </tr>
                </thead>
                <tbody>
                  {tipo.trabajadores.map((trab, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-3 text-gray-700 border-b border-gray-50">{trab.nombre}</td>
                      <td className="p-3 text-gray-700 border-b border-gray-50">{trab.fechaInicio}</td>
                      <td className="p-3 text-gray-700 border-b border-gray-50">{trab.fechaFin}</td>
                      <td className="p-3 text-gray-700 border-b border-gray-50">{trab.dias}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// COMPONENTE: Informe Calendario Empresa
// ============================================
function InformeCalendarioEmpresa({ datos }) {
  const getColorCelda = (color) => {
    switch(color) {
      case 'verde': return 'bg-green-100 border-green-300 text-green-800';
      case 'rojo': return 'bg-red-100 border-red-300 text-red-800';
      case 'amarillo': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
      case 'azul': return 'bg-blue-100 border-blue-300 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-400';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Calendario Semanal - {datos.cliente?.nombre}</h2>
      <p className="text-gray-500 text-sm mt-1 mb-4">
        {new Date(datos.fechaInicio).toLocaleDateString('es-ES')} - {new Date(datos.fechaFin).toLocaleDateString('es-ES')}
      </p>

      {/* LEYENDA */}
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3 text-sm">Leyenda:</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center text-green-800 font-bold text-sm">X</div>
            <span className="text-sm text-gray-500">Trabaja</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center text-blue-800 font-bold text-sm">V</div>
            <span className="text-sm text-gray-500">Vacaciones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center text-red-800 font-bold text-sm">BM</div>
            <span className="text-sm text-gray-500">Baja Medica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center text-red-800 font-bold text-sm">A</div>
            <span className="text-sm text-gray-500">Otra Ausencia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-300 rounded flex items-center justify-center text-yellow-800 font-bold text-sm">BP</div>
            <span className="text-sm text-gray-500">Baja Pendiente</span>
          </div>
        </div>
      </div>

      {/* TABLA CALENDARIO */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-50">
              <th className="border border-gray-200 px-4 py-3 text-left font-semibold text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[200px]">
                Trabajador
              </th>
              {datos.fechas.map((fecha, idx) => {
                const date = new Date(fecha + 'T00:00:00');
                const diaSemana = date.toLocaleDateString('es-ES', { weekday: 'short' });
                const dia = date.getDate();
                const mes = date.toLocaleDateString('es-ES', { month: 'short' });

                return (
                  <th key={idx} className="border border-gray-200 px-3 py-3 text-center min-w-[80px]">
                    <div className="font-semibold text-gray-700 text-sm">{diaSemana}</div>
                    <div className="text-xs text-gray-400">{dia} {mes}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {datos.trabajadores.map((trabajador, idx) => (
              <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                <td className="border border-gray-200 px-4 py-3 font-medium text-gray-700 sticky left-0 bg-white z-10">
                  {trabajador.apellidos}, {trabajador.nombre}
                </td>
                {datos.fechas.map((fecha, fIdx) => {
                  const dia = trabajador.dias[fecha];
                  return (
                    <td
                      key={fIdx}
                      className={`border border-gray-200 px-3 py-3 text-center ${getColorCelda(dia?.color)}`}
                      title={dia?.tipo || dia?.centro || ''}
                    >
                      <div className="font-bold text-sm">{dia?.codigo || '-'}</div>
                      {dia?.horario && (
  <div className="text-xs mt-1 whitespace-pre-line">{dia.horario}</div>
)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InformeHorasCliente({ datos }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]">
      <h2 className="text-lg font-bold text-gray-900 mb-1">Informe de Facturacion - {datos.cliente.nombre}</h2>
      <p className="text-gray-500 text-sm mt-1 mb-4">{datos.periodo.mesNombre} {datos.periodo.año}</p>

      <div className="text-sm text-gray-500 mb-4">
        <p><strong className="text-gray-700">CIF:</strong> {datos.cliente.cif}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <div className="rounded-xl p-4 text-center bg-gray-50">
          <span className="text-2xl font-extrabold text-gray-900">{datos.totales.totalHoras}h</span>
          <span className="text-xs font-medium mt-1 block text-gray-500">Total Horas</span>
        </div>
        <div className="rounded-xl p-4 text-center bg-teal-50">
          <span className="text-2xl font-extrabold text-teal-700">{datos.totales.costeTotal.toFixed(2)}&euro;</span>
          <span className="text-xs font-medium mt-1 block text-teal-600">Coste Total</span>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4">Desglose por Centro</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Centro</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Total Horas</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Normales</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Extras</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Nocturnas</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Festivas</th>
                <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider border-b border-gray-200">Coste</th>
              </tr>
            </thead>
            <tbody>
              {datos.desglosePorCentro.map((centro, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="p-3 text-gray-700 border-b border-gray-50">{centro.centro}</td>
                  <td className="p-3 text-gray-700 border-b border-gray-50"><strong>{centro.totalHoras}h</strong></td>
                  <td className="p-3 text-gray-700 border-b border-gray-50">{centro.horasNormales}h</td>
                  <td className="p-3 text-gray-700 border-b border-gray-50">{centro.horasExtras}h</td>
                  <td className="p-3 text-gray-700 border-b border-gray-50">{centro.horasNocturnas}h</td>
                  <td className="p-3 text-gray-700 border-b border-gray-50">{centro.horasFestivas}h</td>
                  <td className="p-3 text-gray-700 border-b border-gray-50"><strong>{centro.costeTotal.toFixed(2)}&euro;</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
export default Informes;
