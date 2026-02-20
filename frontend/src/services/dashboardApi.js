export const getStats = (api) => api.get('/dashboard/stats');

export const getEjecutivo = (api, mes, año) =>
  api.get(`/dashboard/ejecutivo?mes=${mes}&año=${año}`);
