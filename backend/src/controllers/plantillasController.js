const plantillasService = require('../services/plantillasService');

async function listar(req, res, next) {
  try {
    const resultado = await plantillasService.listar();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crearDesdeSemana(req, res, next) {
  try {
    const resultado = await plantillasService.crearDesdeSemana(req.body, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function aplicar(req, res, next) {
  try {
    const resultado = await plantillasService.aplicar(req.params.id, req.body, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    const resultado = await plantillasService.eliminar(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crearDesdeSemana,
  aplicar,
  eliminar
};
