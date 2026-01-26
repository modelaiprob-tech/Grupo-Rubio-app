  


  import React, { useState, useEffect } from 'react';
export default function DashboardPage({ api, setCurrentPage }) {
  
    const [stats, setStats] = useState({
      trabajadoresActivos: 0,
      trabajadoresEnBaja: 0,
      turnosHoy: 0,
      clientesActivos: 0,
      ausenciasPendientes: 0
    });
    const [dashboardCEO, setDashboardCEO] = useState(null);
    const [loadingCEO, setLoadingCEO] = useState(true);
    const [mes, setMes] = useState(new Date().getMonth() + 1);
    const [año, setAño] = useState(new Date().getFullYear());

    useEffect(() => {
      cargarDatos();
    }, [mes, año]);

    const cargarDatos = async () => {
      try {
        const statsData = await api.get('/dashboard/stats');
        setStats(statsData);
      } catch (err) {
        console.error('Error cargando stats:', err);
      }

      try {
        setLoadingCEO(true);
        const ceoData = await api.get(`/dashboard/ejecutivo?mes=${mes}&año=${año}`);
        setDashboardCEO(ceoData);  // ✅ CORRECTO
      } catch (err) {
        console.error('Error cargando dashboard CEO:', err);
        setDashboardCEO(null);
      } finally {
        setLoadingCEO(false);
      }
    };

    const formatCurrency = (value) => {
      return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(value);
    };

    const getSeveridadColor = (severidad) => {
      switch (severidad) {
        case 'CRÍTICA': return 'bg-red-100 border-red-300 text-red-800';
        case 'ALTA': return 'bg-orange-100 border-orange-300 text-orange-800';
        case 'MEDIA': return 'bg-yellow-100 border-yellow-300 text-yellow-800';
        default: return 'bg-blue-100 border-blue-300 text-blue-800';
      }
    };

    return (
      <div className="p-6 bg-slate-50 min-h-screen">
        {/* HEADER */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-slate-900">Panel Ejecutivo</h1>
          <p className="text-slate-600 mt-1">Visión general del negocio</p>
        </div>

        {/* SELECTOR DE PERIODO */}
        <div className="mb-6 flex gap-3">
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={2024}>2024</option>
            <option value={2025}>2025</option>
            <option value={2026}>2026</option>
          </select>
        </div>

        {loadingCEO ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            <p className="mt-4 text-slate-600">Cargando dashboard...</p>
          </div>
        ) : !dashboardCEO ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <p className="text-slate-500 text-lg">No hay datos disponibles para este período</p>
            <p className="text-slate-400 text-sm mt-2">Completa registros de horas para ver el dashboard ejecutivo</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* KPIs FINANCIEROS */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Indicadores Financieros</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
                  <p className="text-sm text-blue-700 font-medium mb-1">Ingresos Totales</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {formatCurrency(dashboardCEO.kpisFinancieros.ingresosTotales)}
                  </p>
                  <p className={`text-sm mt-2 font-semibold ${dashboardCEO.kpisFinancieros.variacionIngresos >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                    {dashboardCEO.kpisFinancieros.variacionIngresos >= 0 ? '+' : ''}
                    {dashboardCEO.kpisFinancieros.variacionIngresos}% vs mes anterior
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
                  <p className="text-sm text-green-700 font-medium mb-1">Margen Bruto</p>
                  <p className="text-3xl font-bold text-green-900">
                    {formatCurrency(dashboardCEO.kpisFinancieros.margenBruto)}
                  </p>
                  <p className="text-sm mt-2 text-green-700 font-semibold">
                    {dashboardCEO.kpisFinancieros.porcentajeMargen}% margen
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
                  <p className="text-sm text-purple-700 font-medium mb-1">Horas Facturables</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {dashboardCEO.kpisFinancieros.horasFacturables.toLocaleString('es-ES')}h
                  </p>
                  <p className="text-sm mt-2 text-purple-700">
                    {(dashboardCEO.kpisFinancieros.ingresosTotales / dashboardCEO.kpisFinancieros.horasFacturables).toFixed(2)}€/hora
                  </p>
                </div>

                <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-xl p-5 border border-cyan-200">
                  <p className="text-sm text-cyan-700 font-medium mb-1">Utilización</p>
                  <p className="text-3xl font-bold text-cyan-900">
                    {dashboardCEO.kpisOperativos.utilizacion}%
                  </p>
                  <p className="text-sm mt-2 text-cyan-700">
                    {dashboardCEO.kpisOperativos.horasTrabajadas}h / {dashboardCEO.kpisOperativos.horasDisponibles}h
                  </p>
                </div>
              </div>
            </div>

            {/* TOP CLIENTES */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Top 5 Clientes por Facturación</h2>
              {dashboardCEO.topClientes.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No hay datos de clientes</p>
              ) : (
                <div className="space-y-3">
                  {dashboardCEO.topClientes.map((cliente, idx) => (
                    <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{cliente.nombre}</p>
                          <p className="text-sm text-slate-500">{cliente.horas}h trabajadas</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-slate-900">{formatCurrency(cliente.ingresos)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ALERTAS CRÍTICAS */}
            {dashboardCEO.alertasCriticas.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-900 mb-4">Alertas Críticas</h2>
                <div className="space-y-2">
                  {dashboardCEO.alertasCriticas.map((alerta, idx) => (
                    <div key={idx} className={`p-4 rounded-lg border-2 ${getSeveridadColor(alerta.severidad)}`}>
                      <div className="flex items-start gap-3">
                        <span className="text-lg font-bold">
                          {alerta.severidad === 'CRÍTICA' ? '🔴' : alerta.severidad === 'ALTA' ? '🟠' : '🟡'}
                        </span>
                        <div className="flex-1">
                          <p className="font-medium">{alerta.mensaje}</p>
                          <p className="text-xs mt-1 opacity-75">Tipo: {alerta.tipo}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* EFICIENCIA OPERATIVA */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Eficiencia Operativa</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Ratio Horas Extra</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardCEO.eficiencia.ratioHorasExtras}%</p>
                  <p className={`text-sm mt-1 ${dashboardCEO.eficiencia.ratioHorasExtras < 10 ? 'text-green-600' : 'text-orange-600'
                    }`}>
                    {dashboardCEO.eficiencia.ratioHorasExtras < 10 ? 'Óptimo' : 'Revisar planificación'}
                  </p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Ausencias No Planificadas</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardCEO.eficiencia.ausenciasNoPlanificadas}</p>
                  <p className="text-sm text-slate-500 mt-1">Bajas médicas este mes</p>
                </div>

                <div className="bg-slate-50 rounded-xl p-4">
                  <p className="text-sm text-slate-600 mb-1">Cobertura de Turnos</p>
                  <p className="text-2xl font-bold text-slate-900">{dashboardCEO.eficiencia.coberturaTurnos}%</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {dashboardCEO.eficiencia.totalAsignaciones} asignaciones totales
                  </p>
                </div>
              </div>
            </div>

            {/* STATS RÁPIDAS (las que ya tenías) */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Estado Actual</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-sm text-blue-700">Trabajadores Activos</p>
                  <p className="text-3xl font-bold text-blue-900 mt-2">{stats.trabajadoresActivos}</p>
                </div>
                <div className="bg-red-50 rounded-xl p-4">
                  <p className="text-sm text-red-700">En Baja Médica</p>
                  <p className="text-3xl font-bold text-red-900 mt-2">{stats.trabajadoresEnBaja}</p>
                </div>
                <div className="bg-purple-50 rounded-xl p-4">
                  <p className="text-sm text-purple-700">Clientes Activos</p>
                  <p className="text-3xl font-bold text-purple-900 mt-2">{stats.clientesActivos}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4">
                  <p className="text-sm text-amber-700">Ausencias Pendientes</p>
                  <p className="text-3xl font-bold text-amber-900 mt-2">{stats.ausenciasPendientes}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
