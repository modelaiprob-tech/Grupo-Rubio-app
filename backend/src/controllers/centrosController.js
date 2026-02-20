const centrosService = require('../services/centrosService');

async function listar(req, res, next) {
  try {
    const resultado = await centrosService.listar(req.query.clienteId);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const resultado = await centrosService.crear(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const resultado = await centrosService.actualizar(req.params.id, req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function darDeBaja(req, res, next) {
  try {
    const resultado = await centrosService.darDeBaja(req.params.id, req.body.motivo, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function reactivar(req, res, next) {
  try {
    const resultado = await centrosService.reactivar(req.params.id, req.user.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function obtenerHorariosLimpieza(req, res, next) {
  try {
    const resultado = await centrosService.obtenerHorariosLimpieza(req.params.id);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function actualizarHorariosLimpieza(req, res, next) {
  try {
    const resultado = await centrosService.actualizarHorariosLimpieza(req.params.id, req.body.horarios);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listar,
  crear,
  actualizar,
  darDeBaja,
  reactivar,
  obtenerHorariosLimpieza,
  actualizarHorariosLimpieza
};
