import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function CentroSinCubrirCard({ grupo }) {
  const [desplegado, setDesplegado] = useState(false)
  const navigate = useNavigate()

  return (
    <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50">
      <div
        className="p-4 cursor-pointer hover:bg-red-100 transition-colors"
        onClick={() => setDesplegado(!desplegado)}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{desplegado ? '📂' : '📁'}</span>
              <div>
                <p className="font-bold text-red-800 text-lg">{grupo.centro}</p>
                <p className="text-sm text-red-600">{grupo.cliente}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-3xl font-bold text-red-700">{grupo.dias.length}</p>
              <p className="text-xs text-red-600">días sin cubrir</p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                navigate('/planificacion')
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
            >
              Asignar →
            </button>
          </div>
        </div>
      </div>

      {desplegado && (
        <div className="border-t border-red-200 bg-white">
          <div className="p-4 space-y-2">
            {grupo.dias
              .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
              .map((dia, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-red-700 min-w-[40px]">{dia.diaSemana}</span>
                    <span className="text-red-600">
                      {new Date(dia.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </span>
                  </div>
                  <span className="text-sm text-red-500 font-medium">{dia.horario}</span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}
