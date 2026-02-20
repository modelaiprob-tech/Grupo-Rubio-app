const prisma = require('../config/prisma');

// ============================================
// Listar clientes activos
// ============================================
async function listar() {
  return prisma.cliente.findMany({
    where: { activo: true },
    include: {
      centrosTrabajo: {
        include: {
          trabajadoresAsignados: true,
          horariosLimpieza: {
            where: { activo: true },
            orderBy: { orden: 'asc' }
          }
        }
      }
    },
    orderBy: { nombre: 'asc' }
  });
}

// ============================================
// Crear cliente
// ============================================
async function crear(body) {
  const {
    nombre, cif, direccion, codigoPostal, localidad, provincia,
    telefono, email, contactoNombre, contactoTelefono, contactoEmail,
    tipoCliente, notas, activo
  } = body;

  return prisma.cliente.create({
    data: {
      nombre, cif, direccion, codigoPostal, localidad, provincia,
      telefono, email, contactoNombre, contactoTelefono, contactoEmail,
      tipoCliente, notas, activo
    }
  });
}

// ============================================
// Dar de baja cliente y sus centros
// ============================================
async function darBaja(id, motivo, usuarioId) {
  const anterior = await prisma.cliente.findUnique({ where: { id } });

  if (!anterior) {
    throw { status: 404, error: 'Cliente no encontrado' };
  }

  const cliente = await prisma.cliente.update({
    where: { id },
    data: {
      activo: false,
      notas: anterior.notas
        ? `${anterior.notas}\n\n[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
        : `[BAJA ${new Date().toLocaleDateString()}]: ${motivo || 'Sin motivo especificado'}`
    }
  });

  // Dar de baja tambien todos sus centros
  await prisma.centroTrabajo.updateMany({
    where: { clienteId: id },
    data: { activo: false }
  });

  await prisma.historialCambios.create({
    data: {
      tablaAfectada: 'clientes',
      registroId: id,
      accion: 'BAJA',
      datosAnteriores: anterior,
      datosNuevos: cliente,
      motivoCambio: motivo || 'Baja de cliente',
      usuarioId: usuarioId
    }
  });

  return {
    message: 'Cliente y sus centros dados de baja correctamente',
    cliente
  };
}

// ============================================
// Reactivar cliente
// ============================================
async function reactivar(id, usuarioId) {
  const cliente = await prisma.cliente.update({
    where: { id },
    data: { activo: true }
  });

  await prisma.historialCambios.create({
    data: {
      tablaAfectada: 'clientes',
      registroId: id,
      accion: 'REACTIVACION',
      datosNuevos: cliente,
      motivoCambio: 'Reactivación de cliente',
      usuarioId: usuarioId
    }
  });

  return {
    message: 'Cliente reactivado correctamente. Revisa sus centros manualmente.',
    cliente
  };
}

module.exports = {
  listar,
  crear,
  darBaja,
  reactivar
};
