import { useState, useEffect } from 'react';
import { useApiClient } from '../contexts/AuthContext';

export default function Ajustes() {
  const { get, post, put } = useApiClient();
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

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      const data = await get('/usuarios');
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
      // Editar usuario existente
      const datos = {
        email: formData.email,
        nombre: formData.nombre,
        rol: formData.rol
      };
      // Solo incluir password si se escribió uno nuevo
      if (formData.password) {
        datos.password = formData.password;
      }
      await put(`/usuarios/${editando.id}`, datos);
      alert('Usuario actualizado correctamente');
    } else {
      // Crear nuevo usuario
      await post('/usuarios', formData);
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
    password: '', // Dejar vacío para no cambiar
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
    await put(`/usuarios/${id}/toggle-activo`, {});
    cargarUsuarios();
  } catch (error) {
    alert('Error cambiando estado');
  }
};
  if (loading) return <div style={{padding: '20px'}}>Cargando...</div>;

  return (
    <div style={{padding: '20px', maxWidth: '1200px', margin: '0 auto'}}>
      <h1 style={{fontSize: '24px', fontWeight: 'bold', marginBottom: '20px'}}>Ajustes</h1>
      
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: '20px'}}>
        <button 
  onClick={() => {
    if (mostrarForm) {
      cancelarEdicion();
    } else {
      setMostrarForm(true);
    }
  }}
  style={{
    padding: '10px 20px',
    backgroundColor: '#3b82f6',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }}
>
  {mostrarForm ? ' Cancelar' : ' Nuevo Usuario'}
</button>
      </div>

      {mostrarForm && (
        <form onSubmit={handleSubmit} style={{
          backgroundColor: '#f3f4f6',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <h3>{editando ? 'Editar Usuario' : 'Crear Nuevo Usuario'}</h3>
          
          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>Email:</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
            />
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>Nombre:</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({...formData, nombre: e.target.value})}
              style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
            />
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>Contraseña:</label>
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
            />
          </div>

          <div style={{marginBottom: '15px'}}>
            <label style={{display: 'block', marginBottom: '5px'}}>Rol:</label>
            <select
              value={formData.rol}
              onChange={(e) => setFormData({...formData, rol: e.target.value})}
              style={{width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ccc'}}
            >
              <option value="ADMIN">Administrador</option>
              <option value="RRHH">Recursos Humanos</option>
              <option value="PLANIFICADOR">Planificador</option>
              <option value="TRABAJADOR">Trabajador</option>
            </select>
          </div>

          <button 
  type="submit"
  style={{
    padding: '10px 20px',
    backgroundColor: '#10b981',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }}
>
  {editando ? ' Guardar Cambios' : ' Crear Usuario'}
</button>
        </form>
      )}

      {/* Vista Desktop */}
      <div className="hidden md:block overflow-x-auto">
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'white',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <thead>
            <tr style={{backgroundColor: '#f9fafb', borderBottom: '2px solid #e5e7eb'}}>
              <th style={{padding: '12px', textAlign: 'left'}}>Email</th>
              <th style={{padding: '12px', textAlign: 'left'}}>Nombre</th>
              <th style={{padding: '12px', textAlign: 'left'}}>Rol</th>
              <th style={{padding: '12px', textAlign: 'center'}}>Estado</th>
              <th style={{padding: '12px', textAlign: 'center'}}>Último acceso</th>
              <th style={{padding: '12px', textAlign: 'center'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map(usuario => (
              <tr key={usuario.id} style={{borderBottom: '1px solid #e5e7eb'}}>
                <td style={{padding: '12px'}}>{usuario.email}</td>
                <td style={{padding: '12px'}}>{usuario.nombre}</td>
                <td style={{padding: '12px'}}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: usuario.rol === 'ADMIN' ? '#fef3c7' : '#e0e7ff',
                    color: usuario.rol === 'ADMIN' ? '#92400e' : '#3730a3'
                  }}>
                    {usuario.rol}
                  </span>
                </td>
                <td style={{padding: '12px', textAlign: 'center'}}>
                  <span style={{
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    backgroundColor: usuario.activo ? '#d1fae5' : '#fee2e2',
                    color: usuario.activo ? '#065f46' : '#991b1b'
                  }}>
                    {usuario.activo ? ' Activo' : ' Inactivo'}
                  </span>
                </td>
                <td style={{padding: '12px', textAlign: 'center', fontSize: '14px'}}>
                  {usuario.ultimoAcceso ? new Date(usuario.ultimoAcceso).toLocaleString('es-ES') : 'Nunca'}
                </td>
                <td style={{padding: '12px', textAlign: 'center'}}>
  <div style={{display: 'flex', gap: '8px', justifyContent: 'center'}}>
    <button
      onClick={() => editarUsuario(usuario)}
      style={{
        padding: '6px 12px',
        backgroundColor: '#3b82f6',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >
       Editar
    </button>
    <button
      onClick={() => toggleActivo(usuario.id)}
      style={{
        padding: '6px 12px',
        backgroundColor: usuario.activo ? '#ef4444' : '#10b981',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '12px'
      }}
    >
      {usuario.activo ? ' Desactivar' : ' Activar'}
    </button>
  </div>
</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vista Móvil */}
      <div className="md:hidden flex flex-col gap-4">
        {usuarios.map(usuario => (
          <div key={usuario.id} style={{
            backgroundColor: 'white',
            padding: '16px',
            borderRadius: '8px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{marginBottom: '12px'}}>
              <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '4px'}}>Email</p>
              <p style={{fontWeight: '600'}}>{usuario.email}</p>
            </div>
            <div style={{marginBottom: '12px'}}>
              <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '4px'}}>Nombre</p>
              <p style={{fontWeight: '600'}}>{usuario.nombre}</p>
            </div>
            <div style={{marginBottom: '12px'}}>
              <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '4px'}}>Rol</p>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: usuario.rol === 'ADMIN' ? '#fef3c7' : '#e0e7ff',
                color: usuario.rol === 'ADMIN' ? '#92400e' : '#3730a3'
              }}>
                {usuario.rol}
              </span>
            </div>
            <div style={{marginBottom: '12px'}}>
              <p style={{fontSize: '14px', color: '#6b7280', marginBottom: '4px'}}>Estado</p>
              <span style={{
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                backgroundColor: usuario.activo ? '#d1fae5' : '#fee2e2',
                color: usuario.activo ? '#065f46' : '#991b1b'
              }}>
                {usuario.activo ? ' Activo' : ' Inactivo'}
              </span>
            </div>
            <div style={{display: 'flex', gap: '8px'}}>
  <button
    onClick={() => editarUsuario(usuario)}
    style={{
      flex: 1,
      padding: '10px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    }}
  >
     Editar
  </button>
  <button
    onClick={() => toggleActivo(usuario.id)}
    style={{
      flex: 1,
      padding: '10px',
      backgroundColor: usuario.activo ? '#ef4444' : '#10b981',
      color: 'white',
      border: 'none',
      borderRadius: '6px',
      cursor: 'pointer',
      fontSize: '14px',
      fontWeight: '500'
    }}
  >
    {usuario.activo ? ' Desactivar' : ' Activar'}
  </button>
</div>
          </div>
        ))}
      </div>
    </div>
  );
}