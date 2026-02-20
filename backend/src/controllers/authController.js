const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const resultado = await authService.login(req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

function me(req, res) {
  res.json(authService.me(req.user));
}

async function cambiarPassword(req, res, next) {
  try {
    const resultado = await authService.cambiarPassword(req.user.id, req.body);
    res.json(resultado);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  me,
  cambiarPassword
};
