export const getAll = (api, params) =>
  api.get(params ? `/ausencias?${params}` : '/ausencias');

export const crear = (api, data) => api.post('/ausencias', data);

export const actualizar = (api, id, data) => api.put(`/ausencias/${id}`, data);

export const aprobar = (api, id) => api.put(`/ausencias/${id}/aprobar`);

export const rechazar = (api, id, data) => api.put(`/ausencias/${id}/rechazar`, data);

export const archivar = (api, id, data) => api.put(`/ausencias/${id}/archivar`, data);
