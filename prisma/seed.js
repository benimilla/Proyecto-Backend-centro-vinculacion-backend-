import { prisma } from '../config/db.js'; // ajusta la ruta si es necesario

async function main() {
  const lugares = [
    {
      nombre: 'Sala Principal',
      cupo: 50,
      activo: true,
    },
    {
      nombre: 'Auditorio Secundario',
      cupo: 100,
      activo: true,
    },
    {
      nombre: 'Sala de Reuniones',
      cupo: 20,
      activo: true,
    },
    {
      nombre: 'Laboratorio de Computación',
      cupo: 30,
      activo: true,
    },
  ];

  for (const lugar of lugares) {
    await prisma.lugar.upsert({
      where: { nombre: lugar.nombre },
      update: {},
      create: lugar,
    });
  }

  console.log('Lugares insertados o actualizados correctamente');
}

main()
  .catch((e) => {
    console.error('Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
