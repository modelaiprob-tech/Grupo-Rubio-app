jest.mock('../../src/config/prisma');
const prisma = require('../../src/config/prisma');

const {
  calcularImporteAusencia,
  obtenerPorcentajeDia,
  calcularPrecioHoraTrabajador,
  obtenerHorasPerdidas
} = require('../../utils/calcularImporteAusencia');

// ============================================================
// obtenerPorcentajeDia
// ============================================================
describe('obtenerPorcentajeDia', () => {
  test('sin tramos usa porcentajeCobro directo', () => {
    const tipo = {
      usaTramos: false,
      tramosJson: null,
      porcentajeCobro: '75'
    };

    expect(obtenerPorcentajeDia(tipo, 1)).toBe(75);
    expect(obtenerPorcentajeDia(tipo, 10)).toBe(75);
  });

  test('con tramos aplica el tramo correcto', () => {
    const tipo = {
      usaTramos: true,
      tramosJson: JSON.stringify([
        { diaDesde: 1, diaHasta: 3, porcentaje: 0 },
        { diaDesde: 4, diaHasta: 20, porcentaje: 60 },
        { diaDesde: 21, diaHasta: 365, porcentaje: 75 }
      ]),
      porcentajeCobro: '100'
    };

    expect(obtenerPorcentajeDia(tipo, 1)).toBe(0);    // carencia
    expect(obtenerPorcentajeDia(tipo, 3)).toBe(0);    // último día carencia
    expect(obtenerPorcentajeDia(tipo, 4)).toBe(60);   // primer día cobro
    expect(obtenerPorcentajeDia(tipo, 15)).toBe(60);
    expect(obtenerPorcentajeDia(tipo, 21)).toBe(75);  // tramo superior
    expect(obtenerPorcentajeDia(tipo, 100)).toBe(75);
  });

  test('día fuera de todos los tramos usa porcentajeCobro base', () => {
    const tipo = {
      usaTramos: true,
      tramosJson: JSON.stringify([
        { diaDesde: 1, diaHasta: 10, porcentaje: 50 }
      ]),
      porcentajeCobro: '80'
    };

    expect(obtenerPorcentajeDia(tipo, 15)).toBe(80);
  });

  test('tramosJson inválido cae al porcentajeCobro base', () => {
    const tipo = {
      usaTramos: true,
      tramosJson: 'no es json válido{',
      porcentajeCobro: '65'
    };

    expect(obtenerPorcentajeDia(tipo, 5)).toBe(65);
  });

  test('usaTramos true pero tramosJson null usa porcentajeCobro', () => {
    const tipo = {
      usaTramos: true,
      tramosJson: null,
      porcentajeCobro: '100'
    };

    expect(obtenerPorcentajeDia(tipo, 1)).toBe(100);
  });
});

// ============================================================
// calcularPrecioHoraTrabajador
// ============================================================
describe('calcularPrecioHoraTrabajador', () => {
  const trabajadorBase = {
    horasContrato: '40',
    categoria: {
      salarioBase: '1200.00',
      plusTransporte: '50.00',
      plusPeligrosidad: '30.00'
    },
    acuerdosIndividuales: []
  };

  test('SALARIO_BASE solo usa salario base', () => {
    // horasMes = 40 * 4.33 = 173.2
    // precio = 1200 / 173.2 ≈ 6.928
    const precio = calcularPrecioHoraTrabajador(trabajadorBase, 'SALARIO_BASE');
    expect(precio).toBeCloseTo(1200 / (40 * 4.33), 2);
  });

  test('SALARIO_REGULADOR suma pluses de categoría', () => {
    // (1200 + 50 + 30) / 173.2 = 1280 / 173.2
    const precio = calcularPrecioHoraTrabajador(trabajadorBase, 'SALARIO_REGULADOR');
    expect(precio).toBeCloseTo(1280 / (40 * 4.33), 2);
  });

  test('SALARIO_TOTAL suma pluses + acuerdos PLUS_MENSUAL', () => {
    const trabajador = {
      ...trabajadorBase,
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PLUS_MENSUAL', valor: '100.00' }
      ]
    };

    // (1200 + 50 + 30 + 100) / 173.2 = 1380 / 173.2
    const precio = calcularPrecioHoraTrabajador(trabajador, 'SALARIO_TOTAL');
    expect(precio).toBeCloseTo(1380 / (40 * 4.33), 2);
  });

  test('acuerdos inactivos no se suman en SALARIO_TOTAL', () => {
    const trabajador = {
      ...trabajadorBase,
      acuerdosIndividuales: [
        { activo: false, tipoAcuerdo: 'PLUS_MENSUAL', valor: '9999.00' }
      ]
    };

    const precio = calcularPrecioHoraTrabajador(trabajador, 'SALARIO_TOTAL');
    // Solo base + pluses categoría = 1280
    expect(precio).toBeCloseTo(1280 / (40 * 4.33), 2);
  });

  test('contrato de 20h semanales cambia el divisor', () => {
    const trabajador = {
      ...trabajadorBase,
      horasContrato: '20'
    };

    // 1200 / (20 * 4.33) = 1200 / 86.6
    const precio = calcularPrecioHoraTrabajador(trabajador, 'SALARIO_BASE');
    expect(precio).toBeCloseTo(1200 / (20 * 4.33), 2);
  });
});

