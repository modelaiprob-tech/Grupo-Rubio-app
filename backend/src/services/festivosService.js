const prisma = require('../config/prisma');

// ============================================
// Listar festivos (filtrable por año)
// ============================================
async function listar(anio) {
  return prisma.festivo.findMany({
    where: anio ? { anio: parseInt(anio) } : {},
    orderBy: { fecha: 'asc' }
  });
}

// ============================================
// Crear festivo
// ============================================
async function crear(body) {
  const { fecha, nombre, ambito } = body;
  const fechaDate = new Date(fecha);
  const anio = fechaDate.getFullYear();

  const existente = await prisma.festivo.findUnique({
    where: { fecha_ambito: { fecha: fechaDate, ambito } }
  });

  if (existente) {
    throw { status: 409, error: `Ya existe un festivo con esa fecha y ámbito (${existente.nombre})` };
  }

  return prisma.festivo.create({
    data: { fecha: fechaDate, nombre, ambito, anio }
  });
}

// ============================================
// Actualizar festivo
// ============================================
async function actualizar(id, body) {
  const { fecha, nombre, ambito } = body;
  const data = {};

  if (nombre) data.nombre = nombre;
  if (ambito) data.ambito = ambito;
  if (fecha) {
    data.fecha = new Date(fecha);
    data.anio = data.fecha.getFullYear();
  }

  return prisma.festivo.update({
    where: { id: parseInt(id) },
    data
  });
}

// ============================================
// Eliminar festivo
// ============================================
async function eliminar(id) {
  return prisma.festivo.delete({
    where: { id: parseInt(id) }
  });
}

// ============================================
// Carga masiva de festivos por año
// ============================================
async function cargaMasiva(festivos) {
  let creados = 0;
  let omitidos = 0;

  for (const f of festivos) {
    const fechaDate = new Date(f.fecha);
    const anio = fechaDate.getFullYear();

    try {
      await prisma.festivo.upsert({
        where: { fecha_ambito: { fecha: fechaDate, ambito: f.ambito } },
        update: { nombre: f.nombre },
        create: { fecha: fechaDate, nombre: f.nombre, ambito: f.ambito, anio }
      });
      creados++;
    } catch {
      omitidos++;
    }
  }

  return { creados, omitidos, total: festivos.length };
}

module.exports = {
  listar,
  crear,
  actualizar,
  eliminar,
  cargaMasiva
};
