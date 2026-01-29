-- CreateTable
CREATE TABLE "horarios_fijos" (
    "id" SERIAL NOT NULL,
    "trabajador_id" INTEGER NOT NULL,
    "centro_id" INTEGER NOT NULL,
    "lunes" BOOLEAN NOT NULL DEFAULT false,
    "martes" BOOLEAN NOT NULL DEFAULT false,
    "miercoles" BOOLEAN NOT NULL DEFAULT false,
    "jueves" BOOLEAN NOT NULL DEFAULT false,
    "viernes" BOOLEAN NOT NULL DEFAULT false,
    "sabado" BOOLEAN NOT NULL DEFAULT false,
    "domingo" BOOLEAN NOT NULL DEFAULT false,
    "hora_inicio" TEXT NOT NULL,
    "hora_fin" TEXT NOT NULL,
    "fecha_inicio" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_fin" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "notas" TEXT,
    "creado_por_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "horarios_fijos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "horarios_fijos_trabajador_id_activo_idx" ON "horarios_fijos"("trabajador_id", "activo");

-- CreateIndex
CREATE INDEX "horarios_fijos_centro_id_activo_idx" ON "horarios_fijos"("centro_id", "activo");

-- AddForeignKey
ALTER TABLE "horarios_fijos" ADD CONSTRAINT "horarios_fijos_trabajador_id_fkey" FOREIGN KEY ("trabajador_id") REFERENCES "trabajadores"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "horarios_fijos" ADD CONSTRAINT "horarios_fijos_centro_id_fkey" FOREIGN KEY ("centro_id") REFERENCES "centros_trabajo"("id") ON DELETE CASCADE ON UPDATE CASCADE;
