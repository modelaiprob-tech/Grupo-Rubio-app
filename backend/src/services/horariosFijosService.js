const prisma = require('../config/prisma');
const { calcularDetalleHoras, obtenerHorasSemanales, recalcularSemanaTrabajador } = require('../../utils/calcularHoras');

// ============================================
// Obtener horarios fijos de un trabajador
// ============================================
async function obtenerPorTrabajador(trabajadorId) {
  return prisma.horarioFijo.findMany({
    where: {
      trabajadorId: parseInt(trabajadorId),
      activo: true
    },
    include: {
      centro: {
        include: {
          cliente: {
            select: { nombre: true }
          }
        }
      }
    },
    orderBy: [
      { fechaInicio: 'desc' }
    ]
  });
}

// ============================================
// Obtener horarios fijos de un centro
// ============================================
async function obtenerPorCentro(centroId) {
  return prisma.horarioFijo.findMany({
    where: {
      centroId: parseInt(centroId),
      activo: true
    },
    include: {
      trabajador: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          activo: true
        }
      }
    },
    orderBy: [
      { trabajador: { apellidos: 'asc' } }
    ]
  });
}

// ============================================
// Crear un nuevo horario fijo
// ============================================
async function crear(data) {
  const {
    trabajadorId,
    centroId,
    lunes, martes, miercoles, jueves, viernes, sabado, domingo,
    horaInicio,
    horaFin,
    fechaInicio,
    fechaFin,
    notas,
    creadoPorId
  } = data;

  // Validaciones basicas
  if (!trabajadorId || !centroId || !horaInicio || !horaFin) {
    throw { status: 400, error: 'Faltan campos obligatorios: trabajadorId, centroId, horaInicio, horaFin' };
  }

  if (!lunes && !martes && !miercoles && !jueves && !viernes && !sabado && !domingo) {
    throw { status: 400, error: 'Debe seleccionar al menos un día de la semana' };
  }

  // Validar hora fin > hora inicio (permitir paso por medianoche)
  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  const minutosInicio = hI * 60 + mI;
  const minutosFin = hF * 60 + mF;
  const pasaPorMedianoche = minutosFin < minutosInicio;

  if (!pasaPorMedianoche && horaFin <= horaInicio) {
    throw { status: 400, error: 'La hora de fin debe ser posterior a la hora de inicio' };
  }

  // Verificar que el trabajador existe y esta activo
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: parseInt(trabajadorId) }
  });

  if (!trabajador || !trabajador.activo) {
    throw { status: 400, error: 'El trabajador no existe o no está activo' };
  }

  // Verificar que el centro existe y esta activo
  const centro = await prisma.centroTrabajo.findUnique({
    where: { id: parseInt(centroId) }
  });

  if (!centro || !centro.activo) {
    throw { status: 400, error: 'El centro no existe o no está activo' };
  }

  // Validar horario solo si es fijo
  if (centro.tipoHorarioLimpieza === 'FIJO') {
    const horariosLimpieza = await prisma.horarioLimpieza.findMany({
      where: { centroId: parseInt(centroId), activo: true },
      orderBy: { orden: 'asc' }
    });

    if (horariosLimpieza.length === 0) {
      throw { status: 400, error: 'El centro tiene horario fijo pero no tiene horarios configurados' };
    }

    const { validarHorarioEnCentro } = require('../../utils/validarHorarioLimpieza');
    const validacion = validarHorarioEnCentro(
      { ...centro, horariosLimpieza },
      horaInicio,
      horaFin
    );

    if (!validacion.valido) {
      throw { status: 400, error: validacion.error };
    }
  }

  // Verificar solapamientos con otros horarios del mismo trabajador
  const diasSeleccionados = { lunes, martes, miercoles, jueves, viernes, sabado, domingo };
  const diasActivos = Object.keys(diasSeleccionados).filter(dia => diasSeleccionados[dia]);

  const horariosExistentes = await prisma.horarioFijo.findMany({
    where: {
      trabajadorId: parseInt(trabajadorId),
      activo: true,
      OR: diasActivos.map(dia => ({ [dia]: true }))
    }
  });

  for (const horarioExistente of horariosExistentes) {
    const diasComunes = diasActivos.filter(dia => horarioExistente[dia]);

    if (diasComunes.length > 0) {
      const inicioExistente = horarioExistente.horaInicio;
      const finExistente = horarioExistente.horaFin;
      const solapa = (horaInicio < finExistente && horaFin > inicioExistente);

      if (solapa) {
        throw {
          status: 400,
          error: `Este horario solapa con otro existente del trabajador en el centro "${horarioExistente.centro?.nombre || 'sin nombre'}"`,
          diasComunes,
          horarioConflicto: {
            centro: horarioExistente.centroId,
            horario: `${inicioExistente} - ${finExistente}`
          }
        };
      }
    }
  }

  // Crear el horario fijo
  return prisma.horarioFijo.create({
    data: {
      trabajadorId: parseInt(trabajadorId),
      centroId: parseInt(centroId),
      lunes: !!lunes,
      martes: !!martes,
      miercoles: !!miercoles,
      jueves: !!jueves,
      viernes: !!viernes,
      sabado: !!sabado,
      domingo: !!domingo,
      horaInicio,
      horaFin,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : new Date(),
      fechaFin: fechaFin ? new Date(fechaFin) : null,
      notas,
      creadoPorId: creadoPorId ? parseInt(creadoPorId) : null
    },
    include: {
      trabajador: {
        select: { id: true, nombre: true, apellidos: true }
      },
      centro: {
        include: {
          cliente: { select: { nombre: true } }
        }
      }
    }
  });
}

