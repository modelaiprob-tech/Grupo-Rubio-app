const prisma = require('../config/prisma');
const { calcularTotalHoras, calcularDetalleHoras, obtenerHorasSemanales, recalcularSemanaTrabajador } = require('../../utils/calcularHoras');

// ============================================
// Listar asignaciones con filtros
// ============================================
async function listar({ centroId, trabajadorId, fechaDesde, fechaHasta }) {
  const where = {};
  if (centroId) where.centroId = parseInt(centroId);
  if (trabajadorId) where.trabajadorId = parseInt(trabajadorId);
  if (fechaDesde || fechaHasta) {
    where.fecha = {};
    if (fechaDesde) where.fecha.gte = new Date(fechaDesde);
    if (fechaHasta) where.fecha.lte = new Date(fechaHasta);
  }

  return prisma.asignacion.findMany({
    where,
    include: {
      trabajador: { select: { id: true, nombre: true, apellidos: true } },
      centro: { select: { id: true, nombre: true } }
    },
    orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
  });
}

// ============================================
// Crear asignacion
// ============================================
async function crear(body, usuarioId) {
  const { trabajadorId, centroId, fecha, horaInicio, horaFin } = body;

  // Obtener trabajador
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: trabajadorId },
    select: { id: true, nombre: true, apellidos: true, horasContrato: true }
  });

  if (!trabajador) {
    throw { status: 404, error: 'Trabajador no encontrado' };
  }

  // Verificar conflictos
  const conflicto = await prisma.asignacion.findFirst({
    where: {
      trabajadorId,
      fecha: new Date(fecha),
      OR: [
        { horaInicio: { lte: horaInicio }, horaFin: { gt: horaInicio } },
        { horaInicio: { lt: horaFin }, horaFin: { gte: horaFin } }
      ]
    }
  });

  if (conflicto) {
    throw { status: 400, error: 'Conflicto de horario', conflicto };
  }

  // Verificar ausencias
  const ausencia = await prisma.ausencia.findFirst({
    where: {
      trabajadorId,
      estado: 'APROBADA',
      fechaInicio: { lte: new Date(fecha) },
      fechaFin: { gte: new Date(fecha) }
    }
  });

  if (ausencia) {
    throw { status: 400, error: 'El trabajador tiene una ausencia aprobada' };
  }

  // Calcular horas
  const horasPlanificadas = calcularTotalHoras(horaInicio, horaFin);

  if (horasPlanificadas <= 0 || horasPlanificadas > 24) {
    throw { status: 400, error: 'Horario inválido' };
  }

  // Calcular horas acumuladas ANTES de crear
  const horasAcumuladas = await obtenerHorasSemanales(trabajadorId, fecha);

  // Crear asignacion (campos explicitos, sin mass assignment)
  const asignacion = await prisma.asignacion.create({
    data: {
      trabajadorId,
      centroId,
      fecha: new Date(fecha),
      horaInicio,
      horaFin,
      horasPlanificadas,
      tipoServicio: body.tipoServicio,
      notas: body.notas,
      estado: 'PROGRAMADO',
      creadoPorId: usuarioId
    },
    include: {
      trabajador: { select: { id: true, nombre: true, apellidos: true } },
      centro: { select: { id: true, nombre: true } }
    }
  });

  // Calcular desglose
  const detalleHoras = await calcularDetalleHoras(asignacion, trabajador, horasAcumuladas);

  // Crear registro
  await prisma.registroHoras.create({
    data: {
      asignacionId: asignacion.id,
      trabajadorId,
      fecha: new Date(fecha),
      horasNormales: detalleHoras.horasNormales,
      horasExtra: detalleHoras.horasExtra,
      horasNocturnas: detalleHoras.horasNocturnas,
      horasFestivo: detalleHoras.horasFestivo,
      validado: true
    }
  });

  // Alertas
  const alertas = [];
  if (detalleHoras.excedioContrato) {
    alertas.push({
      tipo: 'HORAS_EXTRA',
      mensaje: `⚠️ Supera contrato (${detalleHoras.horasContrato}h/sem). Acumuladas: ${detalleHoras.horasAcumuladasSemana}h. Extras: ${detalleHoras.horasExtra}h`
    });
  }
  if (detalleHoras.horasNocturnas > 0) {
    alertas.push({
      tipo: 'NOCTURNAS',
      mensaje: `🌙 Incluye ${detalleHoras.horasNocturnas}h nocturnas (22:00-06:00)`
    });
  }
  if (detalleHoras.horasFestivo > 0) {
    alertas.push({
      tipo: 'FESTIVO',
      mensaje: `📅 Festivo/Domingo (${detalleHoras.horasFestivo}h)`
    });
  }

  // Recalcular toda la semana
  await recalcularSemanaTrabajador(trabajadorId, fecha);

  return { asignacion, alertas, detalleHoras };
}

// ============================================
// Eliminar asignacion
// ============================================
async function eliminar(id) {
  await prisma.asignacion.delete({ where: { id: parseInt(id) } });
  return { message: 'Asignación eliminada' };
}

// ============================================
// Copiar semana de asignaciones
// ============================================
async function copiarSemana(body, usuarioId) {
  const { fechaOrigenInicio, fechaOrigenFin, fechaDestinoInicio } = body;

  const asignacionesOrigen = await prisma.asignacion.findMany({
    where: {
      fecha: {
        gte: new Date(fechaOrigenInicio),
        lte: new Date(fechaOrigenFin)
      },
      estado: { not: 'CANCELADO' }
    }
  });

  if (asignacionesOrigen.length === 0) {
    throw { status: 404, error: 'No hay asignaciones en la semana origen' };
  }

  const origenDate = new Date(fechaOrigenInicio);
  const destinoDate = new Date(fechaDestinoInicio);
  const diffDias = Math.floor((destinoDate - origenDate) / (1000 * 60 * 60 * 24));

  const nuevasAsignaciones = [];
  for (const asig of asignacionesOrigen) {
    const nuevaFecha = new Date(asig.fecha);
    nuevaFecha.setDate(nuevaFecha.getDate() + diffDias);

    const nueva = await prisma.asignacion.create({
      data: {
        trabajadorId: asig.trabajadorId,
        centroId: asig.centroId,
        fecha: nuevaFecha,
        horaInicio: asig.horaInicio,
        horaFin: asig.horaFin,
        horasPlanificadas: asig.horasPlanificadas,
        tipoServicio: asig.tipoServicio,
        estado: 'PROGRAMADO',
        creadoPorId: usuarioId
      }
    });
    nuevasAsignaciones.push(nueva);
  }

  return {
    mensaje: `${nuevasAsignaciones.length} asignaciones copiadas`,
    asignaciones: nuevasAsignaciones
  };
}

module.exports = {
  listar,
  crear,
  eliminar,
  copiarSemana
};
