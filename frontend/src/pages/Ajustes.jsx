import { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';
import * as usuariosApi from '../services/usuariosApi';

function useFont(href) {
  useEffect(() => {
    if (!document.querySelector(`link[href="${href}"]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
    }
  }, []);
}

const cardClass = 'bg-white rounded-2xl p-6 shadow-[0_0_0_1px_rgba(0,0,0,0.03),0_2px_4px_rgba(0,0,0,0.04)]';
const inputClass = 'w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-400 transition-all';
const labelClass = 'block text-sm font-medium text-gray-500 mb-2';

export default function Ajustes() {
  const api = useApiClient();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editando, setEditando] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    nombre: '',
    rol: 'TRABAJADOR'
  });

  useFont('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
  const font = { fontFamily: '"Outfit", sans-serif' };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const data = await usuariosApi.getAll(api);
      setUsuarios(data);
    } catch (error) {
      alert('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editando) {
        const datos = {
          email: formData.email,
          nombre: formData.nombre,
          rol: formData.rol
        };
        if (formData.password) {
          datos.password = formData.password;
        }
        await usuariosApi.actualizar(api, editando.id, datos);
        alert('Usuario actualizado correctamente');
      } else {
        await usuariosApi.crear(api, formData);
        alert('Usuario creado correctamente');
      }
      setFormData({ email: '', password: '', nombre: '', rol: 'TRABAJADOR' });
      setMostrarForm(false);
      setEditando(null);
      cargarUsuarios();
    } catch (error) {
      alert('Error: ' + (error.error || 'Error desconocido'));
    }
  };

  const editarUsuario = (usuario) => {
    setEditando(usuario);
    setFormData({
      email: usuario.email,
      nombre: usuario.nombre,
      password: '',
      rol: usuario.rol
    });
    setMostrarForm(true);
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setFormData({ email: '', password: '', nombre: '', rol: 'TRABAJADOR' });
    setMostrarForm(false);
  };

  const toggleActivo = async (id) => {
    try {
      await usuariosApi.toggleActivo(api, id);
      cargarUsuarios();
    } catch (error) {
      alert('Error cambiando estado');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center" style={font}>
        <div className="flex gap-1.5">
          {[0, 150, 300].map(d => (
            <div key={d} className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: `${d}ms` }} />
          ))}
        </div>
      </div>
    );
  }

  const rolBadge = (rol) => {
    const styles = {
      ADMIN: 'bg-amber-50 text-amber-700',
      RRHH: 'bg-violet-50 text-violet-700',
      PLANIFICADOR: 'bg-sky-50 text-sky-700',
      TRABAJADOR: 'bg-gray-100 text-gray-600',
    };
    return styles[rol] || styles.TRABAJADOR;
  };

  return (
    <div className="min-h-screen bg-[#f0f4f8] p-5 lg:p-8" style={font}>
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Ajustes</h1>
            <p className="text-gray-400 text-sm font-medium mt-1">Gestion de usuarios del sistema</p>
          </div>
          <button
            onClick={() => {
              if (mostrarForm) {
                cancelarEdicion();
              } else {
                setMostrarForm(true);
              }
            }}
            className={`px-5 py-2.5 rounded-xl font-medium text-sm transition-all ${
              mostrarForm
                ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                : 'bg-teal-600 text-white hover:bg-teal-700'
            }`}
          >
            {mostrarForm ? 'Cancelar' : '+ Nuevo Usuario'}
          </button>
        </div>

        {mostrarForm && (
          <div className={`${cardClass} mb-6`}>
            <h3 className="text-lg font-bold text-gray-900 mb-5">
              {editando ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Contrasena {editando && <span className="text-gray-400">(dejar vacio para no cambiar)</span>}</label>
                  <input
                    type="password"
                    required={!editando}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Rol</label>
                  <select
                    value={formData.rol}
                    onChange={(e) => setFormData({...formData, rol: e.target.value})}
                    className={inputClass}
                  >
                    <option value="ADMIN">Administrador</option>
                    <option value="RRHH">Recursos Humanos</option>
                    <option value="PLANIFICADOR">Planificador</option>
                    <option value="TRABAJADOR">Trabajador</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 font-medium text-sm transition-colors"
                >
                  {editando ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Desktop Table */}
        <div className={`hidden md:block ${cardClass} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                  <th className="text-left p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rol</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Estado</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Ultimo acceso</th>
                  <th className="text-center p-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map(usuario => (
                  <tr key={usuario.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-sm text-gray-900">{usuario.email}</td>
                    <td className="p-4 text-sm font-semibold text-gray-900">{usuario.nombre}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${rolBadge(usuario.rol)}`}>
                        {usuario.rol}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        usuario.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {usuario.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="p-4 text-center text-sm text-gray-400">
                      {usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleString('es-ES') : 'Nunca'}
                    </td>
                    <td className="p-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => editarUsuario(usuario)}
                          className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 text-xs font-medium transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => toggleActivo(usuario.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            usuario.activo
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                          }`}
                        >
                          {usuario.activo ? 'Desactivar' : 'Activar'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {usuarios.map(usuario => (
            <div key={usuario.id} className={`${cardClass}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{usuario.nombre}</p>
                  <p className="text-gray-400 text-xs mt-0.5">{usuario.email}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                  usuario.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-600'
                }`}>
                  {usuario.activo ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${rolBadge(usuario.rol)}`}>
                  {usuario.rol}
                </span>
                <span className="text-xs text-gray-400">
                  {usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleString('es-ES') : 'Sin acceso'}
                </span>
              </div>
              <div className="flex gap-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => editarUsuario(usuario)}
                  className="flex-1 px-3 py-2.5 bg-teal-50 text-teal-700 rounded-xl hover:bg-teal-100 text-sm font-medium transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActivo(usuario.id)}
                  className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    usuario.activo
                      ? 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                      : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                  }`}
                >
                  {usuario.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
