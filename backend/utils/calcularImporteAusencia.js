/**
 * Calcula el importe a cobrar por una ausencia según el tipo y duración
 * Basado en legislación española estándar
 */

/**
 * Obtiene el % de cobro para un día específico de ausencia
 * @param {Object} tipoAusencia - Tipo de ausencia con sus configuraciones
 * @param {number} numeroDia - Número de día de la ausencia (1, 2, 3...)
 * @returns {number} Porcentaje de cobro (0-100)
 */
function obtenerPorcentajeDia(tipoAusencia, numeroDia) {
  // Si no usa tramos, devolver porcentaje fijo
  if (!tipoAusencia.usaTramos || !tipoAusencia.tramosJson) {
    return parseFloat(tipoAusencia.porcentajeCobro);
  }

  try {
    const tramos = JSON.parse(tipoAusencia.tramosJson);
    
    // Buscar el tramo que corresponde a este día
    for (const tramo of tramos) {
      if (numeroDia >= tramo.diaDesde && numeroDia <= tramo.diaHasta) {
        return parseFloat(tramo.porcentaje);
      }
    }
    
    // Si no encuentra tramo, usar porcentaje por defecto
    return parseFloat(tipoAusencia.porcentajeCobro);
  } catch (error) {
    console.error('Error parseando tramosJson:', error);
    return parseFloat(tipoAusencia.porcentajeCobro);
  }
}

/**
 * Calcula el salario base diario según la base de cálculo configurada
 * @param {Object} trabajador - Trabajador con categoria y acuerdos incluidos
 * @param {string} baseCalculo - Tipo de base (SALARIO_BASE | SALARIO_TOTAL | SALARIO_REGULADOR)
 * @returns {number} Salario diario en euros
 */
function calcularSalarioDiario(trabajador, baseCalculo) {
  const categoria = trabajador.categoria;
  
  // Salario mensual base
  let salarioMensual = parseFloat(categoria.salarioBase || 0);
  
  // Según el tipo de base de cálculo
  switch (baseCalculo) {
    case 'SALARIO_TOTAL':
      // Incluir pluses fijos mensuales
      salarioMensual += parseFloat(categoria.plusTransporte || 0);
      salarioMensual += parseFloat(categoria.plusPeligrosidad || 0);
      
      // Incluir acuerdos individuales de plus mensual
      if (trabajador.acuerdosIndividuales) {
        trabajador.acuerdosIndividuales
          .filter(a => a.activo && a.tipoAcuerdo === 'PLUS_MENSUAL')
          .forEach(a => {
            salarioMensual += parseFloat(a.valor);
          });
      }
      break;
      
    case 'SALARIO_REGULADOR':
      // Para IT: promedio últimos 180 días cotizados
      // Por ahora usamos salario base + pluses (simplificado)
      salarioMensual += parseFloat(categoria.plusTransporte || 0);
      salarioMensual += parseFloat(categoria.plusPeligrosidad || 0);
      break;
      
    case 'SALARIO_BASE':
    default:
      // Solo salario base, ya está calculado
      break;
  }
  
  // Convertir a diario (asumiendo 30 días/mes según convenio)
  return salarioMensual / 30;
}

/**
 * Calcula cuántos días laborables hay en el período de ausencia
 * @param {Date} fechaInicio 
 * @param {Date} fechaFin 
 * @param {boolean} incluyeDomingos 
 * @param {boolean} incluyeFestivos 
 * @param {Array} festivosNacionales - Array de fechas festivas
 * @returns {number} Número de días laborables
 */
function contarDiasLaborables(fechaInicio, fechaFin, incluyeDomingos, incluyeFestivos, festivosNacionales = []) {
  let dias = 0;
  const actual = new Date(fechaInicio);
  
  while (actual <= fechaFin) {
    const esDomingo = actual.getDay() === 0;
    const esFestivo = festivosNacionales.some(f => 
      f.getDate() === actual.getDate() &&
      f.getMonth() === actual.getMonth() &&
      f.getFullYear() === actual.getFullYear()
    );
    
    // Contar según configuración
    if (esDomingo && !incluyeDomingos) {
      actual.setDate(actual.getDate() + 1);
      continue;
    }
    
    if (esFestivo && !incluyeFestivos) {
      actual.setDate(actual.getDate() + 1);
      continue;
    }
    
    dias++;
    actual.setDate(actual.getDate() + 1);
  }
  
  return dias;
}

/**
 * FUNCIÓN PRINCIPAL: Calcula el importe total de una ausencia
 * @param {Object} trabajador - Trabajador con categoria y acuerdos incluidos
 * @param {Object} ausencia - Ausencia con fechas y tipoAusencia incluido
 * @param {Array} festivosNacionales - Array de fechas festivas (opcional)
 * @returns {Object} { importeTotal, diasCobrados, diasCarencia, desglosePorDia }
 */
function calcularImporteAusencia(trabajador, ausencia, festivosNacionales = []) {
  const tipoAusencia = ausencia.tipoAusencia;
  
  // Si no es ausencia pagada, importe = 0
  if (!tipoAusencia.pagada) {
    return {
      importeTotal: 0,
      diasCobrados: 0,
      diasCarencia: 0,
      desglosePorDia: []
    };
  }
  
  // Calcular salario diario base
  const salarioDiario = calcularSalarioDiario(trabajador, tipoAusencia.baseCalculo);
  
  // Contar días laborables del período
  const diasLaborables = contarDiasLaborables(
    new Date(ausencia.fechaInicio),
    new Date(ausencia.fechaFin),
    tipoAusencia.incluyeDomingos,
    tipoAusencia.incluyeFestivos,
    festivosNacionales
  );
  
  // Días de carencia (sin cobro)
  const diasCarencia = parseInt(tipoAusencia.diasCarencia || 0);
  
  // Calcular importe día por día
  const desglosePorDia = [];
  let importeTotal = 0;
  let diasCobrados = 0;
  
  for (let i = 1; i <= diasLaborables; i++) {
    // Días de carencia no se cobran
    if (i <= diasCarencia) {
      desglosePorDia.push({
        dia: i,
        porcentaje: 0,
        importeBruto: 0,
        motivo: 'Día de carencia'
      });
      continue;
    }
    
    // Obtener % según tramos o fijo
    const porcentaje = obtenerPorcentajeDia(tipoAusencia, i);
    let importeDia = salarioDiario * (porcentaje / 100);
    
    // Aplicar tope diario si existe
    if (tipoAusencia.topeDiarioEuros) {
      const tope = parseFloat(tipoAusencia.topeDiarioEuros);
      if (importeDia > tope) {
        importeDia = tope;
      }
    }
    
    desglosePorDia.push({
      dia: i,
      porcentaje: porcentaje,
      importeBruto: parseFloat(importeDia.toFixed(2)),
      motivo: porcentaje === 100 ? 'Cobro total' : `${porcentaje}% del salario`
    });
    
    importeTotal += importeDia;
    diasCobrados++;
  }
  
  return {
    importeTotal: parseFloat(importeTotal.toFixed(2)),
    diasCobrados: diasCobrados,
    diasCarencia: diasCarencia,
    salarioDiarioBase: parseFloat(salarioDiario.toFixed(2)),
    desglosePorDia: desglosePorDia
  };
}

module.exports = {
  calcularImporteAusencia,
  calcularSalarioDiario,
  obtenerPorcentajeDia,
  contarDiasLaborables
};