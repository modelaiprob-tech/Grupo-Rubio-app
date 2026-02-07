// ============================================
// GET /api/informes/calendario-empresa
// Calendario semanal por empresa
// ============================================

const express = require('express');
const router = express.Router();
const prisma = require('../config/prisma');
router.get('/calendario-empresa', async (req, res) => {
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
        cliente: true
      }
    });

    const centroIds = centros.map(c => c.id);

    if (centroIds.length === 0) {
      return res.json({
        cliente: null,
        fechaInicio,
        fechaFin,
        fechas: [],
        trabajadores: []
      });
    }

    // 2. Obtener todas las asignaciones del periodo EN ESOS CENTROS
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

    // 🔥 3. Obtener IDs únicos de trabajadores que trabajan en esos centros
    const trabajadorIds = [...new Set(asignaciones.map(a => a.trabajadorId))];

    if (trabajadorIds.length === 0) {
      return res.json({
        cliente: centros[0]?.cliente || null,
        fechaInicio,
        fechaFin,
        fechas: [],
        trabajadores: []
      });
    }

    // 🔥 4. Obtener SOLO trabajadores que trabajan en este cliente
    const trabajadores = await prisma.trabajador.findMany({
      where: {
        id: { in: trabajadorIds },
        activo: true
      },
      orderBy: [
        { apellidos: 'asc' },
        { nombre: 'asc' }
      ]
    });

    // 🔥 5. Obtener ausencias SOLO de esos trabajadores
    const ausencias = await prisma.ausencia.findMany({
      where: {
        trabajadorId: { in: trabajadorIds },
        fechaInicio: { lte: new Date(fechaFin) },
        fechaFin: { gte: new Date(fechaInicio) },
        estado: { in: ['APROBADA', 'PENDIENTE'] }
      },
      include: {
        tipoAusencia: true
      }
    });

    // 6. Generar array de fechas
    const fechas = [];
    const currentDate = new Date(fechaInicio);
    const endDate = new Date(fechaFin);
    
    while (currentDate <= endDate) {
      fechas.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 7. Construir la matriz
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
          let codigo = 'A';
          let color = 'rojo';
          
          if (tipoAusencia.includes('vacacion')) {
            codigo = 'V';
            color = 'azul';
          } else if (tipoAusencia.includes('baja') || tipoAusencia.includes('médica') || tipoAusencia.includes('medica')) {
            codigo = 'BM';
            color = 'rojo';
          }

          if (ausencia.estado === 'PENDIENTE') {
            codigo = 'BP';
            color = 'amarillo';
          }
          
          fila.dias[fechaStr] = {
            codigo,
            estado: ausencia.estado,
            tipo: ausencia.tipoAusencia?.nombre || 'Ausencia',
            color
          };
        } else {
          // Verificar si trabaja ese día
          const asignacionesDia = asignaciones.filter(a =>
            a.trabajadorId === trabajador.id &&
            a.fecha.toISOString().split('T')[0] === fechaStr
          );

          // Ordenar por hora de inicio
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
              color: ''
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
 
