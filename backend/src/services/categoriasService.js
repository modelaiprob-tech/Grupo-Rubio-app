const prisma = require('../config/prisma');

// ============================================
// Listar categorias activas
// ============================================
async function listar() {
  return prisma.categoria.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' }
  });
}

// ============================================
// Crear categoria
// ============================================
async function crear(body) {
  const {
    codigo, nombre, descripcion,
    salarioBase, plusConvenio, precioHora,
    recargoNocturno, recargoFestivo, recargoExtra, recargoExtraAdicional,
    plusTransporte, plusPeligrosidad
  } = body;

  return prisma.categoria.create({
    data: {
      codigo,
      nombre,
      descripcion,
      salarioBase: parseFloat(salarioBase) || 0,
      plusConvenio: plusConvenio ? parseFloat(plusConvenio) : 0,
      precioHora: parseFloat(precioHora) || 0,
      recargoNocturno: recargoNocturno ? parseFloat(recargoNocturno) : 25,
      recargoFestivo: recargoFestivo ? parseFloat(recargoFestivo) : 75,
      recargoExtra: recargoExtra ? parseFloat(recargoExtra) : 75,
      recargoExtraAdicional: recargoExtraAdicional ? parseFloat(recargoExtraAdicional) : 100,
      plusTransporte: plusTransporte ? parseFloat(plusTransporte) : 0,
      plusPeligrosidad: plusPeligrosidad ? parseFloat(plusPeligrosidad) : 0,
      activo: true
    }
  });
}

// ============================================
// Actualizar categoria
// ============================================
async function actualizar(id, body) {
  const {
    codigo, nombre, descripcion,
    salarioBase, plusConvenio, precioHora,
    recargoNocturno, recargoFestivo, recargoExtra, recargoExtraAdicional,
    plusTransporte, plusPeligrosidad
  } = body;

  return prisma.categoria.update({
    where: { id: parseInt(id) },
    data: {
      codigo,
      nombre,
      descripcion,
      salarioBase: parseFloat(salarioBase) || 0,
      plusConvenio: plusConvenio ? parseFloat(plusConvenio) : 0,
      precioHora: parseFloat(precioHora) || 0,
      recargoNocturno: recargoNocturno ? parseFloat(recargoNocturno) : 0,
      recargoFestivo: recargoFestivo ? parseFloat(recargoFestivo) : 0,
      recargoExtra: recargoExtra ? parseFloat(recargoExtra) : 0,
      recargoExtraAdicional: recargoExtraAdicional ? parseFloat(recargoExtraAdicional) : 0,
      plusTransporte: plusTransporte ? parseFloat(plusTransporte) : 0,
      plusPeligrosidad: plusPeligrosidad ? parseFloat(plusPeligrosidad) : 0
    }
  });
}

// ============================================
// Desactivar categoria (baja logica)
// ============================================
async function desactivar(id) {
  const trabajadores = await prisma.trabajador.count({
    where: { categoriaId: parseInt(id), activo: true }
  });

  if (trabajadores > 0) {
    throw {
      status: 400,
      error: `No se puede eliminar. Hay ${trabajadores} trabajador(es) activo(s) con esta categoría.`
    };
  }

  return prisma.categoria.update({
    where: { id: parseInt(id) },
    data: { activo: false }
  });
}

module.exports = {
  listar,
  crear,
  actualizar,
  desactivar
};
