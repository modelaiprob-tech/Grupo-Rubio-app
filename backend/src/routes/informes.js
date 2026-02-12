// ============================================
// RUTAS: INFORMES
// ============================================
const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
const { calcularTotalHoras, calcularHorasNocturnas } = require('../../utils/calcularHoras');

/**
 * Utilidad: Obtener número de semana del año
 */
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// ============================================
// GET /api/informes/estado-trabajadores
// ============================================
router.get('/estado-trabajadores', async (req, res) => {
  try {
    const { fecha } = req.query;

    if (!fecha) {
      return res.status(400).json({ error: 'Falta parámetro: fecha' });
    }

    const [año, mes, dia] = fecha.split('-').map(Number);
    const fechaObj = new Date(año, mes - 1, dia, 12, 0, 0, 0);

    const trabajadoresActivos = await prisma.trabajador.findMany({
      where: { activo: true },
      include: { categoria: true }
    });

    const ausencias = await prisma.ausencia.findMany({
      where: {
        fechaInicio: { lte: fechaObj },
        fechaFin: { gte: fechaObj }
      },
      include: { trabajador: true, tipoAusencia: true }
    });

    const ausenciasPorEstado = {
      APROBADA: ausencias.filter(a => a.estado === 'APROBADA'),
      PENDIENTE: ausencias.filter(a => a.estado === 'PENDIENTE')
    };

    const tiposBajaMedica = ['baja médica', 'accidente laboral', 'hospitalización familiar', 'acompañamiento oncológico'];

    const bajasMedicas = ausenciasPorEstado.APROBADA.filter(a => {
      const nombreTipo = a.tipoAusencia.nombre.toLowerCase();
      return tiposBajaMedica.some(tipo => nombreTipo.includes(tipo));
    });

    const vacaciones = ausenciasPorEstado.APROBADA.filter(a =>
      a.tipoAusencia.nombre.toLowerCase().includes('vacacion')
    );

    const otrosPermisos = ausenciasPorEstado.APROBADA.filter(a => {
      const nombreTipo = a.tipoAusencia.nombre.toLowerCase();
      const esBajaMedica = tiposBajaMedica.some(tipo => nombreTipo.includes(tipo));
      const esVacaciones = nombreTipo.includes('vacacion');
      return !esBajaMedica && !esVacaciones;
    });

    const trabajadoresConAusencia = new Set(ausenciasPorEstado.APROBADA.map(a => a.trabajadorId));
    const disponibles = trabajadoresActivos.length - trabajadoresConAusencia.size;

    const calcularDiasTotales = (fechaInicio, fechaFin) => {
      const inicio = new Date(fechaInicio);
      const fin = new Date(fechaFin);
      const diferencia = fin.getTime() - inicio.getTime();
      return Math.ceil(diferencia / (1000 * 60 * 60 * 24)) + 1;
    };

    const mapAusencia = (item) => ({
      trabajador: { id: item.trabajador.id, nombre: item.trabajador.nombre, apellidos: item.trabajador.apellidos },
      tipoAusencia: { nombre: item.tipoAusencia.nombre },
      fechaInicio: item.fechaInicio.toISOString().split('T')[0],
      fechaFin: item.fechaFin.toISOString().split('T')[0],
      diasTotales: calcularDiasTotales(item.fechaInicio, item.fechaFin),
      motivo: item.motivo
    });

    res.json({
      fecha: fechaObj.toISOString().split('T')[0],
      resumen: {
        totalActivos: trabajadoresActivos.length,
        disponibles,
        enBajaMedica: bajasMedicas.length,
        enVacaciones: vacaciones.length,
        conPermisos: otrosPermisos.length,
        pendientesAprobacion: ausenciasPorEstado.PENDIENTE.length
      },
      detalles: {
        bajasMedicas: bajasMedicas.map(mapAusencia),
        vacaciones: vacaciones.map(mapAusencia),
        otrosPermisos: otrosPermisos.map(mapAusencia),
        pendientesAprobacion: ausenciasPorEstado.PENDIENTE.map(mapAusencia)
      }
    });

  } catch (error) {
    console.error('Error en informe estado trabajadores:', error);
    res.status(500).json({ error: 'Error generando informe' });
  }
});

