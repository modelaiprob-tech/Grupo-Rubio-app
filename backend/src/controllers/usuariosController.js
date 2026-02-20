const usuariosService = require('../services/usuariosService');

async function listar(req, res, next) {
  try {
    const resultado = await usuariosService.listar();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await usuariosService.crear(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const resultado = await usuariosService.actualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function toggleActivo(req, res, next) {
  try {
    const resultado = await usuariosService.toggleActivo(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crear,
  actualizar,
  toggleActivo
};
