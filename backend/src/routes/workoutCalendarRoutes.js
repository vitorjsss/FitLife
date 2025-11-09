import express from 'express';
import WorkoutCalendarController from '../controllers/WorkoutCalendarController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas do calendário de treinos
router.get('/monthly/:patientId/:year/:month', authenticateToken, WorkoutCalendarController.getMonthlyProgress);
router.get('/day/:patientId/:date', authenticateToken, WorkoutCalendarController.getDayDetails);

export default router;
