const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Obtiene el % de cobro para un día específico de ausencia
 */
function obtenerPorcentajeDia(tipoAusencia, numeroDia) {
  if (!tipoAusencia.usaTramos || !tipoAusencia.tramosJson) {
    return parseFloat(tipoAusencia.porcentajeCobro);
  }

  try {
    const tramos = JSON.parse(tipoAusencia.tramosJson);
    for (const tramo of tramos) {
      if (numeroDia >= tramo.diaDesde && numeroDia <= tramo.diaHasta) {
        return parseFloat(tramo.porcentaje);
      }
    }
    return parseFloat(tipoAusencia.porcentajeCobro);
  } catch (error) {
    console.error('Error parseando tramosJson:', error);
    return parseFloat(tipoAusencia.porcentajeCobro);
  }
}

/**
 * Calcula el precio por hora del trabajador
 */
function calcularPrecioHoraTrabajador(trabajador, baseCalculo) {
  const categoria = trabajador.categoria;
  let salarioMensual = parseFloat(categoria.salarioBase || 0);
  
  switch (baseCalculo) {
    case 'SALARIO_TOTAL':
      salarioMensual += parseFloat(categoria.plusTransporte || 0);
      salarioMensual += parseFloat(categoria.plusPeligrosidad || 0);
      if (trabajador.acuerdosIndividuales) {
        trabajador.acuerdosIndividuales
          .filter(a => a.activo && a.tipoAcuerdo === 'PLUS_MENSUAL')
          .forEach(a => salarioMensual += parseFloat(a.valor));
      }
      break;
      
    case 'SALARIO_REGULADOR':
      salarioMensual += parseFloat(categoria.plusTransporte || 0);
      salarioMensual += parseFloat(categoria.plusPeligrosidad || 0);
      break;
  }
  
  // Convertir a precio por hora (160h/mes estándar)
  const horasMes = parseFloat(trabajador.horasContrato) * 4.33; // ~4.33 semanas/mes
  return salarioMensual / horasMes;
}

/**
 * 🔥 FUNCIÓN CLAVE: Obtiene las horas que el trabajador HUBIERA trabajado cada día
 * Esta es la base legal correcta para calcular ausencias
 */
async function obtenerHorasPerdidas(trabajadorId, fechaInicio, fechaFin) {
  const inicio = new Date(fechaInicio);
  const fin = new Date(fechaFin);
  
  // Normalizar fechas a medianoche UTC
  inicio.setUTCHours(0, 0, 0, 0);
  fin.setUTCHours(23, 59, 59, 999);

  console.log(`📅 Buscando turnos perdidos de trabajador ${trabajadorId} del ${inicio.toISOString()} al ${fin.toISOString()}`);

  const asignaciones = await prisma.asignacion.findMany({
    where: {
      trabajadorId: parseInt(trabajadorId),
      fecha: { gte: inicio, lte: fin },
      estado: { notIn: ['CANCELADO'] }
    },
    select: {
      fecha: true,
      horaInicio: true,
      horaFin: true
    },
    orderBy: { fecha: 'asc' }
  });

  console.log(`✅ Asignaciones encontradas: ${asignaciones.length}`);

  // Agrupar por día y sumar horas
  const horasPorDia = {};
  
  asignaciones.forEach(asig => {
    const fechaStr = new Date(asig.fecha).toISOString().split('T')[0];
    
    // Calcular horas del turno
    const [hi, mi] = asig.horaInicio.split(':').map(Number);
    const [hf, mf] = asig.horaFin.split(':').map(Number);
    let horas = (hf + mf / 60) - (hi + mi / 60);
    if (horas < 0) horas += 24; // Cruce de medianoche
    
    if (!horasPorDia[fechaStr]) {
      horasPorDia[fechaStr] = 0;
    }
    horasPorDia[fechaStr] += horas;
    
    console.log(`   ${fechaStr}: +${horas.toFixed(2)}h (${asig.horaInicio}-${asig.horaFin})`);
  });

  return horasPorDia;
}

/**
 * 🔥 FUNCIÓN PRINCIPAL CORREGIDA
 * Calcula ausencias basándose en HORAS PERDIDAS, no en días de calendario
 */
