import { useState, useEffect, useCallback, useMemo } from 'react';

export function useAusencias(api, weekDates) {
  const [ausenciasActivas, setAusenciasActivas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Crear una clave única que solo cambia cuando cambia la semana
  const semanaKey = useMemo(() => {
    if (!weekDates || weekDates.length === 0) return null;
    return weekDates[0].toISOString().split('T')[0];
  }, [weekDates[0]?.getTime()]);

  const cargarAusencias = useCallback(async () => {
    if (!weekDates || weekDates.length === 0 || !api) return;
    
    setLoading(true);
    try {
      const ausencias = await api.get('/ausencias');
      
      const activas = ausencias.filter(a => {
        const inicio = new Date(a.fechaInicio);
        inicio.setHours(0, 0, 0, 0);
        const fin = new Date(a.fechaFin);
        fin.setHours(23, 59, 59, 999);
        
        const inicioSemana = new Date(weekDates[0]);
        inicioSemana.setHours(0, 0, 0, 0);
        const finSemana = new Date(weekDates[6]);
        finSemana.setHours(23, 59, 59, 999);
        
        return (inicio <= finSemana && fin >= inicioSemana);
      });

      console.log(`✅ Ausencias cargadas: ${activas.length}`);
      setAusenciasActivas(activas);
    } catch (err) {
      console.error('❌ Error cargando ausencias:', err);
    } finally {
      setLoading(false);
    }
  }, [semanaKey]);

  useEffect(() => {
    if (semanaKey) {
      cargarAusencias();
    }
  }, [semanaKey]);

  const getAusencia = useCallback((trabajadorId, fecha) => {
  const fechaBusqueda = new Date(fecha);
  fechaBusqueda.setHours(12, 0, 0, 0);
  
  const ausencia = ausenciasActivas.find(a => {
    const inicio = new Date(a.fechaInicio);
    inicio.setHours(0, 0, 0, 0);
    
    // ✅ USAR fechaAltaReal si existe, sino fechaFin
    const finReal = a.fechaAltaReal ? new Date(a.fechaAltaReal) : new Date(a.fechaFin);
    finReal.setHours(23, 59, 59, 999);
    
    return a.trabajadorId === trabajadorId && 
           fechaBusqueda >= inicio && 
           fechaBusqueda <= finReal;  // ← Cambio aquí
  });
  
  return ausencia;
}, [ausenciasActivas]);
    


  const tieneAusenciaConfirmada = useCallback((trabajadorId, fecha) => {
    const ausencia = getAusencia(trabajadorId, fecha);
    return ausencia?.estado === 'APROBADA';
  }, [getAusencia]);

  const getColorTrabajador = useCallback((trabajadorId, fecha) => {
    const ausencia = getAusencia(trabajadorId, fecha);
    
    if (!ausencia) return '#3b82f6'; // Azul - disponible
    if (ausencia.estado === 'APROBADA') return '#ef4444'; // Rojo - confirmada
    if (ausencia.estado === 'PENDIENTE') return '#eab308'; // Amarillo - pendiente
    return '#3b82f6';
  }, [getAusencia]);

  const getEstadoTrabajador = useCallback((trabajadorId, fecha) => {
    const ausencia = getAusencia(trabajadorId, fecha);
    if (!ausencia) return null;
    
    if (ausencia.estado === 'APROBADA') return `🔴 ${ausencia.tipoAusencia?.nombre || 'AUSENCIA'}`;
    if (ausencia.estado === 'PENDIENTE') return `🟡 ${ausencia.tipoAusencia?.nombre || 'PENDIENTE'}`;
    return null;
  }, [getAusencia]);

  return {
    ausenciasActivas,
    loading,
    cargarAusencias,
    getAusencia,
    tieneAusenciaConfirmada,
    getColorTrabajador,
    getEstadoTrabajador
  };
}