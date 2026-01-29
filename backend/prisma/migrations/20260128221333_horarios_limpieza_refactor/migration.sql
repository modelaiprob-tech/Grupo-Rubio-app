/*
  Warnings:

  - You are about to drop the column `flexibilidad_horaria` on the `centros_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `horario_apertura` on the `centros_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `horario_cierre` on the `centros_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `horario_limpieza_fin` on the `centros_trabajo` table. All the data in the column will be lost.
  - You are about to drop the column `horario_limpieza_inicio` on the `centros_trabajo` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "centros_trabajo" DROP COLUMN "flexibilidad_horaria",
DROP COLUMN "horario_apertura",
DROP COLUMN "horario_cierre",
DROP COLUMN "horario_limpieza_fin",
DROP COLUMN "horario_limpieza_inicio",
ADD COLUMN     "horarioApertura" TEXT,
ADD COLUMN     "horarioCierre" TEXT,
ADD COLUMN     "tipo_horario_limpieza" TEXT NOT NULL DEFAULT 'FLEXIBLE';

-- CreateTable
CREATE TABLE "horarios_limpieza" (
    "id" SERIAL NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "inicio" TEXT NOT NULL,
    "fin" TEXT NOT NULL,
    "orden" INTEGER NOT NULL DEFAULT 1,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "horarios_limpieza_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horarios_limpieza_centro_id_activo_idx" ON "horarios_limpieza"("centro_id", "activo");

-- CreateIndex
CREATE INDEX "ausencias_trabajador_id_estado_fecha_inicio_fecha_fin_idx" ON "ausencias"("trabajador_id", "estado", "fecha_inicio", "fecha_fin");

-- AddForeignKey
ALTER TABLE "horarios_limpieza" ADD CONSTRAINT "horarios_limpieza_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
