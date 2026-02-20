const ajustesManualesService = require('../services/ajustesManualesService');

async function crearOActualizar(req, res, next) {
  try {
    const resultado = await ajustesManualesService.crearOActualizar(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crearOActualizar
};
