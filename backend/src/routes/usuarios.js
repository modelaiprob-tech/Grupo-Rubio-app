// ============================================
// RUTAS: GESTIÓN DE USUARIOS (Solo Admin)
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const { validate } = require('../middlewares/validation');
const { crearUsuarioSchema, actualizarUsuarioSchema } = require('../validators/usuarioValidators');
const { adminOnly } = require('../middlewares/adminOnly');
const { asyncHandler } = require('../middlewares/errorHandler');

// GET /api/usuarios - Listar todos los usuarios
router.get('/', adminOnly, asyncHandler(async (req, res) => {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        ultimoAcceso: true,
        createdAt: true
      },
      orderBy: { nombre: 'asc' }
    });
    res.json(usuarios);
}));

// POST /api/usuarios - Crear usuario
router.post('/', adminOnly, validate(crearUsuarioSchema), asyncHandler(async (req, res) => {
    const { email, password, nombre, rol } = req.body;

    const existe = await prisma.usuario.findUnique({ where: { email } });
    if (existe) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const usuario = await prisma.usuario.create({
      data: {
        email,
        passwordHash,
        nombre,
        rol,
        activo: true
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        createdAt: true
      }
    });

    res.status(201).json(usuario);
}));

// PUT /api/usuarios/:id - Actualizar usuario
router.put('/:id', adminOnly, validate(actualizarUsuarioSchema), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { email, nombre, rol, activo, password } = req.body;

    const data = { email, nombre, rol, activo };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data,
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true,
        updatedAt: true
      }
    });

    res.json(usuario);
}));

// PUT /api/usuarios/:id/toggle-activo
router.put('/:id/toggle-activo', adminOnly, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const usuarioActual = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: { activo: !usuarioActual.activo },
      select: {
        id: true,
        email: true,
        nombre: true,
        rol: true,
        activo: true
      }
    });

    res.json(usuario);
}));

module.exports = router;
