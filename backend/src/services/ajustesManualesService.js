const prisma = require('../config/prisma');

// ============================================
// Crear o actualizar ajuste manual
// ============================================
async function crearOActualizar(body) {
  const {
    trabajadorId,
    centroId,
    fecha,
    horaInicio,
    horaFin,
    notas,
    usuarioId
  } = body;

  // Calcular horas planificadas
  const [hi, mi] = horaInicio.split(':').map(Number);
  const [hf, mf] = horaFin.split(':').map(Number);
  const horasPlanificadas = ((hf * 60 + mf) - (hi * 60 + mi)) / 60;

  const existente = await prisma.asignacion.findFirst({
    where: {
      trabajadorId: parseInt(trabajadorId),
      centroId: parseInt(centroId),
      fecha: new Date(fecha + 'T00:00:00Z'),
      horaInicio: horaInicio
    }
  });

  if (existente) {
    // ACTUALIZAR
    const updated = await prisma.asignacion.update({
      where: { id: existente.id },
      data: {
        horaInicio,
        horaFin,
        horasPlanificadas,
        origen: 'MANUAL',
        editadoPorId: parseInt(usuarioId),
        fechaEdicion: new Date(),
        notas: notas || existente.notas
      },
      include: {
        trabajador: true,
        centro: true
      }
    });

    return { success: true, message: 'Ajuste actualizado', asignacion: updated };
  } else {
    // CREAR NUEVA
    const nueva = await prisma.asignacion.create({
      data: {
        trabajadorId: parseInt(trabajadorId),
        centroId: parseInt(centroId),
        fecha: new Date(fecha + 'T00:00:00Z'),
        horaInicio,
        horaFin,
        horasPlanificadas,
        origen: 'MANUAL',
        creadoPorId: parseInt(usuarioId),
        editadoPorId: parseInt(usuarioId),
        fechaEdicion: new Date(),
        estado: 'COMPLETADO',
        notas
      },
      include: {
        trabajador: true,
        centro: true
      }
    });

    return { success: true, message: 'Ajuste creado', asignacion: nueva };
  }
}

module.exports = {
  crearOActualizar
};
