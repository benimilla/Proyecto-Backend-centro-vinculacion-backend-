/*
  Warnings:

  - You are about to drop the column `url` on the `Archivo` table. All the data in the column will be lost.
  - You are about to drop the `Actividad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Beneficiario` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Cita` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Lugar` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `OferenteActividad` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Proyecto` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SocioComunitario` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `cargadoPorId` to the `Archivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nombre` to the `Archivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `ruta` to the `Archivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tamano` to the `Archivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipo` to the `Archivo` table without a default value. This is not possible if the table is not empty.
  - Added the required column `tipoAdjunto` to the `Archivo` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `Actividad` DROP FOREIGN KEY `Actividad_lugarId_fkey`;

-- DropForeignKey
ALTER TABLE `Actividad` DROP FOREIGN KEY `Actividad_periodicidadId_fkey`;

-- DropForeignKey
ALTER TABLE `Actividad` DROP FOREIGN KEY `Actividad_proyectoId_fkey`;

-- DropForeignKey
ALTER TABLE `Actividad` DROP FOREIGN KEY `Actividad_tipoId_fkey`;

-- DropForeignKey
ALTER TABLE `Archivo` DROP FOREIGN KEY `Archivo_actividadId_fkey`;

-- DropForeignKey
ALTER TABLE `Beneficiario` DROP FOREIGN KEY `Beneficiario_actividadId_fkey`;

-- DropForeignKey
ALTER TABLE `Cita` DROP FOREIGN KEY `Cita_actividadId_fkey`;

-- DropForeignKey
ALTER TABLE `Cita` DROP FOREIGN KEY `Cita_lugarId_fkey`;

-- DropForeignKey
ALTER TABLE `Cita` DROP FOREIGN KEY `Cita_usuarioId_fkey`;

-- DropForeignKey
ALTER TABLE `OferenteActividad` DROP FOREIGN KEY `OferenteActividad_actividadId_fkey`;

-- AlterTable
ALTER TABLE `Archivo` DROP COLUMN `url`,
    ADD COLUMN `cargadoPorId` INTEGER NOT NULL,
    ADD COLUMN `fechaCarga` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `nombre` VARCHAR(255) NOT NULL,
    ADD COLUMN `ruta` VARCHAR(255) NOT NULL,
    ADD COLUMN `tamano` INTEGER NOT NULL,
    ADD COLUMN `tipo` VARCHAR(100) NOT NULL,
    ADD COLUMN `tipoAdjunto` VARCHAR(50) NOT NULL,
    MODIFY `descripcion` TEXT NULL;

-- DropTable
DROP TABLE `Actividad`;

-- DropTable
DROP TABLE `Beneficiario`;

-- DropTable
DROP TABLE `Cita`;

-- DropTable
DROP TABLE `Lugar`;

-- DropTable
DROP TABLE `OferenteActividad`;

-- DropTable
DROP TABLE `Proyecto`;

-- DropTable
DROP TABLE `SocioComunitario`;

-- CreateTable
CREATE TABLE `PermisoUsuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `permiso` VARCHAR(50) NOT NULL,
    `fechaAsignacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `asignadoPorId` INTEGER NULL,

    INDEX `PermisoUsuario_usuarioId_idx`(`usuarioId`),
    INDEX `PermisoUsuario_asignadoPorId_idx`(`asignadoPorId`),
    UNIQUE INDEX `PermisoUsuario_usuarioId_permiso_key`(`usuarioId`, `permiso`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `lugares` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `cupo` INTEGER NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `lugares_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oferentes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `docenteResponsable` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `oferentes_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividades_oferentes` (
    `actividadId` INTEGER NOT NULL,
    `oferenteId` INTEGER NOT NULL,

    PRIMARY KEY (`actividadId`, `oferenteId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `socios_comunitarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `socios_comunitarios_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `proyectos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `descripcion` TEXT NULL,
    `fechaInicio` DATE NOT NULL,
    `fechaFin` DATE NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `proyectos_nombre_key`(`nombre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(100) NOT NULL,
    `tipoActividadId` INTEGER NOT NULL,
    `periodicidadId` INTEGER NOT NULL,
    `fechaInicio` DATE NOT NULL,
    `fechaFin` DATE NULL,
    `cupo` INTEGER NULL,
    `socioComunitarioId` INTEGER NOT NULL,
    `proyectoId` INTEGER NULL,
    `estado` VARCHAR(50) NOT NULL DEFAULT 'Programada',
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoPorId` INTEGER NOT NULL,

    INDEX `actividades_tipoActividadId_idx`(`tipoActividadId`),
    INDEX `actividades_socioComunitarioId_idx`(`socioComunitarioId`),
    INDEX `actividades_proyectoId_idx`(`proyectoId`),
    INDEX `actividades_creadoPorId_idx`(`creadoPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citas` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `actividadId` INTEGER NOT NULL,
    `lugarId` INTEGER NOT NULL,
    `fecha` DATE NOT NULL,
    `horaInicio` VARCHAR(191) NOT NULL,
    `horaFin` VARCHAR(191) NULL,
    `estado` VARCHAR(50) NOT NULL DEFAULT 'Programada',
    `motivoCancelacion` TEXT NULL,
    `fechaCreacion` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `creadoPorId` INTEGER NOT NULL,

    INDEX `citas_actividadId_idx`(`actividadId`),
    INDEX `citas_lugarId_idx`(`lugarId`),
    INDEX `citas_creadoPorId_idx`(`creadoPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beneficiarios` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `caracterizacion` VARCHAR(200) NOT NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `actividades_beneficiarios` (
    `actividadId` INTEGER NOT NULL,
    `beneficiarioId` INTEGER NOT NULL,

    PRIMARY KEY (`actividadId`, `beneficiarioId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Archivo_cargadoPorId_idx` ON `Archivo`(`cargadoPorId`);

-- AddForeignKey
ALTER TABLE `PermisoUsuario` ADD CONSTRAINT `PermisoUsuario_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PermisoUsuario` ADD CONSTRAINT `PermisoUsuario_asignadoPorId_fkey` FOREIGN KEY (`asignadoPorId`) REFERENCES `Usuario`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades_oferentes` ADD CONSTRAINT `fk_actividad_oferente_actividad` FOREIGN KEY (`actividadId`) REFERENCES `actividades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades_oferentes` ADD CONSTRAINT `fk_actividad_oferente_oferente` FOREIGN KEY (`oferenteId`) REFERENCES `oferentes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_tipoActividadId_fkey` FOREIGN KEY (`tipoActividadId`) REFERENCES `TipoActividad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_periodicidadId_fkey` FOREIGN KEY (`periodicidadId`) REFERENCES `Periodicidad`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_socioComunitarioId_fkey` FOREIGN KEY (`socioComunitarioId`) REFERENCES `socios_comunitarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_proyectoId_fkey` FOREIGN KEY (`proyectoId`) REFERENCES `proyectos`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades` ADD CONSTRAINT `actividades_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_actividadId_fkey` FOREIGN KEY (`actividadId`) REFERENCES `actividades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_lugarId_fkey` FOREIGN KEY (`lugarId`) REFERENCES `lugares`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_creadoPorId_fkey` FOREIGN KEY (`creadoPorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archivo` ADD CONSTRAINT `Archivo_actividadId_fkey` FOREIGN KEY (`actividadId`) REFERENCES `actividades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Archivo` ADD CONSTRAINT `Archivo_cargadoPorId_fkey` FOREIGN KEY (`cargadoPorId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades_beneficiarios` ADD CONSTRAINT `actividades_beneficiarios_actividadId_fkey` FOREIGN KEY (`actividadId`) REFERENCES `actividades`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `actividades_beneficiarios` ADD CONSTRAINT `actividades_beneficiarios_beneficiarioId_fkey` FOREIGN KEY (`beneficiarioId`) REFERENCES `beneficiarios`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER TABLE `Archivo` RENAME INDEX `Archivo_actividadId_fkey` TO `Archivo_actividadId_idx`;
