// ============================================
// RUTAS: CLIENTES
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { validate } = require('../middlewares/validation');
const { crearClienteSchema } = require('../validators/clienteValidators');
const { asyncHandler } = require('../middlewares/errorHandler');

// GET /api/clientes
router.get('/', asyncHandler(async (req, res) => {
    const clientes = await prisma.cliente.findMany({
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
    res.json(clientes);
}));

// POST /api/clientes
router.post('/', validate(crearClienteSchema), asyncHandler(async (req, res) => {
    const { nombre, cif, direccion, codigoPostal, localidad, provincia,
      telefono, email, contactoNombre, contactoTelefono, contactoEmail,
      tipoCliente, notas, activo } = req.body;

    const cliente = await prisma.cliente.create({
      data: {
        nombre, cif, direccion, codigoPostal, localidad, provincia,
        telefono, email, contactoNombre, contactoTelefono, contactoEmail,
        tipoCliente, notas, activo
      }
    });
    res.status(201).json(cliente);
}));

// PUT /api/clientes/:id/dar-baja
router.put('/:id/dar-baja', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);
    const { motivo } = req.body;

    const anterior = await prisma.cliente.findUnique({ where: { id } });

    if (!anterior) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
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

    // Dar de baja también todos sus centros
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
        usuarioId: req.user.id
      }
    });

    res.json({
      message: 'Cliente y sus centros dados de baja correctamente',
      cliente
    });
}));

// PUT /api/clientes/:id/reactivar
router.put('/:id/reactivar', asyncHandler(async (req, res) => {
    const id = parseInt(req.params.id);

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
        usuarioId: req.user.id
      }
    });

    res.json({
      message: 'Cliente reactivado correctamente. Revisa sus centros manualmente.',
      cliente
    });
}));

module.exports = router;
