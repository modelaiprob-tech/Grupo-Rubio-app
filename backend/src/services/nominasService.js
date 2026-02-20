const prisma = require('../config/prisma');
const { calcularTotalHoras, calcularHorasNocturnas, esFestivo, esDomingo } = require('../../utils/calcularHoras');
const { calcularPrecioHora, calcularPlusesMensuales } = require('../../utils/calcularPrecioHora');
const { calcularImporteAusencia } = require('../../utils/calcularImporteAusencia');

/**
 * Obtener numero de semana del ano
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ============================================
// Calcular nomina de un trabajador
// ============================================
async function calcular(trabajadorId, mes, año, centroId) {
  if (!mes || !año) {
    throw { status: 400, error: 'Faltan parámetros mes y año' };
  }

  const trabajador = await prisma.trabajador.findUnique({
    where: { id: parseInt(trabajadorId) },
    include: {
      categoria: true,
      acuerdosIndividuales: {
        where: { activo: true },
        include: { centro: true }
      }
    }
  });

  if (!trabajador) {
    throw { status: 404, error: 'Trabajador no encontrado' };
  }

  const fechaInicio = new Date(parseInt(año), parseInt(mes) - 1, 1);
  const fechaFin = new Date(parseInt(año), parseInt(mes), 0);

  const asignaciones = await prisma.asignacion.findMany({
    where: {
      trabajadorId: parseInt(trabajadorId),
      fecha: { gte: fechaInicio, lte: fechaFin },
      estado: { notIn: ['CANCELADO'] },
      ...(centroId && { centroId: parseInt(centroId) })
    },
    include: { centro: true },
    orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
  });

  const ausencias = await prisma.ausencia.findMany({
    where: {
      trabajadorId: parseInt(trabajadorId),
      estado: 'APROBADA',
      fechaInicio: { lte: fechaFin },
      fechaFin: { gte: fechaInicio }
    },
    include: { tipoAusencia: true }
  });

  // Excluir asignaciones durante períodos de ausencia aprobada
  // (esas horas se pagan vía cálculo de ausencias, no como horas trabajadas)
  const asignacionesFiltradas = asignaciones.filter(asig => {
    const fechaAsig = new Date(asig.fecha);
    return !ausencias.some(aus => {
      return fechaAsig >= new Date(aus.fechaInicio) && fechaAsig <= new Date(aus.fechaFin);
    });
  });

  // Calcular horas por tipo con acumulacion semanal
  let horasNormales = 0;
  let horasNocturnas = 0;
  let horasFestivas = 0;
  let horasExtra = 0;
  const horasContrato = parseFloat(trabajador.horasContrato);

  const asignacionesPorSemana = {};
  asignacionesFiltradas.forEach(asig => {
    const semana = getWeekNumber(new Date(asig.fecha));
    if (!asignacionesPorSemana[semana]) {
      asignacionesPorSemana[semana] = [];
    }
    asignacionesPorSemana[semana].push(asig);
  });

  for (const asignacionesSemana of Object.values(asignacionesPorSemana)) {
    let horasAcumuladasSemana = 0;

    for (const asig of asignacionesSemana) {
      const horas = calcularTotalHoras(asig.horaInicio, asig.horaFin);
      const horasNocturnasAsig = calcularHorasNocturnas(asig.horaInicio, asig.horaFin);
      const esFestivoODomingo = await esFestivo(asig.fecha) || esDomingo(asig.fecha);

      const horasAcumuladas = horasAcumuladasSemana + horas;
      let normales = 0;
      let extras = 0;

      if (horasAcumuladas <= horasContrato) {
        normales = horas;
      } else if (horasAcumuladasSemana >= horasContrato) {
        extras = horas;
      } else {
        normales = horasContrato - horasAcumuladasSemana;
        extras = horas - normales;
      }

      horasNormales += normales;
      horasExtra += extras;
      horasNocturnas += horasNocturnasAsig;
      if (esFestivoODomingo) {
        horasFestivas += horas;
      }

      horasAcumuladasSemana = horasAcumuladas;
    }
  }

  // Calcular importes
  const centroIdParsed = centroId ? parseInt(centroId) : null;
  const precioHoraNormal = calcularPrecioHora(trabajador, centroIdParsed, 'NORMAL');
  const precioHoraNocturna = calcularPrecioHora(trabajador, centroIdParsed, 'NOCTURNA');
  const precioHoraFestiva = calcularPrecioHora(trabajador, centroIdParsed, 'FESTIVA');
  const precioHoraExtra = calcularPrecioHora(trabajador, centroIdParsed, 'EXTRA');

  // Base: todas las horas trabajadas al precio base
  const importeNormal = (horasNormales + horasExtra) * precioHoraNormal;
  // Recargos: solo la diferencia sobre el precio base (ya están contadas arriba)
  const importeNocturno = horasNocturnas * (precioHoraNocturna - precioHoraNormal);
  const importeFestivo = horasFestivas * (precioHoraFestiva - precioHoraNormal);
  const importeExtra = horasExtra * (precioHoraExtra - precioHoraNormal);

  // Calcular dias de ausencia y su coste
  let diasAusencia = 0;
  let importeAusencias = 0;

  for (const ausencia of ausencias) {
    const inicio = new Date(ausencia.fechaInicio) > fechaInicio ? new Date(ausencia.fechaInicio) : fechaInicio;
    const fin = new Date(ausencia.fechaFin) < fechaFin ? new Date(ausencia.fechaFin) : fechaFin;

    const dias = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;
    diasAusencia += dias;

    const calculo = await calcularImporteAusencia(trabajador, { ...ausencia, fechaInicio: inicio, fechaFin: fin });
    importeAusencias += calculo.importeTotal;
  }

  // Pluses mensuales
  const plusesMensuales = calcularPlusesMensuales(trabajador, centroIdParsed);

  // Total
  const totalBruto = importeNormal + importeNocturno + importeFestivo + importeExtra + importeAusencias + plusesMensuales;

  return {
    trabajador: {
      id: trabajador.id,
      nombre: trabajador.nombre,
      apellidos: trabajador.apellidos,
      categoria: trabajador.categoria.nombre
    },
    periodo: { mes: parseInt(mes), año: parseInt(año) },
    horas: {
      normales: horasNormales.toFixed(2),
      nocturnas: horasNocturnas.toFixed(2),
      festivas: horasFestivas.toFixed(2),
      extra: horasExtra.toFixed(2)
    },
    precios: {
      normal: precioHoraNormal.toFixed(2),
      nocturna: precioHoraNocturna.toFixed(2),
      festiva: precioHoraFestiva.toFixed(2),
      extra: precioHoraExtra.toFixed(2)
    },
    importes: {
      normal: importeNormal.toFixed(2),
      nocturno: importeNocturno.toFixed(2),
      festivo: importeFestivo.toFixed(2),
      extra: importeExtra.toFixed(2),
      ausencias: importeAusencias.toFixed(2),
      pluses: plusesMensuales.toFixed(2)
    },
    ausencias: {
      dias: diasAusencia,
      detalle: ausencias.map(a => ({
        tipo: a.tipoAusencia.nombre,
        fechaInicio: a.fechaInicio,
        fechaFin: a.fechaFin,
        porcentajeCobro: a.tipoAusencia.porcentajeCobro
      }))
    },
    totalBruto: totalBruto.toFixed(2)
  };
}

module.exports = {
  calcular
};
