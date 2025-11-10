import express from 'express';
import WorkoutCalendarController from '../controllers/WorkoutCalendarController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

const router = express.Router();

// Rotas do calendário de treinos
router.get('/monthly/:patientId/:year/:month', authenticateToken, checkPatientAccess('workout'), WorkoutCalendarController.getMonthlyProgress);
router.get('/day/:patientId/:date', authenticateToken, checkPatientAccess('workout'), WorkoutCalendarController.getDayDetails);

export default router;
