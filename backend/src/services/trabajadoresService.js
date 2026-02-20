const prisma = require('../config/prisma');

// Helper: limpiar datos del body antes de enviar a Prisma
// Convierte strings vacios a null y aplica tipos correctos
function limpiarDatosTrabajador(body) {
  const camposPermitidos = [
    'dni', 'nombre', 'apellidos', 'telefono', 'email', 'direccion', 'codigoPostal',
    'localidad', 'fechaNacimiento', 'fechaAlta', 'categoriaId', 'tipoContrato',
    'horasContrato', 'costeHora', 'diasVacacionesAnuales', 'diasAsuntosPropios',
    'numeroSeguridadSocial', 'cuentaBancaria', 'notas', 'activo',
    'nacionalidad', 'estadoCivil', 'genero', 'provincia', 'pais',
    'emailPersonal', 'telefonoPersonal', 'telefonoEmergencia',
    'tipoIdentificacion', 'identificacionSecundaria', 'tipoIdentificacionSecundaria',
    'compartirCumpleanos'
  ];

  const camposDateTime = ['fechaNacimiento', 'fechaAlta', 'fechaBaja'];
  const camposInt = ['categoriaId', 'diasVacacionesAnuales', 'diasAsuntosPropios'];
  const camposDecimal = ['horasContrato', 'costeHora'];
  const camposBoolean = ['activo', 'compartirCumpleanos'];

  const data = {};
  for (const campo of camposPermitidos) {
    if (body[campo] !== undefined) {
      let valor = body[campo];

      // Convertir strings vacíos a null (Prisma no acepta '' para DateTime, etc.)
      if (valor === '' || valor === null) {
        valor = null;
      } else if (camposDateTime.includes(campo)) {
        valor = new Date(valor);
      } else if (camposInt.includes(campo)) {
        valor = parseInt(valor);
      } else if (camposDecimal.includes(campo)) {
        valor = parseFloat(valor);
      } else if (camposBoolean.includes(campo)) {
        valor = valor === true || valor === 'true';
      }

      data[campo] = valor;
    }
  }
  return data;
}

// ============================================
// Listar trabajadores con filtros
// ============================================
async function listar({ activo, categoria, busqueda }) {
  const where = {};
  if (activo !== undefined) where.activo = activo === 'true';
  if (categoria) where.categoriaId = parseInt(categoria);
  if (busqueda) {
    where.OR = [
      { nombre: { contains: busqueda, mode: 'insensitive' } },
      { apellidos: { contains: busqueda, mode: 'insensitive' } },
      { dni: { contains: busqueda, mode: 'insensitive' } }
    ];
  }

  return prisma.trabajador.findMany({
    where,
    include: {
      categoria: true,
      centrosAsignados: { include: { centro: { include: { cliente: true } } } }
    },
    orderBy: { apellidos: 'asc' }
  });
}

// ============================================
// Obtener trabajadores disponibles para un turno
// ============================================
async function disponibles({ fecha, horaInicio, horaFin, centroId }) {
  if (!fecha || !horaInicio || !horaFin) {
    throw { status: 400, error: 'Faltan parámetros' };
  }

  const todosTrabajadores = await prisma.trabajador.findMany({
    where: { activo: true },
    include: {
      categoria: true,
      centrosAsignados: { include: { centro: { include: { cliente: true } } } }
    }
  });

  const asignacionesDia = await prisma.asignacion.findMany({
    where: {
      fecha: new Date(fecha),
      estado: { notIn: ['CANCELADO'] }
    }
  });

  return todosTrabajadores.filter(trabajador => {
    const asignacionesTrabajador = asignacionesDia.filter(
      a => a.trabajadorId === trabajador.id &&
        (!centroId || a.centroId !== parseInt(centroId))
    );

    const tieneConflicto = asignacionesTrabajador.some(asig => {
      return (
        (asig.horaInicio <= horaInicio && asig.horaFin > horaInicio) ||
        (asig.horaInicio < horaFin && asig.horaFin >= horaFin) ||
        (asig.horaInicio >= horaInicio && asig.horaFin <= horaFin)
      );
    });

    return !tieneConflicto;
  });
}

// ============================================
// Obtener un trabajador por ID con saldos
// ============================================
async function obtenerPorId(id) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: parseInt(id) },
    include: {
      categoria: true,
      centrosAsignados: { include: { centro: { include: { cliente: true } } } },
      ausencias: { include: { tipoAusencia: true }, orderBy: { fechaInicio: 'desc' }, take: 10 }
    }
  });

  if (!trabajador) {
    throw { status: 404, error: 'Trabajador no encontrado' };
  }

  const añoActual = new Date().getFullYear();
  const ausenciasAño = await prisma.ausencia.findMany({
    where: {
      trabajadorId: trabajador.id,
      estado: 'APROBADA',
      fechaInicio: { gte: new Date(`${añoActual}-01-01`) }
    },
    include: { tipoAusencia: true }
  });

  const diasVacacionesUsados = ausenciasAño
    .filter(a => a.tipoAusencia.restaVacaciones)
    .reduce((sum, a) => sum + a.diasTotales, 0);

  const diasAsuntosUsados = ausenciasAño
    .filter(a => a.tipoAusencia.restaAsuntos)
    .reduce((sum, a) => sum + a.diasTotales, 0);

  return {
    ...trabajador,
    saldos: {
      vacaciones: { usados: diasVacacionesUsados, total: trabajador.diasVacacionesAnuales },
      asuntosPropios: { usados: diasAsuntosUsados, total: trabajador.diasAsuntosPropios }
    }
  };
}

