-- DropForeignKey
ALTER TABLE `Actividad` DROP FOREIGN KEY `Actividad_socioId_fkey`;

-- DropIndex
DROP INDEX `Actividad_socioId_fkey` ON `Actividad`;
