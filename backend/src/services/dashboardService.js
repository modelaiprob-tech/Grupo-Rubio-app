const prisma = require('../config/prisma');

// ============================================
// Estadisticas generales del dashboard
// ============================================
async function obtenerStats() {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const [trabajadoresActivos, trabajadoresEnBaja, turnosHoy, clientesActivos, ausenciasPendientes] = await Promise.all([
    prisma.trabajador.count({ where: { activo: true } }),
    prisma.ausencia.count({
      where: {
        estado: 'APROBADA',
        tipoAusencia: { codigo: 'BM' },
        fechaInicio: { lte: hoy },
        fechaFin: { gte: hoy }
      }
    }),
    prisma.asignacion.count({ where: { fecha: hoy } }),
    prisma.cliente.count({ where: { activo: true } }),
    prisma.ausencia.count({ where: { estado: 'PENDIENTE' } })
  ]);

  return {
    trabajadoresActivos,
    trabajadoresEnBaja,
    turnosHoy,
    clientesActivos,
    ausenciasPendientes
  };
}

// ============================================
// Centros sin cubrir esta semana
// ============================================
async function obtenerCentrosSinCubrir() {
  const hoy = new Date();
  const inicioDia = new Date(hoy);
  inicioDia.setHours(0, 0, 0, 0);

  const finSemana = new Date(hoy);
  const diasHastaFinSemana = 7 - hoy.getDay();
  finSemana.setDate(hoy.getDate() + diasHastaFinSemana);
  finSemana.setHours(23, 59, 59, 999);

  const centros = await prisma.centroTrabajo.findMany({
    where: { activo: true },
    include: { cliente: true }
  });

  const centrosSinCubrir = [];

  for (const centro of centros) {
    const tempDate = new Date(inicioDia);
    while (tempDate <= finSemana) {
      const diaSemana = tempDate.getDay();

      if (diaSemana !== 0 && diaSemana !== 6) {
        const iniciodia = new Date(tempDate);
        iniciodia.setHours(0, 0, 0, 0);
        const findia = new Date(tempDate);
        findia.setHours(23, 59, 59, 999);

        const asignaciones = await prisma.asignacion.count({
          where: {
            centroId: centro.id,
            fecha: { gte: iniciodia, lte: findia },
            estado: { not: 'CANCELADO' }
          }
        });

        if (asignaciones === 0) {
          centrosSinCubrir.push({
            centro: centro.nombre,
            cliente: centro.cliente?.nombre || 'Sin cliente',
            centroId: centro.id,
            fecha: tempDate.toISOString().split('T')[0],
            diaSemana: ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'][tempDate.getDay()],
            horario: `${centro.horarioLimpiezaInicio || centro.horarioApertura || '08:00'} - ${centro.horarioLimpiezaFin || centro.horarioCierre || '14:00'}`
          });
        }
      }

      tempDate.setDate(tempDate.getDate() + 1);
    }
  }

  return centrosSinCubrir;
}

