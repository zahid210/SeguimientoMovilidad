import { Router } from 'express';
import {
    obtenerMonitoreos,
    crearMonitoreo,
    eliminarMonitoreo
} from '../controllers/monitoreos.controller.js';

const router = Router();

router.get('/:movilidad_id', obtenerMonitoreos);
router.post('/', crearMonitoreo);
router.delete('/:movilidad_id/:id', eliminarMonitoreo);

export default router;
