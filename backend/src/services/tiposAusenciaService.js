const prisma = require('../config/prisma');

// ============================================
// Listar tipos de ausencia activos
// ============================================
async function listar() {
  return prisma.tipoAusencia.findMany({
    where: { activo: true },
    orderBy: { nombre: 'asc' }
  });
}

// ============================================
// Crear tipo de ausencia
// ============================================
async function crear(body) {
  const {
    codigo, nombre, descripcion,
    restaVacaciones, restaAsuntos, pagada,
    porcentajeCobro, usaTramos, tramosJson, baseCalculo,
    diasCarencia, topeDiarioEuros,
    pagador,
    incluyeDomingos, incluyeFestivos, diasMaximo,
    requiereJustificante, tipoJustificante, requiereAltaMedica,
    colorHex
  } = body;

  return prisma.tipoAusencia.create({
    data: {
      codigo,
      nombre,
      descripcion,
      restaVacaciones: restaVacaciones || false,
      restaAsuntos: restaAsuntos || false,
      pagada: pagada !== undefined ? pagada : true,
      porcentajeCobro: porcentajeCobro || 100,
      usaTramos: usaTramos || false,
      tramosJson: tramosJson || null,
      baseCalculo: baseCalculo || 'SALARIO_BASE',
      diasCarencia: diasCarencia || 0,
      topeDiarioEuros: topeDiarioEuros || null,
      pagador: pagador || 'EMPRESA',
      incluyeDomingos: incluyeDomingos !== undefined ? incluyeDomingos : true,
      incluyeFestivos: incluyeFestivos !== undefined ? incluyeFestivos : true,
      diasMaximo: diasMaximo || null,
      requiereJustificante: requiereJustificante || false,
      tipoJustificante: tipoJustificante || 'MEDICO',
      requiereAltaMedica: requiereAltaMedica || false,
      colorHex: colorHex || '#6B7280',
      activo: true
    }
  });
}

// ============================================
// Actualizar tipo de ausencia
// ============================================
async function actualizar(id, body) {
  const data = {};

  // Campos basicos
  if (body.codigo !== undefined) data.codigo = body.codigo;
  if (body.nombre !== undefined) data.nombre = body.nombre;
  if (body.descripcion !== undefined) data.descripcion = body.descripcion;
  if (body.restaVacaciones !== undefined) data.restaVacaciones = Boolean(body.restaVacaciones);
  if (body.restaAsuntos !== undefined) data.restaAsuntos = Boolean(body.restaAsuntos);
  if (body.pagada !== undefined) data.pagada = Boolean(body.pagada);

  // Calculo economico
  if (body.porcentajeCobro !== undefined) data.porcentajeCobro = parseFloat(body.porcentajeCobro);
  if (body.usaTramos !== undefined) data.usaTramos = Boolean(body.usaTramos);
  if (body.tramosJson !== undefined) data.tramosJson = body.tramosJson || null;
  if (body.baseCalculo !== undefined) data.baseCalculo = body.baseCalculo;
  if (body.diasCarencia !== undefined) data.diasCarencia = parseInt(body.diasCarencia) || 0;
  if (body.topeDiarioEuros !== undefined) data.topeDiarioEuros = body.topeDiarioEuros ? parseFloat(body.topeDiarioEuros) : null;

  // Quien paga
  if (body.pagador !== undefined) data.pagador = body.pagador;

  // Computo dias
  if (body.incluyeDomingos !== undefined) data.incluyeDomingos = Boolean(body.incluyeDomingos);
  if (body.incluyeFestivos !== undefined) data.incluyeFestivos = Boolean(body.incluyeFestivos);
  if (body.diasMaximo !== undefined) data.diasMaximo = body.diasMaximo ? parseInt(body.diasMaximo) : null;

  // Documentacion
  if (body.requiereJustificante !== undefined) data.requiereJustificante = Boolean(body.requiereJustificante);
  if (body.tipoJustificante !== undefined) data.tipoJustificante = body.tipoJustificante;
  if (body.requiereAltaMedica !== undefined) data.requiereAltaMedica = Boolean(body.requiereAltaMedica);

  // Metadata
  if (body.colorHex !== undefined) data.colorHex = body.colorHex;

  return prisma.tipoAusencia.update({
    where: { id: parseInt(id) },
    data
  });
}

// ============================================
// Desactivar tipo de ausencia (baja logica)
// ============================================
async function desactivar(id) {
  const ausencias = await prisma.ausencia.count({
    where: { tipoAusenciaId: parseInt(id) }
  });

  if (ausencias > 0) {
    throw {
      status: 400,
      error: `No se puede eliminar. Hay ${ausencias} ausencia(s) registrada(s) con este tipo.`
    };
  }

  return prisma.tipoAusencia.update({
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
