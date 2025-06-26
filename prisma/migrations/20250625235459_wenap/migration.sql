/*
  Warnings:

  - You are about to alter the column `estado` on the `Actividad` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.

*/
-- AlterTable
ALTER TABLE `Actividad` MODIFY `estado` ENUM('Programada', 'Cancelada', 'Completada') NOT NULL DEFAULT 'Programada';
