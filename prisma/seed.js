import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Crear algunos tipos de actividad
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

  // Crear periodicidades
  const periodicidad1 = await prisma.periodicidad.create({
    data: { nombre: 'Semanal' },
  });
  const periodicidad2 = await prisma.periodicidad.create({
    data: { nombre: 'Mensual' },
  });

  // Crear lugares
  const lugar1 = await prisma.lugar.create({
    data: { nombre: 'Auditorio Principal', cupo: 100 },
  });
  const lugar2 = await prisma.lugar.create({
    data: { nombre: 'Sala de Conferencias', cupo: 50 },
  });

  // Crear usuario de ejemplo
  const usuario1 = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      email: 'admin@ejemplo.com',
      password: 'hashedpassword123',  // Recuerda hashear la contraseña en tu app
      rol: 'administrador',
      permisos: { admin: true, editar: true },
    },
  });

  // Crear una actividad ligada a un tipo y periodicidad
  const actividad1 = await prisma.actividad.create({
    data: {
      nombre: 'Clases de Yoga',
      tipoId: tipo2.id,
      periodicidadId: periodicidad1.id,
      cupo: 20,
      lugarId: lugar1.id,
    },
  });

  // Crear una cita ligada a la actividad y lugar
  const cita1 = await prisma.cita.create({
    data: {
      actividadId: actividad1.id,
      lugarId: lugar1.id,
      fecha: new Date('2025-07-01T00:00:00Z'),
      hora: new Date('2025-07-01T10:00:00Z'),
    },
  });

  console.log('Datos iniciales creados correctamente.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
