const prisma = require('../config/prisma');
const { calcularImporteAusencia } = require('../../utils/calcularImporteAusencia');
const { calcularPrecioHora } = require('../../utils/calcularPrecioHora');
const { calcularHorasNocturnas, esFestivo } = require('../../utils/calcularHoras');

// ============================================
// Matriz de trabajadores x dias con horas trabajadas
// ============================================
async function obtenerMatriz(mes, año) {
  if (!mes || !año) {
    throw { status: 400, error: 'Faltan parámetros: mes, año' };
  }

  // Calcular dias del mes
  const primerDia = new Date(parseInt(año), parseInt(mes) - 1, 1);
  const ultimoDia = new Date(parseInt(año), parseInt(mes), 0);
  const diasMes = ultimoDia.getDate();

  // Obtener trabajadores activos
  const trabajadores = await prisma.trabajador.findMany({
    where: { activo: true },
    include: {
      categoria: true,
      centrosAsignados: {
        include: {
          centro: true
        }
      },
      acuerdosIndividuales: {
        where: { activo: true },
        include: { centro: true }
      }
    },
    orderBy: { apellidos: 'asc' }
  });

  // Obtener asignaciones del mes
  const asignaciones = await prisma.asignacion.findMany({
    where: {
      fecha: {
        gte: primerDia,
        lte: ultimoDia
      },
      estado: { notIn: ['CANCELADO'] }
    },
    include: {
      centro: {
        include: { cliente: true }
      }
    }
  });

  // Obtener ausencias del mes (traer todas y filtrar despues)
  const todasAusencias = await prisma.ausencia.findMany({
    where: {
      estado: { in: ['APROBADA', 'PENDIENTE'] },
      fechaInicio: { lte: ultimoDia }
    },
    include: {
      tipoAusencia: true
    }
  });

  // Filtrar: las que tienen fechaFin >= primerDia O fechaFin = null
  const ausencias = todasAusencias.filter(a => {
    if (!a.fechaFin) return true;
    return new Date(a.fechaFin) >= primerDia;
  });

  // Construir matriz
  const matriz = trabajadores.map(trabajador => {
    const dias = {};

    for (let dia = 1; dia <= diasMes; dia++) {
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, dia);
      const fechaStr = fecha.toISOString().split('T')[0];

      // Buscar asignaciones de ese dia (comparar año/mes/dia directamente)
      const asigsDia = asignaciones.filter(a => {
        if (a.trabajadorId !== trabajador.id) return false;
        const asigFecha = new Date(a.fecha);
        return asigFecha.getFullYear() === parseInt(año) &&
               asigFecha.getMonth() === parseInt(mes) - 1 &&
               asigFecha.getDate() === dia;
      });

      // Buscar ausencia de ese dia (maneja ausencias sin fecha fin)
      const ausenciaDia = ausencias.find(a => {
        if (a.trabajadorId !== trabajador.id) return false;

        const inicio = new Date(a.fechaInicio);
        inicio.setHours(0, 0, 0, 0);

        if (!a.fechaFin) {
          return fecha >= inicio;
        }

        const fin = new Date(a.fechaFin);
        fin.setHours(23, 59, 59, 999);

        return fecha >= inicio && fecha <= fin;
      });

      if (ausenciaDia) {
        dias[dia] = {
          tipo: 'AUSENCIA',
          codigo: ausenciaDia.tipoAusencia.codigo,
          nombre: ausenciaDia.tipoAusencia.nombre,
          color: ausenciaDia.tipoAusencia.colorHex,
          estado: ausenciaDia.estado,
          estado: ausenciaDia.estado,
          horas: 0,
          editable: false
        };
      } else if (asigsDia.length > 0) {
        let horasTotales = 0;
        const centros = [];

        asigsDia.forEach(asig => {
          const [hi, mi] = asig.horaInicio.split(':').map(Number);
          const [hf, mf] = asig.horaFin.split(':').map(Number);
          let horas = (hf + mf / 60) - (hi + mi / 60);
          if (horas < 0) horas += 24;

          horasTotales += horas;
          centros.push({
            id: asig.centro.id,
            nombre: asig.centro.nombre,
            cliente: asig.centro.cliente?.nombre,
            horas: horas.toFixed(2)
          });
        });

        const tieneManuales = asigsDia.some(a => a.origen === 'MANUAL');
        const notasManuales = asigsDia.find(a => a.notas)?.notas || '';

        dias[dia] = {
          tipo: 'TRABAJO',
          horas: parseFloat(horasTotales.toFixed(2)),
          centros: centros,
          editable: true,
          esManual: tieneManuales,
          notas: notasManuales
        };
      } else {
        dias[dia] = {
          tipo: 'LIBRE',
          horas: 0,
          editable: true,
          notas: ''
        };
      }
    }

    // Calcular totales del mes
    let totalHoras = 0;
    Object.values(dias).forEach(dia => {
      if (dia.tipo === 'TRABAJO') {
        totalHoras += dia.horas + (dia.ajusteManual || 0);
      }
    });

    return {
      trabajador: {
        id: trabajador.id,
        codigo: trabajador.id.toString().padStart(3, '0'),
        nombre: trabajador.nombre,
        apellidos: trabajador.apellidos,
        categoria: trabajador.categoria.nombre,
        codigoContrato: trabajador.tipoContrato,
        horasContrato: parseFloat(trabajador.horasContrato),
        horasSemanales: parseFloat(trabajador.horasContrato),
        horasAnuales: parseFloat(trabajador.horasContrato) * 52,
        porcentajeJornada: ((parseFloat(trabajador.horasContrato) / 40) * 100).toFixed(0),
        centrosDelMes: [...new Set(
          asignaciones
            .filter(a => a.trabajadorId === trabajador.id)
            .map(a => a.centro.nombre)
        )].join(', ') || 'Sin asignaciones'
      },
      dias: dias,
      totales: {
        horasTrabajadas: parseFloat(totalHoras.toFixed(2)),
        horasContrato: parseFloat(trabajador.horasContrato) * 4.33,
        diferencia: parseFloat((totalHoras - parseFloat(trabajador.horasContrato) * 4.33).toFixed(2))
      }
    };
  });

  return {
    periodo: {
      mes: parseInt(mes),
      año: parseInt(año),
      diasMes: diasMes
    },
    trabajadores: matriz
  };
}

