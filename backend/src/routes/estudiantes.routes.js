import { Router } from 'express';
import { obtenerEstudiantes } from "../controllers/estudiantes.controller.js";
import { crearEstudiante } from "../controllers/estudiantes.controller.js";


const router = Router();

// Define ruta GET y ejecuta el controlador
router.get('/', obtenerEstudiantes);

// Define ruta POST
router.post('/', crearEstudiante);

export default router;