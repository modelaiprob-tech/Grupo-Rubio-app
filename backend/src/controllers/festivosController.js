const festivosService = require('../services/festivosService');

async function listar(req, res, next) {
  try {
    const resultado = await festivosService.listar(req.query.año || req.query.anio);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await festivosService.crear(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const resultado = await festivosService.actualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function eliminar(req, res, next) {
  try {
    await festivosService.eliminar(req.params.id);
    res.json({ mensaje: 'Festivo eliminado correctamente' });
  } catch (error) {
    next(error);
  }
}

async function cargaMasiva(req, res, next) {
  try {
    const resultado = await festivosService.cargaMasiva(req.body.festivos);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crear,
  actualizar,
  eliminar,
  cargaMasiva
};
