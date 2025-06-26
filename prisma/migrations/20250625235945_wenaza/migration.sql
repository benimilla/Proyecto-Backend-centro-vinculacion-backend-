/*
  Warnings:

  - You are about to alter the column `periodicidad` on the `Actividad` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(0))`.
  - You are about to alter the column `estado` on the `Cita` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(2))`.

*/
-- AlterTable
ALTER TABLE `Actividad` MODIFY `periodicidad` ENUM('Puntual', 'Periódica') NOT NULL;

-- AlterTable
ALTER TABLE `Cita` MODIFY `estado` ENUM('Programada', 'Cancelada', 'Completada') NOT NULL DEFAULT 'Programada';
