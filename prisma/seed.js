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

  await prisma.tipoActividad.createMany({
    data: [
      { nombre: 'Taller', descripcion: 'Actividades de formación y capacitación' },
      { nombre: 'Charla', descripcion: 'Presentaciones informativas' },
      { nombre: 'Reunión', descripcion: 'Encuentros de planificación' },
      { nombre: 'Evento', descripcion: 'Actividades especiales o festivales' },
      { nombre: 'Curso', descripcion: 'Programas educativos estructurados' },
    ],
    skipDuplicates: true,
  });

  await prisma.lugar.createMany({
    data: [
      { nombre: 'Sala A', cupo: 30, activo: true },
      { nombre: 'Auditorio Principal', cupo: 100, activo: true },
      { nombre: 'Sala B', cupo: 25, activo: true },
      { nombre: 'Sala C', cupo: 20, activo: false },
      { nombre: 'Patio Central', cupo: 50, activo: true },
    ],
    skipDuplicates: true,
  });

  await prisma.oferente.createMany({
    data: [
      { nombre: 'Centro Educativo ABC', docenteResponsable: 'Pedro Vargas', activo: true },
      { nombre: 'Escuela XYZ', docenteResponsable: 'Luisa Fernández', activo: true },
      { nombre: 'Instituto 123', docenteResponsable: 'Martín Gómez', activo: true },
      { nombre: 'Academia DEF', docenteResponsable: 'Ana Torres', activo: false },
      { nombre: 'Universidad LMN', docenteResponsable: 'Carlos Ruiz', activo: true },
    ],
    skipDuplicates: true,
  });

  await prisma.socioComunitario.createMany({
    data: [
      { nombre: 'Comunidad El Sol', activo: true },
      { nombre: 'Barrio La Paz', activo: true },
      { nombre: 'Vecinos Unidos', activo: false },
      { nombre: 'Asociación Cultural', activo: true },
      { nombre: 'Grupo Juvenil', activo: true },
    ],
    skipDuplicates: true,
  });

  await prisma.proyecto.createMany({
    data: [
      { nombre: 'Proyecto A', descripcion: 'Desarrollo comunitario', fechaInicio: new Date('2024-01-01'), fechaFin: new Date('2024-12-31'), activo: true },
      { nombre: 'Proyecto B', descripcion: null, fechaInicio: new Date('2024-03-01'), fechaFin: null, activo: true },
      { nombre: 'Proyecto C', descripcion: 'Apoyo social', fechaInicio: new Date('2023-06-01'), fechaFin: new Date('2024-06-01'), activo: false },
      { nombre: 'Proyecto D', descripcion: 'Educación', fechaInicio: new Date('2024-05-01'), fechaFin: null, activo: true },
      { nombre: 'Proyecto E', descripcion: 'Cultura y arte', fechaInicio: new Date('2024-02-15'), fechaFin: new Date('2024-11-15'), activo: true },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seed ejecutado con éxito');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
