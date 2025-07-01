import { prisma } from '../config/db.js';

// Función auxiliar para verificar conflictos de horario en citas (Movida al controlador de Citas)
// No es necesaria aquí en el controlador de Actividad

// Función auxiliar para generar citas periódicas según días entre fechas (Movida al controlador de Citas)
// No es necesaria aquí en el controlador de Actividad

// Crear actividad (SOLO CREA ACTIVIDAD, sin validación ni creación de citas aquí)
export async function create(req, res) {
  try {
    const {
      nombre,
      tipoActividadId,
      periodicidad,
      fechaInicio,
      // fechaFin ya no es un campo obligatorio directo de actividad en el frontend para este flujo,
      // pero se mantiene aquí si tu modelo de Actividad en Prisma aún lo espera.
      // Si solo es para citas periódicas, asegúrate de que sea `null` o `undefined` si no aplica.
      fechaFin, // Esto debe ser null si viene del frontend para puntual, o rango para periodica
      socioComunitarioId,
      proyectoId,
      cupo,
      // lugarId,       <--- ELIMINADO de aquí
      // horaInicio,    <--- ELIMINADO de aquí
      // horaFin,       <--- ELIMINADO de aquí
    } = req.body;

    // Validaciones básicas para la ACTIVIDAD
    const errores = {};
    if (!nombre) errores.nombre = 'El campo nombre es obligatorio';
    if (!tipoActividadId) errores.tipoActividadId = 'El campo tipoActividadId es obligatorio';
    if (!periodicidad) errores.periodicidad = 'El campo periodicidad es obligatorio';
    if (!fechaInicio) errores.fechaInicio = 'El campo fechaInicio es obligatorio'; // Esto será la fecha de la primera cita
    if (!socioComunitarioId) errores.socioComunitarioId = 'El campo socioComunitarioId es obligatorio';
    
    // Validaciones de fecha solo para la actividad, si aplica
    const inicio = new Date(fechaInicio);
    let finActividad = null;
    if (fechaFin) { // Solo si fechaFin se envía para la actividad
        finActividad = new Date(fechaFin);
        if (isNaN(finActividad)) errores.fechaFin = 'Fecha de fin inválida';
        if (finActividad < inicio) errores.fechaFin = 'La fecha de fin no puede ser menor que la de inicio';
    }
    if (isNaN(inicio)) errores.fechaInicio = 'Fecha de inicio inválida';

    if (Object.keys(errores).length > 0) {
      return res.status(400).json({ errores });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Crear la actividad
    const actividad = await prisma.actividad.create({
      data: {
        nombre,
        tipoActividadId,
        periodicidad,
        fechaInicio: inicio,
        fechaFin: finActividad, // Asegúrate de que esto se maneje correctamente, si es null o la fecha de la última cita
        socioComunitarioId,
        proyectoId: proyectoId || null,
        cupo: cupo ?? undefined,
        creadoPorId: req.user.userId,
        estado: 'Programada',
      },
    });

    // LA CREACIÓN DE CITAS SE MANEJA DESDE EL ENDPOINT /api/citas
    // ESTA LÓGICA HA SIDO ELIMINADA DE AQUÍ

    return res.status(201).json({ message: 'Actividad creada exitosamente', actividad });
  } catch (error) {
    console.error('Error al crear actividad:', error);
    return res.status(500).json({ error: 'Error al crear actividad', detalle: error.message });
  }
}

// Actualizar actividad
export async function update(req, res) {
  try {
    const { id } = req.params;
    if (isNaN(Number(id))) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const actividad = await prisma.actividad.findUnique({ where: { id: Number(id) } });
    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Validación de permisos
    if (!req.user || actividad.creadoPorId !== req.user.userId) {
      return res.status(403).json({ error: 'No tiene permisos para modificar esta actividad' });
    }

    // Validación de estado (CA-14)
    if (actividad.estado === 'Completada') {
      return res.status(400).json({ error: 'No se puede modificar una actividad completada' });
    }

    const {
      nombre,
      tipoActividadId,
      periodicidad,
      fechaInicio,
      fechaFin,
      socioComunitarioId,
      proyectoId,
      cupo,
      estado // Permite actualizar el estado de la actividad (no solo por cancelación)
    } = req.body;

    const dataToUpdate = {};
    if (nombre !== undefined) dataToUpdate.nombre = nombre;
    if (tipoActividadId !== undefined) dataToUpdate.tipoActividadId = tipoActividadId;
    if (periodicidad !== undefined) dataToUpdate.periodicidad = periodicidad;
    if (fechaInicio !== undefined) {
      const inicio = new Date(fechaInicio);
      if (isNaN(inicio)) return res.status(400).json({ error: 'Fecha de inicio inválida' });
      dataToUpdate.fechaInicio = inicio;
    }
    // Asegúrate de que fechaFin se maneje correctamente si se actualiza a null o un valor
    if (fechaFin !== undefined) {
      const fin = fechaFin ? new Date(fechaFin) : null; // Permite setear a null
      if (fechaFin && isNaN(fin)) return res.status(400).json({ error: 'Fecha de fin inválida' });
      dataToUpdate.fechaFin = fin;
    } else if ('fechaFin' in req.body && req.body.fechaFin === null) {
        dataToUpdate.fechaFin = null; // Para explícitamente setear a null
    }

    if (socioComunitarioId !== undefined) dataToUpdate.socioComunitarioId = socioComunitarioId;
    if (proyectoId !== undefined) dataToUpdate.proyectoId = proyectoId || null;
    if (cupo !== undefined) dataToUpdate.cupo = cupo;
    if (estado !== undefined) dataToUpdate.estado = estado; // Actualizar el estado

    const actividadActualizada = await prisma.actividad.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return res.json({ message: 'Actividad actualizada exitosamente', actividad: actividadActualizada });
  } catch (error) {
    console.error('Error al actualizar actividad:', error);
    return res.status(500).json({ error: 'No se pudo actualizar la actividad', detalle: error.message });
  }
}

// Cancelar actividad + cancelar todas sus citas
export async function cancel(req, res) {
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'Debe proporcionar un motivo para la cancelación' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const actividadId = Number(id);
    if (isNaN(actividadId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const actividad = await prisma.actividad.findUnique({
      where: { id: actividadId },
    });

    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    // Restricción: solo el creador puede cancelar o si tiene un rol específico para cancelar
    if (actividad.creadoPorId !== req.user.userId /* && !req.user.roles.includes('admin') */) {
        return res.status(403).json({ error: 'No tiene permisos para cancelar esta actividad' });
    }

    await prisma.actividad.update({
      where: { id: actividadId },
      data: { estado: 'Cancelada' },
    });

    // Actualizar el estado de las citas asociadas a "Cancelada"
    await prisma.cita.updateMany({
      where: { actividadId: actividadId },
      data: {
        estado: 'Cancelada',
        motivoCancelacion: motivo,
      },
    });

    return res.json({ message: 'Actividad y citas asociadas canceladas exitosamente' });
  } catch (error) {
    console.error('Error al cancelar actividad:', error);
    return res.status(500).json({ error: 'Error al cancelar actividad', detalle: error.message });
  }
}

// Obtener todas las actividades
export async function getAll(req, res) {
  try {
    const actividades = await prisma.actividad.findMany({
      orderBy: { fechaInicio: 'desc' },
      select: {
        id: true,
        nombre: true,
        tipoActividadId: true,
        periodicidad: true,
        fechaInicio: true,
        fechaFin: true,
        cupo: true,
        socioComunitarioId: true,
        proyectoId: true,
        estado: true,
        fechaCreacion: true,
        creadoPorId: true,
        // No incluyas citas o archivos directamente aquí si no los necesitas para el listado principal,
        // ya que la información se va a la tabla de Citas.
        // citas: { select: { id: true } },
        // archivos: { select: { id: true } },
      },
    });

    return res.json(actividades);
  } catch (error) {
    console.error('Error al obtener las actividades:', error);
    return res.status(500).json({ error: 'Error al obtener las actividades' });
  }
}

// Obtener actividad por ID
export async function getById(req, res) {
  try {
    const { id } = req.params;
    const actividad = await prisma.actividad.findUnique({
      where: { id: Number(id) },
      // Puedes incluir citas o archivos aquí si los necesitas al obtener una sola actividad
      // include: {
      //   citas: { select: { id: true } },
      //   archivos: { select: { id: true } },
      // },
    });

    if (!actividad) {
      return res.status(404).json({ error: 'Actividad no encontrada' });
    }

    return res.json(actividad);
  } catch (error) {
    console.error('Error al obtener actividad:', error);
    return res.status(500).json({ error: 'Error al obtener actividad' });
  }
}

// Eliminar actividad
export async function remove(req, res) {
  try {
    const { id } = req.params;
    
    // Opcional: Verificar permisos para eliminar
    const actividad = await prisma.actividad.findUnique({ where: { id: Number(id) } });
    if (!actividad) {
        return res.status(404).json({ error: 'Actividad no encontrada' });
    }
    if (!req.user || actividad.creadoPorId !== req.user.userId) {
        return res.status(403).json({ error: 'No tiene permisos para eliminar esta actividad' });
    }

    // Opcional: Eliminar citas asociadas primero si la relación en Prisma no es CASCADE DELETE
    await prisma.cita.deleteMany({
      where: { actividadId: Number(id) },
    });

    await prisma.actividad.delete({ where: { id: Number(id) } });
    return res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar actividad:', error);
    // Verificar si el error es por restricción de clave foránea
    if (error.code === 'P2003') { // Prisma Client error code for Foreign Key constraint failed
      return res.status(409).json({ error: 'No se puede eliminar la actividad porque tiene citas asociadas. Por favor, elimine o cancele las citas primero.' });
    }
    return res.status(500).json({ error: 'Error al eliminar actividad', detalle: error.message });
  }
}

// --- CÓDIGO DEL CONTROLADOR DE CITAS ---
// Este es el controlador para /api/citas
// Asegúrate de que este código esté en su propio archivo (ej. controllers/citas.js)

export async function createCita(req, res) { // Renombrada para evitar conflicto si se importan ambos 'create'
  try {
    const {
      actividadId,
      lugarId,
      fecha, // Esto es `fecha_unica_cita` o `fechaInicioPeriodica` del frontend
      horaInicio,
      horaFin,
      // Estos campos adicionales vienen para la lógica de periódicas
      periodicidadTipo, // Para distinguir entre Puntual y Periódica
      fechaInicioPeriodica, // Solo para periódicas
      fechaFinPeriodica, // Solo para periódicas
    } = req.body;

    // Validaciones básicas para CITA
    if (!actividadId || !lugarId || !fecha || !horaInicio || !horaFin) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para la cita: actividadId, lugarId, fecha, horaInicio, horaFin' });
    }

    const fechaCita = new Date(fecha);
    if (isNaN(fechaCita.getTime())) { // Usar getTime() para verificar validez
      return res.status(400).json({ error: 'Fecha inválida para la cita' });
    }

    if (horaInicio >= horaFin) {
      return res.status(400).json({ error: 'La hora de inicio de la cita debe ser menor que la de fin' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Verificar que la actividad exista antes de crear citas
    const actividadExistente = await prisma.actividad.findUnique({
      where: { id: actividadId }
    });
    if (!actividadExistente) {
      return res.status(404).json({ error: 'Actividad asociada no encontrada' });
    }


    if (periodicidadTipo === 'Puntual') {
      // Verificar conflicto para cita puntual
      const conflicto = await verificarConflictoCita(lugarId, fechaCita, horaInicio, horaFin);
      if (conflicto) {
        return res.status(409).json({ error: conflicto });
      }

      const cita = await prisma.cita.create({
        data: {
          actividadId,
          lugarId,
          fecha: fechaCita,
          horaInicio,
          horaFin,
          estado: 'Programada',
          creadoPorId: req.user.userId,
        },
      });
      return res.status(201).json({ message: 'Cita puntual creada exitosamente', cita });

    } else if (periodicidadTipo === 'Periódica') {
      if (!fechaInicioPeriodica || !fechaFinPeriodica) {
        return res.status(400).json({ error: 'Debe proporcionar fechaInicioPeriodica y fechaFinPeriodica para citas periódicas' });
      }

      const inicioPeriodica = new Date(fechaInicioPeriodica);
      const finPeriodica = new Date(fechaFinPeriodica);

      if (isNaN(inicioPeriodica.getTime()) || isNaN(finPeriodica.getTime())) {
          return res.status(400).json({ error: 'Fechas de rango inválidas para citas periódicas' });
      }
      if (inicioPeriodica > finPeriodica) {
        return res.status(400).json({ error: 'La fecha de inicio periódica no puede ser mayor que la fecha de fin periódica' });
      }

      const citasAcrear = [];
      let currentDate = new Date(inicioPeriodica); // Clonar la fecha para no modificar el original en el bucle

      while (currentDate <= finPeriodica) {
        // Verificar conflicto para cada día de la periodicidad
        const conflicto = await verificarConflictoCita(lugarId, currentDate, horaInicio, horaFin);
        if (conflicto) {
          // Si hay conflicto, puedes decidir abortar toda la operación o retornar el error
          return res.status(409).json({ error: conflicto + ` (Fecha: ${currentDate.toISOString().split('T')[0]})` });
        }

        citasAcrear.push({
          actividadId,
          lugarId,
          fecha: new Date(currentDate), // Crea una nueva instancia de fecha para cada cita
          horaInicio,
          horaFin,
          estado: 'Programada',
          creadoPorId: req.user.userId,
        });

        currentDate.setDate(currentDate.getDate() + 1); // Avanza al siguiente día
      }

      if (citasAcrear.length > 0) {
        await prisma.cita.createMany({ data: citasAcrear });
      }
      return res.status(201).json({ message: `Se crearon ${citasAcrear.length} citas periódicas exitosamente` });

    } else {
      return res.status(400).json({ error: 'Tipo de periodicidad de cita no reconocido' });
    }

  } catch (error) {
    console.error('Error al crear cita(s):', error);
    return res.status(500).json({ error: 'Error al crear cita(s)', detalle: error.message });
  }
}


// FUNCIONES AUXILIARES DE CITA (pueden estar en el mismo archivo del controlador de Cita)
// Verificar conflicto de horario para cita puntual
async function verificarConflictoCita(lugarId, fecha, horaInicio, horaFin, citaId = null) {
  // Asegúrate de que las fechas sean objetos Date válidos
  const searchDate = new Date(fecha);
  searchDate.setHours(0, 0, 0, 0); // Normalizar a inicio del día

  const conflicto = await prisma.cita.findFirst({
    where: {
      lugarId,
      fecha: searchDate, // Compara solo la fecha (día)
      OR: [
        // La nueva cita empieza antes de que la existente termine Y la nueva cita termina después de que la existente empieza
        {
          horaInicio: { lt: horaFin }, // nueva_inicio < existente_fin
          horaFin: { gt: horaInicio }, // nueva_fin > existente_inicio
        },
      ],
      estado: { not: 'Cancelada' }, // No considerar citas canceladas para conflictos
      NOT: citaId ? { id: citaId } : undefined, // Excluir la propia cita si se está actualizando
    },
  });

  if (conflicto) {
    return `El lugar ya está ocupado el ${fecha.toISOString().split('T')[0]} de ${conflicto.horaInicio} a ${conflicto.horaFin}`;
  }
  return null;
}


// Obtener todas las citas
export async function getAllCitas(req, res) { // Renombrada para evitar conflicto si se importan ambos 'getAll'
  try {
    const citas = await prisma.cita.findMany({
      include: {
        actividad: true,
        lugar: true,
        creadoPor: true,
      },
      orderBy: { fecha: 'asc' },
    });
    return res.json(citas);
  } catch (error) {
    console.error('Error al obtener citas:', error);
    return res.status(500).json({ error: 'Error al obtener citas' });
  }
}

// Obtener cita por ID
export async function getByIdCita(req, res) { // Renombrada
  try {
    const { id } = req.params;
    const cita = await prisma.cita.findUnique({
      where: { id: Number(id) },
      include: {
        actividad: true,
        lugar: true,
        creadoPor: true,
      },
    });

    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    return res.json(cita);
  } catch (error) {
    console.error('Error al obtener cita:', error);
    return res.status(500).json({ error: 'Error al obtener cita' });
  }
}

// Actualizar cita
export async function updateCita(req, res) { // Renombrada
  try {
    const { id } = req.params;
    const {
      lugarId,
      fecha,
      horaInicio,
      horaFin,
      estado,
      motivoCancelacion,
    } = req.body;

    const citaExistente = await prisma.cita.findUnique({ where: { id: Number(id) } });
    if (!citaExistente) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Permitir que solo el creador o un rol autorizado actualice la cita
    if (citaExistente.creadoPorId !== req.user.userId /* && !req.user.roles.includes('admin') */) {
      return res.status(403).json({ error: 'No tiene permisos para modificar esta cita' });
    }

    // Validaciones
    let fechaCita = fecha ? new Date(fecha) : citaExistente.fecha;
    if (fecha && isNaN(fechaCita.getTime())) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    let actualHoraInicio = horaInicio || citaExistente.horaInicio;
    let actualHoraFin = horaFin || citaExistente.horaFin;

    if (actualHoraInicio >= actualHoraFin) {
      return res.status(400).json({ error: 'La hora de inicio debe ser menor que la de fin' });
    }

    // Verificar conflicto solo si cambian lugar o fecha o horas
    const updatedLugarId = lugarId !== undefined ? lugarId : citaExistente.lugarId;

    if (
      (lugarId !== undefined && lugarId !== citaExistente.lugarId) ||
      (fecha !== undefined && fechaCita.getTime() !== citaExistente.fecha.getTime()) ||
      (horaInicio !== undefined && horaInicio !== citaExistente.horaInicio) ||
      (horaFin !== undefined && horaFin !== citaExistente.horaFin)
    ) {
      const conflicto = await verificarConflictoCita(
        updatedLugarId,
        fechaCita,
        actualHoraInicio,
        actualHoraFin,
        citaExistente.id // Excluir la cita actual del conflicto
      );
      if (conflicto) {
        return res.status(409).json({ error: conflicto });
      }
    }

    const dataToUpdate = {};
    if (lugarId !== undefined) dataToUpdate.lugarId = Number(lugarId); // Asegurar que sea número
    if (fecha !== undefined) dataToUpdate.fecha = fechaCita;
    if (horaInicio !== undefined) dataToUpdate.horaInicio = horaInicio;
    if (horaFin !== undefined) dataToUpdate.horaFin = horaFin;
    if (estado !== undefined) dataToUpdate.estado = estado;
    if (motivoCancelacion !== undefined) dataToUpdate.motivoCancelacion = motivoCancelacion;

    const citaActualizada = await prisma.cita.update({
      where: { id: Number(id) },
      data: dataToUpdate,
    });

    return res.json({ message: 'Cita actualizada exitosamente', cita: citaActualizada });
  } catch (error) {
    console.error('Error al actualizar cita:', error);
    return res.status(500).json({ error: 'No se pudo actualizar la cita', detalle: error.message });
  }
}

// Cancelar cita (motivo obligatorio)
export async function cancelCita(req, res) { // Renombrada
  try {
    const { id } = req.params;
    const { motivo } = req.body;

    if (!motivo || motivo.trim() === '') {
      return res.status(400).json({ error: 'Debe proporcionar un motivo para la cancelación' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    const citaId = Number(id);
    if (isNaN(citaId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    const cita = await prisma.cita.findUnique({ where: { id: citaId } });
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    // Permitir que solo el creador o un rol autorizado cancele la cita
    if (cita.creadoPorId !== req.user.userId /* && !req.user.roles.includes('admin') */) {
      return res.status(403).json({ error: 'No tiene permisos para cancelar esta cita' });
    }

    await prisma.cita.update({
      where: { id: citaId },
      data: { estado: 'Cancelada', motivoCancelacion: motivo },
    });

    return res.json({ message: 'Cita cancelada exitosamente' });
  } catch (error) {
    console.error('Error al cancelar cita:', error);
    return res.status(500).json({ error: 'Error al cancelar cita', detalle: error.message });
  }
}

// Eliminar cita
export async function removeCita(req, res) { // Renombrada
  try {
    const { id } = req.params;

    const cita = await prisma.cita.findUnique({ where: { id: Number(id) } });
    if (!cita) {
      return res.status(404).json({ error: 'Cita no encontrada' });
    }

    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Permitir que solo el creador o un rol autorizado elimine la cita
    if (cita.creadoPorId !== req.user.userId /* && !req.user.roles.includes('admin') */) {
      return res.status(403).json({ error: 'No tiene permisos para eliminar esta cita' });
    }

    await prisma.cita.delete({ where: { id: Number(id) } });
    return res.status(204).end();
  } catch (error) {
    console.error('Error al eliminar cita:', error);
    return res.status(500).json({ error: 'Error al eliminar cita' });
  }
}