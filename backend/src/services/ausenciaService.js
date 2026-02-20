const prisma = require('../config/prisma');
const { calcularImporteAusencia } = require('../../utils/calcularImporteAusencia');

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

// ============================================
// Listar ausencias con filtros
// ============================================
async function listar(query) {
  const { estado, trabajadorId, mes, año, archivada } = query;

  const where = {};

  if (estado) {
    where.estado = estado;
  }

  if (trabajadorId) {
    const trabajadorIdNum = parseInt(trabajadorId);
    if (isNaN(trabajadorIdNum)) {
      throw { status: 400, error: 'trabajadorId debe ser un número' };
    }
    where.trabajadorId = trabajadorIdNum;
  }

  if (archivada !== undefined) {
    where.archivada = archivada === 'true';
  }

  if (mes && año) {
    const mesNum = parseInt(mes);
    const añoNum = parseInt(año);

    if (isNaN(mesNum) || isNaN(añoNum) || mesNum < 1 || mesNum > 12) {
      throw { status: 400, error: 'Mes o año inválidos' };
    }

    const inicioMes = new Date(añoNum, mesNum - 1, 1);
    const finMes = new Date(añoNum, mesNum, 0, 23, 59, 59, 999);

    where.OR = [
      { fechaInicio: { gte: inicioMes, lte: finMes } },
      { fechaFin: { gte: inicioMes, lte: finMes } }
    ];
  }

  return prisma.ausencia.findMany({
    where,
    include: {
      trabajador: {
        select: { id: true, nombre: true, apellidos: true }
      },
      tipoAusencia: true,
      aprobadoPor: {
        select: { id: true, nombre: true }
      }
    },
    orderBy: { fechaInicio: 'desc' }
  });
}

// ============================================
// Calcular importe de una ausencia
// ============================================
async function calcularImporte(id) {
  const ausencia = await prisma.ausencia.findUnique({
    where: { id: parseInt(id) },
    include: {
      tipoAusencia: true,
      trabajador: {
        include: {
          categoria: true,
          acuerdosIndividuales: {
            where: { activo: true }
          }
        }
      }
    }
  });

  if (!ausencia) {
    throw { status: 404, error: 'Ausencia no encontrada' };
  }

  const calculo = await calcularImporteAusencia(ausencia.trabajador, ausencia);

  return {
    ausencia: {
      id: ausencia.id,
      trabajador: `${ausencia.trabajador.nombre} ${ausencia.trabajador.apellidos}`,
      tipoAusencia: ausencia.tipoAusencia.nombre,
      fechaInicio: ausencia.fechaInicio,
      fechaFin: ausencia.fechaFin,
      diasTotales: ausencia.diasTotales
    },
    calculo: calculo
  };
}

async function crearAusencia(data) {
  const { trabajadorId, tipoAusenciaId, fechaInicio, fechaFin, motivo } = data;

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  const diasTotales = Math.ceil((fin - inicio) / (1000 * 60 * 60 * 24)) + 1;

  await verificarSolapamiento(trabajadorId, inicio, fin);

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

  const asignacionesAfectadas = await marcarAsignacionesAfectadas(ausencia);
  const centrosAfectados = agruparPorCentro(asignacionesAfectadas);

  return {
    ausencia,
    centrosAfectados,
    totalAsignacionesAfectadas: asignacionesAfectadas.length
  };
}

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

  await verificarSolapamiento(trabajadorId, inicio, fin, id);

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

  const asignacionesAfectadas = await marcarAsignacionesAfectadas(ausencia, true);
  const centrosAfectados = agruparPorCentro(asignacionesAfectadas);

  return {
    ausencia,
    centrosAfectados,
    totalAsignacionesAfectadas: asignacionesAfectadas.length
  };
}

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

// ============================================
// Archivar/desarchivar ausencia
// ============================================
async function archivar(id, archivada) {
  return prisma.ausencia.update({
    where: { id: parseInt(id) },
    data: { archivada: archivada },
    include: {
      trabajador: { select: { id: true, nombre: true, apellidos: true } },
      tipoAusencia: true
    }
  });
}

module.exports = {
  listar,
  calcularImporte,
  crearAusencia,
  actualizarAusencia,
  aprobarAusencia,
  rechazarAusencia,
  archivar,
  verificarSolapamiento,
  marcarAsignacionesAfectadas
};
