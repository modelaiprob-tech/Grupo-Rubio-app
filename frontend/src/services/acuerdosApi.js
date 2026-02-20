export const getAll = (api) => api.get('/acuerdos-individuales');

export const crear = (api, data) => api.post('/acuerdos-individuales', data);

export const actualizar = (api, id, data) => api.put(`/acuerdos-individuales/${id}`, data);

export const eliminar = (api, id) => api.del(`/acuerdos-individuales/${id}`);
