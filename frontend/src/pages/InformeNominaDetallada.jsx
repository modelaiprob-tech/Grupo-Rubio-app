import React, { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import * as trabajadoresApi from '../services/trabajadoresApi';
import * as controlHorasApi from '../services/controlHorasApi';

const selectClass = 'bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm';
const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]';

export default function InformeNominaDetallada({
  trabajadorIdInicial = '',
  mesInicial = new Date().getMonth() + 1,
  añoInicial = new Date().getFullYear(),
  ocultarFiltros = false
}) {
  const api = useApiClient();
  const [mes, setMes] = useState(mesInicial);
  const [año, setAño] = useState(añoInicial);
  const [trabajadorId, setTrabajadorId] = useState(trabajadorIdInicial);
  const [trabajadores, setTrabajadores] = useState([]);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!ocultarFiltros) cargarTrabajadores();
  }, [ocultarFiltros]);

  useEffect(() => {
    if (trabajadorIdInicial && ocultarFiltros) cargarDatos();
  }, [trabajadorIdInicial, mesInicial, añoInicial]);

  const cargarTrabajadores = async () => {
    try {
      const data = await trabajadoresApi.getAll(api);
      setTrabajadores(data.filter(t => t.activo));
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
    }
  };

  const cargarDatos = async () => {
    const idFinal = trabajadorIdInicial || trabajadorId;
    if (!idFinal) { alert('Selecciona un trabajador'); return; }
    try {
      setLoading(true);
      const data = await controlHorasApi.getNomina(api, idFinal, mes, año);
      setDatos(data);
    } catch (error) {
      console.error('Error cargando nomina:', error);
      alert('Error al cargar datos de nomina');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="flex gap-1.5 mb-4">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
        <p className="text-gray-400 text-sm">Cargando informe de nomina...</p>
      </div>
    );
  }

  return (
    <div>
      {!ocultarFiltros && (
        <div className={`${cardClass} mb-6`}>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Informe de Nomina Detallada</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Trabajador</label>
              <select value={trabajadorId} onChange={(e) => setTrabajadorId(e.target.value)} className={selectClass + ' w-full'}>
                <option value="">Seleccionar...</option>
                {trabajadores.map(t => (<option key={t.id} value={t.id}>{t.nombre} {t.apellidos}</option>))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Mes</label>
              <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className={selectClass + ' w-full'}>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-2">Ano</label>
              <select value={año} onChange={(e) => setAño(parseInt(e.target.value))} className={selectClass + ' w-full'}>
                <option value={2024}>2024</option><option value={2025}>2025</option><option value={2026}>2026</option>
              </select>
            </div>
            <div className="flex items-end">
              <button onClick={cargarDatos} disabled={loading} className="w-full px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-medium text-sm transition-all disabled:opacity-50">
                {loading ? 'Generando...' : 'Generar Informe'}
              </button>
            </div>
          </div>
        </div>
      )}

      {datos && !loading && (
        <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 sticky top-0">
                <tr>
                  <th className="p-2 text-left font-semibold text-gray-500 border-r border-gray-200 sticky left-0 bg-gray-50 z-10 text-xs">Dia</th>
                  <th className="p-2 text-left font-semibold text-gray-500 border-r border-gray-200 text-xs">Fecha</th>
                  <th className="p-2 text-left font-semibold text-gray-500 border-r border-gray-200 text-xs">Centro</th>
                  <th className="p-2 text-center font-semibold text-gray-500 border-r border-gray-100 text-xs">H. Totales</th>
                  <th className="p-2 text-center font-semibold text-emerald-600 border-r border-gray-100 bg-emerald-50/50 text-xs">H. Normales</th>
                  <th className="p-2 text-center font-semibold text-violet-600 border-r border-gray-100 bg-violet-50/50 text-xs">H. Nocturnas</th>
                  <th className="p-2 text-center font-semibold text-amber-600 border-r border-gray-100 bg-amber-50/50 text-xs">H. Festivas</th>
                  <th className="p-2 text-center font-semibold text-rose-600 border-r border-gray-100 bg-rose-50/50 text-xs">H. Extra 15%</th>
                  <th className="p-2 text-center font-semibold text-rose-600 border-r border-gray-100 bg-rose-50/50 text-xs">H. Extra 20%</th>
                  <th className="p-2 text-center font-semibold text-gray-500 border-r border-gray-100 text-xs">Ausencia</th>
                  <th className="p-2 text-center font-semibold text-teal-700 bg-teal-50/50 text-xs">Importe</th>
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
                    <tr key={dia} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                      <td className="p-2 border-r border-gray-200 sticky left-0 bg-inherit z-10 font-semibold text-gray-700 text-xs">{dia}</td>
                      <td className="p-2 border-r border-gray-200 text-gray-500 text-xs">{nombreDia}</td>
                      <td className="p-2 border-r border-gray-200 text-xs text-gray-500">{datosDia.centros?.map(c => c.nombre).join(', ') || '-'}</td>
                      <td className="p-2 text-center border-r border-gray-100 font-medium text-gray-700 text-xs">{datosDia.horas > 0 ? datosDia.horas.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center border-r border-gray-100 bg-emerald-50/30 text-xs">{datosDia.desglose?.horasNormales > 0 ? datosDia.desglose.horasNormales.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center border-r border-gray-100 bg-violet-50/30 text-xs">{datosDia.desglose?.horasNocturnas > 0 ? datosDia.desglose.horasNocturnas.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center border-r border-gray-100 bg-amber-50/30 text-xs">{datosDia.desglose?.horasFestivas > 0 ? datosDia.desglose.horasFestivas.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center border-r border-gray-100 bg-rose-50/30 text-xs">{datosDia.desglose?.horasExtra15 > 0 ? datosDia.desglose.horasExtra15.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center border-r border-gray-100 bg-rose-50/30 text-xs">{datosDia.desglose?.horasExtra20 > 0 ? datosDia.desglose.horasExtra20.toFixed(1) : '-'}</td>
                      <td className="p-2 text-center border-r border-gray-100 text-xs">
                        {datosDia.tipo === 'AUSENCIA' ? (
                          <div>
                            <span className="font-bold" style={{ color: datosDia.color }}>{datosDia.codigo}</span>
                            <span className="text-gray-400"> ({datosDia.porcentajeCobro}%)</span>
                          </div>
                        ) : '-'}
                      </td>
                      <td className="p-2 text-center bg-teal-50/30 font-bold text-teal-700 text-xs">{datosDia.importeDia > 0 ? `${datosDia.importeDia.toFixed(2)}EUR` : '-'}</td>
                    </tr>
                  );
                })}
                {datos.trabajadores[0] && (
                  <tr className="bg-teal-50 font-bold">
                    <td colSpan="3" className="p-3 text-right text-teal-800 text-sm">TOTALES:</td>
                    <td className="p-3 text-center text-sm">{(datos.trabajadores[0].totales.horasNormales + datos.trabajadores[0].totales.horasNocturnas + datos.trabajadores[0].totales.horasFestivas).toFixed(1)}h</td>
                    <td className="p-3 text-center bg-emerald-100/50 text-sm">{datos.trabajadores[0].totales.horasNormales.toFixed(1)}h</td>
                    <td className="p-3 text-center bg-violet-100/50 text-sm">{datos.trabajadores[0].totales.horasNocturnas.toFixed(1)}h</td>
                    <td className="p-3 text-center bg-amber-100/50 text-sm">{datos.trabajadores[0].totales.horasFestivas.toFixed(1)}h</td>
                    <td className="p-3 text-center bg-rose-100/50 text-sm">{datos.trabajadores[0].totales.horasExtra15.toFixed(1)}h</td>
                    <td className="p-3 text-center bg-rose-100/50 text-sm">{datos.trabajadores[0].totales.horasExtra20.toFixed(1)}h</td>
                    <td className="p-3 text-center text-sm">-</td>
                    <td className="p-3 text-center bg-teal-100 text-teal-900 text-lg">{datos.trabajadores[0].totales.importeBruto.toFixed(2)}EUR</td>
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
