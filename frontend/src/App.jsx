import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Componentes que siempre se cargan (shell de la app)
import Sidebar from './components/Sidebar'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/Toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Login se carga estáticamente (primera pantalla)
import LoginPage from './pages/LoginPage'

// Páginas cargadas bajo demanda (code-splitting)
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PlanificacionPage = lazy(() => import('./pages/PlanificacionPage'))
const Plantillas = lazy(() => import('./pages/Plantillas'))
const TrabajadoresPage = lazy(() => import('./pages/TrabajadoresPage'))
const ClientesPage = lazy(() => import('./pages/ClientesPage'))
const Ausencias = lazy(() => import('./pages/Ausencias'))
const Informes = lazy(() => import('./pages/Informes'))
const HorariosFijos = lazy(() => import('./pages/HorariosFijos'))
const RRHHPage = lazy(() => import('./pages/RRHHPage'))
const ControlHorasPage = lazy(() => import('./pages/ControlHorasPage'))
const Ajustes = lazy(() => import('./pages/Ajustes'))
const PerfilTrabajador = lazy(() => import('./pages/PerfilTrabajador'))

// ============================================
// Spinner de carga para Suspense
// ============================================
function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <p className="text-sm text-slate-500">Cargando...</p>
      </div>
    </div>
  )
}

// ============================================
// Página placeholder
// ============================================
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

// ============================================
// Ruta protegida (usa AuthContext)
// ============================================
function ProtectedRoute({ children }) {
  const { isAuthenticated, checking } = useAuth()

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

// ============================================
// Ruta de login (redirige si ya autenticado)
// ============================================
function LoginRoute() {
  const { isAuthenticated, checking } = useAuth()

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Cargando...</div>
      </div>
    )
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  return <LoginPage />
}

// ============================================
// Layout principal con Sidebar
// ============================================
function AppLayout() {
  const { user } = useAuth()

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-auto pt-16 lg:pt-0">
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/planificacion" element={<PlanificacionPage />} />
              <Route path="/plantillas" element={<Plantillas />} />
              <Route path="/trabajadores" element={<TrabajadoresPage />} />
              <Route path="/trabajadores/:id/perfil" element={<PerfilTrabajador />} />
              <Route path="/clientes" element={<ClientesPage />} />
              <Route path="/ausencias" element={<Ausencias />} />
              <Route path="/informes" element={<Informes />} />
              <Route path="/rrhh" element={<RRHHPage />} />
              <Route path="/control-horas" element={<ControlHorasPage />} />
              <Route path="/horarios-fijos" element={<HorariosFijos />} />
              <Route path="/ajustes" element={
                user?.rol === 'ADMIN' ? <Ajustes /> : <Navigate to="/dashboard" replace />
              } />
              <Route path="*" element={<PlaceholderPage title="Página no encontrada" />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>
    </div>
  )
}

// ============================================
// App Root
// ============================================
export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <Routes>
          <Route path="/login" element={<LoginRoute />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          } />
        </Routes>
      </ToastProvider>
    </AuthProvider>
  )
}
