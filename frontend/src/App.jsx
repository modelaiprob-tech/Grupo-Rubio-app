import React, { useState, useEffect } from 'react'
import Plantillas from './pages/Plantillas'
import Ausencias from './pages/Ausencias'
import Informes from './pages/Informes';
import HorariosFijos from './pages/HorariosFijos';
import GenerarAsignacionesAutomaticas from './pages/GenerarAsignacionesAutomaticas';
import { useAusencias } from './hooks/useAusencias';
import { useApi } from './utils/api';
import Modal from './components/Modal';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import PlanificacionPage from './pages/PlanificacionPage';
import TrabajadoresPage from './pages/TrabajadoresPage';
import ClientesPage from './pages/ClientesPage';
import RRHHPage from './pages/RRHHPage';
import ControlHorasPage from './pages/ControlHorasPage';
import Sidebar from './components/Sidebar';


  // Componente para tarjeta desplegable de centro sin cubrir
  function CentroSinCubrirCard({ grupo, setCurrentPage }) {
    const [desplegado, setDesplegado] = useState(false);

    return (
      <div className="border border-red-200 rounded-xl overflow-hidden bg-red-50">
        {/* Header clickeable */}
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
                  e.stopPropagation();
                  setCurrentPage('planificacion');
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
              >
                Asignar →
              </button>
            </div>
          </div>
        </div>

        {/* Lista desplegable de días */}
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
    );
  
  }

  
  // Página placeholder
  function PlaceholderPage({ title }) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">{title}</h1>
        <div className="bg-white rounded-2xl p-12 shadow-sm border border-slate-100 text-center">
          <p className="text-slate-500 text-lg">🚧 En construcción</p>
          <p className="text-slate-400 mt-2">Esta sección estará disponible próximamente</p>
        </div>
      </div>
    )
  }

  // Aplicación principal
  function MainApp({ user, onLogout, api }) {
    const [currentPage, setCurrentPage] = useState('dashboard')

    const menuItems = [
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'planificacion', label: 'Planificación' },
      { id: 'plantillas', label: 'Plantillas' },
      { id: 'trabajadores', label: 'Trabajadores' },
      { id: 'clientes', label: 'Clientes' },
      { id: 'ausencias', label: 'Ausencias' },
      { id: 'informes', label: 'Informes' },
      { id: 'rrhh', label: 'RR.HH' },
    ]


    const renderPage = () => {
      switch (currentPage) {
        case 'dashboard':
          return <DashboardPage api={api} setCurrentPage={setCurrentPage} />
        case 'planificacion':
          return <PlanificacionPage api={api} />
        case 'plantillas':
          return <Plantillas api={api} />
        case 'trabajadores':
          return <TrabajadoresPage api={api} />
        case 'clientes':
          return <ClientesPage api={api} />
        case 'ausencias':
          return <Ausencias api={api} />
        case 'informes':  // 👈 AÑADIR ESTAS 2 LÍNEAS
          return <Informes api={api} />
          case 'rrhh':
  return <RRHHPage api={api} />
        default:
          return <PlaceholderPage title={menuItems.find(m => m.id === currentPage)?.label || 'Página'} />
      }
    }


    return (
      <div className="flex h-screen bg-slate-100">
       <Sidebar 
  currentPage={currentPage} 
  setCurrentPage={setCurrentPage} 
  user={user} 
  onLogout={onLogout} 
/>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {renderPage()}

        </main>
      </div>
    )
  }

  // App Root
  export default function App() {
    const api = useApi()
    const [user, setUser] = useState(null)
    const [checking, setChecking] = useState(true)

    useEffect(() => {
      const checkAuth = async () => {
        if (api.token) {
          try {
            const userData = await api.get('/auth/me')
            if (userData.id) {
              setUser(userData)
            }
          } catch (err) {
            api.logout()
          }
        }
        setChecking(false)
      }
      checkAuth()
    }, [api.token])

    const handleLogout = () => {
      api.logout()
      setUser(null)
    }

    if (checking) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center">
          <div className="text-white">Cargando...</div>
        </div>
      )
    }

    if (!user) {
      return <LoginPage onLogin={setUser} api={api} />
    }

    return <MainApp user={user} onLogout={handleLogout} api={api} />
  }// Force rebuild 
