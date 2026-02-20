const ausenciaService = require('../services/ausenciaService');

async function listar(req, res, next) {
  try {
    const resultado = await ausenciaService.listar(req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await ausenciaService.crearAusencia(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function calcularImporte(req, res, next) {
  try {
    const resultado = await ausenciaService.calcularImporte(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const resultado = await ausenciaService.actualizarAusencia(parseInt(req.params.id), req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function rechazar(req, res, next) {
  try {
    const resultado = await ausenciaService.rechazarAusencia(parseInt(req.params.id), req.user.id, req.body.motivo);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function aprobar(req, res, next) {
  try {
    const resultado = await ausenciaService.aprobarAusencia(parseInt(req.params.id), req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function archivar(req, res, next) {
  try {
    const resultado = await ausenciaService.archivar(req.params.id, req.body.archivada);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crear,
  calcularImporte,
  actualizar,
  rechazar,
  aprobar,
  archivar
};
