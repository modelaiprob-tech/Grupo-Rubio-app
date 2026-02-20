export const getAll = (api) => api.get('/clientes');

export const crear = (api, data) => api.post('/clientes', data);

export const actualizar = (api, id, data) => api.put(`/clientes/${id}`, data);

export const darBaja = (api, id, data) => api.put(`/clientes/${id}/dar-baja`, data);

export const reactivar = (api, id) => api.put(`/clientes/${id}/reactivar`);
