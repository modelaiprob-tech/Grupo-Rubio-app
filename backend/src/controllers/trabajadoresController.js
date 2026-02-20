const trabajadoresService = require('../services/trabajadoresService');

async function listar(req, res, next) {
  try {
    const resultado = await trabajadoresService.listar(req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function disponibles(req, res, next) {
  try {
    const resultado = await trabajadoresService.disponibles(req.query);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function obtenerPorId(req, res, next) {
  try {
    const resultado = await trabajadoresService.obtenerPorId(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function obtenerCompleto(req, res, next) {
  try {
    const resultado = await trabajadoresService.obtenerCompleto(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await trabajadoresService.crear(req.body, req.user.id);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const resultado = await trabajadoresService.actualizar(req.params.id, req.body, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function darDeBaja(req, res, next) {
  try {
    const resultado = await trabajadoresService.darDeBaja(req.params.id, req.body.motivo, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function reactivar(req, res, next) {
  try {
    const resultado = await trabajadoresService.reactivar(req.params.id, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function asignarCentro(req, res, next) {
  try {
    const resultado = await trabajadoresService.asignarCentro(req.body);
    res.status(201).json(resultado);
  } catch (error) {
    next(error);
  }
}

async function eliminarCentro(req, res, next) {
  try {
    const resultado = await trabajadoresService.eliminarCentro(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  disponibles,
  obtenerPorId,
  obtenerCompleto,
  crear,
  actualizar,
  darDeBaja,
  reactivar,
  asignarCentro,
  eliminarCentro
};
