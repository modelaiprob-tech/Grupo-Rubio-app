/**
 * Valida si un horario está dentro del rango permitido del centro
 */
function validarHorarioEnCentro(centro, horaInicio, horaFin) {
  // FLEXIBLE: cualquier horario permitido
  if (centro.tipoHorarioLimpieza === 'FLEXIBLE') {
    return { valido: true };
  }
  
  // FIJO: validar contra horarios limpieza
  if (!centro.horariosLimpieza || centro.horariosLimpieza.length === 0) {
    return { 
      valido: false, 
      error: 'Centro con horario fijo pero sin horarios configurados' 
    };
  }
  
  // Convertir a minutos para comparar
  const toMinutes = (time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };
  
  const inicioMinutos = toMinutes(horaInicio);
  const finMinutos = toMinutes(horaFin);
  
  // Verificar si el horario está dentro de algún rango permitido
  const dentroDeRango = centro.horariosLimpieza.some(h => {
    const rangoInicio = toMinutes(h.inicio);
    const rangoFin = toMinutes(h.fin);
    
    // Manejar cruces de medianoche
    if (rangoFin < rangoInicio) {
      return (inicioMinutos >= rangoInicio || finMinutos <= rangoFin);
    }
    
    // Rango normal
    return (inicioMinutos >= rangoInicio && finMinutos <= rangoFin);
  });
  
  if (!dentroDeRango) {
    const rangosTexto = centro.horariosLimpieza
      .map(h => `${h.inicio}-${h.fin}`)
      .join(', ');
    
    return {
      valido: false,
      error: `El horario debe estar dentro de: ${rangosTexto}`
    };
  }
  
  return { valido: true };
}

module.exports = { validarHorarioEnCentro };