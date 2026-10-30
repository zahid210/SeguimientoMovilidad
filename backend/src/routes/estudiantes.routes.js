import { Router } from 'express';
import {
    obtenerEstudiantes,
    obtenerEstudiante,
    crearEstudiante,
    actualizarEstudiante,
    eliminarEstudiante
} from '../controllers/estudiantes.controller.js';

const router = Router();

router.get('/', obtenerEstudiantes);
router.get('/:id', obtenerEstudiante);
router.post('/', crearEstudiante);
router.put('/:id', actualizarEstudiante);
router.delete('/:id', eliminarEstudiante);

export default router;
