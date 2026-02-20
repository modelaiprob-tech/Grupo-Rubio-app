import { useState, useEffect } from 'react';
import * as trabajadoresApi from '../services/trabajadoresApi';
import * as clientesApi from '../services/clientesApi';
import * as informesApi from '../services/informesApi';

export function useInformes(api) {
  const [tipoInforme, setTipoInforme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [datos, setDatos] = useState(null);

  // Filtros
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [año, setAño] = useState(new Date().getFullYear());
  const [trabajadorId, setTrabajadorId] = useState('');
  const [clienteId, setClienteId] = useState('');
  const [fechaFin, setFechaFin] = useState(
    new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  ); // 7 días por defecto

  // Listas para selects
  const [trabajadores, setTrabajadores] = useState([]);
  const [clientes, setClientes] = useState([]);

  useEffect(() => {
    cargarListas();
  }, []);

  const cargarListas = async () => {
    try {
      const [trabData, cliData] = await Promise.all([
        trabajadoresApi.getActivos(api),
        clientesApi.getAll(api)
      ]);
      setTrabajadores(trabData);
      setClientes(cliData);
    } catch (err) {
      console.error('Error cargando listas:', err);
    }
  };

  const generarInforme = async () => {
    setLoading(true);
    setDatos(null);

    try {
      let resultado;

      switch (tipoInforme) {
        case 'estado-trabajadores':
          resultado = await informesApi.getEstadoTrabajadores(api, fecha);
          break;

        case 'horas-cliente':
          if (!clienteId) {
            alert('Selecciona un cliente');
            setLoading(false);
            return;
          }
          resultado = await informesApi.getHorasCliente(api, clienteId, mes, año);
          break;

        case 'resumen-ausencias':
          resultado = await informesApi.getResumenAusencias(api, mes, año);
          break;

        case 'calendario-empresa':
          if (!clienteId) {
            alert('Selecciona un cliente');
            setLoading(false);
            return;
          }
          resultado = await informesApi.getCalendarioEmpresa(api, clienteId, fecha, fechaFin || fecha);
          break;

        default:
          alert('Tipo de informe no válido');
          setLoading(false);
          return;
      }

      setDatos(resultado);

    } catch (err) {
      console.error('Error generando informe:', err);
      alert('Error al generar informe');
    } finally {
      setLoading(false);
    }
  };

  const volver = () => {
    setTipoInforme(null);
    setDatos(null);
    setTrabajadorId('');
    setClienteId('');
  };

  return {
    tipoInforme,
    setTipoInforme,
    loading,
    datos,
    fecha,
    setFecha,
    mes,
    setMes,
    año,
    setAño,
    trabajadorId,
    setTrabajadorId,
    clienteId,
    setClienteId,
    fechaFin,
    setFechaFin,
    trabajadores,
    clientes,
    generarInforme,
    volver
  };
}
