import express from 'express'
import { generarReporteActividades } from '../controllers/reportes.controller.js'

const router = express.Router()

router.get('/actividades', generarReporteActividades)

export default router