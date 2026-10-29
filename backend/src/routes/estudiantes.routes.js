import { Router } from 'express';
import {
    obtenerEstudiantes,
    obtenerEstudiante,
    crearEstudiante,
    actualizarEstudiante
} from '../controllers/estudiantes.controller.js';

const router = Router();

router.get('/', obtenerEstudiantes);
router.get('/:id', obtenerEstudiante);
router.post('/', crearEstudiante);
router.put('/:id', actualizarEstudiante);

export default router;
