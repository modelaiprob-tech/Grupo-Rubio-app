const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Verifica si hay ausencias solapadas para un trabajador
 */
async function verificarSolapamiento(trabajadorId, fechaInicio, fechaFin, ausenciaIdExcluir = null) {
  const where = {
    trabajadorId: parseInt(trabajadorId),
    estado: { in: ['PENDIENTE', 'APROBADA'] },
    OR: [
      {
        fechaInicio: { lte: fechaFin },
        fechaFin: { gte: fechaInicio }
      }
    ]
  };

  if (ausenciaIdExcluir) {
    where.id = { not: ausenciaIdExcluir };
  }

  const ausenciasSolapadas = await prisma.ausencia.findMany({
    where,
    include: { tipoAusencia: true }
  });

  if (ausenciasSolapadas.length > 0) {
    const detalles = ausenciasSolapadas.map(a => 
      `${a.tipoAusencia.nombre} (${new Date(a.fechaInicio).toLocaleDateString('es-ES')} - ${new Date(a.fechaFin).toLocaleDateString('es-ES')})`
    ).join(', ');
    
    throw {
      status: 400,
      error: 'El trabajador ya tiene ausencias en este período',
      ausenciasSolapadas: detalles
    };
  }
}

/**
 * Marca asignaciones afectadas por una ausencia
 */
async function marcarAsignacionesAfectadas(ausencia, urgente = false) {
  const asignacionesAfectadas = await prisma.asignacion.findMany({
    where: {
      trabajadorId: ausencia.trabajadorId,
      fecha: {
        gte: ausencia.fechaInicio,
        lte: ausencia.fechaFin
      },
      estado: { notIn: ['CANCELADO', 'COMPLETADO'] }
    },
    include: {
      centro: {
        include: { cliente: true }
      }
    }
  });

  const mensaje = urgente
    ? `🔴 URGENTE - BAJA APROBADA: ${ausencia.tipoAusencia.nombre} - Requiere suplencia`
    : `⚠️ BAJA PENDIENTE: ${ausencia.tipoAusencia.nombre} hasta ${ausencia.fechaFin.toLocaleDateString('es-ES')}`;

  for (const asig of asignacionesAfectadas) {
    await prisma.asignacion.update({
      where: { id: asig.id },
      data: {
        requiereAtencion: true,
        motivoAtencion: mensaje
      }
    });
  }

  return asignacionesAfectadas;
}

/**
 * Agrupa asignaciones por centro
 */
function agruparPorCentro(asignaciones) {
  const centrosAfectados = asignaciones.reduce((acc, asig) => {
    const key = asig.centroId;
    if (!acc[key]) {
      acc[key] = {
        centroId: asig.centroId,
        centroNombre: asig.centro.nombre,
        clienteNombre: asig.centro.cliente?.nombre || 'Sin cliente',
        dias: []
      };
    }
    acc[key].dias.push(asig.fecha.toLocaleDateString('es-ES'));
    return acc;
  }, {});

  return Object.values(centrosAfectados);
}

/**
 * Crea una nueva ausencia
 */
async function crearAusencia(data) {
  const { trabajadorId, tipoAusenciaId, fechaInicio, fechaFin, motivo } = data;

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

  // Verificar solapamiento
  await verificarSolapamiento(trabajadorId, inicio, fin);

  // Crear ausencia
  const ausencia = await prisma.ausencia.create({
    data: {
      trabajadorId,
      tipoAusenciaId,
      fechaInicio: inicio,
      fechaFin: fin,
      diasTotales,
      motivo,
      estado: 'PENDIENTE'
    },
    include: {
      trabajador: { select: { id: true, nombre: true, apellidos: true } },
      tipoAusencia: true
    }
  });

  // Marcar asignaciones afectadas
  const asignacionesAfectadas = await marcarAsignacionesAfectadas(ausencia);
  const centrosAfectados = agruparPorCentro(asignacionesAfectadas);

  return {
    ausencia,
    centrosAfectados,
    totalAsignacionesAfectadas: asignacionesAfectadas.length
  };
}

/**
 * Actualiza una ausencia existente
 */
async function actualizarAusencia(id, data) {
  const { 
    trabajadorId,
    tipoAusenciaId,
    fechaInicio, 
    fechaFin, 
    motivo,
    observaciones,
    fechaAltaReal,
    numeroParte,
    contingencia,
    entidadEmisora
  } = data;

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

  // Verificar solapamiento (excluyendo esta ausencia)
  await verificarSolapamiento(trabajadorId, inicio, fin, id);

  // Actualizar ausencia
  const ausencia = await prisma.ausencia.update({
    where: { id },
    data: {
      trabajadorId,
      tipoAusenciaId,
      fechaInicio: inicio,
      fechaFin: fin,
      fechaAltaReal: fechaAltaReal ? new Date(fechaAltaReal) : null,
      diasTotales,
      motivo,
      observaciones,
      numeroParte,
      contingencia,
      entidadEmisora
    },
    include: {
      trabajador: { select: { id: true, nombre: true, apellidos: true } },
      tipoAusencia: true
    }
  });

  return ausencia;
}

/**
 * Aprueba una ausencia
 */
async function aprobarAusencia(id, usuarioId) {
  const ausenciaActual = await prisma.ausencia.findUnique({
    where: { id },
    include: { tipoAusencia: true }
  });

  if (!ausenciaActual) {
    throw { status: 404, error: 'Ausencia no encontrada' };
  }

  const ausencia = await prisma.ausencia.update({
    where: { id },
    data: {
      estado: 'APROBADA',
      aprobadoPorId: usuarioId,
      fechaAprobacion: new Date()
    },
    include: {
      trabajador: { select: { id: true, nombre: true, apellidos: true } },
      tipoAusencia: true
    }
  });

  // Marcar asignaciones como URGENTE
  const asignacionesAfectadas = await marcarAsignacionesAfectadas(ausencia, true);
  const centrosAfectados = agruparPorCentro(asignacionesAfectadas);

  return {
    ausencia,
    centrosAfectados,
    totalAsignacionesAfectadas: asignacionesAfectadas.length
  };
}

/**
 * Rechaza una ausencia
 */
async function rechazarAusencia(id, usuarioId, motivo) {
  const ausencia = await prisma.ausencia.update({
    where: { id },
    data: {
      estado: 'RECHAZADA',
      aprobadoPorId: usuarioId,
      fechaAprobacion: new Date(),
      notas: motivo
    }
  });

  return ausencia;
}

module.exports = {
  crearAusencia,
  actualizarAusencia,
  aprobarAusencia,
  rechazarAusencia,
  verificarSolapamiento,
  marcarAsignacionesAfectadas
};