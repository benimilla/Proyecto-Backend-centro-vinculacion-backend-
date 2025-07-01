import express from 'express'
import { generarReporteActividades } from '../controllers/reportes.controller.js'

const router = express.Router()

// GET /api/reportes/actividades?fechaInicio=2025-01-01&fechaFin=2025-01-31&tipo=1&lugar=2&oferente=3&formato=pdf
router.get('/actividades', generarReporteActividades)

export { router };
