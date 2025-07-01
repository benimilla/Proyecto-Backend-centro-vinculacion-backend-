import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { prisma } from '../config/db.js'
import { Readable } from 'stream'
import { format as formatCsv } from 'fast-csv'

export async function generarReporteActividades(req, res) {
  const {
    fechaInicio,
    fechaFin,
    tipo,
    lugar,
    oferente,
    formato = 'pdf'
  } = req.query

  try {
    // Validación mínima de fechas
    if (!fechaInicio || !fechaFin) {
      return res.status(400).send('Se requieren fechaInicio y fechaFin')
    }

    // Filtro base por fecha
    const where = {
      fecha: {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    }

    // Filtro por tipo de actividad (por nombre)
    if (tipo) {
      where.actividad = {
        ...(where.actividad || {}),
        tipoActividad: {
          nombre: { equals: tipo }
        }
      }
    }

    // Filtro por lugar (por nombre)
    if (lugar) {
      where.lugar = {
        nombre: { equals: lugar }
      }
    }

    // Filtro por oferente (por nombre)
    if (oferente) {
      where.actividad = {
        ...(where.actividad || {}),
        actividadesOferentes: {
          some: {
            oferente: {
              nombre: { equals: oferente }
            }
          }
        }
      }
    }

    // Consulta con relaciones necesarias
    const citas = await prisma.cita.findMany({
      where,
      include: {
        lugar: true,
        actividad: {
          include: {
            tipoActividad: true,
            actividadesOferentes: {
              include: { oferente: true }
            }
          }
        }
      }
    })

    // Formato plano para exportación
    const data = citas.map(cita => ({
      fecha:      format(new Date(cita.fecha), 'yyyy-MM-dd'),
      titulo:     cita.actividad.nombre,
      tipo:       cita.actividad.tipoActividad?.nombre || 'N/A',
      lugar:      cita.lugar?.nombre || 'N/A',
      oferente:   cita.actividad.actividadesOferentes?.[0]?.oferente?.nombre || 'N/A',
      horaInicio: cita.horaInicio,
      horaFin:    cita.horaFin || 'N/A'
    }))

    // Nombre base del archivo
    const partes = [
      `del_${fechaInicio}_al_${fechaFin}`,
      tipo     ? `tipo-${tipo}`       : null,
      lugar    ? `lugar-${lugar}`     : null,
      oferente ? `oferente-${oferente}` : null
    ].filter(Boolean)
    const filenameBase = `reporte_actividades_${partes.join('_')}`

    // Exportación en el formato solicitado
    if (formato === 'json') {
      return res.json(data)
    }

    if (formato === 'pdf') {
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.pdf"`)
      res.setHeader('Content-Type', 'application/pdf')
      return generarPDF(data, res)
    }

    if (formato === 'xlsx') {
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.xlsx"`)
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      return generarExcel(data, res)
    }

    if (formato === 'csv') {
      res.setHeader('Content-Disposition', `attachment; filename="${filenameBase}.csv"`)
      res.setHeader('Content-Type', 'text/csv')
      return generarCSV(data, res)
    }

    return res.status(400).send('Formato no soportado')
  } catch (err) {
    console.error('Error al generar el reporte:', err)
    return res.status(500).send('Error generando reporte')
  }
}

// ------------------------- Generadores de archivos -------------------------

function generarPDF(data, res) {
  const doc = new PDFDocument()
  doc.pipe(res)
  doc.fontSize(18).text('Reporte de Actividades', { align: 'center' })
  doc.moveDown()
  data.forEach(item => {
    doc.fontSize(12).text(`• ${item.fecha} – ${item.titulo}`)
    doc.text(`  Tipo: ${item.tipo} | Lugar: ${item.lugar} | Oferente: ${item.oferente}`)
    doc.text(`  Hora: ${item.horaInicio} – ${item.horaFin}`)
    doc.moveDown()
  })
  doc.end()
}

function generarExcel(data, res) {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Actividades')
  sheet.columns = [
    { header: 'Fecha', key: 'fecha', width: 12 },
    { header: 'Título', key: 'titulo', width: 30 },
    { header: 'Tipo', key: 'tipo', width: 15 },
    { header: 'Lugar', key: 'lugar', width: 20 },
    { header: 'Oferente', key: 'oferente', width: 20 },
    { header: 'Inicio', key: 'horaInicio', width: 10 },
    { header: 'Fin', key: 'horaFin', width: 10 }
  ]
  sheet.addRows(data)
  workbook.xlsx.write(res).then(() => res.end())
}

function generarCSV(data, res) {
  const csvStream = formatCsv({ headers: true })
  const readable = Readable.from(data)
  readable.pipe(csvStream).pipe(res)
}