// ============================================
// GET /api/informes/horas-trabajador
// ============================================
router.get('/horas-trabajador', async (req, res) => {
  try {
    const { trabajadorId, mes, año } = req.query;

    if (!trabajadorId || !mes || !año) {
      return res.status(400).json({ error: 'Faltan parámetros: trabajadorId, mes, año' });
    }

    const { calcularPrecioHora } = require('../../utils/calcularPrecioHora');

    const trabajador = await prisma.trabajador.findUnique({
      where: { id: parseInt(trabajadorId) },
      include: {
        categoria: true,
        acuerdosIndividuales: {
          where: { activo: true },
          include: { centro: true }
        }
      }
    });

    if (!trabajador) {
      return res.status(404).json({ error: 'Trabajador no encontrado' });
    }

    const inicioMes = new Date(parseInt(año), parseInt(mes) - 1, 1);
    const finMes = new Date(parseInt(año), parseInt(mes), 0, 23, 59, 59, 999);

    const festivos = await prisma.festivo.findMany({
      where: { fecha: { gte: inicioMes, lte: finMes } }
    });
    const fechasFestivas = new Set(festivos.map(f => f.fecha.toISOString().split('T')[0]));

    const asignaciones = await prisma.asignacion.findMany({
      where: {
        trabajadorId: parseInt(trabajadorId),
        fecha: { gte: inicioMes, lte: finMes },
        estado: { notIn: ['CANCELADO'] }
      },
      include: { centro: { include: { cliente: true } } },
      orderBy: [{ fecha: 'asc' }, { horaInicio: 'asc' }]
    });

    if (asignaciones.length === 0) {
      return res.json({
        trabajador: {
          id: trabajador.id,
          nombre: `${trabajador.nombre} ${trabajador.apellidos}`,
          categoria: trabajador.categoria.nombre,
          horasContrato: parseFloat(trabajador.horasContrato)
        },
        periodo: {
          mes: parseInt(mes),
          año: parseInt(año),
          mesNombre: new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' })
        },
        totales: { horasNormales: 0, horasExtras: 0, horasNocturnas: 0, horasFestivas: 0, totalHoras: 0, importeTotal: 0 },
        desgloseSemanal: {},
        detallesDias: []
      });
    }

    const asignacionesPorSemana = {};
    asignaciones.forEach(asig => {
      const semana = getWeekNumber(new Date(asig.fecha));
      if (!asignacionesPorSemana[semana]) asignacionesPorSemana[semana] = [];
      asignacionesPorSemana[semana].push(asig);
    });

    let totalNormales = 0, totalExtras = 0, totalNocturnas = 0, totalFestivas = 0, importeTotal = 0;
    const detallesDias = [];
    const semanas = {};

    for (const [numSemana, asignacionesSemana] of Object.entries(asignacionesPorSemana)) {
      let horasAcumuladasSemana = 0;

      for (const asig of asignacionesSemana) {
        const fechaAsig = asig.fecha.toISOString().split('T')[0];
        const esFestivoODomingo = fechasFestivas.has(fechaAsig) || new Date(asig.fecha).getDay() === 0;

        const totalHoras = calcularTotalHoras(asig.horaInicio, asig.horaFin);
        const horasNocturnas = calcularHorasNocturnas(asig.horaInicio, asig.horaFin);

        const horasContrato = parseFloat(trabajador.horasContrato);
        const horasAcumuladas = horasAcumuladasSemana + totalHoras;

        let horasNormales = 0, horasExtra = 0;
        if (horasAcumuladas <= horasContrato) {
          horasNormales = totalHoras;
        } else if (horasAcumuladasSemana >= horasContrato) {
          horasExtra = totalHoras;
        } else {
          horasNormales = horasContrato - horasAcumuladasSemana;
          horasExtra = totalHoras - horasNormales;
        }

        const horasFestivo = esFestivoODomingo ? totalHoras : 0;

        const tipo = esFestivoODomingo ? 'FESTIVA' : (horasNocturnas > 0 ? 'NOCTURNA' : 'NORMAL');
        const precioNormal = calcularPrecioHora(trabajador, asig.centroId, tipo);
        const precioExtra = calcularPrecioHora(trabajador, asig.centroId, 'EXTRA');

        const importeNormales = horasNormales * precioNormal;
        const importeExtras = horasExtra * precioExtra;
        const importeDia = importeNormales + importeExtras;

        totalNormales += horasNormales;
        totalExtras += horasExtra;
        totalNocturnas += horasNocturnas;
        totalFestivas += horasFestivo;
        importeTotal += importeDia;

        detallesDias.push({
          fecha: fechaAsig,
          centro: asig.centro?.nombre || 'Sin centro',
          cliente: asig.centro?.cliente?.nombre || 'Sin cliente',
          horasNormales: parseFloat(horasNormales.toFixed(2)),
          horasExtras: parseFloat(horasExtra.toFixed(2)),
          horasNocturnas: parseFloat(horasNocturnas.toFixed(2)),
          horasFestivas: parseFloat(horasFestivo.toFixed(2)),
          importe: parseFloat(importeDia.toFixed(2))
        });

        const key = `Semana ${numSemana}`;
        if (!semanas[key]) {
          semanas[key] = { normales: 0, extras: 0, nocturnas: 0, festivas: 0, total: 0, importe: 0 };
        }
        semanas[key].normales += horasNormales;
        semanas[key].extras += horasExtra;
        semanas[key].nocturnas += horasNocturnas;
        semanas[key].festivas += horasFestivo;
        semanas[key].total += totalHoras;
        semanas[key].importe += importeDia;

        horasAcumuladasSemana = horasAcumuladas;
      }
    }

    res.json({
      trabajador: {
        id: trabajador.id,
        nombre: `${trabajador.nombre} ${trabajador.apellidos}`,
        categoria: trabajador.categoria.nombre,
        horasContrato: parseFloat(trabajador.horasContrato)
      },
      periodo: {
        mes: parseInt(mes),
        año: parseInt(año),
        mesNombre: new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' })
      },
      totales: {
        horasNormales: parseFloat(totalNormales.toFixed(2)),
        horasExtras: parseFloat(totalExtras.toFixed(2)),
        horasNocturnas: parseFloat(totalNocturnas.toFixed(2)),
        horasFestivas: parseFloat(totalFestivas.toFixed(2)),
        totalHoras: parseFloat((totalNormales + totalExtras).toFixed(2)),
        importeTotal: parseFloat(importeTotal.toFixed(2))
      },
      desgloseSemanal: Object.keys(semanas).map(key => ({
        semana: key,
        ...semanas[key],
        importe: parseFloat(semanas[key].importe.toFixed(2))
      })),
      detallesDias
    });

  } catch (error) {
    console.error('Error en informe horas trabajador:', error);
    res.status(500).json({ error: 'Error generando informe' });
  }
});

