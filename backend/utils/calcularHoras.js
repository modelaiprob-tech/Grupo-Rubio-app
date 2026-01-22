/**
 * UTILIDAD PARA CALCULAR HORAS
 * Grupo Rubio - Sistema de Gestión
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Calcula total de horas entre horaInicio y horaFin
 */
function calcularTotalHoras(horaInicio, horaFin) {
  const [inicioH, inicioM] = horaInicio.split(':').map(Number);
  const [finH, finM] = horaFin.split(':').map(Number);
  
  let totalMinutos = 0;
  
  if (finH < inicioH) {
    // Turno cruza medianoche
    totalMinutos = ((24 - inicioH) * 60 - inicioM) + (finH * 60 + finM);
  } else {
    totalMinutos = (finH * 60 + finM) - (inicioH * 60 + inicioM);
  }
  
  return totalMinutos / 60;
}

/**
 * Calcula horas nocturnas en un rango (23:00 - 06:00)
 */
function calcularHorasNocturnas(horaInicio, horaFin) {
  const [inicioH, inicioM] = horaInicio.split(':').map(Number);
  const [finH, finM] = horaFin.split(':').map(Number);
  
  let minutosNocturnos = 0;
  let horaActual = inicioH;
  let minActual = inicioM;
  
  while (horaActual !== finH || minActual !== finM) {
    if (horaActual >= 23 || horaActual < 6) {
      minutosNocturnos++;
    }
    
    minActual++;
    if (minActual >= 60) {
      minActual = 0;
      horaActual = (horaActual + 1) % 24;
    }
  }
  
  return minutosNocturnos / 60;
}

/**
 * Verifica si una fecha es festivo
 */
async function esFestivo(fecha) {
  const festivoEncontrado = await prisma.festivo.findFirst({
    where: {
      fecha: new Date(fecha),
      OR: [
        { ambito: 'Nacional' },
        { ambito: 'Navarra' }
      ]
    }
  });
  
  return !!festivoEncontrado;
}

/**
 * Verifica si una fecha es domingo
 */
function esDomingo(fecha) {
  const dia = new Date(fecha).getDay();
  return dia === 0;
}

/**
 * FUNCIÓN PRINCIPAL: Calcula desglose de horas de una asignación
 */
async function calcularDetalleHoras(asignacion, trabajador, horasSemanalesAcumuladas = 0) {
  const totalHoras = calcularTotalHoras(asignacion.horaInicio, asignacion.horaFin);
  const horasNocturnas = calcularHorasNocturnas(asignacion.horaInicio, asignacion.horaFin);
  const esFestivoODomingo = await esFestivo(asignacion.fecha) || esDomingo(asignacion.fecha);
  
  const horasContrato = parseFloat(trabajador.horasContrato);
  const horasAcumuladas = horasSemanalesAcumuladas + totalHoras;
  
  let horasNormales = 0;
  let horasExtra = 0;
  
  if (horasAcumuladas <= horasContrato) {
    horasNormales = totalHoras;
    horasExtra = 0;
  } else if (horasSemanalesAcumuladas >= horasContrato) {
    horasNormales = 0;
    horasExtra = totalHoras;
  } else {
    horasNormales = horasContrato - horasSemanalesAcumuladas;
    horasExtra = totalHoras - horasNormales;
  }
  
  return {
    totalHoras: parseFloat(totalHoras.toFixed(2)),
    horasNormales: parseFloat(horasNormales.toFixed(2)),
    horasExtra: parseFloat(horasExtra.toFixed(2)),
    horasNocturnas: parseFloat(horasNocturnas.toFixed(2)),
    horasFestivo: esFestivoODomingo ? parseFloat(totalHoras.toFixed(2)) : 0,
    excedioContrato: horasExtra > 0,
    horasAcumuladasSemana: parseFloat(horasAcumuladas.toFixed(2)),
    horasContrato: horasContrato
  };
}

/**
 * Obtiene horas acumuladas de un trabajador en una semana
 */
