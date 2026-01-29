// ============================================
// BACKEND: routes/horariosFijos.js
// ============================================
// Guardar en: backend/routes/horariosFijos.js

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calcularDetalleHoras, obtenerHorasSemanales } = require('../../utils/calcularHoras');

// ============================================
// GET /api/horarios-fijos/trabajador/:trabajadorId
// Obtener todos los horarios fijos de un trabajador
// ============================================
router.get('/trabajador/:trabajadorId', async (req, res) => {
  try {
    const { trabajadorId } = req.params;
    
    const horarios = await prisma.horarioFijo.findMany({
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
    
    res.json(horarios);
  } catch (error) {
    console.error('Error al obtener horarios fijos:', error);
    res.status(500).json({ error: 'Error al obtener horarios fijos' });
  }
});

// ============================================
// GET /api/horarios-fijos/centro/:centroId
// Obtener todos los horarios fijos de un centro
// ============================================
router.get('/centro/:centroId', async (req, res) => {
  try {
    const { centroId } = req.params;
    
    const horarios = await prisma.horarioFijo.findMany({
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
    
    res.json(horarios);
  } catch (error) {
    console.error('Error al obtener horarios del centro:', error);
    res.status(500).json({ error: 'Error al obtener horarios del centro' });
  }
});

// ============================================
// POST /api/horarios-fijos
// Crear un nuevo horario fijo
// ============================================
router.post('/', async (req, res) => {
  try {
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
    } = req.body;

    // Validaciones básicas
    if (!trabajadorId || !centroId || !horaInicio || !horaFin) {
      return res.status(400).json({ 
        error: 'Faltan campos obligatorios: trabajadorId, centroId, horaInicio, horaFin' 
      });
    }

    // Validar que al menos un día esté seleccionado
    if (!lunes && !martes && !miercoles && !jueves && !viernes && !sabado && !domingo) {
      return res.status(400).json({ 
        error: 'Debe seleccionar al menos un día de la semana' 
      });
    }

    // Validar hora fin > hora inicio (permitir paso por medianoche)
const [hI, mI] = horaInicio.split(':').map(Number);
const [hF, mF] = horaFin.split(':').map(Number);
const minutosInicio = hI * 60 + mI;
const minutosFin = hF * 60 + mF;

const pasaPorMedianoche = minutosFin < minutosInicio;

// Solo validar si NO pasa por medianoche y la hora fin es menor o igual
if (!pasaPorMedianoche && horaFin <= horaInicio) {
  return res.status(400).json({ 
    error: 'La hora de fin debe ser posterior a la hora de inicio' 
  });
}

    // Verificar que el trabajador existe y está activo
    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(trabajadorId) }
    });

    if (!trabajador || !trabajador.activo) {
      return res.status(400).json({ 
        error: 'El trabajador no existe o no está activo' 
      });
    }

    // Verificar que el centro existe y está activo
    const centro = await prisma.centroTrabajo.findUnique({
      where: { id: parseInt(centroId) }
    });

    if (!centro || !centro.activo) {
  return res.status(400).json({ 
    error: 'El centro no existe o no está activo' 
  });
}

// ✅ VALIDAR HORARIO SOLO SI ES FIJO
if (centro.tipoHorarioLimpieza === 'FIJO') {
  // Obtener horarios de limpieza
  const horariosLimpieza = await prisma.horarioLimpieza.findMany({
    where: { centroId: parseInt(centroId), activo: true },
    orderBy: { orden: 'asc' }
  });

  if (horariosLimpieza.length === 0) {
    return res.status(400).json({ 
      error: 'El centro tiene horario fijo pero no tiene horarios configurados' 
    });
  }

  // Validar que el horario esté dentro de algún rango permitido
  const { validarHorarioEnCentro } = require('../utils/validarHorarioLimpieza');
  const validacion = validarHorarioEnCentro(
    { ...centro, horariosLimpieza }, 
    horaInicio, 
    horaFin
  );

  if (!validacion.valido) {
    return res.status(400).json({ error: validacion.error });
  }
}
// Si es FLEXIBLE, no validar nada

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

    // Verificar solapamiento de horarios en los mismos días
    for (const horarioExistente of horariosExistentes) {
      const diasComunes = diasActivos.filter(dia => horarioExistente[dia]);
      
      if (diasComunes.length > 0) {
        // Hay días en común, verificar solapamiento horario
        const inicioExistente = horarioExistente.horaInicio;
        const finExistente = horarioExistente.horaFin;
        
        // Verificar si los horarios se solapan
        const solapa = (horaInicio < finExistente && horaFin > inicioExistente);
        
        if (solapa) {
          return res.status(400).json({ 
            error: `Este horario solapa con otro existente del trabajador en el centro "${horarioExistente.centro?.nombre || 'sin nombre'}"`,
            diasComunes,
            horarioConflicto: {
              centro: horarioExistente.centroId,
              horario: `${inicioExistente} - ${finExistente}`
            }
          });
        }
      }
    }

    // Crear el horario fijo
    const horarioFijo = await prisma.horarioFijo.create({
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
          select: {
            id: true,
            nombre: true,
            apellidos: true
          }
        },
        centro: {
          include: {
            cliente: {
              select: { nombre: true }
            }
          }
        }
      }
    });

    res.status(201).json(horarioFijo);
  } catch (error) {
    console.error('Error al crear horario fijo:', error);
    res.status(500).json({ error: 'Error al crear horario fijo' });
  }
});

