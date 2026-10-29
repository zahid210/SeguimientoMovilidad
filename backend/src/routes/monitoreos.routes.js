import { Router } from 'express';
import { obtenerMonitoreos, crearMonitoreo } from '../controllers/monitoreos.controller.js';

const router = Router();

// Obtener el historial de una movilidad (pasando el ID por la URL)
router.get('/:movilidad_id', obtenerMonitoreos);

// Crear un nuevo reporte
router.post('/', crearMonitoreo);

export default router;