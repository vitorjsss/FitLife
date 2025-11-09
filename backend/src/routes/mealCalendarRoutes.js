import express from 'express';
import MealCalendarController from '../controllers/MealCalendarController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas do calendário de refeições
router.get('/monthly/:patientId/:year/:month', authenticateToken, MealCalendarController.getMonthlyProgress);
router.get('/day/:patientId/:date', authenticateToken, MealCalendarController.getDayDetails);

export default router;
