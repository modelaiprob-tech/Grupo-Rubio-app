-- AlterTable: Añadir campos de perfil personal al trabajador
ALTER TABLE "trabajadores" ADD COLUMN "nacionalidad" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "estado_civil" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "genero" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "provincia" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "pais" TEXT DEFAULT 'España';
ALTER TABLE "trabajadores" ADD COLUMN "email_personal" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "telefono_personal" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "telefono_emergencia" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "tipo_identificacion" TEXT DEFAULT 'DNI';
ALTER TABLE "trabajadores" ADD COLUMN "identificacion_secundaria" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "tipo_identificacion_secundaria" TEXT;
ALTER TABLE "trabajadores" ADD COLUMN "compartir_cumpleanos" BOOLEAN NOT NULL DEFAULT false;