// ============================================
// Actualizar un horario fijo existente
// ============================================
async function actualizar(id, data) {
  const {
    lunes, martes, miercoles, jueves, viernes, sabado, domingo,
    horaInicio,
    horaFin,
    fechaInicio,
    fechaFin,
    notas,
    activo
  } = data;

  if (!lunes && !martes && !miercoles && !jueves && !viernes && !sabado && !domingo) {
    throw { status: 400, error: 'Debe seleccionar al menos un día de la semana' };
  }

  const [hI, mI] = horaInicio.split(':').map(Number);
  const [hF, mF] = horaFin.split(':').map(Number);
  const minutosInicio = hI * 60 + mI;
  const minutosFin = hF * 60 + mF;
  const pasaPorMedianoche = minutosFin < minutosInicio;

  if (!pasaPorMedianoche && horaFin <= horaInicio) {
    throw { status: 400, error: 'La hora de fin debe ser posterior a la hora de inicio' };
  }

  return prisma.horarioFijo.update({
    where: { id: parseInt(id) },
    data: {
      lunes: !!lunes,
      martes: !!martes,
      miercoles: !!miercoles,
      jueves: !!jueves,
      viernes: !!viernes,
      sabado: !!sabado,
      domingo: !!domingo,
      horaInicio,
      horaFin,
      fechaInicio: fechaInicio ? new Date(fechaInicio) : undefined,
      fechaFin: fechaFin ? new Date(fechaFin) : null,
      notas,
      activo: activo !== undefined ? !!activo : undefined
    },
    include: {
      trabajador: {
        select: { id: true, nombre: true, apellidos: true }
      },
      centro: {
        include: {
          cliente: { select: { nombre: true } }
        }
      }
    }
  });
}

// ============================================
// Desactivar horario fijo (baja logica)
// ============================================
async function desactivar(id, eliminarAsignacionesFuturas) {
  const horarioDesactivado = await prisma.horarioFijo.update({
    where: { id: parseInt(id) },
    data: {
      activo: false,
      fechaFin: new Date()
    }
  });

  if (eliminarAsignacionesFuturas) {
    const hoy = new Date();

    const asignacionesAEliminar = await prisma.asignacion.findMany({
      where: {
        origen_horario_fijo_id: parseInt(id),
        fecha: { gte: hoy },
        estado: 'PROGRAMADO'
      },
      select: { id: true }
    });

    const idsAsignaciones = asignacionesAEliminar.map(a => a.id);

    await prisma.registroHoras.deleteMany({
      where: { asignacionId: { in: idsAsignaciones } }
    });

    await prisma.asignacion.deleteMany({
      where: { id: { in: idsAsignaciones } }
    });
  }

  return horarioDesactivado;
}

