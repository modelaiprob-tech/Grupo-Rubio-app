const {
  calcularPrecioHora,
  calcularPlusesMensuales
} = require('../../utils/calcularPrecioHora');

// ============================================================
// calcularPrecioHora
// ============================================================
describe('calcularPrecioHora', () => {
  const trabajadorBase = {
    categoria: {
      precioHora: '12.50',
      recargoNocturno: '25',
      recargoFestivo: '50',
      recargoExtra: '75',
      recargoExtraAdicional: '100'
    },
    acuerdosIndividuales: []
  };

  // --- Casos normales ---
  test('precio NORMAL = precio base de categoría', () => {
    const precio = calcularPrecioHora(trabajadorBase, null, 'NORMAL');
    expect(precio).toBe(12.5);
  });

  test('precio NORMAL es el default sin tipo', () => {
    const precio = calcularPrecioHora(trabajadorBase);
    expect(precio).toBe(12.5);
  });

  test('precio NOCTURNA = base * (1 + 25%)', () => {
    const precio = calcularPrecioHora(trabajadorBase, null, 'NOCTURNA');
    expect(precio).toBeCloseTo(15.625);
  });

  test('precio FESTIVA = base * (1 + 50%)', () => {
    const precio = calcularPrecioHora(trabajadorBase, null, 'FESTIVA');
    expect(precio).toBeCloseTo(18.75);
  });

  test('precio EXTRA = base * (1 + 75%)', () => {
    const precio = calcularPrecioHora(trabajadorBase, null, 'EXTRA');
    expect(precio).toBeCloseTo(21.875);
  });

  test('precio EXTRA_ADICIONAL = base * (1 + 100%)', () => {
    const precio = calcularPrecioHora(trabajadorBase, null, 'EXTRA_ADICIONAL');
    expect(precio).toBeCloseTo(25.0);
  });

  // --- Con acuerdos individuales ---
  test('acuerdo PRECIO_HORA sobreescribe precio base', () => {
    const trabajador = {
      ...trabajadorBase,
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PRECIO_HORA', valor: '15.00', centroId: null }
      ]
    };

    const precio = calcularPrecioHora(trabajador, null, 'NORMAL');
    expect(precio).toBe(15.0);
  });

  test('acuerdo PRECIO_HORA + recargo nocturno', () => {
    const trabajador = {
      ...trabajadorBase,
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PRECIO_HORA', valor: '20.00', centroId: null }
      ]
    };

    const precio = calcularPrecioHora(trabajador, null, 'NOCTURNA');
    // 20 * 1.25 = 25
    expect(precio).toBeCloseTo(25.0);
  });

  test('acuerdo inactivo no se aplica', () => {
    const trabajador = {
      ...trabajadorBase,
      acuerdosIndividuales: [
        { activo: false, tipoAcuerdo: 'PRECIO_HORA', valor: '99.00', centroId: null }
      ]
    };

    const precio = calcularPrecioHora(trabajador, null, 'NORMAL');
    expect(precio).toBe(12.5);
  });

  // --- Acuerdos por centro ---
  test('acuerdo específico de centro se aplica cuando coincide centroId', () => {
    const trabajador = {
      ...trabajadorBase,
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PRECIO_HORA', valor: '18.00', centroId: 5 }
      ]
    };

    const precio = calcularPrecioHora(trabajador, 5, 'NORMAL');
    expect(precio).toBe(18.0);
  });

  test('acuerdo de otro centro no se aplica', () => {
    const trabajador = {
      ...trabajadorBase,
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PRECIO_HORA', valor: '18.00', centroId: 5 }
      ]
    };

    const precio = calcularPrecioHora(trabajador, 10, 'NORMAL');
    expect(precio).toBe(12.5);
  });

  test('acuerdo sin centroId aplica a todos los centros', () => {
    const trabajador = {
      ...trabajadorBase,
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PRECIO_HORA', valor: '16.00', centroId: null }
      ]
    };

    const precio = calcularPrecioHora(trabajador, 99, 'NORMAL');
    expect(precio).toBe(16.0);
  });

  // --- Edge cases ---
  test('sin acuerdos individuales (undefined)', () => {
    const trabajador = {
      categoria: trabajadorBase.categoria,
      acuerdosIndividuales: undefined
    };

    const precio = calcularPrecioHora(trabajador, null, 'NORMAL');
    expect(precio).toBe(12.5);
  });

  test('recargo 0% devuelve precio base', () => {
    const trabajador = {
      ...trabajadorBase,
      categoria: {
        ...trabajadorBase.categoria,
        recargoNocturno: '0'
      }
    };

    const precio = calcularPrecioHora(trabajador, null, 'NOCTURNA');
    expect(precio).toBe(12.5);
  });
});