// ============================================================
// obtenerHorasPerdidas (Prisma mock)
// ============================================================
describe('obtenerHorasPerdidas', () => {
  beforeEach(() => {
    prisma.asignacion.findMany.mockReset();
  });

  test('agrupa horas por día correctamente', async () => {
    prisma.asignacion.findMany.mockResolvedValue([
      { fecha: new Date('2025-02-17'), horaInicio: '08:00', horaFin: '16:00' }, // 8h
      { fecha: new Date('2025-02-17'), horaInicio: '18:00', horaFin: '20:00' }, // 2h
      { fecha: new Date('2025-02-18'), horaInicio: '08:00', horaFin: '14:00' }  // 6h
    ]);

    const resultado = await obtenerHorasPerdidas(1, '2025-02-17', '2025-02-18');

    expect(resultado['2025-02-17']).toBe(10); // 8 + 2
    expect(resultado['2025-02-18']).toBe(6);
  });

  test('retorna objeto vacío si no hay asignaciones', async () => {
    prisma.asignacion.findMany.mockResolvedValue([]);

    const resultado = await obtenerHorasPerdidas(1, '2025-02-17', '2025-02-20');

    expect(resultado).toEqual({});
  });

  test('maneja turno que cruza medianoche', async () => {
    prisma.asignacion.findMany.mockResolvedValue([
      { fecha: new Date('2025-02-17'), horaInicio: '22:00', horaFin: '06:00' } // 8h
    ]);

    const resultado = await obtenerHorasPerdidas(1, '2025-02-17', '2025-02-17');

    expect(resultado['2025-02-17']).toBe(8);
  });

  test('filtra correctamente por trabajadorId y excluye CANCELADO', async () => {
    prisma.asignacion.findMany.mockResolvedValue([]);

    await obtenerHorasPerdidas(42, '2025-02-17', '2025-02-20');

    const where = prisma.asignacion.findMany.mock.calls[0][0].where;
    expect(where.trabajadorId).toBe(42);
    expect(where.estado).toEqual({ notIn: ['CANCELADO'] });
  });
});

