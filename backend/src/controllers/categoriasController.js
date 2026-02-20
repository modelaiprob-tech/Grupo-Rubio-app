const categoriasService = require('../services/categoriasService');

async function listar(req, res, next) {
  try {
    const resultado = await categoriasService.listar();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await categoriasService.crear(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const resultado = await categoriasService.actualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function desactivar(req, res, next) {
  try {
    const resultado = await categoriasService.desactivar(req.params.id);
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
