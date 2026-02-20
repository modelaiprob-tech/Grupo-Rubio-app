import React, { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import * as controlHorasApi from '../services/controlHorasApi';
import * as centrosApi from '../services/centrosApi';
import * as ajustesManualesApi from '../services/ajustesManualesApi';

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

const selectClass = 'bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm cursor-pointer font-medium';
const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';

export default function ControlHorasPage() {
  const api = useApiClient();
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [centros, setCentros] = useState([]);
  const [modalAjuste, setModalAjuste] = useState({
    abierto: false, trabajadorId: null, trabajadorNombre: '', fecha: '', dia: null,
    horaInicio: '', horaFin: '', centroId: '', notas: ''
  });
  const [guardando, setGuardando] = useState(false);

  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await controlHorasApi.getMatriz(api, mes, año);
      setDatos(data);
    } catch (error) {
      console.error('Error cargando control de horas:', error);
      alert('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarCentros = async () => {
    try {
      const data = await centrosApi.getAll(api);
      setCentros(data.filter(c => c.activo));
    } catch (error) {
      console.error('Error cargando centros:', error);
    }
  };

  const abrirModalAjuste = (trabajador, dia, datosDia) => {
    const fecha = new Date(año, mes - 1, dia);
    const fechaISO = fecha.toISOString().split('T')[0];
    const primerCentro = datosDia.centros && datosDia.centros.length > 0 ? datosDia.centros[0] : null;
    setModalAjuste({
      abierto: true, trabajadorId: trabajador.trabajador.id,
      trabajadorNombre: `${trabajador.trabajador.nombre} ${trabajador.trabajador.apellidos}`,
      fecha: fechaISO, dia: dia, horaInicio: '08:00', horaFin: '16:00',
      centroId: primerCentro ? primerCentro.id.toString() : '', notas: datosDia.notas || ''
    });
  };

  const cerrarModal = () => {
    setModalAjuste({ abierto: false, trabajadorId: null, trabajadorNombre: '', fecha: '', dia: null, horaInicio: '', horaFin: '', centroId: '', notas: '' });
  };

  const guardarAjusteManual = async () => {
    if (!modalAjuste.centroId || !modalAjuste.horaInicio || !modalAjuste.horaFin) {
      alert('Debe completar todos los campos obligatorios');
      return;
    }
    try {
      setGuardando(true);
      const usuarioId = parseInt(localStorage.getItem('userId'));
      await ajustesManualesApi.guardar(api, {
        trabajadorId: modalAjuste.trabajadorId, centroId: parseInt(modalAjuste.centroId),
        fecha: modalAjuste.fecha, horaInicio: modalAjuste.horaInicio, horaFin: modalAjuste.horaFin,
        notas: modalAjuste.notas, usuarioId: usuarioId
      });
      alert('Ajuste guardado correctamente');
      cerrarModal();
      cargarDatos();
    } catch (error) {
      console.error('Error guardando ajuste:', error);
      alert('Error al guardar el ajuste');
    } finally {
      setGuardando(false);
    }
  };

  useEffect(() => { cargarDatos(); }, [mes, año]);
  useEffect(() => { cargarCentros(); }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center" style={font}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
          <p className="text-gray-400 text-sm font-medium">Cargando control de horas...</p>
        </div>
      </div>
    );
  }

  if (!datos) return null;

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      <div className="mb-6">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Control de Horas</h1>
        <p className="text-gray-400 text-sm font-medium mt-1">Tabla de control mensual para RR.HH</p>
      </div>

      <div className="mb-6 flex gap-3 items-center bg-white p-3 rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]">
        <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className={selectClass}>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' })}</option>
          ))}
        </select>
        <select value={año} onChange={(e) => setAño(parseInt(e.target.value))} className={selectClass}>
          <option value={2024}>2024</option>
          <option value={2025}>2025</option>
          <option value={2026}>2026</option>
        </select>
        <button onClick={cargarDatos} className="px-5 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors">
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="p-2 text-left font-semibold text-gray-500 border-r border-gray-200 sticky left-0 bg-gray-50 z-10 min-w-[50px] text-xs">Cod</th>
                <th className="p-2 text-left font-semibold text-gray-500 border-r border-gray-200 sticky left-[50px] bg-gray-50 z-10 min-w-[180px] text-xs">Trabajador</th>
                <th className="p-2 text-left font-semibold text-gray-500 border-r border-gray-200 min-w-[150px] text-xs">Centro</th>
                <th className="p-2 text-center font-semibold text-gray-500 border-r border-gray-100 min-w-[80px] text-xs">Contrato</th>
                <th className="p-2 text-center font-semibold text-gray-500 border-r border-gray-100 min-w-[60px] text-xs">%</th>
                <th className="p-2 text-center font-semibold text-gray-500 border-r border-gray-100 min-w-[80px] text-xs">H/Ano</th>
                <th className="p-2 text-center font-semibold text-gray-500 border-r border-gray-100 min-w-[80px] text-xs">H/Sem</th>
                {Array.from({ length: datos.periodo.diasMes }, (_, i) => {
                  const dia = i + 1;
                  const fecha = new Date(año, mes - 1, dia);
                  const esDomingo = fecha.getDay() === 0;
                  return (
                    <th key={dia} className={`p-2 text-center font-semibold border-r border-gray-100 min-w-[60px] text-xs ${esDomingo ? 'bg-rose-50 text-rose-600' : 'text-gray-500'}`}>
                      <div>{dia}</div>
                      <div className="text-[10px] font-normal">{fecha.toLocaleDateString('es-ES', { weekday: 'short' })}</div>
                    </th>
                  );
                })}
                <th className="p-2 text-center font-semibold text-teal-700 bg-teal-50 min-w-[100px] text-xs">Total</th>
              </tr>
            </thead>
            <tbody>
              {datos.trabajadores.map((trabajador, idx) => (
                <tr key={trabajador.trabajador.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="p-2 border-r border-gray-200 sticky left-0 bg-inherit z-10 text-center font-mono text-xs text-gray-500">
                    {trabajador.trabajador.codigo}
                  </td>
                  <td className="p-2 border-r border-gray-200 sticky left-[50px] bg-inherit z-10">
                    <div className="font-semibold text-gray-900 text-xs">{trabajador.trabajador.nombre} {trabajador.trabajador.apellidos}</div>
                    <div className="text-[10px] text-gray-400">{trabajador.trabajador.categoria}</div>
                  </td>
                  <td className="p-2 border-r border-gray-200 text-xs text-gray-500">{trabajador.trabajador.centrosDelMes || '-'}</td>
                  <td className="p-2 border-r border-gray-100 text-center text-xs font-mono text-gray-500">{trabajador.trabajador.codigoContrato}</td>
                  <td className="p-2 border-r border-gray-100 text-center text-xs font-semibold text-gray-700">{trabajador.trabajador.porcentajeJornada}%</td>
                  <td className="p-2 border-r border-gray-100 text-center text-xs text-gray-600">{trabajador.trabajador.horasAnuales}h</td>
                  <td className="p-2 border-r border-gray-100 text-center text-xs font-medium text-gray-700">{trabajador.trabajador.horasSemanales}h</td>
                  {Array.from({ length: datos.periodo.diasMes }, (_, i) => {
                    const dia = i + 1;
                    const datosDia = trabajador.dias[dia];
                    return (
                      <td
                        key={dia}
                        className={`p-1 border-r border-gray-100 text-center ${datosDia.tipo === 'AUSENCIA' ? '' : 'cursor-pointer hover:bg-teal-50'}`}
                        onClick={() => (datosDia.tipo === 'TRABAJO' || datosDia.tipo === 'LIBRE') && abrirModalAjuste(trabajador, dia, datosDia)}
                        style={{
                          backgroundColor:
                            datosDia.tipo === 'AUSENCIA' && datosDia.estado === 'APROBADA' ? '#fca5a5' :
                            datosDia.tipo === 'AUSENCIA' && datosDia.estado === 'PENDIENTE' ? '#fde047' : 'transparent',
                          borderLeft: datosDia.tipo === 'AUSENCIA' ? '3px solid ' + (datosDia.estado === 'APROBADA' ? '#dc2626' : '#ca8a04') : 'none'
                        }}
                      >
                        {datosDia.tipo === 'AUSENCIA' ? (
                          <div className={`text-xs font-bold ${datosDia.estado === 'APROBADA' ? 'text-red-800' : 'text-yellow-800'}`}>
                            {datosDia.codigo}
                            {datosDia.estado === 'PENDIENTE' && <div className="text-[10px]">...</div>}
                          </div>
                        ) : datosDia.tipo === 'TRABAJO' ? (
                          <div className="rounded px-1 py-0.5 font-medium text-gray-700 text-xs">
                            {datosDia.horas > 0 ? datosDia.horas.toFixed(1) : '-'}
                          </div>
                        ) : (
                          <div className="text-gray-300 text-xs">-</div>
                        )}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center font-bold text-teal-700 bg-teal-50 text-sm">
                    {(trabajador.totales.horasTrabajadas || 0).toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modalAjuste.abierto && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-[0_25px_60px_rgba(0,0,0,0.15)] w-full max-w-md">
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-900">Ajuste Manual de Horas</h2>
              <p className="text-sm text-gray-400 mt-1">{modalAjuste.trabajadorNombre} - {modalAjuste.fecha}</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Centro <span className="text-rose-500">*</span></label>
                <select value={modalAjuste.centroId} onChange={(e) => setModalAjuste({ ...modalAjuste, centroId: e.target.value })} className={inputClass}>
                  <option value="">Seleccione un centro</option>
                  {centros.map(centro => (<option key={centro.id} value={centro.id}>{centro.nombre}</option>))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Hora Inicio <span className="text-rose-500">*</span></label>
                  <input type="time" value={modalAjuste.horaInicio} onChange={(e) => setModalAjuste({ ...modalAjuste, horaInicio: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-2">Hora Fin <span className="text-rose-500">*</span></label>
                  <input type="time" value={modalAjuste.horaFin} onChange={(e) => setModalAjuste({ ...modalAjuste, horaFin: e.target.value })} className={inputClass} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-2">Notas (opcional)</label>
                <textarea value={modalAjuste.notas} onChange={(e) => setModalAjuste({ ...modalAjuste, notas: e.target.value })} rows={3} placeholder="Ej: Ajuste solicitado por el trabajador" className={`${inputClass} resize-none`} />
              </div>
            </div>
            <div className="p-6 border-t border-gray-100 flex gap-3">
              <button onClick={cerrarModal} disabled={guardando} className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 font-medium text-sm disabled:opacity-50 transition-colors">
                Cancelar
              </button>
              <button onClick={guardarAjusteManual} disabled={guardando} className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : 'Guardar Ajuste'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
