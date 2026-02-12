import { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import InformeNominaDetallada from './InformeNominaDetallada';

const COLORES = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function InformacionTrabajador() {
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
      const data = await api.get('/trabajadores?activo=true');
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
      const resultado = await api.get(`/informes/horas-trabajador?trabajadorId=${trabajadorId}&mes=${mes}&año=${año}`);
      
      // Procesar datos para gráfica circular
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
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900"> Información del Trabajador</h1>
        <p className="text-slate-600 mt-1">Vista completa de horas, distribución y nómina</p>
      </div>

      {/* FILTROS */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Trabajador</label>
            <select
              value={trabajadorId}
              onChange={(e) => setTrabajadorId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
            <label className="block text-sm font-medium text-slate-700 mb-2">Mes</label>
            <select
              value={mes}
              onChange={(e) => setMes(parseInt(e.target.value))}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={i + 1}>
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
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={generarInforme}
              disabled={loading}
              className="w-full px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
            >
              {loading ? '⏳ Cargando...' : ' Generar Informe'}
            </button>
          </div>
        </div>
      </div>

      {/* LOADING */}
      {loading && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600">Generando informe...</p>
        </div>
      )}

      {/* RESULTADOS */}
      {datos && !loading && (
        <div className="space-y-6">
          {/* GRÁFICA + BANNER HORAS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6"> Distribución por Cliente</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* GRÁFICA CIRCULAR */}
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
                            stroke={clienteSeleccionado === entry.nombre ? '#000' : 'none'}
                            strokeWidth={clienteSeleccionado === entry.nombre ? 3 : 0}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}h`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-slate-500 py-20">Sin datos para mostrar</p>
                )}
                
                {clienteSeleccionado && (
                  <div className="mt-4 text-center">
                    <button
                      onClick={() => setClienteSeleccionado(null)}
                      className="text-sm text-blue-600 hover:text-blue-700 underline"
                    >
                      ← Ver totales generales
                    </button>
                  </div>
                )}
              </div>

              {/* BANNER HORAS */}
              <div>
                <h3 className="font-semibold text-slate-700 mb-4">
                  {clienteSeleccionado ? ` ${clienteSeleccionado}` : ' Resumen General'}
                </h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-l-4 border-blue-500 rounded-lg p-4">
                    <div className="text-3xl font-bold text-blue-700">{(horasMostrar.horasNormales || 0).toFixed(1)}h</div>
                    <div className="text-sm text-blue-600 mt-1">Horas Normales</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-l-4 border-yellow-500 rounded-lg p-4">
                    <div className="text-3xl font-bold text-yellow-700">{(horasMostrar.horasExtras || 0).toFixed(1)}h</div>
                    <div className="text-sm text-yellow-600 mt-1">Horas Extras</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-l-4 border-purple-500 rounded-lg p-4">
                    <div className="text-3xl font-bold text-purple-700">{(horasMostrar.horasNocturnas || 0).toFixed(1)}h</div>
                    <div className="text-sm text-purple-600 mt-1">Horas Nocturnas</div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-pink-50 to-pink-100 border-l-4 border-pink-500 rounded-lg p-4">
                    <div className="text-3xl font-bold text-pink-700">{(horasMostrar.horasFestivas || 0).toFixed(1)}h</div>
                    <div className="text-sm text-pink-600 mt-1">Horas Festivas</div>
                  </div>
                </div>

                <div className="mt-4 bg-gradient-to-br from-slate-700 to-slate-800 text-white rounded-lg p-4">
                  <div className="text-4xl font-bold">{(horasMostrar.totalHoras || horasMostrar.total || 0).toFixed(1)}h</div>
                  <div className="text-sm text-slate-300 mt-1">Total Horas</div>
                </div>
              </div>
            </div>
          </div>

          {/* DESPLEGABLE: DETALLE HORAS */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setMostrarDetalleHoras(!mostrarDetalleHoras)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-xl font-bold text-slate-900"> Detalle Horas por Día</h2>
              <span className="text-2xl">{mostrarDetalleHoras ? '▼' : ''}</span>
            </button>

            {mostrarDetalleHoras && (
              <div className="p-6 border-t border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="p-3 text-left font-semibold">Fecha</th>
                        <th className="p-3 text-left font-semibold">Cliente</th>
                        <th className="p-3 text-left font-semibold">Centro</th>
                        <th className="p-3 text-center font-semibold">Normales</th>
                        <th className="p-3 text-center font-semibold">Extras</th>
                        <th className="p-3 text-center font-semibold">Nocturnas</th>
                        <th className="p-3 text-center font-semibold">Festivas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datos.detallesDias.map((dia, idx) => (
                        <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50">
                          <td className="p-3">{new Date(dia.fecha).toLocaleDateString('es-ES')}</td>
                          <td className="p-3">{dia.cliente}</td>
                          <td className="p-3 text-xs">{dia.centro}</td>
                          <td className="p-3 text-center">{dia.horasNormales}h</td>
                          <td className="p-3 text-center">{dia.horasExtras > 0 ? `${dia.horasExtras}h` : '-'}</td>
                          <td className="p-3 text-center">{dia.horasNocturnas > 0 ? `${dia.horasNocturnas}h` : '-'}</td>
                          <td className="p-3 text-center">{dia.horasFestivas > 0 ? `${dia.horasFestivas}h` : '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* DESPLEGABLE: NÓMINA */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <button
              onClick={() => setMostrarNomina(!mostrarNomina)}
              className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
            >
              <h2 className="text-xl font-bold text-slate-900"> Nómina Detallada</h2>
              <span className="text-2xl">{mostrarNomina ? '▼' : ''}</span>
            </button>

            {mostrarNomina && (
              <div className="p-6 border-t border-slate-200">
                <InformeNominaDetallada
  trabajadorIdInicial={trabajadorId}
  mesInicial={mes}
  añoInicial={año}
  ocultarFiltros={true}  // ← AÑADIR ESTO
/>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}