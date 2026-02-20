const prisma = require('../config/prisma');

// ============================================
// Listar centros de trabajo
// ============================================
async function listar(clienteId) {
  const where = { activo: true };
  if (clienteId) where.clienteId = parseInt(clienteId);

  return prisma.centroTrabajo.findMany({
    where,
    include: {
      cliente: true,
      horariosLimpieza: {
        where: { activo: true },
        orderBy: { orden: 'asc' }
      }
    },
    orderBy: { nombre: 'asc' }
  });
}

// ============================================
// Crear centro de trabajo
// ============================================
async function crear(body) {
  const centro = await prisma.centroTrabajo.create({
    data: {
      nombre: body.nombre,
      direccion: body.direccion,
      clienteId: body.clienteId,
      horarioApertura: body.horarioApertura,
      horarioCierre: body.horarioCierre,
      tipoHorarioLimpieza: body.tipoHorarioLimpieza || 'FLEXIBLE'
    }
  });

  // Crear horarios limpieza si es FIJO
  if (body.tipoHorarioLimpieza === 'FIJO' && body.horariosLimpieza?.length > 0) {
    await Promise.all(
      body.horariosLimpieza.map((h, index) =>
        prisma.horarioLimpieza.create({
          data: {
            centroId: centro.id,
            inicio: h.inicio,
            fin: h.fin,
            orden: index + 1
          }
        })
      )
    );
  }

  return centro;
}

// ============================================
// Actualizar centro de trabajo
// ============================================
async function actualizar(id, body) {
  const centroId = parseInt(id);

  const centro = await prisma.centroTrabajo.update({
    where: { id: centroId },
    data: {
      nombre: body.nombre,
      direccion: body.direccion,
      horarioApertura: body.horarioApertura,
      horarioCierre: body.horarioCierre,
      tipoHorarioLimpieza: body.tipoHorarioLimpieza || 'FLEXIBLE',
      tipo_servicio: body.tipoServicio || 'FRECUENTE'
    },
    include: { cliente: true }
  });

  // Actualizar horarios limpieza
  if (body.tipoHorarioLimpieza === 'FIJO' && body.horariosLimpieza?.length > 0) {
    await prisma.horarioLimpieza.updateMany({
      where: { centroId: centroId },
      data: { activo: false }
    });

    await Promise.all(
      body.horariosLimpieza.map((h, index) =>
        prisma.horarioLimpieza.create({
          data: {
            centroId: centroId,
            inicio: h.inicio,
            fin: h.fin,
            orden: index + 1,
            activo: true
          }
        })
      )
    );
  } else if (body.tipoHorarioLimpieza === 'FLEXIBLE') {
    await prisma.horarioLimpieza.updateMany({
      where: { centroId: centroId },
      data: { activo: false }
    });
  }

  return centro;
}

// ============================================
// Dar de baja un centro
// ============================================
async function darDeBaja(id, motivo, usuarioId) {
  id = parseInt(id);

  const anterior = await prisma.centroTrabajo.findUnique({
    where: { id },
    include: { cliente: true }
  });

  if (!anterior) {
    throw { status: 404, error: 'Centro no encontrado' };
  }

  const centro = await prisma.centroTrabajo.update({
    where: { id },
    data: {
      activo: false,
      notas: anterior.notas
        ? `${anterior.notas}\n\n[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
        : `[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
    },
    include: { cliente: true }
  });

  await prisma.historialCambios.create({
    data: {
      tablaAfectada: 'centros_trabajo',
      registroId: id,
      accion: 'BAJA',
      datosAnteriores: anterior,
      datosNuevos: centro,
      motivoCambio: motivo || 'Baja de centro',
      usuarioId
    }
  });

  return { message: 'Centro dado de baja correctamente', centro };
}

// ============================================
// Reactivar centro
// ============================================
async function reactivar(id, usuarioId) {
  id = parseInt(id);

  const centro = await prisma.centroTrabajo.update({
    where: { id },
    data: { activo: true },
    include: { cliente: true }
  });

  await prisma.historialCambios.create({
    data: {
      tablaAfectada: 'centros_trabajo',
      registroId: id,
      accion: 'REACTIVACION',
      datosNuevos: centro,
      motivoCambio: 'Reactivación de centro',
      usuarioId
    }
  });

  return { message: 'Centro reactivado correctamente', centro };
}

// ============================================
// Obtener horarios de limpieza de un centro
// ============================================
async function obtenerHorariosLimpieza(id) {
  return prisma.horarioLimpieza.findMany({
    where: { centroId: parseInt(id), activo: true },
    orderBy: { orden: 'asc' }
  });
}

// ============================================
// Reemplazar horarios de limpieza de un centro
// ============================================
async function actualizarHorariosLimpieza(id, horarios) {
  const centroId = parseInt(id);

  await prisma.horarioLimpieza.updateMany({
    where: { centroId },
    data: { activo: false }
  });

  return Promise.all(
    horarios.map((h, index) =>
      prisma.horarioLimpieza.create({
        data: {
          centroId,
          inicio: h.inicio,
          fin: h.fin,
          orden: index + 1,
          activo: true
        }
      })
    )
  );
}

module.exports = {
  listar,
  crear,
  actualizar,
  darDeBaja,
  reactivar,
  obtenerHorariosLimpieza,
  actualizarHorariosLimpieza
};
