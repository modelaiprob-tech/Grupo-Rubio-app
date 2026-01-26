import React, { useState, useEffect } from 'react';

export default function InformeNominaDetallada({ api }) {
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [trabajadorId, setTrabajadorId] = useState('');
  const [trabajadores, setTrabajadores] = useState([]);
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    cargarTrabajadores();
  }, []);

  const cargarTrabajadores = async () => {
    try {
      const data = await api.get('/trabajadores');
      setTrabajadores(data.filter(t => t.activo));
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
    }
  };

  const cargarDatos = async () => {
    if (!trabajadorId) {
      alert('Selecciona un trabajador');
      return;
    }

    try {
      setLoading(true);
      const data = await api.get(`/control-horas/nomina?mes=${mes}&año=${año}&trabajadorId=${trabajadorId}`);
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
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-slate-600">Cargando informe de nómina...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Informe de Nómina Detallada</h1>
        <p className="text-slate-600 mt-1">Desglose completo de horas y cálculo de nómina</p>
      </div>

      {/* FILTROS */}
      <div className="mb-6 flex gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <select
          value={trabajadorId}
          onChange={(e) => setTrabajadorId(e.target.value)}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Selecciona un trabajador</option>
          {trabajadores.map(t => (
            <option key={t.id} value={t.id}>
              {t.nombre} {t.apellidos} - {t.categoria?.nombre}
            </option>
          ))}
        </select>

        <select
          value={mes}
          onChange={(e) => setMes(parseInt(e.target.value))}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}
            </option>
          ))}
        </select>

        <select
          value={año}
          onChange={(e) => setAño(parseInt(e.target.value))}
          className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>

        <button
          onClick={cargarDatos}
          className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium"
        >
          Generar Informe
        </button>
      </div>

      {/* TABLA */}
      {datos && (
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