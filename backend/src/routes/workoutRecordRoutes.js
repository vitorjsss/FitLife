import express from 'express';
import WorkoutRecordController from '../controllers/WorkoutRecordController.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Rotas de WorkoutRecord
router.get('/date/:date/patient/:patientId', authenticateToken, WorkoutRecordController.getByDateAndPatient);
router.get('/:id', authenticateToken, WorkoutRecordController.getById);
router.post('/', authenticateToken, WorkoutRecordController.create);
router.put('/:id', authenticateToken, WorkoutRecordController.update);
router.delete('/:id', authenticateToken, WorkoutRecordController.delete);

// Rotas de items
router.post('/:id/items', authenticateToken, WorkoutRecordController.addItem);
router.put('/:workoutId/items/:itemId', authenticateToken, WorkoutRecordController.updateItem);
router.delete('/:workoutId/items/:itemId', authenticateToken, WorkoutRecordController.deleteItem);

export default router;
