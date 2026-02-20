// ============================================
// SEED - DATOS INICIALES
// Convenio Limpieza Navarra 2024-2027
// ============================================

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de datos...');

  // ============================================
  // 1. CATEGORÍAS PROFESIONALES
  // Según Convenio Limpieza Navarra 2024-2027
  // ============================================
  console.log('📋 Creando categorías profesionales...');
  
  const categorias = await Promise.all([
    prisma.categoria.upsert({
      where: { codigo: 'PEON' },
      update: {},
      create: {
        codigo: 'PEON',
        nombre: 'Peón de Limpieza',
        descripcion: 'Personal de limpieza sin especialización',
        salarioBase: 1134.00,
        plusConvenio: 85.00,
        precioHora: 9.50,
      },
    }),
    prisma.categoria.upsert({
      where: { codigo: 'PEON_ESP' },
      update: {},
      create: {
        codigo: 'PEON_ESP',
        nombre: 'Peón Especializado',
        descripcion: 'Personal con formación específica',
        salarioBase: 1180.00,
        plusConvenio: 90.00,
        precioHora: 10.20,
      },
    }),
    prisma.categoria.upsert({
      where: { codigo: 'ESPECIALISTA' },
      update: {},
      create: {
        codigo: 'ESPECIALISTA',
        nombre: 'Especialista',
        descripcion: 'Personal cualificado en técnicas especiales',
        salarioBase: 1250.00,
        plusConvenio: 95.00,
        precioHora: 11.00,
      },
    }),
    prisma.categoria.upsert({
      where: { codigo: 'ENCARGADO' },
      update: {},
      create: {
        codigo: 'ENCARGADO',
        nombre: 'Encargado/a',
        descripcion: 'Responsable de equipo o centro',
        salarioBase: 1400.00,
        plusConvenio: 110.00,
        precioHora: 12.50,
      },
    }),
    prisma.categoria.upsert({
      where: { codigo: 'JEFE_EQUIPO' },
      update: {},
      create: {
        codigo: 'JEFE_EQUIPO',
        nombre: 'Jefe/a de Equipo',
        descripcion: 'Coordinador de múltiples centros',
        salarioBase: 1550.00,
        plusConvenio: 120.00,
        precioHora: 14.00,
      },
    }),
  ]);

  console.log(`   ✅ ${categorias.length} categorías creadas`);

  // ============================================
  // 2. TIPOS DE AUSENCIA
  // Según Convenio Limpieza Navarra 2024-2027
  // ============================================
  console.log('🏖️ Creando tipos de ausencia...');

  const tiposAusencia = await Promise.all([
    // Vacaciones
    prisma.tipoAusencia.upsert({
      where: { codigo: 'VAC' },
      update: {},
      create: {
        codigo: 'VAC',
        nombre: 'Vacaciones',
        descripcion: '37 días laborables anuales según convenio',
        restaVacaciones: true,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#10B981', // Verde
        diasMaximo: 37,
        requiereJustificante: false,
      },
    }),
    // Asuntos propios
    prisma.tipoAusencia.upsert({
      where: { codigo: 'AP' },
      update: {},
      create: {
        codigo: 'AP',
        nombre: 'Asuntos Propios',
        descripcion: '9 días tiempo completo / 4 días tiempo parcial',
        restaVacaciones: false,
        restaAsuntos: true,
        pagada: true,
        colorHex: '#3B82F6', // Azul
        diasMaximo: 9,
        requiereJustificante: false,
      },
    }),
    // Baja médica
    prisma.tipoAusencia.upsert({
      where: { codigo: 'BM' },
      update: {},
      create: {
        codigo: 'BM',
        nombre: 'Baja Médica',
        descripcion: 'Incapacidad temporal por enfermedad común',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#EF4444', // Rojo
        diasMaximo: null,
        requiereJustificante: true,
      },
    }),
    // Accidente laboral
    prisma.tipoAusencia.upsert({
      where: { codigo: 'AL' },
      update: {},
      create: {
        codigo: 'AL',
        nombre: 'Accidente Laboral',
        descripcion: 'IT por accidente de trabajo o enfermedad profesional',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#DC2626', // Rojo oscuro
        diasMaximo: null,
        requiereJustificante: true,
      },
    }),
    // Matrimonio - 18 días
    prisma.tipoAusencia.upsert({
      where: { codigo: 'MAT' },
      update: {},
      create: {
        codigo: 'MAT',
        nombre: 'Matrimonio',
        descripcion: '18 días naturales según convenio',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#EC4899', // Rosa
        diasMaximo: 18,
        requiereJustificante: true,
      },
    }),
    // Fallecimiento familiar 1er grado - 3/5 días
    prisma.tipoAusencia.upsert({
      where: { codigo: 'FAL1' },
      update: {},
      create: {
        codigo: 'FAL1',
        nombre: 'Fallecimiento (1er grado)',
        descripcion: 'Cónyuge, padres, hijos, suegros, hermanos: 3 días (5 fuera Navarra)',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#1F2937', // Gris oscuro
        diasMaximo: 5,
        requiereJustificante: true,
      },
    }),
    // Fallecimiento familiar 2º grado - 2/3 días
    prisma.tipoAusencia.upsert({
      where: { codigo: 'FAL2' },
      update: {},
      create: {
        codigo: 'FAL2',
        nombre: 'Fallecimiento (2º grado)',
        descripcion: 'Abuelos, nietos: 2 días (3 fuera Navarra)',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#374151', // Gris
        diasMaximo: 3,
        requiereJustificante: true,
      },
    }),
    // Nacimiento - 3 días
    prisma.tipoAusencia.upsert({
      where: { codigo: 'NAC' },
      update: {},
      create: {
        codigo: 'NAC',
        nombre: 'Nacimiento hijo/a',
        descripcion: '3 días naturales desde el hecho causante',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#8B5CF6', // Violeta
        diasMaximo: 3,
        requiereJustificante: true,
      },
    }),
    // Traslado domicilio - 1 día
    prisma.tipoAusencia.upsert({
      where: { codigo: 'TRA' },
      update: {},
      create: {
        codigo: 'TRA',
        nombre: 'Traslado domicilio',
        descripcion: '1 día natural',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#F59E0B', // Ámbar
        diasMaximo: 1,
        requiereJustificante: true,
      },
    }),
    // Hospitalización/intervención familiar - 2/4 días
    prisma.tipoAusencia.upsert({
      where: { codigo: 'HOS' },
      update: {},
      create: {
        codigo: 'HOS',
        nombre: 'Hospitalización familiar',
        descripcion: 'Hospitalización o enfermedad grave parientes 2º grado: 2 días (4 fuera Navarra)',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#F97316', // Naranja
        diasMaximo: 4,
        requiereJustificante: true,
      },
    }),
    // Horas sindicales
    prisma.tipoAusencia.upsert({
      where: { codigo: 'HS' },
      update: {},
      create: {
        codigo: 'HS',
        nombre: 'Horas Sindicales',
        descripcion: 'Crédito horario representantes sindicales',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#6366F1', // Índigo
        diasMaximo: null,
        requiereJustificante: false,
      },
    }),
    // Permiso sin sueldo
    prisma.tipoAusencia.upsert({
      where: { codigo: 'PSS' },
      update: {},
      create: {
        codigo: 'PSS',
        nombre: 'Permiso sin sueldo',
        descripcion: 'Licencia no retribuida previa solicitud',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: false,
        colorHex: '#9CA3AF', // Gris claro
        diasMaximo: null,
        requiereJustificante: false,
      },
    }),
    // Consulta médica
    prisma.tipoAusencia.upsert({
      where: { codigo: 'MED' },
      update: {},
      create: {
        codigo: 'MED',
        nombre: 'Consulta médica',
        descripcion: 'Tiempo indispensable para asistencia médica',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#14B8A6', // Teal
        diasMaximo: 1,
        requiereJustificante: true,
      },
    }),
    // Acompañamiento consultas oncológicas - 2 jornadas
    prisma.tipoAusencia.upsert({
      where: { codigo: 'ONCO' },
      update: {},
      create: {
        codigo: 'ONCO',
        nombre: 'Acompañamiento oncológico',
        descripcion: 'Acompañamiento consultas oncológicas familiares: 2 jornadas',
        restaVacaciones: false,
        restaAsuntos: false,
        pagada: true,
        colorHex: '#A855F7', // Púrpura
        diasMaximo: 2,
        requiereJustificante: true,
      },
    }),
  ]);

  console.log(`   ✅ ${tiposAusencia.length} tipos de ausencia creados`);

  // ============================================
  // 3. USUARIOS INICIALES
  // ============================================
  console.log('👤 Creando usuarios iniciales...');

  const passwordHash = await bcrypt.hash('GrupoRubio@Admin2026!', 12);
  const passwordManuel = await bcrypt.hash('GrupoRubio@Plan2026!', 12);
  const passwordIrene = await bcrypt.hash('GrupoRubio@RRHH2026!', 12);

  const usuarios = await Promise.all([
    prisma.usuario.upsert({
      where: { email: 'admin@gruporubio.net' },
      update: {},
      create: {
        email: 'admin@gruporubio.net',
        passwordHash: passwordHash,
        nombre: 'Administrador',
        rol: 'ADMIN',
        debeCambiarPassword: true,
      },
    }),
    prisma.usuario.upsert({
      where: { email: 'manuel@gruporubio.net' },
      update: {},
      create: {
        email: 'manuel@gruporubio.net',
        passwordHash: passwordManuel,
        nombre: 'Manuel',
        rol: 'PLANIFICADOR',
        debeCambiarPassword: true,
      },
    }),
    prisma.usuario.upsert({
      where: { email: 'irene@gruporubio.net' },
      update: {},
      create: {
        email: 'irene@gruporubio.net',
        passwordHash: passwordIrene,
        nombre: 'Irene',
        rol: 'RRHH',
        debeCambiarPassword: true,
      },
    }),
  ]);

  console.log(`   ✅ ${usuarios.length} usuarios creados`);

  // ============================================
  // 4. FESTIVOS 2026 NAVARRA
  // ============================================
  console.log('📅 Creando festivos 2026...');

  const festivos2026 = [
    // Nacionales
    { fecha: '2026-01-01', nombre: 'Año Nuevo', ambito: 'Nacional' },
    { fecha: '2026-01-06', nombre: 'Epifanía del Señor', ambito: 'Nacional' },
    { fecha: '2026-04-02', nombre: 'Jueves Santo', ambito: 'Nacional' },
    { fecha: '2026-04-03', nombre: 'Viernes Santo', ambito: 'Nacional' },
    { fecha: '2026-05-01', nombre: 'Fiesta del Trabajo', ambito: 'Nacional' },
    { fecha: '2026-08-15', nombre: 'Asunción de la Virgen', ambito: 'Nacional' },
    { fecha: '2026-10-12', nombre: 'Fiesta Nacional de España', ambito: 'Nacional' },
    { fecha: '2026-11-01', nombre: 'Todos los Santos', ambito: 'Nacional' },
    { fecha: '2026-12-06', nombre: 'Día de la Constitución', ambito: 'Nacional' },
    { fecha: '2026-12-08', nombre: 'Inmaculada Concepción', ambito: 'Nacional' },
    { fecha: '2026-12-25', nombre: 'Navidad', ambito: 'Nacional' },
    // Navarra
    { fecha: '2026-03-19', nombre: 'San José', ambito: 'Navarra' },
    { fecha: '2026-04-06', nombre: 'Lunes de Pascua', ambito: 'Navarra' },
    { fecha: '2026-07-25', nombre: 'Santiago Apóstol', ambito: 'Navarra' },
    { fecha: '2026-12-03', nombre: 'San Francisco Javier', ambito: 'Navarra' },
  ];

  for (const festivo of festivos2026) {
    await prisma.festivo.upsert({
      where: {
        fecha_ambito: {
          fecha: new Date(festivo.fecha),
          ambito: festivo.ambito,
        },
      },
      update: {},
      create: {
        fecha: new Date(festivo.fecha),
        nombre: festivo.nombre,
        ambito: festivo.ambito,
        anio: 2026,
      },
    });
  }

  console.log(`   ✅ ${festivos2026.length} festivos creados`);

  // ============================================
  // 5. CONFIGURACIÓN INICIAL
  // ============================================
  console.log('⚙️ Creando configuración inicial...');

  const configuraciones = [
    { clave: 'EMPRESA_NOMBRE', valor: 'Grupo Rubio Servicios Higiénicos Integrales S.L.', tipo: 'string' },
    { clave: 'EMPRESA_CIF', valor: 'B31XXXXXX', tipo: 'string' },
    { clave: 'EMPRESA_DIRECCION', valor: 'Tudela, Navarra', tipo: 'string' },
    { clave: 'JORNADA_ANUAL_HORAS', valor: '1673.33', tipo: 'number', descripcion: 'Horas anuales según convenio' },
    { clave: 'VACACIONES_DIAS_COMPLETO', valor: '37', tipo: 'number', descripcion: 'Días vacaciones tiempo completo' },
    { clave: 'ASUNTOS_DIAS_COMPLETO', valor: '9', tipo: 'number', descripcion: 'Días asuntos propios tiempo completo' },
    { clave: 'ASUNTOS_DIAS_PARCIAL', valor: '4', tipo: 'number', descripcion: 'Días asuntos propios tiempo parcial' },
    { clave: 'PLUS_FESTIVO_HORA', valor: '3.09', tipo: 'number', descripcion: 'Plus por hora trabajada en festivo' },
    { clave: 'COMPENSACION_FESTIVO', valor: '1.5', tipo: 'number', descripcion: 'Multiplicador compensación festivos' },
  ];

  for (const config of configuraciones) {
    await prisma.configuracion.upsert({
      where: { clave: config.clave },
      update: { valor: config.valor },
      create: config,
    });
  }

  console.log(`   ✅ ${configuraciones.length} configuraciones creadas`);

  console.log('\n✨ Seed completado exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
