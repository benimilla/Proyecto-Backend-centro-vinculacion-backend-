import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const now = new Date();

const permisos = [
  'crear_usuario', 'editar_usuario', 'eliminar_usuario', 'ver_usuarios',
  'asignar_permisos', 'crear_actividad', 'editar_actividad', 'eliminar_actividad',
  'ver_actividades', 'cargar_archivo', 'eliminar_archivo', 'crear_cita', 'cancelar_cita',
  // Agrega aquí todos los permisos que existan en tu sistema
];

async function crearAdminsConPermisos() {
  // Hashear la contraseña para ambos admins
  const hashedPassword1 = await bcrypt.hash('admin123', 10);
  const hashedPassword2 = await bcrypt.hash('super123', 10);

  // Crear admin 1
  const admin1 = await prisma.usuario.create({
    data: {
      nombre: 'Admin Principal',
      email: 'admin@gmail.com',
      password: hashedPassword1,
    },
  });

  // Crear admin 2
  const admin2 = await prisma.usuario.create({
    data: {
      nombre: 'Super Admin',
      email: 'superadmin@example.com',
      password: hashedPassword2,
    },
  });

  // Asignar TODOS los permisos a admin1
  await Promise.all(
    permisos.map((permiso) =>
      prisma.permisoUsuario.create({
        data: {
          usuarioId: admin1.id,
          permiso,
          asignadoPorId: admin1.id,  // el mismo admin 1 asigna sus permisos
        },
      })
    )
  );

  // Asignar TODOS los permisos a admin2
  await Promise.all(
    permisos.map((permiso) =>
      prisma.permisoUsuario.create({
        data: {
          usuarioId: admin2.id,
          permiso,
          asignadoPorId: admin2.id,  // el mismo admin 2 asigna sus permisos
        },
      })
    )
  );

  return [admin1, admin2];
}

async function main() {
  console.log('🌱 Iniciando seed...');

  // Crear admins con permisos
  const admins = await crearAdminsConPermisos();

  console.log(`✅ Seed completado: ${admins.length} admins creados con todos los permisos.`);
}

main()
  .catch((e) => {
    console.error('❌ Error durante el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
