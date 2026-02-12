// ============================================
// RUTAS: AUTENTICACIÓN
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { authMiddleware } = require('../middlewares/auth');
const { loginLimiter } = require('../middlewares/rateLimiter');
const { validate } = require('../middlewares/validation');
const { loginSchema } = require('../validators/authValidators');
const { JWT_SECRET } = require('../config/env');
const { asyncHandler } = require('../middlewares/errorHandler');

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { email } });

    if (!usuario || !usuario.activo) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const passwordValid = await bcrypt.compare(password, usuario.passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Actualizar último acceso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcceso: new Date() }
    });

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre,
        rol: usuario.rol
      }
    });
}));

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    nombre: req.user.nombre,
    rol: req.user.rol
  });
});

module.exports = router;
