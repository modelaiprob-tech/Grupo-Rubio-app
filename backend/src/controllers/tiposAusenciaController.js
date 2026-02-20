const tiposAusenciaService = require('../services/tiposAusenciaService');

async function listar(req, res, next) {
  try {
    const resultado = await tiposAusenciaService.listar();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await tiposAusenciaService.crear(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const resultado = await tiposAusenciaService.actualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function desactivar(req, res, next) {
  try {
    const resultado = await tiposAusenciaService.desactivar(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crear,
  actualizar,
  desactivar
};
