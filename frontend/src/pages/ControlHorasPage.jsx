import React, { useState, useEffect } from 'react';

export default function ControlHorasPage({ api }) {
  // ========== ESTADOS ==========
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [datos, setDatos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [centros, setCentros] = useState([]);
  const [modalAjuste, setModalAjuste] = useState({
    abierto: false,
    trabajadorId: null,
    trabajadorNombre: '',
    fecha: '',
    dia: null,
    horaInicio: '',
    horaFin: '',
    centroId: '',
    notas: ''
  });
  const [guardando, setGuardando] = useState(false);

  // ========== FUNCIONES ==========
  const cargarDatos = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/control-horas?mes=${mes}&año=${año}`);
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
      const data = await api.get('/centros');
      setCentros(data.filter(c => c.activo));
    } catch (error) {
      console.error('Error cargando centros:', error);
    }
  };

  const abrirModalAjuste = (trabajador, dia, datosDia) => {
    const fecha = new Date(año, mes - 1, dia);
    const fechaISO = fecha.toISOString().split('T')[0];
    
    // Obtener primer centro si existe
    const primerCentro = datosDia.centros && datosDia.centros.length > 0 ? datosDia.centros[0] : null;
    
    setModalAjuste({
      abierto: true,
      trabajadorId: trabajador.trabajador.id,
      trabajadorNombre: `${trabajador.trabajador.nombre} ${trabajador.trabajador.apellidos}`,
      fecha: fechaISO,
      dia: dia,
      horaInicio: '08:00',
      horaFin: '16:00',
      centroId: primerCentro ? primerCentro.id.toString() : '',
      notas: datosDia.notas || ''
    });
  };

  const cerrarModal = () => {
    setModalAjuste({
      abierto: false,
      trabajadorId: null,
      trabajadorNombre: '',
      fecha: '',
      dia: null,
      horaInicio: '',
      horaFin: '',
      centroId: '',
      notas: ''
    });
  };

  const guardarAjusteManual = async () => {
    if (!modalAjuste.centroId || !modalAjuste.horaInicio || !modalAjuste.horaFin) {
      alert('Debe completar todos los campos obligatorios');
      return;
    }

    try {
      setGuardando(true);
      
      const usuarioId = parseInt(localStorage.getItem('userId'));
      
      await api.post('/ajustes-manuales', {
        trabajadorId: modalAjuste.trabajadorId,
        centroId: parseInt(modalAjuste.centroId),
        fecha: modalAjuste.fecha,
        horaInicio: modalAjuste.horaInicio,
        horaFin: modalAjuste.horaFin,
        notas: modalAjuste.notas,
        usuarioId: usuarioId
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

  // ========== useEffect ==========
  useEffect(() => {
    cargarDatos();
  }, [mes, año]);

  useEffect(() => {
    cargarCentros();
  }, []);

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="mt-4 text-slate-600">Cargando control de horas...</p>
        </div>
      </div>
    );
  }

  if (!datos) return null;

  return (
    <div className="p-6 bg-slate-50 min-h-screen">
      {/* HEADER */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Control de Horas</h1>
        <p className="text-slate-600 mt-1">Tabla de control mensual para RR.HH</p>
      </div>

      {/* FILTROS */}
      <div className="mb-6 flex gap-3 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
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
          Actualizar
        </button>
      </div>

      {/* TABLA */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 sticky top-0">
              <tr>
                <th className="p-2 text-left font-semibold text-slate-700 border-r border-slate-300 sticky left-0 bg-slate-100 z-10 min-w-[50px]">Cód</th>
                <th className="p-2 text-left font-semibold text-slate-700 border-r border-slate-300 sticky left-[50px] bg-slate-100 z-10 min-w-[180px]">Trabajador</th>
                <th className="p-2 text-left font-semibold text-slate-700 border-r border-slate-300 min-w-[150px]">Centro</th>
                <th className="p-2 text-center font-semibold text-slate-700 border-r border-slate-200 min-w-[80px]">Cód Contrato</th>
                <th className="p-2 text-center font-semibold text-slate-700 border-r border-slate-200 min-w-[60px]">%</th>
                <th className="p-2 text-center font-semibold text-slate-700 border-r border-slate-200 min-w-[80px]">H/Año</th>
                <th className="p-2 text-center font-semibold text-slate-700 border-r border-slate-200 min-w-[80px]">H/Sem</th>
                {Array.from({ length: datos.periodo.diasMes }, (_, i) => {
                  const dia = i + 1;
                  const fecha = new Date(año, mes - 1, dia);
                  const esDomingo = fecha.getDay() === 0;
                  
                  return (
                    <th 
                      key={dia} 
                      className={`p-2 text-center font-semibold border-r border-slate-200 min-w-[60px] ${
                        esDomingo ? 'bg-red-100 text-red-700' : 'text-slate-700'
                      }`}
                    >
                      <div>{dia}</div>
                      <div className="text-xs font-normal">
                        {fecha.toLocaleDateString('es-ES', { weekday: 'short' })}
                      </div>
                    </th>
                  );
                })}
                <th className="p-2 text-center font-semibold text-slate-700 bg-blue-50 min-w-[100px]">
                  Total Horas
                </th>
              </tr>
            </thead>
            <tbody>
              {datos.trabajadores.map((trabajador, idx) => (
                <tr key={trabajador.trabajador.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                  <td className="p-2 border-r border-slate-300 sticky left-0 bg-inherit z-10 text-center font-mono text-sm">
                    {trabajador.trabajador.codigo}
                  </td>
                  <td className="p-2 border-r border-slate-300 sticky left-[50px] bg-inherit z-10">
                    <div className="font-medium text-slate-900 text-sm">
                      {trabajador.trabajador.nombre} {trabajador.trabajador.apellidos}
                    </div>
                    <div className="text-xs text-slate-500">
                      {trabajador.trabajador.categoria}
                    </div>
                  </td>
                  <td className="p-2 border-r border-slate-300 text-xs text-slate-600">
                    {trabajador.trabajador.centrosDelMes || '-'}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center text-xs font-mono">
                    {trabajador.trabajador.codigoContrato}
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center text-sm font-semibold">
                    {trabajador.trabajador.porcentajeJornada}%
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center text-sm">
                    {trabajador.trabajador.horasAnuales}h
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center text-sm font-medium">
                    {trabajador.trabajador.horasSemanales}h
                  </td>
                  
                  {Array.from({ length: datos.periodo.diasMes }, (_, i) => {
                    const dia = i + 1;
                    const datosDia = trabajador.dias[dia];

                    return (
                      <td 
  key={dia}
  className={`p-1 border-r border-slate-200 text-center ${
    datosDia.tipo === 'AUSENCIA' ? '' : 'cursor-pointer hover:bg-blue-50'
  }`}
  onClick={() => (datosDia.tipo === 'TRABAJO' || datosDia.tipo === 'LIBRE') && abrirModalAjuste(trabajador, dia, datosDia)}
  style={{
    backgroundColor: 
      datosDia.tipo === 'AUSENCIA' && datosDia.estado === 'APROBADA' ? '#fca5a5' : // Rojo claro
      datosDia.tipo === 'AUSENCIA' && datosDia.estado === 'PENDIENTE' ? '#fde047' : // Amarillo
      'transparent',
    borderLeft: datosDia.tipo === 'AUSENCIA' ? '3px solid ' + (datosDia.estado === 'APROBADA' ? '#dc2626' : '#ca8a04') : 'none'
  }}
>
  {datosDia.tipo === 'AUSENCIA' ? (
    <div className={`text-xs font-bold ${
      datosDia.estado === 'APROBADA' ? 'text-red-800' : 'text-yellow-800'
    }`}>
      {datosDia.codigo}
      {datosDia.estado === 'PENDIENTE' && <div className="text-[10px]">⏳</div>}
    </div>
                        ) : datosDia.tipo === 'TRABAJO' ? (
                          <div className="rounded px-1 py-0.5 font-medium text-slate-700">
                            {datosDia.horas > 0 ? datosDia.horas.toFixed(1) : '-'}
                          </div>
                        ) : (
                          <div className="text-slate-400">-</div>
                        )}
                      </td>
                    );
                  })}
                  
                  <td className="p-2 text-center font-bold text-slate-900 bg-blue-50">
                    {(trabajador.totales.horasTrabajadas || 0).toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL AJUSTE MANUAL */}
      {modalAjuste.abierto && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-xl font-bold text-slate-900">Ajuste Manual de Horas</h2>
              <p className="text-sm text-slate-600 mt-1">
                {modalAjuste.trabajadorNombre} - {modalAjuste.fecha}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Centro <span className="text-red-500">*</span>
                </label>
                <select
                  value={modalAjuste.centroId}
                  onChange={(e) => setModalAjuste({ ...modalAjuste, centroId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Seleccione un centro</option>
                  {centros.map(centro => (
                    <option key={centro.id} value={centro.id}>
                      {centro.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hora Inicio <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={modalAjuste.horaInicio}
                  onChange={(e) => setModalAjuste({ ...modalAjuste, horaInicio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Hora Fin <span className="text-red-500">*</span>
                </label>
                <input
                  type="time"
                  value={modalAjuste.horaFin}
                  onChange={(e) => setModalAjuste({ ...modalAjuste, horaFin: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Notas (opcional)
                </label>
                <textarea
                  value={modalAjuste.notas}
                  onChange={(e) => setModalAjuste({ ...modalAjuste, notas: e.target.value })}
                  rows={3}
                  placeholder="Ej: Ajuste solicitado por el trabajador"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 flex gap-3 justify-end">
              <button
                onClick={cerrarModal}
                disabled={guardando}
                className="px-4 py-2 text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 font-medium disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={guardarAjusteManual}
                disabled={guardando}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium disabled:opacity-50 flex items-center gap-2"
              >
                {guardando ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Guardando...
                  </>
                ) : (
                  'Guardar Ajuste'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}