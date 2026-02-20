const prisma = require('../config/prisma');

// ============================================
// Listar todos los acuerdos activos
// ============================================
async function listar() {
  return prisma.acuerdoIndividual.findMany({
    where: { activo: true },
    include: {
      trabajador: {
        select: {
          id: true,
          nombre: true,
          apellidos: true
        }
      },
      centro: {
        select: {
          id: true,
          nombre: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

// ============================================
// Listar acuerdos de un trabajador
// ============================================
async function listarPorTrabajador(trabajadorId) {
  return prisma.acuerdoIndividual.findMany({
    where: {
      trabajadorId: parseInt(trabajadorId),
      activo: true
    },
    include: {
      centro: {
        select: {
          id: true,
          nombre: true
        }
      }
    }
  });
}

// ============================================
// Crear acuerdo individual
// ============================================
async function crear(body) {
  const {
    trabajadorId,
    tipoAcuerdo,
    valor,
    centroId,
    descripcion,
    fechaInicio,
    fechaFin
  } = body;

  return prisma.acuerdoIndividual.create({
    data: {
      trabajadorId,
      tipoAcuerdo,
      valor,
      centroId: centroId || null,
      descripcion,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
      fechaFin: fechaFin ? new Date(fechaFin) : null,
      activo: true
    },
    include: {
      trabajador: {
        select: {
          nombre: true,
          apellidos: true
        }
      },
      centro: {
        select: {
          nombre: true
        }
      }
    }
  });
}

// ============================================
// Actualizar acuerdo individual
// ============================================
async function actualizar(id, body) {
  const {
    tipoAcuerdo,
    valor,
    centroId,
    descripcion,
    fechaInicio,
    fechaFin
  } = body;

  return prisma.acuerdoIndividual.update({
    where: { id: parseInt(id) },
    data: {
      tipoAcuerdo,
      valor,
      centroId: centroId || null,
      descripcion,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : null
    },
    include: {
      trabajador: {
        select: {
          nombre: true,
          apellidos: true
        }
      },
      centro: {
        select: {
          nombre: true
        }
      }
    }
  });
}

// ============================================
// Desactivar acuerdo (baja logica)
// ============================================
async function desactivar(id) {
  return prisma.acuerdoIndividual.update({
    where: { id: parseInt(id) },
    data: { activo: false }
  });
}

module.exports = {
  listar,
  listarPorTrabajador,
  crear,
  actualizar,
  desactivar
};