// ============================================
// Obtener trabajador completo (con acuerdos)
// ============================================
async function obtenerCompleto(id) {
  const trabajador = await prisma.trabajador.findUnique({
    where: { id: parseInt(id) },
    include: {
      categoria: true,
      acuerdosIndividuales: {
        where: { activo: true },
        include: {
          centro: { select: { id: true, nombre: true } }
        }
      }
    }
  });

  if (!trabajador) {
    throw { status: 404, error: 'Trabajador no encontrado' };
  }

  return trabajador;
}

// ============================================
// Crear trabajador
// ============================================
async function crear(body, usuarioId) {
  const data = limpiarDatosTrabajador(body);

  const trabajador = await prisma.trabajador.create({
    data,
    include: { categoria: true }
  });

  await prisma.historialCambios.create({
    data: {
      tablaAfectada: 'trabajadores',
      registroId: trabajador.id,
      accion: 'INSERT',
      datosNuevos: trabajador,
      usuarioId
    }
  });

  return trabajador;
}

// ============================================
// Actualizar trabajador
// ============================================
async function actualizar(id, body, usuarioId) {
  id = parseInt(id);
  const anterior = await prisma.trabajador.findUnique({ where: { id } });

  const data = limpiarDatosTrabajador(body);

  const trabajador = await prisma.trabajador.update({
    where: { id },
    data,
    include: { categoria: true }
  });

  await prisma.historialCambios.create({
    data: {
      tablaAfectada: 'trabajadores',
      registroId: id,
      accion: 'UPDATE',
      datosAnteriores: anterior,
      datosNuevos: trabajador,
      usuarioId
    }
  });

  return trabajador;
}

// ============================================
// Dar de baja a un trabajador
// ============================================
async function darDeBaja(id, motivo, usuarioId) {
  id = parseInt(id);
  const anterior = await prisma.trabajador.findUnique({ where: { id } });

  if (!anterior) {
    throw { status: 404, error: 'Trabajador no encontrado' };
  }

  const trabajador = await prisma.trabajador.update({
    where: { id },
    data: {
      activo: false,
      fechaBaja: new Date(),
      notas: anterior.notas
        ? `${anterior.notas}\n\n[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
        : `[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
    },
    include: { categoria: true }
  });

  await prisma.historialCambios.create({
    data: {
      tablaAfectada: 'trabajadores',
      registroId: id,
      accion: 'BAJA',
      datosAnteriores: anterior,
      datosNuevos: trabajador,
      motivoCambio: motivo || 'Baja de trabajador',
      usuarioId
    }
  });

  const hoy = new Date();
  const turnosFuturos = await prisma.asignacion.updateMany({
    where: {
      trabajadorId: id,
      fecha: { gte: hoy },
      estado: { not: 'CANCELADO' }
    },
    data: {
      requiereAtencion: true,
      estado: 'CANCELADO'
    }
  });

  return {
    message: `Trabajador dado de baja correctamente. ${turnosFuturos.count} turnos futuros cancelados.`,
    trabajador,
    turnosCancelados: turnosFuturos.count
  };
}

// ============================================
// Reactivar trabajador
// ============================================
async function reactivar(id, usuarioId) {
  id = parseInt(id);

  const trabajador = await prisma.trabajador.update({
    where: { id },
    data: {
      activo: true,
      fechaBaja: null
    },
    include: { categoria: true }
  });

  await prisma.historialCambios.create({
    data: {
      tablaAfectada: 'trabajadores',
      registroId: id,
      accion: 'REACTIVACION',
      datosNuevos: trabajador,
      motivoCambio: 'Reactivación de trabajador',
      usuarioId
    }
  });

  return {
    message: 'Trabajador reactivado correctamente',
    trabajador
  };
}

// ============================================
// Asignar trabajador a centro
// ============================================
async function asignarCentro({ trabajadorId, centroId, esHabitual }) {
  return prisma.trabajadorCentro.create({
    data: {
      trabajadorId: parseInt(trabajadorId),
      centroId: parseInt(centroId),
      esHabitual: esHabitual || false
    }
  });
}

// ============================================
// Eliminar relacion trabajador-centro
// ============================================
async function eliminarCentro(id) {
  await prisma.trabajadorCentro.delete({
    where: { id: parseInt(id) }
  });
  return { message: 'Relación eliminada' };
}

module.exports = {
  listar,
  disponibles,
  obtenerPorId,
  obtenerCompleto,
  crear,
  actualizar,
  darDeBaja,
  reactivar,
  asignarCentro,
  eliminarCentro
};
