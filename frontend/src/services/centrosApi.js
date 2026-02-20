export const getAll = (api) => api.get('/centros');

export const crear = (api, data) => api.post('/centros', data);

export const actualizar = (api, id, data) => api.put(`/centros/${id}`, data);

export const darBaja = (api, id, data) => api.put(`/centros/${id}/dar-baja`, data);

export const reactivar = (api, id) => api.put(`/centros/${id}/reactivar`);
