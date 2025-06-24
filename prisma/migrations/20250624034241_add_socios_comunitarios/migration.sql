/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `SocioComunitario` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `SocioComunitario` ADD COLUMN `activo` BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX `SocioComunitario_nombre_key` ON `SocioComunitario`(`nombre`);
