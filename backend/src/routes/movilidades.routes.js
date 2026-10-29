import { Router } from 'express';
import { obtenerMovilidades, crearMovilidad } from '../controllers/movilidades.controller.js';

const router = Router();

router.get('/', obtenerMovilidades);
router.post('/', crearMovilidad);

export default router;