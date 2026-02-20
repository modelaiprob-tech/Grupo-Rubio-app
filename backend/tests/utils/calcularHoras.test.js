jest.mock('../../src/config/prisma');
const prisma = require('../../src/config/prisma');

const {
  calcularTotalHoras,
  calcularHorasNocturnas,
  esFestivo,
  esDomingo,
  calcularDetalleHoras,
  obtenerHorasSemanales,
  recalcularSemanaTrabajador
} = require('../../utils/calcularHoras');

// ============================================================
// calcularTotalHoras
// ============================================================
describe('calcularTotalHoras', () => {
  test('turno normal 08:00-16:00 = 8h', () => {
    expect(calcularTotalHoras('08:00', '16:00')).toBe(8);
  });

  test('turno corto 10:00-12:30 = 2.5h', () => {
    expect(calcularTotalHoras('10:00', '12:30')).toBe(2.5);
  });

  test('turno completo 06:00-22:00 = 16h', () => {
    expect(calcularTotalHoras('06:00', '22:00')).toBe(16);
  });

  test('turno de 1 hora 09:00-10:00 = 1h', () => {
    expect(calcularTotalHoras('09:00', '10:00')).toBe(1);
  });

  test('turno que cruza medianoche 22:00-06:00 = 8h', () => {
    expect(calcularTotalHoras('22:00', '06:00')).toBe(8);
  });

  test('turno nocturno 23:00-07:00 = 8h', () => {
    expect(calcularTotalHoras('23:00', '07:00')).toBe(8);
  });

  test('turno mínimo 00:00-00:30 = 0.5h', () => {
    expect(calcularTotalHoras('00:00', '00:30')).toBe(0.5);
  });

  test('turno de 24h equivalente 00:00-00:00 = 0h (mismo momento)', () => {
    expect(calcularTotalHoras('00:00', '00:00')).toBe(0);
  });
});

// ============================================================
// calcularHorasNocturnas (22:00-06:00)
// ============================================================
describe('calcularHorasNocturnas', () => {
  test('turno diurno 08:00-16:00 = 0h nocturnas', () => {
    expect(calcularHorasNocturnas('08:00', '16:00')).toBe(0);
  });

  test('turno completamente nocturno 22:00-06:00 = 8h', () => {
    expect(calcularHorasNocturnas('22:00', '06:00')).toBe(8);
  });

  test('turno parcialmente nocturno 20:00-00:00 = 2h nocturnas (22-00)', () => {
    expect(calcularHorasNocturnas('20:00', '00:00')).toBe(2);
  });

  test('turno madrugada 04:00-08:00 = 2h nocturnas (04-06)', () => {
    expect(calcularHorasNocturnas('04:00', '08:00')).toBe(2);
  });

  test('turno 06:00-22:00 = 0h nocturnas (justo fuera de rango)', () => {
    expect(calcularHorasNocturnas('06:00', '22:00')).toBe(0);
  });

  test('turno 23:00-05:00 = 6h nocturnas', () => {
    expect(calcularHorasNocturnas('23:00', '05:00')).toBe(6);
  });

  test('turno 21:00-23:00 = 1h nocturna (22-23)', () => {
    expect(calcularHorasNocturnas('21:00', '23:00')).toBe(1);
  });
});

// ============================================================
// esFestivo (Prisma mock)
// ============================================================
describe('esFestivo', () => {
  beforeEach(() => {
    prisma.festivo.findFirst.mockReset();
  });

  test('retorna true si encuentra festivo', async () => {
    prisma.festivo.findFirst.mockResolvedValue({
      id: 1,
      fecha: new Date('2025-12-25'),
      nombre: 'Navidad',
      ambito: 'Nacional'
    });

    const resultado = await esFestivo('2025-12-25');
    expect(resultado).toBe(true);
    expect(prisma.festivo.findFirst).toHaveBeenCalledTimes(1);
  });

  test('retorna false si no encuentra festivo', async () => {
    prisma.festivo.findFirst.mockResolvedValue(null);

    const resultado = await esFestivo('2025-03-10');
    expect(resultado).toBe(false);
  });

  test('pasa la fecha correcta a Prisma', async () => {
    prisma.festivo.findFirst.mockResolvedValue(null);

    await esFestivo('2025-01-01');
    expect(prisma.festivo.findFirst).toHaveBeenCalledWith({
      where: {
        fecha: new Date('2025-01-01'),
        OR: [
          { ambito: 'Nacional' },
          { ambito: 'Navarra' }
        ]
      }
    });
  });
});

