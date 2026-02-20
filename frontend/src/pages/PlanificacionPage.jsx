import React, { useEffect } from 'react';
import Modal from '../components/Modal';
import GenerarAsignacionesAutomaticas from './GenerarAsignacionesAutomaticas';
import VistaMensual from '../components/planificacion/VistaMensual';
import { useApiClient } from '../contexts/AuthContext';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePlanificacion } from '../hooks/usePlanificacion';

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

export default function PlanificacionPage() {
  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

  const api = useApiClient();
  const {
    centros,
    trabajadores,
    asignaciones,
    alertasGlobales,
    centroSeleccionado,
    setCentroSeleccionado,
    semanaOffset,
    setSemanaOffset,
    loading,
    busquedaCentro,
    setBusquedaCentro,
    clienteExpandido,
    setClienteExpandido,
    modalOpen,
    setModalOpen,
    diaSeleccionado,
    form,
    setForm,
    vistaActual,
    setVistaActual,
    mesActual,
    setMesActual,
    asignacionesMensuales,
    modalPlantillaOpen,
    setModalPlantillaOpen,
    formPlantilla,
    setFormPlantilla,
    guardandoPlantilla,
    ausenciasDiaModal,
    weekDates,
    diasSemana,
    abrirModal,
    guardarAsignacion,
    eliminarAsignacion,
    guardarComoPlantilla,
    getColorTrabajador,
    getAsignacionesDia,
    formatFecha,
    cargarAsignaciones
  } = usePlanificacion(api);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center bg-[#f0f4f8] p-5 lg:p-8" style={font}>
        <div className="flex items-center gap-2">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  if (centros.length === 0) {
    return (
      <div className="bg-[#f0f4f8] p-5 lg:p-8" style={font}>
        <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">No hay centros de trabajo</p>
          <p className="text-gray-400">Primero crea un cliente y un centro de trabajo en la sección "Clientes"</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Planificación</h1>
          <p className="text-gray-400 text-sm font-medium">Asigna trabajadores a los turnos</p>
        </div>

        <div className="flex flex-col sm:flex-row flex-wrap gap-3 w-full">
          {/* Selector de centro con búsqueda */}
          <div className="relative w-full lg:w-96">
            <input
              type="text"
              placeholder="Buscar empresa o centro..."
              value={busquedaCentro}
              onChange={(e) => setBusquedaCentro(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
            />

            {busquedaCentro && (
              <div className="absolute top-full mt-2 w-full bg-white border border-gray-200 rounded-xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] max-h-96 overflow-y-auto z-50">
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
                      <div className="p-4 text-center text-gray-500">
                        No se encontraron resultados
                      </div>
                    );
                  }

                  return resultados.map(grupo => (
                    <div key={grupo.cliente?.id} className="border-b border-gray-100 last:border-0">
                      <div
                        className="p-3 bg-gray-50 font-medium text-gray-700 cursor-pointer hover:bg-gray-100 transition-colors"
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
                              className={`p-3 pl-6 cursor-pointer hover:bg-teal-50 transition-colors ${centroSeleccionado?.id === centro.id ? 'bg-teal-100 text-teal-700 font-medium' : 'text-gray-600'
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
            <div className="px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 font-medium text-sm">
              {centroSeleccionado.cliente?.nombre} - {centroSeleccionado.nombre}
            </div>
          )}

          {/* Toggle Semanal / Mensual */}
          <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
            <button
              onClick={() => setVistaActual('semanal')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                vistaActual === 'semanal'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Semanal
            </button>
            <button
              onClick={() => setVistaActual('mensual')}
              className={`px-4 py-2.5 text-sm font-medium transition-colors ${
                vistaActual === 'mensual'
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              Mensual
            </button>
          </div>

          {/* Navegación semanas (solo vista semanal) */}
          {vistaActual === 'semanal' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSemanaOffset(s => s - 1)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={() => setSemanaOffset(0)}
                className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-sm font-medium transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => setSemanaOffset(s => s + 1)}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Navegación meses (solo vista mensual) */}
          {vistaActual === 'mensual' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setMesActual(prev => {
                  const d = new Date(prev.year, prev.month - 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium min-w-[160px] text-center capitalize">
                {new Date(mesActual.year, mesActual.month).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
              </span>
              <button
                onClick={() => setMesActual(prev => {
                  const d = new Date(prev.year, prev.month + 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                })}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          <GenerarAsignacionesAutomaticas
          onAsignacionesGeneradas={cargarAsignaciones}
           />
        </div>
      </div>
      {/* Toggle vista móvil/desktop */}
<div className="lg:hidden mb-4 flex gap-2 bg-white rounded-xl p-1 border border-gray-200">
  <button className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium">
    Vista Día
  </button>
  <button className="flex-1 px-4 py-2.5 text-gray-600 rounded-lg text-sm font-medium">
    Vista Semana
  </button>
</div>

      {/* Info del centro */}
      {centroSeleccionado && (
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-teal-800">{centroSeleccionado.nombre}</h2>
              <p className="text-sm text-teal-600">{centroSeleccionado.cliente?.nombre}</p>
            </div>
            <div className="text-right text-sm text-teal-600">
              <p>Horario: {centroSeleccionado.horarioApertura || '06:00'} - {centroSeleccionado.horarioCierre || '22:00'}</p>
            </div>
          </div>
        </div>
      )}



      {/* Vista Mensual */}
      {vistaActual === 'mensual' && (
        <VistaMensual
          asignaciones={asignacionesMensuales}
          mesActual={mesActual}
          onAbrirModal={abrirModal}
          onEliminarAsignacion={eliminarAsignacion}
          getColorTrabajador={getColorTrabajador}
          centroSeleccionado={centroSeleccionado}
          api={api}
        />
      )}

      {/* Calendario semanal */}
      {vistaActual === 'semanal' && (<>
      <div className="hidden lg:block bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider w-20">Semana</th>
                {weekDates.map((date, i) => {
                  const isToday = date.toDateString() === new Date().toDateString()
                  const isWeekend = i >= 5
                  return (
                    <th
                      key={i}
                      className={`text-center py-3 px-2 text-sm font-semibold min-w-[120px] ${isToday ? 'bg-teal-100 text-teal-700' :
                          isWeekend ? 'bg-gray-100 text-gray-500' : 'text-gray-500'
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
              <tr className="border-t border-gray-100">
                <td className="py-4 px-4 align-top">
                  <span className="text-sm font-medium text-gray-500">Turnos</span>
                </td>
                {weekDates.map((date, i) => {
                  const asignacionesDia = getAsignacionesDia(date)
                  const isWeekend = i >= 5
                  return (
                    <td
  key={i}
  className={`py-2 px-2 align-top border-l border-gray-100 ${isWeekend ? 'bg-gray-50' : ''}`}
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
            borderLeft: `4px solid ${color === '#3b82f6' ? '#0d9488' : color}`,
            backgroundColor: color === '#ef4444' ? '#fee2e2' :
              color === '#eab308' ? '#fef3c7' :
              color === '#9ca3af' ? '#f3f4f6' : '#ccfbf1',
            borderTop: `1px solid ${color === '#3b82f6' ? '#0d9488' : color}`,
            borderRight: `1px solid ${color === '#3b82f6' ? '#0d9488' : color}`,
            borderBottom: `1px solid ${color === '#3b82f6' ? '#0d9488' : color}`
          }}
        >
                            <button
                              onClick={() => eliminarAsignacion(asig.id)}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              ×
                            </button>
                            <p className="font-medium text-teal-800 truncate">
                              {asig.trabajador?.nombre} {asig.trabajador?.apellidos?.split(' ')[0]}
                            </p>
                            <p className="text-teal-600">
                              {asig.horaInicio} - {asig.horaFin}
                            </p>
                          </div>

                        );})}
                        <button
                          onClick={() => abrirModal(date)}
                          className="w-full py-2 text-teal-600 hover:text-teal-700 hover:bg-gray-100 rounded-lg transition-colors text-sm font-medium"
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
      {/* Vista móvil - Por día */}
<div className="lg:hidden space-y-3">
  {weekDates.map((date, i) => {
    const asignacionesDia = getAsignacionesDia(date);
    const isToday = date.toDateString() === new Date().toDateString();
    const isWeekend = i >= 5;

    return (
      <div key={i} className={`bg-white rounded-2xl overflow-hidden shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] ${
        isToday ? 'ring-2 ring-teal-500' : ''
      }`}>
        <div className={`p-4 ${
          isWeekend ? 'bg-gray-100' : isToday ? 'bg-teal-50' : 'bg-gray-50'
        }`}>
          <h3 className="font-bold text-lg text-gray-900">
            {diasSemana[i]} {date.getDate()}
          </h3>
          <p className="text-sm text-gray-500">{formatFecha(date)}</p>
        </div>

        <div className="p-4 space-y-2">
          {asignacionesDia.length === 0 ? (
            <p className="text-center text-gray-400 py-4">Sin turnos</p>
          ) : (
            asignacionesDia.map(asig => {
              const estaCancelado = asig.estado === 'CANCELADO';
              const color = estaCancelado ? '#9ca3af' : getColorTrabajador(asig.trabajadorId, date);

              return (
                <div
                  key={asig.id}
                  className={`rounded-xl p-3 ${estaCancelado ? 'opacity-50' : ''}`}
                  style={{
                    borderLeft: `4px solid ${color}`,
                    backgroundColor: color === '#ef4444' ? '#fee2e2' :
                      color === '#eab308' ? '#fef3c7' :
                      color === '#9ca3af' ? '#f3f4f6' : '#ccfbf1',
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-800">
                        {asig.trabajador?.nombre} {asig.trabajador?.apellidos}
                      </p>
                      <p className="text-sm text-gray-600">
                        {asig.horaInicio} - {asig.horaFin}
                      </p>
                    </div>
                    <button
                      onClick={() => eliminarAsignacion(asig.id)}
                      className="px-3 py-1 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-sm font-medium transition-colors"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <button
            onClick={() => abrirModal(date)}
            className="w-full py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 transition-all"
          >
            + Añadir turno
          </button>
        </div>
      </div>
    );
  })}
</div>

</>)}
      {/* Leyenda */}
      <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] p-4">
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 bg-teal-100 border-l-4 border-teal-500 rounded"></span>
          <strong>Disponible</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 bg-amber-100 border-l-4 border-amber-500 rounded"></span>
          <strong>Baja Pendiente</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-5 h-5 bg-rose-100 border-l-4 border-rose-500 rounded"></span>
          <strong>Baja Confirmada - Requiere Suplencia</strong>
        </span>
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 bg-gray-100 rounded"></span>
          Fin de semana
        </span>
      </div>
      {/* Semanas Archivadas */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Centros - Estado Actual</h2>
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

              const bgColor = colorCliente === 'rojo' ? 'bg-rose-50 border-rose-200' :
                colorCliente === 'amarillo' ? 'bg-amber-50 border-amber-200' :
                  'bg-emerald-50 border-emerald-200';

              const textColor = colorCliente === 'rojo' ? 'text-rose-800' :
                colorCliente === 'amarillo' ? 'text-amber-800' :
                  'text-emerald-800';

              return (
                <div key={grupo.cliente?.id} className={`border rounded-2xl overflow-hidden ${bgColor}`}>
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
                        <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${colorCliente === 'rojo' ? 'bg-rose-200 text-rose-900' :
                            colorCliente === 'amarillo' ? 'bg-amber-200 text-amber-900' :
                              'bg-emerald-200 text-emerald-900'
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
                        const bgCentro = centro.estado === 'rojo' ? 'bg-rose-50 hover:bg-rose-100' :
                          centro.estado === 'amarillo' ? 'bg-amber-50 hover:bg-amber-100' :
                            'bg-emerald-50 hover:bg-emerald-100';

                        const textCentro = centro.estado === 'rojo' ? 'text-rose-700' :
                          centro.estado === 'amarillo' ? 'text-amber-700' :
                            'text-emerald-700';

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
                    <label className="text-sm font-medium text-teal-600 mb-2 block mt-3">
                      Trabajadores Habituales
                    </label>
                    <select
                      value={form.trabajadorId}
                      onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all mb-3"
                    >
                      <option value="">Seleccionar...</option>
                      {habituales.map(t => {
  const ausencia = ausenciasDiaModal.find(a => a.trabajadorId === t.id);

  // Determinar color de fondo según estado de ausencia en ese día
  let backgroundColor = '#ccfbf1'; // Teal claro - disponible
  let estadoTexto = '';

  if (ausencia?.estado === 'APROBADA') {
    backgroundColor = '#fee2e2'; // Rojo claro - en baja
    estadoTexto = ` - 🔴 En baja: ${ausencia.tipoAusencia?.nombre || 'Ausencia'}`;
  } else if (ausencia?.estado === 'PENDIENTE') {
    backgroundColor = '#fef3c7'; // Amarillo claro - pendiente
    estadoTexto = ` - ⚠️ ${ausencia.tipoAusencia?.nombre || 'Pendiente'}`;
  }

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
            <label className="text-sm font-medium text-gray-500 mb-2 block">
              Otros Trabajadores
            </label>
            <select
  value={form.trabajadorId}
  onChange={(e) => setForm({ ...form, trabajadorId: e.target.value })}
  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
  required={trabajadores.filter(t => t.centrosAsignados?.some(ca => ca.centroId === centroSeleccionado?.id && ca.esHabitual)).length === 0}
>
  <option value="">Seleccionar...</option>
  {trabajadores
    .filter(t => !t.centrosAsignados?.some(ca => ca.centroId === centroSeleccionado?.id && ca.esHabitual))
    .map(t => {
      const ausencia = ausenciasDiaModal.find(a => a.trabajadorId === t.id);

      // Determinar color de fondo según estado de ausencia en ese día
      let backgroundColor = '#ccfbf1'; // Teal claro - disponible
      let estadoTexto = '';

      if (ausencia?.estado === 'APROBADA') {
        backgroundColor = '#fee2e2'; // Rojo claro - en baja
        estadoTexto = ` - 🔴 En baja: ${ausencia.tipoAusencia?.nombre || 'Ausencia'}`;
      } else if (ausencia?.estado === 'PENDIENTE') {
        backgroundColor = '#fef3c7'; // Amarillo claro - pendiente
        estadoTexto = ` - ⚠️ ${ausencia.tipoAusencia?.nombre || 'Pendiente'}`;
      }

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
          </div>


          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">Hora inicio *</label>
              <input
  type="time"
  value={form.horaInicio}
  onChange={(e) => setForm({ ...form, horaInicio: e.target.value })}
  min={centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' ? '00:00' : centroSeleccionado?.horariosLimpieza?.[0]?.inicio || '06:00'}
  max={centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' ? '23:59' : centroSeleccionado?.horariosLimpieza?.[0]?.fin || '22:00'}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
  {centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE'
    ? 'Horario flexible'
    : `Rango: ${centroSeleccionado?.horariosLimpieza?.[0]?.inicio || '06:00'} - ${centroSeleccionado?.horariosLimpieza?.[0]?.fin || '22:00'}`
  }
</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500 mb-2 block">Hora fin *</label>
              <input
                type="time"
                value={form.horaFin}
                onChange={(e) => setForm({ ...form, horaFin: e.target.value })}
                min={centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' ? '00:00' : centroSeleccionado?.horariosLimpieza?.[0]?.inicio || '06:00'}
  max={centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE' ? '23:59' : centroSeleccionado?.horariosLimpieza?.[0]?.fin || '22:00'}
                className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
  {centroSeleccionado?.tipoHorarioLimpieza === 'FLEXIBLE'
    ? 'Horario flexible'
    : `Rango: ${centroSeleccionado?.horariosLimpieza?.[0]?.inicio || '06:00'} - ${centroSeleccionado?.horariosLimpieza?.[0]?.fin || '22:00'}`
  }
</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
            <p><strong>Centro:</strong> {centroSeleccionado?.nombre}</p>
            <p><strong>Fecha:</strong> {diaSeleccionado?.toLocaleDateString('es-ES')}</p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-all"
            >
              Crear Turno
            </button>
          </div>
        </form>
      </Modal>
      {/* Modal guardar plantilla */}
      {modalPlantillaOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] w-full max-w-lg">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-extrabold tracking-tight text-gray-900">Guardar como Plantilla</h2>
              <button
                onClick={() => setModalPlantillaOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              >
                &times;
              </button>
            </div>
            <form onSubmit={guardarComoPlantilla} className="p-6 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Nombre de la plantilla *
                </label>
                <input
                  type="text"
                  value={formPlantilla.nombre}
                  onChange={(e) => setFormPlantilla({ ...formPlantilla, nombre: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                  placeholder="Ej: Semana típica UVESA"
                  required
                />
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500 mb-2 block">
                  Descripción (opcional)
                </label>
                <textarea
                  value={formPlantilla.descripcion}
                  onChange={(e) => setFormPlantilla({ ...formPlantilla, descripcion: e.target.value })}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all"
                  rows="3"
                  placeholder="Describe esta plantilla..."
                />
              </div>

              <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                <p><strong>Centro:</strong> {centroSeleccionado?.nombre}</p>
                <p><strong>Periodo:</strong> {weekDates[0].toLocaleDateString('es-ES')} - {weekDates[6].toLocaleDateString('es-ES')}</p>
                <p><strong>Turnos:</strong> {asignaciones.length}</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setModalPlantillaOpen(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={guardandoPlantilla}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-all disabled:opacity-50"
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
