-- AlterTable
ALTER TABLE "asignaciones" ADD COLUMN     "editado_por_id" INTEGER,
ADD COLUMN     "fecha_edicion" TIMESTAMP(3),
ADD COLUMN     "origen" TEXT NOT NULL DEFAULT 'PLANIFICACION';

-- AlterTable
ALTER TABLE "categorias" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "plus_peligrosidad" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "plus_transporte" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "recargo_extra" DECIMAL(5,2) NOT NULL DEFAULT 75,
ADD COLUMN     "recargo_extra_adicional" DECIMAL(5,2) NOT NULL DEFAULT 100,
ADD COLUMN     "recargo_festivo" DECIMAL(5,2) NOT NULL DEFAULT 75,
ADD COLUMN     "recargo_nocturno" DECIMAL(5,2) NOT NULL DEFAULT 25;

-- AlterTable
ALTER TABLE "tipos_ausencia" ADD COLUMN     "base_calculo" TEXT NOT NULL DEFAULT 'SALARIO_BASE',
ADD COLUMN     "dias_carencia" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "incluye_domingos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "incluye_festivos" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "pagador" TEXT NOT NULL DEFAULT 'EMPRESA',
ADD COLUMN     "porcentaje_cobro" DECIMAL(5,2) NOT NULL DEFAULT 100,
ADD COLUMN     "requiere_alta_medica" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "tipo_justificante" TEXT NOT NULL DEFAULT 'MEDICO',
ADD COLUMN     "tope_diario_euros" DECIMAL(10,2),
ADD COLUMN     "tramos_json" TEXT,
ADD COLUMN     "usa_tramos" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "acuerdos_individuales" (
    "id" SERIAL NOT NULL,
    "trabajador_id" INTEGER NOT NULL,
    "tipo_acuerdo" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "centro_id" INTEGER,
    "descripcion" TEXT,
    "fecha_inicio" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "acuerdos_individuales_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "acuerdos_individuales_trabajador_id_activo_idx" ON "acuerdos_individuales"("trabajador_id", "activo");

-- AddForeignKey
ALTER TABLE "asignaciones" ADD CONSTRAINT "asignaciones_editado_por_id_fkey" FOREIGN KEY ("editado_por_id") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acuerdos_individuales" ADD CONSTRAINT "acuerdos_individuales_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acuerdos_individuales" ADD CONSTRAINT "acuerdos_individuales_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros_trabajo"("id") ON DELETE SET NULL ON UPDATE CASCADE;
