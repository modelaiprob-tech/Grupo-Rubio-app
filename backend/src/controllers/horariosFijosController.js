const horariosFijosService = require('../services/horariosFijosService');

async function obtenerPorTrabajador(req, res, next) {
  try {
    const horarios = await horariosFijosService.obtenerPorTrabajador(req.params.trabajadorId);
    res.json(horarios);
  } catch (error) {
    next(error);
  }
}

async function obtenerPorCentro(req, res, next) {
  try {
    const horarios = await horariosFijosService.obtenerPorCentro(req.params.centroId);
    res.json(horarios);
  } catch (error) {
    next(error);
  }
}

async function crear(req, res, next) {
  try {
    const horario = await horariosFijosService.crear(req.body);
    res.status(201).json(horario);
  } catch (error) {
    next(error);
  }
}

async function actualizar(req, res, next) {
  try {
    const horario = await horariosFijosService.actualizar(req.params.id, req.body);
    res.json(horario);
  } catch (error) {
    next(error);
  }
}

async function desactivar(req, res, next) {
  try {
    const horario = await horariosFijosService.desactivar(req.params.id, req.body.eliminarAsignacionesFuturas);
    res.json({ mensaje: 'Horario fijo desactivado correctamente', horario });
  } catch (error) {
    next(error);
  }
}

async function generarAsignaciones(req, res, next) {
  try {
    const resultado = await horariosFijosService.generarAsignaciones(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerPorTrabajador,
  obtenerPorCentro,
  crear,
  actualizar,
  desactivar,
  generarAsignaciones
};
