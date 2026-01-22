const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testSolapamiento() {
  console.log('🧪 TEST 1: Intentar crear solapamiento...\n');
  
  try {
    // Intentar asignar a Juan (id=1) el 20/01/2026 de 10:00-12:00
    // Ya tiene un turno ese día de 8:00-14:00
    const turno = await prisma.asignacion.create({
      data: {
        trabajadorId: 1,
        centroId: 2,
        fecha: new Date('2026-01-20'),
        horaInicio: '10:00',
        horaFin: '12:00',
        horasPlanificadas: 2.0,
        estado: 'PROGRAMADO',
      }
    });
    
    console.log('❌ ERROR: Debería haber bloqueado el solapamiento');
  } catch (error) {
    if (error.message.includes('SOLAPAMIENTO')) {
      console.log('✅ CORRECTO: Solapamiento detectado');
      console.log('   Mensaje:', error.message);
    } else {
      console.log('❌ Error inesperado:', error.message);
    }
  }
  
  await prisma.$disconnect();
}

testSolapamiento();