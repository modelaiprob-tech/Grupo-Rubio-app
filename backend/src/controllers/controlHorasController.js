const controlHorasService = require('../services/controlHorasService');

async function obtenerMatriz(req, res, next) {
  try {
    const { mes, año } = req.query;
    const resultado = await controlHorasService.obtenerMatriz(mes, año);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function obtenerNomina(req, res, next) {
  try {
    const { mes, año, trabajadorId } = req.query;
    const resultado = await controlHorasService.obtenerNomina(mes, año, trabajadorId);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerMatriz,
  obtenerNomina
};
