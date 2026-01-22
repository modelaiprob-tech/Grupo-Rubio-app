-- AlterTable
ALTER TABLE "asignaciones" ADD COLUMN     "motivo_atencion" TEXT,
ADD COLUMN     "requiere_atencion" BOOLEAN NOT NULL DEFAULT false;