// ============================================================
// esDomingo
// ============================================================
describe('esDomingo', () => {
  test('un domingo retorna true', () => {
    // 2025-02-16 es domingo
    expect(esDomingo('2025-02-16')).toBe(true);
  });

  test('un lunes retorna false', () => {
    expect(esDomingo('2025-02-17')).toBe(false);
  });

  test('un sábado retorna false', () => {
    expect(esDomingo('2025-02-15')).toBe(false);
  });
});

// ============================================================
// calcularDetalleHoras
// ============================================================
describe('calcularDetalleHoras', () => {
  const trabajadorBase = {
    id: 1,
    horasContrato: '40'
  };

  beforeEach(() => {
    prisma.festivo.findFirst.mockReset();
    prisma.festivo.findFirst.mockResolvedValue(null); // no festivo por defecto
  });

  test('turno normal sin extras ni nocturnas', async () => {
    const asignacion = {
      horaInicio: '08:00',
      horaFin: '16:00',
      fecha: '2025-02-17' // lunes
    };

    const resultado = await calcularDetalleHoras(asignacion, trabajadorBase, 0);

    expect(resultado.totalHoras).toBe(8);
    expect(resultado.horasNormales).toBe(8);
    expect(resultado.horasExtra).toBe(0);
    expect(resultado.horasNocturnas).toBe(0);
    expect(resultado.horasFestivo).toBe(0);
    expect(resultado.excedioContrato).toBe(false);
  });

  test('turno nocturno tiene horas nocturnas', async () => {
    const asignacion = {
      horaInicio: '22:00',
      horaFin: '06:00',
      fecha: '2025-02-17'
    };

    const resultado = await calcularDetalleHoras(asignacion, trabajadorBase, 0);

    expect(resultado.totalHoras).toBe(8);
    expect(resultado.horasNocturnas).toBe(8);
  });

  test('genera horas extra cuando se supera contrato', async () => {
    const asignacion = {
      horaInicio: '08:00',
      horaFin: '16:00',
      fecha: '2025-02-21' // viernes
    };

    // Ya ha hecho 36h esta semana, 8h más = 44h total, 4h extras
    const resultado = await calcularDetalleHoras(asignacion, trabajadorBase, 36);

    expect(resultado.totalHoras).toBe(8);
    expect(resultado.horasNormales).toBe(4);
    expect(resultado.horasExtra).toBe(4);
    expect(resultado.excedioContrato).toBe(true);
    expect(resultado.horasAcumuladasSemana).toBe(44);
  });

  test('todo extra si ya se superó contrato antes', async () => {
    const asignacion = {
      horaInicio: '08:00',
      horaFin: '16:00',
      fecha: '2025-02-21'
    };

    const resultado = await calcularDetalleHoras(asignacion, trabajadorBase, 42);

    expect(resultado.horasNormales).toBe(0);
    expect(resultado.horasExtra).toBe(8);
  });

  test('festivo marca horasFestivo', async () => {
    prisma.festivo.findFirst.mockResolvedValue({ id: 1, nombre: 'Navidad' });

    const asignacion = {
      horaInicio: '08:00',
      horaFin: '16:00',
      fecha: '2025-12-25'
    };

    const resultado = await calcularDetalleHoras(asignacion, trabajadorBase, 0);

    expect(resultado.horasFestivo).toBe(8);
  });

  test('domingo marca horasFestivo', async () => {
    const asignacion = {
      horaInicio: '08:00',
      horaFin: '14:00',
      fecha: '2025-02-16' // domingo
    };

    const resultado = await calcularDetalleHoras(asignacion, trabajadorBase, 0);

    expect(resultado.horasFestivo).toBe(6);
  });
});

// ============================================================
// obtenerHorasSemanales
// ============================================================
describe('obtenerHorasSemanales', () => {
  beforeEach(() => {
    prisma.asignacion.findMany.mockReset();
  });

  test('suma correctamente horas de varias asignaciones', async () => {
    prisma.asignacion.findMany.mockResolvedValue([
      { horaInicio: '08:00', horaFin: '16:00' }, // 8h
      { horaInicio: '08:00', horaFin: '16:00' }, // 8h
      { horaInicio: '08:00', horaFin: '14:00' }  // 6h
    ]);

    const resultado = await obtenerHorasSemanales(1, '2025-02-19');
    expect(resultado).toBe(22);
  });

  test('retorna 0 si no hay asignaciones', async () => {
    prisma.asignacion.findMany.mockResolvedValue([]);

    const resultado = await obtenerHorasSemanales(1, '2025-02-19');
    expect(resultado).toBe(0);
  });

  test('consulta el rango lunes-domingo correcto', async () => {
    prisma.asignacion.findMany.mockResolvedValue([]);

    // 2025-02-19 es miércoles → lunes = 17, domingo = 23
    await obtenerHorasSemanales(5, '2025-02-19');

    const llamada = prisma.asignacion.findMany.mock.calls[0][0];
    expect(llamada.where.trabajadorId).toBe(5);

    const gte = llamada.where.fecha.gte;
    const lte = llamada.where.fecha.lte;
    expect(gte.getDate()).toBe(17);
    expect(lte.getDate()).toBe(23);
  });
});

