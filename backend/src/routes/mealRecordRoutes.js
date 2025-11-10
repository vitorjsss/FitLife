import express from 'express';
import MealRecordController from '../controllers/MealRecordController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { checkPatientAccess } from '../middlewares/patientAccessMiddleware.js';

const router = express.Router();

// Rotas de MealRecord
router.get('/date/:date/patient/:patientId', authenticateToken, checkPatientAccess('meal'), MealRecordController.getByDateAndPatient);
router.get('/:id', authenticateToken, MealRecordController.getById);
router.post('/', authenticateToken, MealRecordController.create);
router.put('/:id', authenticateToken, MealRecordController.update);
router.delete('/:id', authenticateToken, MealRecordController.delete);

// Rotas de items
router.post('/:id/items', authenticateToken, MealRecordController.addItem);
router.put('/:mealId/items/:itemId', authenticateToken, MealRecordController.updateItem);
router.delete('/:mealId/items/:itemId', authenticateToken, MealRecordController.deleteItem);

export default router;
