const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

// ============================================
// Login
// ============================================
async function login(body) {
  const { email, password } = body;
  const usuario = await prisma.usuario.findUnique({ where: { email } });

  if (!usuario || !usuario.activo) {
    throw { status: 401, error: 'Credenciales inválidas' };
  }

  const passwordValid = await bcrypt.compare(password, usuario.passwordHash);
  if (!passwordValid) {
    throw { status: 401, error: 'Credenciales inválidas' };
  }

  // Actualizar ultimo acceso
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

  return {
    token,
    user: {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      rol: usuario.rol
    }
  };
}

// ============================================
// Me (datos del usuario autenticado)
// ============================================
function me(user) {
  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol
  };
}

module.exports = {
  login,
  me
};