// ============================================
// GET /api/informes/horas-cliente
// ============================================
router.get('/horas-cliente', async (req, res) => {
  try {
    const { clienteId, mes, año } = req.query;

    if (!clienteId || !mes || !año) {
      return res.status(400).json({ error: 'Faltan parámetros: clienteId, mes, año' });
    }

    const { calcularPrecioHora } = require('../../utils/calcularPrecioHora');

    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) },
      include: { centrosTrabajo: true }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const inicioMes = new Date(parseInt(año), parseInt(mes) - 1, 1);
    const finMes = new Date(parseInt(año), parseInt(mes), 0);
    const centrosIds = cliente.centrosTrabajo.map(c => c.id);

    const festivos = await prisma.festivo.findMany({
      where: { fecha: { gte: inicioMes, lte: finMes } }
    });
    const fechasFestivas = new Set(festivos.map(f => f.fecha.toISOString().split('T')[0]));

    const asignaciones = await prisma.asignacion.findMany({
      where: {
        centroId: { in: centrosIds },
        fecha: { gte: inicioMes, lte: finMes },
        estado: { notIn: ['CANCELADO'] }
      },
      include: {
        centro: true,
        trabajador: {
          include: {
            categoria: true,
            acuerdosIndividuales: {
              where: { activo: true },
              include: { centro: true }
            }
          }
        },
        registroHoras: true
      }
    });

    const porCentro = {};
    let totalHorasCliente = 0;
    let totalCoste = 0;

    asignaciones.forEach(asig => {
      const centroNombre = asig.centro.nombre;
      const fechaAsig = asig.fecha.toISOString().split('T')[0];
      const esFestivoFlag = fechasFestivas.has(fechaAsig);

      if (!porCentro[centroNombre]) {
        porCentro[centroNombre] = {
          centroId: asig.centro.id,
          totalHoras: 0, horasNormales: 0, horasExtras: 0, horasNocturnas: 0, horasFestivas: 0, costeTotal: 0
        };
      }

      const registro = asig.registroHoras;
      if (registro) {
        const horasNormalesReg = parseFloat(registro.horasNormales);
        const horasExtraReg = parseFloat(registro.horasExtra);
        const horasNocturnasReg = parseFloat(registro.horasNocturnas);
        const horasFestivasReg = parseFloat(registro.horasFestivo);

        const precioNormal = calcularPrecioHora(asig.trabajador, asig.centroId, esFestivoFlag ? 'FESTIVA' : 'NORMAL');
        const precioNocturna = calcularPrecioHora(asig.trabajador, asig.centroId, 'NOCTURNA');
        const precioExtra = calcularPrecioHora(asig.trabajador, asig.centroId, 'EXTRA');

        const coste = (horasNormalesReg * precioNormal) + (horasNocturnasReg * precioNocturna) + (horasExtraReg * precioExtra);

        porCentro[centroNombre].totalHoras += (horasNormalesReg + horasExtraReg);
        porCentro[centroNombre].horasNormales += horasNormalesReg;
        porCentro[centroNombre].horasExtras += horasExtraReg;
        porCentro[centroNombre].horasNocturnas += horasNocturnasReg;
        porCentro[centroNombre].horasFestivas += horasFestivasReg;
        porCentro[centroNombre].costeTotal += coste;

        totalHorasCliente += (horasNormalesReg + horasExtraReg);
        totalCoste += coste;
      } else {
        const [horaInicioH, horaInicioM] = asig.horaInicio.split(':').map(Number);
        const [horaFinH, horaFinM] = asig.horaFin.split(':').map(Number);

        let horas = (horaFinH + horaFinM / 60) - (horaInicioH + horaInicioM / 60);
        if (horas < 0) horas += 24;

        const esNocturna = horaInicioH >= 23 || horaFinH <= 6;
        const tipo = esFestivoFlag ? 'FESTIVA' : (esNocturna ? 'NOCTURNA' : 'NORMAL');
        const precio = calcularPrecioHora(asig.trabajador, asig.centroId, tipo);
        const coste = horas * precio;

        porCentro[centroNombre].totalHoras += horas;
        if (esFestivoFlag) {
          porCentro[centroNombre].horasFestivas += horas;
        } else if (esNocturna) {
          porCentro[centroNombre].horasNocturnas += horas;
        } else {
          porCentro[centroNombre].horasNormales += horas;
        }
        porCentro[centroNombre].costeTotal += coste;

        totalHorasCliente += horas;
        totalCoste += coste;
      }
    });

    res.json({
      cliente: { id: cliente.id, nombre: cliente.nombre, cif: cliente.cif },
      periodo: {
        mes: parseInt(mes),
        año: parseInt(año),
        mesNombre: new Date(parseInt(año), parseInt(mes) - 1).toLocaleDateString('es-ES', { month: 'long' })
      },
      totales: {
        totalHoras: parseFloat(totalHorasCliente.toFixed(2)),
        costeTotal: parseFloat(totalCoste.toFixed(2))
      },
      desglosePorCentro: Object.keys(porCentro).map(nombre => ({
        centro: nombre,
        ...porCentro[nombre],
        totalHoras: parseFloat(porCentro[nombre].totalHoras.toFixed(2)),
        horasNormales: parseFloat(porCentro[nombre].horasNormales.toFixed(2)),
        horasExtras: parseFloat(porCentro[nombre].horasExtras.toFixed(2)),
        horasNocturnas: parseFloat(porCentro[nombre].horasNocturnas.toFixed(2)),
        horasFestivas: parseFloat(porCentro[nombre].horasFestivas.toFixed(2)),
        costeTotal: parseFloat(porCentro[nombre].costeTotal.toFixed(2))
      }))
    });

  } catch (error) {
    console.error('Error en informe horas cliente:', error);
    res.status(500).json({ error: 'Error generando informe' });
  }
});

