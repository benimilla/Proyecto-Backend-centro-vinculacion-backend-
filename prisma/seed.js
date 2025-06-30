import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const random = () => Math.floor(Math.random() * 10000);

async function main() {
  // Crear usuarios
  const usuarios = await Promise.all([
    prisma.usuario.create({ data: { nombre: 'Ana Torres', email: `ana${random()}@example.com`, password: '123456' } }),
    prisma.usuario.create({ data: { nombre: 'Luis Rojas', email: `luis${random()}@example.com`, password: '123456' } }),
    prisma.usuario.create({ data: { nombre: 'Carla Pérez', email: `carla${random()}@example.com`, password: '123456' } }),
    prisma.usuario.create({ data: { nombre: 'Matías Díaz', email: `matias${random()}@example.com`, password: '123456' } }),
    prisma.usuario.create({ data: { nombre: 'Sofía Ruiz', email: `sofia${random()}@example.com`, password: '123456' } }),
  ]);

  // Crear 13 permisos para el primer usuario
  const permisos = [
    'crear_usuario',
    'editar_usuario',
    'eliminar_usuario',
    'ver_usuarios',
    'asignar_permisos',
    'crear_actividad',
    'editar_actividad',
    'eliminar_actividad',
    'ver_actividades',
    'cargar_archivo',
    'eliminar_archivo',
    'crear_cita',
    'cancelar_cita',
  ];

  await Promise.all(
    permisos.map((permiso) =>
      prisma.permisoUsuario.create({
        data: {
          usuarioId: usuarios[0].id,
          permiso,
          asignadoPorId: null, // o usuarios[0].id si te interesa registrar el usuario que asignó
        },
      })
    )
  );

  // Crear TipoActividad
  const tiposActividad = await Promise.all([
    prisma.tipoActividad.upsert({
      where: { nombre: 'Deporte' },
      update: {},
      create: { nombre: 'Deporte', descripcion: 'Actividades deportivas' },
    }),
    prisma.tipoActividad.upsert({
      where: { nombre: 'Cultura' },
      update: {},
      create: { nombre: 'Cultura', descripcion: 'Actividades culturales' },
    }),
    prisma.tipoActividad.upsert({
      where: { nombre: 'Educación' },
      update: {},
      create: { nombre: 'Educación', descripcion: 'Actividades educativas' },
    }),
  ]);

  // Crear SocioComunitario
  const socios = await Promise.all([
    prisma.socioComunitario.upsert({
      where: { nombre: 'Comunidad A' },
      update: {},
      create: { nombre: 'Comunidad A' },
    }),
    prisma.socioComunitario.upsert({
      where: { nombre: 'Comunidad B' },
      update: {},
      create: { nombre: 'Comunidad B' },
    }),
    prisma.socioComunitario.upsert({
      where: { nombre: 'Comunidad C' },
      update: {},
      create: { nombre: 'Comunidad C' },
    }),
  ]);

  // Crear Proyectos
  const proyectos = await Promise.all([
    prisma.proyecto.upsert({
      where: { nombre: 'Proyecto 1' },
      update: {},
      create: { nombre: 'Proyecto 1', descripcion: 'Primer proyecto', fechaInicio: new Date() },
    }),
    prisma.proyecto.upsert({
      where: { nombre: 'Proyecto 2' },
      update: {},
      create: { nombre: 'Proyecto 2', descripcion: 'Segundo proyecto', fechaInicio: new Date() },
    }),
    prisma.proyecto.upsert({
      where: { nombre: 'Proyecto 3' },
      update: {},
      create: { nombre: 'Proyecto 3', descripcion: 'Tercer proyecto', fechaInicio: new Date() },
    }),
  ]);

  // Crear 10 actividades
  for (let i = 1; i <= 10; i++) {
    const usuarioRandom = usuarios[Math.floor(Math.random() * usuarios.length)];
    const tipoRandom = tiposActividad[Math.floor(Math.random() * tiposActividad.length)];
    const socioRandom = socios[Math.floor(Math.random() * socios.length)];
    const proyectoRandom = proyectos[Math.floor(Math.random() * proyectos.length)];

    await prisma.actividad.create({
      data: {
        nombre: `Actividad ${i}`,
        tipoActividadId: tipoRandom.id,
        periodicidad: 'Puntual',
        fechaInicio: new Date(),
        fechaFin: new Date(Date.now() + 86400000),
        cupo: 20 + i,
        socioComunitarioId: socioRandom.id,
        proyectoId: proyectoRandom.id,
        estado: 'Programada',
        creadoPorId: usuarioRandom.id,
      },
    });
  }

  console.log('✅ Seed completado: 5 usuarios, 13 permisos, 10 actividades y catálogos creados.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
