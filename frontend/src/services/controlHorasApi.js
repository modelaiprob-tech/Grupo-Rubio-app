export const getMatriz = (api, mes, año) =>
  api.get(`/control-horas?mes=${mes}&año=${año}`);

export const getNomina = (api, trabajadorId, mes, año) =>
  api.get(`/control-horas/nomina?mes=${mes}&año=${año}&trabajadorId=${trabajadorId}`);
