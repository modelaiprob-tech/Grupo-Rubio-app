// ============================================
// TIPOS: Entidades principales del dominio
// Basados en el schema Prisma del backend
// ============================================

// --- Enums ---

export type Rol = 'ADMIN' | 'PLANIFICADOR' | 'RRHH' | 'TRABAJADOR';

export type TipoContrato =
  | 'INDEFINIDO'
  | 'TEMPORAL'
  | 'OBRA_SERVICIO'
  | 'INTERINIDAD'
  | 'FORMACION'
  | 'ETT';

export type EstadoAusencia = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'CANCELADA';

export type EstadoAsignacion =
  | 'PROGRAMADO'
  | 'EN_CURSO'
  | 'COMPLETADO'
  | 'CANCELADO'
  | 'NO_PRESENTADO';

// --- Usuario ---

export interface Usuario {
  id: number;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
  ultimoAcceso?: string | null;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  user: Pick<Usuario, 'id' | 'email' | 'nombre' | 'rol'>;
}

// --- Categoría ---

export interface Categoria {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  salarioBase: number;
  plusConvenio: number;
  precioHora: number;
  recargoNocturno: number;
  recargoFestivo: number;
  recargoExtra: number;
  recargoExtraAdicional: number;
  plusTransporte: number;
  plusPeligrosidad: number;
  activo: boolean;
}

// --- Trabajador ---

export interface Trabajador {
  id: number;
  nombre: string;
  apellidos: string;
  dni: string;
  telefono?: string | null;
  email?: string | null;
  direccion?: string | null;
  codigoPostal?: string | null;
  localidad?: string | null;
  fechaNacimiento?: string | null;
  fechaAlta: string;
  fechaBaja?: string | null;
  categoriaId: number;
  tipoContrato: TipoContrato;
  horasContrato: number;
  costeHora?: number | null;
  numeroSeguridadSocial?: string | null;
  cuentaBancaria?: string | null;
  diasVacacionesAnuales: number;
  diasAsuntosPropios: number;
  activo: boolean;
  notas?: string | null;
  // Campos de perfil personal
  nacionalidad?: string | null;
  estadoCivil?: string | null;
  genero?: string | null;
  provincia?: string | null;
  pais?: string | null;
  emailPersonal?: string | null;
  telefonoPersonal?: string | null;
  telefonoEmergencia?: string | null;
  tipoIdentificacion?: string | null;
  identificacionSecundaria?: string | null;
  tipoIdentificacionSecundaria?: string | null;
  compartirCumpleanos?: boolean;
  // Relaciones incluidas en las respuestas
  categoria?: Categoria;
  centrosAsignados?: TrabajadorCentro[];
}

export interface TrabajadorConSaldos extends Trabajador {
  saldos: {
    vacaciones: { usados: number; total: number };
    asuntosPropios: { usados: number; total: number };
  };
}

// --- Cliente ---

export interface Cliente {
  id: number;
  nombre: string;
  cif: string;
  direccion?: string | null;
  codigoPostal?: string | null;
  localidad?: string | null;
  provincia?: string | null;
  telefono?: string | null;
  email?: string | null;
  contactoNombre?: string | null;
  contactoTelefono?: string | null;
  contactoEmail?: string | null;
  tipoCliente?: string | null;
  activo: boolean;
  notas?: string | null;
  centrosTrabajo?: CentroTrabajo[];
}

// --- Centro de Trabajo ---

export interface CentroTrabajo {
  id: number;
  clienteId: number;
  nombre: string;
  direccion?: string | null;
  horarioApertura?: string | null;
  horarioCierre?: string | null;
  tipoHorarioLimpieza: 'FIJO' | 'FLEXIBLE';
  activo: boolean;
  notas?: string | null;
  // Relaciones
  cliente?: Cliente;
  horariosLimpieza?: HorarioLimpieza[];
  trabajadoresAsignados?: TrabajadorCentro[];
}

export interface HorarioLimpieza {
  id: number;
  centroId: number;
  inicio: string;
  fin: string;
  orden: number;
  activo: boolean;
}

export interface TrabajadorCentro {
  id: number;
  trabajadorId: number;
  centroId: number;
  esHabitual: boolean;
  centro?: CentroTrabajo;
  trabajador?: Trabajador;
}

// --- Asignación ---

export interface Asignacion {
  id: number;
  trabajadorId: number;
  centroId: number;
  fecha: string;
  horaInicio: string;
  horaFin: string;
  horasPlanificadas: number;
  tipoServicio?: string | null;
  estado: EstadoAsignacion;
  notas?: string | null;
  requiereAtencion: boolean;
  // Relaciones
  trabajador?: Pick<Trabajador, 'id' | 'nombre' | 'apellidos'>;
  centro?: Pick<CentroTrabajo, 'id' | 'nombre'>;
}

export interface CrearAsignacionResponse {
  asignacion: Asignacion;
  alertas: Array<{
    tipo: 'HORAS_EXTRA' | 'NOCTURNAS' | 'FESTIVO';
    mensaje: string;
  }>;
  detalleHoras: {
    horasNormales: number;
    horasExtra: number;
    horasNocturnas: number;
    horasFestivo: number;
    excedioContrato: boolean;
    horasContrato: number;
    horasAcumuladasSemana: number;
  };
}

// --- Ausencia ---

export interface TipoAusencia {
  id: number;
  codigo: string;
  nombre: string;
  descripcion?: string | null;
  restaVacaciones: boolean;
  restaAsuntos: boolean;
  pagada: boolean;
  colorHex: string;
  activo: boolean;
}

export interface Ausencia {
  id: number;
  trabajadorId: number;
  tipoAusenciaId: number;
  fechaInicio: string;
  fechaFin: string;
  diasTotales: number;
  motivo?: string | null;
  estado: EstadoAusencia;
  archivada: boolean;
  // Relaciones
  trabajador?: Pick<Trabajador, 'id' | 'nombre' | 'apellidos'>;
  tipoAusencia?: TipoAusencia;
  aprobadoPor?: Pick<Usuario, 'id' | 'nombre'> | null;
}

// --- Dashboard ---

export interface DashboardStats {
  totalTrabajadores: number;
  totalClientes: number;
  totalCentros: number;
  asignacionesHoy: number;
  ausenciasActivas: number;
  centrosSinCubrir: number;
}

// --- API Client ---

export interface ApiClient {
  get: <T = unknown>(endpoint: string) => Promise<T>;
  post: <T = unknown>(endpoint: string, body?: unknown) => Promise<T>;
  put: <T = unknown>(endpoint: string, body?: unknown) => Promise<T>;
  del: <T = unknown>(endpoint: string, body?: unknown) => Promise<T>;
  token: string | null;
  login: (email: string, password: string) => Promise<LoginResponse>;
  logout: () => void;
}

// --- Error de API ---

export interface ApiError {
  error: string;
  detalles?: string[];
  message?: string;
}
