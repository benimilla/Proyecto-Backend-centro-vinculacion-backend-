import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { prisma } from '../config/db.js'
import { Readable } from 'stream'
import { format as formatCsv } from 'fast-csv'

export async function generarReporteActividades(req, res) {
  const { fechaInicio, fechaFin, tipo, lugar, oferente, formato = 'pdf' } = req.query

  if (!fechaInicio || !fechaFin) {
    return res.status(400).send('Debe proporcionar fechaInicio y fechaFin')
  }

  try {
    const actividades = await prisma.cita.findMany({
      where: {
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin),
        },
        lugarId: lugar ? Number(lugar) : undefined,
        actividad: {
          tipoActividadId: tipo ? Number(tipo) : undefined,
          actividadesOferentes: oferente ? {
            some: {
              oferenteId: Number(oferente),
            }
          } : undefined,
        },
      },
      include: {
        actividad: {
          include: {
            tipoActividad: true,
            actividadesOferentes: {
              include: {
                oferente: true,
              }
            }
          }
        },
        lugar: true,
      }
    })

    // Preparar datos
    const data = actividades.map(cita => {
      const oferentes = cita.actividad.actividadesOferentes.map(ao => ao.oferente.nombre).join(', ')
      return {
        titulo: cita.actividad.nombre,
        tipo: cita.actividad.tipoActividad?.nombre || 'N/A',
        lugar: cita.lugar?.nombre || 'N/A',
        oferente: oferentes || 'N/A',
        fecha: format(new Date(cita.fecha), 'yyyy-MM-dd'),
        horaInicio: cita.horaInicio,
        horaFin: cita.horaFin || 'N/A',
      }
    })

    // Nombre dinámico del archivo con filtros
    let nombreArchivo = `reporte_actividades_${fechaInicio}_a_${fechaFin}`
    if (tipo) nombreArchivo += `_tipo_${tipo}`
    if (lugar) nombreArchivo += `_lugar_${lugar}`
    if (oferente) nombreArchivo += `_oferente_${oferente}`

    if (formato === 'pdf') return generarPDF(data, res, nombreArchivo + '.pdf')
    if (formato === 'xlsx') return generarExcel(data, res, nombreArchivo + '.xlsx')
    if (formato === 'csv') return generarCSV(data, res, nombreArchivo + '.csv')

    return res.status(400).send('Formato no soportado')
  } catch (err) {
    console.error('Error al generar el reporte:', err)
    res.status(500).send('Error generando reporte')
  }
}

// ------------------------- PDF -------------------------
function generarPDF(data, res, nombreArchivo) {
  const doc = new PDFDocument()
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`)
  res.setHeader('Content-Type', 'application/pdf')
  doc.pipe(res)

  doc.fontSize(18).text('Reporte de Actividades', { align: 'center' })
  doc.moveDown()

  data.forEach((item) => {
    doc.fontSize(12).text(`• ${item.fecha} - ${item.titulo}`)
    doc.text(`  Tipo: ${item.tipo} | Lugar: ${item.lugar} | Oferente: ${item.oferente}`)
    doc.text(`  Hora: ${item.horaInicio} - ${item.horaFin}`)
    doc.moveDown()
  })

  doc.end()
}

// ------------------------- Excel -------------------------
function generarExcel(data, res, nombreArchivo) {
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

  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`)
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

  workbook.xlsx.write(res).then(() => res.end())
}

// ------------------------- CSV -------------------------
function generarCSV(data, res, nombreArchivo) {
  res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`)
  res.setHeader('Content-Type', 'text/csv')

  const csvStream = formatCsv({ headers: true })
  const readable = Readable.from(data)
  readable.pipe(csvStream).pipe(res)
}
