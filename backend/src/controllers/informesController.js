const informesService = require('../services/informesService');

async function estadoTrabajadores(req, res, next) {
  try {
    const resultado = await informesService.estadoTrabajadores(req.query.fecha);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function horasTrabajador(req, res, next) {
  try {
    const { trabajadorId, mes, año } = req.query;
    const resultado = await informesService.horasTrabajador(trabajadorId, mes, año);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function horasCliente(req, res, next) {
  try {
    const { clienteId, mes, año } = req.query;
    const resultado = await informesService.horasCliente(clienteId, mes, año);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

async function calendarioEmpresa(req, res, next) {
  try {
    const { clienteId, fechaInicio, fechaFin } = req.query;
    const resultado = await informesService.calendarioEmpresa(clienteId, fechaInicio, fechaFin);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  estadoTrabajadores,
  horasTrabajador,
  horasCliente,
  calendarioEmpresa
};
