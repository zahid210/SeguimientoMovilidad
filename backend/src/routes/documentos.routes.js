import { Router } from 'express';
import {
    subirDocumento,
    obtenerDocumentosPorMovilidad,
    resetDocumento
} from '../controllers/documentos.controller.js';
import { upload } from '../middlewares/upload.middleware.js';

const router = Router();

// Checklist completo (incluye documentos pendientes)
router.get('/:movilidad_id', obtenerDocumentosPorMovilidad);

// Subir o reemplazar un PDF
router.post('/', upload.single('archivo'), subirDocumento);

// Quitar un documento y dejarlo pendiente
router.delete('/:movilidad_id/:tipo_documento', resetDocumento);

export default router;
