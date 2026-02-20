const acuerdosService = require('../services/acuerdosIndividualesService');

async function listar(req, res, next) {
  try {
    const resultado = await acuerdosService.listar();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function listarPorTrabajador(req, res, next) {
  try {
    const resultado = await acuerdosService.listarPorTrabajador(req.params.trabajadorId);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await acuerdosService.crear(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const resultado = await acuerdosService.actualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function desactivar(req, res, next) {
  try {
    const resultado = await acuerdosService.desactivar(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  listarPorTrabajador,
  crear,
  actualizar,
  desactivar
};
