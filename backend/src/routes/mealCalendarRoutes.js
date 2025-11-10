import express from 'express';
import MealCalendarController from '../controllers/MealCalendarController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

const router = express.Router();

// Rotas do calendário de refeições
router.get('/monthly/:patientId/:year/:month', authenticateToken, checkPatientAccess('meal'), MealCalendarController.getMonthlyProgress);
router.get('/day/:patientId/:date', authenticateToken, checkPatientAccess('meal'), MealCalendarController.getDayDetails);

export default router;
