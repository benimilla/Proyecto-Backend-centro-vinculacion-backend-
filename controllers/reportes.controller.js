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
    lugarId,
    oferenteId,
    formato = 'pdf'
  } = req.query

  try {
    // Construyo filtros dinámicos
    const where = {
      fecha: {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin)
      }
    }

    if (tipo) {
      where.actividad = { tipoActividadId: Number(tipo) }
    }
    if (lugarId) {
      where.lugarId = Number(lugarId)
    }
    if (oferenteId) {
      // Añado filtro de oferente sobre la relación actividad.actividadesOferentes
      where.actividad = where.actividad || {}
      where.actividad.actividadesOferentes = {
        some: { oferenteId: Number(oferenteId) }
      }
    }

    // Consulto en base de datos
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

    // Mapeo al formato plano
    const data = citas.map(cita => ({
      fecha:      format(new Date(cita.fecha), 'yyyy-MM-dd'),
      titulo:     cita.actividad.nombre,
      tipo:       cita.actividad.tipoActividad?.nombre || 'N/A',
      lugar:      cita.lugar?.nombre || 'N/A',
      oferente:   cita.actividad.actividadesOferentes?.[0]?.oferente?.nombre || 'N/A',
      horaInicio: cita.horaInicio,
      horaFin:    cita.horaFin || 'N/A'
    }))

    // Preparo nombre de archivo con filtros
    const partes = [
      `del_${fechaInicio}_al_${fechaFin}`,
      tipo       ? `tipo-${tipo}`       : null,
      lugarId    ? `lugar-${lugarId}`    : null,
      oferenteId ? `oferente-${oferenteId}` : null
    ].filter(Boolean)
    const filenameBase = `reporte_actividades_${partes.join('_')}`

    // JSON
    if (formato === 'json') {
      return res.json(data)
    }

    // PDF
    if (formato === 'pdf') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filenameBase}.pdf"`
      )
      res.setHeader('Content-Type', 'application/pdf')
      return generarPDF(data, res)
    }

    // XLSX
    if (formato === 'xlsx') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filenameBase}.xlsx"`
      )
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      )
      return generarExcel(data, res)
    }

    // CSV
    if (formato === 'csv') {
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${filenameBase}.csv"`
      )
      res.setHeader('Content-Type', 'text/csv')
      return generarCSV(data, res)
    }

    // Formato no soportado
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
  const readable  = Readable.from(data)
  readable.pipe(csvStream).pipe(res)
}