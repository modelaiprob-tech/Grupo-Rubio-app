import { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import * as trabajadoresApi from '../services/trabajadoresApi';
import * as informesApi from '../services/informesApi';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import InformeNominaDetallada from './InformeNominaDetallada';

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

const COLORES = ['#0d9488', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]';
const selectClass = 'bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm';

export default function InformacionTrabajador() {
  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

  const api = useApiClient();
  const [trabajadorId, setTrabajadorId] = useState('');
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [trabajadores, setTrabajadores] = useState([]);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);

  // Estados desplegables
  const [mostrarDetalleHoras, setMostrarDetalleHoras] = useState(false);
  const [mostrarNomina, setMostrarNomina] = useState(false);

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  const cargarTrabajadores = async () => {
    try {
      const data = await trabajadoresApi.getActivos(api);
      setTrabajadores(data);
    } catch (err) {
      console.error('Error cargando trabajadores:', err);
    }
  };

  const generarInforme = async () => {
    if (!trabajadorId) {
      alert('Selecciona un trabajador');
      return;
    }

    setLoading(true);
    setDatos(null);
    setClienteSeleccionado(null);

    try {
      const resultado = await informesApi.getHorasTrabajador(api, trabajadorId, mes, año);

      // Procesar datos para grafica circular
      const distribucionClientes = {};
      resultado.detallesDias.forEach(dia => {
        const cliente = dia.cliente || 'Sin cliente';
        if (!distribucionClientes[cliente]) {
          distribucionClientes[cliente] = 0;
        }
        distribucionClientes[cliente] += dia.horasNormales + dia.horasExtras;
      });

      const dataGrafica = Object.entries(distribucionClientes).map(([nombre, horas]) => ({
        nombre,
        horas: parseFloat(horas.toFixed(2)),
        porcentaje: 0
      }));

      const totalHoras = dataGrafica.reduce((sum, item) => sum + item.horas, 0);
      dataGrafica.forEach(item => {
        item.porcentaje = totalHoras > 0 ? ((item.horas / totalHoras) * 100).toFixed(1) : 0;
      });

      setDatos({
        ...resultado,
        distribucionClientes: dataGrafica
      });

    } catch (err) {
      console.error('Error generando informe:', err);
      alert('Error al generar informe');
    } finally {
      setLoading(false);
    }
  };

  const calcularHorasPorCliente = (cliente) => {
    if (!datos) return { horasNormales: 0, horasExtras: 0, horasNocturnas: 0, horasFestivas: 0, total: 0 };

    const diasCliente = datos.detallesDias.filter(d => d.cliente === cliente);

    return {
      horasNormales: diasCliente.reduce((sum, d) => sum + d.horasNormales, 0),
      horasExtras: diasCliente.reduce((sum, d) => sum + d.horasExtras, 0),
      horasNocturnas: diasCliente.reduce((sum, d) => sum + d.horasNocturnas, 0),
      horasFestivas: diasCliente.reduce((sum, d) => sum + d.horasFestivas, 0),
      total: diasCliente.reduce((sum, d) => sum + d.horasNormales + d.horasExtras, 0)
    };
  };

  const horasMostrar = clienteSeleccionado
    ? calcularHorasPorCliente(clienteSeleccionado)
    : datos?.totales || { horasNormales: 0, horasExtras: 0, horasNocturnas: 0, horasFestivas: 0, totalHoras: 0 };

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Informacion del Trabajador</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Vista completa de horas, distribucion y nomina</p>
      </div>

      {/* FILTROS */}
      <div className={`${cardClass} mb-6`}>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-2">Trabajador</label>
            <select
              value={trabajadorId}
              onChange={(e) => setTrabajadorId(e.target.value)}
              className={selectClass + ' w-full'}
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
            <label className="block text-sm font-medium text-gray-500 mb-2">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className={selectClass + ' w-full'}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
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
              className={selectClass + ' w-full'}
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generarInforme}
              disabled={loading}
              className="w-full px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50"
            >
              {loading ? 'Cargando...' : 'Generar Informe'}
            </button>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className={`${cardClass} text-center py-16`}>
          <div className="flex gap-1.5 justify-center mb-4">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
          <p className="text-gray-400 text-sm">Generando informe...</p>
        </div>
      )}

      {/* RESULTADOS */}
      {datos && !loading && (
        <div className="space-y-6">
          {/* GRAFICA + BANNER HORAS */}
          <div className={cardClass}>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Distribucion por Cliente</h2>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* GRAFICA CIRCULAR */}
              <div>
                {datos.distribucionClientes.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={datos.distribucionClientes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.porcentaje}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="horas"
                        onClick={(data) => setClienteSeleccionado(data.nombre)}
                        style={{ cursor: 'pointer' }}
                      >
                        {datos.distribucionClientes.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORES[index % COLORES.length]}
                            stroke={clienteSeleccionado === entry.nombre ? '#0f172a' : 'none'}
                            strokeWidth={clienteSeleccionado === entry.nombre ? 3 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}h`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-gray-400 py-20">Sin datos para mostrar</p>
                )}

                {clienteSeleccionado && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setClienteSeleccionado(null)}
                      className="text-sm text-teal-600 hover:text-teal-700 font-medium"
                    >
                      Ver totales generales
                    </button>
                  </div>
                )}
              </div>

              {/* BANNER HORAS */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">
                  {clienteSeleccionado ? clienteSeleccionado : 'Resumen General'}
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <div className="text-2xl font-extrabold text-emerald-700">{(horasMostrar.horasNormales || 0).toFixed(1)}h</div>
                    <div className="text-xs text-emerald-600 mt-1 font-medium">Horas Normales</div>
                  </div>

                  <div className="bg-amber-50 rounded-xl p-4">
                    <div className="text-2xl font-extrabold text-amber-700">{(horasMostrar.horasExtras || 0).toFixed(1)}h</div>
                    <div className="text-xs text-amber-600 mt-1 font-medium">Horas Extras</div>
                  </div>

                  <div className="bg-violet-50 rounded-xl p-4">
                    <div className="text-2xl font-extrabold text-violet-700">{(horasMostrar.horasNocturnas || 0).toFixed(1)}h</div>
                    <div className="text-xs text-violet-600 mt-1 font-medium">Horas Nocturnas</div>
                  </div>

                  <div className="bg-rose-50 rounded-xl p-4">
                    <div className="text-2xl font-extrabold text-rose-700">{(horasMostrar.horasFestivas || 0).toFixed(1)}h</div>
                    <div className="text-xs text-rose-600 mt-1 font-medium">Horas Festivas</div>
                  </div>
                </div>

                <div className="mt-3 bg-gray-900 text-white rounded-xl p-4">
                  <div className="text-3xl font-extrabold">{(horasMostrar.totalHoras || horasMostrar.total || 0).toFixed(1)}h</div>
                  <div className="text-xs text-gray-400 mt-1 font-medium">Total Horas</div>
                </div>
              </div>
            </div>
          </div>

          {/* DESPLEGABLE: DETALLE HORAS */}
          <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <button
              onClick={() => setMostrarDetalleHoras(!mostrarDetalleHoras)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-bold text-gray-900">Detalle Horas por Dia</h2>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${mostrarDetalleHoras ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mostrarDetalleHoras && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="overflow-x-auto mt-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100">
                        <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Fecha</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Cliente</th>
                        <th className="p-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Centro</th>
                        <th className="p-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Normales</th>
                        <th className="p-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Extras</th>
                        <th className="p-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Nocturnas</th>
                        <th className="p-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">Festivas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.detallesDias.map((dia, idx) => (
                        <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="p-3 text-gray-700 font-medium">{new Date(dia.fecha).toLocaleDateString('es-ES')}</td>
                          <td className="p-3 text-gray-600">{dia.cliente}</td>
                          <td className="p-3 text-xs text-gray-500">{dia.centro}</td>
                          <td className="p-3 text-center text-gray-700">{dia.horasNormales}h</td>
                          <td className="p-3 text-center text-gray-700">{dia.horasExtras > 0 ? `${dia.horasExtras}h` : '-'}</td>
                          <td className="p-3 text-center text-gray-700">{dia.horasNocturnas > 0 ? `${dia.horasNocturnas}h` : '-'}</td>
                          <td className="p-3 text-center text-gray-700">{dia.horasFestivas > 0 ? `${dia.horasFestivas}h` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* DESPLEGABLE: NOMINA */}
          <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
            <button
              onClick={() => setMostrarNomina(!mostrarNomina)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <h2 className="text-lg font-bold text-gray-900">Nomina Detallada</h2>
              <svg className={`w-5 h-5 text-gray-400 transition-transform ${mostrarNomina ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {mostrarNomina && (
              <div className="px-6 pb-6 border-t border-gray-100">
                <div className="mt-4">
                  <InformeNominaDetallada
                    trabajadorIdInicial={trabajadorId}
                    mesInicial={mes}
                    añoInicial={año}
                    ocultarFiltros={true}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}