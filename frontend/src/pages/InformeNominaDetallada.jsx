import React, { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';

export default function InformeNominaDetallada({
  trabajadorIdInicial = '',
  mesInicial = new Date().getMonth() + 1,
  añoInicial = new Date().getFullYear(),
  ocultarFiltros = false  // ← NUEVO parámetro
}) {
  const api = useApiClient();
  const [mes, setMes] = useState(mesInicial);
  const [año, setAño] = useState(añoInicial);
  const [trabajadorId, setTrabajadorId] = useState(trabajadorIdInicial);
  const [trabajadores, setTrabajadores] = useState([]);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ocultarFiltros) {
      cargarTrabajadores();
    }
  }, [ocultarFiltros]);

  useEffect(() => {
    // Auto-cargar si viene con trabajador inicial
    if (trabajadorIdInicial && ocultarFiltros) {
      cargarDatos();
    }
  }, [trabajadorIdInicial, mesInicial, añoInicial]);

  const cargarTrabajadores = async () => {
    try {
      const data = await api.get('/trabajadores');
      setTrabajadores(data.filter(t => t.activo));
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
    }
  };

  const cargarDatos = async () => {
    const idFinal = trabajadorIdInicial || trabajadorId;
    
    if (!idFinal) {
      alert('Selecciona un trabajador');
      return;
    }

    try {
      setLoading(true);
      const data = await api.get(`/control-horas/nomina?mes=${mes}&año=${año}&trabajadorId=${idFinal}`);
      setDatos(data);
    } catch (error) {
      console.error('Error cargando nómina:', error);
      alert('Error al cargar datos de nómina');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-slate-600">Cargando informe de nómina...</p>
      </div>
    );
  }

  return (
    <div>
      {/* FILTROS - Solo mostrar si NO está oculto */}
      {!ocultarFiltros && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-xl font-bold text-slate-900 mb-4">💰 Informe de Nómina Detallada</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Trabajador</label>
              <select
                value={trabajadorId}
                onChange={(e) => setTrabajadorId(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
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
              <select
                value={año}
                onChange={(e) => setAño(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value={2024}>2024</option>
                <option value={2025}>2025</option>
                <option value={2026}>2026</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={cargarDatos}
                disabled={loading}
                className="w-full px-6 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-all disabled:opacity-50"
              >
                {loading ? '⏳ Generando...' : '💰 Generar Informe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TABLA - Siempre visible */}
      {datos && !loading && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-100 sticky top-0">
                <tr>
                  <th className="p-2 text-left font-semibold text-slate-700 border-r border-slate-300 sticky left-0 bg-slate-100 z-10">Día</th>
                  <th className="p-2 text-left font-semibold text-slate-700 border-r border-slate-300">Fecha</th>
                  <th className="p-2 text-left font-semibold text-slate-700 border-r border-slate-300">Centro</th>
                  <th className="p-2 text-center font-semibold text-slate-700 border-r border-slate-200">H. Totales</th>
                  <th className="p-2 text-center font-semibold text-green-700 border-r border-slate-200 bg-green-50">H. Normales</th>
                  <th className="p-2 text-center font-semibold text-purple-700 border-r border-slate-200 bg-purple-50">H. Nocturnas</th>
                  <th className="p-2 text-center font-semibold text-orange-700 border-r border-slate-200 bg-orange-50">H. Festivas</th>
                  <th className="p-2 text-center font-semibold text-red-700 border-r border-slate-200 bg-red-50">H. Extra 15%</th>
                  <th className="p-2 text-center font-semibold text-red-700 border-r border-slate-200 bg-red-50">H. Extra 20%</th>
                  <th className="p-2 text-center font-semibold text-slate-700 border-r border-slate-200">Ausencia</th>
                  <th className="p-2 text-center font-semibold text-blue-700 bg-blue-50">Importe Día</th>
                </tr>
              </thead>
              <tbody>
                {datos.trabajadores[0] && Array.from({ length: datos.periodo.diasMes }, (_, i) => {
                  const dia = i + 1;
                  const trabajador = datos.trabajadores[0];
                  const datosDia = trabajador.dias[dia];
                  const fecha = new Date(año, mes - 1, dia);
                  const nombreDia = fecha.toLocaleDateString('es-ES', { weekday: 'short' });

                  return (
                    <tr key={dia} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-2 border-r border-slate-300 sticky left-0 bg-inherit z-10 font-semibold">{dia}</td>
                      <td className="p-2 border-r border-slate-300 text-slate-600">{nombreDia}</td>
                      <td className="p-2 border-r border-slate-300 text-xs">
                        {datosDia.centros?.map(c => c.nombre).join(', ') || '-'}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 font-medium">
                        {datosDia.horas > 0 ? datosDia.horas.toFixed(1) : '-'}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 bg-green-50">
                        {datosDia.desglose?.horasNormales > 0 ? datosDia.desglose.horasNormales.toFixed(1) : '-'}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 bg-purple-50">
                        {datosDia.desglose?.horasNocturnas > 0 ? datosDia.desglose.horasNocturnas.toFixed(1) : '-'}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 bg-orange-50">
                        {datosDia.desglose?.horasFestivas > 0 ? datosDia.desglose.horasFestivas.toFixed(1) : '-'}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 bg-red-50">
                        {datosDia.desglose?.horasExtra15 > 0 ? datosDia.desglose.horasExtra15.toFixed(1) : '-'}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200 bg-red-50">
                        {datosDia.desglose?.horasExtra20 > 0 ? datosDia.desglose.horasExtra20.toFixed(1) : '-'}
                      </td>
                      <td className="p-2 text-center border-r border-slate-200">
                        {datosDia.tipo === 'AUSENCIA' ? (
                          <div className="text-xs">
                            <span className="font-bold" style={{ color: datosDia.color }}>{datosDia.codigo}</span>
                            <span className="text-slate-500"> ({datosDia.porcentajeCobro}%)</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-center bg-blue-50 font-bold text-blue-700">
                        {datosDia.importeDia > 0 ? `${datosDia.importeDia.toFixed(2)}€` : '-'}
                      </td>
                    </tr>
                  );
                })}

                {/* FILA TOTALES */}
                {datos.trabajadores[0] && (
                  <tr className="bg-blue-100 font-bold">
                    <td colSpan="3" className="p-3 text-right">TOTALES:</td>
                    <td className="p-3 text-center">
                      {(datos.trabajadores[0].totales.horasNormales + 
                        datos.trabajadores[0].totales.horasNocturnas + 
                        datos.trabajadores[0].totales.horasFestivas).toFixed(1)}h
                    </td>
                    <td className="p-3 text-center bg-green-100">
                      {datos.trabajadores[0].totales.horasNormales.toFixed(1)}h
                    </td>
                    <td className="p-3 text-center bg-purple-100">
                      {datos.trabajadores[0].totales.horasNocturnas.toFixed(1)}h
                    </td>
                    <td className="p-3 text-center bg-orange-100">
                      {datos.trabajadores[0].totales.horasFestivas.toFixed(1)}h
                    </td>
                    <td className="p-3 text-center bg-red-100">
                      {datos.trabajadores[0].totales.horasExtra15.toFixed(1)}h
                    </td>
                    <td className="p-3 text-center bg-red-100">
                      {datos.trabajadores[0].totales.horasExtra20.toFixed(1)}h
                    </td>
                    <td className="p-3 text-center">-</td>
                    <td className="p-3 text-center bg-blue-200 text-blue-900 text-lg">
                      {datos.trabajadores[0].totales.importeBruto.toFixed(2)}€
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}