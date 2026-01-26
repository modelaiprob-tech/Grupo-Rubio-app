// ============================================
// GET /api/informes/calendario-empresa
// Calendario semanal por empresa
// ============================================

const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Aquí empieza tu código actual:
router.get('/calendario-empresa', async (req, res) => {
  // ... resto del código
  try {
    const { clienteId, fechaInicio, fechaFin } = req.query;

    if (!clienteId || !fechaInicio || !fechaFin) {
      return res.status(400).json({ 
        error: 'Faltan parámetros: clienteId, fechaInicio, fechaFin' 
      });
    }

    // 1. Obtener todos los centros del cliente
const centros = await prisma.centroTrabajo.findMany({
  where: { 
    clienteId: parseInt(clienteId),
    activo: true
  },
  include: {
    cliente: true  // ← AÑADIR ESTA LÍNEA
  }
});

    const centroIds = centros.map(c => c.id);

    // 2. Obtener todas las asignaciones del periodo
    const asignaciones = await prisma.asignacion.findMany({
      where: {
        centroId: { in: centroIds },
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        },
        estado: { not: 'CANCELADO' }
      },
      include: {
        trabajador: true,
        centro: true
      }
    });

    /// 3. Obtener todas las ausencias del periodo (SOLO APROBADAS Y PENDIENTES)
const ausencias = await prisma.ausencia.findMany({
  where: {
    fechaInicio: { lte: new Date(fechaFin) },
    fechaFin: { gte: new Date(fechaInicio) },
    estado: { in: ['APROBADA', 'PENDIENTE'] }  // ← AÑADIR ESTA LÍNEA
  }
    });

    // 4. Obtener lista única de trabajadores
    const trabajadoresSet = new Set();
    asignaciones.forEach(a => trabajadoresSet.add(a.trabajadorId));
    ausencias.forEach(a => trabajadoresSet.add(a.trabajadorId));

    const trabajadores = await prisma.trabajador.findMany({
      where: {
        id: { in: Array.from(trabajadoresSet) },
        activo: true
      },
      orderBy: [
        { apellidos: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // 5. Generar array de fechas
    const fechas = [];
    const currentDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    
    while (currentDate <= endDate) {
      fechas.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 6. Construir la matriz
    const matriz = trabajadores.map(trabajador => {
      const fila = {
        trabajadorId: trabajador.id,
        nombre: trabajador.nombre,
        apellidos: trabajador.apellidos,
        dias: {}
      };

      fechas.forEach(fecha => {
        const fechaStr = fecha.toISOString().split('T')[0];
        
        // Verificar ausencias
        const ausencia = ausencias.find(a => {
  const inicioAusencia = new Date(a.fechaInicio);
  const finAusencia = a.fechaAltaReal 
    ? new Date(a.fechaAltaReal) 
    : new Date(a.fechaFin);
  
  return a.trabajadorId === trabajador.id &&
    inicioAusencia <= fecha &&
    finAusencia >= fecha;
});

        if (ausencia) {
          // Hay ausencia
const tipoAusencia = ausencia.tipoAusencia?.nombre?.toLowerCase() || '';
          let codigo = 'A'; // Por defecto
          
          if (tipoAusencia.includes('vacacion')) {
            codigo = 'V';
          } else if (tipoAusencia.includes('baja') || tipoAusencia.includes('médica') || tipoAusencia.includes('medica')) {
            codigo = 'BM';
          }
          
          fila.dias[fechaStr] = {
            codigo: ausencia.estado === 'PENDIENTE' ? 'BP' : codigo,
            estado: ausencia.estado,
            tipo: ausencia.tipoAusencia?.nombre || 'Ausencia',
            color: ausencia.estado === 'PENDIENTE' ? 'amarillo' : 'rojo'
          };
        } else {
  // Verificar si trabaja ese día (pueden ser varias asignaciones = jornada partida)
  const asignacionesDia = asignaciones.filter(a =>
    a.trabajadorId === trabajador.id &&
    a.fecha.toISOString().split('T')[0] === fechaStr
  );
  // ✅ ORDENAR por hora de inicio
asignacionesDia.sort((a, b) => {
  const horaA = a.horaInicio.split(':').map(Number);
  const horaB = b.horaInicio.split(':').map(Number);
  return (horaA[0] * 60 + horaA[1]) - (horaB[0] * 60 + horaB[1]);
});


  if (asignacionesDia.length > 0) {
    // Combinar todos los horarios
    const horarios = asignacionesDia
      .map(a => `${a.horaInicio}-${a.horaFin}`)
      .join('\n');
    
    const centros = [...new Set(asignacionesDia.map(a => a.centro.nombre))].join(', ');

    fila.dias[fechaStr] = {
      codigo: 'X',
      estado: 'TRABAJA',
      centro: centros,
      horario: horarios,
      color: 'verde'
    };
  } else {
    // No trabaja, no tiene ausencia
    fila.dias[fechaStr] = {
      codigo: '-',
      estado: 'LIBRE',
      color: 'gris'
    };
  }
}
      });

      return fila;
    });

    res.json({
      cliente: centros[0]?.cliente || null,
      fechaInicio,
      fechaFin,
      fechas: fechas.map(f => f.toISOString().split('T')[0]),
      trabajadores: matriz
    });

  } catch (error) {
    console.error('Error en calendario-empresa:', error);
    res.status(500).json({ error: 'Error al generar calendario' });
  }
});


module.exports = router;