async function obtenerHorasSemanales(trabajadorId, fecha) {
  const fechaObj = new Date(fecha);
  const diaSemana = fechaObj.getDay();
  const diff = fechaObj.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1);
  const lunes = new Date(fechaObj.setDate(diff));
  lunes.setHours(0, 0, 0, 0);
  
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);
  domingo.setHours(23, 59, 59, 999);
  
  const asignaciones = await prisma.asignacion.findMany({
    where: {
      trabajadorId: trabajadorId,
      fecha: {
        gte: lunes,
        lte: domingo
      }
    }
  });
  
  let totalHoras = 0;
  asignaciones.forEach(asig => {
    const horas = calcularTotalHoras(asig.horaInicio, asig.horaFin);
    totalHoras += horas;
  });
  
  return parseFloat(totalHoras.toFixed(2));
}

/**
 * Recalcula toda la semana de un trabajador
 */
async function recalcularSemanaTrabajador(trabajadorId, fecha) {
  try {
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: trabajadorId },
      select: { id: true, nombre: true, apellidos: true, horasContrato: true }
    });

    if (!trabajador) return;

    const fechaObj = new Date(fecha);
    const diaSemana = fechaObj.getDay();
    const inicioSemana = new Date(fechaObj);
    inicioSemana.setDate(fechaObj.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1));
    
    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 6);

    const asignacionesSemana = await prisma.asignacion.findMany({
      where: {
        trabajadorId,
        fecha: {
          gte: inicioSemana,
          lte: finSemana
        },
        estado: { not: 'CANCELADO' }
      },
      orderBy: [
        { fecha: 'asc' },
        { horaInicio: 'asc' }
      ]
    });

    let horasAcumuladas = 0;

    for (const asignacion of asignacionesSemana) {
      const detalleHoras = await calcularDetalleHoras(asignacion, trabajador, horasAcumuladas);

      const registroExistente = await prisma.registroHoras.findUnique({
        where: { asignacionId: asignacion.id }
      });

      if (registroExistente) {
        await prisma.registroHoras.update({
          where: { id: registroExistente.id },
          data: {
            horasNormales: detalleHoras.horasNormales,
            horasExtra: detalleHoras.horasExtra,
            horasNocturnas: detalleHoras.horasNocturnas,
            horasFestivo: detalleHoras.horasFestivo
          }
        });
      } else {
        await prisma.registroHoras.create({
          data: {
            asignacionId: asignacion.id,
            trabajadorId,
            fecha: asignacion.fecha,
            horasNormales: detalleHoras.horasNormales,
            horasExtra: detalleHoras.horasExtra,
            horasNocturnas: detalleHoras.horasNocturnas,
            horasFestivo: detalleHoras.horasFestivo,
            validado: true
          }
        });
      }

      const motivoActual = asignacion.motivoAtencion || '';
      const tieneAusencia = motivoActual.includes('ausencia') || motivoActual.includes('baja') || motivoActual.includes('vacaciones');

      if (detalleHoras.excedioContrato) {
        await prisma.asignacion.update({
          where: { id: asignacion.id },
          data: {
            requiereAtencion: true,
            motivoAtencion: tieneAusencia 
              ? `${motivoActual} | Supera contrato: ${detalleHoras.horasExtra}h extras`
              : `Supera contrato (${detalleHoras.horasContrato}h/sem). Extras: ${detalleHoras.horasExtra}h`
          }
        });
      } else if (!tieneAusencia && asignacion.requiereAtencion) {
        await prisma.asignacion.update({
          where: { id: asignacion.id },
          data: {
            requiereAtencion: false,
            motivoAtencion: null
          }
        });
      }

      horasAcumuladas += detalleHoras.horasNormales + detalleHoras.horasExtra;
    }

    console.log(`✅ Recalculada semana de ${trabajador.nombre} - ${asignacionesSemana.length} asignaciones`);
  } catch (error) {
    console.error('Error recalculando semana:', error);
  }
}

// 🔥 EXPORTACIÓN ÚNICA - TODAS LAS FUNCIONES
module.exports = {
  calcularTotalHoras,
  calcularHorasNocturnas,
  esFestivo,
  esDomingo,
  calcularDetalleHoras,
  obtenerHorasSemanales,
  recalcularSemanaTrabajador
};