// ============================================================
// calcularPlusesMensuales
// ============================================================
describe('calcularPlusesMensuales', () => {
  test('suma plusTransporte + plusPeligrosidad de categoría', () => {
    const trabajador = {
      categoria: {
        plusTransporte: '50.00',
        plusPeligrosidad: '30.00'
      },
      acuerdosIndividuales: []
    };

    const plus = calcularPlusesMensuales(trabajador);
    expect(plus).toBe(80);
  });

  test('pluses 0 retorna 0', () => {
    const trabajador = {
      categoria: {
        plusTransporte: '0',
        plusPeligrosidad: '0'
      },
      acuerdosIndividuales: []
    };

    const plus = calcularPlusesMensuales(trabajador);
    expect(plus).toBe(0);
  });

  test('suma acuerdos PLUS_MENSUAL activos', () => {
    const trabajador = {
      categoria: {
        plusTransporte: '50.00',
        plusPeligrosidad: '0'
      },
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PLUS_MENSUAL', valor: '100.00', centroId: null },
        { activo: true, tipoAcuerdo: 'PLUS_MENSUAL', valor: '25.00', centroId: null }
      ]
    };

    const plus = calcularPlusesMensuales(trabajador);
    expect(plus).toBe(175); // 50 + 0 + 100 + 25
  });

  test('ignora acuerdos inactivos', () => {
    const trabajador = {
      categoria: {
        plusTransporte: '50.00',
        plusPeligrosidad: '0'
      },
      acuerdosIndividuales: [
        { activo: false, tipoAcuerdo: 'PLUS_MENSUAL', valor: '999.00', centroId: null }
      ]
    };

    const plus = calcularPlusesMensuales(trabajador);
    expect(plus).toBe(50);
  });

  test('ignora acuerdos PRECIO_HORA (solo suma PLUS_MENSUAL)', () => {
    const trabajador = {
      categoria: {
        plusTransporte: '50.00',
        plusPeligrosidad: '0'
      },
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PRECIO_HORA', valor: '999.00', centroId: null }
      ]
    };

    const plus = calcularPlusesMensuales(trabajador);
    expect(plus).toBe(50);
  });

  test('acuerdo PLUS_MENSUAL específico de centro se aplica cuando coincide', () => {
    const trabajador = {
      categoria: {
        plusTransporte: '0',
        plusPeligrosidad: '0'
      },
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PLUS_MENSUAL', valor: '75.00', centroId: 5 }
      ]
    };

    const plus = calcularPlusesMensuales(trabajador, 5);
    expect(plus).toBe(75);
  });

  test('acuerdo de otro centro no se suma', () => {
    const trabajador = {
      categoria: {
        plusTransporte: '0',
        plusPeligrosidad: '0'
      },
      acuerdosIndividuales: [
        { activo: true, tipoAcuerdo: 'PLUS_MENSUAL', valor: '75.00', centroId: 5 }
      ]
    };

    const plus = calcularPlusesMensuales(trabajador, 10);
    expect(plus).toBe(0);
  });

  test('sin acuerdosIndividuales (undefined)', () => {
    const trabajador = {
      categoria: {
        plusTransporte: '20.00',
        plusPeligrosidad: '10.00'
      },
      acuerdosIndividuales: undefined
    };

    const plus = calcularPlusesMensuales(trabajador);
    expect(plus).toBe(30);
  });

  test('plusTransporte null se trata como 0', () => {
    const trabajador = {
      categoria: {
        plusTransporte: null,
        plusPeligrosidad: '10.00'
      },
      acuerdosIndividuales: []
    };

    const plus = calcularPlusesMensuales(trabajador);
    expect(plus).toBe(10);
  });
});
