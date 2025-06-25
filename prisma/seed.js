import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Crear tipos de actividad
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

  // NOTA: periodicidad lo manejamos como string, no hay tabla Periodicidad
  const periodicidad1 = 'Semanal';
  const periodicidad2 = 'Mensual';

  // Crear lugares
  const lugar1 = await prisma.lugar.create({
    data: { nombre: 'Auditorio Principal', cupo: 100 },
  });

  const lugar2 = await prisma.lugar.create({
    data: { nombre: 'Sala de Conferencias', cupo: 50 },
  });

  // Crear socios comunitarios
  await prisma.socioComunitario.createMany({
    data: [
      { nombre: 'Fundación Esperanza' },
      { nombre: 'Junta de Vecinos El Progreso' },
      { nombre: 'Centro Cultural Raíces' },
      { nombre: 'ONG Manos Solidarias' },
      { nombre: 'Asociación Juvenil Los Robles' },
    ],
    skipDuplicates: true,
  });

  // Crear usuario administrador (contraseña hasheada)
  const hashedPassword = await bcrypt.hash('admin1234', 10);
  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Admin',
      email: 'admin@ejemplo.com',
      password: hashedPassword,
      rol: 'ADMIN', // si tienes campo rol, sino eliminar
      // permisos deben ir en tabla permisos_usuario, no aquí
    },
  });

  // Para asignar permisos, debes crear entradas en permisos_usuario si así lo tienes
  // Ejemplo (opcional, si tienes modelo permisosUsuario):
  /*
  await prisma.permisosUsuario.createMany({
    data: [
      { usuarioId: admin.id, permiso: 'admin', asignadoPor: admin.id },
      { usuarioId: admin.id, permiso: 'editar', asignadoPor: admin.id },
    ],
    skipDuplicates: true,
  });
  */

  // Crear una actividad
  const actividad = await prisma.actividad.create({
    data: {
      nombre: 'Clases de Yoga',
      tipoActividadId: tipo2.id,
      periodicidad: periodicidad1,
      fechaInicio: new Date('2025-07-01'),
      // fechaFin opcional
      cupo: 20,
      socioComunitarioId: 1, // Asegúrate que el socio con ID 1 exista
      estado: 'Programada',
      creadoPorId: admin.id,
    },
  });

  // Crear una cita ligada a la actividad
  await prisma.cita.create({
    data: {
      actividadId: actividad.id,
      lugarId: lugar1.id,
      fecha: new Date('2025-07-01'),
      horaInicio: '10:00:00',
      horaFin: '11:00:00',
      estado: 'Programada',
      creadoPorId: admin.id,
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
