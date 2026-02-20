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
      rol: usuario.rol,
      debeCambiarPassword: usuario.debeCambiarPassword
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
    rol: user.rol,
    debeCambiarPassword: user.debeCambiarPassword
  };
}

// ============================================
// Cambiar contraseña
// ============================================
async function cambiarPassword(userId, body) {
  const { passwordActual, passwordNueva } = body;

  const usuario = await prisma.usuario.findUnique({ where: { id: userId } });
  if (!usuario) {
    throw { status: 404, error: 'Usuario no encontrado' };
  }

  const passwordValid = await bcrypt.compare(passwordActual, usuario.passwordHash);
  if (!passwordValid) {
    throw { status: 401, error: 'La contraseña actual es incorrecta' };
  }

  if (passwordNueva.length < 8) {
    throw { status: 400, error: 'La nueva contraseña debe tener al menos 8 caracteres' };
  }

  const mismaPassword = await bcrypt.compare(passwordNueva, usuario.passwordHash);
  if (mismaPassword) {
    throw { status: 400, error: 'La nueva contraseña debe ser diferente a la actual' };
  }

  const nuevoHash = await bcrypt.hash(passwordNueva, 12);

  await prisma.usuario.update({
    where: { id: userId },
    data: {
      passwordHash: nuevoHash,
      debeCambiarPassword: false
    }
  });

  return { mensaje: 'Contraseña actualizada correctamente' };
}

module.exports = {
  login,
  me,
  cambiarPassword
};
