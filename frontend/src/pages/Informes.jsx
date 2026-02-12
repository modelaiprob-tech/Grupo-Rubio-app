import { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import './Informes.css';
import InformeNominaDetallada from './InformeNominaDetallada';
import InformacionTrabajador from './InformacionTrabajador';

function Informes() {
  const api = useApiClient();
  const [tipoInforme, setTipoInforme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState(null);

  // Filtros
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [trabajadorId, setTrabajadorId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [fechaFin, setFechaFin] = useState(
  new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
); // 7 días por defecto
  
  // Listas para selects
  const [trabajadores, setTrabajadores] = useState([]);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    cargarListas();
  }, []);

  const cargarListas = async () => {
    try {
      const [trabData, cliData] = await Promise.all([
        api.get('/trabajadores?activo=true'),
        api.get('/clientes')
      ]);
      setTrabajadores(trabData);
      setClientes(cliData);
    } catch (err) {
      console.error('Error cargando listas:', err);
    }
  };

  const generarInforme = async () => {
    setLoading(true);
    setDatos(null);

    try {
      let endpoint = '';
      let params = new URLSearchParams();

      switch (tipoInforme) {
        case 'estado-trabajadores':
          endpoint = '/informes/estado-trabajadores';
          params.append('fecha', fecha);
          break;

      
        case 'horas-cliente':
          if (!clienteId) {
            alert('Selecciona un cliente');
            setLoading(false);
            return;
          }
          endpoint = '/informes/horas-cliente';
          params.append('clienteId', clienteId);
          params.append('mes', mes);
          params.append('año', año);
          break;

        case 'resumen-ausencias':
          endpoint = '/informes/resumen-ausencias';
          params.append('mes', mes);
          params.append('año', año);
          break;

        case 'calendario-empresa':
        if (!clienteId) {
          alert('Selecciona un cliente');
          setLoading(false);
          return;
        }
        endpoint = '/informes/calendario-empresa';
        params.append('clienteId', clienteId);
        params.append('fechaInicio', fecha);
        params.append('fechaFin', fechaFin || fecha);
        break;

      default:
        alert('Tipo de informe no válido');
        setLoading(false);
        return;
      }

      const resultado = await api.get(`${endpoint}?${params.toString()}`);
      setDatos(resultado);

    } catch (err) {
      console.error('Error generando informe:', err);
      alert('Error al generar informe');
    } finally {
      setLoading(false);
    }
  };
return (
  <div className="p-6 bg-slate-50 min-h-screen">
    {/* HEADER */}
    <div className="mb-8">
      <h1 className="text-3xl font-bold text-slate-900"> Informes y Reportes</h1>
      <p className="text-slate-600 mt-1">Selecciona el tipo de informe que deseas generar</p>
    </div>

    {/* Si NO hay informe seleccionado → Mostrar las 4 tarjetas */}
    {!tipoInforme ? (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* TARJETA 1: Estado Diario de Trabajadores */}
        <button
          onClick={() => setTipoInforme('estado-trabajadores')}
          className="bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left"
        >
          <div className="flex items-start justify-between mb-4">
            
          </div>
          <h2 className="text-2xl font-bold mb-2">Estado Diario de Trabajadores</h2>
          <p className="text-blue-100 text-sm">
            Consulta el estado de cada trabajador por día: horas trabajadas, ausencias y disponibilidad
          </p>
        </button>

        {/* TARJETA 2: Info Trabajador */}
<button
  onClick={() => setTipoInforme('info-trabajador')}
  className="bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left"
>
  <h2 className="text-2xl font-bold mb-2"> Información del Trabajador</h2>
  <p className="text-green-100 text-sm">
    Vista completa: distribución por cliente, horas detalladas y nómina en un solo lugar
  </p>
</button>

        {/* TARJETA 3: Horas por Cliente */}
        <button
          onClick={() => setTipoInforme('horas-cliente')}
          className="bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left"
        >
          <div className="flex items-start justify-between mb-4">
            
          </div>
          <h2 className="text-2xl font-bold mb-2">Horas por Cliente</h2>
          <p className="text-purple-100 text-sm">
            Total de horas y costes por cliente para facturación y análisis de rentabilidad
          </p>
        </button>



        {/* TARJETA 5: Calendario Empresa */}
<button
  onClick={() => setTipoInforme('calendario-empresa')}
  className="bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all transform hover:scale-105 text-left"
>
  <h2 className="text-2xl font-bold mb-2">Calendario Semanal por Empresa</h2>
  <p className="text-cyan-100 text-sm">
    Vista matricial del estado de trabajadores por día: quién trabaja, quién está de baja, vacaciones, etc.
  </p>
</button>
      </div>
    ) : (
      /* Si hay un informe seleccionado → Mostrar filtros y resultados */
      <div className="space-y-6">
        {/* Botón VOLVER */}
        <button
          onClick={() => {
            setTipoInforme(null);
            setDatos(null);
            setTrabajadorId('');
            setClienteId('');
          }}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <span className="text-xl">←</span>
          <span className="font-medium">Volver a Informes</span>
        </button>

        {/* Panel de filtros - NO mostrar para nómina detallada */}
{tipoInforme !== 'nomina-detallada' && tipoInforme !== 'info-trabajador' && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {tipoInforme === 'estado-trabajadores' && ' Estado Diario de Trabajadores'}
              {tipoInforme === 'horas-trabajador' && ' Horas por Trabajador'}
              {tipoInforme === 'horas-cliente' && ' Horas por Cliente'}
              {tipoInforme === 'resumen-ausencias' && 'Análisis de Ausencias'}
            </h2>

            {/* FILTROS ESPECÍFICOS POR TIPO */}
            <div className="space-y-4">
              {tipoInforme === 'estado-trabajadores' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Fecha</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}


              {tipoInforme === 'horas-cliente' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cliente</label>
                    <select
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="">Seleccionar...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>
                          {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
                    <input
                      type="number"
                      value={año}
                      onChange={(e) => setAño(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}

              {tipoInforme === 'resumen-ausencias' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
                    <select
                      value={mes}
                      onChange={(e) => setMes(parseInt(e.target.value))}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      {Array.from({length: 12}, (_, i) => (
                        <option key={i+1} value={i+1}>
                          {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Año</label>
                    <input
                      type="number"
                      value={año}
                      onChange={(e) => setAño(parseInt(e.target.value))}
                      min="2020"
                      max="2030"
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>
                </div>
              )}

              {tipoInforme === 'calendario-empresa' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Cliente/Empresa</label>
                    <select
                      value={clienteId}
                      onChange={(e) => setClienteId(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">Seleccionar...</option>
                      {clientes.map(c => (
                        <option key={c.id} value={c.id}>{c.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Desde</label>
                    <input
                      type="date"
                      value={fecha}
                      onChange={(e) => setFecha(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Hasta</label>
                    <input
                      type="date"
                      value={fechaFin || fecha}
                      onChange={(e) => setFechaFin(e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
                    />
                  </div>
                </div>
              )}

              {/* Botón de acción */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={generarInforme}
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
                    tipoInforme === 'estado-trabajadores' ? 'bg-blue-500 hover:bg-blue-600' :
                    tipoInforme === 'horas-trabajador' ? 'bg-green-500 hover:bg-green-600' :
                    tipoInforme === 'horas-cliente' ? 'bg-purple-500 hover:bg-purple-600' :
                    'bg-orange-500 hover:bg-orange-600'
                  } text-white disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? '⏳ Generando...' : ' Generar Informe'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* VISUALIZACIÓN DE RESULTADOS */}
        {loading && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600">Generando informe...</p>
          </div>
        )}

        {/* INFO TRABAJADOR - Renderizado independiente */}
{tipoInforme === 'info-trabajador' && (
  <InformacionTrabajador />
)}

        {/* RESTO DE INFORMES - Requieren generar datos */}
        {datos && !loading && tipoInforme !== 'nomina-detallada' && (
          <div className="resultados-informe">
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


// ============================================
// COMPONENTES DE VISUALIZACIÓN
// ============================================

function InformeEstadoTrabajadores({ datos }) {
  return (
    <div className="informe-card">
      <h2> Estado de Trabajadores - {datos.fecha}</h2>
      
      <div className="stats-grid">
        <div className="stat-box total">
          <span className="stat-numero">{datos.resumen.totalActivos}</span>
          <span className="stat-label">Total Activos</span>
        </div>
        <div className="stat-box disponibles">
          <span className="stat-numero">{datos.resumen.disponibles}</span>
          <span className="stat-label">Disponibles</span>
        </div>
        <div className="stat-box bajas">
          <span className="stat-numero">{datos.resumen.enBajaMedica}</span>
          <span className="stat-label">Bajas Médicas</span>
        </div>
        
        <div className="stat-box vacaciones">
          <span className="stat-numero">{datos.resumen.enVacaciones}</span>
          <span className="stat-label">Vacaciones</span>
        </div>
        <div className="stat-box permisos">
          <span className="stat-numero">{datos.resumen.conPermisos}</span>
          <span className="stat-label">Otros Permisos</span>
        </div>
        <div className="stat-box pendientes">
          <span className="stat-numero">{datos.resumen.pendientesAprobacion}</span>
          <span className="stat-label">Pendientes Aprobar</span>
        </div>
      </div>
      

      {datos.detalles.bajasMedicas.length > 0 && (
        <div className="detalle-seccion">
          <h3> Bajas Médicas</h3>
          <table className="tabla-informe">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Tipo</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Días</th>
              </tr>
            </thead>
            <tbody>
              {datos.detalles.bajasMedicas.map((baja, idx) => (
                <tr key={idx}>
                  <td>{baja.trabajador.nombre} {baja.trabajador.apellidos}</td>
                  <td>{baja.tipoAusencia.nombre}</td>
                  <td>{new Date(baja.fechaInicio).toLocaleDateString('es-ES')}</td>
                  <td>{new Date(baja.fechaFin).toLocaleDateString('es-ES')}</td>
                  <td>{baja.diasTotales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {datos.detalles.vacaciones.length > 0 && (
        <div className="detalle-seccion">
          <h3> Vacaciones</h3>
          <table className="tabla-informe">
            <thead>
              <tr>
                <th>Trabajador</th>
                <th>Desde</th>
                <th>Hasta</th>
                <th>Días</th>
              </tr>
            </thead>
            <tbody>
              {datos.detalles.vacaciones.map((vac, idx) => (
                <tr key={idx}>
                  <td>{vac.trabajador.nombre} {vac.trabajador.apellidos}</td>
                  <td>{new Date(vac.fechaInicio).toLocaleDateString('es-ES')}</td>
                  <td>{new Date(vac.fechaFin).toLocaleDateString('es-ES')}</td>
                  <td>{vac.diasTotales}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}





function InformeAusencias({ datos }) {
  return (
    <div className="informe-card">
      <h2> Resumen de Ausencias</h2>
      <p className="subtitulo">{datos.periodo.mesNombre} {datos.periodo.año}</p>

      <div className="stats-grid">
        <div className="stat-box total">
          <span className="stat-numero">{datos.resumen.totalAusencias}</span>
          <span className="stat-label">Total Ausencias</span>
        </div>
        <div className="stat-box dias">
          <span className="stat-numero">{datos.resumen.totalDias}</span>
          <span className="stat-label">Total Días</span>
        </div>
      </div>

      <div className="detalle-seccion">
        <h3> Por Tipo de Ausencia</h3>
        {datos.porTipo.map((tipo, idx) => (
          <div key={idx} className="tipo-ausencia-bloque">
            <div 
              className="tipo-ausencia-header" 
              style={{ borderLeft: `4px solid ${tipo.color}` }}
            >
              <h4>{tipo.tipo}</h4>
              <span className="badge">{tipo.cantidad} ausencias | {tipo.totalDias} días</span>
            </div>
            
            <table className="tabla-informe small">
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>Desde</th>
                  <th>Hasta</th>
                  <th>Días</th>
                </tr>
              </thead>
              <tbody>
                {tipo.trabajadores.map((trab, i) => (
                  <tr key={i}>
                    <td>{trab.nombre}</td>
                    <td>{trab.fechaInicio}</td>
                    <td>{trab.fechaFin}</td>
                    <td>{trab.dias}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      default: return 'bg-slate-50 border-slate-200 text-slate-400';
    }
  };

  return (
    <div className="informe-card">
      <h2>Calendario Semanal - {datos.cliente?.nombre}</h2>
      <p className="subtitulo">
        {new Date(datos.fechaInicio).toLocaleDateString('es-ES')} - {new Date(datos.fechaFin).toLocaleDateString('es-ES')}
      </p>

      {/* LEYENDA */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6">
        <h3 className="font-semibold text-slate-700 mb-3">Leyenda:</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center text-green-800 font-bold text-sm">X</div>
            <span className="text-sm text-slate-600">Trabaja</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center text-blue-800 font-bold text-sm">V</div>
            <span className="text-sm text-slate-600">Vacaciones</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center text-red-800 font-bold text-sm">BM</div>
            <span className="text-sm text-slate-600">Baja Médica</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center text-red-800 font-bold text-sm">A</div>
            <span className="text-sm text-slate-600">Otra Ausencia</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-yellow-100 border-2 border-yellow-300 rounded flex items-center justify-center text-yellow-800 font-bold text-sm">BP</div>
            <span className="text-sm text-slate-600">Baja Pendiente</span>
          </div>
        </div>
      </div>

      {/* TABLA CALENDARIO */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-100">
              <th className="border border-slate-300 px-4 py-3 text-left font-semibold text-slate-700 sticky left-0 bg-slate-100 z-10 min-w-[200px]">
                Trabajador
              </th>
              {datos.fechas.map((fecha, idx) => {
                const date = new Date(fecha + 'T00:00:00');
                const diaSemana = date.toLocaleDateString('es-ES', { weekday: 'short' });
                const dia = date.getDate();
                const mes = date.toLocaleDateString('es-ES', { month: 'short' });
                
                return (
                  <th key={idx} className="border border-slate-300 px-3 py-3 text-center min-w-[80px]">
                    <div className="font-semibold text-slate-700">{diaSemana}</div>
                    <div className="text-xs text-slate-500">{dia} {mes}</div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {datos.trabajadores.map((trabajador, idx) => (
              <tr key={idx} className="hover:bg-slate-50">
                <td className="border border-slate-300 px-4 py-3 font-medium text-slate-700 sticky left-0 bg-white z-10">
                  {trabajador.apellidos}, {trabajador.nombre}
                </td>
                {datos.fechas.map((fecha, fIdx) => {
                  const dia = trabajador.dias[fecha];
                  return (
                    <td
                      key={fIdx}
                      className={`border border-slate-300 px-3 py-3 text-center ${getColorCelda(dia?.color)}`}
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
}
function InformeHorasCliente({ datos }) {
  return (
    <div className="informe-card">
      <h2> Informe de Facturación - {datos.cliente.nombre}</h2>
      <p className="subtitulo">{datos.periodo.mesNombre} {datos.periodo.año}</p>

      <div className="info-cliente">
        <p><strong>CIF:</strong> {datos.cliente.cif}</p>
      </div>

      <div className="stats-grid">
        <div className="stat-box total">
          <span className="stat-numero">{datos.totales.totalHoras}h</span>
          <span className="stat-label">Total Horas</span>
        </div>
        <div className="stat-box coste">
          <span className="stat-numero">{datos.totales.costeTotal.toFixed(2)}€</span>
          <span className="stat-label">Coste Total</span>
        </div>
      </div>

      <div className="detalle-seccion">
        <h3> Desglose por Centro</h3>
        <table className="tabla-informe">
          <thead>
            <tr>
              <th>Centro</th>
              <th>Total Horas</th>
              <th>Normales</th>
              <th>Extras</th>
              <th>Nocturnas</th>
              <th>Festivas</th>
              <th>Coste</th>
            </tr>
          </thead>
          <tbody>
            {datos.desglosePorCentro.map((centro, idx) => (
              <tr key={idx}>
                <td>{centro.centro}</td>
                <td><strong>{centro.totalHoras}h</strong></td>
                <td>{centro.horasNormales}h</td>
                <td>{centro.horasExtras}h</td>
                <td>{centro.horasNocturnas}h</td>
                <td>{centro.horasFestivas}h</td>
                <td><strong>{centro.costeTotal.toFixed(2)}€</strong></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
export default Informes;