// ============================================================
// recalcularSemanaTrabajador
// ============================================================
describe('recalcularSemanaTrabajador', () => {
  beforeEach(() => {
    prisma.trabajador.findUnique.mockReset();
    prisma.asignacion.findMany.mockReset();
    prisma.asignacion.update.mockReset();
    prisma.registroHoras.findUnique.mockReset();
    prisma.registroHoras.create.mockReset();
    prisma.registroHoras.update.mockReset();
    prisma.festivo.findFirst.mockReset();
    prisma.festivo.findFirst.mockResolvedValue(null);
  });

  test('no hace nada si trabajador no existe', async () => {
    prisma.trabajador.findUnique.mockResolvedValue(null);

    await recalcularSemanaTrabajador(999, '2025-02-19');

    expect(prisma.asignacion.findMany).not.toHaveBeenCalled();
  });

  test('crea registroHoras si no existe', async () => {
    prisma.trabajador.findUnique.mockResolvedValue({
      id: 1, nombre: 'Juan', apellidos: 'Test', horasContrato: '40'
    });
    prisma.asignacion.findMany.mockResolvedValue([
      { id: 10, horaInicio: '08:00', horaFin: '16:00', fecha: '2025-02-17', estado: 'ACTIVO', requiereAtencion: false, motivoAtencion: null }
    ]);
    prisma.registroHoras.findUnique.mockResolvedValue(null);
    prisma.registroHoras.create.mockResolvedValue({});

    await recalcularSemanaTrabajador(1, '2025-02-19');

    expect(prisma.registroHoras.create).toHaveBeenCalledTimes(1);
    const datos = prisma.registroHoras.create.mock.calls[0][0].data;
    expect(datos.asignacionId).toBe(10);
    expect(datos.horasNormales).toBe(8);
    expect(datos.horasExtra).toBe(0);
  });

  test('actualiza registroHoras si ya existe', async () => {
    prisma.trabajador.findUnique.mockResolvedValue({
      id: 1, nombre: 'Juan', apellidos: 'Test', horasContrato: '40'
    });
    prisma.asignacion.findMany.mockResolvedValue([
      { id: 10, horaInicio: '08:00', horaFin: '16:00', fecha: '2025-02-17', estado: 'ACTIVO', requiereAtencion: false, motivoAtencion: null }
    ]);
    prisma.registroHoras.findUnique.mockResolvedValue({ id: 100 });
    prisma.registroHoras.update.mockResolvedValue({});

    await recalcularSemanaTrabajador(1, '2025-02-19');

    expect(prisma.registroHoras.update).toHaveBeenCalledTimes(1);
    expect(prisma.registroHoras.create).not.toHaveBeenCalled();
  });

  test('marca requiereAtencion cuando hay horas extra', async () => {
    prisma.trabajador.findUnique.mockResolvedValue({
      id: 1, nombre: 'Juan', apellidos: 'Test', horasContrato: '8'
    });

    // Dos turnos de 8h con contrato de 8h/semana → segundo turno = todo extra
    prisma.asignacion.findMany.mockResolvedValue([
      { id: 10, horaInicio: '08:00', horaFin: '16:00', fecha: '2025-02-17', estado: 'ACTIVO', requiereAtencion: false, motivoAtencion: null },
      { id: 11, horaInicio: '08:00', horaFin: '16:00', fecha: '2025-02-18', estado: 'ACTIVO', requiereAtencion: false, motivoAtencion: null }
    ]);
    prisma.registroHoras.findUnique.mockResolvedValue(null);
    prisma.registroHoras.create.mockResolvedValue({});
    prisma.asignacion.update.mockResolvedValue({});

    await recalcularSemanaTrabajador(1, '2025-02-19');

    // La segunda asignación debe marcarse con requiereAtencion
    const updateCalls = prisma.asignacion.update.mock.calls;
    const updateConExtra = updateCalls.find(c => c[0].data.requiereAtencion === true);
    expect(updateConExtra).toBeDefined();
  });
});
