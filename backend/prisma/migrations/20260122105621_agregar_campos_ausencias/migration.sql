-- AlterTable
ALTER TABLE "ausencias" ADD COLUMN     "archivada" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "contingencia" TEXT,
ADD COLUMN     "entidad_emisora" TEXT,
ADD COLUMN     "fecha_alta_real" DATE,
ADD COLUMN     "numero_parte" TEXT,
ADD COLUMN     "observaciones" TEXT;

-- CreateIndex
CREATE INDEX "ausencias_archivada_idx" ON "ausencias"("archivada");