// ============================================
// Generar asignaciones automaticas desde horarios fijos
// ============================================
async function generarAsignaciones({ fechaInicio, fechaFin, sobrescribir = false, soloActivos = true }) {
  if (!fechaInicio || !fechaFin) {
    throw { status: 400, error: 'Debe especificar fechaInicio y fechaFin' };
  }

  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);

  if (fin < inicio) {
    throw { status: 400, error: 'La fecha de fin debe ser posterior a la fecha de inicio' };
  }

  // Obtener horarios fijos vigentes
  const horariosVigentes = await prisma.horarioFijo.findMany({
    where: {
      activo: true,
      fechaInicio: { lte: fin },
      OR: [
        { fechaFin: null },
        { fechaFin: { gte: inicio } }
      ],
      ...(soloActivos && {
        trabajador: { activo: true }
      })
    },
    include: {
      trabajador: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          activo: true,
          horasContrato: true
        }
      },
      centro: {
        select: {
          id: true,
          nombre: true,
          activo: true
        }
      }
    }
  });

  console.log(`📅 Generando asignaciones desde ${inicio.toLocaleDateString()} hasta ${fin.toLocaleDateString()}`);
  console.log(`📋 Horarios fijos vigentes: ${horariosVigentes.length}`);

  // Generar todas las fechas del rango
  const fechas = [];
  let currentDate = new Date(inicio);
  while (currentDate <= fin) {
    fechas.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`📆 Total de días a procesar: ${fechas.length}`);

  // PASO 1: Si sobrescribir=true, eliminar asignaciones previas generadas por horarios fijos
  if (sobrescribir) {
    console.log('🗑️ Eliminando asignaciones previas generadas por horarios fijos...');

    const asignacionesAEliminar = await prisma.asignacion.findMany({
      where: {
        fecha: { gte: inicio, lte: fin },
        estado: 'PROGRAMADO',
        origen_horario_fijo_id: { not: null }
      },
      select: { id: true }
    });

    const idsEliminar = asignacionesAEliminar.map(a => a.id);

    if (idsEliminar.length > 0) {
      await prisma.registroHoras.deleteMany({
        where: { asignacionId: { in: idsEliminar } }
      });

      await prisma.asignacion.deleteMany({
        where: { id: { in: idsEliminar } }
      });

      console.log(`✅ Eliminadas ${idsEliminar.length} asignaciones antiguas`);
    }
  }

  // PASO 2: Generar nuevas asignaciones
  const asignacionesCreadas = [];
  const asignacionesConflicto = [];
  const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

  for (const fecha of fechas) {
    const diaSemana = diasSemana[fecha.getDay()];

    for (const horario of horariosVigentes) {
      if (!horario[diaSemana]) continue;

      const asignacionExistente = await prisma.asignacion.findFirst({
        where: {
          trabajadorId: horario.trabajadorId,
          centroId: horario.centroId,
          fecha: fecha,
          estado: { not: 'CANCELADO' }
        }
      });

      if (asignacionExistente && asignacionExistente.origen_horario_fijo_id !== horario.id && !sobrescribir) {
        console.log(`⚠️ Respetando asignación manual para ${horario.trabajador.nombre} en ${fecha.toLocaleDateString()}`);
        continue;
      }

      // Verificar ausencias
      const todasAusencias = await prisma.ausencia.findMany({
        where: {
          trabajadorId: horario.trabajadorId,
          estado: 'APROBADA',
          fechaInicio: { lte: fecha }
        },
        include: { tipoAusencia: true }
      });

      const tieneAusencia = todasAusencias.find(a => {
        if (!a.fechaFin) return true;
        return new Date(a.fechaFin) >= fecha;
      });

      const requiereAtencion = !!tieneAusencia;
      const motivoAtencion = tieneAusencia
        ? `Trabajador con ${tieneAusencia.tipoAusencia.nombre.toLowerCase()}`
        : null;

      try {
        const [horaInicioH, horaInicioM] = horario.horaInicio.split(':').map(Number);
        const [horaFinH, horaFinM] = horario.horaFin.split(':').map(Number);
        let horasPlanificadas = ((horaFinH * 60 + horaFinM) - (horaInicioH * 60 + horaInicioM)) / 60;
        if (horasPlanificadas < 0) horasPlanificadas += 24;

        const horasAcumuladas = await obtenerHorasSemanales(horario.trabajadorId, fecha);

        const asignacion = await prisma.asignacion.upsert({
          where: {
            trabajadorId_centroId_fecha_horaInicio: {
              trabajadorId: horario.trabajadorId,
              centroId: horario.centroId,
              fecha: fecha,
              horaInicio: horario.horaInicio
            }
          },
          create: {
            trabajadorId: horario.trabajadorId,
            centroId: horario.centroId,
            fecha: fecha,
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            horasPlanificadas: horasPlanificadas,
            estado: 'PROGRAMADO',
            requiereAtencion,
            motivoAtencion,
            origen_horario_fijo_id: horario.id
          },
          update: {
            horaInicio: horario.horaInicio,
            horaFin: horario.horaFin,
            horasPlanificadas: horasPlanificadas,
            requiereAtencion,
            motivoAtencion,
            origen_horario_fijo_id: horario.id
          }
        });

        const detalleHoras = await calcularDetalleHoras(asignacion, horario.trabajador, horasAcumuladas);

        await prisma.registroHoras.upsert({
          where: { asignacionId: asignacion.id },
          create: {
            asignacionId: asignacion.id,
            trabajadorId: horario.trabajadorId,
            fecha: fecha,
            horasNormales: detalleHoras.horasNormales,
            horasExtra: detalleHoras.horasExtra,
            horasNocturnas: detalleHoras.horasNocturnas,
            horasFestivo: detalleHoras.horasFestivo,
            validado: true
          },
          update: {
            horasNormales: detalleHoras.horasNormales,
            horasExtra: detalleHoras.horasExtra,
            horasNocturnas: detalleHoras.horasNocturnas,
            horasFestivo: detalleHoras.horasFestivo
          }
        });

        if (detalleHoras.excedioContrato && !requiereAtencion) {
          await prisma.asignacion.update({
            where: { id: asignacion.id },
            data: {
              requiereAtencion: true,
              motivoAtencion: `Supera contrato: ${detalleHoras.horasExtra}h extras`
            }
          });
        }

        asignacionesCreadas.push(asignacion);

        if (requiereAtencion || detalleHoras.excedioContrato) {
          asignacionesConflicto.push({
            fecha: fecha,
            trabajador: `${horario.trabajador.nombre} ${horario.trabajador.apellidos}`,
            centro: horario.centro.nombre,
            motivo: motivoAtencion || `Horas extras: ${detalleHoras.horasExtra}h`
          });
        }
      } catch (error) {
        console.error(`Error al crear asignación:`, error);
      }
    }
  }

  console.log(`⚠️  Asignaciones con conflicto: ${asignacionesConflicto.length}`);

  // Recalcular semanas afectadas
  const trabajadoresAfectados = [...new Set(asignacionesCreadas.map(a => a.trabajadorId))];

  for (const trabajadorId of trabajadoresAfectados) {
    const primeraAsignacion = asignacionesCreadas.find(a => a.trabajadorId === trabajadorId);
    if (primeraAsignacion) {
      await recalcularSemanaTrabajador(trabajadorId, primeraAsignacion.fecha);
    }
  }

  return {
    mensaje: `Se procesaron ${asignacionesCreadas.length} asignaciones`,
    total: asignacionesCreadas.length,
    conConflicto: asignacionesConflicto.length,
    conflictos: asignacionesConflicto
  };
}

module.exports = {
  obtenerPorTrabajador,
  obtenerPorCentro,
  crear,
  actualizar,
  desactivar,
  generarAsignaciones
};
