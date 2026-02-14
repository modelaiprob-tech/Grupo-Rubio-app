import React, { useState, useEffect, useCallback } from 'react';

// Helper: formatear fecha como YYYY-MM-DD en zona local (evita bug de timezone con toISOString)
function formatDateLocal(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getMonthDates(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Encontrar el lunes anterior o igual al primer día
  const startDate = new Date(firstDay);
  const dayOfWeek = startDate.getDay();
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  startDate.setDate(startDate.getDate() + diff);

  const dates = [];
  const current = new Date(startDate);
  while (dates.length < 42) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
    // Parar si ya pasamos el último día y completamos la semana
    if (current > lastDay && current.getDay() === 1 && dates.length >= 28) break;
  }

  return dates;
}

const diasSemana = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

export default function VistaMensual({
  asignaciones,
  mesActual,
  onAbrirModal,
  onEliminarAsignacion,
  getColorTrabajador,
  centroSeleccionado,
  api
}) {
  const [expandedDay, setExpandedDay] = useState(null);
  const [ausenciasMes, setAusenciasMes] = useState([]);
  const dates = getMonthDates(mesActual.year, mesActual.month);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Cargar ausencias para todo el mes
  useEffect(() => {
    if (!api) return;
    const cargarAusenciasMes = async () => {
      try {
        const ausencias = await api.get('/ausencias');
        const firstDate = dates[0];
        const lastDate = dates[dates.length - 1];
        const activas = ausencias.filter(a => {
          const inicio = new Date(a.fechaInicio);
          inicio.setHours(0, 0, 0, 0);
          const fin = a.fechaAltaReal ? new Date(a.fechaAltaReal) : new Date(a.fechaFin);
          fin.setHours(23, 59, 59, 999);
          return inicio <= lastDate && fin >= firstDate;
        });
        setAusenciasMes(activas);
      } catch (err) {
        console.error('Error cargando ausencias mensuales:', err);
      }
    };
    cargarAusenciasMes();
  }, [mesActual.year, mesActual.month]);

  // Color que tiene en cuenta ausencias del mes
  const getColorConAusencias = useCallback((trabajadorId, fecha) => {
    const fechaBusqueda = new Date(fecha);
    fechaBusqueda.setHours(12, 0, 0, 0);
    const ausencia = ausenciasMes.find(a => {
      const inicio = new Date(a.fechaInicio);
      inicio.setHours(0, 0, 0, 0);
      const fin = a.fechaAltaReal ? new Date(a.fechaAltaReal) : new Date(a.fechaFin);
      fin.setHours(23, 59, 59, 999);
      return a.trabajadorId === trabajadorId && fechaBusqueda >= inicio && fechaBusqueda <= fin;
    });
    if (ausencia?.estado === 'APROBADA') return '#ef4444'; // Rojo
    if (ausencia?.estado === 'PENDIENTE') return '#eab308'; // Amarillo
    return '#3b82f6'; // Azul - disponible
  }, [ausenciasMes]);

  const getAsignacionesDia = (fecha) => {
    const fechaStr = formatDateLocal(fecha);
    return asignaciones.filter(a => a.fecha.split('T')[0] === fechaStr);
  };

  const isCurrentMonth = (date) => date.getMonth() === mesActual.month;
  const isToday = (date) => date.toDateString() === today.toDateString();
  const isWeekend = (date) => date.getDay() === 0 || date.getDay() === 6;

  // Agrupar dates en semanas de 7
  const weeks = [];
  for (let i = 0; i < dates.length; i += 7) {
    weeks.push(dates.slice(i, i + 7));
  }

  return (
    <>
      {/* Vista desktop */}
      <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header días */}
        <div className="grid grid-cols-7 border-b border-slate-200">
          {diasSemana.map((dia, i) => (
            <div
              key={dia}
              className={`py-3 text-center text-sm font-semibold ${
                i >= 5 ? 'text-slate-400 bg-slate-50' : 'text-slate-600'
              }`}
            >
              {dia}
            </div>
          ))}
        </div>

        {/* Grid de días */}
        {weeks.map((week, weekIdx) => (
          <div key={weekIdx} className="grid grid-cols-7 border-b border-slate-100 last:border-0">
            {week.map((date, dayIdx) => {
              const asigsDia = getAsignacionesDia(date);
              const inMonth = isCurrentMonth(date);
              const todayClass = isToday(date);
              const weekend = isWeekend(date);
              const MAX_VISIBLE = 3;
              const visibles = asigsDia.slice(0, MAX_VISIBLE);
              const restantes = asigsDia.length - MAX_VISIBLE;
              const isExpanded = expandedDay === formatDateLocal(date);

              return (
                <div
                  key={dayIdx}
                  className={`min-h-[120px] p-1.5 border-r border-slate-100 last:border-r-0 transition-colors ${
                    !inMonth ? 'bg-slate-50/50 opacity-40' :
                    todayClass ? 'bg-blue-50/50' :
                    weekend ? 'bg-slate-50/30' : ''
                  }`}
                >
                  {/* Número del día */}
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm font-medium px-1.5 py-0.5 rounded-lg ${
                        todayClass
                          ? 'bg-blue-500 text-white'
                          : inMonth ? 'text-slate-700' : 'text-slate-300'
                      }`}
                    >
                      {date.getDate()}
                    </span>
                    {inMonth && centroSeleccionado && (
                      <button
                        onClick={() => onAbrirModal(date)}
                        className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors text-xs"
                      >
                        +
                      </button>
                    )}
                  </div>

                  {/* Asignaciones */}
                  <div className="space-y-0.5">
                    {(isExpanded ? asigsDia : visibles).map(asig => {
                      const estaCancelado = asig.estado === 'CANCELADO';
                      const color = estaCancelado ? '#9ca3af' : getColorConAusencias(asig.trabajadorId, date);

                      return (
                        <div
                          key={asig.id}
                          className={`text-[11px] rounded px-1.5 py-1 group relative cursor-default flex items-center justify-between gap-1 ${
                            estaCancelado ? 'opacity-50' : ''
                          }`}
                          style={{
                            borderLeft: `3px solid ${color}`,
                            backgroundColor: color === '#ef4444' ? '#fee2e2' :
                              color === '#eab308' ? '#fef3c7' :
                              color === '#9ca3af' ? '#f3f4f6' : '#dbeafe',
                          }}
                          title={`${asig.trabajador?.nombre} ${asig.trabajador?.apellidos} | ${asig.horaInicio}-${asig.horaFin}${color === '#ef4444' ? ' (En baja)' : color === '#eab308' ? ' (Baja pendiente)' : ''}`}
                        >
                          <div className="truncate">
                            <span className="font-medium">{asig.trabajador?.nombre}</span>
                            <span className="ml-1 opacity-75">{asig.horaInicio}-{asig.horaFin}</span>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onEliminarAsignacion(asig.id); }}
                            className="flex-shrink-0 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}

                    {restantes > 0 && !isExpanded && (
                      <button
                        onClick={() => setExpandedDay(formatDateLocal(date))}
                        className="text-[10px] text-blue-500 hover:text-blue-700 font-medium px-1.5"
                      >
                        +{restantes} más
                      </button>
                    )}
                    {isExpanded && asigsDia.length > MAX_VISIBLE && (
                      <button
                        onClick={() => setExpandedDay(null)}
                        className="text-[10px] text-slate-400 hover:text-slate-600 font-medium px-1.5"
                      >
                        Ver menos
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Vista móvil - lista por día */}
      <div className="lg:hidden space-y-3">
        {dates.filter(d => isCurrentMonth(d)).map((date, i) => {
          const asigsDia = getAsignacionesDia(date);
          const todayClass = isToday(date);
          const weekend = isWeekend(date);
          const dayOfWeek = date.getDay();
          const diaLabel = diasSemana[dayOfWeek === 0 ? 6 : dayOfWeek - 1];

          if (asigsDia.length === 0 && !todayClass) return null;

          return (
            <div key={i} className={`bg-white rounded-xl border-2 overflow-hidden ${
              todayClass ? 'border-blue-500' : 'border-slate-200'
            }`}>
              <div className={`p-3 ${
                weekend ? 'bg-slate-100' : todayClass ? 'bg-blue-50' : 'bg-slate-50'
              }`}>
                <h3 className="font-bold">
                  {diaLabel} {date.getDate()}
                </h3>
                <p className="text-sm text-slate-600">
                  {date.toLocaleDateString('es-ES', { month: 'long' })}
                </p>
              </div>
              <div className="p-3 space-y-2">
                {asigsDia.length === 0 ? (
                  <p className="text-center text-slate-400 py-2 text-sm">Sin turnos</p>
                ) : (
                  asigsDia.map(asig => {
                    const estaCancelado = asig.estado === 'CANCELADO';
                    const color = estaCancelado ? '#9ca3af' : getColorConAusencias(asig.trabajadorId, date);
                    return (
                      <div
                        key={asig.id}
                        className={`rounded-lg p-3 ${estaCancelado ? 'opacity-50' : ''}`}
                        style={{
                          borderLeft: `4px solid ${color}`,
                          backgroundColor: color === '#ef4444' ? '#fee2e2' :
                            color === '#eab308' ? '#fef3c7' :
                            color === '#9ca3af' ? '#f3f4f6' : '#dbeafe',
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-slate-800 text-sm">
                              {asig.trabajador?.nombre} {asig.trabajador?.apellidos}
                            </p>
                            <p className="text-xs text-slate-600">
                              {asig.horaInicio} - {asig.horaFin}
                            </p>
                          </div>
                          <button
                            onClick={() => onEliminarAsignacion(asig.id)}
                            className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
                {centroSeleccionado && (
                  <button
                    onClick={() => onAbrirModal(date)}
                    className="w-full py-2 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 text-sm"
                  >
                    + Añadir turno
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
