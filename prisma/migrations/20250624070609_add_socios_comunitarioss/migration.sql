/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `Proyecto` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fecha_inicio` to the `Proyecto` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Proyecto` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `descripcion` VARCHAR(191) NULL,
    ADD COLUMN `fecha_fin` DATETIME(3) NULL,
    ADD COLUMN `fecha_inicio` DATETIME(3) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Proyecto_nombre_key` ON `Proyecto`(`nombre`);