// ============================================
// PUT /api/horarios-fijos/:id
// Actualizar un horario fijo existente
// ============================================
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      lunes, martes, miercoles, jueves, viernes, sabado, domingo,
      horaInicio, 
      horaFin, 
      fechaInicio, 
      fechaFin,
      notas,
      activo
    } = req.body;

    // Validar que al menos un día esté seleccionado
    if (!lunes && !martes && !miercoles && !jueves && !viernes && !sabado && !domingo) {
      return res.status(400).json({ 
        error: 'Debe seleccionar al menos un día de la semana' 
      });
    }

    // Validar hora fin > hora inicio (permitir paso por medianoche)
const [hI, mI] = horaInicio.split(':').map(Number);
const [hF, mF] = horaFin.split(':').map(Number);
const minutosInicio = hI * 60 + mI;
const minutosFin = hF * 60 + mF;

const pasaPorMedianoche = minutosFin < minutosInicio;

if (!pasaPorMedianoche && horaFin <= horaInicio) {
  return res.status(400).json({ 
    error: 'La hora de fin debe ser posterior a la hora de inicio' 
  });
}

    const horarioActualizado = await prisma.horarioFijo.update({
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
          select: {
            id: true,
            nombre: true,
            apellidos: true
          }
        },
        centro: {
          include: {
            cliente: {
              select: { nombre: true }
            }
          }
        }
      }
    });

    res.json(horarioActualizado);
  } catch (error) {
    console.error('Error al actualizar horario fijo:', error);
    res.status(500).json({ error: 'Error al actualizar horario fijo' });
  }
});

// DELETE /api/horarios-fijos/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { eliminarAsignacionesFuturas } = req.body; // ← AÑADIR

    // Baja lógica del horario
    const horarioDesactivado = await prisma.horarioFijo.update({
      where: { id: parseInt(id) },
      data: {
        activo: false,
        fechaFin: new Date()
      }
    });

    // ✅ OPCIONAL: Eliminar asignaciones futuras
if (eliminarAsignacionesFuturas) {
  const hoy = new Date();
  
  // Obtener IDs de asignaciones a eliminar
  const asignacionesAEliminar = await prisma.asignacion.findMany({
    where: {
      origen_horario_fijo_id: parseInt(id),
      fecha: { gte: hoy },
      estado: 'PROGRAMADO'
    },
    select: { id: true }
  });
  
  const idsAsignaciones = asignacionesAEliminar.map(a => a.id);
  
  // Eliminar registros de horas asociados
  await prisma.registroHoras.deleteMany({
    where: {
      asignacionId: { in: idsAsignaciones }
    }
  });
  
  // Eliminar asignaciones
  await prisma.asignacion.deleteMany({
    where: {
      id: { in: idsAsignaciones }
    }
  });
}

    res.json({ 
      mensaje: 'Horario fijo desactivado correctamente',
      horario: horarioDesactivado 
    });
  } catch (error) {
    console.error('Error al desactivar horario fijo:', error);
    res.status(500).json({ error: 'Error al desactivar horario fijo' });
  }
});