// ============================================
// GET /api/informes/calendario-empresa
// ============================================
router.get('/calendario-empresa', async (req, res) => {
  try {
    const { clienteId, fechaInicio, fechaFin } = req.query;

    if (!clienteId || !fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        error: 'Faltan parámetros: clienteId, fechaInicio, fechaFin' 
      });
    }

    // 1. Obtener todos los centros del cliente
    const centros = await prisma.centroTrabajo.findMany({
      where: { 
        clienteId: parseInt(clienteId),
        activo: true
      },
      include: {
        cliente: true
      }
    });

    const centroIds = centros.map(c => c.id);

    if (centroIds.length === 0) {
      return res.json({
        cliente: null,
        fechaInicio,
        fechaFin,
        fechas: [],
        trabajadores: []
      });
    }

    // 2. Obtener todas las asignaciones del periodo EN ESOS CENTROS
    const asignaciones = await prisma.asignacion.findMany({
      where: {
        centroId: { in: centroIds },
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        },
        estado: { not: 'CANCELADO' }
      },
      include: {
        trabajador: true,
        centro: true
      }
    });

    // 🔥 3. Obtener IDs únicos de trabajadores que trabajan en esos centros
    const trabajadorIds = [...new Set(asignaciones.map(a => a.trabajadorId))];

    if (trabajadorIds.length === 0) {
      return res.json({
        cliente: centros[0]?.cliente || null,
        fechaInicio,
        fechaFin,
        fechas: [],
        trabajadores: []
      });
    }

    // 🔥 4. Obtener SOLO trabajadores que trabajan en este cliente
    const trabajadores = await prisma.trabajador.findMany({
      where: {
        id: { in: trabajadorIds },
        activo: true
      },
      orderBy: [
        { apellidos: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // 🔥 5. Obtener ausencias SOLO de esos trabajadores
    const ausencias = await prisma.ausencia.findMany({
      where: {
        trabajadorId: { in: trabajadorIds },
        fechaInicio: { lte: new Date(fechaFin) },
        fechaFin: { gte: new Date(fechaInicio) },
        estado: { in: ['APROBADA', 'PENDIENTE'] }
      },
      include: {
        tipoAusencia: true
      }
    });

    // 6. Generar array de fechas
    const fechas = [];
    const currentDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    
    while (currentDate <= endDate) {
      fechas.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 7. Construir la matriz
    const matriz = trabajadores.map(trabajador => {
      const fila = {
        trabajadorId: trabajador.id,
        nombre: trabajador.nombre,
        apellidos: trabajador.apellidos,
        dias: {}
      };

      fechas.forEach(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Verificar ausencias
        const ausencia = ausencias.find(a => {
          const inicioAusencia = new Date(a.fechaInicio);
          const finAusencia = a.fechaAltaReal 
            ? new Date(a.fechaAltaReal) 
            : new Date(a.fechaFin);
          
          return a.trabajadorId === trabajador.id &&
            inicioAusencia <= fecha &&
            finAusencia >= fecha;
        });

        if (ausencia) {
          // Hay ausencia
          const tipoAusencia = ausencia.tipoAusencia?.nombre?.toLowerCase() || '';
          let codigo = 'A';
          let color = 'rojo';
          
          if (tipoAusencia.includes('vacacion')) {
            codigo = 'V';
            color = 'azul';
          } else if (tipoAusencia.includes('baja') || tipoAusencia.includes('médica') || tipoAusencia.includes('medica')) {
            codigo = 'BM';
            color = 'rojo';
          }

          if (ausencia.estado === 'PENDIENTE') {
            codigo = 'BP';
            color = 'amarillo';
          }
          
          fila.dias[fechaStr] = {
            codigo,
            estado: ausencia.estado,
            tipo: ausencia.tipoAusencia?.nombre || 'Ausencia',
            color
          };
        } else {
          // Verificar si trabaja ese día
          const asignacionesDia = asignaciones.filter(a =>
            a.trabajadorId === trabajador.id &&
            a.fecha.toISOString().split('T')[0] === fechaStr
          );

          // Ordenar por hora de inicio
          asignacionesDia.sort((a, b) => {
            const horaA = a.horaInicio.split(':').map(Number);
            const horaB = b.horaInicio.split(':').map(Number);
            return (horaA[0] * 60 + horaA[1]) - (horaB[0] * 60 + horaB[1]);
          });

          if (asignacionesDia.length > 0) {
            // Combinar todos los horarios
            const horarios = asignacionesDia
              .map(a => `${a.horaInicio}-${a.horaFin}`)
              .join('\n');
            
            const centros = [...new Set(asignacionesDia.map(a => a.centro.nombre))].join(', ');

            fila.dias[fechaStr] = {
              codigo: 'X',
              estado: 'TRABAJA',
              centro: centros,
              horario: horarios,
              color: 'verde'
            };
          } else {
            // No trabaja, no tiene ausencia
            fila.dias[fechaStr] = {
              codigo: '-',
              estado: 'LIBRE',
              color: ''
            };
          }
        }
      });

      return fila;
    });

    res.json({
      cliente: centros[0]?.cliente || null,
      fechaInicio,
      fechaFin,
      fechas: fechas.map(f => f.toISOString().split('T')[0]),
      trabajadores: matriz
    });

  } catch (error) {
    console.error('Error en calendario-empresa:', error);
    res.status(500).json({ error: 'Error al generar calendario' });
  }
});

module.exports = router;
 
