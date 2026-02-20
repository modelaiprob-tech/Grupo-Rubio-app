import { useState, useEffect } from 'react';
import * as clientesApi from '../services/clientesApi';
import * as centrosApi from '../services/centrosApi';

export function useClientes(api) {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarInactivos, setMostrarInactivos] = useState(false);
  const [modalBajaOpen, setModalBajaOpen] = useState(false);
  const [modalBajaCentroOpen, setModalBajaCentroOpen] = useState(false);
  const [centroParaBaja, setCentroParaBaja] = useState(null);
  const [motivoBaja, setMotivoBaja] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalCentroOpen, setModalCentroOpen] = useState(false);
  const [centroEditando, setCentroEditando] = useState(null);
  const [editando, setEditando] = useState(null);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [error, setError] = useState('');
  const [errorCentro, setErrorCentro] = useState('');

  const [form, setForm] = useState({
    nombre: '',
    cif: '',
    direccion: '',
    telefono: '',
    contactoNombre: '',
    contactoEmail: ''
  });

  const [formCentro, setFormCentro] = useState({
    nombre: '',
    direccion: '',
    horarioApertura: '06:00',
    horarioCierre: '22:00',
    tipoHorarioLimpieza: 'FLEXIBLE',
    horariosLimpieza: [{ inicio: '08:00', fin: '14:00' }],
    tipoServicio: 'FRECUENTE'
  });

  useEffect(() => {
    cargarDatos();
  }, [mostrarInactivos]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await clientesApi.getAll(api);
      const filtrados = mostrarInactivos ? data : data.filter(c => c.activo);
      setClientes(filtrados);
    } catch (err) {
      console.error('Error cargando clientes:', err);
    }
    setLoading(false);
  };

  const abrirModal = (cliente = null) => {
    setError('');
    if (cliente) {
      setEditando(cliente);
      setForm({
        nombre: cliente.nombre,
        cif: cliente.cif,
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        contactoNombre: cliente.contactoNombre || '',
        contactoEmail: cliente.contactoEmail || ''
      });
    } else {
      setEditando(null);
      setForm({
        nombre: '',
        cif: '',
        direccion: '',
        telefono: '',
        contactoNombre: '',
        contactoEmail: ''
      });
    }
    setModalOpen(true);
  };

  const abrirModalCentro = (cliente) => {
    setErrorCentro('');
    setClienteSeleccionado(cliente);
    setCentroEditando(null);
    setFormCentro({
      nombre: '',
      direccion: '',
      horarioApertura: '06:00',
      horarioCierre: '22:00',
      tipoHorarioLimpieza: 'FLEXIBLE',
      horariosLimpieza: [{ inicio: '08:00', fin: '14:00' }],
      tipoServicio: 'FRECUENTE'
    });
    setModalCentroOpen(true);
  };

  const abrirModalEditarCentro = (centro) => {
    setErrorCentro('');
    setCentroEditando(centro);

    const horariosLimpieza = centro.horariosLimpieza && centro.horariosLimpieza.length > 0
      ? centro.horariosLimpieza.map(h => ({ inicio: h.inicio, fin: h.fin }))
      : [{ inicio: '08:00', fin: '14:00' }];

    setFormCentro({
      nombre: centro.nombre,
      direccion: centro.direccion || '',
      horarioApertura: centro.horarioApertura || '06:00',
      horarioCierre: centro.horarioCierre || '22:00',
      tipoHorarioLimpieza: centro.tipoHorarioLimpieza || 'FLEXIBLE',
      horariosLimpieza: horariosLimpieza,
      tipoServicio: centro.tipoServicio || 'FRECUENTE'
    });
    setModalCentroOpen(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editando) {
        await clientesApi.actualizar(api, editando.id, form);
      } else {
        await clientesApi.crear(api, form);
      }
      setModalOpen(false);
      cargarDatos();
    } catch (err) {
      console.error('Error guardando:', err);
      const mensaje = err.error || err.message || 'Error al guardar cliente';
      setError(mensaje);
    }
  };

  const añadirHorarioLimpieza = () => {
    setFormCentro({
      ...formCentro,
      horariosLimpieza: [...formCentro.horariosLimpieza, { inicio: '08:00', fin: '14:00' }]
    });
  };

  const eliminarHorarioLimpieza = (index) => {
    if (formCentro.horariosLimpieza.length === 1) {
      alert('Debe haber al menos un horario');
      return;
    }
    const nuevosHorarios = formCentro.horariosLimpieza.filter((_, i) => i !== index);
    setFormCentro({ ...formCentro, horariosLimpieza: nuevosHorarios });
  };

  const actualizarHorarioLimpieza = (index, campo, valor) => {
    const nuevosHorarios = [...formCentro.horariosLimpieza];
    nuevosHorarios[index][campo] = valor;
    setFormCentro({ ...formCentro, horariosLimpieza: nuevosHorarios });
  };

  const guardarCentro = async (e) => {
    e.preventDefault();
    setErrorCentro('');

    if (formCentro.tipoHorarioLimpieza === 'FIJO') {
      const horariosValidos = formCentro.horariosLimpieza.every(h => {
        if (!h.inicio || !h.fin) {
          setErrorCentro('Todos los horarios deben tener inicio y fin');
          return false;
        }
        if (h.inicio >= h.fin) {
          setErrorCentro('La hora de fin debe ser posterior a la hora de inicio');
          return false;
        }
        return true;
      });

      if (!horariosValidos) return;
    }

    try {
      const datos = {
        nombre: formCentro.nombre,
        direccion: formCentro.direccion,
        horarioApertura: formCentro.horarioApertura,
        horarioCierre: formCentro.horarioCierre,
        tipoHorarioLimpieza: formCentro.tipoHorarioLimpieza,
        tipoServicio: formCentro.tipoServicio,
        clienteId: clienteSeleccionado?.id
      };

      if (formCentro.tipoHorarioLimpieza === 'FIJO') {
        datos.horariosLimpieza = formCentro.horariosLimpieza;
      }

      if (centroEditando) {
        await centrosApi.actualizar(api, centroEditando.id, datos);
      } else {
        await centrosApi.crear(api, datos);
      }

      setModalCentroOpen(false);
      cargarDatos();
    } catch (err) {
      console.error('Error guardando centro:', err);
      const mensaje = err.error || err.message || 'Error al guardar centro';
      setErrorCentro(mensaje);
    }
  };

  const darDeBajaCliente = async () => {
    try {
      await clientesApi.darBaja(api, clienteSeleccionado.id, { motivo: motivoBaja });
      alert('Cliente y sus centros dados de baja correctamente');
      setModalBajaOpen(false);
      setMotivoBaja('');
      cargarDatos();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al dar de baja el cliente');
    }
  };

  const reactivarCliente = async (clienteId) => {
    if (!confirm('¿Reactivar este cliente?')) return;
    try {
      await clientesApi.reactivar(api, clienteId);
      alert('Cliente reactivado');
      cargarDatos();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al reactivar');
    }
  };

  const darDeBajaCentro = async () => {
    try {
      await centrosApi.darBaja(api, centroParaBaja.id, { motivo: motivoBaja });
      alert('Centro dado de baja correctamente');
      setModalBajaCentroOpen(false);
      setMotivoBaja('');
      cargarDatos();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al dar de baja el centro');
    }
  };

  const reactivarCentro = async (centroId) => {
    if (!confirm('¿Reactivar este centro?')) return;
    try {
      await centrosApi.reactivar(api, centroId);
      alert('Centro reactivado');
      cargarDatos();
    } catch (err) {
      console.error('Error:', err);
      alert('Error al reactivar');
    }
  };

  return {
    clientes,
    loading,
    mostrarInactivos,
    setMostrarInactivos,
    modalBajaOpen,
    setModalBajaOpen,
    modalBajaCentroOpen,
    setModalBajaCentroOpen,
    centroParaBaja,
    setCentroParaBaja,
    motivoBaja,
    setMotivoBaja,
    modalOpen,
    setModalOpen,
    modalCentroOpen,
    setModalCentroOpen,
    centroEditando,
    setCentroEditando,
    editando,
    clienteSeleccionado,
    setClienteSeleccionado,
    error,
    errorCentro,
    form,
    setForm,
    formCentro,
    setFormCentro,
    abrirModal,
    abrirModalCentro,
    abrirModalEditarCentro,
    guardar,
    añadirHorarioLimpieza,
    eliminarHorarioLimpieza,
    actualizarHorarioLimpieza,
    guardarCentro,
    darDeBajaCliente,
    reactivarCliente,
    darDeBajaCentro,
    reactivarCentro
  };
}
