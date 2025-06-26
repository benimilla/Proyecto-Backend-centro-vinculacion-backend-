import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Usuarios
  await prisma.usuario.createMany({
    data: [
      { nombre: 'Juan Pérez', email: 'juan.perez@example.com', password: 'hashed_password_1' },
      { nombre: 'María López', email: 'maria.lopez@example.com', password: 'hashed_password_2' },
      { nombre: 'Carlos Díaz', email: 'carlos.diaz@example.com', password: 'hashed_password_3' },
      { nombre: 'Ana Gómez', email: 'ana.gomez@example.com', password: 'hashed_password_4' },
      { nombre: 'Luis Martínez', email: 'luis.martinez@example.com', password: 'hashed_password_5' },
    ],
  });

  await prisma.usuario.createMany({
  data: [
    { nombre: 'Admin Uno', email: 'admin1@example.com', password: 'hashed_password_1' },
    { nombre: 'Admin Dos', email: 'admin2@example.com', password: 'hashed_password_2' },
    { nombre: 'Admin Tres', email: 'admin3@example.com', password: 'hashed_password_3' },
    { nombre: 'Admin Cuatro', email: 'admin4@example.com', password: 'hashed_password_4' },
    { nombre: 'Admin Cinco', email: 'admin5@example.com', password: 'hashed_password_5' },
  ],
});

  
  await prisma.permisoUsuario.createMany({
    data: [
      // Permisos administradores (usuarioId 1-5)
      { usuarioId: 1, permiso: 'administrador', asignadoPorId: null },
      { usuarioId: 2, permiso: 'administrador', asignadoPorId: 1 },
      { usuarioId: 3, permiso: 'administrador', asignadoPorId: 1 },
      { usuarioId: 4, permiso: 'administrador', asignadoPorId: 2 },
      { usuarioId: 5, permiso: 'administrador', asignadoPorId: 3 },

      // Permisos usuarios normales (usuarioId 6-10)
      { usuarioId: 6, permiso: 'usuario', asignadoPorId: null },
      { usuarioId: 7, permiso: 'usuario', asignadoPorId: 6 },
      { usuarioId: 8, permiso: 'usuario', asignadoPorId: 6 },
      { usuarioId: 9, permiso: 'usuario', asignadoPorId: 7 },
      { usuarioId: 10, permiso: 'usuario', asignadoPorId: 8 },
    ],
  });

  // TipoActividad
  await prisma.tipoActividad.createMany({
    data: [
      { nombre: 'Taller', descripcion: 'Actividades de formación y capacitación' },
      { nombre: 'Charla', descripcion: 'Presentaciones informativas' },
      { nombre: 'Reunión', descripcion: 'Encuentros de planificación' },
      { nombre: 'Evento', descripcion: 'Actividades especiales o festivales' },
      { nombre: 'Curso', descripcion: 'Programas educativos estructurados' },
    ],
  });

  // Lugar
  await prisma.lugar.createMany({
    data: [
      { nombre: 'Sala A', cupo: 30, activo: true },
      { nombre: 'Auditorio Principal', cupo: 100, activo: true },
      { nombre: 'Sala B', cupo: 25, activo: true },
      { nombre: 'Sala C', cupo: 20, activo: false },
      { nombre: 'Patio Central', cupo: 50, activo: true },
    ],
  });

  // Oferente
  await prisma.oferente.createMany({
    data: [
      { nombre: 'Centro Educativo ABC', docenteResponsable: 'Pedro Vargas', activo: true },
      { nombre: 'Escuela XYZ', docenteResponsable: 'Luisa Fernández', activo: true },
      { nombre: 'Instituto 123', docenteResponsable: 'Martín Gómez', activo: true },
      { nombre: 'Academia DEF', docenteResponsable: 'Ana Torres', activo: false },
      { nombre: 'Universidad LMN', docenteResponsable: 'Carlos Ruiz', activo: true },
    ],
  });

  // SocioComunitario
  await prisma.socioComunitario.createMany({
    data: [
      { nombre: 'Comunidad El Sol', activo: true },
      { nombre: 'Barrio La Paz', activo: true },
      { nombre: 'Vecinos Unidos', activo: false },
      { nombre: 'Asociación Cultural', activo: true },
      { nombre: 'Grupo Juvenil', activo: true },
    ],
  });

  // Proyecto
  await prisma.proyecto.createMany({
    data: [
      { nombre: 'Proyecto A', descripcion: 'Proyecto de desarrollo comunitario', fechaInicio: new Date('2024-01-01'), fechaFin: new Date('2024-12-31'), activo: true },
      { nombre: 'Proyecto B', descripcion: null, fechaInicio: new Date('2024-03-01'), fechaFin: null, activo: true },
      { nombre: 'Proyecto C', descripcion: 'Apoyo social', fechaInicio: new Date('2023-06-01'), fechaFin: new Date('2024-06-01'), activo: false },
      { nombre: 'Proyecto D', descripcion: 'Educación para jóvenes', fechaInicio: new Date('2024-05-01'), fechaFin: null, activo: true },
      { nombre: 'Proyecto E', descripcion: 'Cultura y arte', fechaInicio: new Date('2024-02-15'), fechaFin: new Date('2024-11-15'), activo: true },
    ],
  });

  // Actividad
  await prisma.actividad.createMany({
    data: [
      {
        nombre: 'Taller de Computación',
        tipoActividadId: 1,
        periodicidad: 'Puntual',
        fechaInicio: new Date('2024-07-01T09:00:00Z'),
        fechaFin: new Date('2024-07-01T12:00:00Z'),
        cupo: 20,
        socioComunitarioId: 1,
        proyectoId: 1,
        estado: 'Programada',
        creadoPorId: 1,
      },
      {
        nombre: 'Charla de Salud',
        tipoActividadId: 2,
        periodicidad: 'Periódica',
        fechaInicio: new Date('2024-07-05T15:00:00Z'),
        fechaFin: new Date('2024-07-05T17:00:00Z'),
        cupo: 50,
        socioComunitarioId: 2,
        proyectoId: 2,
        estado: 'Programada',
        creadoPorId: 2,
      },
      {
        nombre: 'Reunión de Coordinación',
        tipoActividadId: 3,
        periodicidad: 'Puntual',
        fechaInicio: new Date('2024-07-10T10:00:00Z'),
        fechaFin: null,
        cupo: null,
        socioComunitarioId: 3,
        proyectoId: null,
        estado: 'Cancelada',
        creadoPorId: 3,
      },
      {
        nombre: 'Evento Cultural',
        tipoActividadId: 4,
        periodicidad: 'Periódica',
        fechaInicio: new Date('2024-08-01T18:00:00Z'),
        fechaFin: new Date('2024-08-01T22:00:00Z'),
        cupo: 100,
        socioComunitarioId: 4,
        proyectoId: 4,
        estado: 'Programada',
        creadoPorId: 4,
      },
      {
        nombre: 'Curso de Arte',
        tipoActividadId: 5,
        periodicidad: 'Puntual',
        fechaInicio: new Date('2024-09-01T09:00:00Z'),
        fechaFin: new Date('2024-09-30T17:00:00Z'),
        cupo: 15,
        socioComunitarioId: 5,
        proyectoId: 5,
        estado: 'Programada',
        creadoPorId: 5,
      },
    ],
  });

  // Cita
  await prisma.cita.createMany({
    data: [
      {
        actividadId: 1,
        lugarId: 1,
        fecha: new Date('2024-07-01T09:00:00Z'),
        horaInicio: '09:00',
        horaFin: '12:00',
        estado: 'Programada',
        creadoPorId: 1,
      },
      {
        actividadId: 2,
        lugarId: 2,
        fecha: new Date('2024-07-05T15:00:00Z'),
        horaInicio: '15:00',
        horaFin: '17:00',
        estado: 'Programada',
        creadoPorId: 2,
      },
      {
        actividadId: 3,
        lugarId: 3,
        fecha: new Date('2024-07-10T10:00:00Z'),
        horaInicio: '10:00',
        horaFin: null,
        estado: 'Cancelada',
        motivoCancelacion: 'Reprogramación',
        creadoPorId: 3,
      },
      {
        actividadId: 4,
        lugarId: 5,
        fecha: new Date('2024-08-01T18:00:00Z'),
        horaInicio: '18:00',
        horaFin: '22:00',
        estado: 'Programada',
        creadoPorId: 4,
      },
      {
        actividadId: 5,
        lugarId: 1,
        fecha: new Date('2024-09-01T09:00:00Z'),
        horaInicio: '09:00',
        horaFin: '17:00',
        estado: 'Programada',
        creadoPorId: 5,
      },
    ],
  });

  // ActividadOferente
  await prisma.actividadOferente.createMany({
    data: [
      { actividadId: 1, oferenteId: 1 },
      { actividadId: 2, oferenteId: 2 },
      { actividadId: 3, oferenteId: 3 },
      { actividadId: 4, oferenteId: 5 },
      { actividadId: 5, oferenteId: 1 },
    ],
  });

  // ActividadBeneficiario
  await prisma.actividadBeneficiario.createMany({
    data: [
      { actividadId: 1, beneficiarioId: 1 },
      { actividadId: 2, beneficiarioId: 2 },
      { actividadId: 3, beneficiarioId: 3 },
      { actividadId: 4, beneficiarioId: 4 },
      { actividadId: 5, beneficiarioId: 5 },
    ],
  });

  // Beneficiario
  await prisma.beneficiario.createMany({
    data: [
      { caracterizacion: 'Joven estudiante', activo: true },
      { caracterizacion: 'Adulto mayor', activo: true },
      { caracterizacion: 'Madre cabeza de hogar', activo: false },
      { caracterizacion: 'Desempleado', activo: true },
      { caracterizacion: 'Estudiante universitario', activo: true },
    ],
  });

  // Archivo
  await prisma.archivo.createMany({
    data: [
      { nombre: 'Documento 1', ruta: '/files/doc1.pdf', tipo: 'pdf', tamano: 1200, actividadId: 1, tipoAdjunto: 'Manual', descripcion: 'Manual del taller', cargadoPorId: 1 },
      { nombre: 'Presentación 2', ruta: '/files/pres2.ppt', tipo: 'ppt', tamano: 3500, actividadId: 2, tipoAdjunto: 'Presentación', descripcion: 'Material charla salud', cargadoPorId: 2 },
      { nombre: 'Plan 3', ruta: '/files/plan3.docx', tipo: 'docx', tamano: 2200, actividadId: 3, tipoAdjunto: 'Planificación', descripcion: 'Plan reunión coordinación', cargadoPorId: 3 },
      { nombre: 'Flyer 4', ruta: '/files/flyer4.jpg', tipo: 'jpg', tamano: 800, actividadId: 4, tipoAdjunto: 'Publicidad', descripcion: 'Flyer evento cultural', cargadoPorId: 4 },
      { nombre: 'Guía 5', ruta: '/files/guia5.pdf', tipo: 'pdf', tamano: 1500, actividadId: 5, tipoAdjunto: 'Guía', descripcion: 'Guía curso de arte', cargadoPorId: 5 },
    ],
  });

  console.log('Seed completado!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
