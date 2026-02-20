const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');

// ============================================
// Listar usuarios
// ============================================
async function listar() {
  return prisma.usuario.findMany({
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
}

// ============================================
// Crear usuario
// ============================================
async function crear(body) {
  const { email, password, nombre, rol } = body;

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) {
    throw { status: 400, error: 'El email ya está registrado' };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  return prisma.usuario.create({
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
}

// ============================================
// Actualizar usuario
// ============================================
async function actualizar(id, body) {
  const { email, nombre, rol, activo, password } = body;

  const data = { email, nombre, rol, activo };

  if (password) {
    data.passwordHash = await bcrypt.hash(password, 10);
  }

  return prisma.usuario.update({
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
}

// ============================================
// Toggle activo/inactivo
// ============================================
async function toggleActivo(id) {
  const usuarioActual = await prisma.usuario.findUnique({
    where: { id: parseInt(id) }
  });

  return prisma.usuario.update({
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
}

module.exports = {
  listar,
  crear,
  actualizar,
  toggleActivo
};
