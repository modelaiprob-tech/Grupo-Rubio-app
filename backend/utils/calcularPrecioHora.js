/**
 * Calcula el precio por hora de un trabajador considerando:
 * - Precio base de su categoría
 * - Acuerdos individuales activos
 * - Centro de trabajo (si el acuerdo es específico de un centro)
 */
function calcularPrecioHora(trabajador, centroId = null, tipo = 'NORMAL') {
  // Precio base de la categoría
  let precioBase = parseFloat(trabajador.categoria.precioHora);
  
  // Buscar acuerdos activos
  const acuerdosAplicables = trabajador.acuerdosIndividuales?.filter(acuerdo => {
    if (!acuerdo.activo) return false;
    
    // Si el acuerdo es para un centro específico, debe coincidir
    if (acuerdo.centroId && centroId) {
      return acuerdo.centroId === centroId;
    }
    
    // Si el acuerdo no tiene centro, aplica a todos
    return !acuerdo.centroId;
  }) || [];
  
  // Aplicar acuerdos
  for (const acuerdo of acuerdosAplicables) {
    if (acuerdo.tipoAcuerdo === 'PRECIO_HORA') {
      precioBase = parseFloat(acuerdo.valor);
    }
  }
  
  // Aplicar recargos según el tipo de hora
  const categoria = trabajador.categoria;
  switch (tipo) {
    case 'NOCTURNA':
      return precioBase * (1 + parseFloat(categoria.recargoNocturno) / 100);
    case 'FESTIVA':
      return precioBase * (1 + parseFloat(categoria.recargoFestivo) / 100);
    case 'EXTRA':
      return precioBase * (1 + parseFloat(categoria.recargoExtra) / 100);
    case 'EXTRA_ADICIONAL':
      return precioBase * (1 + parseFloat(categoria.recargoExtraAdicional) / 100);
    default:
      return precioBase;
  }
}

/**
 * Calcula pluses mensuales de un trabajador
 */
function calcularPlusesMensuales(trabajador, centroId = null) {
  const categoria = trabajador.categoria;
  let plusTotal = parseFloat(categoria.plusTransporte || 0) + parseFloat(categoria.plusPeligrosidad || 0);
  
  // Buscar acuerdos de plus mensual
  const acuerdosAplicables = trabajador.acuerdosIndividuales?.filter(acuerdo => {
    if (!acuerdo.activo || acuerdo.tipoAcuerdo !== 'PLUS_MENSUAL') return false;
    
    if (acuerdo.centroId && centroId) {
      return acuerdo.centroId === centroId;
    }
    
    return !acuerdo.centroId;
  }) || [];
  
  for (const acuerdo of acuerdosAplicables) {
    plusTotal += parseFloat(acuerdo.valor);
  }
  
  return plusTotal;
}

module.exports = {
  calcularPrecioHora,
  calcularPlusesMensuales
};