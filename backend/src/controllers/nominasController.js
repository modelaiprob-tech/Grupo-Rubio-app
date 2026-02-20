const nominasService = require('../services/nominasService');

async function calcular(req, res, next) {
  try {
    const { mes, año, centroId } = req.query;
    const resultado = await nominasService.calcular(req.params.trabajadorId, mes, año, centroId);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  calcular
};
