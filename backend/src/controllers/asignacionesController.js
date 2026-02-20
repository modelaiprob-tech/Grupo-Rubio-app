const asignacionesService = require('../services/asignacionesService');

async function listar(req, res, next) {
  try {
    const resultado = await asignacionesService.listar(req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await asignacionesService.crear(req.body, req.user.id);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const resultado = await asignacionesService.eliminar(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function copiarSemana(req, res, next) {
  try {
    const resultado = await asignacionesService.copiarSemana(req.body, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crear,
  eliminar,
  copiarSemana
};