// ============================================================
// calcularImporteAusencia
// ============================================================
describe('calcularImporteAusencia', () => {
  const trabajadorBase = {
    id: 1,
    nombre: 'María',
    apellidos: 'García',
    horasContrato: '40',
    categoria: {
      salarioBase: '1200.00',
      plusTransporte: '50.00',
      plusPeligrosidad: '0'
    },
    acuerdosIndividuales: []
  };

  beforeEach(() => {
    prisma.asignacion.findMany.mockReset();
  });

  test('ausencia no pagada retorna importe 0', async () => {
    const ausencia = {
      tipoAusencia: {
        nombre: 'Permiso sin sueldo',
        pagada: false,
        porcentajeCobro: '0'
      },
      fechaInicio: '2025-02-17',
      fechaFin: '2025-02-19'
    };

    const resultado = await calcularImporteAusencia(trabajadorBase, ausencia);

    expect(resultado.importeTotal).toBe(0);
    expect(resultado.diasCobrados).toBe(0);
    expect(resultado.desglosePorDia).toEqual([]);
  });

  test('ausencia pagada sin turnos = importe 0', async () => {
    prisma.asignacion.findMany.mockResolvedValue([]);

    const ausencia = {
      tipoAusencia: {
        nombre: 'Vacaciones',
        pagada: true,
        porcentajeCobro: '100',
        diasCarencia: 0,
        usaTramos: false,
        baseCalculo: 'SALARIO_BASE'
      },
      fechaInicio: '2025-02-17',
      fechaFin: '2025-02-19'
    };

    const resultado = await calcularImporteAusencia(trabajadorBase, ausencia);

    expect(resultado.importeTotal).toBe(0);
    expect(resultado.diasLaborables).toBe(0);
  });

  test('ausencia pagada al 100% calcula correctamente', async () => {
    // Trabajador tenía 8h/día los 3 días
    prisma.asignacion.findMany.mockResolvedValue([
      { fecha: new Date('2025-02-17'), horaInicio: '08:00', horaFin: '16:00' },
      { fecha: new Date('2025-02-18'), horaInicio: '08:00', horaFin: '16:00' },
      { fecha: new Date('2025-02-19'), horaInicio: '08:00', horaFin: '16:00' }
    ]);

    const ausencia = {
      tipoAusencia: {
        nombre: 'Vacaciones',
        pagada: true,
        porcentajeCobro: '100',
        diasCarencia: 0,
        usaTramos: false,
        baseCalculo: 'SALARIO_BASE'
      },
      fechaInicio: '2025-02-17',
      fechaFin: '2025-02-19'
    };

    const resultado = await calcularImporteAusencia(trabajadorBase, ausencia);

    const precioHoraEsperado = 1200 / (40 * 4.33);
    const esperado = 3 * 8 * precioHoraEsperado;

    expect(resultado.diasCobrados).toBe(3);
    expect(resultado.diasLaborables).toBe(3);
    expect(resultado.importeTotal).toBeCloseTo(esperado, 1);
    expect(resultado.desglosePorDia).toHaveLength(3);
  });

  test('días de carencia no se pagan', async () => {
    prisma.asignacion.findMany.mockResolvedValue([
      { fecha: new Date('2025-02-17'), horaInicio: '08:00', horaFin: '16:00' },
      { fecha: new Date('2025-02-18'), horaInicio: '08:00', horaFin: '16:00' },
      { fecha: new Date('2025-02-19'), horaInicio: '08:00', horaFin: '16:00' }
    ]);

    const ausencia = {
      tipoAusencia: {
        nombre: 'Baja Común',
        pagada: true,
        porcentajeCobro: '60',
        diasCarencia: 2,
        usaTramos: false,
        baseCalculo: 'SALARIO_BASE'
      },
      fechaInicio: '2025-02-17',
      fechaFin: '2025-02-19'
    };

    const resultado = await calcularImporteAusencia(trabajadorBase, ausencia);

    // 3 días con turno, 2 carencia → solo 1 día cobrado
    expect(resultado.diasCobrados).toBe(1);
    expect(resultado.diasCarencia).toBe(2);

    // Los primeros 2 días deben tener importeBruto 0
    expect(resultado.desglosePorDia[0].importeBruto).toBe(0);
    expect(resultado.desglosePorDia[0].motivo).toBe('Día de carencia');
    expect(resultado.desglosePorDia[1].importeBruto).toBe(0);

    // El tercer día se paga al 60%
    expect(resultado.desglosePorDia[2].porcentaje).toBe(60);
    expect(resultado.desglosePorDia[2].importeBruto).toBeGreaterThan(0);
  });

  test('tramos aplican porcentajes diferentes por día', async () => {
    prisma.asignacion.findMany.mockResolvedValue([
      { fecha: new Date('2025-02-17'), horaInicio: '08:00', horaFin: '16:00' },
      { fecha: new Date('2025-02-18'), horaInicio: '08:00', horaFin: '16:00' },
      { fecha: new Date('2025-02-19'), horaInicio: '08:00', horaFin: '16:00' },
      { fecha: new Date('2025-02-20'), horaInicio: '08:00', horaFin: '16:00' }
    ]);

    const ausencia = {
      tipoAusencia: {
        nombre: 'Baja con tramos',
        pagada: true,
        porcentajeCobro: '75',
        diasCarencia: 0,
        usaTramos: true,
        tramosJson: JSON.stringify([
          { diaDesde: 1, diaHasta: 2, porcentaje: 50 },
          { diaDesde: 3, diaHasta: 365, porcentaje: 75 }
        ]),
        baseCalculo: 'SALARIO_BASE'
      },
      fechaInicio: '2025-02-17',
      fechaFin: '2025-02-20'
    };

    const resultado = await calcularImporteAusencia(trabajadorBase, ausencia);

    expect(resultado.desglosePorDia[0].porcentaje).toBe(50);
    expect(resultado.desglosePorDia[1].porcentaje).toBe(50);
    expect(resultado.desglosePorDia[2].porcentaje).toBe(75);
    expect(resultado.desglosePorDia[3].porcentaje).toBe(75);
  });

  test('tope diario limita el importe', async () => {
    prisma.asignacion.findMany.mockResolvedValue([
      { fecha: new Date('2025-02-17'), horaInicio: '06:00', horaFin: '22:00' } // 16h
    ]);

    const ausencia = {
      tipoAusencia: {
        nombre: 'Baja con tope',
        pagada: true,
        porcentajeCobro: '100',
        diasCarencia: 0,
        usaTramos: false,
        baseCalculo: 'SALARIO_BASE',
        topeDiarioEuros: '50.00'
      },
      fechaInicio: '2025-02-17',
      fechaFin: '2025-02-17'
    };

    const resultado = await calcularImporteAusencia(trabajadorBase, ausencia);

    // Sin tope sería 16h * ~6.93€ ≈ 110€, pero tope es 50€
    expect(resultado.importeTotal).toBe(50);
    expect(resultado.desglosePorDia[0].importeBruto).toBe(50);
  });

  test('diferentes horas por día se calculan individualmente', async () => {
    prisma.asignacion.findMany.mockResolvedValue([
      { fecha: new Date('2025-02-17'), horaInicio: '08:00', horaFin: '16:00' }, // 8h
      { fecha: new Date('2025-02-18'), horaInicio: '08:00', horaFin: '12:00' }  // 4h
    ]);

    const ausencia = {
      tipoAusencia: {
        nombre: 'Vacaciones',
        pagada: true,
        porcentajeCobro: '100',
        diasCarencia: 0,
        usaTramos: false,
        baseCalculo: 'SALARIO_BASE'
      },
      fechaInicio: '2025-02-17',
      fechaFin: '2025-02-18'
    };

    const resultado = await calcularImporteAusencia(trabajadorBase, ausencia);

    // Día 1 debe tener mayor importe que día 2 (8h vs 4h)
    expect(resultado.desglosePorDia[0].horas).toBe(8);
    expect(resultado.desglosePorDia[1].horas).toBe(4);
    expect(resultado.desglosePorDia[0].importeBruto).toBeGreaterThan(resultado.desglosePorDia[1].importeBruto);
  });

  test('retorna precioHora en el resultado', async () => {
    prisma.asignacion.findMany.mockResolvedValue([
      { fecha: new Date('2025-02-17'), horaInicio: '08:00', horaFin: '16:00' }
    ]);

    const ausencia = {
      tipoAusencia: {
        nombre: 'Vacaciones',
        pagada: true,
        porcentajeCobro: '100',
        diasCarencia: 0,
        usaTramos: false,
        baseCalculo: 'SALARIO_BASE'
      },
      fechaInicio: '2025-02-17',
      fechaFin: '2025-02-17'
    };

    const resultado = await calcularImporteAusencia(trabajadorBase, ausencia);

    expect(resultado.precioHora).toBeDefined();
    expect(resultado.precioHora).toBeGreaterThan(0);
  });
});
