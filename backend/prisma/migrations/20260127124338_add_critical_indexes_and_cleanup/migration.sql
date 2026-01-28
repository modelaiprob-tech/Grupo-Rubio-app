/*
  Warnings:

  - You are about to drop the column `datos_antes` on the `historial_cambios` table. All the data in the column will be lost.
  - You are about to drop the column `datos_despues` on the `historial_cambios` table. All the data in the column will be lost.
  - You are about to drop the column `ip_usuario` on the `historial_cambios` table. All the data in the column will be lost.
  - You are about to drop the column `tipo_operacion` on the `historial_cambios` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "historial_cambios" DROP COLUMN "datos_antes",
DROP COLUMN "datos_despues",
DROP COLUMN "ip_usuario",
DROP COLUMN "tipo_operacion";

-- CreateIndex
CREATE INDEX "asignaciones_fecha_estado_idx" ON "asignaciones"("fecha", "estado");

-- CreateIndex
CREATE INDEX "asignaciones_centro_id_fecha_estado_idx" ON "asignaciones"("centro_id", "fecha", "estado");

-- CreateIndex
CREATE INDEX "asignaciones_trabajador_id_estado_fecha_idx" ON "asignaciones"("trabajador_id", "estado", "fecha");

-- RenameIndex
ALTER INDEX "idx_asignaciones_centro_fecha" RENAME TO "asignaciones_centro_id_fecha_idx";

-- RenameIndex
ALTER INDEX "idx_asignaciones_trabajador_fecha" RENAME TO "asignaciones_trabajador_id_fecha_idx";