// ============================================
// Control de horas con calculo de nomina detallado
// ============================================
async function obtenerNomina(mes, año, trabajadorId) {
  if (!mes || !año) {
    throw { status: 400, error: 'Faltan parámetros: mes, año' };
  }

  // Calcular dias del mes
  const primerDia = new Date(parseInt(año), parseInt(mes) - 1, 1);
  const ultimoDia = new Date(parseInt(año), parseInt(mes), 0);
  const diasMes = ultimoDia.getDate();

  // Obtener trabajador especifico o todos
  const whereClause = { activo: true };
  if (trabajadorId) {
    whereClause.id = parseInt(trabajadorId);
  }

  const trabajadores = await prisma.trabajador.findMany({
    where: whereClause,
    include: {
      categoria: true,
      acuerdosIndividuales: {
        where: { activo: true }
      }
    },
    orderBy: { apellidos: 'asc' }
  });

  // Obtener asignaciones del mes
  const asignaciones = await prisma.asignacion.findMany({
    where: {
      fecha: {
        gte: primerDia,
        lte: ultimoDia
      },
      estado: { notIn: ['CANCELADO'] },
      ...(trabajadorId && { trabajadorId: parseInt(trabajadorId) })
    },
    include: {
      centro: {
        include: { cliente: true }
      }
    }
  });

  // Solo ausencias APROBADAS
  const ausencias = await prisma.ausencia.findMany({
    where: {
      estado: 'APROBADA',
      fechaInicio: { lte: ultimoDia },
      fechaFin: { gte: primerDia },
      ...(trabajadorId && { trabajadorId: parseInt(trabajadorId) })
    },
    include: {
      tipoAusencia: true
    }
  });

  // Construir matriz con calculos de nomina
  const matriz = [];
  for (const trabajador of trabajadores) {
    const dias = {};
    let totalBruto = 0;

    // Pre-calcular ausencias: obtener importe exacto por dia con turno
    const trabajadorAusencias = ausencias.filter(a => a.trabajadorId === trabajador.id);
    const ausenciaImportesPorDia = {};
    for (const aus of trabajadorAusencias) {
      const calculo = await calcularImporteAusencia(trabajador, aus);
      if (calculo.desglosePorDia) {
        calculo.desglosePorDia.forEach(d => {
          ausenciaImportesPorDia[d.fecha] = d.importeBruto;
        });
      }
    }

    for (let dia = 1; dia <= diasMes; dia++) {
      const fecha = new Date(parseInt(año), parseInt(mes) - 1, dia);

      // Buscar asignaciones de ese dia
      const asigsDia = asignaciones.filter(a => {
        if (a.trabajadorId !== trabajador.id) return false;
        const asigFecha = new Date(a.fecha);
        return asigFecha.getFullYear() === parseInt(año) &&
               asigFecha.getMonth() === parseInt(mes) - 1 &&
               asigFecha.getDate() === dia;
      });

      // Comparacion fechas normalizada
      const ausenciaDia = ausencias.find(a => {
        if (a.trabajadorId !== trabajador.id) return false;

        const inicioA = new Date(a.fechaInicio);
        const finA = new Date(a.fechaFin);
        const fechaActual = new Date(parseInt(año), parseInt(mes) - 1, dia);

        inicioA.setHours(0, 0, 0, 0);
        finA.setHours(0, 0, 0, 0);
        fechaActual.setHours(0, 0, 0, 0);

        return fechaActual >= inicioA && fechaActual <= finA;
      });

      if (ausenciaDia) {
        // DIA CON AUSENCIA - Buscar importe exacto de este dia
        const fechaStr = `${parseInt(año)}-${String(parseInt(mes)).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
        const importeDia = ausenciaImportesPorDia[fechaStr] || 0;

        dias[dia] = {
          tipo: 'AUSENCIA',
          codigo: ausenciaDia.tipoAusencia.codigo,
          nombre: ausenciaDia.tipoAusencia.nombre,
          color: ausenciaDia.tipoAusencia.colorHex,
          porcentajeCobro: parseFloat(ausenciaDia.tipoAusencia.porcentajeCobro),
          importeDia: parseFloat(importeDia.toFixed(2)),
          desglose: {
            horasNormales: 0,
            horasNocturnas: 0,
            horasFestivas: 0,
            horasExtra15: 0,
            horasExtra20: 0
          }
        };

        totalBruto += importeDia;

      } else if (asigsDia.length > 0) {
        // DIA CON TRABAJO - Calcular horas y precios
        let horasTotales = 0;
        let horasNormales = 0;
        let horasNocturnas = 0;
        let horasFestivas = 0;
        let importeDia = 0;

        const esDiaFestivo = await esFestivo(fecha);
        const centros = [];

        asigsDia.forEach(asig => {
          const [hi, mi] = asig.horaInicio.split(':').map(Number);
          const [hf, mf] = asig.horaFin.split(':').map(Number);
          let horas = (hf + mf / 60) - (hi + mi / 60);
          if (horas < 0) horas += 24;

          const horasNoctTurno = calcularHorasNocturnas(asig.horaInicio, asig.horaFin);
          const horasDiurnas = horas - horasNoctTurno;

          horasTotales += horas;

          if (esDiaFestivo) {
            horasFestivas += horas;
            const precioFestiva = calcularPrecioHora(trabajador, asig.centroId, 'FESTIVA');
            importeDia += horas * precioFestiva;
          } else if (horasNoctTurno > 0) {
            horasNocturnas += horasNoctTurno;
            horasNormales += horasDiurnas;
            const precioNocturna = calcularPrecioHora(trabajador, asig.centroId, 'NOCTURNA');
            const precioNormal = calcularPrecioHora(trabajador, asig.centroId, 'NORMAL');
            importeDia += (horasNoctTurno * precioNocturna) + (horasDiurnas * precioNormal);
          } else {
            horasNormales += horas;
            const precioNormal = calcularPrecioHora(trabajador, asig.centroId, 'NORMAL');
            importeDia += horas * precioNormal;
          }

          centros.push({
            id: asig.centro.id,
            nombre: asig.centro.nombre,
            cliente: asig.centro.cliente?.nombre,
            horas: horas.toFixed(2)
          });
        });

        dias[dia] = {
          tipo: 'TRABAJO',
          horas: parseFloat(horasTotales.toFixed(2)),
          centros: centros,
          importeDia: parseFloat(importeDia.toFixed(2)),
          desglose: {
            horasNormales: parseFloat(horasNormales.toFixed(2)),
            horasNocturnas: parseFloat(horasNocturnas.toFixed(2)),
            horasFestivas: parseFloat(horasFestivas.toFixed(2)),
            horasExtra15: 0, // TODO: Calcular extras
            horasExtra20: 0
          }
        };

        totalBruto += importeDia;

      } else {
        // DIA LIBRE
        dias[dia] = {
          tipo: 'LIBRE',
          horas: 0,
          importeDia: 0,
          desglose: {
            horasNormales: 0,
            horasNocturnas: 0,
            horasFestivas: 0,
            horasExtra15: 0,
            horasExtra20: 0
          }
        };
      }
    }

    // Calcular totales del mes
    let totalHorasNormales = 0;
    let totalHorasNocturnas = 0;
    let totalHorasFestivas = 0;

    Object.values(dias).forEach(dia => {
      if (dia.desglose) {
        totalHorasNormales += dia.desglose.horasNormales;
        totalHorasNocturnas += dia.desglose.horasNocturnas;
        totalHorasFestivas += dia.desglose.horasFestivas;
      }
    });

    matriz.push({
      trabajador: {
        id: trabajador.id,
        codigo: trabajador.id.toString().padStart(3, '0'),
        nombre: trabajador.nombre,
        apellidos: trabajador.apellidos,
        categoria: trabajador.categoria.nombre,
        horasContrato: parseFloat(trabajador.horasContrato),
        horasSemanales: parseFloat(trabajador.horasContrato),
        horasAnuales: parseFloat(trabajador.horasContrato) * 52,
        porcentajeJornada: ((parseFloat(trabajador.horasContrato) / 40) * 100).toFixed(0)
      },
      dias: dias,
      totales: {
        horasNormales: parseFloat(totalHorasNormales.toFixed(2)),
        horasNocturnas: parseFloat(totalHorasNocturnas.toFixed(2)),
        horasFestivas: parseFloat(totalHorasFestivas.toFixed(2)),
        horasExtra15: 0,
        horasExtra20: 0,
        importeBruto: parseFloat(totalBruto.toFixed(2))
      }
    });
  }

  return {
    periodo: {
      mes: parseInt(mes),
      año: parseInt(año),
      diasMes: diasMes
    },
    trabajadores: matriz
  };
}

module.exports = {
  obtenerMatriz,
  obtenerNomina
};
