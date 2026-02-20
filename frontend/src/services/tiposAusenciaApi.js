export const getAll = (api) => api.get('/tipos-ausencia');

export const crear = (api, data) => api.post('/tipos-ausencia', data);

export const actualizar = (api, id, data) => api.put(`/tipos-ausencia/${id}`, data);

export const eliminar = (api, id) => api.del(`/tipos-ausencia/${id}`);
