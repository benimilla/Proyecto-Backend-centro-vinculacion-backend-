/*
  Warnings:

  - You are about to alter the column `nombre` on the `Archivo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `ruta` on the `Archivo` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to drop the column `permisos` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `resetToken` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `resetTokenExp` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the column `rol` on the `Usuario` table. All the data in the column will be lost.
  - You are about to drop the `Periodicidad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `actividades` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `actividades_beneficiarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `actividades_oferentes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `beneficiarios` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `citas` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `lugares` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `oferentes` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `proyectos` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `socios_comunitarios` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[nombre]` on the table `TipoActividad` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE `Archivo` DROP FOREIGN KEY `Archivo_actividadId_fkey`;

-- DropForeignKey
ALTER TABLE `PermisoUsuario` DROP FOREIGN KEY `PermisoUsuario_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `actividades` DROP FOREIGN KEY `actividades_creadoPorId_fkey`;

-- DropForeignKey
ALTER TABLE `actividades` DROP FOREIGN KEY `actividades_periodicidadId_fkey`;

-- DropForeignKey
ALTER TABLE `actividades` DROP FOREIGN KEY `actividades_proyectoId_fkey`;

-- DropForeignKey
ALTER TABLE `actividades` DROP FOREIGN KEY `actividades_socioComunitarioId_fkey`;

-- DropForeignKey
ALTER TABLE `actividades` DROP FOREIGN KEY `actividades_tipoActividadId_fkey`;

-- DropForeignKey
ALTER TABLE `actividades_beneficiarios` DROP FOREIGN KEY `actividades_beneficiarios_actividadId_fkey`;

-- DropForeignKey
ALTER TABLE `actividades_beneficiarios` DROP FOREIGN KEY `actividades_beneficiarios_beneficiarioId_fkey`;

-- DropForeignKey
ALTER TABLE `actividades_oferentes` DROP FOREIGN KEY `fk_actividad_oferente_actividad`;

-- DropForeignKey
ALTER TABLE `actividades_oferentes` DROP FOREIGN KEY `fk_actividad_oferente_oferente`;

-- DropForeignKey
ALTER TABLE `citas` DROP FOREIGN KEY `citas_actividadId_fkey`;

-- DropForeignKey
ALTER TABLE `citas` DROP FOREIGN KEY `citas_creadoPorId_fkey`;

-- DropForeignKey
ALTER TABLE `citas` DROP FOREIGN KEY `citas_lugarId_fkey`;

-- DropIndex
DROP INDEX `Archivo_actividadId_idx` ON `Archivo`;

-- DropIndex
DROP INDEX `PermisoUsuario_usuarioId_idx` ON `PermisoUsuario`;

-- AlterTable
ALTER TABLE `Archivo` MODIFY `descripcion` VARCHAR(191) NULL,
    MODIFY `nombre` VARCHAR(191) NOT NULL,
    MODIFY `ruta` VARCHAR(191) NOT NULL,
    MODIFY `tipo` VARCHAR(191) NOT NULL,
    MODIFY `tipoAdjunto` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `PermisoUsuario` MODIFY `permiso` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `Usuario` DROP COLUMN `permisos`,
    DROP COLUMN `resetToken`,
    DROP COLUMN `resetTokenExp`,
    DROP COLUMN `rol`,
    ADD COLUMN `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `tokenExpiracion` DATETIME(3) NULL,
    ADD COLUMN `tokenRecuperacion` VARCHAR(191) NULL,
    ADD COLUMN `ultimoAcceso` DATETIME(3) NULL;

-- DropTable
DROP TABLE `Periodicidad`;

-- DropTable
DROP TABLE `actividades`;

-- DropTable
DROP TABLE `actividades_beneficiarios`;

-- DropTable
DROP TABLE `actividades_oferentes`;

-- DropTable
DROP TABLE `beneficiarios`;

-- DropTable
DROP TABLE `citas`;

-- DropTable
DROP TABLE `lugares`;

-- DropTable
DROP TABLE `oferentes`;

-- DropTable
DROP TABLE `proyectos`;

-- DropTable
DROP TABLE `socios_comunitarios`;

-- CreateTable
CREATE TABLE `Lugar` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `cupo` INTEGER NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Lugar_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Oferente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `docenteResponsable` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Oferente_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SocioComunitario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `SocioComunitario_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Proyecto` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `Proyecto_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Actividad` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `tipoActividadId` INTEGER NOT NULL,
    `periodicidad` VARCHAR(191) NOT NULL,
    `fechaInicio` DATETIME(3) NOT NULL,
    `fechaFin` DATETIME(3) NULL,
    `cupo` INTEGER NULL,
    `socioComunitarioId` INTEGER NOT NULL,
    `proyectoId` INTEGER NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Programada',
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoPorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Cita` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actividadId` INTEGER NOT NULL,
    `lugarId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `horaInicio` VARCHAR(191) NOT NULL,
    `horaFin` VARCHAR(191) NULL,
    `estado` VARCHAR(191) NOT NULL DEFAULT 'Programada',
    `motivoCancelacion` VARCHAR(191) NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoPorId` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActividadOferente` (
    `actividadId` INTEGER NOT NULL,
    `oferenteId` INTEGER NOT NULL,

    PRIMARY KEY (`actividadId`, `oferenteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ActividadBeneficiario` (
    `actividadId` INTEGER NOT NULL,
    `beneficiarioId` INTEGER NOT NULL,

    PRIMARY KEY (`actividadId`, `beneficiarioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Beneficiario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caracterizacion` VARCHAR(191) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `TipoActividad_nombre_key` ON `TipoActividad`(`nombre`);

-- AddForeignKey
ALTER TABLE `PermisoUsuario` ADD CONSTRAINT `PermisoUsuario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Actividad` ADD CONSTRAINT `Actividad_tipoActividadId_fkey` FOREIGN KEY (`tipoActividadId`) REFERENCES `TipoActividad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Actividad` ADD CONSTRAINT `Actividad_socioComunitarioId_fkey` FOREIGN KEY (`socioComunitarioId`) REFERENCES `SocioComunitario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Actividad` ADD CONSTRAINT `Actividad_proyectoId_fkey` FOREIGN KEY (`proyectoId`) REFERENCES `Proyecto`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Actividad` ADD CONSTRAINT `Actividad_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_actividadId_fkey` FOREIGN KEY (`actividadId`) REFERENCES `Actividad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_lugarId_fkey` FOREIGN KEY (`lugarId`) REFERENCES `Lugar`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Cita` ADD CONSTRAINT `Cita_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActividadOferente` ADD CONSTRAINT `ActividadOferente_actividadId_fkey` FOREIGN KEY (`actividadId`) REFERENCES `Actividad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActividadOferente` ADD CONSTRAINT `ActividadOferente_oferenteId_fkey` FOREIGN KEY (`oferenteId`) REFERENCES `Oferente`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActividadBeneficiario` ADD CONSTRAINT `ActividadBeneficiario_actividadId_fkey` FOREIGN KEY (`actividadId`) REFERENCES `Actividad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ActividadBeneficiario` ADD CONSTRAINT `ActividadBeneficiario_beneficiarioId_fkey` FOREIGN KEY (`beneficiarioId`) REFERENCES `Beneficiario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archivo` ADD CONSTRAINT `Archivo_actividadId_fkey` FOREIGN KEY (`actividadId`) REFERENCES `Actividad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
