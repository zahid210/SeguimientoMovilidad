import { Router } from 'express';
import {
    obtenerMovilidades,
    obtenerMovilidadPorId,
    crearMovilidad,
    actualizarMovilidad,
    eliminarMovilidad,
    exportarMovilidades
} from '../controllers/movilidades.controller.js';

const router = Router();

// Importante: /export debe ir antes de /:id
router.get('/export', exportarMovilidades);

router.get('/', obtenerMovilidades);
router.get('/:id', obtenerMovilidadPorId);
router.post('/', crearMovilidad);
router.patch('/:id', actualizarMovilidad);
router.delete('/:id', eliminarMovilidad);

export default router;
