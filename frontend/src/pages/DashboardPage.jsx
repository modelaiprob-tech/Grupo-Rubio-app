import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApiClient } from '../contexts/AuthContext';
import * as dashboardApi from '../services/dashboardApi';
import {
  Banknote, ArrowUp, ArrowDown, Timer, Target, Bell,
  UserCheck, Store, CalendarX, Activity, Sparkles
} from 'lucide-react';

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

const MESES = Array.from({ length: 12 }, (_, i) =>
  new Date(2024, i).toLocaleDateString('es-ES', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())
);

export default function DashboardPage() {
  const api = useApiClient();
  const navigate = useNavigate();
  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');

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
      const statsData = await dashboardApi.getStats(api);
      setStats(statsData);
    } catch (err) {
      console.error('Error cargando stats:', err);
    }

    try {
      setLoadingCEO(true);
      const ceoData = await dashboardApi.getEjecutivo(api, mes, año);
      setDashboardCEO(ceoData);
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

  const ceo = dashboardCEO;
  const font = { fontFamily: '"Outfit", sans-serif' };

  if (loadingCEO) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center" style={font}>
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1.5">
            {[0, 150, 300].map(d => (
              <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
            ))}
          </div>
          <p className="text-gray-400 text-sm font-medium">Cargando panel...</p>
        </div>
      </div>
    );
  }

  if (!ceo) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center" style={font}>
        <div className="bg-white rounded-3xl p-14 text-center shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_8px_rgba(0,0,0,0.06)] max-w-md">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-gray-50 flex items-center justify-center">
            <Sparkles size={28} className="text-gray-300" />
          </div>
          <p className="text-gray-800 text-xl font-semibold">Sin datos disponibles</p>
          <p className="text-gray-400 text-sm mt-3 leading-relaxed">Completa registros de horas para activar el panel ejecutivo de este periodo</p>
        </div>
      </div>
    );
  }

  const precioHora = ceo.kpisFinancieros.horasFacturables > 0
    ? (ceo.kpisFinancieros.ingresosTotales / ceo.kpisFinancieros.horasFacturables).toFixed(2)
    : '0.00';
  const maxIngresos = Math.max(...ceo.topClientes.map(c => c.ingresos), 1);

  const selectClass = 'bg-white border border-gray-200 text-gray-700 text-sm rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 shadow-sm cursor-pointer font-medium';
  const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)] hover:shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_8px_24px_rgba(0,0,0,0.07)] transition-all duration-300';

  const kpis = [
    {
      label: 'Ingresos Totales', value: formatCurrency(ceo.kpisFinancieros.ingresosTotales),
      change: ceo.kpisFinancieros.variacionIngresos, hasChange: true,
      icon: Banknote, iconBg: 'bg-teal-50', iconColor: 'text-teal-600'
    },
    {
      label: 'Margen Bruto', value: formatCurrency(ceo.kpisFinancieros.margenBruto),
      sub: `${ceo.kpisFinancieros.porcentajeMargen}% de margen`,
      icon: ArrowUp, iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600'
    },
    {
      label: 'Horas Facturables', value: `${ceo.kpisFinancieros.horasFacturables.toLocaleString('es-ES')}h`,
      sub: `${precioHora}€ por hora`,
      icon: Timer, iconBg: 'bg-violet-50', iconColor: 'text-violet-600'
    },
    {
      label: 'Utilizacion', value: `${ceo.kpisOperativos.utilizacion}%`,
      sub: `${ceo.kpisOperativos.horasTrabajadas}h de ${ceo.kpisOperativos.horasDisponibles}h`,
      icon: Target, iconBg: 'bg-amber-50', iconColor: 'text-amber-600',
      hasBar: true, barValue: ceo.kpisOperativos.utilizacion
    },
  ];

  const severityStyles = (s) => {
    if (s === 'CRÍTICA') return { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-600' };
    if (s === 'ALTA') return { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-600' };
    return { dot: 'bg-sky-500', bg: 'bg-sky-50', text: 'text-sky-700', badge: 'bg-sky-100 text-sky-600' };
  };

  const hoy = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).replace(/^\w/, c => c.toUpperCase());

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-8 gap-4">
        <div>
          <p className="text-gray-400 text-sm font-medium mb-1">{hoy}</p>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Panel Ejecutivo</h1>
        </div>
        <div className="flex gap-3">
          <select value={mes} onChange={(e) => setMes(parseInt(e.target.value))} className={selectClass}>
            {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={año} onChange={(e) => setAño(parseInt(e.target.value))} className={selectClass}>
            {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className={cardClass}>
              <div className="flex items-center gap-3 mb-5">
                <div className={`w-11 h-11 rounded-xl ${kpi.iconBg} flex items-center justify-center`}>
                  <Icon size={20} className={kpi.iconColor} />
                </div>
                <p className="text-sm text-gray-500 font-medium">{kpi.label}</p>
              </div>
              <p className="text-3xl font-bold text-gray-900 tracking-tight">{kpi.value}</p>
              {kpi.hasChange && (
                <div className="flex items-center gap-1.5 mt-3">
                  <div className={`flex items-center gap-0.5 text-sm font-semibold ${kpi.change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {kpi.change >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    {kpi.change >= 0 ? '+' : ''}{kpi.change}%
                  </div>
                  <span className="text-sm text-gray-400">vs mes anterior</span>
                </div>
              )}
              {kpi.sub && !kpi.hasChange && <p className="text-sm text-gray-400 mt-3">{kpi.sub}</p>}
              {kpi.hasBar && (
                <div className="mt-4">
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(kpi.barValue, 100)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* TOP CLIENTES */}
      <div className={`${cardClass} mb-8`}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-gray-900">Top Clientes por Facturacion</h3>
          <span className="text-xs font-semibold text-teal-600 bg-teal-50 px-3 py-1 rounded-full">{ceo.topClientes.length} clientes</span>
        </div>
        {ceo.topClientes.length === 0 ? (
          <p className="text-gray-400 text-center py-10 text-sm">Sin datos de clientes</p>
        ) : (
          <div className="space-y-4">
            {ceo.topClientes.map((cliente, idx) => (
              <div key={idx} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      idx === 0 ? 'bg-teal-500 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {idx + 1}
                    </div>
                    <span className="text-sm font-semibold text-gray-800">{cliente.nombre}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-gray-900">{formatCurrency(cliente.ingresos)}</span>
                    <span className="text-xs text-gray-400 ml-2">{cliente.horas}h</span>
                  </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-500 transition-all duration-700"
                    style={{ width: `${(cliente.ingresos / maxIngresos) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* EFICIENCIA + ALERTAS */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-8">
        {/* Eficiencia */}
        <div className={`lg:col-span-3 ${cardClass}`}>
          <h3 className="text-lg font-bold text-gray-900 mb-6">Eficiencia Operativa</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Activity size={15} className="text-gray-400" />
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Horas Extra</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{ceo.eficiencia.ratioHorasExtras}%</p>
              <p className={`text-xs font-medium mt-2 ${ceo.eficiencia.ratioHorasExtras < 10 ? 'text-emerald-600' : 'text-orange-600'}`}>
                {ceo.eficiencia.ratioHorasExtras < 10 ? 'Nivel optimo' : 'Revisar planificacion'}
              </p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <CalendarX size={15} className="text-gray-400" />
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Ausencias</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{ceo.eficiencia.ausenciasNoPlanificadas}</p>
              <p className="text-xs text-gray-400 mt-2">Bajas medicas este mes</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-5">
              <div className="flex items-center gap-2 mb-3">
                <Target size={15} className="text-gray-400" />
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Cobertura</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">{ceo.eficiencia.coberturaTurnos}%</p>
              <p className="text-xs text-gray-400 mt-2">{ceo.eficiencia.totalAsignaciones} asignaciones</p>
            </div>
          </div>
        </div>

        {/* Alertas */}
        <div className={`lg:col-span-2 ${cardClass}`}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-gray-900">Alertas</h3>
            {ceo.alertasCriticas.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-xs font-semibold text-rose-600">{ceo.alertasCriticas.length}</span>
              </div>
            )}
          </div>
          {ceo.alertasCriticas.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full bg-emerald-50 flex items-center justify-center">
                <Sparkles size={18} className="text-emerald-400" />
              </div>
              <p className="text-sm text-gray-400">Sin alertas activas</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-56 overflow-y-auto">
              {ceo.alertasCriticas.map((alerta, idx) => {
                const s = severityStyles(alerta.severidad);
                return (
                  <div key={idx} className={`p-3.5 rounded-xl ${s.bg} transition-colors`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${s.dot}`} />
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm leading-snug font-medium ${s.text}`}>{alerta.mensaje}</p>
                        <span className={`inline-block text-xs font-semibold mt-1.5 px-2 py-0.5 rounded-md ${s.badge}`}>
                          {alerta.severidad}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ESTADO ACTUAL */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          { label: 'Trabajadores Activos', value: stats.trabajadoresActivos, icon: UserCheck, color: 'bg-teal-50 text-teal-600' },
          { label: 'En Baja Medica', value: stats.trabajadoresEnBaja, icon: CalendarX, color: 'bg-rose-50 text-rose-600' },
          { label: 'Clientes Activos', value: stats.clientesActivos, icon: Store, color: 'bg-violet-50 text-violet-600' },
          { label: 'Ausencias Pendientes', value: stats.ausenciasPendientes, icon: Bell, color: 'bg-amber-50 text-amber-600' },
        ].map((item, idx) => {
          const Icon = item.icon;
          return (
            <div key={idx} className={cardClass}>
              <div className={`w-10 h-10 rounded-xl ${item.color.split(' ')[0]} flex items-center justify-center mb-4`}>
                <Icon size={18} className={item.color.split(' ')[1]} />
              </div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-1">{item.label}</p>
              <p className="text-3xl font-bold text-gray-900">{item.value}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
