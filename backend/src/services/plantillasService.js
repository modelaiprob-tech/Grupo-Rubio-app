const prisma = require('../config/prisma');

// ============================================
// Listar plantillas
// ============================================
async function listar() {
  return prisma.plantillas_turnos.findMany({
    include: {
      centros_trabajo: true,
      plantillas_turnos_detalle: {
        include: { trabajadores: true }
      }
    },
    orderBy: { created_at: 'desc' }
  });
}

// ============================================
// Crear plantilla desde una semana existente
// ============================================
async function crearDesdeSemana(body, usuarioId) {
  const { nombre, descripcion, centroId, fechaInicio, fechaFin } = body;

  const asignaciones = await prisma.asignacion.findMany({
    where: {
      centroId: centroId,
      fecha: {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      },
      estado: { not: 'CANCELADO' }
    }
  });

  if (asignaciones.length === 0) {
    throw { status: 400, error: 'No hay turnos en esa semana' };
  }

  const plantilla = await prisma.plantillas_turnos.create({
    data: {
      nombre,
      descripcion,
      centro_id: centroId,
      creado_por_id: usuarioId
    }
  });

  for (const asig of asignaciones) {
    const diaSemana = new Date(asig.fecha).getDay() || 7;

    await prisma.plantillas_turnos_detalle.create({
      data: {
        plantilla_id: plantilla.id,
        trabajador_id: asig.trabajadorId,
        dia_semana: diaSemana,
        hora_inicio: asig.horaInicio,
        hora_fin: asig.horaFin
      }
    });
  }

  return { mensaje: 'Plantilla creada', plantilla };
}

// ============================================
// Aplicar plantilla a una semana
// ============================================
async function aplicar(id, body, usuarioId) {
  const { fechaInicio } = body;

  const plantilla = await prisma.plantillas_turnos.findUnique({
    where: { id: parseInt(id) },
    include: { plantillas_turnos_detalle: true }
  });

  if (!plantilla) {
    throw { status: 404, error: 'Plantilla no encontrada' };
  }

  const nuevasAsignaciones = [];
  const fechaBase = new Date(fechaInicio);

  // Calcular inicio de semana (lunes)
  const diaSemana = fechaBase.getDay();
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  const lunes = new Date(fechaBase);
  lunes.setDate(fechaBase.getDate() + diff);

  for (const detalle of plantilla.plantillas_turnos_detalle) {
    const fecha = new Date(lunes);
    fecha.setDate(lunes.getDate() + (detalle.dia_semana - 1));

    const [hI, mI] = detalle.hora_inicio.split(':').map(Number);
    const [hF, mF] = detalle.hora_fin.split(':').map(Number);
    const horas = (hF * 60 + mF - hI * 60 - mI) / 60;

    const nueva = await prisma.asignacion.create({
      data: {
        trabajadorId: detalle.trabajador_id,
        centroId: plantilla.centro_id,
        fecha: fecha,
        horaInicio: detalle.hora_inicio,
        horaFin: detalle.hora_fin,
        horasPlanificadas: horas,
        estado: 'PROGRAMADO',
        creadoPorId: usuarioId
      }
    });
    nuevasAsignaciones.push(nueva);
  }

  return {
    mensaje: `${nuevasAsignaciones.length} turnos creados desde plantilla`,
    asignaciones: nuevasAsignaciones
  };
}

// ============================================
// Eliminar plantilla y sus detalles
// ============================================
async function eliminar(id) {
  await prisma.plantillas_turnos_detalle.deleteMany({
    where: { plantilla_id: parseInt(id) }
  });

  await prisma.plantillas_turnos.delete({
    where: { id: parseInt(id) }
  });

  return { mensaje: 'Plantilla eliminada' };
}

module.exports = {
  listar,
  crearDesdeSemana,
  aplicar,
  eliminar
};