// ============================================
// POST /api/horarios-fijos/generar-asignaciones
// Generar asignaciones automáticas desde horarios fijos
// ============================================
router.post('/generar-asignaciones', async (req, res) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      sobrescribir = false, 
      soloActivos = true 
    } = req.body;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        error: 'Debe especificar fechaInicio y fechaFin' 
      });
    }

    const inicio = new Date(fechaInicio);
    const fin = new Date(fechaFin);

    if (fin < inicio) {
      return res.status(400).json({ 
        error: 'La fecha de fin debe ser posterior a la fecha de inicio' 
      });
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

    // ✅ PASO 1: Si sobrescribir=true, eliminar asignaciones previas generadas por horarios fijos
if (sobrescribir) {
  console.log('🗑️ Eliminando asignaciones previas generadas por horarios fijos...');
  
  // Obtener asignaciones a eliminar
  const asignacionesAEliminar = await prisma.asignacion.findMany({
    where: {
      fecha: { gte: inicio, lte: fin },
      estado: 'PROGRAMADO',
      origen_horario_fijo_id: { not: null } // Solo las generadas automáticamente
    },
    select: { id: true }
  });

  const idsEliminar = asignacionesAEliminar.map(a => a.id);

  if (idsEliminar.length > 0) {
    // Eliminar registros de horas asociados
    await prisma.registroHoras.deleteMany({
      where: { asignacionId: { in: idsEliminar } }
    });

    // Eliminar asignaciones
    await prisma.asignacion.deleteMany({
      where: { id: { in: idsEliminar } }
    });

    console.log(`✅ Eliminadas ${idsEliminar.length} asignaciones antiguas`);
  }
}

// ✅ PASO 2: Generar nuevas asignaciones
const asignacionesCreadas = [];
const asignacionesConflicto = [];
const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];

// Procesar cada fecha
for (const fecha of fechas) {
  const diaSemana = diasSemana[fecha.getDay()];

  // Procesar cada horario fijo
  for (const horario of horariosVigentes) {
    // Verificar si el horario aplica para este día
    if (!horario[diaSemana]) continue;

    // Verificar si ya existe una asignación (manual o de otro origen)
    const asignacionExistente = await prisma.asignacion.findFirst({
      where: {
        trabajadorId: horario.trabajadorId,
        centroId: horario.centroId,
        fecha: fecha,
        estado: { not: 'CANCELADO' }
      }
    });

    // Si existe y NO es del mismo horario fijo, respetarla (es manual)
    if (asignacionExistente && asignacionExistente.origen_horario_fijo_id !== horario.id && !sobrescribir) {
      console.log(`⚠️ Respetando asignación manual para ${horario.trabajador.nombre} en ${fecha.toLocaleDateString()}`);
      continue;
    }

    // Verificar ausencias (con filtro en JS para fechaFin null)
const todasAusencias = await prisma.ausencia.findMany({
  where: {
    trabajadorId: horario.trabajadorId,
    estado: 'APROBADA',
    fechaInicio: { lte: fecha }
  },
  include: { tipoAusencia: true }
});

const tieneAusencia = todasAusencias.find(a => {
  if (!a.fechaFin) return true; // Sin fecha fin = activa
  return new Date(a.fechaFin) >= fecha;
});

    const requiereAtencion = !!tieneAusencia;
    const motivoAtencion = tieneAusencia
      ? `Trabajador con ${tieneAusencia.tipoAusencia.nombre.toLowerCase()}`
      : null;

    try {
      // Calcular horas
      const [horaInicioH, horaInicioM] = horario.horaInicio.split(':').map(Number);
      const [horaFinH, horaFinM] = horario.horaFin.split(':').map(Number);
      let horasPlanificadas = ((horaFinH * 60 + horaFinM) - (horaInicioH * 60 + horaInicioM)) / 60;
      if (horasPlanificadas < 0) horasPlanificadas += 24;

      const horasAcumuladas = await obtenerHorasSemanales(horario.trabajadorId, fecha);

      // Crear o actualizar asignación
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

      // Calcular desglose
      const detalleHoras = await calcularDetalleHoras(asignacion, horario.trabajador, horasAcumuladas);

      // Crear/actualizar registro de horas
      await prisma.registroHoras.upsert({
        where: {
          asignacionId: asignacion.id
        },
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

      // Actualizar si hay extras
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

// 🔥 RECALCULAR TODAS LAS SEMANAS AFECTADAS
const { recalcularSemanaTrabajador } = require('../../utils/calcularHoras');
const trabajadoresAfectados = [...new Set(asignacionesCreadas.map(a => a.trabajadorId))];

for (const trabajadorId of trabajadoresAfectados) {
  const primeraAsignacion = asignacionesCreadas.find(a => a.trabajadorId === trabajadorId);
  if (primeraAsignacion) {
    await recalcularSemanaTrabajador(trabajadorId, primeraAsignacion.fecha);
  }
}

    res.json({
      mensaje: `Se procesaron ${asignacionesCreadas.length} asignaciones`,
      total: asignacionesCreadas.length,
      conConflicto: asignacionesConflicto.length,
      conflictos: asignacionesConflicto
    });
  } catch (error) {
    console.error('Error al generar asignaciones:', error);
    res.status(500).json({ error: 'Error al generar asignaciones automáticas' });
  }
});

module.exports = router;