async function calcularImporteAusencia(trabajador, ausencia) {
  const tipoAusencia = ausencia.tipoAusencia;
  
  // Si no es pagada, retornar 0
  if (!tipoAusencia.pagada) {
    console.log(`❌ Ausencia no pagada para ${trabajador.nombre}`);
    return {
      importeTotal: 0,
      diasCobrados: 0,
      diasCarencia: 0,
      diasLaborables: 0,
      desglosePorDia: []
    };
  }
  
  console.log(`\n💰 Calculando ausencia para ${trabajador.nombre} ${trabajador.apellidos}`);
  console.log(`   Tipo: ${tipoAusencia.nombre} (${tipoAusencia.codigo})`);
  console.log(`   Período: ${ausencia.fechaInicio} → ${ausencia.fechaFin}`);
  console.log(`   Días carencia: ${tipoAusencia.diasCarencia}`);
  console.log(`   Base cálculo: ${tipoAusencia.baseCalculo}`);

  // Obtener horas que hubiera trabajado
  const horasPorDia = await obtenerHorasPerdidas(
    trabajador.id,
    ausencia.fechaInicio,
    ausencia.fechaFin
  );

  const diasConTurno = Object.keys(horasPorDia).length;
  console.log(`   📊 Días con turno perdido: ${diasConTurno}`);

  if (diasConTurno === 0) {
    console.log(`   ⚠️ No tenía turnos programados en este período`);
    return {
      importeTotal: 0,
      diasCobrados: 0,
      diasCarencia: tipoAusencia.diasCarencia || 0,
      diasLaborables: 0,
      desglosePorDia: []
    };
  }

  // Calcular precio por hora
  const precioHora = calcularPrecioHoraTrabajador(trabajador, tipoAusencia.baseCalculo);
  console.log(`   💵 Precio/hora: ${precioHora.toFixed(2)}€`);

  // Aplicar días de carencia y porcentajes
  const diasCarencia = parseInt(tipoAusencia.diasCarencia || 0);
  const desglosePorDia = [];
  let importeTotal = 0;
  let diasCobrados = 0;
  let numeroDia = 1;

  // Ordenar fechas
  const fechasOrdenadas = Object.keys(horasPorDia).sort();

  fechasOrdenadas.forEach(fecha => {
    const horas = horasPorDia[fecha];
    
    // Aplicar carencia
    if (numeroDia <= diasCarencia) {
      console.log(`   🚫 Día ${numeroDia} (${fecha}): CARENCIA - ${horas}h perdidas, 0€`);
      desglosePorDia.push({
        fecha,
        dia: numeroDia,
        horas,
        porcentaje: 0,
        importeBruto: 0,
        motivo: 'Día de carencia'
      });
      numeroDia++;
      return;
    }

    // Calcular porcentaje según tramos
    const porcentaje = obtenerPorcentajeDia(tipoAusencia, numeroDia);
    let importeDia = horas * precioHora * (porcentaje / 100);

    // Aplicar tope diario si existe
    if (tipoAusencia.topeDiarioEuros) {
      const tope = parseFloat(tipoAusencia.topeDiarioEuros);
      if (importeDia > tope) {
        console.log(`   ⚠️ Tope aplicado: ${importeDia.toFixed(2)}€ → ${tope}€`);
        importeDia = tope;
      }
    }

    console.log(`   ✅ Día ${numeroDia} (${fecha}): ${horas}h × ${precioHora.toFixed(2)}€ × ${porcentaje}% = ${importeDia.toFixed(2)}€`);

    desglosePorDia.push({
      fecha,
      dia: numeroDia,
      horas,
      porcentaje,
      importeBruto: parseFloat(importeDia.toFixed(2)),
      motivo: porcentaje === 100 ? 'Cobro total' : `${porcentaje}% del salario`
    });

    importeTotal += importeDia;
    diasCobrados++;
    numeroDia++;
  });

  console.log(`   💰 TOTAL: ${importeTotal.toFixed(2)}€ por ${diasCobrados} días laborables\n`);

  return {
    importeTotal: parseFloat(importeTotal.toFixed(2)),
    diasCobrados,
    diasCarencia,
    diasLaborables: diasConTurno,
    precioHora: parseFloat(precioHora.toFixed(2)),
    desglosePorDia
  };
}

module.exports = {
  calcularImporteAusencia,
  obtenerPorcentajeDia,
  calcularPrecioHoraTrabajador,
  obtenerHorasPerdidas
};