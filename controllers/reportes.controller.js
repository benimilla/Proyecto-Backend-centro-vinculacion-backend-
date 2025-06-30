import PDFDocument from 'pdfkit'
import ExcelJS from 'exceljs'
import { format } from 'date-fns'
import { prisma } from '../config/db.js'
import { Readable } from 'stream'
import { format as formatCsv } from 'fast-csv'

export async function generarReporteActividades(req, res) {
  const { fechaInicio, fechaFin, tipo, formato = 'pdf' } = req.query

  try {
    const actividades = await prisma.cita.findMany({
      where: {
        fecha: {
          gte: new Date(fechaInicio),
          lte: new Date(fechaFin)
        },
        actividad: tipo ? { tipoActividadId: tipo } : undefined
      },
      include: {
        actividad: {
          include: {
            lugar: true,
            oferente: true
          }
        }
      }
    })

    const data = actividades.map(cita => ({
      titulo: cita.actividad.nombre,
      tipo: cita.actividad.tipo,
      lugar: cita.actividad.lugar?.nombre || 'N/A',
      oferente: cita.actividad.oferente?.nombre || 'N/A',
      fecha: format(new Date(cita.fecha), 'yyyy-MM-dd'),
      horaInicio: cita.horaInicio,
      horaFin: cita.horaFin
    }))

    if (formato === 'pdf') return generarPDF(data, res)
    if (formato === 'xlsx') return generarExcel(data, res)
    if (formato === 'csv') return generarCSV(data, res)

    return res.status(400).send('Formato no soportado')
  } catch (err) {
    console.error('Error al generar el reporte:', err)
    res.status(500).send('Error generando reporte')
  }
}

// ------------------------- PDF -------------------------
function generarPDF(data, res) {
  const doc = new PDFDocument()
  res.setHeader('Content-Disposition', 'attachment; filename="reporte_actividades.pdf"')
  res.setHeader('Content-Type', 'application/pdf')
  doc.pipe(res)

  doc.fontSize(18).text('Reporte de Actividades', { align: 'center' })
  doc.moveDown()

  data.forEach((item) => {
    doc.fontSize(12).text(`• ${item.fecha} - ${item.titulo}`)
    doc.text(`  Tipo: ${item.tipo} | Lugar: ${item.lugar} | Oferente: ${item.oferente}`)
    doc.text(`  Hora: ${item.horaInicio} - ${item.horaFin || 'N/A'}`)
    doc.moveDown()
  })

  doc.end()
}

// ------------------------- Excel -------------------------
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

  res.setHeader('Content-Disposition', 'attachment; filename="reporte_actividades.xlsx"')
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

  workbook.xlsx.write(res).then(() => res.end())
}

// ------------------------- CSV -------------------------
function generarCSV(data, res) {
  res.setHeader('Content-Disposition', 'attachment; filename="reporte_actividades.csv"')
  res.setHeader('Content-Type', 'text/csv')

  const csvStream = formatCsv({ headers: true })
  const readable = Readable.from(data)
  readable.pipe(csvStream).pipe(res)
}