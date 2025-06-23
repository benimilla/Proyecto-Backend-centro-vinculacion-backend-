import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Tipos de actividad
  const tipo1 = await prisma.tipoActividad.create({
    data: {
      nombre: 'Deportivo',
      descripcion: 'Actividades relacionadas con deportes',
    },
  });

  const tipo2 = await prisma.tipoActividad.create({
    data: {
      nombre: 'Cultural',
      descripcion: 'Actividades culturales y artísticas',
    },
  });

  // Periodicidades
  const periodicidad1 = await prisma.periodicidad.create({
    data: { nombre: 'Semanal' },
  });

  const periodicidad2 = await prisma.periodicidad.create({
    data: { nombre: 'Mensual' },
  });

  // Lugares
  const lugar1 = await prisma.lugar.create({
    data: { nombre: 'Auditorio Principal', cupo: 100 },
  });

  const lugar2 = await prisma.lugar.create({
    data: { nombre: 'Sala de Conferencias', cupo: 50 },
  });

  // Socios comunitarios
  await prisma.socioComunitario.createMany({
    data: [
      { nombre: 'Fundación Esperanza' },
      { nombre: 'Junta de Vecinos El Progreso' },
      { nombre: 'Centro Cultural Raíces' },
      { nombre: 'ONG Manos Solidarias' },
      { nombre: 'Asociación Juvenil Los Robles' }
    ],
    skipDuplicates: true
  });

  // Usuario administrador (contraseña hasheada)
  const hashedPassword = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      email: 'admin@ejemplo.com',
      password: hashedPassword,
      rol: 'ADMIN',
      permisos: { admin: true, editar: true },
    },
  });

  // Actividad ejemplo
  const actividad = await prisma.actividad.create({
    data: {
      nombre: 'Clases de Yoga',
      tipoId: tipo2.id,
      periodicidadId: periodicidad1.id,
      cupo: 20,
      lugarId: lugar1.id,
      socioId: 1, // asegúrate de que el socio existe
    },
  });

  // Cita ligada a la actividad
  await prisma.cita.create({
    data: {
      actividadId: actividad.id,
      lugarId: lugar1.id,
      fecha: new Date('2025-07-01T00:00:00Z'),
      hora: new Date('2025-07-01T10:00:00Z'),
    },
  });

  console.log('✅ Datos iniciales insertados correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
