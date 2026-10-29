import { Router } from 'express';
import { subirDocumento, obtenerDocumentosPorMovilidad } from '../controllers/documentos.controller.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Endpoint para ver los documentos de un viaje específico
router.get('/:id', obtenerDocumentosPorMovilidad);

// Endpoint para subir un archivo. El middleware "upload.single('archivo')" intercepta el PDF.
router.post('/', upload.single('archivo'), subirDocumento);

export default router;