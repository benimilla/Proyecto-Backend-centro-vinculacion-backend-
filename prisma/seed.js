import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  // === Crear usuarios ===
  const usuariosRaw = [
    'admin1@example.com',
    'admin2@example.com',
    'admin3@example.com',
    'admin4@example.com',
    'admin5@example.com',
    'juan.perez@example.com',
    'maria.lopez@example.com',
    'carlos.diaz@example.com',
    'ana.gomez@example.com',
    'luis.martinez@example.com',
  ];

  const usuarios = await Promise.all(
    usuariosRaw.map((email, idx) =>
      prisma.usuario.upsert({
        where: { email },
        update: {},
        create: {
          nombre: `Usuario ${idx + 1}`,
          email,
          password: hashedPassword,
        },
      })
    )
  );

  // === Crear permisos ===
  const permisos = [
    { usuario: 0, permiso: 'administrador', asignadoPor: null },
    { usuario: 1, permiso: 'administrador', asignadoPor: 0 },
    { usuario: 2, permiso: 'administrador', asignadoPor: 0 },
    { usuario: 3, permiso: 'administrador', asignadoPor: 1 },
    { usuario: 4, permiso: 'administrador', asignadoPor: 2 },
    { usuario: 5, permiso: 'usuario', asignadoPor: null },
    { usuario: 6, permiso: 'usuario', asignadoPor: 5 },
    { usuario: 7, permiso: 'usuario', asignadoPor: 5 },
    { usuario: 8, permiso: 'usuario', asignadoPor: 6 },
    { usuario: 9, permiso: 'usuario', asignadoPor: 7 },
  ];

  for (const p of permisos) {
    await prisma.permisoUsuario.upsert({
      where: {
        usuarioId_permiso: {
          usuarioId: usuarios[p.usuario].id,
          permiso: p.permiso,
        },
      },
      update: {
        asignadoPorId: p.asignadoPor !== null ? usuarios[p.asignadoPor].id : null,
      },
      create: {
        usuarioId: usuarios[p.usuario].id,
        permiso: p.permiso,
        asignadoPorId: p.asignadoPor !== null ? usuarios[p.asignadoPor].id : null,
      },
    });
  }

  // === Crear tipos de actividad ===
  const tipo1 = await prisma.tipoActividad.upsert({
    where: { nombre: 'Taller' },
    update: {},
    create: { nombre: 'Taller', descripcion: 'Actividades de tipo taller' },
  });

  const tipo2 = await prisma.tipoActividad.upsert({
    where: { nombre: 'Charla' },
    update: {},
    create: { nombre: 'Charla', descripcion: 'Actividades de tipo charla' },
  });

  // === Crear socio comunitario ===
  const socio1 = await prisma.socioComunitario.upsert({
    where: { nombre: 'Comunidad A' },
    update: {},
    create: { nombre: 'Comunidad A' },
  });

  // === Crear proyecto ===
  const proyecto1 = await prisma.proyecto.upsert({
    where: { nombre: 'Proyecto X' },
    update: {},
    create: { nombre: 'Proyecto X', fechaInicio: new Date('2025-01-01') },
  });

  // === Crear lugar ===
  const lugar1 = await prisma.lugar.upsert({
    where: { nombre: 'Sala Principal' },
    update: {},
    create: { nombre: 'Sala Principal', cupo: 50 },
  });

  // === Crear actividad ===
  const actividad1 = await prisma.actividad.create({
    data: {
      nombre: 'Taller de Capacitación',
      tipoActividadId: tipo1.id,
      periodicidad: 'Puntual',
      fechaInicio: new Date('2025-07-01T09:00:00'),
      fechaFin: new Date('2025-07-01T12:00:00'),
      socioComunitarioId: socio1.id,
      proyectoId: proyecto1.id,
      cupo: 30,
      creadoPorId: usuarios[0].id,
    },
  });

  // === Crear cita para la actividad ===
  const cita1 = await prisma.cita.create({
    data: {
      actividadId: actividad1.id,
      lugarId: lugar1.id,
      fecha: new Date('2025-07-01'),
      horaInicio: '09:00',
      horaFin: '12:00',
      estado: 'Programada',
      creadoPorId: usuarios[0].id,
    },
  });

  console.log('Seed completado con éxito');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
