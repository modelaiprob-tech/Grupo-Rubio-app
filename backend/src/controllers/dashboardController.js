const dashboardService = require('../services/dashboardService');

async function stats(req, res, next) {
  try {
    const resultado = await dashboardService.obtenerStats();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function centrosSinCubrir(req, res, next) {
  try {
    const resultado = await dashboardService.obtenerCentrosSinCubrir();
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function ejecutivo(req, res, next) {
  try {
    const { mes, año } = req.query;
    const resultado = await dashboardService.obtenerEjecutivo(mes, año);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  stats,
  centrosSinCubrir,
  ejecutivo
};