// ============================================
// Dashboard ejecutivo con KPIs
// ============================================
async function obtenerEjecutivo(mes, año) {
  const mesActual = mes ? parseInt(mes) : new Date().getMonth() + 1;
  const añoActual = año ? parseInt(año) : new Date().getFullYear();

  const inicioMes = new Date(añoActual, mesActual - 1, 1);
  const finMes = new Date(añoActual, mesActual, 0);
  const inicioMesAnterior = new Date(añoActual, mesActual - 2, 1);
  const finMesAnterior = new Date(añoActual, mesActual - 1, 0);

  // 1. INGRESOS Y FACTURACION
  const registrosMes = await prisma.registroHoras.findMany({
    where: {
      fecha: { gte: inicioMes, lte: finMes },
      validado: true
    },
    include: {
      trabajador: { include: { categoria: true } },
      asignacion: { include: { centro: { include: { cliente: true } } } }
    }
  });

  const registrosMesAnterior = await prisma.registroHoras.findMany({
    where: {
      fecha: { gte: inicioMesAnterior, lte: finMesAnterior },
      validado: true
    },
    include: {
      trabajador: { include: { categoria: true } }
    }
  });

  let ingresosTotales = 0;
  let costeTotalTrabajadores = 0;
  let horasTotales = 0;

  registrosMes.forEach(reg => {
    const horas = parseFloat(reg.horasNormales) + parseFloat(reg.horasExtra);
    const precioHora = parseFloat(reg.trabajador.categoria.precioHora) || 0;
    const costeHora = parseFloat(reg.trabajador.categoria.salarioBase) / 160 || 0;

    ingresosTotales += horas * precioHora;
    costeTotalTrabajadores += horas * costeHora;
    horasTotales += horas;
  });

  let ingresosMesAnterior = 0;
  registrosMesAnterior.forEach(reg => {
    const horas = parseFloat(reg.horasNormales) + parseFloat(reg.horasExtra);
    const precioHora = parseFloat(reg.trabajador.categoria.precioHora) || 0;
    ingresosMesAnterior += horas * precioHora;
  });

  const margenBruto = ingresosTotales - costeTotalTrabajadores;
  const porcentajeMargen = ingresosTotales > 0 ? (margenBruto / ingresosTotales) * 100 : 0;
  const variacionIngresos = ingresosMesAnterior > 0
    ? ((ingresosTotales - ingresosMesAnterior) / ingresosMesAnterior) * 100
    : 0;

  // 2. UTILIZACION DE TRABAJADORES
  const trabajadoresActivos = await prisma.trabajador.count({ where: { activo: true } });
  const horasContratoTotales = await prisma.trabajador.aggregate({
    where: { activo: true },
    _sum: { horasContrato: true }
  });

  const horasDisponiblesEsteMes = (parseFloat(horasContratoTotales._sum.horasContrato) || 0) * 4.33;
  const utilizacion = horasDisponiblesEsteMes > 0 ? (horasTotales / horasDisponiblesEsteMes) * 100 : 0;

  // 3. TOP 5 CLIENTES POR FACTURACION
  const clientesMap = {};
  registrosMes.forEach(reg => {
    if (reg.asignacion?.centro?.cliente) {
      const clienteId = reg.asignacion.centro.cliente.id;
      const clienteNombre = reg.asignacion.centro.cliente.nombre;

      if (!clientesMap[clienteId]) {
        clientesMap[clienteId] = { nombre: clienteNombre, ingresos: 0, horas: 0 };
      }

      const horas = parseFloat(reg.horasNormales) + parseFloat(reg.horasExtra);
      const precioHora = parseFloat(reg.trabajador.categoria.precioHora) || 0;

      clientesMap[clienteId].ingresos += horas * precioHora;
      clientesMap[clienteId].horas += horas;
    }
  });

  const topClientes = Object.values(clientesMap)
    .sort((a, b) => b.ingresos - a.ingresos)
    .slice(0, 5)
    .map(c => ({
      nombre: c.nombre,
      ingresos: parseFloat(c.ingresos.toFixed(2)),
      horas: parseFloat(c.horas.toFixed(2))
    }));

  // 4. ALERTAS CRITICAS
  const alertasCriticas = [];
  const hoy = new Date();
  const en7Dias = new Date();
  en7Dias.setDate(hoy.getDate() + 7);

  const centrosActivos = await prisma.centroTrabajo.findMany({
    where: { activo: true },
    include: { cliente: true }
  });

  for (const centro of centrosActivos) {
    const asignacionesFuturas = await prisma.asignacion.count({
      where: {
        centroId: centro.id,
        fecha: { gte: hoy, lte: en7Dias },
        estado: { notIn: ['CANCELADO'] }
      }
    });

    if (asignacionesFuturas === 0) {
      alertasCriticas.push({
        tipo: 'COBERTURA',
        severidad: 'ALTA',
        mensaje: `${centro.cliente?.nombre} - ${centro.nombre}: Sin cobertura próximos 7 días`
      });
    }
  }

  // Trabajadores con exceso de horas semanales (>45h)
  const trabajadoresConExceso = await prisma.trabajador.findMany({
    where: { activo: true },
    select: { id: true, nombre: true, apellidos: true }
  });

  const lunes = new Date();
  lunes.setDate(hoy.getDate() - hoy.getDay() + 1);
  const domingo = new Date(lunes);
  domingo.setDate(lunes.getDate() + 6);

  for (const trab of trabajadoresConExceso) {
    const horasSemana = await prisma.registroHoras.aggregate({
      where: {
        trabajadorId: trab.id,
        fecha: { gte: lunes, lte: domingo }
      },
      _sum: { horasNormales: true, horasExtra: true }
    });

    const totalHoras = parseFloat(horasSemana._sum.horasNormales || 0) + parseFloat(horasSemana._sum.horasExtra || 0);
    if (totalHoras > 45) {
      alertasCriticas.push({
        tipo: 'LEGAL',
        severidad: 'CRÍTICA',
        mensaje: `${trab.nombre} ${trab.apellidos}: ${totalHoras.toFixed(1)}h esta semana (límite: 45h)`
      });
    }
  }

  // Clientes con horas extras excesivas (>30% del total)
  Object.entries(clientesMap).forEach(([clienteId, data]) => {
    const registrosCliente = registrosMes.filter(r =>
      r.asignacion?.centro?.cliente?.id === parseInt(clienteId)
    );

    let horasExtrasCliente = 0;
    let horasTotalesCliente = 0;

    registrosCliente.forEach(reg => {
      horasExtrasCliente += parseFloat(reg.horasExtra);
      horasTotalesCliente += parseFloat(reg.horasNormales) + parseFloat(reg.horasExtra);
    });

    const porcentajeExtras = horasTotalesCliente > 0 ? (horasExtrasCliente / horasTotalesCliente) * 100 : 0;

    if (porcentajeExtras > 30) {
      alertasCriticas.push({
        tipo: 'FINANCIERO',
        severidad: 'MEDIA',
        mensaje: `${data.nombre}: Horas extras ${porcentajeExtras.toFixed(1)}% (revisar contrato)`
      });
    }
  });

  // 5. EFICIENCIA OPERATIVA
  let horasExtrasTotales = 0;
  let horasNormalesTotales = 0;

  registrosMes.forEach(reg => {
    horasExtrasTotales += parseFloat(reg.horasExtra);
    horasNormalesTotales += parseFloat(reg.horasNormales);
  });

  const ratioHorasExtras = (horasNormalesTotales + horasExtrasTotales) > 0
    ? (horasExtrasTotales / (horasNormalesTotales + horasExtrasTotales)) * 100
    : 0;

  const ausenciasNoPlanificadas = await prisma.ausencia.count({
    where: {
      estado: 'APROBADA',
      fechaInicio: { gte: inicioMes, lte: finMes },
      tipoAusencia: { codigo: { in: ['BM', 'BML'] } }
    }
  });

  const totalAsignaciones = await prisma.asignacion.count({
    where: {
      fecha: { gte: inicioMes, lte: finMes },
      estado: { notIn: ['CANCELADO'] }
    }
  });

  const asignacionesCompletadas = await prisma.asignacion.count({
    where: {
      fecha: { gte: inicioMes, lte: finMes },
      estado: 'COMPLETADO'
    }
  });

  const coberturaTurnos = totalAsignaciones > 0
    ? (asignacionesCompletadas / totalAsignaciones) * 100
    : 0;

  return {
    periodo: {
      mes: mesActual,
      año: añoActual,
      mesNombre: new Date(añoActual, mesActual - 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    },
    kpisFinancieros: {
      ingresosTotales: parseFloat(ingresosTotales.toFixed(2)),
      margenBruto: parseFloat(margenBruto.toFixed(2)),
      porcentajeMargen: parseFloat(porcentajeMargen.toFixed(1)),
      horasFacturables: parseFloat(horasTotales.toFixed(2)),
      variacionIngresos: parseFloat(variacionIngresos.toFixed(1))
    },
    kpisOperativos: {
      trabajadoresActivos,
      utilizacion: parseFloat(utilizacion.toFixed(1)),
      horasDisponibles: parseFloat(horasDisponiblesEsteMes.toFixed(2)),
      horasTrabajadas: parseFloat(horasTotales.toFixed(2))
    },
    topClientes,
    alertasCriticas: alertasCriticas.slice(0, 10),
    eficiencia: {
      ratioHorasExtras: parseFloat(ratioHorasExtras.toFixed(1)),
      ausenciasNoPlanificadas,
      coberturaTurnos: parseFloat(coberturaTurnos.toFixed(1)),
      totalAsignaciones
    }
  };
}

module.exports = {
  obtenerStats,
  obtenerCentrosSinCubrir,
  obtenerEjecutivo
};
