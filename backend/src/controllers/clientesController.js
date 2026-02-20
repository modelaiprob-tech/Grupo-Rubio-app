const clientesService = require('../services/clientesService');

async function listar(req, res, next) {
  try {
    const resultado = await clientesService.listar();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await clientesService.crear(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function darBaja(req, res, next) {
  try {
    const resultado = await clientesService.darBaja(parseInt(req.params.id), req.body.motivo, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function reactivar(req, res, next) {
  try {
    const resultado = await clientesService.reactivar(parseInt(req.params.id), req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crear,
  darBaja,
  reactivar
};
