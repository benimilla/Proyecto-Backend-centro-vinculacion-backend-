import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const now = new Date();
const random = () => Math.floor(Math.random() * 10000);

async function crearUsuarios() {
  const usuarios = await Promise.all([
    prisma.usuario.create({
      data: {
        nombre: 'Ana Torres',
        email: `ana${random()}@example.com`,
        password: '123456',
      },
    }),
    prisma.usuario.create({
      data: {
        nombre: 'Luis Rojas',
        email: `luis${random()}@example.com`,
        password: '123456',
      },
    }),
    prisma.usuario.create({
      data: {
        nombre: 'Carla Pérez',
        email: `carla${random()}@example.com`,
        password: '123456',
      },
    }),
  ]);

  const permisos = [
    'crear_usuario', 'editar_usuario', 'eliminar_usuario', 'ver_usuarios',
    'asignar_permisos', 'crear_actividad', 'editar_actividad', 'eliminar_actividad',
    'ver_actividades', 'cargar_archivo', 'eliminar_archivo', 'crear_cita', 'cancelar_cita',
  ];

  await Promise.all(
    permisos.map((permiso) =>
      prisma.permisoUsuario.create({
        data: {
          usuarioId: usuarios[0].id,
          permiso,
          asignadoPorId: usuarios[0].id,
        },
      })
    )
  );

  return usuarios;
}

async function crearCatalogos() {
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
  ]);

  const lugares = await Promise.all([
    prisma.lugar.upsert({
      where: { nombre: 'Gimnasio Municipal' },
      update: {},
      create: { nombre: 'Gimnasio Municipal', cupo: 50 },
    }),
    prisma.lugar.upsert({
      where: { nombre: 'Biblioteca Central' },
      update: {},
      create: { nombre: 'Biblioteca Central', cupo: 30 },
    }),
  ]);

  const oferentes = await Promise.all([
    prisma.oferente.upsert({
      where: { nombre: 'Universidad A' },
      update: {},
      create: { nombre: 'Universidad A', docenteResponsable: 'Dr. Pérez' },
    }),
    prisma.oferente.upsert({
      where: { nombre: 'Fundación B' },
      update: {},
      create: { nombre: 'Fundación B', docenteResponsable: 'Lic. Soto' },
    }),
  ]);

  const socios = await Promise.all([
    prisma.socioComunitario.upsert({
      where: { nombre: 'Comunidad A' },
      update: {},
      create: { nombre: 'Comunidad A' },
    }),
  ]);

  const proyectos = await Promise.all([
    prisma.proyecto.upsert({
      where: { nombre: 'Proyecto Vida Activa' },
      update: {},
      create: {
        nombre: 'Proyecto Vida Activa',
        descripcion: 'Promoción de la salud física',
        fechaInicio: now,
        fechaFin: new Date(now.getTime() + 30 * 86400000),
      },
    }),
  ]);

  return { tiposActividad, lugares, oferentes, socios, proyectos };
}

async function crearActividadesYRelacionar(usuarios, catalogos) {
  const actividades = [];

  for (let i = 1; i <= 5; i++) {
    const actividad = await prisma.actividad.create({
      data: {
        nombre: `Actividad ${i}`,
        tipoActividadId: catalogos.tiposActividad[i % catalogos.tiposActividad.length].id,
        periodicidad: 'Puntual',
        fechaInicio: now,
        fechaFin: new Date(now.getTime() + 86400000),
        cupo: 20 + i,
        socioComunitarioId: catalogos.socios[0].id,
        proyectoId: catalogos.proyectos[0].id,
        creadoPorId: usuarios[i % usuarios.length].id,
      },
    });
    actividades.push(actividad);

    // Citas
    await prisma.cita.create({
      data: {
        actividadId: actividad.id,
        lugarId: catalogos.lugares[i % catalogos.lugares.length].id,
        fecha: now,
        horaInicio: '10:00',
        horaFin: '12:00',
        creadoPorId: usuarios[i % usuarios.length].id,
      },
    });

    // Oferentes
    await prisma.actividadOferente.create({
      data: {
        actividadId: actividad.id,
        oferenteId: catalogos.oferentes[i % catalogos.oferentes.length].id,
      },
    });

    // Beneficiarios
    const beneficiario = await prisma.beneficiario.create({
      data: {
        caracterizacion: `Beneficiario grupo ${i}`,
      },
    });

    await prisma.actividadBeneficiario.create({
      data: {
        actividadId: actividad.id,
        beneficiarioId: beneficiario.id,
      },
    });

    // Archivos
    await prisma.archivo.create({
      data: {
        nombre: `documento_${i}.pdf`,
        ruta: `/uploads/doc_${i}.pdf`,
        tipo: 'application/pdf',
        tamano: 1024,
        tipoAdjunto: 'Evidencia',
        actividadId: actividad.id,
        cargadoPorId: usuarios[i % usuarios.length].id,
        descripcion: 'Archivo subido como evidencia',
      },
    });
  }

  return actividades;
}

async function main() {
  console.log('🌱 Iniciando seed...');

  const usuarios = await crearUsuarios();
  const catalogos = await crearCatalogos();
  const actividades = await crearActividadesYRelacionar(usuarios, catalogos);

  console.log(`✅ Seed completado: ${usuarios.length} usuarios, ${actividades.length} actividades.`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
