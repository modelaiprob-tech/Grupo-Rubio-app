-- CreateEnum
CREATE TYPE "Rol" AS ENUM ('ADMIN', 'PLANIFICADOR', 'RRHH', 'TRABAJADOR');

-- CreateEnum
CREATE TYPE "TipoContrato" AS ENUM ('INDEFINIDO', 'TEMPORAL', 'OBRA_SERVICIO', 'INTERINIDAD', 'FORMACION', 'ETT');

-- CreateEnum
CREATE TYPE "EstadoAusencia" AS ENUM ('PENDIENTE', 'APROBADA', 'RECHAZADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoAsignacion" AS ENUM ('PROGRAMADO', 'EN_CURSO', 'COMPLETADO', 'CANCELADO', 'NO_PRESENTADO');

-- CreateTable
CREATE TABLE "usuarios" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "rol" "Rol" NOT NULL DEFAULT 'TRABAJADOR',
    "trabajador_id" INTEGER,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "salario_base" DECIMAL(10,2) NOT NULL,
    "plus_convenio" DECIMAL(10,2) NOT NULL,
    "precio_hora" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajadores" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dni" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "codigo_postal" TEXT,
    "localidad" TEXT,
    "fecha_nacimiento" TIMESTAMP(3),
    "fecha_alta" TIMESTAMP(3) NOT NULL,
    "fecha_baja" TIMESTAMP(3),
    "categoria_id" INTEGER NOT NULL,
    "tipo_contrato" "TipoContrato" NOT NULL,
    "horas_contrato" DECIMAL(5,2) NOT NULL,
    "coste_hora" DECIMAL(10,2),
    "numero_seguridad_social" TEXT,
    "cuenta_bancaria" TEXT,
    "dias_vacaciones_anuales" INTEGER NOT NULL DEFAULT 37,
    "dias_asuntos_propios" INTEGER NOT NULL DEFAULT 9,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trabajadores_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "cif" TEXT NOT NULL,
    "direccion" TEXT,
    "codigo_postal" TEXT,
    "localidad" TEXT,
    "provincia" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "contacto_nombre" TEXT,
    "contacto_telefono" TEXT,
    "contacto_email" TEXT,
    "tipo_cliente" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "centros_trabajo" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "codigo_postal" TEXT,
    "localidad" TEXT,
    "telefono" TEXT,
    "contacto" TEXT,
    "horario_apertura" TEXT,
    "horario_cierre" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "horario_limpieza_inicio" VARCHAR(10),
    "horario_limpieza_fin" VARCHAR(10),
    "flexibilidad_horaria" VARCHAR(20) DEFAULT 'FLEXIBLE',
    "tipo_servicio" VARCHAR(20) DEFAULT 'FRECUENTE',
    "frecuencia" VARCHAR(30),
    "dias_servicio" VARCHAR(50),
    "observaciones_horarias" TEXT,

    CONSTRAINT "centros_trabajo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trabajador_centro" (
    "id" SERIAL NOT NULL,
    "trabajador_id" INTEGER NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "es_habitual" BOOLEAN NOT NULL DEFAULT false,
    "horario_defecto" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trabajador_centro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipos_ausencia" (
    "id" SERIAL NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "resta_vacaciones" BOOLEAN NOT NULL DEFAULT false,
    "resta_asuntos" BOOLEAN NOT NULL DEFAULT false,
    "pagada" BOOLEAN NOT NULL DEFAULT true,
    "color_hex" TEXT NOT NULL DEFAULT '#6B7280',
    "dias_maximo" INTEGER,
    "requiere_justificante" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tipos_ausencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ausencias" (
    "id" SERIAL NOT NULL,
    "trabajador_id" INTEGER NOT NULL,
    "tipo_ausencia_id" INTEGER NOT NULL,
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin" DATE NOT NULL,
    "dias_totales" INTEGER NOT NULL,
    "motivo" TEXT,
    "estado" "EstadoAusencia" NOT NULL DEFAULT 'PENDIENTE',
    "aprobado_por_id" INTEGER,
    "fecha_aprobacion" TIMESTAMP(3),
    "documento_url" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ausencias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "asignaciones" (
    "id" SERIAL NOT NULL,
    "trabajador_id" INTEGER NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "horas_planificadas" DECIMAL(5,2) NOT NULL,
    "tipo_servicio" TEXT,
    "estado" "EstadoAsignacion" NOT NULL DEFAULT 'PROGRAMADO',
    "notas" TEXT,
    "creado_por_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asignaciones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "registro_horas" (
    "id" SERIAL NOT NULL,
    "asignacion_id" INTEGER,
    "trabajador_id" INTEGER NOT NULL,
    "fecha" DATE NOT NULL,
    "hora_entrada_real" TIMESTAMP(3),
    "hora_salida_real" TIMESTAMP(3),
    "horas_normales" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "horas_extra" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "horas_nocturnas" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "horas_festivo" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "minutos_descanso" INTEGER NOT NULL DEFAULT 0,
    "validado" BOOLEAN NOT NULL DEFAULT false,
    "validado_por_id" INTEGER,
    "fecha_validacion" TIMESTAMP(3),
    "ip_fichaje" TEXT,
    "dispositivo_id" TEXT,
    "geolatitud" DECIMAL(10,8),
    "geolongitud" DECIMAL(11,8),
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "registro_horas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "historial_cambios" (
    "id" SERIAL NOT NULL,
    "tabla_afectada" TEXT NOT NULL,
    "registro_id" INTEGER NOT NULL,
    "accion" TEXT NOT NULL,
    "datos_anteriores" JSONB,
    "datos_nuevos" JSONB,
    "motivo_cambio" TEXT,
    "usuario_id" INTEGER,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_operacion" VARCHAR(20) NOT NULL DEFAULT 'UPDATE',
    "ip_usuario" VARCHAR(45),
    "datos_antes" JSONB,
    "datos_despues" JSONB,

    CONSTRAINT "historial_cambios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festivos" (
    "id" SERIAL NOT NULL,
    "fecha" DATE NOT NULL,
    "nombre" TEXT NOT NULL,
    "ambito" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "festivos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "configuracion" (
    "id" SERIAL NOT NULL,
    "clave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descripcion" TEXT,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "configuracion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "disponibilidad_trabajador" (
    "id" SERIAL NOT NULL,
    "trabajador_id" INTEGER NOT NULL,
    "dia_semana" INTEGER NOT NULL,
    "hora_inicio" TIME(6) NOT NULL,
    "hora_fin" TIME(6) NOT NULL,
    "activo" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "disponibilidad_trabajador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_turnos" (
    "id" SERIAL NOT NULL,
    "nombre" VARCHAR(100) NOT NULL,
    "centro_id" INTEGER,
    "descripcion" TEXT,
    "creado_por_id" INTEGER,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantillas_turnos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantillas_turnos_detalle" (
    "id" SERIAL NOT NULL,
    "plantilla_id" INTEGER,
    "trabajador_id" INTEGER,
    "dia_semana" INTEGER,
    "hora_inicio" VARCHAR(10) NOT NULL,
    "hora_fin" VARCHAR(10) NOT NULL,
    "created_at" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "plantillas_turnos_detalle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_trabajador_id_key" ON "usuarios"("trabajador_id");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_codigo_key" ON "categorias"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "trabajadores_dni_key" ON "trabajadores"("dni");

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cif_key" ON "clientes"("cif");

-- CreateIndex
CREATE UNIQUE INDEX "trabajador_centro_trabajador_id_centro_id_key" ON "trabajador_centro"("trabajador_id", "centro_id");

-- CreateIndex
CREATE UNIQUE INDEX "tipos_ausencia_codigo_key" ON "tipos_ausencia"("codigo");

-- CreateIndex
CREATE INDEX "idx_asignaciones_centro_fecha" ON "asignaciones"("centro_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_asignaciones_trabajador_fecha" ON "asignaciones"("trabajador_id", "fecha");

-- CreateIndex
CREATE UNIQUE INDEX "asignaciones_trabajador_id_centro_id_fecha_hora_inicio_key" ON "asignaciones"("trabajador_id", "centro_id", "fecha", "hora_inicio");

-- CreateIndex
CREATE UNIQUE INDEX "registro_horas_asignacion_id_key" ON "registro_horas"("asignacion_id");

-- CreateIndex
CREATE INDEX "idx_registro_horas_trabajador_fecha" ON "registro_horas"("trabajador_id", "fecha");

-- CreateIndex
CREATE INDEX "idx_historial_tabla_registro" ON "historial_cambios"("tabla_afectada", "registro_id", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "festivos_fecha_ambito_key" ON "festivos"("fecha", "ambito");

-- CreateIndex
CREATE UNIQUE INDEX "configuracion_clave_key" ON "configuracion"("clave");

-- CreateIndex
CREATE UNIQUE INDEX "disponibilidad_trabajador_trabajador_id_dia_semana_hora_ini_key" ON "disponibilidad_trabajador"("trabajador_id", "dia_semana", "hora_inicio");

-- AddForeignKey
ALTER TABLE "usuarios" ADD CONSTRAINT "usuarios_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajadores" ADD CONSTRAINT "trabajadores_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "centros_trabajo" ADD CONSTRAINT "centros_trabajo_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_centro" ADD CONSTRAINT "trabajador_centro_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "trabajador_centro" ADD CONSTRAINT "trabajador_centro_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ausencias" ADD CONSTRAINT "ausencias_aprobado_por_id_fkey" FOREIGN KEY ("aprobado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ausencias" ADD CONSTRAINT "ausencias_tipo_ausencia_id_fkey" FOREIGN KEY ("tipo_ausencia_id") REFERENCES "tipos_ausencia"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ausencias" ADD CONSTRAINT "ausencias_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros_trabajo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_horas" ADD CONSTRAINT "registro_horas_asignacion_id_fkey" FOREIGN KEY ("asignacion_id") REFERENCES "asignaciones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_horas" ADD CONSTRAINT "registro_horas_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "registro_horas" ADD CONSTRAINT "registro_horas_validado_por_id_fkey" FOREIGN KEY ("validado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "historial_cambios" ADD CONSTRAINT "historial_cambios_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "disponibilidad_trabajador" ADD CONSTRAINT "disponibilidad_trabajador_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plantillas_turnos" ADD CONSTRAINT "plantillas_turnos_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros_trabajo"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plantillas_turnos" ADD CONSTRAINT "plantillas_turnos_creado_por_id_fkey" FOREIGN KEY ("creado_por_id") REFERENCES "usuarios"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plantillas_turnos_detalle" ADD CONSTRAINT "plantillas_turnos_detalle_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantillas_turnos"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "plantillas_turnos_detalle" ADD CONSTRAINT "plantillas_turnos_detalle_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
